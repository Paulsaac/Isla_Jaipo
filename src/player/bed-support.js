import { COLLISION_RADIUS } from '../config.js';

const parts = new WeakMap();
// Cada grupo del modelo de cama corresponde a una pieza rectangular.
function bedParts(object) {
    if (!parts.has(object.geometry)) {
        const position = object.geometry.attributes.position;
        parts.set(object.geometry, object.geometry.groups.map(group => {
            const bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity, top: -Infinity };
            for (let i = group.start; i < group.start + group.count; i++) {
                bounds.minX = Math.min(bounds.minX, position.getX(i));
                bounds.maxX = Math.max(bounds.maxX, position.getX(i));
                bounds.minZ = Math.min(bounds.minZ, position.getZ(i));
                bounds.maxZ = Math.max(bounds.maxZ, position.getZ(i));
                bounds.top = Math.max(bounds.top, position.getY(i));
            }
            return bounds;
        }));
    }
    return parts.get(object.geometry);
}

export function bedSurfaces(x, z, object) {
    const m = object.matrixWorld.elements;
    const dx = x - m[12], dz = z - m[14];
    if (Math.abs(dx) > 5 || Math.abs(dz) > 5) return [];
    const localX = dx * m[0] + dz * m[2];
    const localZ = dx * m[8] + dz * m[10];
    return bedParts(object).filter(part => {
        const gapX = Math.max(part.minX - localX, 0, localX - part.maxX);
        const gapZ = Math.max(part.minZ - localZ, 0, localZ - part.maxZ);
        return gapX * gapX + gapZ * gapZ < COLLISION_RADIUS ** 2;
    }).map(part => {
        const height = part.top * m[5];
        // Colchón/almohada: apoyo accesible con impulso9 incluso a20FPS.
        // El cabecero alto conserva su volumen y no se vuelve atravesable.
        return m[13] + (height <= 1 ? Math.min(height, 0.6) : height);
    });
}

export function getBedSupport(x, z, feetY, objects) {
    let support = -Infinity;
    for (const object of objects) {
        if (object.userData.type !== 'BED') continue;
        for (const top of bedSurfaces(x, z, object)) {
            if (feetY >= top - 0.08) support = Math.max(support, top);
        }
    }
    return support;
}
