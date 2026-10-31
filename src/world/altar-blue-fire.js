// Un atlas compartido y una sola malla por pilar: cuatro planos cubren su tapa.
export function createAltarBlueFire(THREE, atlas, unitSize, phase = 0) {
    const positions = [], uvs = [], half = unitSize*0.54, height = half*2*30/32;
    function panel(corners) {
        const coords = [[0,0],[1,0],[0,1],[1,1]];
        for (const index of [0,1,2,2,1,3]) {
            positions.push(...corners[index]); uvs.push(...coords[index]);
        }
    }
    for (const offset of [-unitSize*0.32,unitSize*0.32]) {
        panel([[-half,0,offset],[half,0,offset],[-half,height,offset],[half,height,offset]]);
        panel([[offset,0,-half],[offset,0,half],[offset,height,-half],[offset,height,half]]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const frame = {value:phase%8};
    const material = new THREE.MeshBasicMaterial({map:atlas,alphaTest:0.5,
        side:THREE.DoubleSide,fog:true});
    material.onBeforeCompile = shader => {
        shader.uniforms.blueFireFrame = frame;
        shader.fragmentShader = 'uniform float blueFireFrame;\n'+shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',`
            // Atlas nativo 128×64: ocho cuadros exactos de 32×32.
            vec2 fireCell = vec2(mod(blueFireFrame,4.0),1.0-floor(blueFireFrame/4.0));
            // Excluir las dos filas vacías inferiores al apoyar la llama.
            // La altura del plano mantiene los píxeles cuadrados, sin estirarlos.
            vec2 firePixel=floor(clamp(vMapUv,0.0,0.99999)*vec2(32.0,30.0));
            vec2 fireLocal = (firePixel+vec2(0.5,2.5))/32.0;
            vec2 fireAtlasUv = (fireCell+fireLocal)/vec2(4.0,2.0);
            ${THREE.ShaderChunk.map_fragment.replaceAll('vMapUv','fireAtlasUv')}
        `);
    };
    material.customProgramCacheKey = () => 'altar-blue-fire-native-pixels-v4';
    const flame = new THREE.Mesh(geometry,material);
    flame.visible = false;
    flame.userData = {visibilityEnabled:false,blueFireFrame:frame,blueFirePhase:phase};
    return flame;
}

export function updateAltarBlueFire(flame, time) {
    flame.userData.blueFireFrame.value = Math.floor(time*10+flame.userData.blueFirePhase)%8;
}
