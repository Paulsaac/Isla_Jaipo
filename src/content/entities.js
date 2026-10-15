// Entidades específicas por celda del mapa. Ver tools/world-map.html.
// Cada entrada: { id, type: 'CHEST', position: { x, z }, item: 'forest-heart', rotationY opcional }.
// Cofre del corazón trasladado en capa1 por el usuario a (94,279).
export const entities = [
    {
        id: 'forest-heart-chest',
        type: 'CHEST',
        kind: 'DRY_VINE',
        position: { x: 94, z: 279 },
        item: 'forest-heart',
        ground: 'DIRT_STONE',
        rotationY: Math.PI
    },
    {
        id: 'island-map-chest',
        type: 'CHEST',
        position: { x: 231, z: 425 },
        sourcePosition: { x: 229, z: 429 },
        item: 'map',
        rotationY: Math.PI / 2
    }
];

// Celda de referencia y ajuste fino en unidades del mundo.
export const grahamPosition = { x: 230, z: 421, offset: { x: 1.3, z: 1.0 } };

export const spawnRoomExit = { x: 235, z: 423 };

export const kitchenGardenPosition = { x: 237, z: 433 };

export const seaHeartAltar = { center: { x: 344, z: 394 }, radius: 3, stepHeight: 0.4 };

export const keyBindings = [{
    id: 'bridge-key', name: 'Llave del puente',
    doors: [{ x: 264, z: 276 }, { x: 265, z: 276 }]
}];

// Marcadores amarillos del naufragio; el suelo es playa, no un muelle.
export const shipwreckProps = [
    { id: 'wreck-plank', type: 'WOOD', position: { x: 239, z: 484 }, model: 'BROKEN_PLANK', ground: 'WET_SAND', rotationY: -0.35 },
    { id: 'wreck-life-ring', type: 'WOOD', position: { x: 241, z: 484 }, model: 'LIFE_RING', ground: 'WET_SAND', rotationY: 0.3 },
    { id: 'wreck-rope', type: 'WOOD', position: { x: 238, z: 485 }, model: 'COILED_ROPE', ground: 'WET_SAND', rotationY: -0.6 },
    { id: 'wreck-mast', type: 'WOOD', position: { x: 240, z: 486 }, model: 'BROKEN_MAST', ground: 'WET_SAND', rotationY: 0.65 }
];

export const sunkenShip = {
    id: 'southern-sunken-ship',
    bounds: { minX: 240, maxX: 245, minZ: 498, maxZ: 508 },
    rotationY: Math.PI / 2,
    burial: 0.08
};

export const divingHelmet = {
    id: 'sunken-diving-helmet',
    position: { x: 240, z: 490 },
    rotationX: Math.PI / 2,
    rotationY: Math.PI / 2,
    rotationZ: 0,
    rotationOrder: 'YXZ',
    burialFraction: 0.65
};

export const doorOverrides = [
    { position: { x: 228, z: 423 }, openDirection: 'south', hinge: 'left' },
    { position: { x: 235, z: 423 }, openDirection: 'north' }
];

export const furniture = [
    { id: 'graham-spice-shelf', type: 'SPICE_SHELF', position: { x: 227, z: 430 }, size: { x: 1, z: 1 }, offset: { z: 0.65 }, rotationY: Math.PI },
    { id: 'graham-antique-stove', type: 'ANTIQUE_STOVE', position: { x: 228, z: 430 }, size: { x: 1, z: 1 }, offset: { z: 0.28 }, rotationY: Math.PI },
    { id: 'graham-stump', type: 'STUMP', position: { x: 239, z: 419 }, size: { x: 1, z: 1 }, offset: { y: -0.12 }, rotationY: 0 },
    { id: 'graham-workbench', type: 'WORKBENCH', position: { x: 237, z: 420 }, size: { x: 1, z: 2 }, rotationY: 0 },
    { id: 'graham-log-stack', type: 'LOG_STACK', position: { x: 238, z: 422 }, size: { x: 2, z: 1 }, rotationY: Math.PI / 2 },
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
    { id: 'graham-desk-chair', type: 'CHAIR', position: { x: 234, z: 427 }, size: { x: 1, z: 1 }, offset: { z: 1.3 } },
    { id: 'graham-crate-stack', type: 'CRATE_STACK', position: { x: 230, z: 429 }, size: { x: 2, z: 2 }, rotationY: Math.PI / 8 },
    { id: 'graham-tall-shelf', type: 'SHELF', position: { x: 231, z: 426 }, size: { x: 1, z: 1 }, offset: { x: 0.65 }, rotationY: -Math.PI / 2 },
    { id: 'graham-dresser', type: 'DRESSER', position: { x: 227, z: 425 }, size: { x: 1, z: 2 }, offset: { x: -0.45 }, rotationY: Math.PI / 2 },
    { id: 'graham-barrel-pyramid', type: 'BARREL_STACK', position: { x: 227, z: 428 }, size: { x: 2, z: 1 }, offset: { x: -1.39 }, rotationY: Math.PI / 2 }
];
