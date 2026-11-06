import { createUnderwaterPlantStream } from './underwater-plant-stream.js';

export async function createUnderwaterVegetation(THREE, loader, plants, sampleHeight, unitSize, surfaceHeight, time) {
    const variants=[
        ['SEA_ALGA','alga1',0.65,1.6],['SEA_ALGA','alga2',0.75,1.5],
        ['SEA_CORAL','coral1',1.1,0.65],['SEA_CORAL','coral2',1.0,0.7],
        ['SEA_GRASS','seaweed1',0.8,0.65],['SEA_GRASS','seaweed2',0.75,0.7],['SEA_GRASS','seaweed3',0.85,0.6]
    ].map(([type,file,width,height])=>[type,file,
        width*(type==='SEA_ALGA'?2:4),height*(type==='SEA_ALGA'?6:4)]);
    // Compartir siete recursos; las matrices se construyen después por cercanía.
    const textures = await Promise.all(variants.map(([,file])=>loader.loadAsync(`./imagenes/Sprites/vegetacion%20under/${file}.png`)));
    const group = new THREE.Group();
    group.name = 'underwater-vegetation-sectors';
    const entries = [];
    for (const [variant,[type,file,width,height]] of variants.entries()) {
        await new Promise(resolve=>requestAnimationFrame(resolve));
        const choices=variants.map((v,i)=>v[0]===type?i:-1).filter(i=>i>=0);
        const positions=plants.filter(p=>p.type===type&&choices[(p.x*31+p.z*17)%choices.length]===variant);
        const texture=textures[variant];
        texture.colorSpace=THREE.SRGBColorSpace;
        texture.magFilter=texture.minFilter=THREE.NearestFilter;
        const material=new THREE.MeshPhongMaterial({map:texture,transparent:false,alphaTest:0.45,
            side:THREE.DoubleSide,forceSinglePass:true,shininess:0,color:0xb7dae2,emissive:0x073947,emissiveIntensity:0.12});
        material.onBeforeCompile=shader=>{
            shader.uniforms.currentTime=time;
            shader.vertexShader='uniform float currentTime;\n'+shader.vertexShader;
            shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
                #include <begin_vertex>
                #ifdef USE_INSTANCING
                    vec2 root=instanceMatrix[3].xz;
                    float phase=dot(root,vec2(0.13,0.19));
                    float speed=0.5+0.25*fract(sin(phase)*43758.5453);
                    float sway=sin(currentTime*speed+phase)*0.07+sin(currentTime*speed*1.4+phase)*0.025;
                    transformed.xz+=vec2(1.0,0.35)*sway*uv.y*uv.y;
                #endif`);
        };
        material.customProgramCacheKey=()=> 'underwater-current-v1';
        const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(width,height),material,256);
        mesh.name=`underwater-${file}`;
        entries.push({mesh,positions,width,height});
        group.add(mesh);
    }
    return {group,...await createUnderwaterPlantStream(THREE,entries,sampleHeight,unitSize,surfaceHeight)};
}
