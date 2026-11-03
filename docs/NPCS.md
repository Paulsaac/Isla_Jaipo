# Gestión de NPC, conversaciones e interacciones

## Identidades de los dos magos — acuerdo con AXBYZ, 2026-10-29

- **Space Wizard** (`space-wizard`): mago del espacio, casa de la montaña.
  Configuración `spaceWizardHouseLayout` en `src/content/summit-layout.js`.
- **Time Wizard** (`time-wizard`): mago del tiempo, casa del sector del lago.
  Configuración `timeWizardHouseLayout` en `src/content/lake-house-layout.js`.

Usar estos nombres para distinguir personajes, casas y futuras conversaciones.
Los nombres anteriores `wizardHouseLayout` y `lakeHouseLayout` son alias de las
respectivas configuraciones; los módulos `wizard-*` actuales corresponden a
Space Wizard y los módulos `lake-house-*` a la casa de Time Wizard. Esta
nomenclatura no incorpora por sí sola nuevos NPC, diálogos ni misiones.

## Graham: correcciones vigentes — 2026-10-24
Las secuencias de despertar, misión del Corazón del Bosque y recompensa usan los textos solicitados por Clawshoot en esta entrega. Mate: «Ten. Cuidado que está caliente.». Graham no ejecuta dap; datos y módulo reutilizable conservados. Llave inicialmente desactivada por GRAHAM_BRIDGE_KEY_AVAILABLE=false; J habilita el evento en memoria y avisa «Evento Llave del Puente Activada». Entregar el corazón no da automáticamente la llave: se habla nuevamente con Graham tras activar el evento, y se añade la llave al entregar «Aquí tienes». El cofre del mapa se habilita tras el agradecimiento del corazón. No hay persistencia. Estos valores sustituyen las descripciones anteriores de dap/mate/llave en esta guía; no cambian los triggers de cielo acordados.

## Alcance acordado — 2026-10-13
El chat donde el usuario pidió este documento está dedicado a gestionar los NPC de Isla Jaipó, sus conversaciones y sus interacciones con el jugador, las misiones y el mundo. Puede implementar los pedidos del usuario dentro de este ámbito; esta dedicación no autoriza inventar personajes, recompensas o cambios de diseño sin un pedido concreto. El chat de pruebas complejas conserva su función independiente.

Los archivos son la memoria de relevo; otro chat o Antigravity no recibe automáticamente esta conversación. Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md y este documento antes de trabajar en NPC. El bloqueo de tools/session.ps1 es único para toda la copia, incluidos los chats especializados. Retomar y cerrar siguen los comandos del protocolo compartido.

## Responsabilidades de la arquitectura actual
| Archivo | Responsabilidad |
| --- | --- |
| src/content/dialogues.js | Textos y secuencias de conversación de Graham. |
| src/content/entities.js | Posición de Graham y configuración de entidades relacionadas. |
| src/config.js | Dimensiones y disponibilidad de la llave de Graham. |
| src/systems/forest-heart.js | Estado de misión y garantía de entrega única de la llave durante la sesión. |
| game.js | Creación de Graham, selección/avance/cierre de diálogo, inventario y efectos de las entregas. |
| src/ui/menus.js y src/ui/hud.js | Presentación de diálogo, inventario y avisos de objetos recibidos. |
| src/input/keyboard.js y src/input/touch-controls.js | Entrada de teclado/táctil mediante acciones compartidas. |
| src/systems/key-inventory.js y src/systems/quest-sky.js | Uso de llaves y relación entre misión y ciclo del cielo. |

Mantener módulos ES nativos y cambios pequeños. No crear un motor de diálogos, una máquina de estados genérica o dependencias por esta documentación. El registro de entity-registry.js se consulta actualmente para cofres; Graham se crea explícitamente en game.js. Añadir una definición al registro no crea ni conecta un NPC automáticamente. Para varios NPC, conectar una identidad propia y la selección de contenido explícitamente antes de reutilizar la rama genérica de tipo NPC.

## Estado actual de Graham, cofre y mate — IslaJaipoC1, 2026-10-16

El corazón sale del inventario después del dap. Al terminar toda la conversación de agradecimiento, el cofre emite un sonido espacial y se abre; el mapa queda visible dentro hasta tomarlo con E/B. No hay llave del cofre. Interactuar con el mate o la tetera del comedor inicia «Quieres mate?» y entrega un mate una sola vez. Seleccionado en inventario, se bebe con clic derecho en PC o A en celular: una pulsación breve conserva el gesto durante 1,5 s y mantenerlo deja la bombilla junto a la boca. La llave del puente sigue pendiente y no se entrega en esta secuencia.

