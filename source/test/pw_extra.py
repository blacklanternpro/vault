import asyncio,math
from playwright.async_api import async_playwright
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
K=4/3;OX,OZ=-8.8,-4.9
def W(px,pz):return(px*K+OX,pz*K+OZ)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{document.getElementById('overlay').style.display='none';const D=window.__DEMO;D.villaBasement();D.VB.hatch.kin.target=D.VB.hatch.kin.open;}")
        for n,(ex,y,ez),(tx,tz),pt in [('b_stairs',(0.9,0.37,4.4),(0.9,6.5),-0.6),('b_bunk',(5.6,-2.23,8.6),(2.0,5.0),-0.1),('b_tunnel',(8.8,-2.23,6.8),(13.5,6.8),-0.05),('roof',(10.05,3.5,4.6),(14.0,8.0),-0.2)]:
            x,z=W(ex,ez);X,Z=W(tx,tz);yaw=math.atan2(-(X-x),-(Z-z))
            await pg.evaluate(f"async()=>{{const D=window.__DEMO;const p=D.player;for(let i=0;i<14;i++){{p.body.position.set({x},{y},{z});p.body.velocity.set(0,0,0);p.yaw={yaw};p.pitch={pt};{FR};}}}}")
            await pg.screenshot(path=f'/tmp/build2/shots/{n}.png');print('shot',n,flush=True)
        print('\n'.join(logs)[:1500]);await b.close()
asyncio.run(main())
