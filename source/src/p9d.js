
/* ============================================================ v9.1 — p9d: DARTS
   The garage board becomes a pub board: regulation size and rings, in a timber cabinet whose open doors are chalkboards.
   - Oche: gaffer tape 2.37 m from the board face. E on the board/cabinet steps you up (SEATS.oche): look ±25°, three darts.
   - Throw: hold LMB to draw, release. Rhythm sets the power (sweet spot 0.4–0.7 s); a clean throw lands a hand's width under
     where you aimed (darts drop: aim high). Flight is a projectile traced with rays (castRay with opts.ray), never a body.
   - Scoring by the hit point's radius/angle against regulation rings; a dart within ~1 mm of a wire can bounce out.
   - Off the board: sticks in plaster (a hole, $15), timber, fabric; bounces off brick, metal, glass, tile (then it's a loose
     dart you can pick up; RMB with a dart in hand throws it properly). The darts case on the bench gives you spares.
   - Games: 501 double out, Around the Clock, Cricket vs Dazza (two doors down, through the roller door), practice.
   - SWILL: LMB with a can in hand = a sip (three to a can). One steadies you; after that the sway grows and the rhythm slows.
   All darts share two instanced meshes (body + flights). */

const DART={list:[],cap:48,board:null,cab:null,doors:[],B:null,oche:null,hand:null,inHand:3,drawing:false,drawT:0,drunk:0,drunkT:0,sips:0,first:true,
  game:{mode:'practice',sel:0,state:'idle',turn:'you'},best:{},dirty:true,chalkT:0,dz:{w:0,l:0},queue:[]};
const DMODES=['practice','501','atc','cricket'],DNAME={practice:'PRACTICE','501':'501 · DOUBLE OUT',atc:'AROUND THE CLOCK',cricket:'CRICKET v DAZZA'};
const DORDER=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const DR={bull:0.00635,obull:0.0159,t0:0.099,t1:0.107,d0:0.162,d1:0.170,edge:0.2255};
try{const s=localStorage.getItem('bedsit.darts');if(s){const o=JSON.parse(s);if(o.best)DART.best=o.best;if(o.dz)DART.dz=o.dz;}}catch(e){}
function dartSave(){try{localStorage.setItem('bedsit.darts',JSON.stringify({best:DART.best,dz:DART.dz}));}catch(e){}}

/* ---------- the dart: one merged body (tip, knurled barrel, shaft) with vertex colours, and its flights */
function dartGeo(){const parts=[];const add=(g,col)=>{g=g.toNonIndexed();const n=g.attributes.position.count;const c=new Float32Array(n*3);for(let i=0;i<n;i++)c.set(col,i*3);g.setAttribute('color',new THREE.BufferAttribute(c,3));g.deleteAttribute('uv');parts.push(g);};
  const cyl=(r0,r1,h,z,col,seg=8)=>{const g=new THREE.CylinderGeometry(r1,r0,h,seg);g.rotateX(Math.PI/2);g.translate(0,0,z);add(g,col);};
  /* +z is the point */cyl(0.0011,0.0004,0.032,0.061,[0.82,0.83,0.85]);cyl(0.0034,0.0030,0.046,0.022,[0.32,0.33,0.36],10);for(let k=0;k<4;k++)cyl(0.0037,0.0037,0.003,0.004+k*0.009,[0.2,0.2,0.22],10);cyl(0.0017,0.0017,0.036,-0.019,[0.08,0.08,0.09]);
  let n=0;for(const g of parts)n+=g.attributes.position.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;for(const g of parts){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);col.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));G.setAttribute('color',new THREE.BufferAttribute(col,3));
  /* flights: two crossed kite shapes at the tail */const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(0.017,-0.012);sh.lineTo(0.017,-0.036);sh.lineTo(0,-0.036);sh.closePath();
  /* shape is in XY with y down the dart; turn y into −z */const F=[];for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const g=new THREE.ShapeGeometry(sh);g.rotateX(Math.PI/2);g.translate(0,0,-0.02);g.rotateZ(a);F.push(g.toNonIndexed());}
  let m=0;for(const g of F)m+=g.attributes.position.count;const fp=new Float32Array(m*3),fn=new Float32Array(m*3);o=0;for(const g of F){fp.set(g.attributes.position.array,o*3);fn.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;}
  const FG=new THREE.BufferGeometry();FG.setAttribute('position',new THREE.BufferAttribute(fp,3));FG.setAttribute('normal',new THREE.BufferAttribute(fn,3));return{body:G,fl:FG};}
function dartsInit(){if(DART.imB)return;const g=dartGeo();DART.geo=g;DART.matB=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.35,metalness:0.7});DART.matF=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.6,side:THREE.DoubleSide});
  DART.imB=new THREE.InstancedMesh(g.body,DART.matB,DART.cap);DART.imF=new THREE.InstancedMesh(g.fl,DART.matF,DART.cap);for(const im of[DART.imB,DART.imF]){im.frustumCulled=false;im.castShadow=false;im.count=0;scene.add(im);}
  for(let i=0;i<DART.cap;i++)DART.imF.setColorAt(i,new THREE.Color(0xffffff));
  /* the one in your hand, on the camera */const h=new THREE.Group();h.add(new THREE.Mesh(g.body,DART.matB));const hf=new THREE.Mesh(g.fl,new THREE.MeshStandardMaterial({color:0xc8262a,roughness:0.6,side:THREE.DoubleSide}));h.add(hf);h.visible=false;camera.add(h);DART.hand=h;}
const DCOL={you:new THREE.Color(0xc8262a),dazza:new THREE.Color(0x1f6fd0),free:new THREE.Color(0xe8c020)};

