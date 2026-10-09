// Cama de dos celdas: estructura, colchón, almohada y manta en un único modelo.
export function createBedGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    for (const x of [-0.65, 0.65]) for (const z of [-1.55, 1.55]) add(0.16, 0.4, 0.16, x, 0.2, z, 0);
    add(1.6, 0.22, 3.6, 0, 0.46, 0, 0);
    add(1.6, 1.18, 0.14, 0, 0.8, -1.75, 0);
    add(1.6, 0.45, 0.12, 0, 0.55, 1.75, 0);
    add(1.45, 0.26, 3.35, 0, 0.7, 0, 1);
    add(1.46, 0.04, 2.35, 0, 0.85, 0.4, 2);
    add(1.05, 0.18, 0.6, 0, 0.92, -1.12, 1);
    const result = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) {
        const values = new Float32Array(pieces.reduce((sum, piece) => sum + piece.geometry.attributes[name].array.length, 0));
        let offset = 0;
        for (const { geometry } of pieces) {
            values.set(geometry.attributes[name].array, offset);
            offset += geometry.attributes[name].array.length;
        }
        result.setAttribute(name, new THREE.BufferAttribute(values, pieces[0].geometry.attributes[name].itemSize));
    }
    let start = 0;
    for (const { geometry, material } of pieces) {
        result.addGroup(start, geometry.attributes.position.count, material);
        start += geometry.attributes.position.count;
        geometry.dispose();
    }
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}
