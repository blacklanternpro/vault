import asyncio
from playwright.async_api import async_playwright
# v8.0: smoke-test the minified build locally before pushing (proxies, hooks, ?bedsit)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        for q in ['','?bedsit']:
            pg=await b.new_page(viewport={'width':800,'height':450});logs=[]
            pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
            pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
            await pg.goto('http://localhost:8765/mintest.html'+q,wait_until='load')
            await pg.wait_for_function("document.getElementById('load').style.display==='none'",timeout=300000)
            await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';}")
            await pg.wait_for_timeout(6000)
            r=await pg.evaluate("()=>{const D=window.__DEMO;return{villa:!!(D.VW&&D.VW.walls.length),cells:D.VPX.clusters.size,saved:D.vpxSaved(),stats:D.stats()}}")
            print(q or 'default',r)
            if not q:
                r2=await pg.evaluate("""()=>{const D=window.__DEMO;const fr=D.ents.find(e=>e.label==='fridge');const had=!!fr._px;D.makeDynamic(fr);return{had,after:!!fr._px,dyn:fr.dynamic}}""")
                print('hook through the minified build:',r2)
            await pg.screenshot(path=f'/tmp/build2/v8_min{q.replace("?","_")}.png')
            print('\n'.join(logs)[:1500]);await pg.close()
        await b.close()
asyncio.run(main())
