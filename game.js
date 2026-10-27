import { createBeachPlankTableGeometry, createRusticBeachChairGeometry } from './src/world/rustic-beach-furniture.js';
import { createHeldMate } from './src/player/held-mate.js';
import { createTelescope } from './src/world/telescope.js';
import { createTelescopeGlare } from './src/world/telescope-glare.js';
import { createTelescopeView, TELESCOPE_ZOOM } from './src/player/telescope-view.js';
import { createRiverCameraMotion } from './src/player/river-camera-motion.js';
import { createSeaHeartSoundMotion } from './src/systems/sea-heart-sound-motion.js';
import { createObservatoryScope } from './src/player/observatory-scope.js';
import { createObservatoryLadder } from './src/player/observatory-ladder.js';
import { createHeldOverlay } from './src/player/held-overlay.js';
import { createHeldTorch } from './src/player/held-torch.js';
import { telescopePickup, telescopeWorkshopPosition } from './src/content/entities.js';
import { createTelescopeWorkshop } from './src/world/telescope-workshop.js';
import { createWizardUpperFloor, isWizardHouseRoofCell } from './src/world/wizard-upper-floor.js';
import { createWizardTelevisions } from './src/world/wizard-televisions.js';
import { createSummitObservatory } from './src/world/summit-observatory.js';
import { createLakeHouseDome } from './src/world/lake-house-dome.js';
import { createLakeMetalRoom, LAKE_HATCH_CELL } from './src/world/lake-metal-room.js';
import { createLakeAquarium } from './src/world/lake-aquarium.js';
import { createModularSynthRacks } from './src/world/modular-synth-racks.js';
import { createMetalRoomLadder } from './src/player/metal-room-ladder.js';
import { applyLakeHouseLayout } from './src/world/lake-house-layout.js';
import { lakeHouseLayout, isLakeHouseCell, isLakeHouseDoor } from './src/content/lake-house-layout.js';
import { createObservatorySky } from './src/world/observatory-sky.js';
import { wizardHouseLayout, summitStonePlatform } from './src/content/summit-layout.js';
import { applySummitLayout } from './src/world/summit-layout.js';
import { createWoodcutting } from './src/systems/woodcutting.js';
import { createWoodcuttingHud } from './src/ui/woodcutting.js';
import { sampleForestSurroundings } from './src/systems/forest-ambience.js';
import { sampleRiverSound } from './src/systems/river-ambience.js';
import { createSeaSoundField, sampleSeaSound } from './src/systems/sea-ambience.js';
import { createAtticAnt, findAtticAntHome } from './src/world/attic-ant.js';
import { createGrahamDap } from './src/systems/graham-dap.js';
import { createGuidedLook } from './src/systems/mirada-guiada.js';
import { createWoodStoveGeometry, createWoodStovePipeGeometry } from './src/world/wood-stove-geometry.js';
import { createWoodStoveFire } from './src/world/wood-stove-fire.js';
import { prepareInactiveLights } from './src/world/inactive-lights.js';
import { getTerrainTextureBlend } from './src/world/terrain-textures.js';
import { createPerformancePanel } from './src/ui/performance-panel.js';
import { waitForRenderedFrame, prepareProgramsInBatches } from './src/ui/render-ready.js';

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { UNIT_SIZE, WALL_HEIGHT, DOOR_HEIGHT, DOOR_THICKNESS, VEGETATION_HEIGHT, TREE_SPRITE_SCALE, TREE_SPRITE_HEIGHT, TORCH_MOUNT_HEIGHT, NIGHT_SKY_ROTATION_SPEED, MANUAL_SKY_TRANSITION_SECONDS, WATER_SURFACE_HEIGHT, BOAT_FLOAT_HEIGHT, BOAT_WIDTH, PLAYER_HEIGHT, GRAHAM_HEIGHT, FURNITURE_SCALE, MOVEMENT_SPEED, FRICTION, COLLISION_RADIUS, SPRINT_MULTIPLIER, GRAVITY, JUMP_FORCE, STAMINA_MAX } from './src/config.js';
import { npcDialogs, heartSearchDialogs, heartDeliveryDialogs, heartDeliveredDialogs, grahamWakeGreetings, grahamRescueDialogs, riverDrowningMessage, atticAntDialogs, mateOfferDialogs, mateAlreadyHeldDialogs } from './src/content/dialogues.js';
import { createDrowningRescue } from './src/ui/drowning-rescue.js';
import { grahamJournal } from './src/content/readables.js';
import { entities, grahamPosition, grahamRoomDivider, kitchenSacks, spawnRoomExit, riverDrowningLanding, kitchenGardenPosition, shipwreckProps, sunkenShip, divingHelmet, keyBindings, seaHeartAltar } from './src/content/entities.js';
import { createSpawnGreeting } from './src/systems/spawn-greeting.js';
import { createHeartPull } from './src/systems/heart-pull.js';
import { DOOR_SIDE_MARGIN } from './src/config.js';
import { createSunkenShipGeometry } from './src/world/sunken-ship-geometry.js';
import { createShipwreckGeometry } from './src/world/shipwreck-geometry.js';
import { createLogStackGeometry } from './src/world/log-stack-geometry.js';
import { createLogStackMaterials } from './src/world/log-stack-materials.js';
import { createWorkbenchGeometry } from './src/world/workbench-geometry.js';
import { createStumpGeometry } from './src/world/stump-geometry.js';
import { createEntityRegistry } from './src/world/entity-registry.js';
import { createForestHeartQuest } from './src/systems/forest-heart.js';
import { loadMapImage, readMapLayers } from './src/world/map-loader.js';
import { prepareMapAsync } from './src/world/map-data.js';
import { createLoadingYield } from './src/ui/loading-yield.js';
import { createTerrainBuild } from './src/world/terrain-build.js';
import { prepareWorldFields } from './src/world/world-preparation.js';
import { getBedSupport } from './src/player/bed-support.js';
import { createAtticSupport, BED_CEILING_OPENING } from './src/player/attic-support.js';
import { showReadyIsland, getIslandPreview, setIslandPreview } from './src/ui/island-start.js';
import { createMinimap } from './src/ui/minimap.js';
import { createMenus } from './src/ui/menus.js';
import { createObservatoryMenu } from './src/ui/observatory-menu.js';
import { createHud } from './src/ui/hud.js';
import { bindKeyboard } from './src/input/keyboard.js';
import { testMode } from './src/input/test-mode.js';
import { requestGamePointerLock, guardPointerLockMouse } from './src/input/pointer-lock.js';
import { isTouchMode } from './src/input/touch-mode.js';
import { bindTouchControls } from './src/input/touch-controls.js';
import { getTerrainVertexY, createTerrainSamplingCache, getTerrainHeight as sampleTerrainHeight } from './src/world/terrain-height.js';
import { isWall as hasObstacle } from './src/player/collisions.js';
import { toggleDoor, unlockDoor, updateDoorAnimations } from './src/systems/doors.js';
import { createWaterDeckTerrain, levelBuildingAtTerrain, createWetSandShoreMap } from './src/world/surfaces.js';
import { createTorchLighting } from './src/systems/torch-lighting.js';
import { MOUNTAIN_PROFILE_REFERENCE } from './src/content/mountain-relief.js';
import { smoothMountainPath } from './src/world/mountain-path.js';
import { createRoofBaseMap } from './src/world/roof-height.js';
import { getDoorOpening } from './src/world/door-opening.js';
import { createBoatGeometry } from './src/world/boat-geometry.js';
import { updateBoatFloating } from './src/world/boat-floating.js';
import { placeBoatFacingWest } from './src/world/boat-placement.js';
import { steerBoat } from './src/world/boat-steering.js';
import { applyVegetationWind } from './src/world/vegetation-wind.js';
import { createHeartVision } from './src/world/heart-vision.js';
import { createHeartHalos } from './src/world/heart-halos.js';
import { createHeartLevitation, HEART_LEVITATION_MAX_RISE } from './src/systems/heart-event-timing.js';
import { FOREST_CUES } from './src/content/forest-cues.js';
import { applyWaterWaves } from './src/world/water-waves.js';
import { createOceanSurfaceGeometry, createOceanSeabedGeometry } from './src/world/ocean-surface.js';
import { createShorelineMask, createShorelineHeights, alignShorelineInstances } from './src/world/shoreline-smoothing.js';
import { CAVE_ENTRY, createCaveEntrance } from './src/world/cave-entrance.js';
import { loadCaveTestMap } from './src/world/cave-test-map.js';
import { createUnderwaterView } from './src/world/underwater-view.js';
import { createUnderwaterVegetation } from './src/world/underwater-vegetation.js';
import { createVegetationVisibility } from './src/world/vegetation-visibility.js';
import { createRiverCurrentField, getRiverCurrentSpeed, getRiverCenterOffset, getRiverLakeDirection } from './src/world/river-current.js';
import { createChestGeometry, createChestOpening } from './src/world/chest-geometry.js';
import { createDryVineShrine } from './src/world/dry-vine-geometry.js';
import { applyForestHeartCyan } from './src/world/forest-heart-color.js';
import { GRAHAM_BRIDGE_KEY_AVAILABLE } from './src/config.js';
import { FLIGHT_MULTIPLIER, FLIGHT_SPRINT_MULTIPLIER, FLIGHT_VERTICAL_MULTIPLIER } from './src/config.js';
import { bridgeKeyDeliveryDialogs, bridgeKeyReceivedDialogs } from './src/content/dialogues.js';
import { pushPlayerFromMovingDoors } from './src/player/door-push.js';
import { createForestMovementBoundary } from './src/player/forest-movement-boundary.js';
import { createTerrainSectorsAsync } from './src/world/terrain-sectors.js';
import { createInstanceSectorsAsync } from './src/world/instance-sectors.js';
import { createFogCulling } from './src/world/fog-culling.js';
import { mergeRoofBlocks } from './src/world/roof-blocks.js';
import { createBedGeometry } from './src/world/bed-geometry.js';
import { createBedDebrisLanding, createBedDebrisTargets, bedDebrisTravel } from './src/world/bed-debris.js';
import { createSideTableGeometry } from './src/world/side-table-geometry.js';
import { createBarrelGeometry } from './src/world/barrel-geometry.js';
import { createBookshelfGeometry } from './src/world/bookshelf-geometry.js';
import { createTableGeometry, createChairGeometry } from './src/world/table-chair-geometry.js';
import { createMateSet } from './src/world/mate-set.js';
import { createDeskWritingSet } from './src/world/desk-writing-set.js';
import { createAntiqueStoveGeometry } from './src/world/antique-stove-geometry.js';
import { createSpiceShelfGeometry } from './src/world/spice-shelf-geometry.js';
import { createKitchenGarden } from './src/world/kitchen-garden.js';
import {createGardenNote} from './src/ui/garden-note.js';
import { createWoodFenceGeometry } from './src/world/wood-fence.js';
import { createPinkSunglasses } from './src/world/pink-sunglasses.js';
import { createAltarBlueFire, updateAltarBlueFire } from './src/world/altar-blue-fire.js';
import { LENS_VIEWS } from './src/content/lens-views.js';
import { createWardrobeGeometry } from './src/world/wardrobe-geometry.js';
import { createDeskGeometry } from './src/world/desk-geometry.js';
import { createCrateStackGeometry } from './src/world/crate-stack-geometry.js';
import { createBurlapSack } from './src/world/burlap-sack.js';
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
import { createDivingHelmetGeometry, createDivingHelmetMaterials } from './src/world/diving-helmet-geometry.js';
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
const UNDERWATER_MOTION_TIME_SCALE = 0.6;
const HELMET_SURFACE_JUMP_FORCE = 2.5;
let surfaceJumpActive = false;
let canJump = true;
const BED_BOUNCE_BASE_IMPULSE = 5.5;
const BED_BOUNCE_MAX_IMPULSE = 20;
const BED_BOUNCE_AFTER_IMPACT_GAIN = 4;
const BED_BOUNCE_INITIAL_TIME_SCALE = 0.45;
// Un salto inicial y dos rebotes de asentamiento: tres en total.
const BED_SETTLE_IMPULSES = [4.4, 3.2];
const BED_SETTLE_TEMPOS = [0.82, 1];
let bedSettleIndex = -1;
let bedSettleTempo = 1;
const BED_CEILING_HITS_TO_BREAK = 6;
const BED_CEILING_STUCK_SECONDS = 1.5;
const BED_CEILING_OPEN_SECONDS = 0.36;
const BED_CEILING_CHIP_COUNT = 10;
const BED_WOOD_CHIP_HOLD_SECONDS = 2.2;
const BED_WOOD_CHIP_FADE_SECONDS = 0.9;
let bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
let bedBounceHitCeiling = false;
let bedBounceActive = false;
let bedTakeoffSoundPlayed = false;
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
let makeBedHoleMesh = null;
let bedHoleStages = [];
let bedHoleOpeningTime = -1;
let bedWoodChips = null;
let bedWoodChipMaterial = null;
const bedWoodChipMotion = [];
const bedWoodChipDummy = new THREE.Object3D();
let bedWoodChipTime = -1;
let bedWoodChipFadeStart = -1;
const bedCeilingImpact = new THREE.Vector2();
let atticSupport = null;
let wizardUpperFloor = null;
let wizardTelevisions = null;
let summitObservatory = null;
let lakeHouseDome = null;
const bedDefinition = furniture.find(item => item.id === 'graham-bed');
let isCrouching = false;
let crouchRequested = false;
let isRunning = false;

// Inventario e Interacciones
let keys = 0;
const keyInventory = createKeyInventory(keyBindings);
let heldItem = null;
let heldItemSprite = null;
const heldHeartCyan={value:0};
let heldItemTextures = null;
let hasTorch = false;
let hasMap = false;
let hasMate = false, heldMate = null;
let hasAstroscope = false, telescopeMesh = null, telescopeView = null;
let telescopeGlare=null;
let telescopeRepaired=false, mountainWorkshop=null, observatoryScope=null, observatoryLadder=null, astroscopeInstalled=false;
let hasPinkSunglasses = false, pinkSunglassesEquipped = false;
let lensViewIndex = 0;
let hasDivingHelmet = false;
let helmetEquipped = false;
let helmetBroken = false;
let helmetCracked = false;
let helmetCrackStage = 0;
let grahamRescuePending = false, drowningRescueContext = null;
let helmetBreakRemaining = null;
let helmetBreakSound = null;
let seaHeart = null;
const seaHeartSprites = new Map();
const seaHeartSoundPosition = new THREE.Vector3();
const seaHeartSoundMotion = createSeaHeartSoundMotion(THREE,seaHeartSoundPosition);
const seaHeartSoundRelative = new THREE.Vector3();
const seaHeartListenerPosition = new THREE.Vector3();
const seaHeartListenerRotation = new THREE.Quaternion();
let forestAmbienceSample = null, forestAmbienceSampleTime = 0;
let riverSoundField = null, riverSoundSample = null, riverSoundSampleTime = 0;
let seaSoundField = null, seaSoundSample = null, seaSoundSampleTime = 0;
const seaSoundRelative = new THREE.Vector3();
const riverSoundRelative = new THREE.Vector3(), riverSoundRotation = new THREE.Quaternion();
const forestAmbienceRelative = new THREE.Vector3();
const forestAmbienceRotation = new THREE.Quaternion();
const forestAmbienceSources = Array.from({length:4},()=>({x:0,y:0,z:0,weight:0}));
let seaHeartLight = null;
let altarWaterHeight = null;

function revealNextSeaHeartFragment(animateSound=false) {
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
    if (activeSprite && animateSound) seaHeartSoundMotion.moveTo(activeSprite.position,camera);
    else seaHeartSoundMotion.snapTo(activeSprite?.position ?? seaHeartSoundPosition);
    if (seaHeartLight) {
        seaHeartLight.intensity = activeSprite ? 2.4 : 0;
        if (activeSprite) {
            seaHeartLight.position.copy(activeSprite.position);
            seaHeartLight.position.y += 0.4;
        }
    }
}

