import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { UNIT_SIZE, WALL_HEIGHT, DOOR_HEIGHT, VEGETATION_HEIGHT, TORCH_MOUNT_HEIGHT, NIGHT_SKY_ROTATION_SPEED, MANUAL_SKY_TRANSITION_SECONDS, WATER_SURFACE_HEIGHT, BOAT_FLOAT_HEIGHT, BOAT_WIDTH, PLAYER_HEIGHT, MOVEMENT_SPEED, FRICTION, COLLISION_RADIUS, SPRINT_MULTIPLIER, GRAVITY, JUMP_FORCE, STAMINA_MAX } from './src/config.js';
import { npcDialogs, heartDeliveryDialogs, heartDeliveredDialogs } from './src/content/dialogues.js';
import { entities, grahamPosition } from './src/content/entities.js';
import { createEntityRegistry } from './src/world/entity-registry.js';
import { createForestHeartQuest } from './src/systems/forest-heart.js';
import { loadMapImage, readMapLayers } from './src/world/map-loader.js';
import { prepareMap } from './src/world/map-data.js';
import { createMinimap } from './src/ui/minimap.js';
import { createMenus } from './src/ui/menus.js';
import { createHud } from './src/ui/hud.js';
import { bindKeyboard } from './src/input/keyboard.js';
import { getTerrainVertexY, getTerrainHeight as sampleTerrainHeight } from './src/world/terrain-height.js';
import { isWall as hasObstacle } from './src/player/collisions.js';
import { toggleDoor, unlockDoor } from './src/systems/doors.js';
import { createWoodFloorMap } from './src/world/surfaces.js';
import { createTorchLighting } from './src/systems/torch-lighting.js';
import { createMountainHeights } from './src/world/mountain-height.js';
import { smoothMountainPath } from './src/world/mountain-path.js';
import { createRoofBaseMap } from './src/world/roof-height.js';
import { getDoorOpening } from './src/world/door-opening.js';
import { smoothMountainSlope } from './src/world/mountain-slope.js';
import { createBoatGeometry } from './src/world/boat-geometry.js';
import { applyVegetationWind } from './src/world/vegetation-wind.js';
import { applyWaterWaves } from './src/world/water-waves.js';
import { createChestGeometry } from './src/world/chest-geometry.js';
import { GRAHAM_BRIDGE_KEY_AVAILABLE } from './src/config.js';
import { FLIGHT_MULTIPLIER, FLIGHT_SPRINT_MULTIPLIER } from './src/config.js';
import { bridgeKeyDeliveryDialogs, bridgeKeyReceivedDialogs } from './src/content/dialogues.js';
import { pushPlayerFromMovingDoors } from './src/player/door-push.js';
import { createTerrainSectors } from './src/world/terrain-sectors.js';
import { createInstanceSectors } from './src/world/instance-sectors.js';
import { mergeRoofBlocks } from './src/world/roof-blocks.js';
import { createBedGeometry } from './src/world/bed-geometry.js';
import { createSideTableGeometry } from './src/world/side-table-geometry.js';
import { createBarrelGeometry } from './src/world/barrel-geometry.js';
import { createBookshelfGeometry } from './src/world/bookshelf-geometry.js';
import { createTableGeometry, createChairGeometry } from './src/world/table-chair-geometry.js';
import { createWardrobeGeometry } from './src/world/wardrobe-geometry.js';
import { createDeskGeometry } from './src/world/desk-geometry.js';
import { createCrateStackGeometry } from './src/world/crate-stack-geometry.js';
import { createShelfGeometry } from './src/world/shelf-geometry.js';
import { createDresserGeometry } from './src/world/dresser-geometry.js';
import { createBarrelStackGeometry } from './src/world/barrel-stack-geometry.js';
import { createSkyAtlas } from './src/world/sky-atlas.js';
import { createSkyCycle, SKY_CYCLE_TIMING } from './src/world/sky-cycle.js';
import { musicEvents } from './src/systems/music-events.js';
import { createQuestSkyCycle } from './src/systems/quest-sky.js';
import { furniture, doorOverrides } from './src/content/entities.js';

const minimap = createMinimap();
const hud = createHud();

// --- CONFIGURACIÓN DEL JUEGO ---

// Físicas verticales
let velocityY = 0;
let canJump = true;
let isCrouching = false;
let isRunning = false;

// Inventario e Interacciones
let keys = 0;
let hasTorch = false;
let hasMap = false;
const heartQuest = createForestHeartQuest();
const interactables = [];
const slabTops = new Map();
const SLAB_HEIGHT = 0.4;
const solidInteractables = []; // Incluye cofres abiertos y hojas de puerta en su posición actual.
const worldTorches = [];
let torchLighting = null;
const torchSprites = [];
const vegetationWindTime = { value: 0 };
const waterWaveTime = { value: 0 };
let vegetationSectors = null;
let grahamSprite = null;
let targetInteractable = null;
let isRidingBoat = false;
let boatReference = null;

let isDialogOpen = false;
let dialogIndex = 0;
let activeDialogs = npcDialogs;
let deliveringHeart = false;

// --- SETUP DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14); // Noche azulada lúgubre
scene.fog = new THREE.FogExp2(0x030304, 0.02); // Desvanecimiento gradual, sin un límite de distancia abrupto.

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
torchLight.visible = false;
torchLight.position.set(1.0, 0.2, -0.5); // Posicionada más alta y movida en X
camera.add(torchLight);

let targetDayState = true;
const skyCycle = createSkyCycle(MANUAL_SKY_TRANSITION_SECONDS);
const questSkyCycle = createQuestSkyCycle();
let dayNightTimer = questSkyCycle.timer;
let dayTransition = skyCycle.update(0, true, dayNightTimer);

const nightFogColor = new THREE.Color(0x030304);
const dayFogColor = new THREE.Color(0xc3cbd5); // Gris blanquecino con un leve matiz azul.
const duskFogColor = new THREE.Color(0xd99966); // Naranja cálido del horizonte al atardecer.
const dawnFogColor = new THREE.Color(0xbfa0ad); // Rosa apagado acorde al cielo del amanecer.
function updateFogColor() {
    const { night, day, dusk, dawn } = skyCycle.weights;
    scene.fog.color.setRGB(
        nightFogColor.r * night + dayFogColor.r * day + duskFogColor.r * dusk + dawnFogColor.r * dawn,
        nightFogColor.g * night + dayFogColor.g * day + duskFogColor.g * dusk + dawnFogColor.g * dawn,
        nightFogColor.b * night + dayFogColor.b * day + duskFogColor.b * dusk + dawnFogColor.b * dawn
    );
}
const nightAmbientColor = new THREE.Color(0x11111a);
const dayAmbientColor = new THREE.Color(0xffffff);
const nightDirColor = new THREE.Color(0x445577);
const dayDirColor = new THREE.Color(0xffffee);
updateFogColor();
ambientLight.color.lerpColors(nightAmbientColor, dayAmbientColor, dayTransition);
ambientLight.intensity = 0.2 + 0.6 * dayTransition;
dirLight.color.lerpColors(nightDirColor, dayDirColor, dayTransition);
dirLight.intensity = 0.3 + 0.7 * dayTransition;

function toggleDayNight() {
    if (!controls.isLocked || !gameStarted || isDead || isDialogOpen) return;
    if (!questSkyCycle.isFree) return;
    targetDayState = !targetDayState;
    dayNightTimer = targetDayState ? 0 : SKY_CYCLE_TIMING.nightStart;
    questSkyCycle.setTime(dayNightTimer);
    skyCycle.toggle(targetDayState);
}

const raycaster = new THREE.Raycaster();
raycaster.far = 3.5;
const interactionHits = [];
const frameCameraDirection = new THREE.Vector3();
const frameCameraHeading = new THREE.Euler(0, 0, 0, 'YXZ');
const frameMoonPosition = new THREE.Vector3();
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
const menus = createMenus({ onResume: () => controls.lock() });

let gameStarted = false;
let isDead = false;
let isInventoryOpen = false;

controls.addEventListener('lock', () => {
    if (isDead || !mapLoaded) return;
    gameStarted = true;
    musicEvents.setPaused(false);
    musicEvents.startWind();
    isInventoryOpen = false; // Siempre cerramos inventario al clickear para volver
    menus.hideForGameplay();
});
controls.addEventListener('unlock', () => {
    musicEvents.setPaused(true);
    for (const direction of Object.keys(moveState)) moveState[direction] = false;
    velocity.set(0, 0, 0);
    isRunning = false;
    isCrouching = false;
    keyboardBinding.resetSequence();
    if (gameStarted && !isDead) {
        if (isInventoryOpen) {
            menus.showInventory();
        } else {
            menus.showPause();
        }
    }
});

