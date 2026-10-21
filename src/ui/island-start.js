// El gesto y la preparación del mundo pueden terminar en cualquier orden.
let savedPreview = null;
export function setIslandPreview(preview) {
    savedPreview = preview;
    if (requested) savedPreview?.startLoading();
}
export function getIslandPreview() { return savedPreview; }

let requested = false;
let resolveStart;
const startRequested = new Promise(resolve => { resolveStart = resolve; });

export function requestIslandStart() {
    if (requested) return;
    requested = true;
    const text = document.getElementById('start-text');
    text.classList.add('is-loading');
    text.setAttribute('role', 'status');
    text.setAttribute('aria-label', 'Cargando mundo...');
    text.innerHTML = 'Cargando mundo<span class="loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>';
    savedPreview?.startLoading();
    resolveStart();
}

export async function showReadyIsland(intro, hint) {
    document.getElementById('main-menu').classList.add('intro-ready');
    if (!requested) document.getElementById('start-text').textContent = hint;
    await startRequested;
    await intro.begin();
}
