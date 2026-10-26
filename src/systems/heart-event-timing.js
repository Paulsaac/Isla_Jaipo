import { FOREST_CUES } from '../content/forest-cues.js';
import { PLAYER_HEIGHT, TREE_SPRITE_HEIGHT } from '../config.js';

export const HEIGHT_HALF_TREE = Math.max(0, TREE_SPRITE_HEIGHT * 0.42 - PLAYER_HEIGHT); // Mitad de árbol en marca 1 (~3.27 m)
export const HEIGHT_CANOPY_PLUS = TREE_SPRITE_HEIGHT + 0.6 - PLAYER_HEIGHT; // Poquito por encima de la copa (~10.59 m)
export const HEIGHT_CANOPY = TREE_SPRITE_HEIGHT - PLAYER_HEIGHT; // Copa de los árboles (~9.99 m)
export const HEIGHT_LOW = 7.8; // Altura acotada en marca 4 (7.8 m, no baja tanto)
export const HEIGHT_HIGH_2_TREES = 2.0 * TREE_SPRITE_HEIGHT - PLAYER_HEIGHT; // Aprox. 2 árboles de altura (~21.59 m)

const FIRST_MARK_SLOW_RISE_SPEED = 0.012; // m/s
const FIRST_MARK_NAV_RANGE = 0.4;
const SECOND_MARK_NAV_RANGE = 0.5;

export const HEART_EVENT_END_MARGIN = 0;
export const HEART_LEVITATION_MAX_RISE = HEIGHT_HIGH_2_TREES;
export const HEART_VISION_FADE_IN_SECONDS = 8;
export const HEART_VEGETATION_FADE_IN_SECONDS = 16;
export const HEART_VISION_FADE_OUT_SECONDS = 8;

// Derivadas primera y segunda nulas en ambos extremos.
export function smoothest(t) {
    t = Math.max(0, Math.min(1, t));
    return Math.max(0, Math.min(1, t * t * t * (t * (t * 6 - 15) + 10)));
}

function levitationProfile(duration, remaining) {
    if (!Number.isFinite(duration) || !Number.isFinite(remaining) || duration <= 0) return { base: 0, range: 0, fade: 0, navigation: 0 };
    const elapsed = Math.max(0, duration - remaining);
    const [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9] = FOREST_CUES;
    let base = 0, landingFade = 1;

    if (elapsed < c1) {
        // Marca 0: levita hasta llegar a la mitad en marca 1
        const rise = smoothest(elapsed / c1);
        base = HEIGHT_HALF_TREE * rise + FIRST_MARK_SLOW_RISE_SPEED * elapsed * (1 - rise);
    } else if (elapsed < c2 - 2.0) {
        // Marca 1: se mantiene hasta dos segundos antes de la marca 2.
        base = HEIGHT_HALF_TREE;
    } else if (elapsed < c3) {
        // Ascenso de 8 s: empieza antes y termina en el mismo instante (marca 2 + 6 s).
        const rise = smoothest((elapsed - (c2 - 2.0)) / 8.0);
        base = HEIGHT_HALF_TREE + (HEIGHT_CANOPY_PLUS - HEIGHT_HALF_TREE) * rise;
    } else if (elapsed < c4) {
        // Marca 3: se mantiene arriba hasta los últimos 3 segundos del 3 para el 4,
        // donde desciende lentamente hacia la altura baja de la marca 4.
        const descentStart = c4 - 3.0; // 81.859 s
        if (elapsed < descentStart) {
            base = HEIGHT_CANOPY_PLUS;
        } else {
            const tDescend = smoothest((elapsed - descentStart) / 3.0);
            base = HEIGHT_CANOPY_PLUS + (HEIGHT_LOW - HEIGHT_CANOPY_PLUS) * tDescend;
        }
    } else if (elapsed < c5) {
        // Marca 4: no baja ni sube tanto (HEIGHT_LOW = 7.8 m).
        // Vaivén en rangos acotados (±0.4 m) y oscilación lenta (periodo 8.5 s).
        // Hacia el final de la marca 4 asciende suavemente para conectar con la copa en la marca 5.
        const riseStart = c5 - 4.0; // 101.939 s
        const osc = Math.sin((elapsed - c4) * (2.0 * Math.PI / 8.5)) * 0.4;
        if (elapsed < riseStart) {
            base = HEIGHT_LOW + osc;
        } else {
            const tRise = smoothest((elapsed - riseStart) / 4.0);
            const currentHover = HEIGHT_LOW + osc * (1.0 - tRise);
            base = currentHover + (HEIGHT_CANOPY - currentHover) * tRise;
        }
    } else if (elapsed < c6) {
        // Marca 5: va subiendo en curva hasta aprox. 2 árboles (altura de marca 6), lenta al inicio y rápida al final.
        const u = (elapsed - c5) / (c6 - c5);
        const curve = Math.pow(Math.max(0, Math.min(1, u)), 2.5);
        base = HEIGHT_CANOPY + (HEIGHT_HIGH_2_TREES - HEIGHT_CANOPY) * curve;
    } else if (elapsed < c7) {
        // Marca 6: máxima altura (aprox. 2 árboles). Hacia el final se acerca suavemente al punto de oscilación.
        const blendStart = c7 - 2.5; // 145.199 s
        const mid7 = (HEIGHT_HALF_TREE + HEIGHT_CANOPY_PLUS) * 0.5;
        if (elapsed < blendStart) {
            base = HEIGHT_HIGH_2_TREES;
        } else {
            const tBlend = smoothest((elapsed - blendStart) / 2.5);
            base = HEIGHT_HIGH_2_TREES + (mid7 - HEIGHT_HIGH_2_TREES) * tBlend;
        }
    } else if (elapsed < c8) {
        // Marca 7: vaivén en rangos más acotados (±1.35 m) y oscilación lenta (periodo 8.5 s).
        const mid7 = (HEIGHT_HALF_TREE + HEIGHT_CANOPY_PLUS) * 0.5;
        const amp7 = 1.35;
        const wave = Math.sin((elapsed - c7) * (2.0 * Math.PI / 8.5));
        base = mid7 + amp7 * wave;
    } else {
        // Desde marca 8, aterrizar tres segundos antes de marca 9.
        const mid7 = (HEIGHT_HALF_TREE + HEIGHT_CANOPY_PLUS) * 0.5;
        const amp7 = 1.35;
        const final7 = mid7 + amp7 * Math.sin((c8 - c7) * (2.0 * Math.PI / 8.5));
        landingFade = Math.max(0, 1.0 - smoothest((elapsed - c8) / (c9 - 3.0 - c8)));
        base = final7;
    }

    const expansion = smoothest((elapsed - c1) / (c2 - c1));
    const navigation = smoothest((elapsed - c1) / 3);
    return { base, range: (FIRST_MARK_NAV_RANGE + (SECOND_MARK_NAV_RANGE - FIRST_MARK_NAV_RANGE) * expansion) * navigation, fade: landingFade, navigation };
}

