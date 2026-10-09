// Sectores visibles, con una sola llamada de dibujo por tipo de vegetación.
export function createInstanceSectors(THREE, sources, size = 64, windMargin = 0.2) {
    const group = new THREE.Group();
    group.name = 'vegetation-sectors';
    const matrix = new THREE.Matrix4(), box = new THREE.Box3();
    const entries = sources.map(mesh => {
        const original = mesh.instanceMatrix.array.slice();
        const buckets = new Map();
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        for (let index = 0; index < mesh.count; index++) {
            const key = `${Math.floor(original[index * 16 + 12] / size)},${Math.floor(original[index * 16 + 14] / size)}`;
            if (!buckets.has(key)) buckets.set(key, { indices: [], box: new THREE.Box3(), visible: null });
            const bucket = buckets.get(key);
            bucket.indices.push(index);
            matrix.fromArray(original, index * 16);
            box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix);
            bucket.box.union(box);
        }
        const sectors = [...buckets.values()];
        for (const sector of sectors) sector.sphere = sector.box.expandByScalar(windMargin).getBoundingSphere(new THREE.Sphere());
        mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        group.add(mesh);
        return { mesh, original, sectors };
    });
    const frustum = new THREE.Frustum(), projection = new THREE.Matrix4();
    const previousProjection = new Float64Array(16).fill(NaN);
    function update(camera) {
        camera.updateMatrixWorld(true);
        projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        let cameraChanged = false;
        for (let index = 0; index < 16; index++) {
            if (projection.elements[index] !== previousProjection[index]) cameraChanged = true;
            previousProjection[index] = projection.elements[index];
        }
        if (!cameraChanged) return;
        frustum.setFromProjectionMatrix(projection);
        for (const { mesh, original, sectors } of entries) {
            let changed = false;
            for (const sector of sectors) {
                const visible = frustum.intersectsSphere(sector.sphere);
                if (visible !== sector.visible) changed = true;
                sector.visible = visible;
            }
            if (!changed) continue;
            let count = 0;
            for (const sector of sectors) {
                if (!sector.visible) continue;
                for (const index of sector.indices) {
                    for (let component = 0; component < 16; component++) mesh.instanceMatrix.array[count * 16 + component] = original[index * 16 + component];
                    count++;
                }
            }
            mesh.count = count;
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    return { group, update };
}
