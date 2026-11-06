import {createLoadingYield} from '../ui/loading-yield.js';
import {prepareProgramsInBatches,waitForRenderedFrame} from '../ui/render-ready.js';

// Contenido inaccesible al inicio. La entrada espera su preparación; las visitas
// posteriores reutilizan exactamente los mismos modelos, texturas y colisiones.
export function createLakeRoomDetails(THREE,renderer,scene,metalRoom,{loader,textures,prepareMaterials,onReady}) {
    let pending=null,ready=false,contents=null;
    async function build() {
        const checkpoint=createLoadingYield(3);
        if(!contents) {
            const [{createLakeAquarium},{createModularSynthRacksAsync}]=await Promise.all([
                import('./lake-aquarium.js'),import('./modular-synth-racks.js')
            ]);
            const aquarium=await createLakeAquarium(THREE,loader,metalRoom.aquariumLayout,textures,metalRoom.room.position);
            const racks=await createModularSynthRacksAsync(THREE,textures.wood,checkpoint);
            contents={aquarium,racks};
            metalRoom.room.add(aquarium.group,racks.group);
            metalRoom.setFurnitureBounds(racks.bounds);
            prepareMaterials([aquarium.group,racks.group]);
        }
        const view=new THREE.PerspectiveCamera(70,1,.1,60);
        view.position.copy(metalRoom.spawn);view.lookAt(view.position.x,view.position.y,view.position.z-10);
        view.updateMatrixWorld(true);scene.updateMatrixWorld(true);
        const objects=[];
        metalRoom.room.traverse(object=>{if(object.material)objects.push(object);});
        const target=new THREE.WebGLRenderTarget(64,64);
        try {
            // Preparar tanto la salida normal como la usada por los lentes.
            await prepareProgramsInBatches(THREE,renderer,scene,view,checkpoint,null,undefined,objects,2);
            await prepareProgramsInBatches(THREE,renderer,scene,view,checkpoint,target,undefined,objects,2);
            const maps=new Set();
            for(const object of objects)for(const material of [object.material].flat())
                for(const value of Object.values(material))if(value?.isTexture)maps.add(value);
            for(const map of maps){renderer.initTexture(map);const pause=checkpoint();if(pause)await pause;}
            // Subir una malla por tanda: el gabinete completo concentra muchos
            // buffers. Restaurar la escena antes de ceder al siguiente fotograma.
            const visibility=objects.map(object=>object.visible);
            for(const object of objects) {
                if(!object.geometry||!object.visible)continue;
                const previous=renderer.getRenderTarget(),visible=metalRoom.room.visible,culled=object.frustumCulled;
                try {
                    objects.forEach(other=>{other.visible=other===object;});
                    object.frustumCulled=false;metalRoom.room.visible=true;
                    renderer.setRenderTarget(target);renderer.render(scene,view);
                } finally {
                    objects.forEach((other,i)=>{other.visible=visibility[i];});
                    object.frustumCulled=culled;metalRoom.room.visible=visible;renderer.setRenderTarget(previous);
                }
                const pause=checkpoint();if(pause)await pause;
            }
            await waitForRenderedFrame(renderer);
        } finally {target.dispose();}
        onReady(contents);ready=true;
        return contents;
    }
    return {get ready(){return ready;},prepare(){
        if(ready)return Promise.resolve(contents);
        if(!pending)pending=build().catch(error=>{pending=null;throw error;});
        return pending;
    }};
}
