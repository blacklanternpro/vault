
/* ============================================================ v8.1 — p9x: Jake's fix list
   - SPK: hot metal sparks. Steel under the saw throws a shower of white-hot streaks that cool to orange and red, bounce
     off the floor and light the cut; brick and tile throw grit and dust instead, so the two read differently.
   - LC: light cords. Toaster, kettle, microwave, fridge, washer, dryer, lamps, clock radio, amp and the beer fridge get a
     real flex to a power point. No physics bodies: a verlet rope that sleeps when nothing moves, one instanced draw for
     all of them. Carry an appliance away with it plugged in and the cord comes taut, drags on you, then the plug pops
     out of the wall (or the flex snaps at the strain relief: live, that's an arc and the RCD). Grab the cord or E on it
     to unplug first; E on a loose cord near its power point plugs it back in. Unplugged appliances don't run.
   - v81Kin: every kitchen/bathroom cupboard door is a hinged kin door (E / LMB with hands) and every drawer slides.
   Built after p9o, before p6; villa81() runs at the end of buildVilla, updateV81 from updateAppliances. */

/* ---------- SPK: spark streaks */
const SPK={N:480,head:0,live:0,lt:0};
function spkInit(){if(SPK.mesh)return;const N=SPK.N;SPK.p=new Float32Array(N*3);SPK.v=new Float32Array(N*3);SPK.l=new Float32Array(N);SPK.m=new Float32Array(N);SPK.b=new Uint8Array(N);
  const g=new THREE.BufferGeometry();SPK.pa=new Float32Array(N*6);SPK.ca=new Float32Array(N*6);g.setAttribute('position',new THREE.BufferAttribute(SPK.pa,3));g.setAttribute('color',new THREE.BufferAttribute(SPK.ca,3));
  const m=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});SPK.mesh=new THREE.LineSegments(g,m);SPK.mesh.frustumCulled=false;SPK.mesh.visible=false;SPK.mesh.renderOrder=3;scene.add(SPK.mesh);
  /* the hot heads: a few bright points so the shower reads at a distance */SPK.glow=new Particles(scene,320);SPK.glow.mat.blending=THREE.AdditiveBlending;SPK.glow.points.visible=false;SPK.glow.points.renderOrder=3;}
/* p = contact, away = direction the shower leaves in (off the blade), n = count, o.speed / o.life / o.cool */
function spkEmit(p,away,n,o={}){spkInit();const sp=o.speed||5.5,lf=o.life||0.55;for(let k=0;k<n;k++){const i=SPK.head;SPK.head=(SPK.head+1)%SPK.N;const i3=i*3;SPK.p[i3]=p.x;SPK.p[i3+1]=p.y;SPK.p[i3+2]=p.z;
    const d=V3(away.x+(Math.random()-0.5)*1.1,away.y+(Math.random()-0.5)*1.1,away.z+(Math.random()-0.5)*1.1).normalize();const s=sp*(0.45+Math.random()*0.9);SPK.v[i3]=d.x*s;SPK.v[i3+1]=d.y*s;SPK.v[i3+2]=d.z*s;const L=lf*(0.4+Math.random()*1.0);SPK.l[i]=L;SPK.m[i]=L;SPK.b[i]=0;}
  SPK.mesh.visible=true;SPK.live=Math.max(SPK.live,lf*1.5);
  if(o.glow!==false)SPK.glow.emit(p,{count:Math.max(1,n>>2),color:[1,0.85,0.55],cvar:0.05,size:0.02,svar:0.01,life:0.12,lvar:0.05,spread:0.25,grav:0,drag:2,kind:2}),SPK.glow.points.visible=true;
  /* the cut lights up: the villa's spare flare light (never toggled, so nothing recompiles) */if(o.light!==false&&VILLA&&VL.flare&&!(VG.flashT>0)&&!(VG.bottle&&VG.bottle.jet)){VL.flare.position.copy(p).addScaledVector(away,0.15);VL.flare.color.setHex(0xffb060);VL.flare.intensity=Math.max(VL.flare.intensity,1.6+Math.random()*2.6);SPK.lt=0.08;}}
