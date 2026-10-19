import { UNIT_SIZE } from '../config.js';
import { sampleMountainPath } from './mountain-path.js';

// Tallar solo el camino pintado y su talud inmediato, después del relieve natural.
export function carveMountainTrail(floorMap, heights, mountainMask, profile) {
    if (!profile) return profile;
    const height = floorMap.length, width = floorMap[0].length;
    const surface = Array.from({length:height},()=>new Float32Array(width).fill(NaN));
    const nearby = Array.from({length:height},()=>new Uint8Array(width));
    const road = (x,z) => floorMap[z]?.[x] === 'DIRT' && mountainMask[z]?.[x];
    const directions = [];
    for (let dz=-1;dz<=1;dz++) for (let dx=-1;dx<=1;dx++) if (dx || dz) directions.push([dx,dz]);
    const structures = new Set(['BUILDING','INDOOR_FLOOR','WOOD','DOOR_UNLOCKED','DOOR_LOCKED']);
    const visited = new Set(), trails = [];
    for (let z=0;z<height;z++) for (let x=0;x<width;x++) {
        const start = z*width+x;
        if (!road(x,z) || visited.has(start)) continue;
        const cells = [start]; visited.add(start);
        for (let head=0;head<cells.length;head++) {
            const cx=cells[head]%width, cz=Math.floor(cells[head]/width);
            for (const [dx,dz] of directions) {
                const nx=cx+dx,nz=cz+dz,key=nz*width+nx;
                if (!road(nx,nz) || visited.has(key)) continue;
                visited.add(key); cells.push(key);
            }
        }
        const at = key => heights[Math.floor(key/width)][key%width];
        const minimum = Math.min(...cells.map(at)), maximum = Math.max(...cells.map(at));
        if (maximum-minimum < 2) continue;
        let entries = cells.filter(key => {
            const cx=key%width,cz=Math.floor(key/width);
            return at(key)<=minimum+1 && directions.some(([dx,dz]) =>
                floorMap[cz+dz]?.[cx+dx]==='DIRT' && !mountainMask[cz+dz]?.[cx+dx]);
        });
        if (!entries.length) entries = cells.filter(key=>at(key)<=minimum+0.01);
        const distance = new Map(entries.map(key=>[key,0])), queue = entries.slice();
        for (let head=0;head<queue.length;head++) {
            const key=queue[head],cx=key%width,cz=Math.floor(key/width);
            for (const [dx,dz] of directions) {
                const nx=cx+dx,nz=cz+dz,next=nz*width+nx;
                if (!road(nx,nz)) continue;
                const value=distance.get(key)+Math.hypot(dx,dz)*UNIT_SIZE;
                if (value >= (distance.get(next) ?? Infinity)) continue;
                distance.set(next,value); queue.push(next);
            }
        }
        // Llegar a la cota de la casa antes de su entrada, aunque la senda siga más arriba.
        const goals = cells.filter(key => {
            if (at(key)<profile.summitHeight*0.95) return false;
            const cx=key%width,cz=Math.floor(key/width);
            for (let dz=-2;dz<=2;dz++) for (let dx=-2;dx<=2;dx++)
                if (structures.has(floorMap[cz+dz]?.[cx+dx])) return true;
            return false;
        });
        const accessDistance = goals.length ? Math.min(...goals.map(key=>distance.get(key))) : Math.max(...distance.values());
        if (!(accessDistance>0) || !Number.isFinite(accessDistance)) continue;
        const base = Math.min(...entries.map(at));
        const top = goals.length ? Math.min(...goals.map(at)) : maximum;
        // Alcanzar antes la cima reduce la profundidad del corte. El tramo central llega a 41°.
        const edge = 0.06, maxSlopeDegrees = 41;
        const grade = Math.tan(maxSlopeDegrees*Math.PI/180);
        const length = Math.min(accessDistance,(top-base)/(grade*(1-edge)));
        for (const key of cells) {
            const cx=key%width,cz=Math.floor(key/width),t=Math.min(1,distance.get(key)/length);
            const progress=t<edge ? t*t/(2*edge*(1-edge)) : t>1-edge
                ? 1-(1-t)*(1-t)/(2*edge*(1-edge)) : (t-edge/2)/(1-edge);
            surface[cz][cx]=base+(top-base)*progress;
            for (let dz=-3;dz<=3;dz++) for (let dx=-3;dx<=3;dx++)
                if (nearby[cz+dz] && cx+dx>=0 && cx+dx<width) nearby[cz+dz][cx+dx]=1;
        }
        trails.push({cells:cells.length,length,base,top,maxSlopeDegrees});
    }
    if (!trails.length) return profile;
    const result = {...profile,carved:true,surface,nearby,coreRadius:0.55,blendRadius:1.75,trails};
    // Calcular todas las proyecciones antes de tocar las alturas evita dependencia del orden.
    for (let z=0;z<height;z++) for (let x=0;x<width;x++) {
        if (!mountainMask[z][x] || !nearby[z][x] || structures.has(floorMap[z][x]) || floorMap[z][x]==='CHEST') continue;
        const sample=sampleMountainPath(result,x,z);
        if (!sample) continue;
        const t=Math.max(0,Math.min(1,(sample.distance-result.coreRadius)/(result.blendRadius-result.coreRadius)));
        const blend=t*t*(3-2*t);
        heights[z][x]=sample.height*(1-blend)+heights[z][x]*blend;
    }
    return result;
}
