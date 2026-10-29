// Respuesta visual del bosque: materiales existentes, sin pasos extra de render.
import * as THREE from 'three';
import { UNIT_SIZE, TREE_SPRITE_HEIGHT } from '../config.js';
import { FOREST_CUES } from '../content/forest-cues.js';
import { TREE_COLOR_ANGLE_GLSL } from './tree-color-cycle.js';
import { FOREST_LIGHT_PULSE_GLSL } from './forest-light-pulse.js';
import { getForestSkyHueShift, getForestHorizonHueShift } from './forest-sky-hue.js';
import { HEART_VISION_FADE_OUT_SECONDS, getForestVisualProfile, getForestMotionTime, getForestSunDimming, smoothest } from '../systems/heart-event-timing.js';

export function createHeartVision() {
    let settleTexture;
    const ready = new Promise(resolve => { settleTexture = resolve; });
    const psychTexture = new THREE.TextureLoader().load('./imagenes/Efectos/pixel_psych_spritesheet.png',
        () => settleTexture(), undefined, () => settleTexture());
    psychTexture.magFilter = THREE.NearestFilter;
    psychTexture.minFilter = THREE.NearestFilter;
    psychTexture.generateMipmaps = false;

    const uniforms = {
        heartStrength: { value: 0 }, heartTreeColorStrength: { value: 0 }, heartTreeGlow: { value: 0 }, heartBass: { value: 0 },
        heartTreble: { value: 0 }, heartTime: { value: 0 }, heartColorTime: { value: 0 },
        heartTreeMotion: { value: 0 }, heartVegetationStrength: { value: 0 }, heartWarpStrength: { value: 0 },
        heartHyperSaturation: { value: 0 },
        skyPsychOpacity: { value: 0 },
        skyPsychTime: { value: 0 },
        heartDuskHueShift: { value: 0 },
        heartHorizonHueShift: { value: 0 }, heartSunDimming: { value: 0 },
        skyKaleidoAmount: { value: 0 },
        skyPsychTexture: { value: psychTexture }
    };
    let releaseTime = null, releaseFrom = 0, releaseVegetationFrom = 0, releaseWarpFrom = 0;
    let releaseHyperSatFrom = 0, releaseSkyOpacityFrom = 0, releaseTreeGlowFrom = 0, releaseTreeColorFrom = 0;
    let releaseSunDimmingFrom = 0;
    let motionSpeed = 0.35;
    let currentTrailStrength = 0;
    let currentScreenKaleidoscope = 0;

    function update(delta, active, energy, elapsed = 0) {
        if (active) {
            releaseTime = null;
            const profile = getForestVisualProfile(elapsed);
            motionSpeed = profile.speed;
            uniforms.heartStrength.value = profile.strength;
            uniforms.heartTreeColorStrength.value = profile.treeColor;
            uniforms.heartTreeGlow.value = profile.treeGlow;
            uniforms.heartVegetationStrength.value = profile.strength;
            uniforms.heartWarpStrength.value = profile.warp;
            uniforms.heartHyperSaturation.value = profile.hyperSaturation;
            uniforms.skyPsychOpacity.value = profile.skyPsychOpacity;
            uniforms.skyKaleidoAmount.value = profile.skyKaleidoAmount;
            uniforms.skyPsychTime.value = elapsed;
            uniforms.heartDuskHueShift.value = getForestSkyHueShift(elapsed);
            uniforms.heartHorizonHueShift.value = getForestHorizonHueShift(elapsed);
            uniforms.heartSunDimming.value = getForestSunDimming(elapsed);
            currentTrailStrength = profile.trailStrength;
            currentScreenKaleidoscope = profile.screenKaleidoscope;
        } else if (uniforms.heartStrength.value > 0.00001 || uniforms.skyPsychOpacity.value > 0.00001 || uniforms.heartTreeGlow.value > 0.00001 || uniforms.heartSunDimming.value > 0.00001) {
            currentTrailStrength = 0;
            currentScreenKaleidoscope = 0;
            if (releaseTime === null) {
                releaseTime = 0; releaseFrom = uniforms.heartStrength.value;
                releaseVegetationFrom = uniforms.heartVegetationStrength.value;
                releaseWarpFrom = uniforms.heartWarpStrength.value;
                releaseHyperSatFrom = uniforms.heartHyperSaturation.value;
                releaseSkyOpacityFrom = uniforms.skyPsychOpacity.value;
                releaseTreeGlowFrom = uniforms.heartTreeGlow.value;
                releaseTreeColorFrom = uniforms.heartTreeColorStrength.value;
                releaseSunDimmingFrom = uniforms.heartSunDimming.value;
            }
            releaseTime = Math.min(HEART_VISION_FADE_OUT_SECONDS, releaseTime + delta);
            const fade = 1 - smoothest(releaseTime / HEART_VISION_FADE_OUT_SECONDS);
            uniforms.heartStrength.value = releaseFrom * fade;
            uniforms.heartTreeGlow.value = releaseTreeGlowFrom * fade;
            uniforms.heartTreeColorStrength.value = releaseTreeColorFrom * fade;
            uniforms.heartSunDimming.value = releaseSunDimmingFrom * fade;
            uniforms.heartVegetationStrength.value = releaseVegetationFrom * fade;
            uniforms.heartWarpStrength.value = releaseWarpFrom * fade;
            uniforms.heartHyperSaturation.value = releaseHyperSatFrom * fade;
            uniforms.skyPsychOpacity.value = releaseSkyOpacityFrom * fade;
            uniforms.skyKaleidoAmount.value = fade;
        } else {
            uniforms.heartStrength.value = uniforms.heartVegetationStrength.value = uniforms.heartWarpStrength.value = 0;
            uniforms.heartTreeGlow.value = 0;
            uniforms.heartTreeColorStrength.value = 0;
            uniforms.heartDuskHueShift.value = 0;
            uniforms.heartHorizonHueShift.value = uniforms.heartSunDimming.value = 0;
            uniforms.heartHyperSaturation.value = uniforms.skyPsychOpacity.value = uniforms.skyKaleidoAmount.value = 0;
        }
        uniforms.heartTime.value += delta * motionSpeed;
        uniforms.heartColorTime.value += delta * 1.25 * motionSpeed;
        const response = 1 - Math.exp(-delta * 8);
        uniforms.heartBass.value += (energy.bass - uniforms.heartBass.value) * response;
        uniforms.heartTreble.value += (energy.treble - uniforms.heartTreble.value) * response;
    }

    function apply(THREE_LIB, material, mode = false) {
        const terrain = mode === true;
        const sky = mode === 'sky';
        const moon = mode === 'moon';
        const celestial = sky || moon;
        const tree = mode === 'tree';
        const water = mode === 'water';
        const previous = material.onBeforeCompile;
        const previousKey = material.customProgramCacheKey ? material.customProgramCacheKey.bind(material) : () => '';
        const key = previousKey();
        material.onBeforeCompile = function(shader, renderer) {
            previous.call(this, shader, renderer);
            Object.assign(shader.uniforms, uniforms);
            if (sky) {
                // Dirección común a las seis caras: el patrón no reinicia en cada cara del atlas.
                shader.vertexShader = 'varying vec3 vPsychSkyDirection;\n' + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
                    '#include <begin_vertex>\nvPsychSkyDirection = position;');
                shader.fragmentShader = 'varying vec3 vPsychSkyDirection;\n' + shader.fragmentShader;
            }
            if (tree) {
                shader.uniforms.heartUnitSize = { value: UNIT_SIZE };
                shader.vertexShader = 'uniform float heartUnitSize;\nvarying float vHeartTreeCycle;\nvarying vec3 vHeartTreeOrigin;\n' + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
                    #include <begin_vertex>
                    vHeartTreeCycle = 0.0;
                    vHeartTreeOrigin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                    #ifdef USE_INSTANCING
                        vHeartTreeOrigin = (modelMatrix * instanceMatrix[3]).xyz;
                        vec2 heartTreeCell = floor((modelMatrix * instanceMatrix[3]).xz / heartUnitSize + 0.5);
                        vHeartTreeCycle = mod(heartTreeCell.x + heartTreeCell.y, 8.0);
                    #endif
                `);
                shader.fragmentShader = 'varying float vHeartTreeCycle;\nvarying vec3 vHeartTreeOrigin;\n' + TREE_COLOR_ANGLE_GLSL + FOREST_LIGHT_PULSE_GLSL + shader.fragmentShader;
            }
            const mask = terrain ? 'clamp(vSplat.x + vSplat.y + vSplat.z + vWetSand, 0.0, 1.0) * (1.0 - smoothstep(3.0, 10.0, vTerrainHeight))' : '1.0';
            shader.fragmentShader = `uniform float heartStrength; uniform float heartTreeGlow; uniform float heartTreeColorStrength;
                uniform float heartBass; uniform float heartTreble; uniform float heartTime; uniform float heartColorTime;
                uniform float heartVegetationStrength; uniform float heartWarpStrength;
                uniform float heartHyperSaturation;
                uniform float skyPsychOpacity; uniform float skyPsychTime; uniform float skyKaleidoAmount;
                uniform sampler2D skyPsychTexture;
                ${sky ? `
                vec3 psychTile(vec2 coordinates, float frame) {
                    // Deriva y giro muy lentos, comunes a todas las caras y apariciones.
                    float driftTime = max(0.0, skyPsychTime - ${(FOREST_CUES[5] - 2).toFixed(6)});
                    float angle = driftTime * 0.008;
                    float c = cos(angle), s = sin(angle);
                    coordinates = mat2(c, -s, s, c) * coordinates + vec2(0.003, -0.002) * driftTime;
                    // Repetición reflejada: ambos lados de cada unión muestrean el mismo borde.
                    vec2 tile = 1.0 - abs(mod(coordinates, 2.0) - 1.0);
                    vec2 inset = vec2(0.5 / 120.0);
                    tile = inset + tile * (1.0 - 2.0 * inset);
                    return texture2D(skyPsychTexture, vec2((tile.x + frame) / 10.0, tile.y)).rgb;
                }
                vec3 psychSkyFrame(vec3 direction, float frame) {
                    vec3 weights = pow(abs(direction), vec3(4.0));
                    weights /= max(weights.x + weights.y + weights.z, 0.0001);
                    // Proyección triplanar continua, incluidos las esquinas y los polos.
                    return psychTile(direction.yz * 1.5, frame) * weights.x
                         + psychTile(direction.xz * 1.5, frame) * weights.y
                         + psychTile(direction.xy * 1.5, frame) * weights.z;
                }
                ` : ''}
                ${shader.fragmentShader}`;
            if (sky) {
                shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
                    #ifdef USE_MAP
                        vec4 normalSkySample = texture2D(map, vMapUv);
                        vec4 kaleidoSkySample = texture2D(map, kaleidoSkyUv);
                        vec4 sampledDiffuseColor = mix(normalSkySample, kaleidoSkySample, clamp(skyKaleidoAmount, 0.0, 1.0));
                        diffuseColor *= sampledDiffuseColor;
                    #endif
                `);
            } else if (!terrain && !celestial && !water) {
                shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', THREE_LIB.ShaderChunk.map_fragment);
            }
            // Sustituir solo consultas de textura, conservando UV base y transparencia.
            if (!celestial && !water) shader.fragmentShader = shader.fragmentShader.replaceAll('texture2D( map, vMapUv )', 'texture2D( map, heartWarpUv )')
                .replace(/texture2D\((t\w+), vMapUv\)/g, 'texture2D($1, heartWarpUv)')
                .replace(/textureGrad\((t\w+), vMapUv, terrainDx, terrainDy\)/g, 'textureGrad($1, heartWarpUv, terrainDx, terrainDy)')
                .replace('dFdx(vMapUv)', 'dFdx(heartWarpUv)')
                .replace('dFdy(vMapUv)', 'dFdy(heartWarpUv)');
            shader.fragmentShader = shader.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, `
                void main() {
                float heartAmount = ${tree ? 'heartTreeColorStrength' : mode === 'vegetation' ? 'heartVegetationStrength' : 'heartStrength'} * (${mask});
                ${celestial || water ? '' : `#ifdef USE_MAP
                    vec2 heartWarpUv = vMapUv;
                    // Condición uniforme: conserva las derivadas de textura en los bordes.
                    if (heartWarpStrength > 0.0) heartWarpUv += vec2(
                        sin(vMapUv.y * 7.0 + heartTime * 0.55),
                        cos(vMapUv.x * 6.0 - heartTime * 0.45)
                    ) * heartWarpStrength * (${mask}) * (${terrain ? '0.012 + heartBass * 0.018' : '0.010 + heartBass * 0.025'});
                #endif`}
                ${sky ? `#ifdef USE_MAP
                    vec2 skyCellColRow = floor(vec2(vMapUv.x * 4.0, vMapUv.y * 3.0));
                    vec2 skyCellCenter = (skyCellColRow + vec2(0.5)) * vec2(0.25, 0.33333333);
                    vec2 skyCellHalf = vec2(0.122, 0.163);
                    vec2 skyDUv = vMapUv - skyCellCenter;
                    vec2 skyNormD = vec2(skyDUv.x * 1.3333333, skyDUv.y);
                    float skyR = length(skyNormD);
                    float skyPhi = atan(skyNormD.y, skyNormD.x);
                    float skySeg = 6.283185307 / 8.0;
                    // Acelerar desde reposo durante 8 s, sin saltar al ángulo acumulado de la canción.
                    float rotationTime = max(0.0, skyPsychTime - ${FOREST_CUES[6].toFixed(6)});
                    float rotationRamp = clamp(rotationTime / 8.0, 0.0, 1.0);
                    float rotationTravel = rotationTime < 8.0
                        ? 8.0 * (pow(rotationRamp, 3.0) - 0.5 * pow(rotationRamp, 4.0))
                        : rotationTime - 4.0;
                    float skyRotAngle = skyPhi + rotationTravel * 0.12;
                    float skyFolded = mod(skyRotAngle, skySeg);
                    if (skyFolded > skySeg * 0.5) skyFolded = skySeg - skyFolded;
                    float skyFinalAngle = mix(skyPhi, skyFolded - skyRotAngle + skyPhi, clamp(skyKaleidoAmount, 0.0, 1.0));
                    vec2 skyFoldedNormD = vec2(cos(skyFinalAngle), sin(skyFinalAngle)) * skyR;
                    vec2 skyFoldedDUv = vec2(skyFoldedNormD.x * 0.75, skyFoldedNormD.y);
                    vec2 kaleidoSkyUv = clamp(skyCellCenter + skyFoldedDUv, skyCellCenter - skyCellHalf, skyCellCenter + skyCellHalf);
                #endif` : ''}
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
                outgoingLight += diffuseColor.rgb * heartAmount * ${terrain ? '(0.035 + clamp(vSplat.x, 0.0, 1.0) * 0.065)' : tree ? '(0.42 + heartBass * 0.18)' : '0.0'};
                // Acelerar solo el tono de los árboles entre marcas 2 y 3.
                // Conservar el desfase acumulado después evita un salto de color al salir.
                float heartAngle = ${terrain ? 'heartColorTime * 0.14 + heartBass * 0.20' : water ? 'heartColorTime * 0.20 + 3.1 + heartBass * 0.25' : tree ? `heartTreeColorAngle(heartColorTime + 0.5 * clamp(skyPsychTime - ${FOREST_CUES[2].toFixed(6)}, 0.0, ${(FOREST_CUES[3] - FOREST_CUES[2]).toFixed(6)}), vHeartTreeCycle, heartTreble)` : 'heartColorTime * 0.31 + 1.8 + heartTreble * 0.45'};
                vec3 heartAxis = normalize(vec3(1.0));
                vec3 heartShift = outgoingLight * cos(heartAngle)
                    + cross(heartAxis, outgoingLight) * sin(heartAngle)
                    + heartAxis * dot(heartAxis, outgoingLight) * (1.0 - cos(heartAngle));
                // Conservar luminosidad y detalle: teñir cada texel sin añadir un velo de color.
                heartShift = max(heartShift, vec3(0.0));
                vec3 heartLumaWeights = vec3(0.2126, 0.7152, 0.0722);
                heartShift = max(mix(vec3(dot(heartShift, heartLumaWeights)), heartShift, ${terrain || water ? '2.2' : tree ? '1.85' : '1.8'}), vec3(0.0));
                heartShift *= dot(outgoingLight, heartLumaWeights) / max(dot(heartShift, heartLumaWeights), 0.0001);
                outgoingLight = mix(outgoingLight, heartShift, heartAmount * ${terrain ? '0.42' : water ? '0.55' : tree ? '0.92' : '0.50'});
                outgoingLight *= 1.0 + heartAmount * heartTreble * ${terrain ? '0.02' : '0.05'};
                `}
                }
                ${!celestial ? `
                if (heartHyperSaturation > 0.001) {
                    vec3 heartLumaW = vec3(0.2126, 0.7152, 0.0722);
                    vec3 lumaVal = vec3(dot(outgoingLight, heartLumaW));
                    outgoingLight = max(mix(lumaVal, outgoingLight, 1.0 + heartHyperSaturation * ${tree ? '0.50' : '0.85'}), vec3(0.0));
                }
                ` : ''}
                ${tree ? `
                #ifdef USE_MAP
                // Puntos sobre el propio tronco: siguen su deformación y su transparencia.
                float trunkHeight = vMapUv.y * ${TREE_SPRITE_HEIGHT.toFixed(6)} - 0.5;
                float treeGround = vHeartTreeOrigin.y - ${(TREE_SPRITE_HEIGHT / 2 - 0.5).toFixed(6)};
                float focusHeight = clamp(cameraPosition.y - treeGround, 0.65, ${(TREE_SPRITE_HEIGHT - 0.5).toFixed(6)});
                float trunkGlow = 0.0;
                vec3 trunkGlowColor = vec3(0.0);
                float nearby = 1.0 - smoothstep(10.0, 16.0, distance(cameraPosition.xz, vHeartTreeOrigin.xz));
                if (heartTreeGlow > 0.001 && nearby > 0.001) {
                    // Solo el punto más cercano puede contribuir a este píxel del tronco.
                    // Las colas de los otros siete son menores que un paso de color de 8 bits.
                    float level = clamp(floor((trunkHeight - 0.65) / ${((TREE_SPRITE_HEIGHT - 1.15) / 7).toFixed(9)} + 0.5), 0.0, 7.0);
                    float height = mix(0.65, ${(TREE_SPRITE_HEIGHT - 0.5).toFixed(6)}, level / 7.0);
                        vec2 spotDistance = vec2((vMapUv.x - 0.5) * 4.84, (trunkHeight - height) * 1.4);
                        float radiusSquared = dot(spotDistance, spotDistance);
                        // El punto más próximo a los ojos mantiene el foco completo;
                        // los siguientes pierden brillo rápido, sin saltos entre alturas.
                        float focusDistance = max(0.0, abs(height - focusHeight) - ${((TREE_SPRITE_HEIGHT - 1.15) / 14).toFixed(9)});
                        float focus = exp(-focusDistance / 0.38);
                        float gradient = 0.07 + 1.18 * focus;
                        // Cada altura conserva su propio tono, también lejos de los ojos.
                        float hue = fract(level * 0.137 + vHeartTreeCycle * 0.113
                            + dot(vHeartTreeOrigin.xz, vec2(0.017, 0.031)) + heartColorTime * 0.025);
                        vec3 channels = abs(fract(vec3(hue) + vec3(0.0, 0.666667, 0.333333)) * 6.0 - 3.0);
                        trunkGlowColor = mix(vec3(0.035), clamp(channels - 1.0, 0.0, 1.0), 0.96);
                        vec2 pulseCell=floor(vHeartTreeOrigin.xz/${UNIT_SIZE.toFixed(6)}+0.5);
                        float pulseSeed=pulseCell.x*37.0+pulseCell.y*101.0+level*271.0;
                        float pulse=forestLightPulse(skyPsychTime,pulseSeed,focusDistance);
                        trunkGlow += (exp(-radiusSquared / mix(0.035, 0.072, focus)) * 0.38
                            + exp(-radiusSquared / mix(0.0035, 0.009, focus)) * 1.25) * gradient * pulse;
                }
                float trunkGlowAmount = trunkGlow * nearby * heartTreeGlow;
                outgoingLight = mix(outgoingLight, outgoingLight * trunkGlowColor, clamp(trunkGlowAmount * 0.65, 0.0, 0.75));
                outgoingLight += trunkGlowColor * trunkGlowAmount;
                #endif
                ` : ''}
                ${sky ? `
                if (skyPsychOpacity > 0.001) {
                    #ifdef USE_MAP
                    float psychClock = mod(skyPsychTime * 8.0, 10.0);
                    float psychFrame = floor(psychClock);
                    vec3 psychDirection = normalize(vPsychSkyDirection);
                    vec3 psychSample = mix(psychSkyFrame(psychDirection, psychFrame),
                        psychSkyFrame(psychDirection, mod(psychFrame + 1.0, 10.0)),
                        smoothstep(0.0, 1.0, fract(psychClock)));
                    // Blend mode "sobreexponer color" (Color Dodge):
                    // Result = Base / (1.0 - Blend)
                    // Con umbral de luminancia nocturna para que el negro del cielo no anule la iluminacion:
                    vec3 baseIllum = max(outgoingLight, vec3(0.18, 0.20, 0.30));
                    vec3 dodgeColor = clamp(baseIllum / max(vec3(1.0) - psychSample * 0.98, vec3(0.01)), 0.0, 1.0);
                    outgoingLight = mix(outgoingLight, dodgeColor, clamp(skyPsychOpacity, 0.0, 1.0));
                    #endif
                }
                ` : ''}
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
        material.customProgramCacheKey = () => key + '-heart-vision-v27-' + mode;
    }
    function setTimelineTime(time,motionBase=0,colorBase=0) {
        const phase=getForestMotionTime(time);
        uniforms.heartTime.value=motionBase+phase;
        uniforms.heartColorTime.value=colorBase+phase*1.25;
    }
    function captureState() {
        return {values:Object.fromEntries(Object.entries(uniforms).filter(([,u])=>typeof u.value==='number').map(([key,u])=>[key,u.value])),
            releaseTime,releaseFrom,releaseVegetationFrom,releaseWarpFrom,releaseHyperSatFrom,releaseSkyOpacityFrom,releaseTreeGlowFrom,releaseTreeColorFrom,releaseSunDimmingFrom,
            motionSpeed,currentTrailStrength,currentScreenKaleidoscope};
    }
    function restoreState(state) {
        for(const [key,value] of Object.entries(state.values))uniforms[key].value=value;
        ({releaseTime,releaseFrom,releaseVegetationFrom,releaseWarpFrom,releaseHyperSatFrom,releaseSkyOpacityFrom,releaseTreeGlowFrom,releaseTreeColorFrom,releaseSunDimmingFrom,
            motionSpeed,currentTrailStrength,currentScreenKaleidoscope}=state);
    }
    function seek(time,motionBase=0,colorBase=0,energy={bass:0,treble:0}) {
        update(0,true,energy,time);
        uniforms.heartBass.value=energy.bass;uniforms.heartTreble.value=energy.treble;
        setTimelineTime(time,motionBase,colorBase);
    }
    return { ready, uniforms, update, apply,seek,setTimelineTime,captureState,restoreState,
        getTrailStrength: () => currentTrailStrength, getScreenKaleidoscope: () => currentScreenKaleidoscope };
}
