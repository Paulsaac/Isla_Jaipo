import {SWIMMER_PERSONALITIES,createSwimmerLights,getSwimmerBreath} from './swimmer-lights.js';

// Un banco de luces con trayectorias de nado y saltos, anclado a la vista de la silla.
export function createBeachSwimmers(THREE,chair,waterHeight) {
    const personalities=SWIMMER_PERSONALITIES;
    const {points,geometry,positions,brightness,stride,trailCount}=createSwimmerLights(THREE);
    const material=points.material;
    const count=personalities.length,travel=38/3,span=100;
    let duration=0;
    let swimmers=[];
    const forward=new THREE.Vector3(Math.sin(chair.rotation.y),0,Math.cos(chair.rotation.y));
    const left=new THREE.Vector3(forward.z,0,-forward.x);
    const center=chair.position.clone().addScaledVector(forward,55);
    center.y=waterHeight;
    points.name='beach-playful-sea-lights';
    points.position.copy(center);
    points.visible=false;
    // La profundidad del agua oculta cada punto al sumergirse.
    points.renderOrder=.15;
    let time=null;
    const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
    const sample=new THREE.Vector3();
    function swim(seconds,index,target) {
        const swimmer=swimmers[index];
        const personality=personalities[index];
        const local=seconds-swimmer.delay;
        const pair=Math.floor(index/2),side=index%2===0?1:-1;
        const active=local>=0&&local<travel;
        const emergence=smooth(local/1.1);
        const descent=smooth((local-(travel-1.4))/1.4);
        const jump=swimmer.jumps.find(jump=>local>=jump.start&&local<=jump.start+jump.duration);
        const phase=local*swimmer.swaySpeed+swimmer.phase;
        const swimY=-1.35-.25*Math.sin(local*1.8+swimmer.phase);
        const arc=jump?4*((local-jump.start)/jump.duration)*(1-(local-jump.start)/jump.duration):0;
        const y=swimY+(personality.height-swimY)*arc;
        // Las diferencias de velocidad son acotadas y vuelven a reunir al grupo al final.
        const progress=THREE.MathUtils.clamp(local/travel,0,1);
        const speedOffset=span*(personality.speed-1)*Math.sin(progress*Math.PI)/Math.PI;
        const along=-span/2+span*local/travel+speedOffset+pair*5.5+side*.85*Math.sin(phase);
        const depth=(pair-1)*3.8+side*personality.sway*Math.cos(phase);
        target.copy(left).multiplyScalar(along).addScaledVector(forward,depth);
        target.y=y-(1-emergence)*4.5-descent*5.5;
        const breath=getSwimmerBreath(personality,local,swimmer.phase);
        return active?emergence*(1-descent)*breath:0;
    }
    return {
        points,
        start() {
            if(time!==null)return;
            swimmers=Array.from({length:count},(_,index)=>{
                const personality=personalities[index];
                const jumps=[];
                if(personality.height>0) {
                    let start=1.2+Math.random()*1.3;
                    while(start<travel-2.7) {
                        const duration=personality.duration*(.9+Math.random()*.2);
                        jumps.push({start,duration});
                        start+=duration+personality.gap+Math.random()*1.5;
                    }
                }
                return {delay:index*.43+Math.random()*.3,jumps,phase:Math.random()*Math.PI*2,swaySpeed:.9+Math.random()*.55};
            });
            duration=travel+Math.max(...swimmers.map(swimmer=>swimmer.delay))+(trailCount-1)*.065;
            time=0;
        },
        reset() {
            time=null;
            points.visible=false;
        },
        update(delta,viewer,viewportHeight,enabled=true) {
            if(time===null)return;
            time+=delta;
            if(time>=duration) {
                time=null;
                points.visible=false;
                return;
            }
            points.visible=enabled&&viewer.distanceToSquared(center)<240*240;
            if(!points.visible)return;
            material.uniforms.viewportHeight.value=viewportHeight;
            for(let i=0;i<count;i++) {
                for(let tail=0;tail<trailCount;tail++) {
                    const index=i*stride+tail;
                    const visible=swim(time-tail*.065,i,sample);
                    positions[index*3]=sample.x;
                    positions[index*3+1]=sample.y;
                    positions[index*3+2]=sample.z;
                    brightness[index]=visible*Math.exp(-tail*.32)*(tail===0?1:.34);
                }
                // Resplandor tenue sobre el agua mientras la luz pasa justo por debajo.
                const visible=swim(time,i,sample),index=i*stride+trailCount;
                positions[index*3]=sample.x;
                positions[index*3+1]=.035;
                positions[index*3+2]=sample.z;
                brightness[index]=visible*.55*Math.exp(Math.min(0,sample.y)*.85)*smooth(-sample.y/.16);
            }
            geometry.attributes.position.needsUpdate=true;
            geometry.attributes.brightness.needsUpdate=true;
        }
    };
}
