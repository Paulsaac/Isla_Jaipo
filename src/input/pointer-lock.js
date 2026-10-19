// Entrada sin aceleración del sistema, con respaldo para navegadores sin soporte.
export async function requestGamePointerLock(element) {
    try {
        await element.requestPointerLock({unadjustedMovement:true});
    } catch (error) {
        if (error.name !== 'NotSupportedError' && !(error instanceof TypeError)) throw error;
        await element.requestPointerLock();
    }
}

// Reservar la confirmación para saltos extremos. Un evento puede acumular cientos
// de unidades legítimas; filtrarlo desde 100 producía zonas muertas al girar.
export function createMouseMovementFilter(apply) {
    let pending = null, previousMagnitude = 0, previousTime = null;
    function reset() { pending=null; previousMagnitude=0; previousTime=null; }
    function move(event) {
        const x=event.movementX ?? event.mozMovementX ?? event.webkitMovementX ?? 0;
        const y=event.movementY ?? event.mozMovementY ?? event.webkitMovementY ?? 0;
        const time=event.timeStamp;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(time)) return;
        const magnitude=Math.hypot(x,y);
        if (magnitude===0) { pending=null; return; }
        if (pending) {
            const confirms=time-pending.time>=0 && time-pending.time<=50
                && x*pending.x+y*pending.y>0 && magnitude>=Math.max(4,pending.magnitude*0.1);
            if (confirms) {
                apply({movementX:pending.x,movementY:pending.y});
                apply({movementX:x,movementY:y});
                pending=null;
                previousMagnitude=magnitude;
                previousTime=time;
                return;
            }
            pending=null;
        }
        const recent=previousTime!==null && time-previousTime>=0 && time-previousTime<=120;
        const threshold=Math.max(1024,recent?previousMagnitude*12:0);
        if (magnitude>threshold) {
            pending={x,y,time,magnitude};
            return;
        }
        apply({movementX:x,movementY:y});
        previousMagnitude=magnitude;
        previousTime=time;
    }
    return {move,reset};
}

// Three.js r160 mantiene el listener enlazado en _onMouseMove. Envolverlo conserva
// su cálculo YXZ, límites verticales, pointerSpeed y eventos lock/unlock/change.
export function guardPointerLockMouse(controls) {
    const original=controls._onMouseMove;
    const filter=createMouseMovementFilter(original);
    let previousSpeed=controls.pointerSpeed;
    controls.disconnect();
    controls._onMouseMove=event=>{
        // No conservar muestras durante una mirada bloqueada por una interacción.
        if (controls.pointerSpeed!==previousSpeed) { filter.reset(); previousSpeed=controls.pointerSpeed; }
        if (!controls.isLocked || controls.pointerSpeed===0) { filter.reset(); return; }
        filter.move(event);
    };
    controls.connect();
    controls.addEventListener('lock',filter.reset);
    controls.addEventListener('unlock',filter.reset);
}
