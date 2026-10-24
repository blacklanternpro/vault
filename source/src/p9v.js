
/* ============================================================ v6 · 0 — THE VILLA (prototype: an empty house)
   p9v — 4/23 Banksia Court, built from a floor plan instead of four hard-coded walls. Only runs with ?villa.
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
function villaWalls(){const segs=villaSegments();let n=0;
  for(const s of segs){s.kind=(s.a==='out'||s.b==='out')?'ext':'int';s.front=s.kind==='ext'?(s.a==='out'?'b':'a'):'a';}
  /* internal walls start/finish clear of another internal wall's thickness (which always lies on that wall's south/east side) */
  for(const s of segs){if(s.kind!=='int')continue;for(const q of segs){if(q===s||q.kind!=='int'||q.o===s.o)continue;if(Math.abs(q.c-s.t0)<1e-6&&s.c>=q.t0-1e-6&&s.c<=q.t1+1e-6)s.t0+=0.11;}}
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
  VTEX[kind]=c;return c;}
function vFaceCanvas(L,H,kind){const w=Math.max(16,Math.round(L*VPXM)),h=Math.max(16,Math.round(H*VPXM));const c=mkCanvas(w,h),x=c.getContext('2d');const b=vBase(kind);for(let yy=0;yy<h;yy+=256)for(let xx=0;xx<w;xx+=256)x.drawImage(b,xx,yy);
  if(kind==='plaster'){for(let i=0;i<Math.ceil(L*1.2);i++)stain(x,srand()*w,srand()*h,20+srand()*70,'110,90,60',0.05+srand()*0.1);for(let i=0;i<Math.ceil(L*2);i++)stain(x,srand()*w,h*(0.88+srand()*0.12),20+srand()*40,'50,42,34',0.18);x.fillStyle='rgba(40,35,30,0.12)';for(let i=0;i<Math.ceil(L*6);i++)x.fillRect(srand()*w,srand()*h,1+srand()*4,1+srand()*4);}
  else{for(let i=0;i<Math.ceil(L);i++)stain(x,srand()*w,h*(0.7+srand()*0.3),20+srand()*40,'80,70,50',0.12);}
  return mkDrawable(c);}

/* ---------- framing, sheets, brick skin */
/* sheet joints run along studs and fixed rows, but never within a hand's width of an opening edge: a 5 cm sliver or a 15 cm strip over a door head has nothing to screw into */
function vFaceCols(f){const L=f.L;const edges=[];for(const op of f.wall.openings){edges.push(f.side>0?op.u0:L-op.u1,f.side>0?op.u1:L-op.u0);}const us=f.wall.studU.map(u=>f.side>0?u:L-u);const arr=[0,L,...edges];for(const u of us){if(u>0.1&&u<L-0.1&&!edges.some(e=>Math.abs(e-u)<0.12))arr.push(u);}return uniqSorted(arr,0.04);}
function vFaceRows(f){const lv=[];for(const op of f.wall.openings){lv.push(op.v1);if(op.v0>0.1)lv.push(op.v0);}const arr=[0,f.H,...lv];for(const v of[0.45,0.9,1.35,1.8,2.25])if(!lv.some(e=>Math.abs(e-v)<0.3))arr.push(v);return uniqSorted(arr,0.04);}
function vSolidRects(u0,u1,v0,v1,ops){/* the wall area minus its openings, as rectangles (for colliders) */const xs=[u0,u1];for(const o of ops){if(o.u0>u0&&o.u0<u1)xs.push(o.u0);if(o.u1>u0&&o.u1<u1)xs.push(o.u1);}xs.sort((a,b)=>a-b);const out=[];
  for(let i=0;i<xs.length-1;i++){const a=xs[i],b=xs[i+1];if(b-a<0.01)continue;const m=(a+b)/2;const o=ops.find(o=>m>o.u0&&m<o.u1);if(!o){out.push([a,b,v0,v1]);continue;}if(o.v0>v0+0.02)out.push([a,b,v0,o.v0]);if(o.v1<v1-0.02)out.push([a,b,o.v1,v1]);}return out;}
