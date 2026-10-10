# Estado vigente y relevo — cierre 2026-10-10 (segunda sesión)

Agente Codex, rama main. Base: ea8cfb61881674134a38a94074e2ee8fd40162e9.
Usuario solicitó documentación y push. Este encabezado sustituye los parámetros y comportamientos de los relevos históricos inferiores. Commit previsto: «Add quest-driven sky cycle, audio and atmosphere». Se escribe antes del commit: confirmar resultado con git log y origin/main.

## Producto y ciclo vigente
Demo web ligera, sin guardado persistente ni entrega de llave del puente; GRAHAM_BRIDGE_KEY_AVAILABLE sigue false. La activación del ciclo ya NO depende de recibir esa llave: el usuario pidió ligarla al corazón.
- src/systems/quest-sky.js mantiene el atardecer central fijo al iniciar (timer 157.2). Obtener corazón dispara forest con espera de 5 segundos de juego. Cuando comienza realmente el audio, el reloj avanza hasta noche y queda detenido.
- Entregar corazón a Graham coloca el reloj a 25 segundos del amanecer. Al comenzar amanecer se dispara morning una sola vez; desde allí continúa el ciclo automático completo. Si entrega ocurre temprano, primero completa oscurecimiento y después comienza ese tramo de 25 segundos.
- N bloqueada durante introducción; habilitada desde primer amanecer. Conserva transición manual de 3 s pasando por amanecer/atardecer. P o fallo de audio no bloquean misión: tras la espera original se permite avanzar aunque forest haya sido cancelada o fallado.
- Duraciones finales: día 134.6 s, atardecer 45.2 s, noche 44 s, amanecer 18.4 s; total 242.2 s. SKY_CYCLE_TIMING es la fuente común. Pausa detiene relojes.

## Cielo, luz y presentación
- sky-atlas.js: UV con margen interior 1.5 texeles evita línea negra del borde transparente x499 de Amanecer.png; atlas original sin reescritura. Noche usa distintas rotaciones por cara [0,1,2,3,1,3] y espejos en últimas dos, para disimular repetición.
- Sol.png de imagenes/Sprites/luna - sol integrado: arco norte (-Z) a sur (+Z), pasando por altura máxima, sincronizado con recorrido diurno y transiciones. Luna independiente del giro del cielo, opacidad diurna 40% y nocturna 100%; glow/azul calculados separadamente antes de aplicar opacidad.
- Rutas luna actualizadas a carpeta renombrada por usuario. cielo_falso ahora carga cielo_falso.png en lugar del JPG y evita caché con parámetro de versión.
- Niebla densidad 0.02 (antes 0.025): día #C3CBD5, noche #030304, atardecer #D99966, amanecer #BFA0AD. Mezcla por pesos de los cuatro skybox, también al inicio; amanecer rosa y atardecer naranja suaves. Último ajuste de colores verificado por sintaxis, pendiente juicio visual del usuario.
- Flicker global CRT más lento y discreto: 1.2 s ease-in-out, opacidad 0.97–0.98; antorchas conservan fluctuación propia.
- Minimapa con colores naturales de terreno; agua dibujada opaca y paleta de autoría intacta. Flecha dorada con punta clara y cola roja; dirección extraída de quaternion en Euler YXZ, sigue giros completos y pitch sin salto de yaw. Norte hacia arriba.

