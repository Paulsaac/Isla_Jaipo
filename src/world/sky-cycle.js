const smooth = t => t*t*(3-2*t);
const unit = state => ({night:0,dawn:0,day:0,dusk:0,[state]:1});
const blend = (a,b,t) => Object.fromEntries(Object.keys(a).map(k=>[k,a[k]*(1-t)+b[k]*t]));
const scale = 1.4;
const day = 139 * scale - 60, dusk = 18 * scale + 20, night = 44, dawn = 18.4;
export const SKY_CYCLE_TIMING = {
    day, dusk, night, dawn,
    duskStart: day,
    nightStart: day + dusk,
    dawnStart: day + dusk + night,
    total: day + dusk + night + dawn
};
export function createSkyCycle(manualSeconds=3) {
    const timing = SKY_CYCLE_TIMING;
    const sunDuration = timing.nightStart + timing.dawn;
    let weights=unit('night'), transition=null, sunProgress=1;
    return {
        get weights(){return weights;},
        get transitioning(){return transition!==null;},
        get sunProgress(){return sunProgress;},
        toggle(day){transition={from:{...weights},middle:unit(day?'dawn':'dusk'),to:unit(day?'day':'night'),elapsed:0,
            fromSun:day&&weights.night>0.99?0:sunProgress,toSun:day?timing.dawn/sunDuration:1};},
        update(delta,automatic,timer){
            if(transition){
                transition.elapsed+=delta;
                const t=Math.min(1,transition.elapsed/manualSeconds);
                sunProgress=transition.fromSun+(transition.toSun-transition.fromSun)*smooth(t);
                weights=t<0.4?blend(transition.from,transition.middle,smooth(t/0.4))
                    :t<0.6?transition.middle:blend(transition.middle,transition.to,smooth((t-0.6)/0.4));
                if(t===1)transition=null;
            }else if(automatic){
                // Recorrido visible: inicio del amanecer hasta fin del atardecer.
                sunProgress=Math.min(1,((timer+timing.dawn)%timing.total)/sunDuration);
                if(timer<timing.duskStart)weights=unit('day');
                else if(timer<timing.nightStart){const t=(timer-timing.duskStart)/timing.dusk;weights=t<0.5?blend(unit('day'),unit('dusk'),smooth(t*2)):blend(unit('dusk'),unit('night'),smooth((t-.5)*2));}
                else if(timer<timing.dawnStart)weights=unit('night');
                else {const t=(timer-timing.dawnStart)/timing.dawn;weights=t<0.5?blend(unit('night'),unit('dawn'),smooth(t*2)):blend(unit('dawn'),unit('day'),smooth((t-.5)*2));}
            }
            return weights.day+(weights.dawn+weights.dusk)*0.5;
        }
    };
}
