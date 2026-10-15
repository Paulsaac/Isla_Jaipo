// El mundo se solicita después de Enter o de tocar Comenzar.
import { musicEvents } from './systems/music-events.js';
import { isTouchMode } from './input/touch-mode.js';
import { inheritLoadingMap } from './ui/loading-screen.js';
import { requestGamePointerLock } from './input/pointer-lock.js';
let loading = false;
const startMenu = document.getElementById('main-menu');
if (isTouchMode) {
    document.body.classList.add('touch-mode');
    document.getElementById('start-text').textContent = 'Toca para comenzar';
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
    inheritLoadingMap();
    startMenu.style.display = 'none';
    const screen = document.getElementById('loading-screen');
    screen.style.display = 'flex';
    setTimeout(() => musicEvents.prepare('forest').catch(() => {}), 0);
    if (!isTouchMode) try {
        const request = requestGamePointerLock(document.body);
        if (request?.catch) request.catch(() => {});
    } catch (_) { /* El menú permite reintentar captura del ratón. */ }
    import('../game.js').catch(error => {
        if (document.pointerLockElement) document.exitPointerLock();
        screen.style.color = 'red';
        screen.textContent = 'ERROR: ' + error.message;
        console.error(error);
    });
}
document.addEventListener('keydown', start);
if (isTouchMode) startMenu.addEventListener('pointerdown', start);
