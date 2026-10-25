import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_baths.mjs',src);
const t0=performance.now();await import('./game_test_baths.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;



const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(30);
console.log('taps',G.VW4.taps.length,G.VW4.taps.map(t=>t.label).join(','),'bodies',G.world.bodies.length,'exhausts',G.VW4.exhaust.length);
const plug=G.ents.find(e=>e.label==='bath plug');plug.use();const bt=G.VW4.taps.find(t=>t.label==='BATH TAP');bt.e.use();run(60*95);console.log('bath level after 95 s',G.VW4.bath.level.toFixed(2),'water y',G.VW4.bath.water.position.y.toFixed(2),'overflow warned',!!G.VW4.bath.warned);
const cist=G.ents.find(e=>e.label==='toilet cistern');cist.use();console.log('flush timer',G.VW4.flushT.toFixed(1));G.damageProp(cist,3,cist.mesh.position.clone());run(10);console.log('cistern alive',cist.alive,'inlet leaks',G.PIPES.filter(p=>p.label==='cistern inlet').length);
const sh=G.VW4.taps.find(t=>t.label==='SHOWER');sh.e.use();run(30);console.log('shower on',sh.on);
const md=G.ents.filter(e=>e.label==='mirror door');md[0].use();run(60);console.log('mirror doors',md.length,'opened',md[0].kin.ang.toFixed(2));
console.log('bodies',G.world.bodies.length);console.log('DONE');process.exit(0);
