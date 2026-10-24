
import {JSDOM} from 'jsdom';import {createCanvas} from 'canvas';import fs from 'fs';
const dom=new JSDOM(`<!DOCTYPE html><body><canvas id="c"></canvas><div id="hud"><div id="flash"></div><div id="cross"></div><div id="tool"></div><div id="hint"></div><div id="pwr"></div><div id="bar"><div id="barLabel"></div><div id="barTrack"><div id="barFill"></div></div></div><div id="msg"></div><div id="slots"><div></div><div></div><div></div><div></div><div></div></div><div id="stats"></div></div><div id="overlay"></div></body>`,{pretendToBeVisual:true});
const win=dom.window;globalThis.window=win;globalThis.document=win.document;globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>0;globalThis.HTMLElement=win.HTMLElement;
const oc=win.document.createElement.bind(win.document);win.document.createElement=(t)=>{if(t==='canvas'){const c=createCanvas(16,16);c.style={};c.addEventListener=()=>{};c.requestPointerLock=()=>{};return c;}return oc(t);};globalThis.AudioContext=undefined;
await import('./game_test_tv.mjs');const G=globalThis.G;
const times=process.argv.slice(2).map(Number);const out=createCanvas(854*2,480*Math.ceil(times.length/2));const o=out.getContext('2d');
times.forEach((t,i)=>{G.TVB.t=t;G.TV.osd.banner=0;G.tvReelDraw(G.TVH.x,G.TVH.W,G.TVH.H);o.drawImage(G.TVH.cv,(i%2)*854,Math.floor(i/2)*480);});
fs.writeFileSync('/tmp/build2/tvart.png',out.toBuffer('image/png'));console.log('ok');
