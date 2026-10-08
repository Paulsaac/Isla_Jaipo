# Registro de Progreso y Handoff de Antigravity (Isla Jaipo)

## Protocolo compartido vigente (2026-10-08)
Actualización de cierre: mantener la sesión entre ajustes y escribir documentación solo cuando el usuario indique que se finiquita. Operaciones Git únicamente con autorización explícita; las instrucciones históricas siguientes no son autorización automática. Ver docs/PROTOCOL.md.
Antes de editar, leer `AGENTS.md`, `docs/PROTOCOL.md`, `HANDOFF.md` y `DECISIONS.md`, y adquirir la sesión con `tools/session.ps1`. Al cerrar, actualizar `HANDOFF.md` y liberar la sesión. Este archivo conserva el historial: los valores y nombres antiguos deben contrastarse con el código. El estado vigente está en `HANDOFF.md`; no duplicarlo aquí. Las reglas siguientes de pull/push no autorizan ejecutar esas operaciones automáticamente.

**¡ATENCIÓN, AGENTE DE ANTIGRAVITY!**
**INSTRUCCIÓN OBLIGATORIA DE TRABAJO:**
1. **AL INICIAR (PULL):** Cada vez que realices un `git pull` o clones este repositorio para comenzar a trabajar, **lo primero que debes hacer es leer este archivo completo** para comprender el estado actual del proyecto, las decisiones técnicas tomadas y el contexto del código.
2. **AL FINALIZAR (PUSH):** Antes de ejecutar un `git push` para entregar el trabajo, estás **OBLIGADO** a actualizar este archivo detallando todos los cambios, mejoras o correcciones que hayas realizado, para que el próximo agente que retome el proyecto sepa exactamente dónde continuar.

---

## Estado Actual del Proyecto
Este es un juego 3D de estética retro (Voxel / Dark Fantasy) construido sobre **Three.js** utilizando Vanilla JavaScript, HTML5 y CSS3. El diseño del mapa original fue extraído de dibujos en MS Paint usando un script de Python. Actualmente usa un sistema de dos capas de imágenes (`mapa_final.png` y `mapa_final_capa_2.png`), donde la segunda capa define elementos sobre el terreno base.

### Hitos y Trabajos Realizados Hasta Ahora:
*   **Filtro CRT Global:** Se implementó un filtro CRT retro (scanlines y parpadeo) mediante CSS (`body::before` y `body::after`) para mantener la interfaz y el juego cohesivos.
*   **Carga y Fuentes:** Las pantallas de inicio usan la fuente de Google `Press Start 2P`. El menú cuenta con una animación ligera por GPU (`transform`) para evitar caídas de fotogramas.
*   **Terreno Volumétrico Continuo:** Se eliminaron los bloques estáticos (InstancedMesh) para el terreno plano (Pasto, Tierra, Arena). En su lugar, generamos un `PlaneGeometry` continuo (`terrainGeo`) alterado matemáticamente con ruido 3D (`Math.sin`) para crear colinas orgánicas y redondeadas. Las montañas se mantienen con mallas separadas pero acopladas.
*   **Sistema de Costas y Cuencas:** El terreno se hunde bajo el agua hasta `Y = -2.0`. Todo cuadrante de terreno que toca el agua cambia dinámicamente su índice a textura de Arena para asegurar costas de playa sin filtraciones de pasto o tierra.
*   **Splat Mapping (Difuminado de Texturas):** Para evitar cortes rígidos (zigzags) entre tierra, pasto y arena, se inyectó un atributo personalizado (`splatWeights`) en el `terrainGeo`. Se sobreescribió el fragment shader nativo (`MeshPhongMaterial.onBeforeCompile`) para promediar los téxeles en la GPU y lograr transiciones suaves y naturales entre los materiales de la superficie plana.
*   **Océano Global:** El agua ya no usa instancias individuales (`InstancedMesh`). Ahora es un plano masivo (`globalWaterMesh`) posicionado en `Y = -0.05` con texturas animadas mediante repetición (`RepeatWrapping`).
*   **Físicas de Nado:** Al sumergirse, la cámara se desvincula del lecho marino. El jugador comienza a flotar inmediatamente al ras del nivel del mar y recupera su altura de forma suave al salir de la costa.
*   **Ciclo Día/Noche:** Existe un timer global de 242 segundos que interpola iluminación ambiental, direccional, niebla y opacidades del cielo (Skybox diurno interpolándose sobre el nocturno). *NOTA ACTUAL: El ciclo se encuentra temporalmente **PAUSADO** mediante código en la función `animate()`. El juego permanecerá congelado en la fase nocturna hasta que el usuario decida reanudarlo.*
*   **Ajustes de Gameplay y Atmósfera:** Se desactivó la modalidad de escalada en montañas y se redujo la fuerza de salto a la mitad (`JUMP_FORCE = 7.5`). La atmósfera nocturna se oscureció y se refinó la luz de la antorcha: se ajustó su intensidad base a `5.0` y su **radio de alcance a `320`**, moviendo además su posición focal a `X=1.0`.
*   **Mapa Multicapa y Techos Piramidales:** Se implementó la carga paralela de `mapa_final.png` (terreno) y `mapa_final_capa_2.png` (elementos superpuestos). Los techos ahora se generan como estructuras piramidales usando `Distance Transform` (BFS) para calcular la distancia a los bordes. Se corrigió el anclaje para que descansen perfectamente sobre los muros y se capó la altitud a un máximo de 3 bloques (niveles) para no extenderse infinitamente. También se agregaron antorchas y elementos decorativos leídos de la segunda capa.

