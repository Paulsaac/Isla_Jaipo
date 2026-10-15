// Presentación de carga; las coordenadas vienen del spawn preparado por el mundo.
let zoom;
let initialBounds;
let finalTransform;

export function inheritLoadingMap() {
    const source = document.getElementById('main-menu-bg');
    const image = document.getElementById('loading-map');
    initialBounds = source.getBoundingClientRect();
    image.style.inset = 'auto';
    image.style.left = `${initialBounds.left}px`;
    image.style.top = `${initialBounds.top}px`;
    image.style.width = `${initialBounds.width}px`;
    image.style.height = `${initialBounds.height}px`;
    image.style.transformOrigin = '0 0';
}

export function focusLoadingSpawn(x, z, width, height) {
    const image = document.getElementById('loading-map');
    if (!image || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const scale = 4;
    const bounds = initialBounds || image.getBoundingClientRect();
    const dx = innerWidth / 2 - bounds.left - x / width * bounds.width * scale;
    const dy = innerHeight / 2 - bounds.top - z / height * bounds.height * scale;
    finalTransform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    const current = getComputedStyle(image).transform;
    zoom?.cancel();
    zoom = image.animate([
        { transform: current === 'none' ? 'translate(0, 0) scale(1)' : current },
        { transform: `translate(${dx * 0.85}px, ${dy * 0.85}px) scale(${1 + (scale - 1) * 0.85})` }
    ], { duration: 20000, easing: 'ease-out', fill: 'forwards' });
}

export async function finishLoadingZoom() {
    if (!zoom || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        zoom?.cancel();
        return;
    }
    const image = document.getElementById('loading-map');
    const current = getComputedStyle(image).transform;
    zoom.cancel();
    zoom = image.animate([{ transform: current }, { transform: finalTransform }], {
        duration: 900, easing: 'ease-in-out', fill: 'forwards'
    });
    await zoom.finished.catch(() => {});
    image.style.transform = finalTransform;
    zoom.cancel();
    zoom = null;
}
