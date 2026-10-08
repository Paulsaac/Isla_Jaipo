import { UNIT_SIZE, COLLISION_RADIUS } from '../config.js';
import { getDoorOpening } from '../world/door-opening.js';

// Consulta las matrices actuales; no mueve al jugador ni modifica el mundo.
export function isWall(x, z, mapWidth, mapHeight, collisionMap, floorMap, isRidingBoat) {
    if (collisionMap.length === 0) return true;
    const currentGX = Math.floor((x + UNIT_SIZE/2) / UNIT_SIZE);
    const currentGZ = Math.floor((z + UNIT_SIZE/2) / UNIT_SIZE);

    for(let dz = -1; dz <= 1; dz++) {
        for(let dx = -1; dx <= 1; dx++) {
            const cz = currentGZ + dz;
            const cx = currentGX + dx;
            if (cz >= 0 && cz < mapHeight && cx >= 0 && cx < mapWidth) {
                if (collisionMap[cz][cx] === 'TREE' || collisionMap[cz][cx] === 'BUSH') {
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
        } else if (cell && cell !== 'TREE' && cell !== 'BUSH' && cell !== 'SNOW_PEAK') return true;

        if (isRidingBoat && !['WATER', 'WATER_ROCK', 'BOAT'].includes(floorMap[gZ][gX])) return true;
    }
    return false;
}
