import {FOREST_CUES} from '../content/forest-cues.js';
import {UNIT_SIZE} from '../config.js';
import {TREE_MOTION_GLSL} from './tree-motion.js';
import {FOREST_LIGHT_BEAT_OFFSET} from './forest-light-pulse.js';

export const FOREST_TIP_BPM=46;
export const FOREST_TIP_PERIOD=60/FOREST_TIP_BPM;
export const FOREST_TIP_TILE_SIZE=10;
export function getForestTipPulse(time) {
    const clock=(time-FOREST_LIGHT_BEAT_OFFSET)/FOREST_TIP_PERIOD;
    return 1-(clock-Math.floor(clock));
}
// Una selección por zona; el relevo dura un pulso y nunca concentra más de dos.
export function getForestTipSelection(time,count,offset) {
    const clock=(time-FOREST_CUES[2])/(FOREST_TIP_PERIOD*8)+offset;
    const epoch=Math.floor(clock),phase=clock-epoch;
    const u=Math.min(1,phase*8),blend=u*u*(3-2*u);
    const wrap=n=>((n%count)+count)%count;
    return {previous:wrap(epoch-1),current:wrap(epoch),blend};
}
function findTip(image) {
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    for(let y=0;y<canvas.height;y++) {
        let sum=0,count=0;
        for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>=128){sum+=x+.5;count++;}
        if(count)return [sum/count/canvas.width,1-(y+.5)/canvas.height];
    }
    return [.5,1];
}

