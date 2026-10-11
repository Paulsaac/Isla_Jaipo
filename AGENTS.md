# Instrucciones compartidas de Isla Jaipó

Estas reglas se aplican a Codex y Antigravity. Las instrucciones explícitas del usuario prevalecen. Leer este archivo, `docs/PROTOCOL.md`, `HANDOFF.md` y `DECISIONS.md` antes de editar, incluso si no se hizo pull.

## Producto
- Juego web ligero en JavaScript, Three.js, HTML y CSS, ejecutado en el navegador del jugador. No migrar a otros motores ni añadir servicios o dependencias sin necesidad de la tarea.
- La demo permite explorar la zona inicial, encontrar el Corazón del Bosque y entregarlo a Graham. Por petición del usuario, Graham entrega la llave del puente y desbloquea el cofre del mapa. Recibir esa llave activa el tramo final de noche previo al amanecer; sin ella permanece de noche.
- El río de agua en movimiento limita la navegación de los botes. El desbloqueo de la llave depende de la misión, sin espera de meses ni desbloqueo por fecha.
- No implementar guardado persistente de progreso para la demo salvo petición del usuario. Una nueva sesión comienza otra vez; el comportamiento al morir debe definirse por separado.

## Trabajo
- Al recibir «retomemos la sesión» o petición equivalente, seguir el comando de inicio en docs/PROTOCOL.md: verificar remoto/pull seguro, servidor local y sugerencias según estado vigente. Es autorización explícita persistente para esa sincronización de inicio, no para commit/push.
- Una sola herramienta puede editar esta copia a la vez. Antes de editar ejecutar `tools/session.ps1 start -Agent Codex` o `-Agent Antigravity`; seguir el protocolo de relevo.
- Mantener la sesión entre pedidos sucesivos. Actualizar documentación y liberar la sesión cuando el usuario indique que finiquitemos, no al terminar cada ajuste. Desde el acuerdo del 2026-10-11, «finalicemos/cerremos la sesión» autoriza documentación, commit/push del trabajo realizado y apagado del servidor local según docs/PROTOCOL.md, salvo excepción explícita del usuario.
- No revertir, borrar ni incluir en commits cambios ajenos. Los archivos sin seguimiento también pueden ser trabajo valioso.
- No ejecutar generadores, `patch*.py`, reparadores o scripts antiguos sin leerlos y comprobar que sus escrituras corresponden a la tarea.
- Preservar mapas y assets originales; no regenerarlos ni sobrescribirlos si la tarea no lo requiere.
- Hacer cambios pequeños y verificables. No reformatear o reorganizar todo el proyecto para resolver un problema puntual.
- Contrastar comentarios y documentación con el código. `ANTIGRAVITY_HANDOFF.md` conserva historia; `HANDOFF.md` describe el estado vigente.
- No añadir pruebas que solo repitan la implementación. Verificar los comportamientos afectados y registrar qué se ejecutó y qué no.
- No hacer operaciones Git por el simple hecho de terminar una respuesta. Seguir las autorizaciones de los comandos de inicio/cierre y el alcance indicado por el usuario; nunca usar `git add .` para incorporar indiscriminadamente archivos auxiliares. Publicación adicional o reescritura de historial no están autorizadas por esos comandos.

## Cierre
Actualizar `HANDOFF.md` antes de liberar la sesión. Registrar decisiones duraderas en `DECISIONS.md`. Para mantener compatible el relevo antiguo, actualizar también la sección de enlace de `ANTIGRAVITY_HANDOFF.md` cuando cambie el protocolo; no duplicar el estado actual allí.
Ejecutar `tools/session.ps1 finish -Agent <agente> -Token <token>` y comunicar pendientes, verificaciones y estado Git.
