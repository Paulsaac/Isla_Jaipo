import numpy as np
from PIL import Image
import random
import math

WIDTH, HEIGHT = 512, 512

# Colores ajustados para una paleta más natural
WATER = (15, 94, 156)          # Agua profunda
SHALLOW_WATER = (35, 137, 218) # Agua poco profunda (Costa/Río)
SAND = (194, 178, 128)         # Arena
GRASS = (86, 125, 70)          # Pasto/Llanura
FOREST = (34, 76, 34)          # Bosque denso
MOUNTAIN_BASE = (105, 105, 105)# Base de montaña (Roca)
MOUNTAIN_HIGH = (220, 220, 220)# Cima nevada
POI = (180, 20, 20)            # Puntos de interés (Rojo)
BUILDING = (60, 60, 60)        # Edificios (Gris oscuro)

def generate_fractal_noise(width, height, octaves):
    """Genera ruido fractal suave redimensionando matrices aleatorias pequeñas"""
    noise = np.zeros((height, width))
    total_weight = 0
    for scale, weight in octaves:
        # Generar ruido blanco a baja resolución
        small_noise = np.random.rand(scale, scale) * 255
        small_img = Image.fromarray(small_noise.astype('uint8'), 'L')
        # Escalar usando interpolación bicúbica para que sea suave
        large_img = small_img.resize((width, height), Image.Resampling.BICUBIC)
        noise += np.array(large_img, dtype=np.float32) / 255.0 * weight
        total_weight += weight
    return noise / total_weight

# 1. Generar mapa de elevación (Costas, montañas)
# Diferentes frecuencias para darle irregularidad orgánica
elevation_octaves = [(4, 1.0), (8, 0.5), (16, 0.25), (32, 0.12), (64, 0.06)]
elevation_noise = generate_fractal_noise(WIDTH, HEIGHT, elevation_octaves)

# 2. Generar mapa de humedad (Para distribuir los bosques orgánicamente)
forest_octaves = [(6, 1.0), (12, 0.5), (24, 0.25)]
forest_noise = generate_fractal_noise(WIDTH, HEIGHT, forest_octaves)

img_data = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

# Máscara de isla para asegurar que los bordes sean océano
y, x = np.ogrid[:HEIGHT, :WIDTH]
center_x, center_y = WIDTH / 2, HEIGHT / 2
dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
max_dist = min(WIDTH, HEIGHT) / 2.0

# Degradado circular que decae hacia los bordes
island_mask = np.clip(1.0 - (dist_from_center / max_dist), 0, 1)
island_mask = island_mask ** 1.2 # Hacer que las costas sean un poco más abruptas

# Combinar forma de isla con el ruido de elevación
elevation = island_mask * 0.6 + elevation_noise * 0.5

# 3. Colorear el terreno según la elevación y humedad
for r in range(HEIGHT):
    for c in range(WIDTH):
        e = elevation[r, c]
        if e < 0.25:
            img_data[r, c] = WATER
        elif e < 0.35:
            img_data[r, c] = SHALLOW_WATER
        elif e < 0.40:
            img_data[r, c] = SAND
        elif e < 0.65:
            # En terreno llano, usamos el ruido de humedad para plantar bosques
            if forest_noise[r, c] > 0.55:
                img_data[r, c] = FOREST
            else:
                img_data[r, c] = GRASS
        elif e < 0.8:
            # Interpolar color de montaña basado en altura
            intensity = (e - 0.65) / 0.15
            color = np.array(MOUNTAIN_BASE) * (1 - intensity) + np.array(MOUNTAIN_HIGH) * intensity
            img_data[r, c] = color.astype(np.uint8)
        else:
            img_data[r, c] = MOUNTAIN_HIGH

# 4. Generar un Río sinuoso
# Buscamos un punto alto en las montañas para el nacimiento del río
mountain_points = np.argwhere(elevation > 0.65)
if len(mountain_points) > 0:
    start_y, start_x = mountain_points[random.randint(0, len(mountain_points)-1)]
else:
    start_y, start_x = HEIGHT//2, WIDTH//2

curr_x, curr_y = int(start_x), int(start_y)
river_path = []

# El río fluye hacia el punto más bajo, formando meandros naturales por el ruido
for step in range(1500): # Límite de pasos para evitar bucles infinitos
    river_path.append((curr_x, curr_y))
    
    neighbors = []
    for dy in [-1, 0, 1]:
        for dx in [-1, 0, 1]:
            if dx == 0 and dy == 0: continue
            nx, ny = curr_x + dx, curr_y + dy
            if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                neighbors.append((elevation[ny, nx], nx, ny))
    
    if not neighbors: break
    
    neighbors.sort() # Ordenar por elevación (menor primero)
    
    # Elegir el más bajo, o a veces el segundo más bajo para dar variabilidad
    if len(neighbors) > 1 and random.random() < 0.2:
        lowest_e, nx, ny = neighbors[1]
    else:
        lowest_e, nx, ny = neighbors[0]
    
    # Si encontramos un foso o lago natural, formamos un pequeño lago
    if lowest_e >= elevation[curr_y, curr_x]:
        for dy in range(-8, 9):
            for dx in range(-8, 9):
                if dx**2 + dy**2 <= 64: # Círculo de radio 8
                    lx, ly = curr_x + dx, curr_y + dy
                    if 0 <= lx < WIDTH and 0 <= ly < HEIGHT and elevation[ly, lx] <= lowest_e + 0.05:
                        img_data[ly, lx] = SHALLOW_WATER
        break
        
    curr_x, curr_y = nx, ny
    
    # Si llegamos a la costa, desemboca
    if elevation[curr_y, curr_x] < 0.40:
        break

# Dibujar el cauce del río (más ancho)
for rx, ry in river_path:
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            nx, ny = rx + dx, ry + dy
            if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                # Solo reemplazar si es tierra o arena, no destruir montañas enteras
                if elevation[ny, nx] < 0.7:
                    img_data[ny, nx] = SHALLOW_WATER

# 5. Colocar Edificaciones / POIs en zonas viables (llanuras)
def place_poi(quad_xmin, quad_xmax, quad_ymin, quad_ymax, size):
    valid_points = []
    for y in range(quad_ymin, quad_ymax):
        for x in range(quad_xmin, quad_xmax):
            # Buscar pasto que no sea río ni bosque
            if 0.40 <= elevation[y, x] < 0.65 and forest_noise[y, x] <= 0.55:
                # Comprobar que no estemos sobre el agua
                if list(img_data[y, x]) == list(GRASS):
                    valid_points.append((x, y))
    
    if valid_points:
        px, py = random.choice(valid_points)
        # Dibujar base del edificio
        for dy in range(-size, size+1):
            for dx in range(-size, size+1):
                if 0 <= px+dx < WIDTH and 0 <= py+dy < HEIGHT:
                    img_data[py+dy, px+dx] = BUILDING
        # Techo/Centro
        img_data[py, px] = POI
        return True
    return False

# Intentar colocar los 3 POIs originales en cuadrantes similares
place_poi(WIDTH//2, WIDTH, 0, HEIGHT//2, 5) # Castillo Noreste
place_poi(WIDTH//4, 3*WIDTH//4, 0, HEIGHT//2, 3) # Edificio Centro-Norte
place_poi(WIDTH//4, 3*WIDTH//4, HEIGHT//2, HEIGHT, 3) # Edificio Centro-Sur

# Guardar
img = Image.fromarray(img_data)
img.save("mapa_natural.png")
print("Mapa natural generado exitosamente: mapa_natural.png")
