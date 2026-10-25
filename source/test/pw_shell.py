import asyncio,sys,time,json,os
from playwright.async_api import async_playwright
# v6.4 WS1 browser shots: (plan x, plan z, yaw, pitch, prep js). y is the body centre (0.37 on the floor).
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
SHOTS={
 'hall':     (16.8,4.5, 1.5708,-0.05, ''),
 'hall2':    (4.0,4.5, -1.5708,0.0, ''),
 'living':   (8.0,9.2, -0.6,-0.15, ''),
 'master':   (12.2,9.2, -0.5,-0.35, ''),
 'ripped':   (12.0,9.3, -0.5,-0.45, "const cs=D.VS.strips.find(e=>e.alive&&e.strip.room==='living');if(cs)cs.use();"),
 'cornice':  (9.0,7.0, 0.3,0.75, ''),
 'front':    (3.8,7.5, 0.0,0.05, "const f=D.VS.doors.find(d=>d.label.startsWith('front'));if(f.kin.target===0)f.use();"),
 'window':   (13.4,1.0, 0.0,0.05, "const g=D.VS.slides.find(e=>e.slide.label==='THE WINDOW'&&Math.abs(e.mesh.position.z-(0-4.9))<0.4&&Math.abs(e.mesh.position.x-(13.4-8.8))<1.2);if(g&&g.slide.target===0)g.use();"),
 'garage':   (1.6,6.5, 3.14159,0.1, ''),
 'roller':   (1.6,6.5, 3.14159,0.1, "if(D.VS.roller.target===0)D.VS.roller.e.use();for(let i=0;i<40;i++)await new Promise(r=>requestAnimationFrame(r));"),
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
        await pg.wait_for_timeout(800)
        for name in want:
            x,z,yaw,pitch,prep=SHOTS[name]
            js=f"""async()=>{{const D=window.__DEMO;{prep}for(let i=0;i<8;i++){FR};const b=D.player.body;b.position.set({x}-8.8,0.37,{z}-4.9);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};
              for(let i=0;i<14;i++){{{FR};b.position.set({x}-8.8,0.37,{z}-4.9);b.velocity.set(0,0,0);}}const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies}};}}"""
            r=await pg.evaluate(js)
            await pg.screenshot(path=f'/tmp/build2/s_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
