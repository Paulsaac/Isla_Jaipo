// Saludo único al salir hacia el norte por la puerta de la habitación inicial.
// El reloj solo avanza cuando game.js actualiza la partida (no durante pausa).
export function createSpawnGreeting({ door, unitSize, halfWidth, exitClearance = 0.6, exitDelaySeconds = 0, delaySeconds = 0, helloSeconds = 1.8, turnSeconds = 1.2 }) {
    let played = false;
    let crossedExit = false;
    let exitElapsed = 0;
    let elapsed = 0;
    let active = false;
    const exitZ = (door.z - 0.5) * unitSize;
    const centerX = door.x * unitSize;
    function phase() {
        if (!active) return 'idle';
        if (elapsed < delaySeconds) return 'waiting';
        if (elapsed < delaySeconds + helloSeconds) return 'hello';
        if (elapsed < delaySeconds + helloSeconds + turnSeconds) return 'turn';
        return 'invitation';
    }
    return {
        get played() { return played; },
        get active() { return active; },
        get phase() { return phase(); },
        get showingDialog() { return active && ['hello','invitation'].includes(phase()); },
        get dialogIndex() { return phase() === 'hello' ? 0 : 1; },
        get turnProgress() { return Math.max(0, Math.min(1, (elapsed - delaySeconds - helloSeconds) / turnSeconds)); },
        tryStart(previous, current, doorOpen, delta = 0) {
            if (played) return false;
            let outsideDelta = Math.max(0, delta);
            if (current.z >= exitZ) { crossedExit = false; exitElapsed = 0; }
            if (!crossedExit && doorOpen && previous.z >= exitZ && current.z < exitZ) {
                const fraction = (exitZ - previous.z) / (current.z - previous.z);
                const crossingX = previous.x + (current.x - previous.x) * fraction;
                crossedExit = Math.abs(crossingX - centerX) <= halfWidth;
                exitElapsed = 0;
                outsideDelta *= 1 - fraction;
            }
            if (!crossedExit) return false;
            exitElapsed += outsideDelta;
            if (current.z > exitZ - exitClearance || exitElapsed < exitDelaySeconds) return false;
            played = active = true;
            return true;
        },
        update(delta) {
            if (!active) return;
            elapsed = Math.min(delaySeconds + helloSeconds + turnSeconds, elapsed + Math.max(0, delta));
        },
        dismiss() {
            if (phase() !== 'invitation') return false;
            active = false;
            return true;
        }
    };
}
