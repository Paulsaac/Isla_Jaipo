import { UNIT_SIZE, WALL_HEIGHT, COLLISION_RADIUS } from '../config.js';

// Contorno compartido por el hueco visible y el paso físico del jugador.
export const BED_CEILING_OPENING = [
    [-0.62,-1.56], [-0.22,-1.72], [0.14,-1.48], [0.61,-1.63],
    [0.84,-1.02], [0.66,-0.62], [0.87,-0.18], [0.72,0.36],
    [0.85,0.91], [0.54,1.50], [0.12,1.68], [-0.27,1.44],
    [-0.68,1.57], [-0.84,0.93], [-0.65,0.48], [-0.87,-0.08],
    [-0.70,-0.58], [-0.85,-1.06]
].map(([x,z]) => [x * 0.65, z * 0.55]);

export function createAtticSupport(roofMap, roofBaseMap, bed, subdivisions) {
    const width = roofMap[0].length;
    const cells = new Map();
    const holeCenter = {
        x: (bed.position.x + (bed.size.x - 1) / 2) * UNIT_SIZE,
        z: (bed.position.z + (bed.size.z - 1) / 2) * UNIT_SIZE
    };
    const queue = [[bed.position.x, bed.position.z]];
    for (let i = 0; i < queue.length; i++) {
        const [gx,gz] = queue[i], key = gz * width + gx;
        if (cells.has(key) || roofMap[gz]?.[gx] !== 'ROOF') continue;
        cells.set(key, {
            top: roofBaseMap[gz][gx] + WALL_HEIGHT + 0.05,
            bottom: roofBaseMap[gz][gx] + WALL_HEIGHT - 0.05,
            roofHeights: new Float32Array(subdivisions ** 2).fill(Infinity)
        });
        queue.push([gx-1,gz], [gx+1,gz], [gx,gz-1], [gx,gz+1]);
    }
    function cellAt(x,z) {
        const gx = Math.floor((x + UNIT_SIZE / 2) / UNIT_SIZE);
        const gz = Math.floor((z + UNIT_SIZE / 2) / UNIT_SIZE);
        if (gx < 0 || gx >= width || gz < 0 || gz >= roofMap.length) return undefined;
        return cells.get(gz * width + gx);
    }
    function fitsOpening(x,z,radius = COLLISION_RADIUS) {
        x -= holeCenter.x; z -= holeCenter.z;
        let inside = false;
        for (let i = 0, j = BED_CEILING_OPENING.length - 1; i < BED_CEILING_OPENING.length; j = i++) {
            const [ax,az] = BED_CEILING_OPENING[j], [bx,bz] = BED_CEILING_OPENING[i];
            if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside;
            const dx = bx - ax, dz = bz - az;
            const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
            if (Math.hypot(x - ax - t * dx, z - az - t * dz) < radius) return false;
        }
        return inside;
    }
    function supportHeight(x,z,feetY,open) {
        const cell = cellAt(x,z);
        if (!cell || feetY < cell.top - 0.08 || (open && fitsOpening(x,z))) return -Infinity;
        return cell.top;
    }
    function upperLimit(x,z) {
        let limit = Infinity;
        // Toda la cabeza debe caber bajo los escalones de la cubierta.
        for (let i = 0; i < 9; i++) {
            const angle = i * Math.PI / 4, radius = i === 8 ? 0 : COLLISION_RADIUS;
            const px = x + Math.cos(angle) * radius, pz = z + Math.sin(angle) * radius;
            const gx = Math.floor((px + UNIT_SIZE / 2) / UNIT_SIZE);
            const gz = Math.floor((pz + UNIT_SIZE / 2) / UNIT_SIZE);
            if (gx < 0 || gx >= width || gz < 0 || gz >= roofMap.length) return -Infinity;
            const cell = cells.get(gz * width + gx);
            if (!cell) return -Infinity;
            const sx = Math.min(subdivisions - 1, Math.max(0, Math.floor((px / UNIT_SIZE - gx + 0.5) * subdivisions)));
            const sz = Math.min(subdivisions - 1, Math.max(0, Math.floor((pz / UNIT_SIZE - gz + 0.5) * subdivisions)));
            limit = Math.min(limit, cell.roofHeights[sz * subdivisions + sx] - 0.2);
        }
        return limit;
    }
    function blocksMovement(x,z,eyesY,eyeHeight) {
        const cell = cellAt(x,z);
        if (!cell || eyesY > upperLimit(x,z) + 0.01) return true;
        return eyesY - eyeHeight < cell.top - 0.08 && !fitsOpening(x,z);
    }
    return { cells, holeCenter, cellAt, fitsOpening, supportHeight, upperLimit, blocksMovement };
}
