# Estado vigente y relevo

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
