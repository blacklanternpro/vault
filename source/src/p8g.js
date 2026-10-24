
/* ============================================================ v5 · 4 — PEOPLE AND GORE FIDELITY PASS
   p8g — bodies: one continuous bending skin per person. Every part keeps its invisible hit proxy (the old rig, which the
   pose code and the ragdolls drive); a single Skeleton per person reads the proxies' world matrices directly, and each body
   segment is a SkinnedMesh piece whose ends are weighted into its neighbours, so elbows, knees, hips and the waist bend
   with no gaps. Dismemberment cuts those blend weights, so a limb still comes off clean (decision 5).
   Also: sculpted heads with eyes, lids, a mouth that opens (blink, scream, plead, squeeze shut when hit, slack when dead),
   ears, 256 px faces with age lines and facial hair; thumb + mitten hands (clenched when cuffed); jumpsuits with collars,
   rolled sleeves and a belt line; coats with lapels, lanyards and a back split; soled shoes. Gore: entry and exit wounds
   with a spray on whatever is behind, layered stumps (skin, fat, muscle, splintered bone), a real rib cage with lungs and
   gut loops that sag under gravity, staged head damage, blood that soaks outward through cloth, irregular wet pools,
   smears under a sliding body, streaking sprays, and wetter, breathier sound. */
const SKIN_ORDER=['pelvis','torso','head','uArmL','lArmL','uArmR','lArmR','thighL','shinL','thighR','shinR'];
const SKIN_CHILD={uArmL:'lArmL',uArmR:'lArmR',thighL:'shinL',thighR:'shinR'};
const _gq=new THREE.Quaternion(),_gv=V3(),_gv2=V3(),_gm=new THREE.Matrix4(),_gn=new THREE.Matrix3();
const gauss=(d,r)=>Math.exp(-(d/r)*(d/r));

/* ---------- shaped geometry (shared by the hit proxy and the skin, so wound UVs line up) */
function exLimbGeo(n,r1,r2,L){const g=new THREE.CylinderGeometry(r1,r2,L,10,8);const a=g.attributes.position;const arm=n.indexOf('Arm')>0,up=n[0]==='u'||n.startsWith('thigh');
  for(let i=0;i<a.count;i++){const y=a.getY(i),s=y/L+0.5;let k=1,kb=0;/* s: 0 distal … 1 proximal */
    if(arm&&up)k=1+0.12*gauss(s-0.62,0.22)+0.07*gauss(s-0.05,0.08);else if(arm)k=1+0.1*gauss(s-0.78,0.2)-0.1*gauss(s,0.12);
    else if(up)k=1+0.1*gauss(s-0.72,0.25)+0.09*gauss(s-0.05,0.08);else{k=1-0.12*gauss(s,0.15)+0.05*gauss(s-0.97,0.06);kb=0.22*gauss(s-0.66,0.2);}
    let x=a.getX(i)*k,z=a.getZ(i)*k;if(kb&&z<0)z*=1+kb;if(!arm&&up&&s<0.12&&z>0)z*=1.08;a.setX(i,x);a.setZ(i,z);}
  g.computeVertexNormals();return g;}
function exTorsoGeo(kind,build){const g=new THREE.BoxGeometry(0.38,LEN.to,0.22,6,8,4);const a=g.attributes.position;const belly=Math.max(0,(build||1)-1);
  for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);const s=y/LEN.to+0.5;
    const w=0.8+0.2*s-0.1*gauss(s-0.22,0.18)+0.06*gauss(s-0.86,0.12);const d=0.9+0.1*s;x*=w;z*=d;
    if(z>0){z*=1+0.13*gauss(s-0.72,0.14)+belly*0.9*gauss(s-0.25,0.2);}else z*=1+0.06*gauss(s-0.7,0.2);
    const ax=0.19*w,az=0.11*d;x*=1-0.16*Math.pow(Math.min(1,Math.abs(z)/az),2);z*=1-0.12*Math.pow(Math.min(1,Math.abs(x)/ax),2);
    if(s>0.9){const t=(s-0.9)/0.1;x*=1-0.12*t*t;z*=1-0.18*t*t;}a.setXYZ(i,x,y,z);}
  g.computeVertexNormals();return g;}
function exPelvisGeo(build){const g=new THREE.BoxGeometry(0.33,0.2,0.22,4,3,3);const a=g.attributes.position;const b=build||1;for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);x*=1-0.15*Math.pow(Math.abs(z)/0.11,2);z*=(1-0.12*Math.pow(Math.abs(x)/0.165,2))*(z>0&&b>1.1?1.12:1);if(y<-0.05){x*=0.94;z*=0.95;}a.setXYZ(i,x,y,z);}g.computeVertexNormals();return g;}
function exSkullGeo(){const g=new THREE.SphereGeometry(0.105,26,20);const a=g.attributes.position;
  for(let i=0;i<a.count;i++){_gv.set(a.getX(i),a.getY(i),a.getZ(i));const r=_gv.length();if(r<1e-6)continue;const d=_gv.clone().divideScalar(r);let disp=0;
    disp+=0.0085*gauss(d.y-0.25,0.08)*gauss(d.x,0.55)*Math.max(0,d.z-0.5)*2;
    for(const s of[-1,1]){const e=Math.hypot(d.x-s*0.33,d.y-0.14,d.z-0.93);disp-=0.009*gauss(e,0.15);const c=Math.hypot(d.x-s*0.56,d.y+0.05,d.z-0.78);disp+=0.007*gauss(c,0.17);const t=Math.hypot(d.x-s*0.86,d.y-0.32,d.z-0.36);disp-=0.004*gauss(t,0.2);}
    disp+=0.009*gauss(Math.hypot(d.x,d.y+0.78,d.z-0.6),0.2);if(d.z<-0.2)disp+=0.004;
    let x=d.x*(r+disp),y=d.y*(r+disp),z=d.z*(r+disp);if(d.y<-0.22){const k=Math.min(1,(-d.y-0.22)/0.6);x*=1-0.24*k;z*=1-0.06*k;}a.setXYZ(i,x,y,z);}
  g.computeVertexNormals();return g;}

