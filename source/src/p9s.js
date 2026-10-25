
/* ============================================================ v6.4 — WS1: THE SHELL, FINISHED
   p9s — doors that open (E) and come off their hinges when you mean it, skirting and cornices, carpet you can pull up,
   windows and the dining slider that slide, a garage roller door. Villa only.
   - Doors are kinematic until knocked loose (the fridge-door pattern: kinDoor on a part of an asm, a hinge joint with soft
     limits to a static jamb); a hard hit wakes the asm and the leaf swings on a real hinge until the hinge tears.
   - Carpet is strips laid over the floor: they all share one canvas (VF.carpet, a copy of the floor's) so they batch into
     one draw call, and the floor canvas under them is repainted as bare slab and rebond underlay. E pulls a strip up into a
     roll; the saw cuts one in two. Stains land on whichever surface is on top (floorDrawableAt). */

const VS={doors:[],slides:[],strips:[],roller:null};
/* ---------- which way a door opens: into the room off the hall, or the smaller of two rooms; outside doors open in */
function vDoorRoom(a,b){if(a==='out')return b;if(b==='out')return a;if(a==='hall'||a==='entry')return b;if(b==='hall'||b==='entry')return a;const ar=r=>{const R=VROOM[r];return R?(R.x1-R.x0)*(R.z1-R.z0):99;};return ar(a)<=ar(b)?a:b;}
/* doors that start closed; the rest stand open */
const VDOOR_SHUT=new Set(['entry|out','laundry|out','wc|hall','bathx|hall','master|ensuite']);
function vDoorKey(w){return [w.rooms.front,w.rooms.back].sort().join('|');}
function villaDoor(w,op){const D=w.frameDepth,ext=w.kind==='ext';const into=vDoorRoom(w.rooms.front,w.rooms.back);const sideSign=into===w.rooms.front?1:-1;/* +1: swings toward the wall's front normal */
  const key=vDoorKey(w);const front=op.kind==='front';const jq=w.q;
  /* hinge on the end nearer a corner, so the leaf folds back against a wall */const hingeAtU0=op.u0<=w.L-op.u1;
  const jambs=[];for(const ju of[op.u0+0.0075,op.u1-0.0075]){const j=boxEnt(0.015,op.v1,0.11,wallPoint(w,ju,op.v1/2,D),M.trim,{kind:'furniture',mat:'timber',mass:3,hp:6,label:'door jamb',quat:jq});j.mesh.castShadow=false;jambs.push(j);}
  const head=boxEnt(op.u1-op.u0,0.015,0.11,wallPoint(w,(op.u0+op.u1)/2,op.v1-0.0075,D),M.trim,{kind:'furniture',mat:'timber',mass:2,hp:6,label:'door head',quat:jq});head.mesh.castShadow=false;
  /* architraves: bradded to the jambs, pryable; outside walls only get them inside (the outside is brick) */
  for(const sd of ext?[0]:[0,1]){const z=sd===0?-0.007:w.thick+0.007;const nrm=sd===0?w.normal.clone():w.normal.clone().negate();for(const au of[op.u0-0.035,op.u1+0.035])trimEnt(0.07,op.v1+0.07,0.014,wallPoint(w,au,(op.v1+0.07)/2,z),jq,{label:'architrave',trimType:'arch',normal:nrm});trimEnt(op.u1-op.u0+0.14,0.07,0.014,wallPoint(w,(op.u0+op.u1)/2,op.v1+0.035,z),jq,{label:'architrave',trimType:'arch',normal:nrm});}
  const dw=op.u1-op.u0-0.045,dh=op.v1-0.02,dt=0.035;const hu=hingeAtU0?op.u0+0.02:op.u1-0.02;const hinge=wallPoint(w,hu,dh/2+0.01,D);const along=hingeAtU0?w.right.clone():w.right.clone().negate();
  const center=hinge.clone().addScaledVector(along,dw/2+0.0075);const solid=front||ext;
  const mat=solid?(front?VS.frontMat:M.pine):VS.leafMat;const door=boxEnt(dw,dh,dt,center,mat,{kind:'furniture',mat:solid?'timber':'hollow',mass:solid?28:12,hp:solid?10:4,label:front?'front door (solid core)':(solid?'solid-core door':'hollow-core door'),quat:jq,wakeable:true,noBatch:true,cut:0,door:true});
  /* handles: brass knobs in 1987; the front door gets a deadlock and a peephole (all one mesh: one draw call per door) */const kx=(hingeAtU0?1:-1)*(dw/2-0.07);const parts=[];for(const s of[-1,1]){parts.push([new THREE.SphereGeometry(0.028,10,8),_mm4(kx,-0.05,s*0.04)],[new THREE.CylinderGeometry(0.03,0.03,0.008,12),_mm4(kx,-0.05,s*0.02,Math.PI/2)]);}
  if(front){parts.push([new THREE.CylinderGeometry(0.022,0.022,0.04,10),_mm4(kx,0.12,0,Math.PI/2)],[new THREE.CylinderGeometry(0.008,0.008,dt+0.004,8),_mm4(0,0.42,0,Math.PI/2)]);}
  const hw=new THREE.Mesh(vMergeGeos(parts),VS.brass);hw.castShadow=false;door.mesh.add(hw);
  const asm=mkAsm(front?'front door':'door');addPart(asm,door);const parent=jambs[hingeAtU0?0:1];
  const j=addJoint(asm,door,parent,'hinge',{pos:hinge,axis:V3(0,1,0),strength:solid?3500:1500,pryWork:solid?1.4:0.8,label:'door hinges'});door.hingeJoint=j;door.hingePos=hinge;
  /* opening angle: numerically, the sign that swings the free edge toward the room it opens into */const tip=a=>along.clone().applyAxisAngle(V3(0,1,0),a).dot(w.normal);const A=1.45*(tip(1)*sideSign>0?1:-1);
  limitHinge(j,parent,door,V3(0,1,0),Math.min(0,A)-0.05,Math.max(0,A)+0.05);
  kinDoor(door,parent,hinge,V3(0,1,0),A,{name:front?'FRONT DOOR':'DOOR',speed:2.6});door.kin.joint=j;
  if(!VDOOR_SHUT.has(key)){const a0=A*(0.75+srand()*0.25);poseKinDoor(door,a0);door.kin.target=A;door.kin.ang=a0;door.kin.target=a0;}
  if(!solid){door.onHardHit=(p,v)=>{if(v>4.5&&door.alive){HUD.msg('[HOLLOW-CORE DOOR SKIN SPLIT]',1.2);door.hp-=1;S.snap(p);P.emit(p,{count:10,color:[0.8,0.7,0.5],size:0.02,life:1,spread:1.5,grav:9});if(door.hp<=0){spawnFragments(p,6,'hollow',0.12,V3(0,0.5,0),2);removeEnt(door);}}};door.onHardHitV=3;
    door.onHit=(p,dmg,dir)=>{if(dmg>2.2&&door.alive){/* a fist-sized hole in the skin: cardboard honeycomb behind */S.snap(p);P.emit(p,{count:14,color:[0.75,0.62,0.42],size:0.016,life:1,spread:1.5,grav:9});if(door.drawHole)door.drawHole(p);}};}
  door.vo={w,op};VS.doors.push(door);return door;}
