// Cuatro luces reutilizadas: brillo local sin crear una luz por cada árbol.
import { getTreeColorCycle, getTreeColorAngle } from './tree-color-cycle.js';
import { TREE_SPRITE_HEIGHT } from '../config.js';
import { getForestLightPulse, getForestLightSeed } from './forest-light-pulse.js';
export function createHeartHalos(THREE, scene, floorMap, unitSize, sampleHeight) {
    const slots = Array.from({length: 4}, () => {
        const light = new THREE.PointLight(0xffffff, 0, 18, 2);
        // Mantener el número de luces evita compilar shaders al comenzar el evento.
        light.visible = true;
        scene.add(light);
        return { light, target: null, strength: 0 };
    });
    let refresh = 0;
    function update(delta, position, uniforms) {
        const amount = uniforms.heartTreeGlow.value * 1.25;
        const time = uniforms.heartColorTime.value;
        refresh -= delta;
        if (amount > 0.001 && refresh <= 0) {
            refresh = 0.4;
            const x = Math.floor((position.x + unitSize / 2) / unitSize);
            const z = Math.floor((position.z + unitSize / 2) / unitSize);
            const candidates = [];
            for (let dz = -7; dz <= 7; dz++) for (let dx = -7; dx <= 7; dx++) {
                const type = floorMap[z + dz]?.[x + dx];
                if (type !== 'TREE') continue;
                const px = (x + dx) * unitSize, pz = (z + dz) * unitSize;
                const distance = Math.hypot(px - position.x, pz - position.z);
                if (distance > 14) continue;
                candidates.push({x: px, z: pz, distance, type, key: `${x + dx},${z + dz}`});
            }
            candidates.sort((a, b) => a.distance - b.distance);
            const targets = candidates.slice(0, slots.length);
            // Mantener las luces existentes en sus árboles mientras sigan cerca.
            for (const slot of slots) {
                const index = targets.findIndex(target => target.key === slot.target?.key);
                if (index >= 0) targets.splice(index, 1);
                else slot.target = null;
            }
            for (const slot of slots) if (!slot.target) slot.target = targets.shift() ?? null;
        }
        for (const slot of slots) {
            const target = slot.target;
            slot.strength += ((target ? 1 : 0) - slot.strength) * (1 - Math.exp(-delta * 4));
            const lightAmount = slot.strength * amount;
            slot.light.intensity = 0;
            if (lightAmount <= 0.001 || !target) continue;
            const y = sampleHeight(target.x, target.z);
            // Luz ambiental de apoyo fija; el degradado depende de los ojos, no la posición.
            const height = 4.8;
            slot.light.position.set(target.x, y + height, target.z);
            const focusHeight = Math.max(0.65, Math.min(TREE_SPRITE_HEIGHT - 0.5, position.y - y));
            const gradient = 0.04 + 0.96 * Math.exp(-Math.abs(height - focusHeight) / 1.68);
            const spacing=(TREE_SPRITE_HEIGHT-1.15)/7;
            const pulseDistance=Math.max(0,Math.abs(0.65+spacing*3-focusHeight)-spacing/2);
            const seed=getForestLightSeed(target.x,target.z,3,unitSize);
            const pulse=getForestLightPulse(uniforms.skyPsychTime.value,seed,pulseDistance);
            slot.light.intensity = lightAmount * 14 * gradient * pulse;
            const cycle = getTreeColorCycle(target.x, target.z, unitSize);
            const angle = getTreeColorAngle(time, cycle, uniforms.heartTreble.value);
            slot.light.color.setHSL((angle / (Math.PI * 2)) % 1, 1.0, 0.4);
        }
    }
    return {update,seek(position,uniforms){refresh=0;update(10,position,uniforms);}};
}
