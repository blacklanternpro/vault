import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={hammerTapContact,hammerSmash,HA,KITCH,FRIDGE,pickUp,drop,getHeld:()=>held,VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_hammer.mjs',src);
const t0=performance.now();await import('./game_test_hammer.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;








const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(60);const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);
const msgs=[];const om=G.HUD.msg.bind(G.HUD);G.HUD.msg=(t,d)=>{msgs.push(t);om(t,d);};
function aimAt(e,off){const p=e.mesh.getWorldPosition(V(0,0,0)).add(V(0,0.3,0));const from=p.clone().add(off);for(let k=0;k<3;k++){for(let i=0;i<6;i++){G.player.body.position.set(from.x,0.37,from.z);G.player.body.velocity.set(0,0,0);G.step(1/60);}const c=G.camera.getWorldPosition(V(0,0,0));const d=p.clone().sub(c);G.player.yaw=Math.atan2(-d.x,-d.z);G.player.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));}for(let i=0;i<4;i++){G.player.body.position.set(from.x,0.37,from.z);G.player.body.velocity.set(0,0,0);G.step(1/60);}}
const tap=()=>{G.hammerTapContact();G.HA.st='idle';run(4);};
/* the fridge: five taps */const fr=G.FRIDGE.body||G.KITCH.fridge;console.log('fridge',fr&&fr.label,fr&&fr.kind,fr&&fr.mass,'hp',fr&&fr.hp);
aimAt(fr,V(1.1,0,0));const hp0=fr.hp;{const h=G.castRay(2.3);globalThis.DOOR=h.ent;console.log('door hp',h.ent.hp,'mass',h.ent.mass,'kind',h.ent.kind);console.log('aim hits',h&&h.kind,h&&h.ent&&h.ent.label,h&&h.distance.toFixed(2),'dentMeshes',fr.dentMeshes&&fr.dentMeshes.length);}for(let i=0;i<5;i++)tap();console.log('fridge hp after 5 taps',hp0,'->',fr.hp,'door hp now',globalThis.DOOR.hp,'fridge dynamic',fr.dynamic,'door dynamic',globalThis.DOOR.dynamic,'acc',globalThis.DOOR.acc,'dents?',msgs.slice(-3).join(' | '));
/* a mug: taps add up */const mug=G.ents.find(e=>e.alive&&/mug/i.test(e.label||'')&&!e.dynamic);console.log('mug',mug&&mug.label,mug&&mug.hp);
/* a wall sheet: tap until it goes */const f=G.FACES.find(f=>f.room&&f.room.id==='living');const ch=f.chunks.find(c=>c.alive&&c.attached&&c.mesh!==undefined)||f.chunks.find(c=>c.alive&&c.attached);
let n=0;for(;n<12&&ch.attached;n++){G.impact({kind:'drywall',ent:ch,point:ch.center?ch.center.clone():f.wall.origin.clone(),normal:V(0,0,1)},1.0,V(0,0,1),'tap');}console.log('sheet punched after',n,'taps, attached',ch.attached);
/* a brick ignores a tap, chips on a full power hit */
const B=G.VBSKINS[0];const br=B.list[400];console.log('brick before',br.alive);
let nan=0;for(const bb of G.world.bodies)if(!isFinite(bb.position.x))nan++;console.log('NaN bodies',nan);console.log('DONE');process.exit(0);
