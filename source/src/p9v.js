
/* ============================================================ v6 · 0 — THE VILLA (prototype: an empty house)
   p9v — 4/23 Banksia Court, built from a floor plan instead of four hard-coded walls. The default since v8.0 (?bedsit builds the old flat instead).
   - VP is the plan: rooms as rectangles in plan metres (x east, z from the back fence side 0 to the street 9.8), pairs of
     rooms with no wall between them, and openings placed on the line between two rooms (or a room and outside).
   - Walls are worked out from shared room edges: a stretch of line with different rooms either side is a wall; with
     'out' on one side it's an outside wall (brick skin, batts). Internal walls face the north/west room and take their
     thickness on the south/east side; they're trimmed where they butt into another wall's thickness.
   - Wall insides are DORMANT: studs, noggins, plates, batts and screws exist as data (so support and screw logic works)
     but have no physics body, no mesh in the scene and no screw instance until a sheet first leaves that wall (villaWake).
     Most walls are never opened, so most of the house costs nothing to simulate.
   - Lights are a pool: four ceiling lights follow you through the house (the one in your room casts shadows), so the
     light count never changes and three.js never recompiles a material mid-game. */

const VP={ox:-8.8,oz:-4.9,W:17.6,D:9.8,
  rooms:[
    {id:'laundry',name:'Laundry',x0:0,z0:0,x1:2.2,z1:4.0,floor:'tile',wet:true},
    {id:'kitchen',name:'Kitchen',x0:2.2,z0:0,x1:5.8,z1:4.0,floor:'vinyl'},
    {id:'dining',name:'Dining',x0:5.8,z0:0,x1:9.2,z1:4.0,floor:'vinyl'},
    {id:'bath',name:'Bathroom',x0:9.2,z0:0,x1:11.6,z1:2.6,floor:'tile',wet:true},
    {id:'wc',name:'WC',x0:9.2,z0:2.6,x1:10.4,z1:4.0,floor:'tile',wet:true},
    {id:'bathx',name:'Bathroom',x0:10.4,z0:2.6,x1:11.6,z1:4.0,floor:'tile',wet:true},
    {id:'bed3',name:'Bedroom 3',x0:11.6,z0:0,x1:14.6,z1:4.0,floor:'carpet'},
    {id:'bed2',name:'Bedroom 2',x0:14.6,z0:0,x1:17.6,z1:4.0,floor:'carpet'},
    {id:'hall',name:'Hallway',x0:3.2,z0:4.0,x1:17.6,z1:5.0,floor:'vinyl'},
    {id:'garage',name:'Garage',x0:0,z0:4.0,x1:3.2,z1:9.8,floor:'concrete'},
    {id:'entry',name:'Entry',x0:3.2,z0:5.0,x1:4.4,z1:9.8,floor:'vinyl'},
    {id:'office',name:'Office',x0:4.4,z0:5.0,x1:7.2,z1:9.8,floor:'carpet'},
    {id:'living',name:'Living room',x0:7.2,z0:5.0,x1:11.6,z1:9.8,floor:'carpet'},
    {id:'master',name:'Master bedroom',x0:11.6,z0:5.0,x1:15.2,z1:9.8,floor:'carpet'},
    {id:'wir',name:'Walk-in robe',x0:15.2,z0:5.0,x1:17.6,z1:7.4,floor:'carpet'},
    {id:'ensuite',name:'Ensuite',x0:15.2,z0:7.4,x1:17.6,z1:9.8,floor:'tile',wet:true}],
  open:[['kitchen','dining'],['kitchen','hall'],['entry','hall'],['bath','bathx']],
  /* an opening: the two sides it joins, where along that line (plan metres), width, kind, sill and head heights */
  ops:[
    ['laundry','kitchen',2.0,0.82,'door'],['laundry','garage',1.1,0.82,'door'],['laundry','out',1.1,0.82,'door'],
    ['kitchen','out',4.0,1.5,'window',1.0,2.1],['dining','out',7.5,2.4,'slider'],['dining','hall',7.5,2.0,'arch'],
    ['wc','hall',9.8,0.72,'door'],['bathx','hall',11.0,0.72,'door'],['bath','out',10.4,0.9,'window',1.4,2.1],
    ['bed3','hall',12.2,0.82,'door'],['bed3','out',13.4,1.5,'window',0.9,2.1],['bed2','hall',15.2,0.82,'door'],['bed2','out',16.4,1.5,'window',0.9,2.1],
    ['garage','out',1.6,2.6,'roller'],['entry','out',3.8,0.82,'front'],
    ['office','hall',5.6,0.82,'door'],['office','out',5.8,1.5,'window',0.9,2.1],
    ['living','hall',9.4,2.4,'arch'],['living','out',9.4,2.4,'window',0.6,2.1],
    ['master','hall',12.2,0.82,'door'],['master','out',13.4,1.8,'window',0.9,2.1],['master','wir',6.2,0.8,'arch'],['master','ensuite',8.6,0.72,'door'],
    ['ensuite','out',16.4,0.6,'window',1.5,2.1]],
  /* ceiling manholes: x = roughly where (snapped to the joist bay), z0 = the hole's north edge; rows of ceiling sheet already break at 4.9 */
  manholes:[{id:'hall',x:10.05,z0:4.3,room:'hall'},{id:'garage',x:2.25,z0:4.9,room:'garage'}],
  spawn:[3.8,9.0]};
const vX=x=>x+VP.ox,vZ=z=>z+VP.oz;
function vRoomAt(px,pz){for(const r of VP.rooms)if(px>r.x0-1e-6&&px<r.x1+1e-6&&pz>r.z0-1e-6&&pz<r.z1+1e-6)return r;return null;}
function vRoomAtWorld(x,z){return vRoomAt(x-VP.ox,z-VP.oz);}
const VROOM={};for(const r of VP.rooms)VROOM[r.id]=r;
const VW={walls:[],ext:[],faces:[],ceiling:null,woken:0,floor:null,roomAt:vRoomAtWorld};

/* ---------- walls from the plan */
function villaSegments(){const lines=new Map();const add=(k,a,b)=>{if(!lines.has(k))lines.set(k,new Set());const s=lines.get(k);s.add(+a.toFixed(4));s.add(+b.toFixed(4));};
  for(const r of VP.rooms){add('h:'+r.z0,r.x0,r.x1);add('h:'+r.z1,r.x0,r.x1);add('v:'+r.x0,r.z0,r.z1);add('v:'+r.x1,r.z0,r.z1);}
  const inside=(px,pz)=>VP.rooms.find(r=>px>r.x0+1e-6&&px<r.x1-1e-6&&pz>r.z0+1e-6&&pz<r.z1-1e-6);
  const isOpen=(a,b)=>VP.open.some(p=>(p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a));const segs=[];
  for(const [key,set] of lines){const [o,cs]=key.split(':');const c=+cs;const pts=[...set].sort((a,b)=>a-b);let cur=null;
    for(let i=0;i<pts.length-1;i++){const m=(pts[i]+pts[i+1])/2,e=0.05;const A=o==='h'?inside(m,c-e):inside(c-e,m),B=o==='h'?inside(m,c+e):inside(c+e,m);const a=A?A.id:'out',b=B?B.id:'out';
      const wall=a!==b&&!(a==='out'&&b==='out')&&!isOpen(a,b);if(wall&&cur&&cur.a===a&&cur.b===b&&Math.abs(cur.t1-pts[i])<1e-6)cur.t1=pts[i+1];else{if(cur)segs.push(cur);cur=wall?{o,c,t0:pts[i],t1:pts[i+1],a,b}:null;}}
    if(cur)segs.push(cur);}
  return segs;}
const VT=0.11;
function vRect(s){return s.o==='h'?{x0:s.t0,x1:s.t1,z0:s.c,z1:s.c+VT}:{x0:s.c,x1:s.c+VT,z0:s.t0,z1:s.t1};}
function vOverlap(a,b,e=1e-6){return a.x0<b.x1-e&&b.x0<a.x1-e&&a.z0<b.z1-e&&b.z0<a.z1-e;}
function vFreeEnds(list,set){/* wall ends that butt into nothing: no wall beyond them and not on the outside line */const out=[];const ext=(x,z)=>x<=1e-6||x>=VP.W-1e-6||z<=1e-6||z>=VP.D-1e-6;
  for(const s of set)for(const end of[0,1]){const t=end?s.t1:s.t0,R=vRect(s);const pr=s.o==='h'?{x0:end?t:t-0.02,x1:end?t+0.02:t,z0:R.z0+0.01,z1:R.z1-0.01}:{x0:R.x0+0.01,x1:R.x1-0.01,z0:end?t:t-0.02,z1:end?t+0.02:t};
    if(!list.some(q=>q!==s&&vOverlap(pr,vRect(q),0))&&!(s.o==='h'?ext(t,s.c):ext(s.c,t)))out.push([s,end]);}return out;}