/* ---------- faces: 256 px, painted to match the sculpted skull */
function fUV(x,y,z,W,H){const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;let u=Math.atan2(z,-x)/(Math.PI*2);if(u<0)u+=1;const v=Math.acos(clamp(y,-1,1))/Math.PI;return[u*W,v*H];}
function txFace2(o){const W=256,H=256,c=mkCanvas(W,H),x=c.getContext('2d');x.fillStyle=o.skin;x.fillRect(0,0,W,H);for(let i=0;i<7000;i++){x.fillStyle=`rgba(${o.sr+(xr()-0.5)*30|0},${o.sg+(xr()-0.5)*30|0},${o.sb+(xr()-0.5)*30|0},0.25)`;x.fillRect(xr()*W,xr()*H,1,1);}
  const P=(px,py,pz)=>fUV(px,py,pz,W,H);const blob=(p,rx,ry,col)=>{x.fillStyle=col;x.beginPath();x.ellipse(p[0],p[1],rx,ry,0,0,7);x.fill();};
  /* light from above: forehead highlight, under-chin shadow */const g=x.createLinearGradient(0,H*0.2,0,H*0.85);g.addColorStop(0,'rgba(255,240,225,0.08)');g.addColorStop(0.6,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(40,20,10,0.22)');x.fillStyle=g;x.fillRect(0,0,W,H);
  if(o.hair){x.fillStyle=o.hair;x.fillRect(0,0,W,H*(o.hairLine||0.3));for(let i=0;i<500;i++){x.fillStyle=`rgba(0,0,0,${xr()*0.25})`;x.fillRect(xr()*W,xr()*H*(o.hairLine||0.3),1,3);}if(o.bald){const f=P(0,0.8,0.6);x.fillStyle=o.skin;x.beginPath();x.ellipse(f[0],f[1]-10,64,30,0,0,7);x.fill();}}
  if(o.stubbleHead){for(let i=0;i<7000;i++){x.fillStyle='rgba(30,26,22,0.3)';x.fillRect(xr()*W,xr()*H*0.36,1,1);}}
  for(const s of[-1,1]){const e=P(s*0.33,0.14,0.93);blob(e,11,8,'rgba(60,30,20,0.28)');blob([e[0],e[1]+9],10,4,'rgba(60,30,20,0.14)');const b=P(s*0.33,0.29,0.9);x.save();x.translate(b[0],b[1]);x.rotate(s*0.08);x.fillStyle=o.brow||'#2a2018';x.fillRect(-12,-2.5,24,5);x.restore();
    const ck=P(s*0.55,-0.05,0.8);blob(ck,12,9,`rgba(${o.sr},${(o.sg*0.85)|0},${(o.sb*0.85)|0},0.25)`);const ear=P(s*0.99,0,0.05);blob(ear,7,14,'rgba(0,0,0,0.12)');}
  const ns=P(0,-0.08,1);blob([ns[0],ns[1]+4],6,14,'rgba(0,0,0,0.12)');blob([ns[0],ns[1]+16],10,4,'rgba(0,0,0,0.2)');
  const m=P(0,-0.42,0.9);x.fillStyle=o.lip||'#7a4a40';x.beginPath();x.ellipse(m[0],m[1],15,3.5,0,0,7);x.fill();x.fillStyle='rgba(0,0,0,0.3)';x.fillRect(m[0]-15,m[1]-0.5,30,1.5);
  if(o.stubble||o.beard){for(let i=0;i<5200;i++){const a=xr()*Math.PI,r=24+xr()*30;x.fillStyle=o.beard?o.beard:'rgba(25,20,16,0.35)';x.globalAlpha=o.beard?0.6:1;x.fillRect(m[0]+Math.cos(a)*r*1.1,m[1]-8+Math.sin(a)*r*0.75,o.beard?2:1,o.beard?2:1);}x.globalAlpha=1;if(o.beard){x.fillStyle=o.lip||'#7a4a40';x.fillRect(m[0]-12,m[1]-2,24,4);}}
  if(o.mous){x.fillStyle=o.mous;x.beginPath();x.ellipse(m[0],m[1]-7,18,5,0,0,7);x.fill();}
  if(o.age){x.strokeStyle='rgba(80,50,40,0.35)';x.lineWidth=1;for(let i=0;i<3;i++){const f=P(0,0.42+i*0.06,0.86);x.beginPath();x.moveTo(f[0]-22,f[1]);x.quadraticCurveTo(f[0],f[1]-3,f[0]+22,f[1]);x.stroke();}for(const s of[-1,1]){const e=P(s*0.48,0.14,0.85);for(let k=-1;k<=1;k++){x.beginPath();x.moveTo(e[0],e[1]+k*3);x.lineTo(e[0]+s*8,e[1]+k*5);x.stroke();}const nl=P(s*0.22,-0.3,0.95);x.beginPath();x.moveTo(nl[0],nl[1]-8);x.quadraticCurveTo(nl[0]+s*5,nl[1],nl[0]+s*3,nl[1]+10);x.stroke();}}
  if(o.tear){const t=P(-0.36,0.0,0.92);x.fillStyle='#2a3550';x.beginPath();x.moveTo(t[0],t[1]-5);x.quadraticCurveTo(t[0]-4,t[1]+3,t[0],t[1]+5);x.quadraticCurveTo(t[0]+4,t[1]+3,t[0],t[1]-5);x.fill();}
  if(o.scar){const s=P(0.42,0.25,0.88);x.strokeStyle='rgba(150,90,80,0.8)';x.lineWidth=2.5;x.beginPath();x.moveTo(s[0]-4,s[1]-12);x.lineTo(s[0]+6,s[1]+22);x.stroke();}
  return c;}
function txEye(col){const c=mkCanvas(64,32),x=c.getContext('2d');x.fillStyle='#ece6dc';x.fillRect(0,0,64,32);x.fillStyle='rgba(200,120,110,0.25)';x.fillRect(0,0,64,32);x.fillStyle='#ece6dc';x.fillRect(4,6,56,20);x.fillStyle=col||'#3a2a1a';x.beginPath();x.arc(16,16,6,0,7);x.fill();x.fillStyle='#050505';x.beginPath();x.arc(16,16,2.8,0,7);x.fill();x.fillStyle='#fff';x.fillRect(14,13,2,2);return c;}

/* ---------- heads */
function exHeadBuild(H,o,head){/* returns the skull mesh (the hit surface for the head) */const fo=o.face;const tex=txFace2(Object.assign({},fo,{age:o.kind==='sci'&&fo.hair&&/a3|88|99/.test(fo.hair+fo.brow)}));const hm=new THREE.Mesh(exSkullGeo(),partMat(H,'head',tex));hm.scale.set(0.93,1.13,1.02);head.add(hm);
  const skinM=exLam({color:new THREE.Color(o.skin)});const F={eyes:[],lids:[],blinkT:1+xr()*3,blink:0,open:0,lid:0};
  for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.0125,10,8),exLam({map:exTex(txEye(fo.eye))}));e.position.set(s*0.031,0.016,0.086);head.add(e);F.eyes.push(e);
    const lid=new THREE.Mesh(new THREE.SphereGeometry(0.0138,10,6,0,Math.PI*2,0,Math.PI*0.5),skinM);lid.position.copy(e.position);lid.rotation.x=-1.5;head.add(lid);F.lids.push(lid);
    const ear=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,6),skinM);ear.scale.set(0.35,1,0.7);ear.position.set(s*0.093,0.004,-0.006);head.add(ear);}
  const mouth=new THREE.Group();mouth.position.set(0,-0.05,0.096);head.add(mouth);const cav=new THREE.Mesh(new THREE.CircleGeometry(0.018,12),exLam({color:0x2a0606}));cav.scale.set(1.15,0.1,1);mouth.add(cav);const teeth=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.006,0.004),exLam({color:0xe8e2cc}));teeth.position.set(0,0.004,0.001);mouth.add(teeth);
  const lipM=exLam({color:new THREE.Color(fo.lip||'#7a4a40')});const lo=new THREE.Mesh(new THREE.BoxGeometry(0.034,0.007,0.008),lipM);lo.position.set(0,-0.004,0.002);mouth.add(lo);F.mouth=mouth;F.cav=cav;F.teeth=teeth;F.lower=lo;

  H.F=F;return hm;}
