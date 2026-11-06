export const SURFACE_FOG_DENSITY_SCALE = 0.5;
const PLAYER_VIEW_CLEAR_DISTANCE = 150;
const PLAYER_VIEW_FOG_DISTANCE = 400;

// Bruma circular que se acerca al subir a la meseta; niebla submarina independiente.
export function createHorizonFog(THREE, fog) {
    const start = {value:0};
    const skyStrength = {value:0};
    const prepared = new WeakSet();
    const mountainBuildingMaterials = new WeakSet();
    const offshoreCircle={value:new THREE.Vector4(0,0,1000000,300)},offshoreStrength={value:0};
    const mountainMask={value:null},mountainGrid={value:new THREE.Vector3(1,1,1)},mountainStrength={value:0};
    const viewStrength={value:0};
    let islandStart=Infinity;
    let coastalRadius=1000000,coastalFade=300;
    const fadeStart=150/SURFACE_FOG_DENSITY_SCALE,fadeEnd=210/SURFACE_FOG_DENSITY_SCALE;
    function configureIsland(floorMap,unitSize) {
        const height=floorMap.length,width=floorMap[0].length;
        // Círculo exacto, centrado en el mapa y alejado de toda su costa.
        offshoreCircle.value.set((width-1)*unitSize/2,(height-1)*unitSize/2,
            Math.max(width,height)*unitSize,300);
        coastalRadius=offshoreCircle.value.z;coastalFade=offshoreCircle.value.w;
        islandStart=Math.hypot(width*unitSize,height*unitSize)+64;
    }
    function configureMountain(mask,width,height,unitSize) {
        const data=new Uint8Array(width*height);
        for(let z=0;z<height;z++)for(let x=0;x<width;x++)data[z*width+x]=mask[z][x]?255:0;
        mountainMask.value?.dispose();
        const texture=new THREE.DataTexture(data,width,height,THREE.RedFormat);
        texture.minFilter=texture.magFilter=THREE.LinearFilter;
        texture.generateMipmaps=false;texture.unpackAlignment=1;texture.needsUpdate=true;
        mountainMask.value=texture;mountainGrid.value.set(width,height,unitSize);
    }
    function registerMountainBuilding(root,interior) {
        function visit(object) {
            if(object===interior)return;
            if(object.isMesh) {
                const materials=Array.isArray(object.material)?object.material:[object.material];
                for(const material of materials) {
                    if(!(material.isMeshPhongMaterial||material.isMeshStandardMaterial||material.isMeshBasicMaterial))continue;
                    if(!material.fog){material.fog=true;material.needsUpdate=true;}
                    mountainBuildingMaterials.add(material);
                    object.userData.mountainFogExterior=true;
                }
            }
            for(const child of object.children)visit(child);
        }
        visit(root);
    }
    function updateAltitude(eyeHeight,plateauEyeHeight) {
        // Conservar en la meseta el alcance que tenía la vista a Y=90.3.
        const heightBlend=THREE.MathUtils.smoothstep(Math.min(eyeHeight,90.3),plateauEyeHeight*.5,plateauEyeHeight);
        offshoreCircle.value.z=THREE.MathUtils.lerp(coastalRadius,coastalRadius*.35,heightBlend);
        offshoreCircle.value.w=THREE.MathUtils.lerp(coastalFade,coastalFade*.5,heightBlend);
        mountainStrength.value=1-THREE.MathUtils.smoothstep(eyeHeight,plateauEyeHeight*.1,plateauEyeHeight*.75);
        viewStrength.value=mountainStrength.value;
    }
    function applySky(materials) {
        for (const material of materials) {
            const previous = material.onBeforeCompile;
            const key = material.customProgramCacheKey();
            material.onBeforeCompile = function(shader, renderer) {
                previous.call(this, shader, renderer);
                shader.uniforms.horizonSkyColor = {value:fog.color};
                shader.uniforms.horizonSkyStrength = skyStrength;
                shader.vertexShader = 'varying vec3 horizonSkyDirection;\n'+shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
                    '#include <begin_vertex>\nhorizonSkyDirection=position;');
                shader.fragmentShader = `varying vec3 horizonSkyDirection;
                    uniform vec3 horizonSkyColor;
                    uniform float horizonSkyStrength;\n`+shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace('#include <tonemapping_fragment>', `
                    float horizonBand=normalize(horizonSkyDirection).y/${(0.025/SURFACE_FOG_DENSITY_SCALE).toFixed(8)};
                    // En el horizonte exacto, cielo y mar comparten color; la
                    // banda más ancha devuelve gradualmente la textura del cielo.
                    float horizonHaze=exp(-horizonBand*horizonBand)*horizonSkyStrength;
                    gl_FragColor.rgb=mix(gl_FragColor.rgb,horizonSkyColor,horizonHaze);
                    #include <tonemapping_fragment>`);
            };
            material.customProgramCacheKey = () => `${key}|horizon-sky-soft-v3`;
        }
    }
    function apply(root) {
        root.traverse(object => {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                if (!material?.fog || prepared.has(material)) continue;
                prepared.add(material);
                const previous = material.onBeforeCompile;
                const key = material.customProgramCacheKey();
                const mountainSurface=object.isMesh&&material.blending===THREE.NormalBlending
                    &&(material.isMeshPhongMaterial||material.isMeshStandardMaterial||material.isMeshBasicMaterial);
                const mountainBuilding=mountainBuildingMaterials.has(material);
                material.onBeforeCompile = function(shader, renderer) {
                    previous.call(this, shader, renderer);
                    if (!shader.fragmentShader.includes('#include <fog_pars_fragment>')) return;
                    shader.uniforms.horizonFogStart = start;
                    shader.uniforms.horizonOffshoreCircle = offshoreCircle;
                    shader.uniforms.horizonOffshoreStrength = offshoreStrength;
                    shader.uniforms.horizonViewStrength = viewStrength;
                    shader.vertexShader='varying vec3 horizonWorldPoint;\n'+shader.vertexShader;
                    shader.vertexShader=shader.vertexShader.replace('#include <fog_vertex>', `
                        vec4 horizonWorldPosition=vec4(position,1.0);
                        #ifdef USE_INSTANCING
                            horizonWorldPosition=instanceMatrix*horizonWorldPosition;
                        #endif
                        horizonWorldPoint=(modelMatrix*horizonWorldPosition).xyz;
                        #include <fog_vertex>`);
                    // También cubre shaders que expanden o personalizan el bloque de niebla.
                    shader.fragmentShader = shader.fragmentShader
                        .replaceAll('#include <fog_fragment>', THREE.ShaderChunk.fog_fragment)
                        .replace(/\bvFogDepth\b/g, 'horizonFogDepth(vFogDepth)')
                        .replace('#include <fog_pars_fragment>', `${THREE.ShaderChunk.fog_pars_fragment}
                            #ifdef USE_FOG
                                uniform float horizonFogStart;
                                uniform vec4 horizonOffshoreCircle;
                                uniform float horizonOffshoreStrength;
                                uniform float horizonViewStrength;
                                varying vec3 horizonWorldPoint;
                                float horizonFogDepth(float depth) {
                                    float offshore=0.0,playerFog=0.0;
                                    if(horizonOffshoreStrength>0.0001) {
                                        float radius=length(horizonWorldPoint.xz-horizonOffshoreCircle.xy);
                                        // Continuar el fundido más allá de la banda, sin un tope brusco.
                                        offshore=max((radius-horizonOffshoreCircle.z)/horizonOffshoreCircle.w,0.0)
                                            *300.0*horizonOffshoreStrength;
                                        // Alcance radial desde el jugador en las zonas bajas.
                                        float playerDistance=distance(cameraPosition,horizonWorldPoint);
                                        playerFog=max((playerDistance-${PLAYER_VIEW_CLEAR_DISTANCE.toFixed(1)})/${(PLAYER_VIEW_FOG_DISTANCE-PLAYER_VIEW_CLEAR_DISTANCE).toFixed(1)},0.0)
                                            *${(300/SURFACE_FOG_DENSITY_SCALE).toFixed(1)}*horizonViewStrength*horizonOffshoreStrength;
                                    }
                                    return max(max(0.0,depth-horizonFogStart),max(offshore,playerFog));
                                }
                            #endif`);
                    if(mountainSurface) {
                        shader.uniforms.horizonMountainMask=mountainMask;
                        shader.uniforms.horizonMountainGrid=mountainGrid;
                        shader.uniforms.horizonMountainStrength=mountainStrength;
                        shader.fragmentShader=`uniform sampler2D horizonMountainMask;
                            uniform vec3 horizonMountainGrid;
                            uniform float horizonMountainStrength;\n`+shader.fragmentShader;
                        // El terreno ya calcula el borde irregular de nieve para sus texturas.
                        // Reutilizar esa cobertura evita velar las laderas marrones.
                        const snowRegion=shader.uniforms.terrainVisibilityDistance ? `
                            #ifdef USE_MAP
                                float mountainSnow=clamp(snowCoverage,0.0,1.0);
                            #else
                                float mountainSnow=smoothstep(94.0,104.0,horizonWorldPoint.y);
                            #endif` : 'float mountainSnow=smoothstep(94.0,104.0,horizonWorldPoint.y);';
                        shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>', `
                            #ifdef USE_FOG
                                float mountainObserver=horizonMountainStrength*horizonOffshoreStrength;
                                if(mountainObserver>0.0001&&horizonWorldPoint.y>50.0) {
                                    vec2 mountainUv=(horizonWorldPoint.xz/horizonMountainGrid.z+0.5)/horizonMountainGrid.xy;
                                    if(all(greaterThanEqual(mountainUv,vec2(0.0)))&&all(lessThanEqual(mountainUv,vec2(1.0)))) {
                                        float mountainArea=${mountainBuilding?'1.0':'texture2D(horizonMountainMask,mountainUv).r'};
                                        ${snowRegion}
                                        float mountainVeil=0.45*mountainObserver*mountainArea*mountainSnow
                                            *smoothstep(50.0,300.0,distance(cameraPosition,horizonWorldPoint));
                                        gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,mountainVeil);
                                    }
                                }
                            #endif
                            #include <dithering_fragment>`);
                    }
                    if(mountainBuilding||mountainSurface) {
                        // Retirar también la geometría opaca cuando la misma bruma
                        // ya ocultó el terreno: no dejar fachadas, vidrios o lentes flotando.
                        // Los muros originales están instanciados fuera de los grupos
                        // de edificios: reconocerlos por su posición en la montaña.
                        shader.fragmentShader=shader.fragmentShader.replace('void main() {', `void main() {
                            #ifdef USE_FOG
                                if(horizonFogDepth(0.0)>=${fadeEnd.toFixed(1)}) {
                                    ${mountainBuilding?'discard;':`
                                    if(horizonWorldPoint.y>50.0) {
                                        vec2 mountainClipUv=(horizonWorldPoint.xz/horizonMountainGrid.z+0.5)/horizonMountainGrid.xy;
                                        if(all(greaterThanEqual(mountainClipUv,vec2(0.0)))&&all(lessThanEqual(mountainClipUv,vec2(1.0)))
                                            &&texture2D(horizonMountainMask,mountainClipUv).r>0.5)discard;
                                    }`}
                                }
                            #endif`);
                    }
                    if(shader.uniforms.terrainVisibilityDistance) {
                        // El alcance ampliado del relieve no debe rescatar islotes
                        // rocosos que ya están dentro de la bruma del mar exterior.
                        shader.fragmentShader=shader.fragmentShader.replace('void main() {', `void main() {
                            #ifdef USE_FOG
                                if(horizonFogDepth(0.0)>=${fadeEnd.toFixed(1)})discard;
                            #endif`);
                        shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>', `
                            #ifdef USE_FOG
                                diffuseColor.a*=1.0-smoothstep(${fadeStart.toFixed(1)},${fadeEnd.toFixed(1)},horizonFogDepth(0.0));
                            #endif
                            #include <alphatest_fragment>`);
                    }
                    if(shader.uniforms.shorelineHeights) {
                        // Al ocultar un islote, el recorte costero del agua no debe
                        // dejar su silueta como un hueco en la bruma del océano.
                        shader.fragmentShader=shader.fragmentShader.replace(
                            'if(cameraPosition.y>=vWaterPosition.y && abs(vWaterPosition.y-shorelineSurface)<0.01)',
                            `if(horizonFogDepth(0.0)<${fadeEnd.toFixed(1)} && cameraPosition.y>=vWaterPosition.y && abs(vWaterPosition.y-shorelineSurface)<0.01)`);
                    }
                };
                material.customProgramCacheKey = () => `${key}|horizon-fog-circle-soft-v7${mountainSurface?'-snow-peak':''}${mountainBuilding?'-mountain-building':''}`;
            }
        });
    }
    return {surfaceStart:0, apply, applySky, configureIsland, configureMountain, registerMountainBuilding, updateAltitude, setStart(value) {
        start.value = Math.max(0, value);
        fog.horizonStart = start.value;
        skyStrength.value = fog.density > 0 ? Math.min(1,start.value/64) : 0;
        offshoreStrength.value = fog.density > 0 ? Math.min(1,start.value/islandStart) : 0;
        fog.viewStart=PLAYER_VIEW_CLEAR_DISTANCE;
        fog.viewDepthScale=(300/SURFACE_FOG_DENSITY_SCALE)/(PLAYER_VIEW_FOG_DISTANCE-PLAYER_VIEW_CLEAR_DISTANCE)
            *viewStrength.value*offshoreStrength.value;
    }};
}
