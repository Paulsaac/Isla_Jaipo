// Balanceo en GPU: las dos caras de cada planta comparten movimiento y base fija.
export function applyVegetationWind(THREE, materials, time) {
    materials.forEach((material, index) => {
        const amplitude = index < 6 ? 0.12 : index < 8 ? 0.065 : 0.085;
        const speed = (0.65 + (index % 5) * 0.11) * (index >= 6 ? 1.2 : 1);
        const phase = index * 1.73;
        material.onBeforeCompile = shader => {
            shader.uniforms.windTime = time;
            shader.uniforms.windParameters = { value: new THREE.Vector3(amplitude, speed, phase) };
            shader.vertexShader = 'uniform float windTime;\nuniform vec3 windParameters;\n' + shader.vertexShader;
            const projection = THREE.ShaderChunk.project_vertex.replace(
                'mvPosition = modelViewMatrix * mvPosition;',
                `
                #ifdef USE_INSTANCING
                    vec2 origin = instanceMatrix[3].xz;
                    float phase = windParameters.z + dot(origin, vec2(0.071, 0.093));
                    float speed = windParameters.y * (0.9 + 0.2 * fract(sin(dot(origin, vec2(12.9898, 78.233))) * 43758.5453));
                    float sway = sin(windTime * speed + phase) * 0.8
                               + sin(windTime * speed * 1.63 + phase * 0.7) * 0.2;
                    float heightWeight = smoothstep(0.18, 1.0, uv.y);
                    mvPosition.xz += vec2(1.0, 0.3) * sway * windParameters.x * heightWeight * heightWeight;
                #endif
                mvPosition = modelViewMatrix * mvPosition;
                `
            );
            shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', projection);
        };
        material.customProgramCacheKey = () => 'vegetation-wind-v1';
    });
}
