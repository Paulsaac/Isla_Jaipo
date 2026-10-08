const MOUNTAIN = new Set(['MOUNTAIN', 'PEAK', 'SNOW_PEAK']);

// Cada banda añade altura desde su propio borde: no multiplica altura heredada.
export function createMountainHeights(floorMap, width, height, targetHeight) {
    // Caminos y construcciones no deben abrir agujeros en el relieve subyacente.
    const sourceMap = floorMap;
    floorMap = floorMap.map(row => row.slice());
    const structures = new Set(['BUILDING','INDOOR_FLOOR','WOOD','CHEST','DOOR_UNLOCKED','DOOR_LOCKED','TORCH','OTHER2']);
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        const type=sourceMap[z][x];
        if(MOUNTAIN.has(type)||['WATER','WATER_ROCK','BOAT'].includes(type)) continue;
        let enclosed=0;
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            for(let step=1;step<=16;step++) if(MOUNTAIN.has(sourceMap[z+dz*step]?.[x+dx*step])) {enclosed++;break;}
        }
        if(type!=='DIRT'&&!structures.has(type)&&enclosed<3) continue;
        const radius=type==='DIRT'&&enclosed<3?2:16;
        let nearest=Infinity,label=null;
        for(let dz=-radius;dz<=radius;dz++) for(let dx=-radius;dx<=radius;dx++) {
            const candidate=sourceMap[z+dz]?.[x+dx],distance=dx*dx+dz*dz;
            if(MOUNTAIN.has(candidate)&&distance<nearest) {nearest=distance;label=candidate;}
        }
        if(label && (type==='DIRT'||label==='SNOW_PEAK'||enclosed>=3)) floorMap[z][x]=label;
    }
    function depth(types) {
        const field = Array.from({ length: height }, () => new Float32Array(width));
        const queue = [];
        for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
            if (!types.has(floorMap[z][x])) continue;
            field[z][x] = Infinity;
            if (x === 0 || z === 0 || x === width - 1 || z === height - 1 ||
                [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz]) => !types.has(floorMap[z + dz]?.[x + dx]))) {
                field[z][x] = 1;
                queue.push([x,z]);
            }
        }
        for (let i = 0; i < queue.length; i++) {
            const [x,z] = queue[i];
            for (const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx=x+dx,nz=z+dz;
                if (types.has(floorMap[nz]?.[nx]) && field[nz][nx] > field[z][x]+1) {
                    field[nz][nx]=field[z][x]+1;
                    queue.push([nx,nz]);
                }
            }
        }
        // Suavizar esquinas del campo de distancia sin depender del orden de recorrido.
        let result=field;
        for(let pass=0;pass<6;pass++) {
            const next=result.map(row=>row.slice());
            for(let z=1;z<height-1;z++) for(let x=1;x<width-1;x++) {
                if(!types.has(floorMap[z][x])) continue;
                next[z][x]=(result[z][x]*4+result[z-1][x]+result[z+1][x]+result[z][x-1]+result[z][x+1])/8;
            }
            result=next;
        }
        return result;
    }
    const base=depth(MOUNTAIN),rock=depth(new Set(['PEAK','SNOW_PEAK'])),snow=depth(new Set(['SNOW_PEAK']));
    const heights=base.map((row,z)=>Float32Array.from(row,(value,x)=>1+value*0.45+rock[z][x]*0.25+snow[z][x]*0.2));
    let maximum=1;
    for(const row of heights) for(const value of row) maximum=Math.max(maximum,value);
    const scale=targetHeight ? (targetHeight-1)/(maximum-1) : 1;
    for(const row of heights) for(let x=0;x<width;x++) row[x]=1+(row[x]-1)*scale;
    // Meseta blanca: conservar el borde y llegar suavemente a la cota de cumbre.
    // No altera las alturas de la banda marrón ni recalcula la escala global.
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(floorMap[z][x]!=='SNOW_PEAK') continue;
        const t=Math.max(0,Math.min(1,(snow[z][x]-1)/12));
        const blend=t*t*(3-2*t);
        heights[z][x]=heights[z][x]*(1-blend)+(targetHeight || maximum)*blend;
    }
    return { heights, mask: floorMap.map(row=>row.map(type=>MOUNTAIN.has(type))) };
}
