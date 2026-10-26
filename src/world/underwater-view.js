import { createKaleidoscopeMotion } from './kaleidoscope-motion.js';
import { createFrameTrail } from './frame-trail.js';

// Refracción y lentes comparten pasada; el Bosque añade memoria temporal solo durante el efecto.
export function createUnderwaterView(THREE, renderer, strength, time, pinkTint = {value:0}, lensColor = {value:new THREE.Vector3(1.0,0.34,0.64)}, negativeView = {value:0}, trailStrength = {value:0}) {
    const size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    const lensScreenScale={value:new THREE.Vector2(size.x/Math.min(size.x,size.y),size.y/Math.min(size.x,size.y))};
    const target = new THREE.WebGLRenderTarget(size.x,size.y,{depthBuffer:true,stencilBuffer:false});
    target.texture.colorSpace = THREE.LinearSRGBColorSpace;
    const motion = createKaleidoscopeMotion(THREE);
    const trail=createFrameTrail(THREE,renderer);
    const material = new THREE.ShaderMaterial({
        uniforms:{ image:{value:target.texture},immersion:strength,viewTime:time,pinkTint,lensColor,negativeView,lensScreenScale,lookLag:{value:motion.offset} },
        depthTest:false,depthWrite:false,toneMapped:false,
        vertexShader:`varying vec2 vUv;
            void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
        fragmentShader:`uniform sampler2D image;
            uniform float immersion;
            uniform float viewTime;
            uniform float pinkTint;
            uniform vec3 lensColor;
            uniform float negativeView;
            uniform vec2 lookLag;
            uniform vec2 lensScreenScale;
            varying vec2 vUv;
            mat2 rotateLens(float angle) {
                return mat2(cos(angle),sin(angle),-sin(angle),cos(angle));
            }
            float octagonalDistance(vec2 point) {
                vec2 p=abs(point);
                return max(max(p.x,p.y),(p.x+p.y)*0.707106781);
            }
            vec4 triangleLayer(vec2 point,vec2 pivot,float scale,float spin,float drift,vec2 eyeCenter,vec2 eyeSpan) {
                // Giro rígido alrededor de una esquina: las facetas siguen siendo triángulos.
                vec2 moving = rotateLens(spin)*(point-pivot)*scale+vec2(drift,0.0);
                vec2 lattice = vec2(moving.x-moving.y*0.577350269,moving.y*1.154700538);
                vec2 cell = floor(lattice), triangle = fract(lattice);
                if (triangle.x+triangle.y > 1.0) triangle = 1.0-triangle;
                vec2 shard = vec2(triangle.x+triangle.y*0.5,triangle.y*0.866025404);
                vec2 shardUv = clamp(eyeCenter+rotateLens(spin)*(shard-vec2(0.5,0.288675135))*0.85*eyeSpan,vec2(0.001),vec2(0.999));
                vec3 reflection = texture2D(image,shardUv).rgb;
                // Conservar el ambiente con un matiz suave del cristal seleccionado.
                vec3 prism = reflection*mix(vec3(1.0),lensColor,0.42);
                float edge = 1.0-smoothstep(0.0,0.025,min(min(triangle.x,triangle.y),1.0-triangle.x-triangle.y));
                prism *= 1.0+edge*0.06;
                // Algunas facetas dejan ver mucho más el paisaje, sin borrar sus bordes.
                float seed = fract(sin(dot(cell+pivot,vec2(127.1,311.7)))*43758.5453);
                float clearFacet = smoothstep(0.67,0.90,seed);
                float opacity = mix(0.56,0.18,clearFacet*(0.85+0.15*sin(viewTime*0.3+seed*6.283185307)));
                opacity = mix(opacity,0.60,edge*0.25);
                return vec4(prism,opacity);
            }
            vec4 sampleView(vec2 point) {
                vec2 wave=vec2(
                    sin(point.y*16.0+viewTime*1.15)+0.35*sin(point.y*29.0-viewTime*0.7),
                    sin(point.x*13.0-viewTime*0.85)+0.3*cos(point.x*24.0+viewTime*0.6));
                vec2 uv=clamp(point+wave*vec2(0.0035,0.0025)*immersion,vec2(0.001),vec2(0.999));
                return texture2D(image,uv);
            }
            void main(){
                gl_FragColor=sampleView(vUv);
                float binocularVisibility = 1.0;
                gl_FragColor.rgb *= mix(vec3(1.0),lensColor,pinkTint);
                if (pinkTint > 0.001) {
                    // Dos octágonos superpuestos, ambos mirando al centro de la misma imagen.
                    // Medidas sobre el lado menor para conservar la proporción al redimensionar.
                    vec2 lensPoint=(vUv-0.5)*lensScreenScale;
                    float baseLensRadius=min(lensScreenScale.x/3.5,lensScreenScale.y*0.49);
                    float lensRadius=baseLensRadius*1.18;
                    vec3 eyeColors=vec3(0.0);
                    float eyeWeights=0.0;
                    binocularVisibility=0.0;
                    for (int eye = 0; eye < 2; eye++) {
                        float eyeSide=eye==0 ? -1.0 : 1.0;
                        vec2 eyeOffset=vec2(eyeSide*baseLensRadius*0.72,0.0);
                        vec2 eyePoint=(lensPoint-eyeOffset)/lensRadius;
                        vec2 eyeCenter=vec2(0.5);
                        vec2 eyeSpan=vec2(lensRadius*2.0)/lensScreenScale;
                        vec2 centeredLens=eyePoint*0.48;
                        float radialDistance=octagonalDistance(eyePoint);
                        float eyeVisibility=1.0-smoothstep(0.94,1.0,radialDistance);
                        binocularVisibility=max(binocularVisibility,eyeVisibility);
                        if (eyeVisibility > 0.001) {
                            // Conservar una sola vista de cámara; solo las facetas repiten sus reflejos.
                            vec3 eyeColor=gl_FragColor.rgb;
                            for (int radialLayer = 0; radialLayer < 2; radialLayer++) {
                                float radialScale = 1.0-0.08*float(radialLayer);
                                vec2 lens = centeredLens/radialScale;
                                float rotationAngle = (radialLayer == 1 ? -viewTime : viewTime)*0.23;
                                vec2 flowing = lens+lookLag*0.75;
                                vec4 topLeft = triangleLayer(flowing,vec2(-0.72,0.32),13.0/3.6,rotationAngle,viewTime*0.013,eyeCenter,eyeSpan);
                                vec4 topRight = triangleLayer(flowing,vec2(0.72,0.32),13.0/3.6,rotationAngle+0.7,viewTime*0.013,eyeCenter,eyeSpan);
                                vec4 bottomLeft = triangleLayer(flowing,vec2(-0.72,-0.32),13.0/3.6,rotationAngle+1.3,viewTime*0.013,eyeCenter,eyeSpan);
                                vec4 bottomRight = triangleLayer(flowing,vec2(0.72,-0.32),13.0/3.6,rotationAngle+2.1,viewTime*0.013,eyeCenter,eyeSpan);
                                float pivotRadius = length(vec2(0.72,0.32));
                                vec4 topCenter = triangleLayer(flowing,vec2(0.0,pivotRadius),13.0/3.6,-rotationAngle+0.35,viewTime*0.013,eyeCenter,eyeSpan);
                                vec4 bottomCenter = triangleLayer(flowing,vec2(0.0,-pivotRadius),13.0/3.6,-rotationAngle+1.7,viewTime*0.013,eyeCenter,eyeSpan);
                                vec4 leftCenter = triangleLayer(flowing,vec2(-pivotRadius,0.0),13.0/3.6,-rotationAngle+1.0,viewTime*0.013,eyeCenter,eyeSpan);
                                vec4 rightCenter = triangleLayer(flowing,vec2(pivotRadius,0.0),13.0/3.6,-rotationAngle+2.5,viewTime*0.013,eyeCenter,eyeSpan);
                                vec2 cornerBlend = smoothstep(vec2(-0.20,-0.10),vec2(0.20,0.10),lens);
                                vec4 top = mix(topLeft,topRight,cornerBlend.x);
                                vec4 bottom = mix(bottomLeft,bottomRight,cornerBlend.x);
                                vec4 mirrors = mix(bottom,top,cornerBlend.y);
                                vec2 direction = lens/max(length(lens),0.001);
                                vec4 axisWeights = pow(max(vec4(direction.y,-direction.y,-direction.x,direction.x),vec4(0.0)),vec4(8.0));
                                vec4 axisMirrors = (topCenter*axisWeights.x+bottomCenter*axisWeights.y
                                    +leftCenter*axisWeights.z+rightCenter*axisWeights.w)/max(dot(axisWeights,vec4(1.0)),0.001);
                                float cornerProximity = dot(abs(direction),normalize(vec2(0.72,0.32)));
                                float axisProximity = max(abs(direction.x),abs(direction.y));
                                mirrors = mix(mirrors,axisMirrors,smoothstep(-0.04,0.08,axisProximity-cornerProximity));
                                float luminance = dot(mirrors.rgb,vec3(0.2126,0.7152,0.0722));
                                mirrors.rgb = clamp(mix(vec3(luminance),mirrors.rgb,2.0),vec3(0.0),vec3(1.0));
                                if (radialLayer == 1) {
                                    float colorMax = max(mirrors.r,max(mirrors.g,mirrors.b));
                                    float colorMin = min(mirrors.r,min(mirrors.g,mirrors.b));
                                    mirrors.rgb = vec3(colorMax+colorMin)-mirrors.rgb;
                                    mirrors.a *= 0.08;
                                }
                                eyeColor = mix(eyeColor,mirrors.rgb,pinkTint*mirrors.a);
                            }
                            float weight=eyeVisibility*max(0.01,1.0-radialDistance);
                            eyeColors+=eyeColor*weight;
                            eyeWeights+=weight;
                        }
                    }
                    if (eyeWeights > 0.0) gl_FragColor.rgb=mix(gl_FragColor.rgb,eyeColors/eyeWeights,binocularVisibility);
                }
                #include <colorspace_fragment>
                // Negativo fotográfico en el color de salida, solo con lentes equipados.
                gl_FragColor.rgb = mix(gl_FragColor.rgb,vec3(1.0)-gl_FragColor.rgb,pinkTint*negativeView);
                gl_FragColor.rgb *= mix(1.0,mix(0.35,1.0,binocularVisibility),pinkTint);
            }`
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
    const camera = new THREE.Camera();
    let preparation = null;
    return {
        prepare(world,view,refresh=false,preparePrograms=null){
            if (preparation && !refresh) return preparation;
            const previous = renderer.getRenderTarget();
            try {
                // Preparar framebuffer y programas con el espacio de color submarino.
                renderer.setRenderTarget(target);
                renderer.clear();
                const worldPrograms = preparePrograms ? preparePrograms(world,view,target) : renderer.compileAsync(world,view);
                renderer.setRenderTarget(previous);
                preparation = Promise.all([worldPrograms,renderer.compileAsync(scene,camera),trail.prepare()]);
            } finally { renderer.setRenderTarget(previous); }
            return preparation;
        },
        resize(){renderer.getDrawingBufferSize(size);target.setSize(size.x,size.y);trail.release();
            lensScreenScale.value.set(size.x/Math.min(size.x,size.y),size.y/Math.min(size.x,size.y));},
        render(world,view){
            motion.update(view.quaternion,time.value,pinkTint.value>0.001);
            if(strength.value<0.001 && pinkTint.value<0.001 && trailStrength.value<0.001){trail.reset();renderer.render(world,view);return;}
            const previous=renderer.getRenderTarget();
            renderer.setRenderTarget(target);
            renderer.render(world,view);
            material.uniforms.image.value=trail.apply(target.texture,time.value,trailStrength.value);
            renderer.setRenderTarget(previous);
            renderer.render(scene,camera);
        }
    };
}
