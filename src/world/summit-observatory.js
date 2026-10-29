import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {COLLISION_RADIUS,HOUSE_UPPER_FLOOR_THICKNESS,PLAYER_HEIGHT,UNIT_SIZE} from '../config.js';
import {summitStonePlatform,observatoryMiddleStoreyRise} from '../content/summit-layout.js';
import {createTelescope} from './telescope.js';
import {createObservatoryTransmission} from './observatory-transmission.js';
import {addObservatoryExterior} from './observatory-exterior.js';
import {addObservatoryWallLamps} from './observatory-wall-lamps.js';

// Observatorio de doce caras con laboratorio rectangular y cúpula amplia.
export function createSummitObservatory(THREE,baseY,{wall,wood}) {
    const platform=summitStonePlatform;
    const origin={x:(platform.minX+(platform.cellsPerSide-1)/2)*UNIT_SIZE,
        z:(platform.minZ+(platform.cellsPerSide-1)/2)*UNIT_SIZE};
    const group=new THREE.Group();group.name='summit-observatory';group.position.set(origin.x,baseY,origin.z);
    const interior=new THREE.Group();interior.name='observatory-interior';group.add(interior);
    const radius=4.4,sides=12,level=3,observingLift=4.2+observatoryMiddleStoreyRise,domeY=5+observingLift,domeRadius=4.65;
    const batches=new Map(),interiorBatches=new Map();
    const domeBatches=new Map(),supportBatches=new Map();
    let activeBatches=batches;
    const domeRotation=new THREE.Group();domeRotation.name='observatory-rotating-dome';group.add(domeRotation);
    const stoneCanvas=document.createElement('canvas');
    stoneCanvas.width=wall.image.width;stoneCanvas.height=wall.image.height;
    const stoneContext=stoneCanvas.getContext('2d');stoneContext.drawImage(wall.image,0,0);
    const pixels=stoneContext.getImageData(0,0,stoneCanvas.width,stoneCanvas.height);
    for(let i=0;i<pixels.data.length;i+=4) {
        const luma=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;
        const shade=Math.min(210,luma<34?38+1.2*luma:105+luma)*.83;
        pixels.data[i]=shade;pixels.data[i+1]=shade;pixels.data[i+2]=shade+3;
    }
    stoneContext.putImageData(pixels,0,0);
    const stoneMap=new THREE.CanvasTexture(stoneCanvas);stoneMap.colorSpace=THREE.SRGBColorSpace;
    stoneMap.wrapS=stoneMap.wrapT=THREE.RepeatWrapping;
    stoneMap.magFilter=stoneMap.minFilter=THREE.NearestFilter;stoneMap.needsUpdate=true;
    const stone=new THREE.MeshPhongMaterial({map:stoneMap,color:0xb9b6af,emissive:0x777b82,
        emissiveMap:stoneMap,emissiveIntensity:.35,side:THREE.DoubleSide});
    const trim=new THREE.MeshPhongMaterial({color:0x88877f,flatShading:true});
    const timberMap=wood.clone();timberMap.name='observatory-wood-tiles';
    timberMap.wrapS=timberMap.wrapT=THREE.RepeatWrapping;
    timberMap.repeat.set(1,1);timberMap.needsUpdate=true;
    const timber=new THREE.MeshPhongMaterial({map:timberMap,color:0xa58a63});
    const brass=new THREE.MeshPhongMaterial({color:0x9a8157,shininess:30,flatShading:true});
    const iron=new THREE.MeshPhongMaterial({color:0x28343c,shininess:22,flatShading:true});
    const glass=new THREE.MeshPhongMaterial({color:0x7694b5,emissive:0x344d6b,emissiveIntensity:.3,
        transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false,flatShading:true,shininess:60});
    function add(g,m,name='observatory-structure') {
        if(m===timber) {
            const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
            for(let i=0;i<p.count;i++) {
                const horizontal=Math.abs(n.getY(i))>.5;
                uv.setXY(i,(horizontal||Math.abs(n.getX(i))<.5?p.getX(i):p.getZ(i))/1.6,
                    (horizontal?p.getZ(i):p.getY(i))/1.6);
            }
        }
        const parts=activeBatches.get(m)??[];parts.push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();activeBatches.set(m,parts);
    }
    function box(w,h,d,x,y,z,m=stone) {const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,m);}
    function segment(a,b,h,thickness,y,m=stone,offset=0,coveredExterior=false) {
        const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        const g=new THREE.BoxGeometry(thickness,h,length);
        // El revestimiento ya dibuja esta cara. Conservar interior, jambas y cantos;
        // la antigua cara +X coincidía con molduras y cruzaba la fachada ataludada.
        if(coveredExterior){g.setIndex(Array.from(g.index.array).slice(6));g.clearGroups();}
        g.rotateY(Math.atan2(dx,dz));
        g.translate((a[0]+b[0])/2+dz/length*offset,y,(a[1]+b[1])/2-dx/length*offset);add(g,m);
    }
    function floor(points,top,thickness) {
        const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));
        const g=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false});
        g.rotateX(-Math.PI/2);g.translate(0,top-thickness,0);add(g,timber);
    }
    function rod(a,b,r,m=brass) {
        const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);
        const g=new THREE.CylinderGeometry(r,r,v.length(),5);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));
        g.translate(...p.add(q).multiplyScalar(.5).toArray());add(g,m);
    }
    function ring(r,y,h,m=trim) {
        if(y<2.3) {
            for(let i=1;i<sides;i++) {
                const a=Math.PI/2+i*2*Math.PI/sides,w=r*Math.tan(Math.PI/sides);
                const s=new THREE.Shape();s.moveTo(-w,y-h/2);s.lineTo(w,y-h/2);s.lineTo(w,y+h/2);s.lineTo(-w,y+h/2);s.closePath();
                add(planeShape(s,.08,a,r),m);
            }
            return;
        }
        const g=new THREE.CylinderGeometry(r,r,h,sides,1,true);g.translate(0,y,0);add(g,m);
        const rim=new THREE.TorusGeometry(r,.045,4,sides);rim.rotateX(Math.PI/2);rim.translate(0,y+h/2,0);add(rim,m);
    }
    function planeShape(shape,depth,angle,distance) {
        const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:1});
        g.translate(0,0,-depth/2);g.rotateY(Math.PI/2-angle);
        g.translate(Math.cos(angle)*distance,0,Math.sin(angle)*distance);return g;
    }
    function arch(width,bottom,shoulder,top) {
        const p=new THREE.Path();p.moveTo(-width/2,bottom);p.lineTo(-width/2,shoulder);
        p.lineTo(-width*.28,top-.09);p.lineTo(0,top);p.lineTo(width*.28,top-.09);
        p.lineTo(width/2,shoulder);p.lineTo(width/2,bottom);p.closePath();return p;
    }
    // Atlas de vitrales en píxeles enteros: oro apagado, violeta y azul.
    const canvas=document.createElement('canvas');canvas.width=16;canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#283343';ctx.fillRect(0,0,16,64);
    for(let y=2;y<62;y++)for(let x=2;x<14;x++) {
        const band=(Math.floor(y/8)+Math.floor(x/4))%4;
        ctx.fillStyle=['#557984','#6d618b','#a39365','#38445d'][band];ctx.fillRect(x,y,1,1);
    }
    ctx.fillStyle='#bfad77';ctx.fillRect(7,2,2,60);ctx.fillRect(2,17,12,1);ctx.fillRect(2,43,12,1);
    const windowMap=new THREE.CanvasTexture(canvas);windowMap.colorSpace=THREE.SRGBColorSpace;
    // Píxeles nítidos de cerca, promedio estable al alejarse (también en WebGL1).
    windowMap.magFilter=THREE.NearestFilter;windowMap.minFilter=THREE.LinearMipmapLinearFilter;windowMap.generateMipmaps=true;
    const stained=new THREE.MeshPhongMaterial({map:windowMap,emissiveMap:windowMap,emissive:0xffffff,
        emissiveIntensity:.45,side:THREE.DoubleSide});
    // La base octogonal recorta las cuatro esquinas; la entrada sigue centrada.
    const baseHalf=5.75,cornerCut=1.15,straightHalf=baseHalf-cornerCut;
    const baseOutline=[[-baseHalf,-straightHalf],[-straightHalf,-baseHalf],[straightHalf,-baseHalf],[baseHalf,-straightHalf],
        [baseHalf,straightHalf],[straightHalf,baseHalf],[-straightHalf,baseHalf],[-baseHalf,straightHalf]];
    for(let i=0;i<baseOutline.length;i++) {
        const a=baseOutline[i],b=baseOutline[(i+1)%baseOutline.length];
        if(Math.abs(a[1]-baseHalf)<.001&&Math.abs(b[1]-baseHalf)<.001) {
            segment(a,[.73,baseHalf],level,.16,level/2,stone,0,true);
            segment([-.73,baseHalf],b,level,.16,level/2,stone,0,true);
            segment([.73,baseHalf],[-.73,baseHalf],.65,.16,level-.325,stone,0,true);
        } else segment(a,b,level,.16,level/2,stone,0,true);
        // El canto de la losa cierra la cornisa: no añadir la moldura antigua,
        // cuya cara exterior coincidía exactamente con ese canto en los ocho lados.
    }
    const half=radius*Math.tan(Math.PI/sides);
    const upperApothem=radius-.15,upperVertexRadius=upperApothem/Math.cos(Math.PI/sides);
    // Tapa de piedra sobre la base cuadrada: deja el volumen del observatorio y
    // la abertura de la escalera despejados, pero cierra las cuatro esquinas.
    const roofHalf=baseHalf+.08,roofStraight=straightHalf+.08*(Math.SQRT2-1);
    const roofOutline=[[-roofHalf,-roofStraight],[-roofStraight,-roofHalf],[roofStraight,-roofHalf],[roofHalf,-roofStraight],
        [roofHalf,roofStraight],[roofStraight,roofHalf],[-roofStraight,roofHalf],[-roofHalf,roofStraight]];
    const roofShape=new THREE.Shape();
    roofOutline.forEach(([x,z],i)=>i?roofShape.lineTo(x,-z):roofShape.moveTo(x,-z));roofShape.closePath();
    const towerOpening=new THREE.Path();
    for(let i=0;i<sides;i++) {
        const a=2*Math.PI*i/sides+Math.PI/sides,x=Math.cos(a)*upperVertexRadius,z=Math.sin(a)*upperVertexRadius;
        i?towerOpening.lineTo(x,-z):towerOpening.moveTo(x,-z);
    }
    towerOpening.closePath();roofShape.holes.push(towerOpening);
    const roofGeometry=new THREE.ExtrudeGeometry(roofShape,{depth:HOUSE_UPPER_FLOOR_THICKNESS,bevelEnabled:false});
    roofGeometry.rotateX(-Math.PI/2);roofGeometry.translate(0,level-HOUSE_UPPER_FLOOR_THICKNESS,0);add(roofGeometry,stone);
    for(let i=0;i<sides;i++) {
        const angle=Math.PI/2+i*2*Math.PI/sides,s=new THREE.Shape();
        s.moveTo(-half,level);s.lineTo(half,level);s.lineTo(half,domeY);s.lineTo(-half,domeY);s.closePath();
        // Centrar el vitral entre la cubierta superior y el arranque de la cúpula.
        const windowHeight=2.92,windowBottom=(5.47+observatoryMiddleStoreyRise+domeY-windowHeight)/2,windowWidth=.82;
        const windowTop=windowBottom+windowHeight;
        const opening=arch(windowWidth,windowBottom,windowTop-.24,windowTop);
        s.holes.push(opening);
        // Dos caras alojadas bajo el marco: no hundir el vitral en el muro,
        // donde la precisión de profundidad puede taparlo a distancia.
        const pane=new THREE.Shape(arch(windowWidth+.06,windowBottom-.04,windowTop-.20,windowTop+.04).getPoints());
        const g=new THREE.ShapeGeometry(pane),p=g.attributes.position,uv=g.attributes.uv;
        for(let v=0;v<p.count;v++)uv.setXY(v,(p.getX(v)+windowWidth/2)/windowWidth,(p.getY(v)-windowBottom)/windowHeight);
        g.rotateY(Math.PI/2-angle);
        for(const offset of [-.095,.095]) {
            const face=g.clone();face.translate(Math.cos(angle)*(radius+offset),0,Math.sin(angle)*(radius+offset));add(face,stained);
        }
        g.dispose();
        add(planeShape(s,.13,angle,radius),stone);
        // Marco fino siguiendo la misma silueta del hueco para que no queden
        // esquinas desalineadas entre el vitral y la cara facetada del muro.
        const frameShape=new THREE.Shape(arch(windowWidth+.10,windowBottom-.06,windowTop-.18,windowTop+.06).getPoints());
        const frameOpening=arch(windowWidth-.04,windowBottom+.02,windowTop-.26,windowTop-.02).getPoints();
        if(THREE.ShapeUtils.isClockWise(frameOpening))frameOpening.reverse();
        frameShape.holes.push(new THREE.Path(frameOpening));
        // Marco continuo por ambas caras y por las jambas del hueco.
        const frame=new THREE.ExtrudeGeometry(frameShape,{depth:.28,bevelEnabled:false,curveSegments:1});
        frame.translate(0,0,-.14);frame.rotateY(Math.PI/2-angle);
        frame.translate(Math.cos(angle)*radius,0,Math.sin(angle)*radius);add(frame,trim);
    }
    // Asiento continuo: recibe tanto los vértices como las caras del vidrio
    // en cualquier orientación de la cúpula, y solapa el coronamiento de piedra.
    const domeSeatShape=new THREE.Shape();domeSeatShape.absarc(0,0,domeRadius+.12,0,Math.PI*2,false);
    const domeSeatHole=new THREE.Path();domeSeatHole.absarc(0,0,radius-.18,0,Math.PI*2,true);domeSeatShape.holes.push(domeSeatHole);
    const domeSeatGeometry=new THREE.ExtrudeGeometry(domeSeatShape,{depth:.20,bevelEnabled:false,curveSegments:96});
    domeSeatGeometry.rotateX(-Math.PI/2);domeSeatGeometry.translate(0,domeY-.08,0);
    const domeSeat=new THREE.Mesh(domeSeatGeometry,stone);domeSeat.name='observatory-dome-circular-seat';group.add(domeSeat);
    const domeBearing=new THREE.TorusGeometry(domeRadius,.025,5,96);
    domeBearing.rotateX(Math.PI/2);domeBearing.translate(0,domeY+.125,0);add(domeBearing,brass);
    // Mismo perfil de dos tramos, un 10 % más estrecho y desplazado al lateral.
    // El desarrollo y la altura de los peldaños conservan la pendiente anterior.
    const stairOffset={x:-2.68,z:.4};
    const stair={halfWidth:.54,left:-.66,right:.66,front:1.15,rear:-1.05,back:-2.05};
    const stairRun=stair.front-stair.rear,landingHalf=1.20;
    const stairOpeningBounds={half:1.28,front:1.2,back:-2.1,cut:.25};
    const stairBatches=new Map();activeBatches=stairBatches;
    for(let i=0;i<15;i++) {
        const h=(i+1)*.1;
        box(2*stair.halfWidth,.1,stairRun/15,stair.left,h-.05,stair.front-(i+.5)*stairRun/15,timber);
        box(2*stair.halfWidth,.1,stairRun/15,stair.right,1.5+h-.05,stair.rear+(i+.5)*stairRun/15,timber);
    }
    floor([[-landingHalf,stair.rear],[landingHalf,stair.rear],[landingHalf,stair.back+.2],
        [landingHalf-.2,stair.back],[-landingHalf+.2,stair.back],[-landingHalf,stair.back+.2]],1.5,.12);
    activeBatches=batches;
    // El hueco ocupa ambos tramos y el descanso, sin techo sobre la subida.
    const upperFloorThickness=HOUSE_UPPER_FLOOR_THICKNESS;
    const upperShape=new THREE.Shape();
    for(let i=0;i<sides;i++) {
        const angle=Math.PI/2+(i+.5)*Math.PI*2/sides,x=upperVertexRadius*Math.cos(angle),z=upperVertexRadius*Math.sin(angle);
        i?upperShape.lineTo(x,-z):upperShape.moveTo(x,-z);
    }
    upperShape.closePath();
    const hole=stairOpeningBounds;
    const holeOutline=[[-hole.half,hole.front],[hole.half,hole.front],[hole.half,hole.back+hole.cut],
        [hole.half-hole.cut,hole.back],[-hole.half+hole.cut,hole.back],[-hole.half,hole.back+hole.cut]];
    const holePoints=holeOutline.map(([x,z])=>new THREE.Vector2(x+stairOffset.x,-z-stairOffset.z));
    if(THREE.ShapeUtils.isClockWise(holePoints))holePoints.reverse();
    const stairOpening=new THREE.Path(holePoints);stairOpening.closePath();
    upperShape.holes.push(stairOpening);
    const upperFloorGeometry=new THREE.ExtrudeGeometry(upperShape,{depth:upperFloorThickness,bevelEnabled:false});
    upperFloorGeometry.rotateX(-Math.PI/2);upperFloorGeometry.translate(0,level-upperFloorThickness,0);add(upperFloorGeometry,timber);
    const stairGuards=[],guardPosts=new Set();
    activeBatches=stairBatches;
    function guard(a,b) {
        stairGuards.push({a,b});
        rod([a[0],a[1]+.95,a[2]],[b[0],b[1]+.95,b[2]],.035,brass);
        rod([a[0],a[1]+.45,a[2]],[b[0],b[1]+.45,b[2]],.022,iron);
        const posts=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.45));
        for(let i=0;i<=posts;i++) {
            const t=i/posts,p=a.map((v,j)=>v+(b[j]-v)*t),key=p.map(v=>v.toFixed(4)).join(',');
            if(guardPosts.has(key))continue;guardPosts.add(key);
            rod(p,[p[0],p[1]+.95,p[2]],.025,iron);
        }
    }
    for(const side of [-1,1]) {
        guard([stair.left+side*stair.halfWidth,0,stair.front],[stair.left+side*stair.halfWidth,1.5,stair.rear]);
        guard([stair.right+side*stair.halfWidth,1.5,stair.rear],[stair.right+side*stair.halfWidth,3,stair.front]);
    }
    const landingRail=[[-landingHalf,1.5,stair.rear],[-landingHalf,1.5,stair.back+.2],
        [-landingHalf+.2,1.5,stair.back],[landingHalf-.2,1.5,stair.back],
        [landingHalf,1.5,stair.back+.2],[landingHalf,1.5,stair.rear]];
    for(let i=1;i<landingRail.length;i++)guard(landingRail[i-1],landingRail[i]);
    // Proteger el hueco superior dejando abierta la salida del segundo tramo.
    for(let i=2;i<holeOutline.length;i++)guard([holeOutline[i-1][0],3,holeOutline[i-1][1]],[holeOutline[i][0],3,holeOutline[i][1]]);
    guard([holeOutline.at(-1)[0],3,holeOutline.at(-1)[1]],[-hole.half,3,hole.front]);
    // El primer segmento del contorno es la boca de salida: solo cerrar su lado izquierdo.
    guard([-hole.half,3,hole.front],[stair.right-stair.halfWidth,3,hole.front]);
    const stairGroup=new THREE.Group();stairGroup.name='observatory-side-staircase';
    stairGroup.position.set(stairOffset.x,0,stairOffset.z);group.add(stairGroup);
    // La cúpula completa gira sobre su aro; la abertura sigue al objetivo.
    activeBatches=domeBatches;
    const slitLeft=8.45,slitRight=9.55; // Apertura centrada de 33°, antes 60°.
    function domePoint(row,col) {
        const phi=row/5*Math.PI/2,a=col/sides*Math.PI*2+Math.PI;
        return [Math.cos(a)*Math.cos(phi)*domeRadius,domeY+Math.sin(phi)*domeRadius,Math.sin(a)*Math.cos(phi)*domeRadius];
    }
    for(let row=0;row<5;row++)for(let col=0;col<sides;col++) {
        const start=col===9?slitRight:col,end=col===8?slitLeft:col+1;
        const a=domePoint(row,start),b=domePoint(row,end),c=domePoint(row+1,end),d=domePoint(row+1,start);
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));g.computeVertexNormals();add(g,glass);
        rod(a,b,.012);rod(a,d,.012);rod(a,c,.009);
    }
    for(const col of [slitLeft,slitRight])for(let row=0;row<5;row++)rod(domePoint(row,col),domePoint(row+1,col),.035,brass);
    const domeTop=domeY+domeRadius;
    const cap=new THREE.ConeGeometry(.22,.25,8);cap.translate(0,domeTop+.08,0);add(cap,brass);
    rod([0,domeTop+.16,0],[.07,domeTop+.72,0],.045);
    const orb=new THREE.IcosahedronGeometry(.12,0);orb.translate(.07,domeTop+.81,0);add(orb,trim);
    activeBatches=batches;
    // Eje de azimut y muñones de elevación fijos en el centro de la cúpula.
    // La silla sigue el arco del ocular; el mástil ya no se traslada al inclinar.
    const chairOrbitRadius=.95,chairSeatLift=.25,telescopeRearLength=.85,telescopeCollisionRadius=.26;
    const telescopeElevation=.62,telescopeCenterY=domeY+.30;
    const scopePitchLimits={min:-.22,max:Math.PI/3};
    const scopeEye={x:0,y:0,z:chairOrbitRadius};
    const scopeMount=new THREE.Group();scopeMount.name='observatory-telescope-mount';
    scopeMount.position.set(0,telescopeCenterY,0);interior.add(scopeMount);
    const scopeSupport=new THREE.Group();scopeSupport.name='omniscopio-moving-support';
    scopeSupport.position.y=-telescopeCenterY;scopeMount.add(scopeSupport);
    activeBatches=supportBatches;
    const mastRadius=.21,mastRailX=.29;
    // Mantener la peana dentro del hueco del piñón del carro (.266 de radio libre).
    box(.50,.3,.50,0,level+.15,0,iron);
    rod([0,level+.13,0],[0,telescopeCenterY-.35,0],mastRadius,brass);
    for(const y of [level+.36,telescopeCenterY-.43]) {
        const collar=new THREE.CylinderGeometry(.245,.245,.14,10);collar.translate(0,y,0);add(collar,iron);
    }
    // Largueros simétricos en el plano del mástil: de la peana a la horquilla.
    box(.72,.12,.20,0,level+.22,0,iron);
    for(const x of [-mastRailX,mastRailX])rod([x,level+.22,0],[x,telescopeCenterY-.35,0],.045,iron);
    for(const x of [-.31,.31])rod([x,level+.22,0],[Math.sign(x)*mastRailX,level+1.2,0],.05,iron);
    // Travesaño a la altura del anclaje lateral del pistón.
    box(mastRailX*2+.09,.13,.16,0,telescopeCenterY-2.05,0,iron);
    // Horquilla anclada al cabezal del mástil y a los dos cojinetes del tubo.
    rod([-.40,telescopeCenterY-.35,0],[.40,telescopeCenterY-.35,0],.075,iron);
    for(const x of [-.38,.38]) {
        rod([x,telescopeCenterY-.40,0],[x,telescopeCenterY,0],.065,iron);
        box(.12,.22,.24,x,telescopeCenterY,0,iron);
        // La tapa del eje sobresale del cojinete (cara exterior ±.44).
        rod([Math.sign(x)*.19,telescopeCenterY,0],[Math.sign(x)*.47,telescopeCenterY,0],.065,brass);
        rod([Math.sign(x)*mastRailX,telescopeCenterY-.75,0],[x,telescopeCenterY-.35,0],.05,iron);
    }
    activeBatches=interiorBatches;
    // Cremallera circular: dientes en la cara interior del riel, junto al piñón.
    const railTeeth=72,railPitchRadius=chairOrbitRadius-.075,gearTeeth=12;
    const gearPitchRadius=railPitchRadius*gearTeeth/railTeeth;
    const mechanismY=level+.085;
    const railOutline=new THREE.Shape();railOutline.absarc(0,0,chairOrbitRadius+.06,0,Math.PI*2,false);
    const railHole=new THREE.Path();railHole.absarc(0,0,chairOrbitRadius-.05,0,Math.PI*2,true);railOutline.holes.push(railHole);
    const rail=new THREE.ExtrudeGeometry(railOutline,{depth:.11,bevelEnabled:false,curveSegments:64});
    rail.rotateX(-Math.PI/2);rail.translate(0,mechanismY-.055,0);add(rail,iron);
    for(let i=0;i<railTeeth;i++) {
        const angle=(i+.5)*Math.PI*2/railTeeth;
        const tooth=new THREE.BoxGeometry(.034,.09,.065);
        tooth.rotateY(angle);tooth.translate(Math.sin(angle)*(railPitchRadius+.0075),mechanismY,Math.cos(angle)*(railPitchRadius+.0075));add(tooth,brass);
    }
    // Piñón horizontal bajo la silla. Acompaña al carro, sin animación de giro.
    const chairDrive=new THREE.Group();chairDrive.name='omniscopio-chair-gear';
    chairDrive.position.set(0,mechanismY-telescopeCenterY,-railPitchRadius+gearPitchRadius);
    chairDrive.rotation.y=Math.PI;scopeMount.add(chairDrive);
    const gearShape=new THREE.Shape();
    for(let tooth=0;tooth<gearTeeth;tooth++)for(const [fraction,radius] of [[0,gearPitchRadius-.027],[.22,gearPitchRadius-.027],[.3,gearPitchRadius+.025],[.7,gearPitchRadius+.025],[.78,gearPitchRadius-.027]]) {
        const a=(tooth+fraction)*Math.PI*2/gearTeeth,x=Math.sin(a)*radius,y=Math.cos(a)*radius;
        if(tooth===0&&fraction===0)gearShape.moveTo(x,y);else gearShape.lineTo(x,y);
    }
    gearShape.closePath();
    const gearHole=new THREE.Path();gearHole.absarc(0,0,.105,0,Math.PI*2,true);gearShape.holes.push(gearHole);
    const gearGeometry=new THREE.ExtrudeGeometry(gearShape,{depth:.09,bevelEnabled:false,curveSegments:12});
    gearGeometry.rotateX(-Math.PI/2);gearGeometry.rotateY(Math.PI/gearTeeth);gearGeometry.translate(0,-.045,0);
    chairDrive.add(new THREE.Mesh(gearGeometry,brass));
    const driveParts=[];
    function driveBox(w,h,d,x,y,z) {const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);driveParts.push(g);}
    driveBox(.26,.065,.045,0,0,0);driveBox(.045,.065,.26,0,0,0);
    const axle=new THREE.CylinderGeometry(.052,.052,.24,8);axle.translate(0,.1,0);driveParts.push(axle);
    const carriageOffset=chairOrbitRadius-Math.abs(chairDrive.position.z);
    driveBox(.3,.065,carriageOffset+.2,0,.235,carriageOffset/2);
    driveBox(.4,.09,.38,0,.27,carriageOffset);
    chairDrive.add(new THREE.Mesh(mergeGeometries(driveParts,false),iron));driveParts.forEach(g=>g.dispose());
    // Segundo aro para el carro de la viga: mismo paso de dientes que la silla.
    const supportRailTeeth=48,supportRailRadius=railPitchRadius*supportRailTeeth/railTeeth;
    const supportOutline=new THREE.Shape();supportOutline.absarc(0,0,supportRailRadius+.135,0,Math.PI*2,false);
    const supportHole=new THREE.Path();supportHole.absarc(0,0,supportRailRadius+.025,0,Math.PI*2,true);supportOutline.holes.push(supportHole);
    const supportRail=new THREE.ExtrudeGeometry(supportOutline,{depth:.11,bevelEnabled:false,curveSegments:64});
    supportRail.rotateX(-Math.PI/2);supportRail.translate(0,mechanismY-.055,0);add(supportRail,iron);
    for(let i=0;i<supportRailTeeth;i++) {
        const angle=(i+.5)*Math.PI*2/supportRailTeeth;
        const tooth=new THREE.BoxGeometry(.034,.09,.065);
        tooth.rotateY(angle);tooth.translate(Math.sin(angle)*(supportRailRadius+.0075),mechanismY,Math.cos(angle)*(supportRailRadius+.0075));add(tooth,brass);
    }
    const supportDrive=chairDrive.clone(true);supportDrive.name='omniscopio-mast-gear';
    supportDrive.rotation.y=0;supportDrive.position.z=supportRailRadius-gearPitchRadius;scopeMount.add(supportDrive);
    const supportSlide=new THREE.Mesh(new THREE.BoxGeometry(.24,.12,1),iron);
    supportSlide.name='omniscopio-mast-carriage-slide';scopeMount.add(supportSlide);
    // Rueda vertical junto a la escalerilla: el diente inferior entra entre
    // los dientes del riel. El eje radial une la rueda al carro de la silla.
    const sideGearAngle=Math.PI+5*Math.PI*2/railTeeth;
    const sideGearRadius=supportRailRadius+.0075;
    const sideGearY=mechanismY+.045+gearPitchRadius-.02;
    const sideGear=new THREE.Group();sideGear.name='omniscopio-chair-side-gear';
    sideGear.position.set(Math.sin(sideGearAngle)*sideGearRadius,sideGearY-telescopeCenterY,Math.cos(sideGearAngle)*sideGearRadius);
    sideGear.rotation.y=sideGearAngle;scopeMount.add(sideGear);
    const sideGearGeometry=new THREE.ExtrudeGeometry(gearShape,{depth:.09,bevelEnabled:false,curveSegments:12});
    sideGearGeometry.translate(0,0,-.045);sideGearGeometry.rotateZ(Math.PI/gearTeeth);
    sideGear.add(new THREE.Mesh(sideGearGeometry,brass));
    const sideParts=[];
    function sideBox(w,h,d,x,y,z) {const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);sideParts.push(g);}
    sideBox(.26,.055,.06,0,0,0);sideBox(.055,.26,.06,0,0,0);
    const sideAxle=new THREE.CylinderGeometry(.055,.055,.32,8);
    sideAxle.rotateX(Math.PI/2);sideAxle.translate(0,0,.055);sideParts.push(sideAxle);
    // Soporte exterior, detrás de la rueda para dejar visible su cara dentada.
    sideBox(.11,.16,.08,0,-.05,.17);
    // El brazo termina en el carro de la silla aunque cambie la posición de la rueda.
    const armEnd=new THREE.Vector3(0,level+.355-telescopeCenterY,-chairOrbitRadius)
        .sub(sideGear.position).applyAxisAngle(new THREE.Vector3(0,1,0),-sideGearAngle);
    const armStart=new THREE.Vector3(0,-.09,.17);
    const armDirection=armEnd.clone().sub(armStart);
    const sideArm=new THREE.CylinderGeometry(.045,.045,armDirection.length(),6);
    sideArm.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),armDirection.clone().normalize()));
    const armCenter=armStart.add(armEnd).multiplyScalar(.5);sideArm.translate(armCenter.x,armCenter.y,armCenter.z);sideParts.push(sideArm);
    sideGear.add(new THREE.Mesh(mergeGeometries(sideParts,false),iron));sideParts.forEach(g=>g.dispose());
    const scopeChair=new THREE.Group();scopeChair.name='omniscopio-chair';scopeChair.rotation.x=-.25;scopeMount.add(scopeChair);
    function chairPart(w,h,d,x,y,z,material=timber) {
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
        mesh.userData={type:'OBSERVATORY_CHAIR',id:'omniscopio-chair'};
        mesh.position.set(x,y,z);scopeChair.add(mesh);return mesh;
    }
    chairPart(.56,.12,.54,0,0,0);
    chairPart(.56,.65,.09,0,.32,-.25);
    for(const x of [-.29,.29])chairPart(.055,.07,.48,x,.2,0,brass);
    // Dos reposapiés bajos, unidos al asiento y orientados hacia el ocular.
    for(const x of [-.20,.20]) {
        chairPart(.045,.56,.045,x,-.315,.25,iron);
        chairPart(.045,.045,.35,x,-.60,.415,iron);
        chairPart(.18,.045,.29,x,-.56,.44,iron);
        for(const z of [.35,.43,.51])chairPart(.15,.008,.018,x,-.533,z,brass);
    }
    const chassis=new THREE.Group();chassis.name='omniscopio-chair-connected-chassis';scopeMount.add(chassis);
    const chassisMembers=Array.from({length:16},()=>{
        const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,6),iron);chassis.add(mesh);return mesh;
    });
    const chairLanding=new THREE.Group();chairLanding.name='omniscopio-chair-ladder-landing';scopeMount.add(chairLanding);
    const landingBounds={minX:-1.40,maxX:-.45,minZ:-.40,maxZ:.90,top:.03};
    chairLanding.userData.bounds=landingBounds;
    const landingMaterial=iron;
    const landingDeck=new THREE.Mesh(new THREE.BoxGeometry(.95,.06,1.30),landingMaterial);
    landingDeck.position.set(-.925,0,.25);chairLanding.add(landingDeck);
    for(const x of [-1.37,-.48]) {
        const edge=new THREE.Mesh(new THREE.BoxGeometry(.055,.06,1.30),landingMaterial);edge.position.set(x,0,.25);chairLanding.add(edge);
    }
    for(let i=0;i<10;i++) {
        const tread=new THREE.Mesh(new THREE.BoxGeometry(.87,.008,.025),landingMaterial);tread.position.set(-.925,.03,-.34+i*.13);chairLanding.add(tread);
    }
    // Baranda en L: detrás y a la izquierda; silla (+X) y escalera (+Z) libres.
    for(const [x,z]of [[landingBounds.minX,landingBounds.minZ],
        [landingBounds.maxX,landingBounds.minZ],[landingBounds.minX,landingBounds.maxZ]]) {
        const post=new THREE.Mesh(new THREE.BoxGeometry(.045,.96,.045),iron);
        post.position.set(x,landingBounds.top+.48,z);chairLanding.add(post);
    }
    for(const height of [.48,.94]) {
        const rear=new THREE.Mesh(new THREE.BoxGeometry(.95,.045,.045),iron);
        rear.position.set(-.925,landingBounds.top+height,landingBounds.minZ);chairLanding.add(rear);
        const left=new THREE.Mesh(new THREE.BoxGeometry(.045,.045,1.30),iron);
        left.position.set(landingBounds.minX,landingBounds.top+height,.25);chairLanding.add(left);
    }
    const landingBraces=Array.from({length:4},()=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,6),iron);scopeMount.add(mesh);return mesh;});
    const chassisA=new THREE.Vector3(),chassisB=new THREE.Vector3(),chassisDirection=new THREE.Vector3();
    function chassisRod(index,a,b) {
        const mesh=chassisMembers[index];chassisDirection.subVectors(b,a);
        mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=chassisDirection.length();
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),chassisDirection.normalize());
    }
    // Escalerilla lateral solidaria al carro; sus pies quedan sobre el piso
    // y su extremo superior acompaña la altura del asiento al apuntar.
    const chairLadder=new THREE.Group();chairLadder.name='omniscopio-chair-ladder';
    scopeMount.add(chairLadder);
    const ladderRails=[];
    for(const z of [-.18,.18]) {
        const rail=new THREE.Mesh(new THREE.BoxGeometry(.055,1,.055),iron);
        rail.userData.side=z;chairLadder.add(rail);ladderRails.push(rail);
    }
    const ladderRungs=[];
    const rungGeometry=new THREE.CylinderGeometry(.027,.027,.4,6);rungGeometry.rotateX(Math.PI/2);
    for(let i=0;i<24;i++) {
        const rung=new THREE.Mesh(rungGeometry,iron);chairLadder.add(rung);ladderRungs.push(rung);
    }
    const ladderFoot=new THREE.Vector3(),ladderTop=new THREE.Vector3(),ladderDirection=new THREE.Vector3();
    const ladderUp=new THREE.Vector3(0,1,0);
    const scopeElevation=new THREE.Group();scopeElevation.rotation.x=-telescopeElevation;scopeMount.add(scopeElevation);
    const distantScope=new THREE.Group();distantScope.name='observatory-distant-scope';
    distantScope.visible=false;group.add(distantScope);
    function mountTube(r,length,z,material,rearRadius=r,open=false,distant=false) {
        const geometry=new THREE.CylinderGeometry(r,rearRadius,length,10,1,open);geometry.rotateX(Math.PI/2);geometry.translate(0,0,z);
        const mesh=new THREE.Mesh(geometry,material);scopeElevation.add(mesh);
        if(distant)distantScope.add(mesh.clone());
    }
    // Tubo más largo hacia el objetivo para alcanzar la ranura desde el centro.
    const tubeFront=5.55;
    mountTube(.20,.90,.30,iron);
    mountTube(.36,3.15,2.325,iron,.25);
    mountTube(.20,.42,-.31,iron,.105,true);
    mountTube(.48,1.80,tubeFront-.90,iron,.48,false,true);
    mountTube(.57,.16,tubeFront-.07,brass,.57,false,true);
    mountTube(.50,.10,tubeFront-1.77,brass,.50,false,true);
    // Continuación exacta del tubo hasta el anillo del pistón en la vista lejana.
    const distantStub=new THREE.CylinderGeometry(.36,.25+(.36-.25)*(2.15-.75)/3.15,1.75,10,1,true);
    distantStub.rotateX(Math.PI/2);distantStub.translate(0,0,3.025);
    distantScope.add(new THREE.Mesh(distantStub,iron));
    // Casquillo hueco coaxial: el objetivo del Astroscopio entra por el ocular.
    const socketGeometry=new THREE.LatheGeometry([
        new THREE.Vector2(.075,-telescopeRearLength),new THREE.Vector2(.105,-telescopeRearLength),
        new THREE.Vector2(.105,-.52),new THREE.Vector2(.075,-.52),
        new THREE.Vector2(.075,-telescopeRearLength)
    ],10);
    socketGeometry.rotateX(Math.PI/2);
    const socket=new THREE.Mesh(socketGeometry,brass);socket.name='omniscopio-eyepiece-socket';scopeElevation.add(socket);
    mountTube(.23,.10,.35,brass);
    mountTube(.36,.14,2.25,brass,.36,false,true);
    // Pistón de apoyo: camisa de longitud fija y vástago que entra en ella.
    const piston=new THREE.Group();piston.name='omniscopio-elevation-piston';scopeMount.add(piston);
    const pistonSteel=new THREE.MeshPhongMaterial({color:0xa6b1b5,shininess:65,flatShading:true});
    function pistonCylinder(radius,length,material,name) {
        const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,10),material);
        mesh.name=name;piston.add(mesh);return mesh;
    }
    // Dejar libre la articulación inferior: la camisa empieza después del eje,
    // de modo que el soporte rectangular no atraviese su collar de latón.
    const pistonBodyStart=.16,pistonBodyEnd=2.12;
    const pistonBody=pistonCylinder(.11,pistonBodyEnd-pistonBodyStart,iron,'omniscopio-piston-barrel');
    const pistonNeck=pistonCylinder(.055,pistonBodyStart,iron,'omniscopio-piston-hinge-neck');
    const pistonRod=pistonCylinder(.052,1,pistonSteel,'omniscopio-piston-sliding-rod');
    const pistonBands=[.22,2.04].map(distance=>({distance,mesh:pistonCylinder(.128,.10,brass,'omniscopio-piston-collar')}));
    const pistonPins=[0,1].map(()=>{const pin=pistonCylinder(.08,.26,brass,'omniscopio-piston-hinge');pin.rotation.z=Math.PI/2;return pin;});
    const pistonSideX=.46;
    const lowerBracket=new THREE.Mesh(new THREE.BoxGeometry(.22,.13,.16),iron);
    lowerBracket.name='omniscopio-piston-lower-bracket';
    // Ménsula corta desde el larguero X=.29; el eje queda libre a su costado.
    lowerBracket.position.set(.37,-2.05,0);piston.add(lowerBracket);
    const upperBracket=new THREE.Mesh(new THREE.BoxGeometry(.32,.25,.18),iron);
    upperBracket.position.set(.32,-.25,2.25);scopeElevation.add(upperBracket);
    const pistonBase=new THREE.Vector3(pistonSideX,-2.05,0),pistonTip=new THREE.Vector3(),pistonAxis=new THREE.Vector3();
    const pistonUp=new THREE.Vector3(0,1,0),pistonRotation=new THREE.Quaternion();
    // Coronas de elevación laterales y muñones coincidentes con el pivote real.
    // Sobresalir unos 2 cm de los cojinetes de hierro (cara exterior ±.44).
    for(const x of [-.43,.43]) {
        const bearing=new THREE.TorusGeometry(.26,.035,5,20);bearing.rotateY(Math.PI/2);
        bearing.translate(x,0,0);scopeElevation.add(new THREE.Mesh(bearing,brass));
        for(let i=0;i<24;i++) {
            const angle=i*Math.PI/12,tooth=new THREE.Mesh(new THREE.BoxGeometry(.06,.05,.07),brass);
            tooth.position.set(x,Math.sin(angle)*.30,Math.cos(angle)*.30);tooth.rotation.x=-angle;scopeElevation.add(tooth);
        }
    }
    const objective=new THREE.Mesh(new THREE.CircleGeometry(.50,10),
        new THREE.MeshPhongMaterial({color:0x96d2df,emissive:0x305269,emissiveIntensity:.5,shininess:90,side:THREE.DoubleSide}));
    objective.position.z=tubeFront+.02;scopeElevation.add(objective);
    distantScope.add(objective.clone());
    const astroscopeDock=new THREE.Group();astroscopeDock.name='astroscope-dock';
    astroscopeDock.position.set(0,0,-.813);astroscopeDock.visible=false;scopeElevation.add(astroscopeDock);
    const dockedAstroscope=createTelescope(THREE);dockedAstroscope.scale.setScalar(.8);
    dockedAstroscope.name='installed-astroscope';dockedAstroscope.rotation.y=Math.PI;astroscopeDock.add(dockedAstroscope);
    const telescopeInteraction=new THREE.Mesh(new THREE.SphereGeometry(.34,8,6),
        new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
    telescopeInteraction.name='observatory-telescope-interaction';
    telescopeInteraction.position.set(scopeEye.x,scopeEye.y,scopeEye.z);
    telescopeInteraction.userData={type:'OBSERVATORY_TELESCOPE',id:'observatory-telescope'};interior.add(telescopeInteraction);
    const transmission=createObservatoryTransmission(THREE,{iron,brass,level,collisionRadius:COLLISION_RADIUS});interior.add(transmission.group);
    function updateScopePose() {
        scopeElevation.rotation.x=-THREE.MathUtils.clamp(-scopeElevation.rotation.x,scopePitchLimits.min,scopePitchLimits.max);
        const pitch=-scopeElevation.rotation.x,eyeDistance=1.45;
        const eyeY=-Math.sin(pitch)*eyeDistance;
        const eyeZ=-Math.cos(pitch)*eyeDistance;
        scopeElevation.position.set(0,0,0);
        scopeSupport.position.z=0;
        scopeChair.rotation.x=-pitch*.30;
        scopeChair.position.set(0,eyeY-1.01+chairSeatLift,eyeZ);
        pistonTip.set(pistonSideX,-.35,2.25).applyEuler(scopeElevation.rotation);
        pistonAxis.subVectors(pistonTip,pistonBase);
        const pistonLength=pistonAxis.length();pistonAxis.normalize();
        pistonRotation.setFromUnitVectors(pistonUp,pistonAxis);
        pistonBody.position.copy(pistonBase).addScaledVector(pistonAxis,(pistonBodyStart+pistonBodyEnd)/2);pistonBody.quaternion.copy(pistonRotation);
        pistonNeck.position.copy(pistonBase).addScaledVector(pistonAxis,pistonBodyStart/2);pistonNeck.quaternion.copy(pistonRotation);
        const rodStart=1.94;
        pistonRod.scale.y=pistonLength-rodStart;
        pistonRod.position.copy(pistonBase).addScaledVector(pistonAxis,(pistonLength+rodStart)/2);pistonRod.quaternion.copy(pistonRotation);
        for(const {distance,mesh}of pistonBands) {
            mesh.position.copy(pistonBase).addScaledVector(pistonAxis,distance);mesh.quaternion.copy(pistonRotation);
        }
        pistonPins[0].position.copy(pistonBase);pistonPins[1].position.copy(pistonTip);
        let member=0;
        for(const x of [-.23,.23])for(const z of [-.2,.2]) {
            chassisA.set(x,level+.36-telescopeCenterY,-chairOrbitRadius+z);
            chassisB.set(x,-.07,z).applyEuler(scopeChair.rotation).add(scopeChair.position);
            chassisRod(member++,chassisA,chassisB);
        }
        // Los tirantes terminan sobre el montante real de la silla a esa altura,
        // en vez de quedar suspendidos delante de él.
        for(const x of [-.23,.23])for(const height of [-.40,-1.05]) {
            chassisA.set(Math.sign(x)*mastRadius,scopeChair.position.y+height,scopeSupport.position.z);
            chassisB.set(x,-.07,.2).applyEuler(scopeChair.rotation).add(scopeChair.position);
            const footY=scopeChair.position.y-.70;
            const fraction=(footY-(level+.36-telescopeCenterY))/(chassisB.y-(level+.36-telescopeCenterY));
            chassisB.z=(-chairOrbitRadius+.2)+(chassisB.z+chairOrbitRadius-.2)*fraction;
            chassisB.y=footY;
            chassisRod(member++,chassisA,chassisB);
        }
        // Cada apoyapiés recibe además un puente desde ese mismo montante.
        for(const x of [-.23,.23]) {
            chassisA.set(x,-.07,.2).applyEuler(scopeChair.rotation).add(scopeChair.position);
            chassisB.set(Math.sign(x)*.20,-.60,.32).applyEuler(scopeChair.rotation).add(scopeChair.position);
            const fraction=(chassisB.y-(level+.36-telescopeCenterY))/(chassisA.y-(level+.36-telescopeCenterY));
            chassisA.z=(-chairOrbitRadius+.2)+(chassisA.z+chairOrbitRadius-.2)*fraction;
            chassisA.y=chassisB.y;
            chassisRod(member++,chassisA,chassisB);
        }
        // Dos niveles de travesaños y una diagonal por lado enlazan los
        // montantes de la silla con el mástil, sin invadir la escalerilla.
        const chassisBaseY=level+.36-telescopeCenterY;
        for(const x of [-.23,.23])for(const [mastFraction,chairFraction] of [[.35,.35],[.68,.68],[.35,.68]]) {
            chassisB.set(x,-.07,.2).applyEuler(scopeChair.rotation).add(scopeChair.position);
            const chairTopY=chassisB.y;
            chassisB.y=chassisBaseY+(chairTopY-chassisBaseY)*chairFraction;
            chassisB.z=(-chairOrbitRadius+.2)+(chassisB.z+chairOrbitRadius-.2)*chairFraction;
            chassisA.set(Math.sign(x)*mastRailX,chassisBaseY+(chairTopY-chassisBaseY)*mastFraction,0);
            chassisRod(member++,chassisA,chassisB);
        }
        const railCarriageZ=supportRailRadius+.075;
        supportSlide.position.set(0,level+.29-telescopeCenterY,(railCarriageZ+scopeSupport.position.z)/2);
        supportSlide.scale.z=Math.abs(railCarriageZ-scopeSupport.position.z)+.3;
        // Escalerilla vertical de hierro, unida al descanso lateral del asiento.
        chairLadder.position.set(-.925,0,eyeZ+.90);
        chairLadder.rotation.y=Math.PI/2;
        chairLadder.userData.approach=[1,0,0];
        ladderFoot.set(0,level+.01-telescopeCenterY,0);
        ladderTop.set(0,scopeChair.position.y-.08,0);
        chairLanding.position.set(0,ladderTop.y,eyeZ);
        for(const [i,brace]of landingBraces.entries()) {
            const side=i%2===0?-1.37:-.48;
            chassisA.set(side,ladderTop.y-.03,eyeZ+(i<2?-.34:.85));
            chassisB.set(-.23,-.18,i<2?-.12:.20).applyEuler(scopeChair.rotation).add(scopeChair.position);
            chassisDirection.subVectors(chassisB,chassisA);
            brace.position.copy(chassisA).add(chassisB).multiplyScalar(.5);brace.scale.y=chassisDirection.length();
            brace.quaternion.setFromUnitVectors(ladderUp,chassisDirection.normalize());
        }
        ladderDirection.subVectors(ladderTop,ladderFoot);
        const ladderLength=ladderDirection.length();ladderDirection.normalize();
        for(const rail of ladderRails) {
            rail.position.copy(ladderFoot).add(ladderTop).multiplyScalar(.5);rail.position.z=rail.userData.side;
            rail.scale.y=ladderLength;rail.quaternion.setFromUnitVectors(ladderUp,ladderDirection);
        }
        for(const [i,rung]of ladderRungs.entries())rung.position.lerpVectors(ladderFoot,ladderTop,(i+1)/(ladderRungs.length+1));
        scopeEye.x=Math.sin(scopeMount.rotation.y)*eyeZ;
        scopeEye.y=telescopeCenterY+eyeY;
        scopeEye.z=Math.cos(scopeMount.rotation.y)*eyeZ;
        domeRotation.rotation.y=scopeMount.rotation.y;
        transmission.update(scopeMount.rotation.y);
        telescopeInteraction.position.set(0,0,-.72).applyEuler(scopeElevation.rotation).applyEuler(scopeMount.rotation);
        telescopeInteraction.position.y+=telescopeCenterY;
        distantScope.position.copy(scopeMount.position);
        distantScope.quaternion.copy(scopeMount.quaternion).multiply(scopeElevation.quaternion);
    }
    updateScopePose();
    activeBatches=interiorBatches;
    const wallLamps=addObservatoryWallLamps(THREE,{add,glowRoot:interior,wood:timber,iron,brass,baseHalf,radius});
    activeBatches=batches;
    addObservatoryExterior(THREE,{add,stone,woodTexture:timberMap,baseOutline});
    for(const [collection,parent] of [[batches,group],[interiorBatches,interior],[stairBatches,stairGroup],[domeBatches,domeRotation],[supportBatches,scopeSupport]]) {
        for(const [material,parts]of collection) {
            const mesh=new THREE.Mesh(mergeGeometries(parts,false),material);mesh.name=material===glass?'observatory-faceted-dome':material===stained?'observatory-stained-windows':'observatory-structure-batch';
            // El terreno también es transparente: dibujar el tinte después del paisaje,
            // conservando depthTest para que no cubra la estructura ni el equipo interior.
            if(material===glass)mesh.renderOrder=2;
            parent.add(mesh);parts.forEach(g=>g.dispose());
        }
    }
    const interiorLights=wallLamps.map(p=>{
        const light=new THREE.PointLight(0xffba70,p.y<3?1.4:1.6,p.y<3?8:9,2);
        // El vidrio está a 0.30 m del muro y su centro luminoso a Y local 0.44.
        light.position.set(p.x+p.nx*.30,p.y+.44,p.z+p.nz*.30);
        group.add(light);
        return light;
    });
    const local=(x,z)=>({x:x-origin.x,z:z-origin.z});
    const normals=Array.from({length:sides},(_,i)=>Math.PI/2+i*Math.PI*2/sides);
    const inside=(p,margin=0)=>normals.every(a=>p.x*Math.cos(a)+p.z*Math.sin(a)<radius-.065-margin);
    const insideBase=(p,margin=0)=>Math.abs(p.x)<baseHalf-margin&&Math.abs(p.z)<baseHalf-margin&&
        Math.abs(p.x)+Math.abs(p.z)<2*baseHalf-cornerCut-margin*Math.SQRT2;
    const stairLocal=p=>({x:p.x-stairOffset.x,z:p.z-stairOffset.z});
    const inStairOpening=p=>{
        const s=stairLocal(p);
        return s.z>=hole.back&&s.z<=hole.front&&Math.abs(s.x)<=hole.half-Math.max(0,hole.back+hole.cut-s.z);
    };
    const upperFloor=p=>inside(p)&&!inStairOpening(p);
    function stairHeight(p) {
        p=stairLocal(p);
        if(p.z>=stair.back&&p.z<=stair.rear
            && Math.abs(p.x)<=landingHalf-Math.max(0,stair.back+.2-p.z))return 1.5;
        if(p.z<stair.rear||p.z>stair.front)return -Infinity;
        if(Math.abs(p.x-stair.left)<=stair.halfWidth)return (stair.front-p.z)/stairRun*1.5+.05;
        if(Math.abs(p.x-stair.right)<=stair.halfWidth)return 1.5+(p.z-stair.rear)/stairRun*1.5+.05;
        return -Infinity;
    }
    const landingProbe=new THREE.Vector3();
    function supportHeight(x,z,feetY) {
        const p=local(x,z);if(!insideBase(p))return -Infinity;
        let support=baseY;const s=stairHeight(p);
        if(s<=feetY-baseY+.25)support=Math.max(support,baseY+Math.min(level,s));
        if(upperFloor(p)&&feetY>=baseY+level-.25)support=baseY+level;
        chairLanding.updateWorldMatrix(true,false);
        landingProbe.set(x,0,z);chairLanding.worldToLocal(landingProbe);
        if(landingProbe.x>=landingBounds.minX&&landingProbe.x<=landingBounds.maxX
            &&landingProbe.z>=landingBounds.minZ&&landingProbe.z<=landingBounds.maxZ) {
            const landingHeight=baseY+telescopeCenterY+chairLanding.position.y+landingBounds.top;
            if(feetY>=landingHeight-.25)support=Math.max(support,landingHeight);
        }
        return support;
    }
    function blocksMovement(x,z,feetY) {
        const p=local(x,z),f=feetY-baseY;if(Math.abs(p.x)>baseHalf+.43||Math.abs(p.z)>baseHalf+.43)return null;
        chairLanding.updateWorldMatrix(true,false);
        landingProbe.set(x,feetY,z);chairLanding.worldToLocal(landingProbe);
        if(landingProbe.y<landingBounds.top+.96&&landingProbe.y+PLAYER_HEIGHT>landingBounds.top+.04) {
            const nearestX=THREE.MathUtils.clamp(landingProbe.x,landingBounds.minX,landingBounds.maxX);
            const nearestZ=THREE.MathUtils.clamp(landingProbe.z,landingBounds.minZ,landingBounds.maxZ);
            // Tres bordes protegidos: el de la silla actúa como baranda invisible.
            // Solo +Z, hacia la escalerilla, permite abandonar la plataforma.
            if(Math.hypot(landingProbe.x-nearestX,landingProbe.z-landingBounds.minZ)<COLLISION_RADIUS+.023
                ||Math.hypot(landingProbe.x-landingBounds.minX,landingProbe.z-nearestZ)<COLLISION_RADIUS+.023
                ||Math.hypot(landingProbe.x-landingBounds.maxX,landingProbe.z-nearestZ)<COLLISION_RADIUS+.023)return true;
        }
        if(f>domeY+.8)return null;
        const door=Math.abs(p.x)<.73-COLLISION_RADIUS&&p.z>1.5&&f<.5;
        if(!door&&!(f<level-.25?insideBase(p,COLLISION_RADIUS):inside(p,COLLISION_RADIUS)))return true;
        if(door)return false;
        if(transmission.blocksMovement(p,f))return true;
        // Las barandas retienen al jugador en los laterales, con la misma
        // trayectoria y altura que sus piezas visibles, sin tapar los accesos.
        for(const {a,b}of stairGuards) {
            const p=stairLocal(local(x,z));
            const dx=b[0]-a[0],dz=b[2]-a[2],length2=dx*dx+dz*dz;
            const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[2])*dz)/length2));
            const railBase=a[1]+(b[1]-a[1])*t;
            if(f<railBase+.95&&f+PLAYER_HEIGHT>railBase+.05
                && Math.hypot(p.x-a[0]-dx*t,p.z-a[2]-dz*t)<COLLISION_RADIUS+.035)return true;
        }
        const supportRadius=scopeSupport.position.z,yaw=scopeMount.rotation.y;
        if(f>=level-.25&&Math.hypot(p.x-Math.sin(yaw)*supportRadius,p.z-Math.cos(yaw)*supportRadius)<telescopeCollisionRadius+COLLISION_RADIUS)return true;
        const s=stairHeight(p);
        if(s>f+.25&&s-f<1.8)return true;
        return false;
    }
    function upperLimit(x,z,feetY) {
        const p=local(x,z);if(!insideBase(p))return null;
        if(feetY<baseY+1.2&&upperFloor(p))return baseY+level-HOUSE_UPPER_FLOOR_THICKNESS-.06;
        return baseY+domeY+Math.sqrt(Math.max(0,domeRadius*domeRadius-p.x*p.x-p.z*p.z))-.2;
    }
    return {group,interior,distantScope,wallLamps,interiorLights,origin,baseY,levelY:baseY+level,supportHeight,blocksMovement,upperLimit,
        scopeMount,scopeElevation,scopeEye,scopeChair,scopeSupport,chairLadder,chairLanding,domeRotation,chairOrbitRadius,
        astroscopeDock,telescopeInteraction,scopePitchLimits,updateScopePose};
}
