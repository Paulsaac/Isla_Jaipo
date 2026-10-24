import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Lámpara de taller articulada: metal envejecido, pantalla esmaltada y luz dirigida.
export function createWorkshopLamp(THREE) {
    const group=new THREE.Group();group.name='wizard-articulated-desk-lamp';
    group.userData={type:'WORKSHOP_LAMP',isOn:true};
    const iron=new THREE.MeshPhongMaterial({color:0x414341,shininess:24,flatShading:true});
    const brass=new THREE.MeshPhongMaterial({color:0x9a8058,shininess:36,flatShading:true});
    const enamel=new THREE.MeshPhongMaterial({color:0xc7c3ad,shininess:18,side:THREE.DoubleSide,flatShading:true});
    const rubber=new THREE.MeshPhongMaterial({color:0x182025,shininess:3});
    const batches=new Map();
    function add(geometry,material,position=[0,0,0]) {
        geometry.translate(...position);const pieces=batches.get(material)??[];
        pieces.push(geometry);batches.set(material,pieces);
    }
    function rod(a,b,r,material=iron) {
        const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
        const geometry=new THREE.CylinderGeometry(r,r,direction.length(),6);
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
        add(geometry,material,start.add(end).multiplyScalar(.5).toArray());
    }
    const base=new THREE.LatheGeometry([[.17,0],[.18,.025],[.16,.045],[.155,.07],[.12,.085],[.09,.14],[.07,.17]]
        .map(([r,y])=>new THREE.Vector2(r,y)),10);
    add(base,iron);
    const joints=[[0,.19,0],[-.18,.48,0],[.15,.81,0]];
    for(let i=1;i<joints.length;i++) {
        rod(joints[i-1],joints[i],.022);
        rod(joints[i-1].map((v,j)=>v+(j===2?.04:0)),joints[i].map((v,j)=>v+(j===2?.04:0)),.009,brass);
    }
    rod(joints[2],[.35,.82,-.07],.023);
    for(const [x,y,z]of joints) {
        const hinge=new THREE.CylinderGeometry(.045,.045,.09,8);hinge.rotateX(Math.PI/2);add(hinge,brass,[x,y,z]);
        const wheel=new THREE.TorusGeometry(.055,.008,4,8);add(wheel,iron,[x,y,z-.057]);
        for(let i=0;i<4;i++) {
            const angle=i*Math.PI/2;
            rod([x,y,z-.057],[x+Math.cos(angle)*.055,y+Math.sin(angle)*.055,z-.057],.006,brass);
        }
    }
    add(new THREE.CylinderGeometry(.047,.04,.09,8),brass,[.35,.82,-.07]);
    add(new THREE.CylinderGeometry(.065,.22,.13,10,1,true),enamel,[.35,.715,-.07]);
    const rim=new THREE.TorusGeometry(.22,.008,4,10);rim.rotateX(Math.PI/2);add(rim,enamel,[.35,.65,-.07]);
    add(new THREE.CylinderGeometry(.023,.025,.055,8),brass,[.35,.70,-.07]);
    const switchGeometry=new THREE.CylinderGeometry(.025,.025,.045,8);switchGeometry.rotateX(Math.PI/2);
    add(switchGeometry,brass,[-.10,.085,-.125]);
    const cord=new THREE.CatmullRomCurve3([[.35,.86,-.07],[.28,.94,-.03],[.17,.88,.025],
        [-.13,.50,.045],[.01,.17,.05],[.08,.05,.18],[.15,-.15,.35],[.12,-.77,.38],[.22,-.975,.45]]
        .map(p=>new THREE.Vector3(...p)));
    add(new THREE.TubeGeometry(cord,36,.008,4,false),rubber);
    for(const [material,pieces]of batches) {
        const mesh=new THREE.Mesh(mergeGeometries(pieces,false),material);
        mesh.name='wizard-desk-lamp-'+(material===enamel?'shade':material===rubber?'cord':'metal');
        mesh.userData.type='WORKSHOP_LAMP';group.add(mesh);pieces.forEach(g=>g.dispose());
    }
    const bulbMaterial=new THREE.MeshPhongMaterial({color:0xffd09a,emissive:0xffb35b,emissiveIntensity:.9,shininess:35});
    const bulb=new THREE.Mesh(new THREE.IcosahedronGeometry(.042,1),bulbMaterial);
    bulb.name='wizard-desk-lamp-bulb';bulb.scale.y=1.4;bulb.position.set(.35,.62,-.07);
    bulb.userData.type='WORKSHOP_LAMP';group.add(bulb);
    const light=new THREE.SpotLight(0xffd5a0,3.2,3,Math.PI/3,.65,2);
    light.name='wizard-desk-lamp-downlight';light.position.set(.35,.61,-.07);
    light.target.position.set(.37,-.05,-.10);group.add(light,light.target);
    return {group,light,toggle(){
        const on=group.userData.isOn=!group.userData.isOn;
        light.intensity=on?3.2:0;bulbMaterial.emissiveIntensity=on?.9:0;
        bulbMaterial.color.setHex(on?0xffd09a:0x87735b);return on;
    }};
}
