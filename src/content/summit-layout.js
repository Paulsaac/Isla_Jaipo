import { UNIT_SIZE } from '../config.js';

// Space Wizard: casa de la montaña, hacia el centro de la explanada.
const offsetCells={x:-15,z:2};
export const spaceWizardHouseLayout={
    wizardId:'space-wizard',wizardName:'Space Wizard',
    ground:{halfX:10,halfZ:9,wallThickness:.50},
    furnitureOffsets:{workshop:{x:0,z:-1.28},televisions:{x:7.18,z:-6.78},chest:{x:5.08,z:6.08}},
    offsetCells,
    sourceBounds:{minX:147,maxX:158,minZ:123,maxZ:133},
    origin:{x:305+offsetCells.x*UNIT_SIZE,z:256+offsetCells.z*UNIT_SIZE},
    door:{x:148+offsetCells.x,z:128+offsetCells.z},
    approach:{x:108,z:128+offsetCells.z},
    workshop:{x:152+offsetCells.x,z:125+offsetCells.z},
    chest:{x:154+offsetCells.x,z:128+offsetCells.z}
};
// Nombre anterior usado por la arquitectura de montaña; siempre es Space Wizard.
export const wizardHouseLayout=spaceWizardHouseLayout;

// Mismos 12 x 12 m de plataforma y observatorio, ahora al extremo de la cresta.
export const summitStonePlatform={minX:114,minZ:108,cellsPerSide:6,size:12,heightOffset:17};
export const observatoryMiddleStoreyRise=.4;
export const summitRidge={
    crest:[[102,139],[105,123],[111,109],[121,101],[137,101],[151,109],[160,123],[161,138]],
    width:9,
    route:[[140,144],[147,143],[152,139],[155,133],[153,121],[143,113],[130,110],[123,111],[121.5,111.5],[119,114.5],[117,115],[116.5,114]],
    dirtRoutes:[[[wizardHouseLayout.approach.x,wizardHouseLayout.approach.z],
        [wizardHouseLayout.door.x,wizardHouseLayout.door.z]],
        [[130,wizardHouseLayout.approach.z],[130,136],[132.5,141],[136,144],[140,144]]],
    halfWidth:.95
};

// Catmull-Rom en celdas, compartida por pintura, relieve y corredor transitable.
export function getSummitRoute() {
    return sampleRoute(summitRidge.route);
}

export function getSummitDirtRoutes() {
    return summitRidge.dirtRoutes.map(sampleRoute);
}

function sampleRoute(nodes) {
    const points=[];
    for(let i=0;i<nodes.length-1;i++)for(let step=0;step<32;step++) {
        const t=step/32,t2=t*t,t3=t2*t;
        const a=nodes[Math.max(0,i-1)],b=nodes[i],c=nodes[i+1],d=nodes[Math.min(nodes.length-1,i+2)];
        points.push([0,1].map(axis=>.5*((2*b[axis])+(-a[axis]+c[axis])*t
            +(2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*t2
            +(-a[axis]+3*b[axis]-3*c[axis]+d[axis])*t3)));
    }
    points.push(nodes.at(-1).slice());
    return points;
}