function spkUpdate(dt){if(SPK.lt>0){SPK.lt-=dt;if(SPK.lt<=0&&VILLA&&VL.flare&&!(VG.flashT>0)&&!(VG.bottle&&VG.bottle.jet)){VL.flare.intensity=0;VL.flare.color.setHex(0xff4a28);}}
  if(!SPK.mesh||!SPK.mesh.visible)return;SPK.glow.update(dt);SPK.live-=dt;const N=SPK.N,P_=SPK.p,Vv=SPK.v,pa=SPK.pa,ca=SPK.ca;let any=false;
  for(let i=0;i<N;i++){const i3=i*3,i6=i*6;if(SPK.l[i]<=0){if(pa[i6+1]!==-999){pa[i6+1]=pa[i6+4]=-999;}continue;}any=true;SPK.l[i]-=dt;
    Vv[i3+1]-=9.8*dt;const dr=1-0.5*dt;Vv[i3]*=dr;Vv[i3+1]*=dr;Vv[i3+2]*=dr;P_[i3]+=Vv[i3]*dt;P_[i3+1]+=Vv[i3+1]*dt;P_[i3+2]+=Vv[i3+2]*dt;
    const fy=pFloorY(P_[i3],P_[i3+1],P_[i3+2]);if(P_[i3+1]<fy+0.003){P_[i3+1]=fy+0.003;if(SPK.b[i]<2&&Vv[i3+1]<-0.5){Vv[i3+1]*=-0.32;Vv[i3]*=0.55;Vv[i3+2]*=0.55;SPK.b[i]++;}else{Vv[i3+1]=0;Vv[i3]*=0.5;Vv[i3+2]*=0.5;}}
    const h=clamp(SPK.l[i]/SPK.m[i],0,1);/* heat: white-yellow → orange → dull red */const r=1,g=h>0.6?0.9:0.25+h*1.0,b=h>0.75?0.6:h*0.25;const fade=h<0.15?h/0.15:1;
    const tl=0.022;pa[i6]=P_[i3];pa[i6+1]=P_[i3+1];pa[i6+2]=P_[i3+2];pa[i6+3]=P_[i3]-Vv[i3]*tl;pa[i6+4]=P_[i3+1]-Vv[i3+1]*tl;pa[i6+5]=P_[i3+2]-Vv[i3+2]*tl;
    ca[i6]=r*fade;ca[i6+1]=g*fade;ca[i6+2]=b*fade;ca[i6+3]=r*fade*0.25;ca[i6+4]=g*fade*0.15;ca[i6+5]=b*fade*0.1;}
  const G_=SPK.mesh.geometry;G_.attributes.position.needsUpdate=true;G_.attributes.color.needsUpdate=true;if(!any&&SPK.live<=0){SPK.mesh.visible=false;SPK.glow.points.visible=false;}}
/* the saw: what it throws depends on what it's biting */
function sawSpray(p,dir,kind,dt){const away=dir.clone().negate().multiplyScalar(0.55).add(V3(0,-0.55,0));const r=camRight();away.addScaledVector(r,(Math.random()-0.5)*0.6).normalize();
  if(kind==='metal'){spkEmit(p,away,Math.max(2,Math.round(dt*260)),{speed:6,life:0.6});}
  else if(kind==='masonry'){/* grit, dust, the odd dull spark */P.emit(p,{count:3,color:[0.62,0.5,0.42],cvar:0.08,size:0.012,svar:0.004,life:0.7,vel:away,speed:2.2,spread:1.2,grav:9.8,drag:0.4});dust(p,2,0.5);if(Math.random()<dt*6)spkEmit(p,away,1,{speed:3,life:0.25,glow:false,light:false});}
  else if(kind==='tile'){P.emit(p,{count:3,color:[0.86,0.84,0.8],cvar:0.05,size:0.01,life:0.6,vel:away,speed:2,spread:1.2,grav:9.8,drag:0.4});dust(p,1,0.4);if(Math.random()<dt*4)spkEmit(p,away,1,{speed:2.5,life:0.2,glow:false,light:false});}}

/* ---------- LC: light cords */
const LC={list:[],segs:[],im:null,pim:null,cap:460,pcap:24,on:false};
const _lq=new THREE.Quaternion(),_lm=new THREE.Matrix4(),_lv=new THREE.Vector3(),_ls=new THREE.Vector3(),_ly=new THREE.Vector3(0,1,0),_lz=new THREE.Vector3(0,0,1);
function lcInit(){if(LC.im)return;LC.im=new THREE.InstancedMesh(cordGeo,cordMat,LC.cap);LC.im.frustumCulled=false;LC.im.castShadow=false;LC.im.receiveShadow=true;LC.im.userData.lcords=true;LC.im.count=0;hitRoot.add(LC.im);
  LC.pim=new THREE.InstancedMesh(new THREE.BoxGeometry(0.034,0.044,0.024),plugMat,LC.pcap);LC.pim.frustumCulled=false;LC.pim.castShadow=false;LC.pim.count=0;scene.add(LC.pim);}
