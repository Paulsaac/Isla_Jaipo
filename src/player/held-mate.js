import { createMateSet } from '../world/mate-set.js';

// Objeto de mano y gesto de beber; no modifica cámara, física ni progreso.
export function createHeldMate(THREE, camera) {
    const set = createMateSet(THREE);
    const object = set.getObjectByName('graham-mate');
    set.remove(object);
    set.traverse(part => part.geometry?.dispose());
    object.material.dispose();
    // La pasada de mano conserva profundidad entre las piezas de este modelo.
    // Igual que el modelo de la mesa: mismos colores y facetas planas.
    object.material = new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:18,fog:false,transparent:true,opacity:1,depthTest:true,depthWrite:true});
    // Proyectar la silueta a la profundidad del objeto: evita el ensanchamiento
    // de perspectiva en la esquina de la pantalla sin deformar su geometría.
    object.material.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
            #include <project_vertex>
            vec4 mateCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            vec4 mateCenterClip = projectionMatrix * mateCenter;
            vec2 mateOffset = (mvPosition.xy - mateCenter.xy)
                * vec2(projectionMatrix[0][0], projectionMatrix[1][1]) / -mateCenter.z;
            gl_Position.xy = (mateCenterClip.xy / mateCenterClip.w + mateOffset) * gl_Position.w;
        `);
    };
    object.material.customProgramCacheKey = () => 'held-mate-stable-projection-v1';
    object.name = 'held-mate'; object.position.set(0,0,0);
    object.renderOrder = 1000; object.visible = false; camera.add(object);
    let held = false, minimum = 0, blend = 0,gesture=0;
    const smooth = value => value * value * (3 - 2 * value);
    function cancel() { held = false; minimum = 0; blend = 0; }
    return {
        object,
        press() { if(!held)gesture++;held = true; minimum = 1; },
        release() { held = false; },
        cancel,
        get drinking() { return held || minimum > 0; },
        get holding() { return held; },
        get gesture() { return gesture; },
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
            const halfWidth = Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) * .55 * camera.aspect;
            const restingX = Math.max(0, halfWidth - scale * .24);
            object.scale.setScalar(scale);
            object.position.set(
                THREE.MathUtils.lerp(restingX,-.05*scale,t),
                THREE.MathUtils.lerp(-radius*.90,-.394*scale-.03,t),
                THREE.MathUtils.lerp(-.55,-.27,t));
            // Giro de reposo hacia la izquierda; el gesto conserva su pose final en la boca.
            object.rotation.set(THREE.MathUtils.lerp(.22,.18,t),
                THREE.MathUtils.lerp(THREE.MathUtils.degToRad(-10),-Math.PI/2,t),-.10*(1-t));
        }
    };
}
