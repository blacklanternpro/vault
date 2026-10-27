// v9.5 hardening: loose timber falls, debris piles go to sleep, the basement floor isn't glue, the tunnel mouths are open
import {boot} from './boot81.mjs';
const G=await boot('hardening',{extra:'detachChunk,spawnFragments,FACES,splitTimber,structuralUpdate,villaWake,wallPoint,villaBasement,vbAt,VB,VBR,SETTLE,matPlayer,pM,'});G.run(30);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)fails++;};const W=G.world,V=G.V;
const awake=()=>W.bodies.filter(b=>b.type===1&&b.sleepState!==2&&b!==G.player.body).length;

/* 1. a stud cut above and below a sawn noggin, front sheet gone: it comes loose, tips out and lands */
let W0=null,n0=null;for(const w of G.VW.walls.filter(w=>w.kind!=='ext')){G.villaWake(w);const n=(w.noggins||[]).find(n=>n.alive&&!n.dynamic&&n.to-n.from>0.3&&n.cross>1&&n.cross<1.8&&n.studU.every(u=>w.studs.some(s=>s.alive&&Math.abs(s.cross-u)<0.001&&s.from<n.cross-0.6&&s.to>n.cross+0.6)));if(n){W0=w;n0=n;break;}}
const uL=n0.studU[0],v=n0.cross;const FF=G.FACES.filter(f=>f.wall===W0);for(const c of FF[0].chunks.slice())if(c.alive&&c.attached)G.detachChunk(c,V(0,0,0),0.3,false);G.run(150);
G.splitTimber(n0,G.wallPoint(W0,uL+0.12,v,n0.depth));G.structuralUpdate();
ok(W0.noggins.filter(n=>n.alive&&Math.abs(n.cross-v)<0.01).every(n=>n.studU.every(u=>u>=n.from-0.05&&u<=n.to+0.05)),'sawn noggin halves only claim the studs they touch');
const at=u=>W0.studs.filter(s=>s.alive&&Math.abs(s.cross-u)<0.001);
let s=at(uL).find(s=>v>s.from&&v<s.to);G.splitTimber(s,G.wallPoint(W0,uL,v+0.5,s.depth));G.structuralUpdate();
s=at(uL).find(s=>!s.dynamic&&v>s.from&&v<s.to);G.splitTimber(s,G.wallPoint(W0,uL,v-0.5,s.depth));G.structuralUpdate();
const mid=at(uL).find(s=>s.from<v&&s.to>v);ok(mid&&mid.dynamic,'stud cut above and below a sawn noggin comes loose');
const y0=mid.body.position.y;G.run(200);ok(mid.body.position.y<y0-0.5,`it tips out of the open side and lands (dropped ${(y0-mid.body.position.y).toFixed(2)} m)`);
/* a length hanging off an intact noggin alone is pryable / kickable, not 'framing holds' */
const nn=W0.noggins.find(n=>n.alive&&!n.dynamic&&n.studU.length===2&&Math.abs(n.cross-v)<0.01&&n.studU.every(u=>at(u).some(s=>!s.dynamic&&s.from<v-0.5&&s.to>v+0.5)));
if(nn){const u=nn.studU[0];let t=at(u).find(s=>!s.dynamic&&v>s.from&&v<s.to);G.splitTimber(t,G.wallPoint(W0,u,v+0.4,t.depth));G.structuralUpdate();t=at(u).find(s=>!s.dynamic&&v>s.from&&v<s.to);G.splitTimber(t,G.wallPoint(W0,u,v-0.4,t.depth));G.structuralUpdate();
  const m2=at(u).find(s=>s.from<v&&s.to>v);ok(m2&&(m2.dynamic||m2.pryWork>0),`a stud length held only by noggins is pryable (${m2&&m2.label})`);}
else ok(false,'found a second noggin to test');

