// Pulso de autoría:91BPM confirmados por el usuario. Primeros ataques graves
// alrededor de1.19/3.83s sitúan la fase de la rejilla cerca de0.53s.
export const FOREST_LIGHT_BPM = 91;
export const FOREST_LIGHT_BEAT_OFFSET = 0.53;
const clamp=value=>Math.max(0,Math.min(1,value));
function hash(value) {
    let n=((value%1021)+1021)%1021;
    n=(n*n+13*n+47)%1021;
    return ((n*n+19*n+101)%1021)/1021;
}
export function getForestLightSeed(x,z,level,unitSize) {
    return Math.round(x/unitSize)*37+Math.round(z/unitSize)*101+level*271;
}
export function getForestLightPulse(time,seed,focusDistance) {
    const distance=clamp(focusDistance/3.5),randomness=distance*distance*(3-2*distance);
    // Variar límites de cada ciclo, no multiplicar el tiempo por la distancia:
    // así cambiar de altura no acelera artificialmente el pulso al final del tema.
    const clock=(time-FOREST_LIGHT_BEAT_OFFSET)*FOREST_LIGHT_BPM/60+hash(seed+211)*randomness;
    const jitter=.65*randomness;
    const boundary=index=>index+(hash(seed+index*17)-.5)*jitter;
    let index=Math.floor(clock);
    if(clock<boundary(index))index--;
    else if(clock>=boundary(index+1))index++;
    const start=boundary(index),end=boundary(index+1),phase=clamp((clock-start)/(end-start));
    const attack=clamp((phase-.95)/.05);
    return .12+.88*Math.max(1-clamp(phase/.95),attack*attack*(3-2*attack));
}

// Hash de enteros pequeños: mismo cálculo enCPU/GPU y al rebobinar, sin estado aleatorio.
export const FOREST_LIGHT_PULSE_GLSL = `
    float forestLightHash(float value) {
        float n=mod(value,1021.0);
        n=mod(n*n+13.0*n+47.0,1021.0);
        return mod(n*n+19.0*n+101.0,1021.0)/1021.0;
    }
    float forestLightBoundary(float index,float seed,float jitter) {
        return index+(forestLightHash(seed+index*17.0)-0.5)*jitter;
    }
    float forestLightPulse(float time,float seed,float focusDistance) {
        float randomness=smoothstep(0.0,3.5,focusDistance);
        float clock=(time-${FOREST_LIGHT_BEAT_OFFSET.toFixed(6)})*${(FOREST_LIGHT_BPM/60).toFixed(12)}
            +forestLightHash(seed+211.0)*randomness;
        float jitter=0.65*randomness,index=floor(clock);
        if(clock<forestLightBoundary(index,seed,jitter))index-=1.0;
        else if(clock>=forestLightBoundary(index+1.0,seed,jitter))index+=1.0;
        float start=forestLightBoundary(index,seed,jitter);
        float end=forestLightBoundary(index+1.0,seed,jitter);
        float phase=clamp((clock-start)/(end-start),0.0,1.0);
        return 0.12+0.88*max(1.0-clamp(phase/0.95,0.0,1.0),smoothstep(0.95,1.0,phase));
    }
`;
