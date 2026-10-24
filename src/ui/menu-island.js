import * as THREE from 'three';
import { loadMapImage, readMapLayers } from '../world/map-loader.js';
import { prepareMap } from '../world/map-data.js';
import { createMountainHeights } from '../world/mountain-height.js';
import { spawnRoomExit } from '../content/entities.js';

const ORBIT_SECONDS = 90;
const WATER = new Set(['WATER', 'WATER_ROCK', 'BOAT']);
const GROUND_COLORS = {
    GRASS: '#628548', TALL_GRASS: '#658b49', TREE: '#506e3b', BUSH: '#597d41',
    SAND: '#dfc58b', WET_SAND: '#bda76f', DIRT: '#a78a61',
    MOUNTAIN: '#94816c', PEAK: '#b5b1a5', SNOW_PEAK: '#e9eee4',
    WATER: '#2889a7', WATER_ROCK: '#56b1bd', BOAT: '#2889a7',
    WOOD: '#a08055', INDOOR_FLOOR: '#a08055', BUILDING: '#9b8d71',
    DOOR_UNLOCKED: '#a08055', DOOR_LOCKED: '#a08055', POI: '#a08055',
    CHEST: '#628548', TORCH: '#628548', OTHER: '#a7a99a', OTHER2: '#628548'
};

