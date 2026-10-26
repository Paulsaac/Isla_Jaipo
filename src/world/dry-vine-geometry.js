// Enredadera seca y Corazón del Bosque en estilo Low Poly Pixel Art.
// Estructura orgánica facetada de raíces, tronco retorcido y cáliz de ramas secas
// apoyada sobre la losa, que sostiene el Corazón del Bosque en su posición exacta.

import { createForestHeartSpriteGeometry } from './forest-heart-sprite.js';
import { applyForestHeartCyan } from './forest-heart-color.js';

export function createDryVineGeometry(THREE, broken = false) {
    const parts = [];
    function add(source, material, transform) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        transform?.(geometry);
        if (broken) {
            geometry.computeBoundingBox();
            if (geometry.boundingBox.max.y > 0.29) { geometry.dispose(); return; }
        }
        parts.push({ geometry, material });
    }

    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

    function bar(a, b, r1, r2 = r1, material = 0, radialSegments = 6) {
        const start = Array.isArray(a) ? v3(...a) : a;
        const end = Array.isArray(b) ? v3(...b) : b;
        const direction = end.clone().sub(start);
        const length = direction.length();
        if (length < 0.0001) return;
        const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
        const cyl = new THREE.CylinderGeometry(r2, r1, length, radialSegments);
        add(cyl, material, g => {
            g.applyQuaternion(rotation);
            g.translate(...start.clone().add(end).multiplyScalar(0.5).toArray());
        });
    }

    function thorn(origin, direction, length = 0.06, r = 0.015, material = 1) {
        const start = Array.isArray(origin) ? v3(...origin) : origin;
        const dir = (Array.isArray(direction) ? v3(...direction) : direction).clone().normalize();
        const end = start.clone().addScaledVector(dir, length);
        bar(start, end, r, 0.003, material, 4);
    }

    function knot(x, y, z, r, material = 2) {
        add(new THREE.SphereGeometry(r, 6, 4), material, g => {
            g.scale(1.15, 0.85, 1.05);
            g.translate(x, y, z);
        });
    }

    // --- 1. RAÍCES BAJAS EXTENDIDAS SOBRE LA LOSA (y: 0.01 a 0.08) ---
    // 7 raíces principales que se extienden sobre la piedra
    const rootAngles = [0.15, 0.95, 1.85, 2.75, 3.65, 4.45, 5.35];
    for (let i = 0; i < rootAngles.length; i++) {
        const ang = rootAngles[i];
        const rMax = 0.48 + ((i * 37) % 20) * 0.01; // ~0.48 a 0.68m
        const p0 = [Math.cos(ang) * 0.12, 0.055, Math.sin(ang) * 0.12];
        const ang1 = ang + (i % 2 === 0 ? 0.16 : -0.14);
        const p1 = [Math.cos(ang1) * (rMax * 0.52), 0.038, Math.sin(ang1) * (rMax * 0.52)];
        const ang2 = ang1 + (i % 3 === 0 ? -0.16 : 0.15);
        const p2 = [Math.cos(ang2) * rMax, 0.014, Math.sin(ang2) * rMax];

        bar(p0, p1, 0.055, 0.038, 0, 6);
        bar(p1, p2, 0.038, 0.016, 0, 5);

        // Raicilla lateral
        const pBranch = [
            Math.cos(ang1 + 0.32) * (rMax * 0.72),
            0.012,
            Math.sin(ang1 + 0.32) * (rMax * 0.72)
        ];
        bar(p1, pBranch, 0.024, 0.009, 1, 4);

        // Nódulo en la base de la raíz
        knot(p0[0], p0[1], p0[2], 0.046);
    }

    // Raíces cruzadas bajas que tejen la base sobre la piedra
    for (let i = 0; i < 4; i++) {
        const a1 = i * Math.PI * 0.5 + 0.22;
        const a2 = a1 + Math.PI * 0.44;
        const pa = [Math.cos(a1) * 0.22, 0.028, Math.sin(a1) * 0.22];
        const pb = [Math.cos(a2) * 0.26, 0.032, Math.sin(a2) * 0.26];
        bar(pa, pb, 0.026, 0.020, 1, 5);
    }

    // --- 2. TRONCO RETORCIDO CENTRAL (y: 0.05 a 0.45) ---
    // 4 ramas gruesas trenzadas helicoidalmente
    const trunkHeights = [0.05, 0.14, 0.24, 0.34, 0.44];
    const trunkVines = [];
    for (let v = 0; v < 4; v++) {
        const baseAngle = v * (Math.PI * 0.5) + 0.18;
        const vinePoints = [];
        for (let h = 0; h < trunkHeights.length; h++) {
            const t = h / (trunkHeights.length - 1);
            const twistAngle = baseAngle + t * 1.45 + Math.sin(t * Math.PI) * 0.28;
            const r = 0.14 - Math.sin(t * Math.PI) * 0.025 + (v % 2 === 0 ? 0.02 : -0.015);
            const y = trunkHeights[h];
            vinePoints.push([Math.cos(twistAngle) * r, y, Math.sin(twistAngle) * r]);
        }
        trunkVines.push(vinePoints);
    }

    for (let v = 0; v < trunkVines.length; v++) {
        const pts = trunkVines[v];
        for (let h = 0; h < pts.length - 1; h++) {
            const radStart = 0.052 - h * 0.005;
            const radEnd = 0.047 - h * 0.005;
            bar(pts[h], pts[h + 1], radStart, radEnd, 0, 6);
            if (h === 2) {
                knot(pts[h][0], pts[h][1], pts[h][2], 0.042);
            }
        }
    }

    // Zarcillos finos y espinas en el tronco
    for (let v = 0; v < 4; v++) {
        const ptA = trunkVines[v][1];
        const ptB = trunkVines[(v + 1) % 4][2];
        bar(ptA, ptB, 0.022, 0.018, 1, 5);
        thorn(ptA, [ptA[0], 0.05, ptA[2]], 0.065, 0.014, 1);
        thorn(ptB, [ptB[0] * 1.2, -0.02, ptB[2] * 1.2], 0.055, 0.012, 1);
    }

    // --- 3. CÁLIZ / NIDO DE RAMAS SECAS (y: 0.44 a 0.85) ---
    // 6 ramas altas que se abren en copa, rodeando el corazón y curvándose hacia adentro en las puntas
    const cradleBranches = [
        { angle: 0.25, height: 0.78, radiusOut: 0.26, curlIn: 0.06 },
        { angle: 1.25, height: 0.84, radiusOut: 0.28, curlIn: 0.08 },
        { angle: 2.30, height: 0.76, radiusOut: 0.25, curlIn: 0.07 },
        { angle: 3.35, height: 0.82, radiusOut: 0.27, curlIn: 0.075 },
        { angle: 4.40, height: 0.86, radiusOut: 0.29, curlIn: 0.09 },
        { angle: 5.45, height: 0.74, radiusOut: 0.24, curlIn: 0.065 }
    ];

    const cradleMidPoints = [];
    for (let i = 0; i < cradleBranches.length; i++) {
        const b = cradleBranches[i];
        const pBase = [Math.cos(b.angle) * 0.13, 0.44, Math.sin(b.angle) * 0.13];
        const pMid = [Math.cos(b.angle + 0.1) * b.radiusOut, 0.60, Math.sin(b.angle + 0.1) * b.radiusOut];
        const pRim = [Math.cos(b.angle + 0.18) * (b.radiusOut - b.curlIn), b.height, Math.sin(b.angle + 0.18) * (b.radiusOut - b.curlIn)];

        bar(pBase, pMid, 0.042, 0.028, 0, 6);
        bar(pMid, pRim, 0.028, 0.016, 0, 5);

        // Punta seca afilada curvada
        const pTip = [
            Math.cos(b.angle + 0.25) * (b.radiusOut - b.curlIn * 1.55),
            b.height - 0.04,
            Math.sin(b.angle + 0.25) * (b.radiusOut - b.curlIn * 1.55)
        ];
        bar(pRim, pTip, 0.016, 0.005, 1, 4);

        cradleMidPoints.push(pMid);

        // Espinas en las ramas del cáliz
        thorn(pMid, [Math.cos(b.angle) * 0.8, 0.35, Math.sin(b.angle) * 0.8], 0.07, 0.013, 1);
        thorn(pRim, [-Math.sin(b.angle), 0.2, Math.cos(b.angle)], 0.05, 0.011, 1);
    }

    // Aros y ramas transversales que tejen el fondo y el borde del nido
    for (let i = 0; i < cradleMidPoints.length; i++) {
        const next = (i + 1) % cradleMidPoints.length;
        bar(cradleMidPoints[i], cradleMidPoints[next], 0.024, 0.024, 1, 5);

        // Soporte interior del fondo del cáliz (lecho del corazón)
        const pCenterSupport = [
            Math.cos(cradleBranches[i].angle) * 0.07,
            0.46,
            Math.sin(cradleBranches[i].angle) * 0.07
        ];
        bar(cradleMidPoints[i], pCenterSupport, 0.022, 0.018, 0, 5);
        knot(pCenterSupport[0], pCenterSupport[1], pCenterSupport[2], 0.032);
    }

    // Zarcillos secos envolviendo el exterior del cáliz
    for (let i = 0; i < 3; i++) {
        const aStart = i * 2.1 + 0.5;
        const aEnd = aStart + 1.6;
        const p1 = [Math.cos(aStart) * 0.21, 0.52, Math.sin(aStart) * 0.21];
        const p2 = [Math.cos((aStart + aEnd) * 0.5) * 0.27, 0.65, Math.sin((aStart + aEnd) * 0.5) * 0.27];
        const p3 = [Math.cos(aEnd) * 0.20, 0.72, Math.sin(aEnd) * 0.20];
        bar(p1, p2, 0.018, 0.015, 1, 4);
        bar(p2, p3, 0.015, 0.009, 1, 4);
    }

    const merged = mergeParts(THREE, parts, 3);
    // Asegurar que la base descansa perfectamente en y = 0
    merged.computeBoundingBox();
    merged.translate(0, -merged.boundingBox.min.y, 0);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    return merged;
}

