/* ============================================================ v9.3 — p9g: THE REVOLVER (WS2)
   Gary's dad's .357, a DROVER MODEL 87 (invented maker), in a BUNYIP steel safe bolted to the slab in the master's walk-in
   robe, in the corner by the arch. Three ways in: the key (on a cup hook above the robe shelving, which Gary's notice
   tells you not to look at), the sawzall along the door gap (slow steel, a shower of sparks), or the wrecking bar in the
   gap at an edge (three or four heaves before the bolts or the hinge pins tear). The ammo lives in its own locked drawer
   (same key, or a power hit, a short cut or a heave). Earmuffs hang off the safe's handle.
   The gun is slot 6 once you've taken it. Realism, not arcade:
   - LMB = double action: a long heavy pull (~0.26 s) lifts the hammer and turns the cylinder; let go early and nothing
     happens. Q = cock the hammer (single action: the next LMB breaks a light trigger) · Q again = ease it down.
   - hold RMB = sights (FOV in, the notch and blade line up on the shot) · hip shots spread, DA pulls jerk the muzzle.
   - R = swing the cylinder out · R again = one round into the next empty chamber · hold R = ejector: empties hit the
     floor as brass, live rounds go back in your pocket · LMB (or R when it's full) = close. Six chambers, each tracked.
   - recoil is a real flip (the view climbs ~3°, you bring it back), muzzle flash lights the room for a frame, smoke.
   - hearing: without earmuffs every shot leaves you muffled with a ringing tone for 5-10 s (longer if you keep going);
     M = earmuffs on/off once you have them (everything goes distant, shots become thumps).
   - ballistics: one ray, walked through everything it meets with an energy budget. Plasterboard costs almost nothing
     (a stud wall gets an entry hole and a blowout on the far side), studs and furniture some, brick veneer stops it,
     the slab and the safe stop it or, at a shallow angle, send it whining off somewhere else. Pipes leak (gas too),
     cables cut, glass breaks, screens crack, tins burst, light things get knocked about. Holes are decals that stay.
   - the muzzle flash is a spark: a gassy room goes up. Shots outside (or a few inside) and the dog two doors down
     barks twice and never again; the porch light across the road comes on.
   Built after p9n, before p6. villaGun() runs at the end of buildVilla; gunTool() from updateTools (tool 5);
   updateGun() from updateV81. */

const GUN={have:false,key:false,ammo:0,ch:['','','','','',''],idx:0,cocked:false,open:false,openK:0,pull:0,pulling:false,pullC:false,hamK:0,trigK:0,cylA:0,
  fireHold:false,ads:false,adsK:0,cool:0,flashT:0,shots:0,recent:0,muffs:false,hasMuffs:false,deaf:0,ring:0,deafTau:6,ear:null,earT:0,told:{},
  rT:-1,rDone:false,mWas:false,sway:{y:0,p:0},wokeT:0,porchT:-1,barkedAt:-99,lastTrace:null,vm:null,adsOff:V3(-0.15,0.088,0.038),hip:V3(0.15,-0.19,-0.40),
  chDirty:true,env:null,mats:[],hudT:0,lastDA:false,traces:0};
const GS={locked:true,door:null,body:null,flap:null,flapLocked:true,lever:0,leverSeat:0,flapLever:0,forced:'',keyEnt:null,muffMeshes:[],lockMesh:null,gunEnt:null,ammoEnt:null,holder:null,bend:0};
const GS_LEVER=13;
/* gun geometry, in the GLB's own frame with x already stretched 1.2 (barrel +z, y up, the shooter's left is +x) */
const GP={cylY:0.306,crane:V3(0.11,0.165,0),craneAng:-1.35,ham:V3(0,0.34,-0.43),hamAng:-0.62,trig:V3(0,0.05,-0.24),trigAng:0.32,chR:0.107,rimZ:-0.296,noseZ:0.028,
  muzzle:V3(0,0.41,0.96),grip:V3(0,-0.25,-0.66),rear:V3(0,0.553,-0.357),front:V3(0,0.565,0.888),S:0.126};
function gpRig(v){return V3(-v.x*GP.S,v.y*GP.S,-v.z*GP.S);}

/* ---------- models: split the GLB into frame / cylinder / hammer / trigger and hang them on pivots */
function gunMatFrom(m){const n=m.clone();n.side=THREE.FrontSide;n.metalness=1;n.roughness=1;if(n.map){n.map.colorSpace=THREE.SRGBColorSpace;n.map.anisotropy=8;}if(GUN.env){n.envMap=GUN.env;n.envMapIntensity=0.6;}GUN.mats.push(n);return n;}
function gunProcGeo(){/* fallback parts until (or if) the GLB arrives: boxes and tubes in the GLB frame */const st=new THREE.MeshStandardMaterial({color:0xb8bcc0,roughness:0.35,metalness:0.7}),bl=new THREE.MeshStandardMaterial({color:0x2a2c2e,roughness:0.5,metalness:0.6}),gr=new THREE.MeshStandardMaterial({color:0x151515,roughness:0.9});
  const m=(geo,mat,x,y,z,rx=0)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.rotation.x=rx;return o;};
  const frame=new THREE.Group();frame.add(m(new THREE.CylinderGeometry(0.07,0.07,0.92,16),st,0,0.41,0.5,Math.PI/2));frame.add(m(new THREE.BoxGeometry(0.06,0.06,0.92),st,0,0.5,0.5));frame.add(m(new THREE.BoxGeometry(0.06,0.05,0.04),bl,0,0.55,0.88));
    frame.add(m(new THREE.BoxGeometry(0.13,0.36,0.5),st,0,0.3,-0.2));frame.add(m(new THREE.BoxGeometry(0.15,0.6,0.24),gr,0,-0.2,-0.62,0.35));frame.add(m(new THREE.TorusGeometry(0.1,0.018,8,16,Math.PI),st,0,0.05,-0.24,Math.PI));
  const cyl=m(new THREE.CylinderGeometry(0.157,0.157,0.33,18),bl,0,GP.cylY,-0.125,Math.PI/2);const ham=m(new THREE.BoxGeometry(0.04,0.14,0.08),st,0,0.42,-0.5);const trig=m(new THREE.BoxGeometry(0.03,0.18,0.03),st,0,-0.04,-0.27);
  return{frame,cyl,ham,trig};}
function gunSplitGLB(root){/* triangle centroids sort the single scanned mesh into its moving parts */let mesh=null;root.traverse(o=>{if(o.isMesh&&!mesh)mesh=o;});if(!mesh)return null;const g=mesh.geometry.clone();g.scale(1.2,1,1);const P=g.attributes.position,I=g.index.array;const L={frame:[],cyl:[],ham:[],trig:[]};
  for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],c=I[t+2];const x=(P.getX(a)+P.getX(b)+P.getX(c))/3,y=(P.getY(a)+P.getY(b)+P.getY(c))/3,z=(P.getZ(a)+P.getZ(b)+P.getZ(c))/3;let k='frame';
    if(Math.hypot(x,y-GP.cylY)<0.162&&z>-0.29&&z<0.04)k='cyl';else if(z>-0.62&&z<-0.37&&y>0.35&&y<0.49&&Math.abs(x)<0.054)k='ham';else if(z>-0.33&&z<-0.19&&y>-0.16&&y<0.06&&Math.abs(x)<0.036)k='trig';L[k].push(a,b,c);}
  const out={};const mat=gunMatFrom(mesh.material);for(const k in L){const ng=new THREE.BufferGeometry();for(const a in g.attributes)ng.setAttribute(a,g.attributes[a]);ng.setIndex(L[k]);ng.computeBoundingSphere();out[k]=new THREE.Mesh(ng,mat);out[k].frustumCulled=false;}
  /* sights from the geometry: tallest point near the muzzle, tallest point over the frame's rear */let fy=-9,ry=-9;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);if(Math.abs(x)>0.04)continue;if(z>0.8&&y>fy)fy=y;if(z>-0.42&&z<-0.3&&y>ry)ry=y;}if(fy>0.3&&fy<0.8)GP.front.y=fy;if(ry>0.3&&ry<0.8)GP.rear.y=ry;
  return out;}
