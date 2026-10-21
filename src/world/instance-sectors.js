// Sectores visibles, con una sola llamada de dibujo por tipo de vegetación.
function* instanceSectorSteps(THREE, sources, size = 64, windMargin = 0.2) {
    const group = new THREE.Group();
    group.name = 'vegetation-sectors';
    const matrix = new THREE.Matrix4(), box = new THREE.Box3();
    const entries = [];
    for (const mesh of sources) {
        const original = mesh.instanceMatrix.array.slice();
        const buckets = new Map();
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        for (let index = 0; index < mesh.count; index++) {
            if ((index & 1023) === 0) yield;
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
        const sourceToSlot = new Int32Array(mesh.count).fill(-1);
        const slotToSource = new Int32Array(mesh.count);
        const dirty = new Uint8Array(Math.ceil(mesh.count / 64));
        mesh.count = 0;
        entries.push({ mesh, original, sectors, sourceToSlot, slotToSource, dirty });
    }
    const frustum = new THREE.Frustum(), projection = new THREE.Matrix4();
    const previousProjection = new Float64Array(16).fill(NaN);
    let previousFogConstant = NaN, previousMaxDistance = NaN;
    const cameraPosition = new THREE.Vector3();
    function update(camera, fogPlane = null, maxDistance = Infinity) {
        camera.updateMatrixWorld(true);
        projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        let cameraChanged = false;
        for (let index = 0; index < 16; index++) {
            if (projection.elements[index] !== previousProjection[index]) cameraChanged = true;
            previousProjection[index] = projection.elements[index];
        }
        const fogConstant = fogPlane?.constant ?? null;
        if (fogConstant !== previousFogConstant) cameraChanged = true;
        previousFogConstant = fogConstant;
        if (maxDistance !== previousMaxDistance) cameraChanged = true;
        previousMaxDistance = maxDistance;
        if (!cameraChanged) return;
        camera.getWorldPosition(cameraPosition);
        frustum.setFromProjectionMatrix(projection);
        for (const { mesh, original, sectors, sourceToSlot, slotToSource, dirty } of entries) {
            let changed = false;
            for (const sector of sectors) {
                const visible = frustum.intersectsSphere(sector.sphere)
                    && sector.sphere.center.distanceToSquared(cameraPosition) <= (maxDistance + sector.sphere.radius) ** 2
                    && (!fogPlane || fogPlane.distanceToPoint(sector.sphere.center) >= -sector.sphere.radius);
                sector.changed = visible !== sector.visible;
                if (sector.changed) changed = true;
                sector.visible = visible;
            }
            if (!changed) continue;
            let count = mesh.count;
            dirty.fill(0);
            // Retirar solo lo que salió; llenar sus huecos con las últimas instancias.
            for (const sector of sectors) {
                if (!sector.changed || sector.visible) continue;
                for (const index of sector.indices) {
                    const slot = sourceToSlot[index];
                    if (slot < 0) continue;
                    const last = --count;
                    if (slot !== last) {
                        const moved = slotToSource[last];
                        mesh.instanceMatrix.array.set(original.subarray(moved * 16, moved * 16 + 16), slot * 16);
                        slotToSource[slot] = moved;
                        sourceToSlot[moved] = slot;
                        dirty[Math.floor(slot / 64)] = 1;
                    }
                    sourceToSlot[index] = -1;
                }
            }
            // Los sectores que siguen visibles conservan sus matrices y posiciones GPU.
            for (const sector of sectors) {
                if (!sector.changed || !sector.visible) continue;
                for (const index of sector.indices) {
                    mesh.instanceMatrix.array.set(original.subarray(index * 16, index * 16 + 16), count * 16);
                    sourceToSlot[index] = count;
                    slotToSource[count] = index;
                    dirty[Math.floor(count / 64)] = 1;
                    count++;
                }
            }
            mesh.count = count;
            let wrote = false;
            // Agrupar bloques sucios evita una llamada GPU por cada matriz movida.
            // Conservar rangos previos si todavía no hubo render entre actualizaciones.
            for (let block = 0; block * 64 < count; block++) {
                if (!dirty[block]) continue;
                const start = block;
                while ((block + 1) * 64 < count && dirty[block + 1]) block++;
                const first = start * 64 * 16;
                const end = Math.min((block + 1) * 64, count) * 16;
                mesh.instanceMatrix.addUpdateRange(first, end - first);
                wrote = true;
            }
            if (wrote) mesh.instanceMatrix.needsUpdate = true;
        }
    }
    return { group, update };
}

export function createInstanceSectors(...args) {
    const steps = instanceSectorSteps(...args);
    let step;
    do { step = steps.next(); } while (!step.done);
    return step.value;
}

export async function createInstanceSectorsAsync(THREE, sources, size, windMargin, checkpoint) {
    const steps = instanceSectorSteps(THREE, sources, size, windMargin);
    let step;
    do {
        step = steps.next();
        const pause = checkpoint();
        if (pause) await pause;
    } while (!step.done);
    return step.value;
}
