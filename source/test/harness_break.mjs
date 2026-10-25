import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={damageProp,breakPart,compoundParts,pickUp,drop,getHeld:()=>held,VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_break.mjs',src);
const t0=performance.now();await import('./game_test_break.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;










const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(30);const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);
const msgs=[];const om=G.HUD.msg.bind(G.HUD);G.HUD.msg=(t,d)=>{msgs.push(t);om(t,d);};
for(const L of ['timber TV cabinet','hall table','three-seat velour lounge','bookshelf','workbench']){const e=G.ents.find(x=>x.alive&&x.label===L);if(!e){console.log('missing',L);continue;}
  const parts0=G.compoundParts(e).length;const c=e.mesh.getWorldPosition(V(0,0,0));let hits=0;const before=new Set(G.ents);
  while(e.alive&&G.compoundParts(e).length===parts0&&hits<40){G.damageProp(e,3.5,c.clone().add(V(0,0.2,0)),V(1,0,0),null);hits++;}
  run(30);const pieces=G.ents.filter(x=>x.alive&&!before.has(x)&&/\(piece\)/.test(x.label||''));
  console.log(L,'parts',parts0,'-> first break after',hits,'power hits; parts now',e.alive?G.compoundParts(e).length:'gone','dynamic',e.dynamic,'pieces',pieces.length,pieces.slice(0,2).map(p=>p.label+' m'+p.mass.toFixed(1)+' size '+(p.size?[p.size.x,p.size.y,p.size.z].map(v=>v.toFixed(2)).join('x'):'-')).join(' | '),msgs.at(-1));
  /* smash the first piece to bits */const pc=pieces[0];if(pc){let n=0;const b0=G.ents.length;while(n<30&&G.ents.some(x=>x===pc&&x.alive)){G.damageProp(pc,3.5,pc.mesh.getWorldPosition(V(0,0,0)),V(0,1,0),null);n++;}run(10);const halves=G.ents.filter(x=>x.alive&&!before.has(x)&&/\(piece\)/.test(x.label||'')).length;console.log('   piece gone after',n,'hits; pieces about now',halves,msgs.at(-1));}}
let nan=0;for(const b of G.world.bodies)if(!isFinite(b.position.x))nan++;console.log('NaN bodies',nan,'bodies',G.world.bodies.length);console.log('DONE');process.exit(0);
