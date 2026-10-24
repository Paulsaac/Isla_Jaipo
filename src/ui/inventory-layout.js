import { createInventoryModel } from './inventory-model.js';

export function arrangeInventory(menu) {
    const panel=menu.querySelector('.inventory-windows');panel.classList.add('inventory-orbit');
    const slots={heart:[24,13],'sea-heart':[50,23],torch:[7,65],map:[13,80],
        'pink-sunglasses':[28,87],astroscope:[93,47],helmet:[93,65],mate:[87,80],key:[72,87]};
    for(const [item,[x,y]] of Object.entries(slots)) {
        const button=menu.querySelector(`[data-item="${item}"]`),slot=button.parentElement;
        panel.append(slot);slot.classList.add('orbit-slot');
        slot.dataset.inventoryItem=item;
        if(item==='heart'||item==='sea-heart')slot.classList.add('heart-hex');
        slot.style.setProperty('--slot-x',`${x}%`);slot.style.setProperty('--slot-y',`${y}%`);
    }
    const future=menu.querySelector('#future-heart-slot');panel.append(future);
    future.classList.add('orbit-slot','heart-hex');future.style.setProperty('--slot-x','76%');future.style.setProperty('--slot-y','13%');
    panel.querySelectorAll('section.game-menu-box').forEach(section=>section.remove());
    const host=document.createElement('div');host.className='inventory-model-preview';panel.append(host);
    host.addEventListener('click',event=>event.stopPropagation());
    const preview=createInventoryModel(host);
    for(const button of menu.querySelectorAll('[data-item]')) {
        const select=()=>{if(getComputedStyle(button).display!=='none')preview.select(button.dataset.item);};
        button.addEventListener('pointerenter',select);button.addEventListener('focus',select);
        button.addEventListener('pointerdown',select);
    }
    return preview;
}
