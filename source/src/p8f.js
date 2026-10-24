
/* ============================================================ v5 · 3 — EXECUTIONER v2
   p8f — you can walk (WASD at the desk, 1.4 m/s, eased), there is no game over, the right-hand pier is a wired-glass security
   door into the control room (shoot the handle twice), the control room console has the NEXT SUBJECT button (F flips the
   cover, F presses), a cell-lights switch and the scientists' clipboards. New subjects come in through a hatch in the cell's
   left wall, hooded and cuffed, kneel on the first free mark, and every one is different. Six ragdolls at once; past that the
   oldest body freezes where it lies. Tab = pause menu (Resume / New session / Quit to desktop). */
const MARKS=[[0,0.25],[-1.15,0.55],[1.15,0.55],[0,1.6],[-1.15,1.95],[1.15,1.95]];
const CHARGES=['FOUR COUNTS OF MURDER.','ARMED ROBBERY.','TAX FRAUD.','UNPAID PARKING FINES.','LOITERING WITH INTENT.','RETURNING A LIBRARY BOOK LATE.','LOOKING DIRECTLY AT THE CAMERA.','NO CHARGE ON FILE.'];
const DIGW=['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE'];
const TEMPER={defiant:{m:['...go on, then.',"They said you'd hesitate. The last one did.","I didn't hesitate."],hit:['Is that it?','...that all you got?'],f0:102},
  pleading:{m:["Please. Please, I've got a daughter.","I'll sign anything. I'll say anything.","I didn't do it. I swear I didn't do it."],hit:['PLEASE—','No no no no—'],f0:128},
  praying:{m:['...forgive us our trespasses...','...as we forgive those who trespass against us...','...amen. Amen. Amen.'],hit:['...deliver us—','Lord—'],f0:112},
  silent:{m:['[HE SAYS NOTHING]','[HE LOOKS STRAIGHT AT YOU]','[STILL NOTHING]'],hit:['[A SHARP BREATH]','[NOTHING]'],f0:0},
  laughing:{m:['[LAUGHING] Ha. Ha ha.','You should see your face. Oh— wait. I can.','[STILL LAUGHING]'],hit:['[LAUGHS HARDER]','Ha— HA—'],f0:118}};
const BEG={'DR VOSS':['We only observe— please— we only OBSERVE!','I have a pension. I have a— please.','It was in the brief. It was all in the brief!'],'DR HALE':["The door's locked, it's LOCKED, I can't—",'Security is coming. Security is coming. Isn\'t it?','Please. Not like this. Not in the lab coat.'],'DR AMES':["Please. It's a test. It's just a test. You PASSED!",'I was going to recommend you! I was!','I take it back. I take back the notes.']};
const _pc=V3();

