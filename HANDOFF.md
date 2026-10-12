# Estado vigente — cierre 2026-10-12: evento del corazón y dimensiones

Codex, rama main; base de sesión 29ebd8067c21c8bbe8800ce543d6afe3802451b3. Cierre solicitado con excepción expresa: mantener servidor encendido para continuar después. Commit previsto: «Add music-reactive heart event and adjust world proportions». Documento escrito antes del commit; verificar hash y push con git log y origin/main. Este encabezado prevalece sobre valores históricos inferiores.

## Cambios de contenido y escala
- Cofre del Corazón del Bosque trasladado por el usuario en capa1 de (165,308) a (94,279); mundo (188,558). Nuevo marcador CHEST verificado RGB(255,174,201), anterior ahora GRASS RGB(0,128,0). Configuración actualizada en entities.js y documentación; conserva losa y orientación Math.PI. Se incluye capa1.png sin regenerarlo. Cofre del mapa continúa en (231,425).
- Puerta (235,423) invierte apertura: north. (228,423) mantiene south. Animación y empuje existentes preservados.
- HUD notifica «Has recibido…» al obtener antorcha, llave del puente, corazón, mapa o llave de cofre. Cola de avisos de 3.5 s, independiente del mensaje de interacción. Solo se notifica entrega efectiva; no cofre bloqueado ni recompensas repetidas.
- Dimensiones finales en config.js: WALL_HEIGHT=3, DOOR_HEIGHT=2.2, PLAYER_HEIGHT=1.5, GRAHAM_HEIGHT=1.8. Cámara agachada 0.9. Graham conserva proporciones (ancho 0.8*1.8/1.9) y sus pies se alinean usando la altura actual de geometría. Marcos, dinteles, techo y límites verticales derivan de constantes vigentes.
- FURNITURE_SCALE=0.9. Se escala geometría de todos los muebles definidos, incluidos troncos/mesón/tocón, recalculando boundingBox y boundingSphere; no Mesh.scale, para conservar colisiones existentes. Posiciones, offsets y orientación preservados. Cofres, botes, restos del naufragio y edificios no forman parte de esa lista de muebles.

## Evento musical y distorsión: valores finales
- Recoger corazón activa forest.mpeg (espera existente 4 s). Sin nuevos objetivos ni bloqueo de entrega. Los efectos ahora siguen la canción, aunque el corazón ya haya sido entregado a Graham; no terminan por diálogo.
- music-events.js analiza únicamente forest con AnalyserNode (FFT1024), bandas graves45–250 Hz/agudos1800–6000 Hz, con suavizado. Expone isEventActive, getEventTimeRemaining y getEventDuration. Duración viene del AudioBuffer y avance del reloj AudioContext; pausa conserva tiempo. P/fallo/fin liberan bloqueo de carrera. Ganancias de música/viento del relevo previo conservadas.
- heart-vision.js compone los shaders existentes, sin postprocesado ni imágenes originales alteradas. Ondulación UV en suelo/vegetación; color del agua conserva shader de corrientes y ondas. Más saturación de tierra/pasto/arena/arena mojada/agua; luz propia del pasto para percibir textura de noche. No brillo plano que borre detalles: color conserva luminosidad y dibujo. Terreno mantiene mezcla más suave que vegetación.
- ColorTime avanza 1.25x (ciclos cromáticos 25% más rápidos); Time de ondulación conserva velocidad previa. Cielo nocturno cambia hue HSV de la imagen, con saturación y brillo aumentados. Luna normal/glow/azul cambia hue con un desfase variable respecto al azul dominante del cielo; atlas y alfa preservados. Día/atardecer/amanecer sin shader psicodélico.
- Árboles: ocho ciclos alternados por mod(columna+fila,8), cada uno con velocidad/fase diferentes. Las dos caras del mismo árbol comparten ciclo; cálculo desde posición de instancia conserva asignación al compactar sectores. tree-color-cycle.js comparte fórmula con luces. Arbustos/pasto alto cambian color pero no tienen emisión propia ni luces asignadas.
- El árbol completo recibe emisión basada en su textura (0.45 + graves*0.20), conservando dibujo/transparencia y ocho ciclos. heart-halos.js ya no crea sprites ni puntos luminosos visibles: solo cuatro PointLights reutilizados, sin sombras. Solo TREE, candidatos hasta14 unidades, revisión cada0.4 s; luces a suelo+4.8, alcance18, intensidad máxima de envolvente*(14+graves*8), HSL saturación1/luminosidad0.4. Su envolvente sigue la distorsión.
- FINAL: entrada de distorsión/iluminación 8 segundos desde activar evento; salida durante últimos8 segundos de canción, cero al finalizar. HEART_EVENT_END_MARGIN=0. Sustituye pruebas anteriores de terminar 8/2 segundos antes y entrada15 s. Curva quintica con aceleración suave; pausas congelan efectos.

## Levitación y controles
- heart-event-timing.js: elevación máxima3.75 sobre posición normal; curva quintica sube desde inicio real de música, máximo en mitad de duración, baja gradualmente hasta suelo al finalizar canción junto a distorsión. Mantiene cámara debajo de árboles. Duración no está fijada manualmente.
- Movimiento horizontal y colisiones existentes conservados. La levitación controla altura sin activar vuelo libre; respeta límites de techo y altura del bote. Sin cabeceo de pasos mientras levita. Sobre agua, levitación >0.15 evita consumo de resistencia y penalización de movimiento; al bajar vuelven reglas normales de agua.
- Carrera bloqueada desde trigger de forest, incluida espera inicial y pausa, hasta fin/stop/fallo de audio; lectura efectiva de Shift usada también en pisadas/balanceo. Vuelo manual bloqueado durante canción/descenso; saltar bloqueado mientras la elevación es positiva. Recoger corazón desactiva vuelo manual previo.
- Cancelar música con P: distorsión y descenso se extinguen suavemente durante8 s. No teletransportar al suelo; carrera se libera al detener pista. Fallo antes de reproducir no provoca levitación ni bloqueo permanente.

