// Pista auditiva local del objeto: un solo bucle mono y atenuación suave por distancia.
export const FOREST_HEART_BEACON_RANGE = 90;

export function getForestHeartBeaconGain(distance) {
    const t = Math.max(0, Math.min(1, distance / FOREST_HEART_BEACON_RANGE));
    const smooth = t * t * (3 - 2 * t);
    return 0.42 * (1 - smooth) ** 2;
}

export function createForestHeartBeacon(context) {
    const volume = context.createGain();
    volume.gain.value = 0;
    const panner = context.createPanner();
    panner.panningModel = 'HRTF';
    panner.rolloffFactor = 0; // La curva anterior controla toda la atenuación.
    volume.connect(panner);
    panner.connect(context.destination);

    // Dos pulsos graves con armónicos suaves para que también se lean en altavoz móvil.
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 1.05), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (const [offset, strength] of [[0.035, 1], [0.255, 0.68]]) {
        const length = Math.ceil(context.sampleRate * 0.22);
        for (let i = 0; i < length; i++) {
            const t = i / context.sampleRate;
            const attack = Math.min(1, t / 0.008);
            const release = Math.max(0, 1 - t / 0.22);
            const envelope = attack * Math.exp(-t * 22) * release * release;
            const phase = 2 * Math.PI * (115 * t - 110 * t * t);
            const tone = Math.sin(phase) + 0.3 * Math.sin(2 * phase) + 0.08 * Math.sin(3 * phase);
            const index = Math.round(offset * context.sampleRate) + i;
            samples[index] += 0.58 * strength * envelope * tone;
        }
    }
    let source = null;
    function stop() {
        if (!source) return;
        const now = context.currentTime;
        volume.gain.cancelScheduledValues(now);
        volume.gain.setTargetAtTime(0, now, 0.08);
        source.stop(now + 0.4);
        source = null;
    }
    function update(position) {
        if (!position || Math.hypot(position.x, position.y, position.z) >= FOREST_HEART_BEACON_RANGE) {
            stop(); return;
        }
        const now = context.currentTime;
        if (panner.positionX) {
            panner.positionX.setTargetAtTime(position.x, now, 0.05);
            panner.positionY.setTargetAtTime(position.y, now, 0.05);
            panner.positionZ.setTargetAtTime(position.z, now, 0.05);
        } else panner.setPosition(position.x, position.y, position.z);
        if (!source) {
            source = context.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.connect(volume);
            const playing = source;
            playing.onended = () => { playing.disconnect(); };
            source.start(now);
        }
        volume.gain.setTargetAtTime(getForestHeartBeaconGain(Math.hypot(position.x, position.y, position.z)), now, 0.12);
    }
    return { update, stop };
}
