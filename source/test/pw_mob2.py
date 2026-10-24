import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'])
        for mobile in [True,False]:
            ctx=await b.new_context(viewport={'width':844,'height':390},is_mobile=mobile,has_touch=mobile)
            pg=await ctx.new_page()
            await pg.goto('http://localhost:8765/index.html',wait_until='load')
            await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
            await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';}")
            await pg.wait_for_timeout(1000)
            r=await pg.evaluate("async()=>{const D=window.__DEMO;D.sitDown('couch');for(let i=0;i<40;i++)await new Promise(r=>requestAnimationFrame(r));const c=D.camera;const d=c.getWorldDirection(c.position.clone());const S=D.SEAT;return{at:S.at,blend:S.blend,eye:S.eye.toArray().map(v=>+v.toFixed(2)),vy:+S.vy.toFixed(2),yaw:+S.yaw.toFixed(2),ly:S.ly,dir:d.toArray().map(v=>+v.toFixed(2)),camPos:c.getWorldPosition(c.position.clone()).toArray().map(v=>+v.toFixed(2)),vm:D.COUCH.vm.visible}}")
            print('mobile' if mobile else 'desktop',r)
            await ctx.close()
        await b.close()
asyncio.run(main())