## Verificación y pendientes
- Cierre: sintaxis correcta en los63 módulos game.js/src, git diff --check. Durante sesión: lógica de cola de avisos; eventos de audio espera/reproducción/pausa/fin/stop/fallo; bandas de analizador; duración/tiempo restante por reloj de audio; rampas entrada/salida8s y sincronización de iluminación/aterrizaje, cancelación suave. Altura acotada y pico a mitad de canción comprobados con varias duraciones; integración del bloque real de física comprobó gravedad, techos, bote y recuperación del apoyo.
- GPU real en navegador: sky/moon/tree/water cambian color sin errores de compilación; ocho árboles producen ocho colores y conservan el resultado al reordenar instancias. Carga del juego comprobada sin errores de shaders; traslado del cofre ya no bloquea construcción. Colisión de muebles verificada con geometría Three.js: libera huella antigua al reducir y conserva bloqueo del nuevo cuerpo.
- Usuario aprobó visualmente las iteraciones de distorsión; faltan pruebas manuales completas del último estado (canción entera con levitación/entrada/salida finales, interior/bote/agua/muerte, puertas altas, muebles0.9 y variaciones de color en hardware afectado). Las pruebas de lógica y fixtures GPU no acreditan ese recorrido integral ni una mejora FPS.
- Fuentes de color y geometría originales preservadas. .coordination contiene fixtures HTML/Three.js y registros temporales ignorados; no incorporarlos al commit. No dependencias nuevas para el jugador.
- Estado base de misión/amanecer, navegación de ríos, fog-culling300/600 y audio del relevo anterior siguen vigentes. Documentación de entidades, estructura y regla de colores actualizada para evitar referencias activas obsoletas.

## Cierre y continuación
- Servidor tools/serve.cjs PID8328 conservado por instrucción explícita, en http://127.0.0.1:8000/. Verificado HTTP200 y game.js servido coincide con esta copia. NO apagar al cerrar esta sesión.
- Fetch de cierre confirmó que remoto seguía en29ebd80 antes de commit. Push autorizado a origin/main sin force; confirmar recepción. Incluir cambios de esta sesión y capa1 del traslado solicitado; no auxiliares ignorados.
- Liberar bloqueo Codex token f283cd19-6535-44bd-97f4-58cd8b1f5141 tras push. Para continuar, adquirir nueva sesión o reutilizar propia si vigente según protocolo; servidor puede reutilizarse comprobando HTTP. No abrir automáticamente otra sesión después de este cierre.

---
## Relevos anteriores (historial)

# Estado vigente — cierre 2026-10-11: descarte por niebla y alcance de montaña

Codex, rama main. Base actualizada al retomar: 555f5cd9678dbfd868b68037a64a427e530535e8. Usuario pidió cierre completo según comando acordado: documentación, commit/push y apagar servidor. Commit previsto: «Cull fog-hidden world sectors and smooth mountain visibility». Documento escrito antes del commit; verificar resultado con git log y remoto. Este encabezado prevalece sobre parámetros de relevos anteriores.

## Inicio y cierre acordados
- «Retomemos la sesión» autoriza verificar remoto y actualizar por fast-forward seguro, encender/reutilizar servidor comprobando HTTP y proponer trabajo según código/relevo. «Finalicemos/cerremos la sesión» autoriza documentación, commit/push del trabajo realizado, apagado del servidor y liberación de bloqueo, salvo excepción explícita. Procedimiento en docs/PROTOCOL.md; AGENTS.md y enlace de ANTIGRAVITY_HANDOFF.md alineados.
- Al retomar se descargaron fec4dbe/555f5cd con costas, botes, misión y recursos; documentos locales de los comandos combinados con nuevo relevo. Git bloqueó merge habitual de documentos. Tras respaldos y comprobación de 46 archivos contra versiones anterior/remota (solo finales de línea ignorados en textos), se completó avance exclusivo al descendiente remoto sin commit adicional ni stash/reset/force. Copias en .coordination/resume-20261011, ignoradas; preservarlas. HEAD y origin/main coincidieron antes de esta sesión de cambios.
- Se mantienen las reglas de producto del relevo 555f5cd: Graham entrega llave tras corazón, cofre del mapa requiere llave, recibirla inicia 25 s finales de noche. El usuario confirmó que misión y botes funcionan correctamente; no repetir decisiones antiguas de llave deshabilitada.

## Rendimiento y visibilidad vigentes
- Problema informado: tirones/FPS bajos en otros equipos al jugar desde Pages, no carga inicial. Equipo personal funciona bien. No se atribuyó por defecto al hosting ni se acreditó mejora FPS real.
- Nuevo src/world/fog-culling.js: plano de profundidad de cámara calculado para FogExp2 con resto 0.0001 (99.99% de mezcla). Conserva objetos cuya esfera completa cruza límite, actualiza transformaciones/geométricas dinámicas y reaparición. Excluye skyMesh, flare, cámara y materiales sin niebla. Interacciones/física siguen activas; descarte solo visual.
- instance-sectors.js combina frustum y plano de niebla, compacta matrices solo si cambian sectores; también responde a cambio de densidad. Se reutiliza para bloques estáticos: muros, techos fusionados, jambas/dinteles, pisos, losas y tableros. Vegetación conserva detalle, animación y distancia visible.
- Alcance final común WORLD_VISIBILITY_DISTANCE=300, montaña MOUNTAIN_VISIBILITY_DISTANCE=600 en game.js. Densidad común derivada sqrt(-log(0.0001))/300 ≈0.01011618. Cámara permanece 1500; skybox/sol/luna sin este recorte.
- Montaña: niebla se reduce gradualmente por pesos de piedra/nieve y altura smoothstep(3,10,Y), incluyendo camino elevado. terrain-sectors marca hasMountain si algún vértice tiene esos pesos o altura >3; límite conservador de ese sector x2. El resto del terreno sigue niebla común aunque comparta sector.
- Para evitar silueta que desaparece de golpe contra un skybox de color distinto, material del terreno usa alphaHash. Shader disuelve cobertura entre 70% y 100% de su alcance: montaña 420–600, suelo común 210–300, transiciones interpoladas. Mantiene profundidad de superficies sin ordenación transparente; puede apreciarse trama fina durante fundido. No reducir detalle cercano ni regenerar mapas.