function villaBricks(w){const U0=-0.25,U1=w.L+0.25,H=PH+0.2;const cols=Math.ceil((U1-U0)/0.24)+1,rows=Math.ceil(H/0.086);const im=new THREE.InstancedMesh(brickGeo,M.brick,cols*rows);im.castShadow=false;im.receiveShadow=true;im.userData.kind='bricks';im.userData.wall=w;
  const list=[];let k=0;const c=new THREE.Color();const hole=(u,v)=>w.openings.some(o=>u>o.u0-0.1&&u<o.u1+0.1&&v>o.v0-0.04&&v<o.v1+0.04);
  for(let r=0;r<rows;r++){const off=(r%2)*0.12;for(let i=0;i<cols;i++){const u=U0+off+i*0.24+0.115,v=0.038+r*0.086;if(u>U1+0.05||hole(u,v))continue;const p=wallPoint(w,u,v,0.195);_m4.compose(p,w.q,_s1);im.setMatrixAt(k,_m4);c.setHSL(0.06+srand()*0.03,0.42+srand()*0.15,0.36+srand()*0.12);im.setColorAt(k,c);list.push({u,v,p,alive:true,id:k});k++;}}
  im.count=k;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();im.frustumCulled=true;hitRoot.add(im);
  const sh=new THREE.Shape();sh.moveTo(U0,-0.15);sh.lineTo(U1,-0.15);sh.lineTo(U1,H);sh.lineTo(U0,H);sh.closePath();for(const o of w.openings){const p=new THREE.Path();p.moveTo(o.u0,Math.max(o.v0,-0.1));p.lineTo(o.u0,o.v1);p.lineTo(o.u1,o.v1);p.lineTo(o.u1,Math.max(o.v0,-0.1));p.closePath();sh.holes.push(p);}
  const mm=new THREE.Mesh(new THREE.ShapeGeometry(sh),M.mortar);mm.position.copy(wallPoint(w,0,0,0.25));mm.quaternion.copy(w.q);mm.receiveShadow=true;scene.add(mm);
  const body=new CANNON.Body({mass:0});for(const [a,b,v0,v1] of vSolidRects(U0,U1,-0.15,H,w.openings)){body.addShape(new CANNON.Box(new CANNON.Vec3((b-a)/2,(v1-v0)/2,0.055)),toC(wallPoint(w,(a+b)/2,(v0+v1)/2,0.195).sub(w.origin)),qC(w.q));}
  body.position.copy(toC(w.origin));const e=mkEnt({body,kind:'brickwall',mat:'brick',wall:w,mass:0,hp:999,label:'brick skin'});BRICKS[w.name]={im,list,e,cols};w.brickMesh=im;}

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
  for(const e of[...w.studs,...w.noggins,...w.plates])wake(e,tb);for(const e of BATTS)if(e.wall===w)wake(e,bb);
  for(const sc of screws)if(sc.w===w&&sc.id<0)screwInstance(sc);tb.rebuild();bb.rebuild();VBATCH.push(tb,bb);SHADOW.dirty=true;}

