
/* ============================================================ p8b — EXECUTIONER: the cell, the people in it, the gun.
   Renders into a 640×480 target (PS2 resolution), Lambert/Gouraud shading, 128–512 px canvas textures, no AA.
   Characters are procedural rigs (joint poses → part meshes); on death or dismemberment they become
   cannon-es ragdolls in their own little physics world. */
const EXW=640,EXH=480;
const EX={running:false,state:'off',st:0,pt:0,rt:null,built:false,scene:null,cam:null,ov:null,ovCam:null,world:null,
  aimYaw:0,aimPitch:0,ads:false,adsK:0,recoil:0,cool:0,mag:12,reloadT:0,flashT:0,shots:0,
  humans:[],sci:[],pris:null,glass:null,glassHits:0,glassBroken:false,env:null,envMeshes:[],surfs:new Map(),hitList:[],
  pools:[],gibs:[],bleeds:[],shells:[],lastShotAt:-99,firstShotAt:-1,endT:-1,prisDeadAt:-1,ending:null,lastR:-1,is3D:false,
  cap:{who:'',text:'',t:0},objT:0,hudDirty:true,lines:{},paQ:[],paT:0,muzzle:null,mLight:null,gun:null,slide:null,tube:null,tubeLight:null};
function exMakeRT(){let type=THREE.UnsignedByteType;try{if(renderer.extensions&&renderer.extensions.has&&renderer.extensions.has('EXT_color_buffer_float'))type=THREE.HalfFloatType;}catch(e){}
  EX.rt=new THREE.WebGLRenderTarget(EXW,EXH,{type,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true});EX.rt.texture.generateMipmaps=false;}
const exLam=(o)=>new THREE.MeshLambertMaterial(o);
function exTex(c,rep){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}return t;}
let _xs=1;const xr=()=>{_xs=(_xs*16807)%2147483647;return(_xs-1)/2147483646;};

/* ---------- textures (painted once, kept as pristine copies so a new round can wipe the blood) */
function txConcrete(w,h,o={}){const c=mkCanvas(w,h),x=c.getContext('2d');x.fillStyle=o.base||'#67645e';x.fillRect(0,0,w,h);
  for(let i=0;i<w*h/5;i++){const v=(xr()-0.5)*46;const g=(o.g||100)+v;x.fillStyle=`rgba(${g|0},${(g*0.98)|0},${(g*0.94)|0},0.35)`;x.fillRect(xr()*w,xr()*h,1+xr()*2,1+xr()*2);}
  for(let i=0;i<14;i++)stain(x,xr()*w,xr()*h,10+xr()*60,'20,18,14',0.12+xr()*0.12);
  if(o.pour){x.strokeStyle='rgba(30,28,24,0.25)';x.lineWidth=1;for(let y=h*0.33;y<h;y+=h*0.33){x.beginPath();x.moveTo(0,y+xr()*3);for(let k=1;k<=8;k++)x.lineTo(w*k/8,y+xr()*4-2);x.stroke();}}
  if(o.ties){const sx=o.ties[0],sy=o.ties[1];for(let ty=sy/2;ty<h;ty+=sy)for(let tx=sx/2;tx<w;tx+=sx){x.fillStyle='rgba(20,18,16,0.7)';x.beginPath();x.arc(tx,ty,2.6,0,7);x.fill();x.fillStyle='rgba(160,155,145,0.25)';x.beginPath();x.arc(tx-1,ty-1,1.2,0,7);x.fill();}}
  if(o.streaks){for(let i=0;i<o.streaks;i++){const sx=xr()*w,sy=xr()*h*0.4,len=h*(0.3+xr()*0.6);const g=x.createLinearGradient(sx,sy,sx,sy+len);g.addColorStop(0,'rgba(40,34,26,0.22)');g.addColorStop(1,'rgba(40,34,26,0)');x.fillStyle=g;x.fillRect(sx,sy,2+xr()*5,len);}}
  return c;}
function txFloor(){const c=txConcrete(512,512,{base:'#55524c',g:86});const x=c.getContext('2d');/* drain + a painted line + old stains */
  const dx=300,dy=250;x.fillStyle='#1d1c1a';x.beginPath();x.arc(dx,dy,20,0,7);x.fill();x.strokeStyle='#4a4842';x.lineWidth=2;for(let i=-16;i<=16;i+=6){x.beginPath();x.moveTo(dx+i,dy-Math.sqrt(400-i*i));x.lineTo(dx+i,dy+Math.sqrt(400-i*i));x.stroke();}
  for(let i=0;i<6;i++)stain(x,dx+(xr()-0.5)*90,dy+(xr()-0.5)*90,14+xr()*30,'60,22,16',0.16);x.fillStyle='rgba(190,160,40,0.55)';x.fillRect(0,420,512,8);x.font='bold 22px monospace';x.fillStyle='rgba(190,160,40,0.5)';x.fillText('DO NOT CROSS',170,455);return c;}
function txWallBack(){const c=txConcrete(512,96,{base:'#5a5853',g:84,ties:[64,48],pour:false,streaks:10});return c;}
function txWallSide(t){const c=txConcrete(512,256,{base:'#5a5853',g:84,ties:[64,64],pour:true,streaks:22});const x=c.getContext('2d');if(t){x.font='bold 34px "Arial Black",Impact,sans-serif';x.fillStyle='rgba(200,195,180,0.55)';x.fillText(t,40,90);}return c;}
function txObs(){const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#a8b3ab';x.fillRect(0,0,256,256);for(let i=0;i<3000;i++){x.fillStyle=`rgba(${120+xr()*40|0},${130+xr()*40|0},${125+xr()*40|0},0.25)`;x.fillRect(xr()*256,xr()*256,2,2);}x.fillStyle='rgba(60,70,64,0.35)';x.fillRect(0,0,256,8);x.fillRect(0,170,256,4);return c;}
function txLino(){const c=mkCanvas(512,288),x=c.getContext('2d');const n=20,m=11;const tw=512/n,th=288/m;for(let j=0;j<m;j++)for(let i=0;i<n;i++){x.fillStyle=(i+j)%2?'#c9ccc0':'#8e9488';x.fillRect(i*tw,j*th,tw+1,th+1);}for(let i=0;i<5000;i++){x.fillStyle='rgba(40,40,30,0.12)';x.fillRect(xr()*512,xr()*288,2,1);}return c;}
function txCloth(w,h,base,rgb,o={}){const c=mkCanvas(w,h),x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<w*h/3;i++){const v=(xr()-0.5)*30;x.fillStyle=`rgba(${clamp(rgb[0]+v,0,255)|0},${clamp(rgb[1]+v,0,255)|0},${clamp(rgb[2]+v,0,255)|0},0.4)`;x.fillRect(xr()*w,xr()*h,1,1+xr()*3);}
  for(let i=0;i<8;i++){x.strokeStyle='rgba(0,0,0,0.13)';x.lineWidth=2+xr()*3;x.beginPath();const sx=xr()*w;x.moveTo(sx,0);x.bezierCurveTo(sx+xr()*20-10,h*0.3,sx+xr()*20-10,h*0.6,sx+xr()*16-8,h);x.stroke();}
  if(o.text){x.save();x.font=o.font||'bold 26px monospace';x.fillStyle=o.tc||'rgba(20,20,20,0.75)';x.textAlign='center';x.fillText(o.text,o.tx||w*0.25,o.ty||h*0.3);if(o.text2)x.fillText(o.text2,o.tx2||w*0.75,o.ty||h*0.3);x.restore();}
  if(o.belt){x.fillStyle='rgba(0,0,0,0.22)';x.fillRect(0,h*0.86,w,3);x.fillStyle='rgba(255,255,255,0.08)';x.fillRect(0,h*0.86+3,w,1);}
  for(let i=0;i<5;i++){x.strokeStyle='rgba(255,255,255,0.07)';x.lineWidth=1.5;x.beginPath();const sx=xr()*w;x.moveTo(sx,h*0.1);x.quadraticCurveTo(sx+6,h*0.5,sx-4,h*0.95);x.stroke();}
  if(o.coat){x.fillStyle='rgba(0,0,0,0.18)';x.fillRect(w*0.245,0,2,h);x.fillStyle='#d9d9d2';for(let k=0;k<4;k++){x.beginPath();x.arc(w*0.235,h*(0.2+k*0.2),3,0,7);x.fill();}x.strokeStyle='rgba(0,0,0,0.25)';x.lineWidth=2;x.strokeRect(w*0.32,h*0.22,w*0.1,h*0.14);x.fillStyle='#2244aa';x.fillRect(w*0.34,h*0.15,2,h*0.1);x.fillStyle='#bb2222';x.fillRect(w*0.37,h*0.15,2,h*0.1);x.fillStyle='#e8e2c8';x.fillRect(w*0.1,h*0.25,w*0.08,h*0.12);x.fillStyle='#335';x.fillRect(w*0.11,h*0.27,w*0.06,h*0.02);}
  return c;}
