import { SKY_HEART_FLIGHT_SECONDS, SKY_HEART_BREATH_SECONDS } from '../content/sky-heart.js';

// Una caída y una recompensa por partida; salir de la mirada no borra el impacto.
export function createSkyHeart() {
    let stage='waiting', elapsed=0,impactAge=Infinity;
    return {
        launch(){if(stage!=='waiting')return false;stage='falling';elapsed=0;return true;},
        update(delta){
            if(stage==='falling'){
                const next=elapsed+Math.max(0,delta);
                elapsed=Math.min(SKY_HEART_FLIGHT_SECONDS,next);
                if(elapsed===SKY_HEART_FLIGHT_SECONDS){stage='landed';impactAge=next-SKY_HEART_FLIGHT_SECONDS;}
            }else if(Number.isFinite(impactAge)){
                impactAge+=Math.max(0,delta);
            }
            return this.state;
        },
        collect(){if(stage!=='landed')return false;stage='collected';return true;},
        get state(){return {stage,elapsed,impactAge,progress:Math.pow(elapsed/SKY_HEART_FLIGHT_SECONDS,2.6),
            pulse:Number.isFinite(impactAge)?.5+.5*Math.cos(impactAge*Math.PI*2/SKY_HEART_BREATH_SECONDS):0,
            shake:impactAge<1.25?Math.pow(1-impactAge/1.25,1.5):0};},
        get owned(){return stage==='collected';}
    };
}