function exFaceUpdate(H,dt){const F=H.F;if(!F||H.parts.head.gone)return;let lid=0,open=0;
  if(!H.alive){lid=0.55;open=0.45;}else{F.blinkT-=dt;if(F.blinkT<=0){F.blink=0.13;F.blinkT=2+xr()*4;}if(F.blink>0){F.blink-=dt;lid=1;}
    if(H.squeezeT>0){H.squeezeT-=dt;lid=1;open=Math.max(open,0.5);}if(H.talkT>0){H.talkT-=dt;open=Math.max(open,0.25+0.35*Math.abs(Math.sin(H.t*13)));}if(H.screamOT>0){H.screamOT-=dt;open=Math.max(open,0.85+0.1*Math.sin(H.t*20));lid=Math.max(lid,0.35);}
    if(H.laughT>0)open=Math.max(open,0.35+0.35*Math.abs(Math.sin(H.t*16)));if(H.temper==='praying'&&H.stage==='ready')open=Math.max(open,0.12*Math.abs(Math.sin(H.t*7)));if(H.temper==='pleading')lid=Math.max(lid,0.2);if(H.downed){open=Math.max(open,0.4);lid=Math.max(lid,0.3);}}
  F.open=lerp(F.open,open,1-Math.exp(-dt*18));F.lid=lerp(F.lid,lid,1-Math.exp(-dt*(lid>F.lid?40:14)));
  for(const L of F.lids)L.rotation.x=-1.5+F.lid*1.45;F.cav.scale.y=0.1+F.open*1.25;F.cav.scale.x=1.15-F.open*0.25;F.lower.position.y=-0.004-F.open*0.02;F.teeth.visible=F.open>0.25;}

