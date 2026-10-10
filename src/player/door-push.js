import { COLLISION_RADIUS } from '../config.js';

// Liberar al jugador de la hoja en su posición final, al abrir o cerrar.
export function pushPlayerFromMovingDoors(position, backward, doors, isBlocked) {
    for (const door of doors) {
        if (!door.geometry.boundingBox) door.geometry.computeBoundingBox();
        const bounds = door.geometry.boundingBox;
        const matrix = door.matrixWorld.elements;
        const dx = position.x - matrix[12], dz = position.z - matrix[14];
        const localX = dx * matrix[0] + dz * matrix[2];
        const localZ = dx * matrix[8] + dz * matrix[10];
        const gapX = Math.max(bounds.min.x - localX, 0, localX - bounds.max.x);
        const gapZ = Math.max(bounds.min.z - localZ, 0, localZ - bounds.max.z);
        if (gapX * gapX + gapZ * gapZ >= COLLISION_RADIUS ** 2) continue;
        const axis = door.userData.isHorizontal ? 'z' : 'x';
        const normalX = axis === 'z' ? matrix[8] : matrix[0];
        const normalZ = axis === 'z' ? matrix[10] : matrix[2];
        const offset = axis === 'z' ? localZ : localX;
        const retreat = backward.x * normalX + backward.z * normalZ;
        const side = Math.abs(retreat) > 0.1 ? Math.sign(retreat) : (offset >= 0 ? 1 : -1);
        for (const direction of [side, -side]) {
            const candidate = { x: position.x, z: position.z };
            const edge = direction > 0 ? bounds.max[axis] : bounds.min[axis];
            const displacement = edge + direction * (COLLISION_RADIUS + 0.03) - offset;
            candidate.x += normalX * displacement;
            candidate.z += normalZ * displacement;
            if (isBlocked(candidate.x, candidate.z)) continue;
            position.x = candidate.x;
            position.z = candidate.z;
            return { moved: true, blocked: false };
        }
        return { moved: false, blocked: true };
    }
    return { moved: false, blocked: false };
}
