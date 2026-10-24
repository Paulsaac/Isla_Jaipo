// Texturas pequeñas de corteza y testa; sin juntas ni tablones de carpintería.
export function createLogStackMaterials(THREE) {
    function texture(name,width,height,pixel) {
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
        const context=canvas.getContext('2d'),image=context.createImageData(width,height);
        for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
            const rgb=pixel(x,y,width,height),i=(y*width+x)*4;
            image.data[i]=rgb[0];image.data[i+1]=rgb[1];image.data[i+2]=rgb[2];image.data[i+3]=255;
        }
        context.putImageData(image,0,0);
        const map=new THREE.CanvasTexture(canvas);map.name=name;
        map.colorSpace=THREE.SRGBColorSpace;map.magFilter=THREE.NearestFilter;
        map.minFilter=THREE.NearestMipmapLinearFilter;
        return map;
    }
    const grain=(x,y)=>((x*29+y*43+x*y*7)%23)-11;
    const bark=texture('log-bark',128,128,(x,y,w,h)=>{
        const u=x/w*Math.PI*2,v=y/h*Math.PI*2;
        const ridge=Math.sin(u*11+.6*Math.sin(v*2)+.24*Math.sin(v*7));
        const crack=ridge>.80?32:ridge>.55?14:0;
        const chips=Math.sin(u*27+Math.sin(v*5))>.86&&Math.cos(v*13+u*3)>.1?20:0;
        const shade=grain(x,y)*.45+Math.sin(u*5+v)*9-crack-chips;
        return [104+shade,77+shade*.83,49+shade*.60];
    });
    bark.wrapS=bark.wrapT=THREE.RepeatWrapping;
    const cut=texture('log-end-grain',128,128,(x,y,w,h)=>{
        const dx=(x+.5)/w*2-1.035,dz=(y+.5)/h*2-.975;
        const angle=Math.atan2(dz,dx),radius=Math.hypot(dx,dz);
        const r=radius+.014*Math.sin(angle*5)+.008*Math.sin(angle*11+radius*4);
        if(radius>.925)return [76+grain(x,y)*.4,53+grain(x,y)*.3,32];
        const ring=Math.sin(r*78+.6*Math.sin(angle*3))>.68?24:0;
        const crack=radius>.22&&((Math.abs(Math.sin(angle-.6))<.025&&radius<.83)
            ||(Math.abs(Math.sin(angle+1.7))<.018&&radius>.5));
        const shade=grain(x,y)*.4-ring-radius*8-(crack?42:0);
        return [183+shade,143+shade*.85,89+shade*.6];
    });
    return [new THREE.MeshPhongMaterial({map:cut,shininess:0}),
        new THREE.MeshPhongMaterial({map:bark,shininess:0})];
}