/* ---------- hands, feet, clothes */
function exHandMesh(H,o,n,L0,hc){const g=new THREE.Group();const mat=exLam({map:exTex(hc)});const cuffed=o.kind==='pris';const mit=new THREE.Mesh(new THREE.BoxGeometry(0.068,cuffed?0.06:0.085,0.03),mat);mit.position.y=cuffed?-0.03:-0.042;
  const a=mit.geometry.attributes.position;for(let i=0;i<a.count;i++){if(a.getY(i)<0){a.setX(i,a.getX(i)*0.85);a.setZ(i,a.getZ(i)*(cuffed?1.3:0.8));}}mit.geometry.computeVertexNormals();g.add(mit);
  const th=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.042,0.02),mat);th.position.set((n==='lArmL'?1:-1)*0.036,-0.02,0.012);th.rotation.z=(n==='lArmL'?-1:1)*0.45;g.add(th);g.position.y=-L0/2-0.006;return g;}
function exShoe(o,sci){const g=new THREE.Group();const up=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.06,0.24),exLam({color:o.shoe||0x1a1a1a}));const a=up.geometry.attributes.position;for(let i=0;i<a.count;i++){if(a.getY(i)>0)a.setX(i,a.getX(i)*0.85);if(a.getZ(i)>0.1){a.setY(i,a.getY(i)*0.7);a.setX(i,a.getX(i)*0.9);}}up.geometry.computeVertexNormals();g.add(up);
  const sole=new THREE.Mesh(new THREE.BoxGeometry(0.094,0.014,0.245),exLam({color:sci?0x0a0806:0xd8d0c0}));sole.position.y=-0.033;g.add(sole);return g;}
function exDress(H,o){const P=H.parts;const tor=P.torso.mesh;
  if(o.kind==='pris'){const cm=exLam({color:new THREE.Color(o.cloth.base).multiplyScalar(0.85)});for(const s of[-1,1]){const c=new THREE.Mesh(new THREE.BoxGeometry(0.065,0.006,0.05),cm);c.position.set(s*0.045,LEN.to/2-0.02,0.1);c.rotation.set(1.15,s*0.35,s*0.3);tor.add(c);}
    for(const n of['uArmL','uArmR']){const p=P[n];const ring=new THREE.Mesh(new THREE.CylinderGeometry(p.r*1.02,p.r*1.05,0.045,10),exLam({map:exTex(txCloth(32,16,o.cloth.base,o.cloth.rgb))}));ring.position.y=-p.L0/2+0.03;p.mesh.add(ring);}}
  else{const lm=exLam({color:0xd4d4cc});for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.2,0.012),lm);l.position.set(s*0.06,LEN.to/2-0.1,0.118);l.rotation.z=s*0.22;tor.add(l);}
    const cord=exLam({color:0x2a4aa8});for(const s of[-1,1]){const c=new THREE.Mesh(new THREE.BoxGeometry(0.006,0.16,0.004),cord);c.position.set(s*0.035,LEN.to/2-0.08,0.122);c.rotation.z=-s*0.2;tor.add(c);}
    const card=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.065),exLam({map:exTex((()=>{const c=mkCanvas(32,42),x=c.getContext('2d');x.fillStyle='#f4f2ea';x.fillRect(0,0,32,42);x.fillStyle='#8aa';x.fillRect(4,6,24,18);x.fillStyle=o.skin;x.beginPath();x.arc(16,15,6,0,7);x.fill();x.fillStyle='#223';x.fillRect(4,28,24,3);x.fillRect(4,34,16,3);return c;})())}));card.position.set(0,LEN.to/2-0.2,0.124);tor.add(card);
    const sk=P.pelvis.mesh.children.find(c=>c.geometry&&c.geometry.parameters&&c.geometry.parameters.height===0.5);if(sk){sk.visible=false;for(const s of[-1,1]){const h=new THREE.Mesh(new THREE.BoxGeometry(0.21,0.5,0.27),sk.material);h.position.set(s*0.106,-0.3,0);h.rotation.z=s*0.05;P.pelvis.mesh.add(h);h.userData.hp=P.pelvis;}}}}

/* ---------- the skin */
function exSkinHuman(H){const P=H.parts;H.group.updateMatrixWorld(true);const bones=[],inv=[];const idx={};
  SKIN_ORDER.forEach((n,i)=>{const b=new THREE.Bone();const m=P[n].mesh;m.updateMatrixWorld(true);b.matrixWorld=m.matrixWorld;b.matrixAutoUpdate=false;bones.push(b);inv.push(m.matrixWorld.clone().invert());idx[n]=i;});
  H.skel=new THREE.Skeleton(bones,inv);H.skin={};H.skinIdx=idx;
  for(const n of SKIN_ORDER){if(n==='head')continue;const p=P[n];const m=p.mesh;const src=m.geometry;const g=src.clone();const L=n==='torso'?LEN.to:n==='pelvis'?0.2:p.L0;
    const pos=g.attributes.position,nor=g.attributes.normal,cnt=pos.count;const si=new Uint16Array(cnt*4),sw=new Float32Array(cnt*4);const own=idx[n],par=n==='torso'?idx.pelvis:n==='pelvis'?idx.torso:(BONES[n].par?idx[BONES[n].par]:own),ch=SKIN_CHILD[n]?idx[SKIN_CHILD[n]]:-1;
    _gn.getNormalMatrix(m.matrixWorld);
    for(let i=0;i<cnt;i++){const y=pos.getY(i),s=clamp(y/L+0.5,0,1);let wp=0,wc=0;
      if(n==='torso')wp=0.45*Math.pow(clamp((0.22-s)/0.22,0,1),1.4);else if(n==='pelvis')wp=0.3*Math.pow(clamp((s-0.6)/0.4,0,1),1.4);else{wp=0.5*Math.pow(clamp((s-0.72)/0.28,0,1),1.3);if(ch>=0)wc=0.42*Math.pow(clamp((0.24-s)/0.24,0,1),1.3);}
      si[i*4]=own;si[i*4+1]=par;si[i*4+2]=ch>=0?ch:own;si[i*4+3]=own;sw[i*4]=1-wp-wc;sw[i*4+1]=wp;sw[i*4+2]=wc;sw[i*4+3]=0;
      _gv.set(pos.getX(i),y,pos.getZ(i)).applyMatrix4(m.matrixWorld);pos.setXYZ(i,_gv.x,_gv.y,_gv.z);_gv2.set(nor.getX(i),nor.getY(i),nor.getZ(i)).applyMatrix3(_gn).normalize();nor.setXYZ(i,_gv2.x,_gv2.y,_gv2.z);}
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
    const mat=exLam({map:m.material.map,color:m.material.color});const sm=new THREE.SkinnedMesh(g,mat);sm.bind(H.skel,new THREE.Matrix4());sm.frustumCulled=false;sm.userData.noHit=true;EX.scene.add(sm);H.skin[n]=sm;
    m.material.visible=false;m.material.colorWrite=false;}}
