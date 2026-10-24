// El mapa de papel y su icono se construyen con el mismo modelo y la misma toma cenital.
export function createInventoryMap(THREE, texture) {
    const group = new THREE.Group();
    const folds = [[-1.25,.1],[-1.25/3,-.1],[1.25/3,.1],[1.25,-.1]];
    const positions=[],uvs=[],colors=[];
    for(let panel=0;panel<3;panel++) {
        const [left,leftZ]=folds[panel],[right,rightZ]=folds[panel+1];
        const paper = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(right-left,rightZ-leftZ),2.1,.028),
            new THREE.MeshPhongMaterial({color:0xd8c399,shininess:0,flatShading:true}));
        paper.position.set((left+right)/2,0,(leftZ+rightZ)/2);
        paper.rotation.y=-Math.atan2(rightZ-leftZ,right-left);
        group.add(paper);
        const printLeft=Math.max(left,-.96),printRight=Math.min(right,.96);
        const zAt=x=>leftZ+(rightZ-leftZ)*(x-left)/(right-left)+.035;
        const corners=[[printLeft,-.96],[printRight,-.96],[printRight,.96],[printLeft,.96]];
        const shade=[.78,1,.85][panel];
        for(const index of [0,1,2,0,2,3]) {
            const [x,y]=corners[index];
            positions.push(x,y,zAt(x));uvs.push((x+.96)/1.92,(y+.96)/1.92);
            colors.push(shade,shade,shade);
        }
    }
    const drawing=new THREE.BufferGeometry();
    drawing.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    drawing.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    drawing.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    drawing.computeVertexNormals();
    const print=new THREE.Mesh(drawing,new THREE.MeshBasicMaterial({map:texture,vertexColors:true,side:THREE.DoubleSide,toneMapped:false}));
    print.name='island-map-drawing';group.add(print);
    return group;
}
