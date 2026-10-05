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
    # Café, se oscurece con la altura
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

# 1. Elevación Base (Costas y Montañas orgánicas)
octaves = [(4, 1.0), (8, 0.75), (16, 0.5), (32, 0.25), (64, 0.15)]
elevation_noise = generate_fractal_noise(WIDTH, HEIGHT, octaves)

y, x = np.ogrid[:HEIGHT, :WIDTH]
dist_from_center = np.sqrt((x - 256)**2 + (y - 256)**2)
island_mask = np.clip(1.0 - (dist_from_center / 240.0), 0, 1) ** 0.8

dist_mount = np.sqrt((x - 128)**2 + (y - 128)**2)
mount_mask = np.clip(1.0 - (dist_mount / 200.0), 0, 1) ** 1.5

elevation = island_mask * 0.4 + elevation_noise * 0.55
elevation += mount_mask * 0.5  

# 2. Renderizar Terreno
for r in range(HEIGHT):
    for c in range(WIDTH):
        e = elevation[r, c]
        if e < 0.38:
            img_data[r, c] = WATER
        elif e < 0.42:
            img_data[r, c] = SAND
        elif e < 0.65:
            img_data[r, c] = GRASS
        else:
            intensity = min((e - 0.65) / 0.35, 1.0)
            img_data[r, c] = get_mountain_color(intensity)

# 3. Forzar explícitamente LAGO y RÍO para asegurar que aparezcan siempre
# Lago en el SE
for r in range(HEIGHT):
    for c in range(WIDTH):
        # Lago redondo con bordes ligeramente irregulares por el ruido
        if math.hypot(c - 384, r - 384) <= 38 + (elevation_noise[r, c] * 10 - 5):
            img_data[r, c] = WATER

# Río meándrico desde NW (128,128) hasta el Lago SE (384,384)
river_path = []
dx, dy = 384 - 128, 384 - 128
dist_river = math.hypot(dx, dy)
for i in range(int(dist_river)):
    t = i / dist_river
    lx, ly = 128 + dx * t, 128 + dy * t
    perp_x, perp_y = -dy / dist_river, dx / dist_river
    # Dos frecuencias de seno para simular meandros naturales
    offset = math.sin(t * 15) * 18 + math.sin(t * 30) * 6
    px, py = lx + perp_x * offset, ly + perp_y * offset
    river_path.append((int(px), int(py)))

# Dibujar el río
for rx, ry in river_path:
    for dy_ in range(-2, 3):
        for dx_ in range(-2, 3):
            if dx_**2 + dy_**2 <= 5: # Grosor del río
                nx, ny = rx + dx_, ry + dy_
                if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                    img_data[ny, nx] = WATER

# 4. Bosque Suroeste con Bordes Difuminados
# Usamos la distancia al núcleo del cuadrante SW (aprox 120, 390)
core_x, core_y = 120, 390
for r in range(HEIGHT):
    for c in range(WIDTH):
        # Limitar al cuadrante SW
        if c <= 256 and r >= 256:
            # Solo plantar árboles sobre pasto normal (evita agua y arena)
            if list(img_data[r, c]) == list(GRASS):
                dist_to_core = math.hypot(c - core_x, r - core_y)
                # Probabilidad máxima en el núcleo, decae suavemente hacia los bordes (río/costa)
                prob_tree = max(0, 0.45 - (dist_to_core / 160.0))
                prob_tall = prob_tree * 2.0
                
                rand = random.random()
                if rand < prob_tree:
                    img_data[r, c] = TREES
                elif rand < prob_tall:
                    img_data[r, c] = TALL_GRASS

# 5. Edificaciones (se dibujan al final para quedar encima de todo)
draw_rect(360, 90, 60, 50, BUILDING, img_data) # Castillo NE
draw_rect(350, 70, 20, 70, BUILDING, img_data)
draw_rect(410, 70, 20, 70, BUILDING, img_data)
draw_rect(385, 110, 10, 10, POI, img_data)

draw_rect(240, 90, 32, 32, BUILDING, img_data) # CN
draw_rect(250, 100, 12, 12, POI, img_data)

draw_rect(248, 420, 16, 16, BUILDING, img_data) # CS
draw_rect(252, 424, 8, 8, POI, img_data)

img = Image.fromarray(img_data)
img.save("mapa_final_exacto.png")
print("Mapa con río, lago y bosque difuminado generado: mapa_final_exacto.png")
