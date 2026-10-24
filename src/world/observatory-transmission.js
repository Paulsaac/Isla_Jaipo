import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Transmisión fija: corona exterior, dos ruedas y árbol vertical hasta la caja inferior.
export function createObservatoryTransmission(THREE,{iron,brass,level,collisionRadius}) {
    const group=new THREE.Group();group.name='observatory-floor-transmission';
    const pitch=1.04/72,ringRadius=1.04,smallRadius=pitch*16,largeRadius=pitch*32;
    const y=level+.085,smallX=ringRadius+smallRadius,shaftX=smallX+smallRadius+largeRadius;
    function box(w,h,d,x,y,z,material=iron,parent=group){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
    function cylinder(r,h,x,y,z,material=brass,parent=group){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
    function gear(radius,teeth,x,y,z,horizontal=true,name='transmission-gear') {
        const shape=new THREE.Shape(),root=radius-.025,tip=radius+.025;
        for(let i=0;i<teeth;i++)for(const [t,r]of [[0,root],[.18,root],[.28,tip],[.68,tip],[.78,root]]) {
            const a=(i+t)*Math.PI*2/teeth,px=Math.sin(a)*r,py=Math.cos(a)*r;
            if(i===0&&t===0)shape.moveTo(px,py);else shape.lineTo(px,py);
        }
        shape.closePath();const hole=new THREE.Path();hole.absarc(0,0,radius*.66,0,Math.PI*2,true);shape.holes.push(hole);
        const g=new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:false,curveSegments:24});g.translate(0,0,-.04);
        const rotor=new THREE.Group();rotor.name=name;rotor.position.set(x,y,z);if(horizontal)rotor.rotation.x=-Math.PI/2;
        rotor.add(new THREE.Mesh(g,brass));
        const hub=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.12,8),iron);hub.rotation.x=Math.PI/2;rotor.add(hub);
        for(let i=0;i<4;i++){const spoke=box(radius*1.40,.045,.065,0,0,0,iron,rotor);spoke.rotation.z=i*Math.PI/4;}
        group.add(rotor);return rotor;
    }
    const crown=new THREE.Group();crown.name='omniscopio-external-toothed-crown';crown.position.y=y;group.add(crown);
    for(let i=0;i<72;i++) {
        const a=i*Math.PI/36,tooth=box(.037,.09,.075,Math.sin(a)*ringRadius,0,Math.cos(a)*ringRadius,brass,crown);tooth.rotation.y=a;
    }
    const teeth=crown.children.map(tooth=>{tooth.updateMatrix();return tooth.geometry.applyMatrix4(tooth.matrix);});
    crown.clear();crown.add(new THREE.Mesh(mergeGeometries(teeth,false),brass));teeth.forEach(g=>g.dispose());
    const small=gear(smallRadius,16,smallX,y,0,true,'omniscopio-transfer-pinion');
    const large=gear(largeRadius,32,shaftX,y,0,true,'omniscopio-large-drive-gear');
    // Pedestales bajos y puentes de cojinete: dejan visibles las ruedas y sus dientes.
    for(const x of [smallX,shaftX]) {
        cylinder(.08,.22,x,level+.06,0,iron);
        for(const z of [-.27,.27])box(.18,.06,.12,x,level+.03,z);
        box(.09,.07,.60,x,level-.01,0);
    }
    const shaft=cylinder(.055,level+.23-.82,shaftX,(level+.23+.82)/2,0,brass);shaft.name='omniscopio-through-floor-shaft';
    for(const height of [level-.10,level+.16,1.03]) {
        const bearing=cylinder(.10,.10,shaftX,height,0,iron);bearing.name='omniscopio-shaft-bearing';
    }
    // Caja abierta por delante y arriba; engranes internos y transmisión en ángulo visibles.
    const cabinet=new THREE.Group();cabinet.name='observatory-lower-gearbox';cabinet.position.set(shaftX,0,0);group.add(cabinet);
    box(1.44,.10,.94,0,.10,.08,iron,cabinet);
    box(1.44,.88,.07,0,.57,-.36,iron,cabinet);
    for(const x of [-.68,.68]) {
        box(.07,.88,.87,x,.57,.08,iron,cabinet);
        box(.10,.12,.16,x,.05,-.22,brass,cabinet);box(.10,.12,.16,x,.05,.38,brass,cabinet);
    }
    box(1.44,.07,.07,0,.99,.49,brass,cabinet);
    const bevel=gear(.215,16,shaftX,.99,0,true,'gearbox-horizontal-input');
    const internal=gear(.27,20,shaftX,.70,.22,false,'gearbox-main-wheel');
    const second=gear(.162,12,shaftX-.425,.70,.22,false,'gearbox-reduction-wheel');
    const third=gear(.189,14,shaftX+.45,.70,.22,false,'gearbox-output-wheel');
    for(const x of [0,-.425,.45]) {
        const axle=cylinder(.038,.61,shaftX+x,.70,-.02,brass);axle.rotation.x=Math.PI/2;
        box(.12,.12,.06,shaftX+x,.70,-.31,brass);
    }
    // Fijaciones de la tapa retirada y placa de inspección, sin cubrir los engranes.
    for(const x of [-.52,.52])for(const height of [.24,.90]) {
        const bolt=cylinder(.024,.04,x,height,.525,brass,cabinet);bolt.rotation.x=Math.PI/2;
    }
    box(.23,.08,.025,0,.25,.565,brass,cabinet);
    return {group,shaftX,update(yaw){
        crown.rotation.y=yaw;
        small.rotation.z=-yaw*72/16+Math.PI/16;
        large.rotation.z=yaw*72/32;
        bevel.rotation.z=yaw*72/32;
        internal.rotation.z=-yaw*72/32;
        second.rotation.z=yaw*72/32*20/12;
        third.rotation.z=yaw*72/32*20/14+Math.PI/14;
    },blocksMovement(p,feetY){
        if(feetY<1.15&&Math.abs(p.x-shaftX)<.72+collisionRadius&&p.z>-.395-collisionRadius&&p.z<.565+collisionRadius)return true;
        return feetY<level+.35&&Math.hypot(p.x-shaftX,p.z)<.10+collisionRadius;
    }};
}
