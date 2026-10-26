import { SKY_CYCLE_TIMING } from '../world/sky-cycle.js';
import { FOREST_CUES } from '../content/forest-cues.js';

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
        update(delta, questStage, forestStarted, forestElapsed = null) {
            if (stage === 'waiting-heart' && questStage !== 'searching' && forestStarted) stage = 'dusk';
            if (stage === 'dusk') {
                if(Number.isFinite(forestElapsed)) {
                    const progress=Math.max(0,Math.min(1,(forestElapsed-(FOREST_CUES[3]-4))/4));
                    timer=timing.duskStart+timing.dusk*.5*(1+progress);
                } else timer = Math.min(timing.nightStart, timer + delta);
                if (timer >= timing.nightStart) stage = 'waiting-delivery';
            }
            if (stage === 'waiting-delivery' && questStage === 'delivered') {
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
