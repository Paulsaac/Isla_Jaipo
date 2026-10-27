// Presentación del rescate: las reglas de progreso y el traslado son callbacks.
export function createDrowningRescue({ onBlack, onComplete }) {
    const shade = document.createElement('div');
    shade.id = 'drowning-rescue-shade';
    shade.setAttribute('aria-hidden', 'true');
    shade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;z-index:105;pointer-events:auto;';
    shade.hidden = true;
    document.body.append(shade);
    const fadeOut = 0.75, hold = 2.25, fadeIn = 0.85;
    let elapsed = -1, blackReached = false, waitForContinue = false, waitingForContinue = false;
    return {
        get active() { return elapsed >= 0; },
        get fadeOutRemaining() { return elapsed >= 0 && !blackReached ? Math.max(0,fadeOut-elapsed) : 0; },
        get waitingForContinue() { return waitingForContinue; },
        start({ waitForInput = false } = {}) {
            if (elapsed >= 0) return false;
            elapsed = 0; blackReached = false;
            waitForContinue = waitForInput; waitingForContinue = false;
            shade.hidden = false; shade.style.opacity = '0';
            return true;
        },
        continue() {
            if (!waitingForContinue) return false;
            waitingForContinue = false; elapsed = fadeOut + hold;
            return true;
        },
        update(delta) {
            if (elapsed < 0 || waitingForContinue) return;
            elapsed += Math.max(0, delta);
            const opacity = elapsed < fadeOut ? elapsed / fadeOut
                : elapsed < fadeOut + hold ? 1
                : Math.max(0, 1 - (elapsed - fadeOut - hold) / fadeIn);
            shade.style.opacity = String(opacity);
            if (!blackReached && elapsed >= fadeOut) {
                blackReached = true;
                if (waitForContinue) { waitingForContinue = true; elapsed = fadeOut; shade.style.opacity = '1'; }
                onBlack();
            }
            if (elapsed >= fadeOut + hold + fadeIn) {
                elapsed = -1; shade.hidden = true; shade.style.opacity = '0';
                onComplete();
            }
        }
    };
}
