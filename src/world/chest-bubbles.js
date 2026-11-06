// Ráfaga breve: un solo dibujo y buffers reutilizados, sin luces adicionales.
export function createChestBubbles(THREE, surfaceHeight) {
    const count = 32, duration = 1.8;
    const positions = new Float32Array(count * 3), sizes = new Float32Array(count), fades = new Float32Array(count);
    const starts = new Float32Array(count * 3), speeds = new Float32Array(count), lifetimes = new Float32Array(count);
    const phases = new Float32Array(count), delays = new Float32Array(count);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('bubbleSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('bubbleFade', new THREE.BufferAttribute(fades, 1).setUsage(THREE.DynamicDrawUsage));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(170,224,241,0.85)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(16,16,11,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(151,213,236,0.08)'; ctx.fill();
    ctx.strokeStyle = 'rgba(245,253,255,1)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(16,16,8.5,Math.PI*1.06,Math.PI*1.48); ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.LinearFilter;
    const material = new THREE.PointsMaterial({map:texture,color:0xe5f7ff,size:1,
        transparent:true,opacity:.85,alphaTest:.01,depthWrite:false,fog:true});
    material.onBeforeCompile = shader => {
        shader.vertexShader = 'attribute float bubbleSize; attribute float bubbleFade; varying float vBubbleFade;\n'+shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBubbleFade=bubbleFade;')
            .replace('gl_PointSize = size;', 'gl_PointSize = size * bubbleSize;');
        shader.fragmentShader = 'varying float vBubbleFade;\n'+shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', 'diffuseColor.a*=vBubbleFade;\n#include <alphatest_fragment>');
    };
    material.customProgramCacheKey = () => 'chest-bubbles-v1';
    const points = new THREE.Points(geometry, material);
    points.name = 'sunken-chest-bubbles'; points.visible = false; points.frustumCulled = false;
    const origin = new THREE.Vector3();
    let elapsed = duration, startedAt = 0;
    function reset() { elapsed = duration; points.visible = false; }
    function update() {
        if (!points.visible) return;
        // El primer delta del juego puede incluir tiempo anterior a la apertura.
        elapsed = Math.max(0,(performance.now()-startedAt)/1000);
        if (elapsed >= duration) { reset(); return; }
        for (let i=0;i<count;i++) {
            const t=Math.max(0,elapsed-delays[i]), j=i*3;
            positions[j]=starts[j]+Math.sin(t*7+phases[i])*.12*t;
            positions[j+1]=starts[j+1]+speeds[i]*t;
            positions[j+2]=starts[j+2]+Math.cos(t*6+phases[i])*.12*t;
            fades[i]=elapsed<delays[i]||positions[j+1]>=surfaceHeight ? 0
                : Math.min(1,t/.06)*Math.max(0,Math.min(1,(lifetimes[i]-t)/.3));
        }
        geometry.attributes.position.needsUpdate = geometry.attributes.bubbleFade.needsUpdate = true;
    }
    return {points, reset, get active(){return points.visible;}, burst(chest) {
        chest.updateWorldMatrix(true,false);
        chest.localToWorld(origin.set(0,.05,0));
        for(let i=0;i<count;i++) {
            const j=i*3;
            starts[j]=origin.x+(Math.random()-.5)*.42;
            starts[j+1]=origin.y+(Math.random()-.5)*.12;
            starts[j+2]=origin.z+(Math.random()-.5)*.6;
            sizes[i]=.09+Math.random()*.14;
            speeds[i]=3.2+Math.random()*2;
            lifetimes[i]=1.05+Math.random()*.55;
            phases[i]=Math.random()*Math.PI*2; delays[i]=i*.005;
        }
        geometry.attributes.bubbleSize.needsUpdate = true;
        elapsed=0; startedAt=performance.now(); points.visible=true; update();
    }, update};
}
