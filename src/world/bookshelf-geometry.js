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
    const giltLine = (x1, y1, x2, y2, z) => {
        const source = new THREE.BoxGeometry(Math.hypot(x2-x1, y2-y1), 0.004, 0.003);
        const geometry = source.toNonIndexed();
        source.dispose();
        geometry.rotateZ(Math.atan2(y2-y1, x2-x1));
        geometry.translate((x1+x2)/2, (y1+y2)/2, z);
        pieces.push({ geometry, material: 4 });
    };
    add(0.12, 2.1, 0.65, -1.69, 1.05, 0, 0);
    add(0.12, 2.1, 0.65, 1.69, 1.05, 0, 0);
    add(3.5, 2.1, 0.07, 0, 1.05, -0.29, 0);
    for (const y of [0.1, 0.75, 1.4, 2.05]) add(3.5, 0.1, 0.65, 0, y, 0, 0);
    const rows = [ [-1.31,-1.14,-0.97,-0.8,0.58,0.75,0.92], [-1.21,-1.04,-0.87,0.18,0.35,0.52,1.3], [-1.28,-1.11,-0.94,-0.77,-0.6,0.69,0.86] ];
    rows.forEach((positions, row) => positions.forEach((x, i) => {
        const height = 0.38 + ((i + row) % 3) * 0.06;
        const width = 0.14 + (i % 2) * 0.04;
        const bottom = [0.15,0.8,1.45][row];
        const material = [1,2,3,5][(i + row) % 4]; // El material 4 conserva hojas y dorados envejecidos.
        // Hojas retraídas entre tapas gruesas; el lomo conserva el color original.
        add(width-0.026, height-0.024, 0.32, x, bottom+height/2, 0.014, 4);
        for (const side of [-1, 1]) {
            add(0.013, height, 0.38, x+side*(width/2-0.0065), bottom+height/2, 0.03, material);
        }
        add(width, height, 0.048, x, bottom+height/2, 0.196, material);
        // Nervios de encuadernación y filetes de oro envejecido.
        for (const fraction of [0.09, 0.31, 0.69, 0.91]) {
            const y = bottom+height*fraction;
            add(width*0.95, 0.012, 0.012, x, y, 0.221, material);
            add(width*0.78, 0.004, 0.003, x, y, 0.229, 4);
        }
        const halfPanel = width*0.34;
        const low = bottom+height*0.37;
        const high = bottom+height*0.63;
        for (const side of [-1, 1]) giltLine(x+side*halfPanel, low, x+side*halfPanel, high, 0.223);
        giltLine(x-halfPanel, low, x+halfPanel, low, 0.223);
        giltLine(x-halfPanel, high, x+halfPanel, high, 0.223);
        // Pequeños rombos estampados, con variación entre volúmenes.
        for (const fraction of (i%2 ? [0.2, 0.5, 0.8] : [0.5])) {
            const y = bottom+height*fraction;
            const rx = width*0.15, ry = height*0.042;
            giltLine(x, y+ry, x+rx, y, 0.224);
            giltLine(x+rx, y, x, y-ry, 0.224);
            giltLine(x, y-ry, x-rx, y, 0.224);
            giltLine(x-rx, y, x, y+ry, 0.224);
        }
    }));
    // Una llamada de dibujo por material, también para los detalles del lomo.
    pieces.sort((a, b) => a.material-b.material);
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
    for (let material=0; material<6; material++) {
        const count = pieces.filter(piece => piece.material===material).reduce((sum, piece) => sum+piece.geometry.attributes.position.count, 0);
        result.addGroup(start, count, material);
        start += count;
    }
    for (const { geometry } of pieces) geometry.dispose();
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}
