export function createObservatoryZoomBar(onZoom) {
    const panel=document.createElement('aside');panel.id='omniscopio-zoom';panel.hidden=true;
    panel.setAttribute('aria-label','Aumento del Omniscopio');
    panel.style.cssText='position:fixed;right:max(14px,3vw);top:50%;transform:translateY(-50%);z-index:8;color:#eee;font:12px "Super Legend Boy",monospace;text-shadow:1px 2px 2px #000;text-align:center;';
    const label=document.createElement('output');label.style.cssText='display:block;margin-bottom:18px;font-size:19px;';
    label.setAttribute('aria-live','polite');
    const track=document.createElement('div');track.style.cssText='position:relative;width:2px;height:min(36vh,240px);margin:0 30px;background:#ffffff40;';
    const fill=document.createElement('div');fill.style.cssText='position:absolute;bottom:0;width:2px;background:#d9e9ef;';track.append(fill);
    const fraction=z=>z<=10?(z-2)/8*.16:z<=30?.16+(z-10)/20*.19:z<=50?.35+(z-30)/20*.20:.55+(z-50)/150*.45;
    for(const z of [2,10,30,50,100,200]){
        const tick=document.createElement('span');tick.textContent=`${z}×`;
        tick.style.cssText=`position:absolute;left:9px;bottom:${fraction(z)*100}%;transform:translateY(50%);font-size:10px;white-space:nowrap;`;
        track.append(tick);
    }
    const lens=document.createElement('small');lens.style.cssText='display:block;margin:19px 0 12px;font-size:9px;';
    const keys=document.createElement('div');keys.style.cssText='display:flex;gap:12px;justify-content:center;';
    for(const [direction,text]of [[-1,'−'],[1,'+']]){
        const button=document.createElement('button');button.type='button';button.textContent=text;
        button.setAttribute('aria-label',direction>0?'Aumentar zoom':'Reducir zoom');
        button.style.cssText='font:20px monospace;color:#eee;background:#071018a8;border:0;border-radius:6px;width:30px;height:32px;touch-action:none;';
        button.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();button.setPointerCapture(event.pointerId);onZoom(direction,true);});
        const release=event=>{event.stopPropagation();onZoom(direction,false);};
        for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
        keys.append(button);
    }
    for(const type of ['mousedown','click','contextmenu'])panel.addEventListener(type,event=>{event.preventDefault();event.stopPropagation();});
    const hint=document.createElement('p');hint.hidden=true;
    hint.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:90%;z-index:8;pointer-events:none;text-align:center;color:#ccc;font:10px "Super Legend Boy",monospace;text-shadow:1px 2px 2px #000;';
    hint.textContent=matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).get('touch')==='1'
        ?'Cruceta: apuntar · + / −: zoom · B: volver':'Flechas: apuntar · Z (+) / X (−): zoom · E: volver';
    panel.append(label,track,lens,keys);document.body.append(panel,hint);
    return {setVisible(value){panel.hidden=hint.hidden=!value;},setZoom(value){label.textContent=`${value}×`;fill.style.height=`${fraction(value)*100}%`;lens.textContent=value>=50?'Lente estelar':'Lente normal';}};
}
