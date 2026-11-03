// La luz direccional comparte la dirección del astro visto desde el jugador.
export function createCelestialLight(THREE,light,observer,sun,moon) {
    const origin=new THREE.Vector3(),direction=new THREE.Vector3();
    return {
        update(useSun=sun.visible){
            observer.getWorldPosition(origin);
            (useSun?sun:moon).getWorldPosition(direction);
            direction.sub(origin).normalize();
            light.target.position.copy(origin);
            light.position.copy(origin).addScaledVector(direction,1000);
            light.target.updateWorldMatrix(true,false);
            light.updateWorldMatrix(true,false);
        }
    };
}
