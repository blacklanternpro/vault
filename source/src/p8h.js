
/* ============================================================ CH 9 · METAL OVERNIGHT — NO BOND BACK, live at the Rathole
   p8h — a made-up thrash band "just jammin the hell out": one gig, two songs and the banter between, about two minutes
   on loop. The picture is one stage drawn in world space and shot through a virtual camera (wide, singer, guitar, bass,
   drums, fretboard, low angle, crowd POV) that cuts on bar lines. The music is sequenced bar by bar off the same timing the
   picture reads, so headbangs, lights, strobes and pyro land on the beat. Guitars and growls go through distortion "amps"
   built once per segment track; everything still comes out of the TV's boxy little speaker. */

const NBB_REEL=mkReel();CHANNELS[9]={name:'METAL OVERNIGHT',reel:NBB_REEL};
const nbbH=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};

/* ---------- sound: amps, guitars, drums, growls */
const NBB_AMPS=new WeakMap();
function nbbCurve(k){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const v=i/(n-1)*2-1;c[i]=Math.tanh(k*v)/Math.tanh(k);}return c;}
function nbbAmp(o,kind){let m=NBB_AMPS.get(o);if(!m){m={};NBB_AMPS.set(o,m);}if(m[kind])return m[kind];const c=TVA.c;const pre=c.createGain();const ws=c.createWaveShaper();ws.oversample='2x';const hp=c.createBiquadFilter();hp.type='highpass';const out=c.createGain();
  if(kind==='vox'){ws.curve=nbbCurve(5);hp.frequency.value=150;const pk=c.createBiquadFilter();pk.type='peaking';pk.frequency.value=1400;pk.Q.value=0.7;pk.gain.value=6;out.gain.value=0.15;pre.connect(ws);ws.connect(hp);hp.connect(pk);pk.connect(out);}
  else{ws.curve=nbbCurve(kind==='lead'?10:16);hp.frequency.value=kind==='lead'?220:85;const sc=c.createBiquadFilter();sc.type='peaking';sc.frequency.value=760;sc.Q.value=0.9;sc.gain.value=-7;const pr=c.createBiquadFilter();pr.type='peaking';pr.frequency.value=2600;pr.Q.value=1;pr.gain.value=5;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=kind==='lead'?6200:5200;lp.Q.value=0.8;
    out.gain.value=kind==='lead'?0.085:0.13;pre.connect(ws);ws.connect(hp);hp.connect(sc);sc.connect(pr);pr.connect(lp);lp.connect(out);}
  out.connect(o);m[kind]=pre;return pre;}
const NBB_NT={e:82.41,f:87.31,h:92.5,g:98,a:110,t:116.54,b:123.47,c:130.81,d:146.83};
function nbbGtr(d,f,dur,o,open,g){const A=nbbAmp(o,'gtr');const c=TVA.c,t0=TVA.t+Math.max(0,d);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=open?3600:1050;lp.Q.value=open?0.7:2.4;const eg=c.createGain();TVA.env(eg,0.3*(g||1),0.002,dur,t0);lp.connect(eg);eg.connect(A);
  const fs=open?[[f,0.997],[f,1.004],[f*1.4983,1],[f*2,1.002]]:[[f,0.997],[f,1.004],[f*1.4983,1]];for(const [ff,dt] of fs){const os=c.createOscillator();os.type='sawtooth';os.frequency.value=ff*dt;os.connect(lp);os.start(t0);os.stop(t0+dur+0.06);}}
function nbbLead(d,f,dur,o,bend){const A=nbbAmp(o,'lead');const c=TVA.c,t0=TVA.t+Math.max(0,d);const os=c.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(bend?f*Math.pow(2,-bend/12):f,t0);if(bend)os.frequency.linearRampToValueAtTime(f,t0+Math.min(0.12,dur*0.4));
  const lf=c.createOscillator();lf.frequency.value=6.2;const lg=c.createGain();lg.gain.value=dur>0.18?f*0.014:0;lf.connect(lg);lg.connect(os.frequency);const eg=c.createGain();TVA.env(eg,0.24,0.004,dur,t0);os.connect(eg);eg.connect(A);os.start(t0);os.stop(t0+dur+0.06);lf.start(t0);lf.stop(t0+dur+0.06);}
function nbbKick(d,o,short){TVA.tone({f:short?120:130,f1:short?55:42,dur:short?0.075:0.15,gain:short?0.36:0.46,delay:d},o);TVA.noise({dur:0.012,gain:0.22,type:'bandpass',f:3200,q:1.2,delay:d},o);}
function nbbSnare(d,o,g){TVA.noise({dur:0.16,gain:(g||1)*0.3,type:'bandpass',f:2100,q:0.7,delay:d},o);TVA.noise({dur:0.06,gain:(g||1)*0.2,type:'highpass',f:5000,delay:d},o);TVA.tone({f:240,f1:170,dur:0.07,gain:(g||1)*0.16,delay:d},o);}
function nbbCrash(d,o,g){TVA.noise({dur:1.15,gain:(g||1)*0.1,type:'highpass',f:5200,delay:d},o);TVA.noise({dur:0.5,gain:(g||1)*0.06,type:'bandpass',f:3200,q:0.8,delay:d},o);}
function nbbChina(d,o){TVA.noise({dur:0.45,gain:0.12,type:'bandpass',f:2600,q:1.4,delay:d},o);TVA.noise({dur:0.2,gain:0.06,type:'highpass',f:7000,delay:d},o);}
function nbbTom(d,o,f){TVA.tone({f,f1:f*0.62,dur:0.2,gain:0.3,delay:d},o);TVA.noise({dur:0.05,gain:0.08,type:'lowpass',f:1400,delay:d},o);}
const NBB_DR={skank:{k:'x...x...x...x...',s:'..x...x...x...x.',h:'x.x.x.x.x.x.x.x.'},
  double:{k:'xxxxxxxxxxxxxxxx',s:'....x.......x...',h:'x...x...x...x...'},
  half:{k:'x.....x.x.....x.',s:'........x.......',c:'x...x...x...x...'},
  brk:{k:'x..x..x...x.x...',s:'........x.......',x:'x...x...x...x...'}};
function nbbDrums(dr,d0,s,o,fill,crash){const dbl=!!(dr.k&&dr.k.indexOf('xxxx')>=0);
  for(let i=0;i<16;i++){const d=d0+i*s;if(fill&&i>=12){nbbTom(d,o,[210,170,135,105][i-12]);if(i%2===0)nbbKick(d,o,true);continue;}
    if(dr.k&&dr.k[i]==='x')nbbKick(d,o,dbl);if(dr.s&&dr.s[i]==='x')nbbSnare(d,o);if(dr.h&&dr.h[i]==='x')IN.hat(d,o,0.07);if(dr.c&&dr.c[i]==='x')nbbCrash(d,o,0.8);if(dr.x&&dr.x[i]==='x')nbbChina(d,o);if(dr.T&&dr.T[i]==='x')nbbTom(d,o,[200,170,140,110][(i>>2)%4]);}
  if(crash)nbbCrash(d0,o,1);}
function nbbRiff(str,d0,s,o,g){for(let i=0;i<16;i++){const ch=str[i];if(ch==='.'||ch==='-')continue;const low=ch.toLowerCase();const f=NBB_NT[low];if(!f)continue;let n=1;while(i+n<16&&str[i+n]==='-')n++;const open=ch!==low;
  nbbGtr(d0+i*s,f,open?n*s*0.95+0.05:Math.min(n*s*0.8,0.085),o,open,g);IN.bass(f,d0+i*s,o,Math.min(n*s*0.9,0.4),0.12);}}
const NBB_VOW=[[700,1150],[480,880],[380,2000],[620,1020],[320,2250]];
function nbbGrowl(d,n,len,o,op){op=op||{};const A=nbbAmp(o,'vox');const c=TVA.c;const f0=op.f||96;const sp=len/n;
  for(let i=0;i<n;i++){const t0=TVA.t+Math.max(0,d+i*sp);const du=sp*(op.hold&&i===n-1?2.6:0.84);const v=NBB_VOW[(i*3+(op.seed||0))%5];
    const os=c.createOscillator();os.type='sawtooth';const ff=f0*(1+Math.sin(i*2.3+(op.seed||0))*0.08);os.frequency.setValueAtTime(ff*1.06,t0);os.frequency.linearRampToValueAtTime(ff*0.88,t0+du);
    const ns=c.createBufferSource();ns.buffer=S.noiseBuf;ns.loop=true;const mix=c.createGain();os.connect(mix);const ng=c.createGain();ng.gain.value=0.9;ns.connect(ng);ng.connect(mix);
    const eg=c.createGain();TVA.env(eg,op.gang?0.3:0.42,0.012,du,t0);for(const [fq,q] of[[v[0],4],[v[1],5]]){const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=fq;bp.Q.value=q;mix.connect(bp);bp.connect(eg);}
    eg.connect(A);os.start(t0);os.stop(t0+du+0.08);ns.start(t0,Math.random());ns.stop(t0+du+0.08);}}
