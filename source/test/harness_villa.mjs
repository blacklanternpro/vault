import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
// v6 villa harness: boots ?villa headless, reports what was built and what it costs, walks, breaks a wall open, checks it woke.
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;win.__VILLA=true;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;
let src=fs.readFileSync('all.mjs','utf8');
src=src.replace(/const renderer=new THREE\.WebGLRenderer\([^;]*\);/,"const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(){},clear(){},clearDepth(){},info:{render:{calls:0}},toneMapping:0,toneMappingExposure:1,outputColorSpace:'',autoClear:true,setRenderTarget(){},getRenderTarget(){return null;},getClearColor(){},getClearAlpha(){return 1;},setClearColor(){}};");
src=src.replace("const canvas=document.getElementById('c');","const canvas=document.getElementById('c');canvas.requestPointerLock=()=>{};");
src=src.replace(/\nloop\(\);\n?$/,"\nglobalThis.G={VW,VP,VL,VF,VOPEN,VMH,VR,VCL,KINDOORS,toggleKinDoor,damageProp,makeDynamic,vRect,vOverlap,villaWake,WALLS,FACES,BATTS,screws,BRICKS,world,ents,dynamics,player,castRay,hammerSmash,shardChunk,detachChunk,setTool,keys,mouse,camera,yawObj,scene,hitRoot,BATCHES,DRAWABLES,chunkById,recomputeSupport,structuralUpdate,step(dt){now+=dt;updatePlayerPhysics(dt);world.step(1/60,dt,3);runTimers();checkJoints();updateCamera(dt);yawObj.updateMatrixWorld(true);syncAll();P.update(dt);updateLight(dt);updateVilla(dt);updateKinDoors(dt);updateAppliances(dt);HUD.update(dt);cullDebris();flushBatches();scene.updateMatrixWorld(true);}};\n");
fs.writeFileSync('game_test_villa.mjs',src);
const t0=performance.now();await import('./game_test_villa.mjs');console.log('BOOT ms',(performance.now()-t0).toFixed(0));const G=globalThis.G;
const count=()=>{let meshes=0,tris=0;G.scene.traverse(o=>{if(o.isMesh&&o.visible){meshes++;const g=o.geometry;tris+=(g.index?g.index.count:g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});const studs=G.WALLS.reduce((n,w)=>n+w.studs.length+w.noggins.length+w.plates.length,0);
  return{walls:G.WALLS.length,faces:G.FACES.length,chunks:G.FACES.reduce((n,f)=>n+f.chunks.length,0),timber:studs,batts:G.BATTS.length,screws:G.screws.length,screwInst:G.screws.filter(s=>s.id>=0).length,bodies:G.world.bodies.length,meshes,ktris:Math.round(tris/1000),batches:G.BATCHES.size,canvasMpx:(G.DRAWABLES.reduce((n,d)=>n+d.canvas.width*d.canvas.height,0)/1e6).toFixed(1),woken:G.VW.woken};};
console.log('built',JSON.stringify(count()));
console.log('walls by kind',G.VW.walls.filter(w=>w.kind==='ext').length,'ext',G.VW.walls.filter(w=>w.kind==='int').length,'int; openings',G.VW.walls.reduce((n,w)=>n+w.openings.length,0),'of',G.VP.ops.length);
for(let i=0;i<90;i++)G.step(1/60);
const p=G.player.body.position;console.log('settled player',p.x.toFixed(2),p.y.toFixed(2),p.z.toFixed(2),'room',G.VW.roomAt(p.x,p.z)&&G.VW.roomAt(p.x,p.z).id,'detached chunks',G.FACES.reduce((n,f)=>n+f.chunks.filter(c=>c.alive&&!c.attached).length,0));
G.keys.KeyW=true;for(let i=0;i<150;i++)G.step(1/60);G.keys.KeyW=false;console.log('walked north to',p.x.toFixed(2),p.z.toFixed(2),'room',G.VW.roomAt(p.x,p.z)&&G.VW.roomAt(p.x,p.z).id);
console.log('lights',G.VL.pool.map(s=>(s.fix?s.fix.room.id:'-')+':'+s.l.intensity.toFixed(1)).join(' '));
/* knock a sheet out of the living room's hall-side wall and check that wall woke */
const w=G.VW.walls.find(w=>w.rooms.front==='hall'&&w.rooms.back==='living')||G.VW.walls.find(w=>w.kind==='int');const f=w.faces[0];const c=f.chunks.find(c=>c.alive&&c.attached);const b0=G.world.bodies.length;
G.shardChunk(c,c.center.clone(),f.normal.clone().negate(),1);for(let i=0;i<60;i++)G.step(1/60);console.log('shard on',w.name,w.rooms.front+'|'+w.rooms.back,'woke',!w.dormant,'bodies',b0,'->',G.world.bodies.length,'stud bodies live',w.studs.filter(s=>s.body&&s.body.world).length,'/',w.studs.length);
console.log('after',JSON.stringify(count()));
/* v6.1: wall junctions, manholes, climbing into the roof */
{const ints=G.VW.walls.filter(w=>w.kind==='int').map(w=>w.seg);let ov=0;for(let i=0;i<ints.length;i++)for(let j=i+1;j<ints.length;j++)if(G.vOverlap(G.vRect(ints[i]),G.vRect(ints[j])))ov++;
 console.log('junctions: overlaps',ov,'open wall ends (capped)',G.VW.freeEnds.length,G.VW.freeEnds.map(([s,e])=>s.a+'|'+s.b).join(' '),'caps mesh',!!G.VOPEN.caps);}
const C=G.VW.ceiling;console.log('manholes',G.VMH.length,'ceiling openings',C.openings.length,'trimmers',C.noggins.length,'ceiling dormant',C.dormant,'detached',G.FACES.reduce((n,f)=>n+f.chunks.filter(c=>c.alive&&!c.attached).length,0));
const H=G.VMH[0],pb=G.player.body;const put=(x,y,z)=>{pb.position.set(x,y,z);pb.velocity.set(0,0,0);};const run=(n)=>{for(let i=0;i<n;i++)G.step(1/60);};
put(H.cx,0.37,H.cz);run(30);G.keys.Space=true;run(40);G.keys.Space=false;run(60);console.log('closed, floor jump: max y ok, y',pb.position.y.toFixed(2),'climbing',G.VCL.on);
G.toggleKinDoor(H.e);run(60);console.log('opened: ang',H.e.kin.ang.toFixed(2),'ceiling woke',!C.dormant,'joist bodies',C.studs.filter(s=>s.body&&s.body.world).length,'bodies',G.world.bodies.length);
put(H.cx,0.37,H.cz);run(30);G.keys.Space=true;run(50);G.keys.Space=false;run(60);console.log('open, floor jump (no step): y',pb.position.y.toFixed(2),'(should be on the floor, not the roof)');
const cr=G.VR.crate;G.makeDynamic(cr);cr.body.position.set(H.cx,0.155,H.cz);cr.body.quaternion.set(0,0,0,1);cr.body.velocity.set(0,0,0);put(H.cx,0.31+0.39,H.cz+0.02);run(60);console.log('on the crate: y',pb.position.y.toFixed(2),'groundY',(G.player.lastGroundY||0).toFixed(2),'eye',(pb.position.y+G.player.eyeOff).toFixed(2));
G.keys.Space=true;run(30);G.keys.Space=false;run(60);console.log('climbed:',pb.position.y.toFixed(2),'in roof',G.VCL.inRoof,'eye',G.player.eyeOff.toFixed(2));
G.player.yaw=Math.PI/2;G.keys.KeyW=true;run(60);G.keys.KeyW=false;run(90);console.log('walked in the roof: y',pb.position.y.toFixed(2),'x',pb.position.x.toFixed(2),'onGround',G.player.onGround,'eye',G.player.eyeOff.toFixed(2));
put(H.cx,pb.position.y,H.cz);run(20);G.keys.ShiftLeft=true;run(50);G.keys.ShiftLeft=false;run(90);console.log('dropped back down: y',pb.position.y.toFixed(2),'in roof',G.VCL.inRoof);
const H2=G.VMH[1];G.damageProp(H2.e,1.4,new G.player.pos.constructor(H2.cx,2.7,H2.cz));G.damageProp(H2.e,1.5,new G.player.pos.constructor(H2.cx,2.7,H2.cz));run(60);console.log('garage cover smashed',H2.broken,'alive',H2.e.alive);
put(H2.cx+0.7,3.3,H2.cz);run(60);console.log('garage roof space: y',pb.position.y.toFixed(2),'eye (low roof clamps it)',G.player.eyeOff.toFixed(2));
console.log('ladder',G.VR.ladder.label,'at',G.VR.ladder.body.position.y.toFixed(2),'roof frame meshes',!!G.VR.frame,!!G.VR.heavy,!!G.VR.under);
console.log('final',JSON.stringify(count()));console.log('DONE');
