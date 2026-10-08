// Carga y lectura de capas, independiente de Three.js y de la escena.
export function loadMapImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`No se pudo cargar el mapa: ${url.split('?')[0]}`));
        image.src = url;
    });
}

export function validateMapLayers(base, roof) {
    for (const [name, image] of [['capa1', base], ['capa2', roof]]) {
        if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width <= 0 || image.height <= 0) {
            throw new Error(`${name}: la imagen debe tener dimensiones positivas.`);
        }
    }
    if (base.width !== roof.width || base.height !== roof.height) {
        throw new Error(`Las capas deben tener el mismo tamaño: capa1 ${base.width}x${base.height}, capa2 ${roof.width}x${roof.height}.`);
    }
}

export function readMapLayers(base, roof) {
    validateMapLayers(base, roof);
    const width = base.width;
    const height = base.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el contexto 2D para leer el mapa.');
    ctx.drawImage(base, 0, 0);
    const basePixels = ctx.getImageData(0, 0, width, height).data;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(roof, 0, 0);
    const roofPixels = ctx.getImageData(0, 0, width, height).data;
    return { width, height, basePixels, roofPixels };
}
