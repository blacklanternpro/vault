import asyncio,sys,time,json
from playwright.async_api import async_playwright
# v6 villa browser check: boots ?villa, stands in a few spots, screenshots each and prints renderer cost.
# usage: python3 pw_villa.py [shots...]   (default: all)
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
SPOTS={
 'entry':   (3.8,9.0, 0.0,-0.05),
 'hall':    (4.2,4.5, -1.5708,-0.05),
 'kitchen': (8.0,2.5, 1.2,-0.15),
 'living':  (8.0,6.0, -2.5,-0.1),
 'master':  (12.4,6.0,-2.3,-0.1),
 'bath':    (10.9,3.4, 2.8,-0.25),
 'garage':  (1.6,6.0, 3.14,-0.1),
 'front':   (8.8,15.5, 0.0,0.05),
 'back':    (6.0,-5.5, 3.14,0.05),
 'halldoor':(12.2,4.4, 0.0,0.35),
 'halldoor2':(9.8,4.6, 0.3,0.45),
}
async def main():
    want=sys.argv[1:] or list(SPOTS)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.add_init_script('window.__NOSHADOW='+('true' if __import__('os').environ.get('NOSHADOW') else 'false'));t=time.time();await pg.goto('http://localhost:8765/index.html?villa',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000);print('boot',round(time.time()-t,1),'s',flush=True)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';if(window.__NOSHADOW)D.perfMode=true;}")
        await pg.wait_for_timeout(1500)
        for name in want:
            x,z,yaw,pitch=SPOTS[name]
            r=await pg.evaluate(f"""async()=>{{const D=window.__DEMO;const p=D.player;p.body.position.set({x}-8.8,0.37,{z}-4.9);p.body.velocity.set(0,0,0);p.yaw={yaw};p.pitch={pitch};
              for(let i=0;i<10;i++){FR};const t0=performance.now();for(let i=0;i<6;i++){FR};const ms=(performance.now()-t0)/12;const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies,frameMs:+ms.toFixed(1),physMs:+s.physMs.toFixed(2),renderMs:+s.renderMs.toFixed(1)}};}}""")
            await pg.screenshot(path=f'/tmp/build2/v_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
