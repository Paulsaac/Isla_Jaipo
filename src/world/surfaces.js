const WOOD = new Set(['INDOOR_FLOOR', 'WOOD', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'POI']);
// Propagar el tipo de agua por tramos exteriores de madera conectados al agua.
// Los interiores con techo no forman parte de los puentes ni muelles.
export function createWaterDeckMap(floorMap, roofMap, width, height) {
    const result = Array.from({ length: height }, () => Array(width).fill(false));
    result.coveredBridges = [];
    result.channelCells = new Set();
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const isDeck = (x, z) => {
        if (roofMap[z]?.[x] === 'ROOF') return false;
        const type = floorMap[z]?.[x];
        if (['WOOD', 'INDOOR_FLOOR', 'DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(type)) return true;
        // Los muros junto al cauce también necesitan lecho debajo. No propagar
        // a muros de tierra ni a interiores a través de una construcción entera.
        return type === 'BUILDING' && directions.some(([dx, dz]) =>
            ['WATER', 'WATER_ROCK'].includes(floorMap[z + dz]?.[x + dx]));
    };
    const queue = [];
    // Puentes cubiertos: cubierta estrecha y alargada con agua en ambos flancos.
    // Revisar la cubierta completa evita confundir las dos paredes con edificios separados.
    const visited = new Set();
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        if (roofMap[z][x] !== 'ROOF' || visited.has(z * width + x)) continue;
        const cells = [[x, z]];
        visited.add(z * width + x);
        let minX = x, maxX = x, minZ = z, maxZ = z;
        for (let i = 0; i < cells.length; i++) {
            const [cx, cz] = cells[i];
            minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
            minZ = Math.min(minZ, cz); maxZ = Math.max(maxZ, cz);
            for (const [dx, dz] of directions) {
                const nx = cx + dx, nz = cz + dz;
                if (roofMap[nz]?.[nx] !== 'ROOF' || visited.has(nz * width + nx)) continue;
                visited.add(nz * width + nx); cells.push([nx, nz]);
            }
        }
        // Medir la estructura, no los aleros que ensanchan la cubierta.
        const structure = cells.filter(([cx, cz]) =>
            ['BUILDING', 'INDOOR_FLOOR', 'WOOD', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'TORCH', 'OTHER2'].includes(floorMap[cz][cx]));
        if (!structure.length) continue;
        const wallMinX = Math.min(...structure.map(([cx]) => cx));
        const wallMaxX = Math.max(...structure.map(([cx]) => cx));
        const wallMinZ = Math.min(...structure.map(([,cz]) => cz));
        const wallMaxZ = Math.max(...structure.map(([,cz]) => cz));
        const spanX = wallMaxX - wallMinX + 1, spanZ = wallMaxZ - wallMinZ + 1;
        if (Math.min(spanX, spanZ) > 4 || Math.max(spanX, spanZ) < Math.min(spanX, spanZ) * 2) continue;
        const water = type => ['WATER', 'WATER_ROCK'].includes(type);
        let crossingWater = false;
        if (spanZ > spanX) {
            for (let row = wallMinZ; row <= wallMaxZ; row++) {
                if (water(floorMap[row]?.[wallMinX - 1]) && water(floorMap[row]?.[wallMaxX + 1])) {
                    crossingWater = floorMap[row][wallMinX - 1]; break;
                }
            }
        } else {
            for (let col = wallMinX; col <= wallMaxX; col++) {
                if (water(floorMap[wallMinZ - 1]?.[col]) && water(floorMap[wallMaxZ + 1]?.[col])) {
                    crossingWater = floorMap[wallMinZ - 1][col]; break;
                }
            }
        }
        if (crossingWater) {
            result.coveredBridges.push({ cells, structure, minX, maxX, minZ, maxZ });
            for (const [cx, cz] of structure) {
                const besideWater = spanZ > spanX
                    ? water(floorMap[cz]?.[wallMinX - 1]) || water(floorMap[cz]?.[wallMaxX + 1])
                    : water(floorMap[wallMinZ - 1]?.[cx]) || water(floorMap[wallMaxZ + 1]?.[cx]);
                if (!besideWater) continue;
                result[cz][cx] = crossingWater;
                result.channelCells.add(cz * width + cx);
            }
        }
    }
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        if (!isDeck(x, z)) continue;
        for (const [dx, dz] of directions) {
            const neighbor = floorMap[z + dz]?.[x + dx];
            if (!['WATER', 'WATER_ROCK'].includes(neighbor)) continue;
            result[z][x] = neighbor;
            queue.push([x, z]);
            break;
        }
    }
    for (let head = 0; head < queue.length; head++) {
        const [x, z] = queue[head];
        for (const [dx, dz] of directions) {
            const nx = x + dx, nz = z + dz;
            if (nx < 0 || nz < 0 || nx >= width || nz >= height || !isDeck(nx, nz) || result[nz][nx]) continue;
            result[nz][nx] = result[z][x];
            queue.push([nx, nz]);
        }
    }
    return result;
}

