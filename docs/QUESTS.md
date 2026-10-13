# Gestión de quests y eventos musicales

## Alcance acordado — 2026-10-13
El usuario dedica este chat a crear y gestionar las quests de Isla Jaipó y sus eventos asociados a canciones. El desarrollo contempla ocho canciones; actualmente hay cuatro disponibles y tres eventos musicales conectados. Este acuerdo define responsabilidades y catálogo; las quests, canciones y condiciones restantes se diseñarán mediante pedidos posteriores del usuario.

Antes de trabajar leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md y este documento. Para conversaciones e interacciones de NPC consultar docs/NPCS.md; para traslados o extracciones consultar docs/ORGANIZATION.md. Todos los chats comparten un único bloqueo local mediante tools/session.ps1. La memoria se transmite por documentos, sin asumir historial compartido ni enviar mensajes automáticamente a otros chats.

## Responsables humanos de los ocho eventos — 2026-10-13

Identidades acordadas por el usuario: **Clawshoot** es el usuario de este chat y **AxByZ** es su compañero. Ambos tienen experiencia comparable y gestionan sus eventos con apoyo de los chats especializados. **Clawshoot administra directamente el repositorio, comprueba entregas y decide su integración; AxByZ es colaborador.** Permisos reales de GitHub pendientes de verificar.

| Responsable | Eventos asignados | Alcance inicial |
| --- | --- | --- |
| AxByZ | Bosque, Pueblo, Montaña y Secreto | Bosque: distorsiones visuales del trayecto, filtros de audio y diálogos de Graham; diseñar/conectar Montaña (antigua canción Moon), Pueblo y Secreto. |
| Clawshoot | Submarino, Mañana, Lago y Pescador | Continuar Submarino y Mañana; diseñar y crear Lago y Pescador. Revisión e integración del repositorio. |

La numeración siguiente identifica eventos y no fija por sí sola un orden obligatorio de juego. Hay tres eventos conectados, un recurso adicional para Montaña y cuatro eventos sin recursos/funcionamiento definidos. El reparto no implementa misiones pendientes ni autoriza inventar requisitos o recompensas.

Bosque y Mañana comparten el recorrido de introducción, con una frontera acordada: Bosque permite el oscurecimiento; entregar el corazón a Graham inicia los últimos 12 s de noche y la transición hasta un amanecer detenido. Solo abrir el puente permite continuar la salida del sol hacia el día y dispara Mañana. **Los diálogos de Graham siguen abiertos a modificación por AxByZ**, coordinando con el ámbito NPC. También puede ajustar distorsiones visuales del trayecto y filtros de audio. Los ciclos de luz y los triggers que los accionan son la frontera estable entre Bosque y Mañana; modificarlos requiere acuerdo previo con Clawshoot. Cambiar textos o secuencias no debe alterar incidentalmente condiciones de misión, entregas o disparadores. Modificaciones de game.js, quest-sky.js, music-events.js, inventario, mapas y otros archivos compartidos requieren coordinación previa y un relevo que identifique archivos, efectos y pruebas.

Los nombres humanos no sustituyen los roles de chats ni los agentes Codex/Antigravity del bloqueo. El reparto por evento no habilita edición simultánea de esta copia o de distintas copias bajo el protocolo actual; la adopción de ramas, pull requests y trabajo simultáneo queda pendiente de configurar y documentar. Cada ficha de evento debe identificar a su responsable humano.

## Catálogo y ramas por evento
Una rama por evento, según pedido del usuario. Nombres asignados en esta tabla; creación/publicación pendiente de preparar la base común. No se crearon ni se publicaron ramas en este pedido.

| Nº | Evento | Responsable | Rama asignada | Audio | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Bosque | AxByZ | codex/evento-01-bosque | sonidos/musica/bosque.mpeg | Conectado; ajustes visuales y filtros pendientes. |
| 2 | Submarino | Clawshoot | codex/evento-02-submarino | sonidos/musica/submarino.mp3 | Conectado; función posterior del corazón pendiente. |
| 3 | Mañana | Clawshoot | codex/evento-03-manana | sonidos/musica/mañana.mp3 | Conectado; empieza desde apertura del puente y salida del sol. |
| 4 | Pueblo | AxByZ | codex/evento-04-pueblo | Pendiente | Diseño e implementación pendientes. |
| 5 | Lago | Clawshoot | codex/evento-05-lago | Pendiente | Diseño e implementación pendientes. |
| 6 | Pescador | Clawshoot | codex/evento-06-pescador | Pendiente | Diseño e implementación pendientes. |
| 7 | Montaña | AxByZ | codex/evento-07-montana | sonidos/musica/montaña.flac | Recurso antes moon.flac; incorporado a la base compartida, sin trigger/quest conectados. |
| 8 | Secreto | AxByZ | codex/evento-08-secreto | Pendiente | Diseño e implementación pendientes. |

Nombres anteriores: Forest→Bosque, Underwater→Submarino, Morning→Mañana y Moon→Montaña. Se renombraron archivos sin convertir formato ni alterar audio. IDs técnicos del catálogo y llamadas existentes siguen forest/underwater/morning para conservar conexiones; los módulos forest-heart, heart-event-timing, underwater-view y similares no cambian de ruta por esta edición. Ramas usan manana/montana sin tilde/ñ; nombres de eventos y archivos de audio usan Mañana/Montaña.

