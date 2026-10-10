// Despliegue 4x3: -Z, -X, +Z, +X en la fila central;
// +Y sobre +Z, -Y debajo. Se comparte una imagen sin recortarla ni alterarla.
export function createSkyAtlas(THREE, loader, url, {faceQuarterTurns = [], mirroredFaces = []} = {}) {
    const texture = loader.load(url, imageTexture => {
        // Muestrear dentro de cada cara: algunos atlas tienen un borde transparente.
        const insetU = 1.5 / imageTexture.image.width;
        const insetV = 1.5 / imageTexture.image.height;
        cells.forEach(([column,row],face) => {
            for(let localVertex=0;localVertex<4;localVertex++) {
                let u = localVertex % 2;
                let v = localVertex < 2 ? 1 : 0;
                if(mirroredFaces[face]) u=1-u;
                for(let turn=0;turn<(faceQuarterTurns[face] || 0);turn++) {
                    [u,v]=[v,1-u];
                }
                uv.setXY(face*4+localVertex,
                    column/4+insetU+u*(1/4-2*insetU),
                    (2-row)/3+insetV+v*(1/3-2*insetV));
            }
        });
        uv.needsUpdate=true;
    });
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
