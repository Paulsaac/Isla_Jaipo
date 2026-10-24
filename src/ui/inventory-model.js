import * as THREE from 'three';
import { createPinkSunglasses } from '../world/pink-sunglasses.js';
import { createTelescope } from '../world/telescope.js';

// Modelos de inspección ligeros; no comparten recursos ni estado con los objetos de la partida.
export function createInventoryModel(host) {
    let renderer, scene, camera, model, frame, visible=false, previous=0;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const label=document.createElement('p'); label.className='inventory-preview-label';
    label.textContent='Señala un objeto'; host.append(label);
    const names={heart:'Corazón del Bosque','sea-heart':'Corazón del Mar',torch:'Antorcha',map:'Mapa',
        'pink-sunglasses':'Lentes',helmet:'Escafandra',mate:'Mate',key:'Llave',astroscope:'Astroscopio'};
    function clear() {
        model?.traverse(o=>{o.geometry?.dispose();for(const material of o.material ? (Array.isArray(o.material)?o.material:[o.material]) : []) {material.map?.dispose();material.dispose();}});
        if(model) scene.remove(model);
    }
    function draw(time) {
        frame=null;
        if(!visible || !renderer) return;
        const delta=previous ? Math.min(.05,(time-previous)/1000) : 0; previous=time;
        if(model && !reduced.matches) model.rotation.y+=delta*.65;
        const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight-35);
        if(renderer.domElement.width!==w || renderer.domElement.height!==h) {
            renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
        }
        renderer.render(scene,camera);
        if(!reduced.matches) frame=requestAnimationFrame(draw);
    }
    function requestDraw(){if(visible && renderer && frame==null)frame=requestAnimationFrame(draw);}
    function select(item) {
        if(!names[item]) return;
        if(!renderer) {
            try {
                renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
                renderer.setPixelRatio(1);renderer.setClearColor(0,0);
                renderer.domElement.setAttribute('aria-hidden','true');host.prepend(renderer.domElement);
                scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.1,30);camera.position.set(0,.2,5.5);
                scene.add(new THREE.HemisphereLight(0xffffff,0x43505d,2));
                const light=new THREE.DirectionalLight(0xffddaa,3);light.position.set(3,4,5);scene.add(light);
            } catch(error) {label.textContent=names[item];return;}
        }
        clear();model=new THREE.Group();scene.add(model);
        function part(geometry,color,x=0,y=0,z=0){const mesh=new THREE.Mesh(geometry,
            new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.15,flatShading:true}));
            mesh.position.set(x,y,z);model.add(mesh);return mesh;}
        if(item==='heart'||item==='sea-heart') {
            const shape=new THREE.Shape();shape.moveTo(0,-.85);shape.bezierCurveTo(-1.7,.2,-.9,1.4,0,.65);
            shape.bezierCurveTo(.9,1.4,1.7,.2,0,-.85);
            part(new THREE.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.08,bevelThickness:.08}),item==='heart'?0x60c775:0x48bce5,0,0,-.14);
        } else if(item==='torch') {
            part(new THREE.CylinderGeometry(.12,.17,1.5,7),0x805132,0,-.25);
            part(new THREE.CylinderGeometry(.25,.2,.4,7),0x43352e,0,.55);
            part(new THREE.ConeGeometry(.29,.8,6),0xffa32c,0,1.05);
        } else if(item==='map') {
            for(let i=-1;i<=1;i++) {const panel=part(new THREE.BoxGeometry(.66,1.35,.035),0xd8bc82,i*.62);
                panel.rotation.y=i===0?-.18:.18;}
            for(let i=0;i<4;i++) {const line=part(new THREE.BoxGeometry(.8,.035,.02),0x708b67,-.1,(i-1.5)*.22,.08);line.rotation.z=.3;}
        } else if(item==='pink-sunglasses') {
            const goggles=createPinkSunglasses(THREE);goggles.scale.setScalar(3.6);model.add(goggles);
        } else if(item==='astroscope') {
            const telescope=createTelescope(THREE);telescope.scale.setScalar(4);
            telescope.rotateY(Math.PI/2);telescope.rotateOnWorldAxis(new THREE.Vector3(0,0,1),.35);
            model.add(telescope);
        } else if(item==='helmet') {
            part(new THREE.SphereGeometry(.75,16,10),0xb48b49);
            part(new THREE.CylinderGeometry(.8,.9,.2,12),0x88622f,0,-.65);
            part(new THREE.TorusGeometry(.42,.08,6,16),0xe0bb72,0,0,.65);
            part(new THREE.CylinderGeometry(.36,.36,.05,16),0x254955,0,0,.69).rotation.x=Math.PI/2;
        } else if(item==='mate') {
            part(new THREE.SphereGeometry(.55,12,8,0,Math.PI*2,.5,2.2),0x89512d,0,-.15);
            part(new THREE.TorusGeometry(.28,.055,6,16),0xb5bcab,0,.34).rotation.x=Math.PI/2;
            part(new THREE.CylinderGeometry(.04,.04,1.1,6),0xc5cdc6,.13,.6).rotation.z=-.25;
        } else {
            part(new THREE.TorusGeometry(.3,.09,6,12),0xd4b45e,0,.6);
            part(new THREE.BoxGeometry(.14,1.2,.14),0xd4b45e,0,-.2);
            part(new THREE.BoxGeometry(.36,.15,.14),0xd4b45e,.13,-.65);
        }
        model.rotation.set(.1,.35,0);label.textContent=names[item];requestDraw();
    }
    return {select,setVisible(value){visible=value;previous=0;if(!value){cancelAnimationFrame(frame);frame=null;}else requestDraw();}};
}
