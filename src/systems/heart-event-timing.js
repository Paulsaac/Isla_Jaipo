export const HEART_EVENT_END_MARGIN = 0;
export const HEART_LEVITATION_MAX_RISE = 3.75;
export const HEART_VISION_FADE_IN_SECONDS = 8;
export const HEART_VISION_FADE_OUT_SECONDS = 8;

// Derivadas primera y segunda nulas en los extremos y en el punto más alto.
export function smoothest(t) {
    t = Math.max(0, Math.min(1, t));
    return Math.max(0, Math.min(1, t * t * t * (t * (t * 6 - 15) + 10)));
}

export function getHeartLevitationHeight(duration, remaining) {
    if (!Number.isFinite(duration) || !Number.isFinite(remaining) || duration <= HEART_EVENT_END_MARGIN * 2) return 0;
    const elapsed = Math.max(0, duration - remaining);
    const midpoint = duration / 2;
    const landing = duration - HEART_EVENT_END_MARGIN;
    if (elapsed >= landing) return 0;
    const envelope = elapsed <= midpoint
        ? smoothest(elapsed / midpoint)
        : 1 - smoothest((elapsed - midpoint) / (landing - midpoint));
    return envelope * HEART_LEVITATION_MAX_RISE;
}

export function createHeartLevitation() {
    let height = 0, cancelFrom = 0, cancelTime = null;
    return {
        update(delta, duration, remaining, active) {
            if (active) {
                cancelTime = null;
                height = getHeartLevitationHeight(duration, remaining);
            } else if (height > 0.00001) {
                // Si P cancela el audio, aterrizar suavemente en vez de caer de golpe.
                if (cancelTime === null) { cancelTime = 0; cancelFrom = height; }
                cancelTime = Math.min(HEART_VISION_FADE_OUT_SECONDS, cancelTime + delta);
                height = cancelFrom * (1 - smoothest(cancelTime / HEART_VISION_FADE_OUT_SECONDS));
            } else {
                height = 0;
            }
            return height;
        }
    };
}