/* ---------- the room additions */
function exBuildV2(){const PI=Math.PI;const steel=exLam({color:0x4a4f52}),dark=exLam({color:0x1e2022}),yel=exLam({color:0xc9a227});EX.v2hits=[];EX.uses=[];
  /* the door opening: steel jambs, head, threshold */const jamb=(x)=>{const m=exEnvBox(0.06,2.1,0.35,V3(x,1.05,-2.675),steel,false);return m;};jamb(2.23);jamb(2.97);exEnvBox(0.8,0.06,0.35,V3(2.6,2.1,-2.675),steel,false);exEnvPlane(0.8,0.35,V3(2.6,0.002,-2.675),[-PI/2,0,0],txConcrete(64,32,{base:'#3a3c3e',g:70}));
  /* the leaf: wired security glass in a steel frame, hinged at x 2.95 on the control-room side */const leaf=new THREE.Group();leaf.position.set(2.95,0,-2.55);EX.env.add(leaf);EX.doorLeaf=leaf;
  const fr=(w,h,x,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.05),steel);m.position.set(x,y,0);leaf.add(m);EX.envMeshes.push(m);return m;};fr(0.7,0.1,-0.36,2.02);fr(0.7,0.22,-0.36,0.11);fr(0.08,2.06,-0.04,1.03);fr(0.08,2.06,-0.68,1.03);fr(0.6,0.06,-0.36,0.6);
  const gc=mkCanvas(128,320);EX.doorGlassCanvas=gc;const gx=gc.getContext('2d');gx.fillStyle='rgba(150,180,175,0.22)';gx.fillRect(0,0,128,320);gx.strokeStyle='rgba(40,45,45,0.55)';gx.lineWidth=1;for(let i=-320;i<448;i+=14){gx.beginPath();gx.moveTo(i,0);gx.lineTo(i+320,320);gx.stroke();gx.beginPath();gx.moveTo(i+320,0);gx.lineTo(i,320);gx.stroke();}
  const gpr=mkCanvas(128,320);gpr.getContext('2d').drawImage(gc,0,0);const gt=exTex(gc);const gm=new THREE.Mesh(new THREE.PlaneGeometry(0.56,1.32),new THREE.MeshBasicMaterial({map:gt,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));gm.position.set(-0.36,1.29,0);leaf.add(gm);gm.userData.v2='doorGlass';EX.v2hits.push(gm);
  EX.doorGlassS={mesh:gm,c:gc,x:gx,tex:gt,wM:0.56,hM:1.32,vertical:true,dirty:false,pristine:gpr};EX.surfs.set(gm,EX.doorGlassS);
  /* lock body + chunky lever handle on the cell side */const lock=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.2,0.03),dark);lock.position.set(-0.66,1.0,0.04);leaf.add(lock);lock.userData.v2='lock';EX.v2hits.push(lock);
  const hdl=new THREE.Group();const hb=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.03,0.03),exLam({color:0x8a8e90}));hb.position.set(0.07,0,0.035);const hr=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.04,8),exLam({color:0x8a8e90}));hr.rotation.x=PI/2;hdl.add(hb,hr);hdl.position.set(-0.66,1.0,0.05);leaf.add(hdl);for(const m of[hb,hr]){m.userData.v2='handle';m.userData.use='handle';EX.v2hits.push(m);}EX.handle=hdl;EX.handleMeshes=[hb,hr];
  /* the keypad beside it, under the window */const kp=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.15,0.03),exLam({map:exTex((()=>{const c=mkCanvas(32,48),x=c.getContext('2d');x.fillStyle='#2a2c2e';x.fillRect(0,0,32,48);x.fillStyle='#0a1a10';x.fillRect(4,3,24,8);x.fillStyle='#3a6a3a';x.fillRect(6,5,8,4);for(let r=0;r<4;r++)for(let q=0;q<3;q++){x.fillStyle='#8a8e90';x.fillRect(5+q*8,15+r*8,6,5);}return c;})())}));kp.position.set(2.04,0.86,-2.48);EX.env.add(kp);kp.userData.v2='keypad';kp.userData.use='keypad';EX.v2hits.push(kp);EX.keypad=kp;
  EX.doorBody=exStaticBox(0.74,2.06,0.06,V3(2.6,1.03,-2.55));
  /* the hatch in the cell's left wall (z 1.3..2.3), a dark corridor behind it */const cor=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.0,1.0),new THREE.MeshLambertMaterial({color:0x0c0c0c,side:THREE.BackSide}));cor.position.set(-3.8,1.0,1.8);EX.env.add(cor);
  const hp=new THREE.Mesh(new THREE.BoxGeometry(0.06,2.0,1.0),exLam({map:exTex((()=>{const c=mkCanvas(64,128),x=c.getContext('2d');x.fillStyle='#4e5254';x.fillRect(0,0,64,128);for(let i=0;i<6;i++){x.fillStyle='rgba(0,0,0,0.25)';x.fillRect(0,i*22+8,64,2);}for(let i=0;i<14;i++){x.fillStyle='rgba(90,60,30,0.35)';x.fillRect(xr()*64,xr()*128,3,6+xr()*10);}x.fillStyle='rgba(220,200,60,0.6)';x.font='bold 12px monospace';x.fillText('INTAKE',10,64);return c;})())}));hp.position.set(-2.99,1.0,1.8);EX.env.add(hp);EX.envMeshes.push(hp);EX.hatchPlate=hp;
  for(const z of[1.25,2.35]){const r=new THREE.Mesh(new THREE.BoxGeometry(0.08,2.6,0.1),yel);r.position.set(-2.96,1.3,z);EX.env.add(r);}const lint=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.12,1.2),yel);lint.position.set(-2.96,2.06,1.8);EX.env.add(lint);
  EX.hatchLamp=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),new THREE.MeshBasicMaterial({color:0x3a0a00}));EX.hatchLamp.position.set(-2.93,2.2,1.8);EX.env.add(EX.hatchLamp);
  /* kneel marks painted on the floor (and on its pristine copy, so a new session keeps them) */const fs=EX.surfs.get(EX.floor);for(const cx of[fs.x,fs.pristine.getContext('2d')]){for(let i=0;i<3;i++){const [mx,mz]=MARKS[i];const u=(mx+3)/6,v=1-((mz-1)+3.5)/7;const px=u*512,py=(1-v)*512;cx.strokeStyle='rgba(200,170,40,0.7)';cx.lineWidth=3;cx.strokeRect(px-18,py-18,36,36);cx.font='bold 16px monospace';cx.fillStyle='rgba(200,170,40,0.7)';cx.fillText(String(i+1),px-4,py+28);}}fs.dirty=true;
  /* the control room console: NEXT SUBJECT under a flip-up cover, the cell-lights switch, labels */const lbl=(t,w)=>{const c=mkCanvas(128,24),x=c.getContext('2d');x.fillStyle='#d8d4c0';x.fillRect(0,0,128,24);x.fillStyle='#111';x.font='bold 13px monospace';x.textAlign='center';x.fillText(t,64,17);return exLam({map:exTex(c)});};
  const bb=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.2),dark);bb.position.set(1.55,0.965,-3.02);EX.env.add(bb);const btn=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.05,14),exLam({color:0xc01818,emissive:0x300000}));btn.position.set(1.55,1.005,-3.02);EX.env.add(btn);btn.userData.v2='button';btn.userData.use='button';EX.v2hits.push(btn);EX.button=btn;
  const cov=new THREE.Group();cov.position.set(1.55,0.99,-2.92);const cm=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.09,0.19),new THREE.MeshLambertMaterial({color:0xffd23a,transparent:true,opacity:0.6}));cm.position.set(0,0.0,-0.095);cov.add(cm);EX.env.add(cov);cm.userData.v2='cover';cm.userData.use='cover';EX.v2hits.push(cm);EX.coverG=cov;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.26,0.05),lbl('NEXT SUBJECT'));pl.rotation.x=-PI/2;pl.position.set(1.55,0.943,-2.88);EX.env.add(pl);
  const sw=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.04,0.12),dark);sw.position.set(-1.95,0.96,-3.0);EX.env.add(sw);const rk=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.03,0.07),exLam({color:0xd8d4c0}));rk.position.set(-1.95,0.99,-3.0);EX.env.add(rk);rk.userData.use='lights';sw.userData.use='lights';EX.rocker=rk;EX.useMeshes=[EX.handleMeshes[0],EX.handleMeshes[1],kp,cm,btn,sw,rk];
  const pl2=new THREE.Mesh(new THREE.PlaneGeometry(0.26,0.05),lbl('CELL LIGHTS'));pl2.rotation.x=-PI/2;pl2.position.set(-1.95,0.943,-2.88);EX.env.add(pl2);
  /* the green glow from the console monitors that bleeds into the cell */EX.glow=new THREE.PointLight(0x39d16a,0.5,7,1.5);EX.glow.position.set(0,1.25,-2.75);EX.scene.add(EX.glow);
  EX.hemi=EX.scene.children.find(o=>o.isHemisphereLight);EX.fillL=EX.scene.children.find(o=>o.isPointLight&&o!==EX.tubeLight&&o.position.z>2);}

