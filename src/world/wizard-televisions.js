import {createWizardTvScreens} from './wizard-tv-screens.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Rincón de CRT del taller: utilería fija, atlas pixelado y cables de pocas caras.
export function createWizardTelevisions(THREE,woodTexture,ceilingHeight=2.75) {
    const group=new THREE.Group();group.name='wizard-crt-corner';
    let seed=7193;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const screenAnimation=createWizardTvScreens(THREE),atlas=screenAnimation.texture;
    const screens=new THREE.MeshBasicMaterial({map:atlas,color:0xb9c7ce,toneMapped:false});
    const grain=woodTexture.clone();grain.magFilter=grain.minFilter=THREE.NearestFilter;
    grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.needsUpdate=true;
    const wood=new THREE.MeshPhongMaterial({map:grain,color:0x604532,shininess:0,flatShading:true});
    const shell=new THREE.MeshPhongMaterial({vertexColors:true,color:0xffffff,shininess:9,flatShading:true});
    const dark=new THREE.MeshPhongMaterial({color:0x171f25,shininess:7,flatShading:true});
    const wire=new THREE.MeshPhongMaterial({vertexColors:true,shininess:12,flatShading:true});
    const glow=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
    const batches=new Map(),consoleBatches=new Map(),headphoneBatches=new Map(),bodyBounds=new THREE.Box3();
    let activeBatches=batches;
    function add(source,material,color=null,transform=null) {
        const geometry=source.index?source.toNonIndexed():source;
        if(geometry!==source)source.dispose();
        transform?.(geometry);
        if(material.vertexColors) {
            const tint=new THREE.Color(color??0xffffff),values=new Float32Array(geometry.attributes.position.count*3);
            for(let i=0;i<values.length;i+=3)values.set([tint.r,tint.g,tint.b],i);
            geometry.setAttribute('color',new THREE.BufferAttribute(values,3));
        }
        const pieces=activeBatches.get(material)??[];pieces.push(geometry);activeBatches.set(material,pieces);
    }
    function box(w,h,d,x,y,z,color=0x59615e,material=shell) {
        add(new THREE.BoxGeometry(w,h,d),material,color,g=>g.translate(x,y,z));
    }
    function knob(radius,depth,x,y,z,color=0x333d3d) {
        add(new THREE.CylinderGeometry(radius,radius,depth,8),shell,color,g=>{g.rotateX(Math.PI/2);g.translate(x,y,z);});
    }
    function cable(points,radius=.01,color=0x121a20) {
        const curve=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)));
        add(new THREE.TubeGeometry(curve,Math.max(12,points.length*3),radius,4,false),wire,color);
    }
    const rearPorts=[];
    function television({x,y,z,w,h,d,slot,wooden=false,industrial=false}) {
        const edge=Math.min(w,h)*.055,outline=new THREE.Shape();
        outline.moveTo(-w/2+edge,-h/2);outline.lineTo(w/2-edge,-h/2);
        outline.lineTo(w/2,-h/2+edge);outline.lineTo(w/2,h/2-edge);
        outline.lineTo(w/2-edge,h/2);outline.lineTo(-w/2+edge,h/2);
        outline.lineTo(-w/2,h/2-edge);outline.lineTo(-w/2,-h/2+edge);outline.closePath();
        const geometry=new THREE.ExtrudeGeometry(outline,{depth:d-.04,bevelEnabled:true,bevelSegments:1,
            bevelThickness:.02,bevelSize:.015,steps:1,curveSegments:1});
        add(geometry,wooden?wood:shell,industrial?0x4c5556:0x68706c,g=>g.translate(x,y,z-d/2+.02));
        bodyBounds.expandByPoint(new THREE.Vector3(x-w/2-.02,y-h/2-.02,z-d/2-.02));
        bodyBounds.expandByPoint(new THREE.Vector3(x+w/2+.02,y+h/2+.02,z+d/2+.04));
        const face=z+d/2+.025,sw=w*.70,sh=h*.72,sx=x-w*.09,sy=y+h*.045;
        box(sw+.085,sh+.085,.045,sx,sy,face,0x171f25,dark);
        // Malla poco subdividida con el centro del vidrio ligeramente abombado.
        const screen=new THREE.PlaneGeometry(sw,sh,8,6),p=screen.attributes.position,uv=screen.attributes.uv;
        for(let i=0;i<p.count;i++) {
            const nx=p.getX(i)/(sw/2),ny=p.getY(i)/(sh/2),u=uv.getX(i),v=uv.getY(i);
            p.setZ(i,.020*(1-nx*nx)*(1-ny*ny));
            uv.setXY(i,((slot%4)*64+.5+u*63)/256,
                1-(Math.floor(slot/4)*64+8+.5+(1-v)*47)/128);
        }
        screen.computeVertexNormals();screen.translate(sx,sy,face+.026);add(screen,screens);
        const controlsX=x+w*.385;
        knob(h*.055,.035,controlsX,y+h*.16,face+.035);
        knob(h*.045,.028,controlsX,y-h*.02,face+.035);
        box(w*.11,.016,.014,controlsX,y+h*.16,face+.057,0xa2a79b);
        for(let i=0;i<6;i++)box(w*.12,.013,.009,controlsX,y-h*.15-i*.027,face+.028,0x171f25,dark);
        box(w*.39,.022,.014,x-w*.13,y-h*.40,face+.018,0x171f25,dark);
        for(let i=0;i<3;i++)knob(.009,.012,x+w*.10+i*.026,y-h*.40,face+.028,[0xc7b58a,0x89978b,0x5e716d][i]);
        box(.012,.012,.012,x-w*.34,y-h*.40,face+.026,slot%2?0x679f86:0xc09c61,glow);
        // Rejilla lateral y pequeños tornillos mantienen la lectura de aparato antiguo.
        for(let i=0;i<7;i++)box(.012,h*.22,.018,x+w/2+.017,y,z-.16+i*.04,0x171f25,dark);
        if(industrial)for(const dx of [-1,1])for(const dy of [-1,1])knob(.012,.01,x+dx*w*.45,y+dy*h*.43,face+.019,0x899187);
        // Tomas traseras: ningún cable nace en el vidrio ni en un punto al aire.
        const back=z-d/2;
        box(w*.48,h*.28,.025,x,y,back-.016,0x171f25,dark);
        for(const dx of [-.16,.16])for(const dy of [-.07,.07]) {
            const port=[x+dx*w,y+dy*h,back-.055];
            knob(.021,.06,port[0],port[1],back-.03,0x9b9279);rearPorts.push(port);
        }
    }
    // Dos pilas desiguales: madera y carcasa doméstica a la izquierda, metal a la derecha.
    television({x:-.67,y:.48,z:.11,w:1.17,h:.86,d:.76,slot:0,wooden:true});
    television({x:-.69,y:1.36,z:.055,w:1.07,h:.82,d:.70,slot:1});
    television({x:.56,y:.43,z:.02,w:1.04,h:.74,d:.75,slot:2,industrial:true});
    television({x:.58,y:1.19,z:-.015,w:1.08,h:.74,d:.73,slot:3,industrial:true});
    television({x:.59,y:1.91,z:-.09,w:.92,h:.67,d:.66,slot:4,industrial:true});
    for(const x of [-1.10,-.28,.18,.96])box(.10,.045,.48,x,.0225,.01,0x171f25,dark);
    box(.18,2.33,.43,-.045,1.165,-.31,0x313b3c);
    for(let i=0;i<8;i++) {
        box(.12,.10,.02,-.045,.25+i*.25,-.078,0x171f25,dark);
        box(.018,.025,.015,-.065,.25+i*.25,-.060,i%3===0?0x8cb5b1:0x5f8980,glow);
    }
    // Canaleta fijada al techo; las bajadas permanecen detrás de las carcasas.
    box(2.45,.085,.22,-.03,ceilingHeight-.025,-.63,0x313b3c);
    for(const x of [-1.10,1.04])box(.065,.12,.27,x,ceilingHeight-.025,-.63,0x171f25,dark);
    for(let i=0;i<24;i++) {
        const port=rearPorts[i%rearPorts.length],sx=-1.13+i*2.2/23;
        const lane=-.66-(i%4)*.035;
        cable([[sx,ceilingHeight-.05,-.63],[sx,ceilingHeight-.28,lane],
            [port[0]+(i%2?.07:-.07),Math.max(port[1]+.18,ceilingHeight-.68),lane],
            [port[0],port[1]+.10,lane],port],.007+random()*.006,i%5===0?0x2a343b:0x111a21);
    }
    // Regleta en el suelo y bucles con ambos extremos conectados.
    box(.30,.065,.18,0,.038,.94,0x171f25,dark);
    for(const [i,color]of [0x487d96,0xa5934c,0x879b9c].entries())box(.055,.025,.055,-.09+i*.09,.079,.94,color);
    for(let i=0;i<7;i++) {
        const cx=-.78+random()*1.65,cz=.62+random()*.42,r=.23+random()*.29;
        const port=rearPorts[(i*3)%rearPorts.length];
        const points=[port,[port[0],port[1],-.64],[port[0],.15,-.67],
            [port[0],.025,-.62],[cx+r,.025,.36]];
        for(let j=0;j<=18;j++) {
            const a=j*Math.PI*2/18;
            points.push([cx+Math.cos(a)*r,.012+i*.0015,cz+Math.sin(a)*r*.70]);
        }
        points.push([cx+r,.025,cz],[-.09+(i%3)*.09,.079,.94]);
        cable(points,.007+i*.0007,i%3?0x121a20:0x29343d);
    }
    // Consola a un lado del frente, con controles inclinados y conexiones reales
    // al distribuidor del centro de las pilas. El hueco entre muebles queda libre.
    activeBatches=consoleBatches;
    const deskX=-.95,deskZ=1.85,panelY=.88,panelTilt=.20;
    box(1.04,.09,.72,deskX,.77,deskZ,0xffffff,wood);
    for(const x of [-.43,.43])for(const z of [-.27,.27]) {
        box(.075,.72,.075,deskX+x,.36,deskZ+z,0xffffff,wood);
        box(.09,.035,.09,deskX+x,.02,deskZ+z,0x171f25,dark);
    }
    box(.92,.065,.055,deskX,.23,deskZ-.27,0xffffff,wood);
    for(const x of [-.33,.33])box(.07,.07,.07,deskX+x,.83,deskZ-.21,0x171f25,dark);
    function panelPart(geometry,color,material=shell) {
        add(geometry,material,color,g=>{g.rotateX(panelTilt);g.translate(deskX,panelY,deskZ);});
    }
    panelPart(new THREE.BoxGeometry(.94,.14,.55),0x3c484a);
    for(let row=0;row<2;row++)for(let col=0;col<4;col++) {
        const x=-.33+col*.22,z=-.15+row*.27;
        const dial=new THREE.CylinderGeometry(.042,.048,.065,10);dial.translate(x,.105,z);
        panelPart(dial,row?0x222e34:0xa49165);
        const tick=new THREE.BoxGeometry(.008,.005,.027);tick.rotateY(col*.55-row*.8);tick.translate(x,.14,z);
        panelPart(tick,0xd1d0b1);
        for(const dz of [-.065,.065]) {
            const mark=new THREE.BoxGeometry(.034,.004,.008);mark.translate(x,.073,z+dz);panelPart(mark,0x8c9b94);
        }
    }
    for(let i=0;i<3;i++) {
        const lamp=new THREE.BoxGeometry(.02,.014,.02);lamp.translate(-.04+i*.045,.081,.025);
        panelPart(lamp,[0x72a092,0xc2a364,0x9aa39a][i],glow);
    }
    for(const x of [-1.18,-.98]) {
        box(.055,.055,.07,x,.93,1.54,0x171f25,dark);
        cable([[x,.93,1.51],[x,.65,1.30],[x+.10,.025,1.26],[-.25,.02,.69],[-.045,.80,-.07]],.012,x<-1.1?0x413333:0x15232a);
    }
    const headphoneJack=new THREE.CylinderGeometry(.035,.035,.09,8);
    headphoneJack.rotateZ(Math.PI/2);headphoneJack.translate(-.445,.88,deskZ);
    add(headphoneJack,shell,0xa49165);
    // Audífonos acolchados sobre un soporte bajo al otro lado de la consola.
    activeBatches=headphoneBatches;
    const headphoneX=.95,headphoneZ=1.85;
    const foot=new THREE.CylinderGeometry(.19,.21,.035,10);foot.translate(headphoneX,.0175,headphoneZ);add(foot,dark);
    const stem=new THREE.CylinderGeometry(.018,.022,1.005,6);stem.translate(headphoneX,.5375,headphoneZ);add(stem,shell,0x79807b);
    box(.20,.04,.06,headphoneX,1.055,headphoneZ,0x171f25,dark);
    const band=[];
    for(let i=0;i<=16;i++) {
        const angle=-Math.PI/2+i*Math.PI/16;
        band.push([headphoneX+Math.sin(angle)*.23,.80+Math.cos(angle)*.28,headphoneZ]);
    }
    cable(band,.029,0x1c262d);
    cable(band.map(([x,y,z])=>[x,y+.018,z]),.009,0x737c78);
    for(const side of [-1,1]) {
        for(const [offset,depth,radius,color]of [[.23,.075,.105,0x313e45],[.186,.035,.093,0x101a21],[.275,.014,.075,0x9a8963]]) {
            const cup=new THREE.CylinderGeometry(radius,radius,depth,10);
            cup.rotateZ(Math.PI/2);cup.scale(1,1.25,1);cup.translate(headphoneX+side*offset,.73,headphoneZ);
            add(cup,shell,color);
        }
        cable([[headphoneX+side*.23,.80,headphoneZ],[headphoneX+side*.27,.82,headphoneZ],
            [headphoneX+side*.29,.73,headphoneZ]],.012,0x858a79);
    }
    cable([[.72,.70,headphoneZ],[.84,.35,2.03],[.65,.025,2.18],[-.03,.018,2.23],
        [-.34,.03,2.08],[-.39,.48,1.94],[-.40,.88,deskZ]],.011,0x131d25);
    for(const [collection,prefix]of [[batches,'wizard-crt'],[consoleBatches,'wizard-crt-control-desk'],[headphoneBatches,'wizard-crt-headphones']])for(const [material,pieces] of collection) {
        const mesh=new THREE.Mesh(mergeGeometries(pieces,false),material);
        mesh.name=material===screens?'wizard-crt-pixel-screens':material===wire?prefix+'-hanging-cables':prefix+'-cabinets';
        group.add(mesh);pieces.forEach(geometry=>geometry.dispose());
    }
    const size=bodyBounds.getSize(new THREE.Vector3()),center=bodyBounds.getCenter(new THREE.Vector3());
    const colliderGeometry=new THREE.BoxGeometry(size.x,size.y,size.z);colliderGeometry.translate(center.x,center.y,center.z);
    colliderGeometry.computeBoundingBox();
    const collider=new THREE.Mesh(colliderGeometry,new THREE.MeshBasicMaterial());
    collider.name='wizard-crt-collision';collider.visible=false;collider.userData={type:'PROP',visibilityEnabled:false};
    group.add(collider);
    const accessoryColliders=[];
    for(const [name,w,h,d,x,z]of [['desk',1.04,1.04,.72,deskX,deskZ],['headphone-stand',.42,1.13,.42,headphoneX,headphoneZ]]) {
        const geometry=new THREE.BoxGeometry(w,h,d);geometry.translate(x,h/2,z);geometry.computeBoundingBox();
        const obstacle=new THREE.Mesh(geometry,collider.material);
        obstacle.name='wizard-crt-'+name+'-collision';obstacle.visible=false;
        obstacle.userData={type:'PROP',visibilityEnabled:false};group.add(obstacle);accessoryColliders.push(obstacle);
    }
    const light=new THREE.PointLight(0x9ecbd8,.45,4,2);light.position.set(.20,1.25,.85);group.add(light);
    return {group,collider,accessoryColliders,update:screenAnimation.update};
}
