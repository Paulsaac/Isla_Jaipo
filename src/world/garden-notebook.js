// Bloc pequeño de hojas claras y lomo cosido, apoyado sobre el tablón de la banca.
export function createGardenNotebook(THREE) {
    const group=new THREE.Group();group.name='graham-garden-notebook';
    const cover=new THREE.MeshPhongMaterial({color:0x65503a,flatShading:true,shininess:0});
    const paper=new THREE.MeshPhongMaterial({color:0xe7d8b4,flatShading:true,shininess:0});
    function part(geometry,material,y){const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;mesh.userData={type:'GARDEN_NOTE'};group.add(mesh);return mesh;}
    part(new THREE.BoxGeometry(.25,.015,.33),cover,.0075);
    part(new THREE.BoxGeometry(.237,.026,.31),paper,.028);
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=40;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#eee1bd';ctx.fillRect(0,0,32,40);
    // Cuatro renglones de trazos pixelados, sin letras; el primero en negrita.
    ctx.fillStyle='#51422f';
    for(let row=0;row<4;row++)for(let word=0;word<3;word++) {
        const x=6+word*7,y=7+row*8;
        ctx.fillRect(x,y,word===2&&row===3?3:5,row===0?3:1);
        if(row>0)ctx.fillRect(x+1,y-1+(word+row)%2,2,1);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
    const page=part(new THREE.PlaneGeometry(.237,.31),new THREE.MeshPhongMaterial({map:texture,shininess:0}),.042);
    page.rotation.x=-Math.PI/2;
    for(let i=0;i<5;i++){const loop=part(new THREE.TorusGeometry(.014,.003,4,6),cover,.039);loop.rotation.y=Math.PI/2;loop.position.set(-.12,.039,-.12+i*.06);}
    return group;
}
