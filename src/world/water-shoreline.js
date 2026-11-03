// Una textura de altura compartida; sin pases extra ni lecturas de profundidad por fotograma.
export function createWaterShoreline(THREE, waterHeight) {
    const uniforms={
        shorelineHeights:{value:null},
        shorelineGrid:{value:new THREE.Vector4()},
        shorelineSurface:{value:waterHeight}
    };
    return {
        uniforms,
        setTerrain({positions,verticesW,segmentsH,subdivisions},unitSize) {
            const height=segmentsH+1,data=new Float32Array(verticesW*height);
            for(let i=0;i<data.length;i++)data[i]=positions[i*3+1];
            const texture=new THREE.DataTexture(data,verticesW,height,THREE.RedFormat,THREE.FloatType);
            // El shader reconstruye los mismos triángulos de la malla, sin interpolación bilineal.
            texture.minFilter=texture.magFilter=THREE.NearestFilter;
            texture.generateMipmaps=false;texture.unpackAlignment=1;texture.needsUpdate=true;
            uniforms.shorelineHeights.value?.dispose();
            uniforms.shorelineHeights.value=texture;
            uniforms.shorelineGrid.value.set(verticesW,height,unitSize/subdivisions,unitSize/subdivisions);
        }
    };
}