/* ---------- the board, its cabinet, the chalkboards, the oche, the darts case */
function dartTex(){const S=1024,c=mkCanvas(S,S),x=c.getContext('2d');const cx=S/2,cy=S/2,K=(S/2)/DR.edge;x.fillStyle='#111';x.fillRect(0,0,S,S);
  const seg=(r0,r1,i,col)=>{const a0=(i*18-9-90)*Math.PI/180,a1=(i*18+9-90)*Math.PI/180;x.fillStyle=col;x.beginPath();x.arc(cx,cy,r1*K,a0,a1);x.arc(cx,cy,r0*K,a1,a0,true);x.closePath();x.fill();};
  for(let i=0;i<20;i++){const dark=i%2===0;seg(DR.obull,DR.t0,i,dark?'#1a1a18':'#e8dcb8');seg(DR.t0,DR.t1,i,dark?'#c4242a':'#1f8a3c');seg(DR.t1,DR.d0,i,dark?'#1a1a18':'#e8dcb8');seg(DR.d0,DR.d1,i,dark?'#c4242a':'#1f8a3c');}
  x.fillStyle='#1f8a3c';x.beginPath();x.arc(cx,cy,DR.obull*K,0,7);x.fill();x.fillStyle='#c4242a';x.beginPath();x.arc(cx,cy,DR.bull*K,0,7);x.fill();
  /* sisal fibre */for(let i=0;i<26000;i++){const a=Math.random()*7,r=Math.sqrt(Math.random())*DR.d1*K;x.fillStyle=`rgba(${Math.random()<0.5?'0,0,0':'255,250,230'},${0.04+Math.random()*0.05})`;x.fillRect(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.5,1.5);}
  /* wires */x.strokeStyle='#c8ccd0';x.lineWidth=2;for(const r of[DR.bull,DR.obull,DR.t0,DR.t1,DR.d0,DR.d1]){x.beginPath();x.arc(cx,cy,r*K,0,7);x.stroke();}for(let i=0;i<20;i++){const a=(i*18-9-90)*Math.PI/180;x.beginPath();x.moveTo(cx+Math.cos(a)*DR.obull*K,cy+Math.sin(a)*DR.obull*K);x.lineTo(cx+Math.cos(a)*DR.d1*K,cy+Math.sin(a)*DR.d1*K);x.stroke();}
  /* number ring */x.fillStyle='#e8e8e0';x.font='bold 44px sans-serif';x.textAlign='center';x.textBaseline='middle';for(let i=0;i<20;i++){const a=(i*18-90)*Math.PI/180,r=(DR.d1+DR.edge)/2*K;x.save();x.translate(cx+Math.cos(a)*r,cy+Math.sin(a)*r);x.rotate(a+Math.PI/2);x.fillText(String(DORDER[i]),0,0);x.restore();}
  /* a few old holes and a ring of wear round the 20 */for(let i=0;i<500;i++){const a=(-90+(Math.random()-0.5)*30)*Math.PI/180,r=(DR.t0+Math.random()*(DR.d1-DR.t0))*K;x.fillStyle='rgba(0,0,0,0.35)';x.fillRect(cx+Math.cos(a)*r,cy+Math.sin(a)*r,2,2);}
  return c;}
function chalkCanvas(){const c=mkCanvas(384,768);return mkDrawable(c);}
function dartsBuild(F){dartsInit();const W=F;const at=(u,y,d)=>W.at(u,y,d);const BH=1.73;DART.F=F;
  const tim=new THREE.MeshStandardMaterial({color:0x6a3e22,roughness:0.6});const asmC=mkAsm('dartboard cabinet');
  /* cabinet: back panel + four rails, 0.1 deep */const cab=compoundEnt([{w:0.64,h:0.66,d:0.018,x:0,y:0,z:0.009,mat:tim},{w:0.64,h:0.02,d:0.1,x:0,y:0.32,z:0.05,mat:tim},{w:0.64,h:0.02,d:0.1,x:0,y:-0.32,z:0.05,mat:tim},{w:0.02,h:0.66,d:0.1,x:-0.31,y:0,z:0.05,mat:tim},{w:0.02,h:0.66,d:0.1,x:0.31,y:0,z:0.05,mat:tim}],at(0,BH,0.002),{kind:'furniture',mat:'timber',mass:9,hp:14,label:'dartboard cabinet',noBatch:true,noProxy:true,quat:F.q,wakeThreshold:1e9});addPart(asmC,cab);DART.cab=cab;
  /* the board */const g=new THREE.Group();const rim=new THREE.Mesh(new THREE.CylinderGeometry(DR.edge,DR.edge,0.038,48),new THREE.MeshStandardMaterial({color:0x151515,roughness:0.9}));rim.rotation.x=Math.PI/2;g.add(rim);
  const face=new THREE.Mesh(new THREE.CircleGeometry(DR.edge,64),new THREE.MeshStandardMaterial({map:mkTex(dartTex(),1,1),roughness:0.95}));face.position.z=0.0195;g.add(face);g.position.copy(at(0,BH,0.037));g.quaternion.copy(F.q);
  const board=mkEnt({mesh:g,body:boxBody(DR.edge,DR.edge,0.019,at(0,BH,0.037),qC(F.q)),kind:'fixture',mat:'fabric',mass:4,hp:999,label:'dartboard',noBatch:true,noProxy:true,wakeThreshold:1e9});DART.board=board;
  DART.B={c:at(0,BH,0.0565),n:F.n.clone(),r:F.t.clone(),u:V3(0,1,0)};
  /* the doors, open flat either side: chalkboards */const slate=new THREE.MeshStandardMaterial({color:0x2a3530,roughness:0.95});for(const s of[-1,1]){const d=chalkCanvas();const mats=[tim,tim,tim,tim,new THREE.MeshStandardMaterial({map:d.tex,roughness:0.95}),tim];
    const p=at(s*0.47,BH,0.09);const door=mkEnt({mesh:new THREE.Mesh(new THREE.BoxGeometry(0.3,0.64,0.018),mats),body:boxBody(0.15,0.32,0.009,p,qC(F.q)),kind:'fixture',mat:'timber',mass:2,hp:12,label:s<0?'chalkboard (scores)':'chalkboard (games)',noBatch:true,noProxy:true,wakeThreshold:1e9});door.mesh.position.copy(p);door.mesh.quaternion.copy(F.q);door.drawable=d;DART.doors.push(door);}
  /* gaffer tape on the concrete: the oche, 2.37 m from the face */const oc=DART.B.c.clone().addScaledVector(F.n,2.37);oc.y=FLOOR_Y;DART.oche=oc;const tape=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.002,0.62),new THREE.MeshStandardMaterial({color:0xb8b0a0,roughness:0.9}));tape.position.copy(oc).addScaledVector(F.n,0.025);tape.position.y=FLOOR_Y+0.002;tape.quaternion.copy(F.q);tape.rotateY(Math.PI/2);scene.add(tape);
  /* the darts case on the bench: spares */{const cp=V3(vX(0.25),0.93,vZ(7.55));const ce=compoundEnt([{w:0.16,h:0.035,d:0.09,x:0,y:0.0175,z:0,mat:new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.5})}],cp,{kind:'prop',mat:'plastic',mass:0.3,hp:4,label:'darts case (spares)',noBatch:true});ce.useLabel='TAKE A DART';ce.use=()=>{const e=dartLoose(ce.mesh.getWorldPosition(V3()).add(V3(0,0.06,0)),V3());if(e&&!SEAT.active)pickUp(e,0.7);HUD.msg('[A DART. RMB TO THROW IT AT SOMETHING.]',1.2);};DART.case=ce;}
  for(const e of[board,cab,...DART.doors]){e.useLabel=()=>SEAT.at==='oche'?null:'STEP UP TO THE OCHE';e.use=()=>sitDown('oche');}
  DART.dirty=true;chalkDraw();return board;}

