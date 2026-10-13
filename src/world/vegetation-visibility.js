// Fundir después de la máscara del sprite evita desapariciones por alphaTest.
export function createVegetationVisibility(group, strength) {
    const materials=[...new Set(group.children.flatMap(mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material]))];
    const depthWrites=materials.map(material=>material.depthWrite);
    for(const material of materials) {
        const previous=material.onBeforeCompile;
        const key=material.customProgramCacheKey();
        material.onBeforeCompile=function(shader,renderer) {
            previous.call(this,shader,renderer);
            shader.uniforms.vegetationFade=strength;
            shader.fragmentShader='uniform float vegetationFade;\n'+shader.fragmentShader;
            shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',
                '#include <alphatest_fragment>\ndiffuseColor.a *= vegetationFade;');
        };
        material.customProgramCacheKey=()=>key+'-visibility-v1';
    }
    return {
        set(value) {
            strength.value=value;
            materials.forEach((material,index)=>material.depthWrite=value>=0.99?depthWrites[index]:false);
            group.visible=value>0.01;
        }
    };
}