/* ---------- session state */
function exV2Reset(){EX.P={x:0,z:3.3,vx:0,vz:0,ph:0,bob:0,lastStep:0};EX.subN=0;EX.door={locked:true,open:0,tgt:0,hits:0,handle:true,cracks:0};EX.hatch={y:0,tgt:0,t:0};EX.cover={open:false,a:0};EX.lights=true;EX.banner=null;EX.alarmT=0;EX.alarmDone=false;EX.menu=null;EX.notes=null;EX.prompt='';EX.pending=null;EX.btnCool=0;EX.bodies=0;EX.entered=false;
  if(EX.handle&&!EX.handle.parent)EX.doorLeaf.add(EX.handle);if(EX.handle)EX.handle.visible=true;EX.doorLeaf.rotation.y=0;if(EX.doorBody&&!EX.doorBody.world)EX.world.addBody(EX.doorBody);if(EX.doorOpenBody&&EX.doorOpenBody.world)EX.world.removeBody(EX.doorOpenBody);
  EX.hatchPlate.position.y=1.0;EX.coverG.rotation.x=0;if(EX.frozenGibs){for(const g of EX.frozenGibs)EX.scene.remove(g.m);EX.frozenGibs.length=0;}exSetLights(true);EX.rocker.rotation.x=0;}
function exSetLights(on){EX.lights=on;EX.tube.material.color.setScalar(on?1:0.12);if(EX.fillL)EX.fillL.intensity=on?2.6:0;if(EX.hemi)EX.hemi.intensity=on?0.3:0.06;EX.glow.intensity=on?0.5:3.2;if(EX.rocker)EX.rocker.rotation.x=on?0:0.5;}

/* ---------- subjects */
const SKINS=[['#e8c4a8',[232,196,168]],['#d8a88b',[216,168,139]],['#b4856a',[180,133,106]],['#8a5a3e',[138,90,62]],['#5e3a28',[94,58,40]],['#c99878',[201,152,120]]];
const HAIRS=['#1a1410','#2a1c14','#5a3a24','#8a6a4a','#a3a39e','#c8b080'];
function exSubjectLook(first){if(first)return{num:'0417',temper:'defiant',charge:CHARGES[0],o:{cloth:{base:'#cf5c1a',rgb:[207,92,26]},skin:'#b4856a',skinRGB:[180,133,106],face:{skin:'#b4856a',sr:180,sg:133,sb:106,stubbleHead:true,stubble:true,tear:true,scar:true,brow:'#1a1410',eye:'#2a1a10',lip:'#6a3a32'},shoe:0xb24e14,build:1}};
  const sk=SKINS[(xr()*SKINS.length)|0],hc=HAIRS[(xr()*HAIRS.length)|0];const rgb=sk[1];const face={skin:sk[0],sr:rgb[0],sg:rgb[1],sb:rgb[2],brow:'#1a1410',eye:xr()<0.2?'#3a5a6a':'#2a1a10',lip:'#6a3a32'};
  const hs=['shaved','buzz','balding','pony'][(xr()*4)|0];if(hs==='shaved')face.stubbleHead=true;else if(hs==='buzz'){face.hair=hc;face.hairLine=0.3;face.stubbleHead=true;}else if(hs==='balding'){face.hair=hc;face.hairLine=0.36;face.bald=true;}else{face.hair=hc;face.hairLine=0.38;}
  const fh=xr();if(fh<0.25)face.beard=hc;else if(fh<0.45)face.mous=hc;else if(fh<0.75)face.stubble=true;if(xr()<0.3)face.tear=true;if(xr()<0.3)face.scar=true;
  let n;do{n=String(1000+((xr()*8999)|0));}while(n==='0417');const temps=Object.keys(TEMPER);let tm=temps[(xr()*temps.length)|0];if(EX.lastTemper===tm)tm=temps[(temps.indexOf(tm)+1)%temps.length];
  const builds=[0.85,1,1.25];const kn=['LOVEHATE','HOLDFAST','GOODEVIL','WISHLESS'][(xr()*4)|0];
  return{num:n,temper:tm,charge:CHARGES[Math.min(EX.subN,CHARGES.length-1)],o:{cloth:{base:'#cf5c1a',rgb:[207,92,26]},skin:sk[0],skinRGB:rgb,face,shoe:0xb24e14,build:builds[(xr()*3)|0],pony:hs==='pony',neckTat:xr()<0.35,knuckles:xr()<0.35?kn:null}};}
