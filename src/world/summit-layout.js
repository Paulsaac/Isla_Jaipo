import { PALETTE } from './palette.js';
import { getClosestType } from './map-decoder.js';
import { wizardHouseLayout,summitRidge,summitStonePlatform,getSummitRoute } from '../content/summit-layout.js';

// Componer la variante en memoria conserva las dos imágenes originales del mapa.
// Se aplica antes de contar instancias, generar colisiones, alturas y minimapa.
export function applySummitLayout(mapData) {
    const {width,basePixels:sourceBase,roofPixels:sourceRoof}=mapData;
    const basePixels=sourceBase.slice(),roofPixels=sourceRoof.slice();
    const at=(pixels,x,z)=>getClosestType(...pixels.subarray((z*width+x)*4,(z*width+x)*4+3));
    function paint(pixels,x,z,type) {
        const i=(z*width+x)*4,{r,g,b}=PALETTE[type];
        pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=255;
    }
    const bounds=wizardHouseLayout.sourceBounds,offset=wizardHouseLayout.offsetCells;
    for(let z=bounds.minZ;z<=bounds.maxZ;z++)for(let x=bounds.minX;x<=bounds.maxX;x++) {
        paint(basePixels,x,z,'SNOW_PEAK');paint(roofPixels,x,z,'SNOW_PEAK');
    }
    // Retirar únicamente el antiguo ramal que subía detrás de la casa.
    for(let z=109;z<=128;z++)for(let x=144;x<=163;x++)
        if(at(basePixels,x,z)==='DIRT')paint(basePixels,x,z,'SNOW_PEAK');
    // Copiar siempre desde las capas fuente: los rectángulos de origen y destino se solapan.
    for(let z=bounds.minZ;z<=bounds.maxZ;z++)for(let x=bounds.minX;x<=bounds.maxX;x++) {
        const source=(z*width+x)*4,target=((z+offset.z)*width+x+offset.x)*4;
        basePixels.set(sourceBase.subarray(source,source+4),target);
        roofPixels.set(sourceRoof.subarray(source,source+4),target);
    }
    const points=getSummitRoute();
    const minX=Math.floor(Math.min(...points.map(p=>p[0]))-1),maxX=Math.ceil(Math.max(...points.map(p=>p[0]))+1);
    const minZ=Math.floor(Math.min(...points.map(p=>p[1]))-1),maxZ=Math.ceil(Math.max(...points.map(p=>p[1]))+1);
    for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++) {
        if(!['SNOW_PEAK','SNOW_SLOPE','DIRT','GRASS'].includes(at(basePixels,x,z)))continue;
        if(points.some(p=>Math.hypot(x-p[0],z-p[1])<=summitRidge.halfWidth))paint(basePixels,x,z,'DIRT');
    }
    const platform=summitStonePlatform;
    for(let z=platform.minZ;z<platform.minZ+platform.cellsPerSide;z++)
        for(let x=platform.minX;x<platform.minX+platform.cellsPerSide;x++) {
            paint(basePixels,x,z,'OTHER');paint(roofPixels,x,z,'SNOW_PEAK');
        }
    return {...mapData,basePixels,roofPixels};
}
