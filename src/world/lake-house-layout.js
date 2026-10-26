import {PALETTE} from './palette.js';
import {getClosestType} from './map-decoder.js';
import {UNIT_SIZE} from '../config.js';
import {lakeHouseLayout,isLakeHouseDoor} from '../content/lake-house-layout.js';

// Variante de ejecución: retirar los muros cuadrados sin tocar los PNG fuente.
export function applyLakeHouseLayout(mapData) {
    const basePixels=mapData.basePixels.slice(),roofPixels=mapData.roofPixels.slice();
    const {bounds,structure,center,radius}=lakeHouseLayout;
    function paint(pixels,index,type) {
        const {r,g,b}=PALETTE[type];pixels.set([r,g,b,255],index);
    }
    for(let z=bounds.minZ;z<=bounds.maxZ;z++)for(let x=bounds.minX;x<=bounds.maxX;x++) {
        const index=(z*mapData.width+x)*4;
        const type=getClosestType(...basePixels.subarray(index,index+3));
        const inStructure=x>=structure.minX&&x<=structure.maxX&&z>=structure.minZ&&z<=structure.maxZ;
        const inside=Math.hypot((x-center.x)*UNIT_SIZE,(z-center.z)*UNIT_SIZE)<=radius;
        if(inStructure&&!isLakeHouseDoor(x,z)&&['BUILDING','INDOOR_FLOOR'].includes(type))
            paint(basePixels,index,inside?'INDOOR_FLOOR':'GRASS');
        // Conservar metadatos de interior para audio/iluminación; el domo dibuja su propia cubierta.
        paint(roofPixels,index,inStructure&&inside?'ROOF':'SNOW_PEAK');
    }
    return {...mapData,basePixels,roofPixels};
}
