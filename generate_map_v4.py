import numpy as np
from PIL import Image
import random
import math

WIDTH, HEIGHT = 512, 512

# Colores EXACTOS para el sistema
WATER = (0, 0, 255)
GRASS = (0, 255, 0)
TALL_GRASS = (0, 128, 0)
TREES = (0, 0, 0)
BUILDING = (128, 128, 128)
SAND = (255, 255, 0)
POI = (255, 0, 0)

def get_mountain_color(intensity):
    # Café oscuro para mayor altura (estética de relieve)
    r = int(139 - (139 - 40) * intensity)
    g = int(69 - (69 - 20) * intensity)
    b = int(19 - (19 - 5) * intensity)
    return (r, g, b)

def draw_rect(px, py, w, h, color, img_data):
    for y in range(py, py + h):
        for x in range(px, px + w):
            if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                img_data[y, x] = color

def generate_fractal_noise(width, height, octaves):
    noise = np.zeros((height, width))
    total_weight = 0
    for scale, weight in octaves:
        small_noise = np.random.rand(scale, scale) * 255
        small_img = Image.fromarray(small_noise.astype('uint8'), 'L')
        large_img = small_img.resize((width, height), Image.Resampling.BICUBIC)
        noise += np.array(large_img, dtype=np.float32) / 255.0 * weight
        total_weight += weight
    return noise / total_weight

img_data = np.full((HEIGHT, WIDTH, 3), WATER, dtype=np.uint8)

# 1. Forma de isla (80% del mapa) y costas escarpadas (Elder Scrolls)
# Más octavas de alta frecuencia = costas y montañas más rugosas
octaves = [(4, 1.0), (8, 0.75), (16, 0.5), (32, 0.25), (64, 0.15), (128, 0.08)]
elevation_noise = generate_fractal_noise(WIDTH, HEIGHT, octaves)

y, x = np.ogrid[:HEIGHT, :WIDTH]
center_x, center_y = WIDTH / 2, HEIGHT / 2
dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
# Radio amplio para abarcar ~80%
island_mask = np.clip(1.0 - (dist_from_center / 250.0), 0, 1) ** 0.8

# Máscara NW (Región Montañosa)
dist_mount = np.sqrt((x - 140)**2 + (y - 140)**2)
mount_mask = np.clip(1.0 - (dist_mount / 220.0), 0, 1) ** 1.5

# Máscara SE (Lago)
dist_lake = np.sqrt((x - 384)**2 + (y - 384)**2)
lake_mask = np.clip(1.0 - (dist_lake / 45.0), 0, 1) ** 2

elevation = island_mask * 0.4 + elevation_noise * 0.65
elevation += mount_mask * 0.45  # Elevar toda la región NW para generar múltiples cumbres
elevation -= lake_mask * 0.6    # Cavar el lago SE

# 2. Dibujar Terreno Base
for r in range(HEIGHT):
    for c in range(WIDTH):
        e = elevation[r, c]
        if e < 0.38:
            img_data[r, c] = WATER
        elif e < 0.43:
            img_data[r, c] = SAND
        elif e < 0.70:
            img_data[r, c] = GRASS
        else:
            intensity = min((e - 0.70) / 0.30, 1.0)
            img_data[r, c] = get_mountain_color(intensity)

# 3. Río naciendo en las montañas NW y fluyendo al lago SE
# Encontrar pico más alto en NW (x < 256, y < 256)
nw_elevation = np.where((x < 256) & (y < 256), elevation, 0)
start_y, start_x = np.unravel_index(np.argmax(nw_elevation), nw_elevation.shape)

curr_x, curr_y = int(start_x), int(start_y)
lake_x, lake_y = 384, 384
river_path = []

for step in range(2000):
    river_path.append((curr_x, curr_y))
    if math.hypot(curr_x - lake_x, curr_y - lake_y) < 25:
        break # Llegó al lago
        
    neighbors = []
    for dy in [-1, 0, 1]:
        for dx in [-1, 0, 1]:
            if dx == 0 and dy == 0: continue
            nx, ny = curr_x + dx, curr_y + dy
            if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                # Sesgar ligeramente el flujo hacia el lago SE para asegurar que emboque
                bias = math.hypot(nx - lake_x, ny - lake_y) * 0.001
                neighbors.append((elevation[ny, nx] + bias, nx, ny))
                
    if not neighbors: break
    neighbors.sort()
    
    # Variabilidad natural del cauce
    if len(neighbors) > 1 and random.random() < 0.2:
        _, nx, ny = neighbors[1]
    else:
        _, nx, ny = neighbors[0]
        
    curr_x, curr_y = nx, ny
    if elevation[curr_y, curr_x] < 0.38 and step > 50:
        break # Llegó al agua (lago/mar)

# Dibujar río y registrar cauce para limitar el bosque
river_x_at_y = {ry: WIDTH for ry in range(HEIGHT)}

for rx, ry in river_path:
    if elevation[ry, rx] < 0.9: # No romper las cumbres extremas
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx**2 + dy**2 <= 4:
                    nx, ny = rx + dx, ry + dy
                    if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                        img_data[ny, nx] = WATER
                        # Registrar frontera para el bosque
                        if nx < river_x_at_y[ny]:
                            river_x_at_y[ny] = nx

# Rellenar vacíos verticales en la frontera del río por si salta píxeles
for ry in range(1, HEIGHT):
    if river_x_at_y[ry] == WIDTH and river_x_at_y[ry-1] != WIDTH:
        river_x_at_y[ry] = river_x_at_y[ry-1]

# 4. Bosque Suroeste delimitado por Costa y Río
for y in range(HEIGHT):
    for x in range(WIDTH):
        # SW (x < 256, y > 256)
        if x < 256 and y > 256:
            # Delimitado por la orilla del río (dejamos un pequeño margen)
            if x < river_x_at_y[y] - 4:
                # Solo si es tierra (Grass)
                if list(img_data[y, x]) == list(GRASS):
                    # Alternar píxeles para no saturar
                    rand = random.random()
                    if rand < 0.25:
                        img_data[y, x] = TREES
                    elif rand < 0.50:
                        img_data[y, x] = TALL_GRASS

# 5. Edificaciones y Puntos de Interés
# Castillo Noreste (NE) - Silueta de castillo
draw_rect(360, 90, 60, 50, BUILDING, img_data) # Base
draw_rect(350, 70, 20, 70, BUILDING, img_data) # Torre izquierda
draw_rect(410, 70, 20, 70, BUILDING, img_data) # Torre derecha
draw_rect(385, 110, 10, 10, POI, img_data)     # Entrada / POI

# Edificación Centro Norte (CN) - Tamaño mayor
draw_rect(240, 90, 32, 32, BUILDING, img_data)
draw_rect(250, 100, 12, 12, POI, img_data)

# Edificación Centro Sur (CS) - Tamaño menor
draw_rect(248, 420, 16, 16, BUILDING, img_data)
draw_rect(252, 424, 8, 8, POI, img_data)

img = Image.fromarray(img_data)
img.save("mapa_elder_scrolls.png")
print("Mapa Elder Scrolls generado exitosamente: mapa_elder_scrolls.png")
