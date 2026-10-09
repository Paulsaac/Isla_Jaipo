// Unir bloques contiguos de igual altura: misma silueta, sin caras interiores repetidas.
export function mergeRoofBlocks(THREE, source) {
    const size = source.geometry.parameters.width;
    const height = source.geometry.parameters.height;
    const rows = new Map(), data = source.instanceMatrix.array;
    for (let index = 0; index < source.count; index++) {
        const x = Math.round(data[index * 16 + 12] / size - 0.5);
        const z = Math.round(data[index * 16 + 14] / size - 0.5);
        if (!rows.has(z)) rows.set(z, []);
        rows.get(z).push({ x, y: data[index * 16 + 13] });
    }
    const rectangles = [];
    let active = new Map(), previousZ = -Infinity;
    for (const z of [...rows.keys()].sort((a, b) => a - b)) {
        const cells = rows.get(z).sort((a, b) => a.x - b.x);
        const runs = [];
        for (const cell of cells) {
            const last = runs[runs.length - 1];
            if (last && cell.x === last.endX + 1 && cell.y === last.y) last.endX = cell.x;
            else runs.push({ startX: cell.x, endX: cell.x, y: cell.y });
        }
        const next = new Map();
        for (const run of runs) {
            const key = `${run.startX},${run.endX},${run.y}`;
            let rectangle = z === previousZ + 1 ? active.get(key) : null;
            if (rectangle) rectangle.endZ = z;
            else {
                rectangle = { ...run, startZ: z, endZ: z };
                rectangles.push(rectangle);
            }
            next.set(key, rectangle);
        }
        active = next;
        previousZ = z;
    }
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), source.material, rectangles.length);
    const dummy = new THREE.Object3D();
    rectangles.forEach((rectangle, index) => {
        dummy.position.set((rectangle.startX + rectangle.endX + 1) * size / 2, rectangle.y, (rectangle.startZ + rectangle.endZ + 1) * size / 2);
        dummy.scale.set((rectangle.endX - rectangle.startX + 1) * size, height, (rectangle.endZ - rectangle.startZ + 1) * size);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.name = 'roof-merged-blocks';
    mesh.userData.originalBlocks = source.count;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    source.dispose();
    source.geometry.dispose();
    return mesh;
}
