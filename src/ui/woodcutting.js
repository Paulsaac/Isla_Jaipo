import { WOOD_PERFECT_POWER, WOOD_EXIT_SECONDS } from '../systems/woodcutting-rules.js';

export function createWoodcuttingHud(touch = false) {
    const root = document.createElement('div');
    root.id = 'woodcutting-hud';
    root.style.cssText = "position:fixed;inset:0;z-index:120;color:#fff;text-align:center;font-family:'Super Legend Boy',monospace;text-shadow:2px 2px #000;pointer-events:none;display:none";
    const scoreText = document.createElement('div');
    scoreText.style.cssText = 'position:absolute;right:4%;bottom:5%;font-size:clamp(14px,2vw,20px)';
    const result = document.createElement('div');
    result.style.cssText = 'position:absolute;font-size:clamp(16px,2vw,24px);transform:translate(-50%,-100%);white-space:nowrap;opacity:0';
    const exit = document.createElement(touch ? 'button' : 'div');
    exit.style.cssText = 'position:absolute;left:50%;bottom:12%;transform:translateX(-50%);display:flex;align-items:center;gap:9px;padding:8px 12px;color:white;background:#151b16b8;border:0;border-radius:6px;font:inherit;font-size:clamp(10px,1.3vw,13px);white-space:nowrap;touch-action:none';
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const exitRing = document.createElementNS(svgNamespace, 'svg');
    exitRing.setAttribute('viewBox', '0 0 32 32');
    exitRing.setAttribute('width', '32');
    exitRing.setAttribute('height', '32');
    exitRing.setAttribute('aria-hidden', 'true');
    exitRing.style.cssText = 'flex:none;transform:rotate(-90deg)';
    const ringTrack = document.createElementNS(svgNamespace, 'circle');
    const ringFill = document.createElementNS(svgNamespace, 'circle');
    const ringLength = 2 * Math.PI * 12;
    for (const circle of [ringTrack, ringFill]) {
        circle.setAttribute('cx', '16');
        circle.setAttribute('cy', '16');
        circle.setAttribute('r', '12');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke-width', '4');
    }
    ringTrack.setAttribute('stroke', '#ffffff55');
    ringFill.setAttribute('stroke', '#a6ed90');
    ringFill.setAttribute('stroke-linecap', 'round');
    ringFill.setAttribute('stroke-dasharray', String(ringLength));
    ringFill.setAttribute('stroke-dashoffset', String(ringLength));
    exitRing.append(ringTrack, ringFill);
    const exitLabel = document.createElement('span');
    exitLabel.textContent = touch ? `Mantén aquí ${WOOD_EXIT_SECONDS} s para salir` : `Mantén E durante ${WOOD_EXIT_SECONDS} s para salir`;
    exit.append(exitRing, exitLabel);
    const force = document.createElement('div');
    force.style.cssText = `position:absolute;right:5%;top:38%;height:clamp(160px,32vh,300px);width:32px;border:2px solid #eee;border-radius:5px;background:linear-gradient(to top,#df4134 0%,#f2d34d 50%,#e8db52 87%,#b3dd61 93%,#62e178 ${WOOD_PERFECT_POWER * 100}%,#62e178 100%);box-shadow:0 2px 12px #000b`;
    const needle = document.createElement('div');
    needle.style.cssText = 'position:absolute;left:-8px;right:-8px;height:4px;bottom:0;background:white;box-shadow:0 0 3px 2px #000b;transform:translateY(50%)';
    force.append(needle);
    root.append(scoreText, result, exit, force);
    document.body.append(root);
    let onExitHold = () => {};
    if (touch) {
        exit.style.pointerEvents = 'auto';
        exit.addEventListener('pointerdown', event => {
            event.preventDefault(); event.stopPropagation();
            exit.setPointerCapture(event.pointerId); onExitHold(true);
        });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
            exit.addEventListener(name, () => onExitHold(false));
    }
    return {
        setExitHandler(handler) { onExitHold = handler; },
        show(visible) { root.style.display = visible ? 'block' : 'none'; },
        update({ score, power, exitProgress, feedback }) {
            scoreText.textContent = `${score} puntos`;
            needle.style.bottom = `${power * 100}%`;
            exit.style.color = exitProgress > 0 ? '#a6ed90' : '#ffffff';
            ringFill.setAttribute('stroke-dashoffset', String(ringLength * (1 - Math.max(0, Math.min(1, exitProgress)))));
            result.textContent = feedback?.text ?? '';
            result.style.color = feedback?.color ?? '#ffffff';
            result.style.opacity = String(feedback?.opacity ?? 0);
            result.style.left = `${feedback?.x ?? 50}%`;
            result.style.top = `${feedback?.y ?? 50}%`;
        }
    };
}
