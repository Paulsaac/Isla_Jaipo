// Fundir después de la máscara del sprite evita desapariciones por alphaTest.
export function createVegetationVisibility(group, strength) {
    const materials=[...new Set(group.children.flatMap(mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material]))];
    const depthWrites=materials.map(material=>material.depthWrite);
    const transparencies=materials.map(material=>material.transparent);
    for(const material of materials) {
        material.userData.preloadTransparency=true;
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
            materials.forEach((material,index)=>{
                // Solo el fundido necesita mezcla; en reposo los sprites recortados
                // se resuelven por profundidad, incluso dentro del mismo lote.
                const fading=value<1;
                const transparent=fading||transparencies[index];
                if(material.transparent!==transparent) {
                    material.transparent=transparent;
                    material.needsUpdate=true;
                }
                material.depthWrite=fading?false:depthWrites[index];
            });
            group.visible=value>0.01;
        }
    };
}
