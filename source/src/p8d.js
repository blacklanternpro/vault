
/* ============================================================ v5 · 1 — SIT DOWN AND WATCH TV
   p8d — the couch seat (SEATS.couch), the remote (a real object on the couch arm), TV channels (CH 7 is ADS ALL NIGHT;
   the rest are snow until the rest of Phase 2), the TV's own speaker bus (boxy, panned from the TV's spot in the room),
   the room light the picture throws, the on-screen display (channel banner, volume, mute, sleep timer) and HUD captions.
   The ad reel itself is a list of segments: each has a duration, a draw(x,W,H,t) and timed cues. The broadcast clock
   always runs (live TV), so switching back to CH 7 drops you mid-ad. */

/* ---------- the hi-res program canvas (854×480 desktop; the phone tier calls tvhInit(640,360)) */
const TVH={W:854,H:480,cv:null,x:null,tex:null};
function tvhInit(w,h){TVH.W=w;TVH.H=h;TVH.cv=mkCanvas(w,h);TVH.x=TVH.cv.getContext('2d');const old=TVH.tex;TVH.tex=new THREE.CanvasTexture(TVH.cv);TVH.tex.colorSpace=THREE.SRGBColorSpace;TVH.tex.generateMipmaps=false;TVH.tex.minFilter=THREE.LinearFilter;TVH.tex.magFilter=THREE.LinearFilter;
  TVH.x.fillStyle='#000';TVH.x.fillRect(0,0,w,h);if(old){if(TV.picture&&TV.picture.material.emissiveMap===old){TV.picture.material.emissiveMap=TVH.tex;TV.picture.material.needsUpdate=true;}old.dispose();}}
tvhInit(854,480);

/* ---------- channels */
Object.assign(TV,{ch:7,vol:0.6,mute:false,sleep:0,sleepSet:0,src:'snow',drawn:0,osd:{banner:3,vol:0,sleep:0},spoke:false});
const TV_VOLS=[0.15,0.35,0.6,0.85,1];
const CHANNELS={7:{name:'ADS ALL NIGHT',reel:true}};/* 1–9; the others are snow until the thrash / news / sitcom channels land */
function tvChName(c){const C=CHANNELS[c];return C?C.name:'NO SIGNAL';}
function tvOSD(k,d){TV.osd[k]=d||(k==='banner'?3:2.2);}
function tvChannel(v,rel){const was=TV.ch;TV.ch=rel?((TV.ch-1+v+90)%9)+1:clamp(v|0,1,9);tvOSD('banner');if(TV.ch!==was){tvCut();TVA.noise({dur:0.12,gain:0.12,type:'bandpass',f:2600,q:0.6});}}
function tvCut(){/* channel change or power off: kill whatever the old channel had scheduled */TVA.stopAll();TVA.segTr=null;TVREEL.cur=-1;if(TV.spoke){VO.cancel();TV.spoke=false;}TVCAP.t=0;}
function tvButtonZone(h){if(!h||!h.point||!TV.core||!TV.on||TV.state!=='on')return'power';const l=TV.core.mesh.worldToLocal(h.point.clone());return l.z<-0.3?'ch':'power';}

/* ---------- the reel engine (WS2 adds the real ads; v5.1 ships the station ident and a stand-by card) */
const TVB={t:0};/* broadcast clock */
const TVREEL={segs:[],total:0,cur:-1,prev:0,lt:0};
function tvReelAdd(seg){seg.cues=seg.cues||[];TVREEL.segs.push(seg);TVREEL.total+=seg.dur;}
function tvReelAt(t){let x=TVREEL.total>0?t%TVREEL.total:0;for(let i=0;i<TVREEL.segs.length;i++){const d=TVREEL.segs[i].dur;if(x<d)return[i,x];x-=d;}return[0,0];}
function tvReelRun(live){if(!TVREEL.segs.length)return;const [i,lt]=tvReelAt(TVB.t);TVREEL.lt=lt;if(!live){TVREEL.cur=-1;return;}const seg=TVREEL.segs[i];
  if(TVREEL.cur!==i){const fresh=TVREEL.cur===-1;TVREEL.cur=i;TVREEL.prev=fresh?lt:-1e-6;TVA.segTr=null;}
  for(const c of seg.cues)if(c.t>TVREEL.prev&&c.t<=lt){try{c.fn(seg);}catch(e){}}TVREEL.prev=lt;}
function tvReelDraw(x,W,H){if(!TVREEL.segs.length){x.fillStyle='#000';x.fillRect(0,0,W,H);return;}const [i,lt]=tvReelAt(TVB.t);const seg=TVREEL.segs[i];x.save();seg.draw(x,W,H,lt,seg);x.restore();}

