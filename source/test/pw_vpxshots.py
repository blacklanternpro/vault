import asyncio,sys,json
from playwright.async_api import async_playwright
# v8.0: proxies on vs off, same view, pixel diff; plus the old bedsit at ?bedsit
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
V={'kitchen':(6.6,2.6,1.9,-0.2),'living':(10.9,9.3,0.98,-0.15),'hallE':(16.8,4.5,1.5708,-0.1),'office':(7.6,7.6,-2.4,-0.15)}
async def setview(pg,x,z,yaw,pitch,n=24):
    await pg.evaluate(f"""async()=>{{const D=window.__DEMO;const b=D.player.body;for(let i=0;i<{n};i++){{{FR};b.position.set({x}-8.8,0.37,{z}-4.9);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};}}}}""")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540})
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        h1=await pg.evaluate("document.querySelector('#overlay h1').textContent");print('default overlay h1:',h1)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';}");await pg.wait_for_timeout(3000)
        for name,(x,z,yaw,pitch) in V.items():
            await setview(pg,x,z,yaw,pitch,30)
            c1=await pg.evaluate("window.__DEMO.stats().calls");await pg.screenshot(path=f'v8_{name}_on.png')
            await pg.evaluate("window.__DEMO.VPX.on=false");await setview(pg,x,z,yaw,pitch,12)
            c2=await pg.evaluate("window.__DEMO.stats().calls");await pg.screenshot(path=f'v8_{name}_off.png')
            await pg.evaluate("window.__DEMO.VPX.on=true");print(name,'calls on',c1,'off',c2,flush=True)
        pg2=await b.new_page(viewport={'width':960,'height':540})
        await pg2.goto('http://localhost:8765/index.html?bedsit',wait_until='load');await pg2.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        h1=await pg2.evaluate("document.querySelector('#overlay h1').textContent");row=await pg2.evaluate("document.getElementById('vrow').textContent");print('bedsit overlay h1:',h1,'|',row[:90])
        await pg2.screenshot(path='v8_bedsit_overlay.png')
        await pg2.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';}");await pg2.wait_for_timeout(3000)
        print('bedsit villa?',await pg2.evaluate("!!(window.__DEMO.VW&&window.__DEMO.VW.walls&&window.__DEMO.VW.walls.length)"),'calls',await pg2.evaluate("window.__DEMO.stats().calls"))
        await pg2.screenshot(path='v8_bedsit.png')
        await b.close()
asyncio.run(main())
