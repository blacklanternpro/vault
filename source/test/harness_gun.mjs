// v9.3 the revolver: safe (key / saw / bar), ammo drawer, take + load + DA/SA fire, dry fire, eject, ballistics through walls, brick stop, ricochet, hearing, muffs, gas, neighbours
import {boot} from './boot81.mjs';
const G=await boot('gun',{extra:'GUN,GS,GP,GDEC,NS,BOND,SEAT,crow,gunTool,gunCock,gunRTap,gunEject,gunFire,gunTrace,gunTake,gsUnlock,gunDropHammer,gunMatOf,gunEnv,toolCount,useTarget,getTool:()=>tool,VM,villaWake,'});G.run(30);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)fails++;};const W=G.V;const N=G.GUN,S=G.GS;
const plan=(x,y,z)=>W(G.vX(x),y,G.vZ(z));
const stand=(x,z)=>{G.player.body.position.set(G.vX(x),0.37,G.vZ(z));G.player.body.velocity.set(0,0,0);G.run(10);};
const aim=(pt)=>{G.run(1);const e=G.camera.getWorldPosition(W());const d=pt.clone().sub(e);G.player.yaw=Math.atan2(-d.x,-d.z);G.player.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));G.run(2);};
console.log('boot',G.bootMs.toFixed(0),'bodies',G.world.bodies.length);
// the safe
ok(S.door&&S.body&&S.flap&&S.keyEnt&&S.gunEnt&&S.ammoEnt,'safe, door, ammo drawer, key, revolver and ammo built');
ok(S.body.bolted&&!S.body.dynamic,'carcass bolted (static)');G.wakeEnt(S.body);ok(!S.body.dynamic,'wakeEnt does not free a bolted safe');
ok(Math.abs(G.plan(S.door.mesh.position).z-5.53)<0.06,'door face at plan z '+G.plan(S.door.mesh.position).z);
S.door.use();G.run(60);ok(S.locked&&Math.abs(S.door.kin.ang)<1e-3&&G.msgs.at(-1).includes('LOCKED'),'locked without the key: '+G.msgs.at(-1));
// muffs on the handle
const muff=S.muffMeshes[0];ok(S.door.useLabel({object:muff})==='TAKE THE EARMUFFS','earmuffs hang off the handle');S.door.use({object:muff});ok(N.hasMuffs&&N.muffs&&!muff.parent,'earmuffs taken and worn');N.muffs=false;
// the key: reachable from the robe
stand(16.3,7.0);aim(S.keyEnt.mesh.getWorldPosition(W()).add(W(0,-0.035,0)));const kh=G.castRay(2.1);ok(kh&&kh.ent===S.keyEnt,'key on its hook is visible + reachable from the robe ('+(kh?kh.ent.label:'nothing')+', '+(kh?kh.distance.toFixed(2):'')+' m)');
G.useTarget();ok(N.key&&!S.keyEnt.alive,'key taken');
// open with key; door swings into the room
stand(15.7,6.3);S.door.use();G.run(120);const dp=G.plan(S.door.mesh.position);ok(!S.locked&&Math.abs(S.door.kin.ang)>1.5,'key unlocks and the door swings ('+S.door.kin.ang.toFixed(2)+' rad)');ok(dp.z>5.6&&dp.x<15.5,'door swung out into the robe (centre now at plan x '+dp.x+', z '+dp.z+')');
// ammo drawer
S.flap.use();G.run(60);ok(!S.flapLocked&&Math.abs(S.flap.kin.ang)>1.2,'same key opens the ammo drawer, flap down');
const fp=G.plan(S.flap.mesh.position);const fc=S.flap.mesh.localToWorld(W(0,-0.11,0));ok(fc.y>1.25,'flap swung up and out (plan z '+fp.z+', y '+fp.y+')');
aim(S.ammoEnt.mesh.getWorldPosition(W()));let ah=G.castRay(2.1);ok(ah&&ah.ent===S.ammoEnt,'ammo box visible once the drawer is down ('+(ah?ah.ent.label:'nothing')+')');
S.ammoEnt.use();ok(N.ammo===50,'50 rounds in the pocket');
aim(S.gunEnt.mesh.localToWorld(W(0,0.038,0.025)));const gh=G.castRay(2.1);ok(gh&&gh.ent===S.gunEnt,'revolver visible on the shelf ('+(gh?gh.ent.label:'nothing')+')');
S.gunEnt.use();ok(N.have&&G.getTool()===5&&G.toolCount()===6,'revolver taken, slot 6 selected');ok(N.ch.every(c=>c===''),'it came unloaded');
// dry fire
G.mouse.l=true;G.mouse.lp=true;for(let i=0;i<20;i++){G.gunTool(1/60);G.step(1/60);G.mouse.lp=false;}G.mouse.l=false;G.gunTool(1/60);ok(N.shots===0&&N.idx===1,'DA pull on an empty cylinder: click, cylinder advanced one ('+N.idx+')');
// load: R tap opens, taps load
const tapR=()=>{G.keys.KeyR=true;G.gunTool(1/60);G.keys.KeyR=false;G.gunTool(1/60);};
tapR();ok(N.open,'R swings the cylinder out');for(let i=0;i<6;i++)tapR();ok(N.ch.every(c=>c==='L')&&N.ammo===44,'six rounds loaded one at a time (pocket '+N.ammo+')');tapR();ok(!N.open,'R on a full cylinder closes it');
// DA fire at the master/living wall: entry, blowout on the far side
stand(12.6,7.4);const tgt=plan(11.6,1.4,7.4);aim(tgt);const dec0=G.GDEC.count||0;const bond0=G.BOND.total;
const pullDA=(frames=20)=>{G.mouse.l=true;G.mouse.lp=true;for(let i=0;i<frames;i++){G.gunTool(1/60);G.step(1/60);G.mouse.lp=false;}G.mouse.l=false;for(let i=0;i<6;i++){G.gunTool(1/60);G.step(1/60);}};
const pitch0=G.player.pitch;pullDA(10);ok(N.shots===0,'a short pull (0.17 s) does not fire');pullDA(22);ok(N.shots===1&&N.ch.filter(c=>c==='S').length===1,'a full DA pull fires one ('+N.ch.join('')+')');
ok(G.player.pitch-pitch0>0.04,'recoil lifted the view '+((G.player.pitch-pitch0)*57.3).toFixed(1)+'°');
const tr=N.lastTrace;console.log('   trace',JSON.stringify(tr.ev));const ents=tr.ev.filter(e=>!e.exit),exits=tr.ev.filter(e=>e.exit);
ok(ents.some(e=>e.kind==='drywall')&&exits.filter(e=>e.kind==='drywall').length>=4,'through at least two stud walls: '+ents.filter(e=>e.kind==='drywall').length+' sheets entered, '+exits.filter(e=>e.kind==='drywall').length+' blowouts');ok((G.GDEC.count||0)-dec0>=2,'hole decals placed: '+((G.GDEC.count||0)-dec0));ok(G.BOND.total>bond0,'bond docked $'+(G.BOND.total-bond0));
ok(N.deaf>0.5&&N.ring>0.5,'unprotected shot: hearing dulled '+N.deaf.toFixed(2)+' ring '+N.ring.toFixed(2));G.run(60*12);ok(N.deaf<0.05,'hearing back after ~10 s ('+N.deaf.toFixed(3)+')');
// SA: cock, then a light trigger
G.gunCock();ok(N.cocked,'Q cocks the hammer');const s0=N.shots;G.mouse.l=true;G.mouse.lp=true;G.gunTool(1/60);G.mouse.lp=false;G.mouse.l=false;G.gunTool(1/60);ok(N.shots===s0+1,'single action breaks on the first frame');
G.gunCock();G.gunCock();ok(!N.cocked,'Q twice: cocked then eased down');
// muffs
N.muffs=true;N.deaf=0;N.ring=0;G.run(2);pullDA(22);ok(N.deaf<0.15&&N.ring===0,'with muffs: no ring, deaf '+N.deaf.toFixed(2));N.muffs=false;
// exterior brick: the master's street wall stops it
stand(13.0,8.6);aim(plan(12.4,1.2,9.8));pullDA(22);const tb=N.lastTrace;console.log('   brick',JSON.stringify(tb.ev));const last=tb.ev.filter(e=>!e.exit).at(-1);
ok(tb.ev.some(e=>e.cls==='brick'),'shot into the street wall reaches the brick veneer');ok(last&&(last.stop||last.ric)&&last.cls==='brick','brick stops it (or it glances off)');
// brick: second strike on the same spot knocks the brick out
{const c0=G.GUN.chips||0;const o=G.camera.getWorldPosition(W());const dd=plan(12.4,1.2,9.8).sub(o).normalize();let gone=false;for(let k=0;k<4&&!gone;k++){G.GUN.lastTrace={ev:[]};G.gunTrace(o,dd,1,0);const h=G.castRay(6,{ray:{o,d:dd}});gone=G.GUN.lastTrace.ev.some(e=>e.cls==='brick'&&e.exit)||G.ents.some(e=>e.label==='brick'&&e.dynamic);}
 ok((G.GUN.chips||0)>c0,'bullets chip the brick face ('+((G.GUN.chips||0)-c0)+' chips)');ok(G.ents.some(e=>e.label==='brick'&&e.dynamic),'repeat strikes knock a brick out of the veneer');}
