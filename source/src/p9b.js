
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
const VB={built:false,lagWalls:[],panel:{u0:1.7,u1:2.5,v0:0.2,v1:1.4},meshes:[],fix:[],walls:[],faces:[],group:null,hatch:null,lock:null,carpet:null,trap:null,ladder:null,visible:true,
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
  for(const w of ws){const pn=(w.seg.o==='h'&&Math.abs(w.seg.c-6.3)<1e-6)?VB.panel:null;if(pn)VB.panelWall=w;for(let v=0.12;v<TH;v+=0.2){if(pn&&v>pn.v0&&v<pn.v1){boards.push([pn.u0,0.18,0.025,wallPoint(w,pn.u0/2,v,0.03),w.q],[w.L-pn.u1,0.18,0.025,wallPoint(w,(pn.u1+w.L)/2,v,0.03),w.q]);continue;}boards.push([w.L,0.18,0.025,wallPoint(w,w.L/2,v,0.03),w.q]);}VB.lagWalls.push(w);
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
  VB.props=[];const orange=new THREE.MeshStandardMaterial({color:0xc06a20,roughness:0.6,metalness:0.4});for(const [bx,bz] of[[3.0,5.6],[3.0,8.0],[4.6,5.6],[4.6,8.0]]){const h=BHT-0.2,hy=h/2;const pr=compoundEnt([{w:0.15,h:0.012,d:0.15,x:0,y:-hy+0.006,z:0,mat:M.darkMetal},{w:0.15,h:0.012,d:0.15,x:0,y:hy-0.006,z:0,mat:M.darkMetal},{w:0.05,h:h*0.62,d:0.05,x:0,y:-hy+h*0.31,z:0,mat:orange},{w:0.04,h:h*0.42,d:0.04,x:0,y:hy-h*0.21,z:0,mat:orange}],V3(vX(bx),BF+hy,vZ(bz)),{kind:'furniture',mat:'metal',mass:14,hp:30,wakeThreshold:1.6,label:'adjustable steel prop'});
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
  vbStairs();vbLadder();vbLights();vbContents();vbTunnel();vbTapes();
  for(const f of VB.faces)for(const c of f.chunks)chunkById.set(c.id,c);recomputeTimber();recomputeSupport();
  /* the house switched batching off once it was built; the basement is built later, so switch it back on for this */const bl=BATCH_LIVE;BATCH_LIVE=false;flushBatches();BATCH_LIVE=bl;
  const bm=vbBatchMeshes();for(const o of[...scene.children,...hitRoot.children])if(!before.has(o)&&!bm.has(o))VB.meshes.push(o);
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
  add(0.9,7.4,'batten',VBR.airlock,0.6);add(3.8,5.8,'batten',VBR.bunk);add(3.8,7.8,'batten',VBR.bunk);add(7.3,6.8,'batten',VBR.plant);add(13.8,6.3,'bulb',VBR.escape);}

/* ---------- per frame: stairs, visibility, light level */
function vbUnderground(){return camera.getWorldPosition(_tvp).y<-0.35;}
function vbOnStairs(dt){/* the player is a ball: on a 55° stair it would slide; inside the stairwell it rides the treads instead */const b=player.body,s=VB.stair;if(!VB.built)return false;
  const px=b.position.x-VP.ox,pz=b.position.z-VP.oz;if(px<s.x0-0.05||px>s.x1+0.05||pz<s.zTop-0.05||pz>s.zBot-0.12)return false;const hatchOpen=VB.hatch.kin.ang>0.9;if(!hatchOpen&&b.position.y>0.2)return false;
  let ty=vbStairY(pz)+0.63;if(!hatchOpen)ty=Math.min(ty,-0.42);/* shut hatch: you bump your head on it */if(Math.abs(b.position.y-ty)>0.7)return false;
  const f=V3(-Math.sin(player.yaw),0,-Math.cos(player.yaw)),r=V3(Math.cos(player.yaw),0,-Math.sin(player.yaw));const wish=V3();if(keys.KeyW)wish.add(f);if(keys.KeyS)wish.sub(f);if(keys.KeyD)wish.add(r);if(keys.KeyA)wish.sub(r);if(wish.lengthSq()>0)wish.normalize();
  player.crouch=!!keys.ShiftLeft||!!keys.ShiftRight||!!keys.ControlLeft;const sp=player.crouch?1.4:2.6;const k=1-Math.exp(-dt*16);b.velocity.x=lerp(b.velocity.x,wish.x*sp,k);b.velocity.z=lerp(b.velocity.z,wish.z*sp,k);
  b.position.y=Math.abs(b.position.y-ty)<0.3?ty:lerp(b.position.y,ty,1-Math.exp(-dt*18));b.velocity.y=0;player.onGround=true;player.lastGroundY=ty-0.37;player.moving=wish.lengthSq()>0.5;player.speedNow=Math.hypot(b.velocity.x,b.velocity.z);return true;}
function vbBatchMeshes(){const s_=new Set();for(const b of BATCHES.values())if(b.mesh)s_.add(b.mesh);for(const b of VBATCH)if(b.mesh)s_.add(b.mesh);return s_;}
function vbHouseList(){/* everything drawn upstairs except what you can see up through the two holes */const keep=new Set([VW.floor&&VW.floor.mesh,VW.ceiling&&VW.ceiling.faces[0]&&VW.ceiling.faces[0].mesh,...(VB.entryMeshes||[])]);for(const f of VW.faces)if(f.room&&(f.room.id==='garage'||f.room.id==='master'))keep.add(f.mesh);
  const base=new Set(VB.meshes),bm=vbBatchMeshes();VB.house=[...scene.children,...hitRoot.children].filter(o=>(o.isMesh||o.isInstancedMesh)&&!base.has(o)&&!keep.has(o)&&!bm.has(o)&&!(o.userData&&o.userData.ent&&o.userData.ent.dynamic));}
function vbUpdate(dt){if(!VB.built)return;vbUpdateContents(dt);vbUpdateCreepy(dt);if(!VB.house)vbHouseList();{const below=vbUnderground();if(below!==VB.hid){VB.hid=below;for(const o of VB.house)o.visible=!below||!!(o.userData&&o.userData.ent&&o.userData.ent.dynamic);}}if(VB.climbAt&&now>=VB.climbAt){VB.climbAt=0;if(vbTrapOpen()&&!VCL.on&&player.body.position.y<-1)vbClimbUp();}const below=vbUnderground();const want=below||VB.hatch.kin.ang>0.05||!VB.trap.alive||VB.trap.kin.ang>0.05;if(want!==VB.visible){VB.visible=want;for(const o of VB.meshes)o.visible=want;}
  for(const f of VB.fix){const lit=vbPowered()&&f.on;const k=lit?1:0;f.mesh.material.emissiveIntensity=lerp(f.mesh.material.emissiveIntensity,f.base*k,1-Math.exp(-dt*12));}}

/* ============================================================ v6.3 — B2: what's down there
   Every room gets something that breaks in its own way: drums that spray when punctured, a generator you pull-start,
   a valve radio stuck on a numbers station, flares that light up and burn red for a minute. Built with the rest of the
   basement (villaBasement → vbContents). */
const VBJ=[];/* jets: water or fuel squirting out of a punctured drum or jerry can */
function pFloorY(x,y,z){/* the floor a particle lands on: the basement's when it's under the slab inside the basement */return (VILLA&&VB.built&&y<-0.25&&vbRoomAt(x-VP.ox,z-VP.oz))?BF:FLOOR_Y;}
function vbPowered(){return (power&&VB.subOn&&!VB.subDead)||(VB.gen&&VB.gen.running);}
function vbPuncture(e,p,dir,col,label){if(!e.alive||e.empty)return;wakeEnt(e);const lp=e.mesh.worldToLocal(p.clone());const ld=(dir?dir.clone().negate():V3(0,0,1)).transformDirection(new THREE.Matrix4().copy(e.mesh.matrixWorld).invert()).normalize();
  VBJ.push({e,lp,ld,t:e.liquid||20,col});S.noise({dur:0.3,gain:0.3,type:'bandpass',f:1800,pos:p});HUD.msg(`[${label}]`,1.4);e.punctured=true;}
function vbJets(dt){for(let i=VBJ.length-1;i>=0;i--){const j=VBJ[i];const e=j.e;if(!e.alive||j.t<=0){if(e.alive){e.empty=true;e.label=e.label.replace('full ','empty ');}VBJ.splice(i,1);continue;}j.t-=dt;
    e.mesh.updateMatrixWorld(true);const p=e.mesh.localToWorld(j.lp.clone());const d=j.ld.clone().transformDirection(e.mesh.matrixWorld);const sp=1.2+Math.min(2.2,j.t*0.12);/* pressure falls as it empties */
    P.emit(p,{count:3,color:j.col,cvar:0.04,size:0.014,life:1.2,vel:d,speed:sp,spread:0.12,grav:9.8,drag:0.1,kind:3});if(e.body&&e.dynamic){const m=Math.max(1.2,(e.mass||5)*(j.t/(e.liquid||20)));if(Math.abs(e.body.mass-m)>0.5){e.body.mass=m;e.body.updateMassProperties();}}
    if(Math.random()<dt*3)S.noise({dur:0.2,gain:0.05,type:'bandpass',f:2400,pos:p});}}

/* ---------- canvases for the walls */
function texRules(){return texLabel(256,320,'#e9e2c8',[{t:'SHELTER RULES',y:34,f:'bold 22px monospace',c:'#7a1410'},{t:'1. SEAL THE DOOR',y:80,f:'15px monospace',c:'#222',x:128},{t:'2. NO SMOKING',y:110,f:'15px monospace',c:'#222'},{t:'3. RATION THE BEANS',y:140,f:'15px monospace',c:'#222'},{t:'4. RADIO ON THE HOUR',y:170,f:'15px monospace',c:'#222'},{t:'5. NOBODY UP THE LADDER',y:200,f:'15px monospace',c:'#222'},{t:'   WITHOUT THE PASSWORD',y:222,f:'15px monospace',c:'#222'},{t:'6. TELL NO ONE',y:252,f:'15px monospace',c:'#222'},{t:'(ESPECIALLY THE COUNCIL)',y:282,f:'12px monospace',c:'#555'}]);}
function texCalendar(){const c=mkCanvas(192,256),x=c.getContext('2d');x.fillStyle='#f4efe2';x.fillRect(0,0,192,256);x.fillStyle='#204a7a';x.fillRect(0,0,192,96);x.fillStyle='#e8d38a';x.font='bold 12px sans-serif';x.textAlign='center';x.fillText('SWAN VALLEY TRACTOR CO.',96,22);x.fillStyle='#9cb8d6';x.fillRect(16,30,160,56);
  x.fillStyle='#204a7a';x.font='bold 15px sans-serif';x.fillText('OCTOBER 1987',96,116);x.font='10px sans-serif';const d0=4;for(let d=1;d<=31;d++){const k=d+d0-1,cx=20+(k%7)*25,cy=140+Math.floor(k/7)*22;x.fillStyle='#333';x.fillText(String(d),cx,cy);if(d<=19){x.strokeStyle='rgba(30,30,30,0.6)';x.beginPath();x.moveTo(cx-7,cy-9);x.lineTo(cx+7,cy+3);x.stroke();}
    if(d===19){x.strokeStyle='#c0201a';x.lineWidth=2;x.beginPath();x.arc(cx,cy-4,10,0,Math.PI*2);x.stroke();x.lineWidth=1;x.fillStyle='#c0201a';x.font='bold 9px sans-serif';x.fillText('TOLD YOU',cx,cy+12);x.font='10px sans-serif';}}return c;}
function texMap(){const c=mkCanvas(256,192),x=c.getContext('2d');x.fillStyle='#ede4cc';x.fillRect(0,0,256,192);x.strokeStyle='rgba(120,100,70,0.35)';for(let i=0;i<256;i+=14){x.beginPath();x.moveTo(i,0);x.lineTo(i+srand()*8,192);x.stroke();}for(let j=0;j<192;j+=14){x.beginPath();x.moveTo(0,j);x.lineTo(256,j+srand()*6);x.stroke();}
  x.fillStyle='#8fb3cf';x.beginPath();x.moveTo(0,120);x.bezierCurveTo(60,100,90,140,130,110);x.bezierCurveTo(160,90,170,70,200,80);x.lineTo(205,95);x.bezierCurveTo(170,95,160,125,130,130);x.bezierCurveTo(90,150,50,125,0,140);x.closePath();x.fill();x.fillRect(0,0,14,192);
  x.fillStyle='#333';x.font='bold 14px serif';x.fillText('PERTH',110,60);x.strokeStyle='#c0201a';x.lineWidth=2;for(const r of[30,60,95]){x.beginPath();x.arc(118,70,r,0,Math.PI*2);x.stroke();}x.font='bold 9px monospace';x.fillStyle='#c0201a';x.fillText('1 MT?',150,40);x.fillText('5 PSI',40,150);
  x.font='bold 18px sans-serif';x.fillText('X',196,160);x.font='9px monospace';x.fillText('US. SAFE?',180,176);return c;}
function vbDecal(canvas,w,h,pos,quat){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:mkTex(canvas,1,1),roughness:0.9}));m.position.copy(pos);m.quaternion.copy(quat);m.receiveShadow=true;scene.add(m);return m;}
const qY=a=>new THREE.Quaternion().setFromAxisAngle(V3(0,1,0),a);
function vbAt(px,y,pz){return V3(vX(px),BF+y,vZ(pz));}

