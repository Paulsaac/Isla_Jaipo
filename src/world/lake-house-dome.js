import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {COLLISION_RADIUS,DOOR_HEIGHT,DOOR_SIDE_MARGIN,PLAYER_HEIGHT,UNIT_SIZE} from '../config.js';
import {lakeHouseLayout} from '../content/lake-house-layout.js';

// Domo habitable de chapa opaca: triangulación y costillas de la cúpula del observatorio.
export function createLakeHouseDome(THREE,baseY) {
    const {origin,radius,rise,skirt,sides}=lakeHouseLayout;
    const group=new THREE.Group();group.name='lake-house-metal-dome';group.position.set(origin.x,baseY,origin.z);
    const steel=new THREE.MeshPhongMaterial({color:0x71839a,specular:0xb9c9db,shininess:65,
        vertexColors:true,flatShading:true,side:THREE.DoubleSide});
    const iron=new THREE.MeshPhongMaterial({color:0x303d49,specular:0x8095aa,shininess:35,flatShading:true});
    const brass=new THREE.MeshPhongMaterial({color:0x9a8157,shininess:30,flatShading:true});
    const baseMetal=new THREE.MeshPhongMaterial({color:0x495661,shininess:24,flatShading:true});
    const batches=new Map(),panels=[],colors=[];
    const halfDoor=UNIT_SIZE/2-DOOR_SIDE_MARGIN;
    const gateAngle=Math.asin(1.10/radius),gateTop=DOOR_HEIGHT+.32;
    const angles=[-Math.PI/sides,-gateAngle,gateAngle];
    for(let i=1;i<=sides;i++)angles.push(-Math.PI/sides+i*Math.PI*2/sides);
    const latitudes=[0,Math.asin((gateTop-skirt)/rise),.72,1.04,1.32,Math.PI/2];
    const rings=[{r:radius,y:0},...latitudes.map(phi=>({r:radius*Math.cos(phi),y:skirt+rise*Math.sin(phi)}))];
    const faces=angles.slice(0,-1).map((a,i)=>({x:Math.cos((a+angles[i+1])/2),z:Math.sin((a+angles[i+1])/2),cos:Math.cos((angles[i+1]-a)/2)}));
    function add(geometry,material) {
        const parts=batches.get(material)??[];
        parts.push(geometry.index?geometry.toNonIndexed():geometry);
        if(geometry.index)geometry.dispose();batches.set(material,parts);
    }
    function box(w,h,d,x,y,z,material=iron) {
        const geometry=new THREE.BoxGeometry(w,h,d);geometry.translate(x,y,z);add(geometry,material);
    }
    function rod(a,b,r,material=iron) {
        const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
        if(direction.length()<.001)return;
        const geometry=new THREE.CylinderGeometry(r,r,direction.length(),5);
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
        geometry.translate(...start.add(end).multiplyScalar(.5).toArray());add(geometry,material);
    }
    const point=(ring,angle)=>[Math.cos(angle)*ring.r,ring.y,Math.sin(angle)*ring.r];
    function triangle(a,b,c,shade) {
        panels.push(...a,...b,...c);for(let i=0;i<3;i++)colors.push(shade,shade,shade);
    }
    for(let row=0;row<rings.length-1;row++)for(let col=0;col<angles.length-1;col++) {
        const a=point(rings[row],angles[col]),b=point(rings[row],angles[col+1]);
        const c=point(rings[row+1],angles[col+1]),d=point(rings[row+1],angles[col]);
        const entrance=col===1&&rings[row].y<gateTop-.001;
        if(!entrance) {
            const shade=.88+((row*7+col*3)%9)*.015;
            triangle(a,b,c,shade);if(rings[row+1].r>.001)triangle(a,c,d,shade+.035);
            rod(a,b,.022);rod(a,d,.025);if(row>0)rod(a,c,.015);
        }
        // Remaches en las uniones; se agrupan con todos los herrajes.
        if(!entrance&&rings[row].r>.1) {
            const rivet=new THREE.IcosahedronGeometry(.045,0);rivet.translate(...a);add(rivet,brass);
        }
    }
    const skin=new THREE.BufferGeometry();skin.setAttribute('position',new THREE.Float32BufferAttribute(panels,3));
    skin.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));skin.computeVertexNormals();
    const shell=new THREE.Mesh(skin,steel);shell.name='lake-dome-triangular-steel-panels';group.add(shell);

    // Zócalo y piso dodecagonales con espesor y caras inferiores.
    const floorShape=new THREE.Shape();
    for(let i=0;i<angles.length-1;i++) {
        const angle=angles[i],x=radius*Math.cos(angle),z=radius*Math.sin(angle);
        if(i)floorShape.lineTo(x,-z);else floorShape.moveTo(x,-z);
    }
    floorShape.closePath();
    const floor=new THREE.ExtrudeGeometry(floorShape,{depth:.34,bevelEnabled:false});
    floor.rotateX(-Math.PI/2);floor.translate(0,-.34,0);add(floor,baseMetal);
    for(let i=0;i<angles.length-1;i++) {
        const a=point(rings[0],angles[i]);
        const b=point(rings[0],angles[i+1]);rod(a,b,.055);
    }
    // Entrada oriental retranqueada: la hoja existente permanece en X366/Z283.
    const doorX=(lakeHouseLayout.door.x-lakeHouseLayout.center.x)*UNIT_SIZE;
    const mouth=radius*Math.cos(gateAngle)+.04,depth=mouth-doorX+.12;
    for(const sign of [-1,1]) {
        box(depth,DOOR_HEIGHT+.12,.24,(mouth+doorX)/2,DOOR_HEIGHT/2,sign*(halfDoor+.12));
        box(.12,DOOR_HEIGHT+.15,.14,mouth,DOOR_HEIGHT/2,sign*(halfDoor+.20),brass);
        // Cerrar el costado del pequeño vestíbulo contra las aristas del domo.
        box(depth,gateTop,.13,(mouth+doorX)/2,gateTop/2,sign*1.08);
        for(let y=.22;y<DOOR_HEIGHT;y+=.4) {
            const rivet=new THREE.IcosahedronGeometry(.047,0);rivet.translate(mouth+.075,y,sign*(halfDoor+.2));add(rivet,brass);
        }
    }
    box(depth,.32,2.28,(mouth+doorX)/2,DOOR_HEIGHT+.16,0);
    box(depth+.1,.06,2.22,(mouth+doorX)/2,.025,0,baseMetal);
    const crown=new THREE.ConeGeometry(.20,.15,12);crown.translate(0,skirt+rise+.04,0);add(crown,iron);

    for(const [material,parts] of batches) {
        const mesh=new THREE.Mesh(mergeGeometries(parts,false),material);
        mesh.name=material===brass?'lake-dome-brass-fasteners':material===iron?'lake-dome-seams-and-entrance':'lake-dome-metal-foundation';
        group.add(mesh);for(const part of parts)part.dispose();
    }
    function local(x,z){return {x:x-origin.x,z:z-origin.z};}
    function radialNeed(p) {
        let need=0;
        for(const face of faces)need=Math.max(need,(p.x*face.x+p.z*face.z)/face.cos);
        return need;
    }
    function ceiling(p) {
        const need=radialNeed(p);if(need>radius)return null;
        for(let row=1;row<rings.length-1;row++) {
            const a=rings[row],b=rings[row+1];
            if(need>=b.r) return baseY+a.y+(b.y-a.y)*(a.r-need)/(a.r-b.r);
        }
        return baseY+skirt+rise;
    }
    function radiusAt(y) {
        if(y<=skirt)return radius;
        for(let row=1;row<rings.length-1;row++) {
            const a=rings[row],b=rings[row+1];
            if(y<=b.y)return a.r+(b.r-a.r)*(y-a.y)/(b.y-a.y);
        }
        return 0;
    }
    const inEntrance=p=>p.x>=doorX-.65&&p.x<=mouth+.4&&Math.abs(p.z)<halfDoor-COLLISION_RADIUS;
    const torchRay=new THREE.Raycaster(),torchDirection=new THREE.Vector3();
    return {
        group,baseY,
        floorHeight(x,z) {
            const p=local(x,z);
            if(Math.abs(p.x)>radius+.5||Math.abs(p.z)>radius+.5)return null;
            return radialNeed(p)<=radius||inEntrance(p)?baseY:null;
        },
        blocksMovement(x,z,feetY,eyeHeight=PLAYER_HEIGHT) {
            const p=local(x,z),height=feetY-baseY;
            if(Math.abs(p.x)>radius+1||Math.abs(p.z)>radius+1||height>skirt+rise+.15||height<-.6)return false;
            if(inEntrance(p)&&height<DOOR_HEIGHT-eyeHeight+.05)return false;
            const need=radialNeed(p),inner=radiusAt(Math.max(0,height+eyeHeight-.1))-.12;
            return need>inner-COLLISION_RADIUS&&need<radiusAt(Math.max(0,height))+.15+COLLISION_RADIUS;
        },
        upperLimit(x,z,feetY) {
            const p=local(x,z);
            if(Math.abs(p.x)>radius||Math.abs(p.z)>radius)return null;
            const top=ceiling(p);
            if(top==null||feetY>top-.05)return null;
            if(p.x>=doorX-.65&&Math.abs(p.z)<=1.1)return baseY+DOOR_HEIGHT-.05;
            return top-.12;
        },
        torchMount(x,z,exterior=false) {
            if(!exterior) {
                if(x!==lakeHouseLayout.center.x||Math.abs(z-lakeHouseLayout.center.z)!==2)return null;
                return {x:origin.x,z:origin.z+Math.sign(z-lakeHouseLayout.center.z)*6.15,y:baseY+1.65};
            }
            const {bounds}=lakeHouseLayout;
            if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return null;
            torchDirection.set((x-lakeHouseLayout.center.x)*UNIT_SIZE,0,(z-lakeHouseLayout.center.z)*UNIT_SIZE);
            if(torchDirection.lengthSq()<.001)return null;
            torchDirection.normalize();
            const y=baseY+1.65;
            // El centro del mango queda contra el panel real, incluido su ángulo y pendiente.
            shell.updateWorldMatrix(true,false);
            torchRay.set(new THREE.Vector3(origin.x,y-.25,origin.z),torchDirection);
            const hit=torchRay.intersectObject(shell,false)[0];
            if(!hit)return null;
            const margin=.035;
            return {x:hit.point.x+torchDirection.x*margin,z:hit.point.z+torchDirection.z*margin,y};
        }
    };
}
