// Respuesta visual del bosque: materiales existentes, sin pasos extra de render.
import { UNIT_SIZE } from '../config.js';
import { TREE_COLOR_ANGLE_GLSL } from './tree-color-cycle.js';
import { HEART_VISION_FADE_OUT_SECONDS, getForestVisualProfile, smoothest } from '../systems/heart-event-timing.js';
export function createHeartVision() {
    const uniforms = {
        heartStrength: { value: 0 }, heartBass: { value: 0 },
        heartTreble: { value: 0 }, heartTime: { value: 0 }, heartColorTime: { value: 0 },
        heartTreeMotion: { value: 0 }, heartVegetationStrength: { value: 0 }, heartWarpStrength: { value: 0 }
    };
    let releaseTime = null, releaseFrom = 0, releaseVegetationFrom = 0, releaseWarpFrom = 0;
    let motionSpeed = 0.35;
    function update(delta, active, energy, elapsed = 0) {
        if (active) {
            releaseTime = null;
            const profile = getForestVisualProfile(elapsed);
            motionSpeed = profile.speed;
            uniforms.heartStrength.value = profile.strength;
            uniforms.heartVegetationStrength.value = profile.strength;
            uniforms.heartWarpStrength.value = profile.warp;
        } else if (uniforms.heartStrength.value > 0.00001) {
            if (releaseTime === null) {
                releaseTime = 0; releaseFrom = uniforms.heartStrength.value;
                releaseVegetationFrom = uniforms.heartVegetationStrength.value;
                releaseWarpFrom = uniforms.heartWarpStrength.value;
            }
            releaseTime = Math.min(HEART_VISION_FADE_OUT_SECONDS, releaseTime + delta);
            const fade = 1 - smoothest(releaseTime / HEART_VISION_FADE_OUT_SECONDS);
            uniforms.heartStrength.value = releaseFrom * fade;
            uniforms.heartVegetationStrength.value = releaseVegetationFrom * fade;
            uniforms.heartWarpStrength.value = releaseWarpFrom * fade;
        } else {
            uniforms.heartStrength.value = uniforms.heartVegetationStrength.value = uniforms.heartWarpStrength.value = 0;
        }
        uniforms.heartTime.value += delta * motionSpeed;
        uniforms.heartColorTime.value += delta * 1.25 * motionSpeed;
        const response = 1 - Math.exp(-delta * 8);
        uniforms.heartBass.value += (energy.bass - uniforms.heartBass.value) * response;
        uniforms.heartTreble.value += (energy.treble - uniforms.heartTreble.value) * response;
    }
    function apply(THREE, material, mode = false) {
        const terrain = mode === true;
        const sky = mode === 'sky';
        const moon = mode === 'moon';
        const celestial = sky || moon;
        const tree = mode === 'tree';
        const water = mode === 'water';
        const previous = material.onBeforeCompile;
        const previousKey = material.customProgramCacheKey.bind(material);
        const key = previousKey();
        material.onBeforeCompile = function(shader, renderer) {
            previous.call(this, shader, renderer);
            Object.assign(shader.uniforms, uniforms);
            if (tree) {
                shader.uniforms.heartUnitSize = { value: UNIT_SIZE };
                shader.vertexShader = 'uniform float heartUnitSize;\nvarying float vHeartTreeCycle;\n' + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
                    #include <begin_vertex>
                    vHeartTreeCycle = 0.0;
                    #ifdef USE_INSTANCING
                        vec2 heartTreeCell = floor((modelMatrix * instanceMatrix[3]).xz / heartUnitSize + 0.5);
                        vHeartTreeCycle = mod(heartTreeCell.x + heartTreeCell.y, 8.0);
                    #endif
                `);
                shader.fragmentShader = 'varying float vHeartTreeCycle;\n' + TREE_COLOR_ANGLE_GLSL + shader.fragmentShader;
            }
            const mask = terrain ? 'clamp(vSplat.x + vSplat.y + vSplat.z + vWetSand, 0.0, 1.0) * (1.0 - smoothstep(3.0, 10.0, vTerrainHeight))' : '1.0';
            shader.fragmentShader = `uniform float heartStrength;
                uniform float heartBass; uniform float heartTreble; uniform float heartTime; uniform float heartColorTime;
                uniform float heartVegetationStrength; uniform float heartWarpStrength;
                ${shader.fragmentShader}`;
            if (!terrain && !celestial && !water) shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', THREE.ShaderChunk.map_fragment);
            // Sustituir solo consultas de textura, conservando UV base y transparencia.
            if (!celestial && !water) shader.fragmentShader = shader.fragmentShader.replaceAll('texture2D( map, vMapUv )', 'texture2D( map, heartWarpUv )')
                .replace(/texture2D\((t\w+), vMapUv\)/g, 'texture2D($1, heartWarpUv)')
                .replace(/textureGrad\((t\w+), vMapUv, terrainDx, terrainDy\)/g, 'textureGrad($1, heartWarpUv, terrainDx, terrainDy)')
                .replace('dFdx(vMapUv)', 'dFdx(heartWarpUv)')
                .replace('dFdy(vMapUv)', 'dFdy(heartWarpUv)');
            shader.fragmentShader = shader.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, `
                void main() {
                float heartAmount = ${tree || mode === 'vegetation' ? 'heartVegetationStrength' : 'heartStrength'} * (${mask});
                ${celestial || water ? '' : `#ifdef USE_MAP
                    vec2 heartWarpUv = vMapUv;
                    // Condición uniforme: conserva las derivadas de textura en los bordes.
                    if (heartWarpStrength > 0.0) heartWarpUv += vec2(
                        sin(vMapUv.y * 7.0 + heartTime * 0.55),
                        cos(vMapUv.x * 6.0 - heartTime * 0.45)
                    ) * heartWarpStrength * (${mask}) * (${terrain ? '0.012 + heartBass * 0.018' : '0.010 + heartBass * 0.025'});
                #endif`}
            `);
            shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
                if (heartAmount > 0.0) {
                ${celestial ? `
                vec3 heartHsv = heartRgbToHsv(outgoingLight);
                heartHsv.x = ${moon ? 'fract(0.6667 + heartColorTime * 0.035 + 0.4 + sin(heartColorTime * 0.13) * 0.12 + heartTreble * 0.02)' : 'fract(heartHsv.x + heartColorTime * 0.035 + heartBass * 0.03)'};
                heartHsv.y = clamp(heartHsv.y * 2.0, ${moon ? '0.88' : '0.85'}, 1.0);
                heartHsv.z = min(1.0, heartHsv.z * ${moon ? '1.05' : '1.65'});
                outgoingLight = mix(outgoingLight, heartHsvToRgb(heartHsv), clamp(heartAmount, 0.0, 1.0));
                ` : `
                // Brillo del propio dibujo: los píxeles oscuros conservan sus sombras.
                outgoingLight += diffuseColor.rgb * heartAmount * ${terrain ? '(0.035 + clamp(vSplat.x, 0.0, 1.0) * 0.065)' : tree ? '(0.45 + heartBass * 0.20)' : '0.0'};
                float heartAngle = ${terrain ? 'heartColorTime * 0.14 + heartBass * 0.20' : water ? 'heartColorTime * 0.20 + 3.1 + heartBass * 0.25' : tree ? 'heartTreeColorAngle(heartColorTime, vHeartTreeCycle, heartTreble)' : 'heartColorTime * 0.31 + 1.8 + heartTreble * 0.45'};
                vec3 heartAxis = normalize(vec3(1.0));
                vec3 heartShift = outgoingLight * cos(heartAngle)
                    + cross(heartAxis, outgoingLight) * sin(heartAngle)
                    + heartAxis * dot(heartAxis, outgoingLight) * (1.0 - cos(heartAngle));
                // Conservar luminosidad y detalle: teñir cada texel sin añadir un velo de color.
                heartShift = max(heartShift, vec3(0.0));
                vec3 heartLumaWeights = vec3(0.2126, 0.7152, 0.0722);
                heartShift = max(mix(vec3(dot(heartShift, heartLumaWeights)), heartShift, ${terrain || water ? '2.2' : '1.8'}), vec3(0.0));
                heartShift *= dot(outgoingLight, heartLumaWeights) / max(dot(heartShift, heartLumaWeights), 0.0001);
                outgoingLight = mix(outgoingLight, heartShift, heartAmount * ${terrain ? '0.42' : water ? '0.55' : '0.50'});
                outgoingLight *= 1.0 + heartAmount * heartTreble * ${terrain ? '0.02' : '0.05'};
                `}
                }
                #include <opaque_fragment>
            `);
            if (celestial) shader.fragmentShader = `
                vec3 heartRgbToHsv(vec3 color) {
                    float high = max(color.r, max(color.g, color.b));
                    float low = min(color.r, min(color.g, color.b));
                    float span = high - low;
                    float hue = 0.0;
                    if (span > 0.00001) {
                        if (high == color.r) hue = (color.g - color.b) / span;
                        else if (high == color.g) hue = 2.0 + (color.b - color.r) / span;
                        else hue = 4.0 + (color.r - color.g) / span;
                        hue = fract(hue / 6.0 + 1.0);
                    }
                    return vec3(hue, high > 0.00001 ? span / high : 0.0, high);
                }
                vec3 heartHsvToRgb(vec3 color) {
                    vec3 channels = abs(fract(color.xxx + vec3(0.0, 0.666667, 0.333333)) * 6.0 - 3.0);
                    return color.z * mix(vec3(1.0), clamp(channels - 1.0, 0.0, 1.0), color.y);
                }
            ` + shader.fragmentShader;
        };
        material.customProgramCacheKey = () => key + '-heart-vision-v10-' + mode;
    }
    return { uniforms, update, apply };
}
