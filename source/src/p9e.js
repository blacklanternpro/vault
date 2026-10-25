
/* ============================================================ v6.5 — WS2: SERVICES
   p9e — the house's wiring and water. Villa only.
   - Circuits: a switchboard in the garage with a main switch, an RCD on the power points, and breakers for LIGHTS and A/C.
     `power` (what every appliance already reads) is now "main on and RCD in"; `VE.lights` feeds the ceiling lights.
     Cutting a live cable trips the circuit it belongs to (switch risers = lights, outlet drops = power); E on the board
     resets it. The RCD's TEST button trips it on purpose.
   - Every room has a light switch by its door (wet rooms: on the hall side), and power points. Their cables are real
     cylinders in the wall cavity, dormant until the wall is opened (villaWake wakes them with the studs).
   - Lights are fittings you can break: an oyster or a fluoro batten per room, each room's glow on its own material so a
     switch turns its room dark (and the bounce fill dims with it: a dark room is dark).
   - Water: copper risers and PVC waste in the wet walls where the fixtures will stand (WS3/WS4 put the fixtures there);
     punctures spray until you turn the stopcock off at the meter by the front path. A smoke alarm chirps in the hall. */

const VE={main:true,rcd:true,lightsCB:true,acCB:true,lights:true,water:true,board:null,switches:[],gpos:[],alarm:null};
function veSync(){power=VE.main&&VE.rcd;VE.lights=VE.main&&VE.lightsCB;VE.ac=VE.main&&VE.acCB;HUD.setPower(power);if(VE.board)veBoardDraw();}
/* ---------- geometry helpers: a plan point on a wall line, and the face of it that looks into a given room */
function vWallAt(px,pz,o){/* o: 'h' (a wall running along x) or 'v'; returns {w,u} with u along the wall */let best=null;for(const w of VW.walls){const s=w.seg;if(s.o!==o)continue;const c=o==='h'?pz:px,t=o==='h'?px:pz;if(Math.abs(s.c-c)>0.02||t<s.t0-0.01||t>s.t1+0.01)continue;best=w;break;}
  if(!best)return null;const p=V3(vX(px),0,vZ(pz));return{w:best,u:wallUV(best,p).u};}
function vFaceOf(w,room){return w.faces.find(f=>f.room&&f.room.id===room)||null;}
function vFaceU(f,wu){return f.side>0?wu:f.L-wu;}
function vWire(w,u,v0,v1,circuit,label){const e=cylEnt(wallPoint(w,u,v0,0.055),wallPoint(w,u,v1,0.055),0.006,M.tps,{kind:'wire',mat:'plastic',live:true,wall:w,label,circuit,dormant:!!w.dormant});WIRES.push(e);return e;}
function vPipe(w,u,v0,v1,o){const r=o.waste?0.025:0.009;const e=cylEnt(wallPoint(w,u,v0,o.waste?0.055:0.07),wallPoint(w,u,v1,o.waste?0.055:0.07),r,o.waste?M.pvc:M.copper,{kind:'pipe',mat:o.waste?'plastic':'copper',hp:o.waste?2:3,leaking:false,wall:w,label:o.label||(o.waste?'PVC waste':'copper water pipe'),waste:!!o.waste,hot:!!o.hot,dormant:!!w.dormant});PIPES.push(e);return e;}

