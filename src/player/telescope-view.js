import { createTelescope } from '../world/telescope.js';

// Acercamiento óptico y objeto en mano. El inventario y los permisos pertenecen al llamador.
export function createTelescopeView(THREE,camera,controls,{onStrainComplete=()=>{}}={}) {
    const object = createTelescope(THREE);
    const map = object.material.map;
    object.material.dispose();
    object.material = new THREE.MeshBasicMaterial({map,vertexColors:true,fog:false,depthTest:false,depthWrite:false});
    object.name = 'held-telescope'; object.renderOrder=1000; object.visible=false;
    camera.add(object);
    const mask = document.createElement('div');
    mask.id='telescope-view'; mask.hidden=true;
    mask.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:6;background:radial-gradient(circle at center,transparent 0 40vmin,#172427 40.5vmin,#000 42vmin);';
    mask.setAttribute('aria-hidden','true'); document.body.append(mask);
    const normalFov=camera.fov, normalTangent=Math.tan(THREE.MathUtils.degToRad(normalFov/2));
    let requested=false, blend=0, ownsSpeed=false, pointerSpeed=1;
    let strainTime=-1, strainStartZoom=3, zoom=1, shake=0, shakeTime=0, shakeApplied=false;
    const savedRotation=new THREE.Quaternion();
    const shakeRotation=new THREE.Quaternion(), shakeEuler=new THREE.Euler();
    const smooth=value=>value*value*(3-2*value);
    function restoreShake() {
        if (!shakeApplied) return;
        camera.quaternion.copy(savedRotation); shakeApplied=false;
    }
    function cancel() {
        restoreShake();
        requested=false; blend=0; mask.hidden=true;
        strainTime=-1; zoom=1; shake=0;
        if (camera.fov!==normalFov) {camera.fov=normalFov;camera.updateProjectionMatrix();}
        if (ownsSpeed) controls.pointerSpeed=pointerSpeed;
        ownsSpeed=false;
    }
    return {
        object, cancel,
        get zoomed() {return requested;},
        get lookScale() {return 1/zoom;},
        get struggling() {return strainTime>=0;},
        toggle() {
            if (strainTime>=0) {cancel();return;}
            requested=!requested;
            if (requested && !ownsSpeed) {pointerSpeed=controls.pointerSpeed;ownsSpeed=true;}
        },
        attemptZoom() {
            if (strainTime>=0) return;
            if (!requested) {
                requested=true;
                if (!ownsSpeed) {pointerSpeed=controls.pointerSpeed;ownsSpeed=true;}
                return;
            }
            strainTime=0; strainStartZoom=zoom;
        },
        applyShake() {
            if (shake<=0 || shakeApplied) return;
            savedRotation.copy(camera.quaternion);
            shakeEuler.set(Math.sin(shakeTime*79)*shake*0.55,
                Math.sin(shakeTime*61)*shake,Math.sin(shakeTime*93)*shake*0.65);
            camera.quaternion.multiply(shakeRotation.setFromEuler(shakeEuler));
            shakeApplied=true;
        },
        restoreShake,
        update(delta,allowed) {
            if (!allowed) cancel();
            shake=0;
            if (strainTime>=0) {
                strainTime+=Math.max(0,delta);
                shakeTime=strainTime;
                if (strainTime<0.22) {
                    zoom=THREE.MathUtils.lerp(strainStartZoom,3.6,smooth(strainTime/0.22));
                } else if (strainTime<0.60) {
                    const tension=Math.sin((strainTime-0.22)/0.38*Math.PI);
                    zoom=3.6+Math.sin(strainTime*68)*0.035*tension;
                    shake=0.0018*tension;
                } else if (strainTime<1.06) {
                    zoom=THREE.MathUtils.lerp(3.6,1,smooth((strainTime-0.60)/0.46));
                } else {
                    cancel();
                    onStrainComplete();
                }
                blend=(zoom-1)/2;
            } else {
                const target=requested ? 1 : 0;
                blend+=(target-blend)*(1-Math.exp(-Math.max(0,delta)*16));
                if (Math.abs(target-blend)<0.001) blend=target;
                zoom=1+blend*2;
            }
            const fov=THREE.MathUtils.radToDeg(2*Math.atan(normalTangent/zoom));
            if (camera.fov!==fov) {camera.fov=fov;camera.updateProjectionMatrix();}
            mask.hidden=!allowed || blend<0.02;
            mask.style.opacity=String(Math.min(1,blend));
            if (ownsSpeed) {
                controls.pointerSpeed=pointerSpeed/zoom;
                if (!requested && blend===0) {controls.pointerSpeed=pointerSpeed;ownsSpeed=false;}
            }
            object.visible=allowed && blend<0.1;
            const radius=Math.min(1,camera.aspect)*normalTangent*0.55;
            object.scale.setScalar(Math.min(0.8,radius*1.8));
            object.position.set(radius*0.60,-radius*0.72,-0.58);
            object.rotation.set(-0.28,-0.24,-0.35);
        }
    };
}
