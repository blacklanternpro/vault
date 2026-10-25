
/* ============================================================ v8.0 — WS8: MOVE IN + THE OPTIMISATION PASS
   p9o — proxies. The bedsit's appliances came over as 20–30 meshes each (the fridge with its magnets and shelves, the CRT,
   the tower's innards), the pantry is forty tins of three pieces each, and every piece was its own draw call. While the
   things in one patch of one room (3 m cells, keyed by the rooms they can be seen from) sit untouched, their pieces are
   merged into one mesh per material — plain painted materials share one vertex-coloured material, the way the static
   batches already do — and the originals move to layer 1. The camera (layer 0) stops drawing them, but every raycaster
   also reads layer 1, so hits, dents, screen cracks, texta and use-targets land on the real pieces exactly as before.
   A cell's proxy is dropped the moment anything in it changes (a hit, a dent, a use, a wake, a piece that moves, hides,
   changes colour, swaps material or has its vertices pushed) and rebuilt once the thing that changed has sat still for
   3 s. Something that keeps changing on its own (a clock's second hand, a spinning fan) is left out after a few tries.
   VCULL hides a cell's proxy along with its rooms. */

const VPX={clusters:new Set(),cells:new Map(),fail:new Map(),t2:0,live:false,on:true,built:0,dropped:0,hooked:false,cell:3};
const _vpxObjRC=THREE.Object3D.prototype.onBeforeRender;
/* walk an ent's own meshes: other ents nested under it (a door on its fridge) are theirs, not ours */
function vpxWalk(e,o,fn,vis){for(const c of o.children){if(c.userData&&c.userData.ent&&c.userData.ent!==e)continue;if(c.isLight||c.isCamera||c.userData.vpxNode)continue;const v=vis&&(c.visible||VCULL.hid.has(c));fn(c,v);vpxWalk(e,c,fn,v);}}
const vpxMatOk=m=>m&&m.isMaterial&&!m.isShaderMaterial&&!m.vertexColors&&!m.transparent&&m.visible&&!m.userData.canon;
function vpxOk(o,vis){if(!vis||!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.layers.mask!==1||o.renderOrder!==0)return false;const m=o.material,g=o.geometry;
  if(Array.isArray(m)){if(!g||!g.groups||!g.groups.length||!g.groups.every(gr=>vpxMatOk(m[gr.materialIndex])))return false;}else if(!vpxMatOk(m))return false;if(o.onBeforeRender!==_vpxObjRC)return false;
  if(!g||!g.attributes.position||!g.attributes.normal||g.attributes.color||g.morphAttributes&&Object.keys(g.morphAttributes).length||o.morphTargetInfluences)return false;
  return o.matrixWorld.determinant()>0;}
function vpxCount(e){e.mesh.updateMatrixWorld(true);let n=0;const f=(o,v)=>{if(vpxOk(o,v))n++;};f(e.mesh,true);vpxWalk(e,e.mesh,f,true);return n;}
function vpxEligible(e){if(!e.alive||!e.mesh||e.batched||e.dormant||!e.mesh.parent||e.noProxy||e.cord||e._px)return false;
  if(e.dynamic&&!(e.parked&&e.body))return false;if(e._pxT&&now-e._pxT<3)return false;
  if(e._pxN===undefined||now-(e._pxNt||0)>10){e._pxN=vpxCount(e);e._pxNt=now;}return e._pxN>=1;}
/* loose scenery (posters, notices, ceiling roses, vents: meshes straight on the scene, no ent) joins its cell too, as a stand-in */
function vpxLoose(){const L=[];for(const o of scene.children){if(!o.isMesh||o.isInstancedMesh||o.userData.batch||o.userData.faceMesh||o.userData.vpxNode||o.userData.ent||o.layers.mask!==1)continue;
    const g=o.geometry;if(!g||!g.attributes.position)continue;if(!g.boundingSphere)g.computeBoundingSphere();o.updateMatrixWorld(true);if(o.userData.villaMortar)continue;const sc=o.getWorldScale(V3());const big=g.boundingSphere.radius*Math.max(sc.x,sc.y,sc.z)>1.5;
    let P=o.userData.vpxP;if(!P){P={id:1e9+o.id,label:'(scenery)',mesh:o,loose:true,alive:true};o.userData.vpxP=P;}P.big=big;L.push(P);}VPX.loose=L;VPX.looseT=now;}
