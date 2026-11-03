import {waterTextureMotionGLSL} from './water-waves.js';

// Cristal celeste translúcido, con las mismas texturas y movimiento del agua.
export function createAltarCrystal(THREE,size,{texture=null,time={value:0},immersion={value:0}}={}) {
    const half=size/2,inset=size*.045,depth=size*.035;
    const inner=half-inset,positions=[],colors=[];
    const top=[[-inner,0,-inner],[inner,0,-inner],[inner,0,inner],[-inner,0,inner]];
    const edge=[[-half,-depth,-half],[half,-depth,-half],[half,-depth,half],[-half,-depth,half]];
    function face(corners,color) {
        for(const i of [0,2,1,0,3,2]){positions.push(...corners[i]);colors.push(...color);}
    }
    face(top,[.84,.96,1]);
    for(let i=0;i<4;i++){const next=(i+1)%4;face([edge[i],edge[next],top[next],top[i]],[.64,.9,1]);}
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const uv=[];
    for(let i=0;i<positions.length;i+=3)uv.push((positions[i]/size+.5)/(texture?.repeat.x||1),(positions[i+2]/size+.5)/(texture?.repeat.y||1));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const material=new THREE.MeshPhongMaterial({map:texture,color:0xb4edff,emissive:0x29677f,
        emissiveIntensity:.12,specular:0xe8ffff,shininess:110,flatShading:true,vertexColors:true,
        transparent:true,opacity:.62,depthWrite:false,side:THREE.DoubleSide});
    material.onBeforeCompile=shader=>{
        shader.uniforms.waterTime=time;shader.uniforms.waterImmersion=immersion;
        shader.vertexShader='varying vec3 vWaterPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterPosition=(modelMatrix*vec4(position,1.0)).xyz;');
        shader.fragmentShader='uniform float waterTime;\nuniform float waterImmersion;\nvarying vec3 vWaterPosition;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',waterTextureMotionGLSL+THREE.ShaderChunk.map_fragment.replaceAll('vMapUv','(vMapUv+waterUvOffset)'));
    };
    material.customProgramCacheKey=()=>'altar-crystal-water-v1';
    return new THREE.Mesh(geometry,material);
}