/* ---------- TV audio: a speaker-sim bus of its own, inheriting EXA's synth voices */
const TVA=Object.assign(Object.create(EXA),{ready:false,c:null,in:null,bus:null,tracks:[],humG:null,pn:null,hiss:null,hissF:null,segTr:null,
  init(){if(this.ready||!S.ctx)return;const c=S.ctx;this.c=c;this.bus=c.createGain();this.bus.gain.value=0;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=170;const pk=c.createBiquadFilter();pk.type='peaking';pk.frequency.value=1700;pk.Q.value=0.9;pk.gain.value=5;
    const ws=c.createWaveShaper();const n=1024,cur=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cur[i]=Math.tanh(x*1.4)/Math.tanh(1.4);}ws.curve=cur;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6400;
    this.bus.connect(hp);hp.connect(pk);pk.connect(ws);ws.connect(lp);if(c.createStereoPanner){this.pn=c.createStereoPanner();lp.connect(this.pn);this.pn.connect(S.master);}else lp.connect(S.master);
    this.in=c.createGain();this.in.gain.value=0.85;this.in.connect(this.bus);
    const hs=c.createBufferSource();hs.buffer=S.noiseBuf;hs.loop=true;const hf=c.createBiquadFilter();hf.type='bandpass';hf.frequency.value=3200;hf.Q.value=0.35;const hg=c.createGain();hg.gain.value=0;hs.connect(hf);hf.connect(hg);hg.connect(this.in);hs.start();this.hiss=hg;this.hissF=hf;this.ready=true;},
  out(){if(!this.ready)return null;if(!this.segTr)this.segTr=this.track();return this.segTr;},
  hissLevel(g,f){if(!this.ready)return;this.hiss.gain.setTargetAtTime(g,this.t,0.05);this.hissF.frequency.setTargetAtTime(f,this.t,0.05);},
  pan(pos){if(!this.pn||!pos)return;_tvq.copy(pos);camera.worldToLocal(_tvq);const l=Math.hypot(_tvq.x,_tvq.z)||1;this.pn.pan.setTargetAtTime(clamp(_tvq.x/l,-1,1)*0.75,this.t,0.06);}});
const _tvp=V3(),_tvq=V3();

/* ---------- captions (HUD, only while you're on the couch) */
const TVCAP={who:'',text:'',t:0,el:null,w:null,x:null,shown:''};
function tvSay(who,text,dur,voice,o){TVCAP.who=who||'';TVCAP.text=text;TVCAP.t=dur||Math.max(2.2,text.length*0.07);if(!voice)return;if(VO.speak(text,voice,o)){TV.spoke=true;return;}TVA.babble(voice==='tvm'?118:205,text.length,'');}
function tvCaptions(dt){if(TVCAP.t>0)TVCAP.t-=dt;if(!TVCAP.el){const el=document.getElementById('cap');if(!el)return;TVCAP.el=el;TVCAP.w=document.createElement('b');TVCAP.x=document.createElement('span');el.appendChild(TVCAP.w);el.appendChild(TVCAP.x);}
  const playing=TV.glass&&TV.state==='on';let who='',txt='';if(SEAT.at==='couch'&&playing){if(!CHANNELS[TV.ch]){txt='[STATIC HISS · CH '+TV.ch+' · NO SIGNAL]';}else if(TVCAP.t>0){who=TVCAP.who;txt=TVCAP.text;}if(TV.mute&&txt)txt+='  [MUTED]';}
  const key=who+'|'+txt;if(key===TVCAP.shown)return;TVCAP.shown=key;TVCAP.w.textContent=who?who+':':'';TVCAP.x.textContent=txt;TVCAP.el.style.display=txt?'block':'none';}

/* ---------- picture: rate, visibility, OSD, room light */
function tvTick(dt){const hi=!!CHANNELS[TV.ch];const src=hi?'hi':'snow';const pm=TV.picture.material;if(src!==TV.src||pm.emissiveMap!==(hi?TVH.tex:TVS.tex)){TV.src=src;pm.emissiveMap=hi?TVH.tex:TVS.tex;pm.needsUpdate=true;}
  const full=SEAT.at==='couch';TV.acc+=dt;if(!full&&TV.acc<1/24)return;TV.acc=0;
  if(!full){/* only redraw/upload while the screen can be seen */_pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_frus.setFromProjectionMatrix(_pv);if(!_frus.intersectsObject(TV.picture))return;}
  if(hi){tvReelDraw(TVH.x,TVH.W,TVH.H);tvDrawOSD(TVH.x,TVH.W,TVH.H);TVH.tex.needsUpdate=true;}else{tvDrawSnow();tvDrawOSD(TVS.ctx,320,180);TVS.tex.needsUpdate=true;}TV.drawn++;}
function tvDrawOSD(x,W,H){const k=H/180;x.save();x.textBaseline='alphabetic';const g='#6dff6d';const sh=(t,px,py)=>{x.fillStyle='rgba(0,0,0,0.6)';x.fillText(t,px+1.5*k,py+1.5*k);x.fillStyle=g;x.fillText(t,px,py);};
  if(TV.osd.banner>0){x.globalAlpha=Math.min(1,TV.osd.banner*2);x.font=`bold ${Math.round(30*k)}px monospace`;sh(String(TV.ch),W-48*k,36*k);x.font=`bold ${Math.round(9*k)}px monospace`;const nm='CH '+TV.ch+' · '+tvChName(TV.ch);x.fillStyle='rgba(0,0,0,0.55)';x.fillRect(10*k,12*k,x.measureText(nm).width+12*k,15*k);x.fillStyle=g;x.fillText(nm,16*k,23*k);x.globalAlpha=1;}
  if(TV.osd.vol>0||TV.mute){x.globalAlpha=TV.mute?1:Math.min(1,TV.osd.vol*2);x.font=`bold ${Math.round(9*k)}px monospace`;const bx=W/2-80*k,by=H-24*k;sh(TV.mute?'MUTE':'VOLUME',bx,by-4*k);if(!TV.mute)for(let i=0;i<20;i++){x.fillStyle=i<Math.round(TV.vol*20)?g:'rgba(40,90,40,0.6)';x.fillRect(bx+i*8*k,by,6*k,7*k);}x.globalAlpha=1;}
  if(TV.osd.sleep>0){x.font=`bold ${Math.round(9*k)}px monospace`;sh(TV.sleepSet?'SLEEP '+TV.sleepSet:'SLEEP OFF',W-82*k,H-12*k);}
  else if(TV.sleep>0&&TV.sleep<60){x.font=`bold ${Math.round(9*k)}px monospace`;if(Math.floor(now*2)%2)sh('SLEEP 1',W-62*k,H-12*k);}
  x.restore();}
