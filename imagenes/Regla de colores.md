# Reglas del funcionamiento del mapa (Paleta Estandarizada)

Para evitar errores de interpretación por aproximación de colores (Euclidean Distance), **debes usar exactamente estos cdigos HEX/RGB** en tu editor de imágenes.

Esta documentación esta sincronizada con `estructura_color.md` y `capa1.png`.

## Capa 1: Terreno y Estructuras (capa1.png)

| Elemento | Color Visual | Codigo HEX | RGB (R, G, B) |
| :--- | :--- | :--- | :--- |
| **Agua** | Turquesa | `#00A2E8` | `0, 162, 232` |
| **Río y lago con fondo rocoso** | Azul | `#3282F6` | `50, 130, 246` |
| **Pasto** | Verde Oscuro | `#008000` | `0, 128, 0` |
| **Hierba Alta** | Verde | `#22B14C` | `34, 177, 76` |
| **Arena** | Dorado | `#FFC90E` | `255, 201, 14` |
| **Montaña** | Cafe | `#B97A57` | `185, 122, 87` |
| **Cumbres** | Lavanda | `#C8BFE7` | `200, 191, 231` |
| **Cumbre Nevada** | Blanco | `#FFFFFF` | `255, 255, 255` |
| **Arbol** | Gris | `#7F7F7F` | `127, 127, 127` |
| **Tierra** | Rojo | `#ED1C24` | `237, 28, 36` |
| **Suelo Interno (Madera)** | Rojo Oscuro | `#880015` | `136, 0, 21` |
| **Muro** | Purpura | `#A349A4` | `163, 73, 164` |
| **Plaza Central** | Gris Azulado | `#7092BE` | `112, 146, 190` |
| **Madera** | Amarillo | `#FFF200` | `255, 242, 0` |
| **Puerta Desbloqueada** | Negro | `#000000` | `0, 0, 0` |
| **Puerta Bloqueada** | Verde Lima | `#B5E61D` | `181, 230, 29` |
| **Cofre** | Rosado | `#FFAEC9` | `255, 174, 201` |
| **Bote** | Rosa Oscuro | `#D2145A` | `210, 20, 90` |
| **Spawn** | Azul Oscuro | `#3F48CC` | `63, 72, 204` |
| **Antorcha Normal** | Azul Cielo | `#99D9EA` | `153, 217, 234` |
| **Antorcha Azul** | Turquesa Claro | `#B2EBF2` | `178, 235, 242` |
| **Antorcha exterior** | Gris Azulado | `#50727A` | `80, 114, 122` |
| **Arbusto** | Añil | `#3C2F7F` | `60, 47, 127` |

## Capa 2: Superposiciones (capa2.png)

Esta capa define techos y admite marcadores de antorchas superpuestas. Preferir fondo transparente; el fondo blanco histórico no genera techo. Mantener la cobertura de techo alineada con los muros de capa1 al mover edificios. Las antorchas exteriores se registran en una matriz independiente y no sustituyen techos.

| Elemento | Color Visual | Cdigo HEX | RGB (R, G, B) |
| :--- | :--- | :--- | :--- |
| **Techo** | Azul Turquesa Oscuro | `#006064` | `0, 96, 100` |
| **Antorcha** | Azul Cielo | `#99D9EA` | `153, 217, 234` |
| **Antorcha azul** | Turquesa Claro | `#B2EBF2` | `178, 235, 242` |
| **Antorcha exterior** | Gris Azulado | `#50727A` | `80, 114, 122` |

## Reglas de Lgica:
* `#3282F6` identifica agua con corriente (WATER_ROCK), no navegable para botes; `#00A2E8` identifica agua habitual. El fondo depende de profundidad y costa: rocas en corriente, fondo.png en mar profundo y arena/arena_mojada en litoral. Superficie animada; consultar HANDOFF.md para parámetros vigentes.
* Donde haya Rojo Oscuro (`#880015`) indicando superficie caminable interna, debe haber Techo (`#006064` en Capa 2) cubriendo esa zona.
* La relacin de crecimiento en altura entre las montaas y cumbres debe ser paulatina y natural (Caf -> Lavanda -> Blanco).
* El agua permite vadear el fondo somero y flotar a mayor profundidad, con resistencia y ahogamiento. Los botes (`#D2145A`) navegan agua habitual y celdas BOAT; toda su huella debe quedar fuera de la corriente `#3282F6`.
* Los cofres usan `#FFAEC9`: el configurado en (94,279) entrega el Corazón del Bosque, el configurado en (231,425) entrega el mapa tras recibir la llave del puente de Graham, y los cofres sin configuración entregan llaves. Consultar docs/ENTITIES.md para la asignación vigente.
* Una vez consumida una llave desaparece del inventario.
* El jugador siempre comienza desde el punto Azul Oscuro (`#3F48CC`).
* La altura mnima de los Muros (`#A349A4`) debe ser el doble de la altura del personaje.