function txFace(o){const W=128,H=128,c=mkCanvas(W,H),x=c.getContext('2d');x.fillStyle=o.skin;x.fillRect(0,0,W,H);for(let i=0;i<1600;i++){x.fillStyle=`rgba(${o.sr+(xr()-0.5)*30|0},${o.sg+(xr()-0.5)*30|0},${o.sb+(xr()-0.5)*30|0},0.3)`;x.fillRect(xr()*W,xr()*H,1,1);}
  /* face centred at u=0.25 (front of the sphere) */const fx=W*0.25;
  if(o.hair){x.fillStyle=o.hair;x.fillRect(0,0,W,H*(o.hairLine||0.3));if(o.bald){x.fillStyle=o.skin;x.fillRect(fx-30,0,60,H*0.22);}}
  if(o.stubbleHead){for(let i=0;i<2200;i++){x.fillStyle='rgba(30,26,22,0.35)';x.fillRect(xr()*W,xr()*H*0.36,1,1);}}
  x.fillStyle='rgba(0,0,0,0.12)';x.fillRect(fx-22,H*0.38,44,6);/* brow shadow */x.fillStyle=o.brow||'#2a2018';x.fillRect(fx-19,H*0.39,14,3);x.fillRect(fx+5,H*0.39,14,3);
  for(const s of[-1,1]){x.fillStyle='#e8e2d6';x.fillRect(fx+s*12-6,H*0.44,11,5);x.fillStyle=o.eye||'#3a2a1a';x.fillRect(fx+s*12-3,H*0.44,5,5);x.fillStyle='#000';x.fillRect(fx+s*12-2,H*0.45,3,3);x.fillStyle='rgba(0,0,0,0.18)';x.fillRect(fx+s*12-6,H*0.5,11,2);}
  x.fillStyle='rgba(0,0,0,0.16)';x.fillRect(fx-3,H*0.48,6,14);x.fillStyle='rgba(0,0,0,0.25)';x.fillRect(fx-5,H*0.6,10,2);
  x.fillStyle=o.lip||'#7a4a40';x.fillRect(fx-9,H*0.67,18,3);x.fillStyle='rgba(0,0,0,0.25)';x.fillRect(fx-9,H*0.665,18,1);
  if(o.stubble){for(let i=0;i<900;i++){const a=xr()*Math.PI,r=18+xr()*16;x.fillStyle='rgba(25,20,16,0.35)';x.fillRect(fx+Math.cos(a)*r*0.9,H*0.58+Math.sin(a)*r*0.7,1,1);}}
  if(o.beard){for(let i=0;i<2600;i++){const a=xr()*Math.PI,r=14+xr()*24;x.fillStyle=o.beard;x.globalAlpha=0.55;x.fillRect(fx+Math.cos(a)*r*1.05,H*0.6+Math.sin(a)*r*0.75,2,2);}x.globalAlpha=1;x.fillStyle=o.lip||'#7a4a40';x.fillRect(fx-8,H*0.67,16,3);}
  if(o.mous){x.fillStyle=o.mous;x.fillRect(fx-12,H*0.625,24,5);x.fillRect(fx-13,H*0.64,4,6);x.fillRect(fx+9,H*0.64,4,6);}
  if(o.tear){x.fillStyle='#2a3550';x.beginPath();x.moveTo(fx-13,H*0.535);x.quadraticCurveTo(fx-16,H*0.565,fx-13,H*0.575);x.quadraticCurveTo(fx-10,H*0.565,fx-13,H*0.535);x.fill();}
  if(o.scar){x.strokeStyle='rgba(150,90,80,0.8)';x.lineWidth=1.5;x.beginPath();x.moveTo(fx+16,H*0.36);x.lineTo(fx+22,H*0.52);x.stroke();}
  for(const s of[0.0,0.5]){x.fillStyle='rgba(0,0,0,0.1)';x.fillRect(W*s+W*0.47,H*0.42,8,16);}/* ears */
  return c;}
function txSkin(base,rgb){const c=mkCanvas(64,64),x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,64,64);for(let i=0;i<500;i++){x.fillStyle=`rgba(${rgb[0]+(xr()-0.5)*30|0},${rgb[1]+(xr()-0.5)*30|0},${rgb[2]+(xr()-0.5)*30|0},0.3)`;x.fillRect(xr()*64,xr()*64,1,1);}return c;}
function txBloodPool(){const c=mkCanvas(128,128),x=c.getContext('2d');x.clearRect(0,0,128,128);for(let i=0;i<9;i++){const px=64+(xr()-0.5)*40,py=64+(xr()-0.5)*40,r=18+xr()*26;const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(70,4,6,0.95)');g.addColorStop(0.7,'rgba(90,6,8,0.9)');g.addColorStop(1,'rgba(90,6,8,0)');x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,7);x.fill();}return c;}
function txDot(){const c=mkCanvas(16,16),x=c.getContext('2d');x.fillStyle='#fff';x.beginPath();x.arc(8,8,6.5,0,7);x.fill();return c;}
function txFlash(){const c=mkCanvas(64,64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(255,250,220,1)');g.addColorStop(0.3,'rgba(255,190,90,0.9)');g.addColorStop(1,'rgba(255,120,30,0)');x.fillStyle=g;x.fillRect(0,0,64,64);x.strokeStyle='rgba(255,230,160,0.9)';x.lineWidth=3;for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.3;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*31,32+Math.sin(a)*31);x.stroke();}return c;}

/* ---------- paintable surfaces */
function exSurf(mesh,canvas,wM,hM,vertical,pristine){const tex=mesh.material.map;const s={mesh,c:canvas,x:canvas.getContext('2d'),tex,wM,hM,vertical,pristine,dirty:false};EX.surfs.set(mesh,s);return s;}
function exEnvPlane(w,h,pos,rot,canvas,rep,o={}){const tex=exTex(canvas,rep);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),exLam({map:tex,color:o.color||0xffffff,emissive:o.em||0x000000}));m.position.copy(pos);m.rotation.set(rot[0],rot[1],rot[2]);EX.env.add(m);EX.envMeshes.push(m);
  if(o.paint){const pr=mkCanvas(canvas.width,canvas.height);pr.getContext('2d').drawImage(canvas,0,0);exSurf(m,canvas,w,h,o.vertical!==false,pr);}return m;}
function exEnvBox(w,h,d,pos,mat,body=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.copy(pos);EX.env.add(m);EX.envMeshes.push(m);if(body)exStaticBox(w,h,d,pos);return m;}
function exStaticBox(w,h,d,pos){const b=new CANNON.Body({mass:0});b.addShape(new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)));b.position.set(pos.x,pos.y,pos.z);b.collisionFilterGroup=1;b.collisionFilterMask=-1;EX.world.addBody(b);return b;}
function exPaint(s,u,v,fn){const W=s.c.width,H=s.c.height;fn(s.x,u*W,(1-v)*H,W/s.wM);s.dirty=true;}
function splatAt(s,u,v,size,dir){exPaint(s,u,v,(x,px,py,ppm)=>{const r=size*ppm;const cols=['rgba(92,4,8,0.92)','rgba(120,8,10,0.85)','rgba(70,2,4,0.9)'];x.fillStyle=cols[0];x.beginPath();x.arc(px,py,r*0.55,0,7);x.fill();
  for(let i=0;i<14;i++){const a=xr()*Math.PI*2,d=r*(0.5+xr()*1.6),rr=r*(0.06+xr()*0.18);x.fillStyle=cols[i%3];x.beginPath();x.ellipse(px+Math.cos(a)*d,py+Math.sin(a)*d,rr*1.8,rr,a,0,7);x.fill();}
  if(dir){/* directional spatter: elongated drops thrown along the direction of travel, each with a little tail */const ang=s.vertical?Math.atan2(-dir.y,Math.hypot(dir.x,dir.z)*((dir.x+dir.z)>=0?1:-1)):Math.atan2(dir.z,dir.x);const ca=Math.cos(ang),sa=Math.sin(ang);for(let i=0;i<16;i++){const along=r*(0.5+xr()*2.6),lat=(xr()-0.5)*r*(0.5+along/r*0.35);const dx=px+ca*along-sa*lat,dy=py+sa*along+ca*lat;const len=r*(0.08+xr()*0.22)*(1+along/r*0.15),w=Math.max(0.8,len*(0.28+xr()*0.15));x.save();x.translate(dx,dy);x.rotate(ang+(xr()-0.5)*0.25);x.fillStyle=cols[i%3];x.beginPath();x.ellipse(0,0,len,w,0,0,7);x.fill();x.fillRect(len*0.6,-w*0.25,len*0.9,w*0.5);x.beginPath();x.arc(len*1.55,0,w*0.35,0,7);x.fill();x.restore();}}
  if(s.vertical){for(let i=0;i<3+xr()*5;i++){const sx=px+(xr()-0.5)*r*1.2,len=ppm*(0.08+xr()*0.45);const g=x.createLinearGradient(sx,py,sx,py+len);g.addColorStop(0,'rgba(95,5,8,0.9)');g.addColorStop(1,'rgba(95,5,8,0.15)');x.fillStyle=g;x.fillRect(sx-1,py,2+xr()*2,len);x.beginPath();x.arc(sx+0.5,py+len,2,0,7);x.fill();}}});}
