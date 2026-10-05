import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- CONFIGURACIÓN DEL JUEGO ---
const UNIT_SIZE = 2; 
const WALL_HEIGHT = 2.2; 
const PLAYER_HEIGHT = 1.0; 
const MOVEMENT_SPEED = 20.0; 
const FRICTION = 8.0; 
const COLLISION_RADIUS = 0.3; 
const SPRINT_MULTIPLIER = 2.8; 

// Físicas verticales
let velocityY = 0;
const GRAVITY = 50.0;
const JUMP_FORCE = 15.0;
let canJump = true;
let isCrouching = false;
let isRunning = false;

// Inventario e Interacciones
let keys = 0;
const interactables = [];
let targetInteractable = null;
let isRidingBoat = false;
let boatReference = null;

// --- SETUP DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14); // Noche azulada lúgubre
scene.fog = new THREE.Fog(0x0a0a14, 10, 60); // Niebla un poco más lejana

// Iluminación Dark Fantasy (Noche de Luna)
const ambientLight = new THREE.AmbientLight(0x222233, 0.4); // Luz ambiental suave
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0x7788aa, 0.6); // Luz de luna
dirLight.position.set(-1, 1, 0.5);
scene.add(dirLight);

let skyMesh;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
scene.add(camera);

// Luz de Antorcha (Faltaba definirla, causaba el crash)
const torchLight = new THREE.PointLight(0xff8800, 3.0, 65);
torchLight.position.set(0.3, -0.3, -0.5); // Posicionada como en la mano derecha
camera.add(torchLight);

let targetDayState = false;
let dayTransition = 0.0;
let dayNightTimer = 157.0; // Inicia en el segundo 157 (exactamente el inicio de la Noche)

const raycaster = new THREE.Raycaster();

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(0.5); 
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
// Permitimos mirar hacia todas partes
// controls.minPolarAngle = Math.PI / 2; 
// controls.maxPolarAngle = Math.PI / 2;

const loadingScreen = document.getElementById('loading-screen');
const mainMenu = document.getElementById('main-menu');
const pauseMenu = document.getElementById('pause-menu');
const hud = document.getElementById('hud');
const keyCountDisplay = document.getElementById('key-count');

let gameStarted = false;
let isDead = false;

controls.addEventListener('lock', () => {
    if (isDead) return;
    gameStarted = true;
    mainMenu.style.display = 'none';
    pauseMenu.style.display = 'none';
    hud.style.display = 'block';
});
controls.addEventListener('unlock', () => {
    if (gameStarted && !isDead) {
        pauseMenu.style.display = 'flex';
        hud.style.display = 'none';
    }
});
pauseMenu.addEventListener('click', () => {
    controls.lock(); 
});

const moveState = { forward: false, backward: false, left: false, right: false, up: false, down: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function toggleDoorSingle(door, forceState) {
    const group = door.userData.parentGroup;
    const shouldOpen = forceState;
    if (door.userData.isOpen === shouldOpen) return;
    
    if (!shouldOpen) {
        group.rotation.y = 0;
        collisionMap[door.userData.gz][door.userData.gx] = door.userData.locked ? 'DOOR_LOCKED' : 'DOOR_UNLOCKED';
        door.userData.isOpen = false;
        group.userData.isOpen = false;
    } else {
        group.rotation.y = (Math.PI / 2) * door.userData.swingDir;
        collisionMap[door.userData.gz][door.userData.gx] = false;
        door.userData.isOpen = true;
        group.userData.isOpen = true;
    }
}

function toggleDoor(door) {
    const newState = !door.userData.isOpen;
    toggleDoorSingle(door, newState);
    
    // Buscar si hay otra puerta adyacente para abrirla de par en par
    const nx = door.userData.gx;
    const nz = door.userData.gz;
    
    for (let inter of interactables) {
        if (inter.userData.type === 'DOOR' && inter !== door) {
            const dx = Math.abs(inter.userData.gx - nx);
            const dz = Math.abs(inter.userData.gz - nz);
            if ((dx === 1 && dz === 0) || (dx === 0 && dz === 1)) {
                // Es vecina, la desbloqueamos si estaba cerrada y la abrimos/cerramos con su compañera
                if (inter.userData.locked) {
                    inter.userData.locked = false;
                    inter.material.color.setHex(0xffffff);
                }
                toggleDoorSingle(inter, newState);
            }
        }
    }
}

const konamiCode = ['KeyW', 'KeyW', 'KeyS', 'KeyS', 'KeyA', 'KeyD', 'KeyA', 'KeyD'];
let konamiIndex = 0;
let isFlying = false;

document.addEventListener('keydown', (e) => {
    if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            isFlying = !isFlying;
            konamiIndex = 0;
            
            let m = document.getElementById('system-msg');
            if (!m) {
                m = document.createElement('div');
                m.id = 'system-msg';
                m.style.position = 'absolute';
                m.style.top = '10%';
                m.style.width = '100%';
                m.style.textAlign = 'center';
                m.style.color = '#00ffff';
                m.style.fontSize = '24px';
                m.style.textShadow = '2px 2px 0 #000';
                m.style.zIndex = '100';
                document.body.appendChild(m);
            }
            m.innerText = "Modo Vuelo " + (isFlying ? "Activado" : "Desactivado");
            m.style.display = 'block';
            
            if (window.sysMsgTimeout) clearTimeout(window.sysMsgTimeout);
            window.sysMsgTimeout = setTimeout(() => { m.style.display = 'none'; }, 2500);
        }
    } else {
        konamiIndex = 0;
    }

    if (e.code === 'Enter' && mapLoaded && !gameStarted) {
        controls.lock(); 
    }

    if (e.code === 'KeyE' && gameStarted) {
        if (isRidingBoat) {
            isRidingBoat = false;
            const controlObj = controls.getObject();
            const currentGX = Math.floor((controlObj.position.x + UNIT_SIZE/2) / UNIT_SIZE);
            const currentGZ = Math.floor((controlObj.position.z + UNIT_SIZE/2) / UNIT_SIZE);
            boatReference.position.set(currentGX * UNIT_SIZE, 0.2, currentGZ * UNIT_SIZE);
            boatReference.userData.gx = currentGX;
            boatReference.userData.gz = currentGZ;
            scene.add(boatReference);
            interactables.push(boatReference);
            boatReference = null;
            velocityY = 10.0; // Pequeño salto al salir
        } else if (targetInteractable) {
            if (targetInteractable.userData.type === 'CHEST') {
                keys++;
                keyCountDisplay.innerText = keys;
                scene.remove(targetInteractable);
                interactables.splice(interactables.indexOf(targetInteractable), 1);
                collisionMap[targetInteractable.userData.gz][targetInteractable.userData.gx] = false;
                targetInteractable = null;
            } else if (targetInteractable.userData.type === 'BOAT') {
                isRidingBoat = true;
                boatReference = targetInteractable;
                scene.remove(boatReference);
                interactables.splice(interactables.indexOf(boatReference), 1);
                collisionMap[boatReference.userData.gz][boatReference.userData.gx] = false;
                targetInteractable = null;
                const controlObj = controls.getObject();
                controlObj.position.x = boatReference.userData.gx * UNIT_SIZE;
                controlObj.position.z = boatReference.userData.gz * UNIT_SIZE;
                velocityY = 0;
            } else if (targetInteractable.userData.type === 'DOOR') {
                if (targetInteractable.userData.locked) {
                    if (keys > 0) {
                        keys--;
                        keyCountDisplay.innerText = keys;
                        targetInteractable.userData.locked = false;
                        targetInteractable.material.color.setHex(0xffffff);
                        toggleDoor(targetInteractable);
                    }
                } else {
                    toggleDoor(targetInteractable);
                }
            }
        }
    }

    switch(e.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
        case 'Space': 
            if (!isFlying && !isRidingBoat) { if (canJump) { velocityY = JUMP_FORCE; canJump = false; } }
            moveState.up = true;
            break;
        case 'ControlLeft': case 'ControlRight': isCrouching = true; moveState.down = true; break;
        case 'ShiftLeft': case 'ShiftRight': isRunning = true; break;
        case 'KeyM': 
            if (mapLoaded && minimapContainer) {
                mapVisible = !mapVisible;
                minimapContainer.style.display = mapVisible ? 'block' : 'none';
            }
            break;
        case 'KeyT':
            if (gameStarted && !isDead) {
                torchLight.visible = !torchLight.visible;
            }
            break;
    }
});
document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyD': moveState.right = false; break;
        case 'Space': moveState.up = false; break;
        case 'ControlLeft': case 'ControlRight': isCrouching = false; moveState.down = false; break;
        case 'ShiftLeft': case 'ShiftRight': isRunning = false; break;
    }
});