function texDoorLeaf(){const c=mkCanvas(128,256),x=c.getContext('2d');x.fillStyle='#ece6d6';x.fillRect(0,0,128,256);speckle(x,128,256,2400,[236,230,214],10,0.3);for(let i=0;i<4;i++)stain(x,srand()*128,160+srand()*90,10+srand()*30,'120,100,70',0.08);/* hand marks round the knob */stain(x,108,140,18,'90,70,50',0.12);stain(x,20,140,18,'90,70,50',0.12);return c;}
function texFrontDoor(){const c=mkCanvas(128,256),x=c.getContext('2d');x.fillStyle='#6a3e22';x.fillRect(0,0,128,256);for(let i=0;i<128;i+=3){x.fillStyle=`rgba(${40+srand()*30},${20+srand()*14},10,0.25)`;x.fillRect(i,0,2,256);}
  /* three raised panels, routed in the 80s by someone with a template */x.strokeStyle='rgba(30,14,6,0.7)';x.lineWidth=3;for(const [y,h] of[[18,60],[94,60],[170,68]]){x.strokeRect(18,y,92,h);x.strokeStyle='rgba(255,220,180,0.12)';x.strokeRect(21,y+3,86,h-6);x.strokeStyle='rgba(30,14,6,0.7)';}return c;}

