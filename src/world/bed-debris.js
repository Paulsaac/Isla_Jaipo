// Recorrido lateral con frenado: despejar el colchon antes de bajar hasta su altura.
export function bedDebrisTravel(time, duration) {
    const progress = Math.max(0, Math.min(1, time / duration));
    return 1 - (1 - progress) ** 3;
}

export function createBedDebrisTargets(bed, random = Math.random) {
    bed.updateWorldMatrix(true, false);
    const m = bed.matrixWorld.elements;
    const slots = [];
    for (const x of [-0.31, 0.31]) for (const z of [-0.4, 0.35, 1.1]) slots.push({ x, z });
    for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const targets = [];
    const add = (x, z, zone) => targets.push({
        x: m[0] * x + m[8] * z + m[12],
        z: m[2] * x + m[10] * z + m[14],
        surface: zone === 'center' ? 'bed' : 'floor', zone
    });
    const centerCount = 4 + Math.floor(random() * 3);
    for (const slot of slots.slice(0, centerCount)) {
        add(slot.x + (random() - 0.5) * 0.12, slot.z + (random() - 0.5) * 0.18, 'center');
    }
    // Son zonas de piso junto al colchon, aunque el mapa tenga un marcador de antorcha/NPC.
    for (const side of [-1, 1]) {
        const count = 1 + Math.floor(random() * 2);
        for (let i = 0; i < count; i++) {
            const x = side * (bed.geometry.boundingBox.max.x + 0.45 + random() * 0.2);
            const z = (count === 1 ? 0.15 + random() * 0.8 : 0.15 + i * 0.8)
                + (random() - 0.5) * 0.24;
            add(x, z, side < 0 ? 'left' : 'right');
        }
    }
    return targets;
}

// Contacto visual de astillas con la geometria de la cama, sin alturas del jugador.
export function createBedDebrisLanding(bed) {
    bed.updateWorldMatrix(true, false);
    const m = [...bed.matrixWorld.elements];
    const determinant = m[0] * m[10] - m[8] * m[2];
    const vertices = bed.geometry.attributes.position;
    const parts = bed.geometry.groups.map(group => {
        const part = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity, top: -Infinity };
        for (let i = group.start; i < group.start + group.count; i++) {
            part.minX = Math.min(part.minX, vertices.getX(i));
            part.maxX = Math.max(part.maxX, vertices.getX(i));
            part.minZ = Math.min(part.minZ, vertices.getZ(i));
            part.maxZ = Math.max(part.maxZ, vertices.getZ(i));
            part.top = Math.max(part.top, vertices.getY(i));
        }
        part.top = m[13] + part.top * m[5];
        return part;
    });
    function overlaps(part, x, z, size, yaw) {
        const c = Math.cos(yaw), s = Math.sin(yaw);
        const points = [];
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            const dx = sx * size * 0.9, dz = sz * size * 0.5;
            const wx = x + c * dx + s * dz - m[12];
            const wz = z - s * dx + c * dz - m[14];
            points.push([(wx * m[10] - wz * m[8]) / determinant,
                (wz * m[0] - wx * m[2]) / determinant]);
        }
        // SAT: ejes de ambas piezas rectangulares; incluye el grosor de su huella.
        const axes = [[1, 0], [0, 1]];
        for (const j of [1, 2]) {
            axes.push([-(points[j][1] - points[0][1]), points[j][0] - points[0][0]]);
        }
        for (const [ax, az] of axes) {
            const projections = points.map(([px, pz]) => px * ax + pz * az);
            const center = (part.minX + part.maxX) * 0.5 * ax + (part.minZ + part.maxZ) * 0.5 * az;
            const radius = (part.maxX - part.minX) * 0.5 * Math.abs(ax)
                + (part.maxZ - part.minZ) * 0.5 * Math.abs(az);
            if (Math.max(...projections) < center - radius || Math.min(...projections) > center + radius) return false;
        }
        return true;
    }
    return (chip, targetX, targetZ, floorHeight, targetSurface = 'floor') => {
        const halfThickness = chip.size * 0.175;
        const contactTime = top => {
            const drop = chip.y - top - halfThickness - 0.004;
            return drop <= 0 ? Infinity : (chip.vy + Math.sqrt(chip.vy * chip.vy + 18 * drop)) / 9;
        };
        const floorTime = contactTime(floorHeight);
        let targetTop = floorHeight;
        if (targetSurface === 'bed') {
            for (const part of parts) {
                const hitTime = contactTime(part.top);
                if (overlaps(part, targetX, targetZ, chip.size, chip.yaw + chip.turn * hitTime)) {
                    targetTop = Math.max(targetTop, part.top);
                }
            }
        }
        const travelTime = contactTime(targetTop);
        const vx = (targetX - chip.x) / travelTime, vz = (targetZ - chip.z) / travelTime;
        const at = t => bedDebrisTravel(t, travelTime) * travelTime;
        let time = floorTime, top = floorHeight, surface = 'floor';
        for (const part of parts) {
            const hitTime = contactTime(part.top);
            if (hitTime < time && overlaps(part, chip.x + vx * at(hitTime), chip.z + vz * at(hitTime),
                chip.size, chip.yaw + chip.turn * hitTime)) {
                time = hitTime; top = part.top; surface = 'bed';
            }
        }
        return { time, x: chip.x + vx * at(time), y: top + halfThickness + 0.004,
            z: chip.z + vz * at(time), vx, vz, travelTime, surface };
    };
}