const moveState = { forward: false, backward: false, left: false, right: false, up: false, down: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();



let isFlying = false;

function toggleFlight() {
    if (isRidingBoat) return;
    isFlying = !isFlying;

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

function toggleDoorWithPlayer(door) {
    toggleDoor(door, interactables, collisionMap);
    const backward = camera.getWorldDirection(new THREE.Vector3()).negate();
    const result = pushPlayerFromMovingDoors(controls.getObject().position, backward,
        solidInteractables.filter(object => object.userData.type === 'DOOR'), isWall);
    if (result.blocked) toggleDoor(door, interactables, collisionMap); // Revertir el movimiento si no hay un lado libre.
    if (result.moved) velocity.set(0, 0, 0);
}

function interact() {
    if (gameStarted) {
        if (isDialogOpen) {
            // Avanzar al siguiente diálogo
            if (dialogIndex < activeDialogs.length - 1) {
                dialogIndex++;
                menus.setDialogText(activeDialogs[dialogIndex]);
            } else {
                // Cerrar diálogo
                if (activeDialogs === npcDialogs && !hasTorch) {
                    hasTorch = true;
                    menus.setTorchVisible(true);
                }
                if (deliveringHeart) { heartQuest.deliver(); menus.setHeartVisible(false); }
                if (activeDialogs === bridgeKeyDeliveryDialogs && heartQuest.receiveBridgeKey(GRAHAM_BRIDGE_KEY_AVAILABLE)) {
                    keys++;
                    menus.setKeyCount(keys);
                }
                deliveringHeart = false;
                isDialogOpen = false;
                menus.hideDialog();
            }
            return true;
        }

        if (isRidingBoat) {
            isRidingBoat = false;
            const controlObj = controls.getObject();
            const currentGX = Math.floor((controlObj.position.x + UNIT_SIZE/2) / UNIT_SIZE);
            const currentGZ = Math.floor((controlObj.position.z + UNIT_SIZE/2) / UNIT_SIZE);
            boatReference.position.set(currentGX * UNIT_SIZE, BOAT_FLOAT_HEIGHT, currentGZ * UNIT_SIZE);
            boatReference.userData.gx = currentGX;
            boatReference.userData.gz = currentGZ;
            scene.add(boatReference);
            interactables.push(boatReference);
            boatReference = null;
            velocityY = 10.0; // Pequeño salto al salir
        } else if (targetInteractable) {
            if (targetInteractable.userData.type === 'CHEST') {
                if (targetInteractable.userData.opened) return;
                if (targetInteractable.userData.item === 'forest-heart') {
                    if (!heartQuest.collect()) return;
                    menus.setHeartVisible(true);
                    musicEvents.trigger('forest');
                } else if (targetInteractable.userData.item === 'map') {
                    hasMap = true;
                    menus.setMapVisible(true);
                } else {
                    keys++;
                    menus.setKeyCount(keys);
                }
                const closedGeometry = targetInteractable.geometry;
                targetInteractable.geometry = createChestGeometry(THREE, true);
                closedGeometry.dispose();
                targetInteractable.userData.opened = true;
                interactables.splice(interactables.indexOf(targetInteractable), 1);
                targetInteractable = null;
            } else if (targetInteractable.userData.type === 'BOAT') {
                isFlying = false;
                isRidingBoat = true;
                boatReference = targetInteractable;
                interactables.splice(interactables.indexOf(boatReference), 1);
                collisionMap[boatReference.userData.gz][boatReference.userData.gx] = false;
                targetInteractable = null;
                const controlObj = controls.getObject();
                controlObj.position.x = boatReference.userData.gx * UNIT_SIZE;
                controlObj.position.z = boatReference.userData.gz * UNIT_SIZE;
                controlObj.position.y = BOAT_FLOAT_HEIGHT + boatReference.geometry.parameters.height / 2 + (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT);
                velocityY = 0;
                canJump = true;
            } else if (targetInteractable.userData.type === 'NPC') {
                isDialogOpen = true;
                deliveringHeart = hasTorch && heartQuest.hasHeart;
                activeDialogs = !hasTorch ? npcDialogs : deliveringHeart ? heartDeliveryDialogs : heartQuest.stage === 'delivered' ? heartDeliveredDialogs : npcDialogs;
                if (hasTorch && GRAHAM_BRIDGE_KEY_AVAILABLE && (deliveringHeart || heartQuest.stage === 'delivered')) {
                    activeDialogs = heartQuest.hasBridgeKey ? bridgeKeyReceivedDialogs : bridgeKeyDeliveryDialogs;
                }
                dialogIndex = 0;
                menus.showDialog(activeDialogs[dialogIndex]);
            } else if (targetInteractable.userData.type === 'DOOR') {
                if (targetInteractable.userData.locked) {
                    if (keys > 0) {
                        keys--;
                        menus.setKeyCount(keys);
                        unlockDoor(targetInteractable);
                        toggleDoorWithPlayer(targetInteractable);
                    }
                } else {
                    toggleDoorWithPlayer(targetInteractable);
                }
            }
        }
    }
}

const keyboardBinding = bindKeyboard({
    isPaused: () => gameStarted && !isDead && !controls.isLocked && !isInventoryOpen,
    toggleFlight,
    toggleDayNight,
    stopMusic() { if (gameStarted && !isDead && controls.isLocked) musicEvents.stopMusic(); },
    start() { if (mapLoaded && !gameStarted) controls.lock(); },
    interact,
    move(direction, pressed) { moveState[direction] = pressed; },
    jump() {
        if (!isFlying && !isRidingBoat && canJump) { velocityY = JUMP_FORCE; canJump = false; }
    },
    crouch(pressed) { isCrouching = pressed; },
    run(pressed) { isRunning = pressed; },
    map() { if (mapLoaded && hasMap) minimap.toggle(); },
    torch() { if (gameStarted && !isDead && hasTorch) torchLight.visible = !torchLight.visible; },
    inventory() {
        if (gameStarted && !isDead) {
            isInventoryOpen = !isInventoryOpen;
            if (isInventoryOpen) {
                controls.unlock();
                menus.showInventory();
            } else {
                menus.hideInventory();
                controls.lock();
            }
        }
    }
});

// --- LECTURA DE MAPA DESDE IMAGEN PNG ---
let mapWidth = 0;
let mapHeight = 0;
let collisionMap = []; 
let floorMap = [];
let roofMap = [];
let elevationMap = [];
let woodFloorMap = [];
let mountainPathProfile = null;
let terrainHeightSamples = null;
let mapLoaded = false;
let playerStartX = 0;
let playerStartZ = 0;





let aguaFloorMat = null;




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
const npcTex = texLoader.load('./imagenes/Sprites/Graham.png?v=' + Date.now(), () => alignGrahamToFloor());
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
const cieloFalsoTex = texLoader.load('./imagenes/Texturas/cielo_falso.png?v=' + Date.now());
cieloFalsoTex.wrapS = THREE.RepeatWrapping;
cieloFalsoTex.wrapT = THREE.RepeatWrapping;
const maderaTex = texLoader.load('./imagenes/Texturas/madera.jpg?v=' + Date.now());
const puertaTex = texLoader.load('./imagenes/Texturas/puerta.png?v=' + Date.now());
const losaTex = texLoader.load('./imagenes/Texturas/losa.png?v=' + Date.now());
const piedraTex = texLoader.load('./imagenes/Texturas/piedra.png?v=' + Date.now());
const rocaTex = texLoader.load('./imagenes/Texturas/rocas.jpg?v=' + Date.now());
const nieveTex = texLoader.load('./imagenes/Texturas/nieve.png?v=' + Date.now());

[npcTex, pino1Tex, pino2Tex, alamo1Tex, alamo2Tex, arau1Tex, arau2Tex, arbusto1Tex, arbusto2Tex, weed1Tex, weed2Tex, weed3Tex, pastoTex, tierraTex, arenaTex, agua1Tex, agua2Tex, agua3Tex, muroTex, maderaTex, puertaTex, losaTex, piedraTex, rocaTex, nieveTex, techoTex, cieloFalsoTex].forEach(t => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
});
// Reducir el parpadeo de la roca a distancia conservando píxeles definidos de cerca.
rocaTex.minFilter = THREE.LinearMipmapLinearFilter;
rocaTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());



[losaTex, piedraTex, rocaTex, nieveTex, pastoTex, tierraTex, arenaTex, agua1Tex, agua2Tex, agua3Tex].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
});

const puertaFlippedTex = puertaTex.clone();
puertaFlippedTex.wrapS = THREE.RepeatWrapping;
puertaFlippedTex.repeat.x = -1;
puertaFlippedTex.needsUpdate = true;

// Cielos independientes para conservar la transición y la luna fija.
const nightAtlas = createSkyAtlas(THREE, texLoader, './imagenes/Texturas/Cielo/Ciclo/Noche.jpeg?v=' + Date.now(), {
    faceQuarterTurns: [0,1,2,3,1,3],
    mirroredFaces: [false,false,false,false,true,true]
});
const nightMaterials = Array.from({length:6}, () => new THREE.MeshBasicMaterial({map:nightAtlas.texture,side:THREE.BackSide,fog:false,transparent:true,opacity:1,depthWrite:false}));
const nightSkyMesh = new THREE.Mesh(nightAtlas.geometry,nightMaterials);
nightSkyMesh.renderOrder = -1;
const dayAtlas = createSkyAtlas(THREE, texLoader, './imagenes/Texturas/Cielo/Ciclo/Dia.png?v=' + Date.now());
const dayMaterials = Array.from({length:6}, () => new THREE.MeshBasicMaterial({ map: dayAtlas.texture, side: THREE.BackSide, fog:false, transparent:true, opacity:0, depthWrite:false }));
const daySkyMesh = new THREE.Mesh(dayAtlas.geometry, dayMaterials);
daySkyMesh.renderOrder = -1;
const createTransitionSky = (file,order) => {
    const atlas=createSkyAtlas(THREE,texLoader,'./imagenes/Texturas/Cielo/Ciclo/'+file+'?v='+Date.now());
    const material=new THREE.MeshBasicMaterial({map:atlas.texture,side:THREE.BackSide,fog:false,transparent:true,opacity:0,depthWrite:false});
    const mesh=new THREE.Mesh(atlas.geometry,material);
    mesh.renderOrder=order;
    return mesh;
};
const dawnSkyMesh=createTransitionSky('Amanecer.png',-3);
const duskSkyMesh=createTransitionSky('Atardecer.png',-2);
duskSkyMesh.material.opacity=skyCycle.weights.dusk;
nightSkyMesh.renderOrder=-4;


