# Reglas del funcionamiento del mapa (Paleta Estandarizada)

Para evitar errores de interpretación por aproximación de colores (Euclidean Distance), **debes usar exactamente estos cdigos HEX/RGB** en tu editor de imágenes.

Esta documentación esta sincronizada con `estructura_color.md` y `capa1.png`.

## Capa 1: Terreno y Estructuras (capa1.png)

| Elemento | Color Visual | Codigo HEX | RGB (R, G, B) |
| :--- | :--- | :--- | :--- |
| **Agua** | Turquesa | `#00A2E8` | `0, 162, 232` |
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
| **Arbusto** | Añil | `#3C2F7F` | `60, 47, 127` |

## Capa 2: Superposiciones (capa2.png)

**REGLA ESTRICTA:** Esta capa es **exclusiva** para los Techos. Todo lo dems debe estar pintado en la Capa 1 y el fondo de esta capa debe ser 100% transparente.

| Elemento | Color Visual | Cdigo HEX | RGB (R, G, B) |
| :--- | :--- | :--- | :--- |
| **Techo** | Azul Turquesa Oscuro | `#006064` | `0, 96, 100` |

## Reglas de Lgica:
* Donde haya Rojo Oscuro (`#880015`) indicando superficie caminable interna, debe haber Techo (`#006064` en Capa 2) cubriendo esa zona.
* La relacin de crecimiento en altura entre las montaas y cumbres debe ser paulatina y natural (Caf -> Lavanda -> Blanco).
* El agua (`#00A2E8`) no debe permitir nadar. Solo se podr movilizar sobre los botes de madera (`#D2145A`).
* Los cofres (`#FFAEC9`) deben contener llaves, hay 7 cofres y 7 puertas bloqueadas (`#B5E61D`).
* Una vez consumida una llave desaparece del inventario.
* El jugador siempre comienza desde el punto Azul Oscuro (`#3F48CC`).
* La altura mnima de los Muros (`#A349A4`) debe ser el doble de la altura del personaje.
