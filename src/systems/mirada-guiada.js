// Mirada guiada: gira suavemente una cámara desde su orientación actual hacia un objetivo.
// Uso: const mirada=createGuidedLook(THREE); mirada.begin(camera,target); mirada.update(progreso);
export function createGuidedLook(THREE) {
    const startRotation=new THREE.Quaternion();
    const targetRotation=new THREE.Quaternion();
    const lookMatrix=new THREE.Matrix4();
    let camera=null;

    return {
        get active() { return camera!==null; },
        begin(nextCamera,target) {
            if(!nextCamera||!target)return false;
            camera=nextCamera;
            startRotation.copy(camera.quaternion);
            lookMatrix.lookAt(camera.position,target,camera.up);
            targetRotation.setFromRotationMatrix(lookMatrix);
            return true;
        },
        update(progress) {
            if(!camera)return;
            const t=Math.max(0,Math.min(1,progress));
            camera.quaternion.slerpQuaternions(startRotation,targetRotation,t*t*(3-2*t));
            if(t===1)camera=null;
        },
        cancel() { camera=null; }
    };
}
