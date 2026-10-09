// Barril facetado con cuerpo abombado, tapas y aros metálicos.
export function createBarrelGeometry(THREE) {
    const pieces = [];
    const profile = [ [0,0], [.37,0], [.4,.08], [.46,.3], [.48,.6], [.46,.9], [.4,1.12], [.37,1.2], [0,1.2] ];
    const body = new THREE.LatheGeometry(profile.map(([r,y]) => new THREE.Vector2(r,y)), 12);
    pieces.push({geometry:body.toNonIndexed(), material:0});
    body.dispose();
    for (const [y,r] of [[.14,.42],[.6,.49],[1.06,.42]]) {
        const band = new THREE.CylinderGeometry(r,r,.07,12,1,true);
        const geometry = band.toNonIndexed();
        band.dispose();
        geometry.translate(0,y,0);
        pieces.push({geometry,material:1});
    }
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
