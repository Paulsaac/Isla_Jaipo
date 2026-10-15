# Protocolo de relevo entre Codex y Antigravity

## Alcance y límites
Los archivos del repositorio son la memoria compartida. Las conversaciones no se sincronizan. El bloqueo es cooperativo: evita que dos agentes que siguen estas reglas editen la misma copia, pero no bloquea al editor ni coordina otras copias del repositorio. Nunca dar por hecho que Antigravity carga automáticamente `AGENTS.md`.

## Preparación de Antigravity
Al retomar, proporcionar este mensaje o incorporarlo a sus reglas de proyecto mediante el mecanismo que tenga disponible:

> Antes de trabajar en Isla Jaipó, lee AGENTS.md, docs/PROTOCOL.md, HANDOFF.md y DECISIONS.md. Sigue el protocolo compartido y adquiere la sesión con tools/session.ps1 antes de editar. No ejecutes scripts de parche o generación sin revisarlos. Al terminar actualiza HANDOFF.md y libera la sesión. ANTIGRAVITY_HANDOFF.md es un registro histórico.

## Inicio de sesión
1. Leer los cuatro documentos y ejecutar `powershell -NoProfile -File tools/session.ps1 status`.
2. Revisar `git status --short`, `git diff` y rama. Comparar con el último relevo; no asumir que un árbol sucio es un error.
3. Si otra herramienta posee la sesión, limitarse a leer. Pedir al usuario que detenga esa herramienta y que su sesión se libere antes de editar. No sustituir automáticamente bloqueos antiguos.
4. Adquirir mediante `powershell -NoProfile -File tools/session.ps1 start -Agent Codex` (o Antigravity). Conservar el token devuelto. El archivo se crea de forma exclusiva para evitar una adquisición simultánea.
5. Revisar los archivos involucrados antes de proponer cambios. Conservar el bloqueo y las notas del chat entre ajustes; actualizar los documentos únicamente cuando el usuario indique el cierre de la sesión.

## Durante la sesión
### Chat dedicado a diseño estético (2026-10-14)
Gestiona sprites, texturas, materiales, apariencia del terreno, iluminación y efectos visuales según docs/VISUAL_DESIGN.md. Los cambios de sonido de esta sesión fueron pedidos explícitos del usuario. Coordinar cualquier impacto sobre colisiones, navegación, eventos o rendimiento con el ámbito responsable; no modificar esas reglas por un ajuste estético. Compartir el bloqueo y registrar el relevo en documentos.

### Responsables humanos y ramas por evento (2026-10-13)
Clawshoot gestiona directamente el repositorio, revisa entregas y decide su integración en main. AxByZ participa como colaborador y desarrolla los eventos asignados. Mantener una rama por evento, con nombres y responsables en docs/QUESTS.md. La asignación de rama no sustituye la verificación de dependencias. En Bosque los diálogos de Graham son modificables; ciclos de luz y triggers acordados requieren coordinación previa con Clawshoot.

Flujo acordado para preparar: partir de una base main compartida, desarrollar en rama de evento, entregar diff y verificaciones mediante pull request, y esperar revisión/integración de Clawshoot. Cada cierre debe identificar persona, evento y rama; no incorporar trabajo ajeno ni interpretar el cierre de una rama como autorización automática de merge en main. No hacer force push. Las ramas todavía deben crearse/publicarse desde la base preparada; esta documentación no confirma permisos de colaborador ni configuración remota.

Conservar bloqueo único en esta copia. El uso simultáneo de copias distintas requiere completar y documentar la configuración de colaboración; los límites actuales siguen vigentes hasta entonces. Acuerdos y estado en HANDOFF.md y DECISIONS.md.

### Chat dedicado a servidores del proyecto (2026-10-13)
Este chat administra exclusivamente el servidor de desarrollo de esta copia. Iniciarlo en LAN con `node tools/serve.cjs --lan --port=8001`, comprobar `http://127.0.0.1:8001/` y la URL con la IP local del PC, y compartir la URL con `?touch=1` para activar los controles móviles durante las pruebas. El puerto 8001 escucha en todas las interfaces; usar solo en una red local de confianza. El servidor ofrece HTTP y limita las rutas expuestas al contenido de la demo.

