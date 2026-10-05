import numpy as np
from PIL import Image
import random
import math

WIDTH, HEIGHT = 512, 512

# Colores EXACTOS requeridos por el sistema
WATER = (0, 0, 255)         # Azul
GRASS = (0, 255, 0)         # Verde
TALL_GRASS = (0, 128, 0)    # Verde oscuro
TREES = (0, 0, 0)           # Negro
BUILDING = (128, 128, 128)  # Gris
SAND = (255, 255, 0)        # Amarillo
POI = (255, 0, 0)           # Rojo

def get_mountain_color(intensity):
    # intensity va de 0 (base) a 1 (cima)
    # Café base: (139, 69, 19), cima (más oscuro): (40, 20, 5)
    r = int(139 - (139 - 40) * intensity)
    g = int(69 - (69 - 20) * intensity)
    b = int(19 - (19 - 5) * intensity)
    return (r, g, b)

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

# 1. Mapas de Ruido
elevation_noise = generate_fractal_noise(WIDTH, HEIGHT, [(4, 1.0), (8, 0.5), (16, 0.25), (32, 0.12)])
veg_noise = generate_fractal_noise(WIDTH, HEIGHT, [(6, 1.0), (12, 0.5), (24, 0.25)])

img_data = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

# Distancia al centro para formar isla
y, x = np.ogrid[:HEIGHT, :WIDTH]
center_x, center_y = WIDTH / 2, HEIGHT / 2
dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
island_mask = np.clip(1.0 - (dist_from_center / 240.0), 0, 1) ** 1.2

# 2. Forzar Montaña (NW) y Lago (SE) orgánicamente
# Montaña principal en (128, 128)
dist_mount = np.sqrt((x - 128)**2 + (y - 128)**2)
mount_mask = np.clip(1.0 - (dist_mount / 150.0), 0, 1) ** 2

# Lago principal en (384, 384)
dist_lake = np.sqrt((x - 384)**2 + (y - 384)**2)
lake_mask = np.clip(1.0 - (dist_lake / 60.0), 0, 1) ** 1.5

# Combinar para la elevación final
elevation = island_mask * 0.5 + elevation_noise * 0.4
elevation += mount_mask * 0.45  # Subir el NW
elevation -= lake_mask * 0.4    # Hundir el SE

# 3. Dibujar Terreno basado en Elevación y Vegetación
for r in range(HEIGHT):
    for c in range(WIDTH):
        e = elevation[r, c]
        if e < 0.30:
            img_data[r, c] = WATER
        elif e < 0.35:
            img_data[r, c] = SAND
        elif e < 0.65:
            # Llanuras: usar ruido de vegetación para transiciones naturales
            v = veg_noise[r, c]
            if v < 0.45:
                img_data[r, c] = GRASS
            elif v < 0.60:
                img_data[r, c] = TALL_GRASS
            else:
                img_data[r, c] = TREES
        else:
            # Montañas: Café, más oscuro cuanto más alto
            intensity = min((e - 0.65) / 0.35, 1.0)
            img_data[r, c] = get_mountain_color(intensity)

# 4. Generar el Río Sinuoso
# Encontrar el pico más alto en la zona Noroeste para el nacimiento
start_y, start_x = np.unravel_index(np.argmax(elevation), elevation.shape)
curr_x, curr_y = int(start_x), int(start_y)
river_path = []

for step in range(2000):
    river_path.append((curr_x, curr_y))
    neighbors = []
    for dy in [-1, 0, 1]:
        for dx in [-1, 0, 1]:
            if dx == 0 and dy == 0: continue
            nx, ny = curr_x + dx, curr_y + dy
            if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                neighbors.append((elevation[ny, nx], nx, ny))
    
    if not neighbors: break
    neighbors.sort()
    
    # Elegir el terreno más bajo para fluir
    lowest_e, nx, ny = neighbors[0]
    
    # Agregar un poco de inercia/azar para meandros, pero bajando
    if len(neighbors) > 1 and random.random() < 0.25 and neighbors[1][0] < elevation[curr_y, curr_x]:
        lowest_e, nx, ny = neighbors[1]
        
    curr_x, curr_y = nx, ny
    
    # El río llega al mar o a un lago
    if elevation[curr_y, curr_x] < 0.30:
        break

# Dibujar el cauce del río con grosor natural
for rx, ry in river_path:
    # No dibujar río en la mismísima cima para no cortar el pico
    if elevation[ry, rx] < 0.85:
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx**2 + dy**2 <= 4: # Forma circular
                    nx, ny = rx + dx, ry + dy
                    if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                        img_data[ny, nx] = WATER

# 5. Edificaciones y POIs
def place_poi(quad_xmin, quad_xmax, quad_ymin, quad_ymax, size):
    valid_points = []
    for y in range(quad_ymin, quad_ymax):
        for x in range(quad_xmin, quad_xmax):
            # Solo sobre pasto
            if list(img_data[y, x]) == list(GRASS):
                valid_points.append((x, y))
    
    if valid_points:
        px, py = random.choice(valid_points)
        for dy in range(-size, size+1):
            for dx in range(-size, size+1):
                if 0 <= px+dx < WIDTH and 0 <= py+dy < HEIGHT:
                    img_data[py+dy, px+dx] = BUILDING
        img_data[py, px] = POI

place_poi(WIDTH//2, WIDTH, 0, HEIGHT//2, 5) # Castillo Noreste
place_poi(WIDTH//4, 3*WIDTH//4, 0, HEIGHT//2, 3) # Edificio Centro-Norte
place_poi(WIDTH//4, 3*WIDTH//4, HEIGHT//2, HEIGHT, 3) # Edificio Centro-Sur

# Guardar
img = Image.fromarray(img_data)
img.save("mapa_natural_colores.png")
print("Mapa con colores exactos generado: mapa_natural_colores.png")
