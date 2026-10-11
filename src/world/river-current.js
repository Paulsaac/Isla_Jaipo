// Corriente hacia las desembocaduras. La distancia por el cauce evita cruzar tierra.
export function createRiverCurrentField(floorMap, waterDeckMap, width, height) {
    const river = new Uint8Array(width * height);
    const distance = new Int32Array(width * height).fill(-1);
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        const type = floorMap[z][x];
        river[z * width + x] = type === 'WATER_ROCK' || waterDeckMap[z][x] === 'WATER_ROCK' ||
            (type === 'BOAT' && directions.some(([dx, dz]) => floorMap[z + dz]?.[x + dx] === 'WATER_ROCK')) ? 1 : 0;
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
                if (floorMap[nz][nx] === 'WATER' && !river[next] && distance[i] < 0) {
                    mouths.push(i); distance[i] = 0; downstream[i] = next;
                }
                if (river[next] && !visited[next]) { visited[next] = 1; cells.push(next); }
            }
        }
        // Agua marcada sin salida al mar: tomar el extremo sur como referencia.
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
            const length = Math.hypot(dx, dz);
            if (length > 0) { dx /= length; dz /= length; }
        }
        data[i * 4] = Math.round((dx * 0.5 + 0.5) * 255);
        data[i * 4 + 1] = Math.round((dz * 0.5 + 0.5) * 255);
        data[i * 4 + 2] = river[i] * 255;
        data[i * 4 + 3] = 255;
    }
    return { data, width, height, river, distance, downstream };
}
