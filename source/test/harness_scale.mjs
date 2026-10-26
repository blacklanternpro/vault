// v9.4 the rescale: plan units × 4/3, real-size furniture, 3 m ceilings, wider doors, a slimmer player, walls still meet
import {boot} from './boot81.mjs';
const G=await boot('scale',{extra:'PSC,PH,VW,VP,VROOM,vRoomAtWorld,vPlanX,vPlanZ,MOB,'});G.run(30);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)fails++;};const W=G.V;
ok(Math.abs(G.PSC-4/3)<1e-9&&G.PH===3.0,'plan scale 4/3, ceilings 3.0 m');
const m=G.VROOM.master;ok(Math.abs(G.vX(m.x1)-G.vX(m.x0)-4.8)<0.01&&Math.abs(G.vZ(m.z1)-G.vZ(m.z0)-6.4)<0.01,'master is 4.8 × 6.4 m');
const doors=G.VW.walls.flatMap(w=>w.openings.filter(o=>o.kind==='door').map(o=>o.u1-o.u0));ok(doors.length>8&&doors.every(d=>d>0.95&&d<1.1)&&doors.filter(d=>d>1.05).length>=6,'doorways 0.96–1.09 m ('+doors.map(d=>d.toFixed(2)).join(' ')+')');
const heads=G.VW.walls.flatMap(w=>w.openings.filter(o=>o.kind==='door').map(o=>o.v1));ok(heads.every(h=>Math.abs(h-2.3)<1e-6),'door heads at 2.3 m');
const p=G.vX(10),q=G.vZ(7);ok(G.vRoomAtWorld(p,q)&&G.vRoomAtWorld(p,q).id==='living'&&Math.abs(G.vPlanX(p)-10)<1e-9,'world ↔ plan round trip');
/* real-size furniture */const bed=G.ents.find(e=>e.label==='queen bed (shove it)');const bb=new G.THREE.Box3().setFromObject(bed.mesh);const bs=bb.getSize(W());ok(Math.abs(Math.max(bs.x,bs.z)-2.2)<0.06,'queen bed still 2.2 m long ('+Math.max(bs.x,bs.z).toFixed(2)+')');
const fr=G.ents.find(e=>e.label&&/benchtop/.test(e.label));ok(fr&&Math.abs(fr.mesh.getWorldPosition(W()).y-0.86)<0.05,'benchtops at 0.86 m');
/* player: 0.5 m wide, eye height unchanged, walks through a doorway */const sh=G.player.body.shapes;ok(sh.filter(s=>s.radius===0.25).length===2&&!sh.some(s=>s.radius===0.36),'player is two 0.25 m balls (and the chest one)');
G.player.body.position.set(G.vX(12.2),0.37,G.vZ(4.5));G.player.body.velocity.set(0,0,0);G.player.yaw=Math.PI;G.run(20);G.keys.KeyW=true;G.run(90);G.keys.KeyW=false;const pz=G.vPlanZ(G.player.body.position.z);ok(pz>5.5,'walk from the hall through the master door (plan z '+pz.toFixed(2)+')');
const eye=G.camera.getWorldPosition(W()).y;ok(eye>1.55&&eye<1.75,'eye height '+eye.toFixed(2));
/* walls: every interior wall face meets the ceiling and the floor */const faces=G.VW.faces;ok(faces.every(f=>Math.abs(f.H-3.0)<0.01),'wall faces are 3 m');
console.log('bodies',G.world.bodies.length);ok(G.world.bodies.length<=900,'bodies under the gate');
ok(G.MOB.sens===3.0,'phone look speed 3.0');
console.log(fails?`FAILS ${fails}`:'ALL OK');process.exit(fails?1:0);
