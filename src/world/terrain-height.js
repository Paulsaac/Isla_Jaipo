import { UNIT_SIZE } from '../config.js';

function hash2D(x, z) {
    let n = ((Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1);
    return n < 0 ? n + 1 : n;
}

function getSmoothNoise(x, z, scale) {
    const sx = x / scale;
    const sz = z / scale;
    const c0 = Math.floor(sx);
    const c1 = c0 + 1;
    const r0 = Math.floor(sz);
    const r1 = r0 + 1;
    const tx = sx - c0;
    const tz = sz - r0;
    const smoothTx = tx * tx * (3 - 2 * tx);
    const smoothTz = tz * tz * (3 - 2 * tz);

    const n00 = hash2D(c0, r0);
    const n10 = hash2D(c1, r0);
    const n01 = hash2D(c0, r1);
    const n11 = hash2D(c1, r1);

    const n0 = n00 * (1 - smoothTx) + n10 * smoothTx;
    const n1 = n01 * (1 - smoothTx) + n11 * smoothTx;
    return n0 * (1 - smoothTz) + n1 * smoothTz;
}

export function getTerrainVertexY(colF, rowF, mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap) {
    const c0 = Math.floor(colF);
    const c1 = Math.min(c0 + 1, mapWidth - 1);
    const r0 = Math.floor(rowF);
    const r1 = Math.min(r0 + 1, mapHeight - 1);

    const type = floorMap[r0] ? floorMap[r0][c0] : 'GRASS';

    const tx = colF - c0;
    const tz = rowF - r0;

    const y00 = elevationMap[r0][c0];
    const y10 = elevationMap[r0][c1];
    const y01 = elevationMap[r1][c0];
    const y11 = elevationMap[r1][c1];

    const y0 = y00 * (1 - tx) + y10 * tx;
    const y1 = y01 * (1 - tx) + y11 * tx;
    let y = y0 * (1 - tz) + y1 * tz;

    const interpolate = (a, b, c, d) => (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
    const noiseWeight = value => value === 'SAND' ? 0.25 : ['GRASS', 'TALL_GRASS', 'TREE', 'DIRT', 'BUSH', 'TORCH', 'OTHER2'].includes(value) ? 1 : 0;
    const t00 = floorMap[r0][c0], t10 = floorMap[r0][c1], t01 = floorMap[r1][c0], t11 = floorMap[r1][c1];
    // Interpolar profundidad y relieve evita el salto de dos metros al cambiar de celda.
    const coastalRelief = Math.max(0, Math.min(1, (y - 0.2) / 0.8));
    const noiseAmount = interpolate(noiseWeight(t00), noiseWeight(t10), noiseWeight(t01), noiseWeight(t11)) * (0.25 + 0.75 * coastalRelief);
    if (noiseAmount > 0) {
        // Large rolling hills (scale = 3.0 tiles)
        let macroNoise = getSmoothNoise(colF, rowF, 3.0) * 0.4;
        // Medium details (scale = 1.0 tiles)
        let microNoise = getSmoothNoise(colF, rowF, 1.0) * 0.15;

        let shoreGranularity = 0;
        if (y > -0.5 && y < 0.5) {
            // Soft sand ripples at the shore
            shoreGranularity = Math.sin(colF * 8.0) * Math.cos(rowF * 8.0) * 0.1;
        }

        y += (macroNoise + microNoise + shoreGranularity) * noiseAmount;
    }
    // Mantener tierra continua bajo la madera y suavizar el encuentro exterior.
    // Las cajas de madera abarcan media celda desde su centro y terminan en Y=1.
    if (woodFloorMap) {
        let distance = Infinity;
        let floorHeight = 1;
        for (let z = Math.max(0, Math.floor(rowF) - 1); z <= Math.min(mapHeight - 1, Math.ceil(rowF) + 1); z++) {
            for (let x = Math.max(0, Math.floor(colF) - 1); x <= Math.min(mapWidth - 1, Math.ceil(colF) + 1); x++) {
                if (!woodFloorMap[z][x]) continue;
                const candidate = Math.hypot(Math.max(0, Math.abs(colF - x) - 0.5), Math.max(0, Math.abs(rowF - z) - 0.5));
                if(candidate<distance) { distance=candidate; floorHeight=elevationMap[z][x]; }
            }
        }
        if (distance < 0.5) {
            const t = distance / 0.5;
            const blend = t * t * (3 - 2 * t);
            y = (floorHeight - 0.02) * (1 - blend) + y * blend;
        }
    }
    return y;
}

export function getTerrainHeight(x, z, mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap) {
    if (floorMap.length === 0) return 0;
    const woodX = Math.floor((x + UNIT_SIZE / 2) / UNIT_SIZE);
    const woodZ = Math.floor((z + UNIT_SIZE / 2) / UNIT_SIZE);
    if (woodFloorMap?.[woodZ]?.[woodX]) return elevationMap[woodZ][woodX];

    const gx = x / UNIT_SIZE;
    const gz = z / UNIT_SIZE;

    // Compatibilidad para consultas sin máscara de superficies.
    const safeCol = Math.min(Math.max(Math.floor(gx), 0), mapWidth - 1);
    const safeRow = Math.min(Math.max(Math.floor(gz), 0), mapHeight - 1);
    const tileType = floorMap[safeRow] ? floorMap[safeRow][safeCol] : 'GRASS';
    if (!woodFloorMap && ['BUILDING', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'INDOOR_FLOOR', 'WOOD', 'CHEST', 'POI'].includes(tileType)) {
        return 1.0;
    }

    function getMeshVertexY(colF, rowF) {
        return getTerrainVertexY(colF, rowF, mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap);
    }

    const SUBDIVISIONS = 4;
    const subX = Math.floor(gx * SUBDIVISIONS) / SUBDIVISIONS;
    const subZ = Math.floor(gz * SUBDIVISIONS) / SUBDIVISIONS;
    const nextSubX = subX + (1 / SUBDIVISIONS);
    const nextSubZ = subZ + (1 / SUBDIVISIONS);

    const fracX = (gx - subX) * SUBDIVISIONS;
    const fracZ = (gz - subZ) * SUBDIVISIONS;

    const h00 = getMeshVertexY(subX, subZ);
    const h10 = getMeshVertexY(nextSubX, subZ);
    const h01 = getMeshVertexY(subX, nextSubZ);
    const h11 = getMeshVertexY(nextSubX, nextSubZ);

    const h0 = h00 * (1 - fracX) + h10 * fracX;
    const h1 = h01 * (1 - fracX) + h11 * fracX;
    return h0 * (1 - fracZ) + h1 * fracZ;
}
