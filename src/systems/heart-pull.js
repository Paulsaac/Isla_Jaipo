// Forcejeo local: transformaciones reutilizadas y una sola malla de partículas.
export function createHeartPull(THREE, {scene, camera, input, isWall, groundHeight, showMessage, hideMessage, clearInput, release}) {
    let phase='idle', vine, elapsed=0, extension=0, lateral=0, recoil=0, particleTime=0;
    const origin=new THREE.Vector3(), away=new THREE.Vector3(), side=new THREE.Vector3();
    const axis=new THREE.Vector3(), tilt=new THREE.Quaternion(), base=new THREE.Quaternion();
    const look=new THREE.Euler(0,0,0,'YXZ'), anchor=new THREE.Euler(0,0,0,'YXZ');
    const dummy=new THREE.Object3D(), burstOrigin=new THREE.Vector3();
    const count=24, positions=new Float32Array(count*3), speeds=new Float32Array(count*3);
    const particles=new THREE.InstancedMesh(new THREE.BoxGeometry(.065,.16,.055),new THREE.MeshBasicMaterial({color:0xa8895c}),count);
    particles.visible=false; particles.frustumCulled=false; scene.add(particles);
    function moveTo(x,z) {
        if (!isWall(x,camera.position.z)) camera.position.x=x;
        if (!isWall(camera.position.x,z)) camera.position.z=z;
        camera.position.y=groundHeight(camera.position.x,camera.position.z);
    }
    function show() { if(phase==='message') showMessage('Está firmemente agarrada...'); }
    function begin(object) {
        if(phase!=='idle') return;
        vine=object; phase='message'; clearInput();
        origin.copy(camera.position); away.subVectors(origin,vine.position).setY(0).normalize();
        side.set(away.z,0,-away.x); base.copy(vine.quaternion);
        anchor.setFromQuaternion(camera.quaternion,'YXZ'); show();
    }
    function interact() {
        if(phase==='message') {phase='pulling'; elapsed=extension=lateral=0; hideMessage();clearInput();}
    }
    function update(dt) {
        if(phase==='message'||phase==='pulling') {
            look.setFromQuaternion(camera.quaternion,'YXZ');
            const yaw=Math.atan2(Math.sin(look.y-anchor.y),Math.cos(look.y-anchor.y));
            look.y=anchor.y+THREE.MathUtils.clamp(yaw,-.32,.32);
            look.x=THREE.MathUtils.clamp(look.x,anchor.x-.2,anchor.x+.2);
            camera.quaternion.setFromEuler(look);
        }
        if(phase==='pulling') {
            const pulling=input.backward&&!input.forward;
            elapsed=pulling?elapsed+dt:0;
            // Gran recorrido inicial; cada incremento exige más tiempo cerca del límite.
            const target=pulling?.55*(1-Math.exp(-elapsed*2)):0;
            extension+=(target-extension)*(1-Math.exp(-dt*12));
            lateral=THREE.MathUtils.clamp(lateral+(Number(input.right)-Number(input.left))*dt*.35,-.4,.4);
            moveTo(origin.x+away.x*extension+side.x*lateral,origin.z+away.z*extension+side.z*lateral);
            axis.set(camera.position.z-vine.position.z,0,-(camera.position.x-vine.position.x)).normalize();
            tilt.setFromAxisAngle(axis,extension*.65);
            vine.quaternion.copy(base).premultiply(tilt);
            if(elapsed>=3) {
                vine.userData.heartMesh.getWorldPosition(burstOrigin);
                vine.quaternion.copy(base);
                phase='done'; recoil=2.5; particleTime=1;
                for(let i=0;i<count;i++) {
                    const a=i*2.399963;
                    positions.set([burstOrigin.x,burstOrigin.y,burstOrigin.z],i*3);
                    speeds.set([Math.cos(a)*(.65+i*.035),.85+(i%4)*.2,Math.sin(a)*(.65+i*.035)],i*3);
                }
                particles.visible=true; clearInput(); release(vine);
            }
        }
        if(recoil>.02) {moveTo(camera.position.x+away.x*recoil*dt,camera.position.z+away.z*recoil*dt);recoil*=Math.exp(-dt*8);}
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
    return {begin,interact,update,show,get active(){return phase==='message'||phase==='pulling';},get phase(){return phase;}};
}
