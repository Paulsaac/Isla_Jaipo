# Decisiones del proyecto

## 2026-10-08 — Cierre y estado final solicitado
- Sesión de trabajo abarca varios pedidos: documentación y relevo únicamente al cierre explícito. Git requiere autorización; este cierre autoriza subir los cambios de Codex a origin/main.
- Graham en celda (231,422), posición explícita independiente de antorchas, pies sobre suelo y relleno cálido según iluminación cercana.
- Estado final de luces: interiores base 43.2/alcance 24; exteriores base 14.4/alcance 19.2. Exteriores se activan gradualmente entre 44 y 20 unidades, con suavizado de 0.85 s; 12 luces reutilizadas como máximo.
- Antorchas exteriores tienen matriz propia para preservar techos de la segunda capa y excluir suelo de madera.
- Agua animada con tres texturas existentes, opacidad 0.66, fondo litoral y arena continuos. Jugador sigue fondo somero antes de flotar; reglas de resistencia y ahogamiento no cambian.
- Montaña conserva altura previa aproximada (máximo 375 en mapa actual) con crecimiento acumulativo desde bordes de bandas, en vez de multiplicar distancia al mar por color. Edificio debe estar en la cumbre y camino debe llegar a puerta: plataforma elevada, relieve subyacente continuo y corredores diagonales transitable sobre DIRT. Conservar cerradura existente.
- Servidor local reproducible sin dependencias con node tools/serve.cjs; procesos locales no forman parte del repositorio ni su continuidad está garantizada al cerrar la app.

## 2026-10-08 — Corrección de bordes y suelo exterior
- Conservar la identidad EXTERNAL_TORCH durante lectura del mapa para que no se infiera madera por cercanía a interiores. Sus parámetros visuales/de luz siguen compartidos.
- Reemplaza decisión anterior de omitir terreno bajo madera: mantener malla continua, a Y=0.98 debajo del piso Y=1, con transición suave de media celda al exterior. Compartir alturas con física para evitar cortes visibles y suelo atravesando madera.

## 2026-10-08 — Ajuste solicitado de antorchas
- #50727A identifica antorchas exteriores en cualquiera de las capas. Comparten sprite y parámetros de iluminación con las de muro.
- Aumentar intensidad y alcance del mundo un 20% (base 14.4 y radio 19.2), incluyendo fluctuación. Mantener hasta 12 luces cercanas.
- Jugador posee antorcha desde inicio en inventario, con torch1.png de los muros. Comienza apagada y se alterna con T; conservar su potencia anterior.

## 2026-10-08 — Superficies y antorchas
- Compartir cobertura de madera entre render y consulta de altura; omitir terreno bajo ella para evitar penetración y solapamiento.
- Alinear los pies visibles de Graham con el suelo, compensando transparencia del sprite original.
- Cada marcador de antorcha tiene sprite; si se superpone a un árbol, reemplaza su vegetación y colisión. Preservar mapas originales.
- Reutilizar hasta 12 luces cercanas al jugador, seleccionadas cada 0.2 segundos, en vez de iluminar solo las primeras antorchas por orden del mapa. Mantener ligero el render web.

## 2026-10-08 — Plataforma y alcance (confirmado por el usuario)
- Mantener un juego web ligero usando JavaScript y recursos del equipo del jugador. Three.js es la base actual. Python puede preparar recursos en desarrollo; no es requisito para el jugador.
- La demo está cerca de terminar y cubre la zona inicial y la búsqueda/entrega del Corazón del Bosque. El río es el límite natural del área disponible.
- Graham indica que busca la llave. La versión completa, prevista para meses después, actualiza su diálogo y entrega la llave para acceder al resto. El desbloqueo depende de la publicación de contenido, no del reloj.
- No añadir guardado persistente de progreso a la demo por ahora. La búsqueda se repite al entrar. Las preferencias y el reinicio tras muerte son temas separados.

## 2026-10-08 — Coordinación
- Una herramienta editora por copia del proyecto, con bloqueo cooperativo local y relevo escrito.
- AGENTS.md contiene reglas; docs/PROTOCOL.md el procedimiento; HANDOFF.md el estado vigente; este archivo las decisiones duraderas.
- Preservar ANTIGRAVITY_HANDOFF.md como historial y punto de entrada para Antigravity.
- No cambiar gameplay, mapas, dependencias ni publicar en GitHub durante la creación del protocolo.

## 2026-10-08 — Primera separación de código
- Usar módulos ES nativos del navegador sin empaquetador ni dependencias nuevas.
- Mantener game.js como entrada y separar únicamente parámetros, paleta y diálogos en src/. Conservar valores, textos, rutas de assets y lógica.
- Las herramientas históricas permanecen en sus rutas hasta identificar sus dependencias. La configuración CommonJS de las herramientas Node no se cambia.

## 2026-10-08 — Lectura de mapas
- Separar carga/lectura RGBA y decodificación de colores de la construcción Three.js. Mantener aproximación de colores, transparencia y reglas de capa 2 vigentes.
- Rechazar imágenes de tamaño cero y capas de dimensiones distintas antes de construir la escena. No imponer colores exactos ni restringir elementos de capa 2 en esta extracción.
- Mostrar errores de carga con el nombre real de la capa y textContent; detalles técnicos en consola.

