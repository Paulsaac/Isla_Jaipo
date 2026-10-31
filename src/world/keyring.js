import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {KEY_DEFINITIONS} from '../content/keys.js';

// Geometría original: aro de hierro, anillas y dientes antiguos facetados.
export function createKeyring(THREE,ids) {
    const group=new THREE.Group();group.name='inventory-keyring';
    const iron=new THREE.MeshStandardMaterial({color:0x555c61,metalness:.65,roughness:.48,flatShading:true});
    const ringRadius=.64,ringStretch=1.15;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(ringRadius,.043,5,18),iron);
    ring.name='keyring-main-ring';
    // El aro cruza el plano de las cabezas: un tramo delante y otro detrás.
    ring.rotation.y=.72;
    // Mantener el borde inferior en las anillas al ampliar el aro.
    ring.scale.y=ringStretch;ring.position.y=.486+ringRadius*ringStretch;group.add(ring);
    const keyMeshes=[];
    const definitions=KEY_DEFINITIONS.filter(key=>ids.includes(key.id));
    definitions.forEach((key,index)=>{
        const pieces=[];let seed=319+KEY_DEFINITIONS.indexOf(key)*271;
        const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
        function add(source,transform) {
            const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
            transform?.(geometry);
            const colors=new Float32Array(geometry.attributes.position.count*3),base=new THREE.Color(key.color);
            for(let i=0;i<geometry.attributes.position.count;i+=6){
                const color=key.rust&&random()<.19?new THREE.Color(random()<.5?0x794a2b:0x9b6034):base;
                for(let j=i;j<Math.min(i+6,geometry.attributes.position.count);j++)colors.set([color.r,color.g,color.b],j*3);
            }
            geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));pieces.push(geometry);
        }
        const segments=key.teeth===2?8:12;
        add(new THREE.TorusGeometry(key.bow,.044,5,segments),g=>g.scale(1,key.teeth===1?1:1.16,1));
        add(new THREE.CylinderGeometry(.045,.052,key.length,6,8),g=>g.translate(0,-key.bow-key.length/2,0));
        for(const y of [-key.bow-.10,-key.bow-key.length+.20])
            add(new THREE.CylinderGeometry(.073,.073,.065,8),g=>g.translate(0,y,0));
        const bit=new THREE.Shape(),bottom=-key.bow-key.length+.07;
        const notches=[[[0,0],[.34,0],[.34,.12],[.22,.12],[.22,.23],[.34,.23],[.34,.35],[0,.35]],
            [[0,0],[.28,0],[.28,.10],[.16,.10],[.16,.22],[.28,.22],[.28,.31],[0,.31]],
            [[0,0],[.30,0],[.30,.11],[.21,.11],[.21,.20],[.12,.20],[.12,.33],[0,.33]],
            [[0,0],[.32,0],[.32,.14],[.20,.14],[.20,.25],[.32,.25],[.32,.39],[0,.39]]][key.teeth];
        notches.forEach(([x,y],i)=>bit[i?'lineTo':'moveTo'](x,bottom+y));bit.closePath();
        add(new THREE.ExtrudeGeometry(bit,{depth:.10,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,steps:1}),g=>g.translate(0,0,-.05));
        const material=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.56,roughness:key.rust ? .66 : .44,flatShading:true});
        const mesh=new THREE.Mesh(mergeGeometries(pieces,false),material);pieces.forEach(g=>g.dispose());
        const fan=definitions.length===1?-.12:(index-(definitions.length-1)/2)*.27;
        // Centrar cada agujero en un punto del aro facetado real, no apilar
        // las llaves delante de él. Interpolar sus 18 lados evita desajustes.
        const angle=-Math.PI/2+(index-(definitions.length-1)/2)*.12;
        const side=((angle/(Math.PI*2)*18)%18+18)%18,start=Math.floor(side),t=side-start;
        const a=start*Math.PI*2/18,b=(start+1)*Math.PI*2/18;
        mesh.position.set(ringRadius*((1-t)*Math.cos(a)+t*Math.cos(b)),
            ringRadius*((1-t)*Math.sin(a)+t*Math.sin(b))*ringStretch,0);
        mesh.position.applyEuler(ring.rotation).add(ring.position);
        mesh.rotation.z=fan;mesh.rotation.y=(index-(definitions.length-1)/2)*.08;
        mesh.userData.keyId=key.id;mesh.name=key.id;group.add(mesh);keyMeshes.push(mesh);
    });
    group.rotation.y=-.18;
    group.rotation.z=.60;
    return {group,keyMeshes};
}
