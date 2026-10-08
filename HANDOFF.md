# Estado vigente y relevo

Fecha: 2026-10-08 (America/Santiago). Último agente: Codex.
Sesión finiquitada por pedido del usuario. Commit y push a origin/main expresamente autorizados. El commit de este cierre se identifica por «Polish mountain, doors, lighting and demo interactions; prepare Pages». Confirmar el resultado con git log y origin/main; el documento se escribe antes del commit/push y no sustituye su comprobación.
Rama: main. Base de esta sesión: 34b79198c21a8df0df8b9b423430dac6ac62341f. Liberar el bloqueo cooperativo al finalizar el cierre.

## Producto y coordinación
- Juego web ligero JavaScript/Three.js 0.160.0, HTML y CSS; sin motores adicionales, bases de datos ni guardado persistente.
- Demo: explorar, recoger Corazón del Bosque del cofre (165,308) y entregarlo a Graham. Graham sigue buscando la llave del puente; no la entrega ni hay desbloqueo por fecha.
- Mantener la sesión entre ajustes. Documentación solo al cierre o cuando el usuario pide expresamente modificar un documento. Git requiere autorización explícita. Leer AGENTS.md, docs/PROTOCOL.md, este archivo y DECISIONS.md antes de editar y adquirir sesión mediante tools/session.ps1.
- ANTIGRAVITY_HANDOFF.md conserva historia y enlace al protocolo; no duplicar allí el estado vigente.

## Resultado de esta sesión
- Montaña: meseta blanca suavizada y transitable (caminar/saltar). Banda marrón #B97A57 forma rampa aproximadamente lineal entre pie y borde de nieve. Camino DIRT tiene perfil por distancia recorrida, entrada/llegada redondeadas y proyección sobre segmentos compartida por malla y física. Altura ajustada a pendiente natural y luego aumentada 15%; cumbre actual ~75.995, depende del mapa y del trazado.
- Nuevos módulos: mountain-path.js, mountain-slope.js, roof-height.js y door-opening.js, todos en src/world/. Terrain-height recibe perfil opcional de camino. Nieve, camino y casa conservaron sus alturas al aplicar la última ladera marrón.
- Terreno: una malla/material de mezcla para pasto, tierra, arena, piedra, roca y nieve. Pesos interpolados de celdas vecinas; se eliminaron copias completas de geometría por material. Aún hay ~4.18 millones de vértices: optimización pendiente.
- Nuevo color de mapa #3282F6 (50,130,246), WATER_ROCK, identifica río/lago. Los dos tipos de agua y BOAT usan fondo de rocas.jpg, mezcla suave y superficie Agua1/2/3 con opacidad 0.66, Y=-0.05. Se conservaron pendiente litoral, flotación, resistencia y reglas de navegación. No existe roca.png en los assets; usuario autorizó rocas.jpg.
- Botes: flotan con centro Y=0.05 y cubierta Y=0.25; jugador de pie con ojos Y=1.85. El bote permanece visible, sigue al jugador y vuelve a estar disponible para interacción al desembarcar. Ya no usa fondo submarino como apoyo.
- Muros: WALL_HEIGHT=2.662. Puertas: DOOR_HEIGHT=2.0, márgenes laterales 0.2, dintel 0.662. Puertas simples ancho 1.6; hojas dobles ancho 1.8 sin pilar central. Marcos fijos independientes de hojas, apertura/llaves conservadas. Colisiones respetan márgenes y altura de paso. Vegetación permanece en escala anterior, independiente de altura de muros.
- Techos continuos usan cota común basada en construcción para evitar irregularidades del terreno/agua. Casa de montaña actual X=148..157, Z=124..132; puerta (148,128). Se trasladaron solo 132 píxeles de techo en capa2, 26 celdas en X: cubierta X=147..158, Z=123..133. No se alteraron píxeles fuera del origen/destino. Copia previa en .coordination/.
- Antorchas del mundo: montaje a 1.76 sobre apoyo; priorizar BUILDING sobre nieve/montaña y dejar 0.04 junto a cara del muro. Sprite y luz comparten posición. Se preservaron parámetros interiores 43.2/24, exteriores 14.4/19.2, hasta 12 luces reutilizadas con desvanecimiento exterior entre 44 y 20 unidades.
- Graham permanece en (231,422); relleno cálido reducido 50%: máximo 0.225 y factor de iluminación local 0.06. Pinos y hierba alta tienen filtro de material #B0BED4; assets originales intactos.
- Antorcha de mano ya no se posee al inicio: se entrega apagada al completar diálogo inicial de Graham. T requiere posesión; icono oculto hasta entrega. Completar introducción antes de diálogo de entrega del corazón si se encontró sin hablar primero. Cada nueva conversación empieza en primera línea; no duplica posesión.
- Inventario: antorcha primer casillero, 72x72 y giro 45°; corazón segundo casillero, 64 px de alto. Pausa: acciones a izquierda y teclas a derecha. C es la única tecla de agacharse; Ctrl ya no activa ni cancela esa acción.
- Cielo nocturno gira solo su cubo a una vuelta cada 20 minutos de juego; luna no gira. N alterna día/noche con función manual independiente de 3 s, reversible a mitad del cambio, sin repetición de tecla ni acción estando pausado. Ciclo automático de 242 s permanece comentado; transiciones originales 12 s de amanecer/25 s de anochecer conservadas.
- GitHub Pages preparado con .nojekyll y docs/PUBLISHING.md. Corregidas cinco rutas cielo_dia → Cielo_dia para sistemas sensibles a mayúsculas. Juego mantiene rutas relativas y no necesita compilación. La API pública informó has_pages:false antes del push: falta activar Pages desde main, /(root). No afirmar despliegue público realizado.

