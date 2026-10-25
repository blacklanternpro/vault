
/* ============================================================ v6.2 — THE BASEMENT (B1: dig it)
   p9b — a 1987 owner's unpermitted fallout shelter under 4/23 Banksia Court. Villa only (?villa).
   - VB is a second floor plan in the same format as VP, one level down: floor 2.6 m below the house floor, ceiling = the
     underside of the house slab (0.3 m thick). Walls come from shared room edges like upstairs: room|room = timber stud with
     fibre-cement sheet (dormant until broken into), room|earth = concrete block retaining wall, the tunnel = timber lagging.
   - Two ways in, both cut into the house floor from the start (villaFloor reads VB.holes):
       garage: a chequer-plate hatch with a hasp and padlock (hammer it, lever it or saw it off), steep stairs down;
       master bedroom: a carpet panel you only notice by its hollow tap, a plywood trapdoor under it, a steel ladder down.
   - Nothing underground is built until the padlock comes off or the carpet goes (villaBasement), and once built it is
     hidden again whenever both hatches are shut and you're upstairs (VB.meshes). */

const BF=-2.6,BC=-0.3,BHT=BC-BF;/* basement floor, ceiling (slab underside), headroom 2.3 */
const VB={built:false,meshes:[],fix:[],walls:[],faces:[],group:null,hatch:null,lock:null,carpet:null,trap:null,ladder:null,visible:true,
  rooms:[
    {id:'stairs',name:'Stairs',x0:0.3,z0:4.3,x1:1.5,z1:6.3},
    {id:'airlock',name:'Airlock',x0:0.3,z0:6.3,x1:1.5,z1:8.6},
    {id:'bunk',name:'Bunk room',x0:1.5,z0:4.6,x1:6.1,z1:9.0},
    {id:'plant',name:'Plant room',x0:6.1,z0:4.6,x1:8.5,z1:9.0},
    {id:'tunnel',name:'Tunnel',x0:8.5,z0:6.3,x1:13.1,z1:7.3,h:1.9},
    {id:'escape',name:'Escape chamber',x0:13.1,z0:6.0,x1:14.5,z1:7.6}],
  open:[['stairs','airlock']],
  /* [sideA, sideB, at, width, kind, head] on the line between two spaces */
  ops:[['airlock','bunk',7.45,0.8,'steel',1.95],['bunk','plant',6.8,0.82,'door',2.0],['plant','tunnel',6.8,1.0,'mouth',1.9],['tunnel','escape',6.8,1.0,'mouth',1.9]],
  holes:[{id:'hatch',x0:0.3,z0:4.3,x1:1.2,z1:6.2},{id:'trap',x0:13.45,z0:6.45,x1:14.15,z1:7.15}],
  stair:{x0:0.32,x1:1.18,zTop:4.7,zBot:6.52,tan:Math.tan(55*Math.PI/180)}};
const VBR={};for(const r of VB.rooms)VBR[r.id]=r;
function vbRoomAt(px,pz){for(const r of VB.rooms)if(px>r.x0-1e-6&&px<r.x1+1e-6&&pz>r.z0-1e-6&&pz<r.z1+1e-6)return r;return null;}
function vbStairY(pz){const s=VB.stair;return -clamp(pz-s.zTop,0,s.zBot-s.zTop)*s.tan;}
const VBX=v=>v;/* plan → world helpers reuse vX/vZ from p9v */

/* ---------- textures */
function texChequer(){const c=mkCanvas(128,128),x=c.getContext('2d');x.fillStyle='#7d8084';x.fillRect(0,0,128,128);noiseOverlay(x,128,128,18,3);
  for(let r=0;r<8;r++)for(let i=0;i<8;i++){const cx=i*16+(r%2)*8+4,cy=r*16+4;x.save();x.translate(cx,cy);x.rotate((r+i)%2?0.7:-0.7);x.fillStyle='#9a9da1';x.fillRect(-5,-1.5,10,3);x.fillStyle='rgba(30,30,32,0.5)';x.fillRect(-5,1.5,10,1);x.restore();}
  for(let i=0;i<10;i++)stain(x,srand()*128,srand()*128,6+srand()*22,'120,70,40',0.18);return c;}
function texFC(){const S=256,c=mkCanvas(S,S),x=c.getContext('2d');x.fillStyle='#b9b7ae';x.fillRect(0,0,S,S);speckle(x,S,S,2600,[185,183,174],22,0.5);noiseOverlay(x,S,S,12,4);return c;}
function texSlabUnder(){const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#8e8b84';x.fillRect(0,0,256,256);speckle(x,256,256,3000,[142,139,132],26,0.5,1.5);
  /* formwork boards: the slab was poured onto planks, which left their grain and joints in it */for(let i=0;i<256;i+=32){x.fillStyle='rgba(60,56,50,0.22)';x.fillRect(0,i,256,2);for(let k=0;k<5;k++){x.fillStyle='rgba(255,255,255,0.05)';x.fillRect(0,i+4+k*5+srand()*3,256,1);}}
  for(let i=0;i<8;i++)stain(x,srand()*256,srand()*256,10+srand()*40,'70,60,50',0.15);return c;}
function texBunkFloor(W,H){const c=mkCanvas(W,H),x=c.getContext('2d');x.fillStyle='#77746d';x.fillRect(0,0,W,H);speckle(x,W,H,W*H/5,[119,116,109],26,0.5,1.5);for(let i=0;i<14;i++)stain(x,srand()*W,srand()*H,10+srand()*45,'40,36,30',0.25);return c;}

/* ---------- the floor of the house gets two holes (called from villaFloor) */
function vbFloorShape(sh){for(const h of VB.holes){const p=new THREE.Path();p.moveTo(vX(h.x0),-vZ(h.z0));p.lineTo(vX(h.x0),-vZ(h.z1));p.lineTo(vX(h.x1),-vZ(h.z1));p.lineTo(vX(h.x1),-vZ(h.z0));p.closePath();sh.holes.push(p);}}
function vbFloorBody(x0,z0,x1,z1,y0,y1){/* the slab as boxes around the holes */const xs=[x0,x1],zs=[z0,z1];for(const h of VB.holes){xs.push(vX(h.x0),vX(h.x1));zs.push(vZ(h.z0),vZ(h.z1));}xs.sort((a,b)=>a-b);zs.sort((a,b)=>a-b);
  const b=new CANNON.Body({mass:0});const inHole=(x,z)=>VB.holes.some(h=>x>vX(h.x0)&&x<vX(h.x1)&&z>vZ(h.z0)&&z<vZ(h.z1));
  for(let j=0;j<zs.length-1;j++){let run=null;const flush=()=>{if(run){const cx=(run[0]+run[1])/2,cz=(zs[j]+zs[j+1])/2;b.addShape(new CANNON.Box(new CANNON.Vec3((run[1]-run[0])/2,(y1-y0)/2,(zs[j+1]-zs[j])/2)),new CANNON.Vec3(cx,(y0+y1)/2,cz));run=null;}};
    for(let i=0;i<xs.length-1;i++){if(xs[i+1]-xs[i]<1e-4)continue;const mx=(xs[i]+xs[i+1])/2,mz=(zs[j]+zs[j+1])/2;if(zs[j+1]-zs[j]<1e-4||inHole(mx,mz)){flush();continue;}if(run)run[1]=xs[i+1];else run=[xs[i],xs[i+1]];}flush();}
  return b;}