const TVL={light:null,cv:null,x:null,t:0,col:new THREE.Color(),tgt:new THREE.Color(),i:0,ti:0};
function tvLight(dt,playing){if(!TVL.light)return;TVL.t-=dt;if(playing&&TVL.t<=0){TVL.t=0.1;const srcC=TV.src==='hi'?TVH.cv:TVS.cv;try{TVL.x.drawImage(srcC,0,0,4,3);const d=TVL.x.getImageData(0,0,4,3).data;let r=0,g=0,b=0;for(let i=0;i<48;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];}r/=12*255;g/=12*255;b/=12*255;const lum=0.3*r+0.59*g+0.11*b;TVL.ti=0.4+lum*3.2;const m=Math.max(r,g,b,0.05);TVL.tgt.setRGB(r/m,g/m,b/m);}catch(e){TVL.ti=1;TVL.tgt.setRGB(0.7,0.8,1);}}
  if(!playing)TVL.ti=0;const a=1-Math.exp(-dt*14);TVL.i=lerp(TVL.i,TVL.ti,a);TVL.col.lerp(TVL.tgt,a);TVL.light.intensity=TVL.i*(TV.crack?0.7:1);TVL.light.color.copy(TVL.col);}
function tvAudio(dt){TVB.t+=dt;for(const k in TV.osd)TV.osd[k]=Math.max(0,TV.osd[k]-dt);
  if(TV.sleep>0){TV.sleep-=dt;if(TV.sleep<=0){TV.sleep=0;TV.sleepSet=0;if(TV.on){TV.on=false;tvCut();HUD.msg('[SLEEP TIMER. THE TV GAVE UP BEFORE YOU DID.]',2.2);}}}
  const playing=!!(TV.core&&TV.glass&&TV.state==='on');const live=playing&&!!CHANNELS[TV.ch];if(!live&&(TVA.segTr||TVREEL.cur!==-1))tvCut();tvReelRun(live);
  if(!TVA.ready&&S.ctx)TVA.init();
  if(TVA.ready){const pos=TV.core?TV.core.mesh.getWorldPosition(_tvp):null;const g=playing&&!TV.mute?TV.vol*(SEAT.at==='couch'?0.9:Math.min(1,S.dist(pos)*1.5)):0;TVA.level(g);TVA.hissLevel(playing&&!CHANNELS[TV.ch]?(TV.crack?0.045:0.06):0,TV.crack?1800:3200);TVA.pan(pos);}
  tvLight(dt,playing);tvCaptions(dt);updateCouchVM(dt);}

/* ---------- the couch seat */
const COUCH={seats:[],cur:null,bd:V3(0,0,1),remote:null,popped:false,door:null,vm:null,vmLed:null,led:0,armL:null};
COUCH.use=(h)=>{const e=h&&h.ent;if(e&&e!==LIVING.sofa&&!couchCushionOn(e)){HUD.msg('[A CUSHION ON THE FLOOR IS NOT A SEAT]',1.2);return;}sitDown('couch');};
COUCH.useLabel=(h)=>{const e=h&&h.ent;if(e&&e!==LIVING.sofa&&!couchCushionOn(e))return null;return'SIT DOWN · WATCH TV';};
function couchCushionOn(e){const s=COUCH.seats.find(s=>s.c===e);if(s)return couchSeatOK(s);if(e===LIVING.throwC)return e.alive&&e.mesh.getWorldPosition(_tvp).distanceTo(LIVING.sofa.mesh.getWorldPosition(_tvq))<0.95;return !!(LIVING.backC&&LIVING.backC.includes(e)&&e.alive);}
function couchSeatOK(s){if(!s.c.alive)return false;const b=LIVING.sofa;b.mesh.updateMatrixWorld(true);const home=b.mesh.localToWorld(_tvq.copy(s.l));return s.c.mesh.getWorldPosition(_tvp).distanceTo(home)<0.26;}
function tvCentre(){return TV.glassE&&TV.glassE.alive?TV.glassE.mesh.getWorldPosition(V3()):TV.core.mesh.getWorldPosition(V3());}
function couchWhy(fresh){const b=LIVING.sofa;if(!b||!b.alive)return'[THERE IS NO COUCH. THERE IS ONLY FLOOR.]';const q=b.mesh.getWorldQuaternion(new THREE.Quaternion());if(V3(0,1,0).applyQuaternion(q).y<0.8)return'[THE COUCH IS ON ITS BACK. SO ARE YOUR STANDARDS.]';
  if(fresh){COUCH.cur=null;const ok=COUCH.seats.filter(couchSeatOK);if(!ok.length)return'[NO CUSHIONS. JUST SPRINGS AND REGRET.]';const r=COUCH.remote;const rp=r&&r.alive?r.mesh.getWorldPosition(V3()):null;ok.sort((a,c)=>rp?b.mesh.localToWorld(a.l.clone()).distanceTo(rp)-b.mesh.localToWorld(c.l.clone()).distanceTo(rp):0);COUCH.cur=ok[0];}
  else if(!COUCH.cur||!couchSeatOK(COUCH.cur))return'[YOUR CUSHION LEFT WITHOUT YOU]';
  if(!TV.core||!TV.glass||TV.dead||!TV.core.alive)return'[NOTHING ON. NOTHING EVER ON.]';if(!TV.cord||!TV.cord.plugged||TV.cord.cut)return'[THE TV IS UNPLUGGED. EVEN IT GAVE UP.]';if(!power)return'[NO POWER. JUST YOU AND A DARK RECTANGLE.]';
  const f=COUCH.bd.clone().negate().applyQuaternion(q);f.y=0;const tc=tvCentre();const eye=b.mesh.localToWorld(COUCH.cur.l.clone());const d=tc.sub(eye);d.y=0;if(f.lengthSq()>1e-6&&d.lengthSq()>1e-6&&f.normalize().dot(d.normalize())<Math.cos(1.4))return'[THE COUCH IS FACING THE WRONG WAY. SO IS YOUR LIFE.]';return null;}
