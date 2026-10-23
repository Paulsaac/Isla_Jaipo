import { waitForRenderedFrame } from './render-ready.js';
import { createPreviewClouds } from './preview-clouds.js';

// Azul de referencia: promedio de Agua1_niebla.png del mundo jugable.
const SEA_COLOR = 0x0172b4;
const LOADING_ZOOM_RATE = -Math.log(0.94); // Distancia restante ×0.94 cada segundo.
const APPROACH_ORBIT_SECONDS = 8; // Referencia para calcular la aceleración; no limita velocidad.
const IDLE_ORBIT_SPEED = Math.PI * 2 / 90;
const ORBIT_ACCELERATION_SECONDS = 8;
const ORBIT_ACCELERATION = 0.5 * (Math.PI * 2 / APPROACH_ORBIT_SECONDS - IDLE_ORBIT_SPEED) / ORBIT_ACCELERATION_SECONDS;
function loadingOrbitSpeed(seconds) {
    return IDLE_ORBIT_SPEED + ORBIT_ACCELERATION * Math.max(0, seconds);
}
function loadingOrbitAngle(seconds) {
    const elapsed = Math.max(0, seconds);
    return IDLE_ORBIT_SPEED * elapsed + 0.5 * ORBIT_ACCELERATION * elapsed * elapsed;
}
const ARRIVAL_SECONDS = 2.4;

function readSavedModel(buffer) {
    const view = new DataView(buffer);
    if (buffer.byteLength < 36 || view.getUint32(0, true) !== 0x324d4a49) {
        throw new Error('La maqueta de la isla tiene un formato inválido.');
    }
    const [width, depth, vertexCount, indexCount, treeCount, roofCount, homeX, homeZ] =
        Array.from({ length: 8 }, (_, i) => view.getUint32(4 + i * 4, true));
    const expected = 36 + vertexCount * 12 + vertexCount * 3 + indexCount * 4
        + treeCount * 16 + roofCount * 20;
    if (width < 1 || depth < 1 || vertexCount > 250000 || indexCount > 500000
        || treeCount > 50000 || roofCount > 10000 || buffer.byteLength !== expected) {
        throw new Error('La maqueta de la isla está incompleta.');
    }
    let offset = 36;
    const positions = new Float32Array(buffer.slice(offset, offset += vertexCount * 12));
    const colors = new Uint8Array(buffer.slice(offset, offset += vertexCount * 3));
    const indices = new Uint32Array(buffer.slice(offset, offset += indexCount * 4));
    const trees = new Float32Array(buffer.slice(offset, offset += treeCount * 16));
    const roofs = new Float32Array(buffer.slice(offset, offset += roofCount * 20));
    return { width, depth, positions, colors, indices, trees, roofs, homeX, homeZ };
}

