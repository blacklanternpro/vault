import asyncio,sys,time,json,os
from playwright.async_api import async_playwright
# v6.9 WS6/WS7 browser shots: (plan x, plan z, yaw, pitch, prep js)
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
SHOTS={
 'bricks': (13.0,-2.2,3.14159,0.05,''),
 'bricks2':(13.0,-1.2,3.14159,0.0,"const B=D.VBSKINS[0];for(const id of [700,701,702,760,761,820])D.chipBrick(B.w,id,B.list[id].p.clone(),null);for(const id of [700,760,761])D.chipBrick(B.w,id,B.list[id].p.clone(),null);"),
 'runner': (5.6,4.5,-1.5708,-0.38,''),
 'rug':    (10.9,9.3,0.98,-0.5,''),
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
            await pg.screenshot(path=f'/tmp/build2/v7_{name}.png');print(name,json.dumps(r),flush=True)
            if 'KeyN' in prep: await pg.evaluate("()=>window.__DEMO.vibeKey('KeyN')")
            if 'KeyB' in prep: await pg.evaluate("()=>window.__DEMO.vibeKey('KeyB')")
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
