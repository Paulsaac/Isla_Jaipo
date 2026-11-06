// Una trayectoria continua: ascenso simultáneo, velocidad de crucero y llegada suave.
export function createSeaHeartGuideMotion(THREE,position) {
    const start=new THREE.Vector3(),target=new THREE.Vector3(),eyePosition=new THREE.Vector3();
    const liftSeconds=.55,rampSeconds=.16,arrivalSeconds=.25;
    let moving=false,elapsed=0,totalDistance=0,remaining=0;
    return {
        get moving(){return moving;},
        snapTo(destination) {
            position.copy(destination);
            moving=false;
        },
        moveTo(destination,camera) {
            start.copy(position);
            camera.getWorldPosition(eyePosition);
            target.copy(destination);
            totalDistance=remaining=start.distanceTo(target);
            elapsed=0;
            moving=totalDistance>.002;
        },
        update(delta,speed) {
            if(delta<=0||speed<=0||!moving)return;
            const previousElapsed=elapsed;
            elapsed+=delta;
            // Integral del arranque progresivo, independiente de la frecuencia de fotogramas.
            let availableSeconds=delta-rampSeconds*(Math.exp(-previousElapsed/rampSeconds)-Math.exp(-elapsed/rampSeconds));
            const brakingDistance=speed*arrivalSeconds;
            if(remaining>brakingDistance) {
                const cruiseSeconds=Math.min(availableSeconds,(remaining-brakingDistance)/speed);
                remaining-=speed*cruiseSeconds;
                availableSeconds-=cruiseSeconds;
            }
            if(availableSeconds>0)remaining*=Math.exp(-availableSeconds/arrivalSeconds);
            if(remaining<.002) {
                position.copy(target);
                moving=false;
                return;
            }
            const progress=1-remaining/totalDistance;
            position.lerpVectors(start,target,progress);
            const rise=Math.min(1,elapsed/liftSeconds),lift=rise*rise*(3-2*rise);
            const descent=progress*progress*(3-2*progress);
            const raisedY=THREE.MathUtils.lerp(start.y,eyePosition.y,lift);
            position.y=THREE.MathUtils.lerp(raisedY,target.y,descent);
        }
    };
}
