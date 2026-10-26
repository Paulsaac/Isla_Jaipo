// Menú exclusivo del Omniscopio. No comparte DOM, escritura ni progreso con NPC.
export function createObservatoryMenu() {
    const panel=document.createElement('section');
    panel.id='omniscopio-menu';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-labelledby','omniscopio-menu-title');
    panel.style.cssText='position:fixed;left:50%;bottom:6%;transform:translateX(-50%);box-sizing:border-box;width:min(88vw,760px);max-height:80dvh;overflow:auto;padding:24px 30px;border:0;border-radius:22px;background:rgba(2,7,5,.94);backdrop-filter:blur(4px);box-shadow:0 0 20px 10px #02070599;color:#fff;z-index:250;font-family:"Super Legend Boy","Press Start 2P",cursive;text-shadow:1px 2px 2px #000;text-align:left;';
    const title=document.createElement('h2');title.id='omniscopio-menu-title';title.textContent='Omniscopio';
    title.style.cssText='color:#d3dbd2;font-size:12px;font-weight:normal;margin:0 0 12px;';
    const prompt=document.createElement('p');prompt.style.cssText='font-size:16px;line-height:1.8;margin:0 0 14px;';
    const tray=document.createElement('div');tray.style.cssText='display:flex;gap:10px 24px;flex-wrap:wrap;';
    const hint=document.createElement('p');hint.style.cssText='font-size:10px;line-height:1.6;color:#abb4ab;margin:14px 0 0;';
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
        state.buttons.forEach((button,index)=>{
            const selected=index===state.selected;button.style.opacity=selected?'1':'.55';
            button.style.textDecoration=selected?'underline':'none';button.setAttribute('aria-pressed',String(selected));
        });
        state.buttons[state.selected]?.focus({preventScroll:true});
    }
    function show(text,options,onChoose,selected=0) {
        if(state)return false;
        prompt.textContent=text;
        state={onChoose,selected:Math.max(0,Math.min(options.length-1,selected)),buttons:[]};
        for(const [index,label] of options.entries()) {
            const button=document.createElement('button');button.type='button';button.textContent=label;
            button.style.cssText='padding:8px 0;border:0;outline-offset:5px;background:transparent;color:#fff;font:14px "Super Legend Boy","Press Start 2P",cursive;text-underline-offset:5px;cursor:pointer;';
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
