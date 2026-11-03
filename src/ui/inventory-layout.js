import { createInventoryModel } from './inventory-model.js';

export function arrangeInventory(menu) {
    const panel=menu.querySelector('.inventory-windows');panel.classList.add('inventory-orbit');
    const slots={heart:[24,13],'sea-heart':[50,23],torch:[7,65],map:[13,80],
        helmet:[28,87],mate:[93,65],'pink-sunglasses':[87,80],astroscope:[72,87],key:[72,87]};
    let lastSlot=null;
    function highlight(slot) {
        if(lastSlot===slot)return;
        lastSlot?.classList.remove('last-pointed-slot');lastSlot=slot;slot.classList.add('last-pointed-slot');
    }
    function clearEmptyHighlight(slot) {
        const button=slot.querySelector('[data-item]');
        if(lastSlot!==slot||(button&&getComputedStyle(button).display!=='none'))return;
        slot.classList.remove('last-pointed-slot');lastSlot=null;
    }
    for(const [item,[x,y]] of Object.entries(slots)) {
        const button=menu.querySelector(`[data-item="${item}"]`),slot=button.parentElement;
        panel.append(slot);slot.classList.add('orbit-slot');
        slot.dataset.inventoryItem=item;
        if(item==='heart'||item==='sea-heart')slot.classList.add('heart-hex');
        slot.addEventListener('pointerenter',()=>{
            if(getComputedStyle(button).display!=='none'){highlight(slot);preview.select(item);}
        });
        slot.addEventListener('pointerleave',()=>clearEmptyHighlight(slot));
        button.addEventListener('pointerleave',()=>clearEmptyHighlight(slot));
        slot.style.setProperty('--slot-x',`${x}%`);slot.style.setProperty('--slot-y',`${y}%`);
    }
    const future=menu.querySelector('#future-heart-slot');panel.append(future);
    future.classList.add('orbit-slot','heart-hex');future.style.setProperty('--slot-x','76%');future.style.setProperty('--slot-y','13%');
    future.addEventListener('pointerenter',()=>{
        const button=future.querySelector('[data-item]');
        if(button&&getComputedStyle(button).display!=='none'){highlight(future);preview.select(button.dataset.item);}
    });
    future.addEventListener('pointerleave',()=>clearEmptyHighlight(future));
    // Si se entrega o retira el objeto seleccionado, tampoco dejar un brillo vacío.
    new MutationObserver(changes=>{
        if(lastSlot&&changes.some(change=>change.target===lastSlot
            ||change.target===lastSlot.querySelector('[data-item]')))clearEmptyHighlight(lastSlot);
    }).observe(panel,{attributes:true,attributeFilter:['style'],subtree:true});
    panel.querySelectorAll('section.game-menu-box').forEach(section=>section.remove());
    const host=document.createElement('div');host.className='inventory-model-preview';panel.append(host);
    host.addEventListener('click',event=>event.stopPropagation());
    const preview=createInventoryModel(host);
    for(const button of menu.querySelectorAll('[data-item]')) {
        const select=()=>{if(getComputedStyle(button).display!=='none'){
            highlight(button.closest('.orbit-slot'));preview.select(button.dataset.item);
        }};
        button.addEventListener('pointerenter',select);button.addEventListener('focus',select);
        button.addEventListener('pointerdown',select);
    }
    return preview;
}