function nbbGang(d,n,len,o,hold){for(const f of[124,158,196])nbbGrowl(d+(f-124)*0.0002,n,len,o,{f,gang:true,hold,seed:f});}
function nbbCrowd(d,o,dur,g){TVA.noise({dur,gain:g,type:'bandpass',f:850,q:0.55,att:dur*0.3,delay:d},o);TVA.noise({dur:dur*0.8,gain:g*0.5,type:'bandpass',f:2400,q:0.9,att:dur*0.3,delay:d+0.1},o);}
function nbbCheer(d,o,n,g){for(let i=0;i<n;i++){const f=260+Math.random()*260;TVA.voice({f0:f,f1:f*1.6,f2:f*1.35,dur:0.6+Math.random()*0.5,vib:0.05,form:[[380,5,3],[900,6,1.5]],breath:0.6,gain:(g||0.05),delay:d+Math.random()*0.5});}}
function nbbBoo(d,o,n){for(let i=0;i<n;i++){const f=110+Math.random()*80;TVA.voice({f0:f*1.05,f1:f,f2:f*0.8,dur:1.1+Math.random()*0.6,vib:0.03,form:[[320,5,3],[700,6,1.4]],breath:0.5,gain:0.05,delay:d+Math.random()*0.3});}}
function nbbFeedback(d,o,f,dur,g){const c=TVA.c,t0=TVA.t+d;const A=nbbAmp(o,'lead');const os=c.createOscillator();os.type='sine';os.frequency.setValueAtTime(f,t0);os.frequency.linearRampToValueAtTime(f*1.02,t0+dur);const eg=c.createGain();eg.gain.setValueAtTime(0.0001,t0);eg.gain.exponentialRampToValueAtTime(g||0.12,t0+dur*0.7);eg.gain.exponentialRampToValueAtTime(0.0001,t0+dur);os.connect(eg);eg.connect(A);os.start(t0);os.stop(t0+dur+0.05);}

/* ---------- songs: a plan of [section, bars] plus riffs (16 sixteenths a bar: lower case = palm-muted, upper case = open
   power chord, '-' holds, '.' rests), vocal lines keyed by bar, and camera shots keyed by bar */
function nbbSong(id,bpm,plan,riff,vox,shots,o){const bars=[];for(const [k,n] of plan)for(let i=0;i<n;i++)bars.push({k,i,n});const sg=Object.assign({id,bpm,beat:60/bpm,bar:240/bpm,t0:0.5,bars,riff,vox,shots},o||{});sg.dur=sg.t0+bars.length*sg.bar+1.4;return sg;}
const NBB_S1=nbbSong('nbb_song1',210,[['count',1],['intro',4],['verse',8],['chorus',4],['verse',8],['chorus',4],['solo',8],['brk',4],['chorus',4],['end',2]],
  {A:'e.eee.eee.eeG---',B:'e.eee.eeF---e.T-',C1:'E-------C-------',C2:'D-------B-------',K:'e...e.e...e.eee.'},
  {5:{text:'HOLE IN THE PLASTER, FIST-SHAPED AND PROUD',n:10,len:2},7:{text:"CARPET'S A CRIME SCENE, I'M SCREAMING OUT LOUD",n:11,len:2},
   9:{text:"HERE COMES THE AGENT, HE'S GOT A CLIPBOARD",n:11,len:2},11:{text:'ITEMISED DEDUCTIONS. MY BOND IS IGNORED',n:12,len:2},
   13:{text:'INSPECTION THURSDAY!',n:5,len:1,gang:true},14:{text:'(THURSDAY!)',n:2,len:1,gang:true},15:{text:'INSPECTION THURSDAY!',n:5,len:1,gang:true},16:{text:'NO BOND BACK!',n:3,len:1,gang:true,hold:true},
   17:{text:'SOLD THE SMOKE ALARM BATTERY FOR BEER',n:10,len:2},19:{text:'MOULD ON THE CEILING HAS LIVED HERE A YEAR',n:11,len:2},
   21:{text:'PATCH IT WITH TOOTHPASTE, PAINT IT WITH LIES',n:11,len:2},23:{text:"GARY'S IN HIS CONVERTIBLE, DEAD IN THE EYES",n:12,len:2},
   25:{text:'INSPECTION THURSDAY!',n:5,len:1,gang:true},26:{text:'(THURSDAY!)',n:2,len:1,gang:true},27:{text:'INSPECTION THURSDAY!',n:5,len:1,gang:true},28:{text:'NO BOND BACK!',n:3,len:1,gang:true,hold:true},
   37:{text:'BREAK!',n:1,len:1,hold:true},38:{text:'THE!',n:1,len:1,hold:true},39:{text:'LEASE!',n:1,len:1,hold:true},40:{text:'NOW MOSH!',n:2,len:1,gang:true,hold:true},
   41:{text:'INSPECTION THURSDAY!',n:5,len:1,gang:true},42:{text:'(THURSDAY!)',n:2,len:1,gang:true},43:{text:'INSPECTION THURSDAY!',n:5,len:1,gang:true},44:{text:'NO BOND BACK!',n:3,len:1,gang:true,hold:true},
   45:{text:'NO BOND BAAAACK!',n:3,len:2,hold:true}},
  [[0,'wide'],[1,'drum'],[2,'gtr'],[3,'neck'],[4,'wide'],[5,'sing'],[7,'wide2'],[9,'bass'],[10,'sing'],[11,'singc'],[13,'wide'],[14,'crowd'],[15,'low'],[16,'singc'],[17,'gtr'],[19,'sing'],[21,'drum'],[22,'crowd'],[23,'singc'],
   [25,'wide'],[26,'crowd'],[27,'sing'],[29,'neck'],[31,'gtr'],[32,'low'],[33,'crowd'],[35,'neck'],[37,'wide'],[38,'crowd'],[39,'sing'],[40,'drum'],[41,'wide'],[42,'singc'],[43,'crowd'],[44,'low'],[45,'wide']],
  {title:"'INSPECTION THURSDAY'"});
const NBB_S2=nbbSong('nbb_song2',232,[['fill',1],['intro',4],['verse',8],['chorus',4],['solo',8],['chorus',4],['end',2]],
  {A:'eefeeeheeegehfe.',B:'eefeeeheT-T-G---',C1:'E-------F-------',C2:'G-------H-------',F:'............E---'},
  {5:{text:'CLAW HAMMER, WRECKING BAR, SAW IN MY HAND',n:10,len:2},7:{text:"NINETY BY FORTY-FIVE, AND I'M TAKING A STAND",n:11,len:2},
   9:{text:'PRY BACK THE SKIRTING AND THE NAILS START TO SCREAM',n:12,len:2},11:{text:"TEAR DOWN THE PLASTER. IT'S A LANDLORD'S BAD DREAM",n:12,len:2},
   13:{text:'SKIRTING BOARD!',n:4,len:1,gang:true},14:{text:'MASSACRE!',n:3,len:1,gang:true},15:{text:'SKIRTING BOARD!',n:4,len:1,gang:true},16:{text:'MASSACRE!!!',n:3,len:1,gang:true,hold:true},
   25:{text:'SKIRTING BOARD!',n:4,len:1,gang:true},26:{text:'MASSACRE!',n:3,len:1,gang:true},27:{text:'SKIRTING BOARD!',n:4,len:1,gang:true},28:{text:'MASSACRE!!!',n:3,len:1,gang:true,hold:true},
   29:{text:'SKIRTING BOARD MASSACRE!',n:7,len:2,hold:true}},
  [[0,'drum'],[1,'wide'],[2,'bass'],[3,'gtr'],[5,'sing'],[7,'low'],[9,'crowd'],[11,'singc'],[13,'wide'],[14,'crowd'],[15,'sing'],[16,'wide2'],[17,'neck'],[19,'gtr'],[21,'crowd'],[23,'neck'],[25,'wide'],[26,'singc'],[27,'crowd'],[28,'low'],[29,'wide']],
  {title:"'SKIRTING BOARD MASSACRE'"});
const NBB_PENT=[329.63,392,440,493.88,587.33,659.26,783.99,880];
function nbbSolo(bi,b,d0,s,o){const fast=b.i%4>=2;const step=fast?1:2;for(let i=0;i<16;i+=step){const h=nbbH(bi*31+i*7);if(!fast&&h<0.12)continue;let idx=Math.floor(h*8);if(fast)idx=b.i%2?7-((i*3)%8):(i*3)%8;
  if(b.i%4===3&&i===8){nbbLead(d0+i*s,NBB_PENT[6],8*s,o,2);break;}nbbLead(d0+i*s,NBB_PENT[idx],step*s*0.92,o,(!fast&&i>=12)?2:0);}}
