import asyncio,json,sys
from playwright.async_api import async_playwright
# v9.4: a walk through the rescaled house: one shot per room from a corner, looking across it
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
K=4/3;OX,OZ=-8.8,-4.9
def W(px,pz):return(px*K+OX,pz*K+OZ)
# name, eye plan x/z, look-at plan x/z, pitch
VIEWS=[('kitchen',5.5,3.6,2.4,0.4,-0.25),('dining',9.0,3.7,6.0,0.5,-0.15),('laundry',2.0,3.8,0.3,1.0,-0.2),('garage',2.9,9.5,0.4,4.4,-0.15),
 ('entry',3.8,9.5,3.8,4.6,-0.1),('hall',4.0,4.5,17.0,4.5,-0.1),('office',7.0,9.5,4.6,5.2,-0.15),('living',11.3,9.5,7.5,5.3,-0.15),
 ('master',15.0,9.6,11.8,5.2,-0.15),('wir',15.4,7.2,17.4,5.2,-0.2),('ensuite',15.4,9.6,17.4,7.6,-0.25),('bath',11.4,2.5,9.4,0.2,-0.25),
 ('bed3',14.4,3.8,11.8,0.3,-0.15),('bed2',17.4,3.8,14.8,0.3,-0.15),('wc',10.2,3.9,9.6,2.7,-0.45),('street',5.5,21.6,25.0,21.6,-0.02),('front',5.0,17.0,5.0,9.0,0.05)]
async def main():
    only=sys.argv[1:]
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'));pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{document.getElementById('overlay').style.display='none';}")
        for (n,ex,ez,tx,tz,pt) in VIEWS:
            if only and n not in only:continue
            x,z=W(ex,ez);X,Z=W(tx,tz);import math;yaw=math.atan2(-(X-x),-(Z-z))
            r=await pg.evaluate(f"async()=>{{const D=window.__DEMO;const p=D.player;p.body.position.set({x},0.37,{z});p.body.velocity.set(0,0,0);for(let i=0;i<14;i++){{{FR};p.yaw={yaw};p.pitch={pt};p.body.position.x={x};p.body.position.z={z};}}return D.renderer.info.render.calls;}}")
            await pg.screenshot(path=f'/tmp/build2/shots/r_{n}.png');print('shot',n,'calls',r,flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2000]);await b.close()
asyncio.run(main())
