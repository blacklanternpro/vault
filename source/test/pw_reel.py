import asyncio,base64,sys
from playwright.async_api import async_playwright
JS=r"""
async()=>{const D=window.__DEMO;const S=D.S,SND=D.SND;S.init();await new Promise(r=>{const k=()=>SND.ready?r():setTimeout(k,50);k();});
 const p=D.player;const fwd=(dx,dz)=>{const y=p.yaw;const f={x:-Math.sin(y),z:-Math.cos(y)},rr={x:Math.cos(y),z:-Math.sin(y)};return new D.THREE.Vector3(p.pos.x+f.x*1.6+rr.x*dx,p.pos.y-0.6,p.pos.z+f.z*1.6+rr.z*dx);};
 const EV=[['tapHollow',e=>e.tapHollow(fwd(0))],['tapStud',e=>e.tapStud(fwd(0))],['crumble',e=>e.crumble(fwd(-0.8),1.2)],['snap',e=>e.snap(fwd(0.8))],['thud heavy',e=>e.thud(fwd(0),1.6)],['thud',e=>e.thud(fwd(0.5),1)],['shatter glass',e=>e.shatter(fwd(-0.6),true)],['shatter ceramic',e=>e.shatter(fwd(0.6),false)],['clatter',e=>e.clatter(fwd(0))],['dent',e=>e.dent(fwd(0),1.2)],['kick',e=>e.kick()],['steps',e=>{e.step();setTimeout(()=>{},0);}],['whump',e=>e.whump(fwd(0))]];
 const sr=48000,gap=1.7,T=EV.length*gap+2;const out={};
 for(const mode of['before','after']){const off=new OfflineAudioContext(2,Math.ceil(sr*T),sr);const AC=window.AudioContext;window.AudioContext=function(){return off;};const E=new S.constructor();E.init();window.AudioContext=AC;
   if(mode==='before'){E.bus=null;E.revIn=null;E.slapIn=null;E.master.gain.value=0.6;E.comp.threshold.value=-18;E.comp.knee.value=30;E.comp.ratio.value=12;E.comp.attack.value=0.003;E.comp.release.value=0.25;}
   const L=SND.legacy;EV.forEach(([n,f],i)=>{off.suspend(0.2+i*gap).then(()=>{if(mode==='before'){const proxy=Object.create(E);for(const k in L)proxy[k]=L[k];f(proxy);if(n==='steps'){}}else{f(E);}off.resume();});});
   if(true){/* extra footsteps */for(let s=1;s<4;s++)off.suspend(0.2+11*gap+s*0.42).then(()=>{if(mode==='before')L.step.call(E);else E.step();off.resume();});}
   const buf=await off.startRendering();const a=buf.getChannelData(0),b=buf.getChannelData(1);const i16=new Int16Array(a.length*2);for(let i=0;i<a.length;i++){i16[2*i]=Math.max(-32767,Math.min(32767,a[i]*32767));i16[2*i+1]=Math.max(-32767,Math.min(32767,b[i]*32767));}
   let s='';const u8=new Uint8Array(i16.buffer);for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));out[mode]=btoa(s);}
 return out;}
"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':640,'height':360});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'));pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        r=await pg.evaluate(JS)
        for k,v in r.items():open(f'/tmp/build2/reel/{k}.pcm','wb').write(base64.b64decode(v))
        print('\n'.join(l for l in logs if '404' not in l)[:1500]);await b.close()
asyncio.run(main())