/* ---------- floor: one slab, one painted floor for the whole house (dust, puddles and scorch marks land on it) */
const VF={x0:0,z1:0,w:0,d:0,px:48};
function villaFloor(){VF.x0=vX(-0.3);VF.z1=vZ(VP.D+0.3);VF.w=VP.W+0.6;VF.d=VP.D+0.6;const W=Math.round(VF.w*VF.px),H=Math.round(VF.d*VF.px);const c=mkCanvas(W,H),x=c.getContext('2d');x.fillStyle='#6f6a62';x.fillRect(0,0,W,H);
  const P=(px,pz)=>[(px+0.3)*VF.px,(VP.D+0.3-pz)*VF.px];
  for(const r of VP.rooms){const [a,b]=P(r.x0,r.z1),[c2,d]=P(r.x1,r.z0);const w=c2-a,h=d-b;x.save();x.translate(a,b);x.beginPath();x.rect(0,0,w,h);x.clip();const s=0.3*VF.px;
    if(r.floor==='carpet'){x.fillStyle=r.id==='master'||r.id==='wir'?'#7c6a58':'#8a7258';x.fillRect(0,0,w,h);speckle(x,w,h,w*h/3,[138,114,88],28,0.55,1.5);}
    else if(r.floor==='vinyl'){x.fillStyle='#cfc4a8';x.fillRect(0,0,w,h);for(let yy=0;yy<h;yy+=s)for(let xx=0;xx<w;xx+=s){x.fillStyle=((Math.round(xx/s)+Math.round(yy/s))%2)?'#c3b694':'#d8ceb4';x.fillRect(xx,yy,s-1,s-1);}speckle(x,w,h,w*h/12,[200,190,165],20,0.3,1);}
    else if(r.floor==='tile'){x.fillStyle='#9a978e';x.fillRect(0,0,w,h);for(let yy=0;yy<h;yy+=s)for(let xx=0;xx<w;xx+=s){x.fillStyle=`hsl(40,8%,${80+srand()*5}%)`;x.fillRect(xx+1,yy+1,s-2,s-2);}}
    else{x.fillStyle='#8f8d88';x.fillRect(0,0,w,h);speckle(x,w,h,w*h/4,[143,141,136],26,0.5,1.5);for(let i=0;i<6;i++)stain(x,srand()*w,srand()*h,20+srand()*50,'40,36,30',0.25);}
    for(let i=0;i<3;i++)stain(x,srand()*w,srand()*h,10+srand()*30,'60,50,40',0.12);x.restore();}
  const d=mkDrawable(c);floorDrawable=d;const g=new THREE.PlaneGeometry(VF.w,VF.d);g.rotateX(-Math.PI/2);{const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));}/* canvas top = the street side, like floorUV */const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:d.tex,roughness:0.92}));m.position.set(VF.x0+VF.w/2,0.004,VF.z1-VF.d/2);m.receiveShadow=true;
  const body=boxBody(VF.w/2,0.15,VF.d/2,V3(VF.x0+VF.w/2,-0.15,VF.z1-VF.d/2));VW.floor=mkEnt({mesh:m,body,kind:'slab',mat:'concrete',mass:0,hp:9999,label:'floor',noBatch:true,drawable:d});}

/* ---------- ceiling: one sheet over the whole house on joists at 600 centres */
function villaCeiling(){const X1=vX(VP.W),Z0=vZ(0);const w={name:'VC',kind:'ceiling',L:VP.W,H:VP.D,origin:V3(X1,PH,Z0),right:V3(-1,0,0),up:V3(0,0,1),normal:V3(0,-1,0),depthZ:V3(0,1,0),studs:[],noggins:[],plates:[],openings:[],wires:[],faces:[],thick:0.1,frameDepth:0.055,a:V3(X1,0,Z0),b:V3(vX(0),0,Z0),dir:V3(-1,0,0),n:V3(0,-1,0),villa:true,dormant:true,endOK:()=>true};
  w.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(w.right,w.up,w.depthZ));WALLS.push(w);VW.ceiling=w;
  const us=[];for(let u=0.045;u<=w.L-0.045+1e-6;u+=0.6)us.push(+u.toFixed(3));if(w.L-0.045-us[us.length-1]>0.2)us.push(+(w.L-0.045).toFixed(3));w.studU=us;
  const bear=[...new Set(VP.rooms.flatMap(r=>[r.z0,r.z1]))].filter(z=>z>0.05&&z<VP.D-0.05);
  for(const u of us){const j=timberEnt(w,'v',-0.1,w.H+0.1,u,0.055,{anchors:[-0.1,w.H+0.1,...bear],label:'ceiling joist',joist:true});w.studs.push(j);}
  const f=mkFace(w,1,'paper',(()=>{const c=mkCanvas(Math.round(w.L*72),Math.round(w.H*72)),x=c.getContext('2d');const b=vBase('plaster');for(let yy=0;yy<c.height;yy+=256)for(let xx=0;xx<c.width;xx+=256)x.drawImage(b,xx,yy);for(let i=0;i<30;i++)stain(x,srand()*c.width,srand()*c.height,20+srand()*60,'120,100,60',0.06+srand()*0.08);return mkDrawable(c);})());
  const cols=[0,...us.filter(u=>u>0.3&&u<w.L-0.3),w.L];const nr=Math.round(w.H/1.2),rows=[];for(let i=0;i<=nr;i++)rows.push(+(w.H*i/nr).toFixed(3));buildSheet(f,uniqSorted(cols,0.04),uniqSorted(rows,0.04));}

