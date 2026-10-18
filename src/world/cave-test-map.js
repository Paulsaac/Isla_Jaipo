import { loadMapImage } from './map-loader.js';
import { createCaveEntrance } from './cave-entrance.js';

// Cada color del dibujo define un material y una regla de circulación.
const WALL_HEIGHT = 6;
const COLORS = new Map([
    [0x7092be, 'START'], [0x3f48cc, 'INTEREST'],
    [0x775c45, 'PASSAGE'], [0x896a4d, 'CHAMBER'],
    [0x23759f, 'RIVER'], [0x75cbd5, 'WATERFALL'], [0xa89b82, 'RIVER'],
    [0x544136, 'RIM'], [0xb97a57, 'ROCK'], [0xffffff, 'OUTSIDE']
]);
const WALKABLE = new Set(['START', 'INTEREST', 'PASSAGE', 'CHAMBER']);
const WET = new Set(['RIVER', 'WATERFALL']);
const APPEARANCE = {
    START: '#ffffff', INTEREST: '#f1dcad', PASSAGE: '#ffffff',
    CHAMBER: '#ead9bd', RIVER: '#6793a0', WATERFALL: '#a9d9dc',
    RIM: '#d6c9ba', ROCK: '#ffffff', OUTSIDE: '#777777'
};

export function caveCellType(r, g, b, a = 255) {
    return a < 128 ? 'OUTSIDE' : COLORS.get((r << 16) | (g << 8) | b) ?? 'ROCK';
}

