import { UNIT_SIZE } from '../config.js';

// Casa hacia el centro de la explanada; reserva la cara norte para la cresta.
const offsetCells={x:-15,z:4};
export const wizardHouseLayout={
    offsetCells,
    sourceBounds:{minX:147,maxX:158,minZ:123,maxZ:133},
    origin:{x:305+offsetCells.x*UNIT_SIZE,z:256+offsetCells.z*UNIT_SIZE},
    door:{x:148+offsetCells.x,z:128+offsetCells.z},
    workshop:{x:152+offsetCells.x,z:125+offsetCells.z},
    chest:{x:154+offsetCells.x,z:128+offsetCells.z}
};

// Mismos 12 x 12 m de plataforma y observatorio, ahora al extremo de la cresta.
export const summitStonePlatform={minX:114,minZ:108,cellsPerSide:6,size:12,heightOffset:17};
export const observatoryMiddleStoreyRise=.4;
export const summitRidge={
    crest:[[102,139],[105,123],[111,109],[121,101],[137,101],[151,109],[160,123],[161,138]],
    width:9,
    route:[[140,144],[147,143],[152,139],[155,133],[153,121],[143,113],[130,110],[123,111],[121.5,111.5],[119,114.5],[117,115],[116.5,114]],
    dirtRoutes:[[[108,130.2],[118,131],[125,130.8],[131,132]],
        [[130,131.6],[130,136],[132.5,141],[136,144],[140,144]]],
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