/* the nearest wall face behind a thing, in its own room */
function lcFaceFor(P){const r=vRoomAtWorld(P.x,P.z);let best=null,bd=1.6;for(const f of FACES){if(!f.room||!f.drawable||!f.wall||f.wall.kind==='ceiling')continue;if(r&&f.room.id!==r.id)continue;const uv=faceUV(f,P);if(uv.u<0.15||uv.u>f.L-0.15)continue;const d=-uv.z;if(d<0.02||d>bd)continue;bd=d;best={f,u:uv.u,d};}return best;}
function lcChunkAt(f,u,v){return f.chunks.find(c=>c.alive&&c.attached&&pip(c.quad,u,v));}
/* a socket for it: an existing power point close by, or a new one on the wall behind it */
function lcSocket(owner,h){const P=owner.mesh.getWorldPosition(V3());const F=lcFaceFor(P);if(!F)return null;const f=F.f;const gpos=ents.filter(e=>e.alive&&e.label==='double power point');
  for(const tryU of[0,0.3,-0.3,0.6,-0.6,0.9,-0.9]){const u=clamp(F.u+tryU,0.12,f.L-0.12);if(!lcChunkAt(f,u,h)||!lcChunkAt(f,u-0.08,h)||!lcChunkAt(f,u+0.08,h))continue;const at=facePoint(f,u,h,-0.006);
    const near=gpos.find(g=>g.mesh.getWorldPosition(V3()).distanceTo(at)<0.6);let sp;if(near){sp=near.mesh.getWorldPosition(V3());}else{veGPO(f,u,h);sp=at;}const sn=f.depthZ.clone().negate();return{socket:sp.clone().addScaledVector(sn,0.016).addScaledVector(f.right,0.035),sn,f};}
  return null;}
/* o: {label, h (socket height), len, isOn(), off(), anchorY} */
function lcAdd(owner,o={}){if(!owner||!owner.alive||!owner.mesh)return null;lcInit();owner.mesh.updateMatrixWorld(true);const S_=lcSocket(owner,o.h||0.3);if(!S_)return null;
  const bb=new THREE.Box3().setFromObject(owner.mesh);const head=V3(clamp(S_.socket.x,bb.min.x+0.02,bb.max.x-0.02),bb.min.y+(o.anchorY!==undefined?o.anchorY:0.06),clamp(S_.socket.z,bb.min.z+0.02,bb.max.z-0.02));
  const local=owner.mesh.worldToLocal(head.clone());const dist=head.distanceTo(S_.socket);const len=o.len||clamp(dist*1.25+0.35,0.9,1.9);const N=Math.min(26,Math.max(8,Math.ceil(len/0.075)));
  const c={owner,local,socket:S_.socket.clone(),sn:S_.sn.clone(),label:o.label||((owner.label||'appliance').split(' (')[0]+' cord'),len,N,segL:len/N,plugged:true,cut:-1,awake:3,str:0,isOn:o.isOn||(()=>false),off:o.off||(()=>{}),last:head.clone(),sup:new Float32Array(N+1),supT:0,i0:LC.segs.length,pi:LC.list.length};
  c.x=new Float32Array((N+1)*3);c.px=new Float32Array((N+1)*3);const sag=Math.max(0.05,(len-dist)*0.5);for(let i=0;i<=N;i++){const t=i/N;const q=head.clone().lerp(S_.socket,t);q.y-=Math.sin(t*Math.PI)*sag;c.x.set([q.x,q.y,q.z],i*3);c.px.set([q.x,q.y,q.z],i*3);}
  for(let i=0;i<N;i++)LC.segs.push({c,i});LC.im.count=LC.segs.length;LC.pim.count=LC.list.length+1;
  c.pseudo={alive:true,kind:'lcord',label:c.label,joints:[],mat:'plastic',lc:c,useLabel:()=>c.cut>=0?null:(c.plugged?'UNPLUG · '+c.label.toUpperCase():(lcReach(c)?'PLUG IN · '+c.label.toUpperCase():'TOO FAR FROM THE POWER POINT')),use:()=>lcToggle(c)};
  owner.lcord=c;/* unplugged appliances don't start */const u0=owner.use;if(u0)owner.use=(h)=>{if(!lcOK(c)){HUD.msg(c.cut>=0?'[THE CORD IS CUT]':'[NOT PLUGGED IN]',1);S.click(owner.mesh.getWorldPosition(V3()),500);return;}return u0(h);};
  LC.list.push(c);LC.on=true;for(let k=0;k<200;k++)lcStep(c,1/60,k%8===0);lcDraw(c);c.awake=0;return c;}
