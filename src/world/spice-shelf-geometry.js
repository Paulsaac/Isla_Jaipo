// Estante de cocina: dos especieros, dos frascos, cuchara de palo y dos manojos.
// Materiales: madera, hierba verde, vidrio oliva, vidrio ámbar, corcho, etiquetas y hierba seca.
export function createSpiceShelfGeometry(THREE) {
    const parts = [];
    function add(source, material, transform) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        transform?.(geometry);
        parts.push({ geometry, material });
    }
    const box = (w,h,d,x,y,z,m=0) => add(new THREE.BoxGeometry(w,h,d),m,g=>g.translate(x,y,z));
    for (const x of [-0.6,0.6]) box(0.09,2.3,0.5,x,1.15,0);
    box(1.2,2.22,0.045,0,1.15,-0.228);
    for (const y of [0.13,0.70,1.28,1.86,2.26]) box(1.29,0.08,0.52,0,y,0);
    function jar(x,base,z,r,height,material) {
        const profile = [[0,0],[r*0.82,0],[r,0.018],[r,height*0.76],[r*0.68,height*0.86],[r*0.68,height],[0,height]];
        add(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),8),material,g=>g.translate(x,base,z));
        add(new THREE.CylinderGeometry(r*0.73,r*0.73,0.028,8),4,g=>g.translate(x,base+height+0.012,z));
        box(r*1.05,height*0.28,0.01,x,base+height*0.46,z+r,5);
    }
    // Pequeños especieros agrupados; los extremos quedan libres.
    // Cuchara de palo acostada sobre la repisa, con el cuenco hacia arriba.
    const spoonStart=parts.length;
    add(new THREE.CylinderGeometry(0.013,0.017,0.25,6),4,g=>g.translate(0,0.125,0));
    const spoonProfile=[[0,0],[0.6,0],[1,0.18],[1,0.4],[0.85,0.43],[0.55,0.18],[0,0.13]];
    add(new THREE.LatheGeometry(spoonProfile.map(([r,y])=>new THREE.Vector2(r,y)),10),4,g=>{
        g.scale(0.065,0.07,0.09); g.rotateX(Math.PI/2); g.translate(0,0.295,0);
    });
    const spoonParts=parts.slice(spoonStart);
    const spoonBounds=new THREE.Box3();
    for (const {geometry} of spoonParts) {
        geometry.translate(0,-0.19,0);
        geometry.rotateX(-Math.PI/2);
        geometry.rotateY(0.18);
        geometry.computeBoundingBox(); spoonBounds.union(geometry.boundingBox);
    }
    for (const {geometry} of spoonParts) geometry.translate(-0.30,1.321-spoonBounds.min.y,0.035);
    jar(-0.04,1.32,0.035,0.065,0.16,3);
    jar(0.25,1.32,0.035,0.055,0.20,2);
    // Dos frascos más grandes, separados, en el nivel superior.
    jar(-0.30,1.90,0.005,0.095,0.26,3);
    jar(0.25,1.90,0.005,0.085,0.23,2);
    function herbBundle(x, slender, material, shelfTop) {
        const firstPart = parts.length;
        const count = slender ? 5 : 7;
        const spread = slender ? 0.095 : 0.15;
        const leaf = new THREE.Shape();
        // Silueta lobulada de cilantro, simplificada para el estilo low-poly.
        const outline = [[0,0],[-0.5,0.2],[-0.85,0.45],[-0.5,0.51],[-0.72,0.8],[-0.3,0.76],[-0.2,1],[0,0.88],[0.2,1],[0.3,0.76],[0.72,0.8],[0.5,0.51],[0.85,0.45],[0.5,0.2]];
        outline.forEach(([px,py], i) => i ? leaf.lineTo(px,py) : leaf.moveTo(px,py));
        leaf.closePath();
        for (let i=0; i<count; i++) {
            const fan = (i/(count-1)-0.5)*2;
            const start = new THREE.Vector3(x+fan*0.018,0.18,0.08);
            const end = new THREE.Vector3(x+fan*spread+(slender ? 0.025 : 0),0.49+0.035*Math.cos(i*2),-0.025);
            // Los tallos se reúnen dentro del cordel antes de abrirse en abanico.
            const stem = [start,new THREE.Vector3(x+fan*0.014,0.245,0.052),new THREE.Vector3(x+fan*0.014,0.28,0.052),end];
            for (let segment=0; segment<stem.length-1; segment++) {
                const a=stem[segment], b=stem[segment+1], direction=b.clone().sub(a);
                add(new THREE.CylinderGeometry(0.003,0.004,direction.length(),5),material,g=>{
                    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
                    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
                });
            }
            for (let j=0; j<5; j++) {
                const upperLeaf = j>=3;
                const point = stem[2].clone().lerp(end,upperLeaf ? 0.58+(j-3)*0.28 : 0.4+j*0.29);
                add(new THREE.ShapeGeometry(leaf),material,g=>{
                    g.scale(slender ? 0.036 : 0.054,slender ? 0.075 : 0.082,1);
                    g.rotateZ((j%2 ? -1 : 1)*(upperLeaf ? 0.35 : 0.5+Math.abs(fan)*0.65));
                    g.rotateY(fan*0.45);
                    // Esta inclinación levanta una segunda capa al acostar el manojo.
                    if (upperLeaf) g.rotateX(0.9+(i%2)*0.2);
                    g.translate(point.x,point.y,point.z+0.015+j*0.004);
                });
            }
        }
        // Dos vueltas de cordel alrededor de los tallos y un nudo pequeño.
        for (const y of [0.255,0.269]) add(new THREE.TorusGeometry(0.022,0.005,4,10),4,g=>{
            g.rotateX(Math.PI/2); g.scale(1,1,0.5); g.translate(x,y,0.052);
        });
        add(new THREE.IcosahedronGeometry(0.009,0),4,g=>g.translate(x,0.26,0.069));
        // Acostados de lado sobre la repisa, con leves diferencias de orientación.
        const bundleParts=parts.slice(firstPart);
        const bounds=new THREE.Box3();
        for (const {geometry} of bundleParts) {
            geometry.translate(-x,-0.36,-0.03);
            geometry.scale(1.08,1.08,1.08);
            geometry.rotateZ(-Math.PI/2);
            geometry.rotateX(-Math.PI/2);
            geometry.rotateY(slender ? -0.16 : 0.12);
            geometry.computeBoundingBox();
            bounds.union(geometry.boundingBox);
        }
        for (const {geometry} of bundleParts) geometry.translate(x,shelfTop+0.001-bounds.min.y,0.015);
    }
    herbBundle(-0.27,false,1,0.17);
    herbBundle(0.25,true,6,0.74);
    parts.sort((a,b)=>a.material-b.material);
    const result = new THREE.BufferGeometry();
    for (const name of ['position','normal','uv']) {
        const values = new Float32Array(parts.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));
        let offset=0;
        for (const {geometry} of parts) { values.set(geometry.attributes[name].array,offset); offset+=geometry.attributes[name].array.length; }
        result.setAttribute(name,new THREE.BufferAttribute(values,parts[0].geometry.attributes[name].itemSize));
    }
    let start=0;
    for (let material=0;material<7;material++) {
        const count=parts.filter(p=>p.material===material).reduce((sum,p)=>sum+p.geometry.attributes.position.count,0);
        result.addGroup(start,count,material); start+=count;
    }
    for (const {geometry} of parts) geometry.dispose();
    result.computeBoundingBox(); result.computeBoundingSphere();
    return result;
}
