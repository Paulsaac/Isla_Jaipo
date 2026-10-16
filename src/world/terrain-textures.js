// Mismos pesos y texturas. WebGL2 evita muestras cuyo aporte es exactamente cero.
// Gradientes explícitos conservan el filtrado/mipmap incluso en bordes entre materiales.
export function getTerrainTextureBlend(webGL2) {
    if (!webGL2) return `
        #ifdef USE_MAP
            vec4 texelGrass = texture2D(tGrass, vMapUv);
            vec4 texelDirt = texture2D(tDirt, vMapUv);
            float submergedSand = 1.0 - smoothstep(terrainWaterHeight - 0.12, terrainWaterHeight + 0.02, vTerrainHeight);
            vec4 texelSand = mix(texture2D(tSand, vMapUv), texture2D(tWetSand, vMapUv), submergedSand);
            vec4 texelBase = texture2D(tSlab, vMapUv);
            vec4 blendedTexel = texelGrass * vSplat.x + texelDirt * vSplat.y + texelSand * vSplat.z + texelBase * vSplat.w
                + texture2D(tMountain, vMapUv) * vMountain.x
                + texture2D(tRock, vMapUv) * vMountain.y
                + texture2D(tSnow, vMapUv) * vMountain.z
                + texture2D(tSeabed, vMapUv) * vMountain.w
                + texture2D(tWetSand, vMapUv) * vWetSand;
            diffuseColor *= blendedTexel;
        #endif
    `;
    return `
        #ifdef USE_MAP
            vec2 terrainDx = dFdx(vMapUv);
            vec2 terrainDy = dFdy(vMapUv);
            vec4 blendedTexel = vec4(0.0);
            if (vSplat.x > 0.0) blendedTexel += textureGrad(tGrass, vMapUv, terrainDx, terrainDy) * vSplat.x;
            if (vSplat.y > 0.0) blendedTexel += textureGrad(tDirt, vMapUv, terrainDx, terrainDy) * vSplat.y;
            if (vSplat.z > 0.0) {
                float submergedSand = 1.0 - smoothstep(terrainWaterHeight - 0.12, terrainWaterHeight + 0.02, vTerrainHeight);
                vec4 texelSand = mix(textureGrad(tSand, vMapUv, terrainDx, terrainDy), textureGrad(tWetSand, vMapUv, terrainDx, terrainDy), submergedSand);
                blendedTexel += texelSand * vSplat.z;
            }
            if (vSplat.w > 0.0) blendedTexel += textureGrad(tSlab, vMapUv, terrainDx, terrainDy) * vSplat.w;
            if (vMountain.x > 0.0) blendedTexel += textureGrad(tMountain, vMapUv, terrainDx, terrainDy) * vMountain.x;
            if (vMountain.y > 0.0) blendedTexel += textureGrad(tRock, vMapUv, terrainDx, terrainDy) * vMountain.y;
            if (vMountain.z > 0.0) blendedTexel += textureGrad(tSnow, vMapUv, terrainDx, terrainDy) * vMountain.z;
            if (vMountain.w > 0.0) blendedTexel += textureGrad(tSeabed, vMapUv, terrainDx, terrainDy) * vMountain.w;
            if (vWetSand > 0.0) blendedTexel += textureGrad(tWetSand, vMapUv, terrainDx, terrainDy) * vWetSand;
            diffuseColor *= blendedTexel;
        #endif
    `;
}