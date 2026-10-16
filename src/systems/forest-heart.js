// Progreso solo de la sesión. Sin base de datos ni almacenamiento persistente.
export function createForestHeartQuest() {
    let stage = 'searching';
    let bridgeKeyReceived = false;
    let mapChestUnlocked = false;
    return {
        get stage() { return stage; },
        get hasHeart() { return stage === 'carrying'; },
        get hasBridgeKey() { return bridgeKeyReceived; },
        get canOpenMapChest() { return mapChestUnlocked; },
        unlockMapChest() { if (mapChestUnlocked) return false; mapChestUnlocked = true; return true; },
        receiveBridgeKey(available) {
            if (!available || stage !== 'delivered' || bridgeKeyReceived) return false;
            bridgeKeyReceived = true;
            return true;
        },
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
