import asyncio,json,sys
from playwright.async_api import async_playwright
# quick browser probe: step up to the oche, report what the board's meshes look like, screenshot probe.png
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'));pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        r=await pg.evaluate(f"""async()=>{{const D=window.__DEMO;document.getElementById('overlay').style.display='none';const p=D.player;p.body.position.set(0.6-8.8,0.37,7.6-4.9);for(let i=0;i<6;i++){FR};D.DART.board.use();for(let i=0;i<30;i++){FR};
          const out={{}};for(const e of[D.DART.board,D.DART.cab,...D.DART.doors]){{const v=[];e.mesh.traverse(o=>{{if(o.isMesh)v.push(o.visible+'/'+o.layers.mask);}});out[e.label]=v.join(',')+' vis '+e.mesh.visible+' parentVis '+(e.mesh.parent&&e.mesh.parent.visible)+' batched '+!!e.batched;}}
          out.seat=D.SEAT.at+' blend '+D.SEAT.blend.toFixed(2);out.cam=JSON.stringify(D.camera.getWorldPosition(new D.THREE.Vector3()));return out;}}""")
        print(json.dumps(r,indent=1));await pg.screenshot(path='/tmp/build2/probe.png');await pg.evaluate("()=>{const D=window.__DEMO;D.setTool(4);D.DART.hand.position.set(0.13,-0.11,-0.36);}");await pg.wait_for_timeout(4000);await pg.screenshot(path='/tmp/build2/probe2.png');print('\n'.join(logs)[:2000]);await b.close()
asyncio.run(main())
