# Revisión de optimización de AxByZ — 2026-10-15

Base: copia ZIP 362b6897, con ajustes locales de esta sesión. Requisito: conservar íntegros aspecto, sensaciones, controles, reglas, audio y tiempos. Sin Git ni publicación. Bloqueo propio conservado.

## Diagnóstico disponible

Foto Lenovo: 10.8 FPS, CPU/envío 11.4 ms (p95 19), 2,884,752 triángulos, 274 dibujos; Intel HD Graphics 400/ANGLE D3D11. Sugiere límite GPU/render, pero CPU/envío no es tiempo GPU y no prueba una causa única. Falta nueva lectura en el Lenovo.

## Revisión por sistema

| Sistema | Hallazgo y decisión |
| --- | --- |
| Terreno | Conserva buffers locales por sector, índices16bits y consulta condicional de texturas de la revisión previa. Malla ondulada: simplificarla puede modificar silueta, iluminación y apoyo. No cambiar geometría, triangulación, normales, UV ni resolución. |
| Iluminación | Hasta12 antorchas y cuatro luces de Bosque se mantienen en escena para evitar recompilar al activarse. Shaders calculaban también aportes con color exactamente cero. Nueva ruta omite esos aportes en materiales Phong, conservando todas las luces, intensidad, alcance, selección y fundidos. |
| Bosque | El shader evaluaba trigonometría, conversión de color y movimiento especial aunque su multiplicador fuera cero. Se omite únicamente en cero; cualquier intensidad positiva conserva la fórmula original. El viento ordinario sigue siempre activo. |
| Cielo | Tres capas transparentes seguían dibujándose con opacidad exactamente0 y depthWrite=false. Ahora se ocultan solo en ese caso; vuelven en cualquier opacidad positiva. Noche base, rotación, luna, sol y reloj sin cambios. |
| Vegetación | Ya usa instancias, sectores y rangos GPU incrementales. Se conservan todas las plantas, ambas caras, márgenes de movimiento, alcance y fundidos. No cambiar orden de transparencias ni forzar pasada única en vegetación terrestre sin prueba de equivalencia. |
| Visibilidad/CPU | Fog culling y frustum existentes se conservan. Cachear matrices/límites de objetos móviles requiere invalidación de puertas, botes y objetos recogibles; no introducir una caché global sin perfil que justifique ese riesgo. |
| Agua/inmersión | Refracción ya evita pasada adicional fuera del agua y prepara recursos. Vegetación submarina se construye por tandas y conserva caché. Mantener textura de corriente, refracción, mezcla de superficies y reglas de botes/aire. Nuevo filtrado de luces también se conecta al crear plantas submarinas. |
| Física/interacciones | Raycast ya limitado a3.5m; colisiones usan celdas cercanas y estructuras. Sin cambios de frecuencia de simulación, entradas, gravedad, cama, tirón/rebote, pausa0.2s ni recuperación de teclas. |
| Audio/eventos | Buses e impulsos se reutilizan; analizador devuelve inmediatamente si no hay reproducción. Sin cambios de muestras, filtros, reverberación, reloj de audio, marcas o levitación. |
| HUD/carga | Coordenadas/tinte/minimapa ya evitan parte del trabajo innecesario. Hay escriturasDOM repetidas menores y URL de assets con timestamp que afectan caché de recarga; no explican por sí solas10FPS sostenidos. Conservar política actual de actualización de assets y no priorizar microcambios sin perfil. |

## Cambios de esta revisión

- src/world/inactive-lights.js: decorador de materiales Phong que conserva onBeforeCompile anterior y clave de programa, aplicado una sola vez mediante WeakSet. No parchea globalmente Three.js ni elimina luces. Si no reconoce el fragmento esperado, conserva cálculo original.
- src/world/heart-vision.js: rama uniforme para UV en reposo (derivadas preservadas), rama de color para aporte cero; clave de shader actualizada.
- src/world/vegetation-wind.js: omitir movimiento especial de árboles en intensidad0, sin omitir viento normal.
- game.js: conectar materiales iniciales/submarinos y visibilidad de capas transparentes vacías. Comparación contra respaldo confirma que no hay otras modificaciones en este archivo durante esta revisión.

## Comparación y verificaciones

185 casos renderizados en AXBYZ/NVIDIA:90 terreno,90 materiales/árboles instanciados/agua/cielo/luna,5 composiciones de capas. 145,489,920 canales comparados. Una diferencia de1/255 en un canal rojo del terreno con efecto e iluminación máximos; atribuida por aislamiento a la variante de luces. Todos los demás canales idénticos; sin errores de shader. No afirmar identidad binaria absoluta ni validación en Intel. Efecto de Bosque aislado:90 casos idénticos.

Medición GPU por EXT_disjoint_timer_query_webgl2:9 muestras alternadas de12 dibujos por variante a512×384, tras calentamiento. Prueba sintética, no FPS del juego. Medianas en ms:

| Efecto | Luces del pool encendidas (de18) | Antes | Después |
| --- | ---: | ---: | ---: |
| 0 | 0 | 0.570 | 0.199 |
| 0 | 6 | 0.429 | 0.255 |
| 0 | 18 | 0.332 | 0.364 |
| 1 | 0 | 0.291 | 0.086 |
| 1 | 6 | 0.290 | 0.159 |
| 1 | 18 | 0.291 | 0.322 |

Existe una luz adicional activa en todos los casos. Hay variación de frecuencia GPU entre escenarios: comparar cada pareja, no escenarios entre sí. Caso extremo con todas encendidas cuesta≈10% más: contrapartida de las ramas, no ganancia universal. Prioridad siguiente: medir caso real en Intel; si empeora, revertir solo decorador/conexiones de luces, conservando las otras mejoras y los cambios de usuario.

Integración: carga, spawn236/427, pausa/reanudación y trasladoK al claro94/277 sin erroresJS. En spawn:30.0FPS, CPU/envío2.3ms/p95 3.1,351dibujos y2,901,445triángulos. Referencia anterior de sesión:358dibujos/2,901,469triángulos; diferencia de capas invisibles, no simplificación del mundo. No atribuir mejoraFPS al límite30 ni a esta comparación de momentos distintos. Cuatro archivosJS pasan comprobación sintáctica.

## Evidencia y pendientes

.coordination/optimization-audit-20261015.json y optimization-audit-gpu.html conservan resultado y fixture. Para repetir, copiar HTML a src/audit-gpu.html y respaldos audit-before-src_world_heart-vision.js / audit-before-src_world_vegetation-wind.js a src/world/audit-heart-before.js / audit-wind-before.js; abrir con servidor local y retirar solo esas copias auxiliares después. Respaldos originales preservados.

Pendiente: FPS/p95 en Lenovo en mismo lugar/resolución, recorrido integral de eventoBosque y transición submarina, comparación específica WebGL1 (se conserva ruta compatible pero no se ha ejecutado aquí). No hay reducción de resolución, distancia, texturas, polígonos visibles o densidad. No nuevos paquetes ni servicios. ServidorLAN y túnel conservados.
