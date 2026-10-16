# Marcas de Bosque: contexto y uso

AxByZ marcó manualmente momentos del archivo original `sonidos/musica/bosque.mpeg` al escucharlo y pulsar Y el 15 de octubre de 2026. Se agregaron el inicio 0 y el final 9. Son referencias para distribuir efectos del bosque psicodélico y ajustar la levitación; no son un análisis automático del beat ni diez efectos ya implementados.

La fuente de verdad es [`src/content/forest-cues.js`](../src/content/forest-cues.js): `FOREST_CUES`, arreglo inmutable de segundos. Esta tabla documenta esos mismos valores. No sustituirlos por tiempos de otra grabación, versión o reproducción acelerada.

| Marca | Tiempo del archivo | Segundos | Función actual/acordada |
| --- | --- | --- | --- |
| 0 | 0:00.000 | 0.000 | Inicio de canción y tramo inicial de ascenso suave. |
| 1 | 0:22.248 | 22.248 | Culmina ascenso pronunciado cerca de copas; comienza habilitación suave de navegación vertical al avanzar y mirar. |
| 2 | 0:43.320 | 43.320 | Completa el pequeño aumento adicional de altura y rango iniciado en 1. |
| 3 | 1:04.029 | 64.029 | Referencia conservada; efecto específico pendiente de AxByZ. |
| 4 | 1:24.859 | 84.859 | Referencia conservada; efecto específico pendiente de AxByZ. |
| 5 | 1:45.939 | 105.939 | Referencia conservada; efecto específico pendiente de AxByZ. |
| 6 | 2:06.848 | 126.848 | Referencia conservada; efecto específico pendiente de AxByZ. |
| 7 | 2:27.699 | 147.699 | Referencia conservada; efecto específico pendiente de AxByZ. |
| 8 | 2:48.549 | 168.549 | Referencia conservada; efecto específico pendiente de AxByZ. |
| 9 | 3:09.127 | 189.127 | Final del archivo, añadido al cerrar el registro; no inicia otra sección. |

Una sección n es el intervalo entre las marcas n y n+1. La marca0 cubre por tanto0:00–0:22.248. Indicar un efecto para una sección requiere definir qué cambia, transición, intensidad, duración y qué se restaura; conservar los efectos y reglas existentes salvo pedido explícito.

## Reloj y conexiones

Los segundos se cuentan desde el primer instante de audio, no desde agarrar el corazón: Bosque espera4s antes de reproducirse. `musicEvents.getEventPlaybackTime('forest')` usa el reloj de AudioContext de esa pista, que se suspende al pausar. Para efectos nuevos usar el reloj de reproducción, no Date.now ni el tiempo desde iniciar la partida. Comprobar valores nulos cuando la pista no está reproduciéndose.

`src/systems/heart-event-timing.js` importa FOREST_CUES[1] y [2] para la curva y navegación de levitación. El aterrizaje/fundido de los últimos8s depende de la duración real de reproducción; la marca9 documenta el final, no cambia por sí sola los disparadores de misión, entrega a Graham, cielo o Mañana. El resto de efectos psicodélicos sigue su lógica vigente; no afirmar que cada marca tiene un efecto conectado.

## Retiro de la herramienta de autoría

Por pedido de AxByZ, el panel de cuadrados/números y la captura con Y ya no se crean ni actualizan en game.js. Se conserva `src/ui/forest-cue-recorder.js` como herramienta histórica, sin importarlo en la partida. El botón Y de celular sigue siendo correr; no registra tiempos.

Se mantienen los datos originales de la toma en `.coordination/forest-cues/a4ec118a-f96e-4764-9f6c-e4d1ea1553f1.json`, con marca9 tipo end, y cualquier copia del navegador. No borrar esos registros ni regenerarlos al recargar. FOREST_CUES permite usar los tiempos aunque la copia privada de autoría no acompañe otra transferencia. Estos registros son datos de diseño, no guardado persistente del progreso del jugador.
