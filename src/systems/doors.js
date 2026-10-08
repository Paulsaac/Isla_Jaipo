// Estado visual y colisiones de puertas. El inventario autoriza el desbloqueo en game.js.
export function unlockDoor(door) {
    const materials = Array.isArray(door.material) ? door.material : [door.material];
    for (const material of materials) material.color.setHex(0xffffff);
    door.userData.locked = false;
}

function toggleDoorSingle(door, forceState, collisionMap) {
    const group = door.userData.parentGroup;
    const shouldOpen = forceState;
    if (door.userData.isOpen === shouldOpen) return;

    if (!shouldOpen) {
        group.rotation.y = 0;
        collisionMap[door.userData.gz][door.userData.gx] = door.userData.locked ? 'DOOR_LOCKED' : 'DOOR_UNLOCKED';
        door.userData.isOpen = false;
        group.userData.isOpen = false;
    } else {
        group.rotation.y = (Math.PI / 2) * door.userData.swingDir;
        collisionMap[door.userData.gz][door.userData.gx] = false;
        door.userData.isOpen = true;
        group.userData.isOpen = true;
    }
}

export function toggleDoor(door, interactables, collisionMap) {
    const newState = !door.userData.isOpen;
    toggleDoorSingle(door, newState, collisionMap);

    // Buscar si hay otra puerta adyacente para abrirla de par en par
    const nx = door.userData.gx;
    const nz = door.userData.gz;

    for (let inter of interactables) {
        if (inter.userData.type === 'DOOR' && inter !== door) {
            const dx = Math.abs(inter.userData.gx - nx);
            const dz = Math.abs(inter.userData.gz - nz);
            if ((dx === 1 && dz === 0) || (dx === 0 && dz === 1)) {
                // Es vecina, la desbloqueamos si estaba cerrada y la abrimos/cerramos con su compañera
                if (inter.userData.locked) {
                    unlockDoor(inter);
                }
                toggleDoorSingle(inter, newState, collisionMap);
            }
        }
    }
}
