import {requestGamePointerLock} from './pointer-lock.js';

let loading=false,interrupted=false,hadCapture=false,pending=null;
function markAway(){if(loading)interrupted=true;}
function visibility(){if(document.hidden)markAway();}
function captureChanged(){
    if(document.pointerLockElement===document.body)hadCapture=true;
    else if(hadCapture)markAway();
}
export function beginLoadingPointerCapture(){
    loading=true;interrupted=false;hadCapture=false;
    window.addEventListener('blur',markAway);
    document.addEventListener('visibilitychange',visibility);
    document.addEventListener('pointerlockchange',captureChanged);
    // Reservar con el gesto inicial: al terminar una carga larga el navegador
    // puede exigir otro clic si se solicita la primera captura recién entonces.
    if(!document.hidden&&document.hasFocus())pending=requestGamePointerLock(document.body).catch(()=>{});
    else interrupted=true;
}
export async function finishLoadingPointerCapture(){
    await pending;
    const canCapture=loading&&!interrupted&&!document.hidden&&document.hasFocus();
    loading=false;pending=null;
    window.removeEventListener('blur',markAway);
    document.removeEventListener('visibilitychange',visibility);
    document.removeEventListener('pointerlockchange',captureChanged);
    return canCapture;
}
