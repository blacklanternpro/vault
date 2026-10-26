// v8.1 harness: pantry + cupboards, gas pockets (igniter whoof, saw spark, bottle torch, full room blast still works), saw sparks on metal, cords that stretch then pop/snap, the boxing bag, the bar fridge
import {boot} from './boot81.mjs';
const G=await boot('v81',{extra:'V81,LC,SPK,sawSpray,lcToggle,lcOK,lcCut,KETTLE,KITCH,VLD,mwStop,vgPocket,VLV,FRIDGE,fridgePowered,useTarget,BOND,'});G.run(30);
let fails=0;const ok=(c,msg)=>{console.log((c?'  ok  ':'  FAIL ')+msg);if(!c)fails++;};const W=G.V;const last=()=>G.msgs.slice(-3).join(' | ');
console.log('boot ms',G.bootMs.toFixed(0),'bodies',G.world.bodies.length,'cords',G.V81.cords,'kin',JSON.stringify(G.V81.kin),'lc segs',G.LC.segs.length);
ok(G.world.bodies.length<=820,'bodies at boot '+G.world.bodies.length+' (v8.0 ~772, gate 900)');ok(G.V81.cords>=10,'light cords built: '+G.V81.cords+' ('+G.LC.list.map(c=>c.label).join(', ')+')');
// --- pantry
const pan=G.ents.find(e=>e.label==='pantry');const pp=G.plan(pan.mesh.getWorldPosition(W()));ok(Math.abs(pp.x-5.4)<0.05&&pp.z<0.4,'pantry at the east end of the back run '+JSON.stringify(pp));
for(const d of G.ents.filter(e=>e.label==='pantry door')){const a=d.mesh.getWorldPosition(W());G.toggleKinDoor(d);G.run(50);const b=d.mesh.getWorldPosition(W());ok(G.plan(b).z>G.plan(a).z+0.08,'pantry door swings out into the kitchen z '+G.plan(a).z+' -> '+G.plan(b).z);G.toggleKinDoor(d);}
G.run(50);
// --- cupboards + drawers
const cdoors=G.ents.filter(e=>(e.label==='cabinet door'||e.label==='cupboard door')&&['kitchen','laundry'].includes(G.vgRoomAt(e.mesh.getWorldPosition(W()))));ok(cdoors.length>=6&&cdoors.every(d=>d.kin&&d.use),'kitchen cupboard doors are kin doors: '+cdoors.length);
let outN=0;for(const d of cdoors){const car=d.kin.parent.mesh.getWorldPosition(W());const a=d.mesh.getWorldPosition(W()).sub(car).setY(0).length();d.use();G.run(40);const b=d.mesh.getWorldPosition(W()).sub(car).setY(0).length();if(b>a+0.05)outN++;d.use();}G.run(40);ok(outN===cdoors.length,'every cupboard door opens outward: '+outN+'/'+cdoors.length);
const drw=G.ents.filter(e=>e.label==='drawer'&&e.slide);ok(drw.length>=3,'drawers slide: '+drw.length);if(drw[0]){const a=drw[0].mesh.position.clone();drw[0].use();G.run(60);ok(drw[0].mesh.position.distanceTo(a)>0.3,'drawer slid '+drw[0].mesh.position.distanceTo(a).toFixed(2)+' m');drw[0].use();G.run(60);}
// --- saw sparks
{const oven=G.ents.find(e=>e.label==='oven');globalThis.op=oven.mesh.getWorldPosition(W());}
G.sawSpray(op.clone().add(W(0.32,0.1,0)),W(-1,0,0),'metal',1/60);G.run(2);let live=0;for(let i=0;i<G.SPK.N;i++)if(G.SPK.l[i]>0)live++;ok(live>=3&&G.SPK.mesh.visible,'metal under the saw throws a spark shower: '+live+' streaks live');
G.run(120);ok(!G.SPK.mesh.visible,'spark streaks die out and hide');
// --- cords: carry the toaster away while it's on
const T=G.TOAST.ent,tc=T.lcord;ok(!!tc&&G.lcOK(tc),'toaster has a plugged-in cord');G.wakeEnt(T);if(!T.dynamic)G.makeDynamic(T);G.run(5);
T.use&&T.use();G.run(5);const wasOn=G.TOAST.on;const tp=T.body.position;G.player.body.position.set(tp.x+0.2,G.player.body.position.y,tp.z+0.9);G.player.body.velocity.set(0,0,0);G.run(20);G.pickUp(T,0.9);
let poppedAt=-1,maxStr=0;for(let i=0;i<300;i++){G.step(1/60,()=>{G.player.body.velocity.z=2.2;});maxStr=Math.max(maxStr,tc.str);if(!G.lcOK(tc)){poppedAt=i;break;}}
ok(poppedAt>0,'carrying the toaster away: cord '+(tc.cut>=0?'snapped':'popped')+' after '+(poppedAt/60).toFixed(2)+' s (max strain '+maxStr.toFixed(2)+') · '+last());ok(!wasOn||!G.TOAST.on,'toaster went off when it lost power (was on '+wasOn+')');
const mU=G.msgs.length;T.use&&T.use();ok(G.msgs.slice(mU).some(m=>/NOT PLUGGED|CORD IS CUT/.test(m)),'unplugged toaster won\'t start: '+G.msgs.slice(mU).join(' | '));G.drop();G.run(60);
// plug it back in from close by (if it popped)
if(tc.cut<0){T.body.position.set(tc.socket.x+0.3,tc.socket.y-0.25,tc.socket.z);T.body.velocity.set(0,0,0);G.run(30);G.lcToggle(tc);ok(G.lcOK(tc),'plugged back in near its power point');}
// unplug first, then carry: no strain
const K=G.KITCH.kettle,kc=K.lcord;G.lcToggle(kc);ok(!kc.plugged,'kettle unplugged by hand');G.wakeEnt(K);if(!K.dynamic)G.makeDynamic(K);G.run(5);const kp=K.body.position;G.player.body.position.set(kp.x+0.3,G.player.body.position.y,kp.z+0.9);G.run(10);G.pickUp(K,0.9);for(let i=0;i<120;i++)G.step(1/60,()=>{G.player.body.velocity.z=2;});ok(kc.cut<0&&kc.str===0,'unplugged kettle carries away freely, cord trails (cut '+kc.cut+')');G.drop();G.run(30);
// thrown: the microwave lobbed across the kitchen
const MWe=G.MW.ent,mc=MWe.lcord;G.wakeEnt(MWe);if(!MWe.dynamic)G.makeDynamic(MWe);MWe.body.velocity.set(4,3,0);for(let i=0;i<90&&G.lcOK(mc);i++)G.run(1);ok(!G.lcOK(mc),'thrown microwave tears its cord out ('+(mc.cut>=0?'snapped':'popped')+')');
// PC tower: physical cord now gives too
const C=G.PC.cord,tw=G.PC.tower;G.wakeEnt(tw);if(!tw.dynamic)G.makeDynamic(tw);const pw=tw.body.position;G.player.body.position.set(pw.x,G.player.body.position.y,pw.z+0.9);G.run(10);G.pickUp(tw,1.0);let pcGone=-1;for(let i=0;i<360;i++){G.step(1/60,()=>{G.player.body.velocity.z=2.0;});if(!C.plugged||C.cut){pcGone=i;break;}}
ok(pcGone>0,'PC tower carried away: cord '+(C.cut?'torn out':'unplugged')+' after '+(pcGone/60).toFixed(2)+' s · '+last());G.drop();G.run(30);
// --- the boxing bag
const bag=G.VIBE.bag.e;const bp=bag.body.position;const bp0x=bp.x,bp0z=bp.z;G.player.body.position.set(bp.x-1.2,0.37,bp.z);G.player.body.velocity.set(0,0,0);G.run(20);let minD=9,maxSw=0;G.player.yaw=-Math.PI/2;G.keys.KeyW=true;for(let i=0;i<150;i++){G.step(1/60);const sw=Math.hypot(bag.body.position.x-bp0x,bag.body.position.z-bp0z);maxSw=Math.max(maxSw,sw);if(Math.abs(bag.body.position.y-1.28-0)<0.2+0)minD=Math.min(minD,Math.hypot(G.player.body.position.x-bag.body.position.x,G.player.body.position.z-bag.body.position.z));}G.keys.KeyW=false;
ok(minD>0.33&&maxSw>0.1,'walking into the boxing bag: closest '+minD.toFixed(2)+' m while it hangs low (was 0.01), it swung '+maxSw.toFixed(2)+' m');
// --- bar fridge
const BF=G.VR6.beer;ok(BF.cans.length===6&&BF.door&&BF.door.kin,'bar fridge: hinged door + 6 cans inside');BF.e.use();G.run(50);ok(BF.door.kin.ang!==0,'E opens the bar fridge door (ang '+BF.door.kin.ang.toFixed(2)+')');
BF.e.use();G.run(5);const h=G.getHeld();ok(h&&h.ent&&/SWILL can \((cold|warm)\)/.test(h.ent.label),'E again hands you a can: '+(h&&h.ent.label));G.drop();ok(BF.n===5,'5 left');
const fp=BF.e.mesh.getWorldPosition(W());G.player.body.position.set(fp.x-0.9,0.37,fp.z);G.run(10);G.wakeEnt(BF.e);if(!BF.e.dynamic)G.makeDynamic(BF.e);G.pickUp(BF.e,0.9);let meshes=0,vis=0;BF.e.mesh.traverse(o=>{if(o.isMesh){meshes++;if(o.visible)vis++;}});ok(meshes>=14&&vis===meshes,'picked-up bar fridge keeps all its parts: '+vis+'/'+meshes+' meshes');
let bfGone=-1;for(let i=0;i<300;i++){G.step(1/60,()=>{G.player.body.velocity.x=-2;});if(!G.lcOK(BF.e.lcord)){bfGone=i;break;}}ok(bfGone>0,'bar fridge carried off: its cord gives after '+(bfGone/60).toFixed(2)+' s');G.drop();G.run(30);
// --- gas: igniter after 6 s of one burner = a whoof; burners lit
const ig=G.ents.find(e=>e.label==='igniter button');const Bs=G.VK.burners;Bs[0].knob.use();G.run(60*6);console.log('   pocket',JSON.stringify(G.VG.pk.map(k=>[k.key,+k.gas.toFixed(3)])),'kitchen',G.VG.c.kitchen.toFixed(4));
const m0=G.msgs.length;ig.use();G.run(10);ok(G.msgs.slice(m0).some(m=>/WHOOF|WHUMP/.test(m)),'igniter after 6 s of gas: '+G.msgs.slice(m0).join(' | '));ok(Bs[0].lit,'burner 1 lit after the whoof');
// crossover: turn burner 2 on while 1 is lit
Bs[1].knob.use();G.run(30);ok(Bs[1].lit,'burner 2 lights off burner 1');for(const B of Bs){if(B.on)B.knob.use();}G.run(10);
// 4 burners for 20 s, then a saw spark on the oven front
for(const B of Bs)B.knob.use();G.run(60*20);console.log('   pocket',JSON.stringify(G.VG.pk.map(k=>[k.key,+k.gas.toFixed(3)])),'kitchen',G.VG.c.kitchen.toFixed(4));
const m1=G.msgs.length;G.onSpark(op.clone().add(W(0.32,0.1,0)));G.run(5);ok(G.msgs.slice(m1).some(m=>/WHUMP|WENT UP|EXPLOSION/.test(m)),'saw spark at the oven front lights the gas: '+G.msgs.slice(m1).join(' | '));for(const B of Bs){if(B.on)B.knob.use();}G.run(60);
// bottle torch carried into the kitchen with burners spewing
G.VG.fires.length=0;for(const B of Bs){B.lit=false;B.knob.use();}G.run(60*10);const BT=G.VG.bottle;BT.holed=true;BT.hole=W(0.15,0.1,0);BT.jet=true;BT.e.alive=true;G.makeDynamic(BT.e);BT.e.body.position.set(op.x+1.0,0.3,op.z+0.3);BT.e.body.velocity.set(0,0,0);
console.log('    burners',JSON.stringify(Bs.map(B=>[B.on,B.lit])),'supply',G.VG.supply,'cook',G.VK.cook.alive,'kitchen',G.VG.c.kitchen.toFixed(4));const m2=G.msgs.length;for(let i=0;i<20;i++){G.run(1);if(i%5===0)console.log('    torch',BT.jet,BT.jetP&&JSON.stringify(G.plan(BT.jetP)),'alive',BT.e.alive,'gas',BT.gas.toFixed(2),'pk',JSON.stringify(G.VG.pk.map(k=>[k.key,+k.gas.toFixed(3),JSON.stringify(G.plan(k.p))])));}ok(G.msgs.slice(m2).some(m=>/WHUMP|WENT UP|EXPLOSION|WHOOF/.test(m)),'a torching bottle in the kitchen lights the gas: '+G.msgs.slice(m2).join(' | '));BT.holed=false;BT.jet=false;BT.open=false;for(const B of Bs){if(B.on)B.knob.use();}G.run(60);
// room over the limit: the full blast still happens
G.VG.c.kitchen=0.07;const m3=G.msgs.length;G.vGasSpark(op.clone().add(W(0.6,0.5,0)),'test');G.run(5);ok(G.msgs.slice(m3).some(m=>/GAS EXPLOSION/.test(m)),'kitchen over the LEL: full explosion '+G.msgs.slice(m3).join(' | '));G.run(120);
console.log('bond',G.BOND.total,'msgs',G.msgs.length);console.log(fails?('FAILS '+fails):'ALL OK');
