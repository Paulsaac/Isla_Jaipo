// Cocina a leña esmaltada. Materiales: esmalte, hierro, acero y hierro envejecido de la olla.
export function createAntiqueStoveGeometry(THREE) {
    const parts = [];
    function add(source, material, transform) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        transform?.(geometry);
        parts.push({ geometry, material });
    }
    const box = (w,h,d,x,y,z,m=0) => add(new THREE.BoxGeometry(w,h,d),m,g=>g.translate(x,y,z));
    function bar(a,b,r,material=1) {
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
        const direction = end.clone().sub(start);
        const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
        add(new THREE.CylinderGeometry(r,r,direction.length(),6),material,g=>{
            g.applyQuaternion(rotation); g.translate(...start.add(end).multiplyScalar(0.5).toArray());
        });
    }
    // Patas curvas sugeridas con dos segmentos angulares y pies abiertos.
    for (const x of [-0.78,0.78]) for (const z of [-0.48,0.48]) {
        const sx=Math.sign(x), sz=Math.sign(z);
        bar([x,0.36,z],[x-sx*0.055,0.17,z-sz*0.025],0.065);
        bar([x-sx*0.055,0.17,z-sz*0.025],[x+sx*0.065,0.045,z+sz*0.065],0.055);
        box(0.17,0.045,0.15,x+sx*0.065,0.0225,z+sz*0.065,1);
    }
    box(1.87,0.12,1.18,0,0.34,0,1);
    box(1.8,0.85,1.12,0,0.805,0);
    // Panel lateral rebajado y montantes de hierro.
    for (const x of [-0.91,0.91]) {
        box(0.025,0.67,0.91,x,0.8,0);
        for (const z of [-0.555,0.555]) box(0.055,0.91,0.055,x,0.805,z,1);
    }
    box(1.84,0.84,0.025,0,0.81,0.573,1);
    // Hogar y cajón de cenizas a la izquierda; horno amplio a la derecha.
    for (const [x,y,w,h] of [[-0.59,0.95,0.48,0.49],[-0.59,0.52,0.48,0.26],[0.30,0.78,1.10,0.76]]) {
        box(w,h,0.035,x,y,0.605);
        const handleY=y+h*0.21;
        const span=w*0.47;
        for (const dx of [-span/2,span/2]) bar([x+dx,handleY,0.625],[x+dx,handleY,0.70],0.019,2);
        bar([x-span/2,handleY,0.70],[x+span/2,handleY,0.70],0.022,2);
        for (const hingeY of [y-h*0.28,y+h*0.28]) box(0.07,0.07,0.035,x-w/2+0.025,hingeY,0.638,2);
    }
    // Plancha y cuatro hornillas de anillos concéntricos.
    box(2.00,0.085,1.34,0,1.2725,0,1);
    for (const x of [-0.48,0.43]) for (const z of [-0.28,0.28]) {
        const radius=x<0?0.225:0.185;
        add(new THREE.CylinderGeometry(radius,radius,0.018,12),1,g=>g.translate(x,1.324,z));
        for (const r of [radius*0.68,radius*0.97]) {
            add(new THREE.TorusGeometry(r,0.006,3,12),2,g=>{g.rotateX(Math.PI/2);g.translate(x,1.335,z);});
        }
        box(0.055,0.008,0.013,x,1.338,z,1);
    }
    // Barras de apoyo alrededor de la cubierta.
    for (const x of [-1.055,1.055]) {
        for (const z of [-0.58,0.58]) bar([x*0.9,1.28,z],[x,1.38,z],0.018);
        bar([x,1.38,-0.69],[x,1.38,0.69],0.025);
    }
    // Olla pequeña de hierro con tapa, centrada en la hornilla delantera derecha.
    const potX=0.43, potZ=0.28, potBase=1.342;
    const potProfile=[[0,0],[0.135,0],[0.165,0.025],[0.18,0.075],[0.185,0.19],[0.178,0.225],[0,0.225]];
    add(new THREE.LatheGeometry(potProfile.map(([r,y])=>new THREE.Vector2(r,y)),10),3,g=>g.translate(potX,potBase,potZ));
    const lidProfile=[[0,0.219],[0.191,0.219],[0.191,0.23],[0.145,0.244],[0.07,0.26],[0,0.263]];
    add(new THREE.LatheGeometry(lidProfile.map(([r,y])=>new THREE.Vector2(r,y)),10),3,g=>g.translate(potX,potBase,potZ));
    add(new THREE.TorusGeometry(0.181,0.005,3,10),2,g=>{
        g.rotateX(Math.PI/2); g.translate(potX,potBase+0.224,potZ);
    });
    add(new THREE.CylinderGeometry(0.024,0.018,0.033,6),1,g=>g.translate(potX,potBase+0.279,potZ));
    add(new THREE.SphereGeometry(0.032,6,3),1,g=>{
        g.scale(1,0.55,1); g.translate(potX,potBase+0.299,potZ);
    });
    // Asas cortas angulares de hierro a ambos lados.
    for (const side of [-1,1]) {
        const inner=potX+side*0.17, outer=potX+side*0.255;
        bar([inner,potBase+0.16,potZ-0.055],[outer,potBase+0.18,potZ-0.055],0.014);
        bar([outer,potBase+0.18,potZ-0.055],[outer,potBase+0.18,potZ+0.055],0.016);
        bar([outer,potBase+0.18,potZ+0.055],[inner,potBase+0.16,potZ+0.055],0.014);
    }
    const result = new THREE.BufferGeometry();
    // Agrupar por material mantiene cuatro llamadas de dibujo para toda la cocina.
    parts.sort((a,b)=>a.material-b.material);
    for (const name of ['position','normal','uv']) {
        const values = new Float32Array(parts.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));
        let offset=0;
        for (const {geometry} of parts) { values.set(geometry.attributes[name].array,offset); offset+=geometry.attributes[name].array.length; }
        result.setAttribute(name,new THREE.BufferAttribute(values,parts[0].geometry.attributes[name].itemSize));
    }
    let start=0;
    for (let material=0;material<4;material++) {
        const count=parts.filter(p=>p.material===material).reduce((sum,p)=>sum+p.geometry.attributes.position.count,0);
        result.addGroup(start,count,material); start+=count;
    }
    for (const {geometry} of parts) geometry.dispose();
    result.computeBoundingBox(); result.computeBoundingSphere();
    return result;
}
