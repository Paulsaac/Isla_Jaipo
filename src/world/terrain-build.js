// Conservar buffers y resultados originales; solo cambiar dónde se calculan.
export async function createTerrainBuild(THREE, width, depth, segmentsW, segmentsH) {
    function compatibleBuild() {
        const geometry = new THREE.PlaneGeometry(width, depth, segmentsW, segmentsH);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(width / 2, 0, depth / 2);
        return { geometry, async computeNormals() { geometry.computeVertexNormals(); } };
    }
    if (typeof Worker === 'undefined') return compatibleBuild();
    let worker;
    function request(message,transfers=[]) {
        return new Promise((resolve, reject) => {
            const timer=setTimeout(()=>reject(new Error('El preparador del terreno dejó de responder.')),message.type==='grid'?12000:30000);
            const finish=(error,data)=>{clearTimeout(timer);error?reject(error):resolve(data);};
            worker.onmessage = ({data}) => finish(data.error?new Error(data.error):null,data);
            worker.onerror = event => {event.preventDefault();finish(new Error(event.message || 'Falló la preparación del terreno.'));};
            worker.onmessageerror=()=>finish(new Error('No se pudo recibir el terreno preparado.'));
            try { worker.postMessage(message,transfers); } catch(error) { finish(error); }
        });
    }
    function apply(geometry, data) {
        for (const [name, attribute] of Object.entries(data.attributes)) {
            geometry.setAttribute(name, new THREE.BufferAttribute(attribute.array, attribute.itemSize, attribute.normalized));
        }
        geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    }
    try {
        worker = new Worker(new URL('./terrain-build-worker.js', import.meta.url), {type:'module'});
        const imports = JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports;
        const data = await request({type:'grid',threeUrl:new URL(imports.three,document.baseURI).href,
            width,depth,segmentsW,segmentsH});
        const geometry = new THREE.BufferGeometry();
        apply(geometry, data);
        return { geometry, async computeNormals() {
            try {
                const positions = geometry.attributes.position.array, indices = geometry.index.array;
                const normals = geometry.attributes.normal.array;
                apply(geometry, await request({type:'normals',positions,indices,normals},[positions.buffer,indices.buffer,normals.buffer]));
            } finally { worker.terminate(); }
        } };
    } catch (error) {
        worker?.terminate();
        console.warn('Terreno: se continúa en modo compatible.',error);
        await new Promise(resolve=>setTimeout(resolve,0));
        return compatibleBuild();
    }
}
