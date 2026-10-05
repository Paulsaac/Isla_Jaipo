import numpy as np
from PIL import Image
import random
import math

# Dimensiones exactas
WIDTH, HEIGHT = 512, 512

# Guía de Colores (RGB)
WATER = (0, 0, 255)         # Azul
GRASS = (0, 255, 0)         # Verde
TALL_GRASS = (0, 128, 0)    # Verde oscuro
TREES = (0, 0, 0)           # Negro
BUILDING = (128, 128, 128)  # Gris
SAND = (255, 255, 0)        # Amarillo
POI = (255, 0, 0)           # Rojo

# Inicializar mapa base (Océano)
img_data = np.full((HEIGHT, WIDTH, 3), WATER, dtype=np.uint8)

def dist(x1, y1, x2, y2):
    return math.hypot(x1 - x2, y1 - y2)

def draw_rect(px, py, w, h, color):
    for y in range(py, py + h):
        for x in range(px, px + w):
            if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                img_data[y, x] = color

# 1. Generar la Isla (Aprox 80% del lienzo)
center_x, center_y = WIDTH // 2, HEIGHT // 2
island_radius = 230 # Cubre ~80% del área de 512x512

for y in range(HEIGHT):
    for x in range(WIDTH):
        # Forma de isla con ruido orgánico en las costas
        d = dist(x, y, center_x, center_y)
        noise = random.randint(-12, 12)
        
        if d + noise < island_radius:
            # Costa de arena
            if d + noise > island_radius - 8:
                img_data[y, x] = SAND
            else:
                img_data[y, x] = GRASS

# 2. Montañas Noroeste (NW) y Río
# Centro de montañas en (128, 128)
for y in range(HEIGHT):
    for x in range(WIDTH):
        # Solo modificar si es tierra
        if list(img_data[y, x]) in [list(GRASS), list(SAND)]:
            d_mount = dist(x, y, 128, 128)
            
            # Montañas (Radio 110)
            if d_mount < 110:
                # Interpolar color: Más cerca del centro (128,128) = Más oscuro = Más alto
                intensity = d_mount / 110.0 # 0 es la cima, 1 es la base
                r = max(40, int(139 * intensity + 30 * (1 - intensity)))
                g = max(20, int(69 * intensity + 15 * (1 - intensity)))
                b = max(5, int(19 * intensity + 5 * (1 - intensity)))
                img_data[y, x] = (r, g, b)

            # Río fluyendo hacia el Sureste (SE)
            # Diagonal desde (128, 128) hasta (384, 384)
            if 128 < x < 384 and 128 < y < 384:
                # Distancia a la línea y = x
                if abs(x - y) < 6 + random.randint(-1, 1):
                    img_data[y, x] = WATER

            # Lago Sureste (SE) desembocadura
            if dist(x, y, 384, 384) < 35:
                img_data[y, x] = WATER

# 3. Bosque Suroeste (SW)
for y in range(HEIGHT):
    for x in range(WIDTH):
        # Zona SW (x < 256, y > 256), delimitado por la costa y el río (y > x + 20)
        if list(img_data[y, x]) == list(GRASS) and x < 256 and y > 256 and y > x + 20:
            # Alternar píxeles para no saturar
            rand = random.random()
            if rand < 0.25:
                img_data[y, x] = TREES
            elif rand < 0.50:
                img_data[y, x] = TALL_GRASS

# 4. Edificaciones (Gris) y Puntos de Interés (Rojo)
# Castillo Noreste (NE) - Silueta
draw_rect(360, 90, 60, 50, BUILDING) # Base
draw_rect(350, 70, 20, 70, BUILDING) # Torre izquierda
draw_rect(410, 70, 20, 70, BUILDING) # Torre derecha
draw_rect(385, 110, 10, 10, POI)     # Entrada / POI

# Edificación Centro Norte (CN) - Tamaño mayor que CS
draw_rect(240, 90, 32, 32, BUILDING)
draw_rect(250, 100, 12, 12, POI)

# Edificación Centro Sur (CS) - Tamaño menor
draw_rect(248, 420, 16, 16, BUILDING)
draw_rect(252, 424, 8, 8, POI)

# Guardar y exportar
img = Image.fromarray(img_data)
img.save("mapa_dark_fantasy.png")
print("Mapa de 512x512 generado exitosamente: mapa_dark_fantasy.png")
