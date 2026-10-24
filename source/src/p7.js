
/* ============================================================ TRUSS / PART SPLITTING */
function splitTruss(e,p){const d=e.tdir;const t0=e.t0!==undefined?e.t0:-e.tlen/2,t1=e.t1!==undefined?e.t1:e.tlen/2;const mid0=e.tmid0||e.tmid;const local=p.clone().sub(mid0).dot(d);const anchors=e.tanchors||[t0,t1];if(local-t0<0.06||t1-local<0.06)return false;
  const mk=(a0,a1)=>{const len=a1-a0;const c=mid0.clone().addScaledVector(d,(a0+a1)/2);const g=new THREE.BoxGeometry(len,0.09,0.045);const m=new THREE.Mesh(g,M.timber);m.position.copy(c);m.quaternion.copy(e.mesh.quaternion);m.castShadow=false;const b=boxBody(len/2,0.045,0.0225,c,qC(m.quaternion));const n=mkEnt({mesh:m,body:b,kind:'truss',mat:'timber',mass:len*2.1,hp:14,cut:0,label:e.label,truss:e.truss,tdir:d,tmid:c,tmid0:mid0,tlen:len,t0:a0,t1:a1,tanchors:anchors,size:V3(len,0.09,0.045)});const anch=anchors.some(a=>a>=a0-0.02&&a<=a1+0.02);if(!anch){makeDynamic(n);}return n;};
  /* 6 mm kerf gap */mk(t0,local-0.003);mk(local+0.003,t1);removeEnt(e);S.snap(p);P.emit(p,{count:20,color:[0.8,0.65,0.4],size:0.015,life:1,spread:1.6,grav:9});return true;}
function splitPart(e,p,dir){if(!e.size||!e.alive)return false;ensureBody(e);if(!e.body)return false;const b=e.body;const lp=b.pointToLocalFrame(toC(p));const s=e.size;const ax=s.x>=s.y&&s.x>=s.z?'x':(s.y>=s.z?'y':'z');const L=s[ax];const c=lp[ax];if(Math.abs(c)>L/2-0.04)return false;
  const q=new THREE.Quaternion(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w);const mkHalf=(a0,a1)=>{const sz=s.clone();sz[ax]=a1-a0;const off=V3();off[ax]=(a0+a1)/2;const wp=toT(b.position).add(off.applyQuaternion(q));const n=boxEnt(sz.x,sz.y,sz.z,wp,e.mesh.material,{kind:e.kind,mat:e.mat,mass:e.mass*(a1-a0)/L,hp:e.hp,label:e.label,wakeable:true,quat:q,drawable:e.drawable,cut:0});if(e.asm)addPart(e.asm,n);return n;};
  const A=mkHalf(-L/2,c-0.003),B=mkHalf(c+0.003,L/2);
  for(const j of e.joints.slice()){const jl=b.pointToLocalFrame(toC(j.pos));const tgt=jl[ax]<c?A:B;if(j.a===e)j.a=tgt;if(j.b===e)j.b=tgt;tgt.joints.push(j);if(j.constraint){world.removeConstraint(j.constraint);j.constraint=null;}}e.joints=[];
  for(const d of e.dependents.slice()){A.dependents.push(d);d.restsOn=A;}e.dependents=[];
  const asm=e.asm;const wasHeld=held&&held.ent===e;removeEnt(e);if(asm){const i=asm.parts.indexOf(e);if(i>=0)asm.parts.splice(i,1);wakeAsm(asm);for(const j of asm.joints)if(j.intact&&!j.constraint)mkConstraint(j);}else{makeDynamic(A);makeDynamic(B);}
  for(const h of[A,B]){if(!h.dynamic)makeDynamic(h);if(!h.joints.length){h.body.velocity.set(dir.x*0.5,0,dir.z*0.5);}}if(wasHeld)held=null;
  S.snap(p);P.emit(p,{count:16,color:[0.75,0.6,0.4],size:0.015,life:1,spread:1.5,grav:9});HUD.msg(`[${e.label.toUpperCase()} SAWN THROUGH]`,1.4);return true;}

/* ============================================================ HUD */
const HUD={el:{},msgT:0,msg(t,d=1.6){this.el.msg.textContent=t;this.el.msg.style.opacity=1;this.msgT=d;},bar(v,label){this.el.bar.style.display='block';this.el.barFill.style.width=(clamp(v,0,1)*100)+'%';this.el.barLabel.textContent=label;},hideBar(){this.el.bar.style.display='none';},setPower(on){this.el.pwr.textContent=on?'MAINS: LIVE':'MAINS: RCD TRIPPED';this.el.pwr.className=on?'on':'off';},
  init(){for(const id of['msg','bar','barFill','barLabel','tool','slots','pwr','stats','hint','flash','grab','grabInfo','cross','use'])this.el[id]=document.getElementById(id)||{style:{},classList:{toggle(){}},children:[]};},
  update(dt){if(this.msgT>0){this.msgT-=dt;if(this.msgT<=0)this.el.msg.style.opacity=0;}}};
const TOOLS=[{name:'CLAW HAMMER',hint:'tap LMB = stud-finder · hold & release LMB = heavy smash · hold RMB + pull back = claw pry (sheets, screws, skirting, stubs, planks)'},{name:'WRECKING BAR',hint:'LMB = wedge tip · hold RMB + pull mouse back = lever (heel needs solid backing) · hooks batts out of the frame'},{name:'SAWZALL',hint:'hold LMB = cut · shoe rides the surface · keep aim steady in timber or the blade binds'},{name:'BARE HANDS',hint:'LMB = grab / carry (stays in hand) · hold LMB + pull back = rip sheets & batts · carrying timber: LMB = ram · RMB = throw · E = drop · F = boot'},{name:'BLACK TEXTA',hint:'hold LMB on a surface = draw'}];

/* ============================================================ TOOL STATE */
const hammer={charging:false,t:0,pry:null,work:0,flexV:0};const crow={wedge:null,pull:0,checked:false,locked:false,work:0,flexV:0};const saw={active:false,load:0,lastEnt:null,last:null,bind:0,contact:0,hard:0};let held=null,grab=null;const texta={last:null,speed:0};const kick={cd:0};let flashOn=false;let perfMode=false;
const HA={st:'idle',t:0,dur:0,p0:V3(),r0:V3(),p1:V3(),r1:V3(),pw:0};const _cq=new THREE.Quaternion();
function resetTool(){hammer.charging=false;endPry(hammer.pry&&hammer.pry.pr);hammer.pry=null;hammer.flexV=0;if(crow.wedge)endPry(crow.wedge.pr);crow.wedge=null;crow.pull=0;crow.checked=false;crow.work=0;crow.flexV=0;if(saw.active){S.sawOn(false);saw.active=false;}saw.lastEnt=null;saw.last=null;saw.contact=0;if(held)drop();grab=null;texta.last=null;S.squeak(0);HUD.hideBar();HA.st='idle';VMA.kin=null;VMA.freeze=0;anim.charge=0;}
function setTool(i){if(i===tool)return;resetTool();tool=((i%5)+5)%5;HUD.el.tool.textContent=`[${tool+1}] ${TOOLS[tool].name}`;HUD.el.hint.textContent=TOOLS[tool].hint;for(let k=0;k<5;k++)if(HUD.el.slots.children[k])HUD.el.slots.children[k].classList.toggle('on',k===tool);S.clatter(player.pos);}
function labelOf(h){return (h.label||h.kind||'surface').toUpperCase();}
function flashHit(){HUD.el.flash.style.opacity=0.3;setTimeout(()=>HUD.el.flash.style.opacity=0,60);}
function backLabel(b){return b.noggin?(b.label==='lintel'?'LINTEL':b.label==='trimmer'?'TRIMMER':'NOGGIN'):b.plate?'PLATE':b.joist?'JOIST':'STUD';}
function camRight(){return V3(1,0,0).applyQuaternion(camera.getWorldQuaternion(_cq));}

/* ---------- shared damage ---------- */
function damage(e,dmg,p,dir,src){if(!e.alive)return;dir=dir||camFwd();const f=e.face;const tile=e.mat==='tile';
  if(!e.attached){applyImpulse(e,dir.clone().multiplyScalar(dmg*0.8*Math.min(1,e.mass)),p);if(tile){S.clink(p);}else{S.crumble(p,0.4);dust(p,8);}if(dmg>2.4||e.mass<0.8){spawnFragments(p,4,tile?'tile':'gypsum',0.06,dir.clone().multiplyScalar(1.5));removeEnt(e);}return;}
  const uv=faceUV(f,p);const backed=backingAt(f,uv.u,uv.v);const raw=dmg;if(backed&&src!=='kick'&&src!=='ram')dmg*=0.6;
  e.hp-=dmg;if(tile){shards(p,Math.round(6+dmg*4),[0.85,0.83,0.78]);S.shatter(p,false);S.tapTile(p);}else{dust(p,Math.round(8+dmg*5),0.7+dmg*0.25);S.crumble(p,0.35+dmg*0.2);}if(backed){S.tapStud(p);}
  const d=e.drawable;d.cracks(uv.u/f.L,uv.v/f.H,3+Math.round(dmg*2),tile?'rgba(60,55,50,0.85)':'rgba(35,30,26,0.75)',10+dmg*6);d.blot(uv.u/f.L,uv.v/f.H,10+dmg*8,tile?'90,85,80':'60,52,45',0.25);
  if(e.hp<=0){const wr=wireNear(f,uv.u,uv.v);if(wr)cutWire(wr,p);const pp=pipeNear(f,uv.u,uv.v);if(pp)puncturePipe(pp,p);d.blot(uv.u/f.L,uv.v/f.H,24,'20,18,16',0.6);
    /* heavy blows split the sheet into jagged wedges; lighter ones pop the whole piece */const heavy=(src==='hammer'&&raw>=2.6)||src==='kick'||src==='ram';
    if(heavy){shardChunk(e,p,dir,src==='ram'?1.4:1.1);spawnFragments(p,2+Math.round(dmg*0.6),tile?'tile':'gypsum',0.05,dir.clone().multiplyScalar(2+dmg));}
    else{spawnFragments(p,3+Math.round(dmg),tile?'tile':'gypsum',0.07,dir.clone().multiplyScalar(2.5+dmg));detachChunk(e,dir,1.5+dmg*0.6);}
    HUD.msg(tile?(backed?'[TILE & SHEET PUNCHED THROUGH - STUD EXPOSED]':'[TILE & CEMENT SHEET PUNCHED THROUGH]'):(backed?'[PLASTERBOARD PUNCTURED - STUD EXPOSED]':(heavy?'[PLASTERBOARD SHATTERED]':'[PLASTERBOARD PUNCTURED]')),1.4);recomputeSupport();}}
