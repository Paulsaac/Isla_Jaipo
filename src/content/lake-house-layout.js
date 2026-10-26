import {UNIT_SIZE} from '../config.js';

// Misma isla, centro y acceso oriental que la casa pintada en las capas originales.
export const lakeHouseLayout={
    center:{x:363,z:283},
    bounds:{minX:359,maxX:367,minZ:279,maxZ:287},
    structure:{minX:360,maxX:366,minZ:280,maxZ:286},
    door:{x:366,z:283},
    radius:6.8,rise:5.9,skirt:.45,sides:12,
    origin:{x:363*UNIT_SIZE,z:283*UNIT_SIZE}
};

export const isLakeHouseCell=(x,z)=>{
    const b=lakeHouseLayout.bounds;
    return x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ;
};
export const isLakeHouseDoor=(x,z)=>x===lakeHouseLayout.door.x&&z===lakeHouseLayout.door.z;