function holeAt(s,u,v){exPaint(s,u,v,(x,px,py)=>{x.fillStyle='rgba(160,150,135,0.45)';x.beginPath();x.arc(px,py,5,0,7);x.fill();x.fillStyle='#141210';x.beginPath();x.arc(px,py,2.2,0,7);x.fill();x.strokeStyle='rgba(20,18,15,0.6)';x.lineWidth=1;for(let i=0;i<4;i++){const a=xr()*7;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*(4+xr()*5),py+Math.sin(a)*(4+xr()*5));x.stroke();}});}
function dropAt(s,u,v){exPaint(s,u,v,(x,px,py)=>{x.fillStyle='rgba(100,6,8,0.85)';x.beginPath();x.arc(px,py,1+xr()*2.2,0,7);x.fill();});}
function exFlushSurfs(){for(const s of EX.surfs.values())if(s.dirty){s.dirty=false;s.tex.needsUpdate=true;}}

/* ---------- particles: blood, dust, glass, brass */
const EXP={N:1200,pos:null,vel:null,life:null,kind:null,pts:null,col:null,i:0};
function exInitParticles(){const N=EXP.N;EXP.pos=new Float32Array(N*3);EXP.vel=new Float32Array(N*3);EXP.life=new Float32Array(N);EXP.kind=new Uint8Array(N);EXP.col=new Float32Array(N*3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(EXP.pos,3));g.setAttribute('color',new THREE.BufferAttribute(EXP.col,3));
  EXP.pts=new THREE.Points(g,new THREE.PointsMaterial({size:0.032,vertexColors:true,sizeAttenuation:true,map:exTex(txDot()),alphaTest:0.5}));EXP.pts.frustumCulled=false;EX.scene.add(EXP.pts);for(let i=0;i<N;i++)EXP.pos[i*3+1]=-99;}
function exEmit(p,dir,n,speed,spread,kind,col){for(let k=0;k<n;k++){const i=EXP.i=(EXP.i+1)%EXP.N;const i3=i*3;EXP.pos[i3]=p.x;EXP.pos[i3+1]=p.y;EXP.pos[i3+2]=p.z;const s=speed*(0.35+xr()*0.9);
  EXP.vel[i3]=(dir.x+(xr()-0.5)*spread)*s;EXP.vel[i3+1]=(dir.y+(xr()-0.5)*spread)*s;EXP.vel[i3+2]=(dir.z+(xr()-0.5)*spread)*s;EXP.life[i]=1.2+xr()*1.8;EXP.kind[i]=kind;const v=0.75+xr()*0.35;EXP.col[i3]=col[0]*v;EXP.col[i3+1]=col[1]*v;EXP.col[i3+2]=col[2]*v;}}
const BLOOD=[0.45,0.02,0.03],DUST=[0.55,0.53,0.5],GLASSC=[0.75,0.88,0.85];
function exUpdateParticles(dt){const P=EXP.pos,Vv=EXP.vel;let any=false;for(let i=0;i<EXP.N;i++){if(EXP.life[i]<=0)continue;any=true;const i3=i*3;EXP.life[i]-=dt;const k=EXP.kind[i];const grav=k===1?2.5:9.8,drag=k===1?3:0.4;
  Vv[i3]*=1-drag*dt;Vv[i3+2]*=1-drag*dt;Vv[i3+1]=Vv[i3+1]*(1-drag*dt)-grav*dt;P[i3]+=Vv[i3]*dt;P[i3+1]+=Vv[i3+1]*dt;P[i3+2]+=Vv[i3+2]*dt;
  if(P[i3+1]<=0.003){if(k===0&&xr()<0.35)exFloorDrop(P[i3],P[i3+2]);EXP.life[i]=0;}
  if(k===0&&!EX.glassBroken&&P[i3+2]<-2.62&&P[i3+2]>-2.74&&Math.abs(P[i3]+0.3)<2.2&&P[i3+1]>1.05&&P[i3+1]<2.45){if(xr()<0.5)exGlassDrop(P[i3],P[i3+1]);EXP.life[i]=0;}
  if(Math.abs(P[i3])>2.98||P[i3+2]>4.48||P[i3+2]<-6.15)EXP.life[i]=0;if(EXP.life[i]<=0)P[i3+1]=-99;}
  if(any)EXP.pts.geometry.attributes.position.needsUpdate=true;EXP.pts.geometry.attributes.color.needsUpdate=true;}
function exFloorDrop(x,z){const f=z>-2.5?EX.floor:EX.obsFloor;const s=f&&EX.surfs.get(f);if(!s)return;const u=(x+s.wM/2)/s.wM,v=1-((z-f.position.z)+s.hM/2)/s.hM;if(u<0||u>1||v<0||v>1)return;dropAt(s,u,v);}
function exGlassDrop(x,y){const s=EX.glassS;if(!s)return;const u=(x+2.5)/4.4,v=(y-1.05)/1.4;exPaint(s,u,v,(c,px,py)=>{c.fillStyle='rgba(110,4,8,0.75)';c.beginPath();c.arc(px,py,1.5+xr()*3,0,7);c.fill();if(xr()<0.3){c.fillRect(px-1,py,2,6+xr()*20);}});}

