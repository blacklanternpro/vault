import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={poseKinDoor,wallPoint,pickUp,drop,getHeld:()=>held,VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_doors.mjs',src);
const t0=performance.now();await import('./game_test_doors.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;









const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(30);const plan=v=>({x:+(v.x+8.8).toFixed(2),z:+(v.z+4.9).toFixed(2)});
let bad=0;
for(const d of G.VS.doors){const w=d.vo.w,o=d.vo.op;const c=G.wallPoint(w,(o.u0+o.u1)/2,0,0);const n=w.normal.clone();n.y=0;n.normalize();const t=w.right.clone();t.y=0;t.normalize();const hw=(o.u1-o.u0)/2-0.06;
  const hits=[];for(const e of G.ents){if(!e.alive||!e.body||e===d||e.kin||e.dormant||e.parked)continue;if(!['prop','furniture','fixture'].includes(e.kind))continue;if(e.trim||/door|architrave|jamb|switch|power point|skirting|cornice|light|fitting|alarm|wire|pipe|carpet|runner|rug|letters/i.test(e.label||''))continue;
    e.body.updateAABB();const a=e.body.aabb;if(a.lowerBound.y>1.8||a.upperBound.y<0.08)continue;
    /* the AABB's corners in door space */let mnU=1e9,mxU=-1e9,mnN=1e9,mxN=-1e9;for(const x of[a.lowerBound.x,a.upperBound.x])for(const z of[a.lowerBound.z,a.upperBound.z]){const dx=x-c.x,dz=z-c.z;const u=dx*t.x+dz*t.z,nn=dx*n.x+dz*n.z;mnU=Math.min(mnU,u);mxU=Math.max(mxU,u);mnN=Math.min(mnN,nn);mxN=Math.max(mxN,nn);}
    if(mxU>-hw&&mnU<hw&&mxN>-0.55&&mnN<0.55)hits.push(e.label+' ['+mnN.toFixed(2)+'..'+mxN.toFixed(2)+']');}
  /* the leaf, swung fully open: does it pass through anything? */const leafHits=[];if(d.kin){const k=d.kin;const ang0=k.ang;for(const a of[k.open]){/* pose */G.poseKinDoor(d,a);d.body.updateAABB();const A=d.body.aabb;for(const e of G.ents){if(!e.alive||!e.body||e===d||e.kin||e.dormant||e.parked||!['prop','furniture','fixture'].includes(e.kind))continue;if(/door|architrave|jamb|switch|power point|skirting|light|fitting|alarm|carpet|runner|rug/i.test(e.label||''))continue;e.body.updateAABB();const B=e.body.aabb;if(B.lowerBound.y>1.8||B.upperBound.y<0.08)continue;if(A.lowerBound.x<B.upperBound.x-0.01&&A.upperBound.x>B.lowerBound.x+0.01&&A.lowerBound.z<B.upperBound.z-0.01&&A.upperBound.z>B.lowerBound.z+0.01)leafHits.push(e.label);}}G.poseKinDoor(d,ang0);}
  if(leafHits.length)hits.push('LEAF HITS: '+leafHits.slice(0,4).join(','));
  const lab=w.rooms.front+'|'+w.rooms.back;console.log((hits.length?'BLOCKED ':'clear   ')+lab.padEnd(18),'at',JSON.stringify(plan(c)),hits.slice(0,6).join('; '));if(hits.length)bad++;}
console.log('doors blocked',bad,'of',G.VS.doors.length);console.log('DONE');process.exit(0);
