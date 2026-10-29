export function createObservatoryZoomBar(onZoom,{onAim=()=>{},onExit=()=>{}}={}) {
    const hud=document.createElement('div');hud.id='omniscopio-hud';hud.hidden=true;
    const panel=document.createElement('aside');panel.id='omniscopio-zoom';
    panel.setAttribute('aria-label','Aumento del Omniscopio');
    const label=document.createElement('output');label.className='scope-zoom-value';label.setAttribute('aria-live','polite');
    const track=document.createElement('div');track.className='scope-zoom-track';
    const fill=document.createElement('div');fill.className='scope-zoom-fill';track.append(fill);
    const fraction=z=>z<=10?(z-2)/8*.16:z<=30?.16+(z-10)/20*.19:z<=50?.35+(z-30)/20*.20:.55+(z-50)/150*.45;
    for(const z of [2,10,30,50,100,200]) {
        const tick=document.createElement('span');tick.textContent=`${z}×`;tick.style.bottom=`${fraction(z)*100}%`;track.append(tick);
    }
    const lens=document.createElement('small');lens.className='scope-lens-name';
    const keys=document.createElement('div');keys.className='scope-zoom-keys';keys.setAttribute('aria-label','Z aumenta el zoom, X lo reduce');
    for(const [symbol,key] of [['+','Z'],['−','X']]) {
        const pair=document.createElement('span');const sign=document.createElement('span'),letter=document.createElement('kbd');
        sign.textContent=symbol;letter.textContent=key;pair.append(sign,letter);keys.append(pair);
    }
    const zoomButtons=document.createElement('div');zoomButtons.className='scope-touch-zoom';
    const heldButtons=new Map();
    function holdButton(container,text,aria,callback,identity) {
        const button=document.createElement('button');button.type='button';button.textContent=text;button.className='scope-control-button';
        button.setAttribute('aria-label',aria);button.dataset.scopeControl=identity;
        const release=()=>{if(heldButtons.has(button)){heldButtons.delete(button);callback(false);button.classList.remove('pressed');}};
        button.addEventListener('pointerdown',event=>{
            event.preventDefault();event.stopPropagation();
            if(heldButtons.has(button))return;
            heldButtons.set(button,release);button.setPointerCapture(event.pointerId);button.classList.add('pressed');callback(true);
        });
        for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{event.stopPropagation();release();});
        container.append(button);return button;
    }
    holdButton(zoomButtons,'▲','Aumentar zoom',pressed=>onZoom(1,pressed),'zoom-in');
    holdButton(zoomButtons,'▼','Reducir zoom',pressed=>onZoom(-1,pressed),'zoom-out');
    panel.append(label,track,lens,keys,zoomButtons);
    const aim=document.createElement('aside');aim.id='omniscopio-aim';aim.setAttribute('aria-label','Mover mira');
    const wasd=document.createElement('div');wasd.className='scope-aim-keys';
    for(const letter of ['W','A','S','D']) {
        const key=document.createElement('kbd');key.textContent=letter;key.dataset.key=letter;wasd.append(key);
    }
    const arrows=document.createElement('div');arrows.className='scope-touch-aim';
    for(const [direction,symbol,aria] of [['forward','▲','Subir mira'],['left','◀','Mover mira a la izquierda'],['right','▶','Mover mira a la derecha'],['backward','▼','Bajar mira']]) {
        const button=holdButton(arrows,symbol,aria,pressed=>onAim(direction,pressed),`aim-${direction}`);button.dataset.direction=direction;
    }
    const aimLabel=document.createElement('p');aimLabel.textContent='mover mira';aimLabel.className='scope-aim-label';aim.append(wasd,arrows,aimLabel);
    const exit=document.createElement('button');exit.type='button';exit.id='omniscopio-exit';exit.setAttribute('aria-label','Salir de la mira');
    const desktopExit=document.createElement('span');desktopExit.className='scope-exit-desktop';desktopExit.textContent='[E] Salir';
    const touchExit=document.createElement('span');touchExit.className='scope-exit-touch';touchExit.textContent='×';touchExit.setAttribute('aria-hidden','true');exit.append(desktopExit,touchExit);
    exit.addEventListener('click',event=>{event.stopPropagation();onExit();});
    for(const type of ['mousedown','click','contextmenu'])hud.addEventListener(type,event=>{event.preventDefault();event.stopPropagation();});
    function releaseAll(){for(const release of [...heldButtons.values()])release();}
    window.addEventListener('blur',releaseAll);
    hud.append(panel,aim,exit);document.body.append(hud);
    return {
        setVisible(value){if(!value)releaseAll();hud.hidden=!value;document.body.classList.toggle('observatory-scoping',value);},
        setZoom(value){label.textContent=`${value}×`;fill.style.height=`${fraction(value)*100}%`;lens.textContent=value>=50?'Lente estelar':'Lente normal';}
    };
}