Mantener el proceso activo entre pedidos y sesiones hasta que el usuario ordene apagarlo expresamente. No detenerlo por cierre de chat, liberación del bloqueo ni cierre normal descrito abajo; esa orden explícita prevalece sobre el apagado genérico del paso 6. Al apagar, identificar únicamente el proceso de `tools/serve.cjs` de esta copia y verificar que deje de responder. No tocar reglas de firewall sin petición. Anotar IP, puerto, PID, URL y resultado en HANDOFF.md; la IP puede cambiar entre redes.

### Chat dedicado a interfaz del jugador y HUD (2026-10-13)
El chat de este acuerdo gestiona interfaz, HUD, controles y parámetros de interacción del jugador con el entorno según docs/PLAYER_UI.md. Mantener presentación separada de reglas y estado; coordinar diálogos con NPC, progreso/eventos con quests y arquitectura con organización. Entregar cambios complejos al chat de pruebas mediante HANDOFF.md con versión, parámetros/unidades, dispositivo, reproducción y verificaciones. Este rol comparte el bloqueo único y no autoriza edición simultánea ni mensajes automáticos entre chats.

### Chat dedicado a quests y eventos musicales (2026-10-13)
El chat de este acuerdo crea y gestiona quests y eventos ligados a canciones según docs/QUESTS.md. Consultar su catálogo para distinguir recursos disponibles, eventos conectados y diseño pendiente. Coordinar conversaciones con docs/NPCS.md y cambios de arquitectura con docs/ORGANIZATION.md. Entregar cambios complejos al chat de pruebas mediante HANDOFF.md con versión, disparadores, etapas, efectos únicos, reproducción y verificaciones. El bloqueo y el relevo siguen siendo únicos para toda la copia, también entre chats Codex; este rol no autoriza edición simultánea ni mensajes automáticos entre chats.

### Chat dedicado a organización de archivos (2026-10-13)
El chat de este acuerdo mantiene estructura, clasificación de archivos, rutas y límites de arquitectura según docs/ORGANIZATION.md. Leer ese documento antes de reorganizar. Coordinar módulos de NPC con su ámbito y entregar cambios complejos al chat de pruebas mediante HANDOFF.md. Registrar rutas anteriores/nuevas, referencias actualizadas, verificaciones y pendientes; preservar cambios ajenos y originales. El bloqueo local es único: otro chat Codex también es otro propietario, y solo puede recuperarse su sesión tras confirmación del usuario conforme al procedimiento de recuperación.

### Chat dedicado a NPC (2026-10-13)
El chat donde se acordó esta función gestiona NPC, conversaciones e interacciones según docs/NPCS.md. Leer ese documento para tareas de NPC, además de los cuatro documentos compartidos. Mantener contenido, reglas de misión y presentación en sus módulos responsables; registrar condiciones, prioridades y efectos únicos de cada conversación. Para cambios complejos entregar versión, comportamiento esperado y reproducción al chat de pruebas mediante HANDOFF.md. Los chats especializados comparten el mismo bloqueo local y no editan simultáneamente ni dependen de la memoria de otros chats.

Una petición explícita de crear o actualizar documentación autoriza esa escritura durante la sesión; no ejecuta por sí misma el cierre, commit/push o liberación. Los reportes de cierre siguen el procedimiento habitual.

