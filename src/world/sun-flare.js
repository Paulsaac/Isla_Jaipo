import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

// Textura procedural: no descarga imágenes ni modifica los sprites originales.
export function createSunFlare(sun, camera, renderer) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, 'rgba(255,255,255,0.8)');
    glow.addColorStop(0.12, 'rgba(255,255,255,0.45)');
    glow.addColorStop(0.4, 'rgba(255,255,255,0.12)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    const flare = new Lensflare();
    const makeReflectionTexture = ring => {
        const image = document.createElement('canvas');
        image.width = image.height = 256;
        const context = image.getContext('2d');
        const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
        if (ring) {
            gradient.addColorStop(0, 'rgba(255,255,255,0)');
            gradient.addColorStop(0.65, 'rgba(255,255,255,0)');
            gradient.addColorStop(0.78, 'rgba(255,255,255,0.08)');
            gradient.addColorStop(0.85, 'rgba(255,255,255,0.38)');
            gradient.addColorStop(0.92, 'rgba(255,255,255,0.08)');
        } else {
            gradient.addColorStop(0, 'rgba(255,255,255,0.24)');
            gradient.addColorStop(0.65, 'rgba(255,255,255,0.18)');
            gradient.addColorStop(0.82, 'rgba(255,255,255,0.28)');
            gradient.addColorStop(0.92, 'rgba(255,255,255,0.08)');
        }
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
        return new THREE.CanvasTexture(image);
    };
    const disc = makeReflectionTexture(false);
    const ring = makeReflectionTexture(true);
    // Círculos y aros superpuestos, inspirados en la referencia fotográfica.
    const specs = [[texture, 240, 0, 0xffe5b0],
        [disc, 32, 0.28, 0xffdf72], [ring, 54, 0.28, 0xffc47d],
        [disc, 72, 0.55, 0x99df9d], [ring, 94, 0.55, 0x88d9ef],
        [disc, 132, 0.92, 0x7ebcff], [ring, 164, 0.92, 0xa58adf],
        [ring, 176, 0.92, 0xe8ba79]];
    const elements = specs.map(([map, size, distance, color]) => {
        const element = new LensflareElement(map, size, distance, new THREE.Color(color));
        flare.addElement(element);
        return { element, size, color: element.color.clone() };
    });
    const sunPosition = new THREE.Vector3();
    const eyePosition = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3();
    let strength = 0;
    let lastUpdate = performance.now();
    return {
        object: flare,
        update() {
            const now = performance.now();
            const delta = Math.min((now - lastUpdate) / 1000, 0.1);
            lastUpdate = now;
            sun.getWorldPosition(sunPosition);
            camera.getWorldPosition(eyePosition);
            camera.getWorldDirection(forward);
            direction.subVectors(sunPosition, eyePosition).normalize();
            const alignment = THREE.MathUtils.smoothstep(forward.dot(direction), 0.94, 0.998);
            const target = sun.visible ? alignment * sun.material.opacity * 0.325 : 0;
            strength += (target - strength) * (1 - Math.exp(-delta * 8));
            flare.position.copy(sunPosition);
            flare.visible = strength > 0.001;
            for (const { element, size, color } of elements) {
                element.color.copy(color).multiplyScalar(strength);
                element.size = size * renderer.getPixelRatio();
            }
        }
    };
}