/* ---------- scoring */
function dartScore(p){const B=DART.B;const d=p.clone().sub(B.c);const x=d.dot(B.r),y=d.dot(B.u);const r=Math.hypot(x,y);let th=Math.atan2(x,y)*180/Math.PI;if(th<0)th+=360;const i=Math.floor(((th+9)%360)/18);const n=DORDER[i];
  let o;if(r<=DR.bull)o={seg:25,mult:2,pts:50,label:'BULL'};else if(r<=DR.obull)o={seg:25,mult:1,pts:25,label:'25'};else if(r>DR.d1)o={seg:0,mult:0,pts:0,label:'OUT'};else{const m=r>=DR.d0?2:(r>=DR.t0&&r<=DR.t1?3:1);o={seg:n,mult:m,pts:n*m,label:(m===3?'T':m===2?'D':'')+n};}
  /* how close to a wire: rings, and the radial spider wires between the outer bull and the double */let w=Math.min(...[DR.bull,DR.obull,DR.t0,DR.t1,DR.d0,DR.d1].map(R=>Math.abs(r-R)));if(r>DR.obull&&r<DR.d1){const a=((th+9)%18);w=Math.min(w,Math.min(a,18-a)*Math.PI/180*r);}o.wire=w;o.r=r;return o;}
/* the best way out from a score (1–3 darts, last one a double or the bull) */const _ckC={};
function checkout(rem){if(rem>170||rem<2)return null;if(_ckC[rem]!==undefined)return _ckC[rem];const T=[];for(let n=20;n>=1;n--)T.push({p:n*3,l:'T'+n});T.push({p:25,l:'25'});for(let n=20;n>=1;n--)T.push({p:n,l:String(n)});for(let n=20;n>=1;n--)T.push({p:n*2,l:'D'+n});
  const D=[];for(let n=20;n>=1;n--)D.push({p:n*2,l:'D'+n});D.push({p:50,l:'BULL'});let best=null;
  for(const d of D)if(d.p===rem){best=[d.l];break;}if(!best)for(const a of T){for(const d of D)if(a.p+d.p===rem){best=[a.l,d.l];break;}if(best)break;}
  if(!best)for(const a of T){for(const b of T){for(const d of D)if(a.p+b.p+d.p===rem){best=[a.l,b.l,d.l];break;}if(best)break;}if(best)break;}_ckC[rem]=best;return best;}

/* ---------- darts in the world */
function dartAdd(o){if(DART.list.length>=DART.cap){/* oldest stray dart off the board goes first */const i=DART.list.findIndex(d=>d.state==='stuck'&&d.ent!==DART.board);DART.list.splice(i>=0?i:0,1);}const d=Object.assign({state:'fly',p:V3(),v:V3(),q:new THREE.Quaternion(),owner:'you',t:0,ent:null,lm:null,wm:new THREE.Matrix4()},o);DART.list.push(d);return d;}
const _dm=new THREE.Matrix4(),_dq=new THREE.Quaternion(),_dz=new THREE.Vector3(0,0,1),_dv=new THREE.Vector3(),_ds=new THREE.Vector3(1,1,1),_dc=new THREE.Color();
function dartsDraw(){const n=DART.list.length;DART.imB.count=n;DART.imF.count=n;for(let i=0;i<n;i++){const d=DART.list[i];if(d.state==='stuck'&&d.lm&&d.ent&&d.ent.mesh){d.ent.mesh.updateMatrixWorld(true);d.wm.multiplyMatrices(d.ent.mesh.matrixWorld,d.lm);}else if(d.state!=='stuck'||!d.lm){d.wm.compose(d.p,d.q,_ds);}
    DART.imB.setMatrixAt(i,d.wm);DART.imF.setMatrixAt(i,d.wm);DART.imF.setColorAt(i,DCOL[d.owner]||DCOL.free);}DART.imB.instanceMatrix.needsUpdate=true;DART.imF.instanceMatrix.needsUpdate=true;if(DART.imF.instanceColor)DART.imF.instanceColor.needsUpdate=true;}
