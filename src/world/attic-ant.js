// Hormiga negra con ojos dibujados en un plano fijo: dos dibujos, sin luces nuevas.
export function createAtticAnt(THREE) {
    const bodyParts = [];
    const up = new THREE.Vector3(0, 1, 0);
    function sphere(parts, color, position, scale, segments = 12, rings = 8) {
        const geometry = new THREE.SphereGeometry(1, segments, rings);
        geometry.scale(...scale); geometry.translate(...position);
        parts.push({ geometry, color });
    }
    function segment(a, b, radius = 0.022) {
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
        const direction = end.clone().sub(start);
        const geometry = new THREE.CylinderGeometry(radius * 0.7, radius, direction.length(), 6);
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, direction.normalize()));
        geometry.translate(...start.add(end).multiplyScalar(0.5).toArray());
        bodyParts.push({ geometry, color: 0x241b18 });
    }
    // Tres volúmenes de insecto y cintura estrecha.
    sphere(bodyParts, 0x493027, [0,0.36,0.32], [0.23,0.24,0.23]);
    sphere(bodyParts, 0x38281f, [0,0.29,-0.04], [0.17,0.17,0.23]);
    sphere(bodyParts, 0x2e211b, [0,0.31,-0.50], [0.25,0.23,0.36]);
    sphere(bodyParts, 0x30201a, [0,0.27,-0.27], [0.095,0.105,0.13], 8,6);
    // Antenas y mandíbulas; los ojos se dibujan después en un solo plano.
    for (const side of [-1,1]) {
        segment([side*0.11,0.54,0.26], [side*0.24,0.75,0.30],0.014);
        segment([side*0.24,0.75,0.30], [side*0.38,0.78,0.45],0.013);
        sphere(bodyParts,0x36281f,[side*0.38,0.78,0.45],[0.023,0.023,0.023],8,6);
        segment([side*0.07,0.25,0.49],[side*0.13,0.23,0.58],0.024);
        segment([side*0.13,0.23,0.58],[side*0.07,0.23,0.62],0.015);
        for (const [z, kneeZ, footZ] of [[0.13,0.30,0.43],[-0.08,-0.04,-0.01],[-0.23,-0.37,-0.53]]) {
            const knee=[side*0.40,0.22,kneeZ],foot=[side*0.56,0.025,footZ];
            segment([side*0.11,0.28,z],knee,0.024);segment(knee,foot,0.02);
            segment(foot,[side*0.62,0.014,footZ+0.04],0.014);
        }
    }
    function merge(parts, material, name) {
        const positions=[],normals=[],colors=[];
        for (const {geometry:source,color:tint} of parts) {
            const geometry=source.toNonIndexed();const color=new THREE.Color(tint);
            positions.push(...geometry.attributes.position.array);normals.push(...geometry.attributes.normal.array);
            for(let i=0;i<geometry.attributes.position.count;i++)colors.push(color.r,color.g,color.b);
            geometry.dispose();source.dispose();
        }
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
        geometry.scale(0.72,0.72,0.72);geometry.computeBoundingBox();geometry.computeBoundingSphere();
        const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.userData={type:'NPC',id:'attic-ant'};return mesh;
    }
    const group=new THREE.Group();group.name='attic-ant';
    group.add(merge(bodyParts,new THREE.MeshPhongMaterial({color:0x090909,specular:0x555555,flatShading:true,shininess:30}),'attic-ant-body'));
    const eyeTexture = new THREE.TextureLoader().load('./imagenes/Sprites/attic-ant-eyes.svg');
    eyeTexture.colorSpace = THREE.SRGBColorSpace;
    const eyes = new THREE.Mesh(new THREE.PlaneGeometry(0.48,0.3825),new THREE.MeshBasicMaterial({
        map:eyeTexture,transparent:true,alphaTest:0.05,side:THREE.DoubleSide,forceSinglePass:true
    }));
    eyes.position.set(0,0.35,0.452);
    eyes.scale.setScalar(0.75);
    eyes.name='attic-ant-fixed-eye-sprite';
    eyes.userData={type:'NPC',id:'attic-ant'};
    // Mesh plano hijo del cuerpo: conserva su orientación y nunca gira hacia la cámara.
    group.add(eyes);
    group.scale.setScalar(1.08);
    return group;
}


// Elegir un rincón izquierdo transitable bajo la cubierta real, sin tapar el hueco.
export function findAtticAntHome(THREE, ant, attic, mapWidth, unitSize) {
    if (!attic?.cells.size) return null;
    const bounds=new THREE.Box3().setFromObject(ant);
    const height=bounds.max.y-bounds.min.y;
    const clearanceX=0.46*ant.scale.x,clearanceZ=0.62*ant.scale.z;
    const cells=[...attic.cells.keys()].map(key=>({x:key%mapWidth,z:Math.floor(key/mapWidth)}));
    const minX=Math.min(...cells.map(c=>c.x))*unitSize-unitSize/2;
    const minZ=Math.min(...cells.map(c=>c.z))*unitSize-unitSize/2;
    const targetX=minX+1.0,targetZ=minZ+1.4;
    let best=null,bestScore=Infinity;
    for(const cell of cells) for(const dx of [-0.75,-0.5,-0.25,0,0.25,0.5,0.75]) for(const dz of [-0.75,-0.5,-0.25,0,0.25,0.5,0.75]) {
        const x=cell.x*unitSize+dx,z=cell.z*unitSize+dz;
        const score=3*(x-targetX)**2+(z-targetZ)**2;
        if(score>=bestScore || Math.hypot(x-attic.holeCenter.x,z-attic.holeCenter.z)<1.7)continue;
        const support=attic.cellAt(x,z);if(!support)continue;
        let fits=true;
        for(const [sx,sz] of [[0,0],[-clearanceX,-clearanceZ],[-clearanceX,clearanceZ],[clearanceX,-clearanceZ],[clearanceX,clearanceZ]]) {
            const neighbor=attic.cellAt(x+sx,z+sz);
            if(!neighbor || Math.abs(neighbor.top-support.top)>0.01 || attic.upperLimit(x+sx,z+sz)<support.top+height+0.06){fits=false;break;}
        }
        if(!fits)continue;
        best={x,y:support.top-bounds.min.y,z,rotationY:Math.atan2(attic.holeCenter.x-x,attic.holeCenter.z-z)};
        bestScore=score;
    }
    return best;
}
