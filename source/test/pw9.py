import asyncio,sys,json,time
from playwright.async_api import async_playwright
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
LOOK="""const look=async(t,px,pz,dy)=>{D.player.body.position.set(px,0.4,pz);D.player.body.velocity.set(0,0,0);for(let i=0;i<3;i++)await new Promise(r=>requestAnimationFrame(r));const e=D.camera.getWorldPosition(new t.constructor());D.player.yaw=Math.atan2(-(t.x-e.x),-(t.z-e.z));D.player.pitch=Math.atan2(t.y+(dy||0)-e.y,Math.hypot(t.x-e.x,t.z-e.z));for(let i=0;i<3;i++)await new Promise(r=>requestAnimationFrame(r));};const wp=o=>o.getWorldPosition(D.camera.position.clone());"""
async def main():
    shots=sys.argv[1].split(',') if len(sys.argv)>1 else None
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        page = await browser.new_page(viewport={'width':800,'height':450})
        logs=[]
        page.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        page.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await page.goto('http://localhost:8765/index.html', wait_until='load')
        await page.wait_for_function('window.__DEMO !== undefined', timeout=300000)
        await page.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';D.perfMode=true;D.HUD.el.msg.style.display='none';}")
        await page.wait_for_timeout(2500)
        async def snap(name,js,frames=6):
            if shots and name not in shots: return
            t=time.time()
            r=await page.evaluate(f"async()=>{{const D=window.__DEMO;{LOOK}let out=null;{js};for(let i=0;i<{frames};i++){FR};return out;}}")
            await page.screenshot(path=f'/tmp/build2/a_{name}.png')
            print(name,round(time.time()-t,1),r,flush=True)
        await snap('fridge_front',"D.setTool(0);const f=wp(D.FRIDGE.body.mesh);await look(f,f.x-1.9,f.z-0.2,0.1);for(const d of D.FRIDGE.doors)d.use&&d.use();",50)
        await snap('tv_smash',"D.setTool(0);const g=D.TV.glassE||D.TV.glass;const f=wp(g.mesh);await look(f,f.x+1.3,f.z,0);D.hammerSmash(0.2);await look(f,f.x+1.3,f.z,0);out=[D.TV.crack];",10)
        await snap('tv_smash2',"const f=wp(D.TV.core.mesh);await look(f,f.x+1.3,f.z,0);D.hammerSmash(1);await look(f,f.x+1.3,f.z,0);out=[D.TV.state,D.TV.lcdExposed,D.TV.crack];",30)
        await snap('tower_open',"D.keys.ShiftLeft=true;const t=D.PC.tower;const sp=D.PC.parts.side;D.detachPart(sp);D.makeDynamic(sp);sp.body.velocity.set(0.6,0,0.6);const f=wp(t.mesh);await look(f,f.x+0.75,f.z+0.45,-0.05);out=[sp.mesh.position.x.toFixed(2)];",40)
        await snap('tower_front',"const t=D.PC.tower;const f=wp(t.mesh);await look(f,f.x+0.1,f.z+0.85,-0.05);D.PC.use&&D.PC.use();",60)
        await snap('crt_on',"D.keys.ShiftLeft=false;const f=wp(D.PC.screen);await look(f,f.x+0.05,f.z+0.75,-0.05);",150)
        await snap('crt_crack',"const f=wp(D.PC.screen);await look(f,f.x+0.05,f.z+0.9,0);D.hammerSmash(1);await look(f,f.x+0.05,f.z+0.9,0);out=[D.PC.crtHits,D.PC.state];",8)
        await snap('crt_smash',"const f=wp(D.PC.screen);await look(f,f.x+0.05,f.z+0.9,0);D.hammerSmash(1);out=[D.PC.crtGone,D.PC.crtHits,D.PC.state];",6)
        await snap('crt_after',"",30)
        print(json.dumps(await page.evaluate("()=>window.__DEMO.stats()")))
        print('\n'.join(l for l in logs if '404' not in l)[:3000])
        await browser.close()
asyncio.run(main())
