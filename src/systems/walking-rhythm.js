// Variaciones correlacionadas inspiradas en el ejemplo de marcha: sumas a varias escalas,
// sin FFT, archivos de audio ni dependencias. Conserva la cadencia media del juego.
export function createWalkingRhythm(random = Math.random) {
    function correlatedNoise() {
        const bands = Array.from({ length: 6 }, () => random() * 2 - 1);
        let step = 0;
        return () => {
            step++;
            let sum = 0;
            for (let i = 0; i < bands.length; i++) {
                if (step % (2 ** i) === 0) bands[i] = random() * 2 - 1;
                sum += bands[i];
            }
            return sum / bands.length;
        };
    }
    const timingNoise = correlatedNoise(), volumeNoise = correlatedNoise();
    let volumeDrift = 0;
    return {
        next(running) {
            volumeDrift += (volumeNoise() - volumeDrift) * 0.35;
            return {
                // ±8% de intervalo al caminar; carrera más regular, hasta ±3%.
                cadence: 1 / (1 + timingNoise() * (running ? 0.03 : 0.08)),
                variation: 1 + volumeDrift * 0.9
            };
        }
    };
}
