const WOOD = new Set(['INDOOR_FLOOR', 'WOOD', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'POI']);
export function createWoodFloorMap(floorMap, roofMap, width, height, externalTorchMap) {
    return Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => {
        const type = floorMap[z][x];
        if (externalTorchMap?.[z]?.[x] || roofMap[z][x] === 'EXTERNAL_TORCH') return false;
        if (type === 'CHEST') {
            return roofMap[z][x] === 'ROOF' || [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dz]) =>
                ['INDOOR_FLOOR', 'WOOD'].includes(floorMap[z+dz]?.[x+dx]));
        }
        if (WOOD.has(type)) return true;
        if (type !== 'TORCH' && type !== 'OTHER2') return false;
        if (roofMap[z][x] === 'ROOF') return true;
        for (let r = Math.max(0, z - 1); r <= Math.min(height - 1, z + 1); r++) {
            for (let c = Math.max(0, x - 1); c <= Math.min(width - 1, x + 1); c++) {
                if (WOOD.has(floorMap[r][c])) return true;
            }
        }
        return false;
    }));
}
