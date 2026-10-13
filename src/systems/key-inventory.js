// Cada llave conserva su identidad; las que no tienen destino configurado no abren cerraduras.
export function createKeyInventory(bindings) {
    const owned = [];
    let selectedId = null;
    function selected() { return owned.find(key => key.id === selectedId) ?? null; }
    return {
        get count() { return owned.length; },
        get selected() { return selected(); },
        add(id) {
            if (owned.some(key => key.id === id)) return false;
            const binding = bindings.find(key => key.id === id);
            const key = binding ?? { id, name: 'Llave encontrada', doors: [] };
            if (binding) owned.unshift(key); else owned.push(key);
            return true;
        },
        clearSelection() { selectedId = null; },
        selectNext() {
            const index = owned.findIndex(key => key.id === selectedId) + 1;
            selectedId = owned[index]?.id ?? null;
            return selected();
        },
        canUnlock(x, z) { return !!selected()?.doors.some(door => door.x === x && door.z === z); },
        useOn(x, z) {
            if (!this.canUnlock(x, z)) return false;
            owned.splice(owned.findIndex(key => key.id === selectedId), 1);
            selectedId = null;
            return true;
        }
    };
}
