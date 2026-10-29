// Mismos pesos y texturas. WebGL2 evita muestras cuyo aporte es exactamente cero.
// Gradientes explícitos conservan el filtrado/mipmap incluso en bordes entre materiales.
export function getTerrainTextureBlend(webGL2) {
    const summitBlend = `
        vec2 summitEdge=min(vTerrainPosition.xz-summitPathBounds.xy,summitPathBounds.zw-vTerrainPosition.xz);
        float summitPathWeight=smoothstep(0.0,2.0,min(summitEdge.x,summitEdge.y))
            *smoothstep(summitPathLevel,summitPathLevel+2.0,vTerrainHeight);
        vec2 summitPathUv=(vTerrainPosition.xz-summitPathBounds.xy)/(summitPathBounds.zw-summitPathBounds.xy);
        float summitGroundDistance=-4.0;
        float summitGroundOpacity=0.0;
        if(summitPathWeight>0.0) {
            vec4 groundTexel=texture2D(tSummitGround,summitPathUv);
            summitGroundDistance=(groundTexel.r-0.5)*8.0;
            summitGroundOpacity=groundTexel.${webGL2 ? 'g' : 'a'};
        }
        float summitGroundCoverage=summitGroundOpacity*summitPathWeight;
        float summitRepaintWeight=smoothstep(-3.0,-1.5,summitGroundDistance)*summitPathWeight;
    `;
    const snowBlend = `
        vec3 snowNormal=normalize(vTerrainNormal);
        vec3 snowAxes=pow(abs(snowNormal),vec3(4.0));
        snowAxes/=max(dot(snowAxes,vec3(1.0)),0.0001);
        vec3 snowPosition=vTerrainPosition*0.5;
        // Lenguas angulares de amplitud y anchura desiguales alrededor de la cima.
        // Se repite exactamente en la unión angular y conserva una cota alta común.
        vec2 snowXZ=vTerrainPosition.xz-vec2(286.0,256.0);
        float snowAngle=atan(snowXZ.y,snowXZ.x);
        float snowSector=(snowAngle+3.14159265)*7.63943727
            +sin(snowAngle*3.0+0.7)*0.55+sin(snowAngle*7.0-1.3)*0.3
            +sin(vTerrainHeight*0.16+snowAngle*11.0)*0.07;
        float sector=floor(snowSector),along=fract(snowSector);
        vec3 irregular=fract(sin(mod(vec3(sector,sector+1.0,sector+17.0),48.0)*127.1+311.7)*43758.5453);
        float tipPosition=0.25+irregular.z*0.5;
        float tongue=along<tipPosition?along/tipPosition:(1.0-along)/(1.0-tipPosition);
        float snowLine=96.0+mix(irregular.x,irregular.y,along)*6.0
            -pow(tongue,1.4)*(4.0+irregular.z*23.0)
            +sin(snowXZ.x*0.61+sin(snowXZ.y*0.37))*0.8;
        // Erosión en dos escalas y una mezcla ancha que disuelve también las puntas.
        float snowErosion=sin(snowXZ.x*0.41+sin(snowXZ.y*0.37)*1.8)
            *sin(snowXZ.y*0.62+sin(snowXZ.x*0.27));
        float snowGrain=sin(snowXZ.x*2.7+snowXZ.y*1.3)
            *sin(snowXZ.y*3.1-snowXZ.x*1.7);
        snowLine+=snowErosion*1.6+snowGrain*0.45;
        float snowEdge=vTerrainHeight-snowLine;
        float snowSoftness=mix(3.0,5.5,smoothstep(-0.5,0.6,snowErosion))
            +smoothstep(0.55,1.0,tongue)*3.0;
        ${webGL2 ? 'snowSoftness=max(snowSoftness,fwidth(snowEdge)*1.7);' : ''}
        float summitMountainWeight=vMountain.x+vMountain.z+vSplat.y*summitRepaintWeight;
        float snowCoverage=summitMountainWeight
            *smoothstep(-snowSoftness,snowSoftness,snowEdge)
            *mix(0.65,1.0,smoothstep(0.25,0.65,abs(snowNormal.y)));
        float exposedMountain=summitMountainWeight-snowCoverage;
    `;
    if (!webGL2) return `
        #ifdef USE_MAP
            ${summitBlend}
            ${snowBlend}
            vec4 texelGrass = texture2D(tGrass, vMapUv);
            vec4 texelDirt = texture2D(tDirt, vMapUv);
            vec4 summitTexel=texture2D(tSummitPath,summitPathUv);
            float summitStoneMask=step(0.75,summitTexel.a)*step(0.99,summitPathWeight);
            float submergedSand = 1.0 - smoothstep(terrainWaterHeight - 0.12, terrainWaterHeight + 0.02, vTerrainHeight);
            vec4 texelSand = mix(texture2D(tSand, vMapUv), texture2D(tWetSand, vMapUv), submergedSand);
            vec4 texelBase = texture2D(tSlab, vMapUv);
            vec4 blendedTexel = texelGrass * vSplat.x + texelDirt * vSplat.y * (1.0-summitRepaintWeight) + texelSand * vSplat.z + texelBase * vSplat.w
                + texture2D(tMountain, vMapUv) * exposedMountain
                + texture2D(tRock, vMapUv) * vMountain.y
                + (texture2D(tSnow,snowPosition.zy)*snowAxes.x
                    + texture2D(tSnow,vMapUv)*snowAxes.y
                    + texture2D(tSnow,snowPosition.xy)*snowAxes.z)*snowCoverage
                + texture2D(tSeabed, vMapUv) * vMountain.w
                + texture2D(tWetSand, vMapUv) * vWetSand;
            blendedTexel.rgb=mix(blendedTexel.rgb,texelDirt.rgb,summitGroundCoverage);
            blendedTexel.rgb=mix(blendedTexel.rgb,summitTexel.rgb,summitStoneMask);
            diffuseColor *= blendedTexel;
        #endif
    `;
    return `
        #ifdef USE_MAP
            vec2 terrainDx = dFdx(vMapUv);
            vec2 terrainDy = dFdy(vMapUv);
            ${summitBlend}
            vec4 texelDirt=vec4(0.0);
            if(vSplat.y>0.0||summitGroundCoverage>0.0)texelDirt=textureGrad(tDirt,vMapUv,terrainDx,terrainDy);
            vec2 summitDx=dFdx(summitPathUv),summitDy=dFdy(summitPathUv);
            vec4 summitTexel=vec4(0.0);
            if(summitPathWeight>0.0)summitTexel=textureGrad(tSummitPath,summitPathUv,summitDx,summitDy);
            float summitStoneMask=step(0.75,summitTexel.a)*step(0.99,summitPathWeight);
            ${snowBlend}
            vec3 snowDx=dFdx(snowPosition),snowDy=dFdy(snowPosition);
            vec4 blendedTexel = vec4(0.0);
            if (vSplat.x > 0.0) blendedTexel += textureGrad(tGrass, vMapUv, terrainDx, terrainDy) * vSplat.x;
            if (vSplat.y > 0.0) {
                blendedTexel+=texelDirt*vSplat.y*(1.0-summitRepaintWeight);
            }
            if (vSplat.z > 0.0) {
                float submergedSand = 1.0 - smoothstep(terrainWaterHeight - 0.12, terrainWaterHeight + 0.02, vTerrainHeight);
                vec4 texelSand = mix(textureGrad(tSand, vMapUv, terrainDx, terrainDy), textureGrad(tWetSand, vMapUv, terrainDx, terrainDy), submergedSand);
                blendedTexel += texelSand * vSplat.z;
            }
            if (vSplat.w > 0.0) blendedTexel += textureGrad(tSlab, vMapUv, terrainDx, terrainDy) * vSplat.w;
            if (exposedMountain > 0.0) blendedTexel += textureGrad(tMountain, vMapUv, terrainDx, terrainDy) * exposedMountain;
            if (vMountain.y > 0.0) blendedTexel += textureGrad(tRock, vMapUv, terrainDx, terrainDy) * vMountain.y;
            if (snowCoverage > 0.0) blendedTexel += (
                textureGrad(tSnow,snowPosition.zy,snowDx.zy,snowDy.zy)*snowAxes.x
                + textureGrad(tSnow,vMapUv,terrainDx,terrainDy)*snowAxes.y
                + textureGrad(tSnow,snowPosition.xy,snowDx.xy,snowDy.xy)*snowAxes.z)*snowCoverage;
            if (vMountain.w > 0.0) blendedTexel += textureGrad(tSeabed, vMapUv, terrainDx, terrainDy) * vMountain.w;
            if (vWetSand > 0.0) blendedTexel += textureGrad(tWetSand, vMapUv, terrainDx, terrainDy) * vWetSand;
            blendedTexel.rgb=mix(blendedTexel.rgb,texelDirt.rgb,summitGroundCoverage);
            blendedTexel.rgb=mix(blendedTexel.rgb,summitTexel.rgb,summitStoneMask);
            diffuseColor *= blendedTexel;
        #endif
    `;
}