function damageProp(e,dmg,p,dir,hit){if(!e.alive)return;dir=dir||camFwd();
  if(e.onHit)e.onHit(p,dmg,dir);if(!e.alive)return;if(e.can&&dmg>1.2&&!e.burst){burstCan(e,p);}if(e.milk&&dmg>0.6)milkBurst(e,p);
  if(e.screenHit&&e.mat==='glass'&&dmg>=0.5){crackScreen(e,p,hit&&hit.uv,dir,dmg);return;}/* panel glass: crack, then shatter */
  if(e.mat==='ceramic'||e.mat==='china'||e.mat==='glass'||e.mat==='terra'){if(e.hp-dmg<=0||dmg>1.2){shatterEnt(e,p);return;}e.hp-=dmg;wakeEnt(e);S.clink(p);return;}
  if(e.keyboard&&dmg>=1.3){smashKeyboard(e,p,dir);return;}
  if(e.screenOK!==undefined&&e.screenMesh&&dmg>=0.8&&hit&&(e.strictScreen?e.strictScreen.includes(hit.object):(hit.object===e.screenMesh||dir.dot(e.screenMesh.getWorldDirection(V3()))<-0.3))){crackScreen(e,p,hit.uv,dir,dmg);if(!e.alive)return;}
  const dented=dentEnt(e,p,dir,dmg);
  e.hp-=dmg;if(!(e.wakeThreshold&&dmg<e.wakeThreshold&&!e.dynamic))wakeEnt(e);const m=e.body?e.body.mass:1;applyImpulse(e,dir.clone().multiplyScalar(Math.min(dmg*3,m*4)),p);
  if(e.mat==='metal'||e.mat==='copper'){if(!dented){S.clatter(p);S.thud(p,1.5);}sparks(p,Math.round(dmg*(dented?1.5:4)),[1,0.75,0.3]);}else if(e.mat==='foam'||e.mat==='fabric'||e.mat==='leaf'||e.mat==='batt'){S.thud(p,0.5);P.emit(p,{count:6,color:e.mat==='batt'?[0.93,0.66,0.7]:[0.6,0.55,0.45],size:0.02,life:1,spread:1,grav:2,drag:1.5,kind:1});}else if(e.mat==='plastic'||e.mat==='acrylic'){S.snap(p);P.emit(p,{count:6,color:[0.2,0.2,0.22],size:0.012,life:0.8,spread:1.5,grav:9});}else{S.thud(p,1.1);P.emit(p,{count:10,color:[0.75,0.6,0.4],size:0.012,life:0.9,spread:1.5,grav:9});}
  if(e===KITCH.fridge&&e.hp<=0&&S.loops.fridge){S.stopLoop('fridge');HUD.msg('[FRIDGE COMPRESSOR DEAD]',1.5);}
  if(e.hp<=0&&(e.kind==='furniture'||e.kind==='fixture')){e.hp=3;if(e.joints.length){const j=e.joints.slice().sort((a,b)=>a.pryWork-b.pryWork)[0];breakJoint(j);HUD.msg(`[${j.label.toUpperCase()} CRACKED]`,1.2);}else if((e.mat==='chip'||e.mat==='hollow'||e.mat==='timber')&&e.size&&e.mass<6){const ax=e.mat==='timber'?grainAxisOf(e):null;spawnFragments(p,5,e.mat==='timber'?'timber':'chip',0.07,dir.clone().multiplyScalar(2),2.5,ax,e.size?Math.max(e.size.x,e.size.y,e.size.z)*0.7:0.45);removeEnt(e);}}}
function blowFraming(e,dmg,p,dir,src){/* hammer / ram on framing: pryable members (stubs, noggins, cripples) give; nailed-fast studs don't */
  if(e.dynamic){applyImpulse(e,dir.clone().multiplyScalar(dmg*2),p);S.thud(p,1.4);return;}
  if(e.pryWork&&e.kind==='stud'){e.hp-=dmg;S.groan(p,0.9);S.thud(p,1.5);P.emit(p,{count:12,color:[0.8,0.65,0.4],size:0.014,life:1,spread:1.5,grav:9});if(e.hp<=0){const d=dir.clone();if(e.noggin)d.y-=0.8;knockLoose(e,d.normalize(),p,src==='ram'?'RAMMED OFF ITS NAILS':'SMASHED LOOSE');}else{flexKick(e,p,dir);HUD.msg(`[${labelOf(e)} SHIFTS ON ITS NAILS · ${Math.max(0,e.hp).toFixed(1)}]`,0.9);}shakeCam(0.3);return;}
  S.tapStud(p);S.thud(p,1.6);P.emit(p,{count:10,color:[0.8,0.65,0.4],size:0.015,life:1,spread:1.5,grav:9});e.hp-=dmg*0.3;HUD.msg(`[SOLID ${labelOf(e)} - HOLDS]`,0.8);shakeCam(0.3);}
function blowTrim(e,dmg,p,dir){if(e.dynamic){damageProp(e,dmg,p,dir);return;}e.hp-=dmg;S.bradScreech(p);dust(p,6,0.6);if(e.hp<=0)trimOff(e,dir,p);else{flexKick(e,p,dir);HUD.msg('[TRIM LOOSENED]',0.8);}}
function impact(hit,dmg,dir,src){if(!hit)return;const p=hit.point;dir=dir||camFwd();flashHit();
  switch(hit.kind){
    case 'brick':if(dmg>2.3){chipBrick(hit.wall,hit.instanceId,p,dir);HUD.msg('[BRICK FACE CHIPPED]',1);}else{S.clink(p);S.thud(p,2);sparks(p,8,[1,0.6,0.2]);}shakeCam(0.5);break;
    case 'tile':chipTile(hit.instanceId,p);break;
    case 'screw':S.ping(p);sparks(p,5,[1,0.8,0.4]);if(dmg>2)popScrew(hit.screw,dir);break;
    case 'tube':breakTube(hit.ent,p);break;
    case 'drywall':damage(hit.ent,dmg,p,dir,src);break;
    case 'stud':case 'truss':blowFraming(hit.ent,dmg,p,dir,src);break;
    case 'trim':blowTrim(hit.ent,dmg,p,dir);break;
    case 'batt':{const e=hit.ent;S.thud(p,0.35);P.emit(p,{count:10,color:[0.93,0.66,0.7],cvar:0.06,size:0.02,life:1.4,spread:0.7,grav:1.5,drag:1.6,kind:1});if(e.dynamic)applyImpulse(e,dir.clone().multiplyScalar(dmg),p);else HUD.msg('[GLASSWOOL SOAKS UP THE BLOW]',0.8);break;}
    case 'wire':if(dmg>0.8)cutWire(hit.ent,p);break;
    case 'pipe':if(dmg>1.5)puncturePipe(hit.ent,p);else{S.clink(p);}break;
    case 'floor':{if(hit.ent.mat==='timber'&&dmg>2.6){const pl=plankAt(p.x,p.z);if(pl){pryPlank(pl,p,dir);HUD.msg('[FLOOR PLANK SPLIT OUT OF ITS CLICK JOINT]',1.4);break;}}S.thud(p,2);sparks(p,hit.ent.mat==='tile'?8:2,[1,0.7,0.3]);if(hit.ent.mat==='tile'){S.tapTile(p);hit.drawable&&hit.uv&&hit.drawable.cracks(hit.uv.x,hit.uv.y,6,'rgba(50,45,40,0.9)',18);}else if(hit.drawable&&hit.uv){hit.drawable.blot(hit.uv.x,hit.uv.y,10,'40,30,20',0.3);}shakeCam(0.3);break;}
    case 'brickwall':S.thud(p,2);break;
    case 'roofslab':S.thud(p,1);break;
    default:damageProp(hit.ent,dmg,p,dir,hit);}}
function smashKeyboard(kb,p,dir){if(!kb.alive||!kb.keyboard)return;kb.keyboard=false;kb.mesh.remove(kb.keys);rebatchEnt(kb);S.shatter(p,false);S.snap(p);P.emit(p,{count:40,color:[0.82,0.78,0.66],cvar:0.05,size:0.022,svar:0.004,life:1.4,spread:3,vel:dir||V3(0,1,0),speed:2,grav:9.8,drag:0.4});for(let i=0;i<22;i++){const e=boxEnt(0.02,0.006,0.02,p.clone().add(V3(rnd(-0.2,0.2),rnd(0,0.05),rnd(-0.1,0.1))),M.beige,{kind:'frag',mat:'plastic',mass:0.01,frag:true,shadow:false});makeDynamic(e);e.body.velocity.set(rnd(-2,2)+(dir?dir.x:0),rnd(1,4),rnd(-2,2)+(dir?dir.z:0));e.body.angularVelocity.set(rnd(-15,15),rnd(-15,15),rnd(-15,15));}wakeEnt(kb);}
function crackScreen(e,p,uv,dir,dmg){if(!e.alive)return;if(e.screenHit){e.screenHit(p,uv,dir,dmg||1);return;}const d=e.screenD;const u=uv?uv.x:0.5,v=uv?uv.y:0.5;
  if(e.screenOK){e.screenOK=false;d.cracks(u,v,14,'rgba(10,10,10,0.9)',22);d.cracks(u,v,8,'rgba(230,230,255,0.5)',40);d.blot(u,v,60,'10,10,20',0.9);sparks(p,30,[0.8,0.85,1]);S.shatter(p,true);S.arc(p);e.screenMesh.material.emissiveIntensity=0.15;HUD.msg('[PANEL FRACTURED]',1.5);}
  else{d.fill('#0a0a10');e.screenMesh.material.emissiveIntensity=0;shards(p,20,[0.3,0.3,0.4]);S.shatter(p,true);}}

/* ============================================================ PRYING WITH VISIBLE FLEX
   Before a fastener lets go, whatever the claw/bar is seated in physically moves: sheets bow out along the face normal,
   skirting rotates off its bottom edge, stubs swing about their nailed end, planks lift on their far end - up to 18 mm. */
function flexEnt(e,amt,mode){if(!e.mesh||!e.alive||e.dynamic)return;if(!e.flexBase){unbatchEnt(e);e.mesh.updateMatrixWorld(true);e.flexBase={p:e.mesh.position.clone(),q:e.mesh.quaternion.clone()};e.unflex=(keep)=>{if(!keep&&e.flexBase&&e.mesh){e.mesh.position.copy(e.flexBase.p);e.mesh.quaternion.copy(e.flexBase.q);}e.flexBase=null;e.unflex=null;SHADOW.dirty=true;};}
  const B=e.flexBase;if(mode.hinge){const ang=amt/mode.arm;const q=new THREE.Quaternion().setFromAxisAngle(mode.axis,ang);e.mesh.position.copy(B.p).sub(mode.pivot).applyQuaternion(q).add(mode.pivot);e.mesh.quaternion.copy(q).multiply(B.q);}else{e.mesh.position.copy(B.p).addScaledVector(mode.n,amt);e.mesh.quaternion.copy(B.q);}SHADOW.dirty=true;}
function flexMode(e,n){/* how a member moves when levered toward the player (n = surface normal facing the player) */n=n.clone();if(e.kind==='trim'){const nn=(e.normal||n).clone();if(e.trimType==='skirt'){const up=V3(0,1,0);const pivot=e.mesh.position.clone().addScaledVector(up,-0.0325).addScaledVector(nn,-0.006);return{hinge:true,pivot,axis:up.clone().cross(nn).normalize(),arm:0.065};}return{n:nn};}
  if(e.kind==='stud'&&e.axis==='v'){const w=e.wall;const up=w.up.clone();n.addScaledVector(up,-n.dot(up));if(n.lengthSq()<1e-4)n.copy(w.normal);n.normalize();const atBottom=e.from<=0.046;const pivot=wallPoint(w,e.cross,atBottom?e.from:e.to,e.depth);const dirFree=atBottom?up:up.clone().negate();return{hinge:true,pivot,axis:dirFree.clone().cross(n).normalize(),arm:Math.max(0.15,e.to-e.from)};}
  if(e.kind==='stud'){return{n:n.normalize()};}if(e.kind==='batt')return{n:(e.wall?e.wall.normal.clone():n)};return{n};}
function flexKick(e,p,dir){/* a blow that doesn't free a member still knocks it out of true for a moment */const n=dir.clone().negate();const m=flexMode(e,n);flexEnt(e,0.012,m);after(0.09,()=>{if(e.alive&&!e.dynamic&&e.unflex)e.unflex(false);});}
function pryTarget(hit){const e=hit.ent;if(!e)return null;const n=hit.normal.clone();const base={point:hit.point.clone(),normal:n,work:0,flexV:0,popped:0};
  if(hit.kind==='drywall'&&e.attached){const uv=faceUV(e.face,hit.point);return Object.assign(base,{type:'sheet',ent:e,uv});}
  if(hit.kind==='trim'&&!e.dynamic)return Object.assign(base,{type:'trim',ent:e,mode:flexMode(e,n)});
  if(hit.kind==='batt'&&!e.dynamic)return Object.assign(base,{type:'batt',ent:e,mode:flexMode(e,n)});
  if(hit.kind==='stud'&&!e.dynamic&&e.pryWork)return Object.assign(base,{type:e.noggin?'noggin':'stub',ent:e,mode:flexMode(e,n)});
  if(hit.kind==='floor'&&e.mat==='timber'){const pl=plankAt(hit.point.x,hit.point.z);if(pl)return Object.assign(base,{type:'plank',plank:pl});}
  return null;}
