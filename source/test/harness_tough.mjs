import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={pickUp,drop,getHeld:()=>held,VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_tough.mjs',src);
const t0=performance.now();await import('./game_test_tough.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;







const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(60);const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);const W=(px,pz)=>[px-8.8,pz-4.9];
let shat=0;const os=G.shatterEnt;
const dyn0=G.dynamics.length;const chair=G.ents.find(e=>e.label&&/dining chair|chair/i.test(e.label)&&!e.dynamic);console.log('chair',chair&&chair.label,chair&&chair.mass);
G.makeDynamic(chair);G.pickUp(chair,1.1);const pb=G.player.body;
/* walk the chair along the kitchen bench and round the dining table, turning as we go */
const path=[[6.0,1.2],[4.5,1.0],[3.2,1.0],[3.2,2.6],[5.0,3.2],[7.0,3.4],[8.6,2.0],[8.6,0.8],[6.4,0.8]];let k=0;
for(const [x,z] of path){const [wx,wz]=W(x,z);for(let i=0;i<50;i++){const dx=wx-pb.position.x,dz=wz-pb.position.z;const d=Math.hypot(dx,dz);if(d>0.05){pb.velocity.x=dx/d*2.2;pb.velocity.z=dz/d*2.2;}G.player.yaw+=0.05*Math.sin(k++*0.2);G.step(1/60);}}
const held=G.getHeld();console.log('still holding',!!held&&held.ent===chair);
const woke=G.dynamics.filter(e=>e!==chair&&!e.frag&&e.label&&!/cord|plug/.test(e.label)).map(e=>e.label);console.log('woken while carrying',woke.length,JSON.stringify(woke.slice(0,12)));
G.drop();run(30);
/* plates: one from 30 cm, one from bench height */const pl=G.ents.filter(e=>e.label==='dirty plate'&&e.alive);console.log('plates',pl.length);
const a=pl[pl.length-1],b=pl[pl.length-2];const [ax,az]=W(7.0,2.6),[bx,bz]=W(7.6,2.6);
G.makeDynamic(a);a.body.position.set(ax,0.32,az);a.body.velocity.set(0,0,0);G.makeDynamic(b);b.body.position.set(bx,1.0,bz);b.body.velocity.set(0,0,0);run(90);console.log('plate from 30cm alive',a.alive,'plate from 1m alive',b.alive);
let nan=0;for(const bb of G.world.bodies)if(!isFinite(bb.position.x))nan++;console.log('NaN bodies',nan);console.log('DONE');process.exit(0);