function gunRig(parts,live){/* rv: the GLB frame turned to point down -z at 0.126 scale; pivots for hammer, trigger, crane and cylinder */const rv=new THREE.Group();rv.rotation.y=Math.PI;rv.scale.setScalar(GP.S);rv.add(parts.frame);
  const piv=(p,obj)=>{const g=new THREE.Group();g.position.copy(p);obj.position.sub(p);g.add(obj);return g;};
  const hamP=piv(GP.ham,parts.ham);rv.add(hamP);const trigP=piv(GP.trig,parts.trig);rv.add(trigP);
  const crane=new THREE.Group();crane.position.copy(GP.crane);rv.add(crane);const cylP=new THREE.Group();cylP.position.set(-GP.crane.x,GP.cylY-GP.crane.y,0);crane.add(cylP);parts.cyl.position.y-=GP.cylY;cylP.add(parts.cyl);
  const R={rv,hamP,trigP,crane,cylP};
  if(live){/* six rims at the back face, six noses at the front: what's in each chamber */const rimG=new THREE.CylinderGeometry(0.044,0.044,0.012,14);rimG.rotateX(Math.PI/2);const noseG=new THREE.ConeGeometry(0.033,0.05,10);noseG.rotateX(Math.PI/2);
    R.rims=new THREE.InstancedMesh(rimG,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.35,metalness:0.6}),6);R.noses=new THREE.InstancedMesh(noseG,new THREE.MeshStandardMaterial({color:0xb87a4a,roughness:0.4,metalness:0.5}),6);
    for(const o of[R.rims,R.noses]){o.frustumCulled=false;o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);cylP.add(o);}for(let j=0;j<6;j++)R.rims.setColorAt(j,new THREE.Color(0xc9a050));
    /* muzzle flash: two crossed additive cards */const c=mkCanvas(64,64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,250,230,1)');g.addColorStop(0.25,'rgba(255,200,110,0.9)');g.addColorStop(0.6,'rgba(255,120,30,0.35)');g.addColorStop(1,'rgba(255,80,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
    x.strokeStyle='rgba(255,230,180,0.8)';x.lineWidth=3;for(let i=0;i<7;i++){const a=i/7*Math.PI*2;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*31,32+Math.sin(a)*31);x.stroke();}
    const fm=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});const fl=new THREE.Group();for(const r of[0,Math.PI/2]){const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.7),fm);pl.rotation.set(Math.PI/2,r,0);pl.position.z=0.75;fl.add(pl);}
    const face=new THREE.Mesh(new THREE.CircleGeometry(0.45,16),fm);face.position.z=0.12;fl.add(face);fl.position.copy(GP.muzzle);fl.visible=false;rv.add(fl);R.flash=fl;}
  return R;}
function gunPose(R,st){/* hammer / trigger / cylinder / crane from state (k 0..1) */R.hamP.rotation.x=GP.hamAng*st.ham;R.trigP.rotation.x=GP.trigAng*st.trig;R.crane.rotation.z=GP.craneAng*st.open;R.cylP.rotation.z=st.cyl;}
const _gnm=new THREE.Matrix4(),_gnq=new THREE.Quaternion(),_gns=V3(),_gn0=V3(0,0,0);
function gunRounds(R){if(!R.rims)return;for(let j=0;j<6;j++){const a=Math.PI/2-j*Math.PI/3;const x=Math.cos(a)*GP.chR,y=Math.sin(a)*GP.chR;const s=GUN.ch[j];_gns.setScalar(s?1:0);_gnm.compose(V3(x,y,GP.rimZ),_gnq.identity(),_gns);R.rims.setMatrixAt(j,_gnm);if(s)R.rims.setColorAt(j,new THREE.Color(s==='L'?0xd2aa58:0x8a6a38));
    _gns.setScalar(s==='L'?1:0);_gnm.compose(V3(x,y,GP.noseZ),_gnq,_gns);R.noses.setMatrixAt(j,_gnm);}R.rims.instanceMatrix.needsUpdate=true;R.noses.instanceMatrix.needsUpdate=true;if(R.rims.instanceColor)R.rims.instanceColor.needsUpdate=true;}