### Consideraciones Técnicas Importantes:
*   La variable `floorCanvas` ya no se renderiza en la escena 3D como una imagen para evitar superposiciones de colores sólidos en el relieve de arena, **solo se utiliza internamente para generar el minimapa en la esquina superior derecha**.
*   El código de la aplicación está alojado enteramente en `game.js`.

---
*Fin del registro de handoff.*

### Actualización (Refinamientos del Terreno, Colisiones y Texturas):
*   **Físicas de Colisión de Techo (Fix Crítico):** Se corrigió la lógica que empujaba al jugador hacia el suelo. Anteriormente, el techo estaba calculado como una altura fija absoluta (`1.9`m), lo que aplastaba al jugador contra el suelo (o debajo de él) al subir de elevación. Ahora se calcula dinámicamente sumando la altura actual del terreno más la altura de la pared.
*   **Elevación de Terreno (Smooth Slopes):** Se elevó el nivel base de la hierba y la casa de la isla para que domine el paisaje sin verse invadido por las colinas onduladas generadas por el ruido Perlin. Ahora la transición de arena a hierba es de exactamente `0.8` metros (la mitad de la altura del jugador).
*   **Mapeo de Muros (Triplanar Removido):** Se retiró el Shader Triplanar experimental de las paredes, devolviendo el control al mapeo UV nativo de los `BoxGeometry`. Esto asegura que las texturas personalizadas como `muro.png` de 128x128 encajen perfectamente bloque por bloque sin rotarse 90 grados en ciertas caras.
*   **Agujeros Fantasma (InstancedMesh Fix):** Se corrigió una fuga en el contador del `InstancedMesh` para el suelo de madera. Una condición lógica duplicaba el conteo de baldosas de `WOOD`, excediendo la capacidad asignada a la GPU y provocando que las últimas baldosas desaparecieran visualmente y dejaran hoyos que permitían ver bajo el mapa.
*   **Head Bobbing (Mareo y Hundimiento):** Se atenuó significativamente la amplitud del balanceo de cabeza (`bobTimer`) de 15cm a 4cm. Esto elimina la ilusión óptica de que el personaje "se hunde" de golpe al soltar la tecla de caminar.
*   **Cache-Busters para Texturas:** Se inyectó código para engañar a la memoria caché del navegador (`Date.now()`) al cargar texturas a través del `TextureLoader`. Esto garantiza que siempre se vean los archivos `.png` o `.jpg` más recientes tras recargar la página, acelerando la prueba de assets del artista.
*   **Ciclo de la Luna:** Se refinó la lógica de animación crossfade de la luna. Inicia con un ciclo de 3 sprites (`Luna_B` -> `Luna_glow` -> `Luna_azul` -> `Luna_glow` -> `Luna_B`) que se repite durante 4 parpadeos (a razón de `0.8s` por fase). Tras completar los 4 parpadeos, la luna transiciona a un ciclo de solo 2 sprites (`Luna_glow` y `Luna_azul`), manteniendo el glow al 100% y oscilando continuamente entre la luna brillante y la luna azul. Si el jugador deja de mirar a la luna, las opacidades se desvanecen suavemente y el ciclo se reinicia.
*   **Control de Agacharse (`C`):** Se asignó la tecla `C` (`KeyC`) como control para agacharse (manteniendo compatibilidad con `ControlLeft`/`ControlRight`). Se actualizó el menú de pausa en `index.html` para listar `[C] - Agacharse`.
*   **Verificación y Corrección de Antorchas (`#99D9EA`):** Se verificó la paleta estandarizada donde `TORCH` corresponde a `#99D9EA` (`153, 217, 234`). Se corrigió el cálculo de distancia y coordenadas para posicionar a Graham junto a la antorcha más cercana al spawn del jugador, y se aseguró la textura de pasto en `splatWeights` para antorchas en el terreno exterior.
