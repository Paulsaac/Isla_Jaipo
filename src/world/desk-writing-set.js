// Libro abierto y útiles de escritura en coordenadas locales del escritorio.
export function createDeskWritingSet(THREE) {
    const positions = [], normals = [], colors = [];
    const add = (source, tint, x = 0, y = 0, z = 0, tilt = 0) => {
        const geometry = source.index ? source.toNonIndexed() : source;
        geometry.rotateZ(tilt);
        geometry.translate(x, y, z);
        positions.push(...geometry.attributes.position.array);
        normals.push(...geometry.attributes.normal.array);
        const color = new THREE.Color(tint);
        for (let i = 0; i < geometry.attributes.position.count; i++) colors.push(color.r, color.g, color.b);
        if (geometry !== source) source.dispose();
        geometry.dispose();
    };
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const deskTop = 1.105, bookX = 0.28, bookZ = -0.12;
    for (const side of [-1, 1]) {
        const tilt = side * 0.1, pageX = bookX + side * 0.235;
        add(box(0.47, 0.018, 0.68), 0x563828, pageX, deskTop + 0.034, bookZ, tilt);
        add(box(0.445, 0.04, 0.635), 0xd5c39b, pageX, deskTop + 0.063, bookZ, tilt);
        add(box(0.445, 0.004, 0.635), 0xf1e4c6, pageX, deskTop + 0.085, bookZ, tilt);
        // Trazos discretos sobre ambas páginas, siguiendo la inclinación del papel.
        for (let line = 0; line < 6; line++) {
            const width = [0.29, 0.25, 0.31, 0.27, 0.22, 0.3][line];
            add(box(width, 0.002, 0.008), 0x786b59, pageX,
                deskTop + 0.089, bookZ + 0.22 - line * 0.075, tilt);
        }
    }
    add(box(0.022, 0.012, 0.65), 0x9a805b, bookX, deskTop + 0.062, bookZ);

    // Mirando desde la silla (+Z), la derecha del libro queda hacia -X.
    const inkX = -0.43, inkZ = 0.28;
    const profile = [[0, 0], [0.075, 0], [0.095, 0.025], [0.09, 0.10],
        [0.048, 0.145], [0.048, 0.18], [0.032, 0.18], [0.032, 0.15]];
    add(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 8),
        0x242c39, inkX, deskTop, inkZ);
    const inkSurface = new THREE.CircleGeometry(0.032, 8);
    inkSurface.rotateX(-Math.PI / 2);
    add(inkSurface, 0x090d16, inkX, deskTop + 0.153, inkZ);
    const rim = new THREE.TorusGeometry(0.04, 0.008, 4, 8);
    rim.rotateX(Math.PI / 2);
    add(rim, 0x777c82, inkX, deskTop + 0.18, inkZ);

    const feather = new THREE.Shape();
    feather.moveTo(0, 0.23);
    for (const [x, y] of [[-0.045, 0.31], [-0.075, 0.41], [-0.065, 0.48],
        [-0.075, 0.50], [-0.045, 0.61], [0, 0.73], [0.04, 0.63],
        [0.065, 0.54], [0.045, 0.52], [0.07, 0.49], [0.05, 0.36], [0, 0.23]]) feather.lineTo(x, y);
    add(new THREE.ShapeGeometry(feather), 0xe7dfcd, inkX, deskTop + 0.13, inkZ, 0.28);
    const shaft = new THREE.CylinderGeometry(0.0035, 0.006, 0.57, 5);
    shaft.translate(0, 0.285, 0.002);
    add(shaft, 0xb8a888, inkX, deskTop + 0.13, inkZ, 0.28);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        vertexColors: true, flatShading: true, shininess: 0, side: THREE.DoubleSide
    }));
    mesh.name = 'graham-desk-writing-set';
    return mesh;
}