function vpxCentre(e){if(e.loose){const g=e.mesh.geometry;return g.boundingSphere.center.clone().applyMatrix4(e.mesh.matrixWorld);}const m=e.mesh.matrixWorld.elements;return V3(m[12],m[13],m[14]);}
function vpxRooms(e,p){if(!e.loose)return vcRoomsOf(e);if(p.y<-0.4)return null;if(p.y>PH+0.25)return['roof'];const S=new Set();for(const [dx,dz] of[[0,0],[0.22,0],[-0.22,0],[0,0.22],[0,-0.22]]){const r=vRoomAtWorld(p.x+dx,p.z+dz);S.add(r?r.id:'out');}return[...S];}
function vpxKey(e){if(e.loose&&e.big)return{key:'house',rooms:null,never:true};/* the house-wide pieces (cornices, liners, eaves, slab edges) are always in view: one cell */const p=vpxCentre(e);const rs=vpxRooms(e,p);const c=VPX.cell;const big=!e.loose&&vcBig(e);
  return{key:(rs?rs.slice().sort().join(','):'-')+(big?'|big':'')+'@'+Math.floor(p.x/c)+','+Math.floor(p.z/c)+(p.y<-0.4?'b':p.y>PH+0.25?'r':''),rooms:rs,never:!rs||rs[0]==='roof'||big};}
const vpxSig=m=>[m.color?m.color.r:0,m.color?m.color.g:0,m.color?m.color.b:0,m.emissive?m.emissive.r:0,m.emissive?m.emissive.g:0,m.emissive?m.emissive.b:0,m.emissiveIntensity||0,m.opacity,m.visible?1:0,m.transparent?1:0,m.map?m.map.id:-1,m.roughness||0,m.metalness||0];
function vpxSigEq(m,s){if(m.color&&(m.color.r!==s[0]||m.color.g!==s[1]||m.color.b!==s[2]))return false;if(m.emissive&&(m.emissive.r!==s[3]||m.emissive.g!==s[4]||m.emissive.b!==s[5]))return false;
  return (m.emissiveIntensity||0)===s[6]&&m.opacity===s[7]&&(m.visible?1:0)===s[8]&&(m.transparent?1:0)===s[9]&&(m.map?m.map.id:-1)===s[10]&&(m.roughness||0)===s[11]&&(m.metalness||0)===s[12];}
/* one material for every plain painted piece: colour, roughness and metalness ride on the vertices (the static batches
   split by roughness/metalness; a proxy doesn't have to) */
const VPXC=new Map();
function vpxCanon(m){if(!m.isMeshStandardMaterial||m.isMeshPhysicalMaterial||m.map||m.emissiveMap||m.alphaMap||m.normalMap||m.roughnessMap||m.metalnessMap||m.bumpMap||m.aoMap||m.lightMap||m.displacementMap||m.envMap||m.wireframe||m.polygonOffset||m.alphaTest>0||!m.depthTest||!m.colorWrite||m.vertexColors||m.transparent||m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile)return null;
  if(m.emissive&&m.emissiveIntensity>0&&(m.emissive.r||m.emissive.g||m.emissive.b))return null;
  const k=m.side+'|'+(m.flatShading?1:0)+(m.depthWrite?1:0)+(m.fog?1:0)+(m.toneMapped?1:0);let c=VPXC.get(k);
  if(!c){c=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,metalness:0,side:m.side,flatShading:m.flatShading,depthWrite:m.depthWrite,fog:m.fog,toneMapped:m.toneMapped});c.name='vpx canon '+k;c.userData.canon=true;rmPatch(c);VPXC.set(k,c);}return c;}
