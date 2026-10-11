// Restos facetados en escala de una celda. Materiales: madera, metal, blanco, rojo, cuerda.
export function createShipwreckGeometry(THREE, type) {
    const parts = [];
    const add = (source, material, transform) => {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        if (transform) transform(geometry);
        parts.push({ geometry, material });
    };
    const box = (x, y, z, px, py, pz, material = 0) =>
        add(new THREE.BoxGeometry(x, y, z), material, g => g.translate(px, py, pz));
    if (type === 'BROKEN_PLANK') {
        const shape = new THREE.Shape();
        shape.moveTo(-0.8, -0.18);
        for (const [x, z] of [[0.56,-0.18],[0.78,-0.1],[0.48,-0.03],[0.7,0.05],[0.53,0.1],[0.75,0.18],[-0.8,0.18]]) shape.lineTo(x, z);
        shape.closePath();
        add(new THREE.ExtrudeGeometry(shape, { depth: 0.075, bevelEnabled: false }), 0, g => g.rotateX(-Math.PI / 2));
        box(0.16, 0.04, 0.5, -0.5, 0.07, 0);
        for (const z of [-0.12, 0.12]) add(new THREE.CylinderGeometry(0.025,0.025,0.025,6), 1, g => g.translate(-0.5,0.1,z));
        add(new THREE.BoxGeometry(0.43,0.035,0.06), 0, g => { g.rotateY(-0.45); g.translate(0.67,0.02,-0.27); });
    } else if (type === 'LIFE_RING') {
        for (let i = 0; i < 8; i++) {
            add(new THREE.TorusGeometry(0.46,0.12,8,8,Math.PI / 4), i % 2 ? 3 : 2, g => {
                g.rotateZ(i * Math.PI / 4); g.rotateX(-Math.PI / 2); g.translate(0,0.12,0);
            });
        }
        add(new THREE.TorusGeometry(0.62,0.018,5,48), 4, g => { g.rotateX(-Math.PI/2); g.translate(0,0.1,0); });
        for (const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
            add(new THREE.BoxGeometry(0.12,0.025,0.045), 4, g => { g.rotateY(angle); g.translate(Math.cos(angle)*0.57,0.1,Math.sin(angle)*0.57); });
        }
    } else if (type === 'COILED_ROPE') {
        const points = [];
        for (let i = 0; i <= 180; i++) {
            const t = i / 180, angle = t * Math.PI * 8, radius = 0.08 + t * 0.4;
            points.push(new THREE.Vector3(Math.cos(angle)*radius,0.045,Math.sin(angle)*radius));
        }
        points.push(new THREE.Vector3(0.6,0.045,0.13),new THREE.Vector3(0.65,0.045,0.35),new THREE.Vector3(0.5,0.045,0.48));
        add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),240,0.035,6,false),4);
    } else if (type === 'BROKEN_MAST') {
        add(new THREE.CylinderGeometry(0.07,0.11,1.65,8),0,g=>{g.rotateZ(Math.PI/2);g.translate(0,0.13,0);});
        for (const x of [-0.5,0.25]) {
            add(new THREE.TorusGeometry(0.1,0.025,6,12),1,g=>{g.rotateY(Math.PI/2);g.translate(x,0.13,0);});
        }
        const cloth = new THREE.Shape();
        cloth.moveTo(-0.4,0); cloth.lineTo(0.4,0); cloth.lineTo(0.24,0.5);
        cloth.lineTo(0.1,0.34); cloth.lineTo(-0.05,0.55); cloth.lineTo(-0.2,0.36); cloth.lineTo(-0.4,0.48); cloth.closePath();
        add(new THREE.ExtrudeGeometry(cloth,{depth:0.015,bevelEnabled:false}),3,g=>{g.rotateX(-Math.PI/2);g.translate(-0.1,0.025,0.12);});
        add(new THREE.BoxGeometry(0.2,0.04,0.06),0,g=>{g.rotateY(0.4);g.translate(0.86,0.06,0.04);});
    } else throw new Error('Resto de naufragio desconocido: ' + type);
    const result = new THREE.BufferGeometry();
    for (const name of ['position','normal','uv']) {
        const values = new Float32Array(parts.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));
        let offset = 0;
        for (const {geometry} of parts) { values.set(geometry.attributes[name].array,offset); offset += geometry.attributes[name].array.length; }
        result.setAttribute(name,new THREE.BufferAttribute(values,parts[0].geometry.attributes[name].itemSize));
    }
    let start = 0;
    for (const {geometry,material} of parts) { result.addGroup(start,geometry.attributes.position.count,material); start += geometry.attributes.position.count; geometry.dispose(); }
    result.computeBoundingBox();
    result.translate(0,-result.boundingBox.min.y,0);
    result.computeBoundingBox(); result.computeBoundingSphere();
    return result;
}
