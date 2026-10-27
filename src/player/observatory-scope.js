import {createObservatoryZoom} from './observatory-zoom.js';
import {createObservatoryZoomBar} from '../ui/observatory-zoom-bar.js';
// El asiento y la cámara acompañan al ocular en su giro completo alrededor de la montura.
export function createObservatoryScope(THREE,camera,controls,observatory,onMotion=()=>{},onLensChange=()=>{}) {
    const root=controls.getObject(),mask=document.createElement('div');
    mask.id='observatory-scope-view';mask.hidden=true;mask.setAttribute('aria-hidden','true');
    mask.style.cssText='position:fixed;inset:0;z-index:6;pointer-events:none;background:radial-gradient(circle at center,transparent 0 var(--omniscopio-radius,40vmin),rgba(12,18,27,.86) calc(var(--omniscopio-radius,40vmin) + .5vmin),#000 calc(var(--omniscopio-radius,40vmin) + 5vmin));';
    document.body.append(mask);
    const tint=document.createElement('div');tint.style.cssText='position:absolute;inset:0;background:radial-gradient(circle at center,#d62fa4,#8030c8);clip-path:circle(calc(var(--omniscopio-radius,40vmin) + .5vmin) at 50% 50%);opacity:0;';mask.append(tint);
    const shutter=document.createElement('div');shutter.style.cssText='position:absolute;inset:0;background:#000;opacity:0;';mask.append(shutter);
    let blink=0,blinkDuration=.14,stellarTint=0;
    const bar=createObservatoryZoomBar((direction,pressed)=>setZoomInput(direction,pressed),{
        onAim:(direction,pressed)=>setAimInput(direction,pressed),onExit:()=>exit()
    });
    const zoomState=createObservatoryZoom((value,previous)=>{
        bar.setZoom(value);
        if(value===previous)return;
        const activatingStellar=value>=50&&previous<50;
        // Parpadeo entre lentes; la adaptación rosada solo acompaña la entrada estelar.
        if(activatingStellar||value<50) {
            onLensChange(activatingStellar);
            blinkDuration=activatingStellar ? .42 : .14;
            blink=blinkDuration;shutter.style.opacity='1';
        }
        if(activatingStellar){stellarTint=3.2;tint.style.opacity='.66';tint.style.backdropFilter='invert(.65) hue-rotate(260deg) saturate(2.4)';}
        else if(value<50){stellarTint=0;tint.style.opacity='0';tint.style.backdropFilter='none';}
    });
    const saved={position:new THREE.Vector3(),rotation:new THREE.Euler()};
    const input={forward:false,backward:false,left:false,right:false};
    const pitchLimits=observatory.scopePitchLimits;
    const initialPitch=THREE.MathUtils.clamp(-observatory.scopeElevation.rotation.x,pitchLimits.min,pitchLimits.max);
    const state={active:false,seated:false,yaw:0,pitch:initialPitch,yawVelocity:0,pitchVelocity:0,targetYaw:0,targetPitch:initialPitch};
    const normalFov=camera.fov;
    const scopeFov=()=>THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(normalFov/2))/zoomState.value));
    function applyZoom(){const fov=scopeFov();if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}}
    function clearInput(){for(const key of Object.keys(input))input[key]=false;}
    function exit() {
        if(!state.active)return false;
        onMotion(false);
        state.active=false;mask.hidden=true;bar.setVisible(false);clearInput();zoomState.reset();blink=0;shutter.style.opacity='0';
        stellarTint=0;tint.style.opacity='0';tint.style.backdropFilter='none';
        camera.fov=normalFov;camera.updateProjectionMatrix();
        controls.pointerSpeed=saved.pointerSpeed;
        observatory.scopeElevation.visible=saved.tubeVisible;
        observatory.scopeMount.visible=saved.mountVisible;
        // Volver al asiento conservando la dirección final de la vista óptica.
        followSeat();
        state.yawVelocity=state.pitchVelocity=0;
        return true;
    }
    function followSeat(){
        observatory.group.updateMatrixWorld(true);
        observatory.scopeChair.localToWorld(root.position.set(0,.9,.12));
    }
    function sit(){
        if(state.seated)return;
        observatory.chairLanding.updateWorldMatrix(true,false);
        saved.position.copy(root.position);observatory.chairLanding.worldToLocal(saved.position);saved.rotation.copy(root.rotation);
        state.seated=true;followSeat();
        root.rotation.set(-observatory.scopeElevation.rotation.x,Math.PI+observatory.scopeMount.rotation.y,0,'YXZ');
        clearInput();
    }
    function stand(){
        if(!state.seated)return false;
        exit();state.seated=false;
        observatory.chairLanding.updateWorldMatrix(true,false);
        root.position.copy(saved.position);observatory.chairLanding.localToWorld(root.position);root.rotation.copy(saved.rotation);
        clearInput();return true;
    }
    function enter() {
        if(state.active||!state.seated)return;
        saved.pointerSpeed=controls.pointerSpeed;saved.mountYaw=observatory.scopeMount.rotation.y;
        saved.mountPitch=observatory.scopeElevation.rotation.x;
        saved.tubeVisible=observatory.scopeElevation.visible;
        saved.mountVisible=observatory.scopeMount.visible;
        // La vista óptica muestra el paisaje a través del instrumento, sin
        // dibujar las tapas del tubo y del Astroscopio delante de la cámara.
        observatory.scopeElevation.visible=false;
        observatory.scopeMount.visible=false;
        state.active=true;state.yaw=state.targetYaw=saved.mountYaw;
        state.pitch=state.targetPitch=THREE.MathUtils.clamp(-saved.mountPitch,pitchLimits.min,pitchLimits.max);
        state.yawVelocity=state.pitchVelocity=0;clearInput();
        followEyepiece();
        zoomState.reset();applyZoom();
        controls.pointerSpeed=0;mask.hidden=false;bar.setVisible(true);
    }
    function followEyepiece() {
        observatory.updateScopePose();
        // El rayo óptico sale del objetivo: ni el tubo ni la estructura interior
        // pueden interponerse entre la cámara y el paisaje aumentado.
        observatory.group.updateMatrixWorld(true);
        observatory.scopeElevation.localToWorld(root.position.set(0,0,4.50));
        root.rotation.set(state.pitch,Math.PI+state.yaw,0,'YXZ');
    }
    function update(delta) {
        if(!state.active){if(state.seated)followSeat();return;}
        const dt=Math.min(.05,Math.max(0,delta));
        zoomState.update(dt);applyZoom();
        blink=Math.max(0,blink-dt);shutter.style.opacity=String(blink/blinkDuration);
        stellarTint=Math.max(0,stellarTint-dt);
        // El negativo desaparece primero; queda un tinte saturado que se adapta despacio.
        const negative=THREE.MathUtils.clamp(1-((3.2-stellarTint)-.30)/.60,0,1);
        tint.style.backdropFilter=negative>0
            ?`invert(${negative*.65}) hue-rotate(${negative*260}deg) saturate(${1+negative*1.4})`:'none';
        tint.style.opacity=String(.66*Math.pow(stellarTint/3.2,1.3));
        // Un único motor para todas las direcciones, aunque se solapen o se anulen.
        onMotion(!zoomState.busy&&Object.values(input).some(Boolean));
        if(zoomState.busy){
            state.targetYaw=state.yaw;state.targetPitch=state.pitch;state.yawVelocity=state.pitchVelocity=0;
            return;
        }
        const aimScale=2/zoomState.value;
        state.targetYaw+=(Number(input.left)-Number(input.right))*0.24*aimScale*dt;
        state.targetPitch=THREE.MathUtils.clamp(state.targetPitch+(Number(input.forward)-Number(input.backward))*0.18*aimScale*dt,pitchLimits.min,pitchLimits.max);
        const stiffness=22,damping=5.2;
        state.yawVelocity+=(state.targetYaw-state.yaw)*stiffness*dt;
        state.pitchVelocity+=(state.targetPitch-state.pitch)*stiffness*dt;
        const drag=Math.exp(-damping*dt);state.yawVelocity*=drag;state.pitchVelocity*=drag;
        state.yaw+=state.yawVelocity*dt;state.pitch+=state.pitchVelocity*dt;
        // Detener también la inercia en el tope mecánico, a cualquier aumento.
        if(state.pitch>=pitchLimits.max){state.pitch=pitchLimits.max;state.pitchVelocity=Math.min(0,state.pitchVelocity);}
        if(state.pitch<=pitchLimits.min){state.pitch=pitchLimits.min;state.pitchVelocity=Math.max(0,state.pitchVelocity);}
        observatory.scopeMount.rotation.y=state.yaw;
        observatory.scopeElevation.rotation.x=-state.pitch;
        followEyepiece();
    }
    function setZoomInput(direction,pressed){
        if(!state.active)return;
        if(pressed){
            if(Object.values(input).some(Boolean))return;
            onMotion(false,true);
            zoomState.press(direction);state.targetYaw=state.yaw;state.targetPitch=state.pitch;state.yawVelocity=state.pitchVelocity=0;applyZoom();
        }
        else zoomState.release(direction);
    }
    function setAimInput(direction,pressed){
        if(!(direction in input)||!state.active)return;
        if(pressed&&zoomState.busy)return;
        input[direction]=pressed;
    }
    return {sit,stand,enter,exit,update,input,setZoomInput,setAimInput,get seated(){return state.seated;},get active(){return state.active;},
        get zoom(){return zoomState.value;},get astronomical(){return state.active&&zoomState.value>=50;},
        get zooming(){return state.active&&zoomState.busy;},
        adjustZoom(direction){if(state.active&&!Object.values(input).some(Boolean)){onMotion(false,true);zoomState.step(direction);applyZoom();}}};
}
