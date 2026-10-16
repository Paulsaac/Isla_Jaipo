import { createMateSet } from '../world/mate-set.js';

// Objeto de mano y gesto de beber; no modifica cámara, física ni progreso.
export function createHeldMate(THREE, camera) {
    const set = createMateSet(THREE);
    const object = set.getObjectByName('graham-mate');
    set.remove(object);
    set.traverse(part => part.geometry?.dispose());
    object.material.dispose();
    // Dibujar junto a los objetos de mano, después de terreno y vegetación transparentes.
    object.material = new THREE.MeshBasicMaterial({vertexColors:true,fog:false,transparent:true,opacity:1,depthTest:false,depthWrite:false});
    object.name = 'held-mate'; object.position.set(0,0,0);
    object.renderOrder = 1000; object.visible = false; camera.add(object);
    let held = false, minimum = 0, blend = 0;
    const smooth = value => value * value * (3 - 2 * value);
    function cancel() { held = false; minimum = 0; blend = 0; }
    return {
        object,
        press() { held = true; minimum = 1.5; },
        release() { held = false; },
        cancel,
        get drinking() { return held || minimum > 0; },
        update(delta, visible) {
            object.visible = visible;
            if (!visible) cancel();
            minimum = Math.max(0, minimum - Math.max(0, delta));
            const target = visible && (held || minimum > 0) ? 1 : 0;
            blend += (target - blend) * (1 - Math.exp(-Math.max(0,delta) * (target ? 16 : 11)));
            if (Math.abs(target-blend)<.0001) blend=target;
            const t = smooth(blend);
            const radius = Math.min(1,camera.aspect) * Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) * .55;
            const scale = Math.min(.8, radius * 1.7);
            object.scale.setScalar(scale);
            object.position.set(
                THREE.MathUtils.lerp(radius*.62,-.05*scale,t),
                THREE.MathUtils.lerp(-radius*.90,-.394*scale-.03,t),
                THREE.MathUtils.lerp(-.55,-.27,t));
            object.rotation.set(.18*t,-Math.PI/2*t,-.10*(1-t));
        }
    };
}