function vTrimWalls(segs){const ints=segs.filter(s=>s.kind==='int');const span=(w,R)=>w.o==='h'?[R.x0,R.x1]:[R.z0,R.z1];
  const ends=(w,l)=>(w.t0>=l[0]-1e-6&&w.t0<l[1]-1e-6)||(w.t1>l[0]+1e-6&&w.t1<=l[1]+1e-6);
  const cutBy=(c,o)=>{const [l0,l1]=span(c,vRect(o));if(c.t0>=l0-1e-6&&c.t0<l1)c.t0=l1;else c.t1=l0;};
  for(let pass=0,changed=true;changed&&pass<20;pass++){changed=false;for(const s of ints)for(const q of ints){if(s===q||s.o===q.o)continue;const A=vRect(s),B=vRect(q);if(!vOverlap(A,B))continue;
    const sE=ends(s,span(s,B)),qE=ends(q,span(q,A));let cut;if(sE&&!qE)cut=s;else if(qE&&!sE)cut=q;else if(sE&&qE){const cost=w=>{const bk=[w.t0,w.t1];cutBy(w,w===s?q:s);const n=vFreeEnds(ints,[s,q]).length;[w.t0,w.t1]=bk;return n;};cut=cost(s)<=cost(q)?s:q;}else{console.warn('villa: walls cross',s,q);continue;}
    cutBy(cut,cut===s?q:s);changed=true;}}
  VW.freeEnds=vFreeEnds(ints,ints);}
function villaEndCaps(){/* a wall that stops at an open doorway is wrapped in plasterboard, not left open to the cavity */const caps=[];const q=new THREE.Quaternion();
  for(const [s,end] of VW.freeEnds){const t=end?s.t1:s.t0,o=end?0.005:-0.005;if(s.o==='h')caps.push([0.01,PH,VT+0.006,V3(vX(t+o),PH/2,vZ(s.c+VT/2)),q]);else caps.push([VT+0.006,PH,0.01,V3(vX(s.c+VT/2),PH/2,vZ(t+o)),q]);}
  if(caps.length)VOPEN.caps=vMerge(caps,M.trim);}
function villaWalls(){const segs=villaSegments();let n=0;
  for(const s of segs){s.kind=(s.a==='out'||s.b==='out')?'ext':'int';s.front=s.kind==='ext'?(s.a==='out'?'b':'a'):'a';}
  /* internal walls take their thickness on the south/east side of their line, so two of them can claim the same square at a
     junction. Give each square to ONE wall: a wall that merely ends there is cut back; at a corner where both end, cut the
     one whose end would otherwise show into a room (v6.0 cut too eagerly and left 11 cm slits into the cavity) */
  vTrimWalls(segs);
  for(const s of segs){const front=s.front==='a'?-1:1;let ax,az,bx,bz;
    if(s.o==='h'){if(front<0){ax=s.t0;bx=s.t1;}else{ax=s.t1;bx=s.t0;}az=bz=s.c;}else{if(front<0){az=s.t1;bz=s.t0;}else{az=s.t0;bz=s.t1;}ax=bx=s.c;}
    const w=mkWall('V'+(n++),vX(ax),vZ(az),vX(bx),vZ(bz),s.kind);w.villa=true;w.dormant=true;w.seg=s;w.rooms={front:s.front==='a'?s.a:s.b,back:s.front==='a'?s.b:s.a};VW.walls.push(w);if(s.kind==='ext')VW.ext.push(w);}
  /* openings: on the wall between the two named sides, at that point along the line */
  for(const [p,q,at,wd,kind,v0,v1] of VP.ops){const w=VW.walls.find(w=>{const r=w.rooms;return((r.front===p&&r.back===q)||(r.front===q&&r.back===p))&&w.seg.t0-1e-6<=at-wd/2&&w.seg.t1+1e-6>=at+wd/2;});
    if(!w){console.warn('villa: no wall for opening',p,q,at);continue;}const s=w.seg;const dirPos=(s.o==='h'?w.b.x>w.a.x:w.b.z>w.a.z);const t0=s.o==='h'?w.a.x-VP.ox:w.a.z-VP.oz;const u=dirPos?at-t0:t0-at;
    const lo=kind==='window'?v0:0,hi=kind==='window'?v1:(kind==='arch'||kind==='slider'||kind==='roller'?2.1:2.06);w.openings.push({u0:u-wd/2,u1:u+wd/2,v0:lo,v1:hi,kind,label:kind==='front'?'front door':kind});}}

/* ---------- textures: painted once from shared tiles, at half the bedsit's resolution */
const VTEX={};const VPXM=128;
function vBase(kind){if(VTEX[kind])return VTEX[kind];const S=256,c=mkCanvas(S,S),x=c.getContext('2d');
  if(kind==='plaster'){x.fillStyle='#e2dccb';x.fillRect(0,0,S,S);speckle(x,S,S,2200,[226,220,203],18,0.45);noiseOverlay(x,S,S,14,4);}
  else if(kind==='tile'){x.fillStyle='#b9b6ae';x.fillRect(0,0,S,S);for(let ty=0;ty<S;ty+=32)for(let tx=0;tx<S;tx+=32){const l=90+srand()*4;x.fillStyle=`hsl(45,10%,${l}%)`;x.fillRect(tx+1.5,ty+1.5,29,29);}speckle(x,S,S,300,[240,238,232],10,0.3,1);}
  else if(kind==='tilePeach'){/* 1987, never refitted: 150 peach squares with a brown feature band */x.fillStyle='#b8a090';x.fillRect(0,0,S,S);for(let ty=0;ty<S;ty+=32)for(let tx=0;tx<S;tx+=32){const l=78+srand()*4;x.fillStyle=`hsl(22,45%,${l}%)`;x.fillRect(tx+1.5,ty+1.5,29,29);}speckle(x,S,S,300,[240,220,200],10,0.3,1);}
  VTEX[kind]=c;return c;}
function vFaceCanvas(L,H,kind){const band=kind==='tilePeach';const w=Math.max(16,Math.round(L*VPXM)),h=Math.max(16,Math.round(H*VPXM));const c=mkCanvas(w,h),x=c.getContext('2d');const b=vBase(kind);for(let yy=0;yy<h;yy+=256)for(let xx=0;xx<w;xx+=256)x.drawImage(b,xx,yy);
  if(kind==='plaster'){for(let i=0;i<Math.ceil(L*1.2);i++)stain(x,srand()*w,srand()*h,20+srand()*70,'110,90,60',0.05+srand()*0.1);for(let i=0;i<Math.ceil(L*2);i++)stain(x,srand()*w,h*(0.88+srand()*0.12),20+srand()*40,'50,42,34',0.18);x.fillStyle='rgba(40,35,30,0.12)';for(let i=0;i<Math.ceil(L*6);i++)x.fillRect(srand()*w,srand()*h,1+srand()*4,1+srand()*4);}
  else{for(let i=0;i<Math.ceil(L);i++)stain(x,srand()*w,h*(0.7+srand()*0.3),20+srand()*40,'80,70,50',0.12);}
  if(band){x.fillStyle='rgba(120,70,40,0.85)';const by=Math.round(h*(1-1.2/H));x.fillRect(0,by,w,Math.round(VPXM*0.1));}return mkDrawable(c);}

/* ---------- framing, sheets, brick skin */
/* sheet joints run along studs and fixed rows, but never within a hand's width of an opening edge: a 5 cm sliver or a 15 cm strip over a door head has nothing to screw into */
function vFaceCols(f){const L=f.L;const edges=[];for(const op of f.wall.openings){edges.push(f.side>0?op.u0:L-op.u1,f.side>0?op.u1:L-op.u0);}const us=f.wall.studU.map(u=>f.side>0?u:L-u);const arr=[0,L,...edges];for(const u of us){if(u>0.1&&u<L-0.1&&!edges.some(e=>Math.abs(e-u)<0.12))arr.push(u);}return uniqSorted(arr,0.04);}
function vFaceRows(f){const lv=[];for(const op of f.wall.openings){lv.push(op.v1);if(op.v0>0.1)lv.push(op.v0);}const arr=[0,f.H,...lv];for(const v of[0.45,0.9,1.35,1.8,2.25])if(!lv.some(e=>Math.abs(e-v)<0.3))arr.push(v);return uniqSorted(arr,0.04);}
function vSolidRects(u0,u1,v0,v1,ops){/* the wall area minus its openings, as rectangles (for colliders) */const xs=[u0,u1];for(const o of ops){if(o.u0>u0&&o.u0<u1)xs.push(o.u0);if(o.u1>u0&&o.u1<u1)xs.push(o.u1);}xs.sort((a,b)=>a-b);const out=[];
  for(let i=0;i<xs.length-1;i++){const a=xs[i],b=xs[i+1];if(b-a<0.01)continue;const m=(a+b)/2;const o=ops.find(o=>m>o.u0&&m<o.u1);if(!o){out.push([a,b,v0,v1]);continue;}if(o.v0>v0+0.02)out.push([a,b,v0,o.v0]);if(o.v1<v1-0.02)out.push([a,b,o.v1,v1]);}return out;}
