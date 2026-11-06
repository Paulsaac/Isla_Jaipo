import { getSummitRoute, getSummitDirtRoutes, getSummitCrest, summitRidge, summitStonePlatform } from '../content/summit-layout.js';

const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
function project(x,z,a,b) {
    const dx=b[0]-a[0],dz=b[1]-a[1],length2=dx*dx+dz*dz;
    const t=clamp(((x-a[0])*dx+(z-a[1])*dz)/length2);
    return {t,distance:Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};
}

// Relieve de la cima y camino integrado: una sola superficie para dibujo y apoyo.
export function shapeSummitRidge(floorMap,heights,mountainMask,profile,collisionMap) {
    if(!profile?.contourTrail)return profile;
    const top=profile.summitHeight,route=getSummitRoute(),crest=getSummitCrest();
    // Retirar pintura antigua del ramal izquierdo y de la antigua entrada de piedras.
    // La nueva pintura continua se aplica abajo, sin tocar habitaciones ni plataforma.
    for(let z=100;z<=149;z++)for(let x=100;x<=165;x++) {
        const oldApproach=x>=104&&x<=132&&z>=124&&z<=133;
        const oldStoneEntry=x>=141&&x<=154&&z>=132&&z<=139;
        if((oldApproach||oldStoneEntry)&&floorMap[z]?.[x]==='DIRT') {
            floorMap[z][x]='SNOW_PEAK';
        }
    }
    const crestDistances=[0];
    for(let i=1;i<crest.length;i++)crestDistances.push(crestDistances.at(-1)+Math.hypot(crest[i][0]-crest[i-1][0],crest[i][1]-crest[i-1][1]));
    const observatoryX=summitStonePlatform.minX+summitStonePlatform.cellsPerSide/2;
    const observatoryZ=summitStonePlatform.minZ+summitStonePlatform.cellsPerSide/2;
    let referenceDistance=Infinity,referenceX=0,referenceZ=0,referenceAlong=0;
    let descentDistance=Infinity,descentAlong=0;
    for(let i=1;i<crest.length;i++) {
        const p=project(observatoryX,observatoryZ,crest[i-1],crest[i]);
        if(p.distance<referenceDistance) {
            referenceDistance=p.distance;
            referenceAlong=crestDistances[i-1]+(crestDistances[i]-crestDistances[i-1])*p.t;
            referenceX=crest[i-1][0]+(crest[i][0]-crest[i-1][0])*p.t;
            referenceZ=crest[i-1][1]+(crest[i][1]-crest[i-1][1])*p.t;
        }
    }
    for(let i=1;i<crest.length;i++) {
        const p=project(...summitRidge.descentStart,crest[i-1],crest[i]);
        if(p.distance<descentDistance) {
            descentDistance=p.distance;
            descentAlong=crestDistances[i-1]+(crestDistances[i]-crestDistances[i-1])*p.t;
        }
    }
    const clearanceRoutes=[...getSummitDirtRoutes(),profile.points.filter(p=>p.y>top-25).map(p=>[p.x,p.z])];
    const gentleWave=along=>Math.sin(along*.075)*.55+Math.sin(along*.16+.8)*.18;
    const ridgeTop=top+13+Math.sin(referenceX*.14+referenceZ*.09)*3.5+Math.sin(referenceX*.31-referenceZ*.17)*2;
    const distances=[0];
    for(let i=1;i<route.length;i++)distances.push(distances.at(-1)+Math.hypot(route[i][0]-route[i-1][0],route[i][1]-route[i-1][1]));
    const total=distances.at(-1),roadY=distance=>top+summitStonePlatform.heightOffset*smooth(distance/(total*.92));
    const terrainTypes=new Set(['MOUNTAIN','PEAK','SNOW_PEAK','SNOW_SLOPE','DIRT']);
    // El volumen añadido conserva la pendiente natural de la montaña.
    const naturalHeights=heights.map(row=>Float32Array.from(row));
    const sampleNatural=(x,z)=>{
        x=Math.max(0,Math.min(floorMap[0].length-1.001,x));
        z=Math.max(0,Math.min(floorMap.length-1.001,z));
        const ix=Math.floor(x),iz=Math.floor(z),tx=x-ix,tz=z-iz;
        return (naturalHeights[iz][ix]*(1-tx)+naturalHeights[iz][ix+1]*tx)*(1-tz)
            +(naturalHeights[iz+1][ix]*(1-tx)+naturalHeights[iz+1][ix+1]*tx)*tz;
    };
    const margin=Math.ceil(summitRidge.outerWidth+1);
    const minX=Math.max(0,Math.floor(Math.min(...crest.map(p=>p[0]))-margin));
    const maxX=Math.min(floorMap[0].length-1,Math.ceil(Math.max(...crest.map(p=>p[0]))+margin));
    const minZ=Math.max(0,Math.floor(Math.min(...crest.map(p=>p[1]))-margin));
    const maxZ=Math.min(floorMap.length-1,Math.ceil(Math.max(...crest.map(p=>p[1]))+margin));
    for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++) {

        if(!mountainMask[z]?.[x]||!terrainTypes.has(floorMap[z][x]))continue;
        let ridgeDistance=Infinity,crestAlong=0,crestX=0,crestZ=0;
        for(let i=1;i<crest.length;i++) {
            const p=project(x,z,crest[i-1],crest[i]);
            if(p.distance<ridgeDistance){
                ridgeDistance=p.distance;crestAlong=crestDistances[i-1]+(crestDistances[i]-crestDistances[i-1])*p.t;
                crestX=crest[i-1][0]+(crest[i][0]-crest[i-1][0])*p.t;
                crestZ=crest[i-1][1]+(crest[i][1]-crest[i-1][1])*p.t;
            }
        }
        const remaining=crestDistances.at(-1)-crestAlong;
        const ends=smooth(crestAlong/10)*smooth(remaining/18);
        const descent=smooth((crestAlong-descentAlong)/(crestDistances.at(-1)-descentAlong));
        const crestHeight=ridgeTop+(top+summitRidge.endHeightOffset-ridgeTop)*descent
            +(gentleWave(crestAlong)-gentleWave(referenceAlong))*(1-descent);
        const radialX=crestX-summitRidge.center.x,radialZ=crestZ-summitRidge.center.z;
        const radialLength=Math.hypot(radialX,radialZ)||1;
        const outward=((x-crestX)*radialX+(z-crestZ)*radialZ)/radialLength;
        const skirtWidth=summitRidge.width+(summitRidge.outerWidth-summitRidge.width)*smooth((outward+1.5)/3);
        const across=clamp(ridgeDistance/skirtWidth);
        let ridgeWeight=(.5+.5*Math.cos(across*Math.PI))*ends;
        let nearest=Infinity,along=0;
        for(let i=1;i<route.length;i++) {
            const p=project(x,z,route[i-1],route[i]);
            if(p.distance<nearest){nearest=p.distance;along=distances[i-1]+(distances[i]-distances[i-1])*p.t;}
        }
        // Respetar también la llegada de la subida y los ramales de tierra.
        let clearance=nearest;
        for(const points of clearanceRoutes)for(let i=1;i<points.length;i++)
            clearance=Math.min(clearance,project(x,z,points[i-1],points[i]).distance);
        ridgeWeight*=smooth((clearance-summitRidge.pathClearance)/summitRidge.pathBlend);
        if(ridgeWeight>0) {
            const lift=Math.max(0,crestHeight-sampleNatural(crestX,crestZ));
            heights[z][x]=naturalHeights[z][x]+lift*ridgeWeight;
            if(ridgeWeight>.03&&ridgeDistance<summitRidge.width){floorMap[z][x]='SNOW_PEAK';collisionMap[z][x]='PEAK';}
        }
        if(nearest<3.4) {
            const shoulder=smooth((3.4-nearest)/(3.4-1.15));
            heights[z][x]+=Math.max(0,roadY(along)+.12-heights[z][x])*shoulder;
        }
        if(nearest<=summitRidge.halfWidth+.1) {
            floorMap[z][x]='DIRT';collisionMap[z][x]=false;
        }
    }
    // Los segmentos nuevos usan el mismo muestreo continuo del sendero existente.
    for(let i=1;i<route.length;i++) {
        const a=route[i-1],b=route[i],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz;
        if(l2<1e-10)continue;
        const index=profile.segments.length;
        profile.segments.push({x:a[0],z:a[1],dx,dz,l2,y:roadY(distances[i-1]),
            dy:roadY(distances[i])-roadY(distances[i-1]),coreRadius:summitRidge.halfWidth,
            coreDelta:0,blendRadius:2.5,blendDelta:0,snowCut:false});
        for(let z=Math.max(0,Math.floor(Math.min(a[1],b[1])-3));z<=Math.min(floorMap.length-1,Math.ceil(Math.max(a[1],b[1])+3));z++)
            for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0])-3));x<=Math.min(floorMap[0].length-1,Math.ceil(Math.max(a[0],b[0])+3));x++)
                (profile.bins[z][x]??=[]).push(index);
    }
    profile.summitRoute=route.map((p,i)=>({x:p[0],z:p[1],y:roadY(distances[i])}));
    const dirtRoutes=getSummitDirtRoutes().map((points,branch)=>points.map(([x,z])=>{
        // La llegada sigue la cota de la subida existente; la bifurcación es de cima.
        let y=top,nearest=Infinity;
        if(branch===0)for(const p of profile.points) {
            const distance=Math.hypot(p.x-x,p.z-z);
            if(distance<nearest){nearest=distance;y=p.y;}
        }
        return {x,z,y};
    }));
    for(const points of dirtRoutes)for(let i=1;i<points.length;i++) {
        const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
        if(l2<1e-10)continue;
        const index=profile.segments.length;
        profile.segments.push({x:a.x,z:a.z,dx,dz,l2,y:a.y,dy:b.y-a.y,
            coreRadius:.8,coreDelta:0,blendRadius:2.5,blendDelta:0,snowCut:false});
        for(let z=Math.max(0,Math.floor(Math.min(a.z,b.z)-3));z<=Math.min(floorMap.length-1,Math.ceil(Math.max(a.z,b.z)+3));z++)
            for(let x=Math.max(0,Math.floor(Math.min(a.x,b.x)-3));x<=Math.min(floorMap[0].length-1,Math.ceil(Math.max(a.x,b.x)+3));x++) {
                (profile.bins[z][x]??=[]).push(index);
                if(project(x,z,[a.x,a.z],[b.x,b.z]).distance<1.1
                    &&terrainTypes.has(floorMap[z][x]))collisionMap[z][x]=false;
            }
    }
    profile.summitDirtRoutes=dirtRoutes;
    return profile;
}
