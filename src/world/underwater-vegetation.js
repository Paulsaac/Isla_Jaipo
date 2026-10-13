import { createInstanceSectors } from './instance-sectors.js';

export function createUnderwaterVegetation(THREE, loader, plants, sampleHeight, unitSize, surfaceHeight, time) {
    const variants=[
        ['SEA_ALGA','alga1',0.65,1.6],['SEA_ALGA','alga2',0.75,1.5],
        ['SEA_CORAL','coral1',1.1,0.65],['SEA_CORAL','coral2',1.0,0.7],
        ['SEA_GRASS','seaweed1',0.8,0.65],['SEA_GRASS','seaweed2',0.75,0.7],['SEA_GRASS','seaweed3',0.85,0.6]
    ].map(([type,file,width,height])=>[type,file,
        width*(type==='SEA_ALGA'?2:4),height*(type==='SEA_ALGA'?6:4)]);
    const sources=variants.map(([type,file,width,height],variant)=>{
        const choices=variants.map((v,i)=>v[0]===type?i:-1).filter(i=>i>=0);
        const positions=plants.filter(p=>p.type===type&&choices[(p.x*31+p.z*17)%choices.length]===variant);
        const texture=loader.load(`./imagenes/Sprites/vegetacion%20under/${file}.png`);
        texture.colorSpace=THREE.SRGBColorSpace;
        texture.magFilter=texture.minFilter=THREE.NearestFilter;
        const material=new THREE.MeshPhongMaterial({map:texture,transparent:true,alphaTest:0.45,
            side:THREE.DoubleSide,shininess:0,color:0xb7dae2,emissive:0x073947,emissiveIntensity:0.12});
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
        const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(width,height),material,positions.length*2);
        mesh.name=`underwater-${file}`;
        const transform=new THREE.Object3D();
        let count=0;
        for(const p of positions){
            const x=p.x*unitSize,z=p.z*unitSize,bottom=sampleHeight(x,z);
            const scale=0.8+((p.x*13+p.z*7)%19)/50;
            const fit=Math.min(scale,(surfaceHeight-bottom-0.12)/height);
            if(fit<=0.15) continue;
            transform.position.set(x,bottom+height*fit/2-0.025,z);
            transform.scale.set(scale,fit,scale);
            const angle=((p.x*11+p.z*23)%100)/100*Math.PI;
            for(const turn of [angle,angle+Math.PI/2]){
                transform.rotation.y=turn;
                transform.updateMatrix();
                mesh.setMatrixAt(count++,transform.matrix);
            }
        }
        mesh.count=count;
        return mesh;
    });
    const sectors=createInstanceSectors(THREE,sources,32,0.2);
    sectors.group.name='underwater-vegetation-sectors';
    return sectors;
}
