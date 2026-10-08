# Publicación en GitHub Pages

El juego es un sitio estático: no requiere compilación, Node, base de datos ni instalación de paquetes para el jugador.

## Activación
En el repositorio `Paulsaac/Isla_Jaipo`, abrir Settings → Pages. En Build and deployment elegir Deploy from a branch, rama `main`, carpeta `/(root)` y Save. La URL prevista es https://paulsaac.github.io/Isla_Jaipo/; su disponibilidad depende de habilitar Pages y completar el despliegue de GitHub.

El archivo `.nojekyll` evita el procesamiento de Jekyll. `index.html`, `game.js`, `src/` e `imagenes/` deben permanecer en sus rutas. Las rutas relativas permiten servir el juego dentro de `/Isla_Jaipo/`. En GitHub se distinguen mayúsculas: el cielo de día usa `imagenes/Texturas/Cielo_dia/`.

## Verificación después de publicar
- Abrir la URL del juego y comprobar carga de ambas capas, texturas y ausencia de errores en consola.
- Probar inicio, Graham, entrega de antorcha, inventario, N, puertas y recorrido del corazón.
- Three.js 0.160.0 se carga desde unpkg y la fuente desde Google Fonts: requieren conexión y no están empaquetados para uso sin internet.
- No subir node_modules, bloqueos de sesión, copias de seguridad ni scripts locales de parche. Publicar exclusivamente archivos revisados.

Referencia: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Estado del cierre del 2026-10-08
La API pública del repositorio informó `has_pages: false` antes del push. Se preparó el código y se verificó localmente bajo `/Isla_Jaipo/`; no se activó Pages ni se afirmó un despliegue público exitoso.