function villaBricks(w){const U0=-0.25,U1=w.L+0.25,H=PH+0.2;const cols=Math.ceil((U1-U0)/0.24)+1,rows=Math.ceil(H/0.086);const im=new THREE.InstancedMesh(brickGeo,M.brick,cols*rows);im.castShadow=false;im.receiveShadow=true;im.userData.kind='bricks';im.userData.wall=w;
  const list=[],grid=new Map();let k=0;const c=new THREE.Color();const hole=(u,v)=>w.openings.some(o=>u>o.u0-0.1&&u<o.u1+0.1&&v>o.v0-0.04&&v<o.v1+0.04);
  for(let r=0;r<rows;r++){const off=(r%2)*0.12;for(let i=0;i<cols;i++){const u=U0+off+i*0.24+0.115,v=0.038+r*0.086;if(u>U1+0.05||hole(u,v))continue;const p=wallPoint(w,u,v,0.195);_m4.compose(p,w.q,_s1);im.setMatrixAt(k,_m4);c.setHSL(0.06+srand()*0.03,0.42+srand()*0.15,0.36+srand()*0.12);im.setColorAt(k,c);grid.set(r*cols+i,k);list.push({u,v,p,alive:true,id:k});k++;}}
  im.count=k;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();im.frustumCulled=true;hitRoot.add(im);
  const sh=new THREE.Shape();sh.moveTo(U0,-0.15);sh.lineTo(U1,-0.15);sh.lineTo(U1,H);sh.lineTo(U0,H);sh.closePath();for(const o of w.openings){const p=new THREE.Path();p.moveTo(o.u0,Math.max(o.v0,-0.1));p.lineTo(o.u0,o.v1);p.lineTo(o.u1,o.v1);p.lineTo(o.u1,Math.max(o.v0,-0.1));p.closePath();sh.holes.push(p);}
  /* v7.0: the mortar sits 18 mm behind the brick faces (at 0.25 it shared their plane and z-fought: the shimmer) */const mm=new THREE.Mesh(new THREE.ShapeGeometry(sh),M.mortar);mm.userData.villaMortar=true;mm.position.copy(wallPoint(w,0,0,0.232));mm.quaternion.copy(w.q);mm.receiveShadow=true;scene.add(mm);
  /* v7.2: the collider is panels about 2 bricks x 5 courses; a panel drops out once most of its bricks are gone, so you can climb through a hole */
  const body=new CANNON.Body({mass:0});const panels=[];for(const [a,b,v0,v1] of vSolidRects(U0,U1,-0.15,H,w.openings)){const nu=Math.max(1,Math.round((b-a)/0.48)),nv=Math.max(1,Math.round((v1-v0)/0.43));const du=(b-a)/nu,dv=(v1-v0)/nv;
    for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const u0=a+i*du,u1=u0+du,w0=v0+j*dv,w1=w0+dv;const shp=new CANNON.Box(new CANNON.Vec3(du/2,dv/2,0.055));body.addShape(shp,toC(wallPoint(w,(u0+u1)/2,(w0+w1)/2,0.195).sub(w.origin)),qC(w.q));panels.push({u0,u1,v0:w0,v1:w1,sh:shp,n:0,gone:0,removed:false});}}
  for(const br of list){const P=panels.find(P=>br.u>=P.u0&&br.u<P.u1&&br.v>=P.v0&&br.v<P.v1);if(P){P.n++;br.panel=P;}}
  body.position.copy(toC(w.origin));const e=mkEnt({body,kind:'brickwall',mat:'brick',wall:w,mass:0,hp:999,label:'brick skin'});BRICKS[w.name]={im,list,e,cols,grid,villa:true,w,U0,U1,H,out:w.depthZ.clone().normalize(),rec:-1,mortar:mm,panels,body,onGone:vbBrickGone};VBSKINS.push(BRICKS[w.name]);w.brickMesh=im;}
/* a brick has come out: cut its hole in the mortar sheet (that sheet was the "fibre cement" behind every hole), wake the stud wall behind, and drop the collider panel once most of it is gone */
function vbBrickGone(B,br){const w=B.w;
  {const sh=new THREE.Shape();sh.moveTo(B.U0,-0.15);sh.lineTo(B.U1,-0.15);sh.lineTo(B.U1,B.H);sh.lineTo(B.U0,B.H);sh.closePath();for(const o of w.openings){const p=new THREE.Path();p.moveTo(o.u0,Math.max(o.v0,-0.1));p.lineTo(o.u0,o.v1);p.lineTo(o.u1,o.v1);p.lineTo(o.u1,Math.max(o.v0,-0.1));p.closePath();sh.holes.push(p);}
    for(const b of B.list){if(!b.gone)continue;const p=new THREE.Path();p.moveTo(b.u-0.112,b.v-0.039);p.lineTo(b.u+0.112,b.v-0.039);p.lineTo(b.u+0.112,b.v+0.039);p.lineTo(b.u-0.112,b.v+0.039);p.closePath();sh.holes.push(p);}
    const g=new THREE.ShapeGeometry(sh);B.mortar.geometry.dispose();B.mortar.geometry=g;}
  const P=br.panel;if(P&&!P.removed){P.gone++;if(P.gone>=Math.ceil(P.n*0.7)){P.removed=true;B.body.removeShape(P.sh);B.body.updateBoundingRadius();B.body.aabbNeedsUpdate=true;}}
  /* the stud wall(s) behind this patch of brick */for(const w2 of VW.walls){if(w2.kind!=='ext')continue;if(Math.abs(w2.normal.dot(w.normal))<0.99)continue;const d=Math.abs(br.p.clone().sub(w2.origin).dot(w2.normal));if(d>0.6)continue;const uv=wallUV(w2,br.p);if(uv.u<-0.1||uv.u>w2.L+0.1)continue;w2._brickHole=true;if(w2.dormant)villaWake(w2);}
  SHADOW.dirty=true;}
const VBSKINS=[];

function villaBrickLines(){/* one brick skin per side of the house: the outside walls on one line merged into a stand-in wall (not built, not in WALLS) */const groups=new Map();
  for(const w of VW.ext){const k=w.seg.o+':'+w.seg.c+':'+w.seg.front;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(w);}const out=[];let n=0;
  for(const ws of groups.values()){const s=ws[0].seg;const t0=Math.min(...ws.map(w=>w.seg.t0)),t1=Math.max(...ws.map(w=>w.seg.t1));const front=s.front==='a'?-1:1;let ax,az,bx,bz;
    if(s.o==='h'){if(front<0){ax=t0;bx=t1;}else{ax=t1;bx=t0;}az=bz=s.c;}else{if(front<0){az=t1;bz=t0;}else{az=t0;bz=t1;}ax=bx=s.c;}
    const L=mkWall('VB'+(n++),vX(ax),vZ(az),vX(bx),vZ(bz),'ext');WALLS.splice(WALLS.indexOf(L),1);L.villa=true;
    for(const w of ws)for(const o of w.openings){const a=wallUV(L,wallPoint(w,o.u0,0)).u,b=wallUV(L,wallPoint(w,o.u1,0)).u;L.openings.push({u0:Math.min(a,b),u1:Math.max(a,b),v0:o.v0,v1:o.v1,kind:o.kind});}out.push(L);}
  return out;}
/* ---------- waking a wall: its insides become real the first time a sheet leaves it */
const VBATCH=[];
function villaWake(w){if(!w||!w.dormant)return;w.dormant=false;VW.woken++;const tb=new StaticBatch(M.timber),bb=new StaticBatch(M.batt);
  const wake=(e,b)=>{if(!e.alive||!e.dormant)return;e.dormant=false;if(e.body)registerBody(e.body);if(e.mesh){e.mesh.userData.ent=e;if(!e.dynamic&&b){b.members.add(e);e.batched=true;e.batchMats=new Set([b.mat]);e.batchRef=b;}else hitRoot.add(e.mesh);}};
  for(const e of[...w.studs,...w.noggins,...w.plates])wake(e,tb);for(const e of BATTS)if(e.wall===w)wake(e,bb);for(const e of[...WIRES,...PIPES])if(e.wall===w&&e.dormant)wake(e,null);
  for(const sc of screws)if(sc.w===w&&sc.id<0)screwInstance(sc);tb.rebuild();bb.rebuild();VBATCH.push(tb,bb);SHADOW.dirty=true;}

