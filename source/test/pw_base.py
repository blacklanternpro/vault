import asyncio,math,sys
from playwright.async_api import async_playwright
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
K=4/3;OX,OZ=-8.8,-4.9
def W(px,pz):return(px*K+OX,pz*K+OZ)
V=[('ab_air_e',(0.9,7.45),(3,7.45)),('ab_bunk_w',(3.8,7.45),(1.5,7.45)),('ab_bunk_e',(4.3,6.8),(6.1,6.8)),('ab_plant_w',(7.6,6.8),(6.1,6.8)),('ab_plant_e',(6.8,6.8),(8.5,6.8)),('ab_tun_w',(10.2,6.8),(8.5,6.8)),('ab_tun_e',(11.3,6.8),(13.1,6.8)),('ab_esc_w',(14.1,6.8),(12.0,6.8)),('ab_stairs',(0.9,6.0),(0.9,8.3))]
async def main():
    only=sys.argv[1:]
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':800,'height':450});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{document.getElementById('overlay').style.display='none';const D=window.__DEMO;D.villaBasement();D.VB.hatch.kin.target=D.VB.hatch.kin.open;}")
        for n,(ex,ez),(tx,tz) in V:
            if only and n not in only:continue
            x,z=W(ex,ez);X,Z=W(tx,tz);yaw=math.atan2(-(X-x),-(Z-z))
            await pg.evaluate(f"async()=>{{const D=window.__DEMO;const p=D.player;for(let i=0;i<12;i++){{p.body.position.set({x},-2.23,{z});p.body.velocity.set(0,0,0);p.yaw={yaw};p.pitch=-0.12;{FR};}}}}")
            await pg.screenshot(path=f'/tmp/build2/shots/{n}.png');print('shot',n,flush=True)
        print('\n'.join(logs)[:1500]);await b.close()
asyncio.run(main())
