import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6.6 WS3 harness: kitchen transplant, dining, laundry, gas build-up, explosion, barbecue bottle. (from the v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={VPXF,vpxFaceCheck,vpxFacePass,vpxCheck,vpxPass,VPX,vpxEligible,vpxSaved,vpxDrop,vpxAll,VCULL,vcUpdate,useTarget,dentEnt,THREE,VDN,textaUpdate,texta,hammerAnim,hammerBegin,hammerTapContact,hammerSmash,HA,KITCH,FRIDGE,pickUp,drop,getHeld:()=>held,VBSKINS,castRay,impact,chipBrick,wallPoint,crowLever,crow,camFwd,vFaceOff,VR6,BED,HUD,VLV,LIVING,TV,PC,DESK,COUCH,SEAT,SEATS,sitDown,standUp,pcToggle,EX,TVL,tvCentre,crtAlive,LAMPS,VW4,makeDynamic,dynamics,VOPEN,VG,VK,VDN,VLD,FRIDGE,MW,KITCH,TOAST,vGasSpark,vgRoomAt,VE,WIRES,PIPES,cutWire,puncturePipe,veRoomLit,getPower:()=>power,VS,vCarpetAt,floorDrawableAt,toggleKinDoor,updateKinDoors,wakeAsm,VW,VP,VL,VF,VOPEN,VMH,VR,VCL,VB,floorPuddle,vbRoomAt,vbUnderground,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;if(SEAT.active)seatHold();else updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);updateSeat(dt);updateCords();updateLeak(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_vpx.mjs',src);
const t0=performance.now();await import('./game_test_vpx.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;
const run=n=>{for(let i=0;i<n;i++)G.step(1/60);};const V=(x,y,z)=>new G.player.pos.constructor(x,y,z);
const msgs=[];const om=G.HUD.msg.bind(G.HUD);G.HUD.msg=(t,d)=>{msgs.push(t);om(t,d);};
function aimAt(e,off,dy=0.3){const p=e.mesh.getWorldPosition(V(0,0,0)).add(V(0,dy,0));const from=p.clone().add(off);for(let k=0;k<3;k++){for(let i=0;i<6;i++){G.player.body.position.set(from.x,0.37,from.z);G.player.body.velocity.set(0,0,0);G.step(1/60);}const c=G.camera.getWorldPosition(V(0,0,0));const d=p.clone().sub(c);G.player.yaw=Math.atan2(-d.x,-d.z);G.player.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));}for(let i=0;i<4;i++){G.player.body.position.set(from.x,0.37,from.z);G.player.body.velocity.set(0,0,0);G.step(1/60);}}
const tap=()=>{G.hammerTapContact();G.HA.st='idle';run(4);};
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const tb0=performance.now();run(60*6);const tBuild=performance.now()-tb0;
console.log('clusters',G.VPX.clusters.size,'saved',G.vpxSaved(),'built',G.VPX.built,'dropped',G.VPX.dropped);
ok(G.VPX.clusters.size>=15,'cells proxied at boot');
const fr=G.FRIDGE.body||G.KITCH.fridge;ok(!!fr._px,'fridge is proxied');
const layer1=e=>{let n=0,m=0;e.mesh.traverse(o=>{if(o.isMesh&&!o.userData.pxProxy){m++;if(o.layers.mask===2)n++;}});return[n,m];};console.log('fridge parts on layer 1',JSON.stringify(layer1(fr)));
/* the real pieces still take hits */
aimAt(fr,V(1.1,0,0));{const h=G.castRay(2.3);ok(h&&h.ent&&(h.ent===fr||h.ent.asm===fr.asm||h.ent.label.includes('fridge')),'castRay lands on the fridge through the proxy: '+(h&&h.ent&&h.ent.label));
 globalThis.HITE=h.ent;const X=h.ent._px;tap();ok(!h.ent._px&&(!X||!G.VPX.clusters.has(X)),'a tap drops its cell');const L=layer1(h.ent);ok(L[0]===0,'pieces back on layer 0 after the tap '+JSON.stringify(L));}
const hitE=globalThis.HITE;run(60*2);ok(!hitE._px,'the thing hit waits 3 s');run(60*3);ok(!!hitE._px,'and rejoins once it has sat still');
/* the clock ticks: it stops being merged */
const clk=G.VDN.clock&&G.VDN.clock.e;run(60*20);console.log('clock noProxy',clk&&clk.noProxy,'churn',clk&&clk._pxChurn,'px',!!(clk&&clk._px));ok(clk&&!clk._px,'the ticking clock is left out');
/* use: the fridge door opens and its cell drops */
{const door=G.ents.find(e=>e.alive&&e.label==='fridge door');console.log('door px',!!door._px,'kin',!!door.kin);aimAt(fr,V(1.1,0,0));const X=door._px;const u=G.useTarget();run(30);ok(!door._px&&(!X||!G.VPX.clusters.has(X)),'using the fridge drops the door cell (use '+u+')');}
/* a parked tin, picked up: its cell drops */
{const tin=G.ents.find(e=>e.alive&&e.label==='tin of baked beans');const X=tin._px;console.log('tin px',!!X,'parked',tin.parked);G.makeDynamic(tin);run(2);ok(!tin._px&&(!X||!G.VPX.clusters.has(X)),'a tin picked up drops its cell');run(120);
 const p=tin.mesh.getWorldPosition(V(0,0,0));let vis=true,q=tin.mesh;while(q){if(!q.visible&&!G.VCULL.hid.has(q))vis=false;q=q.parent;}ok(tin.mesh.layers.mask===1,'the tin draws itself again');}
/* a piece moving on its own (no hook): caught the same frame */
{const X=[...G.VPX.clusters].find(X=>X.members.some(e=>!e.loose&&e.alive&&!e.kin));const e=X.members.find(e=>!e.loose&&e.alive&&!e.kin);e.mesh.position.x+=0.05;run(2);ok(!G.VPX.clusters.has(X),'a piece nudged by code drops its cell in one frame ('+e.label+')');e.mesh.position.x-=0.05;}
/* colour change on a canon-merged piece */
{let hit=null;for(const X of G.VPX.clusters){for(const r of X.orig){if(!Array.isArray(r.mat)&&r.mat.color&&r.mat.isMeshStandardMaterial&&!r.mat.map){hit=[X,r];break;}}if(hit)break;}const [X,r]=hit;const c0=r.mat.color.getHex();r.mat.color.setHex(0xff0000);run(1);ok(!G.VPX.clusters.has(X),'a colour change drops its cell');r.mat.color.setHex(c0);}
/* VCULL: cells in rooms you can't see are hidden */
{G.player.body.position.set(16.8-8.8,0.37,4.5-4.9);G.player.yaw=1.5708;G.player.pitch=0;run(30);let hid=0,shown=0;for(const X of G.VPX.clusters){if(X.never)continue;if(X.node.visible)shown++;else hid++;}console.log('cells shown',shown,'hidden',hid);ok(hid>0,'VCULL hides cells with their rooms');}
/* texta on a merged surface */
{const ent=[...G.VPX.clusters].flatMap(X=>X.members).find(e=>!e.loose&&e.alive&&e.drawable);console.log('drawable ent in a cell',ent&&ent.label);}
/* wall faces: edges + backs merged per room; a punched sheet drops its room */
{console.log('face cells',G.VPXF.cells.size);ok(G.VPXF.cells.size>=8,'face edges merged per room');const C=[...G.VPXF.cells.values()].find(C=>C.room==='living');const r=C.list[0];ok(r.o.material[2].visible===false&&r.orig[2].visible!==false,'face draws its painted side, edges via the merge');
 const f=r.f;const ch=f.chunks.find(c=>c.alive&&c.attached);let n=0;for(;n<12&&ch.attached;n++){G.impact({kind:'drywall',ent:ch,point:ch.center?ch.center.clone():f.wall.origin.clone(),normal:V(0,0,1)},1.0,V(0,0,1),'tap');run(1);}
 console.log('sheet punched after',n,'attached',ch.attached);run(2);ok(G.VPXF.cells.get(C.key)!==C,'a punched sheet drops its room merge');ok(f.mesh&&(!Array.isArray(f.mesh.material)||f.mesh.material[2].visible!==false),'that face draws its own edges again');
 run(60*5);const C2=G.VPXF.cells.get(C.key);console.log('rebuilt',!!C2,C2&&C2.list.length);}
/* cost */
{const t=performance.now();run(600);const on=(performance.now()-t)/600;G.VPX.on=false;run(1);const t2=performance.now();run(600);const off=(performance.now()-t2)/600;G.VPX.on=true;console.log('ms/frame on',on.toFixed(2),'off',off.toFixed(2));}
{run(60*5);let n=0;for(const X of G.VPX.clusters)n+=X.orig.length;let t=performance.now();for(let i=0;i<1000;i++)G.vpxCheck();const c=(performance.now()-t)/1000;t=performance.now();for(let i=0;i<20;i++)G.vpxPass();const p=(performance.now()-t)/20;console.log('orig',n,'check ms',c.toFixed(3),'pass ms',p.toFixed(2),'clusters',G.VPX.clusters.size);}
console.log('NaN bodies',G.world.bodies.filter(b=>isNaN(b.position.x)).length);
console.log('DONE');
