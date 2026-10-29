# Retomar con AXBYZ — Bosque — 2026-10-28

Frase exacta acordada para reconocer este relevo:

> Hola, soy AXBYZ, retomemos lo de hoy para trabajar en el evento del bosque.

El usuario de esta sesión se identifica explícitamente como AXBYZ. La próxima conversación se centrará en pulir el evento psicodélico del Corazón del Bosque. No asumir que pide rehacerlo ni introducir efectos nuevos sin concretar su siguiente ajuste.

## Inicio y estado de la copia

Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md, DECISIONS.md, docs/QUESTS.md, docs/FOREST_CUES.md y docs/VISUAL_DESIGN.md. Para monitor/controles leer docs/PLAYER_UI.md. Este relevo y las entradas de cierre del 28 prevalecen sobre valores históricos. Seguir inicio seguro del protocolo: comprobar bloqueo, adquirir token propio, revisar cambios y sincronización remota autorizada por «retomemos» sin pisar el árbol local. No reutilizar el token de esta conversación, que se libera al cerrar.

- Carpeta: C:/Users/clop9/Documents/Codex/2026-10-14/https-github-com-paulsaac-isla-jaipo/work/Isla_Jaipo.
- Rama actual: codex/axbyz-bosque-20261026; HEAD local 6c41123.
- Muchos cambios modificados y módulos nuevos sin seguimiento: son trabajo acumulado valioso. No reset/stash/limpieza ni atribuir todo al próximo chat. No staging, commit ni push por el cierre. Clawshoot integra manualmente.
- Servidores siguen activos por pedido del usuario: localhost8000 PID24384; LAN8001 PID13144, Wi-Fi192.168.4.89; Cloudflare PID24996.
- Enlace público: https://albany-exec-start-robust.trycloudflare.com/ (HTTP200 comprobado al cerrar). Localhost también200. Túnel temporal, verificar antes de compartir si cambió.
- No detener servidores al tomar/cerrar sesión salvo orden expresa.

## Bosque: fuente vigente y puntos de entrada

Audio actual: sonidos/musica/bosque.mp3, copia exacta de X:/OneDrive/Ableton Projects/Singles/Colorbar/1. Si Pude Ser/spscn reverb.mp3. Duración observada en navegador199.584s. SHA256 0644BAFEFBF0F2398C2B05488B283234D00F206229C9E853E6E9216F7D3AFF0E. Sustituye DEF8 y «si pude ser reverb» anteriores. Salida directa sin procesamiento añadido, analizador paralelo; originales conservados. Respaldo local .coordination/backups/forest-before-spscn-20261028/.

Marcas en src/content/forest-cues.js: 0,22.248,43.320,64.029,84.859,105.939,126.848,147.699,168.549,189.127. No confundir marca9 con duración del MP3 actual. No cambiar marcas por inferencia.

- src/systems/heart-event-timing.js: curvas de levitación/efectos; oscilación inicial ±.3u/14s y ascenso adelantado36–44s. Aterrizaje186.127s, efectos hasta189.127s.
- src/world/heart-vision.js: colores/deformación, luces de árboles, cielo psicodélico, caleidoscopio y feedback. Mantener terreno, montaña, puente y exteriores visibles; ocultación temporal solo interiores acordados. Buffers preparados/reutilizados.
- src/world/forest-light-pulse.js: pulso diente de sierra a91BPM, caída95%/recuperación5%, mínimo12%; sincronía cerca de ojos y desfase/irregularidad progresivos lejos. Fase.53s estimada, NO validada por audición humana.
- Colores de luces de secciones: 0,.45,.85,1.25,.85,.85,1.25,.85,1.25; anticipación3s. Revisar código antes de ajustar.
- src/systems/music-events.js: audio/estado/reloj; game.js conecta entrada, preview, locomoción y restauración.
- src/systems/quest-sky.js: anochecer compartido60.029–64.029s, nightStart exacto y permanencia nocturna esperando entrega. Se corrigió flash de amanecer en partida y monitor. Entrega conserva noche final12s, amanecer detenido y liberación al abrir puente. No modificar triggers de misión por estética.
- Escafandra se quita automáticamente en evento; overlay sube al quitar y baja al poner, base plana. Animación detrás del inventario, también desde inventario y al recoger en costa.

## Reproductor temporal y herramientas de revisión

