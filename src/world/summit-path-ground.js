// Distancia a la curva del camino: contorno continuo, no pintura por celdas.
// Dos canales estáticos de2MiB: distancia y cobertura del suelo, sin geometría adicional.
export function createSummitPathGround(THREE,route,unitSize,bounds,webGL2=true,dirtRoutes=[]) {
    const size=1024,range=4,reach=6.4;
    const width=bounds.z-bounds.x,depth=bounds.w-bounds.y;
    const stepX=width/size,stepZ=depth/size;
    const distances=new Float32Array(size*size).fill(Infinity);
    const paths=[route,...dirtRoutes].map(points=>points.map(p=>[p.x*unitSize,p.z*unitSize]));
    const points=paths[0];
    // Prolongar la entrada hasta el camino de subida original.
    if(points.length>1&&!dirtRoutes.length) {
        const a=points[0],b=points[1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(length>0)points.unshift([a[0]-(b[0]-a[0])/length*6,a[1]-(b[1]-a[1])/length*6]);
    }
    for(const points of paths)for(let i=1;i<points.length;i++) {
        const [ax,az]=points[i-1],[bx,bz]=points[i],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz;
        if(l2<1e-10)continue;
        const x0=Math.max(0,Math.floor((Math.min(ax,bx)-reach-bounds.x)/stepX));
        const x1=Math.min(size-1,Math.ceil((Math.max(ax,bx)+reach-bounds.x)/stepX));
        const z0=Math.max(0,Math.floor((Math.min(az,bz)-reach-bounds.y)/stepZ));
        const z1=Math.min(size-1,Math.ceil((Math.max(az,bz)+reach-bounds.y)/stepZ));
        for(let row=z0;row<=z1;row++)for(let col=x0;col<=x1;col++) {
            const x=bounds.x+(col+.5)*stepX,z=bounds.y+(row+.5)*stepZ;
            const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2));
            const distance=(x-ax-dx*t)**2+(z-az-dz*t)**2,index=row*size+col;
            if(distance<distances[index])distances[index]=distance;
        }
    }
    const bytes=new Uint8Array(size*size*2);
    const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
    const hash=(x,z)=>{
        let n=Math.imul(x,374761393)^Math.imul(z,668265263);
        n=Math.imul(n^(n>>>13),1274126177);
        return ((n^(n>>>16))>>>0)/4294967295;
    };
    const noise=(x,z)=>{
        const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
        const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
        const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);
        return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
    };
    for(let row=0;row<size;row++)for(let col=0;col<size;col++) {
        const index=row*size+col;if(!Number.isFinite(distances[index]))continue;
        const x=bounds.x+(col+.5)*stepX,z=bounds.y+(row+.5)*stepZ;
        // Ondulaciones de distintas escalas, sin cuadrícula ni ruido de píxeles.
        const halfWidth=1.65+Math.sin(x*.71+z*.27)*.15+Math.sin(z*1.13-x*.43)*.10+Math.sin(x*2.07+z*1.59)*.07;
        // La distancia sigue definiendo el repintado; la cobertura erosiona su interior.
        const edgeDistance=halfWidth-Math.sqrt(distances[index]);
        const signed=edgeDistance;
        bytes[index*2]=Math.round(Math.max(0,Math.min(1,.5+signed/(range*2)))*255);
        {
            // Tierra porosa bajo las losas: manchas continuas de varias escalas,
            // con huecos de nieve y contorno deshilachado, sin trama por celdas.
            const broad=noise(x*1.4,z*1.4);
            const fine=noise(x*4.8+19.3,z*4.8-7.1);
            const grain=noise(x*11.5-31.7,z*11.5+13.9);
            const pores=smooth(.32,.66,broad*.56+fine*.29+grain*.15);
            const raggedEdge=edgeDistance+(broad-.5)*.55+(fine-.5)*.28;
            const opacity=smooth(-.25,.8,raggedEdge)*pores;
            bytes[index*2+1]=Math.round(opacity*255);
        }
    }
    const texture=new THREE.DataTexture(bytes,size,size,webGL2?THREE.RGFormat:THREE.LuminanceAlphaFormat);
    texture.name='summit-continuous-irregular-ground';
    texture.minFilter=texture.magFilter=THREE.LinearFilter;
    texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
    texture.generateMipmaps=false;texture.needsUpdate=true;
    return texture;
}
