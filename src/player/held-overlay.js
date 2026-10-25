// Una pasada independiente para objetos en mano: el mundo nunca puede taparlos.
export function createHeldOverlay(THREE, renderer, view, {ambientLight, directionalLight, torchLight} = {}) {
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    group.name = 'held-items-overlay';
    scene.add(group);
    // La proyección de la mano se conserva mientras cambia el zoom del mundo.
    const camera = new THREE.PerspectiveCamera(view.fov, view.aspect, 0.01, 10);
    const ambient = new THREE.AmbientLight(0xffffff, 0);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0);
    scene.add(directional);
    const torch = new THREE.PointLight(0xff8800, 0, 45, 1);
    scene.add(torch);
    const inverseViewRotation = new THREE.Quaternion();
    const lightDirection = new THREE.Vector3();
    return {
        group,
        prepare(preparePrograms) {
            // La mano tiene su propia escena y luces; compilar el mundo no la cubre.
            return preparePrograms(scene, camera, null);
        },
        render() {
            if (!group.children.some(object => object.visible)) return;
            if (ambientLight) {
                ambient.color.copy(ambientLight.color);
                ambient.intensity = ambientLight.intensity;
            }
            if (directionalLight) {
                directional.color.copy(directionalLight.color);
                directional.intensity = directionalLight.intensity;
                view.updateWorldMatrix(true, false);
                inverseViewRotation.copy(view.getWorldQuaternion(new THREE.Quaternion())).invert();
                directionalLight.getWorldDirection(lightDirection).negate().applyQuaternion(inverseViewRotation);
                directional.position.copy(lightDirection).multiplyScalar(10);
            }
            if (torchLight) {
                torch.color.copy(torchLight.color);
                torch.intensity = torchLight.intensity;
                torch.distance = torchLight.distance;
                torch.decay = torchLight.decay;
                torch.position.copy(torchLight.position);
            }
            if (camera.aspect !== view.aspect) {
                camera.aspect = view.aspect;
                camera.updateProjectionMatrix();
            }
            const autoClear = renderer.autoClear, autoReset = renderer.info.autoReset;
            try {
                renderer.autoClear = false;
                renderer.info.autoReset = false;
                // En r160 clearDepth respeta la máscara dejada por los transparentes del mundo.
                renderer.state.buffers.depth.setMask(true);
                renderer.clearDepth();
                renderer.render(scene, camera);
            } finally {
                renderer.autoClear = autoClear;
                renderer.info.autoReset = autoReset;
            }
        }
    };
}
