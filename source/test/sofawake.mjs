import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;
await import('./game_test_tv.mjs');const G=globalThis.G;const step=(n)=>{for(let i=0;i<n;i++)G.step(1/60);};step(60);
const L=G.LIVING;const parts=[L.sofa,...L.seatC,...L.backC,L.throwC,G.COUCH.remote];const p0=parts.map(e=>e.mesh.getWorldPosition(e.mesh.position.clone()));
for(const e of parts)G.makeDynamic(e);let mx=0;for(let i=0;i<180;i++){step(1);for(const e of parts)mx=Math.max(mx,e.body.velocity.length());}
console.log('max v',mx.toFixed(2),'moves',parts.map((e,i)=>e.label+':'+e.mesh.getWorldPosition(e.mesh.position.clone()).distanceTo(p0[i]).toFixed(3)).join(' '));
console.log('sit after wake',G.couchWhy(true));
