// Consulta local de árboles; cuatro sectores permiten distinguir estar rodeado
// de pasar junto a una sola hilera. No depende de visibilidad ni de sprites dibujados.
export function sampleForestSurroundings(floorMap, unitSize, x, z, radius = 20) {
    const sources = Array.from({length:4},(_,i)=>({
        x:x+Math.sin(i*Math.PI/2)*8, z:z+Math.cos(i*Math.PI/2)*8, weight:0, sumX:0, sumZ:0
    }));
    const minX=Math.max(0,Math.floor((x-radius)/unitSize)),maxX=Math.ceil((x+radius)/unitSize);
    const minZ=Math.max(0,Math.floor((z-radius)/unitSize)),maxZ=Math.min(floorMap.length-1,Math.ceil((z+radius)/unitSize));
    for(let gz=minZ;gz<=maxZ;gz++) for(let gx=minX;gx<=Math.min(maxX,(floorMap[gz]?.length??0)-1);gx++) {
        if(floorMap[gz][gx]!=='TREE') continue;
        const dx=gx*unitSize-x,dz=gz*unitSize-z,distance=Math.hypot(dx,dz);
        if(distance>=radius) continue;
        const weight=Math.pow(1-distance/radius,2);
        const index=(Math.round(Math.atan2(dx,dz)/(Math.PI/2))+4)%4;
        const source=sources[index];source.weight+=weight;source.sumX+=gx*unitSize*weight;source.sumZ+=gz*unitSize*weight;
    }
    const occupied=sources.filter(source=>source.weight>=.08).length;
    const total=sources.reduce((sum,source)=>sum+source.weight,0);
    for(const source of sources) {
        if(source.weight>0){source.x=source.sumX/source.weight;source.z=source.sumZ/source.weight;source.weight/=total;}
        delete source.sumX;delete source.sumZ;
    }
    return {gain:occupied>=3?Math.min(1,total/4)*occupied/4:0,sources};
}

// Un único MP3 en streaming, repartido entre cuatro posiciones. No se crean
// reproductores por árbol ni se decodifican los 17 minutos completos en memoria.
export function createForestAmbience(context, url = './sonidos/fx/bosque.mp3') {
    const audio=new Audio(url);audio.loop=true;audio.preload='metadata';
    const input=context.createMediaElementSource(audio),output=context.createGain();
    output.gain.value=0;output.connect(context.destination);
    const emitters=Array.from({length:4},()=>{
        const gain=context.createGain(),panner=context.createPanner();gain.gain.value=0;
        panner.panningModel='HRTF';panner.rolloffFactor=0;
        input.connect(gain);gain.connect(panner);panner.connect(output);
        return {gain,panner,lastWeight:-1};
    });
    let paused=false,level=0,stopTimer=null;
    function cancelStop(){if(stopTimer!==null)clearTimeout(stopTimer);stopTimer=null;}
    function play(prime=false){
        audio.play()?.then(()=>{if(paused||(prime&&level===0))audio.pause();}).catch(error=>{
            if(!prime&&level>0&&!paused&&error.name!=='AbortError')console.warn('No se pudo reproducir el ambiente del bosque:',error);
        });
    }
    function sync(){
        cancelStop();const now=context.currentTime;output.gain.cancelScheduledValues(now);
        if(paused){audio.pause();output.gain.setValueAtTime(0,now);return;}
        output.gain.setTargetAtTime(level*.28,now,.25);
        if(level>0){if(audio.paused)play();}
        else stopTimer=setTimeout(()=>{stopTimer=null;if(level===0)audio.pause();},1000);
    }
    function update({gain,sources}){
        const next=Math.max(0,Math.min(1,gain));
        if(Math.abs(next-level)>.0001){level=next;sync();}
        for(let i=0;i<emitters.length;i++){
            const emitter=emitters[i],source=sources[i];if(!source)continue;
            if(Math.abs(emitter.lastWeight-source.weight)>.0001){emitter.gain.gain.setTargetAtTime(source.weight,context.currentTime,.12);emitter.lastWeight=source.weight;}
            emitter.panner.positionX.setTargetAtTime(source.x,context.currentTime,.06);
            emitter.panner.positionY.setTargetAtTime(source.y??0,context.currentTime,.06);
            emitter.panner.positionZ.setTargetAtTime(source.z,context.currentTime,.06);
        }
    }
    return {
        unlock(){if(!paused)play(true);},update,
        setPaused(value){paused=value;sync();},
        reset(){level=0;cancelStop();audio.pause();audio.currentTime=0;output.gain.cancelScheduledValues(context.currentTime);output.gain.setValueAtTime(0,context.currentTime);}
    };
}
