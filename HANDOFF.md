# Estado vigente y relevo

Fecha: 2026-10-10 (America/Santiago). Agente: Codex. Rama main.
Base de sesión: 5e96cbab575682a8e9fd3fab148de56180c4c858.
Cierre, servidor apagado, documentación y push solicitados explícitamente. Commit previsto: «Add sky cycle atlases, stone slabs and world decoration». Documento escrito antes del commit/push: confirmar resultado mediante git log y origin/main.

## Coordinación
Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md y DECISIONS.md antes de editar. Mantener sesión entre ajustes; actualizar documentos al cierre y usar Git solo con autorización. Protocolo sin cambios, ANTIGRAVITY_HANDOFF.md sigue como historial.
Demo ligera web, sin guardado persistente; Graham busca llave y no la entrega. Ciclo automático apagado con GRAHAM_BRIDGE_KEY_AVAILABLE=false.

## Cambios de esta sesión
- Cofre de mapa movido de (229,429) a (231,425), orientación final 90°. entities.js conserva sourcePosition: prepareMap recibe entidades y sustituye marcadores en datos/suelo/colisión/minimapa sin editar ese píxel de capa1. M sigue requiriendo el mapa. Si se cambia el marcador en el PNG, actualizar sourcePosition para evitar validación fallida.
- Cajas: siete en tres niveles, centro entre (230,429),(231,429),(230,430),(231,430); rotación 22.5°. Estante cinco niveles en (231,426), altura 2.4, girado -90° y offset X=0.65 junto al muro.
- Cajonera dos niveles (227,425–426), altura 1.4, giro 90°, offset X=-0.45. Pirámide de tres barriles acostados (227–228,428), giro 90°, offset X=-1.39, a 1 cm del muro. Colisiones por modelo; sin abrir cajones ni escalar muebles.
- Vegetación de capa1 redistribuida solo entre #008000/#7F7F7F/#3C2F7F/#22B14C, sin modificar otros píxeles. Cada tipo separado incluso diagonalmente: árboles exactos 7679→7557, arbustos 2293→2293, hierba 5458→5280. Desplazamiento local máximo ~11.31 celdas, reducción de densidad para abrir espacio. Copia anterior en .coordination/capa1-before-vegetation-20261010.png. Otros colores cercanos que decodificador aproxima no incluidos en esos conteos exactos.
- #7092BE/OTHER usa losa.png y bloques instanciados de celda completa: altura final SLAB_HEIGHT=0.4 en game.js. slabTops ajusta altura al caminar; 203 bloques en mapa probado. Material mezclado con terreno bajo ellos, base por altura central de celda. Revisar encuentro con terreno irregular si se amplían esas áreas.
- Agua2/3 igualadas al color de Agua1 editada por usuario. Ajustes posteriores azul/cielo conservan patrones y tamaño 64x64. Opacidad final 0.4752 (0.594 *0.8), saturación en shader 0.7225 (dos reducciones consecutivas 15%). Animación/ondas conservadas. Niebla día #8193AA, densidad 0.025 sin cambios.

## Cielo vigente (sustituye ajustes de caras individuales)
- Nuevo src/world/sky-atlas.js lee despliegue 4x3, cubo 1400 por lado. Orden de caras +X,-X,+Y,-Y,+Z,-Z: celdas (3,1),(1,1),(2,0),(2,2),(2,1),(0,1), coordenadas desde cero. UV comparte imagen sin recortes ni regenerar atlas diurnos.
- Assets activos: imagenes/Texturas/Cielo/Ciclo/Dia.png, Amanecer.png, Atardecer.png (500x375); Noche.jpeg convertido a atlas 1280x960 con seis caras 320x320, repitiendo textura de estrellas anterior. Original nocturno guardado en .coordination/Noche-before-atlas.jpeg. No es panorámica nueva con estrellas únicas por cara.
- Cuatro cubos rotan sincronizados, horizonte centrado en ojos y luna independiente. Día/noche tienen seis materiales; amanecer/atardecer uno cada uno. Alfa acumulada según pesos para evitar oscurecer artificialmente el fundido. Los colores del atlas se usan directamente: se retiró filtro de saturación anterior del cielo al reemplazar el skybox.
- src/world/sky-cycle.js: ciclo preparado de 242 s = día139, atardecer18, noche73, amanecer12. No automático en demo; mantiene activación futura al recibir llave de Graham.
- N manual: 3 segundos noche→amanecer→día / día→atardecer→noche, fundidos smoothstep, breve tramo central; segunda pulsación parte de pesos actuales sin salto inicial. Pausa detiene avance y rotación. Luces/niebla/intensidad antorchas siguen dayTransition = peso día +0.5*(amanecer+atardecer); colores cálidos de niebla para esos estados aún no configurados.
- Hubo varias pruebas de color de cinco imágenes individuales y cambios de orientación; se conservan en Cielo/ con nombres fila,columna, pero ya no se usan por el juego. Sustituir futuros colores editando los atlas activos. Antiguas rutas Cielo_dia y Cielo.jpeg retiradas al reorganizar carpeta por usuario.

