
/* ============================================================ SCENE / RENDERER / PHYSICS */
const canvas=document.getElementById('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
/* v5.5: touch devices start in a phone quality tier (P cycles phone → full → performance) */
const TOUCH_ON=true;
const TOUCH=TOUCH_ON&&(()=>{try{return(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||(('ontouchstart' in window)&&navigator.maxTouchPoints>0);}catch(e){return false;}})();let QTIER=TOUCH?'phone':'full';
const QUALITY={pr:Math.min(devicePixelRatio,TOUCH?1.5:2)};renderer.setPixelRatio(QUALITY.pr);renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.95;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=false;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b0d12);scene.fog=new THREE.FogExp2(0x101216,0.018);
const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,0.05,80);
const vmCamera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.01,5);
const yawObj=new THREE.Object3D(),pitchObj=new THREE.Object3D();yawObj.add(pitchObj);pitchObj.add(camera);scene.add(yawObj);
const vmScene=new THREE.Scene();
addEventListener('resize',()=>{camera.aspect=vmCamera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();vmCamera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});
world.broadphase=new CANNON.SAPBroadphase(world);world.broadphase.useBoundingBoxes=true;world.collisionMatrix=new CANNON.ObjectCollisionMatrix();world.collisionMatrixPrevious=new CANNON.ObjectCollisionMatrix();world.allowSleep=true;world.solver.iterations=8;world.defaultContactMaterial.friction=0.45;world.defaultContactMaterial.restitution=0.08;world.defaultContactMaterial.contactEquationStiffness=4e7;world.defaultContactMaterial.contactEquationRelaxation=4;
const matPlayer=new CANNON.Material('player');const matDefault=world.defaultMaterial;world.addContactMaterial(new CANNON.ContactMaterial(matPlayer,matDefault,{friction:0.0,restitution:0}));
const S=new SoundEngine();const P=new Particles(scene,3500);
const hitRoot=new THREE.Group();scene.add(hitRoot);
const ents=[];const dynamics=[];const asms=[];let power=true;
const FLOOR_Y=0.012;/* top of floating floor */
/* v6: the villa (p9v) was built behind ?villa while it was finished. v8.0 (WS8): moved in — the villa is the default, ?bedsit builds the old flat */
const VILLA=(()=>{try{if(window.__VILLA)return true;return !(window.__BEDSIT||/[?&]bedsit\b/i.test(location.search));}catch(e){return true;}})(); /* v8.0: moved in. The villa is home; ?bedsit is the old flat (and ?villa links still land here) */
/* optional BVH acceleration */
let BVH=null;try{BVH=await import('three-mesh-bvh');THREE.Mesh.prototype.raycast=BVH.acceleratedRaycast;THREE.BufferGeometry.prototype.computeBoundsTree=BVH.computeBoundsTree;THREE.BufferGeometry.prototype.disposeBoundsTree=BVH.disposeBoundsTree;}catch(e){BVH=null;}
function bvh(geo){if(BVH&&geo.attributes.position.count>60){try{geo.computeBoundsTree({indirect:true});}catch(e){try{geo.computeBoundsTree();}catch(e2){}}}return geo;}

/* ============================================================ MATERIALS */
const gypsumTex=mkTex(texGypsum(),4,4);const timberTex=mkTex(texTimber(),1,1);const pineTex=mkTex(texPine(),1,1);const chipTex=mkTex(texChip(),1,1);const melTex=mkTex(texMelamine(),1,1);const melWhite=mkTex(texMelamine(256,256,'#f1f0ea'),1,1);const benchTex=mkTex(texLaminateBench(),1,1);const brickTex=mkTex(texBrick(),1,1);const mortarTex=mkTex(texMortar(),6,6);const foamTex=mkTex(texFoam(),1,1);const metalTex=mkTex(texMetal(),1,1);const terraTex=mkTex(texTerra(),1,1);const fabricTex=mkTex(texFabric([74,78,84]),2,2);const fabricTex2=mkTex(texFabric([160,140,112]),2,2);const linenTex=mkTex(texLinen(),1,1);const rugTex=mkTex(texRug(),1,1);
const M={
  gypsum:new THREE.MeshStandardMaterial({map:gypsumTex,roughness:1}),
  gypsumBack:new THREE.MeshStandardMaterial({color:0x8e8b84,roughness:1}),
  cement:new THREE.MeshStandardMaterial({color:0xa7a39a,roughness:1}),
  timber:new THREE.MeshStandardMaterial({map:timberTex,roughness:0.9}),
  pine:new THREE.MeshStandardMaterial({map:pineTex,roughness:0.85}),
  chip:new THREE.MeshStandardMaterial({map:chipTex,roughness:0.85}),
  mel:new THREE.MeshStandardMaterial({map:melTex,roughness:0.5}),
  melWhite:new THREE.MeshStandardMaterial({map:melWhite,roughness:0.42}),
  bench:new THREE.MeshStandardMaterial({map:benchTex,roughness:0.45}),
  brick:new THREE.MeshStandardMaterial({map:brickTex,roughness:0.95}),
  mortar:new THREE.MeshStandardMaterial({map:mortarTex,roughness:1}),
  foam:new THREE.MeshStandardMaterial({map:foamTex,roughness:1}),
  linen:new THREE.MeshStandardMaterial({map:linenTex,roughness:1}),
  fabric:new THREE.MeshStandardMaterial({map:fabricTex,roughness:1}),
  fabric2:new THREE.MeshStandardMaterial({map:fabricTex2,roughness:1}),
  rug:new THREE.MeshStandardMaterial({map:rugTex,roughness:1}),
  metal:new THREE.MeshStandardMaterial({map:metalTex,roughness:0.35,metalness:0.8}),
  darkMetal:new THREE.MeshStandardMaterial({color:0x3a3c3e,roughness:0.5,metalness:0.7}),
  chrome:new THREE.MeshStandardMaterial({color:0xdde2e6,roughness:0.15,metalness:1}),
  copper:new THREE.MeshStandardMaterial({color:0xb5652a,roughness:0.35,metalness:0.9}),
  pvc:new THREE.MeshStandardMaterial({color:0xd9d4c2,roughness:0.6}),
  yellow:new THREE.MeshStandardMaterial({color:0xd9c21a,roughness:0.6}),
  tps:new THREE.MeshStandardMaterial({color:0xe6e6e0,roughness:0.6}),
  ceramic:new THREE.MeshStandardMaterial({color:0xeeeae0,roughness:0.25}),
  ceramic2:new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:0.35}),
  china:new THREE.MeshStandardMaterial({color:0xf4f3ee,roughness:0.12}),
  plastic:new THREE.MeshStandardMaterial({color:0x2b2b2d,roughness:0.6}),
  beige:new THREE.MeshStandardMaterial({color:0xd5cfb8,roughness:0.7}),
  glass:new THREE.MeshPhysicalMaterial({color:0xd6e4ea,roughness:0.05,metalness:0,transparent:true,opacity:0.28,transmission:0,side:THREE.DoubleSide}),
  mirror:new THREE.MeshStandardMaterial({color:0xcfd6dd,roughness:0.08,metalness:1}),
  tube:new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xf0f6ff,emissiveIntensity:2.2,roughness:0.3}),
  terra:new THREE.MeshStandardMaterial({map:terraTex,roughness:0.9}),
  black:new THREE.MeshStandardMaterial({color:0x111111,roughness:0.9}),
  leaf:new THREE.MeshStandardMaterial({color:0x3f6b2e,roughness:0.8,side:THREE.DoubleSide}),
  soil:new THREE.MeshStandardMaterial({color:0x3a2a1c,roughness:1}),
  curtain:new THREE.MeshStandardMaterial({color:0xf2eee6,roughness:1,transparent:true,opacity:0.55,side:THREE.DoubleSide}),
  acrylic:new THREE.MeshStandardMaterial({color:0xf6f6f2,roughness:0.2}),
  oakTop:new THREE.MeshStandardMaterial({map:pineTex,roughness:0.6}),
  scorch:new THREE.MeshBasicMaterial({color:0x111111}),
  kerf:new THREE.MeshBasicMaterial({color:0x0c0a08}),
  batt:new THREE.MeshStandardMaterial({map:mkTex(texBatt(),1,1),roughness:1}),
  trim:new THREE.MeshStandardMaterial({color:0xe2dccb,roughness:0.55}),
  nail:new THREE.MeshStandardMaterial({color:0x6e6a64,roughness:0.45,metalness:0.85})
};

/* ============================================================ ENTITY SYSTEM */
/* ============================================================ STATIC BATCHING (one draw call per material for everything that isn't moving) */
const BATCHES=new Map();const batchDirty=new Set();let BATCH_LIVE=false;/* after the first build, batches never rebuild: leaving ents are hidden in place, new static ents keep their own mesh */
class StaticBatch{constructor(mat){this.mat=mat;this.members=new Set();this.mesh=null;this.ranges=new Map();}
  rebuild(){if(this.mesh){hitRoot.remove(this.mesh);this.mesh.geometry.dispose();this.mesh=null;}this.ranges.clear();const items=[];let total=0;const _n=new THREE.Matrix3();
    for(const e of this.members){if(!e.alive||!e.mesh)continue;e.mesh.updateMatrixWorld(true);e.mesh.traverse(o=>{if(!o.isMesh||!o.visible||o.material!==this.mat||!o.geometry.attributes.position)return;let p=o;let vis=true;while(p&&p!==e.mesh){if(!p.visible){vis=false;break;}p=p.parent;}if(!vis)return;const g=o.geometry;const n=g.index?g.index.count:g.attributes.position.count;items.push({e,o,g,n});total+=n;});}
    if(!total)return;const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2);const map=new Int32Array(total/3);const col=this.mat.vertexColors?new Float32Array(total*3):null;const rmA=this.mat.userData.rm?new Float32Array(total*2):null;let k=0;const v=new THREE.Vector3();
    for(const it of items){const g=it.g,P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,idx=g.index;const mw=it.o.matrixWorld;_n.getNormalMatrix(mw);const start=k;for(let i=0;i<it.n;i++){const si=idx?idx.getX(i):i;v.set(P.getX(si),P.getY(si),P.getZ(si)).applyMatrix4(mw);pos[k*3]=v.x;pos[k*3+1]=v.y;pos[k*3+2]=v.z;if(N){v.set(N.getX(si),N.getY(si),N.getZ(si)).applyMatrix3(_n).normalize();}else v.set(0,1,0);nor[k*3]=v.x;nor[k*3+1]=v.y;nor[k*3+2]=v.z;if(U){uv[k*2]=U.getX(si);uv[k*2+1]=U.getY(si);}if(col){const cc=it.o.userData.vcCol;col[k*3]=cc?cc.r:1;col[k*3+1]=cc?cc.g:1;col[k*3+2]=cc?cc.b:1;}if(rmA){const om=it.o.userData.origMat;rmA[k*2]=om?om.roughness:1;rmA[k*2+1]=om?om.metalness:0;}if(i%3===0)map[(k/3)|0]=it.e.id;k++;}let r=this.ranges.get(it.e);if(!r){r=[];this.ranges.set(it.e,r);}r.push([start,it.n]);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)geo.setAttribute('color',new THREE.BufferAttribute(col,3));if(rmA)geo.setAttribute('rm',new THREE.BufferAttribute(rmA,2));geo.computeBoundingSphere();geo.computeBoundingBox();bvh(geo);let fmap=map;if(geo.index){const ia=geo.index.array;fmap=new Int32Array(ia.length/3);for(let t=0;t<fmap.length;t++)fmap[t]=map[(ia[t*3]/3)|0];}
    const m=new THREE.Mesh(geo,this.mat);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=true;m.userData.batch=this;m.userData.triMap=fmap;this.mesh=m;hitRoot.add(m);}
  hide(e){/* collapse this ent's triangles to a point: zero-area tris neither render nor raycast, and stay inside the BVH bounds, so no refit */const rs=this.ranges.get(e);this.members.delete(e);if(!rs||!this.mesh)return;this.ranges.delete(e);const pa=this.mesh.geometry.attributes.position;const A=pa.array;for(const [st,n] of rs){const x=A[st*3],y=A[st*3+1],z=A[st*3+2];for(let i=st;i<st+n;i++){A[i*3]=x;A[i*3+1]=y;A[i*3+2]=z;}pa.addUpdateRange(st*3,n*3);}pa.needsUpdate=true;SHADOW.dirty=true;}}
