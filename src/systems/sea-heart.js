// Tiempos conservadores por celdas transitables, sin cruzar obstáculos.
export function createSeaHeart(fragments, floorMap, start, unitSize, walkingSpeed, finish) {
    const width = floorMap[0].length, height = floorMap.length;
    const blocked = new Set(['BUILDING','DOOR_LOCKED','DOOR_UNLOCKED','CHEST','TREE','MOUNTAIN','PEAK','SNOW_PEAK','SNOW_SLOPE']);
    const all = [start, ...fragments];
    const distances = all.map(origin => {
        const steps = new Int32Array(width*height).fill(-1);
        const queue = new Int32Array(width*height);
        let head=0, tail=0;
        const first=origin.z*width+origin.x;
        steps[first]=0; queue[tail++]=first;
        while(head<tail) {
            const i=queue[head++], x=i%width, z=Math.floor(i/width);
            for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nx=x+dx,nz=z+dz;
                if(nx<0||nx>=width||nz<0||nz>=height||blocked.has(floorMap[nz][nx])) continue;
                const next=nz*width+nx;
                if(steps[next]>=0) continue;
                steps[next]=steps[i]+1; queue[tail++]=next;
            }
        }
        return all.map(p => {
            const n=steps[p.z*width+p.x];
            return n<0 ? Infinity : n*unitSize/walkingSpeed;
        });
    });
    const collected = new Set();
    const route=[];
    const unvisited=new Set(fragments.map((_,i)=>i+1));
    let index=0;
    while(unvisited.size) {
        const candidates=[...unvisited].filter(i=>unvisited.size===1 || !finish || all[i].x!==finish.x || all[i].z!==finish.z);
        const next=candidates.sort((a,b)=>distances[index][a]-distances[index][b])[0];
        route.push({id:all[next].id,number:route.length+1,x:all[next].x,z:all[next].z,seconds:distances[index][next]});
        unvisited.delete(next); index=next;
    }
    return {
        route,
        get next(){return route[collected.size] ?? null;},
        get count(){return collected.size;},
        get complete(){return fragments.length===10 && collected.size===10;},
        reset(){collected.clear();},
        collect(id) {
            const index=fragments.findIndex(p=>p.id===id)+1;
            if(!index || collected.has(id) || route[collected.size]?.id!==id) return null;
            collected.add(id);
            return {count:collected.size,complete:fragments.length===10&&collected.size===10,
                airSeconds:30};
        }
    };
}
