# Gestión de interfaz y parámetros del jugador

## Función acordada — 2026-10-13
Este chat gestiona la interfaz del jugador, HUD y sus parámetros de interacción con el entorno de Isla Jaipó. Mantiene presentación, controles, información de estado y coherencia entre lo que el jugador ve, puede hacer y encuentra en el mundo. El acuerdo asigna responsabilidad; los cambios de balance o comportamiento se implementan según pedidos concretos del usuario.

Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md y este documento antes de trabajar en este ámbito. Mantener el bloqueo único de tools/session.ps1, también entre chats Codex. Usar solamente el token adquirido en el propio chat; recuperar otro bloqueo tras confirmación del usuario según el protocolo. El relevo se transmite por documentos, sin mensajes automáticos entre chats.

## Alcance y coordinación
- Gestionar HUD, mensajes de interacción, notificaciones, resistencia, aire, coordenadas, visor de escafandra y pantalla de muerte; menús, inventario, selección de objetos y minimapa.
- Gestionar controles de teclado y táctiles, mirada y acceso a acciones; preservar restricciones comunes de pausa, inventario, diálogo y eventos.
- Revisar parámetros del jugador relacionados con altura, agachado, movimiento, carrera, salto, colisión, agua, aire y bote cuando la tarea los afecte. Distinguir constantes, estado mutable y resultado físico efectivo: una constante de movimiento no equivale por sí sola a velocidad en unidades por segundo.
- Coordinar contenido y condiciones de conversaciones con el chat de NPC (docs/NPCS.md); este ámbito administra su presentación y entrada, sin redefinir recompensas o prioridades narrativas por iniciativa propia.
- Coordinar estados, disparadores y restricciones de eventos con quests (docs/QUESTS.md). HUD e inventario reflejan el estado del sistema responsable; no duplicar progreso ni reglas de misión en el DOM.
- Coordinar traslados y extracciones con organización (docs/ORGANIZATION.md). No reorganizar game.js ni cambiar mapas/assets para resolver un ajuste puntual de interfaz.
- Entregar cambios complejos al chat de pruebas mediante HANDOFF.md, según docs/PROTOCOL.md. No asumir que este chat reemplaza al chat dedicado a pruebas.

## Mapa de responsabilidades vigente
Referencia obtenida por lectura de código el 2026-10-13, base local 6ea1555; no acredita pruebas de navegador.

| Archivo | Responsabilidad |
| --- | --- |
| index.html | Estructura DOM, menús, HUD y estilos generales. |
| src/ui/hud.js | Presentación de interacción, resistencia, muerte, cola de entregas de 3.5 s, aire, visor, tinte submarino y coordenadas. No calcula consumo ni decide muerte. |
| src/ui/menus.js | Presentación de pausa, inventario, diálogo, objetos y selección mediante callbacks; etiquetas y estados de escafandra/fragmentos. |
| src/ui/minimap.js | Creación, visibilidad y posición/orientación del indicador; recibe posición y dimensiones. |
| src/input/keyboard.js | Traducción de teclas a callbacks; condiciones de acciones en el llamador. |
| src/input/touch-mode.js, touch-controls.js; src/ui/touch-controls.css | Detección táctil, cruceta/botones, arrastre de mirada y adaptación de interfaz. |
| src/config.js | Constantes compartidas; no estado mutable. |
| game.js | Composición, estado de menús/acciones, movimiento, uso de inventario, interacción y conexión entre reglas y presentación. |
| src/player/collisions.js, door-push.js | Consultas físicas y desplazamiento relacionado con puertas; coordinar con geometría y matrices vigentes. |
| src/systems/diving-air.js, sea-heart.js, forest-heart.js | Reglas y progreso que alimentan aire, inventario y mensajes; coordinar con quests. |
| src/world/terrain-height.js, boat-steering.js, boat-floating.js, underwater-view.js | Altura física, navegación/flotación y vista submarina; cambios requieren contrastar entorno y jugador. |

## Contratos que deben preservarse
- UI presenta estado; sistemas y game.js autorizan acciones y efectos. Mantener callbacks y evitar dependencias de Three.js en módulos DOM existentes.
- Teclado y táctil comparten restricciones. El prototipo móvil usa SELECT inventario, START pausa, X mapa, Y antorcha, B interacción, A salto y arrastre de mirada; mensajes de E se adaptan a B.
- Inventario permite accionar objetos; mapa requiere su adquisición, llave del puente debe seleccionarse para usarla en las puertas asignadas. Menús bloquean interacción con el mundo detrás de ellos.
- HUD de coordenadas muestra cuadrante X/Z y altura Y del objeto de control; no tratar esa Y automáticamente como cota del suelo. UNIT_SIZE actual es 2.
- Referencia de parámetros: jugador 1.5, agachado 0.9; carrera multiplicador 2; resistencia máxima 3; aire inicial 10 s, fragmentos recargan 30 s no acumulables y movimiento sumergido con escafandra al 50%. Revisar fuentes y usos antes de ajustar; conservar tiempo real de aire y pausa aunque el render tenga límite de FPS.
- Antorcha respeta posesión y bloqueos del evento forest/inmersión; no se reenciende automáticamente al salir del agua. Botes no navegan por el río de corriente.
- No introducir persistencia de progreso. El comportamiento deseado del progreso al morir sigue pendiente de definición; mostrar muerte o reinicio no autoriza decidirlo.

## Procedimiento y ficha de relevo
1. Revisar estado y cambios ajenos; identificar pantalla, acción o parámetro solicitado, fuente de verdad y sistemas afectados.
2. Antes de editar comprobar el propio token. Registrar valores anteriores/nuevos, unidades, condiciones y archivos; hacer cambios pequeños.
3. Verificar según el cambio: carga/consola, legibilidad y superposición, teclado/táctil, apertura/cierre de menús, selección/uso de objetos, diálogo, mapa, agua/aire, movimiento y muerte. Comprobar que una acción no se ejecuta dos veces ni atraviesa un menú. No añadir tests que solo repitan implementación.
4. Para cambios complejos dejar en HANDOFF.md versión y cambios locales, dispositivo/navegador, pasos, resultado esperado/observado, efectos sobre NPC/quests/entorno, verificaciones ejecutadas y pendientes. Distinguir lectura de código, comprobación aislada y recorrido integral.
5. Mantener sesión entre pedidos. Documentación explícita puede actualizarse durante la sesión; cierre, commit/push y liberación siguen el comando de cierre del protocolo.

Pendientes heredados: revalidar recorrido marino con velocidad final y aire 10/30, controles/inventario durante menús y eventos, y definir progreso al morir. Son pendientes de verificación/diseño, no fallos confirmados ni autorización para nuevas funciones.
