// Campo estelar angular: el FOV conserva la escala y el horizonte delimita las estrellas.
export function createObservatorySky(THREE){
    const material=new THREE.ShaderMaterial({
        side:THREE.BackSide,depthWrite:false,fog:false,extensions:{derivatives:true},
        vertexShader:`varying vec3 direction;
            void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`varying vec3 direction;
            float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
            void main(){
                vec3 d=normalize(direction);
                vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.0,1.0))/3.14159265359+.5);
                vec2 grid=uv*vec2(4096.0,2048.0),cell=floor(grid),f=fract(grid);
                vec2 center=.15+.7*vec2(hash(cell+1.7),hash(cell+8.3));
                float radius=.018+.055*hash(cell+4.2),aa=max(length(fwidth(grid))*.55,.008);
                float star=(1.0-smoothstep(radius,radius+aa,length(f-center)))*step(.86,hash(cell));
                star*=smoothstep(-.02,.12,d.y);
                vec3 blue=mix(vec3(.012,.032,.085),vec3(.002,.007,.028),clamp(d.y,0.0,1.0));
                blue*=smoothstep(-.45,.04,d.y);
                gl_FragColor=vec4(blue+star*mix(vec3(.55,.68,1.0),vec3(1.0,.91,.75),hash(cell+2.8)),1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`
    });
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1000,32,20),material);
    mesh.name='omniscopio-stellar-sky';mesh.renderOrder=-4;mesh.frustumCulled=false;mesh.visible=false;
    return mesh;
}