/* ---------- the room */
function exBuild(){if(EX.built)return;EX.built=true;_xs=417;
  EX.scene=new THREE.Scene();EX.scene.background=new THREE.Color(0x020202);EX.scene.fog=new THREE.Fog(0x040404,7,16);
  EX.ray=new THREE.Raycaster();EX.ray2=new THREE.Raycaster();EX.cam=new THREE.PerspectiveCamera(62,EXW/EXH,0.03,40);EX.cam.rotation.order='YXZ';EX.cam.position.set(0,1.62,3.3);EX.scene.add(EX.cam);
  EX.world=new CANNON.World();EX.world.gravity.set(0,-10.5,0);EX.world.broadphase=new CANNON.NaiveBroadphase();EX.world.solver.iterations=14;EX.world.allowSleep=true;EX.world.defaultContactMaterial.friction=0.7;EX.world.defaultContactMaterial.restitution=0.02;
  const gnd=new CANNON.Body({mass:0});gnd.addShape(new CANNON.Plane());gnd.quaternion.setFromEuler(-Math.PI/2,0,0);gnd.collisionFilterGroup=1;EX.world.addBody(gnd);
  EX.env=new THREE.Group();EX.scene.add(EX.env);const PI=Math.PI;
  /* cell: x −3..3, z −2.5..4.5, ceiling 3.0. Window wall at z −2.5 (0.35 thick), observation room behind it */
  EX.floor=exEnvPlane(6,7,V3(0,0,1),[-PI/2,0,0],txFloor(),null,{paint:true,vertical:false});
  exEnvPlane(6,7,V3(0,3,1),[PI/2,0,0],txConcrete(256,256,{base:'#4b4945',g:72}),[2,2]);
  exEnvPlane(3.8,3,V3(-3,1.5,-0.6),[0,PI/2,0],txWallSide('CELL 04'),null,{paint:true});exEnvPlane(2.2,3,V3(-3,1.5,3.4),[0,PI/2,0],txConcrete(256,256,{base:'#5a5853',g:84,ties:[64,64],pour:true,streaks:12}),null,{paint:true});exEnvPlane(1.0,1.0,V3(-3,2.5,1.8),[0,PI/2,0],txConcrete(64,64,{base:'#5a5853',g:84,ties:[32,32]}),null,{paint:true});/* the intake hatch sits in the gap (p8f) */exEnvPlane(7,3,V3(3,1.5,1),[0,-PI/2,0],txWallSide(''),null,{paint:true});exEnvPlane(6,3,V3(0,1.5,4.5),[0,PI,0],txWallSide(''),null,{paint:true});
  EX.backLow=exEnvPlane(4.9,1.05,V3(-0.55,0.525,-2.5),[0,0,0],txWallBack(),null,{paint:true});
  exEnvPlane(6,0.55,V3(0,2.725,-2.5),[0,0,0],txConcrete(512,48,{ties:[64,48]}),null,{paint:true});
  exEnvPlane(0.5,1.4,V3(-2.75,1.75,-2.5),[0,0,0],txConcrete(40,128,{ties:[32,64]}),null,{paint:true});exEnvPlane(1.1,0.35,V3(2.45,2.275,-2.5),[0,0,0],txConcrete(88,32,{ties:[32,32]}),null,{paint:true});
  const rev=exLam({map:exTex(txConcrete(128,32,{}))});exEnvBox(4.4,0.04,0.35,V3(-0.3,1.03,-2.675),rev);exEnvBox(4.4,0.04,0.35,V3(-0.3,2.47,-2.675),rev);exEnvBox(0.04,1.44,0.35,V3(-2.52,1.75,-2.675),rev);exEnvBox(0.04,1.44,0.35,V3(1.92,1.75,-2.675),rev);
  /* walls for the ragdolls */exStaticBox(0.4,3,8,V3(-3.2,1.5,1));exStaticBox(0.4,3,8,V3(3.2,1.5,1));exStaticBox(6,3,0.4,V3(0,1.5,4.7));exStaticBox(4.9,1.05,0.35,V3(-0.55,0.525,-2.675));exStaticBox(6,0.55,0.35,V3(0,2.725,-2.675));exStaticBox(0.5,1.4,0.35,V3(-2.75,1.75,-2.675));exStaticBox(1.1,0.35,0.35,V3(2.45,2.275,-2.675));
  /* observation room: z −2.85..−6.2 */const obsTex=txObs();EX.obsFloor=exEnvPlane(6,3.35,V3(0,0.0,-4.525),[-PI/2,0,0],txLino(),null,{paint:true,vertical:false});
  exEnvPlane(6,2.8,V3(0,1.4,-6.2),[0,0,0],obsTex,[2,1],{paint:false});exEnvPlane(3.35,2.8,V3(-3,1.4,-4.525),[0,PI/2,0],obsTex,[1,1]);exEnvPlane(3.35,2.8,V3(3,1.4,-4.525),[0,-PI/2,0],obsTex,[1,1]);exEnvPlane(6,3.35,V3(0,2.8,-4.525),[PI/2,0,0],txConcrete(128,128,{base:'#cfd3cf',g:200}),[3,2]);
  exStaticBox(6,2.8,0.3,V3(0,1.4,-6.35));exStaticBox(0.3,2.8,3.4,V3(-3.15,1.4,-4.5));exStaticBox(0.3,2.8,3.4,V3(3.15,1.4,-4.5));
  /* console under the glass, its monitors, the PA mic */const lam=exLam({color:0x3a3d40});const top=exLam({color:0x222426});exEnvBox(4.2,0.9,0.42,V3(-0.05,0.45,-3.08),lam);exEnvBox(4.3,0.04,0.5,V3(-0.05,0.92,-3.08),top,false);EX.consoleTop=top;
  for(const mx of[-1.6,-0.2,1.2]){const scr=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.28,0.3),exLam({color:0x2b2d2c}));scr.position.set(mx,1.08,-3.12);EX.env.add(scr);EX.envMeshes.push(scr);const gl=new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.22),new THREE.MeshBasicMaterial({color:0x39d16a}));gl.position.set(mx,1.08,-3.271);gl.rotation.y=PI;EX.env.add(gl);}
  const mic=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.32,6),exLam({color:0x111111}));mic.position.set(0.25,1.06,-2.95);mic.rotation.x=0.5;EX.env.add(mic);
  /* door in the back wall */const door=exEnvBox(0.95,2.05,0.08,V3(2.25,1.025,-6.15),exLam({color:0x5b6366}),false);const dh=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.03,0.05),exLam({color:0x999999}));dh.position.set(1.9,1.0,-6.09);EX.env.add(dh);const dw=new THREE.Mesh(new THREE.PlaneGeometry(0.25,0.35),new THREE.MeshBasicMaterial({color:0x0a0d10}));dw.position.set(2.25,1.6,-6.105);EX.env.add(dw);EX.door=door;
  /* the glass (bullet-resistant, until it isn't) */const gc=mkCanvas(512,160);EX.glassCanvas=gc;const gtex=exTex(gc);const gm=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.4),new THREE.MeshBasicMaterial({map:gtex,transparent:true,depthWrite:false,toneMapped:false}));gm.position.set(-0.3,1.75,-2.68);EX.scene.add(gm);EX.glass=gm;EX.glassS={mesh:gm,c:gc,x:gc.getContext('2d'),tex:gtex,wM:4.4,hM:1.4,vertical:true,dirty:false};EX.surfs.set(gm,EX.glassS);
  /* PA speaker, tube light, the camera on its tripod, a bucket and mop */
  const spk=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.22,0.12),exLam({color:0x3d3f3a}));spk.position.set(0,2.8,-2.42);EX.env.add(spk);for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.012,0.01),exLam({color:0x111111}));s.position.set(0,2.73+i*0.025,-2.358);EX.env.add(s);}
  const tubeM=new THREE.Mesh(new THREE.BoxGeometry(1.25,0.05,0.1),new THREE.MeshBasicMaterial({color:0xeaf2ff}));tubeM.position.set(0,2.95,0.35);EX.env.add(tubeM);EX.tube=tubeM;const tube2=new THREE.Mesh(new THREE.BoxGeometry(1.25,0.05,0.1),exLam({color:0x55585a}));tube2.position.set(0,2.95,3.2);EX.env.add(tube2);
  EX.tubeLight=new THREE.PointLight(0xe6eeff,9,10,1.35);EX.tubeLight.position.set(0,2.7,0.35);EX.scene.add(EX.tubeLight);EX.scene.add(new THREE.HemisphereLight(0x7a8086,0x1e1a18,0.3));const fill=new THREE.PointLight(0xffe2c0,2.6,8,1.6);fill.position.set(0.6,2.3,2.6);EX.scene.add(fill);
  const obsL=new THREE.PointLight(0xeaf6ff,12,9,1.25);obsL.position.set(0,2.45,-4.3);EX.scene.add(obsL);for(const px of[-1.5,1.5]){const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.1,0.5),new THREE.MeshBasicMaterial({color:0xf2f8ff}));pl.position.set(px,2.79,-4.4);pl.rotation.x=PI/2;EX.env.add(pl);}
  EX.mLight=new THREE.PointLight(0xffb060,0,7,1.6);EX.scene.add(EX.mLight);
  const tri=new THREE.Group();const tmat=exLam({color:0x1a1a1a});for(let i=0;i<3;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,1.3,5),tmat);const a=i/3*PI*2;l.position.set(Math.cos(a)*0.22,0.62,Math.sin(a)*0.22);l.rotation.set(Math.sin(a)*0.35,0,-Math.cos(a)*0.35);tri.add(l);}const cam=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.14,0.3),tmat);cam.position.y=1.32;tri.add(cam);const lens=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.045,0.09,10),exLam({color:0x050505}));lens.rotation.x=PI/2;lens.position.set(0,1.32,0.19);tri.add(lens);EX.recLed=new THREE.Mesh(new THREE.SphereGeometry(0.012,6,6),new THREE.MeshBasicMaterial({color:0xff1010}));EX.recLed.position.set(0.05,1.41,0.15);tri.add(EX.recLed);tri.position.set(-2.1,0,1.0);tri.rotation.y=-1.25;EX.env.add(tri);
  const bucket=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.12,0.3,10,1,true),exLam({color:0x7a6a2a,side:THREE.DoubleSide}));bucket.position.set(-2.62,0.15,4.1);EX.env.add(bucket);const mop=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,1.4,5),exLam({color:0x8a7a5a}));mop.position.set(-2.69,0.72,4.15);mop.rotation.z=0.22;EX.env.add(mop);
  exInitParticles();exBuildGun();exBuildOverlay();exInitHumansShared();exBuildV2();}

/* ---------- the gun (in the camera) */
function exBuildGun(){const g=new THREE.Group();const blued=exLam({color:0x1c1d20});const grip=exLam({color:0x2b2622});const skin=exLam({map:exTex(txSkin('#c99c7e',[201,156,126]))});const sleeve=exLam({color:0x31353a});
  const frame=new THREE.Mesh(new THREE.BoxGeometry(0.032,0.026,0.15),blued);g.add(frame);const slide=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.032,0.172),exLam({color:0x26282c}));slide.position.set(0,0.028,-0.012);g.add(slide);EX.slide=slide;
  for(const z of[-0.09,0.064]){const s=new THREE.Mesh(new THREE.BoxGeometry(z<0?0.006:0.026,0.009,0.008),blued);s.position.set(0,0.048,z);g.add(s);}
  const gr=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.11,0.046),grip);gr.position.set(0,-0.058,0.055);gr.rotation.x=-0.24;g.add(gr);const tg=new THREE.Mesh(new THREE.TorusGeometry(0.018,0.003,4,10,Math.PI),blued);tg.position.set(0,-0.014,0.012);tg.rotation.set(0,PI_2,Math.PI);g.add(tg);
  const hand=new THREE.Mesh(new THREE.BoxGeometry(0.062,0.08,0.085),skin);hand.position.set(0.004,-0.062,0.07);hand.rotation.x=-0.24;g.add(hand);const thumb=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.018,0.06),skin);thumb.position.set(-0.026,-0.012,0.03);g.add(thumb);
  const hand2=new THREE.Mesh(new THREE.BoxGeometry(0.058,0.07,0.08),skin);hand2.position.set(-0.03,-0.075,0.065);hand2.rotation.set(-0.2,0.2,0.3);g.add(hand2);
  const sl=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.05,0.3,8),sleeve);sl.rotation.x=PI_2-0.45;sl.position.set(0.02,-0.16,0.24);g.add(sl);
  const ft=exTex(txFlash());const fm=new THREE.MeshBasicMaterial({map:ft,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});const f1=new THREE.Mesh(new THREE.PlaneGeometry(0.17,0.17),fm);f1.position.set(0,0.028,-0.13);const f2=f1.clone();f2.rotation.y=PI_2;g.add(f1,f2);EX.muzzle=[f1,f2];f1.visible=f2.visible=false;
  g.position.set(0.15,-0.16,-0.36);EX.cam.add(g);EX.gun=g;}
