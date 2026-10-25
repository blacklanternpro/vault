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
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/, "const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={FRIDGE,TV,PC,MW,KETTLE,TOAST,CORDS,useTarget,dentEnt,unplugCord,KINDOORS,LIMITED,updateKinDoors,crtImplode,pcToggle,VMA,HA,VM,BATTS,BATCHES,DRAWABLES,flushDrawables,shardChunk,knockLoose,structuralUpdate,pickUp,ramThrust,pryTarget,pryStep,endPry,trimOff,hammerBegin,hammerAnim,updateViewmodel,updateKerf,sawUpdate,splitTimberAny,chunkById,FLOOR_Y,WW,WN,crowWedge,crowLever,COLLAPSE_TEAR,flexChunk,faceHide,UPLOAD,updateShadows,SHADOW,tool:()=>tool,setHeld:(v)=>{held=v;},scene,ents,dynamics,asms,world,castRay,hammerTap,hammerSmash,bootKick,player,setTool,sawUpdate,mouse,keys,saw,crow,crowWedge,crowLever,handsGrab,handsUpdate,held:()=>held,grab:()=>grab,throwHeld,recomputeSupport,recomputeTimber,WALLS,FACES,WC,WE,WS,WBW,KITCH,DESK,BED,LIGHT,HUD,updateCamera,updateTools,syncAll,checkJoints,P,updateLight,textaUpdate,splitTimber,screws,BRICKS,ROOF,detachChunk,makeDynamic,wakeAsm,impact,damageProp,splitPart,cutWire,WIRES,PIPES,puncturePipe,updateLeak,cullDebris,arcFlash,tripBreaker,S,camera,yawObj,pitchObj,camFwd,fulcrumCheck,breakJoint,fixtureDrop,DOORS,FLOOR,plankAt,pryPlank,hammerPryStart,hammerPryUpdate,hitRoot,BVH:()=>BVH,now:()=>now,step(dt){now+=dt;updatePlayerPhysics(dt);world.step(1/60,dt,3);updateHingeLimits();updateCords();runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateLeak(dt);updateAppliances(dt);HUD.update(dt);cullDebris();flushBatches();for(const d of DRAWABLES)d.flush();scene.updateMatrixWorld(true);}};\n");
(await import('fs')).writeFileSync('game_test2.mjs',src);

