import { createForestHeartBeacon, FOREST_HEART_BEACON_RANGE } from './forest-heart-beacon.js';
import { createWaterAudio } from './water-audio.js';
import { createForestAmbience } from './forest-ambience.js';
import { createRiverAmbience } from './river-ambience.js';
import { createSeaAmbience } from './sea-ambience.js';
import { createAltarFireAudio } from './altar-fire-audio.js';
import { createInteractionAudio } from './interaction-audio.js';
import { createObservatoryGearAudio } from './observatory-gear-audio.js';
import { createForestPreviewAudio } from './forest-preview-audio.js';
// Audio de la partida: música única, pisadas y ambiente.
export function createMusicEvents() {
    let context = null;
    let waterAudio = null;
    let forestAmbience = null;
    let nightForestAmbience = null, interactionAudio = null;
    let riverAmbience = null;
    let seaAmbience = null;
    let altarFireAudio = null, stoveFireAudio = null;
    let observatoryGearAudio = null;
    let observatoryLensSound = null;
    let forestHeartBeacon = null;
    let grassFootstep = null;
    let grassFootstepLoad = null;
    let sandFootstep = null, sandFootstepB = null, sandFootstepLoad = null;
    let grassFootstepB = null, woodFootstep = null, extraFootstepLoad = null;
    const dirtFootsteps = [null, null];
    const bedJumps = [null, null];
    let bedJumpLoad = null;
    const bedCeilingSounds = [null, null];
    let bedCeilingSoundLoad = null;
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
    let chestUnlockSound = null;
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
        forest: {url:'./sonidos/musica/bosque.mp3',delay:4},
        morning: {url:'./sonidos/musica/mañana.mp3',delay:0,volume:1,reverbMix:0.5},
        underwater: {url:'./sonidos/musica/submarino.mp3',delay:0,volume:1}
    };
    const forestPreview=createForestPreviewAudio(()=>prepare('forest'),active=>{
        if(context)(paused||active?context.suspend():context.resume()).catch(()=>{});
    });

    function unlock() {
        if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
        if (!observatoryGearAudio) observatoryGearAudio = createObservatoryGearAudio(context);
        observatoryGearAudio.prepare();
        if (!waterAudio) waterAudio = createWaterAudio(context);
        if (!forestAmbience) forestAmbience = createForestAmbience(context);
        if (!nightForestAmbience) nightForestAmbience = createForestAmbience(context, './sonidos/fx/bosque_noche_web.mp3');
        if (!interactionAudio) interactionAudio = createInteractionAudio(context, () => paused);
        interactionAudio.prepare();
        if (!riverAmbience) riverAmbience = createRiverAmbience(context);
        if (!seaAmbience) seaAmbience = createSeaAmbience(context);
        if (!altarFireAudio) altarFireAudio = createAltarFireAudio(context);
        altarFireAudio.prepare();
        if (!stoveFireAudio) stoveFireAudio = createAltarFireAudio(context,{ignitionVolume:0.375,loopVolume:0.0375,mono:true});
        stoveFireAudio.prepare();
        prepareGrassFootstep();
        prepareSandFootstep();
        prepareExtraFootsteps();
        prepareBedJumps();
        prepareBedCeilingSounds();
        prepareWoodcutting();
        prepareDap();
        getIndoorFootstepOutput();
        if (!paused && !forestPreview.active && context.state === 'suspended') context.resume().catch(error => console.warn('Audio pendiente de autorización del navegador:',error));
        waterAudio.unlock();
        forestAmbience.unlock();
        nightForestAmbience.unlock();
        riverAmbience.unlock();
        seaAmbience.unlock();
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

    function prepareBedJumps() {
        if (bedJumpLoad) return;
        bedJumpLoad = Promise.all(['a', 'b'].map((variant, index) =>
            fetch(`./sonidos/fx/cama_${variant}.wav`).then(response => {
                if (!response.ok) throw new Error(`No se pudo cargar cama_${variant}.wav`);
                return response.arrayBuffer();
            }).then(data => context.decodeAudioData(data)).then(buffer => { bedJumps[index] = buffer; })
                .catch(error => console.warn('Error al cargar el salto en cama:', error))));
    }

    function playBedJump() {
        if (!context || paused || context.state !== 'running') return;
        const index = Math.floor(Math.random() * bedJumps.length);
        const buffer = bedJumps[index] || bedJumps[1 - index];
        if (!buffer) return;
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.detune.value = (Math.random() * 2 - 1) * 35;
        const gain = context.createGain();
        gain.gain.value = 0.115;
        source.connect(gain);
        gain.connect(getIndoorFootstepOutput());
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.start(context.currentTime);
    }

    function prepareBedCeilingSounds() {
        if (bedCeilingSoundLoad) return;
        bedCeilingSoundLoad = Promise.all(['break_wood_1.mp3', 'break_wood_2.mp3'].map((file, index) =>
            fetch('./sonidos/fx/' + file).then(response => {
                if (!response.ok) throw new Error('No se pudo cargar sonidos/fx/' + file);
                return response.arrayBuffer();
            }).then(data => context.decodeAudioData(data)).then(buffer => { bedCeilingSounds[index] = buffer; })
                .catch(error => console.warn('Error al cargar el sonido de rotura del techo:', error))));
    }

    function playBedCeilingSound(index) {
        if (!context || paused || context.state !== 'running') return;
        const buffer = bedCeilingSounds[index];
        if (!buffer) return;
        const source = context.createBufferSource(); source.buffer = buffer;
        const gain = context.createGain(); gain.gain.value = 0.4;
        source.connect(gain); gain.connect(context.destination);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.start(context.currentTime);
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
        if (!context || paused || !position) return false;
        interactionAudio?.play('chest',position,sound=>{
            chestUnlockSound=sound;
            sound.onended=()=>{if(chestUnlockSound===sound)chestUnlockSound=null;};
        });
        return true;
    }
    function playHelmetCrack(stage = 1) {
        const id = stage === 3 ? 'helmetCrack3' : stage === 2 ? 'helmetCrack2' : 'helmetCrack';
        const playback = {playing:false};
        interactionAudio?.play(id,{x:0.2,y:0.15,z:-0.3},sound=>{
            playback.playing = true;
            sound.onended = () => { playback.playing = false; };
        });
        return playback;
    }
    function playHelmetGlassPop() {
        return interactionAudio?.play('helmetGlassPop',{x:0.2,y:0.15,z:-0.3});
    }

    function updateForestAmbience(state) {
        forestAmbience?.update({...state,gain:state.night?0:state.gain});
        nightForestAmbience?.update({...state,gain:state.night?state.gain:0});
    }
    function resetForestAmbience() {forestAmbience?.reset();nightForestAmbience?.reset();}


    function updateForestHeartBeacon(position) {
        if (!context || paused || context.state !== 'running') return;
        if (!forestHeartBeacon && position && Math.hypot(position.x, position.y, position.z) < FOREST_HEART_BEACON_RANGE)
            forestHeartBeacon = createForestHeartBeacon(context);
        forestHeartBeacon?.update(position);
    }

    function setPaused(value) {
        paused = value;
        forestPreview.setWorldPaused(value);
        waterAudio?.setPaused(value);
        forestAmbience?.setPaused(value);
        nightForestAmbience?.setPaused(value);
        riverAmbience?.setPaused(value);
        seaAmbience?.setPaused(value);
        if (!context) return;
        // Suspender el reloj de audio conserva la posición de música, ráfagas y efectos.
        const operation = paused || forestPreview.active ? context.suspend() : context.resume();
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
        else if (name !== 'forest') getMusicOutput(track.reverbMix, track.sky);
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
        if (paused || forestPreview.active) return;
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
                const volume = track === tracks.forest ? null : context.createGain();
                if (volume) volume.gain.value = track.volume;
                if (track === tracks.forest) {
                    forestAnalyser = context.createAnalyser();
                    forestAnalyser.fftSize = 1024;
                    forestAnalyser.smoothingTimeConstant = 0.65;
                    forestSpectrum = new Uint8Array(forestAnalyser.frequencyBinCount);
                    // MP3 directo, sin ganancia ni efectos. El analizador solo observa en paralelo.
                    source.connect(context.destination);
                    source.connect(forestAnalyser);
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
                } else if (volume) volume.connect(getMusicOutput(track.reverbMix, track.sky));
                source.onended = () => {
                    track.ended = true;
                    source.disconnect(); volume?.disconnect(); track.source = null;
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

    function playObservatoryLensChange(stellar) {
        interactionAudio?.play(stellar?'lensChangeStellar':'lensChange',{x:0,y:0,z:-.3},sound=>{
            if(observatoryLensSound)observatoryLensSound.source.stop();
            observatoryLensSound=sound;
            sound.onended=()=>{if(observatoryLensSound===sound)observatoryLensSound=null;};
        });
    }
    function setObservatoryGearMoving(moving,silent=false) {
        if(moving&&observatoryLensSound){observatoryLensSound.source.stop();observatoryLensSound=null;}
        observatoryGearAudio?.setMoving(moving,silent);
    }

    function resetSeaHeartEvent() {
        // Invalidar también una carga pendiente sin afectar Bosque ni Mañana.
        const track=tracks.underwater;
        track.stopped=true;
        if(track.source)track.source.stop();
        tracks.underwater={url:track.url,delay:track.delay,volume:track.volume,
            buffer:track.failed?undefined:track.buffer};
        altarFireAudio?.reset();
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

    function playFootstep(running = false, accent = 1, outdoor = false, isLeft = true, surface = outdoor ? 'grass' : 'indoor', highPitch = false) {
        if (!context || paused || context.state !== 'running') return;
        const now = context.currentTime;
        // La superficie decide la grabación, incluso si la celda no está marcada
        // como exterior. La piedra usa las tomas secas de tierra/grava.
        const indoor = surface === 'indoor';
        if (indoor) surface = 'dirt';
        {
            const variants = surface === 'dirt' ? dirtFootsteps : surface === 'grass' ? [grassFootstep,grassFootstepB] : surface === 'sand' ? [sandFootstep,sandFootstepB] : null;
            const index = variants ? (surface === 'grass' ? Math.floor(Math.random() * 2) : footstepVariant[surface]) : 0;
            const buffer = variants ? variants[index] || variants[1-index] : surface === 'wood' ? woodFootstep : sandFootstep;
            if (!buffer) return;
            const source = context.createBufferSource();
            source.buffer = buffer;
            // Variación corta en cada reproducción para que las pisadas no suenen idénticas.
            // El salto conserva un sesgo agudo leve, dentro de un rango moderado.
            // La toma B de pasto es más brillante: bajarla cuatro semitonos y
            // estrechar la variación para acercar ambas tomas sin igualarlas.
            const grassPitchOffset = surface === 'grass' && buffer === grassFootstepB ? -400 : 0;
            const pitchVariation = surface === 'grass' ? 20 : 45;
            source.detune.value = grassPitchOffset + (highPitch
                ? 20 + Math.random() * 20
                : (Math.random() * 2 - 1) * pitchVariation);
            const gain = context.createGain();
            const outdoorVolume = running ? 0.0952 : 0.0952 * (0.0816 / 0.1122);
            // La salida interior multiplica por 1.2: compensarla para duplicar el pasto.
            const volume = surface === 'wood' ? outdoorVolume * 2 / 1.2 : outdoorVolume;
            gain.gain.value = volume * accent;
            source.connect(gain);
            gain.connect(surface === 'wood' || indoor ? getIndoorFootstepOutput() : context.destination);
            source.onended = () => { source.disconnect(); gain.disconnect(); };
            source.start(now);
            if (variants && surface !== 'grass') footstepVariant[surface] = 1-index;
            return;
        }
    }

    function playDialogueCharacter(character) {
        if (!context || paused || context.state !== 'running') return;
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 270 + (character.codePointAt(0) % 4) * 14;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.014, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.027);
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
        if(forestPreview.active)return forestPreview.getEnergy();
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
        if(name==='forest'&&forestPreview.active)return true;
        const track = tracks[name];
        return !!track?.triggered && !track.ended && !track.stopped && !track.failed;
    }
    function getEventTimeRemaining(name) {
        if(name==='forest'&&forestPreview.active)return Math.max(0,forestPreview.duration-forestPreview.time);
        if (!isEventActive(name)) return 0;
        const track = tracks[name];
        if (!track.played) return Infinity;
        return Math.max(0, track.duration - (context.currentTime - track.startedAt));
    }
    // Tiempo del archivo original: excluye los 4s de espera y se congela al pausar AudioContext.
    function getEventPlaybackTime(name) {
        if(name==='forest'&&forestPreview.active)return forestPreview.time;
        const track = tracks[name];
        if (!context || paused || context.state !== 'running' || !track?.played || !track.source || !isEventActive(name)) return null;
        return Math.max(0, Math.min(track.duration, context.currentTime - track.startedAt));
    }
    function getEventDuration(name) { return name==='forest'&&forestPreview.active?forestPreview.duration:tracks[name]?.duration??0; }
    function playWakeSplash() { waterAudio?.playWakeSplash(); }
    return {playSkyHeartQuench:position=>interactionAudio?.play('skyQuench',position),playSkyHeartImpact:position=>interactionAudio?.play('skyImpact',position),forestPreview,unlock,setPaused,playWakeSplash,playObservatoryLensChange,setObservatoryGearMoving,resetSeaHeartEvent,playHelmetCrack,playHelmetGlassPop,igniteStoveFire: () => stoveFireAudio?.ignite(),updateStoveFirePosition: state => stoveFireAudio?.updatePosition(state),igniteAltarFire: () => altarFireAudio?.ignite(),updateAltarFirePosition: state => altarFireAudio?.updatePosition(state),updateSeaAmbience: state => seaAmbience?.update(state),resetSeaAmbience: () => seaAmbience?.reset(),updateRiverAmbience: state => riverAmbience?.update(state),resetRiverAmbience: () => riverAmbience?.reset(),playWoodcuttingHit,playBedJump,playBedCeilingImpact: () => playBedCeilingSound(0),playBedCeilingRelease: () => playBedCeilingSound(1),playDialogueCharacter,updateWind,updateForestAmbience,resetForestAmbience,updateWaterAudio: state => waterAudio?.update(state),resetWaterAudio: () => waterAudio?.reset(),playChestUnlock,playDoorOpen:position=>interactionAudio?.play('door',position),playDoorClose:position=>interactionAudio?.play('door',position,undefined,true),playDoorKey:position=>interactionAudio?.play('key',position),updateChestUnlockPosition,isChestUnlockPlaying:()=>!!chestUnlockSound,updateForestHeartBeacon,prepareDap,playDap,stopDap,prepare,trigger,update,setUnderwaterPosition,playFootstep,startWind,stopMusic,hasEventStarted,getForestEnergy,isEventActive,getEventTimeRemaining,getEventDuration,getEventPlaybackTime};
}

export const musicEvents = createMusicEvents();