/* ---------- skirting and cornices */
function villaTrim(){const cove=[];for(const f of VW.faces){if(!f.room||f.room.id==='garage')continue;const w=f.wall;
    /* cornice: a 45° cove where wall meets ceiling (painted, static, merged into one mesh) */const q=f.q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V3(1,0,0),-Math.PI/4));cove.push([f.L+0.06,0.088,0.012,facePoint(f,f.L/2,PH-0.031,-0.031),q]);
    if(f.matKind==='tile')continue;/* tiled rooms: tiles to the floor, no skirting */
    const ex=[];for(const op of w.openings){if(op.v0>0.05)continue;const a=f.side>0?op.u0:f.L-op.u1,b=f.side>0?op.u1:f.L-op.u0;ex.push([a-(op.kind==='door'||op.kind==='front'?0.075:0.02),b+(op.kind==='door'||op.kind==='front'?0.075:0.02)]);}
    ex.sort((a,b)=>a[0]-b[0]);let ranges=[[0.006,f.L-0.006]];for(const [a,b] of ex){const nr=[];for(const [r0,r1] of ranges){if(b<=r0||a>=r1){nr.push([r0,r1]);continue;}if(a>r0)nr.push([r0,a]);if(b<r1)nr.push([b,r1]);}ranges=nr;}
    for(const [r0,r1] of ranges){const len=r1-r0;if(len<0.12)continue;const n=Math.ceil(len/2.7);for(let k=0;k<n;k++){const a=r0+len*k/n,b=r0+len*(k+1)/n;trimEnt(b-a-0.002,0.068,0.012,facePoint(f,(a+b)/2,FLOOR_Y+0.034+0.011,-0.006),f.q,{label:'skirting board',trimType:'skirt',face:f,normal:f.normal.clone()});}}}
  VS.cove=vMerge(cove,new THREE.MeshStandardMaterial({color:0xf0ebdf,roughness:0.85}));}

/* ---------- carpet */
const VCARPET=['bed3','bed2','office','living','master','wir'];
function texUnderlay(x,w,h){/* rebond: shredded foam offcuts glued into a slab, every colour at once */x.fillStyle='#8a8a72';x.fillRect(0,0,w,h);const cols=['#b0b050','#5a8a6a','#c27a5a','#d8c070','#7a6aa0','#9aa0a8','#5a7a9a','#c0a0a0'];for(let i=0;i<w*h/10;i++){x.fillStyle=cols[(srand()*cols.length)|0];const s=1+srand()*3;x.fillRect(srand()*w,srand()*h,s,s*(0.5+srand()));}}
function villaCarpetCanvas(){/* called from villaFloor: copy the painted floor for the carpet, then paint bare slab, underlay and gripper under it */const src=floorDrawable.canvas;const c=mkCanvas(src.width,src.height);c.getContext('2d').drawImage(src,0,0);VF.carpet=mkDrawable(c);
  const x=src.getContext('2d');const k=src.width/(VF.w*VF.px);const P=(px,pz)=>[(px+0.3)*VF.px*k,(VP.D+0.3-pz)*VF.px*k];
  for(const id of VCARPET){const r=VROOM[id];const [a,b]=P(r.x0,r.z1),[c2,d]=P(r.x1,r.z0);const w=c2-a,h=d-b;x.save();x.translate(a,b);x.beginPath();x.rect(0,0,w,h);x.clip();texUnderlay(x,w,h);
    /* smooth-edge gripper 30 mm off every wall, pins up */const g=VF.px*k*0.03,gw=Math.max(2,VF.px*k*0.025);x.fillStyle='#5a4028';x.fillRect(g,g,w-2*g,gw);x.fillRect(g,h-g-gw,w-2*g,gw);x.fillRect(g,g,gw,h-2*g);x.fillRect(w-g-gw,g,gw,h-2*g);x.fillStyle='rgba(200,200,190,0.7)';for(let t=g;t<w-g;t+=4){x.fillRect(t,g+1,1,1);x.fillRect(t,h-g-gw+1,1,1);}for(let t=g;t<h-g;t+=4){x.fillRect(g+1,t,1,1);x.fillRect(w-g-gw+1,t,1,1);}
    for(let i=0;i<4;i++)stain(x,srand()*w,srand()*h,8+srand()*20,'40,30,20',0.25);x.restore();}
  floorDrawable.tex.needsUpdate=true;}
