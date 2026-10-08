// Progreso solo de la sesión. Sin base de datos ni almacenamiento persistente.
export function createForestHeartQuest() {
    let stage = 'searching';
    return {
        get stage() { return stage; },
        get hasHeart() { return stage === 'carrying'; },
        collect() {
            if (stage !== 'searching') return false;
            stage = 'carrying';
            return true;
        },
        deliver() {
            if (stage !== 'carrying') return false;
            stage = 'delivered';
            return true;
        }
    };
}