/* ---------- the two entries (built with the house; they are the lids) */
function vbEntries(){const before=new Set([...scene.children,...hitRoot.children]);vbEntriesBuild();VB.entryMeshes=[...scene.children,...hitRoot.children].filter(o=>!before.has(o));}
function vbEntriesBuild(){const H=VB.holes;const hz=H[0],tp=H[1];
  /* steel angle frames round both holes, and the slab edge you see when you look down */const frame=[],edge=[],q0=new THREE.Quaternion();
  for(const h of H){const x0=vX(h.x0),x1=vX(h.x1),z0=vZ(h.z0),z1=vZ(h.z1),cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
    frame.push([w+0.08,0.006,0.04,V3(cx,0.003,z0-0.02),q0],[w+0.08,0.006,0.04,V3(cx,0.003,z1+0.02),q0],[0.04,0.006,d,V3(x0-0.02,0.003,cz),q0],[0.04,0.006,d,V3(x1+0.02,0.003,cz),q0]);
    edge.push([w,0.3,0.01,V3(cx,-0.15,z0+0.005),q0],[w,0.3,0.01,V3(cx,-0.15,z1-0.005),q0],[0.01,0.3,d,V3(x0+0.005,-0.15,cz),q0],[0.01,0.3,d,V3(x1-0.005,-0.15,cz),q0]);}
  vMerge(frame,M.darkMetal);vMerge(edge,M.cement);
  /* garage hatch: chequer plate, hinged on its west edge so it lifts and leans on the garage wall */
  {const x0=vX(hz.x0),x1=vX(hz.x1),z0=vZ(hz.z0),z1=vZ(hz.z1),w=x1-x0-0.006,d=z1-z0-0.006,pos=V3((x0+x1)/2,-0.002,(z0+z1)/2);const cm=new THREE.MeshStandardMaterial({map:mkTex(texChequer(),3,5),roughness:0.55,metalness:0.6});
    const g=new THREE.Group();const plate=new THREE.Mesh(new THREE.BoxGeometry(w,0.012,d),cm);plate.castShadow=true;plate.receiveShadow=true;g.add(plate);const hasp=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.012,0.12),M.darkMetal);hasp.position.set(w/2-0.02,0.008,0.0);g.add(hasp);g.position.copy(pos);
    const e=mkEnt({mesh:g,body:boxBody(w/2,0.006,d/2,pos),kind:'fixture',mat:'metal',mass:30,hp:999,wakeThreshold:1e9,noBatch:true,label:'steel floor hatch'});VB.hatch=e;
    kinDoor(e,VW.floor,V3(x0+0.003,0.004,(z0+z1)/2),V3(0,0,1),1.66,{name:'HATCH',speed:1.6,onChange:fr=>{if(fr>0.02&&!VB.built)villaBasement();}});
    const tog=e.use;e.use=h=>{if(VB.lock&&VB.lock.alive){S.clink(e.mesh.position);HUD.msg('[PADLOCKED · BASH, LEVER OR SAW THE LOCK OFF]',1.4);return;}tog(h);S.groan(e.mesh.position,0.5);};
    e.useLabel=()=>VB.lock&&VB.lock.alive?'PADLOCKED':(e.kin.target!==0?'CLOSE HATCH':'HEAVE THE HATCH OPEN');
    /* the padlock on a staple set in the slab, just past the hatch's free edge */const lp=V3(x1+0.035,0.035,(z0+z1)/2);const lg=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.045,0.022),new THREE.MeshStandardMaterial({color:0x9a7a2c,roughness:0.35,metalness:0.8}));lg.add(body);
    const sh=new THREE.Mesh(new THREE.TorusGeometry(0.016,0.004,6,12,Math.PI),M.chrome);sh.position.y=0.022;lg.add(sh);lg.position.copy(lp);const staple=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.02,0.05),M.darkMetal);staple.position.set(lp.x-0.01,0.01,lp.z);scene.add(staple);VB.staple=staple;
    const L=mkEnt({mesh:lg,body:boxBody(0.03,0.03,0.02,lp),kind:'fixture',mat:'metal',mass:0.4,hp:999,wakeThreshold:1e9,noBatch:true,label:'padlock'});L.hits=0;VB.lock=L;
    L.onHit=(p,dmg,dir)=>{L.hits+=dmg;sparks(p,6,[1,0.75,0.3]);S.clink(p);if(L.hits>=4.5)vbBreakLock(p,dir,'SMASHED OFF');else HUD.msg(L.hits>2.5?'[PADLOCK BENT · ONE MORE]':'[PADLOCK HOLDS]',0.9);};
    L.onSawn=(p,dir)=>vbBreakLock(p,dir,'SHACKLE CUT');}
  /* master bedroom: the trapdoor, and over it a panel of the same carpet, cut from the floor's own canvas */
  {const x0=vX(tp.x0),x1=vX(tp.x1),z0=vZ(tp.z0),z1=vZ(tp.z1),cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0-0.006;const ply=new THREE.MeshStandardMaterial({color:0x9c7d55,roughness:0.85});
    const g=new THREE.Group();const board=new THREE.Mesh(new THREE.BoxGeometry(w,0.018,w),ply);g.add(board);const ring=new THREE.Mesh(new THREE.TorusGeometry(0.03,0.005,6,14),M.chrome);ring.rotation.x=Math.PI/2;ring.position.set(w/2-0.07,0.009,0);g.add(ring);
    const pos=V3(cx,-0.009,cz);g.position.copy(pos);const e=mkEnt({mesh:g,body:boxBody(w/2,0.009,w/2,pos),kind:'fixture',mat:'timber',mass:4,hp:999,wakeThreshold:1e9,noBatch:true,label:'trapdoor'});VB.trap=e;e.hits=0;
    kinDoor(e,VW.floor,V3(x0+0.003,0,cz),V3(0,0,1),1.75,{name:'TRAPDOOR',speed:2.4,onChange:fr=>{if(fr>0.02&&!VB.built)villaBasement();}});
    const tog=e.use;e.use=h=>{if(vbCarpetDown()){vbTrapBlocked();return;}tog(h);};e.useLabel=()=>vbCarpetDown()?'PUSH':(e.kin.target!==0?'CLOSE TRAPDOOR':'LIFT THE TRAPDOOR');
    e.onHit=(p,dmg)=>{if(!vbCarpetDown())return;if(camera.getWorldPosition(_tvp).y<-0.1){e.hits+=dmg;S.thud(p,0.8);if(e.hits>=2){vbCarpetGone(p,'SLIT FROM BELOW');HUD.msg('[YOU SLIT THE CARPET THROUGH THE GAP]',1.6);}else HUD.msg('[SOMETHING ON TOP · KEEP AT IT]',1);}};
    /* the carpet panel: top = the floor canvas there, underside = hessian; a faint seam if you look for it */
    const S_=1.3,px=VF.px,cc=mkCanvas(64,64),x=cc.getContext('2d');const sx=(tp.x0+tp.x1)/2-S_/2,sz=(tp.z0+tp.z1)/2+S_/2;const fk=floorDrawable.canvas.width/(VF.w*px);/* the phone tier may have shrunk the floor canvas */x.drawImage(floorDrawable.canvas,(sx+0.3)*px*fk,(VP.D+0.3-sz)*px*fk,S_*px*fk,S_*px*fk,0,0,64,64);x.strokeStyle='rgba(0,0,0,0.05)';x.lineWidth=1;x.strokeRect(0.5,0.5,63,63);/* a seam you'd only see if you were looking for it */
    const cg=new THREE.Group();const top=new THREE.PlaneGeometry(S_,S_);top.rotateX(-Math.PI/2);{const uv=top.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));}const ct=new THREE.CanvasTexture(cc);ct.colorSpace=floorDrawable.tex.colorSpace;ct.anisotropy=8;const tm=new THREE.Mesh(top,new THREE.MeshStandardMaterial({map:ct,roughness:0.92}));/* same texture settings and roughness as the floor it was cut from */tm.position.y=0.003;tm.receiveShadow=true;cg.add(tm);
    const bot=new THREE.PlaneGeometry(S_,S_);bot.rotateX(Math.PI/2);cg.add(new THREE.Mesh(bot,new THREE.MeshStandardMaterial({color:0x8a7a5c,roughness:1})));const cpos=V3(cx,0.006,cz);cg.position.copy(cpos);
    const c=mkEnt({mesh:cg,body:boxBody(S_/2,0.004,S_/2,cpos),kind:'fixture',mat:'fabric',mass:3,hp:999,wakeThreshold:1e9,noBatch:true,label:'carpet'});VB.carpet=c;c.found=false;
    kinDoor(c,VW.floor,V3(cx+S_/2,0.006,cz),V3(0,0,1),-Math.PI*0.985,{name:'CARPET',speed:3.2,onChange:fr=>{if(fr>0.3&&!VB.built)villaBasement();}});
    const peel=c.use;c.use=h=>{if(!c.found)return;if(c.kin.target!==0)return;peel(h);S.tear(c.mesh.position);HUD.msg('[CARPET PEELED BACK · THERE\'S A TRAPDOOR UNDER IT]',1.8);};c.useLabel=()=>c.found&&c.kin.target===0?'PEEL BACK THE CARPET':'';
    c.onTap=p=>{S.tapHollow(p);c.found=true;HUD.msg('[RESONANCE: HOLLOW · UNDER THE CARPET]',1.6);};
    c.onHit=(p,dmg)=>{if(dmg<1.2){S.tapHollow(p);c.found=true;HUD.msg('[HOLLOW UNDER HERE]',1.2);}else{S.thud(p,0.6);c.found=true;HUD.msg('[CARPET TAKES IT · HOLLOW UNDERNEATH]',1.2);}};
    c.onSawn=(p)=>vbCarpetGone(p,'SLIT');}
  /* where the steel ladder will be: an ent so E works on it from either end */}
