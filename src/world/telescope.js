// Dos paneles de 128 px: tubo fino y objetivo, dibujados sin suavizado.
function createCartography(THREE) {
    const canvas=document.createElement('canvas');
    canvas.width=256;canvas.height=128;
    const ctx=canvas.getContext('2d');
    const pixel=(x,y,color,w=1,h=1)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    // Siluetas de 17 píxeles: la misma paleta dorada de los mapas originales.
    const figures={
        wizard:[
            '..........L......',
            '.........LSL.....',
            '........LSSSL....',
            '.......LLSSLLL...',
            '......CCSSSCC....',
            '.......LCCL......',
            '.......CGCL......',
            '......CCCLSSL....',
            '.....LSSCLSSSL...',
            '...CCSSSCLSSSL...',
            '..LLLLLLLLSSSL...',
            '...LG..CCCLSSL...',
            '...LLLLLLLLLLL...',
            '....G.LSSL.G.L...',
            '....G.LSSL.LLL...',
            '....G.LSSL.G.G...',
            '......LSS..G.G...',
            '.....LSS...G.G...',
            '....LSSL...G.G...',
            '...LLL.....G.G...',
            '....LL...........'
        ],
        fairy:[
            '........SS.......',
            '.......SSSL......',
            '.......SCCCL.....',
            '.......SCCL......',
            '.......LCL.......',
            '......LCCCL......',
            '..LL..LCL.CCCCCC.',
            '.LCCL.LSL.....CC.',
            '.LCCCLLSL........',
            '..LCCLSSL........',
            '...LCLSSCL.......',
            '..LCCLSSCL.......',
            '.LCCLSSCCL.......',
            '.LL.LSSCCL.......',
            '....LSSCCL.......',
            '...LSSCCCL.......',
            '..LSSCCCL........',
            '..LLLCCL.........',
            '...LC.LC.........',
            '..CC..LC.........',
            '......CC.........'
        ]
    };
    const figureColors={L:'#f0dc9e',S:'#aa9d60',C:'#e7d8a3',G:'#ad8845'};
    function drawFigure(cx,cy,kind,vertical=1) {
        const dot=(x,y,color)=>pixel(cx+x,cy+y*vertical,color,1,vertical);
        if (kind==='celestial-astrolabe') {
            // Astrolabio de la referencia: limbo, arcos de la araña y regla oblicua.
            for (let y=-9;y<=9;y++) for (let x=-9;x<=9;x++) {
                const d=x*x+y*y;
                if (d>85) continue;
                if (d>=65) {dot(x,y,'#f0dc9e');continue;}
                const upper=x*x+(y+2)**2;
                const left=(x+5)**2+(y-4)**2, right=(x-5)**2+(y-4)**2;
                if ((upper>=30 && upper<=42) || (y>=1 && ((left>=38 && left<=48) || (right>=38 && right<=48)))) {
                    dot(x,y,'#aa9d60');
                }
                if (y===1 && Math.abs(x)<=7) dot(x,y,'#f0dc9e');
            }
            for (const [x,y] of [[0,-11],[-1,-10],[1,-10],[0,-9],[-6,-6],[6,-6],[-8,0],[8,0],[-6,6],[6,6],[0,8]]) {
                dot(x,y,'#ad8845');
            }
            for (const [x,y] of [[-4,-4],[3,-6],[-2,5],[5,4]]) dot(x,y,'#e7d8a3');
            for (let x=-7;x<=8;x++) {
                const y=1-Math.round(x*0.65);
                dot(x,y,'#f0dc9e');dot(x,y+1,'#e7d8a3');
            }
            for (let y=0;y<=2;y++) for (let x=-1;x<=1;x++) dot(x,y,'#e7d8a3');
            dot(0,1,'#ad8845');
            return;
        }
        if (kind==='astrolabe') {
            // Dos aros concéntricos, escala, alidada diagonal y anilla superior.
            for (let y=-9;y<=9;y++) for (let x=-9;x<=9;x++) {
                const d=x*x+y*y;
                if ((d>=65 && d<=85) || (d>=22 && d<=32)) dot(x,y,'#f0dc9e');
            }
            for (let n=-7;n<=7;n++) {
                dot(n,-n,'#ad8845');
                if (n%3===0) {dot(n,0,'#aa9d60');dot(0,n,'#aa9d60');}
            }
            dot(0,0,'#e7d8a3');dot(1,0,'#e7d8a3');
            for (const [x,y] of [[0,-11],[-1,-10],[1,-10],[0,-9],[-2,10],[-1,10],[0,10],[1,10],[2,10]]) dot(x,y,'#f0dc9e');
            return;
        }
        const image=figures[kind];
        image.forEach((row,y)=>[...row].forEach((color,x)=>{
            if (figureColors[color]) dot(x-8,y-Math.floor(image.length/2),figureColors[color]);
        }));
    }
    pixel(0,0,'#414b91',256,128);
    for (let y=0;y<120;y++) for (let x=0;x<256;x++) {
        // Pocos colores planos; el grano es estable entre objetos y sesiones.
        const grain=(x*13+y*7+(x*y)%19)%47;
        if (grain===0) pixel(x,y,'#626fb0');
        if (grain===1) pixel(x,y,'#30396f');
    }
    for (let column=0;column<4;column++) for (let row=0;row<2;row++) {
        const cx=column*32+16, cy=row*56+30;
        for (let y=-13;y<=13;y++) for (let x=-13;x<=13;x++) {
            const distance=x*x+y*y;
            if (distance>169) continue;
            let color=distance>144 ? '#ad8845' : distance>121 ? '#f0dc9e' : '#24385f';
            pixel(cx+x,cy+y,color);
        }
        drawFigure(cx,cy,['wizard','fairy','astrolabe'][(column+row)%3]);
        // Conectores y pequeñas leyendas de pergamino entre medallones.
        pixel(cx-12,cy-22,'#d5bd77',24,1);
        pixel(cx-10,cy-21,'#e9dba1',2,4);
        pixel(cx+9,cy-21,'#e9dba1',2,4);
        pixel(cx-6,cy+17,'#e5d9a6',12,7);
        for (let line=0;line<3;line++) pixel(cx-4,cy+18+line*2,'#8a916f',7-line,1);
        pixel(cx-16,cy+13,'#d5bd77',2,3);
        pixel(cx+14,cy+13,'#d5bd77',2,3);
    }
    // Una sola fila longitudinal: cuatro emblemas rodean el objetivo ancho.
    for (let column=0;column<4;column++) {
        const emblemX=128+column*32+16, emblemY=60;
        for (let y=-25;y<=25;y++) for (let x=-14;x<=14;x++) {
            const distance=(x/14)**2+(y/25)**2;
            if (distance>1) continue;
            pixel(emblemX+x,emblemY+y,distance>=0.72
                ? distance>0.90 ? '#ad8845' : '#f0dc9e' : '#24385f');
        }
        // Compensar las UV del objetivo sobre la cuadrícula existente, sin remuestreo.
        drawFigure(emblemX,emblemY,['fairy','celestial-astrolabe','wizard','fairy'][column],2);
    }
    pixel(0,124,'#ffffff',256,4); // Reserva blanca para aros y lentes de color sólido.
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.magFilter=texture.minFilter=THREE.NearestFilter;
    texture.generateMipmaps=false;
    texture.name='telescope-pixel-cartography';
    return texture;
}

