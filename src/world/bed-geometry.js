// Cama de dos celdas: estructura, colchón, almohada y manta en un único modelo.
export function createBedGeometry(THREE) {
    const pieces = [];
    const roundedBox = (width, height, depth, radius) => {
        // Tres segmentos: caras amplias y un bisel simple en cada borde.
        const divisions=3, geometry=new THREE.BoxGeometry(1,1,1,divisions,divisions,divisions);
        const position=geometry.attributes.position,normal=geometry.attributes.normal;
        const halfSegment=.5/divisions,point=new THREE.Vector3(),direction=new THREE.Vector3();
        const core=new THREE.Vector3(width/2-radius,height/2-radius,depth/2-radius);
        for(let i=0;i<position.count;i++) {
            point.fromBufferAttribute(position,i);
            direction.set(point.x-Math.sign(point.x)*halfSegment,
                point.y-Math.sign(point.y)*halfSegment,point.z-Math.sign(point.z)*halfSegment).normalize();
            position.setXYZ(i,Math.sign(point.x)*core.x+direction.x*radius,
                Math.sign(point.y)*core.y+direction.y*radius,Math.sign(point.z)*core.z+direction.z*radius);
            normal.setXYZ(i,direction.x,direction.y,direction.z);
        }
        return geometry;
    };
    const add = (width, height, depth, x, y, z, material, radius = 0) => {
        const box = radius ? roundedBox(width,height,depth,radius) : new THREE.BoxGeometry(width, height, depth);
        const geometry = box.toNonIndexed();
        box.dispose();
        if (radius) geometry.computeVertexNormals();
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    for (const x of [-0.65, 0.65]) for (const z of [-1.55, 1.55]) add(0.16, 0.4, 0.16, x, 0.2, z, 0);
    add(1.6, 0.22, 3.6, 0, 0.46, 0, 0);
    add(1.6, 1.18, 0.14, 0, 0.8, -1.75, 0);
    add(1.6, 0.45, 0.12, 0, 0.55, 1.75, 0);
    // Bordes apenas suavizados para conservar una silueta rectangular.
    add(1.45, 0.26, 3.35, 0, 0.7, 0, 1, 0.045);
    // Bisel exterior facetado sobre el colchón; corte junto a la almohada vertical.
    // Las paredes inferiores mantienen su anchura hasta la madera, sin recogerse.
    const rings=[[.705,.87,1.655],[.737,.857,1.687],[.75,.825,1.70],[.75,.57,1.70]].map(([w,y,z])=>{
        const r=.03;
        return [[-w,y,-.775],[w,y,-.775],[w,y,z-r],[w-r*.293,y,z-r*.293],
            [w-r,y,z],[-w+r,y,z],[-w+r*.293,y,z-r*.293],[-w,y,z-r]];
    });
    const blanketVertices=[];
    const triangle=(a,b,c)=>blanketVertices.push(...a,...b,...c);
    for(let ring=0;ring<rings.length-1;ring++)for(let i=0;i<8;i++) {
        const next=(i+1)%8,a=rings[ring][i],b=rings[ring][next];
        const c=rings[ring+1][i],d=rings[ring+1][next];
        triangle(a,b,c);triangle(b,d,c);
    }
    for(let i=1;i<7;i++) {
        triangle(rings[0][0],rings[0][i+1],rings[0][i]);
        triangle(rings[3][0],rings[3][i],rings[3][i+1]);
    }
    const blanket=new THREE.BufferGeometry();
    blanket.setAttribute('position',new THREE.Float32BufferAttribute(blanketVertices,3));
    blanket.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(blanketVertices.length/3*2),2));
    blanket.computeVertexNormals();pieces.push({geometry:blanket,material:2});
    add(1.05, 0.18, 0.6, 0, 0.92, -1.12, 1, 0.03);
    const result = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) {
        const values = new Float32Array(pieces.reduce((sum, piece) => sum + piece.geometry.attributes[name].array.length, 0));
        let offset = 0;
        for (const { geometry } of pieces) {
            values.set(geometry.attributes[name].array, offset);
            offset += geometry.attributes[name].array.length;
        }
        result.setAttribute(name, new THREE.BufferAttribute(values, pieces[0].geometry.attributes[name].itemSize));
    }
    let start = 0;
    for (const { geometry, material } of pieces) {
        result.addGroup(start, geometry.attributes.position.count, material);
        start += geometry.attributes.position.count;
        geometry.dispose();
    }
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}