// Un solo dibujo de puntos: sin una luz GPU por árbol ni animación de matrices CPU.
export function createForestTipGlows(THREE,trees,windTime,vision,visibility={value:1},random=Math.random) {
    const records=[],tiles=new Map(),matrix=new THREE.Matrix4();
    trees.forEach((mesh,index)=>{
        const tip=findTip(mesh.material.map.image),w=mesh.geometry.parameters.width,h=mesh.geometry.parameters.height;
        // Dos planos cruzados por árbol; una sola luz en la punta del primer sprite.
        for(let i=0;i<mesh.count;i+=2) {
            mesh.getMatrixAt(i,matrix);
            const origin=new THREE.Vector3().setFromMatrixPosition(matrix);
            const corners=[[-w/2,h/2,0],[w/2,h/2,0],[-w/2,-h/2,0],[w/2,-h/2,0]]
                .map(p=>new THREE.Vector3(...p).applyMatrix4(matrix).toArray());
            const record={origin:origin.toArray(),corners,tip,wind:[.132,.65+index*.11,index*1.73]};
            const key=`${Math.floor(origin.x/FOREST_TIP_TILE_SIZE)},${Math.floor(origin.z/FOREST_TIP_TILE_SIZE)}`;
            if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push(record);records.push(record);
        }
    });
    for(const tile of tiles.values()) {
        for(let i=tile.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[tile[i],tile[j]]=[tile[j],tile[i]];}
        const offset=random();tile.forEach((record,rank)=>record.selection=[rank,tile.length,offset]);
    }
    const geometry=new THREE.BufferGeometry();
    const fields={position:3,tipUv:2,wind:3,selection:3,cornerTL:3,cornerTR:3,cornerBL:3,cornerBR:3};
    for(const [name,size]of Object.entries(fields)) {
        const values=records.flatMap(r=>name==='position'?r.origin:name==='tipUv'?r.tip:
            name.startsWith('corner')?r.corners[['cornerTL','cornerTR','cornerBL','cornerBR'].indexOf(name)]:r[name]);
        geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
    }
    geometry.computeBoundingSphere();geometry.boundingSphere.radius+=16;
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
        blending:THREE.AdditiveBlending,fog:true,toneMapped:false,
        uniforms:{...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),...vision.uniforms,windTime,tipVisibility:visibility,pointScale:{value:1}},
        vertexShader:`
            attribute vec2 tipUv;
            attribute vec3 wind,selection,cornerTL,cornerTR,cornerBL,cornerBR;
            uniform float windTime,heartTime,heartBass,heartTreeMotion,heartWarpStrength,skyPsychTime,heartTreeGlow,pointScale,tipVisibility;
            varying float glowAmount;
            varying vec3 glowColor;
            #include <fog_pars_vertex>
            ${TREE_MOTION_GLSL}
            vec3 deformCorner(vec3 p,float weight) {
                vec2 origin=position.xz;
                float phase=wind.z+dot(origin,vec2(.071,.093));
                float speed=wind.y*(.9+.2*fract(sin(dot(origin,vec2(12.9898,78.233)))*43758.5453));
                float sway=sin(windTime*speed+phase)*.8+sin(windTime*speed*1.63+phase*.7)*.2;
                p.xz+=vec2(1.,.3)*sway*wind.x*weight*weight;
                vec2 cell=floor(origin/${UNIT_SIZE.toFixed(6)}+.5);
                return p+heartTreeMovement(p,origin,weight,mod(cell.x+cell.y*2.,4.),heartTime,phase,heartBass)*heartTreeMotion;
            }
            void main() {
                float song=skyPsychTime;
                float envelope=smoothstep(${(FOREST_CUES[2]-3).toFixed(6)},${FOREST_CUES[2].toFixed(6)},song)
                    *(1.-smoothstep(${FOREST_CUES[8].toFixed(6)},${FOREST_CUES[9].toFixed(6)},song));
                // También se extingue con la cancelación suave del evento.
                envelope*=clamp(heartTreeGlow*8.,0.,1.);
                float clock=(song-${FOREST_CUES[2].toFixed(6)})/${(FOREST_TIP_PERIOD*8).toFixed(12)}+selection.z;
                float epoch=floor(clock),blend=smoothstep(0.,.125,fract(clock));
                float current=mod(epoch,selection.y),previous=mod(epoch-1.,selection.y);
                float chosen=(1.-step(.1,abs(selection.x-current)))*blend
                    +(1.-step(.1,abs(selection.x-previous)))*(1.-blend);
                glowAmount=envelope*chosen*tipVisibility;
                if(glowAmount<.0001||distance(cameraPosition,position)>320.) {
                    gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=1.;glowAmount=0.;glowColor=vec3(0.);return;
                }
                // Invertir la misma distorsión UV que mueve el dibujo del árbol.
                vec2 uv=tipUv;
                for(int i=0;i<5;i++)uv=tipUv-vec2(sin(uv.y*7.+heartTime*.55),cos(uv.x*6.-heartTime*.45))
                    *heartWarpStrength*(.010+heartBass*.025);
                // Si el dibujo se recorta en el borde, acompañar su punta visible.
                uv=clamp(uv,vec2(0.),vec2(1.));
                vec3 tl=deformCorner(cornerTL,1.),tr=deformCorner(cornerTR,1.);
                vec3 bl=deformCorner(cornerBL,0.),br=deformCorner(cornerBR,0.);
                // Mismas dos caras triangulares del PlaneGeometry, no otra curva aproximada.
                vec3 world=uv.y>=uv.x?tl*(uv.y-uv.x)+bl*(1.-uv.y)+tr*uv.x:
                    br*(uv.x-uv.y)+bl*(1.-uv.x)+tr*uv.y;
                world+=normalize(cameraPosition-world)*.045;
                vec4 mvPosition=viewMatrix*vec4(world,1.);
                gl_Position=projectionMatrix*mvPosition;
                gl_PointSize=clamp(pointScale*.85/max(1.,-mvPosition.z),1.,96.);
                float pulse=1.-fract((song-${FOREST_LIGHT_BEAT_OFFSET.toFixed(6)})/${FOREST_TIP_PERIOD.toFixed(12)});
                glowAmount*=pulse;
                float hue=fract(song*.009+selection.z);
                vec3 channels=clamp(abs(fract(vec3(hue)+vec3(0.,.666667,.333333))*6.-3.)-1.,0.,1.);
                glowColor=mix(vec3(1.),channels,.98);
                #include <fog_vertex>
            }
        `,
        fragmentShader:`
            varying float glowAmount;
            varying vec3 glowColor;
            #include <fog_pars_fragment>
            void main() {
                float r=length(gl_PointCoord-.5)*2.;
                float halo=exp(-r*r*4.)*(1.-smoothstep(.7,1.,r));
                float core=1.-smoothstep(.10,.28,r);
                float alpha=glowAmount*(halo*.55+core);
                if(alpha<.002)discard;
                gl_FragColor=vec4(mix(glowColor,vec3(1.),core*.04)*1.65,alpha);
                #ifdef USE_FOG
                    #ifdef FOG_EXP2
                        gl_FragColor.a*=exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
                    #else
                        gl_FragColor.a*=1.-smoothstep(fogNear,fogFar,vFogDepth);
                    #endif
                #endif
                #include <colorspace_fragment>
            }
        `});
    const points=new THREE.Points(geometry,material);points.name='forest-tree-tip-glows';points.renderOrder=1;
    points.raycast=()=>{};
    const bufferSize=new THREE.Vector2();
    points.onBeforeRender=(renderer,scene,camera)=>{
        material.uniforms.pointScale.value=renderer.getDrawingBufferSize(bufferSize).y*camera.projectionMatrix.elements[5]*.5;
    };
    points.userData.treeCount=records.length;points.userData.tileCount=tiles.size;
    return points;
}
