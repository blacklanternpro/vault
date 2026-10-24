import asyncio,sys,json,time
from playwright.async_api import async_playwright
import os
ONLY=[x for x in os.environ.get('ONLY','').split(',') if x]
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
async def main():
    W=int(sys.argv[1]) if len(sys.argv)>1 else 960; H=W*9//16
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':W,'height':H});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8765/index.html',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';D.perfMode=true;D.HUD.el.msg.style.display='none';}")
        await pg.wait_for_timeout(1500)
        async def snap(name,js,frames=6):
            t=time.time()
            r=await pg.evaluate(f"async()=>{{const D=window.__DEMO;const EX=D.EX;const V=(x,y,z)=>D.camera.position.clone().set(x,y,z);const wp=o=>o.getWorldPosition(D.camera.position.clone());const look=(x,y,z)=>{{const c=EX.cam.position;const dx=x-c.x,dy=y-c.y,dz=z-c.z;EX.aimYaw=Math.atan2(-dx,-dz);EX.aimPitch=Math.atan2(dy,Math.hypot(dx,dz));}};const F=async(n)=>{{for(let i=0;i<n;i++){FR};}};let out=null;{js};for(let i=0;i<{frames};i++){FR};return out;}}")
            if not ONLY or name in ONLY: await pg.screenshot(path=f'/tmp/build2/e_{name}.png')
            print(name,round(time.time()-t,1),r,flush=True)
        await snap('start',"D.PC.use();for(let i=0;i<3;i++){D.PC.t=5;await F(1);}D.player.body.position.set(-1.9,0.4,-2.4);D.SEAT.use();D.SEAT.lean=0.36;D.exGo('intro');EX.st=1.25;await F(2);out=[EX.state,EX.pris.num];",10)
        if ONLY==['hatch']:
            await snap('hatch',"D.exPressNext();EX.P.x=0.8;EX.P.z=3.2;await F(6);look(-3,1.0,1.8);await F(20);out=[EX.pris.stage,EX.hatch.y];",6)
            await b.close();return
        await snap('door',"EX.P.x=1.4;EX.P.z=-0.6;look(2.6,1.2,-2.55);out=EX.prompt;",6)
        await snap('dooropen',"D.exBlowHandle(wp(EX.handleMeshes[0]),V(0,0,-1));await F(20);EX.P.x=2.4;EX.P.z=-1.4;look(2.7,1.2,-3.6);out=EX.door.open;",8)
        await snap('control',"EX.P.x=2.55;EX.P.z=-4.2;await F(4);look(-0.5,1.0,-4.6);await F(30);out=EX.sci.map(s=>s.act);",6)
        await snap('console',"EX.P.x=1.5;EX.P.z=-3.6;EX.cover.open=true;await F(4);look(1.55,0.98,-3.0);out=EX.prompt;",8)
        await snap('hatch',"D.exPressNext();EX.P.x=0.8;EX.P.z=3.2;await F(6);look(-3,1.0,1.8);await F(20);out=[EX.pris.stage,EX.hatch.y];",6)
        await snap('lightsoff',"for(let i=0;i<40&&EX.pris.stage!=='ready';i++)await F(1);look(0,0.8,0.4);D.EX.lights=true;await F(1);out=EX.pris.stage;",4)
        await snap('lightsoff2',"(function(){EX.lights=false;})();EX.tube.material.color.setScalar(0.12);EX.glow.intensity=3.2;EX.hemi.intensity=0.06;if(EX.fillL)EX.fillL.intensity=0;out=EX.lights;",8)
        await snap('menu',"EX.tube.material.color.setScalar(1);EX.glow.intensity=0.5;EX.hemi.intensity=0.3;if(EX.fillL)EX.fillL.intensity=2.6;EX.lights=true;EX.menu={i:1};EX.hudDirty=true;out=1;",4)
        await snap('notes',"EX.menu=null;const s=EX.sci[0];EX.notes={who:s.name,lines:['OBSERVATION LOG · CELL 04','Operator hesitated 41 s.','7 rounds discharged.','Hands steady.','Recommend: retain.'],t:30};EX.hudDirty=true;out=1;",4)
        await snap('alarm',"EX.notes=null;D.exGo&&0;EX.banner={t:10,a:'SUBJECT NON-COMPLIANT',b:'OPERATOR FLAGGED · SECURITY NOTIFIED',col:'#fff',alarm:true};EX.alarmT=8;EX.hudDirty=true;out=1;",4)
        print('\n'.join(l for l in logs if '404' not in l)[:3000])
        await b.close()
asyncio.run(main())
