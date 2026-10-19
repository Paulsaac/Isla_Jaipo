import { UNIT_SIZE } from '../config.js';

// Un poste por celda pintada y travesaños solo hacia vecinos positivos: sin piezas duplicadas.
export function createWoodFenceGeometry(THREE, east, south, wallConnections = []) {
    const pieces = [];
    function add(source, tint, x, y, z) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        geometry.translate(x, y, z);
        const color = new THREE.Color(tint);
        const vertexColors = new Float32Array(geometry.attributes.position.count * 3);
        for (let i = 0; i < vertexColors.length; i += 3) {
            vertexColors[i] = color.r;
            vertexColors[i + 1] = color.g;
            vertexColors[i + 2] = color.b;
        }
        pieces.push({ geometry, vertexColors });
    }
    const box = (w, h, d, x, y, z, color) => add(new THREE.BoxGeometry(w, h, d), color, x, y, z);
    box(0.32, 0.18, 0.32, 0, 0.09, 0, 0x50331f);
    box(0.24, 1.34, 0.24, 0, 0.67, 0, 0x795034);
    box(0.32, 0.09, 0.32, 0, 1.385, 0, 0x9b6940);
    const cap = new THREE.ConeGeometry(0.21, 0.20, 4);
    cap.rotateY(Math.PI / 4);
    add(cap, 0x80512e, 0, 1.53, 0);

    for (const height of [0.51, 1.04]) {
        if (east) {
            box(UNIT_SIZE, 0.17, 0.13, UNIT_SIZE / 2, height, 0, 0x99683d);
            box(UNIT_SIZE - 0.22, 0.025, 0.14, UNIT_SIZE / 2, height + 0.095, 0, 0xb48250);
        }
        if (south) {
            box(0.13, 0.17, UNIT_SIZE, 0, height, UNIT_SIZE / 2, 0x99683d);
            box(0.14, 0.025, UNIT_SIZE - 0.22, 0, height + 0.095, UNIT_SIZE / 2, 0xb48250);
        }
        // Alcanzar la cara del muro vecino con un pequeño solape, sin otro poste.
        for (const [dx, dz] of wallConnections) {
            const length = UNIT_SIZE / 2 + 0.04;
            box(dx ? length : 0.13, 0.17, dz ? length : 0.13,
                dx * length / 2, height, dz * length / 2, 0x99683d);
            box(dx ? length : 0.14, 0.025, dz ? length : 0.14,
                dx * length / 2, height + 0.095, dz * length / 2, 0xb48250);
        }
    }

    const result = new THREE.BufferGeometry();
    for (const attribute of ['position', 'normal', 'color']) {
        const length = pieces.reduce((sum, piece) => sum + (attribute === 'color'
            ? piece.vertexColors.length : piece.geometry.attributes[attribute].array.length), 0);
        const values = new Float32Array(length);
        let offset = 0;
        for (const piece of pieces) {
            const source = attribute === 'color' ? piece.vertexColors : piece.geometry.attributes[attribute].array;
            values.set(source, offset);
            offset += source.length;
        }
        result.setAttribute(attribute, new THREE.BufferAttribute(values, 3));
    }
    for (const piece of pieces) piece.geometry.dispose();
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}