## Verificaciones
- Sintaxis de game.js y todos los módulos src al cierre; git diff --check.
- Puppeteer durante sesión: carga sin pageerror, cofres sin duplicación/mapa conservado, posiciones y colisiones de cajas/cajonera/barriles, 203 losas con altura física igual a tapa, separación de vegetación (cero pares iguales adyacentes), texturas agua/cielo conservan tamaños.
- Pruebas de ciclo: al centro de manual se ve amanecer/atardecer y al final día/noche; inversión con delta0 mantiene pesos. Estados automáticos muestreados en 0,148,180,236 s; cuatro atlas cargan, nocturno seis caras y cubo correcto sin errores.
- No repetir recorrido integral demo ni prometer mejora FPS por estos cambios. Pendiente revisión visual del usuario de uniones del nuevo atlas, ciclos y decoración, y medición en hardware real. No se comprobó despliegue público Pages.
- Servidor local tools/serve.cjs detenido por solicitud del usuario; puerto 8000 sin escucha. Próximo inicio: node tools/serve.cjs.

## Git y material local
- Commit solo cambios de la sesión, mapa capa1 intervenido, agua/losa, atlas activos y caras individuales trabajadas, nuevas geometrías/controladores y documentación. No incluir indiscriminadamente archivos auxiliares.
- Cambios ajenos detectados y conservados fuera del commit: capa2.png, Pasto.png, arena.png. También sprites/personajes nuevos y copias de imágenes sin seguimiento; no fueron encargados ni editados por Codex en esta sesión.
- Scripts históricos, node_modules, package.json/lock, temporales y .coordination permanecen locales; no borrarlos ni ejecutarlos a ciegas.
- Estado base anterior y sus pendientes se conserva abajo como historial; las coordenadas y parámetros de este encabezado prevalecen.

## Relevo anterior (historial del cierre 2026-10-09)

Fecha: 2026-10-09 (America/Santiago). Agente: Codex. Rama: main.
Base: 06a8ec8d22e5c19cc30b85e3f8f399753df1a44d.
Usuario solicitó cierre, documentación y carga a GitHub. Commit previsto: «Optimize world rendering and add furniture, inventory and demo interactions». Este documento se escribe antes del commit y push; confirmar resultado con git log y origin/main.

## Coordinación y producto
- Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md y DECISIONS.md. Adquirir sesión antes de editar; conservarla entre ajustes. Documentación al cierre, Git solo con autorización explícita.
- Juego web JavaScript/Three.js 0.160, sin dependencias nuevas, backend ni guardado de progreso. Demo: encontrar corazón y entregarlo a Graham; río limita acceso, Graham sigue buscando llave.
- ANTIGRAVITY_HANDOFF.md conserva historia. Protocolo sin cambios en esta sesión.

## Resultado de la sesión completa
- Inicio: pantalla de Enter antes de cargar recursos; src/startup.js importa game.js después del gesto y muestra errores de carga. Pausa bloquea acciones y limpia entradas; continuar solo con clic izquierdo.
- Botes: casco hueco (ancho 1.6, pared 0.16, cavidad 80%), centro Y=0.09, cubierta 0.29. Navegación comprueba toda huella y movimiento por pasos; no atraviesa tierra/obstáculos ni permite vuelo al navegar.
- Cielos de día/noche giran juntos; luna fija. N conserva transición manual. Automático preparado para entrega futura de llave: GRAHAM_BRIDGE_KEY_AVAILABLE=false impide entrega/ciclo en demo. Activarlo habilita entrega tras corazón y ciclo automático; no desbloqueo por fecha.
- Vegetación: solo árboles colisionan; arbustos escala 0.8, hierba altura +10%. Viento GPU suave con fases/ritmos variados, arbustos/hierba velocidad +20%; se pausa con juego.
- Niebla exponencial suave día/noche. Antorchas exteriores no iluminan ni muestran llama de día; soporte participa de niebla.
- Agua: tinte 0xb8d9ff, opacidad 0.594, ondas visuales GPU sin alterar física. Fondo del mar arena, río/lago WATER_ROCK piedras. Plano de respaldo Y=-2.7 elimina solapamiento; filtrado de roca con mipmaps/anisotropía.
- Cofres facetados cerrados/abiertos: E entrega una vez y sustituye modelo. Exterior sobre tierra, interior sobre madera. Cofre corazón (165,308) girado 180° (usuario lo indicó como 165,309; se identificó el existente sin moverlo).
- Cofre (229,429) entrega mapa; M deshabilitado hasta posesión. Inventario seis casillas 2x3, texto blanco: corazón arriba primero; abajo antorcha, mapa, llave. Llave y contador ocultos cuando cantidad cero.
- Puertas simples abren al lado opuesto; colisiones según huella visible de modelos. Si cierre alcanza jugador lo desplaza hacia atrás a lugar libre o reabre si no hay espacio seguro.

