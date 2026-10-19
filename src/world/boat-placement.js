import { UNIT_SIZE } from '../config.js';

export function placeBoatFacingWest(boat, isBlocked) {
    boat.rotation.y = Math.PI/2; // Proa local -Z hacia el oeste (-X).
    const {x,z} = boat.position;
    if (!isBlocked(x,z)) return true;
    // Si la nueva orientación toca tierra, buscar el ajuste mínimo junto al amarre.
    const step = UNIT_SIZE/16;
    let best = null, distance = Infinity;
    for (let iz=-16;iz<=16;iz++) for (let ix=-16;ix<=16;ix++) {
        const dx=ix*step,dz=iz*step,next=Math.hypot(dx,dz);
        if (next>UNIT_SIZE || next>=distance || isBlocked(x+dx,z+dz)) continue;
        best={x:x+dx,z:z+dz}; distance=next;
    }
    if (!best) return false;
    boat.position.x=best.x; boat.position.z=best.z;
    return true;
}
