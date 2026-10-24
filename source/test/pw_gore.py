import asyncio,sys,json,time,os
from playwright.async_api import async_playwright
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
ONLY=[x for x in os.environ.get('ONLY','').split(',') if x]
async def main():
    W=960;H=540
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':W,'height':H});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8765/index.html',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';D.perfMode=true;document.getElementById('hud').style.display='none';}")
        await pg.wait_for_timeout(1000)
        async def snap(name,js,frames=4):
            t=time.time()
            r=await pg.evaluate(f"async()=>{{const D=window.__DEMO;const EX=D.EX;const V=(x,y,z)=>D.camera.position.clone().set(x,y,z);const wp=o=>o.getWorldPosition(D.camera.position.clone());const look=(x,y,z)=>{{const c=EX.dbgCam||V(EX.P.x,1.62,EX.P.z);const dx=x-c.x,dy=y-c.y,dz=z-c.z;EX.aimYaw=Math.atan2(-dx,-dz);EX.aimPitch=Math.atan2(dy,Math.hypot(dx,dz));}};const F=async(n)=>{{for(let i=0;i<n;i++){FR};}};const fire=async(o,dy=0)=>{{const p=wp(o);p.y+=dy;look(p.x,p.y,p.z);await F(1);EX.cool=0;EX.reloadT=0;if(EX.mag<1)EX.mag=12;D.exFire();await F(1);}};let out=null;{js};for(let i=0;i<{frames};i++){FR};return out;}}")
            if not ONLY or name in ONLY: await pg.screenshot(path=f'/tmp/build2/g_{name}.png')
            print(name,round(time.time()-t,1),r,flush=True)
        await snap('boot',"D.PC.use();for(let i=0;i<3;i++){D.PC.t=5;await F(1);}D.player.body.position.set(-1.9,0.4,-2.4);D.SEAT.use();D.exGo('intro');EX.st=1.25;await F(3);window.__EXVIEW=true;EX.gun.visible=false;out=EX.state;",4)
        await snap('face',"EX.dbgCam=V(0.0,0.98,0.85);EX.pris.headUpT=30;look(0,0.97,0.3);await F(10);out=EX.pris.temper;",6)
        await snap('sci',"EX.dbgCam=V(0.3,1.6,-2.3);look(0.05,1.5,-3.7);await F(3);out=EX.sci.map(s=>s.act);",4)
        await snap('scream',"EX.dbgCam=V(0.0,0.98,0.85);look(0,0.97,0.3);EX.pris.screamOT=5;EX.pris.squeezeT=5;await F(6);out=1;",4)
        await snap('arm',"await fire(EX.pris.parts.uArmR.mesh);await fire(EX.pris.parts.uArmR.mesh);await F(30);const a=EX.pris.parts.uArmR.mesh.getWorldPosition(V(0,0,0));EX.dbgCam=V(a.x+0.5,a.y+0.4,a.z+0.6);look(a.x,a.y,a.z);await F(6);out=[EX.pris.parts.uArmR.severed,EX.pris.alive];",6)
        await snap('torso',"EX.dbgCam=null;for(let k=0;k<3;k++)await fire(EX.pris.parts.torso.mesh);await F(80);const t=wp(EX.pris.parts.torso.mesh);EX.dbgCam=V(t.x+0.3,t.y+0.7,t.z+0.35);look(t.x,t.y,t.z);await F(30);out=[EX.pris.parts.torso.opened,EX.pris.alive];",6)
        await snap('head',"EX.dbgCam=null;await fire(EX.pris.parts.head.mesh);await F(10);await fire(EX.pris.parts.head.mesh);await F(30);const h=wp(EX.pris.parts.head.mesh);EX.dbgCam=V(h.x+0.25,h.y+0.3,h.z+0.25);look(h.x,h.y,h.z);await F(8);out=[EX.pris.alive,EX.pris.chs,EX.pris.parts.head.gone];",6)
        await snap('pool',"await F(120);EX.dbgCam=V(0.6,1.3,1.6);look(0,0,0.2);await F(4);out=EX.pools.length;",4)
        await snap('walk',"EX.dbgCam=null;D.exPressNext();await F(70);const g=EX.pris.group.position;EX.dbgCam=V(g.x+0.9,1.3,g.z+0.9);look(g.x,1.0,g.z);await F(4);out=EX.pris.stage;",4)
        print('\n'.join(l for l in logs if '404' not in l)[:3000])
        await b.close()
asyncio.run(main())