function collectSeaHeartFragment(fragment) {
    if (!fragment || !helmetEquipped || helmetBroken || isDead || (!controls.isLocked && !inventoryRunning)) return;
    const reward = seaHeart.collect(fragment.userData.id);
    if (!reward) return;
    divingAir.replenish(reward.airSeconds);
    if (reward.count === 1) musicEvents.trigger('underwater');
    const index = interactables.indexOf(fragment);
    if (index >= 0) interactables.splice(index,1);
    // Conservar el modelo oculto para restaurar la ruta si se pierde la inmersión.
    fragment.visible=false;
    fragment.userData.visibilityEnabled=false;
    if (reward.complete) seaHeartSoundPosition.copy(fragment.position);
    revealNextSeaHeartFragment(!reward.complete);
    if (targetInteractable === fragment) targetInteractable = null;
    hud.hideInteraction();
    menus.setSeaHeartState(reward.count,reward.complete);
    if (reward.complete) {
        for (const flame of altarFlames) {
            flame.userData.visibilityEnabled = true;
            flame.visible = true;
        }
        for (const torch of altarFireTorches) torch.enabled = true;
        musicEvents.igniteAltarFire();
    }
    if (reward.count >= 8) {
        const stage = reward.count - 7;
        const duration = stage === 3 ? 0.8 : 1.4;
        helmetCracked = true;
        menus.setHelmetState(true,helmetEquipped,false,true);
        helmetCrackStage = Math.max(helmetCrackStage, stage);
        hud.setHelmetCrackStage(helmetCrackStage,duration);
        const crackSound = musicEvents.playHelmetCrack(stage);
        if (reward.complete) {
            helmetBreakRemaining = duration;
            helmetBreakSound = crackSound;
        }
        hud.showNotification('La escafandra se esta quebrando...',{immediate:true});
    } else {
        hud.showNotification(reward.count === 1
            ? '¡Has encontrado un fragmento bajo el mar!'
            : '¡Has encontrado otro fragmento bajo el mar!');
    }
}
function updateHelmetBreak(delta) {
    if (helmetBreakRemaining === null) return;
    helmetBreakRemaining -= delta;
    // Esperar tanto a la extensión visual como al final real del sonido.
    if (helmetBreakRemaining > 0 || helmetBreakSound?.playing) return;
    helmetBreakRemaining = null;
    helmetBreakSound = null;
    musicEvents.playHelmetGlassPop();
    helmetBroken = true;
    helmetEquipped = false;
    menus.setHelmetState(true,false,true);
    hud.hideDivingAir();
    hud.showNotification('El cristal de la escafandra termino de romperse. Ya no puedes volver a equiparlo',{immediate:true});
}
const divingAir = createDivingAir(DIVING_AIR_SECONDS);
const drowningRescue = createDrowningRescue({ onBlack: restorePlayerAfterDrowning, onComplete: finishDrowningRescue });
function beginDrowningRescue() {
    if (!gameStarted || !seaHeart || caveMap?.active || metalRoom?.active || drowningRescue.active) return false;
    const gx = Math.floor((camera.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
    const gz = Math.floor((camera.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
    const atSea = seaSoundField?.surface[gz * mapWidth + gx] === 1;
    telescopeView?.cancel();
    drowningRescueContext = {
        river: riverSoundField?.river[gz * mapWidth + gx] === 1,
        preserveFragments: atSea,
        repairHelmet: atSea && !seaHeart.complete && seaHeart.count > 0 && (helmetCracked || helmetBroken),
        inventory: inventoryRunning, pointerSpeed: controls.pointerSpeed
    };
    isDead = true;
    cancelActiveDialog(); clearGreetingInput();
    controls.pointerSpeed = 0;
    heldMate?.cancel();
    if (!drowningRescueContext.river) riverCameraMotion.reset();
    menus.hideForGameplay(); hud.hideInteraction(); hud.hideDivingAir(); hud.hideStamina(); hud.setRiverWarning(false);
    touchControls?.sync(false);
    touchControls?.hide();
    musicEvents.setPaused(true);
    drowningRescue.start({ waitForInput: drowningRescueContext.river });
    return true;
}
function restorePlayerAfterDrowning() {
    riverCameraMotion.reset();
    if (drowningRescueContext.repairHelmet) {
        helmetBroken = false; helmetCracked = false; helmetCrackStage = 0;
    } else if (seaHeart.complete && helmetCracked) {
        helmetBroken = true; helmetCrackStage = 3;
    }
    helmetBreakRemaining = null; helmetBreakSound = null;
    if (!seaHeart.complete && !drowningRescueContext.preserveFragments) {
        seaHeart.reset();
        musicEvents.resetSeaHeartEvent();
        for (const flame of altarFlames) { flame.visible = false; flame.userData.visibilityEnabled = false; }
        for (const torch of altarFireTorches) torch.enabled = false;
    }
    // Continuar desde el mismo fragmento pendiente cuando el rescate fue en el mar.
    revealNextSeaHeartFragment();
    helmetEquipped = false;
    pinkSunglassesEquipped = false;
    setHeldItem(null);
    setHandTorchEnabled(false);
    if (minimap.enabled) minimap.toggle();
    menus.setItemActive('map', false);
    menus.setPinkSunglassesState(hasPinkSunglasses, false);
    menus.setItemDescription('Pulsa un objeto para usarlo.');
    divingAir.reset(); stamina = STAMINA_MAX;
    clearGreetingInput(); isCrouching = false; canJump = true; bedSettleIndex = -1;
    seatedChair = chairEntryPosition = null; isFlying = false;
    const landing = drowningRescueContext.river ? riverDrowningLanding : { x: playerStartX, z: playerStartZ };
    const x = landing.x * UNIT_SIZE, z = landing.z * UNIT_SIZE;
    camera.position.set(x, getTerrainHeight(x, z) + PLAYER_HEIGHT, z);
    camera.rotation.set(0, 0, 0);
    if (drowningRescueContext.river) camera.lookAt(lakeHouseLayout.origin.x, camera.position.y, lakeHouseLayout.origin.z);
    camera.updateMatrixWorld(true);
    previousPlayerPosition.copy(camera.position);
    playerWasSubmerged = false; underwaterBlend = 0; vegetationBlend = 0; surfaceVegetationBlend = 1;
    targetInteractable = null;
    menus.setHelmetState(hasDivingHelmet, helmetEquipped, helmetBroken, helmetCracked);
    menus.setSeaHeartState(seaHeart.count, seaHeart.complete);
    hud.setHelmetCrackStage(helmetCrackStage, 0);
    hud.setHelmetViewVisible(false); hud.setUnderwaterTint(0);
    musicEvents.resetWaterAudio(); musicEvents.resetRiverAmbience(); musicEvents.resetSeaAmbience();
    forestAmbienceSample = riverSoundSample = seaSoundSample = null;
    forestAmbienceSampleTime = riverSoundSampleTime = seaSoundSampleTime = 0;
    if (drowningRescueContext.river) {
        menus.showDialog(riverDrowningMessage, { speaker: '?', blurBackdrop: false });
    } else {
        grahamRescuePending = true;
        hud.showNotification('Te ahogaste. Graham logro rescatarte otra vez', { immediate: true });
    }
}
function finishDrowningRescue() {
    controls.pointerSpeed = drowningRescueContext.pointerSpeed;
    clearGreetingInput(); isDead = false;
    if (controls.isLocked) {
        inventoryRunning = isInventoryOpen = false;
        menus.hideForGameplay(); musicEvents.setPaused(false);
    } else if (drowningRescueContext.inventory) {
        inventoryRunning = isInventoryOpen = true;
        menus.showInventory(); musicEvents.setPaused(false);
    } else { inventoryRunning = isInventoryOpen = false; menus.showPause(); }
    drowningRescueContext = null;
    touchControls?.show();
    touchControls?.sync(controls.isLocked);
}
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
const altarFireSoundRelative = new THREE.Vector3();
let woodStoveFire = null;
const stoveFireSoundRelative = new THREE.Vector3();
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
let forestMovementBoundary = null;
const forestHiddenRoots = new Map();
const forestDimmedLights = new Map();
const forestInteriorLights = [];
const waterWaveTime = { value: 0 };
const raisedWaterCell = {value:new THREE.Vector4()};
let vegetationSectors = null;
let structureSectors = null;
let fogCulling = null;
let grahamSprite = null;
let targetInteractable = null;
let divingHelmetMesh = null, mateInteractable = null;
let isRidingBoat = false;
let boatReference = null;
let seatedChair = null;
let chairEntryPosition = null;
const boats = [];
let boatFloatTime = 0;
const BOAT_EYE_OFFSET = 0.70;
const BOAT_SEAT_BACK_OFFSET = 0.70;
const boatSeatOffset = new THREE.Vector3();

function getBoatEyesHeight(boat) {
    return boat.position.y + boat.geometry.parameters.height / 2
        + PLAYER_HEIGHT * 0.6 - BOAT_EYE_OFFSET;
}

let isDialogOpen = false;
let dialogIndex = 0;
let activeDialogs = npcDialogs;
let activeDialogSpeaker = 'Graham';
let deliveringHeart = false;
let bridgeKeyEventActive = GRAHAM_BRIDGE_KEY_AVAILABLE;

// --- SETUP DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14); // Noche azulada lúgubre
const WORLD_VISIBILITY_DISTANCE = 300;
const terrainVisibilityDistance = { value: WORLD_VISIBILITY_DISTANCE };
const MOUNTAIN_VISIBILITY_DISTANCE = 600;
const FOG_RESIDUAL = 0.0001;
let underwaterBlend = 0;
let playerWasSubmerged = false;
const underwaterStrength = {value:0};
const pinkSunglassesTint = {value:0};
const sunglassesViewColor = {value:new THREE.Vector3(...LENS_VIEWS[0].tint)};
const sunglassesNegativeView = {value:0};
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
const riverCameraMotion = createRiverCameraMotion(THREE, camera);
const riverCenterOffset = { x: 0, z: 0 };
const riverLakeDirection = { x: 0, z: 0 };
const riverDisplacement = { x: 0, z: 0 };
const riverBridgeBounds = new THREE.Box3();
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
torchLight.position.set(-0.32, -0.12, -0.5); // La antorcha se sostiene con la mano izquierda.
camera.add(torchLight);
const heldHeartLight=new THREE.PointLight(0x35dfff,0,4.5,2);
heldHeartLight.name='held-forest-heart-light';
heldHeartLight.position.set(.25,-.2,-.5);camera.add(heldHeartLight);
function setHandTorchEnabled(enabled) {
    if (enabled && isPlayerUnderwater()) enabled = false;
    handTorchEnabled = enabled;
    menus.setItemActive('torch', enabled);
    torchLight.intensity = enabled ? 8 : 0;
}
function isPlayerUnderwater() {
    if(metalRoom?.active)return false;
    if (caveMap?.active) return caveMap.isWater(camera.position.x,camera.position.z)
        && camera.position.y < caveMap.getWaterHeight(camera.position.x);
    return camera.position.y < getWaterSurfaceHeight(camera.position.x,camera.position.z)
        && isPlayerWaterCell(camera.position.x, camera.position.z);
}
function isPlayerWaterCell(x, z) {
    const gx = Math.floor((x + UNIT_SIZE / 2) / UNIT_SIZE), gz = Math.floor((z + UNIT_SIZE / 2) / UNIT_SIZE);
    const water = waterDeckMap?.[gz]?.[gx] || floorMap[gz]?.[gx];
    if (!['WATER', 'WATER_ROCK', 'BOAT'].includes(water)) return false;
    const top = slabTops.get(gz * mapWidth + gx) ?? (waterDeckMap?.[gz]?.[gx] ? elevationMap[gz]?.[gx] : null);
    const feet = camera.position.y - (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT);
    return top == null || feet < top - 0.08;
}
function getRiverBridgeUnderside(x, z) {
    const gx = Math.floor((x + UNIT_SIZE / 2) / UNIT_SIZE), gz = Math.floor((z + UNIT_SIZE / 2) / UNIT_SIZE);
    if (gx < 0 || gz < 0 || gx >= mapWidth || gz >= mapHeight || !riverSoundField?.river[gz * mapWidth + gx]) return Infinity;
    const slab = slabTops.get(gz * mapWidth + gx);
    if (slab != null) return slab - SLAB_HEIGHT;
    return waterDeckMap?.[gz]?.[gx] ? elevationMap[gz][gx] - WATER_DECK_THICKNESS : Infinity;
}
function canPassUnderRiverBridge(x, z, object = null) {
    if (!helmetEquipped || helmetBroken || isFlying || isRidingBoat || caveMap?.active || metalRoom?.active) return false;
    const underside = getRiverBridgeUnderside(x, z);
    if (!Number.isFinite(underside) || camera.position.y > underside - 0.02) return false;
    if (!object) return true;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    riverBridgeBounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
    return camera.position.y < riverBridgeBounds.min.y - 0.02;
}
function getPlayerGroundHeight(x, z) {
    if (canPassUnderRiverBridge(x, z)) {
        // Las muestras del terreno ya contienen el lecho real bajo el tablero.
        return sampleTerrainHeight(x, z, mapWidth, mapHeight, floorMap, elevationMap, null, mountainPathProfile, terrainHeightSamples);
    }
    return getTerrainHeight(x, z);
}
function isHelmetUnderwater() {
    return helmetEquipped && !helmetBroken && !isFlying && !isRidingBoat && isPlayerUnderwater();
}
function isHelmetSubmergedInRiver() {
    if (!helmetEquipped || helmetBroken || isRidingBoat || isFlying || caveMap?.active || metalRoom?.active
        || camera.position.y >= WATER_SURFACE_HEIGHT || !riverSoundField) return false;
    const gx = Math.floor((camera.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
    const gz = Math.floor((camera.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
    return gx >= 0 && gz >= 0 && gx < mapWidth && gz < mapHeight
        && riverSoundField.river[gz * mapWidth + gx] === 1;
}
function getRiverDisplacement(x,z,delta) {
    getRiverCenterOffset(riverSoundField,UNIT_SIZE,x,z,riverCenterOffset);
    getRiverLakeDirection(riverSoundField,UNIT_SIZE,x,z,riverLakeDirection);
    const alongFlow=riverCenterOffset.x*riverLakeDirection.x+riverCenterOffset.z*riverLakeDirection.z;
    riverCenterOffset.x-=riverLakeDirection.x*alongFlow;
    riverCenterOffset.z-=riverLakeDirection.z*alongFlow;
    const maximum=getRiverCurrentSpeed(UNIT_SIZE)*delta;
    let dx=riverLakeDirection.x*maximum,dz=riverLakeDirection.z*maximum;
    const distance=Math.hypot(riverCenterOffset.x,riverCenterOffset.z);
    if(distance>.001) {
        const travel=Math.min(maximum,distance*(1-Math.exp(-delta*4)));
        dx+=riverCenterOffset.x*travel/distance;dz+=riverCenterOffset.z*travel/distance;
    }
    const scale=Math.min(1,maximum/(Math.hypot(dx,dz)||1));
    riverDisplacement.x=dx*scale;riverDisplacement.z=dz*scale;
    return riverDisplacement;
}
function advanceDrowningRiver(delta) {
    const position=controls.getObject().position;
    // Mantener el arrastre hasta negro, con las mismas colisiones que durante la inmersión.
    while(delta>0 && isHelmetSubmergedInRiver()) {
        const step=Math.min(delta,.05),push=getRiverDisplacement(position.x,position.z,step);
        if(!isWall(position.x+push.x,position.z))position.x+=push.x;
        if(!isWall(position.x,position.z+push.z))position.z+=push.z;
        delta-=step;
    }
}
function getWaterSurfaceHeight(x,z) {
    if (caveMap?.active) return caveMap.getWaterHeight(x);
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
const helmetInteractionCenter = new THREE.Vector3();
const helmetInteractionOffset = new THREE.Vector3();
const mateInteractionCenter = new THREE.Vector3();
const mateInteractionOffset = new THREE.Vector3();
const telescopeInteractionCenter = new THREE.Vector3(), telescopeInteractionOffset = new THREE.Vector3();
const frameCameraDirection = new THREE.Vector3();
const frameCameraHeading = new THREE.Euler(0, 0, 0, 'YXZ');
const frameMoonPosition = new THREE.Vector3();
const centerVec = new THREE.Vector2(0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(0.5); 
document.body.appendChild(renderer.domElement);
const performancePanel = createPerformancePanel(renderer, isTouchMode ? 30 : 60);
const forestTrailStrength={value:0};
const underwaterView = createUnderwaterView(THREE,renderer,underwaterStrength,underwaterViewTime,pinkSunglassesTint,sunglassesViewColor,sunglassesNegativeView,forestTrailStrength);

const controls = new PointerLockControls(camera, document.body);
// La portada tiene su cámara; ningún gesto debe girar la cámara del dormitorio.
controls.disconnect();
if (isTouchMode) controls.disconnect();
else {
    guardPointerLockMouse(controls);
    controls.lock=()=>requestGamePointerLock(document.body).catch(()=>{});
}
const dialogLookAnchor = new THREE.Quaternion();
const dialogLookInverse = new THREE.Quaternion();
const dialogLookDirection = new THREE.Vector3();
const dialogLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let dialogLookActive = false;
let dialogLookX = 0, dialogLookY = 0;
function beginDialogLook() {
    dialogLookAnchor.copy(camera.quaternion);
    dialogLookInverse.copy(dialogLookAnchor).invert();
    dialogLookX = dialogLookY = 0;
    dialogLookActive = true;
}
function constrainDialogLook(dt) {
    if (!dialogLookActive || !controls.isLocked) return;
    dialogLookDirection.set(0, 0, -1).applyQuaternion(camera.quaternion).applyQuaternion(dialogLookInverse);
    const tangent = Math.hypot(dialogLookDirection.x, dialogLookDirection.y);
    const angle = Math.atan2(tangent, -dialogLookDirection.z);
    const targetX = tangent > 1e-8 ? dialogLookDirection.x * angle / tangent : 0;
    const targetY = tangent > 1e-8 ? dialogLookDirection.y * angle / tangent : 0;
    const dx = targetX - dialogLookX, dy = targetY - dialogLookY;
    const steps = Math.min(128, Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.01)));
    for (let i = 0; i < steps; i++) {
        const radius = Math.hypot(dialogLookX, dialogLookY);
        const inward = dx * dialogLookX + dy * dialogLookY < 0;
        // La resistencia crece antes de llegar al borde; volver hacia dentro sigue siendo fácil.
        const weight = inward ? 1 : 1 - 0.92 * THREE.MathUtils.smoothstep(radius, 0.14, 0.34);
        dialogLookX += dx / steps * weight;
        dialogLookY += dy / steps * weight;
        const nextRadius = Math.hypot(dialogLookX, dialogLookY);
        if (nextRadius > radius && nextRadius > 0.34) {
            const room = Math.max(0, 0.34 - radius);
            const eased = room > 1e-8 ? room * (1 - Math.exp(-(nextRadius - radius) / room)) : 0;
            const scale = (radius + eased) / nextRadius;
            dialogLookX *= scale;
            dialogLookY *= scale;
        }
    }
    const radius = Math.hypot(dialogLookX, dialogLookY);
    if (radius > 0.23) {
        const relaxed = 0.23 + (radius - 0.23) * Math.exp(-Math.min(dt, 0.1) * 0.85);
        dialogLookX *= relaxed / radius;
        dialogLookY *= relaxed / radius;
    }
    const limitedRadius = Math.hypot(dialogLookX, dialogLookY);
    const sine = limitedRadius > 1e-8 ? Math.sin(limitedRadius) / limitedRadius : 1;
    dialogLookDirection.set(dialogLookX * sine, dialogLookY * sine, -Math.cos(limitedRadius)).applyQuaternion(dialogLookAnchor);
    dialogLookEuler.set(Math.asin(THREE.MathUtils.clamp(dialogLookDirection.y, -1, 1)),
        Math.atan2(-dialogLookDirection.x, -dialogLookDirection.z), 0, 'YXZ');
    camera.quaternion.setFromEuler(dialogLookEuler);
}
function resumeGame() {
    if (isDead || !mapLoaded || observatoryMenu.active || gardenNote.active) return;
    if (isTouchMode) {
        musicEvents.unlock();
        controls.isLocked = true;
        controls.dispatchEvent({ type: 'lock' });
    } else controls.lock();
}
function pauseGame() {
    if(gardenNote.active){gardenNote.hide();menus.showPause();}
    if(observatoryMenu.active){observatoryMenu.hide();menus.showPause();}
    telescopeView?.cancel();
    const wasInventoryRunning = inventoryRunning;
    inventoryRunning = false;
    isInventoryOpen = false;
    if (wasInventoryRunning) menus.hideInventory();
    if (!controls.isLocked) {
        if (wasInventoryRunning) controls.dispatchEvent({type:'unlock'});
        return;
    }
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
const menus = createMenus({ onResume: resumeGame, onUseItem: useInventoryItem,
    onDialogueCharacter: musicEvents.playDialogueCharacter });
const observatoryMenu=createObservatoryMenu();
const gardenNote=createGardenNote(()=>{if(gameStarted&&!isDead)resumeGame();});
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
function cancelActiveDialog() {
    if (!isDialogOpen) return;
    if (grahamDap.active) {
        grahamDap.cancel();
        controls.pointerSpeed = dapPointerSpeed;
    }
    isDialogOpen = false;
    dialogLookActive = false;
    dialogIndex = 0;
    deliveringHeart = false;
    menus.hideDialog();
    clearGreetingInput();
}
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
    if(!isDialogOpen)return;
    touchControls?.syncDialogue(true);
    if (activeDialogs === bridgeKeyDeliveryDialogs && activeDialogs[dialogIndex]?.action === 'give-bridge-key') {
        if (heartQuest.receiveBridgeKey(bridgeKeyEventActive)) {
            keyInventory.add('bridge-key');
            updateKeyInventory();
            hud.showReceivedItem('la llave del puente');
        }
        dialogIndex++;
        showActiveDialog();
        return;
    }
    if (activeDialogs === grahamJournal.pages) {
        menus.showBook(grahamJournal);
        return;
    }
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

    const thought = activeDialogs === mateAlreadyHeldDialogs;
    menus.showDialog(activeDialogs[dialogIndex], thought
        ? { anonymous: true, blurBackdrop: false, smooth: true }
        : { speaker: activeDialogSpeaker });
}
const spawnGreeting = createSpawnGreeting({
    door: spawnRoomExit, unitSize: UNIT_SIZE, halfWidth: UNIT_SIZE / 2 - DOOR_SIDE_MARGIN
});
const guidedLook = createGuidedLook(THREE);
const previousPlayerPosition = new THREE.Vector3();
let greetingPointerSpeed = 1;

function clearGreetingInput(preserveMovement = false) {
    if (!preserveMovement) for (const key of Object.keys(moveState)) moveState[key] = false;
    velocity.set(0, 0, 0);
    velocityY = 0;
    surfaceJumpActive = false;
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
    if (woodcutting.active || seatedChair) return;
    if (!spawnGreeting.active) {
        if (spawnGreeting.played || isDead || isFlying || isRidingBoat || isDialogOpen || !grahamSprite) return;
        const door = solidInteractables.find(object => object.userData.type === 'DOOR'
            && object.userData.gx === spawnRoomExit.x && object.userData.gz === spawnRoomExit.z);
        if (!spawnGreeting.tryStart(previousPlayerPosition, camera.position, door?.userData.isOpen)) return;
        clearGreetingInput();
        greetingPointerSpeed = controls.pointerSpeed;
        controls.pointerSpeed = 0;
        const target=grahamSprite.position.clone();
        target.y+=GRAHAM_HEIGHT*0.25;
        guidedLook.begin(camera,target);
        targetInteractable = null;
        hud.hideInteraction();
        showGreetingPhase();
    }
    const previousPhase = spawnGreeting.phase;
    spawnGreeting.update(delta);
    if (previousPhase !== 'invitation') {
        guidedLook.update(spawnGreeting.turnProgress);
    }
    if (previousPhase !== spawnGreeting.phase) {
        showGreetingPhase();
    }
}

function toggleDivingHelmet() {
    if (!hasDivingHelmet || helmetBroken || helmetBreakRemaining !== null || !isInventoryOpen || isDead) return;
    helmetEquipped = !helmetEquipped;
    menus.setHelmetState(hasDivingHelmet, helmetEquipped, helmetBroken, helmetCracked);
}

function setHeldItem(item) {
    if (item === 'sea-heart') return;
    heldItem = item;
    if (item !== 'astroscope') telescopeView?.cancel();
    menus.setItemActive('astroscope',item === 'astroscope');
    if (item !== 'mate') heldMate?.cancel();
    menus.setItemActive('mate', item === 'mate');
    menus.setItemActive('heart', item === 'heart');
    if (item !== 'key') keyInventory.clearSelection();
    menus.setItemActive('key', item === 'key');
    if (heldItemSprite && item) {
        heldItemSprite.material.map = heldItemTextures[item] || heldItemTextures.heart;
        heldItemSprite.rotation.z = item === 'key' ? Math.PI + 1.35 : item === 'heart' ? -0.12 : 0.25;
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
        menus.setItemDescription('El cristal de la escafandra termino de romperse. Ya no puedes volver a equiparlo');
    } else if (item === 'helmet' && hasDivingHelmet) {
        toggleDivingHelmet();
        menus.setItemDescription(helmetEquipped ? 'Escafandra equipada.' : 'Escafandra guardada.');
    } else if (item === 'pink-sunglasses' && hasPinkSunglasses) {
        pinkSunglassesEquipped = !pinkSunglassesEquipped;
        menus.setPinkSunglassesState(true, pinkSunglassesEquipped);
        menus.setItemDescription(pinkSunglassesEquipped ? `Lentes equipados: ${LENS_VIEWS[lensViewIndex].name}. Pulsa aquí para quitarlos.` : 'Lentes guardados.');
    } else if (item === 'torch' && hasTorch) {
        const before = handTorchEnabled;
        gameActions.torch();
        menus.setItemDescription(before === handTorchEnabled
            ? isPlayerUnderwater() ? 'La antorcha no puede encenderse bajo el agua.' : 'La antorcha está bloqueada durante el evento del corazón.'
            : handTorchEnabled ? 'Antorcha encendida.' : 'Antorcha apagada.');
    } else if (item === 'mate' && hasMate) {
        setHeldItem(heldItem === 'mate' ? null : 'mate');
        menus.setItemDescription(heldItem === 'mate' ? (isTouchMode ? 'Mate en la mano. Pulsa A para tomar; mantén A para seguir tomando.' : 'Mate en la mano. Clic derecho para tomar; mantenlo para seguir bebiendo.') : 'Mate guardado.');
    } else if (item === 'astroscope' && hasAstroscope) {
        setHeldItem(heldItem === 'astroscope' ? null : 'astroscope');
        menus.setItemDescription(heldItem === 'astroscope'
            ? telescopeRepaired ? (isTouchMode
                ? `Astroscopio preparado. A: zoom ${TELESCOPE_ZOOM.repaired}×; otra vez A: ${TELESCOPE_ZOOM.boosted}×; otra vez A: bajar.`
                : `Astroscopio preparado. Clic izquierdo: mirar o bajar (${TELESCOPE_ZOOM.repaired}×); clic derecho: ${TELESCOPE_ZOOM.boosted}×.`)
            : isTouchMode ? 'Astroscopio en la mano. A para mirar; otra vez A intenta acercarte más.'
                : 'Astroscopio en la mano. Clic izquierdo para mirar o bajar; clic derecho intenta acercarte más.'
            : 'Astroscopio guardado.');
    } else if (item === 'map' && hasMap) {
        gameActions.map();
        menus.setItemDescription(minimap.enabled ? 'Mapa abierto al volver al juego.' : 'Mapa cerrado.');
    } else if (item === 'heart' && heartQuest.hasHeart) {
        setHeldItem(heldItem==='heart'?null:'heart');
        menus.setItemDescription(heldItem==='heart'?'Corazón del Bosque en la mano.':'Corazón del Bosque guardado en el inventario.');
    } else if (item === 'sea-heart' && seaHeart?.count) {
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
let inventoryRunning = false; // Inventario con cursor libre, simulación y movimiento activos.
const forestCueIndicator = document.getElementById('forest-cue-indicator');
function updateForestCueIndicator(playbackTime, active) {
    forestCueIndicator.hidden = !active;
    if (!active) {
        forestCueIndicator.textContent = '0';
        forestCueIndicator.setAttribute('aria-label', 'Marca 0');
        return;
    }
    // La marca 0 también se ve durante la breve espera previa al audio.
    if (playbackTime === null) return;
    let mark = 0;
    while (mark < FOREST_CUES.length - 1 && playbackTime >= FOREST_CUES[mark + 1]) mark++;
    if (forestCueIndicator.textContent !== String(mark)) {
        forestCueIndicator.textContent = String(mark);
        forestCueIndicator.setAttribute('aria-label', `Marca ${mark}`);
    }
}

controls.addEventListener('lock', () => {
    if (isDead || !mapLoaded) return;
    gameStarted = true;
    inventoryRunning = false;
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
    if (drowningRescue.active) return;
    observatoryScope?.exit();
    telescopeView?.cancel();
    woodcutting.setVisible(false);
    if (!inventoryRunning) jumpHeld = false;
    hud.hideInteraction();
    menus.hideDialog();
    musicEvents.setPaused(!inventoryRunning);
    if (!inventoryRunning) {
        for (const direction of Object.keys(moveState)) moveState[direction] = false;
        velocity.set(0, 0, 0);
        isRunning = false;
        crouchRequested = false;
        updatePlayerPosture();
    }
    keyboardBinding.resetSequence();
    touchControls?.sync(false);
    if (gameStarted && !isDead && !observatoryMenu.active && !gardenNote.active) {
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
const inventoryMoveAxis = new THREE.Vector3();



let isFlying = testMode.enabled;

function toggleTestMode() {
    if(metalRoom?.active||metalRoom?.busy)return;
    if (seatedChair || observatoryScope?.seated || isRidingBoat || musicEvents.isEventActive('forest') || heartLevitationHeight > 0) return;
    testMode.toggle();
    isFlying = testMode.enabled;

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
    m.innerText = "Modo de prueba " + (testMode.enabled ? "Activado" : "Desactivado");
    m.style.display = 'block';

    if (window.sysMsgTimeout) clearTimeout(window.sysMsgTimeout);
    window.sysMsgTimeout = setTimeout(() => { m.style.display = 'none'; }, 2500);
}

function toggleDoorWithPlayer(door) {
    const opening = !door.userData.isOpen;
    toggleDoor(door, interactables, collisionMap);
    if (opening && door.userData.isOpen) musicEvents.playDoorOpen(camera.worldToLocal(door.getWorldPosition(new THREE.Vector3())));
    if (!opening && !door.userData.isOpen) musicEvents.playDoorClose(camera.worldToLocal(door.getWorldPosition(new THREE.Vector3())));
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
function sitOnChair(chair) {
    chair=chair.userData.seatTarget??chair;
    if (isFlying || isRidingBoat || !canJump || heartLevitationHeight > 0
        || musicEvents.isEventActive('forest')) return;
    const player = controls.getObject();
    chairEntryPosition = player.position.clone();
    clearGreetingInput();
    isCrouching = crouchRequested = false;
    seatedChair = chair;
    canJump = false;
    bobTimer = 0;
    const eyeOffset = new THREE.Vector3(0,0,chair.userData.seatEyeOffsetZ ?? 0).applyEuler(chair.rotation);
    player.position.set(chair.position.x + eyeOffset.x, chair.position.y + chair.userData.seatHeight + PLAYER_HEIGHT * 0.5, chair.position.z + eyeOffset.z);
    camera.lookAt(player.position.x + Math.sin(chair.rotation.y), player.position.y + (chair.userData.seatLookLift ?? 0),
        player.position.z + Math.cos(chair.rotation.y));
    targetInteractable = null;
}

function standFromChair() {
    const chair = seatedChair;
    if (!chair) return;
    const candidates = [chairEntryPosition];
    for (const radius of [1, 1.5, 2]) for (let i = 0; i < 8; i++) {
        const angle = chair.rotation.y + i * Math.PI / 4;
        candidates.push({x: chair.position.x + Math.sin(angle) * radius,
            z: chair.position.z + Math.cos(angle) * radius});
    }
    const exit = candidates.find(point => {
        if (!point) return false;
        const height = getTerrainHeight(point.x, point.z);
        return Math.abs(height - chair.position.y) < 0.75
            && !hasObstacle(point.x, point.z, mapWidth, mapHeight, collisionMap, floorMap,
                false, solidInteractables, null, height);
    });
    if (!exit) return;
    seatedChair = null;
    chairEntryPosition = null;
    clearGreetingInput();
    controls.getObject().position.set(exit.x, getTerrainHeight(exit.x, exit.z) + PLAYER_HEIGHT, exit.z);
    canJump = true;
    targetInteractable = null;
}

function showObservatoryChoice(kind) {
    if(!observatoryScope?.seated)return;
    if(isDialogOpen||observatoryMenu.active||spawnGreeting.active||grahamDap.active||heartPull.active||!controls.isLocked)return;
    clearGreetingInput();targetInteractable=null;hud.hideInteraction();
    const attaching=kind==='attach';
    observatoryMenu.show(attaching?'¿Acoplar el Astroscopio al Omniscopio?':'Elige qué quieres hacer.',
        attaching?['Acoplar','Cancelar']:['Mirar','Retirar Astroscopio'],index=>{
            if(attaching&&index===0) {
                astroscopeInstalled=true;hasAstroscope=false;
                summitObservatory.astroscopeDock.visible=true;menus.setAstroscopeVisible(false);
                if(heldItem==='astroscope')setHeldItem(null);
                hud.showNotification(`Astroscopio acoplado. Ahora puedes mirar por el Omniscopio a ${TELESCOPE_ZOOM.mounted}×.`);
            } else if(!attaching&&index===1) {
                astroscopeInstalled=false;hasAstroscope=true;
                summitObservatory.astroscopeDock.visible=false;menus.setAstroscopeVisible(true);
                hud.showNotification('Has guardado el Astroscopio en el inventario.');
            } else if(!attaching&&index===0) observatoryScope.enter();
            if(gameStarted&&!isDead)resumeGame();
        },0);
    if(isTouchMode){controls.isLocked=false;controls.dispatchEvent({type:'unlock'});}
    else controls.unlock();
}

function interact() {
    if (drowningRescue.active) {
        if (drowningRescue.waitingForContinue) {
            if (menus.completeDialogText()) return true;
            menus.hideDialog();
            if (drowningRescue.continue()) musicEvents.playWakeSplash();
        }
        return true;
    }
    if (!controls.isLocked || isDead || observatoryMenu.active || gardenNote.active) return false;
    if(metalRoom?.busy)return true;
    if(metalRoom?.active) {
        if(metalRoom.nearExit(controls.getObject().position)) {
            metalRoom.beginLeave();clearGreetingInput();targetInteractable=null;hud.hideInteraction();
        }
        return true;
    }
    if(observatoryScope?.active){observatoryScope.exit();velocity.set(0,0,0);velocityY=0;return true;}
    if(observatoryScope?.seated&&targetInteractable?.userData.type!=='OBSERVATORY_TELESCOPE') {
        observatoryScope.stand();velocity.set(0,0,0);velocityY=0;return true;
    }
    if(observatoryLadder?.active&&(!observatoryLadder.canUseScope||targetInteractable?.userData.type!=='OBSERVATORY_TELESCOPE'))return true;
    telescopeView?.cancel();
    if (bedCeilingTimer > 0 || bedHoleOpeningTime >= 0) return false;
    if (menus.isDialogVisible() && menus.completeDialogText()) return true;
    if (seatedChair && !isDialogOpen && targetInteractable?.userData.type !== 'READABLE_BOOK') {
        standFromChair();
        return true;
    }
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
            if (activeDialogs === grahamJournal.pages) {cancelActiveDialog();return true;}
            // Avanzar al siguiente diálogo
            if (dialogIndex < activeDialogs.length - 1) {
                dialogIndex++;
                showActiveDialog();
            } else {
                // Cerrar diálogo
                const completedHeartDelivery = deliveringHeart;
                if (activeDialogs === mateOfferDialogs && !hasMate) {
                    hasMate = true; menus.setMateVisible(true); hud.showReceivedItem('un mate');
                }
                if (activeDialogs === npcDialogs && !hasTorch) {
                    hasTorch = true;
                    menus.setTorchVisible(true);
                    hud.showReceivedItem('una antorcha');
                }
                if (activeDialogs === grahamRescueDialogs) grahamRescuePending = false;
                if (deliveringHeart) {
                    heartQuest.deliver(); menus.setHeartVisible(false);
                    if (heldItem === 'heart') setHeldItem(null);
                }
                deliveringHeart = false;
                isDialogOpen = false;
                dialogLookActive = false;
                menus.hideDialog();
                if (completedHeartDelivery) openMapChestAfterThanks();
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
            if(targetInteractable.userData.type==='LAKE_HATCH') {
                if(!isRidingBoat&&metalRoom.nearHatch(controls.getObject().position)
                    && !musicEvents.isEventActive('forest')&&heartLevitationHeight<=.15) {
                    metalRoom.beginEnter();clearGreetingInput();velocity.set(0,0,0);velocityY=0;
                    targetInteractable=null;hud.hideInteraction();
                }
                return true;
            }
            if(targetInteractable.userData.type==='OBSERVATORY_CHAIR'&&observatoryLadder?.canUseScope) {
                observatoryScope.sit();velocity.set(0,0,0);velocityY=0;
                for(const key of Object.keys(moveState))moveState[key]=false;
                targetInteractable=null;return true;
            }
            if(targetInteractable.userData.type==='GARDEN_NOTE') {
                clearGreetingInput();targetInteractable=null;hud.hideInteraction();gardenNote.show();
                if(isTouchMode){controls.isLocked=false;controls.dispatchEvent({type:'unlock'});}
                else controls.unlock();
                return true;
            }
            if(targetInteractable.userData.type==='OBSERVATORY_TELESCOPE') {
                if(astroscopeInstalled)showObservatoryChoice('installed');
                else if(hasAstroscope)showObservatoryChoice('attach');
                else hud.showNotification('Necesitas el Astroscopio para usar el Omniscopio.');
                return true;
            }
            if (targetInteractable.userData.type === 'READABLE_BOOK') {
                deliveringHeart = false;
                isDialogOpen = true;
                clearGreetingInput();
                beginDialogLook();
                activeDialogs = grahamJournal.pages;
                activeDialogSpeaker = grahamJournal.title;
                dialogIndex = 0;
                showActiveDialog();
                return true;
            }
            if (targetInteractable.userData.type === 'CHAIR') {
                sitOnChair(targetInteractable);
                return true;
            }
            if (targetInteractable.userData.id === 'graham-stump') {
                if (!isFlying && !isRidingBoat && canJump && !isDialogOpen && heartLevitationHeight <= 0
                    && !musicEvents.isEventActive('forest')) woodcutting.begin(targetInteractable);
                return true;
            }
            if (targetInteractable.userData.type === 'WIZARD_UPPER_DOOR') {
                wizardUpperFloor.toggleDoor(controls.getObject().position,
                    isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT);
                return true;
            }
            if (targetInteractable.userData.type === 'WORKSHOP_LAMP') {
                mountainWorkshop.lamp.toggle();
                return true;
            }
            if (targetInteractable.userData.type === 'TELESCOPE_WORKBENCH') {
                if(!hasAstroscope) {
                    hud.showNotification('Necesito encontrar el Astroscopio para instalar la Lente Bifrost.');
                } else if(!telescopeRepaired) {
                    telescopeRepaired=true;
                    telescopeView.repair();mountainWorkshop.installLens();
                    setHeldItem('astroscope');
                    hud.showNotification(`Has instalado la Lente Bifrost. El Astroscopio ahora alcanza ${TELESCOPE_ZOOM.repaired}× y ${TELESCOPE_ZOOM.boosted}×.`);
                } else hud.showNotification('La Lente Bifrost ya está instalada en el Astroscopio.');
                return true;
            }
            if (targetInteractable.userData.type === 'TELESCOPE_PICKUP') {
                if (hasAstroscope) return true;
                hasAstroscope=true;
                menus.setAstroscopeVisible(true);
                hud.showReceivedItem('un Astroscopio');
                const pickup=targetInteractable;
                pickup.visible=false; pickup.userData.visibilityEnabled=false;
                const index=interactables.indexOf(pickup);
                if (index>=0) interactables.splice(index,1);
                fogCulling?.unregister(pickup); pickup.removeFromParent();
                telescopeGlare?.dispose();telescopeGlare=null;
                pickup.geometry.dispose(); pickup.material.map?.dispose(); pickup.material.dispose();
                telescopeMesh=null; targetInteractable=null; hud.hideInteraction();
                setHeldItem('astroscope');
                return true;
            }
            if (targetInteractable.userData.type === 'PINK_SUNGLASSES_PICKUP') {
                if (hasPinkSunglasses) return true;
                hasPinkSunglasses = true;
                pinkSunglassesEquipped = true;
                menus.setPinkSunglassesState(true, true);
                hud.showReceivedItem('unos lentes de sol rosados');
                const pickup = targetInteractable;
                pickup.visible = false; pickup.userData.visibilityEnabled = false;
                interactables.splice(interactables.indexOf(pickup), 1);
                fogCulling?.unregister(pickup); pickup.removeFromParent();
                pickup.geometry.dispose(); pickup.material.dispose();
                targetInteractable = null; hud.hideInteraction();
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
                beginDialogLook();
                activeDialogs = hasMate ? mateAlreadyHeldDialogs : mateOfferDialogs;
                activeDialogSpeaker = hasMate ? 'Pensamiento' : 'Graham';
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
                } else if (targetInteractable.userData.item === 'pink-sunglasses') {
                    const chest = targetInteractable, opening = chest.userData.opening;
                    const pickup = chest.userData.sunglassesPickup;
                    chest.userData.opening = { update(delta) {
                        const done = opening.update(delta);
                        if (done && !hasPinkSunglasses) {
                            pickup.visible = true; pickup.userData.visibilityEnabled = true;
                            if (!interactables.includes(pickup)) interactables.push(pickup);
                        }
                        return done;
                    } };
                } else {
                    keyInventory.add(targetInteractable.userData.id);
                    updateKeyInventory();
                    hud.showReceivedItem('una llave');
                }
                mapChestSoundSource = targetInteractable;
                musicEvents.playChestUnlock(getMapChestSoundPosition());
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
                divingHelmetMesh = null;
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
                clearGreetingInput();
                beginDialogLook();
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

                deliveringHeart = !grahamRescuePending && hasTorch && heartQuest.hasHeart;
                activeDialogs = grahamRescuePending ? grahamRescueDialogs
                    : !hasTorch ? npcDialogs : deliveringHeart ? heartDeliveryDialogs : heartQuest.stage === 'delivered' ? heartDeliveredDialogs : heartSearchDialogs;
                if (!grahamRescuePending && hasTorch && heartQuest.stage === 'delivered') {
                    activeDialogs = heartQuest.hasBridgeKey ? bridgeKeyReceivedDialogs
                        : bridgeKeyEventActive ? bridgeKeyDeliveryDialogs : heartDeliveredDialogs;
                }
                dialogIndex = 0;
                showActiveDialog();
            } else if (targetInteractable.userData.type === 'DOOR') {
                if (targetInteractable.userData.locked) {
                    if (heldItem === 'key' && keyInventory.useOn(targetInteractable.userData.gx, targetInteractable.userData.gz)) {
                        musicEvents.playDoorKey(camera.worldToLocal(targetInteractable.getWorldPosition(new THREE.Vector3())));
                        updateKeyInventory();
                        unlockDoor(targetInteractable);
                        toggleDoorWithPlayer(targetInteractable);
                    }
                } else {
                    toggleDoorWithPlayer(targetInteractable);
                }
            } else if (targetInteractable.userData.type === 'GATE') {
                const gate = targetInteractable;
                // La hoja cerrada se extiende hacia +X: el giro positivo abre hacia -Z.
                const look = camera.getWorldDirection(new THREE.Vector3());
                const openAngle = look.z > 0 ? -Math.PI / 2 : Math.PI / 2;
                gate.userData.isOpen = !gate.userData.isOpen;
                gate.userData.collisionEnabled = !gate.userData.isOpen;
                gate.userData.motion = {
                    from: gate.userData.parentGroup.rotation.y,
                    to: gate.userData.isOpen ? openAngle : 0,
                    elapsed: 0
                };
            }
        }
    }
}

const gameActions = {
    isEnabled: () => mapLoaded && !drowningRescue.active,
    isDrowningTransitionActive: () => drowningRescue.active,
    cycleLensView() {
        if (!gameStarted || !mapLoaded || !controls.isLocked || isDead || isInventoryOpen || isDialogOpen
            || !hasPinkSunglasses || !pinkSunglassesEquipped || woodcutting.active || grahamDap.active
            || heartPull.active || spawnGreeting.active) return;
        lensViewIndex = (lensViewIndex+1) % LENS_VIEWS.length;
        const view = LENS_VIEWS[lensViewIndex];
        sunglassesViewColor.value.fromArray(view.tint);
        sunglassesNegativeView.value = view.negative ? 1 : 0;
        menus.setItemDescription(`Lentes equipados: ${view.name}. Pulsa aquí para quitarlos.`);
        hud.showLensMode(view.name);
    },
    isPaused: () => gameStarted && !isDead && !controls.isLocked && !inventoryRunning,
    isInventoryOpen: () => isInventoryOpen,
    cancelDialogue: cancelActiveDialog,
    toggleTestMode,
    toggleDayNight,
    stopMusic() { if (gameStarted && !isDead && controls.isLocked) musicEvents.stopMusic(); },
    start() { if (mapLoaded && !gameStarted) resumeGame(); },
    interact,
    holdInteract(pressed) {
        if (!woodcutting.active || !controls.isLocked || isDead) return false;
        woodcutting.holdExit(pressed);
        return true;
    },
    activateBridgeKeyEvent() {
        if (!gameStarted || !mapLoaded || isDead || !controls.isLocked || bridgeKeyEventActive) return;
        bridgeKeyEventActive = true;
        hud.showNotification('Evento Llave del Puente Activada');
    },
    grantForestHeartForTesting() {
        if (!gameStarted || !mapLoaded || !controls.isLocked || isDead || isDialogOpen || isInventoryOpen || isRidingBoat) return;
        if (!heartQuest.collect()) return;
        menus.setHeartVisible(true);
        hud.showReceivedItem('el Corazón del Bosque');
    },
    teleportToForestHeart() {
        if(metalRoom?.active||metalRoom?.busy)return;
        if (seatedChair) return;
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
    teleportToTelescope() {
        if(metalRoom?.active||metalRoom?.busy)return;
        if (!gameStarted || !mapLoaded || !controls.isLocked || isDead || isInventoryOpen || isDialogOpen
            || isRidingBoat || seatedChair || woodcutting.active || caveMap?.active || !telescopeMesh) return;
        if (!telescopeMesh.geometry.boundingSphere) telescopeMesh.geometry.computeBoundingSphere();
        const center=telescopeMesh.localToWorld(telescopeInteractionCenter.copy(telescopeMesh.geometry.boundingSphere.center));
        let destination=null;
        for (const radius of [2.1,2.6,3.1]) for (let step=0;step<12&&!destination;step++) {
            const angle=step*Math.PI/6,x=center.x+Math.sin(angle)*radius,z=center.z+Math.cos(angle)*radius;
            const gx=Math.floor((x+UNIT_SIZE/2)/UNIT_SIZE),gz=Math.floor((z+UNIT_SIZE/2)/UNIT_SIZE);
            if (!['GRASS','TALL_GRASS','BUSH','TREE','DIRT','SLAB','WOOD','SAND'].includes(floorMap[gz]?.[gx])
                || !isSafeGroundPosition(x,z)) continue;
            destination={x,z};
        }
        if (!destination) return;
        touchControls?.reset();moveState.forward=moveState.backward=moveState.left=moveState.right=false;
        isFlying=false;velocity.set(0,0,0);velocityY=0;canJump=true;bobTimer=0;
        camera.position.set(destination.x,getTerrainHeight(destination.x,destination.z)+PLAYER_HEIGHT,destination.z);
        camera.lookAt(center.x,center.y+0.04,center.z);
        previousPlayerPosition.copy(camera.position);targetInteractable=null;hud.hideInteraction();
    },
    teleportToWizardHouse() {
        if(metalRoom?.active||metalRoom?.busy)return;
        if (!gameStarted || !mapLoaded || !controls.isLocked || isDead || isInventoryOpen || isDialogOpen
            || isRidingBoat || seatedChair || woodcutting.active || caveMap?.active || !wizardUpperFloor) return;
        const door={x:wizardHouseLayout.door.x*UNIT_SIZE,z:wizardHouseLayout.door.z*UNIT_SIZE},targetGround=getTerrainHeight(door.x,door.z);
        let destination=null;
        const offsets=[[0,0],[0,.65],[0,-.65],[-.45,.95],[-.45,-.95],[.45,.95],[.45,-.95]];
        for (const [dx,dz] of offsets) {
            const x=door.x-3.3+dx,z=door.z+dz,gx=Math.floor((x+UNIT_SIZE/2)/UNIT_SIZE),gz=Math.floor((z+UNIT_SIZE/2)/UNIT_SIZE);
            if (!['GRASS','TALL_GRASS','BUSH','TREE','DIRT','SLAB','WOOD','SAND'].includes(floorMap[gz]?.[gx])
                || !isSafeGroundPosition(x,z)) continue;
            destination={x,z};break;
        }
        if (!destination) return;
        touchControls?.reset();moveState.forward=moveState.backward=moveState.left=moveState.right=false;
        isFlying=false;velocity.set(0,0,0);velocityY=0;canJump=true;bobTimer=0;
        camera.position.set(destination.x,getTerrainHeight(destination.x,destination.z)+PLAYER_HEIGHT,destination.z);
        camera.lookAt(door.x,targetGround+1.05,door.z);
        previousPlayerPosition.copy(camera.position);targetInteractable=null;hud.hideInteraction();
    },
    move(direction, pressed) {
        if(observatoryScope?.active){observatoryScope.setAimInput(direction,pressed);return;}
        moveState[direction] = pressed;
    },
    scopeAim(direction,pressed){observatoryScope?.setAimInput(direction,pressed);},
    scopeZoom(direction,pressed){observatoryScope?.setZoomInput(direction,pressed);},
    isObservatoryScopeActive(){return !!observatoryScope?.active;},
    holdJump(pressed) {
        pressed = pressed && !isHelmetUnderwater();
        jumpHeld = pressed;
        if (pressed) bedSettleIndex = -1;
        if (!pressed) {
            touchJumpRepeatWait = 0;
            bedBounceActive = false;
            bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
            bedBounceHitCeiling = false;
        }
    },
    jump() {
        if (isHelmetUnderwater() || seatedChair || observatoryScope?.seated || bedCeilingTimer > 0 || bedHoleOpeningTime >= 0) return;
        if (!isFlying && !isRidingBoat && canJump && heartLevitationHeight <= 0) {
            const player = controls.getObject();
            const eyeHeight = isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
            const support = getBedSupport(player.position.x, player.position.z, player.position.y - eyeHeight, solidInteractables);
            const standingOnBed = Number.isFinite(support) && Math.abs(player.position.y - eyeHeight - support) < 0.18;
            const atticHeight = bedCeilingHoleOpen ? atticSupport?.supportHeight(
                player.position.x, player.position.z, player.position.y - eyeHeight, true) : -Infinity;
            const onAttic = Number.isFinite(atticHeight) && atticHeight >= getTerrainHeight(player.position.x, player.position.z);
            const onWizardFloor = Number.isFinite(wizardUpperFloor?.supportHeight(
                player.position.x, player.position.z, player.position.y - eyeHeight));
            const takeoffStep = footstepSurfaceAt(player.position.x, player.position.z, standingOnBed || onAttic || onWizardFloor);
            if (standingOnBed) {
                musicEvents.playBedJump();
                bedTakeoffSoundPlayed = true;
            } else if (takeoffStep) {
                musicEvents.playFootstep(isRunning, 0.9, takeoffStep.outdoor, footstepIndex % 2 === 0,
                    takeoffStep.surface, true);
                footstepIndex++;
            }
            if (!standingOnBed) bedTakeoffSoundPlayed = false;
            touchJumpRepeatWait = 0;
            surfaceJumpActive = helmetEquipped && !standingOnBed;
            velocityY = standingOnBed ? BED_BOUNCE_BASE_IMPULSE
                : surfaceJumpActive ? HELMET_SURFACE_JUMP_FORCE : JUMP_FORCE;
            canJump = false;
            bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
            bedBounceHitCeiling = false;
            bedBounceActive = standingOnBed;
            bedSettleIndex = 0;
            bedSettleTempo = 1;
            bedCeilingHits = 0;
        }
    },
    crouch(pressed) {
        if (seatedChair || observatoryScope?.seated || bedCeilingTimer > 0 || bedHoleOpeningTime >= 0) return;
        // Durante Bosque no se permite agacharse; si ya lo estaba, intentar incorporarse.
        crouchRequested = musicEvents.isEventActive('forest') ? false : pressed;
        updatePlayerPosture();
    },
    run(pressed) { isRunning = pressed && !isHelmetSubmergedInRiver(); },
    map() {
        if (mapLoaded && hasMap && !caveMap?.active && !metalRoom?.active && !metalRoom?.busy) {
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
        if (!gameStarted || isDead || metalRoom?.busy) return;
        if (isInventoryOpen) {
            isInventoryOpen = false;
            inventoryRunning = false;
            menus.hideInventory();
            resumeGame();
        } else {
            inventoryRunning = true;
            isInventoryOpen = true;
            musicEvents.setPaused(false);
            if (controls.isLocked) {
                if (isTouchMode) {
                    controls.isLocked = false;
                    controls.dispatchEvent({type:'unlock'});
                } else controls.unlock();
            }
            menus.showInventory();
        }
    },
    pause() {
        if (!gameStarted || isDead) return;
        if (isInventoryOpen) {
            pauseGame();
        } else if (controls.isLocked) pauseGame();
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
    onImpact: broken => musicEvents.playWoodcuttingHit(broken),
    onScore(score) {
        if (score >= 1000 && woodStoveFire?.ignite()) musicEvents.igniteStoveFire();
    },
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
const testActions = new Set(['toggleDayNight', 'stopMusic', 'cycleLensView', 'teleportToForestHeart',
    'teleportToTelescope', 'teleportToWizardHouse', 'grantForestHeartForTesting', 'activateBridgeKeyEvent']);
// Teclado y táctil comparten permisos de prueba y bloqueos de eventos; siempre se permite pausar.
for (const name of ['toggleTestMode', ...testActions, 'move', 'holdJump', 'jump', 'crouch', 'run', 'map', 'torch', 'inventory']) {
    const action = gameActions[name];
    gameActions[name] = (...args) => {
        if (testActions.has(name) && !testMode.enabled) return;
        if(observatoryLadder?.active&&['toggleTestMode','teleportToForestHeart','teleportToTelescope','teleportToWizardHouse','holdJump','jump','crouch','run'].includes(name))return;
        if(metalRoomLadder?.active&&['jump','crouch'].includes(name))return;
        if (woodcutting.active) {
            return;
        }
        if (isDialogOpen && !(name === 'move' && args[1] === false)) return;
        if (!spawnGreeting.active && !grahamDap.active && (!heartPull.active || name === 'move')) return action(...args);
    };
}
const keyboardBinding = bindKeyboard(gameActions);

const touchLook = new THREE.Euler(0, 0, 0, 'YXZ');
const TOUCH_LOOK_SENSITIVITY = 0.0052;
let touchMateHeld = false;
const touchActions = {
    ...gameActions,
    holdJump(pressed) {
        if (heldItem === 'astroscope') {gameActions.holdJump(false);return;}
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
        if (heldItem === 'astroscope') {
            if (canUseTelescope()) telescopeView.attemptZoom();
            return;
        }
        if (touchMateHeld || heldItem === 'mate') return;
        gameActions.jump();
    }
};

const touchControls = isTouchMode ? bindTouchControls({
    actions: touchActions, canvas: renderer.domElement,
    isActive: () => gameStarted && controls.isLocked && !isDead && !isDialogOpen && !spawnGreeting.active,
    canAdvanceDialogue: () => drowningRescue.waitingForContinue || (controls.isLocked && !isDead && menus.isDialogVisible() && ((isDialogOpen && !grahamDap.active)
        || (spawnGreeting.active && spawnGreeting.phase === 'invitation'))),
    pause: pauseGame,
    look(dx, dy) {
        if (drowningRescue.active) return;
        if (woodcutting.active || spawnGreeting.active || grahamDap.active) return;
        const zoomLookScale=telescopeView?.lookScale ?? 1;
        dx*=zoomLookScale; dy*=zoomLookScale;
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
let waterDeckMap = null;
let mountainPathProfile = null;
let terrainHeightSamples = null;
let mapLoaded = false;
let caveEntrance = null;
let caveMap = null;
let caveTransitionPending = false;
let metalRoom = null;
let metalRoomLadder = null;
let lakeAquarium = null;
let modularSynthRacks = null;
let metalRoomShade = null;

function updateMetalRoomTravel(delta) {
    if(!metalRoom?.busy)return;
    const event=metalRoom.update(delta);
    if(metalRoomShade)metalRoomShade.style.opacity=String(metalRoom.fade);
    if(event) {
        metalRoomLadder?.reset();
        const player=controls.getObject();
        if(event==='enter') {
            player.position.copy(metalRoom.spawn);camera.rotation.set(0,0,0);
            if(minimap.enabled)minimap.toggle();menus.setItemActive('map',false);
        } else {
            player.position.copy(metalRoom.returnPosition);
            player.position.y=getTerrainHeight(player.position.x,player.position.z)+PLAYER_HEIGHT;
            camera.rotation.set(0,Math.PI/2,0);
        }
        velocity.set(0,0,0);velocityY=0;isFlying=false;isCrouching=crouchRequested=false;
        canJump=true;bobTimer=0;previousPlayerPosition.copy(player.position);
        clearGreetingInput();targetInteractable=null;hud.hideInteraction();
    }
}

async function enterCaveTestMap() {
    if (caveTransitionPending || caveMap?.active) return;
    caveTransitionPending = true;
    velocity.set(0,0,0);
    hud.showInteraction();hud.setInteractionText('Entrando a la cueva…');
    try {
        if (!caveMap) {
            caveMap = await loadCaveTestMap(THREE,UNIT_SIZE,PLAYER_HEIGHT,{
                rockTexture:fondoTex, floorTexture:tierraTex, waterMaterial:aguaFloorMat,
                waterTime:waterWaveTime, immersion:underwaterStrength
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
let worldTexturesReady = Promise.resolve();
const worldTextureManager = new THREE.LoadingManager();
worldTextureManager.onStart = () => {
    worldTexturesReady = new Promise(resolve => { worldTextureManager.onLoad = resolve; });
};
const texLoader = new THREE.TextureLoader(worldTextureManager);
let resolveHeartTexture, rejectHeartTexture;
const heartTextureReady = new Promise((resolve,reject)=>{resolveHeartTexture=resolve;rejectHeartTexture=reject;});
heldItemTextures = {
    heart: texLoader.load('./imagenes/Sprites/corazon.png', () => {updateHeldItemLayout();resolveHeartTexture();}, undefined, rejectHeartTexture),
    key: texLoader.load('./imagenes/Sprites/llave-modelo.png', () => updateHeldItemLayout()),
    'sea-heart': texLoader.load('./imagenes/Sprites/corazon-mar.png', () => updateHeldItemLayout())
};
for (const texture of Object.values(heldItemTextures)) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
}
heldItemSprite = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshPhongMaterial({
    map: heldItemTextures.heart, transparent: true, alphaTest: 0.03, fog: false, depthWrite: false,
    depthTest: false, side: THREE.DoubleSide
}));
heldItemSprite.name = 'held-inventory-item';
applyForestHeartCyan(heldItemSprite.material,heldHeartCyan);
heldItemSprite.visible = false;
heldItemSprite.renderOrder = 1000;
camera.add(heldItemSprite);
function updateHeldItemLayout() {
    if (!heldItemSprite) return;
    const distance = 0.7;
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
    const viewRadius = Math.min(halfHeight, halfHeight * camera.aspect);
    const texture = heldItemTextures[heldItem || 'heart'] || heldItemTextures.heart;
    const imageRatio = texture.image ? texture.image.width / texture.image.height : 1;
    const height = viewRadius * 0.6;
    const width = Math.min(height * imageRatio, viewRadius * 0.65);
    const halfWidth = halfHeight * camera.aspect;
    const edgePadding = Math.min(0.04, halfWidth * 0.08);
    heldItemSprite.position.set(halfWidth - width * 0.55 - edgePadding,
        -halfHeight + height * 0.55 + Math.min(0.035, halfHeight * 0.08), -distance);
    heldItemSprite.scale.set(width, height, 1);
}
updateHeldItemLayout();
heldMate = createHeldMate(THREE,camera);
telescopeView = createTelescopeView(THREE,camera,controls,{
    onStrainComplete: () => hud.showNotification('el zoom parece que esta trabado...')
});
const heldOverlay = createHeldOverlay(THREE,renderer,camera,{ambientLight,directionalLight:dirLight,torchLight});
heldOverlay.group.add(heldItemSprite,heldMate.object,telescopeView.object);
function canUseTelescope() {
    return hasAstroscope && heldItem === 'astroscope' && gameStarted && mapLoaded && controls.isLocked
        && !isDead && !isInventoryOpen && !isDialogOpen && !spawnGreeting.active
        && !heartPull.active && !grahamDap.active && !woodcutting.active && !caveTransitionPending && !observatoryScope?.seated;
}
const canDrinkMate = () => heldItem === 'mate' && gameStarted && controls.isLocked && !isDead
    && !woodcutting.active && !isDialogOpen && !isInventoryOpen && !spawnGreeting.active && !heartPull.active && !grahamDap.active;
document.addEventListener('mousedown', event => {
    if(event.button===2&&!isTouchMode&&targetInteractable?.userData.type==='OBSERVATORY_TELESCOPE'&&controls.isLocked&&!isDead) {
        event.preventDefault();
        if(astroscopeInstalled)return;
        if(hasAstroscope)showObservatoryChoice('attach');
        else hud.showNotification('Necesitas el Astroscopio para acoplarlo al Omniscopio.');
        return;
    }
    if (event.button === 0 && woodcutting.active && controls.isLocked && !isDead) {
        event.preventDefault(); woodcutting.interact(); return;
    }
    if (event.button === 0 && !isTouchMode && (event.target === renderer.domElement || event.target === document.body) && canUseTelescope()) {
        event.preventDefault(); telescopeView.toggle(); return;
    }
    if (event.button === 2 && !isTouchMode && (event.target === renderer.domElement || event.target === document.body) && canUseTelescope()) {
        event.preventDefault(); telescopeView.attemptZoom(); return;
    }
    if (event.button === 2 && canDrinkMate()) { event.preventDefault(); heldMate.press(); }
});
document.addEventListener('mouseup', event => { if (event.button === 2) heldMate.release(); });
document.addEventListener('contextmenu',event=>{if (canUseTelescope()||targetInteractable?.userData.type==='OBSERVATORY_TELESCOPE') event.preventDefault();});
window.addEventListener('blur', () => {
    heldMate.cancel(); telescopeView.cancel(); woodcutting.holdExit(false);
    if (inventoryRunning) {
        for (const key of Object.keys(moveState)) moveState[key] = false;
        velocity.set(0,0,0);
        jumpHeld = false; isRunning = false; crouchRequested = false;
        updatePlayerPosture();
    }
});
document.addEventListener('visibilitychange',()=>{if (document.hidden) telescopeView.cancel();});
renderer.domElement.addEventListener('contextmenu', event => {
    if ((woodcutting.active && controls.isLocked) || canDrinkMate()) event.preventDefault();
});
const torchFrames = [];
const torchFlameGeometry = new THREE.PlaneGeometry(1, 1);
function faceTorchFlameToCamera(flame) {
    const dx = camera.position.x - flame.position.x;
    const dz = camera.position.z - flame.position.z;
    if (dx * dx + dz * dz > 1e-8) flame.rotation.y = Math.atan2(dx, dz);
}
const blueFireAtlas = texLoader.load('./imagenes/Sprites/fuego-azul-altar-atlas.png');
blueFireAtlas.colorSpace = THREE.SRGBColorSpace;
blueFireAtlas.magFilter = blueFireAtlas.minFilter = THREE.NearestFilter;
blueFireAtlas.generateMipmaps = false;
for (let i = 1; i <= 5; i++) {
    const tTex = texLoader.load(`./imagenes/Sprites/antorcha/torch${i}.png`);
    tTex.magFilter = THREE.NearestFilter;
    tTex.minFilter = THREE.NearestFilter;
    tTex.colorSpace = THREE.SRGBColorSpace;
    torchFrames.push(tTex);
}
const heldTorch = createHeldTorch(THREE,torchFrames,camera);
heldOverlay.group.add(heldTorch.object);
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
const puertaTex = texLoader.load('./imagenes/Texturas/puerta.png?v=' + Date.now(), texture => {
    // Excluir la columna gris del borde izquierdo sin modificar el PNG original.
    const border = 1 / texture.image.width;
    texture.offset.x = border;
    texture.repeat.x = 1 - border;
    puertaFlippedTex.offset.x = 1;
    puertaFlippedTex.repeat.x = -(1 - border);
});
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
// Evitar destellos de arena vista desde arriba/lejos sin difuminar sus píxeles de cerca.
[arenaTex, arenaMojadaTex].forEach(t => {
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
});



[losaTex, piedraTex, rocaTex, nieveTex, pastoTex, tierraTex, arenaTex, agua1Tex, agua2Tex, agua3Tex].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
});

const puertaFlippedTex = puertaTex.clone();
puertaFlippedTex.wrapS = THREE.ClampToEdgeWrapping;
puertaFlippedTex.repeat.x = -1;
puertaFlippedTex.needsUpdate = true;

// Cielos independientes para conservar la transición y la luna fija.
const nightAtlas = createSkyAtlas(THREE, texLoader, './imagenes/Texturas/Cielo/Ciclo/Noche.jpg?v=' + Date.now(), {
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
const observatorySky=createObservatorySky(THREE);skyMesh.add(observatorySky);

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
const starTailScreen = new THREE.Vector3(), starHeadScreen = new THREE.Vector3();
let starSequenceActive = false;

scene.add(skyMesh);

Promise.all([
    loadMapImage('./imagenes/Mapa/capa1.png?v=' + Date.now()),
    loadMapImage('./imagenes/Mapa/capa2.png?v=' + Date.now()),
    heartTextureReady
]).then(async ([baseImage, roofImage]) => {
    performancePanel?.mark('Capas listas');
    const checkpoint = createLoadingYield(6);
    const prepared = await prepareMapAsync(applyLakeHouseLayout(applySummitLayout(readMapLayers(baseImage, roofImage))), entities, shipwreckProps, mapCellOverrides, checkpoint);
    // Presentar la carga antes de la construcción síncrona de geometría.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await buildWorld(prepared, checkpoint);
    performancePanel?.mark('Mundo construido');
    // Construir y preparar las plantas durante la carga: estrenarlas bajo el agua
    // consume aire mientras el driver crea sus programas y buffers.
    await prepareUnderwaterPlants();
    performancePanel?.mark('Vegetación submarina lista');
    await worldTexturesReady;
    await heartVision.ready;
    performancePanel?.mark('Texturas listas');
    // Crear el contexto secundario con el inventario oculto evita estrenarlo al abrirlo.
    menus.prepareInventory();
    // Subir texturas por tandas evita estrenar todas las cargas GPU en un dibujo.
    const startupTextures = new Set([pastoTex,tierraTex,arenaTex,arenaMojadaTex,fondoTex,piedraTex,rocaTex,nieveTex,losaTex,...torchFrames]);
    if (heartVision.uniforms.skyPsychTexture.value.image) startupTextures.add(heartVision.uniforms.skyPsychTexture.value);
    scene.traverse(object => {
        const materials = object.material ? Array.isArray(object.material) ? object.material : [object.material] : [];
        for (const material of materials) for (const value of Object.values(material)) {
            if (value?.isTexture) startupTextures.add(value);
        }
    });
    for (const texture of startupTextures) {
        renderer.initTexture(texture);
        await waitForRenderedFrame(renderer);
        const pause = checkpoint();
        if (pause) await pause;
    }
    performancePanel?.mark('Texturas subidas');
    // Empezar el fundido durante la preparación final, antes de dar el mundo por listo.
    getIslandPreview()?.startFade();
    // La primera inmersión no debe estrenar framebuffer ni shaders del mundo.
    const prepareStartupPrograms = (world, view, target) =>
        prepareProgramsInBatches(THREE, renderer, world, view, checkpoint, target);
    await underwaterView.prepare(scene, camera, false, prepareStartupPrograms);
    // Preparar también los materiales fuera de cámara durante la pantalla de carga.
    // Su primera aparición al mirar a Graham no debe compilar shaders en pleno giro.
    await prepareStartupPrograms(scene, camera, null);
    await heldOverlay.prepare(prepareStartupPrograms);
    performancePanel?.mark('Shaders preparados');
    camera.position.y = getTerrainHeight(camera.position.x, camera.position.z) + PLAYER_HEIGHT;
    const preview = getIslandPreview();
    if (!preview) throw new Error('No está disponible la maqueta guardada.');
    // Dibujar y subir los buffers/texturas del encuadre real ANTES del zoom final.
    // compileAsync prepara programas, pero no garantiza un primer dibujo listo.
    const spawn = controls.getObject().position;
    camera.updateMatrixWorld(true);
    skyMesh.position.set(spawn.x, 200, spawn.z);
    daySkyMesh.position.y = spawn.y - 200;
    nightSkyMesh.position.y = dawnSkyMesh.position.y = duskSkyMesh.position.y = daySkyMesh.position.y;
    torchLighting?.update(spawn, performance.now() / 1000, dayTransition);
    updateFogColor();
    const startupFogPlane = fogCulling?.update(camera);
    vegetationSectors?.update(camera, startupFogPlane);
    structureSectors?.update(camera, startupFogPlane);
    sunFlare.update();
    if(observatoryScope?.active)sunFlare.object.visible=false;
    underwaterView.render(scene, camera);
    await waitForRenderedFrame(renderer);
    await new Promise(resolve => requestAnimationFrame(resolve));
    performancePanel?.mark('Primer fotograma preparado');
    performancePanel?.mark('Juego listo');
    await showReadyIsland(preview, isTouchMode ? 'Toca para comenzar' : 'Presiona Enter para jugar');
    preview.reveal();
    setIslandPreview(null);
    clock.getDelta();
    for (const direction of Object.keys(moveState)) moveState[direction] = false;
    if (!isTouchMode) controls.connect();
    mapLoaded = true;
    loadingScreen.style.display = 'none';
    if (isTouchMode) {
        resumeGame();
    } else if (document.pointerLockElement === document.body) {
        controls.isLocked = true;
        controls.dispatchEvent({ type: 'lock' });
    } else {
        gameStarted = true;
        menus.showPause();
    }
}).catch((error) => {
    if (document.pointerLockElement) document.exitPointerLock();
    loadingScreen.style.color = 'red';
    loadingScreen.style.display = 'flex';
    loadingScreen.textContent = 'ERROR: ' + error.message;
    console.error(error);
});


async function buildWorld(prepared, checkpoint) {
    ({ mapWidth, mapHeight, collisionMap, floorMap, roofMap, playerStartX, playerStartZ } = prepared);
    const { counts, floorCanvas } = prepared;
    const registry = createEntityRegistry(entities, floorMap, mapWidth, mapHeight);
    const fields = await prepareWorldFields('base', {floorMap,collisionMap,roofMap,
        width:mapWidth,height:mapHeight,externalTorchMap:prepared.externalTorchMap});
    const { mountainReliefMap, seaFloorHeights } = fields;
    waterDeckMap = fields.waterDeckMap;
    floorMap = fields.floorMap;
    forestMovementBoundary=createForestMovementBoundary(floorMap,waterDeckMap,grahamPosition,
        keyBindings.find(binding=>binding.id==='bridge-key').doors,UNIT_SIZE,COLLISION_RADIUS);
    woodFloorMap = fields.woodFloorMap;
    collisionMap = fields.collisionMap;
    // El floorCanvas se utilizará ahora exclusivamente para el minimapa
    // Eliminado el floorMesh (la imagen del mapa 2D en el mundo 3D) para no interferir con las laderas y profundidades del terreno continuo.
    
    // Lecho marino (fondo profundo absoluto por si hay huecos)
    const seabedGeo = createOceanSeabedGeometry(THREE,mapWidth,mapHeight,UNIT_SIZE,camera.far);
    const seabedMat = new THREE.MeshPhongMaterial({ map: fondoTex, color: 0xffffff, shininess: 0 });
    const seabedMesh = new THREE.Mesh(seabedGeo, seabedMat);
    seabedMesh.name = 'seabed-backstop';
    seabedMesh.rotation.x = -Math.PI / 2;
    seabedMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, SEA_FLOOR_HEIGHT - 0.2, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
    scene.add(seabedMesh);

    // Geometrías
    const grassPlaneGeo = new THREE.PlaneGeometry(UNIT_SIZE, VEGETATION_HEIGHT * 0.8 * 1.1);
    const cubeGeo = new THREE.BoxGeometry(UNIT_SIZE, WALL_HEIGHT, UNIT_SIZE);

    // Follaje opaco con máscara: los huecos no escriben profundidad y las hojas no mezclan cielo.
    const pino1Mat = new THREE.MeshPhongMaterial({ map: pino1Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const pino2Mat = new THREE.MeshPhongMaterial({ map: pino2Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const alamo1Mat = new THREE.MeshPhongMaterial({ map: alamo1Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const alamo2Mat = new THREE.MeshPhongMaterial({ map: alamo2Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arau1Mat = new THREE.MeshPhongMaterial({ map: arau1Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arau2Mat = new THREE.MeshPhongMaterial({ map: arau2Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arbusto1Mat = new THREE.MeshPhongMaterial({ map: arbusto1Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const arbusto2Mat = new THREE.MeshPhongMaterial({ map: arbusto2Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed1Mat = new THREE.MeshPhongMaterial({ map: weed1Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed2Mat = new THREE.MeshPhongMaterial({ map: weed2Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
    const weed3Mat = new THREE.MeshPhongMaterial({ map: weed3Tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 0 });
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
    const brokenCeilingWoodMat = new THREE.MeshPhongMaterial({ map: maderaTex, shininess: 0, side: THREE.DoubleSide });
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
    // El mar conserva su cota real: adelantar su profundidad lo hacía invadir
    // tierra baja e islotes al mirar la costa de lejos o en ángulo rasante.
    aguaFloorMat = new THREE.MeshPhongMaterial({ map: agua1Tex, color: 0xffffff, transparent: true, opacity: 1, shininess: 60, side: THREE.DoubleSide, depthFunc: THREE.LessDepth });
    riverSoundField = createRiverCurrentField(floorMap, waterDeckMap, mapWidth, mapHeight);
    seaSoundField = createSeaSoundField(floorMap, waterDeckMap, riverSoundField, mapWidth, mapHeight);
    applyWaterWaves(THREE, aguaFloorMat, waterWaveTime,
        riverSoundField, UNIT_SIZE, underwaterStrength, raisedWaterCell);
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
    const doorStops=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
        new THREE.MeshPhongMaterial({color:0x292725,shininess:0}),doorCount*3);
    doorStops.name='door-frame-dark-rebates';let idxDoorStop=0;
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
    const globalWaterGeo = createOceanSurfaceGeometry(THREE,mapWidth,mapHeight,UNIT_SIZE,camera.far);
    const globalWaterMesh = new THREE.Mesh(globalWaterGeo, aguaFloorMat);
    globalWaterMesh.name = 'ocean-visual-horizon';
    globalWaterMesh.rotation.x = -Math.PI / 2;
    globalWaterMesh.position.set((mapWidth * UNIT_SIZE)/2 - UNIT_SIZE/2, WATER_SURFACE_HEIGHT, (mapHeight * UNIT_SIZE)/2 - UNIT_SIZE/2);
    scene.add(globalWaterMesh);


    elevationMap = Array.from({length: mapHeight}, () => new Float32Array(mapWidth).fill(9999));
    const distQueue = [];
    
    for (let z = 0; z < mapHeight; z++) {
        { const pause = checkpoint(); if (pause) await pause; }
        for (let x = 0; x < mapWidth; x++) {
            if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
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
        if ((qHead & 1023) === 0) { const pause = checkpoint(); if (pause) await pause; }
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
        if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
        const factor = {MOUNTAIN:1.5,PEAK:2,SNOW_PEAK:3}[mountainReliefMap[z][x]];
        if(factor) previousMountainMaximum=Math.max(previousMountainMaximum,elevationMap[z][x]*factor);
    }
    previousMountainMaximum *= 0.85 * 0.8;
    const { heights: mountainHeights, mask: mountainMask } = await prepareWorldFields('mountain',
        {floorMap:mountainReliefMap,width:mapWidth,height:mapHeight,targetHeight:previousMountainMaximum});
    // Aplanar y esculpir
    for (let z = 0; z < mapHeight; z++) {
        { const pause = checkpoint(); if (pause) await pause; }
        for (let x = 0; x < mapWidth; x++) {
            if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
            const type = floorMap[z][x];
            let dist = elevationMap[z][x];
            
            // Reglas de elevación según el tipo
            if (mountainMask[z][x]) elevationMap[z][x] = mountainHeights[z][x];
            else if (woodFloorMap[z][x]) elevationMap[z][x] = waterDeckMap[z][x] ? WATER_SURFACE_HEIGHT + WATER_DECK_THICKNESS : 1.0;
            else if (['WATER', 'WATER_ROCK', 'BOAT'].includes(type)) {
                const boatInSea = type==='BOAT' && ![[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dz])=>floorMap[z+dz]?.[x+dx]==='WATER_ROCK');
                if (type === 'WATER_ROCK' || (type === 'BOAT' && !boatInSea)) {
                    // Río nivelado a profundidad uniforme (-2.5 m) para que con escafandra siempre consuma aire en toda su extensión.
                    elevationMap[z][x] = -2.5;
                } else if ((type==='WATER' || boatInSea) && !(x===seaHeartAltar.center.x && z===seaHeartAltar.center.z)) {
                    elevationMap[z][x] = seaFloorHeights[z][x];
                } else {
                    let sandDistance = 4;
                    for (let dz = -3; dz <= 3; dz++) {
                        for (let dx = -3; dx <= 3; dx++) {
                            if (['SAND', 'WET_SAND'].includes(floorMap[z + dz]?.[x + dx])) sandDistance = Math.min(sandDistance, Math.hypot(dx, dz));
                        }
                    }
                    elevationMap[z][x] = -0.5 - Math.min(2, Math.max(0, sandDistance - 1) * 0.8);
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
        if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
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
        { const pause = checkpoint(); if (pause) await pause; }
        for (let x = 0; x < mapWidth; x++) {
            if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
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

    const shaped = await prepareWorldFields('slope', {relief:mountainReliefMap,elevations:elevationMap,
        mask:mountainMask,profile:mountainPathProfile,floorMap,collisionMap});
    elevationMap = shaped.elevations;
    floorMap=shaped.floorMap;collisionMap=shaped.collisionMap;
    if (shaped.platforms) elevationMap.buildingPlatforms = shaped.platforms;
    mountainPathProfile = shaped.profile;
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
    lakeHouseDome=createLakeHouseDome(THREE,elevationMap[lakeHouseLayout.center.z][lakeHouseLayout.center.x]);
    scene.add(lakeHouseDome.group);
    const roofBaseMap = createRoofBaseMap(roofMap, floorMap, elevationMap);
    atticSupport = bedDefinition ? createAtticSupport(roofMap, roofBaseMap, bedDefinition, roofSubdivisions) : null;

    let idxPino1=0, idxPino2=0, idxAlamo1=0, idxAlamo2=0, idxArau1=0, idxArau2=0, idxBUSH1=0, idxBUSH2=0, idxWeed1=0, idxWeed2=0, idxWeed3=0, idxBldg=0, idxMtn=0, idxPeak=0, idxSnowPeak=0, idxCeil=0, idxFalseCeil=0, idxRoof=0, idxMadera=0;
    const dummy = new THREE.Object3D(); 
    
    const roofQueue = [];
    // Un byte por distancia mantiene el uso de memoria de la cuadrícula anterior.
    const roofDistances = Array.from({length: mapHeight * roofSubdivisions}, () => new Uint8Array(mapWidth * roofSubdivisions).fill(255));
    
    for (let z = 0; z < mapHeight; z++) {
        { const pause = checkpoint(); if (pause) await pause; }
        for (let x = 0; x < mapWidth; x++) {
            if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
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
        if ((head & 1023) === 0) { const pause = checkpoint(); if (pause) await pause; }
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
        { const pause = checkpoint(); if (pause) await pause; }
        for (let x = 0; x < mapWidth; x++) {
            if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
            const type = floorMap[z][x];
            const rType = roofMap[z][x] === 'ROOF' && (isWizardHouseRoofCell(x,z)||isLakeHouseCell(x,z)) ? null : roofMap[z][x];
            
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
                const solid = value => ['BUILDING', 'MOUNTAIN', 'PEAK', 'SNOW_PEAK', 'SNOW_SLOPE'].includes(value);
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
                const domeMount=lakeHouseDome.torchMount(x,z,prepared.externalTorchMap[z][x]);
                if(domeMount){wallX=domeMount.x;wallZ=domeMount.z;}
                const torchY = domeMount?.y ?? supportHeight + TORCH_MOUNT_HEIGHT;
                worldTorches.push({ x: wallX, z: wallZ, y: torchY, isBlue: isBlueTorch, isIndoor: woodFloorMap[z][x], gx: x, gz: z });
                const isIndoor = woodFloorMap[z][x];
                const material = new THREE.MeshBasicMaterial({ map: torchFrames[0], transparent: true, fog: !isIndoor, depthWrite: false, color: isBlueTorch ? 0x66ccff : 0xffffff });
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
                const sprite = new THREE.Mesh(torchFlameGeometry, material);
                sprite.position.set(wallX, torchY, wallZ);
                sprite.scale.set(1, 1, 1);
                faceTorchFlameToCamera(sprite);
                scene.add(sprite);
                torchSprites.push(sprite);
            }

            if (type === 'BUILDING' && !isWizardHouseRoofCell(x,z) && !isLakeHouseCell(x,z)) {
                dummy.position.set(posX, baseH + WALL_HEIGHT / 2, posZ);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                bldgMesh.setMatrixAt(idxBldg++, dummy.matrix);
                if (altarDistance(x,z) <= seaHeartAltar.radius) {
                    // Otro tramo hacia abajo: mismo techo y misma densidad de textura.
                    dummy.position.y = baseH - WALL_HEIGHT / 2;
                    dummy.updateMatrix();
                    bldgMesh.setMatrixAt(idxBldg++, dummy.matrix);
                    const flame = createAltarBlueFire(THREE,blueFireAtlas,UNIT_SIZE,altarFlames.length);
                    flame.name = `altar-blue-fire:${x},${z}`;
                    flame.userData.visibilityEnabled = false;
                    flame.visible = false;
                    flame.position.set(posX,baseH+WALL_HEIGHT+0.005,posZ);
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
                    const chestX = posX + (definition?.offset?.x ?? 0);
                    const chestZ = posZ + (definition?.offset?.z ?? 0);
                    chestMesh.position.set(chestX, getTerrainHeight(chestX, chestZ) - chestGeo.boundingBox.min.y, chestZ);
                    chestMesh.rotation.y = definition?.rotationY ?? 0;
                    chestMesh.userData = { type: 'CHEST', gx: x, gz: z, id: definition?.id || `chest:${x},${z}`, item: definition?.item || 'key' };
                    // Preparar cuerpo, bisagra y buffers antes de la primera interacción.
                    chestMesh.userData.opening = createChestOpening(THREE, chestMesh);
                    if (chestMesh.userData.item === 'pink-sunglasses') {
                        const pickup = createPinkSunglasses(THREE);
                        pickup.position.set(0,-.22,-.015);
                        pickup.rotation.x = -Math.PI/2 + .2;
                        pickup.userData = {type:'PINK_SUNGLASSES_PICKUP',visibilityEnabled:false};
                        pickup.visible = false;
                        chestMesh.add(pickup); chestMesh.userData.sunglassesPickup = pickup;
                    }
                    if (chestMesh.userData.item === 'map') {
                        // El mismo sprite del mapa plegado usado en el inventario.
                        const texture = texLoader.load('./imagenes/Sprites/mapa-maqueta.png');
                        texture.colorSpace = THREE.SRGBColorSpace;
                        texture.minFilter = texture.magFilter = THREE.NearestFilter;
                        const pickup = new THREE.Mesh(new THREE.PlaneGeometry(.48,.48),
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
                placeBoatFacingWest(boatMesh, (bx,bz) =>
                    hasObstacle(bx,bz,mapWidth,mapHeight,collisionMap,floorMap,true,solidInteractables,boatMesh));
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
                
                // Holgura visual entre hoja y marco: sus cantos no comparten plano.
                const leafWidth=opening.width-(opening.isDouble?0:.008),leafHeight=DOOR_HEIGHT-.016;
                const doorGeo = isHorizontal ? new THREE.BoxGeometry(leafWidth, leafHeight, DOOR_THICKNESS) : new THREE.BoxGeometry(DOOR_THICKNESS, leafHeight, leafWidth);
                doorGeo.translate(0,-.008,0);
                // El dintel pertenece al muro y permanece fijo cuando la hoja se abre.
                // Esta fachada ya incorpora su dintel en wizard-upper-floor.js.
                if (!(x === wizardHouseLayout.door.x && z === wizardHouseLayout.door.z) && !isLakeHouseDoor(x,z)) {
                    dummy.position.set(posX, baseH + DOOR_HEIGHT + lintelHeight / 2, posZ);
                    dummy.updateMatrix();
                    lintelMesh.setMatrixAt(idxLintel++, dummy.matrix);
                }
                for (const [margin,sign] of [[opening.leftMargin,-1],[opening.rightMargin,1]]) {
                    if(isLakeHouseDoor(x,z))continue;
                    if (!margin) continue;
                    const offset=sign*(UNIT_SIZE-margin)/2;
                    dummy.position.set(posX+(isHorizontal?offset:0),baseH+DOOR_HEIGHT/2,posZ+(isHorizontal?0:offset));
                    dummy.scale.set(isHorizontal?margin:UNIT_SIZE,1,isHorizontal?UNIT_SIZE:margin);
                    dummy.updateMatrix();
                    jambMesh.setMatrixAt(idxJamb++,dummy.matrix);
                }
                dummy.scale.set(1,1,1);

                // Rebaje fijo dentro del espesor del muro. Tapa la junta por detrás
                // de la hoja sin coincidir con sus caras ni crear un pilar entre puertas dobles.
                const leafCenter=posX+(isHorizontal?opening.centerOffset:0);
                const leafZ=posZ+(isHorizontal?0:opening.centerOffset);
                for(const [margin,sign]of [[opening.leftMargin,-1],[opening.rightMargin,1]]) {
                    if(!margin)continue;
                    const offset=sign*(opening.width/2-.005);
                    dummy.position.set(leafCenter+(isHorizontal?offset:0),baseH+DOOR_HEIGHT/2,leafZ+(isHorizontal?0:offset));
                    dummy.scale.set(isHorizontal?.05:.04,DOOR_HEIGHT,isHorizontal?.04:.05);
                    dummy.updateMatrix();doorStops.setMatrixAt(idxDoorStop++,dummy.matrix);
                }
                dummy.position.set(leafCenter,baseH+DOOR_HEIGHT-.005,leafZ);
                dummy.scale.set(isHorizontal?opening.width+.04:.04,.05,isHorizontal?.04:opening.width+.04);
                dummy.updateMatrix();doorStops.setMatrixAt(idxDoorStop++,dummy.matrix);dummy.scale.set(1,1,1);
                
                const lakeDoor=isLakeHouseDoor(x,z);
                const matNormal = new THREE.MeshPhongMaterial(lakeDoor
                    ? {color:0x71839a,specular:0xb9c9db,shininess:65,flatShading:true}
                    : {map:puertaTex,color:tintColor,shininess:0});
                const matFlipped = new THREE.MeshPhongMaterial(lakeDoor
                    ? {color:0x71839a,specular:0xb9c9db,shininess:65,flatShading:true}
                    : {map:puertaFlippedTex,color:tintColor,shininess:0});
                // No comprimir el dibujo completo (incluidos herrajes claros) en
                // los cantos de 20 cm: produce rayas brillantes al mover la cámara.
                const edgeMaterial=new THREE.MeshPhongMaterial({color:lakeDoor?0x303d49:0x46372b,shininess:lakeDoor?24:0});
                edgeMaterial.userData.doorEdge=true;
                let mats;
                
                if (isHorizontal) {
                    if (!hingeOnRight) mats = [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, matNormal, matFlipped];
                    else mats = [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, matFlipped, matNormal];
                } else {
                    if (!hingeOnRight) mats = [matFlipped, matNormal, edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial];
                    else mats = [matNormal, matFlipped, edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial];
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

            if (needsWoodFloor && !isLakeHouseCell(x,z)) {
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
    
    scene.add(bldgMesh);
    const dividerLength = (grahamRoomDivider.fromX - grahamRoomDivider.toX) * UNIT_SIZE;
    const dividerThickness = 0.32;
    const dividerX = (grahamRoomDivider.fromX + grahamRoomDivider.toX) * UNIT_SIZE / 2;
    const dividerZ = grahamRoomDivider.z * UNIT_SIZE;
    const dividerFloor = getTerrainHeight(dividerX, dividerZ);
    const dividerGeometry = new THREE.BoxGeometry(dividerLength, WALL_HEIGHT, dividerThickness);
    const dividerUvs = dividerGeometry.attributes.uv;
    const dividerNormals = dividerGeometry.attributes.normal;
    for (let i = 0; i < dividerUvs.count; i++) {
        if (Math.abs(dividerNormals.getZ(i)) > 0.5)
            dividerUvs.setX(i, dividerUvs.getX(i) * dividerLength / UNIT_SIZE);
    }
    const roomDivider = new THREE.Mesh(dividerGeometry, bldgMat);
    roomDivider.name = 'graham-room-divider';
    roomDivider.position.set(dividerX, dividerFloor + WALL_HEIGHT / 2, dividerZ);
    roomDivider.userData.type = 'BUILDING';
    scene.add(roomDivider);
    roomDivider.updateMatrixWorld(true);
    solidInteractables.push(roomDivider);
    for (const side of [-1, 1]) {
        const x = grahamRoomDivider.torchX * UNIT_SIZE;
        const z = dividerZ + side * (dividerThickness / 2 + 0.2);
        const y = getTerrainHeight(x, z) + TORCH_MOUNT_HEIGHT;
        worldTorches.push({ x, y, z, isBlue: false, isIndoor: true, intensityScale: 0.65 });
        const sprite = new THREE.Mesh(torchFlameGeometry, new THREE.MeshBasicMaterial({
            map: torchFrames[0], transparent: true, fog: false, depthWrite: false
        }));
        sprite.position.set(x, y, z);
        sprite.scale.set(1, 1, 1);
        faceTorchFlameToCamera(sprite);
        scene.add(sprite);
        torchSprites.push(sprite);
    }
    lintelMesh.count = idxLintel;
    scene.add(lintelMesh);
    jambMesh.count = idxJamb;
    scene.add(jambMesh);
    doorStops.count=idxDoorStop;scene.add(doorStops);
    bldgMesh.count = idxBldg;
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
        const bedHolePosition = new THREE.Vector3(
            (bedDefinition.position.x + (bedDefinition.size.x - 1) / 2) * UNIT_SIZE,
            roofBaseMap[bedDefinition.position.z][bedDefinition.position.x] + WALL_HEIGHT + 0.05,
            (bedDefinition.position.z + (bedDefinition.size.z - 1) / 2) * UNIT_SIZE
        );
        makeBedHoleMesh = points => {
            const opening = new THREE.Path();
            points.forEach(([x,z], index) => {
                if (index === 0) opening.moveTo(x,z);
                else opening.lineTo(x,z);
            });
            opening.closePath();
            outline.holes.length = 0;
            outline.holes.push(opening);
            const geometry = new THREE.ExtrudeGeometry(outline, { depth: 0.1, bevelEnabled: false, steps: 1, curveSegments: 1 });
            geometry.rotateX(Math.PI / 2);
            // Mantener la fase de textura de las tablas intactas en todas las fases.
            const positions = geometry.attributes.position;
            const normals = geometry.attributes.normal;
            const uvs = geometry.attributes.uv;
            for (const group of geometry.groups) {
                if (group.materialIndex !== 0) continue;
                for (let i = group.start; i < group.start + group.count; i++) {
                    uvs.setXY(i,
                        positions.getX(i) / UNIT_SIZE + bedDefinition.size.x / 2,
                        normals.getY(i) > 0
                            ? 1 - bedDefinition.size.z / 2 - positions.getZ(i) / UNIT_SIZE
                            : bedDefinition.size.z / 2 + positions.getZ(i) / UNIT_SIZE);
                }
            }
            const mesh = new THREE.Mesh(geometry, [ceilingMat, brokenCeilingWoodMat]);
            mesh.position.copy(bedHolePosition);
            mesh.userData.visibilityEnabled = false;
            mesh.visible = false;
            scene.add(mesh);
            return mesh;
        };
        bedHoleRim = makeBedHoleMesh(BED_CEILING_OPENING);
        const woodChipGeometry = new THREE.BoxGeometry(1, 1, 1);
        const woodChipUvs = woodChipGeometry.attributes.uv;
        // Cada astilla toma una franja de una sola tabla, no el mosaico completo.
        for (let i = 0; i < woodChipUvs.count; i++) {
            woodChipUvs.setY(i, 0.05 + woodChipUvs.getY(i) * 0.12);
        }
        bedWoodChipMaterial = brokenCeilingWoodMat.clone();
        bedWoodChipMaterial.transparent = true;
        bedWoodChipMaterial.depthWrite = false;
        bedWoodChips = new THREE.InstancedMesh(
            woodChipGeometry,
            bedWoodChipMaterial, BED_CEILING_CHIP_COUNT);
        bedWoodChips.count = 0;
        bedWoodChips.frustumCulled = false;
        scene.add(bedWoodChips);
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
    
    // --- GENERACIÓN DE TERRENO (MONTAÑAS CONTINUAS CON TEXTURAS) ---
    const SUBDIVISIONS = 4;
    const segmentsW = (mapWidth - 1) * SUBDIVISIONS;
    const segmentsH = (mapHeight - 1) * SUBDIVISIONS;
    const vertsW = segmentsW + 1;
    const vertsH = segmentsH + 1;
    
    const terrainBuild = await createTerrainBuild(THREE, (mapWidth - 1) * UNIT_SIZE, (mapHeight - 1) * UNIT_SIZE, segmentsW, segmentsH);
    const terrainGeo = terrainBuild.geometry;

    let positions = terrainGeo.attributes.position.array;
    const uvs = terrainGeo.attributes.uv.array;
    const splatWeights = new Float32Array(positions.length / 3 * 4);
    const wetSandWeights = new Float32Array(positions.length / 3);
    // El tablero mantiene su cota física; solo el terreno debajo baja al lecho acuático.
    const { floorMap: terrainFloorMap, elevations: terrainElevations, woodMap: terrainWoodMap } =
        createWaterDeckTerrain(floorMap, elevationMap, woodFloorMap, waterDeckMap, seaFloorHeights);
    const mountainWeights = new Float32Array(positions.length / 3 * 4);
    const terrainSamplingCache = createTerrainSamplingCache(mapWidth, mapHeight, terrainWoodMap);
    const terrainChannels = { OTHER: 3, DIRT: 1, SAND: 2, WET_SAND: 8, WATER: 2, BOAT: 2, WATER_ROCK: 5, MOUNTAIN: 4, PEAK: 5, SNOW_PEAK: 6, SNOW_SLOPE: 6 };
    const wetSandShoreMap = createWetSandShoreMap(terrainFloorMap, mapWidth, mapHeight);
    const slabGroundCells = new Uint8Array(mapWidth * mapHeight);
    const naturalShrineGround = new Uint8Array(mapWidth * mapHeight);
    for (const definition of entities) {
        { const pause = checkpoint(); if (pause) await pause; }
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
        if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
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

    // Clasificar cada celda una sola vez, no cuatro veces por cada subdivisión.
    const cellChannels = new Uint8Array(mapWidth * mapHeight);
    const shrineStone = new Float64Array(mapWidth * mapHeight);
    for (let z = 0; z < mapHeight; z++) for (let x = 0; x < mapWidth; x++) {
        if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
        const cell = z * mapWidth + x;
        shrineStone[cell] = naturalShrineGround[cell] ? 0.2 + 0.15 * (0.5 + 0.5 * Math.sin(x * 2.3 + z * 1.7)) : 0;
        let channel = slabGroundCells[cell] ? 3
            : floorMap[z][x] === 'CHEST' && !woodFloorMap[z][x] ? 1
            : boatBottomChannels.get(cell) ?? terrainChannels[terrainFloorMap[z][x]] ?? 0;
        const seaCell = terrainFloorMap[z][x] === 'WATER' || (floorMap[z][x] === 'BOAT' && boatBottomChannels.get(cell) === 2);
        if (seaCell && wetSandShoreMap[z][x]) channel = 8;
        if (seaCell && terrainElevations[z][x] <= -2.5) channel = 7;
        cellChannels[cell] = channel;
    }
    function blendTerrainCell(vertex, cell, weight) {
        if (weight === 0) return;
        const stone = shrineStone[cell];
        if (stone) {
            splatWeights[vertex*4+1] += weight * (1-stone);
            splatWeights[vertex*4+3] += weight * stone;
        } else {
            const channel = cellChannels[cell];
            if (channel === 8) wetSandWeights[vertex] += weight;
            else if (channel < 4) splatWeights[vertex*4+channel] += weight;
            else mountainWeights[vertex*4+channel-4] += weight;
        }
    }

    terrainElevations.shorelineMask=createShorelineMask(terrainFloorMap,terrainWoodMap);
    terrainElevations.shorelineHeights=createShorelineHeights(terrainFloorMap,terrainElevations,terrainElevations.shorelineMask,WATER_SURFACE_HEIGHT);
    for (let i = 0; i < positions.length / 3; i++) {
        if ((i & 511) === 0) { const pause = checkpoint(); if (pause) await pause; }
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
        blendTerrainCell(i, r0 * mapWidth + c0, (1-tx)*(1-tz));
        blendTerrainCell(i, r0 * mapWidth + c1, tx*(1-tz));
        blendTerrainCell(i, r1 * mapWidth + c0, (1-tx)*tz);
        blendTerrainCell(i, r1 * mapWidth + c1, tx*tz);

        const y = getTerrainVertexY(colF, rowF, mapWidth, mapHeight, terrainFloorMap, terrainElevations, terrainWoodMap, mountainPathProfile, terrainSamplingCache);
        positions[i * 3 + 1] = caveEntrance.carveHeight(colF*UNIT_SIZE,rowF*UNIT_SIZE,y);
    }
    
    terrainGeo.setAttribute('splatWeights', new THREE.BufferAttribute(splatWeights, 4));
    terrainGeo.setAttribute('wetSandWeight', new THREE.BufferAttribute(wetSandWeights, 1));
    terrainGeo.setAttribute('mountainWeights', new THREE.BufferAttribute(mountainWeights, 4));

    for(let i = 0; i < uvs.length; i += 2) {
        if ((i & 8191) === 0) { const pause = checkpoint(); if (pause) await pause; }
        uvs[i] *= (mapWidth - 1);
        uvs[i+1] *= (mapHeight - 1);
    }
    
    await terrainBuild.computeNormals();
    positions = terrainGeo.attributes.position.array;
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
        shader.uniforms.terrainVisibilityDistance = terrainVisibilityDistance;

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
    const terrainSectors = await createTerrainSectorsAsync(THREE, terrainGeo, splatMaterial, segmentsW, segmentsH, 128, checkpoint);
    for (const sector of terrainSectors.children) {
        // Dibujar después del cielo y antes de agua/vegetación, conservando la oclusión del suelo.
        sector.renderOrder = -0.1;
        if (sector.userData.hasMountain) sector.userData.fogDistanceMultiplier = MOUNTAIN_VISIBILITY_DISTANCE / WORLD_VISIBILITY_DISTANCE;
    }
    scene.add(terrainSectors);
    { const pause = checkpoint(); if (pause) await pause; }
    const naturalVegetation=[pino1Mesh,pino2Mesh,alamo1Mesh,alamo2Mesh,arau1Mesh,arau2Mesh,arbusto1Mesh,arbusto2Mesh,weed1Mesh,weed2Mesh,weed3Mesh];
    alignShorelineInstances(THREE,naturalVegetation,terrainElevations.shorelineMask,mapWidth,UNIT_SIZE,
        (x,z)=>elevationMap[Math.round(z/UNIT_SIZE)][Math.round(x/UNIT_SIZE)],
        getTerrainHeight);
    vegetationSectors=await createInstanceSectorsAsync(THREE,naturalVegetation,64,0.75,checkpoint);
    scene.add(vegetationSectors.group);
    surfaceVegetationFade=createVegetationVisibility(vegetationSectors.group,{value:1});
    const slabCells = [];
    for (let z = 0; z < mapHeight; z++) for (let x = 0; x < mapWidth; x++) {
        if ((x & 31) === 0) { const pause = checkpoint(); if (pause) await pause; }
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
    for (const [index, [x,z]] of slabCells.entries()) {
        { const pause = checkpoint(); if (pause) await pause; }
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
    }
    const altarNeighborTops = [[-1,0],[1,0],[0,-1],[0,1]]
        .map(([dx,dz])=>slabTops.get((seaHeartAltar.center.z+dz)*mapWidth+seaHeartAltar.center.x+dx))
        .filter(height=>height!==undefined).sort((a,b)=>a-b);
    const altarCenterTop = altarNeighborTops[Math.floor(altarNeighborTops.length/2)] ?? altarTop;
    altarWaterHeight = altarCenterTop;
    // La celda central conserva el agua visible, pero sostiene al jugador a su nivel.
    slabTops.set(seaHeartAltar.center.z*mapWidth+seaHeartAltar.center.x,altarCenterTop);
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
    { const pause = checkpoint(); if (pause) await pause; }
    terrainGeo.dispose(); // Los sectores conservan los atributos compartidos; la malla global ya no se dibuja.

    const wreckMaterials = [
        new THREE.MeshPhongMaterial({map:maderaTex,color:0x80654b,shininess:0}),
        new THREE.MeshPhongMaterial({color:0x51483b,shininess:8}),
        new THREE.MeshPhongMaterial({color:0xdbd1ae,shininess:0}),
        new THREE.MeshPhongMaterial({color:0x9c4234,shininess:0}),
        new THREE.MeshPhongMaterial({color:0xa58a58,shininess:0})
    ];
    for (const definition of shipwreckProps) {
        { const pause = checkpoint(); if (pause) await pause; }
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
    const helmet = new THREE.Mesh(helmetGeometry, createDivingHelmetMaterials(THREE));
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
    divingHelmetMesh = helmet;

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
        { const pause = checkpoint(); if (pause) await pause; }
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
        { const pause = checkpoint(); if (pause) await pause; }
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
        const model = new THREE.Mesh(definition.type === 'BEACH_PLANK_TABLE' ? createBeachPlankTableGeometry(THREE) : definition.type === 'RUSTIC_BEACH_CHAIR' ? createRusticBeachChairGeometry(THREE) : definition.type === 'SPICE_SHELF' ? createSpiceShelfGeometry(THREE) : definition.type === 'WOOD_STOVE' ? createWoodStoveGeometry(THREE,{withWood:false}) : definition.type === 'ANTIQUE_STOVE' ? createAntiqueStoveGeometry(THREE) : definition.type === 'STUMP' ? createStumpGeometry(THREE) : definition.type === 'WORKBENCH' ? createWorkbenchGeometry(THREE) : definition.type === 'LOG_STACK' ? createLogStackGeometry(THREE) : isBed ? createBedGeometry(THREE) : definition.type === 'BARREL' ? createBarrelGeometry(THREE) : definition.type === 'BOOKSHELF' ? createBookshelfGeometry(THREE) : definition.type === 'TABLE' ? createTableGeometry(THREE) : definition.type === 'CHAIR' ? createChairGeometry(THREE) : definition.type === 'WARDROBE' ? createWardrobeGeometry(THREE) : definition.type === 'DESK' ? createDeskGeometry(THREE) : definition.type === 'CRATE_STACK' ? createCrateStackGeometry(THREE) : definition.type === 'SHELF' ? createShelfGeometry(THREE) : definition.type === 'DRESSER' ? createDresserGeometry(THREE) : definition.type === 'BARREL_STACK' ? createBarrelStackGeometry(THREE) : createSideTableGeometry(THREE), isBed ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            new THREE.MeshPhongMaterial({ color: 0xd8ceb3, shininess: 0, flatShading: true }),
            new THREE.MeshPhongMaterial({ color: 0x40566b, shininess: 0, flatShading: true })
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
        ] : definition.type === 'LOG_STACK' ? createLogStackMaterials(THREE) : definition.type === 'BOOKSHELF' ? [
            new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x8b5936, shininess: 0 }),
            ...[0x5a334a, 0x2b4565, 0x2b5143, 0x716044, 0x4c3b60].map(color => new THREE.MeshPhongMaterial({ color, shininess: 0 }))
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
        if (['CHAIR','RUSTIC_BEACH_CHAIR'].includes(definition.type)) {
            const reclined = definition.type === 'RUSTIC_BEACH_CHAIR';
            model.userData.type = 'CHAIR';
            model.userData.seatHeight = (reclined ? 0.48 : 0.72) * furnitureScale;
            if (reclined) {
                model.userData.seatEyeOffsetZ = -0.58 * furnitureScale;
                model.userData.seatLookLift = 0.12;
            }
            interactables.push(model);
        }
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
            woodStoveFire = createWoodStoveFire(THREE,model,torchFrames,furnitureScale,pipeTop);
            worldTorches.push(woodStoveFire.torch);
        }
        if (definition.id === 'graham-desk') {
            const writingSet = createDeskWritingSet(THREE);
            writingSet.scale.setScalar(furnitureScale);
            writingSet.position.x = -0.5; // Derecha en la vista desde la silla, junto a su desplazamiento.
            model.add(writingSet);
            const book = writingSet.getObjectByName('graham-desk-book');
            book.userData = { type: 'READABLE_BOOK', id: 'graham-journal' };
            interactables.push(book);
        }
        if (definition.id === 'graham-table') {
            const mateSet = createMateSet(THREE);
            mateSet.scale.setScalar(FURNITURE_SCALE);
            model.add(mateSet);
            for (const object of mateSet.children) {
                object.userData.type = 'MATE_SET';
                interactables.push(object);
                if (object.name === 'graham-mate') mateInteractable = object;
            }
        }
        scene.add(model);
        model.updateMatrixWorld(true);
        solidInteractables.push(model);
        if (definition.id === 'graham-stump') interactables.push(model);
    }

    torchLighting = createTorchLighting(THREE, scene, worldTorches);

    for (const definition of kitchenSacks) {
        { const pause = checkpoint(); if (pause) await pause; }
        const x = definition.position.x * UNIT_SIZE + definition.offset.x;
        const z = definition.position.z * UNIT_SIZE + definition.offset.z;
        if (!['INDOOR_FLOOR', 'WOOD'].includes(floorMap[definition.position.z]?.[definition.position.x])) {
            throw new Error(`El saco ${definition.id} requiere suelo interior.`);
        }
        const sack = createBurlapSack(THREE, definition);
        sack.name = definition.id;
        sack.scale.setScalar(definition.scale);
        sack.rotation.y = definition.rotationY;
        sack.position.set(x, getTerrainHeight(x, z), z);
        sack.userData = { type: 'BURLAP_SACK', id: definition.id };
        scene.add(sack);
        sack.updateMatrixWorld(true);
        solidInteractables.push(sack);
    }

    const garden = createKitchenGarden(THREE, {
        x: kitchenGardenPosition.x * UNIT_SIZE, z: kitchenGardenPosition.z * UNIT_SIZE
    }, getTerrainHeight, maderaTex, tierraTex);
    for (const model of garden) {
        { const pause = checkpoint(); if (pause) await pause; }
        scene.add(model);
        model.updateMatrixWorld(true);
        solidInteractables.push(model);
        model.traverse(part=>{if(['GARDEN_NOTE','CHAIR'].includes(part.userData.type))interactables.push(part);});
    }

    telescopeMesh=createTelescope(THREE);
    telescopeMesh.name='mountain-telescope';
    telescopeMesh.userData={type:'TELESCOPE_PICKUP',id:telescopeMesh.name,gx:telescopePickup.x,gz:telescopePickup.z};
    const telescopeX=telescopePickup.x*UNIT_SIZE, telescopeZ=telescopePickup.z*UNIT_SIZE;
    const telescopeDX=Math.sin(telescopePickup.rotationY), telescopeDZ=Math.cos(telescopePickup.rotationY);
    const telescopeRise=getTerrainHeight(telescopeX+telescopeDX*0.37,telescopeZ+telescopeDZ*0.37)
        -getTerrainHeight(telescopeX-telescopeDX*0.37,telescopeZ-telescopeDZ*0.37);
    telescopeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),
        new THREE.Vector3(telescopeDX*0.74,telescopeRise,telescopeDZ*0.74).normalize());
    telescopeMesh.rotateZ(0.22);
    telescopeMesh.position.set(telescopeX,getTerrainHeight(telescopeX,telescopeZ),telescopeZ);
    telescopeMesh.updateMatrixWorld(true);
    const telescopeVertices=telescopeMesh.geometry.attributes.position, telescopeVertex=new THREE.Vector3();
    let telescopeLift=-Infinity;
    for (let i=0;i<telescopeVertices.count;i++) {
        telescopeVertex.fromBufferAttribute(telescopeVertices,i).applyMatrix4(telescopeMesh.matrixWorld);
        telescopeLift=Math.max(telescopeLift,getTerrainHeight(telescopeVertex.x,telescopeVertex.z)-telescopeVertex.y);
    }
    telescopeMesh.position.y+=telescopeLift+0.006;
    telescopeMesh.updateMatrixWorld(true);
    scene.add(telescopeMesh); interactables.push(telescopeMesh);
    telescopeGlare=createTelescopeGlare(THREE,telescopeMesh);

    // Escritorio real sobre el suelo interior de la casa de la cima.
    const hatchX=LAKE_HATCH_CELL.x*UNIT_SIZE,hatchZ=LAKE_HATCH_CELL.z*UNIT_SIZE;
    const hatchGround=Math.max(...[-1.3,0,1.3].flatMap(dx=>[-1.3,0,1.3].map(dz=>getTerrainHeight(hatchX+dx,hatchZ+dz))))+.015;
    metalRoom=createLakeMetalRoom(THREE,hatchGround);
    metalRoomLadder=createMetalRoomLadder(camera,controls,metalRoom,PLAYER_HEIGHT);
    lakeAquarium=await createLakeAquarium(THREE,texLoader,metalRoom.aquariumLayout,{sand:arenaTex,rock:rocaTex},metalRoom.room.position);
    metalRoom.room.add(lakeAquarium.group);
    modularSynthRacks=createModularSynthRacks(THREE,maderaTex);
    metalRoom.room.add(modularSynthRacks.group);metalRoom.setFurnitureBounds(modularSynthRacks.bounds);
    scene.add(metalRoom.hatch,metalRoom.room);
    interactables.push(metalRoom.target,metalRoom.exitTarget);
    metalRoomShade=document.createElement('div');metalRoomShade.id='metal-room-travel-shade';
    metalRoomShade.setAttribute('aria-hidden','true');
    metalRoomShade.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:99;';
    document.body.append(metalRoomShade);

    const workshopX=telescopeWorkshopPosition.x*UNIT_SIZE, workshopZ=telescopeWorkshopPosition.z*UNIT_SIZE;
    mountainWorkshop=createTelescopeWorkshop(THREE,maderaTex);
    mountainWorkshop.desk.position.set(workshopX,getTerrainHeight(workshopX,workshopZ),workshopZ);
    mountainWorkshop.desk.rotation.y=telescopeWorkshopPosition.rotationY;
    mountainWorkshop.desk.updateMatrixWorld(true);
    scene.add(mountainWorkshop.desk);solidInteractables.push(mountainWorkshop.desk);
    interactables.push(mountainWorkshop.lensTarget,mountainWorkshop.lamp.group);

    wizardUpperFloor=createWizardUpperFloor(THREE,mountainWorkshop.desk.position.y,
        {wood:maderaTex,wall:muroTex,roof:techoTex,door:puertaTex});
    scene.add(wizardUpperFloor.group);
    interactables.push(wizardUpperFloor.door);

    const crtCeiling=wizardUpperFloor.upperLimit(wizardHouseLayout.origin.x+6.2,
        wizardHouseLayout.origin.z-5.8,mountainWorkshop.desk.position.y)+.06-mountainWorkshop.desk.position.y;
    wizardTelevisions=createWizardTelevisions(THREE,maderaTex,crtCeiling);
    wizardTelevisions.group.position.set(wizardHouseLayout.origin.x+6.2,mountainWorkshop.desk.position.y,wizardHouseLayout.origin.z-5.8);
    wizardTelevisions.group.rotation.y=-Math.PI/4;
    scene.add(wizardTelevisions.group);wizardTelevisions.group.updateMatrixWorld(true);
    solidInteractables.push(wizardTelevisions.collider,...wizardTelevisions.accessoryColliders);

    const observatoryX=(summitStonePlatform.minX+(summitStonePlatform.cellsPerSide-1)/2)*UNIT_SIZE;
    const observatoryZ=(summitStonePlatform.minZ+(summitStonePlatform.cellsPerSide-1)/2)*UNIT_SIZE;
    summitObservatory=createSummitObservatory(THREE,getTerrainHeight(observatoryX,observatoryZ),{wall:muroTex,wood:maderaTex});
    scene.add(summitObservatory.group);
    observatoryScope=createObservatoryScope(THREE,camera,controls,summitObservatory,
        (moving,silent)=>musicEvents.setObservatoryGearMoving(moving,silent),stellar=>musicEvents.playObservatoryLensChange(stellar));
    observatoryLadder=createObservatoryLadder(THREE,camera,controls,summitObservatory,PLAYER_HEIGHT);

    const fenceMaterial = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 0 });
    const fenceLocations = new Set(prepared.fenceCells.map(({ x, z }) => `${x},${z}`));
    for (const { x, z } of prepared.fenceCells) {
        { const pause = checkpoint(); if (pause) await pause; }
        // La abertura del portón conserva ambos postes de la valla.
        const gateHinge = x === 235 && z === 455 && fenceLocations.has('236,455');
        const east = fenceLocations.has(`${x + 1},${z}`) && !gateHinge;
        const south = fenceLocations.has(`${x},${z + 1}`);
        const wallConnections = [[-1,0],[1,0],[0,-1],[0,1]].filter(([dx,dz]) => floorMap[z+dz]?.[x+dx] === 'BUILDING');
        const postLift = x === 226 && z === 452 ? 0.30 : 0;
        const fence = new THREE.Mesh(createWoodFenceGeometry(THREE, east, south, wallConnections, postLift), fenceMaterial);
        fence.name = `wood-fence:${x},${z}`;
        fence.position.set(x * UNIT_SIZE, getTerrainHeight(x * UNIT_SIZE, z * UNIT_SIZE), z * UNIT_SIZE);
        fence.userData = { type: 'FENCE', gx: x, gz: z };
        scene.add(fence);
        fence.updateMatrixWorld(true);
        solidInteractables.push(fence);
        if (gateHinge) {
            const pivot = new THREE.Group();
            pivot.name = 'garden-gate-pivot';
            pivot.position.copy(fence.position);
            const gateWood = new THREE.MeshPhongMaterial({ color: 0x795034, flatShading: true, shininess: 0 });
            const gateEdge = new THREE.MeshPhongMaterial({ color: 0x9b6940, flatShading: true, shininess: 0 });
            const gateIron = new THREE.MeshPhongMaterial({ color: 0x282521, flatShading: true, shininess: 5 });
            function gatePiece(width, height, depth, px, py, pz, material, angle = 0) {
                const piece = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
                piece.position.set(px, py, pz);
                piece.rotation.z = angle;
                pivot.add(piece);
            }
            for (const height of [0.49, 1.05]) {
                gatePiece(1.70, 0.17, 0.13, 1, height, 0, gateWood);
                gatePiece(1.60, 0.025, 0.14, 1, height + 0.095, 0, gateEdge);
            }
            for (const offset of [0.23, 1.77]) gatePiece(0.14, 0.93, 0.17, offset, 0.76, 0, gateWood);
            // La riostra y el pestillo la distinguen de un tramo fijo de valla.
            gatePiece(1.55, 0.13, 0.18, 1, 0.77, 0, gateWood, -0.34);
            gatePiece(0.24, 0.12, 0.22, 1.77, 0.78, 0.03, gateIron);
            for (const height of [0.48, 1.04]) gatePiece(0.12, 0.12, 0.24, 0.19, height, 0, gateIron);
            const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.1, 0.18),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
            hitbox.position.set(1, 0.75, 0);
            hitbox.name = 'garden-gate';
            hitbox.userData = { type: 'GATE', isOpen: false, collisionEnabled: true,
                parentGroup: pivot, isHorizontal: true };
            pivot.add(hitbox);
            scene.add(pivot);
            pivot.updateMatrixWorld(true);
            interactables.push(hitbox);
            solidInteractables.push(hitbox);
        }
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
    structureSectors = await createInstanceSectorsAsync(THREE, structureMeshes, 32, 0, checkpoint);
    structureSectors.group.name = 'structure-sectors';
    scene.add(structureSectors.group);
    // Conservar las luces en la escena al ocultar interiores: evita nuevas variantes de shader.
    forestInteriorLights.length = 0;
    forestInteriorLights.push(...summitObservatory.interiorLights, ...wizardUpperFloor.interiorLights);
    for (const root of [mountainWorkshop.desk, wizardTelevisions.group])
        root.traverse(object => { if (object.isLight) forestInteriorLights.push(object); });
    scene.updateMatrixWorld(true);
    for (const light of forestInteriorLights) {
        if (light.target && light.target.parent) scene.attach(light.target);
        scene.attach(light);
    }
    fogCulling = createFogCulling(THREE, scene, [skyMesh, sunFlare.object, camera], FOG_RESIDUAL);
    prepareInactiveLights(THREE, scene);
    { const pause = checkpoint(); if (pause) await pause; }
    fogCulling.register();
    { const pause = checkpoint(); if (pause) await pause; }
    heartHalos = createHeartHalos(THREE, scene, floorMap, UNIT_SIZE, getTerrainHeight);
    { const pause = checkpoint(); if (pause) await pause; }
    minimap.initialize(floorCanvas);
    { const pause = checkpoint(); if (pause) await pause; }
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
    if(metalRoom?.active)return metalRoom.getHeight(x,z);
    const hatchFloor=metalRoom?.surfaceHeight(x,z);
    if(hatchFloor!=null)return hatchFloor;
    if (caveMap?.active && caveMap.contains(x,z)) return caveMap.getHeight(x,z);
    if (caveEntrance?.contains(x,z)) return caveEntrance.baseY + 0.025;
    const domeFloor=lakeHouseDome?.floorHeight(x,z);
    if(domeFloor!=null)return domeFloor;
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
            const wizardLimit=(metalRoom?.active?metalRoom.upperLimit():null)
                ?? lakeHouseDome?.upperLimit(player.position.x,player.position.z,feetY)
                ?? summitObservatory?.upperLimit(player.position.x,player.position.z,feetY)
                ?? wizardUpperFloor?.upperLimit(player.position.x,player.position.z,feetY);
            if (wizardLimit != null) limit=wizardLimit;
            else if (inAttic) limit = atticSupport.upperLimit(player.position.x, player.position.z);
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

function treeCollisionTop(x, z) {
    return getTerrainHeight(x, z) + TREE_SPRITE_HEIGHT * (2 / 3) - 0.5;
}

function isSafeGroundPosition(x,z) {
    return !hasObstacle(x,z,mapWidth,mapHeight,collisionMap,floorMap,false,solidInteractables,null,
        getTerrainHeight(x,z),treeCollisionTop,false,null,mountainPathProfile,getTerrainHeight);
}

function isRiverObstacle(x, z) {
    if (helmetEquipped || isRidingBoat || isFlying || caveMap?.active || !controls) return false;
    const controlObj = controls?.getObject?.();
    if (!controlObj?.position) return false;
    const currentGX = Math.floor((controlObj.position.x + UNIT_SIZE / 2) / UNIT_SIZE);
    const currentGZ = Math.floor((controlObj.position.z + UNIT_SIZE / 2) / UNIT_SIZE);
    const currentlyInRiver = currentGZ >= 0 && currentGZ < mapHeight && currentGX >= 0 && currentGX < mapWidth
        && floorMap[currentGZ][currentGX] === 'WATER_ROCK'
        && !slabTops.has(currentGZ * mapWidth + currentGX)
        && !woodFloorMap?.[currentGZ]?.[currentGX];

    const offsetsX = [-COLLISION_RADIUS, COLLISION_RADIUS, -COLLISION_RADIUS, COLLISION_RADIUS, 0];
    const offsetsZ = [-COLLISION_RADIUS, -COLLISION_RADIUS, COLLISION_RADIUS, COLLISION_RADIUS, 0];
    for (let i = 0; i < 5; i++) {
        const px = x + offsetsX[i];
        const pz = z + offsetsZ[i];
        const gx = Math.floor((px + UNIT_SIZE / 2) / UNIT_SIZE);
        const gz = Math.floor((pz + UNIT_SIZE / 2) / UNIT_SIZE);
        if (gz >= 0 && gz < mapHeight && gx >= 0 && gx < mapWidth) {
            const isRiver = floorMap[gz][gx] === 'WATER_ROCK'
                && !slabTops.has(gz * mapWidth + gx)
                && !woodFloorMap?.[gz]?.[gx];
            if (isRiver) {
                if (currentlyInRiver) {
                    const candGX = Math.floor((x + UNIT_SIZE / 2) / UNIT_SIZE);
                    const candGZ = Math.floor((z + UNIT_SIZE / 2) / UNIT_SIZE);
                    const candIsRiver = floorMap[candGZ]?.[candGX] === 'WATER_ROCK'
                        && !slabTops.has(candGZ * mapWidth + candGX)
                        && !woodFloorMap?.[candGZ]?.[candGX];
                    if (candIsRiver) return true;
                } else {
                    return true;
                }
            }
        }
    }
    return false;
}

function isPlayerNearRiver(px, pz) {
    if (helmetEquipped || isRidingBoat || isFlying || caveMap?.active) return false;
    const currentGX = Math.floor((px + UNIT_SIZE / 2) / UNIT_SIZE);
    const currentGZ = Math.floor((pz + UNIT_SIZE / 2) / UNIT_SIZE);
    if (currentGZ < 0 || currentGZ >= mapHeight || currentGX < 0 || currentGX >= mapWidth) return false;
    if (slabTops.has(currentGZ * mapWidth + currentGX) || woodFloorMap?.[currentGZ]?.[currentGX]) return false;
    if (floorMap[currentGZ][currentGX] === 'WATER_ROCK') return true;

    const threshold = COLLISION_RADIUS + 0.18;
    for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
            const gz = currentGZ + dz;
            const gx = currentGX + dx;
            if (gz < 0 || gz >= mapHeight || gx < 0 || gx >= mapWidth) continue;
            if (floorMap[gz][gx] === 'WATER_ROCK') {
                if (slabTops.has(gz * mapWidth + gx) || woodFloorMap?.[gz]?.[gx]) continue;
                const minX = gx * UNIT_SIZE - UNIT_SIZE / 2;
                const maxX = gx * UNIT_SIZE + UNIT_SIZE / 2;
                const minZ = gz * UNIT_SIZE - UNIT_SIZE / 2;
                const maxZ = gz * UNIT_SIZE + UNIT_SIZE / 2;
                const distX = Math.max(0, Math.max(minX - px, px - maxX));
                const distZ = Math.max(0, Math.max(minZ - pz, pz - maxZ));
                if (Math.hypot(distX, distZ) <= threshold) return true;
            }
        }
    }
    return false;
}

function isWall(x, z) {
    if(metalRoom?.active)return metalRoom.isWall(x,z);
    if (isRiverObstacle(x, z)) return true;
    if (caveMap?.active) return caveMap.isWall(x,z);
    if (caveEntrance?.contains(x,z)) return false;
    const controlObj = controls.getObject();
    const eyeHeight = isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
    if (!isRidingBoat) {
        if(lakeHouseDome?.blocksMovement(x,z,controlObj.position.y-eyeHeight,eyeHeight))return true;
        const observatoryCollision=summitObservatory?.blocksMovement(x,z,controlObj.position.y-eyeHeight);
        if(observatoryCollision!=null)return observatoryCollision;
        const wizardCollision=wizardUpperFloor?.blocksMovement(x,z,controlObj.position.y-eyeHeight,
            controlObj.position.x,controlObj.position.z);
        if (wizardCollision != null) return wizardCollision;
    }
    const atticCell = atticSupport?.cellAt(controlObj.position.x, controlObj.position.z);
    if (!isRidingBoat && bedCeilingHoleOpen && atticCell && (controlObj.position.y > atticCell.bottom || velocityY > 0)
        && (controlObj.position.y - eyeHeight >= atticCell.top - 0.08
            || atticSupport.fitsOpening(controlObj.position.x, controlObj.position.z))) {
        return atticSupport.blocksMovement(x,z,controlObj.position.y,eyeHeight);
    }
    return hasObstacle(isRidingBoat ? x - boatSeatOffset.x : x,
        isRidingBoat ? z - boatSeatOffset.z : z,
        mapWidth, mapHeight, collisionMap, floorMap, isRidingBoat, solidInteractables, boatReference,
        controlObj.position.y - eyeHeight, treeCollisionTop,
        musicEvents.isEventActive('forest') && heartLevitationHeight > 0.15, slabTops,mountainPathProfile,getTerrainHeight,canPassUnderRiverBridge);
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
function footstepSurfaceAt(x, z, onWoodSupport = false) {
    const gx = Math.floor((x + UNIT_SIZE / 2) / UNIT_SIZE);
    const gz = Math.floor((z + UNIT_SIZE / 2) / UNIT_SIZE);
    const floor = caveMap?.active ? 'DIRT' : floorMap[gz]?.[gx];
    const water = ['WATER', 'WATER_ROCK', 'BOAT'].includes(floor) && !slabTops.has(gz * mapWidth + gx);
    if (!floor || water || (caveMap?.active && caveMap.isWater(x, z))) return null;
    const slab = slabTops.has(gz * mapWidth + gx);
    const wood = onWoodSupport || (!slab && (woodFloorMap[gz]?.[gx]
        || ['INDOOR_FLOOR', 'WOOD', 'DOOR_UNLOCKED', 'DOOR_LOCKED'].includes(floor)));
    const hard = wood || slab;
    const sand = !hard && ['SAND', 'WET_SAND', 'SNOW_PEAK', 'SNOW_SLOPE'].includes(floor);
    const dirt = !hard && ['DIRT', 'MOUNTAIN', 'PEAK'].includes(floor);
    return { surface: wood ? 'wood' : sand ? 'sand' : dirt ? 'dirt' : hard ? 'indoor' : 'grass',
        outdoor: !hard && (OUTDOOR_STEP_FLOORS.has(floor) || sand || dirt) };
}

let stamina = STAMINA_MAX;

window.restartGame = () => {
    metalRoom?.reset();if(metalRoomShade)metalRoomShade.style.opacity='0';
    metalRoomLadder?.reset();
    observatoryScope?.stand();
    gardenNote.hide();
    observatoryMenu.hide();
    bedSettleIndex = -1;
    seatedChair = chairEntryPosition = null;
    musicEvents.resetWaterAudio();
    musicEvents.resetForestAmbience();forestAmbienceSample=null;forestAmbienceSampleTime=0;
    musicEvents.resetRiverAmbience();riverSoundSample=null;riverSoundSampleTime=0;
    musicEvents.resetSeaAmbience();seaSoundSample=null;seaSoundSampleTime=0;
    woodcutting.finish();
    if (grahamDap.active) { grahamDap.cancel(); controls.pointerSpeed = dapPointerSpeed; }
    bedBounceActive = false;
    bedTakeoffSoundPlayed = false;
    bedBounceImpulse = BED_BOUNCE_BASE_IMPULSE;
    bedBounceHitCeiling = false;
    bedCeilingHits = 0;
    jumpHeld = false;
    bedCeilingTimer = 0;
    if (!bedCeilingHoleOpen) {
        for (const stage of bedHoleStages) {
            scene.remove(stage);
            stage.geometry.dispose();
        }
        bedHoleStages = [];
        if (bedHoleRim) {
            bedHoleRim.visible = false;
            bedHoleRim.userData.visibilityEnabled = false;
        }
        for (const piece of bedFalseCeilingPieces.values()) {
            piece.visible = true;
            piece.userData.visibilityEnabled = true;
        }
    } else {
        showBedHoleStage(bedHoleStages.length);
    }
    bedHoleOpeningTime = -1;
    bedWoodChipTime = -1;
    bedWoodChipFadeStart = -1;
    bedWoodChipMotion.length = 0;
    if (bedWoodChips) bedWoodChips.count = 0;
    if (bedWoodChipMaterial) bedWoodChipMaterial.opacity = 1;
    crouchRequested = isCrouching = false;
    isDead = false;
    observatoryLadder?.reset();
    stamina = STAMINA_MAX;
    divingAir.reset();
    const controlObj = controls.getObject();
    controlObj.position.set(playerStartX * UNIT_SIZE, PLAYER_HEIGHT, playerStartZ * UNIT_SIZE);
    hud.hideDeath();
    hud.hideStamina();
    hud.hideDivingAir();
    resumeGame();
};

function showBedHoleStage(index) {
    for (const stage of bedHoleStages) {
        stage.visible = false;
        stage.userData.visibilityEnabled = false;
    }
    if (bedHoleRim) {
        bedHoleRim.visible = false;
        bedHoleRim.userData.visibilityEnabled = false;
    }
    const mesh = index < bedHoleStages.length ? bedHoleStages[index] : bedHoleRim;
    if (mesh) {
        mesh.visible = true;
        mesh.userData.visibilityEnabled = true;
    }
}

function pierceBedCeiling(x, z) {
    if (!makeBedHoleMesh || !bedHoleRim) return;
    for (const stage of bedHoleStages) {
        scene.remove(stage);
        stage.geometry.dispose();
    }
    const halfWidth = bedDefinition.size.x * UNIT_SIZE / 2;
    const halfLength = bedDefinition.size.z * UNIT_SIZE / 2;
    const localX = THREE.MathUtils.clamp(x - bedHoleRim.position.x, -halfWidth + 0.26, halfWidth - 0.26);
    const localZ = THREE.MathUtils.clamp(z - bedHoleRim.position.z, -halfLength + 0.26, halfLength - 0.26);
    bedCeilingImpact.set(bedHoleRim.position.x + localX, bedHoleRim.position.z + localZ);
    bedHoleStages = [0, 0.32, 0.68, 0.9].map(progress => makeBedHoleMesh(
        BED_CEILING_OPENING.map(([finalX, finalZ], index) => {
            const angle = Math.atan2(finalZ, finalX);
            const edge = 0.9 + (index % 3) * 0.08;
            const smallX = localX + Math.cos(angle) * 0.23 * edge;
            const smallZ = localZ + Math.sin(angle) * 0.23 * edge;
            return [THREE.MathUtils.lerp(smallX, finalX, progress),
                THREE.MathUtils.lerp(smallZ, finalZ, progress)];
        })));
    for (const piece of bedFalseCeilingPieces.values()) {
        piece.visible = false;
        piece.userData.visibilityEnabled = false;
    }
    showBedHoleStage(0);
}

function releaseBedCeiling() {
    bedHoleOpeningTime = 0;
}

function spawnBedWoodChips() {
    bedWoodChipTime = 0;
    bedWoodChipFadeStart = -1;
    bedWoodChipMotion.length = 0;
    if (!bedWoodChips || !bedHoleRim) return;
    if (bedWoodChipMaterial) bedWoodChipMaterial.opacity = 1;
    const bed = solidInteractables.find(object => object.userData.id === 'graham-bed');
    if (!bed) { bedWoodChipTime = -1; return; }
    const resolveLanding = createBedDebrisLanding(bed);
    const targets = createBedDebrisTargets(bed);
    for (let i = 0; i < targets.length; i++) {
        const chip = {
            x: bedCeilingImpact.x + (Math.random() - 0.5) * 0.75,
            y: bedHoleRim.position.y - 0.08,
            z: bedCeilingImpact.y + (Math.random() - 0.5) * 1.1,
            vy: -0.4 - Math.random() * 1.1,
            turn: (Math.random() - 0.5) * 8,
            yaw: Math.random() * Math.PI * 2,
            size: 0.08 + Math.random() * 0.13,
            landed: false
        };
        const target = targets[i];
        chip.landing = resolveLanding(chip, target.x, target.z,
            getTerrainHeight(target.x, target.z), target.surface);
        chip.bounceHeight = chip.landing.surface === 'bed'
            ? 0.008 + Math.random() * 0.014 : 0.035 + Math.random() * 0.04;
        chip.bounceDuration = Math.sqrt(8 * chip.bounceHeight / 9);
        bedWoodChipMotion.push(chip);
        bedWoodChipDummy.position.set(chip.x, chip.y, chip.z);
        bedWoodChipDummy.rotation.set(0, chip.yaw, 0);
        bedWoodChipDummy.scale.set(chip.size * 1.8, chip.size * 0.35, chip.size);
        bedWoodChipDummy.updateMatrix();
        bedWoodChips.setMatrixAt(i, bedWoodChipDummy.matrix);
    }
    bedWoodChips.count = bedWoodChipMotion.length;
    bedWoodChips.instanceMatrix.needsUpdate = true;
}

function updateBedCeilingBreak(delta) {
    if (bedHoleOpeningTime >= 0) {
        bedHoleOpeningTime += delta;
        const stage = Math.min(bedHoleStages.length,
            Math.floor(bedHoleOpeningTime / BED_CEILING_OPEN_SECONDS * (bedHoleStages.length + 1)));
        showBedHoleStage(stage);
        if (stage === bedHoleStages.length) {
            bedHoleOpeningTime = -1;
            spawnBedWoodChips();
            for (const mesh of bedHoleStages) {
                scene.remove(mesh);
                mesh.geometry.dispose();
            }
            bedHoleStages = [];
        }
    }
    if (bedWoodChipTime < 0 || !bedWoodChips) return;
    bedWoodChipTime += delta;
    for (let i = 0; i < bedWoodChipMotion.length; i++) {
        const chip = bedWoodChipMotion[i];
        const landing = chip.landing;
        const time = Math.min(bedWoodChipTime, landing.time);
        const touching = bedWoodChipTime >= landing.time;
        const bounce = THREE.MathUtils.clamp((bedWoodChipTime - landing.time) / chip.bounceDuration, 0, 1);
        chip.landed = bedWoodChipTime >= landing.time + chip.bounceDuration;
        const bounceY = 4 * chip.bounceHeight * bounce * (1 - bounce);
        const travel = bedDebrisTravel(time, landing.travelTime) * landing.travelTime;
        bedWoodChipDummy.position.set(touching ? landing.x : chip.x + landing.vx * travel,
            touching ? landing.y + bounceY : chip.y + chip.vy * time - 4.5 * time * time,
            touching ? landing.z : chip.z + landing.vz * travel);
        // Rebote vertical sobre el contacto calculado; nunca atraviesa la superficie.
        bedWoodChipDummy.rotation.set(0, chip.yaw + chip.turn * time, 0);
        bedWoodChipDummy.scale.set(chip.size * 1.8, chip.size * 0.35, chip.size);
        bedWoodChipDummy.updateMatrix();
        bedWoodChips.setMatrixAt(i, bedWoodChipDummy.matrix);
    }
    if (bedWoodChipFadeStart < 0 && bedWoodChipMotion.every(chip => chip.landed)) {
        bedWoodChipFadeStart = bedWoodChipTime;
    }
    let fade = 0;
    if (bedWoodChipFadeStart >= 0) {
        fade = THREE.MathUtils.clamp((bedWoodChipTime - bedWoodChipFadeStart
            - BED_WOOD_CHIP_HOLD_SECONDS) / BED_WOOD_CHIP_FADE_SECONDS, 0, 1);
    }
    if (bedWoodChipMaterial) bedWoodChipMaterial.opacity = 1 - fade;
    bedWoodChips.instanceMatrix.needsUpdate = true;
    if (fade >= 1) {
        bedWoodChipTime = -1;
        bedWoodChipFadeStart = -1;
        bedWoodChips.count = 0;
        if (bedWoodChipMaterial) bedWoodChipMaterial.opacity = 1;
    }
}

const FRAME_INTERVAL = 1000 / (isTouchMode ? 30 : 60);
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

    // Espera, órbita y viaje no avanzan físicas, misiones, reloj del cielo ni audio.
    if (!mapLoaded) return;
    const riverFadeDelta=drowningRescueContext?.river ? Math.min(cameraDelta,drowningRescue.fadeOutRemaining) : 0;
    if(riverFadeDelta>0)advanceDrowningRiver(riverFadeDelta);
    drowningRescue.update(cameraDelta);

    updateMetalRoomTravel((controls.isLocked||inventoryRunning)&&!isDead?Math.min(cameraDelta,.1):0);

    const controlObj = controls.getObject();
    touchControls?.syncDialogue(drowningRescue.waitingForContinue || (controls.isLocked && !isDead && (isDialogOpen || spawnGreeting.active)));
    if (isDialogOpen) constrainDialogLook(cameraDelta);
    let vegetationDelta = 0;

    if (grahamSprite) {
        grahamSprite.rotation.set(0,
            Math.atan2(controlObj.position.x - grahamSprite.position.x, controlObj.position.z - grahamSprite.position.z),
            0);
    }
    skyMesh.position.set(controlObj.position.x, 200, controlObj.position.z);
    daySkyMesh.position.y = controlObj.position.y - 200;
    nightSkyMesh.position.y = dawnSkyMesh.position.y = duskSkyMesh.position.y = daySkyMesh.position.y; // Horizonte del atlas a la altura de los ojos.

    if ((controls.isLocked || inventoryRunning) && mapLoaded && !caveTransitionPending && !isDead) {
        previousPlayerPosition.copy(controlObj.position);
        if (handTorchEnabled && isPlayerUnderwater()) setHandTorchEnabled(false);
        const rawDelta = cameraDelta;
        hud.updateHelmetCrack(rawDelta);
        updateHelmetBreak(rawDelta);
        const delta = Math.min(rawDelta, 0.1);
        if(metalRoom?.active){lakeAquarium?.update(delta);modularSynthRacks?.update(delta);}
        updateBedCeilingBreak(delta);
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
        seaHeartSoundMotion.update(rawDelta);
        seaHeartSoundRelative.copy(seaHeartSoundPosition).sub(seaHeartListenerPosition)
            .applyQuaternion(seaHeartListenerRotation);
        musicEvents.setUnderwaterPosition(seaHeartSoundRelative.x, seaHeartSoundRelative.y, seaHeartSoundRelative.z);
        altarFireSoundRelative.set(seaHeartAltar.center.x*UNIT_SIZE,altarFlames[0]?.position.y ?? 0,seaHeartAltar.center.z*UNIT_SIZE)
            .sub(seaHeartListenerPosition).applyQuaternion(seaHeartListenerRotation);
        musicEvents.updateAltarFirePosition({x:altarFireSoundRelative.x,y:altarFireSoundRelative.y,z:altarFireSoundRelative.z,
            enabled:!caveMap?.active && !isDead});
        if (woodStoveFire) {
            stoveFireSoundRelative.copy(woodStoveFire.position).sub(seaHeartListenerPosition)
                .applyQuaternion(seaHeartListenerRotation);
            musicEvents.updateStoveFirePosition({x:stoveFireSoundRelative.x,y:stoveFireSoundRelative.y,z:stoveFireSoundRelative.z,
                enabled:woodStoveFire.lit && !caveMap?.active && !isDead});
        }
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
        const forestActive = musicEvents.isEventActive('forest');
        const forestPlaybackTime = musicEvents.getEventPlaybackTime('forest');
        updateForestCueIndicator(forestPlaybackTime, forestActive);
        if (forestActive && (isCrouching || crouchRequested)) {
            crouchRequested = false;
            updatePlayerPosture();
        }
        const carriedByRiver = isHelmetSubmergedInRiver();
        if (carriedByRiver) {
            isRunning = false;
            touchControls?.cancelRun();
        }
        if (isHelmetUnderwater()) {
            jumpHeld = false; touchJumpRepeatWait = 0;
            surfaceJumpActive = false;
            if (velocityY > 0) velocityY = 0;
        }
        const running = isRunning && !carriedByRiver && (!forestActive || isFlying);
        heartVision.update(delta, forestActive, musicEvents.getForestEnergy(),
            forestPlaybackTime ?? 0);

        heartHalos?.update(delta, controlObj.position, heartVision.uniforms);
        if (!forestActive) {
            wizardUpperFloor?.update(delta,controlObj.position,isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT);
            wizardTelevisions?.update(delta,controlObj.position.distanceToSquared(wizardTelevisions.group.position)<900);
        }
        const doors = solidInteractables.filter(object => object.userData.type === 'DOOR' || object.userData.type === 'GATE');
        updateDoorAnimations(doors, delta, () => {
            const position = controlObj.position;
            const beforeX = position.x, beforeZ = position.z;
            const backward = camera.getWorldDirection(frameCameraDirection).negate();
            // Comprobar todas las hojas, también después de un primer empuje.
            for (let attempt = 0; attempt <= doors.length; attempt++) {
                const result = pushPlayerFromMovingDoors(position, backward, doors, isWall);
                if (result.blocked || (result.moved && (seatedChair || woodcutting.active || attempt === doors.length))) {
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
            forestHeartShrine.userData.updatePulse(underwaterViewTime.value);
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
                    
                    // Posiciones y tamaños en el cielo, medidos en diámetros lunares.
                    // El FOV amplía la luna y los destellos juntos, incluso a mitad del vuelo.
                    camera.updateMatrixWorld(true);
                    const cameraInSky = skyMesh.worldToLocal(camera.getWorldPosition(new THREE.Vector3()));
                    const moonDirection = moonSprite.position.clone().sub(cameraInSky).normalize();
                    const skyRight = new THREE.Vector3(0, 1, 0).cross(moonDirection).normalize();
                    const skyUp = moonDirection.clone().cross(skyRight).normalize();
                    const moonDiameter = moonSprite.scale.x;
                    const placeInSky = (target, x, y) => {
                        target.copy(moonSprite.position)
                            .addScaledVector(skyRight, x * moonDiameter)
                            .addScaledVector(skyUp, y * moonDiameter);
                    };
                    placeInSky(starStart, -0.45, 0.31);
                    placeInSky(starEnd, 0.45, 0.09);
                    const starWidth = moonDiameter * (32 / 60);
                    starSprite.scale.set(starWidth, starWidth / 4, 1);
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
                    const rows = [-0.12, 0.24, 0.56];
                    const columns = [-0.30, 0.28, -0.58];
                    for (let i = 0; i < 3; i++) {
                        if (!extraStarSprites[i]) {
                            const sprite = new THREE.Sprite(starSprite.material.clone());
                            sprite.renderOrder = starSprite.renderOrder;
                            skyMesh.add(sprite);
                            extraStarSprites.push(sprite);
                        }
                        const sprite = extraStarSprites[i];
                        const x = columns[i] + (Math.random() - 0.5) * 0.18;
                        const y = 0.20 + rows[i] + (Math.random() - 0.5) * 0.14;
                        const span = 0.80 + Math.random() * 0.20;
                        const drop = 0.11 + Math.random() * 0.15;
                        const start = new THREE.Vector3(), end = new THREE.Vector3();
                        placeInSky(start, x - span / 2, y + drop / 2);
                        placeInSky(end, x + span / 2, y - drop / 2);
                        sprite.scale.copy(starSprite.scale);
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
                    // La cola apunta contra el movimiento también al mover la mira.
                    starTailScreen.copy(flight.start).applyMatrix4(skyMesh.matrixWorld).project(camera);
                    starHeadScreen.copy(flight.end).applyMatrix4(skyMesh.matrixWorld).project(camera);
                    flight.sprite.material.rotation = Math.atan2(
                        starTailScreen.y - starHeadScreen.y,
                        (starTailScreen.x - starHeadScreen.x) * camera.aspect
                    );
                    const fadeIn = THREE.MathUtils.smoothstep(time, 0, 0.065);
                    const fadeOut = 1 - THREE.MathUtils.smoothstep(time, 0.20, duration);
                    flight.sprite.material.opacity = fadeIn * fadeOut;
                }
                if (starTimer >= starFlights[starFlights.length - 1].delay + duration) starSequenceActive = false;
            }

        }

        // La misión controla las pausas iniciales; luego el reloj funciona normalmente.
        dayNightTimer = questSkyCycle.update(skyCycle.transitioning ? 0 : delta, heartQuest.stage,
            musicEvents.hasEventStarted('forest'),forestPlaybackTime);
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
        const scopeTarget=summitObservatory?.telescopeInteraction;
        if(scopeTarget) {
            const nearScope=observatoryScope?.seated;
            const index=interactables.indexOf(scopeTarget);
            if(nearScope&&index<0)interactables.push(scopeTarget);
            else if(!nearScope&&index>=0){interactables.splice(index,1);if(targetInteractable===scopeTarget)targetInteractable=null;}
            const chair=summitObservatory.scopeChair,chairIndex=interactables.indexOf(chair);
            const nearChair=observatoryLadder?.canUseScope&&!observatoryScope?.seated;
            if(nearChair&&chairIndex<0)interactables.push(chair);
            else if(!nearChair&&chairIndex>=0)interactables.splice(chairIndex,1);
        }
        interactionHits.length = 0;
        if (!woodcutting.active && !spawnGreeting.active && !heartPull.active && !grahamDap.active && !isDialogOpen) {
            raycaster.setFromCamera(centerVec, camera);
            raycaster.intersectObjects(interactables, true, interactionHits);
            // La puerta del dormitorio solo se ofrece al alcanzar el piso superior.
            if (wizardUpperFloor && controlObj.position.y-(isCrouching ? PLAYER_HEIGHT*.6 : PLAYER_HEIGHT)<wizardUpperFloor.levelY-.25) {
                for(let i=interactionHits.length-1;i>=0;i--) {
                    if(interactionHits[i].object.userData.type==='WIZARD_UPPER_DOOR')interactionHits.splice(i,1);
                }
            }
            if (!interactionHits.length && telescopeMesh) {
                telescopeMesh.localToWorld(telescopeInteractionCenter.copy(telescopeMesh.geometry.boundingSphere.center));
                const distance=telescopeInteractionOffset.subVectors(telescopeInteractionCenter,raycaster.ray.origin).length();
                if (distance<3.5 && raycaster.ray.direction.dot(telescopeInteractionOffset)>0
                    && raycaster.ray.distanceSqToPoint(telescopeInteractionCenter)<0.24*0.24)
                    interactionHits.push({object:telescopeMesh,distance});
            }
            // Amplía la zona de selección del casco a corta distancia sin tapar otros objetos.
            if (!interactionHits.length && divingHelmetMesh) {
                divingHelmetMesh.localToWorld(helmetInteractionCenter.copy(divingHelmetMesh.geometry.boundingSphere.center));
                const helmetDistance = helmetInteractionOffset.subVectors(helmetInteractionCenter, raycaster.ray.origin).length();
                if (helmetDistance < 3.5
                    && raycaster.ray.direction.dot(helmetInteractionOffset) > 0
                    && raycaster.ray.distanceSqToPoint(helmetInteractionCenter) < 0.95 * 0.95) {
                    interactionHits.push({ object: divingHelmetMesh, distance: helmetDistance });
                }
            }
            // Añadir solo un margen pequeño alrededor del modelo del mate.
            if (!interactionHits.length && mateInteractable) {
                mateInteractable.localToWorld(mateInteractionCenter.copy(mateInteractable.geometry.boundingSphere.center));
                const mateDistance = mateInteractionOffset.subVectors(mateInteractionCenter, raycaster.ray.origin).length();
                if (mateDistance < 3.5
                    && raycaster.ray.direction.dot(mateInteractionOffset) > 0
                    && raycaster.ray.distanceSqToPoint(mateInteractionCenter) < 0.35 * 0.35) {
                    interactionHits.push({ object: mateInteractable, distance: mateDistance });
                }
            }
        }
        const intersects = interactionHits;
        
        if (woodcutting.active || spawnGreeting.active || heartPull.active || grahamDap.active || isDialogOpen || metalRoom?.busy) {
            targetInteractable = null;
            hud.hideInteraction();
        } else if (observatoryScope?.active) {
            targetInteractable = null;
            hud.hideInteraction();
        } else if(observatoryScope?.seated) {
            const scopeHit=intersects.find(hit=>hit.object===scopeTarget&&hit.distance<3.5);
            targetInteractable=scopeHit?scopeTarget:null;hud.showInteraction();
            hud.setInteractionText(targetInteractable
                ?`${isTouchMode?'B':'E'} · ${astroscopeInstalled?'Omniscopio':'Acoplar Astroscopio'}`
                :`${isTouchMode?'B':'E'} · Levantarse`,{bottom:!targetInteractable});
            hud.setInteractionColor('#e8e8e0');
        } else if (seatedChair) {
            const bookHit = intersects[0];
            targetInteractable = bookHit?.distance < 3.5 && bookHit.object.userData.type === 'READABLE_BOOK'
                ? bookHit.object : null;
            hud.showInteraction();
            hud.setInteractionText(targetInteractable ? 'Presiona E para leer la bitácora' : 'Presiona E para levantarte',{bottom:!targetInteractable});
            hud.setInteractionColor('#ffeb3b');
        } else if((observatoryLadder?.active||observatoryLadder?.canUseScope)&&(!observatoryLadder.canUseScope||intersects[0]?.object.userData.type!=='OBSERVATORY_CHAIR')) {
            targetInteractable=null;hud.hideInteraction();
        } else if (intersects.length > 0 && intersects[0].distance < 3.5
            && (intersects[0].object.userData.item !== 'forest-heart' || canReachForestHeart())) {
            targetInteractable = intersects[0].object;
            hud.showInteraction();
            if(targetInteractable.userData.type==='LAKE_HATCH') {
                hud.setInteractionText(musicEvents.isEventActive('forest')?'Espera a que termine la canción':'Presiona E para abrir la escotilla');
                hud.setInteractionColor('#d8e4eb');
            } else if (targetInteractable.userData.type === 'READABLE_BOOK') {
                hud.setInteractionText('Presiona E para leer la bitácora');
                hud.setInteractionColor('#ffeb3b');
            } else if (targetInteractable.userData.type === 'CHAIR'||targetInteractable.userData.type==='OBSERVATORY_CHAIR') {
                hud.setInteractionText('Presiona E para sentarte');
                hud.setInteractionColor('#ffeb3b');
            } else if (targetInteractable.userData.type === 'GARDEN_NOTE') {
                hud.setInteractionText(`${isTouchMode?'Presiona B':'Presiona E'} para leer el bloc de notas`);
                hud.setInteractionColor('#e8d6a4');
            } else if (targetInteractable.userData.id === 'graham-stump') {
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
            } else if (targetInteractable.userData.type === 'WIZARD_UPPER_DOOR') {
                hud.setInteractionText(targetInteractable.userData.isOpen
                    ? 'Presiona E para cerrar la puerta' : 'Presiona E para abrir la puerta');
                hud.setInteractionColor('#ffeb3b');
            } else if(targetInteractable.userData.type==='OBSERVATORY_TELESCOPE') {
                hud.setInteractionText(astroscopeInstalled?'Presiona E para opciones del Omniscopio'
                    :hasAstroscope?(isTouchMode?'Presiona B para acoplar Astroscopio al Omniscopio':'Clic derecho o E para acoplar Astroscopio al Omniscopio')
                    :'Omniscopio · necesitas el Astroscopio');
                hud.setInteractionColor('#a9d8e7');
            } else if (targetInteractable.userData.type === 'WORKSHOP_LAMP') {
                hud.setInteractionText(`${isTouchMode?'Presiona B':'Presiona E'} para ${mountainWorkshop.lamp.group.userData.isOn?'apagar':'encender'} la lámpara`);
                hud.setInteractionColor('#ffdf9e');
            } else if (targetInteractable.userData.type === 'TELESCOPE_WORKBENCH') {
                hud.setInteractionText(telescopeRepaired ? 'Lente Bifrost instalada · Astroscopio preparado'
                    : hasAstroscope ? 'Presiona E para instalar la Lente Bifrost'
                    : 'Lente Bifrost · primero encuentra el Astroscopio');
                hud.setInteractionColor('#a9d8e7');
            } else if (targetInteractable.userData.type === 'TELESCOPE_PICKUP') {
                hud.setInteractionText('Presiona E para recoger Astroscopio');
                hud.setInteractionColor('#ffeb3b');
            } else if (targetInteractable.userData.type === 'PINK_SUNGLASSES_PICKUP') {
                hud.setInteractionText('Presiona E para tomar lentes de sol rosados');
                hud.setInteractionColor('#f384b8');
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
            } else if (targetInteractable.userData.type === 'GATE') {
                hud.setInteractionText(targetInteractable.userData.isOpen ? 'Presiona E para cerrar Portón' : 'Presiona E para abrir Portón');
                hud.setInteractionColor('#ffeb3b');
            }
        } else {
            targetInteractable = null;
            hud.hideInteraction();
        }

        if (caveMap?.active) {
            targetInteractable = null;
            if (caveMap.nearExit(controlObj.position)) {
                hud.showInteraction();
                hud.setInteractionText('Presiona E para volver a la isla');
                hud.setInteractionColor('#d8e4eb');
            } else hud.hideInteraction();
        }
        if(metalRoom?.active&&!metalRoom.busy) {
            targetInteractable=null;
            if(metalRoom.nearExit(controlObj.position)) {
                hud.showInteraction();hud.setInteractionText('Presiona E para volver al lago');hud.setInteractionColor('#d8e4eb');
            } else if(metalRoomLadder.active||metalRoom.nearLadder(controlObj.position)) {
                hud.showInteraction();
                hud.setInteractionText(isTouchMode?'Cruceta: ↑ subir · ↓ bajar':'W/↑ subir · S/↓ bajar');hud.setInteractionColor('#d8e4eb');
            } else hud.hideInteraction();
        }
        const showRiverWarning = !isDead && !isDialogOpen && gameStarted && (controls.isLocked || inventoryRunning)
            && isPlayerNearRiver(controlObj.position.x, controlObj.position.z);
        hud.setRiverWarning(showRiverWarning);
        const pullingHeart = heartPull.active;
        heartPull.update(delta);
        const cuttingWood = woodcutting.active;
        woodcutting.update(delta, rawDelta);
        const ladderAllowed=!seatedChair&&!cuttingWood&&!spawnGreeting.active&&!pullingHeart&&!grahamDap.active&&!isDialogOpen&&!observatoryScope?.seated&&!isDead&&!metalRoom?.busy;
        const roomLadderMoved=ladderAllowed&&metalRoomLadder?.update(delta,moveState,!isFlying&&!isRidingBoat&&!isCrouching&&!isInventoryOpen);
        const ladderMoved=roomLadderMoved||ladderAllowed&&!metalRoom?.active&&observatoryLadder?.update(delta,moveState,!isFlying&&!isRidingBoat&&!isCrouching&&!isInventoryOpen);
        if(ladderMoved){velocity.set(0,0,0);velocityY=0;canJump=false;isRunning=false;jumpHeld=false;crouchRequested=false;bobTimer=0;previousPlayerPosition.copy(controlObj.position);}
        if (!ladderMoved && !seatedChair && !cuttingWood && !spawnGreeting.active && !pullingHeart && !grahamDap.active && !isDialogOpen && !observatoryScope?.seated && !metalRoom?.busy) {
            // Desde que queda ensartado hasta que caen las astillas no puede desplazarse.
            // La física vertical sigue activa para que se suelte y caiga normalmente.
            const trappedInBedCeiling = bedCeilingTimer > 0 || bedHoleOpeningTime >= 0;
            if (trappedInBedCeiling) velocity.x = velocity.z = 0;
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
            const inWater = isPlayerWaterCell(startX, startZ);

            const waterSpeedMod = isRidingBoat ? 1.5 : (inWater && heartLevitationHeight <= 0.15
                ? helmetEquipped || isPlayerUnderwater() ? DIVING_WATER_SPEED_MOD : 0.4 : 1.0);
            const movementMultiplier = isFlying
                ? (running ? FLIGHT_SPRINT_MULTIPLIER : FLIGHT_MULTIPLIER)
                : (running ? SPRINT_MULTIPLIER : 1);

            if (!trappedInBedCeiling && (moveState.forward || moveState.backward)) velocity.z -= direction.z * MOVEMENT_SPEED * movementMultiplier * waterSpeedMod * delta;
            if (!trappedInBedCeiling && (moveState.left || moveState.right)) velocity.x -= direction.x * MOVEMENT_SPEED * movementMultiplier * waterSpeedMod * delta;

            if (inventoryRunning) {
                // PointerLockControls no desplaza con cursor libre; conservar sus ejes horizontales.
                inventoryMoveAxis.setFromMatrixColumn(camera.matrix,0);
                controlObj.position.addScaledVector(inventoryMoveAxis,-velocity.x*delta);
                inventoryMoveAxis.crossVectors(camera.up,inventoryMoveAxis);
                controlObj.position.addScaledVector(inventoryMoveAxis,-velocity.z*delta);
            } else {
                controls.moveRight(-velocity.x * delta);
                controls.moveForward(-velocity.z * delta);
            }

            let dx = controlObj.position.x - startX;
            let dz = controlObj.position.z - startZ;

            // Centrar en el cauce mientras avanza hacia el lago, respetando obstáculos.
            if (!trappedInBedCeiling && isHelmetSubmergedInRiver()) {
                const push=getRiverDisplacement(startX,startZ,delta);
                dx+=push.x;dz+=push.z;
            }

            if(heartLevitationHeight>.15&&!isFlying&&!isRidingBoat&&!caveMap?.active&&forestMovementBoundary) {
                const bounded=forestMovementBoundary.constrain(startX,startZ,dx,dz);
                dx=bounded.dx;dz=bounded.dz;
            }

            controlObj.position.x = startX;
            controlObj.position.z = startZ;

            if (isFlying) {
                controlObj.position.x += dx;
                controlObj.position.z += dz;
                if (moveState.up) controlObj.position.y += MOVEMENT_SPEED * FLIGHT_VERTICAL_MULTIPLIER * delta;
                if (moveState.down) controlObj.position.y -= MOVEMENT_SPEED * FLIGHT_VERTICAL_MULTIPLIER * delta;
            
                velocityY = 0;
                surfaceJumpActive = false;
                stamina = STAMINA_MAX;
                hud.hideStamina();
            } else {
                if (isRidingBoat) {
                    if(!moveBoatAxis(controlObj.position,'x',dx)) velocity.x=0;
                    if(!moveBoatAxis(controlObj.position,'z',dz)) velocity.z=0;
                } else {
                    if (!isWall(startX + dx, startZ)) controlObj.position.x += dx; else velocity.x = 0;
                    if (!isWall(controlObj.position.x, startZ + dz)) controlObj.position.z += dz; else velocity.z = 0;
                    if (caveMap?.active && heartLevitationHeight <= 0.15)
                        caveMap.pushPlayer(controlObj.position,isCrouching ? PLAYER_HEIGHT*.6 : PLAYER_HEIGHT,delta);
                }

                if (inWater && !helmetEquipped && !isRidingBoat && heartLevitationHeight <= 0.15) {
                    hud.showStamina();
                    stamina -= delta;
                    if (stamina <= 0) {
                        if(beginDrowningRescue())return;
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
            heartVision.uniforms.heartTreeMotion.value = Math.max(0, Math.min(1, heartLevitationHeight / HEART_LEVITATION_MAX_RISE))
                * heartVision.uniforms.heartWarpStrength.value;
            // Reintentar incorporarse al despejar la cabeza durante este mismo desplazamiento.
            updatePlayerPosture();
            const eyeHeight = isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT;
            const bedSupport = isRidingBoat || isFlying || inWater ? -Infinity
                : getBedSupport(controlObj.position.x, controlObj.position.z, controlObj.position.y - eyeHeight, solidInteractables);
            const ceilingSupport = isRidingBoat || isFlying || inWater || !bedCeilingHoleOpen ? -Infinity
                : atticSupport?.supportHeight(controlObj.position.x, controlObj.position.z, controlObj.position.y - eyeHeight, true) ?? -Infinity;
            const wizardSupport = isRidingBoat || isFlying || inWater ? -Infinity
                : Math.max(wizardUpperFloor?.supportHeight(controlObj.position.x, controlObj.position.z, controlObj.position.y - eyeHeight) ?? -Infinity,
                    summitObservatory?.supportHeight(controlObj.position.x,controlObj.position.z,controlObj.position.y-eyeHeight) ?? -Infinity);
            const currentTerrainHeight = Math.max(getPlayerGroundHeight(controlObj.position.x, controlObj.position.z),
                bedSupport, ceilingSupport, wizardSupport);
            const riverBridgeCeiling = canPassUnderRiverBridge(controlObj.position.x, controlObj.position.z)
                ? getRiverBridgeUnderside(controlObj.position.x, controlObj.position.z) - 0.03 : Infinity;
            const onBed = Number.isFinite(bedSupport) && bedSupport >= currentTerrainHeight;
            const onAttic = Number.isFinite(ceilingSupport) && ceilingSupport >= currentTerrainHeight;
            const onWizardFloor = Number.isFinite(wizardSupport) && wizardSupport >= currentTerrainHeight;
            if (!onBed || isFlying || isRidingBoat || inWater) {
                bedBounceActive = false;
                bedCeilingHits = 0;
                if (bedSettleIndex > 0 || isFlying || isRidingBoat || inWater) bedSettleIndex = -1;
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
                    musicEvents.playBedCeilingRelease();
                    // Soltar al jugador antes de revelar la rotura en este mismo fotograma.
                    velocityY = -1;
                    controlObj.position.y += velocityY * delta;
                    bedCeilingHoleOpen = true;
                    // La abertura pequeña se ensancha mientras caen astillas; la cubierta superior sigue intacta.
                    releaseBedCeiling();
                }
            } else if (!isFlying) {
                // Seguir pendientes continuas estando apoyado, sin quedarse bajo la superficie al subir.
                if (canJump && velocityY <= 0 && Math.abs(controlObj.position.y - targetEyesHeight) < 0.15) {
                    controlObj.position.y = targetEyesHeight;
                }
                if (canJump && controlObj.position.y > targetEyesHeight + 0.15) canJump = false;
                // Primeros rebotes más pausados; recuperar el ritmo normal al tomar vuelo.
                const bedBuild = Math.min(1, Math.max(0, (bedBounceImpulse - BED_BOUNCE_BASE_IMPULSE) / 6));
                const bedTempo = onBed && bedSettleIndex > 0 ? bedSettleTempo : onBed && bedBounceActive
                    ? BED_BOUNCE_INITIAL_TIME_SCALE + (1 - BED_BOUNCE_INITIAL_TIME_SCALE) * bedBuild * bedBuild * (3 - 2 * bedBuild)
                    : 1;
                // Con escafandra, el salto corto conserva la misma trayectoria en tierra y sobre el agua.
                const airTempo = surfaceJumpActive ? 1 : inWater && !isRidingBoat && isPlayerUnderwater() ? UNDERWATER_MOTION_TIME_SCALE
                    : !onBed && !inWater && !isRidingBoat ? NORMAL_JUMP_TIME_SCALE : bedTempo;
                const verticalDelta = delta * airTempo;
                // Sin escafandra se conserva la gravedad normal de cada superficie.
                const waterGravityScale = velocityY < 0 ? WATER_FALL_GRAVITY_SCALE : WATER_GRAVITY_SCALE;
                const verticalGravity = surfaceJumpActive || (inWater && !isRidingBoat) ? GRAVITY * waterGravityScale : GRAVITY;
                velocityY -= verticalGravity * verticalDelta;
                controlObj.position.y += velocityY * verticalDelta;

                if (controlObj.position.y < targetEyesHeight) {
                    surfaceJumpActive = false;
                    if (onBed && jumpHeld) {
                        bedSettleIndex = -1;
                        // Mantener salto inicia/reanuda la cadena al apoyar sobre el colchón.
                        musicEvents.playBedJump();
                        bedTakeoffSoundPlayed = false;
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

                    } else if (onBed && !canJump && bedSettleIndex >= 0 && bedSettleIndex < BED_SETTLE_IMPULSES.length) {
                        musicEvents.playBedJump();
                        bedTakeoffSoundPlayed = false;
                        controlObj.position.y = targetEyesHeight;
                        velocityY = BED_SETTLE_IMPULSES[bedSettleIndex];
                        bedSettleTempo = BED_SETTLE_TEMPOS[bedSettleIndex++];
                        bedBounceActive = false;
                        canJump = false;
                    } else {
                        const justLanded = !canJump;
                        if (onBed && justLanded && !bedTakeoffSoundPlayed) musicEvents.playBedJump();
                        else if (justLanded && !onBed && !inWater && !isRidingBoat && !isFlying) {
                            const landingStep = footstepSurfaceAt(controlObj.position.x, controlObj.position.z, onAttic || onWizardFloor);
                            if (landingStep) {
                                musicEvents.playFootstep(false, 1.15, landingStep.outdoor,
                                    footstepIndex % 2 === 0, landingStep.surface);
                                footstepIndex++;
                            }
                        }
                        bedTakeoffSoundPlayed = false;
                        controlObj.position.y = targetEyesHeight;
                        velocityY = 0;
                        canJump = true;
                        bedBounceActive = false;
                        bedSettleIndex = -1;
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
            const wizardCeiling=(metalRoom?.active?metalRoom.upperLimit():null)
                ?? lakeHouseDome?.upperLimit(controlObj.position.x,controlObj.position.z,controlObj.position.y-eyeHeight)
                ?? summitObservatory?.upperLimit(controlObj.position.x,controlObj.position.z,controlObj.position.y-eyeHeight)
                ?? wizardUpperFloor?.upperLimit(controlObj.position.x,controlObj.position.z,controlObj.position.y-eyeHeight);
            if (wizardCeiling != null) {
                if (controlObj.position.y > wizardCeiling) {
                    controlObj.position.y=wizardCeiling;
                    if (velocityY > 0) velocityY=0;
                }
            } else if (roofGZ >= 0 && roofGZ < mapHeight && roofGX >= 0 && roofGX < mapWidth) {
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
                                bedCeilingTimer = BED_CEILING_STUCK_SECONDS;
                                musicEvents.playBedCeilingImpact();
                                bedCeilingHoleTile = { x: roofGX, z: roofGZ };
                                pierceBedCeiling(controlObj.position.x, controlObj.position.z);
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

            if (controlObj.position.y > riverBridgeCeiling) {
                controlObj.position.y = riverBridgeCeiling;
                velocityY = Math.min(0, velocityY);
            }
            const speed = Math.sqrt(velocity.x**2 + velocity.z**2);
            if (!isFlying) {
                if (speed > 1.0 && canJump && !isRidingBoat) {
                    const previousBob = bobTimer;
                    const underwaterCadence = isPlayerUnderwater()
                        ? DIVING_WATER_SPEED_MOD * (running ? UNDERWATER_MOTION_TIME_SCALE : 1) : 1;
                    bobTimer += delta * (running ? 16.9 : 8.0) * bobCadence * underwaterCadence;
                    controlObj.position.y = targetEyesHeight + Math.sin(bobTimer) * 0.04;
                    // Un golpe al cruzar el punto más bajo; sigue la cadencia del balanceo.
                    const trough = Math.PI * 1.5;
                    const previousStep = Math.floor((previousBob - trough) / (Math.PI * 2));
                    const currentStep = Math.floor((bobTimer - trough) / (Math.PI * 2));
                    const moved = Math.hypot(controlObj.position.x-startX,controlObj.position.z-startZ)>0.0001;
                    if (currentStep > previousStep && moved && !inWater
                        && !(caveMap?.active && caveMap.isWater(controlObj.position.x,controlObj.position.z))) {
                        const accented = footstepIndex % 2 === 0;
                        const step = footstepSurfaceAt(controlObj.position.x, controlObj.position.z, onAttic || onWizardFloor);
                        if (step) {
                            const walkingAccent = WALKING_STEP_ACCENTS[footstepIndex % WALKING_STEP_ACCENTS.length];
                            const accent = running ? (accented ? 1 : step.outdoor ? 0.72 : 0.92) : walkingAccent;
                            const rhythm = walkingRhythm.next(running);
                            musicEvents.playFootstep(running, accent * rhythm.variation, step.outdoor, accented, step.surface);
                            footstepIndex++;
                            bobCadence = rhythm.cadence;
                        }
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
        const waterUnderfoot = caveMap?.active ? caveMap.isWater(controlObj.position.x,controlObj.position.z)
            : isPlayerWaterCell(controlObj.position.x, controlObj.position.z);
        if (heldItem === 'mate' && waterUnderfoot && !isRidingBoat
            && controlObj.position.y - (isCrouching ? PLAYER_HEIGHT * 0.6 : PLAYER_HEIGHT)
                <= getWaterSurfaceHeight(controlObj.position.x, controlObj.position.z) + 0.05) {
            setHeldItem(null);
            menus.setItemDescription('Mate guardado.');
        }
        if (handTorchEnabled && isPlayerUnderwater()) setHandTorchEnabled(false);
        const localWaterHeight = getWaterSurfaceHeight(controlObj.position.x,controlObj.position.z);
        const visuallySubmerged = waterUnderfoot && !isRidingBoat && controlObj.position.y < localWaterHeight - 0.03;
        const windSheltered = visuallySubmerged || !!caveMap?.active || !!metalRoom?.active
            || ['INDOOR_FLOOR','BUILDING'].includes(floorMap[airGZ]?.[airGX])
            || (!!woodFloorMap[airGZ]?.[airGX] && roofMap[airGZ]?.[airGX] === 'ROOF');
        musicEvents.updateWind(windSheltered, visuallySubmerged);
        musicEvents.updateWaterAudio({
            waterPresent: caveMap?.active ? caveMap.isWater(controlObj.position.x,controlObj.position.z) : waterUnderfoot,
            feetY: controlObj.position.y - (isCrouching ? PLAYER_HEIGHT*.6 : PLAYER_HEIGHT),
            eyeY: controlObj.position.y,
            waterHeight: localWaterHeight,
            enabled: !isDead && !isRidingBoat && !isFlying
        });
        forestAmbienceSampleTime -= rawDelta;
        riverSoundSampleTime -= rawDelta;
        seaSoundSampleTime -= rawDelta;
        if (!caveMap?.active && (seaSoundSampleTime <= 0 || !seaSoundSample)) {
            seaSoundSample = sampleSeaSound(seaSoundField, UNIT_SIZE,
                controlObj.position.x, controlObj.position.y, controlObj.position.z, WATER_SURFACE_HEIGHT);
            seaSoundSampleTime = 0.2;
        }
        if (seaSoundSample) {
            riverSoundRotation.copy(camera.quaternion).invert();
            seaSoundRelative.set(seaSoundSample.x,seaSoundSample.y,seaSoundSample.z)
                .sub(controlObj.position).applyQuaternion(riverSoundRotation);
            musicEvents.updateSeaAmbience({x:seaSoundRelative.x,y:seaSoundRelative.y,z:seaSoundRelative.z,
                gain:!caveMap?.active && !metalRoom?.active && !visuallySubmerged && !isDead ? seaSoundSample.gain : 0});
        }
        if (!caveMap?.active && (riverSoundSampleTime <= 0 || !riverSoundSample)) {
            riverSoundSample = sampleRiverSound(riverSoundField, UNIT_SIZE,
                controlObj.position.x, controlObj.position.y, controlObj.position.z, WATER_SURFACE_HEIGHT);
            riverSoundSampleTime = 0.2;
        }
        if (riverSoundSample) {
            riverSoundRotation.copy(camera.quaternion).invert();
            riverSoundRelative.set(riverSoundSample.x, riverSoundSample.y, riverSoundSample.z)
                .sub(controlObj.position).applyQuaternion(riverSoundRotation);
            musicEvents.updateRiverAmbience({ x: riverSoundRelative.x, y: riverSoundRelative.y, z: riverSoundRelative.z,
                gain: !caveMap?.active && !metalRoom?.active && !visuallySubmerged && !isDead ? riverSoundSample.gain : 0 });
        }
        if(!caveMap?.active && (forestAmbienceSampleTime<=0 || !forestAmbienceSample)) {
            forestAmbienceSample=sampleForestSurroundings(floorMap,UNIT_SIZE,controlObj.position.x,controlObj.position.z);
            for(const source of forestAmbienceSample.sources) source.y=getTerrainHeight(source.x,source.z)+2.5;
            forestAmbienceSampleTime=.25;
        }
        if(forestAmbienceSample) {
            forestAmbienceRotation.copy(camera.quaternion).invert();
            for(let i=0;i<4;i++) {
                const source=forestAmbienceSample.sources[i],target=forestAmbienceSources[i];
                forestAmbienceRelative.set(source.x,source.y,source.z).sub(controlObj.position).applyQuaternion(forestAmbienceRotation);
                target.x=forestAmbienceRelative.x;target.y=forestAmbienceRelative.y;target.z=forestAmbienceRelative.z;target.weight=source.weight;
            }
            const indoors=['INDOOR_FLOOR','WOOD','BUILDING'].includes(floorMap[airGZ]?.[airGX]);
            musicEvents.updateForestAmbience({gain:!caveMap?.active&&!metalRoom?.active&&!visuallySubmerged&&!indoors&&!isDead?forestAmbienceSample.gain:0,sources:forestAmbienceSources,night:skyCycle.weights.night>0.5});
        }
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
        const seaAirBonus = !caveMap?.active && !metalRoom?.active && seaSoundField?.surface[airGZ * mapWidth + airGX] === 1;
        divingAir.update(rawDelta, helmetEquipped && submerged,
            !waterUnderfoot || isRidingBoat || controlObj.position.y >= localWaterHeight,
            seaAirBonus ? Infinity : DIVING_AIR_SECONDS);
        if (helmetEquipped && submerged) {
            hud.showDivingAir(divingAir.remaining, divingAir.maximum);
            if (divingAir.remaining === 0) {
                if(beginDrowningRescue())return;
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
        } else if (!caveMap?.active && !metalRoom?.active && !isFlying && !isRidingBoat && !isDialogOpen && caveEntrance?.triggered(controlObj.position)) {
            enterCaveTestMap();
        }
        
        // Variación suave de la antorcha de mano, conservando intensidad media 8.
        handTorchFlickerTime += delta;
        torchLight.intensity = handTorchEnabled ? 8.0 + Math.sin(handTorchFlickerTime * 2.4) * 0.22
            + Math.sin(handTorchFlickerTime * 4.1) * 0.1 : 0;
        
        // Animar las antorchas del mundo
        altarFlameTime += delta;
        altarFlames.forEach(flame => updateAltarBlueFire(flame,altarFlameTime));
        woodStoveFire?.update(altarFlameTime);
        const frameIndex = Math.floor(altarFlameTime / 0.15) % 5;
        if (torchFrames.length === 5) {
            for (let i = 0; i < torchSprites.length; i++) {
                torchSprites[i].material.map = torchFrames[frameIndex];
            }
        }
    }
    
    if (aguaFloorMat) {
        waterWaveTime.value += vegetationDelta;
        const time = waterWaveTime.value;
        waterWaveTime.value = time;
        const frame = Math.floor(time * 1) % 3; // 1 frame por segundo
        if (frame === 0) aguaFloorMat.map = agua1Tex;
        else if (frame === 1) aguaFloorMat.map = agua2Tex;
        else aguaFloorMat.map = agua3Tex;
        caveMap?.syncWaterTexture();
    }

    for (const sprite of torchSprites) {
        faceTorchFlameToCamera(sprite);
        if (sprite.material.userData.flameStrength) sprite.material.userData.flameStrength.value = 1 - dayTransition;
    }
    if (torchLighting) torchLighting.update(controlObj.position, altarFlameTime, dayTransition);
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
    hud.setUnderwaterTint(gameStarted && (controls.isLocked || inventoryRunning) && !isDead ? underwaterBlend * underwaterLightLevel : 0);
    telescopeGlare?.update(camera,vegetationDelta,gameStarted && mapLoaded && controls.isLocked && !isDead);
    telescopeView.update(vegetationDelta,canUseTelescope()&&!observatoryScope?.active);
    observatoryScope?.update(vegetationDelta);
    const stellarView=observatoryScope?.astronomical&&!cameraSubmerged;
    // El cielo y sus astros comparten el mismo origen óptico en todas las lentes.
    skyMesh.position.set(controlObj.position.x,200,controlObj.position.z);
    daySkyMesh.position.y=nightSkyMesh.position.y=dawnSkyMesh.position.y=duskSkyMesh.position.y=controlObj.position.y-200;
    observatorySky.position.y=controlObj.position.y-200;
    // Deriva estelar casi imperceptible, independiente del ciclo rápido del cielo normal.
    observatorySky.rotation.y=underwaterViewTime.value*.000001;
    observatorySky.visible=!!stellarView;
    nightSkyMesh.visible=!stellarView;
    daySkyMesh.visible=!stellarView&&dayMaterials.some(material=>material.opacity!==0);
    dawnSkyMesh.visible=!stellarView&&dawnSkyMesh.material.opacity!==0;
    duskSkyMesh.visible=!stellarView&&duskSkyMesh.material.opacity!==0;
    moonMat.opacity=stellarView?1:1-.6*dayTransition;
    sunMat.opacity=stellarView?1:skyCycle.weights.day+skyCycle.weights.dawn+skyCycle.weights.dusk;
    sunSprite.visible=sunMat.opacity>.001&&!questSkyCycle.waitingForSunrise;
    sunSprite.position.y=controlObj.position.y-200+Math.sin(Math.PI*skyCycle.sunProgress)*580;
    // Mayor alcance óptico tanto para el Omniscopio como para el Astroscopio.
    // El fundido del terreno y el descarte de sectores usan la misma distancia.
    const opticalRange=cameraSubmerged?1:stellarView?20:observatoryScope?.active?6
        :1+5*THREE.MathUtils.clamp((1/telescopeView.lookScale-1)/2,0,1);
    scene.fog.density/=opticalRange;
    if(stellarView)scene.fog.density=0;
    terrainVisibilityDistance.value=WORLD_VISIBILITY_DISTANCE*opticalRange;
    const opticalFar=Math.max(1500,terrainVisibilityDistance.value*1.2);
    if(camera.far!==opticalFar){camera.far=opticalFar;camera.updateProjectionMatrix();}
    const forestInteriorsHidden = !caveMap?.active && (musicEvents.isEventActive('forest')
        || heartVision.uniforms.heartStrength.value > 0.001 || heartLevitationHeight > 0.15);
    const riverDrowningFade=!!drowningRescueContext?.river && drowningRescue.fadeOutRemaining>0;
    if (!gameStarted || (isDead && !riverDrowningFade)) riverCameraMotion.reset();
    else riverCameraMotion.update(riverDrowningFade ? riverFadeDelta : vegetationDelta,
        riverDrowningFade || (!isDialogOpen && !observatoryScope?.active && isHelmetSubmergedInRiver()));
    riverCameraMotion.apply();
    const fogPlane = fogCulling?.update(camera);
    if (forestInteriorsHidden) {
        for (const light of forestInteriorLights) {
            if (!forestDimmedLights.has(light)) forestDimmedLights.set(light, light.intensity);
            light.intensity = 0;
        }
        for (const root of [summitObservatory?.interior, wizardUpperFloor?.interior,
            wizardTelevisions?.group, mountainWorkshop?.desk]) {
            if (!root) continue;
            if (!forestHiddenRoots.has(root)) forestHiddenRoots.set(root, root.visible);
            root.visible = false;
        }
    } else if (forestHiddenRoots.size) {
        for (const [root, visible] of forestHiddenRoots) root.visible = visible;
        forestHiddenRoots.clear();
        for (const [light, intensity] of forestDimmedLights) light.intensity = intensity;
        forestDimmedLights.clear();
    }
    const showUnderwaterPlants = mapLoaded && isPlayerUnderwater() && !isRidingBoat;
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
    if ((!controls.isLocked && !inventoryRunning) || isDead) hud.hideDivingAir();
    hud.updateCoordinates(metalRoom?.active?metalRoom.localPosition(controlObj.position):caveMap?.active ? caveMap.localPosition(controlObj.position) : controlObj.position, UNIT_SIZE, testMode.enabled && !woodcutting.active && gameStarted && (controls.isLocked || inventoryRunning) && !isDead);
    heldItemSprite.visible = !!heldItem && heldItem !== 'mate' && heldItem !== 'astroscope' && !observatoryScope?.active && !woodcutting.active && gameStarted && (controls.isLocked || inventoryRunning) && !isDead;
    heldTorch.update(Math.floor(altarFlameTime / 0.15) % torchFrames.length,
        hasTorch && !woodcutting.active && gameStarted && (controls.isLocked || inventoryRunning) && !isDead,
        handTorchEnabled);
    torchLight.position.set(heldTorch.object.position.x, heldTorch.object.position.y + heldTorch.object.scale.y * 0.2, -0.5);
    heldMate.update((controls.isLocked || inventoryRunning) ? vegetationDelta : 0, canDrinkMate()&&!observatoryScope?.active);
    const heartInHand=heldItemSprite.visible&&heldItem==='heart'&&heartQuest.hasHeart;
    const cyanBreath=.5-.5*Math.cos(underwaterViewTime.value*1.6);
    heldHeartCyan.value=heartInHand ? .72+.23*cyanBreath : 0;
    heldHeartLight.intensity=heartInHand ? .22+.08*cyanBreath : 0;
    const canShowForestFx = gameStarted && (controls.isLocked || inventoryRunning) && !isDead && !observatoryScope?.active;

    forestTrailStrength.value = canShowForestFx ? heartVision.getTrailStrength() : 0;


    hud.setHelmetViewVisible(hasDivingHelmet && helmetEquipped && gameStarted && (controls.isLocked || inventoryRunning) && !isDead);
    underwaterStrength.value = underwaterBlend;
    pinkSunglassesTint.value = pinkSunglassesEquipped && gameStarted && !isDead ? 1 : 0;
    if (controls.isLocked && !isDead) heartPull.applyCameraShake();
    grahamDap.apply();
    telescopeView.applyShake();
    const caveLighting = caveMap?.active || metalRoom?.active ? {
        ambient: ambientLight.intensity,
        directional: dirLight.intensity,
        skyVisible: skyMesh.visible,
        flareVisible: sunFlare.object.visible,
        background: scene.background.clone(),
        fogColor: scene.fog.color.clone()
    } : null;
    if (caveLighting) {
        ambientLight.intensity = metalRoom?.active ? .65 : 0;
        dirLight.intensity = 0;
        skyMesh.visible = false;
        sunFlare.object.visible = false;
        scene.background.set(0x000000);
        scene.fog.color.set(0x000000);
    }
    try {
        performancePanel?.begin();
        underwaterView.render(scene, camera);
        heldOverlay.render();
    } finally {
        if (caveLighting) {
            ambientLight.intensity = caveLighting.ambient;
            dirLight.intensity = caveLighting.directional;
            skyMesh.visible = caveLighting.skyVisible;
            sunFlare.object.visible = caveLighting.flareVisible;
            scene.background.copy(caveLighting.background);
            scene.fog.color.copy(caveLighting.fogColor);
        }
        telescopeView.restoreShake();
        grahamDap.restore();
        heartPull.restoreCameraShake();
        riverCameraMotion.restore();
        performancePanel?.record(timestamp, frameStart);
    }
}

function prepareUnderwaterPlants() {
    if (!underwaterVegetationPreparation) underwaterVegetationPreparation = (async () => {
        const plants = await createUnderwaterVegetation(THREE,texLoader,underwaterPlantDefinitions,
            getTerrainHeight,UNIT_SIZE,WATER_SURFACE_HEIGHT,vegetationWindTime);
        const fade = createVegetationVisibility(plants.group,{value:0});
        fade.set(0);
        prepareInactiveLights(THREE, plants.group);
        scene.add(plants.group);
        underwaterVegetationFade = fade;
        underwaterVegetation = plants;
    })();
    return underwaterVegetationPreparation;
}

animate();

let viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
function resizeGameViewport() {
    const width = Math.max(1, Math.round(window.visualViewport?.width || window.innerWidth));
    const height = Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight));
    if (width === viewportWidth && height === viewportHeight) return;
    viewportWidth = width;
    viewportHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateHeldItemLayout();
    renderer.setSize(width, height);
    underwaterView.resize();
}
function restoreTouchViewport() {
    if (!isTouchMode || document.hidden) return;
    requestAnimationFrame(() => {
        resizeGameViewport();
        if (gameStarted) {
            touchControls?.show();
            touchControls?.syncDialogue(controls.isLocked && !isDead && (isDialogOpen || spawnGreeting.active));
            touchControls?.sync(controls.isLocked);
        }
    });
    setTimeout(resizeGameViewport, 150);
    setTimeout(resizeGameViewport, 400);
}
window.addEventListener('resize', resizeGameViewport);
window.visualViewport?.addEventListener('resize', resizeGameViewport);
window.addEventListener('orientationchange', restoreTouchViewport);
document.addEventListener('fullscreenchange', restoreTouchViewport);
document.addEventListener('webkitfullscreenchange', restoreTouchViewport);
document.addEventListener('visibilitychange', restoreTouchViewport);
window.addEventListener('pageshow', restoreTouchViewport);