function vbCarpetDown(){const c=VB.carpet;return c&&c.alive&&Math.abs(c.kin.ang)<0.5;}
function vbTrapBlocked(){const e=VB.trap;S.thud(e.mesh.position,0.7);poseKinDoor(e,0.05);setTimeout(()=>{if(e.alive&&vbCarpetDown())poseKinDoor(e,0);},180);HUD.msg('[THE TRAPDOOR LIFTS A FEW CENTIMETRES AND STOPS · SOMETHING ON TOP]',1.8);}
function vbCarpetGone(p,how){const c=VB.carpet;if(!c||!c.alive)return;const pos=c.mesh.position.clone();removeEnt(c);S.tear(pos);P.emit(pos,{count:30,color:[0.5,0.42,0.33],cvar:0.06,size:0.012,life:1.2,spread:1,grav:3,drag:1.2,kind:1});
  for(const s of[-1,1]){const f=boxEnt(0.62,0.008,1.25,pos.clone().add(V3(s*0.33,0.02,0)),new THREE.MeshStandardMaterial({color:0x7c6a58,roughness:1}),{kind:'prop',mat:'fabric',mass:1.2,hp:5,label:'carpet offcut'});makeDynamic(f);f.body.velocity.set(s*0.6,0.8,0);}
  HUD.msg(`[CARPET ${how} · THERE'S A TRAPDOOR UNDER IT]`,1.8);if(!VB.built)villaBasement();}
function vbBreakLock(p,dir,how){const L=VB.lock;if(!L||!L.alive)return;const lp=L.mesh.position.clone();removeEnt(L);S.snap(p);S.clink(p);sparks(p,14,[1,0.75,0.3]);
  const piece=boxEnt(0.05,0.045,0.022,lp.clone().add(V3(0,0.03,0)),new THREE.MeshStandardMaterial({color:0x9a7a2c,roughness:0.35,metalness:0.8}),{kind:'prop',mat:'metal',mass:0.4,hp:5,label:'busted padlock'});makeDynamic(piece);piece.body.velocity.set((dir?dir.x:0)*2+rnd(-1,1),2.2,(dir?dir.z:0)*2+rnd(-1,1));
  HUD.msg(`[PADLOCK ${how} · E TO HEAVE THE HATCH]`,1.8);if(!VB.built)villaBasement();}

