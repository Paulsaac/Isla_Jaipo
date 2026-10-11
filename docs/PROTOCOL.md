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
### Comando «retomemos la sesión» (acordado 2026-10-11)
La petición de retomar, o su equivalente, autoriza estos pasos sin pedir confirmación de nuevo:
1. Completar el inicio anterior: leer los documentos, revisar rama/diff/archivos sin seguimiento y adquirir la sesión, o reutilizar la propia si sigue activa. Otra herramienta con bloqueo impide escrituras y sincronización.
2. Consultar el repositorio remoto mediante fetch y comparar HEAD con su rama de seguimiento; no basta la referencia origin local potencialmente antigua. Si ya coincide, informar que está actualizado. Si está detrás y la actualización no interfiere con trabajo local, ejecutar pull con --ff-only, sin autostash. No usar reset, force ni stash automático. Ante divergencia, cambios incompatibles o fallo de red, conservar todo y explicar el impedimento; nunca afirmar que está actualizado sin comprobarlo. Releer el relevo y reglas si la actualización los cambió.
3. Encender el servidor local con node tools/serve.cjs (proceso oculto en Windows), o reutilizarlo si ya responde y sirve esta copia. Verificar http://127.0.0.1:8000/; un proceso lanzado no confirma disponibilidad. Si el puerto lo ocupa otro servicio, no detenerlo a ciegas.
4. Revisar el estado actual del código y pendientes del handoff; dar sugerencias concretas y priorizadas para continuar, distinguiendo comprobaciones pendientes de errores confirmados. Este comando no autoriza implementar automáticamente todas las sugerencias.
Esta autorización es para sincronizar al retomar; commit/push siguen requiriendo indicación explícita. Continuar los pasos independientes si uno queda bloqueado y comunicar la limitación.

- No ejecutar herramientas que escriban mientras otra sesión posee esta copia.
- Antes de cada grupo de ediciones, comprobar que `status` sigue mostrando el propio token. Si cambia, detener las escrituras.
- No iniciar otra herramienta para editar en paralelo. El usuario puede cambiar de agente después del cierre.
- Anotar hallazgos sin confundir intención de diseño, lectura de código y comportamiento comprobado en el navegador.
- Si se necesita sincronizar Git, revisar primero cambios y archivos sin seguimiento. Hacer pull solo dentro del alcance autorizado, sin sobrescribir trabajo pendiente. No resolver divergencias mediante reset o force push por defecto.
- En otra computadora o checkout, el bloqueo local no protege esta copia: coordinar el relevo con el usuario y sincronizar los commits autorizados antes de trabajar. No trabajar simultáneamente en ambas copias bajo este protocolo inicial.

## Cierre y relevo
El usuario marca el cierre: terminar una respuesta no termina la sesión de trabajo. No repetir reportes Git en cada entrega. Desde el acuerdo del 2026-10-11, «finalicemos la sesión», «cerremos la sesión» o una petición equivalente autorizan el cierre completo siguiente, incluido commit/push y apagado del servidor, sin pedir confirmación de nuevo. Si el usuario limita expresamente el alcance (por ejemplo, «sin push»), respetar esa excepción. Esta autorización sustituye la regla anterior de que el cierre no autorizaba Git.

1. Revisar el diff y ejecutar las verificaciones pertinentes.
2. Actualizar HANDOFF.md con resultados, archivos, pendientes, comandos, limitaciones, rama, commit base y si hubo commit/push. Registrar también trabajo local que no esté en Git.
3. Registrar decisiones duraderas en DECISIONS.md sin borrar las anteriores.
4. Si cambió el protocolo, actualizar también el enlace vigente en ANTIGRAVITY_HANDOFF.md, sin duplicar allí el estado del proyecto.
5. Seleccionar explícitamente los archivos del trabajo realizado y recursos necesarios, incluida documentación; preservar y excluir cambios ajenos y auxiliares no encargados. Crear commit y hacer push a la rama de trabajo correspondiente. Nunca git add indiscriminado, force push ni reescritura de historial. Comprobar que el remoto recibió el commit; no afirmar publicación de Pages solo por haber hecho push.
6. Detener únicamente el servidor local identificado de esta copia (tools/serve.cjs), sin cerrar otros procesos Node o servicios ajenos. Comprobar que dejó de servir el proyecto. Si ya estaba apagado, indicarlo.
7. Registrar en HANDOFF.md cualquier fallo o pendiente de cierre que cambie el relevo. Si el push falla, conservar commit y cambios y comunicar el impedimento; completar los demás pasos posibles. Liberar con `powershell -NoProfile -File tools/session.ps1 finish -Agent <agente> -Token <token>`.
8. Entregar un resumen con cambios, verificaciones y limitaciones, estado de push y servidor. El próximo agente debe leer el relevo en los archivos, no depender del chat anterior.

## Interrupción o bloqueo abandonado
No caducan automáticamente. Si la herramienta se cierra inesperadamente, conservar los archivos y el bloqueo. Después de que el usuario confirme que el anterior agente dejó de trabajar, revisar el estado y usar `finish` con el agente y token registrados para liberar el bloqueo. Registrar en HANDOFF.md que fue una recuperación. Adquirir una nueva sesión antes de editar. No borrar el bloqueo a ciegas.

## Verificaciones de la demo
Según el cambio, comprobar carga y consola, spawn, movimiento/costas/interiores, techos, puertas/cofres/llaves, pausa/inventario/diálogo, agua/muerte/reinicio y el recorrido del corazón. Confirmar que los botes no navegan por el río de corriente, Graham entrega la llave tras el corazón, el cofre del mapa requiere esa llave y el amanecer no se activa antes de recibirla.
Estas son verificaciones manuales pendientes hasta ejecutarlas; el arnés de sesiones no valida el gameplay. Los test*.js existentes son herramientas históricas y deben revisarse antes de usarse.
