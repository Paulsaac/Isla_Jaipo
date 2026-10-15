// Huerto modesto: tres canteros y dos cajas, con una malla por elemento.
export function createKitchenGarden(THREE, origin, getTerrainHeight) {
    const material = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 0 });
    const colors = { soil: 0x513827, wood: 0x80603d, edge: 0x62472e, green: 0x42713a, light: 0x77a44b, red: 0xb83b24, orange: 0xc87429 };
    let pieces = [];
    const models = [];
    function add(source, color, transform) {
        const geometry = source.index ? source.toNonIndexed() : source;
        if (geometry !== source) source.dispose();
        transform?.(geometry);
        const tint = new THREE.Color(color), data = new Float32Array(geometry.attributes.position.count * 3);
        for (let i=0; i<data.length; i+=3) { data[i]=tint.r; data[i+1]=tint.g; data[i+2]=tint.b; }
        geometry.setAttribute('color', new THREE.BufferAttribute(data,3));
        pieces.push(geometry);
    }
    const box = (w,h,d,x,y,z,color) => add(new THREE.BoxGeometry(w,h,d),color,g=>g.translate(x,y,z));
    function stem(a,b,r,color) {
        const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), direction=end.clone().sub(start);
        add(new THREE.CylinderGeometry(r*0.75,r,direction.length(),5),color,g=>{
            g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
            g.translate(...start.add(end).multiplyScalar(0.5).toArray());
        });
    }
    function leaf(x,y,z,size,angle,tilt,color) {
        add(new THREE.SphereGeometry(1,5,3),color,g=>{
            g.scale(size*0.43,size*0.12,size); g.rotateX(tilt); g.rotateY(angle); g.translate(x,y,z);
        });
    }
    function tomato(x,y,z,r=0.085) {
        add(new THREE.IcosahedronGeometry(r,1),colors.red,g=>{g.scale(1,0.88,1);g.translate(x,y,z);});
        for(let i=0;i<3;i++) leaf(x,y+r*0.8,z,r*0.4,i*Math.PI*2/3,0,colors.green);
    }
    function finish(id,x,z) {
        const geometry=new THREE.BufferGeometry();
        for(const attribute of ['position','normal','color']) {
            const data=new Float32Array(pieces.reduce((sum,g)=>sum+g.attributes[attribute].array.length,0));
            let offset=0;
            for(const part of pieces) {data.set(part.attributes[attribute].array,offset);offset+=part.attributes[attribute].array.length;}
            geometry.setAttribute(attribute,new THREE.BufferAttribute(data,3));
        }
        for(const part of pieces) part.dispose();
        pieces=[];
        geometry.computeBoundingBox(); geometry.computeBoundingSphere();
        const model=new THREE.Mesh(geometry,material);
        model.name=`graham-garden-${id}`;
        model.position.set(origin.x+x,getTerrainHeight(origin.x+x,origin.z+z),origin.z+z);
        model.userData={type:'GARDEN',id:model.name};
        models.push(model);
    }
    for(let row=0;row<3;row++) {
        // La base penetra en el terreno; los bordes de madera quedan bajos.
        box(1.1,0.4,2.65,0,-0.08,0,colors.soil);
        for(const side of [-1,1]) {
            box(0.07,0.3,2.79,side*0.585,0.055,0,colors.wood);
            box(1.24,0.3,0.07,0,0.055,side*1.36,colors.wood);
        }
        for(const z of [-0.88,0,0.88]) {
            if(row===0) {
                stem([0.1,0.12,z],[0.1,1.28,z],0.022,colors.wood);
                stem([0,0.12,z],[0.015,1.12,z],0.017,colors.green);
                for(let i=0;i<4;i++) {
                    const side=i%2 ? -1 : 1, y=0.42+i*0.17;
                    stem([0,y-0.08,z],[side*0.22,y,z+0.06],0.008,colors.green);
                    leaf(side*0.19,y,z+0.065,0.16,side*0.8,0.3,colors.green);
                    if(i<3) tomato(side*0.16,y-0.08,z+0.14);
                }
                box(0.13,0.015,0.025,0.045,0.76,z,colors.edge);
            } else if(row===1) {
                for(const x of [-0.25,0.25]) {
                    add(new THREE.IcosahedronGeometry(0.15,1),colors.light,g=>{g.scale(1,0.85,1);g.translate(x,0.25,z);});
                    for(let i=0;i<6;i++) {
                        const angle=i*Math.PI/3;
                        leaf(x+Math.sin(angle)*0.09,0.22+(i%2)*0.025,z+Math.cos(angle)*0.09,0.19,angle,-0.45,i%2 ? colors.green : colors.light);
                    }
                }
            } else {
                for(const x of [-0.22,0.22]) {
                    add(new THREE.ConeGeometry(0.055,0.24,6),colors.orange,g=>{g.rotateZ(Math.PI);g.translate(x,0.07,z);});
                    for(let i=0;i<5;i++) {
                        const angle=i*Math.PI*2/5, dx=Math.cos(angle)*0.09, dz=Math.sin(angle)*0.09;
                        stem([x,0.19,z],[x+dx,0.43+(i%2)*0.05,z+dz],0.005,colors.green);
                        leaf(x+dx*0.75,0.37,z+dz*0.75,0.11,angle,0.9,colors.light);
                    }
                }
            }
        }
        finish(['tomatoes','lettuce','carrots'][row],(row-1)*1.85,0);
    }
    for(let crate=0;crate<2;crate++) {
        box(0.66,0.06,0.48,0,0.03,0,colors.edge);
        for(const x of [-0.3,0.3]) for(const z of [-0.21,0.21]) box(0.045,0.34,0.045,x,0.17,z,colors.edge);
        for(const side of [-1,1]) for(const y of [0.11,0.25]) {
            box(0.67,0.095,0.04,0,y,side*0.23,colors.wood);
            box(0.04,0.095,0.5,side*0.32,y,0,colors.wood);
        }
        if(crate===0) for(const x of [-0.17,0,0.17]) tomato(x,0.14,0,0.075);
        finish(`crate-${crate+1}`,-1.95+crate*0.9,1.95+crate*0.12);
    }
    return models;
}
