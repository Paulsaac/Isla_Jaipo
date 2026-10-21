import { createMountainReliefMap } from './mountain-relief.js';
import { createMountainHeights } from './mountain-height.js';
import { smoothMountainSlope } from './mountain-slope.js';
import { carveMountainTrail } from './mountain-trail.js';
import { createWoodFloorMap, createWaterDeckMap } from './surfaces.js';
import { createSeaFloorHeights } from './sea-depth.js';

// Las funciones originales siguen calculando exactamente los mismos datos.
export function computeWorldFields(type, data) {
    if (type === 'base') {
        const mountainReliefMap = createMountainReliefMap(data.floorMap, data.collisionMap);
        const woodFloorMap = createWoodFloorMap(data.floorMap, data.roofMap, data.width, data.height, data.externalTorchMap);
        const waterDeckMap = createWaterDeckMap(data.floorMap, data.roofMap, data.width, data.height);
        const seaFloorHeights = createSeaFloorHeights(data.floorMap, waterDeckMap, data.width, data.height);
        return {mountainReliefMap,woodFloorMap,waterDeckMap,seaFloorHeights,collisionMap:data.collisionMap};
    }
    if (type === 'mountain') return createMountainHeights(data.floorMap, data.width, data.height, data.targetHeight);
    smoothMountainSlope(data.relief, data.elevations, data.mask, data.profile?.summitHeight, data.profile?.followsTerrain);
    const profile = carveMountainTrail(data.floorMap, data.elevations, data.mask, data.profile);
    return {elevations:data.elevations,profile,platforms:data.elevations.buildingPlatforms};
}

export async function prepareWorldFields(type, data) {
    if (typeof Worker === 'undefined') return computeWorldFields(type, data);
    const worker = new Worker(new URL('./world-preparation-worker.js', import.meta.url), {type:'module'});
    try {
        return await new Promise((resolve, reject) => {
            worker.onmessage = ({data}) => data.error ? reject(new Error(data.error)) : resolve(data.result);
            worker.onerror = event => reject(new Error(event.message || 'Falló la preparación del mapa.'));
            worker.postMessage({type,data});
        });
    } finally { worker.terminate(); }
}
