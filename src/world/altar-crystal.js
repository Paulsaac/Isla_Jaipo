// Cristal celeste del altar: tapa pulida y bisel, sin refracción ni luces extra.
export function createAltarCrystal(THREE,size) {
    const half=size/2,inset=size*.045,depth=size*.035;
    const inner=half-inset,positions=[],colors=[];
    const top=[[-inner,0,-inner],[inner,0,-inner],[inner,0,inner],[-inner,0,inner]];
    const edge=[[-half,-depth,-half],[half,-depth,-half],[half,-depth,half],[-half,-depth,half]];
    function face(corners,color) {
        for(const i of [0,2,1,0,3,2]){positions.push(...corners[i]);colors.push(...color);}
    }
    face(top,[.84,.96,1]);
    for(let i=0;i<4;i++){const next=(i+1)%4;face([edge[i],edge[next],top[next],top[i]],[.64,.9,1]);}
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const material=new THREE.MeshPhongMaterial({color:0x8de6ff,emissive:0x29677f,
        emissiveIntensity:.45,specular:0xe8ffff,shininess:110,flatShading:true,vertexColors:true});
    return new THREE.Mesh(geometry,material);
}
