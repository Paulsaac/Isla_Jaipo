import {requestGamePointerLock} from './pointer-lock.js';
// Cursor del inventario sobre Pointer Lock: el ratón sigue capturado al pulsar Q.
export function createInventoryCursor(menu) {
    const cursor=document.createElement('div');
    cursor.className='inventory-virtual-cursor';cursor.hidden=true;
    cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
    const forwarded=new WeakSet();
    let hoverFrame=null;
    let visible=false,active=false,x=innerWidth/2,y=innerHeight/2,hover=null,pressed=null;
    const clamp=(value,limit)=>Math.max(0,Math.min(limit-1,value));
    function send(target,type,event={},pointer=true) {
        if(!target)return;
        const options={bubbles:!['pointerenter','pointerleave'].includes(type),cancelable:true,
            clientX:x,clientY:y,button:event.button??0,buttons:event.buttons??0,
            pointerId:event.pointerId??1,pointerType:'mouse',isPrimary:true};
        const synthetic=pointer?new PointerEvent(type,options):new MouseEvent(type,options);
        forwarded.add(synthetic);target.dispatchEvent(synthetic);
    }
    function previewDrag(target,phase,dx=0,dy=0) {
        target.dispatchEvent(new CustomEvent('inventory-preview-drag',{detail:{phase,dx,dy}}));
    }
    function sliderDrag(target,phase) {
        target.dispatchEvent(new CustomEvent('inventory-slider-drag',{detail:{phase,clientX:x,clientY:y}}));
    }
    function rangeDrag(target,finished=false) {
        // Los eventos reenviados bajo Pointer Lock no ejecutan el arrastre
        // nativo de un input range: aplicar su valor desde el cursor virtual.
        const rect=target.getBoundingClientRect(),min=Number(target.min)||0,max=Number(target.max)||100;
        const step=Number(target.step)||1,fraction=Math.max(0,Math.min(1,(x-rect.left)/rect.width));
        target.value=String(Math.max(min,Math.min(max,min+Math.round(fraction*(max-min)/step)*step)));
        target.dispatchEvent(new Event(finished?'change':'input',{bubbles:true}));
    }
    function cancelPress() {
        if(pressed?.modelDrag)previewDrag(pressed.target,'end');
        else if(pressed?.sliderDrag)sliderDrag(pressed.target,'cancel');
        else if(pressed)send(pressed.target,'pointercancel');
        pressed=null;
    }
    function hit() {
        const element=document.elementFromPoint(x,y);
        if(!element || !menu.contains(element))return menu;
        return element.closest('input[type="range"],[role="slider"],button,canvas,.inventory-model-preview,#inventory-item-description') || element;
    }
    function updateHover() {
        const next=hit();
        if(next!==hover) {
            hover?.classList.remove('is-virtual-hover');send(hover,'pointerleave');
            hover=next;hover.classList.add('is-virtual-hover');send(hover,'pointerenter');
        }
    }
    function paint() {
        x=clamp(x,innerWidth);y=clamp(y,innerHeight);
        cursor.style.transform=`translate3d(${x}px,${y}px,0)`;
        // Mover el cursor en cada entrada; consultar los slots solo una vez por fotograma.
        if(!pressed && hoverFrame===null)hoverFrame=requestAnimationFrame(()=>{
            hoverFrame=null;if(active&&!pressed)updateHover();
            if(active&&!pressed&&hover?.matches('.keyring-canvas'))send(hover,'pointermove');
        });
    }
    function sync() {
        const wasActive=active;
        active=visible && Boolean(document.pointerLockElement);
        if(active!==wasActive&&document.pointerLockElement)
            requestGamePointerLock(document.pointerLockElement,{unadjustedMovement:!active}).catch(()=>{});
        cursor.hidden=!active;
        menu.classList.toggle('has-virtual-cursor',active);
        if(active)paint();
        else {
            if(hoverFrame!==null)cancelAnimationFrame(hoverFrame);hoverFrame=null;
            cancelPress();hover?.classList.remove('is-virtual-hover');send(hover,'pointerleave');hover=null;
        }
    }
    function intercept(event) {
        if(forwarded.has(event) || !active)return;
        // Conservar los eventos de ratón compatibles que siguen al pointerdown.
        if(event.type!=='pointerdown'&&event.type!=='pointerup')event.preventDefault();
        event.stopImmediatePropagation();
        // Pointer Lock garantiza el movimiento relativo mediante MouseEvent.
        if(event.type==='mousemove') {
            const dx=Number.isFinite(event.movementX)?event.movementX:0;
            const dy=Number.isFinite(event.movementY)?event.movementY:0;
            x+=dx;y+=dy;
            if(pressed)pressed.distance+=Math.hypot(dx,dy);
            paint();
            if(pressed?.modelDrag)previewDrag(pressed.target,'move',dx,dy);
            else if(pressed?.sliderDrag)sliderDrag(pressed.target,'move');
            else if(pressed?.rangeDrag)rangeDrag(pressed.target);
            else if(pressed)send(pressed.target,'pointermove',{...event,pointerId:pressed.pointerId,buttons:1});
        } else if(event.type==='pointerdown' && event.button===0) {
            updateHover();pressed={target:hover,distance:0,pointerId:event.pointerId,
                modelDrag:hover.matches('.inventory-model-preview canvas'),
                sliderDrag:hover.matches('[role="slider"]'),
                rangeDrag:hover.matches('input[type="range"]')&&!hover.disabled};
            if(pressed.modelDrag)previewDrag(hover,'start');
            else if(pressed.sliderDrag)sliderDrag(hover,'start');
            else if(pressed.rangeDrag){hover.focus({preventScroll:true});rangeDrag(hover);}
            else send(hover,'pointerdown',event);
        } else if(event.type==='pointerup' && event.button===0) {
            const released=pressed;pressed=null;
            if(released?.modelDrag)previewDrag(released.target,'end');
            else if(released?.sliderDrag)sliderDrag(released.target,'end');
            else if(released?.rangeDrag)rangeDrag(released.target,true);
            else send(released?.target||hover,'pointerup',event);
            updateHover();
            if(released && !released.modelDrag && released.target===hover && released.distance<6)send(hover,'click',event,false);
        } else if(event.type==='pointercancel')cancelPress();
    }
    for(const type of ['mousemove','pointermove','pointerdown','pointerup','pointercancel','mousedown','mouseup','click','dblclick','contextmenu'])
        document.addEventListener(type,intercept,true);
    document.addEventListener('pointerlockchange',sync);
    window.addEventListener('resize',()=>{if(active)paint();});
    window.addEventListener('blur',cancelPress);
    return {setVisible(value){visible=value;sync();}};
}
