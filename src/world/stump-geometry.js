// Tocón facetado con raíces cortas y anillos en la superficie del corte.
// Materiales: corte claro, corteza oscura y anillos.
export function createStumpGeometry(THREE) {
    const parts = [];
    const body = new THREE.CylinderGeometry(0.35,0.46,0.55,12);
    const trunk = body.toNonIndexed(); body.dispose(); trunk.translate(0,0.275,0);
    parts.push({ geometry: trunk, groups: trunk.groups.map(g=>({...g,materialIndex:g.materialIndex===0?1:0})) });
    for (let i=0;i<5;i++) {
        const source = new THREE.ConeGeometry(0.15,0.5,5);
        const root = source.toNonIndexed(); source.dispose();
        root.rotateZ(-Math.PI/3);root.translate(0.39,0.09,0);root.rotateY(i*Math.PI*2/5);
        parts.push({geometry:root,material:1});
    }
    for (const radius of [0.085,0.16,0.245,0.315]) {
        const ring = new THREE.RingGeometry(radius-0.007,radius+0.007,24);
        const geometry = ring.toNonIndexed(); ring.dispose();
        geometry.rotateX(-Math.PI/2);geometry.translate(0,0.551,0);
        parts.push({geometry,material:2});
    }
    const result = new THREE.BufferGeometry();
    for (const name of ['position','normal','uv']) {
        const values = new Float32Array(parts.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));
        let offset=0;
        for(const{geometry}of parts){values.set(geometry.attributes[name].array,offset);offset+=geometry.attributes[name].array.length;}
        result.setAttribute(name,new THREE.BufferAttribute(values,parts[0].geometry.attributes[name].itemSize));
    }
    let start=0;
    for(const part of parts){
        if(part.groups)for(const group of part.groups)result.addGroup(start+group.start,group.count,group.materialIndex);
        else result.addGroup(start,part.geometry.attributes.position.count,part.material);
        start+=part.geometry.attributes.position.count;part.geometry.dispose();
    }
    result.computeBoundingBox();result.translate(0,-result.boundingBox.min.y,0);
    result.computeBoundingBox();result.computeBoundingSphere();
    return result;
}
