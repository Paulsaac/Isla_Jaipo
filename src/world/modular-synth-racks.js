import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Tres gabinetes de utilería: paneles y controles 3D, sin teclado ni motor de audio.
export function createModularSynthRacks(THREE,woodTexture) {
    const group=new THREE.Group();group.name='metal-room-modular-synthesizers';
    const clock={value:0};
    const hardware=new THREE.MeshPhongMaterial({vertexColors:true,shininess:48,flatShading:true,fog:false});
    const silverCaps=new THREE.MeshPhongMaterial({vertexColors:true,emissive:0xb7b9ad,emissiveIntensity:.22,shininess:65,flatShading:true,fog:false});
    const wire=new THREE.MeshPhongMaterial({vertexColors:true,shininess:22,flatShading:true,fog:false});
    const glow=new THREE.ShaderMaterial({vertexColors:true,fog:false,toneMapped:false,uniforms:{rackTime:clock},
        vertexShader:'varying vec3 rackColor;varying float rackPhase;void main(){rackColor=color;rackPhase=dot(position.xy,vec2(1.9,5.3));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:`uniform float rackTime;varying vec3 rackColor;varying float rackPhase;
            void main(){float level=.72+.28*smoothstep(.5,.95,sin(rackTime*.8+rackPhase));gl_FragColor=vec4(rackColor*level,1.0);
                #include <colorspace_fragment>
            }`});
    const colors=[0xa12727,0x237f9f,0x278f86,0xc58c25,0x665292,0xb8b7a9,0x171b20];
    const bounds=[],racks=[],allPorts=[];let seed=1535;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const W=3.55,H=3.5,face=.41;
    const designs=[
        {id:'classic-dark',title:'MODULAR SYSTEM 01',z:-4.65,wood:0x98683e,cream:false,patches:20,rows:[
            [['osc-wide',3],['osc',1],['osc',1],['mix',1],['matrix',2],['vca',1],['filter-wide',3]],
            [['filter-wide',3],['env',1],['env',1],['mix',2],['vca',1],['matrix',2],['env',2]],
            Array.from({length:12},(_,i)=>[['osc','env','vca','mix'][i%4],1])]},
        {id:'cream-blue-bank',title:'MODULAR SYSTEM 02',z:0,wood:0xc09257,cream:true,patches:13,
            rows:Array.from({length:5},()=>Array.from({length:7},()=>['cream',1]))},
        {id:'dense-patch-system',title:'MODULAR SYSTEM 03',z:4.65,wood:0x805238,cream:false,patches:25,rows:[
            [['matrix',2],['env',1],['seq',6],['osc',1],['vca',1],['env',1]],
            [['mix',2],['filter-wide',3],['env',1],['matrix',2],['osc',1],['vca',1],['mix',2]],
            Array.from({length:14},(_,i)=>[i%4===0?'matrix':i%3===0?'env':'osc',1])]}
    ];
    function finish(batches,parent) {
        for(const [material,parts] of batches) {
            const mesh=new THREE.Mesh(mergeGeometries(parts,false),material);
            mesh.name=material===wire?'modular-patch-cables':material===glow?'modular-indicator-lights':'modular-cabinet-and-controls';
            parent.add(mesh);parts.forEach(g=>g.dispose());
        }
    }
    function coloredGeometry(geometry,material,color) {
        if(!material.vertexColors)return;
        const tint=new THREE.Color(color??0xffffff),data=new Float32Array(geometry.attributes.position.count*3);
        for(let i=0;i<data.length;i+=3)data.set([tint.r,tint.g,tint.b],i);
        geometry.setAttribute('color',new THREE.BufferAttribute(data,3));
    }
    function makeCable(a,b,color,add,outward=new THREE.Vector3(0,0,1)) {
        const start=a.point.clone().addScaledVector(a.normal,.10),end=b.point.clone().addScaledVector(b.normal,.10);
        const mid=start.clone().add(end).multiplyScalar(.5).addScaledVector(outward,.25+random()*.18);
        mid.y=Math.max(.25,Math.min(start.y,end.y)-.23-random()*.28);
        const curve=new THREE.CatmullRomCurve3([start,start.clone().addScaledVector(a.normal,.12),mid,end.clone().addScaledVector(b.normal,.12),end]);
        add(new THREE.TubeGeometry(curve,22,.011+random()*.002,5,false),wire,color);
        for(const port of [a,b]) {
            const cylinder=new THREE.CylinderGeometry(.024,.024,.10,8);
            cylinder.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),port.normal));
            cylinder.translate(...port.point.clone().addScaledVector(port.normal,.05).toArray());add(cylinder,hardware,color);
        }
        a.used=b.used=true;
    }
    for(const [rackIndex,design] of designs.entries()) {
        const rack=new THREE.Group();rack.name=`synth-rack-${design.id}`;rack.position.set(-7.04,0,design.z);rack.rotation.y=Math.PI/2;group.add(rack);
        const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
        const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
        texture.name=`synth-panel-engraving-${design.id}`;texture.colorSpace=THREE.SRGBColorSpace;
        texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
        const plate=new THREE.MeshPhongMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:.28,shininess:12,fog:false});
        const grain=woodTexture.clone();grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(1,1);grain.needsUpdate=true;
        const timber=new THREE.MeshPhongMaterial({map:grain,color:design.wood,emissiveMap:grain,emissive:design.wood,emissiveIntensity:.45,shininess:18,fog:false});
        const batches=new Map(),ports=[],matrix=new THREE.Matrix4();
        const stats={design:design.id,knobs:0,jacks:0,buttons:0,lights:0,cables:0,keyboard:false};
        function add(source,material=hardware,color=0x252a2d) {
            const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();
            g.applyMatrix4(matrix);coloredGeometry(g,material,color);
            const parts=batches.get(material)??[];parts.push(g);batches.set(material,parts);
        }
        function box(w,h,d,x,y,z,material=hardware,color=0x252a2d) {
            const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,material,color);
        }
        function cylinder(r,d,x,y,z,color=0x171a1c,segments=10,material=hardware) {
            const g=new THREE.CylinderGeometry(r,r,d,segments);g.rotateX(Math.PI/2);g.translate(x,y,z);add(g,material,color);
        }
        const px=x=>(x/W+.5)*1024,py=y=>(1-y/H)*1024;
        const stroke=design.cream?'#36566a':'#d4d4c5';
        function label(text,x,y,size=10) {ctx.fillStyle=stroke;ctx.font=`${size}px monospace`;ctx.textAlign='center';ctx.fillText(text,px(x),py(y));}
        function knob(x,y,r=.049) {
            stats.knobs++;
            cylinder(r*1.14,.016,x,y,face+.014,0x101518);
            cylinder(r,.054,x,y,face+.044,0x17191a,12);
            cylinder(r*.66,.008,x,y,face+.075,design.cream?0xcbd0c6:0xc3c6bd,12,silverCaps);
            const angle=(random()-.5)*4.4,g=new THREE.BoxGeometry(r*.15,r*.66,.006);
            g.rotateZ(-angle);g.translate(x+Math.sin(angle)*r*.35,y+Math.cos(angle)*r*.35,face+.083);add(g,hardware,0x20292c);
            ctx.strokeStyle=stroke;ctx.lineWidth=.9;
            for(let i=0;i<11;i++) {
                const a=-Math.PI*.78+i*Math.PI*1.56/10;
                ctx.beginPath();ctx.moveTo(px(x+Math.sin(a)*r*1.36),py(y+Math.cos(a)*r*1.36));
                ctx.lineTo(px(x+Math.sin(a)*r*1.57),py(y+Math.cos(a)*r*1.57));ctx.stroke();
            }
        }
        function port(x,y) {
            stats.jacks++;cylinder(.026,.012,x,y,face+.012,0xb4b6a3,8);
            cylinder(.015,.004,x,y,face+.020,0x0b1015,8);
            ports.push({point:new THREE.Vector3(x,y,face+.024).applyMatrix4(matrix),normal:new THREE.Vector3(0,0,1).transformDirection(matrix),used:false});
        }
        function button(x,y,color=0xa33129) {
            stats.buttons++;box(.043,.05,.021,x,y,face+.024,hardware,0x0b1116);
            box(.025,.033,.015,x,y,face+.043,hardware,color);
        }
        function led(x,y,color) {stats.lights++;box(.014,.016,.012,x,y,face+.031,glow,color);}
        function panel(x,y,w,h,kind,index) {
            ctx.fillStyle=design.cream?'#c6c5b5':index%3===0?'#24282a':'#1d2327';
            ctx.fillRect(px(x-w/2),py(y+h/2),w/W*1024,h/H*1024);
            ctx.strokeStyle=design.cream?'#3b6b85':'#858c8b';ctx.lineWidth=design.cream?2:1;
            ctx.strokeRect(px(x-w/2)+1.5,py(y+h/2)+1.5,w/W*1024-3,h/H*1024-3);
            const title=kind==='cream'?['VCO','VCF','ENV','VCA','MIX','CV','LFO'][index%7]:kind==='seq'?'ANALOG SEQUENCER':kind==='matrix'?'PATCH':kind==='filter-wide'?'FILTER BANK':kind==='osc-wide'?'OSCILLATOR BANK':kind.toUpperCase();
            label(title,x,y+h*.40,Math.max(8,Math.min(11,w*30)));
            box(w-.01,h-.01,.024,x,y,face-.015,hardware,0x22292e);
            const plane=new THREE.PlaneGeometry(w-.012,h-.012),uv=plane.attributes.uv,p=plane.attributes.position;
            for(let i=0;i<p.count;i++)uv.setXY(i,(x+p.getX(i))/W+.5,(y+p.getY(i))/H);
            plane.translate(x,y,face);add(plane,plate);
            for(const dx of [-1,1])for(const dy of [-1,1])cylinder(.007,.006,x+dx*(w/2-.018),y+dy*(h/2-.02),face+.006,0xa8adad,6);
            if(kind==='matrix') {
                const cols=Math.max(2,Math.min(6,Math.floor(w/.12)));
                for(let row=0;row<4;row++)for(let col=0;col<cols;col++)port(x+(col/(cols-1)-.5)*w*.65,y+h*.22-row*h*.17);
            } else if(kind==='seq') {
                for(let row=0;row<3;row++)for(let col=0;col<8;col++)knob(x+(col/7-.5)*w*.87,y+h*.24-row*h*.19,.032);
                for(let col=0;col<8;col++){const bx=x+(col/7-.5)*w*.87;button(bx,y-h*.32,col%2?0x8d251d:0x4d5c51);led(bx,y-h*.22,col%3?0xe0b83d:0xb5261d);port(bx,y-h*.43);}
            } else {
                const cols=kind==='cream'?2:kind==='osc-wide'?4:kind==='filter-wide'?3:w>.47?2:1;
                const rows=kind==='cream'?2:3,r=kind==='cream'?.028:kind==='filter-wide'?.060:cols===1?.046:.045;
                for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)knob(x+(cols===1?0:(col/(cols-1)-.5)*w*.62),y+h*.20-row*h*(kind==='cream'?.26:.22),r);
                const count=kind==='cream'?3:Math.max(2,Math.min(6,Math.round(w/.16)));
                for(let col=0;col<count;col++)port(x+(col/(count-1)-.5)*w*.65,y-h*.39);
                button(x+w*.34,y-h*.19,design.cream?0x3a6c86:0x9b3027);
                led(x-w*.32,y+h*.30,index%3?0x62b96f:0xdd8a35);
                label(kind==='cream'?'CV IN':'CONTROL',x,y-h*.30,7);
            }
        }
        // Gabinete de madera y soporte, sin consola ni teclado musical.
        box(W+.16,2.76,.12,0,1.95,-.28,timber);
        for(const x of [-W/2-.035,W/2+.035])box(.10,2.83,.75,x,1.95,.035,timber);
        for(const y of [.54,3.36])box(W+.24,.10,.80,0,y,.035,timber);
        box(W+.20,.12,.95,0,.18,.10,timber);
        for(const x of [-W*.43,W*.43])for(const z of [-.22,.40])box(.12,.40,.12,x,.36,z,timber);
        ctx.fillStyle=design.cream?'#c6c5b5':'#1c2226';ctx.fillRect(0,0,1024,1024);
        const n=design.rows.length,gap=.065,rowHeight=(2.7-gap*(n-1))/n;
        for(const [row,modules] of design.rows.entries()) {
            const y=3.27-rowHeight/2-row*(rowHeight+gap),tilt=design.id==='dense-patch-system'&&row===n-1?-.14:0;
            matrix.makeTranslation(0,y,face).multiply(new THREE.Matrix4().makeRotationX(tilt)).multiply(new THREE.Matrix4().makeTranslation(0,-y,-face));
            const units=modules.reduce((sum,m)=>sum+m[1],0);let left=-W/2+.035;
            for(const [index,[kind,unitsWide]] of modules.entries()) {
                const w=(W-.07)*unitsWide/units;panel(left+w/2,y,w-.008,rowHeight,kind,index+row*modules.length);left+=w;
            }
            matrix.identity();if(row<n-1)box(W+.05,.055,.72,0,y-rowHeight/2-gap/2,.035,timber);
        }
        const nameplate=new THREE.PlaneGeometry(W*.72,.085),nameUv=nameplate.attributes.uv,namePos=nameplate.attributes.position;
        for(let i=0;i<namePos.count;i++)nameUv.setXY(i,namePos.getX(i)/W+.5,(namePos.getY(i)+3.38)/H);
        nameplate.translate(0,3.38,.442);add(nameplate,plate);label(design.title,0,3.36,16);texture.needsUpdate=true;
        for(let i=0;i<design.patches;i++) {
            const available=ports.filter(p=>!p.used);if(available.length<2)break;
            const a=available[Math.floor(random()*available.length)],choices=available.filter(p=>p!==a&&p.point.distanceTo(a.point)>.2);
            const b=choices[Math.floor(random()*choices.length)];if(!b)continue;
            makeCable(a,b,colors[(i+rackIndex)%colors.length],add);stats.cables++;
        }
        finish(batches,rack);rack.updateMatrixWorld(true);
        const boxBounds=new THREE.Box3().setFromObject(rack);
        bounds.push({minX:boxBounds.min.x,maxX:boxBounds.max.x,minZ:boxBounds.min.z,maxZ:boxBounds.max.z});
        rack.userData={type:'MODULAR_SYNTH_RACK',...stats};racks.push(rack);
        rack.updateMatrix();allPorts.push(ports.filter(p=>!p.used).map(p=>({point:p.point.clone().applyMatrix4(rack.matrix),normal:p.normal.clone().transformDirection(rack.matrix)})));
    }
    // Algunos latiguillos enlazan los gabinetes, además de los parches de cada panel.
    const links=new Map();
    const addLink=(source,material,color)=>{const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();coloredGeometry(g,material,color);const parts=links.get(material)??[];parts.push(g);links.set(material,parts);};
    for(let bank=0;bank<2;bank++)for(let i=0;i<3;i++) {
        const a=allPorts[bank][i*3],b=allPorts[bank+1][i*4+1];
        if(a&&b)makeCable(a,b,colors[(i+bank*2)%colors.length],addLink,new THREE.Vector3(1,0,0));
    }
    finish(links,group);
    return {group,racks,bounds,update(delta){clock.value+=delta;},get time(){return clock.value;}};
}
