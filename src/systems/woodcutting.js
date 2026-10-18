import { AXE_SPEEDS, WOOD_EXIT_SECONDS, WOOD_PERFECT_POWER, chooseWoodRound, axePower, woodHitDamage, woodHitLabel, woodLogPoints, woodDamageStage } from './woodcutting-rules.js';
import { createChoppingLogGeometry, createLogCrackGeometry } from '../world/chopping-log-geometry.js';

// Recorta el cilindro con un plano real y cierra ambas caras del corte.
// El golpe final divide el tronco en dos mitades cerradas.
export function splitWoodGeometry(THREE, source, normal, offset) {
    const base = source.index ? source.toNonIndexed() : source.clone();
    const position = base.attributes.position;
    const cuts = [];
    const output = [[], []];
    const groups = [[], []];
    function emit(half, polygon, materialIndex) {
        const list = output[half], start = list.length / 3;
        for (let i = 1; i < polygon.length - 1; i++)
            for (const point of [polygon[0], polygon[i], polygon[i + 1]]) list.push(point.x, point.y, point.z);
        if (list.length / 3 > start) groups[half].push({ start, count: list.length / 3 - start, materialIndex });
    }
    for (let i = 0; i < position.count; i += 3) {
        const triangle = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(position, i + j));
        for (let half = 0; half < 2; half++) {
            const sign = half === 0 ? -1 : 1, polygon = [];
            for (let j = 0; j < 3; j++) {
                const a = triangle[j], b = triangle[(j + 1) % 3];
                const da = normal.dot(a) - offset, db = normal.dot(b) - offset;
                if (sign * da >= -1e-7) polygon.push(a);
                if (da * db < 0) {
                    const point = a.clone().lerp(b, da / (da - db));
                    polygon.push(point);
                    if (half === 0 && !cuts.some(other => other.distanceToSquared(point) < 1e-12)) cuts.push(point);
                }
            }
            const material = base.groups.find(group => i >= group.start && i < group.start + group.count)?.materialIndex ?? 0;
            emit(half, polygon, material);
        }
    }
    if (cuts.length >= 3) {
        const center = cuts.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / cuts.length);
        const u = cuts[0].clone().sub(center).normalize(), v = new THREE.Vector3().crossVectors(normal, u);
        cuts.sort((a, b) => Math.atan2(a.clone().sub(center).dot(v), a.clone().sub(center).dot(u))
            - Math.atan2(b.clone().sub(center).dot(v), b.clone().sub(center).dot(u)));
        for (let i = 0; i < cuts.length; i++) {
            const a = cuts[i], b = cuts[(i + 1) % cuts.length];
            emit(0, [center, a, b], 3); emit(1, [center, b, a], 3);
        }
    }
    base.dispose();
    return output.map((vertices, half) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        // Agrupar caras contiguas evita un dibujo por triángulo.
        for (const group of groups[half]) {
            const last = geometry.groups.at(-1);
            if (last && last.materialIndex === group.materialIndex && last.start + last.count === group.start) last.count += group.count;
            else geometry.addGroup(group.start, group.count, group.materialIndex);
        }
        geometry.computeVertexNormals(); geometry.computeBoundingBox();
        return geometry;
    });
}

