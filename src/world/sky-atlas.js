// Despliegue 4x3: -Z, -X, +Z, +X en la fila central;
// +Y sobre +Z, -Y debajo. Se comparte una imagen sin recortarla ni alterarla.
export function createSkyAtlas(THREE, loader, url) {
    const texture = loader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    const geometry = new THREE.BoxGeometry(1400, 1400, 1400);
    const cells = [[3,1],[1,1],[2,0],[2,2],[2,1],[0,1]];
    const uv = geometry.attributes.uv;
    cells.forEach(([column,row],face) => {
        for(let vertex=face*4;vertex<face*4+4;vertex++) {
            uv.setXY(vertex,(column+uv.getX(vertex))/4,(2-row+uv.getY(vertex))/3);
        }
    });
    uv.needsUpdate=true;
    return {geometry,texture};
}
