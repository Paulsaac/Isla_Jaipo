// Presentación del rescate: las reglas de progreso y el traslado son callbacks.
export function createDrowningRescue({ onBlack, onComplete }) {
    const shade = document.createElement('div');
    shade.id = 'drowning-rescue-shade';
    shade.setAttribute('aria-hidden', 'true');
    shade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;z-index:105;pointer-events:auto;';
    shade.hidden = true;
    document.body.append(shade);
    const svgNS = 'http://www.w3.org/2000/svg';
    const filters = document.createElementNS(svgNS, 'svg');
    filters.setAttribute('width', '0'); filters.setAttribute('height', '0');
    filters.style.position = 'absolute';
    filters.innerHTML = '<defs><filter id="drowning-text-warp" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.065" numOctaves="1" seed="7" result="ripples"/><feDisplacementMap in="SourceGraphic" in2="ripples" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
    shade.append(filters);
    const turbulence = filters.querySelector('feTurbulence');
    const message = document.createElement('div');
    message.id = 'drowning-rescue-message';
    message.setAttribute('role', 'status');
    message.style.cssText = 'position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:6vw;opacity:0;';
    const text = document.createElement('p');
    text.textContent = 'Te has ahogado. Intenta de nuevo.';
    text.style.cssText = 'margin:0;max-width:1000px;text-align:center;color:#98e6f2;font-family:"Super Legend Boy",monospace;font-size:clamp(20px,2.5vw,36px);line-height:1.65;text-shadow:0 0 14px #79d9ef33;';
    message.append(text); shade.append(message);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) text.style.filter = 'url(#drowning-text-warp)';
    const fadeOut = 0.75, fadeIn = 0.85, textFadeIn = 0.6, textHold = 2.5, textFadeOut = 0.65;
    let hold = 2.25, showMessage = false;
    let elapsed = -1, blackReached = false, waitForContinue = false, waitingForContinue = false;
    return {
        get active() { return elapsed >= 0; },
        get fadeOutRemaining() { return elapsed >= 0 && !blackReached ? Math.max(0,fadeOut-elapsed) : 0; },
        get waitingForContinue() { return waitingForContinue; },
        start({ waitForInput = false, showMessage: withMessage = !waitForInput } = {}) {
            if (elapsed >= 0) return false;
            elapsed = 0; blackReached = false;
            waitForContinue = waitForInput; waitingForContinue = false;
            showMessage = withMessage;
            hold = showMessage ? textFadeIn + textHold + textFadeOut : 2.25;
            message.style.display = showMessage ? 'flex' : 'none';
            message.style.opacity = '0';
            shade.setAttribute('aria-hidden', String(!showMessage));
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
            if (showMessage) {
                const time = elapsed - fadeOut;
                const alpha = Math.max(0, Math.min(1, time / textFadeIn,
                    (hold - time) / textFadeOut));
                message.style.opacity = String(alpha * alpha * (3 - 2 * alpha));
                if (!reducedMotion && alpha > 0) {
                    turbulence.setAttribute('baseFrequency', `${0.012 + Math.sin(time * 0.9) * 0.002} ${0.065 + Math.sin(time * 0.7) * 0.008}`);
                    text.style.transform = `translateY(${Math.sin(time * 1.3) * 1.5}px) skewX(${Math.sin(time * 0.85) * 0.35}deg)`;
                }
            }
            if (!blackReached && elapsed >= fadeOut) {
                blackReached = true;
                if (waitForContinue) { waitingForContinue = true; elapsed = fadeOut; shade.style.opacity = '1'; }
                onBlack();
            }
            if (elapsed >= fadeOut + hold + fadeIn) {
                elapsed = -1; shade.hidden = true; shade.style.opacity = '0';
                message.style.opacity = '0'; shade.setAttribute('aria-hidden', 'true');
                onComplete();
            }
        }
    };
}