function buildRevolverVM(){/* slot 6: procedural stand-in until the GLB lands */const R=gunRig(gunProcGeo(),true);GUN.vm=R;const it=toolRig(R.rv,gpRig(GP.grip),V3());it.userData.gun=R;gunRounds(R);gunAdsCalc();return it;}
function gunAdsCalc(){/* hip → sights offset so the notch and blade sit on the camera axis, rear sight 0.40 m from the eye */const g=gpRig(GP.grip),r=gpRig(GP.rear),f=gpRig(GP.front);const sy=(r.y+f.y)/2-0.0012;GUN.adsOff=V3(0-GUN.hip.x,-(sy-g.y)-GUN.hip.y,(-0.40-(r.z-g.z))-GUN.hip.z);}
async function gunAsset(root){/* called from loadToolAssets with the parsed GLB */try{const {RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');const pm=new THREE.PMREMGenerator(renderer);GUN.env=pm.fromScene(new RoomEnvironment(),0.04).texture;pm.dispose();}catch(e){GUN.env=null;}
  const parts=gunSplitGLB(root);if(!parts)return;const R=gunRig(parts,true);const it=VM.items[5];if(it){swapModel(it,R.rv,gpRig(GP.grip));it.userData.gun=R;}GUN.vm=R;GUN.glb=true;gunAdsCalc();gunRounds(R);
  if(GS.holder){/* the one in the safe: a static copy */const W=gunRig({frame:parts.frame.clone(),cyl:parts.cyl.clone(),ham:parts.ham.clone(),trig:parts.trig.clone()},false);while(GS.holder.children.length)GS.holder.remove(GS.holder.children[0]);GS.holder.add(W.rv);W.rv.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}}

/* ---------- the safe */
function vTexBunyip(){const c=mkCanvas(160,40),x=c.getContext('2d');x.fillStyle='#1c1e20';x.fillRect(0,0,160,40);x.strokeStyle='#b89a50';x.lineWidth=2;x.strokeRect(3,3,154,34);x.fillStyle='#d8c070';x.font='bold 17px monospace';x.textAlign='center';x.fillText('BUNYIP SAFE CO.',80,21);x.font='9px monospace';x.fillText('3 MM PLATE · CAT A·B·H',80,33);return c;}
function vTexAmmo(){const c=mkCanvas(128,80),x=c.getContext('2d');x.fillStyle='#d8d0b8';x.fillRect(0,0,128,80);x.fillStyle='#7a1a14';x.fillRect(0,0,128,24);x.fillStyle='#f4ecd8';x.font='bold 15px monospace';x.textAlign='center';x.fillText('KESTREL',64,17);x.fillStyle='#1a1a1a';x.font='bold 16px monospace';x.fillText('.357 MAGNUM',64,44);x.font='10px monospace';x.fillText('158 GR · JSP · 50',64,60);x.fillText('CENTREFIRE CARTRIDGES',64,73);return c;}
function vTexGaryNote(){const c=mkCanvas(96,64),x=c.getContext('2d');x.fillStyle='#efe8d4';x.fillRect(0,0,96,64);x.fillStyle='#2a3a8a';x.font='italic 13px serif';x.fillText("Dad's.",8,20);x.fillText('Not to be',8,36);x.fillText('touched.  — G',8,52);return c;}
function villaGun(){const F=vFr(15.65,5.0,0,1);GS.F=F;const W=0.5,H=1.2,D=0.42,T=0.012;
  const steel=new THREE.MeshStandardMaterial({color:0x4c5359,roughness:0.55,metalness:0.3}),inner=new THREE.MeshStandardMaterial({color:0x6a6e70,roughness:0.85,metalness:0.25}),foam=new THREE.MeshStandardMaterial({color:0x2a2a2c,roughness:1});
  const carc=compoundEnt([{w:W,h:H,d:T,x:0,y:H/2,z:T/2,mat:steel},{w:T,h:H,d:D,x:-W/2+T/2,y:H/2,z:D/2,mat:steel},{w:T,h:H,d:D,x:W/2-T/2,y:H/2,z:D/2,mat:steel},{w:W,h:T,d:D,x:0,y:H-T/2,z:D/2,mat:steel},{w:W,h:0.045,d:D,x:0,y:0.0225,z:D/2,mat:steel},
    {w:W-2*T,h:0.008,d:D-0.03,x:0,y:0.6,z:T+(D-0.03)/2,mat:inner},{w:W-2*T,h:0.008,d:D-0.03,x:0,y:0.93,z:T+(D-0.03)/2,mat:inner},{w:0.32,h:0.012,d:0.22,x:0,y:0.61,z:0.2,mat:foam,noCollide:true},
    ...[[-0.15,0.1],[0.15,0.1],[-0.15,0.3],[0.15,0.3]].map(([u,d])=>({geo:new THREE.CylinderGeometry(0.008,0.008,0.006,8),x:u,y:0.048,z:d,mat:M.chrome,noCollide:true}))],
    F.at(0,0,0),{kind:'fixture',mat:'metal',mass:95,hp:999,label:'gun safe (bolted to the slab)',noBatch:true,quat:F.q,bolted:true,armor:true,powerOnly:true,wakeThreshold:1e9});GS.body=carc;
  carc.sawTime=8;carc.onSawn=()=>{carc.sawnDone=false;HUD.msg('[3 MM PLATE · THE BOLTS ARE IN THE DOOR · CUT ALONG THE DOOR GAP]',2);};
  carc.onLever=(dw,w)=>{crow.wedge=null;HUD.hideBar();HUD.msg('[NO SEAM IN THE CARCASS · WORK THE DOOR GAP]',1.4);};carc.onHit=(p)=>{S.tone({f:620,f1:560,dur:0.5,type:'triangle',gain:0.25,pos:p});};
  /* the door: hinged on the robe side, lock and T-handle on the other; the earmuffs hang off the handle */const lock=new THREE.Group();const cylG=new THREE.CylinderGeometry(0.016,0.016,0.014,18);cylG.rotateX(Math.PI/2);lock.add(new THREE.Mesh(cylG,M.chrome));const slot=new THREE.Mesh(new THREE.BoxGeometry(0.003,0.014,0.004),new THREE.MeshBasicMaterial({color:0x111111}));slot.position.z=0.007;lock.add(slot);
  const hub=new THREE.CylinderGeometry(0.02,0.02,0.035,14);hub.rotateX(Math.PI/2);
  const door=compoundEnt([{w:W-0.004,h:H-0.004,d:0.04,x:0,y:0,z:0,mat:steel},{geo:hub,x:0.16,y:-0.03,z:0.037,mat:M.chrome,noCollide:true},{w:0.14,h:0.018,d:0.018,x:0.16,y:-0.03,z:0.058,mat:M.chrome,noCollide:true},
    {geo:new THREE.CylinderGeometry(0.012,0.012,0.09,10),x:-W/2,y:0.3,z:0.0,mat:steel,noCollide:true},{geo:new THREE.CylinderGeometry(0.012,0.012,0.09,10),x:-W/2,y:-0.3,z:0.0,mat:steel,noCollide:true},
    {geo:new THREE.PlaneGeometry(0.16,0.04),x:0,y:0.47,z:0.0205,mat:new THREE.MeshStandardMaterial({map:mkTex(vTexBunyip(),1,1),roughness:0.5,metalness:0.3}),noCollide:true}],
    F.at(0,H/2,D+0.02),{kind:'fixture',mat:'metal',mass:28,hp:999,label:'gun safe door',noBatch:true,quat:F.q,bolted:true,armor:true,powerOnly:true,wakeThreshold:1e9});
  lock.position.set(0.16,0.1,0.024);door.mesh.add(lock);GS.lockMesh=lock;
  {const band=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.6}),cupM=new THREE.MeshStandardMaterial({color:0x4a5a34,roughness:0.55}),pad=new THREE.MeshStandardMaterial({color:0x111111,roughness:0.9});
    const hb=new THREE.Mesh(new THREE.TorusGeometry(0.075,0.008,8,20,Math.PI),band);hb.position.set(0.16,-0.105,0.075);const cg=new THREE.CylinderGeometry(0.045,0.045,0.04,16);cg.rotateZ(Math.PI/2);const pg=new THREE.CylinderGeometry(0.04,0.04,0.018,14);pg.rotateZ(Math.PI/2);
    const parts=[hb];for(const s of[-1,1]){const c=new THREE.Mesh(cg,cupM);c.position.set(0.16+s*0.075,-0.135,0.075);parts.push(c);const p=new THREE.Mesh(pg,pad);p.position.set(0.16+s*0.048,-0.135,0.075);parts.push(p);}
    for(const p of parts){p.castShadow=true;door.mesh.add(p);GS.muffMeshes.push(p);}}
  const sgn=Math.sign(V3(0,1,0).cross(F.t).dot(F.n))||1;kinDoor(door,carc,F.at(-W/2,0,D),V3(0,1,0),1.75*sgn,{name:'SAFE',speed:2.6});GS.door=door;
  door.use=(h)=>{if(h&&GS.muffMeshes.includes(h.object)&&!GUN.hasMuffs){gunTakeMuffs();return;}if(GS.locked){if(GUN.key){gsUnlock('key');return;}S.clink(door.mesh.position);S.thud(door.mesh.position,1.4);HUD.msg('[LOCKED · BOLTED TO THE SLAB · IT WANTS A KEY]',1.6);return;}toggleKinDoor(door);};
  door.useLabel=(h)=>{if(h&&GS.muffMeshes.includes(h.object)&&!GUN.hasMuffs)return'TAKE THE EARMUFFS';if(GS.locked)return GUN.key?'UNLOCK THE SAFE':'SAFE · LOCKED';return door.kin.target!==0?'CLOSE THE SAFE':'OPEN THE SAFE';};
  door.sawTime=13;door.onSawn=()=>{if(GS.locked)gsUnlock('saw');};
  door.onHit=(p,dmg)=>{S.tone({f:480,f1:430,dur:0.6,type:'triangle',gain:0.3,pos:p});if(dmg>2.4&&GS.locked&&!GUN.told.hit){GUN.told.hit=true;HUD.msg('[A DENT. IT IS STILL A SAFE.]',1.4);}};
  door.onLever=(dw,w)=>{if(!GS.locked){crow.wedge=null;HUD.hideBar();return;}const lu=w.point.clone().sub(F.o).dot(F.t);const edge=Math.abs(lu-W/2)<0.1?'lock':(Math.abs(lu+W/2)<0.1?'hinge':'');
    if(!edge){crow.wedge=null;HUD.hideBar();HUD.msg('[NO GAP THERE · GET THE TIP INTO THE DOOR GAP AT AN EDGE]',1.6);return;}
    GS.lever+=dw;GS.leverSeat+=dw;HUD.bar(GS.lever/GS_LEVER,'LEVER · SAFE DOOR · '+(edge==='lock'?'BOLTS':'HINGE PINS'));crow.flexV=clamp(GS.leverSeat/4,0,1)*0.6;
    if(dw>0&&Math.random()<0.2)S.groan(w.point,1.4);if(dw>0&&Math.random()<0.1)S.tone({f:900+Math.random()*500,dur:0.15,type:'sawtooth',gain:0.04,pos:w.point});
    GS.bend=Math.min(1,GS.lever/GS_LEVER);door.kin.target=door.kin.open*0.02*GS.bend;
    if(GS.lever>=GS_LEVER){crow.wedge=null;crow.flexV=0;HUD.hideBar();gsUnlock(edge==='lock'?'bar':'hinge');return;}
    if(GS.leverSeat>=4){GS.leverSeat=0;crow.wedge=null;crow.flexV=0;HUD.hideBar();S.clink(w.point);S.snap(w.point);vmImpulse(V3(0,-0.1,0.4),V3(4,0,1));camPunch(-0.8,0,0.5);HUD.msg('[THE BAR SLIPS OUT OF THE GAP · RESEAT IT]',1.4);}};
  /* the ammo drawer: its own flap and lock under the top */const flap=compoundEnt([{w:W-2*T-0.006,h:0.22,d:0.006,x:0,y:-0.11,z:0,mat:steel},{geo:new THREE.CylinderGeometry(0.008,0.008,0.008,12),x:0,y:-0.19,z:0.005,mat:M.chrome,rot:[Math.PI/2,0,0],noCollide:true}],
    F.at(0,H-0.018,D-0.012),{kind:'fixture',mat:'metal',mass:2,hp:999,label:'ammunition drawer',noBatch:true,quat:F.q,bolted:true,wakeThreshold:1e9});
  const fs=Math.sign(F.t.clone().cross(V3(0,1,0)).dot(F.n))||1;kinDoor(flap,carc,F.at(0,H-0.018,D-0.012),F.t.clone(),-2.9*fs,{name:'DRAWER',speed:3});GS.flap=flap;
  const flapOpen=(how)=>{GS.flapLocked=false;flap.kin.target=flap.kin.open;S.click(flap.mesh.position,2400);S.thup(flap.mesh.position,0.6);HUD.msg(how==='key'?'[SAME KEY · THE AMMO FLAP SWINGS UP]':'[THE LITTLE LOCK GIVES · THE FLAP SWINGS UP]',1.6);if(how!=='key')bondHit('gun safe (ammo drawer lock)',90,true);};
  flap.use=()=>{if(GS.flapLocked){if(GUN.key){flapOpen('key');return;}S.clink(flap.mesh.position);HUD.msg('[AMMO DRAWER · LOCKED SEPARATELY (THAT\'S THE LAW)]',1.6);return;}toggleKinDoor(flap);};
  flap.useLabel=()=>GS.flapLocked?(GUN.key?'UNLOCK THE AMMO DRAWER':'AMMO DRAWER · LOCKED'):(flap.kin.target!==0?'CLOSE THE DRAWER':'OPEN THE DRAWER');
  flap.sawTime=4;flap.onSawn=()=>{if(GS.flapLocked)flapOpen('saw');};flap.onHit=(p,dmg)=>{if(GS.flapLocked&&dmg>=2.5)flapOpen('hammer');else S.clink(p);};
  flap.onLever=(dw)=>{if(!GS.flapLocked){crow.wedge=null;HUD.hideBar();return;}GS.flapLever+=dw;HUD.bar(GS.flapLever/2.5,'LEVER · AMMO DRAWER');if(GS.flapLever>=2.5){crow.wedge=null;HUD.hideBar();flapOpen('bar');}};
  /* contents: the ammo, the revolver on its foam, Gary's note */
  const am=boxEnt(0.095,0.04,0.062,F.at(0.04,0.934+0.02,0.2),[vMat(0xd8d0b8,0.9),vMat(0xd8d0b8,0.9),new THREE.MeshStandardMaterial({map:mkTex(vTexAmmo(),1,1),roughness:0.9}),vMat(0xd8d0b8,0.9),vMat(0x7a1a14,0.9),vMat(0x7a1a14,0.9)],{kind:'prop',mat:'chip',mass:0.9,hp:4,label:'box of .357 Magnum (KESTREL · 50)',noBatch:true,quat:F.q});
  am.useLabel=()=>'TAKE THE AMMUNITION';am.use=()=>{if(!am.alive)return;GUN.ammo+=50;removeEnt(am);S.clink(F.at(0,0.98,0.3));HUD.msg('[50 ROUNDS OF .357 MAGNUM · IN YOUR POCKET]',1.8);gunHudDraw(true);};GS.ammoEnt=am;
  const holder=new THREE.Group();const pr=gunRig(gunProcGeo(),false);holder.add(pr.rv);GS.holder=holder;
  {const Xw=V3(0,-1,0),Zw=F.t.clone(),Yw=Zw.clone().cross(Xw).normalize();holder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(Xw.clone().negate(),Yw,Zw.clone().negate()));holder.position.copy(F.at(0.0,0.616+0.022,0.2));}
  const gb=new CANNON.Body({mass:0});gb.addShape(new CANNON.Box(new CANNON.Vec3(0.12,0.02,0.07)));gb.position.copy(toC(F.at(0,0.638,0.2)));gb.quaternion.copy(qC(F.q));
  const ge=mkEnt({mesh:holder,body:gb,kind:'prop',mat:'metal',mass:1.2,hp:999,label:'revolver (DROVER MODEL 87 · .357)',noBatch:true,bolted:true});GS.gunEnt=ge;ge.useLabel=()=>'TAKE THE REVOLVER';ge.use=()=>gunTake();
  const nt=mkEnt({mesh:(()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(0.14,0.095),new THREE.MeshStandardMaterial({map:mkTex(vTexGaryNote(),1,1),roughness:1}));m.rotation.x=-Math.PI/2;const g=new THREE.Group();g.add(m);g.position.copy(F.at(-0.09,0.047,0.27));g.rotation.y=0.3;return g;})(),kind:'prop',mat:'fabric',mass:0.01,hp:999,label:'a note in Gary\'s hand',noBatch:true});
  nt.useLabel=()=>'READ THE NOTE';nt.use=()=>{HUD.msg('["DAD\'S. NOT TO BE TOUCHED. — G"]',2.6);S.tear(nt.mesh.position);};
  /* the key: a cup hook above the robe shelving, south end */{const K=vFr(17.6,6.2,-1,0);const g=new THREE.Group();const brass=new THREE.MeshStandardMaterial({color:0xc8a050,roughness:0.3,metalness:0.85});
    const hook=new THREE.Mesh(new THREE.TorusGeometry(0.009,0.0018,6,12,Math.PI*1.4),M.chrome);hook.rotation.z=-0.6;g.add(hook);const bow=new THREE.Mesh(new THREE.TorusGeometry(0.009,0.0025,6,14),brass);bow.position.y=-0.016;g.add(bow);
    const shank=new THREE.Mesh(new THREE.BoxGeometry(0.0035,0.032,0.002),brass);shank.position.y=-0.04;g.add(shank);for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.003,0.002),brass);b.position.set(0.0035,-0.046+i*0.006,0);g.add(b);}
    const tag=new THREE.Mesh(new THREE.PlaneGeometry(0.022,0.03),new THREE.MeshStandardMaterial({color:0xe8e0c8,roughness:1,side:THREE.DoubleSide}));tag.position.set(-0.013,-0.03,0.003);tag.rotation.z=0.25;g.add(tag);const px=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.1,0.03),new THREE.MeshBasicMaterial());px.position.set(-0.004,-0.035,0.01);px.visible=false;g.add(px);
    g.position.copy(K.at(1.17,2.05,0.012));g.quaternion.copy(K.q);const ke=mkEnt({mesh:g,kind:'prop',mat:'metal',mass:0.02,hp:999,label:'small brass key on a hook',noBatch:true});GS.keyEnt=ke;
    ke.useLabel=()=>'TAKE THE KEY';ke.use=()=>{if(!ke.alive)return;GUN.key=true;removeEnt(ke);S.clink(g.position);HUD.msg('[A SMALL BRASS KEY · PAPER TAG: "G · SAFE"]',2);};}
  /* Gary on the subject */if(typeof VNOTES!=='undefined'&&!VNOTES.some(n=>n.includes('THE SAFE'))){VNOTES.splice(1,0,'RE: THE SAFE IN THE ROBE. IT IS MY LATE FATHER\'S AND IT STAYS SHUT. THE KEY IS NOT UP IN THE ROBE. DO NOT LOOK UP IN THE ROBE. · GARY');VNOTES.push('RE: THE SAFE (AGAIN). IT IS BOLTED TO THE SLAB. DO NOT ATTEMPT TO SAW IT OR LEVER IT. IT IS IN THE BOND. · GARY');}
  gunHudInit();}
