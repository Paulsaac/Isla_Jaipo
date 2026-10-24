import {createGardenNotebook} from './garden-notebook.js';
// Huerto de Graham: cultivos, yerba mate y herramientas, con una malla por elemento.
export function createKitchenGarden(THREE, origin, getTerrainHeight, woodTexture = null, soilTexture = null) {
    const material = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 0 });
    const soilMaterial = new THREE.MeshPhongMaterial({map:soilTexture,color:0xb5a28e,shininess:0});
    const planterWoodMaterial = new THREE.MeshPhongMaterial({map:woodTexture,color:0xffd9a5,shininess:0});
    const colors = { soil: 0x513827, wood: 0x80603d, edge: 0x62472e, green: 0x42713a, light: 0x77a44b, red: 0xb83b24, orange: 0xc87429 };
    let pieces = [];
    const models = [];
    function add(source, color, transform) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        transform?.(geometry);
        const tint = new THREE.Color(color), data = new Float32Array(geometry.attributes.position.count * 3);
        for (let i=0; i<data.length; i+=3) { data[i]=tint.r; data[i+1]=tint.g; data[i+2]=tint.b; }
        geometry.setAttribute('color', new THREE.BufferAttribute(data,3));
        geometry.userData.gardenMaterial=color===colors.soil?1:0;
        const p=geometry.attributes.position,n=geometry.attributes.normal,uv=new Float32Array(p.count*2);
        for(let i=0;i<p.count;i++) {
            const vertical=Math.abs(n.getY(i))<.5;
            uv[i*2]=(vertical&&Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/.8;
            uv[i*2+1]=(vertical?p.getY(i):p.getZ(i))/.8;
        }
        geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
        pieces.push(geometry);
    }
    const box = (w,h,d,x,y,z,color) => add(new THREE.BoxGeometry(w,h,d),color,g=>g.translate(x,y,z));
    function stem(a,b,r,color) {
        const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), direction=end.clone().sub(start);
        add(new THREE.CylinderGeometry(r*0.75,r,direction.length(),5),color,g=>{
            g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
            g.translate(...start.add(end).multiplyScalar(0.5).toArray());
        });
    }
    function leaf(x,y,z,size,angle,tilt,color) {
        add(new THREE.SphereGeometry(1,5,3),color,g=>{
            g.scale(size*0.43,size*0.12,size); g.rotateX(tilt); g.rotateY(angle); g.translate(x,y,z);
        });
    }
    function carrotLeaflet(start, tip, width, color) {
        const a = new THREE.Vector3(...start), b = new THREE.Vector3(...tip);
        const middle = a.clone().lerp(b,0.55);
        middle.y += 0.008;
        const side = new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3(0,1,0)).normalize().multiplyScalar(width);
        const left = middle.clone().add(side), right = middle.clone().sub(side);
        const vertices = [];
        for (const triangle of [[a,left,right],[left,b,right],[right,left,a],[right,b,left]]) {
            for (const vertex of triangle) vertices.push(vertex.x,vertex.y,vertex.z);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        geometry.computeVertexNormals();
        add(geometry,color);
    }
    function tomato(x,y,z,r=0.085) {
        add(new THREE.IcosahedronGeometry(r,1),colors.red,g=>{g.scale(1,0.88,1);g.translate(x,y,z);});
        for(let i=0;i<3;i++) leaf(x,y+r*0.8,z,r*0.4,i*Math.PI*2/3,0,colors.green);
    }
    function mateLeaf(start, end, width, color) {
        const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
        const direction = b.clone().sub(a);
        const side = direction.clone().cross(new THREE.Vector3(0,1,0)).normalize();
        const ridge = a.clone().lerp(b,0.5).add(new THREE.Vector3(0,0.018,0));
        const outline = [a];
        // Borde ovalado con dientes pequeños y nervio central elevado.
        for (const sign of [1,-1]) {
            for (let i=1;i<=7;i++) {
                const t = sign === 1 ? i/8 : 1-i/8;
                const spread = Math.sin(Math.PI*t) * width * (i%2 ? 1 : 0.88);
                outline.push(a.clone().addScaledVector(direction,t).addScaledVector(side,sign*spread));
            }
            if (sign === 1) outline.push(b);
        }
        const vertices = [];
        for (let i=0;i<outline.length;i++) {
            const next = outline[(i+1)%outline.length];
            for (const vertex of [ridge,outline[i],next,ridge,next,outline[i]])
                vertices.push(vertex.x,vertex.y,vertex.z);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        geometry.computeVertexNormals();
        add(geometry,color);
    }
    function finish(id,x,z,parent=null) {
        const geometry=new THREE.BufferGeometry();
        for(const attribute of ['position','normal','color','uv']) {
            const data=new Float32Array(pieces.reduce((sum,g)=>sum+g.attributes[attribute].array.length,0));
            let offset=0;
            for(const part of pieces) {data.set(part.attributes[attribute].array,offset);offset+=part.attributes[attribute].array.length;}
            geometry.setAttribute(attribute,new THREE.BufferAttribute(data,attribute==='uv'?2:3));
        }
        let first=0;
        for(const part of pieces){geometry.addGroup(first,part.attributes.position.count,part.userData.gardenMaterial);first+=part.attributes.position.count;}
        for(const part of pieces) part.dispose();
        pieces=[];
        geometry.computeBoundingBox(); geometry.computeBoundingSphere();
        const model=new THREE.Mesh(geometry,[material,soilMaterial,planterWoodMaterial]);
        model.name=`graham-garden-${id}`;
        model.userData={type:'GARDEN',id:model.name};
        if(parent) {
            model.position.set(x,0,z);parent.add(model);
        } else {
            model.position.set(origin.x+x,getTerrainHeight(origin.x+x,origin.z+z),origin.z+z);
            models.push(model);
        }
        return model;
    }
    function soilClearance(x,z,width,depth) {
        const base=getTerrainHeight(origin.x+x,origin.z+z);
        let high=base;
        // Cubrir toda la huella, incluidos los vértices del borde, sin planos coplanares.
        for(let dz=-depth/2;dz<=depth/2+.001;dz+=depth/12)
            for(let dx=-width/2;dx<=width/2+.001;dx+=width/12)
                high=Math.max(high,getTerrainHeight(origin.x+x+dx,origin.z+z+dz));
        return Math.max(.14,high-base+.055);
    }
    for(let row=0;row<3;row++) {
        // La base penetra en el terreno; los bordes de madera quedan bajos.
        box(1.1,0.4,2.65,0,-0.08,0,colors.soil);
        for(const side of [-1,1]) {
            box(0.07,0.3,2.79,side*0.585,0.055,0,colors.wood);
            box(1.24,0.3,0.07,0,0.055,side*1.36,colors.wood);
        }
        for(const z of [-0.88,0,0.88]) {
            if(row===0) {
                stem([0.1,0.12,z],[0.1,1.28,z],0.022,colors.wood);
                stem([0,0.12,z],[0.015,1.12,z],0.017,colors.green);
                for(let i=0;i<4;i++) {
                    const side=i%2 ? -1 : 1, y=0.42+i*0.17;
                    stem([0,y-0.08,z],[side*0.22,y,z+0.06],0.008,colors.green);
                    leaf(side*0.19,y,z+0.065,0.16,side*0.8,0.3,colors.green);
                    if(i<3) tomato(side*0.16,y-0.08,z+0.14);
                }
                box(0.13,0.015,0.025,0.045,0.76,z,colors.edge);
            } else if(row===1) {
                for(const x of [-0.25,0.25]) {
                    add(new THREE.IcosahedronGeometry(0.15,1),colors.light,g=>{g.scale(1,0.85,1);g.translate(x,0.25,z);});
                    for(let i=0;i<6;i++) {
                        const angle=i*Math.PI/3;
                        leaf(x+Math.sin(angle)*0.09,0.22+(i%2)*0.025,z+Math.cos(angle)*0.09,0.19,angle,-0.45,i%2 ? colors.green : colors.light);
                    }
                }
            } else {
                for(const x of [-0.22,0.22]) {
                    add(new THREE.ConeGeometry(0.055,0.24,6),colors.orange,g=>{g.rotateZ(Math.PI);g.translate(x,0.07,z);});
                    for(let i=0;i<4;i++) {
                        const angle=i*Math.PI/2+0.2, radialX=Math.cos(angle), radialZ=Math.sin(angle);
                        const base=[x,0.19,z];
                        const tip=[x+radialX*0.14,0.48+(i%2)*0.035,z+radialZ*0.14];
                        stem(base,tip,0.006,colors.green);
                        // Cada fronda tiene pares de foliolos pequeños, como una hoja de zanahoria.
                        for(const t of [0.36,0.57,0.76]) for(const side of [-1,1]) {
                            const start=[x+radialX*0.14*t,0.19+(tip[1]-0.19)*t,z+radialZ*0.14*t];
                            const reach=0.058*(1-t*0.35);
                            carrotLeaflet(start,[start[0]+radialX*0.035-side*radialZ*reach,
                                start[1]+0.045,start[2]+radialZ*0.035+side*radialX*reach],
                                0.018,i%2 ? colors.green : colors.light);
                        }
                        carrotLeaflet(tip,[tip[0]+radialX*0.025,tip[1]+0.055,tip[2]+radialZ*0.025],
                            0.018,colors.green);
                    }
                }
            }
        }
        const bedX=(row-1)*1.85,soilTop=soilClearance(bedX,0,1.17,2.72);
        for(const part of pieces)part.translate(0,soilTop-.12,0);
        const bed=finish(['tomatoes','lettuce','carrots'][row],bedX,0);
        bed.userData.soilBed={width:1.1,depth:2.65,top:soilTop};
    }
    // Jardinera elevada de seis compartimentos, junto a los canteros existentes.
    {
        const x=4.2,z=-2.5,soilTop=Math.max(.43,soilClearance(x,z,2.26,2.76));
        box(2.2,.55,2.7,0,soilTop-.275,0,colors.soil);
        const plank=(w,h,d,px,py,pz)=>{box(w,h,d,px,py,pz,colors.wood);pieces.at(-1).userData.gardenMaterial=2;};
        for(let tier=0;tier<3;tier++) {
            const y=soilTop-.37+tier*.17;
            for(const side of [-1,1]){plank(.09,.16,2.86,side*1.15,y,0);plank(2.4,.16,.09,0,y,side*1.385);}
        }
        for(const px of [-1.14,1.14])for(const pz of [-1.38,1.38])plank(.13,.57,.13,px,soilTop-.13,pz);
        plank(.045,.10,2.7,0,soilTop+.035,0);
        for(const pz of [-.45,.45])plank(2.2,.10,.045,0,soilTop+.035,pz);
        for(let row=0;row<3;row++)for(let col=0;col<2;col++) {
            const px=col? .56:-.56,pz=(row-1)*.9;
            // Albahaca, orégano y menta: matas ramificadas y pares de hojas,
            // con tamaños y tonos distintos, sin frutos ni rosetas de hortaliza.
            for(let branch=0;branch<6;branch++) {
                const angle=branch*Math.PI/3+col*.45,dx=Math.cos(angle),dz=Math.sin(angle);
                const height=[.52,.36,.58][row]+(branch%3)*.055+col*.025;
                const reach=row===1?.19:.13;
                const bx=px+dx*.06,bz=pz+dz*.06;
                stem([bx,soilTop,bz],[bx+dx*reach,soilTop+height,bz+dz*reach],row===1?.006:.009,0x4e7138);
                for(let tier=0;tier<4;tier++)for(const side of [-1,1]) {
                    const t=.25+tier*.2,y=soilTop+height*t;
                    const sx=bx+dx*reach*t,sz=bz+dz*reach*t;
                    const a=angle+tier*.8+side*Math.PI/2;
                    const length=[.20,.10,.17][row],lx=Math.sin(a),lz=Math.cos(a);
                    if(row===2)mateLeaf([sx,y,sz],[sx+lx*length,y+.035,sz+lz*length],.058,
                        (tier+branch)%2?0x3e783d:0x649c4b);
                    else leaf(sx+lx*length*.48,y+.018,sz+lz*length*.48,length*.58,a,-.20,
                        row===0?((tier+branch)%2?0x578b3e:0x84ae53):((tier+branch)%2?0x597448:0x78915b));
                }
            }
        }
        const bed=finish('mixed-planter',x,z);bed.userData.soilBed={width:2.2,depth:2.7,top:soilTop};
        const uv=bed.geometry.attributes.uv;
        for(const group of bed.geometry.groups)if(group.materialIndex===2)
            for(let i=group.start;i<group.start+group.count;i++)
                uv.setXY(i,((uv.getX(i)%1)+1)%1,.565+(((uv.getY(i)%1)+1)%1)*.115);
        uv.needsUpdate=true;
    }
    for(let crate=0;crate<2;crate++) {
        box(0.66,0.06,0.48,0,0.03,0,colors.edge);
        for(const x of [-0.3,0.3]) for(const z of [-0.21,0.21]) box(0.045,0.34,0.045,x,0.17,z,colors.edge);
        for(const side of [-1,1]) for(const y of [0.11,0.25]) {
            box(0.67,0.095,0.04,0,y,side*0.23,colors.wood);
            box(0.04,0.095,0.5,side*0.32,y,0,colors.wood);
        }
        if(crate===0) for(const x of [-0.17,0,0.17]) tomato(x,0.14,0,0.075);
        finish(`crate-${crate+1}`,-1.95+crate*0.9,1.95+crate*0.12);
    }
    // Arbustos jóvenes de yerba mate entre el muro y los canteros existentes.
    for (let plant=0;plant<3;plant++) {
        const height = [1.04,1.19,0.96][plant];
        add(new THREE.IcosahedronGeometry(0.34,1),colors.soil,g=>{
            g.scale(1,0.33,0.9); g.translate(0,.025,0);
        });
        stem([0,0,0],[0.025,height*0.72,0],0.023,colors.edge);
        stem([0.025,height*0.55,0],[0.015,height,0.02],0.012,0x53733b);
        for (let tier=0;tier<3;tier++) for (let branch=0;branch<4;branch++) {
            const angle = branch*Math.PI/2 + tier*0.67 + plant*0.8;
            const dx = Math.cos(angle), dz = Math.sin(angle);
            const y = height*(0.27+tier*0.22), reach = 0.25-tier*0.025;
            stem([0.015,y,0],[dx*reach,y+0.15,dz*reach],0.008,0x53733b);
            for (const [t,sign] of [[0.46,1],[0.82,-1]]) {
                const start = [dx*reach*t,y+0.15*t,dz*reach*t];
                mateLeaf(start,[start[0]+dx*0.16-dz*sign*0.10,start[1]+0.055,
                    start[2]+dz*0.16+dx*sign*0.10],0.059,
                    (branch+tier)%2 ? 0x315e32 : 0x4b793b);
            }
        }
        mateLeaf([0.015,height-0.07,0.02],[0.07,height+0.08,0.17],0.055,0x688b43);
        finish(`yerba-mate-${plant+1}`,(plant-1)*1.85,-3.7+(plant%2)*0.25);
    }

    const iron = 0x626c6d, darkIron = 0x404b4c, handle = 0xa17c4c;
    {
        const blade = new THREE.Shape();
        blade.moveTo(-0.12,0.43); blade.lineTo(-0.18,0.32);
        blade.lineTo(-0.16,0.12); blade.lineTo(0,0.015);
        blade.lineTo(0.16,0.12); blade.lineTo(0.18,0.32);
        blade.lineTo(0.12,0.43); blade.closePath();
        add(new THREE.ExtrudeGeometry(blade,{depth:0.035,bevelEnabled:true,
            bevelSize:0.008,bevelThickness:0.008,bevelSegments:1,steps:1}),iron);
        box(0.065,0.22,0.065,0,0.44,0.018,darkIron);
        stem([0,0.44,0.018],[0,1.38,0.018],0.026,handle);
        for (const side of [-1,1]) {
            stem([0,1.36,0.018],[side*0.11,1.47,0.018],0.018,darkIron);
            stem([side*0.11,1.47,0.018],[side*0.11,1.60,0.018],0.018,darkIron);
        }
        stem([-0.11,1.60,0.018],[0.11,1.60,0.018],0.025,handle);
        // Inclinar hacia la casa y apoyar el extremo superior en su cara sur (z=448.5 celdas).
        for (const part of pieces) {
            part.rotateZ(-0.055);
            part.rotateX(-0.23);
            part.computeBoundingBox();
        }
        const back = Math.min(...pieces.map(part=>part.boundingBox.min.z));
        const bottom = Math.min(...pieces.map(part=>part.boundingBox.min.y));
        const model = finish('shovel',2.3,-7-back+0.025);
        model.position.y -= bottom;
    }

    // Banca sin respaldo: tablón grueso y dos patas de tabla con recorte triangular.
    const benchX = 0.65, benchZ = -6.35;
    const benchGround = getTerrainHeight(origin.x+benchX,origin.z+benchZ);
    const seat = new THREE.Shape();
    seat.moveTo(-0.94,-0.24); seat.lineTo(0.94,-0.24);
    seat.lineTo(0.94,0.24); seat.lineTo(-0.94,0.24); seat.closePath();
    add(new THREE.ExtrudeGeometry(seat,{depth:0.08,steps:1,bevelEnabled:true,
        bevelSize:0.006,bevelThickness:0.006,bevelSegments:1}),0xffe3ad,g=>{
        g.rotateX(Math.PI/2); g.translate(0,0.49,0);
    });
    for (const x of [-0.72,0.72]) {
        // Ajustar cada apoyo al terreno, manteniendo el asiento nivelado.
        const back = getTerrainHeight(origin.x+benchX+x,origin.z+benchZ-0.205)-benchGround-0.008;
        const front = getTerrainHeight(origin.x+benchX+x,origin.z+benchZ+0.205)-benchGround-0.008;
        const panel = new THREE.Shape();
        panel.moveTo(-0.205,back); panel.lineTo(-0.075,back);
        panel.lineTo(0,Math.max(back,front)+0.15); panel.lineTo(0.075,front);
        panel.lineTo(0.205,front); panel.lineTo(0.205,0.42);
        panel.lineTo(-0.205,0.42); panel.closePath();
        add(new THREE.ExtrudeGeometry(panel,{depth:0.085,steps:1,bevelEnabled:true,
            bevelSize:0.004,bevelThickness:0.004,bevelSegments:1}),0xe9c895,g=>{
            g.rotateY(-Math.PI/2); g.translate(x+0.0425,0,0);
        });
    }
    for (const z of [-0.16,0.16]) box(1.44,0.12,0.055,0,0.35,z,0xd5b180);
    const bench = finish('bench',benchX,benchZ);
    if (woodTexture) {
        // Recuperar la madera pixel art del juego, con sus píxeles definidos.
        const benchWoodTexture = woodTexture.clone();
        benchWoodTexture.magFilter = benchWoodTexture.minFilter = THREE.NearestFilter;
        const positions = bench.geometry.attributes.position;
        const normals = bench.geometry.attributes.normal;
        const tints = bench.geometry.attributes.color;
        const uv = new Float32Array(positions.count*2);
        for (let i=0;i<positions.count;i++) {
            const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
            const leg = Math.abs(x)>0.66 && Math.abs(x)<0.78 && y<0.415;
            // Veta a lo largo del asiento y vertical en las patas.
            uv[i*2] = leg ? y/0.44 : x/1.9+0.5;
            const across = leg ? z/0.42+0.5 : Math.abs(normals.getY(i))>0.5
                ? z/0.49+0.5 : (y-0.29)/0.21;
            uv[i*2+1] = 0.565+THREE.MathUtils.clamp(across,0,1)*0.115;
            // Oclusión suave en las uniones y bajo el tablón: las piezas se leen por separado.
            const shade = normals.getY(i)<-0.5 ? 0.55
                : leg ? 0.98-0.32*THREE.MathUtils.smoothstep(y,0.28,0.42)
                : y<0.415 ? 0.68 : normals.getY(i)>0.5 ? 1 : 0.82;
            tints.setXYZ(i,tints.getX(i)*shade,tints.getY(i)*shade,tints.getZ(i)*shade);
        }
        bench.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
        bench.material = new THREE.MeshPhongMaterial({map:benchWoodTexture,vertexColors:true,
            flatShading:true,shininess:0});
    }
    // Rastrillo de mano dejado de lado sobre un extremo del asiento.
    stem([-0.22,0.025,0],[0.10,0.025,0],0.019,handle);
    stem([0.09,0.025,0],[0.155,0.025,0],0.013,darkIron);
    box(0.035,0.025,0.18,0.15,0.025,0,iron);
    for(const z of [-0.075,-0.025,0.025,0.075]) {
        stem([0.16,0.025,z],[0.22,0.012,z],0.007,darkIron);
        stem([0.22,0.012,z],[0.24,-0.005,z],0.007,iron);
    }
    for(const part of pieces)part.rotateY(-0.43);
    const handRake=finish('hand-rake',0.50,0.015,bench);
    handRake.position.y=bench.geometry.boundingBox.max.y-handRake.geometry.boundingBox.min.y+0.001;
    const notebook=createGardenNotebook(THREE);
    notebook.position.set(-.48,bench.geometry.boundingBox.max.y+.002,.01);notebook.rotation.y=-.16;
    bench.add(notebook);
    return models;
}