function exSkinSever(H,n){/* cut the blend weights at the joint above n, so the piece (and its parent) separate cleanly */if(!H.skin)return;const me=H.skinIdx[n],par=BONES[n].par;
  const fix=(piece,from,to)=>{const sm=H.skin[piece];if(!sm)return;const si=sm.geometry.attributes.skinIndex,sw=sm.geometry.attributes.skinWeight;for(let i=0;i<si.count;i++){let moved=0;for(let k=1;k<4;k++){if(si.getComponent(i,k)===from&&sw.getComponent(i,k)>0){moved+=sw.getComponent(i,k);sw.setComponent(i,k,0);}}if(moved)sw.setComponent(i,0,sw.getComponent(i,0)+moved);}sw.needsUpdate=true;};
  fix(n,H.skinIdx[par],me);if(par&&H.skin[par])fix(par,me,H.skinIdx[par]);}
function exSkinHide(H,n){if(H.skin&&H.skin[n])H.skin[n].visible=false;}
function exSkinDispose(H){if(!H.skin)return;for(const n in H.skin){const sm=H.skin[n];EX.scene.remove(sm);sm.geometry.dispose();sm.material.dispose();}H.skin=null;if(H.skel)H.skel.dispose();for(const g of(H.guts||[]))for(const m of g.meshes)EX.scene.remove(m);}

/* ---------- gore */
const SOAKS=[];
function exSoak(p,uv,big){const cv=p.H.cv[p.name];if(!cv||!uv||p.name==='head')return;const isCloth=!(p.H.kind==='pris'&&p.name.startsWith('lArm'));if(!isCloth)return;SOAKS.push({cv,px:uv.x*cv.c.width,py:(1-uv.y)*cv.c.height,r:0,max:(big?0.32:0.2)*cv.c.width,t:0});}
function exUpdateSoaks(dt){EX.soakAcc=(EX.soakAcc||0)+dt;if(EX.soakAcc<0.1)return;const k=EX.soakAcc;EX.soakAcc=0;for(let i=SOAKS.length-1;i>=0;i--){const s=SOAKS[i];s.t+=k;const r=s.max*(1-Math.exp(-s.t/1.6));if(r-s.r<0.4&&s.t>5){SOAKS.splice(i,1);continue;}s.r=r;const x=s.cv.x;const g=x.createRadialGradient(s.px,s.py,r*0.3,s.px,s.py,r);g.addColorStop(0,'rgba(90,6,8,0.22)');g.addColorStop(0.7,'rgba(80,4,6,0.14)');g.addColorStop(1,'rgba(80,4,6,0)');x.fillStyle=g;x.beginPath();x.ellipse(s.px,s.py+r*0.15,r*0.9,r*1.15,0,0,7);x.fill();s.cv.t.needsUpdate=true;}}
function exExitWound(p,h,d){/* find where the round leaves the part: big, ragged, and it paints whatever is behind */const m=p.mesh;const far=h.point.clone().addScaledVector(d,(p.r||0.12)*2.6+0.15);EX.ray2.set(far,d.clone().negate());EX.ray2.far=(p.r||0.12)*2.6+0.2;m.updateMatrixWorld(true);const hs=EX.ray2.intersectObject(m,false);if(!hs.length)return null;const e=hs[0];
  const cv=p.H.cv[p.name];if(cv&&e.uv){const W=cv.c.width,Hh=cv.c.height,x=cv.x,px=e.uv.x*W,py=(1-e.uv.y)*Hh,r=(p.name==='head'?9:6.5)*W/64;for(let i=0;i<12;i++){const a=xr()*7,dd=r*(0.4+xr()*1.3);x.fillStyle=i%3?'rgba(120,8,10,0.9)':'rgba(70,2,4,0.95)';x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*dd,py+Math.sin(a)*dd);x.lineTo(px+Math.cos(a+0.4)*dd*0.6,py+Math.sin(a+0.4)*dd*0.6);x.fill();}
    x.fillStyle='#3a0204';x.beginPath();x.arc(px,py,r*0.6,0,7);x.fill();x.fillStyle='rgba(210,170,150,0.7)';for(let i=0;i<3;i++){x.fillRect(px+(xr()-0.5)*r,py+(xr()-0.5)*r,2,2);}cv.t.needsUpdate=true;exSoak(p,e.uv,true);}
  exEmit(e.point,d,34,4.2,0.45,0,BLOOD);exEmit(e.point,d,8,2.4,0.8,1,[0.5,0.06,0.06]);exSplatFrom(e.point,d,p.name==='head'?0.55:0.4);return e;}
