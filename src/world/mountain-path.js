// Regulariza la subida según distancia recorrida por el camino pintado.
export function smoothMountainPath(floorMap, heights, mountainMask, summitHeight) {
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
    if(!Number.isFinite(climbLength)||climbLength<=0) return;
    // Perfil natural del trazado, con el aumento de altura del 15% solicitado.
    const adjustedHeight=Math.min(summitHeight,(1+climbLength*0.65*0.95)*1.15);
    const scale=(adjustedHeight-1)/(summitHeight-1);
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(mountainMask[z][x]) heights[z][x]=1+(heights[z][x]-1)*scale;
    }
    summitHeight=adjustedHeight;
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
    if(!profile) return null;
    const rows=profile.surface,cx=Math.round(x),cz=Math.round(z);
    if(!profile.nearby[cz]?.[cx]) return null;
    let bestDistance=Infinity,bestHeight=0;
    for(let rz=cz-2;rz<=cz+2;rz++) for(let rx=cx-2;rx<=cx+2;rx++) {
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
    return bestDistance<1.5?{height:bestHeight,distance:bestDistance}:null;
}
