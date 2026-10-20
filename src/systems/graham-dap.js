// Gesto de entrega: offsets solo durante render, sin desplazar cuerpos ni colisiones.
export function createGrahamDap(THREE, { onImpact, onFinish, onCancel } = {}) {
    const playerOrigin = new THREE.Vector3(), npcOrigin = new THREE.Vector3(), direction = new THREE.Vector3();
    const playerRotation = new THREE.Quaternion(), npcRotation = new THREE.Quaternion();
    const leanRotation = new THREE.Quaternion(), npcLeanRotation = new THREE.Quaternion();
    const leanAngles = new THREE.Euler(0, 0, 0, 'YXZ');
    const npcLeanAngles = new THREE.Euler(0, 0, 0, 'YXZ');
    const npcBaseAngles = new THREE.Euler();
    const npcFootBefore = new THREE.Vector3(), npcFootAfter = new THREE.Vector3();
    let player = null, npc = null, elapsed = 0, active = false, hit = false, applied = false, travel = 0;
    const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    function amount() {
        if (elapsed < 0.12) return -0.05 * smooth(elapsed / 0.12);
        if (elapsed < 0.34) return -0.05 + 1.05 * (1 - (1 - (elapsed - 0.12) / 0.22) ** 3);
        if (elapsed < 0.40) return 1;
        if (elapsed < 0.54) return 1 - 0.16 * smooth((elapsed - 0.40) / 0.14);
        return 0.84 * (1 - smooth((elapsed - 0.54) / 0.56));
    }
    function restore() {
        if (!applied) return;
        player.position.copy(playerOrigin); npc.position.copy(npcOrigin);
        player.quaternion.copy(playerRotation);
        // Conservar también la representación Euler: restaurar el quaternion puede
        // convertir un yaw > 90° en otros ejes de 180° que invierten el billboard.
        npc.rotation.copy(npcBaseAngles);
        player.updateMatrixWorld(true); npc.updateMatrixWorld(true); applied = false;
    }
    return {
        get active() { return active; },
        begin(nextPlayer, nextNpc) {
            if (active || !nextPlayer || !nextNpc) return false;
            player = nextPlayer; npc = nextNpc;
            direction.subVectors(npc.position, player.position); direction.y = 0;
            const distance = direction.length(); direction.normalize();
            // A corta distancia también debe haber acercamiento, sin cruzar los personajes.
            const contactGap = Math.min(0.9, distance * 0.55);
            travel = Math.min(0.42, Math.max(0, (distance - contactGap) / 2));
            elapsed = 0; hit = false; active = true; return true;
        },
        update(delta) {
            if (!active) return;
            elapsed = Math.min(1.1, elapsed + Math.max(0, Math.min(delta, 0.1)));
            if (!hit && elapsed >= 0.34) { hit = true; onImpact?.(); }
            if (elapsed >= 1.1) { restore(); active = false; onFinish?.(); }
        },
        apply() {
            if (!active || applied) return;
            playerOrigin.copy(player.position); npcOrigin.copy(npc.position);
            playerRotation.copy(player.quaternion); npcRotation.copy(npc.quaternion);
            npcBaseAngles.copy(npc.rotation);
            const gesture = amount();
            const shift = gesture * travel;
            // Inclinar la vista hacia el dap; el mismo gesto conduce la vuelta suave.
            const lean = smooth(Math.max(0, gesture));
            leanAngles.set(-0.07 * lean, -0.035 * lean, -0.055 * lean, 'YXZ');
            leanRotation.setFromEuler(leanAngles);
            player.quaternion.multiply(leanRotation);
            // Leve inclinación adelante y giro que acerca el borde izquierdo del sprite.
            npcLeanAngles.set(0.07 * lean, 0.12 * lean, 0, 'YXZ');
            npcLeanRotation.setFromEuler(npcLeanAngles);
            npc.quaternion.multiply(npcLeanRotation);
            player.position.addScaledVector(direction, shift); npc.position.addScaledVector(direction, -shift);
            const footY = -(npc.geometry?.parameters?.height ?? 1.9) / 2;
            npcFootBefore.set(0, footY, 0).applyQuaternion(npcRotation);
            npcFootAfter.set(0, footY, 0).applyQuaternion(npc.quaternion);
            npc.position.add(npcFootBefore.sub(npcFootAfter));
            player.updateMatrixWorld(true); npc.updateMatrixWorld(true); applied = true;
        },
        restore,
        cancel() { restore(); active = false; onCancel?.(); }
    };
}
