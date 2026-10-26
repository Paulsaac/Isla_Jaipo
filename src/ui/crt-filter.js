import { testMode } from '../input/test-mode.js';

let enabled = true;
function refresh() {
    document.body.classList.toggle('crt-disabled', !enabled);
}
export const crtFilter = {
    toggle() { enabled = !enabled; refresh(); }
};
// B físico pertenece al modo de prueba; B táctil conserva interacción.
document.addEventListener('keydown', event => {
    if (!testMode.enabled || event.code !== 'KeyB' || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    const target=event.target;
    if (target?.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(target?.tagName)) return;
    event.preventDefault();
    crtFilter.toggle();
});
