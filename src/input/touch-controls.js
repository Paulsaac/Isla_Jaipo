export function bindTouchControls({ actions, canvas, isActive, look, pause, canAdvanceDialogue = () => false }) {
    const root = document.getElementById('touch-controls');
    const dpad = root.querySelector('.snes-dpad');
    const directionTouches = new Map();
    const directionCaptures = new Map();
    // En teléfonos usar contactos nativos, sin depender de la captura de cada flecha.
    // Ratón/lápiz y navegadores sin Touch Events conservan Pointer Events.
    const nativeTouchInput = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNativeTouchPointer = event => nativeTouchInput && event.pointerType === 'touch';
    const runButton = root.querySelector('[data-action="run"]');
    let runLatched = false;
    const directions = ['forward', 'backward', 'left', 'right'];
    const konamiSequence = ['forward', 'forward', 'backward', 'backward', 'left', 'right', 'left', 'right', 'interact', 'jump'];
    const konamiStepTimeout = 5000;
    let konamiIndex = 0, lastKonamiStep = 0;
    function recordKonamiInput(input) {
        const now = performance.now();
        if (now - lastKonamiStep > konamiStepTimeout) konamiIndex = 0;
        if (input === konamiSequence[konamiIndex]) {
            konamiIndex++;
            lastKonamiStep = now;
            if (konamiIndex === konamiSequence.length) {
                konamiIndex = 0;
                actions.toggleFlight();
                return true;
            }
            return konamiIndex > 8;
        }
        konamiIndex = input === konamiSequence[0] ? 1 : 0;
        lastKonamiStep = now;
        return false;
    }
    let lookPointer = null, lastX = 0, lastY = 0;

    const fullscreenButton = root.querySelector('.touch-fullscreen');
    const fullscreenLabel = root.querySelector('.touch-fullscreen-label');
    const fullscreenStatus = root.querySelector('.touch-fullscreen-status');
    let fullscreenPending = false, fullscreenStatusTimer;
    let fullscreenActive = false, orientationRequest = 0;
    let backgroundExitPending = false;
    const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    function releaseOrientation() {
        ++orientationRequest;
        try { window.screen?.orientation?.unlock?.(); } catch { /* Sin bloqueo que liberar. */ }
    }
    async function exitFullscreenAfterBackground() {
        releaseOrientation();
        fullscreenPending = false;
        if (!fullscreenElement()) {
            backgroundExitPending = false;
            syncFullscreen();
            return;
        }
        backgroundExitPending = true;
        try {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) await exit.call(document);
        } catch { /* Reintentar al recuperar la pestaña. */ }
        syncFullscreen();
    }
    function showFullscreenStatus(message) {
        clearTimeout(fullscreenStatusTimer);
        fullscreenStatus.textContent = message;
        fullscreenStatus.hidden = false;
        fullscreenStatusTimer = setTimeout(() => { fullscreenStatus.hidden = true; }, 4500);
    }
    async function lockLandscape() {
        if (document.hidden || backgroundExitPending || !fullscreenElement()) return;
        const request = ++orientationRequest;
        try {
            const orientation = window.screen?.orientation;
            if (!orientation?.lock) throw new Error('Orientation lock no disponible');
            await orientation.lock('landscape');
        } catch {
            // La pantalla completa sigue funcionando aunque el navegador rechace el giro.
            if (request === orientationRequest && fullscreenActive)
                showFullscreenStatus('Activa la rotación automática y gira el celular para jugar en horizontal.');
        }
    }
    function syncFullscreen() {
        const active = !!fullscreenElement();
        if (active !== fullscreenActive) {
            fullscreenActive = active;
            if (active) {
                if (!fullscreenPending && !document.hidden && !backgroundExitPending) void lockLandscape();
            } else {
                backgroundExitPending = false;
                releaseOrientation();
                clearTimeout(fullscreenStatusTimer);
                fullscreenStatus.hidden = true;
            }
        }
        const label = active ? 'Salir de pantalla completa' : 'Pantalla completa';
        fullscreenButton.setAttribute('aria-pressed', String(active));
        fullscreenButton.setAttribute('aria-label', label);
        fullscreenButton.title = label;
        fullscreenLabel.textContent = active ? 'Salir' : 'Pantalla completa';
    }
    fullscreenButton.addEventListener('click', async event => {
        event.stopPropagation();
        if (fullscreenPending) return;
        fullscreenPending = true;
        clearTimeout(fullscreenStatusTimer);
        fullscreenStatus.hidden = true;
        try {
            // Ampliar toda la página mantiene HUD, menús y controles sobre el juego.
            if (fullscreenElement()) {
                const exit = document.exitFullscreen || document.webkitExitFullscreen;
                await exit.call(document);
            } else {
                const page = document.documentElement;
                if (page.requestFullscreen) await page.requestFullscreen({ navigationUI: 'hide' });
                else if (page.webkitRequestFullscreen) await page.webkitRequestFullscreen();
                else throw new Error('Fullscreen no disponible');
                syncFullscreen();
                if (!document.hidden && !backgroundExitPending) await lockLandscape();
            }
        } catch {
            showFullscreenStatus('Este navegador no permite activar pantalla completa aquí.');
        } finally {
            fullscreenPending = false;
            syncFullscreen();
        }
    });
    fullscreenButton.addEventListener('keydown', event => {
        if (event.code === 'Space' || event.code === 'Enter') event.stopPropagation();
    });
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    window.addEventListener('pageshow', () => {
        if (backgroundExitPending || fullscreenElement()) void exitFullscreenAfterBackground();
        else { releaseOrientation(); syncFullscreen(); }
    });
    syncFullscreen();

    function setRunLatched(active) {
        runLatched = active;
        actions.run(active);
        runButton.classList.toggle('pressed', active);
        runButton.setAttribute('aria-pressed', String(active));
    }
    function updateMovement() {
        const held = new Set([...directionTouches.values()].flat());
        if (held.size === 0 && runLatched) setRunLatched(false);
        for (const direction of directions) actions.move(direction, held.has(direction));
        for (const button of dpad.querySelectorAll('[data-direction]'))
            button.classList.toggle('pressed', held.has(button.dataset.direction));
    }
    function moveDpad(event, id = event.pointerId, update = true) {
        const newPress = !directionTouches.has(id);
        const bounds = dpad.getBoundingClientRect();
        const x = (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
        const y = (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
        const held = [];
        if (x < -0.25) held.push('left');
        if (x > 0.25) held.push('right');
        if (y < -0.25) held.push('forward');
        if (y > 0.25) held.push('backward');
        directionTouches.set(id, held);
        if (newPress && held.length === 1) recordKonamiInput(held[0]);
        if (update) updateMovement();
    }
    dpad.addEventListener('pointerdown', event => {
        if (isNativeTouchPointer(event)) return;
        event.preventDefault();
        if (!isActive()) return;
        // Conservar el receptor original evita transferencias de captura entre botón y cruceta.
        const captureTarget = event.target;
        directionCaptures.set(event.pointerId, captureTarget);
        captureTarget.setPointerCapture(event.pointerId);
        moveDpad(event);
    });
    dpad.addEventListener('pointermove', event => {
        if (directionTouches.has(event.pointerId)) moveDpad(event);
    });
    function releaseDirection(event) {
        if (isNativeTouchPointer(event)) return;
        if (event.type === 'lostpointercapture' && event.target !== directionCaptures.get(event.pointerId)) return;
        directionCaptures.delete(event.pointerId);
        if (directionTouches.delete(event.pointerId)) updateMovement();
    }
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
        dpad.addEventListener(type, releaseDirection);

    for (const button of root.querySelectorAll('[data-action]')) {
        button.addEventListener('pointerdown', event => {
            event.preventDefault();
            const action = button.dataset.action;
            if (!isActive() && !['inventory', 'pause'].includes(action)) return;
            button.setPointerCapture(event.pointerId);
            button.classList.add('pressed');
            if ((action === 'interact' || action === 'jump') && recordKonamiInput(action)) return;
            if (action === 'jump') actions.holdJump?.(true);
            if (action === 'run') {
                setRunLatched(true);
            } else actions[action]?.();
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
            button.addEventListener(type, event => {
                button.classList.toggle('pressed', button.dataset.action === 'run' && runLatched);
                if (button.dataset.action === 'jump') actions.holdJump?.(false);

            });
    }
    canvas.style.touchAction = 'none';
    canvas.style.webkitTouchCallout = 'none';
    canvas.style.userSelect = 'none';
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    canvas.addEventListener('pointerdown', event => {
        if (isNativeTouchPointer(event) || !isActive() || lookPointer !== null) return;
        event.preventDefault();
        lookPointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
        canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
        if (event.pointerId !== lookPointer || !isActive()) return;
        look(event.clientX - lastX, event.clientY - lastY);
        lastX = event.clientX; lastY = event.clientY;
    });
    function releaseLook(event) {
        if (!isNativeTouchPointer(event) && event.pointerId === lookPointer) lookPointer = null;
    }
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
        canvas.addEventListener(type, releaseLook);

    if (nativeTouchInput) {
        const touchId = touch => `touch:${touch.identifier}`;
        document.addEventListener('touchstart', event => {
            if (!isActive()) return;
            let handled = false, moved = false;
            for (const touch of event.changedTouches) {
                const id = touchId(touch);
                // El rol queda asociado al dedo inicial, no al elemento bajo su posición.
                if (dpad.contains(touch.target)) {
                    moveDpad(touch, id, false);
                    handled = moved = true;
                } else if (touch.target === canvas && lookPointer === null) {
                    lookPointer = id;
                    lastX = touch.clientX; lastY = touch.clientY;
                    handled = true;
                }
            }
            if (moved) updateMovement();
            if (handled && event.cancelable) event.preventDefault();
        }, { capture: true, passive: false });
        document.addEventListener('touchmove', event => {
            if (!isActive()) return;
            let moved = false;
            // touches incluye ambos dedos aunque el evento venga de la otra zona.
            for (const touch of event.touches) {
                const id = touchId(touch);
                if (directionTouches.has(id)) {
                    moveDpad(touch, id, false);
                    moved = true;
                } else if (lookPointer === id) {
                    const dx = touch.clientX - lastX, dy = touch.clientY - lastY;
                    lastX = touch.clientX; lastY = touch.clientY;
                    if (dx || dy) look(dx, dy);
                }
            }
            if (moved) updateMovement();
            const handled = [...event.changedTouches].some(touch =>
                directionTouches.has(touchId(touch)) || lookPointer === touchId(touch));
            if (handled && event.cancelable) event.preventDefault();
        }, { capture: true, passive: false });
        const endTouches = event => {
            let moved = false;
            for (const touch of event.changedTouches) {
                const id = touchId(touch);
                if (directionTouches.delete(id)) moved = true;
                if (lookPointer === id) lookPointer = null;
            }
            if (moved) updateMovement();
        };
        for (const type of ['touchend', 'touchcancel'])
            document.addEventListener(type, endTouches, { capture: true });
    }

    function reset() {
        konamiIndex = 0;
        setRunLatched(false);
        actions.holdJump?.(false);
        const captures = [...directionCaptures];
        const previousLook = lookPointer;
        directionTouches.clear(); directionCaptures.clear(); lookPointer = null;
        updateMovement();
        for (const [id, target] of captures) {
            if (target.hasPointerCapture(id)) target.releasePointerCapture(id);
        }
        if (typeof previousLook === 'number' && canvas.hasPointerCapture(previousLook)) canvas.releasePointerCapture(previousLook);
        for (const button of root.querySelectorAll('.pressed')) button.classList.remove('pressed');
    }
    const dialogueOverlay = document.getElementById('touch-dialog-continue');
    let dialogueVisible = false, dialoguePointer = null;
    function syncDialogue(visible) {
        if (dialogueVisible === visible) return;
        dialogueVisible = visible;
        dialoguePointer = null;
        root.classList.toggle('touch-dialogue-hidden', visible);
        document.body.classList.toggle('touch-dialogue', visible);
        dialogueOverlay.hidden = !visible;
        reset();
    }
    dialogueOverlay.addEventListener('pointerdown', event => {
        if (!dialogueVisible || dialoguePointer) return;
        event.preventDefault();
        dialogueOverlay.setPointerCapture(event.pointerId);
        dialoguePointer = { id: event.pointerId, x: event.clientX, y: event.clientY,
            lastX: event.clientX, lastY: event.clientY, moved: false };
    });
    dialogueOverlay.addEventListener('pointermove', event => {
        if (dialoguePointer?.id !== event.pointerId) return;
        if (Math.hypot(event.clientX - dialoguePointer.x, event.clientY - dialoguePointer.y) > 12)
            dialoguePointer.moved = true;
        const dx = event.clientX - dialoguePointer.lastX;
        const dy = event.clientY - dialoguePointer.lastY;
        dialoguePointer.lastX = event.clientX;
        dialoguePointer.lastY = event.clientY;
        if (dialoguePointer.moved && canAdvanceDialogue()) look(dx, dy);
    });
    dialogueOverlay.addEventListener('pointerup', event => {
        if (dialoguePointer?.id !== event.pointerId) return;
        event.preventDefault();
        const tap = !dialoguePointer.moved;
        dialoguePointer = null;
        if (tap && canAdvanceDialogue()) actions.interact();
    });
    for (const type of ['pointercancel', 'lostpointercapture'])
        dialogueOverlay.addEventListener(type, event => {
            if (dialoguePointer?.id === event.pointerId) dialoguePointer = null;
        });
    dialogueOverlay.addEventListener('keydown', event => {
        if (event.code === 'Space' || event.code === 'Enter') event.stopPropagation();
    });
    dialogueOverlay.addEventListener('click', event => {
        if (event.detail === 0 && canAdvanceDialogue()) actions.interact();
    });
    function sync(active) {
        root.classList.toggle('touch-paused', !active);
        if (!active) reset();
    }
    // Respaldo si el navegador entrega una liberación fuera del receptor inicial.
    for (const type of ['pointerup', 'pointercancel']) {
        window.addEventListener(type, releaseDirection);
        window.addEventListener(type, releaseLook);
    }
    window.addEventListener('blur', () => { reset(); if (isActive()) pause(); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            reset();
            if (isActive()) pause();
            void exitFullscreenAfterBackground();
        } else if (backgroundExitPending || fullscreenElement()) {
            void exitFullscreenAfterBackground();
        } else {
            releaseOrientation();
            syncFullscreen();
        }
    });
    root.addEventListener('contextmenu', event => event.preventDefault());
    return { reset, sync, syncDialogue, syncRun() { actions.run(runLatched); }, show() { root.hidden = false; } };
}
