import { createInventoryCursor } from '../input/inventory-cursor.js';

// Menú exclusivo del Omniscopio. No comparte DOM, escritura ni progreso con NPC.
export function createObservatoryMenu() {
    const panel=document.createElement('section');
    panel.id='omniscopio-menu';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-labelledby','omniscopio-menu-question');
    panel.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(92vw,720px);max-height:80dvh;overflow:auto;padding:28px 24px;border:0;background:radial-gradient(ellipse,#020705a6,transparent 72%);color:#fff;z-index:250;font-family:"Super Legend Boy","Press Start 2P",cursive;text-shadow:1px 2px 2px #000,-1px 0 2px #000;text-align:center;';
    const prompt=document.createElement('p');prompt.id='omniscopio-menu-question';
    prompt.style.cssText='font-size:clamp(14px,2.3vw,18px);line-height:1.8;margin:0 0 20px;';
    const tray=document.createElement('div');tray.style.cssText='display:flex;justify-content:center;gap:12px 36px;flex-wrap:wrap;';
    panel.append(prompt,tray);document.body.append(panel);
    const cursor=createInventoryCursor(panel);
    let state=null;
    function hide() {
        cursor.setVisible(false);state=null;panel.hidden=true;tray.replaceChildren();
    }
    function finish(index) {
        if(!state)return;
        const callback=state.onChoose;hide();callback(index);
    }
    function markSelected(focus=false) {
        state.buttons.forEach((button,index)=>{
            const selected=index===state.selected;button.style.opacity=selected?'1':'.55';
            button.style.textDecoration=selected?'underline':'none';button.setAttribute('aria-pressed',String(selected));
        });
        if(focus)state.buttons[state.selected]?.focus({preventScroll:true});
    }
    function show(text,options,onChoose,selected=0) {
        if(state)return false;
        prompt.textContent=text;
        state={onChoose,selected:Math.max(0,Math.min(options.length-1,selected)),buttons:[]};
        for(const [index,label] of options.entries()) {
            const button=document.createElement('button');button.type='button';button.textContent=label;
            button.style.cssText='padding:10px 22px;border:0;outline:none;background:transparent;color:#fff;font:16px "Super Legend Boy","Press Start 2P",cursive;text-shadow:inherit;text-underline-offset:6px;cursor:pointer;';
            button.addEventListener('pointerenter',()=>{if(state){state.selected=index;markSelected();}});
            button.addEventListener('click',()=>finish(index));tray.append(button);state.buttons.push(button);
        }
        panel.hidden=false;markSelected();cursor.setVisible(true);return true;
    }
    for(const type of ['click','mousedown','pointerdown'])panel.addEventListener(type,event=>event.stopPropagation());
    panel.addEventListener('contextmenu',event=>{
        event.preventDefault();event.stopPropagation();
    });
    document.addEventListener('keydown',event=>{
        if(!state)return;
        event.preventDefault();event.stopImmediatePropagation();
        if(event.repeat)return;
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'].includes(event.code)) {
            const backwards=event.code==='ArrowLeft'||event.code==='ArrowUp'||(event.code==='Tab'&&event.shiftKey);
            state.selected=(state.selected+(backwards?-1:1)+state.buttons.length)%state.buttons.length;markSelected(true);
        } else if(['Enter','NumpadEnter','KeyE','Space'].includes(event.code))finish(state.selected);
        else if(event.code==='Escape')finish(-1);
    },true);
    return {show,hide,get active(){return !!state;}};
}