/* ---------- switches and power points */
const VE_TEX={};
function veSwitch(f,fu,rooms,label){const w=f.wall;const p=facePoint(f,fu,1.1,-0.006);const g=new THREE.Mesh(vMergeGeos([[new THREE.BoxGeometry(0.075,0.115,0.012),_mm4(0,0,0)],[new THREE.BoxGeometry(0.026,0.04,0.008),_mm4(0,0,-0.009,0.18)]]),M.beige);g.position.copy(p);g.quaternion.copy(f.q);const rocker={rotation:{x:0}};
  const e=mkEnt({mesh:g,body:boxBody(0.04,0.06,0.008,p,qC(f.q)),kind:'fixture',mat:'plastic',mass:0.1,hp:2,wakeThreshold:1e9,label:'light switch'});e.rooms=rooms;e.rocker=rocker;
  const on=()=>VL.fix.some(x=>rooms.includes(x.room.id)&&x.on!==false);e.useLabel=()=>on()?'LIGHTS OFF':'LIGHTS ON';
  e.use=()=>{const to=!on();for(const x of VL.fix)if(rooms.includes(x.room.id))x.on=to;for(const s of VE.switches)if(s.rooms.some(r=>rooms.includes(r)))s.rocker.rotation.x=to?0.18:-0.18;S.click(p,2200);/* a switch is a spark: Phase 4 cares */if(typeof onSpark==='function')onSpark(p,'switch');};
  rocker.rotation.x=0.18;e.onHit=(p2,dmg)=>{if(dmg<1.4||e.dead)return;e.dead=true;sparks(p2,10,[1,0.85,0.4]);S.snap(p2);if(typeof onSpark==='function')onSpark(p2,'switch');HUD.msg('[SWITCH PLATE SMASHED · THE TERMINALS ARE RIGHT THERE]',1.2);e.use=null;e.useLabel='';};
  const wu=f.side>0?fu:f.L-fu;vWire(w,wu,1.17,w.H-0.05,'lights','switch cable');VE.switches.push(e);return e;}
function veGPO(f,fu,v=0.3){const w=f.wall;const p=facePoint(f,fu,v,-0.006);const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.BoxGeometry(0.14,0.075,0.012),M.beige));for(const sx of[-0.035,0.035]){for(const [dx,dy,rz] of[[-0.009,0.008,0.5],[0.009,0.008,-0.5],[0,-0.01,0]]){const s=new THREE.Mesh(new THREE.BoxGeometry(0.003,0.009,0.004),M.black);s.position.set(sx+dx,dy,-0.007);s.rotation.z=rz;g.add(s);}const sw=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.01,0.005),M.ceramic);sw.position.set(sx,0.026,-0.007);g.add(sw);}g.position.copy(p);g.quaternion.copy(f.q);
  const e=mkEnt({mesh:g,body:boxBody(0.07,0.04,0.008,p,qC(f.q)),kind:'fixture',mat:'plastic',mass:0.1,hp:2,wakeThreshold:1e9,label:'double power point'});e.onHit=(p2,dmg)=>{if(dmg<1.4||e.dead)return;e.dead=true;if(power){sparks(p2,16,[0.6,0.8,1]);S.arc(p2);if(typeof onSpark==='function')onSpark(p2,'gpo');}else S.snap(p2);};
  const wu=f.side>0?fu:f.L-fu;vWire(w,wu,v+0.05,w.H-0.05,'power','outlet drop');VE.gpos.push(e);return e;}
