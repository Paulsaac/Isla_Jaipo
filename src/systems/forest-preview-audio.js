import { getBufferedForestEnergy } from './forest-preview-energy.js';
// Reloj de autoría independiente: suspende el audio de partida sin tocar sus pistas.
export function createForestPreviewAudio(loadBuffer, onActiveChange) {
    let context=null,buffer=null,source=null,analyser=null,spectrum=null;
    let active=false,playing=false,worldPaused=false,offset=0,startedAt=0,version=0;
    const energy={bass:0,treble:0};
    const time=()=>Math.min(buffer?.duration??Infinity,Math.max(0,offset+(playing&&context?context.currentTime-startedAt:0)));
    function disconnect() {
        if(source){source.onended=null;source.stop();source.disconnect();source=null;}
        analyser?.disconnect();analyser=null;spectrum=null;
    }
    function syncPause() {
        if(!context)return;
        (worldPaused||!playing?context.suspend():context.resume()).catch(()=>{});
    }
    async function seek(seconds, resume=playing) {
        const request=++version;
        if(!active) {
            context=new (window.AudioContext||window.webkitAudioContext)();
            active=true;onActiveChange(true);
        }
        offset=time();playing=false;disconnect();
        offset=Math.max(0,Number(seconds)||0);
        energy.bass=energy.treble=0;
        try {
            buffer=await loadBuffer();
            if(request!==version||!active)return;
            offset=Math.min(buffer.duration,offset);
            Object.assign(energy,getBufferedForestEnergy(buffer,offset));
            startedAt=context.currentTime;
            playing=resume&&offset<buffer.duration;
            if(playing) {
                analyser=context.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.65;
                spectrum=new Uint8Array(analyser.frequencyBinCount);
                source=context.createBufferSource();source.buffer=buffer;
                source.connect(context.destination);source.connect(analyser);
                source.onended=()=>{
                    offset=buffer.duration;playing=false;source?.disconnect();source=null;
                    analyser?.disconnect();analyser=null;spectrum=null;syncPause();
                };
                source.start(startedAt,offset);
            }
            syncPause();
        } catch(error) {if(request===version)stop();throw error;}
    }
    function pause() {++version;offset=time();playing=false;disconnect();syncPause();}
    function play() {return seek(time()>=(buffer?.duration??Infinity)?0:time(),true);}
    function stop() {
        ++version;disconnect();active=playing=false;offset=0;
        const old=context;context=null;old?.close().catch(()=>{});
        onActiveChange(false);
    }
    function getEnergy() {
        if(!analyser||!playing||worldPaused)return energy;
        analyser.getByteFrequencyData(spectrum);
        const binHz=context.sampleRate/analyser.fftSize;
        function band(low,high) {
            const begin=Math.max(1,Math.ceil(low/binHz)),end=Math.min(spectrum.length,Math.ceil(high/binHz));
            let total=0;for(let i=begin;i<end;i++)total+=spectrum[i]/255;
            return total/Math.max(1,end-begin);
        }
        energy.bass=band(45,250);energy.treble=band(1800,6000);return energy;
    }
    return {seek,play,pause,stop,getEnergy,setWorldPaused(value){worldPaused=value;syncPause();},
        get active(){return active;},get playing(){return playing;},get time(){return time();},
        get duration(){return buffer?.duration??0;}};
}
