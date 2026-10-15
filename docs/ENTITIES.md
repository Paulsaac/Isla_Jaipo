# Coordenadas y entidades

Abrir `http://127.0.0.1:8000/tools/world-map.html` para seleccionar una celda o uno de los seis cofres. La herramienta solo lee el mapa.

- Coordenadas de mapa: X = columna, Z = fila, ambas enteras, comenzando en 0 en la esquina superior izquierda. Z aumenta hacia abajo en la imagen.
- Mundo: X y Z son las coordenadas de mapa multiplicadas por UNIT_SIZE (actualmente 2). Y es la altura y se calcula con el terreno; no se escribe en la configuración de cofres.
- worldToGrid usa la celda centrada en cada posición, como las colisiones existentes. No confundir estas coordenadas con las coordenadas de pantalla ni con el muestreo de altura.

## Configuración
`src/content/entities.js` define objetos específicos sobre celdas que ya existen en la imagen. No genera nuevos cofres ni cambia los mapas. Configuración del corazón confirmada por el usuario:

```js
{ id: 'forest-heart-chest', type: 'CHEST', kind: 'DRY_VINE', position: { x: 94, z: 279 }, item: 'forest-heart', ground: 'DIRT_STONE', rotationY: Math.PI }
```

El registro valida límites, identificadores y coincidencia con el tipo de celda. Solo los cofres consultan actualmente este registro; soportar otro objeto o una zona funcional requiere conectar su comportamiento de forma explícita.

Los cofres sin configuración continúan dando una llave. El santuario forest-heart entrega el corazón al completar el forcejeo, una sola vez por sesión. La segunda conversación manual con Graham habilita el cofre del mapa, después de completar la introducción y recibir la antorcha. Al completar los diálogos de entrega del corazón, este desaparece del inventario y Graham entrega la llave del puente; la entrega conserva el tramo final de noche previo al amanecer.

No hay guardado persistente. Recargar reinicia la misión. Reiniciar después de morir conserva el progreso de sesión y los cofres retirados, igual que el comportamiento previo del inventario.

## Graham y antorcha del jugador
Para gestionar NPC, conversaciones, condiciones de misión y relevo, leer [NPCS.md](NPCS.md). Graham se crea explícitamente en game.js; no se instancia mediante el registro de cofres.

Graham está configurado en (235,421). Al completar su diálogo inicial entrega una única antorcha apagada. Antes de esa entrega no aparece en el inventario y T no la activa. El icono ocupa el primer casillero, mide 72x72 píxeles y gira 45 grados a la derecha; el corazón ocupa el segundo y mide 64 píxeles de alto. La posesión se conserva al morir dentro de la sesión y se reinicia al recargar.

Dimensiones finales: muros 3, puertas 2.2 de altura y 0.2 de grosor (márgenes laterales 0.24), jugador/cámara 1.5 (agachado 0.9), Graham 1.9 con ancho proporcional y pies alineados al suelo. Todos los muebles de la configuración usan escala 0.9 sobre su geometría, con límites de colisión recalculados. La puerta (235,423) abre hacia norte; (228,423) conserva sur.

Al recibir antorcha, llave del puente, corazón, mapa o llave de cofre aparece «Has recibido…» durante 3.5 segundos; avisos consecutivos se encolan. Recoger el corazón activa forest y la transformación visual/levitación; consultar HANDOFF.md para parámetros finales y límites verificados.

La casa de montaña ocupa actualmente X=148..157, Z=124..132, con puerta en (148,128). Su techo de capa2 se trasladó a X=147..158, Z=123..133; al mover la construcción, revisar también esa capa y sus antorchas.

## Ubicación del corazón
El santuario del corazón en capa1 se ubica en X=94, Z=279; mundo X=188, Z=558. El Corazón del Bosque usa el sprite del inventario con relieve fino e inclinación, dentro de una enredadera seca (DRY_VINE). El suelo DIRT_STONE mezcla tierra y piedra a ras del terreno, sin plataformas y con franjas hacia los cuatro lados. El cofre del mapa está configurado en (231,425); los cofres restantes sin configuración entregan llaves. El identificador configurado conserva forest-heart-chest para compatibilidad con la misión.

Para extraerlo hay que estar a 1.65 unidades horizontales o menos: E muestra «Está firmemente agarrada...» sin nombre, otro E inicia el forcejeo. Mantener S o flecha abajo durante tres segundos continuos completa la extracción; avanzar o soltar reinicia el esfuerzo, y moverse lateralmente no lo interrumpe. La mirada y desplazamiento están limitados durante la resistencia. Al romperse hay partículas, retroceso amortiguado y un resto de raíces/tronco en el suelo. No aparecen instrucciones durante el tirón. K es un atajo de prueba hacia el claro y queda bloqueado durante diálogos o secuencias.
