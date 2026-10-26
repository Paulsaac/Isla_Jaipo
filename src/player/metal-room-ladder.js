// W/↑ engancha al acercarse de frente; S/↓ desciende y suelta en el suelo.
export function createMetalRoomLadder(camera,controls,room,eyeHeight) {
    const player=controls.getObject(),ladder=room.ladder;
    let active=false,height=0;
    const forward=camera.position.clone();
    return {
        get active(){return active;},
        reset(){active=false;height=0;},
        update(delta,input,canAttach=true) {
            if(!room.active||room.busy){active=false;height=0;return false;}
            const axis=Number(input.forward)-Number(input.backward);
            if(!active) {
                if(!canAttach||axis<=0)return false;
                camera.getWorldDirection(forward);forward.y=0;forward.normalize();
                if(Math.hypot(player.position.x-ladder.x,player.position.z-ladder.z)>.62
                    ||Math.abs(player.position.y-eyeHeight-ladder.baseY)>.25||forward.z<.55)return false;
                active=true;height=0;
            }
            height=Math.max(0,Math.min(ladder.maxFootHeight,height+axis*1.05*Math.min(delta,.1)));
            player.position.set(ladder.x,ladder.baseY+height+eyeHeight,
                ladder.z+(ladder.topZ-ladder.z)*height/ladder.maxFootHeight);
            if(axis<0&&height===0){player.position.z-=.5;active=false;}
            return true;
        }
    };
}