// Ocho caras visibles y aros biselados; el objetivo apunta hacia -Z.
export function createTelescope(THREE) {
    const parts=[], sides=8;
    function add(source,color,transform,textured=false) {
        const geometry=source.index ? source.toNonIndexed() : source;
        if (geometry!==source) source.dispose();
        transform?.(geometry);
        const tint=new THREE.Color(color), colors=new Float32Array(geometry.attributes.position.count*3);
        const uv=geometry.attributes.uv;
        for (let i=0;i<uv.count;i++) {
            colors.set([tint.r,tint.g,tint.b],i*3);
            if (textured) {
                uv.setX(i,uv.getX(i)*0.5+(textured==='objective' ? 0.5 : 0));
                uv.setY(i,0.0625+uv.getY(i)*0.9375);
            }
            else uv.setXY(i,0.5,1.5/128);
        }
        if (textured) for (const group of geometry.groups) {
            if (group.materialIndex===0) continue;
            for (let i=group.start;i<group.start+group.count;i++) {
                uv.setXY(i,0.5,1.5/128);
                colors.set([0.075,0.28,0.35],i*3);
            }
        }
        geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
        parts.push(geometry);
    }
    function tube(radius,length,z,color,textured=false,otherRadius=radius) {
        add(new THREE.CylinderGeometry(radius,otherRadius,length,sides),color,g=>{
            g.rotateY(Math.PI/8);g.rotateX(Math.PI/2);g.translate(0,0,z);
        },textured);
    }
    function rim(radius,z) {
        tube(radius-0.004,0.009,z-0.018,0x344b50,false,radius);
        tube(radius,0.027,z,0x20343b);
        tube(radius,0.009,z+0.018,0x344b50,false,radius-0.004);
    }
    tube(0.057,0.37,0.08,0xffffff,true);
    tube(0.079,0.25,-0.230,0xffffff,'objective');
    rim(0.064,0.28);
    rim(0.087,-0.365);
    rim(0.081,-0.10);
    for (const [r,z] of [[0.058,0.24],[0.058,-0.06],[0.080,-0.32],[0.080,-0.15]]) tube(r,0.008,z,0xd6bd77);
    tube(0.071,0.003,-0.389,0x183a4a);
    tube(0.038,0.003,0.304,0x102c39);
    add(new THREE.CircleGeometry(0.013,4),0x91c8cf,g=>{g.rotateY(Math.PI);g.translate(-0.021,0.022,-0.391);});
    const geometry=new THREE.BufferGeometry();
    for (const name of ['position','normal','color','uv']) {
        const data=new Float32Array(parts.reduce((sum,p)=>sum+p.attributes[name].array.length,0));
        let offset=0;
        for (const part of parts) {data.set(part.attributes[name].array,offset);offset+=part.attributes[name].array.length;}
        geometry.setAttribute(name,new THREE.BufferAttribute(data,name==='uv' ? 2 : 3));
    }
    for (const part of parts) part.dispose();
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    return new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({map:createCartography(THREE),
        vertexColors:true,flatShading:true,shininess:4,specular:0x182326}));
}
