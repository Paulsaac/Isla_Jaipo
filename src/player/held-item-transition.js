// Cambiar de objeto baja primero el anterior y sube después el nuevo.
export function createHeldItemTransition({riseSeconds=.28,lowerSeconds=.22}={}) {
    const state={item:null,progress:0};
    return {
        get item(){return state.item;},
        reset(){state.item=null;state.progress=0;},
        update(delta,requested){
            let remaining=Math.max(0,delta);
            if(state.item===null){state.item=requested;state.progress=0;}
            if(state.item===null)return state;
            if(state.item!==requested){
                const duration=state.progress*lowerSeconds;
                if(remaining<duration){state.progress-=remaining/lowerSeconds;return state;}
                remaining-=duration;state.item=requested;state.progress=0;
            }
            if(state.item!==null)state.progress=Math.min(1,state.progress+remaining/riseSeconds);
            return state;
        }
    };
}

export function applyHeldItemTransition(object,state,fov){
    const t=state.progress*state.progress*(3-2*state.progress);
    const viewHeight=2*Math.tan(fov*Math.PI/360)*Math.abs(object.position.z);
    object.position.y-=(viewHeight+object.scale.y*2)*(1-t);
    return t;
}
