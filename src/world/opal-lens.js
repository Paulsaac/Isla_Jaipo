// Lente convexa de doce caras. El color depende de la mirada, no del tiempo.
export function createOpalLens(THREE,radius=0.071,thickness=0.014) {
    const geometry=new THREE.SphereGeometry(1,12,6);
    geometry.scale(radius,radius,thickness/2);
    const material=new THREE.MeshPhongMaterial({color:0x84cfe8,emissive:0x1c3441,
        emissiveIntensity:0.30,specular:0xb2cce8,shininess:65,transparent:true,opacity:0.44,
        side:THREE.FrontSide,depthWrite:false});
    material.onBeforeCompile=shader=>{
        shader.uniforms.opalRadius={value:radius};
        shader.vertexShader='uniform float opalRadius;\nvarying vec2 vOpalDisc;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
            #include <begin_vertex>
            vOpalDisc=position.xy/opalRadius;
        `);
        shader.fragmentShader='varying vec2 vOpalDisc;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
            #include <normal_fragment_maps>
            float opalAngle=1.0-clamp(abs(dot(normal,normalize(vViewPosition))),0.0,1.0);
            float opalPhase=clamp(0.5+vOpalDisc.x*0.28+vOpalDisc.y*0.15+(opalAngle-0.5)*0.70,0.0,1.0);
            vec3 opalCyan=vec3(0.08,0.42,0.60);
            vec3 opalBlue=vec3(0.10,0.15,0.45);
            vec3 opalViolet=vec3(0.30,0.10,0.50);
            vec3 opalPink=vec3(0.55,0.22,0.42);
            vec3 opalPearl=vec3(0.55,0.50,0.28);
            vec3 opalTint=mix(opalCyan,opalBlue,smoothstep(0.0,0.28,opalPhase));
            opalTint=mix(opalTint,opalViolet,smoothstep(0.28,0.55,opalPhase));
            opalTint=mix(opalTint,opalPink,smoothstep(0.55,0.80,opalPhase));
            opalTint=mix(opalTint,opalPearl,smoothstep(0.80,1.0,opalPhase));
            diffuseColor.rgb=opalTint;
            totalEmissiveRadiance+=opalTint*0.10;
            diffuseColor.a=0.38+0.16*opalAngle;
        `);
    };
    material.customProgramCacheKey=()=> 'isla-opal-lens-v2';
    const lens=new THREE.Mesh(geometry,material);
    lens.name='opalescent-telescope-lens';
    lens.renderOrder=2;
    return lens;
}
