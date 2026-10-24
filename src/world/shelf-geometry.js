// Mueble alto de dos puertas, sobre la misma base del antiguo estante.
export function createShelfGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    for (const x of [-0.7,0.7]) add(0.12,2.4,0.6,x,1.2,0,0);
    add(1.52,2.4,0.06,0,1.2,-0.27,0);
    for (const y of [0.1,2.35]) add(1.52,0.1,0.6,0,y,0,0);
    add(0.04,2.1,0.54,0,1.2,0,0);
    for (const x of [-0.3525,0.3525]) {
        add(0.665,2.1,0.07,x,1.2,0.29,0);
        for (const y of [0.7,1.72]) add(0.51,0.82,0.025,x,y,0.3375,0);
        for (const y of [0.48,1.93]) add(0.055,0.11,0.025,Math.sign(x)*0.66,y,0.3375,1);
    }
    for (const x of [-0.08,0.08]) add(0.035,0.2,0.06,x,1.2,0.38,1);
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
