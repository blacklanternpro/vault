import asyncio,sys,time,json
from playwright.async_api import async_playwright
# v9.2 browser shots: n_<name>.png + draw calls per view. usage: python3 pw_street.py [names…]
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
def at(x,z,yaw,pitch): return f"const p=D.player;p.body.position.set({x}-8.8,0.37,{z}-4.9);p.body.velocity.set(0,0,0);p.yaw={yaw};p.pitch={pitch};"
SHOTS={
 'front': at(8,16.4,3.1416,0.02),
 'west': at(-14,21.6,1.5708,0.03),
 'east': at(22,21.6,-1.5708,0.02),
 'house': at(8.8,23.5,0.0,0.08),
 'sky': at(4,21.6,2.4,0.55),
 'bank': at(-62,21.6,1.5708,0.0),
 'am2': "D.vibeKey('KeyN');"+at(9.5,23.6,3.0,0.12),
 'oche': "D.vibeKey&&0;"+at(0.6,7.6,-1.5708,0)+"for(let i=0;i<4;i++){%s};D.DART.board.use();for(let i=0;i<20;i++){%s};D.dartPickGame(3);const B=D.DART.B;const P=(r,deg)=>B.c.clone().addScaledVector(B.r,Math.sin(deg*Math.PI/180)*r).addScaledVector(B.u,Math.cos(deg*Math.PI/180)*r);const shoot=(A)=>{const p0=D.DART.oche.clone().addScaledVector(B.n,0.1);p0.y=1.6;const s0=6.4,dd=p0.distanceTo(A),t=dd/s0;const v=A.clone().sub(p0).multiplyScalar(1/t);v.y+=0.5*9.8*t;D.dartLaunch(p0,v,'you');};shoot(P(0.103,0));shoot(P(0.103,1));shoot(P(0.12,18));for(let i=0;i<16;i++){%s};" % (FR,FR,FR),
}
async def main():
    want=sys.argv[1:] or list(SHOTS)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        t=time.time();await pg.goto('http://localhost:8765/index.html',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000);print('boot',round(time.time()-t,1),'s',flush=True)
        await pg.evaluate("()=>{const D=window.__DEMO;document.getElementById('overlay').style.display='none';}")
        await pg.wait_for_timeout(1000)
        for name in want:
            r=await pg.evaluate(f"""async()=>{{const D=window.__DEMO;{SHOTS[name]}for(let i=0;i<10;i++){FR};const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies,fog:+D.scene.fog.density.toFixed(3)}};}}""")
            await pg.screenshot(path=f'/tmp/build2/n_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
