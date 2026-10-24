// Silueta de llave.png: aro ovalado, vástago diagonal y dos dientes.
export function createInventoryKey(THREE) {
    const outline=[
        [19,2.7],[22,2.7],[24.6,4.1],[26,6.4],[26,9.4],
        [24.2,11.8],[21.7,12.8],[18.3,12.3],
        [7.6,22.9],[8.7,23.3],[9.4,23.3],[11.8,25.8],
        [11,26.6],[9.1,24.8],[8,25.8],[9.1,27],
        [8.4,27.7],[9.6,28.9],[8.7,29.8],[4.2,25.3],
        [3.7,24],[16,11.7],[15,9.4],[15,5.6],[16.5,3.9]
    ];
    const shape=new THREE.Shape();
    outline.forEach(([x,y],i)=>shape[i ? 'lineTo' : 'moveTo']((x-15)/10,(16-y)/10));
    shape.closePath();
    const hole=new THREE.Path();
    const opening=[[20.5,5],[22,5.6],[23,7.2],[23,8.8],[22,10.3],[20.5,10.8],[19,10.3],[18,8.8],[18,7.2],[19,5.6]];
    opening.forEach(([x,y],i)=>hole[i ? 'lineTo' : 'moveTo']((x-15)/10,(16-y)/10));
    hole.closePath();shape.holes.push(hole);
    const geometry=new THREE.ExtrudeGeometry(shape,{
        depth:.14,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,curveSegments:1
    });
    geometry.translate(0,0,-.07);geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const key=new THREE.Mesh(geometry,[
        new THREE.MeshStandardMaterial({color:0xdedede,metalness:.55,roughness:.48,flatShading:true}),
        new THREE.MeshStandardMaterial({color:0xaeaeae,metalness:.6,roughness:.52,flatShading:true})
    ]);
    key.name='inventory-silver-key';return key;
}