function vePlaceNear(f,wu0,wu1){/* a face-u just beside an opening, on whichever side has wall left */const a=vFaceU(f,wu0),b=vFaceU(f,wu1);const lo=Math.min(a,b),hi=Math.max(a,b);if(hi+0.14<f.L-0.06)return hi+0.12;if(lo-0.14>0.06)return lo-0.12;return null;}
function veWiring(){/* one switch per room, by the way in */const done=new Set();const want=[];for(const r of VP.rooms){if(r.id==='bathx')continue;want.push(r.id);}
  const place=(rid,ctrl)=>{const host=['wc','bath','ensuite'].includes(rid);const cands=[];for(const w of VW.walls)for(const o of w.openings){const rr=[w.rooms.front,w.rooms.back];const me=rid==='bath'?(rr.includes('bath')||rr.includes('bathx')):rr.includes(rid);if(!me)continue;if(o.kind==='window')continue;const other=rr.find(x=>x!==rid&&!(rid==='bath'&&x==='bathx'));const faceRoom=host?other:(rid==='bath'?'bathx':rid);if(faceRoom==='out')continue;const f=vFaceOf(w,faceRoom==='bath'?'bathx':faceRoom);if(!f)continue;const pri=o.kind==='door'||o.kind==='front'?0:(o.kind==='arch'?1:2);cands.push({w,o,f,pri});}
    cands.sort((a,b)=>a.pri-b.pri);for(const c of cands){const fu=vePlaceNear(c.f,c.o.u0,c.o.u1);if(fu==null)continue;veSwitch(c.f,fu,ctrl,'light switch');return true;}
    /* no room beside any way in (the entry's front door fills its wall): the longest plain wall, near its street end */const fs=VW.faces.filter(f=>f.room&&f.room.id===rid&&f.matKind!=='tile').sort((a,b)=>b.L-a.L);if(fs.length){const f=fs[0];const a=facePoint(f,0.4,0,0),b=facePoint(f,f.L-0.4,0,0);veSwitch(f,a.z>b.z?0.4:f.L-0.4,ctrl,'light switch');return true;}return false;};
  for(const id of want){if(done.has(id))continue;if(place(id,[id]))done.add(id);}
  /* the hall gets a second switch at the far end (two-way) */{const r=VROOM.hall;const w=vWallAt(17.0,5.0,'h');if(w){const f=vFaceOf(w.w,'hall');if(f)veSwitch(f,vFaceU(f,w.u),['hall'],'light switch');}}
  /* power points: two per habitable room on its longest stretch of plain wall, kitchen and laundry above the bench later (WS3) */
  for(const r of VP.rooms){if(['hall','entry','wc','bathx','wir'].includes(r.id))continue;const faces=VW.faces.filter(f=>f.room===r&&f.matKind!=='tile');if(!faces.length)continue;faces.sort((a,b)=>b.L-a.L);const f=faces[0];const free=u=>!f.wall.openings.some(o=>{const a=vFaceU(f,o.u0),b=vFaceU(f,o.u1);return u>Math.min(a,b)-0.25&&u<Math.max(a,b)+0.25;});
    const n=r.id==='garage'||r.id==='living'?3:2;let k=0;for(let i=1;i<=6&&k<n;i++){const u=f.L*(i/7);if(!free(u))continue;if(i%2===(n===3?0:1)&&k<n){veGPO(f,u,r.id==='garage'?1.2:0.3);k++;}}}}

/* ---------- the switchboard (garage, west wall): main, RCD with its TEST button, LIGHTS and A/C breakers */
function veBoardCanvas(){const c=mkCanvas(256,192),x=c.getContext('2d');VE_TEX.board=c;return c;}
function veBoardDraw(){const c=VE_TEX.board;if(!c)return;const x=c.getContext('2d');x.fillStyle='#e6e1d2';x.fillRect(0,0,256,192);x.fillStyle='#d2ccbb';x.fillRect(10,40,236,100);
  const sw=[['MAIN',VE.main,'#c02020'],['RCD',VE.rcd,'#d8d8d0'],['LIGHTS',VE.lightsCB,'#d8d8d0'],['A/C',VE.acCB,'#d8d8d0']];sw.forEach(([n,on,col],i)=>{const bx=24+i*56;x.fillStyle='#2a2a2c';x.fillRect(bx,52,40,76);x.fillStyle=col;x.fillRect(bx+10,on?58:96,20,26);x.fillStyle='#111';x.font='bold 11px monospace';x.textAlign='center';x.fillText(n,bx+20,150);x.font='9px monospace';x.fillStyle=on?'#2a6a2a':'#a02020';x.fillText(on?'ON':'OFF',bx+20,164);});
  x.fillStyle='#b8d8b8';x.fillRect(82,132,20,8);x.fillStyle='#222';x.font='7px monospace';x.fillText('TEST',92,139);x.fillStyle='#333';x.font='italic 10px serif';x.textAlign='left';x.fillText('lights · pwr (bedrms+lvng+ktchn) · a/c  — 2003',14,24);x.fillText('DO NOT TOUCH - M.',150,186);if(VE.board&&VE.board.tex)VE.board.tex.needsUpdate=true;}
