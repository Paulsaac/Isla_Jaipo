# Gestión y organización de archivos

## Función acordada — 2026-10-13
El chat de este acuerdo administra la organización de archivos y la coherencia de la arquitectura de Isla Jaipó. Mantiene un inventario comprensible, propone y realiza ajustes graduales dentro del alcance solicitado, comprueba referencias y documenta responsabilidades para que Codex, Antigravity y los chats especializados puedan continuar desde los archivos.

Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md y este documento antes de reorganizar. El bloqueo de tools/session.ps1 sigue siendo único para toda la copia. Que dos chats usen Codex no implica que compartan sesión: solo reutilizar el token adquirido en el propio chat. Recuperar otro bloqueo únicamente tras confirmación del usuario de que su propietario dejó de trabajar, conforme al protocolo.

## Responsabilidades y coordinación
| Ámbito | Responsable y memoria |
| --- | --- |
| Organización de rutas, clasificación de archivos y límites de módulos | Este chat; docs/ORGANIZATION.md y docs/STRUCTURE.md. |
| Interfaz del jugador, HUD, controles y parámetros de interacción con el entorno | Chat de interfaz; docs/PLAYER_UI.md. Coordinar traslados y límites entre presentación y reglas. |
| NPC, conversaciones e interacciones | Chat de NPC; docs/NPCS.md. Coordinar cualquier traslado de sus módulos. |
| Quests y eventos asociados a canciones | Chat de quests; docs/QUESTS.md. Coordinar estado, triggers y presentación antes de extraer o trasladar módulos. |
| Pruebas complejas, rendimiento y optimización | Chat de pruebas; docs/TESTING_PERFORMANCE.md. Puede modificar código para optimizar con comparación antes/después y verificación de regresiones; resultados en HANDOFF.md según docs/PROTOCOL.md. |
| Reglas comunes, sesión y cierre | AGENTS.md y docs/PROTOCOL.md; aplican a todos los ámbitos. |
| Estado vigente y pendientes | HANDOFF.md, conservando los relevos anteriores como historia. |
| Decisiones duraderas | DECISIONS.md; no reemplazar acuerdos previos sin registrar la sustitución. |
| Historia de Antigravity | ANTIGRAVITY_HANDOFF.md; enlazar el protocolo vigente sin duplicar el estado. |

Las responsabilidades corresponden a chats concretos, no a todos los agentes que lean estos documentos. El relevo se transmite mediante archivos; no enviar mensajes entre chats automáticamente. Una reorganización que afecte un sistema debe describir rutas anteriores/nuevas, referencias ajustadas, comportamiento esperado, verificaciones y pendientes para su responsable.

## Inventario inicial y límites de la revisión
Inspección local del 2026-10-13: listado de carpetas y archivos fuera de .git/node_modules, estado Git, documentación compartida, entradas y servidor, importaciones/rutas de recursos y operaciones de lectura/escritura de herramientas históricas. No se ejecutaron generadores ni parches; no se hizo una auditoría semántica de cada línea, inspección visual de todos los assets ni recorrido de gameplay. node_modules se identifica como instalación local; .coordination contiene bloqueo, copias, capturas y mediciones históricas, sin revisión exhaustiva de cada evidencia.

| Ubicación actual | Función y criterio |
| --- | --- |
| index.html → src/startup.js → game.js | Entrada del navegador y composición del juego. Mantener rutas hasta una extracción concreta verificada. game.js concentra todavía escena, estado, controles e interacciones. |
| src/config.js | Configuración compartida. |
| src/content/ | Datos de entidades y conversaciones. |
| src/systems/ | Reglas de misiones, llaves, puertas, aire, audio y eventos. |
| src/world/ | Mapa, terreno, geometrías, agua, cielo y representación visual. |
| src/player/, src/input/, src/ui/ | Consultas físicas del jugador, entradas y presentación. |
| imagenes/, sonidos/ | Recursos del juego y originales/copias del usuario. Preservar nombres, mayúsculas y contenidos hasta comprobar usos. |
| exports/ | GLB exportados; no asumir que reflejan la versión actual de las geometrías ni que el juego los carga. |
| tools/ | Servidor, bloqueo cooperativo y visor de mapa. |
| docs/ y documentos de raíz | Arquitectura, procedimientos, decisiones y relevo. Evitar crear fuentes rivales del estado vigente. |
| Scripts Python, test*.js, run_hang.ps1, subir_github.bat en raíz | Auxiliares históricos mezclados con entradas activas. Algunos sobrescriben código/imágenes, usan mapas antiguos, rutas absolutas o puertos distintos. Clasificación pendiente antes de trasladarlos o ejecutarlos. |
| package.json, package-lock.json, node_modules/ | Herramientas locales de desarrollo, actualmente sin seguimiento; Puppeteer no es dependencia del jugador. npm test no ofrece una suite válida. |
| .coordination/ | Estado y evidencias locales ignorados por Git. No mover el bloqueo ni borrar copias por considerarlas temporales. |

## Criterios de organización
- Conservar JavaScript y módulos ES nativos, sin introducir empaquetador, backend ni dependencias por ordenar carpetas.
- Colocar contenido en content, reglas en systems, presentación en ui y construcción visual en world; revisar las dependencias existentes antes de extraer responsabilidades de game.js.
- No clasificar como descartable un archivo solo por su nombre, antigüedad o falta de seguimiento. Identificar origen, lector, escritor y necesidad de conservación.
- Para herramientas futuras, usar tools y nombres que describan la función. Posibles destinos para herramientas existentes: tools/diagnostics, tools/maintenance y tools/legacy; son una propuesta, todavía no creados ni adoptados como migración.
- Mantener rutas de recursos relativas a la página y respetar mayúsculas para publicación estática. Revisar importaciones, URL dinámicas, scripts, documentos y lista permitida del servidor LAN ante traslados.
- Separar cambios de rutas de cambios de gameplay. Realizar lotes pequeños, con comparación del diff y verificación de carga cuando corresponda.

## Prioridades pendientes
1. Completar la clasificación individual de auxiliares: finalidad, entradas, salidas, rutas, dependencias, vigencia y estado Git. Elegir destinos y actualizar referencias antes de mover; conservar originales valiosos.
2. Mantener docs/STRUCTURE.md alineado con sistemas recientes de inmersión, Corazón del Mar e inventario. Corregir referencias documentales comprobadas; la guía de publicación conserva una ruta antigua del cielo y omite sonidos en su listado de recursos.
3. Evaluar exclusiones locales de Git para dependencias/evidencias sin ocultar trabajo del usuario ni incorporar auxiliares indiscriminadamente. No se modificó .gitignore en este acuerdo.
4. Extraer responsabilidades de game.js únicamente por tareas concretas y con verificación del sistema afectado. Su tamaño es una señal para revisar límites, no motivo para una reescritura completa.

## Procedimiento por cambio
1. Revisar sesión, estado Git y relevo; delimitar archivos propios y cambios ajenos.
2. Identificar lectores/escritores y registrar el motivo de cada traslado o extracción.
3. Comprobar el propio token antes de editar; actualizar rutas y documentación en el mismo lote.
4. Verificar referencias y diff. Si afecta carga o comportamiento, comprobar navegador y entregar al chat de pruebas el alcance complejo con reproducción. Registrar lo no ejecutado.
5. Mantener sesión entre pedidos. Al cierre explícito actualizar solo documentación pertinente a organización y su entrada en HANDOFF.md; liberar el bloqueo según docs/PROTOCOL.md. Sin staging, commit ni push automáticos; Clawshoot publica manualmente.
