// FogExp2 nunca llega matemáticamente al 100%; este resto es menor que un paso de color de 8 bits.
export function createFogCulling(THREE, scene, excludedRoots, residual = 0.0001) {
    const plane = new THREE.Plane();
    const direction = new THREE.Vector3(), position = new THREE.Vector3();
    const sphere = new THREE.Sphere();
    const objects = [];
    function register() {
        objects.length = 0;
        const lightAncestors = new Set();
        scene.traverse(object => {
            if (!object.isLight) return;
            for (let parent = object.parent; parent; parent = parent.parent) lightAncestors.add(parent);
        });
        function visit(object) {
            if (excludedRoots.includes(object)) return;
            const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
            // Ocultar un mueble que contiene una luz cambia NUM_SPOT_LIGHTS en
            // TODOS los materiales. Dejar que el frustum descarte su geometría;
            // la luz conserva su alcance original y el conjunto de shaders estable.
            if ((object.isMesh || object.isSprite) && !object.isInstancedMesh && !lightAncestors.has(object) && (object.visible || object.userData.visibilityEnabled === false)
                && materials.every(material => material.fog !== false)) {
                if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
                objects.push(object);
            }
            for (const child of object.children) visit(child);
        }
        visit(scene);
    }
    function update(camera) {
        camera.updateMatrixWorld(true);
        camera.getWorldPosition(position);
        camera.getWorldDirection(direction);
        const density = scene.fog?.isFogExp2 ? scene.fog.density : 0;
        const distance = density > 0 ? Math.sqrt(-Math.log(residual)) / density : camera.far;
        // La niebla usa profundidad de cámara, no distancia radial al jugador.
        plane.normal.copy(direction).negate();
        plane.constant = direction.dot(position) + distance;
        for (const object of objects) {
            object.updateWorldMatrix(true, false);
            if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
            sphere.copy(object.geometry.boundingSphere).applyMatrix4(object.matrixWorld);
            const multiplier = Math.max(1, object.userData.fogDistanceMultiplier ?? 1);
            object.visible = object.userData.visibilityEnabled !== false && plane.distanceToPoint(sphere.center) + distance * (multiplier - 1) >= -sphere.radius;
        }
        return plane;
    }
    function unregister(object) {
        const index = objects.indexOf(object);
        if (index !== -1) objects.splice(index, 1);
    }
    return { register, update, unregister };
}
