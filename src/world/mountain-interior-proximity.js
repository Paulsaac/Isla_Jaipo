// Alcance esférico de interiores, independiente de cámara/frustum y de las colisiones.
// Se conserva una caché de modelos; ocultarlos evita dibujo/subida de buffers y animación.
export function createMountainInteriorProximity({radius,zones,hysteresis=3}) {
    const owned=new WeakSet();
    const entries=zones.map(zone=>{
        for(const root of zone.roots)root.traverse(object=>owned.add(object));
        return {...zone,near:false,active:false,dimmed:new Map()};
    });
    function update(position,suppressed=false) {
        for(const entry of entries) {
            const dx=position.x-entry.center.x,dy=position.y-entry.center.y,dz=position.z-entry.center.z;
            const limit=radius+(entry.near?hysteresis:0);
            entry.near=dx*dx+dy*dy+dz*dz<=limit*limit;
            entry.active=entry.near&&!suppressed;
            for(const root of entry.roots)root.visible=entry.active;
            if(entry.distant)entry.distant.visible=!entry.active;
            for(const light of entry.lights) {
                if(!entry.active) {
                    if(!entry.dimmed.has(light)||light.intensity!==0)entry.dimmed.set(light,light.intensity);
                    light.intensity=0;
                } else if(entry.dimmed.has(light)) {
                    light.intensity=entry.dimmed.get(light);entry.dimmed.delete(light);
                }
            }
        }
    }
    return {update,radius,owns:object=>owned.has(object),isActive:id=>entries.some(entry=>entry.id===id&&entry.active)};
}
