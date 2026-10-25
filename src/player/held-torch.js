// Antorcha en mano izquierda con el mismo sprite animado que las antorchas del mundo.
export function createHeldTorch(THREE, frames, camera) {
    const object = new THREE.Group();
    object.name = 'held-torch-left';
    object.renderOrder = 1000;
    object.visible = false;
    const base = frames[0];
    const shaftMap = base.clone();
    shaftMap.repeat.set(2 / 20, 10 / 20);
    shaftMap.offset.set(9 / 20, 0);
    shaftMap.needsUpdate = true;
    const headMap = base.clone();
    headMap.repeat.set(6 / 20, 1 / 20);
    headMap.offset.set(7 / 20, 10 / 20);
    headMap.needsUpdate = true;
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.34), new THREE.MeshPhongMaterial({
        map: shaftMap, transparent: true, alphaTest: 0.03, depthTest: false, depthWrite: false,
        fog: false, side: THREE.DoubleSide, shininess: 0
    }));
    shaft.position.y = -0.10;
    const head = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.075), new THREE.MeshPhongMaterial({
        map: headMap, transparent: true, alphaTest: 0.03, depthTest: false, depthWrite: false,
        fog: false, side: THREE.DoubleSide, shininess: 0
    }));
    head.position.y = 0.105;
    object.add(shaft, head);
    const flameMaps = frames.map(frame => {
        const map = frame.clone();
        map.repeat.set(6 / 20, 8 / 20);
        map.offset.set(7 / 20, 12 / 20);
        map.needsUpdate = true;
        return map;
    });
    const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.22), new THREE.MeshPhongMaterial({
        map: flameMaps[0], emissive: 0xff9a30, emissiveMap: flameMaps[0],
        transparent: true, alphaTest: 0.03, depthTest: false, depthWrite: false,
        fog: false, side: THREE.DoubleSide, shininess: 0
    }));
    flame.position.y = 0.215;
    flame.visible = false;
    object.add(flame);
    camera.add(object);

    return {
        object,
        update(frameIndex, visible, lit) {
            object.visible = visible && lit;
            flame.visible = visible && lit;
            const map = flameMaps[frameIndex];
            if (flame.material.map !== map) flame.material.map = flame.material.emissiveMap = map;
            const distance = 0.68;
            const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
            const halfWidth = halfHeight * camera.aspect;
            const height = Math.min(0.52, halfHeight * 1.05);
            const scale = height / 0.56;
            const width = 0.18 * scale;
            const edgePadding = Math.min(0.04, halfWidth * 0.08);
            object.scale.setScalar(scale);
            object.position.set(-halfWidth + width * 0.52 + edgePadding,
                -halfHeight + height * 0.55 + Math.min(0.035, halfHeight * 0.08) - height * 0.20, -distance);
            object.rotation.set(0, 0, 0.18);
        }
    };
}
