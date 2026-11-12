// La rampa de audio continúa aunque la carga ocupe el hilo principal.
import { isChannelActive, onChannelChange } from '../input/channel-state.js';
const audio = new Audio('./sonidos/fx/isla_menu_web.mp3');
audio.loop = true;
audio.preload = 'metadata';
let context = null, gain = null, ending = false, stopTimer = null;
let started = false;

function removeUnlock() {
    document.removeEventListener('pointerdown', start);
    document.removeEventListener('keydown', start);
}
function start() {
    if (ending || !isChannelActive()) return;
    if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        gain = context.createGain();
        gain.gain.value = 0.2205;
        context.createMediaElementSource(audio).connect(gain);
        gain.connect(context.destination);
    }
    context.resume().then(() => {
        if (ending || !isChannelActive()) return;
        return audio.play().then(removeUnlock);
    }).catch(error => {
        // Si se bloquea autoplay, el siguiente gesto vuelve a intentarlo.
        if (error.name !== 'NotAllowedError' && error.name !== 'AbortError')
            console.warn('No se pudo reproducir la música de inicio:', error);
    });
}
function stop() {
    ending = true;
    removeUnlock();
    clearTimeout(stopTimer);
    audio.pause();
    if (context && context.state !== 'closed') context.close().catch(() => {});
}
export const menuMusic = {
    start() {
        started = true;
        document.addEventListener('pointerdown', start);
        document.addEventListener('keydown', start);
        start();
    },
    fadeOut() {
        if (ending) return;
        ending = true;
        removeUnlock();
        if (!gain) return;
        const now = context.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now+2);
        stopTimer = setTimeout(stop, 2100);
    },
    stop
};

onChannelChange(active => {
    if (!active) {
        audio.pause();
        if (context && context.state !== 'closed') context.suspend().catch(() => {});
    } else if (started && !ending) start();
});