function lcOK(c){return !!c&&c.plugged&&c.cut<0;}
function lcHead(c){c.owner.mesh.updateMatrixWorld(true);return c.owner.mesh.localToWorld(_lv.copy(c.local)).clone();}
function lcReach(c){return c.owner.alive&&lcHead(c).distanceTo(c.socket)<c.len*0.97;}
function lcSupport(x,y,z){rayRes.reset();world.raycastClosest(new CANNON.Vec3(x,y+0.1,z),new CANNON.Vec3(x,y-0.7,z),{collisionFilterMask:1|16,skipBackfaces:true},rayRes);const f=pFloorY(x,y,z);return rayRes.hasHit?Math.max(f,rayRes.hitPointWorld.y):f;}
function lcStep(c,dt,sup){const N=c.N,x=c.x,px=c.px;const H=c.owner.alive&&c.owner.mesh?lcHead(c):null;const g=-9.8*dt*dt;
  if(sup){for(let i=0;i<=N;i++)c.sup[i]=lcSupport(x[i*3],x[i*3+1],x[i*3+2])+0.0045;}
  for(let i=0;i<=N;i++){const i3=i*3;if(i===0&&H)continue;if(i===N&&c.plugged)continue;if(c.cut>=0&&i===N&&!c.plugged){}const vx=(x[i3]-px[i3])*0.985,vy=(x[i3+1]-px[i3+1])*0.985,vz=(x[i3+2]-px[i3+2])*0.985;px[i3]=x[i3];px[i3+1]=x[i3+1];px[i3+2]=x[i3+2];x[i3]+=vx;x[i3+1]+=vy+g;x[i3+2]+=vz;}
  if(H){x[0]=H.x;x[1]=H.y;x[2]=H.z;}if(c.plugged){x[N*3]=c.socket.x;x[N*3+1]=c.socket.y;x[N*3+2]=c.socket.z;}
  const pin=i=>(i===0&&H&&!(c.cut===-2))||(i===N&&c.plugged);
  for(let it=0;it<10;it++){for(let i=0;i<N;i++){if(c.cut===i)continue;const a=i*3,b=a+3;const dx=x[b]-x[a],dy=x[b+1]-x[a+1],dz=x[b+2]-x[a+2];const L=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-6;const df=(L-c.segL)/L;const pa=pin(i),pb=pin(i+1);if(pa&&pb)continue;const wa=pa?0:(pb?1:0.5),wb=pa?1:(pb?0:0.5);x[a]+=dx*df*wa;x[a+1]+=dy*df*wa;x[a+2]+=dz*df*wa;x[b]-=dx*df*wb;x[b+1]-=dy*df*wb;x[b+2]-=dz*df*wb;}
    for(let i=0;i<=N;i++){if(pin(i))continue;const i3=i*3;if(x[i3+1]<c.sup[i]){x[i3+1]=c.sup[i];px[i3]=lerp(px[i3],x[i3],0.4);px[i3+2]=lerp(px[i3+2],x[i3+2],0.4);}}}}
function lcDraw(c){const N=c.N,x=c.x;for(let i=0;i<N;i++){const k=c.i0+i;const a=i*3,b=a+3;if(c.cut===i){_lm.makeScale(0,0,0);LC.im.setMatrixAt(k,_lm);continue;}_lv.set(x[b]-x[a],x[b+1]-x[a+1],x[b+2]-x[a+2]);const L=_lv.length();if(L<1e-5){_lm.makeScale(0,0,0);LC.im.setMatrixAt(k,_lm);continue;}_lq.setFromUnitVectors(_ly,_lv.multiplyScalar(1/L));_ls.set(1,L,1);_lm.compose(_lv.set((x[a]+x[b])/2,(x[a+1]+x[b+1])/2,(x[a+2]+x[b+2])/2),_lq,_ls);LC.im.setMatrixAt(k,_lm);}
  LC.im.instanceMatrix.needsUpdate=true;const e3=N*3;if(c.plugged)_lq.setFromUnitVectors(_lz,c.sn);else{_lv.set(x[e3]-x[e3-3],x[e3+1]-x[e3-2],x[e3+2]-x[e3-1]);if(_lv.lengthSq()>1e-8)_lq.setFromUnitVectors(_lz,_lv.normalize().negate());}_ls.set(1,1,1);_lm.compose(_lv.set(x[e3],x[e3+1],x[e3+2]),_lq,_ls);LC.pim.setMatrixAt(c.pi,_lm);LC.pim.instanceMatrix.needsUpdate=true;LC.bsT=0;}
