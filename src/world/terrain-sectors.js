// Sectores con detalle íntegro. Comparten vértices, normales, UV y pesos del terreno.
export function createTerrainSectors(THREE, source, material, segmentsW, segmentsH, sectorSegments = 128) {
    const group = new THREE.Group();
    group.name = 'terrain-sectors';
    const verticesW = segmentsW + 1;
    const positions = source.attributes.position.array;
    const sourceIndices = source.index.array;
    for (let startZ = 0; startZ < segmentsH; startZ += sectorSegments) {
        for (let startX = 0; startX < segmentsW; startX += sectorSegments) {
            const width = Math.min(sectorSegments, segmentsW - startX);
            const height = Math.min(sectorSegments, segmentsH - startZ);
            const geometry = new THREE.BufferGeometry();
            for (const [name, attribute] of Object.entries(source.attributes)) geometry.setAttribute(name, attribute);
            const indices = new Uint32Array(width * height * 6);
            for (let row = 0; row < height; row++) {
                const offset = ((startZ + row) * segmentsW + startX) * 6;
                indices.set(sourceIndices.subarray(offset, offset + width * 6), row * width * 6);
            }
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            const bounds = new THREE.Box3();
            const point = new THREE.Vector3();
            for (let z = startZ; z <= startZ + height; z++) {
                for (let x = startX; x <= startX + width; x++) {
                    const index = (z * verticesW + x) * 3;
                    point.fromArray(positions, index);
                    bounds.expandByPoint(point);
                }
            }
            // Los límites pertenecen al sector, aunque los atributos estén compartidos.
            geometry.boundingBox = bounds;
            geometry.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = `terrain-sector-${startX}-${startZ}`;
            mesh.frustumCulled = true;
            group.add(mesh);
        }
    }
    return group;
}
