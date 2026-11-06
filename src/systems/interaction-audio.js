import {createSkyImpactAudio,prepareSkyImpactAudio} from './sky-impact-audio.js';

// Efectos breves compartidos: precarga una vez y permite aperturas simultáneas.
export function createInteractionAudio(context, isPaused) {
    const buffers = new Map();
    const reversedBuffers = new Map();
    const skyImpacts = new Set();
    let loading = null;
    const files = {chest:'cofre_abrir_web.mp3', door:'puerta_abrir_web.mp3', key:'puerta_llave_web.mp3',lensChange:'lens_change.mp3',lensChangeStellar:'lens_change_x50.mp3',
        helmetCrack:'trizadura.wav', helmetCrack2:'trizadura2.wav', helmetCrack3:'trizadura3.wav', helmetGlassPop:'vidrio_pop.mp3',skyImpact:'sky-heart-impact.wav',skyQuench:'sky-heart-quench.mp3'};
    function prepare() {
        prepareSkyImpactAudio(context);
        if (!loading) loading = Promise.all(Object.entries(files).map(async ([id,file]) => {
            try {
                const response = await fetch('./sonidos/fx/' + file);
                if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
                buffers.set(id, await context.decodeAudioData(await response.arrayBuffer()));
            } catch (error) { console.warn('No se pudo cargar el efecto de interacción:',error); }
        }));
        return loading;
    }
    function play(id, position, onStart, reverse = false) {
        if (isPaused() || !position || !files[id]) return null;
        if (!buffers.has(id)) {
            // El golpe debe coincidir con el impacto: nunca reproducirlo tarde por una descarga.
            if(id==='skyImpact'){prepare();return null;}
            const snapshot = {x:position.x,y:position.y,z:position.z};
            if (!loading) prepare();
            loading.then(() => { if (buffers.has(id) && !isPaused()) play(id,snapshot,onStart,reverse); });
            return null;
        }
        const source = context.createBufferSource(), panner = context.createPanner();
        let buffer = buffers.get(id);
        if (reverse) {
            if (!reversedBuffers.has(id)) {
                const reversed = context.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
                for (let channel=0;channel<buffer.numberOfChannels;channel++) {
                    reversed.getChannelData(channel).set(buffer.getChannelData(channel));
                    reversed.getChannelData(channel).reverse();
                }
                reversedBuffers.set(id,reversed);
            }
            buffer=reversedBuffers.get(id);
        }
        source.buffer = buffer;
        panner.panningModel='HRTF';panner.distanceModel='inverse';
        panner.refDistance=8;panner.maxDistance=45;panner.rolloffFactor=1;
        panner.positionX.value=position.x;panner.positionY.value=position.y;panner.positionZ.value=position.z;
        const effect=id==='skyImpact'?createSkyImpactAudio(context,panner,position):null;
        if(effect)source.connect(effect.input);
        else {source.connect(panner);panner.connect(context.destination);}
        const sound = {source,panner,effect};
        if(effect)skyImpacts.add(sound);
        source.onended=()=>{
            source.disconnect();
            if(effect)effect.finish(()=>{skyImpacts.delete(sound);sound.onended?.();});
            else {panner.disconnect();sound.onended?.();}
        };
        onStart?.(sound);
        source.start(context.currentTime);
        return sound;
    }
    function updateSkyImpactPosition(position) {
        for(const sound of skyImpacts)sound.effect.setPosition(position);
    }
    return {prepare,play,updateSkyImpactPosition};
}
