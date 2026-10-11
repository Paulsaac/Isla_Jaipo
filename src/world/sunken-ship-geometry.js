import { createBarrelGeometry } from './barrel-geometry.js';

// Casco abierto y roto, costillas, tablones, mástil caído y carga dispersa.
// Materiales: madera envejecida, hierro oxidado y lona.
export function createSunkenShipGeometry(THREE) {
    const parts = [];
    const add = (source, material, transform) => {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        if (transform) transform(geometry);
        parts.push({ geometry, material });
    };
    const beam = (a, b, width, thickness, material = 0) => {
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
        const direction = end.clone().sub(start);
        const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), direction.clone().normalize());
        add(new THREE.BoxGeometry(width,thickness,direction.length()),material,g=>{
            g.applyQuaternion(rotation); const middle=start.add(end).multiplyScalar(0.5);g.translate(middle.x,middle.y,middle.z);
        });
    };
    const sections = [[-9,.25],[-7,2],[-4.5,3.4],[-1.5,4.1],[1.5,4.1],[4.5,3.6],[7,2.6],[9,1.5]];
    // Quilla y fondo abiertos: los huecos entre tablones muestran el lecho marino.
    beam([0,.15,-9],[0,.15,9],.24,.26);
    for (const [z,width] of sections) {
        for (const side of [-1,1]) {
            beam([0,.22,z],[side*width*.52,.4,z],.16,.18);
            beam([side*width*.52,.4,z],[side*width*.85,1.2,z],.16,.18);
            beam([side*width*.85,1.2,z],[side*width,1.65,z],.16,.18);
        }
    }
    for (let i=0;i<sections.length-1;i++) {
        const [z0,w0]=sections[i], [z1,w1]=sections[i+1];
        for (const side of [-1,1]) for (const [y,factor] of [[.48,.56],[.86,.7],[1.24,.86],[1.6,1]]) {
            // Costado de estribor desgarrado y huecos irregulares entre tablones.
            if (side===1 && i>=2 && i<=4 && (y<1.5 || i===3)) continue;
            if (side===-1 && i===3 && y===.86) continue;
            beam([side*w0*factor,y,z0],[side*w1*factor,y,z1],.3,.09);
        }
        for (const side of [-1,1]) {
            if(i===3&&side===1)continue;
            beam([side*w0*.35,.29,z0],[side*w1*.35,.29,z1],.52,.08);
        }
    }
    // Fragmentos inclinados en la rotura y travesaños de la cubierta hundida.
    for (const z of [-4.5,-1.5,1.5,4.5]) beam([-2.3,1.28,z],[1.3,1.07,z+.3],.22,.12);
    beam([2.8,.45,-3.7],[4.6,.7,-2.5],.34,.08);
    beam([3.4,.35,2.2],[4.5,.65,4.6],.3,.08);
    // Mástil caído, aros metálicos y restos de vela rasgada.
    beam([-1,.7,-5],[1.6,1.1,5.4],.23,.23);
    for (const z of [-3,2]) {
        add(new THREE.TorusGeometry(.15,.025,6,12),1,g=>{g.translate(-1+(z+5)*.25,.7+(z+5)*.038,z);});
    }
    const sail = new THREE.Shape();
    sail.moveTo(-1.4,-2);sail.lineTo(1.9,-1.5);sail.lineTo(1.3,1.3);
    sail.lineTo(.7,.7);sail.lineTo(.3,1.7);sail.lineTo(-.3,1);sail.lineTo(-1.4,1.4);sail.closePath();
    add(new THREE.ExtrudeGeometry(sail,{depth:.025,bevelEnabled:false}),2,g=>{g.rotateX(-Math.PI/2);g.translate(0,.39,.6);});
    const barrel=createBarrelGeometry(THREE);
    barrel.scale(.55,.55,.55);barrel.translate(-1.5,.32,3.3);
    parts.push({geometry:barrel,groups:barrel.groups.map(group=>({...group}))});
    add(new THREE.BoxGeometry(.85,.55,.9),0,g=>{g.rotateY(.3);g.translate(.7,.57,-3.5);});
    beam([-.8,.35,6.3],[1.6,.42,7.4],.32,.09);
    const result=new THREE.BufferGeometry();
    for(const name of ['position','normal','uv']) {
        const values=new Float32Array(parts.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));let offset=0;
        for(const{geometry}of parts){values.set(geometry.attributes[name].array,offset);offset+=geometry.attributes[name].array.length;}
        result.setAttribute(name,new THREE.BufferAttribute(values,parts[0].geometry.attributes[name].itemSize));
    }
    let start=0;
    for(const part of parts){
        if(part.groups)for(const group of part.groups)result.addGroup(start+group.start,group.count,group.materialIndex);
        else result.addGroup(start,part.geometry.attributes.position.count,part.material);
        start+=part.geometry.attributes.position.count;part.geometry.dispose();
    }
    result.rotateZ(-0.055);
    result.computeBoundingBox();result.translate(0,-result.boundingBox.min.y,0);
    result.computeBoundingBox();result.computeBoundingSphere();
    return result;
}
