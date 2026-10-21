#!/usr/bin/env python3
"""Regenera la maqueta de portada solo a pedido del usuario."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import struct
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

PALETTE = {
    'SEA_ALGA': (22,125,141), 'SEA_CORAL': (200,95,173), 'SEA_GRASS': (54,201,182), 'SEA_HEART_FRAGMENT': (117,250,141),
    'WATER': (0,162,232), 'WATER_ROCK': (50,130,246), 'GRASS': (0,128,0),
    'TALL_GRASS': (34,177,76), 'TREE': (127,127,127), 'BUSH': (60,47,127),
    'SAND': (255,201,14), 'WET_SAND': (125,98,7), 'DIRT': (237,28,36),
    'FENCE': (201,57,18), 'MOUNTAIN': (185,122,87), 'PEAK': (200,191,231),
    'SNOW_PEAK': (255,255,255), 'SNOW_SLOPE': (167,236,255),
    'WOOD': (255,242,0), 'CHEST': (255,174,201), 'INDOOR_FLOOR': (136,0,21),
    'BUILDING': (163,73,164), 'ROOF': (0,96,100),
    'DOOR_UNLOCKED': (0,0,0), 'DOOR_LOCKED': (181,230,29),
    'POI': (63,72,204), 'BOAT': (210,20,90), 'OTHER': (112,146,190),
    'OTHER2': (178,235,242), 'TORCH': (153,217,234),
    'EXTERNAL_TORCH': (80,114,122),
}
COLORS = {
    'SEA_ALGA': (59,116,149), 'SEA_CORAL': (59,116,149), 'SEA_GRASS': (59,116,149), 'SEA_HEART_FRAGMENT': (59,116,149),
    'WATER': (59,116,149), 'WATER_ROCK': (71,137,164),
    'GRASS': (72,111,58), 'TALL_GRASS': (76,119,62),
    'TREE': (56,93,49), 'BUSH': (58,96,52),
    'SAND': (180,149,106), 'WET_SAND': (150,128,91),
    'DIRT': (153,126,90), 'FENCE': (112,91,64),
    'MOUNTAIN': (77,68,58), 'PEAK': (94,83,71),
    'SNOW_PEAK': (222,229,228), 'SNOW_SLOPE': (200,210,207),
    'WOOD': (108,82,60), 'CHEST': (108,82,60),
    'INDOOR_FLOOR': (108,82,60), 'BUILDING': (99,84,67),
    'ROOF': (46,54,54), 'DOOR_UNLOCKED': (99,84,67),
    'DOOR_LOCKED': (99,84,67), 'POI': (99,84,67),
    'BOAT': (59,116,149), 'OTHER': (84,79,66),
    'OTHER2': (72,111,58), 'TORCH': (72,111,58),
    'EXTERNAL_TORCH': (72,111,58),
}
NAMES = list(PALETTE)
STEP = 2

def classify(image):
    pixels = np.asarray(image.convert('RGBA'))
    rgb = pixels[:,:,:3].astype(np.int32)
    best = np.full(rgb.shape[:2], 10**9, dtype=np.int32)
    kinds = np.zeros(best.shape, dtype=np.uint8)
    for index, name in enumerate(NAMES):
        if name in ('SNOW_SLOPE','SEA_ALGA','SEA_CORAL','SEA_GRASS','SEA_HEART_FRAGMENT'):
            continue
        color = np.array(PALETTE[name], dtype=np.int32)
        distance = np.sum((rgb-color)**2, axis=2, dtype=np.int32)
        if name == 'BOAT':
            distance[np.abs(rgb[:,:,2]-color[2]) > 30] = 10**9
        selected = distance < best
        best[selected] = distance[selected]
        kinds[selected] = index
    for exact in ('SNOW_SLOPE','SEA_ALGA','SEA_CORAL','SEA_GRASS','SEA_HEART_FRAGMENT'):
        kinds[np.all(rgb == PALETTE[exact], axis=2)] = NAMES.index(exact)
    kinds[pixels[:,:,3] < 128] = NAMES.index('GRASS')
    return kinds

def roof_rectangles(mask, height):
    depth, width = mask.shape
    seen = np.zeros(mask.shape, dtype=bool)
    result = []
    for z in range(depth):
        for x in range(width):
            if not mask[z,x] or seen[z,x]:
                continue
            queue = deque([(x,z)])
            seen[z,x] = True
            cells = []
            while queue:
                cx,cz = queue.popleft()
                cells.append((cx,cz))
                for nx,nz in ((cx-1,cz),(cx+1,cz),(cx,cz-1),(cx,cz+1)):
                    if 0 <= nx < width and 0 <= nz < depth and mask[nz,nx] and not seen[nz,nx]:
                        seen[nz,nx] = True
                        queue.append((nx,nz))
            if len(cells) < 12:
                continue
            xs,zs = zip(*cells)
            result.append((float(min(xs)),float(min(zs)),float(max(xs)-min(xs)+1),
                           float(max(zs)-min(zs)+1),
                           float(np.max([height[cz,cx] for cx,cz in cells]))))
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    root = args.project.resolve()
    sources = [root/'imagenes/Mapa/capa1.png', root/'imagenes/Mapa/capa2.png']
    if any(not p.is_file() for p in sources):
        raise SystemExit('Falta una capa PNG; maqueta intacta.')
    with Image.open(sources[0]) as base, Image.open(sources[1]) as roof:
        if base.size != roof.size:
            raise SystemExit('Las capas deben tener el mismo tamaño.')
        width,depth = base.size
        floor = classify(base)
        roof_kinds = classify(roof)
    water = np.isin(floor,[NAMES.index(k) for k in ('WATER','WATER_ROCK','BOAT','SEA_ALGA','SEA_CORAL','SEA_GRASS','SEA_HEART_FRAGMENT')])
    land = ~water
    # Las orillas usan una máscara suavizada; se recorta cada triángulo en su contorno.
    # Así el terreno nunca forma picos rectangulares sobre el mar.
    coverage_map = np.asarray(Image.fromarray((land*255).astype(np.uint8),'L')
                              .filter(ImageFilter.GaussianBlur(4)),dtype=np.float32)/255
    target = np.full((depth,width),1,dtype=np.uint8)
    for kind,level in [('MOUNTAIN',25),('SNOW_SLOPE',40),('PEAK',52),('SNOW_PEAK',66)]:
        target[floor==NAMES.index(kind)] = level
    mountain = np.isin(floor,[NAMES.index(k) for k in
                              ('MOUNTAIN','PEAK','SNOW_SLOPE','SNOW_PEAK')])
    # Base ancha de ladera y cima separada: la primera se funde con la playa,
    # mientras la nieve conserva su silueta sin picos triangulares.
    mountain_base = np.asarray(Image.fromarray((mountain*255).astype(np.uint8),'L')
                               .filter(ImageFilter.GaussianBlur(14)),dtype=np.float32)/255
    summit = np.maximum(target.astype(np.float32)-25,0)
    summit = np.asarray(Image.fromarray(summit.astype(np.uint8),'L')
                        .filter(ImageFilter.GaussianBlur(5)),dtype=np.float32)
    # Distancia al pie de la montaña: laderas continuas, sin una meseta
    # marrón plana alrededor de la cima. Se calcula solo al regenerar.
    distance = np.zeros((depth,width),dtype=np.uint8)
    interior = np.asarray(Image.fromarray((mountain*255).astype(np.uint8),'L')
                          .filter(ImageFilter.MaxFilter(17))
                          .filter(ImageFilter.MinFilter(17))) > 127
    for level in range(1,128):
        if not interior.any(): break
        distance[interior] = level
        interior = (interior & np.roll(interior,1,0) & np.roll(interior,-1,0)
                    & np.roll(interior,1,1) & np.roll(interior,-1,1))
        interior[[0,-1],:] = False
        interior[:,[0,-1]] = False
    distance = np.asarray(Image.fromarray(distance,'L')
                          .filter(ImageFilter.GaussianBlur(2)),dtype=np.float32)
    height = 1+34*(distance/max(1,float(distance.max())))**0.9+summit*0.75
    snow_strength = np.zeros((depth,width),dtype=np.uint8)
    snow_strength[floor==NAMES.index('SNOW_SLOPE')] = 165
    snow_strength[floor==NAMES.index('SNOW_PEAK')] = 255
    snow_strength[floor==NAMES.index('PEAK')] = 30
    snow_blur = np.asarray(Image.fromarray(snow_strength,'L')
                           .filter(ImageFilter.GaussianBlur(4)),dtype=np.float32)/255
    mountain_blur = np.asarray(Image.fromarray((mountain*255).astype(np.uint8),'L')
                               .filter(ImageFilter.GaussianBlur(9)),dtype=np.float32)/255
    inland = np.asarray(Image.fromarray((land*255).astype(np.uint8),'L')
                        .filter(ImageFilter.GaussianBlur(16)),dtype=np.float32)/255
    inland = np.clip((inland-0.5)*3.0,0,1)
    zz,xx = np.indices((depth,width))
    # El mapa marca roca hasta la orilla oeste; en la maqueta esa punta
    # proyectada parece un triángulo suspendido. Fundirla con la playa.
    west_taper = np.clip((xx-48)/72,0,1)
    relief_taper = inland*west_taper
    height = 1+(height-1)*relief_taper
    # El descenso del relieve no cambia el color de roca de la cola occidental.
    # Aristas amplias y coherentes, horneadas en la malla, sin ruido animado.
    peak_z,peak_x = np.argwhere(floor==NAMES.index('SNOW_PEAK')).mean(axis=0)
    angle = np.arctan2(zz-peak_z,xx-peak_x)
    radius = np.hypot(xx-peak_x,zz-peak_z)
    ridges = np.cos(angle*11+np.sin(radius*0.045))*1.6
    height += mountain_blur*relief_taper*ridges*np.clip(radius/22,0,1)
    rock_variation = ((xx*73856093 ^ zz*19349663) % 17)/8-1

    xs = list(range(0,width,STEP))
    zs = list(range(0,depth,STEP))
    if xs[-1] != width-1: xs.append(width-1)
    if zs[-1] != depth-1: zs.append(depth-1)
    cols,rows = len(xs),len(zs)
    positions = []
    colors = []
    coverage = []
    shore_linear = None
    def linear_color(rgb):
        srgb = np.asarray(rgb,dtype=np.float32)/255
        return np.rint(np.where(srgb<=0.04045,srgb/12.92,
                                ((srgb+0.055)/1.055)**2.4)*255).astype(np.uint8)
    shore_linear = linear_color(COLORS['SAND'])
    broad_water = np.asarray(Image.fromarray((water*255).astype(np.uint8),'L')
                              .filter(ImageFilter.GaussianBlur(8)),dtype=np.float32)/255
    for z in zs:
        for x in xs:
            kind = NAMES[int(floor[z,x])]
            rgb = np.asarray(COLORS['GRASS'] if mountain[z,x] else COLORS[kind],dtype=np.float32)
            if mountain_blur[z,x]>0.15:
                # Frontera corta en lugar del antiguo degradado de decenas de píxeles.
                m = float(np.clip((mountain_blur[z,x]-0.15)/0.10,0,1))
                rock = np.array((104,98,86),dtype=np.float32)
                rock += round(float(rock_variation[z,x])*2)*2
                rgb = rgb*(1-m)+rock*m
                snow = float(np.clip((snow_blur[z,x]-0.32)/0.12,0,1))
                snow_color = np.array((221,229,231))+round(float(rock_variation[z,x])*2)*2
                rgb = rgb*(1-snow)+snow_color*snow
            shore_mix = float(np.clip((0.92-coverage_map[z,x])/0.42,0,1)
                              *np.clip((broad_water[z,x]-0.24)/0.20,0,1))
            rgb = rgb*(1-shore_mix)+np.array(COLORS['SAND'])*shore_mix
            positions.append((float(x),float(height[z,x]),float(z)))
            colors.append(linear_color(rgb))
            coverage.append(float(coverage_map[z,x]))
    # Compartir cada vértice de intersección: sin grietas entre celdas.
    edge_cache = {}
    def shore_vertex(a,b):
        key = (min(a,b),max(a,b))
        if key in edge_cache:
            return edge_cache[key]
        t = (0.5-coverage[a])/(coverage[b]-coverage[a])
        pa,pb = np.asarray(positions[a]),np.asarray(positions[b])
        point = pa+(pb-pa)*t
        point[1] = max(0.4,min(point[1],1.6))
        index = len(positions)
        positions.append(tuple(point))
        colors.append(shore_linear)
        edge_cache[key] = index
        return index
    triangles = []
    for gz in range(rows-1):
        for gx in range(cols-1):
            a = gz*cols+gx
            b = a+cols
            for tri in ((a,b,a+1),(b,b+1,a+1)):
                polygon = []
                for current,following in zip(tri,tri[1:]+tri[:1]):
                    if coverage[current]>=0.5:
                        polygon.append(current)
                    if (coverage[current]>=0.5)!=(coverage[following]>=0.5):
                        polygon.append(shore_vertex(current,following))
                for i in range(1,len(polygon)-1):
                    triangles.extend((polygon[0],polygon[i],polygon[i+1]))
    positions = np.asarray(positions,dtype='<f4')
    colors = np.asarray(colors,dtype=np.uint8)
    indices = np.asarray(triangles,dtype='<u4')
    trees = []
    for z in range(3,depth,7):
        for x in range(3,width,7):
            if np.count_nonzero(floor[max(0,z-2):min(depth,z+3),max(0,x-2):min(width,x+3)] == NAMES.index('TREE')) < 3:
                continue
            px = min(width-1,max(0,x+(x*13+z*29)%5-2))
            pz = min(depth-1,max(0,z+(x*17+z*11)%5-2))
            if not water[pz,px]:
                trees.append((float(px),float(height[pz,px]),float(pz),
                              0.85+((x*19+z*7)%9)/20))
    roofs = roof_rectangles(roof_kinds==NAMES.index('ROOF'),height)
    entities = root/'src/content/entities.js'
    match = re.search(r'spawnRoomExit\s*=\s*\{\s*x:\s*(\d+)\s*,\s*z:\s*(\d+)',
                      entities.read_text(encoding='utf-8'))
    if not match:
        raise SystemExit('No se encontró la casa de Graham; maqueta intacta.')
    home_x,home_z = map(int,match.groups())
    payload = b''.join((positions.tobytes(),colors.tobytes(),indices.tobytes(),
                        np.asarray(trees,dtype='<f4').reshape(-1,4).tobytes(),
                        np.asarray(roofs,dtype='<f4').reshape(-1,5).tobytes()))
    data = struct.pack('<4s8I',b'IJM2',width,depth,len(positions),indices.size,
                       len(trees),len(roofs),home_x,home_z)+payload
    output = args.output or root/'imagenes/Portada/isla-maqueta.bin'
    output.parent.mkdir(parents=True,exist_ok=True)
    temp = output.with_suffix('.bin.tmp')
    temp.write_bytes(data)
    temp.replace(output)
    manifest = {'format':'IJM2','map':[width,depth], 'step':STEP,
                'sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
                'vertices':len(positions),'triangles':indices.size//3,'trees':len(trees),
                'roofs':len(roofs),'home':[home_x,home_z],'bytes':len(data)}
    output.with_suffix('.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False))

if __name__=='__main__':
    main()
