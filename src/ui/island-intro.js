import * as THREE from 'three';

// Muestrea la geometría vigente, incluidas sus alturas, normales y mezclas de suelo.
// La portada no necesita las dieciséis subdivisiones que se ven al caminar.
export function createIntroTerrain(source, segmentsW, segmentsH, step = 4) {
    const columns = Math.ceil(segmentsW / step) + 1;
    const rows = Math.ceil(segmentsH / step) + 1;
    const geometry = new THREE.BufferGeometry();
    for (const [name, attribute] of Object.entries(source.attributes)) {
        const data = new attribute.array.constructor(columns * rows * attribute.itemSize);
        for (let z = 0; z < rows; z++) for (let x = 0; x < columns; x++) {
            const start = (Math.min(z * step, segmentsH) * (segmentsW + 1) + Math.min(x * step, segmentsW)) * attribute.itemSize;
            data.set(attribute.array.subarray(start, start + attribute.itemSize), (z * columns + x) * attribute.itemSize);
        }
        geometry.setAttribute(name, new THREE.BufferAttribute(data, attribute.itemSize, attribute.normalized));
    }
    const indices = new Uint32Array((columns - 1) * (rows - 1) * 6);
    let i = 0;
    for (let z = 0; z < rows - 1; z++) for (let x = 0; x < columns - 1; x++) {
        const a = z * columns + x, b = a + columns;
        indices.set([a, b, a + 1, b, b + 1, a + 1], i); i += 6;
    }
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
    return geometry;
}

