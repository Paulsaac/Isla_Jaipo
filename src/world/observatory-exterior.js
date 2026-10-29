import {observatoryMiddleStoreyRise} from '../content/summit-layout.js';

// Envolvente exterior: dos cuerpos de piedra y cubiertas planas del mismo material.
// Las piezas se incorporan a los lotes del observatorio; no contienen luces ni lógica.
export function addObservatoryExterior(THREE,{add,stone,woodTexture,baseOutline}) {
    const baseHalf=Math.max(...baseOutline.map(([x,z])=>Math.max(Math.abs(x),Math.abs(z))));
    const roofStone=stone.clone();
    roofStone.color.multiplyScalar(.72);roofStone.emissive.multiplyScalar(.72);
    const beams=new THREE.MeshPhongMaterial({map:woodTexture,color:0x493323,shininess:0});
    const lantern=new THREE.MeshBasicMaterial({color:0xe8bb69});
    function emit(g,m,scale=2) {
        const p=g.attributes.position,n=g.attributes.normal;
        if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(p.count*2),2));
        const uv=g.attributes.uv;
        for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/scale,
            (Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i))/scale);
        add(g,m);
    }
    function quad(a,b,c,d,m,scale=2) {
        const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));
        g.computeVertexNormals();emit(g,m,scale);
    }
    function box(w,h,d,x,y,z,m=beams) {
        const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);emit(g,m);
    }
    function face(a,b,bottom,top,m,flare=0) {
        const normal=new THREE.Vector2(b[1]-a[1],a[0]-b[0]).normalize();
        // El contorno recorre la base en sentido antihorario visto desde arriba.
        quad([a[0]+normal.x*flare,bottom,a[1]+normal.y*flare],
            [a[0],top,a[1]],[b[0],top,b[1]],
            [b[0]+normal.x*flare,bottom,b[1]+normal.y*flare],m,3);
    }
    // Piedra ligeramente ataludada, con hueco de entrada real.
    for(let i=0;i<baseOutline.length;i++) {
        const a=baseOutline[i],b=baseOutline[(i+1)%baseOutline.length];
        if(a[1]===baseHalf&&b[1]===baseHalf) {
            face(a,[.74,baseHalf],0,3.16,stone,.24);
            face([-.74,baseHalf],b,0,3.16,stone,.24);
            face([.74,baseHalf+.01],[-.74,baseHalf+.01],2.35,3.16,stone);
        } else face(a,b,0,3.16,stone,.24);
    }
    // Segundo cuerpo con la misma piedra continua del basamento, más angosto.
    const half=5.05,cut=1.15,s=half-cut;
    const middle=[[-half,-s],[-s,-half],[s,-half],[half,-s],[half,s],[s,half],[-s,half],[-half,s]];
    for(let i=0;i<middle.length;i++) {
        const a=middle[i],b=middle[(i+1)%middle.length];
        face(a,b,3.27,5.28+observatoryMiddleStoreyRise,stone,.12);
    }
    // Losas horizontales con canto de piedra y hueco central para cada cuerpo.
    // Un solo giro ordenado: mezclar atan2 negativo con ángulos positivos
    // cerraba las losas atravesando el hueco y creaba franjas dentro de la torre.
    const angles=[...baseOutline,...middle].map(([x,z])=>(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2));
    for(let i=0;i<12;i++)angles.push(Math.PI/12+i*Math.PI/6);
    angles.sort((a,b)=>a-b);
    const directions=angles.filter((a,i)=>!i||Math.abs(a-angles[i-1])>1e-5);
    const octRadius=(h,c,a)=>Math.min(h/Math.max(1e-8,Math.abs(Math.cos(a))),
        h/Math.max(1e-8,Math.abs(Math.sin(a))),(2*h-c)/(Math.abs(Math.cos(a))+Math.abs(Math.sin(a))));
    const towerRadius=a=>{const step=Math.PI/6;return 4.38/Math.cos(((a+step/2)%step+step)%step-step/2);};
    function flatRoof(outerHalf,innerHalf,top,tower=false) {
        const outer=directions.map(a=>{const r=octRadius(outerHalf,1.3,a);return [Math.cos(a)*r,Math.sin(a)*r];});
        const inner=directions.map(a=>{const r=tower?towerRadius(a):octRadius(innerHalf,1.15,a);return [Math.cos(a)*r,Math.sin(a)*r];});
        const bottom=top-.22;
        for(let i=0;i<outer.length;i++) {
            const j=(i+1)%outer.length;
            const a=[outer[i][0],top,outer[i][1]],b=[outer[j][0],top,outer[j][1]];
            const c=[inner[j][0],top,inner[j][1]],d=[inner[i][0],top,inner[i][1]];
            const low=p=>[p[0],bottom,p[2]];
            quad(a,d,c,b,roofStone);quad(low(a),low(b),low(c),low(d),roofStone);
            quad(low(a),a,b,low(b),roofStone);quad(low(d),low(c),c,d,roofStone);
        }
    }
    flatRoof(baseHalf+.2,4.99,3.35);
    flatRoof(5.23,0,5.47+observatoryMiddleStoreyRise,true);
    // Marco del acceso y dos faroles pequeños sin luces adicionales.
    for(const x of [-.86,.86])box(.23,2.43,.22,x,1.215,baseHalf+.13);
    box(1.95,.24,.24,0,2.44,baseHalf+.13);
    for(const x of [-1.35,1.35]) {
        box(.30,.42,.30,x,.48,baseHalf+.27,stone);box(.24,.10,.24,x,.73,baseHalf+.27);
        box(.15,.22,.14,x,.89,baseHalf+.27,lantern);box(.26,.10,.26,x,1.04,baseHalf+.27);
        for(const side of [-1,1])box(.025,.25,.18,x+side*.09,.9,baseHalf+.27);
    }
}
