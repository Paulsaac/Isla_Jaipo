# Instrucciones compartidas de Isla Jaipó

Estas reglas se aplican a Codex y Antigravity. Las instrucciones explícitas del usuario prevalecen. Leer este archivo, `docs/PROTOCOL.md`, `HANDOFF.md` y `DECISIONS.md` antes de editar, incluso si no se hizo pull.

## Identidad del usuario
- El usuario titular de este entorno es **Clawshoot**. Asumir esta identidad en todas sus conversaciones y chats de Isla Jaipó, sin volver a pedir identificación. **AxByZ** es su compañero y colaborador, no una identidad alternativa del usuario. Una indicación explícita de que habla otra persona prevalece. Los alias no acreditan por sí solos cuentas ni permisos de GitHub.

## Producto
- Juego web ligero en JavaScript, Three.js, HTML y CSS, ejecutado en el navegador del jugador. No migrar a otros motores ni añadir servicios o dependencias sin necesidad de la tarea.
- La demo permite explorar la zona inicial, encontrar el Corazón del Bosque y entregarlo a Graham. Graham entrega la llave del puente y habilita el cofre del mapa. Entregar el corazón activa el tramo final de noche y la transición hasta un amanecer detenido; abrir la puerta del puente libera la salida del sol, Mañana y el ciclo habitual hacia el día.
- El río de agua en movimiento limita la navegación de los botes. El desbloqueo de la llave depende de la misión, sin espera de meses ni desbloqueo por fecha.
- No implementar guardado persistente de progreso para la demo salvo petición del usuario. Una nueva sesión comienza otra vez; el comportamiento al morir debe definirse por separado.

## Trabajo
- El chat dedicado a servidores gestiona exclusivamente el servidor local del proyecto: iniciarlo en modo LAN para escritorio/móvil y mantenerlo activo hasta una orden explícita del usuario para apagarlo. Seguir `docs/PROTOCOL.md`; registrar el estado vigente en `HANDOFF.md`. Esta función no se asigna a todos los chats.
- El chat de diseño estético gestiona sprites, texturas, terreno y presentación visual según `docs/VISUAL_DESIGN.md`; efectos de sonido solo por pedido explícito. Conservar reglas de juego, originales y relevo único.
- El chat de interfaz del jugador y HUD (acuerdo 2026-10-13) gestiona presentación, controles y parámetros de interacción del jugador con el entorno según `docs/PLAYER_UI.md`. Leerlo para ese ámbito; coordinar NPC, quests, organización y pruebas mediante documentos y conservar el bloqueo y relevo únicos.
- El chat de quests (acuerdo 2026-10-13) crea y gestiona misiones y eventos asociados a canciones según `docs/QUESTS.md`, con catálogo numerado y ramas por evento. Clawshoot gestiona revisión e integración del repositorio; AxByZ es colaborador. Bosque permite ajustes de distorsión visual/filtros de audio y diálogos de Graham; conservar ciclos de luz y triggers acordados salvo cambio coordinado con Clawshoot. Coordinar NPC, organización y pruebas mediante documentos y conservar el bloqueo único. Ocho eventos previstos, cuatro recursos disponibles y tres eventos conectados no equivalen a ocho quests implementadas.
- El chat de organización de archivos (acuerdo 2026-10-13) mantiene clasificación, rutas y coherencia de arquitectura conforme a `docs/ORGANIZATION.md`. Leerlo antes de reorganizar; coordinar los ámbitos de NPC y pruebas y conservar el bloqueo y relevo únicos.
- El chat de gestión de NPC (acuerdo 2026-10-13) administra personajes, conversaciones e interacciones. Para tareas de este ámbito leer también `docs/NPCS.md` y seguir su procedimiento y responsabilidades de arquitectura; conservar el relevo y bloqueo únicos del proyecto.
- El chat de pruebas, rendimiento y optimización (acuerdo ampliado 2026-10-13) prueba actualizaciones complejas, mide cuellos de botella y puede modificar código para optimizar preservando comportamiento y presentación acordados. Leer docs/TESTING_PERFORMANCE.md; registrar comparación antes/después y regresiones en HANDOFF.md según docs/PROTOCOL.md. Esta función corresponde a ese chat, no a todos los chats del proyecto.
- Al recibir «retomemos la sesión» o petición equivalente, seguir el comando de inicio en docs/PROTOCOL.md: verificar remoto/pull seguro, servidor local y sugerencias según estado vigente. Es autorización explícita persistente para esa sincronización de inicio, no para commit/push.
- Una sola herramienta puede editar esta copia a la vez. Antes de editar ejecutar `tools/session.ps1 start -Agent Codex` o `-Agent Antigravity`; seguir el protocolo de relevo.
- Mantener la sesión entre pedidos sucesivos. Desde el acuerdo del 2026-10-14, «finalicemos/cerremos la sesión» indica cierre documental por rol y liberación del bloqueo según docs/PROTOCOL.md, sin staging, commit ni push automáticos. Cada chat actualiza solo documentos pertinentes a su rol y su entrada en el relevo común; Clawshoot publica en GitHub manualmente. El servidor LAN persistente solo se apaga por orden expresa.
- No revertir, borrar ni incluir en commits cambios ajenos. Los archivos sin seguimiento también pueden ser trabajo valioso.
- No ejecutar generadores, `patch*.py`, reparadores o scripts antiguos sin leerlos y comprobar que sus escrituras corresponden a la tarea.
- Preservar mapas y assets originales; no regenerarlos ni sobrescribirlos si la tarea no lo requiere.
- Hacer cambios pequeños y verificables. No reformatear o reorganizar todo el proyecto para resolver un problema puntual.
- Contrastar comentarios y documentación con el código. `ANTIGRAVITY_HANDOFF.md` conserva historia; `HANDOFF.md` describe el estado vigente.
- No añadir pruebas que solo repitan la implementación. Verificar los comportamientos afectados y registrar qué se ejecutó y qué no.
- No hacer operaciones Git por el simple hecho de terminar una respuesta. Seguir las autorizaciones de los comandos de inicio/cierre y el alcance indicado por el usuario; nunca usar `git add .` para incorporar indiscriminadamente archivos auxiliares. Publicación adicional o reescritura de historial no están autorizadas por esos comandos.

## Cierre
Actualizar la entrada propia en `HANDOFF.md` antes de liberar la sesión y solo las guías pertinentes al rol que hayan cambiado. Registrar decisiones duraderas del ámbito en `DECISIONS.md` cuando corresponda. Cambiar reglas compartidas solo por un acuerdo explícito; si cambió el protocolo, actualizar la sección de enlace de `ANTIGRAVITY_HANDOFF.md`, sin duplicar el estado actual allí. No rellenar documentación ni cerrar sesiones de otros roles. Cierre sin staging, commit ni push; publicación manual a cargo de Clawshoot.
Ejecutar `tools/session.ps1 finish -Agent <agente> -Token <token>` y comunicar pendientes, verificaciones y estado Git.
