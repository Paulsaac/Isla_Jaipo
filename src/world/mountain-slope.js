// Rampa marrón entre el pie de la montaña y el borde real de la meseta.
// Se aplica después del camino para conservar sus alturas y las de la nieve.
export function smoothMountainSlope(floorMap, heights, mountainMask) {
    const height=floorMap.length,width=floorMap[0].length;
    const directions=[[-1,0],[1,0],[0,-1],[0,1]];
    function distances(seed,withinMountain) {
        const field=Array.from({length:height},()=>new Float32Array(width).fill(Infinity));
        const anchors=Array.from({length:height},()=>new Float32Array(width));
        const queue=[];
        for(let z=0;z<height;z++) for(let x=0;x<width;x++) if(seed(x,z)) {
            field[z][x]=0;anchors[z][x]=heights[z][x];queue.push([x,z]);
        }
        for(let i=0;i<queue.length;i++) {
            const [x,z]=queue[i];
            for(const [dx,dz] of directions) {
                const nx=x+dx,nz=z+dz;
                if(nx<0||nz<0||nx>=width||nz>=height||withinMountain&&!mountainMask[nz][nx]) continue;
                if(field[nz][nx]<=field[z][x]+1) continue;
                field[nz][nx]=field[z][x]+1;
                anchors[nz][nx]=anchors[z][x];queue.push([nx,nz]);
            }
        }
        return {field,anchors};
    }
    const foot=distances((x,z)=>mountainMask[z][x]&&directions.some(([dx,dz])=>!mountainMask[z+dz]?.[x+dx]),true);
    const snow=distances((x,z)=>floorMap[z][x]==='SNOW_PEAK',true);
    const road=distances((x,z)=>mountainMask[z][x]&&floorMap[z][x]==='DIRT',false);
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(floorMap[z][x]!=='MOUNTAIN'||!Number.isFinite(snow.field[z][x])) continue;
        const total=foot.field[z][x]+snow.field[z][x];
        if(!total) continue;
        const progress=foot.field[z][x]/total;
        const slopeHeight=1+(snow.anchors[z][x]-1)*progress;
        // Conservar el corredor existente y fundir la ladera con sus laterales.
        const t=Math.max(0,Math.min(1,(road.field[z][x]-3)/7));
        const blend=t*t*(3-2*t);
        heights[z][x]=heights[z][x]*(1-blend)+slopeHeight*blend;
    }
}