/* ---------- sound: a couple of loops built straight on the engine's context */
function vbLoop(build){if(!S.ctx)return null;const c=S.ctx;const g=c.createGain();g.gain.value=0;g.connect(S.master);const nodes=build(c,g)||[];return{g,nodes,stop(){try{g.gain.setTargetAtTime(0,c.currentTime,0.08);setTimeout(()=>{for(const n of nodes){try{n.stop&&n.stop();}catch(e){}}g.disconnect();},400);}catch(e){}}};}
function vbGenSound(){return vbLoop((c,out)=>{const o1=c.createOscillator();o1.type='sawtooth';o1.frequency.value=46;const o2=c.createOscillator();o2.type='square';o2.frequency.value=92.5;const g2=c.createGain();g2.gain.value=0.35;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;const chop=c.createGain();chop.gain.value=0.55;const lfo=c.createOscillator();lfo.frequency.value=23;const lg=c.createGain();lg.gain.value=0.45;lfo.connect(lg);lg.connect(chop.gain);
  const n=c.createBufferSource();n.buffer=S.noiseBuf;n.loop=true;const nf=c.createBiquadFilter();nf.type='bandpass';nf.frequency.value=900;nf.Q.value=0.7;const ng=c.createGain();ng.gain.value=0.35;
  o1.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(chop);n.connect(nf);nf.connect(ng);ng.connect(chop);chop.connect(out);for(const o of[o1,o2,lfo,n])o.start();return[o1,o2,lfo,n];});}
function vbStatic(){return vbLoop((c,out)=>{const n=c.createBufferSource();n.buffer=S.noiseBuf;n.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=2200;f.Q.value=0.8;const hum=c.createOscillator();hum.frequency.value=50;const hg=c.createGain();hg.gain.value=0.25;n.connect(f);f.connect(out);hum.connect(hg);hg.connect(out);n.start();hum.start();return[n,hum];});}

