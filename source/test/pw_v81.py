import asyncio,sys,time,json
from playwright.async_api import async_playwright
# v8.1 browser shots: v81_<name>.png — pantry + cupboards, cooktop/hood, saw sparks on the oven, whump, toaster cord taut, bar fridge, boxing bag
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
def place(x,z,yaw,pitch,y=0.37): return f"const p=D.player;p.body.position.set({x}-8.8,{y},{z}-4.9);p.body.velocity.set(0,0,0);p.yaw={yaw};p.pitch={pitch};"
SHOTS={
 'pantry': place(4.3,2.7,0.35,-0.12)+"for(const d of D.ents.filter(e=>e.label==='pantry door'||e.label==='cabinet door'||e.label==='cupboard door'))if(d.kin&&d.kin.target===0&&d.mesh.getWorldPosition(new D.THREE.Vector3()).z<-3.9)D.toggleKinDoor(d);const dr=D.ents.find(e=>e.label==='drawer'&&e.slide);if(dr)dr.use();",
 'cooktop': place(4.1,1.1,1.5708,-0.2),
 'sparks': place(3.6,1.1,1.5708,-0.35)+"D.__spk=setInterval(()=>{const o=D.ents.find(e=>e.label==='oven');const q=o.mesh.getWorldPosition(new D.THREE.Vector3());q.x+=0.31;q.y+=0.15;D.sawSpray(q,new D.THREE.Vector3(-1,-0.2,0.15).normalize(),'metal',1/30);},30);",
 'whump': place(4.6,1.6,1.5708,-0.05)+"clearInterval(D.__spk);const ck=D.VK.cook.mesh.localToWorld(new D.THREE.Vector3(0,0.06,0));const k=D.vgPocket('cooktop',ck,0.5);D.vgWhump(ck,'kitchen',k,'test');",
 'cord': place(4.0,1.7,0.2,-0.3)+"const T=D.TOAST.ent;D.wakeEnt&&D.wakeEnt(T);",
 'beer': place(1.7,5.0,-1.5708,-0.22)+"const B=D.VR6.beer;if(B.door.kin.target===0)D.toggleKinDoor(B.door);",
 'bag': place(0.6,6.9,-1.5708,0.05),
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
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';}")
        await pg.wait_for_timeout(1500)
        for name in want:
            r=await pg.evaluate(f"""async()=>{{const D=window.__DEMO;{SHOTS[name]}for(let i=0;i<8;i++){FR};const s=D.stats();return{{calls:s.calls,ktris:Math.round(s.tris/1000),bodies:s.bodies}};}}""")
            await pg.screenshot(path=f'/tmp/build2/v81_{name}.png');print(name,json.dumps(r),flush=True)
        print('\n'.join(l for l in logs if '404' not in l)[:2500])
        await b.close()
asyncio.run(main())
