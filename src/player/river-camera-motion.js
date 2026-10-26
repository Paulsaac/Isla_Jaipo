// Giro de la mirada en ocho: una oscilación horizontal y dos verticales por vuelta.
// Solo se aplica al render; restaurar la orientación conserva el mouse y la marcha.
export function createRiverCameraMotion(THREE, camera) {
    const savedRotation = new THREE.Quaternion();
    const offsetRotation = new THREE.Quaternion();
    const offset = new THREE.Euler(0, 0, 0, 'YXZ');
    const period = 1, barrelPeriod = 4, blendRate = 3.5;
    let phase = 0, amount = 0, roll = 0, applied = false;

    function restore() {
        if (!applied) return;
        camera.quaternion.copy(savedRotation);
        camera.updateMatrixWorld(true);
        applied = false;
    }

    return {
        update(delta, active) {
            if (delta <= 0) return;
            const fade = Math.exp(-delta * blendRate), previousAmount = amount;
            amount += ((active ? 1 : 0) - amount) * (1 - fade);
            if (active) {
                // Integrar la entrada suave hace que el giro coincida a 30 y 60 FPS.
                const turningTime = delta - (1 - previousAmount) * (1 - fade) / blendRate;
                roll = (roll + turningTime * Math.PI * 2 / barrelPeriod) % (Math.PI * 2);
            } else {
                // Volver al horizonte por el recorrido corto, sin saltar al salir del río.
                roll = Math.atan2(Math.sin(roll), Math.cos(roll)) * fade;
            }
            if (!active && amount < 0.001 && Math.abs(roll) < 0.001) {
                amount = 0; phase = 0; roll = 0; return;
            }
            phase = (phase + delta * Math.PI * 2 / period) % (Math.PI * 2);
        },
        apply() {
            if (applied || amount === 0) return;
            savedRotation.copy(camera.quaternion);
            offset.set(Math.sin(phase * 2) * 0.18 * amount,
                Math.sin(phase) * 0.28 * amount, roll + Math.sin(phase) * 0.035 * amount);
            camera.quaternion.multiply(offsetRotation.setFromEuler(offset));
            camera.updateMatrixWorld(true);
            applied = true;
        },
        restore,
        reset() { restore(); amount = 0; phase = 0; roll = 0; }
    };
}