function gsUnlock(how){if(!GS.locked)return;GS.locked=false;GS.forced=how==='key'?'':how;const d=GS.door,p=d.mesh.position.clone();GS.lockMesh.rotation.z=how==='key'?Math.PI/2:0.3;
  if(how==='key'){S.click(p,2000);after(0.25,()=>S.thup(p,0.7));HUD.msg('[THE KEY TURNS · TWO BOLTS SLIDE BACK]',1.8);after(0.35,()=>{if(d.kin.target===0)toggleKinDoor(d);});return;}
  S.snap(p);S.thud(p,1.8);sparks(p,10,[1,0.8,0.4]);shakeCam(0.3);d.kin.target=d.kin.open*0.3;
  HUD.msg(how==='saw'?'[BOLT LINE CUT THROUGH · THE DOOR SWINGS FREE]':how==='bar'?'[THE LOCK EDGE FOLDS · BOLTS TORN THROUGH THE FRAME]':'[HINGE PINS SHEARED · THE DOOR HANGS OFF ITS BOLTS · IT\'S OPEN]',2.2);bondHit('gun safe (locksmith & new door)',650,true);}
function gunTakeMuffs(){GUN.hasMuffs=true;GUN.muffs=true;for(const m of GS.muffMeshes){if(m.parent)m.parent.remove(m);}S.thup(GS.door.mesh.position,0.5);HUD.msg('[EARMUFFS ON · THE HOUSE GOES DISTANT · M = ON / OFF]',2);gunHudDraw(true);}
function gunTake(){if(GUN.have)return;GUN.have=true;removeEnt(GS.gunEnt);const s=HUD.el.slots&&HUD.el.slots.children&&HUD.el.slots.children[5];if(s&&s.style)s.style.display='';setTool(5);
  HUD.msg('[DROVER MODEL 87 · .357 MAGNUM · SIX CHAMBERS · ALL EMPTY]',2.4);if(MOB.el&&MOB.el.radial&&MOB.el.radial.children[5])MOB.el.radial.children[5].style.display='';}

/* ---------- handling */
function toolCount(){return GUN.have?6:5;}
function gunTool(dt){const G=GUN;G.ads=!!mouse.r&&!G.open;G.cool=Math.max(0,G.cool-dt);
  /* R: tap = open / load one / close; hold = eject */if(keys.KeyR){if(G.rT<0){G.rT=0;G.rDone=false;}G.rT+=dt;if(G.open&&!G.rDone&&G.rT>=0.45){G.rDone=true;gunEject();}}else if(G.rT>=0){if(!G.rDone)gunRTap();G.rT=-1;}
  if(!mouse.l)G.fireHold=false;
  if(G.open){if(mouse.lp)gunCloseCyl();G.pull=0;G.pulling=false;}
  else if(G.cocked){if(mouse.lp&&G.cool<=0){G.lastDA=false;gunDropHammer();}}
  else{if(mouse.l&&!G.fireHold&&G.cool<=0){if(!G.pulling){G.pulling=true;G.pullC=false;if(G.pull<0.05)S.tone({f:1900,dur:0.03,type:'triangle',gain:0.05});}G.pull=Math.min(1,G.pull+dt/0.26);
      if(!G.pullC&&G.pull>=0.75){G.pullC=true;G.idx=(G.idx+1)%6;G.chDirty=true;S.tone({f:2600,dur:0.02,type:'square',gain:0.04});}if(G.pull>=1){G.lastDA=true;gunDropHammer();}}
    else{G.pulling=false;G.pull=Math.max(0,G.pull-dt/0.12);}}}
function gunCock(){const G=GUN;if(!G.have||G.open||G.pulling)return;const p=camera.getWorldPosition(V3());
  if(G.cocked){G.cocked=false;S.tone({f:1500,dur:0.04,type:'triangle',gain:0.08});HUD.msg('[HAMMER EASED DOWN]',0.8);return;}
  G.cocked=true;G.idx=(G.idx+1)%6;G.chDirty=true;S.tone({f:2300,dur:0.025,type:'square',gain:0.08});S.tone({f:1800,dur:0.03,type:'square',gain:0.1,delay:0.09});vmImpulse(V3(0,0.02,0.05),V3(-1.5,0,0));}
function gunDropHammer(){const G=GUN;G.cocked=false;G.pull=0;G.pulling=false;G.pullC=false;G.hamK=0;G.fireHold=true;G.trigK=1;G.cool=0.12;
  if(G.ch[G.idx]==='L')gunFire();else{/* click */S.tone({f:2900,f1:2500,dur:0.03,type:'square',gain:0.12});S.noise({dur:0.02,gain:0.1,type:'highpass',f:3000});vmImpulse(V3(0,0,0.02),V3(-0.6,0,0));if(!G.told.dry&&!G.ch.includes('L')){G.told.dry=true;HUD.msg(G.ammo?'[CLICK · IT\'S EMPTY · R TO SWING THE CYLINDER OUT]':'[CLICK · EMPTY]',1.6);}}}