/* launch from p with velocity v */function dartLaunch(p,v,owner){const d=dartAdd({p:p.clone(),v:v.clone(),owner});d.q.setFromUnitVectors(_dz,_dv.copy(v).normalize());S.whoosh();return d;}
const DART_HARD=new Set(['metal','glass','ceramic','china','tile','brick','terra','copper','plastic']);
function dartFly(d,dt){const steps=3,h=dt/steps;for(let k=0;k<steps;k++){if(d.state!=='fly')return;const p0=d.p.clone();d.v.y-=9.8*h;d.v.multiplyScalar(1-0.015*h);d.p.addScaledVector(d.v,h);d.t+=h;
    const seg=d.p.clone().sub(p0);const L=seg.length();if(L<1e-6)continue;const hit=castRay(L+0.07,{ray:{o:p0,d:seg.clone().multiplyScalar(1/L)}});d.q.setFromUnitVectors(_dz,_dv.copy(d.v).normalize());
    if(hit){dartHit(d,hit);return;}if(d.p.y<pFloorY(d.p.x,d.p.y,d.p.z)+0.01){dartHit(d,{kind:'floor',point:d.p.clone(),normal:V3(0,1,0),ent:null});return;}if(d.t>3){dartRemove(d);if(d.owner!=='free')dartScored(d,{seg:0,mult:0,pts:0,label:'MISS'});return;}}}
function dartRemove(d){const i=DART.list.indexOf(d);if(i>=0)DART.list.splice(i,1);}
function dartStick(d,hit,depth){const dir=_dv.copy(d.v).normalize();/* the origin sits 77 mm behind the point */const p=hit.point.clone().addScaledVector(dir,depth-0.077);d.p.copy(p);d.q.setFromUnitVectors(_dz,dir);
  /* a little droop and spin: real darts settle at an angle */const tilt=new THREE.Quaternion().setFromAxisAngle(V3(1,0,0).applyQuaternion(d.q),(Math.random()-0.3)*0.12);d.q.premultiply(tilt);d.state='stuck';d.v.set(0,0,0);d.wm.compose(d.p,d.q,_ds);
  const e=hit.ent;if(e&&e.mesh&&!e.face&&e.kind!=='drywall'){e.mesh.updateMatrixWorld(true);d.ent=e;d.lm=new THREE.Matrix4().copy(e.mesh.matrixWorld).invert().multiply(d.wm);}else{d.ent=e||null;d.lm=null;}}
function dartHit(d,hit){const e=hit.ent,p=hit.point,sp=d.v.length();
  if(e===DART.board){const sc=dartScore(p);if(sc.mult>0&&sc.wire<0.0011&&Math.random()<0.35){S.clink(p);S.ping(p);dartBounce(d,hit,0.25);HUD.msg('[BOUNCE-OUT · OFF THE WIRE]',1);dartScored(d,{seg:0,mult:0,pts:0,label:'BOUNCE',bounce:true});return;}
    dartStick(d,hit,0.006+Math.random()*0.006);S.thud(p,0.25);S.click(p,900);d.sc=sc;dartScored(d,sc);return;}
  const mat=e?e.mat:(hit.kind==='floor'?'concrete':'');const kind=hit.kind;
  if(kind==='brick'||kind==='brickwall'||kind==='slab'||kind==='tile'||kind==='screw'||kind==='roofslab'||(kind==='floor'&&!(e&&e.mat==='timber'))||(e&&DART_HARD.has(mat)&&!e.screenHit)){if(e&&mat==='glass'&&sp>5&&e.hp<1.5&&e.kind!=='prop')impact(hit,0.8,_dv.copy(d.v).normalize(),'dart');S.clink(p);dartBounce(d,hit,0.3);if(d.owner!=='free'&&e!==DART.cab)dartScored(d,{seg:0,mult:0,pts:0,label:'MISS'});return;}
  if(e&&e.screenHit){impact(hit,0.9,_dv.copy(d.v).normalize(),'dart');dartBounce(d,hit,0.2);if(d.owner!=='free')dartScored(d,{seg:0,mult:0,pts:0,label:'MISS'});return;}
  /* soft enough to take it: plaster, timber, chipboard, fabric, foam, carpet */dartStick(d,hit,0.012+Math.random()*0.01);S.thud(p,0.15);
  if(kind==='drywall'&&hit.drawable&&hit.uv){hit.drawable.blot(hit.uv.x,hit.uv.y,2.5,'25,22,20',0.85);if(typeof bondHit==='function')bondHit('dart holes in the plaster',15);}
  if(e&&e.dynamic&&e.body)applyImpulse(e,_dv.copy(d.v).multiplyScalar(0.02),p);
  if(d.owner!=='free'&&e!==DART.cab&&!DART.doors.includes(e))dartScored(d,{seg:0,mult:0,pts:0,label:'MISS',wall:true});else if(d.owner!=='free')dartScored(d,{seg:0,mult:0,pts:0,label:'MISS'});}
/* off something hard: it becomes a loose dart on the floor you can pick up */function dartBounce(d,hit,k){dartRemove(d);const n=hit.normal&&hit.normal.lengthSq()>0?hit.normal.clone():V3(0,1,0);const v=d.v.clone();v.addScaledVector(n,-2*v.dot(n)).multiplyScalar(k);dartLoose(hit.point.clone().addScaledVector(n,0.03),v);}
function dartLoose(p,v){dartsInit();const g=new THREE.Group();g.add(new THREE.Mesh(DART.geo.body,DART.matB));g.add(new THREE.Mesh(DART.geo.fl,new THREE.MeshStandardMaterial({color:0xe8c020,roughness:0.6,side:THREE.DoubleSide})));g.position.copy(p);
  const b=new CANNON.Body({mass:0});b.addShape(new CANNON.Box(new CANNON.Vec3(0.008,0.008,0.07)));b.position.copy(toC(p));const e=mkEnt({mesh:g,body:b,kind:'prop',mat:'metal',mass:0.05,hp:30,label:'dart',noBatch:true,noProxy:true,castsShadow:false});e.isDart=true;makeDynamic(e);
  if(v)e.body.velocity.set(v.x,v.y,v.z);e.body.angularVelocity.set(rnd(-8,8),rnd(-8,8),rnd(-8,8));DART.loose=(DART.loose||[]);DART.loose.push(e);if(DART.loose.length>10){const o=DART.loose.shift();if(o.alive)removeEnt(o);}return e;}
