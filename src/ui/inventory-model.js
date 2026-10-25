import * as THREE from 'three';
import { createPinkSunglasses } from '../world/pink-sunglasses.js';
import { createTelescope } from '../world/telescope.js';
import { createDivingHelmetGeometry, createDivingHelmetMaterials } from '../world/diving-helmet-geometry.js';
import { createInventoryMap } from '../world/inventory-map.js';
import { createInventoryKey } from '../world/inventory-key.js';
import { createMatePreview } from '../world/mate-set.js';
import { prepareProgramsInBatches } from './render-ready.js';
import { createLoadingYield } from './loading-yield.js';

// Modelos de inspección ligeros; no comparten recursos ni estado con los objetos de la partida.
export function createInventoryModel(host) {
    let renderer, scene, camera, model, frame, visible=false, previous=0;
    let torchFrames, torchBodyTextures, flame, flameTime=0, torchLit=false;
    let helmetBroken=false, helmetCracked=false, selectedItem=null;
    let heartSprite=null, seaHeartComplete=false;
    const heartTextures=new Map();
    let mapTexture;
    let drag=null;
    let selectionVersion=0,preparing=false;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const label=document.createElement('p'); label.className='inventory-preview-label';
    label.textContent='Señala un objeto'; host.append(label);
    const names={heart:'Corazón del Bosque','sea-heart':'Corazón del Mar',torch:'Antorcha',map:'Mapa',
        'pink-sunglasses':'Lentes',helmet:'Escafandra',mate:'Mate',key:'Llave',astroscope:'Astroscopio'};
    function stopDrag() {
        if(!drag)return;
        const pointerId=drag.pointerId;drag=null;
        renderer.domElement.classList.remove('is-rotating');
        if(renderer.domElement.hasPointerCapture(pointerId))renderer.domElement.releasePointerCapture(pointerId);
    }
    function enableManualRotation(canvas) {
        canvas.title='Mantén el clic izquierdo y arrastra para girar';
        canvas.addEventListener('mousedown',event=>{if(event.button===0)event.stopPropagation();});
        canvas.addEventListener('pointerdown',event=>{
            if(event.button!==0 || !visible || !model || drag)return;
            event.preventDefault();event.stopPropagation();
            drag={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
            canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-rotating');
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
        model?.traverse(o=>{if(!o.isSprite)o.geometry?.dispose();for(const material of o.material ? (Array.isArray(o.material)?o.material:[o.material]) : []) material.dispose();});
        if(model) scene.remove(model);
        flame=null;flameTime=0;heartSprite=null;
    }
    function fitHeartSprite() {
        const image=heartSprite?.children[0]?.material.map.image;
        if(image?.width && image.height)heartSprite.scale.set(2.5*image.width/image.height,2.5,1);
    }
    function getHeartTexture(file) {
        if(!heartTextures.has(file)) {
            const texture=new THREE.TextureLoader().load(new URL(`../../imagenes/Sprites/${file}`,import.meta.url).href,()=>{
                fitHeartSprite();requestDraw();
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
            const rotation=model?.rotation.clone();select('sea-heart');
            if(rotation && model)model.rotation.copy(rotation);
        }
    }
    function getTorchFrames() {
        if(!torchFrames) {
            const loader=new THREE.TextureLoader();
            torchFrames=Array.from({length:5},(_,i)=>{
                const texture=loader.load(new URL(`../../imagenes/Sprites/antorcha/torch${i+1}.png`,import.meta.url).href,()=>{
                    if(i===0)torchBodyTextures?.forEach(map=>{map.needsUpdate=true;});
                    requestDraw();
                });
                texture.colorSpace=THREE.SRGBColorSpace;
                texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
                // Solo las filas 0–7 del sprite original: fuego sin duplicar el mango.
                texture.repeat.set(6/20,8/20);texture.offset.set(7/20,12/20);
                return texture;
            });
        }
        return torchFrames;
    }
    function getTorchBodyTextures() {
        if(!torchBodyTextures) {
            const base=getTorchFrames()[0],shaft=base.clone(),head=base.clone();
            // Colores originales del mango (columnas 9–10, filas 10–19) y cabeza (fila 9).
            shaft.repeat.set(2/20,10/20);shaft.offset.set(9/20,0);
            head.repeat.set(6/20,1/20);head.offset.set(7/20,10/20);
            torchBodyTextures=[shaft,head];
            torchBodyTextures.forEach(map=>{map.needsUpdate=true;});
        }
        return torchBodyTextures;
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
            select('helmet');
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
            flame.material.map=torchFrames[Math.floor(flameTime/.15)%torchFrames.length];
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
    function select(item) {
        if(!names[item]) return;
        const version=++selectionVersion;
        preparing=true;
        stopDrag();
        selectedItem=item;
        const itemName=item==='helmet' ? (helmetBroken ? 'Escafandra rota' : helmetCracked ? 'Escafandra agrietada' : names[item])
            : item==='sea-heart' && !seaHeartComplete ? 'Fragmentos del Corazón del Mar' : names[item];
        if(!prepare()) {preparing=false;label.textContent=itemName;return;}
        clear();model=new THREE.Group();scene.add(model);
        function part(geometry,color,x=0,y=0,z=0){const mesh=new THREE.Mesh(geometry,
            new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.15,flatShading:true}));
            mesh.position.set(x,y,z);model.add(mesh);return mesh;}
        if(item==='heart'||item==='sea-heart') {
            const file=item==='heart' ? 'corazon.png' : seaHeartComplete ? 'corazon-mar.png' : 'fragmento-mar.png';
            const map=getHeartTexture(file);
            heartSprite=new THREE.Group();
            // Siete copias del mismo sprite: caras originales y capas interiores más oscuras.
            for(let i=0;i<7;i++) {
                const layer=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
                    map,color:i===0||i===6 ? 0xffffff : 0xa0a0a0,transparent:true,alphaTest:.1,
                    depthWrite:true,side:THREE.DoubleSide,toneMapped:false
                }));
                layer.position.z=(i-3)*.04;heartSprite.add(layer);
            }
            model.add(heartSprite);fitHeartSprite();
        } else if(item==='torch') {
            const [shaftMap,headMap]=getTorchBodyTextures();
            const shaft=part(new THREE.CylinderGeometry(.15,.075,1.5,6),0xffffff,0,-.25);
            const head=part(new THREE.CylinderGeometry(.27,.19,.3,6),0xffffff,0,.57);
            for(const [mesh,map] of [[shaft,shaftMap],[head,headMap]]) {
                mesh.material.map=map;mesh.material.roughness=1;mesh.material.metalness=0;
            }
            part(new THREE.CylinderGeometry(.22,.23,.05,6),0x100c0a,0,.73);
            flame=new THREE.Sprite(new THREE.SpriteMaterial({map:getTorchFrames()[0],
                transparent:true,alphaTest:.1,depthWrite:false,toneMapped:false}));
            flame.visible=torchLit;
            flame.position.set(0,1.2,0);flame.scale.set(.72,.96,1);model.add(flame);
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
            const mate=createMatePreview(THREE);
            mate.scale.setScalar(2.5);mate.position.y=-.23;model.add(mate);
        } else if(item==='key') {
            model.add(createInventoryKey(THREE));
        }
        model.rotation.set(.1,item==='helmet' ? -.65 : .35,0);label.textContent=itemName;
        // Compilar sin bloquear la primera aparición del modelo. Una selección
        // posterior cancela la preparación antes de consultar programas desechados.
        prepareProgramsInBatches(THREE,renderer,scene,camera,createLoadingYield(3),null,()=>version!==selectionVersion)
            .then(()=>{if(version===selectionVersion){preparing=false;requestDraw();}})
            .catch(error=>{if(version===selectionVersion){preparing=false;console.warn('No se pudo preparar la vista del inventario:',error);}});
    }
    return {prepare,select,setTorchLit,setHelmetDamage,setSeaHeartComplete,setVisible(value){visible=value;previous=0;if(!value){stopDrag();cancelAnimationFrame(frame);frame=null;}else requestDraw();}};
}