// --- LECTURA DE MAPA DESDE IMAGEN PNG ---
let mapWidth = 0;
let mapHeight = 0;
let collisionMap = []; 
let floorMap = [];
let elevationMap = [];
let mapLoaded = false;
let playerStartX = 0;
let playerStartZ = 0;

let minimapContainer = null;
let playerDot = null;
let mapVisible = false;
let aguaFloorMat = null;

const PALETTE = {
    WATER: {r:0, g:162, b:232},
    GRASS: {r:0, g:255, b:0},
    TALL_GRASS: {r:34, g:177, b:76}, // Verde Oscuro MS Paint
    DOOR_UNLOCKED: {r:181, g:230, b:29}, // Verde Lima
    DOOR_LOCKED: {r:255, g:174, b:201}, // Rosado
    PLAZA: {r:112, g:146, b:190}, // Gris azulado
    TREE: {r:0, g:0, b:0},
    SAND: {r:255, g:201, b:14}, // Amarillo oro
    DIRT: {r:255, g:242, b:0}, // Amarillo claro
    MOUNTAIN: {r:163, g:73, b:164}, // Purpura MS Paint
    PEAK: {r:200, g:191, b:231}, // Lavanda MS Paint
    WOOD: {r:185, g:122, b:87},
    CHEST: {r:255, g:0, b:0},
    INDOOR_FLOOR: {r:136, g:0, b:21}, // Rojo oscuro
    SNOW_PEAK: {r:255, g:255, b:255},
    BUILDING: {r:128, g:128, b:128},
    POI: {r:0, g:0, b:139}, // Azul Oscuro para Punto de Spawn
    BOAT: {r:23, g:63, b:63}
};

const FLOOR_COLORS = {
    WATER: '#1F7068',
    GRASS: '#004400',
    TALL_GRASS: '#004400', 
    DOOR_UNLOCKED: '#452209',
    DOOR_LOCKED: '#452209', 
    PLAZA: '#3B444C',
    TREE: '#004400', 
    SAND: '#6D5210',
    DIRT: '#808000',
    MOUNTAIN: '#400040',
    PEAK: '#73737D',
    WOOD: '#452209',
    CHEST: '#450000',
    INDOOR_FLOOR: '#450000',
    SNOW_PEAK: '#808080',
    BUILDING: '#404040',
    POI: '#452209', // Color de madera para el spawn
    BOAT: '#173F3F'
};

function getClosestType(r, g, b, a) {
    if (a < 128) return 'GRASS'; 
    let minDist = Infinity;
    let closestType = 'GRASS';
    for (const [type, color] of Object.entries(PALETTE)) {
        const dist = Math.sqrt((r - color.r)**2 + (g - color.g)**2 + (b - color.b)**2);
        if (dist < minDist) {
            minDist = dist;
            closestType = type;
        }
    }
    return closestType;
}

// Cargar texturas de Sprites
const texLoader = new THREE.TextureLoader();
const pino1Tex = texLoader.load('./imagenes/Sprites/pino1.png');
const pino2Tex = texLoader.load('./imagenes/Sprites/pino2.png');
const weed1Tex = texLoader.load('./imagenes/Sprites/weed1.png');
const weed2Tex = texLoader.load('./imagenes/Sprites/weed2.png');
const weed3Tex = texLoader.load('./imagenes/Sprites/weed3.png');
const pastoTex = texLoader.load('./imagenes/Texturas/Pasto.png');
const tierraTex = texLoader.load('./imagenes/Texturas/Tierra.png');
const cieloTex = texLoader.load('./imagenes/Texturas/Cielo.jpeg');
const arenaTex = texLoader.load('./imagenes/Texturas/arena.png');
const agua1Tex = texLoader.load('./imagenes/Texturas/Agua1.png');
const agua2Tex = texLoader.load('./imagenes/Texturas/Agua2.png');
const agua3Tex = texLoader.load('./imagenes/Texturas/Agua3.png');
const muroTex = texLoader.load('./imagenes/Texturas/muro.png');
const maderaTex = texLoader.load('./imagenes/Texturas/madera.jpg');
const puertaTex = texLoader.load('./imagenes/Texturas/puerta.png');
const piedraTex = texLoader.load('./imagenes/Texturas/piedra.png');
const rocaTex = texLoader.load('./imagenes/Texturas/rocas.jpg');
const nieveTex = texLoader.load('./imagenes/Texturas/nieve.png');

[pino1Tex, pino2Tex, weed1Tex, weed2Tex, weed3Tex, pastoTex, tierraTex, cieloTex, arenaTex, agua1Tex, agua2Tex, agua3Tex, muroTex, maderaTex, puertaTex, piedraTex, rocaTex, nieveTex].forEach(t => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
});

[piedraTex, rocaTex, nieveTex, pastoTex, tierraTex, arenaTex, agua1Tex, agua2Tex, agua3Tex].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
});

const puertaFlippedTex = puertaTex.clone();
puertaFlippedTex.wrapS = THREE.RepeatWrapping;
puertaFlippedTex.repeat.x = -1;
puertaFlippedTex.needsUpdate = true;

// Cargar texturas del Cielo de Día
const skyDayR = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_r_txt_0.png');
const skyDayL = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_l_txt_0.png');
const skyDayT = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_t_txt_0.png');
const skyDayF = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_f_txt_0.png');
const skyDayB = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_b_txt_0.png');

