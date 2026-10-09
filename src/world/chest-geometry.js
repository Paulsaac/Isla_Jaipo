// Un solo objeto interactivo: cuerpo de madera, tapa facetada, aros y cierre.
export function createChestGeometry(THREE, open = false) {
    if (open) return createOpenChestGeometry(THREE);
    const profile = new THREE.Shape();
    profile.moveTo(-0.32, -0.4);
    profile.lineTo(0.32, -0.4);
    profile.lineTo(0.32, 0.1);
    for (let step = 1; step <= 8; step++) {
        const angle = step / 8 * Math.PI;
        profile.lineTo(Math.cos(angle) * 0.32, 0.1 + Math.sin(angle) * 0.3);
    }
    profile.closePath();
    const extrude = (width, center, metal = false) => {
        const geometry = new THREE.ExtrudeGeometry(profile, { depth: width, bevelEnabled: false, steps: 1 });
        geometry.rotateY(Math.PI / 2);
        if (metal) geometry.scale(1, 1.012, 1.012);
        geometry.translate(center - width / 2, 0, 0);
        return geometry;
    };
    const latchBox = new THREE.BoxGeometry(0.1, 0.16, 0.035);
    const latch = latchBox.toNonIndexed();
    latchBox.dispose();
    latch.translate(0, 0.08, -0.337);
    const pieces = [extrude(0.8, 0), extrude(0.055, -0.26, true), extrude(0.055, 0.26, true), latch];
    return mergeChestParts(THREE, pieces, [0, 1, 1, 1]);
}

function mergeChestParts(THREE, pieces, materials) {
    const result = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) {
        const size = pieces[0].attributes[name].itemSize;
        const values = new Float32Array(pieces.reduce((total, geometry) => total + geometry.attributes[name].array.length, 0));
        let offset = 0;
        for (const geometry of pieces) {
            values.set(geometry.attributes[name].array, offset);
            offset += geometry.attributes[name].array.length;
        }
        result.setAttribute(name, new THREE.BufferAttribute(values, size));
    }
    let start = 0;
    pieces.forEach((geometry, index) => {
        result.addGroup(start, geometry.attributes.position.count, materials[index]);
        start += geometry.attributes.position.count;
        geometry.dispose();
    });
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}

function createOpenChestGeometry(THREE) {
    const pieces = [], materials = [];
    const add = (geometry, material) => { pieces.push(geometry); materials.push(material); };
    const box = (width, height, depth, x, y, z, material = 0) => {
        const indexed = new THREE.BoxGeometry(width, height, depth);
        const geometry = indexed.toNonIndexed();
        indexed.dispose();
        geometry.translate(x, y, z);
        add(geometry, material);
    };
    // Fondo y cuatro bordes dejan visible una cavidad vacía.
    box(0.8, 0.08, 0.64, 0, -0.36, 0);
    box(0.06, 0.42, 0.64, -0.37, -0.11, 0);
    box(0.06, 0.42, 0.64, 0.37, -0.11, 0);
    box(0.68, 0.42, 0.06, 0, -0.11, -0.29);
    box(0.68, 0.42, 0.06, 0, -0.11, 0.29);
    for (const x of [-0.26, 0.26]) {
        box(0.055, 0.505, 0.012, x, -0.1523, -0.326, 1);
        box(0.055, 0.505, 0.012, x, -0.1523, 0.326, 1);
    }
    const lidProfile = new THREE.Shape();
    lidProfile.moveTo(-0.32, 0.1);
    lidProfile.lineTo(0.32, 0.1);
    for (let step = 1; step <= 8; step++) {
        const angle = step / 8 * Math.PI;
        lidProfile.lineTo(Math.cos(angle) * 0.32, 0.1 + Math.sin(angle) * 0.3);
    }
    lidProfile.closePath();
    const raiseLid = geometry => {
        geometry.translate(0, -0.1, -0.32);
        geometry.rotateX(Math.PI * 0.58);
        geometry.translate(0, 0.1, 0.32);
    };
    for (const [width, x, material] of [[0.8, 0, 0], [0.055, -0.26, 1], [0.055, 0.26, 1]]) {
        const lid = new THREE.ExtrudeGeometry(lidProfile, { depth: width, bevelEnabled: false, steps: 1 });
        lid.rotateY(Math.PI / 2);
        if (material) lid.scale(1, 1.012, 1.012);
        lid.translate(x - width / 2, 0, 0);
        raiseLid(lid);
        add(lid, material);
    }
    const latchBox = new THREE.BoxGeometry(0.1, 0.16, 0.035);
    const latch = latchBox.toNonIndexed();
    latchBox.dispose();
    latch.translate(0, 0.08, -0.337);
    raiseLid(latch);
    add(latch, 1);
    return mergeChestParts(THREE, pieces, materials);
}
