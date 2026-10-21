# Maqueta 3D guardada de la portada

La portada muestra `imagenes/Portada/isla-maqueta.bin`. Es una maqueta deliberadamente simplificada: conserva la costa, río, laguna, montaña, caminos, bosque y techos principales del mapa vigente. No representa cada objeto del mundo jugable ni interviene en colisiones, misiones o guardado.

El navegador **solo carga** el archivo guardado. No lee las capas PNG para generar esta maqueta ni reconstruye sus vértices al abrir la página. El mundo jugable mantiene su carga propia al pulsar Enter o tocar para comenzar; después se hace el acercamiento a la casa de Graham. La maqueta rota mientras se espera al jugador.

## Cuándo regenerar

Solo cuando Clawshoot lo pida expresamente, por ejemplo: **«Regenera la maqueta de la portada con el mapa actual»**. Cambiar capas, edificios o posición de la casa no inicia la regeneración automáticamente. Si el mapa cambió y no hubo pedido, la maqueta puede quedar desactualizada hasta esa señal.

## Procedimiento manual

1. Revisar `AGENTS.md`, `docs/PROTOCOL.md` y el bloqueo de sesión. Confirmar que las capas vigentes son `imagenes/Mapa/capa1.png` y `capa2.png` y que `spawnRoomExit` en `src/content/entities.js` apunta a la casa actual.
2. Desde la raíz del proyecto ejecutar `python tools/build-island-preview.py`. Requiere `numpy` y `pillow`, declarados en `requirements.txt`. No ejecutar los generadores antiguos del mapa: esta herramienta **lee** los PNG, no los modifica.
3. La herramienta reemplaza `imagenes/Portada/isla-maqueta.bin` y actualiza `imagenes/Portada/isla-maqueta.json` con tamaños, cantidades y huellas SHA-256 de las dos capas. Verificar que las huellas correspondan a los PNG actuales.
4. Abrir la portada en PC y móvil: comprobar silueta completa, costa sin borde cuadrado, giro suave, ubicación de Graham y acercamiento al iniciar. Si la representación simplificada omite un lugar importante, ajustar únicamente `tools/build-island-preview.py`, regenerar otra vez por el mismo pedido y volver a comprobar.
5. Cuando el usuario solicite un PR, incluir el binario y su manifiesto junto con el generador, este documento y el código de portada que los carga. No publicar, hacer commit ni regenerar por el simple hecho de cerrar una sesión.

El formato binario `IJM2` contiene posiciones y colores de los vértices de suelo (malla de 2 píxeles por celda y contorno suavizado), índices solo donde hay tierra, instancias simplificadas de árboles y rectángulos de los techos principales. La portada genera únicamente primitivas pequeñas de Three.js a partir de esos datos guardados; no vuelve a interpretar el mapa ni calcula el relieve. El generador usa las posiciones de la casa en `entities.js` para el destino del zoom. Si cambia el formato, actualizar simultáneamente el generador y el lector en `src/ui/island-preview-renderer.js`.

La presentación se coordina desde `src/ui/saved-island-preview.js`. En navegadores compatibles, `src/ui/island-preview-worker.js` dibuja la maqueta con OffscreenCanvas; la construcción del mundo en el hilo principal no detiene su giro ni el acercamiento lento. El render compartido está en `src/ui/island-preview-renderer.js` y conserva un respaldo en el hilo principal para navegadores sin esa capacidad. Enter activa la carga; cuando el mundo está listo se solicita el zoom final y el fundido. Con `?perf=1` se informa el modo de render y los intervalos de animación de portada, sin enviar datos.