/* ---------- floor: one slab, one painted floor for the whole house (dust, puddles and scorch marks land on it) */
const VF={x0:0,z1:0,w:0,d:0,px:48};
function villaFloor(){VF.x0=vX(-0.3);VF.z1=vZ(VP.D+0.3);VF.w=VP.W+0.6;VF.d=VP.D+0.6;const W=Math.round(VF.w*VF.px),H=Math.round(VF.d*VF.px);const c=mkCanvas(W,H),x=c.getContext('2d');x.fillStyle='#6f6a62';x.fillRect(0,0,W,H);
  const P=(px,pz)=>[(px+0.3)*VF.px,(VP.D+0.3-pz)*VF.px];
  for(const r of VP.rooms){const [a,b]=P(r.x0,r.z1),[c2,d]=P(r.x1,r.z0);const w=c2-a,h=d-b;x.save();x.translate(a,b);x.beginPath();x.rect(0,0,w,h);x.clip();const s=0.3*VF.px;
    if(r.floor==='carpet'){x.fillStyle=r.id==='master'||r.id==='wir'?'#7c6a58':'#8a7258';x.fillRect(0,0,w,h);speckle(x,w,h,w*h/3,[138,114,88],28,0.55,1.5);}
    else if(r.floor==='vinyl'){x.fillStyle='#cfc4a8';x.fillRect(0,0,w,h);for(let yy=0;yy<h;yy+=s)for(let xx=0;xx<w;xx+=s){x.fillStyle=((Math.round(xx/s)+Math.round(yy/s))%2)?'#c3b694':'#d8ceb4';x.fillRect(xx,yy,s-1,s-1);}speckle(x,w,h,w*h/12,[200,190,165],20,0.3,1);}
    else if(r.floor==='tile'){const pe=r.id==='ensuite';x.fillStyle=pe?'#8a6a58':'#9a978e';x.fillRect(0,0,w,h);for(let yy=0;yy<h;yy+=s)for(let xx=0;xx<w;xx+=s){x.fillStyle=pe?`hsl(20,38%,${62+srand()*5}%)`:`hsl(40,8%,${80+srand()*5}%)`;x.fillRect(xx+1,yy+1,s-2,s-2);}}
    else{x.fillStyle='#8f8d88';x.fillRect(0,0,w,h);speckle(x,w,h,w*h/4,[143,141,136],26,0.5,1.5);for(let i=0;i<6;i++)stain(x,srand()*w,srand()*h,20+srand()*50,'40,36,30',0.25);}
    for(let i=0;i<3;i++)stain(x,srand()*w,srand()*h,10+srand()*30,'60,50,40',0.12);x.restore();}
  const d=mkDrawable(c);floorDrawable=d;
  /* v6.2: the floor is a shape with the two basement holes cut in it (garage hatch, master trapdoor); uv as before: canvas top = the street side */
  const sh=new THREE.Shape();const fx0=VF.x0,fx1=VF.x0+VF.w,fz0=VF.z1-VF.d,fz1=VF.z1;sh.moveTo(fx0,-fz1);sh.lineTo(fx1,-fz1);sh.lineTo(fx1,-fz0);sh.lineTo(fx0,-fz0);sh.closePath();vbFloorShape(sh);
  const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);{const P=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<P.count;i++)uv.setXY(i,(P.getX(i)-VF.x0)/VF.w,1-(VF.z1-P.getZ(i))/VF.d);}
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:d.tex,roughness:0.92}));m.position.y=0.004;m.receiveShadow=true;
  const body=vbFloorBody(fx0,fz0,fx1,fz1,-0.3,0);VW.floor=mkEnt({mesh:m,body,kind:'slab',mat:'concrete',mass:0,hp:9999,wakeThreshold:1e9,label:'floor',noBatch:true,drawable:d});villaCarpetCanvas();}

/* ---------- ceiling: one sheet over the whole house on joists at 600 centres */
function villaCeiling(){const X1=vX(VP.W),Z0=vZ(0);const w={name:'VC',kind:'ceiling',L:VP.W,H:VP.D,origin:V3(X1,PH,Z0),right:V3(-1,0,0),up:V3(0,0,1),normal:V3(0,-1,0),depthZ:V3(0,1,0),studs:[],noggins:[],plates:[],openings:[],wires:[],faces:[],thick:0.1,frameDepth:0.055,a:V3(X1,0,Z0),b:V3(vX(0),0,Z0),dir:V3(-1,0,0),n:V3(0,-1,0),villa:true,dormant:true,endOK:()=>true};
  w.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(w.right,w.up,w.depthZ));WALLS.push(w);VW.ceiling=w;
  const us=[];for(let u=0.045;u<=w.L-0.045+1e-6;u+=0.6)us.push(+u.toFixed(3));if(w.L-0.045-us[us.length-1]>0.2)us.push(+(w.L-0.045).toFixed(3));w.studU=us;
  const bear=[...new Set(VP.rooms.flatMap(r=>[r.z0,r.z1]))].filter(z=>z>0.05&&z<VP.D-0.05);
  for(const u of us){const j=timberEnt(w,'v',-0.1,w.H+0.1,u,0.055,{anchors:[-0.1,w.H+0.1,...bear],label:'ceiling joist',joist:true});w.studs.push(j);}
  /* manholes: 600 square, between two joists (hole edges on the joist centrelines so no sheet joint lands in a sliver), trimmers either end */
  for(const m of VP.manholes){const k=Math.round((VP.W-m.x-0.345)/0.6);const u0=us[k],u1=us[k+1];m.u0=u0;m.u1=u1;m.v0=m.z0;m.v1=m.z0+0.6;w.openings.push({u0,u1,v0:m.v0,v1:m.v1,kind:'manhole'});
    for(const vc of[m.v0-0.0225,m.v1+0.0225]){const t=timberEnt(w,'u',u0+0.0225,u1-0.0225,vc,0.055,{noggin:true,label:'trimmer',studU:[u0,u1]});w.noggins.push(t);}}
  const f=mkFace(w,1,'paper',(()=>{const c=mkCanvas(Math.round(w.L*72),Math.round(w.H*72)),x=c.getContext('2d');const b=vBase('plaster');for(let yy=0;yy<c.height;yy+=256)for(let xx=0;xx<c.width;xx+=256)x.drawImage(b,xx,yy);for(let i=0;i<30;i++)stain(x,srand()*c.width,srand()*c.height,20+srand()*60,'120,100,60',0.06+srand()*0.08);return mkDrawable(c);})());
  const cols=[0,...us.filter(u=>u>0.3&&u<w.L-0.3),w.L];const nr=Math.round(w.H/1.2),rows=[];for(let i=0;i<=nr;i++)rows.push(+(w.H*i/nr).toFixed(3));for(const m of VP.manholes)rows.push(m.v0,m.v1);buildSheet(f,uniqSorted(cols,0.04),uniqSorted(rows,0.04));}

