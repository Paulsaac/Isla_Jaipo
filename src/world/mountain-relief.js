import { MOUNTAIN_RELIEF_RUNS } from '../content/mountain-relief.js';

// La pintura vigente define cima blanca y ladera marrón.
// La referencia anterior conserva únicamente las colisiones al repintar.
export function createMountainReliefMap(floorMap, collisionMap) {
    const relief = floorMap.map(row => row.slice());
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
