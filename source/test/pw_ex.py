import asyncio,sys,json,time
from playwright.async_api import async_playwright
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
async def main():
    shots=sys.argv[1].split(',') if len(sys.argv)>1 and sys.argv[1] else None
    W=int(sys.argv[2]) if len(sys.argv)>2 else 960; H=W*9//16
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':W,'height':H});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8765/index.html',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';D.perfMode=true;D.HUD.el.msg.style.display='none';}")
        await pg.wait_for_timeout(1500)
        async def snap(name,js,frames=6,wait=0):
            t=time.time()
            r=await pg.evaluate(f"async()=>{{const D=window.__DEMO;const EX=D.EX;const V=(x,y,z)=>D.camera.position.clone().set(x,y,z);const wp=o=>o.getWorldPosition(D.camera.position.clone());const aim=async(tp)=>{{const c=EX.cam.getWorldPosition(D.camera.position.clone());const d=tp.clone().sub(c);EX.aimYaw=Math.atan2(-d.x,-d.z);EX.aimPitch=Math.atan2(d.y,Math.hypot(d.x,d.z));EX.kickP=0;{FR};}};const fire=async(o,dy=0)=>{{const p=wp(o);p.y+=dy;await aim(p);EX.cool=0;EX.reloadT=0;D.exFire();{FR};}};const waitS=async(st,ms=60000)=>{{const t0=performance.now();while(EX.state!==st&&performance.now()-t0<ms)await new Promise(r=>setTimeout(r,100));}};let out=null;{js};for(let i=0;i<{frames};i++){FR};return out;}}")
            if wait: await pg.wait_for_timeout(wait)
            if shots is None or name in shots:
                await pg.screenshot(path=f'/tmp/build2/x_{name}.png')
            print(name,round(time.time()-t,1),r,flush=True)
        await snap('boot',"D.PC.use();for(let i=0;i<3;i++){D.PC.t=5;await new Promise(r=>setTimeout(r,50));await new Promise(r=>requestAnimationFrame(r))}D.PC.t=5;await new Promise(r=>requestAnimationFrame(r));await new Promise(r=>requestAnimationFrame(r));D.player.body.position.set(-1.9,0.4,-2.4);D.SEAT.use();out=[D.SEAT.active,EX.state,D.PC.state];",12)
        await snap('title',"D.exGo('title');out=EX.state;",3)
        await snap('play',"D.exGo('intro');EX.st=1.25;await new Promise(r=>requestAnimationFrame(r));EX.pt=12;EX.lines={pa1:1,pa2:1,pa3:1};EX.cap={who:'PA',text:'YOU HAVE ONE INSTRUCTION.',t:30};EX.objT=30;EX.hudDirty=true;out=[EX.state,EX.humans.length];",4)
        await snap('lean',"D.SEAT.lean=0.36;out=EX.humans.length;",8)
        await snap('sights',"EX.ads=true;await aim(wp(EX.pris.parts.head.mesh));out=EX.adsK.toFixed(2);",8)
        await snap('shot1',"EX.ads=false;for(let i=0;i<6;i++)await new Promise(r=>requestAnimationFrame(r));await fire(EX.pris.parts.thighR.mesh);out=EX.pris.health;",1)
        await snap('shot2',"await fire(EX.pris.parts.thighR.mesh);out=[EX.pris.downed,EX.pris.parts.thighR.severed];",10)
        await snap('downed',"for(let i=0;i<20;i++)await new Promise(r=>requestAnimationFrame(r));out=[EX.pris.alive,EX.pris.health|0];",2)
        await snap('glass',"for(let i=0;i<5;i++){await aim(V(-1.2+i*0.6,1.85,-2.68));EX.cool=0;D.exFire();await new Promise(r=>requestAnimationFrame(r));}for(let i=0;i<25;i++)await new Promise(r=>requestAnimationFrame(r));out=[EX.glassBroken,EX.cap.text];",2)
        await snap('sci',"const s=EX.sci[2];await fire(s.parts.torso.mesh);await fire(s.parts.lArmR.mesh);await fire(s.parts.lArmR.mesh);for(let i=0;i<12;i++)await new Promise(r=>requestAnimationFrame(r));out=[s.alive,s.parts.lArmR.severed];",2)
        await snap('sci2',"const s=EX.sci[0];await fire(s.parts.head.mesh);for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));await fire(s.parts.head.mesh);for(let i=0;i<14;i++)await new Promise(r=>requestAnimationFrame(r));out=[s.alive,s.parts.head.gone];",2)
        await snap('defy',"for(const s of EX.sci){for(let k=0;k<3&&s.alive;k++){await fire(s.parts.head.mesh);}}for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));out=[EX.state,EX.ending];",2)
        await snap('endc',"D.exGo('endC');EX.st=3;out=EX.state;",3)
        for k,t in [(3,13)]:
            await snap(f'ad{k}',f"D.exGo('ad');EX.st={t};EX.adI=0;out=EX.st;",3)
        await snap('stand',"D.exGo('title');D.standUp();for(let i=0;i<12;i++)await new Promise(r=>requestAnimationFrame(r));D.player.body.position.set(-1.85,0.4,-2.75);D.player.yaw=0;D.player.pitch=-0.25;for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));out=[D.SEAT.active];",2)
        print(json.dumps(await pg.evaluate("()=>window.__DEMO.stats()")))
        print('\n'.join(l for l in logs if '404' not in l)[:3000])
        await b.close()
asyncio.run(main())
