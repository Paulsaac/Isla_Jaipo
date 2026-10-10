// Cajonera de dos niveles con tiradores metálicos.
export function createDresserGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    for (const x of [-1.4,1.4]) for (const z of [-0.35,0.35]) add(0.16,0.16,0.16,x,0.08,z,0);
    add(3.2,1.12,0.9,0,0.72,0,0);
    add(3.4,0.12,1,0,1.34,0,0);
    for (const y of [0.45,0.99]) {
        add(3.04,0.48,0.06,0,y,0.48,0);
        for (const x of [-0.8,0.8]) add(0.27,0.055,0.08,x,y,0.55,1);
    }
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