function veBoard(){const t=vWallAt(0,6.6,'v');if(!t)return;const f=vFaceOf(t.w,'garage');if(!f)return;const fu=vFaceU(f,t.u);const p=facePoint(f,fu,1.5,-0.06);
  const c=veBoardCanvas();const tex=mkTex(c,1,1);const g=new THREE.Group();const box=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.38,0.11),M.beige);g.add(box);const face=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.345),new THREE.MeshStandardMaterial({map:tex,roughness:0.6}));face.position.z=-0.056;face.rotation.y=Math.PI;g.add(face);g.position.copy(p);g.quaternion.copy(f.q);
  const e=mkEnt({mesh:g,body:boxBody(0.25,0.19,0.055,p,qC(f.q)),kind:'fixture',mat:'plastic',mass:0,hp:999,wakeThreshold:1e9,noBatch:true,label:'switchboard'});VE.board=e;e.tex=tex;
  /* which switch you're looking at: the board's left-to-right quarter under the crosshair */const pick=h=>{const lp=g.worldToLocal(h.point.clone());const i=clamp(Math.floor((0.25-lp.x)/0.125),0,3);return i;};/* the face is mirrored (it looks out of the wall), so +x local is the board's right */
  e.useLabel=h=>{if(!h)return'SWITCHBOARD';const i=pick(h);const n=['MAIN SWITCH','RCD','LIGHTS BREAKER','A/C BREAKER'][i];const st=[VE.main,VE.rcd,VE.lightsCB,VE.acCB][i];return(st?'SWITCH OFF ':'RESET ')+n;};
  e.use=h=>{const i=h?pick(h):0;const k=['main','rcd','lightsCB','acCB'][i];VE[k]=!VE[k];S.click(p,1500);S.thud(p,0.4);if(i===1&&VE[k]===false)S.breaker();if(i===0&&!VE.main)S.breaker();veSync();if(typeof onSpark==='function')onSpark(p,'board');
    HUD.msg(['[MAIN SWITCH ','[RCD ','[LIGHTING CIRCUIT ','[AIR CON CIRCUIT '][i]+(VE[k]?'ON]':'OFF]'),1);};veBoardDraw();}

/* ---------- light fittings: real things you can break; each room's glow is its own material */
function veFittings(){VL.roomMat={};VL.fitE=[];for(const f of VL.fix){if(f.lvl==='b')continue;const r=f.room;const fluoro=r.id==='garage'||r.id==='laundry'||r.id==='kitchen';if(!VL.roomMat[r.id])VL.roomMat[r.id]=new THREE.MeshStandardMaterial({color:fluoro?0xf4f4f4:0xf4efe4,emissive:fluoro?0xeef6ff:0xfff0d0,emissiveIntensity:fluoro?2.2:1.6,roughness:0.35});const m=VL.roomMat[r.id];m.userData.base=m.emissiveIntensity;
    const g=fluoro?new THREE.BoxGeometry(1.2,0.05,0.12):new THREE.CylinderGeometry(0.17,0.18,0.06,18);const pos=V3(f.x,PH-0.035,f.z);const e=boxEnt(fluoro?1.2:0.34,0.06,fluoro?0.12:0.34,pos,m,{kind:'fixture',mat:'glass',mass:0.8,hp:1,label:fluoro?'fluorescent batten':'oyster light',shardCol:[0.96,0.95,0.9],shadow:false,noBatch:true});e.mesh.geometry=g;e.fix=f;f.ent=e;
    e.onShatter=()=>{f.dead=true;S.pop?S.pop(pos):S.snap(pos);if(VE.lights&&f.on!==false){sparks(pos,14,[1,0.9,0.6]);if(typeof onSpark==='function')onSpark(pos,'fitting');}HUD.msg('[LIGHT FITTING SMASHED]',1);};VL.fitE.push(e);}}
function veRoomLit(rid){return VL.fix.some(f=>f.room&&f.room.id===rid&&f.on!==false&&!f.dead&&f.lvl!=='b'&&(f.circuit==='power'?power:VE.lights));}
function veCeilLit(rid){/* the fitting glows for its own bulb, not for a lamp in the corner */return VL.fix.some(f=>f.room&&f.room.id===rid&&!f.circuit&&f.on!==false&&!f.dead&&f.lvl!=='b'&&VE.lights);}

