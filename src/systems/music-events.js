import { createForestHeartBeacon, FOREST_HEART_BEACON_RANGE } from './forest-heart-beacon.js';
import { createWaterAudio } from './water-audio.js';
import { createForestAmbience } from './forest-ambience.js';
import { createRiverAmbience } from './river-ambience.js';
import { createAltarFireAudio } from './altar-fire-audio.js';
// Audio de la partida: música única, pisadas y ambiente.
export function createMusicEvents() {
    let context = null;
    let waterAudio = null;
    let forestAmbience = null;
    let riverAmbience = null;
    let altarFireAudio = null;
    let forestHeartBeacon = null;
    let grassFootstep = null;
    let grassFootstepLoad = null;
    let sandFootstep = null, sandFootstepB = null, sandFootstepLoad = null;
    let grassFootstepB = null, woodFootstep = null, extraFootstepLoad = null;
    const dirtFootsteps = [null, null];
    const footstepVariant = { dirt: 0, sand: 0 };
    const woodcuttingBuffers = [null, null, null];
    let woodcuttingLoad = null, woodcuttingVariant = 0;
    let indoorFootstepOutput = null;
    let windStarted = false;
    let windOutput = null;
    let windSheltered = false;
    let windUnderwater = false;
    let windFade = { from: 0, to: 0, start: 0, duration: 0 };
    let paused = false;
    let dapBuffer = null, dapLoad = null, dapSource = null, dapOffset = 0;
    let chestUnlockBuffer = null, chestUnlockSound = null;
    const musicOutputs = new Map();
    let underwaterOutput = null;
    let underwaterFilter = null;
    let underwaterPanner = null;
    let underwaterStereo = null;
    let underwaterPerspectiveGain = null;
    const underwaterPosition = { x: 0, y: 0, z: -1 };
    const forestEnergy = { bass: 0, treble: 0 };
    let forestAnalyser = null;
    let forestSpectrum = null;
    // Nombres de producto: Bosque, Mañana y Submarino. IDs técnicos conservados.
    const tracks = {
        forest: {url:'./sonidos/musica/bosque.mpeg',delay:4,volume:0.8,reverbMix:0.38,sky:true},
        morning: {url:'./sonidos/musica/mañana.mp3',delay:0,volume:1,reverbMix:0.5},
        underwater: {url:'./sonidos/musica/submarino.mp3',delay:0,volume:1}
    };

    function unlock() {
        if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
        if (!waterAudio) waterAudio = createWaterAudio(context);
        if (!forestAmbience) forestAmbience = createForestAmbience(context);
        if (!riverAmbience) riverAmbience = createRiverAmbience(context);
        if (!altarFireAudio) altarFireAudio = createAltarFireAudio(context);
        altarFireAudio.prepare();
        prepareGrassFootstep();
        prepareSandFootstep();
        prepareExtraFootsteps();
        prepareWoodcutting();
        prepareDap();
        getIndoorFootstepOutput();
        if (!paused && context.state === 'suspended') context.resume().catch(error => console.warn('Audio pendiente de autorización del navegador:',error));
        waterAudio.unlock();
        forestAmbience.unlock();
        riverAmbience.unlock();
    }

    function prepareGrassFootstep() {
        if (grassFootstepLoad) return;
        grassFootstepLoad = fetch('./sonidos/fx/pasto_a.mp3').then(response => {
            if (!response.ok) throw new Error('No se pudo cargar sonidos/fx/pasto_a.mp3');
            return response.arrayBuffer();
        }).then(data => context.decodeAudioData(data)).then(buffer => {
            grassFootstep = buffer;
        }).catch(error => console.warn('Error al cargar la pisada de pasto:', error));
    }

    function prepareSandFootstep() {
        if (sandFootstepLoad) return;
        sandFootstepLoad = fetch('./sonidos/fx/arena_a.mp3').then(response => {
            if (!response.ok) throw new Error('No se pudo cargar sonidos/fx/arena_a.mp3');
            return response.arrayBuffer();
        }).then(data => context.decodeAudioData(data)).then(buffer => {
            sandFootstep = buffer;
        }).catch(error => console.warn('Error al cargar la pisada de arena/nieve:', error));
    }

    function prepareExtraFootsteps() {
        if (extraFootstepLoad) return;
        const files = [
            ['pasto_b.mp3', buffer => { grassFootstepB = buffer; }],
            ['arena_b.mp3', buffer => { sandFootstepB = buffer; }],
            ['madera.mp3', buffer => { woodFootstep = buffer; }],
            ['tierra_a.ogg', buffer => { dirtFootsteps[0] = buffer; }],
            ['tierra_b.ogg', buffer => { dirtFootsteps[1] = buffer; }]
        ];
        extraFootstepLoad = Promise.all(files.map(([file, receive]) =>
            fetch('./sonidos/fx/' + file).then(response => {
                if (!response.ok) throw new Error('No se pudo cargar sonidos/fx/' + file);
                return response.arrayBuffer();
            }).then(data => context.decodeAudioData(data)).then(receive)
                .catch(error => console.warn('Error al cargar la pisada ' + file + ':', error))));
    }

    function prepareWoodcutting() {
        if (woodcuttingLoad) return;
        woodcuttingLoad = Promise.all(['a','b','c'].map((variant, index) =>
            fetch('./sonidos/fx/tronco_' + variant + '.wav').then(response => {
                if (!response.ok) throw new Error('No se pudo cargar tronco_' + variant);
                return response.arrayBuffer();
            }).then(data => context.decodeAudioData(data)).then(buffer => { woodcuttingBuffers[index] = buffer; })
                .catch(error => console.warn('Error al cargar golpe de madera:', error))));
    }

    function playWoodcuttingHit(broken) {
        if (!context || paused || context.state !== 'running') return;
        const buffer = woodcuttingBuffers[broken ? 2 : woodcuttingVariant];
        if (!buffer) return;
        const source = context.createBufferSource(); source.buffer = buffer;
        const gain = context.createGain(); gain.gain.value = 0.4;
        source.connect(gain); gain.connect(context.destination);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.start(context.currentTime);
        if (!broken) woodcuttingVariant = 1 - woodcuttingVariant;
    }

    function prepareDap() {
        if (dapLoad) return dapLoad;
        if (!context) return Promise.resolve(false);
        dapLoad = fetch('./sonidos/fx/dap.m4a').then(response => {
            if (!response.ok) throw new Error('No se pudo cargar sonidos/fx/dap.m4a');
            return response.arrayBuffer();
        }).then(data => context.decodeAudioData(data)).then(buffer => {
            dapBuffer = buffer;
            // Quitar solo silencio inicial para que el ataque coincida con el contacto.
            let peak = 0;
            for (let c = 0; c < buffer.numberOfChannels; c++) {
                const data = buffer.getChannelData(c);
                for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
            }
            let first = buffer.length;
            for (let c = 0; c < buffer.numberOfChannels; c++) {
                const data = buffer.getChannelData(c);
                for (let i = 0; i < first; i++) if (Math.abs(data[i]) > Math.max(0.003, peak * 0.05)) { first = i; break; }
            }
            dapOffset = Math.max(0, first / buffer.sampleRate - 0.015); return true;
        }).catch(error => { console.warn('Error al cargar el dap:', error); return false; });
        return dapLoad;
    }
    function stopDap() {
        if (!dapSource) return;
        const source = dapSource; dapSource = null; source.onended = null;
        try { source.stop(); } catch {} source.disconnect();
    }
    function playDap() {
        if (!context || paused || !dapBuffer) return false;
        stopDap(); const source = context.createBufferSource(); source.buffer = dapBuffer;
        source.connect(context.destination);
        source.onended = () => { if (dapSource === source) dapSource = null; source.disconnect(); };
        dapSource = source;
        source.start(context.currentTime, Math.min(dapOffset, Math.max(0, dapBuffer.duration - 0.01))); return true;
    }

    function updateChestUnlockPosition(position) {
        if (!chestUnlockSound || !position) return;
        const panner = chestUnlockSound.panner, now = context.currentTime;
        if (panner.positionX) {
            panner.positionX.setTargetAtTime(position.x, now, 0.02);
            panner.positionY.setTargetAtTime(position.y, now, 0.02);
            panner.positionZ.setTargetAtTime(position.z, now, 0.02);
        } else panner.setPosition(position.x, position.y, position.z);
    }
    function playChestUnlock(position) {
        if (!context || paused || !position || chestUnlockSound) return false;
        if (!chestUnlockBuffer) {
            const duration = 0.48;
            chestUnlockBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
            const data = chestUnlockBuffer.getChannelData(0);
            // Pasador metálico breve seguido por el chasquido de la cerradura.
            for (const [offset, frequency, strength, decay] of [[0,170,.38,42],[.10,1100,.22,24],[.22,260,.42,46]]) {
                for (let i = 0; i < Math.ceil(context.sampleRate * .20); i++) {
                    const t = i / context.sampleRate, index = Math.round(offset * context.sampleRate) + i;
                    const attack = Math.min(1, t / .002), release = Math.max(0, 1 - t / .20);
                    const tone = Math.sin(2 * Math.PI * frequency * t)
                        + .28 * Math.sin(2 * Math.PI * frequency * 2.73 * t);
                    data[index] += strength * attack * Math.exp(-t * decay) * release * tone;
                }
            }
        }
        const panner = context.createPanner();
        panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse';
        panner.refDistance = 8; panner.maxDistance = 45; panner.rolloffFactor = 1;
        if (panner.positionX) {
            panner.positionX.value = position.x; panner.positionY.value = position.y; panner.positionZ.value = position.z;
        } else panner.setPosition(position.x, position.y, position.z);
        const source = context.createBufferSource(); source.buffer = chestUnlockBuffer;
        source.connect(panner); panner.connect(context.destination);
        const sound = { source, panner }; chestUnlockSound = sound;
        source.onended = () => {
            if (chestUnlockSound === sound) chestUnlockSound = null;
            source.disconnect(); panner.disconnect();
        };
        source.start(context.currentTime); return true;
    }


    function updateForestHeartBeacon(position) {
        if (!context || paused || context.state !== 'running') return;
        if (!forestHeartBeacon && position && Math.hypot(position.x, position.y, position.z) < FOREST_HEART_BEACON_RANGE)
            forestHeartBeacon = createForestHeartBeacon(context);
        forestHeartBeacon?.update(position);
    }

    function setPaused(value) {
        paused = value;
        waterAudio?.setPaused(value);
        forestAmbience?.setPaused(value);
        riverAmbience?.setPaused(value);
        if (!context) return;
        // Suspender el reloj de audio conserva la posición de música, ráfagas y efectos.
        const operation = paused ? context.suspend() : context.resume();
        operation.catch(error => console.warn('No se pudo cambiar la pausa del audio:',error));
    }

    function getMusicOutput(reverbMix = 0.6, sky = false) {
        const outputKey = `${reverbMix}:${sky}`;
        if (musicOutputs.has(outputKey)) return musicOutputs.get(outputKey);
        const musicOutput = context.createGain();
        const dry = context.createGain();
        dry.gain.value = 1 - reverbMix;
        musicOutput.connect(dry);
        dry.connect(context.destination);
        const delay = context.createDelay();
        delay.delayTime.value = 0.065;
        const reverb = context.createConvolver();
        const duration = sky ? 3.4 : 8;
        const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * duration), context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let sample = 0; sample < data.length; sample++) {
                data[sample] = (Math.random() * 2 - 1) * Math.pow(1 - sample / data.length, 2.3);
            }
        }
        reverb.buffer = impulse;
        const wet = context.createGain();
        wet.gain.value = reverbMix;
        musicOutput.connect(delay);
        delay.connect(reverb);
        if (sky) {
            // Solo la reverberación de Bosque pierde los graves; el original queda intacto.
            const wetLowCut = context.createBiquadFilter();
            wetLowCut.type = 'highpass';
            wetLowCut.frequency.value = 350;
            wetLowCut.Q.value = 0.707;
            reverb.connect(wetLowCut);
            wetLowCut.connect(wet);
        } else {
            const softTail = context.createBiquadFilter();
            softTail.type = 'lowpass';
            softTail.frequency.value = 2400;
            reverb.connect(softTail);
            softTail.connect(wet);
        }
        wet.connect(context.destination);
        musicOutputs.set(outputKey, musicOutput);
        return musicOutput;
    }

    function getUnderwaterOutput() {
        if (underwaterOutput) return underwaterOutput;
        // Atenuación suave de agudos: conserva algo de detalle sobre el corte.
        underwaterOutput = context.createBiquadFilter();
        underwaterOutput.type = 'lowpass';
        underwaterOutput.frequency.value = 2000;
        underwaterOutput.Q.value = 0.707;
        underwaterFilter = context.createBiquadFilter();
        underwaterFilter.type = 'lowpass';
        underwaterFilter.frequency.value = 4000;
        underwaterFilter.Q.value = 0.707;
        underwaterPanner = context.createPanner();
        underwaterPanner.panningModel = 'HRTF';
        // Atenuación y paneo reforzados por perspectiva, calculados debajo.
        underwaterPanner.rolloffFactor = 0;
        underwaterStereo = context.createStereoPanner();
        underwaterPerspectiveGain = context.createGain();
        underwaterPanner.connect(underwaterStereo);
        underwaterStereo.connect(underwaterPerspectiveGain);
        underwaterPerspectiveGain.connect(context.destination);
        setUnderwaterPosition(underwaterPosition.x, underwaterPosition.y, underwaterPosition.z);
        underwaterOutput.connect(underwaterFilter);
        const dry = context.createGain();
        dry.gain.value = 0.2;
        underwaterFilter.connect(dry);
        dry.connect(underwaterPanner);
        const delay = context.createDelay();
        delay.delayTime.value = 0.02;
        const reverb = context.createConvolver();
        const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 5), context.sampleRate);
        for (let channel=0;channel<2;channel++) {
            const data=impulse.getChannelData(channel);
            for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2.8);
        }
        reverb.buffer = impulse;
        const damp = context.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 2000;
        const wet = context.createGain();
        wet.gain.value = 0.8;
        underwaterFilter.connect(delay);
        delay.connect(reverb);
        reverb.connect(damp);
        damp.connect(wet);
        wet.connect(underwaterPanner);
        return underwaterOutput;
    }

    // Coordenadas del objetivo relativas a la cámara; el listener permanece en el origen.
    function setUnderwaterPosition(x, y, z) {
        underwaterPosition.x = x; underwaterPosition.y = y; underwaterPosition.z = z;
        if (!underwaterPanner) return;
        const now = context.currentTime;
        underwaterPanner.positionX.setTargetAtTime(x, now, 0.05);
        underwaterPanner.positionY.setTargetAtTime(y, now, 0.05);
        underwaterPanner.positionZ.setTargetAtTime(z, now, 0.05);
        const distance = Math.hypot(x, y, z);
        const horizontalDistance = Math.hypot(x, z);
        const side = horizontalDistance > 0.001 ? x / horizontalDistance : 0;
        // Amplificar direcciones diagonales para que el objetivo se distinga al girar.
        const pan = Math.sign(side) * Math.pow(Math.abs(side), 0.65) * 0.95;
        const facing = distance > 0.001 ? (1 - z / distance) / 2 : 1;
        const directionGain = 0.25 + 0.75 * Math.pow(facing, 1.4);
        // Volumen completo cerca; a 48 unidades queda a la mitad. Nunca desaparece.
        const distanceGain = Math.max(0.3, 1 / (1 + Math.max(0, distance - 8) / 40));
        underwaterStereo.pan.setTargetAtTime(pan, now, 0.05);
        underwaterPerspectiveGain.gain.setTargetAtTime(directionGain * distanceGain, now, 0.05);
    }

    function prepare(name) {
        const track = tracks[name];
        if (!track) return Promise.resolve();
        if (track.buffer) return track.buffer;
        if (!context) unlock();
        // Construir la reverberación durante carga, antes de reproducir por primera vez.
        if (name === 'underwater') getUnderwaterOutput();
        else getMusicOutput(track.reverbMix, track.sky);
        track.buffer = fetch(track.url).then(response => {
            if (!response.ok) throw new Error('No se pudo cargar '+track.url);
            return response.arrayBuffer();
        }).then(data => context.decodeAudioData(data));
        track.buffer.catch(error => { track.failed = true; console.warn('Error de música:',error); });
        return track.buffer;
    }

    function trigger(name) {
        const track = tracks[name];
        if (!track || track.triggered) return;
        track.triggered = true;
        track.remaining = track.delay;
        prepare(name);
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
                volume.gain.value = track.volume;
                if (track === tracks.forest) {
                    forestAnalyser = context.createAnalyser();
                    forestAnalyser.fftSize = 1024;
                    forestAnalyser.smoothingTimeConstant = 0.65;
                    forestSpectrum = new Uint8Array(forestAnalyser.frequencyBinCount);
                    source.connect(forestAnalyser);
                    forestAnalyser.connect(volume);
                } else source.connect(volume);
                let underwaterMotion = null;
                let underwaterMotionDepth = null;
                if (track === tracks.underwater) {
                    volume.connect(getUnderwaterOutput());
                    // Vaivén lento del timbre, sin cambiar afinación ni velocidad de la canción.
                    underwaterMotion = context.createOscillator();
                    underwaterMotion.type = 'sine';
                    underwaterMotion.frequency.value = 0.09;
                    underwaterMotionDepth = context.createGain();
                    underwaterMotionDepth.gain.value = 100;
                    underwaterMotion.connect(underwaterMotionDepth);
                    underwaterMotionDepth.connect(underwaterFilter.frequency);
                    underwaterMotion.start();
                } else volume.connect(getMusicOutput(track.reverbMix, track.sky));
                source.onended = () => {
                    track.ended = true;
                    source.disconnect(); volume.disconnect(); track.source = null;
                    if (underwaterMotion) {
                        underwaterMotion.stop();
                        underwaterMotion.disconnect();
                        underwaterMotionDepth.disconnect();
                    }
                    if (track === tracks.forest && forestAnalyser) {
                        forestAnalyser.disconnect(); forestAnalyser = null;
                    }
                };
                track.duration = buffer.duration;
                track.startedAt = context.currentTime;
                source.start(track.startedAt);
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

    function getIndoorFootstepOutput() {
        if (indoorFootstepOutput) return indoorFootstepOutput;
        indoorFootstepOutput = context.createGain();
        indoorFootstepOutput.gain.value = 1.2;
        const dry = context.createGain();
        dry.gain.value = 0.6;
        indoorFootstepOutput.connect(dry);
        dry.connect(context.destination);
        const reverb = context.createConvolver();
        const impulse = context.createBuffer(1, Math.ceil(context.sampleRate * 0.45), context.sampleRate);
        for (let channel = 0; channel < 1; channel++) {
            const samples = impulse.getChannelData(channel);
            for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3);
        }
        reverb.buffer = impulse;
        const softTail = context.createBiquadFilter();
        softTail.type = 'lowpass';
        softTail.frequency.value = 1800;
        const wet = context.createGain();
        wet.gain.value = 0.4;
        indoorFootstepOutput.connect(reverb);
        reverb.connect(softTail);
        softTail.connect(wet);
        wet.connect(context.destination);
        return indoorFootstepOutput;
    }

    function playFootstep(running = false, accent = 1, outdoor = false, isLeft = true, surface = outdoor ? 'grass' : 'indoor') {
        if (!context || paused || context.state !== 'running') return;
        const now = context.currentTime;
        if (outdoor || ['sand','dirt','wood'].includes(surface)) {
            const variants = surface === 'dirt' ? dirtFootsteps : surface === 'grass' ? [grassFootstep,grassFootstepB] : surface === 'sand' ? [sandFootstep,sandFootstepB] : null;
            const index = variants ? (surface === 'grass' ? Math.floor(Math.random() * 2) : footstepVariant[surface]) : 0;
            const buffer = variants ? variants[index] || variants[1-index] : surface === 'wood' ? woodFootstep : sandFootstep;
            if (!buffer) return;
            const source = context.createBufferSource();
            source.buffer = buffer;
            if (surface === 'grass') source.detune.value = (Math.random() * 2 - 1) * 35; // ±35 cents por pisada.
            const gain = context.createGain();
            const outdoorVolume = running ? 0.0952 : 0.0952 * (0.0816 / 0.1122);
            // La salida interior multiplica por 1.2: compensarla para duplicar el pasto.
            const volume = surface === 'wood' ? outdoorVolume * 2 / 1.2 : outdoorVolume;
            gain.gain.value = volume * accent;
            source.connect(gain);
            gain.connect(surface === 'wood' ? getIndoorFootstepOutput() : context.destination);
            source.onended = () => { source.disconnect(); gain.disconnect(); };
            source.start(now);
            if (variants && surface !== 'grass') footstepVariant[surface] = 1-index;
            return;
        }
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const pitch = (isLeft ? 0.98 : 1.02) * (0.98 + Math.random() * 0.04);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(126 * pitch, now);
        oscillator.frequency.exponentialRampToValueAtTime(53.2 * pitch, now + 0.12);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime((running ? 0.1122 : 0.0816) * accent, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.182);
        oscillator.connect(gain);
        gain.connect(getIndoorFootstepOutput());
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.195);
    }

    function updateWind(sheltered, underwater = false) {
        if (windSheltered === sheltered && windUnderwater === underwater) return;
        windSheltered = sheltered;
        windUnderwater = underwater;
        if (!windOutput) return;
        const now = context.currentTime;
        const progress = windFade.duration ? Math.min(1, Math.max(0, (now - windFade.start) / windFade.duration)) : 1;
        const current = windFade.from + (windFade.to - windFade.from) * progress;
        const target = underwater ? 0 : sheltered ? 0.075 : 0.75;
        const duration = underwater ? 0 : sheltered ? 2 : 5;
        windOutput.gain.cancelScheduledValues(now);
        // Conservar el nivel actual si se cruza la puerta durante un fundido.
        windOutput.gain.setValueAtTime(duration ? current : target, now);
        if (duration) windOutput.gain.linearRampToValueAtTime(target, now + duration);
        windFade = { from: current, to: target, start: now, duration };
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
        // Ráfagas entre el 50% y el 90% de la base anterior (centro 70%, amplitud 20%).
        volume.gain.linearRampToValueAtTime(0.01904, now + 4);
        noise.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(volume);
        windOutput = context.createGain();
        windOutput.gain.value = windUnderwater ? 0 : windSheltered ? 0.075 : 0.75;
        windFade = { from: windOutput.gain.value, to: windOutput.gain.value, start: now, duration: 0 };
        volume.connect(windOutput);
        windOutput.connect(context.destination);
        // Dos ritmos lentos distintos evitan una ráfaga repetitiva de metrónomo.
        for (const [rate, intensity, tone] of [[0.07,0.012,250],[0.113,0.008,150]]) {
            const gust = context.createOscillator();
            gust.type = 'sine';
            gust.frequency.value = rate;
            const intensityGain = context.createGain();
            intensityGain.gain.value = intensity * 0.272;
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
    function getForestEnergy() {
        forestEnergy.bass = forestEnergy.treble = 0;
        if (!forestAnalyser || paused || !tracks.forest.source) return forestEnergy;
        forestAnalyser.getByteFrequencyData(forestSpectrum);
        const binHz = context.sampleRate / forestAnalyser.fftSize;
        function band(low, high) {
            const start = Math.max(1, Math.ceil(low / binHz));
            const end = Math.min(forestSpectrum.length, Math.ceil(high / binHz));
            let total = 0;
            for (let i = start; i < end; i++) total += forestSpectrum[i] / 255;
            return total / Math.max(1, end - start);
        }
        forestEnergy.bass = band(45, 250);
        forestEnergy.treble = band(1800, 6000);
        return forestEnergy;
    }
    function isEventActive(name) {
        const track = tracks[name];
        return !!track?.triggered && !track.ended && !track.stopped && !track.failed;
    }
    function getEventTimeRemaining(name) {
        if (!isEventActive(name)) return 0;
        const track = tracks[name];
        if (!track.played) return Infinity;
        return Math.max(0, track.duration - (context.currentTime - track.startedAt));
    }
    // Tiempo del archivo original: excluye los 4s de espera y se congela al pausar AudioContext.
    function getEventPlaybackTime(name) {
        const track = tracks[name];
        if (!context || paused || context.state !== 'running' || !track?.played || !track.source || !isEventActive(name)) return null;
        return Math.max(0, Math.min(track.duration, context.currentTime - track.startedAt));
    }
    function getEventDuration(name) { return tracks[name]?.duration ?? 0; }
    return {unlock,setPaused,igniteAltarFire: () => altarFireAudio?.ignite(),updateAltarFirePosition: state => altarFireAudio?.updatePosition(state),updateRiverAmbience: state => riverAmbience?.update(state),resetRiverAmbience: () => riverAmbience?.reset(),playWoodcuttingHit,updateWind,updateForestAmbience: state => forestAmbience?.update(state),resetForestAmbience: () => forestAmbience?.reset(),updateWaterAudio: state => waterAudio?.update(state),resetWaterAudio: () => waterAudio?.reset(),playChestUnlock,updateChestUnlockPosition,isChestUnlockPlaying:()=>!!chestUnlockSound,updateForestHeartBeacon,prepareDap,playDap,stopDap,prepare,trigger,update,setUnderwaterPosition,playFootstep,startWind,stopMusic,hasEventStarted,getForestEnergy,isEventActive,getEventTimeRemaining,getEventDuration,getEventPlaybackTime};
}

export const musicEvents = createMusicEvents();
