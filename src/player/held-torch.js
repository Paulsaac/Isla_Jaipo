import { createTorchModel } from '../world/torch-model.js';

// La antorcha tridimensional del inventario, situada en la mano izquierda.
export function createHeldTorch(THREE, frames, camera) {
    const {object, flame, updateFrame} = createTorchModel(THREE, frames);
    // Recortar solo la base que queda bajo la tapa inclinada. La llama
    // conserva su anclaje, tamaño y orientación frontal originales.
    flame.material.onBeforeCompile=shader=>{
        shader.vertexShader='varying float vTorchCapClearance;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('gl_Position = projectionMatrix * mvPosition;',`
            vec2 torchUp=normalize(modelViewMatrix[1].xy);
            vTorchCapClearance=dot(rotatedPosition,torchUp)-scale.y*(.030/.96);
            gl_Position = projectionMatrix * mvPosition;
        `);
        shader.fragmentShader='varying float vTorchCapClearance;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
            #include <alphatest_fragment>
            if(vTorchCapClearance<0.0)discard;
        `);
    };
    flame.material.customProgramCacheKey=()=> 'held-torch-cap-trim-v1';
    object.name = 'held-torch-left';
    object.renderOrder = 1000;
    object.visible = false;
    camera.add(object);

    return {
        object,
        update(frameIndex, visible, lit) {
            object.visible = visible;
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
