// Cinco emisiones de 64 × 48 píxeles comparten un solo atlas y una subida a GPU.
export function createWizardTvScreens(THREE) {
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
    let time=0,lastFrame=-1,seed=1;
    let moonStamp=null;
    const moonImage=new Image();
    moonImage.onload=()=>{
        const source=document.createElement('canvas');source.width=moonImage.naturalWidth;source.height=moonImage.naturalHeight;
        const sourceCtx=source.getContext('2d');sourceCtx.drawImage(moonImage,0,0);
        const rgba=sourceCtx.getImageData(0,0,source.width,source.height).data;
        let left=source.width,top=source.height,right=-1,bottom=-1;
        for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(rgba[(y*source.width+x)*4+3]>0) {
            left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        }
        if(right<left)return;
        moonStamp=document.createElement('canvas');moonStamp.width=moonStamp.height=28;
        const stampCtx=moonStamp.getContext('2d');stampCtx.imageSmoothingEnabled=false;
        const width=right-left+1,height=bottom-top+1,scale=28/Math.max(width,height);
        const w=Math.round(width*scale),h=Math.round(height*scale);
        stampCtx.drawImage(source,left,top,width,height,Math.floor((28-w)/2),Math.floor((28-h)/2),w,h);
        draw();
    };
    moonImage.src=new URL('../../imagenes/Sprites/luna - sol/Luna_B.png',import.meta.url).href;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const pixel=(slot,x,y,w,h,color)=>{
        ctx.fillStyle=color;ctx.fillRect((slot%4)*64+Math.round(x),Math.floor(slot/4)*64+8+Math.round(y),w,h);
    };
    function line(slot,x0,y0,x1,y1,color) {
        const count=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
        for(let i=0;i<=count;i++)pixel(slot,x0+(x1-x0)*i/count,y0+(y1-y0)*i/count,1,1,color);
    }
    function text(slot,x,y,color) {
        const font={S:['111','100','111','001','111'],I:['111','010','010','010','111'],
            N:['101','111','111','111','101'],E:['111','100','110','100','111'],
            A:['010','101','111','101','101'],L:['100','100','100','100','111']};
        for(const letter of 'SIN SENAL') {
            font[letter]?.forEach((row,dy)=>[...row].forEach((bit,dx)=>{if(bit==='1')pixel(slot,x+dx,y+dy,1,1,color);}));
            x+=4;
        }
    }
    const constellations=[
        [[8,31],[16,20],[27,23],[36,12],[48,17],[55,8],[40,36]],
        [[9,12],[19,16],[30,10],[39,25],[53,32],[28,36],[17,29]],
        [[10,35],[15,22],[28,12],[40,17],[51,11],[48,31],[33,36]],
        [[8,24],[20,10],[31,18],[46,9],[54,25],[42,37],[26,32]]
    ];
    function stars() {
        pixel(1,0,0,64,48,'#071321');
        for(let i=0;i<35;i++) {
            const x=3+(i*29)%58,y=3+(i*17)%42;
            pixel(1,x,y,1,1,Math.sin(time*2+i)>.6?'#758ea2':'#293e58');
        }
        const shape=constellations[Math.floor(time/5)%constellations.length];
        for(let i=1;i<shape.length;i++)line(1,...shape[i-1],...shape[i],'#3c748b');
        line(1,...shape[2],...shape[6],'#3c748b');
        shape.forEach(([x,y],i)=>{
            const bright=Math.sin(time*2.4+i)>.15;
            pixel(1,x-1,y,3,1,bright?'#91d8dc':'#719aa7');
            pixel(1,x,y-1,1,3,bright?'#91d8dc':'#719aa7');
            pixel(1,x,y,1,1,'#eef1cc');
        });
    }
    function staticNoise() {
        const colors=['#111922','#35424d','#74868d','#b4bfbe','#e0e2d0'];
        for(let y=0;y<48;y++)for(let x=0;x<64;x++)pixel(0,x,y,1,1,colors[Math.floor(random()*5)]);
    }
    function psychedelia() {
        const palette=['#03020b','#0c0923','#201347','#432369','#753c9b','#3d348e','#202c77','#101b46'];
        for(let y=0;y<48;y++)for(let x=0;x<64;x++) {
            const dx=(x-31.5)/26,dy=(y-23.5)/23,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
            const wave=Math.sin(r*12-time*1.4+Math.sin(a*3+time*.45)*2)
                +Math.sin(dx*6+dy*4+time*.65);
            pixel(2,x,y,1,1,palette[Math.min(7,Math.floor((wave+2)*2))]);
        }
    }
    function moonAnalysis() {
        pixel(3,0,0,64,48,'#091d2c');
        // El mismo sprite del cielo, reducido sin interpolación y sin su margen transparente.
        if(moonStamp)ctx.drawImage(moonStamp,3*64+18,8+10);
        // Glifos inventados a ambos lados: no son letras de una lengua real.
        for(const side of [3,51])for(let row=0;row<7;row++)for(let col=0;col<2;col++) {
            const bits=(row*139+col*83+side*47+0x5319)&32767;
            for(let y=0;y<4;y++)for(let x=0;x<3;x++)if(bits&(1<<(y*3+x)))
                pixel(3,side+col*5+x,7+row*5+y,1,1,'#6395a1');
        }
        for(const [x,sign]of [[16,1],[48,-1]]) {
            line(3,x,9,x,39,'#3c7388');line(3,x,9,x+sign*4,9,'#3c7388');line(3,x,39,x+sign*4,39,'#3c7388');
        }
        for(let x=19;x<47;x+=3)pixel(3,x,4,1,2,'#4d8795');
        for(let x=21;x<45;x++)pixel(3,x,43+Math.round(Math.sin(x*.7+time)*1),1,1,'#8dbab7');
        const scan=11+Math.floor(time*4)%27;
        pixel(3,18,scan,29,1,'#72b2bd28');
        line(3,29,6,32,3,'#b3c8b7');line(3,32,3,35,6,'#b3c8b7');
    }
    function noSignal() {
        const colored=Math.floor(time/6)%2===1;
        const bars=['#ddddcb','#d7d435','#37c6ce','#49bd4c','#bd42b7','#c64043','#344bbe'];
        for(let y=0;y<48;y++)for(let x=0;x<64;x++) {
            let color;
            if(colored) {
                const shifted=x+Math.round(Math.sin(y*.65+time*3)*1.3);
                color=bars[Math.max(0,Math.min(6,Math.floor(shifted*7/64)))];
                if(y>39)color=y<44?(Math.floor(x/9)%2?'#080b15':bars[Math.floor(x/10)%7]):['#c5c7bf','#858c91','#4a515b','#171c24'][Math.min(3,Math.floor(x/16))];
            } else color=['#123d70','#164779','#1b4a80','#1b508a','#225b93'][Math.floor(random()*5)];
            pixel(4,x,y,1,1,color);
        }
        if(colored)for(let i=0;i<150;i++)pixel(4,random()*63,random()*47,1,1,'#00000030');
        pixel(4,12,19,41,11,colored?'#080c15':'#285d88');text(4,15,22,colored?'#efeee1':'#b6cfca');
        if(!colored)pixel(4,1,36,62,1,'#32639b');
    }
    function draw() {
        ctx.fillStyle='#081219';ctx.fillRect(0,0,256,128);
        seed=(lastFrame+1)*7193;
        staticNoise();stars();psychedelia();moonAnalysis();noSignal();
        for(let slot=0;slot<5;slot++) {
            for(let y=0;y<48;y+=2)pixel(slot,0,y,64,1,'#071a2448');
            for(let i=0;i<4;i++) {
                pixel(slot,0,i,4-i,1,'#081219');pixel(slot,60+i,i,4-i,1,'#081219');
                pixel(slot,0,47-i,4-i,1,'#081219');pixel(slot,60+i,47-i,4-i,1,'#081219');
            }
            pixel(slot,5,2,23,1,'#91afb33a');
        }
        texture.needsUpdate=true;
    }
    draw();
    return {texture,update(delta,visible=true) {
        time+=delta;
        const frame=Math.floor(time*12);
        if(!visible||delta<=0||frame===lastFrame)return;
        lastFrame=frame;draw();
    }};
}
