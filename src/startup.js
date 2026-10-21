// Mostrar la maqueta guardada antes de cargar el mundo jugable.
import { musicEvents } from './systems/music-events.js';
import { isTouchMode } from './input/touch-mode.js';
import { requestIslandStart, setIslandPreview } from './ui/island-start.js';
import { createSavedIslandPreview } from './ui/saved-island-preview.js';
import { requestGamePointerLock } from './input/pointer-lock.js';
let loading = false;
const startMenu = document.getElementById('main-menu');
if (isTouchMode) {
    document.body.classList.add('touch-mode');
    document.getElementById('resume-hint').textContent = 'Start o toca aquí para continuar';
    document.getElementById('dialog-hint').textContent = '[B] Continuar';
    document.getElementById('keyboard-controls').style.display = 'none';
    document.getElementById('touch-guide').hidden = false;
}
function start(event) {
    if ((event.type === 'keydown' && event.code !== 'Enter') || event.repeat || loading) return;
    loading = true;
    musicEvents.unlock();
    document.removeEventListener('keydown', start);
    startMenu.removeEventListener('pointerdown', start);
    requestIslandStart();
    loadPlayableWorld();
    setTimeout(() => musicEvents.prepare('forest').catch(() => {}), 0);
    if (!isTouchMode) try {
        const request = requestGamePointerLock(document.body);
        if (request?.catch) request.catch(() => {});
    } catch (_) { /* El menú permite reintentar captura del ratón. */ }
}
document.addEventListener('keydown', start);
if (isTouchMode) startMenu.addEventListener('pointerdown', start);
// La maqueta guardada aparece antes de importar y construir el mundo jugable.
const previewReady = createSavedIslandPreview().then(preview => {
    setIslandPreview(preview);
    if (!loading) document.getElementById('start-text').textContent =
        isTouchMode ? 'Toca para comenzar' : 'Presiona Enter para jugar';
});
let worldRequested = false;
function loadPlayableWorld() {
    if (worldRequested) return;
    worldRequested = true;
    previewReady.then(() => import('../game.js')).catch(error => {
        if (document.pointerLockElement) document.exitPointerLock();
        document.getElementById('start-text').textContent =
            'No se pudo preparar la isla. Recarga para intentar de nuevo.';
        console.error(error);
    });
}
previewReady.catch(error => {
    document.getElementById('start-text').textContent =
        'No se pudo cargar la maqueta. Recarga para intentar de nuevo.';
    console.error(error);
});
