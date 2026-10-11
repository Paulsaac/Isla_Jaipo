// Mesón de carpintero y hacha apoyada. Materiales: madera, hierro y filo.
export function createWorkbenchGeometry(THREE) {
    const parts = [];
    const add = (source, material, transform) => {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        if (transform) transform(geometry);
        parts.push({ geometry, material });
    };
    const box = (width,height,depth,x,y,z,material=0) =>
        add(new THREE.BoxGeometry(width,height,depth),material,g=>g.translate(x,y,z));
    // Tablero de tres tablones, patas y travesaños.
    for (const x of [-0.34,0,0.34]) box(0.33,0.12,2.8,x,0.96,0);
    for (const x of [-0.4,0.4]) for (const z of [-1.15,1.15]) box(0.14,0.9,0.14,x,0.45,z);
    for (const z of [-1.15,1.15]) box(0.86,0.12,0.12,0,0.35,z);
    for (const x of [-0.4,0.4]) box(0.1,0.1,2.4,x,0.35,0);
    // Mango de madera y cabeza de hierro, apoyados en diagonal sobre el tablero.
    const axe = new THREE.Matrix4().makeRotationY(-0.45);
    axe.setPosition(0.08,1.067,0.15);
    const handle = new THREE.CylinderGeometry(0.035,0.047,0.95,8);
    add(handle,0,g=>{g.rotateX(Math.PI/2);g.applyMatrix4(axe);});
    add(new THREE.BoxGeometry(0.16,0.075,0.13),1,g=>{g.translate(0,0,0.36);g.applyMatrix4(axe);});
    const blade = new THREE.Shape();
    blade.moveTo(0.06,0.3); blade.lineTo(0.3,0.22); blade.lineTo(0.34,0.52);
    blade.lineTo(0.06,0.43); blade.closePath();
    add(new THREE.ExtrudeGeometry(blade,{depth:0.045,bevelEnabled:false}),1,g=>{
        g.rotateX(Math.PI/2); g.translate(0,0.0225,0); g.applyMatrix4(axe);
    });
    add(new THREE.BoxGeometry(0.035,0.05,0.31),2,g=>{
        g.rotateY(-0.13);g.translate(0.32,0,0.37);g.applyMatrix4(axe);
    });
    const result = new THREE.BufferGeometry();
    for (const name of ['position','normal','uv']) {
        const values = new Float32Array(parts.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));
        let offset = 0;
        for (const {geometry} of parts) {values.set(geometry.attributes[name].array,offset);offset+=geometry.attributes[name].array.length;}
        result.setAttribute(name,new THREE.BufferAttribute(values,parts[0].geometry.attributes[name].itemSize));
    }
    let start=0;
    for(const {geometry,material} of parts){result.addGroup(start,geometry.attributes.position.count,material);start+=geometry.attributes.position.count;geometry.dispose();}
    result.computeBoundingBox();result.computeBoundingSphere();
    return result;
}
