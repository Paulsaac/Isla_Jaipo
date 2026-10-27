import { createTorchModel } from '../world/torch-model.js';

// La antorcha tridimensional del inventario, situada en la mano izquierda.
export function createHeldTorch(THREE, frames, camera) {
    const {object, flame, updateFrame} = createTorchModel(THREE, frames);
    object.name = 'held-torch-left';
    object.renderOrder = 1000;
    object.visible = false;
    camera.add(object);

    return {
        object,
        update(frameIndex, visible, lit) {
            object.visible = visible && lit;
            flame.visible = visible && lit;
            updateFrame(frameIndex);
            const distance = 0.68;
            const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
            const halfWidth = halfHeight * camera.aspect;
            const height = Math.min(0.52, halfHeight * 1.05);
            const scale = height / 2.68;
            const width = 0.72 * scale;
            const edgePadding = Math.min(0.04, halfWidth * 0.08);
            object.scale.setScalar(scale);
            object.position.set(-halfWidth + width * 0.52 + edgePadding,
                -halfHeight + scale + Math.min(0.035, halfHeight * 0.08), -distance);
            object.rotation.set(0, 0, 0.18);
        }
    };
}