// ricochet off the slab at a shallow angle
let ric=0;for(let k=0;k<6&&!ric;k++){G.GUN.lastTrace={o:W(),d:W(),ev:[]};const o=G.camera.getWorldPosition(W());const d=W(0.2,-0.12,0.97).normalize();G.gunTrace(o,d,1,0);ric=G.GUN.lastTrace.ric||0;}ok(ric>0,'a shallow shot at the slab ricochets');
// slab straight down: stopped
G.GUN.lastTrace={ev:[]};G.gunTrace(G.camera.getWorldPosition(W()),W(0,-1,0),1,0);const sl=G.GUN.lastTrace.ev.filter(e=>!e.exit).at(-1);ok(sl&&(sl.stop||sl.ric)&&sl.cls==='conc','straight down through the carpet into the slab: it stops ('+JSON.stringify(G.GUN.lastTrace.ev)+')');
// eject: empties on the floor, live back in the pocket
const nS=N.ch.filter(c=>c==='S').length,nL=N.ch.filter(c=>c==='L').length,am0=N.ammo;const props0=G.ents.filter(e=>e.label==='.357 case (fired)').length;
tapR();G.keys.KeyR=true;for(let i=0;i<40;i++)G.gunTool(1/60);G.keys.KeyR=false;G.gunTool(1/60);G.run(30);
ok(N.ch.every(c=>c==='')&&G.ents.filter(e=>e.label==='.357 case (fired)').length-props0===nS&&N.ammo===am0+nL,`hold R ejects: ${nS} empties on the floor, ${nL} live back (pocket ${N.ammo})`);
// gas: the muzzle is a spark
let sparkAt=null;G.SPARK_HOOKS.push(p=>{sparkAt=p;});for(let i=0;i<3;i++)tapR();tapR();N.open=false;pullDA(22);ok(sparkAt&&sparkAt.distanceTo(G.camera.getWorldPosition(W()))<1,'firing calls the spark hooks at the muzzle');
// the safe the hard ways (fresh state)
S.locked=true;S.door.kin.target=0;G.run(90);S.door.sawnDone=false;S.door.onSawn(W(),W(0,0,1));ok(!S.locked&&G.msgs.at(-1).includes('BOLT LINE'),'saw path: '+G.msgs.at(-1));
S.locked=true;S.lever=0;S.leverSeat=0;S.door.kin.target=0;G.run(90);const F=S.F;const edgeP=F.at(0.245,0.5,0.45);let slips=0;
for(let i=0;i<200&&S.locked;i++){G.crow.wedge={point:edgeP,ent:S.door};S.door.onLever(0.25,G.crow.wedge);if(!G.crow.wedge&&S.locked)slips++;}ok(!S.locked&&slips>=2&&G.msgs.some(m=>m.includes('LOCK EDGE FOLDS')),'bar path: bolts tear after '+slips+' reseats');
S.locked=true;G.crow.wedge={point:F.at(0,0.5,0.45),ent:S.door};S.door.onLever(0.5,G.crow.wedge);ok(S.locked&&G.msgs.at(-1).includes('NO GAP'),'bar mid-door: no purchase');S.locked=false;
// neighbours: a shot outside
stand(6,-3);ok(!G.vRoomAt||true,'');N.ch=['L','L','L','L','L','L'];N.chDirty=true;N.wokeT=0;G.NS.dogQuiet=0;aim(plan(6,0,-12));pullDA(22);G.run(60*6);ok(G.NS.dogQuiet>100,'the dog goes quiet ('+G.NS.dogQuiet.toFixed(0)+' s)');ok(G.NS.porch&&G.NS.porch.on,'the porch light across the road comes on');
const te=N.lastTrace.ev;console.log('   outside',JSON.stringify(te));ok(te.some(e=>e.kind==='env'),'outside shot lands on the ground');
console.log(fails?`FAILS: ${fails}`:'ALL OK');process.exit(fails?1:0);
