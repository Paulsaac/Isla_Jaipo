// Balanceo en GPU: las dos caras de cada planta comparten movimiento y base fija.
import { UNIT_SIZE } from '../config.js';
import { TREE_MOTION_GLSL } from './tree-motion.js';
export function applyVegetationWind(THREE, materials, time, heartVision = null) {
    materials.forEach((material, index) => {
        const amplitude = (index < 6 ? 0.12 : index < 8 ? 0.065 : 0.085) * 1.1;
        const speed = (0.65 + (index % 5) * 0.11) * (index >= 6 ? 1.2 : 1);
        const phase = index * 1.73;
        material.onBeforeCompile = shader => {
            shader.uniforms.windTime = time;
            shader.uniforms.windParameters = { value: new THREE.Vector3(amplitude, speed, phase) };
            if (heartVision) Object.assign(shader.uniforms, heartVision.uniforms);
            shader.vertexShader = 'uniform float windTime;\nuniform vec3 windParameters;\n' + shader.vertexShader;
            if (heartVision) shader.vertexShader = 'uniform float heartVegetationStrength;\nuniform float heartBass;\n' + shader.vertexShader;
            if (heartVision && index < 6) {
                shader.uniforms.windUnitSize = { value: UNIT_SIZE };
                shader.vertexShader = 'uniform float windUnitSize;\nuniform float heartTime;\nuniform float heartTreeMotion;\n' + TREE_MOTION_GLSL + shader.vertexShader;
            }
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
                    mvPosition.xz += vec2(1.0, 0.3) * sway * windParameters.x * heightWeight * heightWeight
                        ${heartVision && index >= 6 ? '* (1.0 + heartVegetationStrength * (0.6 + heartBass * 1.8))' : ''};
                    ${heartVision && index < 6 ? `
                        vec2 heartMotionCell = floor(origin / windUnitSize + 0.5);
                        float motionVariant = mod(heartMotionCell.x + heartMotionCell.y * 2.0, 4.0);
                        mvPosition.xyz += heartTreeMovement(mvPosition.xyz, origin, heightWeight,
                            motionVariant, heartTime, phase, heartBass) * heartTreeMotion;
                    ` : ''}
                #endif
                mvPosition = modelViewMatrix * mvPosition;
                `
            );
            shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', projection);
        };
        material.customProgramCacheKey = () => 'vegetation-wind-v4-' + (index < 6);
    });
}
