// Un atlas compartido y una sola malla por pilar: cuatro planos cubren su tapa.
export function createAltarBlueFire(THREE, atlas, unitSize, phase = 0) {
    const positions = [], uvs = [], half = unitSize*0.54, height = unitSize*1.05;
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
    const palette=['#073875','#075e9e','#008bc6','#10bce5','#4bdcf1','#9af3fa','#e1ffff']
        .map(hex=>`vec3(${new THREE.Color(hex).toArray().map(n=>n.toFixed(8)).join(',')})`);
    const pixelColor=THREE.ShaderChunk.map_fragment.replaceAll('vMapUv','fireAtlasUv')
        .replace('diffuseColor *= sampledDiffuseColor;',`
            // Siete colores sólidos, sin ruido de compresión ni bordes semitransparentes.
            float fireValue=sqrt(dot(sampledDiffuseColor.rgb,vec3(0.2126,0.7152,0.0722)));
            vec3 fireColor=${palette[0]};
            ${palette.slice(1).map((color,i)=>`fireColor=mix(fireColor,${color},step(${[.12,.23,.36,.51,.68,.85][i].toFixed(2)},fireValue));`).join('\n')}
            sampledDiffuseColor=vec4(fireColor,step(0.5,sampledDiffuseColor.a));
            diffuseColor *= sampledDiffuseColor;
        `);
    const material = new THREE.MeshBasicMaterial({map:atlas,alphaTest:0.5,
        side:THREE.DoubleSide,fog:true});
    material.onBeforeCompile = shader => {
        shader.uniforms.blueFireFrame = frame;
        shader.fragmentShader = 'uniform float blueFireFrame;\n'+shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',`
            // El PNG contiene cuatro columnas y dos filas, leídas de arriba hacia abajo.
            vec2 fireCell = vec2(mod(blueFireFrame,4.0),1.0-floor(blueFireFrame/4.0));
            // Bases opacas en las filas 410 y 837 del atlas de 887 px.
            // Igual escala y origen para todos los cuadros; excluir residuos inferiores.
            float fireBase = blueFireFrame<4.0 ? 66.0/887.0 : 99.0/887.0;
            // Misma cuadrícula de 32×32 y mismo tamaño de píxel en los ocho cuadros.
            vec2 firePixel=(floor(clamp(vMapUv,0.0,0.99999)*32.0)+0.5)/32.0;
            vec2 fireLocal = vec2(mix(0.02,0.98,firePixel.x),fireBase+firePixel.y*0.87);
            vec2 fireAtlasUv = (fireCell+fireLocal)/vec2(4.0,2.0);
            ${pixelColor}
        `);
    };
    material.customProgramCacheKey = () => 'altar-blue-fire-pixel-grid-v3';
    const flame = new THREE.Mesh(geometry,material);
    flame.visible = false;
    flame.userData = {visibilityEnabled:false,blueFireFrame:frame,blueFirePhase:phase};
    return flame;
}

export function updateAltarBlueFire(flame, time) {
    flame.userData.blueFireFrame.value = Math.floor(time*10+flame.userData.blueFirePhase)%8;
}
