// Librero de tres niveles, con libros y estructura en un único modelo.
export function createBookshelfGeometry(THREE) {
    const pieces = [];
    const add = (width, height, depth, x, y, z, material) => {
        const box = new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    add(0.12, 2.1, 0.65, -1.69, 1.05, 0, 0);
    add(0.12, 2.1, 0.65, 1.69, 1.05, 0, 0);
    add(3.5, 2.1, 0.07, 0, 1.05, -0.29, 0);
    for (const y of [0.1, 0.75, 1.4, 2.05]) add(3.5, 0.1, 0.65, 0, y, 0, 0);
    const rows = [ [-1.4,-1.18,-0.94,-0.68,0.5,0.74,1.02], [-1.3,-1.04,-0.78,0.1,0.34,0.6,1.3], [-1.42,-1.18,-0.94,-0.7,-0.46,0.65,0.9] ];
    rows.forEach((positions, row) => positions.forEach((x, i) => {
        const height = 0.38 + ((i + row) % 3) * 0.06;
        const width = 0.14 + (i % 2) * 0.04;
        const bottom = [0.15,0.8,1.45][row];
        const material = 1 + ((i + row) % 3);
        add(width, height, 0.38, x, bottom + height/2, 0.03, material);
        add(width * 0.72, 0.025, 0.012, x, bottom + height * 0.75, 0.226, 4);
    }));
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
