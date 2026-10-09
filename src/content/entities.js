// Entidades específicas por celda del mapa. Ver tools/world-map.html.
// Cada entrada: { id, type: 'CHEST', position: { x, z }, item: 'forest-heart', rotationY opcional }.
// Cofre 4 del mapa de coordenadas, confirmado por el usuario.
export const entities = [
    {
        id: 'forest-heart-chest',
        type: 'CHEST',
        position: { x: 165, z: 308 },
        item: 'forest-heart',
        rotationY: Math.PI
    },
    {
        id: 'island-map-chest',
        type: 'CHEST',
        position: { x: 229, z: 429 },
        item: 'map'
    }
];

export const grahamPosition = { x: 235, z: 421 };

export const furniture = [
    { id: 'graham-bed', type: 'BED', position: { x: 237, z: 427 }, size: { x: 1, z: 2 }, rotationY: Math.PI },
    { id: 'graham-side-table', type: 'SIDE_TABLE', position: { x: 238, z: 428 }, size: { x: 1, z: 1 }, offset: { z: 0.525 }, rotationY: Math.PI },
    { id: 'graham-barrel-1', type: 'BARREL', position: { x: 235, z: 419 }, size: { x: 1, z: 1 }, offset: { z: -0.5 } },
    { id: 'graham-barrel-2', type: 'BARREL', position: { x: 235, z: 419 }, size: { x: 1, z: 1 }, offset: { z: 0.75 } },
    { id: 'graham-barrel-3', type: 'BARREL', position: { x: 235, z: 420 }, size: { x: 1, z: 1 } },
    { id: 'graham-bookshelf', type: 'BOOKSHELF', position: { x: 228, z: 420 }, size: { x: 1, z: 2 }, offset: { x: -0.625 }, rotationY: Math.PI / 2 },
    { id: 'graham-table', type: 'TABLE', position: { x: 231, z: 422 }, size: { x: 2, z: 1 } },
    { id: 'graham-chair-left', type: 'CHAIR', position: { x: 230, z: 422 }, size: { x: 1, z: 1 }, offset: { x: 0.65 }, rotationY: Math.PI / 2 },
    { id: 'graham-chair-right', type: 'CHAIR', position: { x: 233, z: 422 }, size: { x: 1, z: 1 }, offset: { x: -0.65 }, rotationY: -Math.PI / 2 },
    { id: 'graham-wardrobe', type: 'WARDROBE', position: { x: 236, z: 424 }, size: { x: 2, z: 1 }, offset: { z: -0.45 } },
    { id: 'graham-desk', type: 'DESK', position: { x: 234, z: 428 }, size: { x: 2, z: 1 }, offset: { z: 0.35 } },
    { id: 'graham-desk-chair', type: 'CHAIR', position: { x: 234, z: 427 }, size: { x: 1, z: 1 }, offset: { z: 1.3 } }
];
