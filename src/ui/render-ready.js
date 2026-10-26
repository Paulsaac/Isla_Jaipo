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
export async function prepareProgramsInBatches(THREE, renderer, world, view, checkpoint, target = null, cancelled = () => false) {
    const objects = [];
    world.traverse(object => { if (object.material) objects.push(object); });
    const batch = new THREE.Group();
    // Las luces se toman solo del tercer argumento; no duplicar las del objeto.
    batch.traverseVisible = () => {};
    for (const object of objects) {
        if (cancelled()) return;
        batch.traverse = callback => callback(object);
        const previous = renderer.getRenderTarget();
        try {
            renderer.setRenderTarget(target);
            renderer.compile(batch, view, world);
            // El fundido cambia OPAQUE y, en materiales de dos caras, las pasadas.
            // Preparar ambos estados antes de que el jugador se sumerja o emerja.
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            const fading = materials.filter(material => material.userData.preloadTransparency);
            const transparencies = fading.map(material => material.transparent);
            try {
                fading.forEach(material => { material.transparent = !material.transparent; material.needsUpdate = true; });
                if (fading.length) renderer.compile(batch, view, world);
            } finally {
                fading.forEach((material, index) => { material.transparent = transparencies[index]; material.needsUpdate = true; });
            }
        } finally { renderer.setRenderTarget(previous); }
        const pause = checkpoint();
        if (pause) await pause;
    }
    // compileAsync de r160 espera solo currentProgram de cada material. Un mismo
    // material puede haber creado varias variantes (instancias, caras y fundido).
    // Esperar todas evita bloquear getProgramInfoLog al dibujarlas por primera vez.
    const pending = new Set(renderer.info.programs);
    const gl = renderer.getContext(), started = performance.now();
    while (pending.size) {
        for (const program of pending) {
            if (cancelled()) return;
            if (!program.isReady()) continue;
            program.getUniforms();
            program.getAttributes();
            pending.delete(program);
            const pause = checkpoint();
            if (pause) await pause;
        }
        if (gl.isContextLost() || performance.now() - started > 60000) throw new Error('No se pudieron preparar los programas gráficos.');
        if (pending.size) await new Promise(resolve => setTimeout(resolve, 8));
    }
}
