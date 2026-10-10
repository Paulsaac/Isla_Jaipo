import { SKY_CYCLE_TIMING } from '../world/sky-cycle.js';

// Introducción de la misión; después del primer amanecer libera el reloj habitual.
export function createQuestSkyCycle(timing = SKY_CYCLE_TIMING) {
    let timer = timing.duskStart + timing.dusk / 2;
    let stage = 'waiting-heart';
    return {
        get timer() { return timer; },
        get stage() { return stage; },
        get isFree() { return stage === 'free'; },
        setTime(value) { if (stage === 'free') timer = value; },
        update(delta, questStage, forestStarted) {
            if (stage === 'waiting-heart' && questStage !== 'searching' && forestStarted) stage = 'dusk';
            if (stage === 'dusk') {
                timer = Math.min(timing.nightStart, timer + delta);
                if (timer >= timing.nightStart) stage = 'waiting-delivery';
            }
            if (stage === 'waiting-delivery' && questStage === 'delivered') {
                timer = timing.dawnStart - 25;
                stage = 'last-night';
                return timer;
            }
            if (stage === 'last-night') {
                timer += delta;
                if (timer >= timing.dawnStart) stage = 'free';
            } else if (stage === 'free') timer += delta;
            timer %= timing.total;
            return timer;
        }
    };
}
