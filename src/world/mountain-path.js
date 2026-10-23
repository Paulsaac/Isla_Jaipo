// Regulariza la subida según distancia recorrida por el camino pintado.
export function smoothMountainPath(floorMap, heights, mountainMask, summitHeight, reference = null) {
    const height=floorMap.length,width=floorMap[0].length;
    const distance=Array.from({length:height},()=>new Float64Array(width).fill(Infinity));
    const queue=[];
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(floorMap[z][x]==='DIRT'&&heights[z][x]<2) {distance[z][x]=0;queue.push([x,z]);}
    }
    for(let i=0;i<queue.length;i++) {
        const [x,z]=queue[i];
        for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) {
            if(!dx&&!dz) continue;
            const nx=x+dx,nz=z+dz;
            if(floorMap[nz]?.[nx]!=='DIRT') continue;
            const candidate=distance[z][x]+Math.hypot(dx,dz)*2;
            if(candidate<distance[nz][nx]) {distance[nz][nx]=candidate;queue.push([nx,nz]);}
        }
    }
    let climbLength=Infinity;
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(floorMap[z][x]==='DIRT'&&mountainMask[z][x]&&heights[z][x]>=summitHeight*0.99) climbLength=Math.min(climbLength,distance[z][x]);
    }
    if (reference) climbLength=reference.climbLength;
    if(!Number.isFinite(climbLength)||climbLength<=0) return;
    // Perfil natural del trazado, con el aumento de altura del 15% solicitado.
    const adjustedHeight=reference?.summitHeight != null
        ? 1+(reference.summitHeight-1)*(reference.inclineMultiplier ?? 1)
        : Math.min(summitHeight,(1+climbLength*0.65*0.95)*1.15);
    const scale=(adjustedHeight-1)/(summitHeight-1);
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(mountainMask[z][x]) heights[z][x]=1+(heights[z][x]-1)*scale;
    }
    summitHeight=adjustedHeight;
    // En modo integrado el camino es pintura sobre la ladera, no una rampa aparte.
    // La meseta y la ladera se terminan de calcular después, sobre estas alturas.
    if(reference?.followTerrain) return {summitHeight, followsTerrain:true, mountainMask};
    const road=Array.from({length:height},()=>new Float32Array(width).fill(NaN));
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(floorMap[z][x]!=='DIRT'||!Number.isFinite(distance[z][x])) continue;
        const t=Math.min(1,distance[z][x]/climbLength),edge=0.05;
        // Tramo central uniforme, con entrada y llegada redondeadas.
        const progress=t<edge?t*t/(2*edge*(1-edge)):t>1-edge?1-(1-t)*(1-t)/(2*edge*(1-edge)):(t-edge/2)/(1-edge);
        road[z][x]=1+(summitHeight-1)*progress;
    }
    const original=heights.map(row=>row.slice());
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(!mountainMask[z][x]||!['DIRT','MOUNTAIN','PEAK','SNOW_PEAK'].includes(floorMap[z][x])) continue;
        let nearest=Infinity,roadHeight=0;
        for(let dz=-10;dz<=10;dz++) for(let dx=-10;dx<=10;dx++) {
            const value=road[z+dz]?.[x+dx],d=Math.hypot(dx,dz);
            if(Number.isFinite(value)&&d<nearest) {nearest=d;roadHeight=value;}
        }
        if(nearest>=10) continue;
        const t=Math.max(0,(nearest-1)/9),blend=t*t*(3-2*t);
        heights[z][x]=roadHeight*(1-blend)+original[z][x]*blend;
    }
    // Solo el tramo de montaña necesita esta superficie, no el resto de los caminos de la isla.
    const surface=road.map((row,z)=>Float32Array.from(row,(value,x)=>mountainMask[z][x]?value:NaN));
    const nearby=Array.from({length:height},()=>new Uint8Array(width));
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) if(Number.isFinite(surface[z][x])) {
        for(let dz=-3;dz<=3;dz++) for(let dx=-3;dx<=3;dx++) if(nearby[z+dz]&&x+dx>=0&&x+dx<width) nearby[z+dz][x+dx]=1;
    }
    return { surface, nearby, climbLength, summitHeight };
}

// Proyectar sobre segmentos evita bultos transversales y escalones de celda en celda.
export function sampleMountainPath(profile, x, z) {
    if(!profile || (profile.followsTerrain && !profile.carved)) return null;
    const rows=profile.surface,cx=Math.round(x),cz=Math.round(z);
    if(!profile.nearby[cz]?.[cx]) return null;
    if (profile.carved) {
        const x0=Math.floor(x),z0=Math.floor(z),tx=x-x0,tz=z-z0;
        const corners=[[0,0],[1,0],[0,1],[1,1]].map(([dx,dz])=>({x:dx,z:dz,y:rows[z0+dz]?.[x0+dx]}));
        const valid=corners.filter(point=>Number.isFinite(point.y));
        // Los ensanches de 2x2 no deben cruzar dos diagonales a alturas distintas.
        if (valid.length===4) return {distance:0,height:
            (corners[0].y*(1-tx)+corners[1].y*tx)*(1-tz)+(corners[2].y*(1-tx)+corners[3].y*tx)*tz};
        if (valid.length===3) {
            const [a,b,c]=valid;
            const denominator=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
            const wa=((b.z-c.z)*(tx-c.x)+(c.x-b.x)*(tz-c.z))/denominator;
            const wb=((c.z-a.z)*(tx-c.x)+(a.x-c.x)*(tz-c.z))/denominator,wc=1-wa-wb;
            if (Math.min(wa,wb,wc)>=-1e-7) return {distance:0,height:a.y*wa+b.y*wb+c.y*wc};
        }
    }
    let bestDistance=Infinity,bestHeight=0;
    const searchRadius=Math.ceil(profile.blendRadius ?? 1.5)+1;
    for(let rz=cz-searchRadius;rz<=cz+searchRadius;rz++) for(let rx=cx-searchRadius;rx<=cx+searchRadius;rx++) {
        const a=rows[rz]?.[rx];
        if(!Number.isFinite(a)) continue;
        for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) {
            const b=rows[rz+dz]?.[rx+dx];
            if(!Number.isFinite(b)) continue;
            const length=dx*dx+dz*dz;
            const t=length?Math.max(0,Math.min(1,((x-rx)*dx+(z-rz)*dz)/length)):0;
            const distance=Math.hypot(x-rx-t*dx,z-rz-t*dz);
            if(distance<bestDistance) {bestDistance=distance;bestHeight=a+(b-a)*t;}
        }
    }
    return bestDistance<(profile.blendRadius ?? 1.5)?{height:bestHeight,distance:bestDistance}:null;
}
