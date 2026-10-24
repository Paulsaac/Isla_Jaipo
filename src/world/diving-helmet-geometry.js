// Casco de escafandra de cobre: cúpula facetada, mirillas, rejilla y collar atornillado.
export function createDivingHelmetMaterials(THREE, { broken = false, cracked = broken } = {}) {
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0x9f7542, shininess: 22, flatShading: true }),
        new THREE.MeshPhongMaterial({ color: 0xc39b58, shininess: 28, flatShading: true }),
        new THREE.MeshPhongMaterial({ color: broken ? 0x1a292d : 0x153139, shininess: 45 }),
        new THREE.MeshPhongMaterial({ color: 0x516c5d, shininess: 10, flatShading: true })
    ];
    if (cracked || broken) materials.push(
        new THREE.MeshBasicMaterial({ color: 0x211713, side: THREE.DoubleSide, toneMapped: false }),
        new THREE.MeshBasicMaterial({ color: 0xb6cbbf, side: THREE.DoubleSide, toneMapped: false })
    );
    return materials;
}

export function createDivingHelmetGeometry(THREE, { broken = false, cracked = broken } = {}) {
    const parts = [];
    function add(geometry, material, transform) {
        if (transform) transform(geometry);
        const flat = geometry.index ? geometry.toNonIndexed() : geometry;
        if (flat !== geometry) geometry.dispose();
        parts.push({ geometry: flat, material });
    }
    add(new THREE.CylinderGeometry(0.42, 0.55, 0.18, 12), 0, g => g.translate(0, 0.09, 0));
    add(new THREE.CylinderGeometry(0.28, 0.34, 0.18, 12), 1, g => g.translate(0, 0.24, 0));
    add(new THREE.SphereGeometry(0.42, 12, 8), 0, g => { g.scale(1, 1.05, 1); g.translate(0, 0.62, 0); });
    // Mirilla frontal orientada hacia -Z.
    add(new THREE.CylinderGeometry(0.24, 0.21, 0.12, 12), 0,
        g => { g.rotateX(-Math.PI / 2); g.translate(0, 0.65, -0.38); });
    add(new THREE.CircleGeometry(0.19, 12), 2, g => { g.rotateY(Math.PI); g.translate(0, 0.65, -0.447); });
    add(new THREE.TorusGeometry(0.205, 0.035, 6, 12), 1, g => g.translate(0, 0.65, -0.44));
    // Dos barras por eje: mismo cuadro central libre y proporciones que el icono.
    for (const x of [-0.074, 0.074]) {
        add(new THREE.BoxGeometry(0.018, 2 * Math.sqrt(0.185 ** 2 - x ** 2), 0.022), 1,
            g => g.translate(x, 0.65, -0.465));
    }
    for (const y of [-0.062, 0.062]) {
        add(new THREE.BoxGeometry(2 * Math.sqrt(0.185 ** 2 - y ** 2), 0.018, 0.022), 1,
            g => g.translate(0, 0.65 + y, -0.465));
    }
    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        add(new THREE.SphereGeometry(0.018, 6, 4), 1,
            g => g.translate(Math.cos(angle) * 0.24, 0.65 + Math.sin(angle) * 0.24, -0.445));
        add(new THREE.CylinderGeometry(0.035, 0.035, 0.045, 6), 1,
            g => g.translate(Math.cos(angle) * 0.46, 0.185, Math.sin(angle) * 0.46));
    }
    for (const side of [-1, 1]) {
        add(new THREE.CylinderGeometry(0.125, 0.125, 0.08, 12), 1,
            g => { g.rotateZ(Math.PI / 2); g.translate(side * 0.405, 0.63, 0); });
        add(new THREE.CircleGeometry(0.095, 12), 2,
            g => { g.rotateY(side * Math.PI / 2); g.translate(side * 0.447, 0.63, 0); });
    }
    add(new THREE.CylinderGeometry(0.075, 0.09, 0.18, 8), 3,
        g => { g.rotateX(Math.PI / 2); g.translate(0, 0.5, 0.43); });
    if (cracked || broken) {
        // Las fracturas están solo en el cristal, por detrás de la rejilla.
        function fracture(path, width, material) {
            const vertices = [];
            const z = material === 5 ? -0.452 : -0.451;
            for (let i = 1; i < path.length; i++) {
                const [ax, ay] = path[i - 1], [bx, by] = path[i];
                const length = Math.hypot(bx - ax, by - ay);
                const nx = -(by - ay) * width / (2 * length), ny = (bx - ax) * width / (2 * length);
                const corners = [[ax - nx, ay - ny, z], [bx - nx, by - ny, z],
                    [ax + nx, ay + ny, z], [bx + nx, by + ny, z]];
                for (const index of [0, 1, 2, 2, 1, 3]) vertices.push(...corners[index]);
            }
            if (!vertices.length) return;
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(vertices.length / 3 * 2), 2));
            geometry.computeVertexNormals(); add(geometry, material);
        }
        // Mismo dibujo ramificado del icono, expresado sobre el cristal frontal.
        const glassPaths = [
            [[42,21],[38,25],[40,29],[37,32]],
            [[38,25],[35,24],[34,20]], [[40,29],[44,28]]
        ];
        if (broken) glassPaths.push(
            [[22,24],[29,28],[31,32],[37,34],[34,39],[39,43]],
            [[31,32],[25,34],[22,39]], [[37,34],[42,31],[45,32]]
        );
        for (const path of glassPaths) {
            const points = path.map(([x,y]) => [(32 - x) * 0.19 / 15, 0.65 - (y - 31) * 0.19 / 15]);
            fracture(points, 0.012, 4); fracture(points, 0.004, 5);
        }
    }
    const result = new THREE.BufferGeometry();
    // Cuatro materiales en el casco intacto; dos más solo para las fracturas del roto.
    parts.sort((a, b) => a.material - b.material);
    for (const name of ['position', 'normal', 'uv']) {
        const data = new Float32Array(parts.reduce((sum, p) => sum + p.geometry.attributes[name].array.length, 0));
        let offset = 0;
        for (const part of parts) { data.set(part.geometry.attributes[name].array, offset); offset += part.geometry.attributes[name].array.length; }
        result.setAttribute(name, new THREE.BufferAttribute(data, parts[0].geometry.attributes[name].itemSize));
    }
    let start = 0;
    for (let material = 0; material < (cracked || broken ? 6 : 4); material++) {
        const count = parts.filter(p => p.material === material).reduce((sum, p) => sum + p.geometry.attributes.position.count, 0);
        result.addGroup(start, count, material);
        start += count;
    }
    for (const part of parts) part.geometry.dispose();
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}
