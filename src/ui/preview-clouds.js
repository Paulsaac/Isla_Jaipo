// Velo 2D de portada, fijo al encuadre y compatible con el worker de la maqueta.
export function createPreviewClouds(THREE) {
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const material = new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
        uniforms: { time: { value: 0 }, aspect: { value: 1 }, orbitAngle: { value: 0 },
            viewTilt: { value: Math.PI * 0.27 }, halfFov: { value: Math.PI / 9 }, passage: { value: 0 },
            visibility: { value: 1 }, opacity: { value: 0.48 } },
        vertexShader: `
            varying vec2 cloudUv;
            void main() {
                cloudUv = position.xy * 0.5 + 0.5;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }`,
        fragmentShader: `
            varying vec2 cloudUv;
            uniform float time;
            uniform float aspect;
            uniform float orbitAngle;
            uniform float viewTilt;
            uniform float halfFov;
            uniform float opacity;
            uniform float passage;
            uniform float visibility;
            float hash(vec2 p) {
                vec3 q = fract(vec3(p.xyx) * 0.1031);
                q += dot(q, q.yzx + 33.33);
                return fract((q.x + q.y) * q.z);
            }
            float noise(vec2 p) {
                vec2 cell = floor(p), f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(cell), hash(cell + vec2(1,0)), f.x),
                    mix(hash(cell + vec2(0,1)), hash(cell + vec2(1,1)), f.x), f.y);
            }
            void main() {
                vec2 screen = (cloudUv - 0.5) * 2.0;
                // Proyección de un dibujo inclinado con la misma vista de la isla.
                // Arriba: más distancia/detalle pequeño; abajo: nubes más cercanas.
                float tiltSin = max(0.25, sin(viewTilt));
                float perspective = max(0.35, 1.0 - screen.y * tan(halfFov) * cos(viewTilt) / tiltSin);
                // Una extensión2.4× mayor simula una capa más distante y cercana a la isla.
                vec2 p = vec2(screen.x * aspect, screen.y / tiltSin) * 3.6 / perspective;
                // Zoom centrado en pantalla: no elegir ni perseguir manchas de nube.
                p *= mix(1.0, 0.10, passage);
                // Deriva en pantalla; el dibujo gira con la órbita de la isla.
                p -= vec2(0.045, 0.045) * time;
                float c = cos(orbitAngle), s = sin(orbitAngle);
                p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
                // Cuadrícula en el dibujo: los bordes escalonados giran con el velo.
                p = (floor(p * 12.0) + 0.5) / 12.0;
                // Deformar el dibujo rompe las franjas: grupos, remolinos y jirones.
                vec2 flow = p * 2.3;
                vec2 warp = vec2(noise(flow * 0.65 + 7.0), noise(flow * 0.65 + 29.0)) - 0.5;
                flow += warp * 0.8;
                vec2 crossed = vec2(flow.x * 0.8 - flow.y * 0.6, flow.x * 0.6 + flow.y * 0.8);
                // Masas amplias y pequeñas nubes sueltas, con mezcla variable por zona.
                float largeCloud = noise(crossed * 0.32 + 43.0);
                float smallCloud = noise(flow + 11.0) * 0.60
                    + noise(crossed * 1.73 + 19.0) * 0.25
                    + noise(flow * 3.67 + 31.0) * 0.15;
                float grouping = smoothstep(0.40, 0.76, largeCloud);
                float cloud = mix(smallCloud, largeCloud, grouping * 0.70);
                float density = smoothstep(0.47, 0.81, cloud);
                density = floor(density * 5.0 + 0.5) / 5.0;
                // Mantener variaciones del dibujo incluso cuando cubre todo el encuadre.
                vec3 color = mix(vec3(0.84, 0.88, 0.92), vec3(1.0), cloud);
                float alpha = density * opacity * visibility;
                gl_FragColor = vec4(color, alpha);
            }`
    });
    // Un solo triángulo sobredimensionado: no hay arista diagonal entre dos caras.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1,-1,0, 3,-1,0, -1,3,0], 3));
    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    scene.add(quad);
    let passageTime = -1;
    return {
        update(delta, aspect, reduced, arrivalProgress, orbitAngle = 0, viewTilt = Math.PI * 0.27, fov = 40, loadingSeconds = -1) {
            if (!reduced) material.uniforms.time.value += delta;
            material.uniforms.aspect.value = aspect;
            material.uniforms.orbitAngle.value = orbitAngle;
            material.uniforms.viewTilt.value = viewTilt;
            material.uniforms.halfFov.value = fov * Math.PI / 360;
            // Reloj propio: continúa aunque la carga termine y comience la llegada.
            if (loadingSeconds >= 0 && passageTime < 0) passageTime = 0;
            if (passageTime >= 0) passageTime += delta;
            const passage = passageTime < 0 ? 0 : THREE.MathUtils.smoothstep(passageTime, 0, 6);
            material.uniforms.passage.value = reduced ? 0 : passage;
            material.uniforms.opacity.value = 0.48;
            // Mantener la capa distante durante más carga; sin acercamiento explosivo.
            material.uniforms.visibility.value = passageTime < 0 ? 1
                : 1 - THREE.MathUtils.smoothstep(passageTime, 6.2, 7.2);
        },
        render(renderer) {
            if (material.uniforms.visibility.value <= 0.005) return;
            const autoClear = renderer.autoClear;
            renderer.autoClear = false;
            renderer.render(scene, camera);
            renderer.autoClear = autoClear;
        },
        dispose() { scene.remove(quad); geometry.dispose(); material.dispose(); }
    };
}
