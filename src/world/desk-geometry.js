// Escritorio con espacio para la silla y cajonera lateral.
export function createDeskGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    add(3.5,0.14,1.2,0,1.03,0,0);
    for (const z of [-0.46,0.46]) add(0.16,0.96,0.16,-1.5,0.48,z,0);
    add(0.85,0.96,1.05,1.12,0.48,0,0);
    add(2.45,0.2,0.1,-0.45,0.82,0.48,0);
    for (const y of [0.19,0.49,0.79]) {
        add(0.77,0.25,0.045,1.12,y,-0.55,0);
        add(0.23,0.045,0.07,1.12,y,-0.6,1);
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