## Audio final
- Música ganancia 0.8, reverberación húmeda 0.6 / seca 0.4; cola difusa 8 s y predelay 65 ms conservados.
- Viento base 0.04, ráfagas 0.012 y 0.008 (rango teórico 0.02–0.06), conservando ritmos/filtros y fade inicial 4 s. forest.mpeg con espera 4 s y morning sin retraso adicional, eventos únicos, pausa y P intactos.

## Verificaciones y límites
- Cierre: sintaxis de todos los módulos game.js/src; git diff --check para archivos intervenidos/documentación antes de commit.
- Navegador real: carga sin pageerror; primer descarte con alcance ~151.74 (ANTES de extensión a 300/600) redujo triángulos dibujados 86–90% en spawn/bosque/costa. Datos iniciales: 6,028,445→794,879 / 3,731,848→516,678 / 6,884,033→680,087; calls 713→250 / 425→55 / 984→443. No aplicar esas cifras al alcance final ni presentarlas como ganancia FPS.
- Pruebas de descarte: cielo/materiales sin niebla excluidos, objeto reaparece al acercarse, objetos parcialmente visibles conservados, cambio de geometría y densidad respetado, instancias restauradas. Cámara far 1500.
- Prueba montaña: 56/256 sectores marcados; sector de cumbre visible a 450 con alcance extendido, oculto con alcance normal, oculto a 800; shader sin fallos de compilación. Único 404 identificado: favicon.ico, no asset de juego.
- Fundido GPU con material real en render target: cobertura 2116/1978/1095/151/6/0/0 píxeles a 420/450/510/570/595/600/650; cero fallos de programas/consola. Hooks solo en respuesta HTTP de prueba, no en producción.
- Último audio: sintaxis/diff correctos; evaluación auditiva posterior pendiente. El usuario observó desaparición brusca antes de incorporar fundido; falta su revisión final del resultado. No reejecutar recorrido integral ni prometer FPS estable; medir en equipos afectados con alcance final. Próxima prioridad: comprobar giro/alejamiento de montaña y fluidez final; diagnóstico opcional de tiempos de fotograma/draw calls si persisten tirones.

## Cierre y material pendiente
- Servidor tools/serve.cjs PID 3844 detenido, comando verificado; puerto 8000 sin listener. Próximo inicio usa protocolo de retomar.
- Commit solo game.js, fog-culling.js, instance-sectors.js, terrain-sectors.js, music-events.js y cinco documentos del protocolo/relevo. No incorporar cambios ajenos: capa2.png, Pasto.png, arena.png, Noche.jpeg y eliminación de cinco imágenes antiguas Cielo/1,2..3,2. Conservados localmente.
- Auxiliares, copias, personajes, node_modules y package*.json sin seguimiento permanecen fuera del commit. No se añadieron dependencias ni assets ni se escribió mapa original.
- GitHub Pages mantiene rutas relativas/.nojekyll. Confirmar push remoto; no afirmar publicación terminada sin comprobación. Liberar sesión Codex token 8137ba61-1c48-4185-8739-1d82c2bb8577 después del cierre.

---
## Relevos anteriores y acuerdos (historial)

## Comando de inicio acordado — 2026-10-11

Cuando el usuario diga «retomemos la sesión» o una petición equivalente de retomar el proyecto, ejecutar el inicio completo descrito en docs/PROTOCOL.md: leer el relevo, revisar/adquirir la sesión, verificar la versión remota y hacer pull seguro si corresponde, encender o reutilizar el servidor local y comprobar HTTP, y dar sugerencias concretas según el estado actual del proyecto. Esta instrucción autoriza la sincronización Git de inicio; no autoriza commit ni push. Preservar cambios locales y archivos sin seguimiento; no reset, force ni stash automático. Si la actualización está bloqueada, explicar la causa y continuar con los pasos independientes posibles.

## Comando de cierre acordado — 2026-10-11

Cuando el usuario diga «finalicemos la sesión», «cerremos la sesión» o equivalente, ejecutar el cierre completo de docs/PROTOCOL.md: revisar/verificar trabajo, actualizar HANDOFF.md con novedades y pendientes para el próximo agente, DECISIONS.md con decisiones duraderas y enlace de ANTIGRAVITY_HANDOFF.md si cambia protocolo; crear commit del trabajo realizado y hacer push verificado; apagar el servidor local de esta copia y liberar sesión. El usuario autoriza esas operaciones con el comando de cierre, sin confirmación adicional; una excepción explícita suya prevalece. Preservar cambios ajenos y reportar fallos sin ocultar pendientes.

Registro documental solicitado explícitamente, sin ejecutar ahora los comandos de retomar/cerrar ni operaciones Git. Las modificaciones de protocolo quedan locales hasta un push autorizado. El estado de gameplay del último cierre sigue vigente abajo.

# Estado vigente y relevo — cierre 2026-10-11

Agente Codex, rama main. Base de sesión: b3eeba30cb0a464b6534a7015526988a04318200.
Usuario solicitó terminar, apagar servidor, documentar y hacer push a GitHub. Este encabezado prevalece sobre relevos históricos inferiores. Commit de cierre: «Improve waterfront, boats and quest progression». Documento escrito antes del commit: confirmar resultado con git log y origin/main.

