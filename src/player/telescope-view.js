import { createTelescope } from '../world/telescope.js';
import { createOpalLens } from '../world/opal-lens.js';

export const TELESCOPE_ZOOM = { normal:3, repaired:3, boosted:20, mounted:2, mountedMax:200 };
const RETURN_SECONDS = 0.24;

// Acercamiento óptico y objeto en mano. El inventario y los permisos pertenecen al llamador.
export function createTelescopeView(THREE,camera,controls,{onStrainComplete=()=>{}}={}) {
    const object = createTelescope(THREE);
    const map = object.material.map;
    object.material.dispose();
    // La pasada independiente de mano conserva la oclusión entre las piezas del tubo.
    object.material = new THREE.MeshPhongMaterial({map,vertexColors:true,transparent:true,fog:false,depthTest:true,depthWrite:true});
    object.name = 'held-telescope'; object.renderOrder=1000; object.visible=false;
    camera.add(object);
    const mask = document.createElement('div');
    mask.id='telescope-view'; mask.hidden=true;
    mask.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:6;background:radial-gradient(circle at center,transparent 0 40vmin,#172427 40.5vmin,#000 42vmin);';
    mask.setAttribute('aria-hidden','true'); document.body.append(mask);
    const normalFov=camera.fov, normalTangent=Math.tan(THREE.MathUtils.degToRad(normalFov/2));
    let requested=false, blend=0, ownsSpeed=false, pointerSpeed=1;
    let repaired=false, boosted=false;
    let returnTime=-1, returnStartZoom=1;
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
        strainTime=-1; zoom=1; shake=0; boosted=false;
        returnTime=-1; object.visible=false;
        if (camera.fov!==normalFov) {camera.fov=normalFov;camera.updateProjectionMatrix();}
        if (ownsSpeed) controls.pointerSpeed=pointerSpeed;
        ownsSpeed=false;
    }
    function beginReturn() {
        requested=false; boosted=false; strainTime=-1;
        returnTime=0; returnStartZoom=zoom; object.visible=false;
    }
    return {
        object, cancel,
        get zoomed() {return requested;},
        get lookScale() {return 1/zoom;},
        get struggling() {return strainTime>=0;},
        get repaired() {return repaired;},
        get returning() {return returnTime>=0 || strainTime>=0.60;},
        repair() {
            if(repaired)return;
            cancel();repaired=true;
            const lens=createOpalLens(THREE);
            lens.position.z=-0.394;
            lens.material.depthTest=true;lens.material.fog=false;lens.renderOrder=1001;
            lens.name='installed-opal-lens';object.add(lens);
        },
        toggle() {
            if (strainTime>=0 || requested) {beginReturn();return;}
            requested=true; returnTime=-1;
            boosted=false;
            object.visible=false;
            if (requested && !ownsSpeed) {pointerSpeed=controls.pointerSpeed;ownsSpeed=true;}
        },
        attemptZoom() {
            if (strainTime>=0) return;
            object.visible=false; returnTime=-1;
            if(repaired) {
                if(!requested) {requested=true;boosted=false;}
                else if(!boosted) boosted=true;
                else beginReturn();
                if(requested && !ownsSpeed) {pointerSpeed=controls.pointerSpeed;ownsSpeed=true;}
                return;
            }
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
            let returning=false, handRise=1;
            if (returnTime>=0) {
                returning=true;
                returnTime=Math.min(RETURN_SECONDS,returnTime+Math.max(0,delta));
                handRise=smooth(returnTime/RETURN_SECONDS);
                zoom=THREE.MathUtils.lerp(returnStartZoom,1,handRise);
                blend=(zoom-1)/(repaired ? TELESCOPE_ZOOM.repaired-1 : TELESCOPE_ZOOM.normal-1);
                if (returnTime===RETURN_SECONDS) {returnTime=-1;zoom=1;blend=0;}
            } else if (strainTime>=0) {
                strainTime+=Math.max(0,delta);
                shakeTime=strainTime;
                if (strainTime<0.22) {
                    zoom=THREE.MathUtils.lerp(strainStartZoom,3.6,smooth(strainTime/0.22));
                } else if (strainTime<0.60) {
                    const tension=Math.sin((strainTime-0.22)/0.38*Math.PI);
                    zoom=3.6+Math.sin(strainTime*68)*0.035*tension;
                    shake=0.0018*tension;
                } else if (strainTime<1.06) {
                    returning=true;
                    handRise=smooth((strainTime-0.60)/0.46);
                    zoom=THREE.MathUtils.lerp(3.6,1,handRise);
                } else {
                    cancel();
                    onStrainComplete();
                }
                blend=(zoom-1)/2;
            } else {
                const target=requested ? repaired ? boosted ? TELESCOPE_ZOOM.boosted : TELESCOPE_ZOOM.repaired : TELESCOPE_ZOOM.normal : 1;
                zoom+=(target-zoom)*(1-Math.exp(-Math.max(0,delta)*16));
                if (Math.abs(target-zoom)<0.002) zoom=target;
                blend=(zoom-1)/(repaired ? TELESCOPE_ZOOM.repaired-1 : TELESCOPE_ZOOM.normal-1);
            }
            const fov=THREE.MathUtils.radToDeg(2*Math.atan(normalTangent/zoom));
            if (camera.fov!==fov) {camera.fov=fov;camera.updateProjectionMatrix();}
            mask.hidden=!allowed || blend<0.02;
            mask.style.opacity=String(returning ? 1-handRise : Math.min(1,blend));
            if (ownsSpeed) {
                controls.pointerSpeed=pointerSpeed/zoom;
                if (!requested && blend===0) {controls.pointerSpeed=pointerSpeed;ownsSpeed=false;}
            }
            // Mantener el telescopio dentro del encuadre también en pantallas verticales.
            // El objetivo apunta arriba a la derecha y vuelve desde abajo al salir del zoom.
            const distance=0.72;
            const viewHeight=2*distance*normalTangent;
            const viewWidth=viewHeight*camera.aspect;
            const itemScale=Math.min(0.62,viewHeight*0.42/0.7);
            const restingX=Math.max(0,viewWidth*0.5-itemScale*0.36);
            const restingY=-viewHeight*0.23;
            object.visible=allowed && (returning || (!requested && strainTime<0 && blend===0));
            object.scale.setScalar(itemScale);
            object.position.set(restingX,restingY-(returning ? viewHeight*0.72*(1-handRise) : 0),-distance);
            // El objetivo apunta hacia -Z local: elevarlo y después inclinarlo en el plano de la pantalla.
            object.rotation.set(Math.PI/2,0,-0.48,'ZYX');
        }
    };
}
