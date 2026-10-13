# Pruebas, rendimiento y optimización

## Función acordada — 2026-10-13
Este chat está dedicado a probar actualizaciones complejas de Isla Jaipó y a medir, diagnosticar y optimizar su rendimiento. El usuario amplió el rol: puede modificar el código para resolver cuellos de botella identificados, además de informar resultados. Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md y este documento antes de trabajar en este ámbito.

La autorización de optimización permite cambios técnicos pequeños y verificables que conserven las reglas, controles, contenido y presentación acordados. Cambios de diseño, reducción de detalle o alcance visual y ajustes de balance requieren un pedido que los incluya. Coordinar los sistemas afectados con docs/PLAYER_UI.md, docs/NPCS.md, docs/QUESTS.md y docs/ORGANIZATION.md. Los chats comparten un único bloqueo; solo reutilizar el token adquirido en el propio chat y recuperar otro tras confirmación del usuario.

## Responsabilidades
- Verificar comportamiento nuevo y regresiones de los sistemas relacionados, incluyendo recorridos completos cuando el cambio lo requiera.
- Medir carga inicial, primeras interacciones y rendimiento durante juego; distinguir esos escenarios para identificar el origen de los tirones.
- Diagnosticar trabajo de CPU/GPU, render, geometría, shaders, instancias, recursos, memoria, audio y actualizaciones por fotograma según la evidencia disponible.
- Implementar optimizaciones del cuello de botella identificado, preservar comportamiento y verificar de nuevo. No añadir dependencias, servicios ni instrumentación permanente sin necesidad.
- Registrar resultados y limitaciones en HANDOFF.md; decisiones duraderas en DECISIONS.md. No afirmar mejora de FPS, memoria o temperatura sin medición que la respalde.

## Procedimiento de rendimiento
1. Confirmar versión/commit, cambios locales, bloqueo propio y escenario afectado. Revisar herramientas históricas antes de ejecutar; no asumir que test*.js o npm test forman una suite vigente.
2. Obtener una línea base reproducible: dispositivo, navegador, resolución, pixel ratio, límite de FPS, escena/ruta, duración, estado del ciclo, audio e inmersión. Separar caché fría, calentamiento y ejecución estable cuando sea relevante.
3. Medir lo pertinente: tiempos de fotograma y tirones (mediana y percentiles si hay muestras suficientes), FPS, tiempo de carga/interacción, llamadas de dibujo y triángulos, memoria y solicitudes. El límite vigente de 30 FPS puede ocultar mejoras en el promedio: observar también tiempos y estabilidad. Contadores de render no equivalen a una mejora de FPS.
4. Localizar el cuello de botella mediante perfiles o evidencias. Describir qué se midió, qué se infiere y qué sigue sin confirmar. No atribuir por defecto problemas de juego al hosting.
5. Aplicar un cambio acotado y comparar con la línea base en condiciones equivalentes, con repeticiones cuando haya variación significativa. Conservar la base y las evidencias necesarias sin sobrescribir trabajo ajeno.
6. Verificar carga/consola y regresiones de los sistemas afectados. Aire, pausas, animaciones, audio, colisiones e interacciones deben conservar sus tiempos y reglas aunque cambie el coste de render o actualización.
7. Registrar resultados antes/después, alcance real y pendientes. Una simulación o navegador de escritorio en modo táctil no valida rendimiento, consumo o temperatura en un teléfono físico; indicar el hardware no probado.

## Relevo por actualización
Dejar en HANDOFF.md:
- Versión y cambios locales probados; objetivo, archivos y sistemas afectados.
- Pasos, ruta, condiciones y dispositivo/navegador; resultado esperado y observado.
- Línea base, método, unidades y comparación tras optimizar; perfiles/capturas/logs disponibles.
- Cambios técnicos realizados y comprobaciones de comportamiento/regresión.
- Estado de cada comprobación: aprobado, fallo confirmado o pendiente/no ejecutado; limitaciones y siguiente acción.

Las evidencias auxiliares pueden conservarse en .coordination conforme al uso existente; no publicar copias, perfiles o scripts locales indiscriminadamente. Usar herramientas de diagnóstico solo dentro del alcance autorizado y mantener instrumentación de prueba fuera del juego distribuido cuando sea posible. Commit/push y cierre siguen el protocolo habitual; esta dedicación no ejecuta esas operaciones por sí sola. Mantener el servidor LAN persistente según la orden vigente del usuario.

## Prioridades heredadas, aún pendientes
- Recorrido integral del Corazón del Mar con velocidad final 1.25/2.5 u/s y aire inicial10s/recarga30s; retorno desde piscina al romperse el casco.
- Legibilidad de fragmentos pequeños de noche y regresiones de inventario, pausa, eventos y controles.
- Rendimiento y memoria en móvil real con 19109 plantas submarinas, fundido de vegetación y refracción; separar primera inmersión de inmersiones posteriores.
- Medición en los dispositivos afectados antes de atribuir mejoras a cambios previos. Estos pendientes no son resultados comprobados ni autorizan cambiar los parámetros de diseño.