/* ---------- the contents */
function vbContents(){const q0=new THREE.Quaternion();const W=Math.PI/2;
  /* airlock: rules board, decontamination bucket shower, mask and gloves, a Geiger counter */
  vbDecal(texRules(),0.5,0.62,vbAt(0.3+0.002,1.45,7.5),qY(W));
  {const b=new THREE.Group();const bucket=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.12,0.26,12,1,true),new THREE.MeshStandardMaterial({color:0x9aa0a2,roughness:0.45,metalness:0.7,side:THREE.DoubleSide}));b.add(bucket);const rose=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.02,10),M.chrome);rose.position.y=-0.15;b.add(rose);
    const chain=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,0.7,4),M.darkMetal);chain.position.set(0.12,-0.45,0);b.add(chain);const hang=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.3,4),M.darkMetal);hang.position.y=0.28;b.add(hang);b.position.copy(vbAt(0.8,1.9,8.15));
    const e=mkEnt({mesh:b,body:null,kind:'fixture',mat:'metal',mass:0,hp:999,wakeThreshold:1e9,noBatch:true,label:'decontamination shower'});e.useLabel='PULL THE CHAIN';e.use=()=>{VB.shower=2.2;S.noise({dur:2.2,gain:0.25,type:'lowpass',f:1400,pos:b.position});HUD.msg('[DECONTAMINATED. COLD.]',1.4);};VB.showerEnt=e;}
  const yellow=new THREE.MeshStandardMaterial({color:0xd8b21c,roughness:0.6});const rubber=new THREE.MeshStandardMaterial({color:0x2a2c28,roughness:0.7});
  {const m=compoundEnt([{w:0.2,h:0.16,d:0.1,x:0,y:0,z:0,mat:rubber},{w:0.07,h:0.07,d:0.06,x:-0.05,y:-0.06,z:0.06,mat:M.darkMetal},{w:0.07,h:0.07,d:0.06,x:0.05,y:-0.06,z:0.06,mat:M.darkMetal},{w:0.12,h:0.05,d:0.02,x:0,y:0.03,z:0.05,mat:new THREE.MeshStandardMaterial({color:0x99a8a8,roughness:0.2,metalness:0.3,transparent:true,opacity:0.6})}],vbAt(1.25,1.55,8.55),{kind:'prop',mat:'plastic',mass:0.6,hp:6,label:'gas mask'});}
  for(const dx of[0,0.12]){const g=boxEnt(0.1,0.24,0.04,vbAt(0.95+dx,1.45,8.57),yellow,{kind:'prop',mat:'fabric',mass:0.2,hp:4,label:'rubber glove'});}
  {const shelf=boxEnt(0.3,0.025,0.18,vbAt(0.4,1.2,7.0),M.timber,{kind:'furniture',mat:'timber',mass:2,hp:8,label:'shelf'});const gc=compoundEnt([{w:0.16,h:0.08,d:0.1,x:0,y:0,z:0,mat:yellow},{w:0.07,h:0.04,d:0.005,x:0.02,y:0.01,z:0.051,mat:new THREE.MeshStandardMaterial({color:0xe8e6d0,roughness:0.4})},{w:0.03,h:0.03,d:0.12,x:-0.11,y:-0.02,z:0,mat:rubber,cyl:[0.015,0.015,0.12]}],vbAt(0.42,1.255,7.0),{kind:'prop',mat:'plastic',mass:0.9,hp:6,label:'Geiger counter (it reads the same everywhere)',restsOn:shelf});shelf.dependents.push(gc);VB.geiger=gc;}

  /* bunk room: two triple bunks, a table and chairs, shelves of tins and jars, water drums, the radio, map, calendar, air blower */
  const steel=new THREE.MeshStandardMaterial({color:0x5d6b5a,roughness:0.55,metalness:0.5}),vinyl=new THREE.MeshStandardMaterial({color:0x2f5a3a,roughness:0.6});VB.bunks=[];
  for(const [cx,cz] of[[2.98,5.05],[2.98,8.55]]){const L=1.95,D=0.82,H=1.95,parts=[];for(const sx of[-1,1])for(const sz of[-1,1])parts.push({w:0.04,h:H,d:0.04,x:sx*(L/2-0.02),y:0,z:sz*(D/2-0.02),mat:steel});
    for(const ly of[0.32,0.95,1.58]){parts.push({w:L,h:0.04,d:0.04,x:0,y:ly-H/2,z:D/2-0.02,mat:steel},{w:L,h:0.04,d:0.04,x:0,y:ly-H/2,z:-D/2+0.02,mat:steel},{w:L-0.06,h:0.012,d:D-0.06,x:0,y:ly-H/2+0.01,z:0,mat:M.darkMetal});}
    const bk=compoundEnt(parts,vbAt(cx,H/2,cz),{kind:'furniture',mat:'metal',mass:45,hp:40,wakeThreshold:2.2,label:'steel bunk'});VB.bunks.push(bk);
    for(const ly of[0.32,0.95,1.58]){const m=boxEnt(L-0.1,0.1,D-0.1,vbAt(cx,ly+0.08,cz),vinyl,{kind:'prop',mat:'foam',mass:4,hp:20,label:'vinyl mattress',restsOn:bk});bk.dependents.push(m);}}
  {const tb=compoundEnt([{w:1.2,h:0.03,d:0.75,x:0,y:0.36,z:0,mat:new THREE.MeshStandardMaterial({color:0x8a7a5a,roughness:0.6})},...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,b])=>({w:0.03,h:0.72,d:0.03,x:a*0.56,y:0,z:b*0.33,mat:steel}))],vbAt(4.0,0.375,6.8),{kind:'furniture',mat:'chip',mass:12,hp:10,wakeThreshold:1.4,label:'folding table'});
    for(const [dx,dz,a] of[[-0.35,-0.6,0],[0.35,-0.6,0.1],[-0.35,0.6,Math.PI],[0.35,0.6,Math.PI-0.15]]){compoundEnt([{w:0.4,h:0.025,d:0.4,x:0,y:0,z:0,mat:steel},{w:0.4,h:0.4,d:0.025,x:0,y:0.22,z:-0.19,mat:steel},{w:0.025,h:0.45,d:0.025,x:-0.18,y:-0.22,z:-0.18,mat:steel},{w:0.025,h:0.45,d:0.025,x:0.18,y:-0.22,z:-0.18,mat:steel},{w:0.025,h:0.45,d:0.025,x:-0.18,y:-0.22,z:0.18,mat:steel},{w:0.025,h:0.45,d:0.025,x:0.18,y:-0.22,z:0.18,mat:steel}],vbAt(4.0+dx,0.46,6.8+dz),{kind:'furniture',mat:'metal',mass:3,hp:8,wakeThreshold:0.9,label:'folding chair',quat:qY(a)});}}
  /* shelving: two steel units, tins and preserve jars on them */
  const jarCols=[0xb03a2e,0xd8a630,0x6b8e3a,0x8a3a6a];VB.tins=[];VB.jars=[];const shelfM=new THREE.MeshStandardMaterial({color:0x7c8288,roughness:0.5,metalness:0.6}),jarGlass=new THREE.MeshStandardMaterial({color:0xddeeee,roughness:0.1,transparent:true,opacity:0.35}),jarFill=jarCols.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.5}));
  for(const [cx,cz,rot] of[[5.2,8.78,0],[5.88,5.4,W]]){const L=1.15,D=0.4,H=1.8;const parts=[];for(const sx of[-1,1])for(const sz of[-1,1])parts.push({w:0.03,h:H,d:0.03,x:sx*(L/2-0.015),y:0,z:sz*(D/2-0.015),mat:M.darkMetal});const ys=[0.12,0.55,0.98,1.41];for(const y of ys)parts.push({w:L,h:0.015,d:D,x:0,y:y-H/2,z:0,mat:shelfM});
    const sh=compoundEnt(parts,vbAt(cx,H/2,cz),{kind:'furniture',mat:'metal',mass:18,hp:30,wakeThreshold:2.4,label:'steel shelving',quat:qY(rot)});
    const along=V3(1,0,0).applyQuaternion(qY(rot)),across=V3(0,0,1).applyQuaternion(qY(rot));
    for(let si=0;si<4;si++){const y=ys[si]+0.0075;for(let i=0;i<8;i++){const u=-L/2+0.08+i*0.142,v=(i%2?0.06:-0.06);const p=vbAt(cx,y,cz).addScaledVector(along,u).addScaledVector(across,v);
      if(si===3&&i<5){const jar=new THREE.Group();const gl=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.14,12),jarGlass);const fill=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.11,10),jarFill[i%4]);fill.position.y=-0.012;const lid=new THREE.Mesh(new THREE.CylinderGeometry(0.047,0.047,0.015,12),M.chrome);lid.position.y=0.075;jar.add(gl,fill,lid);p.y+=0.07;jar.position.copy(p);
        const b=new CANNON.Body({mass:0});b.addShape(new CANNON.Cylinder(0.045,0.045,0.15,8));b.position.copy(toC(p));const e=mkEnt({mesh:jar,body:b,kind:'prop',mat:'glass',mass:0.7,hp:1.2,label:'jar of preserves (1987)',wakeable:true,restsOn:sh,shardCol:[0.85,0.9,0.9]});sh.dependents.push(e);VB.jars.push(e);}
      else if(si!==3&&(i%4!==3)){p.y+=0.055;const t=tin(p,sh,(si+i)%2);t.mesh.traverse(o=>{if(o.isMesh&&Array.isArray(o.material))o.material=o.material[0];});t.noBatch=false;VB.tins.push(t);}}}}
  /* water drums: 20 L each, they squirt when you hole them */VB.drums=[];const blue=new THREE.MeshStandardMaterial({color:0x2c5fa8,roughness:0.55});
  for(const [px,pz] of[[5.75,7.5],[5.75,7.85],[5.75,8.2],[5.4,7.68]]){const d=compoundEnt([{w:0.25,h:0.4,d:0.25,x:0,y:0,z:0,mat:blue},{w:0.06,h:0.04,d:0.06,x:0.06,y:0.22,z:0.06,mat:M.beige,noCollide:true},{w:0.1,h:0.03,d:0.03,x:-0.04,y:0.215,z:0,mat:blue,noCollide:true}],vbAt(px,0.2,pz),{kind:'prop',mat:'plastic',mass:20,hp:30,wakeThreshold:3,label:'full water drum (20 L)'});d.liquid=24;
    d.onHit=(p,dmg,dir)=>{if(dmg>1.5&&!d.punctured)vbPuncture(d,p,dir,[0.62,0.78,0.95],'DRUM HOLED · WATER EVERYWHERE');};d.onSawn=(p,dir)=>{if(!d.punctured)vbPuncture(d,p,dir,[0.62,0.78,0.95],'DRUM CUT · WATER EVERYWHERE');};VB.drums.push(d);}
  vbDecal(texCalendar(),0.3,0.4,vbAt(6.1-0.002,1.5,7.75),qY(-W));vbDecal(texMap(),0.8,0.6,vbAt(2.6,1.45,4.6+0.002),q0);
  /* the radio desk: a valve shortwave set and the tape deck (the tapes come later) */
  {const desk=compoundEnt([{w:0.5,h:0.03,d:0.9,x:0,y:0.36,z:0,mat:M.timber},{w:0.03,h:0.72,d:0.03,x:-0.22,y:0,z:-0.42,mat:steel},{w:0.03,h:0.72,d:0.03,x:-0.22,y:0,z:0.42,mat:steel},{w:0.03,h:0.72,d:0.03,x:0.22,y:0,z:-0.42,mat:steel},{w:0.03,h:0.72,d:0.03,x:0.22,y:0,z:0.42,mat:steel}],vbAt(1.88,0.375,6.0),{kind:'furniture',mat:'timber',mass:10,hp:12,wakeThreshold:1.6,label:'radio desk'});
    const dial=new THREE.MeshStandardMaterial({color:0xe8d8a0,emissive:0xffb050,emissiveIntensity:0,roughness:0.4});const r=compoundEnt([{w:0.32,h:0.2,d:0.45,x:0,y:0,z:0,mat:new THREE.MeshStandardMaterial({color:0x4a3a2a,roughness:0.6})},{w:0.005,h:0.08,d:0.25,x:0.162,y:0.04,z:0,mat:dial,noCollide:true},{w:0.04,h:0.04,d:0.04,x:0.17,y:-0.05,z:-0.12,mat:M.chrome,noCollide:true},{w:0.04,h:0.04,d:0.04,x:0.17,y:-0.05,z:0.12,mat:M.chrome,noCollide:true}],vbAt(1.85,0.865,5.85),{kind:'prop',mat:'chip',mass:9,hp:5,label:'valve shortwave radio',restsOn:desk});desk.dependents.push(r);r.dial=dial;r.on=false;r.dead=false;VB.radio=r;
    r.use=()=>{if(r.dead){HUD.msg('[DEAD. VALVES EVERYWHERE.]',1);return;}r.on=!r.on;S.click(r.mesh.position);if(r.on){r.snd=vbStatic();r.next=1.5;HUD.msg('[RADIO WARMS UP · SOMEONE IS READING NUMBERS]',1.6);}else{r.snd&&r.snd.stop();r.snd=null;HUD.msg('[RADIO OFF]',0.8);}};r.useLabel=()=>r.dead?'':(r.on?'SWITCH OFF':'SWITCH ON');
    r.onHit=(p,dmg)=>{if(dmg<1.4||r.dead)return;r.dead=true;if(r.snd){r.snd.stop();r.snd=null;}r.on=false;dial.emissiveIntensity=0;S.shatter(p,false);sparks(p,20,[1,0.8,0.4]);for(let i=0;i<3;i++)setTimeout(()=>S.pop?S.pop(p):S.snap(p),120*i);HUD.msg('[VALVES POP · THE NUMBERS STOP]',1.4);};
    const td=compoundEnt([{w:0.3,h:0.09,d:0.22,x:0,y:0,z:0,mat:new THREE.MeshStandardMaterial({color:0x2a2a2c,roughness:0.5})},{w:0.15,h:0.005,d:0.1,x:0,y:0.046,z:0.02,mat:new THREE.MeshStandardMaterial({color:0x777a80,roughness:0.3,metalness:0.6}),noCollide:true}],vbAt(1.85,0.81,6.3),{kind:'prop',mat:'plastic',mass:1.8,hp:5,label:'cassette deck',restsOn:desk});desk.dependents.push(td);VB.deck=td;td.useLabel='PLAY';td.use=()=>{HUD.msg('[NO TAPE IN IT]',1);};}
  /* the hand-crank air blower and its duct up through the slab */
  {const bl=compoundEnt([{w:0.3,h:0.3,d:0.25,x:0,y:0,z:0,mat:new THREE.MeshStandardMaterial({color:0x6a7a5a,roughness:0.6,metalness:0.4})},{w:0.03,h:0.18,d:0.03,x:0.17,y:0.03,z:0,mat:M.darkMetal,noCollide:true}],vbAt(4.95,1.1,4.75),{kind:'fixture',mat:'metal',mass:15,hp:20,wakeThreshold:3,label:'hand-crank air blower'});bl.useLabel='CRANK IT';bl.use=()=>{S.noise({dur:1.4,gain:0.32,type:'bandpass',f:500,f1:1100,pos:bl.mesh.position});HUD.msg('[WHIRR · FRESH(ISH) AIR]',1);VB.crank=1.4;};VB.blower=bl;
    const duct=compoundEnt([{w:0.12,h:BHT-1.25,d:0.12,x:0,y:0,z:0,mat:M.chrome,cyl:[0.06,0.06,BHT-1.25]}],vbAt(4.95,1.25+(BHT-1.25)/2,4.75),{kind:'fixture',mat:'metal',mass:3,hp:6,wakeThreshold:1.8,label:'air duct'});duct.mesh.children[0].geometry=new THREE.CylinderGeometry(0.06,0.06,BHT-1.25,10);}

  /* plant room: generator, jerry cans, the sub-board, sump pit, bench and pegboard */
  {const red=new THREE.MeshStandardMaterial({color:0xb4261c,roughness:0.5,metalness:0.3}),frame=M.darkMetal;const g=compoundEnt([{w:0.62,h:0.04,d:0.46,x:0,y:-0.21,z:0,mat:frame},{w:0.36,h:0.3,d:0.34,x:-0.05,y:-0.04,z:0,mat:new THREE.MeshStandardMaterial({color:0x555a5e,roughness:0.5,metalness:0.6})},{w:0.42,h:0.16,d:0.32,x:0.02,y:0.18,z:0,mat:red},{w:0.12,h:0.12,d:0.12,x:0.22,y:-0.06,z:0.1,mat:M.chrome},{w:0.03,h:0.44,d:0.03,x:-0.3,y:0,z:-0.21,mat:frame,noCollide:true},{w:0.03,h:0.44,d:0.03,x:0.3,y:0,z:-0.21,mat:frame,noCollide:true},{w:0.03,h:0.44,d:0.03,x:-0.3,y:0,z:0.21,mat:frame,noCollide:true},{w:0.03,h:0.44,d:0.03,x:0.3,y:0,z:0.21,mat:frame,noCollide:true}],vbAt(7.05,0.23,8.62),{kind:'furniture',mat:'metal',mass:38,hp:40,wakeThreshold:3.2,label:'petrol generator (2 kVA)'});
    g.running=false;g.tries=0;g.fuel=true;VB.gen=g;g.useLabel=()=>g.running?'KILL SWITCH':(g.fuel?'PULL-START':'(NO FUEL)');
    g.use=()=>{if(g.running){vbGenStop('[GENERATOR OFF]');return;}if(!g.fuel){S.clink(g.mesh.position);HUD.msg('[NO FUEL · THE TANK IS HOLED]',1.2);return;}g.tries++;S.noise({dur:0.35,gain:0.35,type:'bandpass',f:400,f1:200,pos:g.mesh.position});
      const ok=g.tries>=3||Math.random()<(g.tries===1?0.3:0.6);if(!ok){S.thud(g.mesh.position,0.6);HUD.msg(g.tries===1?'[COUGH.]':'[COUGH · COUGH · NEARLY]',0.9);return;}g.tries=0;g.running=true;g.snd=vbGenSound();HUD.msg('[GENERATOR RUNNING · BASEMENT LIGHTS ON BACKUP]',1.6);};
    g.onHit=(p,dmg,dir)=>{if(dmg<2.2)return;if(g.fuel&&p.y>g.mesh.position.y+0.08){g.fuel=false;g.liquid=10;vbPuncture(g,p,dir,[0.86,0.66,0.22],'FUEL TANK HOLED · PETROL LEAKING');setTimeout(()=>vbGenStop('[GENERATOR SPLUTTERS OUT]'),2500);}};
    const jc=new THREE.MeshStandardMaterial({color:0xc42a1e,roughness:0.5,metalness:0.4});for(const [px,pz] of[[6.42,8.7],[6.72,8.75]]){const j=compoundEnt([{w:0.17,h:0.34,d:0.3,x:0,y:0,z:0,mat:jc},{w:0.04,h:0.06,d:0.04,x:0,y:0.2,z:0.1,mat:jc,noCollide:true},{w:0.03,h:0.03,d:0.16,x:0,y:0.185,z:-0.05,mat:jc,noCollide:true}],vbAt(px,0.17,pz),{kind:'prop',mat:'metal',mass:16,hp:30,wakeThreshold:3,label:'full jerry can (petrol)'});j.liquid=18;
      j.onHit=(p,dmg,dir)=>{if(dmg>2.4&&!j.punctured)vbPuncture(j,p,dir,[0.86,0.66,0.22],'JERRY CAN HOLED · PETROL');};j.onSawn=(p,dir)=>{if(!j.punctured)vbPuncture(j,p,dir,[0.86,0.66,0.22],'JERRY CAN CUT · PETROL');};}
    /* the basement sub-board, on the plant room side of the stud wall */const sb=compoundEnt([{w:0.1,h:0.5,d:0.4,x:0,y:0,z:0,mat:new THREE.MeshStandardMaterial({color:0xd8d2c0,roughness:0.6})},{w:0.02,h:0.08,d:0.04,x:0.055,y:0.06,z:-0.08,mat:M.black,noCollide:true},{w:0.02,h:0.08,d:0.04,x:0.055,y:0.06,z:0.02,mat:M.black,noCollide:true},{w:0.02,h:0.08,d:0.06,x:0.055,y:-0.1,z:0.1,mat:new THREE.MeshStandardMaterial({color:0xc02020,roughness:0.5}),noCollide:true}],vbAt(6.21+0.05,1.5,5.3),{kind:'fixture',mat:'plastic',mass:0,hp:999,wakeThreshold:1e9,label:'basement sub-board'});
    VB.subOn=true;VB.subDead=false;sb.useLabel=()=>VB.subDead?'':(VB.subOn?'MAIN SWITCH OFF':'MAIN SWITCH ON');sb.use=()=>{if(VB.subDead)return;VB.subOn=!VB.subOn;S.click(sb.mesh.position,1600);S.thud(sb.mesh.position,0.4);};sb.onHit=(p,dmg)=>{if(dmg<1.6||VB.subDead)return;VB.subDead=true;sparks(p,30,[1,0.85,0.4]);S.zap?S.zap(p):S.snap(p);onSpark&&onSpark(p);HUD.msg('[SUB-BOARD SMASHED · BASEMENT MAINS DEAD · GENERATOR STILL WORKS]',1.8);};VB.sub=sb;
    /* sump pit with a grate and a pump */{const g2=[];const x0=vX(7.65),z0=vZ(4.85);for(let i=0;i<7;i++)g2.push([0.5,0.02,0.02,V3(x0+0.25,BF+0.012,z0+0.04+i*0.07),q0]);g2.push([0.02,0.02,0.5,V3(x0,BF+0.012,z0+0.25),q0],[0.02,0.02,0.5,V3(x0+0.5,BF+0.012,z0+0.25),q0]);vMerge(g2,M.darkMetal);
      const water=new THREE.Mesh(new THREE.PlaneGeometry(0.48,0.48),new THREE.MeshStandardMaterial({color:0x1d2a2c,roughness:0.05,metalness:0.3}));water.rotation.x=-W;water.position.set(x0+0.25,BF-0.12,z0+0.25);scene.add(water);
      compoundEnt([{w:0.16,h:0.3,d:0.16,x:0,y:0,z:0,mat:new THREE.MeshStandardMaterial({color:0x2a4a8a,roughness:0.5})}],vbAt(8.3,0.15,5.05),{kind:'prop',mat:'metal',mass:9,hp:12,wakeThreshold:2.4,label:'sump pump'});}
    /* bench and pegboard: one tool outline is empty */{const bench=compoundEnt([{w:0.5,h:0.04,d:1.4,x:0,y:0.43,z:0,mat:M.timber},{w:0.04,h:0.86,d:0.04,x:-0.22,y:0,z:-0.66,mat:steel},{w:0.04,h:0.86,d:0.04,x:0.22,y:0,z:-0.66,mat:steel},{w:0.04,h:0.86,d:0.04,x:-0.22,y:0,z:0.66,mat:steel},{w:0.04,h:0.86,d:0.04,x:0.22,y:0,z:0.66,mat:steel}],vbAt(8.22,0.45,8.2),{kind:'furniture',mat:'timber',mass:30,hp:20,wakeThreshold:2.6,label:'workbench'});
      const pc=mkCanvas(256,192),px=pc.getContext('2d');px.fillStyle='#b89a6a';px.fillRect(0,0,256,192);px.fillStyle='rgba(60,40,20,0.6)';for(let y=8;y<192;y+=12)for(let x=8;x<256;x+=12)px.fillRect(x,y,2,2);px.strokeStyle='#202020';px.lineWidth=2;
      const outl=[[30,40,20,90],[70,30,60,20],[150,40,14,100],[190,60,50,24],[60,110,80,18],[170,120,40,50]];for(const [x,y,w,h] of outl)px.strokeRect(x,y,w,h);px.fillStyle='rgba(40,30,20,0.85)';for(const [x,y,w,h] of outl.slice(0,5))px.fillRect(x+2,y+2,w-4,h-4);px.fillStyle='#202020';px.font='9px monospace';px.fillText('?',186,150);
      vbDecal(pc,1.2,0.9,vbAt(8.5-0.002,1.4,8.2),qY(-W));}}

  /* escape chamber: the emergency box with three flares and a note */
  {const box=compoundEnt([{w:0.45,h:0.25,d:0.3,x:0,y:0,z:0,mat:new THREE.MeshStandardMaterial({color:0xa82a1c,roughness:0.5,metalness:0.4})}],vbAt(14.2,0.125,7.3),{kind:'furniture',mat:'metal',mass:8,hp:20,wakeThreshold:2.6,label:'emergency box'});VB.flares=[];
    for(let i=0;i<3;i++){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.22,8),new THREE.MeshStandardMaterial({color:0xc8201a,roughness:0.5,emissive:0xff3010,emissiveIntensity:0}));g.add(body);const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.03,8),M.darkMetal);cap.position.y=0.12;g.add(cap);
      const p=vbAt(14.05+i*0.07,0.27,7.25);g.position.copy(p);g.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(V3(1,0,0),W));const b=new CANNON.Body({mass:0});b.addShape(new CANNON.Cylinder(0.018,0.018,0.22,6));b.position.copy(toC(p));b.quaternion.copy(qC(g.quaternion));
      const f=mkEnt({mesh:g,body:b,kind:'prop',mat:'plastic',mass:0.25,hp:6,label:'road flare',wakeable:true,noBatch:true,restsOn:box});box.dependents.push(f);f.burn=0;f.glow=body.material;f.useLabel=()=>f.burn>0?'':(f.spent?'':'STRIKE THE FLARE');f.use=()=>vbLightFlare(f);VB.flares.push(f);}
    const note=boxEnt(0.15,0.002,0.2,vbAt(14.3,0.255,7.35),new THREE.MeshStandardMaterial({map:mkTex(texNote(['IF THE ALL-CLEAR','HASN’T SOUNDED,','STAY PUT.','','PASSWORD IS','"BANKSIA".','','TELL NO ONE.','  - M, OCT ’87'],{w:128,h:170}),1,1),roughness:0.9}),{kind:'prop',mat:'paper',mass:0.02,hp:1,label:'note',restsOn:box});note.useLabel='READ';note.use=()=>HUD.msg('"IF THE ALL-CLEAR HASN\'T SOUNDED, STAY PUT. PASSWORD IS “BANKSIA”. TELL NO ONE. - M, OCT \'87"',4.5);}
}
function vbGenStop(msg){const g=VB.gen;if(!g||!g.running)return;g.running=false;if(g.snd){g.snd.stop();g.snd=null;}if(msg)HUD.msg(msg,1.2);S.thud(g.mesh.position,0.5);}
function vbLightFlare(f){if(f.burn>0||f.spent||!f.alive)return;wakeEnt(f);f.burn=60;f.glow.emissiveIntensity=3;VL.flareEnt=f;S.noise({dur:0.5,gain:0.35,type:'highpass',f:2500,pos:f.mesh.position});HUD.msg('[FLARE LIT · 60 SECONDS · THROW IT]',1.4);}
const VBNUM=['six','four','nine','two','seven','one','eight','three','zero','five'];
function vbUpdateContents(dt){if(!VB.built)return;vbJets(dt);const pp=camera.getWorldPosition(_tvp).clone();
  /* the shower */if(VB.shower>0){VB.shower-=dt;const p=VB.showerEnt.mesh.position.clone();p.y-=0.17;P.emit(p,{count:4,color:[0.62,0.78,0.95],cvar:0.04,size:0.012,life:1,vel:V3(0,-1,0),speed:1.5,spread:0.35,grav:9.8,drag:0.1,kind:3});}
  /* the Geiger counter ticks: faster when you're holding it, never because of anything real */if(VB.geiger&&VB.geiger.alive){const d=pp.distanceTo(VB.geiger.mesh.position);const rate=(held&&held.ent===VB.geiger)?7:(d<2.5?1.2:0);if(Math.random()<rate*dt)S.click(VB.geiger.mesh.position,3200+Math.random()*800);}
  /* generator: shakes, sounds, drinks */const g=VB.gen;if(g&&g.alive&&g.running){if(g.snd)g.snd.g.gain.setTargetAtTime(0.32*Math.pow(clamp(1-pp.distanceTo(g.mesh.position)/14,0,1),1.6),S.ctx.currentTime,0.05);if(!g.dynamic){g.mesh.position.x+=(Math.random()-0.5)*0.002;g.mesh.position.z+=(Math.random()-0.5)*0.002;}}
  /* the radio: static, a chime, then numbers in a flat voice; read close up (speech isn't positional) */const r=VB.radio;if(r&&r.alive&&r.on){r.dial.emissiveIntensity=1.4+Math.random()*0.3;const d=pp.distanceTo(r.mesh.position);if(r.snd)r.snd.g.gain.setTargetAtTime(0.09*Math.pow(clamp(1-d/9,0,1),1.5),S.ctx.currentTime,0.05);
    r.next-=dt;if(r.next<=0){r.next=11+Math.random()*4;S.tone({f:880,dur:0.25,gain:0.12,pos:r.mesh.position});S.tone({f:660,dur:0.25,gain:0.12,pos:r.mesh.position,delay:0.3});S.tone({f:990,dur:0.4,gain:0.12,pos:r.mesh.position,delay:0.6});
      const n=Array.from({length:5},()=>VBNUM[(Math.random()*10)|0]);const txt='Attention. Banksia. '+n.join('. ')+'. Repeat. '+n.join('. ')+'.';if(d<4)VO.speak(txt,'tvm',{near:true});HUD.msg('[RADIO: "'+txt.toUpperCase()+'"]',3.2);}}else if(r)r.dial.emissiveIntensity=0;
  /* flares burn for a minute; the flare light follows the newest one */let best=null;for(const f of VB.flares){if(!f.alive||!(f.burn>0))continue;f.burn-=dt;f.mesh.updateMatrixWorld(true);const tip=f.mesh.localToWorld(V3(0,0.12,0));P.emit(tip,{count:2,color:[1,0.35,0.15],cvar:0.1,size:0.02,life:0.4,spread:0.5,grav:-0.5,drag:2,kind:1});if(Math.random()<0.3)P.emit(tip,{count:1,color:[0.6,0.55,0.55],size:0.05,life:1.6,spread:0.3,grav:-0.6,drag:1.5,kind:1});
    if(f.burn<=0){f.spent=true;f.glow.emissiveIntensity=0;f.glow.color.setHex(0x3a3330);f.label='spent flare';}else if(!best||f===VL.flareEnt)best=f;}
  if(VL.flare){if(best){best.mesh.updateMatrixWorld(true);VL.flare.position.copy(best.mesh.localToWorld(V3(0,0.15,0)));VL.flare.intensity=5+Math.random()*2.5;}else VL.flare.intensity=0;}}

