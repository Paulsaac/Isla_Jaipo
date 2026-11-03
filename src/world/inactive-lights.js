// Mantener todas las luces/programas: omitir solo aportes exactamente nulos.
const prepared = new WeakSet();
export function prepareInactiveLights(THREE, root, interiorMask = null) {
    root.traverse(object => {
        let doorRoom=null;
        if(interiorMask&&object.isMesh&&['DOOR','WIZARD_UPPER_DOOR'].includes(object.userData.type)){
            // La hoja móvil puede atravesar varias celdas de iluminación.
            // Mantener un único recinto, tomado de su vano cerrado, para
            // que la luz no se corte a mitad de cara cuando gira.
            const position=object.getWorldPosition(new THREE.Vector3()),unit=interiorMask.uniforms.interiorLightGrid.value.z;
            const x=object.userData.gx??Math.floor(position.x/unit+.5),z=object.userData.gz??Math.floor(position.z/unit+.5);
            const room=interiorMask.roomAt(x,z)||interiorMask.roomAt(x-1,z)||interiorMask.roomAt(x+1,z)
                ||interiorMask.roomAt(x,z-1)||interiorMask.roomAt(x,z+1);
            doorRoom={value:room};
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
            if (!(material?.isMeshPhongMaterial || material?.isMeshStandardMaterial) || prepared.has(material)) continue;
            prepared.add(material);
            const previous = material.onBeforeCompile;
            const key = material.customProgramCacheKey();
            material.onBeforeCompile = function(shader, renderer) {
                previous.call(this, shader, renderer);
                const chunk = THREE.ShaderChunk.lights_fragment_begin;
                const start = chunk.indexOf('getPointLightInfo( pointLight');
                const end = chunk.indexOf('\n\t}', start);
                if (start < 0 || end < 0) return;
                let body = chunk.slice(start, end);
                if (interiorMask) {
                    Object.assign(shader.uniforms, interiorMask.uniforms);
                    shader.fragmentShader = interiorMask.declarations + shader.fragmentShader;
                    if(doorRoom){
                        shader.uniforms.interiorDoorRoom=doorRoom;
                        shader.fragmentShader='uniform float interiorDoorRoom;\n'+shader.fragmentShader;
                    }
                    body = body.replace('getPointLightInfo( pointLight, geometryPosition, directLight );',
                        'getPointLightInfo( pointLight, geometryPosition, directLight );\n' + (doorRoom ? interiorMask.doorPointLight : interiorMask.pointLight));
                }
                // La condición usa color uniforme y conserva íntegro el cálculo de luces encendidas.
                const guarded = 'if (any(notEqual(pointLight.color, vec3(0.0)))) {\n' + body + '\n}';
                shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>',
                    (interiorMask ? chunk.slice(0, start).replace('IncidentLight directLight;',
                        'IncidentLight directLight;\n' + (doorRoom?'vec3 interiorWorldPosition = geometryPosition * mat3(viewMatrix) + cameraPosition;\nvec4 interiorReceiverRoom=vec4(interiorDoorRoom,0.0,0.0,1.0);':interiorMask.receiver)) : chunk.slice(0, start)) + guarded + chunk.slice(end));
            };
            material.customProgramCacheKey = () => key + '-inactive-point-lights-v2' + (interiorMask ? '-interior-mask-v2-'+interiorMask.shaderKey : '')+(doorRoom?'-door-room-v2':'');
        }
    });
}
