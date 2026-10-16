# Transfer Version to AxByZ PC

Versión de revisión preparada el 2026-10-15 para **AxByZ**, cuenta de GitHub confirmada por el usuario: **jaipooficial-hub**. Alias de búsqueda: **Transfer Version to AxByZ**.

## Dónde continuar

- Proyecto original: https://github.com/Paulsaac/Isla_Jaipo
- Rama de revisión: `codex/bosque-transfer-axbyz-pc`, basada en `c7bc312` de `main`.
- Copia temporal privada: https://github.com/Paulsaac/transfer-version-to-axbyz-pc
- La copia contiene todo el juego y los recursos de esta versión. Su README identifica el commit y el pull request de origen. Es una instantánea para traslado; eliminarla más tarde solo mediante una nueva orden explícita.
- La actualización se entrega para revisión; no se autoriza integrar en `main` automáticamente.

El historial privado de este chat no se transmite entre cuentas de Codex. Para recuperar el contexto, abrir este repositorio/copia en el otro PC y pedir: **«Soy AxByZ, retomemos. Busca Transfer Version to AxByZ y lee TRANSFER_VERSION_TO_AXBYZ_PC.md»**. Si el chat no tiene acceso al proyecto, proporcionar la URL privada y autenticar GitHub como `jaipooficial-hub`. No basta un alias para acreditar permisos.

## Descargar y ejecutar en el otro PC

1. Aceptar la invitación del repositorio privado desde GitHub con `jaipooficial-hub`, si todavía está pendiente.
2. Clonar `https://github.com/Paulsaac/transfer-version-to-axbyz-pc.git` o usar **Code → Download ZIP**, extraer y abrir la carpeta completa como proyecto. Clonar permite retomar con Git; el ZIP permite ejecutar y editar sin historial local.
3. Tener Node.js instalado. Desde la raíz ejecutar `node tools/serve.cjs --port=8000`. No requiere `npm install`. Si 8000 está ocupado, usar `--port=8002`; no detener el servidor de Clawshoot.
4. Abrir `http://127.0.0.1:8000/` (o el puerto elegido). Para interfaz táctil añadir `?touch=1`.
5. El navegador necesita conexión para Three.js y la fuente de interfaz externa. La fuente nueva de diálogos y los recursos del juego están incluidos.
6. Leer `AGENTS.md`, `docs/PROTOCOL.md`, `HANDOFF.md` y `DECISIONS.md` antes de editar. No copiar el bloqueo de la otra PC: `.coordination` está excluido. Adquirir una sesión propia con `tools/session.ps1 start -Agent Codex` según el protocolo. Coordinar cambios compartidos con Clawshoot; la copia temporal no autoriza edición simultánea del proyecto original.

## Contexto vigente y decisiones del usuario

El usuario que solicita este traslado se identifica expresamente como AxByZ; Clawshoot administra e integra el proyecto original. Esta versión agrupa los ajustes locales posteriores al PR #1, ya integrado. No se cambiaron mapas PNG originales, ciclos de luz, recompensas ni persistencia de progreso.

