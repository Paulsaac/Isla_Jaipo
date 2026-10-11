// Cinco troncos: tres en la base y dos en los huecos superiores.
// Material 0: corte de madera; material 1: corteza.
export function createLogStackGeometry(THREE) {
    const parts = [];
    const radius = 0.28, length = 2.8;
    for (const [x, y] of [[-0.56,radius],[0,radius],[0.56,radius],[-0.28,radius + Math.sqrt(3)*radius],[0.28,radius + Math.sqrt(3)*radius]]) {
        const source = new THREE.CylinderGeometry(radius, radius, length, 10);
        const geometry = source.toNonIndexed();
        source.dispose();
        geometry.rotateX(Math.PI / 2);
        geometry.translate(x, y, 0);
        parts.push(geometry);
    }
    const result = new THREE.BufferGeometry();
    for (const name of ['position','normal','uv']) {
        const values = new Float32Array(parts.reduce((sum,g)=>sum+g.attributes[name].array.length,0));
        let offset = 0;
        for (const geometry of parts) { values.set(geometry.attributes[name].array,offset); offset += geometry.attributes[name].array.length; }
        result.setAttribute(name,new THREE.BufferAttribute(values,parts[0].attributes[name].itemSize));
    }
    let start = 0;
    for (const geometry of parts) {
        for (const group of geometry.groups) result.addGroup(start + group.start,group.count,group.materialIndex === 0 ? 1 : 0);
        start += geometry.attributes.position.count; geometry.dispose();
    }
    result.computeBoundingBox();
    result.translate(0,-result.boundingBox.min.y,0);
    result.computeBoundingBox(); result.computeBoundingSphere();
    return result;
}
