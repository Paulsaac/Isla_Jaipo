// Mantener todas las luces/programas: omitir solo aportes exactamente nulos.
const prepared = new WeakSet();
export function prepareInactiveLights(THREE, root) {
    root.traverse(object => {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
            if (!material?.isMeshPhongMaterial || prepared.has(material)) continue;
            prepared.add(material);
            const previous = material.onBeforeCompile;
            const key = material.customProgramCacheKey();
            material.onBeforeCompile = function(shader, renderer) {
                previous.call(this, shader, renderer);
                const chunk = THREE.ShaderChunk.lights_fragment_begin;
                const start = chunk.indexOf('getPointLightInfo( pointLight');
                const end = chunk.indexOf('\n\t}', start);
                if (start < 0 || end < 0) return;
                const body = chunk.slice(start, end);
                // La condición usa color uniforme y conserva íntegro el cálculo de luces encendidas.
                const guarded = 'if (any(notEqual(pointLight.color, vec3(0.0)))) {\n' + body + '\n}';
                shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>',
                    chunk.slice(0, start) + guarded + chunk.slice(end));
            };
            material.customProgramCacheKey = () => key + '-inactive-point-lights-v1';
        }
    });
}