function exMarkFree(m){for(const H of EX.humans){if(H.kind!=='pris'&&!H.rag)continue;const p=H.rag&&H.parts.torso.mesh?H.parts.torso.mesh.getWorldPosition(_pc):H.group.position;if(Math.hypot(p.x-m[0],p.z-m[1])<0.6)return false;}return true;}
function exSpawnSubject(first){const L=exSubjectLook(first);EX.lastTemper=L.temper;const mark=first?MARKS[0]:(MARKS.find(exMarkFree)||[ (xr()-0.5)*2, 2.4]);
  const o=Object.assign({kind:'pris',num:L.num,mode:first?'kneel':'walk',hood:!first},L.o);o.pos=first?V3(mark[0],0,mark[1]):V3(-3.6,0,1.8);o.rotY=first?0:Math.PI/2;
  const H=mkHuman(o);H.num=L.num;H.numWords=L.num.split('').map(d=>DIGW[+d]).join('-');H.charge=L.charge;H.temper=L.temper;H.voice='low';H.f0=TEMPER[L.temper].f0;H.first=first;H.mark=mark;H.lines={};H.hit=false;H.hitAt=-1;H.proceedAt=-1;H.firstShotAt=-1;H.shots0=EX.shots;
  if(first){H.stage='ready';H.pt0=EX.pt;}else{H.stage='enter';H.path=[[-2.5,1.8],[mark[0],mark[1]]];H.wi=0;}
  EX.humans.push(H);EX.pris=H;EX.subN++;return H;}
function exSubjectWalk(H,dt){/* hooded, cuffed, shuffling to his mark, then kneels, then the hood comes off */
  if(H.stage==='enter'){const w=H.path[H.wi];const dx=w[0]-H.group.position.x,dz=w[1]-H.group.position.z,dd=Math.hypot(dx,dz);
    if(dd>0.05){const sp=0.75*dt;H.group.position.x+=dx/dd*Math.min(sp,dd);H.group.position.z+=dz/dd*Math.min(sp,dd);const want=Math.atan2(dx,dz);let r=want-H.group.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));H.group.rotation.y+=r*Math.min(1,dt*6);H.walkAmt=Math.min(0.7,H.walkAmt+dt*4);H.walkPh+=dt*6.5;H.stepT=(H.stepT||0)-dt;if(H.stepT<=0){H.stepT=0.48;EXA.noise({dur:0.07,gain:0.08,type:'lowpass',f:500});EXA.noise({dur:0.05,gain:0.04,type:'bandpass',f:2400,q:3});}}
    else if(H.wi<H.path.length-1)H.wi++;else{H.walkAmt=Math.max(0,H.walkAmt-dt*4);let r=0-H.group.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));H.group.rotation.y+=r*Math.min(1,dt*5);if(Math.abs(r)<0.05&&H.walkAmt<=0.01){H.stage='kneel';H.kt=0;H.Jfrom=cloneJ(H.J);H.bw=0;H.mode='kneel';EXA.noise({dur:0.25,gain:0.2,type:'lowpass',f:300});}}
    if(H.group.position.x>-2.6&&EX.hatch.tgt>0&&H.wi>0)EX.hatch.tgt=0;}
  else if(H.stage==='kneel'){H.kt+=dt;if(H.kt>1.2&&H.hood){for(const m of H.hood)if(m.parent)m.parent.remove(m);H.hood=null;EXA.noise({dur:0.35,gain:0.18,type:'bandpass',f:900,f1:400,q:1});H.headUpT=2.5;}if(H.kt>1.8){H.stage='ready';H.pt0=EX.pt;}}}

/* ---------- player: walking, collision */
function exSolids(){const S=[[-4,-3,-7,5],[3,4,-7,5],[-4,4,4.5,5.5],[-3,2.2,-2.85,-2.5],[2.2,2.26,-2.85,-2.5],[2.94,3.0,-2.85,-2.5],[-4,4,-6.7,-6.2],[-2.15,2.05,-3.29,-2.87]];
  if(EX.door.open<0.15)S.push([2.2,3.0,-2.62,-2.46]);else S.push([2.88,3.0,-2.55-0.8*Math.min(1,EX.door.open),-2.5]);return S;}