function couchTarget(){const b=LIVING.sofa;b.mesh.updateMatrixWorld(true);const s=COUCH.cur;if(!s)return;const l=s.l.clone().addScaledVector(COUCH.bd,0.07);l.y=1.12;SEAT.eye.copy(b.mesh.localToWorld(l));const st=s.l.clone().addScaledVector(COUCH.bd,-0.8);st.y=0;SEAT.stand.copy(b.mesh.localToWorld(st));
  const tc=tvCentre();const d=tc.sub(SEAT.eye);SEAT.yaw=Math.atan2(-d.x,-d.z);SEAT.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));SEAT.n.set(-d.x,0,-d.z).normalize();}
SEATS.couch={name:'couch',
  can(){return couchWhy(true);},keep(){return couchWhy(false);},target(){couchTarget();},
  view(){return{yaw:SEAT.yaw+SEAT.ly,pitch:SEAT.pitch+SEAT.lp+Math.sin(now*1.1)*0.004,fov:58};},
  hint:'ON THE COUCH · MOUSE = LOOK AROUND · WHEEL / ↑↓ = CHANNEL · 1-9 = CHANNEL · 0 = POWER · V = VOLUME · M = MUTE · T = SLEEP TIMER · E = STAND UP',
  onSit(){S.noise({dur:0.35,gain:0.3,type:'lowpass',f:380,pos:SEAT.eye});S.thud(SEAT.eye,0.35);const ok=remoteOK();if(!TV.on&&ok){TV.on=true;tvOSD('banner');S.click(SEAT.eye,2400);COUCH.led=0.15;HUD.msg('[YOU SINK INTO THE COUCH. CLICK.]',1.6);}
    else if(!ok)HUD.msg(TV.on?'[NO REMOTE. YOU ARE AT THE MERCY OF CH '+TV.ch+'.]':'[THE TV IS OFF AND THE REMOTE IS... SOMEWHERE]',2);else{tvOSD('banner');HUD.msg('[YOU SINK INTO THE COUCH]',1.4);}},
  onStand(){if(TV.spoke){VO.cancel();TV.spoke=false;}S.noise({dur:0.25,gain:0.2,type:'lowpass',f:420,pos:SEAT.eye});},
  look(dx,dy){const s=0.0019;SEAT.ly=clamp(SEAT.ly-dx*s,-1.22,1.22);SEAT.lp=clamp(SEAT.lp-dy*s,-0.6,0.8);},
  down(b){},up(b){},
  wheel(d){remoteCmd(d>0?'down':'up');},
  key(c){if(c==='ArrowUp'||c==='ArrowRight'||c==='PageUp')remoteCmd('up');else if(c==='ArrowDown'||c==='ArrowLeft'||c==='PageDown')remoteCmd('down');else if(c==='Digit0'||c==='Numpad0')remoteCmd('power');
    else if(/^(Digit|Numpad)[1-9]$/.test(c))remoteCmd('num',parseInt(c.slice(-1)));else if(c==='KeyV')remoteCmd('vol');else if(c==='KeyM')remoteCmd('mute');else if(c==='KeyT')remoteCmd('sleep');}};
function buildCouchSeat(){const b=LIVING.sofa;b.mesh.updateMatrixWorld(true);b.useOwner=COUCH;const avg=(L)=>{const v=V3();for(const e of L)v.add(b.mesh.worldToLocal(e.mesh.getWorldPosition(V3())));return v.multiplyScalar(1/L.length);};
  for(const c of LIVING.seatC){c.useOwner=COUCH;COUCH.seats.push({c,l:b.mesh.worldToLocal(c.mesh.getWorldPosition(V3()))});}for(const c of LIVING.backC)c.useOwner=COUCH;if(LIVING.throwC)LIVING.throwC.useOwner=COUCH;
  const bd=avg(LIVING.backC).sub(avg(LIVING.seatC));bd.y=0;if(bd.lengthSq()>1e-6)COUCH.bd.copy(bd.normalize());
  buildRemote(b);
  const L=new THREE.PointLight(0xaabbff,0,5.5,1.6);const tc=tvCentre();const out=V3(1,0,0);L.position.copy(tc).addScaledVector(out,0.45);scene.add(L);TVL.light=L;TVL.cv=mkCanvas(4,3);TVL.x=TVL.cv.getContext('2d',{willReadFrequently:true});
  /* the TV's own buttons, on the bottom edge, right-hand side: E on the right third of the set = CH ▲ */const bm=new THREE.MeshStandardMaterial({color:0x26272b,roughness:0.5});for(let i=0;i<3;i++){const k=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.005,0.016),bm);k.position.set(0.004,-0.352,-0.42-i*0.03);TV.core.mesh.add(k);}}

