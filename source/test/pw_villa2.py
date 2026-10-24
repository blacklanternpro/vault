import asyncio,sys,time,json,os
from playwright.async_api import async_playwright
# v6.1 browser shots: junctions, end caps, manholes (closed/open), climbing into the roof, the roof space, the garage ladder.
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
SHOTS={
 # name: (x,z,yaw,pitch, prep js)
 'junction': (10.6,4.5, 0.5,0.0, ''),
 'cap':      (5.0,3.0, -2.4,0.0, ''),
 'mh_closed':(8.6,4.5, -1.5708,0.55, ''),'arch':(9.4,5.6, 0.0,0.8, ''),
 'mh_open':  (8.6,4.5, -1.5708,0.55, 'D.toggleKinDoor(D.VMH[0].e);'),'climb':(10.05,4.6, 0.0,0.2, 'CRATE'),
 'roof':     (None,None, 1.5708,0.05, 'ROOF'),
 'roof2':    (None,None, -1.5708,0.15, 'ROOF'),
 'garage':   (2.6,7.6, 0.4,0.25, ''),
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
        await pg.wait_for_timeout(1000)
        for name in want:
            x,z,yaw,pitch,prep=SHOTS[name]
            if prep=='ROOF':
                js=f"""async()=>{{const D=window.__DEMO;const H=D.VMH[0];if(!(H.e.kin&&H.e.kin.ang>1))D.toggleKinDoor(H.e);for(let i=0;i<20;i++){FR};const b=D.player.body;b.position.set(H.cx+0.7*Math.sign(Math.cos({yaw})+1e-3)*0,3.1,H.cz-0.5);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};"""
            elif prep=='CRATE':
                js=f"""async()=>{{const D=window.__DEMO;const H=D.VMH[0];if(!(H.e.kin.ang>1))D.toggleKinDoor(H.e);for(let i=0;i<12;i++){FR};const c=D.VR.crate;D.makeDynamic(c);c.body.position.set(H.cx,0.155,H.cz);c.body.quaternion.set(0,0,0,1);c.body.velocity.set(0,0,0);const b=D.player.body;b.position.set(H.cx,0.72,H.cz+0.02);b.velocity.set(0,0,0);for(let i=0;i<20;i++){FR};D.keys.Space=true;for(let i=0;i<40;i++){{{FR};if(D.VCL.on)break;}}D.keys.Space=false;for(let i=0;i<120;i++){{{FR};if(!D.VCL.on)break;}}D.player.yaw=Math.PI;D.player.pitch=-0.6;"""
            else:
                js=f"""async()=>{{const D=window.__DEMO;{prep}const b=D.player.body;b.position.set({x}-8.8,0.37,{z}-4.9);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};"""
            js+=f"""for(let i=0;i<14;i++){FR};const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies,y:+b.position.y.toFixed(2),eye:+D.player.eyeOff.toFixed(2)}};}}"""
            r=await pg.evaluate(js)
            await pg.screenshot(path=f'/tmp/build2/v2_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
