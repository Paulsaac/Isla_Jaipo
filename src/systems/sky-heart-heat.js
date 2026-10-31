// Tiempo continuo en mano y enfriamiento en segundos de partida, sin persistencia.
export function createSkyHeartHeat() {
    let holding=false,heldSeconds=0,cooldown=0,cooled=false;
    return {
        tryHold(){
            if(cooled)return true;
            if(cooldown>0)return false;
            if(!holding){holding=true;heldSeconds=0;}
            return true;
        },
        release(){holding=false;heldSeconds=0;},
        quench(){
            if(cooled)return false;
            cooled=true;holding=false;heldSeconds=0;cooldown=0;return true;
        },
        update(delta){
            const elapsed=Math.max(0,delta);
            cooldown=Math.max(0,cooldown-elapsed);
            if(!holding)return false;
            heldSeconds+=elapsed;
            if(heldSeconds<10-1e-9)return false;
            holding=false;heldSeconds=0;cooldown=10;
            return true;
        },
        get cooldown(){return cooldown;},
        get cooled(){return cooled;}
    };
}
