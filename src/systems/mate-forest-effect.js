const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// Reloj de partida independiente de la canción y de la velocidad de fotogramas.
export function createMateForestEffect() {
    let elapsed=Infinity,duration=60,strong=false,heldSeconds=0,lastGesture=0;
    let clock=0,carry=0,reinforcement=0,visibility=0;
    function envelope(){return elapsed>=duration?0:elapsed<5?carry+(1-carry)*smooth(elapsed/5):1-smooth((elapsed-5)/(duration-5));}
    function reset(){elapsed=Infinity;strong=false;heldSeconds=0;carry=0;reinforcement=0;visibility=0;}
    function sample(suppressed=false){
        const amount=suppressed?0:envelope()*visibility;
        return {elapsed,duration,strong,heldSeconds,clock,envelope:envelope(),
            treeColor:amount*(.06+.07*reinforcement),skyColor:amount*(.08+.08*reinforcement),
            treeMotion:amount*.07*reinforcement};
    }
    return {
        reset,
        update(delta,{gesture=0,holding=false,inForest=false,outdoors=inForest,suppressed=false}={}) {
            const dt=Math.max(0,delta);
            if(dt===0)return sample(suppressed);
            clock+=dt;
            const eligible=inForest&&!suppressed;
            const canDrink=outdoors&&!suppressed;
            if(gesture!==lastGesture){
                lastGesture=gesture;heldSeconds=0;
                if(canDrink){carry=envelope();elapsed=0;duration=strong?120:60;}
            }
            if(holding&&canDrink&&elapsed<duration)heldSeconds+=dt;else heldSeconds=0;
            if(heldSeconds>=10&&!strong){strong=true;duration=120;}
            reinforcement+=((strong?1:0)-reinforcement)*(1-Math.exp(-dt/1.2));
            if(Number.isFinite(elapsed))elapsed+=dt;
            visibility+=((eligible?1:0)-visibility)*(1-Math.exp(-dt*2));
            if(elapsed>=duration){strong=false;reinforcement=0;heldSeconds=0;}
            return sample(suppressed);
        },
        get state(){return sample();}
    };
}
