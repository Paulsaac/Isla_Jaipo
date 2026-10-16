export const CAVE_ENTRY = { x: 28, z: 138 };

// Entrada hacia el norte: giro antihorario de 90° respecto al acceso hacia el este.
export function createCaveEntrance(THREE, unitSize, baseY, rockTexture) {
    const group = new THREE.Group();
    group.name = 'beach-cave-entrance';
    group.position.set(CAVE_ENTRY.x * unitSize, baseY, CAVE_ENTRY.z * unitSize);
    group.rotation.y = 0;
    const material = new THREE.MeshPhongMaterial({map:rockTexture,color:0x777b7c,flatShading:true,shininess:0});
    const solids = [];
    function addRock(x,y,z,sx,sy,sz,rx,ry,rz,side=0) {
        const geometry=new THREE.DodecahedronGeometry(1,0);
        geometry.scale(sx,sy,sz);
        geometry.rotateX(rx);geometry.rotateY(ry);geometry.rotateZ(rz);
        geometry.computeBoundingBox();geometry.computeBoundingSphere();
        // Las siluetas se solapan hacia fuera sin invadir el corredor central.
        if(side<0)x=Math.min(x,-1.65-geometry.boundingBox.max.x);
        if(side>0)x=Math.max(x,1.65-geometry.boundingBox.min.x);
        if(!side)y=Math.max(y,2.9-geometry.boundingBox.min.y);
        const rock=new THREE.Mesh(geometry,material);
        rock.position.set(x,y,z);group.add(rock);solids.push(rock);
    }
    // Bloques grandes de apoyo, cuñas inclinadas y piedras pequeñas entre juntas.
    // Cada lado tiene su propio ritmo para evitar columnas o un arco simétrico.
    const banks=[
        [-2.9,1.1,.3,1.7,1.8,1.6,.16,.3,-.24],
        [-3.4,1.25,-2,2.1,1.65,1.9,-.21,-.4,.19],
        [-2.8,1.35,-4.4,1.65,1.9,1.8,.27,.2,-.14],
        [-2.5,2.8,-.5,1.3,1.1,1.6,.25,-.3,.41],
        [-3.1,3.1,-3.1,1.9,1.25,1.6,-.24,.5,-.32],
        [-4.5,.55,1.3,1.25,.9,1,.3,.45,.28],
        [-3.6,.45,2,1.05,.7,.9,-.17,.8,-.24],
        [-4.7,2,-1.4,1.2,1.3,1.3,.34,-.2,.48],
        [3.1,1.3,.1,1.9,1.9,1.9,-.2,-.25,.29],
        [2.8,1,-2.6,1.5,1.55,1.8,.31,.4,-.2],
        [3.5,1.4,-4.6,2.1,2,1.6,-.15,-.5,.21],
        [2.7,3,-.7,1.4,1.2,1.3,-.28,.6,-.4],
        [3,2.8,-3.3,1.7,1.1,1.7,.18,-.3,.35],
        [4.7,.65,1,1.5,1.05,1.2,-.24,.3,-.33],
        [3.5,.35,2.1,.8,.6,.85,.14,-.7,.19],
        [4.6,2.4,-2.6,1.3,1.25,1.5,-.32,.22,-.28]
    ];
    for(const stone of banks)addRock(...stone,Math.sign(stone[0]));
    const crown=[
        [-.65,4,.1,2.65,1.05,1.55,.12,.16,-.18],
        [1.3,4.25,-.8,2.1,1.2,1.7,-.2,-.25,.27],
        [-1.1,4.6,-2.1,2.4,1.3,1.8,.24,.35,-.25],
        [.8,4.1,-3.5,2.65,1.05,1.9,-.14,-.2,.16],
        [-.4,4.55,-5,2.9,1.3,1.7,.18,.25,-.14],
        [-2,5.1,-.65,1.15,.8,1.05,.26,-.4,.31],
        [.1,5.5,-1.7,1.5,.85,1.25,-.18,.5,-.22],
        [2,5,-3,1.15,.75,1.1,.32,-.22,.4]
    ];
    for(const stone of crown)addRock(...stone);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(3.5,9),new THREE.MeshPhongMaterial({map:rockTexture,color:0x69645b,shininess:0}));
    floor.rotation.x=-Math.PI/2;floor.position.set(0,.025,-1.5);group.add(floor);
    const darkness=new THREE.Mesh(new THREE.PlaneGeometry(3.5,3.6),new THREE.MeshBasicMaterial({color:0x020304,side:THREE.DoubleSide}));
    darkness.position.set(0,1.75,-5.5);group.add(darkness);
    group.updateMatrixWorld(true);
    // La misma transformación gobierna modelo, paso, excavación y retorno.
    const cos=Math.cos(group.rotation.y),sin=Math.sin(group.rotation.y);
    const depth=(x,z)=>-sin*(x-group.position.x)-cos*(z-group.position.z);
    const across=(x,z)=>cos*(x-group.position.x)-sin*(z-group.position.z);
    return {
        group,solids,baseY,
        contains(x,z){return depth(x,z)>=-3.5&&depth(x,z)<=5.5&&Math.abs(across(x,z))<=1.25;},
        triggered(position){return this.contains(position.x,position.z)&&depth(position.x,position.z)>=2.4&&Math.abs(position.y-baseY)<3;},
        returnPosition:group.localToWorld(new THREE.Vector3(0,0,2)),
        carveHeight(x,z,height){
            const d=depth(x,z),a=Math.abs(across(x,z));
            if(d< -4.5||d>6.5||a>2.5)return height;
            const edge=Math.max(THREE.MathUtils.smoothstep(a,1.6,2.5),1-THREE.MathUtils.smoothstep(d,-4.5,-3.5),THREE.MathUtils.smoothstep(d,5.5,6.5));
            return THREE.MathUtils.lerp(baseY,height,edge);
        }
    };
}