function trimOff(e,toward,p){if(!e.alive||e.dynamic)return;makeDynamic(e);e.body.collisionFilterMask=-1&~16;after(0.4,()=>{if(e.body)e.body.collisionFilterMask=-1;});const t=(toward||V3()).clone();e.body.velocity.set(t.x*1.4,0.6+Math.max(0,t.y),t.z*1.4);e.body.angularVelocity.set(rnd(-2,2),rnd(-1,1),rnd(-2,2));S.bradScreech(p);setTimeout(()=>S.bradScreech(p),70);S.snap(p);dust(p,10,0.8);bentNails(p,(e.normal||V3(0,0,1)).clone(),1);HUD.msg(`[${labelOf(e)} PRIED OFF - BRADS LET GO]`,1.3);}
function yankBatt(e,toward,p){if(!e.alive||e.dynamic)return;makeDynamic(e);e.body.collisionFilterMask=-1&~16;after(0.5,()=>{if(e.body)e.body.collisionFilterMask=-1;});const t=(toward||V3()).clone();e.body.velocity.set(t.x*2.4,0.5+t.y*0.5,t.z*2.4);e.body.angularVelocity.set(rnd(-1.5,1.5),rnd(-1,1),rnd(-1.5,1.5));S.fibreRip(p);P.emit(p,{count:40,color:[0.95,0.7,0.74],cvar:0.06,size:0.025,svar:0.012,life:2.2,lvar:0.8,spread:0.8,grav:0.6,drag:2.2,kind:1});HUD.msg('[GLASSWOOL BATT PULLED · BRICK CAVITY EXPOSED]',1.4);}
function endPry(pr){/* let go: the piece springs back on its fasteners (a lifted plank just lies back down) */if(!pr)return;const e=pr.ent;if(pr.type==='sheet'&&e&&e.alive&&e.attached&&e.unflex)e.unflex(false);else if(pr.type==='plank'&&pr.plank&&pr.plank.alive&&pr.plank.lift)plankLift(pr.plank,0,pr.point);else if(e&&e.alive&&!e.dynamic&&e.unflex)e.unflex(false);pr.work=0;pr.flexV=0;SHADOW.dirty=true;}
function pryStep(pr,dw,toward,isBar){/* returns true when the piece came free */const e=pr.ent,pt=pr.point;pr.work+=dw;const groan=k=>{if(dw>0&&Math.random()<Math.min(0.45,dw*18))S.groan(pt,k);if(dw>0&&Math.random()<Math.min(0.6,dw*22))P.emit(pt,{count:2,color:[0.9,0.88,0.84],size:0.02,life:1,spread:0.35,grav:1,drag:2,kind:1});};
  switch(pr.type){
    case 'sheet':{if(!e.alive||!e.attached)return true;const live=e.screws.filter(s=>s.alive);const per=isBar?0.9:0.6;const frac=clamp(pr.work/per,0,1);const base=Math.min(0.006,0.002*pr.popped);flexChunk(e,base+(0.018-base)*frac,pr.uv);SHADOW.dirty=true;pr.flexV=frac;if(dw>0&&Math.random()<Math.min(0.5,dw*24))S.tear(pt);groan(0.5);HUD.bar(frac,`${isBar?'LEVER':'PRY'} · ${live.length} SCREWS · ${e.bonds.size} BONDS`);
      if(pr.work>=per){pr.work=0;pr.popped++;if(live.length){popScrew(live[0],toward);dust(pt,6);S.groan(pt,0.9);}else if(e.bonds.size){const n=[...e.bonds][0];breakBond(e,n);S.tear(pt);dust(pt,6);}else{detachChunk(e,toward,isBar?3:2.5,false);HUD.msg(isBar?'[SHEET TORN OFF FRAME]':'[SHEET PRIED OFF STUDS]',1.4);recomputeSupport();return true;}}return false;}
    case 'trim':{if(!e.alive||e.dynamic)return true;const frac=clamp(pr.work/(e.pryWork||0.45),0,1);flexEnt(e,0.018*frac,pr.mode);pr.flexV=frac;if(dw>0&&Math.random()<Math.min(0.5,dw*26))S.bradScreech(pt);groan(0.3);HUD.bar(frac,`PRY · ${labelOf(e)} · BRADS`);if(frac>=1){trimOff(e,toward,pt);return true;}return false;}
    case 'stub':case 'noggin':{if(!e.alive||e.dynamic)return true;const frac=clamp(pr.work/(e.pryWork||0.75),0,1);flexEnt(e,0.018*frac,pr.mode);pr.flexV=frac;groan(0.8+frac);if(dw>0&&frac>0.6&&Math.random()<dw*10)S.tone({f:1400+Math.random()*900,f1:1100,dur:0.12,type:'sawtooth',gain:0.03,pos:pt});HUD.bar(frac,`PRY · ${labelOf(e)} · SKEW NAILS`);if(frac>=1){knockLoose(e,toward,pt,'PRIED OFF ITS SKEW NAILS');return true;}return false;}
    case 'plank':{const pl=pr.plank;if(!pl.alive)return true;const need=isBar?0.8:0.9;const frac=clamp(pr.work/need,0,1);plankLift(pl,frac,pt);SHADOW.dirty=true;pr.flexV=frac;if(dw>0&&Math.random()<Math.min(0.5,dw*20))S.creak(pt);HUD.bar(frac,'PRY · FLOOR PLANK');if(frac>=1){pryPlank(pl,pt,toward);HUD.msg('[PLANK LIFTED - CLICK JOINT SNAPPED]',1.2);return true;}return false;}
    case 'batt':{if(!e.alive||e.dynamic)return true;const frac=clamp(pr.work/0.35,0,1);flexEnt(e,0.05*frac,pr.mode);pr.flexV=frac;if(dw>0&&Math.random()<dw*20)S.fibreRip(pt);HUD.bar(frac,'HOOK · GLASSWOOL BATT');if(frac>=1){yankBatt(e,toward,pt);return true;}return false;}}
  return true;}

/* ---------- HAMMER: 2nd-order spring viewmodel + 4-phase swing (wind-up, t³ whip, 45 ms hit-stop, spring rebound) ---------- */
const HP={strike:{p:V3(-0.12,0.08,-0.1),r:V3(-1.15,0.12,0.2)},tap:{p:V3(-0.02,-0.015,-0.06),r:V3(-0.72,0.02,0.06)}};
function hammerBegin(kind,pw){HA.st=kind;HA.t=0;HA.pw=pw;HA.p0.copy(VMA.ps.x);HA.r0.copy(VMA.rs.x);if(kind==='strike'){HA.dur=0.135-0.035*pw;HA.p1.copy(HP.strike.p);HA.r1.copy(HP.strike.r);S.whip(0.7+pw*0.6);}else{HA.dur=0.08;HA.p1.copy(HP.tap.p);HA.r1.copy(HP.tap.r);}}
function hammerAnim(dt){if(HA.st==='strike'||HA.st==='tap'){HA.t+=dt;const u=Math.min(1,HA.t/HA.dur);const s=HA.st==='strike'?u*u*u:u*u;VMA.kin={p:HA.p0.clone().lerp(HA.p1,s),r:HA.r0.clone().lerp(HA.r1,s)};if(u>=1){const k=HA.st;HA.st='contact';if(k==='strike')hammerSmashContact();else hammerTapContact();}}
  else if(HA.st==='tapReb'){HA.t+=dt;const u=Math.min(1,HA.t/0.025);VMA.kin={p:HP.tap.p.clone().multiplyScalar(1-0.65*u),r:HP.tap.r.clone().multiplyScalar(1-0.65*u)};if(u>=1){VMA.kin=null;VMA.ps.v.set(0,0.25,0.6);VMA.rs.v.set(6,0,0);HA.st='idle';}}}
function hammerTapContact(){const hit=castRay(2.3);if(!hit){S.whoosh();VMA.kin=null;VMA.rs.v.set(-4,0,0);HA.st='idle';return;}flashHit();const p=hit.point;
  /* short hit-stop then a sharp 25 ms rebound off the surface, with a small camera nod */VMA.freeze=0.022;VMA.onUnfreeze=()=>{HA.st='tapReb';HA.t=0;};camPunch(-0.5,0,rnd(-0.1,0.1));
  if(hit.kind==='drywall'){const f=hit.ent.face;const uv=faceUV(f,p);const b=backingAt(f,uv.u,uv.v);const tile=hit.ent.mat==='tile';if(b){S.tapStud(p);if(tile)S.tapTile(p);HUD.msg(`[RESONANCE: SOLID TIMBER ${backLabel(b)}]`,1.3);}else{if(tile){S.tapTile(p);S.tapHollow(p);}else S.tapHollow(p);const wr=wireNear(f,uv.u,uv.v);const pp=pipeNear(f,uv.u,uv.v);HUD.msg(pp?'[RESONANCE: HOLLOW CAVITY · dull pipe clunk behind]':(wr?'[RESONANCE: HOLLOW CAVITY · faint cable rattle]':'[RESONANCE: HOLLOW CAVITY]'),1.3);}P.emit(p,{count:3,color:[0.9,0.9,0.86],size:0.03,life:0.8,spread:0.3,grav:1,drag:2,kind:1});}
  else if(hit.kind==='stud'||hit.kind==='truss'){S.tapStud(p);HUD.msg(hit.ent.pryWork&&!hit.ent.dynamic?`[RESONANCE: ${labelOf(hit.ent)} - LOOSE ON ITS NAILS]`:'[RESONANCE: EXPOSED TIMBER]',1);}
  else if(hit.kind==='trim'){S.tapStud(p);HUD.msg('[RESONANCE: BRADDED TRIM]',1);}
  else if(hit.kind==='batt'){S.thud(p,0.3);HUD.msg('[RESONANCE: NONE. IT\'S FLUFF.]',1);}
  else if(hit.kind==='brick'){S.clink(p);HUD.msg('[RESONANCE: MASONRY]',1);}
  else if(hit.kind==='floor'){S.thud(p,hit.ent.mat==='tile'?3:1.2);HUD.msg(hit.ent.mat==='tile'?'[RESONANCE: TILE ON SCREED]':'[RESONANCE: FLOATING FLOOR - HOLLOW UNDERLAY]',1);}
  else{S.clink(p);if(hit.ent&&hit.ent.wakeable)damageProp(hit.ent,0.3,p,camFwd(),hit);}}
function hammerSmashContact(){const pw=HA.pw;const hit=castRay(2.3);const dir=camFwd();
  if(!hit){/* follow-through: nothing stopped the head */S.whoosh();VMA.kin=null;VMA.ps.v.set(-0.25,-0.7,-0.6);VMA.rs.v.set(-8,0.4,1.2);HA.st='idle';return;}
  /* hit-stop: the viewmodel freezes on the contact pose for 45 ms, then springs back */VMA.freeze=0.045;VMA.onUnfreeze=()=>{VMA.kin=null;VMA.ps.v.set(0.06,0.55,0.9);VMA.rs.v.set(9+pw*5,rnd(-1,1),-2.5);HA.st='idle';};
  impact(hit,1.4+pw*2.2,dir,'hammer');
  const side=hit.normal.dot(camRight());camPunch(1.3+pw*1.7,-side*0.6,-side*1.2-0.35*pw);shakeCam(0.22+0.35*pw);
  const hard=['stud','truss','brick','brickwall','pipe','screw','floor'].includes(hit.kind)||(hit.ent&&(hit.ent.mat==='metal'||hit.ent.mat==='tile'));dust(hit.point,10+Math.round(pw*14),1+pw*0.4);if(hard)sparks(hit.point,5+Math.round(pw*10),[1,0.7,0.3],hit.normal);}
function hammerSmash(pw){/* immediate (debug / test path) */HA.pw=pw;hammerSmashContact();}
function hammerTap(){hammerTapContact();}
function hammerPryStart(){const hit=castRay(2.3,{screws:true});if(!hit)return;hammer.work=0;
  if(hit.kind==='screw'){hammer.pry={kind:'screw',screw:hit.screw,point:hit.point};HUD.msg('[CLAW SEATED ON SCREW HEAD]',1);S.clink(hit.point);return;}
  if(hit.kind==='drywall'){const e=hit.ent;if(!e.attached){hammer.pry={kind:'loose',ent:e};return;}const edge=e.bonds.size<4||e.hp<(e.mat==='tile'?4.2:2.6);if(!edge){HUD.msg('[NO EDGE TO SEAT CLAW - PUNCTURE FIRST]',1.4);S.clink(hit.point);return;}}
  const pr=pryTarget(hit);if(pr){hammer.pry={kind:'flex',pr};S.clink(hit.point);HUD.msg(pr.type==='sheet'?'[CLAW SEATED BEHIND SHEET EDGE]':pr.type==='plank'?'[CLAW UNDER PLANK EDGE]':pr.type==='batt'?'[CLAW HOOKED INTO BATT]':`[CLAW SEATED BEHIND ${labelOf(pr.ent||{label:'trim'})}]`,1);vmImpulse(V3(0,0,-0.5),V3(-3,0,0));return;}
  if(hit.ent&&hit.ent.joints&&hit.ent.joints.length){hammer.pry={kind:'joint',ent:hit.ent,point:hit.point};HUD.msg(`[CLAW SEATED IN ${labelOf(hit)} JOINT]`,1);S.clink(hit.point);return;}
  if(hit.ent&&hit.ent.wakeable){hammer.pry={kind:'loose',ent:hit.ent};return;}S.clink(hit.point);}
