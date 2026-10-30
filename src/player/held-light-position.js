// El modelo en primera persona puede sobresalir de la cápsula del jugador.
// Su luz queda cerca de los ojos para no atravesar jambas, muros o dinteles
// antes que el jugador y cambiar de recinto mientras éste sigue en el vano.
export function keepHeldLightNearPlayer(light) {
    light.position.clampLength(0, 0.18);
}
