// Saludo único al salir hacia el norte por la puerta de la habitación inicial.
// El reloj solo avanza cuando game.js actualiza la partida (no durante pausa).
export function createSpawnGreeting({ door, unitSize, halfWidth, exitClearance = 0.6, helloSeconds = 1.4, turnSeconds = 0.85 }) {
    let played = false;
    let crossedExit = false;
    let elapsed = 0;
    let active = false;
    const exitZ = (door.z - 0.5) * unitSize;
    const centerX = door.x * unitSize;
    function phase() {
        if (!active) return 'idle';
        if (elapsed < helloSeconds) return 'hello';
        if (elapsed < helloSeconds + turnSeconds) return 'turn';
        return 'invitation';
    }
    return {
        get played() { return played; },
        get active() { return active; },
        get phase() { return phase(); },
        get showingDialog() { return active && phase() !== 'turn'; },
        get dialogIndex() { return phase() === 'hello' ? 0 : 1; },
        get turnProgress() { return Math.max(0, Math.min(1, (elapsed - helloSeconds) / turnSeconds)); },
        tryStart(previous, current, doorOpen) {
            if (played) return false;
            if (current.z >= exitZ) crossedExit = false;
            if (!crossedExit && doorOpen && previous.z >= exitZ && current.z < exitZ) {
                const fraction = (exitZ - previous.z) / (current.z - previous.z);
                const crossingX = previous.x + (current.x - previous.x) * fraction;
                crossedExit = Math.abs(crossingX - centerX) <= halfWidth;
            }
            if (!crossedExit || current.z > exitZ - exitClearance) return false;
            played = active = true;
            return true;
        },
        update(delta) {
            if (!active) return;
            elapsed = Math.min(helloSeconds + turnSeconds, elapsed + Math.max(0, delta));
        },
        dismiss() {
            if (phase() !== 'invitation') return false;
            active = false;
            return true;
        }
    };
}
