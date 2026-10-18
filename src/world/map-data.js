import { FLOOR_COLORS } from './palette.js';
import { getClosestType } from './map-decoder.js';
import { validateGridPosition } from './coordinates.js';

// Prepara datos y minimapa; no crea objetos Three.js ni modifica el estado del juego.
export function prepareMap(mapData, entityDefinitions = [], sceneryDefinitions = [], cellOverrides = []) {
    const mapWidth = mapData.width;
    const mapHeight = mapData.height;
    const relocations = new Map();
    for (const prop of sceneryDefinitions) {
        validateGridPosition(prop.position, mapWidth, mapHeight);
        const { x, z } = prop.position;
        const pixel = (z * mapWidth + x) * 4;
        if (getClosestType(...mapData.basePixels.slice(pixel, pixel + 4)) !== prop.type) {
            throw new Error(`El resto ${prop.id} requiere ${prop.type} en (${x},${z}).`);
        }
        relocations.set(x + ',' + z, prop.ground);
    }
    for (const entity of entityDefinitions) {
        if (!entity.sourcePosition) continue;
        const { sourcePosition: from, position: to } = entity;
        const source = (from.z * mapWidth + from.x) * 4;
        const target = (to.z * mapWidth + to.x) * 4;
        const decode = index => getClosestType(...mapData.basePixels.slice(index, index + 4));
        if (decode(source) !== entity.type || !['INDOOR_FLOOR', 'WOOD'].includes(decode(target))) {
            throw new Error('No se puede trasladar la entidad ' + entity.id + ': revisar origen y destino.');
        }
        relocations.set(from.x + ',' + from.z, decode(target));
        relocations.set(to.x + ',' + to.z, entity.type);
    }
    for (const override of cellOverrides) {
        validateGridPosition(override.position, mapWidth, mapHeight);
        const { x, z } = override.position;
        const pixel = (z * mapWidth + x) * 4;
        const original = getClosestType(...mapData.basePixels.slice(pixel, pixel + 4));
        if (original !== override.expectedType || !Object.prototype.hasOwnProperty.call(FLOOR_COLORS, override.type)) {
            throw new Error('No se puede ajustar la celda ' + override.id + ': revisar tipo original y destino.');
        }
        relocations.set(x + ',' + z, override.type);
    }
    const imgData = mapData.basePixels;
    const roofImgData = mapData.roofPixels;
    const seaHeartFragments = [];
    const underwaterPlants = [];
    const fenceCells = [];

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = mapWidth;
    floorCanvas.height = mapHeight;
    const floorCtx = floorCanvas.getContext('2d');

    const collisionMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill(false));
    const floorMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill('GRASS'));
    const roofMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill(false));
    const externalTorchMap = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(false));

    const counts = { PINO1: 0, PINO2: 0, ALAMO1: 0, ALAMO2: 0, ARAU1: 0, ARAU2: 0, BUSH1: 0, BUSH2: 0, BUILDING: 0, MOUNTAIN: 0, PEAK: 0, SNOW_PEAK: 0, WEED1: 0, WEED2: 0, WEED3: 0, CEILING: 0, ROOF: 0, GRASS_FLOOR: 0, DIRT_FLOOR: 0, ARENA_FLOOR: 0, AGUA_FLOOR: 0, MADERA_FLOOR: 0, BASE_FLOOR: 0, TORCH: 0, OTHER: 0, BUSH: 0 };
    let playerStartX = mapWidth / 2;
    let playerStartZ = mapHeight / 2;

    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const idx = (z * mapWidth + x) * 4;
            let type = getClosestType(imgData[idx], imgData[idx+1], imgData[idx+2], imgData[idx+3]);
            if (['SEA_HEART_FRAGMENT','SEA_ALGA','SEA_CORAL','SEA_GRASS'].includes(type)) {
                if(type==='SEA_HEART_FRAGMENT') seaHeartFragments.push({ id: `sea-heart:${x},${z}`, x, z });
                else underwaterPlants.push({type,x,z});
                const neighbors = new Map();
                for (const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    if (x+dx < 0 || x+dx >= mapWidth || z+dz < 0 || z+dz >= mapHeight) continue;
                    const pixel = ((z+dz)*mapWidth+x+dx)*4;
                    const ground = getClosestType(...imgData.slice(pixel,pixel+4));
                    if (!['WATER','WATER_ROCK','SAND','WET_SAND','GRASS','DIRT'].includes(ground)) continue;
                    neighbors.set(ground,(neighbors.get(ground) || 0)+1);
                }
                type = [...neighbors].sort((a,b)=>b[1]-a[1])[0]?.[0] || 'WATER';
            }

            type = relocations.get(x + ',' + z) ?? type;
            const isFence = type === 'FENCE';
            if (isFence) {
                fenceCells.push({ x, z });
                type = 'GRASS'; // La pintura coloca la valla; el terreno debajo sigue siendo pasto.
            }

            let rType = getClosestType(roofImgData[idx], roofImgData[idx+1], roofImgData[idx+2], roofImgData[idx+3]);
            // Conservar el carácter exterior: la antorcha no crea un piso interior.
            externalTorchMap[z][x] = type === 'EXTERNAL_TORCH' || rType === 'EXTERNAL_TORCH';
            if (type === 'EXTERNAL_TORCH') type = 'GRASS';
            if (rType === 'BOAT') rType = 'ROOF';
            // Una antorcha superpuesta reemplaza el árbol, manteniendo pasto debajo.
            if (type === 'TREE' && (externalTorchMap[z][x] || ['TORCH', 'OTHER2'].includes(rType))) type = 'GRASS';
            roofMap[z][x] = rType;
            if (rType === 'ROOF') counts.ROOF++;
            if (rType === 'TORCH') counts.TORCH = (counts.TORCH || 0) + 1;
            if (rType === 'OTHER') counts.OTHER = (counts.OTHER || 0) + 1;

            floorMap[z][x] = type;
            floorCtx.fillStyle = isFence ? FLOOR_COLORS.FENCE : FLOOR_COLORS[type] || '#000000';
            floorCtx.fillRect(x, z, 1, 1);

            if (type === 'TREE') {
                const rand = ((x * 31 + z * 17) % 100);
                if (rand < 35) counts.PINO1++;
                else if (rand < 70) counts.PINO2++;
                else if (rand < 83) counts.ALAMO1++;
                else if (rand < 95) counts.ALAMO2++;
                else if (rand < 98) counts.ARAU1++;
                else counts.ARAU2++;
            } else if (type === 'BUSH') {
                const isArbusto1 = ((x * 19 + z * 7) % 2) === 0;
                if (isArbusto1) counts.BUSH1++; else counts.BUSH2++;
            } else if (type === 'TALL_GRASS') {
                const rand = ((x * 13 + z * 7) % 100);
                const weedVariant = rand % 3;
                if (weedVariant === 0) counts.WEED1++;
                else if (weedVariant === 1) counts.WEED2++;
                else counts.WEED3++;
            }
            if (counts[type] !== undefined) counts[type]++;

            if (type === 'INDOOR_FLOOR' || type === 'CHEST') {
                counts.MADERA_FLOOR++;
            } else if (type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED' || type === 'WOOD') {
                counts.MADERA_FLOOR++;
            } else if (type === 'POI') {
                counts.MADERA_FLOOR++; // Suelo de madera para el spawn
            }
            if (type === 'TORCH' || type === 'OTHER') {
                counts.MADERA_FLOOR++; // Margen seguro por si son antorchas de interior en capa 1
            }

            if (type === 'GRASS' || type === 'TALL_GRASS' || type === 'TREE' || type === 'BUSH') counts.GRASS_FLOOR++;
            else if (type === 'DIRT') counts.DIRT_FLOOR++;
            else if (['SAND', 'WET_SAND'].includes(type)) counts.ARENA_FLOOR++;
            else if (['WATER', 'WATER_ROCK', 'BOAT'].includes(type)) counts.AGUA_FLOOR++;

            if (!['WATER', 'WATER_ROCK', 'BOAT', 'POI'].includes(type)) counts.BASE_FLOOR++;

            // Solid obstacles
            if (['BUILDING', 'CHEST', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'MOUNTAIN', 'PEAK', 'SNOW_PEAK'].includes(type)) {
                collisionMap[z][x] = type;
            } else if (type === 'TREE') {
                collisionMap[z][x] = 'TREE';
            }

            if (type === 'POI') {
                playerStartX = x;
                playerStartZ = z;
            }
        }
    }
    return { mapWidth, mapHeight, collisionMap, floorMap, roofMap, externalTorchMap, fenceCells, counts, playerStartX, playerStartZ, floorCanvas, seaHeartFragments, underwaterPlants };
}
