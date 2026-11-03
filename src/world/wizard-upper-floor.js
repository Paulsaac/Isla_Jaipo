import {COLLISION_RADIUS,HOUSE_UPPER_FLOOR_THICKNESS,PLAYER_HEIGHT} from '../config.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {wizardHouseLayout} from '../content/summit-layout.js';

// Arquitectura de la casa de la cima; conserva los mapas y la puerta originales.
export const isWizardHouseRoofCell=(x,z)=>{
    const b=wizardHouseLayout.sourceBounds,o=wizardHouseLayout.offsetCells;
    return x>=b.minX+o.x&&x<=b.maxX+o.x&&z>=b.minZ+o.z&&z<=b.maxZ+o.z;
};

export function createWizardUpperFloor(THREE,baseY,textures) {
    const origin={...wizardHouseLayout.origin}, middleLevel=3.2, level=6.4, stepsPerTurn=32, steps=64, rise=level/steps;
    const middleFloorThickness=.45;
    const {halfX:groundX,halfZ:groundZ,wallThickness}=wizardHouseLayout.ground;
    const groundInner={x:groundX-wallThickness,z:groundZ-wallThickness};
    const stair={x:0,z:1.7,inner:.2,outer:2.05,hole:2.14};
    // Marco único para peldaños, hueco, desembarco y consultas físicas.
    // La entrada mira al frente de la sala, junto a la llegada del tramo recto.
    const stairPlacement={x:.6,z:.9,rotation:-Math.PI/2};
    const stairCos=Math.cos(stairPlacement.rotation),stairSin=Math.sin(stairPlacement.rotation);
    const placeStair=p=>({x:stairPlacement.x+stairCos*(p.x-stair.x)-stairSin*(p.z-stair.z),
        z:stairPlacement.z+stairSin*(p.x-stair.x)+stairCos*(p.z-stair.z)});
    const stairLocal=p=>({x:stair.x+stairCos*(p.x-stairPlacement.x)+stairSin*(p.z-stairPlacement.z),
        z:stair.z-stairSin*(p.x-stairPlacement.x)+stairCos*(p.z-stairPlacement.z)});
    const stairRadius=p=>Math.hypot(p.x-stairPlacement.x,p.z-stairPlacement.z);
    const straight={start:-2,end:4.4,z:6.05,half:.8,steps:20,holeStart:-.1,holeHalf:.96};
    const partitionZ=-1.9,landingHalfWidth=.72;
    const middleBounds={x:7.8,z:7.8},towerBounds={apothem:4.8},towerCeiling=11;
    const stairStart=Math.PI,stairDirection=-1;
    const towerNormals=Array.from({length:6},(_,i)=>({x:Math.cos(i*Math.PI/3),z:Math.sin(i*Math.PI/3)}));
    const hexagon=(apothem)=>Array.from({length:6},(_,i)=>{
        const angle=Math.PI/6+i*Math.PI/3,radius=apothem/Math.cos(Math.PI/6);
        return {x:radius*Math.cos(angle),z:radius*Math.sin(angle)};
    });
    const group=new THREE.Group();group.name='mountain-wizard-upper-floor';
    group.position.set(origin.x,baseY,origin.z);
    const interior=new THREE.Group();interior.name='wizard-house-interior';group.add(interior);
    const interiorLights=[];
    let interiorPhase=false,spiralPhase=false;
    function tiled(texture) {
        const copy=texture.clone();copy.wrapS=copy.wrapT=THREE.RepeatWrapping;
        copy.magFilter=copy.minFilter=THREE.NearestFilter;copy.needsUpdate=true;return copy;
    }
    // Variante de piedra clara al mismo tamaño de píxel; el original permanece intacto.
    const wallCanvas=document.createElement('canvas');wallCanvas.width=textures.wall.image.width;wallCanvas.height=textures.wall.image.height;
    const wallContext=wallCanvas.getContext('2d');wallContext.drawImage(textures.wall.image,0,0);
    const wallPixels=wallContext.getImageData(0,0,wallCanvas.width,wallCanvas.height);
    for(let i=0;i<wallPixels.data.length;i+=4) {
        const luma=(wallPixels.data[i]+wallPixels.data[i+1]+wallPixels.data[i+2])/3;
        const shade=luma<34?38+luma*1.2:105+luma;
        wallPixels.data[i]=Math.round(Math.min(220,shade+1)*.83);
        wallPixels.data[i+1]=Math.round(Math.min(220,shade+1)*.83);
        wallPixels.data[i+2]=Math.round(Math.min(220,shade+2)*.83);
    }
    wallContext.putImageData(wallPixels,0,0);
    const wallMap=new THREE.CanvasTexture(wallCanvas);wallMap.colorSpace=THREE.SRGBColorSpace;
    wallMap.wrapS=wallMap.wrapT=THREE.RepeatWrapping;wallMap.magFilter=wallMap.minFilter=THREE.NearestFilter;
    const wood=new THREE.MeshPhongMaterial({map:tiled(textures.wood),color:0x9b7751,shininess:0});
    const floorEdge=new THREE.MeshPhongMaterial({map:tiled(textures.wood),color:0xc29a6b,shininess:0});
    const stone=new THREE.MeshPhongMaterial({map:wallMap,color:0xd0d1d3,
        emissiveMap:wallMap,emissive:0xb8babd,emissiveIntensity:.45,shininess:0,side:THREE.DoubleSide});
    const roof=new THREE.MeshPhongMaterial({map:tiled(textures.roof),color:0x70786c,
        emissiveMap:tiled(textures.roof),emissive:0x4a5146,emissiveIntensity:.18,shininess:0});
    const iron=new THREE.MeshPhongMaterial({color:0x394148,shininess:18,flatShading:true});
    function tileUV(geometry) {
        const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
        for(let i=0;i<p.count;i++) {
            uv.setXY(i,(Math.abs(n.getX(i))>0.5?p.getZ(i):p.getX(i))/2,
                (Math.abs(n.getY(i))>0.5?p.getZ(i):p.getY(i))/2);
        }
        return geometry;
    }
    function mesh(geometry,material,name) {
        if(spiralPhase) {
            geometry.translate(-stair.x,0,-stair.z);geometry.rotateY(-stairPlacement.rotation);
            geometry.translate(stairPlacement.x,0,stairPlacement.z);
            tileUV(geometry);
        }
        const object=new THREE.Mesh(geometry,material);object.name=name;(interiorPhase?interior:group).add(object);return object;
    }
    function box(w,h,d,x,y,z,material=wood,name='wizard-upper-beam') {
        const geometry=new THREE.BoxGeometry(w,h,d);geometry.translate(x,y,z);tileUV(geometry);
        return mesh(geometry,material,name);
    }
    function rod(a,b,r,material=iron) {
        const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
        const geometry=new THREE.CylinderGeometry(r,r,direction.length(),6);
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
        geometry.translate(...start.add(end).multiplyScalar(.5).toArray());return mesh(geometry,material,'wizard-stair-rail');
    }
    function floorAt(height,bounds) {
        // Piso y cara interior de los muros comparten arista, sin franjas solapadas.
        const inset=.14;
        const points=bounds.apothem?hexagon(bounds.apothem-inset):[
            {x:-bounds.x+inset,z:-bounds.z+inset},{x:bounds.x-inset,z:-bounds.z+inset},
            {x:bounds.x-inset,z:bounds.z-inset},{x:-bounds.x+inset,z:bounds.z-inset}];
        const outline=new THREE.Shape();points.forEach((p,i)=>i?outline.lineTo(p.x,-p.z):outline.moveTo(p.x,-p.z));outline.closePath();
        // El desembarco forma parte del mismo piso, sin una caja superpuesta.
        const opening=new THREE.Path(),cutAngle=Math.asin(landingHalfWidth/stair.hole);
        const cutX=stair.x-Math.sqrt(stair.hole**2-landingHalfWidth**2);
        opening.moveTo(cutX,-stair.z-landingHalfWidth);
        // Después del último peldaño, el desembarco abarca toda su huella
        // radial. Mantener libre el lado de llegada para no tapar la subida.
        opening.lineTo(stair.x-stair.inner,-stair.z-landingHalfWidth);
        opening.lineTo(stair.x-stair.inner,-stair.z);
        opening.lineTo(stair.x-1.25,-stair.z);
        opening.lineTo(stair.x-1.25,-stair.z+landingHalfWidth);
        opening.lineTo(cutX,-stair.z+landingHalfWidth);
        opening.absarc(stair.x,-stair.z,stair.hole,Math.PI-cutAngle,-Math.PI+cutAngle,true);
        opening.closePath();
        // El hueco debe recorrer el sentido inverso al contorno exterior:
        // de otro modo el canto apunta hacia dentro de la losa y desaparece desde la escalera.
        const openingPoints=height===middleLevel
            ?[new THREE.Vector2(straight.holeStart,-straight.z-straight.holeHalf),
                new THREE.Vector2(straight.end,-straight.z-straight.holeHalf),
                new THREE.Vector2(straight.end,-straight.z+straight.holeHalf),
                new THREE.Vector2(straight.holeStart,-straight.z+straight.holeHalf)]
            :opening.getPoints(32).map(p=>{const placed=placeStair({x:p.x,z:-p.y});
                return new THREE.Vector2(placed.x,-placed.z);});
        if(THREE.ShapeUtils.isClockWise(openingPoints))openingPoints.reverse();
        outline.holes.push(new THREE.Path(openingPoints));
        const floorThickness=height===middleLevel?middleFloorThickness:HOUSE_UPPER_FLOOR_THICKNESS;
        const floorGeometry=new THREE.ExtrudeGeometry(outline,{depth:floorThickness,bevelEnabled:false,curveSegments:32});
        floorGeometry.rotateX(-Math.PI/2);floorGeometry.translate(0,height-floorThickness,0);tileUV(floorGeometry);
        if(height===middleLevel) {
            // Cada cara se dibuja una sola vez: el canto sustituye a los laterales
            // del forjado, en vez de recubrirlos con una segunda piel casi coplanaria.
            for(const part of floorGeometry.groups) {
                const geometry=new THREE.BufferGeometry();
                for(const name of ['position','normal','uv']) {
                    const attribute=floorGeometry.attributes[name],size=attribute.itemSize;
                    geometry.setAttribute(name,new THREE.Float32BufferAttribute(
                        attribute.array.slice(part.start*size,(part.start+part.count)*size),size));
                }
                mesh(geometry,part.materialIndex===1?floorEdge:wood,
                    part.materialIndex===1?'wizard-second-storey-floor-edge':'wizard-second-storey-floor');
            }
            floorGeometry.dispose();
        } else mesh(floorGeometry,wood,'wizard-tower-floor');
    }
    // Grosor inferior hacia el interior, conservando las caras exteriores.
    // La fachada occidental conserva la puerta central y añade las dos ventanas del dibujo.
    const groundWall=new THREE.Shape();groundWall.moveTo(-9,0);groundWall.lineTo(-1,0);
    groundWall.lineTo(-1,2.44);groundWall.lineTo(1,2.44);groundWall.lineTo(1,0);
    const groundWallTop=middleLevel-.02;
    groundWall.lineTo(9,0);groundWall.lineTo(9,groundWallTop);groundWall.lineTo(-9,groundWallTop);groundWall.closePath();
    const windowGlass=new THREE.MeshPhongMaterial({color:0xe6d5b3,transparent:true,opacity:.12,
        shininess:55,specular:0xaaa28e,side:THREE.DoubleSide,depthWrite:false});
    const windowFrame=new THREE.MeshPhongMaterial({color:0x101112,shininess:12});
    function pointedWindow(wall,{center=0,bottom=.88,height=1.51,angle=-Math.PI/2,distance=10}={}) {
        const widthScale=.7,heightScale=height/1.51;
        function outline(points,hole=false) {
            const shape=hole?new THREE.Path():new THREE.Shape();
            points.forEach(([x,y],i)=>{
                const px=center+x*widthScale,py=bottom+(y-.88)*heightScale;
                i?shape.lineTo(px,py):shape.moveTo(px,py);
            });shape.closePath();return shape;
        }
        const points=[[-.46,.88],[-.46,2.15],[0,2.39],[.46,2.15],[.46,.88]];
        const opening=outline(points,true);
        wall.holes.push(opening);
        const glassGeometry=new THREE.ShapeGeometry(outline(points));
        glassGeometry.translate(0,0,distance-.01);glassGeometry.rotateY(angle);
        mesh(glassGeometry,windowGlass,'wizard-clear-window');
        // Marco y cruz continuos, escalados juntos para mantener todas las uniones.
        const frame=outline([[-.54,.8],[-.54,2.2],[0,2.48],[.54,2.2],[.54,.8]]);
        const innerRoof=x=>2.34-Math.abs(x)*(.22/.42);
        for(const [left,right] of [[-.42,-.035],[.035,.42]]) {
            for(const upper of [false,true]) {
                const low=upper?1.5525:.92;
                frame.holes.push(outline([[left,low],[right,low],
                    [right,upper?innerRoof(right):1.4875],[left,upper?innerRoof(left):1.4875]],true));
            }
        }
        const frameGeometry=new THREE.ExtrudeGeometry(frame,{depth:.12,bevelEnabled:false});
        frameGeometry.translate(0,0,distance-.04);frameGeometry.rotateY(angle);
        mesh(frameGeometry,windowFrame,'wizard-black-window-frame');
    }
    for(const center of [-5,5]) pointedWindow(groundWall,{center});
    const groundGeometry=new THREE.ExtrudeGeometry(groundWall,{depth:wallThickness,bevelEnabled:false});
    groundGeometry.translate(0,0,groundInner.x);groundGeometry.rotateY(-Math.PI/2);tileUV(groundGeometry);
    const entryFrameStone=new THREE.MeshPhongMaterial({map:tiled(textures.wall),shininess:0});
    mesh(groundGeometry,stone,'wizard-ground-front-wall');
    // Dintel completo, de sección y material iguales a las jambas. El hueco
    // de la fachada lo contiene sin pieles superpuestas ni saliente central.
    box(wallThickness,.24,2,-groundX+wallThickness/2,2.32,0,entryFrameStone,'wizard-entry-frame-header');
    for(const z of [-.88,.88])
        box(wallThickness,2.2,.24,-groundX+wallThickness/2,1.1,z,entryFrameStone,'wizard-entry-jamb');
    // La tapa de piedra queda dentro del espesor del piso y no en su plano superior.
    box(wallThickness,groundWallTop,groundZ*2,groundX-wallThickness/2,groundWallTop/2,0,stone,'wizard-ground-back-wall');
    for(const z of [-groundZ+wallThickness/2,groundZ-wallThickness/2])
        box(groundInner.x*2,groundWallTop,wallThickness,0,groundWallTop/2,z,stone,'wizard-ground-side-wall');
    // Cerrar el techo del espacio ganado, unido al intradós del piso intermedio.
    const ceilingBorder=new THREE.Shape();
    ceilingBorder.moveTo(-groundInner.x,-groundInner.z);ceilingBorder.lineTo(groundInner.x,-groundInner.z);
    ceilingBorder.lineTo(groundInner.x,groundInner.z);ceilingBorder.lineTo(-groundInner.x,groundInner.z);ceilingBorder.closePath();
    const ceilingHole=new THREE.Path(),ceilingHalf=middleBounds.x-.14;
    ceilingHole.moveTo(-ceilingHalf,-ceilingHalf);ceilingHole.lineTo(-ceilingHalf,ceilingHalf);
    ceilingHole.lineTo(ceilingHalf,ceilingHalf);ceilingHole.lineTo(ceilingHalf,-ceilingHalf);ceilingHole.closePath();
    ceilingBorder.holes.push(ceilingHole);
    const ceilingBorderGeometry=new THREE.ExtrudeGeometry(ceilingBorder,{depth:.12,bevelEnabled:false});
    ceilingBorderGeometry.rotateX(-Math.PI/2);ceilingBorderGeometry.translate(0,middleLevel-middleFloorThickness,0);
    tileUV(ceilingBorderGeometry);mesh(ceilingBorderGeometry,wood,'space-wizard-ground-ceiling-border');
    floorAt(middleLevel,middleBounds);
    // Una sola losa de madera, con el hueco de la caracol. El antiguo encuentro
    // entre el piso hexagonal y el cielo rectangular dejaba ver la piedra de
    // la torre y formaba franjas al mirar desde abajo.
    floorAt(level,middleBounds);
    // La primera cornisa enlaza los muros originales con el primer tejado.
    for(const x of [-9,9])box(.28,.3,16,x,3.05,0,stone,'wizard-ground-cornice');
    for(const z of [-8,8])box(18,.3,.28,0,3.05,z,stone,'wizard-ground-cornice');
    // Las tapas de los muros quedan enterradas en el forjado, fuera de sus caras visibles.
    const middleWallBottom=middleLevel,middleWallTop=level;
    // Parejas simétricas; la fachada sigue los ejes ±5 de las ventanas inferiores.
    // Antepechos sobre el faldón inferior y puntas por debajo del alero superior.
    for(let side=0;side<4;side++) {
        const wall=new THREE.Shape(),half=middleBounds.x,angle=-Math.PI/2+side*Math.PI/2;
        wall.moveTo(-half,middleWallBottom);wall.lineTo(half,middleWallBottom);
        wall.lineTo(half,middleWallTop);wall.lineTo(-half,middleWallTop);wall.closePath();
        for(const center of [-5,5])pointedWindow(wall,{center,bottom:4.42,height:1.2,angle,distance:half+.14});
        const geometry=new THREE.ExtrudeGeometry(wall,{depth:.28,bevelEnabled:false});
        // Esquinas a inglete: las cuatro paredes terminan en una arista común,
        // sin cruzar sus tapas ni dejar caras superpuestas en las esquinas.
        const vertices=geometry.attributes.position;
        for(let i=0;i<vertices.count;i++) {
            const x=vertices.getX(i);
            if(Math.abs(Math.abs(x)-half)<.00001)
                vertices.setX(i,Math.sign(x)*(half-.14+vertices.getZ(i)));
        }
        geometry.computeVertexNormals();
        geometry.translate(0,0,half-.14);geometry.rotateY(angle);tileUV(geometry);
        mesh(geometry,stone,'wizard-middle-window-wall');
    }
    // Seis paños iguales, con caras frontales planas y dos flancos oblicuos.
    const halfFace=towerBounds.apothem*Math.tan(Math.PI/6);
    for(let side=0;side<6;side++) {
        const wall=new THREE.Shape();wall.moveTo(-halfFace,level);wall.lineTo(halfFace,level);
        wall.lineTo(halfFace,towerCeiling);wall.lineTo(-halfFace,towerCeiling);wall.closePath();
        // Una ventana centrada por paño del hexágono, lejos de los encuentros y el tabique.
        pointedWindow(wall,{bottom:8.35,height:2.01,angle:Math.PI/2-side*Math.PI/3,distance:towerBounds.apothem+.14});
        const geometry=new THREE.ExtrudeGeometry(wall,{depth:.28,bevelEnabled:false});
        // Encuentros a inglete: los seis muros comparten sus aristas interiores y exteriores.
        const vertices=geometry.attributes.position;
        for(let i=0;i<vertices.count;i++)
            vertices.setX(i,vertices.getX(i)*(towerBounds.apothem-.14+vertices.getZ(i))/towerBounds.apothem);
        geometry.computeVertexNormals();
        // La normal local +Z gira hasta cada normal del hexágono.
        geometry.translate(0,0,towerBounds.apothem-.14);geometry.rotateY(Math.PI/2-side*Math.PI/3);tileUV(geometry);
        const faceStone=stone.clone(),shade=side===3?1:(side===2||side===4?.87:.8);
        faceStone.color.multiplyScalar(shade);faceStone.emissive.multiplyScalar(shade);
        mesh(geometry,faceStone,'wizard-tower-pointed-window-wall');
    }
    // Tabique de la habitación: puerta de 1.5 m y dintel fijo.
    interiorPhase=true;
    const doorOpeningHalf=.88,doorOpeningHeight=2.3,partitionWidth=towerBounds.apothem-doorOpeningHalf;
    for(const side of [-1,1])box(partitionWidth,towerCeiling-level,.22,
        side*(doorOpeningHalf+partitionWidth/2),(level+towerCeiling)/2,partitionZ,stone,'wizard-bedroom-partition');
    box(doorOpeningHalf*2,towerCeiling-level-doorOpeningHeight,.22,0,
        (towerCeiling+level+doorOpeningHeight)/2,partitionZ,stone,'wizard-bedroom-lintel');
    // Holgura real entre hoja, jambas y hueco de piedra; ninguna cara comparte plano.
    for(const side of [-1,1])box(.14,2.30,.34,side*.86,level+1.11,partitionZ,wood,'wizard-bedroom-door-jamb');
    box(1.86,.14,.34,0,level+2.30,partitionZ,wood,'wizard-bedroom-door-header');
    // Primer tramo recto junto al muro, con madera y herrajes de la caracol.
    const treadDepth=(straight.end-straight.start)/straight.steps;
    for(let i=0;i<straight.steps;i++) {
        const x=straight.start+(i+.5)*treadDepth,y=(i+1)*middleLevel/straight.steps;
        box(treadDepth,.075,straight.half*2,x,y-.0375,straight.z,wood,'wizard-straight-step');
        if(i%2===0)for(const side of [-1,1]) {
            const z=straight.z+side*straight.half;
            rod([x,y,z],[x,y+.9,z],.022);
        }
    }
    for(const side of [-1,1]) {
        const z=straight.z+side*straight.half;
        rod([straight.start,.98,z],[straight.end,middleLevel+.98,z],.032,wood);
        rod([straight.start,-.04,z],[straight.end,middleLevel-.04,z],.045,iron);
        const guardZ=straight.z+side*straight.holeHalf;
        rod([straight.holeStart,middleLevel+.95,guardZ],[straight.end,middleLevel+.95,guardZ],.033,wood);
        for(let x=straight.holeStart;x<=straight.end+.001;x+=.9)
            rod([x,middleLevel,guardZ],[x,middleLevel+.95,guardZ],.025);
    }
    rod([straight.holeStart,middleLevel+.95,straight.z-straight.holeHalf],
        [straight.holeStart,middleLevel+.95,straight.z+straight.holeHalf],.033,wood);
    // Solo la vuelta superior de caracol conecta el segundo piso con la torre.
    spiralPhase=true;
    const delta=Math.PI*2/stepsPerTurn;
    rod([stair.x,middleLevel,stair.z],[stair.x,level+1.05,stair.z],.095,iron);
    for(let i=stepsPerTurn;i<steps;i++) {
        const a=stairStart+stairDirection*i*delta,b=stairStart+stairDirection*(i+1)*delta,shape=new THREE.Shape();
        shape.moveTo(stair.x+stair.inner*Math.cos(a),-(stair.z+stair.inner*Math.sin(a)));
        for(let s=0;s<=3;s++) {const angle=a+(b-a)*s/3;shape.lineTo(stair.x+stair.outer*Math.cos(angle),-(stair.z+stair.outer*Math.sin(angle)));}
        for(let s=3;s>=0;s--) {const angle=a+(b-a)*s/3;shape.lineTo(stair.x+stair.inner*Math.cos(angle),-(stair.z+stair.inner*Math.sin(angle)));}
        shape.closePath();
        const geometry=new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:false,steps:1});
        geometry.rotateX(-Math.PI/2);geometry.translate(0,(i+1)*rise-.075,0);tileUV(geometry);
        mesh(geometry,wood,`wizard-spiral-step-${i+1}`);
        if(i%stepsPerTurn>1&&i%stepsPerTurn<stepsPerTurn-2) {
            const x=stair.x+stair.outer*Math.cos(b),z=stair.z+stair.outer*Math.sin(b),y=(i+1)*rise;
            rod([x,y,z],[x,y+.90,z],.022);
            const px=stair.x+stair.outer*Math.cos(a),pz=stair.z+stair.outer*Math.sin(a);
            rod([px,i*rise+.90,pz],[x,y+.90,z],.032,wood);
        }
    }
    // Remate del desembarco occidental: postes apoyados en la losa y
    // pasamanos unido a la protección circular, dejando libre la salida.
    const landingEdgeZ=stair.z+landingHalfWidth;
    const landingCutX=stair.x-Math.sqrt(stair.hole**2-landingHalfWidth**2);
    for(const x of [landingCutX,stair.x-stair.inner])
        rod([x,level,landingEdgeZ],[x,level+.95,landingEdgeZ],.025);
    rod([landingCutX,level+.95,landingEdgeZ],[stair.x-stair.inner,level+.95,landingEdgeZ],.033,wood);
    rod([landingCutX,level+.95,landingEdgeZ],
        [stair.x+stair.hole*Math.cos(stairStart+stairDirection*.42),level+.95,
            stair.z+stair.hole*Math.sin(stairStart+stairDirection*.42)],.033,wood);
    // Baranda de protección del hueco, dejando abierto el desembarco occidental.
    for(const height of [level])for(let i=0;i<28;i++) {
        const a=stairStart+stairDirection*(.42+i*(Math.PI*2-.84)/28),b=stairStart+stairDirection*(.42+(i+1)*(Math.PI*2-.84)/28);
        const x=stair.x+stair.hole*Math.cos(a),z=stair.z+stair.hole*Math.sin(a);
        const nx=stair.x+stair.hole*Math.cos(b),nz=stair.z+stair.hole*Math.sin(b);
        if(i%3===0)rod([x,height,z],[x,height+.95,z],.025);
        rod([x,height+.95,z],[nx,height+.95,nz],.033,wood);
    }
    // Cubiertas anulares escalonadas: el centro queda libre para la torre.
    spiralPhase=false;
    interiorPhase=false;
    function steppedRingRoof(outer,inner,bottom,top,bands,name) {
        const positions=[];
        function quad(a,b,c,d){positions.push(...a,...b,...c,...a,...c,...d);}
        const ring=(t,y)=>outer.map((p,j)=>[
            THREE.MathUtils.lerp(p.x,inner[j].x,t),y,THREE.MathUtils.lerp(p.z,inner[j].z,t)]);
        for(let i=0;i<bands;i++) {
            const t=i/bands,next=(i+1)/bands,y=bottom+(top-bottom)*t,ny=bottom+(top-bottom)*next;
            const a=ring(t,y),b=ring(next,y),c=ring(next,ny);
            for(let j=0;j<outer.length;j++){const k=(j+1)%outer.length;quad(a[j],a[k],b[k],b[j]);quad(b[j],b[k],c[k],c[j]);}
        }
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));
        geometry.computeVertexNormals();tileUV(geometry);mesh(geometry,roof,name);
    }
    const rectangle=(x,z)=>[{x:-x,z:-z},{x:-x,z},{x,z},{x,z:-z}];
    roof.side=THREE.DoubleSide;
    steppedRingRoof(rectangle(11,10),rectangle(middleBounds.x,middleBounds.z),3.05,4.3,8,'wizard-lower-stepped-roof');
    // El faldón rectangular se cierra exactamente contra el perímetro hexagonal.
    // Incluir las esquinas de ambos contornos evita huecos y caras recortadas.
    const directions=[...hexagon(1),...rectangle(9.5,8.6),...rectangle(middleBounds.x,middleBounds.z)]
        .map(p=>Math.atan2(p.z,p.x)).sort((a,b)=>b-a);
    const outerRing=[],bodyRing=[],innerRing=[];
    for(const angle of directions) {
        const x=Math.cos(angle),z=Math.sin(angle);
        const outerRadius=Math.min(9.5/Math.abs(x),8.6/Math.abs(z));
        const innerRadius=towerBounds.apothem/Math.max(...towerNormals.map(n=>n.x*x+n.z*z));
        const bodyRadius=Math.min(middleBounds.x/Math.abs(x),middleBounds.z/Math.abs(z));
        bodyRing.push({x:x*bodyRadius,z:z*bodyRadius});
        outerRing.push({x:x*outerRadius,z:z*outerRadius});innerRing.push({x:x*innerRadius,z:z*innerRadius});
    }
    // El último escalón debe quedar sobre el canto exterior del muro de .28,
    // no solo sobre su eje: de lo contrario la piedra atraviesa el faldón.
    const middleRoofShoulder=level+.24;
    steppedRingRoof(outerRing,bodyRing,5.9,middleRoofShoulder,4,'wizard-middle-roof-overhang');
    steppedRingRoof(bodyRing,innerRing,middleRoofShoulder,7.8,6,'wizard-middle-stepped-roof');
    const roofHexagon=hexagon(towerBounds.apothem+.95).reverse();
    steppedRingRoof(roofHexagon,roofHexagon.map(()=>({x:0,z:0})),towerCeiling,15.7,16,'wizard-tower-hexagonal-roof');
    // Canto grueso de los aleros, para que cada tejado se lea desde el suelo.
    for(const [x,z,y] of [[11,10,3.05],[9.5,8.6,5.9]]) {
        for(const side of [-1,1]) {
            box(.18,.2,z*2,side*x,y-.1,0,roof,'wizard-roof-eave-edge');
            box(x*2,.2,.18,0,y-.1,side*z,roof,'wizard-roof-eave-edge');
        }
    }
    const ceilingShape=new THREE.Shape();hexagon(towerBounds.apothem).forEach((p,i)=>
        i?ceilingShape.lineTo(p.x,-p.z):ceilingShape.moveTo(p.x,-p.z));ceilingShape.closePath();
    const ceilingGeometry=new THREE.ExtrudeGeometry(ceilingShape,{depth:.12,bevelEnabled:false});
    ceilingGeometry.rotateX(-Math.PI/2);ceilingGeometry.translate(0,towerCeiling-.12,0);tileUV(ceilingGeometry);
    mesh(ceilingGeometry,wood,'wizard-tower-hexagonal-ceiling');
    interiorPhase=true;
    const pivot=new THREE.Group();pivot.position.set(-.75,level,partitionZ);interior.add(pivot);
    const bedroomDoorFace=new THREE.MeshPhongMaterial({map:textures.door,color:0xa88a66,shininess:0});
    const bedroomDoorEdge=new THREE.MeshPhongMaterial({color:0x46372b,shininess:0});
    const door=new THREE.Mesh(new THREE.BoxGeometry(1.5,2.18,.12),
        [bedroomDoorEdge,bedroomDoorEdge,bedroomDoorEdge,bedroomDoorEdge,bedroomDoorFace,bedroomDoorFace]);
    door.position.set(.75,1.09,0);door.name='wizard-upstairs-bedroom-door';
    door.userData={type:'WIZARD_UPPER_DOOR',isOpen:false};pivot.add(door);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(.045,6,4),new THREE.MeshPhongMaterial({color:0xb6a06a,shininess:20}));
    knob.position.set(1.32,1.05,.09);knob.userData.type='WIZARD_UPPER_DOOR';pivot.add(knob);
    for(const z of [-2.7,2.7]) {
        const lamp=new THREE.PointLight(0xffdec0,3.0,11,2);lamp.position.set(0,level+2.4,z);group.add(lamp);interiorLights.push(lamp);
        box(.24,.12,.24,0,level+2.65,z,iron,'wizard-upper-lamp');
        const glass=new THREE.MeshPhongMaterial({color:0xe3c185,emissive:0x8d6533,emissiveIntensity:.6,shininess:0});
        box(.16,.18,.16,0,level+2.52,z,glass,'wizard-upper-lamp-glass');
    }
    // Las piezas inmóviles comparten dibujo por material; la puerta conserva su pivote.
    for(const parent of [group,interior]) {
    const batches=new Map();
    for(const object of [...parent.children]) {
        if(!object.isMesh)continue;
        const parts=batches.get(object.material)??[];
        const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry;
        if(geometry!==object.geometry)object.geometry.dispose();
        parts.push(geometry);batches.set(object.material,parts);parent.remove(object);
    }
    for(const [material,parts] of batches) {
        const merged=new THREE.Mesh(mergeGeometries(parts,false),material);merged.name='wizard-upper-static-structure';parent.add(merged);
        parts.forEach(geometry=>geometry.dispose());
    }
    }
    const local=(x,z)=>({x:x-origin.x,z:z-origin.z});
    const contains=(x,z,margin=0)=>{const p=local(x,z);return Math.abs(p.x)<groundX+COLLISION_RADIUS-margin&&Math.abs(p.z)<groundZ+COLLISION_RADIUS-margin;};
    const angleAt=p=>{const q=stairLocal(p);
        return ((Math.atan2(q.z-stair.z,q.x-stair.x)-stairStart)*stairDirection+Math.PI*2)%(Math.PI*2);};
    const inside=(p,bounds,margin=0)=>bounds.apothem
        ? towerNormals.every(n=>p.x*n.x+p.z*n.z<bounds.apothem-margin)
        : Math.abs(p.x)<bounds.x-margin&&Math.abs(p.z)<bounds.z-margin;
    const landing=p=>{const q=stairLocal(p);
        return q.x<=(q.z>=stair.z?stair.x-stair.inner:stair.x-1.25)
            &&q.x>=stair.x-3.15&&Math.abs(q.z-stair.z)<=landingHalfWidth;};
    const inStraight=(p,margin=0)=>p.x>=straight.start-margin&&p.x<=straight.end+margin
        &&Math.abs(p.z-straight.z)<=straight.half+margin;
    const inStraightHole=p=>p.x>=straight.holeStart&&p.x<straight.end
        &&Math.abs(p.z-straight.z)<straight.holeHalf;
    const straightHeight=p=>baseY+Math.max(0,Math.min(middleLevel,
        middleLevel*(p.x-straight.start)/(straight.end-straight.start)+middleLevel/(straight.steps*2)));
    function treadLevels(p) {
        // Apoyo continuo sobre los peldaños visuales: la cámara no salta cada 10 cm.
        const heightInTurn=Math.min(middleLevel,angleAt(p)/(Math.PI*2)*middleLevel+rise*.5);
        return [baseY+middleLevel+heightInTurn];
    }
    function treadAt(p,feetY) {
        let height=-Infinity;
        for(const candidate of treadLevels(p)) {
            if(candidate<=feetY+.25)height=candidate;
        }
        return height;
    }
    function supportHeight(x,z,feetY) {
        if(!contains(x,z))return -Infinity;
        const p=local(x,z),r=stairRadius(p);
        let height=-Infinity;
        for(const [heightHere,bounds] of [[middleLevel,middleBounds],[level,towerBounds]]) {
            const opening=heightHere===middleLevel?inStraightHole(p):r<stair.hole&&!landing(p);
            if(inside(p,bounds)&&!opening&&feetY>=baseY+heightHere-.25)
                height=baseY+heightHere;
        }
        if(inStraight(p)&&straightHeight(p)<=feetY+.25)height=Math.max(height,straightHeight(p));
        if(r>=stair.inner&&r<=stair.outer) {
            height=Math.max(height,treadAt(p,feetY));
        }
        return height;
    }
    function doorOverlap(p,angle,radius=COLLISION_RADIUS) {
        const dx=p.x+.75,dz=p.z-partitionZ,c=Math.cos(angle),s=Math.sin(angle);
        const x=dx*c-dz*s,z=dx*s+dz*c;
        return Math.hypot(Math.max(-x,0,x-1.5),Math.max(Math.abs(z)-.06,0))<radius;
    }
    function blocksMovement(x,z,feetY,currentX=x,currentZ=z) {
        if(!contains(x,z)&&!contains(currentX,currentZ))return null;
        const p=local(x,z),q=stairLocal(p),r=stairRadius(p),angle=angleAt(p);
        const upstairs=feetY>=baseY+middleLevel-.25;
        const inTower=feetY>=baseY+level-.25;
        if(!upstairs&&feetY<baseY+middleLevel) {
            const reach=COLLISION_RADIUS,doorway=Math.abs(p.z)<.76-reach;
            if(Math.abs(p.z)>groundInner.z-reach||p.x>groundInner.x-reach
                ||p.x< -groundInner.x+reach&&!doorway)return true;
        }
        if(upstairs) {
            if(!inside(p,inTower?towerBounds:middleBounds,COLLISION_RADIUS+.15))return true;
            if(inTower) {
                if(Math.abs(p.z-partitionZ)<.11+COLLISION_RADIUS&&Math.abs(p.x)>.75-COLLISION_RADIUS)return true;
                if(doorOverlap(p,pivot.rotation.y))return true;
            }
        }
        const overlaps=(bottom,top)=>feetY<top&&feetY+PLAYER_HEIGHT>bottom;
        if(q.x>=landingCutX-COLLISION_RADIUS&&q.x<=stair.x-stair.inner+COLLISION_RADIUS
            &&Math.abs(q.z-landingEdgeZ)<COLLISION_RADIUS
            &&overlaps(baseY+level,baseY+level+.98))return true;
        if(r<stair.inner+COLLISION_RADIUS&&overlaps(baseY+middleLevel,baseY+level+1.05))return true;
        if(inStraight(p,COLLISION_RADIUS)) {
            const y=straightHeight(p);
            if(Math.abs(p.z-straight.z)>straight.half-COLLISION_RADIUS
                &&p.x>=straight.start&&p.x<=straight.end&&overlaps(y-.1,y+.95))return true;
            if(inStraight(p)&&y>feetY+.25&&overlaps(y-.075,y))return true;
        }
        if(feetY>=baseY+middleLevel-.25&&p.x>=straight.holeStart-COLLISION_RADIUS&&p.x<=straight.end) {
            const z=Math.abs(p.z-straight.z);
            if(Math.abs(z-straight.holeHalf)<COLLISION_RADIUS
                ||Math.abs(p.x-straight.holeStart)<COLLISION_RADIUS&&z<straight.holeHalf)
                if(overlaps(baseY+middleLevel,baseY+middleLevel+.98))return true;
        }
        if(r>stair.outer-COLLISION_RADIUS&&r<stair.hole+COLLISION_RADIUS) {
            // Barandas de los pisos y de cada vuelta, sin proyectarlas al suelo.
            if(angle>.42&&angle<Math.PI*2-.42
                &&overlaps(baseY+level,baseY+level+.98))return true;
            const stepIndex=Math.floor(angle/delta);
            if(stepIndex>1&&stepIndex<stepsPerTurn-2
                &&treadLevels(p).some(y=>overlaps(y-.1,y+.93)))return true;
        }
        if(r>=stair.inner&&r<=stair.outer&&!Number.isFinite(treadAt(p,feetY))) {
            // Un peldaño alto deja pasar por debajo; uno bajo sigue siendo sólido.
            if(treadLevels(p).some(y=>overlaps(y-.075,y)))return true;
        }
        return upstairs ? false : null;
    }
    function upperLimit(x,z,feetY) {
        if(!contains(x,z))return null;
        const p=local(x,z),r=stairRadius(p);
        if(feetY>=baseY+level-.25)
            return baseY+(Math.abs(p.z-partitionZ)<.3&&Math.abs(p.x)<.8 ? level+2 : towerCeiling-.2);
        if(inStraight(p)) {
            const y=straightHeight(p);
            if(y>feetY+.25)return Math.min(baseY+middleLevel-middleFloorThickness-.06,y-.135);
        }
        if(inStraightHole(p))return baseY+level-.36;
        if(r<stair.hole&&feetY>=baseY+middleLevel-.25) {
            let ceiling=baseY+(landing(p)?level-HOUSE_UPPER_FLOOR_THICKNESS-.06:towerCeiling-.2);
            if(r>=stair.inner&&r<=stair.outer)for(const y of treadLevels(p)) {
                if(y>feetY+.25)ceiling=Math.min(ceiling,y-.075-.06);
            }
            return ceiling;
        }
        if(feetY>=baseY+middleLevel-.25)return baseY+level-.36;
        // En la entrada inferior sigue mandando el dintel de la puerta original.
        if(p.x< -groundInner.x+.35&&Math.abs(p.z)<1)return baseY+2.2-.06;
        return baseY+middleLevel-middleFloorThickness-.06;
    }
    let motion=null;
    function toggleDoor(player,eyeHeight) {
        if(player.y-eyeHeight<baseY+level-.25)return false;
        const next=!door.userData.isOpen,p=local(player.x,player.z);
        if(doorOverlap(p,next?Math.PI/2:0,.34))return false;
        door.userData.isOpen=next;motion={from:pivot.rotation.y,to:next?Math.PI/2:0,time:0};return true;
    }
    function update(deltaTime,player,eyeHeight) {
        if(!motion)return;
        const time=Math.min(.7,motion.time+deltaTime),t=time/.7,angle=motion.from+(motion.to-motion.from)*t*t*(3-2*t);
        if(player.y-eyeHeight>=baseY+level-.25&&doorOverlap(local(player.x,player.z),angle))return;
        pivot.rotation.y=angle;motion.time=time;group.updateMatrixWorld(true);if(time===.7)motion=null;
    }
    return {group,interior,interiorLights,door,pivot,supportHeight,blocksMovement,upperLimit,toggleDoor,update,contains,
        closeDoor(){motion=null;door.userData.isOpen=false;pivot.rotation.y=0;group.updateMatrixWorld(true);},
        baseY,levelY:baseY+level,middleLevelY:baseY+middleLevel,
        stair:{x:origin.x+stairPlacement.x,z:origin.z+stairPlacement.z,radius:1.3,steps:stepsPerTurn,rise,turns:1,
            startAngle:stairStart+stairPlacement.rotation,direction:stairDirection,baseY:baseY+middleLevel},
        straightStair:{...straight,start:origin.x+straight.start,end:origin.x+straight.end,z:origin.z+straight.z},origin};
}