/* ---------- the remote */
function texRemote(){const c=mkCanvas(64,232),x=c.getContext('2d');x.fillStyle='#1c1d20';x.fillRect(0,0,64,232);speckle(x,64,232,900,[40,40,44],10,0.35,1);
  const btn=(bx,by,w,h,col,t)=>{x.fillStyle='rgba(0,0,0,0.5)';x.fillRect(bx+1,by+2,w,h);x.fillStyle=col;x.fillRect(bx,by,w,h);if(t){x.fillStyle='#d8d8d0';x.font='bold 7px Arial';x.textAlign='center';x.fillText(t,bx+w/2,by+h-3);}};
  btn(8,10,14,10,'#a83228','');x.fillStyle='#b8b8b0';x.font='bold 6px Arial';x.fillText('POWER',8,30);for(let r=0;r<3;r++)for(let q=0;q<3;q++)btn(8+q*17,40+r*15,13,11,'#4a4b50',String(1+r*3+q));btn(25,85,13,11,'#4a4b50','0');
  btn(8,108,20,34,'#3a3b40','');btn(36,108,20,34,'#3a3b40','');x.fillStyle='#d8d8d0';x.font='bold 7px Arial';x.textAlign='center';x.fillText('VOL',18,150);x.fillText('CH',46,150);x.fillText('+',18,118);x.fillText('−',18,139);x.fillText('▲',46,118);x.fillText('▼',46,139);
  btn(8,160,14,9,'#5a5b60','');btn(42,160,14,9,'#5a5b60','');x.fillText('MUTE',15,178);x.fillText('SLEEP',49,178);x.font='bold 8px Arial';x.fillStyle='#8a8a84';x.fillText('VISTRON',32,214);return c;}
function remoteMeshes(parent,topMat,bodyMat){const body=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.022,0.18),bodyMat);parent.add(body);const top=new THREE.Mesh(new THREE.PlaneGeometry(0.046,0.168),topMat);top.rotation.x=-Math.PI/2;top.position.y=0.0112;parent.add(top);
  const led=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.01,0.004),new THREE.MeshStandardMaterial({color:0x3a0a0a,emissive:0xff2a1a,emissiveIntensity:0,roughness:0.2}));led.position.set(0,0,-0.091);parent.add(led);return{body,top,led};}
function buildRemote(b){const topMat=new THREE.MeshStandardMaterial({map:mkTex(texRemote(),1,1),roughness:0.6});const bodyMat=new THREE.MeshStandardMaterial({color:0x1a1b1e,roughness:0.55,metalness:0.05});COUCH.topMat=topMat;COUCH.bodyMat=bodyMat;
  /* on the arm next to the seat nearest it: arm parts sit at local x ±0.75, top at 0.70 */const s0=COUCH.seats[0];const side=s0&&s0.l.x<0?-1:1;const lp=V3(side*0.75,0.70+0.012,0).addScaledVector(COUCH.bd,-0.08);const wp=b.mesh.localToWorld(lp);
  /* remote's long axis points out of the couch, IR end forward */const fwd=COUCH.bd.clone().negate().applyQuaternion(b.mesh.getWorldQuaternion(new THREE.Quaternion()));const q=new THREE.Quaternion().setFromAxisAngle(V3(0,1,0),Math.atan2(-fwd.x,-fwd.z));
  const r=compoundEnt([{w:0.05,h:0.022,d:0.18,x:0,y:0,z:0,mat:bodyMat}],wp,{kind:'prop',mat:'plastic',mass:0.2,hp:2.5,label:'TV remote',wakeable:true,restsOn:b,noBatch:true,quat:q,damp:0.2});b.dependents.push(r);
  const top=new THREE.Mesh(new THREE.PlaneGeometry(0.046,0.168),topMat);top.rotation.x=-Math.PI/2;top.position.y=0.0112;r.mesh.add(top);
  const door=new THREE.Mesh(new THREE.BoxGeometry(0.042,0.003,0.075),bodyMat);door.position.set(0,-0.0118,0.045);r.mesh.add(door);COUCH.door=door;
  const ir=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.01,0.004),new THREE.MeshStandardMaterial({color:0x3a0a0a,roughness:0.2}));ir.position.set(0,0,-0.091);r.mesh.add(ir);
  r.onHardHitV=3.0;r.onHardHit=(p,v)=>remotePop(p,v);r.use=()=>{if(COUCH.popped){remoteRefit();return;}remoteCmd('power',0,true);};r.useLabel=()=>COUCH.popped?(remoteAAsNear()?'PUT THE AAs BACK IN':null):'PRESS POWER';COUCH.remote=r;
  /* the one in your hand while you're on the couch */const vm=new THREE.Group();const m=remoteMeshes(vm,topMat,bodyMat);vm.position.set(0.16,-0.19,-0.4);vm.rotation.set(1.0,-0.22,-0.1);vm.visible=false;camera.add(vm);COUCH.vm=vm;COUCH.vmLed=m.led;}
