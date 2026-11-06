// La textura recorre 1.6 repeticiones por fase; cada repetición ocupa una celda.
// Base visual compartida y multiplicador independiente para el empuje físico.
export const RIVER_FLOW_PHASE_RATE = 0.588;
export const RIVER_FLOW_UV_TRAVEL = 1.6;
export const RIVER_PUSH_MULTIPLIER = 3;
export function getRiverCurrentSpeed(unitSize) {
    return RIVER_FLOW_PHASE_RATE * RIVER_FLOW_UV_TRAVEL * unitSize * RIVER_PUSH_MULTIPLIER;
}

const crossSections = [[1, 0], [0, 1], [1, 1], [1, -1]];
const cardinalDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const surfaceWater = new Set(['WATER', 'BOAT', 'SEA_ALGA', 'SEA_CORAL', 'SEA_GRASS', 'SEA_HEART_FRAGMENT']);

// Mayor masa de agua interior conectada al cauce; el mar toca el borde del mapa.
function findLakeSurface(floorMap, waterDeckMap, river, width, height) {
    const visited = new Uint8Array(river.length), lake = new Uint8Array(river.length);
    const queue = new Int32Array(river.length);
    let largest = [];
    const wet = i => !river[i] && (surfaceWater.has(floorMap[Math.floor(i / width)][i % width])
        || surfaceWater.has(waterDeckMap[Math.floor(i / width)]?.[i % width]));
    for (let first = 0; first < river.length; first++) {
        if (visited[first] || !wet(first)) continue;
        let count = 1, border = false, adjacentRiver = false;
        queue[0] = first; visited[first] = 1;
        for (let head = 0; head < count; head++) {
            const i = queue[head], x = i % width, z = Math.floor(i / width);
            if (x === 0 || z === 0 || x === width - 1 || z === height - 1) border = true;
            for (const [dx, dz] of cardinalDirections) {
                const nx = x + dx, nz = z + dz;
                if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
                const next = nz * width + nx;
                if (river[next]) adjacentRiver = true;
                else if (!visited[next] && wet(next)) { visited[next] = 1; queue[count++] = next; }
            }
        }
        if (!border && adjacentRiver && count > largest.length) largest = Array.from(queue.subarray(0, count));
    }
    for (const i of largest) lake[i] = 1;
    return lake;
}

export function getRiverLakeDirection(field, unitSize, x, z, target) {
    target.x = target.z = 0;
    if (!field) return target;
    const gx = Math.floor((x + unitSize / 2) / unitSize), gz = Math.floor((z + unitSize / 2) / unitSize);
    if (gx < 0 || gz < 0 || gx >= field.width || gz >= field.height) return target;
    const i = gz * field.width + gx;
    if (!field.lakeConnected[i] && !field.seaward?.[i]) return target;
    let next = field.downstream[i];
    for (let step = 0; step < 3 && next >= 0 && field.river[next] && field.downstream[next] >= 0; step++)
        next = field.downstream[next];
    if (next < 0) return target;
    const dx = next % field.width * unitSize - x, dz = Math.floor(next / field.width) * unitSize - z;
    const length = Math.hypot(dx, dz);
    if (length > 0) { target.x = dx / length; target.z = dz / length; }
    return target;
}

// El corte más corto entre orillas aproxima el centro local, también en curvas.
// Se proyecta hacia ese eje central, sin arrastrar hasta una desembocadura.
export function getRiverCenterOffset(field, unitSize, x, z, target) {
    target.x = target.z = 0;
    if (!field) return target;
    const { river, width, height } = field;
    const gx = Math.floor((x + unitSize / 2) / unitSize);
    const gz = Math.floor((z + unitSize / 2) / unitSize);
    const wet = (cx, cz) => cx >= 0 && cz >= 0 && cx < width && cz < height && river[cz * width + cx];
    if (!wet(gx, gz)) return target;
    let shortest = Infinity;
    for (const [axisX, axisZ] of crossSections) {
        let positive = 0, negative = 0;
        while (wet(gx + axisX * (positive + 1), gz + axisZ * (positive + 1))) positive++;
        while (wet(gx - axisX * (negative + 1), gz - axisZ * (negative + 1))) negative++;
        const axisLength = Math.hypot(axisX, axisZ);
        const span = (positive + negative + 1) * axisLength;
        if (span >= shortest) continue;
        shortest = span;
        const projected = ((x - gx * unitSize) * axisX + (z - gz * unitSize) * axisZ)
            / (axisLength * axisLength);
        const offset = (positive - negative) * unitSize / 2 - projected;
        target.x = axisX * offset;
        target.z = axisZ * offset;
    }
    return target;
}

