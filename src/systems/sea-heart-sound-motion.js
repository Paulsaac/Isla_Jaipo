// Fuente musical en el mundo: sale por delante del jugador y viaja al siguiente fragmento.
export function createSeaHeartSoundMotion(THREE, position) {
    const start=new THREE.Vector3(),front=new THREE.Vector3(),destination=new THREE.Vector3();
    const direction=new THREE.Vector3(),controlA=new THREE.Vector3(),controlB=new THREE.Vector3();
    const launchSeconds=.45;
    let elapsed=0,travelSeconds=0,moving=false;
    const smooth=t=>t*t*(3-2*t);
    return {
        snapTo(target) { position.copy(target); moving=false; },
        moveTo(target,camera) {
            start.copy(position);destination.copy(target);
            camera.getWorldDirection(direction);
            direction.y=0;
            if(direction.lengthSq()<.0001)direction.set(0,0,-1);
            direction.normalize();
            camera.getWorldPosition(front);
            front.addScaledVector(direction,2.4);front.y-=.15;
            const distance=front.distanceTo(destination);
            controlA.copy(front).addScaledVector(direction,Math.min(6,distance*.25));
            controlB.copy(front).lerp(destination,.7);
            travelSeconds=Math.min(4.5,Math.max(2.4,distance/12));
            elapsed=0;moving=true;
        },
        update(delta) {
            if(!moving||delta<=0)return;
            elapsed+=delta;
            if(elapsed<launchSeconds) {
                position.lerpVectors(start,front,smooth(elapsed/launchSeconds));
                return;
            }
            const progress=Math.min(1,(elapsed-launchSeconds)/travelSeconds);
            if(progress===1){position.copy(destination);moving=false;return;}
            const t=smooth(progress),s=1-t;
            position.copy(front).multiplyScalar(s*s*s)
                .addScaledVector(controlA,3*s*s*t)
                .addScaledVector(controlB,3*s*t*t)
                .addScaledVector(destination,t*t*t);
        }
    };
}
