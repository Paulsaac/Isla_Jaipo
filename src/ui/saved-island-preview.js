import * as THREE from 'three';
import { createIslandPreviewRenderer } from './island-preview-renderer.js';
import { menuMusic } from './menu-music.js';
import { testMode, createTestModeSequence } from '../input/test-mode.js';

export async function createSavedIslandPreview() {
    const menu = document.getElementById('main-menu');
    const shade = document.getElementById('intro-shade');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const diagnostics = new URLSearchParams(location.search).get('perf') === '1';
    const settings = {
        modelUrl: new URL('../../imagenes/Portada/isla-maqueta.bin',import.meta.url).href,
        textureBase: new URL('../../imagenes/Texturas/',import.meta.url).href,
        width: Math.max(1,menu.clientWidth), height: Math.max(1,menu.clientHeight), reduced, diagnostics
    };
    function canvasElement() {
        const canvas = document.createElement('canvas');
        canvas.id = 'saved-island-preview';
        canvas.setAttribute('aria-hidden','true');
        menu.prepend(canvas);
        return canvas;
    }
    let canvas = canvasElement(), driver, worker, night = false, themeHint = null;
    let themeSwitchActive = true;
    function updateThemeHint() {
        if (!themeHint) return;
        themeHint.hidden = !testMode.enabled || !themeSwitchActive;
        themeHint.textContent = night ? '[Modo de prueba · L] Ver día' : '[Modo de prueba · L] Ver noche';
    }
    function reportTheme(enabled) {
        night=Boolean(enabled);
        document.body.dataset.previewTheme=night ? 'night' : 'day';
        updateThemeHint();
    }
    const presentation = {};
    let latestFreeFrame = null, freeFrameScheduled = false;
    const longTasks = [];
    let observer;
    if (diagnostics && globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')) {
        observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) longTasks.push({start:entry.startTime,duration:entry.duration});
            document.body.dataset.previewLongTasks = JSON.stringify(longTasks.slice(-100));
        });
        observer.observe({type:'longtask'});
    }
    function recordPresentation(state) {
        if (!diagnostics) return;
        const now = performance.now();
        const stats = presentation[state.phase] ??= {frames:0,maxGapMs:0,maxZoomStep:0,last:now,scale:state.scale};
        if (stats.frames) {
            stats.maxGapMs = Math.max(stats.maxGapMs, now - stats.last);
            stats.maxZoomStep = Math.max(stats.maxZoomStep, Math.abs(Math.log(state.scale / stats.scale)));
        }
        stats.frames++;
        stats.last = now;
        stats.scale = state.scale;
        document.body.dataset.previewPresentation = JSON.stringify(presentation);
    }
    const transition = {};
    const markTransition = key => {
        if (!diagnostics) return;
        transition[key] = performance.now();
        document.body.dataset.previewTransition = JSON.stringify(transition);
    };
    const updateShade = opacity => {
        shade.style.opacity = String(opacity);
        if (opacity === 1) markTransition('black');
    };
    const cameraTrace = [];
    const reportCamera = state => {
        if (!diagnostics) return;
        cameraTrace.push(state);
        if (cameraTrace.length > 100) cameraTrace.shift();
        document.body.dataset.previewCamera = JSON.stringify(state);
        document.body.dataset.previewCameraTrace = JSON.stringify(cameraTrace);
    };
    const reportStats = stats => {
        if (diagnostics) {
            document.body.dataset.previewLoadingStats = JSON.stringify(stats);
            console.info('[Portada] animación durante carga', JSON.stringify(stats));
        }
    };
    // OffscreenCanvas mantiene render y cámara fuera del hilo que construye el mundo.
    if (canvas.transferControlToOffscreen && typeof Worker !== 'undefined') {
        try {
            worker = new Worker(new URL('./island-preview-worker.js',import.meta.url),{type:'module'});
            const offscreen = canvas.transferControlToOffscreen();
            const importMap = JSON.parse(document.querySelector('script[type="importmap"]').textContent);
            const threeUrl = new URL(importMap.imports.three,document.baseURI).href;
            let resolveArrival, rejectArrival, readyResolve, readyReject;
            const arrived = new Promise((resolve,reject) => {
                resolveArrival = resolve; rejectArrival = reject;
            });
            // El rechazo se propaga al begin; evitar avisos antes de que el mundo esté listo.
            arrived.catch(() => {});
            const ready = new Promise((resolve,reject) => { readyResolve = resolve; readyReject = reject; });
            const fail = error => { readyReject(error); rejectArrival(error); };
            worker.onerror = event => fail(new Error(event.message || 'Falló la portada 3D.'));
            worker.onmessage = ({data}) => {
                if (data.type === 'frame') {
                    if (data.state.phase !== 'arrival') {
                        latestFreeFrame = data.state;
                        if (!freeFrameScheduled) {
                            freeFrameScheduled = true;
                            requestAnimationFrame(() => {
                                freeFrameScheduled = false;
                                recordPresentation(latestFreeFrame);
                            });
                        }
                        return;
                    }
                    // El segundo RAF confirma una oportunidad de composición entre
                    // dibujo y acuse; no confirmar desde una tarea larga de carga.
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        recordPresentation(data.state);
                        worker?.postMessage({type:'presented',id:data.id});
                    }));
                } else if (data.type === 'ready') readyResolve();
                else if (data.type === 'arrived') resolveArrival();
                else if (data.type === 'shade') updateShade(data.opacity);
                else if (data.type === 'theme') reportTheme(data.night);
                else if (data.type === 'stats') reportStats(data.stats);
                else if (data.type === 'camera') reportCamera(data.state);
                else if (data.type === 'error') fail(new Error(data.message));
            };
            worker.postMessage({type:'init',...settings,threeUrl,canvas:offscreen},[offscreen]);
            await ready;
            driver = {
                setNight: enabled => worker.postMessage({type:'night',enabled}),
                resize: (width,height) => worker.postMessage({type:'resize',width,height}),
                startLoading: () => worker.postMessage({type:'loading'}),
                startFade: () => worker.postMessage({type:'fade'}),
                begin: () => { worker.postMessage({type:'arrive'}); return arrived; },
                dispose: () => worker.postMessage({type:'dispose'})
            };
        } catch (error) {
            worker?.terminate();
            worker = null;
            canvas.remove();
            canvas = canvasElement();
            console.warn('Portada: usando render compatible.',error);
        }
    }
    // Compatibilidad para navegadores sin transferencia de canvas a workers.
    if (!driver) {
        const loader = new THREE.TextureLoader();
        driver = await createIslandPreviewRenderer(THREE,{
            ...settings,canvas,loadTexture: name => loader.loadAsync(settings.textureBase+name),
            onShade:updateShade,onStats:reportStats,onCamera:reportCamera,onTheme:reportTheme
        });
    }
    const resize = new ResizeObserver(() => driver.resize(
        Math.max(1,menu.clientWidth),Math.max(1,menu.clientHeight)));
    resize.observe(menu);
    document.body.classList.add('island-preview');
    menu.classList.add('intro-ready');
    themeHint = document.createElement('p');
    themeHint.className = 'preview-theme-hint';reportTheme(night);
    menu.append(themeHint);
    const stopModeWatch = testMode.subscribe(updateThemeHint);
    const sequence = createTestModeSequence(() => testMode.toggle());
    const handleTestSequence = event => sequence.press(event);
    function toggleTheme(event) {
        if (!testMode.enabled || event.code !== 'KeyL' || event.repeat || event.ctrlKey || event.altKey || event.metaKey
            || event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
        event.preventDefault();
        reportTheme(!night);
        driver.setNight(night);
    }
    document.addEventListener('keydown',toggleTheme);
    document.addEventListener('keydown',handleTestSequence);
    function stopThemeSwitch() {
        themeSwitchActive = false;
        document.removeEventListener('keydown',toggleTheme);
        document.removeEventListener('keydown',handleTestSequence);
        stopModeWatch();
        themeHint.hidden = true;
    }
    if (diagnostics) {
        document.body.dataset.previewRenderer = worker ? 'worker' : 'principal';
        console.info('[Portada] render',document.body.dataset.previewRenderer);
    }
    return {
        startLoading() { stopThemeSwitch(); driver.startLoading(); },
        startFade() { markTransition('fadeStarted'); menuMusic.fadeOut(); driver.startFade(); },
        begin() {
            stopThemeSwitch();
            markTransition('begin');
            menu.classList.add('intro-arriving');
            return driver.begin();
        },
        reveal() {
            stopThemeSwitch();
            themeHint.remove();
            menuMusic.stop();
            resize.disconnect();
            menu.style.display = 'none';
            document.body.classList.remove('island-preview');
            markTransition('reveal');
            const fade = shade.animate([{opacity:1},{opacity:0}],{duration:250,fill:'forwards'});
            // Liberar recursos después del revelado evita bloquear su primer fotograma.
            fade.finished.finally(() => {
                shade.style.opacity = '0';
                fade.cancel();
                canvas.remove();
                driver.dispose();
                markTransition('visible');
                observer?.disconnect();
            });
        }
    };
}