export function createWoodcutting(THREE, { scene, camera, controls, hud, onBegin, onEnd, random = Math.random }) {
    const group = new THREE.Group(); group.name = 'stump-woodcutting'; group.visible = false; scene.add(group);
    const bark = new THREE.MeshPhongMaterial({ color: 0x64442d, flatShading: true, shininess: 0 });
    const endgrain = new THREE.MeshPhongMaterial({ color: 0xc7a06b, flatShading: true, shininess: 0 });
    const splitMaterial = new THREE.MeshPhongMaterial({ color: 0xb48b58, flatShading: true, shininess: 0, side: THREE.DoubleSide });
    const log = new THREE.Mesh(createChoppingLogGeometry(THREE), [bark, endgrain, endgrain, splitMaterial]);
    log.name = 'woodcutting-log';
    group.add(log);
    const crack = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhongMaterial({
        vertexColors: true, side: THREE.DoubleSide, shininess: 0
    }));
    crack.name = 'woodcutting-central-crack';
    crack.visible = false; log.add(crack);
    const marker = new THREE.Mesh(new THREE.PlaneGeometry(.002, .14), new THREE.MeshBasicMaterial({
        color: 0xffffff, depthTest: false, depthWrite: false, fog: false
    }));
    marker.name = 'woodcutting-impact-marker'; marker.position.set(0, 0, -.8);
    marker.renderOrder = 1003; marker.visible = false; camera.add(marker);
    const anchor = new THREE.Vector3(), oldLook = new THREE.Quaternion(), lockedLook = new THREE.Quaternion();
    const right = new THREE.Vector3(), localNormal = new THREE.Vector3();
    const center = new THREE.Vector3();
    const groupAnchor = new THREE.Vector3();
    const feedbackAnchor = new THREE.Vector3(), feedbackProjection = new THREE.Vector3();
    const logBounds = new THREE.Box3();
    let feedbackTime = 2, feedbackText = '', feedbackColor = '#ffffff';
    const halves = [];
    let phase = 'idle', round, score = 0, elapsed = 0, sweepPhase = 0, power = 0, hitPower = 0;
    let hp = 100, hits = 0, exitHeld = false, exitTime = 0, message = '', pointerSpeed = 1;
    let impactTime = 1, impactStrength = 0;
    const active = () => phase !== 'idle';
    function removeHalves() {
        for (const mesh of halves) { group.remove(mesh); mesh.geometry.dispose(); }
        halves.length = 0;
    }
    function newRound() {
        removeHalves();
        round = chooseWoodRound(random, round?.speedIndex ?? -1);
        // La visibilidad lógica también debe respetarse en el descarte por niebla.
        group.add(log); log.visible = true; log.userData.visibilityEnabled = true;
        log.userData.damageStage = 0;
        crack.visible = false; crack.userData.visibilityEnabled = false;
        group.position.copy(groupAnchor); impactTime = 1;
        hp = 100; hits = 0;
        log.quaternion.identity();
        if (round.log.id === 'crosswise') log.rotation.z = Math.PI / 2;
        if (round.log.id === 'north-south') log.rotation.x = Math.PI / 2;
        if (round.log.id === 'diagonal') { log.rotation.z = Math.PI / 2; log.rotateX(Math.PI / 4); }
        log.position.set(0, round.log.id === 'upright' ? .43 : .21, 0);
        center.copy(log.position).add(group.position);
        camera.lookAt(center); lockedLook.copy(camera.quaternion);
        right.set(1, 0, 0).applyQuaternion(lockedLook);
        log.updateWorldMatrix(true, false); camera.updateWorldMatrix(true, false);
        sweepPhase = random(); elapsed = 0; phase = 'aiming';
        power = axePower(sweepPhase);
    }
    function refresh() {
        camera.updateWorldMatrix(true, false);
        feedbackProjection.copy(feedbackAnchor).project(camera);
        const feedbackOpacity = Math.max(0, Math.min(1, feedbackTime/.08, (1.5-feedbackTime)/.45));
        if (active()) hud.update({ score, round, message, hp, hits, power,
            damage: woodHitDamage(power), exitProgress: exitTime / WOOD_EXIT_SECONDS,
            feedback: { text: feedbackText, color: feedbackColor, opacity: feedbackOpacity,
                x: (feedbackProjection.x*.5+.5)*100, y: (-feedbackProjection.y*.5+.5)*100 } });
    }
    function begin(stump) {
        if (active()) return false;
        onBegin(); anchor.copy(camera.position); oldLook.copy(camera.quaternion);
        pointerSpeed = controls.pointerSpeed; controls.pointerSpeed = 0;
        // Superficie real del modelo, incluidas escala y traslación vigentes.
        stump.updateMatrixWorld(true);
        bark.map = Array.isArray(stump.material) ? stump.material[1]?.map ?? null : null;
        bark.needsUpdate = true;
        const box = new THREE.Box3().setFromObject(stump);
        group.position.set(stump.position.x, box.max.y + .012, stump.position.z);
        groupAnchor.copy(group.position);
        score = 0; round = null; exitHeld = false; exitTime = 0; message = '';
        feedbackTime = 2;
        group.visible = marker.visible = true;
        newRound(); update(0); hud.show(true); return true;
    }
    function finish() {
        if (!active()) return;
        phase = 'idle'; group.visible = marker.visible = false;
        log.visible = false; log.userData.visibilityEnabled = false;
        camera.position.copy(anchor); camera.quaternion.copy(oldLook); controls.pointerSpeed = pointerSpeed;
        exitHeld = false; exitTime = 0; removeHalves(); hud.show(false); onEnd(score);
    }
    function interact() {
        if (phase !== 'aiming' || exitHeld) return;
        // Congelar el valor que se dibujó: no recalcular según el siguiente fotograma.
        hitPower = power; phase = 'swing'; elapsed = 0;
    }
    function cut() {
        const damage = woodHitDamage(hitPower);
        hp = Math.max(0, hp - damage); hits++;
        impactTime = 0; impactStrength = .009 + .006 * hitPower;
        feedbackTime = 0; feedbackText = woodHitLabel(hitPower).replace(/[¡!]/g, '');
        feedbackColor = hitPower >= WOOD_PERFECT_POWER ? '#62e178' : hitPower >= .35 ? '#f2d34d' : '#df4134';
        log.updateWorldMatrix(true, true); logBounds.setFromObject(log);
        feedbackAnchor.copy(center); feedbackAnchor.y = logBounds.max.y + .12;
        message = `${woodHitLabel(hitPower)} −${damage} HP`;
        if (hp === 0) {
            const points = woodLogPoints(hits);
            score += points;
            message += ` · ${hits} ${hits === 1 ? 'golpe' : 'golpes'} · +${points} ${points === 1 ? 'punto' : 'puntos'}`;
            const inverse = log.quaternion.clone().invert();
            localNormal.copy(right).applyQuaternion(inverse);
            // Retirar el original: ningún sistema de visibilidad puede volver a dibujarlo.
            log.visible = false; log.userData.visibilityEnabled = false; group.remove(log);
            for (const geometry of splitWoodGeometry(THREE, log.geometry, localNormal, 0)) {
                const mesh = new THREE.Mesh(geometry, [bark, endgrain, endgrain, splitMaterial]);
                mesh.name = 'woodcutting-split-half';
                mesh.position.copy(log.position); mesh.quaternion.copy(log.quaternion);
                group.add(mesh); halves.push(mesh);
            }
        } else {
            const stage = woodDamageStage(hp);
            log.userData.damageStage = stage;
            const inverse = log.quaternion.clone().invert();
            const viewLocal = camera.position.clone().sub(center).applyQuaternion(inverse);
            localNormal.copy(right).applyQuaternion(inverse);
            crack.geometry.dispose();
            crack.geometry = createLogCrackGeometry(THREE, (100-hp)/100, viewLocal, localNormal);
            crack.visible = true; crack.userData.visibilityEnabled = true;
        }
        phase = hp === 0 ? 'result' : 'recovery'; elapsed = 0;
    }
    function update(dt, holdDelta = dt) {
        if (!active()) return;
        camera.position.copy(anchor); camera.quaternion.copy(lockedLook);
        impactTime += dt;
        feedbackTime += holdDelta;
        exitTime = exitHeld ? Math.min(WOOD_EXIT_SECONDS, exitTime + holdDelta) : 0;
        if (exitTime >= WOOD_EXIT_SECONDS - 1e-8) { finish(); return; }
        elapsed += dt;
        if (phase === 'aiming' || phase === 'recovery') {
            sweepPhase += dt * AXE_SPEEDS[round.speedIndex];
            power = axePower(sweepPhase);
        }
        if (phase === 'swing' && elapsed >= .16) cut();
        else if (phase === 'result') {
            for (let i = 0; i < halves.length; i++) {
                const sign = i === 0 ? -1 : 1;
                halves[i].position.copy(log.position).addScaledVector(right, sign * Math.min(.35, elapsed * .6));
                halves[i].position.y -= Math.min(.12, elapsed * elapsed * .22);
                halves[i].quaternion.copy(log.quaternion);
                halves[i].rotateZ(sign * Math.min(.22, elapsed * .4));
            }
            if (elapsed >= 1.15) { message = ''; newRound(); }
        } else if (phase === 'recovery' && elapsed >= .4) { phase = 'aiming'; elapsed = 0; }
        group.position.copy(groupAnchor);
        if (impactTime < .2) {
            const envelope = Math.pow(1 - impactTime / .2, 2);
            group.position.addScaledVector(right, Math.cos(impactTime * 105) * impactStrength * envelope);
            group.position.y += Math.sin(impactTime * 85) * impactStrength * .3 * envelope;
        }
        refresh();
    }
    function holdExit(pressed) { exitHeld = pressed; if (!pressed) exitTime = 0; }
    function setVisible(visible) {
        if (!active()) return;
        group.visible = marker.visible = visible; hud.show(visible); holdExit(false);
    }
    hud.setExitHandler(holdExit);
    return { get active() { return active(); }, begin, interact, update, finish, holdExit, setVisible };
}