Ampliación del cierre: primer push confirmado en fec4dbe. El usuario autorizó después incluir todos los archivos modificados, incluidos los 13 sprites/texturas pendientes. Segundo commit: «Include updated sprites and textures». Se verificó que las 13 imágenes se decodifican y tienen dimensiones válidas con System.Drawing; no se alteraron sus píxeles ni nombres. El servidor permanece apagado. Confirmar segundo commit/push con git log y origin/main; liberar la sesión adicional al concluir.

## Misión, cielo, audio y presentación
- GRAHAM_BRIDGE_KEY_AVAILABLE=true: Graham entrega la llave tras recibir el Corazón del Bosque. El ciclo alcanza noche y queda detenido hasta recibir la llave; entonces conserva 25 segundos de noche antes del amanecer y libera el ciclo habitual. La entrega del corazón por sí sola ya no activa amanecer. Pausa conserva relojes de misión.
- El cofre del mapa permanece bloqueado hasta recibir esa llave. Graham menciona el regalo en el otro cuarto para orientarse; la entrega es única.
- forest.mpeg reemplaza forest.flac; espera final 4 segundos. Viento reducido sucesivamente 12% y 10%: ganancia 0.061776, ráfagas 0.0185328 y 0.0123552.
- Árboles reducidos 2 unidades (altura 10.54); balanceo de vegetación aumentado 10% sin aumentar frecuencia. Antorcha de mano: intensidad media 8, oscilaciones suaves de amplitud 0.22 y 0.10 a frecuencias angulares 2.4 y 4.1.
- Lens flare del sol con texturas procedurales de círculos y aros de distintos tamaños, crecimiento con distancia al sol, activación angular suavizada y oclusión del addon Three.js. Intensidad final 0.325 (reducción solicitada del 50%). No se agregó una imagen de referencia como dependencia.
- Menú inicial usa imagenes/Mapa/mapa_menu.png?v=6. La pantalla de carga acompaña la carga real; no se agregó una espera estética.
- Cofres abren tapa mediante animación de 0.7 s; puertas abren/cierran en 0.7 s con colisión y posibilidad de invertir movimiento. Cofre bloqueado no anima ni entrega contenido.

## Costa, agua y construcciones
- Fondo profundo marino usa fondo.png con filtrado suave. Río #3282F6 corresponde a WATER_ROCK; #00A2E8 mantiene agua habitual. river-current.js calcula dirección hacia desembocaduras, con continuidad bajo puentes. Shader anima flujo con dos fases fundidas, factor 1.6 y frecuencia final 0.588; es movimiento visual sin fuerza física sobre jugador.
- Botes pueden navegar WATER/BOAT; WATER_ROCK queda prohibido, incluida toda la huella del casco.
- Madera exterior conectada al agua se interpreta como muelle. Tablero de agua de grosor 0.25; contacto terrestre mantiene arena, pasto o tierra hasta el tablero. Tramos sobre agua tienen lecho rebajado a -2.5, incluidos muros del puente; muros junto a tierra mantienen apoyo terrestre.
- Puentes cubiertos se identifican por cubierta estrecha, alargada y agua en ambos flancos. Puente actual: X263..266/Z271..281, 44 celdas, nivelado a accesos exteriores (base aproximada 1.283). Casa de Graham identificada por cubierta en (235,421), 222 celdas, nivelada a accesos (base aproximada 1.24618); techos, muebles y luces se construyen después de nivelar.
- #7D6207 identifica WET_SAND y arena_mojada.png. Comparte condiciones de altura/costa de arena. Arena sumergida mezcla textura mojada y la franja pintada se prolonga al fondo somero contiguo; fondo profundo conserva fondo.png. No se regeneraron mapas; capa1 fue editada por el usuario y se incluye por ser necesaria para sus ubicaciones y nuevos colores.

## Modelos y botes
- Restos de naufragio en marcadores amarillos: tabla rota (239,484), salvavidas (241,484), cuerda (238,485), mástil roto (240,486). prepareMap sustituye el suelo de esos marcadores por arena mojada sin reescribir PNG.
- Zona de Graham: cinco troncos en pirámide 3+2 en (238,422)/(239,422); mesón con hacha en (237,420)/(237,421); tocón (239,419) hundido 0.12. Muebles sólidos usan huellas de geometría.
- Barco naufragado bajo mar, centro del rectángulo X240..245/Z498..508, girado 90 grados sobre eje vertical, enterrado 0.08. Geometría decorativa sin colisiones; giro puede extender su huella más allá del rectángulo inicial.
- Botes detallados: casco abierto facetado, tablones, borda reforzada, costillas y bancos. Sin remos. Proporción ancho/largo 1:2 (parámetros 1.6 x 3.2, altura 0.4, con margen respecto a celdas). Dos marcadores adyacentes producen un único bote; marcadores individuales siguen funcionando.
- Giro inicial 90 grados a la izquierda. Al embarcar, proa sigue suavemente el yaw de la cámara; barrido angular de pasos <=0.04 rad revisa orillas y evita girar a través de ellas. La posición del asiento acompaña giro sin desplazar el centro del casco. Colisión conservadora rectangular considera orientación.
- Vista 0.70 más baja que altura original y asiento 0.70 atrás. Flotación vertical <=0.033, cabeceo 0.016 rad y balanceo lateral 0.028 rad; cámara acompaña vertical sin imponer inclinación a la mirada. Animación se detiene al pausar.

