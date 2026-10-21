# Decisiones del proyecto

## 2026-10-16 — Forma de montaña según nieve vigente
- Por pedido posterior de Clawshoot, la nieve pintada en capa1 define la cima y el color marrón define las laderas; sustituye el criterio previo de nieve adicional solo como textura sobre pendientes. Conservar el trazado del camino, cuya altura sigue la misma superficie de ladera y cima, sin rampa independiente. Desnivel de referencia aumentado10% (cima129.02256, pie1). Mantener las colisiones anteriores al repintado; la referencia histórica de colores no gobierna alturas. Verificaciones y límites en la entrada de diseño estético de HANDOFF.md.

## 2026-10-16 — Integración de PR #2 con la progresión vigente
- `GRAHAM_BRIDGE_KEY_AVAILABLE=true`: Graham termina primero la entrega y el agradecimiento del Corazón del Bosque. En una interacción posterior entrega la llave del puente; solo entonces se abre el cofre del mapa y permite recogerlo. Los apuntes de la instantánea del PR que indiquen llave pendiente o cofre abierto antes quedan sustituidos por esta decisión.

## 2026-10-16 — Cofre y mate en IslaJaipoC1
- El cofre se abre al cerrar el agradecimiento completo tras entregar el corazón; el mapa permanece visible dentro y exige E/B para recogerlo. Se descarta la llave del cofre y la adjudicación automática del mapa.
- Graham entrega un mate al interactuar con mate/tetera. Clic derecho en PC o A en móvil acercan la bombilla; gesto breve de 1,5 s o sostenido mientras se pulsa. No consume el objeto ni cambia misiones.
- La llave del puente permanece pendiente. La publicación solicitada es un PR para revisión en main, sin fusión automática.


## 2026-10-16 — Entrega de Graham y dap de AxByZ
- Texto de entrega y recordatorio sustituidos por pedido explícito. Tras segundo agradecimiento, acercamiento rápido de ambos con sonido adjunto y retirada suave antes de seguir. El gesto no se repite en el recordatorio. Audio original M4A conservado; pausa usa el mismo reloj de audio.
- Graham todavía busca las llaves: disponibilidad desactivada, sin recompensa inmediata ni condición de hallazgo inventada. La futura forma de obtenerlas queda pendiente. No cambian triggers de cielo: amanecer detenido y Mañana esperan apertura del puente. Ver HANDOFF.md para alcance y comprobaciones.

## 2026-10-14 — Preparación submarina y protección de rotación
- Anticipar vegetación submarina al pisar mar, conservar recursos en memoria y limitar dibujo al alcance de niebla vigente80/1.3≈61.54u; vegetación terrestre retorna desde altura de cámara−2.5 y se oculta al descender. Construcción con presupuesto3ms por tanda y preparación del render a textura antes de la primera inmersión. Sectores actualizan matrices incrementalmente sin alterar reglas físicas ni población.
- Solicitar entrada de mouse sin aceleración cuando se admita, con respaldo compatible, y confirmar deltas grandes aislados mediante otra muestra coherente en50ms. Umbral base100px/adaptación12×muestra previa reciente120ms; conservar sensibilidad normal, barridos rápidos y ruta táctil. Puede descartar movimientos intencionales grandes de una sola muestra: revalidar con hardware del usuario. Video confirma salto visual, no causa del dispositivo; resultados aislados no acreditan FPS real ni solución definitiva en mouse físico. Detalles y evidencias en el cierre propio de HANDOFF.md.

## 2026-10-14 — Audio de Mañana y sprites de Submarino
- Por pedido de Clawshoot, Mañana queda con volumen100% y mezcla50% reverberada/50% directa; conservar cola8s, pre-delay65ms y filtro2400Hz. El bus por mezcla conserva Bosque60/40 y el bus separado de Submarino; no cambiar disparadores por este ajuste.
- Submarino usa los PNG originales nuevos del usuario corazon-mar.png y fragmento-mar.png para mundo, objeto en mano e inventario. Conservar SVG anteriores, escala y reglas; comprobación visual pendiente. Separar estas sustituciones de las ediciones ajenas al integrar por evento.

## 2026-10-14 — Cierre documental por rol y publicación manual
- Por instrucción de Clawshoot, todos los chats y agentes al recibir «cerremos/finalicemos la sesión» completan solo la documentación pertinente a su rol y su entrada en HANDOFF.md, y liberan su bloqueo. DECISIONS.md se actualiza con decisiones duraderas del ámbito; reglas compartidas y enlace histórico solo cuando cambie un acuerdo explícito.
- El cierre deja de autorizar staging, commit y push automáticos. Clawshoot realiza manualmente la publicación en GitHub. Sustituye la decisión de cierre del 2026-10-11; no borrar los acuerdos históricos ni modificar trabajo ajeno. El servidor LAN continúa hasta orden expresa de apagado. Procedimiento vigente en docs/PROTOCOL.md.

