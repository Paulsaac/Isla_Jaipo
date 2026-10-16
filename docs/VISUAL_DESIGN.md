# Gestión de diseño estético

## Rol y límites
El chat de este acuerdo gestiona sprites, texturas, materiales, apariencia del terreno, iluminación y efectos visuales de Isla Jaipó. Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md y esta guía antes de intervenir. Son pedidos visuales concretos, no autorización para inventar contenido o alterar misiones. Los ajustes de sonido de pasto fueron pedidos explícitos del usuario.

Preservar originales, mapas y cambios ajenos. Priorizar ajustes pequeños en los módulos responsables; no regenerar imágenes ni reorganizar recursos sin necesidad. Si un ajuste de terreno, geometría o escala afecta colisiones, navegación, eventos o rendimiento, documentar el impacto y coordinar con el ámbito correspondiente. No modificar física para resolver solo una apariencia.

## Integración actual
- Montaña (pedido posterior2026-10-16): la nieve del PNG vigente define la cima y la banda marrón define la ladera. Sustituye la separación anterior entre nieve visual y huella de meseta. src/world/mountain-relief.js conserva la pintura para alturas; src/content/mountain-relief.js sirve de referencia de colisiones al repintar y de cota base. El camino conserva el trazado del PNG y sigue la ladera mediante followTerrain en mountain-path.js/mountain-slope.js; sin rampa independiente ni ruido añadido de DIRT en montaña. Desnivel base aumentado10% mediante inclineMultiplier1.1, cima129.02256; estado y pruebas en HANDOFF.md.
- game.js crea materiales y vegetación terrestre; árboles usan seis variantes y dos planos cruzados por instancia, con ancho compartido. Límites visuales de sectores derivan de su geometría en src/world/instance-sectors.js; colisiones provienen de matrices del mapa.
- imagenes/Sprites y imagenes/Texturas contienen los originales. Mantener nombres, mayúsculas, transparencia y rutas sensibles a publicación estática.
- src/world contiene shaders y geometrías; consultar los módulos afectados antes de cambiar materiales o efectos. Coordinar triggers y duración de eventos con quests, presentación de NPC con su ámbito e interfaz con PLAYER_UI.md.
- src/systems/music-events.js reproduce pasto.mpeg por petición del usuario. game.js selecciona la superficie y los acentos; walking-rhythm.js conserva variaciones correlacionadas. No confundir ganancia base con volumen percibido ni con volumen del sistema.

## Verificación y relevo
### Acceso de cueva de prueba — 2026-10-15
Por pedido explícito del usuario este ajuste también conecta navegación: src/world/cave-entrance.js sitúa el acceso de rocas en X28/Z138, game.js integra corredor/terreno y trigger tras2.4unidades, y src/world/cave-test-map.js carga mapa_cueva.png en un área provisional aislada, con regresoE/B y progreso exterior conservado en memoria. El PNG fue confirmado como recurso de prueba: representación simplificada, sin entidades/vegetación ni sistemas completos de la isla. No tratarlo como interior definitivo. Alcance, pruebas y pendientes en la entrada correspondiente de HANDOFF.md; cambios futuros de misiones/interacciones requieren coordinación con sus roles.

Registrar pedido, archivo original/variante, rutas y módulos afectados, dimensiones/unidades, valores anteriores/finales, condiciones de iluminación/distancia y evidencias cuando correspondan. Verificar carga y consola, transparencia, anclaje al suelo, lectura de silueta, repetición de texturas y límites de visibilidad según el cambio. Comparar antes/después y distinguir lectura de código, fixture aislado y prueba en juego; no afirmar rendimiento móvil o calidad auditiva sin comprobarlos.

El bloqueo es único entre chats. Mantener sesión entre ajustes. Al recibir el cierre, actualizar solo documentos pertinentes a diseño estético y su entrada en HANDOFF.md; registrar decisiones duraderas cuando corresponda y liberar el bloqueo según docs/PROTOCOL.md. Sin staging, commit ni push automáticos; Clawshoot integra y publica manualmente. No cerrar ni documentar el trabajo de otros roles como propio.