function hammerPryUpdate(dt){const hp=hammer.pry;if(!hp)return;const px=Math.max(0,mouse.dy);const toward=camFwd().negate();
  if(hp.kind==='flex'){const done=pryStep(hp.pr,px*0.010,toward,false);hammer.flexV=hp.pr.flexV;if(done){hammer.pry=null;hammer.flexV=0;HUD.hideBar();}return;}
  const pull=px*0.004;hammer.work+=pull*3;
  if(hp.kind==='screw'){HUD.bar(hammer.work/0.5,'CLAW TORQUE');hammer.flexV=clamp(hammer.work/0.5,0,1)*0.6;if(hammer.work>=0.5){popScrew(hp.screw,toward);hammer.pry=null;hammer.flexV=0;HUD.hideBar();HUD.msg('[SCREW PULLED]',0.8);recomputeSupport();}return;}
  if(hp.kind==='joint'){const e=hp.ent;if(!e.alive||!e.joints.length){hammer.pry=null;HUD.hideBar();return;}const j=e.joints.slice().sort((a,b)=>a.pryWork-b.pryWork)[0];HUD.bar(hammer.work/j.pryWork,`PRY · ${j.label.toUpperCase()}`);hammer.flexV=clamp(hammer.work/j.pryWork,0,1);if(pull>0&&Math.random()<pull*3)S.groan(hp.point,0.5);if(hammer.work>=j.pryWork){breakJoint(j);hammer.work=0;HUD.msg(`[${j.label.toUpperCase()} SNAPPED]`,1.2);}return;}
  if(hp.kind==='loose'){if(pull>0){wakeEnt(hp.ent);applyImpulse(hp.ent,toward.clone().multiplyScalar(pull*20*Math.min(hp.ent.mass,8)));}}}

/* ---------- CROWBAR ---------- */
function crowWedge(){const hit=castRay(2.3);if(crow.wedge)endPry(crow.wedge.pr);crow.pull=0;crow.work=0;crow.checked=false;crow.locked=false;crow.flexV=0;vmImpulse(V3(-0.05,0.04,-1.1),V3(-3.5,0.4,0));if(!hit){S.whoosh();crow.wedge=null;return;}if(['wire','pipe','tube','tile','roofslab','brickwall','screw'].includes(hit.kind)||(hit.kind==='floor'&&hit.ent.mat!=='timber')){S.clink(hit.point);crow.wedge=null;HUD.msg('[NO SEAM TO WEDGE]',1);return;}
  const pr=pryTarget(hit);
  if(hit.kind==='floor'){if(!pr){S.clink(hit.point);crow.wedge=null;return;}crow.wedge={hit,ent:hit.ent,plank:pr.plank,pr,point:hit.point,normal:V3(0,1,0),heel:hit.point.clone().add(V3(0,0,0.07)),tan:V3(0,0,1)};S.creak(hit.point);HUD.msg('[TIP WEDGED UNDER FLOOR PLANK]',1.2);return;}
  if(hit.kind==='batt'){crow.wedge={hit,ent:hit.ent,pr,hook:true,point:hit.point,normal:hit.normal.clone(),heel:hit.point.clone(),tan:V3(0,-1,0)};HUD.msg('[GOOSENECK HOOKED INTO BATT]',1.2);S.thud(hit.point,0.3);return;}
  const n=hit.normal.clone();let tan=V3(0,-1,0).projectOnPlane(n);if(tan.lengthSq()<0.05){tan=V3(1,0,0).applyQuaternion(camera.getWorldQuaternion(_cq)).projectOnPlane(n);}tan.normalize();const heel=hit.point.clone().addScaledVector(tan,0.07);
  crow.wedge={hit,ent:hit.ent,pr,point:hit.point,normal:n,heel,tan};S.clink(hit.point);P.emit(hit.point,{count:4,color:[0.9,0.9,0.86],size:0.02,life:0.8,spread:0.3,grav:1,drag:2,kind:1});HUD.msg(`[TIP WEDGED: ${labelOf(hit)}]`,1.2);}
function fulcrumCheck(w){const from=w.heel.clone().addScaledVector(w.normal,0.06);const rc=new THREE.Raycaster(from,w.normal.clone().negate(),0,0.14);rc.firstHitOnly=false;const targets=hitRoot.children.filter(o=>!['bricks','tiles','screws'].includes(o.userData.kind));const hits=rc.intersectObjects(targets,true);let ent=null,obj=null;for(const h of hits){let r;if(h.object.userData.faceMesh){const c=chunkById.get(h.object.userData.triMap[h.faceIndex]);r={ent:c};}else if(h.object.userData.batch){r={ent:entById.get(h.object.userData.triMap[h.faceIndex])};}else r=entFromObject(h.object);if(r.ent&&r.ent.alive&&r.ent!==w.ent){ent=r.ent;obj=h;break;}if(r.ent===w.ent&&w.ent.kind==='drywall'){ent=r.ent;obj=h;break;}}
  if(!ent){const o=from,d=w.normal.clone().negate();for(const wl of WALLS){if(wl.kind!=='ext')continue;const den=d.dot(wl.normal);if(den>=-1e-4)continue;const t=wallPoint(wl,0,0,0.14).clone().sub(o).dot(wl.normal)/den;if(t>0&&t<0.3){return{ok:true,why:'MASONRY'};}}return{ok:false,why:'NO PURCHASE'};}
  if(ent.kind==='drywall'){if(!ent.attached)return{ok:false,why:'LOOSE SHEET'};const uv=faceUV(ent.face,obj.point);const b=backingAt(ent.face,uv.u,uv.v,0.015);if(b)return{ok:true,why:`${backLabel(b)} BACKING`,chunk:ent};return{ok:false,why:'CAVITY CRUSH',chunk:ent,point:obj.point};}
  if(ent.kind==='floor')return{ok:true,why:'SLAB'};if(ent.kind==='batt')return{ok:false,why:'HEEL SINKS INTO GLASSWOOL'};if(ent.dynamic&&ent.mass<4)return{ok:false,why:'FULCRUM SLIPPED'};return{ok:true,why:labelOf({label:ent.label,kind:ent.kind})};}
function crowLever(dt){const w=crow.wedge;if(!w)return;if(w.plank?!w.plank.alive:(!w.ent||!w.ent.alive)){crow.wedge=null;crow.flexV=0;HUD.hideBar();return;}
  if(!crow.checked){crow.checked=true;/* the heel only has to find purchase when levering a sheet or a fixed member; trim, stubs and batts bear on the frame/floor */const free=w.plank||w.hook||(w.pr&&w.pr.type!=='sheet');const r=free?{ok:true,why:w.hook?'HOOK':w.plank?'SLAB':'FRAME'}:fulcrumCheck(w);
    if(!r.ok){crow.locked=false;HUD.msg(`[FULCRUM FAILED: ${r.why}]`,1.6);if(r.chunk){/* heel punches straight through hollow board */const pp=r.point||w.heel;if(r.chunk===w.ent&&w.pr)endPry(w.pr);shardChunk(r.chunk,pp,w.normal.clone().negate(),0.7);spawnFragments(pp,3,'gypsum',0.05,w.normal.clone().multiplyScalar(-1.5));recomputeSupport();camPunch(-1.0,0,0.4);vmImpulse(V3(0,-0.2,-0.6),V3(-6,0,1));}S.crumble(w.heel,0.6);shakeCam(0.3);crow.wedge=null;crow.flexV=0;HUD.hideBar();return;}
    crow.locked=true;HUD.msg(`[FULCRUM LOCKED: HIGH TORQUE · ${r.why}]`,1.6);S.clink(w.heel);}
  if(!crow.locked)return;const px=Math.max(0,mouse.dy);const pull=px*0.0045;crow.pull=clamp(crow.pull*0.9+pull*3,0,1);const lev=0.6/0.05;const dwork=pull*lev*0.11;crow.work+=dwork;const toward=camFwd().negate();const e=w.ent;
  if(w.pr){const done=pryStep(w.pr,px*0.022,toward,true);crow.flexV=w.pr.flexV;if(done){crow.wedge=null;crow.flexV=0;HUD.hideBar();}return;}
  if(dwork>0&&Math.random()<0.25){S.tear(w.point);}
  if(w.hit.kind==='brick'){HUD.bar(crow.work/2.2,'LEVER · MASONRY');crow.flexV=clamp(crow.work/2.2,0,1)*0.3;if(crow.work>=2.2){chipBrick(w.hit.wall,w.hit.instanceId,w.point,toward);crow.wedge=null;crow.flexV=0;HUD.hideBar();HUD.msg('[BRICK LEVERED OUT]',1.2);}return;}
  if(e.kind==='drywall'&&!e.attached){applyImpulse(e,toward.clone().multiplyScalar(dwork*40));return;}
  if(e.kind==='stud'||e.kind==='truss'){HUD.bar(crow.work/3,'LEVER · TIMBER');if(e.dynamic){applyImpulse(e,toward.clone().multiplyScalar(dwork*60));return;}crow.flexV=Math.min(0.25,crow.work/12);if(dwork>0&&Math.random()<0.2)S.groan(w.point,1.2);if(crow.work>=3){crow.work=0;HUD.msg('[TIMBER CREAKS - NAILED TOP AND BOTTOM. SAW IT.]',1.6);S.snap(w.point);P.emit(w.point,{count:10,color:[0.8,0.65,0.4],size:0.012,life:1,spread:1.2,grav:9});}return;}
  if(e.joints&&e.joints.length){const j=e.joints.slice().sort((a,b)=>a.pryWork-b.pryWork)[0];j.acc=(j.acc||0)+dwork;HUD.bar(j.acc/j.pryWork,`LEVER · ${j.label.toUpperCase()}`);crow.flexV=clamp(j.acc/j.pryWork,0,1);if(dwork>0&&Math.random()<0.15)S.groan(w.point,0.6);if(j.acc>=j.pryWork){breakJoint(j);HUD.msg(`[${j.label.toUpperCase()} POPPED]`,1.3);if(e.alive)applyImpulse(e,toward.clone().multiplyScalar(3*Math.min(e.mass,10)),w.point);if(!e.joints.length){crow.wedge=null;crow.flexV=0;HUD.hideBar();}}return;}
  wakeEnt(e);applyImpulse(e,toward.clone().multiplyScalar(dwork*25*Math.min(e.mass,12)),w.point);HUD.bar(crow.pull,'LEVER · LOOSE');}

/* ---------- SAWZALL ---------- */
const AX=['x','y','z'];
function updateKerf(e,hit){/* a flush, paper-thin dark slice inside the member (0.046 x 0.004 x depth), deepening with the cut */const s=e.size;if(!s||!e.mesh)return;e.mesh.updateMatrixWorld(true);const mw=e.mesh.matrixWorld;const qw=new THREE.Quaternion();e.mesh.getWorldQuaternion(qw);
  if(!e.kerfI){const sz=[s.x,s.y,s.z];const L=sz.indexOf(Math.max(...sz));const nl=hit.normal.clone().applyQuaternion(qw.clone().invert());const cand=[0,1,2].filter(i=>i!==L);const E=Math.abs(nl[AX[cand[0]]])>=Math.abs(nl[AX[cand[1]]])?cand[0]:cand[1];const A=cand.find(i=>i!==E);const sg=Math.sign(nl[AX[E]])||1;const lp=e.mesh.worldToLocal(hit.point.clone());const at=clamp(lp[AX[L]],-sz[L]/2+0.012,sz[L]/2-0.012);e.kerfI={L,E,A,sg,at,sz};}
  const K=e.kerfI;const depth=Math.max(0.002,K.sz[K.E]*clamp(e.cut,0,1));const sc=[0,0,0],ps=[0,0,0];sc[K.L]=0.004;sc[K.A]=K.sz[K.A]+0.001;sc[K.E]=depth+0.0006;ps[K.L]=K.at;ps[K.A]=0;ps[K.E]=K.sg*(K.sz[K.E]/2-depth/2+0.0003);
  if(!e.kerf){e.kerf=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),M.kerf);e.kerf.renderOrder=1;e.kerfLocal=!e.batched&&!!e.mesh.parent;if(e.kerfLocal)e.mesh.add(e.kerf);else scene.add(e.kerf);}
  if(e.kerfLocal){e.kerf.position.set(ps[0],ps[1],ps[2]);e.kerf.quaternion.identity();}else{e.kerf.position.copy(V3(ps[0],ps[1],ps[2]).applyMatrix4(mw));e.kerf.quaternion.copy(qw);}e.kerf.scale.set(sc[0],sc[1],sc[2]);}
