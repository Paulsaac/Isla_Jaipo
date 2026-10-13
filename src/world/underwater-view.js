// Una pasada de refracción ligera; fuera del agua se renderiza directamente.
export function createUnderwaterView(THREE, renderer, strength, time) {
    const size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    const target = new THREE.WebGLRenderTarget(size.x,size.y,{depthBuffer:true,stencilBuffer:false});
    target.texture.colorSpace = THREE.LinearSRGBColorSpace;
    const material = new THREE.ShaderMaterial({
        uniforms:{ image:{value:target.texture},immersion:strength,viewTime:time },
        depthTest:false,depthWrite:false,toneMapped:false,
        vertexShader:`varying vec2 vUv;
            void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
        fragmentShader:`uniform sampler2D image;
            uniform float immersion;
            uniform float viewTime;
            varying vec2 vUv;
            void main(){
                vec2 wave=vec2(
                    sin(vUv.y*16.0+viewTime*1.15)+0.35*sin(vUv.y*29.0-viewTime*0.7),
                    sin(vUv.x*13.0-viewTime*0.85)+0.3*cos(vUv.x*24.0+viewTime*0.6));
                vec2 uv=clamp(vUv+wave*vec2(0.0035,0.0025)*immersion,vec2(0.001),vec2(0.999));
                gl_FragColor=texture2D(image,uv);
                #include <colorspace_fragment>
            }`
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
    const camera = new THREE.Camera();
    return {
        resize(){renderer.getDrawingBufferSize(size);target.setSize(size.x,size.y);},
        render(world,view){
            if(strength.value<0.001){renderer.render(world,view);return;}
            const previous=renderer.getRenderTarget();
            renderer.setRenderTarget(target);
            renderer.render(world,view);
            renderer.setRenderTarget(previous);
            renderer.render(scene,camera);
        }
    };
}
