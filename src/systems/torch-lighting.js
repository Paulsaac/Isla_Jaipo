// Luces reutilizadas: todas las antorchas tienen sprite; solo las cercanas requieren luz GPU.
export function createTorchLighting(THREE, scene, torches, maximum = 12) {
    const lights = Array.from({ length: Math.min(maximum, torches.length) }, () => {
        const light = new THREE.PointLight(0xffa500, 0, 19.2, 2);
        scene.add(light);
        return light;
    });
    const slots = lights.map(light => ({ light, torch: null, strength: 0 }));
    let selected = new Set();
    let nextSelection = 0;
    let previousTime = null;
    function update(position, time) {
        const delta = previousTime === null ? 0 : Math.max(0, Math.min(time - previousTime, 0.1));
        previousTime = time;
        if (time >= nextSelection) {
            const assigned = new Set(slots.map(slot => slot.torch));
            selected = new Set(torches.map(torch => ({ torch, distance: (torch.x - position.x) ** 2 + (torch.y - position.y) ** 2 + (torch.z - position.z) ** 2 }))
                .filter(entry => entry.distance < 44 ** 2)
                .sort((a, b) => a.distance * (assigned.has(a.torch) ? 0.9 : 1) - b.distance * (assigned.has(b.torch) ? 0.9 : 1))
                .slice(0, lights.length).map(entry => entry.torch));
            nextSelection = time + 0.2;
        }
        // Conservar cada luz en su antorcha hasta completar el desvanecimiento.
        for (const torch of selected) {
            if (slots.some(slot => slot.torch === torch)) continue;
            const free = slots.find(slot => !slot.torch);
            if (free) free.torch = torch;
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
            light.position.set(torch.x, torch.y, torch.z);
            light.color.setHex(torch.isBlue ? 0x00a2e8 : 0xffa500);
            light.distance = torch.isIndoor ? 24 : 19.2;
            light.intensity = (12 + Math.sin(time * 17 + torch.x + torch.z) * 1.2) * 1.2 * (torch.isIndoor ? 3 : 1) * slot.strength;
        });
    }
    function illuminationAt(position) {
        return lights.reduce((sum, light) => {
            const distance = light.position.distanceTo(position);
            return sum + (distance < light.distance ? light.intensity / (1 + distance * distance) : 0);
        }, 0);
    }
    return { update, illuminationAt };
}
