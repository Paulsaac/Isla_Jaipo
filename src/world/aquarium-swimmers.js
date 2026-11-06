import {SWIMMER_PERSONALITIES,createSwimmerLights,getSwimmerBreath} from './swimmer-lights.js';

// Cada color habita el acuario con una trayectoria propia y continua.
export function createAquariumSwimmers(THREE,{width,depth,height},bedHeight) {
    const {points,geometry,positions,brightness,stride,trailCount}=createSwimmerLights(THREE,{fog:false});
    points.name='aquarium-rainbow-swimmers';
    points.renderOrder=.15;
    geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,height/2,0),Math.hypot(width,depth,height)/2);
    const sizes=geometry.attributes.pointSize;
    for(let i=0;i<sizes.count;i++)sizes.setX(i,sizes.getX(i)*.4);
    const breathPhases=SWIMMER_PERSONALITIES.map(()=>Math.random()*Math.PI*2);
    const halfDepth=depth/2,xRadius=width/2-1.5,zRadius=halfDepth-1.8;
    const resting=[
        new THREE.Vector3(-width/2+1.7,0,halfDepth-2.6),
        new THREE.Vector3(-width/2+2.25,0,halfDepth-2.3)
    ];
    for(const position of resting)position.y=bedHeight(position.x,position.z)+.045;
    const follower=new THREE.Vector3(0,height*.42,halfDepth-.55);
    const followerTarget=follower.clone();
    let time=0;
    const sample=new THREE.Vector3();
    const triangle=phase=>Math.asin(Math.sin(phase))*2/Math.PI;
    function swim(seconds,index,target) {
        switch(index) {
            case 0: { // Rojo: avance en zigzag, con un circuito de dieciséis segundos.
                const phase=seconds*Math.PI*2/16;
                target.set(xRadius*Math.sin(phase),1.65+.2*Math.sin(phase*2),zRadius*triangle(phase*4));
                break;
            }
            case 1: { // Naranja: espirales ascendentes y descendentes.
                const phase=seconds*Math.PI*2/20;
                target.set(2.25+1.5*Math.cos(phase*4),height/2+(height/2-.65)*Math.sin(phase),
                    -1.8+1.5*Math.sin(phase*4));
                break;
            }
            case 2: { // Amarillo: paseo lento por todo el perímetro.
                const phase=seconds*Math.PI*2/70;
                target.set(xRadius*Math.sin(phase),2.1+.45*Math.sin(phase*2),zRadius*Math.cos(phase));
                break;
            }
            case 3:
            case 4: // Verde y azul: juntos sobre la arena de la esquina delantera izquierda.
                target.copy(resting[index-3]);
                break;
            case 5: { // Índigo: conserva su órbita, ahora con un giro muy lento.
                const phase=seconds*Math.PI*2/240+index*Math.PI*2/7;
                target.set(xRadius*Math.sin(phase),1.25+.18*Math.sin(phase),zRadius*Math.cos(phase));
                break;
            }
            case 6: // Violeta: observa al jugador y guarda su última posición al alejarse.
                target.copy(follower);
                break;
        }
        return getSwimmerBreath(SWIMMER_PERSONALITIES[index],seconds,breathPhases[index]);
    }
    return {
        points,
        update(delta,viewportHeight=720,viewer) {
            time+=delta;
            if(viewer&&viewer.z>=halfDepth&&viewer.z-halfDepth<3.2&&Math.abs(viewer.x)<width*.45+.5) {
                const y=THREE.MathUtils.clamp(viewer.y,1.1,height-1.1);
                const vertical=(y-height/2)/(height*.38-.25);
                const visibleHalfWidth=(width*.44-.4)*Math.sqrt(Math.max(0,1-vertical*vertical));
                followerTarget.set(THREE.MathUtils.clamp(viewer.x,-visibleHalfWidth,visibleHalfWidth),y,halfDepth-.55);
                follower.lerp(followerTarget,1-Math.exp(-delta*3.2));
            }
            points.material.uniforms.viewportHeight.value=viewportHeight;
            for(let i=0;i<SWIMMER_PERSONALITIES.length;i++) {
                const stationary=i===3||i===4||i===6;
                for(let tail=0;tail<trailCount;tail++) {
                    const index=i*stride+tail;
                    const pulse=swim(time-tail*.065,i,sample);
                    positions[index*3]=sample.x;
                    positions[index*3+1]=sample.y;
                    positions[index*3+2]=sample.z;
                    brightness[index]=stationary&&tail>0?0:pulse*Math.exp(-tail*.32)*(tail===0?1:.34);
                }
                brightness[i*stride+trailCount]=0;
            }
            geometry.attributes.position.needsUpdate=true;
            geometry.attributes.brightness.needsUpdate=true;
        }
    };
}
