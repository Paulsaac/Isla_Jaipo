import { UNIT_SIZE, DOOR_SIDE_MARGIN } from '../config.js';

const isDoor = type => ['DOOR_UNLOCKED','DOOR_LOCKED'].includes(type);

// Las puertas dobles comparten su abertura, sin un pilar entre las hojas.
export function getDoorOpening(floorMap, x, z) {
    const isHorizontal = floorMap[z]?.[x-1]==='BUILDING'||floorMap[z]?.[x+1]==='BUILDING'||isDoor(floorMap[z]?.[x-1])||isDoor(floorMap[z]?.[x+1]);
    const before = isDoor(isHorizontal?floorMap[z]?.[x-1]:floorMap[z-1]?.[x]);
    const after = isDoor(isHorizontal?floorMap[z]?.[x+1]:floorMap[z+1]?.[x]);
    const leftMargin = before?0:DOOR_SIDE_MARGIN;
    const rightMargin = after?0:DOOR_SIDE_MARGIN;
    const isDouble = before || after;
    return {isHorizontal,isDouble,isRightDoor:before || !isDouble,leftMargin,rightMargin,width:UNIT_SIZE-leftMargin-rightMargin,centerOffset:(leftMargin-rightMargin)/2};
}