function vStripRects(){/* strips about a metre wide, running the room's long way; the master's line up with the trapdoor panel */const out=[];
  for(const id of VCARPET){const r=VROOM[id];const W=r.x1-r.x0,D=r.z1-r.z0;
    if(id==='master'){const t=VB.holes[1],cx=(t.x0+t.x1)/2,cz=(t.z0+t.z1)/2,h=0.65;const xa=cx-h,xb=cx+h,za=cz-h,zb=cz+h;out.push({room:id,x0:r.x0,x1:xa,z0:r.z0,z1:r.z1},{room:id,x0:xb,x1:r.x1,z0:r.z0,z1:r.z1},{room:id,x0:xa,x1:xb,z0:r.z0,z1:za},{room:id,x0:xa,x1:xb,z0:zb,z1:r.z1});continue;}
    if(D>=W){const n=Math.max(1,Math.round(W/1.1));for(let i=0;i<n;i++)out.push({room:id,x0:r.x0+W*i/n,x1:r.x0+W*(i+1)/n,z0:r.z0,z1:r.z1});}
    else{const n=Math.max(1,Math.round(D/1.1));for(let i=0;i<n;i++)out.push({room:id,x0:r.x0,x1:r.x1,z0:r.z0+D*i/n,z1:r.z0+D*(i+1)/n});}}
  return out;}
function vStripGeo(x0,z0,x1,z1,th){/* a thin slab in world coords whose uvs are the floor's, so the strip shows the carpet canvas where it lies */const g=new THREE.BoxGeometry(x1-x0,th,z1-z0);const P=g.attributes.position,uv=g.attributes.uv;const cx=(x0+x1)/2,cz=(z0+z1)/2;
  for(let i=0;i<P.count;i++){const wx=P.getX(i)+cx,wz=P.getZ(i)+cz;uv.setXY(i,(wx-VF.x0)/VF.w,1-(VF.z1-wz)/VF.d);}return g;}
function villaCarpet(){VS.carpetMat=new THREE.MeshStandardMaterial({map:VF.carpet.tex,roughness:1});for(const r of vStripRects())vMakeStrip(r);}
function vMakeStrip(r){const x0=vX(r.x0),x1=vX(r.x1),z0=vZ(r.z0),z1=vZ(r.z1);if(x1-x0<0.08||z1-z0<0.08)return null;const th=0.008;const g=vStripGeo(x0,z0,x1,z1,th);const m=new THREE.Mesh(g,VS.carpetMat);const pos=V3((x0+x1)/2,FLOOR_Y+0.004+th/2,(z0+z1)/2);m.position.copy(pos);m.receiveShadow=true;m.castShadow=false;
  const e=mkEnt({mesh:m,body:boxBody((x1-x0)/2,th/2,(z1-z0)/2,pos),kind:'fixture',mat:'fabric',mass:(x1-x0)*(z1-z0)*2.2,hp:999,wakeThreshold:1e9,label:'carpet',drawable:VF.carpet,shadow:false});e.strip={...r,x0w:x0,x1w:x1,z0w:z0,z1w:z1};e.useLabel='PULL UP THE CARPET';e.use=()=>vRipStrip(e);
  e.onSawn=(p)=>vCutStrip(e,p);e.onHit=(p,dmg)=>{S.thud(p,0.4);if(dmg>2)P.emit(p,{count:8,color:[0.5,0.42,0.33],size:0.01,life:0.8,spread:1,grav:4,kind:1});};VS.strips.push(e);return e;}
