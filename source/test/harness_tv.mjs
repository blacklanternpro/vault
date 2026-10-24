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
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/, "const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},setRenderTarget(){},getRenderTarget(){return null},getClearColor(c){return c},getClearAlpha(){return 1},setClearColor(){},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={CHANNELS,tvReel,tvReelDraw,tvDrawOSD,tvDrawSnow,COUCH,SEATS,TVREEL,TVB,TVH,TVA,TVCAP,TVL,LIVING,tvChannel,remoteCmd,remotePop,couchWhy,tvTick,tvReelAt,camera,tripBreaker:typeof tripBreaker!=='undefined'?tripBreaker:null,getPower:()=>power,yawObj,pitchObj,EX,SEAT,MON,sitDown,standUp,exFire,exGo,exReset,exUpdate3D,renderExecutioner,crtAlive,EXP,pickUp,drop,pryTarget,pryStep,partAttached,detachPart,burstCan,milkBurst,SPRAYS,crackScreen,damageProp,handsGrab,handsUpdate,grabRef:()=>grab,TVS,ents,FRIDGE,TV,PC,MW,KETTLE,TOAST,CORDS,useTarget,dentEnt,unplugCord,KINDOORS,LIMITED,updateKinDoors,crtImplode,pcToggle,scene,ents,dynamics,asms,world,castRay,hammerTap,hammerSmash,bootKick,player,setTool,sawUpdate,mouse,keys,saw,crow,crowWedge,crowLever,handsGrab,handsUpdate,held:()=>held,grab:()=>grab,throwHeld,recomputeSupport,recomputeTimber,WALLS,FACES,WC,WE,WS,WBW,KITCH,DESK,BED,LIGHT,HUD,updateCamera,updateTools,syncAll,checkJoints,P,updateLight,textaUpdate,splitTimber,screws,BRICKS,ROOF,detachChunk,makeDynamic,wakeAsm,impact,damageProp,splitPart,cutWire,WIRES,PIPES,puncturePipe,updateLeak,cullDebris,arcFlash,tripBreaker,S,camera,yawObj,pitchObj,camFwd,fulcrumCheck,breakJoint,fixtureDrop,DOORS,FLOOR,plankAt,pryPlank,hammerPryStart,hammerPryUpdate,hitRoot,BVH:()=>BVH,now:()=>now,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);updateHingeLimits();updateCords();runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateLeak(dt);updateAppliances(dt);updateSeat(dt);renderExecutioner();HUD.update(dt);cullDebris();flushBatches();for(const d of DRAWABLES)d.flush();scene.updateMatrixWorld(true);}};\n");
(await import('fs')).writeFileSync('game_test_tv.mjs',src);
await import('./game_test_tv.mjs');
const G=globalThis.G;const V=(x,y,z)=>new G.camera.position.constructor(x,y,z);const step=(n=1)=>{for(let i=0;i<n;i++)G.step(1/60);};
step(90);
const sofa=G.LIVING.sofa,TV=G.TV,C=G.COUCH;
const lw=(l)=>{sofa.mesh.updateMatrixWorld(true);return sofa.mesh.localToWorld(l);};
console.log('sofa pos',sofa.mesh.position.toArray().map(v=>v.toFixed(2)).join(','),'back part world',lw(V(0,0.56,-0.325)).toArray().map(v=>v.toFixed(2)).join(','),'backC',G.LIVING.backC.map(b=>b.mesh.position.x.toFixed(2)+','+b.mesh.position.z.toFixed(2)).join(' | '),'seatC',G.LIVING.seatC.map(b=>b.mesh.position.x.toFixed(2)+','+b.mesh.position.z.toFixed(2)).join(' | '));
console.log('bd local',C.bd.toArray().map(v=>v.toFixed(2)).join(','),'seats',C.seats.map(s=>s.l.toArray().map(v=>v.toFixed(2)).join(',')).join(' | '));
const r=C.remote;console.log('remote at',r.mesh.position.toArray().map(v=>v.toFixed(3)).join(','),'TV ch',TV.ch,'state',TV.state,'on',TV.on,'why',G.couchWhy(true));
// walk up to the couch and E on it
const sp=lw(V(0,0.4,0).addScaledVector(C.bd,-1.0));G.player.body.position.set(sp.x,0.9,sp.z);step(5);
const seatW=lw(C.seats[0].l.clone());const eye=G.camera.getWorldPosition(V(0,0,0));const d=seatW.clone().sub(eye);G.player.yaw=Math.atan2(-d.x,-d.z);G.player.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));step(4);
const h=G.castRay(2.1);console.log('looking at',h&&h.ent&&h.ent.label,'label',h&&h.ent&&h.ent.useOwner===C?C.useLabel(h):'(not couch)');
G.useTarget();step(1);console.log('seated',G.SEAT.active,G.SEAT.at,'remoteOK vm',C.vm.visible);step(60);
const ce=G.camera.getWorldPosition(V(0,0,0));const cf=V(0,0,-1).applyQuaternion(G.camera.getWorldQuaternion(new G.camera.quaternion.constructor()));const tc=TV.glassE.mesh.getWorldPosition(V(0,0,0));const td=tc.clone().sub(ce).normalize();
console.log('eye',ce.toArray().map(v=>v.toFixed(2)).join(','),'fov',G.camera.fov.toFixed(1),'dot to TV',cf.dot(td).toFixed(3),'vm visible',C.vm.visible,'remote hidden',!r.mesh.visible,'tv drawn',TV.drawn,'src',TV.src,'emissiveMap is hi',TV.picture.material.emissiveMap===G.TVH.tex);
// look around clamp
G.SEATS.couch.look(-5000,0);step(30);console.log('look clamp ly',G.SEAT.ly.toFixed(2));G.SEATS.couch.look(5000,0);G.SEATS.couch.look(-2500,0);step(30);
// channels
const d0=TV.drawn;step(60);console.log('draws per 60 frames seated',TV.drawn-d0);
G.SEATS.couch.wheel(100);console.log('wheel down ch',TV.ch);G.SEATS.couch.key('ArrowUp');console.log('up ch',TV.ch);G.SEATS.couch.key('Digit3');step(10);console.log('digit3 ch',TV.ch,'src',TV.src,'banner',TV.osd.banner.toFixed(2),'cap',G.TVCAP.text);
G.SEATS.couch.key('Digit7');step(2);G.SEATS.couch.key('KeyV');console.log('vol',TV.vol);G.SEATS.couch.key('KeyM');console.log('mute',TV.mute);G.SEATS.couch.key('KeyM');G.SEATS.couch.key('KeyT');console.log('sleep',TV.sleepSet,TV.sleep);
// reel cues fire
G.TVB.t=0;step(2);const caps=[];for(let i=0;i<60*24;i++){step(1);if(G.TVCAP.t>0&&caps[caps.length-1]!==G.TVCAP.text)caps.push(G.TVCAP.text);}console.log('captions over a reel loop',JSON.stringify(caps));
console.log('light',G.TVL.light.intensity.toFixed(2),G.TVL.light.color.getHexString());
// power off with 0 then on
G.SEATS.couch.key('Digit0');step(40);console.log('power off: state',TV.state,'light',G.TVL.light.intensity.toFixed(2),'still seated',G.SEAT.active);G.SEATS.couch.key('Digit0');step(10);console.log('power on',TV.state);
// sleep timer fires
TV.sleep=0.05;TV.sleepSet=30;step(5);console.log('sleep fired, on',TV.on,'msg',G.HUD.el.msg.textContent);G.SEATS.couch.key('Digit0');step(10);
// stand up
G.standUp();step(40);console.log('stood',!G.SEAT.active,'fov',G.camera.fov.toFixed(1),'vm',C.vm.visible,'remote visible',r.mesh.visible,'hint',G.HUD.el.hint.textContent.slice(0,20));
// TV buttons: E on right third of TV = channel
{const p=TV.core.mesh.localToWorld(V(0.02,0,-0.45));const h={ent:TV.core,point:p};console.log('tv right label',TV.useLabel(h));const c0=TV.ch;TV.use(h);console.log(' ch',c0,'->',TV.ch);const h2={ent:TV.core,point:TV.core.mesh.localToWorld(V(0.02,0,0.1))};console.log(' tv centre label',TV.useLabel(h2));}
// throw the remote hard -> pops
G.makeDynamic(r);r.body.position.y+=0.6;r.body.velocity.set(0,-7,0);step(90);console.log('remote y',r.body.position.y.toFixed(2));console.log('remote popped',C.popped,'aas',(C.aas||[]).length,'door ent',G.ents.filter(e=>e.label==='battery door').length);
// sit again without remote: channel keys refused
G.sitDown('couch');step(30);console.log('seated w/o remote',G.SEAT.active,'msg',G.HUD.el.msg.textContent);const c1=TV.ch;G.SEATS.couch.key('ArrowUp');console.log(' ch unchanged',TV.ch===c1,'msg',G.HUD.el.msg.textContent);G.standUp();step(30);
// refit the AAs
if(C.aas&&C.aas.length){const a=C.aas[0];const ap=a.mesh.getWorldPosition(V(0,0,0));G.player.body.position.set(ap.x+0.5,0.9,ap.z);step(3);for(const b of C.aas){b.body.position.set(ap.x+0.2,0.1,ap.z);}step(3);console.log('remote label',r.useLabel());r.use();console.log(' popped after refit',C.popped);}
// can't-sit lines
{G.unplugCord(TV.cord);step(30);console.log('unplugged why',G.couchWhy(true));G.sitDown('couch');console.log(' seated?',G.SEAT.active,G.HUD.el.msg.textContent);}
// smash the TV while seated? glass shatter -> NOTHING ON
// desk still works
G.PC.use();step(60*4);G.SEAT.use();step(30);console.log('desk seated',G.SEAT.at,'EX',G.EX.running,G.EX.state,'hint',G.HUD.el.hint.textContent.slice(0,30));G.standUp();step(30);console.log('desk stood',!G.SEAT.active);
// tip the couch
G.wakeAsm?0:0;G.makeDynamic(sofa);sofa.body.quaternion.setFromEuler(Math.PI/2,0,0);step(5);console.log('tipped why',G.couchWhy(true));
console.log('DONE');