const PI_2=Math.PI/2;

/* ---------- overlay (2D screens, HUD, fades) */
function exBuildOverlay(){EX.ov=new THREE.Scene();EX.ovCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);const q=(mat)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);m.frustumCulled=false;EX.ov.add(m);return m;};
  EX.c2=mkCanvas(EXW,EXH);EX.c2t=exTex(EX.c2);EX.c2t.minFilter=THREE.LinearFilter;EX.c2t.generateMipmaps=false;EX.q2=q(new THREE.MeshBasicMaterial({map:EX.c2t,depthTest:false,depthWrite:false,toneMapped:false}));
  EX.hud=mkCanvas(EXW,EXH);EX.hudt=exTex(EX.hud);EX.hudt.minFilter=THREE.LinearFilter;EX.hudt.generateMipmaps=false;EX.qh=q(new THREE.MeshBasicMaterial({map:EX.hudt,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
  EX.qr=q(new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false}));EX.qf=q(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false}));}

/* ============================================================ CHARACTERS */
const LEN={up:0.29,fo:0.27,th:0.43,sh:0.42,to:0.46,nk:0.17};
const BONES={pelvis:{par:null},torso:{par:'pelvis',j:'hipM'},head:{par:'torso',j:'chest'},
  uArmL:{par:'torso',a:'shL',b:'elL',r:0.05,r2:0.043,j:'shL'},lArmL:{par:'uArmL',a:'elL',b:'wrL',r:0.043,r2:0.034,j:'elL'},uArmR:{par:'torso',a:'shR',b:'elR',r:0.05,r2:0.043,j:'shR'},lArmR:{par:'uArmR',a:'elR',b:'wrR',r:0.043,r2:0.034,j:'elR'},
  thighL:{par:'pelvis',a:'hipL',b:'knL',r:0.078,r2:0.058,j:'hipL'},shinL:{par:'thighL',a:'knL',b:'anL',r:0.058,r2:0.042,j:'knL'},thighR:{par:'pelvis',a:'hipR',b:'knR',r:0.078,r2:0.058,j:'hipR'},shinR:{par:'thighR',a:'knR',b:'anR',r:0.058,r2:0.042,j:'knR'}};
const BMASS={pelvis:11,torso:17,head:5,uArmL:2.4,lArmL:1.9,uArmR:2.4,lArmR:1.9,thighL:7.5,shinL:4.2,thighR:7.5,shinR:4.2};
const CONE={hipM:0.5,chest:0.65,shL:1.35,shR:1.35,elL:1.2,elR:1.2,hipL:1.0,hipR:1.0,knL:1.25,knR:1.25};
const LIMBS=['uArmL','lArmL','uArmR','lArmR','thighL','shinL','thighR','shinR'];
const _hvx=V3(),_hvy=V3(),_hvz=V3(),_hm4=new THREE.Matrix4();
function orientFwd(m,up,fwd){_hvy.copy(up).normalize();_hvx.crossVectors(_hvy,fwd);if(_hvx.lengthSq()<1e-6)_hvx.set(1,0,0);_hvx.normalize();_hvz.crossVectors(_hvx,_hvy);_hm4.makeBasis(_hvx,_hvy,_hvz);m.quaternion.setFromRotationMatrix(_hm4);}
function orientRight(m,up,right){_hvy.copy(up).normalize();_hvz.crossVectors(right,_hvy);if(_hvz.lengthSq()<1e-6)_hvz.set(0,0,1);_hvz.normalize();_hvx.crossVectors(_hvy,_hvz);_hm4.makeBasis(_hvx,_hvy,_hvz);m.quaternion.setFromRotationMatrix(_hm4);}
const nrm=(x,y,z)=>V3(x,y,z).normalize();const along=(a,d,l)=>a.clone().addScaledVector(d,l);
function exInitHumansShared(){EX.mat={};}
function partMat(H,name,canvas){const t=exTex(canvas);const m=exLam({map:t});H.cv[name]={c:canvas,x:canvas.getContext('2d'),t};return m;}
function cyl(r1,r2,L,mat){const g=new THREE.CylinderGeometry(r1,r2,L,8,2);return new THREE.Mesh(g,mat);}
function mkHuman(o){/* o: kind 'pris'|'sci', look */const H={o,kind:o.kind,alive:true,health:100,bleed:0,parts:{},cv:{},J:null,Jfrom:null,mode:o.mode,bw:1,kick:V3(),kv:V3(),group:new THREE.Group(),rag:false,cons:{},t:xr()*10,phase:xr()*6,watch:V3(0,1.6,3.3),walkAmt:0,walkPh:0,target:null,facing:0,act:'watch',actT:2+xr()*3,downed:false,screamT:0,hurt:0,headUp:0,headUpT:0,ff:o.kind==='pris'?1:0};
  H.group.position.copy(o.pos);H.group.rotation.y=o.rotY||0;H.facing=o.rotY||0;EX.scene.add(H.group);
  const C=o.cloth;const cloth=(n,w,h,extra)=>partMat(H,n,txCloth(w,h,C.base,C.rgb,extra||{}));const skinC=()=>txSkin(o.skin,o.skinRGB);
  const P=(name,mesh,L0,r)=>{const p={name,mesh,L0,r,hits:0,body:null,severed:false,gone:false,opened:false,H};mesh.userData.hp=p;mesh.traverse(ch=>ch.userData.hp=p);H.group.add(mesh);H.parts[name]=p;return p;};
  /* torso: tapered box */const tg=exTorsoGeo(o.kind,o.build);
  P('torso',new THREE.Mesh(tg,cloth('torso',128,128,o.kind==='pris'?{text:o.num||'0417',tx:64,font:'bold 22px monospace',ty:56,belt:true}:{coat:true})),LEN.to,0.19);
  P('pelvis',new THREE.Mesh(exPelvisGeo(o.build),partMat(H,'pelvis',txCloth(64,64,C.leg||C.base,C.legRGB||C.rgb))),0.2,0.16);
  if(o.coatSkirt){const sk=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.5,0.27),partMat(H,'skirt',txCloth(64,64,C.base,C.rgb)));sk.position.y=-0.3;H.parts.pelvis.mesh.add(sk);sk.userData.hp=H.parts.pelvis;}
  /* head */const head=new THREE.Group();const hm=exHeadBuild(H,o,head);
  const nose=new THREE.Mesh(new THREE.BoxGeometry(0.028,0.045,0.035),exLam({map:exTex(skinC())}));{const a=nose.geometry.attributes.position;for(let i=0;i<a.count;i++){if(a.getY(i)>0){a.setX(i,a.getX(i)*0.55);a.setZ(i,a.getZ(i)*0.6);}}nose.geometry.computeVertexNormals();}nose.position.set(0,-0.014,0.1);head.add(nose);
  const nkc=skinC();if(o.neckTat){const nx=nkc.getContext('2d');nx.strokeStyle='rgba(30,40,60,0.8)';nx.lineWidth=1.5;for(let i=0;i<6;i++){nx.beginPath();nx.moveTo(16,32);nx.lineTo(16+Math.cos(i)*14,32+Math.sin(i)*14);nx.stroke();}for(let r=5;r<15;r+=4){nx.beginPath();nx.arc(16,32,r,0,7);nx.stroke();}}const neck=cyl(0.048,0.055,0.12,exLam({map:exTex(nkc)}));neck.position.y=-0.105;head.add(neck);
  if(o.pony){const pt=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.012,0.16,6),exLam({color:new THREE.Color(o.face.hair||'#1a1410')}));pt.position.set(0,-0.02,-0.115);pt.rotation.x=0.35;head.add(pt);}
  if(o.hood){const hd=new THREE.Mesh(new THREE.SphereGeometry(0.135,10,8),exLam({map:exTex(txCloth(64,64,'#3a3328',[58,51,40]))}));hd.scale.set(0.95,1.25,1.05);hd.position.y=-0.01;head.add(hd);const tie=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.03,8),exLam({color:0x2a241c}));tie.position.y=-0.13;head.add(tie);H.hood=[hd,tie];}
  if(o.glasses){const gm=exLam({color:0x111111});for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.032,0.006),gm);r.position.set(s*0.038,0.012,0.104);head.add(r);}const br=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.006,0.006),gm);br.position.set(0,0.02,0.1);head.add(br);}
  if(o.hairMesh==='bob'){const hb=new THREE.Mesh(new THREE.SphereGeometry(0.118,10,8,0,Math.PI*2,0,Math.PI*0.62),exLam({color:0x2a1c14}));hb.scale.set(0.98,1.15,1.05);hb.position.set(0,0.01,-0.008);head.add(hb);const back=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.14,0.08),exLam({color:0x2a1c14}));back.position.set(0,-0.06,-0.07);head.add(back);}
  if(o.hairMesh==='mess'){const hb=new THREE.Mesh(new THREE.SphereGeometry(0.112,9,7,0,Math.PI*2,0,Math.PI*0.48),exLam({color:0x1c1612}));hb.scale.set(1,1.18,1.06);hb.position.set(0,0.015,-0.01);hb.rotation.x=-0.15;head.add(hb);}
  P('head',head,0.17,0.11);
  for(const n of LIMBS){const b=BONES[n];const arm=n.indexOf('Arm')>0;const L0=arm?(n[0]==='u'?LEN.up:LEN.fo):(n.startsWith('thigh')?LEN.th:LEN.sh);
    const m=new THREE.Mesh(exLimbGeo(n,b.r,b.r2,L0),partMat(H,n,arm?(o.kind==='pris'&&n.startsWith('lArm')?txSkin(o.skin,o.skinRGB):txCloth(64,64,C.base,C.rgb)):txCloth(64,64,C.leg||C.base,C.legRGB||C.rgb)));
    if(n.startsWith('lArm')){const hc=skinC();if(o.knuckles){const hx=hc.getContext('2d');hx.fillStyle='rgba(25,30,45,0.85)';hx.font='bold 9px monospace';const w=(n==='lArmL'?o.knuckles.slice(0,4):o.knuckles.slice(4,8));for(let i=0;i<4;i++)hx.fillText(w[i]||'',8+i*12,40);}const hand=exHandMesh(H,o,n,L0,hc);m.add(hand);
      if(o.kind==='pris'){const cuff=new THREE.Mesh(new THREE.TorusGeometry(0.038,0.007,4,10),exLam({color:0x9aa0a6}));cuff.rotation.x=PI_2;cuff.position.y=-L0/2+0.01;m.add(cuff);}
      if(o.kind==='sci'&&n==='lArmL'){const cb=new THREE.Group();const brd=new THREE.Mesh(new THREE.BoxGeometry(0.23,0.012,0.31),exLam({color:0x7a5532}));const pap=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.27),exLam({color:0xeeeee6}));pap.rotation.x=-PI_2;pap.position.y=0.0065;cb.add(brd,pap);cb.position.set(0.09,-L0/2-0.06,0.03);cb.rotation.set(0.2,0,-0.25);m.add(cb);cb.userData.clipOf=H;H.clip=cb;}
      if(o.kind==='sci'&&n==='lArmR'){const pen=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.13,5),exLam({color:0x223399}));pen.position.set(0,-L0/2-0.08,0.02);pen.rotation.x=0.6;m.add(pen);}}
    if(n.startsWith('shin')){const foot=exShoe(o,o.kind==='sci');m.add(foot);m.userData.foot=foot;}
    P(n,m,L0,b.r);}
  if(o.build&&o.build!==1){for(const n in H.parts){if(n==='head')continue;const m=H.parts[n].mesh;const k=n==='torso'||n==='pelvis'?o.build:Math.sqrt(o.build);m.scale.x*=k;m.scale.z*=k;H.parts[n].r*=k;}}
  exDress(H,o);H.mode=o.mode;H.J=exPose(H,0);H.Jfrom=null;exPlace(H);exSkinHuman(H);return H;}