skyMesh = new THREE.Group();
skyMesh.add(nightSkyMesh);
skyMesh.add(daySkyMesh);
// Orden explícito de render para fundidos sin oscurecimiento artificial.
skyMesh.add(dawnSkyMesh);
skyMesh.add(duskSkyMesh);

// --- LUNA ---
const moonNormalTex = texLoader.load('./imagenes/Sprites/luna - sol/Luna_B.png?v=' + Date.now());
const moonGlowTex = texLoader.load('./imagenes/Sprites/luna - sol/Luna_glow.png?v=' + Date.now());
const moonAzulTex = texLoader.load('./imagenes/Sprites/luna - sol/Luna_azul.png?v=' + Date.now());
const sunTex = texLoader.load('./imagenes/Sprites/luna - sol/Sol.png?v=' + Date.now());






[moonNormalTex, moonGlowTex, moonAzulTex, sunTex].forEach(t => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
});



const moonMat = new THREE.SpriteMaterial({ map: moonNormalTex, transparent: true, opacity:1-0.6*dayTransition, fog: false, depthWrite: false });
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

// Trayectoria norte (-Z) a sur (+Z), independiente de la rotación de estrellas.
const sunMat = new THREE.SpriteMaterial({map:sunTex,transparent:true,opacity:1,fog:false,depthWrite:false});
const sunSprite = new THREE.Sprite(sunMat);
sunSprite.scale.set(70,70,1);
const initialSunAngle=Math.PI*skyCycle.sunProgress;
sunSprite.position.set(0,camera.position.y-200+Math.sin(initialSunAngle)*580,-Math.cos(initialSunAngle)*580);
sunSprite.renderOrder=-0.2;
skyMesh.add(sunSprite);

// Variables para la lógica de mirar la luna
let moonLookTimer = 0;
let moonIsAlternating = false;
let moonCycle = 0.0;
let moonGlowOpacity = 0;
let moonAzulOpacity = 0;
let hasShootingStarFired = false;
let starSprite = null;
let starTimer = 0;

scene.add(skyMesh);

Promise.all([
    loadMapImage('./imagenes/Mapa/capa1.png?v=' + Date.now()),
    loadMapImage('./imagenes/Mapa/capa2.png?v=' + Date.now())
]).then(([baseImage, roofImage]) => {
    buildWorld(readMapLayers(baseImage, roofImage));
    mapLoaded = true;
    loadingScreen.style.display = 'none';
    if (document.pointerLockElement === document.body) {
        controls.isLocked = true;
        controls.dispatchEvent({ type: 'lock' });
    } else {
        mainMenu.style.display = 'flex';
    }
}).catch((error) => {
    if (document.pointerLockElement) document.exitPointerLock();
    loadingScreen.style.color = 'red';
    loadingScreen.textContent = 'ERROR: ' + error.message;
    console.error(error);
});