### Comando «retomemos la sesión» (acordado 2026-10-11)
La petición de retomar, o su equivalente, autoriza estos pasos sin pedir confirmación de nuevo:
1. Completar el inicio anterior: leer los documentos, revisar rama/diff/archivos sin seguimiento y adquirir la sesión, o reutilizar la propia si sigue activa. Otra herramienta con bloqueo impide escrituras y sincronización.
2. Consultar el repositorio remoto mediante fetch y comparar HEAD con su rama de seguimiento; no basta la referencia origin local potencialmente antigua. Si ya coincide, informar que está actualizado. Si está detrás y la actualización no interfiere con trabajo local, ejecutar pull con --ff-only, sin autostash. No usar reset, force ni stash automático. Ante divergencia, cambios incompatibles o fallo de red, conservar todo y explicar el impedimento; nunca afirmar que está actualizado sin comprobarlo. Releer el relevo y reglas si la actualización los cambió.
3. Encender el servidor local con node tools/serve.cjs (proceso oculto en Windows), o reutilizarlo si ya responde y sirve esta copia. En el chat dedicado de servidores, aplicar el modo LAN persistente de la sección anterior en el puerto 8001 y comprobar localhost e IP Wi-Fi; en otros casos verificar http://127.0.0.1:8000/. Un proceso lanzado no confirma disponibilidad. Si el puerto lo ocupa otro servicio, no detenerlo a ciegas.
4. Revisar el estado actual del código y pendientes del handoff; dar sugerencias concretas y priorizadas para continuar, distinguiendo comprobaciones pendientes de errores confirmados. Este comando no autoriza implementar automáticamente todas las sugerencias.
Esta autorización es para sincronizar al retomar; commit/push siguen requiriendo indicación explícita. Continuar los pasos independientes si uno queda bloqueado y comunicar la limitación.

- No ejecutar herramientas que escriban mientras otra sesión posee esta copia.
- Antes de cada grupo de ediciones, comprobar que `status` sigue mostrando el propio token. Si cambia, detener las escrituras.
- No iniciar otra herramienta para editar en paralelo. El usuario puede cambiar de agente después del cierre.
- Anotar hallazgos sin confundir intención de diseño, lectura de código y comportamiento comprobado en el navegador.
- Si se necesita sincronizar Git, revisar primero cambios y archivos sin seguimiento. Hacer pull solo dentro del alcance autorizado, sin sobrescribir trabajo pendiente. No resolver divergencias mediante reset o force push por defecto.
- En otra computadora o checkout, el bloqueo local no protege esta copia: coordinar el relevo con el usuario y sincronizar los commits autorizados antes de trabajar. No trabajar simultáneamente en ambas copias bajo este protocolo inicial.

## Cierre y relevo
El usuario marca el cierre: terminar una respuesta no termina la sesión de trabajo. Acuerdo vigente 2026-10-14 para todos los chats y agentes: «finalicemos la sesión», «cerremos la sesión» o equivalente activa únicamente el cierre documental del rol y la liberación del bloqueo. Cada chat completa solo los documentos pertinentes a su ámbito; Clawshoot realiza manualmente la publicación en GitHub. No ejecutar staging, commit, push, PR, merge ni despliegue como consecuencia del cierre. Sustituye la autorización automática de commit/push del 2026-10-11; los registros anteriores conservan valor histórico. Pedidos de Git independientes deben tener su propio alcance explícito. El servidor LAN persistente permanece activo hasta orden expresa de apagado.

1. Revisar el diff del trabajo propio y sus verificaciones disponibles; distinguir pendientes de fallos. El cierre no encarga nuevas funciones ni pruebas de otros roles.
2. Actualizar la entrada propia de HANDOFF.md con rol, persona, evento si corresponde, rama/base, archivos, valores finales, resultados, comandos/evidencias, pendientes y recursos locales sin seguimiento. Preservar entradas de otros chats, sin atribuirse sus cambios ni cerrar sus sesiones.
3. Actualizar solo las guías del rol afectadas por cambios reales. Registrar decisiones duraderas del ámbito en DECISIONS.md cuando existan; no rellenar todos los documentos por rutina.
4. AGENTS.md y docs/PROTOCOL.md solo cambian por acuerdos compartidos explícitos. Si cambió el protocolo, actualizar el enlace de ANTIGRAVITY_HANDOFF.md, sin duplicar allí el estado del proyecto.
5. Dejar identificados código y assets propios para la integración manual de Clawshoot, especialmente archivos compartidos con ediciones ajenas. No ejecutar staging, commit ni push; conservar todos los cambios locales.
6. Conservar el servidor LAN persistente. El chat responsable registra su estado si la tarea lo afecta; apagar únicamente por orden expresa e identificar el proceso de esta copia, sin detener servicios ajenos. Otros roles no gestionan el servidor por cerrar su sesión.
7. Registrar impedimentos pertinentes al relevo y liberar únicamente la sesión propia con `powershell -NoProfile -File tools/session.ps1 finish -Agent <agente> -Token <token>`. Recuperar bloqueos ajenos solo según el procedimiento y tras confirmación del usuario.
8. Entregar resumen del ámbito, verificaciones/pendientes y estado local de Git, indicando ausencia de commit/push automático. El siguiente agente lee los documentos; no enviar mensajes a otros chats automáticamente.

