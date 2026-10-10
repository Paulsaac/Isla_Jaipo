import { FLOOR_COLORS } from '../world/palette.js';

// Interfaz del minimapa; la paleta visual es independiente del mapa de entidades.
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
        minimapContainer.style.backgroundColor = FLOOR_COLORS.WATER;
        document.body.appendChild(minimapContainer);

        const minimapImg = document.createElement('img');
        minimapImg.src = floorCanvas.toDataURL();
        minimapImg.style.width = '100%';
        minimapImg.style.height = '100%';
        minimapImg.style.imageRendering = 'pixelated';
        minimapContainer.appendChild(minimapImg);

        playerDot = document.createElement('div');
        playerDot.style.position = 'absolute';
        playerDot.style.width = '20px';
        playerDot.style.height = '26px';
        playerDot.style.pointerEvents = 'none';
        playerDot.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="26" viewBox="0 0 20 26" aria-hidden="true">
            <path d="M7 13H13V24H7Z" fill="#D95243" stroke="#20252B" stroke-width="2"/>
            <path d="M10 1L18 18L10 14L2 18Z" fill="#FFD078" stroke="#20252B" stroke-width="2" stroke-linejoin="round"/>
            <path d="M10 4L13 11H7Z" fill="#FFFFFF"/>
        </svg>`;
        playerDot.style.transformOrigin = '50% 50%';
        playerDot.style.transform = 'translate(-50%, -50%)';
        minimapContainer.appendChild(playerDot);
    }

    function toggle() {
        if (!minimapContainer) return;
        mapVisible = !mapVisible;
        minimapContainer.style.display = mapVisible ? 'block' : 'none';
    }

    function updatePosition(x, z, worldWidth, worldHeight, heading = 0) {
        if (!mapVisible || !playerDot) return;
        playerDot.style.left = (x / worldWidth) * 100 + '%';
        playerDot.style.top = (z / worldHeight) * 100 + '%';
        playerDot.style.transform = `translate(-50%, -50%) rotate(${heading}rad)`;
    }

    return { initialize, toggle, updatePosition };
}
