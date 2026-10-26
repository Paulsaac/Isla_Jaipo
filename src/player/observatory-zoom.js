// Cada pulsación cambia de lente; mantener la tecla recorre 50–200 de uno en uno.
export function createObservatoryZoom(onChange=()=>{}) {
    let value=2,held=0,repeat=0,cooldown=0;
    function change(next) {
        if(next===value)return;
        const previous=value;value=next;cooldown=.18;onChange(value,previous);
    }
    function step(direction) {
        if(direction>0)change(value<10?10:value<30?30:value<50?50:Math.min(200,value+1));
        else change(value>50?value-1:value>30?30:value>10?10:2);
    }
    return {
        reset(){value=2;held=0;repeat=0;cooldown=0;onChange(2,2);},
        press(direction){if(held===direction)return;held=direction;repeat=.20;step(direction);},
        release(direction){if(held===direction)held=0;},
        step,
        update(delta){
            cooldown=Math.max(0,cooldown-delta);
            if(!held)return;
            repeat-=delta;
            while(repeat<=0){
                repeat+=.02;
                if(held>0&&value>=50&&value<200)change(value+1);
                else if(held<0&&value>50)change(value-1);
                else break;
            }
        },
        get value(){return value;},get busy(){return held!==0||cooldown>0;}
    };
}