function exHeadGraze(H,h,d){const p=H.parts.head;const cv=H.cv.head;if(cv&&h.uv){const W=cv.c.width,x=cv.x,px=h.uv.x*W,py=(1-h.uv.y)*cv.c.height;const a=Math.atan2(-d.y,d.x+d.z);x.save();x.translate(px,py);x.rotate(a);x.fillStyle='rgba(110,6,8,0.9)';x.beginPath();x.ellipse(0,0,W*0.07,W*0.012,0,0,7);x.fill();x.fillStyle='rgba(60,2,4,0.9)';x.fillRect(-W*0.05,-1,W*0.1,2);x.restore();cv.t.needsUpdate=true;}
  exEmit(h.point,d,14,2.5,0.7,0,BLOOD);H.hurt=Math.min(1,H.hurt+0.6);H.health-=18;H.squeezeT=1.2;exScream(H,'hit');if(H.kind==='pris')EX.cap={who:'',text:'[THE ROUND TEARS ALONG HIS SCALP]',t:1.6};}
function exHeadChunk(H,d,pt){/* second hit to a corpse's head: the jaw or a piece of skull goes */const head=H.parts.head.mesh;head.updateMatrixWorld(true);const lp=head.worldToLocal(pt.clone());const jaw=lp.y<-0.02;
  if(jaw&&H.F&&H.F.mouth.parent){const wp=H.F.mouth.getWorldPosition(V3());H.F.mouth.parent.remove(H.F.mouth);const hole=new THREE.Mesh(new THREE.SphereGeometry(0.045,10,8,0,Math.PI*2,Math.PI*0.5,Math.PI*0.5),exLam({color:0x4a0406,side:THREE.DoubleSide}));hole.position.set(0,-0.04,0.07);hole.rotation.x=-0.6;head.add(hole);
    for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.BoxGeometry(0.006,0.008,0.005),exLam({color:0xe8e2cc}));t.position.set(-0.015+i*0.01,-0.03,0.09);t.rotation.z=(xr()-0.5);head.add(t);}exGib(wp,d,[0xc59a80,0x7a0c0c,0xe6dccb],3,0.03);}
  else{const pm=new THREE.Mesh(new THREE.CircleGeometry(0.03,10),exLam({color:0xc87a7a}));const n=lp.clone().normalize();pm.position.copy(n.clone().multiplyScalar(0.104));pm.lookAt(n.clone().multiplyScalar(1));head.add(pm);const rim=new THREE.Mesh(new THREE.RingGeometry(0.028,0.036,10),exLam({color:0xe6dccb,side:THREE.DoubleSide}));rim.position.copy(n.clone().multiplyScalar(0.105));rim.lookAt(n.clone().multiplyScalar(1));head.add(rim);exGib(pt,d,[0xe6dccb,0xc87a7a,0x7a0c0c],4,0.028);}
  exEmit(pt,d,40,3.5,1.0,0,BLOOD);exSplatFrom(pt,d,0.5);EXA.wet(1.4);EXA.crunch();}
function exGib(p,dir,cols,n,sz){for(let i=0;i<n;i++){const s=sz*(0.6+xr()*0.8);const m=new THREE.Mesh(new THREE.BoxGeometry(s,s*0.7,s*1.2),exLam({color:cols[i%cols.length]}));m.position.copy(p);EX.scene.add(m);const b=new CANNON.Body({mass:0.12});b.addShape(new CANNON.Box(new CANNON.Vec3(s/2,s*0.35,s*0.6)));b.position.set(p.x,p.y,p.z);b.collisionFilterGroup=2;b.collisionFilterMask=1;b.linearDamping=0.1;EX.world.addBody(b);const v=dir.clone().multiplyScalar(1.5+xr()*2.5).add(V3((xr()-0.5)*2.5,1+xr()*2,(xr()-0.5)*2.5));b.velocity.set(v.x,v.y,v.z);b.angularVelocity.set((xr()-0.5)*18,(xr()-0.5)*18,(xr()-0.5)*18);EX.gibs.push({m,b});}}
/* stumps in layers: skin edge, fat, muscle, splintered bone with marrow; severed limbs keep their own */
function exCap(mesh,pw,dirOut,r){const g=new THREE.Group();const lay=(rr,h,col,y)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rr,rr*0.96,h,12),exLam({color:col}));m.position.y=y;g.add(m);return m;};
  lay(r*1.04,0.008,0xb8846a,0);lay(r*0.95,0.011,0xe0c47a,0.002);const mus=lay(r*0.82,0.016,0x8e1414,0.005);const ma=mus.geometry.attributes.position;for(let i=0;i<ma.count;i++)if(ma.getY(i)>0)ma.setY(i,ma.getY(i)+(xr()-0.3)*0.012);mus.geometry.computeVertexNormals();lay(r*0.55,0.014,0x5a0606,0.008);
  const bone=lay(r*0.28,0.04,0xe8e0cc,0.022);const marrow=new THREE.Mesh(new THREE.CircleGeometry(r*0.15,8),exLam({color:0x9a2a2a}));marrow.rotation.x=-PI_2;marrow.position.y=0.0425;g.add(marrow);
  for(let i=0;i<4;i++){const sp=new THREE.Mesh(new THREE.ConeGeometry(r*0.06,0.02+xr()*0.025,4),exLam({color:0xdcd2bc}));const a=i/4*Math.PI*2+xr();sp.position.set(Math.cos(a)*r*0.24,0.05,Math.sin(a)*r*0.24);sp.rotation.set((xr()-0.5)*0.6,0,(xr()-0.5)*0.6);g.add(sp);}
  for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.BoxGeometry(r*0.18,0.012+xr()*0.02,r*0.12),exLam({color:i%2?0x8e1414:0xb84a4a}));const a=xr()*7;t.position.set(Math.cos(a)*r*0.75,0.01,Math.sin(a)*r*0.75);t.rotation.y=a;g.add(t);}
  mesh.updateMatrixWorld(true);const lp=mesh.worldToLocal(pw.clone());const q=mesh.getWorldQuaternion(new THREE.Quaternion()).invert();const ld=dirOut.clone().applyQuaternion(q).normalize();g.position.copy(lp);g.quaternion.setFromUnitVectors(V3(0,1,0),ld);g.scale.set(1/mesh.scale.x,1/mesh.scale.y,1/mesh.scale.z);mesh.add(g);g.traverse(c=>c.userData.hp=mesh.userData.hp);return g;}
