import { SKY_CYCLE_TIMING } from '../world/sky-cycle.js';
import { FOREST_CUES } from '../content/forest-cues.js';

// Evento y reproductor comparten el mismo final exacto: noche, sin vuelta al ciclo.
export function getForestSkyTime(elapsed,timing=SKY_CYCLE_TIMING) {
    const progress=Math.max(0,Math.min(1,(elapsed-FOREST_CUES[2])/(FOREST_CUES[3]-FOREST_CUES[2])));
    if(progress>=1)return timing.nightStart;
    // Todo el tramo 2→3, con velocidad y aceleración nulas en los extremos.
    const eased=progress**3*(progress*(progress*6-15)+10);
    return timing.duskStart+timing.dusk*.5*(1+eased);
}

// La entrega lleva al amanecer; abrir el puente libera la salida del sol y Morning.
export function createQuestSkyCycle(timing = SKY_CYCLE_TIMING) {
    let timer = timing.duskStart + timing.dusk / 2;
    let stage = 'waiting-heart';
    let bridgeOpened = false;
    const dawnHold = timing.dawnStart + timing.dawn / 2;
    return {
        get timer() { return timer; },
        get stage() { return stage; },
        get isFree() { return stage === 'free'; },
        get morningEnabled() { return bridgeOpened && stage === 'free'; },
        get waitingForSunrise() { return stage === 'last-night' || stage === 'waiting-bridge'; },
        openBridge() { bridgeOpened = true; },
        setTime(value) { if (stage === 'free') timer = value; },
        update(delta, questStage, forestStarted, forestElapsed = null, forestActive = false) {
            // Bosque también toma el cielo si se activa tras liberar el ciclo:
            // ningún amanecer/ciclo anterior puede continuar debajo del evento.
            if (forestActive && stage !== 'dusk' && stage !== 'waiting-delivery') {
                stage = 'dusk';
                timer = getForestSkyTime(Number.isFinite(forestElapsed) ? forestElapsed : 0, timing);
            }
            if (stage === 'waiting-heart' && questStage !== 'searching' && forestStarted) stage = 'dusk';
            if (stage === 'dusk') {
                if(Number.isFinite(forestElapsed)) {
                    timer=Math.max(timer,getForestSkyTime(forestElapsed,timing));
                // Antes de arrancar el audio, o al suspenderlo, conservar su cielo.
                // El respaldo por delta se usa solo cuando el evento ya no está activo.
                } else if(!forestActive) timer = Math.min(timing.nightStart, timer + delta);
                if (timer >= timing.nightStart) stage = 'waiting-delivery';
            }
            if(stage==='waiting-delivery')timer=timing.nightStart;
            if (stage === 'waiting-delivery' && questStage === 'delivered' && !forestActive) {
                timer = timing.dawnStart - 12;
                stage = 'last-night';
                return timer;
            }
            if (stage === 'last-night') {
                timer = Math.min(dawnHold, timer + delta);
                if (timer >= dawnHold) stage = 'waiting-bridge';
            } else if (stage === 'free') timer += delta;
            if (stage === 'waiting-bridge' && bridgeOpened) stage = 'free';
            timer %= timing.total;
            return timer;
        }
    };
}
