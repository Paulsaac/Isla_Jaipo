// Ondas visuales en GPU: desplazan la textura y sus reflejos sin cambiar la física.
export function applyWaterWaves(THREE, material, time, currentField, unitSize, immersion = {value:0}, raisedCell = {value:new THREE.Vector4()}) {
    const flowTexture = new THREE.DataTexture(currentField.data, currentField.width, currentField.height, THREE.RGBAFormat);
    flowTexture.needsUpdate = true;
    flowTexture.magFilter = flowTexture.minFilter = THREE.NearestFilter;
    material.onBeforeCompile = shader => {
        shader.uniforms.waterTime = time;
        shader.uniforms.waterImmersion = immersion;
        shader.uniforms.raisedWaterCell = raisedCell;
        shader.uniforms.riverFlowMap = { value: flowTexture };
        shader.uniforms.riverMapSize = { value: new THREE.Vector2(currentField.width, currentField.height) };
        shader.uniforms.riverUnitSize = { value: unitSize };
        shader.vertexShader = 'varying vec3 vWaterPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
            '#include <begin_vertex>\nvWaterPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
        shader.fragmentShader = 'uniform float waterTime;\nuniform float waterImmersion;\nuniform vec4 raisedWaterCell;\nuniform sampler2D riverFlowMap;\nuniform vec2 riverMapSize;\nuniform float riverUnitSize;\nvarying vec3 vWaterPosition;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
            // Una sola superficie de agua dentro del altar, a su cota elevada.
            if(raisedWaterCell.z>0.0 && vWaterPosition.y<raisedWaterCell.w-0.01
                && all(lessThan(abs(vWaterPosition.xz-raisedWaterCell.xy),vec2(raisedWaterCell.z)))) discard;
            float waveA = vWaterPosition.x * 0.65 + vWaterPosition.z * 0.3 + waterTime * 0.75;
            float waveB = vWaterPosition.x * -0.25 + vWaterPosition.z * 0.8 - waterTime * 0.55;
            vec2 waterUvOffset = vec2(sin(waveA), cos(waveB)) * 0.06 * mix(1.0,1.8,waterImmersion);
            ${THREE.ShaderChunk.map_fragment.replaceAll('vMapUv', '(vMapUv + waterUvOffset)')}
            #ifdef USE_MAP
                vec2 fieldUv = (vWaterPosition.xz / riverUnitSize + 0.5) / riverMapSize;
                vec3 flowSample = texture2D(riverFlowMap, fieldUv).rgb;
                vec2 flowDirection = (flowSample.rg * 2.0 - 1.0) * vec2(1.0, -1.0);
                // Dos fases fundidas hacen avanzar la textura sin saltos al reiniciar.
                float flowPhase = fract(waterTime * 0.588);
                float secondPhase = fract(waterTime * 0.588 + 0.5);
                float flowBlend = abs(flowPhase * 2.0 - 1.0);
                vec2 baseUv = vMapUv + waterUvOffset * 0.6;
                vec4 currentA = texture2D(map, baseUv - flowDirection * (flowPhase - 0.5) * 1.6);
                vec4 currentB = texture2D(map, baseUv - flowDirection * (secondPhase - 0.5) * 1.6);
                vec4 currentTexel = mix(currentA, currentB, flowBlend);
                vec4 riverColor = vec4(diffuse, opacity) * currentTexel;
                diffuseColor = mix(diffuseColor, riverColor, flowSample.b);
            #endif
            float waterLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            diffuseColor.rgb = mix(vec3(waterLuminance), diffuseColor.rgb, 0.7225);
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
            #include <normal_fragment_maps>
            vec3 ripple = vec3(cos(waveA) * 0.035, 0.0, sin(waveB) * 0.03) * mix(1.0,1.6,waterImmersion);
            normal = normalize(normal + (viewMatrix * vec4(ripple, 0.0)).xyz);
        `);
    };
    material.customProgramCacheKey = () => 'water-waves-river-v6';
}
