// Cama de dos celdas: estructura, colchón, almohada y manta en un único modelo.
export function createBedGeometry(THREE) {
    const pieces = [];
    const roundedBox = (width, height, depth, radius) => {
        const divisions=7, geometry=new THREE.BoxGeometry(1,1,1,divisions,divisions,divisions);
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
        geometry.translate(x, y, z);
        pieces.push({ geometry, material });
    };
    for (const x of [-0.65, 0.65]) for (const z of [-1.55, 1.55]) add(0.16, 0.4, 0.16, x, 0.2, z, 0);
    add(1.6, 0.22, 3.6, 0, 0.46, 0, 0);
    add(1.6, 1.18, 0.14, 0, 0.8, -1.75, 0);
    add(1.6, 0.45, 0.12, 0, 0.55, 1.75, 0);
    add(1.45, 0.26, 3.35, 0, 0.7, 0, 1, 0.12);
    // La manta envuelve el colchón hasta la estructura, dejando libre la almohada.
    add(1.5, 0.3, 2.475, 0, 0.72, 0.4625, 2, 0.11);
    add(1.05, 0.18, 0.6, 0, 0.92, -1.12, 1, 0.08);
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
