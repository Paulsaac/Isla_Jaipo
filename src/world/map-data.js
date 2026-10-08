import { FLOOR_COLORS } from './palette.js';
import { getClosestType } from './map-decoder.js';

// Prepara datos y minimapa; no crea objetos Three.js ni modifica el estado del juego.
export function prepareMap(mapData) {
    const mapWidth = mapData.width;
    const mapHeight = mapData.height;
    const imgData = mapData.basePixels;
    const roofImgData = mapData.roofPixels;

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
            if (type !== 'WATER' && type !== 'BOAT') {
                floorCtx.fillStyle = FLOOR_COLORS[type] || '#000000';
                floorCtx.fillRect(x, z, 1, 1);
            }

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
            else if (type === 'SAND') counts.ARENA_FLOOR++;
            else if (type === 'WATER' || type === 'BOAT') counts.AGUA_FLOOR++;

            if (type !== 'WATER' && type !== 'BOAT' && type !== 'POI') counts.BASE_FLOOR++;

            // Solid obstacles
            if (['BUILDING', 'CHEST', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'MOUNTAIN', 'PEAK', 'SNOW_PEAK'].includes(type)) {
                collisionMap[z][x] = type;
            } else if (type === 'TREE' || type === 'BUSH') {
                collisionMap[z][x] = 'TREE';
            }

            if (type === 'POI') {
                playerStartX = x;
                playerStartZ = z;
            }
        }
    }
    return { mapWidth, mapHeight, collisionMap, floorMap, roofMap, externalTorchMap, counts, playerStartX, playerStartZ, floorCanvas };
}
