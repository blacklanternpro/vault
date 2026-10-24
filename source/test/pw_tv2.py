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
        await snap('couch2',"D.sitDown('couch');D.TVB.t=38+9;out=[D.SEAT.at];",12)
        await snap('squint',"D.COUCH.zoom=true;D.TVB.t=58+11;out=D.camera.fov;",14)
        print('\n'.join(l for l in logs if '404' not in l)[:3000])
        await b.close()
asyncio.run(main())
