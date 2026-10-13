import { SEA_FLOOR_HEIGHT } from '../config.js';

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
        return Math.max(coastal,mouth);
    }));
}
