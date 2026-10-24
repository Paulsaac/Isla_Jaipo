// Arpillera blanda, aplastada sobre el suelo y vencida hacia la pared (+Z).
let weaveTexture;
function getWeave(THREE) {
    if(weaveTexture)return weaveTexture;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const context=canvas.getContext('2d');
    context.fillStyle='#c5b18b';context.fillRect(0,0,64,64);
    for(let y=0;y<64;y++)for(let x=0;x<64;x++) {
        const grain=((x*37+y*17+x*y*13)%19)-9;
        const thread=(x%4===0?-23:x%4===1?10:0)+(y%4===0?-18:y%4===1?12:0);
        const c=180+grain+thread;
        context.fillStyle=`rgb(${c+18},${c+5},${c-20})`;context.fillRect(x,y,1,1);
    }
    weaveTexture=new THREE.CanvasTexture(canvas);
    weaveTexture.colorSpace=THREE.SRGBColorSpace;
    weaveTexture.wrapS=weaveTexture.wrapT=THREE.RepeatWrapping;
    weaveTexture.repeat.set(3,1.5);
    weaveTexture.magFilter=THREE.NearestFilter;
    return weaveTexture;
}

export function createBurlapSack(THREE, { open=false }={}) {
    // El contorno abierto vuelve por dentro del saco: la boca tiene espesor,
    // un dobladillo irregular y un fondo interior, en lugar de una tapa plana.
    const rings=open
        ? [[0,0],[.46,.015],[.56,.12],[.51,.25],[.44,.33],[.53,.46],[.47,.61],
            [.57,.68],[.53,.73],[.46,.68],[.43,.59],[.35,.43],[0,.40]]
        : [[0,0],[.46,.015],[.60,.10],[.58,.25],[.49,.38],[.43,.51],
            [.28,.61],[.105,.69],[.11,.74],[.19,.79],[.12,.82],[0,.81]];
    const segments=20,positions=[],uv=[],colors=[],indices=[];
    const center=y=>({x:(open?-.10:.16)*(y/.82)**2,z:(open?.23:.33)*(y/.82)**2});
    for(let j=0;j<rings.length;j++)for(let i=0;i<=segments;i++) {
        const [radius,y]=rings[j],a=i/segments*Math.PI*2,c=center(y);
        const fold=1+.075*Math.sin(a*3+y*17)+.045*Math.cos(a*7-y*13);
        const hem=y>.58?.026*Math.sin(a*3+.6)+.016*Math.cos(a*5):0;
        positions.push(c.x+Math.cos(a)*radius*fold,Math.max(0,y+hem),c.z+Math.sin(a)*radius*fold*.76);
        uv.push(i/segments,j/(rings.length-1));
        const shade=open&&j>=9?(j===9?.8:.48):1;colors.push(shade,shade,shade);
        if(j&&i){const k=j*(segments+1)+i;indices.push(k-1,k-segments-1,k-segments-2,k-1,k,k-segments-1);}
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();
    const sack=new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({map:getWeave(THREE),
        color:open?0xc5b18b:0xa88d66,vertexColors:true,shininess:0,side:THREE.DoubleSide}));
    if(open) {
        const potatoes=[[-.20,.55,-.05,.12],[.05,.56,.03,.14],[.23,.54,.12,.11],[-.09,.55,.22,.12],[.11,.58,-.12,.13]];
        for(const [index,[x,y,z,r]] of potatoes.entries()) {
            const geometry=new THREE.IcosahedronGeometry(r,2),p=geometry.attributes.position;
            for(let i=0;i<p.count;i++) {
                const nx=p.getX(i)/r,ny=p.getY(i)/r,nz=p.getZ(i)/r;
                const bulge=1+.13*Math.sin(nx*4+index*1.7)*Math.cos(nz*3-ny*2)
                    +.07*Math.sin(ny*6+nz*4+index);
                p.setXYZ(i,r*(nx*bulge+.11*ny*ny),r*ny*bulge,r*(nz*bulge+.06*nx*ny));
            }
            geometry.computeVertexNormals();
            const potato=new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({color:[0xb5995d,0xaa8a51,0xc1a46b,0xb69760,0xa58b58][index],shininess:0}));
            potato.position.set(x,y,z+.07);
            potato.scale.set([1.13,.88,1.04,.91,1.1][index],.77+index*.025,[.91,1.15,.94,1.04,.87][index]);
            potato.rotation.set(index*.31,index*.83,index*.23);sack.add(potato);
        }
    }else {
        const cordMaterial=new THREE.MeshPhongMaterial({color:0x51402a,shininess:0});
        const cord=new THREE.Mesh(new THREE.TorusGeometry(.11,.016,4,20),cordMaterial);
        const c=center(.71);cord.rotation.x=Math.PI/2;cord.position.set(c.x,.71,c.z);sack.add(cord);
        const tie=new THREE.Mesh(new THREE.TorusGeometry(.043,.011,3,12),cordMaterial);
        tie.position.set(c.x-.10,.69,c.z-.05);tie.rotation.y=.7;sack.add(tie);
    }
    return sack;
}
