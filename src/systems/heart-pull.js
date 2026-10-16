// Forcejeo local: transformaciones reutilizadas y una sola malla de partículas.
export function createHeartPull(THREE, {scene, camera, input, isWall, groundHeight, showMessage, hideMessage, clearInput, release}) {
    const recoilPushSeconds=.26, recoilBrakeSeconds=.09, recoilBounceSeconds=.09;
    const recoilSeconds=recoilPushSeconds+recoilBounceSeconds, recoilDistance=.65, recoilBounceDistance=.03;
    const settleSeconds=.2;
    const lookRadius=.3;
    let phase='idle', vine, elapsed=0, extension=0, lateral=0, recoilTime=0, settleTime=0, particleTime=0, lookX=0, lookY=0;
    const origin=new THREE.Vector3(), away=new THREE.Vector3(), side=new THREE.Vector3();
    const axis=new THREE.Vector3(), tilt=new THREE.Quaternion(), base=new THREE.Quaternion();
    const look=new THREE.Euler(0,0,0,'YXZ');
    const lookAnchor=new THREE.Quaternion(), lookAnchorInverse=new THREE.Quaternion();
    const lookDirection=new THREE.Vector3();
    const unshakenView=new THREE.Quaternion(), shakeRotation=new THREE.Quaternion();
    const shakeAngles=new THREE.Euler(0,0,0,'YXZ');
    let glowStrength=0, shaken=false;
    const dummy=new THREE.Object3D(), burstOrigin=new THREE.Vector3();
    const count=24, positions=new Float32Array(count*3), speeds=new Float32Array(count*3);
    const particles=new THREE.InstancedMesh(new THREE.BoxGeometry(.065,.16,.055),new THREE.MeshBasicMaterial({color:0xa8895c}),count);
    particles.visible=false; particles.frustumCulled=false; scene.add(particles);
    function moveTo(x,z) {
        if (!isWall(x,camera.position.z)) camera.position.x=x;
        if (!isWall(camera.position.x,z)) camera.position.z=z;
        camera.position.y=groundHeight(camera.position.x,camera.position.z);
    }
    function recoilTravel(time) {
        if(time<=recoilPushSeconds) {
            const braking=Math.max(0,time-(recoilPushSeconds-recoilBrakeSeconds));
            const speed=(recoilDistance+recoilBounceDistance)/(recoilPushSeconds-recoilBrakeSeconds/2);
            return speed*(time-braking*braking/(2*recoilBrakeSeconds));
        }
        const settle=THREE.MathUtils.smoothstep(time,recoilPushSeconds,recoilSeconds);
        return recoilDistance+recoilBounceDistance*(1-settle);
    }
    function show() { if(phase==='message') showMessage('Esta firmemente agarrado...'); }
    function constrainLook() {
        // Desplazamiento angular respecto al eje inicial: un cono circular real, incluso mirando hacia abajo.
        lookDirection.set(0,0,-1).applyQuaternion(camera.quaternion).applyQuaternion(lookAnchorInverse);
        const tangent=Math.hypot(lookDirection.x,lookDirection.y);
        const angle=Math.atan2(tangent,-lookDirection.z);
        const targetX=tangent>1e-8?lookDirection.x*angle/tangent:(lookDirection.z>0?Math.PI:0);
        const targetY=tangent>1e-8?lookDirection.y*angle/tangent:0;
        const dx=targetX-lookX, dy=targetY-lookY;
        const steps=Math.min(128,Math.max(1,Math.ceil(Math.hypot(dx,dy)/.01)));
        for(let i=0;i<steps;i++) {
            const radius=Math.hypot(lookX,lookY);
            const edge=THREE.MathUtils.clamp((radius/lookRadius-.55)/.45,0,1);
            const weight=1-.85*edge*edge*(3-2*edge);
            let sx=dx/steps*weight, sy=dy/steps*weight;
            if(radius>1e-8) {
                // Volver hacia el centro sigue siendo libre; el peso frena la salida y el giro junto al borde.
                const inward=Math.min(0,(dx*lookX+dy*lookY)/(steps*radius));
                sx+=lookX/radius*inward*(1-weight);
                sy+=lookY/radius*inward*(1-weight);
            }
            lookX+=sx;lookY+=sy;
            const nextRadius=Math.hypot(lookX,lookY);
            if(nextRadius>lookRadius) {lookX*=lookRadius/nextRadius;lookY*=lookRadius/nextRadius;}
        }
        const radius=Math.hypot(lookX,lookY);
        const sine=radius>1e-8?Math.sin(radius)/radius:1;
        lookDirection.set(lookX*sine,lookY*sine,-Math.cos(radius)).applyQuaternion(lookAnchor);
        look.set(Math.asin(THREE.MathUtils.clamp(lookDirection.y,-1,1)),Math.atan2(-lookDirection.x,-lookDirection.z),0,'YXZ');
        camera.quaternion.setFromEuler(look);
    }
    function begin(object) {
        if(phase!=='idle') return;
        vine=object; phase='message'; clearInput();
        origin.copy(camera.position); away.subVectors(origin,vine.position).setY(0).normalize();
        side.set(away.z,0,-away.x); base.copy(vine.quaternion);
        lookAnchor.copy(camera.quaternion);lookAnchorInverse.copy(lookAnchor).invert();lookX=lookY=0;show();
    }
    function interact() {
        if(phase==='message') {phase='pulling'; elapsed=extension=lateral=0; hideMessage();clearInput();}
    }
    function update(dt) {
        // La pausa comienza al terminar el rebote; las direcciones siguen actualizándose.
        if(phase==='settling') {
            settleTime=Math.max(0,settleTime-dt);
            if(settleTime<1e-8) {phase='done';clearInput();}
        }
        if(phase==='message'||phase==='pulling') constrainLook();
        if(phase==='pulling') {
            const pulling=input.backward&&!input.forward;
            elapsed=pulling?elapsed+dt:0;
            const glowTarget=pulling?.25+.75*THREE.MathUtils.smoothstep(elapsed,0,1.5):0;
            glowStrength+=(glowTarget-glowStrength)*(1-Math.exp(-dt*14));
            vine.userData.setPullStrength?.(glowStrength);
            // Gran recorrido inicial; cada incremento exige más tiempo cerca del límite.
            const target=pulling?.55*(1-Math.exp(-elapsed*4)):0;
            extension+=(target-extension)*(1-Math.exp(-dt*12));
            lateral=THREE.MathUtils.clamp(lateral+(Number(input.right)-Number(input.left))*dt*.35,-.4,.4);
            moveTo(origin.x+away.x*extension+side.x*lateral,origin.z+away.z*extension+side.z*lateral);
            // Inclinar desde el anclaje hacia el desplazamiento real, también al tirar de costado.
            axis.set(camera.position.z-origin.z,0,-(camera.position.x-origin.x));
            const bendDistance=axis.length();
            if(bendDistance>1e-8) tilt.setFromAxisAngle(axis.multiplyScalar(1/bendDistance),bendDistance*.65);
            else tilt.identity();
            vine.quaternion.copy(base).premultiply(tilt);
            if(elapsed>=1.5) {
                vine.userData.heartMesh.getWorldPosition(burstOrigin);
                vine.quaternion.copy(base);
                glowStrength=0;
                vine.userData.setPullStrength?.(0);
                phase='recoil'; recoilTime=recoilSeconds; particleTime=1;
                for(let i=0;i<count;i++) {
                    const a=i*2.399963;
                    positions.set([burstOrigin.x,burstOrigin.y,burstOrigin.z],i*3);
                    speeds.set([Math.cos(a)*(.65+i*.035),.85+(i%4)*.2,Math.sin(a)*(.65+i*.035)],i*3);
                }
                particles.visible=true; clearInput(); release(vine);
            }
        }
        if(phase==='recoil') {
            // Tirón firme, frenada corta y una devolución de 3 cm antes de quedar plantado.
            const step=Math.min(dt,recoilTime);
            const elapsedRecoil=recoilSeconds-recoilTime;
            const distance=recoilTravel(elapsedRecoil+step)-recoilTravel(elapsedRecoil);
            moveTo(camera.position.x+away.x*distance,camera.position.z+away.z*distance);
            recoilTime=Math.max(0,recoilTime-step);
            if(recoilTime===0) {phase='settling';settleTime=settleSeconds;clearInput();}
        }
        if(particleTime>0) {
            particleTime-=dt;
            for(let i=0;i<count;i++) {
                const n=i*3; speeds[n+1]-=dt*3;
                for(let j=0;j<3;j++) positions[n+j]+=speeds[n+j]*dt;
                dummy.position.fromArray(positions,n);dummy.rotation.set(i,particleTime*5+i,i*.7);
                dummy.scale.setScalar(Math.min(1,Math.max(0,particleTime*2)));dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);
            }
            particles.instanceMatrix.needsUpdate=true;
            if(particleTime<=0) {particles.visible=false;scene.remove(particles);particles.geometry.dispose();particles.material.dispose();}
        }
    }
    function applyCameraShake() {
        if(shaken || phase!=='pulling') return;
        const strength=THREE.MathUtils.smoothstep(elapsed,1,1.45);
        if(strength===0) return;
        // Solo durante el render: el temblor no entra en los controles ni en el cono de mirada.
        unshakenView.copy(camera.quaternion);
        shakeAngles.set(Math.sin(elapsed*61)*.0018*strength,Math.sin(elapsed*79)*.0013*strength,Math.sin(elapsed*47)*.0008*strength);
        shakeRotation.setFromEuler(shakeAngles);
        camera.quaternion.multiply(shakeRotation);
        shaken=true;
    }
    function restoreCameraShake() {
        if(!shaken) return;
        camera.quaternion.copy(unshakenView);
        camera.updateMatrixWorld(true);
        shaken=false;
    }
    return {begin,interact,update,show,applyCameraShake,restoreCameraShake,get active(){return phase==='message'||phase==='pulling'||phase==='recoil'||phase==='settling';},get phase(){return phase;}};
}
