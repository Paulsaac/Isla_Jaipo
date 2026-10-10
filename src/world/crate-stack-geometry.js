// Cajas de madera en tres niveles, escalonadas en diagonal.
export function createCrateStackGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    const crate = (x, bottom, z) => {
        const w = 1.08, h = 0.62, d = 1.08;
        add(w,h,d,x,bottom+h/2,z,0);
        for (const side of [-1,1]) {
            for (const y of [bottom+0.07,bottom+h-0.07]) {
                add(w+0.04,0.09,0.045,x,y,z+side*(d/2+0.015),1);
                add(0.045,0.09,d+0.04,x+side*(w/2+0.015),y,z,1);
            }
            for (const edge of [-0.43,0.43]) {
                add(0.09,h,0.045,x+edge,bottom+h/2,z+side*(d/2+0.015),1);
                add(0.045,h,0.09,x+side*(w/2+0.015),bottom+h/2,z+edge,1);
            }
        }
    };
    for (const x of [-0.58,0.58]) for (const z of [-0.58,0.58]) crate(x,0,z);
    crate(-0.58,0.62,-0.58);
    crate(0.58,0.62,0.58);
    crate(0.2,1.24,0.2);
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