## Bicho del entretecho — incorporación local de AxByZ, 2026-10-16

Segundo NPC conectado en esta copia. Identidad técnica attic-ant, etiqueta descriptiva «Bicho». Habita sobre el cielo falso, hacia rincón izquierdo/norte de la casa de Graham; la posición se elige bajo una parte de cubierta con espacio suficiente y fuera del hueco de la cama. Modelo de hormiga marrón oscura, seis patas, antenas y dos ojos saltones negros sin iris de color; no bloquea movimiento.

E/B abre atticAntDialogs: «no le digas a nadie que vivo aqui». La misma frase se repite al hablar otra vez. No cambia misiones, inventario, antorcha, mapa ni llaves. game.js distingue id antes de lógica de Graham; menus.js recibe speaker y conserva Graham por defecto en sus conversaciones/saludo. Referencia visual/modelo/colocación y pruebas en HANDOFF.md. La afirmación histórica inferior de que Graham es el único NPC ya no describe esta copia local.

## Ajuste local de AxByZ — 2026-10-16

La entrega usa ahora heartDeliveryDialogs con el texto solicitado y una acción dap tras el segundo mensaje; al completar retira el corazón y las conversaciones siguientes usan heartDeliveredDialogs (agradecimiento, llave pendiente y techo/mate). GRAHAM_BRIDGE_KEY_AVAILABLE=false por este pedido: todavía no da la llave. La condición futura para encontrarla está pendiente. El dap acerca ambos actores durante1.1s, reproduce el audio original y devuelve las posiciones antes de continuar; pausa/reanudación y bloqueo E/B evitan duplicaciones. Detalle de implementación, pruebas y límites en la entrada de HANDOFF.md del16deoctubre. Las tablas inferiores conservan la referencia anterior con llave habilitada y no sustituyen este ajuste local.

## Referencia vigente de Graham
Alcance de Bosque aclarado por Clawshoot (2026-10-13): AxByZ puede modificar los diálogos de Graham; no están cerrados. Coordinar con este ámbito y preservar las conexiones entre secuencias y efectos. Los ciclos de luz y triggers que los accionan se mantienen como acuerdos estables; cualquier modificación a ellos requiere coordinación previa con Clawshoot. La autorización de edición narrativa no cambia por sí sola reglas de misión o recompensas.

Referencia contrastada con el código el 2026-10-13; no constituye una prueba en navegador de esta sesión. Único NPC conectado identificado en esta revisión: Graham, celda (235,421), mundo (470,842), altura 1.9, sprite imagenes/Sprites/Graham.png. Ver docs/ENTITIES.md para coordenadas y alineación al suelo. La carpeta local personajes sin seguimiento no acredita NPC implementados.

| Condición al iniciar conversación | Secuencia | Efecto al completar |
| --- | --- | --- |
| Sin antorcha, incluso si ya lleva el corazón | npcDialogs | Recibe una antorcha apagada una sola vez; esta conversación no entrega el corazón. |
| Con antorcha, llevando corazón y llave habilitada | bridgeKeyDeliveryDialogs | Entrega el corazón, lo retira del inventario/mano y recibe bridge-key una sola vez. |
| Con antorcha, misión entregada, sin recompensa de llave y llave habilitada | bridgeKeyDeliveryDialogs | Recibe bridge-key una sola vez. |
| Con antorcha y recompensa de llave ya recibida | bridgeKeyReceivedDialogs | Recordatorio; no repite recompensa, aunque la llave física ya se haya consumido. |
| Con antorcha, buscando corazón | npcDialogs | Repite introducción; no duplica antorcha. |

GRAHAM_BRIDGE_KEY_AVAILABLE es true. heartDeliveryDialogs y heartDeliveredDialogs conservan textos de espera usados como alternativa cuando esa opción está deshabilitada; no describen el recorrido vigente con la llave habilitada. La selección y las recompensas todavía dependen de referencias a arrays en game.js: cambiar exports o reemplazarlos por copias requiere revisar esas comparaciones.

