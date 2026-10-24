// Bloc pequeño de hojas claras y lomo cosido, apoyado sobre el tablón de la banca.
export function createGardenNotebook(THREE) {
    const group=new THREE.Group();group.name='graham-garden-notebook';
    const cover=new THREE.MeshPhongMaterial({color:0x65503a,flatShading:true,shininess:0});
    const paper=new THREE.MeshPhongMaterial({color:0xe7d8b4,flatShading:true,shininess:0});
    function part(geometry,material,y){const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;mesh.userData={type:'GARDEN_NOTE'};group.add(mesh);return mesh;}
    part(new THREE.BoxGeometry(.25,.015,.33),cover,.0075);
    part(new THREE.BoxGeometry(.237,.026,.31),paper,.028);
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#eee1bd';ctx.fillRect(0,0,96,128);
    ctx.fillStyle='#a8b2a6';for(let y=36;y<120;y+=12)ctx.fillRect(10,y,76,1);
    ctx.fillStyle='#ad8574';ctx.fillRect(16,8,1,112);
    const ink=()=>{ctx.font='22px "Graham Handwriting","Segoe Print",cursive';ctx.fillStyle='#51422f';ctx.fillText('Curioso:',20,29);};ink();
    for(let row=0;row<3;row++)for(let i=0;i<7;i++){ctx.fillStyle='#51422f';ctx.fillRect(22+i*8,47+row*24+((i+row)%3),3+(i%3),1);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
    document.fonts.load('22px "Graham Handwriting"').then(()=>{ink();texture.needsUpdate=true;});
    const page=part(new THREE.PlaneGeometry(.237,.31),new THREE.MeshPhongMaterial({map:texture,shininess:0}),.042);
    page.rotation.x=-Math.PI/2;
    for(let i=0;i<5;i++){const loop=part(new THREE.TorusGeometry(.014,.003,4,6),cover,.039);loop.rotation.y=Math.PI/2;loop.position.set(-.12,.039,-.12+i*.06);}
    return group;
}
