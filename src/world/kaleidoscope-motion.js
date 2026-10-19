// Retraso angular suave con el reloj de partida: teclado, mouse y táctil comparten cámara.
export function createKaleidoscopeMotion(THREE) {
    const trailing = new THREE.Quaternion(), relative = new THREE.Quaternion();
    const angles = new THREE.Euler(), offset = new THREE.Vector2();
    let lastTime = 0, initialized = false;
    return {
        offset,
        update(orientation, time, enabled) {
            if (!enabled) { initialized = false; lastTime = time; offset.set(0,0); return; }
            if (!initialized || time < lastTime) {
                trailing.copy(orientation); lastTime = time; initialized = true; offset.set(0,0); return;
            }
            const dt = Math.min(0.1, time-lastTime);
            if (dt <= 0) return; // Pausa/inventario: conservar exactamente el desplazamiento.
            lastTime = time;
            trailing.slerp(orientation, 1-Math.exp(-dt*6));
            relative.copy(orientation).invert().multiply(trailing);
            angles.setFromQuaternion(relative,'YXZ');
            offset.set(THREE.MathUtils.clamp(angles.y,-0.22,0.22),THREE.MathUtils.clamp(angles.x,-0.18,0.18));
        }
    };
}