## 2026-10-14 — Diseño estético, pasto y ancho de árboles
- Este chat gestiona la presentación visual conforme a docs/VISUAL_DESIGN.md; los efectos de sonido se modifican por petición explícita. Preservar mapas y assets originales y coordinar cambios que afecten física o reglas.
- Pasto usa sonidos/fx/pasto.mpeg completo, estéreo, a velocidad original y sin filtros, recortes ni envolvente heredados. Mantener alternancia y variación de intensidad. Ganancias base finales: correr0.14 y caminar0.14×(0.0816/0.1122)≈0.101818; acentos exteriores correr1/0.72, caminar1/0.65, más variación correlacionada. Ritmo ligado al movimiento e interiores conservados.
- Árboles: ancho visual de ambos planos cruzados3.8→4.4unidades, extensión0.3 por lado; altura, colisiones y originales conservados. Verificaciones y límites en HANDOFF.md.

## 2026-10-13 — Ampliación del chat de pruebas a rendimiento y optimización
- El usuario amplió el rol de este chat para incluir pruebas de rendimiento e implementación de optimizaciones en función de los resultados. Procedimiento y responsabilidades en docs/TESTING_PERFORMANCE.md; relevo en HANDOFF.md.
- Comparar antes/después en condiciones equivalentes y verificar regresiones. Preservar reglas y presentación acordadas; no inferir autorización para cambiar diseño, balance o reducir calidad visual. No afirmar ganancias o comportamiento en hardware no probado. Esta ampliación no ejecuta pruebas, cierre ni commit/push por sí sola.

## 2026-10-13 — Servidor persistente para escritorio y móvil
- Este chat gestiona solo el servidor de desarrollo. Levantar la copia en LAN (`node tools/serve.cjs --lan --port=8001`) para acceder desde escritorio o móvil en la misma red y mantenerlo activo hasta una orden explícita de apagado.
- La sesión o chat puede cerrarse sin detener el servidor. Al apagar, identificar el proceso de esta copia y comprobar que dejó de responder. No modificar firewall; LAN usa HTTP y expone las rutas de la demo que permite `tools/serve.cjs`.

## 2026-10-13 — Chat dedicado a quests y eventos musicales
- El usuario dedica este chat a crear y gestionar quests y eventos asociados a canciones. Catálogo, responsabilidades y procedimiento en docs/QUESTS.md; coordinar NPC, organización y pruebas mediante documentos, con bloqueo local único.
- Desarrollo previsto de ocho canciones: forest, morning, moon y underwater disponibles; forest/morning/underwater conectadas, moon pendiente y cuatro canciones aún por definir. No asumir correspondencia de una misión independiente por canción ni inventar contenido restante. Este acuerdo documental no implementa gameplay ni ejecuta cierre o commit/push.

## 2026-10-13 — Chat dedicado a gestión de NPC
- Por petición del usuario, el chat de este acuerdo gestiona NPC, conversaciones e interacciones. Procedimiento, ficha de personaje, referencia de Graham y verificaciones en docs/NPCS.md, conectado a la arquitectura actual sin introducir sistemas o dependencias nuevas.
- El relevo ocurre mediante documentos y conserva un único bloqueo para esta copia, también entre chats de Codex. Mantener independiente el chat de pruebas complejas y preparar su relevo cuando corresponda. La petición documental autoriza estas ediciones durante la sesión, sin cerrar ni autorizar commit/push por sí sola.

## 2026-10-13 — Chat dedicado a pruebas complejas
- El usuario asignó a este chat la función dedicada de testear el proyecto cuando las actualizaciones sean muy complejas. El relevo entre implementación y pruebas se conserva en HANDOFF.md, con versión, alcance, reproducción, verificaciones y pendientes; procedimiento en docs/PROTOCOL.md.
- Distinguir resultados comprobados, errores confirmados y pruebas no ejecutadas. Respetar el bloqueo de la copia y los comandos de inicio/cierre existentes. Registrar este acuerdo no inicia pruebas del juego ni autoriza por sí mismo commit/push o cambios de diseño.

## 2026-10-11 — Comando persistente para retomar
- «Retomemos la sesión» activa lectura del relevo y bloqueo, verificación remota con actualización segura por fast-forward cuando corresponda, servidor local verificado y sugerencias priorizadas según el proyecto actual. Autorización del usuario persistente para fetch/pull de inicio; no para commit/push ni sobrescribir trabajo local. No reset/force/stash automático. Procedimiento en docs/PROTOCOL.md y recordatorio en HANDOFF.md.

## 2026-10-11 — Comando persistente para cerrar
- «Finalicemos la sesión», «cerremos la sesión» o equivalente autorizan actualizar documentos con novedades/verificaciones/pendientes, commit y push del trabajo realizado, apagado del servidor local del proyecto y liberación del bloqueo. Sustituye requisito anterior de pedir autorización Git separada al cierre. Excepciones explícitas del usuario prevalecen; preservar cambios ajenos, verificar remoto y apagado, y comunicar cualquier paso incompleto. Registrar esta instrucción no ejecuta por sí mismo el cierre.


