// Reserva de una inmersión: quitar/equipar el casco bajo el agua no la reinicia.
export function createDivingAir(maximum) {
    let remaining = maximum;
    const baseMaximum = maximum;
    return {
        get remaining() { return remaining; },
        get maximum() { return maximum; },
        reset() { maximum = baseMaximum; remaining = maximum; },
        replenish(seconds) {
            maximum = Math.max(baseMaximum, seconds);
            remaining = maximum;
        },
        update(delta, consuming, breathable) {
            if (consuming) remaining = Math.max(0, remaining - delta);
            else if (breathable) remaining = Math.min(maximum, remaining + delta * maximum / 4);
            if (remaining < 0.000001) remaining = 0;
            return remaining;
        }
    };
}
