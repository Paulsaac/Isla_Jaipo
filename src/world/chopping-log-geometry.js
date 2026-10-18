export function createChoppingLogGeometry(THREE) {
    return new THREE.CylinderGeometry(.20, .20, .86, 12);
}

// La grieta recorre la intersección del tronco con el mismo plano del corte final.
// En pantalla ese plano es vertical, también con troncos transversales o diagonales.
export function createLogCrackGeometry(THREE, damage, viewLocal, cutNormal) {
    const positions = [], colors = [];
    const dark = new THREE.Color(0x21130d), edge = new THREE.Color(0xa47b4f);
    const amount = THREE.MathUtils.clamp(damage, 0, 1);
    const normal = cutNormal.clone().normalize();
    const towardViewer = viewLocal.clone().addScaledVector(normal, -viewLocal.dot(normal)).normalize();
    const vertical = new THREE.Vector3().crossVectors(towardViewer, normal).normalize();
    const sector = Math.PI*2/12, apothem = .20*Math.cos(sector/2);
    const faces = [[new THREE.Vector3(0,1,0),.43],[new THREE.Vector3(0,-1,0),.43]];
    let extent = 0;
    function sectionEdge(a,b) {
        const da=normal.dot(a),db=normal.dot(b);
        if (Math.abs(da)<1e-8) extent=Math.max(extent,Math.abs(vertical.dot(a)));
        if (Math.abs(db)<1e-8) extent=Math.max(extent,Math.abs(vertical.dot(b)));
        if (da*db<0) extent=Math.max(extent,Math.abs(vertical.dot(a.clone().lerp(b,da/(da-db)))));
    }
    for (let i=0; i<12; i++) {
        const theta = Math.PI/2+i*sector;
        const bottom=new THREE.Vector3(Math.cos(theta)*.20,-.43,Math.sin(theta)*.20);
        const top=bottom.clone().setY(.43);
        sectionEdge(bottom,top);
        for (const y of [-.43,.43]) sectionEdge(bottom.clone().setY(y),
            new THREE.Vector3(Math.cos(theta+sector)*.20,y,Math.sin(theta+sector)*.20));
        const angle = theta+sector/2;
        faces.push([new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)),apothem]);
    }
    // Intersección con las caras reales del cilindro: la marca permanece pegada
    // a la corteza y continúa por el extremo cuando el plano de corte lo atraviesa.
    function surface(height, lateral, offset) {
        const point = vertical.clone().multiplyScalar(height).addScaledVector(normal,lateral);
        let front = Infinity;
        for (const [face,limit] of faces) {
            const denominator = face.dot(towardViewer);
            if (denominator > 1e-8) front = Math.min(front,(limit-face.dot(point))/denominator);
        }
        return point.addScaledVector(towardViewer,front+offset);
    }
    function ribbon(points,halfWidth,offset,color) {
        for (let i=0; i<points.length-1; i++) {
            const a=points[i],b=points[i+1];
            const vertices=[surface(a[0],a[1]-halfWidth,offset),surface(a[0],a[1]+halfWidth,offset),
                surface(b[0],b[1]-halfWidth,offset),surface(b[0],b[1]+halfWidth,offset)];
            for (const index of [0,1,2,2,1,3]) {
                const point=vertices[index];positions.push(point.x,point.y,point.z);colors.push(color.r,color.g,color.b);
            }
        }
    }
    const length=extent*2*(.12+.83*amount);
    const points=Array.from({length:25},(_,i)=>[(i/24-.5)*length,Math.sin(i*2.3)*.0018]);
    ribbon(points,.005+amount*.002,.0015,edge);
    ribbon(points,.0025+amount*.0015,.002,dark);
    if (amount >= .5) {
        for (const sign of [-1,1]) ribbon([[sign*length*.12,0],[sign*length*.20,sign*.012],[sign*length*.26,sign*.025]],.0025,.002,dark);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    return geometry;
}