export function createForestHeartGeometry(THREE) {
    const parts = [];
    function add(source, material, transform) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        transform?.(geometry);
        parts.push({ geometry, material });
    }

    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

    function bar(a, b, r1, r2 = r1, material = 1, radialSegments = 5) {
        const start = Array.isArray(a) ? v3(...a) : a;
        const end = Array.isArray(b) ? v3(...b) : b;
        const direction = end.clone().sub(start);
        const length = direction.length();
        if (length < 0.0001) return;
        const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
        const cyl = new THREE.CylinderGeometry(r2, r1, length, radialSegments);
        add(cyl, material, g => {
            g.applyQuaternion(rotation);
            g.translate(...start.clone().add(end).multiplyScalar(0.5).toArray());
        });
    }

    // Materiales:
    // 0: Carne del corazón / músculo rojo rubí (0x9e2a2b)
    // 1: Venas cristalinas celestes / turquesa (0x5bc2cc)
    // 2: Grandes vasos / aorta rojo oscuro (0x5e1a1e)
    // 3: Nódulos cristalinos luminosos / destello (0xa4e9ee)

    // --- 1. CUERPO DE LOS VENTRÍCULOS (cono y lóbulos facetados) ---
    // Punta inferior (apex) apuntando ligeramente abajo a la izquierda (-X, +Z)
    // Cono cónico facetado inferior
    const apexGeo = new THREE.ConeGeometry(0.095, 0.17, 7);
    add(apexGeo, 0, g => {
        g.rotateX(Math.PI); // Punta hacia abajo
        g.rotateZ(0.22); // Inclinación anatómica izquierda
        g.rotateY(0.15);
        g.scale(0.85, 1.0, 0.95);
        g.translate(-0.022, -0.065, 0.012);
    });

    // Zona media de los ventrículos (cilindro facetado de 8 lados)
    const midGeo = new THREE.CylinderGeometry(0.12, 0.095, 0.12, 8);
    add(midGeo, 0, g => {
        g.rotateZ(0.12);
        g.scale(0.92, 1.0, 0.96);
        g.translate(-0.012, 0.035, 0.008);
    });

    // --- 2. AURÍCULAS SUPERIORES (Lóbulos derecho e izquierdo) ---
    // Aurícula derecha (lado -X, facetada)
    const rightAtrium = new THREE.SphereGeometry(0.062, 6, 5);
    add(rightAtrium, 0, g => {
        g.scale(1.15, 0.90, 0.95);
        g.translate(-0.068, 0.095, -0.005);
    });

    // Aurícula izquierda (lado +X, facetada)
    const leftAtrium = new THREE.SphereGeometry(0.058, 6, 5);
    add(leftAtrium, 0, g => {
        g.scale(1.05, 0.92, 0.95);
        g.translate(0.058, 0.098, -0.012);
    });

    // --- 3. GRANDES VASOS (Aorta, tronco pulmonar, vena cava) ---
    // Aorta ascendente (tubo rojo oscuro)
    const aortaStem = new THREE.CylinderGeometry(0.036, 0.040, 0.08, 6);
    add(aortaStem, 2, g => {
        g.rotateZ(-0.15);
        g.translate(0.005, 0.145, 0.005);
    });

    // Arco aórtico curvado hacia atrás
    const aortaArch = new THREE.CylinderGeometry(0.034, 0.036, 0.065, 6);
    add(aortaArch, 2, g => {
        g.rotateX(0.75);
        g.rotateZ(-0.25);
        g.translate(0.018, 0.180, 0.028);
    });

    // 3 muñones arteriales que brotan del arco aórtico (braquiocefálico, carótida, subclavia)
    const vesselA = new THREE.CylinderGeometry(0.012, 0.014, 0.035, 5);
    add(vesselA, 2, g => g.translate(-0.022, 0.205, 0.005));

    const vesselB = new THREE.CylinderGeometry(0.011, 0.013, 0.038, 5);
    add(vesselB, 2, g => g.translate(0.008, 0.215, 0.022));

    const vesselC = new THREE.CylinderGeometry(0.010, 0.012, 0.032, 5);
    add(vesselC, 2, g => g.translate(0.035, 0.198, 0.040));

    // Tronco de la arteria pulmonar que cruza por delante de la aorta
    const pulmonaryTrunk = new THREE.CylinderGeometry(0.030, 0.032, 0.07, 6);
    add(pulmonaryTrunk, 2, g => {
        g.rotateZ(0.45);
        g.rotateX(-0.35);
        g.translate(-0.032, 0.125, 0.042);
    });

    // Vena cava superior (vaso vertical derecho posterior)
    const venaCava = new THREE.CylinderGeometry(0.022, 0.024, 0.065, 6);
    add(venaCava, 2, g => g.translate(-0.075, 0.150, -0.028));

    // --- 4. VENAS CRISTALINAS TURQUESA / CELESTE (Estilo corazon.png) ---
    // Surco interventricular anterior: prominente vena turquesa que desciende hacia el ápice
    const sulcusPoints = [
        [0.008, 0.095, 0.092],
        [-0.005, 0.055, 0.098],
        [-0.016, 0.010, 0.088],
        [-0.024, -0.042, 0.068],
        [-0.028, -0.095, 0.042],
        [-0.025, -0.138, 0.018]
    ];
    for (let i = 0; i < sulcusPoints.length - 1; i++) {
        bar(sulcusPoints[i], sulcusPoints[i + 1], 0.014 - i * 0.0015, 0.012 - i * 0.0015, 1, 5);
    }

    // Ramas cristalinas laterales sobre el ventrículo izquierdo
    const leftBranchA = [
        [-0.008, 0.045, 0.095],
        [0.038, 0.032, 0.075],
        [0.072, 0.015, 0.042]
    ];
    bar(leftBranchA[0], leftBranchA[1], 0.011, 0.008, 1, 4);
    bar(leftBranchA[1], leftBranchA[2], 0.008, 0.005, 1, 4);

    const leftBranchB = [
        [-0.020, -0.015, 0.080],
        [0.025, -0.032, 0.058],
        [0.052, -0.048, 0.028]
    ];
    bar(leftBranchB[0], leftBranchB[1], 0.009, 0.006, 1, 4);
    bar(leftBranchB[1], leftBranchB[2], 0.006, 0.004, 1, 4);

    // Ramas cristalinas laterales sobre el ventrículo derecho
    const rightBranchA = [
        [-0.012, 0.050, 0.095],
        [-0.048, 0.035, 0.068],
        [-0.075, 0.018, 0.032]
    ];
    bar(rightBranchA[0], rightBranchA[1], 0.010, 0.007, 1, 4);
    bar(rightBranchA[1], rightBranchA[2], 0.007, 0.004, 1, 4);

    const rightBranchB = [
        [-0.026, -0.055, 0.062],
        [-0.050, -0.068, 0.038]
    ];
    bar(rightBranchB[0], rightBranchB[1], 0.008, 0.005, 1, 4);

    // Vena del surco coronario (anillo horizontal entre aurículas y ventrículos)
    const ringPoints = [
        [-0.075, 0.075, 0.010],
        [-0.045, 0.082, 0.065],
        [0.010, 0.088, 0.078],
        [0.062, 0.080, 0.045],
        [0.078, 0.072, -0.010],
        [0.045, 0.068, -0.055],
        [-0.025, 0.065, -0.062],
        [-0.065, 0.070, -0.035]
    ];
    for (let i = 0; i < ringPoints.length; i++) {
        const next = (i + 1) % ringPoints.length;
        bar(ringPoints[i], ringPoints[next], 0.009, 0.009, 1, 4);
    }

    // --- 5. NÓDULOS CRISTALINOS RESPLANDECIENTES (Puntos de luz mágica) ---
    const crystalNodes = [
        [-0.008, 0.058, 0.105, 0.018],
        [-0.022, 0.012, 0.095, 0.016],
        [-0.026, -0.085, 0.048, 0.015],
        [-0.024, -0.142, 0.022, 0.014],
        [0.035, 0.034, 0.082, 0.013],
        [-0.048, 0.038, 0.075, 0.013]
    ];
    for (const [cx, cy, cz, cr] of crystalNodes) {
        add(new THREE.ConeGeometry(cr, cr * 2.2, 4), 3, g => {
            g.translate(cx, cy, cz);
        });
    }

    const merged = mergeParts(THREE, parts, 4);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    return merged;
}