function exCollide(P,r){for(let it=0;it<2;it++){for(const b of exSolids()){const cx=clamp(P.x,b[0],b[1]),cz=clamp(P.z,b[2],b[3]);const dx=P.x-cx,dz=P.z-cz,d=Math.hypot(dx,dz);if(d<r){if(d>1e-5){P.x+=dx/d*(r-d);P.z+=dz/d*(r-d);}else{const o=[[P.x-b[0]+r,-1,0],[b[1]-P.x+r,1,0],[P.z-b[2]+r,0,-1],[b[3]-P.z+r,0,1]].sort((a,c)=>a[0]-c[0])[0];P.x+=o[1]*o[0];P.z+=o[2]*o[0];}}}
    for(const c of[[-2.1,1.0,0.35],[2.55,-2.15,0.2]]){const dx=P.x-c[0],dz=P.z-c[1],d=Math.hypot(dx,dz),m=r+c[2];if(d<m&&d>1e-5){P.x+=dx/d*(m-d);P.z+=dz/d*(m-d);}}
    for(const H of EX.humans){if(H.rag||!H.alive)continue;const g=H.group.position;const dx=P.x-g.x,dz=P.z-g.z,d=Math.hypot(dx,dz),m=r+0.26;if(d<m&&d>1e-5){P.x+=dx/d*(m-d);P.z+=dz/d*(m-d);}}}}
function exMove(dt){const P=EX.P;if(!P)return;let f=0,s=0;if(SEAT.at==='desk'&&!EX.menu&&EX.state==='play'){f=(keys.KeyW?1:0)-(keys.KeyS?1:0);s=(keys.KeyD?1:0)-(keys.KeyA?1:0);}
  const y=EX.aimYaw;let tx=-Math.sin(y)*f+Math.cos(y)*s,tz=-Math.cos(y)*f-Math.sin(y)*s;const tl=Math.hypot(tx,tz);if(tl>0){tx=tx/tl*1.4;tz=tz/tl*1.4;}
  const k=1-Math.exp(-dt*8);P.vx=lerp(P.vx,tx,k);P.vz=lerp(P.vz,tz,k);P.x+=P.vx*dt;P.z+=P.vz*dt;exCollide(P,0.22);
  const sp=Math.hypot(P.vx,P.vz);P.ph+=dt*sp*5.6;P.bob=Math.sin(P.ph)*0.028*Math.min(1,sp/1.4);const st=Math.floor(P.ph/Math.PI);if(st!==P.lastStep&&sp>0.3){P.lastStep=st;const lino=P.z<-2.85;EXA.noise({dur:0.07,gain:0.11,type:'lowpass',f:lino?650:420});EXA.noise({dur:0.03,gain:0.05,type:'bandpass',f:lino?3200:1800,q:2});}
  EX.cam.position.set(P.x,1.62+P.bob,P.z);if(!EX.entered&&P.z<-2.9){EX.entered=true;exEnterControl();}}

/* ---------- the door */
function exV2Hit(ob,h,d){const k=ob.userData.v2;
  if(k==='doorGlass'){EX.door.cracks++;EXA.glassTick();EXA.ric();const s=EX.doorGlassS;exPaint(s,h.uv.x,h.uv.y,(x,px,py)=>{x.strokeStyle='rgba(235,245,240,0.85)';x.lineWidth=1;for(let i=0;i<8;i++){const a=xr()*7;let X=px,Y=py;x.beginPath();x.moveTo(X,Y);for(let q=0;q<3;q++){X+=Math.cos(a+(xr()-0.5)*0.6)*(4+xr()*7);Y+=Math.sin(a+(xr()-0.5)*0.6)*(4+xr()*7);x.lineTo(X,Y);}x.stroke();}x.fillStyle='rgba(230,235,230,0.5)';x.beginPath();x.arc(px,py,4,0,7);x.fill();});exEmit(h.point,d.clone().negate(),6,1.4,0.9,1,GLASSC);
    if(EX.door.cracks===2)exSay('PA','THE DOOR IS RATED FOR YOUR WEAPON.',2.6);return;}
  if(k==='handle'||k==='lock'){if(!EX.door.handle){exEmit(h.point,d.clone().negate(),8,1.4,1,1,DUST);EXA.chip();return;}EX.door.hits++;exEmit(h.point,d.clone().negate(),16,3,1.2,1,[1,0.85,0.4]);EXA.ric();EXA.tone({f:2200,f1:900,dur:0.2,type:'square',gain:0.08});
    if(EX.door.hits===1){exSay('PA','DO NOT TAMPER WITH THE DOOR.',2.4);for(const s of EX.sci)if(s.alive&&!s.downed)s.kick.add(V3(0,0.01,-0.04));}
    else exBlowHandle(h.point,d);return;}
  if(k==='keypad'){exEmit(h.point,d.clone().negate(),20,2.5,1.2,1,[0.8,0.9,1]);EXA.tone({f:400,f1:90,dur:0.6,type:'square',gain:0.08});exSay('','[THE KEYPAD SAYS "ACCESS DENIED" IN A DYING VOICE]',2.4);return;}
  if(k==='button'){if(EX.cover.open)exPressNext();else{EXA.chip();exEmit(h.point,d.clone().negate(),6,1.2,1,1,[1,0.9,0.4]);}return;}
  if(k==='cover'){EXA.chip();EX.cover.open=true;exEmit(h.point,d.clone().negate(),6,1.2,1,1,[1,0.9,0.4]);return;}}