const vpxVis=o=>o.visible||VCULL.hid.has(o);
function vpxMerge(items,colored){/* [geometry, world Matrix4, Color|null, start, count, roughness, metalness] → one non-indexed world-space geometry */let nv=0;for(const it of items)nv+=it[4];
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2),col=colored?new Float32Array(nv*3):null,rm=colored?new Float32Array(nv*2):null;const n3=new THREE.Matrix3(),v=V3();let k=0;
  for(const [g,m4,c,t0,cnt,ro,me] of items){const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,I=g.index;n3.getNormalMatrix(m4);
    for(let t=t0;t<t0+cnt;t++){const i=I?I.getX(t):t;v.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(m4);pos[k*3]=v.x;pos[k*3+1]=v.y;pos[k*3+2]=v.z;v.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(n3).normalize();nor[k*3]=v.x;nor[k*3+1]=v.y;nor[k*3+2]=v.z;
      if(U){uv[k*2]=U.getX(i);uv[k*2+1]=U.getY(i);}if(col){col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;rm[k*2]=ro;rm[k*2+1]=me;}k++;}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col){g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('rm',new THREE.BufferAttribute(rm,2));}g.computeBoundingSphere();return g;}
function vpxBuild(K,members){const groups=new Map(),orig=[];
  for(const e of members){e.mesh.updateMatrixWorld(true);
    /* small details VCULL hid for distance come back: once merged they cost nothing, and VCULL leaves proxied things alone */
    vpxWalk(e,e.mesh,o=>{if(VCULL.hid.has(o)){o.visible=true;VCULL.hid.delete(o);}},true);
    const take=(o,vis)=>{if(!vpxOk(o,vis))return;const g=o.geometry,W=o.matrixWorld.clone(),full=g.index?g.index.count:g.attributes.position.count;const arr=Array.isArray(o.material);
      const add=(m,t0,cnt)=>{const c=vpxCanon(m),cm=c||m;/* one mesh per material: it casts if any piece did (the shadow map is static, so the cost is one redraw) and receives */const k=cm.uuid;let G=groups.get(k);if(!G){G={m:cm,canon:!!c,cs:false,rs:true,L:[]};groups.set(k,G);}if(o.castShadow)G.cs=true;G.L.push([g,W,c?m.color:null,t0,cnt,m.roughness,m.metalness]);};
      if(arr){for(const gr of g.groups){const c=Math.min(gr.count,full-gr.start);if(c>0)add(o.material[gr.materialIndex],gr.start,c);}}else add(o.material,0,full);
      const mats=arr?o.material.slice():[o.material];orig.push({o,e,snap:o.matrixWorld.elements.slice(),vis:vpxVis(o),mat:o.material,mats,sigs:mats.map(vpxSig),geo:g,pv:g.attributes.position.version,n:mats.length});};
    take(e.mesh,true);vpxWalk(e,e.mesh,take,true);}
  let draws=0;for(const r of orig)draws+=Array.isArray(r.mat)?r.geo.groups.length:1;if(draws-groups.size<2)return null;
  const node=new THREE.Group();node.name='vpx '+K.key;node.userData.vpxNode=true;const proxies=[];
  for(const G of groups.values()){const pm=new THREE.Mesh(vpxMerge(G.L,G.canon),G.m);pm.userData.pxProxy=true;pm.castShadow=G.cs;pm.receiveShadow=G.rs;pm.raycast=()=>{};node.add(pm);proxies.push(pm);}
  scene.add(node);node.updateMatrixWorld(true);for(const r of orig)r.o.layers.set(1);
  const X={key:K.key,rooms:K.rooms||[],never:K.never,node,proxies,orig,members:members.slice(),calls:draws-groups.size,t0:now};for(const e of members)e._px=X;
  VPX.clusters.add(X);VPX.cells.set(K.key,X);VPX.built++;SHADOW.dirty=true;return X;}
/* drop a cell (pass the cell, or the thing in it that changed) */
function vpxDrop(a,auto){const X=a&&(a.members?a:a._px);if(!X||!VPX.clusters.has(X))return;const cause=a.members?null:a;
  if(X.node.parent)X.node.parent.remove(X.node);for(const pm of X.proxies)pm.geometry.dispose();for(const r of X.orig)r.o.layers.set(0);for(const e of X.members)if(e._px===X)e._px=null;
  VPX.clusters.delete(X);if(VPX.cells.get(X.key)===X)VPX.cells.delete(X.key);VPX.dropped++;SHADOW.dirty=true;
  if(cause){cause._pxT=now;if(auto){if(now-X.t0<10){cause._pxChurn=(cause._pxChurn||0)+1;if(cause._pxChurn>=3)cause.noProxy=true;}else cause._pxChurn=0;}}}