- **Corazón del Bosque:** E muestra exactamente `Esta firmemente agarrado...`. Entrada suave de 160 ms, preparada con la fuente cargada para evitar el cuadro fugaz previo. Otro E inicia el forcejeo; mantener la dirección hacia atrás durante 1,5 s lo arranca. Soltar esa dirección reinicia el esfuerzo.
- **Mirada durante forcejeo:** límite angular circular de 0,3 rad respecto a la mirada inicial. Mayor resistencia desde el 55% del radio, retorno libre al centro. Solo durante el mensaje/forcejeo; mirada libre al arrancarlo.
- **Tirón al arrancar:** desplazamiento neto hacia atrás de 0,65 m, sobrepaso de 0,03 m y rebote de retorno. Tramo principal de 0,26 s con frenada en los últimos 0,09 s; retorno suave de 0,09 s. Después, **0,2 s quieto**. Recupera movimiento según las direcciones que sigan pulsadas, incluyendo cambios/liberaciones durante el evento, tanto en teclado como en cruceta táctil. Se elimina inercia anterior sin exigir volver a pulsar.
- **Brillo y temblor:** aumenta la luz azul y emisión del corazón durante el esfuerzo, vuelve a su estado normal al arrancarlo; brillo tenue aditivo en mano solo al seleccionarlo. Temblor leve en el último medio segundo del forcejeo, por debajo de 0,18 grados; se aplica solo al render y no deriva la mirada ni afecta controles.
- **Graham:** `ah, hola` coincide con el instante en que se detiene al jugador, sin espera adicional. Saludo de 1,8 s antes del giro suave de 1,2 s; invitación final espera interacción.
- **Cama y entretecho:** mantener Espacio/A encadena rebotes progresivos (primero 5,5; siguientes 7/8,5/10/12/14/16/18/20). Solo se rompe el cielo falso, con detención de impacto de 0,7 s. Hueco pequeño irregular con bordes de madera y textura alineada, visible desde abajo. La cubierta exterior permanece entera. El rebote sigue siendo progresivo con el hueco abierto y permite alcanzar el entretecho al avanzar; se puede caminar allí y caer por el hueco a la cama.
- **Agachado:** cambia la altura de ojos conservando los pies; evita caer al piso inferior/softlock. Al soltar C bajo un obstáculo mantiene postura y se incorpora automáticamente al despejar la cabeza.
- **Puertas:** hoja sin colisión durante el primer 90% de su apertura de 0,7 s; recupera colisión y empuja cerca del final. Cierre mantiene colisión normal; marco siempre sólido y retroceso seguro de animación si no hay espacio para empujar. Bisagra de puerta de cocina invertida; textura de marcos con densidad pareja respecto a muros.
- **Presentación:** mate más pequeño (escala 0,72) y tetera 0,68. Fuente de cuerpo de diálogos `SuperLegendBoy-4w8Y.ttf`. Esc es pausa general: oculta indicaciones y diálogos, y al continuar restaura la conversación sin superponerla a pausa.

## Archivos principales

`game.js` coordina las interacciones. `src/systems/heart-pull.js`, `spawn-greeting.js` y `doors.js` contienen los eventos; `src/player/attic-support.js` comparte contorno visible/físico del hueco y soporte del entretecho. Revisar también `src/player/collisions.js`, `door-push.js`, `src/world/dry-vine-geometry.js`, `mate-set.js`, `src/content/entities.js`, `src/input/keyboard.js`, `touch-controls.js`, `src/ui/menus.js`, `touch-controls.css`, la fuente local e `index.html`.

## Verificaciones y siguiente paso

Pasaron sintaxis JS y `git diff --check`. Pruebas aisladas con código real a 10/20/30/60 FPS: rebotes progresivos, acceso/retorno del entretecho, hueco y límites de cabeza, agachado/incorporación; puertas en ambos ejes, empuje y restauración segura; retroceso/rebote/pausa de 0,2 s, teclas y cruceta mantenidas/cambiadas/liberadas; cono circular; brillo/temblor sin deriva. Pruebas DOM: primer cuadro del mensaje con fuente fría, cancelación, pausa, reentrada y movimiento reducido. Saludo inicial comprobado por estado: saludo inmediato con detención y giro posterior. Servidor original local responde en `http://127.0.0.1:8000/` en la PC de origen; no implica que exista un servidor en el otro PC.

Los fixtures auxiliares de esta sesión están en `.coordination` local y no se transfieren. **Pendiente:** recorrido visual y de sensación dentro del navegador en el nuevo equipo, especialmente aspecto del hueco, fuente, brillo, temblor y sincronía del saludo; prueba en teléfono físico. Las pruebas aisladas no equivalen a una validación integral del juego. Al retomar, comprobar el estado real del checkout y consultar al usuario qué ajuste desea continuar; no integrar ni publicar cambios automáticamente.