## 2026-10-08 — Cierre y estado final solicitado
- Sesión de trabajo abarca varios pedidos: documentación y relevo únicamente al cierre explícito. Git requiere autorización; este cierre autoriza subir los cambios de Codex a origin/main.
- Graham en celda (231,422), posición explícita independiente de antorchas, pies sobre suelo y relleno cálido según iluminación cercana.
- Estado final de luces: interiores base 43.2/alcance 24; exteriores base 14.4/alcance 19.2. Exteriores se activan gradualmente entre 44 y 20 unidades, con suavizado de 0.85 s; 12 luces reutilizadas como máximo.
- Antorchas exteriores tienen matriz propia para preservar techos de la segunda capa y excluir suelo de madera.
- Agua animada con tres texturas existentes, opacidad 0.66, fondo litoral y arena continuos. Jugador sigue fondo somero antes de flotar; reglas de resistencia y ahogamiento no cambian.
- Montaña conserva altura previa aproximada (máximo 375 en mapa actual) con crecimiento acumulativo desde bordes de bandas, en vez de multiplicar distancia al mar por color. Edificio debe estar en la cumbre y camino debe llegar a puerta: plataforma elevada, relieve subyacente continuo y corredores diagonales transitable sobre DIRT. Conservar cerradura existente.
- Servidor local reproducible sin dependencias con node tools/serve.cjs; procesos locales no forman parte del repositorio ni su continuidad está garantizada al cerrar la app.

## 2026-10-08 — Corrección de bordes y suelo exterior
- Conservar la identidad EXTERNAL_TORCH durante lectura del mapa para que no se infiera madera por cercanía a interiores. Sus parámetros visuales/de luz siguen compartidos.
- Reemplaza decisión anterior de omitir terreno bajo madera: mantener malla continua, a Y=0.98 debajo del piso Y=1, con transición suave de media celda al exterior. Compartir alturas con física para evitar cortes visibles y suelo atravesando madera.

## 2026-10-08 — Ajuste solicitado de antorchas
- #50727A identifica antorchas exteriores en cualquiera de las capas. Comparten sprite y parámetros de iluminación con las de muro.
- Aumentar intensidad y alcance del mundo un 20% (base 14.4 y radio 19.2), incluyendo fluctuación. Mantener hasta 12 luces cercanas.
- Jugador posee antorcha desde inicio en inventario, con torch1.png de los muros. Comienza apagada y se alterna con T; conservar su potencia anterior.

## 2026-10-08 — Superficies y antorchas
- Compartir cobertura de madera entre render y consulta de altura; omitir terreno bajo ella para evitar penetración y solapamiento.
- Alinear los pies visibles de Graham con el suelo, compensando transparencia del sprite original.
- Cada marcador de antorcha tiene sprite; si se superpone a un árbol, reemplaza su vegetación y colisión. Preservar mapas originales.
- Reutilizar hasta 12 luces cercanas al jugador, seleccionadas cada 0.2 segundos, en vez de iluminar solo las primeras antorchas por orden del mapa. Mantener ligero el render web.

## 2026-10-08 — Plataforma y alcance (confirmado por el usuario)
- Mantener un juego web ligero usando JavaScript y recursos del equipo del jugador. Three.js es la base actual. Python puede preparar recursos en desarrollo; no es requisito para el jugador.
- La demo está cerca de terminar y cubre la zona inicial y la búsqueda/entrega del Corazón del Bosque. El río es el límite natural del área disponible.
- Graham indica que busca la llave. La versión completa, prevista para meses después, actualiza su diálogo y entrega la llave para acceder al resto. El desbloqueo depende de la publicación de contenido, no del reloj.
- No añadir guardado persistente de progreso a la demo por ahora. La búsqueda se repite al entrar. Las preferencias y el reinicio tras muerte son temas separados.

## 2026-10-08 — Coordinación
- Una herramienta editora por copia del proyecto, con bloqueo cooperativo local y relevo escrito.
- AGENTS.md contiene reglas; docs/PROTOCOL.md el procedimiento; HANDOFF.md el estado vigente; este archivo las decisiones duraderas.
- Preservar ANTIGRAVITY_HANDOFF.md como historial y punto de entrada para Antigravity.
- No cambiar gameplay, mapas, dependencias ni publicar en GitHub durante la creación del protocolo.

## 2026-10-08 — Primera separación de código
- Usar módulos ES nativos del navegador sin empaquetador ni dependencias nuevas.
- Mantener game.js como entrada y separar únicamente parámetros, paleta y diálogos en src/. Conservar valores, textos, rutas de assets y lógica.
- Las herramientas históricas permanecen en sus rutas hasta identificar sus dependencias. La configuración CommonJS de las herramientas Node no se cambia.

## 2026-10-08 — Lectura de mapas
- Separar carga/lectura RGBA y decodificación de colores de la construcción Three.js. Mantener aproximación de colores, transparencia y reglas de capa 2 vigentes.
- Rechazar imágenes de tamaño cero y capas de dimensiones distintas antes de construir la escena. No imponer colores exactos ni restringir elementos de capa 2 en esta extracción.
- Mostrar errores de carga con el nombre real de la capa y textContent; detalles técnicos en consola.

## 2026-10-08 — Preparación de datos del mapa
- Extraer prepareMap a src/world/map-data.js conservando conteos, variantes de vegetación, colisiones, spawn y minimapa. No cambiar geometrías ni físicas.
- Mantener mutables las matrices usadas por gameplay; las puertas y cofres actualizan sus celdas durante la partida. La comprobación de spawn seguro sigue en el constructor de escena.

## 2026-10-08 — Interfaz del minimapa
- Encapsular elementos DOM y visibilidad en createMinimap. game.js conserva teclado y envía coordenadas/dimensiones; no conoce el indicador ni su contenedor.
- Mantener estilos, tecla M, fórmula de posición y actualización solo cuando está visible. No cambiar estados de pausa/inventario/diálogo en esta extracción.

