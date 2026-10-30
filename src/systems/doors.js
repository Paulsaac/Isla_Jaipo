import {UNIT_SIZE} from '../config.js';

// Campo de cámara sin límite lejano: incluso una puerta distante o entre
// niebla queda protegida si está dentro de la dirección que mira el jugador.
export function createDoorViewCheck(THREE,camera){
    const frustum=new THREE.Frustum(),projection=new THREE.Matrix4(),sphere=new THREE.Sphere();
    return {
        update(){
            camera.updateWorldMatrix(true,false);
            projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
            frustum.setFromProjectionMatrix(projection);
            frustum.planes[4].constant=Infinity;
        },
        includes(door){
            door.updateWorldMatrix(true,false);
            if(!door.geometry.boundingSphere)door.geometry.computeBoundingSphere();
            sphere.copy(door.geometry.boundingSphere).applyMatrix4(door.matrixWorld);sphere.radius+=.1;
            return frustum.intersectsSphere(sphere);
        }
    };
}

// Estado visual y colisiones de puertas. El inventario autoriza el desbloqueo en game.js.
export function closeDoorsForRespawn(doors,collisionMap) {
    for(const door of doors){
        const data=door.userData;
        if(data.type!=='DOOR'&&data.type!=='GATE')continue;
        data.isOpen=false;data.collisionEnabled=true;delete data.motion;
        data.parentGroup.userData.isOpen=false;
        data.parentGroup.rotation.y=0;data.parentGroup.updateMatrixWorld(true);
        if(data.type==='DOOR')collisionMap[data.gz][data.gx]=data.locked?'DOOR_LOCKED':'DOOR_UNLOCKED';
    }
}

export function unlockDoor(door) {
    const materials = Array.isArray(door.material) ? door.material : [door.material];
    for (const material of materials) {
        if(!material.userData.doorEdge)material.color.setHex(0xffffff);
    }
    door.userData.locked = false;
}

export function closeDistantDoors(doors,collisionMap,position,distance=70*UNIT_SIZE,isInView=()=>false){
    for(const door of doors){
        const data=door.userData,group=data.parentGroup;
        if(!data.isOpen||!group||!['DOOR','GATE'].includes(data.type))continue;
        group.updateWorldMatrix(true,false);
        const e=group.matrixWorld.elements;
        if((position.x-e[12])**2+(position.z-e[14])**2<=distance*distance)continue;
        if(isInView(door))continue;
        if(data.type==='DOOR')toggleDoorSingle(door,false,collisionMap);
        else{
            data.isOpen=false;data.collisionEnabled=true;
            data.motion={from:group.rotation.y,to:0,elapsed:0};
        }
        data.motion.autoClose=true;
    }
}

function toggleDoorSingle(door, forceState, collisionMap) {
    const group = door.userData.parentGroup;
    const shouldOpen = forceState;
    if (door.userData.isOpen === shouldOpen) return;

    if (!shouldOpen) {
        collisionMap[door.userData.gz][door.userData.gx] = door.userData.locked ? 'DOOR_LOCKED' : 'DOOR_UNLOCKED';
        door.userData.isOpen = false;
        group.userData.isOpen = false;
    } else {
        collisionMap[door.userData.gz][door.userData.gx] = false;
        door.userData.isOpen = true;
        group.userData.isOpen = true;
    }
    door.userData.collisionEnabled = !shouldOpen;
    door.userData.motion = { from: group.rotation.y,
        to: shouldOpen ? (Math.PI / 2) * door.userData.swingDir : 0, elapsed: 0 };
}

// Al abrir, la hoja atraviesa al jugador hasta el último 10% del giro; después recupera el empuje.
export function updateDoorAnimations(doors, delta, movePlayer,isInView=()=>false) {
    const moving = doors.filter(door => door.userData.motion
        &&!(door.userData.motion.autoClose&&isInView(door)));
    if (!moving.length) return;
    const previous = moving.map(door => ({ door, angle: door.userData.parentGroup.rotation.y,
        elapsed: door.userData.motion.elapsed, collisionEnabled: door.userData.collisionEnabled }));
    for (const door of moving) {
        const motion = door.userData.motion;
        motion.elapsed = Math.min(0.7, motion.elapsed + delta);
        const t = motion.elapsed / 0.7;
        door.userData.collisionEnabled = !door.userData.isOpen || t >= 0.9;
        door.userData.parentGroup.rotation.y = motion.from + (motion.to - motion.from) * t * t * (3 - 2 * t);
        door.userData.parentGroup.updateMatrixWorld(true);
    }
    if (!movePlayer()) {
        // Si no hay espacio seguro, detener este paso hasta que el jugador se aparte.
        for (const { door, angle, elapsed, collisionEnabled } of previous) {
            door.userData.motion.elapsed = elapsed;
            door.userData.collisionEnabled = collisionEnabled;
            door.userData.parentGroup.rotation.y = angle;
            door.userData.parentGroup.updateMatrixWorld(true);
        }
        return;
    }
    for (const door of moving) {
        if (door.userData.motion.elapsed === 0.7) delete door.userData.motion;
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
