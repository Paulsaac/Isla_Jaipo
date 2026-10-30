// Teñido ligero sobre materiales existentes; sin render targets ni postproceso.
export function createMateForestVisual() {
    const uniforms={mateTreeColor:{value:0},mateSkyColor:{value:0},mateTreeMotion:{value:0},mateTime:{value:0}};
    function update(state){uniforms.mateTreeColor.value=state.treeColor;uniforms.mateSkyColor.value=state.skyColor;
        uniforms.mateTreeMotion.value=state.treeMotion;uniforms.mateTime.value=state.clock;}
    function apply(material,mode){
        const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
        material.onBeforeCompile=function(shader,renderer){
            previous.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
            shader.fragmentShader=`uniform float mateTreeColor,mateSkyColor,mateTime;
                vec3 mateRgbToHsv(vec3 c){float hi=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b)),d=hi-lo,h=0.;
                    if(d>.00001){if(hi==c.r)h=(c.g-c.b)/d;else if(hi==c.g)h=2.+(c.b-c.r)/d;else h=4.+(c.r-c.g)/d;h=fract(h/6.+1.);}
                    return vec3(h,hi>.00001?d/hi:0.,hi);}
                vec3 mateHsvToRgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(0.,.666667,.333333))*6.-3.);
                    return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
                ${shader.fragmentShader}`;
            if(mode==='tree'){
                shader.vertexShader='uniform float mateTreeMotion,mateTime;\nvarying float vMateTreePhase;\n'+shader.vertexShader;
                shader.fragmentShader='varying float vMateTreePhase;\n'+shader.fragmentShader;
                shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
                    #include <begin_vertex>
                    vMateTreePhase=0.;
                    #ifdef USE_INSTANCING
                        vMateTreePhase=dot(instanceMatrix[3].xz,vec2(.071,.093));
                    #endif
                    float mateAnchor=smoothstep(.18,1.,uv.y);mateAnchor*=mateAnchor;
                `);
                // Desplazar después de instanceMatrix: ambos planos cruzados
                // de un árbol comparten dirección y siguen unidos.
                shader.vertexShader=shader.vertexShader.replace('mvPosition = modelViewMatrix * mvPosition;',`
                    mvPosition.xz+=vec2(sin(mateTime*.35+vMateTreePhase),cos(mateTime*.28+vMateTreePhase)*.35)*mateTreeMotion*mateAnchor;
                    mvPosition = modelViewMatrix * mvPosition;
                `);
            }
            shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
                ${mode==='tree'?`
                    if(mateTreeColor>.00001){
                        vec3 mateHsv=mateRgbToHsv(outgoingLight);
                        mateHsv.x=fract(mateHsv.x+.16*sin(mateTime*.09+vMateTreePhase)+.10);
                        outgoingLight=mix(outgoingLight,mateHsvToRgb(mateHsv),mateTreeColor);
                    }`:`
                    if(mateSkyColor>.00001){
                        vec3 mateHsv=mateRgbToHsv(outgoingLight);
                        // 5.4°→68.4°: rojo/naranjo a lima muy amarillo, nunca verde puro.
                        mateHsv.x=mix(.015,.19,.5-.5*cos(mateTime*6.283185307/36.));
                        mateHsv.y=clamp(mateHsv.y,.32,.85);
                        outgoingLight=mix(outgoingLight,mateHsvToRgb(mateHsv),mateSkyColor);
                    }`}
                #include <opaque_fragment>`);
        };
        material.customProgramCacheKey=()=>key+'-mate-forest-v1-'+mode;
    }
    return {uniforms,update,apply};
}