function gunRTap(){const G=GUN;if(!G.open){if(G.cocked)G.cocked=false;G.pulling=false;G.pull=0;G.open=true;S.tone({f:1700,dur:0.03,type:'triangle',gain:0.08});if(!G.told.open){G.told.open=true;HUD.msg('[CYLINDER OUT · R = A ROUND IN · HOLD R = EJECT · LMB = CLOSE]',2.4);}return;}
  for(let k=1;k<=6;k++){const j=(G.idx+k)%6;if(G.ch[j]==='')
      {if(G.ammo<=0){HUD.msg('[NO ROUNDS IN YOUR POCKET]',1.2);gunCloseCyl();return;}G.ch[j]='L';G.ammo--;G.chDirty=true;S.tone({f:3200+Math.random()*300,dur:0.03,type:'triangle',gain:0.06});vmImpulse(V3(0,0,0.01),V3(0.4,0,0));gunHudDraw(true);return;}}
  if(G.ch.includes('S')){HUD.msg('[EMPTIES STILL IN · HOLD R TO PUNCH THEM OUT]',1.4);return;}gunCloseCyl();}
function gunCloseCyl(){const G=GUN;if(!G.open)return;G.open=false;S.tone({f:2100,f1:1900,dur:0.04,type:'square',gain:0.1});vmImpulse(V3(0.01,0,0),V3(0,0,-1.2));}
function gunEject(){const G=GUN;let sp=0,lv=0;for(let j=0;j<6;j++){if(G.ch[j]==='S')sp++;else if(G.ch[j]==='L')lv++;G.ch[j]='';}G.ammo+=lv;G.chDirty=true;vmImpulse(V3(0,0.03,0),V3(3,0,0));
  const o=camera.getWorldPosition(V3()).addScaledVector(camFwd(),0.35).add(V3(0,-0.2,0)).addScaledVector(camRight(),0.04);
  for(let i=0;i<sp;i++){const m=new THREE.Mesh(GUN_BRASS.geo,GUN_BRASS.mat);m.position.copy(o).add(V3(rnd(-0.02,0.02),rnd(-0.02,0.02),rnd(-0.02,0.02)));m.rotation.set(rnd(0,3),rnd(0,3),rnd(0,3));m.castShadow=false;
    const b=boxBody(0.0048,0.0165,0.0048,m.position);const e=mkEnt({mesh:m,body:b,kind:'prop',mat:'metal',mass:0.008,hp:3,label:'.357 case (fired)',wakeable:true,noBatch:true,frag:false});makeDynamic(e);e.body.velocity.set(rnd(-0.6,0.6),rnd(-0.5,0.3),rnd(-0.6,0.6));e.body.angularVelocity.set(rnd(-20,20),rnd(-20,20),rnd(-20,20));
    for(let k=0;k<3;k++)S.tone({f:3600+Math.random()*1800,dur:0.05,type:'triangle',gain:0.05,delay:0.25+i*0.04+k*0.07+Math.random()*0.05});}
  S.tone({f:1200,dur:0.04,type:'square',gain:0.06});HUD.msg(sp||lv?`[EJECTED${sp?' · '+sp+' EMPT'+(sp>1?'IES':'Y')+' ON THE FLOOR':''}${lv?' · '+lv+' LIVE BACK IN YOUR POCKET':''}]`:'[NOTHING IN IT]',1.6);gunHudDraw(true);}
const GUN_BRASS={geo:(()=>{const g=new THREE.CylinderGeometry(0.0048,0.0048,0.033,10);return g;})(),mat:new THREE.MeshStandardMaterial({color:0xc9a050,roughness:0.3,metalness:0.85})};

/* ---------- firing */
function gunCamBasis(){const q=camera.getWorldQuaternion(new THREE.Quaternion());return{o:camera.getWorldPosition(V3()),f:V3(0,0,-1).applyQuaternion(q),r:V3(1,0,0).applyQuaternion(q),u:V3(0,1,0).applyQuaternion(q)};}
function gunSpread(){const G=GUN;const a=G.adsK;let s=0.0011+0.010*(1-a)+0.0012*a;if(G.lastDA)s+=0.0035*(1-0.5*a);const v=player.vel?Math.hypot(player.vel.x,player.vel.z):0;s+=0.006*clamp(v/4,0,1);if(player.crouch)s*=0.75;return s;}
function gunMuzzleWorld(B){const a=GUN.adsK;return B.o.clone().addScaledVector(B.f,0.6).addScaledVector(B.r,0.15*(1-a)).addScaledVector(B.u,-0.11*(1-a)-0.03*a);}
function gunFire(){const G=GUN;G.ch[G.idx]='S';G.chDirty=true;G.shots++;G.recent=Math.min(12,G.recent+1);G.flashT=0.05;G.cool=0.15;
  const B=gunCamBasis();const s=gunSpread();const d=B.f.clone().addScaledVector(B.r,dGauss()*s+G.sway.y).addScaledVector(B.u,dGauss()*s+G.sway.p).normalize();const mz=gunMuzzleWorld(B);
  const room=vRoomAtWorld(B.o.x,B.o.z);const inside=!!room||B.o.y<-0.4;
  gunBang(inside,G.muffs);gunEarsHit();
  /* flash: the room lights for a frame, the gun lights itself */if(VL.flare&&!(VG.flashT>0)&&!(VG.bottle&&VG.bottle.jet)){VL.flare.position.copy(mz);VL.flare.color.setHex(0xffc070);VL.flare.intensity=26;G.flareOn=true;}if(VM.hemi)VM.hemi.intensity=3.2;if(VM.key)VM.key.intensity=4;
  P.emit(mz,{count:12,color:[0.72,0.72,0.7],cvar:0.05,size:0.05,svar:0.03,life:2,lvar:0.7,vel:B.f,speed:0.7,spread:0.45,grav:-0.12,drag:2.3,kind:1});P.emit(mz.clone().addScaledVector(B.f,-0.18),{count:5,color:[0.7,0.7,0.68],size:0.03,life:1.2,spread:0.8,grav:-0.1,drag:2.5,kind:1});
  spkEmit(mz,B.f,4,{speed:9,life:0.12,glow:false,light:false});onSpark(mz,'muzzle');
  /* recoil: a real flip; you bring it back down yourself */player.pitch=clamp(player.pitch+0.05+Math.random()*0.02,-1.52,1.52);player.yaw+=rnd(-0.012,0.012);camPunch(3.2,rnd(-0.6,0.6),rnd(-1.2,1.2));shakeCam(0.32);
  vmImpulse(V3(0,0.25,1.3),V3(24+rnd(-2,2),rnd(-2,2),rnd(-3,3)));
  G.lastTrace={o:B.o.clone(),d:d.clone(),ev:[]};G.shotWalls=new Set();gunTrace(B.o,d,1.0,0);gunNeighbours(!inside);gunHudDraw(true);}
function gunBang(inside,muff){S.init();if(!S.ctx)return;const k=muff?0.3:1;/* v9.5: the bank's shot (crack, blast, a sub boom) under the old layers, into the room */S.play('gunshot',null,1.15*k,{wet:inside?1.5:0.7});
  S.noise({dur:0.05,gain:1.5*k,type:'highpass',f:muff?600:1300,att:0.001});S.noise({dur:0.38,gain:1.15*k,type:'lowpass',f:muff?900:3400,f1:240,att:0.001});S.tone({f:96,f1:30,dur:0.45,gain:1.3*k,att:0.001});
  if(inside){for(let i=0;i<5;i++)S.noise({dur:0.12,gain:0.55*k*Math.pow(0.62,i),type:'lowpass',f:2300-i*320,att:0.002,delay:0.016+i*0.021});}
  else{S.noise({dur:0.5,gain:0.38*k,type:'lowpass',f:900,f1:300,delay:0.34,att:0.02});S.noise({dur:0.7,gain:0.22*k,type:'lowpass',f:620,f1:200,delay:0.88,att:0.04});S.noise({dur:1.3,gain:0.13*k,type:'lowpass',f:420,f1:150,delay:1.7,att:0.08});}}
/* hearing: a low-pass + gain between the compressor and the speakers, and a ringing tone that skips them */
function gunEars(){const c=S.ctx;if(!c||GUN.ear)return;try{const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=20000;lp.Q.value=0.6;const g=c.createGain();g.gain.value=1;S.comp.disconnect();S.comp.connect(lp);lp.connect(g);g.connect(c.destination);
  const o=c.createOscillator();o.type='sine';o.frequency.value=6900;const o2=c.createOscillator();o2.type='sine';o2.frequency.value=7350;const og=c.createGain();og.gain.value=0;o.connect(og);o2.connect(og);og.connect(c.destination);o.start();o2.start();GUN.ear={lp,g,og};}catch(e){GUN.ear=null;}}
