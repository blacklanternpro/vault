import asyncio,base64,sys,json
from playwright.async_api import async_playwright
CFG=json.loads(sys.argv[1]);VIEWS=json.loads(sys.argv[2])
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'])
        pg=await b.new_page(viewport={'width':1200,'height':700});await pg.goto('http://localhost:8765/glbview/index.html');await pg.wait_for_function('window.ready===true',timeout=300000)
        print(await pg.evaluate('(c)=>classify(c)',CFG))
        for name,args in VIEWS.items():
            url=await pg.evaluate('(a)=>view(...a)',[name]+args);open(f'/tmp/glb/c_{name}.png','wb').write(base64.b64decode(url.split(',')[1]));print(name)
        await b.close()
asyncio.run(main())
