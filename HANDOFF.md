# Estado vigente y relevo

Fecha: 2026-10-08 (America/Santiago)
Último agente: Codex.
Estado: sesión finiquitada por solicitud del usuario; relevo disponible. Envío a origin/main autorizado en este cierre; confirmar resultado con git log y origin/main. El bloqueo local debe quedar libre al finalizar el envío.
Rama: main. Base antes del cierre: 2daac49. El commit de cierre se identifica por el mensaje «Improve demo architecture, terrain, lighting and summit access»; consultar git log y origin/main para confirmar el envío, sin depender de este texto.

## Producto y reglas vigentes
- Juego web JavaScript/Three.js sin servicios nuevos. Demo: buscar Corazón del Bosque en cofre 4 (X=165,Z=308), llevarlo a Graham. Graham continúa buscando la llave y no la entrega; sin guardado persistente ni desbloqueo por fecha.
- Graham: coordenadas configurables en src/content/entities.js, X=231,Z=422; altura de pies compensada por transparencia del sprite.
- El usuario pidió mantener la sesión entre ajustes y actualizar los .md solamente cuando indique su cierre. No repetir estado Git en cada entrega. Cerrar no autoriza Git automáticamente; este cierre sí incluyó solicitud expresa de carga al repositorio.

## Cambios incluidos
- Módulos ES: configuración, diálogos, entidades, lectura/decodificación/preparación del mapa, coordenadas, terreno, colisiones, minimapa, menús, HUD, teclado, puertas y misión. game.js mantiene generación de geometría y movimiento. Incluir src/ al publicar.
- Protocolo cooperativo, tools/session.ps1, AGENTS.md, docs/PROTOCOL.md y DECISIONS.md. ANTIGRAVITY_HANDOFF.md conserva historia y enlace al protocolo vigente.
- tools/world-map.html permite consultar coordenadas y cofres; docs/ENTITIES.md explica configuración. Cofre del corazón confirmado por el usuario y objetivo probado por él.
- Puertas: corregido desbloqueo con materiales en array; se preservan consumo de llaves y apertura/cierre.
- Antorchas exteriores #50727A se registran independientemente de roofMap: no sustituyen techos ni generan madera. Hay 94 antorchas (19 exteriores del color indicado), todas con sprite de muro. Antorcha del jugador comienza apagada, T alterna, inventario muestra torch1.png.
- Hasta 12 luces GPU. Exteriores: intensidad base 14.4, alcance 19.2, transición de distancia 44 a 20 unidades y suavizado temporal 0.85 segundos. Interiores: intensidad base 43.2, alcance 24, suavizado 0.35 segundos. Se preserva identidad de cada luz durante desvanecimiento y se evita reasignarla encendida.
- Graham recibe relleno cálido ligado a luces próximas para compensar orientación del plano; no se modificó su imagen.
- Suelo de madera comparte máscara/altura con física. Terreno continuo justo 0.02 bajo el piso, transición exterior de media celda. Texturas del terreno centradas respecto de muros y pasto bajo estructuras para evitar franja de cimientos.
- Agua: corregida variable local que ocultaba material global y lo dejaba sin textura. Alterna Agua1/2/3; opacidad final 0.66. Arena y fondo cercano al agua forman pendiente progresiva, sin salto de dos metros. Relieve de tierra se suaviza hacia arena. Jugador sigue fondo somero y flota a suficiente profundidad, manteniendo resistencia/ahogamiento de la demo.
- Montaña: mountain-height.js crea campos de distancia por banda (montaña/roca/nieve), sumando crecimiento y suavizando esquinas. Reconstituye relieve bajo caminos y construcciones. Escala a la altura máxima anterior calculada, actualmente 375 unidades. Plataforma del edificio de nieve y puerta a Y=375; aproxima terreno a plataforma en radio de 24 celdas. No trasladó el edificio en X/Z.
- Camino DIRT visible sobre roca/nieve; colisiones permiten corredores en uniones diagonales del camino, manteniendo bloqueo fuera del camino. Física sigue pendientes cuando jugador está apoyado. Puerta de la cumbre sigue cerrada con llave.
- tools/serve.cjs: servidor estático Node sin dependencias, localhost:8000, ejecutar node tools/serve.cjs. Si puerto ocupado, comprobar servidor existente antes de detener procesos. El proceso anterior respondió HTTP 200 al cierre; no se inició otro ni se detuvo el existente.