function gunEarCut(){const d=GUN.deaf;let cut=20000*Math.pow(280/20000,Math.pow(d,0.7));if(GUN.muffs)cut=Math.min(cut,1300);return cut;}
function gunEarsHit(){const G=GUN;gunEars();const was=G.deaf;G.deaf=Math.min(1,G.deaf+(G.muffs?0.05:0.8));G.ring=Math.min(1,G.ring+(G.muffs?0:0.85));G.deafTau=G.muffs?1.5:5+G.recent*0.45;
  if(!G.muffs&&!G.told.ring){G.told.ring=true;after(0.4,()=>HUD.msg(G.hasMuffs?'[EARS RINGING · M = EARMUFFS]':'[EARS RINGING]',2));}
  const E=G.ear;if(E){const t=S.ctx.currentTime;E.lp.frequency.cancelScheduledValues(t);E.lp.frequency.setValueAtTime(E.lp.frequency.value,t);E.lp.frequency.setTargetAtTime(gunEarCut(),t+0.035,0.015);E.g.gain.cancelScheduledValues(t);E.g.gain.setValueAtTime(E.g.gain.value,t);E.g.gain.setTargetAtTime((1-0.55*G.deaf)*(G.muffs?0.6:1),t+0.035,0.02);G.earT=0.15;}}
function gunEarsUpdate(dt){const G=GUN;G.deaf=Math.max(0,G.deaf-dt/G.deafTau);G.ring=Math.max(0,G.ring-dt/9);G.recent=Math.max(0,G.recent-dt/6);const E=G.ear;if(!E)return;G.earT-=dt;if(G.earT>0)return;G.earT=0.1;const t=S.ctx.currentTime;
  E.lp.frequency.setTargetAtTime(gunEarCut(),t,0.08);E.g.gain.setTargetAtTime((1-0.55*G.deaf)*(G.muffs?0.6:1),t,0.08);E.og.gain.setTargetAtTime(0.028*G.ring*G.ring,t,0.08);}

/* ---------- ballistics */
const GUN_WORLD=['drywall','stud','truss','trim','floor','slab','brick','brickwall','batt','tile','roofslab','env','pipe','wire','screw'];
function gunMatOf(h){const k=h.kind,e=h.ent;
  switch(k){case 'drywall':return e&&e.mat==='tile'?{c:0.14,cls:'tile'}:{c:0.05,cls:'gyp'};case 'stud':case 'truss':return{c:0.2,cls:'wood'};case 'trim':return{c:0.06,cls:'wood'};case 'batt':return{c:0.01,cls:'soft'};
    case 'brick':case 'brickwall':return{c:1.5,cls:'brick',hard:0.8};case 'tile':return{c:0.3,cls:'rooftile',hard:0.5};case 'floor':return e&&e.mat==='timber'?{c:0.35,cls:'wood',hard:0.3}:{c:9,cls:'conc',hard:1};
    case 'slab':case 'roofslab':return{c:9,cls:'conc',hard:1};case 'pipe':return{c:0.05,cls:'pipe'};case 'wire':case 'cord':case 'lcord':return{c:0.01,cls:'wire'};case 'screw':return{c:0.2,cls:'steel',hard:1};case 'tube':return{c:0.02,cls:'glass'};
    case 'env':return h.ground?{c:9,cls:h.road?'conc':'dirt',hard:h.road?1:0.6}:h.fence?{c:0.05,cls:'metal'}:{c:9,cls:'brick',hard:0.8};}
  if(!e)return{c:0.08,cls:'misc'};if(e.armor)return{c:9,cls:'steel',hard:1};if(VG.bottle&&e===VG.bottle.e)return{c:0.12,cls:'bottle'};const m=e.mat,mass=e.mass||1;
  if(m==='glass'||m==='ceramic'||m==='china'||m==='terra')return{c:0.04,cls:'glass'};if(m==='metal'||m==='copper')return{c:Math.min(0.5,0.08+mass*0.004),cls:'metal',hard:mass>40?0.4:0};
  if(m==='timber'||m==='chip'||m==='hollow')return{c:Math.min(0.45,0.06+mass*0.006),cls:'wood'};if(m==='foam'||m==='fabric'||m==='leaf'||m==='batt')return{c:Math.min(0.3,0.02+mass*0.004),cls:'soft'};
  if(m==='plastic'||m==='acrylic')return{c:0.04,cls:'plastic'};return{c:0.08,cls:'misc'};}
function gunEnv(o,D,L){/* things that aren't in the hit tree: the street's houses and fences (cannon), and the ground outside */let best=null;
  if(VILLA&&NS.body){const to=o.clone().addScaledVector(D,L);world.raycastAll(toC(o),toC(to),{skipBackfaces:true,checkCollisionResponse:false},r=>{if(r.body!==NS.body)return;const dd=r.distance;if(best&&dd>=best.distance)return;const he=r.shape&&r.shape.halfExtents;best={kind:'env',point:toT(r.hitPointWorld),normal:toT(r.hitNormalWorld),distance:dd,fence:!!(he&&Math.min(he.x,he.z)<0.06),ent:null,label:'the street'};});}
  if(D.y<-1e-3){const t=(-0.148-o.y)/D.y;if(t>0&&t<L&&(!best||t<best.distance)){const p=o.clone().addScaledVector(D,t);if(!vRoomAtWorld(p.x,p.z)){const road=VILLA&&NS.built&&p.z>vZ(NS.zK0)&&p.z<vZ(NS.zK1);best={kind:'env',ground:true,road,point:p,normal:V3(0,1,0),distance:t,ent:null,label:road?'road':'ground'};}}}
  return best;}
function gunTrace(o,D,E,depth){if(depth>3||E<=0.02)return;GUN.traces++;const tr=GUN.lastTrace;let L=150;const env=gunEnv(o,D,L);if(env)L=env.distance;
  /* entries: walk the ray forward, spending energy as it goes; a plasterboard face wakes its wall so the studs behind it are there to hit */const F=[];let t=0,e=E,stop=-1,ric=-1;
  for(let i=0;i<48&&t<L;i++){const h=castRay(L-t,{ray:{o:o.clone().addScaledVector(D,t),d:D},lcord:true,near:0.0004});if(!h)break;h.t=t+h.distance;if(h.t>L)break;if(h.kind==='drywall'&&h.ent&&h.ent.face&&h.ent.face.wall&&h.ent.face.wall.dormant)villaWake(h.ent.face.wall);
    const m=gunMatOf(h);h.m=m;const n=h.normal.clone();if(n.dot(D)>0)n.negate();h.n=n;const cosI=-D.dot(n);const k=F.length;F.push(h);
    if(m.hard&&cosI<0.25&&e>0.12&&Math.random()<0.85*m.hard+0.15){ric=k;break;}if(e<=m.c){stop=k;break;}e-=m.c;h.eOut=e;t=h.t+0.0004;if(i===47)stop=k;}
  let Lend=ric>=0?F[ric].t:stop>=0?F[stop].t:L;
  /* exits: walk the same stretch backwards; anything facing along the shot is a far side */const X=[];let s=0;const end=o.clone().addScaledVector(D,Lend);const Bk=D.clone().negate();
  for(let i=0;i<48&&s<Lend;i++){const h=castRay(Lend-s,{ray:{o:end.clone().addScaledVector(Bk,s),d:Bk},lcord:true,near:0.0004});if(!h)break;s+=h.distance;const tt=Lend-s;s+=0.0004;if(tt<0.001)break;h.t=tt;h.exit=true;h.m=gunMatOf(h);const n=h.normal.clone();if(n.dot(D)<0)n.negate();h.n=n;X.push(h);}
  /* the analytic brick skin is two planes: a shot that slips past a mortar gap on the inner one and meets a brick on the outer one has hit that brick */
  if(stop<0&&ric<0){const bx=X.find(h=>h.kind==='brick');if(bx&&!F.some(h=>h.kind==='brick')&&e<=bx.m.c){bx.exit=false;bx.n=bx.n.clone().negate();F.push(bx);stop=F.length-1;Lend=bx.t;for(let i=X.length-1;i>=0;i--)if(X[i]===bx||X[i].t>=Lend)X.splice(i,1);}}
  const last=ric>=0?ric:stop>=0?stop:F.length-1;const ev=F.slice(0,last+1).concat(X).sort((a,b)=>a.t-b.t);
  for(const h of ev){if(tr)tr.ev.push({t:+h.t.toFixed(3),kind:h.kind,cls:h.m.cls,exit:!!h.exit,stop:!h.exit&&F.indexOf(h)===stop,ric:!h.exit&&F.indexOf(h)===ric,label:h.ent?h.ent.label||h.ent.kind:h.label});
    if(h.exit){if(!h.ent||h.ent.alive)gunExit(h,D);continue;}const i=F.indexOf(h);if(i===ric){gunRicochet(h,D,i===0?E:F[i-1].eOut,depth);continue;}gunEnter(h,D,i===stop?'stop':'through');}
  if(stop<0&&ric<0&&env&&Lend>=L-1e-6){const m=gunMatOf(env);env.m=m;env.n=env.normal.clone();if(env.n.dot(D)>0)env.n.negate();const cosI=-D.dot(env.n);if(tr)tr.ev.push({t:+env.distance.toFixed(2),kind:'env',cls:m.cls,label:env.label});
    if(m.hard&&cosI<0.22&&Math.random()<0.75){gunRicochet(env,D,e,depth);return;}gunEnter(env,D,m.c>=e?'stop':'through');if(env.fence&&e>m.c){gunExit(Object.assign({},env,{n:D.clone(),point:env.point.clone().addScaledVector(D,0.02)}),D);gunTrace(env.point.clone().addScaledVector(D,0.05),D,e-m.c,depth+1);}}}
