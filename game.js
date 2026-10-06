import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- CONFIGURACIÓN DEL JUEGO ---
const UNIT_SIZE = 2; 
const WALL_HEIGHT = 2.2; 
const PLAYER_HEIGHT = 1.6; 
const MOVEMENT_SPEED = 20.0; 
const FRICTION = 8.0; 
const COLLISION_RADIUS = 0.3; 
const SPRINT_MULTIPLIER = 2.8; 

// Físicas verticales
let velocityY = 0;
const GRAVITY = 50.0;
const JUMP_FORCE = 7.5;
let canJump = true;
let isCrouching = false;
let isRunning = false;

// Inventario e Interacciones
let keys = 0;
const interactables = [];
const worldTorches = [];
const flickerLights = [];
const torchSprites = [];
let grahamSprite = null;
let targetInteractable = null;
let isRidingBoat = false;
let boatReference = null;

let isDialogOpen = false;
let dialogIndex = 0;
const npcDialogs = [
    "¡Qué bueno que ya despiertas! Te encontré inconsciente en la playa al sur de aquí, y te traje a mi hogar.",
    "No te pediría tu ayuda en una situación como esta, pero ¿podrías hacerme el favor de ir a buscar el Corazón del Bosque?",
    "Puedo entregarte la llave del puente, así puedes ir a conocer más de esta isla, solo déjame encontrarla...",
    "Te haré saber cuando la tenga en mis manos."
];

// --- SETUP DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14); // Noche azulada lúgubre
scene.fog = new THREE.Fog(0x0a0a14, 10, 60); // Niebla un poco más lejana

// Iluminación Dark Fantasy (Noche de Luna)
const ambientLight = new THREE.AmbientLight(0x11111a, 0.2); // Luz ambiental suave (más oscura)
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0x445577, 0.3); // Luz de luna (más oscura)
dirLight.position.set(-1, 1, 0.5);
scene.add(dirLight);

let skyMesh;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
scene.add(camera);

// Luz de Antorcha (Faltaba definirla, causaba el crash)
const torchLight = new THREE.PointLight(0xff8800, 8.0, 45, 1.0);
torchLight.position.set(1.0, 0.2, -0.5); // Posicionada más alta y movida en X
camera.add(torchLight);

let targetDayState = false;
let dayTransition = 0.0;
let dayNightTimer = 157.0; // Inicia en el segundo 157 (exactamente el inicio de la Noche)

const nightFogColor = new THREE.Color(0x05050a);
const dayFogColor = new THREE.Color(0x87CEEB);
const nightAmbientColor = new THREE.Color(0x11111a);
const dayAmbientColor = new THREE.Color(0xffffff);
const nightDirColor = new THREE.Color(0x445577);
const dayDirColor = new THREE.Color(0xffffee);

const raycaster = new THREE.Raycaster();
const centerVec = new THREE.Vector2(0, 0);

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
const inventoryMenu = document.getElementById('inventory-menu');
const dialogBox = document.getElementById('dialog-box');
const dialogText = document.getElementById('dialog-text');
const hud = document.getElementById('hud');
const keyCountDisplay = document.getElementById('key-count');

let gameStarted = false;
let isDead = false;
let isInventoryOpen = false;

