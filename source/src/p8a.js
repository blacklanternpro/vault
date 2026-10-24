
/* ============================================================ v4 PHASE 3 · EXECUTIONER
   p8a — the desk monitor: a 21" FD flat-screen beast (G500-class, ~30 kg, charcoal), its screen shader,
   and sitting down at the desk. The game itself lives in p8b/p8c and renders into EX.rt (640×480). */
const MON={SW:0.404,SH:0.303,BW:0.505,BH:0.437,BD:0.046,base:0.052,sy:0.2935,fz:0.072,mat:null,warm:0,collapse:1,wasOn:false,mixG:0};
function texPlastic(w,h,base,rgb,amt=10){const c=mkCanvas(w,h),x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,w,h);speckle(x,w,h,w*h/6,rgb,amt,0.35,2);for(let i=0;i<3;i++)stain(x,srand()*w,srand()*h,10+srand()*26,'0,0,0',0.08);return c;}
function monBadge(){const c=mkCanvas(256,40),x=c.getContext('2d');x.clearRect(0,0,256,40);x.fillStyle='#b9bcc2';x.font='bold 19px "Arial Narrow",Arial,sans-serif';if(x.letterSpacing!==undefined)x.letterSpacing='5px';x.fillText('MERIDIAN',4,22);x.fillStyle='#8d9096';x.font='10px Arial,sans-serif';if(x.letterSpacing!==undefined)x.letterSpacing='2px';x.fillText('FD FLATSCREEN 21"  ·  2048×1536',5,36);return c;}
function monScreenMat(deskTex){const m=new THREE.ShaderMaterial({uniforms:{tDesk:{value:deskTex},tGame:{value:EX.rt?EX.rt.texture:deskTex},mixG:{value:0},bright:{value:0},collapse:{value:1},time:{value:0},res:{value:new THREE.Vector2(640,480)}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D tDesk;uniform sampler2D tGame;uniform float mixG;uniform float bright;uniform float collapse;uniform float time;uniform vec2 res;varying vec2 vUv;
  void main(){vec2 q=vUv-0.5;float c=collapse;float sy=mix(1.0,0.006,smoothstep(0.0,0.55,c));float sx=mix(1.0,0.0,smoothstep(0.55,1.0,c));vec2 p=vec2(q.x/max(sx,1e-4),q.y/sy)+0.5;
    vec3 col=vec3(0.0);
    if(p.x>=0.0&&p.x<=1.0&&p.y>=0.0&&p.y<=1.0&&c<0.999){vec3 d=texture2D(tDesk,p).rgb;vec3 g=texture2D(tGame,p).rgb;col=mix(d,g,mixG);if(c>0.0)col=mix(col,vec3(1.0),smoothstep(0.15,0.6,c))*(1.0+c*2.5);}
    /* aperture grille + scanlines, faded out when the screen is too small on screen to resolve them (no moire) */
    float ly=vUv.y*res.y;float lw=fwidth(ly);float sa=clamp(1.2-lw*1.6,0.0,1.0);col*=1.0-sa*0.16*(0.5+0.5*cos(ly*6.2831853));
    float gx=vUv.x*res.x*1.5;float gw=fwidth(gx);float ga=clamp(1.2-gw*1.6,0.0,1.0);float ph=fract(gx);vec3 mask=vec3(step(ph,0.333),step(0.333,ph)*step(ph,0.666),step(0.666,ph));col*=mix(vec3(1.0),vec3(0.8)+mask*0.42,ga*0.55);
    col*=bright;col+=col*col*0.25;/* phosphor bloom-ish */
    float sheen=pow(max(0.0,1.0-length((vUv-vec2(0.22,0.86))*vec2(1.0,1.6))),3.0)*0.05;float edge=smoothstep(0.42,0.5,max(abs(q.x),abs(q.y)));
    col+=vec3(0.0035,0.004,0.0045)+sheen*0.6;col*=1.0-edge*0.25;
    gl_FragColor=vec4(col,1.0);
    #include <colorspace_fragment>
  }`,toneMapped:false});m.extensions={derivatives:true};return m;}

function buildCRT(top,x,z,ty){/* 21" FD flat-screen, the coveted heavy one */const G=MON;const {SW,SH,BW,BH,BD,base,sy,fz}=G;
  const chP=new THREE.MeshStandardMaterial({map:mkTex(texPlastic(128,128,'#2a2b2f',[44,45,50],12),1,1),roughness:0.5,metalness:0.06});
  const bzP=new THREE.MeshStandardMaterial({map:mkTex(texPlastic(128,128,'#383a3f',[58,60,66],10),1,1),roughness:0.4,metalness:0.1});
  const blk=new THREE.MeshStandardMaterial({color:0x0b0c0e,roughness:0.55});const alu=new THREE.MeshStandardMaterial({color:0x8f939a,roughness:0.35,metalness:0.7});
  const sTop=sy+SH/2,sBot=sy-SH/2,bTop=base+BH,side=(BW-SW)/2,bz=fz-BD/2;
  const rear=new THREE.CylinderGeometry(0.19,0.33,0.40,4,1);rear.rotateY(Math.PI/4);rear.rotateX(-Math.PI/2);rear.scale(1,0.86,1);
  const parts=[{geo:new THREE.CylinderGeometry(0.165,0.185,0.024,28),x:0,y:0.012,z:-0.13,mat:chP,cyl:[0.165,0.185,0.024]},{w:0.17,h:0.03,d:0.15,x:0,y:0.039,z:-0.12,mat:blk,noCollide:true},
    {w:BW,h:bTop-sTop,d:BD,x:0,y:(bTop+sTop)/2,z:bz,mat:bzP},{w:BW,h:sBot-base,d:BD,x:0,y:(sBot+base)/2,z:bz,mat:bzP},{w:side,h:SH,d:BD,x:-(SW/2+side/2),y:sy,z:bz,mat:bzP},{w:side,h:SH,d:BD,x:SW/2+side/2,y:sy,z:bz,mat:bzP},
    {w:SW+0.012,h:SH+0.012,d:0.012,x:0,y:sy,z:fz-BD-0.004,mat:blk,noCollide:true},
    {geo:rear,w:0.44,h:0.37,d:0.40,x:0,y:sy-0.004,z:fz-BD-0.2,mat:chP},{w:0.24,h:0.19,d:0.012,x:0,y:sy,z:fz-BD-0.404,mat:blk,noCollide:true}];
  const crt=compoundEnt(parts,V3(x,ty+0.015,z),{kind:'furniture',mat:'plastic',mass:30,hp:22,label:'21" FD monitor (30 kg)',wakeable:true,restsOn:top,noBatch:true,screenOK:true});top.dependents.push(crt);PC.crt=crt;
  /* vents on the hump */for(let i=0;i<7;i++){const v=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.004,0.012),blk);v.position.set(0,sy+0.165,fz-BD-0.08-i*0.035);v.rotation.x=0.12;crt.mesh.add(v);}
  /* chin: badge, power button, LED, control row */const bd=new THREE.Mesh(new THREE.PlaneGeometry(0.14,0.022),new THREE.MeshBasicMaterial({map:mkTex(monBadge(),1,1),transparent:true,toneMapped:true}));bd.position.set(-0.155,base+0.045,fz+0.0012);crt.mesh.add(bd);
  const pb=new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.009,0.006,16),alu);pb.rotation.x=Math.PI/2;pb.position.set(0.205,base+0.042,fz+0.002);crt.mesh.add(pb);
  for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.006,0.004),blk);b.position.set(0.06+i*0.022,base+0.042,fz+0.0015);crt.mesh.add(b);}
  const led=new THREE.Mesh(new THREE.BoxGeometry(0.006,0.004,0.003),new THREE.MeshStandardMaterial({color:0x1a5a2a,emissive:0x33ff66,emissiveIntensity:0}));led.position.set(0.185,base+0.042,fz+0.0015);crt.mesh.add(led);PC.leds.push(led);
  /* the face: flat glass, picture underneath (shader), crack layer on top */const scrD=mkDrawable(mkCanvas(512,384));scrD.tex.wrapS=scrD.tex.wrapT=THREE.ClampToEdgeWrapping;PC.crtD=scrD;PC.crtScale=2;PC.shaderScreen=true;
  if(!EX.rt)exMakeRT();MON.mat=monScreenMat(scrD.tex);const sg=new THREE.PlaneGeometry(SW,SH);const scr=new THREE.Mesh(sg,MON.mat);scr.position.set(0,sy,fz-0.012);scr.userData.drawable=scrD;crt.mesh.add(scr);PC.screen=scr;crt.screenMesh=scr;
  const crackD=mkDrawable(mkCanvas(512,384));crackD.tex.wrapS=crackD.tex.wrapT=THREE.ClampToEdgeWrapping;const glass=new THREE.Mesh(sg.clone(),new THREE.MeshBasicMaterial({map:crackD.tex,transparent:true,depthWrite:false,toneMapped:false}));glass.position.set(0,sy,fz-0.0112);crt.mesh.add(glass);PC.tube=glass;crt.screenD=crackD;MON.crack=crackD;
  crt.screenHit=(p,uv,dir,dmg)=>{if(PC.crtGone)return;PC.crtHits=(PC.crtHits||0)+1;if(PC.crtHits===1&&!(dmg>=4.2)){const u=uv?uv.x:0.5,v=uv?uv.y:0.5;crackD.cracks(u,v,12,'rgba(235,240,255,0.75)',30);crackD.cracks(u,v,6,'rgba(255,255,255,0.4)',60);S.clink(p);S.thud(p,1.6);HUD.msg('[THICK FD GLASS - STAR CRACK]',1);}else crtImplode(p,dir);};
  crt.onHardHit=(p,v)=>{if(v>4.2)crtImplode(p,null);};crt.onHardHitV=4.2;crt.useOwner=SEAT;crt.strictScreen=[scr,glass];crtDraw('off');return crt;}

function crtImplode(p,dir){const c=PC.crt;if(!c||!c.alive||PC.crtGone)return;PC.crtGone=true;const m=c.mesh;const G=MON;for(const ch of[PC.tube,PC.screen])if(ch&&ch.parent)ch.parent.remove(ch);
  const hole=new THREE.Mesh(new THREE.BoxGeometry(G.SW,G.SH,0.02),new THREE.MeshStandardMaterial({color:0x040404,roughness:1}));hole.position.set(0,G.sy,G.fz-0.022);m.add(hole);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.03,0.2,12),new THREE.MeshStandardMaterial({color:0x2a3a2a,roughness:0.3,metalness:0.4}));neck.rotation.x=Math.PI/2+0.3;neck.position.set(0.03,G.sy-0.03,G.fz-0.09);m.add(neck);
  const gun=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.05,8),new THREE.MeshStandardMaterial({color:0x6a6a60,metalness:0.8,roughness:0.3}));gun.rotation.x=Math.PI/2;gun.position.set(0.03,G.sy-0.05,G.fz-0.17);m.add(gun);
  const w=m.localToWorld(V3(0,G.sy,G.fz));S.whump(w);S.whump(w);shakeCam(0.9);P.emit(w,{count:110,color:[0.85,0.97,0.85],cvar:0.1,size:0.03,svar:0.02,life:2.4,lvar:0.8,spread:1.4,grav:1.1,drag:1.6,kind:1});const out=m.localToWorld(V3(0,G.sy,G.fz+1)).sub(m.localToWorld(V3(0,G.sy,G.fz))).normalize();
  spawnFragments(w,12,'glass',0.06,out.clone().multiplyScalar(2.6),3.4);shards(w,90,[0.75,0.85,0.8]);sparks(w,35,[0.8,0.9,1]);if(PC.on)onSpark(w);c.screenOK=undefined;c.screenMesh=null;S.droneGain('crtwhine',0);
  if(EX.running)exStop();if(SEAT.active)standUp('[21" TUBE IMPLODED IN YOUR FACE - GAME OVER, FOR REAL]');else HUD.msg('[21" TUBE IMPLODED - PHOSPHOR DUST EVERYWHERE]',2);}

function updateMonitor(dt){if(!MON.mat)return;const u=MON.mat.uniforms;const on=PC.on&&crtAlive();if(on&&!MON.wasOn){MON.warm=0;MON.collapse=0;}if(!on&&MON.wasOn&&crtAlive()){MON.collapse=0.0001;S.tone({f:15700,f1:9000,dur:0.4,type:'sine',gain:0.02,pos:PC.crt.mesh.getWorldPosition(V3())});}MON.wasOn=on;
  if(on){MON.warm=Math.min(1,MON.warm+dt/1.6);u.bright.value=0.08+0.92*MON.warm*MON.warm;u.collapse.value=0;}else{if(MON.collapse>0&&MON.collapse<1){MON.collapse=Math.min(1,MON.collapse+dt/0.32);}else MON.collapse=1;u.collapse.value=MON.collapse;u.bright.value=MON.collapse<1?1:0;}
  MON.mixG=lerp(MON.mixG,EX.running?1:0,1-Math.exp(-dt*14));u.mixG.value=MON.mixG;u.time.value=now;}

/* ============================================================ SEATS (v5) — one seat system, two seats.
   A seat is data: where the eye goes, what it looks at, its field of view, and what the mouse and keys do while
   you're in it. SEATS.desk aims in EXECUTIONER; SEATS.couch (p8d) looks round the room and drives the remote.
   SEAT.active = seated anywhere; SEAT.at = 'desk' | 'couch' | null. */
const SEAT={active:false,at:null,def:null,blend:0,lean:0.58,eye:V3(),yaw:0,pitch:0,stand:V3(),n:V3(),fov:78,vy:0,vp:0,vf:60,ly:0,lp:0};
const SEATS={};
SEAT.use=()=>{if(!crtAlive()){HUD.msg('[NOTHING LEFT TO LOOK AT]',1);return;}if(PC.on&&(PC.state==='desktop'))sitDown('desk');else if(!PC.on)pcToggle();else HUD.msg('[WAIT FOR IT TO BOOT]',1);};
SEAT.useLabel=()=>{if(!crtAlive())return null;if(PC.on&&PC.state==='desktop')return EX.running?'SIT DOWN · BACK TO EXECUTIONER':'SIT DOWN · PLAY EXECUTIONER';if(PC.on)return null;return'PC POWER ON';};
function seatTarget(){const m=PC.crt.mesh;m.updateMatrixWorld(true);const G=MON;const sc=m.localToWorld(V3(0,G.sy,G.fz));const n=m.localToWorld(V3(0,G.sy,G.fz+1)).sub(sc);n.y=0;if(n.lengthSq()<1e-6)n.set(0,0,1);n.normalize();
  SEAT.n.copy(n);SEAT.eye.copy(sc).addScaledVector(n,SEAT.lean);SEAT.eye.y=sc.y+0.075;SEAT.yaw=Math.atan2(n.x,n.z);SEAT.pitch=Math.atan2(sc.y-SEAT.eye.y,SEAT.lean);SEAT.stand.copy(sc).addScaledVector(n,SEAT.lean+0.62);return sc;}
function canSit(){if(!crtAlive())return false;const m=PC.crt.mesh;const up=V3(0,1,0).applyQuaternion(m.getWorldQuaternion(new THREE.Quaternion()));const sc=m.localToWorld(V3(0,MON.sy,MON.fz));return up.y>0.85&&sc.y>0.6;}
SEATS.desk={name:'desk',
  can(){return canSit()?null:'[THE MONITOR IS NOT WHERE A MONITOR SHOULD BE]';},
  keep(){if(!canSit())return'[THE DESK GAVE UP ON YOU]';if(!PC.on||PC.state!=='desktop')return'[SCREEN WENT DEAD]';if(!EX.running)return'[YOU QUIT TO THE DESKTOP. THE ICON IS STILL THERE.]';return null;},
  target(){seatTarget();},
  view(){const w=clamp(Math.atan2(Math.sin(EX.aimYaw),Math.cos(EX.aimYaw)),-1,1);return{yaw:SEAT.yaw+w*0.035,pitch:SEAT.pitch+clamp(EX.aimPitch,-0.6,0.5)*0.03,fov:EX.ads?54:60};},
  hint:'SEATED · WASD = WALK (IN GAME) · MOUSE = LOOK/AIM · LMB = FIRE · HOLD RMB = IRON SIGHTS · R = RELOAD · F = USE (IN GAME) · TAB = PAUSE · WHEEL = LEAN IN/OUT · E = STAND UP',
  onSit(){S.thud(SEAT.stand,0.5);S.click(SEAT.eye,1200);if(!EX.running)exStart();HUD.msg(EX.state==='play'?'[BACK AT THE DESK]':'[2:14 AM. YOU DOUBLE-CLICK IT.]',1.6);},
  onStand(){EX.ads=false;},
  look(dx,dy){if(EX.menu){EX.menuAcc=(EX.menuAcc||0)+dy;if(Math.abs(EX.menuAcc)>70){exMenuMove(EX.menuAcc>0?1:-1);EX.menuAcc=0;}return;}EX.look(dx,dy);},
  down(b){if(b===0)EX.trigger();if(b===2&&!EX.menu)EX.ads=true;},
  up(b){if(b===2)EX.ads=false;},
  wheel(d){SEAT.lean=clamp(SEAT.lean+(d>0?0.06:-0.06),0.34,0.95);},
  key(c){if(c==='Tab'){exMenuToggle();return;}if(EX.menu){if(c==='KeyW'||c==='ArrowUp')exMenuMove(-1);else if(c==='KeyS'||c==='ArrowDown')exMenuMove(1);else if(c==='Enter'||c==='KeyF'||c==='Space')exMenuPick();return;}if(c==='KeyR')EX.reload();else if(c==='KeyF'&&EX.use)EX.use();}};
function sitDown(kind){kind=kind||'desk';const def=SEATS[kind];if(!def)return;if(SEAT.active){if(SEAT.at===kind)return;standUp();}const why=def.can();if(why){HUD.msg(why,1.6);return;}
  if(held)drop();if(grab){grab=null;HUD.hideBar();}resetTool();SEAT.def=def;SEAT.at=kind;SEAT.ly=0;SEAT.lp=0;def.target();SEAT.active=true;const v=def.view();SEAT.vy=v.yaw;SEAT.vp=v.pitch;SEAT.vf=v.fov;
  player.body.velocity.set(0,0,0);player.body.position.x=SEAT.stand.x;player.body.position.z=SEAT.stand.z;player.body.wakeUp();
  HUD.el.hint.textContent=def.hint;HUD.el.cross.style.display='none';if(HUD.el.use)HUD.el.use.style.display='none';def.onSit();}
function standUp(why){if(!SEAT.active)return;const def=SEAT.def;SEAT.active=false;SEAT.at=null;if(def&&def.onStand)def.onStand();player.yaw=SEAT.vy;player.pitch=clamp(SEAT.vp,-0.4,0.4);player.lastYaw=player.yaw;player.lastPitch=player.pitch;HUD.el.hint.textContent=TOOLS[tool].hint;HUD.el.cross.style.display='';if(why)HUD.msg(why,1.8);}
function seatHold(){const b=player.body;b.velocity.x=0;b.velocity.z=0;}
const _sp=V3();
function updateSeat(dt){if(SEAT.active){const why=SEAT.def.keep();if(why)standUp(why);else{SEAT.def.target();const v=SEAT.def.view();SEAT.vy=v.yaw;SEAT.vp=v.pitch;SEAT.vf=v.fov;}}
  SEAT.blend=clamp(SEAT.blend+(SEAT.active?dt/0.55:-dt/0.4),0,1);if(SEAT.blend<=0.0001){if(Math.abs(camera.fov-78)>0.01){camera.fov=78;camera.updateProjectionMatrix();}return;}
  const e=SEAT.blend*SEAT.blend*(3-2*SEAT.blend);_sp.copy(yawObj.position).lerp(SEAT.eye,e);yawObj.position.copy(_sp);
  let dy=SEAT.vy-player.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));yawObj.rotation.y=player.yaw+dy*e;pitchObj.rotation.x=lerp(player.pitch,SEAT.vp,e);pitchObj.rotation.z*=1-e;camera.position.x*=1-e;
  const f=lerp(78,SEAT.active?SEAT.vf:SEAT.vf,e);if(Math.abs(camera.fov-f)>0.01){camera.fov=f;camera.updateProjectionMatrix();}}