## Verificaciones realizadas
- Sintaxis de módulos afectados mediante node --input-type=module --check y git diff --check.
- Sesiones: adquisición exclusiva, rechazo de segunda sesión/token incorrecto y liberación válida, probados anteriormente.
- Refactorizaciones: comparación de matrices/minimapa/colores con implementación original, equivalencia de consultas de terreno/colisiones antes de cambios de estética, pruebas de carga y controles en Puppeteer. Pausa, inventario, diálogo, teclas, puertas, ahogamiento y reinicio comprobados en pruebas anteriores; no constituyen recorrido integral de todo el juego.
- Pruebas gráficas en Puppeteer con instrumentación solo de respuesta HTTP, sin hooks distribuidos. Carga sin pageerror; mapas reales 512x512.
- Techos: ninguna celda ROOF de capa superior perdida, 19 celdas restauradas. Antorchas: sprites/luces, inicio apagado y T/Q comprobados. Suavizado exterior probado con distancias e intensidades normalizadas; sintaxis tras ampliarlo a 44 unidades.
- Agua: comprobada alternancia de tres texturas; perfil de costa continuo y opacidad. Movimiento real playa/agua: descenso gradual, mayor caída por muestra ~0.026. Único 404 identificado en prueba: favicon.ico.
- Montaña: carga sin pageerror, edificio/suelo/puerta a Y=375. Ruta encontrada de 61 celdas entre base (82,77) y acceso a puerta, con comprobación de colisiones a lo largo de segmentos diagonales. Prueba real subiendo tramo (107,116)->(108,117): separación mínima ojos/suelo ~1.56; sin cámara bajo terreno. No se recorrió toda la ruta con WASD.
- Capturas auxiliares en .coordination/ (ignorado). Algunas vistas panorámicas usaron luz ambiental de prueba y retiraron niebla solo en navegador; la iluminación normal de juego no se alteró por esos ajustes de prueba.

## Pendientes y límites
- Usuario no pudo revisar última montaña por rechazo de conexión; servidor respondió durante cierre. Revisar manualmente tamaño/forma de montaña, camino completo de ida/vuelta, llegada y apertura de puerta con llave, interior de cumbre y techos. Algunas pendientes son pronunciadas por la altura solicitada.
- Plataforma infiere construcciones cercanas a nieve y usa una caja conjunta: válido para mapa actual; revisar si se añaden varias construcciones de cumbre separadas. No afirmar que configura múltiples plataformas independientes.
- Comprobar resultado gráfico de costas, transiciones y brillo en distintas zonas/dispositivos. La demo sigue requiriendo revisión de extremo a extremo antes de publicar.
- No se instaló ninguna dependencia nueva. Puppeteer de node_modules preexistente se usó en desarrollo; package.json/package-lock.json y scripts históricos quedan locales sin incorporar al cierre. El juego no requiere Node/Puppeteer en el navegador.
- Se excluye imagenes/Mapa/capa1.png del commit: tiene una modificación local de origen ajeno a estos cambios, preservada. Pruebas usaron la copia local; comparar con mapa remoto si difiere el resultado. No regenerar ni revertir ese archivo.
- Numerosos patch*.py, inspectores, test*.js y PNG temporales siguen sin seguimiento y sin borrar. No ejecutar ni incluir indiscriminadamente; leer primero. node_modules tampoco se incorpora.
