export const SKY_CRATER_RADIUS=2.4;
export const SKY_CRATER_DEPTH=.78;
export const SKY_CRATER_RIM=.50;

export function skyCraterOffset(x,z,cx,cz) {
    const r=Math.hypot(x-cx,z-cz)/SKY_CRATER_RADIUS;
    if(r>=1.2)return 0;
    const t=Math.max(0,Math.min(1,(r-1)/.2)),fade=1-t*t*(3-2*t);
    const bowl=-SKY_CRATER_DEPTH*Math.pow(Math.max(0,1-r*r),2);
    const angle=Math.atan2(z-cz,x-cx),roughness=1+.10*Math.sin(angle*7)+.06*Math.cos(angle*11);
    const rim=SKY_CRATER_RIM*roughness*Math.exp(-Math.pow((r-.85)/.12,2))*fade;
    return bowl+rim;
}

// Misma arena y UV: cuenco profundo y borde de arena levantada al impactar.
export function createSkyHeartTerrain(THREE) {
    const shape={value:new THREE.Vector4(0,0,SKY_CRATER_RADIUS,0)};
    let sectors=null,samples=null,unitSize=2,formed=false;
    return {
        shape,
        setTerrain(group,surface,unit){sectors=group;samples=surface;unitSize=unit;},
        applyMaterial(material){
            const compile=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
            material.onBeforeCompile=function(shader,...args){
                compile.call(this,shader,...args);shader.uniforms.skyCraterShape=shape;
                const declaration='uniform vec4 skyCraterShape;\n';
                shader.vertexShader=declaration+shader.vertexShader;
                shader.vertexShader=shader.vertexShader.replace('vTerrainHeight = vTerrainPosition.y;',`vTerrainHeight = vTerrainPosition.y;
                    float craterR=length(vTerrainPosition.xz-skyCraterShape.xy)/skyCraterShape.z;
                    float craterOffset=-skyCraterShape.w*pow(max(0.,1.-craterR*craterR),2.);
                    vec2 craterDelta=vTerrainPosition.xz-skyCraterShape.xy;
                    float craterAngle=atan(craterDelta.y,craterDelta.x+.000001);
                    float craterRoughness=1.+.10*sin(craterAngle*7.)+.06*cos(craterAngle*11.);
                    craterOffset+=.50*craterRoughness*step(.01,skyCraterShape.w)*exp(-pow((craterR-.85)/.12,2.))*(1.-smoothstep(1.,1.2,craterR));
                    // La profundidad no cambia arena seca por arena mojada en el shader.
                    vTerrainHeight-=craterOffset;`);
                shader.fragmentShader=declaration+shader.fragmentShader;
                shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
                    float craterR=length(vTerrainPosition.xz-skyCraterShape.xy)/skyCraterShape.z;
                    float burn=(1.-smoothstep(.95,1.2,craterR))*step(.01,skyCraterShape.w);
                    diffuseColor.rgb*=mix(1.,mix(.30,.65,clamp(craterR,0.,1.)),burn);`);
            };
            material.customProgramCacheKey=()=>key()+'-sky-crater-terrain-v1';
        },
        impact(center){
            if(formed||!samples||!sectors)return false;
            const {positions,verticesW,segmentsW,segmentsH,subdivisions}=samples;
            const step=unitSize/subdivisions,cx=center.x,cz=center.z,radius=SKY_CRATER_RADIUS*1.2;
            for(let z=Math.max(0,Math.floor((cz-radius)/step));z<=Math.min(segmentsH,Math.ceil((cz+radius)/step));z++)
                for(let x=Math.max(0,Math.floor((cx-radius)/step));x<=Math.min(segmentsW,Math.ceil((cx+radius)/step));x++){
                    const i=(z*verticesW+x)*3;positions[i+1]+=skyCraterOffset(positions[i],positions[i+2],cx,cz);
                }
            for(const sector of sectors.children){
                const g=sector.geometry,b=g.boundingBox;
                if(b.max.x<cx-radius||b.min.x>cx+radius||b.max.z<cz-radius||b.min.z>cz+radius)continue;
                const p=g.attributes.position;let changed=false;
                for(let i=0;i<p.count;i++){
                    const offset=skyCraterOffset(p.getX(i),p.getZ(i),cx,cz);
                    if(offset!==0){p.setY(i,p.getY(i)+offset);changed=true;}
                }
                if(changed){
                    const previousNormals=g.attributes.normal.array.slice();
                    p.needsUpdate=true;g.computeVertexNormals();
                    // Conservar las normales de las costuras originales y del terreno no afectado.
                    const normals=g.attributes.normal.array;
                    for(let i=0;i<p.count;i++)if(Math.hypot(p.getX(i)-cx,p.getZ(i)-cz)>radius+step*2)
                        normals.set(previousNormals.subarray(i*3,i*3+3),i*3);
                    g.computeBoundingBox();g.computeBoundingSphere();
                }
            }
            shape.value.set(cx,cz,SKY_CRATER_RADIUS,SKY_CRATER_DEPTH);formed=true;return true;
        },
        get formed(){return formed;}
    };
}
