import { UNIT_SIZE } from '../config.js';

// Origen: pixel superior izquierdo. X = columna; Z = fila, hacia abajo.
export function gridToWorld(x, z) {
    return { x: x * UNIT_SIZE, z: z * UNIT_SIZE };
}

export function worldToGrid(x, z) {
    return { x: Math.floor((x + UNIT_SIZE / 2) / UNIT_SIZE), z: Math.floor((z + UNIT_SIZE / 2) / UNIT_SIZE) };
}

export function coordinateKey(x, z) { return `${x},${z}`; }

export function validateGridPosition(position, width, height) {
    if (!Number.isInteger(position.x) || !Number.isInteger(position.z) || position.x < 0 || position.z < 0 || position.x >= width || position.z >= height) {
        throw new Error(`Coordenada fuera del mapa: (${position.x}, ${position.z}).`);
    }
}
