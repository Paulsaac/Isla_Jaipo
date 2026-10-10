const smooth = t => t*t*(3-2*t);
const unit = state => ({night:0,dawn:0,day:0,dusk:0,[state]:1});
const blend = (a,b,t) => Object.fromEntries(Object.keys(a).map(k=>[k,a[k]*(1-t)+b[k]*t]));
export function createSkyCycle(manualSeconds=3) {
    let weights=unit('night'), transition=null;
    return {
        get weights(){return weights;},
        get transitioning(){return transition!==null;},
        toggle(day){transition={from:{...weights},middle:unit(day?'dawn':'dusk'),to:unit(day?'day':'night'),elapsed:0};},
        update(delta,automatic,timer){
            if(transition){
                transition.elapsed+=delta;
                const t=Math.min(1,transition.elapsed/manualSeconds);
                weights=t<0.4?blend(transition.from,transition.middle,smooth(t/0.4))
                    :t<0.6?transition.middle:blend(transition.middle,transition.to,smooth((t-0.6)/0.4));
                if(t===1)transition=null;
            }else if(automatic){
                // 242 s: día 139, atardecer 18, noche 73, amanecer 12.
                if(timer<139)weights=unit('day');
                else if(timer<157){const t=(timer-139)/18;weights=t<0.5?blend(unit('day'),unit('dusk'),smooth(t*2)):blend(unit('dusk'),unit('night'),smooth((t-.5)*2));}
                else if(timer<230)weights=unit('night');
                else {const t=(timer-230)/12;weights=t<0.5?blend(unit('night'),unit('dawn'),smooth(t*2)):blend(unit('dawn'),unit('day'),smooth((t-.5)*2));}
            }
            return weights.day+(weights.dawn+weights.dusk)*0.5;
        }
    };
}
