import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':800,'height':450});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8766/index.html',wait_until='load')
        await pg.wait_for_function("document.getElementById('load').style.display==='none'",timeout=300000)
        await pg.evaluate("()=>{document.getElementById('overlay').style.display='none';}")
        await pg.wait_for_timeout(4000)
        r=await pg.evaluate("()=>({demo:!!window.__DEMO,cords:window.__DEMO&&window.__DEMO.CORDS.map(c=>c.plugged),tv:window.__DEMO&&window.__DEMO.TV.state,stats:window.__DEMO&&window.__DEMO.stats()})")
        print(r);await pg.screenshot(path='/tmp/build2/a_min.png')
        print('\n'.join(logs)[:2000]);await b.close()
asyncio.run(main())
