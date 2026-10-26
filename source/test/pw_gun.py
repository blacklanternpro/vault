import asyncio,json,sys
from playwright.async_api import async_playwright
# v9.3 revolver: safe closed/open, flap, gun on the shelf, hip, sights, cylinder out, shot + flash, holes
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
OUT='/tmp/build2/shots/'
async def main():
    import os;os.makedirs(OUT,exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'));pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in('error','warning') else None)
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{document.getElementById('overlay').style.display='none';}")
        ok=await pg.evaluate("async()=>{for(let i=0;i<240&&!window.__DEMO.GUN.glb;i++)await new Promise(r=>setTimeout(r,250));return !!window.__DEMO.GUN.glb;}")
        print('glb loaded',ok,flush=True)
        async def at(x,z,yaw,pitch,frames=20,crouch=False):
            await pg.evaluate(f"async()=>{{const D=window.__DEMO;D.keys.ShiftLeft={str(crouch).lower()};const p=D.player;p.body.position.set({x}-8.8,0.37,{z}-4.9);p.body.velocity.set(0,0,0);p.yaw={yaw};p.pitch={pitch};for(let i=0;i<{frames};i++){{{FR};p.yaw={yaw};p.pitch={pitch};}}}}")
        async def shot(name):
            await pg.screenshot(path=OUT+name+'.png');print('shot',name,flush=True)
        await at(15.65,6.5,0,-0.45,25);await shot('g1_safe_closed')
        await pg.evaluate("()=>{const D=window.__DEMO;D.GUN.key=true;D.GS.door.use();}");await at(15.65,6.5,0,-0.45,25)
        await pg.evaluate("()=>{const D=window.__DEMO;D.GS.flap.use();}");await at(15.65,6.5,0,-0.5,25);await shot('g2_safe_open')
        await at(15.65,6.1,0,-0.75,25,True);await shot('g3_gun_on_shelf')
        await pg.evaluate("()=>{const D=window.__DEMO;D.keys.ShiftLeft=false;D.GS.ammoEnt.use();D.gunTake();D.GUN.ch=['L','L','L','L','L','S'];D.GUN.chDirty=true;}")
        await at(13.2,7.6,1.5708,0.02,25);await shot('g4_hip')
        await pg.evaluate("()=>{window.__DEMO.GUN.ads=true;}");await at(13.2,7.6,1.5708,0.02,25);await shot('g5_sights')
        await pg.evaluate("()=>{window.__DEMO.GUN.ads=false;window.__DEMO.GUN.open=true;}");await at(13.2,7.6,1.5708,0.02,25);await shot('g6_cyl_open')
        await pg.evaluate("()=>{window.__DEMO.GUN.open=false;window.__DEMO.GUN.cocked=true;}");await at(13.2,7.6,1.5708,0.02,25);await shot('g7_cocked')
        await pg.evaluate("()=>{window.__DEMO.GUN.ads=true;}");await at(13.2,7.6,1.5708,0.02,25)
        await pg.evaluate("async()=>{const D=window.__DEMO;D.GUN.cocked=false;D.GUN.idx=0;D.gunFire();}");await pg.screenshot(path=OUT+'g8_flash.png');print('shot g8_flash')
        for i in range(4):
            await pg.evaluate("async()=>{const D=window.__DEMO;D.GUN.ch[(D.GUN.idx)%6]='L';D.gunFire();for(let i=0;i<8;i++)await new Promise(r=>requestAnimationFrame(r));}")
        await pg.evaluate("()=>{window.__DEMO.GUN.ads=false;}")
        await at(12.3,7.6,1.5708,-0.0,25);await shot('g9_holes')
        await at(10.6,7.6,-1.5708,0.0,25);await shot('g10_blowout')
        r=await pg.evaluate("()=>{const D=window.__DEMO;return{traces:D.GUN.traces,dec:D.GDEC.count,ev:D.GUN.lastTrace&&D.GUN.lastTrace.ev.slice(0,8),calls:D.renderer.info.render.calls}}")
        print(json.dumps(r))
        print('\n'.join(logs)[:3000]);await b.close()
asyncio.run(main())
