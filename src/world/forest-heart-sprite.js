// Relieve fino del sprite original: conserva píxeles y recorta el contorno transparente.
export function createForestHeartSpriteGeometry(THREE, image, {height=0.65,depth=0.035,alphaTest=0.5}={}) {
    const canvas=document.createElement('canvas');
    canvas.width=image.width; canvas.height=image.height;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    context.drawImage(image,0,0);
    const {data}=context.getImageData(0,0,canvas.width,canvas.height);
    const positions=[],colors=[],color=new THREE.Color();
    const opaque=(x,y)=>x>=0&&y>=0&&x<canvas.width&&y<canvas.height&&data[(y*canvas.width+x)*4+3]>=alphaTest*255;
    const pixel=height/canvas.height;
    function quad(a,b,c,d,shade=1){
        for(const point of [a,b,c,a,c,d]) {positions.push(...point); colors.push(color.r*shade,color.g*shade,color.b*shade);}
    }
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++) {
        if(!opaque(x,y))continue;
        const i=(y*canvas.width+x)*4;
        color.setRGB(data[i]/255,data[i+1]/255,data[i+2]/255,THREE.SRGBColorSpace);
        const l=(x-canvas.width/2)*pixel,r=l+pixel,t=(canvas.height/2-y)*pixel,b=t-pixel;
        quad([l,b,depth],[r,b,depth],[r,t,depth],[l,t,depth]);
        quad([r,b,0],[l,b,0],[l,t,0],[r,t,0],0.75);
        if(!opaque(x-1,y))quad([l,b,0],[l,b,depth],[l,t,depth],[l,t,0],0.65);
        if(!opaque(x+1,y))quad([r,b,depth],[r,b,0],[r,t,0],[r,t,depth],0.65);
        if(!opaque(x,y-1))quad([l,t,depth],[r,t,depth],[r,t,0],[l,t,0],0.8);
        if(!opaque(x,y+1))quad([l,b,0],[r,b,0],[r,b,depth],[l,b,depth],0.65);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
    return geometry;
}
