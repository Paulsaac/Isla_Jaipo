import { createWoodStoveGeometry } from './wood-stove-geometry.js';

// Ambas variantes comparten cuerpo, posición y huella física; solo cambia el interior.
export function createWoodStoveFire(THREE, stove, torchFrames, scale) {
    const loadedGeometry=createWoodStoveGeometry(THREE,{withWood:true});
    loadedGeometry.scale(scale,scale,scale);
    const frames=torchFrames.map(source=>{
        const texture=source.clone();
        texture.repeat.set(6/20,8/20);texture.offset.set(7/20,12/20);
        texture.generateMipmaps=false;texture.needsUpdate=true;
        return texture;
    });
    const flame=new THREE.Mesh(new THREE.PlaneGeometry(.68*scale,.50*scale),
        new THREE.MeshBasicMaterial({map:frames[0],transparent:true,alphaTest:.08,
            depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
    flame.name=stove.name+'-fire';
    flame.position.set(0,1.015*scale,.28*scale);
    flame.visible=false;flame.userData.visibilityEnabled=false;
    stove.add(flame);stove.updateWorldMatrix(true,true);
    const position=flame.getWorldPosition(new THREE.Vector3());
    const torch={x:position.x,y:position.y,z:position.z,isIndoor:true,alwaysLit:true,
        enabled:false,color:0xffa034,distance:6,intensityScale:.15,flickerRate:9,flickerDepth:1.1};
    let lit=false;
    return {
        position,torch,
        get lit(){return lit;},
        ignite(){
            if(lit)return false;
            lit=true;
            const emptyGeometry=stove.geometry;
            stove.geometry=loadedGeometry;emptyGeometry.dispose();
            flame.visible=true;flame.userData.visibilityEnabled=true;torch.enabled=true;
            return true;
        },
        update(time){if(lit)flame.material.map=frames[Math.floor(time/.15)%frames.length];}
    };
}
