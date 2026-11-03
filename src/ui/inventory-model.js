import * as THREE from 'three';
import { createPinkSunglasses } from '../world/pink-sunglasses.js';
import { createTelescope } from '../world/telescope.js';
import { createMateSet } from '../world/mate-set.js';
import { createDivingHelmetGeometry, createDivingHelmetMaterials } from '../world/diving-helmet-geometry.js';
import { createInventoryMap } from '../world/inventory-map.js';
import { createInventoryKey } from '../world/inventory-key.js';
import { createForestHeartSpriteGeometry } from '../world/forest-heart-sprite.js';
import { createSkyHeartGlow, applySkyHeartEmbers } from '../world/sky-heart-glow.js';
import { createTorchModel } from '../world/torch-model.js';
import { prepareProgramsInBatches } from './render-ready.js';
import { createLoadingYield } from './loading-yield.js';


// Modelos de inspección ligeros; no comparten recursos ni estado con los objetos de la partida.
export function createInventoryModel(host) {
    let renderer, scene, camera, model, frame, visible=false, previous=0;
    let torchFrames, torchPreview, flame, flameTime=0, torchLit=false;
    let helmetBroken=false, helmetCracked=false, selectedItem=null;
    let heartSprite=null, seaHeartComplete=false;
    const skyHeartCooled={value:0};
    const heartTextures=new Map();

    let mapTexture;
    let drag=null;
    let selectionVersion=0,preparing=false;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const label=document.createElement('p'); label.className='inventory-preview-label';
    label.id='inventory-preview-instructions';
    label.textContent='Señala un objeto.\nPulsa para equiparlo.';host.append(label);
    const names={heart:'Corazón del Bosque','sea-heart':'Corazón del Mar','sky-heart':'Corazón del Cielo',torch:'Antorcha',map:'Mapa',
        'pink-sunglasses':'Lentes del mago del tiempo',helmet:'Escafandra',mate:'Mate',key:'Llave',astroscope:'Astroscopio'};
    function stopDrag() {
        if(!drag)return;
        const pointerId=drag.pointerId;drag=null;
        renderer.domElement.classList.remove('is-rotating');
        if(pointerId!==null&&renderer.domElement.hasPointerCapture(pointerId))renderer.domElement.releasePointerCapture(pointerId);
    }
    function enableManualRotation(canvas) {
        canvas.setAttribute('aria-describedby',label.id);
        canvas.addEventListener('inventory-preview-drag',event=>{
            const {phase,dx,dy}=event.detail;
            if(phase==='end'){stopDrag();return;}
            if(!visible||!model)return;
            if(phase==='start') {
                stopDrag();drag={pointerId:null,virtual:true};canvas.classList.add('is-rotating');
            } else if(drag?.virtual) {
                model.rotation.y+=dx*.01;
                model.rotation.x=THREE.MathUtils.clamp(model.rotation.x+dy*.01,-1.2,1.2);
                requestDraw();
            }
        });
        canvas.addEventListener('mousedown',event=>{if(event.button===0)event.stopPropagation();});
        canvas.addEventListener('pointerdown',event=>{
            if(event.button!==0 || !visible || !model || drag)return;
            event.preventDefault();event.stopPropagation();
            drag={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
            if(!document.pointerLockElement)canvas.setPointerCapture(event.pointerId);
            canvas.classList.add('is-rotating');
        });
        canvas.addEventListener('pointermove',event=>{
            if(!drag || event.pointerId!==drag.pointerId)return;
            if(!(event.buttons&1)){stopDrag();return;}
            event.preventDefault();event.stopPropagation();
            model.rotation.y+=(event.clientX-drag.x)*.01;
            model.rotation.x=THREE.MathUtils.clamp(model.rotation.x+(event.clientY-drag.y)*.01,-1.2,1.2);
            drag.x=event.clientX;drag.y=event.clientY;requestDraw();
        });
        canvas.addEventListener('pointerup',event=>{if(event.pointerId===drag?.pointerId && !(event.buttons&1))stopDrag();});
        for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{
            if(event.pointerId===drag?.pointerId)stopDrag();
        });
        window.addEventListener('blur',stopDrag);
        document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDrag();});
    }
    function clear() {
        torchPreview?.textures.forEach(texture=>texture.dispose());torchPreview=null;
        model?.traverse(o=>{if(!o.isSprite)o.geometry?.dispose();for(const material of o.material ? (Array.isArray(o.material)?o.material:[o.material]) : []) material.dispose();});
        if(model) scene.remove(model);
        flame=null;flameTime=0;heartSprite=null;
    }
    function buildHeartSprite() {
        const image=heartSprite?.userData.texture.image;
        if(!image?.width||!image.height||heartSprite.userData.builtImage===image)return;
        // Frente/dorso pixelados unidos por paredes en cada borde opaco del sprite.
        const geometry=createForestHeartSpriteGeometry(THREE,image,{height:2.5,depth:.24,alphaTest:.1});
        geometry.translate(0,0,-.12);
        const material=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
        if(heartSprite.userData.skyHeart){
            applySkyHeartEmbers(material,{value:.4},skyHeartCooled);
            if(!skyHeartCooled.value){const glow=createSkyHeartGlow(THREE,.12);glow.position.z=-.14;glow.scale.setScalar(3.1);heartSprite.add(glow);}
        }
        heartSprite.add(new THREE.Mesh(geometry,material));
        heartSprite.userData.builtImage=image;
    }
    function getHeartTexture(file) {
        if(!heartTextures.has(file)) {
            const texture=new THREE.TextureLoader().load(new URL(`../../imagenes/Sprites/${file}`,import.meta.url).href,()=>{
                buildHeartSprite();requestDraw();
            });
            texture.colorSpace=THREE.SRGBColorSpace;
            texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;
            heartTextures.set(file,texture);
        }
        return heartTextures.get(file);
    }
    function getMapTexture() {
        if(!mapTexture) {
            mapTexture=new THREE.TextureLoader().load(new URL('../../imagenes/Mapa/isla-cenital.png',import.meta.url).href,requestDraw);
            mapTexture.colorSpace=THREE.SRGBColorSpace;
            mapTexture.minFilter=mapTexture.magFilter=THREE.NearestFilter;mapTexture.generateMipmaps=false;
        }
        return mapTexture;
    }
    function setSeaHeartComplete(complete) {
        if(seaHeartComplete===complete)return;
        seaHeartComplete=complete;
        if(selectedItem==='sea-heart') {
            const rotation=model?.rotation.clone();select('sea-heart',{force:true});
            if(rotation && model)model.rotation.copy(rotation);
        }
    }
    function getTorchFrames() {
        if(!torchFrames) {
            const loader=new THREE.TextureLoader();
            torchFrames=Array.from({length:5},(_,i)=>{
                const texture=loader.load(new URL(`../../imagenes/Sprites/antorcha/torch${i+1}.png`,import.meta.url).href,()=>{
                    torchPreview?.textures.forEach(map=>{map.needsUpdate=true;});
                    requestDraw();
                });
                texture.colorSpace=THREE.SRGBColorSpace;
                texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
                return texture;
            });
        }
        return torchFrames;
    }
    function setTorchLit(value) {
        torchLit=Boolean(value);
        if(flame)flame.visible=torchLit;
        requestDraw();
    }
    function setHelmetDamage(cracked, broken) {
        cracked=Boolean(cracked || broken);broken=Boolean(broken);
        if(broken===helmetBroken && cracked===helmetCracked)return;
        helmetBroken=broken;helmetCracked=cracked;
        if(selectedItem==='helmet') {
            const rotation=model?.rotation.clone();
            select('helmet',{force:true});
            if(rotation && model)model.rotation.copy(rotation);
        }
    }
    function draw(time) {
        frame=null;
        if(!visible || !renderer || preparing) return;
        const delta=previous ? Math.min(.05,(time-previous)/1000) : 0; previous=time;

        if(model && !drag && !reduced.matches) model.rotation.y+=delta*.65;
        if(flame?.visible && !reduced.matches) {
            flameTime+=delta;
            torchPreview.updateFrame(Math.floor(flameTime/.15)%torchFrames.length);
        }
        const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight-35);
        if(renderer.domElement.width!==w || renderer.domElement.height!==h) {
            renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
        }
        renderer.render(scene,camera);
        if(!reduced.matches) frame=requestAnimationFrame(draw);
    }
    function requestDraw(){if(visible && renderer && frame==null)frame=requestAnimationFrame(draw);}
    function prepare() {
        if(renderer)return true;
        try {
            renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
            renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.setSize(1,1,false);
            renderer.domElement.setAttribute('aria-hidden','true');host.prepend(renderer.domElement);
            enableManualRotation(renderer.domElement);
            scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.1,30);camera.position.set(0,.2,5.5);
            scene.add(new THREE.HemisphereLight(0xffffff,0x43505d,2));
            const light=new THREE.DirectionalLight(0xffddaa,3);light.position.set(3,4,5);scene.add(light);
            return true;
        } catch(error) {
            renderer?.domElement.remove();renderer?.dispose();renderer=null;
            return false;
        }
    }
    function select(item,{force=false}={}) {
        if(!names[item]) return;
        if(!force&&selectedItem===item&&model)return;
        const version=++selectionVersion;
        preparing=true;
        stopDrag();
        selectedItem=item;
        label.textContent=item==='sky-heart'||item==='pink-sunglasses'?names[item]:'Señala un objeto.\nPulsa para equiparlo.';
        if(!prepare()) {preparing=false;return;}
        clear();model=new THREE.Group();scene.add(model);
        if(item==='heart'||item==='sea-heart'||item==='sky-heart') {
            const file=item==='sky-heart'?'corazon-cielo.png':item==='heart' ? 'corazon.png' : seaHeartComplete ? 'corazon-mar.png' : 'fragmento-mar.png';
            const map=getHeartTexture(file);
            heartSprite=new THREE.Group();
            heartSprite.userData.texture=map;
            heartSprite.userData.skyHeart=item==='sky-heart';
            model.add(heartSprite);buildHeartSprite();
        } else if(item==='torch') {
            torchPreview=createTorchModel(THREE,getTorchFrames());
            model.add(torchPreview.object);
            flame=torchPreview.flame;
            flame.visible=torchLit;
        } else if(item==='map') {
            model.add(createInventoryMap(THREE,getMapTexture()));
        } else if(item==='pink-sunglasses') {
            const goggles=createPinkSunglasses(THREE);goggles.scale.setScalar(3.6);model.add(goggles);
        } else if(item==='astroscope') {
            const telescope=createTelescope(THREE);telescope.scale.setScalar(4);
            telescope.rotateY(Math.PI/2);telescope.rotateOnWorldAxis(new THREE.Vector3(0,0,1),.35);
            model.add(telescope);
        } else if(item==='helmet') {
            const damage={broken:helmetBroken,cracked:helmetCracked};
            const geometry=createDivingHelmetGeometry(THREE,damage);
            geometry.translate(0,-.53,0);geometry.scale(1.8,1.8,1.8);
            const helmet=new THREE.Mesh(geometry,createDivingHelmetMaterials(THREE,damage));
            // La mirilla del casco del mundo mira hacia -Z; presentarla hacia la cámara.
            helmet.rotation.y=Math.PI;model.add(helmet);
        } else if(item==='mate') {
            const set=createMateSet(THREE);
            const mate=set.getObjectByName('graham-mate');
            set.remove(mate);
            set.traverse(object=>object.geometry?.dispose());
            mate.material.dispose();
            mate.material=new THREE.MeshBasicMaterial({vertexColors:true,fog:false,transparent:true,opacity:1,depthTest:true,depthWrite:true});
            const previewScale=3.8;
            // La boca queda en el origen del grupo que gira, centrado en la vista.
            mate.position.set(0,-.19*previewScale,0);mate.scale.setScalar(previewScale);
            model.position.y=camera.position.y;
            model.add(mate);
        } else if(item==='key') {
            model.add(createInventoryKey(THREE));
        }
        model.rotation.set(.1,item==='helmet' ? -.65 : .35,0);
        // Compilar sin bloquear la primera aparición del modelo. Una selección
        // posterior cancela la preparación antes de consultar programas desechados.
        prepareProgramsInBatches(THREE,renderer,scene,camera,createLoadingYield(3),null,()=>version!==selectionVersion)
            .then(()=>{if(version===selectionVersion){preparing=false;requestDraw();}})
            .catch(error=>{if(version===selectionVersion){preparing=false;console.warn('No se pudo preparar la vista del inventario:',error);}});
    }
    return {prepare,select,setTorchLit,setHelmetDamage,setSeaHeartComplete,setSkyHeartCooled(value){
        const next=Number(Boolean(value));if(next===skyHeartCooled.value)return;skyHeartCooled.value=next;
        if(selectedItem==='sky-heart'){
            const rotation=model?.rotation.clone();select('sky-heart',{force:true});if(rotation&&model)model.rotation.copy(rotation);
        }
    },setVisible(value){visible=value;previous=0;if(!value){stopDrag();cancelAnimationFrame(frame);frame=null;}else requestDraw();}};
}