function kerfWorldPoint(e,fallback){if(!e.kerfI||!e.mesh)return fallback;const K=e.kerfI;const v=V3();v[AX[K.L]]=K.at;e.mesh.updateMatrixWorld(true);return v.applyMatrix4(e.mesh.matrixWorld);}
function sawUpdate(dt){if(saw.bind>0){saw.bind-=dt;anim.bind=Math.max(0,saw.bind/0.7);S.sawLoad(1);if(saw.bind<=0){anim.bind=0;}return;}anim.bind=0;
  if(!mouse.l){if(saw.active){S.sawOn(false);saw.active=false;}saw.lastEnt=null;saw.last=null;saw.load=lerp(saw.load,0,dt*5);saw.contact=lerp(saw.contact,0,1-Math.exp(-dt*12));HUD.hideBar();return;}
  if(!saw.active){S.init();S.sawOn(true);saw.active=true;}const hit=castRay(1.75);if(!hit){saw.load=lerp(saw.load,0,dt*6);saw.contact=lerp(saw.contact,0,1-Math.exp(-dt*12));S.sawLoad(0);saw.lastEnt=null;saw.last=null;HUD.hideBar();return;}
  saw.contact=lerp(saw.contact,1,1-Math.exp(-dt*14));
  const e=hit.ent,p=hit.point,dir=camFwd();let load=0.1,hard=0.2;
  /* plasterboard / chipboard / anything with a canvas: a 3 px kerf line drawn into the texture */if(hit.drawable&&hit.uv&&saw.last&&saw.last.drawable===hit.drawable&&Math.abs(hit.uv.x-saw.last.uv.x)<0.2&&Math.abs(hit.uv.y-saw.last.uv.y)<0.2){hit.drawable.stroke(saw.last.uv.x,saw.last.uv.y,hit.uv.x,hit.uv.y,'rgba(22,19,16,0.9)',3);}
  switch(hit.kind){
    case 'drywall':{const tile=e.mat==='tile';load=tile?0.55:0.2;hard=tile?0.75:0.25;e.cut+=dt/(tile?1.3:0.45);if(tile){sparks(p,2,[1,0.7,0.4]);if(Math.random()<0.3)S.sparks(p);}else{dust(p,2,0.6);if(Math.random()<0.3)P.emit(p,{count:2,color:[0.9,0.88,0.84],size:0.015,life:0.7,spread:1.2,grav:9});}const f=e.face;const uv=faceUV(f,p);
      if(saw.lastEnt&&saw.lastEnt!==e&&saw.lastEnt.kind==='drywall'&&e.bonds.has(saw.lastEnt)){breakBond(e,saw.lastEnt);S.tear(p);}
      if(e.attached){HUD.bar(e.cut,tile?'KERF · TILE + CEMENT SHEET':'KERF · PLASTERBOARD');const b=backingAt(f,uv.u,uv.v,0.004);if(b&&e.cut>0.5){load=0.7;hard=0.6;b.cut+=dt/2.6;if(b.mesh)updateKerf(b,{point:facePoint(f,uv.u,uv.v,0.0105),normal:f.normal});if(b.cut>=1){b.cut=0;splitTimberAny(b,p);}}if(e.cut>0.35){const wr=wireNear(f,uv.u,uv.v);if(wr)cutWire(wr,p);const pp=pipeNear(f,uv.u,uv.v);if(pp&&!pp.leaking)puncturePipe(pp,p);}
        if(e.cut>=1){for(const n of[...e.bonds])breakBond(e,n);for(const sc of e.screws.slice())hideScrew(sc);detachChunk(e,dir,1.2);HUD.msg('[SHEET CUT FREE]',1.2);recomputeSupport();}}
      else{if(e.cut>=1.6){spawnFragments(p,5,tile?'tile':'gypsum',0.06,V3(0,0.5,0),1.5);removeEnt(e);}}break;}
    case 'stud':case 'truss':{load=0.85;hard=0.65;const ang=player.angSpeed;if(e.cut>0.12&&e.cut<0.92&&ang>3.6){saw.bind=0.7;HUD.msg('[BLADE BIND - KICKBACK]',1.4);shakeCam(0.9);/* binding jolt: tool kicks up and twists, camera snaps */vmImpulse(V3(0.02,0.08,0.35),V3(5,rnd(-1.5,1.5),3.5));camPunch(1.8,rnd(-0.8,0.8),rnd(-1.2,1.2));player.pitch+=(Math.random()-0.5)*0.25;player.yaw+=(Math.random()-0.5)*0.25;S.snap(p);S.thud(p,0.5);e.cut=Math.max(0,e.cut-0.08);break;}
      e.cut+=dt/2.4;P.emit(p,{count:3,color:[0.82,0.66,0.4],cvar:0.1,size:0.012,svar:0.005,life:0.9,spread:1.5,vel:dir,speed:-1.5,grav:9,drag:0.5});updateKerf(e,hit);
      HUD.bar(e.cut,`KERF · ${labelOf(hit)} ${e.size&&Math.min(e.size.x,e.size.y,e.size.z)<0.05?'90×45':''}`);if(e.cut>=1){e.cut=0;splitTimberAny(e,kerfWorldPoint(e,p),dir);}break;}
    case 'trim':{load=0.3;hard=0.3;e.cut=(e.cut||0)+dt/0.5;P.emit(p,{count:2,color:[0.85,0.8,0.7],size:0.012,life:0.8,spread:1.2,grav:8});updateKerf(e,hit);HUD.bar(e.cut,`KERF · ${labelOf(e)}`);if(e.cut>=1){e.cut=0;splitPart(e,kerfWorldPoint(e,p),dir);}break;}
    case 'batt':{load=0.08;hard=0.05;P.emit(p,{count:4,color:[0.95,0.7,0.74],cvar:0.06,size:0.02,life:1.6,spread:0.9,grav:0.8,drag:2,kind:1});if(Math.random()<0.05)HUD.msg('[BLADE CHEWING GLASSWOOL]',0.6);break;}
    case 'brick':case 'brickwall':load=0.65;hard=1;sparks(p,6,[1,0.55,0.15],dir.clone().negate());S.sparks(p);S.tone({f:3200+Math.random()*600,dur:0.06,type:'sawtooth',gain:0.08,pos:p});HUD.msg('[BLADE SKATING ON MASONRY]',0.6);break;
    case 'wire':cutWire(e,p);break;
    case 'cord':cutCord(e.cord,e,p);break;
    case 'pipe':load=0.5;hard=e.waste?0.3:0.8;sparks(p,e.waste?0:4,[1,0.7,0.3]);e.cut=(e.cut||0)+dt/(e.waste?0.5:0.9);HUD.bar(e.cut,e.waste?'KERF · PVC':'KERF · COPPER');if(e.cut>=1&&!e.leaking)puncturePipe(e,p);break;
    case 'tube':breakTube(e,p);break;
    case 'tile':load=0.6;hard=0.9;sparks(p,5,[1,0.5,0.2],dir.clone().negate());S.sparks(p);HUD.msg('[BLADE SKATING ON TERRACOTTA]',0.6);break;
    case 'floor':{if(e.mat==='timber'){load=0.3;hard=0.4;const pl=plankAt(p.x,p.z);if(pl){pl.cut=(pl.cut||0)+dt/0.8;HUD.bar(pl.cut,'KERF · OAK PLANK');P.emit(p,{count:2,color:[0.7,0.55,0.35],size:0.012,life:0.8,spread:1.2,grav:9});if(pl.cut>=1){pryPlank(pl,p,dir);HUD.msg('[PLANK CUT THROUGH]',1);}}}else{load=0.7;hard=1;sparks(p,8,[1,0.6,0.2]);S.sparks(p);}break;}
    case 'screw':hard=1;sparks(p,6,[1,0.7,0.3]);S.sparks(p);break;
    default:{if(e.mat==='ceramic'||e.mat==='china'||e.mat==='glass'||e.mat==='terra'){shatterEnt(e,p);break;}
      if(e.can){burstCan(e,p);break;}if(e.milk){milkBurst(e,p);break;}
      if(hit.object&&hit.object.userData.coolant&&!FRIDGE.dead){load=0.5;hard=0.7;sparks(p,4,[1,0.7,0.3]);e.cut=(e.cut||0)+dt/0.7;HUD.bar(e.cut,'KERF · CONDENSER COIL');if(e.cut>=1){e.cut=0;FRIDGE.dead=true;S.stopLoop('fridge');S.noise({dur:2.2,gain:0.35,type:'highpass',f:3000,f1:1800,pos:p});P.emit(p,{count:90,color:[0.92,0.95,0.98],cvar:0.03,size:0.07,svar:0.03,life:2.6,lvar:0.8,spread:0.9,grav:-0.2,drag:1.3,kind:1});onSpark(p);HUD.msg('[CONDENSER LINE CUT - REFRIGERANT HISSING OUT]',2);}break;}
      if(e.onSawn&&!e.sawnDone){load=0.55;hard=0.6;sparks(p,3,[1,0.75,0.35],dir.clone().negate());if(Math.random()<0.3)S.sparks(p);e.cut=(e.cut||0)+dt/0.9;HUD.bar(e.cut,`KERF · ${labelOf(hit)}`);if(e.cut>=1){e.cut=0;e.sawnDone=true;e.onSawn(p,dir);}break;}
      if(e.mat==='metal'||e.mat==='copper'){load=0.75;hard=1;sparks(p,8,[1,0.6,0.2],dir.clone().negate());S.sparks(p);S.tone({f:2800+Math.random()*900,dur:0.05,type:'sawtooth',gain:0.07,pos:p});if(Math.random()<dt*3)onSpark(p);if(!e.wakeThreshold)wakeEnt(e);e.cut=(e.cut||0)+dt/6;if(e.size&&e.cut>=1){e.cut=0;splitPart(e,p,dir);}else if(e.size)HUD.bar(e.cut,'KERF · STEEL (SLOW)');break;}
      if(e.keyboard){smashKeyboard(e,p,dir);break;}
      const soft=e.mat==='foam'||e.mat==='fabric'||e.mat==='leaf';load=soft?0.15:0.35;hard=soft?0.1:0.4;e.cut=(e.cut||0)+dt/(soft?0.6:(e.mat==='hollow'?0.5:0.9));P.emit(p,{count:3,color:soft?[0.85,0.78,0.55]:[0.72,0.56,0.35],size:0.012,life:0.8,spread:1.4,grav:7});if(Math.random()<0.2)S.clatter(p);
      if(e.size){if(e.mat==='timber'&&!soft)updateKerf(e,hit);HUD.bar(e.cut,`KERF · ${labelOf(hit)}`);if(e.cut>=1){e.cut=0;splitPart(e,e.kerfI?kerfWorldPoint(e,p):p,dir);}}else{if(e.cut>=1){e.cut=0;if(e.joints.length){const j=e.joints[0];breakJoint(j);HUD.msg(`[${j.label.toUpperCase()} SAWN]`,1);}else{wakeEnt(e);}}}}}
  /* hardness-scaled mechanical chatter into the camera */saw.hard=lerp(saw.hard,hard,1-Math.exp(-dt*10));const a=0.035*saw.hard*saw.contact+0.006;camPunch(rnd(-a,a),rnd(-a,a)*0.6,rnd(-a,a)*0.8);
  saw.load=lerp(saw.load,load,dt*8);S.sawLoad(saw.load);saw.last={drawable:hit.drawable,uv:hit.uv};saw.lastEnt=e;}