/* ---------- roof (hip, terracotta), soffits, gutters */
function texRoofTiles(){const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#7a3a22';x.fillRect(0,0,256,256);for(let r=0;r<8;r++){for(let i=0;i<8;i++){const ox=(r%2)*16;const g=x.createLinearGradient(i*32+ox,0,i*32+ox+32,0);g.addColorStop(0,'#8e4428');g.addColorStop(0.5,'#b25a34');g.addColorStop(1,'#7a3820');x.fillStyle=g;x.fillRect(i*32+ox,r*32,30,29);}x.fillStyle='rgba(0,0,0,0.35)';x.fillRect(0,r*32+29,256,3);}speckle(x,256,256,900,[150,80,50],30,0.25,1.5);return c;}
function villaRoof(){const e=0.45,X0=vX(0)-e,X1=vX(VP.W)+e,Z0=vZ(0)-e,Z1=vZ(VP.D)+e,hd=(Z1-Z0)/2,zc=(Z0+Z1)/2,eY=PH+0.12,rY=eY+hd*Math.tan(22.5*Math.PI/180),xa=X0+hd,xb=X1-hd;
  const tris=[[[X0,eY,Z1],[X1,eY,Z1],[xb,rY,zc]],[[X0,eY,Z1],[xb,rY,zc],[xa,rY,zc]],[[X1,eY,Z0],[X0,eY,Z0],[xa,rY,zc]],[[X1,eY,Z0],[xa,rY,zc],[xb,rY,zc]],[[X0,eY,Z0],[X0,eY,Z1],[xa,rY,zc]],[[X1,eY,Z1],[X1,eY,Z0],[xb,rY,zc]]];
  const pos=[],uv=[];for(const t of tris)for(const p of t){pos.push(...p);uv.push(p[0]*1.4,p[2]*1.4+p[1]*1.4);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  const mat=new THREE.MeshStandardMaterial({map:mkTex(texRoofTiles(),1,1),roughness:0.85,side:THREE.DoubleSide});const roof=new THREE.Mesh(g,mat);roof.castShadow=false;roof.receiveShadow=true;scene.add(roof);
  const sh=new THREE.Shape();sh.moveTo(X0,Z0);sh.lineTo(X1,Z0);sh.lineTo(X1,Z1);sh.lineTo(X0,Z1);sh.closePath();const hole=new THREE.Path();hole.moveTo(vX(0)-0.26,vZ(0)-0.26);hole.lineTo(vX(0)-0.26,vZ(VP.D)+0.26);hole.lineTo(vX(VP.W)+0.26,vZ(VP.D)+0.26);hole.lineTo(vX(VP.W)+0.26,vZ(0)-0.26);hole.closePath();sh.holes.push(hole);
  const sg=new THREE.ShapeGeometry(sh);sg.rotateX(Math.PI/2);const soffit=new THREE.Mesh(sg,M.gypsum);soffit.position.y=eY-0.02;scene.add(soffit);
  const gm=new THREE.MeshStandardMaterial({color:0xd9d4c4,roughness:0.6,metalness:0.2});for(const [cx,cz,lx,lz] of[[(X0+X1)/2,Z1,X1-X0,0.12],[(X0+X1)/2,Z0,X1-X0,0.12],[X0,zc,0.12,Z1-Z0],[X1,zc,0.12,Z1-Z0]]){const gt=new THREE.Mesh(new THREE.BoxGeometry(lx,0.16,lz),gm);gt.position.set(cx,eY-0.04,cz);scene.add(gt);}
  /* a collider just under the tiles so nothing thrown up through the ceiling leaves the house */for(const s of[-1,1]){const ang=Math.atan2(rY-eY,hd);const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(s*ang,0,0));const b=boxBody((X1-X0)/2,0.03,hd/Math.cos(ang)/2,V3((X0+X1)/2,(eY+rY)/2-0.05,zc+s*hd/2),qC(q));registerBody(b);}}

/* ---------- openings: jamb liners, window glass + bronze frames, the slider, a roller door, the front door gap */
function vMerge(boxes,mat,parent){/* boxes: [w,h,d,pos,quat] → one mesh, one draw call */if(!boxes.length)return null;const pos=[],nor=[],uv=[];const m4=new THREE.Matrix4(),n3=new THREE.Matrix3(),v=V3();
  for(const [w,h,d,p,q] of boxes){const g=new THREE.BoxGeometry(w,h,d).toNonIndexed();m4.compose(p,q,_s1);n3.getNormalMatrix(m4);const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;for(let i=0;i<P.count;i++){v.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(m4);pos.push(v.x,v.y,v.z);v.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(n3).normalize();nor.push(v.x,v.y,v.z);uv.push(U.getX(i),U.getY(i));}g.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.castShadow=false;m.receiveShadow=true;(parent||scene).add(m);return m;}
const VOPEN={glass:[],frames:[],jambs:[]};
function villaOpenings(){const jamb=[],frame=[],bronze=new THREE.MeshStandardMaterial({color:0x4a3a2c,roughness:0.45,metalness:0.6});
  for(const w of VW.walls){const T=w.kind==='ext'?0.25:w.thick;for(const o of w.openings){const uc=(o.u0+o.u1)/2,vc=(o.v0+o.v1)/2,ow=o.u1-o.u0,oh=o.v1-o.v0;
      /* liners through the wall's thickness (white-painted timber), sill under windows */const lt=0.018;jamb.push([lt,oh,T,wallPoint(w,o.u0+lt/2,vc,T/2),w.q],[lt,oh,T,wallPoint(w,o.u1-lt/2,vc,T/2),w.q],[ow,lt,T,wallPoint(w,uc,o.v1-lt/2,T/2),w.q]);
      if(o.v0>0.05)jamb.push([ow+0.08,0.025,T+0.04,wallPoint(w,uc,o.v0-0.012,T/2-0.02),w.q]);
      if(o.kind==='window'||o.kind==='slider'){const z=w.kind==='ext'?0.16:T/2;const bt=0.04;frame.push([ow,bt,0.05,wallPoint(w,uc,o.v0+bt/2,z),w.q],[ow,bt,0.05,wallPoint(w,uc,o.v1-bt/2,z),w.q],[bt,oh,0.05,wallPoint(w,o.u0+bt/2,vc,z),w.q],[bt,oh,0.05,wallPoint(w,o.u1-bt/2,vc,z),w.q],[0.03,oh,0.05,wallPoint(w,uc,vc,z),w.q]);
        for(const s of[-1,1]){const pw=ow/2-bt*1.2,pu=uc+s*ow/4;const g=boxEnt(pw,oh-bt*2,0.006,wallPoint(w,pu,vc,z+s*0.012),M.glass,{kind:'fixture',mat:'glass',mass:6,hp:2,label:o.kind==='slider'?'sliding door glass':'window pane',quat:w.q,shardCol:[0.82,0.9,0.95],shadow:false});g.mesh.castShadow=false;VOPEN.glass.push(g);}}}}
  VOPEN.jambs.push(vMerge(jamb,M.trim));VOPEN.frames.push(vMerge(frame,bronze));}

/* ---------- outside: lawn, fences, the driveway, a patio, the porch, a letterbox and a streetlight */
function texGrass(){const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#3f4a2a';x.fillRect(0,0,256,256);speckle(x,256,256,9000,[70,84,44],40,0.6,2);for(let i=0;i<14;i++)stain(x,srand()*256,srand()*256,10+srand()*40,'110,96,60',0.3);return c;}
function villaOutside(){const g=new THREE.PlaneGeometry(60,60);g.rotateX(-Math.PI/2);const gm=new THREE.MeshStandardMaterial({map:mkTex(texGrass(),20,20),roughness:1});const lawn=new THREE.Mesh(g,gm);lawn.position.y=-0.15;lawn.receiveShadow=true;scene.add(lawn);registerBody(boxBody(30,0.25,30,V3(0,-0.4,0)));
  const pave=[],X=vX,Z=vZ;pave.push([3.2,0.12,4.6,V3(X(1.6),-0.09,Z(VP.D)+2.3),new THREE.Quaternion()]);pave.push([1.8,0.12,1.4,V3(X(3.8),-0.07,Z(VP.D)+0.7),new THREE.Quaternion()]);pave.push([7.0,0.1,3.2,V3(X(5.7),-0.08,Z(0)-1.6),new THREE.Quaternion()]);pave.push([1.0,0.1,6.0,V3(X(3.8),-0.09,Z(VP.D)+3.6),new THREE.Quaternion()]);
  vMerge(pave,M.cement);for(const [w,h,d,p] of pave){registerBody(boxBody(w/2,h/2,d/2,p));}
  /* sheet-metal fence: back and sides, a low brick front fence */const fm=new THREE.MeshStandardMaterial({color:0x6e746a,roughness:0.6,metalness:0.4});const fx0=X(-3),fx1=X(VP.W+3),fz0=Z(-7),fz1=Z(VP.D+5);const fence=[[fx1-fx0,1.8,0.04,V3((fx0+fx1)/2,0.75,fz0)],[0.04,1.8,fz1-fz0,V3(fx0,0.75,(fz0+fz1)/2)],[0.04,1.8,fz1-fz0,V3(fx1,0.75,(fz0+fz1)/2)]].map(a=>[...a,new THREE.Quaternion()]);vMerge(fence,fm);for(const [w,h,d,p] of fence)registerBody(boxBody(w/2+0.02,h/2,d/2+0.02,p));
  const front=[[fx1-fx0-6.2,0.7,0.23,V3((fx0+fx1)/2+3.1,0.2,fz1)]].map(a=>[...a,new THREE.Quaternion()]);vMerge(front,M.brick);for(const [w,h,d,p] of front)registerBody(boxBody(w/2,h/2,d/2,p));
  /* the letterbox, stuffed */const lb=vMerge([[0.3,0.36,0.4,V3(X(5.2),0.75,fz1),new THREE.Quaternion()],[0.08,0.6,0.08,V3(X(5.2),0.3,fz1),new THREE.Quaternion()]],M.brick);
  /* streetlight */const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,6,8),M.darkMetal);pole.position.set(X(8),2.85,fz1+3);scene.add(pole);const head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.25),new THREE.MeshStandardMaterial({color:0x222222,emissive:0xffb86a,emissiveIntensity:2.5}));head.position.set(X(8),5.8,fz1+2.7);scene.add(head);
  const sl=new THREE.PointLight(0xffb070,14,22,1.4);sl.position.set(X(8),5.6,fz1+2.6);scene.add(sl);VL.street=sl;}

