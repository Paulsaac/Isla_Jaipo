import { coordinateKey, validateGridPosition } from './coordinates.js';

export function createEntityRegistry(definitions, floorMap, width, height) {
    const byPosition = new Map();
    const ids = new Set();
    for (const definition of definitions) {
        validateGridPosition(definition.position, width, height);
        const key = coordinateKey(definition.position.x, definition.position.z);
        if (!definition.id || ids.has(definition.id) || byPosition.has(key)) {
            throw new Error(`Entidad duplicada o sin identificador: ${definition.id || key}.`);
        }
        if (floorMap[definition.position.z][definition.position.x] !== definition.type) {
            throw new Error(`La entidad ${definition.id} requiere ${definition.type} en (${key}).`);
        }
        ids.add(definition.id);
        byPosition.set(key, definition);
    }
    return { at: (x, z) => byPosition.get(coordinateKey(x, z)) };
}
