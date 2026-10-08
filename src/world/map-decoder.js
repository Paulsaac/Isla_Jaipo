import { PALETTE } from './palette.js';

export function getClosestType(r, g, b, a) {
    if (a < 128) return 'GRASS';
    let minDist = Infinity;
    let closestType = 'GRASS';
    for (const [type, color] of Object.entries(PALETTE)) {
        if (type === 'BOAT' && Math.abs(b - color.b) > 30) continue; // Evitar que el verde oscuro mapee a botes
        const dist = Math.sqrt((r - color.r)**2 + (g - color.g)**2 + (b - color.b)**2);
        if (dist < minDist) {
            minDist = dist;
            closestType = type;
        }
    }
    return closestType;
}
