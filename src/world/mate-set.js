// Utilería de mesa: dos mallas facetadas, sin texturas ni luces adicionales.
function buildMateMesh(THREE, material, name, pieces) {
    const positions = [], normals = [], colors = [];
    for (const [source, tint, x = 0, y = 0, z = 0, tilt = 0] of pieces) {
        const geometry = source.index ? source.toNonIndexed() : source;
        geometry.rotateZ(tilt);
        geometry.translate(x, y, z);
        positions.push(...geometry.attributes.position.array);
        normals.push(...geometry.attributes.normal.array);
        const color = new THREE.Color(tint);
        for (let i = 0; i < geometry.attributes.position.count; i++) colors.push(color.r, color.g, color.b);
        if (geometry !== source) source.dispose();
        geometry.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

function createMateMesh(THREE, material) {
    const cylinder = (top, bottom, height) => new THREE.CylinderGeometry(top, bottom, height, 8);
    const profile = [[0, 0], [0.075, 0], [0.115, 0.045], [0.13, 0.105], [0.1, 0.19]]
        .map(([r, y]) => new THREE.Vector2(r, y));
    const rim = new THREE.TorusGeometry(0.1, 0.012, 4, 8);
    rim.rotateX(Math.PI / 2);
    return buildMateMesh(THREE, material, 'graham-mate', [
        [new THREE.LatheGeometry(profile, 8), 0x8b4928],
        [cylinder(0.095, 0.095, 0.012), 0x657537, 0, 0.177],
        [rim, 0xc3c6bf, 0, 0.19],
        [cylinder(0.009, 0.009, 0.23), 0xc3c6bf, 0.02, 0.275, 0, -0.22],
        [new THREE.BoxGeometry(0.022, 0.05, 0.014), 0xc3c6bf, 0.05, 0.394, 0, -0.4]
    ]);
}

export function createMatePreview(THREE) {
    const material = new THREE.MeshStandardMaterial({
        vertexColors: true, flatShading: true, roughness: 0.58, metalness: 0.12
    });
    return createMateMesh(THREE, material);
}

export function createMateSet(THREE) {
    const material = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 18 });
    const cylinder = (top, bottom, height) => new THREE.CylinderGeometry(top, bottom, height, 8);
    const dark = 0x292c28, green = 0x526a52;
    const lathe = points => new THREE.LatheGeometry(points.map(([r,y]) => new THREE.Vector2(r,y)), 10);
    const spoutCurve = new THREE.CatmullRomCurve3([
        [0.17,0.16,0], [0.254,0.188,0], [0.289,0.272,0], [0.331,0.328,0], [0.394,0.342,0]
    ].map(p => new THREE.Vector3(...p)));
    const spout = new THREE.TubeGeometry(spoutCurve, 10, 0.045, 6, false);
    // Pico curvo que se afina hasta una boca abierta.
    const vertex = new THREE.Vector3();
    for (let ring=0;ring<=10;ring++) {
        const center = spoutCurve.getPointAt(ring/10);
        const taper = 1 - 0.55 * ring/10;
        for (let side=0;side<=6;side++) {
            const index = ring*7+side;
            vertex.fromBufferAttribute(spout.attributes.position,index).sub(center).multiplyScalar(taper).add(center);
            spout.attributes.position.setXYZ(index,vertex.x,vertex.y,vertex.z);
        }
    }
    spout.computeVertexNormals();
    const mouth = new THREE.CircleGeometry(0.018,6);
    const tangent = spoutCurve.getTangentAt(1);
    mouth.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),tangent));
    mouth.translate(...spoutCurve.getPointAt(1).addScaledVector(tangent,-0.006).toArray());
    const handleCurve = new THREE.CatmullRomCurve3([
        [-0.19,0.29,0], [-0.23,0.43,0], [-0.285,0.56,0], [-0.23,0.67,0],
        [0,0.72,0], [0.23,0.67,0], [0.285,0.56,0], [0.23,0.43,0], [0.19,0.29,0]
    ].map(p => new THREE.Vector3(...p)));
    const kettle = buildMateMesh(THREE, material, 'graham-kettle', [
        [lathe([[0,0],[0.19,0],[0.235,0.028],[0.24,0.07],[0.20,0.15],[0.198,0.28],[0.15,0.34],[0.125,0.35],[0,0.35]]), green],
        [cylinder(0.233,0.223,0.017), dark, 0,0.014],
        [cylinder(0.137,0.137,0.014), dark, 0,0.352],
        [lathe([[0,0.36],[0.14,0.36],[0.13,0.38],[0.10,0.405],[0.055,0.422],[0,0.425]]), green],
        [cylinder(0.027,0.022,0.033), dark, 0,0.442],
        [spout, green],
        [mouth, dark],
        [new THREE.TubeGeometry(handleCurve,16,0.014,4,false), dark],
        [new THREE.BoxGeometry(0.024,0.07,0.045), dark, -0.195,0.30],
        [new THREE.BoxGeometry(0.024,0.07,0.045), dark, 0.195,0.30]
    ]);
    const mate = createMateMesh(THREE, material);
    // Extremo oeste de la mesa, junto a la posición actual de Graham.
    kettle.scale.setScalar(0.68);
    kettle.position.set(-1.05, 1.1, 0.18);
    mate.scale.setScalar(0.72);
    mate.position.set(-1.22, 1.1, -0.25);
    const set = new THREE.Group();
    set.name = 'graham-mate-set';
    set.add(kettle, mate);
    return set;
}