function nbbPlayBar(sg,bi,o,d0){const b=sg.bars[bi];if(!b)return;const s=sg.beat/4,k=b.k,R=sg.riff;const nx=sg.bars[bi+1];const fill=b.i===b.n-1&&!!nx&&nx.k!==k&&k!=='count'&&k!=='end'&&k!=='fill';
  let gs=null,dr=null,cr=false;
  if(k==='count'){for(let q=0;q<4;q++)IN.tick(d0+q*4*s,o,0.3,2600);}
  else if(k==='fill'){dr={T:'xxxxxxxxxxxx....',k:'............x.x.'};gs=R.F;}
  else if(k==='intro'||k==='verse'||k==='solo'){gs=b.i%2?R.B:R.A;dr=NBB_DR[k==='verse'?'skank':'double'];cr=b.i%4===0;}
  else if(k==='chorus'){gs=b.i%2?R.C2:R.C1;dr=NBB_DR.half;if(b.i===0)TVA.noise({dur:0.9,gain:0.25,type:'lowpass',f:420,f1:1600,att:0.05,delay:d0},o);}
  else if(k==='brk'){gs=R.K;dr=NBB_DR.brk;cr=b.i===0;}
  else if(k==='end'){if(b.i===0){gs='E...E...E...E---';dr={k:'x...x...x...x...',c:'x...x...x...x...'};for(let q=0;q<4;q++)TVA.noise({dur:0.7,gain:0.18,type:'lowpass',f:400,f1:1400,att:0.04,delay:d0+q*4*s},o);}else{gs='E---------------';nbbCrash(d0,o,1.2);for(let i=0;i<12;i++)nbbTom(d0+(2+i)*s,o,[210,190,170,150,135,120,110,100,95,90,86,82][i]);nbbFeedback(d0+0.3,o,1318.5,sg.bar*2.2,0.08);}}
  if(gs)nbbRiff(gs,d0,s,o,k==='solo'?0.75:1);if(dr)nbbDrums(dr,d0,s,o,fill,cr);if(k==='solo')nbbSolo(bi,b,d0,s,o);
  const v=sg.vox[bi];if(v){const len=v.len*sg.bar*0.86;if(v.gang)nbbGang(d0,v.n,len,o,v.hold);else nbbGrowl(d0,v.n,len,o,{hold:v.hold,seed:v.n});}
  nbbCrowd(d0,o,sg.bar*1.4,k==='count'||k==='fill'?0.06:0.03);if(k==='chorus'&&b.i===3)nbbCheer(d0+sg.bar*0.5,o,4,0.04);}
function nbbCues(sg){const cues=[];sg.bars.forEach((b,bi)=>{const bt=sg.t0+bi*sg.bar;cues.push({t:bt+0.001,snd:true,fn(){const o=TVA.out();if(o)nbbPlayBar(sg,bi,o,0);}});
  const v=sg.vox[bi];if(v)cues.push({t:bt+0.002,fn(){tvSay('NO BOND BACK','♪ '+v.text+' ♪',Math.max(1.3,v.len*sg.bar));}});});return cues;}

/* ---------- picture: the Rathole stage in world units (1000 × 560), shot through a camera */
const NBB_PAL={count:['#1838a8','#1838a8'],fill:['#1838a8','#c01818'],intro:['#ff2a10','#ff9a20'],verse:['#ff2010','#ffb030'],chorus:['#ffffff','#40a0ff'],solo:['#c020ff','#ff2080'],brk:['#ffffff','#ff1010'],end:['#ffffff','#ffd040'],talk:['#ff8a20','#3050c0'],dark:['#1830a0','#102060']};
const NBB_CROWD=(()=>{const a=[];for(let i=0;i<30;i++){const h=nbbH(i*13.7);a.push({x:-10+i*35+h*18,y:500+nbbH(i*3.1)*36,s:0.9+nbbH(i*9.2)*0.35,arm:nbbH(i*5.3),ph:nbbH(i*2.9)*6.28,horns:nbbH(i*7.7)>0.55});}return a;})();
function nbbIK(sx,sy,hx,hy,l1,l2,bend){const dx=hx-sx,dy=hy-sy;const d=Math.hypot(dx,dy)||1e-3;const dd=Math.min(d,l1+l2-0.001);const a=(l1*l1-l2*l2+dd*dd)/(2*dd);const h=Math.sqrt(Math.max(0,l1*l1-a*a));const ux=dx/d,uy=dy/d;return[sx+ux*a-uy*h*bend,sy+uy*a+ux*h*bend];}
function nbbGuitar(x,bx,by,ang,o){x.save();x.translate(bx,by);x.rotate(ang);const L=o.bass?2.25:1.85,nw=o.bass?0.13:0.11;
  x.fillStyle='#1c130c';x.fillRect(0.3,-nw/2,L,nw);x.strokeStyle='rgba(210,210,200,0.45)';x.lineWidth=0.014;for(let i=1;i<15;i++){const fx=0.3+L*(1-Math.pow(0.94,i))/(1-Math.pow(0.94,17));x.beginPath();x.moveTo(fx,-nw/2);x.lineTo(fx,nw/2);x.stroke();}
  x.fillStyle='#d8d8d0';for(const i of[3,5,7,9,12]){const fx=0.3+L*(1-Math.pow(0.94,i-0.5))/(1-Math.pow(0.94,17));x.beginPath();x.arc(fx,0,0.014,0,7);x.fill();}
  x.fillStyle=o.col||'#111';x.beginPath();x.moveTo(0.3+L,-nw/2-0.02);x.lineTo(0.3+L+0.44,-0.17);x.lineTo(0.3+L+0.36,nw/2+0.04);x.lineTo(0.3+L,nw/2);x.closePath();x.fill();
  x.fillStyle=o.col||'#7a0d10';x.beginPath();if(o.bass){x.moveTo(0.34,-0.14);x.quadraticCurveTo(-0.2,-0.7,-0.7,-0.36);x.quadraticCurveTo(-0.9,0,-0.66,0.4);x.quadraticCurveTo(-0.1,0.62,0.34,0.14);x.closePath();}else{x.moveTo(0.36,-0.12);x.lineTo(-0.86,-0.64);x.lineTo(-0.6,-0.05);x.lineTo(-0.96,0.52);x.lineTo(0.36,0.14);x.closePath();}x.fill();
  x.strokeStyle=o.rim;x.globalAlpha=0.7;x.lineWidth=0.035;x.stroke();x.globalAlpha=1;x.fillStyle='#070707';x.fillRect(-0.38,-0.11,0.1,0.22);x.fillRect(-0.14,-0.11,0.1,0.22);
  x.strokeStyle='rgba(235,235,225,0.6)';x.lineWidth=0.008;const n=o.bass?4:6;for(let i=0;i<n;i++){const yy=-nw*0.38+i*nw*0.76/(n-1);x.beginPath();x.moveTo(-0.48,yy*0.9);x.lineTo(0.3+L,yy);x.stroke();}x.restore();}
