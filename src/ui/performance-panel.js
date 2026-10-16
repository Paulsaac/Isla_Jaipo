// Diagnóstico optativo, solo con ?perf=1. No envía datos del equipo.
export function createPerformancePanel(renderer) {
    if (new URLSearchParams(location.search).get('perf') !== '1') return null;
    const panel = document.createElement('div');
    panel.id = 'performance-panel';
    panel.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:150;max-width:90vw;padding:6px 8px;background:#000c;color:#d5ffda;font:12px monospace;white-space:pre-wrap;pointer-events:none;';
    document.body.append(panel);
    const gl = renderer.getContext();
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    let frames = 0, began = null, work = 0;
    let samples = [];
    panel.textContent = `Midiendo FPS…\nGPU: ${gpu}`;
    return {
        record(timestamp, frameStart) {
            if (document.hidden) { frames = 0; began = null; work = 0; samples = []; return; }
            if (began === null) { began = timestamp; return; }
            frames++;
            const elapsed = performance.now() - frameStart;
            work += elapsed;
            samples.push(elapsed);
            const windowMs = timestamp - began;
            if (windowMs < 2000) return;
            samples.sort((a,b) => a-b);
            const fps = frames * 1000 / windowMs;
            const p95 = samples[Math.min(samples.length-1, Math.floor(samples.length * .95))];
            panel.textContent = `FPS: ${fps.toFixed(1)} / 30 · CPU/envío: ${(work/frames).toFixed(1)} ms (p95 ${p95.toFixed(1)})\nTriángulos: ${renderer.info.render.triangles.toLocaleString('es')} · Dibujos: ${renderer.info.render.calls}\nGPU: ${gpu}`;
            frames = 0; began = timestamp; work = 0; samples = [];
        }
    };
}