// Traduce teclas a acciones. Las condiciones de gameplay pertenecen al llamador.
export function bindKeyboard(actions, target = document) {
    const sequence = ['KeyW', 'KeyW', 'KeyS', 'KeyS', 'KeyA', 'KeyD', 'KeyA', 'KeyD'];
    let sequenceIndex = 0;
    const directions = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right' };

    function onKeyDown(event) {
        const code = event.code;
        if (code === sequence[sequenceIndex]) {
            sequenceIndex++;
            if (sequenceIndex === sequence.length) {
                sequenceIndex = 0;
                actions.toggleFlight();
            }
        } else { sequenceIndex = 0; }

        if (code === 'Enter') actions.start();
        if (code === 'KeyE' && actions.interact()) return;
        if (directions[code]) actions.move(directions[code], true);
        switch (code) {
            case 'Space': actions.jump(); actions.move('up', true); break;
            case 'KeyC': case 'ControlLeft': case 'ControlRight': actions.crouch(true); actions.move('down', true); break;
            case 'ShiftLeft': case 'ShiftRight': actions.run(true); break;
            case 'KeyM': actions.map(); break;
            case 'KeyT': actions.torch(); break;
            case 'KeyQ': actions.inventory(); break;
        }
    }

    function onKeyUp(event) {
        const code = event.code;
        if (directions[code]) actions.move(directions[code], false);
        switch (code) {
            case 'Space': actions.move('up', false); break;
            case 'KeyC': case 'ControlLeft': case 'ControlRight': actions.crouch(false); actions.move('down', false); break;
            case 'ShiftLeft': case 'ShiftRight': actions.run(false); break;
        }
    }

    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    return () => {
        target.removeEventListener('keydown', onKeyDown);
        target.removeEventListener('keyup', onKeyUp);
    };
}
