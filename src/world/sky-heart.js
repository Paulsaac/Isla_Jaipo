import { SKY_HEART_FLIGHT_SECONDS } from '../content/sky-heart.js';
import { createSkyHeartGlow, applySkyHeartEmbers } from './sky-heart-glow.js';

export function createSkyHeartVisual(THREE,scene,texture,{onImpact=()=>null}={}) {
    const pulse={value:0};
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.1,fog:false,toneMapped:false});
    applySkyHeartEmbers(material,pulse);
    const pickup=new THREE.Sprite(material);pickup.name='sky-heart';pickup.visible=false;
    pickup.scale.set(.65*26/35,.65,1);
    pickup.renderOrder=3;
    pickup.userData={type:'SKY_HEART_PICKUP',visibilityEnabled:false};scene.add(pickup);
    const landedGlow=createSkyHeartGlow(THREE);landedGlow.visible=false;landedGlow.renderOrder=2;scene.add(landedGlow);
    const flightMaterial=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.1,fog:false,depthWrite:false,toneMapped:false});
    flightMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\ndiffuseColor.rgb=vec3(1.,.006,.012);');};
    flightMaterial.customProgramCacheKey=()=> 'sky-heart-flight-red-v1';
    const head=new THREE.Sprite(flightMaterial);head.name='sky-heart-asteroid';head.visible=false;head.renderOrder=3;scene.add(head);
    const flightGlow=createSkyHeartGlow(THREE,.9);flightGlow.visible=false;flightGlow.renderOrder=2;scene.add(flightGlow);
    const count=32,sides=12,points=new Float32Array(count*sides*3),colors=new Float32Array(count*sides*4),indices=[];
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
    for(let i=0;i<count;i++)for(let j=0;j<sides;j++){
        const u=i/(count-1),k=(i*sides+j)*4;colors.set([1,.008,.018,u*.72],k);
        if(i<count-1){const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;indices.push(a,b,c,b,d,c);}
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,4));geometry.setIndex(indices);
    const trail=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.85,depthWrite:false,fog:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}));
    trail.name='sky-heart-asteroid-trail';trail.renderOrder=1;trail.frustumCulled=false;trail.visible=false;scene.add(trail);
    const start=new THREE.Vector3(),end=new THREE.Vector3(),point=new THREE.Vector3();
    const ahead=new THREE.Vector3(),behind=new THREE.Vector3(),tangent=new THREE.Vector3(),axisA=new THREE.Vector3(),axisB=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
    const unshaken=new THREE.Quaternion(),unshakenPosition=new THREE.Vector3(),angles=new THREE.Euler(),rotation=new THREE.Quaternion();
    let launched=false,impacted=false,shaken=false;
    function positionAt(target,p){
        target.lerpVectors(start,end,p);
        target.y+=Math.sin(Math.PI*p)*Math.min(28,Math.max(0,start.y-end.y)*.15);
        return target;
    }
    return {pickup,head,trail,landedGlow,flightGlow,pulse,
        launch(origin,destination){
            if(launched)return false;
            start.copy(origin);end.copy(destination);launched=true;
            return true;
        },
        update(state){
            const falling=launched&&state.stage==='falling';
            head.visible=flightGlow.visible=trail.visible=falling;
            pickup.visible=landedGlow.visible=state.stage==='landed';
            pickup.userData.visibilityEnabled=pickup.visible;
            if(!impacted&&(state.stage==='landed'||state.stage==='collected')){
                const ground=onImpact(end);
                if(Number.isFinite(ground)&&ground!==null)end.y=ground+.345;
                impacted=true;
            }
            pulse.value=state.pulse??0;
            if(pickup.visible){
                pickup.position.copy(end);landedGlow.position.copy(end);
                landedGlow.scale.setScalar(.95+.22*pulse.value);
                landedGlow.material.opacity=.2+.3*pulse.value;
            }
            if(!falling)return;
            positionAt(head.position,state.progress);
            // Sale diminuto de la luna; crece algo durante el acercamiento y termina como piedra.
            const size=.28+1.6*Math.sin(Math.PI*state.progress)+.37*state.progress;
            head.scale.set(size*26/35,size,1);
            flightGlow.position.copy(head.position);flightGlow.scale.setScalar(size*2.8);
            for(let i=0;i<count;i++){
                const u=i/(count-1),delay=(1-u)*.28;
                const p=Math.pow(Math.max(0,(state.elapsed-delay)/SKY_HEART_FLIGHT_SECONDS),2.6);
                positionAt(point,p);
                positionAt(ahead,Math.min(1,p+.0001));positionAt(behind,Math.max(0,p-.0001));
                tangent.subVectors(ahead,behind).normalize();axisA.crossVectors(tangent,up);
                if(axisA.lengthSq()<1e-6)axisA.set(1,0,0);else axisA.normalize();
                axisB.crossVectors(tangent,axisA).normalize();
                // Punta fina detrás, bulbo redondeado junto al corazón: gota muy alargada.
                const radius=size*1.1*Math.pow(u,1.7)*Math.sqrt(Math.max(0,1-Math.pow(u,6)));
                for(let j=0;j<sides;j++){
                    const angle=j/sides*Math.PI*2,a=Math.cos(angle)*radius,b=Math.sin(angle)*radius,k=(i*sides+j)*3;
                    points[k]=point.x+axisA.x*a+axisB.x*b;
                    points[k+1]=point.y+axisA.y*a+axisB.y*b;
                    points[k+2]=point.z+axisA.z*a+axisB.z*b;
                }
            }
            geometry.attributes.position.needsUpdate=true;
        },
        applyShake(camera,state,enabled){
            if(shaken||!enabled||!state.shake)return;
            const distance=Math.hypot(camera.position.x-end.x,camera.position.z-end.z);
            const strength=state.shake*(.6+.4*Math.max(0,1-distance/250)),t=state.impactAge;
            unshaken.copy(camera.quaternion);unshakenPosition.copy(camera.position);
            camera.position.x+=Math.sin(t*63)*.045*strength;
            camera.position.y+=Math.sin(t*81)*.065*strength;
            camera.position.z+=Math.sin(t*57)*.025*strength;
            angles.set(Math.sin(t*71)*.014*strength,Math.sin(t*91)*.010*strength,Math.sin(t*53)*.007*strength);
            rotation.setFromEuler(angles);camera.quaternion.multiply(rotation);shaken=true;
        },
        restoreShake(camera){if(shaken){camera.quaternion.copy(unshaken);camera.position.copy(unshakenPosition);camera.updateMatrixWorld(true);shaken=false;}}
    };
}
