import asyncio,sys,time,os
from playwright.async_api import async_playwright
# Browser sweep of TV channels: sit on the couch, tune in, step the broadcast clock through every segment so every cue
# fires against a real AudioContext, time the picture draw, and screenshot a few frames.  usage: python3 pw_ch.py 9 2 5
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
async def main():
    chs=[int(a) for a in sys.argv[1:]] or [9]
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':960,'height':540});logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8765/index.html',wait_until='load')
        await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{const D=window.__DEMO;D.S.init();D.locked=true;document.getElementById('overlay').style.display='none';D.perfMode=true;}")
        await pg.wait_for_timeout(1500)
        await pg.evaluate(f"async()=>{{const D=window.__DEMO;D.sitDown('couch');for(let i=0;i<14;i++){FR};}}")
        for ch in chs:
            t=time.time()
            r=await pg.evaluate(f"""async()=>{{const D=window.__DEMO;D.SEATS.couch.key('Digit{ch}');{FR};const R=D.CHANNELS[{ch}].reel;const res=[];let off=0;const caps=new Set();
              for(const s of R.segs){{let worst=0,sum=0,n=0;for(let lt=0.05;lt<s.dur;lt+=0.9){{D.TVB.t=off+lt;await new Promise(r=>requestAnimationFrame(r));const a=performance.now();D.tvReelDraw(D.TVH.x,854,480,R);const d=performance.now()-a;worst=Math.max(worst,d);sum+=d;n++;if(D.TVCAP.text)caps.add(D.TVCAP.text);}}
                res.push(s.id+' '+s.dur.toFixed(1)+'s avg '+(sum/n).toFixed(1)+'ms worst '+worst.toFixed(1)+'ms');off+=s.dur;}}
              return {{total:R.total.toFixed(1),ready:D.TVA.ready,segs:res,caps:caps.size}};}}""")
            print('CH',ch,round(time.time()-t,1),'s',r,flush=True)
            for f in [0.2,0.55]:
                await pg.evaluate(f"async()=>{{const D=window.__DEMO;const R=D.CHANNELS[{ch}].reel;D.TVB.t=R.total*{f};for(let i=0;i<6;i++){FR};}}")
                await pg.screenshot(path=f'/tmp/build2/c{ch}_{int(f*100)}.png')
        print('\n'.join(l for l in logs if '404' not in l)[:3000])
        await b.close()
asyncio.run(main())