/* a dart in your hands (off the oche): RMB throws it properly at whatever you're looking at */
function dartThrowHeld(){if(!held||!held.ent||!held.ent.isDart)return false;const e=held.ent;drop();removeEnt(e);const cam=camera.getWorldPosition(V3());const f=camFwd();const p0=cam.clone().addScaledVector(camRight(),0.12).add(V3(0,-0.06,0)).addScaledVector(f,0.25);
  const h=castRay(8);const A=h?h.point:cam.clone().addScaledVector(f,4);dartLaunch(p0,dartAimVel(p0,A,1,0.004),'free');return true;}
function dartAimVel(p0,A,pf,sig){const s0=6.2;const D=p0.distanceTo(A);const t=D/s0;const L=A.clone().add(V3(0,-0.11*(D/2.4),0));const v=L.sub(p0).multiplyScalar(1/t);v.y+=0.5*9.8*t;v.multiplyScalar(pf);
  if(sig>0){const ax=V3().crossVectors(v,V3(0,1,0)).normalize();v.applyAxisAngle(V3(0,1,0),dGauss()*sig).applyAxisAngle(ax,dGauss()*sig);}return v;}
function dGauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

/* ---------- the oche (a seat) */
function dartSway(){const t=now,A=0.0016*dartDrunkK();return{x:A*(Math.sin(t*1.13)+0.55*Math.sin(t*2.71+1.3)+0.25*Math.sin(t*6.1)),y:A*(0.8*Math.sin(t*0.91+2)+0.5*Math.sin(t*2.23+0.4))+(DART.drawing?0:0.0006*Math.sin(t*0.6))};}
function dartDrunkK(){const d=DART.drunk;return d<=0?1:(d<1.5?0.8:1+0.45*(d-1));}
function ocheTarget(){const B=DART.B;const st=DART.oche.clone().addScaledVector(B.n,0.12);SEAT.stand.copy(st);SEAT.eye.copy(st);SEAT.eye.y=FLOOR_Y+1.63;const d=B.c.clone().sub(SEAT.eye);SEAT.yaw=Math.atan2(-d.x,-d.z);SEAT.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));}
SEATS.oche={name:'oche',
  can(){return DART.board&&DART.board.alive?null:'[NO BOARD, NO GAME]';},keep(){return DART.board&&DART.board.alive?null:'[THE BOARD IS GONE]';},target(){ocheTarget();},
  view(){const s=dartSway();return{yaw:SEAT.yaw+SEAT.ly+s.x,pitch:SEAT.pitch+SEAT.lp+s.y,fov:64};},
  hint:'AT THE OCHE · MOUSE = AIM · HOLD LMB = DRAW, RELEASE = THROW (RHYTHM IS POWER · DARTS DROP, AIM HIGH) · 1 = 501 · 2 = AROUND THE CLOCK · 3 = CRICKET v DAZZA · 0 = PRACTICE · WHEEL / F = NEXT GAME · E = STEP BACK',
  onSit(){HUD.el.cross.style.display='';DART.inHand=Math.max(DART.inHand,0);S.thud(SEAT.stand,0.25);if(DART.first){DART.first=false;HUD.msg('[DARTS DROP ABOUT A HAND\'S WIDTH OVER 2.37 m · AIM HIGH]',2.4);}else HUD.msg('[STEPPED UP · '+DNAME[DART.game.mode]+']',1.2);DART.dirty=true;},
  onStand(){DART.drawing=false;if(DART.hand)DART.hand.visible=false;HUD.el.cross.style.display='';},
  look(dx,dy){const s=0.0011;SEAT.ly=clamp(SEAT.ly-dx*s,-0.44,0.44);SEAT.lp=clamp(SEAT.lp-dy*s,-0.3,0.3);},
  down(b){if(b!==0)return;const G=DART.game;if(G.state==='pull'||G.state==='won'){dartNextTurn();return;}if(G.turn!=='you'||G.state==='dazza')return;if(DART.inHand<=0)return;DART.drawing=true;DART.drawT=now;},
  up(b){if(b!==0||!DART.drawing)return;DART.drawing=false;dartThrowOche();},
  wheel(d){dartPickGame((DART.game.sel+(d>0?1:-1)+DMODES.length)%DMODES.length);},
  key(c){if(c==='Digit1'||c==='Numpad1')dartPickGame(1);else if(c==='Digit2'||c==='Numpad2')dartPickGame(2);else if(c==='Digit3'||c==='Numpad3')dartPickGame(3);else if(c==='Digit0'||c==='Numpad0')dartPickGame(0);else if(c==='KeyF')dartPickGame((DART.game.sel+1)%DMODES.length);}};
function dartThrowOche(){const td=now-DART.drawT;const dk=Math.max(0,DART.drunk-1);const lo=0.4+0.06*dk,hi=Math.max(lo+0.08,0.7-0.04*dk);let pf,sig=0.0034*(DART.drunk>0&&DART.drunk<1.5?0.8:1+0.4*dk);
  if(td<0.12)pf=0.8;else if(td<lo)pf=1-(lo-td)*0.35;else if(td<=hi)pf=1+dGauss()*0.007;else{pf=1+Math.min(0.045,(td-hi)*0.03);sig+=Math.min(0.012,(td-hi)*0.006);}
  const cam=camera.getWorldPosition(V3());const f=camFwd();const p0=cam.clone().addScaledVector(camRight(),0.1).add(V3(0,-0.05,0)).addScaledVector(f,0.3);const h=castRay(6);const A=h?h.point:cam.clone().addScaledVector(f,2.6);
  dartLaunch(p0,dartAimVel(p0,A,pf,sig),'you');DART.inHand--;DART.game.thrown=(DART.game.thrown||0)+1;camPunch(0.25,0,0);}
