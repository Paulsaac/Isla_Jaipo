// Reflexiones dispersas al aire libre; el impulso se prepara una sola vez por contexto.
const impulses = new WeakMap();
const TAIL_SECONDS = 2.8;
export function prepareSkyImpactAudio(context) {
    if (impulses.has(context)) return impulses.get(context);
    const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * TAIL_SECONDS), context.sampleRate);
    for (let channel=0;channel<2;channel++) {
        const data=impulse.getChannelData(channel);
        let seed=7219+channel*179, smooth=0;
        const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
        for(let i=0;i<data.length;i++) {
            const t=i/context.sampleRate;
            smooth += .16*(random()-smooth);
            data[i]=smooth*Math.exp(-t*2.5)*Math.min(1,t/.045)*.48;
        }
        // Ecos cortos e irregulares de los árboles, sin una pared o sala resonante.
        [.047,.083,.129,.191,.277,.389,.541,.739].forEach((time,index)=>{
            const first=Math.round((time+channel*.006)*context.sampleRate);
            for(let j=0;j<160&&first+j<data.length;j++)
                data[first+j]+=random()*.18*Math.exp(-index*.31)*Math.exp(-j/32);
        });
    }
    impulses.set(context,impulse);
    return impulse;
}

export function createSkyImpactAudio(context,panner,position) {
    const input=context.createBiquadFilter(), dry=context.createGain(), wet=context.createGain();
    const delay=context.createDelay(.2), reverb=context.createConvolver();
    const damping=context.createBiquadFilter(), master=context.createGain();
    input.type=damping.type='lowpass';input.Q.value=damping.Q.value=.5;
    damping.frequency.value=3600;
    reverb.buffer=prepareSkyImpactAudio(context);
    master.gain.value=.82;
    panner.refDistance=90;panner.maxDistance=1500;panner.rolloffFactor=.7;
    input.connect(panner);panner.connect(dry);dry.connect(master);
    panner.connect(delay);delay.connect(reverb);reverb.connect(damping);damping.connect(wet);wet.connect(master);
    master.connect(context.destination);
    let initialized=false, disposed=false;
    function setPosition(point) {
        const distance=Math.hypot(point.x,point.y,point.z);
        const linear=Math.max(0,Math.min(1,(distance-12)/248));
        const far=linear*linear*(3-2*linear), now=context.currentTime;
        const apply=(param,value)=>initialized?param.setTargetAtTime(value,now,.08):param.setValueAtTime(value,now);
        apply(panner.positionX,point.x);apply(panner.positionY,point.y);apply(panner.positionZ,point.z);
        apply(dry.gain,.98-.26*far);apply(wet.gain,.035+.43*far);
        apply(input.frequency,14000-9000*far);apply(delay.delayTime,.012+.053*far);
        initialized=true;
    }
    function finish(onComplete) {
        // Audio-clock cleanup: a paused game must keep the remaining reverb intact.
        const timer=context.createBufferSource();
        timer.buffer=context.createBuffer(1,1,context.sampleRate);
        const silent=context.createGain();silent.gain.value=0;timer.connect(silent);silent.connect(context.destination);
        timer.onended=()=>{
            if(disposed)return;disposed=true;
            [input,panner,dry,wet,delay,reverb,damping,master,timer,silent].forEach(node=>node.disconnect());
            onComplete?.();
        };
        timer.start(context.currentTime+TAIL_SECONDS+.2);
    }
    setPosition(position);
    return {input,setPosition,finish};
}