function vCarpetAt(x,z){for(const e of VS.strips){if(!e.alive)continue;const s=e.strip;if(x>=s.x0w&&x<=s.x1w&&z>=s.z0w&&z<=s.z1w)return e;}return null;}
function vCutStrip(e,p){if(!e.alive)return;const s=e.strip;const long=(s.x1w-s.x0w)>(s.z1w-s.z0w);removeEnt(e);S.tear(p);
  if(long){const cx=clamp(p.x-VP.ox,s.x0+0.1,s.x1-0.1);vMakeStrip({...s,x1:cx});vMakeStrip({...s,x0:cx});}else{const cz=clamp(p.z-VP.oz,s.z0+0.1,s.z1-0.1);vMakeStrip({...s,z1:cz});vMakeStrip({...s,z0:cz});}
  flushBatchesNow();HUD.msg('[CARPET CUT · E TO PULL A PIECE UP]',1.2);}
function flushBatchesNow(){const bl=BATCH_LIVE;BATCH_LIVE=false;flushBatches();BATCH_LIVE=bl;}
function vRipStrip(e){if(!e.alive)return;const s=e.strip;const W=s.x1w-s.x0w,D=s.z1w-s.z0w;const alongX=W>D;const L=alongX?D:W,len=alongX?W:D;removeEnt(e);
  /* it comes up off the gripper in a long tear and rolls itself up at your feet */S.tear(V3((s.x0w+s.x1w)/2,0.05,(s.z0w+s.z1w)/2));S.fibreRip&&S.fibreRip(V3((s.x0w+s.x1w)/2,0.05,(s.z0w+s.z1w)/2));
  const r=clamp(Math.sqrt(len*L*0.009/(Math.PI*L))+0.03,0.05,0.2);const pp=camera.getWorldPosition(V3());let end;if(alongX){end=Math.abs(pp.x-s.x0w)<Math.abs(pp.x-s.x1w)?s.x0w+r:s.x1w-r;}else{end=Math.abs(pp.z-s.z0w)<Math.abs(pp.z-s.z1w)?s.z0w+r:s.z1w-r;}
  const pos=alongX?V3(end,r+0.01,(s.z0w+s.z1w)/2):V3((s.x0w+s.x1w)/2,r+0.01,end);
  const col=vCarpetColour(s.room);const m=new THREE.MeshStandardMaterial({color:col,roughness:1});const endM=new THREE.MeshStandardMaterial({map:VS.rollEnd||(VS.rollEnd=mkTex(texRollEnd(),1,1)),roughness:1,color:col});
  const g=new THREE.Group();const cyl=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L*0.98,18),[m,endM,endM]);cyl.castShadow=true;g.add(cyl);g.position.copy(pos);g.quaternion.copy(alongX?new THREE.Quaternion().setFromAxisAngle(V3(1,0,0),Math.PI/2):new THREE.Quaternion().setFromAxisAngle(V3(0,0,1),Math.PI/2));
  const b=new CANNON.Body({mass:0});b.addShape(new CANNON.Cylinder(r,r,L*0.98,10));b.position.copy(toC(pos));b.quaternion.copy(qC(g.quaternion));const roll=mkEnt({mesh:g,body:b,kind:'prop',mat:'fabric',mass:len*L*2.2,hp:40,label:'rolled-up carpet',noBatch:true,damp:0.3,adamp:0.5});makeDynamic(roll);
  dust(pos,30,1.2);HUD.msg(VS.ripped?'[CARPET UP]':'[CARPET UP · REBOND UNDERLAY AND 1987 UNDERNEATH]',1.6);VS.ripped=(VS.ripped||0)+1;SHADOW.dirty=true;}
