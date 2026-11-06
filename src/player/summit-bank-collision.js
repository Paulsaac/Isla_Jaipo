import { UNIT_SIZE } from '../config.js';
import { summitInnerBank, summitRidge } from '../content/summit-layout.js';

// El talud ocupa el volumen bajo su coronación; el camino y las explanadas siguen libres.
export function blocksSummitInnerBank(profile,x,z,feetY,terrainHeight) {
    if(!profile?.contourTrail||!profile.summitRoute?.length||!terrainHeight)return false;
    const gx=x/UNIT_SIZE,gz=z/UNIT_SIZE,b=summitInnerBank;
    if(gx<b.minX||gx>b.maxX||gz<b.minZ||gz>b.maxZ)return false;
    let distance=Infinity,roadTop=profile.summitHeight;
    const route=profile.summitRoute;
    for(let i=1;i<route.length;i++) {
        const a=route[i-1],c=route[i],dx=c.x-a.x,dz=c.z-a.z,l2=dx*dx+dz*dz;
        if(l2<1e-10)continue;
        const t=Math.max(0,Math.min(1,((gx-a.x)*dx+(gz-a.z)*dz)/l2));
        const d=Math.hypot(gx-a.x-dx*t,gz-a.z-dz*t);
        if(d<distance){distance=d;roadTop=a.y+(c.y-a.y)*t;}
    }
    if(distance<=summitRidge.halfWidth+.12)return false;
    const ground=terrainHeight(x,z);
    if(ground<=profile.summitHeight+b.minRise||feetY>=Math.max(ground,roadTop)+.1)return false;
    const step=.4;
    const slopeX=(terrainHeight(x+step,z)-terrainHeight(x-step,z))/(2*step);
    const slopeZ=(terrainHeight(x,z+step)-terrainHeight(x,z-step))/(2*step);
    return slopeX*slopeX+slopeZ*slopeZ>b.minSlope*b.minSlope;
}
