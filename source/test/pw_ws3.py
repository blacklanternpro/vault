import asyncio,sys,time,json,os
from playwright.async_api import async_playwright
# v6.6 WS3 browser shots: (plan x, plan z, yaw, pitch, prep js). y is the body centre (0.37 on the floor).
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
SHOTS={
 'kitchen':  (6.6,2.6, 1.9,-0.2, ''),
 'kitchen2': (4.0,2.6, 0.0,-0.25, ''),
 'west':     (4.6,2.0, 1.5708,-0.2, "D.FRIDGE.doors[1].use();D.VK.burners[0].knob.use();D.VK.burners[0].knob.use();"),
 'cooktop':  (3.5,1.1, 1.5708,-0.75, "for(const B of D.VK.burners){if(!B.on)B.knob.use();}const ig=D.ents.find(e=>e.label==='igniter button');ig.use();"),
 'dining':   (5.4,3.6, -2.3,-0.2, ''),
 'laundry':  (1.6,3.2, 0.0,-0.15, "D.VLD.lid.use();"),
 'bbq':      (6.0,-0.9, -2.0,-0.3, ''),
 'boom':     (7.4,6.0, 2.6,0.0, "for(const B of D.VK.burners){B.on=true;B.lit=false;}D.VG.c.kitchen=0.08;D.VG.c.dining=0.06;setTimeout(()=>D.vGasSpark(D.VK.cook.mesh.getWorldPosition(D.camera.position.clone()),'test'),900);"),
 'after':    (6.4,2.6, 1.9,-0.2, "for(let i=0;i<120;i++)await new Promise(r=>requestAnimationFrame(r));"),
}
async def main():
    want=sys.argv[1:] or list(SHOTS)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        t=time.time();await pg.goto('http://localhost:8765/index.html?villa',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000);print('boot',round(time.time()-t,1),'s',flush=True)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';}")
        await pg.wait_for_timeout(800)
        for name in want:
            x,z,yaw,pitch,prep=SHOTS[name]
            js=f"""async()=>{{const D=window.__DEMO;{prep}for(let i=0;i<8;i++){FR};const b=D.player.body;b.position.set({x}-8.8,0.37,{z}-4.9);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};
              for(let i=0;i<14;i++){{{FR};b.position.set({x}-8.8,0.37,{z}-4.9);b.velocity.set(0,0,0);}}const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies}};}}"""
            r=await pg.evaluate(js)
            await pg.screenshot(path=f'/tmp/build2/k_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