/* ============================================================ v6.4 — B3: make it creepy
   The tunnel's props hold back Perth sand: knock or saw one out and the wall slumps in (always leaving a way through);
   a lagged panel spills sand when smashed; festoon bulbs swing and pop; a rail trolley of sandbags rolls; five cassette
   tapes of the man who dug it; and below ground the house hums, drips and echoes. */
function texSand(){const c=mkCanvas(128,128),x=c.getContext('2d');x.fillStyle='#c9a76a';x.fillRect(0,0,128,128);speckle(x,128,128,2600,[201,167,106],34,0.7,1.2);for(let i=0;i<6;i++)stain(x,srand()*128,srand()*128,10+srand()*30,'150,110,60',0.2);return c;}
let VBSAND=null;
function vbHeap(base,R,h,delay,grow){/* a mound of sand: a spherical cap you can walk over; its collider is the sphere, sunk into the floor */VBSAND=VBSAND||new THREE.MeshStandardMaterial({map:mkTex(texSand(),2,2),roughness:1});const th=Math.acos((R-h)/R);
  const m=new THREE.Mesh(new THREE.SphereGeometry(R,22,10,0,Math.PI*2,0,th),VBSAND);m.position.set(base.x,BF+h-R,base.z);m.scale.set(0.01,0.01,0.01);m.receiveShadow=true;m.castShadow=true;scene.add(m);VB.meshes.push(m);
  VB.heaps.push({m,base,R,h,t:-delay,grow,body:null});}
