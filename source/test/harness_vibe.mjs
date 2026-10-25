import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={VCULL,BOND,VIBE,bondHit,vibeKey,detachChunk,shatterEnt,vRipStrip,inKey,getLocked:()=>locked,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_vibe.mjs',src);
const t0=performance.now();await import('./game_test_vibe.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;






const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(30);const plan=v=>({x:+(v.x+8.8).toFixed(2),y:+v.y.toFixed(2),z:+(v.z+4.9).toFixed(2)});const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);
const msgs=[];const om=G.HUD.msg.bind(G.HUD);G.HUD.msg=(t,d)=>{msgs.push(t);om(t,d);};
console.log('bodies',G.world.bodies.length,'parked',G.VW.parked,'bond live',G.BOND.live,'el',G.BOND.el&&G.BOND.el.textContent);run(90);console.log('bond live',G.BOND.live);
const f=G.FACES.find(f=>f.room&&f.room.id==='living');const c=f.chunks.find(c=>c.alive&&c.attached);G.detachChunk(c,V(0,0,1),2);run(5);
const wg=G.ents.find(e=>e.mat==="glass"&&e.vo&&e.alive);G.shatterEnt(wg,wg.mesh.position.clone());run(5);
const strip=G.VS.strips.find(e=>e.alive);G.vRipStrip(strip);run(5);
console.log('bond',G.BOND.total,JSON.stringify([...G.BOND.items]),'|',G.BOND.el.textContent);
G.vibeKey('KeyB');console.log('list open',G.BOND.open,G.BOND.list.style.display,G.BOND.list.textContent.slice(0,160));
G.vibeKey('KeyN');run(120);console.log('2am',G.VIBE.am2,'k',G.VIBE.k.toFixed(2),'ceiling on',G.VL.fix.filter(f=>!f.circuit&&f.on!==false&&f.lvl!=='b').length,'lamps on',G.VL.fix.filter(f=>f.circuit==='power'&&f.on).length,'hemi',G.VL.hemi.intensity.toFixed(2));
G.vibeKey('KeyN');run(60);console.log('2am off',G.VIBE.am2,'ceiling on',G.VL.fix.filter(f=>!f.circuit&&f.on!==false&&f.lvl!=='b').length);
const N=G.VIBE.neon;console.log('neon lit',N.lit,'fix i',N.fix.i);
const B=G.VIBE.bag;const p0=B.e.body.position.clone();B.e.onHit(B.e.mesh.position.clone(),2,V(1,0,0));for(let i=0;i<4;i++){run(15);console.log('  bag',JSON.stringify(plan(B.e.body.position)),'d anchor',B.e.body.position.distanceTo(B.anchor.position).toFixed(3));}
const A=G.VIBE.am;A.e.use();await new Promise(r=>setTimeout(r,9000));console.log('am msgs',msgs.filter(m=>m.includes('MESSAGE')||m.includes('GARY')).slice(0,4).join(' | '));
console.log('clutter',G.ents.filter(e=>/SWILL can|pizza box|dirty plate|takeaway|newspaper|runner/.test(e.label||'')).length);
{const D=[[3.8,9.0,0],[10.9,9.3,0.98],[12.3,9.3,-0.44],[2.7,4.5,2.65],[6.0,-7.5,-2.6],[15.2,3.5,-0.76],[5.0,13.8,0.25],[9.0,4.5,-1.57]];for(const [x,z,yw] of D){G.player.yaw=yw;G.player.body.position.set(x-8.8,0.37,z-4.9);G.player.body.velocity.set(0,0,0);run(20);console.log('cull at',x,z,'vis',[...G.VCULL.vis].join(','),'hidden',G.VCULL.hid.size);}}let nan=0;for(const b of G.world.bodies)if(!isFinite(b.position.x))nan++;console.log('NaN bodies',nan,'bodies',G.world.bodies.length);console.log('DONE');process.exit(0);