function splitTimberAny(e,p,dir){if(!e.alive)return;let ok=false;dir=dir||camFwd();if(e.dynamic){/* loose timber: plain part split */ok=splitPart(e,p,dir);if(ok)return;}else if(e.kind==='stud')ok=splitTimber(e,p);else if(e.kind==='truss')ok=splitTruss(e,p);
  if(ok){HUD.msg(`[${(e.label||'TIMBER').toUpperCase()} SEVERED - RECALCULATING SUPPORT]`,1.5);structuralUpdate();}else{if(e.kerf){e.kerf.parent&&e.kerf.parent.remove(e.kerf);e.kerf=null;e.kerfI=null;}HUD.msg('[CUT TOO CLOSE TO END - MOVE ALONG THE MEMBER]',1.2);}}

/* ---------- HANDS: grab-bracket reticle, sticky carry, rip tension, timber battering ram ---------- */
function isRam(e){if(!e||!e.size)return false;const L=Math.max(e.size.x,e.size.y,e.size.z);return L>=0.35&&(e.kind==='stud'||e.kind==='truss'||e.kind==='trim'||e.label==='floor plank'||(e.mat==='timber'&&e.kind==='furniture'&&e.mass<12));}
function grabInfo(h){if(!h||!h.ent)return null;const e=h.ent;if(h.kind==='cord')return'GRAB · '+labelOf(e);if(e.kin&&!e.dynamic)return'LMB / E · '+e.useLabel();if(e.pullOff&&partAttached(e))return'PULL · '+labelOf(e);if(h.kind==='drywall'&&e.attached){return`RIP · ${e.screws.filter(s=>s.alive).length} SCREWS · ${e.bonds.size} BONDS`;}if(h.kind==='batt'&&!e.dynamic)return'GLASSWOOL BATT · HOLD + PULL';if(['brick','floor','brickwall','wire','pipe','tube','tile','screw','roofslab'].includes(h.kind))return null;if((h.kind==='stud'||h.kind==='truss'||h.kind==='trim')&&!e.dynamic)return null;if(!e.body&&!e.mkBody)return null;if(e.door&&!e.dynamic)return'DOOR · HOLD TO PULL';if(e.mass>48)return`${labelOf(e)} · TOO HEAVY · SHOVE`;return`${isRam(e)?'TIMBER':'GRAB'} · ${labelOf(e)} · ${e.mass.toFixed(1)} kg`;}
function handsGrab(){const hit=castRay(2.4);if(!hit)return;const e=hit.ent;if(!e)return;
  if(hit.kind==='drywall'&&e.attached){const live=e.screws.filter(s=>s.alive).length;grab={ent:e,tension:0,strength:(e.mat==='tile'?2.5:1.4)+1.1*live+0.6*e.bonds.size,point:hit.point};HUD.msg(`[GRIPPING SHEET EDGE · ${live} SCREWS · ${e.bonds.size} BONDS]`,1.2);S.clink(hit.point);return;}
  if(e.kin&&!e.dynamic){e.use();return;}
  if(e.pullOff&&partAttached(e)){grab={ent:e,tension:0,strength:e.pullOff,point:hit.point,pull:true};S.clink(hit.point);HUD.msg(`[GRIPPING ${labelOf(e)} - PULL]`,1);return;}
  if(hit.kind==='cord'){wakeEnt(e);pickUp(e,clamp(hit.distance,0.6,1.2));return;}
  if(hit.kind==='batt'&&!e.dynamic){grab={ent:e,tension:0,strength:0.6,point:hit.point,batt:true,mode:flexMode(e,hit.normal)};S.thud(hit.point,0.3);HUD.msg('[FISTFUL OF GLASSWOOL - PULL]',1);return;}
  if(['stud','truss'].includes(hit.kind)&&!e.dynamic){HUD.msg(e.pryWork?'[NAILED ON - PRY, SMASH OR KICK IT LOOSE]':'[FRAMING IS NAILED IN - SAW IT FIRST]',1.2);return;}
  if(hit.kind==='trim'&&!e.dynamic){HUD.msg('[BRADDED ON - CLAW OR BAR IT OFF]',1.2);return;}
  if(['brick','floor','brickwall','wire','pipe','tube','tile','screw','roofslab'].includes(hit.kind))return;if(!e.body&&!e.mkBody)return;
  if(e.door&&!e.dynamic){wakeEnt(e);held={ent:e,dist:clamp(hit.distance,0.7,1.5),t:0,door:true};HUD.msg('[HAND ON DOOR - PULL]',1);return;}
  if(e.mass>48){wakeEnt(e);HUD.msg('[TOO HEAVY TO LIFT - SHOVED]',1);applyImpulse(e,camFwd().multiplyScalar(40),hit.point);return;}
  wakeEnt(e);if(!e.dynamic)return;pickUp(e,hit.distance);}
function pickUp(e,dist){held={ent:e,dist:clamp(dist||1.1,0.7,1.5),t:0,ram:isRam(e),thrust:-1,hitDone:false};e.body.angularDamping=0.9;e.body.linearDamping=0.3;if(held.ram){/* the ram passes through the player's own capsule */held.mask=e.body.collisionFilterMask;e.body.collisionFilterMask=e.body.collisionFilterMask&~2;held.axis=(()=>{const s=e.size;return s.x>=s.y&&s.x>=s.z?V3(1,0,0):(s.y>=s.z?V3(0,1,0):V3(0,0,1));})();}HUD.msg(`[${held.ram?'SHOULDERED':'HOLDING'} ${labelOf(e)} · ${e.mass.toFixed(1)}kg${held.ram?' · LMB = RAM':''}]`,1.2);}
function drop(){if(!held)return;const e=held.ent;if(e.alive&&e.body){e.body.angularDamping=e.adamp||0.12;e.body.linearDamping=e.damp||0.04;if(held.mask!==undefined)e.body.collisionFilterMask=held.mask;}held=null;}
function throwHeld(){if(!held)return;const e=held.ent;if(held.door){drop();return;}const m=e.mass;const v=clamp(19/(0.45+m*0.1),2.5,19);const f=camFwd();drop();if(!e.alive)return;e.body.wakeUp();e.body.velocity.set(f.x*v+player.vel.x,f.y*v+1+player.vel.y,f.z*v+player.vel.z);e.body.angularVelocity.set(rnd(-4,4),rnd(-4,4),rnd(-4,4));S.whoosh();HUD.msg(`[THROWN · ${v.toFixed(1)} m/s]`,0.8);}
function ramThrust(){if(!held||!held.ram||held.thrust>=0)return;held.thrust=0;held.hitDone=false;S.whip(1.3);S.whoosh();}
function handsUpdate(dt){if(grab){const e=grab.ent;const still=grab.batt?!e.dynamic:grab.pull?partAttached(e):e.attached;if(!e.alive||!still||!mouse.l){if(grab.batt&&e.alive&&!e.dynamic&&e.unflex)e.unflex(false);grab=null;HUD.hideBar();return;}const pull=Math.max(0,mouse.dy)*0.012+(keys.KeyS?dt*1.8:0);grab.tension=Math.max(0,grab.tension+pull-dt*0.3);const k=grab.tension/grab.strength;HUD.bar(k,grab.batt?'PULL · GLASSWOOL':grab.pull?'PULL · '+labelOf(e):'RIP TENSION');
    if(grab.pull){if(pull>0&&Math.random()<0.25)S.groan(grab.point,0.35);if(grab.tension>=grab.strength){detachPart(e);wakeEnt(e);if(!e.dynamic)makeDynamic(e);S.snap(grab.point);S.click(grab.point,1800);HUD.msg(`[${labelOf(e)} PULLED OUT]`,1.2);grab=null;HUD.hideBar();pickUp(e,0.9);}return;}
    if(grab.batt){flexEnt(e,0.05*clamp(k,0,1),grab.mode);if(pull>0&&Math.random()<0.3)P.emit(grab.point,{count:2,color:[0.95,0.7,0.74],size:0.02,life:1.4,spread:0.4,grav:0.5,drag:2,kind:1});if(grab.tension>=grab.strength){yankBatt(e,camFwd().negate(),grab.point);grab=null;HUD.hideBar();pickUp(e,1.0);}return;}
    if(pull>0&&Math.random()<0.3){S.tear(grab.point);P.emit(grab.point,{count:2,color:[0.9,0.9,0.86],size:0.025,life:1,spread:0.4,grav:1,drag:2,kind:1});}if(pull>0&&Math.random()<0.15)S.groan(grab.point,0.4);
    if(grab.tension>=grab.strength){const toward=camFwd().negate();detachChunk(e,toward,1.5,true);HUD.msg('[SHEET RIPPED FREE - SCREWS LEFT IN STUD]',1.4);recomputeSupport();grab=null;HUD.hideBar();pickUp(e,1.1);}return;}
  if(held){const e=held.ent;if(!e.alive){held=null;return;}if(held.door&&!mouse.l){drop();return;}const f=camFwd();const cam=camera.getWorldPosition(V3());const b=e.body;b.wakeUp();
    if(held.door){const target=cam.addScaledVector(f,held.dist);const d=target.sub(toT(b.position));const dd=d.clone();dd.y=0;if(dd.length()>1.6){drop();return;}b.applyForce(toC(dd.multiplyScalar(220)),b.position);return;}
    if(held.ram){/* timber at the hip, long axis down the line of sight; LMB drives it 0.75 m forward in 90 ms */const L=Math.max(e.size.x,e.size.y,e.size.z);let ext=0;if(held.thrust>=0){held.thrust+=dt;const t=held.thrust;ext=t<0.09?0.75*(t/0.09):Math.max(0,0.75*(1-(t-0.09)/0.22));
        if(t>=0.08&&!held.hitDone){held.hitDone=true;const hit=castRay(0.3+L*0.5+0.85);if(hit&&hit.ent!==e){const dmg=clamp(1.8+e.mass*0.55,2,6);impact(hit,dmg,f,'ram');camPunch(1.2,rnd(-0.3,0.3),rnd(-0.5,0.5));shakeCam(0.45);S.thud(hit.point,2.2);held.thrust=Math.max(held.thrust,0.09);}}if(t>0.31)held.thrust=-1;}
      const r=camRight();const target=cam.clone().addScaledVector(f,0.25+L*0.3+ext).addScaledVector(r,0.2).add(V3(0,-0.24,0));const d=target.sub(toT(b.position));if(d.length()>2.6){drop();HUD.msg('[LOST GRIP]',0.8);return;}const gain=held.thrust>=0?34:14,mx=held.thrust>=0?15:9;const v=d.multiplyScalar(gain);if(v.length()>mx)v.setLength(mx);b.velocity.set(v.x+player.vel.x*0.6,v.y,v.z+player.vel.z*0.6);
      const want=new THREE.Quaternion().setFromUnitVectors(held.axis,f.clone().add(V3(0,0.08,0)).normalize());const cur=new THREE.Quaternion(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w);if(cur.dot(want)<0)want.set(-want.x,-want.y,-want.z,-want.w);cur.slerp(want,1-Math.exp(-dt*18));b.quaternion.set(cur.x,cur.y,cur.z,cur.w);b.angularVelocity.set(0,0,0);return;}
    const target=cam.addScaledVector(f,held.dist);const d=target.sub(toT(b.position));if(d.length()>2.2){drop();HUD.msg('[LOST GRIP]',0.8);return;}const v=d.multiplyScalar(12);const mx=9;if(v.length()>mx)v.setLength(mx);b.velocity.set(v.x+player.vel.x*0.5,v.y,v.z+player.vel.z*0.5);b.angularVelocity.scale(0.85,b.angularVelocity);}}
