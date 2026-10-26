// Altar y estufa comparten buffers, con reproducción y posición independientes.
const fireBufferLoads = new WeakMap();
// Programar ambos buffers en el mismo reloj sincroniza el encendido y el bucle.
export function createAltarFireAudio(context, { ignitionVolume = 1, loopVolume = 0.2, mono = false } = {}) {
    const output = context.createGain(), panner = context.createPanner();
    output.gain.value = 0;
    panner.panningModel = 'HRTF'; panner.rolloffFactor = 0;
    output.connect(panner); panner.connect(context.destination);
    let loading = null, buffers = null, requested = false, started = false, lastGain = -1;
    const voices = new Set();

    function prepare() {
        if (!loading) {
            let shared=fireBufferLoads.get(context);
            if(!shared) {
                shared=Promise.all(['fuego_encender.wav','fuego_loop.wav'].map(file =>
                    fetch('./sonidos/fx/'+file).then(response => {
                        if (!response.ok) throw new Error('No se pudo cargar '+file);
                        return response.arrayBuffer();
                    }).then(data => context.decodeAudioData(data))));
                fireBufferLoads.set(context,shared);
            }
            loading=shared.then(result => {
                // Conservar los originales compartidos; la estufa usa su propia mezcla mono.
                buffers = mono ? result.map(buffer => {
                    if (buffer.numberOfChannels === 1) return buffer;
                    const mixed = context.createBuffer(1, buffer.length, buffer.sampleRate);
                    const samples = mixed.getChannelData(0);
                    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                        const input = buffer.getChannelData(channel);
                        for (let i = 0; i < samples.length; i++) samples[i] += input[i] / buffer.numberOfChannels;
                    }
                    return mixed;
                }) : result;
                return true;
            })
                .catch(error => { console.warn('Error al cargar el fuego:',error); return false; });
        }
        return loading;
    }
    function start() {
        if (started || !requested || !buffers) return;
        started = true;
        const ignition = context.createBufferSource(), loop = context.createBufferSource();
        ignition.buffer = buffers[0]; loop.buffer = buffers[1]; loop.loop = true;
        const ignitionGain = context.createGain(), loopGain = context.createGain();
        ignitionGain.gain.value = ignitionVolume; loopGain.gain.value = loopVolume;
        ignition.connect(ignitionGain); ignitionGain.connect(output);
        loop.connect(loopGain); loopGain.connect(output);
        voices.add(ignition);voices.add(loop);
        ignition.onended = () => { voices.delete(ignition);ignition.disconnect(); ignitionGain.disconnect(); };
        loop.onended = () => { voices.delete(loop);loop.disconnect();loopGain.disconnect(); };
        const when = context.currentTime+0.015;
        ignition.start(when);
        loop.start(when+1);
    }
    return {
        prepare,
        reset() {
            requested=false;started=false;
            for(const source of voices)source.stop();
            voices.clear();
        },
        ignite() {
            if (requested) return false;
            requested = true;
            if (buffers) start(); else prepare().then(ok => { if (ok) start(); });
            return true;
        },
        updatePosition({x,y,z,enabled = true}) {
            const distance = Math.hypot(x,y,z), t = Math.min(1,distance/40);
            const gain = enabled ? (1-t*t*(3-2*t))**2 : 0;
            if (Math.abs(gain-lastGain)>0.0001 || (gain===0 && lastGain!==0)) {
                output.gain.setTargetAtTime(gain,context.currentTime,0.12); lastGain=gain;
            }
            panner.positionX.setTargetAtTime(x,context.currentTime,0.05);
            panner.positionY.setTargetAtTime(y,context.currentTime,0.05);
            panner.positionZ.setTargetAtTime(z,context.currentTime,0.05);
        }
    };
}
