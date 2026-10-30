import {UNIT_SIZE} from '../config.js';

// Time Wizard: casa del lago, con centro y acceso oriental del mapa original.
export const timeWizardHouseLayout={
    wizardId:'time-wizard',wizardName:'Time Wizard',
    center:{x:363,z:283},
    bounds:{minX:359,maxX:367,minZ:279,maxZ:287},
    structure:{minX:360,maxX:366,minZ:280,maxZ:286},
    door:{x:366,z:283},
    radius:6.8,rise:5.9,skirt:.45,sides:12,
    origin:{x:363*UNIT_SIZE,z:283*UNIT_SIZE}
};
// Nombre anterior usado por la arquitectura del lago; siempre es Time Wizard.
export const lakeHouseLayout=timeWizardHouseLayout;

export const isLakeHouseCell=(x,z)=>{
    const b=lakeHouseLayout.bounds;
    return x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ;
};
export const isLakeHouseDoor=(x,z)=>x===lakeHouseLayout.door.x&&z===lakeHouseLayout.door.z;
