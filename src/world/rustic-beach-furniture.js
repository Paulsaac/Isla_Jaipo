// Madera de carpintería sencilla; una malla/material por mueble.
function boardsBuilder(THREE) {
    const pieces = [];
    function add(source, color, transform) {
        const geometry = source.toNonIndexed(); source.dispose();
        transform(geometry);
        const tint = new THREE.Color(color), colors = new Float32Array(geometry.attributes.position.count * 3);
        for (let i=0;i<colors.length;i+=3) { colors[i]=tint.r; colors[i+1]=tint.g; colors[i+2]=tint.b; }
        geometry.setAttribute('color',new THREE.BufferAttribute(colors,3)); pieces.push(geometry);
    }
    function board(w,h,d,x,y,z,color=0xb39b76,turn=0) {
        add(new THREE.BoxGeometry(w,h,d),color,g=>{g.rotateY(turn);g.translate(x,y,z);});
    }
    function beam(a,b,width,depth,color=0x947b59) {
        const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),axis=end.clone().sub(start);
        const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize());
        add(new THREE.BoxGeometry(width,axis.length(),depth),color,g=>{
            g.applyQuaternion(rotation);g.translate(...start.add(end).multiplyScalar(.5).toArray());
        });
    }
    function finish() {
        const geometry=new THREE.BufferGeometry();
        for (const name of ['position','normal','uv','color']) {
            const data=new Float32Array(pieces.reduce((sum,g)=>sum+g.attributes[name].array.length,0));let offset=0;
            for(const piece of pieces){data.set(piece.attributes[name].array,offset);offset+=piece.attributes[name].array.length;}
            geometry.setAttribute(name,new THREE.BufferAttribute(data,pieces[0].attributes[name].itemSize));
        }
        geometry.addGroup(0,geometry.attributes.position.count,0);
        for(const piece of pieces)piece.dispose();
        geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
    }
    return {board,beam,finish};
}

export function createBeachPlankTableGeometry(THREE) {
    const {board,finish}=boardsBuilder(THREE);
    const tints=[0xaf9875,0x99805e,0xb9a181,0xa38a68];
    // Capas cruzadas, relativamente ordenadas, sin patas torneadas ni herrajes modernos.
    for(let layer=0;layer<3;layer++){
        for(let i=0;i<3;i++){
            const z=(i-1)*.235+(layer===1?.012:0),x=(i%2?-.016:.018)*(layer+1);
            board(1.04+(i===1?.04:0),.065,.215,x,.0325+layer*.145,z,tints[(i+layer)%4],(i-1)*.012);
        }
        if(layer<2)for(const x of [-.35,.35])board(.14,.08,.70,x,.105+layer*.145,0,0x8d7453);
    }
    // Últimos tacos y tres tablas superiores algo más largas.
    for(const x of [-.34,.34])board(.14,.06,.70,x,.385,0,0x927a59);
    for(let i=0;i<3;i++)board(1.12+(i===1?.035:0),.065,.24,(i-1)*.016,.4475,(i-1)*.255,tints[(i+2)%4],(i-1)*.009);
    return finish();
}

export function createRusticBeachChairGeometry(THREE) {
    const {board,beam,finish}=boardsBuilder(THREE);
    const tints=[0xac9470,0xb7a181,0x9b815c,0xb09a77,0xa58c68];
    // Patas abiertas con apoyos y largueros que sostienen un asiento alargado.
    for(const x of [-.35,.35]){
        beam([x,.06,.58],[x,.49,.49],.095,.095);
        beam([x,.06,-.54],[x,.43,-.38],.105,.10);
        for(const z of [-.54,.58])board(.14,.035,.16,x,.0175,z,0x8c7353);
        beam([x,.415,-.44],[x,.475,.64],.09,.09);
        beam([x,.20,-.49],[x,.235,.55],.055,.06,0x8d7655);
    }
    for(let i=0;i<7;i++)board(.75,.055,.14,(i%2?-.007:.007),.455+i*.008,-.40+i*.155,tints[i%5]);
    // Respaldo de cinco tablones, reclinado y con remate ligeramente desigual.
    for(let i=0;i<5;i++){
        const x=(i-2)*.145,extra=[0,.018,.035,.012,-.006][i];
        beam([x,.46,-.46],[x,1.15+extra,-.86-extra*.55],.128,.055,tints[i]);
        for(const [y,z] of [[.61,-.51],[1.02,-.75]])board(.020,.020,.018,x,y,z+.014,0x796043);
    }
    beam([-.40,.60,-.555],[.40,.60,-.555],.065,.065,0x89704e);
    beam([-.40,1.01,-.795],[.40,1.01,-.795],.065,.065,0x89704e);
    // Apoyabrazos planos y sencillos, sujetos con madera.
    for(const x of [-.36,.36]){
        board(.115,.06,1.16,x,.73,-.08,0xb19a76);
        beam([x,.48,.48],[x,.71,.48],.075,.075,0x8e7655);
        beam([x,.44,-.38],[x,.71,-.54],.075,.075,0x8e7655);
    }
    return finish();
}