// Una maqueta de presentación; no instancia entidades, física, misiones ni audio.
export async function createMenuIsland(container, { isCancelled = () => false, onUnavailable = () => {} } = {}) {
    const [base, roof] = await Promise.all([
        loadMapImage(new URL('../../imagenes/Mapa/capa1.png', import.meta.url).href),
        loadMapImage(new URL('../../imagenes/Mapa/capa2.png', import.meta.url).href)
    ]);
    if (isCancelled()) return null;
    const { floorMap, roofMap, mapWidth: width, mapHeight: height } = prepareMap(readMapLayers(base, roof));
    const size = Math.max(width, height);
    const { heights, mask } = createMountainHeights(floorMap, width, height, size * 0.10);
    const elevation = (x, z) => {
        x = Math.max(0, Math.min(width - 1, Math.round(x)));
        z = Math.max(0, Math.min(height - 1, Math.round(z)));
        const type = floorMap[z][x];
        if (mask[z][x]) return heights[z][x];
        if (WATER.has(type)) return -1.5;
        if (type === 'SAND' || type === 'WET_SAND') return 0.35;
        return 1.1;
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#72b8ce');
    scene.fog = new THREE.Fog('#72b8ce', size * 2.8, size * 7);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, size * 12);
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight('#e5f5ff', '#7b7754', 1.7));
    const sun = new THREE.DirectionalLight('#fff0c9', 2.5);
    sun.position.set(-size, size * 1.5, size * 0.7);
    scene.add(sun);

    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = width;
    textureCanvas.height = height;
    const ctx = textureCanvas.getContext('2d');
    const rockColor = new THREE.Color();
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        ctx.fillStyle = GROUND_COLORS[floorMap[z][x]] || GROUND_COLORS.GRASS;
        if (mask[z][x]) {
            // Variación mineral pequeña, sin pintar los mapas originales.
            const ridge = Math.sin(x * 0.23 + Math.sin(z * 0.11) * 2) * Math.sin(z * 0.19);
            rockColor.set(ctx.fillStyle).offsetHSL(0, 0, ridge * 0.055);
            ctx.fillStyle = rockColor.getStyle();
        }
        ctx.fillRect(x, z, 1, 1);
    }
    const groundTexture = new THREE.CanvasTexture(textureCanvas);
    groundTexture.colorSpace = THREE.SRGBColorSpace;
    groundTexture.magFilter = THREE.NearestFilter;
    const groundGeometry = new THREE.PlaneGeometry(width - 1, height - 1,
        Math.ceil((width - 1) / 2), Math.ceil((height - 1) / 2));
    groundGeometry.rotateX(-Math.PI / 2);
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        positions.setY(i, elevation(positions.getX(i) + (width - 1) / 2,
            positions.getZ(i) + (height - 1) / 2));
    }
    groundGeometry.computeVertexNormals();
    scene.add(new THREE.Mesh(groundGeometry, new THREE.MeshLambertMaterial({ map: groundTexture })));

    // Mar continuo alrededor de la costa, sin borde rectangular de la maqueta.
    const seaTime = { value: 0 };
    const seaMaterial = new THREE.MeshBasicMaterial({ color: '#318da9' });
    seaMaterial.onBeforeCompile = shader => {
        shader.uniforms.menuSeaTime = seaTime;
        shader.vertexShader = 'varying vec2 menuSeaPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
            '#include <begin_vertex>\nmenuSeaPosition = position.xy;');
        shader.fragmentShader = 'uniform float menuSeaTime;\nvarying vec2 menuSeaPosition;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
            #include <color_fragment>
            float ripple = sin(menuSeaPosition.x * 0.18 + menuSeaPosition.y * 0.31 + menuSeaTime * 0.45)
                * sin(menuSeaPosition.y * 0.23 - menuSeaTime * 0.2);
            float glint = smoothstep(0.94, 1.0, ripple) * 0.025;
            diffuseColor.rgb += glint;
        `);
    };
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(size * 20, size * 20), seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    scene.add(sea);

    const trees = [];
    const buildings = [];
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        if (floorMap[z][x] === 'TREE') trees.push([x, z]);
        if (roofMap[z][x] === 'ROOF') buildings.push([x, z]);
    }
    const dummy = new THREE.Object3D();
    const treeColor = new THREE.Color();
    const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1.25, 4.4, 5),
        new THREE.MeshLambertMaterial({ color: '#668752' }), trees.length);
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.27, 1.5, 4),
        new THREE.MeshLambertMaterial({ color: '#7a6041' }), trees.length);
    trees.forEach(([x, z], i) => {
        const variation = ((x * 31 + z * 17) % 100) / 100;
        const scale = 0.8 + variation * 0.5;
        const y = elevation(x, z);
        dummy.position.set(x - (width - 1) / 2, y + 0.75, z - (height - 1) / 2);
        dummy.scale.setScalar(scale);
        dummy.rotation.y = variation * Math.PI;
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        dummy.position.y = y + 1.1 + 2.2 * scale;
        dummy.updateMatrix();
        crowns.setMatrixAt(i, dummy.matrix);
        treeColor.setHSL(0.25 + variation * 0.055, 0.29, 0.24 + variation * 0.10);
        crowns.setColorAt(i, treeColor);
    });
    scene.add(crowns, trunks);
    const roofs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 2.1, 1.05),
        new THREE.MeshLambertMaterial({ color: '#855d42' }), buildings.length);
    buildings.forEach(([x, z], i) => {
        dummy.position.set(x - (width - 1) / 2, elevation(x, z) + 1.6, z - (height - 1) / 2);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        roofs.setMatrixAt(i, dummy.matrix);
    });
    scene.add(roofs);

    const target = new THREE.Vector3(0, size * 0.025, 0);
    const overviewTarget = target.clone();
    const houseTarget = new THREE.Vector3(spawnRoomExit.x - (width - 1) / 2,
        elevation(spawnRoomExit.x, spawnRoomExit.z) + 2, spawnRoomExit.z - (height - 1) / 2);
    const inclination = Math.atan2(0.74, 0.67);
    let horizontalBound = 0, verticalBound = 0;
    // Límites de tierra y copas para toda la órbita; el mar no reduce el encuadre.
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        if (WATER.has(floorMap[z][x])) continue;
        const radius = Math.hypot(x - (width - 1) / 2, z - (height - 1) / 2) + 2;
        const top = elevation(x, z) + (floorMap[z][x] === 'TREE' ? 7 : 3);
        horizontalBound = Math.max(horizontalBound, radius);
        verticalBound = Math.max(verticalBound, radius * Math.sin(inclination)
            + Math.max(Math.abs(top - target.y), target.y) * Math.cos(inclination));
    }
    function resize() {
        const w = container.clientWidth, h = container.clientHeight;
        const aspect = w / Math.max(1, h);
        const halfHeight = Math.max(verticalBound * 1.12, horizontalBound * 1.08 / aspect);
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    resize();
    window.addEventListener('resize', resize);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false, frame = 0, elapsed = 0, previous = 0;
    let phase = 'orbit', arrivalTime = 0, diveTime = 0, worldReady = false;
    let finishPromise = null, resolveFinish = null, diveHalfHeight = 0;
    const diveTarget = new THREE.Vector3();
    const ease = t => t * t * (3 - 2 * t);
    function beginArrival() {
        if (disposed || phase !== 'orbit') return;
        phase = 'approach';
        arrivalTime = 0;
    }
    function finishArrival() {
        if (disposed) return Promise.resolve();
        beginArrival();
        worldReady = true;
        if (!finishPromise) finishPromise = new Promise(resolve => { resolveFinish = resolve; });
        return finishPromise;
    }
    function render(timestamp) {
        if (disposed) return;
        frame = requestAnimationFrame(render);
        if (timestamp - previous < 1000 / 30) return;
        // No acumular un salto de órbita después de volver a la pestaña.
        const delta = previous ? Math.min((timestamp - previous) / 1000, 0.1) : 0;
        previous = timestamp;
        if (document.hidden) return;
        if (phase === 'orbit' && !reducedMotion.matches) elapsed += delta;
        if (phase === 'approach') {
            arrivalTime += delta;
            if (!reducedMotion.matches) {
                const progress = ease(Math.min(1, arrivalTime / 6));
                target.lerpVectors(overviewTarget, houseTarget, progress);
                camera.zoom = Math.exp(Math.log(Math.max(1, camera.top / 24)) * progress);
            }
            // Incluso una carga rápida deja ver el comienzo del viaje.
            if (worldReady && arrivalTime >= (reducedMotion.matches ? 0.15 : 1.2)) {
                phase = 'dive';
                diveTarget.copy(target);
                diveHalfHeight = camera.top / camera.zoom;
                diveTime = 0;
            }
        }
        if (phase === 'dive') {
            diveTime += delta;
            const duration = reducedMotion.matches ? 0.25 : 0.85;
            const progress = Math.min(1, diveTime / duration);
            if (!reducedMotion.matches) {
                const zoomProgress = ease(progress);
                target.lerpVectors(diveTarget, houseTarget, zoomProgress);
                const halfHeight = diveHalfHeight * Math.pow(1.2 / diveHalfHeight, zoomProgress);
                camera.zoom = camera.top / halfHeight;
            }
            container.style.opacity = String(1 - ease(reducedMotion.matches
                ? progress : Math.max(0, (progress - 0.65) / 0.35)));
            if (progress >= 1) {
                phase = 'done';
                resolveFinish?.();
                resolveFinish = null;
            }
        }
        camera.updateProjectionMatrix();
        const angle = elapsed * Math.PI * 2 / ORBIT_SECONDS;
        const distance = size * 2;
        camera.position.set(target.x + Math.sin(angle) * distance * 0.67,
            target.y + distance * 0.74, target.z + Math.cos(angle) * distance * 0.67);
        camera.lookAt(target);
        seaTime.value += reducedMotion.matches ? 0 : delta;
        renderer.render(scene, camera);
        container.classList.add('menu-island-ready');
    }
    function dispose() {
        if (disposed) return;
        disposed = true;
        resolveFinish?.();
        resolveFinish = null;
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        container.classList.remove('menu-island-ready');
        scene.traverse(object => {
            object.geometry?.dispose();
            if (object.isInstancedMesh) object.dispose();
            if (object.material) object.material.dispose();
        });
        groundTexture.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
    }
    function onContextLost(event) {
        event.preventDefault();
        dispose();
        onUnavailable();
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    if (isCancelled()) { dispose(); return null; }
    frame = requestAnimationFrame(render);
    return { dispose, beginArrival, finishArrival };
}