export function getForestVisualProfile(elapsed) {
    const time = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
    const [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9] = FOREST_CUES;

    // 1. Árboles:
    // Marca 0: entrada leve de color y deformación; marca 1 continúa hasta el nivel de marca 2.
    // Marca 5: mayor intensidad en los colores de los árboles pedida por el usuario.
    // Marca 7: intensidad moderada a 1.05.
    let treeColorStrength = 0;
    let warp = 0;
    if (time < c1) {
        const intro = smoothest(time / c1);
        treeColorStrength = 0.18 * intro;
        warp = 0.12 * intro;
    } else if (time < c2) {
        // Continuar sin saltos hasta los valores vigentes al entrar en marca 2.
        const rise = smoothest((time - c1) / (c2 - c1));
        treeColorStrength = 0.18 + (0.75 - 0.18) * rise;
        warp = 0.12 + (0.75 * 0.85 - 0.12) * rise;
    } else if (time < c5) {
        // Marcas 2 a 4: progresa suavemente de 0.75 a 0.95
        const tMid = smoothest((time - c2) / (c5 - c2));
        treeColorStrength = 0.75 + 0.20 * tMid;
        warp = Math.min(1.0, treeColorStrength * 0.85);
    } else if (time < c6) {
        // Marca 5: mayor intensidad en los colores de los árboles (1.25)
        const t5 = smoothest((time - c5) / 1.8);
        treeColorStrength = 0.95 + (1.25 - 0.95) * t5;
        warp = 0.95;
    } else if (time < c7) {
        // Marca 6: desciende suavemente hacia la intensidad de marca 7
        const t6 = smoothest((time - c6) / (c7 - c6));
        treeColorStrength = 1.25 + (1.05 - 1.25) * t6;
        warp = 0.92;
    } else if (time < c8) {
        // Marca 7: moderado a 1.05 (antes 1.18) para suavizar colores excesivamente fuertes
        treeColorStrength = 1.05;
        warp = 0.90;
    } else if (time < c9) {
        // Marca 8: bajar lentamente hasta quedar en cero al llegar a la marca 9
        const fade8 = Math.max(0, 1.0 - smoothest((time - c8) / (c9 - c8)));
        treeColorStrength = 1.05 * fade8;
        warp = fade8 * 0.90;
    } else {
        treeColorStrength = 0;
        warp = 0;
    }

    // 2. Trail:
    // • En la Marca 3: efecto trail de pocas repeticiones (~10 al llegar a marca 3, ~0.72)
    //   que desciende continuamente durante la marca 3 hasta llegar exactamente a 0 en la marca 4.
    // • Durante la marca 7: efecto trail sostenido (0.82).
    // • Durante la marca 8: baja lentamente hasta cero en la marca 9.
    let trailStrength = 0;
    if (time >= c3 - 1.5 && time < c3) {
        // Entrada suave justo al llegar a la marca 3
        const tIn = smoothest((time - (c3 - 1.5)) / 1.5);
        trailStrength = 0.72 * tIn;
    } else if (time >= c3 && time < c4) {
        // Durante la marca 3: desciende progresivamente desde 0.72 hasta 0 al llegar a la marca 4
        const tDescend = smoothest((time - c3) / (c4 - c3));
        trailStrength = 0.72 * (1.0 - tDescend);
    } else if (time >= c7 && time < c8) {
        trailStrength = 0.82;
    } else if (time >= c8 && time < c9) {
        const fade8 = Math.max(0, 1.0 - smoothest((time - c8) / (c9 - c8)));
        trailStrength = 0.82 * fade8;
    }

    // 3. Caleidoscopio y GIF psicodélico fijos en la textura del cielo nocturno:
    // • GIF tenue (0.10) desde 2 s antes de marca 5, entrada de 7 s y salida antes de marca 6.
    // • Marca 6: Caleidoscopio en cielo nocturno con opacidad subida (~0.28).
    // • Marca 7: caleidoscopio en 6.5 s y GIF con entrada de 9 s (50–70%).
    // • Marca 8 -> 9: Desciende a cero.
    let skyKaleidoAmount = 0;
    let skyPsychOpacity = 0;
    let hyperSaturation = 0;

    if (time >= c5 - 2.0 && time < c6) {
        // Anticipar solo la animación; conservar el tiempo del refuerzo de saturación.
        const fadeIn5 = smoothest((time - (c5 - 2.0)) / 7.0);
        const fadeOut5 = smoothest((c6 - time) / 2.4);
        const env5 = Math.min(fadeIn5, fadeOut5);
        skyPsychOpacity = 0.10 * env5;
        hyperSaturation = 0.35 * Math.min(smoothest((time - c5) / 7.0), fadeOut5);
    } else if (time >= c6 && time < c7) {
        // Marca 6: opacidad subida del efecto caleidoscopio en el cielo nocturno (~0.28)
        const fadeIn6 = smoothest((time - c6) / 8.0);
        skyKaleidoAmount = 0.28 * fadeIn6;
    } else if (time >= c7 && time < c8) {
        // Marca 7: caleidoscopio entra suavemente desde 0.28 hasta su máximo de 0.50.
        const tKaleido7 = smoothest((time - c7) / 6.5);
        skyKaleidoAmount = 0.28 + (0.50 - 0.28) * tKaleido7;
        const tPsych7 = smoothest((time - c7) / 9.0);
        const osc = 0.60 + 0.10 * Math.sin((time - c7) * 2.4);
        skyPsychOpacity = osc * tPsych7;
        hyperSaturation = tPsych7;
    } else if (time >= c8 && time < c9) {
        // Marca 8: bajan lentamente hasta cero en la marca 9
        const fadeOut = Math.max(0, 1.0 - smoothest((time - c8) / (c9 - c8)));
        skyKaleidoAmount = 0.50 * fadeOut;
        const osc = 0.60 + 0.10 * Math.sin((time - c7) * 2.4);
        skyPsychOpacity = osc * fadeOut;
        hyperSaturation = fadeOut;
    }

    return {
        strength: treeColorStrength,
        warp,
        speed: 0.35 + 0.65 * warp,
        trailStrength,
        screenKaleidoscope: 0,
        skyPsychOpacity,
        skyKaleidoAmount,
        hyperSaturation
    };
}

