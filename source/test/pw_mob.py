import asyncio,sys,json,time
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        ctx=await b.new_context(viewport={'width':844,'height':390},device_scale_factor=2,is_mobile=True,has_touch=True,user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
        pg=await ctx.new_page();logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        cdp=await ctx.new_cdp_session(pg)
        async def touch(kind,pts):
            await cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':i} for (i,x,y) in pts]})
        async def drag(id,x0,y0,x1,y1,steps=6,hold=None):
            await touch('touchStart',[(id,x0,y0)]+([hold] if hold else []))
            for k in range(1,steps+1):
                await touch('touchMove',[(id,x0+(x1-x0)*k/steps,y0+(y1-y0)*k/steps)]+([hold] if hold else []))
            await touch('touchEnd',[] if not hold else [hold])
        await pg.goto('http://localhost:8765/index.html',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='/tmp/build2/m_title.png')
        r=await pg.evaluate("()=>({touch:document.body.classList.contains('touch'),go:document.getElementById('go').textContent,pr:window.__DEMO.renderer.getPixelRatio()})");print('title',r)
        await pg.tap('#go');await pg.wait_for_timeout(3000)
        await pg.screenshot(path='/tmp/build2/m_play.png')
        r=await pg.evaluate("()=>{const D=window.__DEMO;return{locked:D.locked,yaw:D.player.yaw,act:document.getElementById('mAct').textContent,vis:[...document.querySelectorAll('#mob .mb')].filter(b=>!b.classList.contains('hide')).map(b=>b.id)}}");print('play',r)
        y0=await pg.evaluate("()=>window.__DEMO.player.yaw")
        await drag(1,650,200,560,200)
        await pg.wait_for_timeout(500)
        y1=await pg.evaluate("()=>window.__DEMO.player.yaw");print('look drag yaw',round(y0,3),'->',round(y1,3))
        p0=await pg.evaluate("()=>[window.__DEMO.player.body.position.x,window.__DEMO.player.body.position.z]")
        await touch('touchStart',[(2,120,300)])
        for k in range(1,6): await touch('touchMove',[(2,120,300-12*k)])
        await pg.wait_for_timeout(2500)
        mid=await pg.evaluate("()=>[window.__DEMO.keys.KeyW,window.__DEMO.player.body.position.x,window.__DEMO.player.body.position.z]")
        await pg.screenshot(path='/tmp/build2/m_stick.png')
        await touch('touchEnd',[])
        print('stick: before',p0,'during',mid)
        # tool cycle tap
        t0=await pg.evaluate("()=>window.__DEMO.EX&&0");await pg.tap('#mTool');await pg.wait_for_timeout(400)
        print('tool after tap',await pg.evaluate("()=>document.getElementById('mTool').textContent"))
        # menu
        await pg.tap('#mMenu');await pg.wait_for_timeout(400);await pg.screenshot(path='/tmp/build2/m_menu.png');await pg.tap('#mMenu')
        # sit on the couch, check couch buttons
        await pg.evaluate("()=>{window.__DEMO.locked=true;}")
        r=await pg.evaluate("async()=>{const D=window.__DEMO;D.SEATS&&0;const s=D.COUCH;D.player.body.position.set(0.2,0.9,-1.0);await new Promise(r=>setTimeout(r,300));const f=D.SEAT;window.__DEMO.EX;return 1;}")
        await pg.evaluate("()=>{const D=window.__DEMO;D.LIVING&&0;}")
        await pg.evaluate("()=>{const D=window.__DEMO;const sit=D.SEATS.couch;}")
        await pg.evaluate("()=>{window.__DEMO.sitDown?window.__DEMO.sitDown('couch'):null}")
        await pg.wait_for_timeout(2500)
        r=await pg.evaluate("()=>({seat:window.__DEMO.SEAT.at,vis:[...document.querySelectorAll('#mob .mb')].filter(b=>!b.classList.contains('hide')).map(b=>b.id+':'+b.textContent)})");print('couch',r)
        await pg.screenshot(path='/tmp/build2/m_couch.png')
        await pg.set_viewport_size({'width':390,'height':844});await pg.wait_for_timeout(800);await pg.screenshot(path='/tmp/build2/m_portrait.png')
        print('\n'.join(l for l in logs if '404' not in l)[:2000])
        await b.close()
asyncio.run(main())
