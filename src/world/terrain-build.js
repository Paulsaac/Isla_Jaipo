// Conservar buffers y resultados originales; solo cambiar dónde se calculan.
export async function createTerrainBuild(THREE, width, depth, segmentsW, segmentsH) {
    if (typeof Worker === 'undefined') {
        const geometry = new THREE.PlaneGeometry(width, depth, segmentsW, segmentsH);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(width / 2, 0, depth / 2);
        return { geometry, async computeNormals() { geometry.computeVertexNormals(); } };
    }
    const worker = new Worker(new URL('./terrain-build-worker.js', import.meta.url), {type:'module'});
    function request(message, transfers = []) {
        return new Promise((resolve, reject) => {
            worker.onmessage = ({data}) => data.error ? reject(new Error(data.error)) : resolve(data);
            worker.onerror = event => reject(new Error(event.message || 'Falló la preparación del terreno.'));
            worker.postMessage(message, transfers);
        });
    }
    function apply(geometry, data) {
        for (const [name, attribute] of Object.entries(data.attributes)) {
            geometry.setAttribute(name, new THREE.BufferAttribute(attribute.array, attribute.itemSize, attribute.normalized));
        }
        geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    }
    try {
        const imports = JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports;
        const data = await request({type:'grid',threeUrl:new URL(imports.three,document.baseURI).href,
            width,depth,segmentsW,segmentsH});
        const geometry = new THREE.BufferGeometry();
        apply(geometry, data);
        return { geometry, async computeNormals() {
            try {
                const positions = geometry.attributes.position.array, indices = geometry.index.array;
                const normals = geometry.attributes.normal.array;
                apply(geometry, await request({type:'normals',positions,indices,normals}, [positions.buffer,indices.buffer,normals.buffer]));
            } finally { worker.terminate(); }
        } };
    } catch (error) { worker.terminate(); throw error; }
}