/* --- poses: return joint positions in the human's local frame (+z = facing) */
function exPose(H,t){return H.kind==='pris'&&H.mode!=='walk'?poseKneel(H,t):poseStand(H,t);}
function poseKneel(H,t){const tm=H.temper,br=Math.sin(t*1.6+H.phase)*0.008+(tm==='praying'?Math.sin(t*2.2)*0.03:0),tr=(0.4+H.hurt*2.5+(tm==='laughing'&&H.laughT>0?6:0)+(tm==='pleading'?1.2:0))*(Math.sin(t*31)+Math.sin(t*19.3))*0.0016;const J={};
  J.knL=V3(-0.11,0.065,0.02);J.knR=V3(0.11,0.065,0.02);J.hipL=along(J.knL,nrm(0,1,-0.1),LEN.th);J.hipR=along(J.knR,nrm(0,1,-0.1),LEN.th);J.anL=along(J.knL,nrm(-0.05,0.01,-1),LEN.sh);J.anR=along(J.knR,nrm(0.05,0.01,-1),LEN.sh);
  J.hipM=J.hipL.clone().add(J.hipR).multiplyScalar(0.5);J.hipM.y+=0.06;const lean=0.3+br*2+H.hurt*0.25;J.chest=along(J.hipM,nrm(tr*20,1,lean),LEN.to);J.chest.y+=br;
  J.shL=J.chest.clone().add(V3(-0.19,-0.05,-0.025));J.shR=J.chest.clone().add(V3(0.19,-0.05,-0.025));J.elL=along(J.shL,nrm(-0.14,-0.72,-0.66),LEN.up);J.elR=along(J.shR,nrm(0.14,-0.72,-0.66),LEN.up);
  const cuff=V3(tr*4,J.hipM.y+0.07,J.hipM.z-0.21);J.wrL=along(J.elL,cuff.clone().add(V3(-0.035,0,0)).sub(J.elL).normalize(),LEN.fo);J.wrR=along(J.elR,cuff.clone().add(V3(0.035,0,0)).sub(J.elR).normalize(),LEN.fo);
  const up=H.headUp;J.head=along(J.chest,nrm(tr*8,lerp(0.4,0.97,up),lerp(0.92,0.22,up)),LEN.nk);const down=nrm(0,-0.86,0.5);const w=H.watch.clone().sub(J.head).normalize();J.look=down.lerp(w,up).normalize();J.ff=1;return J;}
function poseStand(H,t){const J={};const a=H.act;const br=Math.sin(t*1.5+H.phase)*0.006;let crouch=a==='cower'?1:(a==='hide'?0.55:0);const wa=H.walkAmt,wp=H.walkPh;
  const leg=(s)=>{const sw=wa*Math.sin(wp+(s<0?0:Math.PI))*0.42;const th=sw+crouch*1.35;const bend=crouch*2.5+wa*Math.max(0,Math.sin(wp+(s<0?0:Math.PI)+1.2))*0.7;const hip=V3(s*0.1,0,0);const kn=along(hip,V3(0,-Math.cos(th),Math.sin(th)),LEN.th);const ts=th-bend;const an=along(kn,V3(0,-Math.cos(ts),Math.sin(ts)),LEN.sh);return[hip,kn,an];};
  const[hL,kL,aL]=leg(-1),[hR,kR,aR]=leg(1);const low=Math.min(aL.y,aR.y);const lift=0.075-low+(wa?Math.abs(Math.sin(wp*2))*0.02:0);for(const v of[hL,kL,aL,hR,kR,aR])v.y+=lift;J.hipL=hL;J.knL=kL;J.anL=aL;J.hipR=hR;J.knR=kR;J.anR=aR;
  J.hipM=hL.clone().add(hR).multiplyScalar(0.5);J.hipM.y+=0.06;const fwdLean=0.04+crouch*0.55+(a==='write'?0.08:0)+(a==='away'?0.12:0)+(a==='tap'?0.1:0);J.chest=along(J.hipM,nrm(0,1,fwdLean),LEN.to);J.chest.y+=br;
  J.shL=J.chest.clone().add(V3(-0.2,-0.05,0));J.shR=J.chest.clone().add(V3(0.2,-0.05,0));const sL=J.shL,sR=J.shR;
  const armTo=(sh,el,tgt)=>{const e=along(sh,el.normalize(),LEN.up);return[e,along(e,tgt.clone().sub(e).normalize(),LEN.fo)];};
  let eL,wL,eR,wR;J.head=along(J.chest,nrm(0,1,0.12+crouch*0.6),LEN.nk);
  if(a==='cower'||a==='hide'){[eL,wL]=armTo(sL,V3(-0.5,0.35,0.75),J.head.clone().add(V3(0.04,0.14,0.08)));[eR,wR]=armTo(sR,V3(0.5,0.35,0.75),J.head.clone().add(V3(-0.04,0.14,0.08)));}
  else if(a==='handsup'){[eL,wL]=armTo(sL,V3(-0.7,0.35,0.35),sL.clone().add(V3(-0.2,0.6,0.1)));[eR,wR]=armTo(sR,V3(0.7,0.35,0.35),sR.clone().add(V3(0.2,0.6,0.1)));wL.x+=Math.sin(t*14)*0.01;wR.x+=Math.sin(t*15)*0.01;}
  else if(a==='door'){[eL,wL]=armTo(sL,V3(-0.1,-0.7,0.6),sL.clone().add(V3(0.05,-0.2,0.5)));[eR,wR]=armTo(sR,V3(0.1,-0.4,1),sR.clone().add(V3(0.02,-0.25,0.55+Math.sin(t*22)*0.03)));}
  else if(H.kind==='pris'){const cf=J.hipM.clone().add(V3(0,0.06,-0.2));[eL,wL]=armTo(sL,V3(-0.25,-0.9,-0.35),cf.clone().add(V3(-0.03,0,0)));[eR,wR]=armTo(sR,V3(0.25,-0.9,-0.35),cf.clone().add(V3(0.03,0,0)));}
  else{[eL,wL]=armTo(sL,V3(-0.06,-1,0.3),sL.clone().add(V3(0.17,-0.32,0.34)));
    if(a==='tap'){[eR,wR]=armTo(sR,V3(0.15,-0.2,1),sR.clone().add(V3(-0.05,0.08,0.52+Math.max(0,Math.sin(t*13))*0.05)));}
    else if(a==='away'){[eR,wR]=armTo(sR,V3(0.3,-0.75,0.55),J.head.clone().add(V3(0.01,-0.07,0.1)));}
    else{[eR,wR]=armTo(sR,V3(0.07,-1,0.24),sR.clone().add(V3(-0.2,-0.26,0.34)).add(a==='write'?V3(Math.sin(t*9)*0.015,Math.cos(t*7)*0.01,0):V3()));}}
  J.elL=eL;J.wrL=wL;J.elR=eR;J.wrR=wR;
  let look;if(a==='write')look=wL.clone().sub(J.head).normalize();else if(a==='away')look=nrm(-0.9,-0.35,0.2);else if(a==='nod')look=nrm(0,-0.3+Math.sin(t*5)*0.25,1);else if(a==='cower'||a==='hide')look=nrm(0,-0.7,0.7);else if(a==='door')look=nrm(0.3,0,1);else look=H.watch.clone().sub(J.head).normalize();
  J.look=look;J.ff=0;return J;}
