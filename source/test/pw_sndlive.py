import asyncio
from playwright.async_api import async_playwright
JS=r"""async()=>{const D=window.__DEMO;const S=D.S,SND=D.SND;const t0=performance.now();S.init();await new Promise(r=>{const k=()=>SND.ready?r():setTimeout(k,30);k();});const built=performance.now()-t0;
 const p=D.player.pos.clone();const errs=[];const call=(f)=>{try{f();}catch(e){errs.push(String(e));}};
 for(const k of['tapHollow','tapStud','tapTile','tear','snap','ping','arc','clink','sparks','clatter'])call(()=>S[k](p));call(()=>S.crumble(p,1.3));call(()=>S.thud(p,0.4));call(()=>S.thud(p,1));call(()=>S.thud(p,2));call(()=>S.shatter(p,true));call(()=>S.shatter(p,false));call(()=>S.kick());call(()=>S.dent(p,1));call(()=>S.whump(p));call(()=>S.step());call(()=>S.step(true));
 call(()=>{S.sawOn(true);S.sawLoad(0.6);S.sawOn(false);});call(()=>S.groan(p,1));call(()=>S.nailScreech(p));
 return {built:Math.round(built),voices:SND.voices,bank:Object.keys(SND.bank).length,state:S.ctx.state,errs,room:SND.room};}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':640,'height':360});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'));pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        print(await pg.evaluate(JS));await pg.wait_for_timeout(1500)
        print(await pg.evaluate("()=>({voices:window.__DEMO.SND.voices})"))
        print('\n'.join(l for l in logs if '404' not in l)[:1500]);await b.close()
asyncio.run(main())