/* 2. a debris pile in the living room settles: 15 sheets, 36 crumbs, 8 splinters */
const tgt=V(G.vX(10),1.2,G.vZ(5.0));let best=null,bd=1e9;for(const f of G.FACES){if(!f.chunks||!f.chunks.length||f.wall===W0)continue;const c=f.chunks[0];const d=c.bc?Math.hypot(c.bc.x-tgt.x,c.bc.z-tgt.z):1e9;if(d<bd){bd=d;best=f;}}
for(const c of best.chunks.slice())if(c.alive&&c.attached)G.detachChunk(c,V(0,0,0),0.5,false);
const p=best.chunks[0].bc.clone().addScaledVector(best.normal,0.3);for(let k=0;k<6;k++)G.spawnFragments(p.clone().add(V(Math.random()-0.5,0.5,Math.random()-0.5)),6,'gypsum',0.07,V(0,0,0));G.spawnFragments(p,8,'timber',0.05,V(0,0,0));
G.run(60);const a1=awake();G.run(600);const a2=awake();{const c={};for(const b of W.bodies.filter(b=>b.type===1&&b.sleepState!==2&&b!==G.player.body)){const k=(b.ent&&(b.ent.label||b.ent.kind))||'?';c[k]=(c[k]||0)+1;}console.log('   awake:',JSON.stringify(c));}ok(a1>30&&a2<=4,`the pile goes to sleep (${a1} awake at 1 s, ${a2} at 11 s)`);
const runner=G.ents.find(e=>e.label==='hallway runner');ok(runner&&!runner.dynamic,'debris landing on the hall runner leaves it lying flat');

/* 3. the basement floor: the player walks at full speed */
G.villaBasement();G.run(30);const pl=G.vbAt(7.2,0.4,8.0);const b=G.player.body;b.position.set(pl.x,pl.y,pl.z);b.velocity.set(0,0,0);G.player.yaw=0;G.run(30);const q0=b.position.clone();G.keys.KeyW=true;G.run(40);G.keys.KeyW=false;
const sp=Math.hypot(b.position.x-q0.x,b.position.z-q0.z)*60/40;ok(sp>3.4,`walking speed on the basement floor ${sp.toFixed(2)} m/s`);
ok(W.contactmaterials.some(c=>c.materials.includes(G.matPlayer)&&c.materials.some(m=>m&&m.name==='vbfloor')&&c.friction===0),'player/basement-floor contact is frictionless');
ok(W.bodies.every(b=>!!b.material),'every body has a material');

/* 4. the tunnel mouths: no mortar sheet across them, and you can walk from the plant room into the tunnel */
const r=G.VBR.tunnel;const o0=G.vbAt(7.4,1.0,6.8),o1=G.vbAt(10.5,1.0,6.8);const rc=new G.THREE.Raycaster(o0,o1.clone().sub(o0).normalize(),0.05,o0.distanceTo(o1));G.scene.updateMatrixWorld(true);const hits=rc.intersectObjects(G.scene.children,true).filter(h=>h.object.visible&&h.object.material&&h.object.material.visible!==false&&!(h.object.isPoints||h.object.isLine||h.object.isSprite));const blocked=hits.length;if(blocked)console.log('   first hit',hits[0].object.name||hits[0].object.type,hits[0].distance.toFixed(2));
ok(blocked===0,`nothing solid hangs across the plant-room tunnel mouth (${blocked})`);
const s0=G.vbAt(7.6,0.4,6.8);b.position.set(s0.x,s0.y,s0.z);b.velocity.set(0,0,0);G.player.yaw=-Math.PI/2;G.run(20);G.keys.KeyW=true;G.run(120);G.keys.KeyW=false;ok(b.position.x>G.vX(9.6),`walked from the plant room into the tunnel (plan x ${((b.position.x+8.8)*0.75).toFixed(2)})`);
ok(G.VB.festoon&&G.VB.festoon.length===3,'festoon bulbs');

console.log('bodies',W.bodies.length,'settled by the settle pass',G.SETTLE.slept);
console.log(fails?`FAILS ${fails}`:'ALL OK');process.exit(fails?1:0);
