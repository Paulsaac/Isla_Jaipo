// Presentación del HUD; no calcula resistencia ni decide interacciones o muerte.
export function createHud() {
    const message = document.getElementById('interaction-msg');
    const coordinates = document.getElementById('position-coordinates');
    let coordinatesText = '';
    let coordinatesVisible = false;
    const staminaContainer = document.getElementById('stamina-container');
    const staminaBar = document.getElementById('stamina-bar');
    const deathScreen = document.getElementById('death-screen');
    const itemNotification = document.getElementById('item-notification');
    const pendingItems = [];
    const helmetView = document.getElementById('diving-helmet-view');
    const underwaterTint = document.getElementById('underwater-tint');
    const lensModeName = document.getElementById('lens-mode-name');
    let lensModeTimer = null;
    function showLensMode(name) {
        if (lensModeTimer !== null) clearTimeout(lensModeTimer);
        lensModeName.textContent = `Lentes: ${name} · V para cambiar`;
        lensModeName.style.opacity = '1';
        lensModeTimer = setTimeout(() => { lensModeTimer = null; lensModeName.style.opacity = '0'; }, 2000);
    }
    let underwaterTintOpacity = -1;
    const airContainer = document.getElementById('diving-air-container');
    const airBar = document.getElementById('diving-air-bar');
    const airText = document.getElementById('diving-air-text');
    const airTrack = document.getElementById('diving-air-track');
    let displayedAir = null;
    let helmetViewVisible = false;
    let itemTimer = null;

    function showNextItem() {
        if (!pendingItems.length) {
            itemNotification.style.display = 'none';
            itemTimer = null;
            return;
        }
        itemNotification.textContent = pendingItems.shift();
        itemNotification.style.display = 'block';
        itemTimer = setTimeout(showNextItem, 3500);
    }

    function showReceivedItem(name) {
        showNotification(`Has recibido ${name}`);
    }

    function showNotification(text) {
        pendingItems.push(text);
        if (itemTimer === null) showNextItem();
    }

    function showInteraction() { message.style.display = 'block'; }
    function hideInteraction() { message.style.display = 'none'; }
    function setInteractionText(text) {
        message.innerText = document.body.classList.contains('touch-mode') ? text.replaceAll('Presiona E', 'Pulsa B') : text;
    }
    function setInteractionColor(color) { message.style.color = color; }
    function showStamina() { staminaContainer.style.display = 'block'; }
    function hideStamina() { staminaContainer.style.display = 'none'; }
    function updateStamina(value, maximum) {
        if (staminaContainer.style.display === 'block') {
            staminaBar.style.width = (value / maximum * 100) + '%';
        }
    }
    function showDeath() { deathScreen.style.display = 'flex'; }
    function hideDeath() { deathScreen.style.display = 'none'; }
    function setHelmetViewVisible(visible) {
        if (visible === helmetViewVisible) return;
        helmetViewVisible = visible;
        helmetView.style.display = visible ? 'block' : 'none';
    }
    function showDivingAir(remaining, maximum) {
        airContainer.style.display = 'block';
        airTrack.setAttribute('aria-valuemax', maximum);
        airBar.style.width = `${remaining / maximum * 100}%`;
        airBar.style.backgroundColor = remaining <= 6 ? '#e39b55' : '#81cedf';
        const seconds = Math.ceil(remaining);
        if (seconds !== displayedAir) {
            displayedAir = seconds;
            airText.textContent = `Aire: ${seconds} s`;
            airTrack.setAttribute('aria-valuenow', seconds);
        }
    }
    function hideDivingAir() { airContainer.style.display = 'none'; }
    function setUnderwaterTint(amount) {
        const opacity = Math.round(amount * 100) / 100;
        if(opacity===underwaterTintOpacity) return;
        underwaterTintOpacity=opacity;
        underwaterTint.style.opacity=opacity;
    }
    function updateCoordinates(position, unitSize, visible) {
        if (visible !== coordinatesVisible) {
            coordinatesVisible = visible;
            coordinates.style.display = visible ? 'block' : 'none';
        }
        if (!visible) return;
        const x = Math.floor(position.x / unitSize + 0.5);
        const z = Math.floor(position.z / unitSize + 0.5);
        const text = `Cuadrante  X: ${x}  Z: ${z}\nAltura Y: ${position.y.toFixed(1)}`;
        if (text === coordinatesText) return;
        coordinatesText = text;
        coordinates.textContent = text;
    }

    return { showLensMode, showInteraction, hideInteraction, setInteractionText, setInteractionColor, showStamina, hideStamina, updateStamina, showDeath, hideDeath, showReceivedItem, showNotification, setHelmetViewVisible, showDivingAir, hideDivingAir, updateCoordinates, setUnderwaterTint };
}