const entById=new Map();
function canBatch(e){if(!e.mesh||e.dynamic||e.noBatch)return false;let ok=true;e.mesh.traverse(o=>{if(o.isLight)ok=false;if(o.isMesh&&Array.isArray(o.material))ok=false;});return ok;}
/* v6.9: in the villa, plain materials that look the same share one batch (every prop used to bring its own material, and every material is a house-wide draw call) */
/* v8.0: roughness and metalness ride on the vertices (attribute rm), so painted things of every finish share one material */
function rmPatch(c){c.userData.rm=true;c.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 rm;\nvarying vec2 vRM;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRM = rm;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vRM;').replace('#include <roughnessmap_fragment>','float roughnessFactor = vRM.x;').replace('#include <metalnessmap_fragment>','float metalnessFactor = vRM.y;');};c.customProgramCacheKey=()=>'rm';return c;}
const CANON=new Map();function canonMat(m){if(!VILLA||!m.isMeshStandardMaterial||m.map||m.emissiveMap||m.alphaMap||m.normalMap||m.roughnessMap||m.metalnessMap||m.bumpMap||m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile)return m;if(m.emissive&&m.emissive.getHex()!==0&&m.emissiveIntensity>0)return m;
  if(m.vertexColors||m.wireframe)return m;const q=v=>Math.round(v*10)/10;const k=[m.transparent?1:0,m.transparent?m.opacity.toFixed(1):1,m.side,m.flatShading?1:0,m.depthWrite?1:0].join('|');let c=CANON.get(k);
  if(!c){c=rmPatch(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,metalness:0,transparent:m.transparent,opacity:m.transparent?+m.opacity.toFixed(1):1,side:m.side,flatShading:m.flatShading,depthWrite:m.depthWrite}));c.userData.canon=true;CANON.set(k,c);}return c;}
function batchEnt(e){if(BATCH_LIVE||e.batched||!canBatch(e))return;e.mesh.updateMatrixWorld(true);const mats=new Set();e.mesh.traverse(o=>{if(o.isMesh&&o.material&&!Array.isArray(o.material)){const c=canonMat(o.material);if(c!==o.material){o.userData.origMat=o.material;o.userData.vcCol=o.material.color.clone();o.material=c;}mats.add(o.material);}});if(!mats.size)return;for(const m of mats){let b=BATCHES.get(m);if(!b){b=new StaticBatch(m);BATCHES.set(m,b);}b.members.add(e);batchDirty.add(b);}e.batched=true;e.batchMats=mats;hitRoot.remove(e.mesh);}
function unbatchEnt(e){if(!e.batched)return;for(const m of e.batchMats){const b=e.batchRef||BATCHES.get(m);if(b)b.hide(e);}if(e.mesh)e.mesh.traverse(o=>{if(o.userData&&o.userData.origMat){o.material=o.userData.origMat;o.userData.origMat=null;}});e.batched=false;e.batchMats=null;e.batchRef=null;if(e.alive&&e.mesh&&e.mesh.parent!==hitRoot)hitRoot.add(e.mesh);}
function rebatchEnt(e){/* geometry of a static ent changed: give it its own mesh again */unbatchEnt(e);}
let batchPending=[];
function flushBatches(){if(batchPending.length){for(const e of batchPending){if(e.alive&&!e.dynamic)batchEnt(e);}batchPending=[];}if(batchDirty.size){for(const b of batchDirty)b.rebuild();batchDirty.clear();}}

const ENTID={n:0};
function registerBody(b){b.material=b.material||matDefault;b.aabbNeedsUpdate=true;b.updateAABB();world.addBody(b);}
function ensureBody(e){if(!e.body&&e.mkBody){e.body=e.mkBody();e.body.ent=e;registerBody(e.body);}return e.body;}
function mkEnt(o){const e=Object.assign({id:ENTID.n++,kind:'prop',mat:'chip',mass:1,hp:3,dynamic:false,anchored:true,bonds:new Set(),screws:[],joints:[],asm:null,restsOn:null,dependents:[],drawable:null,alive:true,born:now,label:''},o);ents.push(e);entById.set(e.id,e);if(e.mesh){e.mesh.userData.ent=e;if(!e.dormant){hitRoot.add(e.mesh);if(!e.dynamic)batchPending.push(e);}}if(e.body){e.body.ent=e;if(!e.dormant)registerBody(e.body);}return e;}
function boxBody(hx,hy,hz,pos,quat){const b=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(hx,hy,hz))});b.position.set(pos.x,pos.y,pos.z);if(quat)b.quaternion.copy(quat);b.allowSleep=true;b.sleepSpeedLimit=0.3;b.sleepTimeLimit=3;return b;}
function boxEnt(w,h,d,pos,mat,o={}){const g=new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(g,mat);m.position.copy(pos);if(o.quat)m.quaternion.copy(o.quat);m.castShadow=o.shadow!==false;m.receiveShadow=true;const b=boxBody(w/2,h/2,d/2,pos,o.quat?qC(o.quat):null);const e=mkEnt(Object.assign({mesh:m,body:b,size:V3(w,h,d)},o));return e;}
function syncMesh(e){if(!e.mesh||!e.body)return;const b=e.body;e.mesh.position.copy(b.interpolatedPosition);e.mesh.quaternion.copy(b.interpolatedQuaternion);}
const COLLIDE_SPEED={ceramic:4.0,china:3.6,glass:3.4,gypsum:3,tile:4.2,chip:3,timber:3,metal:2.5,brick:3,plastic:2.5,foam:99,terra:4.0,copper:3,fabric:99,hollow:2.8,acrylic:3,leaf:99,soil:99,concrete:99,batt:99};
function onCollide(ev){const e=this.ent;if(!e||!e.alive||e.cord)return;const o=ev.body;const v=Math.abs(ev.contact.getImpactVelocityAlongNormal());if(v<0.8)return;
  const oe=o.ent;
  /* v7.0: what's in your hand pushes gently (no wakes, dents or shatters) until you ram with it or let it go */const inHand=typeof held!=='undefined'&&held&&held.ent===e&&!(held.thrust>=0);if(inHand)return;
  /* a bump only wakes a prop if it would actually move it: momentum over 0.6 x its own mass (at least 1.2 kg m/s) */
  if(oe&&oe.alive&&!oe.dynamic&&oe.wakeable&&v>1.0&&e.mass*v>(oe.wakeImpulse||Math.max(1.2,0.6*(oe.mass||1)))){wakeEnt(oe);}
  if(e.mass*v>5&&typeof dentEnt==='function'){const c=ev.contact;const wp=toT(c.bi.position.vadd(c.ri));const n=toT(c.ni);if(c.bi!==this)n.negate();/* n points from this body into the other */if(oe&&oe.dentMeshes)dentEnt(oe,wp,n,e.mass*v*0.07);if(e.dentMeshes&&v>2.2)dentEnt(e,wp,n.clone().negate(),Math.min(4,e.mass*v*0.012));}
  if(e.dynamic){if(!e.frag&&v>COLLIDE_SPEED[e.mat]&&(e.mat==='ceramic'||e.mat==='china'||e.mat==='glass'||e.mat==='terra'||e.mat==='tile')){shatterEnt(e,toT(this.position));return;}
    if(e.tubes&&v>2.2){e.tubes.forEach(t=>breakTube(t,toT(this.position)));}
    if(e.onHardHit&&v>e.onHardHitV)e.onHardHit(toT(this.position),v);
    if(v>1.2){const p=toT(this.position);if(e.mat==='gypsum'){S.crumble(p,0.35);if(v>2)P.emit(p,{count:6,color:[0.9,0.9,0.86],size:0.05,life:1.2,spread:0.8,grav:1.5,drag:1.5,kind:1});}
      else if(e.mat==='metal'||e.mat==='copper')S.clatter(p);else if(e.mat==='ceramic'||e.mat==='glass'||e.mat==='china'||e.mat==='tile')S.clink(p);else if(e.mat==='fabric'||e.mat==='foam'||e.mat==='leaf'||e.mat==='batt')S.thud(p,0.4);else S.thud(p,0.8+Math.min(1.5,e.mass*0.1));}
    if(e.frag)return;
    if(oe&&oe.kind==='facebody'&&e.mass*v>22){const c=chunkAtContact(oe.face,ev.contact,this);if(c&&c.attached)damage(c,e.mass*v*0.08,toT(this.position),toT(this.velocity).normalize(),'impact');}
  }}
