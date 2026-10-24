// Formas y paletas de pino1/2, alamo1/2 y araucaria1/2 de imagenes/Sprites/arboles.
// Cada variante comparte una sola geometría y un material con todas sus instancias.
const PALETTES = [
    [0x06552d,0x0c702e,0x0c9e32,0x453628],
    [0x06552d,0x0c702e,0x0c9e32,0x473729],
    [0x4e6738,0x76934f,0x76934f,0x644e2a],
    [0x4a682b,0x71943c,0x71943c,0x674d1b],
    [0x17431f,0x1c5323,0x206f25,0x3c302b],
    [0x043a1f,0x084d20,0x086d22,0x33281e]
];

function treeGeometry(THREE, variant) {
    const parts = [], palette = PALETTES[variant].map(hex=>new THREE.Color(hex));
    function add(geometry, wood, transform) {
        transform?.(geometry);
        const flat = geometry.index ? geometry.toNonIndexed() : geometry;
        if (flat !== geometry) geometry.dispose();
        const colors = new Float32Array(flat.attributes.position.count * 3);
        for (let i = 0; i < flat.attributes.position.count; i += 3) {
            const color = palette[wood ? 3 : (Math.floor(i / 3) * 7 + parts.length) % 3];
            for (let j = 0; j < 3; j++) color.toArray(colors,(i+j)*3);
        }
        flat.setAttribute('color',new THREE.BufferAttribute(colors,3));
        parts.push(flat);
    }
    function branch(x,y,z,tipX,tipY,tipZ,radius=.045) {
        const start = new THREE.Vector3(x,y,z), end = new THREE.Vector3(tipX,tipY,tipZ);
        const geometry = new THREE.CylinderGeometry(radius*.55,radius,start.distanceTo(end),4);
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize()));
        geometry.translate((x+tipX)/2,(y+tipY)/2,(z+tipZ)/2);add(geometry,true);
    }
    const species = Math.floor(variant / 2), second = variant % 2;
    const trunkHeight = species === 2 ? 9 : species === 1 ? 7 : 9.4;
    add(new THREE.CylinderGeometry(.09,.24,trunkHeight,5),true,g=>g.translate(0,trunkHeight/2,0));
    for (let i = 0; i < 4; i++) {
        const angle = i*Math.PI/2+.3;
        branch(0,.55,0,Math.cos(angle)*.48,0,Math.sin(angle)*.48,.1);
    }
    if (species === 0) {
        // Pino: tronco fino visible entre ocho pisos de ramas, copa estrechándose hacia la punta.
        for (let i = 0; i < 8; i++) {
            const radius = (2.2-i*.25)*(second ? 1.04 : 1);
            const height = .75+i*.035;
            add(new THREE.ConeGeometry(radius,height,7),false,g=>{
                g.rotateY(i*.7+second*.4);g.scale(1,1,.88);g.translate(0,1.75+i*1.05+height/2,0);
            });
        }
        add(new THREE.ConeGeometry(.4,1.15,6),false,g=>g.translate(0,9.4,0));
    } else if (species === 1) {
        // Álamo: silueta alargada, punta fina y follaje verde amarillento.
        const profile = [[0,1.6],[.48,2.2],[.83,3.8],[1.1,5.8],[.94,7.4],[.59,9.1],[.15,10.3],[0,10.6]];
        add(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),7),false,g=>{
            g.scale(second ? .9 : 1,1,.85);g.rotateY(second*.5);
        });
    } else {
        // Araucaria: grandes espacios de tronco, ramas horizontales y copa superior de paraguas.
        for (const [y,radius] of [[3.9,1.35],[6.2,1.7],[8.8,second ? 2.95 : 2.7]]) {
            for (let i = 0; i < 6; i++) {
                const angle = i*Math.PI/3+y;
                branch(0,y-.25,0,Math.cos(angle)*radius*.92,y+.05,Math.sin(angle)*radius*.92);
            }
            add(new THREE.SphereGeometry(1,8,4),false,g=>{
                g.scale(radius,y>8 ? .62 : .3,radius*.86);g.translate(0,y+.25,0);
            });
        }
    }
    const result = new THREE.BufferGeometry();
    for (const name of ['position','normal','color']) {
        const values = new Float32Array(parts.reduce((sum,g)=>sum+g.attributes[name].array.length,0));
        let offset = 0;
        for (const part of parts) { values.set(part.attributes[name].array,offset);offset+=part.attributes[name].array.length; }
        result.setAttribute(name,new THREE.BufferAttribute(values,3));
    }
    parts.forEach(g=>g.dispose());
    result.computeBoundingSphere();
    return result;
}

export function createPreviewTrees(THREE, trees) {
    const variants = Array.from({length:6},()=>[]);
    for (let i = 0; i < trees.length; i += 4) {
        const x=trees[i],z=trees[i+2],choice=(Math.round(x)*31+Math.round(z)*17)%100;
        const variant=choice<35?0:choice<70?1:choice<83?2:choice<95?3:choice<98?4:5;
        variants[variant].push(i);
    }
    const group = new THREE.Group(), dummy = new THREE.Object3D();
    const material = new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
    for (let variant = 0; variant < variants.length; variant++) {
        const indices = variants[variant];
        if (!indices.length) continue;
        const mesh = new THREE.InstancedMesh(treeGeometry(THREE,variant),material,indices.length);
        mesh.name=['pino1','pino2','alamo1','alamo2','araucaria1','araucaria2'][variant];
        indices.forEach((index,instance)=>{
            const [x,y,z,scale]=trees.subarray(index,index+4);
            dummy.position.set(x,y,z);dummy.scale.setScalar(scale);
            dummy.rotation.set(0,((x*13+z*7)%360)*Math.PI/180,0);dummy.updateMatrix();
            mesh.setMatrixAt(instance,dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate=true;
        group.add(mesh);
    }
    return {group,dispose(){group.children.forEach(mesh=>mesh.geometry.dispose());material.dispose();}};
}