function buildWorld(mapData) {
    const prepared = prepareMap(mapData, entities);
    ({ mapWidth, mapHeight, collisionMap, floorMap, roofMap, playerStartX, playerStartZ } = prepared);
    const { counts, floorCanvas } = prepared;
    const registry = createEntityRegistry(entities, floorMap, mapWidth, mapHeight);
    woodFloorMap = createWoodFloorMap(floorMap, roofMap, mapWidth, mapHeight, prepared.externalTorchMap);
    // El floorCanvas se utilizará ahora exclusivamente para el minimapa
    // Eliminado el floorMesh (la imagen del mapa 2D en el mundo 3D) para no interferir con las laderas y profundidades del terreno continuo.
    
    // Lecho marino (fondo profundo absoluto por si hay huecos)
    const seabedGeo = new THREE.PlaneGeometry(mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE);
    const seabedMat = new THREE.MeshPhongMaterial({ color: 0x050511, shininess: 0 }); // Oscuridad profunda
    const seabedMesh = new THREE.Mesh(seabedGeo, seabedMat);
    seabedMesh.rotation.x = -Math.PI / 2;
    seabedMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, -2.7, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
    scene.add(seabedMesh);

    // Geometrías
    const grassPlaneGeo = new THREE.PlaneGeometry(UNIT_SIZE, VEGETATION_HEIGHT * 0.8 * 1.1);
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
    applyVegetationWind(THREE, [pino1Mat, pino2Mat, alamo1Mat, alamo2Mat, arau1Mat, arau2Mat, arbusto1Mat, arbusto2Mat, weed1Mat, weed2Mat, weed3Mat], vegetationWindTime);
    // Matiz frío para integrar pinos y hierba alta con la iluminación nocturna.
    [pino1Mat, pino2Mat, weed1Mat, weed2Mat, weed3Mat].forEach(material => {
        material.color.setHex(0xb0bed4);
    });
    
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
    aguaFloorMat = new THREE.MeshPhongMaterial({ map: agua1Tex, color: 0xb8d9ff, transparent: true, opacity: 0.4752, shininess: 60 });
    applyWaterWaves(THREE, aguaFloorMat, waterWaveTime);
    const maderaFloorMat = new THREE.MeshPhongMaterial({ map: maderaTex, shininess: 0 }); 

    const planeGeo = new THREE.PlaneGeometry(UNIT_SIZE * 1.9, VEGETATION_HEIGHT * 3 * 1.9);
    const pino1Mesh = new THREE.InstancedMesh(planeGeo, pino1Mat, counts.PINO1 * 2);
    const pino2Mesh = new THREE.InstancedMesh(planeGeo, pino2Mat, counts.PINO2 * 2);
    const alamo1Mesh = new THREE.InstancedMesh(planeGeo, alamo1Mat, counts.ALAMO1 * 2);
    const alamo2Mesh = new THREE.InstancedMesh(planeGeo, alamo2Mat, counts.ALAMO2 * 2);
    const arau1Mesh = new THREE.InstancedMesh(planeGeo, arau1Mat, counts.ARAU1 * 2);
    const arau2Mesh = new THREE.InstancedMesh(planeGeo, arau2Mat, counts.ARAU2 * 2);
    const bushGeo = new THREE.PlaneGeometry(UNIT_SIZE * 2.0 * 0.8, VEGETATION_HEIGHT * 1.6 * 0.8);
    const arbusto1Mesh = new THREE.InstancedMesh(bushGeo, arbusto1Mat, counts.BUSH1 * 2);
    const arbusto2Mesh = new THREE.InstancedMesh(bushGeo, arbusto2Mat, counts.BUSH2 * 2);
    const weed1Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed1Mat, counts.WEED1 * 2);
    const weed2Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed2Mat, counts.WEED2 * 2);
    const weed3Mesh = new THREE.InstancedMesh(grassPlaneGeo, weed3Mat, counts.WEED3 * 2);
    
    const bldgMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, UNIT_SIZE), bldgMat, counts.BUILDING);
    const doorCount = floorMap.reduce((total,row)=>total+row.filter(type=>['DOOR_UNLOCKED','DOOR_LOCKED'].includes(type)).length,0);
    const lintelHeight = WALL_HEIGHT - DOOR_HEIGHT;
    const lintelMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, lintelHeight, UNIT_SIZE), bldgMat, doorCount);
    let idxLintel = 0;
    const jambMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, DOOR_HEIGHT, 1), bldgMat, doorCount * 2);
    let idxJamb = 0;
    const roofSubdivisions = 8;
    const roofStepHeight = WALL_HEIGHT * 0.0625;
    const ceilingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE / roofSubdivisions, roofStepHeight, UNIT_SIZE / roofSubdivisions), roofMat, counts.ROOF * roofSubdivisions ** 2);
    const falseCeilingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, 0.1, UNIT_SIZE), ceilingMat, counts.ROOF);

    const floorTileGeo = new THREE.BoxGeometry(UNIT_SIZE, 1.0, UNIT_SIZE);
    const maderaFloorMesh = new THREE.InstancedMesh(floorTileGeo, maderaFloorMat, counts.MADERA_FLOOR + 500);

    [agua1Tex, agua2Tex, agua3Tex].forEach(t => {
        t.repeat.set(mapWidth, mapHeight);
    });
    const globalWaterGeo = new THREE.PlaneGeometry(mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE);
    const globalWaterMesh = new THREE.Mesh(globalWaterGeo, aguaFloorMat);
    globalWaterMesh.rotation.x = -Math.PI / 2;
    globalWaterMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, WATER_SURFACE_HEIGHT, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
    scene.add(globalWaterMesh);


    elevationMap = Array.from({length: mapHeight}, () => new Float32Array(mapWidth).fill(9999));
    const distQueue = [];
    
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            if (['WATER', 'WATER_ROCK', 'BOAT'].includes(floorMap[z][x]) || x === 0 || x === mapWidth-1 || z === 0 || z === mapHeight-1) {
                let bordersLand = false;
                for (let dz = -1; dz <= 1; dz++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nz = z + dz, nx = x + dx;
                        if (nz >= 0 && nz < mapHeight && nx >= 0 && nx < mapWidth) {
                            const nt = floorMap[nz][nx];
                            if (!['WATER', 'WATER_ROCK', 'BOAT'].includes(nt)) bordersLand = true;
                        }
                    }
                }
                if (bordersLand || x === 0 || x === mapWidth-1 || z === 0 || z === mapHeight-1) {
                    distQueue.push({r: z, c: x, dist: 0});
                }
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

    let previousMountainMaximum = 1;
    for(let z=0;z<mapHeight;z++) for(let x=0;x<mapWidth;x++) {
        const factor = {MOUNTAIN:1.5,PEAK:2,SNOW_PEAK:3}[floorMap[z][x]];
        if(factor) previousMountainMaximum=Math.max(previousMountainMaximum,elevationMap[z][x]*factor);
    }
    previousMountainMaximum *= 0.85 * 0.8;
    const { heights: mountainHeights, mask: mountainMask } = createMountainHeights(floorMap, mapWidth, mapHeight, previousMountainMaximum);
    // Aplanar y esculpir
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const type = floorMap[z][x];
            let dist = elevationMap[z][x];
            
            // Reglas de elevación según el tipo
            if (mountainMask[z][x]) elevationMap[z][x] = mountainHeights[z][x];
            else if (woodFloorMap[z][x]) elevationMap[z][x] = 1.0;
            else if (['WATER', 'WATER_ROCK', 'BOAT'].includes(type)) {
                let sandDistance = 4;
                for (let dz = -3; dz <= 3; dz++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        if (floorMap[z + dz]?.[x + dx] === 'SAND') sandDistance = Math.min(sandDistance, Math.hypot(dx, dz));
                    }
                }
                elevationMap[z][x] = -0.5 - Math.min(2, Math.max(0, sandDistance - 1) * 0.8);
            }
            else if (type === 'SAND') elevationMap[z][x] = 0.2;
            else if (['GRASS', 'TALL_GRASS', 'TREE', 'BUSH', 'DIRT', 'TORCH', 'OTHER', 'OTHER2', 'CHEST'].includes(type)) {
                let height = Math.min(dist * 0.2, 1.0);
                let sandDistance = 4;
                for (let dz = -3; dz <= 3; dz++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        if (floorMap[z + dz]?.[x + dx] === 'SAND') sandDistance = Math.min(sandDistance, Math.hypot(dx, dz));
                    }
                }
                if (sandDistance < 4) {
                    const t = sandDistance / 4;
                    const blend = t * t * (3 - 2 * t);
                    height = 0.2 + (height - 0.2) * blend;
                }
                elevationMap[z][x] = height;
            } else if (['BUILDING', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'INDOOR_FLOOR', 'WOOD', 'CHEST', 'POI'].includes(type)) {
                // Flatten buildings to ground level
                elevationMap[z][x] = 1.0;
            } else if (type === 'MOUNTAIN') {
                elevationMap[z][x] = mountainHeights[z][x];
            } else if (type === 'PEAK') {
                elevationMap[z][x] = mountainHeights[z][x];
            } else if (type === 'SNOW_PEAK') {
                elevationMap[z][x] = mountainHeights[z][x];
            }
        }
    }
    
    // Plataforma de las construcciones apoyadas en nieve: misma cota para suelo, muros y techo.
    const summitCells = [];
    for(let z=0;z<mapHeight;z++) for(let x=0;x<mapWidth;x++) {
        if(mountainMask[z][x] && ['BUILDING','INDOOR_FLOOR','WOOD','CHEST','DOOR_UNLOCKED','DOOR_LOCKED'].includes(floorMap[z][x])) summitCells.push([x,z]);
    }
    if(summitCells.length) {
        const minX=Math.min(...summitCells.map(p=>p[0])),maxX=Math.max(...summitCells.map(p=>p[0]));
        const minZ=Math.min(...summitCells.map(p=>p[1])),maxZ=Math.max(...summitCells.map(p=>p[1]));
        const platformHeight=previousMountainMaximum;
        const approachRadius=32;
        for(let z=Math.max(0,minZ-approachRadius);z<=Math.min(mapHeight-1,maxZ+approachRadius);z++) for(let x=Math.max(0,minX-approachRadius);x<=Math.min(mapWidth-1,maxX+approachRadius);x++) {
            if(!mountainMask[z][x]) continue;
            const distance=Math.hypot(Math.max(minX-x,0,x-maxX),Math.max(minZ-z,0,z-maxZ));
            if(distance>approachRadius) continue;
            const t=distance/approachRadius,blend=t*t*(3-2*t);
            elevationMap[z][x]=platformHeight*(1-blend)+elevationMap[z][x]*blend;
        }
    }
    mountainPathProfile = smoothMountainPath(floorMap, elevationMap, mountainMask, previousMountainMaximum);
    // Smooth indoor boundaries
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            if (['TORCH', 'OTHER'].includes(floorMap[z][x])) {
                let isAdjacentToIndoor = false;
                for (let r = Math.max(0, z-1); r <= Math.min(mapHeight-1, z+1); r++) {
                    for (let c = Math.max(0, x-1); c <= Math.min(mapWidth-1, x+1); c++) {
                        if (['INDOOR_FLOOR', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'WOOD'].includes(floorMap[r][c])) {
                            isAdjacentToIndoor = true;
                        }
                    }
                }
                if (isAdjacentToIndoor) {
                    if(!mountainMask[z][x]) elevationMap[z][x] = 1.0;
                }
            }
        }
    }

    smoothMountainSlope(floorMap, elevationMap, mountainMask);
    const roofBaseMap = createRoofBaseMap(roofMap, floorMap, elevationMap);
    let idxPino1=0, idxPino2=0, idxAlamo1=0, idxAlamo2=0, idxArau1=0, idxArau2=0, idxBUSH1=0, idxBUSH2=0, idxWeed1=0, idxWeed2=0, idxWeed3=0, idxBldg=0, idxMtn=0, idxPeak=0, idxSnowPeak=0, idxCeil=0, idxFalseCeil=0, idxRoof=0, idxMadera=0;
    const dummy = new THREE.Object3D(); 
    
    const roofQueue = [];
    // Un byte por distancia mantiene el uso de memoria de la cuadrícula anterior.
    const roofDistances = Array.from({length: mapHeight * roofSubdivisions}, () => new Uint8Array(mapWidth * roofSubdivisions).fill(255));
    
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            if (roofMap[z][x] === 'ROOF') {
                const isEdge = x===0 || x===mapWidth-1 || z===0 || z===mapHeight-1 || roofMap[z-1][x] !== 'ROOF' || roofMap[z+1][x] !== 'ROOF' || roofMap[z][x-1] !== 'ROOF' || roofMap[z][x+1] !== 'ROOF';
                if (isEdge) {
                    for(let sz=0; sz<roofSubdivisions; sz++) {
                        for(let sx=0; sx<roofSubdivisions; sx++) {
                            const last = roofSubdivisions - 1;
                            const isSubEdge = x===0 && sx===0 || x===mapWidth-1 && sx===last || z===0 && sz===0 || z===mapHeight-1 && sz===last || (roofMap[z-1]?.[x]!='ROOF' && sz===0) || (roofMap[z+1]?.[x]!='ROOF' && sz===last) || (roofMap[z][x-1]!='ROOF' && sx===0) || (roofMap[z][x+1]!='ROOF' && sx===last);
                            if (isSubEdge) {
                                roofQueue.push({'r': z*roofSubdivisions+sz, 'c': x*roofSubdivisions+sx, 'dist': 0});
                                roofDistances[z*roofSubdivisions+sz][x*roofSubdivisions+sx] = 0;
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
        if (dist >= 25) continue; // La cresta alcanza su altura máxima; no hace falta propagar más.
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of dirs) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<mapHeight*roofSubdivisions && nc>=0 && nc<mapWidth*roofSubdivisions) {
                if (roofDistances[nr][nc] > dist + 1) {
                    const originalR = Math.floor(nr/roofSubdivisions);
                    const originalC = Math.floor(nc/roofSubdivisions);
                    if (roofMap[originalR]?.[originalC] === 'ROOF') {
                        roofDistances[nr][nc] = dist + 1;
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
                const roofBaseH = roofBaseMap[z][x];
                dummy.position.set(posX, roofBaseH + WALL_HEIGHT, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                falseCeilingMesh.setMatrixAt(idxFalseCeil++, dummy.matrix);

                const stepHeight = roofStepHeight;
                const subSize = UNIT_SIZE / roofSubdivisions;
                const startOffset = -(UNIT_SIZE / 2) + (subSize / 2);
                
                for (let sz = 0; sz < roofSubdivisions; sz++) {
                    for (let sx = 0; sx < roofSubdivisions; sx++) {
                        const r4 = z * roofSubdivisions + sz;
                        const c4 = x * roofSubdivisions + sx;
                        const rDist = roofDistances[r4][c4];
                        
                        const effectiveDist = Math.min(Math.max(rDist - 2, 0), 23);
                        
                        const subPosX = posX + startOffset + (sx * subSize);
                        const subPosZ = posZ + startOffset + (sz * subSize);
                        
                        const techoBottom = roofBaseH + WALL_HEIGHT + (effectiveDist * stepHeight);
                        const techoCenter = techoBottom + (stepHeight / 2);
                        
                        dummy.position.set(subPosX, techoCenter, subPosZ);
                        dummy.rotation.set(0, 0, 0);
                        dummy.updateMatrix();
                        ceilingMesh.setMatrixAt(idxCeil++, dummy.matrix);
                    }
                }
            }
            
            if (prepared.externalTorchMap[z][x] || rType === 'TORCH' || rType === 'OTHER2' || type === 'TORCH' || type === 'OTHER2') {
                const isBlueTorch = type === 'OTHER2' || rType === 'OTHER2';
                let wallX = posX, wallZ = posZ;
                const solid = value => ['BUILDING', 'MOUNTAIN', 'PEAK', 'SNOW_PEAK'].includes(value);
                const neighbors = [[-1,0],[1,0],[0,-1],[0,1]];
                const support = neighbors.find(([dx,dz])=>floorMap[z+dz]?.[x+dx]==='BUILDING')
                    ?? neighbors.find(([dx,dz])=>solid(floorMap[z+dz]?.[x+dx]));
                let supportHeight = getTerrainHeight(wallX, wallZ);
                if (support) {
                    const [dx,dz] = support;
                    // La cara del muro está a media celda; dejar solo un pequeño margen visible.
                    wallX = posX + dx * (UNIT_SIZE / 2 - 0.04);
                    wallZ = posZ + dz * (UNIT_SIZE / 2 - 0.04);
                    supportHeight = elevationMap[z+dz][x+dx];
                }
                const torchY = supportHeight + TORCH_MOUNT_HEIGHT;
                worldTorches.push({ x: wallX, z: wallZ, y: torchY, isBlue: isBlueTorch, isIndoor: woodFloorMap[z][x], gx: x, gz: z });
                const isIndoor = woodFloorMap[z][x];
                const material = new THREE.SpriteMaterial({ map: torchFrames[0], transparent: true, fog: !isIndoor, depthWrite: false, color: isBlueTorch ? 0x66ccff : 0xffffff });
                if (!isIndoor) {
                    // Apagar la llama sin ocultar el soporte ni alterar el sprite original.
                    const flameStrength = { value: 1 - dayTransition };
                    material.userData.flameStrength = flameStrength;
                    material.onBeforeCompile = shader => {
                        shader.uniforms.flameStrength = flameStrength;
                        shader.fragmentShader = 'uniform float flameStrength;\n' + shader.fragmentShader;
                        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
                            '#include <map_fragment>\nif (vMapUv.y > 0.5) diffuseColor.a *= flameStrength;');
                    };
                }
                const sprite = new THREE.Sprite(material);
                sprite.position.set(wallX, torchY, wallZ);
                sprite.scale.set(1, 1, 1);
                scene.add(sprite);
                torchSprites.push(sprite);
            }

            if (type === 'BUILDING') {
                dummy.position.set(posX, baseH + WALL_HEIGHT / 2, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                bldgMesh.setMatrixAt(idxBldg++, dummy.matrix);
            }

            if (type === 'TREE') {
                const rand = ((x * 31 + z * 17) % 100);
                dummy.position.set(posX, baseH + ((VEGETATION_HEIGHT*3*1.9)/2) - 0.5, posZ);
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
                dummy.position.set(posX, baseH + bushGeo.parameters.height / 2 - 0.5, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                if(isArbusto1) arbusto1Mesh.setMatrixAt(idxBUSH1++, dummy.matrix); else arbusto2Mesh.setMatrixAt(idxBUSH2++, dummy.matrix);
                
                dummy.rotation.set(0, Math.PI/2, 0);
                dummy.updateMatrix();
                if(isArbusto1) arbusto1Mesh.setMatrixAt(idxBUSH1++, dummy.matrix); else arbusto2Mesh.setMatrixAt(idxBUSH2++, dummy.matrix);
            } else if (type === 'TALL_GRASS') {
                const rand = ((x * 13 + z * 7) % 100);
                const weedVariant = rand % 3;
                dummy.position.set(posX, baseH + grassPlaneGeo.parameters.height / 2 - 0.5, posZ);
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
                const chestGeo = createChestGeometry(THREE);
                const chestMat = new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8B4513, shininess: 0 }); 
                const chestMetalMat = new THREE.MeshPhongMaterial({ color: 0x42464b, shininess: 18 });
                const chestMesh = new THREE.Mesh(chestGeo, [chestMat, chestMetalMat]);
                chestMesh.position.set(posX, getTerrainHeight(posX, posZ) - chestGeo.boundingBox.min.y, posZ);
                const definition = registry.at(x, z);
                chestMesh.rotation.y = definition?.rotationY ?? 0;
                chestMesh.userData = { type: 'CHEST', gx: x, gz: z, id: definition?.id || `chest:${x},${z}`, item: definition?.item || 'key' };
                scene.add(chestMesh);
                chestMesh.updateMatrixWorld(true);
                solidInteractables.push(chestMesh);
                interactables.push(chestMesh);
            } else if (type === 'BOAT') {
                const boatGeo = createBoatGeometry(THREE, BOAT_WIDTH);
                const boatMat = new THREE.MeshPhongMaterial({ map: maderaTex, color: 0xaa8866, shininess: 0 }); 
                const boatMesh = new THREE.Mesh(boatGeo, boatMat);
                boatMesh.position.set(posX, BOAT_FLOAT_HEIGHT, posZ);
                boatMesh.userData = { type: 'BOAT', gx: x, gz: z };
                scene.add(boatMesh);
                interactables.push(boatMesh);
            } else if (type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED') {
                const isLocked = type === 'DOOR_LOCKED';
                const tintColor = isLocked ? 0xffbbbb : 0xffffff;
                
                // Determinar orientación basada en los edificios vecinos (horizontal o vertical)
                const opening = getDoorOpening(floorMap, x, z);
                const { isHorizontal, isRightDoor } = opening;
                
                // Determinar si es la hoja derecha de una puerta doble

                const doorGroup = new THREE.Group();
                doorGroup.position.set(posX + (isHorizontal?opening.centerOffset:0), baseH + DOOR_HEIGHT / 2, posZ + (isHorizontal?0:opening.centerOffset));
                
                const doorGeo = isHorizontal ? new THREE.BoxGeometry(opening.width, DOOR_HEIGHT, 0.4) : new THREE.BoxGeometry(0.4, DOOR_HEIGHT, opening.width);
                // El dintel pertenece al muro y permanece fijo cuando la hoja se abre.
                dummy.position.set(posX, baseH + DOOR_HEIGHT + lintelHeight / 2, posZ);
                dummy.updateMatrix();
                lintelMesh.setMatrixAt(idxLintel++, dummy.matrix);
                for (const [margin,sign] of [[opening.leftMargin,-1],[opening.rightMargin,1]]) {
                    if (!margin) continue;
                    const offset=sign*(UNIT_SIZE-margin)/2;
                    dummy.position.set(posX+(isHorizontal?offset:0),baseH+DOOR_HEIGHT/2,posZ+(isHorizontal?0:offset));
                    dummy.scale.set(isHorizontal?margin:UNIT_SIZE,1,isHorizontal?UNIT_SIZE:margin);
                    dummy.updateMatrix();
                    jambMesh.setMatrixAt(idxJamb++,dummy.matrix);
                }
                dummy.scale.set(1,1,1);
                
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
                    const offset = isRightDoor ? -opening.width/2 : opening.width/2;
                    doorMesh.position.set(offset, 0, 0);
                    doorGroup.position.x -= offset;
                } else {
                    const offset = isRightDoor ? -opening.width/2 : opening.width/2;
                    doorMesh.position.set(0, 0, offset);
                    doorGroup.position.z -= offset;
                }
                
                doorGroup.add(doorMesh);
                
                const doorOverride = doorOverrides.find(definition => definition.position.x === x && definition.position.z === z);
                const swingDir = doorOverride?.openDirection === 'south' && isHorizontal
                    ? (isRightDoor ? 1 : -1)
                    : (isRightDoor ? -1 : 1);
                const uData = { type: 'DOOR', locked: isLocked, isOpen: false, gx: x, gz: z, parentGroup: doorGroup, isHorizontal: isHorizontal, swingDir: swingDir };
                doorMesh.userData = uData;
                doorGroup.userData = uData;
                
                scene.add(doorGroup);
                doorGroup.updateMatrixWorld(true);
                solidInteractables.push(doorMesh);
                interactables.push(doorMesh);
                
                // Techo eliminado de aquí
            }

            // Pisos especiales (Madera)
            // Si la antorcha fue pintada en la capa 1 y está en interior, restauramos el piso de madera
            const needsWoodFloor = woodFloorMap[z][x];

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
    
    vegetationSectors = createInstanceSectors(THREE, [pino1Mesh, pino2Mesh, alamo1Mesh, alamo2Mesh, arau1Mesh, arau2Mesh, arbusto1Mesh, arbusto2Mesh, weed1Mesh, weed2Mesh, weed3Mesh]);
    scene.add(vegetationSectors.group);
    scene.add(bldgMesh);
    lintelMesh.count = idxLintel;
    scene.add(lintelMesh);
    jambMesh.count = idxJamb;
    scene.add(jambMesh);
    scene.add(mergeRoofBlocks(THREE, ceilingMesh));
    scene.add(falseCeilingMesh);
    maderaFloorMesh.count = idxMadera;
    scene.add(maderaFloorMesh);
    torchLighting = createTorchLighting(THREE, scene, worldTorches);
    
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
    const mountainWeights = new Float32Array(positions.length / 3 * 3);
    const terrainChannels = { OTHER: 3, DIRT: 1, SAND: 2, WATER: 2, BOAT: 2, WATER_ROCK: 5, MOUNTAIN: 4, PEAK: 5, SNOW_PEAK: 6 };
    const slabGroundCells = new Uint8Array(mapWidth * mapHeight);
    for (const definition of entities) {
        if (definition.ground === 'SLAB') slabGroundCells[definition.position.z * mapWidth + definition.position.x] = 1;
    }
    // El marcador de bote conserva el fondo del agua que lo rodea.
    const boatBottomChannels = new Map();
    for (let z = 0; z < mapHeight; z++) for (let x = 0; x < mapWidth; x++) {
        if (floorMap[z][x] !== 'BOAT') continue;
        let nearest = Infinity, channel = 2;
        for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
            const neighbor = floorMap[z + dz]?.[x + dx];
            const distance = dx * dx + dz * dz;
            if (['WATER', 'WATER_ROCK'].includes(neighbor) && distance < nearest) {
                nearest = distance;
                channel = terrainChannels[neighbor];
            }
        }
        boatBottomChannels.set(z * mapWidth + x, channel);
    }

    for (let i = 0; i < positions.length / 3; i++) {
        const vx = i % vertsW;
        const vz = Math.floor(i / vertsW);
        const colF = vx / SUBDIVISIONS;
        const rowF = vz / SUBDIVISIONS;
        
        const c0 = Math.floor(colF);
        const c1 = Math.min(c0 + 1, mapWidth - 1);
        const r0 = Math.floor(rowF);
        const r1 = Math.min(r0 + 1, mapHeight - 1);
        
        // Muros y pisos están centrados en la celda, no en su esquina.
        const surfaceX = Math.min(Math.floor(colF + 0.5), mapWidth - 1);
        const surfaceZ = Math.min(Math.floor(rowF + 0.5), mapHeight - 1);
        const type = floorMap[surfaceZ][surfaceX];
        
        // Interpolación compartida para pasto, tierra, arena, piedra, roca y nieve.
        const tx = colF - c0, tz = rowF - r0;
        for (const [x,z,weight] of [[c0,r0,(1-tx)*(1-tz)], [c1,r0,tx*(1-tz)], [c0,r1,(1-tx)*tz], [c1,r1,tx*tz]]) {
            const channel = slabGroundCells[z * mapWidth + x] ? 3
                : floorMap[z][x] === 'CHEST' && !woodFloorMap[z][x] ? 1
                : boatBottomChannels.get(z * mapWidth + x) ?? terrainChannels[floorMap[z][x]] ?? 0;
            if (channel < 4) splatWeights[i*4+channel] += weight;
            else mountainWeights[i*3+channel-4] += weight;
        }

        const y = getTerrainVertexY(colF, rowF, mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap, mountainPathProfile);
        positions[i * 3 + 1] = y;
    }
    
    terrainGeo.setAttribute('splatWeights', new THREE.BufferAttribute(splatWeights, 4));
    terrainGeo.setAttribute('mountainWeights', new THREE.BufferAttribute(mountainWeights, 3));

    for(let i = 0; i < uvs.length; i += 2) {
        uvs[i] *= (mapWidth - 1);
        uvs[i+1] *= (mapHeight - 1);
    }
    
    terrainGeo.computeVertexNormals();
    terrainHeightSamples = { positions, verticesW: vertsW, segmentsW, segmentsH, subdivisions: SUBDIVISIONS };

    // --- MATERIAL SPlAT COMPARTIDO POR TODO EL TERRENO ---
    const splatMaterial = new THREE.MeshPhongMaterial({ map: pastoTex, shininess: 0 }); // El map dummy activa USE_MAP
    splatMaterial.onBeforeCompile = function (shader) {
        shader.uniforms.tGrass = { value: pastoTex };
        shader.uniforms.tDirt = { value: tierraTex };
        shader.uniforms.tSand = { value: arenaTex };
        shader.uniforms.tMountain = { value: piedraTex };
        shader.uniforms.tRock = { value: rocaTex };
        shader.uniforms.tSnow = { value: nieveTex };
        shader.uniforms.tSlab = { value: losaTex };

        shader.vertexShader = `
            attribute vec4 splatWeights;
            attribute vec3 mountainWeights;
            varying vec4 vSplat;
            varying vec3 vMountain;
            ${shader.vertexShader}
        `.replace(
            `#include <uv_vertex>`,
            `#include <uv_vertex>
             vSplat = splatWeights;
             vMountain = mountainWeights;`
        );

        shader.fragmentShader = `
            uniform sampler2D tGrass;
            uniform sampler2D tDirt;
            uniform sampler2D tSand;
            uniform sampler2D tMountain;
            uniform sampler2D tRock;
            uniform sampler2D tSnow;
            uniform sampler2D tSlab;
            varying vec4 vSplat;
            varying vec3 vMountain;
            ${shader.fragmentShader}
        `.replace(
            `#include <map_fragment>`,
            `
            #ifdef USE_MAP
                vec4 texelGrass = texture2D(tGrass, vMapUv);
                vec4 texelDirt = texture2D(tDirt, vMapUv);
                vec4 texelSand = texture2D(tSand, vMapUv);
                vec4 texelBase = texture2D(tSlab, vMapUv);

                // Promedio ponderado de texturas
                vec4 blendedTexel = texelGrass * vSplat.x + texelDirt * vSplat.y + texelSand * vSplat.z + texelBase * vSplat.w
                    + texture2D(tMountain, vMapUv) * vMountain.x
                    + texture2D(tRock, vMapUv) * vMountain.y
                    + texture2D(tSnow, vMapUv) * vMountain.z;
                diffuseColor *= blendedTexel;
            #endif
            `
        );
    };

    const terrainSectors = createTerrainSectors(THREE, terrainGeo, splatMaterial, segmentsW, segmentsH);
    scene.add(terrainSectors);
    const slabCells = [];
    for (let z = 0; z < mapHeight; z++) for (let x = 0; x < mapWidth; x++) {
        if (floorMap[z][x] === 'OTHER' || slabGroundCells[z * mapWidth + x]) slabCells.push([x,z]);
    }
    const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, SLAB_HEIGHT, UNIT_SIZE),
        new THREE.MeshPhongMaterial({ map: losaTex, shininess: 0 }), slabCells.length);
    const slabTransform = new THREE.Object3D();
    slabCells.forEach(([x,z],index) => {
        const worldX=x*UNIT_SIZE, worldZ=z*UNIT_SIZE;
        const bottom=sampleTerrainHeight(worldX,worldZ,mapWidth,mapHeight,floorMap,elevationMap,woodFloorMap,mountainPathProfile,terrainHeightSamples);
        slabTransform.position.set(worldX,bottom+SLAB_HEIGHT/2,worldZ);
        slabTransform.updateMatrix();
        slabs.setMatrixAt(index,slabTransform.matrix);
        slabTops.set(z*mapWidth+x,bottom+SLAB_HEIGHT);
        if (slabGroundCells[z * mapWidth + x]) {
            const chest = solidInteractables.find(object => object.userData.type === 'CHEST' && object.userData.gx === x && object.userData.gz === z);
            if (chest) {
                chest.position.y = bottom + SLAB_HEIGHT - chest.geometry.boundingBox.min.y;
                chest.updateMatrixWorld(true);
            }
        }
    });
    slabs.name='slab-blocks';
    slabs.computeBoundingSphere();
    scene.add(slabs);
    terrainGeo.dispose(); // Los sectores conservan los atributos compartidos; la malla global ya no se dibuja.

    for (const definition of furniture) {
        if (!['BED', 'SIDE_TABLE', 'BARREL', 'BOOKSHELF', 'TABLE', 'CHAIR', 'WARDROBE', 'DESK', 'CRATE_STACK', 'SHELF', 'DRESSER', 'BARREL_STACK'].includes(definition.type)) continue;
        const { position, size } = definition;
        for (let z = position.z; z < position.z + size.z; z++) for (let x = position.x; x < position.x + size.x; x++) {
            if (!['INDOOR_FLOOR', 'WOOD'].includes(floorMap[z]?.[x])) throw new Error(`El mueble ${definition.id} requiere suelo interior en (${x},${z}).`);
        }
        const x = (position.x + (size.x - 1) / 2) * UNIT_SIZE + (definition.offset?.x ?? 0);
        const z = (position.z + (size.z - 1) / 2) * UNIT_SIZE + (definition.offset?.z ?? 0);
        const isBed = definition.type === 'BED';
        const model = new THREE.Mesh(isBed ? createBedGeometry(THREE) : definition.type === 'BARREL' ? createBarrelGeometry(THREE) : definition.type === 'BOOKSHELF' ? createBookshelfGeometry(THREE) : definition.type === 'TABLE' ? createTableGeometry(THREE) : definition.type === 'CHAIR' ? createChairGeometry(THREE) : definition.type === 'WARDROBE' ? createWardrobeGeometry(THREE) : definition.type === 'DESK' ? createDeskGeometry(THREE) : definition.type === 'CRATE_STACK' ? createCrateStackGeometry(THREE) : definition.type === 'SHELF' ? createShelfGeometry(THREE) : definition.type === 'DRESSER' ? createDresserGeometry(THREE) : definition.type === 'BARREL_STACK' ? createBarrelStackGeometry(THREE) : createSideTableGeometry(THREE), isBed ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0xd8ceb3, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0x40566b, shininess: 0 })
        ] : definition.type === 'BOOKSHELF' ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            ...[0x783d32, 0x354e65, 0x486044, 0xc5b78c].map(color => new THREE.MeshPhongMaterial({ color, shininess: 0 }))
        ] : [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: definition.type === 'CRATE_STACK' ? 0x55351f : 0x555555, shininess: 12 })
        ]);
        model.name = definition.id;
        model.rotation.y = definition.rotationY ?? 0;
        model.position.set(x, getTerrainHeight(x, z), z);
        model.userData = { type: definition.type, id: definition.id, gx: position.x, gz: position.z };
        scene.add(model);
        model.updateMatrixWorld(true);
        solidInteractables.push(model);
    }

    // Buscar punto de spawn seguro si POI no fue válido o se omitió
    let spawnSafe = false;
    for(let r = 0; r < 50; r++) {
        if(!isWall(playerStartX * UNIT_SIZE, playerStartZ * UNIT_SIZE)) {
            spawnSafe = true; break;
        }
        playerStartX++; // Mover a la derecha hasta salir de la pared
    }
    
    camera.position.set(playerStartX * UNIT_SIZE, PLAYER_HEIGHT, playerStartZ * UNIT_SIZE);
    
    const grahamX = grahamPosition.x * UNIT_SIZE;
    const grahamZ = grahamPosition.z * UNIT_SIZE;
    const grahamY = getTerrainHeight(grahamX, grahamZ) + (1.9 / 2);

    // Generar al NPC Graham como un Billboard 3D iluminable (MeshPhongMaterial)
    const grahamGeo = new THREE.PlaneGeometry(0.8, 1.9);
    const grahamMat = new THREE.MeshPhongMaterial({ 
        map: npcTex, 
        transparent: true, 
        alphaTest: 0.5, 
        side: THREE.DoubleSide,
        shininess: 0,
        color: 0xffffff,
        emissive: 0xffddaa,
        emissiveMap: npcTex,
        emissiveIntensity: 0
    });
    // Uso de la variable global grahamSprite
    grahamSprite = new THREE.Mesh(grahamGeo, grahamMat);
    grahamSprite.position.set(grahamX, grahamY, grahamZ);
    alignGrahamToFloor();
    grahamSprite.userData = { type: 'NPC' };
    scene.add(grahamSprite);
    interactables.push(grahamSprite);
    
    minimap.initialize(floorCanvas);
}


