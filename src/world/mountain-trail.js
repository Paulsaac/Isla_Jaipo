import { UNIT_SIZE } from '../config.js';
import { sampleMountainPath } from './mountain-path.js';

// Tallar solo el camino pintado y su talud inmediato, después del relieve natural.
export function carveMountainTrail(floorMap, heights, mountainMask, profile) {
    if (!profile) return profile;
    const height = floorMap.length, width = floorMap[0].length;
    const surface = Array.from({length:height},()=>new Float32Array(width).fill(NaN));
    const nearby = Array.from({length:height},()=>new Uint8Array(width));
    const road = (x,z) => (floorMap[z]?.[x]==='DIRT' || floorMap.snowTrail?.has(z*width+x)) && mountainMask[z]?.[x];
    const directions = [];
    for (let dz=-1;dz<=1;dz++) for (let dx=-1;dx<=1;dx++) if (dx || dz) directions.push([dx,dz]);
    const structures = new Set(['BUILDING','INDOOR_FLOOR','WOOD','DOOR_UNLOCKED','DOOR_LOCKED']);
    const summitStructures=[];
    for(let z=0;z<height;z++) for(let x=0;x<width;x++)
        if(mountainMask[z][x] && structures.has(floorMap[z][x]) && heights[z][x]>=profile.summitHeight*.95)
            summitStructures.push({x,z});
    const plateau=summitStructures.length ? {
        minX:Math.min(...summitStructures.map(p=>p.x)),maxX:Math.max(...summitStructures.map(p=>p.x)),
        minZ:Math.min(...summitStructures.map(p=>p.z)),maxZ:Math.max(...summitStructures.map(p=>p.z)),
        height:profile.summitHeight,inner:6,outer:10
    } : null;
    const plateauDistance=(x,z)=>plateau ? Math.hypot(Math.max(plateau.minX-x,0,x-plateau.maxX),
        Math.max(plateau.minZ-z,0,z-plateau.maxZ)) : Infinity;
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
        // Subida uniforme y suave hasta la nieve; el tramo final duplica la pendiente.
        const plateauRoad=cells.filter(key=>at(key)>=profile.summitHeight*.95
            && plateauDistance(key%width,Math.floor(key/width))<=6);
        const length = plateauRoad.length ? Math.min(accessDistance,...plateauRoad.map(key=>distance.get(key))) : accessDistance;
        const snowDistances = cells.filter(key => {
            const cx=key%width,cz=Math.floor(key/width),d=distance.get(key);
            return d>0 && d<length && at(key)>=profile.summitHeight*.7
                && directions.some(([dx,dz])=>floorMap[cz+dz]?.[cx+dx]==='SNOW_PEAK');
        }).map(key=>distance.get(key));
        const snowDistance = snowDistances.length ? Math.min(...snowDistances) : length*.8;
        const split = Math.max(length*.1,Math.min(length*.95,snowDistance));
        const transition = Math.min(8,split*.2,(length-split)*.4);
        const gentleGrade = (top-base)/(split+2*(length-split));
        const maxSlopeDegrees = Math.atan(gentleGrade*2)*180/Math.PI;
        for (const key of cells) {
            const cx=key%width,cz=Math.floor(key/width),d=Math.min(length,distance.get(key));
            const t=Math.max(0,Math.min(1,(d-split+transition/2)/transition));
            const extra=d>=split+transition/2 ? d-split : transition*(t*t*t-.5*t*t*t*t);
            surface[cz][cx]=base+gentleGrade*(d+extra);
            for (let dz=-8;dz<=8;dz++) for (let dx=-8;dx<=8;dx++)
                if (nearby[cz+dz] && cx+dx>=0 && cx+dx<width) nearby[cz+dz][cx+dx]=1;
        }
        // Acercar el perfil a la ladera sin heredar sus paredes: mezcla natural del45%.
        const gradeAt=d=>{
            const t=Math.max(0,Math.min(1,(d/length-.3)/.6));
            return Math.tan((20+22*t*t*(3-2*t))*Math.PI/180);
        };
        const upper = new Map(), lower = new Map();
        for (const key of cells) {
            const cx=key%width,cz=Math.floor(key/width),d=distance.get(key);
            const t=Math.max(0,Math.min(1,(d/length-.3)/.35));
            const terrainWeight=.45+.4*t*t*(3-2*t);
            upper.set(key,d===0 ? base : d>=length ? top
                : Math.min(at(key),Math.max(base,Math.min(top,
                    surface[cz][cx]*(1-terrainWeight)+at(key)*terrainWeight)))-.15);
            lower.set(key,d>=length ? top : base);
        }
        // Envolventes de pendiente sobre la misma huella; conservan extremos y limitan escalones.
        function relax(field, rising) {
            const queue=cells.slice();
            for(let head=0;head<queue.length;head++) {
                const key=queue[head],cx=key%width,cz=Math.floor(key/width);
                for(const [dx,dz] of directions) {
                    const next=(cz+dz)*width+cx+dx;
                    if(!road(cx+dx,cz+dz) || !field.has(next)) continue;
                    const slopeLimit=gradeAt(Math.min(distance.get(key),distance.get(next)));
                    const step=slopeLimit*UNIT_SIZE*Math.hypot(dx,dz);
                    const candidate=field.get(key)+(rising ? -step : step);
                    if(rising ? candidate>field.get(next)+1e-7 : candidate<field.get(next)-1e-7) {
                        field.set(next,candidate); queue.push(next);
                    }
                }
            }
        }
        relax(upper,false); relax(lower,true);
        for(const key of cells) surface[Math.floor(key/width)][key%width]=
            distance.get(key)>=length && plateauDistance(key%width,Math.floor(key/width))<=6 ? top : distance.get(key)===0 ? base
                : Math.min(at(key)-.15,Math.max(upper.get(key),lower.get(key)));
        trails.push({cells:cells.length,length,base,top,snowDistance:split,
            referenceGentleSlopeDegrees:Math.atan(gentleGrade)*180/Math.PI,
            referenceFinalSlopeDegrees:maxSlopeDegrees,maxGentleSlopeDegrees:20,maxSlopeDegrees:42,terrainBlend:.85});
    }
    if (!trails.length) return profile;
    const result = {...profile,carved:true,surface,nearby,coreRadius:0.55,blendRadius:1.75,trails,summitPlateau:plateau};
    // El talud ancho se prepara una vez; el muestreo por fotograma conserva un corredor pequeño.
    const supportProfile={...result,coreRadius:0.75,blendRadius:8};
    // Calcular todas las proyecciones antes de tocar las alturas evita dependencia del orden.
    for (let z=0;z<height;z++) for (let x=0;x<width;x++) {
        if (!mountainMask[z][x] || !nearby[z][x] || structures.has(floorMap[z][x]) || floorMap[z][x]==='CHEST') continue;
        const sample=sampleMountainPath(supportProfile,x,z);
        if (!sample) continue;
        const t=Math.max(0,Math.min(1,(sample.distance-supportProfile.coreRadius)/(supportProfile.blendRadius-supportProfile.coreRadius)));
        const blend=t*t*(3-2*t);
        // Tallar donde haga falta, sin crear rellenos que sobresalgan del relieve natural.
        heights[z][x]=Math.min(heights[z][x],sample.height*(1-blend)+heights[z][x]*blend);
    }
    // Aterrizar antes de la casa y mantener una explanada horizontal, fundida con la nieve.
    if(plateau) for(let z=0;z<height;z++) for(let x=0;x<width;x++) {
        if(!mountainMask[z][x] || structures.has(floorMap[z][x])) continue;
        const d=plateauDistance(x,z);
        if(d>=plateau.outer) continue;
        const t=Math.max(0,(d-plateau.inner)/(plateau.outer-plateau.inner));
        const blend=t*t*(3-2*t);
        heights[z][x]=plateau.height*(1-blend)+heights[z][x]*blend;
    }
    result.nearby=Array.from({length:height},()=>new Uint8Array(width));
    for(let z=0;z<height;z++) for(let x=0;x<width;x++) if(Number.isFinite(surface[z][x]))
        for(let dz=-3;dz<=3;dz++) for(let dx=-3;dx<=3;dx++)
            if(result.nearby[z+dz] && x+dx>=0 && x+dx<width) result.nearby[z+dz][x+dx]=1;
    return result;
}