## 2026-10-08 — Presentación de menús
- Encapsular DOM de pausa, inventario, diálogo y contador de llaves en createMenus. Reanudar mediante callback, sin importar Three.js desde la interfaz.
- Mantener los estados, teclas, reglas de interacción y avance del diálogo en game.js. No introducir una máquina de estados ni corregir comportamiento ajeno a esta extracción.

## 2026-10-08 — HUD
- Encapsular DOM de interacción, resistencia y muerte. Preservar textos, colores y actualización de barra solo cuando está visible.
- Mantener cálculo de resistencia y flujo de muerte/reinicio en game.js. Las pruebas pueden instrumentar una página descartable; no añadir hooks de prueba al juego distribuido.

## 2026-10-08 — Teclado
- Separar traducción de teclas a acciones con bindKeyboard; conservar teclas, repetición de eventos, secuencia de vuelo y comportamiento de keyup.
- Las condiciones y mutaciones de gameplay permanecen en game.js mediante callbacks. interact devuelve true cuando consume avance de diálogo, conservando el retorno temprano anterior.
- No introducir cambios de foco, preventDefault o restricciones nuevas durante esta extracción.

## 2026-10-08 — Consultas de terreno y colisiones
- Separar ruido/altura en terrain-height.js y consulta de obstáculos en player/collisions.js sin cambiar fórmulas, radios, bordes ni condiciones del bote.
- Usar parámetros explícitos con matrices actuales; no copiar ni cachear colisiones que cambian al abrir puertas o retirar cofres. game.js conserva wrappers y movimiento/físicas.

## 2026-10-08 — Puertas
- Separar apertura/cierre y actualización de colisiones en systems/doors.js; mantener autorización y consumo de llave en game.js.
- Corregir fallo preexistente confirmado en navegador: material de puertas es un array; material.color.setHex fallaba después de consumir la llave. unlockDoor aplica color a todos los materiales y se usa también para la hoja vecina. No cambiar reglas de llave ni de adyacencia.

## 2026-10-08 — Entidades y Corazón del Bosque
- Usar coordenadas enteras del mapa X=columna, Z=fila desde esquina superior izquierda, con conversión al mundo por UNIT_SIZE. Configurar contenido de cofres sin modificar imágenes.
- Usar imagenes/Sprites/corazon.png en inventario. Cofre asignado entrega corazón en lugar de llave; cofres restantes conservan sus llaves.
- Entrega al terminar el diálogo con Graham; después agradece y sigue buscando la llave. Sin llave de puente ni guardado persistente.
- El usuario confirmó el cofre 4: X=165, Z=308 (mundo 330,616). entities.js asigna forest-heart-chest a esa celda; otros cinco cofres mantienen llaves.

## 2026-10-08 — Segundo cierre: montaña, interacción y preparación de Pages
- Sustituye escala de montaña anterior fija: ajustar altura al trazado para pendientes naturales, aumento posterior del 15%, cumbre actual ~76. Conservar meseta blanca y camino al modificar solo banda marrón a rampa aproximadamente lineal.
- Mantener terreno y física compartidos; texturas mezcladas en una malla. WATER_ROCK #3282F6 distingue río/lago; mar y río/lago usan rocas.jpg en fondo. Agua a Y=-0.05, botes a Y=0.05 y ojos del jugador sobre cubierta.
- Sustituye posesión inicial de antorcha: Graham la entrega apagada al completar introducción; T requiere posesión. Sin persistencia entre recargas.
- Muros 2.662, hojas de puerta 2.0 y márgenes 0.2; doble puerta sin pilar central. Techos usan cota común por cubierta; vegetación conserva tamaño independiente de muros. Anclaje de antorchas prioriza muro y respeta altura de apoyo.
- N cambia día/noche manualmente en 3 segundos; automático sigue pausado con duraciones previas conservadas. Rotar solo cubo nocturno cada 20 minutos, dejando luna fija.
- C única tecla de agacharse. Inventario antorcha primero, corazón segundo; filtros de vegetación en materiales y reducción de relleno de Graham, sin editar sprites.
- Cierre autoriza commit/push del proyecto vigente, incluidos mapa actualizado por el usuario y traslado de techo en capa2 solicitado. Excluir herramientas locales históricas y dependencias de desarrollo sin seguimiento.
- Preparar GitHub Pages como sitio estático desde main/raíz con .nojekyll y rutas relativas sensibles a mayúsculas; documentar activación pendiente. No introducir empaquetador ni servicios.

## 2026-10-09 — Cierre: optimización, muebles e inventario
- Conservar distancia y detalle: sectores de terreno y compactación de vegetación por frustum; no LOD. Fusionar techos de igual altura y consultar física sobre vértices existentes. FPS real pendiente de medición.
- Demo sin ciclo automático hasta llave futura; GRAHAM_BRIDGE_KEY_AVAILABLE=false. N manual permanece disponible.
- M requiere mapa del cofre (229,429); inventario inferior antorcha/mapa/llave, llave oculta con cero. Cofres abiertos conservan colisión y no duplican premio.
- Graham (235,421). Muebles por coordenadas/offsets en entities.js, con colisión visible; posiciones vigentes detalladas en HANDOFF.md.
- Mar con fondo de arena, río/lago de rocas; agua 0.594 con ondas visuales. Solo árboles colisionan entre vegetación.
- Cierre autoriza commit y push de toda la sesión, mapa actualizado por usuario y exportaciones GLB solicitadas; excluir auxiliares y dependencias locales históricas.