function exBlowHandle(p,d){EX.door.handle=false;EX.door.locked=false;EX.handle.visible=false;EXA.shot();EXA.clack(0.1);EXA.rattle();
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.03,0.04),exLam({color:0x8a8e90}));m.position.copy(p);EX.scene.add(m);const b=new CANNON.Body({mass:0.6});b.addShape(new CANNON.Box(new CANNON.Vec3(0.08,0.015,0.02)));b.position.set(p.x,p.y,p.z+0.05);b.collisionFilterGroup=2;b.collisionFilterMask=1;b.velocity.set(d.x*2+0.5,1.5,1.8);b.angularVelocity.set(8,4,12);EX.world.addBody(b);EX.gibs.push({m,b});
  exEmit(p,V3(0,0.3,1),30,3,1.4,1,[1,0.8,0.3]);EX.door.tgt=1;EX.door.popT=0;exSay('','[THE LOCK SHEARS · THE DOOR SWINGS OPEN]',2.2);
  let d0=0.2;for(const s of EX.sci){if(!s.alive||s.downed)continue;s.panic=true;s.screamT=d0;d0+=0.3;}}
function exUpdateDoor(dt){const D=EX.door;if(D.open!==D.tgt){const sp=D.tgt>D.open?(D.open<0.12?3:0.9):1;D.open=D.tgt>D.open?Math.min(D.tgt,D.open+dt*sp):Math.max(D.tgt,D.open-dt*sp);EX.doorLeaf.rotation.y=-1.5*D.open*D.open*(3-2*D.open);if(D.open>0.12&&EX.doorBody.world){EX.world.removeBody(EX.doorBody);if(!EX.doorOpenBody)EX.doorOpenBody=exStaticBox(0.06,2.06,0.78,V3(2.94,1.03,-2.94));else EX.world.addBody(EX.doorOpenBody);}}
  const H=EX.hatch;if(H.y!==H.tgt){const was=H.y;H.y=H.tgt>H.y?Math.min(H.tgt,H.y+dt/1.8):Math.max(H.tgt,H.y-dt/1.6);EX.hatchPlate.position.y=1.0+H.y*2.05;H.t-=dt;if(H.t<=0){H.t=0.12;EXA.noise({dur:0.14,gain:0.12,type:'bandpass',f:180+xr()*80,q:3});EXA.noise({dur:0.08,gain:0.05,type:'highpass',f:2600});}if(was<1&&H.y>=1)EXA.clack(0);if(was>0&&H.y<=0){EXA.tone({f:70,f1:40,dur:0.4,gain:0.4});}}
  EX.hatchLamp.material.color.setHex(H.y>0.01&&Math.floor(EX.st*4)%2?0xff5a10:0x3a0a00);
  EX.cover.a=lerp(EX.cover.a,EX.cover.open?1:0,1-Math.exp(-dt*12));EX.coverG.rotation.x=EX.cover.a*1.9;
  if(EX.pending){EX.pending.t-=dt;if(EX.pending.t<=0){EX.pending=null;exSpawnSubject(false);}}EX.btnCool=Math.max(0,EX.btnCool-dt);}
function exPressNext(){if(EX.btnCool>0||EX.pending||(EX.pris&&EX.pris.alive&&EX.pris.stage!=='ready')){EXA.tap();exSay('','[THE BUTTON CLICKS. NOTHING. PROCESSING.]',1.6);return;}
  EX.btnCool=6;EX.button.position.y=0.99;setTimeout(()=>{if(EX.button)EX.button.position.y=1.005;},180);EXA.clack(0);EXA.tone({f:880,dur:0.15,type:'square',gain:0.05,delay:0.1});EXA.tone({f:660,dur:0.25,type:'square',gain:0.05,delay:0.3});
  EX.hatch.tgt=1;EX.pending={t:1.6};exSay('PA','NEXT SUBJECT.',1.8);for(const s of EX.sci)if(s.alive&&!s.panic&&!s.downed){exSetAct(s,'write');s.actT=3;}}

/* ---------- F: use what you're looking at */
function exUseTarget(){if(!EX.useMeshes)return null;EX.cam.updateMatrixWorld(true);EX.coverG.updateMatrixWorld(true);EX.doorLeaf.updateMatrixWorld(true);const o=EX.cam.getWorldPosition(V3()),d=V3(0,0,-1).applyQuaternion(EX.cam.getWorldQuaternion(new THREE.Quaternion()));EX.ray2.set(o,d);EX.ray2.far=1.9;
  const L=EX.useMeshes.filter(m=>m.visible!==false&&m.parent);for(const s of EX.sci)if(s.clip&&s.clip.parent)L.push(s.clip);const hs=EX.ray2.intersectObjects(L,true);if(!hs.length)return null;let ob=hs[0].object;let k=ob.userData.use;if(!k){for(let q=ob;q;q=q.parent)if(q.userData&&q.userData.clipOf){k='clip';ob=q;break;}}return k?{k,ob}:null;}
