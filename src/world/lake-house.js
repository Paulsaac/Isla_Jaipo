import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {COLLISION_RADIUS,DOOR_HEIGHT,DOOR_SIDE_MARGIN,PLAYER_HEIGHT,UNIT_SIZE,WALL_HEIGHT} from '../config.js';
import {lakeHouseLayout} from '../content/lake-house-layout.js';

export function createLakeHouse(THREE,baseY,{stone,roof,wood}) {
    const {origin,radius,sides,center,door,bounds}=lakeHouseLayout;
    const group=new THREE.Group();
    group.name='lake-round-stone-house';
    group.position.set(origin.x,baseY,origin.z);

    const step=2*Math.PI/sides;
    const apothem=radius*Math.cos(step/2);
    const wallWidth=2*radius*Math.sin(step/2);
    const wallHeight=5.55,wallThickness=.36;
    const doorX=(door.x-center.x)*UNIT_SIZE;
    const halfDoor=UNIT_SIZE/2-DOOR_SIDE_MARGIN;
    const porchEnd=9.25,porchHalf=2.22,postX=porchEnd-.26,postZ=1.91,postSize=.24;
    const porchEave=2.58,porchHigh=3.46;
    const wallFaces=Array.from({length:sides},(_,i)=>[Math.cos(i*step),Math.sin(i*step)]);
    const timber=new THREE.MeshPhongMaterial({map:wood.map,color:0x8a745c,shininess:0});
    const glass=new THREE.MeshPhongMaterial({color:0x34454b,emissive:0x101819,shininess:16});
    const parts=new Map();

    function add(geometry,material) {
        const batch=parts.get(material)??[];
        batch.push(geometry.index?geometry.toNonIndexed():geometry);
        if(geometry.index)geometry.dispose();
        parts.set(material,batch);
    }

    function box(material,w,h,d,x,y,z,angle=0,slopeX=0,slopeZ=0) {
        const geo=new THREE.BoxGeometry(w,h,d);
        if(material===stone) {
            const uv=geo.attributes.uv;
            for(const face of geo.groups) {
                const axis=Math.floor(face.materialIndex/2);
                const uScale=(axis===0?d:w)/UNIT_SIZE;
                const vScale=(axis===1?d:h)/WALL_HEIGHT;
                for(let i=face.materialIndex*4;i<(face.materialIndex+1)*4;i++) {
                    uv.setXY(i,uv.getX(i)*uScale,uv.getY(i)*vScale);
                }
            }
        }
        geo.rotateX(slopeX);
        geo.rotateZ(slopeZ);
        geo.translate(x,y,z);
        geo.rotateY(-angle);
        add(geo,material);
    }

    function ring(material,lower,upper,bottom,top,openEnded=false) {
        const geo=new THREE.CylinderGeometry(upper,lower,top-bottom,sides,1,openEnded,Math.PI/2+step/2);
        geo.translate(0,(bottom+top)/2,0);
        add(geo,material);
    }

    function windowFrame(angle,x,y,width,height) {
        const rail=.085;
        box(glass,.05,height,width,x,y,0,angle);
        for(const side of [-1,1]) {
            box(timber,.14,height+rail,rail,x+.045,y,side*width/2,angle);
            box(timber,.14,rail,width,x+.045,y+side*height/2,0,angle);
        }
        box(timber,.12,height,rail*.65,x+.06,y,0,angle);
        box(timber,.12,rail*.65,width,x+.06,y+.08,0,angle);
        box(timber,.22,.075,width+.23,x+.06,y-height/2-.04,0,angle);
    }

    // Base y cielorraso de madera. El acceso conserva su hoja y su pivote del mapa.
    ring(stone,radius,radius,-.48,-.14);
    ring(wood,radius-.025,radius-.025,-.14,0);
    ring(wood,radius-.08,radius-.08,wallHeight-.23,wallHeight-.08);
    for(let i=0;i<sides;i++) {
        const angle=i*step;
        const x=apothem-wallThickness/2;
        if(i===0) {
            const cheek=(wallWidth-2*halfDoor)/2;
            for(const side of [-1,1]) {
                const left=side*(halfDoor+cheek/2);
                box(stone,wallThickness,DOOR_HEIGHT,cheek,x,DOOR_HEIGHT/2,left);
                const depth=apothem-wallThickness-doorX+.21;
                box(stone,depth,DOOR_HEIGHT,.16,doorX-.21+depth/2,DOOR_HEIGHT/2,side*(halfDoor+.08));
            }
            box(stone,apothem-doorX+.21,wallHeight-DOOR_HEIGHT,wallWidth,
                (apothem+doorX-.21)/2,(wallHeight+DOOR_HEIGHT)/2,0);
            box(timber,.19,.13,2*halfDoor+.25,apothem+.025,DOOR_HEIGHT+.06,0);
        } else {
            box(stone,wallThickness,wallHeight,wallWidth,x,wallHeight/2,0,angle);
        }
        if(i%2===0) windowFrame(angle,apothem+.035,4.22,1.30,1.38);
        if(i===2||i===6||i===10) windowFrame(angle,apothem+.035,1.63,1.07,1.16);
    }

    // El alero ancho y la pendiente cambiante reproducen el perfil del tejado de referencia.
    ring(timber,7.18,7.26,5.40,5.54);
    ring(roof,7.26,5.04,5.54,6.33,true);
    ring(roof,5.04,2.40,6.33,8.19,true);
    ring(roof,2.40,0,8.19,10.28,true);

    for(const angle of [-2*step,2*step]) {
        const front=5.13,back=2.18,base=5.79,top=7.55,half=.86,gableRise=.66;
        const depth=front-back,mid=(front+back)/2;
        box(timber,.17,top-base,2*half,front,(base+top)/2,0,angle);
        for(const side of [-1,1]) {
            box(timber,depth,top-base,.14,mid,(base+top)/2,side*(half-.07),angle);
            box(roof,depth+.42,.14,Math.hypot(half+.20,gableRise),mid,
                top+gableRise/2,side*(half+.20)/2,angle,side*Math.atan2(gableRise,half+.20));
        }
        const gable=new THREE.Shape();
        gable.moveTo(-half,0); gable.lineTo(half,0); gable.lineTo(0,gableRise-.045); gable.closePath();
        const geo=new THREE.ShapeGeometry(gable);
        geo.rotateY(Math.PI/2);
        geo.translate(front+.084,top-.012,0);
        geo.rotateY(-angle);
        add(geo,timber);
        windowFrame(angle,front+.11,6.79,1.03,1.13);
    }

    const porchStart=apothem-.19,porchDepth=porchEnd-porchStart;
    const porchMid=(porchEnd+porchStart)/2;
    box(wood,porchDepth,.28,2*porchHalf,porchMid,-.125,0);
    for(const side of [-1,1]) {
        box(timber,postSize,porchEave,postSize,postX,porchEave/2,side*postZ);
        box(stone,.40,.24,.40,postX,.12,side*postZ);
    }
    box(timber,.26,.21,2*porchHalf,postX,porchEave-.08,0);
    const lean=Math.atan2(porchEave-porchHigh,porchDepth);
    box(roof,Math.hypot(porchDepth,porchHigh-porchEave)+.38,.16,2*porchHalf+.32,
        porchMid,(porchHigh+porchEave)/2,0,0,0,lean);

    for(const [material,batch] of parts) {
        group.add(new THREE.Mesh(mergeGeometries(batch,false),material));
        for(const geo of batch)geo.dispose();
    }

    function wallDistance(x,z) {
        let distance=0;
        for(const [nx,nz] of wallFaces)distance=Math.max(distance,x*nx+z*nz);
        return distance;
    }

    const inPorch=(x,z)=>x>=porchStart&&x<=porchEnd&&Math.abs(z)<=porchHalf;
    return {
        group,baseY,
        floorHeight(x,z) {
            x-=origin.x;z-=origin.z;
            if(inPorch(x,z))return baseY+.015;
            if(Math.abs(x)>radius||Math.abs(z)>radius)return null;
            return wallDistance(x,z)<=apothem?baseY:null;
        },
        blocksMovement(x,z,feetY,eyeHeight=PLAYER_HEIGHT) {
            x-=origin.x;z-=origin.z;
            const height=feetY-baseY;
            if(x>porchEnd+.5||x< -radius-.5||Math.abs(z)>radius+.5||height>wallHeight||height<-.6)return false;
            if(height<porchEave&&Math.abs(x-postX)<.20+COLLISION_RADIUS
                &&Math.abs(Math.abs(z)-postZ)<.20+COLLISION_RADIUS)return true;
            if(x>=doorX-.52&&Math.abs(z)<halfDoor-COLLISION_RADIUS&&height+eyeHeight<DOOR_HEIGHT+.05)return false;
            const distance=wallDistance(x,z);
            return distance>apothem-wallThickness-COLLISION_RADIUS&&distance<apothem+COLLISION_RADIUS;
        },
        upperLimit(x,z,feetY) {
            x-=origin.x;z-=origin.z;
            let limit;
            if(x>=doorX-.21&&x<=apothem&&Math.abs(z)<halfDoor)limit=DOOR_HEIGHT-.05;
            else if(inPorch(x,z))limit=porchHigh+(x-porchStart)*Math.tan(lean)-.10;
            else if(Math.abs(x)<=radius&&Math.abs(z)<=radius&&wallDistance(x,z)<=apothem)limit=wallHeight-.23;
            return limit!=null&&feetY<baseY+limit-.05?baseY+limit:null;
        },
        torchMount(x,z,exterior=false) {
            const y=baseY+1.65;
            if(!exterior) {
                if(x!==center.x||Math.abs(z-center.z)!==2)return null;
                return {x:origin.x,z:origin.z+Math.sign(z-center.z)*(apothem-wallThickness-.10),y};
            }
            if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return null;
            return {x:origin.x+apothem+.035,z:origin.z+Math.sign(z-center.z)*1.39,y};
        }
    };
}
