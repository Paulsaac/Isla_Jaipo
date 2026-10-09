// Mesa auxiliar de madera con cajón y tirador.
export function createSideTableGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    for (const x of [-0.39, 0.39]) for (const z of [-0.31, 0.31]) add(0.12, 0.66, 0.12, x, 0.33, z, 0);
    add(1, 0.12, 0.85, 0, 0.84, 0, 0);
    add(0.88, 0.25, 0.7, 0, 0.655, 0, 0);
    add(0.8, 0.18, 0.035, 0, 0.655, 0.3675, 0);
    add(0.12, 0.04, 0.06, 0, 0.655, 0.415, 1);
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
