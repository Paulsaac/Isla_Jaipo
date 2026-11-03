// Controles de prueba del inventario; el llamador conserva el estado del juego.
export function createTestControls({parent,getState,onFlight,onSky,onFlightSpeed,onCrt,onFog,onKeys}) {
    const sheet=document.createElement('link');sheet.rel='stylesheet';
    sheet.href=new URL('./test-controls.css',import.meta.url).href;document.head.append(sheet);
    const host=document.createElement('details');host.className='inventory-test-controls';host.hidden=true;
    host.open=!matchMedia('(max-width:600px), (max-height:500px)').matches;
    host.innerHTML=`<summary>Menú de pruebas</summary><div class="test-controls-body">
        <button type="button" class="test-flight-toggle" role="switch" aria-checked="false">Vuelo: desactivado</button>
        <label class="test-flight-speed">Velocidad de vuelo <output>2×</output>
        <input type="range" min="0.25" max="4" step="0.25" value="2" aria-label="Velocidad de vuelo"></label>
        <span class="test-sky-label">Cielo</span><div class="test-sky-options" role="group" aria-label="Momento del día">
        <button type="button" data-sky="dawn" aria-pressed="false">Amanecer</button>
        <button type="button" data-sky="day" aria-pressed="false">Día</button>
        <button type="button" data-sky="dusk" aria-pressed="false">Atardecer</button>
        <button type="button" data-sky="night" aria-pressed="false">Noche</button>
        </div><button type="button" class="test-sky-auto" data-sky="auto" aria-pressed="true">Cielo automático</button>
        <button type="button" class="test-crt-toggle" role="switch" aria-checked="true">CRT: activado</button>
        <button type="button" class="test-fog-toggle" role="switch" aria-checked="true">Fog: activado</button>
        </div><section class="test-keyring-extension" aria-label="Pruebas del llavero"><span>Llaves</span>
        <button type="button" data-keys="1">Añadir 1 llave</button>
        <button type="button" data-keys="2">Añadir 2 llaves</button>
        <button type="button" data-keys="3">Añadir 3 llaves</button>
        <button type="button" data-keys="4">Añadir 4 llaves</button></section>`;
    parent.append(host);
    const flight=host.querySelector('.test-flight-toggle'),phases=[...host.querySelectorAll('[data-sky]')];
    const crt=host.querySelector('.test-crt-toggle');
    const fog=host.querySelector('.test-fog-toggle');
    const speed=host.querySelector('.test-flight-speed input'),speedLabel=host.querySelector('.test-flight-speed output');
    let previous='';
    speed.addEventListener('input',event=>{event.stopPropagation();onFlightSpeed?.(Number(speed.value));update();});
    host.addEventListener('click',event=>{
        event.stopPropagation();const button=event.target.closest('button');if(!button||button.disabled)return;
        if(button===flight)onFlight();else if(button===crt)onCrt?.();else if(button===fog)onFog?.();else if(button.dataset.keys)onKeys?.(Number(button.dataset.keys));else if(button.dataset.sky)onSky(button.dataset.sky==='auto'?null:button.dataset.sky);
        update();
    });
    function update(){
        const state=getState(),key=JSON.stringify(state);if(key===previous)return;previous=key;
        host.hidden=!state.enabled;if(host.hidden)return;
        crt.setAttribute('aria-checked',String(state.crtEnabled));
        crt.textContent=`CRT: ${state.crtEnabled?'activado':'desactivado'}`;
        fog.setAttribute('aria-checked',String(state.fogEnabled!==false));
        fog.textContent=`Fog: ${state.fogEnabled!==false?'activado':'desactivado'}`;
        flight.disabled=state.flightDisabled;flight.setAttribute('aria-checked',String(state.flying));
        flight.textContent=`Vuelo: ${state.flying?'activado':'desactivado'}`;
        speed.disabled=state.flightDisabled;
        speed.value=state.flightSpeed??2;
        speedLabel.value=`${Number(speed.value).toLocaleString('es-CL')}×`;
        speed.setAttribute('aria-valuetext',speedLabel.value);
        for(const button of phases){button.disabled=state.skyDisabled;button.setAttribute('aria-pressed',String((state.phase??'auto')===button.dataset.sky));}
    }
    return {update};
}
