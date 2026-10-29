import { createMountainReliefMap } from './mountain-relief.js';
import { createMountainHeights } from './mountain-height.js';
import { smoothMountainSlope } from './mountain-slope.js';
import { carveMountainTrail } from './mountain-trail.js';
import { shapeSummitRidge } from './summit-ridge.js';
import { createWoodFloorMap, createWaterDeckMap } from './surfaces.js';
import { createSeaFloorHeights } from './sea-depth.js';

// Las funciones originales siguen calculando exactamente los mismos datos.
export function computeWorldFields(type, data) {
    if (type === 'base') {
        const mountainReliefMap = createMountainReliefMap(data.floorMap, data.collisionMap);
        const woodFloorMap = createWoodFloorMap(data.floorMap, data.roofMap, data.width, data.height, data.externalTorchMap);
        const waterDeckMap = createWaterDeckMap(data.floorMap, data.roofMap, data.width, data.height);
        const seaFloorHeights = createSeaFloorHeights(data.floorMap, waterDeckMap, data.width, data.height);
        return {mountainReliefMap,woodFloorMap,waterDeckMap,seaFloorHeights,collisionMap:data.collisionMap,floorMap:data.floorMap};
    }
    if (type === 'mountain') return createMountainHeights(data.floorMap, data.width, data.height, data.targetHeight);
    smoothMountainSlope(data.relief, data.elevations, data.mask, data.profile?.summitHeight, data.profile?.followsTerrain);
    let profile = carveMountainTrail(data.floorMap, data.elevations, data.mask, data.profile,data.collisionMap);
    profile=shapeSummitRidge(data.floorMap,data.elevations,data.mask,profile,data.collisionMap);
    return {elevations:data.elevations,profile,platforms:data.elevations.buildingPlatforms,floorMap:data.floorMap,collisionMap:data.collisionMap};
}

let workerAvailable=true;
function compatibleWorldFields(type,data) {
    // El worker recibe una copia aislada. Mantener ese contrato también en el respaldo:
    // el cálculo de montaña modifica sus mapas de entrada temporalmente.
    return computeWorldFields(type,typeof structuredClone==='function'?structuredClone(data):data);
}

export async function prepareWorldFields(type, data) {
    if (typeof Worker === 'undefined'||!workerAvailable) return compatibleWorldFields(type, data);
    let worker,timer,response;
    try {
        worker = new Worker(new URL('./world-preparation-worker.js', import.meta.url), {type:'module'});
        response=await new Promise((resolve, reject) => {
            // Una importación de módulo fallida en móvil puede producir un error sin mensaje.
            // No clonar el mapa hasta que todas las dependencias del worker estén listas.
            timer=setTimeout(()=>reject(new Error('La descarga del preparador del mapa tardó demasiado.')),12000);
            worker.onmessage = ({data:message}) => {
                if(message.ready) {
                    clearTimeout(timer);
                    timer=setTimeout(()=>reject(new Error('El preparador del mapa dejó de responder.')),60000);
                    try { worker.postMessage({type,data}); } catch(error) { reject(error); }
                } else if('result' in message||'error' in message) resolve(message);
                else reject(new Error('Respuesta inválida del preparador del mapa.'));
            };
            worker.onerror = event => {
                event.preventDefault();
                reject(new Error(event.message || 'No se pudo iniciar el preparador del mapa.'));
            };
            worker.onmessageerror=()=>reject(new Error('No se pudo recibir el mapa preparado.'));
        });
    } catch(error) {
        // No se transfieren buffers: la entrada original sigue disponible para el respaldo.
        workerAvailable=false;
        console.warn('Preparación del mapa: se continúa en modo compatible.',error);
    } finally { clearTimeout(timer);worker?.terminate(); }
    // Un error del cálculo sí debe mostrarse; no ocultarlo repitiendo la misma operación.
    if(response) {
        if('error' in response)throw new Error(response.error);
        return response.result;
    }
    await new Promise(resolve=>setTimeout(resolve,0));
    return compatibleWorldFields(type,data);
}
