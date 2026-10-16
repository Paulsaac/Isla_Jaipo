import { FOREST_CUES } from '../content/forest-cues.js';

export const HEART_EVENT_END_MARGIN = 0;
export const HEART_LEVITATION_MAX_RISE = 13.2;
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
    const first = FOREST_CUES[1], second = FOREST_CUES[2];
    // Arranque lento solo al principio; ganar altura antes y llegar suavemente a la marca 1.
    const rise = smoothest(elapsed / first);
    const expansion = smoothest((elapsed - first) / (second - first));
    const base = elapsed < first ? 0.25 * smoothest(elapsed / 4) + 6.75 * rise : 7.0 + 0.5 * expansion;
    const fade = 1 - smoothest((elapsed - (duration - HEART_VISION_FADE_OUT_SECONDS)) / HEART_VISION_FADE_OUT_SECONDS);
    const navigation = smoothest((elapsed - first) / 3);
    return { base, range: (1.1 + 0.2 * expansion) * navigation, fade, navigation };
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
                desiredOffset += pitchAmount * moving * profile.navigation * 1.1 * delta;
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