function vbSlump(w,u,why){/* a prop goes: the boards behind it bow, the sand comes through */if(VB.slumped.has(w.name+':'+u.toFixed(2)))return;VB.slumped.add(w.name+':'+u.toFixed(2));const top=wallPoint(w,u,VBR.tunnel.h-0.1,0);
  S.groan(top,1.3);setTimeout(()=>{S.crumble(top,1);dust(top,50,1.4);},300);HUD.msg(`[${why} · THE WALL GROANS · SAND IS COMING IN]`,2);
  const base=wallPoint(w,u,0,-0.05);vbHeap(base,0.9,0.62,0.5,2.6);VB.pours.push({p:top.clone().addScaledVector(w.normal,0.05),n:w.normal.clone(),t:3.2});shakeCam(0.35);}
function vbTunnel(){VB.heaps=[];VB.pours=[];VB.slumped=new Set();VB.tprops=[];const TH=VBR.tunnel.h;
  /* props: 100 mm posts, two per bay, nailed to the caps; knock one out (heavy hit or kick) or saw through it */
  for(const w of VB.lagWalls){for(let u=0.3;u<w.L;u+=1.2){const pos=wallPoint(w,u,TH/2,-0.05);const e=boxEnt(0.1,TH-0.1,0.1,pos,M.timber,{kind:'furniture',mat:'timber',mass:12,hp:40,wakeThreshold:2.4,label:'tunnel prop',quat:w.q});e.lag={w,u};VB.tprops.push(e);
    e.onHit=(p,dmg)=>{if(dmg<2.4){S.thud(p,1.1);HUD.msg('[PROP HOLDS · IT’S CARRYING SAND]',0.9);return;}vbSlump(w,u,'PROP KNOCKED OUT');};e.onSawn=(p,dir)=>{wakeEnt(e);vbSlump(w,u,'PROP SAWN THROUGH');};}}
  /* the sand panel: lagging boards nailed over a soft spot, a bit newer than the rest */
  {const w=VB.panelWall,pn=VB.panel;if(w){const uc=(pn.u0+pn.u1)/2,vc=(pn.v0+pn.v1)/2;const pc=mkCanvas(64,96),x=pc.getContext('2d');x.fillStyle='#8a7050';x.fillRect(0,0,64,96);for(let i=0;i<96;i+=16){x.fillStyle='rgba(40,28,16,0.6)';x.fillRect(0,i,64,2);}speckle(x,64,96,500,[138,112,80],26,0.5);
    const e=boxEnt(pn.u1-pn.u0,pn.v1-pn.v0,0.03,wallPoint(w,uc,vc,0.02),new THREE.MeshStandardMaterial({map:mkTex(pc,1,1),roughness:0.9}),{kind:'fixture',mat:'timber',mass:6,hp:999,wakeThreshold:1e9,label:'boarded panel (newer than the rest)',quat:w.q});e.hits=0;VB.sandPanel=e;
    const back=vbDecal(texSand(),pn.u1-pn.u0,pn.v1-pn.v0,wallPoint(w,uc,vc,0.06),w.q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V3(0,1,0),Math.PI)));VB.meshes.push(back);
    e.onHit=(p,dmg)=>{if(dmg<1.6){S.thud(p,0.8);HUD.msg('[RESONANCE: SOFT · SAND BEHIND]',0.9);return;}e.hits++;S.snap(p);dust(p,10,0.6);if(e.hits<2){HUD.msg('[BOARDS CRACK]',0.8);return;}vbBreakPanel(p);};e.onSawn=p=>vbBreakPanel(p);}}
  /* festoon bulbs on a cable along the tunnel; they swing when knocked and pop when hit */
  {const y=BF+TH-0.02,z=vZ(6.8);const cable=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,4.6,4),M.black);cable.rotation.z=Math.PI/2;cable.position.set(vX(10.8),y,z);scene.add(cable);VB.meshes.push(cable);VB.festoon=[];
    for(const px of[9.3,11.0,12.6]){const piv=new THREE.Group();piv.position.set(vX(px),y,z);const wire=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,0.14,4),M.black);wire.position.y=-0.07;const sock=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,0.04,8),M.black);sock.position.y=-0.15;
      const bm=new THREE.MeshStandardMaterial({color:0xfff3d0,emissive:0xffcc80,emissiveIntensity:0,transparent:true,opacity:0.92});const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.03,10,8),bm);bulb.position.y=-0.19;piv.add(wire,sock,bulb);
      const e=mkEnt({mesh:piv,body:null,kind:'fixture',mat:'glass',mass:0,hp:999,wakeThreshold:1e9,noBatch:true,label:'festoon bulb'});const f={x:piv.position.x,z:piv.position.z,y:y-0.19,i:2.6,col:0xffc890,room:VBR.tunnel,lvl:'b',on:true,mesh:bulb,base:2.6,piv,ang:0,av:0,ax:0,avx:0,e};VL.fix.push(f);VB.fix.push(f);VB.festoon.push(f);
      e.onHit=(p,dmg,dir)=>{if(f.dead)return;if(dmg<0.9){f.av+=(dir?dir.x:1)*3;f.avx+=(dir?dir.z:1)*3;S.clink(p);return;}f.dead=true;f.on=false;bulb.visible=false;S.shatter(p,false);S.pop?S.pop(p):S.snap(p);P.emit(p,{count:16,color:[0.95,0.97,1],cvar:0.03,size:0.008,life:0.8,spread:2,grav:9,kind:0});HUD.msg('[POP]',0.6);};}}
  /* the trolley on its rails, three sandbags aboard; it only rolls along the tunnel */
  {const rails=[];for(const dz of[-0.15,0.15])rails.push([4.9,0.03,0.03,V3(vX(10.8),BF+0.015,vZ(6.8+dz)),new THREE.Quaternion()]);for(let x=8.7;x<13.1;x+=0.6)rails.push([0.08,0.02,0.45,V3(vX(x),BF+0.01,vZ(6.8)),new THREE.Quaternion()]);VB.meshes.push(vMerge(rails,M.darkMetal));
    const parts=[{w:0.62,h:0.04,d:0.42,x:0,y:0.05,z:0,mat:M.timber},{w:0.62,h:0.12,d:0.02,x:0,y:0.13,z:0.2,mat:M.timber},{w:0.62,h:0.12,d:0.02,x:0,y:0.13,z:-0.2,mat:M.timber}];for(const sx of[-0.22,0.22])for(const sz of[-0.15,0.15])parts.push({w:0.08,h:0.08,d:0.02,x:sx,y:-0.03,z:sz,mat:M.darkMetal,noCollide:true});parts.push({w:0.58,h:0.08,d:0.32,x:0,y:-0.03,z:0,mat:M.darkMetal,noCollide:true},{w:0.55,h:0.07,d:0.4,x:0,y:-0.035,z:0,mat:M.darkMetal,geo:new THREE.BoxGeometry(0.001,0.001,0.001)});
    const t=compoundEnt(parts,vbAt(9.7,0.07,6.8),{kind:'prop',mat:'timber',mass:25,hp:30,label:'rail trolley'});makeDynamic(t);t.body.linearFactor.set(1,1,0);t.body.angularFactor.set(0,0,0);t.body.linearDamping=0.06;VB.trolley=t;
    /* wheels on rails: almost no friction against the basement floor (only this pair gets the special contact) */const wm=new CANNON.Material('vbwheel'),fm=new CANNON.Material('vbfloor');t.body.material=wm;VB.floor.body.material=fm;world.addContactMaterial(new CANNON.ContactMaterial(wm,fm,{friction:0.004,restitution:0}));
    const sackM=new THREE.MeshStandardMaterial({color:0xb09a6a,roughness:1});for(const dx of[-0.15,0.15,0]){const sb=boxEnt(0.3,0.14,0.36,vbAt(9.7+dx,dx===0?0.38:0.22,6.8),sackM,{kind:'prop',mat:'fabric',mass:9,hp:15,label:'sandbag'});makeDynamic(sb);}}}
