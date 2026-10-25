import {JSDOM} from 'jsdom';
import {createCanvas} from 'canvas';
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__BEDSIT=true;
globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;
globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const origCreate=win.document.createElement.bind(win.document);
win.document.createElement=(tag)=>{if(tag==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return origCreate(tag);};
globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=(await import('fs')).readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/, "const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},setRenderTarget(){},getRenderTarget(){return null},getClearColor(c){return c},getClearAlpha(){return 1},setClearColor(){},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={exPressNext,exSpawnSubject,exMenuToggle,exMenuMove,exMenuPick,MARKS,exSolids,exUseTarget,exUseLabel,exBlowHandle,exSubjectWalk,keys,EX,SEAT,MON,sitDown,standUp,exFire,exGo,exReset,exUpdate3D,renderExecutioner,crtAlive,EXP,pickUp,drop,pryTarget,pryStep,partAttached,detachPart,burstCan,milkBurst,SPRAYS,crackScreen,damageProp,handsGrab,handsUpdate,grabRef:()=>grab,TVS,ents,FRIDGE,TV,PC,MW,KETTLE,TOAST,CORDS,useTarget,dentEnt,unplugCord,KINDOORS,LIMITED,updateKinDoors,crtImplode,pcToggle,scene,ents,dynamics,asms,world,castRay,hammerTap,hammerSmash,bootKick,player,setTool,sawUpdate,mouse,keys,saw,crow,crowWedge,crowLever,handsGrab,handsUpdate,held:()=>held,grab:()=>grab,throwHeld,recomputeSupport,recomputeTimber,WALLS,FACES,WC,WE,WS,WBW,KITCH,DESK,BED,LIGHT,HUD,updateCamera,updateTools,syncAll,checkJoints,P,updateLight,textaUpdate,splitTimber,screws,BRICKS,ROOF,detachChunk,makeDynamic,wakeAsm,impact,damageProp,splitPart,cutWire,WIRES,PIPES,puncturePipe,updateLeak,cullDebris,arcFlash,tripBreaker,S,camera,yawObj,pitchObj,camFwd,fulcrumCheck,breakJoint,fixtureDrop,DOORS,FLOOR,plankAt,pryPlank,hammerPryStart,hammerPryUpdate,hitRoot,BVH:()=>BVH,now:()=>now,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);updateHingeLimits();updateCords();runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateLeak(dt);updateAppliances(dt);updateSeat(dt);renderExecutioner();HUD.update(dt);cullDebris();flushBatches();for(const d of DRAWABLES)d.flush();scene.updateMatrixWorld(true);}};\n");
(await import('fs')).writeFileSync('game_test_ex2.mjs',src);
await import('./game_test_ex2.mjs');
const G=globalThis.G;const V=(x,y,z)=>new G.camera.position.constructor(x,y,z);const step=(n=1)=>{for(let i=0;i<n;i++)G.step(1/60);};
const EX=G.EX;const wpos=(o)=>o.getWorldPosition(V(0,0,0));
const aim=(tp)=>{const c=EX.cam.getWorldPosition(V(0,0,0));const d=tp.clone().sub(c);EX.aimYaw=Math.atan2(-d.x,-d.z);EX.aimPitch=Math.atan2(d.y,Math.hypot(d.x,d.z));EX.kickP=0;step(1);};
const fireAt=(p)=>{aim(p);EX.cool=0;EX.reloadT=0;if(EX.mag<1)EX.mag=12;G.exFire();step(2);};
step(60);G.PC.use();step(60*4);G.SEAT.use();step(60*5);G.EX.trigger();step(2);G.EX.trigger();step(100);console.log('state',EX.state,'subject',EX.pris.num,EX.pris.stage,'P',EX.P.x,EX.P.z);
// walk forward into the window wall
G.keys.KeyW=true;EX.aimYaw=0;step(60*5);G.keys.KeyW=false;step(20);console.log('walked to z',EX.P.z.toFixed(2),'(wall at -2.5, r .22) cam',EX.cam.position.z.toFixed(2));
// walk to the door, try the handle with F
EX.P.x=2.6;EX.P.z=-1.8;step(5);aim(V(2.03,1.0,-2.5));console.log('use target',JSON.stringify(G.exUseLabel(G.exUseTarget())));EX.use();step(5);console.log(' cap',EX.cap.text,'locked',EX.door.locked);
// walk into the closed door
G.keys.KeyW=true;EX.aimYaw=0;step(120);G.keys.KeyW=false;console.log(' blocked at z',EX.P.z.toFixed(2));
// shoot the door glass: stops
const n0=EX.sci.filter(s=>s.alive).length;fireAt(V(2.45,1.4,-2.55));console.log('door glass cracks',EX.door.cracks,'sci alive',n0);
// shoot the handle twice
const hp=EX.handleMeshes[0].getWorldPosition(V(0,0,0));fireAt(hp);console.log('handle hits',EX.door.hits,'locked',EX.door.locked);fireAt(EX.handleMeshes[0].getWorldPosition(V(0,0,0)));step(120);console.log(' after 2nd: locked',EX.door.locked,'open',EX.door.open.toFixed(2),'leaf rot',EX.doorLeaf.rotation.y.toFixed(2),'sci panic',EX.sci.map(s=>s.panic));
{const sx=EX.P.x,sz=EX.P.z;for(const [x0,yaw] of [[2.1,0.15],[2.8,-0.2],[2.0,0.35]]){EX.P.x=x0;EX.P.z=-1.6;EX.P.vx=0;EX.P.vz=0;EX.aimYaw=yaw;G.keys.KeyW=true;step(90);G.keys.KeyW=false;console.log('angled walk from x',x0,'yaw',yaw,'-> z',EX.P.z.toFixed(2),'x',EX.P.x.toFixed(2),'door open',EX.door.open.toFixed(2),'leaf rotY',EX.doorLeaf.rotation.y.toFixed(2));}EX.P.x=sx;EX.P.z=sz;}
// walk through into the control room
EX.P.x=2.6;EX.P.z=-2.2;EX.aimYaw=0;G.keys.KeyW=true;step(120);G.keys.KeyW=false;console.log('in control room z',EX.P.z.toFixed(2),'entered',EX.entered);step(240);console.log(' sci acts',EX.sci.map(s=>s.act+(s.cower?'(cower)':'')).join(','),'cap',EX.cap.text);
// use the cover + button
EX.P.x=1.55;EX.P.z=-3.55;step(3);aim(V(1.55,0.99,-3.02));console.log('use label',G.exUseLabel(G.exUseTarget()));EX.use();step(30);console.log(' cover open',EX.cover.open,'label now',G.exUseLabel(G.exUseTarget()));EX.use();step(5);console.log(' pressed: hatch tgt',EX.hatch.tgt,'pending',!!EX.pending);
step(60*3);console.log(' new subject',EX.pris.num,EX.pris.temper,'stage',EX.pris.stage,'pos',EX.pris.group.position.x.toFixed(2),EX.pris.group.position.z.toFixed(2),'hatch',EX.hatch.y.toFixed(2));
for(let i=0;i<60*15&&EX.pris.stage!=='ready';i++)step(1);console.log(' arrived stage',EX.pris.stage,'at',EX.pris.group.position.x.toFixed(2),EX.pris.group.position.z.toFixed(2),'mark',JSON.stringify(EX.pris.mark),'hood',!!EX.pris.hood,'hatch',EX.hatch.y.toFixed(2));
step(60*8);console.log(' PA cap',EX.cap.text);
// lights
aim(V(-1.95,0.99,-3.0));EX.P.x=-1.9;EX.P.z=-3.55;step(3);aim(V(-1.95,0.99,-3.0));console.log('lights label',G.exUseLabel(G.exUseTarget()));EX.use();step(10);console.log(' lights',EX.lights,'tube',EX.tubeLight.intensity.toFixed(2),'glow',EX.glow.intensity);EX.use();step(5);
// clipboard
{const s=EX.sci.find(s=>s.alive);if(s){EX.P.x=s.group.position.x+0.6;EX.P.z=s.group.position.z;step(3);aim(wpos(s.clip));console.log('clip label',G.exUseLabel(G.exUseTarget()));EX.use();console.log(' notes',EX.notes&&EX.notes.lines.join(' | '));}}
// kill the current subject from the control room through the broken? glass intact -> go back to cell
EX.P.x=0;EX.P.z=2.6;EX.aimYaw=0;step(5);const P2=EX.pris;fireAt(wpos(P2.parts.head.mesh));step(60);console.log('subject 2 alive',P2.alive,'banner',EX.banner&&EX.banner.a,'state',EX.state);
// kill all scientists -> alarm, game continues
EX.P.x=2.6;EX.P.z=-4.6;step(3);for(const s of EX.sci){for(let k=0;k<3&&s.alive;k++){fireAt(wpos(s.parts.head.mesh));}}step(30);console.log('sci dead',EX.sci.every(s=>!s.alive),'alarmT',EX.alarmT.toFixed(1),'banner',EX.banner&&EX.banner.a,'state',EX.state);step(60*11);console.log(' after alarm',EX.alarmT,EX.alarmDone,EX.state);
// many subjects: ragdoll cap
for(let k=0;k<6;k++){const H=G.exSpawnSubject(false);H.group.position.set(-1+k*0.4,0,1.0+(k%2)*0.6);H.stage='ready';H.mode='kneel';H.pt0=EX.pt;step(2);fireAt(wpos(H.parts.torso.mesh));fireAt(wpos(H.parts.head.mesh));step(20);}
const rag=EX.humans.filter(H=>H.rag&&!H.frozen).length,frz=EX.humans.filter(H=>H.frozen).length;console.log('ragdolls live',rag,'frozen',frz,'bodies in world',EX.world.bodies.length);
// marks: next subject picks a free mark or the fallback
console.log('free marks',G.MARKS.map(m=>G.EX&&0));
// menu: new session
EX.menu=null;G.exMenuToggle();console.log('menu',JSON.stringify(EX.menu));G.exMenuMove(1);G.exMenuPick();step(120);console.log('new session: humans',EX.humans.length,'door locked',EX.door.locked,'open',EX.door.open,'P',EX.P.x,EX.P.z,'subject',EX.pris.num,'lights',EX.lights,'handle vis',EX.handle.visible);
// quit to desktop
G.exMenuToggle();G.exMenuMove(1);G.exMenuMove(1);G.exMenuPick();step(5);console.log('quit: EX running',EX.running,'seated',G.SEAT.active,'msg',G.HUD.el.msg.textContent);
G.SEAT.use();step(60*5);console.log('relaunch: running',EX.running,EX.state,'seated',G.SEAT.at);
console.log('DONE');