[skyDayR, skyDayL, skyDayT, skyDayF, skyDayB].forEach(t => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
});

// Caja de Cielo (Skybox) - Noche y Día
const skyGeo = new THREE.BoxGeometry(1400, 700, 1400);

// Materiales Noche
const skyMatNight = new THREE.MeshBasicMaterial({ map: cieloTex, side: THREE.BackSide, fog: false, transparent: true, opacity: 1, depthWrite: false });
const skyMatInvisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.BackSide, fog: false, depthWrite: false });
const nightMaterials = [skyMatNight, skyMatNight, skyMatNight, skyMatInvisible, skyMatNight, skyMatNight];
const nightSkyMesh = new THREE.Mesh(skyGeo, nightMaterials);
nightSkyMesh.renderOrder = -1;

// Materiales Día
const createDayMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, transparent: true, opacity: 0, depthWrite: false });
const dayMaterials = [
    createDayMat(skyDayR), // Right
    createDayMat(skyDayL), // Left
    createDayMat(skyDayT), // Top
    skyMatInvisible,       // Bottom
    createDayMat(skyDayB), // Front (pz) -> OOT "back" maps to Threejs +Z
    createDayMat(skyDayF)  // Back (nz) -> OOT "front" maps to Threejs -Z
];
const daySkyMesh = new THREE.Mesh(skyGeo, dayMaterials);
daySkyMesh.renderOrder = -1;

skyMesh = new THREE.Group();
skyMesh.add(nightSkyMesh);
skyMesh.add(daySkyMesh);
scene.add(skyMesh);

const mapImage = new Image();
mapImage.src = './imagenes/Mapa/mapa_final_v2.png';

mapImage.onload = () => {
    buildWorld(mapImage);
    mapLoaded = true;
    loadingScreen.style.display = 'none'; 
    mainMenu.style.display = 'flex';      
};
mapImage.onerror = () => {
    loadingScreen.innerHTML = `<span style="color:red;">ERROR: No se encontró 'mapa_final_v2.png'</span>`;
};

function createMinimapUI(floorCanvas) {
    if (minimapContainer) return; 
    
    minimapContainer = document.createElement('div');
    minimapContainer.style.position = 'absolute';
    minimapContainer.style.top = '20px';
    minimapContainer.style.right = '20px';
    minimapContainer.style.width = '256px';
    minimapContainer.style.height = '256px';
    minimapContainer.style.border = '4px solid rgba(255, 255, 255, 0.7)';
    minimapContainer.style.display = 'none';
    minimapContainer.style.zIndex = '100';
    minimapContainer.style.backgroundColor = '#1F7068';
    document.body.appendChild(minimapContainer);

    const minimapImg = document.createElement('img');
    minimapImg.src = floorCanvas.toDataURL();
    minimapImg.style.width = '100%';
    minimapImg.style.height = '100%';
    minimapImg.style.imageRendering = 'pixelated';
    minimapContainer.appendChild(minimapImg);

    playerDot = document.createElement('div');
    playerDot.style.position = 'absolute';
    playerDot.style.width = '6px';
    playerDot.style.height = '6px';
    playerDot.style.backgroundColor = '#ff0000';
    playerDot.style.borderRadius = '50%';
    playerDot.style.transform = 'translate(-50%, -50%)';
    playerDot.style.border = '1px solid white';
    minimapContainer.appendChild(playerDot);
}

