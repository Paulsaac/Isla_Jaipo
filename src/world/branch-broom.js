import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Escoba antigua: palo torcido, ramitas secas y dos ataduras de cuerda.
export function createBranchBroom(THREE){
    const pieces=[],up=new THREE.Vector3(0,1,0);
    function add(source,color){
        const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
        const tint=new THREE.Color(color),colors=new Float32Array(geometry.attributes.position.count*3);
        for(let i=0;i<colors.length;i+=3)colors.set([tint.r,tint.g,tint.b],i);
        geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));pieces.push(geometry);
    }
    function rod(a,b,radius,color,sides=5){
        const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),axis=to.clone().sub(from);
        const geometry=new THREE.CylinderGeometry(radius*.75,radius,axis.length(),sides);
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,axis.normalize()));
        const center=from.add(to).multiplyScalar(.5);geometry.translate(center.x,center.y,center.z);add(geometry,color);
    }
    const handle=[[0,.32,-.04],[.016,.68,-.12],[-.013,1.02,-.17],[-.025,1.34,-.23],[-.065,1.69,-.30]];
    for(let i=1;i<handle.length;i++)rod(handle[i-1],handle[i],.027, i%2?0x60452c:0x715237,6);
    for(let i=0;i<83;i++){
        const angle=i*2.39996,spread=Math.sqrt((i+.5)/83),radius=.025+.205*spread,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius*.55;
        const low=[x,.015+(i%4)*.009,z+.035],mid=[x*.76+.018*Math.sin(i*1.7),.20+(i%3)*.025,z*.65-.025];
        const lower=[Math.cos(angle)*.068*spread,.39,-.085+Math.sin(angle)*.047*spread];
        const upper=[Math.cos(angle)*.049*spread,.46,-.085+Math.sin(angle)*.031*spread];
        const neck=[upper[0]*.65,.51+(i%5)*.006,-.085+(upper[2]+.085)*.65],color=[0x58412a,0x755236,0x8a6240,0x67492d][i%4];
        rod(low,mid,.008,color,4);rod(mid,lower,.011,color,4);rod(lower,upper,.011,color,4);rod(upper,neck,.011,color,4);
        if(i%3===0)rod([mid[0]*.8,mid[1]-.025,mid[2]], [x*1.16,.025,z+.075],.0055,color,3);
    }
    for(const [y,rx,rz] of [[.39,.092,.071],[.46,.073,.055]]){
        const tie=new THREE.TorusGeometry(rx,.012,6,24);tie.rotateX(Math.PI/2);tie.scale(1,1,rz/rx);tie.translate(0,y,-.085);add(tie,0x9a8056);
    }
    const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.translate(0,-geometry.boundingBox.min.y,0);geometry.computeBoundingBox();geometry.computeBoundingSphere();
    return new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:0}));
}