export async function createIslandPreviewRenderer(THREE, options) {
    const response = await fetch(options.modelUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`No se pudo cargar la maqueta guardada (${response.status}).`);
    const model = readSavedModel(await response.arrayBuffer());
    const renderer = new THREE.WebGLRenderer({
        canvas: options.canvas, antialias: true, powerPreference: 'low-power'
    });
    let viewWidth = options.width, viewHeight = options.height;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SEA_COLOR);
    scene.add(new THREE.AmbientLight(0xffffff, 1.45));
    const sun = new THREE.DirectionalLight(0xffeed5, 1.1);
    sun.position.set(-140, 260, -100);
    scene.add(sun);
    const ground = new THREE.BufferGeometry();
    ground.setAttribute('position', new THREE.BufferAttribute(model.positions, 3));
    ground.setAttribute('color', new THREE.BufferAttribute(model.colors, 3, true));
    ground.setIndex(new THREE.BufferAttribute(model.indices, 1));
    ground.computeVertexNormals();
    const groundMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    scene.add(new THREE.Mesh(ground, groundMaterial));
    // Mar debajo de la costa: sin escribir profundidad para evitar competir con el terreno distante.
    const seaMaterial = new THREE.ShaderMaterial({
        uniforms: { seaColor: { value: new THREE.Color(SEA_COLOR) }, seaTime: { value: 0 },
            islandCenter: { value: new THREE.Vector2(model.width/2,model.depth/2) },
            islandSize: { value: Math.max(model.width,model.depth) } },
        depthWrite: false,
        vertexShader: `varying vec3 seaPosition;
            void main() {
                vec4 world = modelMatrix * vec4(position,1.0);
                seaPosition = world.xyz;
                gl_Position = projectionMatrix * viewMatrix * world;
            }`,
        fragmentShader: `uniform vec3 seaColor;
            uniform float seaTime;
            uniform vec2 islandCenter;
            uniform float islandSize;
            varying vec3 seaPosition;
            void main() {
                vec2 p = seaPosition.xz;
                vec3 normal = normalize(vec3(
                    0.055*sin(p.x*0.19+p.y*0.11+seaTime*0.8), 1.0,
                    0.04*cos(p.y*0.27-p.x*0.08-seaTime*0.65)));
                vec3 view = normalize(cameraPosition-seaPosition);
                vec3 light = normalize(vec3(-140.0,260.0,-100.0));
                float shine = max(dot(normal,normalize(light+view)),0.0);
                float broad = pow(shine,28.0);
                float ripple = 0.5+0.5*sin(p.x*0.73+p.y*0.91+seaTime*1.1);
                float sparkle = pow(shine,150.0)*smoothstep(0.65,0.98,ripple);
                // Halo circular anclado a la isla, con caída suave hacia el mar abierto.
                float ringDistance = (length(p-islandCenter)/islandSize-0.6624)/0.1872;
                float ring = exp(-ringDistance*ringDistance*2.0);
                // Foco viajero: una vuelta suave cada 35 segundos, siempre dentro del halo.
                float focusAngle = -seaTime*0.18+2.4;
                vec2 focusPosition = islandCenter+vec2(cos(focusAngle),sin(focusAngle))*islandSize*0.6624;
                vec2 focusOffset = (p-focusPosition)/(islandSize*0.135);
                float spotlight = exp(-dot(focusOffset,focusOffset)*1.5);
                vec3 reflected = ring*(vec3(1.0,0.89,0.68)*0.015
                    +vec3(1.0,0.74,0.25)*spotlight*(0.28+broad*0.25+sparkle*0.6));
                gl_FragColor = vec4(seaColor+reflected,1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(model.width,model.depth)*16,
        Math.max(model.width,model.depth)*16),seaMaterial);
    sea.rotation.x = -Math.PI/2;
    sea.position.set(model.width/2,0,model.depth/2);
    sea.renderOrder = -1;
    scene.add(sea);

    const canopyGeometry = new THREE.ConeGeometry(2.15, 8.5, 5);
    const trunkGeometry = new THREE.CylinderGeometry(0.22, 0.29, 2.2, 5);
    const canopy = new THREE.InstancedMesh(canopyGeometry,
        new THREE.MeshLambertMaterial({ color: 0x315c38, flatShading: true }), model.trees.length / 4);
    const trunks = new THREE.InstancedMesh(trunkGeometry,
        new THREE.MeshLambertMaterial({ color: 0x584632, flatShading: true }), model.trees.length / 4);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < model.trees.length / 4; i++) {
        const [x, y, z, scale] = model.trees.subarray(i * 4, i * 4 + 4);
        dummy.position.set(x, y + 5.0 * scale, z);
        dummy.scale.setScalar(scale);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        canopy.setMatrixAt(i, dummy.matrix);
        dummy.position.y = y + 1.1 * scale;
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
    }
    canopy.instanceMatrix.needsUpdate = trunks.instanceMatrix.needsUpdate = true;
    scene.add(canopy, trunks);

    // Reutilizar los materiales originales con mipmaps para que no parpadeen en la órbita.
    const houseTextures = await Promise.all(['muro.png', 'techo.jpg', 'puerta.png'].map(async name => {
        const texture = await options.loadTexture(name);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        return texture;
    }));
    const wallMaterial = new THREE.MeshLambertMaterial({ map: houseTextures[0], color: 0xc5c4bc });
    const roofMaterial = new THREE.MeshLambertMaterial({ map: houseTextures[1], color: 0xb5bdc3 });
    const doorMaterial = new THREE.MeshLambertMaterial({ map: houseTextures[2] });
    const trimMaterial = new THREE.MeshLambertMaterial({ color: 0x584632 });
    function tileBox(geometry) {
        const uv = geometry.attributes.uv, pos = geometry.attributes.position, normal = geometry.attributes.normal;
        for (let i = 0; i < uv.count; i++) {
            uv.setXY(i, (Math.abs(normal.getX(i)) > 0.5 ? pos.getZ(i) : pos.getX(i)) / 3,
                (Math.abs(normal.getY(i)) > 0.5 ? pos.getZ(i) : pos.getY(i)) / 3);
        }
        return geometry;
    }
    function hipRoof(width, depth, rise) {
        const x = width / 2, z = depth / 2;
        const inset = Math.min(3, x * 0.85, z * 0.85);
        const bottom = [[-x,0,-z],[x,0,-z],[x,0,z],[-x,0,z]];
        const top = [[-x+inset,rise,-z+inset],[x-inset,rise,-z+inset],
            [x-inset,rise,z-inset],[-x+inset,rise,z-inset]];
        const positions = [], uvs = [];
        function face(points) {
            for (const i of [0,2,1,0,3,2]) {
                const p = points[i];
                positions.push(...p);
                // Trama de tejas en todas las vertientes y en la meseta superior.
                uvs.push(p[0] / 3, p[2] / 3);
            }
        }
        face(top);
        for (let i = 0; i < 4; i++) {
            const j = (i+1)%4;
            face([bottom[i],bottom[j],top[j],top[i]]);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
        geometry.computeVertexNormals();
        return geometry;
    }
    let homeFloor = 1;
    for (let i = 0; i < model.roofs.length; i += 5) {
        const [x, z, width, depth, y] = model.roofs.subarray(i, i + 5);
        if (model.homeX >= x && model.homeX < x + width
            && model.homeZ >= z && model.homeZ < z + depth) homeFloor = y;
        const centerX = x + (width - 1) / 2, centerZ = z + (depth - 1) / 2;
        const wallHeight = 4.5;
        const walls = new THREE.Mesh(tileBox(new THREE.BoxGeometry(width-1.6,wallHeight,depth-1.6)),wallMaterial);
        walls.position.set(centerX,y+wallHeight/2,centerZ);
        const eaves = new THREE.Mesh(tileBox(new THREE.BoxGeometry(width,0.35,depth)),trimMaterial);
        eaves.position.set(centerX,y+wallHeight,centerZ);
        const roof = new THREE.Mesh(hipRoof(width,depth,Math.min(4.3,Math.min(width,depth)*0.42)),roofMaterial);
        roof.position.set(centerX,y+wallHeight+0.15,centerZ);
        const door = new THREE.Mesh(new THREE.PlaneGeometry(1.5,2.8),doorMaterial);
        door.position.set(centerX,y+1.4,centerZ+depth/2-0.79);
        const house = new THREE.Group();
        house.position.set(centerX,y,centerZ);
        for (const part of [walls,eaves,roof,door]) {
            part.position.sub(house.position);
            house.add(part);
        }
        house.scale.setScalar(0.85);
        scene.add(house);
    }

    const clouds = createPreviewClouds(THREE);
    const camera = new THREE.PerspectiveCamera(40, options.width / options.height, 0.03, 4000);
    // El negro pertenece al mismo render que la maqueta: no puede adelantarse
    // desde el DOM a un fotograma OffscreenCanvas aún pendiente en Firefox.
    const fadeScene = new THREE.Scene();
    const fadeCamera = new THREE.Camera();
    const fadeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true,
        opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
    const fadeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMaterial);
    fadeQuad.frustumCulled = false;
    fadeScene.add(fadeQuad);
    await renderer.compileAsync(fadeScene, fadeCamera);
    const center = new THREE.Vector3(model.width / 2, 15, model.depth / 2);
    const destination = new THREE.Vector3(model.homeX, homeFloor + 1.5, model.homeZ);
    const target = center.clone();
    const reduced = options.reduced;
    const smooth = t => t * t * (3 - 2 * t);
    let angle = 0, loadingTime = -1, arrival = -1, lastTime = 0, finished = false;
    let loadingFocus = 0, loadingScale = 1;
    let arrivalScale = 1, arrivalLogVelocity = 0, arrivalAngle = 0;
    let arrivalSouthAngle = 0;
    let fadeTime = -1;
    let arrivalOrbitSpeed = IDLE_ORBIT_SPEED;
    let lastCameraReport = -Infinity;
    let resolveArrival, rejectArrival;
    const arrivalDone = new Promise((resolve, reject) => { resolveArrival = resolve; rejectArrival = reject; });
    arrivalDone.catch(() => {});
    let lastWidth = 0, lastHeight = 0;
    let loadingFrames = 0, maxLoadingGap = 0;
    let nextPreviewFrame = performance.now();
    const runFrame = (callback, time) => {
        Promise.resolve(callback(time)).catch(error => {
            finished = true;
            rejectArrival(error);
            options.onError?.(error);
        });
    };
    const schedule = callback => {
        if (!options.independentClock && typeof requestAnimationFrame === 'function') {
            return requestAnimationFrame(time => runFrame(callback, time));
        }
        // El worker conserva su propio pulso aunque el documento esté construyendo
        // el mundo: su animación no depende del RAF de la ventana propietaria.
        const now = performance.now();
        nextPreviewFrame = Math.max(nextPreviewFrame + 1000 / 60, now + 1);
        return setTimeout(() => runFrame(callback, performance.now()), nextPreviewFrame - now);
    };
    async function frame(time) {
        if (finished) return;
        // Tiempo de fotogramas dibujados: una pausa no salta de golpe el trayecto.
        const delta = lastTime ? Math.min(1 / 30, Math.max(0, (time - lastTime) / 1000)) : 0;
        if (loadingTime >= 0 && arrival < 0) {
            loadingFrames++;
            if (lastTime) maxLoadingGap = Math.max(maxLoadingGap,time-lastTime);
        }
        lastTime = time;
        if (fadeTime >= 0) fadeTime += delta;
        const width = Math.max(1, viewWidth), height = Math.max(1, viewHeight);
        if (width !== lastWidth || height !== lastHeight) {
            lastWidth = width; lastHeight = height;
            renderer.setPixelRatio(Math.min(1, Math.sqrt(1920 * 1080 / (width * height))));
            renderer.setSize(width, height, false);
        }
        const aspect = width / height;
        const fullHeight = Math.max(model.depth * 0.65, model.width / (2 * aspect) * 1.12);
        // Mantener el giro durante la carga y la llegada hasta la casa.
        if (!reduced && arrival < 0) angle += loadingTime < 0 ? delta * IDLE_ORBIT_SPEED
            : loadingOrbitAngle(loadingTime + delta) - loadingOrbitAngle(loadingTime);
        if (loadingTime >= 0 && arrival < 0) {
            loadingTime += delta;
            // Acercamiento suave y uniforme: distancia reducida6% por segundo, sin
            // desaceleración hacia un límite que parezca una parada intermedia.
            loadingScale = Math.exp(-LOADING_ZOOM_RATE * loadingTime);
        }
        if (arrival >= 0) {
            arrival += delta;
        }
        // La preferencia reduce la órbita automática; el viaje solicitado por Enter
        // conserva su zoom final para no sustituirlo por un corte a negro.
        const duration = ARRIVAL_SECONDS;
        const travel = arrival < 0 ? 0 : Math.min(1, arrival / duration);
        const progress = smooth(travel);
        if (arrival >= 0) {
            // Continuar el giro sin salto y llegar desde el sur (+Z), mirando al norte.
            angle = reduced ? arrivalSouthAngle
                : arrivalAngle + (arrivalSouthAngle - arrivalAngle) * progress
                    + arrivalOrbitSpeed * duration * travel * (1 - travel) * (1 - travel);
        }
        const fullDistance = fullHeight / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        // Terminar bajo la cubierta de la casa, no con una vista del tejado.
        const finalDistance = 2.5;
        const finalScale = finalDistance / fullDistance;
        // Hermite en escala logarítmica: conserva la velocidad de la carga al
        // entrar al viaje final, sin reiniciarla a cero ni saltar de encuadre.
        const scale = arrival < 0 ? loadingScale
            : Math.exp(Math.log(arrivalScale) * (1 - progress) + Math.log(finalScale) * progress
                + arrivalLogVelocity * duration * travel * (1 - travel) * (1 - travel));
        // Centrar al mismo ritmo que se cierra el encuadre mantiene la casa visible.
        // Interpolar el foco por tiempo y el zoom exponencialmente la dejaba fuera.
        const focus = reduced && arrival < 0 ? 0 : (1 - scale) / (1 - finalScale);
        if (arrival < 0) loadingFocus = focus;
        target.lerpVectors(center, destination, focus);
        const halfHeight = reduced && arrival < 0 ? fullHeight : fullHeight * scale;
        const distance = reduced && arrival < 0 ? fullDistance : fullDistance * scale;
        // Puede empezar mientras se preparan shaders; nunca volver a aclarar al llegar.
        const loadingShade = fadeTime < 0 ? 0 : smooth(Math.min(1, fadeTime / 2));
        const shade = Math.max(loadingShade, arrival < 0 ? 0 : progress);
        camera.aspect = aspect;
        // Precisión alta en la órbita distante y plano cercano corto al entrar.
        camera.near = Math.max(0.03, Math.min(5, distance * 0.01));
        camera.far = Math.max(100, distance + model.width * 2);
        camera.updateProjectionMatrix();
        const inclination = Math.PI * 0.27;
        camera.position.set(target.x + Math.sin(angle) * Math.cos(inclination) * distance,
            target.y + Math.sin(inclination) * distance,
            target.z + Math.cos(angle) * Math.cos(inclination) * distance);
        camera.lookAt(target);
        clouds.update(delta, aspect, reduced, travel, angle, inclination, camera.fov, loadingTime);
        if (!reduced) seaMaterial.uniforms.seaTime.value += delta;
        renderer.render(scene, camera);
        clouds.render(renderer);
        if (shade > 0) {
            fadeMaterial.opacity = shade;
            renderer.autoClear = false;
            renderer.render(fadeScene, fadeCamera);
            renderer.autoClear = true;
        }
        // Solo la llegada exige confirmación del documento para conservar el fundido final.
        // Durante carga, bloquear aquí devolvería la animación al hilo principal ocupado.
        if (options.onPresent) {
            if (arrival >= 0) await waitForRenderedFrame(renderer);
            await options.onPresent({phase:arrival < 0 ? loadingTime < 0 ? 'idle' : 'loading' : 'arrival',scale});
        }
        if (finished) return;
        if (options.diagnostics && (time - lastCameraReport >= 200 || arrival >= duration)) {
            lastCameraReport = time;
            options.onCamera?.({ phase: arrival < 0 ? loadingTime < 0 ? 'idle' : 'loading' : 'arrival',
                seconds: arrival < 0 ? loadingTime : arrival, angle, focus, scale,
                halfHeight, distance, near: camera.near, far: camera.far, reduced, position: camera.position.toArray(), target: target.toArray(), shade });
        }
        if (arrival >= 0) {
            if (arrival >= duration) {
                finished = true;
                waitForRenderedFrame(renderer).then(() => {
                    options.onShade(1);
                    resolveArrival();
                }, rejectArrival);
                return;
            }
        }
        schedule(frame);
    }
    schedule(frame);
    return {
        resize(width,height) { viewWidth = width; viewHeight = height; },
        startLoading() {
            if (loadingTime < 0) loadingTime = 0;
        },
        startFade() { if (fadeTime < 0) fadeTime = 0; },
        begin() {
            if (arrival < 0) {
                options.onStats?.({ frames: loadingFrames, seconds: loadingTime,
                    maxGapMs: maxLoadingGap, focus: loadingFocus, scale: loadingScale });
                arrivalScale = reduced ? 1 : loadingScale;
                arrivalLogVelocity = reduced || loadingTime < 0 ? 0 : -LOADING_ZOOM_RATE;
                arrivalAngle = angle;
                arrivalOrbitSpeed = loadingOrbitSpeed(loadingTime);
                const turn = Math.PI * 2;
                const minimumArc = reduced ? 0 : arrivalOrbitSpeed * ARRIVAL_SECONDS * 0.5;
                arrivalSouthAngle = Math.ceil((angle + minimumArc) / turn) * turn;
                arrival = 0;
            }
            return arrivalDone;
        },
        dispose() {
            finished = true;
            clouds.dispose();
            scene.traverse(object => object.geometry?.dispose());
            for (const material of [groundMaterial,wallMaterial,roofMaterial,doorMaterial,
                trimMaterial,canopy.material,trunks.material,seaMaterial]) material.dispose();
            houseTextures.forEach(texture => texture.dispose());
            fadeQuad.geometry.dispose();
            fadeMaterial.dispose();
            renderer.dispose();
        }
    };
}