// Corriente hacia las desembocaduras. La distancia por el cauce evita cruzar tierra.
export function createRiverCurrentField(floorMap, waterDeckMap, width, height, seawardReference = null) {
    const river = new Uint8Array(width * height);
    const distance = new Int32Array(width * height).fill(-1);
    const directions = cardinalDirections;
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        const type = floorMap[z][x];
        river[z * width + x] = type === 'WATER_ROCK' || waterDeckMap[z][x] === 'WATER_ROCK' ||
            (type === 'BOAT' && directions.some(([dx, dz]) => floorMap[z + dz]?.[x + dx] === 'WATER_ROCK')) ? 1 : 0;
    }
    const lake = findLakeSurface(floorMap, waterDeckMap, river, width, height);
    for (let i = 0; i < river.length; i++) if (lake[i]) river[i] = 0;
    const lakeConnected = new Uint8Array(river.length);
    const seaward = new Uint8Array(river.length);
    let seawardSeed = -1, nearest = Infinity;
    if (seawardReference) for (let i = 0; i < river.length; i++) {
        if (!river[i]) continue;
        const d = (i % width - seawardReference.x) ** 2 + (Math.floor(i / width) - seawardReference.z) ** 2;
        if (d < nearest) { nearest = d; seawardSeed = i; }
    }
    const visited = new Uint8Array(river.length);
    const downstream = new Int32Array(river.length).fill(-1);
    for (let start = 0; start < river.length; start++) {
        if (!river[start] || visited[start]) continue;
        const cells = [start], mouths = [];
        visited[start] = 1;
        for (let head = 0; head < cells.length; head++) {
            const i = cells[head], x = i % width, z = Math.floor(i / width);
            for (const [dx, dz] of directions) {
                const nx = x + dx, nz = z + dz;
                if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
                const next = nz * width + nx;
                if (lake[next] && distance[i] < 0) {
                    mouths.push(i); distance[i] = 0; downstream[i] = next;
                }
                if (river[next] && !visited[next]) { visited[next] = 1; cells.push(next); }
            }
        }
        if (mouths.length) for (const i of cells) lakeConnected[i] = 1;
        if (cells.includes(seawardSeed)) {
            const seaMouths = new Map();
            for (const i of cells) {
                const x = i % width, z = Math.floor(i / width);
                for (const [dx, dz] of directions) {
                    const nx = x + dx, nz = z + dz;
                    if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
                    const next = nz * width + nx;
                    if (!river[next] && !lake[next] && (surfaceWater.has(floorMap[nz][nx]) || surfaceWater.has(waterDeckMap[nz]?.[nx])))
                        seaMouths.set(i, next);
                }
            }
            if (seaMouths.size) {
                mouths.length = 0;
                for (const i of cells) { distance[i] = downstream[i] = -1; seaward[i] = 1; }
                for (const [i, next] of seaMouths) { mouths.push(i); distance[i] = 0; downstream[i] = next; }
            }
        }
        // Tramo aislado: mantener una referencia para la textura, sin arrastre al lago.
        if (!mouths.length) {
            const outlet = cells.reduce((best, i) => i > best ? i : best, start);
            mouths.push(outlet); distance[outlet] = 0;
        }
        for (let head = 0; head < mouths.length; head++) {
            const i = mouths[head], x = i % width, z = Math.floor(i / width);
            for (const [dx, dz] of directions) {
                const nx = x + dx, nz = z + dz;
                if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
                const next = nz * width + nx;
                if (!river[next] || distance[next] >= 0) continue;
                distance[next] = distance[i] + 1; downstream[next] = i; mouths.push(next);
            }
        }
    }
    const data = new Uint8Array(width * height * 4);
    for (let i = 0; i < river.length; i++) {
        let dx = 0, dz = 0;
        if (river[i]) {
            let next = downstream[i];
            // Anticipar unos pasos del cauce suaviza los giros de la cuadrícula.
            for (let step = 0; step < 4 && next >= 0 && river[next] && downstream[next] >= 0; step++) next = downstream[next];
            if (next >= 0) { dx = next % width - i % width; dz = Math.floor(next / width) - Math.floor(i / width); }
            else dz = 1;
            // Mantener el aspecto del resto del río; el cauce oriental acompaña
            // su empuje hacia el mar, también al pasar bajo el puente.
            if (!seaward[i]) { dx = 1; dz = 0; }
            const length = Math.hypot(dx, dz);
            if (length > 0) { dx /= length; dz /= length; }
        }
        data[i * 4] = Math.round((dx * 0.5 + 0.5) * 255);
        data[i * 4 + 1] = Math.round((dz * 0.5 + 0.5) * 255);
        data[i * 4 + 2] = river[i] * 255;
        data[i * 4 + 3] = 255;
    }
    return { data, width, height, river, distance, downstream, lake, lakeConnected, seaward };
}
