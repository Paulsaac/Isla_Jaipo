// La orilla es el cruce del terreno renderizado con el agua, no el borde de una casilla.
export function createRiverBankBarrier({width,height,unitSize,radius,isRiverCell,isSupported,heightAt,waterHeightAt}) {
    const bankMask=new Uint8Array(width*height);
    for(let z=0;z<height;z++)for(let x=0;x<width;x++) {
        if(!isRiverCell(x,z))continue;
        for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++) {
            const nx=x+dx,nz=z+dz;
            if(nx>=0&&nz>=0&&nx<width&&nz<height)bankMask[nz*width+nx]=1;
        }
    }
    const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],
        [Math.SQRT1_2,Math.SQRT1_2],[-Math.SQRT1_2,Math.SQRT1_2],
        [Math.SQRT1_2,-Math.SQRT1_2],[-Math.SQRT1_2,-Math.SQRT1_2]];
    function depthAt(x,z) {
        const gx=Math.floor(x/unitSize+.5),gz=Math.floor(z/unitSize+.5);
        if(gx<0||gz<0||gx>=width||gz>=height||!bankMask[gz*width+gx]||isSupported(gx,gz))return 0;
        return Math.max(0,waterHeightAt(x,z)+.015-heightAt(x,z));
    }
    function overlap(x,z,reach=radius) {
        let depth=0;
        for(const [dx,dz] of offsets)depth=Math.max(depth,depthAt(x+dx*reach,z+dz*reach));
        return depth;
    }
    return {
        blocks(fromX,fromZ,x,z) {
            const next=overlap(x,z);
            if(next===0)return false;
            // Si ya estaba dentro al quitarse el casco, permitir solo volver a la orilla.
            const previous=overlap(fromX,fromZ);
            return previous===0||next>=previous-1e-5;
        },
        near(x,z){return overlap(x,z,radius+.18)>0;}
    };
}
