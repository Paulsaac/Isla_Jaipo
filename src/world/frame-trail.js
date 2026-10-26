// Memoria temporal del mundo en color lineal; el HUD y los objetos en mano quedan nítidos.
export function createFrameTrail(THREE,renderer) {
    let history=null,next=null,valid=false,previousTime=null;
    const size=new THREE.Vector2();
    const material=new THREE.ShaderMaterial({
        uniforms:{current:{value:null},history:{value:null},retention:{value:0}},
        depthTest:false,depthWrite:false,toneMapped:false,
        vertexShader:'varying vec2 uvTrail;void main(){uvTrail=uv;gl_Position=vec4(position.xy,0.,1.);}',
        fragmentShader:`uniform sampler2D current;uniform sampler2D history;uniform float retention;
            varying vec2 uvTrail;
            void main(){vec4 now=texture2D(current,uvTrail);
                gl_FragColor=vec4(mix(now.rgb,texture2D(history,uvTrail).rgb,retention),now.a);}`
    });
    const scene=new THREE.Scene(),camera=new THREE.Camera();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
    function reset() {
        valid=false;previousTime=null;
    }
    function release() {
        reset();
        history?.dispose();next?.dispose();history=next=null;
        material.uniforms.current.value=material.uniforms.history.value=null;
    }
    function ensureTargets() {
        renderer.getDrawingBufferSize(size);
        if(history&&history.width===size.x&&history.height===size.y)return;
        release();
        history=new THREE.WebGLRenderTarget(size.x,size.y,{depthBuffer:false,stencilBuffer:false});
        next=history.clone();
        history.texture.colorSpace=next.texture.colorSpace=THREE.LinearSRGBColorSpace;
    }
    return {
        reset,
        release,
        prepare(){
            ensureTargets();
            const previous=renderer.getRenderTarget();
            let ready;
            try {
                renderer.setRenderTarget(history);renderer.clear();
                material.uniforms.current.value=material.uniforms.history.value=history.texture;
                material.uniforms.retention.value=0;
                renderer.setRenderTarget(next);
                ready=renderer.compileAsync(scene,camera);
            } finally {renderer.setRenderTarget(previous);}
            return ready.then(()=>{
                const target=renderer.getRenderTarget();
                try {renderer.setRenderTarget(next);renderer.render(scene,camera);}
                finally {renderer.setRenderTarget(target);reset();}
            });
        },
        apply(texture,time,strength) {
            if(strength<.001){if(history)reset();return texture;}
            ensureTargets();
            const delta=previousTime===null?1/60:Math.max(1/120,Math.min(.1,time-previousTime));
            material.uniforms.current.value=texture;
            material.uniforms.history.value=valid?history.texture:texture;
            // Feedback tenue: a 30 FPS conserva como máximo ~18% en las marcas actuales.
            // La tercera repetición ya queda por debajo del 1%; mismo decaimiento en otros FPS.
            material.uniforms.retention.value=valid?Math.pow(.22*Math.min(1,strength),delta*30):0;
            const previous=renderer.getRenderTarget();
            try {renderer.setRenderTarget(next);renderer.render(scene,camera);}
            finally {renderer.setRenderTarget(previous);}
            [history,next]=[next,history];valid=true;previousTime=time;
            return history.texture;
        }
    };
}
