// Programar ambos buffers en el mismo reloj sincroniza el encendido y el bucle.
export function createAltarFireAudio(context) {
    const output = context.createGain(), panner = context.createPanner();
    output.gain.value = 0;
    panner.panningModel = 'HRTF'; panner.rolloffFactor = 0;
    output.connect(panner); panner.connect(context.destination);
    let loading = null, buffers = null, requested = false, started = false, lastGain = -1;

    function prepare() {
        if (!loading) loading = Promise.all(['fuego_encender.wav','fuego_loop.wav'].map(file =>
            fetch('./sonidos/fx/'+file).then(response => {
                if (!response.ok) throw new Error('No se pudo cargar '+file);
                return response.arrayBuffer();
            }).then(data => context.decodeAudioData(data))))
            .then(result => { buffers = result; return true; })
            .catch(error => { console.warn('Error al cargar el fuego del altar:',error); return false; });
        return loading;
    }
    function start() {
        if (started || !buffers) return;
        started = true;
        const ignition = context.createBufferSource(), loop = context.createBufferSource();
        ignition.buffer = buffers[0]; loop.buffer = buffers[1]; loop.loop = true;
        const ignitionGain = context.createGain(), loopGain = context.createGain();
        ignitionGain.gain.value = 1; loopGain.gain.value = 0.2;
        ignition.connect(ignitionGain); ignitionGain.connect(output);
        loop.connect(loopGain); loopGain.connect(output);
        ignition.onended = () => { ignition.disconnect(); ignitionGain.disconnect(); };
        const when = context.currentTime+0.015;
        ignition.start(when);
        loop.start(when+1);
    }
    return {
        prepare,
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