// Destino provisional aislado: conserva intactos el mundo y el progreso de la isla.
export async function loadCaveTestMap(THREE, unitSize, playerHeight, { rockTexture, floorTexture, waterMaterial }) {
    if (!rockTexture || !floorTexture || !waterMaterial?.map) {
        throw new Error('Faltan las texturas o el material de agua de la cueva.');
    }
    const image = await loadMapImage('./imagenes/Mapa/mapa_cueva.png');
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    const width = image.width, height = image.height, types = [], heights = [], spawnMarkers = [], interestMarkers = [], springMarkers = [], floorCells = [], riverCells = [];
    for (let z = 0; z < height; z++) {
        types[z] = []; heights[z] = [];
        for (let x = 0; x < width; x++) {
            const i = (z * width + x) * 4;
            const type = caveCellType(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
            types[z][x] = type;
            if (type === 'START') spawnMarkers.push({ x, z });
            if (type === 'INTEREST') interestMarkers.push({ x, z });
            if (type === 'WATERFALL') springMarkers.push({ x, z });
            if (WALKABLE.has(type)) floorCells.push({ x, z });
            if (WET.has(type)) riverCells.push({ x, z });
            heights[z][x] = WET.has(type) ? -.55 : WALKABLE.has(type) ? 0 : type === 'OUTSIDE' ? 9 : WALL_HEIGHT;
        }
    }
    if (!spawnMarkers.length) throw new Error('mapa_cueva.png no contiene el inicio #7092BE.');
    if (!interestMarkers.length) throw new Error('mapa_cueva.png no contiene el punto de interés #3F48CC.');
    const center = markers => ({
        x: markers.reduce((sum, point) => sum + point.x, 0) / markers.length,
        z: markers.reduce((sum, point) => sum + point.z, 0) / markers.length
    });
    const spawnCell = center(spawnMarkers), interestCell = center(interestMarkers);
    if (spawnMarkers.some(({ x, z }) => Math.abs(x - spawnCell.x) > 1 || Math.abs(z - spawnCell.z) > 1)) {
        throw new Error('mapa_cueva.png contiene inicios separados.');
    }
    const group = new THREE.Group();
    group.name = 'mapa-cueva-test'; group.position.set(4096, 0, 4096); group.visible = false;
    const geometry = new THREE.PlaneGeometry((width - 1) * unitSize, (height - 1) * unitSize, width - 1, height - 1);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate((width - 1) * unitSize / 2, 0, (height - 1) * unitSize / 2);
    const position = geometry.attributes.position, colors = new Float32Array(position.count * 3), color = new THREE.Color();
    const groundUv = geometry.attributes.uv;
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        const index = z * width + x;
        position.setY(index, heights[z][x]);
        color.set(APPEARANCE[types[z][x]]).toArray(colors, index * 3);
        groundUv.setXY(index, x * unitSize / 4, z * unitSize / 8);
    }
    // El cauce y sus orillas usan superficies independientes para evitar picos triangulares.
    const terrainIndices = [];
    const passable = type => WALKABLE.has(type) || WET.has(type);
    for (let z = 0; z < height - 1; z++) for (let x = 0; x < width - 1; x++) {
        const corners = [types[z][x], types[z][x + 1], types[z + 1][x], types[z + 1][x + 1]];
        if (corners.some(type => WET.has(type)) || (corners.some(passable) && corners.includes('RIM'))) continue;
        const index = z * width + x, next = index + width;
        terrainIndices.push(index, next, index + 1, next, next + 1, index + 1);
    }
    geometry.setIndex(terrainIndices);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        map: rockTexture, vertexColors: true, shininess: 0, side: THREE.DoubleSide
    })));
    function addFlatCells(cells, y, material, name) {
        const positions = [], uvs = [], indices = [];
        for (const { x, z } of cells) {
            const left = (x - .5) * unitSize, right = (x + .5) * unitSize;
            const near = (z - .5) * unitSize, far = (z + .5) * unitSize;
            const start = positions.length / 3;
            positions.push(left, y, near, right, y, near, left, y, far, right, y, far);
            uvs.push(left / 4, near / 4, right / 4, near / 4, left / 4, far / 4, right / 4, far / 4);
            indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
        }
        const flatGeometry = new THREE.BufferGeometry();
        flatGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        flatGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        flatGeometry.setIndex(indices);
        flatGeometry.computeVertexNormals();
        const mesh = new THREE.Mesh(flatGeometry, material);
        mesh.name = name;
        group.add(mesh);
    }
    const shoreCells = floorCells.filter(({ x, z }) =>
        WET.has(types[z - 1]?.[x]) || WET.has(types[z + 1]?.[x])
        || WET.has(types[z]?.[x - 1]) || WET.has(types[z]?.[x + 1]));
    const shoreKeys = new Set(shoreCells.map(({ x, z }) => z * width + x));
    const dirtMaterial = new THREE.MeshPhongMaterial({
        map: floorTexture, shininess: 0, side: THREE.DoubleSide
    });
    addFlatCells(floorCells.filter(({ x, z }) => !shoreKeys.has(z * width + x)), .035,
        dirtMaterial, 'cave-dirt-floor');
    // Como en la isla, la orilla desciende bajo un plano de agua continuo.
    const shorePositions = [], shoreUvs = [], shoreIndices = [], shoreSegments = 4;
    for (const { x, z } of shoreCells) {
        const west = WET.has(types[z][x - 1]), east = WET.has(types[z][x + 1]);
        const north = WET.has(types[z - 1]?.[x]), south = WET.has(types[z + 1]?.[x]);
        const start = shorePositions.length / 3;
        for (let iz = 0; iz <= shoreSegments; iz++) for (let ix = 0; ix <= shoreSegments; ix++) {
            const px = (x - .5 + ix / shoreSegments) * unitSize;
            const pz = (z - .5 + iz / shoreSegments) * unitSize;
            const edge = Math.max(west ? 1 - ix / shoreSegments * unitSize / .85 : 0,
                east ? 1 - (shoreSegments - ix) / shoreSegments * unitSize / .85 : 0,
                north ? 1 - iz / shoreSegments * unitSize / .85 : 0,
                south ? 1 - (shoreSegments - iz) / shoreSegments * unitSize / .85 : 0, 0);
            const depth = edge * (.31 + .055 * Math.sin(px * 3.4 + pz * 2.7));
            shorePositions.push(px, .035 - depth, pz);
            shoreUvs.push(px / 4, pz / 4);
        }
        for (let iz = 0; iz < shoreSegments; iz++) for (let ix = 0; ix < shoreSegments; ix++) {
            const a = start + iz * (shoreSegments + 1) + ix, b = a + shoreSegments + 1;
            shoreIndices.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
    const shoreGeometry = new THREE.BufferGeometry();
    shoreGeometry.setAttribute('position', new THREE.Float32BufferAttribute(shorePositions, 3));
    shoreGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(shoreUvs, 2));
    shoreGeometry.setIndex(shoreIndices);
    shoreGeometry.computeVertexNormals();
    const shore = new THREE.Mesh(shoreGeometry, dirtMaterial);
    shore.name = 'cave-sloped-shore';
    group.add(shore);
    addFlatCells(riverCells, -.55, new THREE.MeshPhongMaterial({
        map: rockTexture, color: 0x788681, shininess: 0, side: THREE.DoubleSide
    }), 'cave-flat-riverbed');
    // La bóveda sigue la huella de la montaña y tapa las galerías a la altura de los muros.
    const ceilingPositions = new Float32Array(width * height * 3);
    const ceilingColors = new Float32Array(width * height * 3);
    const ceilingUvs = new Float32Array(width * height * 2);
    const ceilingIndices = [];
    const open = (cx, cz) => WALKABLE.has(types[cz]?.[cx]) || WET.has(types[cz]?.[cx]);
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        const index = z * width + x, offset = index * 3;
        ceilingPositions[offset] = x * unitSize;
        const vaulted = open(x, z) && open(x - 1, z) && open(x + 1, z) && open(x, z - 1) && open(x, z + 1);
        ceilingPositions[offset + 1] = WALL_HEIGHT + (vaulted ? .17 + .07 * Math.sin(x * .41 + z * .29) : 0);
        ceilingPositions[offset + 2] = z * unitSize;
        const shade = .88 + .08 * Math.sin(x * .31 + z * .17);
        ceilingColors[offset] = shade;
        ceilingColors[offset + 1] = shade * .96;
        ceilingColors[offset + 2] = shade * .91;
        ceilingUvs[index * 2] = x * unitSize / 4;
        ceilingUvs[index * 2 + 1] = z * unitSize / 8;
        if (x === width - 1 || z === height - 1) continue;
        const corners = [types[z][x], types[z][x + 1], types[z + 1][x], types[z + 1][x + 1]];
        if (corners.includes('OUTSIDE') || !corners.some(type => WALKABLE.has(type) || WET.has(type))) continue;
        const next = index + width;
        ceilingIndices.push(index, index + 1, next, index + 1, next + 1, next);
    }
    const ceilingGeometry = new THREE.BufferGeometry();
    ceilingGeometry.setAttribute('position', new THREE.BufferAttribute(ceilingPositions, 3));
    ceilingGeometry.setAttribute('color', new THREE.BufferAttribute(ceilingColors, 3));
    ceilingGeometry.setAttribute('uv', new THREE.BufferAttribute(ceilingUvs, 2));
    ceilingGeometry.setIndex(ceilingIndices);
    ceilingGeometry.computeVertexNormals();
    const ceiling = new THREE.Mesh(ceilingGeometry, new THREE.MeshLambertMaterial({
        map: rockTexture, vertexColors: true, side: THREE.DoubleSide, flatShading: true
    }));
    ceiling.name = 'cave-rock-ceiling';
    group.add(ceiling);
    const wallCells = [];
    for (let z = 1; z < height - 1; z++) for (let x = 1; x < width - 1; x++) {
        if (types[z][x] !== 'RIM') continue;
        let bordersPassage = false;
        for (let dz = -1; dz <= 1 && !bordersPassage; dz++) for (let dx = -1; dx <= 1; dx++) {
            if (passable(types[z + dz][x + dx])) { bordersPassage = true; break; }
        }
        if (bordersPassage) wallCells.push({ x, z });
    }
    if (wallCells.length) {
        const wallGeometry = new THREE.BoxGeometry(unitSize, WALL_HEIGHT, unitSize, 3, 4, 3);
        const wallUv = wallGeometry.attributes.uv, wallNormals = wallGeometry.attributes.normal;
        const wallPositions = wallGeometry.attributes.position;
        for (let index = 0; index < wallUv.count; index++) {
            const vertical = Math.abs(wallNormals.getY(index)) < .5;
            wallUv.setXY(index, wallUv.getX(index) * unitSize / 4,
                wallUv.getY(index) * (vertical ? WALL_HEIGHT : unitSize) / 8);
            if (!vertical) continue;
            const nx = wallNormals.getX(index), nz = wallNormals.getZ(index);
            const along = Math.abs(nx) > .5 ? wallPositions.getZ(index) : wallPositions.getX(index);
            const y = wallPositions.getY(index);
            const seam = (1 - (along / (unitSize / 2)) ** 2) * (1 - (y / (WALL_HEIGHT / 2)) ** 2);
            const relief = seam * (Math.sin(along * 3.3 + y * 2.1) * .22
                + Math.cos(along * 5.4 - y * 1.7) * .13);
            wallPositions.setXYZ(index, wallPositions.getX(index) + nx * relief,
                y, wallPositions.getZ(index) + nz * relief);
        }
        wallGeometry.computeVertexNormals();
        const walls = new THREE.InstancedMesh(
            wallGeometry,
            new THREE.MeshPhongMaterial({ map: rockTexture, color: 0xd9cbbb, flatShading: true, shininess: 0 }), wallCells.length
        );
        const matrix = new THREE.Matrix4();
        const tint = new THREE.Color();
        wallCells.forEach(({ x, z }, index) => {
            matrix.makeRotationY(((x * 17 + z * 31) % 4) * Math.PI / 2);
            matrix.setPosition(x * unitSize, WALL_HEIGHT / 2, z * unitSize);
            walls.setMatrixAt(index, matrix);
            const shade = .88 + .12 * (Math.sin(x * 4.7 + z * 2.9) * .5 + .5);
            walls.setColorAt(index, tint.setRGB(shade, shade * .98, shade * .94));
        });
        walls.name = 'cave-test-walls'; group.add(walls);
        const exposedFaces = [];
        for (const { x, z } of wallCells) for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            if (passable(types[z + dz]?.[x + dx])) exposedFaces.push({ x, z, dx, dz });
        }
        const facets = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0),
            new THREE.MeshPhongMaterial({ map: rockTexture, color: 0xb7aea2, flatShading: true, shininess: 0 }),
            exposedFaces.length);
        exposedFaces.forEach(({ x, z, dx, dz }, index) => {
            const variation = Math.sin(x * 9.7 + z * 5.3 + dx * 3.1 + dz * 4.9);
            const width = .65 + .18 * variation, height = 1.25 + .22 * Math.cos(x * 3.7 - z * 6.1);
            matrix.makeScale(dx ? .29 : width, height, dz ? .29 : width);
            matrix.setPosition(x * unitSize + dx * (unitSize / 2 - .14),
                2.7 + .52 * variation, z * unitSize + dz * (unitSize / 2 - .14));
            facets.setMatrixAt(index, matrix);
            const shade = .83 + .13 * (variation * .5 + .5);
            facets.setColorAt(index, tint.setRGB(shade, shade * .97, shade * .92));
        });
        facets.name = 'cave-rock-facets';
        group.add(facets);
    }
    // El material compartido recibe los mismos fotogramas y el mismo tiempo de ondas que el agua exterior.
    const waterGeometry = new THREE.PlaneGeometry(width * unitSize, height * unitSize);
    const waterUv = waterGeometry.attributes.uv;
    const waterRepeat = waterMaterial.map.repeat;
    for (let index = 0; index < waterUv.count; index++) {
        waterUv.setXY(index, waterUv.getX(index) * width / waterRepeat.x,
            waterUv.getY(index) * height / waterRepeat.y);
    }
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set((width - 1) * unitSize / 2, -.05, (height - 1) * unitSize / 2);
    group.add(water);
    if (springMarkers.length) {
        const spring = center(springMarkers);
        const waterfallGeometry = new THREE.BoxGeometry(.12, WALL_HEIGHT - .15, unitSize * 2.4);
        const waterfallUv = waterfallGeometry.attributes.uv;
        for (let index = 0; index < waterfallUv.count; index++) {
            waterfallUv.setXY(index, waterfallUv.getX(index) * 2.4 / waterRepeat.x,
                waterfallUv.getY(index) * 3 / waterRepeat.y);
        }
        const waterfall = new THREE.Mesh(
            waterfallGeometry, waterMaterial
        );
        waterfall.position.set(spring.x * unitSize, (WALL_HEIGHT - .15) / 2, spring.z * unitSize);
        waterfall.name = 'cave-rock-wall-spring';
        group.add(waterfall);
    }
    // El jugador aparece mirando hacia las galerías del norte; la salida queda a su espalda.
    const exitEntrance = createCaveEntrance(
        THREE, unitSize, 0, rockTexture,
        { x: spawnCell.x, z: spawnCell.z + 1 }, Math.PI
    );
    exitEntrance.group.name = 'cave-return-entrance';
    const openingGeometry = new THREE.PlaneGeometry(2.6, 2.8);
    const openingColors = [];
    const openingVertices = openingGeometry.attributes.position;
    for (let index = 0; index < openingVertices.count; index++) {
        const shade = new THREE.Color(openingVertices.getY(index) > 0 ? 0xb8c9cb : 0x887d67);
        openingColors.push(shade.r, shade.g, shade.b);
    }
    openingGeometry.setAttribute('color', new THREE.Float32BufferAttribute(openingColors, 3));
    const opening = new THREE.Mesh(openingGeometry, new THREE.MeshBasicMaterial({
        vertexColors: true, side: THREE.DoubleSide, fog: false
    }));
    opening.name = 'cave-daylight-opening';
    opening.position.set(0, 1.5, -.7);
    exitEntrance.group.add(opening);
    const daylight = new THREE.PointLight(0xe8d7b5, 3, 9, 2);
    daylight.name = 'cave-entrance-daylight';
    daylight.position.set(0, 2.1, .2);
    exitEntrance.group.add(daylight);
    group.add(exitEntrance.group);
    const spawn = new THREE.Vector3(
        group.position.x + spawnCell.x * unitSize, playerHeight,
        group.position.z + spawnCell.z * unitSize
    );
    function grid(x, z) { return { x: (x - group.position.x) / unitSize, z: (z - group.position.z) / unitSize }; }
    function localPlayer(position) {
        return { x: position.x - group.position.x, y: position.y, z: position.z - group.position.z };
    }
    function exitDepth(local) { return local.z - exitEntrance.group.position.z; }
    function nearExit(local) {
        return Math.abs(local.x - exitEntrance.group.position.x) <= 1.3
            && exitDepth(local) >= -1.4 && exitDepth(local) <= 1.4;
    }
    return { group, spawn, width, height, spawnCell, interestCell, active: false,
        nearExit(position) {
            return nearExit(localPlayer(position));
        },
        exiting(position) {
            const local = localPlayer(position);
            return nearExit(local) && exitDepth(local) >= .4 && Math.abs(local.y) < 3;
        },
        contains(x, z) { const p = grid(x, z); return p.x >= 0 && p.z >= 0 && p.x < width - 1 && p.z < height - 1; },
        isWall(x, z) {
            for (const dx of [-.3, .3]) for (const dz of [-.3, .3]) {
                const p = grid(x + dx, z + dz), gx = Math.round(p.x), gz = Math.round(p.z);
                const type = types[gz]?.[gx];
                if (!this.contains(x + dx, z + dz) || (!WALKABLE.has(type) && !WET.has(type))) return true;
            }
            return false;
        },
        getHeight(x, z) {
            const p = grid(x, z), gx = Math.max(0, Math.min(width - 2, Math.floor(p.x))), gz = Math.max(0, Math.min(height - 2, Math.floor(p.z)));
            const fx = THREE.MathUtils.clamp(p.x - gx, 0, 1), fz = THREE.MathUtils.clamp(p.z - gz, 0, 1);
            // Las rocas son barreras, no rampas físicas; solo el cauce cambia la altura del suelo.
            const nearestType = types[Math.round(p.z)]?.[Math.round(p.x)];
            const edgeHeight = WET.has(nearestType) ? -.55 : 0;
            const floorHeight = (cx, cz) => {
                const type = types[cz]?.[cx];
                return WALKABLE.has(type) || WET.has(type) ? heights[cz][cx] : edgeHeight;
            };
            const h00 = floorHeight(gx, gz), h10 = floorHeight(gx + 1, gz);
            const h01 = floorHeight(gx, gz + 1), h11 = floorHeight(gx + 1, gz + 1);
            // Misma diagonal que PlaneGeometry, para conservar la transición de tierra a agua.
            return fx + fz <= 1 ? h00 + fx * (h10 - h00) + fz * (h01 - h00)
                : h11 + (1 - fx) * (h01 - h11) + (1 - fz) * (h10 - h11);
        },
        localPosition(position) { return new THREE.Vector3(position.x - group.position.x, position.y, position.z - group.position.z); }
    };
}
