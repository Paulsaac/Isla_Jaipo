import { UNIT_SIZE } from '../config.js';

// Traslado hacia el oeste de la cima, según las marcas de la referencia.
const offsetCells={x:-9,z:0};
export const wizardHouseLayout={
    offsetCells,
    sourceBounds:{minX:147,maxX:158,minZ:123,maxZ:133},
    origin:{x:305+offsetCells.x*UNIT_SIZE,z:256+offsetCells.z*UNIT_SIZE},
    door:{x:148+offsetCells.x,z:128+offsetCells.z},
    workshop:{x:152+offsetCells.x,z:125+offsetCells.z},
    chest:{x:154+offsetCells.x,z:128+offsetCells.z}
};

// Coordenadas de celdas: el ramal sale del acceso y curva hacia el noroeste.
export const summitBranch={curve:[[138,128],[134,127],[127,120],[128,111]],halfWidth:.65};
// Plaza ampliada a 12 x 12 unidades, conservando el centro del observatorio.
export const summitStonePlatform={minX:125,minZ:107,cellsPerSide:6,size:12};
