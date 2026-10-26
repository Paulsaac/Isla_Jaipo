// Reserva de una inmersión: quitar/equipar el casco bajo el agua no la reinicia.
export function createDivingAir(maximum) {
    let remaining = maximum;
    const baseMaximum = maximum;
    let availableMaximum = maximum;
    return {
        get remaining() { return remaining; },
        get maximum() { return maximum; },
        reset() { availableMaximum = maximum = baseMaximum; remaining = maximum; },
        replenish(seconds) {
            availableMaximum = maximum = Math.max(baseMaximum, seconds);
            remaining = maximum;
        },
        update(delta, consuming, breathable, limit = Infinity) {
            // El aumento de los fragmentos se conserva para el mar; el río limita
            // la reserva real sin devolver aire gratis al cambiar de zona.
            maximum = Math.min(availableMaximum, limit);
            remaining = Math.min(remaining, maximum);
            if (consuming) remaining = Math.max(0, remaining - delta);
            else if (breathable) remaining = Math.min(maximum, remaining + delta * maximum / 4);
            if (remaining < 0.000001) remaining = 0;
            return remaining;
        }
    };
}