function cloneJ(J){const o={};for(const k in J)o[k]=(J[k]&&J[k].isVector3)?J[k].clone():J[k];return o;}
function lerpJ(a,b,w){const o={};for(const k in b){if(b[k]&&b[k].isVector3)o[k]=a[k]?a[k].clone().lerp(b[k],w):b[k].clone();else o[k]=a[k]!==undefined?lerp(a[k],b[k],w):b[k];}return o;}
function exSetAct(H,a){if(H.act===a)return;H.Jfrom=cloneJ(H.J);H.bw=0;H.act=a;}
function exAnimate(H,dt){if(H.rag)return;H.t+=dt;let J=exPose(H,H.t);if(H.Jfrom){H.bw=Math.min(1,H.bw+dt/0.35);const e=H.bw*H.bw*(3-2*H.bw);J=lerpJ(H.Jfrom,J,e);if(H.bw>=1)H.Jfrom=null;}
  /* hit reaction spring */H.kv.addScaledVector(H.kick,-90*dt);H.kv.multiplyScalar(Math.exp(-dt*9));H.kick.addScaledVector(H.kv,dt);const k=H.kick;
  for(const [n,w] of[['chest',1],['head',1.25],['shL',0.95],['shR',0.95],['elL',0.7],['elR',0.7],['wrL',0.5],['wrR',0.5],['hipM',0.2]])if(J[n])J[n].addScaledVector(k,w);
  H.J=J;exPlace(H);}
function exPlace(H){const J=H.J,P=H.parts;const right=J.shR.clone().sub(J.shL);const fwd=V3(0,0,1);
  if(!P.torso.body){const m=P.torso.mesh;m.position.copy(J.chest).add(J.hipM).multiplyScalar(0.5);const up=J.chest.clone().sub(J.hipM);orientRight(m,up,right);m.scale.y=up.length()/LEN.to;}
  if(!P.pelvis.body){const m=P.pelvis.mesh;const c=J.hipL.clone().add(J.hipR).multiplyScalar(0.5);c.y+=0.03;m.position.copy(c);orientRight(m,J.chest.clone().sub(J.hipM),J.hipR.clone().sub(J.hipL));}
  if(!P.head.body&&!P.head.gone){const m=P.head.mesh;m.position.copy(J.head);orientFwd(m,J.head.clone().sub(J.chest),J.look);}
  for(const n of LIMBS){const p=P[n];if(p.body||p.gone)continue;const b=BONES[n];const A=J[b.a],B=J[b.b];const m=p.mesh;m.position.copy(A).add(B).multiplyScalar(0.5);const up=A.clone().sub(B);const L=up.length();up.normalize();let hint=fwd;if(n.startsWith('shin')&&Math.abs(up.z)>0.75)hint=V3(0,-1,0);else if(Math.abs(up.z)>0.8)hint=V3(0,1,0);orientFwd(m,up,hint);m.scale.y=L/p.L0;
    const f=m.userData.foot;if(f){const ff=J.ff||0;f.position.set(0,-p.L0/2-lerp(0.035,0.1,ff),lerp(0.065,0,ff));f.rotation.x=ff*PI_2;}}}

/* --- ragdolls */
const JLINK=[['pelvis','torso','hipM'],['torso','head','chest'],['torso','uArmL','shL'],['uArmL','lArmL','elL'],['torso','uArmR','shR'],['uArmR','lArmR','elR'],['pelvis','thighL','hipL'],['thighL','shinL','knL'],['pelvis','thighR','hipR'],['thighR','shinR','knR']];
const _hwq=new THREE.Quaternion(),_hwp=V3(),_hws=V3();
function exRagdoll(H){if(H.rag)return;H.rag=true;H.ragAt=EX.pt;H.group.updateMatrixWorld(true);const Jw={};for(const k in H.J)if(H.J[k]&&H.J[k].isVector3&&k!=='look')Jw[k]=H.group.localToWorld(H.J[k].clone());
  for(const n in H.parts){const p=H.parts[n];if(p.gone)continue;const m=p.mesh;m.updateMatrixWorld(true);m.matrixWorld.decompose(_hwp,_hwq,_hws);EX.scene.attach(m);
    let shape;if(n==='head')shape=new CANNON.Sphere(0.105);else if(n==='torso')shape=new CANNON.Box(new CANNON.Vec3(0.17,LEN.to*m.scale.y/2,0.105));else if(n==='pelvis')shape=new CANNON.Box(new CANNON.Vec3(0.16,0.1,0.105));else shape=new CANNON.Box(new CANNON.Vec3(p.r*0.9,p.L0*m.scale.y/2,p.r*0.9));
    const b=new CANNON.Body({mass:BMASS[n]});b.addShape(shape);b.position.set(_hwp.x,_hwp.y,_hwp.z);b.quaternion.set(_hwq.x,_hwq.y,_hwq.z,_hwq.w);b.linearDamping=0.06;b.angularDamping=0.6;b.collisionFilterGroup=2;b.collisionFilterMask=1;b.allowSleep=true;b.sleepSpeedLimit=0.15;b.sleepTimeLimit=0.8;/* v7.0: thin limbs get a floor on their inertia (an arm spinning on its own axis at 100 rad/s was the buzzing) */{const I=b.inertia,mn=(BMASS[n]||1)*0.006;I.set(Math.max(I.x,mn),Math.max(I.y,mn),Math.max(I.z,mn));b.invInertia.set(1/I.x,1/I.y,1/I.z);b.updateInertiaWorld(true);}EX.world.addBody(b);p.body=b;}
  for(const [a,b,k] of JLINK){const A=H.parts[a],B=H.parts[b];if(!A.body||!B.body||B.severed||!Jw[k])continue;const pw=Jw[k];const pa=A.body.pointToLocalFrame(new CANNON.Vec3(pw.x,pw.y,pw.z)),pb=B.body.pointToLocalFrame(new CANNON.Vec3(pw.x,pw.y,pw.z));
    const by=B.body.quaternion.vmult(new CANNON.Vec3(0,1,0));const axA=A.body.quaternion.inverse().vmult(by);
    const c=new CANNON.ConeTwistConstraint(A.body,B.body,{pivotA:pa,pivotB:pb,axisA:axA,axisB:new CANNON.Vec3(0,1,0),angle:CONE[k],twistAngle:0.5,collideConnected:false});EX.world.addConstraint(c);H.cons[k]=c;}
  if(H.kind==='pris'&&H.parts.lArmL.body&&H.parts.lArmR.body&&Jw.wrL){const mid=Jw.wrL.clone().add(Jw.wrR).multiplyScalar(0.5);const v=new CANNON.Vec3(mid.x,mid.y,mid.z);const c=new CANNON.PointToPointConstraint(H.parts.lArmL.body,H.parts.lArmL.body.pointToLocalFrame(v),H.parts.lArmR.body,H.parts.lArmR.body.pointToLocalFrame(v),140);/* v7.0: soft cuffs (2000 fought the elbows and buzzed) */EX.world.addConstraint(c);H.cons.cuff=c;}}