function exUseLabel(u){if(!u)return'';const k=u.k;if(k==='handle')return EX.door.locked?'TRY THE HANDLE':'';if(k==='keypad')return'ENTER A CODE';if(k==='cover')return EX.cover.open?'CLOSE THE COVER':'FLIP THE COVER';if(k==='button')return EX.cover.open?'PRESS · NEXT SUBJECT':'FLIP THE COVER';if(k==='lights')return EX.lights?'CELL LIGHTS OFF':'CELL LIGHTS ON';if(k==='clip'){const H=u.ob.userData.clipOf;return'READ '+H.name+"'S NOTES";}return'';}
EX.use=()=>{if(!EX.running)return;if(EX.menu){exMenuPick();return;}if(EX.state!=='play')return;const u=exUseTarget();if(!u){EXA.tap();return;}const k=u.k;
  if(k==='handle'){if(EX.door.locked){EXA.rattle();exSay('','[LOCKED. SOLID. IT DOES NOT CARE ABOUT YOU.]',2);}return;}
  if(k==='keypad'){for(let i=0;i<4;i++)EXA.tone({f:1200,dur:0.06,type:'square',gain:0.05,delay:i*0.14});EXA.tone({f:220,dur:0.4,type:'square',gain:0.07,delay:0.65});exSay('','[ACCESS DENIED · OPERATORS MAY NOT ENTER THE OBSERVATION ROOM]',2.6);return;}
  if(k==='cover'||(k==='button'&&!EX.cover.open)){EX.cover.open=!EX.cover.open;EXA.clack(0);return;}
  if(k==='button'){exPressNext();return;}
  if(k==='lights'){exSetLights(!EX.lights);EXA.clack(0);EXA.tone({f:120,f1:60,dur:0.15,gain:0.2});return;}
  if(k==='clip'){exReadNotes(u.ob.userData.clipOf);return;}};
function exReadNotes(H){const S=EX.stats||{};const sub=EX.lastDone||EX.pris;const hes=S.hes!==undefined?S.hes:Math.max(0,(EX.pt-(sub&&sub.proceedAt>0?sub.proceedAt:EX.pt))|0);const rounds=EX.shots;
  const L={'DR VOSS':['OBSERVATION LOG · CELL 04','Operator hesitated '+hes+' s.',rounds+' rounds discharged.','Hands '+(rounds>20?'unsteady.':'steady.'),'Recommend: retain.'],'DR HALE':['SUBJECT '+(sub?sub.num:'—')+' · '+(sub?sub.charge.replace('.',''):''),'Subject compliance: n/a.','Operator compliance: '+(EX.glassHits||EX.door.hits?'questionable.':'exemplary.'),'Note to self: ask for the door to be','rated for "operators who shoot doors".'],'DR AMES':['NOTES (AMES)','Operator seems nice.','Operator has shot '+rounds+' times.','[a small drawing of you.','it is not flattering.]']}[H.name]||['...'];
  EX.notes={who:H.name,lines:L,t:6};EX.hudDirty=true;EXA.noise({dur:0.3,gain:0.12,type:'highpass',f:2500,f1:4000});}

/* ---------- no game over: completions, the alarm, the control room */
function exSubjectDone(H){if(H.done)return;H.done=true;EX.lastDone=H;EX.stats={hes:H.firstShotAt>=0&&H.proceedAt>=0?Math.max(0,(H.firstShotAt-H.proceedAt)|0):0};
  EX.banner={t:4.2,a:'TEST COMPLETE.',b:'THANK YOU FOR YOUR COMPLIANCE.',col:'#f2f2ee'};if(!EXT.play('pa_complete'))exSay('PA','TEST COMPLETE. THANK YOU FOR YOUR COMPLIANCE.',4);else EX.cap={who:'PA',text:'TEST COMPLETE. THANK YOU FOR YOUR COMPLIANCE.',t:4};
  for(const s of EX.sci)if(s.alive&&!s.panic&&!s.downed){exSetAct(s,s.endAct);s.actT=6+xr()*2;}EX.objT=0;EX.hudDirty=true;}
function exAlarm(){if(EX.alarmT>0||EX.alarmDone)return;EX.alarmT=10;EXA.klaxon(9.6);VO.cancel();EX.cap={who:'',text:'',t:0};EX.banner={t:10,a:'SUBJECT NON-COMPLIANT',b:'OPERATOR FLAGGED · SECURITY NOTIFIED',col:'#fff',alarm:true};EX.hudDirty=true;}
function exUpdateAlarm(dt){if(EX.alarmT>0){EX.alarmT-=dt;if(EX.alarmT<=0){EX.alarmT=0;EX.alarmDone=true;EXA.tone({f:440,f1:60,dur:2.6,type:'square',gain:0.08});exSay('','[THE ALARM WINDS DOWN. THE ROOM HUMS.]',3);}}
  if(EX.banner){EX.banner.t-=dt;EX.hudDirty=true;if(EX.banner.t<=0)EX.banner=null;}if(EX.notes){EX.notes.t-=dt;if(EX.notes.t<=0){EX.notes=null;EX.hudDirty=true;}}}
