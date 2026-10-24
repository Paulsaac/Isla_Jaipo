// Recorrido sujeto a la escalerilla móvil; la mirada sigue siendo libre.
export function createObservatoryLadder(THREE,camera,controls,observatory,eyeHeight) {
    const root=controls.getObject(),foot=new THREE.Vector3(),top=new THREE.Vector3();
    const forward=new THREE.Vector3(),approach=new THREE.Vector3(),center=new THREE.Vector3(),side=new THREE.Vector3();
    let active=false,progress=0;
    function endpoints() {
        observatory.group.updateMatrixWorld(true);
        const rail=observatory.chairLadder.children[0];
        foot.set(0,-.5,0);top.set(0,.5,0);rail.localToWorld(foot);rail.localToWorld(top);
        center.set(0,0,0);observatory.chairLadder.localToWorld(center);
        side.set(0,0,rail.userData.side);observatory.chairLadder.localToWorld(side);side.sub(center);
        foot.sub(side);top.sub(side);
        // Los ojos alcanzan el ocular con los pies en los últimos peldaños.
        top.lerp(foot,.85/(top.y-foot.y));
        approach.subVectors(top,foot);approach.y=0;
        if(approach.lengthSq()<1e-8)approach.fromArray(observatory.chairLadder.userData.approach??[1,0,0])
            .transformDirection(observatory.chairLadder.matrixWorld);
        approach.normalize();
    }
    function update(delta,input,canAttach=true) {
        endpoints();
        const climb=Number(input.forward)-Number(input.backward);
        if(!active) {
            if(!canAttach||climb<=0)return false;
            camera.getWorldDirection(forward);forward.y=0;forward.normalize();
            const dx=root.position.x-foot.x,dz=root.position.z-foot.z;
            if(Math.hypot(dx,dz)>.48||Math.abs(root.position.y-eyeHeight-foot.y)>.24
                ||forward.dot(approach)<.55||dx*approach.x+dz*approach.z>.14)return false;
            active=true;progress=0;
        }
        progress=THREE.MathUtils.clamp(progress+climb*1.05*Math.min(delta,.1)/foot.distanceTo(top),0,1);
        root.position.lerpVectors(foot,top,progress);root.position.y+=eyeHeight;
        if(climb<0&&progress===0) {
            root.position.addScaledVector(approach,-.38);active=false;
        }
        return true; // Consume también el cuadro de salida, sin inercia residual.
    }
    return {update,reset(){active=false;progress=0;},get active(){return active;},
        get canUseScope(){return active&&progress>=.8;},get progress(){return progress;}};
}
