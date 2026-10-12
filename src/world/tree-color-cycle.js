export const TREE_COLOR_CYCLES = 8;

// La celda determina el ciclo: permanece estable al compactar instancias visibles.
export function getTreeColorCycle(x, z, unitSize) {
    const index = Math.round(x / unitSize) + Math.round(z / unitSize);
    return ((index % TREE_COLOR_CYCLES) + TREE_COLOR_CYCLES) % TREE_COLOR_CYCLES;
}

export function getTreeColorAngle(time, cycle, treble = 0) {
    return time * (0.22 + cycle * 0.027) + cycle * Math.PI / 4 + 1.8 + treble * 0.45
        + Math.sin(time * (0.07 + cycle * 0.01)) * 0.2;
}

// Misma función para los dibujos de árboles en GPU y sus luces de entorno.
export const TREE_COLOR_ANGLE_GLSL = `
    float heartTreeColorAngle(float time, float cycle, float treble) {
        return time * (0.22 + cycle * 0.027) + cycle * 0.7853981634 + 1.8 + treble * 0.45
            + sin(time * (0.07 + cycle * 0.01)) * 0.2;
    }
`;