/* out of the wall, or the flex gives at the appliance */
function lcPop(c,why,yank){if(!c.plugged)return;const live=power&&c.isOn();const p=c.socket.clone();c.plugged=false;c.awake=2.5;c.str=0;const e3=c.N*3;const H=lcHead(c);const d=H.clone().sub(p).normalize();c.px[e3]=p.x-d.x*(yank?0.06:0.03);c.px[e3+1]=p.y-d.y*0.04-0.01;c.px[e3+2]=p.z-d.z*(yank?0.06:0.03);
  S.snap(p);S.click(p,1500);if(live){S.zap(p);sparks(p,18,[0.6,0.8,1]);onSpark(p);}else sparks(p,3,[1,0.8,0.5]);c.off();HUD.msg(why||'[PLUG POPPED OUT OF THE WALL]',1.4);}
function lcSnap(c,p,why){if(c.cut>=0)return;const live=power&&c.plugged;c.cut=Math.max(0,Math.min(c.N-1,Math.round(c.N*0.08)));c.awake=2.5;c.str=0;p=p||lcHead(c);
  if(live){S.arc(p);sparks(p,30,[0.5,0.7,1]);sparks(p,14,[1,0.6,0.2]);onSpark(p);shakeCam(0.3);tripBreaker('power');HUD.msg(why||'[FLEX TORN OUT OF THE '+c.owner.label.split(' (')[0].toUpperCase()+' · RCD TRIPPED]',2.2);}else{S.snap(p);HUD.msg(why||'[FLEX TORN OUT AT THE STRAIN RELIEF]',1.4);}c.off();}
function lcCut(c,seg,p){if(c.cut>=0)return;const live=power&&c.plugged;c.cut=clamp(seg,0,c.N-1);c.awake=2.5;if(live){S.arc(p);sparks(p,40,[0.5,0.7,1]);sparks(p,20,[1,0.6,0.2]);onSpark(p);shakeCam(0.4);tripBreaker('power');HUD.msg('[LIVE APPLIANCE FLEX CUT - RCD TRIPPED]',2.4);}else{S.snap(p);HUD.msg('[POWER CORD CUT]',1.2);}c.off();}
function lcToggle(c){if(c.cut>=0)return;if(c.plugged){lcPop(c,'[UNPLUGGED]');return;}if(!lcReach(c)){HUD.msg('[TOO FAR FROM THE POWER POINT]',1);return;}c.plugged=true;c.awake=1.5;S.click(c.socket,1300);if(power)sparks(c.socket,2,[0.7,0.85,1]);HUD.msg('[PLUGGED IN]',0.9);}
/* while you carry a plugged-in thing: the cord holds it back, then lets go */
function lcCarryClamp(e,v,dt){const c=e.lcord;if(!c||!lcOK(c))return;const H=lcHead(c);const toS=c.socket.clone().sub(H);const d=toS.length();const L=c.len;if(d<L*0.92){if(c.str>0)c.str=Math.max(0,c.str-dt*2);return;}toS.multiplyScalar(1/d);
  const out=-v.dot(toS);/* m/s away from the wall */if(out>0)v.addScaledVector(toS,out*clamp((d-L*0.92)/(L*0.1),0,0.85));
  const pull=(held&&held.gap)||0;c.str+=dt*(0.6+pull*5+Math.max(0,d/L-1)*8);c.awake=Math.max(c.awake,0.5);if(Math.random()<dt*3)S.groan(c.socket,0.18);HUD.bar(clamp(c.str,0,1),'CORD TAUT · '+c.label.toUpperCase());LC.bar=0.2;
  if(c.str>=1||d>L*1.2){c.str=0;HUD.hideBar();const snap=(c.snapBias||0.22)+(pull>0.7?0.25:0)>Math.random();if(snap)lcSnap(c,H);else lcPop(c,pull>0.6?'[PLUG YANKED OUT OF THE WALL]':'[PLUG POPPED OUT OF THE WALL]',pull>0.6);}}
function lcUpdate(dt){if(!LC.on)return;if(LC.bar>0){LC.bar-=dt;if(LC.bar<=0)HUD.hideBar();}let drew=false;
  for(const c of LC.list){const o=c.owner;if(!o.alive){if(c.cut<0){c.cut=0;c.awake=2;}}
    if(!lcOK(c)){c.off();}
    /* anything that moves the appliance wakes its cord */if(o.alive&&o.mesh){const H=lcHead(c);if(H.distanceToSquared(c.last)>4e-6){c.awake=Math.max(c.awake,1.2);c.last.copy(H);}
      /* not held: thrown, blasted, shoved — past its length, out it comes */if(lcOK(c)&&!(held&&held.ent===o)){const d=H.distanceTo(c.socket);if(d>c.len*1.12){const fast=o.body&&o.body.velocity.length()>3.5;if(Math.random()<(fast?0.45:0.2))lcSnap(c,H);else lcPop(c,null,fast);}}}
    if(c.awake<=0)continue;c.awake-=dt;c.supT-=dt;const sup=c.supT<=0;if(sup)c.supT=0.1;lcStep(c,dt,sup);lcDraw(c);drew=true;}
  if(drew){LC.bsT=(LC.bsT||0)-dt;LC.im.computeBoundingSphere();}}
