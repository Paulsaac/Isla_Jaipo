import * as THREE from 'three';
import {createKeyring} from '../world/keyring.js';
import {KEY_DEFINITIONS} from '../content/keys.js';

export function createInventoryKeyring(menu,{onInspect=()=>{}}={}) {
    const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./inventory-keyring.css',import.meta.url);document.head.append(sheet);
    const button=document.createElement('button');button.type='button';button.className='inventory-keyring-button';
    button.setAttribute('aria-label','Inspeccionar llavero');button.hidden=true;
    const mini=document.createElement('span');mini.className='keyring-mini-stage';
    const caption=document.createElement('span');caption.className='keyring-caption';caption.textContent='Llavero';button.append(mini,caption);menu.append(button);
    const overlay=document.createElement('div');overlay.className='keyring-inspector';overlay.hidden=true;
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Inspeccionar llaves');
    overlay.innerHTML='<h2>Llavero</h2><div class="keyring-full-stage"><button type="button" class="keyring-close" aria-label="Cerrar llavero">×</button></div><p class="keyring-name" aria-live="polite"></p>';
    menu.append(overlay);
    const stage=overlay.querySelector('.keyring-full-stage'),label=overlay.querySelector('.keyring-name'),close=overlay.querySelector('.keyring-close');
    let visible=false,expanded=false,ids=[],model=null,renderer=null,scene,camera,frame=null,hovered=null;
    let inertSiblings=[];
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    function highlight(id) {
        hovered=id;overlay.dataset.hoveredKey=id??'';
        for(const mesh of model?.keyMeshes??[]){mesh.material.emissive.setHex(mesh.userData.keyId===id?0xc4b797:0x000000);mesh.material.emissiveIntensity=.23;}
        label.textContent=KEY_DEFINITIONS.find(key=>key.id===id)?.name??'';
        requestDraw();
    }
    function initialize() {
        if(renderer)return;
        renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
        renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);
        renderer.domElement.className='keyring-canvas';renderer.domElement.tabIndex=-1;
        renderer.domElement.setAttribute('aria-label','Modelo del llavero. Usa las flechas para inspeccionar sus llaves.');
        mini.append(renderer.domElement);scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,30);camera.position.set(0,.05,8);camera.lookAt(0,.05,0);
        scene.add(new THREE.HemisphereLight(0xeaf2ff,0x45443b,2));
        const light=new THREE.DirectionalLight(0xffedd8,3.4);light.position.set(-3,4,6);scene.add(light);
        const rim=new THREE.DirectionalLight(0xaac9e6,1.8);rim.position.set(4,1,-2);scene.add(rim);
        renderer.domElement.addEventListener('pointermove',event=>{
            if(!expanded||!model)return;
            const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
            model.group.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);
            highlight(raycaster.intersectObjects(model.keyMeshes)[0]?.object.userData.keyId??null);
        });
        renderer.domElement.addEventListener('pointerleave',()=>highlight(null));
        renderer.domElement.addEventListener('keydown',event=>{
            if(!expanded||!['ArrowLeft','ArrowRight'].includes(event.code))return;
            event.preventDefault();event.stopPropagation();const index=ids.indexOf(hovered),step=event.code==='ArrowRight'?1:-1;
            highlight(ids[(index+step+ids.length)%ids.length]);
        });
    }
    function disposeModel(){if(!model)return;scene.remove(model.group);model.group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});model=null;}
    function rebuild() {if(!renderer)return;disposeModel();model=createKeyring(THREE,ids);scene.add(model.group);highlight(null);}
    function draw(){frame=null;if(!visible||!renderer||!ids.length)return;
        const host=expanded?stage:mini,w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
        renderer.setSize(w,h,false);const half=2.05;camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
        renderer.render(scene,camera);
    }
    function requestDraw(){if(visible&&ids.length&&frame===null)frame=requestAnimationFrame(draw);}
    function inspect(value) {
        if(value&&(!visible||!ids.length))return;
        if(expanded===value)return;expanded=value;overlay.hidden=!value;
        if(value){
            initialize();if(!model)rebuild();inertSiblings=[...menu.children].filter(e=>e!==overlay).map(e=>[e,e.inert]);
            for(const [element]of inertSiblings)element.inert=true;
            stage.append(renderer.domElement);renderer.domElement.tabIndex=0;close.focus({preventScroll:true});
        }else{
            for(const [element,inert]of inertSiblings)element.inert=inert;inertSiblings=[];
            if(renderer){mini.append(renderer.domElement);renderer.domElement.tabIndex=-1;}
            highlight(null);if(visible&&!button.hidden)button.focus({preventScroll:true});
        }
        onInspect(value);requestDraw();
    }
    button.addEventListener('click',event=>{event.stopPropagation();inspect(true);});
    overlay.addEventListener('click',event=>{event.stopPropagation();if(event.target===overlay)inspect(false);});
    close.addEventListener('click',()=>inspect(false));
    document.addEventListener('keydown',event=>{
        if(!expanded)return;
        if(event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();inspect(false);}
        if(event.code==='Tab'){
            event.preventDefault();const target=document.activeElement===close?renderer.domElement:close;target.focus();
        }
    },true);
    const observer=new ResizeObserver(requestDraw);observer.observe(mini);observer.observe(stage);
    return {
        setKeys(keys){const next=KEY_DEFINITIONS.filter(def=>keys.some(key=>key.id===def.id)).map(key=>key.id);
            if(next.join()===ids.join())return;ids=next;button.hidden=!ids.length;button.dataset.keyCount=String(ids.length);
            button.setAttribute('aria-label',`Inspeccionar llavero: ${ids.length} ${ids.length===1?'llave':'llaves'}`);
            if(!ids.length)inspect(false);if(renderer)rebuild();if(visible&&ids.length){initialize();if(!model)rebuild();requestDraw();}},
        setVisible(value){visible=value;if(!value){inspect(false);cancelAnimationFrame(frame);frame=null;}
            else if(ids.length){initialize();if(!model)rebuild();requestDraw();}}
    };
}
