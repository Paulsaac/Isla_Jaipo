import { loadMapImage } from './map-loader.js';
import { getClosestType } from './map-decoder.js';
import { FLOOR_COLORS } from './palette.js';

// Destino provisional aislado: conserva intactos el mundo y el progreso de la isla.
export async function loadCaveTestMap(THREE, unitSize, playerHeight) {
    const image=await loadMapImage('./imagenes/Mapa/mapa_cueva.png');
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,image.width,image.height).data;
    const width=image.width,height=image.height,types=[],heights=[],spawnMarkers=[];
    const wet=new Set(['WATER','WATER_ROCK','SEA_ALGA','SEA_CORAL','SEA_GRASS','BOAT']);
    const blocked=new Set(['BUILDING','DOOR_LOCKED']);
    for(let z=0;z<height;z++){
        types[z]=[];heights[z]=[];
        for(let x=0;x<width;x++){
            const i=(z*width+x)*4,type=getClosestType(...pixels.slice(i,i+4));types[z][x]=type;
            if(type==='POI')spawnMarkers.push({x,z});
            heights[z][x]=wet.has(type)?-1.5:type==='MOUNTAIN'?2.5:type==='SNOW_PEAK'?5:0;
        }
    }
    const group=new THREE.Group();group.name='mapa-cueva-test';group.position.set(4096,0,4096);group.visible=false;
    const geometry=new THREE.PlaneGeometry((width-1)*unitSize,(height-1)*unitSize,width-1,height-1);
    geometry.rotateX(-Math.PI/2);geometry.translate((width-1)*unitSize/2,0,(height-1)*unitSize/2);
    const position=geometry.attributes.position,colors=new Float32Array(position.count*3),color=new THREE.Color();
    for(let z=0;z<height;z++)for(let x=0;x<width;x++){
        const index=z*width+x;position.setY(index,heights[z][x]);
        color.set(FLOOR_COLORS[types[z][x]]||'#435538');color.toArray(colors,index*3);
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({vertexColors:true,shininess:0,side:THREE.DoubleSide})));
    const wallCells=[];
    for(let z=0;z<height;z++)for(let x=0;x<width;x++)if(blocked.has(types[z][x]))wallCells.push({x,z});
    if(wallCells.length){
        const walls=new THREE.InstancedMesh(new THREE.BoxGeometry(unitSize,3,unitSize),new THREE.MeshPhongMaterial({color:0x514235,shininess:0}),wallCells.length);
        const matrix=new THREE.Matrix4();
        wallCells.forEach(({x,z},index)=>walls.setMatrixAt(index,matrix.makeTranslation(x*unitSize,1.5,z*unitSize)));
        walls.name='cave-test-walls';group.add(walls);
    }
    const water=new THREE.Mesh(new THREE.PlaneGeometry(width*unitSize,height*unitSize),new THREE.MeshPhongMaterial({color:0x0979b0,transparent:true,opacity:.8,shininess:30}));
    water.rotation.x=-Math.PI/2;water.position.set((width-1)*unitSize/2,-.05,(height-1)*unitSize/2);group.add(water);
    if(spawnMarkers.length>1)throw new Error('mapa_cueva.png contiene más de un punto de spawn.');
    let spawn=null,best=Infinity;
    if(spawnMarkers.length){
        const {x,z}=spawnMarkers[0];
        if(x<1||z<1||x>=width-1||z>=height-1)throw new Error('El spawn de mapa_cueva.png está demasiado cerca del borde.');
        spawn=new THREE.Vector3(group.position.x+x*unitSize,heights[z][x]+playerHeight,group.position.z+z*unitSize);
    }
    for(let z=2;!spawnMarkers.length&&z<height-2;z++)for(let x=2;x<width-2;x++){
        if(heights[z][x]!==0||blocked.has(types[z][x]))continue;
        let safe=true;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(heights[z+dz][x+dx]!==0)safe=false;
        const score=(x-width/2)**2+(z-height/2)**2;
        if(safe&&score<best){best=score;spawn=new THREE.Vector3(group.position.x+x*unitSize,playerHeight,group.position.z+z*unitSize);}
    }
    if(!spawn)throw new Error('mapa_cueva.png no contiene una zona seca segura para aparecer.');
    function grid(x,z){return {x:(x-group.position.x)/unitSize,z:(z-group.position.z)/unitSize};}
    return {group,spawn,width,height,spawnCell:spawnMarkers[0]??null,active:false,
        contains(x,z){const p=grid(x,z);return p.x>=0&&p.z>=0&&p.x<width-1&&p.z<height-1;},
        isWall(x,z){
            for(const dx of [-.3,.3])for(const dz of [-.3,.3]){
                const p=grid(x+dx,z+dz),gx=Math.round(p.x),gz=Math.round(p.z);
                if(!this.contains(x+dx,z+dz)||!types[gz]?.[gx]||wet.has(types[gz][gx])||blocked.has(types[gz][gx]))return true;
            }return false;
        },
        getHeight(x,z){
            const p=grid(x,z),gx=Math.max(0,Math.min(width-2,Math.floor(p.x))),gz=Math.max(0,Math.min(height-2,Math.floor(p.z)));
            const fx=THREE.MathUtils.clamp(p.x-gx,0,1),fz=THREE.MathUtils.clamp(p.z-gz,0,1);
            // Misma diagonal que PlaneGeometry, para coincidir con sus triángulos.
            return fx+fz<=1?heights[gz][gx]+fx*(heights[gz][gx+1]-heights[gz][gx])+fz*(heights[gz+1][gx]-heights[gz][gx])
                :heights[gz+1][gx+1]+(1-fx)*(heights[gz+1][gx]-heights[gz+1][gx+1])+(1-fz)*(heights[gz][gx+1]-heights[gz+1][gx+1]);
        },
        localPosition(position){return new THREE.Vector3(position.x-group.position.x,position.y,position.z-group.position.z);}
    };
}
