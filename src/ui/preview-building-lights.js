import {lakeHouseLayout} from '../content/lake-house-layout.js';

const directions=[{side:'north',dx:0,dz:-1},{side:'east',dx:1,dz:0},
    {side:'south',dx:0,dz:1},{side:'west',dx:-1,dz:0}];

// +Z es el sur de la isla (casa de Graham); los caminos se leen de la maqueta guardada.
export function createPreviewBuildingLightPlacements(model,houseScale) {
    const roads=[];
    for(let i=0;i<model.positions.length;i+=3) {
        // DIRT de la maqueta en RGB lineal: mismo color usado por su generador.
        if(Math.abs(model.colors[i]-81)<=2&&Math.abs(model.colors[i+1]-53)<=2&&Math.abs(model.colors[i+2]-26)<=2)
            roads.push({x:model.positions[i],z:model.positions[i+2]});
    }
    let highestFloor=-Infinity;
    for(let i=4;i<model.roofs.length;i+=5)highestFloor=Math.max(highestFloor,model.roofs[i]);
    const result=[];
    for(let i=0;i<model.roofs.length;i+=5) {
        const [x,z,width,depth,y]=model.roofs.subarray(i,i+5);
        const centerX=x+(width-1)/2,centerZ=z+(depth-1)/2;
        const halfWidth=(width-1.6)*houseScale/2,halfDepth=(depth-1.6)*houseScale/2;
        const contains=(px,pz)=>px>=x&&px<x+width&&pz>=z&&pz<z+depth;
        let direction,kind;
        if(contains(model.homeX,model.homeZ)){direction=directions[0];kind='graham';}
        else if(y===highestFloor&&y>4){direction=directions[3];kind='mountain';}
        else if(contains(lakeHouseLayout.center.x,lakeHouseLayout.center.z)){direction=directions[1];kind='lake';}
        else {
            kind='road';direction=directions[2];let nearest=Infinity;
            for(const candidate of directions) {
                const faceX=centerX+candidate.dx*halfWidth,faceZ=centerZ+candidate.dz*halfDepth;
                for(const road of roads) {
                    const dx=road.x-faceX,dz=road.z-faceZ;
                    if(dx*candidate.dx+dz*candidate.dz<0)continue;
                    const distance=dx*dx+dz*dz;
                    if(distance<nearest){nearest=distance;direction=candidate;}
                }
            }
        }
        const clearance=.08;
        result.push({kind,side:direction.side,
            x:centerX+direction.dx*(halfWidth+clearance),
            y:y+3*houseScale,
            z:centerZ+direction.dz*(halfDepth+clearance)});
    }
    return result;
}
