// Cada techo continuo se apoya en una cota común de su construcción.
// El terreno bajo un alero puede ser arena o agua y no debe deformar la cubierta.
export function createRoofBaseMap(roofMap, floorMap, elevationMap) {
    const height=roofMap.length,width=roofMap[0].length;
    const result=Array.from({length:height},()=>new Float32Array(width));
    const visited=Array.from({length:height},()=>new Uint8Array(width));
    const supports=new Set(['BUILDING','INDOOR_FLOOR','WOOD','CHEST','POI','DOOR_LOCKED','DOOR_UNLOCKED']);
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(roofMap[z][x]!=='ROOF'||visited[z][x]) continue;
        const cells=[[x,z]],supportHeights=[];
        visited[z][x]=1;
        for(let i=0;i<cells.length;i++) {
            const [cx,cz]=cells[i];
            if(supports.has(floorMap[cz][cx])) supportHeights.push(elevationMap[cz][cx]);
            for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nx=cx+dx,nz=cz+dz;
                if(roofMap[nz]?.[nx]!=='ROOF'||visited[nz][nx]) continue;
                visited[nz][nx]=1;
                cells.push([nx,nz]);
            }
        }
        const heights=supportHeights.length?supportHeights:cells.map(([cx,cz])=>elevationMap[cz][cx]);
        heights.sort((a,b)=>a-b);
        const base=heights[Math.floor(heights.length/2)];
        for(const [cx,cz] of cells) result[cz][cx]=base;
    }
    return result;
}
