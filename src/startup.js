// El mundo y sus recursos se solicitan únicamente después de Enter.
let loading = false;
document.addEventListener('keydown', function start(event) {
    if (event.code !== 'Enter' || event.repeat || loading) return;
    loading = true;
    document.removeEventListener('keydown', start);
    document.getElementById('main-menu').style.display = 'none';
    const screen = document.getElementById('loading-screen');
    screen.style.display = 'flex';
    // Solicitar el ratón dentro del gesto del usuario, antes de la carga asíncrona.
    try {
        const request = document.body.requestPointerLock();
        if (request?.catch) request.catch(() => {});
    } catch (_) { /* El menú permitirá entrar si el navegador rechaza la captura. */ }
    import('../game.js').catch(error => {
        if (document.pointerLockElement) document.exitPointerLock();
        screen.style.color = 'red';
        screen.textContent = 'ERROR: ' + error.message;
        console.error(error);
    });
});
