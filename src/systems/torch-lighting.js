// Luces reutilizadas: todas las antorchas tienen sprite; solo las cercanas requieren luz GPU.
export function createTorchLighting(THREE, scene, torches, maximum = 12) {
    const lights = Array.from({ length: Math.min(maximum, torches.length) }, () => {
        const light = new THREE.PointLight(0xffa500, 0, 19.2, 2);
        scene.add(light);
        return light;
    });
    const slots = lights.map(light => ({ light, torch: null, strength: 0 }));
    const selected = new Set(), assigned = new Set(), candidates = [];
    const entries = torches.map(torch => ({ torch, score: 0 }));
    let nextSelection = 0;
    let previousTime = null;
    function update(position, time, daylight = 0) {
        const nightStrength = 1 - Math.max(0, Math.min(1, daylight));
        const delta = previousTime === null ? 0 : Math.max(0, Math.min(time - previousTime, 0.1));
        previousTime = time;
        if (time >= nextSelection) {
            assigned.clear();
            for (const slot of slots) assigned.add(slot.torch);
            candidates.length = 0;
            for (const entry of entries) {
                const torch = entry.torch;
                const distance = (torch.x - position.x) ** 2 + (torch.y - position.y) ** 2 + (torch.z - position.z) ** 2;
                if (distance >= 44 ** 2 || (!torch.isIndoor && nightStrength === 0)) continue;
                entry.score = distance * (assigned.has(torch) ? 0.9 : 1);
                candidates.push(entry);
            }
            candidates.sort((a, b) => a.score - b.score);
            selected.clear();
            for (let index = 0; index < Math.min(lights.length, candidates.length); index++) selected.add(candidates[index].torch);
            nextSelection = time + 0.2;
        }
        // Conservar cada luz en su antorcha hasta completar el desvanecimiento.
        for (const torch of selected) {
            if (slots.some(slot => slot.torch === torch)) continue;
            const free = slots.find(slot => !slot.torch);
            if (free) {
                free.torch = torch;
                free.light.position.set(torch.x, torch.y, torch.z);
                free.light.color.setHex(torch.isBlue ? 0x00a2e8 : 0xffa500);
                free.light.distance = torch.isIndoor ? 24 : 19.2;
            }
        }
        slots.forEach(slot => {
            const { light, torch } = slot;
            if (!torch) { light.intensity = 0; return; }
            const distance = Math.hypot(torch.x - position.x, torch.y - position.y, torch.z - position.z);
            const t = Math.max(0, Math.min(1, (44 - distance) / 24));
            const target = selected.has(torch) ? (torch.isIndoor ? 1 : t * t * (3 - 2 * t)) : 0;
            slot.strength += (target - slot.strength) * (1 - Math.exp(-delta / (torch.isIndoor ? 0.35 : 0.85)));
            if (!selected.has(torch) && slot.strength < 0.001) {
                slot.torch = null;
                slot.strength = 0;
                light.intensity = 0;
                return;
            }
            light.intensity = (12 + Math.sin(time * 17 + torch.x + torch.z) * 1.2) * 1.2 * (torch.isIndoor ? 3 : nightStrength) * slot.strength;
        });
    }
    function illuminationAt(position) {
        let sum = 0;
        for (const light of lights) {
            const distanceSquared = (light.position.x - position.x) ** 2 + (light.position.y - position.y) ** 2 + (light.position.z - position.z) ** 2;
            if (distanceSquared < light.distance ** 2) sum += light.intensity / (1 + distanceSquared);
        }
        return sum;
    }
    return { update, illuminationAt };
}
