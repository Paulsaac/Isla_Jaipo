import { MOUNTAIN_RELIEF_RUNS } from '../content/mountain-relief.js';
import { UNIT_SIZE } from '../config.js';
import { wizardHouseLayout } from '../content/summit-layout.js';

// Buscar cotas sobre la ladera terminada y excavar una plataforma sin añadir relleno.
export function carveMountainTrail(floorMap, heights, mountainMask, profile, collisionMap) {
    if(!profile)return profile;
    const height=floorMap.length,width=floorMap[0].length,top=profile.summitHeight;
    const snow=MOUNTAIN_RELIEF_RUNS.filter(r=>r[0]==='SNOW_PEAK');
    const cx=(Math.min(...snow.map(r=>r[2]))+Math.max(...snow.map(r=>r[3])))/2;
    const cz=(Math.min(...snow.map(r=>r[1]))+Math.max(...snow.map(r=>r[1])))/2;
    const sample=(x,z)=>{
        x=Math.max(0,Math.min(width-1.001,x));z=Math.max(0,Math.min(height-1.001,z));
        const ix=Math.floor(x),iz=Math.floor(z),tx=x-ix,tz=z-iz;
        return (heights[iz][ix]*(1-tx)+heights[iz][ix+1]*tx)*(1-tz)
            +(heights[iz+1][ix]*(1-tx)+heights[iz+1][ix+1]*tx)*tz;
    };
    const entries=[],goals=[];
    for(let z=1;z<height-1;z++)for(let x=1;x<width-1;x++) {
        if(!mountainMask[z][x]||floorMap[z][x]!=='DIRT')continue;
        if(heights[z][x]<3&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>floorMap[z+dz][x+dx]==='DIRT'&&!mountainMask[z+dz][x+dx]))entries.push({x,z,y:heights[z][x]});
        if(heights[z][x]>=top*.995)goals.push({x,z,y:heights[z][x]});
    }
    if(!entries.length||!goals.length)return {...profile,carved:false};
    entries.sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz));
    const entry=entries[0],startAngle=Math.atan2(entry.z-cz,entry.x-cx);
    goals.sort((a,b)=>Math.hypot(a.x-entry.x,a.z-entry.z)-Math.hypot(b.x-entry.x,b.z-entry.z));
    const goal=goals[0];let endAngle=Math.atan2(goal.z-cz,goal.x-cx);
    while(endAngle-startAngle>Math.PI)endAngle-=2*Math.PI;
    while(endAngle-startAngle<-Math.PI)endAngle+=2*Math.PI;
    const direction=endAngle>startAngle?1:-1;
    // Las primeras horquillas permanecen en la cara de acceso, lejos de la cola costera.
    const angles=[startAngle,startAngle+direction*.45,startAngle+direction*.10,
        startAngle+direction*.60,startAngle+direction*.25,
        startAngle+direction*1.30,startAngle+direction*.40,startAngle+direction*.80,endAngle];
    const levels=[entry.y,top*.08,top*.16,top*.24,top*.32,top*.52,top*.73,top*.87,goal.y-.02];
    function contour(angle,y) {
        let inner=0,outer=Math.min(width,height)*.48;
        for(let i=0;i<32;i++) {
            const r=(inner+outer)/2;
            if(sample(cx+Math.cos(angle)*r,cz+Math.sin(angle)*r)>y)inner=r;else outer=r;
        }
        const r=(inner+outer)/2;
        return {x:cx+Math.cos(angle)*r,z:cz+Math.sin(angle)*r};
    }
    const points=[{x:entry.x,z:entry.z}];
    for(let leg=0;leg<angles.length-2;leg++)for(let i=1;i<=120;i++) {
        const t=i/120,rise=leg>=angles.length-3?t:.5*t+.5*t*t*(3-2*t);
        points.push(contour(angles[leg]+(angles[leg+1]-angles[leg])*t,levels[leg]+(levels[leg+1]-levels[leg])*rise));
    }
    // Último ascenso hacia la puerta occidental de la casa, excavado en la nieve.
    // La salida se nivela antes de la entrada, sin prolongarse bajo el edificio.
    const summitStart=points.length-1,last=points.at(-1);
    const arrival={x:wizardHouseLayout.door.x-2,z:wizardHouseLayout.door.z};
    const straightStart=wizardHouseLayout.approach,curveSteps=60;
    const control={x:last.x+8,z:straightStart.z};
    for(let i=1;i<=180;i++) {
        if(i<=curveSteps) {
            const t=i/curveSteps,s=1-t;
            points.push({x:s*s*last.x+2*s*t*control.x+t*t*straightStart.x,
                z:s*s*last.z+2*s*t*control.z+t*t*straightStart.z});
        } else {
            const t=(i-curveSteps)/(180-curveSteps);
            points.push({x:straightStart.x+(arrival.x-straightStart.x)*t,z:arrival.z});
        }
    }
    // Redondear cambios de sentido para que la plataforma no tenga esquinas
    // donde dos tramos próximos compitan por la altura del mismo vértice.
    for(let pass=0;pass<24;pass++) {
        const previous=points.map(p=>({...p}));
        for(let i=1;i<points.length-1;i++) {
            // La llegada y su pintura comparten una recta hasta la puerta.
            if(i>=summitStart+curveSteps)continue;
            points[i].x=(previous[i-1].x+2*previous[i].x+previous[i+1].x)/4;
            points[i].z=(previous[i-1].z+2*previous[i].z+previous[i+1].z)/4;
        }
    }
    // Apoyar la plataforma por debajo del borde exterior: el lado de la cima
    // se excava, mientras que el lado del valle nunca forma un terraplén.
    // Un muestreo circular mantiene la cota continua también en las horquillas.
    let travelled=0;
    for(let i=0;i<points.length;i++) {
        const p=points[i];
        if(i)travelled+=Math.hypot(p.x-points[i-1].x,p.z-points[i-1].z);
        p.distance=travelled;
    }
    for(const p of points) {
        const natural=sample(p.x,p.z);
        let edge=natural;
        for(let i=0;i<24;i++) {
            const angle=i*Math.PI/12;
            edge=Math.min(edge,sample(p.x+Math.cos(angle)*.85,p.z+Math.sin(angle)*.85));
        }
        p.cut=natural-edge+.18;
    }
    for(const p of points) {
        let depth=p.cut;
        for(const q of points) {
            depth=Math.max(depth,q.cut-Math.abs(q.distance-p.distance)*.08);
        }
        const t=Math.min(1,p.distance/8,(travelled-p.distance)/12);
        const blend=t*t*(3-2*t);
        p.y=sample(p.x,p.z)-depth*blend;
    }
    // Descansos nivelados en las horquillas: evitan una superficie retorcida
    // cuando el borde interior del giro tiene un radio muy pequeño.
    for(let turn=120;turn<summitStart;turn+=120) {
        const center=points[turn].distance;
        let landing=Infinity;
        for(const p of points)if(Math.abs(p.distance-center)<2.5)landing=Math.min(landing,p.y);
        for(const p of points) {
            const d=Math.abs(p.distance-center);
            if(d>=6)continue;
            const t=Math.max(0,(d-2.5)/3.5),blend=t*t*(3-2*t);
            p.y=Math.min(p.y,landing*(1-blend)+p.y*blend);
        }
    }
    // Limitar los cambios longitudinales sin elevar ninguna parte excavada.
    for(let i=1;i<points.length;i++)points[i].y=Math.min(points[i].y,points[i-1].y+(points[i].distance-points[i-1].distance)*(i<480?.55:i<720?.8:1.1));
    for(let i=points.length-2;i>=0;i--)points[i].y=Math.min(points[i].y,points[i+1].y+(points[i+1].distance-points[i].distance)*1.1);
    // Rampa de pendiente moderada, con encuentro horizontal al final. Mantener
    // nieve natural a ambos lados genera el corte sin terraplenes ni muros añadidos.
    const start=points[summitStart],arrivalHeight=sample(arrival.x,arrival.z);
    const rampLength=points.at(-1).distance-start.distance-12;
    for(let i=summitStart+1;i<points.length;i++) {
        const p=points[i],t=Math.min(1,(p.distance-start.distance)/rampLength),edge=.1;
        const progress=t<edge?t*t/(2*edge*(1-edge))
            :t>1-edge?1-(1-t)*(1-t)/(2*edge*(1-edge)):(t-edge/2)/(1-edge);
        p.y=Math.min(sample(p.x,p.z),start.y+(arrivalHeight-start.y)*progress);
    }
    // Abrir el corte como un abanico: el piso crece suavemente y los taludes
    // se extienden mucho más, para redondear su encuentro con la nieve natural.
    for(const [i,p]of points.entries()) {
        const t=Math.max(0,Math.min(1,(p.distance-start.distance)/rampLength));
        const flare=t*t*(3-2*t);
        p.coreRadius=.65+.85*flare;p.blendRadius=1.6+3.9*flare;
        // Un corte profundo necesita más espacio lateral para redondear su
        // cresta: un radio fijo dejaba dos paredes casi verticales al comienzo.
        const shoulderT=Math.max(0,Math.min(1,(p.distance-start.distance+6)/12));
        const shoulderBlend=shoulderT*shoulderT*(3-2*shoulderT);
        const depth=Math.max(0,sample(p.x,p.z)-p.y);
        const roundedRadius=p.coreRadius+2+depth*.42;
        p.blendRadius=Math.max(p.blendRadius,1.6+(roundedRadius-1.6)*shoulderBlend);
        p.snowCut=i>=summitStart;
    }
    const segments=[],bins=Array.from({length:height},()=>Array.from({length:width},()=>null));
    let length=0;
    for(let i=1;i<points.length;i++) {
        const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
        if(l2<1e-10)continue;
        const index=segments.length;segments.push({x:a.x,z:a.z,dx,dz,l2,y:a.y,dy:b.y-a.y,
            coreRadius:a.coreRadius,coreDelta:b.coreRadius-a.coreRadius,
            blendRadius:a.blendRadius,blendDelta:b.blendRadius-a.blendRadius,snowCut:a.snowCut});length+=Math.sqrt(l2)*UNIT_SIZE;
        const reach=Math.ceil(Math.max(a.blendRadius,b.blendRadius));
        for(let z=Math.max(0,Math.floor(Math.min(a.z,b.z)-reach));z<=Math.min(height-1,Math.ceil(Math.max(a.z,b.z)+reach));z++)
            for(let x=Math.max(0,Math.floor(Math.min(a.x,b.x)-reach));x<=Math.min(width-1,Math.ceil(Math.max(a.x,b.x)+reach));x++)(bins[z][x]??=[]).push(index);
    }
    const distance=(x,z)=>{
        let best=Infinity,walkRadius=.8;
        for(const index of bins[z]?.[x]??[]) {
            const s=segments[index],t=Math.max(0,Math.min(1,((x-s.x)*s.dx+(z-s.z)*s.dz)/s.l2));
            const d=Math.hypot(x-s.x-s.dx*t,z-s.z-s.dz*t);
            if(d<best){best=d;walkRadius=s.coreRadius+s.coreDelta*t+.15;}
        }return {distance:best,walkRadius};
    };
    for(let z=0;z<height;z++)for(let x=0;x<width;x++) {
        const path=distance(x,z);
        if(!mountainMask[z][x]&&path.distance>path.walkRadius)continue;
        if(mountainMask[z][x]&&floorMap[z][x]==='DIRT'&&heights[z][x]<top*.995) {
            floorMap[z][x]='MOUNTAIN';if(collisionMap)collisionMap[z][x]='MOUNTAIN';
        }
        if(path.distance>path.walkRadius||!['MOUNTAIN','PEAK','SNOW_SLOPE','SNOW_PEAK','DIRT','TREE','BUSH','GRASS','TALL_GRASS'].includes(floorMap[z][x]))continue;
        floorMap[z][x]=heights[z][x]>top*.8?'SNOW_SLOPE':'DIRT';
        if(collisionMap)collisionMap[z][x]=false;
    }
    return {...profile,carved:false,contourTrail:true,segments,bins,points,
        coreRadius:.65,blendRadius:1.6,cutOnly:true,
        trails:[{length,base:entry.y,top:arrivalHeight}],summitPlateau:null};
}
