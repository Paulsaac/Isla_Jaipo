# Coordenadas y entidades

Abrir `http://127.0.0.1:8000/tools/world-map.html` para seleccionar una celda o uno de los seis cofres. La herramienta solo lee el mapa.

- Coordenadas de mapa: X = columna, Z = fila, ambas enteras, comenzando en 0 en la esquina superior izquierda. Z aumenta hacia abajo en la imagen.
- Mundo: X y Z son las coordenadas de mapa multiplicadas por UNIT_SIZE (actualmente 2). Y es la altura y se calcula con el terreno; no se escribe en la configuración de cofres.
- worldToGrid usa la celda centrada en cada posición, como las colisiones existentes. No confundir estas coordenadas con las coordenadas de pantalla ni con el muestreo de altura.

## Configuración
`src/content/entities.js` define objetos específicos sobre celdas que ya existen en la imagen. No genera nuevos cofres ni cambia los mapas. Configuración del corazón confirmada por el usuario:

```js
{ id: 'forest-heart-chest', type: 'CHEST', position: { x: 94, z: 279 }, item: 'forest-heart', ground: 'SLAB', rotationY: Math.PI }
```

El registro valida límites, identificadores y coincidencia con el tipo de celda. Solo los cofres consultan actualmente este registro; soportar otro objeto o una zona funcional requiere conectar su comportamiento de forma explícita.

Los cofres sin configuración continúan dando una llave. Un cofre configurado con forest-heart entrega el corazón, no una llave. La misión permite recoger y entregar una sola vez por sesión. Al completar los diálogos de entrega, el corazón desaparece del inventario y Graham entrega la llave del puente; recibirla habilita el cofre del mapa y el tramo final de noche previo al amanecer.

No hay guardado persistente. Recargar reinicia la misión. Reiniciar después de morir conserva el progreso de sesión y los cofres retirados, igual que el comportamiento previo del inventario.

## Graham y antorcha del jugador
Graham está configurado en (235,421). Al completar su diálogo inicial entrega una única antorcha apagada. Antes de esa entrega no aparece en el inventario y T no la activa. El icono ocupa el primer casillero, mide 72x72 píxeles y gira 45 grados a la derecha; el corazón ocupa el segundo y mide 64 píxeles de alto. La posesión se conserva al morir dentro de la sesión y se reinicia al recargar.

Dimensiones finales: muros 3, puertas 2.2, jugador/cámara 1.5 (agachado 0.9), Graham 1.8 con ancho proporcional y pies alineados al suelo. Todos los muebles de la configuración usan escala 0.9 sobre su geometría, con límites de colisión recalculados. La puerta (235,423) abre hacia norte; (228,423) conserva sur.

Al recibir antorcha, llave del puente, corazón, mapa o llave de cofre aparece «Has recibido…» durante 3.5 segundos; avisos consecutivos se encolan. Recoger el corazón activa forest y la transformación visual/levitación; consultar HANDOFF.md para parámetros finales y límites verificados.

La casa de montaña ocupa actualmente X=148..157, Z=124..132, con puerta en (148,128). Su techo de capa2 se trasladó a X=147..158, Z=123..133; al mover la construcción, revisar también esa capa y sus antorchas.

## Ubicación del corazón
El usuario trasladó el cofre del corazón en capa1 a X=94, Z=279 el 2026-10-12; mundo X=188, Z=558. La celda anterior (165,308) ahora es pasto. El cofre conserva su orientación y apoyo sobre losa. El cofre del mapa está configurado en (231,425); los cofres restantes sin configuración entregan llaves. La numeración de la herramienta depende del orden de lectura del mapa; el identificador persistente de contenido es forest-heart-chest y su celda configurada.