function vCarpetColour(id){return id==='master'||id==='wir'?0x7c6a58:0x8a7258;}
function texRollEnd(){const c=mkCanvas(64,64),x=c.getContext('2d');x.fillStyle='#b8a888';x.fillRect(0,0,64,64);x.strokeStyle='rgba(60,45,30,0.7)';x.lineWidth=1.2;x.beginPath();for(let t=0;t<14*Math.PI;t+=0.1){const r=1.5+t*0.65;const px=32+Math.cos(t)*r,py=32+Math.sin(t)*r;if(t===0)x.moveTo(px,py);else x.lineTo(px,py);}x.stroke();return c;}

/* ---------- sliding windows, the dining slider, the roller door */
function vSlide(e,dir,dist,label){/* a kinematic slider: E toggles; the leaf rides back and forth on its track */e.noBatch=true;e.slide={p0:e.mesh.position.clone(),dir:dir.clone().normalize(),dist,k:0,target:0,label};e.useLabel=()=>e.slide.target>0.5?'SLIDE '+label+' SHUT':'SLIDE '+label+' OPEN';
  e.use=()=>{if(e.dynamic||!e.alive)return;e.slide.target=e.slide.target>0.5?0:1;S.noise({dur:0.5,gain:0.18,type:'bandpass',f:1800,f1:900,pos:e.mesh.position});};VS.slides.push(e);return e;}
function vSlides(dt){for(const e of VS.slides){if(!e.alive||e.dynamic)continue;const s=e.slide;if(Math.abs(s.k-s.target)<1e-4)continue;s.k+=clamp(s.target-s.k,-dt*1.6,dt*1.6);const p=s.p0.clone().addScaledVector(s.dir,s.dist*s.k);e.mesh.position.copy(p);if(e.body){e.body.position.set(p.x,p.y,p.z);e.body.aabbNeedsUpdate=true;}SHADOW.dirty=true;if(Math.abs(s.k-s.target)<1e-4)S.click(p,900);}
  const R=VS.roller;if(R&&R.e.alive&&!R.e.dynamic&&Math.abs(R.k-R.target)>1e-4){R.k+=clamp(R.target-R.k,-dt*0.45,dt*0.45);const s=1-0.97*R.k;R.e.mesh.scale.y=s;const h=R.h*s;const c=R.top.clone();c.y-=h/2;R.e.mesh.position.set(c.x,R.top.y,c.z);
    if(R.e.body){R.e.body.position.set(c.x,c.y,c.z);R.shape.halfExtents.y=Math.max(0.01,h/2);R.shape.updateConvexPolyhedronRepresentation();R.e.body.updateBoundingRadius();R.e.body.aabbNeedsUpdate=true;}SHADOW.dirty=true;
    if(Math.random()<dt*14)S.noise({dur:0.06,gain:0.12,type:'bandpass',f:700+Math.random()*400,pos:c});if(Math.abs(R.k-R.target)<1e-4)S.thud(c,0.9);}}
