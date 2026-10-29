// Losas pixel art colocadas sobre el eje real del camino, en un atlas local.
// El alfa guarda una máscara binaria; la mezcla final siempre es opaca.
export function createSummitPathTexture(THREE, route, unitSize, bounds) {
    const size = 2048, canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(size, size);
    let seed = 73129;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    function put(x, y, color, alpha = 127) {
        if (x < 0 || y < 0 || x >= size || y >= size) return;
        const i = (y * size + x) * 4;
        pixels.data[i] = color[0];pixels.data[i+1] = color[1];pixels.data[i+2] = color[2];pixels.data[i+3] = alpha;
    }
    // El árido se toma del material original del suelo; aquí solo se guarda la máscara.
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=127;
    function polygon(points, color) {
        const minX = Math.max(0, Math.floor(Math.min(...points.map(p => p[0]))));
        const maxX = Math.min(size - 1, Math.ceil(Math.max(...points.map(p => p[0]))));
        const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
        const maxY = Math.min(size - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
        for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
            let inside = false;
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const [ax, ay] = points[i], [bx, by] = points[j];
                if ((ay > y + .5) !== (by > y + .5)
                    && x + .5 < (bx - ax) * (y + .5 - ay) / (by - ay) + ax) inside = !inside;
            }
            if (inside) put(x, y, color, 255);
        }
    }
    const toPixel = ([x,z]) => [Math.round((x-bounds.x)/(bounds.z-bounds.x)*size),
        Math.round((1-(z-bounds.y)/(bounds.w-bounds.y))*size)];
    const points = route.map(p => [p.x*unitSize,p.z*unitSize]), distances = [0];
    for (let i=1;i<points.length;i++) distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
    const total = distances.at(-1), stones = [], bins = new Map();
    function inside([x,z],shape) {
        let result=false;
        for(let i=0,j=shape.length-1;i<shape.length;j=i++) {
            const a=shape[i],b=shape[j];
            if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])result=!result;
        }
        return result;
    }
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    function pointSegmentSquared(p,a,b) {
        const dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
        const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/length)):0;
        return (p[0]-a[0]-dx*t)**2+(p[1]-a[1]-dz*t)**2;
    }
    function tooClose(a,b) {
        if(inside(a[0],b)||inside(b[0],a))return true;
        for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++) {
            const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];
            if(cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0)return true;
            if(Math.min(pointSegmentSquared(p,r,s),pointSegmentSquared(q,r,s),
                pointSegmentSquared(r,p,q),pointSegmentSquared(s,p,q))<.01)return true;
        }
        return false;
    }
    function sample(distance) {
        let i=1;
        while(i<points.length-1 && distances[i]<distance)i++;
        const a=points[i-1],b=points[i],length=distances[i]-distances[i-1],t=(distance-distances[i-1])/length;
        return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/length,dz:(b[1]-a[1])/length};
    }
    const palettes = [
        {face:[[151,143,129],[164,156,142],[139,133,122],[171,164,151]],bevel:[[185,178,163],[128,121,108],[88,84,76]]},
        {face:[[148,148,143],[163,163,157],[134,136,132],[174,173,166]],bevel:[[188,186,177],[123,125,120],[82,87,84]]},
        {face:[[149,137,119],[165,152,133],[137,127,112],[172,161,143]],bevel:[[186,174,153],[125,115,100],[88,81,71]]}
    ];
    // Separar los contornos reales permite agrupar losas largas y anchas sin encimarlas.
    for(let attempt=0;attempt<14000 && stones.length<Math.ceil(total*2.6);attempt++) {
        const p=sample(.65+random()*(total-1.3));
        const across=(random()-.5)*1.4;
        const x=p.x-p.dz*across,z=p.z+p.dx*across;
        const family=Math.floor(random()*4);
        const rx=family===0?.34+random()*.16:family===1?.68+random()*.22:.48+random()*.25;
        const ry=family===0?.76+random()*.24:family===1?.34+random()*.17:.5+random()*.28;
        const count=family===2?4+Math.floor(random()*2):6+Math.floor(random()*4),rotation=random()*Math.PI*2;
        const outer=[];
        for(let i=0;i<count;i++) {
            const a=(i+(random()-.5)*.36)/count*Math.PI*2,radius=(family===3?.56:.76)+random()*(family===3?.44:.24);
            const dx=Math.cos(a)*rx*radius,dz=Math.sin(a)*ry*radius;
            outer.push([x+dx*Math.cos(rotation)-dz*Math.sin(rotation),z+dx*Math.sin(rotation)+dz*Math.cos(rotation)]);
        }
        if(outer.some(v=>Math.abs(-(v[0]-p.x)*p.dz+(v[1]-p.z)*p.dx)>1.22))continue;
        const bx=Math.floor(x/2.5),bz=Math.floor(z/2.5),nearby=[];
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)nearby.push(...(bins.get((bx+dx)+','+(bz+dz))??[]));
        if(nearby.some(shape=>tooClose(outer,shape)))continue;
        const key=bx+','+bz;
        if(!bins.has(key))bins.set(key,[]);
        bins.get(key).push(outer);stones.push(outer);
        const {face:faceColors,bevel:bevelColors}=palettes[Math.floor(random()*palettes.length)];
        const inset=outer.map(([px,pz])=>toPixel([x+(px-x)*.77,z+(pz-z)*.77]));
        const outerPixels=outer.map(toPixel);
        const shade=Math.floor(random()*faceColors.length);
        polygon(outerPixels,bevelColors[2]);
        for(let i=0;i<count;i++) {
            const j=(i+1)%count;
            const light=-(outer[i][0]+outer[j][0]-x*2)*.55-(outer[i][1]+outer[j][1]-z*2)*.83;
            polygon([outerPixels[i],outerPixels[j],inset[j],inset[i]],bevelColors[light>.06?0:light<-.06?2:1]);
        }
        // Una sola cara lisa; la variación de tonos queda exclusivamente en el bisel.
        polygon(inset,faceColors[shade]);
    }
    ctx.putImageData(pixels,0,0);
    const texture=new THREE.CanvasTexture(canvas);
    texture.name='summit-centered-pixel-flagstones';
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
    texture.magFilter=THREE.NearestFilter;
    texture.minFilter=THREE.NearestMipmapNearestFilter;
    texture.anisotropy=1;
    return texture;
}