/* ---------- roof (hip, terracotta), soffits, gutters */
function texRoofTiles(){const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#7a3a22';x.fillRect(0,0,256,256);for(let r=0;r<8;r++){for(let i=0;i<8;i++){const ox=(r%2)*16;const g=x.createLinearGradient(i*32+ox,0,i*32+ox+32,0);g.addColorStop(0,'#8e4428');g.addColorStop(0.5,'#b25a34');g.addColorStop(1,'#7a3820');x.fillStyle=g;x.fillRect(i*32+ox,r*32,30,29);}x.fillStyle='rgba(0,0,0,0.35)';x.fillRect(0,r*32+29,256,3);}speckle(x,256,256,900,[150,80,50],30,0.25,1.5);return c;}
function villaRoof(){const e=0.45,X0=vX(0)-e,X1=vX(VP.W)+e,Z0=vZ(0)-e,Z1=vZ(VP.D)+e,hd=(Z1-Z0)/2,zc=(Z0+Z1)/2,eY=PH+0.12,rY=eY+hd*Math.tan(22.5*Math.PI/180),xa=X0+hd,xb=X1-hd;
  const tris=[[[X0,eY,Z1],[X1,eY,Z1],[xb,rY,zc]],[[X0,eY,Z1],[xb,rY,zc],[xa,rY,zc]],[[X1,eY,Z0],[X0,eY,Z0],[xa,rY,zc]],[[X1,eY,Z0],[xa,rY,zc],[xb,rY,zc]],[[X0,eY,Z0],[X0,eY,Z1],[xa,rY,zc]],[[X1,eY,Z1],[X1,eY,Z0],[xb,rY,zc]]];
  const pos=[],uv=[];for(const t of tris)for(const p of t){pos.push(...p);uv.push(p[0]*1.4,p[2]*1.4+p[1]*1.4);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  {const P=g.attributes.position;for(let i=0;i<P.count;i+=3){const a=V3(P.getX(i),P.getY(i),P.getZ(i)),b=V3(P.getX(i+1),P.getY(i+1),P.getZ(i+1)),c=V3(P.getX(i+2),P.getY(i+2),P.getZ(i+2));if(b.clone().sub(a).cross(c.clone().sub(a)).y<0){P.setXYZ(i+1,c.x,c.y,c.z);P.setXYZ(i+2,b.x,b.y,b.z);const U=g.attributes.uv,u1=[U.getX(i+1),U.getY(i+1)];U.setXY(i+1,U.getX(i+2),U.getY(i+2));U.setXY(i+2,u1[0],u1[1]);}}g.computeVertexNormals();}/* outside faces up; the inside gets its own mesh */
  const mat=new THREE.MeshStandardMaterial({map:mkTex(texRoofTiles(),1,1),roughness:0.85});const roof=new THREE.Mesh(g,mat);villaRoofUnder(g);roof.castShadow=false;roof.receiveShadow=true;scene.add(roof);
  const sh=new THREE.Shape();sh.moveTo(X0,Z0);sh.lineTo(X1,Z0);sh.lineTo(X1,Z1);sh.lineTo(X0,Z1);sh.closePath();const hole=new THREE.Path();hole.moveTo(vX(0)-0.26,vZ(0)-0.26);hole.lineTo(vX(0)-0.26,vZ(VP.D)+0.26);hole.lineTo(vX(VP.W)+0.26,vZ(VP.D)+0.26);hole.lineTo(vX(VP.W)+0.26,vZ(0)-0.26);hole.closePath();sh.holes.push(hole);
  const sg=new THREE.ShapeGeometry(sh);sg.rotateX(Math.PI/2);const soffit=new THREE.Mesh(sg,M.gypsum);soffit.position.y=eY-0.02;scene.add(soffit);
  const gm=new THREE.MeshStandardMaterial({color:0xd9d4c4,roughness:0.6,metalness:0.2});for(const [cx,cz,lx,lz] of[[(X0+X1)/2,Z1,X1-X0,0.12],[(X0+X1)/2,Z0,X1-X0,0.12],[X0,zc,0.12,Z1-Z0],[X1,zc,0.12,Z1-Z0]]){const gt=new THREE.Mesh(new THREE.BoxGeometry(lx,0.16,lz),gm);gt.position.set(cx,eY-0.04,cz);scene.add(gt);}
  /* a collider just under the tiles so nothing thrown up through the ceiling leaves the house */for(const s of[-1,1]){const ang=Math.atan2(rY-eY,hd);const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(s*ang,0,0));const b=boxBody((X1-X0)/2,0.03,hd/Math.cos(ang)/2,V3((X0+X1)/2,(eY+rY)/2-0.05,zc+s*hd/2),qC(q));registerBody(b);}}

/* ---------- openings: jamb liners, window glass + bronze frames, the slider, a roller door, the front door gap */
function vMerge(boxes,mat,parent){/* boxes: [w,h,d,pos,quat] → one mesh, one draw call */if(!boxes.length)return null;const pos=[],nor=[],uv=[];const m4=new THREE.Matrix4(),n3=new THREE.Matrix3(),v=V3();
  for(const [w,h,d,p,q] of boxes){const g=new THREE.BoxGeometry(w,h,d).toNonIndexed();m4.compose(p,q,_s1);n3.getNormalMatrix(m4);const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;for(let i=0;i<P.count;i++){v.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(m4);pos.push(v.x,v.y,v.z);v.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(n3).normalize();nor.push(v.x,v.y,v.z);uv.push(U.getX(i),U.getY(i));}g.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.castShadow=false;m.receiveShadow=true;(parent||scene).add(m);return m;}
const VOPEN={glass:[],frames:[],jambs:[]};
function vMergeGeos(items){/* [geometry, Matrix4] → one non-indexed geometry (positions, normals, uvs) */const pos=[],nor=[],uv=[];const n3=new THREE.Matrix3(),v=V3();for(const [g0,m4] of items){const g=g0.index?g0.toNonIndexed():g0;n3.getNormalMatrix(m4);const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;for(let i=0;i<P.count;i++){v.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(m4);pos.push(v.x,v.y,v.z);v.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(n3).normalize();nor.push(v.x,v.y,v.z);uv.push(U?U.getX(i):0,U?U.getY(i):0);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeBoundingSphere();return g;}
const _mm4=(x,y,z,rx=0,ry=0,rz=0)=>new THREE.Matrix4().compose(V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),_s1);
function villaOpenings(){const jamb=[],frame=[],bronze=new THREE.MeshStandardMaterial({color:0x4a3a2c,roughness:0.45,metalness:0.6});
  for(const w of VW.walls){const T=w.kind==='ext'?0.25:w.thick;for(const o of w.openings){const uc=(o.u0+o.u1)/2,vc=(o.v0+o.v1)/2,ow=o.u1-o.u0,oh=o.v1-o.v0;
      /* liners through the wall's thickness (white-painted timber), sill under windows; doors get real jambs (p9s), so their liner only covers the brick reveal */const lt=0.018;const isDoor=o.kind==='door'||o.kind==='front';const Tl=isDoor?(w.kind==='ext'?T-0.11:0):T,zl=isDoor?0.11+Tl/2:T/2;if(Tl>0)jamb.push([lt,oh,Tl,wallPoint(w,o.u0+lt/2,vc,zl),w.q],[lt,oh,Tl,wallPoint(w,o.u1-lt/2,vc,zl),w.q],[ow,lt,Tl,wallPoint(w,uc,o.v1-lt/2,zl),w.q]);
      if(o.v0>0.05)jamb.push([ow+0.08,0.025,T+0.04,wallPoint(w,uc,o.v0-0.012,T/2-0.02),w.q]);
      if(o.kind==='window'||o.kind==='slider'){const z=w.kind==='ext'?0.16:T/2;const bt=0.04;frame.push([ow,bt,0.05,wallPoint(w,uc,o.v0+bt/2,z),w.q],[ow,bt,0.05,wallPoint(w,uc,o.v1-bt/2,z),w.q],[bt,oh,0.05,wallPoint(w,o.u0+bt/2,vc,z),w.q],[bt,oh,0.05,wallPoint(w,o.u1-bt/2,vc,z),w.q],[0.03,oh,0.05,wallPoint(w,uc,vc,z),w.q]);
        for(const s of[-1,1]){const pw=ow/2-bt*1.2,pu=uc+s*ow/4;const g=boxEnt(pw,oh-bt*2,0.006,wallPoint(w,pu,vc,z+s*0.012),M.glass,{kind:'fixture',mat:'glass',mass:6,hp:2,label:o.kind==='slider'?'sliding door glass':'window pane',quat:w.q,shardCol:[0.82,0.9,0.95],shadow:false});g.mesh.castShadow=false;g.vo={w,o,s};VOPEN.glass.push(g);}}}}
  VOPEN.jambs.push(vMerge(jamb,M.trim));VOPEN.frames.push(vMerge(frame,bronze));}

/* ---------- outside: lawn, fences, the driveway, a patio, the porch, a letterbox and a streetlight */
function texGrass(){const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#3f4a2a';x.fillRect(0,0,256,256);speckle(x,256,256,9000,[70,84,44],40,0.6,2);for(let i=0;i<14;i++)stain(x,srand()*256,srand()*256,10+srand()*40,'110,96,60',0.3);return c;}
function villaOutside(){/* the lawn has a hole where the house sits (v6.2: you can look down through the floor now) */const lsh=new THREE.Shape();lsh.moveTo(-30,-30);lsh.lineTo(30,-30);lsh.lineTo(30,30);lsh.lineTo(-30,30);lsh.closePath();{const hp=new THREE.Path(),a=vX(0)-0.1,b=vX(VP.W)+0.1,c=-(vZ(0)-0.1),d=-(vZ(VP.D)+0.1);hp.moveTo(a,c);hp.lineTo(a,d);hp.lineTo(b,d);hp.lineTo(b,c);hp.closePath();lsh.holes.push(hp);}
  const g=new THREE.ShapeGeometry(lsh);g.rotateX(-Math.PI/2);{const P=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<P.count;i++)uv.setXY(i,P.getX(i)/3,P.getZ(i)/3);}const gm=new THREE.MeshStandardMaterial({map:mkTex(texGrass(),1,1),roughness:1});const lawn=new THREE.Mesh(g,gm);lawn.position.y=-0.15;lawn.receiveShadow=true;scene.add(lawn);/* the yard's ground: four slabs round the house, so the basement under the house has room */{const hx0=vX(0)-0.3,hx1=vX(VP.W)+0.3,hz0=vZ(0)-0.3,hz1=vZ(VP.D)+0.3,E=30;const box=(x0,x1,z0,z1)=>registerBody(boxBody((x1-x0)/2,0.25,(z1-z0)/2,V3((x0+x1)/2,-0.4,(z0+z1)/2)));box(-E,E,-E,hz0);box(-E,E,hz1,E);box(-E,hx0,hz0,hz1);box(hx1,E,hz0,hz1);}
  const pave=[],X=vX,Z=vZ;pave.push([3.2,0.12,4.6,V3(X(1.6),-0.09,Z(VP.D)+2.3),new THREE.Quaternion()]);pave.push([1.8,0.12,1.4,V3(X(3.8),-0.07,Z(VP.D)+0.7),new THREE.Quaternion()]);pave.push([7.0,0.1,3.2,V3(X(5.7),-0.08,Z(0)-1.6),new THREE.Quaternion()]);pave.push([1.0,0.1,6.0,V3(X(3.8),-0.09,Z(VP.D)+3.6),new THREE.Quaternion()]);
  vMerge(pave,M.cement);for(const [w,h,d,p] of pave){registerBody(boxBody(w/2,h/2,d/2,p));}
  /* sheet-metal fence: back and sides, a low brick front fence */const fm=new THREE.MeshStandardMaterial({color:0x6e746a,roughness:0.6,metalness:0.4});const fx0=X(-3),fx1=X(VP.W+3),fz0=Z(-7),fz1=Z(VP.D+5);const fence=[[fx1-fx0,1.8,0.04,V3((fx0+fx1)/2,0.75,fz0)],[0.04,1.8,fz1-fz0,V3(fx0,0.75,(fz0+fz1)/2)],[0.04,1.8,fz1-fz0,V3(fx1,0.75,(fz0+fz1)/2)]].map(a=>[...a,new THREE.Quaternion()]);vMerge(fence,fm);for(const [w,h,d,p] of fence)registerBody(boxBody(w/2+0.02,h/2,d/2+0.02,p));
  const front=[[fx1-fx0-6.2,0.7,0.23,V3((fx0+fx1)/2+3.1,0.2,fz1)]].map(a=>[...a,new THREE.Quaternion()]);vMerge(front,M.brick);for(const [w,h,d,p] of front)registerBody(boxBody(w/2,h/2,d/2,p));
  /* the letterbox, stuffed */const lb=vMerge([[0.3,0.36,0.4,V3(X(5.2),0.75,fz1),new THREE.Quaternion()],[0.08,0.6,0.08,V3(X(5.2),0.3,fz1),new THREE.Quaternion()]],M.brick);
  /* streetlight */const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,6,8),M.darkMetal);pole.position.set(X(8),2.85,fz1+3);scene.add(pole);const head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.25),new THREE.MeshStandardMaterial({color:0x222222,emissive:0xffb86a,emissiveIntensity:2.5}));head.position.set(X(8),5.8,fz1+2.7);scene.add(head);
  const sl=new THREE.PointLight(0xffb070,14,22,1.4);sl.position.set(X(8),5.6,fz1+2.6);scene.add(sl);VL.street=sl;VL.streetHead=head;}


