import { FOREST_CUES } from '../content/forest-cues.js';
import { PLAYER_HEIGHT, TREE_SPRITE_HEIGHT } from '../config.js';

const FIRST_MARK_RISE = Math.max(0, TREE_SPRITE_HEIGHT * 0.42 - PLAYER_HEIGHT);
const SECOND_MARK_RISE = FIRST_MARK_RISE + 0.7;
const THIRD_MARK_RISE = TREE_SPRITE_HEIGHT + 1.0 - PLAYER_HEIGHT;
const FIRST_MARK_SLOW_RISE_SPEED = 0.012; // m/s: evita detenerse en seco en la marca 1.
const FIRST_MARK_NAV_RANGE = 0.4;
const SECOND_MARK_NAV_RANGE = 0.5;

export const HEART_EVENT_END_MARGIN = 0;
// Referencia del movimiento visual de árboles: misma intensidad que antes al llegar a la marca 1.
export const HEART_LEVITATION_MAX_RISE = FIRST_MARK_RISE * (13.2 / 7);
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
    const first = FOREST_CUES[1], second = FOREST_CUES[2], third = FOREST_CUES[3];
    // La altura base permanece fija durante la mayor parte de la marca 1.
    // Solo en el tramo final se acerca suavemente a la altura de la marca 2.
    const rise = smoothest(elapsed / first);
    const expansion = smoothest((elapsed - first) / (second - first));
    const secondRiseStart = first + (second - first) * 0.6;
    let base;
    if (elapsed < first) {
        // Arranca muy lento y reduce la velocidad a cero de forma gradual antes de la meseta.
        base = FIRST_MARK_RISE * rise + FIRST_MARK_SLOW_RISE_SPEED * elapsed * (1 - rise);
    } else if (elapsed < second) {
        base = FIRST_MARK_RISE + (SECOND_MARK_RISE - FIRST_MARK_RISE)
            * smoothest((elapsed - secondRiseStart) / (second - secondRiseStart));
    } else if (elapsed < third) {
        base = SECOND_MARK_RISE + (THIRD_MARK_RISE - SECOND_MARK_RISE)
            * smoothest((elapsed - second) / (third - second));
    } else {
        base = THIRD_MARK_RISE;
    }
    // Desde la marca 8 desciende durante toda la última sección hasta tocar suelo en la 9.
    const fade = 1 - smoothest((elapsed - FOREST_CUES[8]) / (FOREST_CUES[9] - FOREST_CUES[8]));
    const navigation = smoothest((elapsed - first) / 3);
    return { base, range: (FIRST_MARK_NAV_RANGE + (SECOND_MARK_NAV_RANGE - FIRST_MARK_NAV_RANGE) * expansion) * navigation, fade, navigation };
}

// Luz/color siguen las marcas; el warp no supera la intensidad ni velocidad de la marca 3.
const FOREST_VISUAL_LEVELS = [0, 0.28, 0.62, 1, 0.76, 1, 1.2, 0.78, 0.78, 0];
export function getForestVisualProfile(elapsed) {
    const time = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
    let index = 0;
    while (index < FOREST_CUES.length - 2 && time >= FOREST_CUES[index + 1]) index++;
    const blend = smoothest((time - FOREST_CUES[index]) / (FOREST_CUES[index + 1] - FOREST_CUES[index]));
    const strength = FOREST_VISUAL_LEVELS[index]
        + (FOREST_VISUAL_LEVELS[index + 1] - FOREST_VISUAL_LEVELS[index]) * blend;
    const warp = Math.min(1, strength);
    return { strength, warp, speed: 0.35 + 0.65 * warp };
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
                // Solo avance real; mirar quieto o chocar contra un obstáculo no cambia altura.
                const pitch = Math.max(-1, Math.min(1, navigation.lookY || 0));
                const pitchAmount = Math.sign(pitch) * smoothest((Math.abs(pitch) - 0.1) / 0.6);
                const moving = navigation.forward ? Math.min(1, Math.max(0, navigation.distance || 0) / Math.max(0.0001, 2.5 * delta)) : 0;
                desiredOffset += pitchAmount * moving * profile.navigation * 0.55 * delta;
                desiredOffset = Math.max(-profile.range, Math.min(profile.range, desiredOffset));
                offset += (desiredOffset - offset) * (1 - Math.exp(-delta / 0.8));
                height = (profile.base + offset) * profile.fade;
            } else if (height > 0.00001) {
                // Cancelar con P conserva un aterrizaje suave desde la altura navegada.
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