/* ---------- lights: a pool of four that follows you */
const VL={pool:[],fix:[],t:0,room:null,street:null};
function villaLights(){/* the ground colour stands in for light bouncing off floors and walls: without it every ceiling away from a lamp goes black */scene.add(new THREE.HemisphereLight(0x8890a0,0xd8c8b0,0.9));scene.add(new THREE.AmbientLight(0x3a3f4a,0.28));const moon=new THREE.DirectionalLight(0x8fa6d8,0.35);moon.position.set(-20,30,12);scene.add(moon);
  for(let i=0;i<4;i++){const l=new THREE.PointLight(0xffe2b8,0,8,1.5);if(i===0){l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-0.003;l.shadow.normalBias=0.02;l.shadow.radius=3;l.shadow.camera.near=0.1;l.shadow.camera.far=8;SHADOW.lights.push(l);}scene.add(l);VL.pool.push({l,fix:null,k:0});}
  const disc=[],tube=[];for(const r of VP.rooms){if(r.id==='bathx')continue;const cx=vX((r.x0+r.x1)/2),cz=vZ((r.z0+r.z1)/2);const fluoro=r.id==='garage'||r.id==='laundry';const big=r.id==='hall';
    if(big){for(const px of[5,9.5,14]){VL.fix.push({x:vX(px),z:cz,y:PH-0.32,i:5.5,col:0xffe6c4,room:r});disc.push([0.3,0.05,0.3,V3(vX(px),PH-0.03,cz),new THREE.Quaternion()]);}continue;}
    VL.fix.push({x:cx,z:cz,y:PH-0.32,i:fluoro?9:(r.wet?6.5:8),col:fluoro?0xe8f2ff:(r.id==='kitchen'||r.id==='living'?0xfff0d8:0xffe2b8),room:r});(fluoro?tube:disc).push(fluoro?[1.2,0.05,0.12,V3(cx,PH-0.03,cz),new THREE.Quaternion()]:[0.36,0.06,0.36,V3(cx,PH-0.035,cz),new THREE.Quaternion()]);}
  vMerge(disc,new THREE.MeshStandardMaterial({color:0xf4efe4,emissive:0xfff0d0,emissiveIntensity:1.6,roughness:0.4}));vMerge(tube,new THREE.MeshStandardMaterial({color:0xf4f4f4,emissive:0xeef6ff,emissiveIntensity:2.2,roughness:0.3}));LIGHT.tubesAlive=0;}
