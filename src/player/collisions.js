import { UNIT_SIZE, COLLISION_RADIUS, BOAT_WIDTH } from '../config.js';
import { getDoorOpening } from '../world/door-opening.js';

// Consulta las matrices actuales; no mueve al jugador ni modifica el mundo.
export function isWall(x, z, mapWidth, mapHeight, collisionMap, floorMap, isRidingBoat, solidInteractables = []) {
    if (collisionMap.length === 0) return true;
    if (isRidingBoat) {
        // Toda la huella del casco debe estar sobre agua libre, no solo el centro del jugador.
        const half=BOAT_WIDTH/2;
        const minX=Math.floor((x-half+UNIT_SIZE/2)/UNIT_SIZE);
        const maxX=Math.floor((x+half+UNIT_SIZE/2)/UNIT_SIZE);
        const minZ=Math.floor((z-half+UNIT_SIZE/2)/UNIT_SIZE);
        const maxZ=Math.floor((z+half+UNIT_SIZE/2)/UNIT_SIZE);
        for(let rz=minZ;rz<=maxZ;rz++) for(let rx=minX;rx<=maxX;rx++) {
            if(rx<0||rz<0||rx>=mapWidth||rz>=mapHeight) return true;
            if(!['WATER','WATER_ROCK','BOAT'].includes(floorMap[rz][rx])||collisionMap[rz][rx]) return true;
        }
        return false;
    }
    const currentGX = Math.floor((x + UNIT_SIZE/2) / UNIT_SIZE);
    const currentGZ = Math.floor((z + UNIT_SIZE/2) / UNIT_SIZE);

    // Círculo del jugador frente a la huella del modelo, incluida la hoja abierta.
    for (const object of solidInteractables) {
        const matrix = object.matrixWorld.elements;
        const dx = x - matrix[12], dz = z - matrix[14];
        if (Math.abs(dx) > UNIT_SIZE * 2 || Math.abs(dz) > UNIT_SIZE * 2) continue;
        if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        const localX = dx * matrix[0] + dz * matrix[2];
        const localZ = dx * matrix[8] + dz * matrix[10];
        const distanceX = Math.max(bounds.min.x - localX, 0, localX - bounds.max.x);
        const distanceZ = Math.max(bounds.min.z - localZ, 0, localZ - bounds.max.z);
        if (distanceX * distanceX + distanceZ * distanceZ < COLLISION_RADIUS ** 2) return true;
    }

    for(let dz = -1; dz <= 1; dz++) {
        for(let dx = -1; dx <= 1; dx++) {
            const cz = currentGZ + dz;
            const cx = currentGX + dx;
            if (cz >= 0 && cz < mapHeight && cx >= 0 && cx < mapWidth) {
                if (collisionMap[cz][cx] === 'TREE') {
                    const centerX = cx * UNIT_SIZE;
                    const centerZ = cz * UNIT_SIZE;
                    const dist = Math.sqrt((x - centerX)**2 + (z - centerZ)**2);
                    if (dist < 0.4 + COLLISION_RADIUS) return true;
                }
            }
        }
    }

    const offsetsX = [-COLLISION_RADIUS, COLLISION_RADIUS, -COLLISION_RADIUS, COLLISION_RADIUS];
    const offsetsZ = [-COLLISION_RADIUS, -COLLISION_RADIUS, COLLISION_RADIUS, COLLISION_RADIUS];

    for (let i = 0; i < 4; i++) {
        const pX = x + offsetsX[i];
        const pZ = z + offsetsZ[i];
        const gX = Math.floor((pX + UNIT_SIZE/2) / UNIT_SIZE);
        const gZ = Math.floor((pZ + UNIT_SIZE/2) / UNIT_SIZE);
        if (gZ < 0 || gZ >= mapHeight || gX < 0 || gX >= mapWidth) return true;

        const cell = collisionMap[gZ][gX];
        if (['DOOR_UNLOCKED','DOOR_LOCKED'].includes(floorMap[gZ][gX])) {
            const opening=getDoorOpening(floorMap,gX,gZ);
            const offset=opening.isHorizontal?pX-gX*UNIT_SIZE:pZ-gZ*UNIT_SIZE;
            if(offset < -UNIT_SIZE/2+opening.leftMargin || offset > UNIT_SIZE/2-opening.rightMargin) return true;
        }
        if (['MOUNTAIN','PEAK'].includes(cell)) {
            // Unir tramos diagonales del camino con un corredor de ancho transitable.
            let onPath=false;
            for(let rz=gZ-1;rz<=gZ+1&&!onPath;rz++) for(let rx=gX-1;rx<=gX+1&&!onPath;rx++) {
                if(floorMap[rz]?.[rx]!=='DIRT') continue;
                for(let dz=-1;dz<=1&&!onPath;dz++) for(let dx=-1;dx<=1&&!onPath;dx++) {
                    if(floorMap[rz+dz]?.[rx+dx]!=='DIRT') continue;
                    const ax=rx*UNIT_SIZE,az=rz*UNIT_SIZE,bx=dx*UNIT_SIZE,bz=dz*UNIT_SIZE;
                    const length=bx*bx+bz*bz;
                    const t=length?Math.max(0,Math.min(1,((pX-ax)*bx+(pZ-az)*bz)/length)):0;
                    if(Math.hypot(pX-ax-t*bx,pZ-az-t*bz)<0.8) onPath=true;
                }
            }
            if(!onPath) return true;
        } else if (cell && cell !== 'TREE' && cell !== 'BUSH' && cell !== 'SNOW_PEAK') {
            if (solidInteractables.length && ['CHEST', 'DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(cell)) continue;
            return true;
        }

    }
    return false;
}