function texRoller(){const c=mkCanvas(64,256),x=c.getContext('2d');for(let y=0;y<256;y+=8){const g=x.createLinearGradient(0,y,0,y+8);g.addColorStop(0,'#c9c3b4');g.addColorStop(0.5,'#e8e2d2');g.addColorStop(1,'#9c968a');x.fillStyle=g;x.fillRect(0,y,64,8);}speckle(x,64,256,400,[200,194,180],14,0.3);for(let i=0;i<4;i++)stain(x,srand()*64,200+srand()*56,10+srand()*20,'90,70,40',0.2);return c;}
function villaShellOpenings(){/* the sliding leaf of every window and the dining door is the outer one (s=+1); it slides over the fixed one */
  for(const g of VOPEN.glass){if(!g.alive||!g.vo||g.vo.s<0)continue;const {w,o}=g.vo;const ow=o.u1-o.u0;vSlide(g,w.right.clone().negate(),ow/2-0.05,o.kind==='slider'?'THE DOOR':'THE WINDOW');}
  /* the garage roller door: a corrugated steel curtain that rolls up into a drum under the ceiling */
  for(const w of VW.walls)for(const o of w.openings){if(o.kind!=='roller')continue;const ow=o.u1-o.u0-0.02,oh=o.v1-0.01;const z=w.kind==='ext'?0.2:w.thick/2;const top=wallPoint(w,(o.u0+o.u1)/2,o.v1,z);
    const geo=new THREE.BoxGeometry(ow,oh,0.02,12,16,1);geo.translate(0,-oh/2,0);const rd=mkDrawable(texRoller());rd.tex.repeat.set(1,1);const mat=new THREE.MeshStandardMaterial({map:rd.tex,roughness:0.5,metalness:0.55});const mesh=new THREE.Mesh(geo,mat);mesh.position.copy(top);mesh.quaternion.copy(w.q);mesh.castShadow=true;mesh.receiveShadow=true;
    const shape=new CANNON.Box(new CANNON.Vec3(ow/2,oh/2,0.02));const b=new CANNON.Body({mass:0});b.addShape(shape);const c=top.clone();c.y-=oh/2;b.position.copy(toC(c));b.quaternion.copy(qC(w.q));
    const e=mkEnt({mesh,body:b,kind:'fixture',mat:'metal',mass:40,hp:999,wakeThreshold:1e9,noBatch:true,label:'roller door',drawable:rd});makeDentable(mesh,{max:0.06,drawable:rd});e.dentMeshes=[mesh];
    VS.roller={e,top,h:oh,shape,k:0,target:0};e.useLabel=()=>VS.roller.target>0.5?'PULL THE ROLLER DOOR DOWN':'HEAVE THE ROLLER DOOR UP';e.use=()=>{VS.roller.target=VS.roller.target>0.5?0:1;S.noise({dur:1.4,gain:0.25,type:'bandpass',f:600,f1:1100,pos:top});};
    const drum=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,ow+0.1,14),M.darkMetal);drum.rotation.z=Math.PI/2;drum.position.copy(wallPoint(w,(o.u0+o.u1)/2,o.v1+0.12,z-0.22));drum.quaternion.premultiply(w.q);scene.add(drum);}}

/* ---------- the floor under your feet: tiles crack, vinyl scuffs, the slab just thuds */
function villaFloorHit(hit,dmg,p){const r=p.y<-1?null:vRoomAtWorld(p.x,p.z);const fl=r?r.floor:'concrete';const d=hit.drawable,uv=hit.uv;
  if(fl==='tile'){S.tapTile(p);S.thud(p,2.4);sparks(p,6,[1,0.7,0.3]);if(d&&uv&&dmg>1.6)d.cracks(uv.x,uv.y,6,'rgba(50,45,40,0.9)',18);HUD.msg(dmg>1.6?'[FLOOR TILE CRACKED]':'[RESONANCE: TILE ON SLAB]',0.9);}
  else if(fl==='vinyl'){S.thud(p,1.4);if(d&&uv)d.blot(uv.x,uv.y,8,'60,50,40',0.25);HUD.msg('[VINYL ON SLAB · SCUFFED]',0.8);}
  else{S.thud(p,2);sparks(p,2,[1,0.7,0.3]);if(d&&uv)d.blot(uv.x,uv.y,10,'40,30,20',0.3);}shakeCam(0.3);}

function villaShell(){VS.leafMat=new THREE.MeshStandardMaterial({map:mkTex(texDoorLeaf(),1,1),roughness:0.7});VS.frontMat=new THREE.MeshStandardMaterial({map:mkTex(texFrontDoor(),1,1),roughness:0.6});VS.brass=new THREE.MeshStandardMaterial({color:0xb08a3a,roughness:0.3,metalness:0.9});
  for(const w of VW.walls)for(const o of w.openings)if(o.kind==='door'||o.kind==='front')villaDoor(w,o);
  villaTrim();villaCarpet();villaShellOpenings();}
