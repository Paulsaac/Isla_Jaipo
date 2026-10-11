// La proa apunta a -Z: su giro horizontal coincide con el de la cámara.
export function steerBoat(boat, playerPosition, seatOffset, seatDistance, targetYaw, delta, isBlocked) {
    const centerX = playerPosition.x - seatOffset.x;
    const centerZ = playerPosition.z - seatOffset.z;
    const difference = Math.atan2(Math.sin(targetYaw - boat.rotation.y), Math.cos(targetYaw - boat.rotation.y));
    const turn = difference * (1 - Math.exp(-6 * delta));
    // Barrer el giro evita atravesar una orilla entre dos orientaciones válidas.
    const steps = Math.max(1, Math.ceil(Math.abs(turn) / 0.04));
    const step = turn / steps;
    for (let i = 0; i < steps; i++) {
        const previousYaw = boat.rotation.y;
        boat.rotation.y += step;
        if (isBlocked(centerX, centerZ)) {
            boat.rotation.y = previousYaw;
            break;
        }
    }
    seatOffset.set(Math.sin(boat.rotation.y) * seatDistance, 0, Math.cos(boat.rotation.y) * seatDistance);
    playerPosition.x = centerX + seatOffset.x;
    playerPosition.z = centerZ + seatOffset.z;
    boat.position.x = centerX;
    boat.position.z = centerZ;
}
