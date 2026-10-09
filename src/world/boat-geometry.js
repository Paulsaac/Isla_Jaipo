// Casco abierto: bordes de 10% del ancho y cavidad de 80% de la altura.
export function createBoatGeometry(THREE, width, height = 0.4) {
    const rim=width*0.1,bottom=height*0.2,sideHeight=height-bottom;
    const sideY=-height/2+bottom+sideHeight/2;
    const pieces=[
        [width,bottom,width,0,-height/2+bottom/2,0],
        [rim,sideHeight,width,-(width-rim)/2,sideY,0],
        [rim,sideHeight,width,(width-rim)/2,sideY,0],
        [width-2*rim,sideHeight,rim,0,sideY,-(width-rim)/2],
        [width-2*rim,sideHeight,rim,0,sideY,(width-rim)/2]
    ].map(([w,h,d,x,y,z])=>{
        const box=new THREE.BoxGeometry(w,h,d);
        const geometry=box.toNonIndexed();box.dispose();
        geometry.translate(x,y,z);return geometry;
    });
    const result=new THREE.BufferGeometry();
    for(const name of ['position','normal','uv']) {
        const size=pieces[0].attributes[name].itemSize;
        const values=new Float32Array(pieces.reduce((sum,g)=>sum+g.attributes[name].array.length,0));
        let offset=0;
        for(const geometry of pieces) {values.set(geometry.attributes[name].array,offset);offset+=geometry.attributes[name].array.length;}
        result.setAttribute(name,new THREE.BufferAttribute(values,size));
    }
    for(const geometry of pieces) geometry.dispose();
    result.parameters={width,height,depth:width};
    result.computeBoundingBox();result.computeBoundingSphere();
    return result;
}
