// Presentación del HUD; no calcula resistencia ni decide interacciones o muerte.
export function createHud() {
    const message = document.getElementById('interaction-msg');
    const riverWarning = document.getElementById('river-warning-msg');
    const coordinates = document.getElementById('position-coordinates');
    let coordinatesText = '';
    let coordinatesVisible = false;
    const staminaContainer = document.getElementById('stamina-container');
    const staminaBar = document.getElementById('stamina-bar');
    const deathScreen = document.getElementById('death-screen');
    const itemNotification = document.getElementById('item-notification');
    const pendingItems = [];
    let inventoryHintShown = false;
    const helmetView = document.getElementById('diving-helmet-view');
    const helmetCrackSegments = [...helmetView.querySelectorAll('[data-crack-start]')].map(group => ({
        paths: [...group.querySelectorAll('path')],
        stage: Number(group.dataset.crackStage || 1),
        start: Number(group.dataset.crackStart) / 1000,
        duration: Number(group.dataset.crackDuration) / 1000
    }));
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let helmetCrackStage = 0, helmetCrackTime = 0, helmetCrackDuration = 1.4, helmetCrackComplete = true;
    const underwaterTint = document.getElementById('underwater-tint');
    const lensModeName = document.getElementById('lens-mode-name');
    let lensModeTimer = null;
    function showLensMode(name) {
        if (lensModeTimer !== null) clearTimeout(lensModeTimer);
        lensModeName.textContent = `Lentes: ${name} · V para cambiar`;
        lensModeName.style.opacity = '1';
        lensModeTimer = setTimeout(() => { lensModeTimer = null; lensModeName.style.opacity = '0'; }, 2000);
    }
    let underwaterTintOpacity = -1;
    const airContainer = document.getElementById('diving-air-container');
    const airBar = document.getElementById('diving-air-bar');
    const airText = document.getElementById('diving-air-text');
    const airTrack = document.getElementById('diving-air-track');
    let displayedAir = null;
    let helmetViewVisible = false;
    let helmetViewEquipped = false, helmetViewAnimation = null;
    let itemAnimation = null, itemVersion = 0;

    function showNextItem() {
        const version = ++itemVersion;
        if (!pendingItems.length) {
            itemNotification.style.display = 'none';
            return;
        }
        itemNotification.textContent = pendingItems.shift();
        itemNotification.style.display = 'block';
        const reduced = reducedMotion.matches;
        const enter = reduced ? 200 : 650, hold = 2000, exit = reduced ? 180 : 350;
        const duration = enter + hold + exit;
        const rest = 'translate(-50%, -50%)';
        itemAnimation = itemNotification.animate([
            {opacity:0,transform:reduced ? rest : 'translate(-50%, calc(30dvh + 100%))',offset:0,easing:'cubic-bezier(0.22,1,0.36,1)'},
            {opacity:1,transform:rest,offset:enter/duration},
            {opacity:1,transform:rest,offset:(enter+hold)/duration,easing:'cubic-bezier(0.4,0,1,1)'},
            {opacity:0,transform:reduced ? rest : 'translate(-50%, calc(-25dvh - 50%))',offset:1}
        ],{duration,fill:'both'});
        itemAnimation.finished.then(() => {
            if (version !== itemVersion) return;
            itemAnimation.cancel();itemAnimation = null;
            showNextItem();
        }).catch(() => {});
    }

    function showReceivedItem(name) {
        showNotification(`Has recibido ${name}`);
        if (!inventoryHintShown) {
            inventoryHintShown = true;
            showNotification(document.body.classList.contains('touch-mode')
                ? 'Abre tu inventario para seleccionarlo'
                : 'Presiona Q para abrir el inventario');
        }
    }

    function showNotification(text, { immediate = false } = {}) {
        if (immediate) {
            itemVersion++;
            itemAnimation?.cancel();itemAnimation = null;
            pendingItems.length = 0;
        }
        pendingItems.push(text);
        if (itemAnimation === null) showNextItem();
    }

    function setRiverWarning(visible) {
        if (riverWarning) riverWarning.style.display = visible ? 'block' : 'none';
    }
    function showInteraction() { message.style.display = 'block'; }
    function hideInteraction() { message.style.display = 'none'; }
    function setInteractionText(text, { bottom = false } = {}) {
        message.classList.toggle('interaction-bottom',bottom);
        message.innerText = document.body.classList.contains('touch-mode') ? text.replaceAll('Presiona E', 'Pulsa B') : text;
    }
    function setInteractionColor(color) { message.style.color = color; }
    function showStamina() { staminaContainer.style.display = 'block'; }
    function hideStamina() { staminaContainer.style.display = 'none'; }
    function updateStamina(value, maximum) {
        if (staminaContainer.style.display === 'block') {
            staminaBar.style.width = (value / maximum * 100) + '%';
        }
    }
    function showDeath() { deathScreen.style.display = 'flex'; }
    function hideDeath() { deathScreen.style.display = 'none'; }
    function setHelmetViewVisible(visible) {
        if (visible === helmetViewVisible) return;
        helmetViewVisible = visible;
        helmetView.style.visibility = visible ? 'visible' : 'hidden';
    }
    function setHelmetEquipped(equipped) {
        if(equipped===helmetViewEquipped)return;
        helmetViewEquipped=equipped;
        helmetView.style.display='block';
        const from=getComputedStyle(helmetView).transform;
        helmetViewAnimation?.cancel();
        const to=equipped?'translateY(0)':'translateY(-160%)';
        helmetView.style.transform=to;
        const animation=helmetView.animate([{transform:from},{transform:to}],{
            duration:reducedMotion.matches?0:equipped?480:420,
            easing:'cubic-bezier(.22,.75,.28,1)'
        });
        helmetViewAnimation=animation;
        animation.onfinish=()=>{
            if(helmetViewAnimation!==animation)return;
            helmetViewAnimation=null;
            if(!helmetViewEquipped)helmetView.style.display='none';
        };
    }
    function setHelmetCrackStage(stage, duration = 1.4) {
        if (helmetCrackStage === stage) return;
        helmetCrackStage = stage;
        helmetView.classList.toggle('helmet-glass-cracked',stage > 0);
        helmetCrackDuration = duration;
        helmetCrackTime = reducedMotion.matches ? duration : 0;
        helmetCrackComplete = false;
        updateHelmetCrack(0);
    }
    function updateHelmetCrack(delta) {
        if (helmetCrackComplete) return;
        helmetCrackTime = reducedMotion.matches ? helmetCrackDuration : Math.min(helmetCrackDuration,helmetCrackTime + delta);
        for (const segment of helmetCrackSegments) {
            const progress = segment.stage < helmetCrackStage ? 1 : segment.stage > helmetCrackStage || helmetCrackStage === 0 ? 0
                : Math.max(0,Math.min(1,(helmetCrackTime / helmetCrackDuration * 1.4 - segment.start) / segment.duration));
            for (const path of segment.paths) path.style.strokeDashoffset = String(1 - progress);
        }
        helmetCrackComplete = helmetCrackTime >= helmetCrackDuration;
    }
    function showDivingAir(remaining, maximum) {
        airContainer.style.display = 'block';
        airTrack.setAttribute('aria-valuemax', maximum);
        airBar.style.width = `${remaining / maximum * 100}%`;
        airBar.style.backgroundColor = remaining <= 6 ? '#e39b55' : '#81cedf';
        const seconds = Math.ceil(remaining);
        if (seconds !== displayedAir) {
            displayedAir = seconds;
            airText.textContent = `Aire: ${seconds} s`;
            airTrack.setAttribute('aria-valuenow', seconds);
        }
    }
    function hideDivingAir() { airContainer.style.display = 'none'; }
    function setUnderwaterTint(amount) {
        const opacity = Math.round(amount * 100) / 100;
        if(opacity===underwaterTintOpacity) return;
        underwaterTintOpacity=opacity;
        underwaterTint.style.opacity=opacity;
    }
    function updateCoordinates(position, unitSize, visible) {
        if (visible !== coordinatesVisible) {
            coordinatesVisible = visible;
            coordinates.style.display = visible ? 'block' : 'none';
        }
        if (!visible) return;
        const x = Math.floor(position.x / unitSize + 0.5);
        const z = Math.floor(position.z / unitSize + 0.5);
        const text = `Cuadrante  X: ${x}  Z: ${z}\nAltura Y: ${position.y.toFixed(1)}`;
        if (text === coordinatesText) return;
        coordinatesText = text;
        coordinates.textContent = text;
    }

    return { setRiverWarning, showLensMode, showInteraction, hideInteraction, setInteractionText, setInteractionColor, showStamina, hideStamina, updateStamina, showDeath, hideDeath, showReceivedItem, showNotification, setHelmetEquipped, setHelmetViewVisible, setHelmetCrackStage, updateHelmetCrack, showDivingAir, hideDivingAir, updateCoordinates, setUnderwaterTint };
}
