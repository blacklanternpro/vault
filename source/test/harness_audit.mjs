import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={damageProp,pickUp,drop,getHeld:()=>held,VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_audit.mjs',src);
const t0=performance.now();await import('./game_test_audit.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;









const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(30);const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);
const skip=/door|architrave|jamb|switch|power point|skirting|cornice|fitting|alarm|wire|pipe|carpet|runner|rug|letters|trim|brick|batten|plate|stud|noggin|sheet|tile|floor|ceiling|roof|joist|rafter|manhole|hatch|trapdoor|padlock|meter|board|fan|clothesline|cord|plug|socket|lamp|tube/i;
const cands=G.ents.filter(e=>e.alive&&e.body&&!e.dormant&&['furniture','fixture'].includes(e.kind)&&!skip.test(e.label||'')&&(e.mass||0)>=2);
const res={broke:[],never:[]};const seen=new Set();
for(const e of cands){const key=e.label;if(seen.has(key))continue;seen.add(key);const n0=G.ents.filter(x=>x.alive).length;const kids0=e.mesh?e.mesh.children.length:0;const j0=e.joints.filter(j=>j.intact).length;
  const c=e.mesh.getWorldPosition(V(0,0,0));for(let k=0;k<25&&e.alive;k++){G.damageProp(e,3.5,c.clone().add(V((Math.random()-0.5)*0.2,(Math.random()-0.5)*0.2,(Math.random()-0.5)*0.2)),V(1,0,0),null);}
  const changed=!e.alive||(e.mesh&&e.mesh.children.length<kids0)||e.joints.filter(j=>j.intact).length<j0||G.ents.filter(x=>x.alive).length>n0+2;
  (changed?res.broke:res.never).push(`${e.label} [${e.mat}, ${Math.round(e.mass)} kg, ${kids0} parts${e.asm?', asm':''}${e.size?', box':''}]`);}
console.log('AUDIT breaks:',res.broke.length,'never:',res.never.length);console.log('NEVER BREAKS:\n  '+res.never.join('\n  '));console.log('BREAKS:\n  '+res.broke.join('\n  '));console.log('DONE');process.exit(0);