await import('./game_test2.mjs');
const G=globalThis.G;const T=(n,f)=>{const t=performance.now();const r=f();console.log(n.padEnd(34),((performance.now()-t)).toFixed(2)+'ms',r===undefined?'':JSON.stringify(r));return r;};
for(let i=0;i<30;i++)G.step(1/60);
const V=(x,y,z)=>new G.camera.position.constructor(x,y,z);
function aim(px,pz,yaw,pitch=0){G.player.body.position.set(px,0.4,pz);G.player.body.velocity.set(0,0,0);G.player.yaw=yaw;G.player.pitch=pitch;G.step(1/60);}
// batts / trim counts
console.log('batts',G.BATTS.length,'trim',G.ents.filter(e=>e.kind==='trim').length,'batches',G.BATCHES.size);
// --- batch hide: make a static batched ent dynamic, check batch mesh unchanged & verts collapsed
{const e=G.ents.find(e=>e.batched&&e.kind==='trim');const b=[...G.BATCHES.values()].find(b=>b.ranges.has(e));const mesh=b.mesh;const r=b.ranges.get(e)[0];T('trimOff (unbatch+lazy body)',()=>G.trimOff(e,V(0,0,1),e.mesh.position.clone()));const A=mesh.geometry.attributes.position.array;console.log(' batch same mesh',b.mesh===mesh,'collapsed',A[r[0]*3]===A[(r[0]+r[1]-1)*3]&&A[r[0]*3+1]===A[(r[0]+r[1]-1)*3+1],'updateRanges',mesh.geometry.attributes.position.updateRanges.length,'dyn',e.dynamic,'body',!!e.body);}
// --- heavy smash shards on WW front face
aim(-2.2,-0.6,Math.PI/2,0.05);let h=G.castRay(2.3);console.log('aim',h&&h.kind,h&&h.label);
{const before=G.ents.filter(e=>e.shard).length;const c=h.ent;c.hp=0.5;const face=c.face;const fm=face.mesh;T('heavy smash → shards',()=>G.impact(h,3.4,G.camFwd(),'hammer'));const after=G.ents.filter(e=>e.shard).length;console.log(' shards',after-before,'face mesh same',face.mesh===fm,'chunk alive',c.alive);for(let i=0;i<60;i++)G.step(1/60);const sh=G.ents.filter(e=>e.shard);console.log(' shard y',sh.map(e=>e.body.position.y.toFixed(2)).join(','));}
// --- pry flex on a sheet with the hammer claw (edge chunk next to the hole)
{h=G.castRay(2.3);console.log('after-shard ray',h&&h.kind,h&&h.label);
 let tgt=null;for(const [dx,dy] of [[0.25,0],[-0.25,0],[0,0.25],[0,-0.25],[0.3,0.3],[-0.3,0.3]]){G.player.yaw=Math.PI/2+dx;G.player.pitch=0.05+dy;G.step(1/60);const hh=G.castRay(2.3);if(hh&&hh.kind==='drywall'&&hh.ent.attached&&hh.ent.bonds.size<4){tgt=hh;break;}}
 console.log('pry target',tgt&&tgt.label,tgt&&tgt.ent.screws.length,'bonds',tgt&&tgt.ent.bonds.size);
 if(tgt){const pr=G.pryTarget(tgt);let done=false,maxFlex=0,steps=0;const c=pr.ent;while(!done&&steps<400){done=G.pryStep(pr,0.02,G.camFwd().negate(),false);if(c.flexMesh)maxFlex=Math.max(maxFlex,c.flexD);steps++;if(steps===5){console.log(' flex after 5 steps',c.flexD.toFixed(4),'hidden in face',c.fhidden,'flexMesh',!!c.flexMesh);}}console.log(' pry done',done,'steps',steps,'max flex mm',(maxFlex*1000).toFixed(1),'attached',c.attached,'dyn',c.dynamic);}}
// --- endPry restore
{G.player.yaw=Math.PI/2-0.6;G.player.pitch=0.3;G.step(1/60);let hh=G.castRay(2.3);if(hh&&hh.kind==='drywall'&&hh.ent.attached){const pr=G.pryTarget(hh);G.pryStep(pr,0.2,G.camFwd().negate(),false);const c=pr.ent;console.log('mid-pry flex',c.flexD&&c.flexD.toFixed(4),'hidden',c.fhidden);G.endPry(pr);console.log(' after endPry hidden',c.fhidden,'flexMesh',!!c.flexMesh);}}
// --- saw a stud in WW: kerf + split → cantilever stubs
{const w=G.WW;const stud=w.studs.find(s=>s.alive&&!s.dynamic&&s.label==='stud'&&s.cross>3&&s.cross<4.5);console.log('stud',stud.cross,stud.from,stud.to,'batched',stud.batched);const p=stud.mesh.position.clone();
 // expose: fake hit on stud front face
 const n=w.normal.clone();const hit={point:p.clone().addScaledVector(n,0.045).setY(1.0),normal:n};stud.cut=0.5;T('updateKerf',()=>G.updateKerf(stud,hit));console.log(' kerf scale',stud.kerf.scale.toArray().map(v=>v.toFixed(4)).join(','),'parent scene',stud.kerf.parent===G.scene);
 T('split stud (static)',()=>G.splitTimberAny(stud,hit.point,V(1,0,0)));const halves=w.studs.filter(s=>s.alive&&Math.abs(s.cross-stud.cross)<0.001);console.log(' halves',halves.map(s=>`${s.from.toFixed(2)}-${s.to.toFixed(2)} cant=${!!s.cantilever} hp=${s.hp} anch=${s.anchored} dyn=${s.dynamic}`).join(' | '),'kerf disposed',!stud.kerf);
 const top=halves.find(s=>s.to>2.5);T('knockLoose stub',()=>G.knockLoose(top,V(1,0,0),top.mesh.position.clone()));console.log(' stub dynamic',top.dynamic);
 // --- three adjacent studs severed → top plate collapse
 const us=w.fullStudU.slice().sort((a,b)=>a-b);const k=us.findIndex(u=>Math.abs(u-stud.cross)<0.001);const next=[us[k+1],us[k+2]];
 for(const u of next){const s=w.studs.find(s=>s.alive&&!s.dynamic&&Math.abs(s.cross-u)<0.001&&s.from<0.05);const pt=s.mesh.position.clone().setY(1.2).addScaledVector(n,0.045);G.splitTimberAny(s,pt,V(1,0,0));}
 const tp=w.plates.filter(p=>p.cross>1);console.log(' top plate pieces',tp.map(p=>`${p.from.toFixed(2)}-${p.to.toFixed(2)}${p.dynamic?'(fell)':''}`).join(' '),'collapsed spans',JSON.stringify(w.collapsed));
 const joistsDyn=G.WC.studs.filter(s=>s.dynamic).length;console.log(' ceiling joists fallen',joistsDyn);for(let i=0;i<90;i++)G.step(1/60);const ceil=G.WC.faces[0];console.log(' ceiling chunks detached',ceil.chunks.filter(c=>!c.attached).length,'/',ceil.chunks.length);}
