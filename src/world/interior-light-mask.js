// Recintos de iluminación; no modifica las capas, las alturas ni las colisiones del mundo.
export function createInteriorLightMask(THREE, width, height, unitSize, boundsAt, doors = []) {
    const data = new Float32Array(width * height * 4);
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
        const bounds = boundsAt(x, z);
        if (!bounds) continue;
        const offset = (z * width + x) * 4;
        data[offset + 1] = bounds.floor;
        data[offset + 2] = bounds.ceiling;
        data[offset + 3] = 1;
    }
    let room = 0;
    const queue = [];
    for (let cell = 0; cell < width * height; cell++) {
        if (!data[cell * 4 + 3] || data[cell * 4]) continue;
        data[cell * 4] = ++room;
        queue.length = 0; queue.push(cell);
        for (let head = 0; head < queue.length; head++) {
            const current = queue[head], x = current % width, z = Math.floor(current / width);
            for (const [nx, nz] of [[x-1,z],[x+1,z],[x,z-1],[x,z+1]]) {
                if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
                const next = nz * width + nx;
                if (!data[next * 4 + 3] || data[next * 4]) continue;
                data[next * 4] = room; queue.push(next);
            }
        }
    }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    const roomAt=(x,z)=>x>=0&&z>=0&&x<width&&z<height?data[(z*width+x)*4]:0;
    // Guardar los vanos cerrados: la hoja gira, la abertura permanece fija.
    const portals=doors.map(door=>{
        door.updateWorldMatrix(true,false);
        const box=new THREE.Box3().setFromObject(door),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
        const x=Math.floor(center.x/unitSize+.5),z=Math.floor(center.z/unitSize+.5);
        const id=roomAt(x,z)||roomAt(x-1,z)||roomAt(x+1,z)||roomAt(x,z-1)||roomAt(x,z+1);
        const horizontal=size.x>size.z;
        return {door,id,center,horizontal,half:new THREE.Vector3(horizontal?size.x/2:unitSize*.55,size.y/2,horizontal?unitSize*.55:size.z/2),closedAngle:door.parent.rotation.y};
    }).filter(portal=>portal.id>0);
    const roomSlots=new Map();
    for(const portal of portals){portal.slot=roomSlots.get(portal.id)??0;roomSlots.set(portal.id,portal.slot+1);}
    // Una fila por recinto evita recorrer las puertas de toda la isla por luz.
    const capacity=Math.max(1,...roomSlots.values()),portalWidth=capacity*2;
    const portalData=new Float32Array(portalWidth*(room+1)*4);
    const portalTexture=new THREE.DataTexture(portalData,portalWidth,room+1,THREE.RGBAFormat,THREE.FloatType);
    portalTexture.minFilter=portalTexture.magFilter=THREE.NearestFilter;portalTexture.needsUpdate=true;
    const portalCount={value:0};
    function updateDoors(){
        let count=0,changed=false;
        for(const portal of portals){
            const opening=Math.min(1,Math.abs(Math.sin(portal.door.parent.rotation.y-portal.closedAngle)));
            if(opening>=.01)count++;
            if(portal.opening===opening)continue;
            portal.opening=opening;changed=true;
            const offset=(portal.id*portalWidth+portal.slot*2)*4;
            portalData.set([portal.center.x,portal.center.y,portal.center.z,opening],offset);
            portalData.set([portal.half.x*(portal.horizontal?opening:1),portal.half.y,portal.half.z*(portal.horizontal?1:opening),opening],offset+4);
        }
        if(changed)portalTexture.needsUpdate=true;
        portalCount.value=count;
    }
    return {
        texture,
        roomAt,updateDoors,shaderKey:`portals-${capacity}`,
        uniforms: {
            interiorLightMask: {value: texture},
            interiorLightGrid: {value: new THREE.Vector3(width, height, unitSize)},
            interiorPortalCount:portalCount,
            interiorDoorPortals:{value:portalTexture},interiorPortalGrid:{value:new THREE.Vector2(portalWidth,room+1)}
        },
        declarations: `
            uniform sampler2D interiorLightMask;
            uniform vec3 interiorLightGrid;
            uniform int interiorPortalCount;
            uniform sampler2D interiorDoorPortals;
            uniform vec2 interiorPortalGrid;
            float interiorDoorTransmission(vec3 source,vec3 receiver,vec3 outside,float room) {
                if(interiorPortalCount==0)return 0.0;
                vec3 direction=receiver-source;
                float transmission=0.0;
                // WebGL 2 conserva un bucle dinámico: evita expandir las
                // consultas de todos los vanos por cada luz al compilar.
                #if __VERSION__ >= 300
                for(int i=0;i<int(interiorPortalGrid.x*.5);i++) {
                #else
                for(int i=0;i<${capacity};i++) {
                #endif
                    vec2 uv=vec2(float(i)*2.0+.5,room+.5)/interiorPortalGrid;
                    vec4 portal=texture2D(interiorDoorPortals,uv);
                    if(portal.w<.01)continue;
                    vec4 halfOpen=texture2D(interiorDoorPortals,uv+vec2(1.0/interiorPortalGrid.x,0.0));
                    bool normalX=halfOpen.x>halfOpen.z;
                    float outsideAxis=normalX?outside.x-portal.x:outside.z-portal.z;
                    float delta=normalX?direction.x:direction.z;
                    // Cruzar la cara exterior del vano, no entrar por un lado
                    // de su volumen y atravesar después la pared adyacente.
                    if(abs(outsideAxis)<interiorLightGrid.z*.5-.04||abs(delta)<.00001)continue;
                    float plane=(normalX?portal.x:portal.z)+sign(outsideAxis)*interiorLightGrid.z*.5;
                    float t=(plane-(normalX?source.x:source.z))/delta;
                    if(t<0.0||t>1.0)continue;
                    vec3 hit=source+direction*t-portal.xyz;
                    float edge=min(halfOpen.y-abs(hit.y),normalX?halfOpen.z-abs(hit.z):halfOpen.x-abs(hit.x));
                    transmission=max(transmission,smoothstep(-.02,.04,edge)*smoothstep(0.0,.12,halfOpen.w));
                }
                return transmission;
            }
            vec4 interiorRoomAt(vec3 position) {
                vec2 cell = floor(position.xz / interiorLightGrid.z + 0.5);
                if (any(lessThan(cell, vec2(0.0))) || any(greaterThanEqual(cell, interiorLightGrid.xy))) return vec4(0.0);
                vec4 room = texture2D(interiorLightMask, (cell + 0.5) / interiorLightGrid.xy);
                if (position.y < room.g - 0.08 || position.y > room.b + 0.03) return vec4(0.0);
                return room;
            }
        `,
        receiver: `
            vec3 interiorWorldPosition = geometryPosition * mat3(viewMatrix) + cameraPosition;
            vec3 interiorWorldNormal = geometryNormal * mat3(viewMatrix);
            vec4 interiorReceiverRoom = interiorRoomAt(interiorWorldPosition + interiorWorldNormal * 0.04);
        `,
        // La hoja es la frontera móvil entre exterior y recinto. Recibe luz
        // de ambos lados sin proyectar el vano fijo sobre su propia cara.
        doorPointLight: `
            vec3 interiorSourcePosition = pointLight.position * mat3(viewMatrix) + cameraPosition;
            vec4 interiorSourceRoom = interiorRoomAt(interiorSourcePosition);
            if (interiorSourceRoom.r > 0.0 && abs(interiorSourceRoom.r - interiorDoorRoom) > 0.25)
                directLight.color = vec3(0.0);
        `,
        pointLight: `
            vec3 interiorSourcePosition = pointLight.position * mat3(viewMatrix) + cameraPosition;
            vec4 interiorSourceRoom = interiorRoomAt(interiorSourcePosition);
            if (directLight.visible && max(interiorSourceRoom.r,interiorReceiverRoom.r) > 0.0 && abs(interiorSourceRoom.r - interiorReceiverRoom.r) > 0.25)
                directLight.color *= interiorDoorTransmission(interiorSourcePosition,interiorWorldPosition,
                    interiorSourceRoom.r>0.0?interiorWorldPosition:interiorSourcePosition,
                    interiorSourceRoom.r>0.0?interiorSourceRoom.r:interiorReceiverRoom.r);
        `
    };
}
