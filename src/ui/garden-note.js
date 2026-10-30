const curiosities=[
    'el verdadero olor a tomate no está en la fruta, sino en los tallos',
    'las hojas de la zanahoria saben a perejil',
    'el efecto mental del mate dura harto tiempo después de tomarlo'
];

export function createGardenNote(onClose) {
    const handwriting=new FontFace('Graham Handwriting',`url("${new URL('./fonts/Caveat-variable.ttf',import.meta.url).href}")`);
    document.fonts.add(handwriting);handwriting.load().catch(()=>{});
    const overlay=document.createElement('div');overlay.id='graham-garden-note';
    overlay.style.cssText='display:none;position:fixed;inset:0;z-index:260;background:#07101980;align-items:center;justify-items:center;padding:18px;box-sizing:border-box;';
    const paper=document.createElement('section');paper.setAttribute('role','dialog');paper.setAttribute('aria-modal','true');paper.setAttribute('aria-labelledby','garden-note-title');
    paper.style.cssText='box-sizing:border-box;width:min(540px,100%);max-height:90dvh;overflow:auto;padding:clamp(20px,5vw,38px);background:repeating-linear-gradient(transparent 0 35px,#9caca533 35px 36px),#eee1bd;color:#362e24;box-shadow:3px 7px 0 #46382c,0 16px 55px #0009;transform:rotate(-1deg);font:clamp(24px,4.5vw,30px)/1.2 "Graham Handwriting","Segoe Print",cursive;';
    const heading=document.createElement('h2');heading.id='garden-note-title';heading.textContent='Curioso:';heading.style.cssText='font:inherit;font-size:1.4em;margin:0 0 12px;';
    const list=document.createElement('ul');list.style.cssText='list-style:none;padding:0;margin:0;';
    for(const text of curiosities){const item=document.createElement('li');item.textContent='- '+text;item.style.cssText='margin:0 0 18px;';list.append(item);}
    const close=document.createElement('button');close.type='button';close.textContent='Cerrar';close.style.cssText='display:block;margin:20px 0 0 auto;padding:6px 20px;border:1px solid #756447;background:#e4d4aa;color:inherit;font:inherit;cursor:pointer;';
    paper.append(heading,list,close);overlay.append(paper);document.body.append(overlay);
    let active=false;
    function hide(){active=false;overlay.style.display='none';}
    function finish(){if(!active)return;hide();onClose();}
    close.addEventListener('click',finish);
    for(const type of ['click','mousedown','pointerdown'])overlay.addEventListener(type,event=>event.stopPropagation());
    overlay.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();});
    document.addEventListener('keydown',event=>{
        if(!active)return;
        event.preventDefault();event.stopImmediatePropagation();
        if(!event.repeat&&['Escape','KeyE','Enter','NumpadEnter'].includes(event.code))finish();
    },true);
    return {show(){active=true;overlay.style.display='grid';close.focus({preventScroll:true});},hide,get active(){return active;}};
}