function gunRicochet(h,D,E,depth){const n=h.n||h.normal;const p=h.point;const r=D.clone().addScaledVector(n,-2*D.dot(n));r.x+=rnd(-0.06,0.06);r.y+=rnd(-0.04,0.06);r.z+=rnd(-0.06,0.06);r.addScaledVector(n,0.04+Math.random()*0.1).normalize();
  gunDecal(h,n,0.012,h.m.cls==='steel'?'metal':h.m.cls);if(h.m.cls==='steel'||h.m.cls==='brick'||h.m.cls==='conc'){spkEmit(p,r,6,{speed:6,life:0.25,light:false});}dust(p,3,0.4);
  S.tone({f:2600+Math.random()*900,f1:600+Math.random()*300,dur:0.5,type:'sine',gain:0.16,pos:p});S.noise({dur:0.04,gain:0.3,type:'highpass',f:2500,pos:p});if(h.ent&&h.ent.armor&&h.ent.onHit)h.ent.onHit(p,1);
  if(GUN.lastTrace)GUN.lastTrace.ric=(GUN.lastTrace.ric||0)+1;gunTrace(p.clone().addScaledVector(n,0.003),r,E*0.35,depth+1);}
function gunEnter(h,D,how){const p=h.point,e=h.ent,m=h.m,n=h.n;
  switch(m.cls){
    case 'gyp':case 'tile':{gunDecal(h,n,m.cls==='tile'?0.022:0.02,m.cls);dust(p,3,0.35);if(e&&e.drawable&&e.face){const f=e.face,uv=faceUV(f,p);e.drawable.blot(uv.u/f.L,uv.v/f.H,2,'22,20,18',0.9);}
      if(m.cls==='tile')S.tapTile(p);else S.noise({dur:0.05,gain:0.4,type:'bandpass',f:1500,q:1.2,pos:p});gunBondWall(e);if(e){e.hp-=0.12;if(e.hp<=0&&e.attached)damage(e,1.3,p,D,'bullet');}break;}
    case 'wood':{gunDecal(h,n,0.012,'wood');P.emit(p,{count:5,color:[0.82,0.66,0.4],cvar:0.1,size:0.012,svar:0.006,life:0.9,vel:n,speed:1.5,spread:1.2,grav:9,drag:0.4});S.noise({dur:0.06,gain:0.45,type:'bandpass',f:700,q:1.5,pos:p});
      if(e&&!['stud','truss','trim','floor'].includes(h.kind))damageProp(e,how==='stop'?1.8:1.4,p,D,h);break;}
    case 'brick':{/* a strike takes the face off a brick; a second one punches it out (the hammer's rule) */const br=h.brick;if(h.wall&&h.instanceId!==undefined&&br&&!br.gone){chipBrick(h.wall,h.instanceId,p,D);GUN.chips=(GUN.chips||0)+1;}if(!(br&&br.gone))gunDecal(h,n,0.03,'brick');P.emit(p,{count:12,color:[0.62,0.36,0.28],cvar:0.08,size:0.012,svar:0.006,life:1,vel:n,speed:2.5,spread:1.3,grav:9.8,drag:0.4});dust(p,4,0.5);S.noise({dur:0.08,gain:0.6,type:'bandpass',f:1200,q:1,pos:p});S.thud(p,1.6);if(h.kind==='env'||!h.wall)break;break;}
    case 'conc':case 'dirt':{gunDecal(h,n,m.cls==='dirt'?0.04:0.018,m.cls);P.emit(p,{count:10,color:m.cls==='dirt'?[0.35,0.28,0.2]:[0.62,0.6,0.56],cvar:0.06,size:0.012,svar:0.006,life:0.9,vel:n,speed:2.2,spread:1.2,grav:9.8,drag:0.4});dust(p,3,0.45);S.thud(p,1.4);if(m.cls==='conc'&&h.kind!=='env')bondHit('bullet strikes (slab & floor)',45);break;}
    case 'rooftile':{if(typeof ROOF!=='undefined'&&ROOF.tileList&&h.instanceId!==undefined)chipTile(h.instanceId,p);S.shatter(p,false);break;}
    case 'pipe':puncturePipe(e,p);break;
    case 'wire':if(h.kind==='lcord')lcCut(h.lc,h.seg,p);else if(h.kind==='cord')cutCord(e.cord,e,p);else cutWire(e,p);break;
    case 'glass':if(h.kind==='tube')breakTube(e,p);else damageProp(e,3,p,D,h);break;
    case 'steel':{gunDecal(h,n,0.011,'metal');spkEmit(p,n,12,{speed:5,life:0.3,light:false});sparks(p,6,[1,0.8,0.5],n);S.tone({f:1800,f1:1500,dur:0.25,type:'triangle',gain:0.2,pos:p});onSpark(p,'ricochet');if(e&&e.onHit)e.onHit(p,1.2);if(e&&e.armor)bondHit('gun safe (bullet strikes)',80,true);break;}
    case 'bottle':{const Bt=VG.bottle;if(Bt&&!Bt.holed&&e.alive){Bt.holed=true;Bt.hole=e.mesh.worldToLocal(p.clone());S.noise({dur:1.5,gain:0.4,type:'highpass',f:2000,pos:p});HUD.msg('[YOU HAVE SHOT THE GAS BOTTLE · HSSSSSS]',2);}gunDecal(h,n,0.011,'metal');S.tone({f:900,f1:700,dur:0.3,type:'triangle',gain:0.2,pos:p});break;}
    case 'soft':{P.emit(p,{count:8,color:[0.6,0.55,0.48],size:0.02,life:1.2,spread:0.8,grav:2,drag:1.5,kind:1});S.thud(p,0.4);if(e&&h.kind!=='batt')damageProp(e,1.0,p,D,h);break;}
    default:{if(e)damageProp(e,2.6,p,D,h);if(e&&e.alive)gunDecal(h,n,0.011,m.cls);}}}
function gunBondWall(e){/* $40 a wall per shot, however many sheets it went through */const w=e&&e.face&&e.face.wall;const k=w||e;if(!k||(GUN.shotWalls&&GUN.shotWalls.has(k)))return;if(GUN.shotWalls)GUN.shotWalls.add(k);bondHit('bullet holes (patch & paint)',40);}
function gunExit(h,D){const p=h.point,m=h.m,n=h.n;
  switch(m.cls){case 'gyp':case 'tile':gunDecal(h,n,0.045,m.cls);P.emit(p,{count:10,color:[0.92,0.9,0.86],cvar:0.05,size:0.01,svar:0.006,life:1.1,vel:D,speed:2.2,spread:0.7,grav:9.8,drag:0.5});dust(p,4,0.5);gunBondWall(h.ent);break;
    case 'wood':gunDecal(h,n,0.022,'wood');P.emit(p,{count:9,color:[0.82,0.66,0.4],cvar:0.1,size:0.014,svar:0.008,life:1,vel:D,speed:2.5,spread:0.9,grav:9,drag:0.4});break;
    case 'brick':gunDecal(h,n,0.05,'brick');P.emit(p,{count:16,color:[0.62,0.36,0.28],cvar:0.08,size:0.016,svar:0.008,life:1.1,vel:D,speed:3,spread:1,grav:9.8,drag:0.4});break;
    case 'metal':case 'plastic':case 'misc':if(h.ent&&h.ent.alive)gunDecal(h,n,0.016,m.cls);break;}}