function villaLightPick(){const p=camera.getWorldPosition(_tvp);const r=vRoomAtWorld(p.x,p.z);VL.room=r;const sc=f=>Math.hypot(f.x-p.x,f.z-p.z)-(r&&f.room===r?100:0);const pick=VL.fix.slice().sort((a,b)=>sc(a)-sc(b)).slice(0,VL.pool.length);
  /* keep lights already on a picked fixture where they are; move the others */const free=VL.pool.filter(s=>!pick.includes(s.fix));for(const f of pick){if(VL.pool.some(s=>s.fix===f))continue;const s=free.shift();if(!s)break;s.fix=f;s.k=0;s.l.position.set(f.x,f.y,f.z);s.l.color.setHex(f.col);if(s.l.castShadow)SHADOW.dirty=true;}
  /* the shadow-casting light always sits in your room */const sh=VL.pool[0];const mine=pick[0];if(mine&&sh.fix!==mine){const other=VL.pool.find(s=>s.fix===mine);if(other){const t=other.fix;other.fix=sh.fix;other.k=0;if(other.fix)other.l.position.set(other.fix.x,other.fix.y,other.fix.z),other.l.color.setHex(other.fix.col);sh.fix=t;sh.k=0;sh.l.position.set(t.x,t.y,t.z);sh.l.color.setHex(t.col);SHADOW.dirty=true;}}}