function remoteOK(){const r=COUCH.remote;if(!r||!r.alive||COUCH.popped)return false;const p=r.mesh.getWorldPosition(_tvp);const ref=SEAT.at==='couch'?SEAT.eye:(COUCH.cur?LIVING.sofa.mesh.localToWorld(COUCH.cur.l.clone()):SEAT.eye);return p.distanceTo(ref)<1.35;}
function remoteAAsNear(){return(COUCH.aas||[]).filter(a=>a.alive&&a.mesh.getWorldPosition(V3()).distanceTo(player.pos)<2.2).length===2;}
function remotePop(p,v){if(COUCH.popped||!COUCH.remote||!COUCH.remote.alive)return;COUCH.popped=true;const r=COUCH.remote;r.mesh.updateMatrixWorld(true);const dp=COUCH.door.getWorldPosition(V3());if(COUCH.door.parent)COUCH.door.parent.remove(COUCH.door);S.clink(p);S.clatter(p);
  const dq=r.mesh.getWorldQuaternion(new THREE.Quaternion());const d=boxEnt(0.042,0.004,0.075,dp,COUCH.bodyMat,{kind:'prop',mat:'plastic',mass:0.03,hp:1,label:'battery door',wakeable:true,noBatch:true,quat:dq});makeDynamic(d);applyImpulse(d,V3(rnd(-0.06,0.06),0.08,rnd(-0.06,0.06)));
  const aaM=new THREE.MeshStandardMaterial({color:0xb8a040,roughness:0.35,metalness:0.6});COUCH.aas=[];for(let i=0;i<2;i++){const ap=r.mesh.localToWorld(V3(i?0.01:-0.01,-0.006,0.045));const a=compoundEnt([{geo:new THREE.CylinderGeometry(0.007,0.007,0.05,12),x:0,y:0,z:0,mat:aaM,cyl:[0.007,0.007,0.05]}],ap,{kind:'prop',mat:'metal',mass:0.025,hp:2,label:'AA battery',wakeable:true,noBatch:true,quat:new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,rnd(0,3)))});makeDynamic(a);applyImpulse(a,V3(rnd(-0.05,0.05),0.06,rnd(-0.05,0.05)));COUCH.aas.push(a);}
  if(SEAT.at==='couch')HUD.msg('[THE REMOTE SPAT ITS AAs ON THE FLOOR]',1.6);else HUD.msg('[REMOTE BURST · BATTERY DOOR AND AAs EVERYWHERE]',1.6);}
function remoteRefit(){if(!remoteAAsNear()){HUD.msg('[NO AAs. IT IS NOW A SMALL PLASTIC BRICK.]',1.4);return;}for(const a of COUCH.aas)removeEnt(a);COUCH.aas=[];COUCH.popped=false;S.clink(player.pos);HUD.msg('[AAs BACK IN. THE DOOR IS GONE. THEY WILL HOLD. PROBABLY.]',1.8);}
function remoteCmd(cmd,arg,direct){if(!direct&&SEAT.at==='couch'&&!remoteOK()){HUD.msg(COUCH.popped&&COUCH.remote&&COUCH.remote.alive?'[THE REMOTE HAS NO BATTERIES. THE TV HAS BUTTONS. THE TV IS OVER THERE.]':'[NO REMOTE. THE BUTTONS ARE ON THE TV. THE TV IS OVER THERE.]',1.8);return;}
  if(direct&&COUCH.popped)return;COUCH.led=0.12;const at=SEAT.at==='couch'?SEAT.eye:(COUCH.remote?COUCH.remote.mesh.getWorldPosition(V3()):player.pos);S.click(at,2600);
  if(cmd==='power'){if(!TV.glass){HUD.msg('[NOTHING LEFT TO WATCH]',1);return;}TV.on=!TV.on;if(TV.on){tvOSD('banner');if(!tvPowered())HUD.msg(TV.cord&&TV.cord.plugged?'[NO POWER]':'[TV IS UNPLUGGED]',1);}else tvCut();return;}
  if(!TV.on||TV.state!=='on'){HUD.msg('[THE TV IS OFF · 0 = POWER]',1);return;}
  if(cmd==='up')tvChannel(1,true);else if(cmd==='down')tvChannel(-1,true);else if(cmd==='num')tvChannel(arg,false);
  else if(cmd==='vol'){const i=TV_VOLS.findIndex(v=>v>TV.vol+0.01);TV.vol=TV_VOLS[i<0?0:i];TV.mute=false;tvOSD('vol');}
  else if(cmd==='mute'){TV.mute=!TV.mute;if(TV.mute&&TV.spoke){VO.cancel();TV.spoke=false;}tvOSD('vol');}
  else if(cmd==='sleep'){const L=[0,30,60,90];TV.sleepSet=L[(L.indexOf(TV.sleepSet)+1)%L.length];TV.sleep=TV.sleepSet*60;tvOSD('sleep',2.5);HUD.msg(TV.sleepSet?'[SLEEP TIMER · '+TV.sleepSet+' MIN]':'[SLEEP TIMER OFF]',1.2);}}
function updateCouchVM(dt){if(!COUCH.vm)return;const show=SEAT.at==='couch'&&SEAT.blend>0.7&&remoteOK();COUCH.vm.visible=show;if(COUCH.remote&&COUCH.remote.alive)COUCH.remote.mesh.visible=!show;COUCH.led=Math.max(0,COUCH.led-dt);COUCH.vmLed.material.emissiveIntensity=COUCH.led>0?3:0;
  if(show){const p=COUCH.led>0?0.012:0;COUCH.vm.position.set(0.16,-0.19+Math.sin(now*1.3)*0.002,-0.4+p);}}

