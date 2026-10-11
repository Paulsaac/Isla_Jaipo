// Casco facetado abierto; conserva la huella usada por la navegación.
export function createBoatGeometry(THREE, width, height = 0.4, length = width * 2) {
    const pieces=[];
    const add=(g,material=0)=>{const mesh=g.index?g.toNonIndexed():g;if(mesh!==g)g.dispose();pieces.push({geometry:mesh,material});};
    const box=(w,h,d,x,y,z,material=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,material);};
    const beam=(a,b,y,h,t,material=0)=>{
        const g=new THREE.BoxGeometry(t,h,Math.hypot(b[0]-a[0],b[1]-a[1]));
        g.rotateY(Math.atan2(b[0]-a[0],b[1]-a[1]));g.translate((a[0]+b[0])/2,y,(a[1]+b[1])/2);add(g,material);
    };
    const points=[[-0.46,0.04],[-0.30,0.32],[0,0.46],[0.29,0.38],[0.46,0.22]].map(([z,x])=>[x*width,z*width]);
    const outline=new THREE.Shape();
    [...points,...points.slice().reverse().map(([x,z])=>[-x,z])].forEach(([x,z],i)=>i?outline.lineTo(x,-z):outline.moveTo(x,-z));
    outline.closePath();
    const floor=new THREE.ExtrudeGeometry(outline,{depth:height*0.20,bevelEnabled:false,steps:1});
    floor.rotateX(-Math.PI/2);floor.translate(0,-height/2,0);add(floor);
    // Hiladas de tablones, borda reforzada y costillas interiores.
    for(const side of [-1,1]) {
        const edge=points.map(([x,z])=>[x*side,z]);
        for(let i=0;i<edge.length-1;i++) {
            for(let row=0;row<3;row++)beam(edge[i],edge[i+1],height*(-0.15+row*0.24),height*0.23,width*0.045);
            beam(edge[i],edge[i+1],height*0.45,height*0.10,width*0.065,1);
        }
        for(let i=1;i<edge.length-1;i++)box(width*0.035,height*0.65,width*0.045,edge[i][0]*0.93,height*0.075,edge[i][1],1);
    }
    for(const index of [0,points.length-1]) {
        const [x,z]=points[index];box(x*2,height*0.72,width*0.05,0,height*0.06,z);
        box(x*2+width*0.03,height*0.10,width*0.065,0,height*0.45,z,1);
    }
    for(const [z,span] of [[-0.18,0.66],[0.19,0.70]]) {
        box(width*span,height*0.09,width*0.12,0,height*0.15,z*width);
        for(const side of [-1,1])box(width*0.045,height*0.38,width*0.08,side*width*span*0.40,-height*0.08,z*width,1);
    }
    const result=new THREE.BufferGeometry();
    for(const name of ['position','normal','uv']) {
        const size=pieces[0].geometry.attributes[name].itemSize;
        const values=new Float32Array(pieces.reduce((sum,p)=>sum+p.geometry.attributes[name].array.length,0));
        let offset=0;
        for(const {geometry} of pieces){values.set(geometry.attributes[name].array,offset);offset+=geometry.attributes[name].array.length;}
        result.setAttribute(name,new THREE.BufferAttribute(values,size));
    }
    let start=0;
    for(const {geometry,material} of pieces){result.addGroup(start,geometry.attributes.position.count,material);start+=geometry.attributes.position.count;geometry.dispose();}
    result.scale(1,1,length/width);
    result.parameters={width,height,depth:length};result.computeBoundingBox();result.computeBoundingSphere();return result;
}
