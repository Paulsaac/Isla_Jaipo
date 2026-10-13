import { PALETTE } from './palette.js';

export function getClosestType(r, g, b, a) {
    if (a < 128) return 'GRASS';
    if (r === 117 && g === 250 && b === 141) return 'SEA_HEART_FRAGMENT';
    for (const type of ['SEA_ALGA','SEA_CORAL','SEA_GRASS']) {
        const color=PALETTE[type];
        if(r===color.r&&g===color.g&&b===color.b) return type;
    }
    let minDist = Infinity;
    let closestType = 'GRASS';
    for (const [type, color] of Object.entries(PALETTE)) {
        if (['SEA_HEART_FRAGMENT','SEA_ALGA','SEA_CORAL','SEA_GRASS'].includes(type)) continue;
        if (type === 'BOAT' && Math.abs(b - color.b) > 30) continue; // Evitar que el verde oscuro mapee a botes
        const dist = Math.sqrt((r - color.r)**2 + (g - color.g)**2 + (b - color.b)**2);
        if (dist < minDist) {
            minDist = dist;
            closestType = type;
        }
    }
    return closestType;
}
