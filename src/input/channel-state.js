// El sitio conserva la isla en su iframe y comunica qué canal está visible.
// Al abrir el juego por separado permanece activo.
let active = true;
const listeners = new Set();

export function isChannelActive() { return active; }
export function onChannelChange(listener) {
    listeners.add(listener);
    listener(active);
    return () => listeners.delete(listener);
}

window.addEventListener('message', event => {
    if (window.parent === window || event.source !== window.parent || event.origin !== location.origin
        || event.data?.type !== 'JAIPO_CHANNEL_VISIBILITY' || typeof event.data.active !== 'boolean') return;
    if (active === event.data.active) return;
    active = event.data.active;
    document.body.dataset.channelActive = String(active);
    for (const listener of listeners) listener(active);
});

document.body.dataset.channelActive = 'true';
if (window.parent !== window) window.parent.postMessage({ type: 'ISLA_CHANNEL_READY' }, location.origin);
