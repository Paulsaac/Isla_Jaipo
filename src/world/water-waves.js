import { RIVER_FLOW_PHASE_RATE, RIVER_FLOW_UV_TRAVEL } from './river-current.js';

// Movimiento compartido por el agua y la superficie translúcida del altar.
export const waterTextureMotionGLSL = `
    float waveA = vWaterPosition.x * 0.65 + vWaterPosition.z * 0.3 + waterTime * 0.75;
    float waveB = vWaterPosition.x * -0.25 + vWaterPosition.z * 0.8 - waterTime * 0.55;
    vec2 waterUvOffset = vec2(sin(waveA), cos(waveB)) * 0.06 * mix(1.0,1.8,waterImmersion);
`;

// Ondas visuales en GPU; la corriente comparte velocidad con el empuje del jugador.
export function applyWaterWaves(THREE, material, time, currentField, unitSize, immersion = {value:0}, raisedCell = {value:new THREE.Vector4()}, flowOrigin = new THREE.Vector2(), shoreline = null) {
    const flowTexture = new THREE.DataTexture(currentField.data, currentField.width, currentField.height, THREE.RGBAFormat);
    flowTexture.needsUpdate = true;
    flowTexture.magFilter = flowTexture.minFilter = THREE.NearestFilter;
    material.onBeforeCompile = shader => {
        if(shoreline)Object.assign(shader.uniforms,shoreline.uniforms);
        shader.uniforms.waterTime = time;
        shader.uniforms.waterImmersion = immersion;
        shader.uniforms.raisedWaterCell = raisedCell;
        shader.uniforms.riverFlowMap = { value: flowTexture };
        shader.uniforms.riverMapSize = { value: new THREE.Vector2(currentField.width, currentField.height) };
        shader.uniforms.riverUnitSize = { value: unitSize };
        shader.uniforms.riverOrigin = { value: flowOrigin };
        shader.vertexShader = 'varying vec3 vWaterPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
            '#include <begin_vertex>\nvWaterPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
        shader.fragmentShader = 'uniform float waterTime;\nuniform float waterImmersion;\nuniform vec4 raisedWaterCell;\nuniform sampler2D riverFlowMap;\nuniform vec2 riverMapSize;\nuniform float riverUnitSize;\nuniform vec2 riverOrigin;\nvarying vec3 vWaterPosition;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
            // Una sola superficie de agua dentro del altar, a su cota elevada.
            if(raisedWaterCell.z>0.0 && vWaterPosition.y<raisedWaterCell.w-0.01
                && all(lessThan(abs(vWaterPosition.xz-raisedWaterCell.xy),vec2(raisedWaterCell.z)))) discard;
            ${waterTextureMotionGLSL}
            ${THREE.ShaderChunk.map_fragment.replaceAll('vMapUv', '(vMapUv + waterUvOffset)')}
            #ifdef USE_MAP
                vec2 fieldUv = ((vWaterPosition.xz-riverOrigin) / riverUnitSize + 0.5) / riverMapSize;
                vec3 flowSample = texture2D(riverFlowMap, fieldUv).rgb;
                // Fuera del mapa solo hay mar: no prolongar la corriente de una celda de borde.
                flowSample.b *= step(0.0,fieldUv.x)*step(fieldUv.x,1.0)*step(0.0,fieldUv.y)*step(fieldUv.y,1.0);
                vec2 flowDirection = (flowSample.rg * 2.0 - 1.0) * vec2(1.0, -1.0);
                // Dos fases fundidas hacen avanzar la textura sin saltos al reiniciar.
                float flowPhase = fract(waterTime * ${RIVER_FLOW_PHASE_RATE});
                float secondPhase = fract(waterTime * ${RIVER_FLOW_PHASE_RATE} + 0.5);
                float flowBlend = abs(flowPhase * 2.0 - 1.0);
                vec2 baseUv = vMapUv + waterUvOffset * 0.6;
                vec4 currentA = texture2D(map, baseUv - flowDirection * (flowPhase - 0.5) * ${RIVER_FLOW_UV_TRAVEL});
                vec4 currentB = texture2D(map, baseUv - flowDirection * (secondPhase - 0.5) * ${RIVER_FLOW_UV_TRAVEL});
                vec4 currentTexel = mix(currentA, currentB, flowBlend);
                vec4 riverColor = vec4(diffuse, opacity) * currentTexel;
                diffuseColor = mix(diffuseColor, riverColor, flowSample.b);
            #endif
            float waterLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            diffuseColor.rgb = mix(vec3(waterLuminance), diffuseColor.rgb, 0.7225);
            // Aclarar solo el agua próxima, con distancia horizontal al jugador.
            float waterDistance = distance(vWaterPosition.xz, cameraPosition.xz);
            float surfaceOpacity = mix(0.5, opacity, smoothstep(6.0, 12.0, waterDistance));
            // La cara inferior es opaca incluso durante la transición de inmersión.
            float viewOpacity = cameraPosition.y < vWaterPosition.y ? 1.0 : surfaceOpacity;
            diffuseColor.a *= viewOpacity / opacity;
            ${shoreline ? `
                // Cobertura de un solo píxel: estabiliza el contacto sin una franja difuminada.
                if(cameraPosition.y>=vWaterPosition.y && abs(vWaterPosition.y-shorelineSurface)<0.01) {
                    vec2 shoreCell=vWaterPosition.xz/shorelineGrid.zw;
                    if(all(greaterThanEqual(shoreCell,vec2(0.0))) && all(lessThanEqual(shoreCell,shorelineGrid.xy-1.0))) {
                        vec2 cell=min(floor(shoreCell),shorelineGrid.xy-2.0);
                        vec2 f=shoreCell-cell;
                        vec2 uv=(cell+0.5)/shorelineGrid.xy, texel=1.0/shorelineGrid.xy;
                        float a=texture2D(shorelineHeights,uv).r;
                        float b=texture2D(shorelineHeights,uv+vec2(texel.x,0.0)).r;
                        float c=texture2D(shorelineHeights,uv+vec2(0.0,texel.y)).r;
                        float d=texture2D(shorelineHeights,uv+texel).r;
                        float ground=f.x+f.y<=1.0 ? a+(b-a)*f.x+(c-a)*f.y
                            : d+(c-d)*(1.0-f.x)+(b-d)*(1.0-f.y);
                        // Separación vertical de 1 cm: no dejar fragmentos casi coplanares competir en profundidad.
                        float clearance=vWaterPosition.y-ground-0.01;
                        float pixelWidth=max(0.0001,fwidth(clearance));
                        diffuseColor.a*=clamp(clearance/pixelWidth,0.0,1.0);
                        if(diffuseColor.a<0.0001)discard;
                    }
                }
            ` : ''}
        `);
        if(shoreline)shader.fragmentShader='uniform sampler2D shorelineHeights;\nuniform vec4 shorelineGrid;\nuniform float shorelineSurface;\n'+shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
            #include <normal_fragment_maps>
            vec3 ripple = vec3(cos(waveA) * 0.035, 0.0, sin(waveB) * 0.03) * mix(1.0,1.6,waterImmersion);
            normal = normalize(normal + (viewMatrix * vec4(ripple, 0.0)).xyz);
        `);
    };
    material.customProgramCacheKey = () => 'water-waves-river-v17'+(shoreline?'-triangle-shore':'');
}
