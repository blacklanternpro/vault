import {JSDOM} from 'jsdom';
import {createCanvas} from 'canvas';
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;
globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;
globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const origCreate=win.document.createElement.bind(win.document);
win.document.createElement=(tag)=>{if(tag==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return origCreate(tag);};
globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=(await import('fs')).readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/, "const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={FRIDGE,TV,PC,MW,KETTLE,TOAST,CORDS,useTarget,dentEnt,unplugCord,KINDOORS,LIMITED,updateKinDoors,crtImplode,pcToggle,scene,ents,dynamics,asms,world,castRay,hammerTap,hammerSmash,bootKick,player,setTool,sawUpdate,mouse,keys,saw,crow,crowWedge,crowLever,handsGrab,handsUpdate,held:()=>held,grab:()=>grab,throwHeld,recomputeSupport,recomputeTimber,WALLS,FACES,WC,WE,WS,WBW,KITCH,DESK,BED,LIGHT,HUD,updateCamera,updateTools,syncAll,checkJoints,P,updateLight,textaUpdate,splitTimber,screws,BRICKS,ROOF,detachChunk,makeDynamic,wakeAsm,impact,damageProp,splitPart,cutWire,WIRES,PIPES,puncturePipe,updateLeak,cullDebris,arcFlash,tripBreaker,S,camera,yawObj,pitchObj,camFwd,fulcrumCheck,breakJoint,fixtureDrop,DOORS,FLOOR,plankAt,pryPlank,hammerPryStart,hammerPryUpdate,hitRoot,BVH:()=>BVH,now:()=>now,step(dt){now+=dt;updatePlayerPhysics(dt);world.step(1/60,dt,3);updateHingeLimits();updateCords();runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateLeak(dt);updateAppliances(dt);HUD.update(dt);cullDebris();flushBatches();for(const d of DRAWABLES)d.flush();scene.updateMatrixWorld(true);}};\n");
(await import('fs')).writeFileSync('game_test.mjs',src);
const t0=performance.now();
await import('./game_test.mjs');
console.log('BOOT ms',(performance.now()-t0).toFixed(0));
const G=globalThis.G;
console.log('BVH',!!G.BVH(),'ents',G.ents.length,'bodies',G.world.bodies.length,'asms',G.asms.length,'screws',G.screws.length,'hitRoot children',G.hitRoot.children.length,'faces',G.FACES.length,'chunks',G.FACES.reduce((a,f)=>a+f.chunks.length,0));
function stats(tag){let mv=0,nan=0,fr=0,kinds={},mx=null;for(const e of G.dynamics){const v=e.body.velocity.length();if(!isFinite(v))nan++;else if(v>mv){mv=v;mx=e.label||e.kind;}if(e.frag)fr++;kinds[e.kind]=(kinds[e.kind]||0)+1;}console.log('  >>',tag,'dyn',G.dynamics.length,'maxv',mv.toFixed(1),mx,'nan',nan,JSON.stringify(kinds));}
for(let i=0;i<60;i++)G.step(1/60);stats('settled');
console.log('player',G.player.pos.x.toFixed(2),G.player.pos.y.toFixed(2),G.player.pos.z.toFixed(2),'ground',G.player.onGround);
// move forward (north) 3 s
G.keys.KeyW=true;for(let i=0;i<180;i++)G.step(1/60);G.keys.KeyW=false;console.log('after W 3s',G.player.pos.x.toFixed(2),G.player.pos.y.toFixed(2),G.player.pos.z.toFixed(2),'ground',G.player.onGround);
// try to walk through west wall
G.keys.KeyA=true;for(let i=0;i<240;i++)G.step(1/60);G.keys.KeyA=false;console.log('after A 4s',G.player.pos.x.toFixed(2),G.player.pos.z.toFixed(2));
// ray tests
G.player.yaw=Math.PI/2;G.step(1/60);let h=G.castRay(3);console.log('ray west:',h&&h.kind,h&&h.label,h&&h.distance.toFixed(2));
G.player.pitch=-1.2;G.step(1/60);h=G.castRay(3);console.log('ray down:',h&&h.kind,h&&h.label);
G.player.pitch=1.4;G.step(1/60);h=G.castRay(3);console.log('ray up:',h&&h.kind,h&&h.label);
G.player.pitch=0;
// timing castRay
let t1=performance.now();for(let i=0;i<200;i++)G.castRay(2.3);console.log('castRay ms',((performance.now()-t1)/200).toFixed(2));
t1=performance.now();for(let i=0;i<120;i++)G.step(1/60);console.log('step ms (idle)',((performance.now()-t1)/120).toFixed(2));
// hammer at the west wall from 1m
G.player.body.position.set(-PXX(),0.4,0);
function PXX(){return 2.25;}
G.player.yaw=Math.PI/2;G.step(1/60);h=G.castRay(2.3);console.log('wall hit:',h&&h.kind,h&&h.label,h&&h.distance.toFixed(2));
G.hammerTap();console.log('tap:',G.HUD.el.msg.textContent);G.hammerSmash(1);G.hammerSmash(1);console.log('smash:',G.HUD.el.msg.textContent);for(let i=0;i<60;i++)G.step(1/60);stats('after smash');
h=G.castRay(2.3);console.log('after smash ray:',h&&h.kind,h&&h.label);
// kick desk leg
G.setTool(3);const leg=G.DESK.legs[0];const lp=leg.mesh.position.clone();G.player.body.position.set(lp.x,0.4,lp.z+0.8);G.player.yaw=0;G.player.pitch=-Math.atan((1.67-0.35)/0.8);G.step(1/60);h=G.castRay(1.7);console.log('kick target',h&&h.label);G.bootKick();console.log('kick msg',G.HUD.el.msg.textContent);for(let i=0;i<120;i++)G.step(1/60);console.log('desk top y',G.DESK.top.body.position.y.toFixed(2));stats('desk');
// door grab
G.player.body.position.set(-0.3,0.4,3.3);G.player.yaw=Math.PI;G.player.pitch=0;G.step(1/60);h=G.castRay(2.4);console.log('door ray:',h&&h.label,h&&h.distance.toFixed(2));G.mouse.l=true;G.handsGrab();console.log('held door',G.held()&&G.held().door);for(let i=0;i<60;i++){G.handsUpdate(1/60);G.step(1/60);}console.log('door pos',G.DOORS[0].body.position.x.toFixed(2),G.DOORS[0].body.position.z.toFixed(2));G.mouse.l=false;G.handsUpdate(1/60);
// crowbar on floor plank
G.setTool(1);G.player.pitch=-1.1;G.player.yaw=0;G.step(1/60);h=G.castRay(2.3);console.log('floor ray',h&&h.kind,h&&h.label);G.crowWedge();console.log('wedge',G.HUD.el.msg.textContent);G.mouse.r=true;for(let i=0;i<60;i++){G.mouse.dy=25;G.crowLever(1/60);G.step(1/60);}console.log('lever',G.HUD.el.msg.textContent,'planks dead',G.FLOOR.planks.filter(p=>!p.alive).length);G.mouse.r=false;
// saw a bathroom tile wall: go into bathroom
G.setTool(2);G.player.body.position.set(1.9,0.4,2.9);G.player.yaw=-Math.PI/2;G.player.pitch=0;G.step(1/60);h=G.castRay(1.75);console.log('bath east ray',h&&h.kind,h&&h.label,h&&h.ent&&h.ent.mat);G.mouse.l=true;for(let i=0;i<200;i++){G.sawUpdate(1/60);G.step(1/60);}console.log('saw msg',G.HUD.el.msg.textContent);G.mouse.l=false;G.sawUpdate(1/60);stats('saw');
// cupboard mounts
const cup=G.asms.find(a=>a.name==='kitchenette').parts.find(p=>p.label==='overhead cupboard');for(const j of cup.mounts.slice())G.breakJoint(j);for(let i=0;i<150;i++)G.step(1/60);console.log('cupboard y',cup.body.position.y.toFixed(2));stats('cupboard');
// wire cut + pipe
G.cutWire(G.WIRES[0],G.WIRES[0].a.clone());console.log('power',G.HUD.el.pwr.textContent);G.puncturePipe(G.PIPES[0],G.PIPES[0].a.clone().setY(1));for(let i=0;i<30;i++)G.step(1/60);
// fixture drop
G.fixtureDrop(G.LIGHT.mounts[0]);for(let i=0;i<120;i++)G.step(1/60);console.log('housing y',G.LIGHT.housing.body.position.y.toFixed(2));
// split a joist
const j=G.WC.studs[6];const jp=j.mesh.position.clone();jp.x=1.0;console.log('joist split',G.splitTimber(j,jp));G.recomputeTimber();G.recomputeSupport();for(let i=0;i<60;i++)G.step(1/60);stats('joist');
t1=performance.now();for(let i=0;i<120;i++)G.step(1/60);console.log('step ms (busy)',((performance.now()-t1)/120).toFixed(2));
console.log('final ents',G.ents.length,'bodies',G.world.bodies.length,'dyn',G.dynamics.length);
console.log('DONE');
