import { createIslandPreviewRenderer } from './island-preview-renderer.js';

// Este worker dibuja solo la maqueta guardada. La construcción del juego
// puede ocupar el hilo principal sin detener la cámara de portada.
let preview, presented;
let frameId = 0;
self.onmessage = async ({data}) => {
    try {
        if (data.type === 'init') {
            const THREE = await import(data.threeUrl);
            const loader = new THREE.ImageBitmapLoader();
            loader.setOptions({ imageOrientation: 'flipY' });
            preview = await createIslandPreviewRenderer(THREE,{
                ...data,
                independentClock: true,
                onError: error => self.postMessage({type:'error',message:error.message}),
                onPresent: state => {
                    const id = ++frameId;
                    if (state.phase !== 'arrival') {
                        // El canvas se compone por sí mismo; no esperar al hilo que carga el mundo.
                        self.postMessage({type:'frame',id,state});
                        return;
                    }
                    return new Promise(resolve => {
                        presented = { id, resolve };
                        self.postMessage({type:'frame',id,state});
                    });
                },
                loadTexture: async name => {
                    const bitmap = await loader.loadAsync(data.textureBase + name);
                    const texture = new THREE.Texture(bitmap);
                    texture.needsUpdate = true;
                    texture.addEventListener('dispose', () => bitmap.close());
                    return texture;
                },
                onShade: opacity => self.postMessage({type:'shade',opacity}),
                onStats: stats => self.postMessage({type:'stats',stats}),
                onCamera: state => self.postMessage({type:'camera',state})
            });
            self.postMessage({type:'ready'});
        } else if (data.type === 'presented') {
            if (presented?.id === data.id) { presented.resolve(); presented = null; }
        } else if (data.type === 'resize') preview.resize(data.width,data.height);
        else if (data.type === 'loading') preview.startLoading();
        else if (data.type === 'fade') preview.startFade();
        else if (data.type === 'arrive') {
            await preview.begin();
            self.postMessage({type:'arrived'});
        } else if (data.type === 'dispose') {
            presented?.resolve();
            preview.dispose();
            self.close();
        }
    } catch (error) {
        self.postMessage({type:'error',message:error.message});
    }
};