## Audio vigente
src/systems/music-events.js: AudioContext habilitado por Enter, singleton compartido startup/game; sin dependencias nuevas.
- forest.flac al obtener corazón, espera 5 s; morning.flac al primer amanecer sin retraso adicional. Una sola reproducción de cada pista por partida, sin bucles.
- Música ganancia 0.8. Reverberación: mezcla seca 28% / húmeda 72%, impulso estéreo difuso 8 s, predelay 65 ms, filtro de cola 2400 Hz. Viento y pasos fuera del bus musical.
- P detiene música actual y cancela pistas ya disparadas pendientes; no silencia viento/pasos ni eventos futuros. Cola de reverberación termina naturalmente. Menú pausa muestra P.
- Pausa suspende contexto completo y conserva posición; también congela esperas musicales. Reanudar continúa audio.
- Viento sintetizado: ruido blanco estéreo filtrado, base 0.078, ráfagas LFO 0.07/0.113 Hz con amplitudes 0.0234/0.0156; un solo generador por partida.
- Pisadas al mínimo del balanceo de cámara en suelo, no vuelo/bote/agua/salto/inmovilidad. Onda senoidal 90→38 Hz, envolvente 0.15 s, ganancia caminar 0.0816 / correr 0.1122. Cadencia irregular al caminar; correr menos sincopado y bob rate 16.9 frente a caminar 8. Pausa bloquea nuevos pasos.

## Movimiento, puertas y suelo
- Multiplicadores caminar 1, correr 2, volar 3, volar con Shift 9; conservar física y modificadores existentes de agua/bote.
- door-push.js empuja jugador tanto al abrir como cerrar, calculando huella en coordenadas locales de puerta girada. Prioriza atrás, prueba lado opuesto; si ambos bloqueados revierte movimiento de hoja sin dejar jugador atrapado.
- Puertas (228,423) y (235,423) abren hacia sur mediante doorOverrides en entities.js.
- Cofre corazón (165,308) ground SLAB: losa debajo y modelo ajustado sobre tapa, física coincide con altura. (166,308) y (166,309) conservan losa original. La primera petición inversa de tierra se corrigió; no quedó override de tierra ni se escribió mapa PNG.

## Verificaciones realizadas
- Cierre: sintaxis de 49 módulos game.js/src y git diff --check.
- Durante sesión: navegador local carga sin pageerror, atlas/sol/luna correctos; UV evita borde transparente y genera seis orientaciones nocturnas diferentes. Flecha validada con 40 combinaciones yaw/pitch.
- Puertas: 12 casos de apertura/cierre/ejes/ángulos, empuje alternativo y bloqueo seguro; ambas puertas hacia sur verificadas en mundo. Losa y base del cofre coinciden en tres celdas comprobadas.
- Audio real FLAC: carga/decodificación/reproducción, pausa conserva reloj; viento sin duplicación y render offline sin clipping en prueba previa al último aumento. Secuencia misión comprobada con audio real: atardecer fijo → forest → noche fija → entrega → 25 s → amanecer/morning → libre, sin errores. Pruebas controladas también cubren entrega temprana, P durante espera y pausa.
- Cambios finales de niebla, niveles y reverberación requieren evaluación auditiva/visual del usuario. No se repitió recorrido integral de demo ni medición FPS en hardware real ni despliegue público Pages. Instrumentación de pruebas intercepta HTTP o usa scripts inline; no hooks en producción.

## Git, servidor y relevo
- Incluir módulos intervenidos, documentos, dos FLAC, cielo_falso.png y traslado de sprites luna/sol necesario para rutas actuales. No git add indiscriminado.
- Excluir cambios ajenos: capa2.png, Pasto.png, arena.png, modificación de Noche.jpeg y eliminación de cinco caras antiguas de Cielo; conservarlos localmente. Estas últimas caras ya no se usan; Noche del repositorio sigue siendo atlas compatible con orientación nueva.
- Otros assets/copias/personajes, herramientas históricas, node_modules y package*.json sin seguimiento se conservan fuera del commit. No ejecutarlos sin inspeccionar escrituras.
- Servidor local http://127.0.0.1:8000/ permanece encendido; usuario no pidió apagarlo. tools/serve.cjs sin cambios. GitHub Pages conserva sitio estático/rutas relativas/.nojekyll; push no acredita publicación terminada.
- Protocolo sin cambios; ANTIGRAVITY_HANDOFF.md permanece como historia. Liberar sesión Codex después del push y leer este encabezado en próximo relevo.

---
## Relevos históricos (no prevalecen sobre estado actual)

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