function exEnterControl(){for(const s of EX.sci)if(s.alive&&!s.downed){s.panic=true;s.ran=true;s.cower=true;s.begT=0.6+xr()*1.5;}}
function exRagCap(){const R=EX.humans.filter(H=>H.rag&&!H.frozen);while(R.length>6){R.sort((a,b)=>a.ragAt-b.ragAt);const H=R.shift();H.frozen=true;for(const k in H.cons)EX.world.removeConstraint(H.cons[k]);H.cons={};for(const n in H.parts){const p=H.parts[n];if(p.body){EX.world.removeBody(p.body);p.body=null;}}}
  if(EX.gibs.length>48){for(const g of EX.gibs.splice(0,EX.gibs.length-48)){if(g.b.world)EX.world.removeBody(g.b);g.frozen=true;EX.frozenGibs=(EX.frozenGibs||[]);EX.frozenGibs.push(g);}}}

/* ---------- pause menu */
const EX_MENU=['RESUME','NEW SESSION','QUIT TO DESKTOP'];
function exMenuToggle(){if(EX.state!=='play')return;EX.menu=EX.menu?null:{i:0};EX.ads=false;EX.hudDirty=true;EXA.tap();}
function exMenuMove(d){if(!EX.menu)return;EX.menu.i=(EX.menu.i+d+EX_MENU.length)%EX_MENU.length;EX.hudDirty=true;EXA.tap();}
function exMenuPick(){if(!EX.menu)return;const i=EX.menu.i;EX.menu=null;EX.hudDirty=true;EXA.clack(0);if(i===1)exGo('intro');else if(i===2){exStop();}}

/* ---------- HUD additions */
function exDrawHUDv2(x,W,H){
  if(EX.prompt&&!EX.menu){x.font='bold 13px "Courier New",monospace';x.textAlign='center';const t='[F] '+EX.prompt;const w=x.measureText(t).width+16;x.fillStyle='rgba(232,226,200,0.92)';x.fillRect(W/2-w/2,H/2+22,w,20);x.fillStyle='#111';x.fillText(t,W/2,H/2+37);}
  if(EX.banner){const B=EX.banner;let a=Math.min(1,B.t/0.8,(B.alarm?10:4.2)-B.t+0.001);a=clamp(a*2,0,1);x.textAlign='center';if(B.alarm){const on=Math.floor(EX.st*3)%2===0;x.fillStyle=on?'rgba(160,0,0,0.85)':'rgba(60,0,0,0.85)';x.fillRect(0,H/2-46,W,92);x.fillStyle='#fff';x.font='bold 40px Impact,"Arial Black",sans-serif';x.fillText(B.a,W/2,H/2+4);x.font='bold 15px "Courier New",monospace';x.fillText(B.b,W/2,H/2+32);}
    else{x.globalAlpha=a;x.fillStyle='rgba(0,0,0,0.6)';x.fillRect(0,H*0.3-40,W,86);x.font='bold 36px "Courier New",monospace';x.fillStyle=B.col;x.fillText(B.a,W/2,H*0.3);x.font='16px "Courier New",monospace';x.fillStyle='#bdbdb5';x.fillText(B.b,W/2,H*0.3+30);x.globalAlpha=1;}}
  if(EX.notes){const N=EX.notes;x.save();x.translate(W/2,H/2-10);x.rotate(-0.03);x.fillStyle='#7a5532';x.fillRect(-150,-120,300,230);x.fillStyle='#efeee4';x.fillRect(-138,-104,276,206);x.fillStyle='#8a8e90';x.fillRect(-30,-128,60,18);x.textAlign='left';x.font='bold 13px "Courier New",monospace';x.fillStyle='#1a2a6a';x.fillText(N.lines[0],-126,-80);x.font='14px "Comic Sans MS","Segoe Print",cursive';N.lines.slice(1).forEach((l,i)=>{x.fillStyle='#223';x.fillText(l,-126,-50+i*26);});x.font='bold 10px "Courier New",monospace';x.fillStyle='#8a2a2a';x.fillText(N.who,40,94);x.restore();}
  if(EX.menu){x.fillStyle='rgba(0,0,0,0.72)';x.fillRect(0,0,W,H);x.textAlign='center';x.font='bold 40px Impact,"Arial Black",sans-serif';x.fillStyle='#e8e2c8';x.fillText('PAUSED',W/2,150);EX_MENU.forEach((m,i)=>{const sel=i===EX.menu.i;x.font='bold 22px "Courier New",monospace';x.fillStyle=sel?'#111':'#b8b2a0';if(sel){x.fillStyle='#e8e2c8';x.fillRect(W/2-150,206+i*48,300,34);x.fillStyle='#111';}x.fillText(m,W/2,230+i*48);});
    x.font='12px "Courier New",monospace';x.fillStyle='#8a847a';x.fillText('W/S or ↑↓ · F / ENTER / LMB = SELECT · TAB = RESUME',W/2,380);}}
