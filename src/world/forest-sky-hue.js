import {FOREST_CUES} from '../content/forest-cues.js';

export const FOREST_SKY_HUE_START=42;
export const FOREST_SKY_HUE_PERIOD=18;
export const FOREST_HORIZON_HUE_DELAY=.65;
function hueFade(time) {
    // Acabar en cero suavemente: ni cielo ni horizonte cambian de tono de golpe.
    const u=Math.max(0,Math.min(1,(time-(FOREST_CUES[3]-2))/2));
    return 1-u**3*(u*(u*6-15)+10);
}
export function getForestHorizonHueShift(time) {
    return rawSkyHueShift(time-FOREST_HORIZON_HUE_DELAY)*hueFade(time);
}
// Arco corto por rojo/rosado: naranjo 30° → morado 300° (equivale a −60°).
export function getForestSkyHueShift(time) {
    return rawSkyHueShift(time)*hueFade(time);
}
function rawSkyHueShift(time) {
    const mark2=FOREST_CUES[2];
    if(time<FOREST_SKY_HUE_START)return 0;
    if(time<mark2) {
        const u=(time-FOREST_SKY_HUE_START)/(mark2-FOREST_SKY_HUE_START);
        return -.25*u*u*(3-2*u);
    }
    return -.25*(.5+.5*Math.cos((time-mark2)*2*Math.PI/FOREST_SKY_HUE_PERIOD));
}

// Solo el material del atardecer: conserva textura, brillo y transiciones del cielo.
export function applyForestSkyHue(material,uniforms) {
    const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
    material.onBeforeCompile=function(shader,renderer) {
        previous.call(this,shader,renderer);
        shader.uniforms.forestSkyHueShift=uniforms.heartDuskHueShift;
        shader.uniforms.forestSkyStrength=uniforms.heartStrength;
        shader.fragmentShader=`
            uniform float forestSkyHueShift,forestSkyStrength;
            vec3 forestSkyRgbToHsv(vec3 c) {
                float high=max(c.r,max(c.g,c.b)),low=min(c.r,min(c.g,c.b)),span=high-low,hue=0.;
                if(span>.00001) {
                    if(high==c.r)hue=(c.g-c.b)/span;
                    else if(high==c.g)hue=2.+(c.b-c.r)/span;
                    else hue=4.+(c.r-c.g)/span;
                    hue=fract(hue/6.+1.);
                }
                return vec3(hue,high>.00001?span/high:0.,high);
            }
            vec3 forestSkyHsvToRgb(vec3 c) {
                vec3 channels=abs(fract(c.xxx+vec3(0.,.666667,.333333))*6.-3.);
                return c.z*mix(vec3(1.),clamp(channels-1.,0.,1.),c.y);
            }
            ${shader.fragmentShader}`;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
            if(forestSkyStrength>.00001&&abs(forestSkyHueShift)>.00001) {
                vec3 hsv=forestSkyRgbToHsv(outgoingLight);hsv.x=fract(hsv.x+forestSkyHueShift);
                outgoingLight=mix(outgoingLight,forestSkyHsvToRgb(hsv),clamp(forestSkyStrength*2.,0.,1.));
            }
            #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>key+'-forest-dusk-hue-v1';
}