## Interrupción o bloqueo abandonado
No caducan automáticamente. Si la herramienta se cierra inesperadamente, conservar los archivos y el bloqueo. Después de que el usuario confirme que el anterior agente dejó de trabajar, revisar el estado y usar `finish` con el agente y token registrados para liberar el bloqueo. Registrar en HANDOFF.md que fue una recuperación. Adquirir una nueva sesión antes de editar. No borrar el bloqueo a ciegas.

## Verificaciones de la demo
### Chat dedicado a pruebas de actualizaciones complejas (2026-10-13)
Por instrucción del usuario, el chat donde se acordó esta función está dedicado a testear el proyecto cuando sus actualizaciones sean muy complejas. Los documentos son el medio de relevo entre el chat de implementación y este chat de pruebas; no asumir que comparten historial ni enviar mensajes entre chats automáticamente.

Ampliación 2026-10-13: también cubre pruebas de rendimiento, diagnóstico e implementación de optimizaciones según docs/TESTING_PERFORMANCE.md. Puede modificar código para resolver cuellos de botella identificados, con comparación antes/después y verificación de regresiones; conservar reglas y presentación acordadas. El relevo incluye escenario/dispositivo, métricas, método, cambios y limitaciones. Coordinar los ámbitos afectados y conservar el bloqueo único.

- Al entregar una actualización compleja, dejar en HANDOFF.md la versión o commit y cambios locales relevantes, comportamiento esperado, sistemas afectados, instrucciones para reproducir y pruebas realizadas o pendientes. Identificar riesgos de regresión y prioridades.
- Al recibirla en el chat de pruebas, leer el relevo y comprobar la versión realmente disponible. Preparar y ejecutar las verificaciones pertinentes del comportamiento nuevo y de los sistemas relacionados, siguiendo las reglas de sesión y sincronización vigentes. Coordinar el uso de esta copia: ningún chat puede escribir mientras otro tenga el bloqueo.
- Registrar resultados reproducibles: versión probada, navegador/dispositivo y condiciones relevantes, pasos, resultado esperado y observado, errores de consola y evidencias cuando ayuden. Distinguir aprobado, fallo confirmado y pendiente/no ejecutado; una inspección de código o prueba aislada no acredita un recorrido integral ni rendimiento en otro dispositivo.
- Al cerrar la sesión de pruebas, actualizar HANDOFF.md con resultados, fallos y pendientes para que el chat de implementación pueda continuar desde los archivos. Esta función no autoriza por sí sola cambios de diseño ni implementación de nuevas funciones; las correcciones se realizan dentro del alcance pedido por el usuario.

### Cobertura según cambios
Según el cambio, comprobar carga y consola, spawn, movimiento/costas/interiores, techos, puertas/cofres/llaves, pausa/inventario/diálogo, agua/muerte/reinicio y el recorrido del corazón. Confirmar que los botes no navegan por el río de corriente, Graham entrega la llave tras el corazón, el cofre del mapa requiere esa llave y el amanecer no se activa antes de recibirla.
Estas son verificaciones manuales pendientes hasta ejecutarlas; el arnés de sesiones no valida el gameplay. Los test*.js existentes son herramientas históricas y deben revisarse antes de usarse.
