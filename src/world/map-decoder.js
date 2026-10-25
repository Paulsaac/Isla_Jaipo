import { PALETTE } from './palette.js';

const markerTypes = new Set(['SEA_HEART_FRAGMENT','SEA_ALGA','SEA_CORAL','SEA_GRASS','SNOW_SLOPE']);
const nearestColors = Object.entries(PALETTE).filter(([type]) => !markerTypes.has(type));
// Los mapas usan principalmente colores exactos. Conservar prioridad y orden
// de desempate; los colores no exactos siguen usando la misma paleta de terreno.
const exactTypes = new Map();
for (const [type, color] of Object.entries(PALETTE)) {
    const key = (color.r << 16) | (color.g << 8) | color.b;
    if (!exactTypes.has(key)) exactTypes.set(key, type);
}

export function getClosestType(r, g, b, a) {
    if (a < 128) return 'GRASS';
    const exact = exactTypes.get((r << 16) | (g << 8) | b);
    if (exact !== undefined) return exact;
    let minDist = Infinity;
    let closestType = 'GRASS';
    for (const [type, color] of nearestColors) {
        if (type === 'BOAT' && Math.abs(b - color.b) > 30) continue; // Evitar que el verde oscuro mapee a botes
        const dist = (r - color.r)**2 + (g - color.g)**2 + (b - color.b)**2;
        if (dist < minDist) {
            minDist = dist;
            closestType = type;
        }
    }
    return closestType;
}
