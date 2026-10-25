import asyncio,sys,time,json,os
from playwright.async_api import async_playwright
# v6.2 basement browser shots (B1). Each shot: (plan x, y, plan z, yaw, pitch, prep js). Prep runs first; y is the body centre height.
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
OPEN="if(D.VB.lock&&D.VB.lock.alive)D.vbBreakLock(D.VB.lock.mesh.position.clone(),null,'TEST');if(D.VB.hatch.kin.target===0)D.VB.hatch.use();"
SHOTS={
 'hatch':     (1.9,0.37,5.6, 1.2,-0.75, ''),
 'hatch_open':(1.6,0.37,4.7, 1.5708,-0.6, OPEN),
 'stairs_up': (0.75,-2.23,7.4, 0.0,0.35, OPEN),
 'airlock':   (0.8,-2.23,8.2, -1.2,0.0, OPEN+"if(D.VB.door.kin.target===0)D.VB.door.use();"),
 'bunk':      (5.6,-2.23,8.6, 0.75,0.05, OPEN),
 'plant':     (6.6,-2.23,8.6, -0.6,0.0, OPEN),
 'tunnel':    (8.0,-2.23,6.8, -1.5708,0.0, OPEN),
 'escape':    (13.4,-2.23,7.3, -0.5,0.9, OPEN+"D.VB.carpet.found=true;if(D.VB.carpet.alive&&D.VB.carpet.kin.target===0)D.VB.carpet.use();if(D.VB.trap.kin.target===0)setTimeout(()=>D.VB.trap.use(),300);"),
 'bunk2':     (2.4,-2.23,6.6, -2.2,0.0, OPEN),
 'radio':     (2.9,-2.23,6.3, 1.4,-0.25, OPEN+"if(!D.VB.radio.on)D.VB.radio.use();"),
 'plant2':    (6.6,-2.23,6.0, 3.0,-0.1, OPEN),
 'flare':     (13.3,-2.23,6.3, 2.6,-0.3, OPEN+"D.vbLightFlare(D.VB.flares[0]);D.VB.fix.forEach(f=>f.on=false);"),
 'drum':      (4.9,-2.23,7.0, -1.9,-0.35, OPEN+"if(!D.VB.drums[1].punctured)D.vbPuncture(D.VB.drums[1],D.VB.drums[1].mesh.position.clone().add(new D.VB.drums[1].mesh.position.constructor(-0.12,0,0)),new D.VB.drums[1].mesh.position.constructor(1,0,0),[0.62,0.78,0.95],'TEST');"),
 'tunnel_in': (8.9,-2.23,6.8, -1.5708,-0.05, OPEN),
 'slump':     (9.6,-2.23,6.75, -1.3,-0.25, OPEN+"const pr=D.VB.tprops.find(e=>e.lag&&Math.abs(e.mesh.position.x-(11.2-8.8))<0.05);if(pr&&!pr.dynamic){pr.onHit(pr.mesh.position.clone(),3,null);D.makeDynamic(pr);}for(let i=0;i<90;i++)await new Promise(r=>requestAnimationFrame(r));"),
 'carpet':    (12.6,0.37,6.8, -1.5708,-0.75, ''),
 'peeled':    (12.5,0.37,6.8, -1.5708,-0.7, OPEN+"D.VB.carpet.found=true;if(D.VB.carpet.alive&&D.VB.carpet.kin.target===0)D.VB.carpet.use();if(D.VB.trap.kin.target===0)setTimeout(()=>D.VB.trap.use(),300);"),
}
async def main():
    want=sys.argv[1:] or list(SHOTS)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.add_init_script('window.__NOSHADOW='+('true' if os.environ.get('NOSHADOW') else 'false'));t=time.time();await pg.goto('http://localhost:8765/index.html?villa',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000);print('boot',round(time.time()-t,1),'s',flush=True)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';if(window.__NOSHADOW)D.perfMode=true;}")
        await pg.wait_for_timeout(800)
        for name in want:
            x,y,z,yaw,pitch,prep=SHOTS[name]
            js=f"""async()=>{{const D=window.__DEMO;{prep}for(let i=0;i<10;i++){FR};const b=D.player.body;b.position.set({x}-8.8,{y},{z}-4.9);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};
              for(let i=0;i<16;i++){{{FR};b.position.set({x}-8.8,{y},{z}-4.9);b.velocity.set(0,0,0);}}const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies,built:D.VB.built,vis:D.VB.visible}};}}"""
            r=await pg.evaluate(js)
            await pg.screenshot(path=f'/tmp/build2/b_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
