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
    const axeVertexStart = parts.reduce((sum, part) => sum + part.geometry.attributes.position.count, 0);
    // Mango de madera y cabeza de hierro, apoyados en diagonal sobre el tablero.
    const axe = new THREE.Matrix4().makeRotationY(-0.45);
    axe.setPosition(0.08,1.067,0.15);
    const handle = new THREE.CylinderGeometry(0.035,0.047,0.95,8);
    add(handle,0,g=>{g.rotateX(Math.PI/2);g.applyMatrix4(axe);});
    add(new THREE.BoxGeometry(0.16,0.075,0.13),1,g=>{g.translate(0,0,0.36);g.applyMatrix4(axe);});
    const blade = new THREE.Shape();
    blade.moveTo(0.06,0.30); blade.lineTo(0.20,0.265); blade.lineTo(0.26,0.20);
    blade.lineTo(0.285,0.365); blade.lineTo(0.26,0.53);
    blade.lineTo(0.20,0.465); blade.lineTo(0.06,0.43); blade.closePath();
    add(new THREE.ExtrudeGeometry(blade,{depth:0.055,bevelEnabled:false}),1,g=>{
        g.rotateX(Math.PI/2); g.translate(0,0.0275,0); g.applyMatrix4(axe);
    });
    // Bisel ancho de acero: se estrecha desde la cabeza hasta un filo de 4 mm.
    // Tres puntos dibujan una curva facetada, visible incluso mirando desde arriba.
    const inner = [[0.26,0.20],[0.285,0.365],[0.26,0.53]];
    const edge = [[0.35,0.17],[0.38,0.365],[0.35,0.56]];
    const vertices = [];
    const point = (p,y) => [p[0],y,p[1]];
    const quad = (a,b,c,d) => vertices.push(...a,...b,...c,...a,...c,...d);
    for (let i=0;i<2;i++) {
        quad(point(inner[i],0.0275),point(inner[i+1],0.0275),point(edge[i+1],0.002),point(edge[i],0.002));
        quad(point(inner[i],-0.0275),point(edge[i],-0.002),point(edge[i+1],-0.002),point(inner[i+1],-0.0275));
        quad(point(edge[i],0.002),point(edge[i+1],0.002),point(edge[i+1],-0.002),point(edge[i],-0.002));
    }
    quad(point(inner[0],0.0275),point(edge[0],0.002),point(edge[0],-0.002),point(inner[0],-0.0275));
    quad(point(inner[2],0.0275),point(inner[2],-0.0275),point(edge[2],-0.002),point(edge[2],0.002));
    const bevel = new THREE.BufferGeometry();
    bevel.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    bevel.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));
    bevel.computeVertexNormals();
    add(bevel,2,g=>g.applyMatrix4(axe));
    const result = new THREE.BufferGeometry();
    // Permite ocultar solo el hacha con drawRange, conservando el mesón y sus colisiones.
    result.userData.axeVertexStart = axeVertexStart;
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