## 2026-10-10 — Atlas, decoración y superficies
- Usar atlas 4x3 de seis caras para los cuatro estados del cielo, reemplazando caras sueltas. Rotación conjunta, luna fija y horizonte centrado en jugador. Ciclo automático permanece apagado en demo; N atraviesa amanecer/atardecer en 3 s. Ciclo futuro: 242 s (139/18/73/12).
- Noche.jpeg se compone de la textura original repetida en seis caras; preservar original en copia local. Atlas diurnos proporcionados por usuario no se regeneran.
- Cofre del mapa ahora (231,425), orientación 90°, traslado de datos desde (229,429). Decoración y posiciones finales en HANDOFF.md.
- Vegetación por píxeles exactos distribuida con separación de vecinos iguales, preservando otros colores; aceptar reducción localizada de 122 árboles/178 hierbas.
- Losas #7092BE de 0.4, altura física compartida. Agua opacidad 0.4752, saturación shader 0.7225; niebla diurna #8193AA. Cielo nuevo usa color propio del atlas.
- Cierre autoriza apagar servidor, commit y push del trabajo encargado; excluir cambios ajenos en capa2/pasto/arena y herramientas auxiliares.

## 2026-10-10 — Segunda sesión: misión, cielo y audio
- Sustituye activación anterior del ciclo por llave: inicio detenido al centro del atardecer; corazón y comienzo de forest tras 5 s activan oscurecimiento; noche queda fija hasta entregar corazón a Graham. Entrega sitúa noche 25 s antes de amanecer, primer amanecer dispara morning y libera ciclo normal. N no salta introducción. P/fallo de música respetan espera pero no bloquean misión. Llave de puente continúa deshabilitada en demo.
- Duraciones finales de ciclo: 134.6/45.2/44/18.4 s (día/atardecer/noche/amanecer), total 242.2 s. Sol recorre norte a sur según reloj; luna día 40% / noche 100%. UV interiores y distintas orientaciones nocturnas corrigen presentación sin regenerar atlas.
- Niebla por pesos de cuatro estados: día #C3CBD5, noche #030304, atardecer #D99966, amanecer #BFA0AD, densidad 0.02. Minimapa natural y flecha por quaternion/YXZ.
- Audio local con Web Audio: eventos únicos forest/morning; pausa congela audio y esperas, P detiene música. Viento/pasos sintetizados; música volumen 0.8, reverb húmeda 72%, cola difusa 8 s. No servicios/dependencias ni persistencia.
- Puertas empujan al abrir/cerrar o revierten si no hay espacio; overrides de ambas puertas (228,423)/(235,423) hacia sur. Cofre del corazón sobre losa. Correr 2x, vuelo 3x y vuelo Shift 9x.
- Cierre autoriza documentación, commit/push del trabajo realizado y assets necesarios. Servidor permanece encendido. Excluir cambios ajenos de mapas/texturas/atlas y auxiliares locales.

## 2026-10-11 — Misión y presentación solicitadas
- Graham entrega llave del puente al completar misión del corazón; recibirla inicia los 25 segundos finales de noche previos al primer amanecer. Cofre del mapa requiere esa llave y diálogo señala regalo para orientarse. Reemplaza anteriores decisiones de llave deshabilitada y amanecer por entrega del corazón.
- forest usa archivo MPEG y espera 4 segundos. Ajustes finales de viento, antorcha, vegetación y flare están en HANDOFF.md; no volver a valores históricos.

## 2026-10-11 — Agua, costa y edificaciones
- WET_SAND #7D6207 usa arena_mojada.png con condiciones costeras de arena; prolongar al fondo somero vecino y conservar fondo.png en mar profundo.
- Agua corre visualmente por WATER_ROCK #3282F6, pero es no navegable para botes. Frecuencia final 0.588 y desplazamiento 1.6; no introduce empuje físico.
- Madera exterior conectada al agua es muelle. Conservar contacto terrestre bajo extremos apoyados en arena/pasto/tierra y dejar agua bajo tramos acuáticos, incluidos muros de puentes. Nivelar puente cubierto y casa de Graham a accesos exteriores antes de construir sus elementos.

## 2026-10-11 — Botes y utilería
- Modelos procedurales ligeros con Three.js, sin dependencias nuevas ni assets originales regenerados: restos de naufragio, barco hundido, troncos, mesón/hacha y tocón.
- Bote sin remos con proporción 1:2. Giro inicial a izquierda y proa controlada por mirada horizontal; barrer giro y movimiento con huella orientada contra costas y río.
- Asiento 0.70 detrás y ojos 0.70 más bajos que posición original. Flotación visual suave con cámara acompañando altura, conservando centro de navegación y control libre de mirada.
- El primer commit de cierre incluyó código, documentación y recursos necesarios. El usuario amplió después la autorización para subir todos los archivos modificados: las 13 ediciones pendientes de sprites y texturas se incorporan en un segundo commit sin modificar sus imágenes.

