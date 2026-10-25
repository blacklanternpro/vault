import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_rooms.mjs',src);
const t0=performance.now();await import('./game_test_rooms.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;





const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};run(30);const plan=v=>({x:+(v.x+8.8).toFixed(2),y:+v.y.toFixed(2),z:+(v.z+4.9).toFixed(2)});const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);
const msgs=[];const om=G.HUD.msg.bind(G.HUD);G.HUD.msg=(t,d)=>{msgs.push(t);om(t,d);};
const R=G.VR6;console.log('offs int',G.vFaceOff(13.8,5.0,0,1).toFixed(3),G.vFaceOff(11.6,8.65,1,0).toFixed(3),'ext',G.vFaceOff(15.05,0,0,1).toFixed(3),G.vFaceOff(17.6,6.2,-1,0).toFixed(3),G.vFaceOff(0,8.55,1,0).toFixed(3),'living E',G.vFaceOff(11.6,7.2,-1,0).toFixed(3));console.log('bodies',G.world.bodies.length,'parked',G.VW.parked);
console.log('bed',JSON.stringify(plan(R.bed.mesh.position)),'covers trap',(()=>{const b=R.bed.mesh.position,t=G.VB.trap.mesh.position;return Math.abs(b.x-t.x)<0.8&&Math.abs(b.z-t.z)<1.2;})());
console.log('bed2 frame',G.BED.frame&&JSON.stringify(plan(G.BED.frame.mesh.position)),'lamps in pool',G.VL.fix.filter(f=>f.follow).length);
R.fan.e.use();R.fan.e.use();R.fan.e.use();run(60*6);console.log('fan spd',R.fan.spd,'w',R.fan.w.toFixed(2));
R.fan.e.onHit(R.fan.p.clone().add(V(0.3,-0.4,0)),2,V(1,0,0));run(60);console.log('blades on',R.fan.blades.filter(b=>b.on).length,'msg',msgs.at(-1));
const blade=G.ents.find(e=>e.label==='fan blade (airborne)');console.log('blade dyn',blade&&blade.dynamic,blade&&JSON.stringify(plan(blade.mesh.position)));
R.radio.e.use();run(10);console.log('radio',R.radio.on);
R.amp.e.use();const gt=G.ents.find(e=>e.label==='electric guitar');gt.use();run(10);console.log('amp',R.amp.on,'guitar',!!gt);
for(let i=0;i<7;i++){R.beer.e.use();run(5);}console.log('beer left',R.beer.n,'cans',G.ents.filter(e=>e.label&&e.label.startsWith('SWILL can (')).length,msgs.at(-1));
const tin=R.tins[0];tin.onHit(tin.mesh.getWorldPosition(V(0,0,0)),2,V(0,0,1));run(60);console.log('tin burst',tin.burst,msgs.at(-1));
for(let i=0;i<6;i++){R.mower.e.use();run(5);if(R.mower.on)break;}run(60);console.log('mower on',R.mower.on);
const db=G.ents.find(e=>e.label==='dartboard');for(let i=0;i<4;i++)db.use();console.log('darts',R.darts.length,msgs.at(-1));
R.line.e.use();R.line.e.use();run(60);console.log('line w',R.line.w.toFixed(2),'rot',R.line.head.rotation.y.toFixed(2));
const nt=G.ents.find(e=>e.label==='letters (GARY)');for(let i=0;i<5;i++)nt.use();console.log('notice',msgs.at(-1));
R.hws.e.onHit(R.hws.e.mesh.position.clone().add(V(0,1,0)),2.5,V(0,0,1));run(30);console.log('hws vent',R.hws.vent.toFixed(2),'pilot',R.hws.pilot.visible);
R.bike.e.use();run(10);console.log('bike w',R.bike.w.toFixed(1));R.rattler.e.use();run(10);console.log('rattler',R.rattler.on);
const hose=R.hose;hose.e.use();run(30);console.log('hose t',hose.t.toFixed(1));
const btn=G.ents.find(e=>e.label==='roller door button');btn.use();run(60*4);console.log('roller target',G.VS.roller.target,'k',G.VS.roller.k.toFixed(2));
const preB=new Set(G.world.bodies);console.log('pre-bed bodies',G.world.bodies.length,'parked left',G.ents.filter(e=>e.parked).length);/* wake the bed (a big hit) and check it moves off the trapdoor */G.makeDynamic(R.bed);console.log('cms',G.world.contactmaterials.map(m=>m.materials.map(x=>x.name).join('/')+':'+m.friction).join(' '));for(let k=0;k<6;k++){if(k<3)R.bed.body.velocity.z=1.6;run(15);console.log('  bed',JSON.stringify(plan(R.bed.mesh.position)),'v',R.bed.body.velocity.z.toFixed(2),'type',R.bed.body.type,'mass',R.bed.body.mass,'inworld',G.world.bodies.includes(R.bed.body));}console.log('bed after shove',JSON.stringify(plan(R.bed.mesh.position)),'covers now',(()=>{const b=R.bed.mesh.position,t=G.VB.trap.mesh.position;return Math.abs(b.z+1.1-t.z)<0.35;})());
{const c={};for(const b of G.world.bodies)if(!preB.has(b)){const l=(b.ent&&b.ent.label)||'?';c[l]=(c[l]||0)+1;}console.log('new bodies',JSON.stringify(c));}let nan=0;for(const b of G.world.bodies)if(!isFinite(b.position.x))nan++;console.log('NaN bodies',nan,'bodies',G.world.bodies.length);console.log('DONE');process.exit(0);
