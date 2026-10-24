// Menú exclusivo del Omniscopio. No comparte DOM, escritura ni progreso con NPC.
export function createObservatoryMenu() {
    const panel=document.createElement('section');
    panel.id='omniscopio-menu';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-labelledby','omniscopio-menu-title');
    panel.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(90vw,680px);max-height:85dvh;overflow:auto;padding:24px;border:3px solid #a9d8e7;border-radius:12px;background:rgba(8,16,27,.96);color:#fff;z-index:250;font-family:"Super Legend Boy","Press Start 2P",cursive;text-align:center;';
    const title=document.createElement('h2');title.id='omniscopio-menu-title';title.textContent='Omniscopio';
    title.style.cssText='color:#a9d8e7;font-size:20px;margin:0 0 18px;';
    const prompt=document.createElement('p');prompt.style.cssText='font-size:16px;line-height:1.6;';
    const tray=document.createElement('div');tray.style.cssText='display:flex;gap:14px;justify-content:center;flex-wrap:wrap;';
    const hint=document.createElement('p');hint.style.cssText='font-size:11px;line-height:1.6;color:#bac5d2;margin:20px 0 0;';
    hint.textContent=matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).get('touch')==='1'
        ?'Toca una opción para elegir.' :'←/→ Elegir · E Confirmar · Esc Cancelar';
    panel.append(title,prompt,tray,hint);document.body.append(panel);
    let state=null;
    function hide() {
        state=null;panel.hidden=true;tray.replaceChildren();
    }
    function finish(index) {
        if(!state)return;
        const callback=state.onChoose;hide();callback(index);
    }
    function markSelected() {
        state.buttons.forEach((button,index)=>button.style.outline=index===state.selected?'3px solid #d5b9ff':'none');
        state.buttons[state.selected]?.focus({preventScroll:true});
    }
    function show(text,options,onChoose,selected=0) {
        if(state)return false;
        prompt.textContent=text;
        state={onChoose,selected:Math.max(0,Math.min(options.length-1,selected)),buttons:[]};
        for(const [index,label] of options.entries()) {
            const button=document.createElement('button');button.type='button';button.textContent=label;
            button.style.cssText='min-width:min(150px,100%);padding:12px 18px;border:2px solid #a9d8e7;border-radius:8px;background:#1a2637;color:#fff;font:14px "Super Legend Boy","Press Start 2P",cursive;cursor:pointer;';
            button.addEventListener('click',()=>finish(index));tray.append(button);state.buttons.push(button);
        }
        panel.hidden=false;markSelected();return true;
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
            state.selected=(state.selected+(backwards?-1:1)+state.buttons.length)%state.buttons.length;markSelected();
        } else if(['Enter','NumpadEnter','KeyE','Space'].includes(event.code))finish(state.selected);
        else if(event.code==='Escape')finish(-1);
    },true);
    return {show,hide,get active(){return !!state;}};
}
