// Recorrido sujeto a la escalerilla móvil; la mirada sigue siendo libre.
export function createObservatoryLadder(THREE,camera,controls,observatory,eyeHeight) {
    const root=controls.getObject(),foot=new THREE.Vector3(),top=new THREE.Vector3();
    const forward=new THREE.Vector3(),approach=new THREE.Vector3(),center=new THREE.Vector3(),side=new THREE.Vector3();
    const landing=new THREE.Vector3(),probe=new THREE.Vector3();
    let active=false,distance=0,climbLength=0,landingLength=0,inputSign=1;
    let releasedAtTop=false,previousLandingZ=0;
    function endpoints() {
        observatory.group.updateMatrixWorld(true);
        const rail=observatory.chairLadder.children[0];
        foot.set(0,-.5,0);top.set(0,.5,0);rail.localToWorld(foot);rail.localToWorld(top);
        center.set(0,0,0);observatory.chairLadder.localToWorld(center);
        side.set(0,0,rail.userData.side);observatory.chairLadder.localToWorld(side);side.sub(center);
        foot.sub(side);top.sub(side);
        approach.subVectors(top,foot);approach.y=0;
        if(approach.lengthSq()<1e-8)approach.fromArray(observatory.chairLadder.userData.approach??[1,0,0])
            .transformDirection(observatory.chairLadder.matrixWorld);
        approach.normalize();
        // Subir frente a los peldaños, con espacio para el cuerpo y la cámara.
        foot.addScaledVector(approach,-.50);top.addScaledVector(approach,-.50);
        const bounds=observatory.chairLanding.userData.bounds;
        top.y+=bounds.top;
        landing.set((bounds.minX+bounds.maxX)/2,bounds.top,(bounds.minZ+bounds.maxZ)/2);
        observatory.chairLanding.localToWorld(landing);
        climbLength=foot.distanceTo(top);landingLength=top.distanceTo(landing);
    }
    function onLanding() {
        observatory.chairLanding.updateWorldMatrix(true,false);
        probe.copy(root.position);probe.y-=eyeHeight;
        observatory.chairLanding.worldToLocal(probe);
        const b=observatory.chairLanding.userData.bounds;
        return Math.abs(probe.y-b.top)<.18&&probe.x>=b.minX&&probe.x<=b.maxX
            &&probe.z>=b.minZ&&probe.z<=b.maxZ;
    }
    function update(delta,input,canAttach=true) {
        endpoints();
        const axis=Number(input.forward)-Number(input.backward);
        if(!active) {
            if(!canAttach)return false;
            const onDeck=onLanding(),bounds=observatory.chairLanding.userData.bounds;
            if(releasedAtTop) {
                // No enganchar otra vez al salir: esperar a alejarse o regresar al borde.
                if(!onDeck||probe.z<bounds.maxZ-.08||probe.z>previousLandingZ+.001)releasedAtTop=false;
                previousLandingZ=probe.z;
                if(releasedAtTop)return false;
            }
            camera.getWorldDirection(forward);forward.y=0;forward.normalize();
            const dx=root.position.x-foot.x,dz=root.position.z-foot.z;
            // Volver al borde engancha automáticamente, independientemente de la tecla.
            // La franja queda fuera del punto de salida para poder caminar libremente.
            const atEntrance=onDeck&&probe.z>=bounds.maxZ-.08
                &&Math.abs(probe.x-(bounds.minX+bounds.maxX)/2)<=.25;
            if(atEntrance) {
                probe.copy(root.position);probe.y-=eyeHeight;probe.sub(top);
                const boarding=THREE.MathUtils.clamp(probe.dot(center.subVectors(landing,top))/(landingLength*landingLength||1),0,1);
                distance=climbLength+boarding*landingLength;
                // La dirección con la que se llega continúa hacia abajo al engancharse.
                inputSign=axis!==0?-Math.sign(axis):(forward.dot(approach)>=0?1:-1);
            } else if(axis>0) {
                if(Math.hypot(dx,dz)>.48||Math.abs(root.position.y-eyeHeight-foot.y)>.24
                    ||forward.dot(approach)<.55||dx*approach.x+dz*approach.z>.14)return false;
                distance=0;inputSign=1;
            } else return false;
            active=true;
        }
        // W/↑ solo conserva el descenso mientras se mantiene desde la entrada.
        // Al soltarla se recupera el esquema normal: W/↑ subir, S/↓ bajar.
        if(inputSign<0&&!input.forward)inputSign=1;
        const climb=axis*inputSign;
        distance=THREE.MathUtils.clamp(distance+climb*1.05*Math.min(delta,.1),0,climbLength+landingLength);
        if(distance<=climbLength)root.position.lerpVectors(foot,top,distance/climbLength);
        else root.position.lerpVectors(top,landing,(distance-climbLength)/landingLength);
        root.position.y+=eyeHeight;
        if(climb>0&&distance>climbLength&&onLanding()
            &&probe.z<=observatory.chairLanding.userData.bounds.maxZ-.02) {
            active=false;releasedAtTop=true;previousLandingZ=probe.z;
        }
        if(climb<0&&distance===0) {
            root.position.addScaledVector(approach,-.38);active=false;
        }
        return true; // Consume también el cuadro de salida, sin inercia residual.
    }
    return {update,reset(){active=false;distance=0;inputSign=1;releasedAtTop=false;},get active(){return active;},
        get canUseScope(){return !active&&onLanding();},
        get progress(){return distance/(climbLength+landingLength||1);}};
}