function nbbHorns(x,hx,hy,up){x.strokeStyle='#1c1412';x.lineWidth=0.07;x.beginPath();x.moveTo(hx-0.07,hy);x.lineTo(hx-0.11,hy-0.24*up);x.moveTo(hx+0.07,hy);x.lineTo(hx+0.11,hy-0.24*up);x.stroke();}
/* a rocker, front-on, origin at the feet, ~3.9 units tall. bang: head pitch (−0.4 thrown back … 1 chin on chest); flare: hair flying */
function nbbRocker(x,X,Y,S,o){x.save();x.translate(X,Y);x.scale(S*(o.dir||1),S);x.lineCap='round';x.lineJoin='round';const B='#0b0a0d',rim=o.rim||'#ff4030',bob=o.bob||0,bang=o.bang||0,fl=o.flare||0;
  const hipY=-1.9+bob*0.1,stn=o.stance||0.62;x.strokeStyle=B;x.lineWidth=0.4;for(const k of[-1,1]){x.beginPath();x.moveTo(k*0.2,hipY);x.lineTo(k*stn*0.78,-0.95+bob*0.08);x.lineTo(k*stn,-0.08);x.stroke();}
  x.fillStyle='#040405';for(const k of[-1,1]){x.beginPath();x.ellipse(k*(stn+0.06),-0.07,0.27,0.12,0,0,7);x.fill();}
  const sh=hipY-1.4+Math.max(0,bang)*0.18;x.fillStyle=o.shirt||'#121014';x.beginPath();x.moveTo(-0.38,hipY+0.05);x.lineTo(-0.56,sh+0.08);x.quadraticCurveTo(0,sh-0.12,0.56,sh+0.08);x.lineTo(0.38,hipY+0.05);x.closePath();x.fill();
  if(o.print){x.globalAlpha=0.6;x.fillStyle=o.print;x.beginPath();x.moveTo(-0.2,sh+0.35);x.lineTo(0,sh+0.9);x.lineTo(0.2,sh+0.35);x.closePath();x.fill();x.globalAlpha=1;}
  x.strokeStyle=rim;x.globalAlpha=0.6;x.lineWidth=0.05;x.beginPath();x.moveTo(0.56,sh+0.08);x.lineTo(0.38,hipY+0.05);x.stroke();x.beginPath();x.moveTo(stn*0.78,-0.95);x.lineTo(stn,-0.08);x.stroke();x.globalAlpha=1;
  const hr=0.3,hx=o.headX||0,hy=sh-0.38+Math.max(0,bang)*0.44;const hc=o.hair||'#141012',L=o.hairLen||1.25;
  const hair=(front)=>{x.strokeStyle=hc;x.lineWidth=0.14;let ex=0,ey=0;for(let j=0;j<9;j++){const u=j/8*2-1;const rx=hx+u*hr*0.8,ry=hy-hr*0.55;let tx,ty;
      if(front){tx=hx+u*(0.22+fl*0.6)+(o.sway||0)*0.25;ty=hy+L*(0.5+0.5*bang)-fl*0.6*Math.abs(u);}else{tx=hx+u*(0.42+fl*0.75);ty=hy+L*0.62-fl*(0.55+0.4*Math.abs(u));}
      x.beginPath();x.moveTo(rx,ry);x.quadraticCurveTo((rx+tx)/2+u*0.16,(ry+ty)/2,tx,ty);x.stroke();if(j===8){ex=tx;ey=ty;}}
    x.strokeStyle=rim;x.globalAlpha=0.35;x.lineWidth=0.03;x.beginPath();x.moveTo(hx+hr*0.8,hy-hr*0.55);x.quadraticCurveTo(hx+0.45,hy+0.2,ex,ey);x.stroke();x.globalAlpha=1;};
  const faceOn=o.face&&bang<=0.35;if(bang<=0.35)hair(false);x.fillStyle=B;x.fillRect(hx-0.1,hy,0.2,sh-hy+0.06);
  x.fillStyle=faceOn?'#2e211d':B;x.beginPath();x.ellipse(hx,hy,hr*0.86,hr,0,0,7);x.fill();
  if(faceOn){const sc=o.scream||0;const g=x.createLinearGradient(hx-hr,hy,hx+hr,hy);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,rim);x.globalAlpha=0.4;x.fillStyle=g;x.beginPath();x.ellipse(hx,hy,hr*0.86,hr,0,0,7);x.fill();x.globalAlpha=1;
    x.fillStyle='#000';x.beginPath();x.ellipse(hx,hy+0.13,0.07+sc*0.05,0.03+sc*0.11,0,0,7);x.fill();x.strokeStyle='#000';x.lineWidth=0.035;for(const k of[-1,1]){x.beginPath();x.moveTo(hx+k*0.05,hy-0.08+sc*0.02);x.lineTo(hx+k*0.17,hy-0.03-sc*0.04);x.stroke();}
    x.strokeStyle=hc;x.lineWidth=0.12;for(const k of[-1,1]){x.beginPath();x.moveTo(hx+k*0.24,hy-0.2);x.quadraticCurveTo(hx+k*0.3,hy+0.2,hx+k*0.27,hy+0.5);x.stroke();}}
  x.strokeStyle=rim;x.globalAlpha=0.65;x.lineWidth=0.045;x.beginPath();x.ellipse(hx,hy,hr*0.86,hr,0,-1.25,1.0);x.stroke();x.globalAlpha=1;if(bang>0.35)hair(true);
  const shL=[-0.5,sh+0.12],shR=[0.5,sh+0.12];const arm=(s,h,bend,horns)=>{const e=nbbIK(s[0],s[1],h[0],h[1],0.74,0.7,bend);x.strokeStyle=o.sleeve||B;x.lineWidth=0.24;x.beginPath();x.moveTo(s[0],s[1]);x.lineTo(e[0],e[1]);x.lineTo(h[0],h[1]);x.stroke();
    x.strokeStyle=rim;x.globalAlpha=0.4;x.lineWidth=0.04;x.beginPath();x.moveTo(s[0]+0.08,s[1]);x.lineTo(e[0]+0.08,e[1]);x.stroke();x.globalAlpha=1;x.fillStyle='#1c1412';x.beginPath();x.arc(h[0],h[1],0.11,0,7);x.fill();if(horns)nbbHorns(x,h[0],h[1]-0.06,1);};
  if(o.raise!==undefined){/* guitar over the head (and down onto the floor) */const r=o.raise;const ang=-Math.PI/2-0.25+r*2.6;const gx=Math.cos(ang)*1.1,gy=sh-0.4+Math.sin(ang)*1.1;nbbGuitar(x,gx,gy,ang+Math.PI,{col:o.gcol,rim});arm(shL,[gx*0.6-0.12,sh-0.6+Math.sin(ang)*0.5],1);arm(shR,[gx*0.6+0.12,sh-0.6+Math.sin(ang)*0.5],-1);}
  else if(o.inst){const gb=[0.12,hipY+0.15];const ang=Math.PI+(o.neckA||0.42);const Ln=o.inst==='bass'?2.25:1.85;nbbGuitar(x,gb[0],gb[1],ang,{bass:o.inst==='bass',col:o.gcol,rim});
    const fr=o.fret||0.5;const fh=[gb[0]+Math.cos(ang)*(0.3+Ln*fr),gb[1]+Math.sin(ang)*(0.3+Ln*fr)+0.05];const st=o.strum||0;const ph=[gb[0]-Math.cos(ang)*0.25+Math.sin(ang)*st*0.15,gb[1]-Math.sin(ang)*0.25-Math.cos(ang)*st*0.15-0.06];
    if(o.wail){arm(shL,fh,1);arm(shR,[0.75,sh-0.95],-1,true);}else{arm(shL,fh,1);arm(shR,ph,-1);}}
  else if(o.mic){arm(shR,[hx+0.15,hy+0.24],1);x.fillStyle='#202022';x.save();x.translate(hx+0.12,hy+0.24);x.rotate(-0.5);x.fillRect(-0.045,0,0.09,0.34);x.fillStyle='#5a5a5e';x.beginPath();x.arc(0,-0.01,0.07,0,7);x.fill();x.restore();
    const fa=o.fist||0;arm(shL,[-0.62-0.3*Math.cos(fa),sh+0.2-1.05*Math.sin(fa)],-1,o.horns);}
  else{arm(shL,[-0.72,sh+1.15],-1);arm(shR,[0.78,sh-0.95],-1,true);}
  x.restore();}
function nbbDrummer(x,X,Y,S,st,rim){x.save();x.translate(X,Y);x.scale(S,S);x.lineCap='round';const B='#0b0a0d';const bang=st.bang2,fl=st.flare2;
  x.fillStyle=B;x.beginPath();x.moveTo(-0.5,0.2);x.lineTo(-0.56,-1.2);x.quadraticCurveTo(0,-1.34,0.56,-1.2);x.lineTo(0.5,0.2);x.closePath();x.fill();
  const hy=-1.62+Math.max(0,bang)*0.36;x.strokeStyle='#100c0a';x.lineWidth=0.15;for(let j=0;j<8;j++){const u=j/7*2-1;x.beginPath();x.moveTo(u*0.22,hy-0.16);x.quadraticCurveTo(u*0.4,hy+0.3,u*(0.35+fl*0.7),hy+0.95-fl*0.6*Math.abs(u));x.stroke();}
  x.fillStyle=B;x.beginPath();x.ellipse(0,hy,0.26,0.3,0,0,7);x.fill();x.strokeStyle=rim;x.globalAlpha=0.6;x.lineWidth=0.04;x.beginPath();x.ellipse(0,hy,0.26,0.3,0,-1.2,1);x.stroke();x.globalAlpha=1;
  const hit=(side,ph,tx,ty)=>{const lift=Math.pow(Math.abs(Math.sin(ph*Math.PI)),0.7);const hx=side*0.25+tx,hy2=ty-lift*0.55;const e=nbbIK(side*0.5,-1.1,hx,hy2,0.62,0.6,side);x.strokeStyle=B;x.lineWidth=0.22;x.beginPath();x.moveTo(side*0.5,-1.1);x.lineTo(e[0],e[1]);x.lineTo(hx,hy2);x.stroke();
    x.strokeStyle='#d8c8a0';x.lineWidth=0.05;x.beginPath();x.moveTo(hx,hy2);x.lineTo(hx+side*0.15-tx*0.3,hy2-0.62+lift*0.3);x.stroke();};
  hit(-1,st.lh,-0.55,-0.4);hit(1,st.rh,0.65,-0.62);x.restore();}
function nbbKit(x,cx,by,st,rim){const k=st.kick,cw=st.cym;
  for(const [px,py,r,tilt] of[[cx-118,by-118,40,0.25],[cx+128,by-128,44,-0.22],[cx+70,by-150,34,-0.1]]){const wob=Math.sin(st.t*31)*cw*0.12;x.strokeStyle='#2a2a2c';x.lineWidth=2;x.beginPath();x.moveTo(px,py);x.lineTo(px+(px<cx?8:-8),by);x.stroke();x.save();x.translate(px,py);x.rotate(tilt+wob);
    const g=x.createLinearGradient(-r,0,r,0);g.addColorStop(0,'#3a3220');g.addColorStop(0.5,rim);g.addColorStop(1,'#3a3220');x.globalAlpha=0.55+cw*0.4;x.fillStyle=g;x.beginPath();x.ellipse(0,0,r,r*0.2,0,0,7);x.fill();x.globalAlpha=1;x.restore();}
  x.fillStyle='#141416';for(const [px,r] of[[cx-50,22],[cx+48,24]]){x.beginPath();x.ellipse(px,by-74,r,r*0.55,0,0,7);x.fill();x.fillStyle='#262628';x.beginPath();x.ellipse(px,by-80,r,r*0.4,0,0,7);x.fill();x.fillStyle='#141416';}
  x.fillStyle='#202022';x.fillRect(cx-150,by-44,40,44);x.fillStyle='#2a2a2c';x.beginPath();x.ellipse(cx-130,by-46,26,7,0,0,7);x.fill();
  const kr=46+k*1.5;x.fillStyle='#0d0d10';x.beginPath();x.arc(cx,by-kr+2,kr,0,7);x.fill();x.fillStyle='#1a1519';x.beginPath();x.arc(cx,by-kr+2,kr-5,0,7);x.fill();
  nbbLogoMark(x,cx,by-kr+2,0.42,'#5a524c','#7a1010');x.strokeStyle=rim;x.globalAlpha=0.5;x.lineWidth=2;x.beginPath();x.arc(cx,by-kr+2,kr,-1.2,0.6);x.stroke();x.globalAlpha=1;}