let reticleT=0;
function updateReticle(dt){const el=HUD.el.grab,info=HUD.el.grabInfo;if(!el||!el.style)return;if(SEAT.active){el.style.display='none';info.style.display='none';HUD.el.cross.style.display='none';return;}if(tool!==3||!locked){if(el.style.display!=='none'){el.style.display='none';info.style.display='none';HUD.el.cross.style.display='';}return;}el.style.display='block';HUD.el.cross.style.display='none';
  let st='idle',size=26,txt='';
  if(grab){const k=clamp(grab.tension/grab.strength,0,1);st='tension';size=Math.round(lerp(54,18,k));txt=`TENSION ${String(Math.round(k*100)).padStart(3,' ')}% · ${grab.batt?'GLASSWOOL':grab.pull?labelOf(grab.ent):`${grab.ent.screws.filter(s=>s.alive).length} SCREWS · ${grab.ent.bonds.size} BONDS`}`;}
  else if(held){st='hold';size=held.thrust>=0?22:34;const e=held.ent;txt=held.door?'DOOR · PULL':`${labelOf(e)} · ${e.mass.toFixed(1)} kg · ${held.ram?'LMB RAM':'LMB DROP'} · RMB THROW · E DROP`;}
  else{reticleT-=dt;if(reticleT<=0){reticleT=1/30;const h=castRay(2.4);updateReticle.last=grabInfo(h);}if(updateReticle.last){st='target';size=56;txt=updateReticle.last;}}
  if(el.className!==st)el.className=st;const px=size+'px';if(el.style.width!==px){el.style.width=px;el.style.height=px;}if(info.textContent!==txt)info.textContent=txt;info.style.display=txt?'block':'none';}

/* ---------- KICK ---------- */
function bootKick(){if(kick.cd>0)return;kick.cd=0.55;anim.kick=1;S.kick();shakeCam(0.5);camPunch(-0.6,0,0);const hit=castRay(1.7);if(!hit)return;const p=hit.point,dir=camFwd();const e=hit.ent;flashHit();
  if(hit.kind==='drywall'){if(!e.attached){applyImpulse(e,dir.clone().multiplyScalar(6*Math.min(e.mass,3)),p);return;}const f=e.face;const uv=faceUV(f,p);const b=backingAt(f,uv.u,uv.v,0.03);const tile=e.mat==='tile';if(!b&&!tile){const wr=wireNear(f,uv.u,uv.v);if(wr)cutWire(wr,p);const pp=pipeNear(f,uv.u,uv.v);if(pp)puncturePipe(pp,p);shardChunk(e,p,dir,1.5);spawnFragments(p,3,'gypsum',0.07,dir.clone().multiplyScalar(3));HUD.msg('[UNBACKED PLASTERBOARD CAVED IN]',1.4);dust(p,24,1.3);recomputeSupport();}else{damage(e,tile?2.0:2.4,p,dir,'kick');if(b){HUD.msg(`[BOOT MET ${backLabel(b)} - SOLID]`,1);S.tapStud(p);}}return;}
  if(hit.kind==='brick'||hit.kind==='brickwall'||(hit.kind==='floor')){S.thud(p,2.5);shakeCam(0.4);HUD.msg(hit.kind==='floor'?'[STOMP]':'[OW. MASONRY.]',0.8);if(hit.kind==='floor'&&e.mat==='timber'){const pl=plankAt(p.x,p.z);if(pl&&Math.random()<0.25){pryPlank(pl,p,dir);HUD.msg('[LOOSE PLANK FLIPPED]',1);}}return;}
  if(hit.kind==='stud'||hit.kind==='truss'){if(e.dynamic){applyImpulse(e,dir.clone().multiplyScalar(5*e.mass),p);return;}if(e.pryWork){e.hp-=3.2;S.thud(p,1.6);S.groan(p,1);if(e.hp<=0)knockLoose(e,dir,p,'KICKED OFF ITS NAILS');else{flexKick(e,p,dir);HUD.msg(`[${labelOf(e)} GIVES A LITTLE]`,0.9);}return;}S.tapStud(p);S.thud(p,1.5);HUD.msg('[FRAMING HOLDS]',0.8);return;}
  if(hit.kind==='trim'){if(!e.dynamic){trimOff(e,dir,p);return;}}
  if(hit.kind==='batt'){S.thud(p,0.3);P.emit(p,{count:12,color:[0.93,0.66,0.7],size:0.02,life:1.4,spread:0.8,grav:1,drag:2,kind:1});if(e.dynamic)applyImpulse(e,dir.clone().multiplyScalar(4),p);return;}
  if(hit.kind==='tube'){breakTube(e,p);return;}if(hit.kind==='wire'){cutWire(e,p);return;}if(hit.kind==='pipe'){puncturePipe(e,p);return;}if(hit.kind==='tile'){chipTile(hit.instanceId,p);return;}
  if(e.screenHit&&e.mat==='glass'){crackScreen(e,p,null,dir,3.2);return;}if(e.mat==='ceramic'||e.mat==='china'||e.mat==='glass'||e.mat==='terra'){shatterEnt(e,p);return;}if(e.keyboard){smashKeyboard(e,p,dir);return;}
  if(e.door){wakeEnt(e);const m=e.body.mass;e.body.wakeUp();applyImpulse(e,dir.clone().multiplyScalar(m*4.5),p);if(e.mat==='hollow'&&Math.random()<0.5&&e.onHardHit)e.onHardHit(p,5);if(e.hingeJoint&&e.hingeJoint.intact&&e.mat==='hollow'&&Math.random()<0.35){breakJoint(e.hingeJoint);HUD.msg('[DOOR KICKED OFF ITS HINGES]',1.4);}else HUD.msg('[DOOR KICKED]',0.8);return;}
  if(e.onHit)e.onHit(p,3.2,dir);if(!e.alive)return;if(e.can){burstCan(e,p);}if(e.milk)milkBurst(e,p);dentEnt(e,p,dir,3.2);
  if(e.joints&&e.joints.length){const j=e.joints.slice().sort((a,b)=>a.pryWork-b.pryWork)[0];if(j.pryWork<=1.0){breakJoint(j);HUD.msg(`[${j.label.toUpperCase()} KICKED OUT]`,1.2);}}
  wakeEnt(e);if(e.dynamic){const m=e.body.mass;const dv=clamp(95/m,1.6,7);e.body.velocity.set(dir.x*dv,dv*0.25+0.5,dir.z*dv);e.body.angularVelocity.set(rnd(-2,2),rnd(-2,2),rnd(-2,2));}
  if(e.mat==='metal')S.clatter(p);else S.thud(p,1.2);if(e===KITCH.fridge)HUD.msg('[FRIDGE PUNTED]',0.9);}

/* ---------- TEXTA ---------- */
function textaUpdate(dt){if(!mouse.l){texta.last=null;S.squeak(0);return;}const hit=castRay(1.35);if(!hit||!hit.drawable||!hit.uv){texta.last=null;S.squeak(0);if(hit)HUD.msg('[SURFACE WON\'T TAKE INK]',0.4);return;}
  if(texta.last&&texta.last.drawable===hit.drawable){const d=hit.drawable;const w=Math.max(6,d.canvas.width*0.0075);const du=hit.uv.x-texta.last.uv.x,dv=hit.uv.y-texta.last.uv.y;if(Math.abs(du)<0.5&&Math.abs(dv)<0.5){d.stroke(texta.last.uv.x,texta.last.uv.y,hit.uv.x,hit.uv.y,'#141210',w);const sp=Math.hypot(du*d.canvas.width,dv*d.canvas.height)/dt;texta.speed=lerp(texta.speed,sp,0.3);S.squeak(clamp(texta.speed/900,0.05,1));}}else{S.init();S.startSqueak();hit.drawable.stroke(hit.uv.x,hit.uv.y,hit.uv.x+0.0005,hit.uv.y,'#141210',Math.max(6,hit.drawable.canvas.width*0.0075));}
  texta.last={drawable:hit.drawable,uv:hit.uv};}

/* ============================================================ TOOL DISPATCH */
function updateTools(dt){kick.cd=Math.max(0,kick.cd-dt);if(SEAT.active){if(keys.KeyE&&!keys._eLock){keys._eLock=true;standUp();}if(!keys.KeyE)keys._eLock=false;if(keys.KeyF)keys._fLock=true;mouse.lp=mouse.rp=mouse.lr=mouse.rr=false;mouse.dx=0;mouse.dy=0;return;}if(keys.KeyF&&!keys._fLock){keys._fLock=true;bootKick();}if(!keys.KeyF)keys._fLock=false;
  if(keys.KeyE&&!keys._eLock){keys._eLock=true;if(held)drop();else useTarget();}if(!keys.KeyE)keys._eLock=false;
  if(tool===0){hammerAnim(dt);
    if(mouse.lp&&HA.st==='idle'&&!hammer.pry){hammer.charging=true;hammer.t=0;HA.st='charge';}
    if(hammer.charging){hammer.t+=dt;anim.charge=clamp((hammer.t-0.2)/0.9,0,1);if(hammer.t>0.22)HUD.bar(anim.charge,'IMPACT CHARGE');if(mouse.lr||!mouse.l){hammer.charging=false;HUD.hideBar();if(hammer.t<0.22)hammerBegin('tap',0);else hammerBegin('strike',clamp((hammer.t-0.2)/0.9,0.25,1));anim.charge=0;}}
    if(mouse.rp&&!hammer.charging&&HA.st==='idle')hammerPryStart();if(mouse.r&&hammer.pry)hammerPryUpdate(dt);if(mouse.rr){if(hammer.pry&&hammer.pry.pr)endPry(hammer.pry.pr);hammer.pry=null;hammer.flexV=0;HUD.hideBar();}}
  else if(tool===1){if(mouse.lp){crowWedge();}if(mouse.r&&crow.wedge)crowLever(dt);else{crow.pull=lerp(crow.pull,0,dt*5);}if(mouse.rr){if(crow.wedge&&crow.wedge.pr)endPry(crow.wedge.pr);crow.flexV=0;crow.checked=false;HUD.hideBar();}}
  else if(tool===2){sawUpdate(dt);}
  else if(tool===3){if(mouse.lp){if(held&&!held.door){if(held.ram)ramThrust();else drop();}else if(!grab)handsGrab();}handsUpdate(dt);if(mouse.rp&&held)throwHeld();if(mouse.lr){if(grab){if(grab.batt&&grab.ent.alive&&!grab.ent.dynamic&&grab.ent.unflex)grab.ent.unflex(false);grab=null;HUD.hideBar();}}}
  else if(tool===4){textaUpdate(dt);}
  mouse.lp=mouse.rp=mouse.lr=mouse.rr=false;mouse.dx=0;mouse.dy=0;}

/* ============================================================ INPUT */
const overlay=document.getElementById('overlay');
function bindInput(){document.addEventListener('keydown',e=>{if(e.code==='Tab')e.preventDefault();keys[e.code]=true;if(!locked)return;if(e.code==='KeyL'){flashOn=!flashOn;S.clatter(player.pos);HUD.msg(flashOn?'[WORK LIGHT ON]':'[WORK LIGHT OFF]',0.8);}if(e.code==='KeyP'){perfMode=!perfMode;applyQuality();}if(SEAT.active){SEAT.def.key(e.code);return;}if(e.code.startsWith('Digit')){const n=parseInt(e.code.slice(5));if(n>=1&&n<=5)setTool(n-1);}});
  document.addEventListener('keyup',e=>{keys[e.code]=false;});
  document.addEventListener('mousedown',e=>{if(!locked)return;if(SEAT.active){SEAT.def.down(e.button);S.resume();return;}if(e.button===0){mouse.l=true;mouse.lp=true;}if(e.button===2){mouse.r=true;mouse.rp=true;}S.resume();});
  document.addEventListener('mouseup',e=>{if(SEAT.active&&SEAT.def.up)SEAT.def.up(e.button);if(e.button===2)EX.ads=false;if(e.button===0){mouse.l=false;mouse.lr=true;}if(e.button===2){mouse.r=false;mouse.rr=true;}});
  document.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('mousemove',e=>{if(!locked)return;if(SEAT.active){SEAT.def.look(e.movementX,e.movementY);return;}const s=0.0019;player.yaw-=e.movementX*s;player.pitch=clamp(player.pitch-e.movementY*s,-1.52,1.52);mouse.dx+=e.movementX;mouse.dy+=e.movementY;mouse.sx+=e.movementX;mouse.sy+=e.movementY;});
  document.addEventListener('wheel',e=>{if(!locked)return;if(SEAT.active){SEAT.def.wheel(e.deltaY);return;}setTool(tool+(e.deltaY>0?1:-1));},{passive:true});
  overlay.addEventListener('click',()=>{S.init();S.resume();try{canvas.requestPointerLock({unadjustedMovement:true});}catch(err){canvas.requestPointerLock();}if(!S.loops.buzz&&power&&LIGHT.tubesAlive>0)S.startBuzz();if(!S.loops.fridge&&power)S.startFridge();});
  document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;overlay.style.display=locked?'none':'flex';if(!locked){mouse.l=mouse.r=false;resetTool();}});
  window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});}