// --- batt grab & yank via hands
{const b=G.BATTS.find(b=>!b.dynamic&&b.wall===G.WN);const p=b.mesh.position.clone();console.log('batt mass',b.mass,'size',b.size.toArray().map(v=>v.toFixed(2)).join('x'));T('yank batt',()=>{b.mkBody&&0;G.makeDynamic(b);});console.log(' batt dyn',b.dynamic,'body',!!b.body,'mask',b.body.collisionFilterMask);}
// --- ram: pick up a dynamic stud and thrust into a wall
{const s=G.dynamics.find(e=>e.kind==='stud'&&e.alive);G.setTool(3);G.pickUp(s,1.0);const H=G.held();console.log('ram held',!!H,'ram',H&&H.ram,'mask excl player',H&&((s.body.collisionFilterMask&2)===0));aim(-2.6,0.8,Math.PI/2,0.0);for(let i=0;i<20;i++){G.handsUpdate(1/60);G.step(1/60);}G.ramThrust();let hitMsg='';for(let i=0;i<24;i++){G.handsUpdate(1/60);G.step(1/60);}console.log(' after ram msg',G.HUD.el.msg.textContent);}
// --- drawable sub-rect upload with a mock renderer
{const d=G.DRAWABLES[0];const props=new Map();const calls=[];const R={properties:{get:(t)=>{if(!props.has(t))props.set(t,{__webglTexture:{},__version:t.version});return props.get(t);}},copyTextureToTexture:(p,s,t)=>calls.push([p.x,p.y,s.image.width,s.image.height])};for(const dd of G.DRAWABLES){dd.dirty=false;}d.stroke(0.5,0.5,0.52,0.51,'#000',3);G.flushDrawables(R);console.log('upload calls',JSON.stringify(calls),'canvas',d.canvas.width,d.canvas.height,'px',G.UPLOAD.px);d.fill('#fff');G.flushDrawables(R);console.log(' full flag → needsUpdate path, calls still',calls.length);}
// --- viewmodel animator: strike timing
{G.setTool(0);for(let i=0;i<30;i++){G.updateViewmodel(1/60);}G.HA.st='charge';G.hammerBegin('strike',1);let t=0,contactAt=-1;for(let i=0;i<40;i++){G.hammerAnim(1/60);G.updateViewmodel(1/60);t+=1/60;if(G.HA.st==='contact'&&contactAt<0)contactAt=t;}console.log('strike contact at',contactAt.toFixed(3),'freeze',G.VMA.freeze.toFixed(3),'HA',G.HA.st);}
console.log('final dyn',G.dynamics.length,'bodies',G.world.bodies.length);
let t1=performance.now();for(let i=0;i<120;i++)G.step(1/60);console.log('step ms (after)',((performance.now()-t1)/120).toFixed(2));
console.log('DONE');
