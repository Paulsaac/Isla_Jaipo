// ?touch=1 permite revisar el prototipo desde un navegador de escritorio.
export const isTouchMode = matchMedia('(pointer: coarse)').matches
    || new URLSearchParams(location.search).get('touch') === '1';