controls.addEventListener('lock', () => {
    if (isDead) return;
    gameStarted = true;
    isInventoryOpen = false; // Siempre cerramos inventario al clickear para volver
    mainMenu.style.display = 'none';
    pauseMenu.style.display = 'none';
    inventoryMenu.style.display = 'none';
    // hud.style.display = 'block'; // Ocultamos el HUD por completo ya que las llaves están en el inventario
});
controls.addEventListener('unlock', () => {
    if (gameStarted && !isDead) {
        if (isInventoryOpen) {
            inventoryMenu.style.display = 'flex';
        } else {
            pauseMenu.style.display = 'flex';
        }
    }
});
pauseMenu.addEventListener('click', () => {
    controls.lock(); 
});
inventoryMenu.addEventListener('click', () => {
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
        if (isDialogOpen) {
            // Avanzar al siguiente diálogo
            if (dialogIndex < npcDialogs.length - 1) {
                dialogIndex++;
                dialogText.innerText = npcDialogs[dialogIndex];
            } else {
                // Cerrar diálogo
                isDialogOpen = false;
                dialogBox.style.display = 'none';
            }
            return;
        }

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
            } else if (targetInteractable.userData.type === 'NPC') {
                isDialogOpen = true;
                dialogText.innerText = npcDialogs[dialogIndex];
                dialogBox.style.display = 'block';
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
        case 'KeyQ':
            if (gameStarted && !isDead) {
                isInventoryOpen = !isInventoryOpen;
                if (isInventoryOpen) {
                    controls.unlock(); // Desbloquear mouse y pausar
                    inventoryMenu.style.display = 'flex';
                } else {
                    inventoryMenu.style.display = 'none';
                    controls.lock(); // Volver al juego
                }
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
let roofMap = [];
let elevationMap = [];
let mapLoaded = false;
let playerStartX = 0;
let playerStartZ = 0;


// --- NOISE FUNCTIONS FOR TERRAIN ---
function hash2D(x, z) {
    let n = ((Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1);
    return n < 0 ? n + 1 : n;
}

function getSmoothNoise(x, z, scale) {
    const sx = x / scale;
    const sz = z / scale;
    const c0 = Math.floor(sx);
    const c1 = c0 + 1;
    const r0 = Math.floor(sz);
    const r1 = r0 + 1;
    const tx = sx - c0;
    const tz = sz - r0;
    const smoothTx = tx * tx * (3 - 2 * tx);
    const smoothTz = tz * tz * (3 - 2 * tz);
    
    const n00 = hash2D(c0, r0);
    const n10 = hash2D(c1, r0);
    const n01 = hash2D(c0, r1);
    const n11 = hash2D(c1, r1);
    
    const n0 = n00 * (1 - smoothTx) + n10 * smoothTx;
    const n1 = n01 * (1 - smoothTx) + n11 * smoothTx;
    return n0 * (1 - smoothTz) + n1 * smoothTz;
}

function getTerrainVertexY(colF, rowF, mapWidth, mapHeight, floorMap, elevationMap) {
    const c0 = Math.floor(colF);
    const c1 = Math.min(c0 + 1, mapWidth - 1);
    const r0 = Math.floor(rowF);
    const r1 = Math.min(r0 + 1, mapHeight - 1);
    
    const type = floorMap[r0] ? floorMap[r0][c0] : 'GRASS';
    
    const tx = colF - c0;
    const tz = rowF - r0;
    
    const y00 = elevationMap[r0][c0];
    const y10 = elevationMap[r0][c1];
    const y01 = elevationMap[r1][c0];
    const y11 = elevationMap[r1][c1];
    
    const y0 = y00 * (1 - tx) + y10 * tx;
    const y1 = y01 * (1 - tx) + y11 * tx;
    let y = y0 * (1 - tz) + y1 * tz;
    
    if (type === 'WATER' || type === 'BOAT') {
        y -= 2.0; 
    } else if (['GRASS', 'TALL_GRASS', 'TREE', 'DIRT', 'SAND'].includes(type)) {
        // Large rolling hills (scale = 3.0 tiles)
        let macroNoise = getSmoothNoise(colF, rowF, 3.0) * 0.4;
        // Medium details (scale = 1.0 tiles)
        let microNoise = getSmoothNoise(colF, rowF, 1.0) * 0.15;
        
        let shoreGranularity = 0;
        if (y > -0.5 && y < 0.5) {
            // Soft sand ripples at the shore
            shoreGranularity = Math.sin(colF * 8.0) * Math.cos(rowF * 8.0) * 0.1;
        }
        
        y += macroNoise + microNoise + shoreGranularity;
    } else if (['BUILDING', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'INDOOR_FLOOR', 'WOOD', 'CHEST', 'POI'].includes(type)) {
        // Camera rides on top of wood floor, no -0.1 needed in physics.
        // But wait, the MESH needs -0.1 to avoid z-fighting!
        // I will handle the -0.1 offset OUTSIDE this function.
    }
    return y;
}

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
    BUSH: {r:0, g:128, b:0}, // Verde muy oscuro
    SNOW_PEAK: {r:255, g:255, b:255},
    BUILDING: {r:128, g:128, b:128},
    POI: {r:0, g:0, b:139}, // Azul Oscuro para Punto de Spawn
    BOAT: {r:23, g:63, b:63}, // Azul Turquesa Oscuro (Bote / Techo)
    TORCH: {r:153, g:217, b:232}, // Azul Cielo
    OTHER: {r:115, g:249, b:251} // Turquesa Claro
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
    BUSH: '#008000',
    SNOW_PEAK: '#808080',
    BUILDING: '#404040',
    POI: '#452209', // Color de madera para el spawn
    BOAT: '#173F3F',
    TORCH: '#99D9EA',
    OTHER: '#73F9FB'
};

function getClosestType(r, g, b, a) {
    if (a < 128) return 'GRASS'; 
    let minDist = Infinity;
    let closestType = 'GRASS';
    for (const [type, color] of Object.entries(PALETTE)) {
        if (type === 'BOAT' && Math.abs(b - color.b) > 30) continue; // Evitar que el verde oscuro mapee a botes
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
const torchFrames = [];
for (let i = 1; i <= 5; i++) {
    const tTex = texLoader.load(`./imagenes/Sprites/antorcha/torch${i}.png`);
    tTex.magFilter = THREE.NearestFilter;
    tTex.minFilter = THREE.NearestFilter;
    tTex.colorSpace = THREE.SRGBColorSpace;
    torchFrames.push(tTex);
}
const npcTex = texLoader.load('./imagenes/Sprites/Graham.png?v=' + Date.now());
const pino1Tex = texLoader.load('./imagenes/Sprites/arboles/pino1.png?v=' + Date.now());
const pino2Tex = texLoader.load('./imagenes/Sprites/arboles/pino2.png?v=' + Date.now());
const alamo1Tex = texLoader.load('./imagenes/Sprites/arboles/alamo1.png?v=' + Date.now());
const alamo2Tex = texLoader.load('./imagenes/Sprites/arboles/alamo2.png?v=' + Date.now());
const arau1Tex = texLoader.load('./imagenes/Sprites/arboles/araucaria1.png?v=' + Date.now());
const arau2Tex = texLoader.load('./imagenes/Sprites/arboles/araucaria2.png?v=' + Date.now());
const arbusto1Tex = texLoader.load('./imagenes/Sprites/vegetacion/arbusto1.png?v=' + Date.now());
const arbusto2Tex = texLoader.load('./imagenes/Sprites/vegetacion/arbusto2.png?v=' + Date.now());
const weed1Tex = texLoader.load('./imagenes/Sprites/vegetacion/weed1.png?v=' + Date.now());
const weed2Tex = texLoader.load('./imagenes/Sprites/vegetacion/weed2.png?v=' + Date.now());
const weed3Tex = texLoader.load('./imagenes/Sprites/vegetacion/weed3.png?v=' + Date.now());
const pastoTex = texLoader.load('./imagenes/Texturas/Pasto.png?v=' + Date.now());
const tierraTex = texLoader.load('./imagenes/Texturas/Tierra.png?v=' + Date.now());
const cieloTex = texLoader.load('./imagenes/Texturas/Cielo.jpeg?v=' + Date.now());
const arenaTex = texLoader.load('./imagenes/Texturas/arena.png?v=' + Date.now());
const agua1Tex = texLoader.load('./imagenes/Texturas/Agua1.png?v=' + Date.now());
const agua2Tex = texLoader.load('./imagenes/Texturas/Agua2.png?v=' + Date.now());
const agua3Tex = texLoader.load('./imagenes/Texturas/Agua3.png?v=' + Date.now());
const muroTex = texLoader.load('./imagenes/Texturas/muro.png?v=' + Date.now());
muroTex.wrapS = THREE.RepeatWrapping;
muroTex.wrapT = THREE.RepeatWrapping;
const techoTex = texLoader.load('./imagenes/Texturas/techo.jpg?v=' + Date.now());
techoTex.wrapS = THREE.RepeatWrapping;
techoTex.wrapT = THREE.RepeatWrapping;
const cieloFalsoTex = texLoader.load('./imagenes/Texturas/cielo_falso.jpg?v=' + Date.now());
cieloFalsoTex.wrapS = THREE.RepeatWrapping;
cieloFalsoTex.wrapT = THREE.RepeatWrapping;
const maderaTex = texLoader.load('./imagenes/Texturas/madera.jpg?v=' + Date.now());
const puertaTex = texLoader.load('./imagenes/Texturas/puerta.png?v=' + Date.now());
const piedraTex = texLoader.load('./imagenes/Texturas/piedra.png?v=' + Date.now());
const rocaTex = texLoader.load('./imagenes/Texturas/rocas.jpg?v=' + Date.now());
const nieveTex = texLoader.load('./imagenes/Texturas/nieve.png?v=' + Date.now());

[npcTex, pino1Tex, pino2Tex, alamo1Tex, alamo2Tex, arau1Tex, arau2Tex, arbusto1Tex, arbusto2Tex, weed1Tex, weed2Tex, weed3Tex, pastoTex, tierraTex, cieloTex, arenaTex, agua1Tex, agua2Tex, agua3Tex, muroTex, maderaTex, puertaTex, piedraTex, rocaTex, nieveTex, techoTex, cieloFalsoTex].forEach(t => {
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
const skyDayR = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_r_txt_0.png?v=' + Date.now());
const skyDayL = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_l_txt_0.png?v=' + Date.now());
const skyDayT = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_t_txt_0.png?v=' + Date.now());
const skyDayF = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_f_txt_0.png?v=' + Date.now());
const skyDayB = texLoader.load('./imagenes/Texturas/cielo_dia/OoT_h_bg_fine1_b_txt_0.png?v=' + Date.now());

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

// --- LUNA ---
const moonNormalTex = texLoader.load('./imagenes/Sprites/luna/Luna_B.png?v=' + Date.now());
const moonGlowTex = texLoader.load('./imagenes/Sprites/luna/Luna_glow.png?v=' + Date.now());
const moonAzulTex = texLoader.load('./imagenes/Sprites/luna/Luna_azul.png?v=' + Date.now());






[moonNormalTex, moonGlowTex, moonAzulTex].forEach(t => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
});



const moonMat = new THREE.SpriteMaterial({ map: moonNormalTex, transparent: true, fog: false, depthWrite: false });
const moonSprite = new THREE.Sprite(moonMat);
moonSprite.scale.set(60, 60, 1);
moonSprite.position.set(400, 250, 0);
moonSprite.renderOrder = -0.5;

const moonGlowMat = new THREE.SpriteMaterial({ map: moonGlowTex, transparent: true, opacity: 0.0, fog: false, depthWrite: false });
const moonGlowSprite = new THREE.Sprite(moonGlowMat);
moonGlowSprite.scale.set(60, 60, 1);
moonGlowSprite.position.set(400, 250, 0);
moonGlowSprite.renderOrder = -0.4; // Ligeramente encima de la luna normal

const moonAzulMat = new THREE.SpriteMaterial({ map: moonAzulTex, transparent: true, opacity: 0.0, fog: false, depthWrite: false });
const moonAzulSprite = new THREE.Sprite(moonAzulMat);
moonAzulSprite.scale.set(60, 60, 1);
moonAzulSprite.position.set(400, 250, 0);
moonAzulSprite.renderOrder = -0.3; // Encima del glow

const moonPivot = new THREE.Group();
moonPivot.add(moonSprite);
moonPivot.add(moonGlowSprite);
moonPivot.add(moonAzulSprite);
skyMesh.add(moonPivot);

// Variables para la lógica de mirar la luna
let moonLookTimer = 0;
let moonIsAlternating = false;
let moonCycle = 0.0;
let hasShootingStarFired = false;
let starSprite = null;
let starTimer = 0;

scene.add(skyMesh);

const mapImage = new Image();
const roofImage = new Image();
let loadedImages = 0;

const onImageLoad = () => {
    loadedImages++;
    if (loadedImages === 2) {
        try {
            buildWorld(mapImage, roofImage);
            mapLoaded = true;
            loadingScreen.style.display = 'none'; 
            mainMenu.style.display = 'flex';      
        } catch (e) {
            loadingScreen.innerHTML = `<span style="color:red;">ERROR: ${e.message} <br> ${e.stack}</span>`;
        }
    }
};

mapImage.onload = onImageLoad;
mapImage.onerror = () => { loadingScreen.innerHTML = `<span style="color:red;">ERROR: No se encontró 'mapa_final.png'</span>`; };
mapImage.src = './imagenes/Mapa/mapa_final.png';

roofImage.onload = onImageLoad;
roofImage.onerror = () => { loadingScreen.innerHTML = `<span style="color:red;">ERROR: No se encontró 'mapa_final_capa_2.png'</span>`; };
roofImage.src = './imagenes/Mapa/mapa_final_capa_2.png';

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
    playerDot.style.width = '0';
    playerDot.style.height = '0';
    playerDot.style.borderLeft = '6px solid transparent';
    playerDot.style.borderRight = '6px solid transparent';
    playerDot.style.borderBottom = '12px solid #ff0000';
    playerDot.style.transformOrigin = '50% 50%';
    playerDot.style.transform = 'translate(-50%, -50%)';
    minimapContainer.appendChild(playerDot);
}

function buildWorld(image, roofImage) {
    mapWidth = image.width;
    mapHeight = image.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const ctx = canvas.getContext('2d');
    
    // Base map
    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, mapWidth, mapHeight).data;
    
    // Roof map
    ctx.clearRect(0, 0, mapWidth, mapHeight);
    ctx.drawImage(roofImage, 0, 0);
    const roofImgData = ctx.getImageData(0, 0, mapWidth, mapHeight).data;
    
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = mapWidth;
    floorCanvas.height = mapHeight;
    const floorCtx = floorCanvas.getContext('2d');

    collisionMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill(false));
    floorMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill('GRASS'));
    roofMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill(false));
    
    const counts = { PINO1: 0, PINO2: 0, ALAMO1: 0, ALAMO2: 0, ARAU1: 0, ARAU2: 0, BUSH1: 0, BUSH2: 0, BUILDING: 0, MOUNTAIN: 0, PEAK: 0, SNOW_PEAK: 0, WEED1: 0, WEED2: 0, WEED3: 0, CEILING: 0, ROOF: 0, GRASS_FLOOR: 0, DIRT_FLOOR: 0, ARENA_FLOOR: 0, AGUA_FLOOR: 0, MADERA_FLOOR: 0, BASE_FLOOR: 0, TORCH: 0, OTHER: 0 };
    playerStartX = mapWidth / 2;
    playerStartZ = mapHeight / 2;

    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const idx = (z * mapWidth + x) * 4;
            const type = getClosestType(imgData[idx], imgData[idx+1], imgData[idx+2], imgData[idx+3]);
            
            let rType = getClosestType(roofImgData[idx], roofImgData[idx+1], roofImgData[idx+2], roofImgData[idx+3]);
            if (rType === 'BOAT') rType = 'ROOF';
            roofMap[z][x] = rType;
            if (rType === 'ROOF') counts.ROOF++;
            if (rType === 'TORCH') counts.TORCH = (counts.TORCH || 0) + 1;
            if (rType === 'OTHER') counts.OTHER = (counts.OTHER || 0) + 1;
            
            floorMap[z][x] = type;
            if (type !== 'WATER' && type !== 'BOAT') {
                floorCtx.fillStyle = FLOOR_COLORS[type] || '#000000';
                floorCtx.fillRect(x, z, 1, 1);
            }
            
            if (type === 'TREE') {
                const rand = ((x * 31 + z * 17) % 100);
                if (rand < 35) counts.PINO1++;
                else if (rand < 70) counts.PINO2++;
                else if (rand < 83) counts.ALAMO1++;
                else if (rand < 95) counts.ALAMO2++;
                else if (rand < 98) counts.ARAU1++;
                else counts.ARAU2++;
            } else if (type === 'BUSH') {
                const isArbusto1 = ((x * 19 + z * 7) % 2) === 0;
                if (isArbusto1) counts.BUSH1++; else counts.BUSH2++;
            } else if (type === 'TALL_GRASS') {
                const weedVariant = ((x * 13 + z * 7) % 3);
                if (weedVariant === 0) counts.WEED1++;
                else if (weedVariant === 1) counts.WEED2++;
                else counts.WEED3++;
            }
            if (counts[type] !== undefined) counts[type]++;
            
            if (type === 'INDOOR_FLOOR' || type === 'CHEST') {
                counts.MADERA_FLOOR++;
            } else if (type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED' || type === 'WOOD') {
                counts.MADERA_FLOOR++;
            } else if (type === 'POI') {
                counts.MADERA_FLOOR++; // Suelo de madera para el spawn
            }
            if (type === 'TORCH' || type === 'OTHER') {
                counts.MADERA_FLOOR++; // Margen seguro por si son antorchas de interior en capa 1
            }
            
            if (type === 'GRASS' || type === 'TALL_GRASS' || type === 'TREE') counts.GRASS_FLOOR++;
            else if (type === 'DIRT') counts.DIRT_FLOOR++;
            else if (type === 'SAND') counts.ARENA_FLOOR++;
            else if (type === 'WATER' || type === 'BOAT') counts.AGUA_FLOOR++;

            if (type !== 'WATER' && type !== 'BOAT' && type !== 'POI') counts.BASE_FLOOR++;

            // Solid obstacles
            if (['BUILDING', 'CHEST', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'MOUNTAIN', 'PEAK', 'SNOW_PEAK'].includes(type)) {
                collisionMap[z][x] = type;
            } else if (type === 'TREE' || type === 'BUSH') {
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
    const grassPlaneGeo = new THREE.PlaneGeometry(UNIT_SIZE, WALL_HEIGHT*0.8);
    const cubeGeo = new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, UNIT_SIZE);

    // Materiales Instanced (Usamos Phong para recibir la luz de la antorcha por píxel)
    const pino1Mat = new THREE.MeshPhongMaterial({ map: pino1Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const pino2Mat = new THREE.MeshPhongMaterial({ map: pino2Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const alamo1Mat = new THREE.MeshPhongMaterial({ map: alamo1Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const alamo2Mat = new THREE.MeshPhongMaterial({ map: alamo2Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arau1Mat = new THREE.MeshPhongMaterial({ map: arau1Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arau2Mat = new THREE.MeshPhongMaterial({ map: arau2Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arbusto1Mat = new THREE.MeshPhongMaterial({ map: arbusto1Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arbusto2Mat = new THREE.MeshPhongMaterial({ map: arbusto2Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed1Mat = new THREE.MeshPhongMaterial({ map: weed1Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed2Mat = new THREE.MeshPhongMaterial({ map: weed2Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed3Mat = new THREE.MeshPhongMaterial({ map: weed3Tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    
    // Los colores son afectados por las luces para dar la sensación Dark Fantasy
    const bldgMat = new THREE.MeshPhongMaterial({ map: muroTex, shininess: 0 });
    const mtnMat = new THREE.MeshPhongMaterial({ color: 0x400040, shininess: 0 }); 
    const peakMat = new THREE.MeshPhongMaterial({ color: 0x73737D, shininess: 0 }); 
    const snowPeakMat = new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 0 }); 
    const ceilingMat = new THREE.MeshPhongMaterial({ map: cieloFalsoTex, shininess: 0 }); 
    const roofMat = new THREE.MeshPhongMaterial({ map: techoTex, shininess: 0 });
    roofMat.onBeforeCompile = function ( shader ) {
        shader.vertexShader = `
            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;
        ` + shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            #ifdef USE_INSTANCING
                vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
                vWorldNormal = normalize((modelMatrix * instanceMatrix * vec4(normal, 0.0)).xyz);
            #else
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
            #endif
            `
        );
        shader.fragmentShader = `
            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;
        ` + shader.fragmentShader.replace(
            '#include <map_fragment>',
            `
            #ifdef USE_MAP
                vec3 blend = abs(vWorldNormal);
                blend /= (blend.x + blend.y + blend.z);
                vec4 cx = texture2D(map, vWorldPos.yz * 0.5);
                vec4 cy = texture2D(map, vWorldPos.xz * 0.5);
                vec4 cz = texture2D(map, vWorldPos.xy * 0.5);
                vec4 sampledDiffuseColor = cx * blend.x + cy * blend.y + cz * blend.z;
                diffuseColor *= sampledDiffuseColor;
            #endif
            `
        );
    };


    const grassFloorMat = new THREE.MeshPhongMaterial({ map: pastoTex, shininess: 0 });
    const dirtFloorMat = new THREE.MeshPhongMaterial({ map: tierraTex, shininess: 0 });
    const arenaFloorMat = new THREE.MeshPhongMaterial({ map: arenaTex, shininess: 0 });
    const aguaFloorMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, shininess: 60 }); 
    const maderaFloorMat = new THREE.MeshPhongMaterial({ map: maderaTex, shininess: 0 }); 

    const planeGeo = new THREE.PlaneGeometry(UNIT_SIZE * 1.9, WALL_HEIGHT * 3 * 1.9);
    const pino1Mesh = new THREE.InstancedMesh(planeGeo, pino1Mat, counts.PINO1 * 2);
    const pino2Mesh = new THREE.InstancedMesh(planeGeo, pino2Mat, counts.PINO2 * 2);
    const alamo1Mesh = new THREE.InstancedMesh(planeGeo, alamo1Mat, counts.ALAMO1 * 2);
    const alamo2Mesh = new THREE.InstancedMesh(planeGeo, alamo2Mat, counts.ALAMO2 * 2);
    const arau1Mesh = new THREE.InstancedMesh(planeGeo, arau1Mat, counts.ARAU1 * 2);
    const arau2Mesh = new THREE.InstancedMesh(planeGeo, arau2Mat, counts.ARAU2 * 2);
    const bushGeo = new THREE.PlaneGeometry(WALL_HEIGHT * 1.5, WALL_HEIGHT * 1.5);
    const arbusto1Mesh = new THREE.InstancedMesh(bushGeo, arbusto1Mat, counts.BUSH1 * 2);
    const arbusto2Mesh = new THREE.InstancedMesh(bushGeo, arbusto2Mat, counts.BUSH2 * 2);
    const weed1Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed1Mat, counts.WEED1 * 2);
    const weed2Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed2Mat, counts.WEED2 * 2);
    const weed3Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed3Mat, counts.WEED3 * 2);
    
    const bldgMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, UNIT_SIZE), bldgMat, counts.BUILDING);
    const ceilingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE / 4, WALL_HEIGHT * 0.125, UNIT_SIZE / 4), roofMat, counts.ROOF * 16);
    const falseCeilingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, 0.1, UNIT_SIZE), ceilingMat, counts.ROOF);

    const floorTileGeo = new THREE.BoxGeometry(UNIT_SIZE, 1.0, UNIT_SIZE);
    const maderaFloorMesh = new THREE.InstancedMesh(floorTileGeo, maderaFloorMat, counts.MADERA_FLOOR + 500);

    [agua1Tex, agua2Tex, agua3Tex].forEach(t => {
        t.repeat.set(mapWidth, mapHeight);
    });
    const globalWaterGeo = new THREE.PlaneGeometry(mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE);
    const globalWaterMesh = new THREE.Mesh(globalWaterGeo, aguaFloorMat);
    globalWaterMesh.rotation.x = -Math.PI / 2;
    globalWaterMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, -0.05, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
    scene.add(globalWaterMesh);


    elevationMap = Array.from({length: mapHeight}, () => new Float32Array(mapWidth).fill(9999));
    const distQueue = [];
    
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            if (floorMap[z][x] === 'WATER' || floorMap[z][x] === 'BOAT' || x === 0 || x === mapWidth-1 || z === 0 || z === mapHeight-1) {
                distQueue.push({r: z, c: x, dist: 0});
                elevationMap[z][x] = 0;
            }
        }
    }

    let qHead = 0;
    while(qHead < distQueue.length) {
        const {r, c, dist} = distQueue[qHead++];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of dirs) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<mapHeight && nc>=0 && nc<mapWidth) {
                if (elevationMap[nr][nc] > dist + 1) {
                    elevationMap[nr][nc] = dist + 1;
                    distQueue.push({r: nr, c: nc, dist: dist + 1});
                }
            }
        }
    }

    // Aplanar y esculpir
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const type = floorMap[z][x];
            let dist = elevationMap[z][x];
            
            // Reglas de elevación según el tipo
            if (type === 'WATER' || type === 'BOAT') elevationMap[z][x] = -0.5;
            else if (type === 'SAND') elevationMap[z][x] = 0.2;
            else if (['GRASS', 'TALL_GRASS', 'TREE', 'BUSH', 'DIRT', 'TORCH', 'OTHER'].includes(type)) {
                elevationMap[z][x] = Math.min(dist * 0.2, 1.0);
            } else if (['BUILDING', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'INDOOR_FLOOR', 'WOOD', 'CHEST', 'POI'].includes(type)) {
                // Flatten buildings to ground level
                elevationMap[z][x] = 1.0;
            } else if (type === 'MOUNTAIN') {
                elevationMap[z][x] = dist * 1.5;
            } else if (type === 'PEAK') {
                elevationMap[z][x] = dist * 2.0;
            } else if (type === 'SNOW_PEAK') {
                elevationMap[z][x] = dist * 3.0;
            }
        }
    }
    
    // Smooth indoor boundaries
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            if (['MOUNTAIN', 'PEAK', 'SNOW_PEAK', 'TORCH', 'OTHER'].includes(floorMap[z][x])) {
                let isAdjacentToIndoor = false;
                for (let r = Math.max(0, z-1); r <= Math.min(mapHeight-1, z+1); r++) {
                    for (let c = Math.max(0, x-1); c <= Math.min(mapWidth-1, x+1); c++) {
                        if (['INDOOR_FLOOR', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'WOOD'].includes(floorMap[r][c])) {
                            isAdjacentToIndoor = true;
                        }
                    }
                }
                if (isAdjacentToIndoor) {
                    elevationMap[z][x] = 1.0; // push down to indoor level
                }
            }
        }
    }

    let idxPino1=0, idxPino2=0, idxAlamo1=0, idxAlamo2=0, idxArau1=0, idxArau2=0, idxBUSH1=0, idxBUSH2=0, idxWeed1=0, idxWeed2=0, idxWeed3=0, idxBldg=0, idxMtn=0, idxPeak=0, idxSnowPeak=0, idxCeil=0, idxFalseCeil=0, idxRoof=0, idxMadera=0;
    const dummy = new THREE.Object3D(); 
    
    const roofQueue = [];
    const roofDistMap4x = Array.from({length: mapHeight * 4}, () => new Int32Array(mapWidth * 4).fill(9999));
    
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            if (roofMap[z][x] === 'ROOF') {
                const isEdge = x===0 || x===mapWidth-1 || z===0 || z===mapHeight-1 || roofMap[z-1][x] !== 'ROOF' || roofMap[z+1][x] !== 'ROOF' || roofMap[z][x-1] !== 'ROOF' || roofMap[z][x+1] !== 'ROOF';
                if (isEdge) {
                    for(let sz=0; sz<4; sz++) {
                        for(let sx=0; sx<4; sx++) {
                            const isSubEdge = x===0 && sx===0 || x===mapWidth-1 && sx===3 || z===0 && sz===0 || z===mapHeight-1 && sz===3 || (roofMap[z-1]?.[x]!='ROOF' && sz===0) || (roofMap[z+1]?.[x]!='ROOF' && sz===3) || (roofMap[z][x-1]!='ROOF' && sx===0) || (roofMap[z][x+1]!='ROOF' && sx===3);
                            if (isSubEdge) {
                                roofQueue.push({'r': z*4+sz, 'c': x*4+sx, 'dist': 0});
                                roofDistMap4x[z*4+sz][x*4+sx] = 0;
                            }
                        }
                    }
                }
            }
        }
    }
    
    
    let head = 0;
    while(head < roofQueue.length) {
        const {r, c, dist} = roofQueue[head++];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of dirs) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<mapHeight*4 && nc>=0 && nc<mapWidth*4) {
                if (roofDistMap4x[nr][nc] > dist + 1) {
                    const originalR = Math.floor(nr/4);
                    const originalC = Math.floor(nc/4);
                    if (roofMap[originalR]?.[originalC] === 'ROOF') {
                        roofDistMap4x[nr][nc] = dist + 1;
                        roofQueue.push({r: nr, c: nc, dist: dist + 1});
                    }
                }
            }
        }
    }

    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const type = floorMap[z][x];
            const rType = roofMap[z][x];
            
            const posX = x * UNIT_SIZE;
            const posZ = z * UNIT_SIZE;
            const baseH = elevationMap[z][x];
            dummy.rotation.set(0, 0, 0); 
            
            if (rType === 'ROOF') {
                dummy.position.set(posX, baseH + WALL_HEIGHT, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                falseCeilingMesh.setMatrixAt(idxFalseCeil++, dummy.matrix);

                const stepHeight = WALL_HEIGHT * 0.125;
                const subSize = UNIT_SIZE / 4;
                const startOffset = -(UNIT_SIZE / 2) + (subSize / 2);
                
                for (let sz = 0; sz < 4; sz++) {
                    for (let sx = 0; sx < 4; sx++) {
                        const r4 = z * 4 + sz;
                        const c4 = x * 4 + sx;
                        const rDist = roofDistMap4x[r4][c4];
                        
                        const effectiveDist = Math.min(Math.max(rDist - 1, 0), 11);
                        
                        const subPosX = posX + startOffset + (sx * subSize);
                        const subPosZ = posZ + startOffset + (sz * subSize);
                        
                        const techoBottom = baseH + WALL_HEIGHT + (effectiveDist * stepHeight);
                        const techoCenter = techoBottom + (stepHeight / 2);
                        
                        dummy.position.set(subPosX, techoCenter, subPosZ);
                        dummy.rotation.set(0, 0, 0);
                        dummy.updateMatrix();
                        ceilingMesh.setMatrixAt(idxCeil++, dummy.matrix);
                    }
                }
            }
            
            if ((rType === 'TORCH' || rType === 'OTHER' || type === 'TORCH' || type === 'OTHER') && 
                !['BUILDING', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'MOUNTAIN', 'PEAK', 'SNOW_PEAK', 'CHEST'].includes(type)) {
                let isTorch = false;
                for(let r = Math.max(0, z-1); r <= Math.min(mapHeight-1, z+1); r++) {
                    for(let c = Math.max(0, x-1); c <= Math.min(mapWidth-1, x+1); c++) {
                        if (['BUILDING', 'MOUNTAIN', 'PEAK', 'SNOW_PEAK'].includes(floorMap[r][c])) {
                            isTorch = true; break;
                        }
                    }
                }
                
                if (isTorch) {
                    const wLight = new THREE.PointLight(0xff8800, 12.0, 40, 1.0);
                    
                    let wallX = posX, wallZ = posZ;
                    if (x > 0 && ['BUILDING','MOUNTAIN','PEAK','SNOW_PEAK'].includes(floorMap[z][x-1])) wallX -= 0.9;
                    else if (x < mapWidth-1 && ['BUILDING','MOUNTAIN','PEAK','SNOW_PEAK'].includes(floorMap[z][x+1])) wallX += 0.9;
                    else if (z > 0 && ['BUILDING','MOUNTAIN','PEAK','SNOW_PEAK'].includes(floorMap[z-1][x])) wallZ -= 0.9;
                    else if (z < mapHeight-1 && ['BUILDING','MOUNTAIN','PEAK','SNOW_PEAK'].includes(floorMap[z+1][x])) wallZ += 0.9;

                    const torchBaseH = Math.max(baseH, elevationMap[z][x]);
                    wLight.position.set(wallX, torchBaseH + 1.6, wallZ);
                    scene.add(wLight);
                    flickerLights.push({ light: wLight, baseIntensity: 12.0 });

                    const spriteMat = new THREE.SpriteMaterial({ map: torchFrames[0], transparent: true, fog: false, depthWrite: false });
                    const torchSprite = new THREE.Sprite(spriteMat);
                    torchSprite.position.set(wallX, torchBaseH + 1.6, wallZ);
                    torchSprite.scale.set(1.0, 1.0, 1.0);
                    scene.add(torchSprite);
                    torchSprites.push(torchSprite);
                } else {
                    const l = new THREE.PointLight(0x4488ff, 4.0, 25, 2);
                    l.position.set(posX, baseH + 0.5, posZ);
                    scene.add(l);
                }
            }

            if (type === 'BUILDING') {
                dummy.position.set(posX, baseH + WALL_HEIGHT / 2, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                bldgMesh.setMatrixAt(idxBldg++, dummy.matrix);
            }

            if (type === 'TREE') {
                const rand = ((x * 31 + z * 17) % 100);
                dummy.position.set(posX, baseH + ((WALL_HEIGHT*3*1.9)/2) - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                if (rand < 35) pino1Mesh.setMatrixAt(idxPino1++, dummy.matrix);
                else if (rand < 70) pino2Mesh.setMatrixAt(idxPino2++, dummy.matrix);
                else if (rand < 83) alamo1Mesh.setMatrixAt(idxAlamo1++, dummy.matrix);
                else if (rand < 95) alamo2Mesh.setMatrixAt(idxAlamo2++, dummy.matrix);
                else if (rand < 98) arau1Mesh.setMatrixAt(idxArau1++, dummy.matrix);
                else arau2Mesh.setMatrixAt(idxArau2++, dummy.matrix);
                
                dummy.rotation.set(0, Math.PI/2, 0);
                dummy.updateMatrix();
                if (rand < 35) pino1Mesh.setMatrixAt(idxPino1++, dummy.matrix);
                else if (rand < 70) pino2Mesh.setMatrixAt(idxPino2++, dummy.matrix);
                else if (rand < 83) alamo1Mesh.setMatrixAt(idxAlamo1++, dummy.matrix);
                else if (rand < 95) alamo2Mesh.setMatrixAt(idxAlamo2++, dummy.matrix);
                else if (rand < 98) arau1Mesh.setMatrixAt(idxArau1++, dummy.matrix);
                else arau2Mesh.setMatrixAt(idxArau2++, dummy.matrix);
            } else if (type === 'BUSH') {
                const isArbusto1 = ((x * 19 + z * 7) % 2) === 0;
                dummy.position.set(posX, baseH + ((WALL_HEIGHT*1.5)/2) - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                if(isArbusto1) arbusto1Mesh.setMatrixAt(idxBUSH1++, dummy.matrix); else arbusto2Mesh.setMatrixAt(idxBUSH2++, dummy.matrix);
                
                dummy.rotation.set(0, Math.PI/2, 0);
                dummy.updateMatrix();
                if(isArbusto1) arbusto1Mesh.setMatrixAt(idxBUSH1++, dummy.matrix); else arbusto2Mesh.setMatrixAt(idxBUSH2++, dummy.matrix);
            } else if (type === 'TALL_GRASS') {
                const weedVariant = ((x * 13 + z * 7) % 3);
                dummy.position.set(posX, baseH + ((WALL_HEIGHT*0.8)/2) - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                if (weedVariant === 0) weed1Mesh.setMatrixAt(idxWeed1++, dummy.matrix);
                else if (weedVariant === 1) weed2Mesh.setMatrixAt(idxWeed2++, dummy.matrix);
                else weed3Mesh.setMatrixAt(idxWeed3++, dummy.matrix);
                
                dummy.rotation.set(0, Math.PI/2, 0);
                dummy.updateMatrix();
                if (weedVariant === 0) weed1Mesh.setMatrixAt(idxWeed1++, dummy.matrix);
                else if (weedVariant === 1) weed2Mesh.setMatrixAt(idxWeed2++, dummy.matrix);
                else weed3Mesh.setMatrixAt(idxWeed3++, dummy.matrix);
            } else if (type === 'CHEST') {
                const chestGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
                const chestMat = new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8B4513, shininess: 0 }); 
                const chestMesh = new THREE.Mesh(chestGeo, chestMat);
                chestMesh.position.set(posX, baseH + 0.4, posZ); 
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
                
                // Techo eliminado de aquí
            }

            // Pisos especiales (Madera)
            // Si la antorcha fue pintada en la capa 1 y está en interior, restauramos el piso de madera
            let needsWoodFloor = (type === 'INDOOR_FLOOR' || type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED' || type === 'WOOD' || type === 'CHEST');
            if (!needsWoodFloor && (type === 'TORCH' || type === 'OTHER')) {
                // Chequear si debe ser antorcha (está cerca de rojo oscuro)
                let isTorchLocal = false;
                for(let r = Math.max(0, z-1); r <= Math.min(mapHeight-1, z+1); r++) {
                    for(let c = Math.max(0, x-1); c <= Math.min(mapWidth-1, x+1); c++) {
                        if (['INDOOR_FLOOR', 'WOOD', 'CHEST', 'DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(floorMap[r][c])) isTorchLocal = true;
                    }
                }
                if (isTorchLocal) needsWoodFloor = true;
            }

            if (needsWoodFloor) {
                dummy.position.set(posX, baseH - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                maderaFloorMesh.setMatrixAt(idxMadera++, dummy.matrix);
            } else if (type === 'POI') {
                // Techo para spawn eliminado de aquí
                
                // Suelo de madera
                dummy.position.set(posX, baseH - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                maderaFloorMesh.setMatrixAt(idxMadera++, dummy.matrix);
            }
        }
    }
    
    scene.add(pino1Mesh);
    scene.add(pino2Mesh);
    scene.add(alamo1Mesh);
    scene.add(alamo2Mesh);
    scene.add(arau1Mesh);
    scene.add(arau2Mesh);
    scene.add(arbusto1Mesh);
    scene.add(arbusto2Mesh);
    scene.add(weed1Mesh);
    scene.add(weed2Mesh);
    scene.add(weed3Mesh);
    scene.add(bldgMesh);
    scene.add(ceilingMesh);
    scene.add(falseCeilingMesh);
    scene.add(maderaFloorMesh);
    
    // --- GENERACIÓN DE TERRENO (MONTAÑAS CONTINUAS CON TEXTURAS) ---
    const SUBDIVISIONS = 4;
    const segmentsW = (mapWidth - 1) * SUBDIVISIONS;
    const segmentsH = (mapHeight - 1) * SUBDIVISIONS;
    const vertsW = segmentsW + 1;
    const vertsH = segmentsH + 1;
    
    const terrainGeo = new THREE.PlaneGeometry((mapWidth - 1) * UNIT_SIZE, (mapHeight - 1) * UNIT_SIZE, segmentsW, segmentsH);
    terrainGeo.rotateX(-Math.PI / 2); // Acostarlo en XZ
    terrainGeo.translate(((mapWidth - 1) * UNIT_SIZE) / 2, 0, ((mapHeight - 1) * UNIT_SIZE) / 2); // Alinear vértices con la grilla

    const positions = terrainGeo.attributes.position.array;
    const uvs = terrainGeo.attributes.uv.array;
    const splatWeights = new Float32Array(positions.length / 3 * 4);

    for (let i = 0; i < positions.length / 3; i++) {
        const vx = i % vertsW;
        const vz = Math.floor(i / vertsW);
        const colF = vx / SUBDIVISIONS;
        const rowF = vz / SUBDIVISIONS;
        
        const c0 = Math.floor(colF);
        const c1 = Math.min(c0 + 1, mapWidth - 1);
        const r0 = Math.floor(rowF);
        const r1 = Math.min(r0 + 1, mapHeight - 1);
        
        const type = floorMap[r0] ? floorMap[r0][c0] : 'GRASS';
        
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

        let y = getTerrainVertexY(colF, rowF, mapWidth, mapHeight, floorMap, elevationMap);
        if (['BUILDING', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'INDOOR_FLOOR', 'WOOD', 'CHEST', 'POI'].includes(type)) {
            y -= 0.1; // Visual offset to prevent Z-fighting with wood floors
        }
        positions[i * 3 + 1] = y;
    }
    
    terrainGeo.setAttribute('splatWeights', new THREE.BufferAttribute(splatWeights, 4));

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

    for (let row = 0; row < segmentsH; row++) {
        for (let col = 0; col < segmentsW; col++) {
            const mapCol = Math.min(Math.floor(col / SUBDIVISIONS), mapWidth - 1);
            const mapRow = Math.min(Math.floor(row / SUBDIVISIONS), mapHeight - 1);
            
            const mapCol1 = Math.min(Math.ceil(col / SUBDIVISIONS), mapWidth - 1);
            const mapRow1 = Math.min(Math.ceil(row / SUBDIVISIONS), mapHeight - 1);

            const v1 = floorMap[mapRow][mapCol];
            const v2 = floorMap[mapRow][mapCol1];
            const v3 = floorMap[mapRow1][mapCol];
            const v4 = floorMap[mapRow1][mapCol1];
            
            const isMtn = (v1==='MOUNTAIN' || v2==='MOUNTAIN' || v3==='MOUNTAIN' || v4==='MOUNTAIN');
            const isPeak = (v1==='PEAK' || v2==='PEAK' || v3==='PEAK' || v4==='PEAK');
            const isSnow = (v1==='SNOW_PEAK' || v2==='SNOW_PEAK' || v3==='SNOW_PEAK' || v4==='SNOW_PEAK');

            // 6 índices por cuadrado (2 triángulos)
            const quadIdx = (row * segmentsW + col) * 6;
            
            if (isSnow) {
                snowIndices.push(baseIndices[quadIdx], baseIndices[quadIdx+1], baseIndices[quadIdx+2], baseIndices[quadIdx+3], baseIndices[quadIdx+4], baseIndices[quadIdx+5]);
            } else if (isPeak) {
                peakIndices.push(baseIndices[quadIdx], baseIndices[quadIdx+1], baseIndices[quadIdx+2], baseIndices[quadIdx+3], baseIndices[quadIdx+4], baseIndices[quadIdx+5]);
            } else if (isMtn) {
                mtnIndices.push(baseIndices[quadIdx], baseIndices[quadIdx+1], baseIndices[quadIdx+2], baseIndices[quadIdx+3], baseIndices[quadIdx+4], baseIndices[quadIdx+5]);
            } else {
                flatIndices.push(baseIndices[quadIdx], baseIndices[quadIdx+1], baseIndices[quadIdx+2], baseIndices[quadIdx+3], baseIndices[quadIdx+4], baseIndices[quadIdx+5]);
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
    
    // Encontrar la antorcha más cercana al jugador para colocar a Graham
    let bestTorch = null;
    let minDist = Infinity;
    worldTorches.forEach(t => {
        let d = Math.sqrt(Math.pow(t.x - playerStartX, 2) + Math.pow(t.z - playerStartZ, 2));
        if (d > 0 && d < minDist) { minDist = d; bestTorch = t; }
    });

    if (!bestTorch && worldTorches.length > 0) bestTorch = worldTorches[0];
    
    let grahamX = (playerStartX + 2) * UNIT_SIZE;
    let grahamZ = playerStartZ * UNIT_SIZE;
    let grahamY = elevationMap[playerStartZ][playerStartX] + (1.9 / 2);

    if (bestTorch) {
        grahamX = bestTorch.px + 0.5;
        grahamZ = bestTorch.pz;
        grahamY = bestTorch.py - 0.5 + (1.9 / 2); // restamos 0.5 porque el torch.py esta elevado en la pared
    }

    // Generar al NPC Graham como un Billboard 3D iluminable (MeshPhongMaterial)
    const grahamGeo = new THREE.PlaneGeometry(0.8, 1.9);
    const grahamMat = new THREE.MeshPhongMaterial({ 
        map: npcTex, 
        transparent: true, 
        alphaTest: 0.5, 
        side: THREE.DoubleSide,
        shininess: 0,
        color: 0xffddaa // Filtro de color ligeramente cálido
    });
    // Uso de la variable global grahamSprite
    grahamSprite = new THREE.Mesh(grahamGeo, grahamMat);
    grahamSprite.position.set(grahamX, grahamY, grahamZ);
    grahamSprite.userData = { type: 'NPC' };
    scene.add(grahamSprite);
    interactables.push(grahamSprite);
    createMinimapUI(floorCanvas);
}

function getTerrainHeight(x, z) {
    if (floorMap.length === 0) return 0;
    
    const gx = x / UNIT_SIZE;
    const gz = z / UNIT_SIZE;
    
    // Fast-path: If standing directly on a wooden floor tile, the floor is a rigid flat box at exactly 1.5.
    const safeCol = Math.min(Math.max(Math.floor(gx), 0), mapWidth - 1);
    const safeRow = Math.min(Math.max(Math.floor(gz), 0), mapHeight - 1);
    const tileType = floorMap[safeRow] ? floorMap[safeRow][safeCol] : 'GRASS';
    if (['BUILDING', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'INDOOR_FLOOR', 'WOOD', 'CHEST', 'POI'].includes(tileType)) {
        return 1.0;
    }
    
    function getMeshVertexY(colF, rowF) {
        return getTerrainVertexY(colF, rowF, mapWidth, mapHeight, floorMap, elevationMap);
    }

    const SUBDIVISIONS = 4;
    const subX = Math.floor(gx * SUBDIVISIONS) / SUBDIVISIONS;
    const subZ = Math.floor(gz * SUBDIVISIONS) / SUBDIVISIONS;
    const nextSubX = subX + (1 / SUBDIVISIONS);
    const nextSubZ = subZ + (1 / SUBDIVISIONS);
    
    const fracX = (gx - subX) * SUBDIVISIONS;
    const fracZ = (gz - subZ) * SUBDIVISIONS;
    
    const h00 = getMeshVertexY(subX, subZ);
    const h10 = getMeshVertexY(nextSubX, subZ);
    const h01 = getMeshVertexY(subX, nextSubZ);
    const h11 = getMeshVertexY(nextSubX, nextSubZ);
    
    const h0 = h00 * (1 - fracX) + h10 * fracX;
    const h1 = h01 * (1 - fracX) + h11 * fracX;
    return h0 * (1 - fracZ) + h1 * fracZ;
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
                if (collisionMap[cz][cx] === 'TREE' || collisionMap[cz][cx] === 'BUSH') {
                    const centerX = cx * UNIT_SIZE;
                    const centerZ = cz * UNIT_SIZE;
                    const dist = Math.sqrt((x - centerX)**2 + (z - centerZ)**2);
                    if (dist < 0.4 + COLLISION_RADIUS) return true;
                }
            }
        }
    }

    const offsetsX = [-COLLISION_RADIUS, COLLISION_RADIUS, -COLLISION_RADIUS, COLLISION_RADIUS];
    const offsetsZ = [-COLLISION_RADIUS, -COLLISION_RADIUS, COLLISION_RADIUS, COLLISION_RADIUS];
    
    for (let i = 0; i < 4; i++) {
        const pX = x + offsetsX[i];
        const pZ = z + offsetsZ[i];
        const gX = Math.floor((pX + UNIT_SIZE/2) / UNIT_SIZE);
        const gZ = Math.floor((pZ + UNIT_SIZE/2) / UNIT_SIZE);
        if (gZ < 0 || gZ >= mapHeight || gX < 0 || gX >= mapWidth) return true;
        
        const cell = collisionMap[gZ][gX];
        if (cell && cell !== 'TREE' && cell !== 'BUSH') return true; 
        
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

    if (grahamSprite) {
        grahamSprite.rotation.y = Math.atan2(controlObj.position.x - grahamSprite.position.x, controlObj.position.z - grahamSprite.position.z);
    }
    skyMesh.position.set(controlObj.position.x, 200, controlObj.position.z);

    if (controls.isLocked && mapLoaded) {
        const delta = Math.min(clock.getDelta(), 0.1);

        // Lógica de mirada a la luna (Easter Egg)
        if (typeof moonSprite !== 'undefined') {
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            
            const moonPos = new THREE.Vector3();
            moonSprite.getWorldPosition(moonPos);
            
            const dirToMoon = moonPos.sub(controlObj.position).normalize();
            const lookDot = camDir.dot(dirToMoon);
            
            if (lookDot > 0.95) { // Mirando directamente (tolerancia del 5%)
                moonLookTimer += delta;
                if (moonLookTimer >= 4.0) {
                    moonIsAlternating = true;
                }
                
                // Disparar estrella fugaz a los 9 segundos
                if (moonLookTimer >= 9.0 && !hasShootingStarFired) {
                    hasShootingStarFired = true;
                    starTimer = 0;
                    if (!starSprite) {
                        const starCanvas = document.createElement('canvas');
                        starCanvas.width = 512;
                        starCanvas.height = 128;
                        const starCtx = starCanvas.getContext('2d');

                        const gradient = starCtx.createLinearGradient(0, 64, 512, 64);
                        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
                        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)'); 
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); 

                        starCtx.fillStyle = gradient;
                        starCtx.shadowColor = 'rgba(255, 255, 255, 1)';
                        starCtx.shadowBlur = 40; 

                        starCtx.beginPath();
                        starCtx.moveTo(0, 64);
                        starCtx.quadraticCurveTo(256, 40, 512, 64);
                        starCtx.quadraticCurveTo(256, 88, 0, 64);
                        starCtx.fill();
                        starCtx.fill(); 

                        const starTex = new THREE.CanvasTexture(starCanvas);

                        const starMat = new THREE.SpriteMaterial({ 
                            map: starTex, 
                            transparent: true, 
                            opacity: 1, 
                            depthWrite: false,
                            blending: THREE.AdditiveBlending 
                        });
                        
                        // Rotación: La cola apunta hacia atrás de la dirección de movimiento
                        // Movimiento: -Y (abajo), +Z (derecha)
                        const angleRad = 28 * Math.PI / 180;
                        // Math.atan2(Y_cola, Z_cola) => Math.atan2(cos(28), -sin(28))
                        starMat.rotation = Math.atan2(Math.cos(angleRad), -Math.sin(angleRad)); 
                        
                        starSprite = new THREE.Sprite(starMat);
                        starSprite.scale.set(120, 80, 1); 
                        starSprite.renderOrder = -0.4;
                        skyMesh.add(starSprite);
                    }
                    
                    // Calcular posición inicial para que pase exactamente a la derecha de la luna (Z=80) 
                    // en el punto medio de su animación (t=0.15s)
                    const angleRad = 28 * Math.PI / 180;
                    const speed = 4000;
                    const halfTime = 0.15;
                    
                    const startY = 250 + (halfTime * speed * Math.cos(angleRad));
                    const startZ = 80 - (halfTime * speed * Math.sin(angleRad));
                    
                    starSprite.position.set(400, startY, startZ);
                    starSprite.material.opacity = 1.0;
                    starSprite.visible = true;
                }
            } else {
                moonLookTimer = 0; 
                moonIsAlternating = false; 
                hasShootingStarFired = false; 
            }
            
            if (moonIsAlternating) {
                // Cada fase dura 1.5s. Son 4 fases, as que el ciclo entero dura 6 segundos.
                moonCycle = (moonCycle + delta * (1.0 / 0.8)) % 4.0;
            } else {
                // Volver a reposo rpidamente
                if (moonCycle > 0.0) {
                    moonCycle -= delta * 2.0;
                    if (moonCycle < 0.0) moonCycle = 0.0;
                }
            }
            
            let glowOp = 0;
            let azulOp = 0;
            if (moonCycle < 1.0) {
                glowOp = moonCycle;
            } else if (moonCycle < 2.0) {
                glowOp = 1.0;
                azulOp = moonCycle - 1.0;
            } else if (moonCycle < 3.0) {
                glowOp = 1.0;
                azulOp = 3.0 - moonCycle;
            } else {
                glowOp = 4.0 - moonCycle;
            }
            
            // Suavizado sine-ease-in-out para que las transiciones sean orgnicas
            const smoothGlow = (Math.sin(glowOp * Math.PI - Math.PI / 2) + 1.0) / 2.0;
            const smoothAzul = (Math.sin(azulOp * Math.PI - Math.PI / 2) + 1.0) / 2.0;
            
            moonGlowMat.opacity = smoothGlow;
            moonAzulMat.opacity = smoothAzul;
            
            // Animación de la estrella fugaz
            if (starSprite && starSprite.visible) {
                starTimer += delta;
                
                const angleRad = 28 * Math.PI / 180;
                const speed = 4000;
                
                // Cae hacia abajo (-Y) y hacia la derecha (+Z) 
                starSprite.position.y -= delta * speed * Math.cos(angleRad);
                starSprite.position.z += delta * speed * Math.sin(angleRad);
                
                starSprite.material.opacity = 1.0 - (starTimer / 0.3);
                
                if (starTimer >= 0.3) {
                    starSprite.visible = false;
                }
            }
        }

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
        scene.fog.color.lerpColors(nightFogColor, dayFogColor, dayTransition);

        ambientLight.color.lerpColors(nightAmbientColor, dayAmbientColor, dayTransition);
        ambientLight.intensity = 0.2 + (0.6 * dayTransition); // De 0.2 a 0.8

        dirLight.color.lerpColors(nightDirColor, dayDirColor, dayTransition);
        dirLight.intensity = 0.3 + (0.7 * dayTransition); // De 0.3 a 1.0

        // Raycaster para Interacciones
        raycaster.setFromCamera(centerVec, camera);
        const intersects = raycaster.intersectObjects(interactables);
        
        if (intersects.length > 0 && intersects[0].distance < 3.5) {
            targetInteractable = intersects[0].object;
            msgDisplay.style.display = 'block';
            if (targetInteractable.userData.type === 'CHEST') {
                msgDisplay.innerText = "Presiona E para abrir Cofre";
            } else if (targetInteractable.userData.type === 'BOAT') {
                msgDisplay.innerText = "Presiona E para usar Bote";
                msgDisplay.style.color = "#00ffff";
            } else if (targetInteractable.userData.type === 'NPC') {
                if (!isDialogOpen) {
                    msgDisplay.innerText = "Presiona E para hablar";
                    msgDisplay.style.color = "#ffeb3b";
                } else {
                    msgDisplay.style.display = 'none'; // Ocultar mensaje genérico si está en diálogo
                }
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
            if (isDialogOpen) {
                isDialogOpen = false;
                dialogBox.style.display = 'none';
            }
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
                const ceilingMaxHeight = currentTerrainHeight + WALL_HEIGHT - 0.3; // Margen para la cámara
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
                controlObj.position.y = targetEyesHeight + Math.sin(bobTimer) * 0.04;
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
        
        // Efecto parpadeo antorcha jugador
        torchLight.intensity = 6.0 + Math.random() * 4.0;
        
        // Animar las antorchas del mundo
        const frameIndex = Math.floor(Date.now() / 150) % 5;
        if (torchFrames.length === 5) {
            for (let i = 0; i < torchSprites.length; i++) {
                torchSprites[i].material.map = torchFrames[frameIndex];
            }
        }
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
