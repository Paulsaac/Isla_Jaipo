import { createBarrelGeometry } from './barrel-geometry.js';

// Dos barriles acostados sostienen un tercero; eje longitudinal hacia Z.
export function createBarrelStackGeometry(THREE) {
    const source = createBarrelGeometry(THREE);
    const radius = 0.49;
    const pieces = [[-radius,radius],[radius,radius],[0,radius + Math.sqrt(3)*radius]].map(([x,y]) => {
        const geometry = source.clone();
        geometry.translate(0,-0.6,0);
        geometry.rotateX(Math.PI/2);
        geometry.translate(x,y,0);
        return geometry;
    });
    const result = new THREE.BufferGeometry();
    for (const name of ['position','normal','uv']) {
        const values = new Float32Array(pieces.reduce((n,g)=>n+g.attributes[name].array.length,0));
        let offset=0;
        for (const geometry of pieces) {
            values.set(geometry.attributes[name].array,offset);
            offset+=geometry.attributes[name].array.length;
        }
        result.setAttribute(name,new THREE.BufferAttribute(values,source.attributes[name].itemSize));
    }
    let start=0;
    for (const geometry of pieces) {
        for (const group of geometry.groups) result.addGroup(start+group.start,group.count,group.materialIndex);
        start+=geometry.attributes.position.count;
        geometry.dispose();
    }
    source.dispose();
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}
