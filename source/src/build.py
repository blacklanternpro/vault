import sys,base64,os,re
B='/tmp/build2'
src=''.join(open(f'{B}/{n}.js').read() for n in ['p1','p2','p3','p4','p5','p5b','p8a','p8b','p8c','p8d','p8e','p8h','p8i','p8j','p8f','p8g','p9m','p9v','p9b','p9s','p9e','p9k','p9w','p9l','p9r','p9z','p9o','p9x','p9d','p9n','p9g','p9h','p9q','p6','p7'])
open(f'{B}/all.mjs','w').write(src)
head=open(f'{B}/shell/head.html').read();tail=open(f'{B}/shell/tail.html').read()
PH="const GLB_ASSETS={};/* filled at build time with base64 GLBs */"
assert src.count(PH)==1
ASSETS=['hammer','saw','revolver']
b64={a:base64.b64encode(open(f'{B}/{a}.glb','rb').read()).decode() for a in ASSETS}
full=src.replace(PH,"const GLB_ASSETS={"+",".join(f"{a}:'{b64[a]}'" for a in ASSETS)+"};")
page=head+'<script type="module">\n'+full+'\n'+tail
for out in ['/home/claude/bedsit/index.html','/home/claude/bedsit/index_1.html']:
    open(out,'w').write(page)
local=page.replace('"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/","cannon-es":"https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js","three-mesh-bvh":"https://unpkg.com/three-mesh-bvh@0.9.16/build/index.module.js"','"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/","cannon-es":"/cannon-es/dist/cannon-es.js","three-mesh-bvh":"/three-mesh-bvh/build/index.module.js"')
assert local!=page
open(f'{B}/serve/index.html','w').write(local)
cdn=src.replace(PH,"const GLB_ASSETS={"+",".join(f"{a}:'url:'+new URL('./{a}.glb',import.meta.url).href" for a in ASSETS)+"};")
open(f'{B}/deploy/game.src.mjs','w').write(cdn)
print('built',len(page)//1024,'KB page;',len(src)//1024,'KB source')
