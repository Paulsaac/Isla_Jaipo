import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {COLLISION_RADIUS,PLAYER_HEIGHT,UNIT_SIZE} from '../config.js';

export const LAKE_HATCH_CELL={x:376,z:283};
const ROOM_WIDTH=15,ROOM_HEIGHT=5,ROOM_BASE=-48,EXIT_Z=4.8;
const LADDER_TOP_Z=5.95,LADDER_BOTTOM_Z=LADDER_TOP_Z,LADDER_RAIL_HEIGHT=4.58;

function ovalWindow(THREE,width,height) {
    const shape=new THREE.Shape();
    shape.absellipse(0,ROOM_HEIGHT/2,width/2,height/2,0,Math.PI*2,false);
    return shape;
}

// Escotilla exterior y destino aislado; ningún mapa ni progreso se reconstruye al viajar.
export function createLakeMetalRoom(THREE,groundY) {
    const hatch=new THREE.Group();hatch.name='lake-ground-hatch';
    hatch.position.set(LAKE_HATCH_CELL.x*UNIT_SIZE,groundY,LAKE_HATCH_CELL.z*UNIT_SIZE);hatch.visible=false;
    const room=new THREE.Group();room.name='lake-metal-room';room.position.set(-2048,ROOM_BASE,-2048);room.visible=false;
    const bronze=new THREE.MeshPhongMaterial({color:0xbc8a43,specular:0xe0ba73,shininess:38,flatShading:true});
    const iron=new THREE.MeshPhongMaterial({color:0x583c25,shininess:25,flatShading:true});
    const brass=new THREE.MeshPhongMaterial({color:0xe0ba73,shininess:35,flatShading:true});
    const roomBronze=new THREE.MeshPhongMaterial({color:0xbc8a43,emissive:0x46301a,emissiveIntensity:.35,
        specular:0xe0ba73,shininess:42,flatShading:true,fog:false});
    const roomBrass=new THREE.MeshPhongMaterial({color:0xe0ba73,emissive:0x32220e,emissiveIntensity:.25,shininess:38,fog:false});
    const copper=new THREE.MeshPhongMaterial({color:0x80532f,emissive:0x24180e,emissiveIntensity:.3,shininess:32,fog:false});
    const roomHatchIron=iron.clone();roomHatchIron.fog=false;
    const panels=new THREE.MeshPhongMaterial({color:0x586b79,emissive:0x293944,emissiveIntensity:.55,
        specular:0x9eb8ce,shininess:48,flatShading:true,fog:false});
    const roomIron=new THREE.MeshPhongMaterial({color:0x24323c,emissive:0x17232b,emissiveIntensity:.35,shininess:30,fog:false});
    const lamp=new THREE.MeshBasicMaterial({color:0xc5edf3,fog:false});
    const batches=new Map();
    function add(geometry,material,parent) {
        const key=parent.uuid+material.uuid,entry=batches.get(key)??{parent,material,parts:[]};
        entry.parts.push(geometry.index?geometry.toNonIndexed():geometry);if(geometry.index)geometry.dispose();batches.set(key,entry);
    }
    function box(parent,w,h,d,x,y,z,material) {
        const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,material,parent);
    }
    function rod(parent,a,b,r,material) {
        const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),direction=q.clone().sub(p);
        const g=new THREE.CylinderGeometry(r,r,direction.length(),6);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
        g.translate(...p.add(q).multiplyScalar(.5).toArray());add(g,material,parent);
    }
    function wheel(parent,x,y,z,horizontal=false,scale=1,material=brass) {
        const g=new THREE.TorusGeometry(.29*scale,.037*scale,5,12);if(horizontal)g.rotateX(Math.PI/2);g.translate(x,y,z);add(g,material,parent);
        for(let i=0;i<4;i++) {
            const a=i*Math.PI/2,dx=Math.cos(a)*.29*scale,d=Math.sin(a)*.29*scale;
            rod(parent,[x,y,z],horizontal?[x+dx,y,z+d]:[x+dx,y+d,z],.024*scale,material);
        }
    }
    function hatchLid(parent,radius,centerZ,side,plateMaterial,frameMaterial,detailMaterial) {
        const scale=radius/1.10;
        const lid=new THREE.CylinderGeometry(radius,radius,.11*scale,32);
        lid.translate(0,0,centerZ);add(lid,plateMaterial,parent);
        const rim=new THREE.TorusGeometry(.98*scale,.022*scale,5,32);
        rim.rotateX(Math.PI/2);rim.translate(0,side*.069*scale,centerZ);add(rim,frameMaterial,parent);
        for(const sign of [-1,1])
            box(parent,.22*scale,.08*scale,.30*scale,sign*.42*scale,side*.01*scale,centerZ-.93*scale,frameMaterial);
        for(let i=0;i<8;i++) {
            const angle=i*Math.PI/4;
            rod(parent,[Math.cos(angle)*.36*scale,side*.064*scale,centerZ+Math.sin(angle)*.36*scale],
                [Math.cos(angle)*.91*scale,side*.064*scale,centerZ+Math.sin(angle)*.91*scale],.012*scale,frameMaterial);
        }
        wheel(parent,0,side*.20*scale,centerZ,true,scale,detailMaterial);
        for(let i=0;i<12;i++) {
            const angle=i*Math.PI/6;
            const bolt=new THREE.IcosahedronGeometry(.043*scale,0);
            bolt.translate(Math.cos(angle)*.98*scale,side*.08*scale,centerZ+Math.sin(angle)*.98*scale);
            add(bolt,detailMaterial,parent);
        }
    }
    // Fondo negro sobre el terreno: se ve al levantar la tapa, sin perforar la imagen del mapa.
    const well=new THREE.CylinderGeometry(1.15,1.15,.06,32);well.translate(0,.03,0);
    add(well,new THREE.MeshBasicMaterial({color:0x020405}),hatch);
    const rimShape=new THREE.Shape();rimShape.absarc(0,0,1.33,0,Math.PI*2,false);
    const rimHole=new THREE.Path();rimHole.absarc(0,0,1.14,0,Math.PI*2,true);rimShape.holes.push(rimHole);
    const rim=new THREE.ExtrudeGeometry(rimShape,{depth:.38,bevelEnabled:false,curveSegments:16});
    rim.rotateX(-Math.PI/2);rim.translate(0,-.26,0);add(rim,iron,hatch);
    const hinge=new THREE.Group();hinge.name='lake-hatch-hinged-lid';hinge.position.set(0,.13,-1.08);hatch.add(hinge);
    hatchLid(hinge,1.10,1.08,1,bronze,iron,brass);
    for(const sign of [-1,1]) {
        rod(hatch,[sign*.42-.14,.13,-1.08],[sign*.42+.14,.13,-1.08],.10,brass);
    }
    const target=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,.32,24),new THREE.MeshBasicMaterial({visible:false}));
    target.name='lake-hatch-interaction';target.position.y=.08;target.userData={type:'LAKE_HATCH'};hatch.add(target);
    let revealed=false;
    const raycastTarget=target.raycast;
    target.raycast=function(raycaster,hits){if(revealed)raycastTarget.call(this,raycaster,hits);};

    // Sala de 15 × 15 × 5 m. La salida conserva X/Z y ahora ocupa el techo.
    const half=ROOM_WIDTH/2,span=ROOM_WIDTH+.4;
    box(room,span,.2,span,0,-.10,0,panels);
    const ceilingShape=new THREE.Shape();
    ceilingShape.moveTo(-half-.2,-half-.2);ceilingShape.lineTo(half+.2,-half-.2);
    ceilingShape.lineTo(half+.2,half+.2);ceilingShape.lineTo(-half-.2,half+.2);ceilingShape.closePath();
    const ceilingHole=new THREE.Path();ceilingHole.absarc(0,-EXIT_Z,.88,0,Math.PI*2,true);ceilingShape.holes.push(ceilingHole);
    const ceiling=new THREE.ExtrudeGeometry(ceilingShape,{depth:.2,bevelEnabled:false,curveSegments:16});
    ceiling.rotateX(-Math.PI/2);ceiling.translate(0,ROOM_HEIGHT,0);add(ceiling,panels,room);
    for(const sign of [-1,1]) {
        box(room,.2,ROOM_HEIGHT,span,sign*(half+.10),ROOM_HEIGHT/2,0,panels);
        if(sign>0)box(room,span,ROOM_HEIGHT,.2,0,ROOM_HEIGHT/2,sign*(half+.10),panels);
        for(const x of [-half+.08,half-.08])box(room,.15,ROOM_HEIGHT,.15,x,ROOM_HEIGHT/2,sign*(half-.08),roomIron);
    }
    // Muro norte: ojo de buey ovalado con marco de bronce, juntas y pernos.
    const windowShape=ovalWindow(THREE,13.2,3.8);
    const frontWall=new THREE.Shape();frontWall.moveTo(-half-.2,0);frontWall.lineTo(half+.2,0);
    frontWall.lineTo(half+.2,ROOM_HEIGHT);frontWall.lineTo(-half-.2,ROOM_HEIGHT);frontWall.closePath();
    frontWall.holes.push(new THREE.Path(windowShape.getPoints(48).reverse()));
    const wallGeometry=new THREE.ExtrudeGeometry(frontWall,{depth:.2,bevelEnabled:false,curveSegments:48});
    wallGeometry.translate(0,0,-half-.2);add(wallGeometry,panels,room);
    const windowAssembly=new THREE.Group();windowAssembly.name='metal-room-oval-bronze-porthole';room.add(windowAssembly);
    function windowRing(width,height,holeWidth,holeHeight,z,depth,material) {
        const shape=ovalWindow(THREE,width,height);
        shape.holes.push(new THREE.Path(ovalWindow(THREE,holeWidth,holeHeight).getPoints(48).reverse()));
        const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:48});
        geometry.translate(0,0,z);add(geometry,material,windowAssembly);
    }
    windowRing(13.96,4.45,13.18,3.78,-half-.07,.17,roomIron);
    windowRing(13.82,4.30,13.20,3.80,-half+.10,.14,roomBronze);
    windowRing(13.36,3.96,13.20,3.80,-half+.24,.045,roomBrass);
    const glass=new THREE.Mesh(new THREE.ShapeGeometry(windowShape,48),new THREE.MeshPhongMaterial({
        color:0x9adce9,specular:0xe4faff,shininess:100,transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    glass.name='metal-room-oval-aquarium-window';glass.position.z=-half-.13;glass.renderOrder=2;room.add(glass);
    for(let i=0;i<40;i++) {
        const angle=i*Math.PI*2/40,x=Math.cos(angle)*6.76,y=ROOM_HEIGHT/2+Math.sin(angle)*2.025;
        const bolt=new THREE.CylinderGeometry(.062,.062,.045,6);
        bolt.rotateX(Math.PI/2);bolt.translate(x,y,-half+.265);add(bolt,roomBrass,windowAssembly);
    }
    for(const side of [-1,1]) {
        rod(windowAssembly,[side*7.12,.4,-half+.19],[side*7.12,4.6,-half+.19],.065,copper);
        for(const y of [.55,1.05,3.95,4.45]) {
            const collar=new THREE.CylinderGeometry(.10,.10,.09,8);
            collar.translate(side*7.12,y,-half+.19);add(collar,roomBronze,windowAssembly);
        }
    }
    const gauge=new THREE.CylinderGeometry(.25,.25,.12,16);
    gauge.rotateX(Math.PI/2);gauge.translate(6.98,.86,-half+.25);add(gauge,roomBronze,windowAssembly);
    const dial=new THREE.CircleGeometry(.195,24);dial.translate(6.98,.86,-half+.315);
    add(dial,new THREE.MeshBasicMaterial({color:0xdfcc9a,fog:false}),windowAssembly);
    rod(windowAssembly,[6.98,.86,-half+.325],[7.08,.98,-half+.325],.016,roomIron);
    // Juntas rasantes: no introducen escalones en el suelo.
    for(let step=-6;step<=6;step+=2) {
        box(room,.025,.008,ROOM_WIDTH,step,.005,0,roomIron);
        box(room,ROOM_WIDTH,.008,.025,0,.005,step,roomIron);
        for(const [start,end] of (step===0?[[-half,EXIT_Z-.92],[EXIT_Z+.92,half]]:[[-half,half]]))
            box(room,.025,.015,end-start,step,ROOM_HEIGHT-.01,(start+end)/2,roomIron);
        // Dos tramos conservan el hueco de la escotilla en la junta central del techo.
        for(const [start,end] of (Math.abs(step-EXIT_Z)<.9?[[-half,-.92],[.92,half]]:[[-half,half]]))
            box(room,end-start,.015,.025,(start+end)/2,ROOM_HEIGHT-.01,step,roomIron);
        for(const sign of [-1,1]) {
            if(sign>0)box(room,.035,ROOM_HEIGHT,.025,step,ROOM_HEIGHT/2,sign*(half-.005),roomIron);
            box(room,.025,ROOM_HEIGHT,.035,sign*(half-.005),ROOM_HEIGHT/2,step,roomIron);
        }
    }
    for(const y of [1,3])for(const sign of [-1,1]) {
        if(sign>0)box(room,ROOM_WIDTH,.035,.025,0,y,sign*(half-.005),roomIron);
        box(room,.025,.035,ROOM_WIDTH,sign*(half-.005),y,0,roomIron);
    }
    for(const x of [-3.6,3.6]) {
        box(room,.55,.08,5,x,ROOM_HEIGHT-.10,0,roomIron);
        box(room,.32,.035,4.65,x,ROOM_HEIGHT-.16,0,lamp);
    }
    // Escotilla circular horizontal, con volante accesible desde el último peldaño.
    const exitFrame=new THREE.Group();exitFrame.name='metal-room-inner-hatch-frame';room.add(exitFrame);
    const exitScale=.86/1.10;
    const exitRim=new THREE.ExtrudeGeometry(rimShape,{depth:.38*exitScale,bevelEnabled:false,curveSegments:16});
    exitRim.scale(exitScale,exitScale,1);exitRim.rotateX(Math.PI/2);
    exitRim.translate(0,ROOM_HEIGHT+.26*exitScale,EXIT_Z);add(exitRim,roomHatchIron,exitFrame);
    const exitHinge=new THREE.Group();exitHinge.name='metal-room-ceiling-hatch';exitHinge.position.set(0,ROOM_HEIGHT,EXIT_Z-.86);room.add(exitHinge);
    hatchLid(exitHinge,.86,.86,-1,roomBronze,roomHatchIron,roomBrass);
    for(const sign of [-1,1])
        rod(exitFrame,[(sign*.42-.14)*exitScale,ROOM_HEIGHT,EXIT_Z-.86],
            [(sign*.42+.14)*exitScale,ROOM_HEIGHT,EXIT_Z-.86],.10*exitScale,roomBrass);
    const exitTarget=new THREE.Mesh(new THREE.CylinderGeometry(1.03,1.03,.3,24),new THREE.MeshBasicMaterial({visible:false}));
    exitTarget.name='metal-room-return-port';exitTarget.position.set(0,ROOM_HEIGHT-.06,EXIT_Z);exitTarget.userData={type:'METAL_ROOM_EXIT'};room.add(exitTarget);
    // Base alineada con el extremo superior: escalera vertical fuera de la escotilla.
    const ladderZ=y=>LADDER_BOTTOM_Z+(LADDER_TOP_Z-LADDER_BOTTOM_Z)*y/LADDER_RAIL_HEIGHT;
    const ladderGroup=new THREE.Group();ladderGroup.name='metal-room-exit-ladder';room.add(ladderGroup);
    for(const x of [-.42,.42]) {
        rod(ladderGroup,[x,.12,ladderZ(.12)],[x,LADDER_RAIL_HEIGHT,LADDER_TOP_Z],.045,roomIron);
        box(ladderGroup,.23,.08,.28,x,.04,LADDER_BOTTOM_Z,roomIron);
        rod(ladderGroup,[x,LADDER_RAIL_HEIGHT,LADDER_TOP_Z],[x,ROOM_HEIGHT-.10,LADDER_TOP_Z+.04],.04,roomIron);
        box(ladderGroup,.20,.12,.24,x,ROOM_HEIGHT-.09,LADDER_TOP_Z+.04,roomIron);
    }
    for(let y=.27;y<LADDER_RAIL_HEIGHT;y+=.30)rod(ladderGroup,[-.42,y,ladderZ(y)],[.42,y,ladderZ(y)],.031,bronze);
    for(const {parent,material,parts} of batches.values()) {
        const mesh=new THREE.Mesh(mergeGeometries(parts,false),material);mesh.name=parent===room?'metal-room-panels-and-details':'metal-hatch-details';
        parent.add(mesh);for(const part of parts)part.dispose();
    }
    let active=false,phase='idle',elapsed=0,fade=0,furnitureBounds=[];
    function begin(next) {if(phase!=='idle')return false;phase=next;elapsed=0;return true;}
    const ease=t=>t*t*(3-2*t);
    return {
        hatch,room,target,exitTarget,hinge,exitHinge,
        aquariumLayout:{width:ROOM_WIDTH,depth:ROOM_WIDTH,height:ROOM_HEIGHT,frontZ:-half-.2},
        ladder:{x:room.position.x,z:room.position.z+LADDER_BOTTOM_Z-.48,
            topZ:room.position.z+ladderZ(ROOM_HEIGHT-PLAYER_HEIGHT-.25)-.48,
            baseY:ROOM_BASE,maxFootHeight:ROOM_HEIGHT-PLAYER_HEIGHT-.25},
        spawn:new THREE.Vector3(room.position.x,ROOM_BASE+PLAYER_HEIGHT,room.position.z+2),
        returnPosition:new THREE.Vector3(hatch.position.x+2.25,groundY+PLAYER_HEIGHT,hatch.position.z),
        get active(){return active;},get busy(){return phase!=='idle';},get fade(){return fade;},get phase(){return phase;},
        setRevealed(value){revealed=!!value;hatch.visible=revealed;},
        beginEnter(){if(!revealed||active||!begin('opening'))return false;exitHinge.rotation.x=0;return true;},
        beginLeave(){return active&&begin('leaving');},
        nearHatch(position){return revealed&&Math.hypot(position.x-hatch.position.x,position.z-hatch.position.z)<3&&Math.abs(position.y-groundY)<3;},
        nearExit(position){return Math.hypot(position.x-room.position.x,position.z-(room.position.z+EXIT_Z))<1.05&&position.y>=ROOM_BASE+ROOM_HEIGHT-.95;},
        nearLadder(position){return Math.hypot(position.x-room.position.x,position.z-(room.position.z+LADDER_BOTTOM_Z-.48))<1.15;},
        setFurnitureBounds(bounds){furnitureBounds=bounds;},
        surfaceHeight(x,z){return revealed&&Math.hypot(x-hatch.position.x,z-hatch.position.z)<1.35?groundY+.18:null;},
        getHeight(){return ROOM_BASE;},
        upperLimit(){return ROOM_BASE+ROOM_HEIGHT-.15;},
        isWall(x,z){
            const dx=x-room.position.x,dz=z-room.position.z;
            return Math.abs(dx)>ROOM_WIDTH/2-COLLISION_RADIUS-.06||Math.abs(dz)>ROOM_WIDTH/2-COLLISION_RADIUS-.06
                ||Math.abs(dx)<.45+COLLISION_RADIUS&&Math.abs(dz-LADDER_BOTTOM_Z)<.04+COLLISION_RADIUS
                ||furnitureBounds.some(b=>dx>b.minX-COLLISION_RADIUS&&dx<b.maxX+COLLISION_RADIUS&&dz>b.minZ-COLLISION_RADIUS&&dz<b.maxZ+COLLISION_RADIUS);
        },
        localPosition(position){return new THREE.Vector3(position.x-room.position.x,position.y-ROOM_BASE,position.z-room.position.z);},
        reset(){active=false;room.visible=false;phase='idle';elapsed=fade=0;hinge.rotation.x=exitHinge.rotation.x=0;},
        update(delta) {
            if(phase==='idle'||delta<=0)return null;
            elapsed+=delta;
            if(phase==='opening') {
                hinge.rotation.x=-1.72*ease(Math.min(1,elapsed/.9));
                fade=Math.min(1,Math.max(0,(elapsed-.72)/.24));
                if(elapsed>=.96){active=true;room.visible=true;phase='arriving';elapsed=0;fade=1;return 'enter';}
            } else if(phase==='arriving') {
                fade=1-Math.min(1,elapsed/.3);if(elapsed>=.3){phase='idle';fade=0;}
            } else if(phase==='leaving') {
                fade=Math.min(1,elapsed/.24);
                exitHinge.rotation.x=-1.5*ease(Math.min(1,elapsed/.24));
                if(elapsed>=.24){active=false;room.visible=false;phase='closing';elapsed=0;return 'leave';}
            } else if(phase==='closing') {
                hinge.rotation.x=-1.72*(1-ease(Math.min(1,elapsed/.8)));
                fade=1-Math.min(1,elapsed/.3);if(elapsed>=.8){phase='idle';fade=0;hinge.rotation.x=0;}
            }
            return null;
        }
    };
}
