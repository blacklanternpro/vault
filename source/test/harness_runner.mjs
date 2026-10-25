import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={pickUp,drop,getHeld:()=>held,VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_runner.mjs',src);
const t0=performance.now();await import('./game_test_runner.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;








const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(60);const W=(px,pz)=>[px-8.8,pz-4.9];
const rn=G.ents.find(e=>e.label==='hallway runner');const rug=G.ents.find(e=>e.label==='rug');console.log('runner',!!rn,'batched',rn.batched,'parked',rn.parked,'y',rn.body.position.y.toFixed(4),'dyn',rn.dynamic,'rug dyn',rug&&rug.dynamic);
const pb=G.player.body;const [x0,z0]=W(5.0,4.5),[x1,z1]=W(13.0,4.5);pb.position.set(x0,0.37,z0);
for(let i=0;i<300;i++){pb.velocity.x=2.5;pb.velocity.z=0;G.step(1/60);}
console.log('after walk: runner dyn',rn.dynamic,'y',rn.body.position.y.toFixed(4),'pos',rn.body.position.x.toFixed(3),rn.body.position.z.toFixed(3),'player',pb.position.x.toFixed(2),pb.position.y.toFixed(2));
const [rx,rz]=W(9.2,7.2);pb.position.set(rx-1.5,0.37,rz);for(let i=0;i<120;i++){pb.velocity.x=2.5;pb.velocity.z=0;G.step(1/60);}console.log('rug dyn after walk',rug&&rug.dynamic);
console.log('DONE');process.exit(0);
