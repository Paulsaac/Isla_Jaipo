// Resistencia espacial durante la levitación: no guarda ni acumula ralentización.
export function createForestMovementBoundary(floorMap,waterDeckMap,seed,bridgeDoors,unitSize,radius) {
    const height=floorMap.length,width=floorMap[0].length;
    const water=new Set(['WATER','WATER_ROCK','BOAT']);
    const blocked=new Uint8Array(width*height),allowed=new Uint8Array(width*height);
    const queue=new Int32Array(width*height);
    const neighbors=[[-1,0],[1,0],[0,-1],[0,1]];
    for(let z=0;z<height;z++)for(let x=0;x<width;x++)
        blocked[z*width+x]=water.has(floorMap[z][x])||!!waterDeckMap[z][x]?1:0;
    // Separar las dos orillas antes de buscar la tierra conectada a la casa de Graham.
    for(const bridge of waterDeckMap.coveredBridges)for(const [x,z]of bridge.cells)
        blocked[z*width+x]=1;
    let head=0,tail=0;
    const first=seed.z*width+seed.x;
    if(!blocked[first]){allowed[first]=1;queue[tail++]=first;}
    while(head<tail) {
        const index=queue[head++],x=index%width,z=Math.floor(index/width);
        for(const [dx,dz]of neighbors) {
            const nx=x+dx,nz=z+dz;
            if(nx<0||nx>=width||nz<0||nz>=height)continue;
            const next=nz*width+nx;
            if(!blocked[next]&&!allowed[next]){allowed[next]=1;queue[tail++]=next;}
        }
    }
    const bridge=waterDeckMap.coveredBridges.find(b=>bridgeDoors.some(p=>
        p.x>=b.minX&&p.x<=b.maxX&&p.z>=b.minZ&&p.z<=b.maxZ));
    if(bridge) {
        // Incluir todo el puente y dos celdas de su desembocadura norte.
        for(let z=Math.max(0,bridge.minZ-2);z<=Math.min(height-1,bridge.maxZ+1);z++)
            for(let x=bridge.minX;x<=bridge.maxX;x++)allowed[z*width+x]=1;
    }
    const cellAt=(x,z)=>{
        const gx=Math.floor(x/unitSize+.5),gz=Math.floor(z/unitSize+.5);
        return gx>=0&&gx<width&&gz>=0&&gz<height&&allowed[gz*width+gx]===1;
    };
    const contains=(x,z)=>cellAt(x,z)&&cellAt(x-radius,z)&&cellAt(x+radius,z)
        &&cellAt(x,z-radius)&&cellAt(x,z+radius);
    const slowDistance=12,stopMargin=.40,probeStep=.25;
    function clearance(x,z,ux,uz) {
        let previous=0;
        for(let distance=probeStep;distance<=slowDistance+stopMargin+probeStep;distance+=probeStep) {
            if(!contains(x+ux*distance,z+uz*distance)) {
                let low=previous,high=distance;
                for(let i=0;i<7;i++) {
                    const mid=(low+high)/2;
                    if(contains(x+ux*mid,z+uz*mid))low=mid;else high=mid;
                }
                return low;
            }
            previous=distance;
        }
        return Infinity;
    }
    function returnInward(x,z,dx,dz) {
        // Si el efecto comienza fuera (o junto al agua), permitir regresar a tierra.
        const gx=Math.floor(x/unitSize+.5),gz=Math.floor(z/unitSize+.5);
        for(let ring=0;ring<=32;ring++) {
            let nearest=null,best=Infinity;
            for(let oz=-ring;oz<=ring;oz++)for(let ox=-ring;ox<=ring;ox++) {
                if(Math.max(Math.abs(ox),Math.abs(oz))!==ring)continue;
                const px=(gx+ox)*unitSize,pz=(gz+oz)*unitSize;
                if(!contains(px,pz))continue;
                const distance=(px-x)**2+(pz-z)**2;
                if(distance<best){best=distance;nearest={x:px-x,z:pz-z};}
            }
            if(nearest) {
                const length=Math.sqrt(best),ux=nearest.x/length,uz=nearest.z/length;
                const inward=Math.max(0,dx*ux+dz*uz);
                return {dx:ux*inward,dz:uz*inward};
            }
        }
        return {dx:0,dz:0};
    }
    return {
        contains,
        constrain(x,z,dx,dz) {
            const length=Math.hypot(dx,dz);
            if(length<1e-9)return {dx,dz};
            if(!contains(x,z))return returnInward(x,z,dx,dz);
            const ux=dx/length,uz=dz/length,distance=clearance(x,z,ux,uz);
            if(distance===Infinity)return {dx,dz};
            const t=Math.max(0,Math.min(1,(distance-stopMargin)/slowDistance));
            const factor=t*t*(3-2*t);
            const travel=Math.min(length*factor,Math.max(0,distance-stopMargin));
            return {dx:ux*travel,dz:uz*travel};
        }
    };
}
