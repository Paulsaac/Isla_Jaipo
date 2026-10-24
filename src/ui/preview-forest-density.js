// Completa los grupos de bosque de la portada sobre el terreno guardado.
// No modifica el mapa jugable ni la maqueta original.
export function densifyPreviewForest(model) {
    const {positions,colors,indices,trees,roofs,width,depth}=model;
    const cell=8,columns=Math.ceil(width/cell),rows=Math.ceil(depth/cell);
    const terrain=Array.from({length:columns*rows},()=>[]);
    for(let i=0;i<indices.length;i+=3) {
        const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
        const minX=Math.max(0,Math.floor(Math.min(positions[a],positions[b],positions[c])/cell));
        const maxX=Math.min(columns-1,Math.floor(Math.max(positions[a],positions[b],positions[c])/cell));
        const minZ=Math.max(0,Math.floor(Math.min(positions[a+2],positions[b+2],positions[c+2])/cell));
        const maxZ=Math.min(rows-1,Math.floor(Math.max(positions[a+2],positions[b+2],positions[c+2])/cell));
        for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++)terrain[z*columns+x].push(i);
    }
    function grassyHeight(x,z) {
        if(x<0||z<0||x>=width||z>=depth)return null;
        const bucket=terrain[Math.floor(z/cell)*columns+Math.floor(x/cell)];
        for(const index of bucket) {
            const a=indices[index]*3,b=indices[index+1]*3,c=indices[index+2]*3;
            const bx=positions[b]-positions[a],bz=positions[b+2]-positions[a+2];
            const cx=positions[c]-positions[a],cz=positions[c+2]-positions[a+2];
            const area=bx*cz-bz*cx;
            if(Math.abs(area)<1e-8)continue;
            const px=x-positions[a],pz=z-positions[a+2];
            const u=(px*cz-pz*cx)/area,v=(bx*pz-bz*px)/area,w=1-u-v;
            if(u<-.00001||v<-.00001||w<-.00001)continue;
            const r=colors[a]*w+colors[b]*u+colors[c]*v;
            const g=colors[a+1]*w+colors[b+1]*u+colors[c+1]*v;
            const blue=colors[a+2]*w+colors[b+2]*u+colors[c+2]*v;
            if(g<r*1.25||g<blue*1.4)return null;
            return positions[a+1]*w+positions[b+1]*u+positions[c+1]*v;
        }
        return null;
    }
    const spacing=2.6,occupied=new Map(),result=Array.from(trees);
    function key(x,z){return `${x},${z}`;}
    function remember(x,z) {
        const id=key(Math.floor(x/spacing),Math.floor(z/spacing));
        if(!occupied.has(id))occupied.set(id,[]);
        occupied.get(id).push([x,z]);
    }
    function crowded(x,z) {
        const gx=Math.floor(x/spacing),gz=Math.floor(z/spacing);
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++) {
            for(const [px,pz] of occupied.get(key(gx+dx,gz+dz))||[])if(Math.hypot(px-x,pz-z)<spacing)return true;
        }
        return false;
    }
    for(let i=0;i<trees.length;i+=4)remember(trees[i],trees[i+2]);
    for(let i=0;i<trees.length;i+=4) {
        const x=trees[i],z=trees[i+2],scale=trees[i+3];
        for(let companion=0;companion<2;companion++) {
            const angle=((x*17+z*29)%360)*Math.PI/180+companion*2.4;
            const distance=3+((x*7+z*11+companion)%7)*.1;
            const px=x+Math.cos(angle)*distance,pz=z+Math.sin(angle)*distance;
            if(crowded(px,pz))continue;
            let nearBuilding=false;
            for(let r=0;r<roofs.length;r+=5) {
                if(px>roofs[r]-3&&px<roofs[r]+roofs[r+2]+3&&pz>roofs[r+1]-3&&pz<roofs[r+1]+roofs[r+3]+3){nearBuilding=true;break;}
            }
            if(nearBuilding)continue;
            const y=grassyHeight(px,pz);
            if(y===null||[[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]].some(([dx,dz])=>grassyHeight(px+dx,pz+dz)===null))continue;
            result.push(px,y,pz,scale*(.82+((i+companion)%5)*.035));
            remember(px,pz);
        }
    }
    return new Float32Array(result);
}
