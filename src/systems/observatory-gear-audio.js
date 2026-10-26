// El arranque y el bucle comparten reloj; detener corta ambos, incluso el bucle pendiente.
export function createObservatoryGearAudio(context) {
    let loading=null,buffers=null,moving=false,playing=false;
    const drive=new Set();
    let ending=null;
    function seamlessLoop(buffer) {
        // Solapar 160 ms del final y del inicio dentro del propio buffer.
        // La unión queda programada por muestras, sin depender de temporizadores.
        const overlap=Math.min(Math.round(buffer.sampleRate*.16),Math.floor(buffer.length/4));
        if(overlap<2)return buffer;
        const length=buffer.length-overlap,body=buffer.length-overlap*2;
        const loop=context.createBuffer(buffer.numberOfChannels,length,buffer.sampleRate);
        for(let channel=0;channel<buffer.numberOfChannels;channel++) {
            const input=buffer.getChannelData(channel),output=loop.getChannelData(channel);
            output.set(input.subarray(overlap,buffer.length-overlap));
            for(let i=0;i<overlap;i++) {
                const angle=i/(overlap-1)*Math.PI/2;
                output[body+i]=input[buffer.length-overlap+i]*Math.cos(angle)+input[i]*Math.sin(angle);
            }
        }
        return loop;
    }
    function prepare() {
        if(!loading)loading=Promise.all(['gear_start.mp3','gear_loop.mp3','gear_end.mp3'].map(async file=>{
            const response=await fetch('./sonidos/fx/'+file);
            if(!response.ok)throw new Error(file+': HTTP '+response.status);
            return context.decodeAudioData(await response.arrayBuffer());
        })).then(result=>{result[1]=seamlessLoop(result[1]);buffers=result;return true;})
            .catch(error=>{console.warn('No se pudo cargar el engranaje del Omniscopio:',error);return false;});
        return loading;
    }
    function voice(buffer,when,loop=false,detune=0) {
        const source=context.createBufferSource(),gain=context.createGain();
        source.buffer=buffer;source.loop=loop;source.detune.value=detune;
        gain.gain.value=.4;source.connect(gain);gain.connect(context.destination);
        const sound={source,gain};
        source.onended=()=>{drive.delete(sound);if(ending===sound)ending=null;source.disconnect();gain.disconnect();};
        source.start(when);return sound;
    }
    function stop(sound) {
        if(!sound)return;
        sound.gain.gain.cancelScheduledValues(context.currentTime);
        sound.gain.gain.setTargetAtTime(0,context.currentTime,.005);
        sound.source.stop(context.currentTime+.025);
    }
    function start() {
        if(!moving||playing||!buffers)return;
        playing=true;stop(ending);ending=null;
        const when=context.currentTime+.01;
        drive.add(voice(buffers[0],when));
        drive.add(voice(buffers[1],when+buffers[0].duration,true));
    }
    return {
        prepare,
        setMoving(value,silent=false) {
            if(silent) {
                moving=false;playing=false;
                for(const sound of drive)stop(sound);
                drive.clear();stop(ending);ending=null;
                return;
            }
            if(value===moving)return;
            moving=value;
            if(moving) {
                if(buffers)start();else prepare().then(ok=>{if(ok)start();});
            } else if(playing) {
                playing=false;
                for(const sound of drive)stop(sound);
                drive.clear();
                ending=voice(buffers[2],context.currentTime,false,(Math.random()*2-1)*25);
            }
        }
    };
}