## Verificación, recursos y cierre
- Verificaciones de esta sesión: sintaxis de módulos, git diff --check; geometrías reales con Three.js r160 para cofres, modelos y botes; lógica de puertas, misión, clasificación de superficies/nivelación, corrientes y navegación. Último giro verificado: centro fijo, asiento posterior, giro corto al cruzar ±pi, detención ante orilla. El usuario probó visualmente los cambios y confirmó el modelo de bote; esto no sustituye un recorrido integral.
- Pendiente: recorrido completo de demo en navegador (consola, audio, inventario, diálogos, muerte/reinicio) y revisar shader/flare/costas en distintos dispositivos. Las pruebas de geometría y shader por código no acreditan compilación GPU visual completa.
- Servidor Node tools/serve.cjs PID 9360 detenido por solicitud; puerto 8000 sin listener tras cierre. Reiniciar con node tools/serve.cjs.
- Recursos necesarios incluidos: capa1.png, mapa_menu.png, arena_mojada.png, fondo.png, forest.mpeg; retirar anteriores mapa_menu.jpg y forest.flac conforme reemplazos del usuario.
- El segundo commit incluye por autorización explícita alamo1.png, alamo2.png, araucaria2.png, arbusto1.png, arbusto2.png, weed1.png, weed2.png, weed3.png, Tierra.png, muro.png, piedra.png, rocas.jpg y techo.jpg. Estas 13 imágenes habían quedado fuera del primer push y ahora forman parte del cierre completo.
- .coordination contiene validación temporal ignorada por Git; no incorporar. No se agregaron dependencias para el jugador. AGENTS.md y docs/PROTOCOL.md actualizados para reflejar entrega de llave; enlace histórico actualizado en ANTIGRAVITY_HANDOFF.md.
- Push autorizado a origin/main sin force. Liberar sesión después de confirmar commit/push con tools/session.ps1 finish -Agent Codex -Token d18d652f-7620-44c9-a075-2df5ba31a5d5.

---
## Relevos históricos (no prevalecen sobre estado actual)
# Estado vigente y relevo — cierre 2026-10-10 (segunda sesión)

Agente Codex, rama main. Base: ea8cfb61881674134a38a94074e2ee8fd40162e9.
Usuario solicitó documentación y push. Este encabezado sustituye los parámetros y comportamientos de los relevos históricos inferiores. Commit previsto: «Add quest-driven sky cycle, audio and atmosphere». Se escribe antes del commit: confirmar resultado con git log y origin/main.

## Producto y ciclo vigente
Demo web ligera, sin guardado persistente ni entrega de llave del puente; GRAHAM_BRIDGE_KEY_AVAILABLE sigue false. La activación del ciclo ya NO depende de recibir esa llave: el usuario pidió ligarla al corazón.
- src/systems/quest-sky.js mantiene el atardecer central fijo al iniciar (timer 157.2). Obtener corazón dispara forest con espera de 5 segundos de juego. Cuando comienza realmente el audio, el reloj avanza hasta noche y queda detenido.
- Entregar corazón a Graham coloca el reloj a 25 segundos del amanecer. Al comenzar amanecer se dispara morning una sola vez; desde allí continúa el ciclo automático completo. Si entrega ocurre temprano, primero completa oscurecimiento y después comienza ese tramo de 25 segundos.
- N bloqueada durante introducción; habilitada desde primer amanecer. Conserva transición manual de 3 s pasando por amanecer/atardecer. P o fallo de audio no bloquean misión: tras la espera original se permite avanzar aunque forest haya sido cancelada o fallado.
- Duraciones finales: día 134.6 s, atardecer 45.2 s, noche 44 s, amanecer 18.4 s; total 242.2 s. SKY_CYCLE_TIMING es la fuente común. Pausa detiene relojes.

## Cielo, luz y presentación
- sky-atlas.js: UV con margen interior 1.5 texeles evita línea negra del borde transparente x499 de Amanecer.png; atlas original sin reescritura. Noche usa distintas rotaciones por cara [0,1,2,3,1,3] y espejos en últimas dos, para disimular repetición.
- Sol.png de imagenes/Sprites/luna - sol integrado: arco norte (-Z) a sur (+Z), pasando por altura máxima, sincronizado con recorrido diurno y transiciones. Luna independiente del giro del cielo, opacidad diurna 40% y nocturna 100%; glow/azul calculados separadamente antes de aplicar opacidad.
- Rutas luna actualizadas a carpeta renombrada por usuario. cielo_falso ahora carga cielo_falso.png en lugar del JPG y evita caché con parámetro de versión.
- Niebla densidad 0.02 (antes 0.025): día #C3CBD5, noche #030304, atardecer #D99966, amanecer #BFA0AD. Mezcla por pesos de los cuatro skybox, también al inicio; amanecer rosa y atardecer naranja suaves. Último ajuste de colores verificado por sintaxis, pendiente juicio visual del usuario.
- Flicker global CRT más lento y discreto: 1.2 s ease-in-out, opacidad 0.97–0.98; antorchas conservan fluctuación propia.
- Minimapa con colores naturales de terreno; agua dibujada opaca y paleta de autoría intacta. Flecha dorada con punta clara y cola roja; dirección extraída de quaternion en Euler YXZ, sigue giros completos y pitch sin salto de yaw. Norte hacia arriba.

## Audio vigente
src/systems/music-events.js: AudioContext habilitado por Enter, singleton compartido startup/game; sin dependencias nuevas.
- forest.flac al obtener corazón, espera 5 s; morning.flac al primer amanecer sin retraso adicional. Una sola reproducción de cada pista por partida, sin bucles.
- Música ganancia 0.8. Reverberación: mezcla seca 28% / húmeda 72%, impulso estéreo difuso 8 s, predelay 65 ms, filtro de cola 2400 Hz. Viento y pasos fuera del bus musical.
- P detiene música actual y cancela pistas ya disparadas pendientes; no silencia viento/pasos ni eventos futuros. Cola de reverberación termina naturalmente. Menú pausa muestra P.
- Pausa suspende contexto completo y conserva posición; también congela esperas musicales. Reanudar continúa audio.
- Viento sintetizado: ruido blanco estéreo filtrado, base 0.078, ráfagas LFO 0.07/0.113 Hz con amplitudes 0.0234/0.0156; un solo generador por partida.
- Pisadas al mínimo del balanceo de cámara en suelo, no vuelo/bote/agua/salto/inmovilidad. Onda senoidal 90→38 Hz, envolvente 0.15 s, ganancia caminar 0.0816 / correr 0.1122. Cadencia irregular al caminar; correr menos sincopado y bob rate 16.9 frente a caminar 8. Pausa bloquea nuevos pasos.