## 2026-10-11 — Visibilidad por niebla y cierre de rendimiento
- Descartar mundo oculto por FogExp2, conservando límites completos y reaparición; no reducir detalle cercano ni distancia de cielo. Alcance común 300, montaña 600, cámara 1500. Densidad común ≈0.01011618 con resto 0.0001. Sectores estáticos y vegetación combinan frustum/niebla.
- Montaña usa menor niebla por pesos/altura y fundido de silueta con alphaHash entre 420–600; terreno común funde 210–300. Evita corte contra cielo de color distinto. Física/interacciones preservadas. Medición FPS en hardware afectado pendiente; reducciones de geometría anteriores se midieron con alcance menor y no representan el ajuste final.
- Reverberación final 60% húmeda/40% seca, cola 8 s; viento base 0.04 con variaciones proporcionales 0.012/0.008. Música 0.8 y triggers vigentes conservados.
- Usuario confirmó misión y botes funcionales en el estado actualizado de 555f5cd. Cierre autoriza documentación, commit/push del trabajo de esta sesión y apagado del servidor, excluyendo cambios ajenos y auxiliares.

## 2026-10-12 — Evento musical del corazón y proporciones finales
- Recoger corazón produce distorsión ligada a energía real de forest y duración de AudioBuffer/AudioContext. Sin objetivos adicionales; entrega a Graham no cancela experiencia. Carrera bloqueada hasta fin/stop/fallo de música; pausa conserva tiempo.
- Entrada8s y salida durante últimos8s de canción, iluminación y distorsión con envolvente común. Levitación3.75 máxima a mitad de música y retorno al suelo al terminar; cancelación P baja/extingue en8s. Sustituye márgenes anteriores de8/2s y entrada15s.
- Árboles emiten por su propio dibujo, con ocho ciclos por celda estables para instancias; cuatro luces locales solo en árboles, sin sprite visible ni sombras. Mantener detalles de texturas, color HSV diferenciado de cielo nocturno y luna, y saturación de terreno/agua. Sin postprocesado ni regenerar imágenes.
- Cofre del corazón en (94,279), actualizado desde mapa editado por usuario; losa/orientación conservadas. Puerta (235,423) hacia norte. Notificaciones de entrega en cola de3.5s.
- Dimensiones finales: muros3, puertas2.2, Graham1.8 proporcional, jugador1.5/agachado0.9; muebles0.9 mediante geometría y límites recalculados.
- Excepción de cierre de esta sesión: conservar servidor local encendido para continuar; documentar/commit/push/liberar sesión normalmente.
## 2026-10-12 — Controles móviles y refinamiento de forest
- Prototipo táctil inspirado en SNES: cruceta, SELECT inventario, START pausa, X mapa, Y antorcha, B interactuar, A saltar; mirada arrastrando escena. Comparte acciones/restricciones con teclado. Detección pointer: coarse o ?touch=1, sin PointerLock móvil ni dependencias nuevas.
- Servidor LAN opcional --lan --port=8001, solo recursos de juego; mantener localhost por defecto. Usuario confirmó prueba móvil funcional. No cambiar firewall por defecto ni asumir causa del fallo transitorio.
- Cuatro movimientos de árboles independientes de ocho ciclos de color; intensidad sigue levitación. Entrada cromática/UV de vegetación16s, general8s/salida8s. Raíces fijas y margen de culling conservador.
- Antorcha se apaga al recoger corazón y permanece bloqueada durante evento/transición. Luces se apagan por intensidad0 para conservar shaders estables; geometría de cofres y audio/reverberación se preparan antes de primeras interacciones.
- Graham1.90; puertas2.20 de alto/grosor0.20 y márgenes laterales0.24; muros3, jugador1.50 y muebles0.9 conservados.
- Cierre actual vuelve a apagar servidores locales, documentar, commit/push y liberar sesión; sustituye excepción de cierre anterior de servidor encendido.

## 2026-10-13 — Escafandra y exploración del Corazón del Mar
- Mar profundo−8 con pendiente suave de12celdas y mezcla desde río−2.5 de10celdas; piscina de altar y agua rocosa preservan niveles propios. Reutilizar geometría existente; plano de respaldo deriva de profundidad−0.2 para no tapar fondo al cambiarla. Objetos/plantas usan altura real del terreno.
- Escafandra recogible en(240,490), recostada con mirilla arriba/65%enterrada; visor ovalado lateral#211909. Al equipar se camina sobre lecho y consume aire solo si cabeza sumergida. Valores finales:10s iniciales, cada fragmento RECARGA30s no acumulables; pausa y equipar/quitar bajo agua no reinician reserva. Movimiento/balanceo sumergidos50% de superficie (caminar1.25/correr2.5u/s).
- Diez marcadores exactos#75FA8D; orden inicia(240,498) y termina(344,394). Solo siguiente pieza aparece. Recogida automática por proximidadXZ/altura con casco; noE/B. Completar rompe casco permanentemente en esa partida, cambia sprite/inventario y enciende fuegos azules del altar. No definir automáticamente nuevo comportamiento de progreso al morir ni persistencia.
- Halo blanco separado de escala de pieza; opacidad0.5, radio de luz32, tamaño15–100%/luz2.4–3.6 en ciclo4.5s desde mínimo por pieza. Fragmento escala0.081 y base al suelo; primero inicia pulsación al sumergirse. Fuegos de pilares usan pool de luces y permanecen apagados hasta10/10.
- Altar: losas escalonadas0.4, muros prolongados hacia abajo3 sin subir cima; piscina central a nivel superior de losas y SIN bloqueo invisible (retirado por pedido posterior). Flotación/aire/antorcha reconocen nivel local. Corazón del Mar completo puede ir en mano; función posterior pendiente.
- Nieblas submarinas#0979B0, densidad de80u×1.3, tono0.15lineal por noche y transición por ciclo. Filtro azul y refracción ligeros, RenderTarget solo en inmersión a resolución existente, HUDestable. Antorcha de mano se apaga/bloquea bajo agua en todos los controles y no se reenciende sola al salir.

