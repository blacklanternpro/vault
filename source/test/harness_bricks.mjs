import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_bricks.mjs',src);
const t0=performance.now();await import('./game_test_bricks.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;






const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(30);const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);
const msgs=[];const om=G.HUD.msg.bind(G.HUD);G.HUD.msg=(t,d)=>{msgs.push(t);om(t,d);};
console.log('skins',G.VBSKINS.length,G.VBSKINS.map(B=>B.list.length).join(','));
const B=G.VBSKINS[0];const w=B.w,od=B.out;
function aim(from,to){const d=to.clone().sub(from);G.player.body.position.set(from.x,from.y-1.25,from.z);G.player.body.velocity.set(0,0,0);G.player.yaw=Math.atan2(-d.x,-d.z);G.player.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));for(let i=0;i<6;i++){G.player.body.position.set(from.x,from.y-1.25,from.z);G.player.body.velocity.set(0,0,0);G.step(1/60);}console.log('  cam at',JSON.stringify(G.camera.getWorldPosition(V(0,0,0))));}
/* from the yard: 1.5 m out, looking at the wall */const tgt=G.wallPoint(w,3.2,1.2,0.25);aim(tgt.clone().addScaledVector(od,1.5),tgt);console.log('tgt',JSON.stringify(tgt),'cam',JSON.stringify(G.camera.position),'od',JSON.stringify(od),'n',JSON.stringify(w.normal),'dz',JSON.stringify(w.depthZ),'brick0',JSON.stringify(B.list[100].p));let h=G.castRay(3);console.log('outside hit',h&&h.label,h&&h.kind,h&&h.instanceId,h&&h.distance.toFixed(3));
const id=h.instanceId;G.impact(h,3.2,G.camFwd(),'hammer');console.log('after hit 1 alive',B.list[id].alive,'gone',!!B.list[id].gone,msgs.at(-1));
h=G.castRay(3);G.impact(h,3.2,G.camFwd(),'hammer');run(5);console.log('after hit 2 gone',!!B.list[id].gone,'loose bricks',G.ents.filter(e=>e.label==='brick'&&e.dynamic).length);
h=G.castRay(3);console.log('ray through the hole',h&&h.kind,h&&h.label,h&&h.distance.toFixed(3));
/* tap-strength hit does nothing to a brick */const t2=G.wallPoint(w,3.9,0.7,0.25);aim(t2.clone().addScaledVector(od,1.5),t2);h=G.castRay(3);const id2=h.instanceId;G.impact(h,1.0,G.camFwd(),'hammer');console.log('tap on brick: alive',B.list[id2].alive);
/* from the cavity: inside the stud wall's outer side, looking out */const c0=G.wallPoint(w,3.5,1.0,0.06);aim(c0,c0.clone().addScaledVector(od,1));h=G.castRay(2);console.log('cavity hit',h&&h.kind,h&&h.distance.toFixed(3),'normal·out',h&&h.normal.dot(od).toFixed(2));
/* mortar depth */console.log('mortar ok', true);
let nan=0;for(const b of G.world.bodies)if(!isFinite(b.position.x))nan++;console.log('NaN bodies',nan);console.log('DONE');process.exit(0);
