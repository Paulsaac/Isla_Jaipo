# ÚLTIMA VERSIÓN LOCAL — 2026-10-24 — AXBYZ

Este relevo corresponde al cierre de la sesión de AXBYZ del 24 de octubre de 2026 (America/Santiago). Prevalece sobre las entregas anteriores de esta misma fecha. El trabajo más reciente está guardado en los archivos locales, todavía sin commit ni push.

## Copia que debe continuar el siguiente chat

- Carpeta: `C:/Users/clop9/Documents/Codex/2026-10-14/https-github-com-paulsaac-isla-jaipo/work/Isla_Jaipo`.
- Rama: `main`. Base Git: `1e80fdf9fa546d3aeaa551a1380e5ba638bb467e`, con PR #10 integrado. Los cambios posteriores están sin publicar.
- Respaldo acumulado: `.coordination/backups/Isla_Jaipo_2026-10-24_AXBYZ_cierre_ultima_local.zip`; SHA256 en archivo hermano `.sha256`. No reemplaza los ZIP anteriores de Clawshoot.
- Incluye código, assets nuevos, documentación, Git y auxiliares locales. Excluye únicamente la carpeta de respaldos y `.coordination/session.json`, para evitar duplicar respaldos o restaurar un bloqueo viejo.
- Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md y DECISIONS.md; adquirir una sesión nueva. Este cierre libera solo nuestro bloqueo.
- Conservar cambios sin seguimiento y ajenos. No hacer reset, limpiar archivos, sobrescribir con main ni crear commit/push por inferencia.

## Servidores que deben permanecer encendidos

Comprobados por HTTP 200 y por presencia de los cambios recientes en `game.js` durante este cierre:

| Acceso | Dirección | Proceso observado |
| --- | --- | --- |
| Local del proyecto | http://127.0.0.1:8000/ | PID 9200, `node tools/serve.cjs` |
| LAN, móvil | http://192.168.4.89:8001/?touch=1 | PID 9332, `node tools/serve.cjs --lan --port=8001` |
| Cloudflare temporal | https://positions-trademarks-livestock-womens.trycloudflare.com/?touch=1 | PID 16316, túnel existente a 127.0.0.1:8001 |
| Copia estática local | http://127.0.0.1:8001/ | PID 25744, `.coordination/cloudflare-main-1e80fdf/server.cjs` |

Hay listeners distintos en 0.0.0.0:8001 y 127.0.0.1:8001. No confundirlos ni detener procesos por puerto. La copia estática está en `.coordination/cloudflare-main-1e80fdf/site/` y se mantuvo sincronizada con los archivos de ejecución modificados. La IP y la URL pública pueden cambiar si cambia la red o se reinicia el túnel. No se inició ni detuvo ningún servidor/túnel en este cierre.

## Cambios acumulados de esta sesión

### Omniscopio / observatorio

- Acoplar Astroscopio y mirar requieren sentarse primero apuntando a la silla. Desde la silla se apunta al ocular para abrir un menú reducido. E sale de la vista óptica al asiento manteniendo la dirección e inclinación final; la indicación para levantarse aparece abajo.
- Zoom basal 2x; Z aumenta / X reduce por 2, 10, 30, 50. Desde 50 hasta 200, pasos de 1x cada 0.02 s al mantener pulsado, espera inicial 0.20 s. Táctil conserva botones +/−. La barra refleja 200x.
- Movimiento y zoom se bloquean mutuamente. Entrada compartida de teclado/táctil; flechas y WASD apuntan. Se detiene también la inercia al hacer zoom y en los topes.
- Inclinación común del modelo/cámara: -0.22 a pi/3 (60°). Astroscopio introducido 20 cm adicionales en el casquillo.
- Parpadeo breve al cambiar lentes. Solo al activar 50x: parpadeo 0.42 s, negativo morado inicial y tinte morado/rosado saturado que desaparece en aproximadamente 3.2 s; al salir se usa transición normal. No se repite al recorrer 50–200.
- Modo estelar desde 50x: cielo azul oscuro, estrellas con deriva 0.000001 rad/s, sin estrellas bajo el horizonte y degradado inferior a negro. Niebla desactivada; Sol/Luna mantienen posiciones y escala mundial y crecen por FOV. Estrellas fugaces con trayectorias y tamaño relativos al diámetro lunar, sin encajarlas artificialmente en pantalla.
- Plataforma lateral caminable, escalerilla con cámara delante de los peldaños y salida temprana a 2 cm dentro del borde. Reengancha al volver al borde. Al entrar bajando con W/↑ se mantiene esa dirección solo mientras continúe pulsada; al soltar, vuelve W/↑ subir y S/↓ bajar.
- Barandas visibles detrás y a la izquierda; barrera invisible adicional hacia la silla. Solo queda abierto el borde de la escalera. Vigas diagonales bajo el asiento y dos reposapiés metálicos.
- Sonidos: `gear_start.mp3` → `gear_loop.mp3` mientras quede cualquier dirección pulsada; `gear_end.mp3` al soltar la última, detune aleatorio ±25 cents. El bucle usa fundido cruzado de 160 ms en memoria. Zoom silencia engranajes; movimiento corta el sonido de lente anterior. `lens_change_x50.mp3` solo al activar modo estelar; `lens_change.mp3` en los demás cambios entre lentes.