/* the open torso: rib cage, sternum, lungs, heart, gut loops that hang under gravity */
function exOpenTorso(H){const p=H.parts.torso;if(p.opened)return;p.opened=true;const g=new THREE.Group();const cav=new THREE.Mesh(new THREE.CircleGeometry(0.1,14),exLam({color:0x2a0204}));cav.scale.set(1.15,1.6,1);g.add(cav);
  const lungM=exLam({color:0xc8828a});for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.SphereGeometry(0.05,10,8),lungM);l.scale.set(0.9,1.5,0.5);l.position.set(s*0.05,0.04,0.004);g.add(l);}
  const ht=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),exLam({color:0x6a0a10}));ht.position.set(0.018,-0.01,0.012);ht.scale.set(1,1.2,0.7);g.add(ht);H.heart=ht;
  const boneM=exLam({color:0xe2d8c2});for(let i=0;i<6;i++){for(const s of[-1,1]){const rib=new THREE.Mesh(new THREE.TorusGeometry(0.075-i*0.004,0.0055,4,10,Math.PI*0.42),boneM);rib.rotation.set(0,0,s>0?-0.25:Math.PI+0.25);rib.position.set(-s*0.012,0.115-i*0.032,0.02);rib.scale.set(1,0.6,1);g.add(rib);if(i===2&&s>0){rib.rotation.z+=0.5;rib.position.x+=0.02;}}}
  const st=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.16,0.01),boneM);st.position.set(0,0.06,0.024);st.rotation.z=0.25;g.add(st);
  const rim=new THREE.Mesh(new THREE.RingGeometry(0.1,0.13,14),exLam({color:0x7a0a0a,side:THREE.DoubleSide}));rim.scale.set(1.15,1.6,1);g.add(rim);const fat=new THREE.Mesh(new THREE.RingGeometry(0.096,0.104,14),exLam({color:0xe0c47a,side:THREE.DoubleSide}));fat.scale.set(1.15,1.6,1);fat.position.z=0.001;g.add(fat);
  g.position.set(0,-0.02,0.112);p.mesh.add(g);g.traverse(c=>c.userData.hp=p);
  /* gut loops: little verlet ropes anchored in the cavity */H.guts=H.guts||[];const gm=new THREE.MeshPhongMaterial({color:0xc07070,shininess:60,specular:0x553333});for(let k=0;k<2;k++){const anc=V3(-0.03+k*0.06,-0.1,0.11);const N=8;const pts=[],prev=[],meshes=[];p.mesh.updateMatrixWorld(true);const a0=p.mesh.localToWorld(anc.clone());
    for(let i=0;i<N;i++){const v=a0.clone().add(V3(0,-i*0.03,0.02*i));pts.push(v);prev.push(v.clone());const m=new THREE.Mesh(new THREE.SphereGeometry(0.019,8,6),gm);m.position.copy(v);EX.scene.add(m);meshes.push(m);}H.guts.push({H,anc,pts,prev,meshes,end:k?N-1:-1});}
  EXA.wet(1.6);}
function exUpdateGuts(dt){for(const H of EX.humans){if(!H.guts)continue;const tor=H.parts.torso.mesh;tor.updateMatrixWorld(true);for(const G of H.guts){const N=G.pts.length;const a=tor.localToWorld(G.anc.clone());G.pts[0].copy(a);
    for(let i=1;i<N;i++){const p=G.pts[i],q=G.prev[i];const vx=(p.x-q.x)*0.985,vy=(p.y-q.y)*0.985,vz=(p.z-q.z)*0.985;q.copy(p);p.x+=vx;p.y+=vy-9.8*dt*dt;p.z+=vz;if(p.y<0.018)p.y=0.018;}
    for(let it=0;it<4;it++){for(let i=1;i<N;i++){const A=G.pts[i-1],B=G.pts[i];_gv.subVectors(B,A);const L=_gv.length()||1e-6;const diff=(L-0.032)/L;if(i===1)B.addScaledVector(_gv,-diff);else{A.addScaledVector(_gv,diff*0.5);B.addScaledVector(_gv,-diff*0.5);}}G.pts[0].copy(a);}
    for(let i=0;i<N;i++)G.meshes[i].position.copy(G.pts[i]);}}}