function nbbLogoMark(x,cx,cy,s,c0,c1){/* crossed claw hammers behind a house with a cracked roof */x.save();x.translate(cx,cy);x.scale(s,s);x.lineCap='round';
  for(const k of[-1,1]){x.save();x.rotate(k*0.62);x.strokeStyle=c0;x.lineWidth=13;x.beginPath();x.moveTo(0,70);x.lineTo(0,-62);x.stroke();x.fillStyle=c0;x.fillRect(-34,-80,48,22);x.beginPath();x.moveTo(14,-80);x.quadraticCurveTo(40,-82,44,-56);x.lineTo(30,-58);x.quadraticCurveTo(28,-70,14,-62);x.fill();x.restore();}
  x.fillStyle=c1;x.beginPath();x.moveTo(-40,10);x.lineTo(0,-30);x.lineTo(40,10);x.lineTo(30,10);x.lineTo(30,42);x.lineTo(-30,42);x.lineTo(-30,10);x.closePath();x.fill();x.strokeStyle='#e8e2d4';x.lineWidth=4;x.beginPath();x.moveTo(-4,-26);x.lineTo(6,-8);x.lineTo(-6,6);x.lineTo(8,26);x.stroke();x.restore();}
function nbbType(x,t,px,py,size,o={}){/* the band's lettering: heavy condensed caps with a hot outline and spikes off the tops */x.save();x.font=`900 ${Math.round(size)}px Impact,"Arial Black",sans-serif`;x.textAlign='center';x.textBaseline='middle';
  if(o.spikes){const w=x.measureText(t).width;x.fillStyle=o.out||'#fff';for(let i=0;i<9;i++){const sx=px-w/2+w*(i+0.5)/9;const h=size*(0.28+nbbH(i*4.1)*0.3);x.beginPath();x.moveTo(sx-size*0.06,py-size*0.32);x.lineTo(sx+(nbbH(i)*2-1)*size*0.08,py-size*0.32-h);x.lineTo(sx+size*0.06,py-size*0.32);x.fill();}}
  x.lineJoin='miter';x.lineWidth=size*0.12;x.strokeStyle=o.out||'#fff';x.strokeText(t,px,py);x.fillStyle=o.fill||'#8a0c0c';x.fillText(t,px,py);if(o.glow){x.globalCompositeOperation='lighter';x.globalAlpha=o.glow;x.fillStyle=o.fill||'#8a0c0c';x.fillText(t,px,py);}x.restore();}
function nbbWorld(x,st){const t=st.t,P=NBB_PAL[st.kind]||NBB_PAL.verse,dim=st.dim;
  x.fillStyle='#050507';x.fillRect(-200,-200,1400,960);
  /* backdrop banner */x.fillStyle='#0d0b0d';x.fillRect(200,46,600,190);x.save();x.globalAlpha=0.55+0.45*(1-dim);nbbLogoMark(x,500,118,0.62,'#2a2224','#4a0c0c');nbbType(x,'NO BOND BACK',500,190,62,{spikes:true,out:'#c8c0b0',fill:'#5a0808'});x.restore();
  x.strokeStyle='#1a1a1c';x.lineWidth=3;for(let i=0;i<7;i++){x.beginPath();x.moveTo(200+i*100,46);x.lineTo(200+i*100+(i%2?6:-6),52);x.stroke();}
  /* amp stacks */for(const ax of[70,800]){for(let r=0;r<2;r++){x.fillStyle='#121214';x.fillRect(ax,204+r*64,130,62);x.fillStyle='#1c1c1f';x.fillRect(ax+6,210+r*64,118,50);x.strokeStyle='rgba(70,70,74,0.5)';x.lineWidth=1;for(let q=0;q<13;q++){x.beginPath();x.moveTo(ax+6+q*9,210+r*64);x.lineTo(ax+6+q*9+10,260+r*64);x.stroke();}}
    x.fillStyle='#0e0e10';x.fillRect(ax,180,130,24);x.fillStyle='#b8a878';x.font='bold 9px Arial';x.textAlign='left';x.textBaseline='alphabetic';x.fillText('VOLTHORN',ax+8,196);for(let q=0;q<6;q++){x.fillStyle='#2c2c2e';x.beginPath();x.arc(ax+70+q*9,192,3,0,7);x.fill();}x.fillStyle=Math.sin(t*3+ax)>0?'#ff3020':'#501008';x.beginPath();x.arc(ax+122,192,2,0,7);x.fill();}
  /* the deck */const fg=x.createLinearGradient(0,330,0,440);fg.addColorStop(0,'#141216');fg.addColorStop(1,'#0a090b');x.fillStyle=fg;x.fillRect(-200,330,1400,110);x.fillStyle='#1c1a1e';x.fillRect(380,300,240,32);x.fillStyle='#0a0a0c';x.fillRect(-200,428,1400,14);
  /* drummer + kit */nbbDrummer(x,500,252,32,st,P[1]);nbbKit(x,500,330,st,P[1]);
  /* floor monitors + set list */for(const mx of[360,640]){x.fillStyle='#0c0c0e';x.beginPath();x.moveTo(mx-40,428);x.lineTo(mx-30,404);x.lineTo(mx+30,404);x.lineTo(mx+40,428);x.closePath();x.fill();}x.fillStyle='#d8d4c8';x.save();x.translate(600,424);x.rotate(0.12);x.fillRect(-10,-3,20,6);x.restore();
  /* band */nbbRocker(x,285,400,44,Object.assign({inst:'gtr',gcol:'#7a0d10',hair:'#2a2016',hairLen:1.35,rim:P[0],stance:0.7,shirt:'#101014'},st.gtr));
  nbbRocker(x,715,400,44,Object.assign({inst:'bass',dir:-1,gcol:'#1a1a1c',hair:'#120e0c',hairLen:1.5,rim:P[1],stance:0.66},st.bass));
  /* mic stand + singer (the drum cam is behind him, so he isn't in that shot) */if(st.shot!=='drum'){x.strokeStyle='#18181a';x.lineWidth=4;x.beginPath();x.moveTo(470,428);x.lineTo(478,300);x.stroke();
  nbbRocker(x,500,410,48,Object.assign({mic:true,face:true,hair:'#16100e',hairLen:1.4,rim:P[0],stance:0.6,print:'#a02018'},st.sing));}
  if(st.wreck>=0)nbbWreck(x,st.wreck);
  /* lights: truss, beams (additive), floor pools, haze */x.fillStyle='#1a1a1c';x.fillRect(40,14,920,10);for(let i=0;i<8;i++){const lx=110+i*111;x.fillStyle='#0c0c0e';x.fillRect(lx-12,22,24,20);}
  x.save();x.globalCompositeOperation='lighter';const I=(1-dim)*(0.55+0.45*st.hit);
  for(let i=0;i<8;i++){const lx=110+i*111,col=P[i%2];const sw=Math.sin(t*(st.kind==='chorus'?2.4:1.1)+i*1.7)*(st.kind==='count'?40:150);const tx=lx+sw,w=70+(i%3)*14;const g=x.createLinearGradient(lx,40,tx,430);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');
    x.globalAlpha=I*0.58;x.fillStyle=g;x.beginPath();x.moveTo(lx-6,40);x.lineTo(lx+6,40);x.lineTo(tx+w,436);x.lineTo(tx-w,436);x.closePath();x.fill();x.globalAlpha=I*0.9;x.fillStyle=col;x.beginPath();x.arc(lx,40,6,0,7);x.fill();
    x.globalAlpha=I*0.18;const pg=x.createRadialGradient(tx,420,0,tx,420,w*1.2);pg.addColorStop(0,col);pg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=pg;x.fillRect(tx-w*1.2,380,w*2.4,80);}
  for(let i=0;i<3;i++){const hx=((t*14+i*380)%1300)-150,hy=200+i*70;const hg=x.createRadialGradient(hx,hy,0,hx,hy,260);hg.addColorStop(0,'rgba(120,120,150,0.09)');hg.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=1;x.fillStyle=hg;x.fillRect(hx-260,hy-260,520,520);}
  if(st.pyro>=0&&st.pyro<1.6){const a=st.pyro<0.15?st.pyro/0.15:Math.max(0,1-(st.pyro-0.15)/1.45);for(const px of[40,960]){for(let k=0;k<5;k++){const fh=(150+k*40)*a*(0.8+0.2*Math.sin(t*40+k));const fw=26-k*3;const g=x.createLinearGradient(0,430,0,430-fh);g.addColorStop(0,'#fff6c0');g.addColorStop(0.3,'#ffa020');g.addColorStop(1,'rgba(200,30,0,0)');x.globalAlpha=0.7;x.fillStyle=g;x.beginPath();x.moveTo(px-fw,430);x.quadraticCurveTo(px+Math.sin(t*30+k)*12,430-fh*0.6,px+Math.sin(t*23+k)*8,430-fh);x.quadraticCurveTo(px-Math.sin(t*27+k)*12,430-fh*0.6,px+fw,430);x.fill();}
    x.globalAlpha=a*0.25;const rg=x.createRadialGradient(px,330,0,px,330,380);rg.addColorStop(0,'#ff9020');rg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=rg;x.fillRect(px-380,0,760,560);
    x.globalAlpha=a;x.fillStyle='#ffd070';for(let k=0;k<14;k++){const sp=st.pyro*(200+nbbH(k)*260);x.fillRect(px+(nbbH(k*3)-0.5)*sp*0.8,430-sp*(0.6+nbbH(k*7)*0.6)+st.pyro*st.pyro*120,3,3);}}}
  x.restore();
  /* crowd (foreground): bobbing heads, fists and horns */const cb=st.music?Math.sin(st.beatPh*6.283):0;for(const p of NBB_CROWD){const bob=(st.music?(st.kind==='brk'?Math.abs(Math.sin(st.beatPh*3.1416+p.ph*0.1)):0.5+0.5*Math.sin(st.beatPh*6.283+p.ph*0.25))*10:Math.sin(t*1.3+p.ph)*2)*p.s;const hx=p.x,hy=p.y+bob,s=p.s;
    x.fillStyle='#050506';x.beginPath();x.ellipse(hx,hy+36*s,30*s,30*s,0,0,7);x.fill();x.beginPath();x.ellipse(hx,hy,14*s,16*s,0,0,7);x.fill();
    if(p.arm>0.35&&st.music){const ay=hy-38*s-(cb*0.5+0.5)*10*s;x.strokeStyle='#050506';x.lineWidth=7*s;x.beginPath();x.moveTo(hx+12*s,hy+20*s);x.lineTo(hx+20*s,ay);x.stroke();x.fillStyle='#050506';x.beginPath();x.arc(hx+20*s,ay,5*s,0,7);x.fill();if(p.horns){x.lineWidth=2.5*s;x.beginPath();x.moveTo(hx+17*s,ay);x.lineTo(hx+15*s,ay-10*s);x.moveTo(hx+23*s,ay);x.lineTo(hx+25*s,ay-10*s);x.stroke();}}
    x.strokeStyle=P[0];x.globalAlpha=0.35*(1-dim);x.lineWidth=1.5;x.beginPath();x.ellipse(hx,hy,14*s,16*s,0,3.4,6.0);x.stroke();x.globalAlpha=1;}
  if(st.surf>=0){const sx=-80+st.surf*1160,sy=468+Math.sin(st.surf*40)*6;x.save();x.translate(sx,sy);x.rotate(Math.sin(st.surf*20)*0.2);x.fillStyle='#08080a';x.beginPath();x.ellipse(0,0,50,13,0,0,7);x.fill();x.beginPath();x.arc(54,-4,11,0,7);x.fill();x.strokeStyle='#08080a';x.lineWidth=6;x.beginPath();x.moveTo(30,-6);x.lineTo(46,-34);x.moveTo(-30,0);x.lineTo(-58,-14);x.stroke();x.restore();}}