const flashlight=new THREE.SpotLight(0xfff2d8,0,9,0.55,0.5,1.3);flashlight.position.set(0.18,-0.12,0);camera.add(flashlight);const flTarget=new THREE.Object3D();flTarget.position.set(0,0,-4);camera.add(flTarget);flashlight.target=flTarget;
function applyQuality(){/* default is full quality; P is the integrated-GPU fallback */renderer.shadowMap.enabled=!perfMode;SHADOW.dirty=true;renderer.setPixelRatio(perfMode?0.75:QUALITY.pr);scene.traverse(o=>{if(o.isMesh&&o.material){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms)m.needsUpdate=true;}});HUD.msg(perfMode?'[PERFORMANCE MODE: shadows off · 75% res · minor lamps off]':'[FULL QUALITY: soft shadows · native res · every lamp]',1.4);}

/* ============================================================ MAIN LOOP */
let last=performance.now();let fpsAcc=0,fpsN=0,fpsShow=0,physMs=0,renderMs=0,drawCalls=0,drawTris=0;
function syncAll(){for(const e of dynamics){if(!e.alive||!e.mesh||!e.body)continue;const b=e.body;if(e.offL){e.mesh.position.copy(b.interpolatedPosition).add(e.offL.clone().applyQuaternion(b.interpolatedQuaternion));e.mesh.quaternion.copy(b.interpolatedQuaternion);}else syncMesh(e);}}
function cullDebris(){for(let i=dynamics.length-1;i>=0;i--){const e=dynamics[i];const p=e.body.position;if(!isFinite(p.x)||!isFinite(p.y)||!isFinite(p.z)||p.y<-20||Math.abs(p.x)>40||Math.abs(p.z)>40){removeEnt(e);continue;}const v=e.body.velocity;const sp=v.length();if(sp>14)v.scale(14/sp,v);}if(dynamics.length>190){const frags=dynamics.filter(e=>e.frag).sort((a,b)=>a.wokeAt-b.wokeAt);let n=dynamics.length-160;for(const f of frags){if(n--<=0)break;removeEnt(f);}}for(let i=dynamics.length-1;i>=0;i--){const e=dynamics[i];if(e.frag&&now-e.wokeAt>25&&e.body.sleepState===CANNON.Body.SLEEPING&&Math.random()<0.03)removeEnt(e);}}
function updateLeak(dt){for(const e of PIPES){if(!e.alive||!e.leaking)continue;const n=e.leakDir||V3(0,1,0);if(e.waste){P.emit(e.leakAt,{count:3,color:[0.35,0.3,0.2],cvar:0.05,size:0.03,svar:0.01,life:1.2,vel:V3(n.x,0.2,n.z),speed:1.2,spread:0.4,grav:9.8,drag:0.5,kind:3});}else{P.emit(e.leakAt,{count:6,color:[0.62,0.76,0.9],cvar:0.08,size:0.022,svar:0.008,life:1.4,lvar:0.3,vel:V3(n.x+rnd(-0.15,0.15),0.6+rnd(-0.2,0.2),n.z+rnd(-0.15,0.15)),speed:4.2,spread:0.5,grav:9.8,drag:0.2,kind:3});P.emit(e.leakAt,{count:1,color:[0.8,0.88,0.95],size:0.05,life:0.8,spread:0.8,grav:0.5,drag:2,kind:1});}}}
function updateShadows(){/* shadow maps re-render only when something that casts one moves (every frame while it does) or the scene changed */if(perfMode){SHADOW.dirty=false;return;}let moving=SHADOW.dirty;if(!moving){for(const e of dynamics){if(e.castsShadow&&e.body.sleepState!==2){moving=true;break;}}}if(!moving&&LIGHT.housing.dynamic&&LIGHT.housing.body.sleepState!==2)moving=true;if(moving){for(const l of SHADOW.lights)l.shadow.needsUpdate=true;SHADOW.dirty=false;}}
function loop(){requestAnimationFrame(loop);const t=performance.now();let dt=Math.min(0.05,(t-last)/1000);last=t;now+=dt;S.budget=0;
  if(locked){updateTools(dt);}else{mouse.lp=mouse.rp=mouse.lr=mouse.rr=false;mouse.dx=mouse.dy=0;mouse.sx=mouse.sy=0;}
  const t0=performance.now();if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);updateHingeLimits();updateCords();runTimers();checkJoints();physMs=lerp(physMs,performance.now()-t0,0.1);
  updateCamera(dt);updateSeat(dt);yawObj.updateMatrixWorld(true);syncAll();flushBatches();P.update(dt);updateLight(dt);updateLeak(dt);updateViewmodel(dt);updateReticle(dt);updateAppliances(dt);updateUsePrompt(dt);HUD.update(dt);cullDebris();flushDrawables(renderer);
  flashlight.intensity=flashOn?30:0;flashlight.visible=flashOn;if(arcT>0){arcT-=dt;arcLight.intensity=Math.max(0,60*arcT/0.35)*(0.6+Math.random()*0.8);}
  updateShadows();
  const t1=performance.now();renderer.clear();renderer.render(scene,camera);const calls=renderer.info.render.calls,tris=renderer.info.render.triangles;if(SEAT.blend<0.35){renderer.clearDepth();renderer.render(vmScene,vmCamera);}renderExecutioner();renderMs=lerp(renderMs,performance.now()-t1,0.1);drawCalls=calls;drawTris=tris;
  fpsAcc+=dt;fpsN++;if(fpsAcc>0.5){fpsShow=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0;HUD.el.stats.textContent=`${fpsShow} FPS · PHYS ${physMs.toFixed(1)}ms · CPU→GPU ${renderMs.toFixed(1)}ms · ${drawCalls} CALLS · ${(drawTris/1000).toFixed(0)}k TRIS · ${world.bodies.length} BODIES · ${dynamics.length} LOOSE${perfMode?' · PERF MODE':''}`;}}

/* ============================================================ BUILD WORLD */
function buildWorld(){
  for(const w of WALLS){if(w.kind==='ceiling')buildCeilingFrame();else buildWallFrame(w);}
  /* faces */const faceCols=(f)=>{const L=f.L;const us=f.wall.studU.map(u=>f.side>0?u:L-u);const arr=[0,L];for(const u of us){if(u>0.1&&u<L-0.1)arr.push(u);}for(const op of f.wall.openings){const a=f.side>0?op.u0:L-op.u1,b=f.side>0?op.u1:L-op.u0;arr.push(a,b);}return uniqSorted(arr,0.04);};
  const rows=(f)=>{const arr=[0,0.45,0.9,1.35,1.8,2.25,f.H];for(const op of f.wall.openings){arr.push(op.v1);if(op.v0>0.1)arr.push(op.v0);}return uniqSorted(arr,0.04);};
  const plasterFor=(L,H)=>mkDrawable(texPlaster(Math.round(L*256),Math.round(H*256)));const tileFor=(L,H)=>mkDrawable(texTiles(Math.round(L*256),Math.round(H*256),Math.round(0.6*256),Math.round(0.3*256)));
  const facesSpec=[[WN,1,'paper'],[WS,1,'paper'],[WE,1,'paper'],[WW,1,'paper'],[WBN,1,'paper'],[WBN,-1,'tile'],[WBW,1,'paper'],[WBW,-1,'tile'],[WNN,1,'paper'],[WNN,-1,'paper'],[WNE,1,'paper'],[WNE,-1,'paper']];
  for(const [w,side,kind] of facesSpec){const f=mkFace(w,side,kind,kind==='tile'?tileFor(w.L,w.H):plasterFor(w.L,w.H));buildSheet(f,faceCols(f),rows(f));}
  {const fE=WE.faces[0];const dE=fE.drawable;const tc=texTiles(Math.round(2.74*256),Math.round(2.7*256),Math.round(0.6*256),Math.round(0.3*256));dE.rect(0,0,2.74/WE.L,1,tc);for(const c of fE.chunks){if(c.cu<2.74){c.mat='tile';c.hp=4.2;c.label='wall tile';}}
   const fS=WS.faces[0];const dS=fS.drawable;const tc2=texTiles(Math.round(2.54*256),Math.round(2.7*256),Math.round(0.6*256),Math.round(0.3*256));dS.rect((BATH.x0+PX)/WS.L,0,1,1,tc2);for(const c of fS.chunks){if(c.cu>BATH.x0+PX){c.mat='tile';c.hp=4.2;c.label='wall tile';}}}
  const fC=mkFace(WC,1,'paper',plasterFor(WC.L,WC.H));{const cols=[0];for(let u=0.6;u<WC.L-0.1;u+=0.6)cols.push(+u.toFixed(3));cols.push(WC.L);const rws=[0];for(let v=0.6;v<WC.H-0.1;v+=0.6)rws.push(+v.toFixed(3));rws.push(WC.H);buildSheet(fC,uniqSorted(cols,0.04),uniqSorted(rws,0.04));}
  for(const w of[WN,WS,WE,WW])buildBricks(w);
  buildBatts();
  buildFloor();buildUtilities();buildDoor(WS,WS.openings[0],{solid:true,label:'entry door',angle:0});buildDoor(WBW,WBW.openings[0],{label:'bathroom door',angle:-0.9});
  buildLights();buildKitchen();buildBathroom();buildLiving();buildBed();buildDesk();buildNook();
  buildSkirting();
  for(const f of FACES){if(f.matKind==='paper')for(let i=0;i<Math.round(f.L*2);i++)f.drawable.blot(Math.random(),Math.random()*0.12,30+Math.random()*60,'40,35,30',0.3);}
  /* outside the entry door: a landing in the dark, lit by the porch light */const step=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.15,1.0),M.cement);step.position.set(-0.3,FLOOR_Y-0.08,PZ+0.75);step.receiveShadow=true;scene.add(step);const stepB=boxBody(0.8,0.075,0.5,V3(-0.3,FLOOR_Y-0.08,PZ+0.75));registerBody(stepB);
  const porch=new THREE.PointLight(0xffdba0,2,4,1.5);porch.position.set(-0.3,PH-0.3,PZ+0.5);scene.add(porch);LAMPS.push({light:porch,alive:true,minor:true});
  for(const f of FACES)for(const c of f.chunks)chunkById.set(c.id,c);
  recomputeTimber();recomputeSupport();flushBatches();BATCH_LIVE=true;}

/* ============================================================ BOOT */
HUD.init();buildWorld();buildPlayer();buildViewmodels();bindInput();
for(const f of FACES)for(const c of f.chunks)chunkById.set(c.id,c);
setTool(1);setTool(0);HUD.setPower(true);HUD.msg('[STUDIO · 6.5m × 8.5m · THE RENT IS DUE · GET YOUR BOND BACK]',4);
SUN.spots.forEach(s=>s.intensity=70);
window.__DEMO={player,world,ents,dynamics,keys,mouse,castRay,setTool,HUD,renderer,scene,camera,get locked(){return locked;},set locked(v){locked=v;},get perfMode(){return perfMode;},set perfMode(v){perfMode=v;applyQuality();},bootKick,hammerSmash,hammerTap,hammerBegin,HA,VMA,VM,FACES,WALLS,asms,P,BATTS,BATCHES,DRAWABLES,UPLOAD,shardChunk,knockLoose,structuralUpdate,pickUp,ramThrust,get held(){return held;},dbg:{anim,hammer,saw,crow,texta,HA,VMA,VM_REST,updateReticle,flexChunk,pryTarget,pryStep,endPry,applyQuality,QUALITY},FRIDGE,TV,PC,MW,KETTLE,TOAST,CORDS,useTarget,dentEnt,unplugCord,EX,SEAT,MON,EXA,sitDown,standUp,exStart,exGo,exFire,exReset,detachPart,crtImplode,makeDynamic,stats:()=>({fps:fpsShow,physMs,renderMs,calls:drawCalls,tris:drawTris,bodies:world.bodies.length,dyn:dynamics.length})};
Object.assign(window.__DEMO,{COUCH,SEATS,TVREEL,TVB,TVH,TVA,TVCAP,TVL,LIVING,tvChannel,remoteCmd,remotePop,couchWhy,tvTick,tvReelAt});
loop();
