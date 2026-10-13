// Casco de escafandra de cobre: cúpula facetada, mirillas, rejilla y collar atornillado.
export function createDivingHelmetGeometry(THREE) {
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
    for (const x of [-0.12, 0, 0.12]) {
        add(new THREE.BoxGeometry(0.018, 2 * Math.sqrt(0.185 ** 2 - x ** 2), 0.022), 1,
            g => g.translate(x, 0.65, -0.465));
    }
    for (const y of [-0.08, 0.08]) {
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
    const result = new THREE.BufferGeometry();
    // Fusionar por material para mantener cuatro llamadas de dibujo.
    parts.sort((a, b) => a.material - b.material);
    for (const name of ['position', 'normal', 'uv']) {
        const data = new Float32Array(parts.reduce((sum, p) => sum + p.geometry.attributes[name].array.length, 0));
        let offset = 0;
        for (const part of parts) { data.set(part.geometry.attributes[name].array, offset); offset += part.geometry.attributes[name].array.length; }
        result.setAttribute(name, new THREE.BufferAttribute(data, parts[0].geometry.attributes[name].itemSize));
    }
    let start = 0;
    for (let material = 0; material < 4; material++) {
        const count = parts.filter(p => p.material === material).reduce((sum, p) => sum + p.geometry.attributes.position.count, 0);
        result.addGroup(start, count, material);
        start += count;
    }
    for (const part of parts) part.geometry.dispose();
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}
