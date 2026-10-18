import { createBeachPlankTableGeometry, createRusticBeachChairGeometry } from './src/world/rustic-beach-furniture.js';
import { createHeldMate } from './src/player/held-mate.js';
import { createWoodcutting } from './src/systems/woodcutting.js';
import { createWoodcuttingHud } from './src/ui/woodcutting.js';
import { createAtticAnt, findAtticAntHome } from './src/world/attic-ant.js';
import { createGrahamDap } from './src/systems/graham-dap.js';
import { createWoodStoveGeometry, createWoodStovePipeGeometry } from './src/world/wood-stove-geometry.js';
import { prepareInactiveLights } from './src/world/inactive-lights.js';
import { getTerrainTextureBlend } from './src/world/terrain-textures.js';
import { createPerformancePanel } from './src/ui/performance-panel.js';

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { UNIT_SIZE, WALL_HEIGHT, DOOR_HEIGHT, DOOR_THICKNESS, VEGETATION_HEIGHT, TREE_SPRITE_SCALE, TREE_SPRITE_HEIGHT, TORCH_MOUNT_HEIGHT, NIGHT_SKY_ROTATION_SPEED, MANUAL_SKY_TRANSITION_SECONDS, WATER_SURFACE_HEIGHT, BOAT_FLOAT_HEIGHT, BOAT_WIDTH, PLAYER_HEIGHT, GRAHAM_HEIGHT, FURNITURE_SCALE, MOVEMENT_SPEED, FRICTION, COLLISION_RADIUS, SPRINT_MULTIPLIER, GRAVITY, JUMP_FORCE, STAMINA_MAX } from './src/config.js';
import { npcDialogs, heartSearchDialogs, heartDeliveryDialogs, heartDeliveredDialogs, grahamWakeGreetings, atticAntDialogs, mateOfferDialogs } from './src/content/dialogues.js';
import { entities, grahamPosition, spawnRoomExit, kitchenGardenPosition, shipwreckProps, sunkenShip, divingHelmet, keyBindings, seaHeartAltar } from './src/content/entities.js';
import { createSpawnGreeting } from './src/systems/spawn-greeting.js';
import { createHeartPull } from './src/systems/heart-pull.js';
import { DOOR_SIDE_MARGIN } from './src/config.js';
import { createSunkenShipGeometry } from './src/world/sunken-ship-geometry.js';
import { createShipwreckGeometry } from './src/world/shipwreck-geometry.js';
import { createLogStackGeometry } from './src/world/log-stack-geometry.js';
import { createWorkbenchGeometry } from './src/world/workbench-geometry.js';
import { createStumpGeometry } from './src/world/stump-geometry.js';
import { createEntityRegistry } from './src/world/entity-registry.js';
import { createForestHeartQuest } from './src/systems/forest-heart.js';
import { loadMapImage, readMapLayers } from './src/world/map-loader.js';
import { prepareMap } from './src/world/map-data.js';
import { getBedSupport } from './src/player/bed-support.js';
import { createAtticSupport, BED_CEILING_OPENING } from './src/player/attic-support.js';
import { focusLoadingSpawn, finishLoadingZoom } from './src/ui/loading-screen.js';
import { createMinimap } from './src/ui/minimap.js';
import { createMenus } from './src/ui/menus.js';
import { createHud } from './src/ui/hud.js';
import { bindKeyboard } from './src/input/keyboard.js';
import { requestGamePointerLock, guardPointerLockMouse } from './src/input/pointer-lock.js';
import { isTouchMode } from './src/input/touch-mode.js';
import { bindTouchControls } from './src/input/touch-controls.js';
import { getTerrainVertexY, getTerrainHeight as sampleTerrainHeight } from './src/world/terrain-height.js';
import { isWall as hasObstacle } from './src/player/collisions.js';
import { toggleDoor, unlockDoor, updateDoorAnimations } from './src/systems/doors.js';
import { createWoodFloorMap, createWaterDeckMap, createWaterDeckTerrain, levelBuildingAtTerrain, createWetSandShoreMap } from './src/world/surfaces.js';
import { createTorchLighting } from './src/systems/torch-lighting.js';
import { createMountainHeights } from './src/world/mountain-height.js';
import { createMountainReliefMap } from './src/world/mountain-relief.js';
import { MOUNTAIN_PROFILE_REFERENCE } from './src/content/mountain-relief.js';
import { smoothMountainPath } from './src/world/mountain-path.js';
import { createRoofBaseMap } from './src/world/roof-height.js';
import { getDoorOpening } from './src/world/door-opening.js';
import { smoothMountainSlope } from './src/world/mountain-slope.js';
import { createBoatGeometry } from './src/world/boat-geometry.js';
import { updateBoatFloating } from './src/world/boat-floating.js';
import { steerBoat } from './src/world/boat-steering.js';
import { applyVegetationWind } from './src/world/vegetation-wind.js';
import { createHeartVision } from './src/world/heart-vision.js';
import { createHeartHalos } from './src/world/heart-halos.js';
import { createHeartLevitation, HEART_LEVITATION_MAX_RISE } from './src/systems/heart-event-timing.js';
import { applyWaterWaves } from './src/world/water-waves.js';
import { CAVE_ENTRY, createCaveEntrance } from './src/world/cave-entrance.js';
import { loadCaveTestMap } from './src/world/cave-test-map.js';
import { createUnderwaterView } from './src/world/underwater-view.js';
import { createUnderwaterVegetation } from './src/world/underwater-vegetation.js';
import { createVegetationVisibility } from './src/world/vegetation-visibility.js';
import { createSeaFloorHeights } from './src/world/sea-depth.js';
import { createRiverCurrentField } from './src/world/river-current.js';
import { createChestGeometry, createChestOpening } from './src/world/chest-geometry.js';
import { createDryVineShrine } from './src/world/dry-vine-geometry.js';
import { GRAHAM_BRIDGE_KEY_AVAILABLE } from './src/config.js';
import { FLIGHT_MULTIPLIER, FLIGHT_SPRINT_MULTIPLIER, FLIGHT_VERTICAL_MULTIPLIER } from './src/config.js';
import { bridgeKeyDeliveryDialogs, bridgeKeyReceivedDialogs } from './src/content/dialogues.js';
import { pushPlayerFromMovingDoors } from './src/player/door-push.js';
import { createTerrainSectors } from './src/world/terrain-sectors.js';
import { createInstanceSectors } from './src/world/instance-sectors.js';
import { createFogCulling } from './src/world/fog-culling.js';
import { mergeRoofBlocks } from './src/world/roof-blocks.js';
import { createBedGeometry } from './src/world/bed-geometry.js';
import { createSideTableGeometry } from './src/world/side-table-geometry.js';
import { createBarrelGeometry } from './src/world/barrel-geometry.js';
import { createBookshelfGeometry } from './src/world/bookshelf-geometry.js';
import { createTableGeometry, createChairGeometry } from './src/world/table-chair-geometry.js';
import { createMateSet } from './src/world/mate-set.js';
import { createAntiqueStoveGeometry } from './src/world/antique-stove-geometry.js';
import { createSpiceShelfGeometry } from './src/world/spice-shelf-geometry.js';
import { createKitchenGarden } from './src/world/kitchen-garden.js';
import { createWoodFenceGeometry } from './src/world/wood-fence.js';
import { createWardrobeGeometry } from './src/world/wardrobe-geometry.js';
import { createDeskGeometry } from './src/world/desk-geometry.js';
import { createCrateStackGeometry } from './src/world/crate-stack-geometry.js';
import { createShelfGeometry } from './src/world/shelf-geometry.js';
import { createDresserGeometry } from './src/world/dresser-geometry.js';
import { createBarrelStackGeometry } from './src/world/barrel-stack-geometry.js';
import { createSkyAtlas } from './src/world/sky-atlas.js';
import { createSkyCycle, SKY_CYCLE_TIMING } from './src/world/sky-cycle.js';
import { musicEvents } from './src/systems/music-events.js';
import { createWalkingRhythm } from './src/systems/walking-rhythm.js';
import { createKeyInventory } from './src/systems/key-inventory.js';
import { createDivingAir } from './src/systems/diving-air.js';
import { DIVING_AIR_SECONDS, DIVING_WATER_SPEED_MOD, SEA_FLOOR_HEIGHT } from './src/config.js';
import { createDivingHelmetGeometry } from './src/world/diving-helmet-geometry.js';
import { createSeaHeart } from './src/systems/sea-heart.js';
import { createQuestSkyCycle } from './src/systems/quest-sky.js';
import { createSunFlare } from './src/world/sun-flare.js';
import { furniture, doorOverrides, mapCellOverrides } from './src/content/entities.js';

const minimap = createMinimap();
const hud = createHud();

// --- CONFIGURACIÓN DEL JUEGO ---

// Físicas verticales
let velocityY = 0;
const NORMAL_JUMP_TIME_SCALE = 0.85;
const WATER_GRAVITY_SCALE = 0.6;
const WATER_FALL_GRAVITY_SCALE = 0.32;
let canJump = true;
const BED_BOUNCE_BASE_IMPULSE = 5.5;
const BED_BOUNCE_MAX_IMPULSE = 20;
const BED_BOUNCE_AFTER_IMPACT_GAIN = 4;
const BED_BOUNCE_INITIAL_TIME_SCALE = 0.45;
const BED_CEILING_HITS_TO_BREAK = 6;
let bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
let bedBounceHitCeiling = false;
let bedBounceActive = false;
let bedCeilingHits = 0;
let jumpHeld = false;
const TOUCH_JUMP_REPEAT_PAUSE = 0.08;
let touchJumpRepeatWait = 0;
let bedCeilingTimer = 0;
let bedCeilingHoleOpen = false;
let bedCeilingHoleTile = null;
const bedRoofPieces = new Map();
const bedFalseCeilingPieces = new Map();
let bedHoleRim = null;
let atticSupport = null;
const bedDefinition = furniture.find(item => item.id === 'graham-bed');
let isCrouching = false;
let crouchRequested = false;
let isRunning = false;

// Inventario e Interacciones
let keys = 0;
const keyInventory = createKeyInventory(keyBindings);
let heldItem = null;
let heldItemSprite = null;
let heldHeartGlow = null;
let heldItemTextures = null;
let hasTorch = false;
let hasMap = false;
let hasMate = false, heldMate = null;
let hasDivingHelmet = false;
let helmetEquipped = false;
let helmetBroken = false;
let seaHeart = null;
const seaHeartSprites = new Map();
const seaHeartSoundPosition = new THREE.Vector3();
const seaHeartSoundRelative = new THREE.Vector3();
const seaHeartListenerPosition = new THREE.Vector3();
const seaHeartListenerRotation = new THREE.Quaternion();
let seaHeartLight = null;
let altarWaterHeight = null;

function revealNextSeaHeartFragment() {
    const next = seaHeart?.next;
    for (const [id, sprite] of seaHeartSprites) {
        const active = id === next?.id;
        if (active && sprite.userData.visibilityEnabled !== true) {
            sprite.userData.haloStartedAt = underwaterViewTime.value;
            sprite.userData.haloWaitingForDive = next.number === 1;
            sprite.children[0]?.scale.set(18.75 * 0.15,18.75 * 0.15,1);
        }
        sprite.userData.visibilityEnabled = active;
        sprite.visible = active;
        const index = interactables.indexOf(sprite);
        if (active && index < 0) interactables.push(sprite);
        else if (!active && index >= 0) interactables.splice(index,1);
    }
    const activeSprite = next && seaHeartSprites.get(next.id);
    // Al completar la ruta conserva la posición del último fragmento (altar).
    if (activeSprite) seaHeartSoundPosition.copy(activeSprite.position);
    if (seaHeartLight) {
        seaHeartLight.intensity = activeSprite ? 2.4 : 0;
        if (activeSprite) {
            seaHeartLight.position.copy(activeSprite.position);
            seaHeartLight.position.y += 0.4;
        }
    }
}

function collectSeaHeartFragment(fragment) {
    if (!fragment || !helmetEquipped || helmetBroken || isDead || !controls.isLocked) return;
    const reward = seaHeart.collect(fragment.userData.id);
    if (!reward) return;
    divingAir.replenish(reward.airSeconds);
    if (reward.count === 1) musicEvents.trigger('underwater');
    const index = interactables.indexOf(fragment);
    if (index >= 0) interactables.splice(index,1);
    fragment.traverse(object => fogCulling?.unregister(object));
    scene.remove(fragment);
    seaHeartSprites.delete(fragment.userData.id);
    fragment.material.dispose();
    revealNextSeaHeartFragment();
    if (targetInteractable === fragment) targetInteractable = null;
    hud.hideInteraction();
    menus.setSeaHeartState(reward.count,reward.complete);
    if (reward.complete) {
        for (const flame of altarFlames) {
            flame.userData.visibilityEnabled = true;
            flame.visible = true;
        }
        for (const torch of altarFireTorches) torch.enabled = true;
        helmetBroken = true;
        helmetEquipped = false;
        menus.setHelmetState(true,false,true);
        hud.hideDivingAir();
        hud.showReceivedItem('el Corazón del Mar. La escafandra se ha roto');
    } else {
        hud.showReceivedItem(`un fragmento del Corazón del Mar (${reward.count}/10). Aire renovado: ${reward.airSeconds} s`);
    }
}
const divingAir = createDivingAir(DIVING_AIR_SECONDS);
const heartQuest = createForestHeartQuest();
const interactables = [];
const chestOpenings = [];
let forestHeartShrine = null;
const heartBeaconPosition = new THREE.Vector3();
const heartBeaconCameraRotation = new THREE.Quaternion();
const slabTops = new Map();
const SLAB_HEIGHT = 0.4;
const WATER_DECK_THICKNESS = 0.25;
const solidInteractables = []; // Incluye cofres abiertos y hojas de puerta en su posición actual.
const worldTorches = [];
let torchLighting = null;
const torchSprites = [];
const altarFlames = [];
const altarFireTorches = [];
let underwaterVegetation = null;
let underwaterVegetationPreparation = null;
let underwaterPlantDefinitions = [];
let vegetationBlend = 0;
let surfaceVegetationFade = null;
let underwaterVegetationFade = null;
let surfaceVegetationBlend = 1;
const SURFACE_VEGETATION_RETURN_HEIGHT = -2.5;
let altarFlameTime = 0;
const vegetationWindTime = { value: 0 };
const heartVision = createHeartVision();
let heartHalos = null;
const heartLevitation = createHeartLevitation();
let heartLevitationHeight = 0;
const waterWaveTime = { value: 0 };
const raisedWaterCell = {value:new THREE.Vector4()};
let vegetationSectors = null;
let structureSectors = null;
let fogCulling = null;
let grahamSprite = null;
let targetInteractable = null;
let isRidingBoat = false;
let boatReference = null;
const boats = [];
let boatFloatTime = 0;
const BOAT_EYE_OFFSET = 0.70;
const BOAT_SEAT_BACK_OFFSET = 0.70;
const boatSeatOffset = new THREE.Vector3();

function getBoatEyesHeight(boat) {
    return boat.position.y + boat.geometry.parameters.height / 2
        + (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT) - BOAT_EYE_OFFSET;
}

let isDialogOpen = false;
let dialogIndex = 0;
let activeDialogs = npcDialogs;
let activeDialogSpeaker = 'Graham';
let deliveringHeart = false;

// --- SETUP DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14); // Noche azulada lúgubre
const WORLD_VISIBILITY_DISTANCE = 300;
const MOUNTAIN_VISIBILITY_DISTANCE = 600;
const FOG_RESIDUAL = 0.0001;
let underwaterBlend = 0;
let playerWasSubmerged = false;
const underwaterStrength = {value:0};
const underwaterViewTime = {value:0};
const underwaterFogColor = new THREE.Color(0x0979b0);
const underwaterCurrentColor = underwaterFogColor.clone();
let underwaterLightLevel = 1;
const UNDERWATER_VISIBILITY_DISTANCE = 80;
const UNDERWATER_PLANT_DISTANCE = UNDERWATER_VISIBILITY_DISTANCE / 1.3;
scene.fog = new THREE.FogExp2(0x030304, Math.sqrt(-Math.log(FOG_RESIDUAL)) / WORLD_VISIBILITY_DISTANCE);

// Iluminación Dark Fantasy (Noche de Luna)
const ambientLight = new THREE.AmbientLight(0x11111a, 0.2); // Luz ambiental suave (más oscura)
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0x445577, 0.3); // Luz de luna (más oscura)
dirLight.position.set(-1, 1, 0.5);
scene.add(dirLight);

let skyMesh;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
scene.add(camera);
const underwaterBackdrop = new THREE.Mesh(new THREE.SphereGeometry(100, 8, 6),
    new THREE.MeshBasicMaterial({color:underwaterFogColor,side:THREE.BackSide,transparent:true,opacity:0,fog:false,depthWrite:false}));
underwaterBackdrop.renderOrder = -0.5;
underwaterBackdrop.visible = false;
camera.add(underwaterBackdrop);

