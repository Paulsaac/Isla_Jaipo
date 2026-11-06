import {prepareProgramsInBatches,waitForRenderedFrame} from './render-ready.js';

// Preparar lo que puede aparecer al mirar alrededor del spawn, manteniendo la
// portada visible. No desplaza al jugador ni avanza física, audio o misiones.
export async function prepareStartupViews(THREE,renderer,world,camera,updateVisibility,checkpoint,extraObjects=[]) {
    const rotation=camera.quaternion.clone(),order=camera.rotation.order;
    const base=new THREE.Euler().setFromQuaternion(rotation,'YXZ');
    const angles=[];
    const horizontalFov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*camera.aspect);
    const directions=Math.max(4,Math.ceil(Math.PI*2/(horizontalFov*.75)));
    for(const pitch of [0,-Math.PI/4,Math.PI/4])for(let i=0;i<directions;i++)
        angles.push([base.x+pitch,base.y+i*Math.PI*2/directions]);
    const extraVisibility=extraObjects.map(object=>object.visible);
    const focus=extraObjects.find(object=>object.isSprite);
    if(focus) {
        const view=camera.clone(false);view.lookAt(focus.getWorldPosition(new THREE.Vector3()));
        const angle=new THREE.Euler().setFromQuaternion(view.quaternion,'YXZ');angles.push([angle.x,angle.y,true]);
    }
    const frustum=new THREE.Frustum(),projection=new THREE.Matrix4(),objects=new Set(extraObjects);
    const target=new THREE.WebGLRenderTarget(64,64);
    const previous=renderer.getRenderTarget();
    function face([pitch,yaw]) {
        camera.rotation.set(pitch,yaw,base.z,'YXZ');camera.updateMatrixWorld(true);
        updateVisibility();world.updateMatrixWorld(true);
    }
    try {
        for(const angle of angles) {
            face(angle);
            frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
            world.traverseVisible(object=>{
                if(!object.material||!object.layers.test(camera.layers)||object.isInstancedMesh&&object.count===0)return;
                if(!object.frustumCulled||(object.isSprite?frustum.intersectsSprite(object):frustum.intersectsObject(object)))objects.add(object);
            });
            const pause=checkpoint();if(pause)await pause;
        }
        const visibleObjects=[...objects];
        // La salida normal y la usada por efectos tienen variantes de color distintas.
        await prepareProgramsInBatches(THREE,renderer,world,camera,checkpoint,null,undefined,visibleObjects,4);
        await prepareProgramsInBatches(THREE,renderer,world,camera,checkpoint,target,undefined,visibleObjects,4);
        for(const angle of angles) {
            face(angle);
            try {
                // Compilar no garantiza que el driver haya estrenado su primera pasada.
                if(angle[2]) {
                    extraObjects.forEach(object=>{object.visible=true;});
                    renderer.setRenderTarget(null);renderer.render(world,camera);
                }
                renderer.setRenderTarget(target);renderer.render(world,camera);
            } finally {
                extraObjects.forEach((object,index)=>{object.visible=extraVisibility[index];});
                renderer.setRenderTarget(previous);
            }
            await waitForRenderedFrame(renderer);
            const pause=checkpoint();if(pause)await pause;
        }
        return {views:angles.length,objects:visibleObjects.length};
    } finally {
        extraObjects.forEach((object,index)=>{object.visible=extraVisibility[index];});
        renderer.setRenderTarget(previous);target.dispose();
        camera.rotation.order=order;camera.quaternion.copy(rotation);camera.updateMatrixWorld(true);
        updateVisibility();world.updateMatrixWorld(true);
    }
}
