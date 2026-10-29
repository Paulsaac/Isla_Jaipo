// Modelo tridimensional original del inventario, compartido con la mano izquierda.
export function createTorchModel(THREE, frames) {
    const object = new THREE.Group();
    const shaftMap = frames[0].clone(), headMap = frames[0].clone();
    shaftMap.repeat.set(2/20,10/20);shaftMap.offset.set(9/20,0);
    headMap.repeat.set(6/20,1/20);headMap.offset.set(7/20,10/20);
    const flameMaps = frames.map(frame => {
        const map=frame.clone();
        map.repeat.set(6/20,8/20);map.offset.set(7/20,12/20);
        return map;
    });
    const textures=[shaftMap,headMap,...flameMaps];
    textures.forEach(map=>{map.needsUpdate=true;});
    function part(geometry,color,y,map=null) {
        const material=new THREE.MeshStandardMaterial({color,roughness:map?1:.6,
            metalness:map?0:.15,flatShading:true,map,fog:false});
        const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;object.add(mesh);
    }
    part(new THREE.CylinderGeometry(.15,.075,1.5,6),0xffffff,-.25,shaftMap);
    part(new THREE.CylinderGeometry(.27,.19,.3,6),0xffffff,.57,headMap);
    part(new THREE.CylinderGeometry(.22,.23,.05,6),0x100c0a,.73);
    const flame=new THREE.Sprite(new THREE.SpriteMaterial({map:flameMaps[0],
        transparent:true,alphaTest:.1,depthWrite:false,toneMapped:false,fog:false}));
    // Base centrada y apenas hundida en la tapa para evitar una separación al verla de lado.
    flame.center.set(.5,0);
    flame.position.set(0,.725,0);flame.scale.set(.72,.96,1);flame.visible=false;object.add(flame);
    return {object,flame,textures,updateFrame(frameIndex){flame.material.map=flameMaps[frameIndex];}};
}
