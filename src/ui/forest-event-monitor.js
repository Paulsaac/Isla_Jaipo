import { FOREST_CUES } from '../content/forest-cues.js';

// Herramienta temporal de autoría; el estado del evento pertenece al llamador.
export function createForestEventMonitor({parent,getState,onSeek,onToggle,onStop,onForest}) {
    const inventoryKey=matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).get('touch')==='1'?'SELECT':'Q';
    const sheet=document.createElement('link');sheet.rel='stylesheet';
    sheet.href=new URL('./forest-event-monitor.css',import.meta.url).href;document.head.append(sheet);
    const host=document.createElement('details');host.className='forest-event-monitor';host.hidden=true;
    host.open=false;
    host.innerHTML=`<summary>Reproductor Evento Bosque</summary>
        <div class="forest-monitor-body">
          <div class="forest-monitor-controls">
            <button type="button" data-action="back" aria-label="Retroceder cinco segundos">−5 s</button>
            <button type="button" data-action="play">Reproducir</button>
            <button type="button" data-action="forward" aria-label="Avanzar cinco segundos">+5 s</button>
            <output class="forest-monitor-time">0:00.000 / —</output>
            <button type="button" data-action="forest">Ir al corazón</button>
            <button type="button" data-action="stop">Volver a posición</button>
          </div>
          <div class="forest-monitor-timeline" role="slider" tabindex="0" aria-label="Tiempo de canción y visuales" aria-valuemin="0" aria-valuemax="200" aria-valuenow="0">
            <div class="forest-monitor-track"><span class="forest-monitor-progress"></span><i class="forest-monitor-thumb"></i></div>
          </div>
          <div class="forest-monitor-marks" aria-label="Marcas del evento"></div>
          <p class="forest-monitor-status" aria-live="polite">Canción, visuales y levitación · sin cambiar el progreso</p>
        </div>`;
    parent.append(host);
    const bar=host.querySelector('.forest-monitor-timeline'),fill=host.querySelector('.forest-monitor-progress');
    const thumb=host.querySelector('.forest-monitor-thumb'),marks=host.querySelector('.forest-monitor-marks');
    const time=host.querySelector('output'),play=host.querySelector('[data-action="play"]');
    const stop=host.querySelector('[data-action="stop"]'),status=host.querySelector('.forest-monitor-status');
    let error='',drag=null,seekFrame=null,desired=0,lastDuration=0,wasEnabled=false;
    let pendingTime=null,seekVersion=0;
    let touchPress=null,lastTouchTarget=null,lastTouchAt=-Infinity;
    const format=value=>{
        const milliseconds=Math.round(value*1000);
        return `${Math.floor(milliseconds/60000)}:${((milliseconds%60000)/1000).toFixed(3).padStart(6,'0')}`;
    };
    const duration=()=>getState().duration||FOREST_CUES.at(-1);
    function invoke(action) {error='';Promise.resolve().then(action).catch(e=>{error=e.message;update();});}
    for(const event of ['click','pointerdown','pointermove','pointerup','contextmenu'])host.addEventListener(event,e=>e.stopPropagation());
    // Algunos móviles suprimen el click de compatibilidad después de arrastrar.
    host.addEventListener('pointerdown',event=>{
        const target=event.target.closest('button,summary');
        if(event.pointerType==='touch'&&target&&!target.disabled)
            touchPress={target,id:event.pointerId,x:event.clientX,y:event.clientY};
    });
    host.addEventListener('pointerup',event=>{
        const press=touchPress;touchPress=null;
        if(!press||press.id!==event.pointerId||Math.hypot(event.clientX-press.x,event.clientY-press.y)>12)return;
        event.preventDefault();lastTouchTarget=press.target;lastTouchAt=performance.now();press.target.click();
    });
    host.addEventListener('pointercancel',()=>{touchPress=null;});
    host.addEventListener('click',event=>{
        if(event.isTrusted&&event.target.closest('button,summary')===lastTouchTarget&&performance.now()-lastTouchAt<700) {
            event.preventDefault();event.stopImmediatePropagation();
        }
    },true);
    host.addEventListener('keydown',event=>{
        if(event.target.closest('button,summary')&&['Enter','Space'].includes(event.code))event.stopPropagation();
    });
    const markerButtons=FOREST_CUES.map((seconds,index)=>{
        const button=document.createElement('button');button.type='button';button.textContent=String(index);
        button.title=`Marca ${index} · ${format(seconds)}`;button.setAttribute('aria-label',button.title);
        button.addEventListener('click',()=>invoke(()=>onSeek(seconds,getState().playing)));
        marks.append(button);return button;
    });
    host.querySelector('[data-action="back"]').onclick=()=>invoke(()=>onSeek(Math.max(0,getState().time-5),getState().playing));
    host.querySelector('[data-action="forward"]').onclick=()=>invoke(()=>onSeek(Math.min(duration(),getState().time+5),getState().playing));
    play.onclick=()=>invoke(onToggle);stop.onclick=()=>invoke(onStop);
    host.querySelector('[data-action="forest"]').onclick=()=>invoke(onForest);
    function pointerTime(event) {
        const rect=drag?.rect??bar.getBoundingClientRect();
        return Math.max(0,Math.min(1,(event.clientX-rect.left-(drag?.offset??0))/rect.width))*(drag?.duration??duration());
    }
    function seekTime(value,resume) {
        const version=++seekVersion;pendingTime=value;update();
        invoke(async()=>{try{await onSeek(value,resume);}finally{if(version===seekVersion){pendingTime=null;update();}}});
    }
    function startDrag(event) {
        const rect=bar.getBoundingClientRect(),end=duration(),at=getState().time;
        const thumbX=rect.left+Math.max(0,Math.min(end,at))/end*rect.width;
        drag={playing:getState().playing,rect,duration:end,
            offset:Math.abs(event.clientX-thumbX)<=12?event.clientX-thumbX:0};
        desired=pointerTime(event);seekTime(desired,false);
    }
    function moveDrag(event) {
        if(!drag)return;desired=pointerTime(event);update();
        if(seekFrame===null)seekFrame=requestAnimationFrame(()=>{seekFrame=null;seekTime(desired,false);});
    }
    bar.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;event.preventDefault();
        startDrag(event);
        if(event.isTrusted)try{bar.setPointerCapture(event.pointerId);}catch{}
    });
    bar.addEventListener('pointermove',moveDrag);
    function release(event,cancelled=false) {
        if(!drag)return;
        if(seekFrame!==null)cancelAnimationFrame(seekFrame);seekFrame=null;
        const resume=drag.playing;
        if(!cancelled)desired=pointerTime(event);
        drag=null;seekTime(desired,resume);
    }
    bar.addEventListener('pointerup',event=>release(event));
    bar.addEventListener('pointercancel',event=>release(event,true));
    bar.addEventListener('inventory-slider-drag',event=>{
        const data=event.detail;
        if(data.phase==='start')startDrag(data);
        else if(data.phase==='move')moveDrag(data);
        else release(data,data.phase==='cancel');
    });
    bar.addEventListener('keydown',event=>{
        const state=getState();let value;
        if(event.key==='ArrowLeft')value=state.time-(event.shiftKey?5:1);
        if(event.key==='ArrowRight')value=state.time+(event.shiftKey?5:1);
        if(event.key==='Home')value=0;if(event.key==='End')value=duration();
        if(value===undefined)return;event.preventDefault();event.stopPropagation();
        invoke(()=>onSeek(Math.max(0,Math.min(duration(),value)),state.playing));
    });
    host.addEventListener('toggle',()=>parent.classList.toggle('forest-monitor-expanded',!host.hidden&&host.open));
    function update() {
        const state=getState(),enabled=!!state.enabled;
        if(enabled&&!wasEnabled)host.open=false;
        wasEnabled=enabled;
        host.hidden=!enabled;
        parent.classList.toggle('has-forest-monitor',enabled);
        parent.classList.toggle('forest-monitor-expanded',enabled&&host.open);
        if(!enabled)return;
        const end=drag?.duration??duration(),at=Math.max(0,Math.min(end,drag?desired:pendingTime??state.time));
        const percent=100*at/end;
        fill.style.width=`${percent}%`;thumb.style.left=`${percent}%`;
        time.value=`${format(at)} / ${format(end)}`;
        play.textContent=state.playing?'Pausar':'Reproducir';stop.disabled=!(state.active||state.returnAvailable);
        bar.setAttribute('aria-valuemax',String(end));bar.setAttribute('aria-valuenow',at.toFixed(3));
        bar.setAttribute('aria-valuetext',format(at));
        const current=FOREST_CUES.reduce((value,cue,index)=>at>=cue?index:value,0);
        markerButtons.forEach((button,index)=>{
            if(end!==lastDuration)button.style.left=`${100*FOREST_CUES[index]/end}%`;
            button.classList.toggle('is-current',state.active&&index===current);
        });lastDuration=end;
        const message=error||(state.active?`Marca ${current} · ${state.playing?'reproduciendo':'pausado'} · ${inventoryKey} para ver sin inventario`
            :'Canción, visuales y levitación · sin cambiar el progreso');
        if(status.textContent!==message)status.textContent=message;
    }
    update();return {update,element:host};
}