/* ---------- walls of the basement, from the plan */
function vbSegments(){const lines=new Map();const add=(k,a,b)=>{if(!lines.has(k))lines.set(k,new Set());const s=lines.get(k);s.add(+a.toFixed(4));s.add(+b.toFixed(4));};
  for(const r of VB.rooms){add('h:'+r.z0,r.x0,r.x1);add('h:'+r.z1,r.x0,r.x1);add('v:'+r.x0,r.z0,r.z1);add('v:'+r.x1,r.z0,r.z1);}
  const inside=(px,pz)=>VB.rooms.find(r=>px>r.x0+1e-6&&px<r.x1-1e-6&&pz>r.z0+1e-6&&pz<r.z1-1e-6);const isOpen=(a,b)=>VB.open.some(p=>(p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a));const segs=[];
  for(const [key,set] of lines){const [o,cs]=key.split(':');const c=+cs;const pts=[...set].sort((a,b)=>a-b);let cur=null;
    for(let i=0;i<pts.length-1;i++){const m=(pts[i]+pts[i+1])/2,e=0.05;const A=o==='h'?inside(m,c-e):inside(c-e,m),B=o==='h'?inside(m,c+e):inside(c+e,m);const a=A?A.id:'out',b=B?B.id:'out';
      const wall=a!==b&&!(a==='out'&&b==='out')&&!isOpen(a,b);if(wall&&cur&&cur.a===a&&cur.b===b&&Math.abs(cur.t1-pts[i])<1e-6)cur.t1=pts[i+1];else{if(cur)segs.push(cur);cur=wall?{o,c,t0:pts[i],t1:pts[i+1],a,b}:null;}}
    if(cur)segs.push(cur);}
  for(const s of segs){const tun=s.a==='tunnel'||s.b==='tunnel';s.kind=(s.a==='out'||s.b==='out')?(tun?'lag':'block'):(tun||s.a==='escape'||s.b==='escape'?'blockpair':'int');s.front=(s.a==='out')?'b':'a';}
  return segs;}
function vbWallFor(s,name,kind){const front=s.front==='a'?-1:1;let ax,az,bx,bz;if(s.o==='h'){if(front<0){ax=s.t0;bx=s.t1;}else{ax=s.t1;bx=s.t0;}az=bz=s.c;}else{if(front<0){az=s.t1;bz=s.t0;}else{az=s.t0;bz=s.t1;}ax=bx=s.c;}
  const w=mkWall(name,vX(ax),vZ(az),vX(bx),vZ(bz),kind);for(const p of[w.a,w.b,w.origin])p.y=BF;w.H=BHT;w.villa=true;w.basement=true;w.seg=s;w.rooms={front:s.front==='a'?s.a:s.b,back:s.front==='a'?s.b:s.a};return w;}
function vbOpenings(w){const s=w.seg;for(const [p,q,at,wd,kind,head] of VB.ops){const r=w.rooms;if(!((r.front===p&&r.back===q)||(r.front===q&&r.back===p)))continue;if(!(s.t0-1e-6<=at-wd/2&&s.t1+1e-6>=at+wd/2))continue;
  const dirPos=(s.o==='h'?w.b.x>w.a.x:w.b.z>w.a.z);const t0=s.o==='h'?w.a.x-VP.ox:w.a.z-VP.oz;const u=dirPos?at-t0:t0-at;w.openings.push({u0:u-wd/2,u1:u+wd/2,v0:0,v1:head,kind,label:kind});}}
const blockGeo=new THREE.BoxGeometry(0.385,0.185,0.19);
function vbBlocks(ws){/* concrete block retaining walls: one instanced mesh for the lot, a mortar backing, colliders, and an invisible face per wall so hits land somewhere */
  let n=0;for(const w of ws)n+=Math.ceil((w.L+0.4)/0.4)*Math.ceil(BHT/0.2+1);const im=new THREE.InstancedMesh(blockGeo,new THREE.MeshStandardMaterial({color:0xd8d4cc,roughness:0.97}),n);im.receiveShadow=true;im.castShadow=false;
  const c=new THREE.Color();let k=0;const backs=[];const proxyMat=new THREE.MeshBasicMaterial({visible:false});
  for(const w of ws){const list=[];const rows=Math.ceil(BHT/0.2);
    /* a block that straddles an opening is cut to the edge, the way a brickie would, instead of left out */const clip=(u,v)=>{let a=u-0.1925,b=u+0.1925,lo=v-0.0925,hi=v+0.0925;for(const o of w.openings){if(b<=o.u0||a>=o.u1||hi<=o.v0||lo>=o.v1)continue;if(v>o.v1){lo=o.v1;continue;}if(u<o.u0)b=o.u0;else if(u>o.u1)a=o.u1;else return null;}if(b-a<0.04||hi-lo<0.03)return null;return[a,b,lo,hi];};
    for(let r=0;r<rows;r++){const off=(r%2)*0.2;for(let u=-0.2+off+0.2;u<w.L+0.2;u+=0.4){const v=0.1+r*0.2;if(v>BHT+0.05)continue;const cl=clip(u,v);if(!cl)continue;const [a,b,lo,hi]=cl;const cu=(a+b)/2,cv=(lo+hi)/2;const p=wallPoint(w,cu,cv,0.095);_m4.compose(p,w.q,V3((b-a)/0.385,(hi-lo)/0.185,1));im.setMatrixAt(k,_m4);
      const damp=v<0.45?0.7:(v<0.9?0.86:1);const g_=0.5+srand()*0.07;c.setRGB(g_*damp,(g_-0.01)*damp,(g_-0.03)*damp);im.setColorAt(k,c);list.push({u:cu,v:cv,p,alive:true,id:k});k++;}}
    backs.push([w.L+0.4,BHT,0.01,wallPoint(w,w.L/2,BHT/2,0.19),w.q]);
    const body=new CANNON.Body({mass:0});for(const [a,b,v0,v1] of vSolidRects(-0.2,w.L+0.2,0,BHT,w.openings))body.addShape(new CANNON.Box(new CANNON.Vec3((b-a)/2,(v1-v0)/2,0.095)),toC(wallPoint(w,(a+b)/2,(v0+v1)/2,0.095).sub(w.origin)),qC(w.q));body.position.copy(toC(w.origin));
    const pm=new THREE.Mesh(new THREE.PlaneGeometry(w.L,BHT),proxyMat);pm.position.copy(wallPoint(w,w.L/2,BHT/2,0.001));pm.quaternion.copy(w.q);pm.rotateY(Math.PI);
    const e=mkEnt({mesh:pm,body,kind:'blockwall',mat:'concrete',mass:0,hp:1e9,wakeThreshold:1e9,noBatch:true,label:'concrete block wall',wall:w});e.blocks=list;e.onHit=(p,dmg,dir)=>vbChipBlock(e,p,dmg,dir);w.blockEnt=e;}
  im.count=k;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();scene.add(im);VB.blockIM=im;vMerge(backs,M.mortar);}
