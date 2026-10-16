// Herramienta de autoría: marcas del audio, sin guardar progreso de la partida.
export function createForestCueRecorder({ music, isActive, target = document, storage = localStorage, send = fetch }) {
    // getRandomValues también está disponible al abrir por HTTP en la red local.
    const uuidBytes = crypto.getRandomValues(new Uint8Array(16));
    uuidBytes[6] = (uuidBytes[6] & 15) | 64;
    uuidBytes[8] = (uuidBytes[8] & 63) | 128;
    const hex = Array.from(uuidBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    const take = { version: 1, track: 'forest', source: 'sonidos/musica/bosque.mpeg', id, createdAt: new Date().toISOString(), marks: [] };
    const panel = target.createElement('div');
    panel.id = 'forest-cue-recorder';
    panel.style.cssText = 'position:fixed;top:12px;left:12px;z-index:120;max-width:min(460px,80vw);padding:8px 10px;background:#101923cc;color:#d9f6ff;font:12px monospace;border-radius:5px;pointer-events:none;';
    const chips = target.createElement('div');
    chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px;';
    const status = target.createElement('div');
    panel.append(chips, status);
    target.body.append(panel);
    let revision = 0, saveQueue = Promise.resolve(), saveState = '';
    function format(seconds) {
        const ms = Math.round(seconds * 1000);
        return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
    }
    function render() {
        chips.replaceChildren();
        for (const mark of take.marks) {
            const chip = target.createElement('span');
            chip.textContent = mark.id;
            chip.title = format(mark.seconds);
            chip.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border:1px solid #80dfff;' + (mark.id === take.marks.length - 1 ? 'background:#80dfff;color:#10202b;' : '');
            chips.append(chip);
        }
        status.textContent = take.marks.length ? `Y: marcar · ${take.marks.length} marcas · última ${format(take.marks.at(-1).seconds)} · ${saveState}` : 'Marcas Bosque · 0 al comenzar · Y: marcar';
    }
    function save() {
        const currentRevision = ++revision;
        const snapshot = JSON.stringify(take);
        try { storage.setItem(`isla-jaipo:forest-cues:${take.id}`, snapshot); saveState = 'guardando en PC…'; }
        catch { saveState = 'guardando en PC…'; }
        render();
        saveQueue = saveQueue.then(async () => {
            try {
                const response = await send('/__authoring/forest-cues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: snapshot });
                if (!response.ok) throw new Error('No se guardó en el servidor');
                if (currentRevision === revision) { saveState = 'guardado en PC'; render(); }
            } catch {
                if (currentRevision === revision) { saveState = 'sin copia en PC; conserva esta pestaña'; render(); }
            }
        });
    }
    function ensureStart() {
        if (take.marks.length) return;
        take.marks.push({ id: 0, seconds: 0 });
        save();
    }
    function update() {
        const lastTime = music.getEventPlaybackTime('forest');
        if (lastTime !== null) ensureStart();
    }
    function mark(event) {
        if (event.code !== 'KeyY' || event.repeat || event.ctrlKey || event.altKey || event.metaKey || !isActive()) return;
        if (event.target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
        const seconds = music.getEventPlaybackTime('forest');
        if (seconds === null) return;
        event.preventDefault();
        ensureStart();
        take.marks.push({ id: take.marks.length, seconds: Math.round(seconds * 1000) / 1000 });
        save();
    }
    target.addEventListener('keydown', mark);
    render();
    return { update, getMarks: () => take.marks.map(mark => ({ ...mark })), flush: () => saveQueue };
}