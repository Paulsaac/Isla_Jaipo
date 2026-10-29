import { getSummitRoute, getSummitDirtRoutes, summitRidge, summitStonePlatform } from '../content/summit-layout.js';

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
    const top=profile.summitHeight,route=getSummitRoute(),crest=summitRidge.crest;
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
    const distances=[0];
    for(let i=1;i<route.length;i++)distances.push(distances.at(-1)+Math.hypot(route[i][0]-route[i-1][0],route[i][1]-route[i-1][1]));
    const total=distances.at(-1),roadY=distance=>top+summitStonePlatform.heightOffset*smooth(distance/(total*.92));
    const terrainTypes=new Set(['MOUNTAIN','PEAK','SNOW_PEAK','SNOW_SLOPE','DIRT']);
    for(let z=92;z<=149;z++)for(let x=94;x<=170;x++) {
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
        const ends=smooth(Math.min(crestAlong,crestDistances.at(-1)-crestAlong)/10);
        // Perfil redondeado, con tangente horizontal en la cresta y en el pie.
        const across=clamp(ridgeDistance/summitRidge.width);
        const ridgeWeight=(.5+.5*Math.cos(across*Math.PI))*ends;
        let nearest=Infinity,along=0;
        for(let i=1;i<route.length;i++) {
            const p=project(x,z,route[i-1],route[i]);
            if(p.distance<nearest){nearest=p.distance;along=distances[i-1]+(distances[i]-distances[i-1])*p.t;}
        }
        if(ridgeWeight>0) {
            // El cordón posterior debe sobresalir del camino, también donde este asciende.
            const easternCut=smooth((x-132)/23);
            const crags=(13+Math.sin(x*.14+z*.09)*3.5+Math.sin(x*.31-z*.17)*2)*(1-.78*easternCut);
            const easternRidge=smooth((crestX-127)/12);
            let ridgeTop=top+crags;
            if(easternRidge>0) {
                let distance=Infinity,roadAlong=0;
                for(let i=1;i<route.length;i++) {
                    const p=project(crestX,crestZ,route[i-1],route[i]);
                    if(p.distance<distance){distance=p.distance;roadAlong=distances[i-1]+(distances[i]-distances[i-1])*p.t;}
                }
                // Lomos amplios y redondeados, con imperfecciones suaves como el extremo occidental.
                const rockPhase=crestAlong*.21+Math.sin(crestAlong*.055)*.65;
                const rockyEdge=1.7+Math.sin(rockPhase)*.85+Math.sin(crestAlong*.48+1.1)*.16;
                const raisedTop=roadY(roadAlong)+6.5+rockyEdge;
                const roadClearance=smooth((nearest-1.7)/1.4);
                ridgeTop+=Math.max(0,raisedTop-ridgeTop)*easternRidge*roadClearance;
            }
            heights[z][x]+=Math.max(0,ridgeTop-heights[z][x])*ridgeWeight;
            if(ridgeWeight>.03){floorMap[z][x]='SNOW_PEAK';collisionMap[z][x]='PEAK';}
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