function vbChipBlock(e,p,dmg,dir){if(dmg<2.3){S.thud(p,1.6);P.emit(p,{count:6,color:[0.7,0.69,0.66],size:0.012,life:0.7,spread:1,grav:9});HUD.msg('[RESONANCE: SOLID BLOCK · SAND BEHIND IT]',0.9);return;}
  const w=e.wall;const uv=wallUV(w,p);let best=null,bd=1e9;for(const b of e.blocks){if(!b.alive)continue;const d=Math.hypot(b.u-uv.u,b.v-uv.v);if(d<bd){bd=d;best=b;}}if(!best||bd>0.35)return;best.alive=false;
  _m4.compose(best.p.clone().addScaledVector(w.depthZ,0.04),w.q,V3(1,1,0.55));VB.blockIM.setMatrixAt(best.id,_m4);VB.blockIM.setColorAt(best.id,new THREE.Color(0x6f6c66));VB.blockIM.instanceMatrix.needsUpdate=true;VB.blockIM.instanceColor.needsUpdate=true;
  spawnFragments(best.p.clone().addScaledVector(w.normal,0.1),4,'tile',0.05,w.normal.clone().multiplyScalar(2));P.emit(p,{count:22,color:[0.72,0.7,0.66],cvar:0.06,size:0.03,life:1.2,spread:1.2,grav:3,drag:1.5,kind:1});S.snap(p);S.crumble(p,0.6);HUD.msg('[BLOCK FACE CHIPPED · IT\'S NOT GOING ANYWHERE]',1);}
function vbLagging(ws){/* the tunnel's sides: rough sawn boards behind posts; the ceiling boards come with the tunnel */const boards=[],posts=[];const TH=VBR.tunnel.h;
  for(const w of ws){for(let v=0.12;v<TH;v+=0.2)boards.push([w.L,0.18,0.025,wallPoint(w,w.L/2,v,0.03),w.q]);for(let u=0.3;u<w.L;u+=1.2)posts.push([0.1,TH,0.1,wallPoint(w,u,TH/2,-0.05),w.q]);
    const body=boxBody(w.L/2,TH/2,0.04,wallPoint(w,w.L/2,TH/2,0.04),qC(w.q));registerBody(body);}
  const r=VBR.tunnel,y=BF+TH;for(let x=r.x0;x<r.x1;x+=0.21)boards.push([0.19,0.025,r.z1-r.z0+0.12,V3(vX(x+0.1),y+0.013,vZ((r.z0+r.z1)/2)),new THREE.Quaternion()]);
  for(let x=r.x0+0.3;x<r.x1;x+=1.2)posts.push([0.1,0.1,r.z1-r.z0,V3(vX(x),y-0.05,vZ((r.z0+r.z1)/2)),new THREE.Quaternion()]);
  registerBody(boxBody((r.x1-r.x0)/2,0.05,(r.z1-r.z0)/2+0.1,V3(vX((r.x0+r.x1)/2),y+0.05,vZ((r.z0+r.z1)/2))));
  /* the earth between the tunnel's boards and the slab: a dark face where the tunnel meets the bigger rooms */
  const rough=new THREE.MeshStandardMaterial({color:0x6b5640,roughness:1});VB.lagMesh=vMerge(boards,rough);VB.postMesh=vMerge(posts,M.timber);}

/* ---------- building it */
function vbFace(w,side,room){const L=w.L;const c=(()=>{const W=Math.max(16,Math.round(L*VPXM)),H=Math.round(BHT*VPXM);const cv=mkCanvas(W,H),x=cv.getContext('2d');const b=VTEX.fc||(VTEX.fc=texFC());for(let yy=0;yy<H;yy+=256)for(let xx=0;xx<W;xx+=256)x.drawImage(b,xx,yy);for(let i=0;i<Math.ceil(L*1.5);i++)stain(x,srand()*W,H*(0.75+srand()*0.25),15+srand()*40,'60,55,45',0.16);return mkDrawable(cv);})();
  const f=mkFace(w,side,'paper',c);f.room=room;f.basement=true;const cols=vFaceCols(f);const lv=[];for(const op of w.openings){lv.push(op.v1);}const rows=uniqSorted([0,BHT,0.575,1.15,1.725,...lv].filter(v=>!lv.some(e=>Math.abs(e-v)<0.25)||lv.includes(v)||v===0||v===BHT),0.04);
  buildSheet(f,cols,rows);for(const ch of f.chunks){ch.hp=4;ch.label='fibre-cement sheet';}VB.faces.push(f);return f;}
