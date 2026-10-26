// v9.2 the night outside: street built + cost, walking the road, houses and fences block, fog bank + loop, the lamp outside (SLI), the flicker lamp, 2 AM porch light, the lit window + silhouette, the car, light pool picks streetlights, crickets hush, the dog
import {boot} from './boot81.mjs';
const G=await boot('street',{extra:'NS,VIBE,vibeKey,villaLightPick,VL,vRoomAtWorld,updateStreet,'});G.run(30);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)fails++;};const W=G.V;const N=G.NS;const K=4/3;const P=(x,z)=>W(x*K-8.8,0,z*K-4.9);
const tris=m=>m?m.geometry.attributes.position.count/3:0;console.log('boot',G.bootMs.toFixed(0),'bodies',G.world.bodies.length,'houses',N.houses.length,'lamps',N.lamps.length,'tris walls',tris(N.walls),'flat',tris(N.flat),'roofs',tris(N.roofs),'conc',tris(N.conc),'road',tris(N.road));
ok(N.built&&N.houses.length===14&&N.lamps.length===6,'court built: 14 houses, 6 lamps');ok(G.world.bodies.length<=900,'bodies '+G.world.bodies.length+' (gate 900)');ok(G.VL.fix.filter(f=>f.street).length===6,'streetlights join the light pool');
const at=(x,z,yaw=0)=>{const p=P(x,z);G.player.body.position.set(p.x,0.25,p.z);G.player.body.velocity.set(0,0,0);G.player.yaw=yaw;G.player.pitch=0;G.run(20);};
at(8,21.6);ok(Math.abs(G.player.body.position.y-0.22)<0.06,'standing on the road: y '+G.player.body.position.y.toFixed(2));
at(-60,21.6);ok(Math.abs(G.player.body.position.y-0.22)<0.06,'the road goes on past the old lawn (x −60): y '+G.player.body.position.y.toFixed(2));
G.keys.KeyW=true;at(9.5,29,Math.PI);for(let i=0;i<180;i++)G.step(1/60);G.keys.KeyW=false;const pz=(G.player.body.position.z+4.9)/K;ok(pz<32.9,'walking at the house across the road stops at its wall: z '+pz.toFixed(2));
G.keys.KeyW=true;at(-4,12,-Math.PI/2);for(let i=0;i<150;i++)G.step(1/60);G.keys.KeyW=false;const px=(G.player.body.position.x+8.8)/K;ok(px>-5.3,'the fence between the neighbours blocks: x '+px.toFixed(2));
// fog: thick in the bank; the loop turns you round
at(8,21.6);G.run(60);const d0=G.scene.fog.density;at(-68,21.6,Math.PI/2);G.run(90);const d1=G.scene.fog.density;ok(d1>d0*3,'fog bank at x −68: density '+d0.toFixed(3)+' → '+d1.toFixed(3));
at(-76.6,20,Math.PI/2);const y0=G.player.yaw;G.keys.KeyW=true;for(let i=0;i<40;i++)G.step(1/60);G.keys.KeyW=false;const lx=(G.player.body.position.x+8.8)/K;ok(N.loops>=1&&lx>-77&&Math.abs(((G.player.yaw-y0)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)<0.3,'walking into the bank turns you round: loops '+N.loops+', x '+lx.toFixed(1));
// the lamp outside our house
const s=G.VL.street;const sp=s.position;const i0=s.intensity;G.player.body.position.set(sp.x,0.25,sp.z-0.3);G.run(150);ok(s.intensity<0.5,'standing under the lamp outside: it goes out ('+i0.toFixed(1)+' → '+s.intensity.toFixed(2)+')');at(8,23);G.run(60*5);ok(s.intensity>i0*0.8,'walk away and it comes back on: '+s.intensity.toFixed(1));
// the flicker lamp
let ch=0,last=N.flickLamp.k;for(let i=0;i<1200;i++){G.step(1/60);if(N.flickLamp.k!==last){ch++;last=N.flickLamp.k;}}ok(ch>=2,'the old lamp at 26 flickers ('+ch+' changes in 20 s)');
// light pool: outside, the pool picks streetlights
at(-34,19);G.villaLightPick();ok(G.VL.pool.some(p=>p.fix&&p.fix.street),'outside, the light pool moves onto the streetlights');
// 2 AM
G.vibeKey('KeyN');ok(G.VIBE.am2&&G.VL.fix.filter(f=>f.street&&f!==G.NS.flickLamp.fx).every(f=>f.on!==false),'2 AM leaves the streetlights on (the flicker lamp does what it likes)');
at(9,21.6);G.run(60*3);ok(N.porch.on,'2 AM: standing in the road, the porch light opposite comes on');at(8.8,2);G.run(30);ok(!N.porch.on,'back inside, it goes off');
at(9.5,24,Math.PI);G.run(10);ok(N.sil.visible,'2 AM: someone stands in the lit window');const wp=N.win.position;const look=()=>{const c=G.camera.getWorldPosition(W());const d=wp.clone().sub(c);G.player.yaw=Math.atan2(-d.x,-d.z);G.player.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));};for(let i=0;i<200;i++){look();G.step(1/60);}G.player.yaw+=1.6;G.run(20);ok(N.gone&&!N.sil.visible&&N.card,'look at them long enough, look away, and they\'re gone: the TV shows the test card');
N.carT=0;G.run(2);ok(!!N.car,'a car a street away');let gone=false;for(let i=0;i<60*12;i++){G.step(1/60);if(!N.car){gone=true;break;}}ok(gone,'it never arrives: gone at the edge of the fog');
G.vibeKey('KeyN');G.run(10);ok(!N.card&&!N.gone,'2 AM off resets the window');
// crickets hush while you walk outside, come back when you stop
at(8,21.6,Math.PI/2);G.keys.KeyW=true;for(let i=0;i<120;i++)G.step(1/60);const hw=N.hush;G.keys.KeyW=false;for(let i=0;i<60*7;i++)G.step(1/60);ok(hw<0.6&&N.hush>0.85,'crickets hush round you while you walk ('+hw.toFixed(2)+'), back when you stop ('+N.hush.toFixed(2)+')');
// the dog
at(-20,30,0);/* facing −z, away from the dog */G.run(5);const q0=N.dogQuiet;G.player.yaw=Math.PI;G.run(5);ok(q0===0&&N.dogQuiet>0,'the dog goes quiet when you face it');
console.log('bodies',G.world.bodies.length);console.log(fails?('FAILS '+fails):'ALL OK');