function buildWorld(image) {
    mapWidth = image.width;
    mapHeight = image.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, mapWidth, mapHeight).data;
    
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = mapWidth;
    floorCanvas.height = mapHeight;
    const floorCtx = floorCanvas.getContext('2d');

    collisionMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill(false));
    floorMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill('GRASS'));
    
    const counts = { PINO1: 0, PINO2: 0, BUILDING: 0, MOUNTAIN: 0, PEAK: 0, SNOW_PEAK: 0, WEED1: 0, WEED2: 0, WEED3: 0, CEILING: 0, ROOF: 0, GRASS_FLOOR: 0, DIRT_FLOOR: 0, ARENA_FLOOR: 0, AGUA_FLOOR: 0, MADERA_FLOOR: 0, BASE_FLOOR: 0 };
    playerStartX = mapWidth / 2;
    playerStartZ = mapHeight / 2;

    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const idx = (z * mapWidth + x) * 4;
            const type = getClosestType(imgData[idx], imgData[idx+1], imgData[idx+2], imgData[idx+3]);
            
            floorMap[z][x] = type;
            if (type !== 'WATER' && type !== 'BOAT') {
                floorCtx.fillStyle = FLOOR_COLORS[type] || '#000000';
                floorCtx.fillRect(x, z, 1, 1);
            }
            
            if (type === 'TREE') {
                const isPino1 = ((x * 31 + z * 17) % 10) < 8;
                if (isPino1) counts.PINO1++; else counts.PINO2++;
            } else if (type === 'TALL_GRASS') {
                const weedVariant = ((x * 13 + z * 7) % 3);
                if (weedVariant === 0) counts.WEED1++;
                else if (weedVariant === 1) counts.WEED2++;
                else counts.WEED3++;
            }
            if (counts[type] !== undefined) counts[type]++;
            
            if (type === 'INDOOR_FLOOR') {
                counts.CEILING++;
                counts.MADERA_FLOOR++;
            } else if (type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED' || type === 'WOOD') {
                counts.MADERA_FLOOR++;
                if (type !== 'WOOD') counts.CEILING++; // Techos para puertas
            } else if (type === 'POI') {
                counts.CEILING++; // Techo para el punto de spawn
                counts.MADERA_FLOOR++; // Suelo de madera para el spawn
            }
            
            if (type === 'GRASS' || type === 'TALL_GRASS' || type === 'TREE') counts.GRASS_FLOOR++;
            else if (type === 'DIRT') counts.DIRT_FLOOR++;
            else if (type === 'SAND') counts.ARENA_FLOOR++;
            else if (type === 'WATER' || type === 'BOAT') counts.AGUA_FLOOR++;

            if (type !== 'WATER' && type !== 'BOAT' && type !== 'POI') counts.BASE_FLOOR++;

            // Solid obstacles
            if (['BUILDING', 'CHEST', 'DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(type)) {
                collisionMap[z][x] = type;
            } else if (type === 'TREE') {
                collisionMap[z][x] = 'TREE';
            }
            
            if (type === 'POI') {
                playerStartX = x;
                playerStartZ = z;
            }
        }
    }
    // El floorCanvas se utilizará ahora exclusivamente para el minimapa
    // Eliminado el floorMesh (la imagen del mapa 2D en el mundo 3D) para no interferir con las laderas y profundidades del terreno continuo.
    
    // Lecho marino (fondo profundo absoluto por si hay huecos)
    const seabedGeo = new THREE.PlaneGeometry(mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE);
    const seabedMat = new THREE.MeshPhongMaterial({ color: 0x050511, shininess: 0 }); // Oscuridad profunda
    const seabedMesh = new THREE.Mesh(seabedGeo, seabedMat);
    seabedMesh.rotation.x = -Math.PI / 2;
    seabedMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, -2.5, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
    scene.add(seabedMesh);

    // Geometrías
    const planeGeo = new THREE.PlaneGeometry(UNIT_SIZE, WALL_HEIGHT*3);
    const grassPlaneGeo = new THREE.PlaneGeometry(UNIT_SIZE, WALL_HEIGHT*0.8);
    const cubeGeo = new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, UNIT_SIZE);

    // Materiales Instanced (Usamos Phong para recibir la luz de la antorcha por píxel)
    const pino1Mat = new THREE.MeshPhongMaterial({ map: pino1Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const pino2Mat = new THREE.MeshPhongMaterial({ map: pino2Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed1Mat = new THREE.MeshPhongMaterial({ map: weed1Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed2Mat = new THREE.MeshPhongMaterial({ map: weed2Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed3Mat = new THREE.MeshPhongMaterial({ map: weed3Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    
    // Los colores son afectados por las luces para dar la sensación Dark Fantasy
    const bldgMat = new THREE.MeshPhongMaterial({ map: muroTex, shininess: 0 });
    const mtnMat = new THREE.MeshPhongMaterial({ color: 0x400040, shininess: 0 }); 
    const peakMat = new THREE.MeshPhongMaterial({ color: 0x73737D, shininess: 0 }); 
    const snowPeakMat = new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 0 }); 
    const ceilingMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 0 }); 
    const roofMat = new THREE.MeshPhongMaterial({ color: 0x4a2511, shininess: 0 }); 
    const grassFloorMat = new THREE.MeshPhongMaterial({ map: pastoTex, shininess: 0 });
    const dirtFloorMat = new THREE.MeshPhongMaterial({ map: tierraTex, shininess: 0 });
    const arenaFloorMat = new THREE.MeshPhongMaterial({ map: arenaTex, shininess: 0 });
    const maderaFloorMat = new THREE.MeshPhongMaterial({ map: maderaTex, shininess: 0 });
    aguaFloorMat = new THREE.MeshPhongMaterial({ map: agua1Tex, transparent: true, opacity: 0.4, side: THREE.DoubleSide, shininess: 50 });
    const baseFloorMat = new THREE.MeshPhongMaterial({ color: 0x101010, shininess: 0 }); // Oscuro y sólido para los cimientos

    // Multiplicamos por 2 los sprites porque usamos técnica Cross-Quad (X)
    const pino1Mesh = new THREE.InstancedMesh(planeGeo, pino1Mat, counts.PINO1 * 2);
    const pino2Mesh = new THREE.InstancedMesh(planeGeo, pino2Mat, counts.PINO2 * 2);
    const weed1Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed1Mat, counts.WEED1 * 2);
    const weed2Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed2Mat, counts.WEED2 * 2);
    const weed3Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed3Mat, counts.WEED3 * 2);
    
    // Alturas personalizadas para las cajas (BUILDING ahora es WALL_HEIGHT)
    const bldgMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, UNIT_SIZE), bldgMat, counts.BUILDING);
    const ceilingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, 0.2, UNIT_SIZE), ceilingMat, counts.CEILING);

    const floorTileGeo = new THREE.BoxGeometry(UNIT_SIZE, 1.0, UNIT_SIZE);
    const maderaFloorMesh = new THREE.InstancedMesh(floorTileGeo, maderaFloorMat, counts.MADERA_FLOOR);

    // Plano de agua global que cubre todo el mapa
    [agua1Tex, agua2Tex, agua3Tex].forEach(t => {
        t.repeat.set(mapWidth, mapHeight);
    });
    const globalWaterGeo = new THREE.PlaneGeometry(mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE);
    const globalWaterMesh = new THREE.Mesh(globalWaterGeo, aguaFloorMat);
    globalWaterMesh.rotation.x = -Math.PI / 2;
    // Nivel del mar en -0.05
    globalWaterMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, -0.05, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
    scene.add(globalWaterMesh);

    let idxPino1=0, idxPino2=0, idxWeed1=0, idxWeed2=0, idxWeed3=0, idxBldg=0, idxMtn=0, idxPeak=0, idxSnowPeak=0, idxCeil=0, idxRoof=0, idxMadera=0;
    const dummy = new THREE.Object3D(); 
    
    // Calcular Mapa de Elevación base usando BFS (Distance Transform)
    elevationMap = Array(mapHeight).fill(0).map(() => Array(mapWidth).fill(undefined));
    const hQueue = [];
    for (let r = 0; r < mapHeight; r++) {
        for (let c = 0; c < mapWidth; c++) {
            const t = floorMap[r][c];
            if (t === 'MOUNTAIN') elevationMap[r][c] = WALL_HEIGHT * 3;
            else if (t === 'PEAK') elevationMap[r][c] = WALL_HEIGHT * 5;
            else if (t === 'SNOW_PEAK') elevationMap[r][c] = WALL_HEIGHT * 7;
            else if (['GRASS', 'SAND', 'DIRT', 'PLAZA'].includes(t)) elevationMap[r][c] = 0;
            if (elevationMap[r][c] !== undefined) hQueue.push({r, c, h: elevationMap[r][c]});
        }
    }
    let hHead = 0;
    while (hHead < hQueue.length) {
        const {r, c, h} = hQueue[hHead++];
        const nbrs = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
        for (let i = 0; i < 4; i++) {
            const nr = nbrs[i][0], nc = nbrs[i][1];
            if (nr >= 0 && nr < mapHeight && nc >= 0 && nc < mapWidth && elevationMap[nr][nc] === undefined) {
                elevationMap[nr][nc] = h;
                hQueue.push({r: nr, c: nc, h});
            }
        }
    }
    
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const idx = (z * mapWidth + x) * 4;
            const type = getClosestType(imgData[idx], imgData[idx+1], imgData[idx+2], imgData[idx+3]);
            
            const posX = x * UNIT_SIZE;
            const posZ = z * UNIT_SIZE;
            const baseH = elevationMap[z][x];
            dummy.rotation.set(0, 0, 0); // ¡CRUCIAL! Resetear rotación para que las cajas no se acuesten
            
            // Sprites (Cross-Quads)
            if (type === 'TREE') {
                const isPino1 = ((x * 31 + z * 17) % 10) < 8;
                const targetMesh = isPino1 ? pino1Mesh : pino2Mesh;
                
                // Plano 1
                dummy.position.set(posX, baseH + ((WALL_HEIGHT*3)/2) - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                if(isPino1) pino1Mesh.setMatrixAt(idxPino1++, dummy.matrix); else pino2Mesh.setMatrixAt(idxPino2++, dummy.matrix);
                
                // Plano 2 cruzado
                dummy.rotation.set(0, Math.PI/2, 0);
                dummy.updateMatrix();
                if(isPino1) pino1Mesh.setMatrixAt(idxPino1++, dummy.matrix); else pino2Mesh.setMatrixAt(idxPino2++, dummy.matrix);

            } else if (type === 'TALL_GRASS') {
                const weedVariant = ((x * 13 + z * 7) % 3);
                
                dummy.position.set(posX, baseH + ((WALL_HEIGHT*0.8)/2) - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                if(weedVariant===0) weed1Mesh.setMatrixAt(idxWeed1++, dummy.matrix);
                else if(weedVariant===1) weed2Mesh.setMatrixAt(idxWeed2++, dummy.matrix);
                else weed3Mesh.setMatrixAt(idxWeed3++, dummy.matrix);
                
                dummy.rotation.set(0, Math.PI/2, 0);
                dummy.updateMatrix();
                if(weedVariant===0) weed1Mesh.setMatrixAt(idxWeed1++, dummy.matrix);
                else if(weedVariant===1) weed2Mesh.setMatrixAt(idxWeed2++, dummy.matrix);
                else weed3Mesh.setMatrixAt(idxWeed3++, dummy.matrix);
            } 
            // Cajas Estáticas
            else if (type === 'BUILDING') {
                dummy.position.set(posX, baseH + WALL_HEIGHT/2, posZ);
                dummy.updateMatrix();
                bldgMesh.setMatrixAt(idxBldg++, dummy.matrix);
            } else if (type === 'INDOOR_FLOOR') {
                dummy.position.set(posX, baseH + WALL_HEIGHT, posZ); // Techo plano
                dummy.updateMatrix();
                ceilingMesh.setMatrixAt(idxCeil++, dummy.matrix);
            }
            // Objetos Interactivos
            else if (type === 'CHEST') {
                const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(UNIT_SIZE*0.8, 1.0, UNIT_SIZE*0.8), new THREE.MeshPhongMaterial({color: 0x8b0000, shininess: 0}));
                chestMesh.position.set(posX, baseH + 0.5, posZ);
                chestMesh.userData = { type: 'CHEST', gx: x, gz: z };
                scene.add(chestMesh);
                interactables.push(chestMesh);
            } else if (type === 'BOAT') {
                const boatGeo = new THREE.BoxGeometry(UNIT_SIZE*0.8, 0.4, UNIT_SIZE*0.8);
                const boatMat = new THREE.MeshPhongMaterial({ map: maderaTex, color: 0xaa8866, shininess: 0 }); 
                const boatMesh = new THREE.Mesh(boatGeo, boatMat);
                boatMesh.position.set(posX, baseH + 0.2, posZ); 
                boatMesh.userData = { type: 'BOAT', gx: x, gz: z };
                scene.add(boatMesh);
                interactables.push(boatMesh);
            } else if (type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED') {
                const isLocked = type === 'DOOR_LOCKED';
                const tintColor = isLocked ? 0xffbbbb : 0xffffff;
                
                // Determinar orientación basada en los edificios vecinos (horizontal o vertical)
                const isHorizontal = (x > 0 && floorMap[z][x-1] === 'BUILDING') || (x < mapWidth-1 && floorMap[z][x+1] === 'BUILDING') || (x > 0 && ['DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(floorMap[z][x-1])) || (x < mapWidth-1 && ['DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(floorMap[z][x+1]));
                
                // Determinar si es la hoja derecha de una puerta doble
                const isRightDoor = (isHorizontal && x > 0 && ['DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(floorMap[z][x-1])) || (!isHorizontal && z > 0 && ['DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(floorMap[z-1][x]));

                const doorGroup = new THREE.Group();
                doorGroup.position.set(posX, baseH + WALL_HEIGHT / 2, posZ);
                
                const doorGeo = isHorizontal ? new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, 0.4) : new THREE.BoxGeometry(0.4, WALL_HEIGHT, UNIT_SIZE);
                
                const matNormal = new THREE.MeshPhongMaterial({ map: puertaTex, color: tintColor, shininess: 0 });
                const matFlipped = new THREE.MeshPhongMaterial({ map: puertaFlippedTex, color: tintColor, shininess: 0 });
                let mats;
                
                if (isHorizontal) {
                    if (!isRightDoor) mats = [matNormal, matNormal, matNormal, matNormal, matNormal, matFlipped];
                    else mats = [matNormal, matNormal, matNormal, matNormal, matFlipped, matNormal];
                } else {
                    if (!isRightDoor) mats = [matFlipped, matNormal, matNormal, matNormal, matNormal, matNormal];
                    else mats = [matNormal, matFlipped, matNormal, matNormal, matNormal, matNormal];
                }
                
                const doorMesh = new THREE.Mesh(doorGeo, mats);
                
                // Desplazar el mesh para que el pivote quede en el borde
                if (isHorizontal) {
                    const offset = isRightDoor ? -UNIT_SIZE/2 : UNIT_SIZE/2;
                    doorMesh.position.set(offset, 0, 0);
                    doorGroup.position.x -= offset;
                } else {
                    const offset = isRightDoor ? -UNIT_SIZE/2 : UNIT_SIZE/2;
                    doorMesh.position.set(0, 0, offset);
                    doorGroup.position.z -= offset;
                }
                
                doorGroup.add(doorMesh);
                
                const swingDir = isRightDoor ? -1 : 1;
                const uData = { type: 'DOOR', locked: isLocked, isOpen: false, gx: x, gz: z, parentGroup: doorGroup, isHorizontal: isHorizontal, swingDir: swingDir };
                doorMesh.userData = uData;
                doorGroup.userData = uData;
                
                scene.add(doorGroup);
                interactables.push(doorMesh);
                
                // Añadir techo sobre la puerta
                dummy.position.set(posX, baseH + WALL_HEIGHT, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                ceilingMesh.setMatrixAt(idxCeil++, dummy.matrix);
            }

            // Pisos especiales (Madera)
            if (type === 'INDOOR_FLOOR' || type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED' || type === 'WOOD') {
                dummy.position.set(posX, baseH - 0.49, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                maderaFloorMesh.setMatrixAt(idxMadera++, dummy.matrix);
            } else if (type === 'POI') {
                // Techo para spawn
                dummy.position.set(posX, baseH + WALL_HEIGHT, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                ceilingMesh.setMatrixAt(idxCeil++, dummy.matrix);
                
                // Suelo de madera
                dummy.position.set(posX, baseH - 0.49, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                maderaFloorMesh.setMatrixAt(idxMadera++, dummy.matrix);
            }
        }
    }
    
    scene.add(pino1Mesh);
    scene.add(pino2Mesh);
    scene.add(weed1Mesh);
    scene.add(weed2Mesh);
    scene.add(weed3Mesh);
    scene.add(bldgMesh);
    scene.add(ceilingMesh);
    scene.add(maderaFloorMesh);
    
    // --- GENERACIÓN DE TERRENO (MONTAÑAS CONTINUAS CON TEXTURAS) ---
    const terrainGeo = new THREE.PlaneGeometry((mapWidth - 1) * UNIT_SIZE, (mapHeight - 1) * UNIT_SIZE, mapWidth - 1, mapHeight - 1);
    terrainGeo.rotateX(-Math.PI / 2); // Acostarlo en XZ
    terrainGeo.translate(((mapWidth - 1) * UNIT_SIZE) / 2, 0, ((mapHeight - 1) * UNIT_SIZE) / 2); // Alinear vértices con la grilla

    const positions = terrainGeo.attributes.position.array;
    const uvs = terrainGeo.attributes.uv.array;
    const splatWeights = new Float32Array(positions.length / 3 * 4);

    for (let i = 0; i < positions.length / 3; i++) {
        const col = i % mapWidth;
        const row = Math.floor(i / mapWidth); 
        const type = floorMap[row] ? floorMap[row][col] : 'GRASS';
        
        // Pesos para texturas: R=Pasto, G=Tierra, B=Arena, A=Cimientos
        let wGrass = 0, wDirt = 0, wSand = 0, wBase = 0;
        if (['GRASS', 'TALL_GRASS', 'TREE'].includes(type)) wGrass = 1;
        else if (type === 'DIRT') wDirt = 1;
        else if (['SAND', 'WATER', 'BOAT'].includes(type)) wSand = 1;
        else wBase = 1;
        
        splatWeights[i * 4] = wGrass;
        splatWeights[i * 4 + 1] = wDirt;
        splatWeights[i * 4 + 2] = wSand;
        splatWeights[i * 4 + 3] = wBase;

        let y = elevationMap[row][col]; 
        
        if (type === 'WATER' || type === 'BOAT') {
            y -= 2.0; // Hundir la cuenca más profundo
        } else if (['GRASS', 'TALL_GRASS', 'TREE', 'DIRT', 'SAND'].includes(type)) {
            // Ruido suave para dar volumen continuo al terreno
            let terrainNoise = ((Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1);
            if (terrainNoise < 0) terrainNoise += 1;
            y += terrainNoise * 0.2;
        } else if (['BUILDING', 'INDOOR_FLOOR', 'POI'].includes(type)) {
            y -= 0.1; // Evitar Z-fighting con pisos de madera/edificios
        }

        positions[i * 3 + 1] = y;
    }
    
    terrainGeo.setAttribute('splatWeights', new THREE.BufferAttribute(splatWeights, 4));

    // Escalar UVs para que la textura se repita en cada cuadrícula (1x1 unidades)
    for(let i = 0; i < uvs.length; i += 2) {
        uvs[i] *= (mapWidth - 1);
        uvs[i+1] *= (mapHeight - 1);
    }
    
    terrainGeo.computeVertexNormals();

    const baseIndices = terrainGeo.getIndex().array;
    const mtnIndices = [];
    const peakIndices = [];
    const snowIndices = [];
    const flatIndices = [];

    for (let row = 0; row < mapHeight - 1; row++) {
        for (let col = 0; col < mapWidth - 1; col++) {
            const v1 = floorMap[row][col];
            const v2 = floorMap[row][col+1];
            const v3 = floorMap[row+1][col];
            const v4 = floorMap[row+1][col+1];
            
            let highest = 'NONE';
            for(let v of [v1, v2, v3, v4]) {
                if (v === 'SNOW_PEAK') highest = 'SNOW_PEAK';
                else if (v === 'PEAK' && highest !== 'SNOW_PEAK') highest = 'PEAK';
                else if (v === 'MOUNTAIN' && highest !== 'SNOW_PEAK' && highest !== 'PEAK') highest = 'MOUNTAIN';
            }
            
            const quadIdx = row * (mapWidth - 1) + col;
            const iStart = quadIdx * 6;
            const i0 = baseIndices[iStart];
            const i1 = baseIndices[iStart+1];
            const i2 = baseIndices[iStart+2];
            const i3 = baseIndices[iStart+3];
            const i4 = baseIndices[iStart+4];
            const i5 = baseIndices[iStart+5];
            
            if (highest === 'SNOW_PEAK') snowIndices.push(i0, i1, i2, i3, i4, i5);
            else if (highest === 'PEAK') peakIndices.push(i0, i1, i2, i3, i4, i5);
            else if (highest === 'MOUNTAIN') mtnIndices.push(i0, i1, i2, i3, i4, i5);
            else {
                // Todo el terreno plano se une; el shader se encarga de difuminar texturas según splatWeights
                flatIndices.push(i0, i1, i2, i3, i4, i5);
            }
        }
    }

    const mtnGeo = terrainGeo.clone(); mtnGeo.setIndex(mtnIndices);
    scene.add(new THREE.Mesh(mtnGeo, new THREE.MeshPhongMaterial({ map: piedraTex, shininess: 0 })));

    const peakGeo = terrainGeo.clone(); peakGeo.setIndex(peakIndices);
    scene.add(new THREE.Mesh(peakGeo, new THREE.MeshPhongMaterial({ map: rocaTex, shininess: 0 })));

    const snowGeo = terrainGeo.clone(); snowGeo.setIndex(snowIndices);
    scene.add(new THREE.Mesh(snowGeo, new THREE.MeshPhongMaterial({ map: nieveTex, shininess: 0 })));

    // --- MATERIAL SPlAT (DIFUMINADO) PARA EL TERRENO PLANO ---
    const splatMaterial = new THREE.MeshPhongMaterial({ map: pastoTex, shininess: 0 }); // El map dummy activa USE_MAP
    splatMaterial.onBeforeCompile = function (shader) {
        shader.uniforms.tGrass = { value: pastoTex };
        shader.uniforms.tDirt = { value: tierraTex };
        shader.uniforms.tSand = { value: arenaTex };

        shader.vertexShader = `
            attribute vec4 splatWeights;
            varying vec4 vSplat;
            ${shader.vertexShader}
        `.replace(
            `#include <uv_vertex>`,
            `#include <uv_vertex>
             vSplat = splatWeights;`
        );

        shader.fragmentShader = `
            uniform sampler2D tGrass;
            uniform sampler2D tDirt;
            uniform sampler2D tSand;
            varying vec4 vSplat;
            ${shader.fragmentShader}
        `.replace(
            `#include <map_fragment>`,
            `
            #ifdef USE_MAP
                vec4 texelGrass = texture2D(tGrass, vMapUv);
                vec4 texelDirt = texture2D(tDirt, vMapUv);
                vec4 texelSand = texture2D(tSand, vMapUv);
                vec4 texelBase = vec4(0.06, 0.06, 0.06, 1.0); 

                // Promedio ponderado de texturas
                vec4 blendedTexel = texelGrass * vSplat.x + texelDirt * vSplat.y + texelSand * vSplat.z + texelBase * vSplat.w;
                diffuseColor *= blendedTexel;
            #endif
            `
        );
    };

    const flatGeo = terrainGeo.clone(); flatGeo.setIndex(flatIndices);
    scene.add(new THREE.Mesh(flatGeo, splatMaterial));

    // Buscar punto de spawn seguro si POI no fue válido o se omitió
    let spawnSafe = false;
    for(let r = 0; r < 50; r++) {
        if(!isWall(playerStartX * UNIT_SIZE, playerStartZ * UNIT_SIZE)) {
            spawnSafe = true; break;
        }
        playerStartX++; // Mover a la derecha hasta salir de la pared
    }
    
    camera.position.set(playerStartX * UNIT_SIZE, PLAYER_HEIGHT, playerStartZ * UNIT_SIZE);
    createMinimapUI(floorCanvas);
}

function getTerrainHeight(x, z) {
    if (floorMap.length === 0) return 0;
    
    // Mapear de coordenadas del mundo a vértices (0, 1, 2...)
    const gx = x / UNIT_SIZE;
    const gz = z / UNIT_SIZE;
    
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = x0 + 1;
    const z1 = z0 + 1;
    
    const dx = gx - x0;
    const dz = gz - z0;
    
    function getHeightAt(col, row) {
        if (row >= 0 && row < mapHeight && col >= 0 && col < mapWidth) {
            const type = floorMap[row][col];
            let y = elevationMap[row][col];
            
            if (type === 'WATER' || type === 'BOAT') {
                y -= 2.0;
            } else if (['GRASS', 'TALL_GRASS', 'TREE', 'DIRT', 'SAND'].includes(type)) {
                let terrainNoise = ((Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1);
                if (terrainNoise < 0) terrainNoise += 1;
                y += terrainNoise * 0.2;
            } else if (['BUILDING', 'INDOOR_FLOOR', 'POI'].includes(type)) {
                y -= 0.1;
            }
            return y;
        }
        return 0;
    }

    const h00 = getHeightAt(x0, z0);
    const h10 = getHeightAt(x1, z0);
    const h01 = getHeightAt(x0, z1);
    const h11 = getHeightAt(x1, z1);
    
    const h0 = h00 * (1 - dx) + h10 * dx;
    const h1 = h01 * (1 - dx) + h11 * dx;
    
    return h0 * (1 - dz) + h1 * dz;
}

// --- COLISIONES ---
function isWall(x, z) {
    if (collisionMap.length === 0) return true; 
    const currentGX = Math.floor((x + UNIT_SIZE/2) / UNIT_SIZE);
    const currentGZ = Math.floor((z + UNIT_SIZE/2) / UNIT_SIZE);

    for(let dz = -1; dz <= 1; dz++) {
        for(let dx = -1; dx <= 1; dx++) {
            const cz = currentGZ + dz;
            const cx = currentGX + dx;
            if (cz >= 0 && cz < mapHeight && cx >= 0 && cx < mapWidth) {
                if (collisionMap[cz][cx] === 'TREE') {
                    const centerX = cx * UNIT_SIZE;
                    const centerZ = cz * UNIT_SIZE;
                    const dist = Math.sqrt((x - centerX)**2 + (z - centerZ)**2);
                    if (dist < 0.4 + COLLISION_RADIUS) return true;
                }
            }
        }
    }

    const points = [
        {x: x - COLLISION_RADIUS, z: z - COLLISION_RADIUS},
        {x: x + COLLISION_RADIUS, z: z - COLLISION_RADIUS},
        {x: x - COLLISION_RADIUS, z: z + COLLISION_RADIUS},
        {x: x + COLLISION_RADIUS, z: z + COLLISION_RADIUS}
    ];
    
    for (let p of points) {
        const gX = Math.floor((p.x + UNIT_SIZE/2) / UNIT_SIZE);
        const gZ = Math.floor((p.z + UNIT_SIZE/2) / UNIT_SIZE);
        if (gZ < 0 || gZ >= mapHeight || gX < 0 || gX >= mapWidth) return true;
        
        const cell = collisionMap[gZ][gX];
        if (cell && cell !== 'TREE') return true; 
        
        if (isRidingBoat && floorMap[gZ][gX] !== 'WATER' && floorMap[gZ][gX] !== 'BOAT') return true;
    }
    return false;
}

// --- BUCLE PRINCIPAL ---
const clock = new THREE.Clock();
let bobTimer = 0;
const msgDisplay = document.getElementById('interaction-msg');

const STAMINA_MAX = 3.0;
let stamina = STAMINA_MAX;
const staminaContainer = document.getElementById('stamina-container');
const staminaBar = document.getElementById('stamina-bar');

window.restartGame = () => {
    isDead = false;
    stamina = STAMINA_MAX;
    const controlObj = controls.getObject();
    controlObj.position.set(playerStartX * UNIT_SIZE, PLAYER_HEIGHT, playerStartZ * UNIT_SIZE);
    document.getElementById('death-screen').style.display = 'none';
    staminaContainer.style.display = 'none';
    controls.lock();
};

function animate() {
    requestAnimationFrame(animate);

    const controlObj = controls.getObject();
    skyMesh.position.set(controlObj.position.x, 200, controlObj.position.z);

    if (controls.isLocked && mapLoaded) {
        const delta = Math.min(clock.getDelta(), 0.1);

        // CICLO DÍA/NOCHE AUTOMÁTICO (Duración Total: 242s) - PAUSADO TEMPORALMENTE
        // dayNightTimer += delta;
        // if (dayNightTimer >= 242.0) {
        //     dayNightTimer -= 242.0;
        // }
        
        // Día: 157s (2m 37s). Noche: 85s (1m 25s).
        targetDayState = (dayNightTimer < 157.0);

        // TRANSICIÓN DÍA/NOCHE: Amanecer (12s), Anochecer (25s)
        if (targetDayState && dayTransition < 1.0) {
            const dawnSpeed = delta / 12.0;
            dayTransition += dawnSpeed;
            if (dayTransition > 1.0) dayTransition = 1.0;
        } else if (!targetDayState && dayTransition > 0.0) {
            const duskSpeed = delta / 25.0;
            dayTransition -= duskSpeed;
            if (dayTransition < 0.0) dayTransition = 0.0;
        }

        // Interpolar Opacidad del Cielo
        skyMesh.children[0].material.forEach((m, idx) => { if (idx !== 3) m.opacity = 1.0 - dayTransition; }); // Noche
        skyMesh.children[1].material.forEach((m, idx) => { if (idx !== 3) m.opacity = dayTransition; }); // Día

        // Interpolar Iluminación Global y Niebla
        const nightFog = new THREE.Color(0x0a0a14);
        const dayFog = new THREE.Color(0x87CEEB);
        scene.fog.color.lerpColors(nightFog, dayFog, dayTransition);

        const nightAmbient = new THREE.Color(0x222233);
        const dayAmbient = new THREE.Color(0xffffff);
        ambientLight.color.lerpColors(nightAmbient, dayAmbient, dayTransition);
        ambientLight.intensity = 0.4 + (0.4 * dayTransition); // Sube un poco la intensidad en el día

        const nightDir = new THREE.Color(0x7788aa);
        const dayDir = new THREE.Color(0xffffee);
        dirLight.color.lerpColors(nightDir, dayDir, dayTransition);
        dirLight.intensity = 0.6 + (0.4 * dayTransition); // De 0.6 a 1.0

        // Raycaster para Interacciones
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        const intersects = raycaster.intersectObjects(interactables);
        
        if (intersects.length > 0 && intersects[0].distance < 3.5) {
            targetInteractable = intersects[0].object;
            msgDisplay.style.display = 'block';
            if (targetInteractable.userData.type === 'CHEST') {
                msgDisplay.innerText = "Presiona E para abrir Cofre";
            } else if (targetInteractable.userData.type === 'BOAT') {
                msgDisplay.innerText = "Presiona E para usar Bote";
                msgDisplay.style.color = "#00ffff";
            } else if (targetInteractable.userData.type === 'DOOR') {
                if (targetInteractable.userData.locked) {
                    msgDisplay.innerText = keys > 0 ? "Presiona E para usar Llave" : "Necesitas una Llave";
                    msgDisplay.style.color = keys > 0 ? "#55ff55" : "#ff5555";
                } else {
                    msgDisplay.innerText = targetInteractable.userData.isOpen ? "Presiona E para Cerrar" : "Presiona E para Abrir";
                    msgDisplay.style.color = "#ffeb3b";
                }
            }
        } else {
            targetInteractable = null;
            msgDisplay.style.display = 'none';
        }

        velocity.x -= velocity.x * FRICTION * delta;
        velocity.z -= velocity.z * FRICTION * delta;

        direction.z = Number(moveState.forward) - Number(moveState.backward);
        direction.x = Number(moveState.right) - Number(moveState.left);
        direction.normalize(); 


        const startX = controlObj.position.x;
        const startZ = controlObj.position.z;
        
        const currentGX = Math.floor((startX + UNIT_SIZE/2) / UNIT_SIZE);
        const currentGZ = Math.floor((startZ + UNIT_SIZE/2) / UNIT_SIZE);
        let inWater = false;
        if (currentGZ >= 0 && currentGZ < mapHeight && currentGX >= 0 && currentGX < mapWidth) {
            if (floorMap[currentGZ][currentGX] === 'WATER' || floorMap[currentGZ][currentGX] === 'BOAT') inWater = true;
        }

        const waterSpeedMod = isRidingBoat ? 1.5 : (inWater ? 0.4 : 1.0);

        if (moveState.forward || moveState.backward) velocity.z -= direction.z * MOVEMENT_SPEED * (isRunning ? SPRINT_MULTIPLIER : 1) * waterSpeedMod * delta;
        if (moveState.left || moveState.right) velocity.x -= direction.x * MOVEMENT_SPEED * (isRunning ? SPRINT_MULTIPLIER : 1) * waterSpeedMod * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        const dx = controlObj.position.x - startX;
        const dz = controlObj.position.z - startZ;

        controlObj.position.x = startX;
        controlObj.position.z = startZ;

        if (isFlying) {
            controlObj.position.x += dx;
            controlObj.position.z += dz;
            if (moveState.up) controlObj.position.y += MOVEMENT_SPEED * (isRunning ? SPRINT_MULTIPLIER : 1) * delta;
            if (moveState.down) controlObj.position.y -= MOVEMENT_SPEED * (isRunning ? SPRINT_MULTIPLIER : 1) * delta;
            
            velocityY = 0;
            stamina = STAMINA_MAX;
            staminaContainer.style.display = 'none';
        } else {
            if (!isWall(startX + dx, startZ)) controlObj.position.x += dx; else velocity.x = 0; 
            if (!isWall(controlObj.position.x, startZ + dz)) controlObj.position.z += dz; else velocity.z = 0;

            if (inWater && !isRidingBoat) {
                staminaContainer.style.display = 'block';
                stamina -= delta;
                if (stamina <= 0) {
                    isDead = true;
                    controls.unlock();
                    document.getElementById('death-screen').style.display = 'flex';
                    return; 
                }
            } else {
                if (stamina < STAMINA_MAX) {
                    stamina += delta;
                    if (stamina >= STAMINA_MAX) {
                        stamina = STAMINA_MAX;
                        staminaContainer.style.display = 'none';
                    }
                }
            }
            
            if (staminaContainer.style.display === 'block') {
                staminaBar.style.width = (stamina / STAMINA_MAX * 100) + '%';
            }
        }

        const currentTerrainHeight = getTerrainHeight(controlObj.position.x, controlObj.position.z);
        let targetEyesHeight = (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT) + currentTerrainHeight;
        
        if (inWater && !isRidingBoat) {
            // Flotar en la superficie del agua (-0.05) en lugar de hundirse hasta el fondo marino
            // Mantener la cámara (ojos) a 0.2 metros sobre el nivel del agua para ver bien por encima
            targetEyesHeight = -0.05 + 0.2;
        }

        if (isFlying && controlObj.position.y < targetEyesHeight) {
            controlObj.position.y = targetEyesHeight;
        }

        if (!isFlying) {
            velocityY -= GRAVITY * delta; 
            controlObj.position.y += velocityY * delta; 

            if (controlObj.position.y < targetEyesHeight) {
                if (!inWater && controlObj.position.y < targetEyesHeight - 0.2) {
                    controlObj.position.y += (targetEyesHeight - controlObj.position.y) * 15 * delta;
                    velocityY = 0;
                    canJump = false;
                } else {
                    controlObj.position.y = targetEyesHeight;
                    velocityY = 0;
                    canJump = true;
                }
            }
        }
        
        // Colisión de techos (tanto normal como vuelo)
        if (currentGZ >= 0 && currentGZ < mapHeight && currentGX >= 0 && currentGX < mapWidth) {
            const currentFloor = floorMap[currentGZ][currentGX];
            if (currentFloor === 'INDOOR_FLOOR' || currentFloor === 'DOOR_UNLOCKED' || currentFloor === 'DOOR_LOCKED') {
                const ceilingMaxHeight = WALL_HEIGHT - 0.3; // Margen para la cámara
                if (controlObj.position.y > ceilingMaxHeight) {
                    controlObj.position.y = ceilingMaxHeight;
                    if (velocityY > 0) velocityY = 0;
                }
            }
        }

        const speed = Math.sqrt(velocity.x**2 + velocity.z**2);
        if (!isFlying) {
            if (speed > 1.0 && canJump && !isRidingBoat) {
                bobTimer += delta * (isRunning ? 12.0 : 8.0); 
                controlObj.position.y = targetEyesHeight + Math.sin(bobTimer) * 0.15;
            } else if (canJump) {
                bobTimer = 0;
                controlObj.position.y += (targetEyesHeight - controlObj.position.y) * 10 * delta;
            }
        }

        if (mapVisible && playerDot) {
            const px = (controlObj.position.x / (mapWidth * UNIT_SIZE)) * 100;
            const pz = (controlObj.position.z / (mapHeight * UNIT_SIZE)) * 100;
            playerDot.style.left = `${px}%`;
            playerDot.style.top = `${pz}%`;
        }
        
        // Efecto parpadeo antorcha
        torchLight.intensity = 2.5 + Math.random() * 0.8;
    }
    
    if (aguaFloorMat) {
        const time = clock.getElapsedTime();
        const frame = Math.floor(time * 1) % 3; // 1 frame por segundo
        if (frame === 0) aguaFloorMat.map = agua1Tex;
        else if (frame === 1) aguaFloorMat.map = agua2Tex;
        else aguaFloorMat.map = agua3Tex;
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
