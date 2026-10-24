// Distancia a tierra calculada una sola vez desde la silueta de la maqueta guardada.
// La textura permite seguir playas, bahías e islotes sin cargar otro mapa.
export function createPreviewCoastDistance(THREE, model) {
    const islandSize = Math.max(model.width, model.depth);
    const padding = islandSize * 0.25;
    const cell = islandSize * 1.5 / 256;
    const width = Math.ceil((model.width + padding * 2) / cell);
    const height = Math.ceil((model.depth + padding * 2) / cell);
    const distances = new Float32Array(width * height).fill(Infinity);
    const { positions, indices } = model;
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
        const ax = (positions[a] + padding) / cell, az = (positions[a + 2] + padding) / cell;
        const bx = (positions[b] + padding) / cell, bz = (positions[b + 2] + padding) / cell;
        const cx = (positions[c] + padding) / cell, cz = (positions[c + 2] + padding) / cell;
        const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
        if (Math.abs(area) < 1e-8) continue;
        const minX = Math.max(0, Math.ceil(Math.min(ax, bx, cx) - 0.5));
        const maxX = Math.min(width - 1, Math.floor(Math.max(ax, bx, cx) - 0.5));
        const minZ = Math.max(0, Math.ceil(Math.min(az, bz, cz) - 0.5));
        const maxZ = Math.min(height - 1, Math.floor(Math.max(az, bz, cz) - 0.5));
        for (let z = minZ; z <= maxZ; z++) for (let x = minX; x <= maxX; x++) {
            const px = x + 0.5 - ax, pz = z + 0.5 - az;
            const u = (px * (cz - az) - pz * (cx - ax)) / area;
            const v = ((bx - ax) * pz - (bz - az) * px) / area;
            if (u >= -1e-6 && v >= -1e-6 && u + v <= 1.000001) distances[z * width + x] = 0;
        }
    }
    // Dos barridos de vecinos: distancia aproximada con diagonales, en unidades de la maqueta.
    const diagonal = cell * Math.SQRT2;
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        const i = z * width + x;
        if (x > 0) distances[i] = Math.min(distances[i], distances[i - 1] + cell);
        if (z > 0) {
            distances[i] = Math.min(distances[i], distances[i - width] + cell);
            if (x > 0) distances[i] = Math.min(distances[i], distances[i - width - 1] + diagonal);
            if (x + 1 < width) distances[i] = Math.min(distances[i], distances[i - width + 1] + diagonal);
        }
    }
    for (let z = height - 1; z >= 0; z--) for (let x = width - 1; x >= 0; x--) {
        const i = z * width + x;
        if (x + 1 < width) distances[i] = Math.min(distances[i], distances[i + 1] + cell);
        if (z + 1 < height) {
            distances[i] = Math.min(distances[i], distances[i + width] + cell);
            if (x > 0) distances[i] = Math.min(distances[i], distances[i + width - 1] + diagonal);
            if (x + 1 < width) distances[i] = Math.min(distances[i], distances[i + width + 1] + diagonal);
        }
    }
    const data = Uint8Array.from(distances, distance => Math.round(Math.min(1, distance / padding) * 255));
    const texture = new THREE.DataTexture(data, width, height, THREE.RedFormat);
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return { texture, origin: new THREE.Vector2(-padding, -padding),
        span: new THREE.Vector2(width * cell, height * cell), range: padding };
}