function vbBreakPanel(p){const e=VB.sandPanel;if(!e||!e.alive)return;const w=VB.panelWall,pn=VB.panel,uc=(pn.u0+pn.u1)/2;removeEnt(e);S.snap(p);S.crumble(p,1);spawnFragments(p,6,'timber',0.08,w.normal.clone().multiplyScalar(2),2.5,null,0.6);
  HUD.msg('[PANEL GIVES · SAND POURS IN]',1.6);VB.pours.push({p:wallPoint(w,uc,pn.v1-0.1,0.05),n:w.normal.clone(),t:4.5,wide:true});vbHeap(wallPoint(w,uc,0,-0.02),0.75,0.5,0.3,4);}
/* ---------- the tapes */
const VBTAPES=[
  {title:'DAY ONE',lines:['Shelter log, day one. October the third, nineteen eighty-seven. Merv Haddon recording.','The shelter is complete. Two point six metres of sand over my head, give or take a house.','Supplies for six months. Beans for nine.','When it comes, and it will come, I will be the last man in Banksia Court with a sense of humour.']},
  {title:'DAY NINE',lines:['Day nine. Tested the generator.','Neighbours complained. Told them it was a lawnmower.','At eleven at night. They believed me, which tells you everything about this street.']},
  {title:'THE COUNCIL',lines:['Day fourteen. A man from the council came about unusual soil removal.','I told him I am putting in a pool. He asked where the pool is.','I said it is an indoor pool. He is coming back with a form.']},
  {title:'BLACK MONDAY',lines:['October nineteenth. The markets have collapsed.','Told you. Told all of you.','Moved the beans to the top shelf. Nobody is getting the beans.']},
  {title:'LAST TAPE',lines:['Last tape. The tunnel is done. Nobody knows about the ladder.','Not the council. Not the neighbours. Not the next poor sod who rents this place.','If you are listening to this, you found it. Congratulations.','Leave the beans.']}];