function villaBasement(){if(VB.built)return;VB.built=true;const t0=performance.now();const before=new Set([...scene.children,...hitRoot.children]);
  const segs=vbSegments();const fe=VW.freeEnds;vTrimWalls(segs);VW.freeEnds=fe;let n=0;const blocks=[],lags=[];
  for(const s of segs){if(s.kind==='int'){const w=vbWallFor(s,'VBI'+(n++),'int');w.dormant=true;vbOpenings(w);buildWallFrame(w);VB.walls.push(w);for(const side of[1,-1]){const room=VBR[side>0?w.rooms.front:w.rooms.back];vbFace(w,side,room);}}
    else{const w=vbWallFor(s,'VBB'+(n++),'ext');WALLS.splice(WALLS.indexOf(w),1);vbOpenings(w);if(s.kind==='lag')lags.push(w);else blocks.push(w);}}
  vbBlocks(blocks);vbLagging(lags);
  /* floor: one painted concrete drawable for the whole level */const bx0=0,bx1=14.8,bz0=4.0,bz1=9.3;const px=40;const W=Math.round((bx1-bx0)*px),H=Math.round((bz1-bz0)*px);const d=mkDrawable(texBunkFloor(W,H));
  VB.floorD=d;VB.fx0=vX(bx0);VB.fz1=vZ(bz1);VB.fw=bx1-bx0;VB.fd=bz1-bz0;const fq=[],cq=[];
  for(const r of VB.rooms){fq.push([vX(r.x0),vZ(r.z0),vX(r.x1),vZ(r.z1)]);}
  const quad=(rects,y,up,uvf)=>{const pos=[],uv=[];for(const [x0,z0,x1,z1] of rects){const P_=up?[[x0,z1],[x1,z1],[x1,z0],[x0,z1],[x1,z0],[x0,z0]]:[[x0,z0],[x1,z0],[x1,z1],[x0,z0],[x1,z1],[x0,z1]];for(const [x,z] of P_){pos.push(x,y,z);uv.push(...uvf(x,z));}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;};
  const fg=quad(fq,BF+0.003,true,(x,z)=>[(x-VB.fx0)/VB.fw,1-(VB.fz1-z)/VB.fd]);const fm=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({map:d.tex,roughness:0.95}));fm.receiveShadow=true;
  VB.floor=mkEnt({mesh:fm,body:boxBody((bx1-bx0)/2,0.15,(bz1-bz0)/2,V3(vX((bx0+bx1)/2),BF-0.15,vZ((bz0+bz1)/2))),kind:'slab',mat:'concrete',mass:0,hp:9999,label:'basement floor',noBatch:true,drawable:d});
  /* ceiling: the underside of the house slab (minus the two holes), the tunnel's own boards are lower */
  const cm=new THREE.MeshStandardMaterial({map:mkTex(texSlabUnder(),1,1),roughness:0.95});cm.map.wrapS=cm.map.wrapT=THREE.RepeatWrapping;
  const cRects=[];for(const r of VB.rooms){if(r.h)continue;const xs=[r.x0,r.x1],zs=[r.z0,r.z1];for(const h of VB.holes){if(h.x1>r.x0&&h.x0<r.x1&&h.z1>r.z0&&h.z0<r.z1){xs.push(h.x0,h.x1);zs.push(h.z0,h.z1);}}xs.sort((a,b)=>a-b);zs.sort((a,b)=>a-b);
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const mx=(xs[i]+xs[i+1])/2,mz=(zs[j]+zs[j+1])/2;if(xs[i+1]-xs[i]<1e-4||zs[j+1]-zs[j]<1e-4)continue;if(VB.holes.some(h=>mx>h.x0&&mx<h.x1&&mz>h.z0&&mz<h.z1))continue;if(mx<r.x0||mx>r.x1||mz<r.z0||mz>r.z1)continue;cRects.push([vX(xs[i]),vZ(zs[j]),vX(xs[i+1]),vZ(zs[j+1])]);}}
  const cg=quad(cRects,BC,false,(x,z)=>[x/2.4,z/2.4]);const ceil=new THREE.Mesh(cg,cm);ceil.receiveShadow=true;scene.add(ceil);VB.ceil=ceil;
  /* steel beams across the bunk room, and the adjustable props under them */const beams=[];const br=VBR.bunk;for(const bx of[3.0,4.6]){const x=vX(bx),zc=vZ((br.z0+br.z1)/2),L=br.z1-br.z0;beams.push([0.1,0.012,L,V3(x,BC-0.006,zc),new THREE.Quaternion()],[0.008,0.2,L,V3(x,BC-0.1,zc),new THREE.Quaternion()],[0.1,0.012,L,V3(x,BC-0.194,zc),new THREE.Quaternion()]);}
  VB.beams=vMerge(beams,new THREE.MeshStandardMaterial({color:0x5e3b2a,roughness:0.6,metalness:0.5}));
  VB.props=[];for(const [bx,bz] of[[3.0,5.6],[3.0,8.0],[4.6,5.6],[4.6,8.0]]){const h=BHT-0.2,hy=h/2;const pr=compoundEnt([{w:0.15,h:0.012,d:0.15,x:0,y:-hy+0.006,z:0,mat:M.darkMetal},{w:0.15,h:0.012,d:0.15,x:0,y:hy-0.006,z:0,mat:M.darkMetal},{w:0.05,h:h*0.62,d:0.05,x:0,y:-hy+h*0.31,z:0,mat:new THREE.MeshStandardMaterial({color:0xc06a20,roughness:0.6,metalness:0.4})},{w:0.04,h:h*0.42,d:0.04,x:0,y:hy-h*0.21,z:0,mat:new THREE.MeshStandardMaterial({color:0xc06a20,roughness:0.6,metalness:0.4})}],V3(vX(bx),BF+hy,vZ(bz)),{kind:'furniture',mat:'metal',mass:14,hp:30,wakeThreshold:1.6,label:'adjustable steel prop'});
    pr.onHit=(p,dmg)=>{if(dmg<1.6){S.clink(p);return;}S.groan(p,1);setTimeout(()=>{dust(V3(p.x,BC-0.05,p.z),40,1.4);S.crumble(p,0.8);HUD.msg('[THE SLAB GROANS · DUST RAINS · IT HOLDS]',1.8);},250);};VB.props.push(pr);}
  /* the steel airlock door: a salvaged ship's door with a wheel, hinged into the bunk room */
  {const w=VB.walls.find(w=>w.openings.some(o=>o.kind==='steel'));if(w){const o=w.openings.find(o=>o.kind==='steel');const hinge=wallPoint(w,o.u0+0.02,0,w.thick/2);const centre=wallPoint(w,(o.u0+o.u1)/2,o.v1/2,w.thick/2);const g=new THREE.Group();const dm=new THREE.MeshStandardMaterial({color:0x4d5a4c,roughness:0.55,metalness:0.6});
    const slab=new THREE.Mesh(new THREE.BoxGeometry(o.u1-o.u0-0.04,o.v1-0.03,0.05),dm);slab.castShadow=true;g.add(slab);for(const s of[-1,1]){const wh=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.012,6,18),M.darkMetal);wh.position.set(0.12,0.05,s*0.04);g.add(wh);}
    for(let i=0;i<8;i++){const rv=new THREE.Mesh(new THREE.SphereGeometry(0.008,6,4),dm);rv.position.set(-0.33+(i%2)*0.66,-0.85+Math.floor(i/2)*0.55,0.03);g.add(rv);}g.position.copy(centre);g.quaternion.copy(w.q);
    const e=mkEnt({mesh:g,body:boxBody((o.u1-o.u0-0.04)/2,(o.v1-0.03)/2,0.025,centre,qC(w.q)),kind:'fixture',mat:'metal',mass:80,hp:999,wakeThreshold:1e9,noBatch:true,label:'steel door'});VB.door=e;
    const tryA=w.right.clone().applyAxisAngle(V3(0,1,0),1.55);kinDoor(e,VW.floor,V3(hinge.x,BF,hinge.z),V3(0,1,0),tryA.dot(w.normal)<0?1.55:-1.55,{name:'STEEL DOOR',speed:1.2});const tog=e.use;e.use=h=>{S.groan(e.mesh.position,0.6);tog(h);};}}
  /* the welded door at the end of the plant room (later) */{const r=VBR.plant;const g=new THREE.Mesh(new THREE.BoxGeometry(0.82,1.95,0.06),new THREE.MeshStandardMaterial({color:0x3f4446,roughness:0.5,metalness:0.6}));g.position.set(vX(7.3),BF+0.975,vZ(r.z0)+0.03);scene.add(g);
    const bead=[];for(const [w_,h_,x,y] of[[0.86,0.02,0,0.985],[0.86,0.02,0,-0.985],[0.02,1.99,0.42,0],[0.02,1.99,-0.42,0]])bead.push([w_,h_,0.02,V3(vX(7.3)+x,BF+0.975+y,vZ(r.z0)+0.065),new THREE.Quaternion()]);vMerge(bead,new THREE.MeshStandardMaterial({color:0x2a2622,roughness:0.4,metalness:0.7}));
    const e=mkEnt({mesh:g,body:boxBody(0.41,0.975,0.03,g.position.clone()),kind:'fixture',mat:'metal',mass:200,hp:999,wakeThreshold:1e9,noBatch:true,label:'steel door, welded shut'});e.use=()=>{S.clink(e.mesh.position);HUD.msg('[WELDED SHUT · ALL THE WAY ROUND]',1.6);};e.useLabel='TRY THE DOOR';}
  vbStairs();vbLadder();vbLights();
  for(const f of VB.faces)for(const c of f.chunks)chunkById.set(c.id,c);recomputeTimber();recomputeSupport();flushBatches();
  for(const o of[...scene.children,...hitRoot.children])if(!before.has(o))VB.meshes.push(o);
  SHADOW.dirty=true;console.log('villa: basement built in',(performance.now()-t0).toFixed(0),'ms');}

