// Traduce teclas a acciones. Las condiciones de gameplay pertenecen al llamador.
export function bindKeyboard(actions, target = document) {
    const sequence = ['KeyW', 'KeyW', 'KeyS', 'KeyS', 'KeyA', 'KeyD', 'KeyA', 'KeyD'];
    let sequenceIndex = 0;
    const directions = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', ArrowUp:'forward', ArrowDown:'backward', ArrowLeft:'left', ArrowRight:'right' };
    const scopeDirections=new Set();

    function onKeyDown(event) {
        if (actions.isEnabled?.() === false) return;
        if (actions.isPaused?.()) {
            sequenceIndex = 0;
            if (!event.repeat && event.code === 'Escape' && !actions.isInventoryOpen?.()) actions.pause();
            // Inventario abierto: Q lo cierra; Esc pasa a la pausa real.
            if (actions.isInventoryOpen?.() && !event.repeat) {
                if (event.code === 'KeyQ') actions.inventory();
                else if (event.code === 'Escape') actions.pause();
            }
            return;
        }
        const code = event.code;
        if(actions.isObservatoryScopeActive?.()) {
            if(code==='KeyZ'||code==='KeyX') {
                event.preventDefault();if(!event.repeat)actions.scopeZoom?.(code==='KeyZ'?1:-1,true);return;
            }
            if(code in directions) {event.preventDefault();scopeDirections.add(code);actions.scopeAim?.(directions[code],true);return;}
            if(code==='KeyE'&&!event.repeat) {event.preventDefault();actions.interact();return;}
            if(code==='Escape'&&!event.repeat) {actions.pause();return;}
            return;
        }
        if (actions.isInventoryOpen?.() && !directions[code]
            && !['KeyQ','Escape','Space','KeyC','ShiftLeft','ShiftRight'].includes(code)) {
            event.preventDefault();
            return;
        }
        if(code.startsWith('Arrow')) event.preventDefault();
        if (code === sequence[sequenceIndex]) {
            sequenceIndex++;
            if (sequenceIndex === sequence.length) {
                sequenceIndex = 0;
                actions.toggleFlight();
            }
        } else { sequenceIndex = 0; }

        if (code === 'Enter') actions.start();
        if (code === 'KeyE') {
            if (event.repeat || actions.holdInteract?.(true) || actions.interact()) return;
        }
        if (directions[code]) actions.move(directions[code], true);
        switch (code) {
            case 'Escape': if (!event.repeat) actions.pause(); break;
            case 'Space': event.preventDefault(); actions.holdJump?.(true); if (!event.repeat) actions.jump(); actions.move('up', true); break;
            case 'KeyC': actions.crouch(true); actions.move('down', true); break;
            case 'ShiftLeft': case 'ShiftRight': actions.run(true); break;
            case 'KeyN': if (!event.repeat) actions.toggleDayNight(); break;
            case 'KeyP': if (!event.repeat) actions.stopMusic?.(); break;
            case 'KeyV': if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) actions.cycleLensView?.(); break;
            case 'KeyK': if (!event.repeat) actions.teleportToForestHeart?.(); break;
            case 'KeyL': if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) actions.grantForestHeartForTesting?.(); break;
            case 'KeyJ': if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) actions.activateBridgeKeyEvent?.(); break;
            case 'KeyT': if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) actions.torch(); break;
            case 'KeyQ': if (!event.repeat) actions.inventory(); break;
        }
    }

    function onKeyUp(event) {
        const code = event.code;
        scopeDirections.delete(code);
        if(actions.isObservatoryScopeActive?.()) {
            if(code==='KeyZ'||code==='KeyX') {
                event.preventDefault();actions.scopeZoom?.(code==='KeyZ'?1:-1,false);
            }
            if(code in directions) {
                event.preventDefault();
                const held=[...scopeDirections].some(key=>directions[key]===directions[code]);
                actions.scopeAim?.(directions[code],held);
            }
            return;
        }
        if (directions[code]) actions.move(directions[code], false);
        switch (code) {
            case 'KeyE': actions.holdInteract?.(false); break;
            case 'Space': actions.holdJump?.(false); actions.move('up', false); break;
            case 'KeyC': actions.crouch(false); actions.move('down', false); break;
            case 'ShiftLeft': case 'ShiftRight': actions.run(false); break;
        }
    }

    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    const dispose = () => {
        target.removeEventListener('keydown', onKeyDown);
        target.removeEventListener('keyup', onKeyUp);
    };
    dispose.resetSequence = () => { sequenceIndex = 0; scopeDirections.clear(); };
    return dispose;
}
