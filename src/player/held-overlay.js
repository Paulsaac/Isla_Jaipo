// Una pasada independiente para objetos en mano: el mundo nunca puede taparlos.
export function createHeldOverlay(THREE, renderer, view) {
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    group.name = 'held-items-overlay';
    scene.add(group);
    // La proyección de la mano se conserva mientras cambia el zoom del mundo.
    const camera = new THREE.PerspectiveCamera(view.fov, view.aspect, 0.01, 10);
    scene.add(new THREE.HemisphereLight(0xd8f1ff, 0x303447, 1.5));
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(-1, 2, 3);
    scene.add(light);
    return {
        group,
        prepare(preparePrograms) {
            // La mano tiene su propia escena y luces; compilar el mundo no la cubre.
            return preparePrograms(scene, camera, null);
        },
        render() {
            if (!group.children.some(object => object.visible)) return;
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