function exSyncRag(H){if(!H.rag)return;for(const n in H.parts){const p=H.parts[n];if(!p.body||p.gone)continue;p.mesh.position.copy(p.body.position);p.mesh.quaternion.copy(p.body.quaternion);}}
/* v7.0: a body that has stopped moving goes to sleep and stays there (limbs at their joint limits used to buzz forever); a shot or a kick wakes it */
function exRagSettle(H,dt){if(!H.rag||H.frozen)return;for(const n in H.parts){const b=H.parts[n].body;if(b&&b.sleepState!==2){const w=b.angularVelocity.length();if(w>18)b.angularVelocity.scale(18/w,b.angularVelocity);}}/* judged on the trunk: a wrist buzzing at its joint limit (or on the cuffs) never lets the whole body read as still */let core=0,any=false;for(const n of['torso','pelvis','head']){const P_=H.parts[n];const b=P_&&!P_.severed&&P_.body;if(!b)continue;any=true;if(b.sleepState!==2)core=Math.max(core,b.velocity.length(),b.angularVelocity.length()*0.12);}
  if(!any||core===0&&H.settledOnce){H.awakeT=0;return;}H.awakeT=(H.awakeT||0)+dt;if(core<0.15)H.still=(H.still||0)+dt;else H.still=0;/* a limb wedged in the floor or a desk can keep the trunk twitching forever: 2.5 s awake and no longer falling is long enough */if(H.still>(H.settledOnce?0.6:1.2)||(H.awakeT>2.5&&core<0.8)){H.awakeT=0;H.settledOnce=true;H.still=0;for(const n in H.parts){const P_=H.parts[n];const b=P_.body;if(b&&!P_.severed){b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);b.angularDamping=0.85;b.sleep();}}}}
function exImpulse(p,dir,mag,pt){if(!p.body)return;const b=p.body;b.wakeUp();const rel=new CANNON.Vec3(pt.x-b.position.x,pt.y-b.position.y,pt.z-b.position.z);b.applyImpulse(new CANNON.Vec3(dir.x*mag,dir.y*mag,dir.z*mag),rel);}
/* exCap → p8g */
function exBleed(mesh,pw,dirOut,dur,rate){mesh.updateMatrixWorld(true);const lp=mesh.worldToLocal(pw.clone());const q=mesh.getWorldQuaternion(new THREE.Quaternion()).invert();EX.bleeds.push({mesh,lp,ld:dirOut.clone().applyQuaternion(q).normalize(),t:0,dur,rate});}
function exUpdateBleeds(dt){for(let i=EX.bleeds.length-1;i>=0;i--){const b=EX.bleeds[i];b.t+=dt;if(b.t>b.dur||!b.mesh.parent){EX.bleeds.splice(i,1);continue;}const k=1-b.t/b.dur;const pulse=0.4+0.6*Math.max(0,Math.sin(b.t*8));const n=Math.round(b.rate*k*pulse*dt*60);if(n<=0)continue;b.mesh.updateMatrixWorld(true);const p=b.mesh.localToWorld(b.lp.clone());const d=b.ld.clone().applyQuaternion(b.mesh.getWorldQuaternion(new THREE.Quaternion()));exEmit(p,d,n,2.2*k+0.6,0.5,0,BLOOD);}}
function jointOf(n){return BONES[n].j;}
function exSever(H,n,dir,pt){const p=H.parts[n];if(!p||p.severed||p.gone||!BONES[n].par)return false;if(!H.rag){exRagdoll(H);}const k=jointOf(n);const c=H.cons[k];const par=H.parts[BONES[n].par];if(!p.body||!par.body)return false;
  let pw;if(c){pw=V3();const v=c.bodyA===par.body?c.pivotA:c.pivotB;const w=par.body.pointToWorldFrame(v);pw.set(w.x,w.y,w.z);EX.world.removeConstraint(c);delete H.cons[k];}else pw=V3(p.body.position.x,p.body.position.y,p.body.position.z);
  p.severed=true;exSkinSever(H,n);const out=V3(p.body.position.x,p.body.position.y,p.body.position.z).sub(pw).normalize();exCap(par.mesh,pw,out,p.r);exCap(p.mesh,pw,out.clone().negate(),p.r);exBleed(par.mesh,pw,out,H.alive?6:2.5,H.alive?9:4);exBleed(p.mesh,pw,out.clone().negate(),1.6,3);
  exImpulse(p,dir.clone().add(V3(0,0.5,0)).normalize(),(n.startsWith('thigh')?40:16),pt);exEmit(pw,out,40,3,1.0,0,BLOOD);EXA.wet(1.2);return true;}
function exBurstHead(H,dir,pt){const p=H.parts.head;if(p.gone||(H.rag&&!p.body))return;if(!H.rag)exRagdoll(H);const c=H.cons.chest;const tor=H.parts.torso;let pw=V3(p.body.position.x,p.body.position.y,p.body.position.z);if(c){const v=c.bodyA===tor.body?c.pivotA:c.pivotB;const w=tor.body.pointToWorldFrame(v);pw.set(w.x,w.y,w.z);EX.world.removeConstraint(c);delete H.cons.chest;}
  const hp=V3(p.body.position.x,p.body.position.y,p.body.position.z);EX.world.removeBody(p.body);p.body=null;p.gone=true;p.mesh.visible=false;if(p.mesh.parent)p.mesh.parent.remove(p.mesh);
  const up=hp.clone().sub(pw).normalize();exCap(tor.mesh,pw,up,0.055);exBleed(tor.mesh,pw,up,5,10);exEmit(hp,dir,90,4.5,1.4,0,BLOOD);exEmit(hp,dir,20,2,2,1,[0.55,0.1,0.1]);
  const cols=[0xe6dccb,0x7a0c0c,0xa83a3a,0xc59a80];for(let i=0;i<7;i++){const s=0.025+xr()*0.035;const m=new THREE.Mesh(new THREE.BoxGeometry(s,s*0.8,s*1.2),exLam({color:cols[i%4]}));m.position.copy(hp);EX.scene.add(m);const b=new CANNON.Body({mass:0.15});b.addShape(new CANNON.Box(new CANNON.Vec3(s/2,s*0.4,s*0.6)));b.position.set(hp.x,hp.y,hp.z);b.collisionFilterGroup=2;b.collisionFilterMask=1;b.linearDamping=0.1;EX.world.addBody(b);const v=dir.clone().multiplyScalar(2+xr()*3).add(V3((xr()-0.5)*3,1+xr()*2,(xr()-0.5)*3));b.velocity.set(v.x,v.y,v.z);b.angularVelocity.set((xr()-0.5)*20,(xr()-0.5)*20,(xr()-0.5)*20);EX.gibs.push({m,b});}
  exSplatFrom(hp,dir,0.5);EXA.wet(1.8);}
/* exOpenTorso → p8g */
function exWound(p,uv,big){const cv=p.H.cv[p.name];if(!cv||!uv)return;const W=cv.c.width,Hh=cv.c.height,x=cv.x;const px=uv.x*W,py=(1-uv.y)*Hh;const r=(big?6:3.5)*W/64;
  x.fillStyle='rgba(120,8,10,0.85)';for(let i=0;i<7;i++){const a=xr()*7,d=r*(0.6+xr()*1.4);x.beginPath();x.arc(px+Math.cos(a)*d,py+Math.sin(a)*d,r*0.35*(0.5+xr()),0,7);x.fill();}
  x.fillStyle='#5a0406';x.beginPath();x.arc(px,py,r*0.9,0,7);x.fill();x.fillStyle='#1a0000';x.beginPath();x.arc(px,py,r*0.42,0,7);x.fill();x.fillStyle='rgba(110,6,8,0.7)';x.fillRect(px-r*0.25,py,r*0.5,r*(2+xr()*3));cv.t.needsUpdate=true;}
function exSplatFrom(p,dir,size){EX.ray2.set(p.clone().addScaledVector(dir,0.03),dir);EX.ray2.far=3.6;const hs=EX.ray2.intersectObjects(EX.envMeshes.concat(EX.glassBroken?[]:[EX.glass]),false);for(const h of hs){const s=EX.surfs.get(h.object);if(s&&h.uv){splatAt(s,h.uv.x,h.uv.y,size*(1-h.distance/4.5),dir);}break;}}
/* exPool → p8g */
function exUpdatePools(dt){for(const p of EX.pools){if(p.r<p.target){p.r+=dt*0.055*(p.target-p.r+0.15);p.m.scale.setScalar(p.r*2);}}}