function updateVilla(dt){VL.t-=dt;if(VL.t<=0){VL.t=0.15;villaLightPick();}const on=power;for(const s of VL.pool){const tgt=on&&s.fix?s.fix.i:0;s.k=lerp(s.k,tgt,1-Math.exp(-dt*10));s.l.intensity=s.k;}}

/* ---------- build + boot */
function buildVilla(){villaWalls();for(const w of VW.walls)buildWallFrame(w);
  for(const w of VW.walls){const sides=w.kind==='ext'?[1]:[1,-1];for(const side of sides){const room=VROOM[side>0?w.rooms.front:w.rooms.back];if(!room)continue;const kind=room.wet?'tile':'paper';const f=mkFace(w,side,kind,vFaceCanvas(w.L,w.H,room.wet?'tile':'plaster'));f.room=room;VW.faces.push(f);buildSheet(f,vFaceCols(f),vFaceRows(f));if(kind==='tile')for(const c of f.chunks){c.mat='tile';c.hp=4.2;c.label='wall tile';}}}
  villaCeiling();for(const L of villaBrickLines())villaBricks(L);buildBatts(VW.ext);villaFloor();villaRoof();villaOpenings();villaLights();villaOutside();
  for(const f of FACES)for(const c of f.chunks)chunkById.set(c.id,c);recomputeTimber();recomputeSupport();flushBatches();BATCH_LIVE=true;}
function villaAfterBoot(){const [px,pz]=VP.spawn;player.body.position.set(vX(px),FLOOR_Y+0.37,vZ(pz));player.yaw=0;player.pitch=0;}