Recibir la llave habilita el cofre del mapa (231,425). Entregar el corazón inicia los últimos 12 segundos de noche y la transición suave hasta un amanecer detenido, sin avanzar al día. Abrir el puente (264,276)/(265,276) exige seleccionar la llave y consume una; esa apertura libera la salida del sol y Mañana, y el ciclo habitual continúa. Si se abrió antes, Mañana espera al amanecer. La autorización del cofre se basa en la recompensa de misión, no en conservar la llave física. La recogida del Corazón del Bosque y su evento musical son distintos de la entrega: hablar con Graham no cancela la experiencia musical.

No hay persistencia entre recargas. El reinicio tras morir conserva actualmente progreso e inventario de sesión; no redefinir ese diseño como parte de una modificación narrativa. El Corazón del Mar no tiene interacción posterior con NPC definida; registrar cualquier propuesta como pendiente de diseño.

## Procedimiento para cada pedido
1. Leer el relevo y comprobar sesión, rama, versión y cambios locales según docs/PROTOCOL.md. Adquirir o conservar la sesión propia antes de editar; no tomar el bloqueo de otro chat por compartir el nombre Codex.
2. Identificar NPC y objetivo del pedido. Registrar condiciones de entrada, orden de prioridad de conversaciones, texto, efecto al completar, repetición e interrupciones. Separar propuesta, decisión del usuario, implementación y prueba realizada.
3. Seguir el recorrido real desde entrada e interactable hasta diálogo, estado de misión, inventario y efectos en mundo/cielo/audio. Para mover un NPC revisar terreno, accesibilidad, interiores, interacción y visibilidad; preservar mapas y sprites salvo pedido que los requiera.
4. Editar el módulo responsable: texto en content, reglas de misión en systems y presentación en ui. Mantener la coordinación actual en game.js cuando corresponda. Para un NPC nuevo documentar cómo se crea, identifica y conecta; no asociarle por defecto las recompensas de Graham.
5. Aplicar efectos únicamente en el momento definido y con comprobación de estado para evitar duplicaciones. No cambiar el orden de entrega, consumo de objetos o desbloqueos incidentalmente al corregir texto.
6. Verificar el comportamiento afectado y los recorridos dependientes. Si la actualización es compleja, preparar el paquete de relevo para el chat de pruebas según docs/PROTOCOL.md. Registrar las limitaciones; leer código no equivale a probar gameplay.
7. Mantener la sesión entre ajustes. Al cierre explícito, actualizar solo documentación pertinente a NPC y su entrada en HANDOFF.md; registrar decisiones duraderas del ámbito cuando corresponda y liberar el bloqueo según docs/PROTOCOL.md. Sin staging, commit ni push automáticos; Clawshoot publica manualmente. Una petición expresa de documentar autoriza esa escritura durante la sesión sin cerrarla.

## Ficha de NPC o cambio narrativo
Usar esta ficha en el relevo para cada personaje nuevo o cambio significativo; completar con datos confirmados y marcar lo desconocido como pendiente.

- Identidad/nombre, función narrativa y estado: propuesta, implementado o verificado.
- Ubicación X/Z de mapa, orientación, altura/apoyo, sprite y archivos responsables.
- Identidad del interactable, entrada para hablar y restricciones relevantes.
- Conversaciones: condición y prioridad, secuencia/export, repetición y cierre/interrupción.
- Efectos: objetos recibidos/consumidos, estado antes/después, garantía de ejecución única y dependencias del mundo.
- Recarga y muerte: comportamiento actual comprobado o pendiente, sin asumir persistencia.
- Verificación: versión y cambios locales, pasos, esperado/observado, plataforma y pendientes.
- Decisiones confirmadas y preguntas de diseño abiertas.

## Verificación y paquete de relevo
Para Graham, cubrir primera conversación y antorcha, corazón recogido antes/después de introducción, entrega completa, repetición sin premios duplicados, llave seleccionada y consumida en puente, mapa antes/después de recompensa y amanecer condicionado. Según el cambio, incluir avance E/B, pausa/inventario, muerte/reinicio/recarga y coexistencia con evento musical. No asumir que el diálogo exige sostener el corazón: la condición actual es el estado de misión y la posesión de antorcha.

En HANDOFF.md dejar versión/commit y cambios locales, NPC y secuencias afectados, decisión solicitada, comportamiento final, archivos, pasos de reproducción, verificaciones ejecutadas, resultado y pendientes. Los fallos deben incluir esperado/observado y evidencia útil. Actualizar esta referencia si cambia el comportamiento descrito; evitar duplicar el historial en ANTIGRAVITY_HANDOFF.md. El siguiente agente continúa desde los archivos y comprueba el código disponible.
