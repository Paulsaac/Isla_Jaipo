// Apliques de madera y cerámica, con ampolleta antigua de pocas caras.
// Se integran en los lotes del interior; cada ampolleta tiene su fuente de luz.
export function addObservatoryWallLamps(THREE,{add,glowRoot,wood,iron,brass,baseHalf,radius}) {
    const ceramic=new THREE.MeshPhongMaterial({color:0xeee2c5,emissive:0xe6d9b6,emissiveIntensity:.10,shininess:12,flatShading:true});
    const bulb=new THREE.MeshPhongMaterial({color:0xeeb15b,emissive:0xffa342,emissiveIntensity:.55,
        specular:0xffdfaa,shininess:85,transparent:true,opacity:.65,depthWrite:false,flatShading:true});
    const filament=new THREE.MeshBasicMaterial({color:0xffedb6,toneMapped:false});
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
    const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);
    gradient.addColorStop(0,'rgba(255,248,220,1)');gradient.addColorStop(.16,'rgba(255,221,153,.95)');
    gradient.addColorStop(.38,'rgba(255,184,88,.5)');gradient.addColorStop(.7,'rgba(255,152,49,.12)');gradient.addColorStop(1,'rgba(255,152,49,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
    const glowMap=new THREE.CanvasTexture(canvas);
    const glow=new THREE.SpriteMaterial({map:glowMap,transparent:true,depthWrite:false,
        blending:THREE.AdditiveBlending,toneMapped:false});
    const core=new THREE.MeshBasicMaterial({color:0xfff2cc,transparent:true,depthWrite:false,
        blending:THREE.AdditiveBlending,toneMapped:false});
    const parts=[];
    function part(g,m,x=0,y=0,z=0){g.translate(x,y,z);parts.push([g,m]);}
    function rod(a,b,r,m){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);
        const g=new THREE.CylinderGeometry(r,r,v.length(),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));
        g.translate(...p.add(q).multiplyScalar(.5).toArray());parts.push([g,m]);}
    // Tabla alta de silueta sencilla, con las dos esquinas superiores recortadas.
    const back=new THREE.Shape();
    back.moveTo(-.12,-.17);back.lineTo(.12,-.17);back.lineTo(.12,.25);
    back.lineTo(.075,.30);back.lineTo(-.075,.30);back.lineTo(-.12,.25);back.closePath();
    // Tabla, brazo y cerámica comparten el mismo centro vertical (Y=.04).
    part(new THREE.ExtrudeGeometry(back,{depth:.07,bevelEnabled:false}),wood,0,-.025,0);
    part(new THREE.BoxGeometry(.095,.085,.23),wood,0,.04,.185);
    part(new THREE.CylinderGeometry(.075,.075,.32,8),ceramic,0,.04,.30);
    // Unión sencilla: el casquillo queda casi enteramente dentro de la cerámica.
    part(new THREE.CylinderGeometry(.045,.05,.025,8),brass,0,.2075,.30);
    // Silueta de vela: vidrio ámbar estrecho y alargado, terminado en punta.
    const profile=[[.04,.215],[.062,.25],[.09,.31],[.10,.38],[.09,.46],
        [.065,.55],[.035,.63],[.013,.675],[0,.69]].map(([r,y])=>new THREE.Vector2(r,y));
    part(new THREE.LatheGeometry(profile,10),bulb,0,0,.30);
    rod([0,.22,.30],[0,.31,.30],.004,iron);
    for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.cos(a)*.027,z=.30+Math.sin(a)*.027;
        rod([x,.32,z],[x,.57,z],.0035,filament);}
    for(const y of [.31,.58])rod([-.035,y,.30],[.035,y,.30],.003,iron);
    const coreGeometry=new THREE.SphereGeometry(1,8,6);coreGeometry.scale(.029,.115,.029);
    part(coreGeometry,core,0,.445,.30);
    const placements=[{x:-baseHalf+.09,y:1.75,z:-2,nx:1,nz:0},{x:baseHalf-.09,y:1.75,z:2,nx:-1,nz:0}];
    for(let i=0;i<4;i++){const a=Math.PI/2+i*Math.PI/2,nx=Math.cos(a),nz=Math.sin(a);
        placements.push({x:nx*(radius-.07),y:5.2,z:nz*(radius-.07),nx:-nx,nz:-nz});}
    for(const p of placements)for(const [geometry,material]of parts){const g=geometry.clone();g.rotateY(Math.atan2(p.nx,p.nz));g.translate(p.x,p.y,p.z);add(g,material);}
    for(const p of placements) {
        const halo=new THREE.Sprite(glow);halo.name='observatory-bulb-core-glow';
        halo.raycast=()=>{};
        halo.position.set(p.x+p.nx*.30,p.y+.445,p.z+p.nz*.30);
        halo.scale.set(.48,.64,1);halo.renderOrder=1;glowRoot.add(halo);
    }
    parts.forEach(([g])=>g.dispose());
    return placements;
}
