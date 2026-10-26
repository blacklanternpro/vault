// v9.1 darts: board geometry + scoring, checkouts, oche seat, real throws (rhythm, drop, spread), 501 rules, cricket v Dazza (his darts fly), strays + plaster holes, loose darts, SWILL sips
import {boot} from './boot81.mjs';
const G=await boot('darts',{extra:'DART,DR,DORDER,dartScore,checkout,dartLaunch,dartNewGame,dartPickGame,dartNextTurn,dartScored,swillSip,SEAT,SEATS,sitDown,standUp,throwHeld,BOND,dartThrowHeld,'});G.run(30);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)fails++;};const W=G.V;
const D=G.DART,B=D.B;console.log('boot',G.bootMs.toFixed(0),'bodies',G.world.bodies.length,'board',JSON.stringify(G.plan(B.c)),'oche',JSON.stringify(G.plan(D.oche)));
ok(D.board&&D.doors.length===2&&D.doors.every(d=>d.drawable),'board + cabinet + two chalkboards');ok(Math.abs(B.c.y-1.73)<0.01,'bull at 1.73 m: '+B.c.y.toFixed(3));ok(Math.abs(B.c.distanceTo(D.oche.clone().setY(B.c.y))-2.37)<0.01,'oche 2.37 m from the face');
const P=(r,deg)=>B.c.clone().addScaledVector(B.r,Math.sin(deg*Math.PI/180)*r).addScaledVector(B.u,Math.cos(deg*Math.PI/180)*r);
const cases=[[0,0,'BULL'],[0.012,40,'25'],[0.103,0,'T20'],[0.166,0,'D20'],[0.05,0,'20'],[0.103,18,'T1'],[0.103,90,'T6'],[0.103,180,'T3'],[0.103,270,'T11'],[0.166,-18,'D5'],[0.2,0,'OUT'],[0.08,99,'10']];
const bad=cases.filter(([r,a,l])=>G.dartScore(P(r,a)).label!==l);ok(!bad.length,'scoring by ring and segment ('+cases.length+' points)'+(bad.length?' wrong: '+bad.map(c=>c[2]+'→'+G.dartScore(P(c[0],c[1])).label).join(','):''));
ok(G.dartScore(P(0.0995,0)).wire<0.001&&G.dartScore(P(0.1,9)).wire<0.001,'wire distance near rings and spider');
ok(JSON.stringify(G.checkout(170))==='["T20","T20","BULL"]'&&JSON.stringify(G.checkout(40))==='["D20"]'&&G.checkout(1)===null&&G.checkout(32)[0]==='D16','checkouts: 170 '+G.checkout(170)+' · 40 '+G.checkout(40)+' · 61 '+G.checkout(61)+' · 99 '+G.checkout(99));
// step up
G.D0=D.board;D.board.use();G.run(50);ok(G.SEAT.at==='oche','E on the board steps you up');
// aim at a point 11 cm over the bull and throw 24 with a clean rhythm
const eye=G.SEAT.eye;const aim=(pt)=>{const d=pt.clone().sub(eye);const yaw=Math.atan2(-d.x,-d.z),pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));G.SEAT.ly=yaw-G.SEAT.yaw;G.SEAT.lp=pitch-G.SEAT.pitch;};
G.dartPickGame(0);const throwOne=(hold,keep)=>{G.SEATS.oche.down(0);G.run(Math.round(hold*60));G.SEATS.oche.up(0);G.run(40);const last=D.list.filter(d=>d.owner==='you').at(-1);if(keep)keep(last);if(D.game.state==='pull')G.dartNextTurn();};
const land=[];for(let i=0;i<24;i++){aim(B.c.clone().addScaledVector(B.u,0.11));throwOne(0.55,d=>{if(d&&d.ent===D.board&&d.sc&&!land.includes(d))land.push(d);});}
const pts=land.map(d=>{const q=d.wm.elements;/* tip = origin + 0.077 along the dart */const o=W(q[12],q[13],q[14]);const z=W(q[8],q[9],q[10]).normalize();const t=o.addScaledVector(z,0.077).sub(B.c);return{x:t.dot(B.r),y:t.dot(B.u)};});
const mx=pts.reduce((a,p)=>a+p.x,0)/pts.length,my=pts.reduce((a,p)=>a+p.y,0)/pts.length;const sd=Math.sqrt(pts.reduce((a,p)=>a+(p.x-mx)**2+(p.y-my)**2,0)/pts.length);
ok(land.length>=20,'clean throws stick in the board: '+land.length+'/24');ok(Math.abs(my)<0.03&&Math.abs(mx)<0.02,'aiming 11 cm high lands round the bull: mean '+(mx*1000).toFixed(0)+','+(my*1000).toFixed(0)+' mm');ok(sd>0.003&&sd<0.03,'spread '+(sd*1000).toFixed(1)+' mm (sway + release)');
console.log('   labels',land.map(d=>d.sc.label).join(' '));
// rhythm: a rushed snatch drops low, a held-too-long one goes high/wide
const lowY=[];for(let i=0;i<4;i++){aim(B.c.clone().addScaledVector(B.u,0.11));throwOne(0.15,d=>{if(d&&d.state==='stuck'){const q=d.wm.elements;lowY.push(q[13]);}});}ok(lowY.length&&lowY.every(y=>y<B.c.y-0.03),'a snatched throw drops low ('+lowY.map(y=>((y-B.c.y)*100).toFixed(0)).join(',')+' cm)');
// 501 rules
G.dartNewGame('501');const fake={owner:'you'};const sc=(seg,mult)=>({seg,mult,pts:seg*mult,label:(mult===3?'T':mult===2?'D':'')+seg});
for(const s of[sc(20,3),sc(20,3),sc(20,3)])G.dartScored(fake,s);ok(D.game.rem===321&&D.game.state==='pull','501: ton-eighty leaves 321');G.dartNextTurn();
D.game.rem=D.game.remT=32;G.dartScored(fake,sc(20,1));G.dartScored(fake,sc(12,1));ok(D.game.rem===32&&D.game.state==='pull','501: finishing on a single 12 is a bust, back to 32');G.dartNextTurn();
G.dartScored(fake,sc(16,2));ok(D.game.state==='won'&&D.game.rem===0,'501: D16 checks out');
// cricket v Dazza: your turn by hand, his darts fly
G.dartPickGame(3);for(const s of[sc(20,3),sc(20,1),sc(19,2)])G.dartScored(fake,s);ok(D.game.cr.you[20]===3&&D.game.pts.you===20&&D.game.cr.you[19]===2,'cricket: T20 closes, the next 20 scores');
G.dartNextTurn();ok(D.game.state==='dazza','Dazza\'s throw');G.run(60*5.5);const dzd=D.list.filter(d=>d.owner==='dazza');console.log('   dazza',JSON.stringify(D.game.cr.dazza),'pts',D.game.pts.dazza,'turn',D.game.turnDarts.join(' '));
ok(D.game.turnDarts.filter(t=>t.startsWith('D:')).length===3||D.game.state==='play','Dazza threw three real darts');G.run(60*2.5);ok(D.game.state==='play'&&D.inHand===3,'back to you after he pulls his darts');
ok(G.msgs.some(m=>m.startsWith('[DAZZA, THROUGH THE ROLLER DOOR]')),'Dazza chirps');
G.standUp();G.run(30);
// strays: a dart thrown at a garage wall sticks and leaves a hole; one at the concrete bounces loose
const b0=G.BOND.total;const tgt=B.c.clone().addScaledVector(B.r,0.9).addScaledVector(B.u,-0.2).addScaledVector(B.n,-0.056);const p0=D.oche.clone();p0.y=1.6;
G.dartLaunch(p0,tgt.clone().sub(p0).normalize().multiplyScalar(7),'free');G.run(40);const st=D.list.at(-1);console.log('   stray',st&&st.state,st&&st.ent&&st.ent.kind,st&&st.ent&&st.ent.label,'bond live',G.BOND.live);ok(st&&st.state==='stuck'&&G.BOND.total>=b0+15,'a stray dart sticks in the plaster (+$'+(G.BOND.total-b0)+')');
const nl=(D.loose||[]).length;const pf=G.player.body.position;G.dartLaunch(W(pf.x,1.2,pf.z),W(0.5,-6,0.2),'free');G.run(40);ok((D.loose||[]).length===nl+1,'one at the slab bounces off and lies loose');
// a dart from the case, thrown by hand
{const cp=D.case.mesh.getWorldPosition(W());G.player.body.position.set(cp.x+0.8,0.37,cp.z);G.player.body.velocity.set(0,0,0);G.run(10);}G.setTool(3);D.case.use();G.run(5);const h=G.getHeld();ok(h&&h.ent&&h.ent.isDart,'darts case hands you a dart');const n0=D.list.length;G.dartThrowHeld();G.run(40);ok(D.list.length===n0+1,'RMB throws it as a dart');
// SWILL
const BF=G.VR6.beer;{const fp=BF.e.mesh.getWorldPosition(W());G.player.body.position.set(fp.x-1.0,0.37,fp.z);G.player.body.velocity.set(0,0,0);G.player.yaw=-Math.PI/2;G.run(10);}if(BF.door.kin.target===0)BF.e.use();G.run(30);BF.e.use();G.run(5);const can=G.getHeld().ent;const d0=D.drunk;for(let i=0;i<3;i++)G.swillSip(can);ok(D.drunk===d0+1&&/empty/.test(can.label),'three sips empty a can, drunk '+D.drunk);
console.log('bodies',G.world.bodies.length);console.log(fails?('FAILS '+fails):'ALL OK');