function mergeParts(THREE, parts, numMaterials) {
    const result = new THREE.BufferGeometry();
    parts.sort((a, b) => a.material - b.material);
    for (const name of ['position', 'normal', 'uv']) {
        const values = new Float32Array(parts.reduce((sum, p) => sum + p.geometry.attributes[name].array.length, 0));
        let offset = 0;
        for (const { geometry } of parts) {
            values.set(geometry.attributes[name].array, offset);
            offset += geometry.attributes[name].array.length;
        }
        result.setAttribute(name, new THREE.BufferAttribute(values, parts[0].geometry.attributes[name].itemSize));
    }
    let start = 0;
    for (let m = 0; m < numMaterials; m++) {
        const count = parts.filter(p => p.material === m).reduce((sum, p) => sum + p.geometry.attributes.position.count, 0);
        if (count > 0) {
            result.addGroup(start, count, m);
            start += count;
        }
    }
    for (const { geometry } of parts) geometry.dispose();
    result.computeVertexNormals();
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
}

// Crea la entidad completa interactiva del santuario de la enredadera seca y el corazón.
export function createDryVineShrine(THREE, maderaTex, heartImage) {
    const vineGeo = createDryVineGeometry(THREE);
    const vineMaterials = [
        new THREE.MeshPhongMaterial({ map: maderaTex, color: 0x4a3220, shininess: 0, flatShading: true }),
        new THREE.MeshPhongMaterial({ color: 0x5d422a, shininess: 0, flatShading: true }),
        new THREE.MeshPhongMaterial({ color: 0x2c190c, shininess: 0, flatShading: true })
    ];
    const vineMesh = new THREE.Mesh(vineGeo, vineMaterials);
    const brokenBase = new THREE.Mesh(createDryVineGeometry(THREE, true), vineMaterials);
    brokenBase.name = 'forest-heart-broken-vine-base';

    const heartGeo = createForestHeartSpriteGeometry(THREE, heartImage);
    heartGeo.rotateX(-Math.PI/5);
    const cyanStrength={value:.8};
    const heartMaterials = applyForestHeartCyan(new THREE.MeshPhongMaterial({vertexColors:true,
        shininess:0,flatShading:true}),cyanStrength);
    const heartMesh = new THREE.Mesh(heartGeo, heartMaterials);
    heartMesh.name = 'forest-heart-relic';
    // El corazón reposa en el cáliz a 0.52m de la base de la enredadera
    heartMesh.position.set(0, 0.52, 0);

    // Luz mística tenue que irradia el corazón
    const heartLight = new THREE.PointLight(0x35dfff, 0.85, 4.5, 2);
    heartLight.position.set(0, 0.52, 0);

    heartMesh.add(heartLight);
    vineMesh.add(heartMesh);
    let pullStrength = 0, pulseLight = 0.85;
    function updateGlow() {
        heartLight.intensity = pulseLight + pullStrength * 2.2;
    }

    vineMesh.userData = {
        type: 'CHEST',
        kind: 'DRY_VINE',
        item: 'forest-heart',
        visibilityEnabled: true,
        heartMesh,
        brokenBase,
        heartLight,
        setPullStrength: (strength) => {
            pullStrength = THREE.MathUtils.clamp(strength, 0, 1);
            updateGlow();
        },
        collectHeart: () => {
            pullStrength = 0;
            heartMesh.userData.visibilityEnabled = false;
            heartMesh.visible = false;
            heartMesh.scale.set(0, 0, 0);
            heartLight.intensity = 0;
            heartLight.visible = true; // Mantener estable la cantidad de luces al recoger.
            vineMesh.remove(heartMesh);
        },
        updatePulse: (time) => {
            if (!heartMesh.visible || !heartMesh.parent) return;
            const pulse = 1.0 + Math.sin(time * 2.8) * 0.04;
            heartMesh.scale.set(pulse, pulse, pulse);
            cyanStrength.value=.72+.23*(.5-.5*Math.cos(time*1.6));
            pulseLight = 0.75 + Math.sin(time * 2.8) * 0.25;
            updateGlow();
        }
    };
    heartMesh.userData = {
        type: 'CHEST',
        kind: 'DRY_VINE',
        item: 'forest-heart',
        visibilityEnabled: true,
        vineMesh,
        collectHeart: vineMesh.userData.collectHeart
    };

    return vineMesh;
}
