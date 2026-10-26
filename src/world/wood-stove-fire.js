import { createWoodStoveGeometry } from './wood-stove-geometry.js';

// Ambas variantes comparten cuerpo, posición y huella física; solo cambia el interior.
export function createWoodStoveFire(THREE, stove, torchFrames, scale, pipeTop = 5.15) {
    const loadedGeometry=createWoodStoveGeometry(THREE,{withWood:true});
    loadedGeometry.scale(scale,scale,scale);
    const frames=torchFrames.map(source=>{
        const texture=source.clone();
        texture.repeat.set(6/20,8/20);texture.offset.set(7/20,12/20);
        texture.generateMipmaps=false;texture.needsUpdate=true;
        return texture;
    });
    const flame=new THREE.Mesh(new THREE.PlaneGeometry(.68*scale,.50*scale),
        new THREE.MeshBasicMaterial({map:frames[0],transparent:true,alphaTest:.08,
            depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
    flame.name=stove.name+'-fire';
    flame.position.set(0,1.015*scale,.28*scale);
    flame.visible=false;flame.userData.visibilityEnabled=false;
    stove.add(flame);stove.updateWorldMatrix(true,true);
    const position=flame.getWorldPosition(new THREE.Vector3());
    const torch={x:position.x,y:position.y,z:position.z,isIndoor:true,alwaysLit:true,
        enabled:false,color:0xffa034,distance:6,intensityScale:.15,flickerRate:9,flickerDepth:1.1};
    // Bocanadas suaves sobre el sombrerete real, también en tejados elevados.
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d');
    const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(255,255,255,0.65)');
    gradient.addColorStop(.45,'rgba(255,255,255,0.35)');
    gradient.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    const smokeTexture=new THREE.CanvasTexture(canvas);
    const smoke=new THREE.Group();smoke.name=stove.name+'-chimney-smoke';
    smoke.position.set(0,(pipeTop+.20)*scale,-.14*scale);
    smoke.visible=false;stove.add(smoke);
    const puffs=Array.from({length:12},(_,i)=>{
        const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTexture,
            color:0x96938d,transparent:true,opacity:0,depthWrite:false}));
        puff.visible=false;puff.userData.visibilityEnabled=false;
        smoke.add(puff);
        return {sprite:puff,delay:i*.45,phase:i*2.39996};
    });
    let lit=false;
    let smokeStart=null;
    return {
        position,torch,
        get lit(){return lit;},
        ignite(){
            if(lit)return false;
            lit=true;
            const emptyGeometry=stove.geometry;
            stove.geometry=loadedGeometry;emptyGeometry.dispose();
            flame.visible=true;flame.userData.visibilityEnabled=true;torch.enabled=true;
            smoke.visible=true;
            for(const {sprite} of puffs){sprite.visible=true;sprite.userData.visibilityEnabled=true;}
            return true;
        },
        update(time){
            if(!lit)return;
            flame.material.map=frames[Math.floor(time/.15)%frames.length];
            if(smokeStart===null)smokeStart=time;
            const elapsed=time-smokeStart,lifetime=5.4;
            for(const {sprite,delay,phase} of puffs){
                const age=elapsed-delay;
                if(age<0){sprite.material.opacity=0;continue;}
                const t=(age%lifetime)/lifetime;
                sprite.position.set((t*.85+Math.sin(t*5+phase)*t*.18)*scale,
                    t*3.2*scale,Math.cos(t*4+phase)*t*.23*scale);
                sprite.scale.setScalar((.28+t*1.15)*scale);
                sprite.material.rotation=phase+t*.4;
                sprite.material.opacity=.32*Math.min(1,t/.10)*(1-t)*(1-t);
            }
        }
    };
}