function chunkAtContact(f,contact,selfBody){const other=contact.bi===selfBody?contact.bj:contact.bi;const r=contact.bi===selfBody?contact.rj:contact.ri;const wp=other.position.vadd(r);const uv=faceUV(f,toT(wp));return f.chunks.find(c=>c.alive&&c.attached&&pip(c.quad,uv.u,uv.v))||null;}
function meshCasts(m){let c=false;if(m)m.traverse(o=>{if(o.isMesh&&o.castShadow)c=true;});return c;}
function makeDynamic(e,mass){if(!e.alive||e.dynamic)return;if(e.parked){e.parked=false;if(e.body)registerBody(e.body);}ensureBody(e);if(!e.body)return;unbatchEnt(e);if(e.unflex)e.unflex(true);mass=mass||e.mass;const b=e.body;b.type=CANNON.Body.DYNAMIC;b.mass=mass;b.updateMassProperties();b.linearDamping=e.damp||0.04;b.angularDamping=e.adamp||0.12;b.allowSleep=true;b.sleepSpeedLimit=0.3;b.sleepTimeLimit=3;b.aabbNeedsUpdate=true;b.wakeUp();b.addEventListener('collide',onCollide);b.addEventListener('sleep',onSleep);e.dynamic=true;e.anchored=false;e.wokeAt=now;dynamics.push(e);
  /* only things big enough to read in a shadow keep casting one; debris (frags, screws, small shards) never forces a shadow-map refresh */
  if(e.castsShadow===undefined)e.castsShadow=e.kind!=='frag'&&meshCasts(e.mesh);if(e.mesh&&!e.castsShadow)e.mesh.traverse(o=>{if(o.isMesh)o.castShadow=false;});if(e.castsShadow)SHADOW.dirty=true;
  if(e.restsOn){const r=e.restsOn;const i=r.dependents.indexOf(e);if(i>=0)r.dependents.splice(i,1);e.restsOn=null;}
  for(const d of e.dependents.slice())wakeEnt(d);e.dependents.length=0;}
function wakeEnt(e){if(!e.alive||e.dynamic||e.bolted)return;if(e.asm){wakeAsm(e.asm);return;}makeDynamic(e);}
function onSleep(){const e=this.ent;if(!e||!e.alive)return;if(e.mat==='gypsum'&&this.position.y<0.4){floorDust(this.position.x,this.position.z,0.09+Math.random()*0.1,0.35);}}
function removeEnt(e){if(!e.alive)return;e.alive=false;unbatchEnt(e);entById.delete(e.id);if(e.body){world.removeBody(e.body);}if(e.mesh){hitRoot.remove(e.mesh);if(e.mesh.parent)e.mesh.parent.remove(e.mesh);}const i=ents.indexOf(e);if(i>=0)ents.splice(i,1);const j=dynamics.indexOf(e);if(j>=0)dynamics.splice(j,1);if(e.kerf){if(e.kerf.parent)e.kerf.parent.remove(e.kerf);e.kerf.geometry.dispose();e.kerf=null;}if(e.flexMesh&&e.flexMesh!==e.mesh&&e.flexMesh.parent)e.flexMesh.parent.remove(e.flexMesh);if(e.castsShadow)SHADOW.dirty=true;if(e.light){e.light.intensity=0;}if(e.onRemove)e.onRemove();for(const n of e.bonds){n.bonds.delete(e);}e.bonds.clear();for(const d of e.dependents.slice())wakeEnt(d);}
function applyImpulse(e,imp,p){if(!e.body||!e.alive)return;const b=e.body;b.wakeUp();const rel=p?toC(p).vsub(b.position):new CANNON.Vec3(0,0,0);if(rel.length()>1.5)rel.set(0,0,0);b.applyImpulse(toC(imp),rel);}
function releaseContact(a,b,sec=0.8){if(!a.body||!b.body)return;a.body.collisionFilterGroup=8;const oldMask=b.body.collisionFilterMask;b.body.collisionFilterMask=oldMask&~8;after(sec,()=>{if(a.body)a.body.collisionFilterGroup=1;if(b.body)b.body.collisionFilterMask=oldMask;});}

/* fragments & decals */
const FRAG_COL={gypsum:M.gypsum,ceramic:M.ceramic,china:M.china,glass:M.glass,timber:M.timber,chip:M.chip,brick:M.brick,plastic:M.plastic,terra:M.terra,metal:M.metal,copper:M.copper,foam:M.foam,tile:M.ceramic,hollow:M.chip,acrylic:M.acrylic,fabric:M.fabric,concrete:M.cement,batt:M.batt};
function spawnFragments(p,n,mat,sz,vel,spread=2.5,axis=null,maxLen=0.45){if(mat==='timber'||mat==='pine'){spawnSplinters(p,n,axis,vel,spread,maxLen);return;}for(let i=0;i<n;i++){const s=sz*(0.5+Math.random());const w=s,h=s*(0.3+Math.random()*0.7),d=s*(0.3+Math.random()*0.7);const pos=p.clone().add(V3((Math.random()-0.5)*0.1,(Math.random()-0.5)*0.1,(Math.random()-0.5)*0.1));const g=new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(g,FRAG_COL[mat]||M.chip);m.position.copy(pos);m.receiveShadow=true;m.castShadow=false;const b=new CANNON.Body({mass:0,shape:new CANNON.Sphere(Math.max(w,h,d)*0.42)});b.position.set(pos.x,pos.y,pos.z);b.allowSleep=true;b.sleepSpeedLimit=0.45;b.sleepTimeLimit=1.0;const e=mkEnt({mesh:m,body:b,size:V3(w,h,d),kind:'frag',mat,mass:Math.max(0.03,w*h*d*600),frag:true,hp:1,damp:0.35,adamp:0.7,castsShadow:false});e.body.quaternion.setFromEuler(Math.random()*3,Math.random()*3,Math.random()*3);makeDynamic(e);e.body.sleepTimeLimit=1.0;e.body.sleepSpeedLimit=0.45;const v=(vel?vel.clone():V3()).add(V3((Math.random()-0.5)*spread,(Math.random()-0.5)*spread,(Math.random()-0.5)*spread));e.body.velocity.set(v.x,v.y,v.z);e.body.angularVelocity.set((Math.random()-0.5)*12,(Math.random()-0.5)*12,(Math.random()-0.5)*12);}}
/* timber breaks along the grain: long tapered splinters (0.25-0.45 m x 18 x 12 mm) aligned with the member */
const SPLINTER_GEOS=[];function splinterGeo(i){if(!SPLINTER_GEOS[i]){const len=1,g=new THREE.BoxGeometry(1,1,len,1,1,4);const pa=g.attributes.position;for(let k=0;k<pa.count;k++){const z=pa.getZ(k);const t=(z+0.5);/* taper to a ragged point at +z, thin at -z */const sc=z>0?Math.max(0.12,1-t*0.9+(i%2)*0.1):0.75+t*0.25;pa.setX(k,pa.getX(k)*sc+(z>0.2?(i-1)*0.12*t:0));pa.setY(k,pa.getY(k)*(z>0?Math.max(0.2,1-t*0.7):1));}g.computeVertexNormals();SPLINTER_GEOS[i]=g;}return SPLINTER_GEOS[i];}
function grainAxisOf(e){if(!e||!e.size)return null;const s=e.size;const ax=s.x>=s.y&&s.x>=s.z?V3(1,0,0):(s.y>=s.z?V3(0,1,0):V3(0,0,1));if(e.body)return ax.applyQuaternion(new THREE.Quaternion(e.body.quaternion.x,e.body.quaternion.y,e.body.quaternion.z,e.body.quaternion.w));if(e.mesh)return ax.applyQuaternion(e.mesh.quaternion);return ax;}
function spawnSplinters(p,n,axis,vel,spread=1.6,maxLen=0.45){const ax=(axis?axis.clone():V3(rnd(-1,1),rnd(-0.3,0.3),rnd(-1,1))).normalize();const qa=new THREE.Quaternion().setFromUnitVectors(V3(0,0,1),ax);for(let i=0;i<n;i++){const len=clamp(rnd(0.25,0.45),0.05,maxLen),w=0.018*rnd(0.7,1.2),h=0.012*rnd(0.7,1.2);const m=new THREE.Mesh(splinterGeo(i%3),M.timber);m.scale.set(w,h,len);m.receiveShadow=true;m.castShadow=len>0.2;const q=qa.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(-0.12,0.12),rnd(-0.12,0.12),rnd(0,6.28))));const pos=p.clone().addScaledVector(ax,rnd(-0.12,0.12)).add(V3(rnd(-0.03,0.03),rnd(-0.03,0.03),rnd(-0.03,0.03)));m.position.copy(pos);m.quaternion.copy(q);
    const b=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(w/2,h/2,len/2))});b.position.set(pos.x,pos.y,pos.z);b.quaternion.copy(qC(q));const e=mkEnt({mesh:m,body:b,size:V3(w,h,len),kind:'frag',mat:'timber',mass:Math.max(0.02,w*h*len*520),frag:true,splinter:true,hp:1,damp:0.25,adamp:0.5,castsShadow:len>0.2,label:'splinter'});makeDynamic(e);e.body.sleepTimeLimit=1.2;e.body.sleepSpeedLimit=0.4;const v=(vel?vel.clone():V3()).add(V3(rnd(-spread,spread)*0.5,rnd(0,spread)*0.6,rnd(-spread,spread)*0.5));e.body.velocity.set(v.x,v.y,v.z);const sp=ax.clone().cross(V3(0,1,0));e.body.angularVelocity.set(sp.x*rnd(-9,9)+rnd(-3,3),rnd(-4,4),sp.z*rnd(-9,9)+rnd(-3,3));}}
/* bent nails left sticking out of a plate/stud after a member is wrenched off */
const NAIL_GEO=(()=>{const c=new THREE.CatmullRomCurve3([V3(0,0,0),V3(0,0,-0.025),V3(0.006,0.003,-0.045),V3(0.02,0.012,-0.06)]);const g=new THREE.TubeGeometry(c,8,0.0016,5,false);return g;})();const NAIL_HEAD=new THREE.CylinderGeometry(0.004,0.004,0.0014,8);NAIL_HEAD.rotateX(Math.PI/2);
function bentNails(p,normal,n=2){for(let i=0;i<n;i++){const g=new THREE.Group();const sh=new THREE.Mesh(NAIL_GEO,M.nail);g.add(sh);const hd=new THREE.Mesh(NAIL_HEAD,M.nail);hd.position.set(0.02,0.012,-0.06);g.add(hd);g.position.copy(p).add(V3(rnd(-0.015,0.015),rnd(-0.02,0.02),rnd(-0.015,0.015)));g.quaternion.setFromUnitVectors(V3(0,0,-1),normal.clone().normalize());g.rotateZ(rnd(0,6.28));scene.add(g);}}
function dust(p,n=18,s=1){P.emit(p,{count:n,color:[0.92,0.9,0.86],cvar:0.06,size:0.06*s,svar:0.03,life:1.6,lvar:0.6,spread:0.9*s,grav:1.2,drag:1.8,kind:1});}
function sparks(p,n,col,vel){P.emit(p,{count:n,color:col||[1,0.6,0.15],cvar:0.2,size:0.018,svar:0.01,life:0.5,lvar:0.3,vel:vel||null,speed:1,spread:3.5,grav:9,drag:0.3,kind:2});}
function shards(p,n,col){P.emit(p,{count:n,color:col,cvar:0.1,size:0.02,svar:0.012,life:1.2,lvar:0.5,spread:3,grav:9.8,drag:0.3,kind:0});}
/* plan extents */
const PX=3.25,PZ=4.25,PH=VILLA?3.0:2.7;/* v9.4: the house has 3 m ceilings; the bedsit keeps 2.7 */
let floorDrawable=null,floorSlabCanvas=null,bathFloorDrawable=null;
function floorUV(x,z,d){if(VILLA){if(d&&d===VB.floorD)return[(x-VB.fx0)/VB.fw,(VB.fz1-z)/VB.fd];return[(x-VF.x0)/VF.w,(VF.z1-z)/VF.d];}if(d&&d===bathFloorDrawable)return[(x-BATH.x0)/(BATH.x1-BATH.x0),(BATH.z1-z)/(BATH.z1-BATH.z0)];return[(x+PX)/(2*PX),(PZ-z)/(2*PZ)];}
function floorDrawableAt(x,z,y){return VILLA?((y!==undefined&&y<-1&&VB.floorD)?VB.floorD:(VS.strips.length&&vCarpetAt(x,z)?VF.carpet:floorDrawable)):inBath(x,z)?bathFloorDrawable:floorDrawable;}
function floorDust(x,z,r,a){const d=floorDrawableAt(x,z);if(!d)return;const uv=floorUV(x,z,d);d.blot(uv[0],uv[1],r*(d===bathFloorDrawable?400:230),'235,232,225',a);}
function floorPuddle(x,z,r,g,b,y){const d=floorDrawableAt(x,z,y);if(!d)return;const uv=floorUV(x,z,d);const col=r===undefined||(b>0.85&&r<0.7)?'40,60,90':`${(r*200)|0},${(g*200)|0},${(b*200)|0}`;d.blot(uv[0],uv[1],24+Math.random()*16,col,r!==undefined&&r>0.8?0.16:0.08);}
const BATH={x0:0.71,x1:PX,z0:1.51,z1:PZ};function inBath(x,z){return x>BATH.x0&&z>BATH.z0;}