/* ---------- holes: one instanced decal mesh for the house, child cards on things that move */
const GDEC={N:600,i:0,list:[],mesh:null,tints:{},t:0};
const GDEC_TINT={gyp:0xf2eee6,tile:0xe8e4dc,wood:0xc09a68,brick:0xa06a52,conc:0x9e9c96,dirt:0x5a4630,metal:0xc8ccd0,plastic:0x48484c,misc:0x8a8478,soft:0x8a7a68};
function gdecInit(){if(GDEC.mesh)return;const c=mkCanvas(64,64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(0.2,'rgba(5,5,5,1)');g.addColorStop(0.27,'rgba(70,70,70,0.95)');g.addColorStop(0.42,'rgba(235,235,235,0.75)');g.addColorStop(0.75,'rgba(225,225,225,0.25)');g.addColorStop(1,'rgba(220,220,220,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  x.strokeStyle='rgba(20,20,20,0.7)';x.lineWidth=1.2;for(let i=0;i<6;i++){const a=Math.random()*Math.PI*2,r=9+Math.random()*12;x.beginPath();x.moveTo(32+Math.cos(a)*7,32+Math.sin(a)*7);x.lineTo(32+Math.cos(a+rnd(-0.3,0.3))*r,32+Math.sin(a+rnd(-0.3,0.3))*r);x.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;GDEC.mat=new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:0.95});
  GDEC.geo=new THREE.PlaneGeometry(1,1);GDEC.mesh=new THREE.InstancedMesh(GDEC.geo,GDEC.mat,GDEC.N);GDEC.mesh.frustumCulled=false;GDEC.mesh.raycast=()=>{};GDEC.mesh.renderOrder=2;GDEC.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  _gnm.makeScale(0,0,0);const w=new THREE.Color(1,1,1);for(let i=0;i<GDEC.N;i++){GDEC.mesh.setMatrixAt(i,_gnm);GDEC.mesh.setColorAt(i,w);}GDEC.mesh.userData.noProxy=true;scene.add(GDEC.mesh);}
function gunDecal(h,n,size,cls){const e=h.ent;if(e&&!GUN_WORLD.includes(h.kind)&&e.mesh&&e.alive){gdecProp(e,h.point,n,size,cls);return;}gdecInit();const q=new THREE.Quaternion().setFromUnitVectors(V3(0,0,1),n);q.premultiply(new THREE.Quaternion().setFromAxisAngle(n,Math.random()*6.283));
  const i=GDEC.i;GDEC.i=(GDEC.i+1)%GDEC.N;_gnm.compose(h.point.clone().addScaledVector(n,0.0012),q,V3(size,size,size));GDEC.mesh.setMatrixAt(i,_gnm);GDEC.mesh.setColorAt(i,new THREE.Color(GDEC_TINT[cls]||0x888888));GDEC.mesh.instanceMatrix.needsUpdate=true;if(GDEC.mesh.instanceColor)GDEC.mesh.instanceColor.needsUpdate=true;GDEC.list[i]={ent:e,kind:h.kind};GDEC.count=Math.min(GDEC.N,(GDEC.count||0)+1);}
function gdecProp(e,p,n,size,cls){gdecInit();if(e.batched)unbatchEnt(e);let mat=GDEC.tints[cls];if(!mat){mat=GDEC.mat.clone();mat.color.setHex(GDEC_TINT[cls]||0x888888);GDEC.tints[cls]=mat;}const m=new THREE.Mesh(GDEC.geo,mat);m.raycast=()=>{};m.castShadow=false;m.renderOrder=2;
  e.mesh.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(e.mesh.matrixWorld).invert();m.position.copy(p.clone().addScaledVector(n,0.0015).applyMatrix4(inv));const wq=new THREE.Quaternion().setFromUnitVectors(V3(0,0,1),n);m.quaternion.copy(e.mesh.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(wq));
  const ws=e.mesh.getWorldScale(V3());m.scale.set(size/ws.x,size/ws.y,size/ws.z);e.mesh.add(m);(e._gd=e._gd||[]).push(m);GDEC.props=(GDEC.props||0)+1;if(e._gd.length>10){const o=e._gd.shift();if(o.parent)o.parent.remove(o);}}
function gdecSweep(){if(!GDEC.mesh)return;let dirty=false;_gnm.makeScale(0,0,0);for(let i=0;i<GDEC.list.length;i++){const d=GDEC.list[i];if(!d||!d.ent)continue;const e=d.ent;if(!e.alive||e.dynamic||(e.kind==='drywall'&&!e.attached)){GDEC.mesh.setMatrixAt(i,_gnm);GDEC.list[i]=null;dirty=true;}}if(dirty)GDEC.mesh.instanceMatrix.needsUpdate=true;}

/* ---------- neighbours */
function gunNeighbours(outside){if(!VILLA||!NS.built)return;const G=GUN;if(outside||G.shots>=2){if(now-G.barkedAt>30){G.barkedAt=now;const amb=typeof VIBE!=='undefined'?Math.max(0.15,VIBE.amb||0.5):0.5;for(let i=0;i<2;i++){S.tone({f:430,f1:260,dur:0.16,type:'sawtooth',gain:0.24*amb,delay:0.6+i*0.34});S.noise({dur:0.14,gain:0.12*amb,type:'bandpass',f:700,delay:0.6+i*0.34});}}
    after(1.5,()=>{NS.dogQuiet=Math.max(NS.dogQuiet||0,600);});}
  if((outside||G.shots>=3)&&!(G.wokeT>0))G.porchT=4;G.wokeT=Math.max(G.wokeT,180);}

/* ---------- per frame */
function updateGun(dt){const G=GUN;if(!VILLA)return;
  if(G.flashT>0){G.flashT-=dt;if(G.flashT<=0&&G.flareOn){G.flareOn=false;if(VL.flare&&!(VG.flashT>0)&&!(VG.bottle&&VG.bottle.jet)){VL.flare.intensity=0;VL.flare.color.setHex(0xff4a28);}}}
  if(G.hasMuffs&&!SEAT.active&&locked){if(keys.KeyM&&!G.mWas){G.muffs=!G.muffs;S.thup(player.pos,0.4);HUD.msg(G.muffs?'[EARMUFFS ON]':'[EARMUFFS OFF]',0.9);G.earT=0;gunHudDraw(true);}G.mWas=!!keys.KeyM;}
  gunEarsUpdate(dt);
  if(G.porchT>0){G.porchT-=dt;if(G.porchT<=0&&NS.porch&&!NS.porch.on){NS.porch.on=true;nLampSet(NS.porch,1);}}if(G.wokeT>0)G.wokeT-=dt;
  GDEC.t-=dt;if(GDEC.t<=0){GDEC.t=0.3;gdecSweep();}
  /* the gun itself */const R=G.vm;const isOut=tool===5&&G.have;G.adsK=lerp(G.adsK,isOut&&G.ads?1:0,1-Math.exp(-dt*(G.ads?10:13)));G.openK=clamp(G.openK+(G.open?dt/0.22:-dt/0.18),0,1);
  const hamT=G.cocked?1:(G.pull>0?clamp(G.pull/0.92,0,1):0);G.hamK=hamT>G.hamK?Math.min(hamT,G.hamK+dt/(G.cocked?0.12:0.05)):Math.max(hamT,G.hamK-dt/(G.fireHold?0.008:0.15));
  const trigT=G.cocked?0.25:Math.max(G.pull,G.fireHold?1:0);G.trigK=lerp(G.trigK,trigT,1-Math.exp(-dt*30));
  const cylT=(G.idx+(G.pulling&&!G.pullC?clamp(G.pull/0.75,0,1):0)+(G.cocked?0:0))*Math.PI/3;G.cylA=lerp(G.cylA,cylT,1-Math.exp(-dt*28));
  /* breathing sway: bigger at the hip, settles in the sights */const A=0.0011+0.0035*(1-G.adsK);G.sway.y=Math.sin(now*0.83)*A+Math.sin(now*1.91)*A*0.35;G.sway.p=Math.sin(now*1.27+1)*A*0.8+Math.sin(now*2.3)*A*0.25;
  if(R){if(G.chDirty){G.chDirty=false;gunRounds(R);}gunPose(R,{ham:G.hamK,trig:G.trigK,open:G.openK,cyl:G.cylA});if(R.flash){R.flash.visible=G.flashT>0;if(R.flash.visible){R.flash.rotation.z=Math.random()*6.28;R.flash.scale.setScalar(0.8+Math.random()*0.5);}}
    for(const m of GUN.mats)if(m.envMap)m.envMapIntensity=0.15+0.6*clamp((VM.hemi?VM.hemi.intensity:0.9)/0.9,0,1.5);}
  /* sights replace the crosshair */const cr=HUD.el.cross;if(cr&&cr.style){const hide=isOut&&G.adsK>0.55;if(hide&&cr.style.display!=='none'){cr.style.display='none';G.crossHid=true;}else if(!hide&&G.crossHid){G.crossHid=false;if(tool!==3)cr.style.display='';}}
  G.hudT-=dt;if(G.hudT<=0){G.hudT=0.15;gunHudDraw(false);}}
function gunVMTargets(T,R,AP,AR){/* hip ↔ sights; tilt the gun over to look into the cylinder when it's out */const G=GUN;T.addScaledVector(G.adsOff,G.adsK);R.x+=-0.035*G.pull*(1-0.6*G.adsK);
  if(G.openK>0){const k=G.openK*G.openK*(3-2*G.openK);T.x+=-0.06*k;T.y+=0.07*k;T.z+=0.1*k;R.x+=0.55*k;R.y+=0.25*k;R.z+=0.85*k;}
  AR.y+=G.sway.y;AR.x+=G.sway.p;}
function gunFov(){return 78-20*GUN.adsK;}
/* ---------- HUD */
function gunHudInit(){const hud=document.getElementById('hud');if(!hud||GUN.hud)return;const el=document.createElement('div');el.id='gunhud';el.style.cssText='position:absolute;right:18px;bottom:52px;font-size:12px;letter-spacing:2px;padding:6px 10px;border:1px solid #3a3a30;background:rgba(15,16,18,.85);color:#e8e0c8;display:none;white-space:nowrap';hud.appendChild(el);GUN.hud=el;}
function gunHudDraw(force){const el=GUN.hud;if(!el||!el.style)return;const show=(tool===5&&GUN.have)||GUN.muffs;if(!show){if(el.style.display!=='none')el.style.display='none';return;}el.style.display='block';
  let s='';if(tool===5&&GUN.have){const ord=[];for(let k=1;k<=6;k++)ord.push(GUN.ch[(GUN.idx+(GUN.cocked||GUN.open?0:k)+(GUN.cocked||GUN.open?k-1:0))%6]);s=ord.map(c=>c==='L'?'●':c==='S'?'◌':'○').join(' ')+`  ·  POCKET ${GUN.ammo}  ·  ${GUN.open?'CYLINDER OUT':GUN.cocked?'COCKED':'DA'}`;}
  if(GUN.muffs)s+=(s?'  ·  ':'')+'MUFFS';if(el.textContent!==s)el.textContent=s;}