## 2026-10-08 — Preparación de datos del mapa
- Extraer prepareMap a src/world/map-data.js conservando conteos, variantes de vegetación, colisiones, spawn y minimapa. No cambiar geometrías ni físicas.
- Mantener mutables las matrices usadas por gameplay; las puertas y cofres actualizan sus celdas durante la partida. La comprobación de spawn seguro sigue en el constructor de escena.

## 2026-10-08 — Interfaz del minimapa
- Encapsular elementos DOM y visibilidad en createMinimap. game.js conserva teclado y envía coordenadas/dimensiones; no conoce el indicador ni su contenedor.
- Mantener estilos, tecla M, fórmula de posición y actualización solo cuando está visible. No cambiar estados de pausa/inventario/diálogo en esta extracción.

## 2026-10-08 — Presentación de menús
- Encapsular DOM de pausa, inventario, diálogo y contador de llaves en createMenus. Reanudar mediante callback, sin importar Three.js desde la interfaz.
- Mantener los estados, teclas, reglas de interacción y avance del diálogo en game.js. No introducir una máquina de estados ni corregir comportamiento ajeno a esta extracción.

## 2026-10-08 — HUD
- Encapsular DOM de interacción, resistencia y muerte. Preservar textos, colores y actualización de barra solo cuando está visible.
- Mantener cálculo de resistencia y flujo de muerte/reinicio en game.js. Las pruebas pueden instrumentar una página descartable; no añadir hooks de prueba al juego distribuido.

## 2026-10-08 — Teclado
- Separar traducción de teclas a acciones con bindKeyboard; conservar teclas, repetición de eventos, secuencia de vuelo y comportamiento de keyup.
- Las condiciones y mutaciones de gameplay permanecen en game.js mediante callbacks. interact devuelve true cuando consume avance de diálogo, conservando el retorno temprano anterior.
- No introducir cambios de foco, preventDefault o restricciones nuevas durante esta extracción.

## 2026-10-08 — Consultas de terreno y colisiones
- Separar ruido/altura en terrain-height.js y consulta de obstáculos en player/collisions.js sin cambiar fórmulas, radios, bordes ni condiciones del bote.
- Usar parámetros explícitos con matrices actuales; no copiar ni cachear colisiones que cambian al abrir puertas o retirar cofres. game.js conserva wrappers y movimiento/físicas.

## 2026-10-08 — Puertas
- Separar apertura/cierre y actualización de colisiones en systems/doors.js; mantener autorización y consumo de llave en game.js.
- Corregir fallo preexistente confirmado en navegador: material de puertas es un array; material.color.setHex fallaba después de consumir la llave. unlockDoor aplica color a todos los materiales y se usa también para la hoja vecina. No cambiar reglas de llave ni de adyacencia.

## 2026-10-08 — Entidades y Corazón del Bosque
- Usar coordenadas enteras del mapa X=columna, Z=fila desde esquina superior izquierda, con conversión al mundo por UNIT_SIZE. Configurar contenido de cofres sin modificar imágenes.
- Usar imagenes/Sprites/corazon.png en inventario. Cofre asignado entrega corazón en lugar de llave; cofres restantes conservan sus llaves.
- Entrega al terminar el diálogo con Graham; después agradece y sigue buscando la llave. Sin llave de puente ni guardado persistente.
- El usuario confirmó el cofre 4: X=165, Z=308 (mundo 330,616). entities.js asigna forest-heart-chest a esa celda; otros cinco cofres mantienen llaves.

## 2026-10-08 — Segundo cierre: montaña, interacción y preparación de Pages
- Sustituye escala de montaña anterior fija: ajustar altura al trazado para pendientes naturales, aumento posterior del 15%, cumbre actual ~76. Conservar meseta blanca y camino al modificar solo banda marrón a rampa aproximadamente lineal.
- Mantener terreno y física compartidos; texturas mezcladas en una malla. WATER_ROCK #3282F6 distingue río/lago; mar y río/lago usan rocas.jpg en fondo. Agua a Y=-0.05, botes a Y=0.05 y ojos del jugador sobre cubierta.
- Sustituye posesión inicial de antorcha: Graham la entrega apagada al completar introducción; T requiere posesión. Sin persistencia entre recargas.
- Muros 2.662, hojas de puerta 2.0 y márgenes 0.2; doble puerta sin pilar central. Techos usan cota común por cubierta; vegetación conserva tamaño independiente de muros. Anclaje de antorchas prioriza muro y respeta altura de apoyo.
- N cambia día/noche manualmente en 3 segundos; automático sigue pausado con duraciones previas conservadas. Rotar solo cubo nocturno cada 20 minutos, dejando luna fija.
- C única tecla de agacharse. Inventario antorcha primero, corazón segundo; filtros de vegetación en materiales y reducción de relleno de Graham, sin editar sprites.
- Cierre autoriza commit/push del proyecto vigente, incluidos mapa actualizado por el usuario y traslado de techo en capa2 solicitado. Excluir herramientas locales históricas y dependencias de desarrollo sin seguimiento.
- Preparar GitHub Pages como sitio estático desde main/raíz con .nojekyll y rutas relativas sensibles a mayúsculas; documentar activación pendiente. No introducir empaquetador ni servicios.