/* ---------- the roof space: what you see once you're up through a manhole */
const VR={};
function vBeam(list,a,b,w,d,drop){/* a timber from a to b (points on the roof surface), dropped by `drop` and laid flat across the slope */const A=a.clone(),B=b.clone();A.y-=drop;B.y-=drop;const dir=B.clone().sub(A);const len=dir.length();if(len<0.05)return;dir.normalize();
  let side=dir.clone().cross(V3(0,1,0));if(side.lengthSq()<1e-6)side=V3(1,0,0);side.normalize();const up=side.clone().cross(dir).normalize();const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(dir,up,side));
  list.push([len,d,w,A.add(B).multiplyScalar(0.5),q]);}
function texTileUnder(){const c=mkCanvas(128,128),x=c.getContext('2d');x.fillStyle='#4a2a1c';x.fillRect(0,0,128,128);for(let i=0;i<4;i++){x.fillStyle=i%2?'#52301f':'#45271a';x.fillRect(i*32+1,0,30,128);}
  x.fillStyle='rgba(0,0,0,0.45)';x.fillRect(0,0,128,10);/* the batten, lit from below by nothing much */const g=x.createLinearGradient(0,96,0,128);g.addColorStop(0,'#6b5032');g.addColorStop(1,'#4a3622');x.fillStyle=g;x.fillRect(0,100,128,24);x.fillStyle='rgba(0,0,0,0.5)';x.fillRect(0,124,128,4);
  for(let i=0;i<6;i++){x.fillStyle='rgba(255,214,160,'+(0.25+srand()*0.4)+')';x.fillRect(srand()*128,srand()*90,1+srand()*2,1);}speckle(x,128,128,500,[70,40,28],18,0.3,1);return c;}
function villaRoofSpace(){const e=0.45,X0=vX(0)-e,X1=vX(VP.W)+e,Z0=vZ(0)-e,Z1=vZ(VP.D)+e,hd=(Z1-Z0)/2,zc=(Z0+Z1)/2,eY=PH+0.12,ta=Math.tan(22.5*Math.PI/180),rY=eY+hd*ta,xa=X0+hd,xb=X1-hd;
  Object.assign(VR,{X0,X1,Z0,Z1,hd,zc,eY,rY,xa,xb,ta});const S_=(x,z)=>V3(x,eY+ta*Math.min(x-X0,X1-x,z-Z0,Z1-z,hd),z);const timber=[],heavy=[],col=[];const hx0=vX(0),hx1=vX(VP.W),hz0=vZ(0),hz1=vZ(VP.D);
  /* common + jack rafters at 600, from the wall line up to the ridge or the hip they die into */
  for(let x=hx0+0.3;x<hx1-0.1;x+=0.6){const dt=Math.min(hd,x-X0,X1-x);vBeam(timber,S_(x,hz1),S_(x,Z1-dt+0.03),0.035,0.09,0.1);vBeam(timber,S_(x,hz0),S_(x,Z0+dt-0.03),0.035,0.09,0.1);}
  for(let z=hz0+0.3;z<hz1-0.1;z+=0.6){const dt=Math.min(hd,z-Z0,Z1-z);vBeam(timber,S_(hx0,z),S_(X0+dt-0.03,z),0.035,0.09,0.1);vBeam(timber,S_(hx1,z),S_(X1-dt+0.03,z),0.035,0.09,0.1);}
  /* hips and the ridge */const hdrop=0.13;vBeam(heavy,S_(hx0+0.02,hz0+0.02),S_(xa,zc),0.045,0.19,hdrop);vBeam(heavy,S_(hx0+0.02,hz1-0.02),S_(xa,zc),0.045,0.19,hdrop);vBeam(heavy,S_(hx1-0.02,hz0+0.02),S_(xb,zc),0.045,0.19,hdrop);vBeam(heavy,S_(hx1-0.02,hz1-0.02),S_(xb,zc),0.045,0.19,hdrop);
  vBeam(heavy,S_(xa,zc),S_(xb,zc),0.035,0.19,0.14);
  /* underpurlins at mid-span, propped by struts that lean onto the hallway walls; ridge struts straight down onto the hall's south wall */
  const top=PH+0.1;const strut=(a,b)=>{vBeam(heavy,a,b,0.07,0.07,0);const c=a.clone().add(b).multiplyScalar(0.5);const d=b.clone().sub(a);col.push({c,h:d.length(),q:new THREE.Quaternion().setFromUnitVectors(V3(0,1,0),d.normalize())});};
  for(const [zp,zw] of[[Z1-hd/2,vZ(5.06)],[Z0+hd/2,vZ(3.94)]]){const y=eY+ta*hd/2-0.2;const xs0=X0+hd/2+0.2,xs1=X1-hd/2-0.2;heavy.push([xs1-xs0,0.14,0.07,V3((xs0+xs1)/2,y,zp),new THREE.Quaternion()]);col.push({c:V3((xs0+xs1)/2,y,zp),box:[xs1-xs0,0.14,0.07]});
    for(let x=xs0+0.6;x<xs1-0.3;x+=2.1){if(VP.manholes.some(m=>Math.abs(vX(m.x)-x)<0.7))continue;strut(V3(x,top,zw),V3(x,y-0.07,zp));}}
  for(const px of[6.2,8.6,11.6]){const x=vX(px);strut(V3(x,top,vZ(5.0)),V3(x,rY-0.33,zc));}
  VR.frame=vMerge(timber,M.timber);VR.heavy=vMerge(heavy,M.timber);if(VR.frame)VR.frame.castShadow=true;if(VR.heavy)VR.heavy.castShadow=true;
  const b=new CANNON.Body({mass:0});for(const k of col){if(k.box)b.addShape(new CANNON.Box(new CANNON.Vec3(k.box[0]/2,k.box[1]/2,k.box[2]/2)),toC(k.c));else b.addShape(new CANNON.Box(new CANNON.Vec3(0.04,k.h/2,0.04)),toC(k.c),qC(k.q));}registerBody(b);
  /* the hip ends need colliders too (v6.0 only had the two long planes) */const ang=Math.atan(ta);for(const s of[-1,1]){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-s*ang));registerBody(boxBody(hd/Math.cos(ang)/2,0.03,(Z1-Z0)/2,V3(s<0?X0+hd/2:X1-hd/2,(eY+rY)/2-0.05,zc),qC(q)));}}
function villaRoofUnder(roofGeo){/* the tiles from inside: undersides, battens, the odd pinhole of streetlight */const P=roofGeo.attributes.position;const pos=[],uv=[];for(let i=0;i<P.count;i+=3){for(const k of[0,2,1]){const x=P.getX(i+k),y=P.getY(i+k)-0.03,z=P.getZ(i+k);pos.push(x,y,z);uv.push((x+z)*1.6,y*7.9);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:mkTex(texTileUnder(),1,1),roughness:0.95}));m.receiveShadow=true;scene.add(m);VR.under=m;}

/* ---------- manholes: hinged covers you open with E or smash out, and a way up */
const VMH=[];
function villaManholes(){const ring=[];const q0=new THREE.Quaternion();const paint=new THREE.MeshStandardMaterial({color:0xe2dccb,roughness:0.95});const mats=paint;
  for(const m of VP.manholes){const x0=vX(VP.W-m.u1),x1=vX(VP.W-m.u0),z0=vZ(m.v0),z1=vZ(m.v1);const cx=(x0+x1)/2,cz=(z0+z1)/2,W=x1-x0,D=z1-z0,t=0.06,y=PH-0.009;
    /* the trim ring: 60 mm moulding around the hole with a 20 mm lip the cover rests on */ring.push([W+2*t-0.04,0.024,t,V3(cx,y,z0-t/2+0.02),q0],[W+2*t-0.04,0.024,t,V3(cx,y,z1+t/2-0.02),q0],[t,0.024,D-0.04,V3(x0-t/2+0.02,y,cz),q0],[t,0.024,D-0.04,V3(x1+t/2-0.02,y,cz),q0]);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(W-0.004,0.012,D-0.004),mats);const pos=V3(cx,PH+0.006,cz);mesh.position.copy(pos);mesh.castShadow=true;mesh.receiveShadow=true;
    const body=boxBody((W-0.004)/2,0.006,(D-0.004)/2,pos);const e=mkEnt({mesh,body,kind:'fixture',mat:'gypsum',mass:3,hp:999,wakeThreshold:1e9,noBatch:true,label:'manhole cover'});
    const M_={m,e,x0,x1,z0,z1,cx,cz,hits:0,broken:false};e.mh=M_;
    kinDoor(e,VW.floor,V3(cx,PH,z0),V3(1,0,0),1.5,{name:'MANHOLE',speed:2.8,onChange:fr=>{if(fr>0.02&&VW.ceiling&&VW.ceiling.dormant){villaWake(VW.ceiling);S.creak&&S.creak(pos,0.8);}}});
    e.onHit=(p,dmg,dir)=>{if(M_.broken)return;M_.hits+=dmg;dust(p,8,0.6);S.thud(p,0.7);if(M_.hits>=2.6)villaBreakCover(M_,p,dir);else HUD.msg(M_.hits>1.2?'[MANHOLE COVER CRACKED]':'[MANHOLE COVER RATTLES IN ITS RING]',1);};
    VMH.push(M_);}
  VR.rings=vMerge(ring,new THREE.MeshStandardMaterial({color:0xf2eee4,roughness:0.45}));if(VR.rings)VR.rings.castShadow=true;}