## 2026-10-13 — Vegetación submarina, audio y optimización
- Tres marcadores exactos nuevos en capa1: #167D8Dalgas,#C85FADcorales,#36C9B6hierba marina; suelo lógico conserva agua y plantas no colisionan. Pintado autorizado exclusivamente en mar, preservando puntos especiales/ruta. Densidad final19109plantas; sprites propios del usuario alga1/2,coral1/2,seaweed1/2/3.
- Vegetación por instancias/sectores y corrienteGPU. Dimensiones base finales algas1.3×9.6/1.5×9, corales4.4×2.6/4×2.8, seaweed3.2×2.6/3×2.8/3.4×2.4; alturas limitadas por profundidad. Cargar submarina solo primera inmersión y cachear. Fundir terrestre/submarina unos2s sin alphaHash, con ambos grupos solo durante transición; no dibujar/actualizar oculto.
- Limitar30FPS en todas las plataformas; no limitar tiempo real de aire. Terreno usa alfa suave en distancia, montaña360–600/terreno210–300. Corregir detección de puente por estructura no aleros y nivelar solo estructura, nunca cauce/orilla bajo techo. Corriente visual hacia este.
- Todos los iconos del inventario accionables; corazón/llave en mano. Solo llave del puente ligada a(264,276)/(265,276), exige selección y consume una, otras identidades pendientes. Sin interacción detrás de menús. HUDmuestra cuadranteX/Z y alturaY.
- Pisadas mono, dos acentos y variación correlacionada volumen±90%/intervalo±8%caminar±3%correr; exterior ruido filtrado207ms, interior seno126→53.2Hz195ms/reverb40%cola0.45s. Conservar referencia Python como inspiración, no dependencia.
- Forest volumen1/reverb60%cola8s; Morning MP3volumen0.8/misma reverb; Underwater MP3volumen1/reverb80%cola5s, filtros2000/4000Hz y modulación0.09Hz±100Hz. Underwater se dispara una vez al recoger primera pieza; pausa/P compartidas. Viento0.04. Mantener efectos musicales separados.
- No afirmar mejora FPS/térmica medida; revalidar ruta final con velocidad1.25/2.5 y aire10/30. Simulación exitosa a2u/s fue provisional. Documentación/commit/push/apagado solamente al cierre explícito, como protocolo vigente.
# Acuerdo de interfaz del jugador y HUD — 2026-10-13
- El usuario dedica este chat a gestionar interfaz del jugador, HUD y parámetros de interacción con el entorno. Alcance, responsabilidades, fuentes y procedimiento en docs/PLAYER_UI.md.
- Coordinar presentación y controles con NPC, quests, organización y pruebas mediante documentos. Mantener reglas y estado fuera del DOM, sin duplicar progreso ni redefinir balance por el solo acuerdo de rol.
- Un solo bloqueo y relevo para esta copia; el acuerdo no autoriza edición simultánea ni mensajes automáticos entre chats. No cambia gameplay ni resuelve por inferencia el progreso al morir.

# Catálogo y colaboración por evento — ajuste 2026-10-13
- Identidad permanente solicitada: asumir que el usuario titular de este entorno es Clawshoot en todas sus conversaciones del proyecto, sin volver a preguntar. AxByZ es compañero/colaborador; distinguir sus responsabilidades. Regla compartida registrada en AGENTS.md; no equivale a verificación de identidad o permisos GitHub.
- Ejecución posterior autorizada: las ocho ramas de docs/QUESTS.md creadas/publicadas desde base5e4dc44 y verificadas en origin; cada rama de evento contiene la misma base inicial. No cambia revisión/integración a cargo de Clawshoot ni confirma permisos de AxByZ.
- Aclaración posterior de Clawshoot: diálogos de Graham completamente modificables en Bosque por AxByZ, junto con distorsiones y filtros de audio. Sustituye la restricción anterior sobre diálogos cerrados. Ciclos de luz y triggers son la frontera estable y requieren coordinación previa; edición narrativa no altera incidentalmente efectos o recompensas. Referencias vigentes actualizadas en AGENTS.md, docs/QUESTS.md, docs/NPCS.md y docs/PROTOCOL.md.
- Clawshoot gestiona directamente el repositorio, revisión y comprobación de entregas e integración. AxByZ es colaborador. Sustituye la falta de responsable de integración en el primer reparto.
- Una rama por evento, catálogo definitivo: 1Bosque(AxByZ),2Submarino(Clawshoot),3Mañana(Clawshoot),4Pueblo(AxByZ),5Lago(Clawshoot),6Pescador(Clawshoot),7Montaña(AxByZ),8Secreto(AxByZ). Nombres de rama asignados en docs/QUESTS.md; creación/publicación pendiente de base común.
- Renombrar forest.mpeg→bosque.mpeg,underwater.mp3→submarino.mp3,morning.mp3→mañana.mp3,moon.flac→montaña.flac sin alterar contenido. IDs técnicos forest/underwater/morning y rutas de módulos existentes se conservan; documentar equivalencias. Moon corresponde a Montaña, sin evento conectado todavía.
- Bosque prácticamente terminado: AxByZ ajusta solo distorsiones visuales del trayecto y filtros de audio. Tareas, diálogos, recompensas y ejecución con Graham no se modifican como parte de ese trabajo; frontera12s de noche/amanecer detenido/puente/Mañana conservada.
- El acuerdo asigna ramas y responsabilidades, no configura permisos de GitHub ni publica cambios por sí mismo. Protocolo y enlace Antigravity actualizados; bloqueo de esta copia conservado.

