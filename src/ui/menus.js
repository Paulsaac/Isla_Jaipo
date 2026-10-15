// Presentación de menús. El estado y las reglas permanecen en game.js.
export function createMenus({ onResume, onUseItem }) {
    const mainMenu = document.getElementById('main-menu');
    const pauseMenu = document.getElementById('pause-menu');
    const inventoryMenu = document.getElementById('inventory-menu');
    const dialogBox = document.getElementById('dialog-box');
    const dialogText = document.getElementById('dialog-text');
    const dialogHint = document.getElementById('dialog-hint');
    const keyCountDisplay = document.getElementById('key-count');
    const keyIcon = document.getElementById('key-icon');
    const heartIcon = document.getElementById('forest-heart-icon');
    const torchIcon = document.getElementById('torch-icon');
    const mapIcon = document.getElementById('map-icon');
    const helmetItem = document.getElementById('diving-helmet-item');
    const seaHeartIcon = document.getElementById('sea-heart-icon');
    const seaHeartCount = document.getElementById('sea-heart-count');
    const description = document.getElementById('inventory-item-description');
    const transitions = new Map();

    function setMenuVisible(menu, visible) {
        const previous = transitions.get(menu);
        if (previous?.visible === visible) return;
        if (!previous && (menu.style.display === 'flex') === visible) return;
        const panel = menu.firstElementChild;
        const currentTransform = previous ? getComputedStyle(panel).transform : null;
        previous?.animation.cancel();
        menu.style.display = 'flex';
        menu.inert = !visible;
        menu.style.pointerEvents = visible ? '' : 'none';
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            transitions.delete(menu);
            menu.style.display = visible ? 'flex' : 'none';
            return;
        }
        const animation = panel.animate([
            { transform: currentTransform || (visible ? 'translateY(100vh)' : 'translateY(0)') },
            { transform: visible ? 'translateY(0)' : 'translateY(100vh)' }
        ], { duration: 420, easing: visible ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.64, 0, 0.78, 0)', fill: 'both' });
        const transition = { animation, visible };
        transitions.set(menu, transition);
        animation.finished.then(() => {
            if (transitions.get(menu) !== transition) return;
            if (!visible) menu.style.display = 'none';
            transitions.delete(menu);
            animation.cancel();
        }).catch(() => {}); // Una reapertura cancela la transición anterior.
    }
    const itemButtons = Object.fromEntries([...inventoryMenu.querySelectorAll('[data-item]')].map(button => [button.dataset.item, button]));
    for (const [item, button] of Object.entries(itemButtons)) button.addEventListener('click', event => {
        event.stopPropagation();
        onUseItem?.(item);
    });
    description.addEventListener('click', event => event.stopPropagation());

    pauseMenu.addEventListener('click', onResume);
    pauseMenu.addEventListener('contextmenu', event => event.preventDefault());
    inventoryMenu.addEventListener('click', onResume);

    function hideForGameplay() {
        mainMenu.style.display = 'none';
        setMenuVisible(pauseMenu, false);
        setMenuVisible(inventoryMenu, false);
    }

    function showPause() { setMenuVisible(inventoryMenu, false); setMenuVisible(pauseMenu, true); }
    function showInventory() { setMenuVisible(pauseMenu, false); setMenuVisible(inventoryMenu, true); }
    function hideInventory() { setMenuVisible(inventoryMenu, false); }
    function setDialogText(entry) {
        const text = typeof entry === 'string' ? entry : entry.text;
        const highlight = typeof entry === 'string' ? null : entry.highlight;
        if (!highlight || !text.includes(highlight)) {
            dialogText.textContent = text;
            return;
        }
        dialogText.replaceChildren();
        text.split(highlight).forEach((part, index) => {
            if (index) {
                const emphasis = document.createElement('strong');
                emphasis.textContent = highlight;
                emphasis.style.color = '#87ceeb';
                emphasis.style.fontWeight = '700';
                dialogText.append(emphasis);
            }
            dialogText.append(document.createTextNode(part));
        });
    }
    function showDialog(text, { automatic = false, blurBackdrop = true, anonymous = false } = {}) {
        setDialogText(text);
        document.getElementById('dialog-name').hidden = anonymous;
        dialogBox.style.textAlign = anonymous ? 'center' : '';
        dialogHint.hidden = automatic;
        dialogBox.style.backdropFilter = blurBackdrop ? 'blur(4px)' : 'none';
        dialogBox.style.display = 'block';
    }
    function hideDialog() { dialogBox.style.display = 'none'; }
    function setKeyCount(count) {
        keyCountDisplay.innerText = count;
        keyIcon.style.display = count > 0 ? 'block' : 'none';
        keyCountDisplay.style.display = count > 0 ? 'block' : 'none';
        itemButtons.key.style.display = count > 0 ? 'block' : 'none';
    }
    function setHeartVisible(visible) { heartIcon.style.display = visible ? 'block' : 'none'; itemButtons.heart.style.display = visible ? 'block' : 'none'; }
    function setTorchVisible(visible) { torchIcon.style.display = visible ? 'block' : 'none'; itemButtons.torch.style.display = visible ? 'block' : 'none'; }
    function setMapVisible(visible) { mapIcon.style.display = visible ? 'block' : 'none'; itemButtons.map.style.display = visible ? 'block' : 'none'; }
    function setItemActive(item, active) { itemButtons[item]?.setAttribute('aria-pressed', String(active)); }
    function setItemDescription(text) { description.textContent = text; }
    function setSeaHeartState(count, complete) {
        itemButtons['sea-heart'].style.display = count > 0 ? 'block' : 'none';
        seaHeartIcon.src = complete ? './imagenes/Sprites/corazon-mar.png' : './imagenes/Sprites/fragmento-mar.png';
        seaHeartCount.textContent = complete ? '' : `${count}/10`;
        seaHeartIcon.alt = complete ? 'Corazón del Mar' : 'Fragmentos del Corazón del Mar';
        itemButtons['sea-heart'].setAttribute('aria-label',complete ? 'Seleccionar Corazón del Mar' : `Fragmentos del Corazón del Mar: ${count} de 10`);
    }
    function setHelmetState(owned, equipped, broken = false) {
        helmetItem.style.display = owned ? 'block' : 'none';
        helmetItem.setAttribute('aria-pressed', String(equipped));
        helmetItem.style.opacity = broken ? '0.4' : '1';
        const label = broken ? 'Escafandra rota — ya no puede equiparse.' : equipped ? 'Casco de escafandra — equipado. Pulsa para quitarlo.' : 'Casco de escafandra — pulsa para equiparlo.';
        helmetItem.title = label;
        helmetItem.setAttribute('aria-label', label);
    }

    return { hideForGameplay, showPause, showInventory, hideInventory, setDialogText, showDialog, hideDialog, setKeyCount, setHeartVisible, setTorchVisible, setMapVisible, setHelmetState, setSeaHeartState, setItemActive, setItemDescription };
}
