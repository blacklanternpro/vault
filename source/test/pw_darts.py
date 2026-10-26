import asyncio,sys,time,json
from playwright.async_api import async_playwright
# v9.1 browser shots: d_<name>.png — the oche view with darts in, the chalkboards, the cabinet from the side, the hand dart mid-draw
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
PRE="""const D=window.__DEMO,DA=D.DART,B=DA.B,T=D.THREE;const P=(r,deg)=>B.c.clone().addScaledVector(B.r,Math.sin(deg*Math.PI/180)*r).addScaledVector(B.u,Math.cos(deg*Math.PI/180)*r);
const shoot=(A,who)=>{const p0=DA.oche.clone().addScaledVector(B.n,0.1);p0.y=1.6;const s0=6.4,dd=p0.distanceTo(A),t=dd/s0;const v=A.clone().sub(p0).multiplyScalar(1/t);v.y+=0.5*9.8*t;D.dartLaunch(p0,v,who);};"""
SHOTS={
 'oche': "D.DART.board.use();for(let i=0;i<30;i++){%s};D.dartPickGame(3);shoot(P(0.103,0),'you');shoot(P(0.103,0.5),'you');shoot(P(0.1,18),'you');for(let i=0;i<20;i++){%s};" % (FR,FR),
 'chalk': "D.dartNextTurn();for(let i=0;i<120;i++){%s};" % FR,
 'draw': "D.SEATS.oche.down(0);for(let i=0;i<12;i++){%s};" % FR,
 'side': "D.SEATS.oche.up(0);D.standUp();for(let i=0;i<20;i++){%s};const p=D.player;p.body.position.set(1.4-8.8,0.37,8.9-4.9);p.yaw=-2.2;p.pitch=0.05;" % FR,
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
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';const p=D.player;p.body.position.set(0.6-8.8,0.37,7.6-4.9);}")
        await pg.wait_for_timeout(1500)
        for name in want:
            r=await pg.evaluate(f"""async()=>{{{PRE}{SHOTS[name]}for(let i=0;i<6;i++){FR};const s=D.stats();return{{calls:s.calls,bodies:s.bodies,seat:D.SEAT.at,darts:DA.list.length,game:DA.game.mode+'/'+DA.game.state,msg:document.getElementById('msg').textContent}};}}""")
            await pg.screenshot(path=f'/tmp/build2/d_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