/* ============================================================ CH 7 · ADS ALL NIGHT — station ident + stand-by (v5.1) */
function tvBG(x,W,H,c0,c1){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,c0);g.addColorStop(1,c1);x.fillStyle=g;x.fillRect(0,0,W,H);}
function tvText(x,t,px,py,size,col,o={}){x.font=`${o.w||'bold'} ${Math.round(size)}px ${o.f||'"Arial Black",Arial,sans-serif'}`;x.textAlign=o.a||'center';x.textBaseline='middle';if(o.ls!==undefined&&x.letterSpacing!==undefined)x.letterSpacing=o.ls+'px';if(o.sh){x.fillStyle=o.sh;x.fillText(t,px+size*0.06,py+size*0.06);}x.fillStyle=col;x.fillText(t,px,py);if(x.letterSpacing!==undefined)x.letterSpacing='0px';}
function tvDrawOwl(x,cx,cy,s,t,o={}){/* the CH 7 night owl: round, perched, test-card eyes */const blink=o.blink||0,look=o.look||0,turn=o.turn===undefined?1:o.turn;x.save();x.translate(cx,cy);x.scale(s,s);
  x.strokeStyle='#4a3020';x.lineWidth=9;x.lineCap='round';x.beginPath();x.moveTo(-120,96);x.lineTo(120,90);x.stroke();
  x.fillStyle='#e0a030';for(const fx of[-22,22]){for(let k=-1;k<=1;k++){x.beginPath();x.ellipse(fx+k*7,90,4,9,k*0.3,0,Math.PI*2);x.fill();}}
  x.fillStyle='#5e4c3a';x.beginPath();x.ellipse(0,20,70,82,0,0,Math.PI*2);x.fill();
  x.fillStyle='#4a3b2c';for(const sx of[-1,1]){x.beginPath();x.ellipse(sx*60,28,24,62,sx*-0.18,0,Math.PI*2);x.fill();}
  x.fillStyle='#c8ae86';x.beginPath();x.ellipse(0,38,46,56,0,0,Math.PI*2);x.fill();x.strokeStyle='#8a6e4c';x.lineWidth=3;for(let r=0;r<4;r++)for(let q=-2;q<=2;q++){const px=q*16+(r%2)*8,py=12+r*16;if(Math.abs(px)>38-r*2)continue;x.beginPath();x.moveTo(px-5,py);x.lineTo(px,py+5);x.lineTo(px+5,py);x.stroke();}
  x.save();x.translate(0,-52);x.rotate(o.tilt||0);x.scale(turn,1);const hc='#6a5642';x.fillStyle=hc;x.beginPath();x.ellipse(0,0,78,60,0,0,Math.PI*2);x.fill();
  for(const sx of[-1,1]){x.beginPath();x.moveTo(sx*40,-44);x.lineTo(sx*66,-86);x.lineTo(sx*70,-34);x.closePath();x.fill();}
  if(turn>0){x.fillStyle='#e8dcc0';for(const sx of[-1,1]){x.beginPath();x.arc(sx*33,2,33,0,Math.PI*2);x.fill();}
    for(const sx of[-1,1]){const ex=sx*33,ey=2;x.fillStyle='#f2c230';x.beginPath();x.arc(ex,ey,21,0,Math.PI*2);x.fill();x.fillStyle='#120c08';x.beginPath();x.arc(ex+look*7,ey,11,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(ex+look*7-4,ey-4,3.5,0,Math.PI*2);x.fill();
      if(blink>0){x.fillStyle=hc;x.fillRect(ex-24,ey-24,48,48*blink);x.strokeStyle='#3a2c20';x.lineWidth=2.5;x.beginPath();x.moveTo(ex-22,ey-24+48*blink);x.lineTo(ex+22,ey-24+48*blink);x.stroke();}}
    x.fillStyle='#d8a020';x.beginPath();x.moveTo(-9,18);x.lineTo(9,18);x.lineTo(0,38);x.closePath();x.fill();}
  else{x.strokeStyle='#4f3f30';x.lineWidth=3;for(let i=-3;i<=3;i++){x.beginPath();x.moveTo(i*14,-30);x.quadraticCurveTo(i*16,0,i*12,40);x.stroke();}}
  x.restore();x.restore();}
function tvTestCard(x,W,H,t){tvBG(x,W,H,'#0d1a3e','#050916');x.strokeStyle='rgba(200,215,255,0.16)';x.lineWidth=1;const gs=H/9;for(let gx=W/2%gs;gx<W;gx+=gs){x.beginPath();x.moveTo(gx,0);x.lineTo(gx,H);x.stroke();}for(let gy=H/2%gs;gy<H;gy+=gs){x.beginPath();x.moveTo(0,gy);x.lineTo(W,gy);x.stroke();}
  const R=H*0.42;x.save();x.beginPath();x.arc(W/2,H/2,R,0,Math.PI*2);x.clip();const bars=['#c0c0c0','#c0c000','#00c0c0','#00c000','#c000c0','#c00000','#0000c0'];const bw=2*R/7;for(let i=0;i<7;i++){x.fillStyle=bars[i];x.fillRect(W/2-R+i*bw,H/2-R,bw+1,R*0.62);}
  x.fillStyle='#111';x.fillRect(W/2-R,H/2-R*0.38,2*R,R*1.4);for(let i=0;i<10;i++){x.fillStyle=`rgb(${i*26},${i*26},${i*26})`;x.fillRect(W/2-R+i*2*R/10,H/2+R*0.66,2*R/10+1,R*0.4);}x.restore();
  x.strokeStyle='rgba(230,235,255,0.75)';x.lineWidth=Math.max(2,H/160);x.beginPath();x.arc(W/2,H/2,R,0,Math.PI*2);x.stroke();}
function tvCh7Bug(x,W,H){const k=H/480;x.fillStyle='rgba(0,0,0,0.45)';x.fillRect(W-118*k,18*k,96*k,40*k);tvText(x,'7',W-96*k,38*k,30*k,'#ffd23a');tvText(x,'ADS ALL',W-56*k,30*k,10*k,'#fff',{f:'Arial'});tvText(x,'NIGHT',W-56*k,45*k,10*k,'#fff',{f:'Arial'});}
function tvDrawIdent(x,W,H,t){const k=H/480;tvTestCard(x,W,H,t);
  const blink=Math.max(0,1-Math.abs(t-2.6)*9)+Math.max(0,1-Math.abs(t-5.4)*9);const turn=t>6.1&&t<7.1?Math.cos((t-6.1)/1.0*Math.PI*2):1;
  tvDrawOwl(x,W/2,H*0.52,k*1.05,t,{blink:Math.min(1,blink),look:Math.sin(t*0.8)*0.8,tilt:Math.sin(t*0.9)*0.09,turn});
  x.fillStyle='rgba(0,0,0,0.8)';x.fillRect(0,H-96*k,W,96*k);tvText(x,'ADS ALL NIGHT',W/2,H-66*k,40*k,'#ffd23a',{sh:'#7a3a00',ls:4});
  if(t>2)tvText(x,"STAY UP. DON'T CHANGE THE CHANNEL.",W/2,H-28*k,17*k,'#fff',{f:'"Courier New",monospace',ls:2});
  x.fillStyle='rgba(0,0,0,0.5)';x.fillRect(22*k,18*k,120*k,30*k);tvText(x,'2:14 AM',82*k,33*k,18*k,'#e8e8e8',{f:'"Courier New",monospace'});tvCh7Bug(x,W,H);}
function tvDrawStandby(x,W,H,t){const k=H/480;const bars=['#c0c0c0','#c0c000','#00c0c0','#00c000','#c000c0','#c00000','#0000c0'];const bw=W/7;for(let i=0;i<7;i++){x.fillStyle=bars[i];x.fillRect(i*bw,0,bw+1,H*0.68);}
  const bt=['#0000c0','#131313','#c000c0','#131313','#00c0c0','#131313','#c0c0c0'];for(let i=0;i<7;i++){x.fillStyle=bt[i];x.fillRect(i*bw,H*0.68,bw+1,H*0.08);}x.fillStyle='#101010';x.fillRect(0,H*0.76,W,H*0.24);
  x.fillStyle='rgba(0,0,0,0.82)';x.fillRect(W*0.14,H*0.24,W*0.72,H*0.3);x.strokeStyle='#ffd23a';x.lineWidth=3*k;x.strokeRect(W*0.14,H*0.24,W*0.72,H*0.3);
  tvText(x,'OUR ADVERTISERS ARE RUNNING LATE',W/2,H*0.32,22*k,'#fff',{f:'"Courier New",monospace',ls:1});tvText(x,'PLEASE STAND BY',W/2,H*0.42,34*k,'#ffd23a',{ls:3});
  tvText(x,'ADS RESUME IN '+Math.max(0,Math.ceil(14-t))+' S  ·  OR NEVER',W/2,H*0.5,14*k,'#aaa',{f:'"Courier New",monospace'});tvText(x,'2:14 AM',W*0.1,H*0.88,18*k,'#e8e8e8',{f:'"Courier New",monospace',a:'left'});tvCh7Bug(x,W,H);}
function tvHoot(d,f){const o=TVA.out();if(!o)return;const c=TVA.c,t0=TVA.t+d;const os=c.createOscillator();os.type='sine';os.frequency.setValueAtTime(f*1.08,t0);os.frequency.exponentialRampToValueAtTime(f,t0+0.12);os.frequency.exponentialRampToValueAtTime(f*0.86,t0+0.42);const g=c.createGain();TVA.env(g,0.16,0.05,0.4,t0);const bp=c.createBiquadFilter();bp.type='lowpass';bp.frequency.value=900;os.connect(bp);bp.connect(g);g.connect(o);os.start(t0);os.stop(t0+0.55);TVA.noise({dur:0.3,gain:0.03,type:'bandpass',f:500,q:2,delay:d},o);}
tvReelAdd({id:'ident',dur:8,draw:tvDrawIdent,cues:[
  {t:0.05,fn(){const o=TVA.out();for(const [d,f] of[[0,784],[0.16,988],[0.32,1175],[0.5,1568]])TVA.tone({f,dur:0.7,type:'triangle',gain:0.1,delay:d},o);TVA.tone({f:196,dur:1.2,gain:0.12},o);}},
  {t:0.9,fn(){tvHoot(0,320);tvHoot(0.62,300);tvHoot(0.86,300);tvSay('','[AN OWL HOOTS · HOO · HOO-HOO]',1.6);}},
  {t:2.1,fn(){tvSay('CH 7',"Stay up. Don't change the channel.",3.4,'tv');}},
  {t:6.15,fn(){const o=TVA.out();TVA.noise({dur:0.7,gain:0.16,type:'bandpass',f:420,f1:900,q:5},o);tvSay('','[A SLOW, WRONG CREAK]',1.2);}}]});
tvReelAdd({id:'standby',dur:14,draw:tvDrawStandby,cues:[
  {t:0.05,fn(){TVA.tone({f:1000,dur:1.6,type:'sine',gain:0.05,att:0.01},TVA.out());tvSay('','[TEST TONE]',1.6);}},
  {t:2.2,fn(){tvSay('CH 7','Our advertisers are running late. Please stand by.',4,'tvm');}},
  ...[6.5,8.5,10.5].map((t,i)=>({t,fn(){/* muzak, two bars at a time */const o=TVA.out();const ch=[[261.6,329.6,392],[220,277.2,329.6],[233.1,293.7,349.2],[196,246.9,293.7]];for(let b=0;b<2;b++){const c=ch[(i*2+b)%4];for(const f of c)TVA.tone({f,dur:0.9,type:'triangle',gain:0.035,att:0.05,delay:b},o);TVA.tone({f:c[0]/2,dur:0.9,gain:0.06,delay:b},o);TVA.tone({f:c[2]*2,dur:0.4,type:'sine',gain:0.03,delay:b+0.5},o);}if(i===0)tvSay('','[GENTLE HOLD MUSIC]',2);}}))]});
