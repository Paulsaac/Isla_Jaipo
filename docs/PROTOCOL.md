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
- No ejecutar herramientas que escriban mientras otra sesión posee esta copia.
- Antes de cada grupo de ediciones, comprobar que `status` sigue mostrando el propio token. Si cambia, detener las escrituras.
- No iniciar otra herramienta para editar en paralelo. El usuario puede cambiar de agente después del cierre.
- Anotar hallazgos sin confundir intención de diseño, lectura de código y comportamiento comprobado en el navegador.
- Si se necesita sincronizar Git, revisar primero cambios y archivos sin seguimiento. Hacer pull solo dentro del alcance autorizado, sin sobrescribir trabajo pendiente. No resolver divergencias mediante reset o force push por defecto.
- En otra computadora o checkout, el bloqueo local no protege esta copia: coordinar el relevo con el usuario y sincronizar los commits autorizados antes de trabajar. No trabajar simultáneamente en ambas copias bajo este protocolo inicial.

## Cierre y relevo
El usuario marca el cierre: terminar una respuesta no termina la sesión de trabajo. No repetir reportes Git en cada entrega. Commit, pull y push requieren instrucciones explícitas; el pedido de cierre por sí solo no los autoriza.

1. Revisar el diff y ejecutar las verificaciones pertinentes.
2. Actualizar HANDOFF.md con resultados, archivos, pendientes, comandos, limitaciones, rama, commit base y si hubo commit/push. Registrar también trabajo local que no esté en Git.
3. Registrar decisiones duraderas en DECISIONS.md sin borrar las anteriores.
4. Liberar con `powershell -NoProfile -File tools/session.ps1 finish -Agent Codex -Token <token>`.
5. Entregar un resumen al usuario. El próximo agente debe leerlo en los archivos, no depender del chat anterior.

## Interrupción o bloqueo abandonado
No caducan automáticamente. Si la herramienta se cierra inesperadamente, conservar los archivos y el bloqueo. Después de que el usuario confirme que el anterior agente dejó de trabajar, revisar el estado y usar `finish` con el agente y token registrados para liberar el bloqueo. Registrar en HANDOFF.md que fue una recuperación. Adquirir una nueva sesión antes de editar. No borrar el bloqueo a ciegas.

## Verificaciones de la demo
Según el cambio, comprobar carga y consola, spawn, movimiento/costas/interiores, techos, puertas/cofres/llaves, pausa/inventario/diálogo, agua/muerte/reinicio y el recorrido del corazón. Confirmar que el río continúa limitando el acceso y Graham no entrega la llave en la demo.
Estas son verificaciones manuales pendientes hasta ejecutarlas; el arnés de sesiones no valida el gameplay. Los test*.js existentes son herramientas históricas y deben revisarse antes de usarse.