function vbTapes(){const d=VB.deck;if(!d)return;VB.tapeIdx=0;VB.tape=null;const black=new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:0.5});
  for(let i=0;i<5;i++){const c=mkCanvas(64,40),x=c.getContext('2d');x.fillStyle='#e8e2cc';x.fillRect(0,0,64,40);x.fillStyle='#222';x.font='bold 8px monospace';x.fillText('TAPE '+(i+1),4,12);x.font='7px monospace';x.fillText(VBTAPES[i].title,4,26);x.fillStyle='#b02020';x.fillRect(4,31,56,3);
    const lab=new THREE.MeshStandardMaterial({map:mkTex(c,1,1),roughness:0.8});const t=boxEnt(0.1,0.016,0.064,vbAt(1.74+(i%3)*0.11,0.775+Math.floor(i/3)*0.017,6.05),[black,black,lab,black,black,black],{kind:'prop',mat:'plastic',mass:0.05,hp:2,label:'cassette: '+VBTAPES[i].title});}
  d.useLabel=()=>d.dead?'':(VB.tape?'STOP':(VB.tapeIdx<5?'PLAY TAPE '+(VB.tapeIdx+1):'REWIND TO TAPE 1'));
  d.use=()=>{if(d.dead)return;S.click(d.mesh.position,1800);if(VB.tape){vbTapeStop();return;}if(VB.tapeIdx>=5)VB.tapeIdx=0;const tp=VBTAPES[VB.tapeIdx++];VB.tape={tp,i:0,next:1.2};VB.tapeSnd=vbStatic();HUD.msg(`[TAPE: ${tp.title}]`,1.2);};
  d.onHit=(p,dmg)=>{if(dmg<1.4||d.dead)return;d.dead=true;vbTapeStop();S.snap(p);sparks(p,8,[1,0.8,0.4]);HUD.msg('[TAPE DECK SMASHED · MERV FALLS SILENT]',1.4);};}