function alignGrahamToFloor() {
    if (!grahamSprite || !npcTex.image) return;
    const image = npcTex.image;
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    let bottom = image.height - 1;
    scan: for (let row = image.height - 1; row >= 0; row--) {
        for (let col = 0; col < image.width; col++) {
            if (pixels[(row * image.width + col) * 4 + 3] >= 128) { bottom = row; break scan; }
        }
    }
    grahamSprite.position.y = getTerrainHeight(grahamSprite.position.x, grahamSprite.position.z) + 1.9 * ((bottom + 1) / image.height - 0.5);
}

function getTerrainHeight(x, z) {
    const gx=Math.floor((x+UNIT_SIZE/2)/UNIT_SIZE),gz=Math.floor((z+UNIT_SIZE/2)/UNIT_SIZE);
    const top=slabTops.get(gz*mapWidth+gx);
    if(gx>=0&&gz>=0&&gx<mapWidth&&gz<mapHeight&&top!==undefined) return top;
    return sampleTerrainHeight(x, z, mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap, mountainPathProfile, terrainHeightSamples);
}

// --- COLISIONES ---
function isWall(x, z) {
    return hasObstacle(x, z, mapWidth, mapHeight, collisionMap, floorMap, isRidingBoat, solidInteractables);
}

function moveBoatAxis(position, axis, distance) {
    // Revisar el trayecto evita atravesar una orilla estrecha en un cuadro largo.
    const steps=Math.max(1,Math.ceil(Math.abs(distance)/0.2));
    const step=distance/steps;
    for(let i=0;i<steps;i++) {
        const next=position[axis]+step;
        if(isWall(axis==='x'?next:position.x,axis==='z'?next:position.z)) return false;
        position[axis]=next;
    }
    return true;
}