function lcSegFromHit(id){return LC.segs[id]||null;}

/* ---------- v81Kin: cupboard doors swing, drawers slide (they were only ever physics joints) */
function v81Kin(){let nd=0,ns=0;for(const e of ents.slice()){if(!e.alive||!e.mesh||e.kin||e.use||e.slide)continue;
    if(e.label==='cabinet door'||e.label==='cupboard door'){const j=e.joints.find(j=>j.type==='hinge');if(!j)continue;const par=j.a===e?j.b:j.a;e.mesh.updateMatrixWorld(true);const c=e.mesh.getWorldPosition(V3());const pc=par.mesh.getWorldPosition(V3());const ax=j.axis.clone().normalize();
      const out=A=>{const q=new THREE.Quaternion().setFromAxisAngle(ax,A);return c.clone().sub(j.pos).applyQuaternion(q).add(j.pos).sub(pc).setY(0).length();};const A=out(1.6)>out(-1.6)?1.6:-1.6;
      limitHinge(j,par,e,ax,Math.min(0,A*1.19),Math.max(0,A*1.19));kinDoor(e,par,j.pos,ax,A,{name:'CUPBOARD',speed:4.2});e.kin.joint=j;nd++;}
    else if(e.label==='drawer'){const h=e.mesh.children.find(o=>o.isMesh&&o.geometry&&o.geometry.parameters&&Math.abs(o.geometry.parameters.depth-0.12)<1e-3);if(!h)continue;const c=e.mesh.getWorldPosition(V3());const dir=h.getWorldPosition(V3()).sub(c).setY(0);if(dir.lengthSq()<1e-6)continue;vSlide(e,dir.normalize(),0.38,'DRAWER');ns++;}}
  return{nd,ns};}

/* ---------- build + per frame */
const V81={};
function villa81(){V81.kin=v81Kin();
  /* cords: the appliances that sit near a wall and would really have one */const add=(e,o)=>{try{return lcAdd(e,o);}catch(err){console.warn('lcAdd',o&&o.label,err);return null;}};
  if(TOAST.ent)add(TOAST.ent,{h:1.1,label:'toaster cord',isOn:()=>TOAST.on,off:()=>{if(TOAST.on){TOAST.on=false;TOAST.glow.emissiveIntensity=0;TOAST.lever.position.y=0.15;}}});
  if(KITCH.kettle)add(KITCH.kettle,{h:1.1,label:'kettle cord',anchorY:0.02,isOn:()=>KETTLE.boil>0,off:()=>{KETTLE.boil=0;}});
  if(MW.ent)add(MW.ent,{h:1.15,label:'microwave cord',isOn:()=>MW.on,off:()=>{if(MW.on)mwStop();}});
  const fr=FRIDGE.body&&FRIDGE.body.alive?FRIDGE.body:null;if(fr){V81.fridgeCord=add(fr,{h:0.3,label:'fridge cord',len:1.4,isOn:()=>true,off:()=>{}});}
  if(VLD.wm)add(VLD.wm,{h:0.3,label:'washing machine cord',isOn:()=>VLD.on,off:()=>{VLD.on=false;}});
  if(VLD.dryer)add(VLD.dryer,{h:1.45,label:'dryer cord',anchorY:0.05,isOn:()=>VLD.dry,off:()=>{VLD.dry=false;}});
  for(const e of ents){if(!e.alive||!e.poolFix||!e.label||!/lamp/i.test(e.label))continue;const fx=e.poolFix;add(e,{h:0.3,label:e.label.split(' (')[0]+' cord',anchorY:0.01,isOn:()=>fx.on,off:()=>{fx.on=false;}});}
  if(VR6.radio)add(VR6.radio.e,{h:0.3,label:'clock radio cord',anchorY:0.005,isOn:()=>VR6.radio.on,off:()=>{VR6.radio.on=false;}});
  if(VR6.amp)add(VR6.amp.e,{h:0.3,label:'amp cord',isOn:()=>VR6.amp.on,off:()=>{VR6.amp.on=false;}});
  if(VR6.beer)V81.beerCord=add(VR6.beer.e,{h:0.3,label:'bar fridge cord',isOn:()=>true,off:()=>{}});
  /* the kitchen fridge runs off its cord */if(V81.fridgeCord){const fp=fridgePowered;fridgePowered=()=>fp()&&lcOK(V81.fridgeCord);}
  V81.cords=LC.list.length;}