## Verificaciones
- 25 módulos de game.js/src: sintaxis con node --input-type=module --check. git diff --check sin errores de formato; avisos habituales de conversión LF/CRLF.
- Puppeteer local preexistente: cargas sin pageerror; instrumentación únicamente en respuestas HTTP de pruebas, sin hooks distribuidos.
- Prueba final sin instrumentación bajo /Isla_Jaipo/, servidor temporal con nombres exactos: pantalla de carga terminada, menú inicial visible, antorcha oculta y recursos locales sin faltantes. No es un despliegue real en GitHub Pages.
- Montaña: perfil sintético lineal comprobado; en mapa real última ladera cambió solo 23.878 celdas MOUNTAIN, cero cambios de altura en otros tipos, cumbre ~75.995. En ajustes anteriores se comprobó conexión del camino y movimiento/salto en nieve; no se recorrió íntegramente el mapa actual con WASD.
- Agua #3282F6: 11.118 celdas reconocidas, ninguna sólida, profundidad -0.5..-2.5; pesos de texturas suman 1 y existen vértices de mezcla.
- Puertas: 30 revisadas, paso central libre al abrir, márgenes sólidos, marcos permanecen fijos al abrir/cerrar. Puertas dobles con abertura continua. Último aumento de muros comprobado por constantes/sintaxis, no recorrido integral posterior.
- Graham/antorcha: antes de introducción sin posesión/luz/icono, durante diálogo sin entrega anticipada, al completar icono visible y antorcha apagada; T funciona después; misión del corazón llega a delivered sin dar llave.
- N: amanecer/anochecer, inversión a mitad, repetición ignorada y bloqueo en pausa comprobados. Rotación nocturna y luna fija comprobadas. Inventario verificado visualmente.
- Casa del monte: techo anterior 0 celdas, nuevo 132 y todas las 90 celdas del recinto cubiertas. Seis antorchas a 0.04 del muro, altura coincidente. Diferencia de capa2: 264 píxeles (origen+destino), cero diferencias fuera de esas regiones.
- Botes: ambos con cubierta sobre agua, ojos a 1.85 al navegar, bote visible con error de seguimiento 0, y ambos visibles a Y=0.05 después de desembarcar.

## Pendientes y límites
- Activar GitHub Pages en Settings → Pages y verificar URL pública; ver docs/PUBLISHING.md. Fuente Google Fonts y Three.js desde unpkg requieren conexión.
- Hacer recorrido completo actual de demo y montaña: ida/vuelta, interiores, puertas con llave, interrupciones de diálogo, muerte/reinicio y dispositivos modestos. No se revisó toda la isla ni se certifica rendimiento.
- Próxima prioridad sugerida: limpiar teclas al pausar/perder foco y restringir acciones durante menús; después medir coste de terreno y valorar detalle a distancia.
- Revisar coherencia visual del filtro de vegetación al alternar al día: el filtro es estático. Separar configuración del ciclo de game.js si se amplía.
- La plataforma de cumbre aún infiere un conjunto de construcciones mediante caja común; varias casas separadas requerirían plataformas independientes. Al editar mapas, mantener ambas capas alineadas.
- El reinicio tras muerte conserva inventario/cofres/progreso de sesión; recargar comienza de cero. No se cambió esa regla.

## Archivos locales y envío
- El cierre incluye la capa1 actual editada por el usuario, porque estas mejoras y la publicación se basan en ella; no fue regenerada por Codex. Capa2 incluye exclusivamente el traslado de cubierta solicitado. Se documenta autoría para no confundir mapas del usuario con cambios de código.
- Numerosos patch*.py, test*.js, inspectores, package.json/package-lock.json, node_modules y PNG temporales siguen locales y sin seguimiento. No se borran ni se incluyen indiscriminadamente. No se instaló ninguna dependencia nueva.
- .coordination/ contiene bloqueo cooperativo, copias y capturas ignoradas. No publicar ni incorporar.
- Servidor local: node tools/serve.cjs en http://127.0.0.1:8000/; no se detuvo al cerrar. Su continuidad depende del proceso local, no de Git.