## Optimización sin reducir detalle ni distancia
- terrain-sectors.js divide terreno en 256 sectores, comparte atributos y conserva 8,355,872 triángulos; descarta por frustum, no LOD ni oclusión real detrás de paredes.
- instance-sectors.js compacta instancias de vegetación por sectores visibles en 11 mallas; actualiza solo si cambia visibilidad, conserva viento y todos los elementos.
- roof-blocks.js fusiona cubos contiguos equivalentes: 151,296 bloques → 2,265 piezas; misma cobertura y silueta, menos caras internas.
- terrain-height.js consulta alturas de vértices existentes con interpolación; mantiene suelo físico/render compartido. Reutilización de vectores, resultados raycaster y candidatos/selección de luces reduce asignaciones.
- Benchmarks headless no acreditan FPS estables en hardware del jugador; requiere medir recorrido real. No afirmar ganancia global garantizada.

## Muebles y coordenadas vigentes
Configurados en src/content/entities.js; offsets en unidades del mundo, celdas multiplicadas por UNIT_SIZE=2. Geometrías fusionadas en src/world/*-geometry.js, sólidos por huella de modelo, sin interacción de sentarse/abrir cajones.
- Graham: (235,421).
- Cama: (237,427–428), girada 180°, cabecera hacia 428. Mesa auxiliar (238,428), giro 180°, offset Z=0.525.
- Tres barriles de pie en X235, Z419–420: offsets Z=-0.5 / 0.75 / 0.
- Librero tres niveles/libros (228,420–421), giro 90°, offset X=-0.625.
- Mesa (231–232,422), sillas (230,422)/(233,422), orientadas hacia mesa, offsets X=+0.65/-0.65.
- Ropero dos puertas (236–237,424), offset Z=-0.45.
- Escritorio/cajonera (234–235,428), offset Z=0.35; silla (234,427), offset Z=1.3 (5 cm de separación).
- Ropero, librero y mesa auxiliar a 5 cm de murallas verificadas. Mapas no se regeneraron.
- Exportaciones solicitadas: exports/cofres/cofre_cerrado.glb, cofre_abierto.glb y exports/cama/cama.glb; texturas incorporadas. Exportaciones anteriores no reflejan colocación posterior en escena. Otros muebles aún sin GLB.

## Verificaciones y límites
- Sintaxis de todos los módulos game.js/src y git diff --check al cierre.
- Puppeteer local: carga sin pageerror; muebles sobre piso, posiciones/colisiones; orden inventario y llave visible con 1, oculta con 0. Pruebas instrumentan respuestas HTTP, sin hooks en producción.
- Durante sesión: botes/embarque, cofres entrega/apertura, mapa/M, pausa, 30 puertas/cierre seguro, variante futura de llave solo en interceptación de prueba, viento/ondas/shaders, vegetación por frustum y rotación de cielos.
- Optimización: 1,200 consultas altura diferencia máxima 0.0000024855, tiempo muestra 2.4 → 0.3 ms; luces diferencia 1.78e-15; cobertura de techo idéntica, cambios raster menores a 0.03% en dos capturas.
- Últimos ajustes de sillas comprobados por geometría/configuración; falta revisión visual final del usuario del amueblado completo. Recorrido integral de demo y despliegue público no reprobados al cierre.
- Scripts/capturas/benchmarks locales ignorados en .coordination/. Herramientas históricas, node_modules, package.json/lock y otros auxiliares sin seguimiento conservados y excluidos del commit.
- capa1.png fue modificada por el usuario durante la sesión; se incluye su actualización en la carga completa solicitada, sin regenerarla.
- GitHub Pages mantiene .nojekyll y rutas relativas; no requiere compilación. Configuración/despliegue se verifica en GitHub, no inferir éxito de publicación por push.
- Servidor local node tools/serve.cjs en http://127.0.0.1:8000/; no detenido por cierre, continuidad depende del proceso.
