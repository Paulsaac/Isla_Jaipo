// Abre el río pintado de la maqueta guardada, sin reinterpretar las capas del juego.
export function carvePreviewRiver(model) {
    const {positions,colors,indices,roofs}=model;
    const candidates=new Map(),key=(x,z)=>`${x},${z}`;
    for(let i=0;i<positions.length;i+=3) {
        const [r,g,b]=colors.subarray(i,i+3);
        if(positions[i+1]<2.5 && b>r*1.35 && b>g*1.15) {
            const x=positions[i],z=positions[i+2];candidates.set(key(x,z),[x,z]);
        }
    }
    const seeds=[];
    while(candidates.size) {
        const first=candidates.values().next().value,component=[first];
        candidates.delete(key(...first));
        let minX=first[0],maxX=minX,minZ=first[1],maxZ=minZ;
        for(let i=0;i<component.length;i++) {
            const [x,z]=component[i];minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
            for(const dx of [-2,0,2])for(const dz of [-2,0,2]) {
                const id=key(x+dx,z+dz),next=candidates.get(id);
                if(next){candidates.delete(id);component.push(next);}
            }
        }
        // No convertir pequeñas manchas azules aisladas en nuevos lagos.
        if(component.length>=12 && Math.max(maxX-minX,maxZ-minZ)>=20)seeds.push(...component);
    }
    if(!seeds.length)return model;
    // El suavizado de la costa guardada puede dejar una franja de tierra entre
    // el último píxel azul y el agua. Prolongar ambos extremos hasta la orilla real.
    const axis=Math.max(...seeds.map(p=>p[0]))-Math.min(...seeds.map(p=>p[0]))
        >=Math.max(...seeds.map(p=>p[1]))-Math.min(...seeds.map(p=>p[1]))?0:1;
    const ends=[seeds.reduce((a,b)=>a[axis]<b[axis]?a:b),seeds.reduce((a,b)=>a[axis]>b[axis]?a:b)];
    const edges=new Map();
    for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++) {
        const a=indices[i+j],b=indices[i+(j+1)%3],id=a<b?`${a},${b}`:`${b},${a}`;
        const edge=edges.get(id);
        if(edge)edge.count++;else edges.set(id,{a,b,count:1});
    }
    const mouths=[];
    for(const [x,z] of ends) {
        let distance=Infinity,shorePoint;
        for(const {a,b,count} of edges.values()) {
            if(count!==1)continue;
            const ax=positions[a*3],az=positions[a*3+2],dx=positions[b*3]-ax,dz=positions[b*3+2]-az;
            const length=dx*dx+dz*dz;if(!length)continue;
            const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/length));
            const px=ax+t*dx,pz=az+t*dz,d=Math.hypot(px-x,pz-z);
            if(d<distance){distance=d;shorePoint=[px,pz];}
        }
        if(!shorePoint || distance<.001 || distance>Math.max(model.width,model.depth)*.08)continue;
        const span=distance+3,dx=(shorePoint[0]-x)/distance,dz=(shorePoint[1]-z)/distance;
        for(let step=1;step<=Math.ceil(span);step++) {
            const offset=Math.min(step,span);seeds.push([x+dx*offset,z+dz*offset]);
        }
        mouths.push({from:[x,z],to:[x+dx*span,z+dz*span]});
    }
    const radius=4.5,buckets=new Map();
    for(const point of seeds) {
        const id=key(Math.floor(point[0]/radius),Math.floor(point[1]/radius));
        if(!buckets.has(id))buckets.set(id,[]);
        buckets.get(id).push(point);
    }
    function influence(x,z) {
        // Conservar los apoyos y el paso cubierto que cruza el río.
        for(let i=0;i<roofs.length;i+=5)if(x>=roofs[i] && x<=roofs[i]+roofs[i+2]
            && z>=roofs[i+1] && z<=roofs[i+1]+roofs[i+3])return 0;
        const gx=Math.floor(x/radius),gz=Math.floor(z/radius);let distance=radius;
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)
            for(const [px,pz] of buckets.get(key(gx+dx,gz+dz))||[])distance=Math.min(distance,Math.hypot(px-x,pz-z));
        const t=Math.max(0,Math.min(1,(distance-1)/(radius-1)));
        return 1-t*t*(3-2*t);
    }
    const carved=Array.from(positions),tints=Array.from(colors),bank=[78,55,27];
    let lowered=0;
    for(let i=0;i<carved.length;i+=3) {
        const amount=influence(carved[i],carved[i+2]);if(!amount)continue;
        carved[i+1]-=3.2*amount;lowered++;
        for(let channel=0;channel<3;channel++)tints[i+channel]=Math.round(tints[i+channel]*(1-amount)+bank[channel]*amount);
    }
    // Recortar el terreno bajo Y=0 deja visible el mismo plano de agua del mar y el lago.
    // Compartir los cruces evita grietas y no requiere otro material ni otra pasada de render.
    const shoreEdges=new Map(),clipped=[];
    function shore(a,b) {
        const id=a<b?`${a},${b}`:`${b},${a}`;
        if(shoreEdges.has(id))return shoreEdges.get(id);
        const t=-carved[a*3+1]/(carved[b*3+1]-carved[a*3+1]),vertex=carved.length/3;
        for(let axis=0;axis<3;axis++) {
            carved.push(axis===1?0:carved[a*3+axis]+(carved[b*3+axis]-carved[a*3+axis])*t);
            tints.push(Math.round(tints[a*3+axis]+(tints[b*3+axis]-tints[a*3+axis])*t));
        }
        shoreEdges.set(id,vertex);return vertex;
    }
    for(let i=0;i<indices.length;i+=3) {
        const triangle=[indices[i],indices[i+1],indices[i+2]],polygon=[];
        for(let j=0;j<3;j++) {
            const a=triangle[j],b=triangle[(j+1)%3],above=carved[a*3+1]>=0,nextAbove=carved[b*3+1]>=0;
            if(above)polygon.push(a);
            if(above!==nextAbove)polygon.push(shore(a,b));
        }
        for(let j=1;j<polygon.length-1;j++)clipped.push(polygon[0],polygon[j],polygon[j+1]);
    }
    const trees=[];
    for(let i=0;i<model.trees.length;i+=4) {
        const [x,y,z,scale]=model.trees.subarray(i,i+4),height=y-3.2*influence(x,z);
        if(height>.2)trees.push(x,height,z,scale);
    }
    return {...model,positions:new Float32Array(carved),colors:new Uint8Array(tints),indices:new Uint32Array(clipped),
        trees:new Float32Array(trees),river:{seeds:seeds.length,loweredVertices:lowered,shoreVertices:shoreEdges.size,mouths}};
}
