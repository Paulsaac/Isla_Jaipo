// Efectos de agua independientes de las pistas musicales, con el mismo reloj de pausa.
export function createWaterAudio(context) {
    const ambience = new Audio('./sonidos/fx/submarino_fx.mp3');
    ambience.loop = true;
    ambience.preload = 'metadata'; // El ambiente largo se reproduce como medio, sin decodeAudioData completo.
    const ambienceGain = context.createGain();
    ambienceGain.gain.value = 0;
    context.createMediaElementSource(ambience).connect(ambienceGain);
    ambienceGain.connect(context.destination);
    const splashGain = context.createGain(); splashGain.gain.value = .35; splashGain.connect(context.destination);
    const splashes = new Set();
    let splashBuffer = null, loading = null, paused = false, touching = false, submerged = false;
    let stopTimer = null, lastSplash = -Infinity;

    function prepare() {
        if (!loading) loading = fetch('./sonidos/fx/splash.mp3').then(response => {
            if (!response.ok) throw new Error('No se pudo cargar sonidos/fx/splash.mp3');
            return response.arrayBuffer();
        }).then(data => context.decodeAudioData(data)).then(buffer => {
            splashBuffer = buffer; return true;
        }).catch(error => { console.warn('Error al cargar el splash:', error); return false; });
        return loading;
    }
    function cancelStop() { if (stopTimer !== null) clearTimeout(stopTimer); stopTimer = null; }
    function playAmbience(prime = false) {
        const playing = ambience.play();
        playing?.then(() => {
            // Autorizar el medio durante el gesto de inicio no debe hacerlo sonar en tierra.
            if (paused || (prime && !submerged)) ambience.pause();
        }).catch(error => {
            if (!prime && submerged && !paused && error.name !== 'AbortError')
                console.warn('No se pudo reproducir el ambiente submarino:', error);
        });
    }
    function unlock() {
        prepare();
        if (!paused) playAmbience(true);
    }
    function syncAmbience() {
        cancelStop();
        const now = context.currentTime;
        ambienceGain.gain.cancelScheduledValues(now);
        if (paused) {
            ambience.pause(); ambienceGain.gain.setValueAtTime(0, now);
        } else if (submerged) {
            ambienceGain.gain.setTargetAtTime(.2205, now, .04);
            if (ambience.paused) playAmbience();
        } else {
            ambienceGain.gain.setTargetAtTime(0, now, .025);
            stopTimer = setTimeout(() => { stopTimer = null; if (!submerged) ambience.pause(); }, 140);
        }
    }
    function splash() {
        if (paused || !splashBuffer || context.state !== 'running' || context.currentTime-lastSplash < .35) return;
        lastSplash = context.currentTime;
        // Saltar reiteradamente no acumula indefinidamente colas de splash.
        if (splashes.size >= 3) {
            const oldest = splashes.values().next().value;
            oldest.stop(); oldest.disconnect(); splashes.delete(oldest);
        }
        const source = context.createBufferSource(); source.buffer = splashBuffer;
        source.playbackRate.value = 1.25;
        source.connect(splashGain); splashes.add(source);
        source.onended = () => { source.disconnect(); splashes.delete(source); };
        source.start();
    }
    function update({ waterPresent, feetY, eyeY, waterHeight, enabled = true }) {
        if (paused) return;
        const wet = enabled && waterPresent && feetY <= waterHeight + (touching ? .10 : .02);
        const below = enabled && waterPresent && eyeY < waterHeight - (submerged ? 0 : .03);
        const surfaced = submerged && !below && enabled && waterPresent && eyeY >= waterHeight;
        if ((wet && !touching) || surfaced) splash();
        touching = wet;
        if (below !== submerged) { submerged = below; syncAmbience(); }
    }
    function setPaused(value) { paused = value; syncAmbience(); }
    function reset() {
        cancelStop(); touching = submerged = false; lastSplash = -Infinity;
        ambience.pause(); ambience.currentTime = 0;
        ambienceGain.gain.cancelScheduledValues(context.currentTime);
        ambienceGain.gain.setValueAtTime(0, context.currentTime);
        for (const source of splashes) { source.onended = null; source.stop(); source.disconnect(); }
        splashes.clear();
    }
    return { prepare, unlock, update, setPaused, reset };
}