function villaBreakCover(M_,p,dir){if(M_.broken)return;M_.broken=true;const e=M_.e;const ang=e.kin?e.kin.ang:0;const c=e.mesh.position.clone();removeEnt(e);
  S.snap(p);S.thud(p,1.2);dust(c,30,1.1);P.emit(c,{count:24,color:[0.88,0.85,0.78],cvar:0.05,size:0.016,life:1.2,spread:1.6,grav:9,kind:0});
  const mat=new THREE.MeshStandardMaterial({color:0xe2dccb,roughness:0.95});for(const [ox,oz] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const piece=boxEnt(0.27,0.012,0.27,c.clone().add(V3(ox*0.15,-0.02-(ang>0.5?0.2:0),oz*0.15)),mat,{kind:'prop',mat:'chip',mass:0.8,hp:3,label:'busted manhole cover'});makeDynamic(piece);piece.body.velocity.set(ox*0.6+(dir?dir.x:0),-1.2-Math.random(),oz*0.6+(dir?dir.z:0));piece.body.angularVelocity.set(rnd(-4,4),rnd(-4,4),rnd(-4,4));}
  if(VW.ceiling&&VW.ceiling.dormant)villaWake(VW.ceiling);HUD.msg('[MANHOLE COVER SMASHED OUT · THE ROOF SPACE IS OPEN]',1.8);SHADOW.dirty=true;}
function vManholeOpen(M_){return M_.broken||(M_.e.kin&&M_.e.kin.ang>1.0);}

/* ---------- getting up there: stand on something, get your head into the hole, SPACE; CROUCH over the hole to drop back down */
const VCL={on:false,t:0,path:null,hintT:0,mask:-1,inRoof:false};
function villaPlayer(dt){const b=player.body;if(VCL.on){VCL.t+=dt;const P_=VCL.path;let i=0;while(i<P_.length-2&&VCL.t>P_[i+1].t)i++;const a=P_[i],c=P_[i+1];const k=clamp((VCL.t-a.t)/(c.t-a.t),0,1),kk=k*k*(3-2*k);
    b.position.set(lerp(a.p.x,c.p.x,kk),lerp(a.p.y,c.p.y,kk),lerp(a.p.z,c.p.z,kk));b.velocity.set(0,0,0);if(VCL.t>=P_[P_.length-1].t){VCL.on=false;b.collisionFilterMask=VCL.mask;b.velocity.set(0,VCL.down?-0.5:0,0);if(!VCL.down)S.step(true);}return true;}
  if(vbOnStairs(dt))return true;
  const eyeY=b.position.y+player.eyeOff;const inRoof=b.position.y>PH+0.05;if(inRoof!==VCL.inRoof){VCL.inRoof=inRoof;if(inRoof)HUD.msg('[ROOF SPACE · WALK THE JOISTS · L = TORCH · CROUCH OVER THE HOLE TO DROP DOWN]',2.6);}
  VCL.hintT-=dt;for(const M_ of VMH){if(!vManholeOpen(M_))continue;const inside=b.position.x>M_.x0-0.12&&b.position.x<M_.x1+0.12&&b.position.z>M_.z0-0.12&&b.position.z<M_.z1+0.12;if(!inside)continue;
    if(!inRoof){const reach=eyeY>PH-0.38,raised=(player.lastGroundY||0)>0.18;if(reach&&raised&&keys.Space){villaClimb(M_,false);return true;}
      if(VCL.hintT<=0&&reach){VCL.hintT=2.5;HUD.msg(raised?'[SPACE · CLIMB INTO THE ROOF]':'[TOO HIGH · STAND ON SOMETHING]',1.4);}}
    else if(player.crouch&&b.position.y<PH+0.75){villaClimb(M_,true);return true;}}
  return false;}
function villaClimb(M_,down){const b=player.body;VCL.on=true;VCL.down=down;VCL.t=0;VCL.mask=b.collisionFilterMask;b.collisionFilterMask=0;player._jumpLock=true;const p0=V3(b.position.x,b.position.y,b.position.z);const c=V3(M_.cx,0,M_.cz);
  if(!down){const f=V3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));const ty=PH+0.1+0.37+0.04;const off=c.clone().addScaledVector(f,0.62);VCL.path=[{t:0,p:p0},{t:0.5,p:V3(c.x,ty,c.z)},{t:0.85,p:V3(off.x,ty,off.z)}];S.step(true);shakeCam(0.2);}
  else{VCL.path=[{t:0,p:p0},{t:0.25,p:V3(c.x,p0.y,c.z)},{t:0.55,p:V3(c.x,PH-0.55,c.z)}];S.step(true);}}

/* ---------- something to stand on: the tradie left a platform ladder in the garage and a milk crate in the hall */
function villaProps(){const al=new THREE.MeshStandardMaterial({color:0xc4c8cc,roughness:0.4,metalness:0.7}),rub=M.darkMetal,tread=new THREE.MeshStandardMaterial({color:0x8e9296,roughness:0.6,metalness:0.6});
  const H=0.92,hy=H/2;const parts=[{w:0.42,h:0.03,d:0.34,x:0,y:H-0.015-hy,z:-0.03,mat:tread},{w:0.46,h:0.1,d:0.02,x:0,y:H+0.05-hy,z:-0.2,mat:al,noCollide:true}];
  for(const sx of[-1,1]){parts.push({w:0.035,h:0.97,d:0.025,x:sx*0.22,y:-0.01,z:0.16,mat:al,rot:[-0.2,0,0],noCollide:true},{w:0.035,h:0.97,d:0.025,x:sx*0.22,y:-0.01,z:-0.22,mat:al,rot:[0.2,0,0],noCollide:true},{w:0.05,h:0.03,d:0.05,x:sx*0.22,y:0.015-hy,z:0.25,mat:rub,noCollide:true},{w:0.05,h:0.03,d:0.05,x:sx*0.22,y:0.015-hy,z:-0.31,mat:rub,noCollide:true});
    parts.push({w:0.04,h:H-0.04,d:0.04,x:sx*0.2,y:-0.02,z:0.2,mat:al,geo:new THREE.BoxGeometry(0.001,0.001,0.001)},{w:0.04,h:H-0.04,d:0.04,x:sx*0.2,y:-0.02,z:-0.26,mat:al,geo:new THREE.BoxGeometry(0.001,0.001,0.001)});}
  for(const [yy,zz] of[[0.3,0.2],[0.61,0.1]])parts.push({w:0.42,h:0.03,d:0.11,x:0,y:yy-hy,z:zz,mat:tread});
  const lad=compoundEnt(parts,V3(vX(2.75),hy,vZ(7.2)),{kind:'furniture',mat:'metal',mass:8,hp:40,label:'platform ladder',quat:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0.4,0))});VR.ladder=lad;
  /* the milk crate, upside down, property of a dairy that would like it back */const cc=mkCanvas(128,96),x=cc.getContext('2d');x.fillStyle='#1f4f9a';x.fillRect(0,0,128,96);x.fillStyle='#163a74';for(let r=0;r<3;r++)for(let i=0;i<6;i++)x.fillRect(8+i*20,40+r*18,12,12);x.fillStyle='#d8e2f0';x.font='bold 9px monospace';x.fillText('GOLDEN WATTLE DAIRY',8,14);x.font='7px monospace';x.fillText('THEFT IS AN OFFENCE',18,28);
  const side=new THREE.MeshStandardMaterial({map:mkTex(cc,1,1),roughness:0.7});const blue=new THREE.MeshStandardMaterial({color:0x1f4f9a,roughness:0.7});
  const crate=boxEnt(0.36,0.31,0.36,V3(vX(6.4),0.155,vZ(4.45)),side,{kind:'prop',mat:'plastic',mass:1.6,hp:12,label:'milk crate'});VR.crate=crate;}