/* the hand: drawn back toward the cheek while LMB is held */function dartHandUpdate(dt){if(!DART.hand)return;const on=SEAT.at==='oche'&&SEAT.blend>0.6&&DART.inHand>0&&DART.game.turn==='you'&&DART.game.state!=='pull'&&DART.game.state!=='dazza'&&DART.game.state!=='won';DART.hand.visible=on;if(!on)return;
  const k=DART.drawing?clamp((now-DART.drawT)/0.35,0,1):0;const e=k*k*(3-2*k);DART.hand.position.set(0.15-0.04*e,-0.12+0.05*e,-0.42+0.12*e);DART.hand.rotation.set(0.05+0.12*e,0.03,0);DART.hand.rotateY(Math.PI);/* tip forward */}

/* ---------- games */
function dartPickGame(i){const G=DART.game;G.sel=i;const m=DMODES[i];dartNewGame(m);HUD.msg('['+DNAME[m]+']',1.2);}
function dartNewGame(m){const G=DART.game;Object.assign(G,{mode:m,state:'play',turn:'you',thrown:0,tn:0,turnDarts:[],hist:[],darts:0,t0:0,atc:1,rem:501,remT:501,cr:{you:{},dazza:{}},pts:{you:0,dazza:0}});for(const n of[20,19,18,17,16,15,25]){G.cr.you[n]=0;G.cr.dazza[n]=0;}DART.inHand=3;dartClearBoard();DART.dirty=true;}
function dartClearBoard(){for(let i=DART.list.length-1;i>=0;i--){const d=DART.list[i];if(d.ent===DART.board||d.state==='fly')DART.list.splice(i,1);}}
function dartScored(d,sc){const G=DART.game;if(d.owner==='free')return;if(d.owner==='dazza'){dazzaScored(sc);return;}if(G.state!=='play'){return;}G.turnDarts.push(sc.label);G.darts++;if(!G.t0)G.t0=now;
  if(G.mode==='practice'){HUD.msg('['+sc.label+(sc.pts?' · '+sc.pts:'')+']',0.9);}
  else if(G.mode==='501'){const nr=G.rem-sc.pts;if(sc.pts&&(nr<0||nr===1||(nr===0&&!(sc.mult===2))) ){G.rem=G.remT;G.turnDarts.push('BUST');HUD.msg('[BUST]',1.2);S.thud(SEAT.eye,0.4);G.state='pull';DART.inHand=0;DART.dirty=true;return;}
    G.rem=nr;HUD.msg('['+sc.label+(sc.pts?' · '+G.rem+' LEFT':'')+']',0.9);if(nr===0){const k='501';if(!DART.best[k]||G.darts<DART.best[k]){DART.best[k]=G.darts;dartSave();}G.state='won';DART.inHand=0;G.hist.push(0);HUD.msg('[GAME SHOT · '+G.darts+' DARTS'+(DART.best[k]===G.darts?' · YOUR BEST':'')+']',3);dazzaSay('win');DART.dirty=true;return;}}
  else if(G.mode==='atc'){const tgt=G.atc>20?25:G.atc;if(sc.seg===tgt){G.atc++;HUD.msg('['+sc.label+' · NEXT: '+(G.atc>20?(G.atc>21?'DONE':'BULL'):G.atc)+']',0.9);if(G.atc>21){const tm=now-G.t0;const k='atc';if(!DART.best[k]||tm<DART.best[k].t){DART.best[k]={t:+tm.toFixed(1),d:G.darts};dartSave();}G.state='won';DART.inHand=0;HUD.msg('[ROUND THE CLOCK IN '+tm.toFixed(1)+' s · '+G.darts+' DARTS]',3);DART.dirty=true;return;}}else HUD.msg('['+sc.label+' · STILL ON '+(tgt===25?'THE BULL':tgt)+']',0.8);}
  else if(G.mode==='cricket'){cricketMark('you',sc);if(G.turnDarts.length&&sc.mult===3)dazzaSay('yourTreble');if(cricketWon('you')){G.state='won';DART.inHand=0;DART.dz.l++;dartSave();HUD.msg('[YOU BEAT DAZZA]',3);dazzaSay('youWin');DART.dirty=true;return;}}
  DART.dirty=true;G.tn=(G.tn||0)+1;if((G.tn>=3||DART.inHand<=0)&&G.state==='play'){G.state='pull';DART.inHand=0;if(G.mode==='501'){G.hist.push(G.rem);}after(0.9,()=>{if(G.state==='pull')HUD.msg('[LMB · PULL YOUR DARTS]',1.6);});}}
function cricketMark(who,sc){const G=DART.game;const n=sc.seg;if(!(n in G.cr[who]))return;const other=who==='you'?'dazza':'you';for(let k=0;k<sc.mult;k++){if(G.cr[who][n]<3)G.cr[who][n]++;else if(G.cr[other][n]<3)G.pts[who]+=n;}}
function cricketWon(who){const G=DART.game;const other=who==='you'?'dazza':'you';return Object.values(G.cr[who]).every(m=>m>=3)&&G.pts[who]>=G.pts[other];}
function dartNextTurn(){const G=DART.game;if(G.state==='won'){dartNewGame(G.mode);return;}/* pull: you walk up, pull them, walk back */S.click(DART.B.c,700);S.click(DART.B.c,900);for(let i=DART.list.length-1;i>=0;i--){const d=DART.list[i];if(d.owner==='you'&&d.ent===DART.board)DART.list.splice(i,1);}
  G.remT=G.rem;G.turnDarts=[];G.thrown=0;G.tn=0;if(G.mode==='cricket'){G.state='dazza';G.turn='dazza';dazzaTurn();}else{G.state='play';DART.inHand=3;}DART.dirty=true;}
