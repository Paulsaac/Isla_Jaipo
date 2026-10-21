// Sectores con detalle íntegro y buffers locales: subir una zona no carga todo el mapa en GPU.
function* terrainSectorSteps(THREE, source, material, segmentsW, segmentsH, sectorSegments = 128) {
    const group = new THREE.Group();
    group.name = 'terrain-sectors';
    const verticesW = segmentsW + 1;
    const sourceIndices = source.index.array;
    for (let startZ = 0; startZ < segmentsH; startZ += sectorSegments) {
        for (let startX = 0; startX < segmentsW; startX += sectorSegments) {
            const width = Math.min(sectorSegments, segmentsW - startX);
            const height = Math.min(sectorSegments, segmentsH - startZ);
            const localWidth = width + 1;
            const vertexCount = localWidth * (height + 1);
            const geometry = new THREE.BufferGeometry();
            // Copiar filas sin recalcular normales ni UV: las costuras conservan valores idénticos.
            for (const [name, attribute] of Object.entries(source.attributes)) {
                const values = new attribute.array.constructor(vertexCount * attribute.itemSize);
                for (let row = 0; row <= height; row++) {
                    const first = ((startZ + row) * verticesW + startX) * attribute.itemSize;
                    values.set(attribute.array.subarray(first, first + localWidth * attribute.itemSize), row * localWidth * attribute.itemSize);
                }
                geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
            }
            // Misma triangulación original, con índices relativos al sector.
            const IndexArray = vertexCount <= 65536 ? Uint16Array : Uint32Array;
            const indices = new IndexArray(width * height * 6);
            for (let row = 0; row < height; row++) {
                const first = ((startZ + row) * segmentsW + startX) * 6;
                for (let index = 0; index < width * 6; index++) {
                    const original = sourceIndices[first + index];
                    const originalRow = Math.floor(original / verticesW);
                    indices[row * width * 6 + index] = (originalRow - startZ) * localWidth + original % verticesW - startX;
                }
            }
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            const positions = geometry.attributes.position.array;
            const mountainWeights = geometry.attributes.mountainWeights?.array;
            const bounds = new THREE.Box3();
            const point = new THREE.Vector3();
            let hasMountain = false;
            for (let index = 0; index < vertexCount; index++) {
                point.fromArray(positions, index * 3);
                bounds.expandByPoint(point);
                const weightIndex = index * 4;
                if (point.y > 3 || (mountainWeights && mountainWeights[weightIndex] + mountainWeights[weightIndex + 1] + mountainWeights[weightIndex + 2] > 0)) hasMountain = true;
            }
            geometry.boundingBox = bounds;
            geometry.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = `terrain-sector-${startX}-${startZ}`;
            mesh.frustumCulled = true;
            mesh.userData.hasMountain = hasMountain;
            group.add(mesh);
            yield;
        }
    }
    return group;
}
export function createTerrainSectors(...args) {
    const steps = terrainSectorSteps(...args);
    let step;
    do { step = steps.next(); } while (!step.done);
    return step.value;
}

export async function createTerrainSectorsAsync(THREE, source, material, segmentsW, segmentsH, sectorSegments, checkpoint) {
    const steps = terrainSectorSteps(THREE, source, material, segmentsW, segmentsH, sectorSegments);
    let step;
    do {
        step = steps.next();
        const pause = checkpoint();
        if (pause) await pause;
    } while (!step.done);
    return step.value;
}
