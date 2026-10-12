export const TREE_MOTION_VARIANTS = 4;

// Selector independiente de los ocho ciclos cromáticos; las dos caras comparten celda.
export function getTreeMotionVariant(x, z, unitSize) {
    const index = Math.round(x / unitSize) + 2 * Math.round(z / unitSize);
    return ((index % TREE_MOTION_VARIANTS) + TREE_MOTION_VARIANTS) % TREE_MOTION_VARIANTS;
}

export const TREE_MOTION_GLSL = `
    vec3 heartTreeMovement(vec3 position, vec2 origin, float weight,
        float variant, float time, float phase, float bass) {
        vec3 motion = vec3(0.0);
        float anchored = weight * weight;
        if (variant < 0.5) {
            // Balanceo lateral lento y amplio.
            float bend = sin(time * 0.68 + phase) * (0.34 + bass * 0.14);
            motion.xz = vec2(bend, bend * 0.18) * anchored;
        } else if (variant < 1.5) {
            // Copa que describe una órbita elíptica.
            float angle = time * 0.54 + phase;
            motion.xz = vec2(sin(angle), cos(angle) * 0.7) * (0.28 + bass * 0.12) * anchored;
        } else if (variant < 2.5) {
            // Ondulación que recorre el tronco hacia la copa.
            float wave = sin(weight * 5.0 - time * 0.82 + phase);
            motion.xz = vec2(wave, sin(weight * 3.0 + time * 0.47 + phase) * 0.3)
                * (0.30 + bass * 0.10) * anchored;
        } else {
            // Torsión suave con una respiración vertical pequeña.
            float angle = sin(time * 0.46 + phase) * (0.08 + bass * 0.035) * anchored;
            vec2 relative = position.xz - origin;
            motion.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * relative - relative;
            motion.y = sin(time * 0.63 + phase) * 0.06 * anchored;
        }
        return motion;
    }
`;