/* ============================================================ WALL / FACE FRAMES */
const WALLS=[];const FACES=[];
function mkWall(name,ax,az,bx,bz,kind,o={}){const a=V3(ax,0,az),b=V3(bx,0,bz);const dir=b.clone().sub(a).normalize();const L=a.distanceTo(b);const up=V3(0,1,0);const n=V3(dir.z,0,-dir.x);/* front normal = left of dir */
  const w=Object.assign({name,a,b,dir,L,H:PH,kind,n,origin:a.clone(),right:dir.clone(),up,normal:n.clone(),depthZ:n.clone().negate(),studs:[],noggins:[],plates:[],openings:[],wires:[],faces:[],thick:kind==='ext'?0.25:0.11,frameDepth:0.055},o);
  w.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(w.right,up,w.depthZ));WALLS.push(w);return w;}
function mkFace(wall,side,matKind,drawable){/* side +1 front, -1 back */const f={wall,side,matKind,drawable,L:wall.L,H:wall.H,chunks:[],up:wall.up.clone()};
  if(side>0){f.origin=wall.origin.clone();f.right=wall.right.clone();f.normal=wall.normal.clone();}else{f.origin=wall.origin.clone().addScaledVector(wall.right,wall.L).addScaledVector(wall.depthZ,wall.thick);f.right=wall.right.clone().negate();f.normal=wall.normal.clone().negate();}
  f.depthZ=f.normal.clone().negate();f.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.right,f.up,f.depthZ));f.paperMat=new THREE.MeshStandardMaterial({map:drawable.tex,roughness:matKind==='tile'?0.35:0.95});wall.faces.push(f);FACES.push(f);return f;}
function faceUV(f,p){const d=p.clone().sub(f.origin);return{u:d.dot(f.right),v:d.dot(f.up),z:d.dot(f.depthZ)};}
function facePoint(f,u,v,z=0){return f.origin.clone().addScaledVector(f.right,u).addScaledVector(f.up,v).addScaledVector(f.depthZ,z);}
function wallPoint(w,u,v,z=0){return w.origin.clone().addScaledVector(w.right,u).addScaledVector(w.up,v).addScaledVector(w.depthZ,z);}
function wallUV(w,p){const d=p.clone().sub(w.origin);return{u:d.dot(w.right),v:d.dot(w.up),z:d.dot(w.depthZ)};}
function faceToWallU(f,u){return f.side>0?u:f.L-u;}
/* ceiling: special wall whose "front frame" is its underside */
function mkCeiling(){const w={name:'C',kind:'ceiling',L:2*PZ,H:2*PX,origin:V3(-PX,PH,-PZ),right:V3(0,0,1),up:V3(1,0,0),normal:V3(0,-1,0),depthZ:V3(0,1,0),studs:[],noggins:[],plates:[],openings:[],wires:[],faces:[],thick:0.1,frameDepth:0.055,a:V3(-PX,0,-PZ),b:V3(-PX,0,PZ),dir:V3(0,0,1),n:V3(0,-1,0)};w.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(w.right,w.up,w.depthZ));WALLS.push(w);return w;}

/* ============================================================ TIMBER */
function timberEnt(w,axis,from,to,cross,depthMid,o={}){const a=axis==='v';const len=to-from;const mid=(from+to)/2;const u=a?cross:mid,v=a?mid:cross;const center=wallPoint(w,u,v,depthMid);const size=a?V3(0.045,len,0.09):V3(len,0.045,0.09);const g=new THREE.BoxGeometry(size.x,size.y,size.z);const m=new THREE.Mesh(g,M.timber);m.position.copy(center);m.quaternion.copy(w.q);m.castShadow=false;m.receiveShadow=true;const b=boxBody(size.x/2,size.y/2,size.z/2,center,qC(w.q));const e=mkEnt(Object.assign({dormant:!!w.dormant,mesh:m,body:b,kind:'stud',mat:'timber',wall:w,axis,from,to,cross,depth:depthMid,size,mass:Math.max(0.8,len*2.1),hp:14,cut:0,anchors:[]},o));return e;}
function inOpening(w,u,v){for(const op of w.openings){if(u>=op.u0-0.001&&u<=op.u1+0.001&&v>=op.v0-0.001&&v<=op.v1+0.001)return op;}return null;}
function buildWallFrame(w){const L=w.L,H=w.H,D=w.frameDepth;
  const bp=timberEnt(w,'u',0,L,0.0225,D,{plate:true,label:'bottom plate'});const tp=timberEnt(w,'u',0,L,H-0.0225,D,{plate:true,label:'top plate'});w.plates.push(bp,tp);
  w.fullStudU=[];w.collapsed=[];const us=[];for(let u=0.045;u<=L-0.045+1e-6;u+=0.45)us.push(+u.toFixed(4));if(L-0.045-us[us.length-1]>0.1)us.push(+(L-0.045).toFixed(4));w.studU=us;
  for(const u of us){const op=w.openings.find(o=>u>o.u0-0.06&&u<o.u1+0.06);if(op){/* cripple above head */if(H-0.045-(op.v1+0.09)>0.1){const c=timberEnt(w,'v',op.v1+0.09,H-0.045,u,D,{anchors:[H-0.045],label:'cripple stud',cantilever:true,hp:6,pryWork:0.8});w.studs.push(c);}if(op.v0>0.2){const c2=timberEnt(w,'v',0.045,op.v0-0.09,u,D,{anchors:[0.045],label:'sill stud',cantilever:true,hp:6,pryWork:0.8});w.studs.push(c2);}continue;}const s=timberEnt(w,'v',0.045,H-0.045,u,D,{anchors:[0.045,H-0.045],label:'stud'});w.studs.push(s);w.fullStudU.push(u);}
  for(const op of w.openings){for(const ju of[op.u0-0.0225,op.u1+0.0225]){const j=timberEnt(w,'v',0.045,op.v1+0.045,ju,D,{anchors:[0.045,op.v1+0.045],label:'jack stud'});w.studs.push(j);us.push(+ju.toFixed(4));}const hd=timberEnt(w,'u',op.u0-0.045,op.u1+0.045,op.v1+0.0675,D,{noggin:true,label:'lintel',studU:[op.u0-0.0225,op.u1+0.0225]});w.noggins.push(hd);if(op.v0>0.2){const sill=timberEnt(w,'u',op.u0-0.045,op.u1+0.045,op.v0-0.0225,D,{noggin:true,label:'sill',studU:[op.u0-0.0225,op.u1+0.0225]});w.noggins.push(sill);}}
  us.sort((a,b)=>a-b);
  for(let i=0;i<us.length-1;i++){const a=us[i]+0.0225,b=us[i+1]-0.0225;if(b-a<0.08)continue;if(inOpening(w,(a+b)/2,1.35))continue;const n=timberEnt(w,'u',a,b,1.35,D,{noggin:true,label:'noggin',studU:[us[i],us[i+1]],hp:6,pryWork:0.7});w.noggins.push(n);}}
function studSegmentsAt(w,u,v,tol=0.001){return w.studs.filter(s=>s.alive&&!s.dynamic&&Math.abs(s.cross-u)<0.001&&v>=s.from-tol&&v<=s.to+tol);}
function backingAt(f,u,v,tol=0.015){const w=f.wall;const wu=faceToWallU(f,u);for(const s of w.studs){if(!s.alive||s.dynamic)continue;if(Math.abs(s.cross-wu)<=0.0225+tol&&v>=s.from-tol&&v<=s.to+tol)return s;}for(const n of w.noggins){if(!n.alive||n.dynamic)continue;if(Math.abs(n.cross-v)<=0.0225+tol&&wu>=n.from-tol&&wu<=n.to+tol)return n;}for(const p of w.plates){if(!p.alive||p.dynamic)continue;if(Math.abs(p.cross-v)<=0.0225+tol)return p;}return null;}
function plateAt(w,u,top){for(const p of w.plates){if(!p.alive||p.dynamic||p.collapsed)continue;if((p.cross>w.H/2)!==top)continue;if(u>=p.from-0.03&&u<=p.to+0.03)return p;}return null;}
function recomputeTimber(){for(const w of WALLS){const H=w.H;const ok=e=>e.alive&&!e.dynamic;const ceil=w.kind==='ceiling';
    for(const p of w.plates){if(ok(p))p.anchored=!p.collapsed;}
    /* a stud end only holds if the plate it is nailed to is still there; ceiling joists bear on the W/E top plates */
    const endOK=(s,top)=>w.endOK?w.endOK(s,top):ceil?(top?!!plateAt(WE,WE.L-s.cross,true):!!plateAt(WW,s.cross,true)):!!plateAt(w,s.cross,top);
    for(const s of w.studs){if(!ok(s))continue;s.anchored=(s.from<=0.046&&endOK(s,false))||(s.to>=H-0.046&&endOK(s,true))||(ceil&&s.anchors&&s.anchors.some(a=>a>0.05&&a<H-0.05&&a>=s.from-0.01&&a<=s.to+0.01));}
    for(const n of w.noggins){if(!ok(n))continue;n.anchored=n.studU.some(u=>studSegmentsAt(w,u,n.cross,0.04).some(s=>s.anchored));}
    for(const s of w.studs){if(!ok(s)||s.anchored)continue;s.anchored=w.noggins.some(n=>ok(n)&&n.anchored&&n.studU.some(u=>Math.abs(u-s.cross)<0.001)&&n.cross>=s.from-0.03&&n.cross<=s.to+0.03);}
    for(const s of[...w.studs,...w.noggins,...w.plates]){if(ok(s)&&!s.anchored)dropTimber(s);}}}
