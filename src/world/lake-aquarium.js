// Paisaje acuático visible tras el ventanal. Comparte los sprites submarinos originales.
export async function createLakeAquarium(THREE,loader,layout,textures,roomOrigin) {
    const {width,depth,height,frontZ}=layout,half=width/2;
    const group=new THREE.Group();group.name='lake-room-aquarium';group.position.z=frontZ-depth/2;
    const time={value:0},waterColor={value:new THREE.Color(0x0c526c)};
    const front={value:roomOrigin.z+frontZ};
    let seed=376283;
    function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    const bedHeight=(x,z)=>.20+.12*Math.sin(x*.65+z*.31)+.06*Math.cos(z*.9-x*.4);
    function waterTint(material,{sway=0,caustics=false}={}) {
        material.fog=false;
        material.onBeforeCompile=shader=>{
            Object.assign(shader.uniforms,{aquariumTime:time,aquariumColor:waterColor,aquariumFront:front,aquariumSway:{value:sway}});
            shader.vertexShader='uniform float aquariumTime;uniform float aquariumSway;varying vec3 aquariumPosition;\n'+shader.vertexShader;
            shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
                #ifdef USE_INSTANCING
                    float aquariumPhase=dot(instanceMatrix[3].xz,vec2(.73,.41));
                    transformed.x+=sin(aquariumTime*.7+aquariumPhase)*aquariumSway*uv.y*uv.y;
                    transformed.z+=cos(aquariumTime*.53+aquariumPhase)*aquariumSway*.35*uv.y*uv.y;
                #endif`);
            shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
                vec4 aquariumWorld=vec4(transformed,1.0);
                #ifdef USE_INSTANCING
                    aquariumWorld=instanceMatrix*aquariumWorld;
                #endif
                aquariumPosition=(modelMatrix*aquariumWorld).xyz;`);
            shader.fragmentShader='uniform float aquariumTime;uniform float aquariumFront;uniform vec3 aquariumColor;varying vec3 aquariumPosition;\n'+shader.fragmentShader;
            shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',`
                float aquariumDepth=max(0.0,aquariumFront-aquariumPosition.z);
                ${caustics?`vec2 aquariumUv=aquariumPosition.xz*1.1;
                    float aquariumRipple=sin(aquariumUv.x*3.0+sin(aquariumUv.y*2.1+aquariumTime*.32))
                        *sin(aquariumUv.y*2.4-aquariumTime*.28);
                    gl_FragColor.rgb+=vec3(.025,.07,.075)*pow(max(0.0,aquariumRipple),5.0);`:''}
                gl_FragColor.rgb=mix(gl_FragColor.rgb,aquariumColor,1.0-exp(-aquariumDepth*.085));
                #include <tonemapping_fragment>`);
        };
        material.customProgramCacheKey=()=>`lake-aquarium-v1-${sway>0?'plant':'solid'}-${caustics?'caustics':'depth'}`;
        return material;
    }
    // Paredes lejanas y superficie azul: el tinte aumenta con la profundidad del acuario.
    const water=new THREE.ShaderMaterial({fog:false,side:THREE.DoubleSide,
        uniforms:{aquariumTime:time,waterBottom:{value:new THREE.Color(0x073247)},waterTop:{value:new THREE.Color(0x167a96)},tankHeight:{value:height}},
        vertexShader:'varying vec3 tankPosition;void main(){tankPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:`uniform float aquariumTime;uniform vec3 waterBottom;uniform vec3 waterTop;uniform float tankHeight;varying vec3 tankPosition;
            void main(){float t=clamp(tankPosition.y/tankHeight,0.0,1.0);
                float ripple=sin(tankPosition.x*.9+aquariumTime*.17)*sin(tankPosition.z*.7-aquariumTime*.11);
                gl_FragColor=vec4(mix(waterBottom,waterTop,t)*(.94+ripple*.025),1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`});
    function waterPlane(w,h,x,y,z,rx=0,ry=0) {
        const geometry=new THREE.PlaneGeometry(w,h);geometry.rotateX(rx);geometry.rotateY(ry);geometry.translate(x,y,z);
        const mesh=new THREE.Mesh(geometry,water);mesh.name='aquarium-water-boundary';group.add(mesh);
    }
    waterPlane(width,height,0,height/2,-depth/2);
    waterPlane(depth,height,-half,height/2,0,0,Math.PI/2);
    waterPlane(depth,height,half,height/2,0,0,Math.PI/2);
    waterPlane(width,depth,0,height,0,Math.PI/2);
    const sand=textures.sand.clone();sand.wrapS=sand.wrapT=THREE.RepeatWrapping;sand.repeat.set(5,5);sand.needsUpdate=true;
    const sandMaterial=waterTint(new THREE.MeshPhongMaterial({map:sand,color:0xb8c5ad,emissive:0x527b80,emissiveMap:sand,emissiveIntensity:.5,shininess:0}),{caustics:true});
    const floorGeometry=new THREE.PlaneGeometry(width,depth,30,30);floorGeometry.rotateX(-Math.PI/2);
    const vertices=floorGeometry.attributes.position;
    for(let i=0;i<vertices.count;i++)vertices.setY(i,bedHeight(vertices.getX(i),vertices.getZ(i)));
    floorGeometry.computeVertexNormals();
    const floor=new THREE.Mesh(floorGeometry,sandMaterial);floor.name='aquarium-sand-bed';group.add(floor);
    const rockMaterial=waterTint(new THREE.MeshPhongMaterial({map:textures.rock,color:0x8bafac,emissive:0x264e5b,emissiveIntensity:.45,flatShading:true,shininess:8}),{caustics:true});
    for(let i=0;i<11;i++) {
        const x=(random()-.5)*(width-3),z=(random()-.5)*(depth-3),size=.25+random()*.65;
        const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(1,0),rockMaterial);
        rock.name='aquarium-seabed-rock';rock.scale.set(size*1.35,size*.58,size);rock.rotation.set(random()*.4,random()*Math.PI,random()*.4);
        rock.position.set(x,bedHeight(x,z)+size*.25,z);group.add(rock);
    }
    const variants=[
        ['alga1',1.3,4.2,12,.08],['alga2',1.5,4,10,.08],
        ['coral1',2.2,1.3,11,.008],['coral2',2,1.4,9,.008],
        ['seaweed1',1.6,1.3,18,.055],['seaweed2',1.5,1.4,16,.055],['seaweed3',1.7,1.2,18,.055]
    ];
    const maps=await Promise.all(variants.map(([file])=>loader.loadAsync(`./imagenes/Sprites/vegetacion%20under/${file}.png`)));
    let plantCount=0;
    for(const [index,[file,w,h,count,sway]] of variants.entries()) {
        const map=maps[index];map.colorSpace=THREE.SRGBColorSpace;map.magFilter=map.minFilter=THREE.NearestFilter;
        const material=waterTint(new THREE.MeshPhongMaterial({map,alphaTest:.45,transparent:false,
            side:THREE.DoubleSide,forceSinglePass:true,color:0xa4dbc9,emissive:0x286471,emissiveMap:map,emissiveIntensity:.7,shininess:0}),{sway});
        const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(w,h),material,count*2);mesh.name=`aquarium-${file}`;
        const transform=new THREE.Object3D();let instance=0;
        for(let i=0;i<count;i++) {
            const x=(random()-.5)*(width-3),z=(random()-.5)*(depth-3);
            const scale=.65+random()*.4,bottom=bedHeight(x,z),tall=Math.min(scale,(height-bottom-.2)/h);
            transform.position.set(x,bottom+h*tall/2-.025,z);transform.scale.set(scale,tall,scale);
            const angle=random()*Math.PI;
            for(const turn of [angle,angle+Math.PI/2]){transform.rotation.y=turn;transform.updateMatrix();mesh.setMatrixAt(instance++,transform.matrix);}
        }
        plantCount+=count;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
    }
    return {group,plantCount,layout:{width,depth,height},update(delta){time.value+=delta;},get time(){return time.value;}};
}