Disparadores: Bosque espera4s desde recogida del corazón, con distorsión/luces/levitación y oscurecimiento; Submarino comienza una vez al primer fragmento; Mañana exige permiso de apertura del puente y amanecer. Abrir antes registra permiso, esperando amanecer. Reproducción única por partida. Estos tres eventos no equivalen necesariamente a tres misiones independientes.

## Reglas vigentes y límites
- Bosque: estado searching → carrying → delivered en forest-heart.js. Graham entrega bridge-key una sola vez después de la entrega; recibir esa recompensa habilita el cofre del mapa. Entregar el corazón lleva al amanecer, no directamente al día. Consumir la llave física en el puente no revoca la recompensa de misión. Ver docs/NPCS.md para prioridades de conversación.
- Frontera Bosque/Mañana: quest-sky conserva 12 s finales de noche y avanza hasta dawnStart+dawn/2, punto de skybox amanecer puro, sin continuar ni mostrar el sol hasta abrir el puente. La apertura válida de cualquiera de las hojas (264,276)/(265,276) queda registrada una sola vez; cerrar/reabrir no vuelve a bloquear el ciclo ni repite música. N no salta esa espera. Apertura temprana queda registrada y Mañana espera al amanecer; pausa congela tiempos. Tras liberación siguen las duraciones habituales.
- Bosque: el efecto sigue duración y energía reales del audio; entregar el corazón no cancela la experiencia. Pausa conserva tiempos y P detiene música con salida suave del efecto. Fallos de audio no deben bloquear el recorrido de misión; conservar las reglas existentes al ampliar eventos.
- Mar: recogida ordenada de diez fragmentos, solo el siguiente visible. Requiere casco equipado y proximidad; recogida automática. Cada pieza restablece 30 s de aire sin acumulación; al 10/10 se rompe el casco y encienden fuegos del altar. La función posterior del corazón completo sigue pendiente.
- No añadir persistencia por esta asignación. Nueva sesión comienza otra vez. El reinicio tras muerte conserva actualmente objetos, fragmentos y casco roto según HANDOFF.md; cualquier cambio requiere definirlo explícitamente.
- No asignar por inferencia recompensas, personajes, cerraduras, triggers de Montaña ni quests para las canciones restantes. Conservar recursos originales y arquitectura ligera.

## Responsabilidades de arquitectura
| Archivos | Responsabilidad |
| --- | --- |
| src/systems/forest-heart.js, sea-heart.js | Estado y transiciones del progreso del bosque y fragmentos del mar. |
| src/systems/quest-sky.js | Etapas del cielo ligadas a progreso y recompensa de llave. |
| src/systems/music-events.js | Catálogo reproducible, triggers únicos, espera, pausa, cancelación y audio. |
| src/systems/heart-event-timing.js; src/world/heart-vision.js, heart-halos.js, tree-color-cycle.js, tree-motion.js | Temporización y presentación del evento forest. |
| src/systems/diving-air.js, key-inventory.js | Aire y uso de llaves relacionados con las quests. |
| src/content/entities.js, dialogues.js | Posiciones, objetos y textos; coordinar diálogos con el ámbito NPC. |
| game.js | Conexión de recogidas, diálogos, recompensas, triggers, inventario y efectos. |
| src/ui/, src/input/ | Presentación y acciones compartidas de teclado/táctil. |

Mantener contenido, reglas y presentación en sus responsabilidades actuales. Este acuerdo no crea un motor genérico de quests ni reorganiza módulos.

## Ficha y procedimiento por quest
Para cada pedido registrar identidad/nombre, canción y recurso, estado (propuesta/implementada/verificada), objetivo, requisitos, disparador, etapas y condición de finalización. Describir recompensas y efectos únicos, relación con NPC/inventario/cielo, cancelación/fallo de audio, pausa, muerte/reinicio y dispositivos afectados. Si una condición no está decidida, marcarla pendiente.

1. Revisar versión, estado local y relevo; adquirir sesión propia antes de editar y comprobar su token antes de cada lote.
2. Delimitar el pedido y contrastar triggers y transiciones existentes. Coordinar las dependencias de NPC y organización mediante los documentos correspondientes.
3. Implementar cambios pequeños y verificar el comportamiento afectado: activación y repetición, orden/requisitos, recompensas únicas, pausa/P/fallo de audio y controles pertinentes.
4. Para cambios complejos preparar HANDOFF.md con versión, archivos y cambios locales, pasos de reproducción, resultados esperados, riesgos y pruebas ejecutadas/pendientes para el chat dedicado a pruebas. Registrar allí resultados, sin confundir lectura de código con validación en navegador.
5. Mantener la sesión entre pedidos; el cierre explícito sigue docs/PROTOCOL.md. Decisiones duraderas en DECISIONS.md; estado vigente en HANDOFF.md. Una petición documental permite actualizar estos archivos durante la sesión sin ejecutar cierre ni commit/push.

## Pendientes iniciales
- Definir quests de Montaña, Pueblo, Lago, Pescador y Secreto; recursos de los últimos cuatro pendientes.
- Preparar base compartida, crear/publicar las ocho ramas asignadas y verificar acceso colaborador de AxByZ. Revisión/integración a cargo de Clawshoot.
- Definir uso posterior del Corazón del Mar y comportamiento deseado al morir.
- Conservar el relevo de pruebas del mar: ruta integral con velocidad final 1.25/2.5 u/s y aire 10/30 s, salida tras rotura del casco, legibilidad nocturna y rendimiento en móvil real.