export function createWoodFloorMap(floorMap, roofMap, width, height, externalTorchMap) {
    return Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => {
        const type = floorMap[z][x];
        if (externalTorchMap?.[z]?.[x] || roofMap[z][x] === 'EXTERNAL_TORCH') return false;
        if (type === 'CHEST') {
            return roofMap[z][x] === 'ROOF' || [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dz]) =>
                ['INDOOR_FLOOR', 'WOOD'].includes(floorMap[z+dz]?.[x+dx]));
        }
        if (WOOD.has(type)) return true;
        if (type !== 'TORCH' && type !== 'OTHER2') return false;
        if (roofMap[z][x] === 'ROOF') return true;
        for (let r = Math.max(0, z - 1); r <= Math.min(height - 1, z + 1); r++) {
            for (let c = Math.max(0, x - 1); c <= Math.min(width - 1, x + 1); c++) {
                if (WOOD.has(floorMap[r][c])) return true;
            }
        }
        return false;
    }));
}

// El terreno costero llega al extremo terrestre del tablero; el resto queda sobre agua.
export function createWaterDeckTerrain(floorMap, elevationMap, woodFloorMap, waterDeckMap, seaFloorHeights = null) {
    const shoreDeck = waterDeckMap.map((row, z) => row.map((water, x) => {
        if (!water || waterDeckMap.channelCells?.has(z * floorMap[0].length + x)) return false;
        for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const neighbor = floorMap[z + dz]?.[x + dx];
            if (['SAND', 'WET_SAND', 'DIRT'].includes(neighbor)) return neighbor;
            if (['GRASS', 'TALL_GRASS', 'TREE', 'BUSH'].includes(neighbor)) return 'GRASS';
        }
        return false;
    }));
    return {
        floorMap: floorMap.map((row, z) => row.map((type, x) =>
            shoreDeck[z][x] || waterDeckMap[z][x] || type)),
        elevations: elevationMap.map((row, z) => row.map((height, x) =>
            shoreDeck[z][x] ? height - 0.02 : waterDeckMap[z][x] ?
                waterDeckMap[z][x]==='WATER' ? seaFloorHeights?.[z]?.[x] ?? -2.5 : -2.5 : height)),
        woodMap: woodFloorMap.map((row, z) => row.map((wood, x) => wood && (!waterDeckMap[z][x] || !!shoreDeck[z][x])))
    };
}

// Nivelar una construcción identificada por una celda de su cubierta.
export function levelBuildingAtTerrain(position, floorMap, roofMap, elevationMap, sampleHeight) {
    const width = floorMap[0].length;
    if (roofMap[position.z]?.[position.x] !== 'ROOF') return null;
    const cells = [[position.x, position.z]], visited = new Set([position.z * width + position.x]);
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let head = 0; head < cells.length; head++) {
        const [x, z] = cells[head];
        for (const [dx, dz] of directions) {
            const nx = x + dx, nz = z + dz;
            if (roofMap[nz]?.[nx] !== 'ROOF' || visited.has(nz * width + nx)) continue;
            visited.add(nz * width + nx); cells.push([nx, nz]);
        }
    }
    const accesses = [];
    const ground = new Set(['GRASS', 'DIRT', 'SAND', 'WET_SAND', 'TALL_GRASS', 'TREE', 'BUSH']);
    for (const [x, z] of cells) {
        if (!['DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(floorMap[z][x])) continue;
        for (const [dx, dz] of directions) {
            let nx = x + dx, nz = z + dz;
            // Atravesar únicamente el alero sobre terreno, no el interior de la casa.
            while (roofMap[nz]?.[nx] === 'ROOF' && ground.has(floorMap[nz]?.[nx])) { nx += dx; nz += dz; }
            if (roofMap[nz]?.[nx] !== 'ROOF' && ground.has(floorMap[nz]?.[nx])) accesses.push([nx, nz]);
        }
    }
    if (!accesses.length) return null;
    const base = Math.max(...accesses.map(([x, z]) => sampleHeight(x, z)));
    for (const [x, z] of cells) elevationMap[z][x] = base;
    return { base, cells, accesses };
}

// Prolongar la franja pintada de arena mojada al fondo somero contiguo.
export function createWetSandShoreMap(floorMap, width, height) {
    return Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => {
        if (!['WATER', 'BOAT'].includes(floorMap[z][x])) return false;
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
            if (floorMap[z + dz]?.[x + dx] === 'WET_SAND') return true;
        }
        return false;
    }));
}
