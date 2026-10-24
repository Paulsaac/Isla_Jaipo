// Reflejo discreto del telescopio del suelo; no ilumina ni participa en interacciones.
export function createTelescopeGlare(THREE,telescope) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d');
    const halo=ctx.createRadialGradient(32,32,0,32,32,30);
    halo.addColorStop(0,'rgba(255,255,255,0.95)');
    halo.addColorStop(0.12,'rgba(235,252,255,0.75)');
    halo.addColorStop(0.35,'rgba(151,222,255,0.22)');
    halo.addColorStop(1,'rgba(151,222,255,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,64,64);
    const beam=ctx.createLinearGradient(2,0,62,0);
    beam.addColorStop(0,'rgba(180,234,255,0)');
    beam.addColorStop(0.5,'rgba(248,255,255,0.55)');
    beam.addColorStop(1,'rgba(180,234,255,0)');
    ctx.fillStyle=beam;ctx.fillRect(2,31,60,2);
    ctx.translate(32,32);ctx.rotate(Math.PI/2);ctx.translate(-32,-32);
    ctx.fillRect(7,31,50,2);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,color:0xdaf9ff,transparent:true,
        opacity:0,blending:THREE.AdditiveBlending,depthTest:true,depthWrite:false,toneMapped:false,fog:false});
    const sprite=new THREE.Sprite(material);sprite.name='ground-telescope-glare';
    sprite.position.set(0.025,0.088,-0.325);sprite.scale.setScalar(0.20);
    sprite.raycast=()=>{};telescope.add(sprite);
    const position=new THREE.Vector3(),eye=new THREE.Vector3();
    let opacity=0;
    return {
        sprite,
        update(camera,delta,enabled) {
            if(!enabled) {opacity=0;material.opacity=0;sprite.visible=false;return;}
            telescope.getWorldPosition(position);camera.getWorldPosition(eye);
            const near=THREE.MathUtils.clamp((10-position.distanceTo(eye))/8.5,0,1);
            const proximity=near*near*(3-2*near);
            const target=0.23*proximity;
            opacity+=(target-opacity)*(1-Math.exp(-Math.max(0,delta)*9));
            material.opacity=Math.min(0.23,opacity);
            sprite.scale.setScalar(0.18+0.12*proximity);
            sprite.visible=material.opacity>0.001;
        },
        dispose() {sprite.removeFromParent();texture.dispose();material.dispose();}
    };
}