## Movimiento, puertas y suelo
- Multiplicadores caminar 1, correr 2, volar 3, volar con Shift 9; conservar física y modificadores existentes de agua/bote.
- door-push.js empuja jugador tanto al abrir como cerrar, calculando huella en coordenadas locales de puerta girada. Prioriza atrás, prueba lado opuesto; si ambos bloqueados revierte movimiento de hoja sin dejar jugador atrapado.
- Puertas (228,423) y (235,423) abren hacia sur mediante doorOverrides en entities.js.
- Cofre corazón (165,308) ground SLAB: losa debajo y modelo ajustado sobre tapa, física coincide con altura. (166,308) y (166,309) conservan losa original. La primera petición inversa de tierra se corrigió; no quedó override de tierra ni se escribió mapa PNG.

## Verificaciones realizadas
- Cierre: sintaxis de 49 módulos game.js/src y git diff --check.
- Durante sesión: navegador local carga sin pageerror, atlas/sol/luna correctos; UV evita borde transparente y genera seis orientaciones nocturnas diferentes. Flecha validada con 40 combinaciones yaw/pitch.
- Puertas: 12 casos de apertura/cierre/ejes/ángulos, empuje alternativo y bloqueo seguro; ambas puertas hacia sur verificadas en mundo. Losa y base del cofre coinciden en tres celdas comprobadas.
- Audio real FLAC: carga/decodificación/reproducción, pausa conserva reloj; viento sin duplicación y render offline sin clipping en prueba previa al último aumento. Secuencia misión comprobada con audio real: atardecer fijo → forest → noche fija → entrega → 25 s → amanecer/morning → libre, sin errores. Pruebas controladas también cubren entrega temprana, P durante espera y pausa.
- Cambios finales de niebla, niveles y reverberación requieren evaluación auditiva/visual del usuario. No se repitió recorrido integral de demo ni medición FPS en hardware real ni despliegue público Pages. Instrumentación de pruebas intercepta HTTP o usa scripts inline; no hooks en producción.

## Git, servidor y relevo
- Incluir módulos intervenidos, documentos, dos FLAC, cielo_falso.png y traslado de sprites luna/sol necesario para rutas actuales. No git add indiscriminado.
- Excluir cambios ajenos: capa2.png, Pasto.png, arena.png, modificación de Noche.jpeg y eliminación de cinco caras antiguas de Cielo; conservarlos localmente. Estas últimas caras ya no se usan; Noche del repositorio sigue siendo atlas compatible con orientación nueva.
- Otros assets/copias/personajes, herramientas históricas, node_modules y package*.json sin seguimiento se conservan fuera del commit. No ejecutarlos sin inspeccionar escrituras.
- Servidor local http://127.0.0.1:8000/ permanece encendido; usuario no pidió apagarlo. tools/serve.cjs sin cambios. GitHub Pages conserva sitio estático/rutas relativas/.nojekyll; push no acredita publicación terminada.
- Protocolo sin cambios; ANTIGRAVITY_HANDOFF.md permanece como historia. Liberar sesión Codex después del push y leer este encabezado en próximo relevo.

---
## Relevos históricos (no prevalecen sobre estado actual)

# Estado vigente y relevo

Fecha: 2026-10-10 (America/Santiago). Agente: Codex. Rama main.
Base de sesión: 5e96cbab575682a8e9fd3fab148de56180c4c858.
Cierre, servidor apagado, documentación y push solicitados explícitamente. Commit previsto: «Add sky cycle atlases, stone slabs and world decoration». Documento escrito antes del commit/push: confirmar resultado mediante git log y origin/main.

## Coordinación
Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md y DECISIONS.md antes de editar. Mantener sesión entre ajustes; actualizar documentos al cierre y usar Git solo con autorización. Protocolo sin cambios, ANTIGRAVITY_HANDOFF.md sigue como historial.
Demo ligera web, sin guardado persistente; Graham busca llave y no la entrega. Ciclo automático apagado con GRAHAM_BRIDGE_KEY_AVAILABLE=false.

## Cambios de esta sesión
- Cofre de mapa movido de (229,429) a (231,425), orientación final 90°. entities.js conserva sourcePosition: prepareMap recibe entidades y sustituye marcadores en datos/suelo/colisión/minimapa sin editar ese píxel de capa1. M sigue requiriendo el mapa. Si se cambia el marcador en el PNG, actualizar sourcePosition para evitar validación fallida.
- Cajas: siete en tres niveles, centro entre (230,429),(231,429),(230,430),(231,430); rotación 22.5°. Estante cinco niveles en (231,426), altura 2.4, girado -90° y offset X=0.65 junto al muro.
- Cajonera dos niveles (227,425–426), altura 1.4, giro 90°, offset X=-0.45. Pirámide de tres barriles acostados (227–228,428), giro 90°, offset X=-1.39, a 1 cm del muro. Colisiones por modelo; sin abrir cajones ni escalar muebles.
- Vegetación de capa1 redistribuida solo entre #008000/#7F7F7F/#3C2F7F/#22B14C, sin modificar otros píxeles. Cada tipo separado incluso diagonalmente: árboles exactos 7679→7557, arbustos 2293→2293, hierba 5458→5280. Desplazamiento local máximo ~11.31 celdas, reducción de densidad para abrir espacio. Copia anterior en .coordination/capa1-before-vegetation-20261010.png. Otros colores cercanos que decodificador aproxima no incluidos en esos conteos exactos.
- #7092BE/OTHER usa losa.png y bloques instanciados de celda completa: altura final SLAB_HEIGHT=0.4 en game.js. slabTops ajusta altura al caminar; 203 bloques en mapa probado. Material mezclado con terreno bajo ellos, base por altura central de celda. Revisar encuentro con terreno irregular si se amplían esas áreas.
- Agua2/3 igualadas al color de Agua1 editada por usuario. Ajustes posteriores azul/cielo conservan patrones y tamaño 64x64. Opacidad final 0.4752 (0.594 *0.8), saturación en shader 0.7225 (dos reducciones consecutivas 15%). Animación/ondas conservadas. Niebla día #8193AA, densidad 0.025 sin cambios.

