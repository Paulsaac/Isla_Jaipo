// Papel y tinta sobre cuadrícula de 64×80: sin trazos suavizados ni texturas externas.
function createPaperTexture(THREE,{sigil=false,torn=false}={}) {
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=80;
    const ctx=canvas.getContext('2d');
    for(let y=1;y<79;y++) {
        const left=torn ? [2,3,1,4,2,2,3,1,2][y%9] : 1;
        ctx.fillStyle=y%13===0 ? '#d8c69d' : '#e9dab5';
        ctx.fillRect(left,y,63-left,1);
    }
    ctx.fillStyle='#d1bd91';
    for(let y=5;y<76;y+=7)ctx.fillRect(torn ? 4 : 2,y,1,2);
    function dot(x,y,color='#20202e',size=3) {ctx.fillStyle=color;ctx.fillRect(x,y,size,size);}
    function line(x0,y0,x1,y1,color='#20202e',size=3) {
        const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;
        let error=dx+dy;
        while(true) {
            dot(x0,y0,color,size);if(x0===x1&&y0===y1)break;
            const next=2*error;if(next>=dy){error+=dy;x0+=sx;}if(next<=dx){error+=dx;y0+=sy;}
        }
    }
    if(sigil) {
        // Anillo, ángulo largo, diagonal, arco y gancho de la referencia del usuario.
        for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++) {
            const d=x*x+y*y;if(d>=4 && d<=20)dot(9+x,22+y,'#20202e',1);
        }
        for(const path of [
            [[11,26],[16,35],[56,20],[20,66]],
            [[44,13],[44,17],[45,21],[47,26],[50,31],[54,35],[57,36]],
            [[25,38],[31,34]],
            [[24,56],[30,62],[31,59],[33,58],[35,59],[35,63],[36,66],[39,69],[41,71]]
        ])for(let i=1;i<path.length;i++)line(...path[i-1],...path[i]);
    } else {
        // Notas de un manuscrito, a escala de píxel y con márgenes amplios.
        for(let row=0;row<8;row++) {
            const y=10+row*7;let x=8;
            for(let word=0;word<5;word++) {
                const width=3+(row*3+word*7)%6;
                line(x,y,x+width,y,'#86785e',1);x+=width+3;
                if(x>51)break;
            }
        }
        line(8,68,37,68,'#9e8a65',1);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;
    texture.name=sigil ? 'wizard-sigil-pixel-paper' : 'wizard-manuscript-pixel-page';
    return texture;
}

export function createWorkshopBook(THREE) {
    const group=new THREE.Group();group.name='wizard-open-book-and-torn-pages';
    const cover=new THREE.MeshPhongMaterial({color:0x68463c,shininess:0});
    const pageEdges=new THREE.MeshPhongMaterial({color:0xd3c29a,shininess:0});
    const pageFace=new THREE.MeshPhongMaterial({map:createPaperTexture(THREE),shininess:0,
        alphaTest:0.5,side:THREE.DoubleSide});
    const sigilFace=new THREE.MeshPhongMaterial({map:createPaperTexture(THREE,{sigil:true,torn:true}),
        shininess:0,alphaTest:0.5,side:THREE.DoubleSide});
    function box(parent,w,h,d,x,y,z,material) {
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
        mesh.position.set(x,y,z);parent.add(mesh);return mesh;
    }
    function page(parent,w,d,y,material) {
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);
        mesh.rotation.x=-Math.PI/2;mesh.position.y=y;parent.add(mesh);return mesh;
    }
    const book=new THREE.Group();book.name='wizard-open-book';
    book.position.set(1.24,1.101,0.26);book.rotation.y=-0.10;group.add(book);
    for(const side of [-1,1]) {
        box(book,0.326,0.018,0.49,side*0.16,0.010,0,cover);
        const half=new THREE.Group();half.position.set(side*0.155,0.06,0);half.rotation.z=-side*0.10;
        book.add(half);
        box(half,0.30,0.04,0.46,0,0,0,pageEdges);
        page(half,0.30,0.46,0.021,pageFace);
    }
    box(book,0.022,0.035,0.48,0,0.027,0,cover);
    // El frente del escritorio es -Z: hojas junto al borde y libro al fondo (+Z).
    for(let i=0;i<2;i++) {
        const sheet=new THREE.Group();sheet.name=`wizard-torn-sigil-page-${i+1}`;
        sheet.position.set(1.10+i*0.055,1.103+i*0.003,-0.33+i*0.025);
        sheet.rotation.y=Math.PI+(i===0 ? -0.13 : 0.10);
        page(sheet,0.42,0.44,0,sigilFace);group.add(sheet);
    }
    group.traverse(object=>{if(object.isMesh)object.userData.type='TELESCOPE_WORKBENCH';});
    return group;
}