function vpxChanged(X){for(const e of X.members){if(!e.alive||!e.mesh||!e.mesh.parent||e.batched||(e.dynamic&&!e.parked))return e;}
  for(const r of X.orig){const o=r.o;if(vpxVis(o)!==r.vis||!o.parent||o.material!==r.mat||o.geometry!==r.geo||r.geo.attributes.position.version!==r.pv||o.layers.mask!==2)return r.e;
    for(let j=0;j<r.n;j++){const m=r.n>1?o.material[j]:o.material;if(m!==r.mats[j]||!vpxSigEq(m,r.sigs[j]))return r.e;}
    const a=o.matrixWorld.elements,b=r.snap;for(let k=0;k<16;k++)if(Math.abs(a[k]-b[k])>1e-4)return r.e;}return null;}
/* every frame: cheap, and a piece that moves on its own (a bill falling off the fridge) never shows twice */
function vpxCheck(){vpxFaceCheck();if(!VPX.clusters.size)return;for(const X of [...VPX.clusters]){const c=vpxChanged(X);if(c)vpxDrop(c,true);}}
function vpxAll(){for(const X of [...VPX.clusters])vpxDrop(X);}
function vpxSaved(){let n=0;for(const X of VPX.clusters)n+=X.calls;return n;}
/* the build pass: gather what's eligible by cell; a cell with something new in it is rebuilt with it */
function vpxPass(){const B=new Map();if(!VPX.loose||now-VPX.looseT>10)vpxLoose();for(const e of ents.concat(VPX.loose)){if(!vpxEligible(e))continue;const K=vpxKey(e);let b=B.get(K.key);if(!b){b={K,list:[]};B.set(K.key,b);}b.list.push(e);}
  let n=0;for(const [key,b] of B){if(n>=12)break;const X=VPX.cells.get(key);const all=X?X.members.filter(e=>e.alive&&e._px===X).concat(b.list):b.list;
    const sig=all.map(e=>e.id).sort((p,q)=>p-q).join(',');if(VPX.fail.get(key)===sig)continue;if(X)vpxDrop(X);
    if(vpxBuild(b.K,all))n++;else VPX.fail.set(key,sig);}}
/* wall faces draw as two calls each: the painted side (its own canvas, so texta works) and the edges + back (a shared
   plasterboard or cement material). The edges and backs of a room's faces are merged into one mesh; each face keeps
   drawing its painted side, and its edge group switches to an invisible twin of the same material (raycasts still read it,
   with the same side). Any chunk leaving, coming back or flexing out (faceHide/faceShow touch the vertices) drops the
   room's merge until the face has sat still for 3 s. */
const VPXF={cells:new Map(),invis:new Map(),built:0};
function vpxInvis(m){let c=VPXF.invis.get(m);if(!c){c=m.clone();c.visible=false;c.name=(m.name||'')+' (merged)';VPXF.invis.set(m,c);}return c;}
function vpxFaceDrop(C,f){if(!C||VPXF.cells.get(C.key)!==C)return;if(C.node.parent)C.node.parent.remove(C.node);C.node.children[0].geometry.dispose();
  for(const r of C.list){if(r.o.material===r.mine)r.o.material=r.orig;if(r.f._pxf===C)r.f._pxf=null;}VPXF.cells.delete(C.key);if(f)f._pxT=now;SHADOW.dirty=true;}
