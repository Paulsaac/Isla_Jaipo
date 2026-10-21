import { waitForRenderedFrame } from './render-ready.js';

const SEA_COLOR = 0x3b7495;
const LOADING_ZOOM_RATE = 0.045;
const FADE_START_DISTANCE = 30;
const FADE_END_DISTANCE = 5;

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
    // El fondo uniforme ya representa el mar. Un segundo plano azul bajo la
    // costa competía por profundidad con el terreno durante la vista distante.

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
        const width = Math.max(1, viewWidth), height = Math.max(1, viewHeight);
        if (width !== lastWidth || height !== lastHeight) {
            lastWidth = width; lastHeight = height;
            renderer.setPixelRatio(Math.min(1, Math.sqrt(1920 * 1080 / (width * height))));
            renderer.setSize(width, height, false);
        }
        const aspect = width / height;
        const fullHeight = Math.max(model.depth * 0.65, model.width / (2 * aspect) * 1.12);
        // Mantener el giro durante la carga y la llegada hasta la casa.
        const orbitSpeed = Math.PI * 2 / (loadingTime >= 0 ? 72 : 90);
        if (!reduced && arrival < 0) angle += delta * orbitSpeed;
        if (loadingTime >= 0 && arrival < 0) {
            loadingTime += delta;
            // Acercamiento suave y uniforme: tasa de escala del 4,5% por segundo, sin
            // desaceleración hacia un límite que parezca una parada intermedia.
            loadingScale = Math.exp(-LOADING_ZOOM_RATE * loadingTime);
        }
        if (arrival >= 0) {
            arrival += delta;
            // La órbita sigue a velocidad constante mientras el foco y la cámara
            // avanzan hacia la casa, formando una trayectoria curva continua.
            angle = arrivalAngle + (reduced ? 0 : orbitSpeed * arrival);
        }
        // La preferencia reduce la órbita automática; el viaje solicitado por Enter
        // conserva su zoom final para no sustituirlo por un corte a negro.
        const duration = 2.4;
        const travel = arrival < 0 ? 0 : Math.min(1, arrival / duration);
        const progress = smooth(travel);
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
        // La cubierta llena la imagen antes del fundido; negro al cruzar al interior.
        const shade = arrival < 0 ? 0 : smooth(Math.max(0, Math.min(1, Math.log(FADE_START_DISTANCE / distance) / Math.log(FADE_START_DISTANCE / FADE_END_DISTANCE))));
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
        renderer.render(scene, camera);
        if (shade > 0) {
            fadeMaterial.opacity = shade;
            renderer.autoClear = false;
            renderer.render(fadeScene, fadeCamera);
            renderer.autoClear = true;
        }
        // Un único fotograma en vuelo. La cámara no avanza mientras la página
        // no haya tenido oportunidad de presentar el anterior.
        if (options.onPresent) {
            await waitForRenderedFrame(renderer);
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
        begin() {
            if (arrival < 0) {
                options.onStats?.({ frames: loadingFrames, seconds: loadingTime,
                    maxGapMs: maxLoadingGap, focus: loadingFocus, scale: loadingScale });
                arrivalScale = reduced ? 1 : loadingScale;
                arrivalLogVelocity = reduced || loadingTime < 0 ? 0 : -LOADING_ZOOM_RATE;
                arrivalAngle = angle;
                arrival = 0;
            }
            return arrivalDone;
        },
        dispose() {
            finished = true;
            scene.traverse(object => object.geometry?.dispose());
            for (const material of [groundMaterial,wallMaterial,roofMaterial,doorMaterial,
                trimMaterial,canopy.material,trunks.material]) material.dispose();
            houseTextures.forEach(texture => texture.dispose());
            fadeQuad.geometry.dispose();
            fadeMaterial.dispose();
            renderer.dispose();
        }
    };
}