function dropTimber(s){for(const sc of s.screws){if(sc.chunk){const i=sc.chunk.screws.indexOf(sc);if(i>=0)sc.chunk.screws.splice(i,1);}hideScrew(sc);}s.screws=[];makeDynamic(s);S.snap(toT(s.body.position));for(const j of s.joints.slice())breakJoint(j,true);}
function splitTimber(s,pos){const w=s.wall;const uv=wallUV(w,pos);const c=s.axis==='v'?uv.v:uv.u;if(c-s.from<0.05||s.to-c<0.05)return false;const o={anchors:s.anchors,plate:s.plate,noggin:s.noggin,studU:s.studU,label:s.label,joist:s.joist,collapsed:s.collapsed};
  /* 6 mm kerf gap between the halves */const a=timberEnt(w,s.axis,s.from,c-0.003,s.cross,s.depth,o),b=timberEnt(w,s.axis,c+0.003,s.to,s.cross,s.depth,o);
  const arr=s.plate?w.plates:s.noggin?w.noggins:w.studs;arr.splice(arr.indexOf(s),1,a,b);
  /* a sawn stud is left hanging off one plate by its skew nails: a cantilevered stub that can be pried, kicked or smashed loose */
  if(s.axis==='v'&&!s.joist&&!s.plate){for(const h of[a,b]){const lo=h.from<=0.046,hi=h.to>=w.H-0.046;if(lo!==hi){h.cantilever=true;h.hp=4.5;h.pryWork=0.75;h.label=lo?'stud stub (bottom)':'stud stub (top)';}}}
  if(s.noggin){a.hp=b.hp=Math.min(s.hp,6);a.pryWork=b.pryWork=s.pryWork||0.7;}
  for(const sc of s.screws){const sv=s.axis==='v'?sc.v:faceToWallU(sc.f,sc.u);const tgt=sv<c?a:b;sc.stud=tgt;tgt.screws.push(sc);}s.screws=[];
  for(const j of s.joints){const jp=wallUV(w,j.pos);const jc=s.axis==='v'?jp.v:jp.u;const tgt=jc<c?a:b;if(j.a===s)j.a=tgt;if(j.b===s)j.b=tgt;tgt.joints.push(j);if(j.constraint){world.removeConstraint(j.constraint);j.constraint=null;}}s.joints=[];
  removeEnt(s);const p=pos.clone();P.emit(p,{count:20,color:[0.8,0.65,0.4],cvar:0.1,size:0.015,svar:0.006,life:1,spread:1.6,grav:9,drag:0.6});S.snap(p);for(const asm of asms)for(const j of asm.joints)if(j.intact&&!j.constraint&&asm.awake)mkConstraint(j);return true;}
function timberAxisW(e){const w=e.wall;return e.axis==='v'?w.up.clone():w.right.clone();}
/* wrench a pryable member (stub, noggin, cripple, sill) off its nails */
function knockLoose(e,dir,p,why){if(!e.alive||e.dynamic)return false;const w=e.wall;const ax=timberAxisW(e);let jp;if(e.axis==='v'){const atBottom=e.from<=0.046;jp=wallPoint(w,e.cross,atBottom?e.from:e.to,e.depth);}else jp=toT(e.body.position);
  if(e.unflex)e.unflex(true);dropTimber(e);e.body.collisionFilterMask=-1&~16;after(0.4,()=>{if(e.body)e.body.collisionFilterMask=-1;});
  const d=(dir||V3(0,0,0)).clone();d.y=Math.max(d.y,0);e.body.velocity.set(d.x*2.2,d.y*2.2+0.6,d.z*2.2);e.body.angularVelocity.set(rnd(-2,2),rnd(-2,2),rnd(-2,2));
  S.nailScreech(jp);S.snap(jp);bentNails(jp,w.normal.clone().negate().addScaledVector(ax,e.axis==='v'?(e.from<=0.046?1:-1):0),e.noggin?3:2);spawnSplinters(jp,2+((Math.random()*2)|0),ax,(dir||V3()).clone().multiplyScalar(1.5),1.4,0.3);P.emit(jp,{count:26,color:[0.82,0.68,0.45],cvar:0.1,size:0.014,svar:0.006,life:1.2,spread:1.5,grav:9,drag:0.5});
  HUD.msg(`[${(e.label||'timber').toUpperCase()} ${why||'WRENCHED OFF ITS NAILS'}]`,1.5);structuralUpdate();return true;}
/* three or more neighbouring studs gone under a top plate: the plate breaks over the span and what bears on it comes down */
const COLLAPSE_TEAR=[];
function intactFullStud(w,u){return w.studs.some(s=>s.alive&&!s.dynamic&&Math.abs(s.cross-u)<0.001&&s.from<=0.05&&s.to>=w.H-0.05);}
function checkSpanCollapse(){let any=false;for(const w of WALLS){if(w.kind==='ceiling'||!w.fullStudU||!w.fullStudU.length)continue;const us=w.fullStudU.slice().sort((a,b)=>a-b);let run=[];const spans=[];for(let i=0;i<=us.length;i++){const u=us[i];if(i<us.length&&!intactFullStud(w,u)&&!w.collapsed.some(c=>u>=c[0]&&u<=c[1]))run.push(u);else{if(run.length>=3)spans.push([run[0],run[run.length-1]]);run=[];}}
    for(const [ua,ub] of spans){const left=Math.max(0.06,ua-0.22),right=Math.min(w.L-0.06,ub+0.22);w.collapsed.push([left,right]);any=true;collapseTopPlate(w,left,right);}}
  return any;}
function collapseTopPlate(w,left,right){const H=w.H,D=w.frameDepth;for(const cut of[left,right]){const tp=plateAt(w,cut,true);if(tp&&cut-tp.from>0.06&&tp.to-cut>0.06)splitTimber(tp,wallPoint(w,cut,H-0.0225,D));}
  for(const p of w.plates.slice()){if(!p.alive||p.dynamic||p.cross<H/2)continue;if(p.from>=left-0.02&&p.to<=right+0.02){p.collapsed=true;dropTimber(p);p.body.velocity.set(0,-0.6,0);}}
  const mid=wallPoint(w,(left+right)/2,H-0.05,0);S.snap(mid);S.groan(mid,2);S.crumble(mid,1.2);shakeCam(1.0);for(let k=0;k<6;k++)dust(wallPoint(w,lerp(left,right,Math.random()),H-0.1,-0.05),18,1.4);
  HUD.msg(`[${w.kind==='ext'?'LOAD-BEARING':'PARTITION'} TOP PLATE FRACTURED OVER ${(right-left).toFixed(1)} m]`,3);
  if(w.kind!=='ext'||VILLA)return;const C=WC,CL=C.L,CH=C.H;let reg=null;
  const splitJ=(cu,v)=>{const j=C.studs.find(s=>s.alive&&!s.dynamic&&Math.abs(s.cross-cu)<0.001&&v>s.from+0.06&&v<s.to-0.06);if(j)splitTimber(j,wallPoint(C,cu,v,j.depth));};
  if(w===WW||w===WE){/* joist ends bearing on this plate: cut where the first truss picks them up; the end bay drops */const lo=w===WW?left:CL-right,hi=w===WW?right:CL-left;for(const cu of C.studU){if(cu<lo-0.02||cu>hi+0.02)continue;splitJ(cu,w===WW?1.24:CH-1.24);}reg={u0:lo-0.3,u1:hi+0.3,v0:w===WW?0:CH-1.6,v1:w===WW?1.6:CH};}
  else{/* N/S: the edge joist sits on this plate along its length */const cu=w===WN?C.studU[0]:C.studU[C.studU.length-1];const v0=w===WN?2*PX-right:left,v1=w===WN?2*PX-left:right;splitJ(cu,v0);splitJ(cu,v1);for(const s of C.studs){if(s.alive&&!s.dynamic&&Math.abs(s.cross-cu)<0.001&&s.from>=v0-0.02&&s.to<=v1+0.02){s.collapsed=true;dropTimber(s);}}reg={u0:w===WN?0:CL-0.9,u1:w===WN?0.9:CL,v0:v0-0.3,v1:v1+0.3};}
  if(reg)COLLAPSE_TEAR.push(reg);}
function structuralUpdate(){recomputeTimber();if(checkSpanCollapse())recomputeTimber();checkStructuralJoints();recomputeSupport();}