export function getHeartLevitationHeight(duration, remaining) {
    const profile = levitationProfile(duration, remaining);
    return profile.base * profile.fade;
}

export function createHeartLevitation() {
    let height = 0, cancelFrom = 0, cancelTime = null, desiredOffset = 0, offset = 0;
    return {
        update(delta, duration, remaining, active, navigation = {}) {
            delta = Math.max(0, Math.min(delta, 0.1));
            if (active) {
                cancelTime = null;
                const profile = levitationProfile(duration, remaining);
                const pitch = Math.max(-1, Math.min(1, navigation.lookY || 0));
                const pitchAmount = Math.sign(pitch) * smoothest((Math.abs(pitch) - 0.1) / 0.6);
                const moving = navigation.forward ? Math.min(1, Math.max(0, navigation.distance || 0) / Math.max(0.0001, 2.5 * delta)) : 0;
                desiredOffset += pitchAmount * moving * profile.navigation * 0.55 * delta;
                desiredOffset = Math.max(-profile.range, Math.min(profile.range, desiredOffset));
                offset += (desiredOffset - offset) * (1 - Math.exp(-delta / 0.8));
                height = (profile.base + offset) * profile.fade;
            } else if (height > 0.00001) {
                if (cancelTime === null) { cancelTime = 0; cancelFrom = height; }
                cancelTime = Math.min(HEART_VISION_FADE_OUT_SECONDS, cancelTime + delta);
                height = cancelFrom * (1 - smoothest(cancelTime / HEART_VISION_FADE_OUT_SECONDS));
            } else {
                height = 0;
                desiredOffset = offset = 0;
            }
            return height;
        }
    };
}
