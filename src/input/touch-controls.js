export function bindTouchControls({ actions, canvas, isActive, look, pause }) {
    const root = document.getElementById('touch-controls');
    const dpad = root.querySelector('.snes-dpad');
    const directionTouches = new Map();
    const directions = ['forward', 'backward', 'left', 'right'];
    let lookPointer = null, lastX = 0, lastY = 0;

    function updateMovement() {
        const held = new Set([...directionTouches.values()].flat());
        for (const direction of directions) actions.move(direction, held.has(direction));
        for (const button of dpad.querySelectorAll('[data-direction]'))
            button.classList.toggle('pressed', held.has(button.dataset.direction));
    }
    function moveDpad(event) {
        const bounds = dpad.getBoundingClientRect();
        const x = (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
        const y = (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
        const held = [];
        if (x < -0.25) held.push('left');
        if (x > 0.25) held.push('right');
        if (y < -0.25) held.push('forward');
        if (y > 0.25) held.push('backward');
        directionTouches.set(event.pointerId, held);
        updateMovement();
    }
    dpad.addEventListener('pointerdown', event => {
        event.preventDefault();
        if (!isActive()) return;
        dpad.setPointerCapture(event.pointerId);
        moveDpad(event);
    });
    dpad.addEventListener('pointermove', event => {
        if (directionTouches.has(event.pointerId)) moveDpad(event);
    });
    function releaseDirection(event) {
        directionTouches.delete(event.pointerId); updateMovement();
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
            actions[action]?.();
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
            button.addEventListener(type, () => button.classList.remove('pressed'));
    }
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', event => {
        if (!isActive() || lookPointer !== null) return;
        event.preventDefault();
        lookPointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
        canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
        if (event.pointerId !== lookPointer || !isActive()) return;
        look(event.clientX - lastX, event.clientY - lastY);
        lastX = event.clientX; lastY = event.clientY;
    });
    function releaseLook(event) { if (event.pointerId === lookPointer) lookPointer = null; }
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
        canvas.addEventListener(type, releaseLook);

    function reset() {
        directionTouches.clear(); updateMovement(); lookPointer = null;
        for (const button of root.querySelectorAll('.pressed')) button.classList.remove('pressed');
    }
    function sync(active) {
        root.classList.toggle('touch-paused', !active);
        if (!active) reset();
    }
    window.addEventListener('blur', () => { reset(); if (isActive()) pause(); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { reset(); if (isActive()) pause(); }
    });
    root.addEventListener('contextmenu', event => event.preventDefault());
    return { reset, sync, show() { root.hidden = false; } };
}