/* ============================================================ SCREWS (instanced) */
const SCREW_MAX=VILLA?16000:4000;const screwGeo=new THREE.CylinderGeometry(0.0035,0.0025,0.028,6);screwGeo.rotateX(Math.PI/2);const screwHeadGeo=new THREE.CylinderGeometry(0.0055,0.0055,0.0025,8);screwHeadGeo.rotateX(Math.PI/2);
const screwMesh=new THREE.InstancedMesh(screwGeo,M.darkMetal,SCREW_MAX);const screwHead=new THREE.InstancedMesh(screwHeadGeo,M.darkMetal,SCREW_MAX);screwMesh.count=0;screwHead.count=0;screwMesh.userData.kind='screws';screwHead.userData.kind='screws';screwMesh.frustumCulled=false;screwHead.frustumCulled=false;hitRoot.add(screwMesh);hitRoot.add(screwHead);
const screws=[];const _m4=new THREE.Matrix4(),_s1=V3(1,1,1),_s0=V3(0,0,0);
/* instance slots are handed out lazily: a dormant wall's screws (v6) get theirs when the wall wakes; SCREW_IDX maps a slot back to its screw */
let SCREW_N=0;const SCREW_IDX=[];
function screwInstance(sc){if(sc.id>=0||SCREW_N>=SCREW_MAX)return;sc.id=SCREW_N++;SCREW_IDX[sc.id]=sc;_m4.compose(facePoint(sc.f,sc.u,sc.v,0.0215),sc.f.q,sc.alive?_s1:_s0);screwMesh.setMatrixAt(sc.id,_m4);_m4.compose(sc.pos,sc.f.q,sc.alive?_s1:_s0);screwHead.setMatrixAt(sc.id,_m4);screwMesh.count=screwHead.count=SCREW_N;screwMesh.instanceMatrix.needsUpdate=true;screwHead.instanceMatrix.needsUpdate=true;}
function addScrew(f,stud,u,v){if(!f.wall.dormant&&SCREW_N>=SCREW_MAX)return null;const headPos=facePoint(f,u,v,0.0085);const sc={id:-1,f,w:f.wall,stud,u,v,chunk:null,alive:true,pos:headPos};if(!f.wall.dormant)screwInstance(sc);screws.push(sc);stud.screws.push(sc);return sc;}
function hideScrew(sc){if(!sc.alive)return;sc.alive=false;if(sc.id>=0){_m4.compose(sc.pos,sc.f.q,_s0);screwMesh.setMatrixAt(sc.id,_m4);screwHead.setMatrixAt(sc.id,_m4);screwMesh.instanceMatrix.needsUpdate=true;screwHead.instanceMatrix.needsUpdate=true;}if(sc.stud){const i=sc.stud.screws.indexOf(sc);if(i>=0)sc.stud.screws.splice(i,1);}if(sc.chunk){const i=sc.chunk.screws.indexOf(sc);if(i>=0)sc.chunk.screws.splice(i,1);}}
function popScrew(sc,toward){const p=sc.pos.clone();hideScrew(sc);S.ping(p);P.emit(p,{count:10,color:[0.93,0.92,0.9],size:0.03,life:1,spread:0.6,grav:2,drag:2,kind:1});const e=boxEnt(0.006,0.006,0.03,p.clone().addScaledVector(sc.f.normal,0.03),M.darkMetal,{kind:'frag',mat:'metal',mass:0.02,frag:true,shadow:false});makeDynamic(e);e.mesh.castShadow=false;const v=toward?toward.clone().multiplyScalar(2.5):sc.f.normal.clone().multiplyScalar(2);e.body.velocity.set(v.x+rnd(-1,1),v.y+1.5,v.z+rnd(-1,1));e.body.angularVelocity.set(rnd(-20,20),rnd(-20,20),rnd(-20,20));}
const ringGeo=new THREE.CircleGeometry(0.03,12);const ringCanvas=mkCanvas(64,64);{const x=ringCanvas.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(240,238,232,0.95)');g.addColorStop(0.5,'rgba(240,238,232,0.6)');g.addColorStop(1,'rgba(240,238,232,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}
const ringMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(ringCanvas),transparent:true,depthWrite:false});
function dustRing(sc){const m=new THREE.Mesh(ringGeo,ringMat);m.position.copy(facePoint(sc.f,sc.u,sc.v,0.0105)).addScaledVector(sc.f.normal,0.0005);m.quaternion.copy(sc.f.q);m.rotateY(Math.PI);m.renderOrder=2;scene.add(m);}

/* ============================================================ DRYWALL / TILE SHEET CHUNKS (merged per face) */
const chunkById=new Map();
function pip(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
function regroup(geo,classify){const pos=geo.attributes.position,uv=geo.attributes.uv,nor=geo.attributes.normal;const n=pos.count/3;const tris=[];for(let t=0;t<n;t++){tris.push({t,g:classify(pos.getZ(t*3),pos.getZ(t*3+1),pos.getZ(t*3+2))});}tris.sort((a,b)=>a.g-b.g);const np=new Float32Array(pos.count*3),nu=new Float32Array(pos.count*2),nn=new Float32Array(pos.count*3);let k=0;const groups=[];let cur=-1,start=0;for(const tr of tris){if(tr.g!==cur){if(cur>=0)groups.push([start,k*3-start,cur]);cur=tr.g;start=k*3;}for(let v=0;v<3;v++){const i=tr.t*3+v;np[(k*3+v)*3]=pos.getX(i);np[(k*3+v)*3+1]=pos.getY(i);np[(k*3+v)*3+2]=pos.getZ(i);nu[(k*3+v)*2]=uv.getX(i);nu[(k*3+v)*2+1]=uv.getY(i);nn[(k*3+v)*3]=nor.getX(i);nn[(k*3+v)*3+1]=nor.getY(i);nn[(k*3+v)*3+2]=nor.getZ(i);}k++;}groups.push([start,k*3-start,cur]);geo.setAttribute('position',new THREE.BufferAttribute(np,3));geo.setAttribute('uv',new THREE.BufferAttribute(nu,2));geo.setAttribute('normal',new THREE.BufferAttribute(nn,3));geo.clearGroups();for(const g of groups)geo.addGroup(g[0],g[1],g[2]);}
function uniqSorted(arr,eps=0.02){arr.sort((a,b)=>a-b);const out=[];for(const v of arr){if(!out.length||v-out[out.length-1]>eps)out.push(v);}return out;}
function buildSheet(f,cols,rows,o={}){/* f: face. cols/rows: boundary arrays in face coords. */const w=f.wall,L=f.L,H=f.H;f.bodies=[];f.shapeToChunk=new Map();const fbodyFor=(i)=>{const k=(i/2)|0;if(!f.bodies[k]){const b=new CANNON.Body({mass:0});b.collisionFilterGroup=16;b.ent={kind:'facebody',face:f,alive:true,label:'sheet'};f.bodies[k]=b;}return f.bodies[k];};const openings=w.openings.map(op=>f.side>0?op:{u0:L-op.u1,u1:L-op.u0,v0:op.v0,v1:op.v1});
  const onOpenEdge=(u,v)=>openings.some(op=>((Math.abs(u-op.u0)<0.001||Math.abs(u-op.u1)<0.001)&&v>=op.v0-0.001&&v<=op.v1+0.001)||((Math.abs(v-op.v1)<0.001||Math.abs(v-op.v0)<0.001)&&u>=op.u0-0.001&&u<=op.u1+0.001));
  const nc=cols.length,nr=rows.length;const isTile=f.matKind==='tile';const verts=[];for(let i=0;i<nc;i++){verts.push([]);for(let j=0;j<nr;j++){let u=cols[i],v=rows[j];const fixed=i===0||i===nc-1||j===0||j===nr-1||onOpenEdge(u,v);if(!fixed){const du=Math.min(cols[i]-cols[i-1],cols[i+1]-cols[i]),dv=Math.min(rows[j]-rows[j-1],rows[j+1]-rows[j]);if(isTile){u+=(srand()-0.5)*Math.min(0.07,du*0.3);v+=(srand()-0.5)*Math.min(0.08,dv*0.3);}else{/* organic break lines: interior vertices wander up to 42% of the cell */u+=(srand()-0.5)*du*0.42;v+=(srand()-0.5)*dv*0.42;}}verts[i].push([u,v]);}}
  const edgeMid={};const emid=(i0,j0,i1,j1,straight)=>{const key=i0+','+j0+'-'+i1+','+j1;if(edgeMid[key])return edgeMid[key];const a=verts[i0][j0],b=verts[i1][j1];const pts=[];if(!straight){const dx=b[0]-a[0],dy=b[1]-a[1];const len=Math.hypot(dx,dy);const nx=-dy/len,ny=dx/len;const jmax=isTile?Math.min(0.06,len*0.15):Math.min(0.09,len*0.22);for(const t of[0.3,0.55,0.78]){const jit=(srand()-0.5)*jmax;pts.push([a[0]+dx*t+nx*jit,a[1]+dy*t+ny*jit]);}}edgeMid[key]=pts;return pts;};
  const chunks=[];const grid=[];
  for(let i=0;i<nc-1;i++){grid.push([]);for(let j=0;j<nr-1;j++){
    const q=[verts[i][j],verts[i+1][j],verts[i+1][j+1],verts[i][j+1]];const cu=(cols[i]+cols[i+1])/2,cv=(rows[j]+rows[j+1])/2;
    if(openings.some(op=>cu>op.u0&&cu<op.u1&&cv>op.v0&&cv<op.v1)){grid[i].push(null);continue;}
    const poly=[];const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];for(let k=0;k<4;k++){const c0=corners[k],c1=corners[(k+1)%4];poly.push(verts[c0[0]][c0[1]]);const a=verts[c0[0]][c0[1]],b=verts[c1[0]][c1[1]];const straight=(k===0&&j===0)||(k===1&&i===nc-2)||(k===2&&j===nr-2)||(k===3&&i===0)||(onOpenEdge(a[0],a[1])&&onOpenEdge(b[0],b[1]))||isTile;const fwd=(c0[0]<c1[0])||(c0[0]===c1[0]&&c0[1]<c1[1]);let mids;if(fwd)mids=emid(c0[0],c0[1],c1[0],c1[1],straight);else mids=emid(c1[0],c1[1],c0[0],c0[1],straight).slice().reverse();for(const m of mids)poly.push(m);}
    const shape=new THREE.Shape();shape.moveTo(poly[0][0]-cu,poly[0][1]-cv);for(let k=1;k<poly.length;k++)shape.lineTo(poly[k][0]-cu,poly[k][1]-cv);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:0.01,bevelEnabled:false});const pa=geo.attributes.position;const uva=new Float32Array(pa.count*2);for(let k=0;k<pa.count;k++){uva[k*2]=(pa.getX(k)+cu)/L;uva[k*2+1]=(pa.getY(k)+cv)/H;}geo.setAttribute('uv',new THREE.BufferAttribute(uva,2));regroup(geo,(z0,z1,z2)=>(z0<0.001&&z1<0.001&&z2<0.001)?0:(z0>0.009&&z1>0.009&&z2>0.009)?2:1);
    const center=facePoint(f,cu,cv,0);const minU=Math.min(q[0][0],q[3][0]),maxU=Math.max(q[1][0],q[2][0]),minV=Math.min(q[0][1],q[1][1]),maxV=Math.max(q[2][1],q[3][1]);const hw=(maxU-minU)/2-0.004,hh=(maxV-minV)/2-0.004;const bc=facePoint(f,(minU+maxU)/2,(minV+maxV)/2,0.005);const pshape=new CANNON.Box(new CANNON.Vec3(hw,hh,0.005));const fb=fbodyFor(i);fb.addShape(pshape,toC(bc),qC(f.q));
    const offL=center.clone().sub(bc).applyQuaternion(f.q.clone().invert());
    /* world-space copy for merged rendering */const wgeo=geo.clone();wgeo.applyMatrix4(new THREE.Matrix4().compose(center,f.q,_s1));
    const e=mkEnt({kind:'drywall',mat:isTile?'tile':'gypsum',face:f,wall:w,quad:q,poly,cu,cv,gi:i,gj:j,mass:Math.max(0.6,(maxU-minU)*(maxV-minV)*(isTile?14:7.5)),hp:isTile?4.2:2.6,cut:0,offL,drawable:f.drawable,attached:true,geo,wgeo,center,bc,hw,hh,shape:pshape,fbody:fb,label:isTile?'wall tile':'plasterboard'});f.shapeToChunk.set(pshape,e);grid[i].push(e);chunks.push(e);chunkById.set(e.id,e);}}
  for(let i=0;i<nc-1;i++)for(let j=0;j<nr-1;j++){const e=grid[i][j];if(!e)continue;if(i<nc-2&&grid[i+1][j]){e.bonds.add(grid[i+1][j]);grid[i+1][j].bonds.add(e);}if(j<nr-2&&grid[i][j+1]){e.bonds.add(grid[i][j+1]);grid[i][j+1].bonds.add(e);}}
  /* screws into every stud / joist behind this face; a stud on a sheet joint gets a screw each side of the joint (edge screws 13 mm in) */const studList=[...w.studs];for(const stud of studList){if(stud.axis!=='v')continue;const su=f.side>0?stud.cross:L-stud.cross;const onJoint=cols.some(cb=>Math.abs(cb-su)<0.03&&cb>0.01&&cb<L-0.01);const sus=onJoint?[su-0.013,su+0.013]:[su];const step=w.kind==='ceiling'?0.3:0.4;for(let v=Math.max(0.15,stud.from+0.1);v<Math.min(H-0.1,stud.to-0.05);v+=step){for(const s of sus){const ch=chunks.find(c=>pip(c.quad,s,v));if(!ch)continue;const sc=addScrew(f,stud,s,v);if(sc){sc.chunk=ch;ch.screws.push(sc);}}}}
  f.chunks=chunks;for(const b of f.bodies)if(b)registerBody(b);rebuildFaceMesh(f);return chunks;}
