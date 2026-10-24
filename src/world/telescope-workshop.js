import {createDeskGeometry} from './desk-geometry.js';
import {createOpalLens} from './opal-lens.js';
import {createWorkshopBook} from './workshop-book.js';
import {createWorkshopLamp} from './workshop-lamp.js';

// Escritorio de reparación en la casa de la cima. El progreso lo decide game.js.
export function createTelescopeWorkshop(THREE,woodTexture) {
    const scale=0.9, geometry=createDeskGeometry(THREE);
    geometry.scale(scale,scale,scale);geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const desk=new THREE.Mesh(geometry,[
        new THREE.MeshPhongMaterial({map:woodTexture,color:0x8b694c,shininess:0}),
        new THREE.MeshPhongMaterial({color:0x514c49,shininess:14})
    ]);
    desk.name='mountain-wizard-lens-desk';
    desk.userData={type:'TELESCOPE_WORKBENCH',id:desk.name};
    const pieces=[];
    function add(source,color,x,y,z,rz=0) {
        const part=source.index ? source.toNonIndexed() : source;
        if(part!==source)source.dispose();
        part.rotateZ(rz);part.translate(x,y,z);part.scale(scale,scale,scale);
        const tint=new THREE.Color(color),colors=new Float32Array(part.attributes.position.count*3);
        for(let i=0;i<colors.length;i+=3)colors.set([tint.r,tint.g,tint.b],i);
        part.setAttribute('color',new THREE.BufferAttribute(colors,3));pieces.push(part);
    }
    // Martillo de uña pequeño: mango torneado de ocho caras y cara de golpe redonda.
    const grip=new THREE.LatheGeometry([
        new THREE.Vector2(0,-0.17),new THREE.Vector2(0.028,-0.17),
        new THREE.Vector2(0.032,-0.15),new THREE.Vector2(0.028,0.02),
        new THREE.Vector2(0.024,0.14),new THREE.Vector2(0.021,0.17),new THREE.Vector2(0,0.17)
    ],8);
    grip.rotateX(Math.PI/2);
    add(grip,0xb38a56,0.65,1.14,0.025);
    add(new THREE.BoxGeometry(0.082,0.065,0.105),0x7b8385,0.65,1.15,-0.16);
    const neck=new THREE.CylinderGeometry(0.020,0.027,0.075,8);
    neck.rotateZ(Math.PI/2);add(neck,0x858d90,0.575,1.15,-0.17);
    const face=new THREE.CylinderGeometry(0.034,0.034,0.032,8);
    face.rotateZ(Math.PI/2);add(face,0xadb4b6,0.523,1.15,-0.17);
    // Dos uñas curvas, resueltas con pocos segmentos y una ranura entre ellas.
    const claw=new THREE.Shape();
    claw.moveTo(0.025,-0.045);claw.lineTo(0.080,-0.032);claw.lineTo(0.13,0.002);
    claw.lineTo(0.17,0.052);claw.lineTo(0.19,0.092);claw.lineTo(0.172,0.080);
    claw.lineTo(0.115,0.030);claw.lineTo(0.072,0.010);claw.lineTo(0.025,0.018);claw.closePath();
    for(const height of [1.145,1.175]) {
        const prong=new THREE.ExtrudeGeometry(claw,{depth:0.018,bevelEnabled:false,steps:1});
        prong.rotateX(Math.PI/2);add(prong,0x858d90,0.65,height,-0.17);
    }
    // Apoyar el martillo entero sobre el tablero sin dejarlo flotando.
    for(const part of pieces)part.computeBoundingBox();
    const hammerBottom=Math.min(...pieces.map(part=>part.boundingBox.min.y));
    for(const part of pieces)part.translate(0,1.10*scale-hammerBottom+0.001,0);
    // Cinco clavos pequeños, separados sobre el tablero.
    for(const [x,z,angle] of [[0.12,0.22,0.25],[0.24,0.12,-0.6],[0.29,0.31,0.4],[0.07,0.02,-0.3],[0.4,0.18,0.85]]) {
        const nail=new THREE.CylinderGeometry(0.008,0.003,0.13,5);
        nail.rotateX(Math.PI/2);nail.rotateY(angle);
        add(nail,0xa3afb4,x,1.118,z);
        const head=new THREE.CylinderGeometry(0.019,0.019,0.008,6);
        head.rotateX(Math.PI/2);head.rotateY(angle);
        add(head,0x7d8b94,x-Math.sin(angle)*0.065,1.118,z-Math.cos(angle)*0.065);
    }
    // Aro vacío y apoyos, para que la lente no se funda visualmente con la madera.
    const holder=new THREE.TorusGeometry(0.11,0.008,4,12);
    holder.rotateX(Math.PI/2);
    add(holder,0x9b895e,-0.78,1.13,-0.04);
    for(const x of [-0.88,-0.68])add(new THREE.BoxGeometry(0.027,0.03,0.05),0x38444b,x,1.1225,-0.04);
    const toolsGeometry=new THREE.BufferGeometry();
    for(const name of ['position','normal','color']) {
        const data=new Float32Array(pieces.reduce((n,p)=>n+p.attributes[name].array.length,0));
        let offset=0;for(const part of pieces){data.set(part.attributes[name].array,offset);offset+=part.attributes[name].array.length;}
        toolsGeometry.setAttribute(name,new THREE.BufferAttribute(data,3));
    }
    pieces.forEach(p=>p.dispose());toolsGeometry.computeBoundingSphere();
    const tools=new THREE.Mesh(toolsGeometry,new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:12}));
    tools.name='wizard-hammer-and-nails';tools.userData.type='TELESCOPE_WORKBENCH';desk.add(tools);
    const lens=createOpalLens(THREE,0.09,0.012);
    lens.position.set(-0.78*scale,1.15*scale,-0.04*scale);
    lens.rotation.set(-Math.PI/2+0.12,0,0);
    lens.userData.type='TELESCOPE_WORKBENCH';desk.add(lens);
    // Zona pequeña de selección alrededor de la lente, independiente de la mesa.
    const lensTarget=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.08,12),
        new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,fog:false}));
    lensTarget.name='bifrost-lens-interaction';lensTarget.position.copy(lens.position);
    lensTarget.userData={type:'TELESCOPE_WORKBENCH',visibilityEnabled:true};
    lensTarget.raycast=function(raycaster,hits){
        if(this.userData.visibilityEnabled)THREE.Mesh.prototype.raycast.call(this,raycaster,hits);
    };
    desk.add(lensTarget);
    const manuscript=createWorkshopBook(THREE);manuscript.scale.setScalar(scale);desk.add(manuscript);
    const lamp=createWorkshopLamp(THREE);lamp.group.position.set(-1.25*scale,1.10*scale,.23);
    desk.add(lamp.group);
    return {desk,lens,lensTarget,lamp,installLens(){
        lens.visible=false;lens.userData.visibilityEnabled=false;
        lensTarget.userData.visibilityEnabled=false;
    }};
}