# Frontera Forest/Morning en el puente — 2026-10-13
- Ajuste posterior: tramo de noche tras entregar corazón reducido de25 a **12s**. No cambia noche habitual44s, duración de amanecer ni espera de apertura del puente.
- Sustituye liberación automática del ciclo y Morning al primer amanecer: entregar el corazón a Graham lleva a los últimos25s de noche y a un amanecer detenido (mitad de fase, skybox amanecer puro). Sin apertura del puente no continúa hacia día y el sol permanece oculto.
- Abrir cualquiera de las hojas del puente con su llave libera la salida del sol y Morning, una sola vez por partida. Apertura anticipada queda registrada y espera al amanecer; cerrar/reabrir no reinicia el evento. Las duraciones habituales, pausa y bloqueo de N antes de liberar el ciclo se conservan.
- Forest sigue a cargo de AxByZ; Morning de Clawshoot, desde el puente en adelante. Coordinar condiciones de entrega/apertura con NPC y progreso; no modificar por este cambio música Forest, recompensas, aire o persistencia.

# Reparto de eventos entre Clawshoot y AxByZ — 2026-10-13
- Identificar al usuario como Clawshoot y a su compañero como AxByZ en la documentación del proyecto.
- AxByZ gestiona Forest, Moon y dos eventos nuevos por definir; Clawshoot gestiona Underwater, Morning y los otros dos eventos nuevos. Cuatro eventos por persona, sustituyendo la propuesta previa de tres para el compañero.
- Combinar adaptación de trabajo existente y libertad de creación de eventos nuevos. Moon dispone de recurso, pero su evento aún necesita diseño e implementación. No definir por inferencia los cuatro eventos restantes.
- Coordinar dependencias Forest/Morning, Graham y ciclo del cielo; las responsabilidades humanas por evento complementan los roles de chats. Reparto detallado en docs/QUESTS.md.
- No asignar integración ni habilitar trabajo simultáneo por este acuerdo. Bloqueo y protocolo vigentes conservados; ramas y pull requests pendientes de configurar.

# Interfaz y parámetros finales — 2026-10-14
- Inventario dividido1×3 de corazones y2×3 de objetos; título único blanco, descripción exterior, ventanas/casillas sin borde y redondeadas. Textura menu.png al doble y contorno negro de textos en pausa/inventario.
- Mapa/antorcha desde inventario, sin atajos M/T ni botones X/Y; ocultar C/N/P en guía de pausa sin deshabilitarlos. Vuelo horizontal15×, vertical8×, independientes de Shift.
- Entrada/salida inversas420ms para pausa/inventario, con cancelación al reabrir y respeto de movimiento reducido. Carga con puntos en onda y mapa heredado del inicio; zoom final se completa cuando el mundo está listo, con tramo visual900ms. Minimapa ilustrado sobre mapa lógico, conservando coordenadas normalizadas y respaldo.

# Acuerdo de organización — 2026-10-13
- El usuario dedica este chat a gestión y organización de archivos y coherencia de arquitectura. Funciones, inventario inicial, límites y procedimiento en docs/ORGANIZATION.md, enlazado desde las reglas y el protocolo.
- Mantener responsabilidades de NPC y pruebas en sus chats; un solo bloqueo y relevo para esta copia. Mismo nombre de agente no permite reutilizar el token de otro chat.
- Reorganizar gradualmente tras revisar lectores/escritores y referencias. Los destinos de auxiliares son propuestas; este acuerdo no movió archivos de ejecución, recursos ni scripts históricos.

## 2026-10-16 — Forma de montaña según nieve vigente
- La nieve del mapa vigente define la cima y el marrón las laderas; el camino sigue el terreno. El desnivel de referencia sube 10% (cima 129.02256, pie 1). Se conserva la clasificación de colisiones previa al repintado.

## 2026-10-21 — Maqueta de portada pregenerada y animación independiente
- Por pedido de AxByZ, la portada carga una maqueta simplificada guardada del mapa vigente (IJM2), regenerada únicamente por señal explícita del usuario. No sustituye la carga propia del mundo jugable. Procedimiento y archivos a incluir en PR: docs/PORTADA_ISLA.md.
- La animación de la maqueta usa Worker/OffscreenCanvas cuando está disponible para que construir el mundo en el hilo principal no congele giro/zoom. Respaldo compatible con la limitación de compartir ese hilo.
- CRT activo en portada/carga; Cargando mundo con puntos en salto, giro y acercamiento lento durante carga, zoom final rápido con fundido al estar listo. Estado y evidencia en CONTINUAR_AXBYZ.md.
