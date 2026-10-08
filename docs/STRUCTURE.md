# Estructura del proyecto

## Ejecución en navegador
- `index.html`: entrada, import map de Three.js, menús y estilos.
- `game.js`: inicialización, generación de escena, controles, interacciones y actualización. Sigue siendo el punto de entrada; no se cambió su ruta.
- `src/config.js`: parámetros constantes de tamaño, movimiento y resistencia.
- `src/world/palette.js`: colores que identifica el lector del mapa y colores del minimapa.
- `src/world/map-loader.js`: carga de imágenes, validación de dimensiones y lectura RGBA de las capas, sin Three.js.
- `src/world/map-decoder.js`: interpretación de un color como tipo de celda; conserva la aproximación anterior y el tratamiento de transparencia.
- `src/world/map-data.js`: prepara matrices de suelo/techo/colisiones, conteos, punto de inicio y canvas del minimapa. No depende de Three.js.
- `src/content/dialogues.js`: diálogo introductorio de Graham.
- `src/ui/minimap.js`: crea el minimapa y administra visibilidad e indicador. Expone initialize, toggle y updatePosition; recibe posición y dimensiones del mundo sin depender de Three.js.
- `src/ui/menus.js`: presentación de pausa, inventario y diálogo, contador de llaves y clic para reanudar mediante callback. Las condiciones, el índice de diálogo y PointerLockControls siguen en game.js.
- `src/ui/hud.js`: presentación de mensajes de interacción, resistencia y pantalla de muerte. game.js conserva cálculo de resistencia, elección de mensajes, ahogamiento y reinicio.
- `src/input/keyboard.js`: conecta keydown/keyup con acciones mediante callbacks y reconoce la secuencia de vuelo. No depende de Three.js ni de elementos de UI; devuelve una función para retirar listeners.
- `src/world/terrain-height.js`: ruido y altura del terreno, compartidos por geometría y consulta de altura del jugador. Recibe las matrices como argumentos.
- `src/player/collisions.js`: consulta obstáculos, límites y restricciones del bote con las matrices vigentes. No mueve al jugador.
- `src/systems/doors.js`: desbloqueo visual compatible con varios materiales, apertura/cierre y actualización de colisiones, incluidas puertas adyacentes. game.js autoriza y consume la llave.
- `src/world/coordinates.js` y `entity-registry.js`: conversión mapa/mundo y registro validado por celda. Configuración en src/content/entities.js; ver docs/ENTITIES.md y tools/world-map.html.
- `src/systems/forest-heart.js`: estado de misión de sesión (buscando, llevando, entregado), conectado a inventario y diálogos.
- `imagenes/`: mapas, texturas y sprites originales. Las rutas de recursos siguen siendo relativas a la página.

Son módulos ES nativos: no hay empaquetador ni dependencia nueva. Servir la carpeta por HTTP como antes; no abrir index.html mediante file://. Al publicar, incluir también `src/`.

## Desarrollo y relevo
- Servidor local sin dependencias: `node tools/serve.cjs`, en http://127.0.0.1:8000/. Su proceso debe permanecer activo; si termina, el navegador rechaza la conexión.
- `src/world/mountain-height.js`: crecimiento acumulativo de las tres bandas, reconstrucción del relieve bajo caminos/construcciones y escala a altura anterior. game.js nivela la plataforma de cumbre y construye mallas.
- `src/world/surfaces.js`: cobertura de madera, excluyendo antorchas exteriores. terrain-height.js comparte pendientes con la física y ajusta tierra bajo pisos a su altura real.
- `src/systems/torch-lighting.js`: hasta 12 luces reutilizadas, transiciones exteriores por distancia y tiempo, potencia diferenciada para interiores y consulta de iluminación para Graham.
- `AGENTS.md`, `docs/PROTOCOL.md`, `HANDOFF.md`, `DECISIONS.md`: instrucciones y memoria compartida.
- `tools/session.ps1`: propiedad cooperativa de la sesión local; no valida gameplay.
- Scripts Python, patch*.py y test*.js de la raíz: herramientas históricas, todavía sin reorganizar. Leer antes de ejecutar; algunas escriben código o imágenes.
- `package.json`: herramientas Node de desarrollo; no controla la carga de los módulos en el navegador. Mantiene su configuración CommonJS original.

## Continuación gradual
La lectura devuelve width, height, basePixels y roofPixels. prepareMap los transforma en matrices, conteos y minimapa; buildWorld recibe ese resultado y construye las mallas. Las matrices de colisión siguen siendo mutables durante la partida para abrir puertas y retirar cofres. El ajuste final a un spawn seguro permanece en game.js.

Extraer controles/UI cuando se pueda verificar su comportamiento en navegador. No mover todas las herramientas ni reescribir las físicas junto con una extracción de datos.

Los datos exportados conservan los valores anteriores; cualquier cambio de balance, paleta o narrativa debe tratarse como una tarea distinta y quedar registrado en el relevo.
