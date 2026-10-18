// Pesos relativos: de pie 70%, transversal 24%, diagonal 5.5%, norte-sur 0.5%.
export const WOOD_LOGS = [
    { id: 'upright', label: 'De pie', weight: 700 },
    { id: 'crosswise', label: 'Transversal', weight: 240 },
    { id: 'diagonal', label: 'Diagonal', weight: 55 },
    { id: 'north-south', label: 'Norte-sur', weight: 5 }
];
export const AXE_SPEEDS = [0.85, 1.1, 1.4, 1.75, 2.15, 2.65]; // Ciclos completos por segundo.
export const WOOD_EXIT_SECONDS = 3;
export const WOOD_PERFECT_POWER = .96;

export function chooseWoodRound(random = Math.random, previousSpeed = -1) {
    let ticket = random() * 1000;
    const log = WOOD_LOGS.find(entry => (ticket -= entry.weight) < 0) || WOOD_LOGS.at(-1);
    // Cada tronco admite las seis velocidades, sin repetir la velocidad anterior.
    const choices = AXE_SPEEDS.map((_, index) => index).filter(index => index !== previousSpeed);
    const speedIndex = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
    return { log, speedIndex, speed: AXE_SPEEDS[speedIndex] };
}

export function axePower(phase) {
    const cycle = ((phase % 1) + 1) % 1;
    return 1 - 2 * Math.abs(cycle - 0.5);
}

// La franja verde superior (96–100%) siempre parte el tronco de un golpe.
// Entre rojo (1 HP), amarillo (50 HP) y verde, el daño sube gradualmente.
export function woodHitDamage(power) {
    const p = Math.max(0, Math.min(1, power));
    if (p >= WOOD_PERFECT_POWER) return 100;
    const t = p <= .5 ? p / .5 : (p - .5) / (WOOD_PERFECT_POWER - .5);
    const blend = t * t * (3 - 2 * t);
    return Math.min(99, Math.round(p <= .5 ? 1 + 49 * blend : 50 + 50 * blend));
}

export function woodHitLabel(power) {
    return power >= WOOD_PERFECT_POWER ? '¡Perfecto!' : power >= .35 ? 'Bien' : 'Mal';
}

export function woodDamageStage(hp) {
    return hp >= 100 ? 0 : hp > 50 ? 1 : 2;
}

export function woodLogPoints(hits) {
    if (hits <= 0) return 0;
    if (hits === 1) return 100;
    if (hits <= 4) return 50;
    if (hits <= 8) return 25;
    if (hits <= 16) return 10;
    if (hits <= 32) return 5;
    return 1;
}
