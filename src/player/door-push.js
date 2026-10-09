import { COLLISION_RADIUS } from '../config.js';

// Al cerrar, liberar al jugador por el lado hacia el que retrocedería.
export function pushPlayerFromClosingDoors(position, backward, doors, isBlocked) {
    for (const door of doors) {
        if (door.userData.isOpen) continue;
        if (!door.geometry.boundingBox) door.geometry.computeBoundingBox();
        const bounds = door.geometry.boundingBox;
        const matrix = door.matrixWorld.elements;
        const dx = position.x - matrix[12], dz = position.z - matrix[14];
        const gapX = Math.max(bounds.min.x - dx, 0, dx - bounds.max.x);
        const gapZ = Math.max(bounds.min.z - dz, 0, dz - bounds.max.z);
        if (gapX * gapX + gapZ * gapZ >= COLLISION_RADIUS ** 2) continue;
        const axis = door.userData.isHorizontal ? 'z' : 'x';
        const center = axis === 'z' ? matrix[14] : matrix[12];
        const offset = position[axis] - center;
        const side = Math.abs(backward[axis]) > 0.1 ? Math.sign(backward[axis]) : (offset >= 0 ? 1 : -1);
        for (const direction of [side, -side]) {
            const candidate = { x: position.x, z: position.z };
            const edge = direction > 0 ? bounds.max[axis] : bounds.min[axis];
            candidate[axis] = center + edge + direction * (COLLISION_RADIUS + 0.03);
            if (isBlocked(candidate.x, candidate.z)) continue;
            position.x = candidate.x;
            position.z = candidate.z;
            return { moved: true, blocked: false };
        }
        return { moved: false, blocked: true };
    }
    return { moved: false, blocked: false };
}
