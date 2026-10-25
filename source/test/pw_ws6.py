import asyncio,sys,time,json,os
from playwright.async_api import async_playwright
# v6.9 WS6/WS7 browser shots: (plan x, plan z, yaw, pitch, prep js)
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
SHOTS={
 'master': (12.3,9.3,-0.44,-0.3,''),
 'fan':    (13.0,9.4,-0.52,0.55,"D.VR6.fan.e.use();D.VR6.fan.e.use();"),
 'wir':    (15.5,6.2,-1.5708,-0.15,''),
 'bed2':   (15.0,3.6,-0.76,-0.3,''),
 'bed3':   (12.0,3.6,-0.6,-0.3,''),
 'garage': (2.7,4.5,2.65,-0.15,''),
 'neon':   (1.0,6.9,-0.95,0.15,"D.vibeKey('KeyN');"),
 'entry':  (3.9,9.2,0.29,-0.2,"D.vibeKey('KeyN');"),
 'yard':   (6.0,-7.5,-2.6,-0.05,''),
 'front':  (5.0,13.8,0.25,-0.1,''),
 'am2':    (10.9,9.3,0.98,-0.15,"D.vibeKey('KeyN');"),
 'bond':   (10.9,9.3,0.98,-0.15,"D.vibeKey('KeyN');D.bondHit('window glass',260);D.bondHit('carpet',240);D.bondHit('plasterboard patching',45);D.bondHit('plasterboard patching',45);D.bondHit('gas explosion (structural)',12500);D.vibeKey('KeyB');"),
}
async def main():
    want=sys.argv[1:] or list(SHOTS)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        t=time.time();await pg.goto('http://localhost:8765/index.html?villa',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000);print('boot',round(time.time()-t,1),'s',flush=True)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';}")
        await pg.wait_for_timeout(2500)
        for name in want:
            x,z,yaw,pitch,prep=SHOTS[name]
            y=0.37
            js=f"""async()=>{{const D=window.__DEMO;{prep}for(let i=0;i<8;i++){FR};const b=D.player.body;b.position.set({x}-8.8,{y},{z}-4.9);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};
              for(let i=0;i<14;i++){{{FR};b.position.set({x}-8.8,{y},{z}-4.9);b.velocity.set(0,0,0);}}const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies}};}}"""
            r=await pg.evaluate(js)
            await pg.screenshot(path=f'/tmp/build2/r_{name}.png');print(name,json.dumps(r),flush=True)
            if 'KeyN' in prep: await pg.evaluate("()=>window.__DEMO.vibeKey('KeyN')")
            if 'KeyB' in prep: await pg.evaluate("()=>window.__DEMO.vibeKey('KeyB')")
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
