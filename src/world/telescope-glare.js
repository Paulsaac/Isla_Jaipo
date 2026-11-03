import {Lensflare,LensflareElement} from 'three/addons/objects/Lensflare.js';

// Destello blanco del Astroscopio del suelo, visible también desde lejos.
export function createTelescopeGlare(THREE,telescope,renderer=null) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d');
    const halo=ctx.createRadialGradient(32,32,0,32,32,30);
    halo.addColorStop(0,'rgba(255,255,255,0.95)');
    halo.addColorStop(0.12,'rgba(255,255,255,0.85)');
    halo.addColorStop(0.35,'rgba(255,255,255,0.30)');
    halo.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,64,64);
    const beam=ctx.createLinearGradient(2,0,62,0);
    beam.addColorStop(0,'rgba(255,255,255,0)');
    beam.addColorStop(0.5,'rgba(255,255,255,0.75)');
    beam.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=beam;ctx.fillRect(2,31,60,2);
    ctx.translate(32,32);ctx.rotate(Math.PI/2);ctx.translate(-32,-32);
    ctx.fillRect(7,31,50,2);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,color:0xffffff,transparent:true,
        opacity:0,blending:THREE.AdditiveBlending,depthTest:true,depthWrite:false,toneMapped:false,fog:false});
    const sprite=new THREE.Sprite(material);sprite.name='ground-telescope-glare';
    sprite.position.set(0.025,0.088,-0.325);sprite.scale.setScalar(0.20);
    sprite.raycast=()=>{};telescope.add(sprite);
    const flare=new Lensflare();flare.name='ground-telescope-white-lensflare';flare.position.copy(sprite.position);
    flare.material.fog=false;
    flare.raycast=()=>{};telescope.add(flare);
    const elements=[[80,0,1],[28,.30,.28],[48,.62,.18],[72,1,.12]].map(([size,distance,gain])=>{
        const element=new LensflareElement(texture,size,distance,new THREE.Color(0xffffff));flare.addElement(element);
        return {element,size,gain};
    });
    const position=new THREE.Vector3(),eye=new THREE.Vector3(),forward=new THREE.Vector3(),direction=new THREE.Vector3();
    let opacity=0,strength=0;
    return {
        sprite,flare,
        update(camera,delta,enabled) {
            if(!enabled||!telescope.visible) {opacity=0;strength=0;material.opacity=0;sprite.visible=false;flare.visible=false;return;}
            sprite.getWorldPosition(position);camera.getWorldPosition(eye);camera.getWorldDirection(forward);
            const distance=position.distanceTo(eye),range=1-THREE.MathUtils.smoothstep(distance,35,70);
            const far=THREE.MathUtils.smoothstep(distance,2,18),target=(.45+.35*far)*range;
            const blend=1-Math.exp(-Math.max(0,delta)*9);
            opacity+=(target-opacity)*blend;
            material.opacity=opacity;
            // Conservar un tamaño legible en pantalla, sin agrandar el objeto físico.
            sprite.scale.setScalar(Math.max(.30,Math.min(1.25,distance*.022)));
            sprite.visible=material.opacity>0.001;
            direction.subVectors(position,eye).normalize();
            const alignment=THREE.MathUtils.smoothstep(forward.dot(direction),.94,.998);
            strength+=((.18+.10*far)*range*alignment-strength)*blend;
            flare.visible=strength>.001;
            for(const {element,size,gain} of elements){element.color.setScalar(strength*gain);element.size=size*(renderer?.getPixelRatio()??1);}
        },
        dispose() {sprite.removeFromParent();flare.removeFromParent();flare.dispose();flare.material.dispose();material.dispose();}
    };
}
