export const RIVER_SOUND_RANGE = 28;

// Buscar la superficie del cauce más cercana, incluidos los tramos bajo puentes.
export function sampleRiverSound(field, unitSize, x, y, z, waterHeight) {
    if (!field) return { x, y: waterHeight, z, gain: 0 };
    const { width, height } = field;
    const river = field.surface ?? field.river;
    const radius = Math.ceil(RIVER_SOUND_RANGE / unitSize) + 1;
    const gx = Math.round(x / unitSize), gz = Math.round(z / unitSize);
    let distance = RIVER_SOUND_RANGE, sourceX = x, sourceZ = z;
    for (let rz = Math.max(0, gz-radius); rz <= Math.min(height-1, gz+radius); rz++) {
        for (let rx = Math.max(0, gx-radius); rx <= Math.min(width-1, gx+radius); rx++) {
            if (!river[rz*width+rx]) continue;
            const sx = Math.max(rx*unitSize-unitSize/2, Math.min(rx*unitSize+unitSize/2, x));
            const sz = Math.max(rz*unitSize-unitSize/2, Math.min(rz*unitSize+unitSize/2, z));
            const next = Math.hypot(sx-x, waterHeight-y, sz-z);
            if (next < distance) { distance = next; sourceX = sx; sourceZ = sz; }
        }
    }
    const t = distance / RIVER_SOUND_RANGE, smooth = t*t*(3-2*t);
    return { x: sourceX, y: waterHeight, z: sourceZ, gain: (1-smooth)**2 };
}

export function createRiverAmbience(context, { url = './sonidos/fx/rio.mp3', label = 'el río', volume = 0.315 } = {}) {
    const audio = new Audio(url);
    audio.loop = true; audio.preload = 'metadata';
    const input = context.createMediaElementSource(audio);
    const gain = context.createGain(), panner = context.createPanner();
    gain.gain.value = 0;
    panner.panningModel = 'HRTF'; panner.rolloffFactor = 0;
    input.connect(gain); gain.connect(panner); panner.connect(context.destination);
    let level = 0, paused = false, stopTimer = null;
    function cancelStop() { if (stopTimer !== null) clearTimeout(stopTimer); stopTimer = null; }
    function play(prime = false) {
        audio.play()?.then(() => { if (paused || (prime && level === 0)) audio.pause(); })
            .catch(error => {
                if (!prime && level > 0 && !paused && error.name !== 'AbortError')
                    console.warn(`No se pudo reproducir ${label}:`, error);
            });
    }
    function sync() {
        cancelStop(); const now = context.currentTime;
        gain.gain.cancelScheduledValues(now);
        if (paused) { audio.pause(); gain.gain.setValueAtTime(0, now); return; }
        gain.gain.setTargetAtTime(level * volume, now, 0.25);
        if (level > 0) { if (audio.paused) play(); }
        else stopTimer = setTimeout(() => { stopTimer = null; if (level === 0) audio.pause(); }, 1500);
    }
    return {
        unlock() { if (!paused) play(true); },
        update(state) {
            const next = Math.max(0, Math.min(1, state.gain));
            if (Math.abs(next-level) > 0.0001 || (next === 0 && level !== 0)) { level = next; sync(); }
            panner.positionX.setTargetAtTime(state.x, context.currentTime, 0.1);
            panner.positionY.setTargetAtTime(state.y, context.currentTime, 0.1);
            panner.positionZ.setTargetAtTime(state.z, context.currentTime, 0.1);
        },
        setPaused(value) { paused = value; sync(); },
        reset() {
            level = 0; cancelStop(); audio.pause(); audio.currentTime = 0;
            gain.gain.cancelScheduledValues(context.currentTime); gain.gain.setValueAtTime(0, context.currentTime);
        }
    };
}
