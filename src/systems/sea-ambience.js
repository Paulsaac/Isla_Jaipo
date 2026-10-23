import { createRiverAmbience, sampleRiverSound } from './river-ambience.js';

// Solo agua conectada al borde exterior, sin atravesar el cauce ni incluir lagos cerrados.
export function createSeaSoundField(floorMap, waterDeckMap, riverField, width, height) {
    const surface = new Uint8Array(width * height);
    const queue = new Int32Array(surface.length);
    const water = new Set(['WATER','WATER_ROCK','BOAT','SEA_ALGA','SEA_CORAL','SEA_GRASS','SEA_HEART_FRAGMENT']);
    let count = 0;
    function visit(x,z) {
        if (x<0 || z<0 || x>=width || z>=height) return;
        const i = z*width+x;
        if (surface[i] || riverField?.river[i]) return;
        if (!water.has(floorMap[z][x]) && !water.has(waterDeckMap[z]?.[x])) return;
        surface[i] = 1; queue[count++] = i;
    }
    for (let x=0;x<width;x++) { visit(x,0); visit(x,height-1); }
    for (let z=0;z<height;z++) { visit(0,z); visit(width-1,z); }
    for (let head=0;head<count;head++) {
        const i=queue[head], x=i%width, z=Math.floor(i/width);
        visit(x-1,z); visit(x+1,z); visit(x,z-1); visit(x,z+1);
    }
    return { surface, width, height };
}

// Misma distancia 3D, curva de atenuación y tratamiento espacial que el río.
export const sampleSeaSound = sampleRiverSound;
export function createSeaAmbience(context) {
    return createRiverAmbience(context, { url:'./sonidos/fx/costanera_web.mp3', label:'la costanera' });
}