/* ---------- lights: a pool of four that follows you */
const VL={pool:[],fix:[],t:0,room:null,street:null};
function villaLights(){/* the ground colour stands in for light bouncing off floors and walls: without it every ceiling away from a lamp goes black */VL.hemi=new THREE.HemisphereLight(0x666c78,0xd8c8b0,1.8);scene.add(VL.hemi);VL.amb=new THREE.AmbientLight(0x3a3f4a,0.28);scene.add(VL.amb);const moon=new THREE.DirectionalLight(0x8fa6d8,0.35);moon.position.set(-20,30,12);scene.add(moon);
  /* v6.3: one more light for the basement flares, added now so no material recompiles when one is struck */VL.flare=new THREE.PointLight(0xff4a28,0,7,1.6);scene.add(VL.flare);
  for(let i=0;i<4;i++){const l=new THREE.PointLight(0xffe2b8,0,8,1.5);if(i===0){l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-0.003;l.shadow.normalBias=0.02;l.shadow.radius=3;l.shadow.camera.near=0.1;l.shadow.camera.far=8;SHADOW.lights.push(l);}scene.add(l);VL.pool.push({l,fix:null,k:0});}
  const disc=[],tube=[];for(const r of VP.rooms){if(r.id==='bathx')continue;const cx=vX((r.x0+r.x1)/2),cz=vZ((r.z0+r.z1)/2);const fluoro=r.id==='garage'||r.id==='laundry'||r.id==='kitchen';const big=r.id==='hall';
    if(big){for(const px of[5,9.5,14]){VL.fix.push({x:vX(px),z:cz,y:PH-0.32,i:5.5,col:0xffe6c4,room:r});disc.push([0.3,0.05,0.3,V3(vX(px),PH-0.03,cz),new THREE.Quaternion()]);}continue;}
    VL.fix.push({x:cx,z:cz,y:PH-0.32,i:fluoro?9:(r.wet?6.5:8),col:fluoro?0xe8f2ff:(r.id==='kitchen'||r.id==='living'?0xfff0d8:0xffe2b8),room:r});(fluoro?tube:disc).push(fluoro?[1.2,0.05,0.12,V3(cx,PH-0.03,cz),new THREE.Quaternion()]:[0.36,0.06,0.36,V3(cx,PH-0.035,cz),new THREE.Quaternion()]);}
  /* v6.5: the fittings are ents now, one glow material per room (veFittings) */LIGHT.tubesAlive=0;}
function villaLightPick(){const p=camera.getWorldPosition(_tvp);const lvl=p.y<-0.35?'b':'h';const r=lvl==='b'?vbRoomAt(p.x-VP.ox,p.z-VP.oz):vRoomAtWorld(p.x,p.z);VL.room=r;const sc=f=>Math.hypot(f.x-p.x,f.z-p.z)-(r&&f.room===r?100:0);const pick=VL.fix.filter(f=>(f.lvl||'h')===lvl).sort((a,b)=>sc(a)-sc(b)).slice(0,VL.pool.length);
  /* keep lights already on a picked fixture where they are; move the others */const free=VL.pool.filter(s=>!pick.includes(s.fix));for(const f of pick){if(VL.pool.some(s=>s.fix===f))continue;const s=free.shift();if(!s)break;s.fix=f;s.k=0;s.l.position.set(f.x,f.y,f.z);s.l.color.setHex(f.col);if(s.l.castShadow)SHADOW.dirty=true;}
  /* the shadow-casting light always sits in your room */const sh=VL.pool[0];const mine=pick[0];if(mine&&sh.fix!==mine){const other=VL.pool.find(s=>s.fix===mine);if(other){const t=other.fix;other.fix=sh.fix;other.k=0;if(other.fix)other.l.position.set(other.fix.x,other.fix.y,other.fix.z),other.l.color.setHex(other.fix.col);sh.fix=t;sh.k=0;sh.l.position.set(t.x,t.y,t.z);sh.l.color.setHex(t.col);SHADOW.dirty=true;}}}
function updateVilla(dt){vSlides(dt);vParkUpdate();updateWS8(dt);updateWS5(dt);updateWS6(dt);updateWS7(dt);veUpdate(dt);updateWS3(dt);updateWS4(dt);VL.t-=dt;if(VL.t<=0){VL.t=0.15;villaLightPick();}const on=VE.lights;
  /* in the roof space the house goes dark: only the shadow-casting light (in the room under the hole) gets up there, through the hole */VL.rk=lerp(VL.rk||0,VCL.inRoof?1:0,1-Math.exp(-dt*4));const rk=VL.rk,shadows=renderer.shadowMap&&renderer.shadowMap.enabled;
  for(const s of VL.pool){const tgt=s.fix&&!s.fix.dead&&(s.fix.lvl==='b'?vbPowered()&&s.fix.on:(s.fix.circuit==='power'?power:s.fix.circuit==='street'?true:on)&&s.fix.on!==false)?s.fix.i:0;s.k=lerp(s.k,tgt,1-Math.exp(-dt*10));const keep=s===VL.pool[0]?(shadows?1:0.18):0;s.l.intensity=s.k*(1-rk*(1-keep));}
  const below=VB.built&&vbUnderground();const lit=below?VB.fix.filter(f=>f.on&&vbPowered()&&f.room===VL.room).length+(VL.flare&&VL.flare.intensity>0?1:0):1;VL.bk=lerp(VL.bk===undefined?0:VL.bk,below?(lit?0.45:0.04):1,1-Math.exp(-dt*5));
  /* v6.5: a dark room is dark: the bounce fill follows whether your room's lights are on */const hr=!below&&VL.room&&VL.room.id?(veRoomLit(VL.room.id)?1:0.2):1;VL.hk=lerp(VL.hk===undefined?1:VL.hk,hr,1-Math.exp(-dt*6));
  if(VL.hemi){VL.hemi.intensity=1.8*(1-0.88*rk)*VL.bk*VL.hk*VIBE.k;VL.amb.intensity=0.28*(1-0.7*rk)*Math.max(0.15,VL.bk)*(0.4+0.6*VIBE.k);}vbUpdate(dt);}

/* ---------- build + boot */
function buildVilla(){/* the bedsit's walls exist as objects but are never framed here; transplanted builders look up their studs */for(const w of[WN,WS,WE,WW,WBN,WBW,WNN,WNE])if(w&&!w.studU)w.studU=[];villaWalls();for(const w of VW.walls)buildWallFrame(w);
  for(const w of VW.walls){const sides=w.kind==='ext'?[1]:[1,-1];for(const side of sides){const room=VROOM[side>0?w.rooms.front:w.rooms.back];if(!room)continue;const kind=room.wet?'tile':'paper';const f=mkFace(w,side,kind,vFaceCanvas(w.L,w.H,room.wet?(room.id==='ensuite'?'tilePeach':'tile'):'plaster'));f.room=room;VW.faces.push(f);buildSheet(f,vFaceCols(f),vFaceRows(f));if(kind==='tile')for(const c of f.chunks){c.mat='tile';c.hp=4.2;c.label='wall tile';}}}
  villaCeiling();for(const L of villaBrickLines())villaBricks(L);buildBatts(VW.ext);villaFloor();villaRoof();villaRoofSpace();villaOpenings();villaEndCaps();villaManholes();vbEntries();villaProps();villaShell();villaLights();villaServices();villaKitchenWS3();villaWS4();villaWS5();villaWS6();villaWS7();villaOutside();villaStreet();villa81();
  for(const f of FACES)for(const c of f.chunks)chunkById.set(c.id,c);recomputeTimber();recomputeSupport();flushBatches();BATCH_LIVE=true;vParkProps();}
/* small things resting on other things (mugs in cupboards, books on shelves, tins in the pantry) keep their body but leave
   the physics world until something wakes them: makeDynamic puts them back. Nothing can bump them while they sit there. */
function vParkProps(){let n=0;for(const e of ents){if(!e.alive||e.dynamic||e.parked||!e.body||e.dormant)continue;if(e.kind!=='prop'||!e.restsOn||e.mass>3||e.use||e.kin||e.cord)continue;world.removeBody(e.body);e.parked=true;n++;const k=vPkKey(e.body.position.x,e.body.position.z);(VPK.get(k)||VPK.set(k,[]).get(k)).push(e);}VW.parked=n;}
const VPK=new Map();function vPkKey(x,z){return Math.floor(x)+','+Math.floor(z);}
/* anything moving that comes within a metre of a parked prop puts it back in the world as a static body */
function vUnpark(b){const cx=Math.floor(b.position.x),cz=Math.floor(b.position.z);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const k=(cx+i)+','+(cz+j),L=VPK.get(k);if(!L)continue;for(const e of L)if(e.parked&&e.alive&&!e.dynamic){e.parked=false;registerBody(e.body);}VPK.delete(k);}}
function vParkUpdate(){if(!VPK.size)return;for(const b of world.bodies){if(b.type!==CANNON.Body.DYNAMIC||b.sleepState===2||b===player.body)continue;const v=b.velocity;if(v.x*v.x+v.y*v.y+v.z*v.z>0.1)vUnpark(b);}}
function villaAfterBoot(){const [px,pz]=VP.spawn;player.body.position.set(vX(px),FLOOR_Y+0.37,vZ(pz));player.yaw=0;player.pitch=0;}
