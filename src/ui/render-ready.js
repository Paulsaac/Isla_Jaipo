// Esperar el trabajo GPU sin bloquear el hilo ni suponer que compileAsync dibuja.
export async function waitForRenderedFrame(renderer) {
    const gl = renderer.getContext();
    if (typeof gl.fenceSync !== 'function') {
        // WebGL1: solo durante preparación; la portada continúa visible en el worker.
        gl.finish();
        return;
    }
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) throw new Error('No se pudo preparar el primer fotograma.');
    gl.flush();
    const started = performance.now();
    try {
        await new Promise((resolve, reject) => {
            function check() {
                const status = gl.clientWaitSync(fence, 0, 0);
                if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) return resolve();
                if (status === gl.WAIT_FAILED || gl.isContextLost() || performance.now() - started > 30000) {
                    reject(new Error('No se pudo completar el fotograma de inicio.'));
                    return;
                }
                setTimeout(check, 8);
            }
            check();
        });
    } finally { gl.deleteSync(fence); }
}

// Three r160 admite compilar un subconjunto usando la escena real como destino.
// Mantener luces, niebla y variantes originales, cediendo entre preparaciones.
export async function prepareProgramsInBatches(THREE, renderer, world, view, checkpoint, target = null) {
    const objects = [];
    world.traverse(object => { if (object.material) objects.push(object); });
    const batch = new THREE.Group();
    // Las luces se toman solo del tercer argumento; no duplicar las del objeto.
    batch.traverseVisible = () => {};
    for (const object of objects) {
        batch.traverse = callback => callback(object);
        const previous = renderer.getRenderTarget();
        try {
            renderer.setRenderTarget(target);
            renderer.compile(batch, view, world);
        } finally { renderer.setRenderTarget(previous); }
        const pause = checkpoint();
        if (pause) await pause;
    }
    const previous = renderer.getRenderTarget();
    let ready;
    try {
        renderer.setRenderTarget(target);
        ready = renderer.compileAsync(world, view);
    } finally { renderer.setRenderTarget(previous); }
    await ready;
}
