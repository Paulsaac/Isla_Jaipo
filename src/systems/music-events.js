// Audio de la partida: música única, pisadas y ambiente sintetizado.
export function createMusicEvents() {
    let context = null;
    let windStarted = false;
    let paused = false;
    let musicOutput = null;
    const tracks = {
        forest: {url:'./sonidos/musica/forest.flac',delay:5},
        morning: {url:'./sonidos/musica/morning.flac',delay:0}
    };

    function unlock() {
        if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
        if (!paused && context.state === 'suspended') context.resume().catch(error => console.warn('Audio pendiente de autorización del navegador:',error));
    }

    function setPaused(value) {
        paused = value;
        if (!context) return;
        // Suspender el reloj de audio conserva la posición de música, ráfagas y efectos.
        const operation = paused ? context.suspend() : context.resume();
        operation.catch(error => console.warn('No se pudo cambiar la pausa del audio:',error));
    }

    function getMusicOutput() {
        if (musicOutput) return musicOutput;
        musicOutput = context.createGain();
        const dry = context.createGain();
        dry.gain.value = 0.28;
        musicOutput.connect(dry);
        dry.connect(context.destination);
        const delay = context.createDelay();
        delay.delayTime.value = 0.065;
        const reverb = context.createConvolver();
        const duration = 8;
        const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * duration), context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let sample = 0; sample < data.length; sample++) {
                data[sample] = (Math.random() * 2 - 1) * Math.pow(1 - sample / data.length, 2.3);
            }
        }
        reverb.buffer = impulse;
        const softTail = context.createBiquadFilter();
        softTail.type = 'lowpass';
        softTail.frequency.value = 2400;
        const wet = context.createGain();
        wet.gain.value = 0.72;
        musicOutput.connect(delay);
        delay.connect(reverb);
        reverb.connect(softTail);
        softTail.connect(wet);
        wet.connect(context.destination);
        return musicOutput;
    }

    function trigger(name) {
        const track = tracks[name];
        if (!track || track.triggered) return;
        track.triggered = true;
        track.remaining = track.delay;
        // Preparar el archivo durante la espera para empezar sin una carga adicional.
        track.buffer = fetch(track.url).then(response => {
            if (!response.ok) throw new Error('No se pudo cargar '+track.url);
            return response.arrayBuffer();
        }).then(data => context.decodeAudioData(data));
        track.buffer.catch(error => { track.failed = true; console.warn('Error de música:',error); });
        if (track.delay === 0) update(0);
    }

    function update(delta) {
        if (paused) return;
        for (const track of Object.values(tracks)) {
            if (!track.triggered) continue;
            if (track.remaining > 0) track.remaining -= delta;
            if (track.started) continue;
            if (track.remaining > 0.000001) continue;
            track.started = true;
            track.buffer.then(buffer => {
                if (track.stopped) return;
                const source = context.createBufferSource();
                track.source = source;
                source.buffer = buffer;
                source.loop = false;
                const volume = context.createGain();
                volume.gain.value = 0.8;
                source.connect(volume);
                volume.connect(getMusicOutput());
                source.onended = () => { source.disconnect(); volume.disconnect(); track.source = null; };
                source.start();
                track.played = true;
            }).catch(error => {
                if (!track.failed) console.warn('Error al reproducir música:',error);
                track.failed = true;
            });
        }
    }

    function stopMusic() {
        for (const track of Object.values(tracks)) {
            if (!track.triggered) continue;
            track.stopped = true;
            track.started = true; // Cancelar también una pista que aún espera su retraso/carga.
            if (track.source) track.source.stop();
        }
    }

    function playFootstep(running = false, accent = 1) {
        if (!context || paused || context.state !== 'running') return;
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const pitch = 0.94 + Math.random() * 0.12;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(90 * pitch, now);
        oscillator.frequency.exponentialRampToValueAtTime(38 * pitch, now + 0.12);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime((running ? 0.1122 : 0.0816) * accent, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }

    function startWind() {
        if (!context || windStarted) return;
        windStarted = true;
        const now = context.currentTime;
        const buffer = context.createBuffer(2, context.sampleRate * 4, context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let sample = 0; sample < data.length; sample++) data[sample] = Math.random() * 2 - 1;
        }
        const noise = context.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const lowpass = context.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 950;
        lowpass.Q.value = 0.5;
        const highpass = context.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 100;
        const volume = context.createGain();
        volume.gain.setValueAtTime(0, now);
        volume.gain.linearRampToValueAtTime(0.078, now + 4);
        noise.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(volume);
        volume.connect(context.destination);
        // Dos ritmos lentos distintos evitan una ráfaga repetitiva de metrónomo.
        for (const [rate, intensity, tone] of [[0.07,0.0234,250],[0.113,0.0156,150]]) {
            const gust = context.createOscillator();
            gust.type = 'sine';
            gust.frequency.value = rate;
            const intensityGain = context.createGain();
            intensityGain.gain.value = intensity;
            const toneGain = context.createGain();
            toneGain.gain.value = tone;
            gust.connect(intensityGain);
            intensityGain.connect(volume.gain);
            gust.connect(toneGain);
            toneGain.connect(lowpass.frequency);
            gust.start(now + 4);
        }
        noise.start(now);
    }
    function hasEventStarted(name) {
        const track = tracks[name];
        // P o un fallo de audio no deben bloquear la misión; respetar igualmente la espera.
        return !!track && !!(track.played || ((track.stopped || track.failed) && track.remaining <= 0.000001));
    }
    return {unlock,setPaused,trigger,update,playFootstep,startWind,stopMusic,hasEventStarted};
}

export const musicEvents = createMusicEvents();
