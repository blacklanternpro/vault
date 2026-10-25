
/* ============================================================ v8.0 — WS8: MOVE IN + THE OPTIMISATION PASS
   p9o — proxies for the things that draw as dozens of pieces. The bedsit's appliances came over as 20–30 meshes each (the
   fridge with its magnets and shelves, the CRT, the tower's innards), every one its own draw call. While such a thing sits
   untouched, its pieces are merged into one mesh per material and the originals move to layer 1: the camera (layer 0)
   stops drawing them, but every raycaster also reads layer 1, so hits, dents, screen cracks and use-targets land on the
   real pieces exactly as before. The proxy is dropped the moment anything about the thing changes (a hit, a dent, a use,
   it wakes, a piece moves or hides) and rebuilt once it has sat still for 3 s. */

const VPX={list:[],t:0,t2:0,live:false,on:true,built:0,dropped:0};
function vpxEligible(e){if(!e.alive||!e.mesh||e.batched||e.dynamic||e.dormant||e.parked||!e.mesh.parent||e.noProxy||e.kin||e.slide||e.cord||e._px)return false;
  if(e._pxT&&now-e._pxT<3)return false;if(e._pxN===undefined){let n=0;e.mesh.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!o.isSkinnedMesh)n++;});e._pxN=n;}return e._pxN>=5;}
function vpxBuild(e){e.mesh.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(e.mesh.matrixWorld).invert();const groups=new Map(),orig=[];let cast=false;
  e.mesh.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.userData.pxProxy||o.layers.mask!==1)return;let vis=true,p=o;while(p&&p!==e.mesh.parent){if(!p.visible){vis=false;break;}p=p.parent;}
    const m=o.material,g=o.geometry;const ok=vis&&m&&!Array.isArray(m)&&!m.isShaderMaterial&&!m.vertexColors&&!m.transparent&&g&&g.attributes.position&&g.attributes.normal&&!g.attributes.color&&!(g.groups&&g.groups.length>1)&&!o.morphTargetInfluences&&o.matrixWorld.determinant()>0;
    if(!ok)return;const rel=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);let L=groups.get(m);if(!L){L=[];groups.set(m,L);}L.push([g,rel]);orig.push({o,snap:o.matrixWorld.elements.slice(),vis:o.visible});if(o.castShadow)cast=true;});
  if(orig.length<5||groups.size>=orig.length){e.noProxy=true;return false;}
  const proxies=[];for(const [m,L] of groups){const pm=new THREE.Mesh(vMergeGeos(L),m);pm.userData.pxProxy=true;pm.castShadow=cast;pm.receiveShadow=true;pm.raycast=()=>{};pm.geometry.computeBoundingSphere();e.mesh.add(pm);proxies.push(pm);}
  for(const r of orig)r.o.layers.set(1);e._px={proxies,orig,root:e.mesh.matrixWorld.elements.slice()};VPX.list.push(e);VPX.built++;SHADOW.dirty=true;return true;}
function vpxDrop(e){const X=e&&e._px;if(!X)return;for(const pm of X.proxies){if(pm.parent)pm.parent.remove(pm);pm.geometry.dispose();}for(const r of X.orig)r.o.layers.set(0);e._px=null;e._pxT=now;const i=VPX.list.indexOf(e);if(i>=0)VPX.list.splice(i,1);VPX.dropped++;SHADOW.dirty=true;}
function vpxChanged(e){const X=e._px;const a=e.mesh.matrixWorld.elements,b=X.root;for(let k=12;k<15;k++)if(Math.abs(a[k]-b[k])>1e-4)return true;
  for(const r of X.orig){if(r.o.visible!==r.vis||!r.o.parent)return true;const m=r.o.matrixWorld.elements,s=r.snap;for(let k=0;k<16;k++)if(Math.abs(m[k]-s[k])>1e-4)return true;}return false;}
function vpxAll(){for(const e of VPX.list.slice())vpxDrop(e);}
function updateWS8(dt){if(!VPX.on){if(VPX.list.length)vpxAll();return;}
  if(!VPX.live){VPX.t+=dt;if(VPX.t<2)return;VPX.live=true;raycaster.layers.enable(1);if(typeof DENT_RC!=='undefined')DENT_RC.layers.enable(1);}
  VPX.t-=dt;if(VPX.t<=0){VPX.t=0.5;for(const e of VPX.list.slice()){if(!e.alive||e.dynamic||!e.mesh.parent||vpxChanged(e))vpxDrop(e);}}
  VPX.t2-=dt;if(VPX.t2<=0){VPX.t2=1;let n=0;for(const e of ents){if(n>=40)break;if(vpxEligible(e)){if(vpxBuild(e))n++;}}}}
