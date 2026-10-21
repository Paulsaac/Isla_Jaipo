// Misma geometría Three.js; cálculo pesado fuera del hilo que presenta la portada.
let THREE;
self.onmessage = async ({data}) => {
    try {
        let geometry;
        if (data.type === 'grid') {
            THREE = await import(data.threeUrl);
            geometry = new THREE.PlaneGeometry(data.width, data.depth, data.segmentsW, data.segmentsH);
            geometry.rotateX(-Math.PI / 2);
            geometry.translate(data.width / 2, 0, data.depth / 2);
        } else {
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
            geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
            geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
            geometry.computeVertexNormals();
        }
        const attributes = Object.fromEntries(Object.entries(geometry.attributes).map(([name, attribute]) =>
            [name, { array: attribute.array, itemSize: attribute.itemSize, normalized: attribute.normalized }]));
        const indices = geometry.index.array;
        self.postMessage({attributes,indices}, [...Object.values(attributes).map(a => a.array.buffer), indices.buffer]);
        geometry.dispose();
    } catch (error) { self.postMessage({error:error.message}); }
};