function vbTapeStop(){VB.tape=null;if(VB.tapeSnd){VB.tapeSnd.stop();VB.tapeSnd=null;}try{window.speechSynthesis&&window.speechSynthesis.cancel();}catch(e){}}
/* ---------- below ground: hum, drips, a room echo */
function vbAmbience(){if(!S.ctx||VB.amb)return;const c=S.ctx;VB.amb=vbLoop((c2,out)=>{const o=c2.createOscillator();o.frequency.value=58;const o2=c2.createOscillator();o2.frequency.value=117;const g2=c2.createGain();g2.gain.value=0.3;o.connect(out);o2.connect(g2);g2.connect(out);o.start();o2.start();return[o,o2];});
  try{const len=Math.round(c.sampleRate*0.7);const ir=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2);}const cv=c.createConvolver();cv.buffer=ir;const wet=c.createGain();wet.gain.value=0;S.master.connect(cv);cv.connect(wet);wet.connect(S.comp);VB.wet=wet;}catch(e){}}
function vbUpdateCreepy(dt){const now_=S.ctx?S.ctx.currentTime:0;const below=vbUnderground();if(!VB.amb&&below)vbAmbience();if(VB.amb){VB.amb.g.gain.setTargetAtTime(below?0.035:0,now_,0.3);}if(VB.wet)VB.wet.gain.setTargetAtTime(below?0.32:0,now_,0.3);
  if(below&&Math.random()<dt*0.35){const r=VL.room||VBR.bunk;const p=vbAt(r.x0+Math.random()*(r.x1-r.x0),BHT-0.1,r.z0+Math.random()*(r.z1-r.z0));S.tone({f:1700+Math.random()*1200,f1:900,dur:0.07,type:'sine',gain:0.05,pos:p});}
  if(below&&Math.random()<dt*0.04)S.creak&&S.creak(camera.getWorldPosition(V3()).add(V3(0,2.4,0)));
  /* sand: pours, then heaps (the collider arrives when the heap has grown) */for(let i=VB.pours.length-1;i>=0;i--){const q=VB.pours[i];q.t-=dt;if(q.t<=0){VB.pours.splice(i,1);continue;}P.emit(q.p,{count:q.wide?6:4,color:[0.79,0.66,0.42],cvar:0.06,size:0.012,svar:0.006,life:1.1,vel:q.n,speed:0.8,spread:q.wide?0.6:0.35,grav:9.8,drag:0.3,kind:0});if(Math.random()<0.4)P.emit(q.p,{count:1,color:[0.85,0.78,0.6],size:0.06,life:1.4,spread:0.6,grav:0.6,drag:1.6,kind:1});if(Math.random()<dt*4)S.noise({dur:0.3,gain:0.12,type:'lowpass',f:700,pos:q.p});}
  for(const h of VB.heaps){if(h.body)continue;h.t+=dt;if(h.t<=0)continue;const k=Math.min(1,h.t/h.grow);const s_=0.15+0.85*k;h.m.scale.set(s_,k,s_);if(k>=1){h.m.scale.set(1,1,1);const b=new CANNON.Body({mass:0});b.addShape(new CANNON.Sphere(h.R));b.position.set(h.base.x,BF+h.h-h.R,h.base.z);registerBody(b);h.body=b;SHADOW.dirty=true;}}
  /* the trolley stays on its rails: no sideways drift, stops at both ends */{const t=VB.trolley;if(t&&t.alive&&t.body){const b=t.body,zr=vZ(6.8),x0=vX(8.85),x1=vX(12.95);if(Math.abs(b.position.z-zr)>1e-4||b.velocity.z!==0){b.position.z=zr;b.velocity.z=0;}if(b.position.x<x0){b.position.x=x0;if(b.velocity.x<0)b.velocity.x*=-0.25;S.clink(b.position);}if(b.position.x>x1){b.position.x=x1;if(b.velocity.x>0){b.velocity.x*=-0.25;S.thud(toT(b.position),0.6);}}if(Math.abs(b.velocity.x)>0.4&&Math.random()<dt*6)S.noise({dur:0.08,gain:0.06,type:'bandpass',f:900,pos:toT(b.position)});}}
  /* festoon bulbs swing; the pool light on a bulb follows it */for(const f of VB.festoon||[]){if(f.dead)continue;f.av+=(-f.ang*18-f.av*1.6)*dt;f.ang+=f.av*dt;f.avx+=(-f.ax*18-f.avx*1.6)*dt;f.ax+=f.avx*dt;f.piv.rotation.set(f.ax*0.5,0,f.ang*0.5);f.piv.updateMatrixWorld(true);const p=f.mesh.getWorldPosition(V3());f.x=p.x;f.y=p.y;f.z=p.z;for(const s of VL.pool)if(s.fix===f)s.l.position.set(p.x,p.y,p.z);}
  /* the tape plays line by line; spoken when you're close, captioned always */if(VB.tape){const T=VB.tape;T.next-=dt;if(T.next<=0){if(T.i>=T.tp.lines.length){vbTapeStop();HUD.msg('[CLICK. END OF TAPE]',1);}else{const line=T.tp.lines[T.i++];const d=camera.getWorldPosition(V3()).distanceTo(VB.deck.mesh.position);if(d<4.5)VO.speak(line,'tvm',{near:true});HUD.msg('[MERV: "'+line.toUpperCase()+'"]',Math.min(6,1.6+line.length*0.055));T.next=1.4+line.length*0.065;}}if(VB.tapeSnd)VB.tapeSnd.g.gain.setTargetAtTime(0.04*Math.pow(clamp(1-camera.getWorldPosition(V3()).distanceTo(VB.deck.mesh.position)/7,0,1),1.5),now_,0.05);}}
