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
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={FRIDGE,TV,PC,MW,KETTLE,TOAST,CORDS,useTarget,dentEnt,unplugCord,KINDOORS,LIMITED,updateKinDoors,crtImplode,pcToggle,VMA,HA,VM,BATTS,BATCHES,DRAWABLES,flushDrawables,shardChunk,knockLoose,structuralUpdate,pickUp,ramThrust,pryTarget,pryStep,endPry,trimOff,hammerBegin,hammerAnim,updateViewmodel,updateKerf,sawUpdate,splitTimberAny,chunkById,FLOOR_Y,WW,WN,crowWedge,crowLever,COLLAPSE_TEAR,flexChunk,faceHide,UPLOAD,updateShadows,SHADOW,tool:()=>tool,setHeld:(v)=>{held=v;},scene,ents,dynamics,asms,world,castRay,hammerTap,hammerSmash,bootKick,player,setTool,sawUpdate,mouse,keys,saw,crow,crowWedge,crowLever,handsGrab,handsUpdate,held:()=>held,grab:()=>grab,throwHeld,recomputeSupport,recomputeTimber,WALLS,FACES,WC,WE,WS,WBW,KITCH,DESK,BED,LIGHT,HUD,updateCamera,updateTools,syncAll,checkJoints,P,updateLight,textaUpdate,splitTimber,screws,BRICKS,ROOF,detachChunk,makeDynamic,wakeAsm,impact,damageProp,splitPart,cutWire,WIRES,PIPES,puncturePipe,updateLeak,cullDebris,arcFlash,tripBreaker,S,camera,yawObj,pitchObj,camFwd,fulcrumCheck,breakJoint,fixtureDrop,DOORS,FLOOR,plankAt,pryPlank,hammerPryStart,hammerPryUpdate,hitRoot,BVH:()=>BVH,now:()=>now,step(dt){now+=dt;updatePlayerPhysics(dt);world.step(1/60,dt,3);updateHingeLimits();updateCords();runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateLeak(dt);updateAppliances(dt);HUD.update(dt);cullDebris();flushBatches();for(const d of DRAWABLES)d.flush();scene.updateMatrixWorld(true);}};\n");
(await import('fs')).writeFileSync('game_test3.mjs',src);

await import('./game_test3.mjs');
const G=globalThis.G;for(let i=0;i<30;i++)G.step(1/60);
const V=(x,y,z)=>new G.camera.position.constructor(x,y,z);
function aim(px,pz,yaw,pitch=0){G.player.body.position.set(px,0.4,pz);G.player.body.velocity.set(0,0,0);G.player.yaw=yaw;G.player.pitch=pitch;G.step(1/60);}
// crowbar on skirting (WN front face at z=-PZ, facing +z): stand at z=-3.4 looking north and down
G.setTool(1);aim(-1.0,-3.5,0,-1.142);let h=G.castRay(2.3);console.log('skirting aim',h&&h.kind,h&&h.label,h&&h.point.y.toFixed(3));
if(h&&h.kind==='trim'){G.crowWedge();const w=G.crow.wedge;console.log(' wedge pr',w&&w.pr&&w.pr.type);G.mouse.r=true;let n=0;while(G.crow.wedge&&n<200){G.mouse.dy=6;G.crowLever(1/60);n++;if(n===3)console.log(' flex mesh rot',h.ent.mesh.quaternion.toArray().map(v=>v.toFixed(3)).join(','));}console.log(' trim off after',n,'steps; dyn',h.ent.dynamic,'msg',G.HUD.el.msg.textContent);G.mouse.r=false;}
// batts: expose by shattering a WN chunk then hook with crowbar
aim(1.0,-3.0,0,0.1);h=G.castRay(2.3);console.log('WN aim',h&&h.kind);if(h&&h.kind==='drywall'){G.shardChunk(h.ent,h.point,G.camFwd(),1);G.recomputeSupport();for(let i=0;i<5;i++)G.step(1/60);}
h=G.castRay(2.3);console.log(' behind',h&&h.kind,h&&h.label);
if(h&&h.kind==='batt'){G.crowWedge();console.log(' hook',G.crow.wedge&&G.crow.wedge.hook);G.mouse.r=true;let n=0;while(G.crow.wedge&&n<200){G.mouse.dy=5;G.crowLever(1/60);n++;}G.mouse.r=false;console.log(' batt yanked',h.ent.dynamic,'steps',n,'msg',G.HUD.el.msg.textContent);}
// hands tension grab on next batt
aim(1.0,-3.0,0.25,0.1);h=G.castRay(2.4);console.log('hands aim',h&&h.kind);
// stub: saw stud in WN, then crowbar pry the top stub
{const w=G.WN;const s=w.studs.find(s=>s.alive&&!s.dynamic&&s.label==='stud'&&s.cross>4&&s.cross<5);const n=w.normal;const pt=s.mesh.position.clone().setY(1.0).addScaledVector(n,0.045);G.splitTimberAny(s,pt,V(0,0,-1));const top=w.studs.find(x=>x.alive&&Math.abs(x.cross-s.cross)<0.001&&x.to>2.5);console.log('top stub',top&&top.label,top&&top.pryWork);
 const hit={ent:top,kind:'stud',point:top.mesh.position.clone().setY(1.6).addScaledVector(n,0.045),normal:n.clone()};const pr=G.pryTarget(hit);console.log(' pr',pr&&pr.type,pr&&pr.mode&&pr.mode.hinge);let done=false,k=0;while(!done&&k<300){done=G.pryStep(pr,0.02,n.clone(),true);k++;if(k===10)console.log(' stub flex: mesh moved',top.mesh.position.distanceTo(top.flexBase.p).toFixed(4));}console.log(' stub done',done,k,'dyn',top.dynamic);}
// noggin hammer smash downward
{const w=G.WN;const ng=w.noggins.find(n=>n.alive&&!n.dynamic&&n.label==='noggin');const p=ng.mesh.position.clone();console.log('noggin hp',ng.hp);G.impact({kind:'stud',ent:ng,point:p,normal:w.normal.clone()},3.6,V(0,0,-1),'hammer');G.impact({kind:'stud',ent:ng,point:p,normal:w.normal.clone()},3.6,V(0,0,-1),'hammer');console.log(' noggin dyn',ng.dynamic,G.HUD.el.msg.textContent);}
// plank pry with hammer: lift + abort keeps lift mesh
{G.setTool(0);for(const [x,z] of [[-0.3,3.0],[0.0,1.0],[-1.5,-1.0],[2.0,-1.5]]){aim(x,z,0,-1.2);h=G.castRay(2.3,{screws:true});if(h&&h.kind==='floor')break;}console.log('floor aim',h&&h.kind);const pr=G.pryTarget(h);G.pryStep(pr,0.4,V(0,1,0),false);console.log(' lift exists',!!pr.plank.lift,'rot',pr.plank.lift.rotation.x.toFixed(4));G.endPry(pr);console.log(' after abort lift kept',!!pr.plank.lift,'rot',pr.plank.lift.rotation.x.toFixed(4));let d=false,k=0;while(!d&&k<200){d=G.pryStep(pr,0.03,V(0,1,0),false);k++;}console.log(' plank out',d,'alive',pr.plank.alive);}
for(let i=0;i<60;i++)G.step(1/60);console.log('dyn',G.dynamics.length,'DONE');