function nbbCrowdPOV(x,st){const t=st.t,P=NBB_PAL[st.kind]||NBB_PAL.verse,dim=st.dim;tvBG(x,854,480,'#08070c','#020203');
  x.save();x.globalCompositeOperation='lighter';const I=(1-dim)*(0.6+0.4*st.hit);for(let i=0;i<6;i++){const lx=60+i*150+Math.sin(t*1.3+i)*40;const col=P[i%2];const ex=427+(lx-427)*0.3;const g=x.createLinearGradient(lx,-20,ex,300);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=I*0.35;x.fillStyle=g;x.beginPath();x.moveTo(lx-10,-20);x.lineTo(lx+10,-20);x.lineTo(ex+90,330);x.lineTo(ex-90,330);x.closePath();x.fill();}x.restore();
  for(let row=0;row<6;row++){const n=10+row*3,yy=150+row*58,s=0.45+row*0.32;for(let i=0;i<n;i++){const h=nbbH(row*91+i*7.3);const px=(i+0.5)/n*900-23+(h-0.5)*30;const ph=st.beatPh*6.283+h*2.5;const jump=st.music?(st.kind==='brk'?Math.max(0,Math.sin(ph*0.5))*16:Math.max(0,Math.sin(ph))*9):0;const py=yy-jump*s;
    const lit=row>=2&&(1-dim)>0.2;const lk=lit?Math.min(1,(row-1)*0.24)*(0.75+0.25*st.hit):0;const sk=NBB_SKIN[Math.floor(h*97)%5],hc=NBB_HAIR[Math.floor(h*61)%5],tee=NBB_TEE[Math.floor(h*41)%4];
    x.fillStyle=nbbMix(tee,lk);x.beginPath();x.ellipse(px,py+40*s,28*s,24*s,0,0,7);x.fill();x.fillStyle=nbbMix(sk,lk);x.beginPath();x.ellipse(px,py,15*s,18*s,0,0,7);x.fill();
    if(lit){x.fillStyle='#120808';x.beginPath();x.ellipse(px,py+7*s,5*s,(st.music?4+3*Math.abs(Math.sin(ph)):2)*s,0,0,7);x.fill();x.fillStyle='rgba(0,0,0,0.5)';for(const k of[-1,1]){x.beginPath();x.arc(px+k*5*s,py-3*s,1.8*s,0,7);x.fill();}
      x.fillStyle=nbbMix(hc,lk*0.8);x.beginPath();x.ellipse(px,py-11*s,16*s,10*s,0,Math.PI,0);x.fill();if(h>0.5){x.fillRect(px-16*s,py-11*s,5*s,(18+h*14)*s);x.fillRect(px+11*s,py-11*s,5*s,(18+h*14)*s);}}
    if(h>0.4){const ay=py-46*s-jump*s*0.4;const sd=h>0.7?-1:1;x.strokeStyle=nbbMix(sk,lk*0.85);x.lineWidth=7*s;x.beginPath();x.moveTo(px+sd*14*s,py+22*s);x.lineTo(px+sd*20*s,ay);x.stroke();if(h>0.6){x.lineWidth=2.6*s;const hx=px+sd*20*s;x.beginPath();x.moveTo(hx-3*s,ay);x.lineTo(hx-5*s,ay-12*s);x.moveTo(hx+3*s,ay);x.lineTo(hx+5*s,ay-12*s);x.stroke();}}}}
  x.fillStyle='#2a2a2e';x.fillRect(0,440,854,12);x.fillStyle='#141416';x.fillRect(0,452,854,30);
  /* the singer's back, bottom-left, mic out to them */x.fillStyle='#060607';x.beginPath();x.ellipse(110,520,150,140,0,0,7);x.fill();x.beginPath();x.ellipse(120,340,44,52,0,0,7);x.fill();x.strokeStyle='#0a0808';x.lineWidth=14;for(let j=0;j<7;j++){x.beginPath();x.moveTo(90+j*10,320);x.quadraticCurveTo(84+j*12,400,80+j*14,460);x.stroke();}
  x.strokeStyle='#060607';x.lineWidth=26;x.lineCap='round';x.beginPath();x.moveTo(200,420);x.lineTo(300,330);x.lineTo(380,300);x.stroke();x.fillStyle='#2a2a2e';x.beginPath();x.arc(392,296,11,0,7);x.fill();
  x.strokeStyle=P[0];x.globalAlpha=0.5*(1-dim);x.lineWidth=3;x.beginPath();x.ellipse(120,340,44,52,0,-1.3,0.6);x.stroke();x.globalAlpha=1;
  if(st.surf>=0){const sx=900-st.surf*1000,sy=160+Math.sin(st.surf*30)*8;x.save();x.translate(sx,sy);x.fillStyle='#4a3028';x.beginPath();x.ellipse(0,0,60,16,0.1,0,7);x.fill();x.beginPath();x.arc(-64,-6,14,0,7);x.fill();x.restore();}}
const NBB_SKIN=[[150,108,84],[108,74,58],[186,138,106],[74,50,40],[200,150,124]],NBB_HAIR=[[26,18,16],[58,36,24],[110,82,48],[16,16,16],[120,30,30]],NBB_TEE=[[20,20,22],[34,30,30],[60,20,20],[28,28,40]];
function nbbMix(c,k){const f=0.12+0.88*k;return`rgb(${Math.round(c[0]*f)},${Math.round(c[1]*f)},${Math.round(c[2]*f)})`;}
const NBB_SHOT={wide:{x:500,y:285,z:1},wide2:{x:470,y:300,z:1.18,r:-0.03},sing:{x:500,y:300,z:2.1},singc:{x:500,y:262,z:3.3,r:0.02},gtr:{x:300,y:302,z:2.0,r:0.03},bass:{x:700,y:302,z:2.0,r:-0.03},feet:{x:300,y:372,z:2.3,r:0.04},drum:{x:500,y:250,z:2.5},neck:{x:250,y:305,z:4.2,r:-0.42},low:{x:330,y:300,z:1.55,r:-0.1}};
function nbbCam(x,sh,t,since,hit,fn){const c=NBB_SHOT[sh]||NBB_SHOT.wide;const push=1+Math.min(1,since/5)*0.05;const jx=Math.sin(t*1.3)*3+Math.sin(t*3.7)*1.6+hit*Math.sin(t*61)*2.2,jy=Math.sin(t*1.7)*2.2+Math.cos(t*4.3)*1.2+hit*Math.cos(t*53)*2.2;
  x.save();x.translate(427,240);x.rotate((c.r||0)+Math.sin(t*0.9)*0.006);x.scale(c.z*push,c.z*push);x.translate(-c.x-jx/c.z,-c.y-jy/c.z);fn();x.restore();}