/* ---------- Dazza, two doors down. He throws from beside you; you only ever hear him through the roller door. */
const DAZ={lines:{turn:['Righto. Watch and learn.','My throw. Hold me beer.','Quiet now. Professional at work.','Here we go.'],treble:['Get in!','Ton forty, that is. Near enough.','Did you see that? You saw that.'],miss:['Board\'s crooked, mate.','Wind got it.','That one\'s for the bond.'],
  yourTreble:['Fluke.','Lucky.','Steady on.'],youWin:['Rematch Thursday. After the inspection.','Best of three, then.'],win:['Same time next week?','Get the Swills in, loser.','Easy.']},t:0};
function dazzaSay(k){const L=DAZ.lines[k];if(!L||now-DAZ.t<1.5)return;DAZ.t=now;const s=L[Math.random()*L.length|0];HUD.msg('[DAZZA, THROUGH THE ROLLER DOOR] '+s,2.2);}
function dazzaTurn(){const G=DART.game;dazzaSay('turn');DART.queue=[1.4,2.6,3.8].map(t=>now+t);G.dzThrown=0;}
function dazzaPick(){const G=DART.game;const me=G.cr.dazza,you=G.cr.you;const nums=[20,19,18,17,16,15,25];const behind=G.pts.dazza<=G.pts.you;
  if(behind){const n=nums.find(n=>me[n]>=3&&you[n]<3);if(n)return n;}return nums.find(n=>me[n]<3)||nums.find(n=>you[n]<3)||20;}
function dazzaThrow(){const n=dazzaPick();const B=DART.B;let A;if(n===25)A=B.c.clone();else{const i=DORDER.indexOf(n);const a=i*18*Math.PI/180;const r=(DR.t0+DR.t1)/2;A=B.c.clone().addScaledVector(B.r,Math.sin(a)*r).addScaledVector(B.u,Math.cos(a)*r);}
  const sg=0.017;A.addScaledVector(B.r,dGauss()*sg).addScaledVector(B.u,dGauss()*sg);const p0=DART.oche.clone().addScaledVector(B.n,0.1).addScaledVector(B.r,-0.4);p0.y=FLOOR_Y+1.6;
  /* exact solve, no drop: he aims where it lands */const s0=6.4,D=p0.distanceTo(A),t=D/s0;const v=A.clone().sub(p0).multiplyScalar(1/t);v.y+=0.5*9.8*t;dartLaunch(p0,v,'dazza');}
function dazzaScored(sc){const G=DART.game;if(G.mode!=='cricket'||G.state!=='dazza')return;G.dzThrown++;cricketMark('dazza',sc);if(sc.mult===3)dazzaSay('treble');else if(!sc.mult)dazzaSay('miss');G.turnDarts.push('D:'+sc.label);DART.dirty=true;
  if(cricketWon('dazza')){G.state='won';G.turn='you';DART.dz.w++;dartSave();after(0.7,()=>dazzaSay('win'));HUD.msg('[DAZZA WINS]',2.4);DART.inHand=0;DART.dirty=true;return;}
  if(G.dzThrown>=3){after(1.8,()=>{if(G.state!=='dazza')return;for(let i=DART.list.length-1;i>=0;i--){const d=DART.list[i];if(d.owner==='dazza'&&d.ent===DART.board)DART.list.splice(i,1);}G.state='play';G.turn='you';G.turnDarts=[];DART.inHand=3;HUD.msg('[YOUR THROW]',1);DART.dirty=true;});}}