// --- BUCLE PRINCIPAL ---
const clock = new THREE.Clock();
let bobTimer = 0;
let bobCadence = 1;
let footstepIndex = 0;

let stamina = STAMINA_MAX;

window.restartGame = () => {
    isDead = false;
    stamina = STAMINA_MAX;
    const controlObj = controls.getObject();
    controlObj.position.set(playerStartX * UNIT_SIZE, PLAYER_HEIGHT, playerStartZ * UNIT_SIZE);
    hud.hideDeath();
    hud.hideStamina();
    controls.lock();
};

function animate() {
    requestAnimationFrame(animate);

    const controlObj = controls.getObject();

    if (grahamSprite) {
        grahamSprite.rotation.y = Math.atan2(controlObj.position.x - grahamSprite.position.x, controlObj.position.z - grahamSprite.position.z);
    }
    skyMesh.position.set(controlObj.position.x, 200, controlObj.position.z);
    daySkyMesh.position.y = controlObj.position.y - 200;
    nightSkyMesh.position.y = dawnSkyMesh.position.y = duskSkyMesh.position.y = daySkyMesh.position.y; // Horizonte del atlas a la altura de los ojos.

    if (controls.isLocked && mapLoaded) {
        const delta = Math.min(clock.getDelta(), 0.1);
        musicEvents.update(delta);
        vegetationWindTime.value += delta;
        // Girar ambos cubos a la misma velocidad; la luna conserva su orientación.
        nightSkyMesh.rotation.y = (nightSkyMesh.rotation.y + NIGHT_SKY_ROTATION_SPEED * delta) % (Math.PI * 2);
        daySkyMesh.rotation.y = nightSkyMesh.rotation.y;
        dawnSkyMesh.rotation.y = duskSkyMesh.rotation.y = nightSkyMesh.rotation.y;

        // Lógica de mirada a la luna (Easter Egg)
        if (typeof moonSprite !== 'undefined') {
            const camDir = frameCameraDirection;
            camera.getWorldDirection(camDir);
            
            const moonPos = frameMoonPosition;
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
                // Avanzar ciclo: cada fase dura 0.8s (delta * (1.0 / 0.8))
                moonCycle += delta * (1.0 / 0.8);

                let glowOp = 0;
                let azulOp = 0;

                if (moonCycle < 15.0) {
                    // Fase 1: Ciclo de 3 sprites (Luna_B -> Luna_glow -> Luna_azul -> Luna_glow -> Luna_B)
                    // Se ejecuta durante 4 parpadeos (en el 4to parpadeo culmina en Luna_glow a los 15.0s)
                    const subCycle = moonCycle % 4.0;
                    if (subCycle < 1.0) {
                        glowOp = subCycle;
                    } else if (subCycle < 2.0) {
                        glowOp = 1.0;
                        azulOp = subCycle - 1.0;
                    } else if (subCycle < 3.0) {
                        glowOp = 1.0;
                        azulOp = 3.0 - subCycle;
                    } else {
                        glowOp = 4.0 - subCycle;
                    }
                } else {
                    // Fase 2: Después de 4 parpadeos, pasar a ciclo de 2 sprites: solo luna con glow y luna azul
                    glowOp = 1.0;
                    const twoCycle = (moonCycle - 15.0) % 2.0;
                    if (twoCycle < 1.0) {
                        azulOp = twoCycle;
                    } else {
                        azulOp = 2.0 - twoCycle;
                    }
                }

                // Suavizado sine-ease-in-out para que las transiciones sean orgánicas
                const smoothGlow = (Math.sin(glowOp * Math.PI - Math.PI / 2) + 1.0) / 2.0;
                const smoothAzul = (Math.sin(azulOp * Math.PI - Math.PI / 2) + 1.0) / 2.0;

                moonGlowOpacity = smoothGlow;
                moonAzulOpacity = smoothAzul;
            } else {
                // Volver a reposo rápidamente si el jugador deja de mirar a la luna
                moonCycle = 0.0;
                if (moonGlowOpacity > 0.0) {
                    moonGlowOpacity = Math.max(0.0, moonGlowOpacity - delta * 2.0);
                }
                if (moonAzulOpacity > 0.0) {
                    moonAzulOpacity = Math.max(0.0, moonAzulOpacity - delta * 2.0);
                }
            }
            
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

        // La misión controla las pausas iniciales; luego el reloj funciona normalmente.
        dayNightTimer = questSkyCycle.update(skyCycle.transitioning ? 0 : delta, heartQuest.stage, musicEvents.hasEventStarted('forest'));
        if (!skyCycle.transitioning) targetDayState = dayNightTimer < SKY_CYCLE_TIMING.nightStart;
        dayTransition=skyCycle.update(delta,true,dayNightTimer);
        const moonOpacity=1-0.6*dayTransition;
        moonMat.opacity=moonOpacity;
        moonGlowMat.opacity=moonGlowOpacity*moonOpacity;
        moonAzulMat.opacity=moonAzulOpacity*moonOpacity;
        const weights=skyCycle.weights;
        if (weights.dawn>0) musicEvents.trigger('morning');
        const sunAngle=Math.PI*skyCycle.sunProgress;
        sunSprite.position.set(0,controlObj.position.y-200+Math.sin(sunAngle)*580,-Math.cos(sunAngle)*580);
        sunMat.opacity=weights.day+weights.dawn+weights.dusk;
        sunSprite.visible=sunMat.opacity>0.001;
        // Alfa acumulada: el resultado contiene exactamente la mezcla de los cuatro estados.
        nightMaterials.forEach(m=>{m.opacity=1;});
        let accumulated=weights.night;
        accumulated+=weights.dawn;
        dawnSkyMesh.material.opacity=accumulated?weights.dawn/accumulated:0;
        accumulated+=weights.dusk;
        duskSkyMesh.material.opacity=accumulated?weights.dusk/accumulated:0;
        accumulated+=weights.day;
        dayMaterials.forEach(m=>{m.opacity=accumulated?weights.day/accumulated:0;});

        // Interpolar Iluminación Global y Niebla
        updateFogColor();

        ambientLight.color.lerpColors(nightAmbientColor, dayAmbientColor, dayTransition);
        ambientLight.intensity = 0.2 + (0.6 * dayTransition); // De 0.2 a 0.8

        dirLight.color.lerpColors(nightDirColor, dayDirColor, dayTransition);
        dirLight.intensity = 0.3 + (0.7 * dayTransition); // De 0.3 a 1.0

        // Raycaster para Interacciones
        raycaster.setFromCamera(centerVec, camera);
        interactionHits.length = 0;
        const intersects = raycaster.intersectObjects(interactables, true, interactionHits);
        
        if (intersects.length > 0 && intersects[0].distance < 3.5) {
            targetInteractable = intersects[0].object;
            hud.showInteraction();
            if (targetInteractable.userData.type === 'CHEST') {
                hud.setInteractionText("Presiona E para abrir Cofre");
            } else if (targetInteractable.userData.type === 'BOAT') {
                hud.setInteractionText("Presiona E para usar Bote");
                hud.setInteractionColor("#00ffff");
            } else if (targetInteractable.userData.type === 'NPC') {
                if (!isDialogOpen) {
                    hud.setInteractionText("Presiona E para hablar");
                    hud.setInteractionColor("#ffeb3b");
                } else {
                    hud.hideInteraction(); // Ocultar mensaje genérico si está en diálogo
                }
            } else if (targetInteractable.userData.type === 'DOOR') {
                if (targetInteractable.userData.locked) {
                    hud.setInteractionText(keys > 0 ? "Presiona E para usar Llave" : "Necesitas una Llave");
                    hud.setInteractionColor(keys > 0 ? "#55ff55" : "#ff5555");
                } else {
                    hud.setInteractionText(targetInteractable.userData.isOpen ? "Presiona E para Cerrar" : "Presiona E para Abrir");
                    hud.setInteractionColor("#ffeb3b");
                }
            }
        } else {
            targetInteractable = null;
            hud.hideInteraction();
            if (isDialogOpen) {
                isDialogOpen = false;
                menus.hideDialog();
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
            if (['WATER', 'WATER_ROCK', 'BOAT'].includes(floorMap[currentGZ][currentGX])) inWater = true;
        }

        const waterSpeedMod = isRidingBoat ? 1.5 : (inWater ? 0.4 : 1.0);
        const movementMultiplier = isFlying
            ? (isRunning ? FLIGHT_SPRINT_MULTIPLIER : FLIGHT_MULTIPLIER)
            : (isRunning ? SPRINT_MULTIPLIER : 1);

        if (moveState.forward || moveState.backward) velocity.z -= direction.z * MOVEMENT_SPEED * movementMultiplier * waterSpeedMod * delta;
        if (moveState.left || moveState.right) velocity.x -= direction.x * MOVEMENT_SPEED * movementMultiplier * waterSpeedMod * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        const dx = controlObj.position.x - startX;
        const dz = controlObj.position.z - startZ;

        controlObj.position.x = startX;
        controlObj.position.z = startZ;

        if (isFlying) {
            controlObj.position.x += dx;
            controlObj.position.z += dz;
            if (moveState.up) controlObj.position.y += MOVEMENT_SPEED * movementMultiplier * delta;
            if (moveState.down) controlObj.position.y -= MOVEMENT_SPEED * movementMultiplier * delta;
            
            velocityY = 0;
            stamina = STAMINA_MAX;
            hud.hideStamina();
        } else {
            if (isRidingBoat) {
                if(!moveBoatAxis(controlObj.position,'x',dx)) velocity.x=0;
                if(!moveBoatAxis(controlObj.position,'z',dz)) velocity.z=0;
            } else {
                if (!isWall(startX + dx, startZ)) controlObj.position.x += dx; else velocity.x = 0;
                if (!isWall(controlObj.position.x, startZ + dz)) controlObj.position.z += dz; else velocity.z = 0;
            }

            if (inWater && !isRidingBoat) {
                hud.showStamina();
                stamina -= delta;
                if (stamina <= 0) {
                    isDead = true;
                    controls.unlock();
                    hud.showDeath();
                    return; 
                }
            } else {
                if (stamina < STAMINA_MAX) {
                    stamina += delta;
                    if (stamina >= STAMINA_MAX) {
                        stamina = STAMINA_MAX;
                        hud.hideStamina();
                    }
                }
            }
            
            hud.updateStamina(stamina, STAMINA_MAX);
        }

        const currentTerrainHeight = getTerrainHeight(controlObj.position.x, controlObj.position.z);
        let targetEyesHeight = (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT) + currentTerrainHeight;
        
        if (isRidingBoat && boatReference) {
            targetEyesHeight = BOAT_FLOAT_HEIGHT + boatReference.geometry.parameters.height / 2 + (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT);
        } else if (inWater) {
            // Caminar por el fondo somero; flotar solo al alcanzar suficiente profundidad.
            targetEyesHeight = Math.max(targetEyesHeight, WATER_SURFACE_HEIGHT + 0.2);
        }

        if (isFlying && controlObj.position.y < targetEyesHeight) {
            controlObj.position.y = targetEyesHeight;
        }

        if (!isFlying) {
            // Seguir pendientes continuas estando apoyado, sin quedarse bajo la superficie al subir.
            if (canJump && velocityY <= 0 && Math.abs(controlObj.position.y - targetEyesHeight) < 0.8) {
                controlObj.position.y = targetEyesHeight;
            }
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
                const passageHeight = ['DOOR_UNLOCKED','DOOR_LOCKED'].includes(currentFloor) ? DOOR_HEIGHT : WALL_HEIGHT;
                const ceilingMaxHeight = currentTerrainHeight + passageHeight - 0.3; // Margen para la cámara
                if (controlObj.position.y > ceilingMaxHeight) {
                    controlObj.position.y = ceilingMaxHeight;
                    if (velocityY > 0) velocityY = 0;
                }
            }
        }

        const speed = Math.sqrt(velocity.x**2 + velocity.z**2);
        if (!isFlying) {
            if (speed > 1.0 && canJump && !isRidingBoat) {
                const previousBob = bobTimer;
                bobTimer += delta * (isRunning ? 16.9 : 8.0) * bobCadence;
                controlObj.position.y = targetEyesHeight + Math.sin(bobTimer) * 0.04;
                // Un golpe al cruzar el punto más bajo; sigue la cadencia del balanceo.
                const trough = Math.PI * 1.5;
                const previousStep = Math.floor((previousBob - trough) / (Math.PI * 2));
                const currentStep = Math.floor((bobTimer - trough) / (Math.PI * 2));
                const moved = Math.hypot(controlObj.position.x-startX,controlObj.position.z-startZ)>0.0001;
                if (currentStep > previousStep && moved && !inWater) {
                    const accented = footstepIndex % 2 === 0;
                    const accent = accented ? 1 : (isRunning ? 0.92 : 0.8);
                    const variation = isRunning ? 0.98 + Math.random() * 0.04 : 0.95 + Math.random() * 0.1;
                    musicEvents.playFootstep(isRunning, accent * variation);
                    footstepIndex++;
                    // Intervalos largos/cortos ligeramente distintos en cada pareja.
                    bobCadence = isRunning
                        ? (accented ? 0.97 : 1.03) * (0.985 + Math.random() * 0.03)
                        : (accented ? 0.9 : 1.08) * (0.96 + Math.random() * 0.08);
                }
            } else if (canJump) {
                bobTimer = 0;
                bobCadence = 1;
                controlObj.position.y += (targetEyesHeight - controlObj.position.y) * 10 * delta;
            }
        }

        if (isRidingBoat && boatReference) {
            boatReference.position.set(controlObj.position.x, BOAT_FLOAT_HEIGHT, controlObj.position.z);
        }
        frameCameraHeading.setFromQuaternion(camera.quaternion, 'YXZ');
        minimap.updatePosition(controlObj.position.x, controlObj.position.z, mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE, -frameCameraHeading.y);
        
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
        waterWaveTime.value = time;
        const frame = Math.floor(time * 1) % 3; // 1 frame por segundo
        if (frame === 0) aguaFloorMat.map = agua1Tex;
        else if (frame === 1) aguaFloorMat.map = agua2Tex;
        else aguaFloorMat.map = agua3Tex;
    }

    for (const sprite of torchSprites) {
        if (sprite.material.userData.flameStrength) sprite.material.userData.flameStrength.value = 1 - dayTransition;
    }
    if (torchLighting) torchLighting.update(controlObj.position, performance.now() / 1000, dayTransition);
    if (torchLighting && grahamSprite) {
        // Relleno según luz local: el plano del NPC no debe oscurecerse al girar de espaldas a la llama.
        grahamSprite.material.emissiveIntensity = Math.min(0.225, torchLighting.illuminationAt(grahamSprite.position) * 0.06);
    }
    if (vegetationSectors) vegetationSectors.update(camera);
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
