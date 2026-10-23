// Presentación de menús. El estado y las reglas permanecen en game.js.
export function createMenus({ onResume, onUseItem, onDialogueCharacter }) {
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
    const dialogFontReady = document.fonts
        ? document.fonts.load('16px "Super Legend Boy"').catch(() => {}) : Promise.resolve();
    let dialogVersion = 0, dialogAnimation = null;
    let dialogTyping = null, dialogTypingTimer = null;
    const spokenCharacter = /[\p{L}\p{N}]/u;

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
    function stopDialogTyping() {
        if (dialogTypingTimer !== null) clearTimeout(dialogTypingTimer);
        dialogTypingTimer = null;
        dialogTyping = null;
    }
    function setDialogText(entry, visibleText) {
        const text = typeof entry === 'string' ? entry : entry.text;
        const highlight = typeof entry === 'string' ? null : entry.highlight;
        const shown = visibleText ?? text;
        dialogText.setAttribute('aria-label', text);
        if (!highlight || !text.includes(highlight)) {
            dialogText.textContent = shown;
            return;
        }
        dialogText.replaceChildren();
        let remaining = shown.length;
        const parts = text.split(highlight);
        parts.forEach((part, index) => {
            const visiblePart = part.slice(0, remaining);
            if (visiblePart) dialogText.append(document.createTextNode(visiblePart));
            remaining -= visiblePart.length;
            if (index < parts.length - 1 && remaining > 0) {
                const emphasis = document.createElement('strong');
                emphasis.textContent = highlight.slice(0, remaining);
                emphasis.style.color = '#87ceeb';
                emphasis.style.fontWeight = '700';
                dialogText.append(emphasis);
                remaining -= emphasis.textContent.length;
            }
        });
    }
    function completeDialogText() {
        if (!dialogTyping) return false;
        const entry = dialogTyping.entry;
        stopDialogTyping();
        setDialogText(entry);
        return true;
    }
    function showDialog(text, { automatic = false, blurBackdrop = true, anonymous = false, smooth = false, speaker = 'Graham' } = {}) {
        const version = ++dialogVersion;
        const waitForControls = !anonymous && document.body.classList.contains('touch-mode')
            && dialogBox.style.display !== 'block';
        stopDialogTyping();
        dialogAnimation?.cancel();
        dialogAnimation = null;
        function reveal() {
            if (version !== dialogVersion) return;
            // Preparar contenido, nombre y formato antes del primer fotograma visible.
            dialogBox.classList.toggle('thought-dialog', anonymous);
            dialogText.style.minHeight = '';
            setDialogText(text);
            document.getElementById('dialog-name').hidden = anonymous;
            document.getElementById('dialog-name').textContent = speaker;
            dialogBox.style.textAlign = anonymous ? 'center' : '';
            dialogHint.hidden = automatic;
            if (document.body.classList.contains('touch-mode'))
                dialogHint.textContent = anonymous ? '[B] Continuar' : '(Tocar para continuar)';
            dialogBox.style.backdropFilter = blurBackdrop ? 'blur(4px)' : 'none';
            dialogBox.style.visibility = 'hidden';
            dialogBox.style.display = 'block';
            dialogText.style.minHeight = `${dialogText.getBoundingClientRect().height}px`;
            const typewriter = !anonymous && !matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (typewriter) {
                setDialogText(text, '');
                const state = {
                    entry: text,
                    characters: Array.from(typeof text === 'string' ? text : text.text),
                    visible: '', index: 0
                };
                dialogTyping = state;
                function nextCharacter() {
                    dialogTypingTimer = null;
                    if (version !== dialogVersion || dialogTyping !== state) return;
                    const character = state.characters[state.index++];
                    state.visible += character;
                    setDialogText(text, state.visible);
                    if (spokenCharacter.test(character)) onDialogueCharacter?.(character);
                    if (state.index < state.characters.length) {
                        const previous = state.characters[state.index - 2];
                        const next = state.characters[state.index];
                        const ellipsisDot = character === '.' && (previous === '.' || next === '.');
                        const delay = character === ',' ? 190
                            : character === '…' ? 430
                            : ellipsisDot ? (next === '.' ? 300 : 430)
                            : 38;
                        dialogTypingTimer = setTimeout(nextCharacter, delay);
                    }
                    else dialogTyping = null;
                }
                if (state.characters.length) nextCharacter();
                else dialogTyping = null;
            }
            dialogBox.style.visibility = '';
            if (smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
                const animation = dialogBox.animate([
                    { opacity: 0, transform: 'translateY(6px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { duration: 160, easing: 'ease-out' });
                dialogAnimation = animation;
                animation.finished.then(() => {
                    if (dialogAnimation === animation) dialogAnimation = null;
                }).catch(() => {});
            }
        }
        if (waitForControls) {
            dialogBox.style.display = 'none';
            // Dejar un fotograma pintado con controles ocultos antes de mostrar la conversación.
            return dialogFontReady.then(() => new Promise(resolve => {
                requestAnimationFrame(() => requestAnimationFrame(() => { reveal(); resolve(); }));
            }));
        }
        if (smooth) {
            dialogBox.style.display = 'none';
            return dialogFontReady.then(reveal);
        }
        reveal();
    }
    function hideDialog() {
        ++dialogVersion;
        stopDialogTyping();
        dialogAnimation?.cancel();
        dialogAnimation = null;
        dialogBox.style.display = 'none';
    }
    function setKeyCount(count) {
        keyCountDisplay.innerText = count;
        keyIcon.style.display = count > 0 ? 'block' : 'none';
        keyCountDisplay.style.display = count > 0 ? 'block' : 'none';
        itemButtons.key.style.display = count > 0 ? 'block' : 'none';
    }
    function setHeartVisible(visible) { heartIcon.style.display = visible ? 'block' : 'none'; itemButtons.heart.style.display = visible ? 'block' : 'none'; }
    function setTorchVisible(visible) { torchIcon.style.display = visible ? 'block' : 'none'; itemButtons.torch.style.display = visible ? 'block' : 'none'; }
    function setMateVisible(visible) { itemButtons.mate.style.display = visible ? 'block' : 'none'; }
    function setTelescopeVisible(visible) {
        itemButtons.telescope.style.display = visible ? 'block' : 'none';
        itemButtons.telescope.parentElement.style.display = visible ? 'flex' : 'none';
    }
    function setPinkSunglassesState(owned, equipped) {
        const button = itemButtons['pink-sunglasses'];
        button.style.display = owned ? 'block' : 'none';
        button.setAttribute('aria-pressed', String(equipped));
        button.setAttribute('aria-label', equipped ? 'Quitar lentes de sol rosados' : 'Equipar lentes de sol rosados');
    }
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

    return { isDialogVisible() { return dialogBox.style.display === 'block'; }, completeDialogText, hideForGameplay, showPause, showInventory, hideInventory, setDialogText, showDialog, hideDialog, setKeyCount, setHeartVisible, setTorchVisible, setMapVisible, setMateVisible, setTelescopeVisible, setPinkSunglassesState, setHelmetState, setSeaHeartState, setItemActive, setItemDescription };
}
