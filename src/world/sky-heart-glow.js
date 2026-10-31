const glowMaps=new WeakMap();

// El resplandor es independiente del sprite: no suaviza ni cambia sus píxeles.
export function createSkyHeartGlow(THREE,opacity=.25) {
    if(!glowMaps.has(THREE)){
        const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
        const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
        gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.18,'#ffffffbb');
        gradient.addColorStop(.5,'#ffffff40');gradient.addColorStop(1,'#ffffff00');
        ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
        const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;glowMaps.set(THREE,map);
    }
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMaps.get(THREE),color:0xff070d,
        opacity,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));
    glow.name='sky-heart-red-glow';glow.renderOrder=-.1;
    return glow;
}

export function applySkyHeartEmbers(material,pulse,cooled={value:0}) {
    material.onBeforeCompile=shader=>{
        shader.uniforms.skyHeartPulse=pulse;
        shader.uniforms.skyHeartCooled=cooled;
        shader.fragmentShader='uniform float skyHeartPulse;\nuniform float skyHeartCooled;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
            // Toda la paleta roja; los negros y facetas de roca quedan intactos.
            float emberMask=step(max(diffuseColor.g,diffuseColor.b)*2.4,diffuseColor.r)*step(.035,diffuseColor.r);
            vec3 charcoal=vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))*.5);
            diffuseColor.rgb*=mix(1.,.62+1.5*skyHeartPulse,emberMask);
            diffuseColor.rgb=mix(diffuseColor.rgb,charcoal,skyHeartCooled);
        `);
    };
    material.customProgramCacheKey=()=> 'sky-heart-embers-v2';
}