// La portada dibuja el mundo real, sin una segunda maqueta o mapas duplicados.
export function createIslandIntro({ scene, renderer, playerCamera, floorMap, unitSize,
    heightAt, treeHeight, house, ambientLight, dirLight, sky, flare,
    terrainDistance, ocean, terrain, textures, introStrength, updateVisibility }) {
    const water = new Set(['WATER', 'WATER_ROCK', 'BOAT']);
    const bounds = new THREE.Box3();
    for (let z = 0; z < floorMap.length; z++) for (let x = 0; x < floorMap[z].length; x++) {
        if (water.has(floorMap[z][x])) continue;
        bounds.expandByPoint(new THREE.Vector3(x * unitSize, heightAt(x * unitSize, z * unitSize), z * unitSize));
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const inclination = Math.PI * 0.27;
    let radius = 0, verticalBound = 0;
    for (let z = 0; z < floorMap.length; z++) for (let x = 0; x < floorMap[z].length; x++) {
        if (water.has(floorMap[z][x])) continue;
        const r = Math.hypot(x * unitSize - center.x, z * unitSize - center.z) + treeHeight;
        const y = heightAt(x * unitSize, z * unitSize);
        radius = Math.max(radius, r);
        verticalBound = Math.max(verticalBound, r * Math.sin(inclination)
            + (Math.abs(y - center.y) + treeHeight) * Math.cos(inclination));
    }
    const target = center.clone();
    const destination = new THREE.Vector3(house.x * unitSize,
        heightAt(house.x * unitSize, house.z * unitSize) + 4, house.z * unitSize);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, radius * 12);
    const menu = document.getElementById('main-menu');
    const shade = document.getElementById('intro-shade');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let angle = 0, arrival = -1, complete = false, resolveArrival;
    const finished = new Promise(resolve => { resolveArrival = resolve; });
    const smooth = t => t * t * (3 - 2 * t);
    const saved = {
        ambient: ambientLight.color.clone(), ambientIntensity: ambientLight.intensity,
        sun: dirLight.color.clone(), sunIntensity: dirLight.intensity,
        fog: scene.fog.density, background: scene.background?.clone(), distance: terrainDistance.value,
        sky: sky.visible, flare: flare.visible, player: playerCamera.visible,
        pixelRatio: renderer.getPixelRatio()
    };
    document.body.classList.add('island-preview');
    const textureStates = new Map();
    const materialStates = new Map();
    const filterTexture = texture => {
        if (!texture?.isTexture || texture.isDataTexture || textureStates.has(texture)) return;
        textureStates.set(texture, [texture.minFilter, texture.magFilter, texture.anisotropy, texture.generateMipmaps]);
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
    };
    textures.forEach(filterTexture);
    scene.traverse(object => {
        const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
        for (const material of materials) {
            filterTexture(material.map);
            if (material.alphaTest > 0 && !materialStates.has(material)) {
                materialStates.set(material, [material.alphaTest, material.transparent]);
                // Recortes opacos: las copas no cambian por el orden de transparencias.
                material.alphaTest = 0.1;
                material.transparent = false;
                material.needsUpdate = true;
            }
        }
    });
    terrain.full.visible = false;
    terrain.overview.visible = true;
    introStrength.value = 1;
    let viewWidth = 0, viewHeightPixels = 0;
    // Prolongar el mismo mar para que no se vea el borde cuadrado del mapa.
    const oceanGeometry = ocean.geometry;
    const wideOcean = new THREE.PlaneGeometry(oceanGeometry.parameters.width * 12, oceanGeometry.parameters.height * 12);
    const uv = wideOcean.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * 12 + 0.5, (uv.getY(i) - 0.5) * 12 + 0.5);
    ocean.geometry = wideOcean;
    function render(delta) {
        if (complete) return;
        delta = document.hidden ? 0 : Math.min(delta, 0.1);
        const aspect = renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight);
        const width = renderer.domElement.clientWidth, height = renderer.domElement.clientHeight;
        if (width !== viewWidth || height !== viewHeightPixels) {
            viewWidth = width; viewHeightPixels = height;
            renderer.setPixelRatio(Math.min(1, Math.sqrt(1920 * 1080 / (width * height))));
        }
        const halfHeight = Math.max(verticalBound, radius / aspect) * 1.08;
        if (arrival < 0 && !reduced) angle += delta * Math.PI * 2 / 90;
        if (arrival >= 0) arrival += delta;
        const duration = reduced ? 0.4 : 6;
        const progress = arrival < 0 ? 0 : smooth(Math.min(1, arrival / duration));
        target.lerpVectors(center, destination, reduced ? 0 : progress);
        const viewHeight = reduced ? halfHeight : halfHeight * Math.pow(7 / halfHeight, progress);
        camera.left = -viewHeight * aspect; camera.right = viewHeight * aspect;
        camera.top = viewHeight; camera.bottom = -viewHeight;
        camera.updateProjectionMatrix();
        const distance = radius * 3;
        camera.position.set(target.x + Math.sin(angle) * Math.cos(inclination) * distance,
            target.y + Math.sin(inclination) * distance,
            target.z + Math.cos(angle) * Math.cos(inclination) * distance);
        camera.lookAt(target);
        // Luz y alcance de presentación; el estado del juego se restaura al entrar.
        scene.fog.density = 0;
        terrainDistance.value = 100000;
        scene.background.set('#498fa5');
        sky.visible = flare.visible = playerCamera.visible = false;
        ambientLight.color.set('#fff5e4'); ambientLight.intensity = 2.1;
        dirLight.color.set('#fff0da'); dirLight.intensity = 1.3;
        terrain.full.visible = viewHeight < 45;
        terrain.overview.visible = !terrain.full.visible;
        updateVisibility(camera);
        renderer.render(scene, camera);
        if (arrival >= 0) shade.style.opacity = String(smooth(Math.max(0, Math.min(1, (arrival - duration + 0.4) / 0.4))));
        if (arrival >= duration) {
            complete = true;
            document.body.classList.remove('island-preview');
            renderer.setPixelRatio(saved.pixelRatio);
            introStrength.value = 0;
            terrain.full.visible = true;
            scene.remove(terrain.overview);
            terrain.overview.geometry.dispose();
            for (const [texture, values] of textureStates) {
                [texture.minFilter, texture.magFilter, texture.anisotropy, texture.generateMipmaps] = values;
                texture.needsUpdate = true;
            }
            for (const [material, values] of materialStates) {
                [material.alphaTest, material.transparent] = values;
                material.needsUpdate = true;
            }
            ocean.geometry = oceanGeometry;
            wideOcean.dispose();
            scene.fog.density = saved.fog;
            terrainDistance.value = saved.distance;
            scene.background.copy(saved.background);
            sky.visible = saved.sky; flare.visible = saved.flare; playerCamera.visible = saved.player;
            ambientLight.color.copy(saved.ambient); ambientLight.intensity = saved.ambientIntensity;
            dirLight.color.copy(saved.sun); dirLight.intensity = saved.sunIntensity;
            menu.style.display = 'none';
            resolveArrival();
        }
    }
    return {
        render,
        begin() {
            if (arrival < 0) { arrival = 0; menu.classList.add('intro-arriving'); }
            return finished;
        },
        reveal() {
            shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
        }
    };
}
