import asyncio,json,sys,base64
from playwright.async_api import async_playwright
# v9.4: a top-down orthographic plan of the house (roof, ceiling and lights hidden), plus optional room views
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/build2/shots/plan.png'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
        pg=await b.new_page(viewport={'width':1600,'height':900});logs=[]
        pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'));pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in('error','warning') else None)
        await pg.goto('http://localhost:8765/index.html',wait_until='load');await pg.wait_for_function('window.__DEMO !== undefined',timeout=300000)
        await pg.evaluate("()=>{document.getElementById('overlay').style.display='none';}")
        await pg.wait_for_timeout(3000)
        url=await pg.evaluate("""()=>{const D=window.__DEMO,T=D.THREE;const r=D.renderer,sc=D.scene;const W=1600,H=900;
          const x0=-8.8-1.5,x1=-8.8+17.6*4/3+1.5,z0=-4.9-1.5,z1=-4.9+9.8*4/3+1.5;const cx=(x0+x1)/2,cz=(z0+z1)/2;const sx=(x1-x0),sz=(z1-z0);const asp=W/H;let hw=sx/2,hh=sz/2;if(hw/hh<asp)hw=hh*asp;else hh=hw/asp;
          const cam=new T.OrthographicCamera(-hw,hw,hh,-hh,0.1,50);cam.position.set(cx,20,cz);cam.up.set(0,0,-1);cam.lookAt(cx,0,cz);cam.layers.enable(0);
          const hid=[];sc.traverse(o=>{if(!(o.isMesh||o.isInstancedMesh||o.isLineSegments||o.isPoints))return;let y=null;try{o.updateWorldMatrix(true,false);if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);y=bb.min.y;if(bb.max.y-bb.min.y>40)return;}catch(e){}
            if(y!==null&&y>2.75){if(o.visible){o.visible=false;hid.push(o);}}else if(!o.visible&&o.userData.vcull!==undefined){o.visible=true;hid.push([o]);}});
          const fog=sc.fog;sc.fog=null;const amb=new T.AmbientLight(0xffffff,1.6);sc.add(amb);r.setSize(W,H,false);r.render(sc,cam);const u=r.domElement.toDataURL('image/png');sc.remove(amb);sc.fog=fog;for(const o of hid){if(Array.isArray(o))o[0].visible=false;else o.visible=true;}return u;}""")
        open(OUT,'wb').write(base64.b64decode(url.split(',')[1]));print('plan',OUT)
        print('\n'.join(l for l in logs if 'favicon' not in l)[:2000]);await b.close()
asyncio.run(main())