src/ui/forest-event-monitor.js/.css; src/systems/forest-preview-audio.js y forest-preview-energy.js. Barra arrastrable corregida: conserva punto de agarre del thumb, captura rectángulo/duración durante gesto y no salta con seeks asíncronos. Cursor virtual enruta rangos y slider custom sin romper rotación3D.

- «Ir al corazón» sin preview guarda posición/orientación y teletransporta en partida normal, sin congelarla ni impedir Konami.
- Si ya hay preview, permite desplazarse conservando la altura correspondiente a la marca incluso en pausa. Tiempo/altura no derivan al caminar.
- «Volver a posición» restaura ubicación; con preview restaura además estado previo (cielo, escafandra, vuelo, etc.). No altera progreso de misión.
- Konami puede habilitarse durante evento/preview, pero vuelo se desactiva forzosamente mientras forestActive y no puede reactivarse ahí.
- Panel Pruebas en inventario: toggle vuelo, slider.25–4x, cielo; rueda cambia slider durante vuelo. Velocidad común WASD/arriba/abajo =12*slider^1.5 u/s, Shift x2 en todos los ejes. Mínimo1.5,1x12,máximo96 (Shift3/24/192). No volver a curvas horizontal/vertical separadas.
- Panel con fondo/borde/radio igual al reproductor; botones atenúan disabled (.4; slider.45), conservar esa señal durante evento. Hexágonos café oscuro76% con glow persistente; laterales gris oscuro76%, hover/glow. Texto central solo «Señala un objeto. / Pulsa para equiparlo.», sin nombres debajo.
- Cursor inventario movementX/Y1:1 con Pointer Lock ajustado por sistema; cierre restaura raw. Handler de lock duplicado conserva menú al cambiar modo: no deshacer.

## Otros cambios acumulados que deben conservarse

Omniscopio: mástil r.21, largueros laterales X±.29/Z0 conectados peana-horquilla, bastidor silla16miembros con V y apoyapiés conectados. Pistón DEBE IR AL COSTADO X.46, base Z0/Ycentro-2.05 anclada al larguero mediante ménsula X.37; NO centrarlo otra vez. Corona amarilla X±.43, tapa del eje±.47 elimina coplanaridad. Lámparas seis: brazo, tabla y cerámica centrados Y.04; vidrio28%. Tejados planos piedra oscura, fachadas limpias, sin bandas/vigas decorativas interiores. Escalera recta primer→segundo desplazada+3X; solo caracol segundo→tercero, giro invertido y techo madera continuo.

Camino cima poroso con misma tierra bajo piedras y ramas, curvas ajustadas según referencias; PNG originales intactos. Fuego azul atlas pixelado32² por frame, base estable; cristal altar celeste facetado. CRT reducido solo5%. Salto submarino con escafandra restaurado. Pasos de tierra/pasto corregidos junto al corazón y observatorio, sin oscilador sintetizado. No reabrir estos cambios sin pedido.

## Evidencias y límites

Arneses/capturas/notas locales ignorados en .coordination/. Leer antes de ejecutarlos: algunos antiguos esperan14miembros, cursor1.6 o pistón centrado y están obsoletos.

- check-monitor-return-konami-20261028.cjs: integración real, teleport normal, Konami, movimiento con marca pausada/altura constante y retorno sin progreso alterado.
- check-flight-equal-speed-20261028.cjs:18 mediciones reales en3valores, horizontal/arriba/abajo y Shift; diferencia<.3%, sin errores.
- check-inventory-system-cursor-20261028.cjs: sliders y giro3D conservados.
- check-omniscopio-side-piston-20261028.cjs: estructura/pistón lateral en min/0/max, render sin errores.
- check-inventory-opacity-20261028.cjs: colores/glow transferible, captura actual del panel.
- Notas detalladas: forest-monitor-notes-20261027.md, forest-night-hold-notes-20261028.md, forest-reverb-notes-20261028.md, inventory-test-controls-notes-20261028.md, omniscopio-braces-notes-20261028.md y restantes *notes*.md.

Pendiente: pulido que indique AXBYZ, escucha humana de sincronía/fase y mezcla, fluidez en dispositivo afectado y móvil físico, recorrido integral de quests. No afirmar que esas pruebas se completaron. El objetivo inicial es retomar el estado actual y recibir su próximo ajuste concreto del evento.