function rebuildFaceMesh(f){/* merge all attached chunks' world geometries into one mesh with 3 material groups; faceIndex→chunk map. Built once:
   afterwards chunks leave by collapsing their own vertex ranges (faceHide), never by rebuilding the mesh or its BVH */const att=f.chunks.filter(c=>c.alive&&c.attached);if(f.mesh){hitRoot.remove(f.mesh);f.mesh.geometry.dispose();f.mesh=null;}if(!att.length)return;
  const groupsTris=[[],[],[]];let total=0;for(const c of att){c.fseg=[];const g=c.wgeo;for(const gr of g.groups){groupsTris[gr.materialIndex].push({c,start:gr.start,count:gr.count});total+=gr.count;}}
  const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2);const map=new Int32Array(total/3);let k=0;const outGroups=[];for(let gi=0;gi<3;gi++){const gstart=k;for(const seg of groupsTris[gi]){const g=seg.c.wgeo;const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;seg.c.fseg.push([seg.start,k,seg.count]);for(let i=0;i<seg.count;i++){const si=seg.start+i;pos[k*3]=P.getX(si);pos[k*3+1]=P.getY(si);pos[k*3+2]=P.getZ(si);nor[k*3]=N.getX(si);nor[k*3+1]=N.getY(si);nor[k*3+2]=N.getZ(si);uv[k*2]=U.getX(si);uv[k*2+1]=U.getY(si);if(i%3===0)map[k/3|0]=seg.c.id;k++;}}outGroups.push([gstart,k-gstart,gi]);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));/* edges and back share one draw (they sit next to each other in the buffer): two draw calls per wall face instead of three */if(outGroups[0][1]>0)geo.addGroup(outGroups[0][0],outGroups[0][1],0);if(outGroups[1][1]+outGroups[2][1]>0)geo.addGroup(outGroups[1][0],outGroups[1][1]+outGroups[2][1],2);geo.computeBoundingSphere();geo.computeBoundingBox();bvh(geo);let fmap=map;if(geo.index){const idx=geo.index.array;fmap=new Int32Array(idx.length/3);for(let t=0;t<fmap.length;t++)fmap[t]=map[(idx[t*3]/3)|0];}
  const backMat=f.matKind==='tile'?M.cement:M.gypsumBack;const coreMat=f.matKind==='tile'?M.cement:M.gypsum;const mesh=new THREE.Mesh(geo,[f.paperMat,coreMat,backMat]);mesh.receiveShadow=true;mesh.castShadow=false;mesh.frustumCulled=true;mesh.userData.faceMesh=f;mesh.userData.triMap=fmap;f.mesh=mesh;hitRoot.add(mesh);}
function faceHide(c){if(c.fhidden||!c.fseg||!c.face.mesh)return;c.fhidden=true;const pa=c.face.mesh.geometry.attributes.position,A=pa.array;const d0=c.fseg[0][1];const x=A[d0*3],y=A[d0*3+1],z=A[d0*3+2];for(const [,dst,n] of c.fseg){for(let i=dst;i<dst+n;i++){A[i*3]=x;A[i*3+1]=y;A[i*3+2]=z;}pa.addUpdateRange(dst*3,n*3);}pa.needsUpdate=true;}
function faceShow(c){if(!c.fhidden||!c.fseg||!c.face.mesh)return;c.fhidden=false;const pa=c.face.mesh.geometry.attributes.position,A=pa.array,S0=c.wgeo.attributes.position.array;for(const [src,dst,n] of c.fseg){A.set(S0.subarray(src*3,(src+n)*3),dst*3);pa.addUpdateRange(dst*3,n*3);}pa.needsUpdate=true;}
function chunkMats(c){return[c.face.paperMat,c.mat==='tile'?M.cement:M.gypsum,c.mat==='tile'?M.cement:M.gypsumBack];}
/* lift an attached chunk out of the merged face into its own mesh so it can flex under a pry bar */
function liftChunk(c){if(c.flexMesh||!c.attached||!c.alive)return c.flexMesh;if(c.wall&&c.wall.dormant)villaWake(c.wall);const m=new THREE.Mesh(c.geo,chunkMats(c));m.position.copy(c.center);m.quaternion.copy(c.face.q);m.castShadow=true;m.receiveShadow=true;m.userData.ent=c;hitRoot.add(m);c.flexMesh=m;faceHide(c);c.flexD=0;
  c.unflex=(keep)=>{if(!c.flexMesh)return;if(keep&&!c.attached){c.unflex=null;return;}if(c.flexMesh.parent)c.flexMesh.parent.remove(c.flexMesh);c.flexMesh=null;c.unflex=null;faceShow(c);};return m;}
function flexChunk(c,d,pivotUV){/* push the sheet out along the face normal by d (m), hinged a little about the pry point */const m=liftChunk(c);if(!m)return;c.flexD=d;const f=c.face;m.position.copy(c.center).addScaledVector(f.normal,d);m.quaternion.copy(f.q);if(pivotUV){const du=pivotUV.u-c.cu,dv=pivotUV.v-c.cv;const L=Math.max(0.1,Math.hypot(du,dv));m.rotateOnAxis(V3(-dv/L,du/L,0),-d*1.6);}}
function chunkDirect(c){return c.screws.some(s=>s.alive&&s.stud&&s.stud.alive&&!s.stud.dynamic&&s.stud.anchored);}
function recomputeSupport(){let changed=true;let guard=0;
  /* after a ceiling collapse the paper tears: unscrewed sheet in the collapse zone no longer hangs off its neighbours */
  if(COLLAPSE_TEAR.length&&WC.faces[0]){const f=WC.faces[0];for(const r of COLLAPSE_TEAR){for(const c of f.chunks){if(c.alive&&c.attached&&c.cu>=r.u0&&c.cu<=r.u1&&c.cv>=r.v0&&c.cv<=r.v1&&!chunkDirect(c)){for(const n of[...c.bonds])breakBond(c,n);}}}COLLAPSE_TEAR.length=0;}
  while(changed&&guard++<6){changed=false;for(const f of FACES){for(const c of f.chunks){if(!c.alive||!c.attached)continue;c._d=chunkDirect(c);}}
    for(const f of FACES){for(const c of f.chunks){if(!c.alive||!c.attached)continue;let ok=c._d;if(!ok){for(const n of c.bonds){if(n.alive&&n.attached&&n._d){ok=true;break;}}}if(!ok){detachChunk(c,null,0.6,false);changed=true;}}}}
  checkStructuralJoints();}
function capInto(v,f,max){/* limit the into-the-wall component so loose sheet can't tunnel through batts/studs in one physics step */const n=f.normal;const into=-v.dot(n);if(into>max)v.addScaledVector(n,into-max);return v;}
function detachChunk(c,dir,imp=0,leaveScrews=false){if(!c.alive||!c.attached)return;if(c.wall&&c.wall.dormant)villaWake(c.wall);c.attached=false;const f0=c.face;if(c.shape){c.fbody.removeShape(c.shape);c.fbody.aabbNeedsUpdate=true;c.fbody.updateBoundingRadius();f0.shapeToChunk.delete(c.shape);c.shape=null;}
  /* body starts where the sheet currently is (it may be flexed out) and ignores the face it came from for a moment, so it doesn't explode off its neighbours */const bpos=c.bc.clone().addScaledVector(f0.normal,c.flexD||0);const nb=boxBody(c.hw,c.hh,0.005,bpos,qC(c.flexMesh?c.flexMesh.quaternion:f0.q));nb.ent=c;nb.collisionFilterMask=-1&~16;c.body=nb;registerBody(nb);after(0.35,()=>{if(c.body===nb)nb.collisionFilterMask=-1;});
  for(const sc of c.screws.slice()){if(leaveScrews){sc.chunk=null;const i=c.screws.indexOf(sc);c.screws.splice(i,1);dustRing(sc);}else hideScrew(sc);}
  for(const n of c.bonds){n.bonds.delete(c);}c.bonds.clear();
  let mesh=c.flexMesh;if(mesh){c.flexMesh=null;c.unflex=null;}else{mesh=new THREE.Mesh(c.geo,chunkMats(c));mesh.position.copy(c.center);mesh.quaternion.copy(c.face.q);mesh.receiveShadow=true;mesh.userData.ent=c;hitRoot.add(mesh);faceHide(c);}mesh.castShadow=true;c.mesh=mesh;
  makeDynamic(c);const p=toT(c.body.position);if(c.mat==='tile'){S.clink(p);S.shatter(p,false);}else{S.tear(p);S.crumble(p,0.5);dust(p,14,1);}if(dir&&imp>0){const vv=capInto(V3(dir.x*imp,dir.y*imp+0.4,dir.z*imp),c.face,1.0);c.body.velocity.set(vv.x,vv.y,vv.z);c.body.angularVelocity.set(rnd(-2,2),rnd(-2,2),rnd(-2,2));}else{const n=c.face.normal;c.body.velocity.set(n.x*0.5*imp,0.1,n.z*0.5*imp);c.body.angularVelocity.set(rnd(-1,1),rnd(-1,1),rnd(-1,1));}}
