// Preparar solo sectores cercanos; siete lotes conservan el coste de dibujo por sprite.
export async function createUnderwaterPlantStream(THREE, entries, sampleHeight, unitSize, surfaceHeight) {
    const size=16, margin=16, nearRadius=24, buckets=[],grid=new Map(),cached=new Set(),active=new Set();
    const transform=new THREE.Object3D(), box=new THREE.Box3(),boundsMatrix=new THREE.Matrix4();
    for(const entry of entries) {
        entry.mesh.count=0;entry.mesh.frustumCulled=false;
        entry.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        entry.owners=[];entry.local=[];entry.dirty=new Set();
        entry.mesh.geometry.computeBoundingBox();
        const cells=new Map();let started=performance.now(),indexed=0;
        for(const p of entry.positions) {
            const x=p.x*unitSize,z=p.z*unitSize,key=`${Math.floor(x/size)},${Math.floor(z/size)}`;
            let sector=cells.get(key);
            if(!sector) {
                const cx=(Math.floor(x/size)+.5)*size,cz=(Math.floor(z/size)+.5)*size;
                sector={entry,positions:[],x:cx,z:cz,radius:Math.SQRT2*size/2+entry.width,
                    wanted:false,ready:false,cursor:0,count:0,data:null,slots:null,active:false,
                    box:new THREE.Box3(),sphere:new THREE.Sphere()};
                cells.set(key,sector);buckets.push(sector);
                if(!grid.has(key))grid.set(key,[]);grid.get(key).push(sector);
            }
            sector.positions.push(p);
            if(++indexed%256===0&&performance.now()-started>=2) {
                await new Promise(resolve=>setTimeout(resolve,0));started=performance.now();
            }
        }
        entry.positions=null;
    }
    const frustum=new THREE.Frustum(),projection=new THREE.Matrix4();
    const eye=new THREE.Vector3(),forward=new THREE.Vector3(),coarse=new THREE.Box3();
    let queue=[],wantedSectors=new Set(),scheduled=false,enabled=false,fog=null,range=0;
    let preparedPlants=0,cancelled=0,evicted=0,readyCount=0;
    function dirty(entry,slot) {entry.dirty.add(Math.floor(slot/64));}
    function reserve(entry,count) {
        const mesh=entry.mesh;if(count<=mesh.instanceMatrix.count)return;
        let capacity=mesh.instanceMatrix.count;while(capacity<count)capacity*=2;
        const attribute=new THREE.InstancedBufferAttribute(new Float32Array(capacity*16),16);
        attribute.array.set(mesh.instanceMatrix.array);attribute.setUsage(THREE.DynamicDrawUsage);
        // Three r160 libera el buffer antiguo al disponer la instancia; geometría y material se comparten.
        mesh.dispose();mesh.instanceMatrix=attribute;entry.dirty.clear();
    }
    function remove(sector) {
        if(!sector.active)return;
        const entry=sector.entry,mesh=entry.mesh;
        for(let index=0;index<sector.count;index++) {
            const slot=sector.slots[index],last=--mesh.count;
            if(slot!==last) {
                mesh.instanceMatrix.array.copyWithin(slot*16,last*16,last*16+16);
                const owner=entry.owners[last],local=entry.local[last];
                entry.owners[slot]=owner;entry.local[slot]=local;owner.slots[local]=slot;dirty(entry,slot);
            }
            sector.slots[index]=-1;
        }
        entry.owners.length=entry.local.length=mesh.count;sector.active=false;active.delete(sector);
    }
    function add(sector) {
        const entry=sector.entry,mesh=entry.mesh;reserve(entry,mesh.count+sector.count);
        for(let index=0;index<sector.count;index++) {
            const slot=mesh.count++;
            mesh.instanceMatrix.array.set(sector.data.subarray(index*16,index*16+16),slot*16);
            entry.owners[slot]=sector;entry.local[slot]=index;sector.slots[index]=slot;dirty(entry,slot);
        }
        sector.active=true;active.add(sector);
    }
    function publish() {
        for(const entry of entries) {
            const mesh=entry.mesh;
            for(const block of entry.dirty) {
                const first=block*64*16,end=Math.min((block+1)*64,mesh.count)*16;
                if(end>first)mesh.instanceMatrix.addUpdateRange(first,end-first);
            }
            if(entry.dirty.size)mesh.instanceMatrix.needsUpdate=true;
            entry.dirty.clear();
        }
    }
    function synchronize() {
        for(const sector of cached) {
            const visible=enabled&&sector.ready&&sector.count>0&&frustum.intersectsSphere(sector.sphere)
                && sector.sphere.center.distanceToSquared(eye)<=(range+sector.sphere.radius)**2
                && (!fog||fog.distanceToPoint(sector.sphere.center)>=-sector.sphere.radius);
            sector.visible=visible;
            if(!visible)remove(sector);
        }
        for(const sector of cached)if(sector.visible&&!sector.active)add(sector);
        publish();
    }
    function preparePlant(sector) {
        const {entry}=sector,p=sector.positions[sector.cursor++];
        if(!sector.data){sector.data=new Float32Array(sector.positions.length*2*16);cached.add(sector);}
        const x=p.x*unitSize,z=p.z*unitSize,bottom=sampleHeight(x,z);
        const scale=.8+((p.x*13+p.z*7)%19)/50,fit=Math.min(scale,(surfaceHeight-bottom-.12)/entry.height);
        preparedPlants++;
        if(fit<=.15)return;
        transform.position.set(x,bottom+entry.height*fit/2-.025,z);transform.scale.set(scale,fit,scale);
        const angle=((p.x*11+p.z*23)%100)/100*Math.PI;
        for(const turn of [angle,angle+Math.PI/2]) {
            transform.rotation.y=turn;transform.updateMatrix();
            const offset=sector.count++*16;transform.matrix.toArray(sector.data,offset);
            boundsMatrix.fromArray(sector.data,offset);
            box.copy(entry.mesh.geometry.boundingBox).applyMatrix4(boundsMatrix);sector.box.union(box);
        }
    }
    function schedule() {if(!scheduled&&queue.length){scheduled=true;setTimeout(pump,4);}}
    function pump() {
        scheduled=false;const started=performance.now();let work=0;
        while(enabled&&queue.length) {
            const sector=queue[0];
            if(!sector.wanted||sector.ready){queue.shift();continue;}
            preparePlant(sector);
            if(sector.cursor===sector.positions.length) {
                sector.ready=true;readyCount++;sector.slots=new Int32Array(sector.count).fill(-1);
                sector.data=sector.data.slice(0,sector.count*16);
                sector.box.expandByScalar(.2).getBoundingSphere(sector.sphere);queue.shift();
            }
            if(++work%8===0&&performance.now()-started>=2)break;
        }
        synchronize();schedule();
    }
    function update(camera,fogPlane,maxDistance,preload=true) {
        enabled=preload;range=maxDistance;fog=fogPlane;
        if(!enabled){queue=[];for(const sector of wantedSectors)sector.wanted=false;wantedSectors.clear();synchronize();return;}
        camera.updateMatrixWorld(true);camera.getWorldPosition(eye);camera.getWorldDirection(forward);
        frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
        queue=[];
        // Comprobar las cuatro esquinas también conserva cobertura con el giro del río.
        const m=camera.matrixWorld.elements,tanVertical=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
        const lateral=Math.abs((m[0]*forward.x+m[2]*forward.z)*tanVertical*camera.aspect);
        const vertical=Math.abs((m[4]*forward.x+m[6]*forward.z)*tanVertical);
        const canExcludeBehind=forward.x**2+forward.z**2>lateral+vertical+.000001;
        const candidates=[],reach=Math.ceil((maxDistance+margin+5)/size)+1;
        const cellX=Math.floor(eye.x/size),cellZ=Math.floor(eye.z/size),nextWanted=new Set();
        for(let z=cellZ-reach;z<=cellZ+reach;z++)for(let x=cellX-reach;x<=cellX+reach;x++)
            for(const sector of grid.get(`${x},${z}`)??[])candidates.push(sector);
        for(const sector of candidates) {
            const dx=sector.x-eye.x,dz=sector.z-eye.z,distance=Math.hypot(dx,dz),r=sector.radius;
            const near=distance<=nearRadius+r;
            const behind=canExcludeBehind&&dx*forward.x+dz*forward.z < -r;
            coarse.min.set(sector.x-r,-1e6,sector.z-r);coarse.max.set(sector.x+r,surfaceHeight,sector.z+r);
            const wanted=distance<=maxDistance+margin+r&&!behind&&(near||frustum.intersectsBox(coarse));
            if(wanted)nextWanted.add(sector);
            if(wanted&&!sector.ready){sector.priority=distance;queue.push(sector);}
        }
        for(const sector of wantedSectors)if(!nextWanted.has(sector)){
            sector.wanted=false;if(!sector.ready)cancelled++;
        }
        for(const sector of nextWanted)sector.wanted=true;
        wantedSectors=nextWanted;
        for(const sector of cached) {
            const distance=Math.hypot(sector.x-eye.x,sector.z-eye.z),r=sector.radius;
            if(distance>maxDistance+size*4+r&&sector.data) {
                remove(sector);if(sector.ready)readyCount--;sector.ready=false;
                sector.cursor=sector.count=0;sector.data=sector.slots=null;
                sector.box.makeEmpty();cached.delete(sector);evicted++;
            }
        }
        queue.sort((a,b)=>a.priority-b.priority);synchronize();schedule();
    }
    return {update,stats(){return {sectors:buckets.length,ready:readyCount,
        queued:queue.length,active:active.size,preparedPlants,cancelled,evicted,
        cachedBytes:[...cached].reduce((n,s)=>n+(s.data?.byteLength??0),0)};}};
}
