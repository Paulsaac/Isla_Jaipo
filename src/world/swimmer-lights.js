export const SWIMMER_PERSONALITIES=[
        {color:0xff3030,speed:1.04,height:2.5,gap:.35,duration:1.25,sway:1.7,size:.95,breath:1.65}, // Rojo inquieto.
        {color:0xff8c20,speed:.99,height:2.9,gap:1.2,duration:1.7,sway:1.4,size:1.30,breath:2.8}, // Naranja acróbata.
        {color:0xffe545,speed:1.07,height:1.15,gap:.45,duration:.95,sway:1.8,size:.72,breath:1.1}, // Amarillo veloz.
        {color:0x3bdf62,speed:.97,height:0,gap:0,duration:0,sway:.55,size:1.12,breath:4.6}, // Verde siempre sumergido.
        {color:0x36a1ff,speed:1,height:1.7,gap:1.9,duration:1.35,sway:1.1,size:1.04,breath:3.6}, // Azul tranquilo.
        {color:0x6655ef,speed:.94,height:.8,gap:3,duration:1.1,sway:.7,size:.82,breath:5.4}, // Índigo reservado.
        {color:0xb64fff,speed:1.02,height:2.25,gap:.7,duration:1.4,sway:1.8,size:1.20,breath:2.15} // Violeta juguetón.
];

export function getSwimmerBreath(personality,seconds,phase) {
    return .58+.42*(.5-.5*Math.cos(seconds*Math.PI*2/personality.breath+phase));
}

export function createSwimmerLights(THREE,{fog=true}={}) {
    const count=SWIMMER_PERSONALITIES.length,trailCount=9,stride=trailCount+1;
    const personalities=SWIMMER_PERSONALITIES;
    const positions=new Float32Array(count*stride*3);
    const brightness=new Float32Array(count*stride);
    const sizes=new Float32Array(count*stride);
    const colors=new Float32Array(count*stride*3);
    for(let i=0;i<count;i++) {
        const color=new THREE.Color(personalities[i].color);
        for(let point=0;point<stride;point++)color.toArray(colors,(i*stride+point)*3);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('brightness',new THREE.BufferAttribute(brightness,1).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('pointSize',new THREE.BufferAttribute(sizes,1));
    geometry.setAttribute('swimmerColor',new THREE.BufferAttribute(colors,3));
    geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),75);
    for(let i=0;i<sizes.length;i++) {
        const baseSize=i%stride===trailCount?1.05:i%stride===0?.72:.30;
        sizes[i]=baseSize*personalities[Math.floor(i/stride)].size;
    }
    const material=new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,fog,
        uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{viewportHeight:{value:720}}]),
        vertexShader:`
            attribute float brightness;
            attribute float pointSize;
            attribute vec3 swimmerColor;
            uniform float viewportHeight;
            varying float vBrightness;
            varying vec3 vColor;
            #include <fog_pars_vertex>
            void main(){
                vBrightness=brightness;
                vColor=swimmerColor;
                vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
                gl_Position=projectionMatrix*mvPosition;
                gl_PointSize=clamp(pointSize*viewportHeight*projectionMatrix[1][1]/max(1.0,-mvPosition.z),1.0,42.0);
                #include <fog_vertex>
            }`,
        fragmentShader:`
            varying float vBrightness;
            varying vec3 vColor;
            #include <fog_pars_fragment>
            void main(){
                float radius=length(gl_PointCoord-0.5)*2.0;
                if(radius>1.0||vBrightness<0.001)discard;
                float glow=exp(-radius*radius*4.8)*(1.0-smoothstep(0.65,1.0,radius));
                vec3 color=mix(vColor,vec3(1.0),0.25*exp(-radius*radius*30.0));
                gl_FragColor=vec4(color,glow*vBrightness);
                #include <fog_fragment>
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`
    });
    const points=new THREE.Points(geometry,material);
    return {points,geometry,positions,brightness,stride,trailCount};
}
