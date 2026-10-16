// Salamandra de hierro: frente hacia +Z. Cuerpo y tubo separados para que
// la colisión del mueble no ocupe todo el espacio bajo el conducto exterior.
function partsBuilder(THREE) {
    const parts = [];
    function add(source, material, transform, color = 0xffffff) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        transform?.(geometry);
        const tint = new THREE.Color(color);
        const colors = new Float32Array(geometry.attributes.position.count * 3);
        for (let i = 0; i < colors.length; i += 3) {
            colors[i] = tint.r; colors[i + 1] = tint.g; colors[i + 2] = tint.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        parts.push({ geometry, material });
    }
    const box = (w,h,d,x,y,z,material=0) =>
        add(new THREE.BoxGeometry(w,h,d),material,g=>g.translate(x,y,z));
    function tube(a,b,r,material=1,segments=8,color=0xffffff) {
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
        const direction = end.clone().sub(start);
        const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
        add(new THREE.CylinderGeometry(r,r,direction.length(),segments),material,g=>{
            g.applyQuaternion(rotation); g.translate(...start.add(end).multiplyScalar(0.5).toArray());
        },color);
    }
    function finish() {
        parts.sort((a,b)=>a.material-b.material);
        const geometry = new THREE.BufferGeometry();
        for (const name of ['position','normal','uv','color']) {
            const values = new Float32Array(parts.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));
            let offset = 0;
            for (const part of parts) {
                values.set(part.geometry.attributes[name].array,offset);
                offset += part.geometry.attributes[name].array.length;
            }
            geometry.setAttribute(name,new THREE.BufferAttribute(values,parts[0].geometry.attributes[name].itemSize));
        }
        let start = 0;
        for (const material of [...new Set(parts.map(p=>p.material))]) {
            const count = parts.filter(p=>p.material===material).reduce((sum,p)=>sum+p.geometry.attributes.position.count,0);
            geometry.addGroup(start,count,material); start += count;
        }
        for (const part of parts) part.geometry.dispose();
        geometry.computeBoundingBox(); geometry.computeBoundingSphere();
        return geometry;
    }
    return { add, box, tube, finish };
}

