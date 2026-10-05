# Registro de Progreso y Handoff de Antigravity (Isla Jaipo)

**¡ATENCIÓN, AGENTE DE ANTIGRAVITY!**
**INSTRUCCIÓN OBLIGATORIA DE TRABAJO:**
1. **AL INICIAR (PULL):** Cada vez que realices un `git pull` o clones este repositorio para comenzar a trabajar, **lo primero que debes hacer es leer este archivo completo** para comprender el estado actual del proyecto, las decisiones técnicas tomadas y el contexto del código.
2. **AL FINALIZAR (PUSH):** Antes de ejecutar un `git push` para entregar el trabajo, estás **OBLIGADO** a actualizar este archivo detallando todos los cambios, mejoras o correcciones que hayas realizado, para que el próximo agente que retome el proyecto sepa exactamente dónde continuar.

---

## Estado Actual del Proyecto
Este es un juego 3D de estética retro (Voxel / Dark Fantasy) construido sobre **Three.js** utilizando Vanilla JavaScript, HTML5 y CSS3. El diseño del mapa original fue extraído de un dibujo en MS Paint usando un script de Python (`generate_map_v5.py`), y ha evolucionado significativamente hacia un motor más complejo.

### Hitos y Trabajos Realizados Hasta Ahora:
*   **Filtro CRT Global:** Se implementó un filtro CRT retro (scanlines y parpadeo) mediante CSS (`body::before` y `body::after`) para mantener la interfaz y el juego cohesivos.
*   **Carga y Fuentes:** Las pantallas de inicio usan la fuente de Google `Press Start 2P`. El menú cuenta con una animación ligera por GPU (`transform`) para evitar caídas de fotogramas.
*   **Terreno Volumétrico Continuo:** Se eliminaron los bloques estáticos (InstancedMesh) para el terreno plano (Pasto, Tierra, Arena). En su lugar, generamos un `PlaneGeometry` continuo (`terrainGeo`) alterado matemáticamente con ruido 3D (`Math.sin`) para crear colinas orgánicas y redondeadas. Las montañas se mantienen con mallas separadas pero acopladas.
*   **Sistema de Costas y Cuencas:** El terreno se hunde bajo el agua hasta `Y = -2.0`. Todo cuadrante de terreno que toca el agua cambia dinámicamente su índice a textura de Arena para asegurar costas de playa sin filtraciones de pasto o tierra.
*   **Splat Mapping (Difuminado de Texturas):** Para evitar cortes rígidos (zigzags) entre tierra, pasto y arena, se inyectó un atributo personalizado (`splatWeights`) en el `terrainGeo`. Se sobreescribió el fragment shader nativo (`MeshPhongMaterial.onBeforeCompile`) para promediar los téxeles en la GPU y lograr transiciones suaves y naturales entre los materiales de la superficie plana.
*   **Océano Global:** El agua ya no usa instancias individuales (`InstancedMesh`). Ahora es un plano masivo (`globalWaterMesh`) posicionado en `Y = -0.05` con texturas animadas mediante repetición (`RepeatWrapping`).
*   **Físicas de Nado:** Al sumergirse, la cámara se desvincula del lecho marino. El jugador comienza a flotar inmediatamente al ras del nivel del mar y recupera su altura de forma suave al salir de la costa.
*   **Ciclo Día/Noche:** Existe un timer global de 242 segundos que interpola iluminación ambiental, direccional, niebla y opacidades del cielo (Skybox diurno interpolándose sobre el nocturno). *NOTA ACTUAL: El ciclo se encuentra temporalmente **PAUSADO** mediante código en la función `animate()`. El juego permanecerá congelado en la fase nocturna hasta que el usuario decida reanudarlo.*

### Consideraciones Técnicas Importantes:
*   La variable `floorCanvas` ya no se renderiza en la escena 3D como una imagen para evitar superposiciones de colores sólidos en el relieve de arena, **solo se utiliza internamente para generar el minimapa en la esquina superior derecha**.
*   El código de la aplicación está alojado enteramente en `game.js`.

---
*Fin del registro de handoff.*
