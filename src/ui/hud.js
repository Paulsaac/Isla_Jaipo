// Presentación del HUD; no calcula resistencia ni decide interacciones o muerte.
export function createHud() {
    const message = document.getElementById('interaction-msg');
    const staminaContainer = document.getElementById('stamina-container');
    const staminaBar = document.getElementById('stamina-bar');
    const deathScreen = document.getElementById('death-screen');
    const itemNotification = document.getElementById('item-notification');
    const pendingItems = [];
    let itemTimer = null;

    function showNextItem() {
        if (!pendingItems.length) {
            itemNotification.style.display = 'none';
            itemTimer = null;
            return;
        }
        itemNotification.textContent = `Has recibido ${pendingItems.shift()}`;
        itemNotification.style.display = 'block';
        itemTimer = setTimeout(showNextItem, 3500);
    }

    function showReceivedItem(name) {
        pendingItems.push(name);
        if (itemTimer === null) showNextItem();
    }

    function showInteraction() { message.style.display = 'block'; }
    function hideInteraction() { message.style.display = 'none'; }
    function setInteractionText(text) { message.innerText = text; }
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

    return { showInteraction, hideInteraction, setInteractionText, setInteractionColor, showStamina, hideStamina, updateStamina, showDeath, hideDeath, showReceivedItem };
}
