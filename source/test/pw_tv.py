import asyncio,sys,json,time
from playwright.async_api import async_playwright
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
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';D.perfMode=true;}")
        await pg.wait_for_timeout(1500)
        async def snap(name,js,frames=6):
            t=time.time()
            r=await pg.evaluate(f"async()=>{{const D=window.__DEMO;const V=(x,y,z)=>D.camera.position.clone().set(x,y,z);let out=null;{js};for(let i=0;i<{frames};i++){FR};return out;}}")
            await pg.screenshot(path=f'/tmp/build2/t_{name}.png')
            print(name,round(time.time()-t,1),r,flush=True)
        await snap('sofa',"D.player.body.position.set(-0.6,0.9,-0.2);D.player.yaw=Math.atan2(-(1.05+0.6),-(-1.0+0.2));D.player.pitch=-0.35;out=D.COUCH.remote.mesh.position.toArray();",6)
        await snap('couch',"D.sitDown('couch');D.TVB.t=3.0;out=[D.SEAT.at,D.TV.ch];",12)
        await snap('remote',"D.SEATS.couch.look(0,400);out=D.SEAT.lp;",8)
        await snap('back',"D.SEATS.couch.look(0,-400);out=D.SEAT.lp;",4)
        await snap('owlturn',"D.TVB.t=6.55;out=D.TVREEL.lt;",4)
        await snap('standby',"D.TVB.t=12;D.TVCAP.t=0;out=D.TVREEL.lt;",6)
        await snap('look',"D.SEATS.couch.look(-500,60);out=D.SEAT.ly;",8)
        await snap('ch3',"D.SEATS.couch.look(500,-60);D.SEATS.couch.key('Digit3');out=D.TV.src;",6)
        await snap('vol',"D.SEATS.couch.key('Digit7');D.SEATS.couch.key('KeyV');D.SEATS.couch.key('KeyT');out=D.TV.vol;",6)
        await snap('sweep',"D.SEATS.couch.key('Digit7');let off=0;const res=[];for(const s of D.TVREEL.segs){for(const f of [0.05,0.35,0.65,0.9]){D.TVB.t=off+s.dur*f;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}res.push(s.id);off+=s.dur;}D.TVB.t=58+27;out=res.join(',');",4)
        await snap('tunnel',"D.TVB.t=58+27.5;out=D.TVCAP.text;",3)
        await snap('room',"D.standUp();for(let i=0;i<30;i++)await new Promise(r=>requestAnimationFrame(r));D.player.body.position.set(2.4,0.9,0.4);D.player.yaw=Math.atan2(-(-3.2-2.4),-(-1.0-0.4));D.player.pitch=-0.12;out=D.TVL.light.intensity;",8)
        print('\n'.join(l for l in logs if '404' not in l)[:3000])
        await b.close()
asyncio.run(main())
