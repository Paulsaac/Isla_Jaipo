import {TELESCOPE_ZOOM} from './telescope-view.js';
// El asiento y la cámara acompañan al ocular en su giro completo alrededor de la montura.
export function createObservatoryScope(THREE,camera,controls,observatory) {
    const root=controls.getObject(),mask=document.createElement('div');
    mask.id='observatory-scope-view';mask.hidden=true;mask.setAttribute('aria-hidden','true');
    mask.style.cssText='position:fixed;inset:0;z-index:6;pointer-events:none;background:radial-gradient(circle at center,transparent 0 38vmin,rgba(12,18,27,.86) 38.5vmin,#000 43vmin);';
    document.body.append(mask);
    const saved={position:new THREE.Vector3(),rotation:new THREE.Euler()};
    const input={forward:false,backward:false,left:false,right:false};
    const initialPitch=-observatory.scopeElevation.rotation.x;
    const state={active:false,yaw:0,pitch:initialPitch,yawVelocity:0,pitchVelocity:0,targetYaw:0,targetPitch:initialPitch};
    const normalFov=camera.fov;
    let zoom=TELESCOPE_ZOOM.mounted;
    const scopeFov=()=>THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(normalFov/2))/zoom));
    function applyZoom(){const fov=scopeFov();if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}}
    function clearInput(){for(const key of Object.keys(input))input[key]=false;}
    function exit() {
        if(!state.active)return false;
        state.active=false;mask.hidden=true;clearInput();
        camera.fov=normalFov;camera.updateProjectionMatrix();
        controls.pointerSpeed=saved.pointerSpeed;
        observatory.scopeElevation.visible=saved.tubeVisible;
        observatory.scopeMount.visible=saved.mountVisible;
        root.position.copy(saved.position);root.rotation.copy(saved.rotation);
        state.yawVelocity=state.pitchVelocity=0;
        return true;
    }
    function enter() {
        if(state.active)return;
        saved.position.copy(root.position);saved.rotation.copy(root.rotation);
        saved.pointerSpeed=controls.pointerSpeed;saved.mountYaw=observatory.scopeMount.rotation.y;
        saved.mountPitch=observatory.scopeElevation.rotation.x;
        saved.tubeVisible=observatory.scopeElevation.visible;
        saved.mountVisible=observatory.scopeMount.visible;
        // La vista óptica muestra el paisaje a través del instrumento, sin
        // dibujar las tapas del tubo y del Astroscopio delante de la cámara.
        observatory.scopeElevation.visible=false;
        observatory.scopeMount.visible=false;
        state.active=true;state.yaw=state.targetYaw=saved.mountYaw;
        state.pitch=state.targetPitch=-saved.mountPitch;
        state.yawVelocity=state.pitchVelocity=0;clearInput();
        followEyepiece();
        zoom=TELESCOPE_ZOOM.mounted;applyZoom();
        controls.pointerSpeed=0;mask.hidden=false;
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
        if(!state.active)return;
        applyZoom();
        const dt=Math.min(.05,Math.max(0,delta));
        state.targetYaw+=(Number(input.left)-Number(input.right))*0.24*dt;
        state.targetPitch=THREE.MathUtils.clamp(state.targetPitch+(Number(input.forward)-Number(input.backward))*0.18*dt,-.22,1.08);
        const stiffness=22,damping=5.2;
        state.yawVelocity+=(state.targetYaw-state.yaw)*stiffness*dt;
        state.pitchVelocity+=(state.targetPitch-state.pitch)*stiffness*dt;
        const drag=Math.exp(-damping*dt);state.yawVelocity*=drag;state.pitchVelocity*=drag;
        state.yaw+=state.yawVelocity*dt;state.pitch+=state.pitchVelocity*dt;
        observatory.scopeMount.rotation.y=state.yaw;
        observatory.scopeElevation.rotation.x=-state.pitch;
        followEyepiece();
    }
    return {enter,exit,update,input,get active(){return state.active;},get zoom(){return zoom;},
        adjustZoom(direction){if(!state.active)return;zoom=THREE.MathUtils.clamp(zoom+direction,TELESCOPE_ZOOM.mounted,TELESCOPE_ZOOM.mountedMax);applyZoom();}};
}