export function createWoodStoveGeometry(THREE) {
    const { add, box, tube, finish } = partsBuilder(THREE);
    // Cuatro patas de fundición curvas, con rodilla ancha y pie abierto.
    for (const side of [-1,1]) for (const z of [-.28,.28]) {
        const leg = new THREE.Shape();
        const profile = [[.30,.46],[.43,.46],[.49,.35],[.455,.24],[.46,.13],
            [.50,.045],[.49,0],[.39,0],[.37,.045],[.40,.14],[.385,.24],[.31,.34]];
        profile.forEach(([x,y],i)=>i?leg.lineTo(x*side,y):leg.moveTo(x*side,y));
        leg.closePath();
        add(new THREE.ExtrudeGeometry(leg,{depth:.105,bevelEnabled:false,steps:1}),0,g=>g.translate(0,0,z-.0525));
        // Nervio frontal que acompaña la curva de cada pata.
        tube([side*.36,.38,z+.056],[side*.425,.27,z+.056],.012,0,5);
        tube([side*.425,.27,z+.056],[side*.425,.14,z+.056],.010,0,5);
    }
    box(1.01,.075,.79,0,.46,0);
    box(.91,.09,.69,0,.535,0);
    // Hogar hueco: se ven exactamente las dos leñas a través de la reja.
    box(.98,.72,.055,0,.94,-.345);
    for (const x of [-.465,.465]) box(.05,.72,.72,x,.94,0);
    box(.90,.10,.67,0,.655,0);
    // Molduras de fundición y plancha superior ancha.
    box(1.025,.065,.79,0,1.3175,0);
    box(.965,.035,.73,0,1.365,0);
    for (const x of [-.486,.486]) {
        box(.025,.57,.035,x,.98,.29);
        box(.025,.57,.035,x,.98,-.29);
        for (const y of [.695,1.265]) box(.025,.035,.60,x,y,0);
    }
    // Aros de cocina sobre la tapa; salida de humos libre en el eje posterior.
    for (const [x,z,r] of [[0,.22,.115],[-.27,-.16,.072]]) {
        add(new THREE.TorusGeometry(r,.006,3,16),0,g=>{
            g.rotateX(Math.PI/2); g.translate(x,1.388,z);
        });
        box(.04,.009,.012,x,1.388,z);
    }
    // Pasamanos de hierro alrededor de la plancha, del mismo negro del cuerpo.
    for (const side of [-1,1]) {
        for (const z of [-.26,.26]) tube([side*.43,1.36,z],[side*.50,1.415,z],.012,0,6);
        tube([side*.50,1.415,-.27],[side*.50,1.415,.27],.012,0,6);
        tube([side*.50,1.415,.27],[side*.46,1.415,.32],.012,0,6);
    }
    tube([-.46,1.415,.32],[.46,1.415,.32],.012,0,6);
    // Puerta antigua con marco escalonado y abertura real, sin vidrio.
    const frame = new THREE.Shape();
    const outline = [[-.43,-.30],[.43,-.30],[.43,.29],[.39,.33],[-.39,.33],[-.43,.29]];
    outline.forEach(([x,y],i)=>i?frame.lineTo(x,y):frame.moveTo(x,y));
    frame.closePath();
    // Respiraderos arqueados como los registros de una salamandra antigua.
    function ventOpenings(shape, offsetX = 0) {
        for (const row of [-.09,.10]) for (const column of [-.21,-.07,.07,.21]) {
            const opening = new THREE.Path();
            const points = [[-.04,-.07],[-.04,.025],[-.028,.055],[0,.07],
                [.028,.055],[.04,.025],[.04,-.07]];
            points.forEach(([x,y],i)=>i?opening.lineTo(column+offsetX+x,row+y):opening.moveTo(column+offsetX+x,row+y));
            opening.closePath(); shape.holes.push(opening);
        }
    }
    ventOpenings(frame);
    add(new THREE.ExtrudeGeometry(frame,{depth:.045,bevelEnabled:true,bevelThickness:.008,
        bevelSize:.008,bevelSegments:1,steps:1}),0,g=>g.translate(0,.94,.365));
    // Registro corredizo detrás, desplazado medio vano: deja las ranuras semiabiertas.
    const shutter = new THREE.Shape();
    shutter.moveTo(-.31,-.19); shutter.lineTo(.31,-.19);
    shutter.lineTo(.31,.20); shutter.lineTo(-.31,.20); shutter.closePath();
    ventOpenings(shutter,.035);
    add(new THREE.ExtrudeGeometry(shutter,{depth:.012,bevelEnabled:false,steps:1}),0,g=>g.translate(0,.94,.348));
    box(.56,.024,.018,0,.94,.424);
    tube([.07,.94,.43],[.07,.94,.463],.013,0,6);
    add(new THREE.SphereGeometry(.021,6,3),0,g=>g.translate(.07,.94,.468));

    for (const x of [-.335,.335]) for (const y of [.70,1.18]) {
        box(.10,.025,.018,x,y,.42);
        add(new THREE.SphereGeometry(.018,5,3),0,g=>{
            g.scale(1,.8,.45); g.translate(x,y,.438);
        });
    }
    // Bisagras, pestillo y cajón de cenizas con molduras.
    for (const y of [.74,1.12]) {
        tube([-.44,y-.055,.405],[-.44,y+.055,.405],.025,0,6);
        box(.075,.035,.055,-.40,y,.405);
    }
    tube([.39,.94,.41],[.49,.96,.46],.018,0,6);
    add(new THREE.SphereGeometry(.032,6,3),0,g=>g.translate(.49,.96,.46));
    box(.74,.15,.035,0,.56,.412);
    for (const y of [.495,.625]) box(.77,.022,.020,0,y,.44);
    for (const x of [-.37,.37]) box(.022,.13,.020,x,.56,.44);
    for (const x of [-.22,-.11,0,.11,.22]) box(.055,.016,.012,x,.575,.44);
    tube([0,.53,.43],[0,.53,.485],.018,0,6);
    add(new THREE.SphereGeometry(.024,6,3),0,g=>g.translate(0,.53,.495));

    // Dos leñas distintas, apoyadas en diagonal y a diferente profundidad.
    const logs = [
        { a: [-.21,.80,-.18], b: [.08,.85,.28], r: .115, angle: .2, bark: 0x65482f, cut: 0xb78d54 },
        { a: [.15,.91,-.06], b: [.07,1.01,.25], r: .078, angle: -.45, bark: 0x745038, cut: 0xc09760 }
    ];
    for (const { a,b,r,angle,bark,cut } of logs) {
        tube(a,b,r,2,6,bark);
        const direction = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize();
        const cutRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),direction);
        const end = new THREE.Vector3(...b).addScaledVector(direction,.003);
        add(new THREE.CircleGeometry(r*.94,6),2,g=>{
            g.rotateZ(angle); g.applyQuaternion(cutRotation); g.translate(...end.toArray());
        },cut);
        const crackStart = new THREE.Vector3(-r*.45,-r*.15,.005).applyQuaternion(cutRotation).add(end);
        const crackEnd = new THREE.Vector3(r*.42,r*.17,.005).applyQuaternion(cutRotation).add(end);
        tube(crackStart.toArray(),crackEnd.toArray(),.004,2,4,0x705137);
    }
    tube([0,1.35,-.14],[0,1.43,-.14],.19,0);
    return finish();
}

export function createWoodStovePipeGeometry(THREE, top = 5.15) {
    const { add, tube, finish } = partsBuilder(THREE);
    // Conducto ancho y totalmente vertical, centrado sobre la salida del hogar.
    tube([0,1.40,-.14],[0,top,-.14],.16,1);
    for (const y of [1.43,2.30,3.50,top-.06])
        tube([0,y-.025,-.14],[0,y+.025,-.14],.177,1);
    // Sombrerete en el mismo eje, por encima de la cubierta.
    for (let i=0;i<3;i++) {
        const angle=i*Math.PI*2/3,x=Math.cos(angle)*.135,z=-.14+Math.sin(angle)*.135;
        tube([x,top-.01,z],[x,top+.10,z],.012,1,4);
    }
    add(new THREE.ConeGeometry(.24,.12,8),1,g=>g.translate(0,top+.14,-.14));
    return finish();
}