function updateV81(dt){spkUpdate(dt);if(VILLA)lcUpdate(dt);if(VILLA&&typeof vBeerUpdate==='function')vBeerUpdate(dt);}

/* ---------- v8.1 the garage bar fridge: a real carcass, a hinged door with a shelf, six cans you can see, a hum and a light */
function vBeerFridge(F){const W=0.5,H=0.84,D=0.52,cy=H/2+0.012,dc=0.03+D/2;const at=(x,y,z)=>F.at(x,cy+y,dc+z);
  const wh=vMat(0xeceae4,0.38,0.05),liner=vMat(0xd8dcdc,0.5),blk=vMat(0x1a1a1a,0.7),grey=vMat(0x6a6c6e,0.5,0.4);V81.beerLight=new THREE.MeshStandardMaterial({color:0xf4f6ff,emissive:0xe8f0ff,emissiveIntensity:0,roughness:0.4});
  const parts=[{w:0.03,h:H,d:D,x:-W/2+0.015,y:0,z:0,mat:wh},{w:0.03,h:H,d:D,x:W/2-0.015,y:0,z:0,mat:wh},{w:W,h:0.03,d:D,x:0,y:H/2-0.015,z:0,mat:wh},{w:W,h:0.07,d:D,x:0,y:-H/2+0.035,z:0,mat:wh},{w:W-0.06,h:H-0.1,d:0.03,x:0,y:-0.015,z:-D/2+0.015,mat:wh},
    {w:W-0.062,h:H-0.11,d:0.004,x:0,y:-0.015,z:-D/2+0.032,mat:liner,noCollide:true},{w:0.004,h:H-0.11,d:D-0.06,x:-W/2+0.032,y:-0.015,z:0,mat:liner,noCollide:true},{w:0.004,h:H-0.11,d:D-0.06,x:W/2-0.032,y:-0.015,z:0,mat:liner,noCollide:true},{w:W-0.062,h:0.004,d:D-0.06,x:0,y:H/2-0.032,z:0,mat:liner,noCollide:true},
    {w:W-0.07,h:0.008,d:D-0.1,x:0,y:0.03,z:-0.02,mat:M.chrome},
    {w:0.34,h:0.13,d:0.1,x:0,y:-H/2+0.1,z:-D/2-0.05,mat:blk,noCollide:true},{w:0.42,h:0.5,d:0.012,x:0,y:0.08,z:-D/2-0.012,mat:grey,noCollide:true},
    {w:0.07,h:0.016,d:0.04,x:0,y:H/2-0.045,z:-0.08,mat:V81.beerLight,noCollide:true},{w:0.06,h:0.035,d:0.01,x:W/2-0.08,y:H/2-0.07,z:-D/2+0.04,mat:blk,noCollide:true}];
  for(const sx of[-1,1])for(const sz of[-1,1])parts.push({w:0.04,h:0.012,d:0.04,x:sx*(W/2-0.04),y:-H/2-0.006,z:sz*(D/2-0.05),mat:blk,noCollide:true});
  const asm=mkAsm('bar fridge');const fr=compoundEnt(parts,at(0,0,0),{kind:'furniture',mat:'metal',mass:19,hp:20,label:'bar fridge (SWILL ONLY)',wakeable:true,noBatch:true,quat:F.q});addPart(asm,fr);
  /* the door: hinged on the right, gasket, a door shelf with a lip, a handle down the left edge, the sticker */const dz=D/2+0.019;const door=boxEnt(W-0.004,H-0.008,0.036,at(0,0,dz),wh,{kind:'furniture',mat:'metal',mass:2.4,hp:6,label:'bar fridge door',wakeable:true,noBatch:true,quat:F.q});addPart(asm,door);
  const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);door.mesh.add(m);return m;};
  add(new THREE.BoxGeometry(W-0.03,H-0.04,0.006),blk,0,0,-0.019);add(new THREE.BoxGeometry(W-0.07,H-0.09,0.012),liner,0,0,-0.026);add(new THREE.BoxGeometry(W-0.08,0.008,0.07),liner,0,-0.12,-0.06);add(new THREE.BoxGeometry(W-0.08,0.05,0.006),liner,0,-0.1,-0.094);
  add(new THREE.BoxGeometry(0.022,0.32,0.03),M.chrome,-W/2+0.035,0.12,0.03);
  {const c=mkCanvas(128,64),x=c.getContext('2d');x.fillStyle='#1e5a2e';x.fillRect(0,0,128,64);x.fillStyle='#f2e8b8';x.font='bold 30px sans-serif';x.textAlign='center';x.fillText('SWILL',64,34);x.font='italic 11px sans-serif';x.fillText("…it's ADDICTIVE",64,52);const st=add(new THREE.PlaneGeometry(0.16,0.08),new THREE.MeshStandardMaterial({map:mkTex(c,1,1),roughness:0.6}),0.05,0.22,0.0185);st.rotation.z=-0.08;}
  const hinge=at(W/2-0.002,0,dz);const j=addJoint(asm,door,fr,'hinge',{pos:hinge,axis:V3(0,1,0),strength:1100,pryWork:0.6,label:'fridge door hinge'});
  const c0=door.mesh.getWorldPosition(V3()),pc=fr.mesh.getWorldPosition(V3());const outD=A=>c0.clone().sub(hinge).applyAxisAngle(V3(0,1,0),A).add(hinge).sub(pc).length();const A=outD(1.7)>outD(-1.7)?1.7:-1.7;
  limitHinge(j,fr,door,V3(0,1,0),Math.min(0,A*1.15),Math.max(0,A*1.15));kinDoor(door,fr,hinge,V3(0,1,0),A,{name:'FRIDGE DOOR',speed:3.6,onChange:f=>{V81.beerOpen=f;}});door.kin.joint=j;
  /* six cans: three on the wire shelf, three on the floor of it */const cans=[];const canM=VIBE.canMat||(VIBE.canMat=vMat(0x2a6a3a,0.35,0.6));for(let i=0;i<6;i++){const sh=i<3;const p=at(-0.13+(i%3)*0.13,sh?0.03+0.004+0.061:-H/2+0.07+0.061,0.02);
    const can=compoundEnt([{geo:new THREE.CylinderGeometry(0.033,0.033,0.12,12),x:0,y:0,z:0,mat:canM,cyl:[0.033,0.033,0.12]}],p,{kind:'prop',mat:'metal',mass:0.4,hp:2,label:'SWILL can (full)',wakeable:true,restsOn:fr});fr.dependents.push(can);
    can.onHit=(hp,dmg)=>{if(dmg>0.8&&!can.popped){can.popped=true;S.canBurst?S.canBurst(hp):S.pop(hp);P.emit(hp,{count:40,color:[0.95,0.85,0.5],size:0.03,life:0.8,spread:1.4,grav:4,drag:0.6});HUD.msg('[SWILL EVERYWHERE]',1);}};cans.push(can);}
  const B={e:fr,door,cans,get n(){return cans.filter(c=>c.alive&&!c.taken).length;}};VR6.beer=B;
  fr.useLabel=()=>{if(door.alive&&!door.dynamic&&door.kin.target===0)return'OPEN THE BAR FRIDGE';return B.n>0?'GRAB A SWILL ('+B.n+' LEFT)':'IT\'S EMPTY';};
  fr.use=()=>{const p=fr.mesh.getWorldPosition(V3());if(door.alive&&!door.dynamic&&door.kin.target===0){toggleKinDoor(door);return;}const can=cans.find(c=>c.alive&&!c.taken);if(!can){S.thup(p,0.3);HUD.msg('[EMPTY. SOMEONE (YOU) DRANK THEM.]',1.2);return;}
    can.taken=true;const cold=power&&lcOK(fr.lcord)&&fr.alive;can.label='SWILL can'+(cold?' (cold)':' (warm)');makeDynamic(can);if(typeof pickUp==='function'&&!SEAT.active)pickUp(can,0.7);HUD.msg(cold?'[A COLD ONE]':'[A WARM ONE. THE FRIDGE IS OFF.]',1.2);};
  return fr;}
function vBeerUpdate(dt){const B=VR6.beer;if(!B||!B.e||!B.e.alive||!V81.beerLight)return;const on=power&&(!B.e.lcord||lcOK(B.e.lcord));V81.beerLight.emissiveIntensity=on?(V81.beerOpen||0)*2.4:0;
  if(on&&Math.random()<dt*1.2){const p=B.e.mesh.getWorldPosition(V3());if(camera.getWorldPosition(_tvp).distanceTo(p)<5)S.noise({dur:0.7,gain:0.012,type:'lowpass',f:110,pos:p});}}
