// Presentación de menús. El estado y las reglas permanecen en game.js.
export function createMenus({ onResume }) {
    const mainMenu = document.getElementById('main-menu');
    const pauseMenu = document.getElementById('pause-menu');
    const inventoryMenu = document.getElementById('inventory-menu');
    const dialogBox = document.getElementById('dialog-box');
    const dialogText = document.getElementById('dialog-text');
    const keyCountDisplay = document.getElementById('key-count');
    const keyIcon = document.getElementById('key-icon');
    const heartIcon = document.getElementById('forest-heart-icon');
    const torchIcon = document.getElementById('torch-icon');
    const mapIcon = document.getElementById('map-icon');

    pauseMenu.addEventListener('click', onResume);
    pauseMenu.addEventListener('contextmenu', event => event.preventDefault());
    inventoryMenu.addEventListener('click', onResume);

    function hideForGameplay() {
        mainMenu.style.display = 'none';
        pauseMenu.style.display = 'none';
        inventoryMenu.style.display = 'none';
    }

    function showPause() { pauseMenu.style.display = 'flex'; }
    function showInventory() { inventoryMenu.style.display = 'flex'; }
    function hideInventory() { inventoryMenu.style.display = 'none'; }
    function setDialogText(text) { dialogText.innerText = text; }
    function showDialog(text) {
        setDialogText(text);
        dialogBox.style.display = 'block';
    }
    function hideDialog() { dialogBox.style.display = 'none'; }
    function setKeyCount(count) {
        keyCountDisplay.innerText = count;
        keyIcon.style.display = count > 0 ? 'block' : 'none';
        keyCountDisplay.style.display = count > 0 ? 'block' : 'none';
    }
    function setHeartVisible(visible) { heartIcon.style.display = visible ? 'block' : 'none'; }
    function setTorchVisible(visible) { torchIcon.style.display = visible ? 'block' : 'none'; }
    function setMapVisible(visible) { mapIcon.style.display = visible ? 'block' : 'none'; }

    return { hideForGameplay, showPause, showInventory, hideInventory, setDialogText, showDialog, hideDialog, setKeyCount, setHeartVisible, setTorchVisible, setMapVisible };
}
