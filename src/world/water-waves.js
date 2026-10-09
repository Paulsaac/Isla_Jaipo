// Ondas visuales en GPU: desplazan la textura y sus reflejos sin cambiar la física.
export function applyWaterWaves(THREE, material, time) {
    material.onBeforeCompile = shader => {
        shader.uniforms.waterTime = time;
        shader.vertexShader = 'varying vec3 vWaterPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
            '#include <begin_vertex>\nvWaterPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
        shader.fragmentShader = 'uniform float waterTime;\nvarying vec3 vWaterPosition;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
            float waveA = vWaterPosition.x * 0.65 + vWaterPosition.z * 0.3 + waterTime * 0.75;
            float waveB = vWaterPosition.x * -0.25 + vWaterPosition.z * 0.8 - waterTime * 0.55;
            vec2 waterUvOffset = vec2(sin(waveA), cos(waveB)) * 0.06;
            ${THREE.ShaderChunk.map_fragment.replaceAll('vMapUv', '(vMapUv + waterUvOffset)')}
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
            #include <normal_fragment_maps>
            vec3 ripple = vec3(cos(waveA) * 0.035, 0.0, sin(waveB) * 0.03);
            normal = normalize(normal + (viewMatrix * vec4(ripple, 0.0)).xyz);
        `);
    };
    material.customProgramCacheKey = () => 'water-waves-v1';
}
