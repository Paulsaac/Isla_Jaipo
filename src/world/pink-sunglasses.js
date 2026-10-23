// Octaedro truncado:24vértices,6caras cuadradas y8hexagonales, sin dependencias adicionales.
export function createTruncatedOctahedron(THREE) {
    const vertices=[];
    for(const p of [[0,1,2],[0,2,1],[1,0,2],[2,0,1],[1,2,0],[2,1,0]])
        for(const a of [-1,1]) for(const b of [-1,1]) {
            let i=0;vertices.push(new THREE.Vector3(...p.map(v=>v===0?0:v*([a,b][i++]))));
        }
    const planes=[];
    for(let axis=0;axis<3;axis++)for(const sign of [-1,1]) {
        const n=new THREE.Vector3();n.setComponent(axis,sign);planes.push([n,2]);
    }
    for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])
        planes.push([new THREE.Vector3(x,y,z),3]);
    const positions=[];
    for(const [plane,d] of planes) {
        const face=vertices.filter(v=>Math.abs(v.dot(plane)-d)<1e-6);
        const center=face.reduce((a,v)=>a.add(v),new THREE.Vector3()).divideScalar(face.length);
        const n=plane.clone().normalize(),u=face[0].clone().sub(center).normalize(),v=new THREE.Vector3().crossVectors(n,u);
        face.sort((a,b)=>Math.atan2(a.clone().sub(center).dot(v),a.clone().sub(center).dot(u))
            -Math.atan2(b.clone().sub(center).dot(v),b.clone().sub(center).dot(u)));
        for(let i=1;i<face.length-1;i++)for(const point of [face[0],face[i],face[i+1]])positions.push(point.x,point.y,point.z);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.computeVertexNormals();return geometry;
}

// Goggles de latón y cuero con dos cristales rosados facetados.
export function createPinkSunglasses(THREE) {
    const pieces = [];
    function add(source, color, x, y, z, materialIndex=0) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        geometry.translate(x,y,z);
        const tint = new THREE.Color(color), colors = new Float32Array(geometry.attributes.position.count*3);
        for (let i=0;i<colors.length;i+=3) { colors[i]=tint.r; colors[i+1]=tint.g; colors[i+2]=tint.b; }
        geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.userData.materialIndex=materialIndex;pieces.push(geometry);
    }
    for (const x of [-0.14,0.14]) {
        add(new THREE.TorusGeometry(.112,.026,6,16),0x583c25,x,0,-.035,1);
        add(new THREE.TorusGeometry(.11,.018,6,16),0xbc8a43,x,0,.015);
        add(new THREE.TorusGeometry(.098,.009,5,16),0xe0ba73,x,0,.035);
        const crystal=createTruncatedOctahedron(THREE);crystal.scale(.044,.044,.023);
        add(crystal,0xf583bd,x,0,.035,2);
        for(let i=0;i<8;i++) {const angle=i*Math.PI/4;
            add(new THREE.SphereGeometry(.007,5,3),0xf0cf87,x+Math.cos(angle)*.112,Math.sin(angle)*.112,.037);
        }
        const vent=new THREE.CylinderGeometry(.018,.018,.045,6);vent.rotateZ(Math.PI/2);
        add(vent,0x886032,x+Math.sign(x)*.122,.035,-.025);
    }
    add(new THREE.TorusGeometry(.038,.012,5,10,Math.PI),0xbc8a43,0,-.012,.005);
    for (const x of [-.26,.26]) {
        add(new THREE.BoxGeometry(.025,.045,.20),0x513326,x,0,-.11,1);
        add(new THREE.BoxGeometry(.035,.057,.025),0xc6954f,x,0,-.065);
    }
    add(new THREE.BoxGeometry(.52,.045,.025),0x513326,0,0,-.20,1);
    const geometry = new THREE.BufferGeometry();
    for (const name of ['position','normal','color']) {
        const array = new Float32Array(pieces.reduce((sum,piece)=>sum+piece.attributes[name].array.length,0));
        let offset=0;
        for (const piece of pieces) { array.set(piece.attributes[name].array,offset); offset+=piece.attributes[name].array.length; }
        geometry.setAttribute(name,new THREE.BufferAttribute(array,3));
    }
    let start=0;for(const piece of pieces){const count=piece.attributes.position.count;geometry.addGroup(start,count,piece.userData.materialIndex);start+=count;}
    pieces.forEach(piece=>piece.dispose()); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry,[
        new THREE.MeshPhongMaterial({vertexColors:true,side:THREE.DoubleSide,shininess:85}),
        new THREE.MeshPhongMaterial({vertexColors:true,side:THREE.DoubleSide,shininess:6}),
        new THREE.MeshPhongMaterial({vertexColors:true,side:THREE.DoubleSide,shininess:130,transparent:true,opacity:.88,depthWrite:false})]);
    mesh.name='pink-steampunk-goggles'; return mesh;
}