/* ---------- the stairs: steep timber treads, stringers, a pipe rail; a ramp under them for things that fall down them */
function vbStairs(){const s=VB.stair,n=11,rise=2.6/n,go=(s.zBot-s.zTop)/n;const tr=[],st=[],q0=new THREE.Quaternion();
  for(let i=0;i<n;i++){const z=s.zTop+go*(i+0.5),y=-rise*(i+1)+0.015;tr.push([s.x1-s.x0,0.035,go+0.06,V3(vX((s.x0+s.x1)/2),y,vZ(z)),q0]);}
  const ang=Math.atan(s.tan),L=Math.hypot(2.6,s.zBot-s.zTop)+0.2,qs=new THREE.Quaternion().setFromEuler(new THREE.Euler(ang,0,0));for(const x of[s.x0-0.02,s.x1+0.02])st.push([0.045,0.24,L,V3(vX(x),-1.35,vZ((s.zTop+s.zBot)/2)),qs]);
  /* a landing at the top, flush with the garage floor: you step onto it from the side, then go down */tr.push([s.x1-s.x0,0.05,s.zTop-4.3,V3(vX((s.x0+s.x1)/2),-0.025,vZ((4.3+s.zTop)/2)),q0]);registerBody(boxBody((s.x1-s.x0)/2,0.06,(s.zTop-4.3)/2,V3(vX((s.x0+s.x1)/2),-0.06,vZ((4.3+s.zTop)/2))));
  vMerge(tr,M.timber);vMerge(st,M.timber);const rail=[];const rq=new THREE.Quaternion().setFromEuler(new THREE.Euler(ang,0,0));rail.push([0.035,0.035,L,V3(vX(s.x1+0.12),-1.35+0.9,vZ((s.zTop+s.zBot)/2)),rq]);for(const z of[s.zTop+0.3,s.zBot-0.2])rail.push([0.03,0.9,0.03,V3(vX(s.x1+0.12),vbStairY(z)+0.45,vZ(z)),q0]);vMerge(rail,M.chrome);
  /* the ramp is for things that fall down the stairs; the player rides the treads in vbOnStairs and never touches it */const ramp=boxBody((s.x1-s.x0)/2,0.04,L/2,V3(vX((s.x0+s.x1)/2),-1.36,vZ((s.zTop+s.zBot)/2)),qC(qs));ramp.collisionFilterMask=~2;registerBody(ramp);}
/* ---------- the steel ladder up to the trapdoor */
function vbLadder(){const t=VB.holes[1];const x=vX(t.x0)+0.08,z0=vZ((t.z0+t.z1)/2);const parts=[],q0=new THREE.Quaternion();for(const dz of[-0.2,0.2])parts.push([0.03,2.52,0.03,V3(x,BF+1.26,z0+dz),q0]);/* stops under the slab so it never pokes through the carpet */for(let y=BF+0.3;y<0;y+=0.3)parts.push([0.02,0.02,0.4,V3(x,y,z0),q0]);
  vMerge(parts,M.darkMetal);const e=mkEnt({mesh:new THREE.Mesh(new THREE.BoxGeometry(0.1,2.6,0.45),new THREE.MeshBasicMaterial({visible:false})),body:null,kind:'fixture',mat:'metal',mass:0,hp:999,wakeThreshold:1e9,noBatch:true,label:'steel ladder'});e.mesh.position.set(x+0.02,BF+1.3,z0);VB.ladder=e;
  e.use=()=>{const b=player.body;if(b.position.y<-1)vbClimbUp();else vbClimbDown();};e.useLabel=()=>player.body.position.y<-1?'CLIMB THE LADDER':(vbTrapOpen()?'CLIMB DOWN':'');}
