// Modelo compacto de lentes redondos: montura, cristales rosados y patillas.
export function createPinkSunglasses(THREE) {
    const pieces = [];
    function add(source, color, x, y, z) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        geometry.translate(x,y,z);
        const tint = new THREE.Color(color), colors = new Float32Array(geometry.attributes.position.count*3);
        for (let i=0;i<colors.length;i+=3) { colors[i]=tint.r; colors[i+1]=tint.g; colors[i+2]=tint.b; }
        geometry.setAttribute('color',new THREE.BufferAttribute(colors,3)); pieces.push(geometry);
    }
    for (const x of [-0.14,0.14]) {
        add(new THREE.TorusGeometry(.115,.013,5,24),0x737b85,x,0,0);
        add(new THREE.CircleGeometry(.101,24),0xf384b8,x,0,.002);
    }
    add(new THREE.BoxGeometry(.062,.014,.018),0x8b929c,0,.018,0);
    for (const x of [-.26,.26]) add(new THREE.BoxGeometry(.014,.014,.20),0x8b929c,x,.025,-.09);
    const geometry = new THREE.BufferGeometry();
    for (const name of ['position','normal','color']) {
        const array = new Float32Array(pieces.reduce((sum,piece)=>sum+piece.attributes[name].array.length,0));
        let offset=0;
        for (const piece of pieces) { array.set(piece.attributes[name].array,offset); offset+=piece.attributes[name].array.length; }
        geometry.setAttribute(name,new THREE.BufferAttribute(array,3));
    }
    pieces.forEach(piece=>piece.dispose()); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({vertexColors:true,side:THREE.DoubleSide,shininess:35}));
    mesh.name='pink-round-sunglasses'; return mesh;
}