/* ---------- water */
function vePlumbing(){/* [plan x, plan z, wall orientation, room, what] — the fixtures arrive in WS3/WS4 */const pts=[[4.0,0,'h','kitchen','kitchen sink'],[0.9,0,'h','laundry','laundry trough'],[1.6,0,'h','laundry','washing machine taps'],[9.4,0,'h','bath','bath'],[11.6,3.3,'v','bathx','vanity basin'],[9.2,3.3,'v','wc','toilet cistern'],[17.6,9.2,'v','ensuite','shower'],[16.2,7.4,'h','ensuite','ensuite basin'],[15.2,9.3,'v','ensuite','ensuite toilet']];
  VE.plumb=[];for(const [px,pz,o,room,what] of pts){const t=vWallAt(px,pz,o);if(!t)continue;const{w,u}=t;const cold=vPipe(w,u-0.06,0.05,what.includes('cistern')||what.includes('toilet')?0.75:1.0,{label:'copper cold water ('+what+')'});const hot=what.includes('cistern')||what.includes('toilet')||what.includes('washing')?null:vPipe(w,u+0.06,0.05,1.0,{hot:true,label:'copper hot water ('+what+')'});
    const waste=what.includes('taps')?null:vPipe(w,u,0.05,0.55,{waste:true,label:'PVC waste ('+what+')'});VE.plumb.push({what,room,w,u,cold,hot,waste,px,pz});}
  /* the water meter and stopcock by the front path: turn it off and every leak stops */const mx=vX(4.6),mz=vZ(VP.D)+0.5;const box=new THREE.Group();const pit=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.04,0.3),M.darkMetal);box.add(pit);const tap=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.02,10),new THREE.MeshStandardMaterial({color:0xb02020,roughness:0.5}));tap.position.y=0.05;box.add(tap);box.position.set(mx,-0.07,mz);
  const st=mkEnt({mesh:box,body:boxBody(0.18,0.05,0.15,V3(mx,-0.07,mz)),kind:'fixture',mat:'metal',mass:0,hp:999,wakeThreshold:1e9,noBatch:true,label:'water meter and stopcock'});st.useLabel=()=>VE.water?'TURN THE WATER OFF':'TURN THE WATER BACK ON';st.use=()=>{VE.water=!VE.water;tap.rotation.y+=Math.PI/2;S.groan(V3(mx,0,mz),0.5);if(!VE.water){S.stopLoop&&S.stopLoop('hiss');}else if(PIPES.some(p=>p.leaking&&!p.waste&&p.alive))S.startHiss();HUD.msg(VE.water?'[WATER BACK ON]':'[WATER OFF AT THE METER · LEAKS STOP]',1.4);};VE.stopcock=st;}

/* ---------- the smoke alarm: low battery since 2019 */
function veAlarm(){const p=V3(vX(8.4),PH-0.025,vZ(4.5));const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.065,0.035,18),M.ceramic);g.add(b);const led=new THREE.Mesh(new THREE.SphereGeometry(0.004,6,4),new THREE.MeshStandardMaterial({color:0x330000,emissive:0xff2010,emissiveIntensity:0}));led.position.set(0.03,-0.018,0);g.add(led);g.position.copy(p);
  const e=mkEnt({mesh:g,body:boxBody(0.065,0.02,0.065,p),kind:'prop',mat:'plastic',mass:0.25,hp:1.5,label:'smoke alarm (low battery)',wakeThreshold:1.2});e.led=led;e.t=6;e.battery=true;VE.alarm=e;
  e.useLabel=()=>e.battery?'PULL THE BATTERY OUT':'';e.use=()=>{if(!e.battery)return;e.battery=false;S.click(p,3000);HUD.msg('[BATTERY OUT. PEACE. TECHNICALLY A BREACH.]',1.6);e.label='smoke alarm (no battery)';};
  e.onHit=(p2,dmg)=>{if(dmg>1.4&&e.battery){e.battery=false;S.snap(p2);HUD.msg('[SMOKE ALARM SILENCED. PERMANENTLY.]',1.4);}};}
function veUpdate(dt){/* lights follow the circuit, the switch and the fitting; the room glow follows its fittings */for(const [rid,m] of Object.entries(VL.roomMat||{})){const lit=veCeilLit(rid);m.emissiveIntensity=lerp(m.emissiveIntensity,lit?m.userData.base:0,1-Math.exp(-dt*14));}
  const A=VE.alarm;if(A&&A.alive&&A.battery){A.t-=dt;if(A.t<=0){A.t=38+Math.random()*14;S.tone({f:3300,dur:0.05,type:'square',gain:0.08,pos:A.mesh.getWorldPosition(V3())});A.led.material.emissiveIntensity=3;setTimeout(()=>{if(A.led)A.led.material.emissiveIntensity=0;},140);}}}
function villaServices(){veFittings();veWiring();veBoard();vePlumbing();veAlarm();veSync();}