function vbTrapOpen(){const e=VB.trap;return !e.alive||(e.kin&&e.kin.ang>1.0);}
function vbClimbUp(){const e=VB.trap,t=VB.holes[1];if(!vbTrapOpen()){if(vbCarpetDown()){vbTrapBlocked();return;}e.use();VB.climbAt=now+0.8;return;}VB.climbAt=0;const cx=vX((t.x0+t.x1)/2),cz=vZ((t.z0+t.z1)/2);  vClimbPath([{t:0,p:null},{t:0.35,p:V3(cx,BF+0.6,cz)},{t:1.5,p:V3(cx,0.05,cz)},{t:1.9,p:V3(cx+0.75,0.4,cz)}],false);}
function vbClimbDown(){const t=VB.holes[1];if(!vbTrapOpen())return;const cx=vX((t.x0+t.x1)/2),cz=vZ((t.z0+t.z1)/2);vClimbPath([{t:0,p:null},{t:0.3,p:V3(cx,0.45,cz)},{t:1.5,p:V3(cx,BF+0.4,cz)}],true);}
function vClimbPath(path,down){const b=player.body;path[0].p=V3(b.position.x,b.position.y,b.position.z);VCL.on=true;VCL.down=down;VCL.t=0;VCL.mask=b.collisionFilterMask;b.collisionFilterMask=0;player._jumpLock=true;VCL.path=path;S.step(true);}
/* ---------- lights: battens with pull cords on their own circuit, a bulb in the tunnel */
function vbLights(){const add=(px,pz,kind,room,len)=>{const x=vX(px),z=vZ(pz),y=kind==='bulb'?BF+VBR.tunnel.h-0.12:BC-0.07;const m=kind==='bulb'?new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),new THREE.MeshStandardMaterial({color:0xfff3d0,emissive:0xffd890,emissiveIntensity:0})):new THREE.Mesh(new THREE.BoxGeometry(len||1.2,0.05,0.09),new THREE.MeshStandardMaterial({color:0xf2f2ee,emissive:0xeef4ff,emissiveIntensity:0}));
    m.position.set(x,y,z);scene.add(m);const f={x,z,y:y-0.06,i:kind==='bulb'?3.2:(len&&len<1?5:7),col:kind==='bulb'?0xffd4a0:0xe8f0ff,room,lvl:'b',on:true,mesh:m,base:kind==='bulb'?2.4:2.0};VL.fix.push(f);VB.fix.push(f);
    if(kind!=='bulb'){const cord=new THREE.Mesh(new THREE.CylinderGeometry(0.002,0.002,0.42,4),M.darkMetal);cord.position.set(x+0.5*(len||1.2)/1.2,y-0.23,z);const bead=new THREE.Mesh(new THREE.SphereGeometry(0.012,6,4),M.beige);bead.position.set(cord.position.x,y-0.45,z);scene.add(bead);
      const e=mkEnt({mesh:cord,body:null,kind:'fixture',mat:'plastic',mass:0,hp:999,wakeThreshold:1e9,noBatch:true,label:'pull cord'});e.use=()=>{f.on=!f.on;S.click&&S.click(cord.position);HUD.msg(f.on?'[CLICK · ON]':'[CLICK · OFF]',0.6);};e.useLabel=()=>f.on?'PULL CORD (OFF)':'PULL CORD (ON)';}};
  add(0.9,7.4,'batten',VBR.airlock,0.6);add(3.8,5.8,'batten',VBR.bunk);add(3.8,7.8,'batten',VBR.bunk);add(7.3,6.8,'batten',VBR.plant);add(10.8,6.8,'bulb',VBR.tunnel);add(13.8,6.3,'bulb',VBR.escape);}

/* ---------- per frame: stairs, visibility, light level */
function vbUnderground(){return camera.getWorldPosition(_tvp).y<-0.35;}
function vbOnStairs(dt){/* the player is a ball: on a 55° stair it would slide; inside the stairwell it rides the treads instead */const b=player.body,s=VB.stair;if(!VB.built)return false;
  const px=b.position.x-VP.ox,pz=b.position.z-VP.oz;if(px<s.x0-0.05||px>s.x1+0.05||pz<s.zTop-0.05||pz>s.zBot-0.12)return false;const hatchOpen=VB.hatch.kin.ang>0.9;if(!hatchOpen&&b.position.y>0.2)return false;
  let ty=vbStairY(pz)+0.63;if(!hatchOpen)ty=Math.min(ty,-0.42);/* shut hatch: you bump your head on it */if(Math.abs(b.position.y-ty)>0.7)return false;
  const f=V3(-Math.sin(player.yaw),0,-Math.cos(player.yaw)),r=V3(Math.cos(player.yaw),0,-Math.sin(player.yaw));const wish=V3();if(keys.KeyW)wish.add(f);if(keys.KeyS)wish.sub(f);if(keys.KeyD)wish.add(r);if(keys.KeyA)wish.sub(r);if(wish.lengthSq()>0)wish.normalize();
  player.crouch=!!keys.ShiftLeft||!!keys.ShiftRight||!!keys.ControlLeft;const sp=player.crouch?1.4:2.6;const k=1-Math.exp(-dt*16);b.velocity.x=lerp(b.velocity.x,wish.x*sp,k);b.velocity.z=lerp(b.velocity.z,wish.z*sp,k);
  b.position.y=Math.abs(b.position.y-ty)<0.3?ty:lerp(b.position.y,ty,1-Math.exp(-dt*18));b.velocity.y=0;player.onGround=true;player.lastGroundY=ty-0.37;player.moving=wish.lengthSq()>0.5;player.speedNow=Math.hypot(b.velocity.x,b.velocity.z);return true;}
function vbHouseList(){/* everything drawn upstairs except what you can see up through the two holes */const keep=new Set([VW.floor&&VW.floor.mesh,VW.ceiling&&VW.ceiling.faces[0]&&VW.ceiling.faces[0].mesh,...(VB.entryMeshes||[])]);for(const f of VW.faces)if(f.room&&(f.room.id==='garage'||f.room.id==='master'))keep.add(f.mesh);
  const base=new Set(VB.meshes);VB.house=[...scene.children,...hitRoot.children].filter(o=>(o.isMesh||o.isInstancedMesh)&&!base.has(o)&&!keep.has(o)&&!(o.userData&&o.userData.ent&&o.userData.ent.dynamic));}
function vbUpdate(dt){if(!VB.built)return;if(!VB.house)vbHouseList();{const below=vbUnderground();if(below!==VB.hid){VB.hid=below;for(const o of VB.house)o.visible=!below||!!(o.userData&&o.userData.ent&&o.userData.ent.dynamic);}}if(VB.climbAt&&now>=VB.climbAt){VB.climbAt=0;if(vbTrapOpen()&&!VCL.on&&player.body.position.y<-1)vbClimbUp();}const below=vbUnderground();const want=below||VB.hatch.kin.ang>0.05||!VB.trap.alive||VB.trap.kin.ang>0.05;if(want!==VB.visible){VB.visible=want;for(const o of VB.meshes)o.visible=want;}
  for(const f of VB.fix){const lit=power&&f.on;const k=lit?1:0;f.mesh.material.emissiveIntensity=lerp(f.mesh.material.emissiveIntensity,f.base*k,1-Math.exp(-dt*12));}}
