const natural=new Set(['GRASS','TALL_GRASS','TREE','BUSH','DIRT','SAND','WET_SAND','WATER','WATER_ROCK','BOAT']);
const water=new Set(['WATER','WATER_ROCK','BOAT']);

// Franja local de orilla; edificios, roca alta y madera conservan su interpolación.
export function createShorelineMask(floorMap, woodMap) {
    const height=floorMap.length,width=floorMap[0].length,mask=new Uint8Array(width*height);
    for(let z=0;z<height;z++)for(let x=0;x<width;x++){
        if(floorMap[z][x]==='BOAT')continue;
        let wet=false,dry=false,protectedCell=false;
        for(let dz=-2;dz<=2&&!protectedCell;dz++)for(let dx=-2;dx<=2;dx++){
            const type=floorMap[z+dz]?.[x+dx];if(type===undefined)continue;
            if(!natural.has(type)||woodMap?.[z+dz]?.[x+dx]){protectedCell=true;break;}
            if(water.has(type))wet=true;else dry=true;
        }
        if(wet&&dry&&!protectedCell)mask[z*width+x]=1;
    }
    return mask;
}

export function createShorelineHeights(floorMap, elevations, mask, waterHeight) {
    const height=floorMap.length,width=floorMap[0].length;
    // Suavizar la silueta agua/tierra, no promediar el fondo profundo contra la orilla.
    let field=elevations.map(row=>Float32Array.from(row,value=>value<waterHeight?-1:1));
    for(let pass=0;pass<6;pass++){
        const next=field.map(row=>row.slice());
        for(let z=1;z<height-1;z++)for(let x=1;x<width-1;x++){
            if(!mask[z*width+x])continue;
            let sum=0;
            for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)sum+=field[z+dz][x+dx]*(dx===0?2:1)*(dz===0?2:1);
            // Conservar el signo de cada centro sin imponer una altura plana a toda la ribera.
            next[z][x]=elevations[z][x]<waterHeight?Math.min(sum/16,-.05):Math.max(sum/16,.05);
        }
        field=next;
    }
    let surface=elevations.map((row,z)=>Float32Array.from(row,(value,x)=>mask[z*width+x]
        ?Math.max(value-1.2,Math.min(value+1.2,waterHeight+field[z][x]*.9)):value));
    // La B-spline aproxima los centros: conservar también el signo tras interpolar.
    for(let pass=0;pass<12;pass++){
        const next=surface.map(row=>row.slice());let maxCorrection=0;
        for(let z=1;z<height-1;z++)for(let x=1;x<width-1;x++){
            if(!mask[z*width+x])continue;
            let sum=0;
            for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)sum+=surface[z+dz][x+dx]*(dx===0?4:1)*(dz===0?4:1);
            const sampled=sum/36;
            const target=elevations[z][x]<waterHeight?Math.min(sampled,waterHeight-.03):Math.max(sampled,waterHeight+.03);
            const value=Math.max(elevations[z][x]-1.2,Math.min(elevations[z][x]+1.2,surface[z][x]+1.5*(target-sampled)));
            maxCorrection=Math.max(maxCorrection,Math.abs(value-surface[z][x]));next[z][x]=value;
        }
        surface=next;if(maxCorrection<1e-5)break;
    }
    return surface;
}

export function alignShorelineInstances(THREE, meshes, mask, width, unitSize, oldHeight, newHeight) {
    const matrix=new THREE.Matrix4();
    for(const mesh of meshes){
        let changed=false;
        for(let index=0;index<mesh.count;index++){
            mesh.getMatrixAt(index,matrix);
            const x=matrix.elements[12],z=matrix.elements[14],gx=Math.round(x/unitSize),gz=Math.round(z/unitSize);
            if(!mask[gz*width+gx])continue;
            const delta=newHeight(x,z)-oldHeight(x,z);
            if(Math.abs(delta)<1e-6)continue;
            matrix.elements[13]+=delta;mesh.setMatrixAt(index,matrix);changed=true;
        }
        if(changed)mesh.instanceMatrix.needsUpdate=true;
    }
}

// B-spline cúbica: continuidad de curvatura incluso al cruzar límites de celda.
function cubic(a,b,c,d,t) {
    const t2=t*t,t3=t2*t;
    return ((1-3*t+3*t2-t3)*a+(4-6*t2+3*t3)*b+(1+3*t+3*t2-3*t3)*c+t3*d)/6;
}

export function sampleShorelineHeight(heights,x,z,width,height,tx,tz) {
    const left=Math.max(0,x-1),next=Math.min(width-1,x+1),right=Math.min(width-1,x+2);
    const row=rz=>{const values=heights[Math.max(0,Math.min(height-1,rz))];return cubic(values[left],values[x],values[next],values[right],tx);};
    return cubic(row(z-1),row(z),row(z+1),row(z+2),tz);
}