/* overlays */
function nbbBug(x){x.fillStyle='rgba(0,0,0,0.55)';x.fillRect(722,18,112,40);nbbType(x,'9',744,38,30,{out:'#000',fill:'#ff2a1a'});tvText(x,'METAL',798,30,11,'#fff',{f:'Impact,"Arial Black",sans-serif'});tvText(x,'OVERNIGHT',798,46,10,'#ddd',{f:'Arial'});}
function nbbLive(x,t){if(Math.floor(t*1.6)%2){x.fillStyle='#ff2a1a';x.beginPath();x.arc(36,36,6,0,7);x.fill();}tvText(x,'LIVE',62,37,13,'#fff',{a:'left',f:'Impact,"Arial Black",sans-serif'});}
function nbbLower(x,a,l1,l2){if(a<=0)return;x.save();x.globalAlpha=clamp(a,0,1);const w=430;x.fillStyle='rgba(0,0,0,0.78)';x.fillRect(32,368,w,64);x.fillStyle='#b01010';x.fillRect(32,368,6,64);nbbType(x,l1,32+w/2,390,26,{out:'#000',fill:'#e8e0d0'});tvText(x,l2,32+w/2,418,13,'#d0c8b8',{f:'Arial',w:'bold',ls:1});x.restore();}
function nbbScan(x,a){x.fillStyle=`rgba(0,0,0,${a||0.12})`;for(let y=0;y<480;y+=3)x.fillRect(0,y,854,1);const v=x.createRadialGradient(427,240,200,427,240,520);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,0.55)');x.fillStyle=v;x.fillRect(0,0,854,480);}
function nbbFlash(x,a,col){if(a<=0.01)return;x.save();x.globalCompositeOperation='lighter';x.globalAlpha=clamp(a,0,1);x.fillStyle=col||'#fff';x.fillRect(0,0,854,480);x.restore();}

/* ---------- song state → the picture */
const nbbBangOf=ph=>{const c=0.5+0.5*Math.cos(ph*6.283);return{bang:-0.35+1.35*Math.pow(c,1.4),flare:Math.abs(Math.sin(ph*6.283))};};
function nbbState(sg,t){const r=(t-sg.t0)/sg.bar;const bi=Math.floor(r);const b=sg.bars[clamp(bi,0,sg.bars.length-1)];const ph=r-bi;const inSong=bi>=0&&bi<sg.bars.length;const k=inSong?b.k:(bi<0?'count':'end');
  const beat=ph*4,bt=beat%1,six=Math.floor(ph*16);const music=inSong&&k!=='count'&&!(k==='end'&&b.i===1&&ph>0.4);const half=k==='brk';const bp=half?((beat/2)%1):bt;const hit=music?Math.exp(-bt*5):0;
  const st={t,kind:k,bi,ph,beatPh:bp,hit,music,wreck:-1,dim:k==='count'?0.65:(k==='fill'?0.3:0),pyro:-1,surf:-1,kick:music?Math.exp(-((ph*16)%1)*6)*(k==='intro'||k==='solo'?1:0.6):0,cym:0};
  const R=sg.riff;let note='e';if(inSong&&music){const str=k==='chorus'?(b.i%2?R.C2:R.C1):k==='brk'?R.K:(b.i%2?R.B:R.A);if(str){for(let i=six;i>=0;i--){const ch=str[i]||'.';if(ch!=='.'&&ch!=='-'){note=ch.toLowerCase();break;}}}}
  const fr=0.32+((NBB_NT[note]||82)-82)/70*0.55;const strum=music?Math.sin(ph*16*Math.PI):0;
  const B1=nbbBangOf(bp),B2=nbbBangOf((bp+0.08)%1),B3=nbbBangOf((bp+0.16)%1);
  const still={bang:-0.05+Math.sin(t*1.4)*0.05,flare:0};
  let g=music?B1:still,bs=music?B2:still;if(k==='chorus'){g={bang:-0.3+B1.bang*0.25,flare:0.2};bs={bang:-0.3+B2.bang*0.25,flare:0.2};}
  st.gtr={bang:g.bang,flare:g.flare,bob:music?Math.cos(bp*6.283)*0.5+0.5:0,fret:k==='solo'?0.72+0.12*Math.sin(t*9):fr,strum,wail:k==='solo'&&b.i%4===3&&ph>0.5};
  st.bass={bang:bs.bang,flare:bs.flare,bob:music?Math.cos(bp*6.283+0.5)*0.5+0.5:0,fret:fr*0.9,strum:music?Math.sin(ph*8*Math.PI):0};
  const v=sg.vox[bi]||(sg.vox[bi-1]&&sg.vox[bi-1].len>1?sg.vox[bi-1]:null);const singing=!!(v&&inSong&&(sg.vox[bi]?ph<0.92*v.len:ph<0.86));
  if(singing){st.sing={bang:-0.18+Math.sin(t*3)*0.05,flare:0.05,scream:0.55+0.45*Math.abs(Math.sin(t*13)),fist:v.gang?2.2:1.2+Math.sin(t*6)*0.4,horns:!!v.gang,bob:0.3};}
  else{const B=music?B3:still;st.sing={bang:B.bang,flare:B.flare,scream:0,fist:music?0.5+0.6*(0.5+0.5*Math.cos(bp*6.283)):0.2,bob:music?0.5+0.5*Math.cos(bp*6.283):0,horns:music};}
  const d2=nbbBangOf((bp+0.04)%1);st.bang2=music?d2.bang:0;st.flare2=music?d2.flare:0;st.lh=music?(half?ph*2:ph*8)%1:0;st.rh=music?(ph*(k==='verse'?8:16))%1:0;
  if(inSong){if(k==='chorus'&&b.i<2)st.pyro=(b.i+ph)*sg.bar;if(k==='end'&&b.i===0)st.pyro=bt*sg.beat;if(k==='solo')st.surf=clamp((b.i+ph)/8,0,1);if(k==='intro'&&b.i===0&&ph<0.25)st.pyro=ph*sg.bar;
    const cr=(k==='chorus')?bt*sg.beat:((b.i%4===0&&k!=='count')?ph*sg.bar:9);st.cym=Math.exp(-cr*3);}
  if(k==='brk'&&music)st.strobe=((six%2)===0)?0.32:0;if(k==='end'&&b.i===0&&music)st.strobe=Math.exp(-bt*7)*0.5;
  let shot='wide',sAt=0;for(const [a,s] of sg.shots)if(a<=bi){shot=s;sAt=a;}st.shot=shot;st.since=(bi-sAt+ph)*sg.bar;return st;}
function nbbDraw(x,st){if(st.shot==='crowd')nbbCrowdPOV(x,st);else nbbCam(x,st.shot,st.t,st.since,st.hit,()=>nbbWorld(x,st));nbbFlash(x,st.strobe||0);}
function nbbSongSeg(sg){return{id:sg.id,dur:sg.dur,draw(x,W,H,t){const st=nbbState(sg,t);nbbDraw(x,st);nbbScan(x,0.1);nbbLive(x,t);nbbBug(x);const a=sst(sg.t0+sg.bar,sg.t0+sg.bar*1.6,t)*(1-sst(sg.t0+sg.bar*6,sg.t0+sg.bar*6.6,t));nbbLower(x,a,'NO BOND BACK',sg.title+' · LIVE AT THE RATHOLE');},cues:nbbCues(sg)};}
const NBB_SEG1=nbbSongSeg(NBB_S1),NBB_SEG2=nbbSongSeg(NBB_S2);

/* ---------- the bits around the songs: the open, the banter, the end */
function nbbFree(t,kind,o){/* a stage state for the segments with no song running */const st={t,kind,bi:0,ph:0,beatPh:(t*0.9)%1,hit:0,music:false,wreck:o.wreck===undefined?-1:o.wreck,dim:o.dim===undefined?0.2:o.dim,pyro:o.pyro===undefined?-1:o.pyro,surf:-1,kick:0,cym:o.cym||0,shot:o.shot||'wide',since:o.since||t,bang2:0,flare2:0,lh:0,rh:0};
  const still={bang:-0.08+Math.sin(t*1.3)*0.05,flare:0,bob:0};st.gtr=Object.assign({},still,o.gtr||{});st.bass=Object.assign({},still,o.bass||{});st.sing=Object.assign({},still,{fist:0.3},o.sing||{});return st;}
function nbbIdent(x,t){x.fillStyle='#050405';x.fillRect(0,0,854,480);const sl=sst(0.18,0.3,t);const sh=t>0.25&&t<0.9?(1-(t-0.25)/0.65)*10:0;x.save();x.translate(427+Math.sin(t*70)*sh,226+Math.cos(t*63)*sh);x.scale(0.4+sl*0.6,0.4+sl*0.6);
  x.strokeStyle='#5a0e0a';x.lineWidth=3;x.globalAlpha=sl;for(let i=0;i<9;i++){const a=i/9*6.283+0.3;x.beginPath();x.moveTo(0,0);for(let k=1;k<6;k++)x.lineTo(Math.cos(a+Math.sin(k*3+i)*0.3)*k*70,Math.sin(a+Math.sin(k*3+i)*0.3)*k*44);x.stroke();}x.globalAlpha=1;
  nbbLogoMark(x,0,-70,0.8,'#2c2426','#6a0c0c');nbbType(x,'METAL',0,40,96,{spikes:true,out:'#e8e0d0',fill:'#8a0c0c',glow:0.25+0.25*Math.sin(t*9)});nbbType(x,'OVERNIGHT',0,118,52,{out:'#000',fill:'#e8e0d0'});x.restore();
  if(t>1.2)tvText(x,'CH 9 · ALL NIGHT · TOO LOUD FOR YOUR NEIGHBOURS',427,420,15,'#bbb',{f:'"Courier New",monospace',ls:2});nbbFlash(x,t>0.25?Math.exp(-(t-0.25)*7):0);nbbScan(x,0.14);}
