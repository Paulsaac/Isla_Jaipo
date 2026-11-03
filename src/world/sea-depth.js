import { SEA_FLOOR_HEIGHT } from '../config.js';

// Desembocaduras indicadas por AxByZ; coordenadas de mapa y fondo en metros.
const riverMouths = [
    {x:311,z:296,radiusX:18,radiusZ:14,bottom:-5.5}, // Entrada occidental del lago.
    {x:30,z:197,radiusX:18,radiusZ:14,bottom:-5.5}, // Salida occidental al mar.
    {x:467,z:334,radiusX:14,radiusZ:18,bottom:-5.5} // Salida sudoriental al mar.
];

// Distancia aproximada euclídea en dos pasadas, calculada solo al construir el mapa.
function distanceField(seeds,width,height) {
    const d=new Float32Array(width*height);
    for(let i=0;i<d.length;i++)d[i]=seeds[i]?0:Infinity;
    const diagonal=Math.SQRT2;
    for(let z=0;z<height;z++)for(let x=0;x<width;x++) {
        const i=z*width+x;
        if(x>0)d[i]=Math.min(d[i],d[i-1]+1);
        if(z>0){
            d[i]=Math.min(d[i],d[i-width]+1);
            if(x>0)d[i]=Math.min(d[i],d[i-width-1]+diagonal);
            if(x+1<width)d[i]=Math.min(d[i],d[i-width+1]+diagonal);
        }
    }
    for(let z=height-1;z>=0;z--)for(let x=width-1;x>=0;x--) {
        const i=z*width+x;
        if(x+1<width)d[i]=Math.min(d[i],d[i+1]+1);
        if(z+1<height){
            d[i]=Math.min(d[i],d[i+width]+1);
            if(x>0)d[i]=Math.min(d[i],d[i+width-1]+diagonal);
            if(x+1<width)d[i]=Math.min(d[i],d[i+width+1]+diagonal);
        }
    }
    return d;
}

export function createSeaFloorHeights(floorMap,waterDeckMap,width,height) {
    const shore=new Uint8Array(width*height),river=new Uint8Array(width*height);
    for(let z=0;z<height;z++)for(let x=0;x<width;x++) {
        const type=waterDeckMap[z][x] || floorMap[z][x];
        const water=['WATER','WATER_ROCK','BOAT'].includes(type);
        shore[z*width+x]=water?0:1;
        river[z*width+x]=type==='WATER_ROCK'?1:0;
    }
    const coastDistance=distanceField(shore,width,height);
    const riverDistance=distanceField(river,width,height);
    const smooth = value => {const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
    return Array.from({length:height},(_,z)=>Float32Array.from({length:width},(_,x)=>{
        const i=z*width+x;
        const coastal=-0.5+(SEA_FLOOR_HEIGHT+0.5)*smooth((coastDistance[i]-1)/12);
        const mouth=-2.5+(SEA_FLOOR_HEIGHT+2.5)*smooth((riverDistance[i]-1)/10);
        const base=Math.max(coastal,mouth);
        const type=waterDeckMap[z][x] || floorMap[z][x];
        if(!['WATER','WATER_ROCK','BOAT'].includes(type))return base;
        let depth=base;
        for(const riverMouth of riverMouths) {
            const dx=(x-riverMouth.x)/riverMouth.radiusX,dz=(z-riverMouth.z)/riverMouth.radiusZ;
            if(Math.abs(dx)>=1||Math.abs(dz)>=1)continue;
            const radius=Math.hypot(dx,dz);
            if(radius>=1)continue;
            const influence=1-smooth((radius-.2)/.8);
            const bank=smooth((coastDistance[i]-.5)/2.5);
            const channel=-.5+(riverMouth.bottom+.5)*bank;
            depth+=(Math.min(depth,channel)-depth)*influence;
        }
        return depth;
    }));
}