## Cielo vigente (sustituye ajustes de caras individuales)
- Nuevo src/world/sky-atlas.js lee despliegue 4x3, cubo 1400 por lado. Orden de caras +X,-X,+Y,-Y,+Z,-Z: celdas (3,1),(1,1),(2,0),(2,2),(2,1),(0,1), coordenadas desde cero. UV comparte imagen sin recortes ni regenerar atlas diurnos.
- Assets activos: imagenes/Texturas/Cielo/Ciclo/Dia.png, Amanecer.png, Atardecer.png (500x375); Noche.jpeg convertido a atlas 1280x960 con seis caras 320x320, repitiendo textura de estrellas anterior. Original nocturno guardado en .coordination/Noche-before-atlas.jpeg. No es panorámica nueva con estrellas únicas por cara.
- Cuatro cubos rotan sincronizados, horizonte centrado en ojos y luna independiente. Día/noche tienen seis materiales; amanecer/atardecer uno cada uno. Alfa acumulada según pesos para evitar oscurecer artificialmente el fundido. Los colores del atlas se usan directamente: se retiró filtro de saturación anterior del cielo al reemplazar el skybox.
- src/world/sky-cycle.js: ciclo preparado de 242 s = día139, atardecer18, noche73, amanecer12. No automático en demo; mantiene activación futura al recibir llave de Graham.
- N manual: 3 segundos noche→amanecer→día / día→atardecer→noche, fundidos smoothstep, breve tramo central; segunda pulsación parte de pesos actuales sin salto inicial. Pausa detiene avance y rotación. Luces/niebla/intensidad antorchas siguen dayTransition = peso día +0.5*(amanecer+atardecer); colores cálidos de niebla para esos estados aún no configurados.
- Hubo varias pruebas de color de cinco imágenes individuales y cambios de orientación; se conservan en Cielo/ con nombres fila,columna, pero ya no se usan por el juego. Sustituir futuros colores editando los atlas activos. Antiguas rutas Cielo_dia y Cielo.jpeg retiradas al reorganizar carpeta por usuario.

## Verificaciones
- Sintaxis de game.js y todos los módulos src al cierre; git diff --check.
- Puppeteer durante sesión: carga sin pageerror, cofres sin duplicación/mapa conservado, posiciones y colisiones de cajas/cajonera/barriles, 203 losas con altura física igual a tapa, separación de vegetación (cero pares iguales adyacentes), texturas agua/cielo conservan tamaños.
- Pruebas de ciclo: al centro de manual se ve amanecer/atardecer y al final día/noche; inversión con delta0 mantiene pesos. Estados automáticos muestreados en 0,148,180,236 s; cuatro atlas cargan, nocturno seis caras y cubo correcto sin errores.
- No repetir recorrido integral demo ni prometer mejora FPS por estos cambios. Pendiente revisión visual del usuario de uniones del nuevo atlas, ciclos y decoración, y medición en hardware real. No se comprobó despliegue público Pages.
- Servidor local tools/serve.cjs detenido por solicitud del usuario; puerto 8000 sin escucha. Próximo inicio: node tools/serve.cjs.

## Git y material local
- Commit solo cambios de la sesión, mapa capa1 intervenido, agua/losa, atlas activos y caras individuales trabajadas, nuevas geometrías/controladores y documentación. No incluir indiscriminadamente archivos auxiliares.
- Cambios ajenos detectados y conservados fuera del commit: capa2.png, Pasto.png, arena.png. También sprites/personajes nuevos y copias de imágenes sin seguimiento; no fueron encargados ni editados por Codex en esta sesión.
- Scripts históricos, node_modules, package.json/lock, temporales y .coordination permanecen locales; no borrarlos ni ejecutarlos a ciegas.
- Estado base anterior y sus pendientes se conserva abajo como historial; las coordenadas y parámetros de este encabezado prevalecen.

## Relevo anterior (historial del cierre 2026-10-09)

Fecha: 2026-10-09 (America/Santiago). Agente: Codex. Rama: main.
Base: 06a8ec8d22e5c19cc30b85e3f8f399753df1a44d.
Usuario solicitó cierre, documentación y carga a GitHub. Commit previsto: «Optimize world rendering and add furniture, inventory and demo interactions». Este documento se escribe antes del commit y push; confirmar resultado con git log y origin/main.

## Coordinación y producto
- Leer AGENTS.md, docs/PROTOCOL.md, HANDOFF.md y DECISIONS.md. Adquirir sesión antes de editar; conservarla entre ajustes. Documentación al cierre, Git solo con autorización explícita.
- Juego web JavaScript/Three.js 0.160, sin dependencias nuevas, backend ni guardado de progreso. Demo: encontrar corazón y entregarlo a Graham; río limita acceso, Graham sigue buscando llave.
- ANTIGRAVITY_HANDOFF.md conserva historia. Protocolo sin cambios en esta sesión.