function vpxFaceChanged(C){for(const r of C.list){const o=r.o;if(r.f.mesh!==o||!o.parent||o.material!==r.mine||o.geometry!==r.geo||r.geo.attributes.position.version!==r.pv||(r.geo.index&&r.geo.index.version!==r.iv))return r.f;}return null;}
function vpxFacePass(){if(!VW||!VW.faces)return;const B=new Map();
  for(const f of VW.faces){const o=f.mesh;if(!o||!o.parent||f._pxf||!f.room||!Array.isArray(o.material)||o.layers.mask!==1)continue;if(f._pxT&&now-f._pxT<3)continue;const g=o.geometry;const gr=g.groups.find(x=>x.materialIndex===2);if(!gr||!gr.count)continue;const m=o.material[2];if(!vpxMatOk(m))continue;
    const key=f.room.id+'|'+m.uuid;let b=B.get(key);if(!b){b={key,room:f.room.id,m,list:[]};B.set(key,b);}b.list.push(f);}
  for(const [key,b] of B){const C=VPXF.cells.get(key);const all=C?C.list.map(r=>r.f).filter(f=>f._pxf===C).concat(b.list):b.list;if(all.length<2)continue;if(C)vpxFaceDrop(C);
    const items=[],list=[];for(const f of all){const o=f.mesh,g=o.geometry;o.updateMatrixWorld(true);const gr=g.groups.find(x=>x.materialIndex===2);items.push([g,o.matrixWorld.clone(),null,gr.start,gr.count,0,0]);
      const mine=o.material.slice();mine[2]=vpxInvis(o.material[2]);list.push({f,o,orig:o.material,mine,geo:g,pv:g.attributes.position.version,iv:g.index?g.index.version:0});}
    const node=new THREE.Group();node.name='vpxf '+key;node.userData.vpxNode=true;const pm=new THREE.Mesh(vpxMerge(items,false),b.m);pm.userData.pxProxy=true;pm.castShadow=false;pm.receiveShadow=true;pm.raycast=()=>{};node.add(pm);scene.add(node);node.updateMatrixWorld(true);
    const C2={key,room:b.room,node,list};for(const r of list){r.o.material=r.mine;r.f._pxf=C2;}VPXF.cells.set(key,C2);VPXF.built++;}}
function vpxFaceCheck(){if(!VPXF.cells.size)return;for(const C of [...VPXF.cells.values()]){const f=vpxFaceChanged(C);if(f)vpxFaceDrop(C,f);}}
function vpxFaceAll(){for(const C of [...VPXF.cells.values()])vpxFaceDrop(C);}
/* every change to a thing goes through one of these; each drops its cell first so the real pieces take the change */
function vpxHooks(){if(VPX.hooked)return;VPX.hooked=true;const pre=(fn,pick)=>function(...a){try{const L=pick(...a);for(const x of L)if(x&&x._px)vpxDrop(x);}catch(_){}return fn.apply(this,a);};const one=e=>[e];
  damageProp=pre(damageProp,one);dentEnt=pre(dentEnt,one);makeDynamic=pre(makeDynamic,one);wakeEnt=pre(wakeEnt,one);breakPart=pre(breakPart,one);splitPart=pre(splitPart,one);shatterEnt=pre(shatterEnt,one);crackScreen=pre(crackScreen,one);detachPart=pre(detachPart,one);
  breakJoint=pre(breakJoint,j=>[j&&j.a,j&&j.b]);
  useTarget=pre(useTarget,()=>{if(!VPX.clusters.size)return[];const h=castRay(2.1);if(!h||!h.ent)return[];return[h.ent,useOwnerOf(h.ent)];});}
function updateWS8(dt){if(!VPX.on){if(VPX.clusters.size)vpxAll();if(VPXF.cells.size)vpxFaceAll();return;}
  if(!VPX.live){VPX.live=true;raycaster.layers.enable(1);DENT_RC.layers.enable(1);
    /* and again just before the frame is drawn, after the world matrices are fresh: a piece that moved this frame shows this frame */
    const ob=scene.onBeforeRender;scene.onBeforeRender=function(...a){if(VPX.on)vpxCheck();return ob.apply(this,a);};}
  vpxCheck();
  VPX.t2-=dt;if(VPX.t2<=0){VPX.t2=1;vpxPass();vpxFacePass();}}
vpxHooks(); /* at load (function declarations are hoisted), so everything that holds a reference later holds the hooked one */
