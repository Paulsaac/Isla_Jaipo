# Coordenadas y entidades

Abrir `http://127.0.0.1:8000/tools/world-map.html` para seleccionar una celda o uno de los seis cofres. La herramienta solo lee el mapa.

- Coordenadas de mapa: X = columna, Z = fila, ambas enteras, comenzando en 0 en la esquina superior izquierda. Z aumenta hacia abajo en la imagen.
- Mundo: X y Z son las coordenadas de mapa multiplicadas por UNIT_SIZE (actualmente 2). Y es la altura y se calcula con el terreno; no se escribe en la configuración de cofres.
- worldToGrid usa la celda centrada en cada posición, como las colisiones existentes. No confundir estas coordenadas con las coordenadas de pantalla ni con el muestreo de altura.

## Configuración
`src/content/entities.js` define objetos específicos sobre celdas que ya existen en la imagen. No genera nuevos cofres ni cambia los mapas. Configuración del corazón confirmada por el usuario:

```js
{ id: 'forest-heart-chest', type: 'CHEST', position: { x: 165, z: 308 }, item: 'forest-heart' }
```

El registro valida límites, identificadores y coincidencia con el tipo de celda. Solo los cofres consultan actualmente este registro; soportar otro objeto o una zona funcional requiere conectar su comportamiento de forma explícita.

Los cofres sin configuración continúan dando una llave. Un cofre configurado con forest-heart entrega el corazón, no una llave. La misión permite recoger y entregar una sola vez por sesión. Al completar los diálogos de entrega, el objeto desaparece del inventario y Graham sigue buscando la llave; no se desbloquea el puente.

No hay guardado persistente. Recargar reinicia la misión. Reiniciar después de morir conserva el progreso de sesión y los cofres retirados, igual que el comportamiento previo del inventario.

## Ubicación del corazón
El usuario confirmó el cofre 4: celda X=165, Z=308; mundo X=330, Z=616. Los otros cinco cofres conservan llaves. La numeración de la herramienta depende del orden de lectura del mapa; el identificador persistente de contenido es forest-heart-chest y su celda configurada.