/* ---------- the chalkboards */
function chalkText(x,s,X,Y,size,a=0.92,al='left'){x.font=`bold ${size}px "Chalkboard SE","Comic Sans MS","Segoe Print",cursive,sans-serif`;x.textAlign=al;x.fillStyle=`rgba(236,236,226,${a})`;x.fillText(s,X,Y);x.fillStyle=`rgba(236,236,226,${a*0.35})`;x.fillText(s,X+1.5,Y+1);}
function chalkBase(d){const x=d.ctx,W=d.canvas.width,H=d.canvas.height;x.fillStyle='#26302b';x.fillRect(0,0,W,H);for(let i=0;i<30;i++)stain(x,Math.random()*W,Math.random()*H,30+Math.random()*90,'200,205,195',0.05);for(let i=0;i<900;i++){x.fillStyle=`rgba(220,225,215,${Math.random()*0.06})`;x.fillRect(Math.random()*W,Math.random()*H,2,2);}return x;}
function chalkDraw(){if(!DART.doors.length)return;DART.dirty=false;const G=DART.game,[L,R]=DART.doors.map(e=>e.drawable);if(!L||!R)return;const W=384;
  let x=chalkBase(L);chalkText(x,DNAME[G.mode]||'PRACTICE',W/2,56,30,0.95,'center');x.strokeStyle='rgba(236,236,226,0.6)';x.lineWidth=3;x.beginPath();x.moveTo(30,74);x.lineTo(W-30,74);x.stroke();
  if(G.mode==='501'){chalkText(x,String(G.rem),W/2,190,96,0.95,'center');let y=250;for(const h of(G.hist||[]).slice(-9)){chalkText(x,String(h),W/2,y,32,0.55,'center');x.beginPath();x.moveTo(W/2-50,y-12);x.lineTo(W/2+50,y-12);x.stroke();y+=42;}chalkText(x,'DARTS '+(G.darts||0),30,H_(L)-70,28);chalkText(x,'BEST '+(DART.best['501']||'—'),30,H_(L)-30,28);}
  else if(G.mode==='atc'){const tg=G.atc>20?(G.atc>21?'DONE':'BULL'):String(G.atc);chalkText(x,'ON',W/2,140,40,0.7,'center');chalkText(x,tg,W/2,260,110,0.95,'center');const tm=G.t0?(G.state==='won'?'':(now-G.t0).toFixed(0)+' s'):'—';chalkText(x,'TIME '+tm,30,H_(L)-110,28);chalkText(x,'DARTS '+(G.darts||0),30,H_(L)-70,28);const b=DART.best.atc;chalkText(x,'BEST '+(b?b.t+' s · '+b.d:'—'),30,H_(L)-30,28);}
  else if(G.mode==='cricket'){chalkText(x,'YOU',70,120,30,0.9,'center');chalkText(x,'DAZZA',W-70,120,30,0.9,'center');chalkText(x,String(G.pts.you),70,165,34,0.95,'center');chalkText(x,String(G.pts.dazza),W-70,165,34,0.95,'center');let y=225;
    for(const n of[20,19,18,17,16,15,25]){chalkText(x,n===25?'B':String(n),W/2,y,38,0.95,'center');for(const [who,cxx] of[['you',70],['dazza',W-70]])chalkMarks(x,G.cr[who][n],cxx,y-12);y+=70;}}
  else{chalkText(x,'LAST THREE',W/2,130,30,0.7,'center');let y=200,t=0;for(const s of(G.turnDarts||[]).slice(-3)){chalkText(x,s,W/2,y,52,0.95,'center');y+=70;}chalkText(x,'SWILLS '+Math.floor(DART.sips/3),30,H_(L)-30,26,0.6);}
  L.flag();
  x=chalkBase(R);chalkText(x,'GAMES',W/2,56,32,0.95,'center');let y=120;DMODES.forEach((m,i)=>{const on=G.mode===m;chalkText(x,(i===0?'0':String(i))+'  '+DNAME[m],28,y,on?26:22,on?0.98:0.55);if(on){x.strokeStyle='rgba(236,236,226,0.8)';x.lineWidth=2;x.beginPath();x.moveTo(24,y+8);x.lineTo(W-24,y+8);x.stroke();}y+=48;});
  y+=20;if(G.mode==='501'&&G.state==='play'){const c=checkout(G.rem);if(c){chalkText(x,'OUT:',28,y+20,30,0.8);chalkText(x,c.join(' · '),W/2,y+70,40,0.95,'center');}}
  else if(G.mode==='cricket'){chalkText(x,(G.turn==='you'?'YOUR THROW':'DAZZA\'S THROW'),W/2,y+40,32,0.9,'center');}
  chalkText(x,'THIS TURN',28,H_(R)-200,24,0.6);chalkText(x,(G.turnDarts||[]).slice(-3).join('  '),28,H_(R)-160,30,0.9);
  chalkText(x,'v DAZZA  '+DART.dz.l+' – '+DART.dz.w,28,H_(R)-90,26,0.75);x.save();x.translate(W-70,H_(R)-50);x.rotate(-0.2);chalkText(x,'NO DARTS',0,0,18,0.45,'center');chalkText(x,'AFTER 6 SWILLS',0,24,18,0.45,'center');x.restore();R.flag();}
function H_(d){return d.canvas.height;}
function chalkMarks(x,m,cx,cy){x.strokeStyle='rgba(236,236,226,0.92)';x.lineWidth=5;x.lineCap='round';if(m>=1){x.beginPath();x.moveTo(cx-16,cy+16);x.lineTo(cx+16,cy-16);x.stroke();}if(m>=2){x.beginPath();x.moveTo(cx-16,cy-16);x.lineTo(cx+16,cy+16);x.stroke();}if(m>=3){x.beginPath();x.arc(cx,cy,22,0,7);x.stroke();}}

/* ---------- SWILL: a sip per LMB with a can in your hand, three to a can */
function swillSip(e){if(!e||!e.alive||!/SWILL can/.test(e.label||'')||/empty/.test(e.label))return false;e.sips=(e.sips||0)+1;DART.sips++;const p=camera.getWorldPosition(V3());S.noise({dur:0.35,gain:0.12,type:'bandpass',f:500,f1:300,pos:p});camPunch(-0.3,0,0);
  if(e.sips>=3){e.label='SWILL can (empty)';DART.drunk+=1;DART.drunkT=now;HUD.msg(DART.drunk<1.5?'[STEADY HAND]':(DART.drunk<3?'[ANOTHER ONE DOWN]':(DART.drunk<5?'[THE BOARD IS MOVING]':'[WHICH BOARD]')),1.4);}else HUD.msg('[SIP]',0.5);DART.dirty=true;return true;}

/* ---------- per frame */
function updateDarts(dt){if(!DART.imB)return;if(DART.drunk>0&&now-DART.drunkT>240){DART.drunk=Math.max(0,DART.drunk-1);DART.drunkT=now;}
  for(const d of DART.list.slice())if(d.state==='fly')dartFly(d,dt);
  /* a dart stuck in something that fell or broke drops out */for(const d of DART.list.slice()){if(d.state!=='stuck'||!d.ent)continue;const e=d.ent;if(!e.alive||(e.attached===false)||(e.dynamic&&!d.lm)){dartRemove(d);dartLoose(d.p.clone(),V3());}}
  if(DART.queue.length&&now>=DART.queue[0]){DART.queue.shift();dazzaThrow();}
  dartHandUpdate(dt);dartsDraw();DART.chalkT-=dt;if(DART.dirty&&DART.chalkT<=0){DART.chalkT=0.25;chalkDraw();}else if(DART.game.mode==='atc'&&DART.game.state==='play'&&DART.game.t0&&DART.chalkT<=0){DART.chalkT=1;chalkDraw();}}
