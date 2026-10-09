// Ropero de dos puertas con paneles y tiradores metálicos.
export function createWardrobeGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    for (const x of [-1.55,1.55]) for (const z of [-0.36,0.36]) add(0.18,0.16,0.18,x,0.08,z,0);
    add(3.4,0.14,1,0,0.19,0,0);
    add(3.4,0.16,1,0,2.26,0,0);
    for (const x of [-1.62,1.62]) add(0.16,1.92,0.92,x,1.22,0,0);
    add(3.08,1.92,0.1,0,1.22,-0.41,0);
    for (const x of [-0.78,0.78]) {
        add(1.52,1.88,0.12,x,1.22,0.4,0);
        for (const y of [0.77,1.67]) add(1.28,0.68,0.04,x,y,0.48,0);
    }
    for (const x of [-0.14,0.14]) add(0.055,0.24,0.08,x,1.22,0.54,1);
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