## Resultado de la sesión completa
- Inicio: pantalla de Enter antes de cargar recursos; src/startup.js importa game.js después del gesto y muestra errores de carga. Pausa bloquea acciones y limpia entradas; continuar solo con clic izquierdo.
- Botes: casco hueco (ancho 1.6, pared 0.16, cavidad 80%), centro Y=0.09, cubierta 0.29. Navegación comprueba toda huella y movimiento por pasos; no atraviesa tierra/obstáculos ni permite vuelo al navegar.
- Cielos de día/noche giran juntos; luna fija. N conserva transición manual. Automático preparado para entrega futura de llave: GRAHAM_BRIDGE_KEY_AVAILABLE=false impide entrega/ciclo en demo. Activarlo habilita entrega tras corazón y ciclo automático; no desbloqueo por fecha.
- Vegetación: solo árboles colisionan; arbustos escala 0.8, hierba altura +10%. Viento GPU suave con fases/ritmos variados, arbustos/hierba velocidad +20%; se pausa con juego.
- Niebla exponencial suave día/noche. Antorchas exteriores no iluminan ni muestran llama de día; soporte participa de niebla.
- Agua: tinte 0xb8d9ff, opacidad 0.594, ondas visuales GPU sin alterar física. Fondo del mar arena, río/lago WATER_ROCK piedras. Plano de respaldo Y=-2.7 elimina solapamiento; filtrado de roca con mipmaps/anisotropía.
- Cofres facetados cerrados/abiertos: E entrega una vez y sustituye modelo. Exterior sobre tierra, interior sobre madera. Cofre corazón (165,308) girado 180° (usuario lo indicó como 165,309; se identificó el existente sin moverlo).
- Cofre (229,429) entrega mapa; M deshabilitado hasta posesión. Inventario seis casillas 2x3, texto blanco: corazón arriba primero; abajo antorcha, mapa, llave. Llave y contador ocultos cuando cantidad cero.
- Puertas simples abren al lado opuesto; colisiones según huella visible de modelos. Si cierre alcanza jugador lo desplaza hacia atrás a lugar libre o reabre si no hay espacio seguro.

## Optimización sin reducir detalle ni distancia
- terrain-sectors.js divide terreno en 256 sectores, comparte atributos y conserva 8,355,872 triángulos; descarta por frustum, no LOD ni oclusión real detrás de paredes.
- instance-sectors.js compacta instancias de vegetación por sectores visibles en 11 mallas; actualiza solo si cambia visibilidad, conserva viento y todos los elementos.
- roof-blocks.js fusiona cubos contiguos equivalentes: 151,296 bloques → 2,265 piezas; misma cobertura y silueta, menos caras internas.
- terrain-height.js consulta alturas de vértices existentes con interpolación; mantiene suelo físico/render compartido. Reutilización de vectores, resultados raycaster y candidatos/selección de luces reduce asignaciones.
- Benchmarks headless no acreditan FPS estables en hardware del jugador; requiere medir recorrido real. No afirmar ganancia global garantizada.

## Muebles y coordenadas vigentes
Configurados en src/content/entities.js; offsets en unidades del mundo, celdas multiplicadas por UNIT_SIZE=2. Geometrías fusionadas en src/world/*-geometry.js, sólidos por huella de modelo, sin interacción de sentarse/abrir cajones.
- Graham: (235,421).
- Cama: (237,427–428), girada 180°, cabecera hacia 428. Mesa auxiliar (238,428), giro 180°, offset Z=0.525.
- Tres barriles de pie en X235, Z419–420: offsets Z=-0.5 / 0.75 / 0.
- Librero tres niveles/libros (228,420–421), giro 90°, offset X=-0.625.
- Mesa (231–232,422), sillas (230,422)/(233,422), orientadas hacia mesa, offsets X=+0.65/-0.65.
- Ropero dos puertas (236–237,424), offset Z=-0.45.
- Escritorio/cajonera (234–235,428), offset Z=0.35; silla (234,427), offset Z=1.3 (5 cm de separación).
- Ropero, librero y mesa auxiliar a 5 cm de murallas verificadas. Mapas no se regeneraron.
- Exportaciones solicitadas: exports/cofres/cofre_cerrado.glb, cofre_abierto.glb y exports/cama/cama.glb; texturas incorporadas. Exportaciones anteriores no reflejan colocación posterior en escena. Otros muebles aún sin GLB.

## Verificaciones y límites
- Sintaxis de todos los módulos game.js/src y git diff --check al cierre.
- Puppeteer local: carga sin pageerror; muebles sobre piso, posiciones/colisiones; orden inventario y llave visible con 1, oculta con 0. Pruebas instrumentan respuestas HTTP, sin hooks en producción.
- Durante sesión: botes/embarque, cofres entrega/apertura, mapa/M, pausa, 30 puertas/cierre seguro, variante futura de llave solo en interceptación de prueba, viento/ondas/shaders, vegetación por frustum y rotación de cielos.
- Optimización: 1,200 consultas altura diferencia máxima 0.0000024855, tiempo muestra 2.4 → 0.3 ms; luces diferencia 1.78e-15; cobertura de techo idéntica, cambios raster menores a 0.03% en dos capturas.
- Últimos ajustes de sillas comprobados por geometría/configuración; falta revisión visual final del usuario del amueblado completo. Recorrido integral de demo y despliegue público no reprobados al cierre.
- Scripts/capturas/benchmarks locales ignorados en .coordination/. Herramientas históricas, node_modules, package.json/lock y otros auxiliares sin seguimiento conservados y excluidos del commit.
- capa1.png fue modificada por el usuario durante la sesión; se incluye su actualización en la carga completa solicitada, sin regenerarla.
- GitHub Pages mantiene .nojekyll y rutas relativas; no requiere compilación. Configuración/despliegue se verifica en GitHub, no inferir éxito de publicación por push.
- Servidor local node tools/serve.cjs en http://127.0.0.1:8000/; no detenido por cierre, continuidad depende del proceso.
