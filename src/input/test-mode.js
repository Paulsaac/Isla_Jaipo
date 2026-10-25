// Estado de prueba compartido entre portada, controles y filtros; solo dura esta sesión.
let enabled = false;
const listeners = new Set();
export const testMode = {
    get enabled() { return enabled; },
    toggle() {
        enabled = !enabled;
        document.body.classList.toggle('test-mode', enabled);
        for (const listener of listeners) listener(enabled);
    },
    subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
};

export function createTestModeSequence(onToggle) {
    const keys = ['KeyW', 'KeyW', 'KeyS', 'KeyS', 'KeyA', 'KeyD', 'KeyA', 'KeyD'];
    let index = 0;
    return {
        press(event) {
            if (event.repeat || event.ctrlKey || event.altKey || event.metaKey
                || event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
            if (event.code !== keys[index]) { index = 0; return; }
            if (++index === keys.length) { index = 0; onToggle(); }
        },
        reset() { index = 0; }
    };
}