/* ---------- jagged fracture: a heavy blow splits a sheet chunk into 2-3 wedges radiating from the impact ---------- */
function clipHalf(poly,px,py,nx,ny){/* keep the side where (x-p)·n >= 0 (Sutherland-Hodgman, one plane) */const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];const da=(a[0]-px)*nx+(a[1]-py)*ny,db=(b[0]-px)*nx+(b[1]-py)*ny;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
function polyArea(p){let a=0;for(let i=0,j=p.length-1;i<p.length;j=i++)a+=(p[j][0]+p[i][0])*(p[j][1]-p[i][1]);return Math.abs(a/2);}
function jagCut(poly,px,py){/* roughen the straight edges created by the clip (those passing near the impact point's rays) */const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];out.push(a);const dx=b[0]-a[0],dy=b[1]-a[1];const len=Math.hypot(dx,dy);if(len<0.05)continue;/* a cut edge is collinear with the impact point */const cr=Math.abs((a[0]-px)*dy-(a[1]-py)*dx)/len;if(cr>0.004)continue;const nx=-dy/len,ny=dx/len;const steps=Math.min(5,Math.floor(len/0.035));for(let k=1;k<steps;k++){const t=k/steps+(Math.random()-0.5)*0.4/steps;const j=(Math.random()-0.5)*Math.min(0.035,len*0.18);out.push([a[0]+dx*t+nx*j,a[1]+dy*t+ny*j]);}}return out;}
function shardChunk(c,p,dir,force=1){if(!c.alive||!c.attached)return false;if(c.wall&&c.wall.dormant)villaWake(c.wall);const f=c.face;const uv=faceUV(f,p);const poly=c.poly;
  let px=clamp(uv.u,c.cu-c.hw*0.7,c.cu+c.hw*0.7),py=clamp(uv.v,c.cv-c.hh*0.7,c.cv+c.hh*0.7);if(!pip(poly,px,py)){px=c.cu;py=c.cv;}
  const k=Math.random()<0.45?2:3;const a0=Math.random()*Math.PI*2;const angs=[];for(let i=0;i<k;i++)angs.push(a0+i*Math.PI*2/k+(Math.random()-0.5)*(k===3?0.7:0.5));
  const pieces=[];if(k===2){const nx=Math.cos(angs[0]),ny=Math.sin(angs[0]);pieces.push(clipHalf(poly,px,py,nx,ny),clipHalf(poly,px,py,-nx,-ny));}
  else{for(let i=0;i<3;i++){const aA=angs[i],aB=angs[(i+1)%3]+(i===2?Math.PI*2:0);/* wedge between rays aA and aB (span < pi): left of ray A, right of ray B */let q=clipHalf(poly,px,py,-Math.sin(aA),Math.cos(aA));q=clipHalf(q,px,py,Math.sin(aB),-Math.cos(aB));pieces.push(q);}}
  /* the parent leaves the wall */c.attached=false;if(c.shape){c.fbody.removeShape(c.shape);c.fbody.aabbNeedsUpdate=true;c.fbody.updateBoundingRadius();f.shapeToChunk.delete(c.shape);c.shape=null;}if(c.flexMesh){if(c.flexMesh.parent)c.flexMesh.parent.remove(c.flexMesh);c.flexMesh=null;c.unflex=null;}faceHide(c);
  for(const sc of c.screws.slice()){if(Math.random()<0.5)dustRing(sc),sc.chunk=null;else hideScrew(sc);}c.screws.length=0;for(const n of c.bonds)n.bonds.delete(c);c.bonds.clear();chunkById.delete(c.id);
  const isTile=c.mat==='tile';const d=(dir||f.normal.clone().negate()).clone();const ip=facePoint(f,px,py,0);
  for(const raw of pieces){if(raw.length<3)continue;const pg=jagCut(raw,px,py);const A=polyArea(pg);if(A<0.0015){shards(ip,6,[0.92,0.9,0.86]);continue;}
    let cu=0,cv=0;for(const v of pg){cu+=v[0];cv+=v[1];}cu/=pg.length;cv/=pg.length;let mnU=1e9,mxU=-1e9,mnV=1e9,mxV=-1e9;for(const v of pg){mnU=Math.min(mnU,v[0]);mxU=Math.max(mxU,v[0]);mnV=Math.min(mnV,v[1]);mxV=Math.max(mxV,v[1]);}
    const shape=new THREE.Shape();shape.moveTo(pg[0][0]-cu,pg[0][1]-cv);for(let i=1;i<pg.length;i++)shape.lineTo(pg[i][0]-cu,pg[i][1]-cv);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:0.01,bevelEnabled:false});const pa=geo.attributes.position;const uva=new Float32Array(pa.count*2);for(let i=0;i<pa.count;i++){uva[i*2]=(pa.getX(i)+cu)/f.L;uva[i*2+1]=(pa.getY(i)+cv)/f.H;}geo.setAttribute('uv',new THREE.BufferAttribute(uva,2));regroup(geo,(z0,z1,z2)=>(z0<0.001&&z1<0.001&&z2<0.001)?0:(z0>0.009&&z1>0.009&&z2>0.009)?2:1);
    const center=facePoint(f,cu,cv,0);const hw=Math.max(0.01,(mxU-mnU)*0.35),hh=Math.max(0.01,(mxV-mnV)*0.35);const bc=facePoint(f,(mnU+mxU)/2,(mnV+mxV)/2,0.005);const offL=center.clone().sub(bc).applyQuaternion(f.q.clone().invert());
    const m=new THREE.Mesh(geo,chunkMats(c));m.position.copy(center);m.quaternion.copy(f.q);m.receiveShadow=true;m.castShadow=A>0.05;const b=boxBody(hw,hh,0.005,bc,qC(f.q));b.collisionFilterMask=-1&~16;
    const e=mkEnt({kind:'drywall',mat:c.mat,face:f,wall:c.wall,quad:[[mnU,mnV],[mxU,mnV],[mxU,mxV],[mnU,mxV]],poly:pg,cu,cv,mass:Math.max(0.15,A*(isTile?14:7.5)),hp:1.2,cut:0,offL,drawable:c.drawable,attached:false,geo,center,bc,hw,hh,mesh:m,body:b,label:isTile?'tile shard':'plasterboard shard',castsShadow:A>0.05,shard:true});chunkById.set(e.id,e);after(0.35,()=>{if(e.body)e.body.collisionFilterMask=-1;});makeDynamic(e);
    const out=V3(cu-px,cv-py,0);const ol=Math.max(0.01,out.length());const spread=f.right.clone().multiplyScalar(out.x/ol).addScaledVector(f.up,out.y/ol);const v=capInto(d.clone().multiplyScalar((2.2+Math.random()*1.6)*force).addScaledVector(spread,1.1*force),f,0.7);e.body.velocity.set(v.x,v.y+0.3,v.z);e.body.angularVelocity.set(rnd(-6,6)*force,rnd(-6,6)*force,rnd(-6,6)*force);}
  c.drawable.blot(px/f.L,py/f.H,26,'24,20,18',0.55);if(isTile){S.shatter(ip,false);S.clink(ip);shards(ip,22,[0.85,0.83,0.78]);}else{S.crumble(ip,0.9);S.tear(ip);dust(ip,30,1.4);}P.emit(ip,{count:16,color:[0.93,0.92,0.88],size:0.018,svar:0.01,life:1.1,spread:2.2,vel:d,speed:1.5,grav:9.8,drag:0.4});
  removeEnt(c);return true;}
function breakBond(a,b){if(a.bonds.has(b)){a.bonds.delete(b);b.bonds.delete(a);}}

/* ============================================================ BRICK SKIN (instanced) & MORTAR */
const brickGeo=new THREE.BoxGeometry(0.23,0.076,0.11);const BRICKS={};
function buildBricks(w){const L=w.L+0.5,H=3.1;const cols=Math.ceil(L/0.24)+1,rows=Math.ceil(H/0.086);const n=cols*rows;const im=new THREE.InstancedMesh(brickGeo,M.brick,n);im.castShadow=false;im.receiveShadow=true;im.userData.kind='bricks';im.userData.wall=w;im.frustumCulled=false;const list=[];let k=0;const c=new THREE.Color();
  for(let r=0;r<rows;r++){const off=(r%2)*0.12;for(let i=0;i<cols;i++){const u=-0.25+off+i*0.24+0.115,v=0.038+r*0.086;const p=wallPoint(w,u,v,0.195);_m4.compose(p,w.q,_s1);im.setMatrixAt(k,_m4);c.setHSL(0.03+srand()*0.03,0.45+srand()*0.2,0.3+srand()*0.14);im.setColorAt(k,c);list.push({u,v,p,alive:true,id:k});k++;}}
  im.count=k;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;hitRoot.add(im);
  const mg=new THREE.PlaneGeometry(L,H);const mm=new THREE.Mesh(mg,M.mortar);mm.position.copy(wallPoint(w,w.L/2,H/2-0.2,0.25));mm.quaternion.copy(w.q);mm.rotateY(Math.PI);mm.receiveShadow=true;scene.add(mm);
  const body=boxBody(L/2,H/2,0.055,wallPoint(w,w.L/2,H/2-0.2,0.195),qC(w.q));const e=mkEnt({body,kind:'brickwall',mat:'brick',wall:w,mass:0,hp:999,label:'brick skin'});BRICKS[w.name]={im,list,e,cols};w.brickMesh=im;}
/* v7.0: a chip first (the face spalls off), then the brick itself comes out whole; a lever takes it straight out */
function chipBrick(w,id,p,dir,whole){const B=BRICKS[w.name];if(!B)return;const br=B.list[id];if(!br||br.gone)return;const out=B.out||w.normal,rec=B.rec||1;
  if(!br.alive||whole){br.gone=true;br.alive=false;_m4.makeScale(0,0,0);B.im.setMatrixAt(id,_m4);B.im.instanceMatrix.needsUpdate=true;if(B.onGone)B.onGone(B,br);const toward=dir?dir.clone().negate():out.clone();
    const e=boxEnt(0.23,0.076,0.11,br.p.clone().addScaledVector(out,0.02),M.brick,{kind:'prop',mat:'brick',mass:2.6,hp:6,label:'brick',quat:w.q,noBatch:true});makeDynamic(e);e.body.velocity.set(toward.x*1.2+out.x*0.8,0.6,toward.z*1.2+out.z*0.8);e.body.angularVelocity.set(Math.random()*3,Math.random()*3,Math.random()*3);
    P.emit(p,{count:24,color:[0.62,0.6,0.55],cvar:0.1,size:0.03,life:1.4,spread:1.2,grav:3,drag:1.5,kind:1});S.snap(p);S.crumble(p,0.8);S.thud(p,1.2);return;}
  br.alive=false;_m4.compose(br.p.clone().addScaledVector(w.depthZ,0.03*rec),w.q,V3(1,1,0.45));B.im.setMatrixAt(id,_m4);B.im.setColorAt(id,new THREE.Color(0x5a3a30));B.im.instanceMatrix.needsUpdate=true;B.im.instanceColor.needsUpdate=true;spawnFragments(br.p.clone().addScaledVector(out,0.08),4,'brick',0.05,out.clone().multiplyScalar(2));P.emit(p,{count:20,color:[0.6,0.35,0.25],cvar:0.1,size:0.03,life:1.2,spread:1.2,grav:3,drag:1.5,kind:1});S.snap(p);S.crumble(p,0.6);}
