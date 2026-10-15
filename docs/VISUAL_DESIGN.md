# Gestión de diseño estético

## Rol y límites
El chat de este acuerdo gestiona sprites, texturas, materiales, apariencia del terreno, iluminación y efectos visuales de Isla Jaipó. Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md y esta guía antes de intervenir. Son pedidos visuales concretos, no autorización para inventar contenido o alterar misiones. Los ajustes de sonido de pasto fueron pedidos explícitos del usuario.

Preservar originales, mapas y cambios ajenos. Priorizar ajustes pequeños en los módulos responsables; no regenerar imágenes ni reorganizar recursos sin necesidad. Si un ajuste de terreno, geometría o escala afecta colisiones, navegación, eventos o rendimiento, documentar el impacto y coordinar con el ámbito correspondiente. No modificar física para resolver solo una apariencia.

## Integración actual
- game.js crea materiales y vegetación terrestre; árboles usan seis variantes y dos planos cruzados por instancia, con ancho compartido. Límites visuales de sectores derivan de su geometría en src/world/instance-sectors.js; colisiones provienen de matrices del mapa.
- imagenes/Sprites y imagenes/Texturas contienen los originales. Mantener nombres, mayúsculas, transparencia y rutas sensibles a publicación estática.
- src/world contiene shaders y geometrías; consultar los módulos afectados antes de cambiar materiales o efectos. Coordinar triggers y duración de eventos con quests, presentación de NPC con su ámbito e interfaz con PLAYER_UI.md.
- src/systems/music-events.js reproduce pasto.mpeg por petición del usuario. game.js selecciona la superficie y los acentos; walking-rhythm.js conserva variaciones correlacionadas. No confundir ganancia base con volumen percibido ni con volumen del sistema.

## Verificación y relevo
Registrar pedido, archivo original/variante, rutas y módulos afectados, dimensiones/unidades, valores anteriores/finales, condiciones de iluminación/distancia y evidencias cuando correspondan. Verificar carga y consola, transparencia, anclaje al suelo, lectura de silueta, repetición de texturas y límites de visibilidad según el cambio. Comparar antes/después y distinguir lectura de código, fixture aislado y prueba en juego; no afirmar rendimiento móvil o calidad auditiva sin comprobarlos.

El bloqueo es único entre chats. Mantener sesión entre ajustes. Al recibir el cierre, actualizar solo documentos pertinentes a diseño estético y su entrada en HANDOFF.md; registrar decisiones duraderas cuando corresponda y liberar el bloqueo según docs/PROTOCOL.md. Sin staging, commit ni push automáticos; Clawshoot integra y publica manualmente. No cerrar ni documentar el trabajo de otros roles como propio.
