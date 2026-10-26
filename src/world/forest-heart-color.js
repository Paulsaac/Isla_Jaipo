// Multiply cyan sobre el color original: conserva detalles, sin otra capa encima.
export function applyForestHeartCyan(material,strength) {
    material.onBeforeCompile=shader=>{
        shader.uniforms.forestHeartCyan=strength;
        shader.fragmentShader='uniform float forestHeartCyan;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
            #include <color_fragment>
            vec3 cyanMultiply=diffuseColor.rgb*vec3(0.025,0.95,1.0);
            diffuseColor.rgb=mix(diffuseColor.rgb,cyanMultiply,forestHeartCyan);
        `);
    };
    material.customProgramCacheKey=()=> 'forest-heart-cyan-multiply-v1';
    return material;
}
