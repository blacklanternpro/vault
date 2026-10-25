import asyncio,sys,time,json
from playwright.async_api import async_playwright
# v8.0 perf probe (argv: [off] views...): per view, min/max draw calls over 8 frames (min = no shadow pass), and the biggest visible mesh groups
FR="await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))"
V={'spawn':(3.8,9.0,0,0),'hall':(4.0,4.5,-1.5708,-0.1),'hallE':(16.8,4.5,1.5708,-0.1),'dining':(8.8,3.6,0.6,-0.15),'kitchen':(6.6,2.6,1.9,-0.2),'living':(10.9,9.3,0.98,-0.15),'master':(12.3,9.3,-0.44,-0.3),'garage':(2.7,4.5,2.65,-0.15),'bed2':(15.0,3.6,-0.76,-0.3),'yard':(6.0,-7.5,-2.6,-0.05),'bbq':(6.0,-0.9,-2.0,-0.3),'front':(5.0,13.8,0.25,-0.1)}
PROBE="""()=>{const D=window.__DEMO,T=D.THREE;const cam=D.camera;cam.updateMatrixWorld();const fr=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));const c={};let n=0;
 D.scene.traverseVisible(o=>{if(!(o.isMesh||o.isInstancedMesh||o.isLine||o.isPoints))return;if(!o.layers.test(cam.layers))return;if(o.frustumCulled&&o.geometry){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();if(!fr.intersectsObject(o))return;}let p=o,lab=null;while(p){if(p.userData&&p.userData.ent){lab=p.userData.ent.label||p.userData.ent.kind;break;}p=p.parent;}if(!lab){let q=o.parent,path=[];while(q&&q!==D.scene&&path.length<3){path.push(q.name||q.userData.kind||q.type);q=q.parent;}lab=o.isInstancedMesh?'instanced':o.userData.batch?'batch':('~'+(o.name||o.userData.kind||'')+'<'+path.join('<')+'|'+(o.material&&o.material.name||'')+(o.material&&o.material.transparent?'T':''));}const m=Array.isArray(o.material)?o.material.length:1;c[lab]=(c[lab]||0)+m;n+=m;});
 return{n,top:Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,22)};}"""
async def main():
    a=sys.argv[1:];off='off' in a;a=[x for x in a if x!='off'];want=a or list(V)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':960,'height':540})
        await pg.goto('http://localhost:8765/index.html?villa',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{const D=window.__DEMO;D.locked=true;document.getElementById('overlay').style.display='none';"+("D.VPX.on=false;" if off else "")+"}");await pg.wait_for_timeout(4500)
        for name in want:
            x,z,yaw,pitch=V[name]
            js=f"""async()=>{{const D=window.__DEMO;const b=D.player.body;const cs=[];for(let i=0;i<16;i++){{{FR};b.position.set({x}-8.8,0.37,{z}-4.9);b.velocity.set(0,0,0);D.player.yaw={yaw};D.player.pitch={pitch};if(i>=8)cs.push(D.stats().calls);}}return{{min:Math.min(...cs),max:Math.max(...cs),dyn:D.dynamics.filter(e=>e.body&&e.body.sleepState!==2).map(e=>e.label).slice(0,8)}};}}"""
            r=await pg.evaluate(js);pr=await pg.evaluate(PROBE)
            vp=await pg.evaluate('()=>({n:window.__DEMO.VPX.clusters.size,saved:window.__DEMO.vpxSaved(),built:window.__DEMO.VPX.built,dropped:window.__DEMO.VPX.dropped})');print(name,json.dumps(r),'visible',pr['n'],'vpx',json.dumps(vp),json.dumps(pr['top']),flush=True)
        await b.close()
asyncio.run(main())
