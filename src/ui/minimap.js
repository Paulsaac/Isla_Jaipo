// Interfaz del minimapa: conserva apariencia y calculo de posicion anteriores.
export function createMinimap() {
    let minimapContainer = null;
    let playerDot = null;
    let mapVisible = false;

    function initialize(floorCanvas) {
        if (minimapContainer) return;

        minimapContainer = document.createElement('div');
        minimapContainer.style.position = 'absolute';
        minimapContainer.style.top = '20px';
        minimapContainer.style.right = '20px';
        minimapContainer.style.width = '256px';
        minimapContainer.style.height = '256px';
        minimapContainer.style.border = '4px solid rgba(255, 255, 255, 0.7)';
        minimapContainer.style.display = 'none';
        minimapContainer.style.zIndex = '100';
        minimapContainer.style.backgroundColor = '#1F7068';
        document.body.appendChild(minimapContainer);

        const minimapImg = document.createElement('img');
        minimapImg.src = floorCanvas.toDataURL();
        minimapImg.style.width = '100%';
        minimapImg.style.height = '100%';
        minimapImg.style.imageRendering = 'pixelated';
        minimapContainer.appendChild(minimapImg);

        playerDot = document.createElement('div');
        playerDot.style.position = 'absolute';
        playerDot.style.width = '0';
        playerDot.style.height = '0';
        playerDot.style.borderLeft = '6px solid transparent';
        playerDot.style.borderRight = '6px solid transparent';
        playerDot.style.borderBottom = '12px solid #ff0000';
        playerDot.style.transformOrigin = '50% 50%';
        playerDot.style.transform = 'translate(-50%, -50%)';
        minimapContainer.appendChild(playerDot);
    }

    function toggle() {
        if (!minimapContainer) return;
        mapVisible = !mapVisible;
        minimapContainer.style.display = mapVisible ? 'block' : 'none';
    }

    function updatePosition(x, z, worldWidth, worldHeight) {
        if (!mapVisible || !playerDot) return;
        playerDot.style.left = (x / worldWidth) * 100 + '%';
        playerDot.style.top = (z / worldHeight) * 100 + '%';
    }

    return { initialize, toggle, updatePosition };
}
