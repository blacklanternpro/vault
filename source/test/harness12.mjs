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
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={pryTarget,pryStep,partAttached,detachPart,burstCan,milkBurst,SPRAYS,crackScreen,damageProp,handsGrab,handsUpdate,grabRef:()=>grab,TVS,ents,FRIDGE,TV,PC,MW,KETTLE,TOAST,CORDS,useTarget,dentEnt,unplugCord,KINDOORS,LIMITED,updateKinDoors,crtImplode,pcToggle,scene,ents,dynamics,asms,world,castRay,hammerTap,hammerSmash,bootKick,player,setTool,sawUpdate,mouse,keys,saw,crow,crowWedge,crowLever,handsGrab,handsUpdate,held:()=>held,grab:()=>grab,throwHeld,recomputeSupport,recomputeTimber,WALLS,FACES,WC,WE,WS,WBW,KITCH,DESK,BED,LIGHT,HUD,updateCamera,updateTools,syncAll,checkJoints,P,updateLight,textaUpdate,splitTimber,screws,BRICKS,ROOF,detachChunk,makeDynamic,wakeAsm,impact,damageProp,splitPart,cutWire,WIRES,PIPES,puncturePipe,updateLeak,cullDebris,arcFlash,tripBreaker,S,camera,yawObj,pitchObj,camFwd,fulcrumCheck,breakJoint,fixtureDrop,DOORS,FLOOR,plankAt,pryPlank,hammerPryStart,hammerPryUpdate,hitRoot,BVH:()=>BVH,now:()=>now,step(dt){now+=dt;updatePlayerPhysics(dt);world.step(1/60,dt,3);updateHingeLimits();updateCords();runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateLeak(dt);updateAppliances(dt);HUD.update(dt);cullDebris();flushBatches();for(const d of DRAWABLES)d.flush();scene.updateMatrixWorld(true);}};\n");
(await import('fs')).writeFileSync('game_test6.mjs',src);

await import('./game_test6.mjs');
const G=globalThis.G;const step=(n=1)=>{for(let i=0;i<n;i++)G.step(1/60);};
const eqm=c=>{let f=0;for(const e of c.equations){f=Math.max(f,Math.abs(e.multiplier));}return f;};
for(let k=0;k<600;k++){step(1);for(const C of G.CORDS){const f=eqm(C.socketC),d=C.plug.body.position.vsub(C.socketBody.position).length();if((k%60===0)||(C.plugged&&(f>30||d>0.04))||(!C.plugged&&!C.logged)){if(!C.plugged)C.logged=true;console.log(k,C.label,'plugged',C.plugged,'f',f.toFixed(1),'d',d.toFixed(3),'over',C.over||0,'plug sleep',C.plug.body.sleepState);}}}
