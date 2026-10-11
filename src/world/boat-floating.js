// Oleaje pequeño y continuo, sin desplazar el casco sobre el plano de navegación.
export function updateBoatFloating(boat, time, waterline) {
    const phase = boat.userData.floatPhase;
    boat.position.y = waterline + Math.sin(time * 1.4 + phase) * 0.025
        + Math.sin(time * 2.1 + phase * 0.7) * 0.008;
    boat.rotation.x = Math.sin(time * 1.15 + phase + 0.8) * 0.016;
    boat.rotation.z = Math.sin(time * 1.45 + phase) * 0.028;
}