const NBB_OPEN={id:'nbb_open',dur:10,draw(x,W,H,t){if(t<3.6){nbbIdent(x,t);return;}const k=t-3.6;const flick=t>9.1?(Math.floor(t*14)%2?0.1:0.85):0.82;const st=nbbFree(t,'dark',{dim:flick,since:k,shot:k<3.2?'wide':'crowd',sing:{fist:t>8?2.2:0.4,horns:t>8,face:true}});nbbDraw(x,st);nbbScan(x,0.12);nbbLive(x,t);nbbBug(x);
    nbbLower(x,sst(4.2,4.7,t)*(1-sst(8.6,9,t)),'NO BOND BACK','LIVE AT THE RATHOLE · ONE NIGHT ONLY · EVERY NIGHT');},
  cues:[{t:0.25,snd:true,fn(){const o=TVA.out();if(!o)return;nbbGtr(0,82.41,2.4,o,true,1.1);nbbCrash(0,o,1.4);nbbKick(0,o);nbbFeedback(0.6,o,1760,2.2,0.07);TVA.noise({dur:1.2,gain:0.3,type:'lowpass',f:300,f1:900,delay:0},o);}},
    {t:1.25,snd:true,fn(){const o=TVA.out();if(o)nbbGrowl(0,4,1.6,o,{f:88,hold:true,seed:2});}},{t:1.26,fn(){tvSay('','[A DISTORTED GROWL] METAL… OVERNIGHT',1.8);}},
    ...[3.7,4.6,5.5,6.4,7.3,8.2,9.1].map(tt=>({t:tt,snd:true,fn(){const o=TVA.out();if(o)nbbCrowd(0,o,1.4,0.07);}})),
    ...[4.3,5.9,7.5].map((tt,i)=>({t:tt,snd:true,fn(){const o=TVA.out();if(!o)return;nbbGang(0,3,0.9,o,i===2);for(let q=0;q<3;q++)IN.clap(1.0+q*0.24,o,0.12);nbbTom(0,o,110);nbbTom(0.3,o,110);nbbTom(0.6,o,90);}})),
    {t:4.31,fn(){tvSay('CROWD','NO! BOND! BACK!',1.5);}},{t:5.91,fn(){tvSay('CROWD','NO! BOND! BACK!',1.5);}},{t:7.51,fn(){tvSay('CROWD','NO! BOND! BAAACK!',1.5);}},
    {t:8.6,fn(){tvSay('SINGER','Good evening, Rathole!',1.4,'tvm',{pitch:0.45,rate:1.05});}},{t:8.65,snd:true,fn(){const o=TVA.out();if(o)nbbCheer(0.3,o,5,0.05);}}]};
const NBB_TALK={id:'nbb_talk',dur:11,draw(x,W,H,t){const shot=t<4?'wide2':t<7.2?'singc':t<9.6?'crowd':'wide';const st=nbbFree(t,'talk',{dim:0.35,since:t,shot,sing:{face:true,scream:t>7.4&&t<9.4?0.8:Math.abs(Math.sin(t*9))*0.3,fist:t>7.4?2.3:0.4,horns:t>7.4},gtr:{fret:0.6+0.1*Math.sin(t*5),strum:Math.sin(t*12)*0.3},bass:{bang:0.2}});nbbDraw(x,st);nbbScan(x,0.12);nbbLive(x,t);nbbBug(x);},
  cues:[{t:0.3,snd:true,fn(){const o=TVA.out();if(!o)return;nbbCheer(0,o,7,0.05);nbbCrowd(0,o,3,0.08);for(const [d,f] of[[0.6,659.3],[0.9,587.3],[1.2,523.3],[1.8,493.9],[2.4,440]])nbbLead(d,f,0.28,o,1);}},
    {t:0.7,fn(){tvSay('SINGER',"Thank you! We are No Bond Back!",2.6,'tvm',{pitch:0.45,rate:1.05});}},
    {t:3.6,snd:true,fn(){const o=TVA.out();if(o)nbbCrowd(0,o,3,0.05);}},{t:4.0,fn(){tvSay('SINGER','This next one goes out to every landlord in the building.',3,'tvm',{pitch:0.45,rate:1.05});}},
    {t:6.4,snd:true,fn(){const o=TVA.out();if(o){nbbBoo(0,o,7);nbbCrowd(0,o,1.8,0.06);}}},{t:6.45,fn(){tvSay('CROWD','[BOOOOO]',1.2);}},
    {t:7.6,fn(){tvSay('SINGER',"It's called… SKIRTING BOARD MASSACRE!",2.2,'tvm',{pitch:0.45,rate:1.0});}},{t:9.4,snd:true,fn(){const o=TVA.out();if(!o)return;nbbCheer(0,o,8,0.06);nbbCrowd(0,o,1.6,0.09);nbbFeedback(0,o,987.8,1.5,0.06);}}]};
function nbbWreck(x,k){/* at the guitarist's feet: the neck snaps off, the body skids, bits and sparks (world units) */const a=Math.min(1,k*3);x.save();x.translate(300,424);x.scale(0.5,0.5);x.fillStyle='#7a0d10';x.save();x.translate(-60-a*40,-10);x.rotate(0.3+a*0.4);x.beginPath();x.moveTo(30,-10);x.lineTo(-60,-46);x.lineTo(-44,-4);x.lineTo(-70,36);x.lineTo(30,10);x.closePath();x.fill();x.restore();
  x.fillStyle='#1c130c';x.save();x.translate(90+a*60,-6);x.rotate(-0.2-a*0.5);x.fillRect(0,-5,150,10);x.restore();x.fillStyle='#ffd070';for(let i=0;i<20;i++){const s=k*(160+nbbH(i)*240);x.fillRect((nbbH(i*3)-0.5)*s*1.4,-s*(0.3+nbbH(i*5)*0.6)+k*k*300,3,3);}x.fillStyle='#3a2a20';for(let i=0;i<8;i++){const s=k*(80+nbbH(i*9)*120);x.fillRect((nbbH(i*11)-0.5)*s*2,-s*0.4+k*k*260,8,5);}x.restore();}
const NBB_END={id:'nbb_end',dur:13,draw(x,W,H,t){if(t<7){const raise=t<1.6?0:t<2.5?sst(1.6,2.4,t)*0.7:0.7+sst(2.5,2.72,t)*0.85;const smashed=t>2.75;const st=nbbFree(t,'end',{dim:t<0.5?0:0.12,since:t,shot:t<1.6?'wide':t<2.72?'wide2':t<4.4?'feet':'crowd',pyro:t>2.7&&t<4.3?t-2.7:-1,cym:Math.exp(-t*2),wreck:t>2.72?t-2.72:-1,
      gtr:smashed?{inst:null,bang:0.5,flare:0.6}:{raise,bang:0.1},sing:{face:true,fist:2.3,horns:true,scream:t<2?0.8:0.2}});nbbDraw(x,st);nbbFlash(x,t>2.72?Math.exp(-(t-2.72)*8)*0.7:0);nbbScan(x,0.12);nbbLive(x,t);nbbBug(x);return;}
    const k=t-7;x.fillStyle='#050405';x.fillRect(0,0,854,480);nbbLogoMark(x,427,150,0.75,'#2c2426','#5a0c0c');nbbType(x,'NO BOND BACK',427,260,58,{spikes:true,out:'#d8d0c0',fill:'#6a0a0a'});
    tvText(x,'LIVE AT THE RATHOLE',427,322,18,'#ccc',{f:'"Courier New",monospace',ls:3});if(k>1.4)tvText(x,'THE SAME GIG AGAIN IN A MOMENT.',427,382,16,'#999',{f:'"Courier New",monospace',ls:2});if(k>2.6)tvText(x,"IT'S ALWAYS THE SAME GIG.",427,410,16,'#999',{f:'"Courier New",monospace',ls:2});nbbBug(x);nbbScan(x,0.14);},
  cues:[{t:0.1,snd:true,fn(){const o=TVA.out();if(!o)return;nbbFeedback(0,o,1318.5,2.6,0.09);nbbCrowd(0,o,3,0.09);nbbCheer(0.2,o,8,0.06);}},{t:0.6,fn(){tvSay('SINGER',"Goodnight! Don't pay your rent!",2.2,'tvm',{pitch:0.45,rate:1.05});}},
    {t:2.72,snd:true,fn(){const o=TVA.out();if(!o)return;nbbGtr(0,82.41,1.8,o,true,1.2);nbbGtr(0.02,61.7,1.4,o,true,0.8);TVA.noise({dur:0.35,gain:0.5,type:'lowpass',f:1600,delay:0},o);TVA.noise({dur:0.9,gain:0.25,type:'bandpass',f:2400,q:0.8,delay:0.02},o);nbbCrash(0,o,1.3);nbbKick(0,o);TVA.noise({dur:1.2,gain:0.3,type:'lowpass',f:400,f1:1400,delay:0},o);}},
    {t:2.74,fn(){tvSay('','[THE GUITAR MEETS THE STAGE. THE STAGE WINS.]',2);}},{t:3.2,snd:true,fn(){const o=TVA.out();if(!o)return;nbbCheer(0,o,9,0.07);nbbCrowd(0,o,3.5,0.1);}},
    {t:5.5,snd:true,fn(){const o=TVA.out();if(o)nbbCrowd(0,o,2.5,0.05);}},{t:7.2,snd:true,fn(){const o=TVA.out();if(!o)return;nbbGtr(0,82.41,4,o,true,0.6);nbbFeedback(0.4,o,1760,4,0.04);}},
    {t:8.6,fn(){tvSay('CH 9',"The same gig again in a moment. It's always the same gig.",3.4,'tv');}}]};
for(const s of[NBB_OPEN,NBB_SEG1,NBB_TALK,NBB_SEG2,NBB_END])tvReelAdd(s,NBB_REEL);
