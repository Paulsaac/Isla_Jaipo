import { MOUNTAIN_RELIEF_RUNS } from '../content/mountain-relief.js';

// La pintura vigente define cima blanca y ladera marrón o nevada (#A7ECFF).
// La referencia anterior conserva únicamente las colisiones al repintar.
export function createMountainReliefMap(floorMap, collisionMap) {
    // Copa fija: la nieve añadida en el sendero no puede expandir la meseta.
    const crownRows=MOUNTAIN_RELIEF_RUNS.filter(([type])=>type==='SNOW_PEAK');
    const minX=Math.min(...crownRows.map(r=>r[2])),maxX=Math.max(...crownRows.map(r=>r[3]));
    const minZ=Math.min(...crownRows.map(r=>r[1])),maxZ=Math.max(...crownRows.map(r=>r[1]));
    const centerX=(minX+maxX)/2,centerZ=(minZ+maxZ)/2,radius=Math.min(maxX-minX,maxZ-minZ)/2;
    floorMap.snowTrail = new Set();
    for(let z=0;z<floorMap.length;z++) for(let x=0;x<floorMap[z].length;x++) {
        if(!['SNOW_PEAK','SNOW_SLOPE','MOUNTAIN','PEAK'].includes(floorMap[z][x])) continue;
        const crown=Math.hypot(x-centerX,z-centerZ)<=radius;
        if(crown) floorMap[z][x]='SNOW_PEAK';
        else if(floorMap[z][x]==='SNOW_PEAK') {
            floorMap[z][x]='SNOW_SLOPE';
            floorMap.snowTrail.add(z*floorMap[z].length+x);
            if(collisionMap) collisionMap[z][x]=false;
        }
    }
    const relief = floorMap.map(row => row.map(type => type === 'SNOW_SLOPE' ? 'MOUNTAIN' : type));
    const mountainColors = new Set(['MOUNTAIN','PEAK','SNOW_PEAK']);
    for (const [type,z,start,end] of MOUNTAIN_RELIEF_RUNS) {
        if (!relief[z]) continue;
        for (let x=start;x<=end;x++) {
            if (!mountainColors.has(floorMap[z][x])) continue;
            // Conservar también la huella transitable al repintar nieve sobre roca.
            if (collisionMap && floorMap[z][x]!=='DIRT') collisionMap[z][x]=type;
        }
    }
    return relief;
}
