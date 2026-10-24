// Captura la maqueta vigente y el modelo de papel. No altera originales ni el mapa jugable.
// Requiere Playwright para desarrollo: ISLA_PLAYWRIGHT_PATH e ISLA_BROWSER_PATH son opcionales.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.ISLA_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');

(async()=>{
    const browser=await chromium.launch({headless:true,...(process.env.ISLA_BROWSER_PATH?{executablePath:process.env.ISLA_BROWSER_PATH}:{})});
    try {
        const page=await browser.newPage({viewport:{width:1024,height:1024}}),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
        await page.route('**/src/startup.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
        await page.goto(process.env.ISLA_PREVIEW_URL||'http://127.0.0.1:8001/',{waitUntil:'domcontentloaded'});
        const assets=await page.evaluate(async()=>{
            const THREE=await import('three');
            const {createIslandPreviewRenderer}=await import('./src/ui/island-preview-renderer.js');
            const {createInventoryMap}=await import('./src/world/inventory-map.js');
            let islandScene;
            const originalAdd=THREE.Scene.prototype.add;
            THREE.Scene.prototype.add=function(...objects){
                if(objects.some(object=>object.geometry?.attributes.position?.count>50000&&object.material?.vertexColors))islandScene=this;
                return originalAdd.apply(this,objects);
            };
            const loader=new THREE.TextureLoader();
            const preview=await createIslandPreviewRenderer(THREE,{
                canvas:document.createElement('canvas'),width:1024,height:1024,reduced:true,
                modelUrl:new URL('./imagenes/Portada/isla-maqueta.bin',location.href).href,
                loadTexture:name=>loader.loadAsync('./imagenes/Texturas/'+name),onShade:()=>{}
            });
            THREE.Scene.prototype.add=originalAdd;
            if(!islandScene)throw new Error('No se encontró la escena de la maqueta.');
            const response=await fetch('./imagenes/Portada/isla-maqueta.bin');
            const view=new DataView(await response.arrayBuffer());
            const width=view.getUint32(4,true),depth=view.getUint32(8,true);
            // X hacia la derecha y Z hacia abajo: coincide con las coordenadas del minimapa.
            const camera=new THREE.OrthographicCamera(-width/2,width/2,depth/2,-depth/2,.1,2000);
            camera.position.set(width/2,1000,depth/2);camera.up.set(0,0,-1);camera.lookAt(width/2,0,depth/2);
            const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
            renderer.setSize(1024,1024);await renderer.compileAsync(islandScene,camera);renderer.render(islandScene,camera);
            const map=renderer.domElement.toDataURL('image/png');
            renderer.dispose();preview.dispose();
            const texture=await loader.loadAsync(map);texture.colorSpace=THREE.SRGBColorSpace;
            texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;
            const paper=createInventoryMap(THREE,texture),scene=new THREE.Scene();
            paper.rotation.set(.1,.35,0);scene.add(paper,new THREE.HemisphereLight(0xffffff,0x43505d,2));
            const light=new THREE.DirectionalLight(0xffddaa,3);light.position.set(3,4,5);scene.add(light);
            const iconCamera=new THREE.OrthographicCamera(-1.65,1.65,1.65,-1.65,.1,20);
            iconCamera.position.set(0,.2,6);iconCamera.lookAt(0,0,0);
            const iconRenderer=new THREE.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});
            iconRenderer.setClearColor(0,0);iconRenderer.setSize(96,96);
            await iconRenderer.compileAsync(scene,iconCamera);iconRenderer.render(scene,iconCamera);
            const icon=iconRenderer.domElement.toDataURL('image/png');
            paper.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
            texture.dispose();iconRenderer.dispose();
            return {map,icon,coverage:[0,0,width,depth]};
        });
        if(errors.length)throw new Error(errors.join('\n'));
        for(const [key,file] of [['map','imagenes/Mapa/isla-cenital.png'],['icon','imagenes/Sprites/mapa-maqueta.png']]) {
            const output=path.join(root,file);
            fs.writeFileSync(output+'.tmp',Buffer.from(assets[key].split(',')[1],'base64'));
            fs.renameSync(output+'.tmp',output);
            console.log(file);
        }
        console.log(JSON.stringify({coverage:assets.coverage,mapPixels:1024,iconPixels:96}));
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
