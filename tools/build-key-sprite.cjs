// Renderiza el modelo del inventario a un sprite pixelado; conserva llave.png.
// Playwright es una herramienta de desarrollo, no una dependencia del juego.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.ISLA_PLAYWRIGHT_PATH||'playwright');

(async()=>{
    const browser=await chromium.launch({headless:true,...(process.env.ISLA_BROWSER_PATH?{executablePath:process.env.ISLA_BROWSER_PATH}:{})});
    try {
        const page=await browser.newPage(),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
        await page.route('**/src/startup.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
        // El HTML ya puede referenciar el resultado antes de la primera generación.
        await page.route('**/imagenes/Sprites/llave-modelo.png',route=>route.fulfill({path:path.resolve(__dirname,'../imagenes/Sprites/llave.png')}));
        await page.goto(process.env.ISLA_PREVIEW_URL||'http://127.0.0.1:8001/',{waitUntil:'domcontentloaded'});
        const sprite=await page.evaluate(async()=>{
            const THREE=await import('three');
            const {createInventoryKey}=await import('./src/world/inventory-key.js');
            const key=createInventoryKey(THREE),scene=new THREE.Scene();
            key.rotation.set(.1,.35,0);
            scene.add(key,new THREE.HemisphereLight(0xffffff,0x59616b,1.8));
            const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-3,4,5);scene.add(light);
            const camera=new THREE.OrthographicCamera(-1.6,1.6,1.6,-1.6,.1,20);
            camera.position.set(0,0,6);camera.lookAt(0,0,0);
            const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});
            renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.setSize(64,64);
            await renderer.compileAsync(scene,camera);renderer.render(scene,camera);
            const result=renderer.domElement.toDataURL('image/png');
            key.geometry.dispose();key.material.forEach(material=>material.dispose());renderer.dispose();
            return result;
        });
        if(errors.length)throw new Error(errors.join('\n'));
        const output=path.resolve(__dirname,'../imagenes/Sprites/llave-modelo.png');
        fs.writeFileSync(output+'.tmp',Buffer.from(sprite.split(',')[1],'base64'));
        fs.renameSync(output+'.tmp',output);console.log('imagenes/Sprites/llave-modelo.png (64x64, transparente)');
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