// Luz de Antorcha (Faltaba definirla, causaba el crash)
const torchLight = new THREE.PointLight(0xff8800, 0, 45, 1.0);
let handTorchEnabled = false;
let handTorchFlickerTime = 0;
torchLight.visible = true; // Apagar por intensidad, manteniendo estable el shader de luces.
torchLight.position.set(1.0, 0.2, -0.5); // Posicionada más alta y movida en X
camera.add(torchLight);
function setHandTorchEnabled(enabled) {
    if (enabled && isPlayerUnderwater()) enabled = false;
    handTorchEnabled = enabled;
    menus.setItemActive('torch', enabled);
    torchLight.intensity = enabled ? 8 : 0;
}
function isPlayerUnderwater() {
    const gx = Math.floor((camera.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
    const gz = Math.floor((camera.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
    return camera.position.y < getWaterSurfaceHeight(camera.position.x,camera.position.z)
        && ['WATER','WATER_ROCK','BOAT'].includes(floorMap[gz]?.[gx]);
}
function getWaterSurfaceHeight(x,z) {
    const gx=Math.floor((x+UNIT_SIZE/2)/UNIT_SIZE),gz=Math.floor((z+UNIT_SIZE/2)/UNIT_SIZE);
    return altarWaterHeight!==null && gx===seaHeartAltar.center.x && gz===seaHeartAltar.center.z
        ? altarWaterHeight : WATER_SURFACE_HEIGHT;
}

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
    underwaterLightLevel = day + night * 0.15 + dusk * 0.5 + dawn * 0.6;
    underwaterCurrentColor.copy(underwaterFogColor).multiplyScalar(underwaterLightLevel);
    scene.fog.color.lerp(underwaterCurrentColor, underwaterBlend);
    scene.fog.density = THREE.MathUtils.lerp(
        Math.sqrt(-Math.log(FOG_RESIDUAL))/WORLD_VISIBILITY_DISTANCE,
        Math.sqrt(-Math.log(FOG_RESIDUAL))/UNDERWATER_VISIBILITY_DISTANCE * 1.3, underwaterBlend);
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
const performancePanel = createPerformancePanel(renderer);
const underwaterView = createUnderwaterView(THREE,renderer,underwaterStrength,underwaterViewTime);

const controls = new PointerLockControls(camera, document.body);
if (isTouchMode) controls.disconnect();
else {
    guardPointerLockMouse(controls);
    controls.lock=()=>requestGamePointerLock(document.body).catch(()=>{});
}
function resumeGame() {
    if (isDead || !mapLoaded) return;
    if (isTouchMode) {
        musicEvents.unlock();
        controls.isLocked = true;
        controls.dispatchEvent({ type: 'lock' });
    } else controls.lock();
}
function pauseGame() {
    if (!controls.isLocked) return;
    if (isTouchMode) {
        controls.isLocked = false;
        controls.dispatchEvent({ type: 'unlock' });
    } else controls.unlock();
}
// Permitimos mirar hacia todas partes
// controls.minPolarAngle = Math.PI / 2; 
// controls.maxPolarAngle = Math.PI / 2;

const loadingScreen = document.getElementById('loading-screen');
const mainMenu = document.getElementById('main-menu');
const menus = createMenus({ onResume: resumeGame, onUseItem: useInventoryItem });
let dapPointerSpeed = 1;
const grahamDap = createGrahamDap(THREE, {
    onImpact: () => musicEvents.playDap(),
    onFinish() {
        controls.pointerSpeed = dapPointerSpeed; clearGreetingInput();
        if (deliveringHeart) {
            menus.setHeartVisible(false);
            if (heldItem === 'heart') setHeldItem(null);
        }
        if (isDialogOpen) { dialogIndex++; showActiveDialog(); }
    },
    onCancel: () => musicEvents.stopDap()
});
let mapChestSoundSource = null;
const mapChestSoundPosition = new THREE.Vector3();
function getMapChestSoundPosition() {
    mapChestSoundSource.getWorldPosition(mapChestSoundPosition);
    return camera.worldToLocal(mapChestSoundPosition);
}
function openMapChestAfterThanks() {
    const chest = interactables.find(object => object.userData.id === 'island-map-chest');
    if (!chest || chest.userData.opened || !heartQuest.unlockMapChest()) return;
    mapChestSoundSource = chest;
    musicEvents.playChestUnlock(getMapChestSoundPosition());
    const pickup = chest.userData.mapPickup;
    const enablePickup = () => {
        if (pickup && !hasMap && !interactables.includes(pickup)) interactables.push(pickup);
    };
    if (pickup) {
        pickup.userData.visibilityEnabled = true;
        pickup.visible = true;
    }
    if (chest.userData.opening) chestOpenings.push({
        update(delta) {
            const done = chest.userData.opening.update(delta);
            if (done) enablePickup();
            return done;
        }
    });
    else enablePickup();
    chest.userData.opened = true;
    interactables.splice(interactables.indexOf(chest), 1);
    if (targetInteractable === chest) targetInteractable = null;
    hud.hideInteraction();
}


function showActiveDialog() {
    touchControls?.syncDialogue(true);
    if (activeDialogs[dialogIndex]?.action === 'dap') {
        menus.hideDialog();
        if (!grahamDap.active) {
            clearGreetingInput(); dapPointerSpeed = controls.pointerSpeed; controls.pointerSpeed = 0;
            if (!grahamDap.begin(controls.getObject(), grahamSprite)) {
                controls.pointerSpeed = dapPointerSpeed; dialogIndex++; showActiveDialog();
            }
        }
        return;
    }

    menus.showDialog(activeDialogs[dialogIndex], { speaker: activeDialogSpeaker });
}
const spawnGreeting = createSpawnGreeting({
    door: spawnRoomExit, unitSize: UNIT_SIZE, halfWidth: UNIT_SIZE / 2 - DOOR_SIDE_MARGIN
});
const greetingStartRotation = new THREE.Quaternion();
const greetingTargetRotation = new THREE.Quaternion();
const greetingTarget = new THREE.Vector3();
const greetingLookMatrix = new THREE.Matrix4();
const previousPlayerPosition = new THREE.Vector3();
let greetingPointerSpeed = 1;

function clearGreetingInput(preserveMovement = false) {
    if (!preserveMovement) for (const key of Object.keys(moveState)) moveState[key] = false;
    velocity.set(0, 0, 0);
    velocityY = 0;
    jumpHeld = false;
    isRunning = false;
    crouchRequested = false;
    updatePlayerPosture();
    keyboardBinding.resetSequence();
    if (!preserveMovement) touchControls?.reset();
    else touchControls?.syncRun();
}

function showGreetingPhase() {
    touchControls?.syncDialogue(spawnGreeting.active);
    if (spawnGreeting.showingDialog) menus.showDialog(grahamWakeGreetings[spawnGreeting.dialogIndex], { automatic: spawnGreeting.phase !== 'invitation', blurBackdrop: false });
    else menus.hideDialog();
}

function updateSpawnGreeting(delta) {
    if (woodcutting.active) return;
    if (!spawnGreeting.active) {
        if (spawnGreeting.played || isDead || isFlying || isRidingBoat || isDialogOpen || !grahamSprite) return;
        const door = solidInteractables.find(object => object.userData.type === 'DOOR'
            && object.userData.gx === spawnRoomExit.x && object.userData.gz === spawnRoomExit.z);
        if (!spawnGreeting.tryStart(previousPlayerPosition, camera.position, door?.userData.isOpen)) return;
        clearGreetingInput();
        greetingPointerSpeed = controls.pointerSpeed;
        controls.pointerSpeed = 0;
        greetingStartRotation.copy(camera.quaternion);
        greetingTarget.copy(grahamSprite.position);
        greetingTarget.y += GRAHAM_HEIGHT * 0.25;
        greetingLookMatrix.lookAt(camera.position, greetingTarget, camera.up);
        greetingTargetRotation.setFromRotationMatrix(greetingLookMatrix);
        targetInteractable = null;
        hud.hideInteraction();
        showGreetingPhase();
    }
    const previousPhase = spawnGreeting.phase;
    spawnGreeting.update(delta);
    const t = spawnGreeting.turnProgress;
    if (previousPhase !== 'invitation') {
        camera.quaternion.slerpQuaternions(greetingStartRotation, greetingTargetRotation, t * t * (3 - 2 * t));
    }
    if (previousPhase !== spawnGreeting.phase) {
        showGreetingPhase();
    }
}

function toggleDivingHelmet() {
    if (!hasDivingHelmet || helmetBroken || !isInventoryOpen || isDead) return;
    helmetEquipped = !helmetEquipped;
    menus.setHelmetState(hasDivingHelmet, helmetEquipped);
}

function setHeldItem(item) {
    heldItem = item;
    if (item !== 'mate') heldMate?.cancel();
    menus.setItemActive('mate', item === 'mate');
    if (item !== 'key') keyInventory.clearSelection();
    menus.setItemActive('heart', item === 'heart');
    menus.setItemActive('key', item === 'key');
    menus.setItemActive('sea-heart', item === 'sea-heart');
    if (heldItemSprite && item) {
        heldItemSprite.material.map = heldItemTextures[item] || heldItemTextures.heart;
        heldItemSprite.material.rotation = item === 'heart' ? -0.12 : 0.25;
        updateHeldItemLayout();
    }
}

function updateKeyInventory() {
    keys = keyInventory.count;
    if (heldItem === 'key' && !keyInventory.selected) setHeldItem(null);
    menus.setKeyCount(keys);
}

function useInventoryItem(item) {
    if (!gameStarted || !isInventoryOpen || isDead) return;
    if (item === 'helmet' && helmetBroken) {
        menus.setItemDescription('La escafandra se rompió al completar el Corazón del Mar.');
    } else if (item === 'helmet' && hasDivingHelmet) {
        toggleDivingHelmet();
        menus.setItemDescription(helmetEquipped ? 'Escafandra equipada.' : 'Escafandra guardada.');
    } else if (item === 'torch' && hasTorch) {
        const before = handTorchEnabled;
        gameActions.torch();
        menus.setItemDescription(before === handTorchEnabled
            ? isPlayerUnderwater() ? 'La antorcha no puede encenderse bajo el agua.' : 'La antorcha está bloqueada durante el evento del corazón.'
            : handTorchEnabled ? 'Antorcha encendida.' : 'Antorcha apagada.');
    } else if (item === 'mate' && hasMate) {
        setHeldItem(heldItem === 'mate' ? null : 'mate');
        menus.setItemDescription(heldItem === 'mate' ? (isTouchMode ? 'Mate en la mano. Pulsa A para tomar; mantén A para seguir tomando.' : 'Mate en la mano. Clic derecho para tomar; mantenlo para seguir bebiendo.') : 'Mate guardado.');
    } else if (item === 'map' && hasMap) {
        gameActions.map();
        menus.setItemDescription(minimap.enabled ? 'Mapa abierto al volver al juego.' : 'Mapa cerrado.');
    } else if (item === 'heart' && heartQuest.hasHeart) {
        setHeldItem(heldItem === 'heart' ? null : 'heart');
        menus.setItemDescription(heldItem ? 'Corazón del Bosque en la mano.' : 'Corazón del Bosque guardado.');
    } else if (item === 'sea-heart' && seaHeart?.count) {
        if (seaHeart.complete) setHeldItem(heldItem === 'sea-heart' ? null : 'sea-heart');
        menus.setItemDescription(seaHeart.complete ? 'Corazón del Mar completo. La escafandra está rota.' : `Fragmentos del Corazón del Mar: ${seaHeart.count}/10. Recoger otro renueva el aire.`);
    } else if (item === 'key' && keys > 0) {
        if (heldItem !== 'key') keyInventory.clearSelection();
        const selected = keyInventory.selectNext();
        setHeldItem(selected ? 'key' : null);
        menus.setItemDescription(selected ? `${selected.name} en la mano.${selected.doors.length ? '' : ' Su cerradura aún no está disponible.'}` : 'Llaves guardadas.');
    }
}

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
    if (spawnGreeting.active) showGreetingPhase();
    heartPull.show();
    woodcutting.setVisible(true);
    if (isDialogOpen) showActiveDialog();
    touchControls?.show();
    touchControls?.sync(true);
});
controls.addEventListener('unlock', () => {
    woodcutting.setVisible(false);
    jumpHeld = false;
    hud.hideInteraction();
    menus.hideDialog();
    musicEvents.setPaused(true);
    for (const direction of Object.keys(moveState)) moveState[direction] = false;
    velocity.set(0, 0, 0);
    isRunning = false;
    crouchRequested = false;
    updatePlayerPosture();
    keyboardBinding.resetSequence();
    touchControls?.sync(false);
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
    if (isRidingBoat || musicEvents.isEventActive('forest') || heartLevitationHeight > 0) return;
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
    const bridgeDoors = keyBindings.find(binding => binding.id === 'bridge-key').doors;
    if (door.userData.isOpen && !door.userData.locked && heartQuest.stage === 'delivered'
        && bridgeDoors.some(cell => cell.x === door.userData.gx && cell.z === door.userData.gz)) {
        questSkyCycle.openBridge();
    }
}

function canReachForestHeart() {
    return forestHeartShrine && Math.hypot(camera.position.x-forestHeartShrine.position.x,
        camera.position.z-forestHeartShrine.position.z) <= 1.65;
}
function interact() {
    if (!controls.isLocked || isDead) return false;
    if (woodcutting.active) {
        if (isTouchMode) woodcutting.interact();
        return true;
    }
    if (grahamDap.active) return true;
    if (caveMap?.active) {
        if (caveMap.nearExit(controls.getObject().position)) leaveCaveTestMap();
        return true;
    }
    if (heartPull.active) { heartPull.interact(); return true; }
    if (spawnGreeting.active) {
        if (spawnGreeting.dismiss()) {
            menus.hideDialog();
            controls.pointerSpeed = greetingPointerSpeed;
            clearGreetingInput();
        }
        return true;
    }
    if (gameStarted) {
        if (isDialogOpen) {
            // Avanzar al siguiente diálogo
            if (dialogIndex < activeDialogs.length - 1) {
                dialogIndex++;
                showActiveDialog();
            } else {
                // Cerrar diálogo
                const completedHeartDelivery = deliveringHeart;
                let receivedBridgeKey = false;
                if (activeDialogs === mateOfferDialogs && !hasMate) {
                    hasMate = true; menus.setMateVisible(true); hud.showReceivedItem('un mate');
                }
                if (activeDialogs === npcDialogs && !hasTorch) {
                    hasTorch = true;
                    menus.setTorchVisible(true);
                    hud.showReceivedItem('una antorcha');
                }
                if (deliveringHeart) {
                    heartQuest.deliver(); menus.setHeartVisible(false);
                    if (heldItem === 'heart') setHeldItem(null);
                }
                if (activeDialogs === bridgeKeyDeliveryDialogs && heartQuest.receiveBridgeKey(GRAHAM_BRIDGE_KEY_AVAILABLE)) {
                    receivedBridgeKey = true;
                    keyInventory.add('bridge-key');
                    updateKeyInventory();
                    hud.showReceivedItem('la llave del puente');
                }
                deliveringHeart = false;
                isDialogOpen = false;
                menus.hideDialog();
                if ((completedHeartDelivery && !GRAHAM_BRIDGE_KEY_AVAILABLE) || receivedBridgeKey) openMapChestAfterThanks();
            }
            return true;
        }

        if (isRidingBoat) {
            isRidingBoat = false;
            const controlObj = controls.getObject();
            const currentGX = Math.floor((controlObj.position.x + UNIT_SIZE/2) / UNIT_SIZE);
            const currentGZ = Math.floor((controlObj.position.z + UNIT_SIZE/2) / UNIT_SIZE);
            boatReference.userData.gx = Math.floor((boatReference.position.x + UNIT_SIZE/2) / UNIT_SIZE);
            boatReference.userData.gz = Math.floor((boatReference.position.z + UNIT_SIZE/2) / UNIT_SIZE);
            scene.add(boatReference);
            interactables.push(boatReference);
            boatReference = null;
            boatSeatOffset.set(0, 0, 0);
            velocityY = 10.0; // Pequeño salto al salir
        } else if (targetInteractable) {
            if (targetInteractable.userData.id === 'graham-stump') {
                if (!isFlying && !isRidingBoat && canJump && !isDialogOpen && heartLevitationHeight <= 0
                    && !musicEvents.isEventActive('forest')) woodcutting.begin(targetInteractable);
                return true;
            }
            if (targetInteractable.userData.type === 'MAP_PICKUP') {
                if (hasMap || !heartQuest.canOpenMapChest) return true;
                hasMap = true;
                menus.setMapVisible(true);
                hud.showReceivedItem('un mapa');
                targetInteractable.userData.visibilityEnabled = false;
                targetInteractable.visible = false;
                fogCulling?.unregister(targetInteractable);
                const index = interactables.indexOf(targetInteractable);
                if (index >= 0) interactables.splice(index,1);
                targetInteractable = null;
                hud.hideInteraction();
                return true;
            }
            if (targetInteractable.userData.type === 'MATE_SET') {
                deliveringHeart = false;
                isDialogOpen = true;
                clearGreetingInput();
                activeDialogs = mateOfferDialogs;
                activeDialogSpeaker = 'Graham';
                dialogIndex = 0;
                showActiveDialog();
                return true;
            }

            if (targetInteractable.userData.type === 'CHEST') {
                if (targetInteractable.userData.opened) return;
                if (targetInteractable.userData.item === 'map' && !heartQuest.canOpenMapChest) return;
                if (targetInteractable.userData.item === 'forest-heart') {
                    if (heartQuest.stage !== 'searching' || !canReachForestHeart()) return true;
                    isFlying = false;
                    heartPull.begin(forestHeartShrine);
                    return true;
                } else if (targetInteractable.userData.item === 'map') {

                    updateKeyInventory();
                    hasMap = true;
                    menus.setMapVisible(true);
                    hud.showReceivedItem('un mapa');
                } else {
                    keyInventory.add(targetInteractable.userData.id);
                    updateKeyInventory();
                    hud.showReceivedItem('una llave');
                }
                if (targetInteractable.userData.opening) {
                    chestOpenings.push(targetInteractable.userData.opening);
                }
                targetInteractable.userData.opened = true;
                if (targetInteractable.userData.vineMesh) {
                    targetInteractable.userData.vineMesh.userData.opened = true;
                    const vineIdx = interactables.indexOf(targetInteractable.userData.vineMesh);
                    if (vineIdx !== -1) interactables.splice(vineIdx, 1);
                }
                if (targetInteractable.userData.heartMesh) {
                    targetInteractable.userData.heartMesh.userData.opened = true;
                    const heartIdx = interactables.indexOf(targetInteractable.userData.heartMesh);
                    if (heartIdx !== -1) interactables.splice(heartIdx, 1);
                }
                const targetIdx = interactables.indexOf(targetInteractable);
                if (targetIdx !== -1) interactables.splice(targetIdx, 1);
                targetInteractable = null;
            } else if (targetInteractable.userData.type === 'SEA_HEART_FRAGMENT') {
                return; // Se recoge caminando sobre él; no exige pulsar E.
            } else if (targetInteractable.userData.type === 'DIVING_HELMET') {
                if (hasDivingHelmet || !controls.isLocked || isDead) return true;
                const helmet = targetInteractable;
                hasDivingHelmet = true;
                helmetEquipped = true;
                interactables.splice(interactables.indexOf(helmet), 1);
                scene.remove(helmet);
                fogCulling?.unregister(helmet);
                helmet.geometry.dispose();
                for (const material of helmet.material) material.dispose();
                targetInteractable = null;
                hud.hideInteraction();
                menus.setHelmetState(true, true);
                musicEvents.prepare('underwater').catch(() => {});
                hud.showReceivedItem('un casco de escafandra');
            } else if (targetInteractable.userData.type === 'BOAT') {
                isFlying = false;
                isRidingBoat = true;
                boatReference = targetInteractable;
                interactables.splice(interactables.indexOf(boatReference), 1);
                collisionMap[boatReference.userData.gz][boatReference.userData.gx] = false;
                targetInteractable = null;
                const controlObj = controls.getObject();
                boatSeatOffset.set(Math.sin(boatReference.rotation.y) * BOAT_SEAT_BACK_OFFSET, 0,
                    Math.cos(boatReference.rotation.y) * BOAT_SEAT_BACK_OFFSET);
                controlObj.position.x = boatReference.position.x + boatSeatOffset.x;
                controlObj.position.z = boatReference.position.z + boatSeatOffset.z;
                controlObj.position.y = getBoatEyesHeight(boatReference);
                velocityY = 0;
                canJump = true;
            } else if (targetInteractable.userData.type === 'NPC') {
                isDialogOpen = true;
                if (isTouchMode) clearGreetingInput();
                if (targetInteractable.userData.id === 'attic-ant') {
                    deliveringHeart = false;
                    activeDialogs = atticAntDialogs;
                    activeDialogSpeaker = 'Bicho';
                    dialogIndex = 0;
                    showActiveDialog();
                    return true;
                }
                activeDialogSpeaker = 'Graham';
                // El cofre del mapa se abre al terminar todo el agradecimiento por el corazón.

                deliveringHeart = hasTorch && heartQuest.hasHeart;
                activeDialogs = !hasTorch ? npcDialogs : deliveringHeart ? heartDeliveryDialogs : heartQuest.stage === 'delivered' ? heartDeliveredDialogs : heartSearchDialogs;
                if (hasTorch && GRAHAM_BRIDGE_KEY_AVAILABLE && heartQuest.stage === 'delivered') {
                    activeDialogs = heartQuest.hasBridgeKey ? bridgeKeyReceivedDialogs : bridgeKeyDeliveryDialogs;
                }
                dialogIndex = 0;
                showActiveDialog();
            } else if (targetInteractable.userData.type === 'DOOR') {
                if (targetInteractable.userData.locked) {
                    if (heldItem === 'key' && keyInventory.useOn(targetInteractable.userData.gx, targetInteractable.userData.gz)) {
                        updateKeyInventory();
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

const gameActions = {
    isPaused: () => gameStarted && !isDead && !controls.isLocked && !isInventoryOpen,
    toggleFlight,
    toggleDayNight,
    stopMusic() { if (gameStarted && !isDead && controls.isLocked) musicEvents.stopMusic(); },
    start() { if (mapLoaded && !gameStarted) resumeGame(); },
    interact,
    holdInteract(pressed) {
        if (!woodcutting.active || !controls.isLocked || isDead) return false;
        woodcutting.holdExit(pressed);
        return true;
    },
    grantForestHeartForTesting() {
        if (!gameStarted || !mapLoaded || !controls.isLocked || isDead || isDialogOpen || isInventoryOpen || isRidingBoat) return;
        if (!heartQuest.collect()) return;
        menus.setHeartVisible(true);
        hud.showReceivedItem('el Corazón del Bosque');
    },
    teleportToForestHeart() {
        if (!gameStarted || !mapLoaded || !controls.isLocked || isDead || isDialogOpen || isRidingBoat || !forestHeartShrine) return;
        const shrine=forestHeartShrine;
        for (const radius of [3.5,4.5,5.5,6.5]) for (let step=0;step<12;step++) {
            const angle=shrine.rotation.y+step*Math.PI/6;
            const x=shrine.position.x+Math.sin(angle)*radius, z=shrine.position.z+Math.cos(angle)*radius;
            const ground=floorMap[Math.round(z/UNIT_SIZE)]?.[Math.round(x/UNIT_SIZE)];
            if (!['GRASS','TALL_GRASS','BUSH','TREE','DIRT','SLAB','WOOD','SAND'].includes(ground) || isWall(x,z)) continue;
            clearGreetingInput();
            isFlying=false; canJump=true; bobTimer=0;
            camera.position.set(x,getTerrainHeight(x,z)+PLAYER_HEIGHT,z);
            previousPlayerPosition.copy(camera.position);
            camera.lookAt(shrine.position.x,shrine.position.y+0.52,shrine.position.z);
            targetInteractable=null;
            return;
        }
    },
    move(direction, pressed) { moveState[direction] = pressed; },
    holdJump(pressed) {
        jumpHeld = pressed;
        if (!pressed) {
            touchJumpRepeatWait = 0;
            bedBounceActive = false;
            bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
            bedBounceHitCeiling = false;
        }
    },
    jump() {
        if (!isFlying && !isRidingBoat && canJump && heartLevitationHeight <= 0) {
            const player = controls.getObject();
            const eyeHeight = isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
            const support = getBedSupport(player.position.x, player.position.z, player.position.y - eyeHeight, solidInteractables);
            const standingOnBed = Number.isFinite(support) && Math.abs(player.position.y - eyeHeight - support) < 0.18;
            touchJumpRepeatWait = 0;
            velocityY = standingOnBed ? BED_BOUNCE_BASE_IMPULSE : JUMP_FORCE;
            canJump = false;
            bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
            bedBounceHitCeiling = false;
            bedBounceActive = standingOnBed;
            bedCeilingHits = 0;
        }
    },
    crouch(pressed) {
        crouchRequested = pressed;
        updatePlayerPosture();
    },
    run(pressed) { isRunning = pressed; },
    map() {
        if (mapLoaded && hasMap && !caveMap?.active) {
            minimap.toggle();
            menus.setItemActive('map', minimap.enabled);
        }
    },
    torch() {
        if (gameStarted && !isDead && hasTorch && !musicEvents.isEventActive('forest')
            && heartVision.uniforms.heartStrength.value <= 0.00001 && heartLevitationHeight <= 0.00001)
            setHandTorchEnabled(!handTorchEnabled);
    },
    inventory() {
        if (gameStarted && !isDead) {
            isInventoryOpen = !isInventoryOpen;
            if (isInventoryOpen) {
                pauseGame();
                menus.showInventory();
            } else {
                menus.hideInventory();
                resumeGame();
            }
        }
    },
    pause() {
        if (!gameStarted || isDead) return;
        if (controls.isLocked) { isInventoryOpen = false; pauseGame(); }
        else resumeGame();
    }
};
const heartPull = createHeartPull(THREE, {
    scene, camera, input: moveState, isWall,
    groundHeight: (x,z) => getTerrainHeight(x,z) + PLAYER_HEIGHT,
    showMessage: text => {
        hud.hideInteraction();
        menus.showDialog(text, {blurBackdrop:false, anonymous:true, smooth:true});
    },
    hideMessage: () => menus.hideDialog(),
    // Detener la inercia sin olvidar las direcciones ni soltar la cruceta durante el tirón.
    clearInput: () => clearGreetingInput(true),
    release(vine) {
        if (!heartQuest.collect()) return;
        vine.userData.collectHeart();
        vine.userData.opened=true;
        vine.userData.visibilityEnabled=false;
        vine.visible=false;
        const brokenBase = vine.userData.brokenBase;
        brokenBase.position.copy(vine.position);
        brokenBase.quaternion.copy(vine.quaternion);
        scene.add(brokenBase);
        scene.remove(vine);
        for (const list of [interactables,solidInteractables]) {
            for(let i=list.length-1;i>=0;i--) if(list[i]===vine||list[i]===vine.userData.heartMesh) list.splice(i,1);
        }
        targetInteractable=null;hud.hideInteraction();
        setHandTorchEnabled(false);menus.setHeartVisible(true);
        hud.showReceivedItem('el Corazón del Bosque');musicEvents.trigger('forest');
    }
});
let woodcuttingTorchWasEnabled = false;
const woodcutting = createWoodcutting(THREE, {
    scene, camera, controls, hud: createWoodcuttingHud(isTouchMode),
    onBegin() {
        clearGreetingInput(); heldMate?.cancel();
        hud.hideStamina();
        woodcuttingTorchWasEnabled = handTorchEnabled;
        setHandTorchEnabled(false);
        targetInteractable = null; hud.hideInteraction();
    },
    onEnd() {
        clearGreetingInput();
        if (woodcuttingTorchWasEnabled && !isPlayerUnderwater()) setHandTorchEnabled(true);
    }
});
// Teclado y táctil comparten el bloqueo temporal; siempre se permite pausar.
for (const name of ['toggleFlight', 'toggleDayNight', 'stopMusic', 'teleportToForestHeart', 'grantForestHeartForTesting', 'move', 'holdJump', 'jump', 'crouch', 'run', 'map', 'torch', 'inventory']) {
    const action = gameActions[name];
    gameActions[name] = (...args) => {
        if (woodcutting.active) {
            return;
        }
        if (!spawnGreeting.active && !grahamDap.active && (!heartPull.active || name === 'move')) return action(...args);
    };
}
const keyboardBinding = bindKeyboard(gameActions);

const touchLook = new THREE.Euler(0, 0, 0, 'YXZ');
const TOUCH_LOOK_SENSITIVITY = 0.0045;
let touchMateHeld = false;
const touchActions = {
    ...gameActions,
    holdJump(pressed) {
        if (!pressed) {
            if (touchMateHeld) heldMate?.release();
            touchMateHeld = false;
            gameActions.holdJump(false);
            return;
        }
        if (heldItem === 'mate') {
            gameActions.holdJump(false);
            touchMateHeld = true;
            if (canDrinkMate()) heldMate?.press();
            return;
        }
        gameActions.holdJump(true);
    },
    jump() {
        if (touchMateHeld || heldItem === 'mate') return;
        gameActions.jump();
    }
};

const touchControls = isTouchMode ? bindTouchControls({
    actions: touchActions, canvas: renderer.domElement,
    isActive: () => gameStarted && controls.isLocked && !isDead && !isDialogOpen && !spawnGreeting.active,
    canAdvanceDialogue: () => controls.isLocked && !isDead && menus.isDialogVisible() && ((isDialogOpen && !grahamDap.active)
        || (spawnGreeting.active && spawnGreeting.phase === 'invitation')),
    pause: pauseGame,
    look(dx, dy) {
        if (woodcutting.active || spawnGreeting.active || grahamDap.active || isDialogOpen) return;
        touchLook.setFromQuaternion(camera.quaternion, 'YXZ');
        touchLook.y -= dx * TOUCH_LOOK_SENSITIVITY;
        touchLook.x = THREE.MathUtils.clamp(touchLook.x - dy * TOUCH_LOOK_SENSITIVITY, -Math.PI / 2 + 0.04, Math.PI / 2 - 0.04);
        camera.quaternion.setFromEuler(touchLook);
    }
}) : null;

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
let caveEntrance = null;
let caveMap = null;
let caveTransitionPending = false;

async function enterCaveTestMap() {
    if (caveTransitionPending || caveMap?.active) return;
    caveTransitionPending = true;
    velocity.set(0,0,0);
    hud.showInteraction();hud.setInteractionText('Entrando a la cueva…');
    try {
        if (!caveMap) {
            caveMap = await loadCaveTestMap(THREE,UNIT_SIZE,PLAYER_HEIGHT,{
                rockTexture:fondoTex, floorTexture:tierraTex, waterMaterial:aguaFloorMat
            });
            scene.add(caveMap.group);
            await renderer.compileAsync(scene,camera);
        }
        caveMap.active=true;caveMap.group.visible=true;
        if (minimap.enabled) minimap.toggle();
        menus.setItemActive('map',false);
        controls.getObject().position.copy(caveMap.spawn);
        camera.rotation.set(0,0,0);
        velocityY=0;isFlying=false;targetInteractable=null;
    } catch(error) {
        console.error('No se pudo entrar a mapa_cueva.png:',error);
        hud.showReceivedItem('un error al cargar mapa_cueva.png; vuelve a intentarlo');
        controls.getObject().position.copy(caveEntrance.returnPosition).y+=PLAYER_HEIGHT;
    } finally { caveTransitionPending=false; }
}

function leaveCaveTestMap() {
    if (!caveMap?.active) return;
    caveMap.active=false;caveMap.group.visible=false;
    controls.getObject().position.copy(caveEntrance.returnPosition).y+=PLAYER_HEIGHT;
    camera.rotation.set(0,Math.PI/2,0);
    velocity.set(0,0,0);velocityY=0;targetInteractable=null;
    hud.hideInteraction();
}
let playerStartX = 0;
let playerStartZ = 0;





let aguaFloorMat = null;




// Cargar texturas de Sprites
const texLoader = new THREE.TextureLoader();
let resolveHeartTexture, rejectHeartTexture;
const heartTextureReady = new Promise((resolve,reject)=>{resolveHeartTexture=resolve;rejectHeartTexture=reject;});
heldItemTextures = {
    heart: texLoader.load('./imagenes/Sprites/corazon.png', () => {updateHeldItemLayout();resolveHeartTexture();}, undefined, rejectHeartTexture),
    key: texLoader.load('./imagenes/Sprites/llave.png', () => updateHeldItemLayout()),
    'sea-heart': texLoader.load('./imagenes/Sprites/corazon-mar.png', () => updateHeldItemLayout())
};
for (const texture of Object.values(heldItemTextures)) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
}
heldItemSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: heldItemTextures.heart, transparent: true, fog: false, depthWrite: false, depthTest: false
}));
heldItemSprite.name = 'held-inventory-item';
heldItemSprite.visible = false;
heldItemSprite.renderOrder = 1000;
camera.add(heldItemSprite);
heldHeartGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: heldItemTextures.heart, color: 0x9ae4ff, opacity: 0.12, rotation: -0.12,
    transparent: true, blending: THREE.AdditiveBlending, fog: false, depthWrite: false, depthTest: false
}));
heldHeartGlow.name = 'held-forest-heart-glow';
heldHeartGlow.visible = false;
heldHeartGlow.renderOrder = 1001;
camera.add(heldHeartGlow);
function updateHeldItemLayout() {
    if (!heldItemSprite) return;
    const distance = 0.7;
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
    const viewRadius = Math.min(halfHeight, halfHeight * camera.aspect);
    const texture = heldItemTextures[heldItem || 'heart'] || heldItemTextures.heart;
    const imageRatio = texture.image ? texture.image.width / texture.image.height : 1;
    const height = viewRadius * 0.6;
    const width = Math.min(height * imageRatio, viewRadius * 0.65);
    heldItemSprite.position.set(viewRadius * 0.32, -viewRadius * 0.35, -distance);
    heldItemSprite.scale.set(width, height, 1);
    if (heldHeartGlow) {
        heldHeartGlow.position.copy(heldItemSprite.position);
        heldHeartGlow.scale.set(width * 1.06, height * 1.06, 1);
    }
}
updateHeldItemLayout();
heldMate = createHeldMate(THREE,camera);
const canDrinkMate = () => heldItem === 'mate' && gameStarted && controls.isLocked && !isDead
    && !woodcutting.active && !isDialogOpen && !isInventoryOpen && !spawnGreeting.active && !heartPull.active && !grahamDap.active;
document.addEventListener('mousedown', event => {
    if (event.button === 0 && woodcutting.active && controls.isLocked && !isDead) {
        event.preventDefault(); woodcutting.interact(); return;
    }
    if (event.button === 2 && canDrinkMate()) { event.preventDefault(); heldMate.press(); }
});
document.addEventListener('mouseup', event => { if (event.button === 2) heldMate.release(); });
window.addEventListener('blur', () => { heldMate.cancel(); woodcutting.holdExit(false); });
renderer.domElement.addEventListener('contextmenu', event => {
    if ((woodcutting.active && controls.isLocked) || canDrinkMate()) event.preventDefault();
});
const torchFrames = [];
const blueFireFrames = [1,2,3].map(frame => {
    const texture = texLoader.load(`./imagenes/Sprites/fuego-azul-${frame}.svg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    return texture;
});
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
const arenaMojadaTex = texLoader.load('./imagenes/Texturas/arena_mojada.png?v=' + Date.now());
arenaMojadaTex.magFilter = arenaMojadaTex.minFilter = THREE.NearestFilter;
arenaMojadaTex.colorSpace = THREE.SRGBColorSpace;
arenaMojadaTex.wrapS = arenaMojadaTex.wrapT = THREE.RepeatWrapping;
const fondoTex = texLoader.load('./imagenes/Texturas/fondo.png?v=' + Date.now());
fondoTex.magFilter = THREE.LinearFilter;
fondoTex.minFilter = THREE.LinearMipmapLinearFilter;
fondoTex.colorSpace = THREE.SRGBColorSpace;
fondoTex.wrapS = fondoTex.wrapT = THREE.RepeatWrapping;
const agua1Tex = texLoader.load('./imagenes/Texturas/Agua1_niebla.png?v=' + Date.now());
const agua2Tex = texLoader.load('./imagenes/Texturas/Agua2_niebla.png?v=' + Date.now());
const agua3Tex = texLoader.load('./imagenes/Texturas/Agua3_niebla.png?v=' + Date.now());
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
nightMaterials.forEach(material => heartVision.apply(THREE, material, 'sky'));
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
[moonMat, moonGlowMat, moonAzulMat].forEach(material => heartVision.apply(THREE, material, 'moon'));
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
const sunFlare = createSunFlare(sunSprite, camera, renderer);
scene.add(sunFlare.object);

// Variables para la lógica de mirar la luna
let moonLookTimer = 0;
let moonIsAlternating = false;
let moonCycle = 0.0;
let moonGlowOpacity = 0;
let moonAzulOpacity = 0;
let hasShootingStarFired = false;
let starSprite = null;
let starTimer = 0;
const starStart = new THREE.Vector3(), starEnd = new THREE.Vector3();
const starFlights = [], extraStarSprites = [];
let starSequenceActive = false;

scene.add(skyMesh);

Promise.all([
    loadMapImage('./imagenes/Mapa/capa1.png?v=' + Date.now()),
    loadMapImage('./imagenes/Mapa/capa2.png?v=' + Date.now()),
    heartTextureReady
]).then(async ([baseImage, roofImage]) => {
    const prepared = prepareMap(readMapLayers(baseImage, roofImage), entities, shipwreckProps, mapCellOverrides);
    focusLoadingSpawn(prepared.playerStartX, prepared.playerStartZ, prepared.mapWidth, prepared.mapHeight);
    // Presentar la carga antes de la construcción síncrona de geometría.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    buildWorld(prepared);
    // La primera inmersión no debe estrenar framebuffer ni shaders del mundo.
    await underwaterView.prepare(scene, camera);
    // Preparar también los materiales fuera de cámara durante la pantalla de carga.
    // Su primera aparición al mirar a Graham no debe compilar shaders en pleno giro.
    await renderer.compileAsync(scene, camera);
    await finishLoadingZoom();
    mapLoaded = true;
    loadingScreen.style.display = 'none';
    if (isTouchMode) {
        resumeGame();
    } else if (document.pointerLockElement === document.body) {
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


function buildWorld(prepared) {
    ({ mapWidth, mapHeight, collisionMap, floorMap, roofMap, playerStartX, playerStartZ } = prepared);
    const { counts, floorCanvas } = prepared;
    const registry = createEntityRegistry(entities, floorMap, mapWidth, mapHeight);
    const mountainReliefMap = createMountainReliefMap(floorMap, collisionMap);
    woodFloorMap = createWoodFloorMap(floorMap, roofMap, mapWidth, mapHeight, prepared.externalTorchMap);
    const waterDeckMap = createWaterDeckMap(floorMap, roofMap, mapWidth, mapHeight);
    const seaFloorHeights = createSeaFloorHeights(floorMap,waterDeckMap,mapWidth,mapHeight);
    // El floorCanvas se utilizará ahora exclusivamente para el minimapa
    // Eliminado el floorMesh (la imagen del mapa 2D en el mundo 3D) para no interferir con las laderas y profundidades del terreno continuo.
    
    // Lecho marino (fondo profundo absoluto por si hay huecos)
    const seabedGeo = new THREE.PlaneGeometry(mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE);
    const seabedMat = new THREE.MeshPhongMaterial({ color: 0x050511, shininess: 0 }); // Oscuridad profunda
    const seabedMesh = new THREE.Mesh(seabedGeo, seabedMat);
    seabedMesh.name = 'seabed-backstop';
    seabedMesh.rotation.x = -Math.PI / 2;
    seabedMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, SEA_FLOOR_HEIGHT - 0.2, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
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
    const forestMaterials = [pino1Mat, pino2Mat, alamo1Mat, alamo2Mat, arau1Mat, arau2Mat, arbusto1Mat, arbusto2Mat, weed1Mat, weed2Mat, weed3Mat];
    applyVegetationWind(THREE, forestMaterials, vegetationWindTime, heartVision);
    forestMaterials.forEach((material, index) => heartVision.apply(THREE, material, index < 6 ? 'tree' : 'vegetation'));
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
    aguaFloorMat = new THREE.MeshPhongMaterial({ map: agua1Tex, color: 0xffffff, transparent: true, opacity: 1, shininess: 60, side: THREE.DoubleSide });
    applyWaterWaves(THREE, aguaFloorMat, waterWaveTime,
        createRiverCurrentField(floorMap, waterDeckMap, mapWidth, mapHeight), UNIT_SIZE, underwaterStrength, raisedWaterCell);
    heartVision.apply(THREE, aguaFloorMat, 'water');
    const maderaFloorMat = new THREE.MeshPhongMaterial({ map: maderaTex, shininess: 0 }); 

    const planeGeo = new THREE.PlaneGeometry((UNIT_SIZE * 1.9 + 0.6) * TREE_SPRITE_SCALE, TREE_SPRITE_HEIGHT);
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
    
    const altarDistance = (x,z) => Math.max(Math.abs(x-seaHeartAltar.center.x),Math.abs(z-seaHeartAltar.center.z));
    const altarWalls = [];
    for(let z=seaHeartAltar.center.z-seaHeartAltar.radius;z<=seaHeartAltar.center.z+seaHeartAltar.radius;z++) {
        for(let x=seaHeartAltar.center.x-seaHeartAltar.radius;x<=seaHeartAltar.center.x+seaHeartAltar.radius;x++) {
            if(floorMap[z]?.[x]==='BUILDING') altarWalls.push([x,z]);
        }
    }
    const bldgMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, UNIT_SIZE), bldgMat, counts.BUILDING + altarWalls.length);
    const doorCount = floorMap.reduce((total,row)=>total+row.filter(type=>['DOOR_UNLOCKED','DOOR_LOCKED'].includes(type)).length,0);
    const lintelHeight = WALL_HEIGHT - DOOR_HEIGHT;
    // Recortar la textura del muro completo; no comprimir una copia entera en cada pieza del marco.
    function createDoorFrameMaterial(verticalOffset) {
        const material = bldgMat.clone();
        material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `
                #include <uv_vertex>
                #ifdef USE_MAP
                    vec3 framePosition = (instanceMatrix * vec4(position, 1.0)).xyz;
                    vec2 frameUv;
                    if (abs(normal.y) > 0.5) {
                        frameUv = vec2(framePosition.x, normal.y > 0.0 ? -framePosition.z : framePosition.z) / ${UNIT_SIZE.toFixed(8)} + 0.5;
                    } else {
                        float alongWall = abs(normal.x) > 0.5
                            ? (normal.x > 0.0 ? -framePosition.z : framePosition.z)
                            : (normal.z > 0.0 ? framePosition.x : -framePosition.x);
                        frameUv = vec2(alongWall / ${UNIT_SIZE.toFixed(8)} + 0.5,
                            (position.y + ${verticalOffset.toFixed(8)}) / ${WALL_HEIGHT.toFixed(8)} + 0.5);
                    }
                    vMapUv = (mapTransform * vec3(frameUv, 1.0)).xy;
                #endif
            `);
        };
        material.customProgramCacheKey = () => `door-frame-${verticalOffset}`;
        return material;
    }
    const lintelMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, lintelHeight, UNIT_SIZE), createDoorFrameMaterial(DOOR_HEIGHT / 2), doorCount);
    let idxLintel = 0;
    const jambMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, DOOR_HEIGHT, 1), createDoorFrameMaterial(-lintelHeight / 2), doorCount * 2);
    let idxJamb = 0;
    const roofSubdivisions = 8;
    const roofStepHeight = WALL_HEIGHT * 0.0625;
    const ceilingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE / roofSubdivisions, roofStepHeight, UNIT_SIZE / roofSubdivisions), roofMat, counts.ROOF * roofSubdivisions ** 2);
    const falseCeilingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, 0.1, UNIT_SIZE), ceilingMat, counts.ROOF);

    const floorTileGeo = new THREE.BoxGeometry(UNIT_SIZE, 1.0, UNIT_SIZE);
    const maderaFloorMesh = new THREE.InstancedMesh(floorTileGeo, maderaFloorMat, counts.MADERA_FLOOR + 500);
    const waterDeckMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, WATER_DECK_THICKNESS, UNIT_SIZE), maderaFloorMat, counts.MADERA_FLOOR + 500);
    let waterDeckCount = 0;

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
        const factor = {MOUNTAIN:1.5,PEAK:2,SNOW_PEAK:3}[mountainReliefMap[z][x]];
        if(factor) previousMountainMaximum=Math.max(previousMountainMaximum,elevationMap[z][x]*factor);
    }
    previousMountainMaximum *= 0.85 * 0.8;
    const { heights: mountainHeights, mask: mountainMask } = createMountainHeights(mountainReliefMap, mapWidth, mapHeight, previousMountainMaximum);
    // Aplanar y esculpir
    for (let z = 0; z < mapHeight; z++) {
        for (let x = 0; x < mapWidth; x++) {
            const type = floorMap[z][x];
            let dist = elevationMap[z][x];
            
            // Reglas de elevación según el tipo
            if (mountainMask[z][x]) elevationMap[z][x] = mountainHeights[z][x];
            else if (woodFloorMap[z][x]) elevationMap[z][x] = waterDeckMap[z][x] ? WATER_SURFACE_HEIGHT + WATER_DECK_THICKNESS : 1.0;
            else if (['WATER', 'WATER_ROCK', 'BOAT'].includes(type)) {
                let sandDistance = 4;
                for (let dz = -3; dz <= 3; dz++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        if (['SAND', 'WET_SAND'].includes(floorMap[z + dz]?.[x + dx])) sandDistance = Math.min(sandDistance, Math.hypot(dx, dz));
                    }
                }
                elevationMap[z][x] = -0.5 - Math.min(2, Math.max(0, sandDistance - 1) * 0.8);
                const boatInSea = type==='BOAT' && ![[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dz])=>floorMap[z+dz]?.[x+dx]==='WATER_ROCK');
                if ((type==='WATER' || boatInSea) && !(x===seaHeartAltar.center.x && z===seaHeartAltar.center.z)) {
                    elevationMap[z][x] = seaFloorHeights[z][x];
                }
            }
            else if (['SAND', 'WET_SAND'].includes(type)) elevationMap[z][x] = 0.2;
            else if (['GRASS', 'TALL_GRASS', 'TREE', 'BUSH', 'DIRT', 'TORCH', 'OTHER', 'OTHER2', 'CHEST'].includes(type)) {
                let height = Math.min(dist * 0.2, 1.0);
                let sandDistance = 4;
                for (let dz = -3; dz <= 3; dz++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        if (['SAND', 'WET_SAND'].includes(floorMap[z + dz]?.[x + dx])) sandDistance = Math.min(sandDistance, Math.hypot(dx, dz));
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
                elevationMap[z][x] = waterDeckMap[z][x] ? WATER_SURFACE_HEIGHT + WATER_DECK_THICKNESS : 1.0;
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
    mountainPathProfile = smoothMountainPath(mountainReliefMap, elevationMap, mountainMask, previousMountainMaximum, {...MOUNTAIN_PROFILE_REFERENCE, followTerrain:true, inclineMultiplier:1.1});
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
                    if(!mountainMask[z][x]) elevationMap[z][x] = waterDeckMap[z][x] ? WATER_SURFACE_HEIGHT + WATER_DECK_THICKNESS : 1.0;
                }
            }
        }
    }

    smoothMountainSlope(mountainReliefMap, elevationMap, mountainMask, mountainPathProfile?.summitHeight, mountainPathProfile?.followsTerrain);
    // Elevar cada puente cubierto al terreno de sus accesos, antes de construir sus piezas.
    for (const bridge of waterDeckMap.coveredBridges) {
        const midX = (bridge.minX + bridge.maxX) / 2, midZ = (bridge.minZ + bridge.maxZ) / 2;
        const accesses = bridge.maxZ - bridge.minZ > bridge.maxX - bridge.minX
            ? [[midX, bridge.minZ - 1], [midX, bridge.maxZ + 1]]
            : [[bridge.minX - 1, midZ], [bridge.maxX + 1, midZ]];
        const base = Math.max(...accesses.map(([x, z]) => getTerrainVertexY(
            Math.max(0, Math.min(mapWidth - 1, x)), Math.max(0, Math.min(mapHeight - 1, z)),
            mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap, mountainPathProfile)));
        // Los aleros no elevan el cauce ni la orilla que queda debajo.
        for (const [x, z] of bridge.structure) elevationMap[z][x] = base;
    }
    levelBuildingAtTerrain(grahamPosition, floorMap, roofMap, elevationMap, (x, z) =>
        getTerrainVertexY(x, z, mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap, mountainPathProfile));
    const roofBaseMap = createRoofBaseMap(roofMap, floorMap, elevationMap);
    atticSupport = bedDefinition ? createAtticSupport(roofMap, roofBaseMap, bedDefinition, roofSubdivisions) : null;

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
                const atticCell = atticSupport?.cells.get(z * mapWidth + x);
                dummy.position.set(posX, roofBaseH + WALL_HEIGHT, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                const overBed = x === bedDefinition?.position.x && z >= bedDefinition.position.z && z < bedDefinition.position.z + bedDefinition.size.z;
                if (overBed) {
                    const key = `${x},${z}`;
                    const piece = new THREE.Mesh(falseCeilingMesh.geometry, ceilingMat);
                    piece.position.copy(dummy.position);
                    bedFalseCeilingPieces.set(key, piece);
                    const roofPiece = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE / roofSubdivisions, roofStepHeight, UNIT_SIZE / roofSubdivisions), roofMat, roofSubdivisions ** 2);
                    roofPiece.count = 0;
                    bedRoofPieces.set(key, roofPiece);
                } else falseCeilingMesh.setMatrixAt(idxFalseCeil++, dummy.matrix);

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
                        if (atticCell) atticCell.roofHeights[sz * roofSubdivisions + sx] = techoBottom;
                        const techoCenter = techoBottom + (stepHeight / 2);
                        
                        dummy.position.set(subPosX, techoCenter, subPosZ);
                        dummy.rotation.set(0, 0, 0);
                        dummy.updateMatrix();
                        if (overBed) {
                            const piece = bedRoofPieces.get(`${x},${z}`);
                            piece.setMatrixAt(piece.count++, dummy.matrix);
                        }
                        else ceilingMesh.setMatrixAt(idxCeil++, dummy.matrix);
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
                if (altarDistance(x,z) <= seaHeartAltar.radius) {
                    // Otro tramo hacia abajo: mismo techo y misma densidad de textura.
                    dummy.position.y = baseH - WALL_HEIGHT / 2;
                    dummy.updateMatrix();
                    bldgMesh.setMatrixAt(idxBldg++, dummy.matrix);
                    const flame = new THREE.Sprite(new THREE.SpriteMaterial({
                        map:blueFireFrames[0],transparent:true,alphaTest:0.05,depthWrite:false,fog:true
                    }));
                    flame.name = `altar-blue-fire:${x},${z}`;
                    flame.userData.visibilityEnabled = false;
                    flame.visible = false;
                    flame.position.set(posX,baseH+WALL_HEIGHT+0.73,posZ);
                    flame.scale.set(1.1,1.6,1);
                    scene.add(flame);
                    altarFlames.push(flame);
                    const altarTorch = {x:posX,z:posZ,y:baseH+WALL_HEIGHT+0.45,isBlue:true,isIndoor:false,
                        enabled:false,alwaysLit:true,color:0x69d8ff,distance:14,intensityScale:0.75,flickerRate:2.5,flickerDepth:0.4,gx:x,gz:z};
                    worldTorches.push(altarTorch);
                    altarFireTorches.push(altarTorch);
                }
            }

            if (type === 'TREE') {
                const rand = ((x * 31 + z * 17) % 100);
                dummy.position.set(posX, baseH + planeGeo.parameters.height / 2 - 0.5, posZ);
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
                const definition = registry.at(x, z);
                if (definition?.item === 'forest-heart') {
                    const vineShrine = createDryVineShrine(THREE, maderaTex, heldItemTextures.heart.image);
                    vineShrine.position.set(posX, getTerrainHeight(posX, posZ) - vineShrine.geometry.boundingBox.min.y, posZ);
                    vineShrine.rotation.y = definition?.rotationY ?? 0;
                    vineShrine.userData.gx = x;
                    vineShrine.userData.gz = z;
                    vineShrine.userData.id = definition?.id || `vine:${x},${z}`;
                    scene.add(vineShrine);
                    vineShrine.updateMatrixWorld(true);
                    // La luz no debe desaparecer cuando la niebla oculta el santuario:
                    // cambiar el número de luces recompila todos los materiales iluminados.
                    scene.attach(vineShrine.userData.heartLight);
                    solidInteractables.push(vineShrine);
                    interactables.push(vineShrine);
                    forestHeartShrine = vineShrine;
                } else {
                    const chestGeo = createChestGeometry(THREE);
                    const chestMat = new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8B4513, shininess: 0 });
                    const chestMetalMat = new THREE.MeshPhongMaterial({ color: 0x42464b, shininess: 18 });
                    const chestMesh = new THREE.Mesh(chestGeo, [chestMat, chestMetalMat]);
                    chestMesh.position.set(posX, getTerrainHeight(posX, posZ) - chestGeo.boundingBox.min.y, posZ);
                    chestMesh.rotation.y = definition?.rotationY ?? 0;
                    chestMesh.userData = { type: 'CHEST', gx: x, gz: z, id: definition?.id || `chest:${x},${z}`, item: definition?.item || 'key' };
                    // Preparar cuerpo, bisagra y buffers antes de la primera interacción.
                    chestMesh.userData.opening = createChestOpening(THREE, chestMesh);
                    if (chestMesh.userData.item === 'map') {
                        // SVG sin dimensiones intrínsecas: rasterizar una vez para WebGL.
                        const canvas = document.createElement('canvas');
                        canvas.width = canvas.height = 128;
                        const texture = new THREE.CanvasTexture(canvas);
                        const icon = new Image();
                        icon.onload = () => {
                            canvas.getContext('2d').drawImage(icon,0,0,128,128);
                            texture.needsUpdate = true;
                        };
                        icon.src = './imagenes/Sprites/mapa.svg';
                        texture.colorSpace = THREE.SRGBColorSpace;
                        const pickup = new THREE.Mesh(new THREE.PlaneGeometry(.48,.32),
                            new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.1,side:THREE.DoubleSide}));
                        pickup.name = 'map-inside-chest';
                        pickup.position.set(0,-.235,-.015);
                        pickup.rotation.x = -Math.PI/2 + .12;
                        pickup.userData = {type:'MAP_PICKUP',visibilityEnabled:false};
                        pickup.visible = false;
                        chestMesh.add(pickup); chestMesh.userData.mapPickup = pickup;
                    }

                    scene.add(chestMesh);
                    chestMesh.updateMatrixWorld(true);
                    solidInteractables.push(chestMesh);
                    interactables.push(chestMesh);
                }
            } else if (type === 'BOAT') {
                // Un marcador de dos celdas representa un único bote, centrado entre ambas.
                if (floorMap[z]?.[x - 1] === 'BOAT' || floorMap[z - 1]?.[x] === 'BOAT') continue;
                const horizontalBoat = floorMap[z]?.[x + 1] === 'BOAT';
                const pairedBoat = horizontalBoat || floorMap[z + 1]?.[x] === 'BOAT';
                const boatGeo = createBoatGeometry(THREE, BOAT_WIDTH);
                const boatMat = [
                    new THREE.MeshPhongMaterial({ map: maderaTex, color: 0xaa8866, shininess: 0 }),
                    new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x61452c, shininess: 0 })
                ];
                const boatMesh = new THREE.Mesh(boatGeo, boatMat);
                boatMesh.position.set(posX, BOAT_FLOAT_HEIGHT, posZ);
                if (pairedBoat) boatMesh.position[horizontalBoat ? 'x' : 'z'] += UNIT_SIZE / 2;
                boatMesh.rotation.y = (horizontalBoat ? Math.PI / 2 : 0) + Math.PI / 2;
                boatMesh.userData = { type: 'BOAT', gx: x, gz: z, floatPhase: (x * 0.73 + z * 0.41) % (Math.PI * 2) };
                boats.push(boatMesh);
                updateBoatFloating(boatMesh, boatFloatTime, BOAT_FLOAT_HEIGHT);
                scene.add(boatMesh);
                interactables.push(boatMesh);
            } else if (type === 'DOOR_UNLOCKED' || type === 'DOOR_LOCKED') {
                const isLocked = type === 'DOOR_LOCKED';
                const tintColor = isLocked ? 0xffbbbb : 0xffffff;
                
                // Determinar orientación basada en los edificios vecinos (horizontal o vertical)
                const opening = getDoorOpening(floorMap, x, z);
                const { isHorizontal, isRightDoor } = opening;
                const doorOverride = doorOverrides.find(definition => definition.position.x === x && definition.position.z === z);
                const hingeOnRight = doorOverride?.hinge === 'left' ? false : isRightDoor;
                
                // Determinar si es la hoja derecha de una puerta doble

                const doorGroup = new THREE.Group();
                doorGroup.position.set(posX + (isHorizontal?opening.centerOffset:0), baseH + DOOR_HEIGHT / 2, posZ + (isHorizontal?0:opening.centerOffset));
                
                const doorGeo = isHorizontal ? new THREE.BoxGeometry(opening.width, DOOR_HEIGHT, DOOR_THICKNESS) : new THREE.BoxGeometry(DOOR_THICKNESS, DOOR_HEIGHT, opening.width);
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
                    if (!hingeOnRight) mats = [matNormal, matNormal, matNormal, matNormal, matNormal, matFlipped];
                    else mats = [matNormal, matNormal, matNormal, matNormal, matFlipped, matNormal];
                } else {
                    if (!hingeOnRight) mats = [matFlipped, matNormal, matNormal, matNormal, matNormal, matNormal];
                    else mats = [matNormal, matFlipped, matNormal, matNormal, matNormal, matNormal];
                }
                
                const doorMesh = new THREE.Mesh(doorGeo, mats);
                
                // Desplazar el mesh para que el pivote quede en el borde
                if (isHorizontal) {
                    const offset = hingeOnRight ? -opening.width/2 : opening.width/2;
                    doorMesh.position.set(offset, 0, 0);
                    doorGroup.position.x -= offset;
                } else {
                    const offset = hingeOnRight ? -opening.width/2 : opening.width/2;
                    doorMesh.position.set(0, 0, offset);
                    doorGroup.position.z -= offset;
                }
                
                doorGroup.add(doorMesh);
                
                const swingDir = doorOverride?.openDirection === 'south' && isHorizontal
                    ? (hingeOnRight ? 1 : -1)
                    : (hingeOnRight ? -1 : 1);
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
                dummy.position.set(posX, baseH - (waterDeckMap[z][x] ? WATER_DECK_THICKNESS / 2 : 0.5), posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                if (waterDeckMap[z][x]) waterDeckMesh.setMatrixAt(waterDeckCount++, dummy.matrix);
                else maderaFloorMesh.setMatrixAt(idxMadera++, dummy.matrix);
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
    
    vegetationSectors = createInstanceSectors(THREE, [pino1Mesh, pino2Mesh, alamo1Mesh, alamo2Mesh, arau1Mesh, arau2Mesh, arbusto1Mesh, arbusto2Mesh, weed1Mesh, weed2Mesh, weed3Mesh], 64, 0.75);
    scene.add(vegetationSectors.group);
    surfaceVegetationFade = createVegetationVisibility(vegetationSectors.group,{value:1});
    scene.add(bldgMesh);
    lintelMesh.count = idxLintel;
    scene.add(lintelMesh);
    jambMesh.count = idxJamb;
    scene.add(jambMesh);
    ceilingMesh.count = idxCeil;
    falseCeilingMesh.count = idxFalseCeil;
    scene.add(mergeRoofBlocks(THREE, ceilingMesh));
    for (const piece of bedRoofPieces.values()) {
        piece.instanceMatrix.needsUpdate = true;
        scene.add(piece);
    }
    for (const piece of bedFalseCeilingPieces.values()) scene.add(piece);
    scene.add(falseCeilingMesh);
    if (bedDefinition && bedRoofPieces.size) {
        // Conservar tablas alrededor de una rotura irregular, con espesor visible desde abajo.
        const width = bedDefinition.size.x * UNIT_SIZE;
        const length = bedDefinition.size.z * UNIT_SIZE;
        const outline = new THREE.Shape();
        outline.moveTo(-width / 2, -length / 2);
        outline.lineTo(width / 2, -length / 2);
        outline.lineTo(width / 2, length / 2);
        outline.lineTo(-width / 2, length / 2);
        outline.closePath();
        const opening = new THREE.Path();
        BED_CEILING_OPENING.forEach(([x,z], index) => {
            if (index === 0) opening.moveTo(x,z);
            else opening.lineTo(x,z);
        });
        opening.closePath();
        outline.holes.push(opening);
        const brokenWood = new THREE.MeshPhongMaterial({ color: 0x65432b, shininess: 0, flatShading: true });
        const brokenCeiling = new THREE.ExtrudeGeometry(outline, { depth: 0.1, bevelEnabled: false, steps: 1, curveSegments: 1 });
        brokenCeiling.rotateX(Math.PI / 2);
        // Mismo tamaño, orientación y fase de textura que las caras inferiores de cada casilla.
        const ceilingPositions = brokenCeiling.attributes.position;
        const ceilingNormals = brokenCeiling.attributes.normal;
        const ceilingUvs = brokenCeiling.attributes.uv;
        for (const group of brokenCeiling.groups) {
            if (group.materialIndex !== 0) continue;
            for (let i = group.start; i < group.start + group.count; i++) {
                ceilingUvs.setXY(i,
                    ceilingPositions.getX(i) / UNIT_SIZE + bedDefinition.size.x / 2,
                    ceilingNormals.getY(i) > 0
                        ? 1 - bedDefinition.size.z / 2 - ceilingPositions.getZ(i) / UNIT_SIZE
                        : bedDefinition.size.z / 2 + ceilingPositions.getZ(i) / UNIT_SIZE);
            }
        }
        bedHoleRim = new THREE.Mesh(brokenCeiling, [ceilingMat, brokenWood]);
        bedHoleRim.position.set(
            (bedDefinition.position.x + (bedDefinition.size.x - 1) / 2) * UNIT_SIZE,
            roofBaseMap[bedDefinition.position.z][bedDefinition.position.x] + WALL_HEIGHT + 0.05,
            (bedDefinition.position.z + (bedDefinition.size.z - 1) / 2) * UNIT_SIZE
        );
        bedHoleRim.userData.visibilityEnabled = false;
        bedHoleRim.visible = false;
        scene.add(bedHoleRim);
        const atticAnt = createAtticAnt(THREE);
        const antHome = findAtticAntHome(THREE, atticAnt, atticSupport, mapWidth, UNIT_SIZE);
        if (antHome) {
            atticAnt.position.set(antHome.x, antHome.y, antHome.z);
            atticAnt.rotation.y = antHome.rotationY;
            scene.add(atticAnt);
            interactables.push(atticAnt);
        } else console.warn('No se encontró un rincón seguro para el bicho del entretecho.');
    }
    maderaFloorMesh.count = idxMadera;
    scene.add(maderaFloorMesh);
    waterDeckMesh.count = waterDeckCount;
    scene.add(waterDeckMesh);
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
    const wetSandWeights = new Float32Array(positions.length / 3);
    // El tablero mantiene su cota física; solo el terreno debajo baja al lecho acuático.
    const { floorMap: terrainFloorMap, elevations: terrainElevations, woodMap: terrainWoodMap } =
        createWaterDeckTerrain(floorMap, elevationMap, woodFloorMap, waterDeckMap, seaFloorHeights);
    const mountainWeights = new Float32Array(positions.length / 3 * 4);
    const terrainChannels = { OTHER: 3, DIRT: 1, SAND: 2, WET_SAND: 8, WATER: 2, BOAT: 2, WATER_ROCK: 5, MOUNTAIN: 4, PEAK: 5, SNOW_PEAK: 6 };
    const wetSandShoreMap = createWetSandShoreMap(terrainFloorMap, mapWidth, mapHeight);
    const slabGroundCells = new Uint8Array(mapWidth * mapHeight);
    const naturalShrineGround = new Uint8Array(mapWidth * mapHeight);
    for (const definition of entities) {
        if (definition.ground === 'SLAB') slabGroundCells[definition.position.z * mapWidth + definition.position.x] = 1;
        if (definition.ground === 'DIRT_STONE') {
            const {x, z} = definition.position;
            for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
                if (x+dx >= 0 && x+dx < mapWidth && z+dz >= 0 && z+dz < mapHeight)
                    naturalShrineGround[(z+dz)*mapWidth+x+dx] = 1;
            }
            // Incluir las losas del acceso conectadas al claro del corazón.
            const pending = [[x,z]], visited = new Set();
            while (pending.length) {
                const [cx,cz] = pending.pop();
                const key = cz*mapWidth+cx;
                if (visited.has(key) || cx < 0 || cx >= mapWidth || cz < 0 || cz >= mapHeight) continue;
                visited.add(key);
                if (Math.abs(cx-x) > 6 || Math.abs(cz-z) > 6) continue;
                if ((cx !== x || cz !== z) && floorMap[cz][cx] !== 'OTHER') continue;
                naturalShrineGround[key] = 1;
                pending.push([cx-1,cz],[cx+1,cz],[cx,cz-1],[cx,cz+1]);
            }
            // Repetir el acceso original a 90°, 180° y 270° alrededor del claro.
            const groundOffsets = [];
            for (let dz=-6; dz<=6; dz++) for (let dx=-6; dx<=6; dx++) {
                if (x+dx>=0 && x+dx<mapWidth && z+dz>=0 && z+dz<mapHeight
                    && naturalShrineGround[(z+dz)*mapWidth+x+dx]) groundOffsets.push([dx,dz]);
            }
            for (const [dx,dz] of groundOffsets) {
                for (const [rx,rz] of [[-dz,dx],[-dx,-dz],[dz,-dx]]) {
                    const cx=x+rx, cz=z+rz;
                    if (cx>=0 && cx<mapWidth && cz>=0 && cz<mapHeight)
                        naturalShrineGround[cz*mapWidth+cx]=1;
                }
            }
        }
    }
    // El marcador de bote conserva el fondo del agua que lo rodea.
    const caveBaseY = getTerrainVertexY(CAVE_ENTRY.x-2,CAVE_ENTRY.z,mapWidth,mapHeight,terrainFloorMap,terrainElevations,terrainWoodMap,mountainPathProfile);
    caveEntrance = createCaveEntrance(THREE,UNIT_SIZE,caveBaseY,rocaTex);
    scene.add(caveEntrance.group);
    solidInteractables.push(...caveEntrance.solids);
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
            if (naturalShrineGround[z * mapWidth + x]) {
                // Tierra con piedra integrada al terreno, sin bloques ni escalones.
                const stone = 0.2 + 0.15 * (0.5 + 0.5 * Math.sin(x * 2.3 + z * 1.7));
                splatWeights[i*4+1] += weight * (1-stone);
                splatWeights[i*4+3] += weight * stone;
                continue;
            }
            let channel = slabGroundCells[z * mapWidth + x] ? 3
                : floorMap[z][x] === 'CHEST' && !woodFloorMap[z][x] ? 1
                : boatBottomChannels.get(z * mapWidth + x) ?? terrainChannels[terrainFloorMap[z][x]] ?? 0;
            const seaCell = terrainFloorMap[z][x] === 'WATER' || (floorMap[z][x] === 'BOAT' && boatBottomChannels.get(z * mapWidth + x) === 2);
            if (seaCell && wetSandShoreMap[z][x]) channel = 8;
            if (seaCell && terrainElevations[z][x] <= -2.5) channel = 7;
            if (channel === 8) wetSandWeights[i] += weight;
            else if (channel < 4) splatWeights[i*4+channel] += weight;
            else mountainWeights[i*4+channel-4] += weight;
        }

        const y = getTerrainVertexY(colF, rowF, mapWidth, mapHeight, terrainFloorMap, terrainElevations, terrainWoodMap, mountainPathProfile);
        positions[i * 3 + 1] = caveEntrance.carveHeight(colF*UNIT_SIZE,rowF*UNIT_SIZE,y);
    }
    
    terrainGeo.setAttribute('splatWeights', new THREE.BufferAttribute(splatWeights, 4));
    terrainGeo.setAttribute('wetSandWeight', new THREE.BufferAttribute(wetSandWeights, 1));
    terrainGeo.setAttribute('mountainWeights', new THREE.BufferAttribute(mountainWeights, 4));

    for(let i = 0; i < uvs.length; i += 2) {
        uvs[i] *= (mapWidth - 1);
        uvs[i+1] *= (mapHeight - 1);
    }
    
    terrainGeo.computeVertexNormals();
    terrainHeightSamples = { positions, verticesW: vertsW, segmentsW, segmentsH, subdivisions: SUBDIVISIONS };

    // --- MATERIAL SPlAT COMPARTIDO POR TODO EL TERRENO ---
    const splatMaterial = new THREE.MeshPhongMaterial({ map: pastoTex, shininess: 0, transparent: true, depthWrite: true }); // Fundido continuo contra el cielo, sin trama de recorte.
    splatMaterial.onBeforeCompile = function (shader) {
        shader.uniforms.tGrass = { value: pastoTex };
        shader.uniforms.tDirt = { value: tierraTex };
        shader.uniforms.tSand = { value: arenaTex };
        shader.uniforms.tWetSand = { value: arenaMojadaTex };
        shader.uniforms.terrainWaterHeight = { value: WATER_SURFACE_HEIGHT };
        shader.uniforms.tSeabed = { value: fondoTex };
        shader.uniforms.tMountain = { value: piedraTex };
        shader.uniforms.tRock = { value: rocaTex };
        shader.uniforms.tSnow = { value: nieveTex };
        shader.uniforms.tSlab = { value: losaTex };
        shader.uniforms.mountainFogScale = { value: WORLD_VISIBILITY_DISTANCE / MOUNTAIN_VISIBILITY_DISTANCE };
        shader.uniforms.terrainVisibilityDistance = { value: WORLD_VISIBILITY_DISTANCE };

        shader.vertexShader = `
            attribute vec4 splatWeights;
            attribute float wetSandWeight;
            varying float vWetSand;
            varying float vTerrainHeight;
            attribute vec4 mountainWeights;
            varying vec4 vSplat;
            varying vec4 vMountain;
            ${shader.vertexShader}
        `.replace(
            `#include <uv_vertex>`,
            `#include <uv_vertex>
             vSplat = splatWeights;
             vWetSand = wetSandWeight;
             vMountain = mountainWeights;`
        ).replace('#include <begin_vertex>',
            '#include <begin_vertex>\nvTerrainHeight = (modelMatrix * vec4(transformed, 1.0)).y;');

        shader.fragmentShader = `
            uniform sampler2D tGrass;
            uniform sampler2D tDirt;
            uniform sampler2D tSand;
            uniform sampler2D tWetSand;
            varying float vWetSand;
            uniform float terrainWaterHeight;
            varying float vTerrainHeight;
            uniform sampler2D tSeabed;
            uniform sampler2D tMountain;
            uniform sampler2D tRock;
            uniform sampler2D tSnow;
            uniform sampler2D tSlab;
            uniform float mountainFogScale;
            uniform float terrainVisibilityDistance;
            varying vec4 vSplat;
            varying vec4 vMountain;
            ${shader.fragmentShader}
        `.replace(
            `#include <map_fragment>`, getTerrainTextureBlend(renderer.capabilities.isWebGL2)
        ).replace('#include <alphahash_fragment>', `
            #ifdef USE_FOG
                float terrainMountainPresence = max(clamp(vMountain.x + vMountain.y + vMountain.z, 0.0, 1.0),
                    smoothstep(3.0, 10.0, vTerrainHeight));
                float terrainFadeLimit = terrainVisibilityDistance / mix(1.0, mountainFogScale, terrainMountainPresence);
                // Disolver la silueta contra el cielo antes de retirar los sectores completos.
                float terrainFadeStart = terrainFadeLimit * mix(0.7, 0.6, terrainMountainPresence);
                diffuseColor.a *= 1.0 - smoothstep(terrainFadeStart, terrainFadeLimit, vFogDepth);
            #endif
            if (diffuseColor.a <= 0.0001) discard;
        `).replace('#include <fog_fragment>', `
            #ifdef USE_FOG
                float mountainPresence = max(clamp(vMountain.x + vMountain.y + vMountain.z, 0.0, 1.0),
                    smoothstep(3.0, 10.0, vTerrainHeight));
                float terrainFogScale = mix(1.0, mountainFogScale, mountainPresence);
                ${THREE.ShaderChunk.fog_fragment.replaceAll('vFogDepth', '(vFogDepth * terrainFogScale)')}
            #endif
        `);
    };

    heartVision.apply(THREE, splatMaterial, true);
    const terrainSectors = createTerrainSectors(THREE, terrainGeo, splatMaterial, segmentsW, segmentsH);
    for (const sector of terrainSectors.children) {
        // Dibujar después del cielo y antes de agua/vegetación, conservando la oclusión del suelo.
        sector.renderOrder = -0.1;
        if (sector.userData.hasMountain) sector.userData.fogDistanceMultiplier = MOUNTAIN_VISIBILITY_DISTANCE / WORLD_VISIBILITY_DISTANCE;
    }
    scene.add(terrainSectors);
    const slabCells = [];
    for (let z = 0; z < mapHeight; z++) for (let x = 0; x < mapWidth; x++) {
        if (!naturalShrineGround[z * mapWidth + x] && (floorMap[z][x] === 'OTHER' || slabGroundCells[z * mapWidth + x])) slabCells.push([x,z]);
    }
    const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(UNIT_SIZE, SLAB_HEIGHT, UNIT_SIZE),
        new THREE.MeshPhongMaterial({ map: losaTex, shininess: 0 }), slabCells.length);
    const slabTransform = new THREE.Object3D();
    const altarOuterHeights = slabCells.filter(([x,z])=>altarDistance(x,z)===seaHeartAltar.radius)
        .map(([x,z])=>sampleTerrainHeight(x*UNIT_SIZE,z*UNIT_SIZE,mapWidth,mapHeight,floorMap,elevationMap,woodFloorMap,mountainPathProfile,terrainHeightSamples))
        .sort((a,b)=>a-b);
    const altarBase = altarOuterHeights[Math.floor(altarOuterHeights.length/2)] ?? 0;
    const altarTop = altarBase + seaHeartAltar.radius * seaHeartAltar.stepHeight;
    slabCells.forEach(([x,z],index) => {
        const worldX=x*UNIT_SIZE, worldZ=z*UNIT_SIZE;
        const distance=altarDistance(x,z);
        const inAltar=distance<=seaHeartAltar.radius;
        const bottom=inAltar ? altarBase : sampleTerrainHeight(worldX,worldZ,mapWidth,mapHeight,floorMap,elevationMap,woodFloorMap,mountainPathProfile,terrainHeightSamples);
        const height=inAltar ? (seaHeartAltar.radius+1-distance)*seaHeartAltar.stepHeight : SLAB_HEIGHT;
        slabTransform.scale.set(1,height/SLAB_HEIGHT,1);
        slabTransform.position.set(worldX,bottom+height/2,worldZ);
        slabTransform.updateMatrix();
        slabs.setMatrixAt(index,slabTransform.matrix);
        slabTops.set(z*mapWidth+x,bottom+height);
        if (slabGroundCells[z * mapWidth + x]) {
            const chest = solidInteractables.find(object => object.userData.type === 'CHEST' && object.userData.gx === x && object.userData.gz === z);
            if (chest) {
                chest.position.y = bottom + SLAB_HEIGHT - chest.geometry.boundingBox.min.y;
                chest.updateMatrixWorld(true);
            }
        }
    });
    const altarNeighborTops = [[-1,0],[1,0],[0,-1],[0,1]]
        .map(([dx,dz])=>slabTops.get((seaHeartAltar.center.z+dz)*mapWidth+seaHeartAltar.center.x+dx))
        .filter(height=>height!==undefined).sort((a,b)=>a-b);
    const altarCenterTop = altarNeighborTops[Math.floor(altarNeighborTops.length/2)] ?? altarTop;
    altarWaterHeight = altarCenterTop;
    const altarWaterGeometry = new THREE.PlaneGeometry(UNIT_SIZE,UNIT_SIZE);
    const altarWaterUv = altarWaterGeometry.attributes.uv;
    for(let i=0;i<altarWaterUv.count;i++) altarWaterUv.setXY(i,
        (seaHeartAltar.center.x+altarWaterUv.getX(i))/mapWidth,
        (mapHeight-seaHeartAltar.center.z-1+altarWaterUv.getY(i))/mapHeight);
    const altarWater = new THREE.Mesh(altarWaterGeometry,aguaFloorMat);
    altarWater.name = 'sea-heart-altar-water';
    altarWater.rotation.x = -Math.PI/2;
    altarWater.position.set(seaHeartAltar.center.x*UNIT_SIZE,altarWaterHeight,seaHeartAltar.center.z*UNIT_SIZE);
    scene.add(altarWater);
    raisedWaterCell.value.set(altarWater.position.x,altarWater.position.z,UNIT_SIZE/2,altarWaterHeight);
    slabs.name='slab-blocks';
    slabs.computeBoundingSphere();
    scene.add(slabs);
    terrainGeo.dispose(); // Los sectores conservan los atributos compartidos; la malla global ya no se dibuja.

    const wreckMaterials = [
        new THREE.MeshPhongMaterial({map:maderaTex,color:0x80654b,shininess:0}),
        new THREE.MeshPhongMaterial({color:0x51483b,shininess:8}),
        new THREE.MeshPhongMaterial({color:0xdbd1ae,shininess:0}),
        new THREE.MeshPhongMaterial({color:0x9c4234,shininess:0}),
        new THREE.MeshPhongMaterial({color:0xa58a58,shininess:0})
    ];
    for (const definition of shipwreckProps) {
        const {x,z} = definition.position;
        const wreck = new THREE.Mesh(createShipwreckGeometry(THREE,definition.model),wreckMaterials);
        wreck.name = definition.id;
        wreck.rotation.y = definition.rotationY;
        wreck.position.set(x * UNIT_SIZE,getTerrainHeight(x * UNIT_SIZE,z * UNIT_SIZE) + 0.01,z * UNIT_SIZE);
        scene.add(wreck);
    }

    const shipGeometry = createSunkenShipGeometry(THREE);
    const shipX = (sunkenShip.bounds.minX + sunkenShip.bounds.maxX) / 2 * UNIT_SIZE;
    const shipZ = (sunkenShip.bounds.minZ + sunkenShip.bounds.maxZ) / 2 * UNIT_SIZE;
    const shipBottom = getTerrainHeight(shipX,shipZ) - sunkenShip.burial;
    const submergedShip = new THREE.Mesh(shipGeometry,[
        new THREE.MeshPhongMaterial({map:maderaTex,color:0x74644c,shininess:0}),
        new THREE.MeshPhongMaterial({color:0x65513d,shininess:4}),
        new THREE.MeshPhongMaterial({color:0xa59b7c,shininess:0})
    ]);
    submergedShip.name = sunkenShip.id;
    submergedShip.rotation.y = sunkenShip.rotationY;
    submergedShip.position.set(shipX,Math.min(shipBottom,WATER_SURFACE_HEIGHT - 0.15 - shipGeometry.boundingBox.max.y),shipZ);
    scene.add(submergedShip);

    const helmetGeometry = createDivingHelmetGeometry(THREE);
    const helmet = new THREE.Mesh(helmetGeometry, [
        new THREE.MeshPhongMaterial({ color: 0x9f7542, shininess: 22, flatShading: true }),
        new THREE.MeshPhongMaterial({ color: 0xc39b58, shininess: 28, flatShading: true }),
        new THREE.MeshPhongMaterial({ color: 0x153139, shininess: 45 }),
        new THREE.MeshPhongMaterial({ color: 0x516c5d, shininess: 10, flatShading: true })
    ]);
    const helmetX = divingHelmet.position.x * UNIT_SIZE;
    const helmetZ = divingHelmet.position.z * UNIT_SIZE;
    helmet.name = divingHelmet.id;
    helmet.userData = { type: 'DIVING_HELMET', gx: divingHelmet.position.x, gz: divingHelmet.position.z };
    helmet.rotation.set(divingHelmet.rotationX, divingHelmet.rotationY, divingHelmet.rotationZ, divingHelmet.rotationOrder);
    const helmetRotatedBounds = helmetGeometry.boundingBox.clone().applyMatrix4(
        new THREE.Matrix4().makeRotationFromEuler(helmet.rotation));
    const helmetBurial = (helmetRotatedBounds.max.y - helmetRotatedBounds.min.y) * divingHelmet.burialFraction;
    helmet.position.set(helmetX, getTerrainHeight(helmetX, helmetZ) - helmetBurial - helmetRotatedBounds.min.y, helmetZ);
    scene.add(helmet);
    interactables.push(helmet);

    seaHeart = createSeaHeart(prepared.seaHeartFragments, floorMap, divingHelmet.position,
        UNIT_SIZE, MOVEMENT_SPEED * DIVING_WATER_SPEED_MOD / FRICTION, seaHeartAltar.center);
    const fragmentTexture = texLoader.load('./imagenes/Sprites/fragmento-mar.png');
    fragmentTexture.colorSpace = THREE.SRGBColorSpace;
    fragmentTexture.magFilter = fragmentTexture.minFilter = THREE.NearestFilter;
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 64;
    const glowContext = glowCanvas.getContext('2d');
    const glowGradient = glowContext.createRadialGradient(32,32,0,32,32,32);
    glowGradient.addColorStop(0,'rgba(255,255,255,0.6)');
    glowGradient.addColorStop(0.25,'rgba(255,255,255,0.3)');
    glowGradient.addColorStop(1,'rgba(255,255,255,0)');
    glowContext.fillStyle = glowGradient;
    glowContext.fillRect(0,0,64,64);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMaterial = new THREE.SpriteMaterial({ map:glowTexture,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending,fog:true });
    glowMaterial.onBeforeCompile = shader => {
        // El resplandor atraviesa más niebla y se desvanece sin teñirse de azul.
        shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>',`
            #ifdef USE_FOG
                #ifdef FOG_EXP2
                    float glowFogDepth = vFogDepth * 0.55;
                    float glowVisibility = exp(-fogDensity * fogDensity * glowFogDepth * glowFogDepth);
                #else
                    float glowVisibility = 1.0 - smoothstep(fogNear,fogFar,vFogDepth * 0.55);
                #endif
                gl_FragColor.a *= glowVisibility;
            #endif`);
    };
    glowMaterial.customProgramCacheKey = () => 'sea-heart-glow-distance-v1';
    for (const point of prepared.seaHeartFragments) {
        const fragment = new THREE.Sprite(new THREE.SpriteMaterial({
            map: fragmentTexture, transparent: true, alphaTest: 0.1, depthWrite: false, fog: true
        }));
        fragment.name = point.id;
        const number = seaHeart.route.find(p=>p.id===point.id).number;
        fragment.userData = { type: 'SEA_HEART_FRAGMENT', id: point.id, gx: point.x, gz: point.z, number, visibilityEnabled:false, fogDistanceMultiplier:2 };
        const fragmentHalfHeight = 0.081 / 2;
        fragment.position.set(point.x * UNIT_SIZE, getTerrainHeight(point.x * UNIT_SIZE, point.z * UNIT_SIZE) + fragmentHalfHeight, point.z * UNIT_SIZE);
        if(point.x===seaHeartAltar.center.x && point.z===seaHeartAltar.center.z) fragment.position.y=altarCenterTop+fragmentHalfHeight;
        // El fragmento se reduce; el halo conserva su tamaño independiente.
        fragment.scale.set(0.081, 0.081, 1);
        const glow = new THREE.Sprite(glowMaterial);
        glow.raycast = () => {}; // El halo no sustituye al fragmento como objetivo.
        glow.scale.set(18.75,18.75,1);
        glow.userData.fogDistanceMultiplier = 2;
        fragment.add(glow);
        scene.add(fragment);
        seaHeartSprites.set(point.id,fragment);
    }
    // Una luz reutilizada: solo el fragmento pendiente emite, sin sombras adicionales.
    seaHeartLight = new THREE.PointLight(0xffffff, 0, 32, 2);
    seaHeartLight.name = 'sea-heart-fragment-light';
    scene.add(seaHeartLight);
    revealNextSeaHeartFragment();

    for (const definition of furniture) {
        if (!['BED', 'SIDE_TABLE', 'BARREL', 'BOOKSHELF', 'TABLE', 'CHAIR', 'WARDROBE', 'DESK', 'CRATE_STACK', 'SHELF', 'DRESSER', 'BARREL_STACK', 'LOG_STACK', 'WORKBENCH', 'STUMP', 'ANTIQUE_STOVE', 'WOOD_STOVE', 'SPICE_SHELF', 'BEACH_PLANK_TABLE', 'RUSTIC_BEACH_CHAIR'].includes(definition.type)) continue;
        const { position, size } = definition;
        const allowedGround = ['LOG_STACK', 'WORKBENCH', 'STUMP', 'BEACH_PLANK_TABLE', 'RUSTIC_BEACH_CHAIR'].includes(definition.type)
            ? ['INDOOR_FLOOR', 'WOOD', 'GRASS', 'DIRT', 'SAND', 'WET_SAND'] : ['INDOOR_FLOOR', 'WOOD'];
        for (let z = position.z; z < position.z + size.z; z++) for (let x = position.x; x < position.x + size.x; x++) {
            if (!allowedGround.includes(floorMap[z]?.[x])) throw new Error(`El mueble ${definition.id} requiere suelo compatible en (${x},${z}).`);
        }
        const x = (position.x + (size.x - 1) / 2) * UNIT_SIZE + (definition.offset?.x ?? 0);
        const z = (position.z + (size.z - 1) / 2) * UNIT_SIZE + (definition.offset?.z ?? 0);
        const isBed = definition.type === 'BED';
        const model = new THREE.Mesh(definition.type === 'BEACH_PLANK_TABLE' ? createBeachPlankTableGeometry(THREE) : definition.type === 'RUSTIC_BEACH_CHAIR' ? createRusticBeachChairGeometry(THREE) : definition.type === 'SPICE_SHELF' ? createSpiceShelfGeometry(THREE) : definition.type === 'WOOD_STOVE' ? createWoodStoveGeometry(THREE) : definition.type === 'ANTIQUE_STOVE' ? createAntiqueStoveGeometry(THREE) : definition.type === 'STUMP' ? createStumpGeometry(THREE) : definition.type === 'WORKBENCH' ? createWorkbenchGeometry(THREE) : definition.type === 'LOG_STACK' ? createLogStackGeometry(THREE) : isBed ? createBedGeometry(THREE) : definition.type === 'BARREL' ? createBarrelGeometry(THREE) : definition.type === 'BOOKSHELF' ? createBookshelfGeometry(THREE) : definition.type === 'TABLE' ? createTableGeometry(THREE) : definition.type === 'CHAIR' ? createChairGeometry(THREE) : definition.type === 'WARDROBE' ? createWardrobeGeometry(THREE) : definition.type === 'DESK' ? createDeskGeometry(THREE) : definition.type === 'CRATE_STACK' ? createCrateStackGeometry(THREE) : definition.type === 'SHELF' ? createShelfGeometry(THREE) : definition.type === 'DRESSER' ? createDresserGeometry(THREE) : definition.type === 'BARREL_STACK' ? createBarrelStackGeometry(THREE) : createSideTableGeometry(THREE), isBed ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0xd8ceb3, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0x40566b, shininess: 0 })
        ] : ['BEACH_PLANK_TABLE', 'RUSTIC_BEACH_CHAIR'].includes(definition.type) ? [
            new THREE.MeshPhongMaterial({map:maderaTex,color:0xffffff,vertexColors:true,shininess:0,flatShading:true})
        ] : definition.type === 'SPICE_SHELF' ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x987448, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0x4e7135, shininess: 0, side: THREE.DoubleSide }),
            new THREE.MeshPhongMaterial({ color: 0x68754c, shininess: 36, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x95602e, shininess: 36, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x896341, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0xd4c79c, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0x785030, shininess: 0, side: THREE.DoubleSide })
        ] : definition.type === 'WOOD_STOVE' ? [
            new THREE.MeshPhongMaterial({ color: 0x25292b, shininess: 18, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x727a78, shininess: 45, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: true, shininess: 0, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x1c302c, transparent: true, opacity: 0.18, shininess: 65, side: THREE.DoubleSide, depthWrite: false })
        ] : definition.type === 'ANTIQUE_STOVE' ? [
            new THREE.MeshPhongMaterial({ color: 0xd5ca78, shininess: 28, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x262a29, shininess: 16, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x92958c, shininess: 40, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x55564b, shininess: 8, flatShading: true })
        ] : definition.type === 'STUMP' ? [
            new THREE.MeshPhongMaterial({ color: 0xc3a372, shininess: 0 }),
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x594333, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0x866340, shininess: 0 })
        ] : definition.type === 'WORKBENCH' ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x987448, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0x45433e, shininess: 12 }),
            new THREE.MeshPhongMaterial({ color: 0xd7dce0, specular: 0xb8c2cc, shininess: 48 })
        ] : definition.type === 'LOG_STACK' ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0xc6a46e, shininess: 0 }),
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x594333, shininess: 0 })
        ] : definition.type === 'BOOKSHELF' ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            ...[0x783d32, 0x354e65, 0x486044, 0x716044].map(color => new THREE.MeshPhongMaterial({ color, shininess: 0 }))
        ] : [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: definition.type === 'CRATE_STACK' ? 0x55351f : 0x555555, shininess: 12 })
        ]);
        const furnitureScale = FURNITURE_SCALE * (definition.type === 'ANTIQUE_STOVE' ? 0.9 : 1);
        model.geometry.scale(furnitureScale, furnitureScale, furnitureScale);
        model.geometry.computeBoundingBox();
        model.geometry.computeBoundingSphere();
        model.name = definition.id;
        model.rotation.y = definition.rotationY ?? 0;
        model.position.set(x, getTerrainHeight(x, z) + (definition.offset?.y ?? 0), z);
        model.userData = { type: definition.type, id: definition.id, gx: position.x, gz: position.z };
        if (definition.type === 'WOOD_STOVE') {
            const pipeAt = new THREE.Vector3(0,0,-0.14).multiplyScalar(furnitureScale).applyEuler(model.rotation).add(model.position);
            const roofLimit = atticSupport?.upperLimit(pipeAt.x, pipeAt.z);
            // Superar la cubierta escalonada sin modificarla ni abrir un paso para el jugador.
            const pipeTop = Number.isFinite(roofLimit)
                ? Math.max(5.15, (roofLimit + 0.2 + roofStepHeight + 1 - model.position.y) / furnitureScale)
                : 5.15;
            const pipe = new THREE.Mesh(createWoodStovePipeGeometry(THREE, pipeTop), model.material[0]);
            pipe.name = definition.id + '-pipe';
            pipe.scale.setScalar(furnitureScale);
            model.add(pipe);
        }
        if (definition.id === 'graham-table') {
            const mateSet = createMateSet(THREE);
            mateSet.scale.setScalar(FURNITURE_SCALE);
            model.add(mateSet);
            for (const object of mateSet.children) { object.userData.type = 'MATE_SET'; interactables.push(object); }
        }
        scene.add(model);
        model.updateMatrixWorld(true);
        solidInteractables.push(model);
        if (definition.id === 'graham-stump') interactables.push(model);
    }

    const garden = createKitchenGarden(THREE, {
        x: kitchenGardenPosition.x * UNIT_SIZE, z: kitchenGardenPosition.z * UNIT_SIZE
    }, getTerrainHeight);
    for (const model of garden) {
        scene.add(model);
        model.updateMatrixWorld(true);
        solidInteractables.push(model);
    }

    const fenceMaterial = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 0 });
    const fenceLocations = new Set(prepared.fenceCells.map(({ x, z }) => `${x},${z}`));
    for (const { x, z } of prepared.fenceCells) {
        const east = fenceLocations.has(`${x + 1},${z}`);
        const south = fenceLocations.has(`${x},${z + 1}`);
        const fence = new THREE.Mesh(createWoodFenceGeometry(THREE, east, south), fenceMaterial);
        fence.name = `wood-fence:${x},${z}`;
        fence.position.set(x * UNIT_SIZE, getTerrainHeight(x * UNIT_SIZE, z * UNIT_SIZE), z * UNIT_SIZE);
        fence.userData = { type: 'FENCE', gx: x, gz: z };
        scene.add(fence);
        fence.updateMatrixWorld(true);
        solidInteractables.push(fence);
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
    
    const grahamX = grahamPosition.x * UNIT_SIZE + (grahamPosition.offset?.x ?? 0);
    const grahamZ = grahamPosition.z * UNIT_SIZE + (grahamPosition.offset?.z ?? 0);
    const grahamY = getTerrainHeight(grahamX, grahamZ) + GRAHAM_HEIGHT / 2;

    // Generar al NPC Graham como un Billboard 3D iluminable (MeshPhongMaterial)
    const grahamGeo = new THREE.PlaneGeometry(0.8 * GRAHAM_HEIGHT / 1.9, GRAHAM_HEIGHT);
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
    
    // Mantener solo los marcadores hasta la primera inmersión.
    underwaterPlantDefinitions = prepared.underwaterPlants;

    // Agrupar también los bloques estáticos para descartar partes ocultas, no edificios enteros.
    const structureMeshes = scene.children.filter(object => object.isInstancedMesh);
    structureSectors = createInstanceSectors(THREE, structureMeshes, 32, 0);
    structureSectors.group.name = 'structure-sectors';
    scene.add(structureSectors.group);
    fogCulling = createFogCulling(THREE, scene, [skyMesh, sunFlare.object, camera], FOG_RESIDUAL);
    prepareInactiveLights(THREE, scene);
    fogCulling.register();
    heartHalos = createHeartHalos(THREE, scene, floorMap, UNIT_SIZE, getTerrainHeight);
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
    grahamSprite.position.y = getTerrainHeight(grahamSprite.position.x, grahamSprite.position.z) + grahamSprite.geometry.parameters.height * ((bottom + 1) / image.height - 0.5);
}

