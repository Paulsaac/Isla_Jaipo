// Extensión solo visual: las UV interiores conservan escala y alineación del mapa.
export function createOceanSurfaceGeometry(THREE, mapWidth, mapHeight, unitSize, viewDistance) {
    const width=mapWidth*unitSize,height=mapHeight*unitSize,margin=viewDistance*2;
    const geometry=new THREE.PlaneGeometry(width+margin*2,height+margin*2);
    const uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,
        (uv.getX(i)-0.5)*(width+margin*2)/width+0.5,
        (uv.getY(i)-0.5)*(height+margin*2)/height+0.5);
    uv.needsUpdate=true;
    return geometry;
}

// El terreno repite fondo.png una vez por celda, con origen en su primer vértice.
export function createOceanSeabedGeometry(THREE, mapWidth, mapHeight, unitSize, viewDistance) {
    const geometry=createOceanSurfaceGeometry(THREE,mapWidth,mapHeight,unitSize,viewDistance);
    const uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*mapWidth-0.5,uv.getY(i)*mapHeight-0.5);
    uv.needsUpdate=true;
    return geometry;
}