/* blood pools: irregular edges, wet shine */
const POOLTX=[];function txPool2(){const c=mkCanvas(128,128),x=c.getContext('2d');x.clearRect(0,0,128,128);const blobs=[];for(let i=0;i<14;i++)blobs.push([64+(xr()-0.5)*56,64+(xr()-0.5)*56,10+xr()*20]);
  for(const [px,py,r] of blobs){const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(58,2,4,0.97)');g.addColorStop(0.75,'rgba(84,4,6,0.95)');g.addColorStop(1,'rgba(84,4,6,0)');x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,7);x.fill();}
  for(let i=0;i<40;i++){const a=xr()*7,d=30+xr()*30;x.fillStyle='rgba(84,4,6,0.85)';x.beginPath();x.arc(64+Math.cos(a)*d,64+Math.sin(a)*d,1+xr()*3,0,7);x.fill();}return c;}
function exPool(H){const tb=H.parts.torso.body;const tp=tb?tb.position:H.parts.torso.mesh.getWorldPosition(V3());if(POOLTX.length<4)POOLTX.push(exTex(txPool2()));const tex=POOLTX[(xr()*POOLTX.length)|0];
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshPhongMaterial({map:tex,transparent:true,depthWrite:false,shininess:95,specular:0x5a3030,polygonOffset:true,polygonOffsetFactor:-2}));m.rotation.x=-PI_2;m.rotation.z=xr()*7;m.position.set(tp.x,0.004+EX.pools.length*0.0004,tp.z);m.scale.setScalar(0.05);EX.scene.add(m);EX.pools.push({m,r:0.05,target:0.75+xr()*0.45,H});}
/* smears under a sliding body */
function exFloorUV(x,z){if(z>-2.5)return{s:EX.surfs.get(EX.floor),u:(x+3)/6,v:1-((z-1)+3.5)/7};if(z<-2.85)return{s:EX.surfs.get(EX.obsFloor),u:(x+3)/6,v:1-((z+4.525)+1.675)/3.35};return null;}
function exUpdateSmears(){for(const H of EX.humans){if(!H.rag||H.frozen)continue;const b=H.parts.torso.body;if(!b)continue;const sp=Math.hypot(b.velocity.x,b.velocity.z);const last=H.smearAt;if(b.position.y<0.32&&sp>0.3){const f=exFloorUV(b.position.x,b.position.z);if(f&&f.s&&last){const l=exFloorUV(last.x,last.z);if(l&&l.s===f.s){const s=f.s,W=s.c.width,Hh=s.c.height;s.x.strokeStyle='rgba(88,4,6,0.55)';s.x.lineCap='round';s.x.lineWidth=W/s.wM*0.12;s.x.beginPath();s.x.moveTo(l.u*W,(1-l.v)*Hh);s.x.lineTo(f.u*W,(1-f.v)*Hh);s.x.stroke();s.dirty=true;}}H.smearAt={x:b.position.x,z:b.position.z};}else H.smearAt=null;}}
/* screams with breath and cracks, wetter impacts, death rattles */
function exScream(H,kind){EXA.scream(H.voice,kind);H.screamOT=Math.max(H.screamOT||0,kind==='long'?1.6:kind==='moan'?1.2:kind==='sob'?1.0:kind==='gurgle'?1.4:0.7);if(kind==='gurgle')EXA.deathRattle(H.voice);}
(function(){const sc=EXA.scream;EXA.scream=function(v,k){sc.call(this,v,k);if(!this.ready)return;const m=v==='f'?2:v==='low'?0.85:1;if(k==='long'||k==='panic'||k==='hit'){for(let i=0;i<2;i++){const d=0.15+xr()*0.5;this.voice({f0:420*m,f1:620*m,f2:300*m,dur:0.09,vib:0.2,form:[[900,5,3],[1400,6,2],[3000,7,1]],breath:1.2,gain:0.22,delay:d});}this.noise({dur:0.5,gain:0.06,type:'bandpass',f:1600,q:0.8,delay:0.05});}
  if(k==='sob'||k==='moan')this.noise({dur:0.35,gain:0.07,type:'bandpass',f:1100,q:1,delay:0.6});};
  const fl=EXA.flesh;EXA.flesh=function(){fl.call(this);this.noise({dur:0.18,gain:0.3,type:'lowpass',f:380,f1:120,delay:0.01});this.noise({dur:0.06,gain:0.2,type:'bandpass',f:2400,q:2,delay:0.02});};
  EXA.crunch=function(){this.noise({dur:0.08,gain:0.5,type:'bandpass',f:1700,q:1.5});this.noise({dur:0.05,gain:0.35,type:'bandpass',f:900,q:2,delay:0.05});this.tone({f:160,f1:70,dur:0.2,gain:0.3});this.wet(1);};
  EXA.deathRattle=function(v){if(!this.ready)return;const m=v==='f'?1.6:v==='low'?0.8:1;for(let i=0;i<5;i++){this.voice({f0:70*m,f1:64*m,f2:58*m,dur:0.32,vib:0.25,form:[[350,3,3],[700,4,1.4],[2100,5,0.4]],breath:2,gain:0.16-i*0.02,delay:1.4+i*0.55});}};})();