function getTerrainHeight(x, z) {
    if (caveMap?.active && caveMap.contains(x,z)) return caveMap.getHeight(x,z);
    if (caveEntrance?.contains(x,z)) return caveEntrance.baseY + 0.025;
    const gx=Math.floor((x+UNIT_SIZE/2)/UNIT_SIZE),gz=Math.floor((z+UNIT_SIZE/2)/UNIT_SIZE);
    const top=slabTops.get(gz*mapWidth+gx);
    if(gx>=0&&gz>=0&&gx<mapWidth&&gz<mapHeight&&top!==undefined) return top;
    return sampleTerrainHeight(x, z, mapWidth, mapHeight, floorMap, elevationMap, woodFloorMap, mountainPathProfile, terrainHeightSamples);
}

// --- COLISIONES ---
function updatePlayerPosture() {
    if (isCrouching === crouchRequested) return;
    const player = controls.getObject();
    if (!isFlying && !isRidingBoat) {
        const previousHeight = isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
        const nextHeight = crouchRequested ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
        const feetY = player.position.y - previousHeight;
        const nextY = feetY + nextHeight;
        if (!crouchRequested) {
            const gx = Math.floor((player.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
            const gz = Math.floor((player.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
            const cell = atticSupport?.cellAt(player.position.x, player.position.z);
            const inAttic = bedCeilingHoleOpen && cell && (feetY >= cell.top - 0.08
                || atticSupport.fitsOpening(player.position.x, player.position.z));
            const floor = floorMap[gz]?.[gx];
            let limit = Infinity;
            if (inAttic) limit = atticSupport.upperLimit(player.position.x, player.position.z);
            else if (['INDOOR_FLOOR','DOOR_UNLOCKED','DOOR_LOCKED'].includes(floor)) {
                limit = getTerrainHeight(player.position.x, player.position.z)
                    + (floor === 'INDOOR_FLOOR' ? WALL_HEIGHT : DOOR_HEIGHT) - 0.3;
            }
            // Si no cabe, conservar la postura hasta salir de debajo del obstáculo.
            if (nextY > limit + 0.01) return;
        }
        // Cambiar la altura de los ojos, nunca la cota de los pies ni el impulso vertical.
        player.position.y = nextY;
    }
    isCrouching = crouchRequested;
}

function treeCanopyHeight(x, z) { return getTerrainHeight(x, z) + TREE_SPRITE_HEIGHT - 0.5; }

function isWall(x, z) {
    if (caveMap?.active) return caveMap.isWall(x,z);
    if (caveEntrance?.contains(x,z)) return false;
    const controlObj = controls.getObject();
    const eyeHeight = isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
    const atticCell = atticSupport?.cellAt(controlObj.position.x, controlObj.position.z);
    if (!isRidingBoat && bedCeilingHoleOpen && atticCell && (controlObj.position.y > atticCell.bottom || velocityY > 0)
        && (controlObj.position.y - eyeHeight >= atticCell.top - 0.08
            || atticSupport.fitsOpening(controlObj.position.x, controlObj.position.z))) {
        return atticSupport.blocksMovement(x,z,controlObj.position.y,eyeHeight);
    }
    return hasObstacle(isRidingBoat ? x - boatSeatOffset.x : x,
        isRidingBoat ? z - boatSeatOffset.z : z,
        mapWidth, mapHeight, collisionMap, floorMap, isRidingBoat, solidInteractables, boatReference,
        controlObj.position.y - eyeHeight, heartLevitationHeight > 0.15 ? treeCanopyHeight : null);
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
const OUTDOOR_STEP_FLOORS = new Set(['DIRT', 'GRASS', 'SAND', 'WET_SAND', 'TREE', 'BUSH', 'TALL_GRASS', 'EXTERNAL_TORCH', 'CHEST']);
const WALKING_STEP_ACCENTS = [1, 0.65];
const walkingRhythm = createWalkingRhythm();

let stamina = STAMINA_MAX;

window.restartGame = () => {
    woodcutting.finish();
    if (grahamDap.active) { grahamDap.cancel(); controls.pointerSpeed = dapPointerSpeed; }
    bedBounceActive = false;
    bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
    bedBounceHitCeiling = false;
    bedCeilingHits = 0;
    jumpHeld = false;
    bedCeilingTimer = 0;
    crouchRequested = isCrouching = false;
    isDead = false;
    stamina = STAMINA_MAX;
    divingAir.reset();
    const controlObj = controls.getObject();
    controlObj.position.set(playerStartX * UNIT_SIZE, PLAYER_HEIGHT, playerStartZ * UNIT_SIZE);
    hud.hideDeath();
    hud.hideStamina();
    hud.hideDivingAir();
    resumeGame();
};

const FRAME_INTERVAL = 1000 / 30;
let nextFrame = 0;
let previousRenderedTimestamp;
function animate(timestamp = performance.now()) {
    requestAnimationFrame(animate);
    if (timestamp + 0.1 < nextFrame) return;
    const frameStart = performancePanel ? performance.now() : 0;
    nextFrame += FRAME_INTERVAL;
    if (nextFrame <= timestamp) nextFrame = timestamp + FRAME_INTERVAL;
    // Tiempo propio de la cámara: el reloj del agua y el límite de física no lo alteran.
    // Se actualiza también en pausa, para no incorporar ese intervalo al reanudar.
    const cameraDelta = previousRenderedTimestamp === undefined ? 0 : Math.max(0, (timestamp - previousRenderedTimestamp) / 1000);
    previousRenderedTimestamp = timestamp;

    const controlObj = controls.getObject();
    touchControls?.syncDialogue(controls.isLocked && !isDead && (isDialogOpen || spawnGreeting.active));
    let vegetationDelta = 0;

    if (grahamSprite) {
        grahamSprite.rotation.y = Math.atan2(controlObj.position.x - grahamSprite.position.x, controlObj.position.z - grahamSprite.position.z);
    }
    skyMesh.position.set(controlObj.position.x, 200, controlObj.position.z);
    daySkyMesh.position.y = controlObj.position.y - 200;
    nightSkyMesh.position.y = dawnSkyMesh.position.y = duskSkyMesh.position.y = daySkyMesh.position.y; // Horizonte del atlas a la altura de los ojos.

    if (controls.isLocked && mapLoaded && !caveTransitionPending) {
        previousPlayerPosition.copy(controlObj.position);
        if (handTorchEnabled && isPlayerUnderwater()) setHandTorchEnabled(false);
        const rawDelta = clock.getDelta();
        const delta = Math.min(rawDelta, 0.1);
        vegetationDelta = delta;
        grahamDap.update(delta);
        underwaterViewTime.value += delta;
        if (seaHeartLight && seaHeart?.next) {
            const fragment = seaHeartSprites.get(seaHeart.next.id);
            const elapsed = fragment.userData.haloWaitingForDive ? 0 : underwaterViewTime.value - fragment.userData.haloStartedAt;
            const pulse = 0.5 - 0.5 * Math.cos(elapsed * (Math.PI * 2 / 4.5));
            const glow = fragment.children[0];
            if (glow) {
                const size = 18.75 * (0.15 + 0.85 * pulse);
                glow.scale.set(size,size,1);
            }
            seaHeartLight.intensity = 2.4 + 1.2 * pulse;
        }
        boatFloatTime += delta;
        for (const boat of boats) updateBoatFloating(boat, boatFloatTime, BOAT_FLOAT_HEIGHT);
        camera.getWorldPosition(seaHeartListenerPosition);
        camera.getWorldQuaternion(seaHeartListenerRotation).invert();
        seaHeartSoundRelative.copy(seaHeartSoundPosition).sub(seaHeartListenerPosition)
            .applyQuaternion(seaHeartListenerRotation);
        musicEvents.setUnderwaterPosition(seaHeartSoundRelative.x, seaHeartSoundRelative.y, seaHeartSoundRelative.z);
        musicEvents.update(delta);
        if (mapChestSoundSource) {
            if (musicEvents.isChestUnlockPlaying()) musicEvents.updateChestUnlockPosition(getMapChestSoundPosition());
            else mapChestSoundSource = null;
        }
        if (forestHeartShrine && heartQuest.stage === 'searching') {
            // Coordenadas relativas al oído: no alterar el listener compartido de la música.
            forestHeartShrine.userData.heartLight.getWorldPosition(heartBeaconPosition);
            heartBeaconPosition.sub(camera.getWorldPosition(frameCameraDirection));
            heartBeaconPosition.applyQuaternion(camera.getWorldQuaternion(heartBeaconCameraRotation).invert());
            musicEvents.updateForestHeartBeacon(heartBeaconPosition);
        } else musicEvents.updateForestHeartBeacon(null);
        const running = isRunning && !musicEvents.isEventActive('forest');
        heartVision.update(delta, musicEvents.isEventActive('forest'), musicEvents.getForestEnergy(),
            musicEvents.getEventTimeRemaining('forest'));

        heartHalos?.update(delta, controlObj.position, heartVision.uniforms);
        const doors = solidInteractables.filter(object => object.userData.type === 'DOOR');
        updateDoorAnimations(doors, delta, () => {
            const position = controlObj.position;
            const beforeX = position.x, beforeZ = position.z;
            const backward = camera.getWorldDirection(frameCameraDirection).negate();
            // Comprobar todas las hojas, también después de un primer empuje.
            for (let attempt = 0; attempt <= doors.length; attempt++) {
                const result = pushPlayerFromMovingDoors(position, backward, doors, isWall);
                if (result.blocked || (result.moved && (woodcutting.active || attempt === doors.length))) {
                    position.x = beforeX; position.z = beforeZ;
                    return false;
                }
                if (!result.moved) return true;
                velocity.set(0, 0, 0);
            }
            return true;
        });
        for (let i = chestOpenings.length - 1; i >= 0; i--) {
            if (chestOpenings[i].update(delta)) chestOpenings.splice(i, 1);
        }
        if (forestHeartShrine && forestHeartShrine.userData.updatePulse) {
            forestHeartShrine.userData.updatePulse(timestamp / 1000);
        }
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
                        
                        starSprite = new THREE.Sprite(starMat);
                        starSprite.scale.set(32, 8, 1);
                        starSprite.renderOrder = -0.4;
                        skyMesh.add(starSprite);
                    }
                    
                    // Recorrido corto dentro del encuadre, un poco por encima de la luna.
                    camera.updateMatrixWorld(true);
                    const moonScreen = moonSprite.getWorldPosition(new THREE.Vector3()).project(camera);
                    const centerX = THREE.MathUtils.clamp(moonScreen.x, -0.45, 0.45);
                    const centerY = THREE.MathUtils.clamp(moonScreen.y + 0.20, -0.35, 0.65);
                    const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
                    const distance = moonSprite.getWorldPosition(new THREE.Vector3()).distanceTo(cameraPosition);
                    const placeInSky = (target, x, y) => {
                        target.set(x, y, 0.5).unproject(camera).sub(cameraPosition).normalize()
                            .multiplyScalar(distance).add(cameraPosition);
                        skyMesh.worldToLocal(target);
                    };
                    placeInSky(starStart, centerX - 0.16, centerY + 0.06);
                    placeInSky(starEnd, centerX + 0.16, centerY - 0.06);
                    const viewWidth = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
                    const starWidth = Math.min(32, viewWidth * 0.10);
                    starSprite.scale.set(starWidth, starWidth / 4, 1);
                    starSprite.material.rotation = Math.atan2(0.12, -0.32 * camera.aspect);
                    starSprite.material.fog = false;
                    starSprite.position.copy(starStart);
                    starSprite.material.opacity = 0;
                    starSprite.visible = true;

                    // La primera conserva exactamente su recorrido; las otras cambian en cada tanda.
                    starSprite.material.color.setHex(0xffffff);
                    starFlights.length = 0;
                    starFlights.push({ sprite: starSprite, start: starStart, end: starEnd, delay: 0 });
                    const secondTime = 1.6 + Math.random() * 1.8;
                    const delays = [secondTime, secondTime + 0.28 + Math.random() * 0.36, 7.2 + Math.random() * 0.46];
                    const colors = [0x8adfff, 0xc39aff, 0xff91c9, 0x98ffc7, 0xffad78];
                    const thirdColor = Math.floor(Math.random() * colors.length);
                    const fourthColor = (thirdColor + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
                    const tints = [0xffedbc, colors[thirdColor], colors[fourthColor]];
                    const rows = [-0.06, 0.12, 0.28];
                    const columns = [-0.13, 0.12, -0.25];
                    const rowBase = THREE.MathUtils.clamp(moonScreen.y + 0.20, -0.25, 0.35);
                    for (let i = 0; i < 3; i++) {
                        if (!extraStarSprites[i]) {
                            const sprite = new THREE.Sprite(starSprite.material.clone());
                            sprite.renderOrder = starSprite.renderOrder;
                            skyMesh.add(sprite);
                            extraStarSprites.push(sprite);
                        }
                        const sprite = extraStarSprites[i];
                        const x = THREE.MathUtils.clamp(centerX + columns[i] + (Math.random() - 0.5) * 0.08, -0.42, 0.42);
                        const y = rowBase + rows[i] + (Math.random() - 0.5) * 0.07;
                        const span = 0.28 + Math.random() * 0.08;
                        const drop = 0.055 + Math.random() * 0.075;
                        const start = new THREE.Vector3(), end = new THREE.Vector3();
                        placeInSky(start, x - span / 2, y + drop / 2);
                        placeInSky(end, x + span / 2, y - drop / 2);
                        sprite.scale.copy(starSprite.scale);
                        sprite.material.rotation = Math.atan2(drop, -span * camera.aspect);
                        sprite.material.color.setHex(tints[i]);
                        sprite.material.opacity = 0;
                        sprite.visible = false;
                        starFlights.push({ sprite, start, end, delay: delays[i] });
                    }
                    starSequenceActive = true;

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
            
            // Una tanda de cuatro destellos breves, repartidos en unos ocho segundos.
            if (starSequenceActive) {
                starTimer += delta;
                const duration = 0.34;
                for (const flight of starFlights) {
                    const time = starTimer - flight.delay;
                    flight.sprite.visible = time >= 0 && time < duration;
                    if (!flight.sprite.visible) continue;
                    const progress = Math.min(1, time / duration);
                    flight.sprite.position.lerpVectors(flight.start, flight.end, progress);
                    const fadeIn = THREE.MathUtils.smoothstep(time, 0, 0.065);
                    const fadeOut = 1 - THREE.MathUtils.smoothstep(time, 0.20, duration);
                    flight.sprite.material.opacity = fadeIn * fadeOut;
                }
                if (starTimer >= starFlights[starFlights.length - 1].delay + duration) starSequenceActive = false;
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
        if (questSkyCycle.morningEnabled && weights.dawn>0) musicEvents.trigger('morning');
        const sunAngle=Math.PI*skyCycle.sunProgress;
        sunSprite.position.set(0,controlObj.position.y-200+Math.sin(sunAngle)*580,-Math.cos(sunAngle)*580);
        sunMat.opacity=weights.day+weights.dawn+weights.dusk;
        sunSprite.visible=sunMat.opacity>0.001 && !questSkyCycle.waitingForSunrise;
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
        interactionHits.length = 0;
        if (!woodcutting.active && !spawnGreeting.active && !heartPull.active && !grahamDap.active) {
            raycaster.setFromCamera(centerVec, camera);
            raycaster.intersectObjects(interactables, true, interactionHits);
        }
        const intersects = interactionHits;
        
        if (woodcutting.active || spawnGreeting.active || heartPull.active || grahamDap.active) {
            targetInteractable = null;
            hud.hideInteraction();
        } else if (intersects.length > 0 && intersects[0].distance < 3.5
            && (intersects[0].object.userData.item !== 'forest-heart' || canReachForestHeart())) {
            targetInteractable = intersects[0].object;
            hud.showInteraction();
            if (targetInteractable.userData.id === 'graham-stump') {
                hud.setInteractionText('Presiona E para cortar madera');
                hud.setInteractionColor('#a6ed90');
            } else if (targetInteractable.userData.type === 'CHEST') {
                if (targetInteractable.userData.item === 'forest-heart') {
                    hud.setInteractionText("Presiona E para tomar el Corazón del Bosque");
                    hud.setInteractionColor("#75d7ff");
                } else {
                    const mapLocked = targetInteractable.userData.item === 'map' && !heartQuest.canOpenMapChest;
                    hud.setInteractionText(targetInteractable.userData.item === 'map' ? "Cerrado" : "Presiona E para abrir Cofre");
                    hud.setInteractionColor(mapLocked ? "#ff5555" : "#ffeb3b");
                }
            } else if (targetInteractable.userData.type === 'MAP_PICKUP') {
                hud.setInteractionText("Presiona E para tomar Mapa");
                hud.setInteractionColor("#ffeb3b");
            } else if (targetInteractable.userData.type === 'MATE_SET') {
                hud.setInteractionText("Presiona E para pedir mate");
                hud.setInteractionColor("#ffeb3b");
            } else if (targetInteractable.userData.type === 'SEA_HEART_FRAGMENT') {
                hud.setInteractionText(helmetEquipped && !helmetBroken ? `Camina sobre el fragmento ${targetInteractable.userData.number}/10 del Corazón del Mar` : `Fragmento ${targetInteractable.userData.number}/10 — equipa la escafandra`);
                hud.setInteractionColor('#75d7ff');
            } else if (targetInteractable.userData.type === 'DIVING_HELMET') {
                hud.setInteractionText("Presiona E para recoger Escafandra");
                hud.setInteractionColor("#ffeb3b");
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
                    const matchingKey = heldItem === 'key' && keyInventory.canUnlock(targetInteractable.userData.gx, targetInteractable.userData.gz);
                    hud.setInteractionText(matchingKey ? 'Presiona E para usar Llave' : heldItem === 'key' ? 'Esta llave no abre esta puerta' : keys > 0 ? 'Selecciona una llave en el inventario' : 'Necesitas una Llave');
                    hud.setInteractionColor(matchingKey ? '#55ff55' : '#ff5555');
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

        if (caveMap?.active) {
            targetInteractable = null;
            if (caveMap.nearExit(controlObj.position)) {
                hud.showInteraction();
                hud.setInteractionText('Presiona E para volver a la isla');
                hud.setInteractionColor('#d8e4eb');
            } else hud.hideInteraction();
        }
        const pullingHeart = heartPull.active;
        heartPull.update(delta);
        const cuttingWood = woodcutting.active;
        woodcutting.update(delta, rawDelta);
        if (!cuttingWood && !spawnGreeting.active && !pullingHeart && !grahamDap.active) {
            updatePlayerPosture();
            velocity.x -= velocity.x * FRICTION * delta;
            velocity.z -= velocity.z * FRICTION * delta;

            direction.z = Number(moveState.forward) - Number(moveState.backward);
            direction.x = Number(moveState.right) - Number(moveState.left);
            direction.normalize();


            if (isRidingBoat && boatReference) {
                frameCameraHeading.setFromQuaternion(camera.quaternion, 'YXZ');
                steerBoat(boatReference, controlObj.position, boatSeatOffset, BOAT_SEAT_BACK_OFFSET,
                    frameCameraHeading.y, delta, (x, z) =>
                        hasObstacle(x, z, mapWidth, mapHeight, collisionMap, floorMap, true, solidInteractables, boatReference));
            }

            const startX = controlObj.position.x;
            const startZ = controlObj.position.z;
        
            const currentGX = Math.floor((startX + UNIT_SIZE/2) / UNIT_SIZE);
            const currentGZ = Math.floor((startZ + UNIT_SIZE/2) / UNIT_SIZE);
            let inWater = false;
            if (currentGZ >= 0 && currentGZ < mapHeight && currentGX >= 0 && currentGX < mapWidth) {
                if (['WATER', 'WATER_ROCK', 'BOAT'].includes(floorMap[currentGZ][currentGX])
                    && !slabTops.has(currentGZ*mapWidth+currentGX)) inWater = true;
            }

            const waterSpeedMod = isRidingBoat ? 1.5 : (inWater && heartLevitationHeight <= 0.15
                ? helmetEquipped || isPlayerUnderwater() ? DIVING_WATER_SPEED_MOD : 0.4 : 1.0);
            const movementMultiplier = isFlying
                ? (running ? FLIGHT_SPRINT_MULTIPLIER : FLIGHT_MULTIPLIER)
                : (running ? SPRINT_MULTIPLIER : 1);

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
                if (moveState.up) controlObj.position.y += MOVEMENT_SPEED * FLIGHT_VERTICAL_MULTIPLIER * delta;
                if (moveState.down) controlObj.position.y -= MOVEMENT_SPEED * FLIGHT_VERTICAL_MULTIPLIER * delta;
            
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

                if (inWater && !helmetEquipped && !isRidingBoat && heartLevitationHeight <= 0.15) {
                    hud.showStamina();
                    stamina -= delta;
                    if (stamina <= 0) {
                        isDead = true;
                        pauseGame();
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

            camera.getWorldDirection(frameCameraDirection);
            heartLevitationHeight = heartLevitation.update(delta, musicEvents.getEventDuration('forest'),
                musicEvents.getEventTimeRemaining('forest'), musicEvents.isEventActive('forest'), {
                    forward: moveState.forward && !moveState.backward && !isFlying && !isRidingBoat,
                    lookY: frameCameraDirection.y,
                    distance: Math.hypot(controlObj.position.x - startX, controlObj.position.z - startZ)
                });
            heartVision.uniforms.heartTreeMotion.value = Math.max(0, Math.min(1, heartLevitationHeight / HEART_LEVITATION_MAX_RISE));
            // Reintentar incorporarse al despejar la cabeza durante este mismo desplazamiento.
            updatePlayerPosture();
            const eyeHeight = isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
            const bedSupport = isRidingBoat || isFlying || inWater ? -Infinity
                : getBedSupport(controlObj.position.x, controlObj.position.z, controlObj.position.y - eyeHeight, solidInteractables);
            const ceilingSupport = isRidingBoat || isFlying || inWater || !bedCeilingHoleOpen ? -Infinity
                : atticSupport?.supportHeight(controlObj.position.x, controlObj.position.z, controlObj.position.y - eyeHeight, true) ?? -Infinity;
            const currentTerrainHeight = Math.max(getTerrainHeight(controlObj.position.x, controlObj.position.z),
                bedSupport, ceilingSupport);
            const onBed = Number.isFinite(bedSupport) && bedSupport >= currentTerrainHeight;
            const onAttic = Number.isFinite(ceilingSupport) && ceilingSupport >= currentTerrainHeight;
            if (!onBed || isFlying || isRidingBoat || inWater) {
                bedBounceActive = false;
                bedCeilingHits = 0;
            }
            let targetEyesHeight = (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT) + currentTerrainHeight;
        
            if (isRidingBoat && boatReference) {
                targetEyesHeight = getBoatEyesHeight(boatReference);
            } else if (inWater && !helmetEquipped) {
                // Caminar por el fondo somero; flotar solo al alcanzar suficiente profundidad.
                targetEyesHeight = Math.max(targetEyesHeight, getWaterSurfaceHeight(controlObj.position.x,controlObj.position.z) + 0.2);
            }

            if (isFlying && controlObj.position.y < targetEyesHeight) {
                controlObj.position.y = targetEyesHeight;
            }

            if (!isRidingBoat && heartLevitationHeight > 0) {
                const groundEyesHeight = targetEyesHeight;
                targetEyesHeight += heartLevitationHeight;
                controlObj.position.y = Math.max(groundEyesHeight, controlObj.position.y + (targetEyesHeight - controlObj.position.y) * (1 - Math.exp(-delta * 5)));
                velocityY = 0;
                canJump = false;
            } else if (!isFlying && bedCeilingTimer > 0) {
                bedCeilingTimer -= delta;
                velocityY = 0;
                if (bedCeilingTimer <= 0) {
                    bedCeilingTimer = 0;
                    // Soltar al jugador antes de revelar la rotura en este mismo fotograma.
                    velocityY = -1;
                    controlObj.position.y += velocityY * delta;
                    bedCeilingHoleOpen = true;
                    // Se rompe solo el cielo falso; la cubierta superior queda intacta.
                    for (const piece of bedFalseCeilingPieces.values()) {
                        piece.userData.visibilityEnabled = false;
                        piece.visible = false;
                    }
                    if (bedHoleRim) {
                        bedHoleRim.userData.visibilityEnabled = true;
                        bedHoleRim.visible = true;
                    }
                }
            } else if (!isFlying) {
                // Seguir pendientes continuas estando apoyado, sin quedarse bajo la superficie al subir.
                if (canJump && velocityY <= 0 && Math.abs(controlObj.position.y - targetEyesHeight) < 0.15) {
                    controlObj.position.y = targetEyesHeight;
                }
                if (canJump && controlObj.position.y > targetEyesHeight + 0.15) canJump = false;
                // Primeros rebotes más pausados; recuperar el ritmo normal al tomar vuelo.
                const bedBuild = Math.min(1, Math.max(0, (bedBounceImpulse - BED_BOUNCE_BASE_IMPULSE) / 6));
                const bedTempo = onBed && bedBounceActive
                    ? BED_BOUNCE_INITIAL_TIME_SCALE + (1 - BED_BOUNCE_INITIAL_TIME_SCALE) * bedBuild * bedBuild * (3 - 2 * bedBuild)
                    : 1;
                // Dar algo más de aire al salto normal sin aumentar su impulso ni tocar la cama.
                const airTempo = !onBed && !inWater && !isRidingBoat ? NORMAL_JUMP_TIME_SCALE : bedTempo;
                const verticalDelta = delta * airTempo;
                // Flotar más al saltar o caer en el agua; los botes conservan su gravedad.
                const waterGravityScale = velocityY < 0 ? WATER_FALL_GRAVITY_SCALE : WATER_GRAVITY_SCALE;
                const verticalGravity = inWater && !isRidingBoat ? GRAVITY * waterGravityScale : GRAVITY;
                velocityY -= verticalGravity * verticalDelta;
                controlObj.position.y += velocityY * verticalDelta;

                if (controlObj.position.y < targetEyesHeight) {
                    if (onBed && jumpHeld) {
                        // Mantener salto inicia/reanuda la cadena al apoyar sobre el colchón.
                        if (!bedBounceActive) {
                            bedBounceActive = true;
                            bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
                            bedBounceHitCeiling = false;
                        }
                        controlObj.position.y = targetEyesHeight;
                        // El colchón añade fuerza al siguiente salto; nunca se carga impulso contra el techo.
                        if (!bedBounceHitCeiling) {
                            const gain = 0.35 + Math.max(0, bedBounceImpulse - BED_BOUNCE_BASE_IMPULSE) * 0.35;
                            bedBounceImpulse = Math.min(BED_BOUNCE_MAX_IMPULSE, bedBounceImpulse + gain);
                        }
                        else if (!bedCeilingHoleOpen && bedCeilingHits > 0) {
                            bedBounceImpulse = Math.min(BED_BOUNCE_MAX_IMPULSE, bedBounceImpulse + BED_BOUNCE_AFTER_IMPACT_GAIN);
                        }
                        velocityY = bedBounceImpulse;
                        bedBounceHitCeiling = false;
                        canJump = false;

                    } else {
                        const justLanded = !canJump;
                        controlObj.position.y = targetEyesHeight;
                        velocityY = 0;
                        canJump = true;
                        bedBounceActive = false;
                        bedCeilingHits = 0;
                        // Una breve pausa al apoyar separa los saltos automáticos de A.
                        if (isTouchMode && jumpHeld) {
                            touchJumpRepeatWait = justLanded ? TOUCH_JUMP_REPEAT_PAUSE
                                : Math.max(0, touchJumpRepeatWait - delta);
                            if (touchJumpRepeatWait <= 0) gameActions.jump();
                        }
                    }
                }
            }
        
            // Colisión de techos (tanto normal como vuelo)
            const roofGX = Math.floor((controlObj.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
            const roofGZ = Math.floor((controlObj.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
            if (roofGZ >= 0 && roofGZ < mapHeight && roofGX >= 0 && roofGX < mapWidth) {
                const currentFloor = floorMap[roofGZ][roofGX];
                if (currentFloor === 'INDOOR_FLOOR' || currentFloor === 'DOOR_UNLOCKED' || currentFloor === 'DOOR_LOCKED'
                    || (bedCeilingHoleOpen && atticSupport?.cellAt(controlObj.position.x, controlObj.position.z))) {
                    const passageHeight = ['DOOR_UNLOCKED','DOOR_LOCKED'].includes(currentFloor) ? DOOR_HEIGHT : WALL_HEIGHT;
                    const ceilingMaxHeight = getTerrainHeight(controlObj.position.x, controlObj.position.z) + passageHeight - 0.3; // La cama no eleva el techo.
                    const atBedOpening = roofGX === bedCeilingHoleTile?.x && roofGZ === bedCeilingHoleTile?.z;
                    const atticCell = atticSupport?.cellAt(controlObj.position.x, controlObj.position.z);
                    const throughOpening = bedCeilingHoleOpen && atticSupport?.fitsOpening(controlObj.position.x, controlObj.position.z);
                    const aboveFalseCeiling = bedCeilingHoleOpen && atticCell && controlObj.position.y - eyeHeight >= atticCell.top - 0.08;
                    const inAttic = aboveFalseCeiling || throughOpening || (atBedOpening && bedCeilingTimer > 0);
                    if (!inAttic && controlObj.position.y > ceilingMaxHeight) {
                        const risingCeilingImpact = velocityY > 0;
                        controlObj.position.y = ceilingMaxHeight;
                        if (velocityY > 0) {
                            velocityY = 0;
                            if (bedBounceActive) {
                                bedBounceImpulse = Math.max(BED_BOUNCE_BASE_IMPULSE, bedBounceImpulse * 0.8);
                                bedBounceHitCeiling = true;
                            }
                        }
                        if (risingCeilingImpact && onBed && jumpHeld && bedBounceActive && !bedCeilingHoleOpen && bedCeilingTimer <= 0
                            && bedRoofPieces.has(`${roofGX},${roofGZ}`)) {
                            if (++bedCeilingHits >= BED_CEILING_HITS_TO_BREAK) {
                                bedCeilingTimer = 0.7;
                                bedCeilingHoleTile = { x: roofGX, z: roofGZ };
                                // Ojos sobre las tablas intactas, fuera del recorte cercano de la cámara.
                                const ceilingTop = atticCell?.top ?? ceilingMaxHeight + 0.35;
                                const heldEyesHeight = ceilingTop + Math.max(0.2, camera.near * 2);
                                const atticLimit = atticSupport?.upperLimit(controlObj.position.x, controlObj.position.z) ?? Infinity;
                                controlObj.position.y = Math.min(heldEyesHeight, atticLimit);
                                canJump = false;
                            }
                        }
                    }
                    // El hueco permite entrar al entretecho, sin atravesar la cubierta exterior.
                    if (inAttic && atticSupport) {
                        const upperLimit = atticSupport.upperLimit(controlObj.position.x, controlObj.position.z);
                        if (Number.isFinite(upperLimit) && controlObj.position.y > upperLimit) {
                            controlObj.position.y = upperLimit;
                            if (velocityY > 0) {
                                velocityY = 0;
                                if (bedBounceActive) {
                                    bedBounceImpulse = Math.max(BED_BOUNCE_BASE_IMPULSE, bedBounceImpulse * 0.8);
                                    bedBounceHitCeiling = true;
                                }
                            }
                        }
                    }
                }
            }

            const speed = Math.sqrt(velocity.x**2 + velocity.z**2);
            if (!isFlying) {
                if (speed > 1.0 && canJump && !isRidingBoat) {
                    const previousBob = bobTimer;
                    const underwaterCadence = isPlayerUnderwater() ? DIVING_WATER_SPEED_MOD : 1;
                    bobTimer += delta * (running ? 16.9 : 8.0) * bobCadence * underwaterCadence;
                    controlObj.position.y = targetEyesHeight + Math.sin(bobTimer) * 0.04;
                    // Un golpe al cruzar el punto más bajo; sigue la cadencia del balanceo.
                    const trough = Math.PI * 1.5;
                    const previousStep = Math.floor((previousBob - trough) / (Math.PI * 2));
                    const currentStep = Math.floor((bobTimer - trough) / (Math.PI * 2));
                    const moved = Math.hypot(controlObj.position.x-startX,controlObj.position.z-startZ)>0.0001;
                    if (currentStep > previousStep && moved && !inWater) {
                        const accented = footstepIndex % 2 === 0;
                        const stepX = Math.floor((controlObj.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
                        const stepZ = Math.floor((controlObj.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
                        const outdoorStep = OUTDOOR_STEP_FLOORS.has(floorMap[stepZ]?.[stepX])
                            && !woodFloorMap[stepZ]?.[stepX] && !slabTops.has(stepZ * mapWidth + stepX);
                        const walkingAccent = WALKING_STEP_ACCENTS[footstepIndex % WALKING_STEP_ACCENTS.length];
                        const accent = running ? (accented ? 1 : outdoorStep ? 0.72 : 0.92) : walkingAccent;
                        const rhythm = walkingRhythm.next(running);
                        musicEvents.playFootstep(running, accent * rhythm.variation, outdoorStep, accented);
                        footstepIndex++;
                        bobCadence = rhythm.cadence;
                    }
                } else if (canJump) {
                    bobTimer = 0;
                    bobCadence = 1;
                    controlObj.position.y += (targetEyesHeight - controlObj.position.y) * 10 * delta;
                }
            }

            if (isRidingBoat && boatReference) {
                boatReference.position.x = controlObj.position.x - boatSeatOffset.x;
                boatReference.position.z = controlObj.position.z - boatSeatOffset.z;
            }
        }
        updateSpawnGreeting(cameraDelta);
        // Aire independiente de la resistencia de natación, calculado con tiempo real activo.
        const nextFragment = seaHeart?.next && seaHeartSprites.get(seaHeart.next.id);
        if (nextFragment && !isRidingBoat && !isFlying && !isDialogOpen
            && Math.hypot(controlObj.position.x-nextFragment.position.x,controlObj.position.z-nextFragment.position.z)<=1.2
            && controlObj.position.y>=nextFragment.position.y-0.4
            && controlObj.position.y<=nextFragment.position.y+PLAYER_HEIGHT+0.9) {
            collectSeaHeartFragment(nextFragment);
        }
        const airGX = Math.floor((controlObj.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
        const airGZ = Math.floor((controlObj.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
        const waterUnderfoot = ['WATER', 'WATER_ROCK', 'BOAT'].includes(floorMap[airGZ]?.[airGX])
            && !slabTops.has(airGZ*mapWidth+airGX);
        if (handTorchEnabled && isPlayerUnderwater()) setHandTorchEnabled(false);
        const localWaterHeight = getWaterSurfaceHeight(controlObj.position.x,controlObj.position.z);
        const visuallySubmerged = waterUnderfoot && !isRidingBoat && controlObj.position.y < localWaterHeight - 0.03;
        if (seaHeart?.next?.number === 1) {
            const first = seaHeartSprites.get(seaHeart.next.id);
            if (visuallySubmerged && !playerWasSubmerged) {
                first.userData.haloStartedAt = underwaterViewTime.value;
                first.userData.haloWaitingForDive = false;
                first.children[0].scale.set(18.75*0.15,18.75*0.15,1);
                seaHeartLight.intensity = 2.4;
            } else if (!visuallySubmerged) first.userData.haloWaitingForDive = true;
        }
        playerWasSubmerged = visuallySubmerged;
        underwaterBlend += ((visuallySubmerged ? 1 : 0) - underwaterBlend) * (1 - Math.exp(-rawDelta * 4));
        const submerged = waterUnderfoot && !isRidingBoat && !isFlying && controlObj.position.y < localWaterHeight;
        divingAir.update(rawDelta, helmetEquipped && submerged, !waterUnderfoot || isRidingBoat || controlObj.position.y >= localWaterHeight);
        if (helmetEquipped && submerged) {
            hud.showDivingAir(divingAir.remaining, divingAir.maximum);
            if (divingAir.remaining === 0) {
                isDead = true;
                pauseGame();
                hud.showDeath();
                hud.hideDivingAir();
                return;
            }
        } else hud.hideDivingAir();
        frameCameraHeading.setFromQuaternion(camera.quaternion, 'YXZ');
        minimap.updatePosition(controlObj.position.x, controlObj.position.z, mapWidth * UNIT_SIZE, mapHeight * UNIT_SIZE, -frameCameraHeading.y);
        if (caveMap?.active && caveMap.exiting(controlObj.position)) {
            leaveCaveTestMap();
        } else if (!caveMap?.active && !isFlying && !isRidingBoat && !isDialogOpen && caveEntrance?.triggered(controlObj.position)) {
            enterCaveTestMap();
        }
        
        // Variación suave de la antorcha de mano, conservando intensidad media 8.
        handTorchFlickerTime += delta;
        torchLight.intensity = handTorchEnabled ? 8.0 + Math.sin(handTorchFlickerTime * 2.4) * 0.22
            + Math.sin(handTorchFlickerTime * 4.1) * 0.1 : 0;
        
        // Animar las antorchas del mundo
        altarFlameTime += delta;
        altarFlames.forEach((flame,index) => {
            flame.material.map = blueFireFrames[Math.floor(altarFlameTime*7+index)%blueFireFrames.length];
        });
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
    updateFogColor();
    const cameraSubmerged = isPlayerUnderwater();
    // Cubrir también los huecos más allá del mapa desde el primer instante sumergido.
    underwaterBackdrop.visible = cameraSubmerged || underwaterBlend > 0.001;
    underwaterBackdrop.material.opacity = cameraSubmerged ? 1 : underwaterBlend;
    underwaterBackdrop.material.color.copy(underwaterCurrentColor);
    skyMesh.visible = !cameraSubmerged;
    daySkyMesh.visible = dayMaterials.some(material => material.opacity !== 0);
    dawnSkyMesh.visible = dawnSkyMesh.material.opacity !== 0;
    duskSkyMesh.visible = duskSkyMesh.material.opacity !== 0;
    hud.setUnderwaterTint(gameStarted && controls.isLocked && !isDead ? underwaterBlend * underwaterLightLevel : 0);
    const fogPlane = fogCulling?.update(camera);
    const showUnderwaterPlants = mapLoaded && isPlayerUnderwater() && !isRidingBoat;
    const plantGX = Math.floor((controlObj.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
    const plantGZ = Math.floor((controlObj.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
    const seaUnderfoot = ['WATER','BOAT'].includes(floorMap[plantGZ]?.[plantGX]);
    const feetAtWater = controlObj.position.y - PLAYER_HEIGHT <= getWaterSurfaceHeight(controlObj.position.x,controlObj.position.z) + 0.15;
    if (mapLoaded && !underwaterVegetationPreparation && (showUnderwaterPlants || (seaUnderfoot && feetAtWater && !isRidingBoat))) {
        underwaterVegetationPreparation = (async()=>{
            const plants = await createUnderwaterVegetation(THREE,texLoader,underwaterPlantDefinitions,
                getTerrainHeight,UNIT_SIZE,WATER_SURFACE_HEIGHT,vegetationWindTime);
            const fade = createVegetationVisibility(plants.group,{value:0});
            fade.set(0);
            // Subir texturas anticipadamente y repartir ese trabajo entre fotogramas.
            for (const mesh of plants.group.children) {
                await new Promise(resolve=>requestAnimationFrame(resolve));
                renderer.initTexture(mesh.material.map);
            }
            plants.update(camera,fogPlane,UNDERWATER_PLANT_DISTANCE);
            prepareInactiveLights(THREE, plants.group);
            scene.add(plants.group);
            // Usar la escena real conserva las variantes de niebla y luces del juego.
            await renderer.compileAsync(scene,camera);
            await underwaterView.prepare(scene,camera,true);
            underwaterVegetationFade = fade;
            underwaterVegetation = plants;
        })().catch(error=>console.error('No se pudo preparar la vegetación submarina:',error));
    }
    const underwaterPlantsReady = !!underwaterVegetation;
    const vegetationTarget = showUnderwaterPlants && underwaterPlantsReady ? 1 : 0;
    vegetationBlend += (vegetationTarget-vegetationBlend)*(1-Math.exp(-vegetationDelta*2));
    if(vegetationBlend>0.99)vegetationBlend=1;
    else if(vegetationBlend<0.01)vegetationBlend=0;
    const surfaceTarget = !showUnderwaterPlants || !underwaterPlantsReady || controlObj.position.y >= SURFACE_VEGETATION_RETURN_HEIGHT ? 1 : 0;
    surfaceVegetationBlend += (surfaceTarget-surfaceVegetationBlend)*(1-Math.exp(-vegetationDelta*2));
    if(surfaceVegetationBlend>0.99)surfaceVegetationBlend=1;
    else if(surfaceVegetationBlend<0.01)surfaceVegetationBlend=0;
    if (vegetationSectors) {
        surfaceVegetationFade.set(surfaceVegetationBlend);
        if (vegetationSectors.group.visible) vegetationSectors.update(camera, fogPlane);
    }
    if (underwaterVegetation) {
        underwaterVegetationFade.set(vegetationBlend);
        if (underwaterVegetation.group.visible) underwaterVegetation.update(camera, fogPlane, UNDERWATER_PLANT_DISTANCE);
    }
    if (structureSectors) structureSectors.update(camera, fogPlane);
    sunFlare.update();
    if (!controls.isLocked || isDead) hud.hideDivingAir();
    hud.updateCoordinates(caveMap?.active ? caveMap.localPosition(controlObj.position) : controlObj.position, UNIT_SIZE, !woodcutting.active && gameStarted && controls.isLocked && !isDead);
    heldItemSprite.visible = !!heldItem && heldItem !== 'mate' && !woodcutting.active && gameStarted && controls.isLocked && !isDead;
    heldMate.update(controls.isLocked ? vegetationDelta : 0, canDrinkMate());
    heldHeartGlow.visible = heldItemSprite.visible && heldItem === 'heart';
    hud.setHelmetViewVisible(hasDivingHelmet && helmetEquipped && gameStarted && controls.isLocked && !isDead);
    underwaterStrength.value = underwaterBlend;
    if (controls.isLocked && !isDead) heartPull.applyCameraShake();
    grahamDap.apply();
    const caveLighting = caveMap?.active ? {
        ambient: ambientLight.intensity,
        directional: dirLight.intensity,
        skyVisible: skyMesh.visible,
        flareVisible: sunFlare.object.visible,
        background: scene.background.clone(),
        fogColor: scene.fog.color.clone()
    } : null;
    if (caveLighting) {
        ambientLight.intensity = 0;
        dirLight.intensity = 0;
        skyMesh.visible = false;
        sunFlare.object.visible = false;
        scene.background.set(0x000000);
        scene.fog.color.set(0x000000);
    }
    try {
        underwaterView.render(scene, camera);
    } finally {
        if (caveLighting) {
            ambientLight.intensity = caveLighting.ambient;
            dirLight.intensity = caveLighting.directional;
            skyMesh.visible = caveLighting.skyVisible;
            sunFlare.object.visible = caveLighting.flareVisible;
            scene.background.copy(caveLighting.background);
            scene.fog.color.copy(caveLighting.fogColor);
        }
        grahamDap.restore();
        heartPull.restoreCameraShake();
        performancePanel?.record(timestamp, frameStart);
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    updateHeldItemLayout();
    renderer.setSize(window.innerWidth, window.innerHeight);
    underwaterView.resize();
});