### Casa, huerto, inventario y audio

- Cama: tres saltos en un toque (salto inicial + dos asentamientos); colchón/almohada con geometría reducida y normales facetadas. Cubrecama con bisel exterior proporcional, paredes bajas verticales y corte junto a la almohada recto hasta la madera.
- Mesa y sillas de Graham desplazadas 0.2 m hacia la pared, manteniendo separación.
- Mate: previsualización de inventario basada en el mismo modelo que la mano; ícono SVG de cuerpo ancho marrón, borde plateado, yerba y bombilla a la izquierda según referencia.
- Libro: texto inferior `[E] Salir`. Mensajes para levantarse de asientos al pie de pantalla.
- Libreta del huerto al 55% del tamaño anterior, cuatro líneas pixeladas sin texto legible (primera gruesa), posición local x -0.70 / z 0.07 y giro +0.16. Rastrillo x +0.68 hacia su extremo; apuntar al centro de la banca permite sentarse. El contenido de lectura del bloc permanece.
- Pisada pasto B: -400 cents y variación de pasto ±20 cents; salto conserva sesgo agudo leve.
- Salamandra: encendido al alcanzar 1000 puntos cortando leña. Fuentes de ignición/bucle mezcladas a mono, volumen a la mitad (0.375 / 0.0375) y humo desde el extremo real del conducto en el tejado. Conservar la espacialización.

### Corazones y evento Bosque

- Ahogo tras adquirir escafandra, fuera de la cueva: vuelve automáticamente a costa transitable cercana a su hallazgo, sin reiniciar la partida. Ruta marina vuelve a 0/10; modelos recogidos quedan ocultos y reutilizables. Escafandra reparada/equipada, aire y resistencia completos. Reinicia solo música/altar marinos, conservando inventario y otras quests. También cubre ahogo después de romper el casco.
- Corazón del Bosque: mezcla Multiply cyan sobre el material original, intensidad respirante 0.72–0.95; sustituye emisión selectiva anterior y copia aditiva de mano. Aplicado a mundo, mano y previsualización. Se puede sacar/guardar desde inventario; en mano enciende PointLight cyan 0.22–0.30, alcance 4.5, mucho menor que antorcha intensidad 8.
- Durante levitación (>0.15 m), límite según tierra conectada a Graham, separado por río y costa. Incluye puente de la llave y dos celdas al norte de su cubierta. `forest-movement-boundary.js` calcula resistencia por posición/dirección, comienza unos 12 m antes y deja margen 0.4 m. No acumula penalización y permite regresar si el efecto empieza fuera. No altera vuelo libre, bote ni cueva.
- Último ajuste: noche sincronizada con canción Bosque, transición de 60.029 a 64.029 s (cuatro segundos antes de marca 3). Marca 2 baja a 0.8 × altura marca 1; marca 3 conserva altura alta, marca 4 baja a altura marca 1 +0.7 m; recupera el plan alto en marca 5. Descenso final marcas 8–9 y frontera amanecer/puente conservados.
- Estela temporal leve mediante `frame-trail.js`, acumulación en color lineal antes del filtro submarino/lentes. Solo activa durante efecto; buffers liberados al desactivar/cambiar tamaño. HUD y objetos en mano se mantienen nítidos.

## Archivos nuevos que no deben perderse

- `src/player/observatory-zoom.js`, `forest-movement-boundary.js`.
- `src/ui/observatory-zoom-bar.js`.
- `src/world/observatory-sky.js`, `forest-heart-color.js`, `frame-trail.js`.
- `src/systems/observatory-gear-audio.js`.
- `sonidos/fx/gear_start.mp3`, `gear_loop.mp3`, `gear_end.mp3`, `lens_change.mp3`, `lens_change_x50.mp3` (copias de los originales proporcionados; originales en D: preservados).
- Referencias `.codex-remote-attachments/` y `exports/telescopio/telescopio.blend1` eran recursos locales previos: conservarlos.

## Comprobaciones y pendientes

- En la primera parte de la sesión se comprobaron en Chrome el sistema inicial de zoom 2–100, escala lunar/solar coherente, silla/menú, niebla/FOV, controles táctiles simulados y la primera plataforma/escalera. Evidencias/scripts en `.coordination/check-omniscopio-*.cjs` y capturas `omniscopio-*.png`. Esos scripts son anteriores a varios cambios y no acreditan la versión 200x ni los refinamientos posteriores.
- Los cambios posteriores se revisaron por lectura de código; no se ejecutaron nuevas pruebas de implementación. Prioridad del siguiente chat: recorrido completo en navegador y móvil real de escalerilla/reenganche, interacción silla/plataforma, audio y exclusión zoom/movimiento, retry de ahogo, límite direccional durante levitación y último ajuste de cielo/alturas/estela. Revisar compilación GPU y coste de los buffers de trail en móvil.
- Análisis de assets: pasto B tiene más energía aguda que A; Gear Loop dura 3.84 s, dos canales. Lectura del mapa confirma que la componente inferior contiene el corazón (94,279) y excluye la zona norte; cubierta del puente en x262–267 / z270–282.
- El HANDOFF previo ya tenía una entrada ajena de cierre con escapes y espacios problemáticos; se conservó. No atribuir sus errores de formato a este cierre.
- No hubo commit, push, merge, sincronización de Git ni publicación adicional durante este cierre.
