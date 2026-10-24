
/* ============================================================ p8c — EXECUTIONER: audio through the monitor's speakers, the script,
   the people's behaviour, endings, the boot / title / end screens and the HAPPY HAPPY PLAY PLACE ad.
   Audio is procedural Web Audio. Voice lines show as captions; the loudspeaker and the ad voiceover use the
   browser's speech synth while you're sat at the desk. Optional real recordings: drop
   audio/executioner/manifest.json ({"key":"file.mp3",…}) beside index.html on Vercel and those keys play instead. */
const EXA={ready:false,c:null,in:null,bus:null,tracks:[],humG:null,
  init(){if(this.ready||!S.ctx)return;const c=S.ctx;this.c=c;this.bus=c.createGain();this.bus.gain.value=0;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=140;const pk=c.createBiquadFilter();pk.type='peaking';pk.frequency.value=2500;pk.Q.value=0.8;pk.gain.value=4;
    const ws=c.createWaveShaper();const n=1024,cur=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cur[i]=Math.tanh(x*1.7)/Math.tanh(1.7);}ws.curve=cur;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7800;
    this.bus.connect(hp);hp.connect(pk);pk.connect(ws);ws.connect(lp);lp.connect(S.master);this.in=c.createGain();this.in.gain.value=0.85;this.in.connect(this.bus);this.ready=true;},
  get t(){return this.c.currentTime;},
  level(g){if(this.ready)this.bus.gain.setTargetAtTime(g,this.t,0.07);},
  track(){if(!this.ready)return null;const g=this.c.createGain();g.connect(this.in);this.tracks.push(g);return g;},
  stopAll(){if(!this.ready)return;for(const g of this.tracks){try{g.gain.cancelScheduledValues(0);g.gain.setValueAtTime(0,this.t);g.disconnect();}catch(e){}}this.tracks.length=0;this.humStop();},
  env(g,peak,att,dur,t0){g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002),t0+att);g.gain.exponentialRampToValueAtTime(0.0001,t0+att+dur);},
  tone(o,dst){if(!this.ready)return;const {f=440,f1=null,dur=0.3,type='sine',gain=0.3,att=0.004,delay=0}=o;const c=this.c,t0=this.t+delay;const os=c.createOscillator();os.type=type;os.frequency.setValueAtTime(f,t0);if(f1!==null)os.frequency.exponentialRampToValueAtTime(Math.max(10,f1),t0+dur);const g=c.createGain();this.env(g,gain,att,dur,t0);os.connect(g);g.connect(dst||this.in);os.start(t0);os.stop(t0+att+dur+0.05);},
  noise(o,dst){if(!this.ready)return;const {dur=0.2,gain=0.3,type='lowpass',f=1000,f1=null,q=1,att=0.003,delay=0}=o;const c=this.c,t0=this.t+delay;const s=c.createBufferSource();s.buffer=S.noiseBuf;s.loop=true;s.playbackRate.value=0.7+Math.random()*0.6;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t0);if(f1!==null)fl.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);fl.Q.value=q;const g=c.createGain();this.env(g,gain,att,dur,t0);s.connect(fl);fl.connect(g);g.connect(dst||this.in);s.start(t0,Math.random()*1.5);s.stop(t0+att+dur+0.05);},
  shot(){this.noise({dur:0.06,gain:0.9,type:'highpass',f:2500});this.noise({dur:0.22,gain:1.0,type:'lowpass',f:3600,f1:500});this.tone({f:120,f1:36,dur:0.26,gain:0.9});this.noise({dur:1.1,gain:0.16,type:'lowpass',f:1400,f1:180,delay:0.03});this.noise({dur:0.03,gain:0.25,type:'bandpass',f:5200,q:3,delay:0.05});},
  dry(){this.noise({dur:0.02,gain:0.4,type:'bandpass',f:3000,q:4});this.tone({f:1800,dur:0.03,type:'square',gain:0.08});},
  clack(d=0){this.noise({dur:0.03,gain:0.45,type:'bandpass',f:2200,q:3,delay:d});this.tone({f:900,f1:600,dur:0.04,type:'square',gain:0.06,delay:d});},
  reload(){this.clack(0.15);this.noise({dur:0.08,gain:0.25,type:'bandpass',f:900,q:2,delay:0.2});this.clack(0.75);this.clack(1.12);this.clack(1.2);},
  casing(){for(let i=0;i<3;i++)this.tone({f:4200+Math.random()*1800,dur:0.05,type:'triangle',gain:0.06,delay:0.35+i*0.09+Math.random()*0.05});},
  ric(){this.tone({f:3400,f1:900,dur:0.28,type:'sine',gain:0.12});this.noise({dur:0.05,gain:0.35,type:'bandpass',f:1800,q:2});},
  chip(){this.noise({dur:0.05,gain:0.4,type:'bandpass',f:1500,q:1.5});this.noise({dur:0.18,gain:0.15,type:'lowpass',f:700,f1:200,delay:0.02});},
  flesh(){this.noise({dur:0.12,gain:0.6,type:'lowpass',f:520,f1:160});this.tone({f:95,f1:50,dur:0.14,gain:0.5});this.noise({dur:0.2,gain:0.18,type:'bandpass',f:900,q:1.2,delay:0.04});},
  wet(k=1){this.noise({dur:0.3*k,gain:0.45,type:'lowpass',f:700,f1:150});this.noise({dur:0.08,gain:0.3,type:'bandpass',f:1300,q:2,delay:0.05});this.tone({f:70,f1:40,dur:0.25,gain:0.4});},
  glassTick(){this.tone({f:2600,f1:2200,dur:0.12,type:'triangle',gain:0.2});this.noise({dur:0.06,gain:0.4,type:'highpass',f:3500});this.tone({f:180,f1:120,dur:0.12,gain:0.3});},
  glassBreak(){this.noise({dur:0.9,gain:0.7,type:'highpass',f:3000});this.noise({dur:0.3,gain:0.6,type:'lowpass',f:900});for(let i=0;i<14;i++)this.tone({f:2000+Math.random()*5000,dur:0.1+Math.random()*0.35,type:'triangle',gain:0.07,delay:Math.random()*0.7});},
  tap(){this.tone({f:1450,f1:1150,dur:0.05,type:'triangle',gain:0.12});this.noise({dur:0.02,gain:0.15,type:'bandpass',f:2400,q:3});},
  squelch(){this.noise({dur:0.07,gain:0.3,type:'bandpass',f:1900,q:2});this.tone({f:1150,dur:0.04,type:'square',gain:0.04});},
  feedback(){this.tone({f:2900,f1:3400,dur:1.1,type:'sine',gain:0.12});this.noise({dur:0.15,gain:0.4,type:'bandpass',f:1500,q:3,delay:1.0});},
  rattle(){for(let i=0;i<4;i++)this.noise({dur:0.05,gain:0.25,type:'bandpass',f:500+Math.random()*300,q:2,delay:i*0.09});},
  voice(o){if(!this.ready)return;const {f0=200,f1=f0,f2=f1,dur=0.5,vib=0.03,form=[[800,5,3],[1200,6,2],[2700,7,1]],breath=0.3,gain=0.4,delay=0}=o;const c=this.c,t0=this.t+delay;
    const os=c.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(f0,t0);os.frequency.linearRampToValueAtTime(f1,t0+dur*0.25);os.frequency.linearRampToValueAtTime(f2,t0+dur);
    const lfo=c.createOscillator();lfo.frequency.value=5+Math.random()*3;const lg=c.createGain();lg.gain.value=f1*vib;lfo.connect(lg);lg.connect(os.frequency);const j=c.createOscillator();j.type='square';j.frequency.value=23+Math.random()*9;const jg=c.createGain();jg.gain.value=f1*vib*0.4;j.connect(jg);jg.connect(os.frequency);
    const env=c.createGain();env.gain.setValueAtTime(0.0001,t0);env.gain.exponentialRampToValueAtTime(gain,t0+Math.min(0.06,dur*0.2));env.gain.setValueAtTime(gain,t0+dur*0.7);env.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    for(const [f,q,g] of form){const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;const gg=c.createGain();gg.gain.value=g;os.connect(bp);bp.connect(gg);gg.connect(env);}
    if(breath>0){const n=c.createBufferSource();n.buffer=S.noiseBuf;n.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=form[1][0];bp.Q.value=1.4;const bg=c.createGain();bg.gain.value=breath;n.connect(bp);bp.connect(bg);bg.connect(env);n.start(t0,Math.random());n.stop(t0+dur+0.05);}
    env.connect(this.in);os.start(t0);os.stop(t0+dur+0.05);lfo.start(t0);lfo.stop(t0+dur+0.05);j.start(t0);j.stop(t0+dur+0.05);},
  scream(v,kind){const F=v==='f'?{m:2.0,form:[[950,5,3],[1400,6,2.2],[3100,7,1.2]]}:v==='low'?{m:0.85,form:[[700,5,3],[1100,6,2],[2500,7,1]]}:{m:1,form:[[780,5,3],[1180,6,2],[2700,7,1.2]]};const m=F.m;
    if(kind==='long')this.voice({f0:250*m,f1:440*m,f2:300*m,dur:1.3+Math.random()*0.8,vib:0.05,form:F.form,breath:0.6,gain:0.55});
    else if(kind==='hit'){this.voice({f0:300*m,f1:390*m,f2:260*m,dur:0.55+Math.random()*0.3,vib:0.06,form:F.form,breath:0.7,gain:0.5});}
    else if(kind==='moan')this.voice({f0:150*m,f1:138*m,f2:105*m,dur:1.2+Math.random()*0.6,vib:0.03,form:[[520,5,3],[860,6,2],[2500,6,0.8]],breath:0.45,gain:0.38});
    else if(kind==='panic'){for(let i=0;i<2;i++)this.voice({f0:300*m,f1:470*m,f2:380*m,dur:0.7+Math.random()*0.4,vib:0.07,form:F.form,breath:0.6,gain:0.45,delay:i*0.85});}
    else if(kind==='sob'){for(let i=0;i<4;i++)this.voice({f0:220*m,f1:250*m,f2:180*m,dur:0.16+Math.random()*0.08,vib:0.08,form:[[600,4,3],[1000,5,2],[2400,6,1]],breath:1.0,gain:0.3,delay:i*0.28});}
    else if(kind==='gurgle')this.voice({f0:90*m,f1:75*m,f2:52*m,dur:1.3,vib:0.14,form:[[420,3,3],[900,4,1.6],[2200,5,0.6]],breath:1.5,gain:0.34});},
  babble(f0,n,kind){/* mumbled syllables under a caption */const vs=[[[700,5,3],[1150,6,2]],[[400,5,3],[2000,6,1.6]],[[500,5,3],[900,6,2]],[[300,5,3],[2300,6,1.5]]];let d=0;const k=Math.min(18,Math.max(3,Math.round(n/3.2)));for(let i=0;i<k;i++){const v=vs[(Math.random()*4)|0];const dur=0.09+Math.random()*0.12;this.voice({f0:f0*(0.92+Math.random()*0.16),f1:f0*(0.9+Math.random()*0.15),dur,vib:0.02,form:[...v,[2600,7,0.6]],breath:kind==='pa'?0.5:0.3,gain:kind==='low'?0.22:0.28,delay:d});d+=dur+0.025+(Math.random()<0.15?0.12:0);}},
  humStart(){if(!this.ready||this.humG)return;const c=this.c;const g=c.createGain();g.gain.value=0.035;g.connect(this.in);const o=c.createOscillator();o.type='sawtooth';o.frequency.value=100;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380;o.connect(f);f.connect(g);o.start();const o2=c.createOscillator();o2.type='sine';o2.frequency.value=50;const g2=c.createGain();g2.gain.value=0.6;o2.connect(g2);g2.connect(g);o2.start();this.humG={g,o,o2};},
  humStop(){if(!this.humG)return;try{this.humG.o.stop();this.humG.o2.stop();this.humG.g.disconnect();}catch(e){}this.humG=null;},
  klaxon(dur){const tr=this.track();for(let t=0;t<dur;t+=0.5){this.tone({f:440,dur:0.24,type:'square',gain:0.12,delay:t},tr);this.tone({f:330,dur:0.24,type:'square',gain:0.12,delay:t+0.25},tr);}},
  sting(){const tr=this.track();const ch=[65.4,98,130.8,155.6];for(const f of ch){this.tone({f,dur:2.4,type:'sawtooth',gain:0.09,att:0.02},tr);this.tone({f:f*1.005,dur:2.4,type:'sawtooth',gain:0.06,att:0.02},tr);}this.tone({f:72,f1:52,dur:1.4,gain:0.5},tr);this.noise({dur:0.6,gain:0.35,type:'lowpass',f:300},tr);
    for(const [d,f] of[[1.6,130.8],[1.9,123.5],[2.2,116.5]])this.tone({f,dur:0.9,type:'square',gain:0.05,delay:d},tr);this.tone({f:58,f1:46,dur:1.6,gain:0.4,delay:2.5},tr);},
  jingle(dur){const tr=this.track();const bpm=118,b=60/bpm;const F=349.2,C=261.6,Dm=293.7,Bb=233.1;const chords=[[F,F*1.26,F*1.5],[C,C*1.26,C*1.5],[Dm,Dm*1.19,Dm*1.5],[Bb,Bb*1.26,Bb*1.5]];const roots=[F/2,C/2,Dm/2,Bb/2];
    const mel=[0,2,4,4,5,4,2,0,2,4,7,7,5,4,2,2,0,2,4,4,5,4,2,0,4,2,1,2,0,-1,0,0];const sc=[349.2,392,440,466.2,523.3,587.3,659.3,698.5,784];
    for(let i=0;i*b<dur-0.6;i++){const bar=Math.floor(i/4)%4,ch=chords[bar];const t=i*b;for(let k=0;k<3;k++)this.tone({f:ch[k],dur:0.32,type:'triangle',gain:0.07,delay:t+k*0.012},tr);if(i%2===0)this.tone({f:roots[bar],dur:0.4,type:'sine',gain:0.2,delay:t},tr);if(i%2===1)this.noise({dur:0.05,gain:0.18,type:'bandpass',f:1600,q:1,delay:t},tr);
      const m=mel[i%mel.length];this.tone({f:sc[clamp(m,0,8)]*2,dur:0.5,type:'sine',gain:0.09,delay:t+0.01},tr);}
    for(const [d,f] of[[dur-2.4,698.5],[dur-2.1,880],[dur-1.8,1046.5]])this.tone({f,dur:1.2,type:'sine',gain:0.12,delay:d},tr);}};
const EXT={tried:false,base:null,manifest:null,bufs:{},
  init(){if(this.tried)return;this.tried=true;try{if(!/^https?:$/.test(location.protocol))return;this.base=new URL('audio/executioner/',location.href);fetch(new URL('manifest.json',this.base)).then(r=>r.ok?r.json():null).then(m=>{if(m&&typeof m==='object')this.manifest=m;}).catch(()=>{});}catch(e){}},
  has(k){return !!(this.manifest&&this.manifest[k]);},
  play(k){if(!this.has(k)||!EXA.ready)return false;const b=this.bufs[k];if(b===undefined){this.bufs[k]=null;fetch(new URL(this.manifest[k],this.base)).then(r=>r.arrayBuffer()).then(a=>S.ctx.decodeAudioData(a)).then(buf=>{this.bufs[k]=buf;this._p(buf);}).catch(()=>{});return true;}if(b){this._p(b);return true;}return false;},
  _p(buf){const s=EXA.c.createBufferSource();s.buffer=buf;s.connect(EXA.track());s.start();}};
const VO={vs:null,pick(kind){if(!window.speechSynthesis)return null;const vs=speechSynthesis.getVoices()||[];if(!vs.length)return null;const want=kind==='ad'?[/Karen/i,/Catherine/i,/en-AU.*female/i,/UK English Female/i,/Hazel/i,/Zira/i,/Samantha/i,/female/i]:[/Daniel/i,/George/i,/UK English Male/i,/Ryan/i,/David/i,/Mark/i,/male/i];
    for(const r of want){const v=vs.find(v=>r.test(v.name+' '+v.lang)&&/^en/i.test(v.lang));if(v)return v;}return vs.find(v=>/^en/i.test(v.lang))||vs[0];},
  speak(text,kind){try{if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return false;const near=SEAT.active||(PC.crt&&player.pos.distanceTo(PC.crt.mesh.getWorldPosition(V3()))<3);if(!near)return false;const u=new SpeechSynthesisUtterance(text.replace(/—/g,', ').replace(/ZERO-FOUR-ONE-SEVEN/,'zero four one seven'));const v=this.pick(kind);if(v)u.voice=v;
    u.rate=kind==='pa'?0.84:0.97;u.pitch=kind==='pa'?0.5:1.1;u.volume=SEAT.active?0.8:0.35;if(kind==='pa')speechSynthesis.cancel();speechSynthesis.speak(u);return true;}catch(e){return false;}},
  cancel(){try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}}};

/* ---------- captions */
function exSay(who,text,dur,key){EX.cap={who,text,t:dur||Math.max(2.2,text.length*0.075)};EX.hudDirty=true;if(key&&EXT.play(key))return;
  if(who==='PA'){EXA.squelch();if(!VO.speak(text,'pa'))EXA.babble(150,text.length,'pa');}else if(who==='0417')EXA.babble(102,text.length,'low');else if(who&&who.startsWith('DR'))EXA.babble(who==='DR HALE'?210:135,text.length,'');}

/* ---------- the round */
const SCI_LOOKS=[{name:'DR VOSS',pos:[-1.35,-3.6],face:{skin:'#e3b79d',sr:227,sg:183,sb:157,hair:'#a3a39e',hairLine:0.36,bald:true,brow:'#888'},glasses:true,voice:'m',skin:'#e3b79d',skinRGB:[227,183,157],leg:'#4f4134',role:'hide',target:[-0.92,-3.42],end:'write'},
  {name:'DR HALE',pos:[0.05,-3.72],face:{skin:'#d8a88b',sr:216,sg:168,sb:139,hair:'#2a1c14',hairLine:0.42,lip:'#9a4a4a'},hairMesh:'bob',voice:'f',skin:'#d8a88b',skinRGB:[216,168,139],leg:'#2b2b33',role:'door',target:[1.92,-5.72],end:'nod'},
  {name:'DR AMES',pos:[1.4,-3.52],face:{skin:'#c99878',sr:201,sg:152,sb:120,hair:'#1c1612',hairLine:0.34},hairMesh:'mess',voice:'m',skin:'#c99878',skinRGB:[201,152,120],leg:'#3a3a3a',role:'handsup',target:[0.7,-5.85],end:'away'}];
function exClearRound(){for(const H of EX.humans){for(const k in H.cons)EX.world.removeConstraint(H.cons[k]);for(const n in H.parts){const p=H.parts[n];if(p.body)EX.world.removeBody(p.body);if(p.mesh.parent)p.mesh.parent.remove(p.mesh);p.mesh.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.map)o.material.map.dispose();o.material.dispose();}});}EX.scene.remove(H.group);}
  EX.humans.length=0;EX.sci.length=0;EX.pris=null;for(const g of EX.gibs){EX.scene.remove(g.m);EX.world.removeBody(g.b);}EX.gibs.length=0;for(const p of EX.pools){EX.scene.remove(p.m);p.m.material.dispose();}EX.pools.length=0;EX.bleeds.length=0;for(const s of EX.shells)EX.scene.remove(s.m);EX.shells.length=0;
  EXP.life.fill(0);for(let i=0;i<EXP.N;i++)EXP.pos[i*3+1]=-99;EXP.pts.geometry.attributes.position.needsUpdate=true;}
function exGlassBase(){const s=EX.glassS,x=s.x,W=s.c.width,H=s.c.height;x.clearRect(0,0,W,H);x.fillStyle='rgba(140,170,165,0.14)';x.fillRect(0,0,W,H);for(let i=0;i<5;i++){x.fillStyle=`rgba(255,255,255,${0.025+xr()*0.035})`;x.save();x.translate(60+i*100+xr()*30,0);x.transform(1,0,-0.6,1,0,0);x.fillRect(0,0,20+xr()*40,H);x.restore();}x.strokeStyle='rgba(30,35,35,0.6)';x.lineWidth=4;x.strokeRect(0,0,W,H);s.dirty=true;}
function exReset(){exClearRound();for(const s of EX.surfs.values()){if(s.pristine){s.x.globalCompositeOperation='copy';s.x.drawImage(s.pristine,0,0);s.x.globalCompositeOperation='source-over';s.dirty=true;}}exGlassBase();EX.glass.visible=true;EX.glassBroken=false;EX.glassHits=0;if(!EX.glassBody)EX.glassBody=exStaticBox(4.4,1.4,0.06,V3(0,1.75,-2.68));else if(!EX.glassBody.world)EX.world.addBody(EX.glassBody);exFlushSurfs();
  EX.mag=12;EX.reloadT=0;EX.cool=0;EX.recoil=0;EX.kickP=0;EX.aimYaw=0;EX.aimPitch=-0.12;EX.ads=false;EX.adsK=0;EX.shots=0;EX.pt=0;EX.lastShotAt=-99;EX.firstShotAt=-1;EX.prisDeadAt=-1;EX.prisHit=false;EX.prisHitAt=-1;EX.ending=null;EX.endT=0;EX.lines={};EX.cap={who:'',text:'',t:0};EX.objT=0;EX.hudDirty=true;EX.autoReload=-1;EX.rattleT=0;
  _xs=1000+((now*1000)|0)%9000;
  EX.pris=mkHuman({kind:'pris',pos:V3(0,0,0.25),rotY:0,mode:'kneel',cloth:{base:'#cf5c1a',rgb:[207,92,26]},skin:'#b4856a',skinRGB:[180,133,106],face:{skin:'#b4856a',sr:180,sg:133,sb:106,stubbleHead:true,stubble:true,tear:true,scar:true,brow:'#1a1410',eye:'#2a1a10',lip:'#6a3a32'},shoe:0xb24e14,voice:'low'});EX.pris.voice='low';EX.humans.push(EX.pris);
  for(const L of SCI_LOOKS){const H=mkHuman({kind:'sci',pos:V3(L.pos[0],0,L.pos[1]),rotY:0,mode:'stand',cloth:{base:'#e5e5de',rgb:[229,229,222],leg:L.leg,legRGB:[70,60,50]},coatSkirt:true,skin:L.skin,skinRGB:L.skinRGB,face:L.face,glasses:L.glasses,hairMesh:L.hairMesh,shoe:0x1a120c});H.name=L.name;H.voice=L.voice;H.role=L.role;H.tgt=L.target;H.endAct=L.end;EX.humans.push(H);EX.sci.push(H);}}
function exHitList(){const t=[EX.env];if(!EX.glassBroken)t.push(EX.glass);for(const H of EX.humans)for(const n in H.parts){const p=H.parts[n];if(!p.gone)t.push(p.mesh);}for(const g of EX.gibs)t.push(g.m);return t;}

/* ---------- shooting */
function exReload(){if(EX.reloadT>0||EX.mag>=12)return;EX.reloadT=1.35;EXA.reload();EX.hudDirty=true;}
function exFire(){if(EX.state!=='play'&&EX.state!=='intro')return;if(EX.reloadT>0||EX.cool>0)return;if(EX.mag<=0){EXA.dry();exReload();return;}
  EX.mag--;EX.cool=0.14;EX.recoil=1;EX.flashT=0.05;EX.shots++;EX.lastShotAt=EX.pt;if(EX.firstShotAt<0)EX.firstShotAt=EX.pt;EX.kickP=(EX.kickP||0)+0.032*(EX.ads?0.6:1);EX.aimYaw+=(xr()-0.5)*0.01;EX.hudDirty=true;EXA.shot();EXA.casing();if(EX.mag===0)EX.autoReload=0.4;
  /* brass */{const s=new THREE.Mesh(new THREE.BoxGeometry(0.009,0.009,0.02),exLam({color:0xc8a040,emissive:0x221800}));EX.gun.updateMatrixWorld(true);s.position.copy(EX.gun.localToWorld(V3(0.02,0.04,-0.03)));const r=V3(1,0.6,0.2).applyQuaternion(EX.cam.quaternion);EX.scene.add(s);EX.shells.push({m:s,v:r.multiplyScalar(2.2+xr()),w:V3(xr()*20,xr()*20,xr()*20),t:0,rest:false});if(EX.shells.length>30){const o=EX.shells.shift();EX.scene.remove(o.m);}}
  EX.cam.updateMatrixWorld(true);const sp=EX.ads?0.0015:0.006;const d=V3((xr()-0.5)*sp,(xr()-0.5)*sp,-1).normalize().applyQuaternion(EX.cam.getWorldQuaternion(new THREE.Quaternion()));const o=EX.cam.getWorldPosition(V3());
  for(const H of EX.sci)if(H.alive&&!H.panic&&!H.downed){H.kick.add(V3(0,0.01,-0.03));}
  exTrace(o,d);}
function exTrace(o,d){EX.scene.updateMatrixWorld();EX.ray.set(o,d);EX.ray.far=30;const hs=EX.ray.intersectObjects(exHitList(),true);
  for(const h of hs){const ob=h.object;if(ob===EX.glass){if(EX.glassBroken)continue;exGlassHit(h,d);if(EX.glassBroken)continue;return;}
    let p=null;for(let q=ob;q;q=q.parent){if(q.userData&&q.userData.hp){p=q.userData.hp;break;}}if(p){if(p.gone||!p.mesh.visible)continue;exHitPart(p,h,d);return;}
    const g=EX.gibs.find(g=>g.m===ob);if(g){g.b.wakeUp();g.b.velocity.set(d.x*4,d.y*4+1.5,d.z*4);exEmit(h.point,d,6,1.5,1,0,BLOOD);return;}
    const n=h.face?h.face.normal.clone().transformDirection(ob.matrixWorld):d.clone().negate();const s=EX.surfs.get(ob);if(s&&h.uv)holeAt(s,h.uv.x,h.uv.y);exEmit(h.point,n,10,1.6,0.9,1,DUST);exEmit(h.point,n,4,3,0.5,1,[0.9,0.8,0.5]);if(Math.random()<0.3)EXA.ric();else EXA.chip();return;}}
function exGlassHit(h,d){EX.glassHits++;EXA.glassTick();const s=EX.glassS;exPaint(s,h.uv.x,h.uv.y,(x,px,py)=>{x.strokeStyle='rgba(235,245,240,0.8)';x.lineWidth=1;for(let i=0;i<9;i++){const a=xr()*7;let X=px,Y=py;x.beginPath();x.moveTo(X,Y);for(let k=0;k<3;k++){X+=Math.cos(a+(xr()-0.5)*0.6)*(6+xr()*12);Y+=Math.sin(a+(xr()-0.5)*0.6)*(6+xr()*12);x.lineTo(X,Y);}x.stroke();}x.strokeStyle='rgba(255,255,255,0.5)';x.beginPath();x.arc(px,py,5+xr()*3,0,7);x.stroke();x.fillStyle='rgba(20,25,25,0.85)';x.beginPath();x.arc(px,py,2,0,7);x.fill();});
  exEmit(h.point,V3(0,0.2,1),8,1.4,0.9,1,GLASSC);for(const H of EX.sci)if(H.alive&&!H.downed){H.kick.add(V3((xr()-0.5)*0.02,0.02,-0.06));if(!H.panic)exSetAct(H,'watch');}
  if(EX.glassHits===1)exSay('PA','PLEASE DIRECT FIRE AT THE SUBJECT.',3,'pa_direct');else if(EX.glassHits===3)exSay('PA','CEASE FIRE. CEASE—',2.2,'pa_cease');
  if(EX.glassHits>=5)exGlassBreak();}
function exGlassBreak(){if(EX.glassBroken)return;EX.glassBroken=true;EX.glass.visible=false;if(EX.glassBody&&EX.glassBody.world)EX.world.removeBody(EX.glassBody);EXA.glassBreak();EXA.feedback();VO.cancel();
  for(let i=0;i<14;i++)exEmit(V3((xr()-0.5)*4.2,1.1+xr()*1.3,-2.68),V3((xr()-0.5)*0.6,-0.2,(xr()-0.5)),14,1.6,1.0,1,GLASSC);
  EX.cap={who:'',text:'',t:0};let d=0.25;for(const H of EX.sci){if(!H.alive||H.downed)continue;H.panic=true;H.screamT=d;d+=0.35+xr()*0.4;}EX.pris.headUpT=6;EX.pris.lookWin=6;EX.hudDirty=true;}
function exHitPart(p,h,d){const H=p.H,n=p.name;p.hits++;exWound(p,h.uv,n==='head');exEmit(h.point,d.clone().negate(),8,1.1,1.1,0,BLOOD);exEmit(h.point,d,20,3.2,0.6,0,BLOOD);exEmit(h.point,d,3,0.5,1.2,1,[0.45,0.05,0.05]);exSplatFrom(h.point,d,n==='head'?0.42:0.26);EXA.flesh();
  if(p.body)exImpulse(p,d,n==='head'?5:8,h.point);else{const dl=d.clone().applyAxisAngle(V3(0,1,0),-H.group.rotation.y);H.kick.addScaledVector(dl,n==='head'?0.05:0.035);H.kv.addScaledVector(dl,0.9);}
  if(H===EX.pris&&!EX.prisHit){EX.prisHit=true;EX.prisHitAt=EX.pt;}
  if(H.alive){const dm={head:500,torso:34,pelvis:26}[n]||14;H.health-=dm;H.hurt=Math.min(1,H.hurt+0.5);
    if(n==='head')exKill(H,p,h,d,'head');
    else if(LIMBS.includes(n)&&p.hits>=2){H.downed=true;H.bleed=Math.max(H.bleed,11);exSever(H,n,d,h.point);EXA.scream(H.voice,'long');H.screamT=1.6;if(H.health<=0)exKill(H,p,h,d,'body');}
    else if(H.health<=0)exKill(H,p,h,d,'body');
    else{EXA.scream(H.voice,'hit');if(H.kind==='sci'&&!H.panic&&!H.downed){H.panic=true;H.screamT=1.2;}}
    if(n==='torso'&&p.hits>=3)exOpenTorso(H);}
  else{if(n==='head'&&p.hits>=2)exBurstHead(H,d,h.point);else if(LIMBS.includes(n)&&p.hits>=2)exSever(H,n,d,h.point);else if(n==='torso'&&p.hits>=3)exOpenTorso(H);}}
function exKill(H,p,h,d,cause){if(!H.alive)return;H.alive=false;H.health=0;if(!H.rag)exRagdoll(H);exImpulse(p.body?p:H.parts.torso,d,cause==='head'?11:15,h.point);if(cause==='head'){exEmit(h.point,d,50,4,0.9,0,BLOOD);exSplatFrom(h.point,d,0.6);EXA.wet(0.8);}else EXA.scream(H.voice,'gurgle');exDied(H);}
function exDied(H){H.alive=false;H.downed=false;EX.poolQ=EX.poolQ||[];EX.poolQ.push({H,t:1.4});if(H===EX.pris){EX.prisDeadAt=EX.pt;for(const s of EX.sci)if(s.alive&&!s.panic&&!s.downed){exSetAct(s,s.endAct);s.actT=99;}}
  if(EX.sci.length&&EX.sci.every(s=>!s.alive)&&!EX.ending)exEndDefy();}

/* ---------- behaviour */
const _tl=V3();
function exBrain(H,dt,live){H.group.updateMatrixWorld(true);_tl.copy(EX.cam.position);H.watch.copy(H.group.worldToLocal(_tl.clone()));
  if(H.rag){if(H.alive&&H.downed){H.health-=H.bleed*dt;H.writheT=(H.writheT||0)-dt;if(H.writheT<=0){H.writheT=0.3+xr()*0.6;const ps=Object.values(H.parts).filter(q=>q.body&&!q.gone);const q=ps[(xr()*ps.length)|0];if(q)exImpulse(q,V3(xr()-0.5,0.7+xr()*0.6,xr()-0.5).normalize(),2.5+xr()*5,q.body.position);}
      H.screamT-=dt;if(H.screamT<=0){H.screamT=1.3+xr()*1.8;EXA.scream(H.voice,H.health>45?'long':(H.health>20?'moan':'sob'));}if(H.health<=0){EXA.scream(H.voice,'gurgle');exDied(H);}}return;}
  if(!H.alive)return;H.hurt=Math.max(0,H.hurt-dt*0.04);
  if(H.kind==='pris'){if(H.lookWin>0){H.lookWin-=dt;H.group.updateMatrixWorld(true);H.watch.copy(H.group.worldToLocal(V3(0,1.7,-3.5)));}if(H.headUpT>0){H.headUpT-=dt;H.headUp=Math.min(1,H.headUp+dt*1.6);}else H.headUp=Math.max(0,H.headUp-dt*0.8);
    if(H.hurt>0.3&&H.health<70&&live){H.groanT=(H.groanT||2)-dt;if(H.groanT<=0){H.groanT=2.5+xr()*2.5;EXA.scream(H.voice,'moan');}}return;}
  /* scientists */if(H.panic){if(!H.ran){H.ran=true;EXA.scream(H.voice,'panic');const line={hide:'[sobbing] We only observe— we only OBSERVE!',door:'SECURITY! OPEN THE DOOR! OPEN IT!',handsup:"Please! It's not real— it's a TEST, it's just a test!"}[H.role];exSay(H.name,line,3.4);}
    const tx=H.tgt[0],tz=H.tgt[1];const dx=tx-H.group.position.x,dz=tz-H.group.position.z;const dd=Math.hypot(dx,dz);
    if(dd>0.08){const sp=1.9*dt;H.group.position.x+=dx/dd*Math.min(sp,dd);H.group.position.z+=dz/dd*Math.min(sp,dd);const want=Math.atan2(dx,dz);let r=want-H.group.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));H.group.rotation.y+=r*Math.min(1,dt*10);H.walkAmt=Math.min(1,H.walkAmt+dt*5);H.walkPh+=dt*10;if(H.act!=='watch')exSetAct(H,'watch');}
    else{H.walkAmt=Math.max(0,H.walkAmt-dt*5);const face=H.role==='door'?Math.PI:0;let r=face-H.group.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));H.group.rotation.y+=r*Math.min(1,dt*6);exSetAct(H,H.role==='door'?'door':H.role==='hide'?'hide':'handsup');
      if(H.role==='door'){H.rattleT=(H.rattleT||0)-dt;if(H.rattleT<=0){H.rattleT=0.7+xr()*0.6;EXA.rattle();}}}
    H.screamT-=dt;if(H.screamT<=0){H.screamT=2.2+xr()*3;EXA.scream(H.voice,H.role==='hide'?'sob':'panic');}return;}
  H.actT-=dt;if(H.actT<=0&&EX.prisDeadAt<0){const r=xr();if(H.act==='write'||H.act==='tap'){exSetAct(H,'watch');H.actT=3+xr()*4;}else{exSetAct(H,r<0.55?'write':'watch');H.actT=2.5+xr()*3;}}
  if(H.act==='tap'){H.tapT=(H.tapT||0)-dt;if(H.tapT<=0){H.tapT=0.48;EXA.tap();}}}

/* ---------- endings */
function exEndComply(){if(EX.ending)return;EX.ending='C';EX.endT=0;}
function exEndDefy(){if(EX.ending)return;EX.ending='D';exGo('endD');EXA.klaxon(4.4);VO.cancel();EX.cap={who:'',text:'',t:0};}

/* ---------- the 3D frame */
function exUpdate3D(dt){const live=SEAT.active||EX.state==='endD'||!!EX.ending;if(live&&EX.state==='play')EX.pt+=dt;
  EX.cool=Math.max(0,EX.cool-dt);if(EX.autoReload>0){EX.autoReload-=dt;if(EX.autoReload<=0){EX.autoReload=-1;exReload();}}
  if(EX.reloadT>0){EX.reloadT-=dt;if(EX.reloadT<=0){EX.reloadT=0;EX.mag=12;EX.hudDirty=true;}}
  if(EX.cap.t>0){EX.cap.t-=dt;if(EX.cap.t<=0)EX.hudDirty=true;}if(EX.objT>0){EX.objT-=dt;if(EX.objT<=0)EX.hudDirty=true;}
  const ph=Math.floor(EX.st*2)%2;if(ph!==EX.blink){EX.blink=ph;EX.hudDirty=true;}
  for(const H of EX.humans){exBrain(H,dt,live);exAnimate(H,dt);}
  if(EX.state==='play'&&live)exScript(dt);
  let dyn=EX.gibs.length>0;for(const H of EX.humans)if(H.rag){dyn=true;break;}if(dyn)EX.world.step(1/60,dt,3);for(const H of EX.humans)exSyncRag(H);for(const g of EX.gibs){g.m.position.copy(g.b.position);g.m.quaternion.copy(g.b.quaternion);}
  if(EX.poolQ)for(let i=EX.poolQ.length-1;i>=0;i--){const q=EX.poolQ[i];q.t-=dt;if(q.t<=0){exPool(q.H);EX.poolQ.splice(i,1);}}
  exUpdateBleeds(dt);exUpdateParticles(dt);exUpdatePools(dt);exUpdateShells(dt);exGunUpdate(dt);exFlushSurfs();
  /* the tube flickers; the camera's red light blinks */const fl=Math.random()<0.02?0.25:(Math.random()<0.05?0.75:1);EX.tubeLight.intensity=lerp(EX.tubeLight.intensity,9*fl,0.6);EX.tube.material.color.setScalar(0.6+0.4*fl);EX.recLed.visible=ph===0;
  if(EX.prisDeadAt>=0&&!EX.ending&&EX.sci.some(s=>s.alive)&&EX.pt-EX.prisDeadAt>(EX.glassBroken?9:4.8))exEndComply();
  if(EX.ending==='C'){EX.endT+=dt;if(EX.endT>0.9)exGo('endC');}}
function exScript(dt){const t=EX.pt,L=EX.lines,P=EX.pris;const once=(k,at,fn)=>{if(!L[k]&&t>=at){L[k]=1;fn();}};
  once('pa1',0.8,()=>exSay('PA','SUBJECT ZERO-FOUR-ONE-SEVEN.',2.8,'pa_subject'));once('pa2',3.8,()=>exSay('PA','FOUR COUNTS OF MURDER. NO APPEAL WAS LODGED.',3.5,'pa_counts'));
  once('pa3',7.6,()=>exSay('PA','YOU HAVE ONE INSTRUCTION.',2.5,'pa_instruction'));once('pa4',10.4,()=>{exSay('PA','PROCEED.',2.2,'pa_proceed');EX.objT=7;EX.hudDirty=true;});
  const idle=P.alive&&!EX.prisHit&&EX.glassHits===0;if(!idle)return;const sinceShot=t-Math.max(10.4,EX.lastShotAt);
  once('m1',16,()=>exSay('0417','...go on, then.',2.6,'pris_goon'));
  once('pa5',25,()=>{exSay('PA','PLEASE PROCEED.',2.4,'pa_please');for(const s of EX.sci){exSetAct(s,'write');s.actT=3;}});
  once('m2',32,()=>{P.headUpT=6;exSay('0417',"They said you'd hesitate. The last one did.",4,'pris_hesitate');});
  once('tap',41,()=>{const s=EX.sci[1];if(s&&s.alive&&!s.panic){exSetAct(s,'tap');s.actT=2.6;}});
  once('pa6',52,()=>{exSay('PA','YOUR HESITATION HAS BEEN NOTED.',3,'pa_noted');for(const s of EX.sci){exSetAct(s,'write');s.actT=4;}});
  once('m3',66,()=>{P.headUpT=5;exSay('0417',"I didn't hesitate.",3,'pris_didnt');});
  if(t>80){const k='loop'+Math.floor((t-80)/30);once(k,80+Math.floor((t-80)/30)*30,()=>exSay('PA',Math.floor((t-80)/30)%2?'YOUR HESITATION HAS BEEN NOTED.':'PROCEED.',2.6,'pa_proceed'));}
  if(EX.prisHit&&P.alive&&!L.finish&&t-EX.prisHitAt>6){L.finish=1;exSay('PA','FINISH IT.',2,'pa_finish');}}
function exUpdateShells(dt){for(const s of EX.shells){if(s.rest)continue;s.t+=dt;s.v.y-=9.8*dt;s.m.position.addScaledVector(s.v,dt);s.m.rotation.x+=s.w.x*dt;s.m.rotation.y+=s.w.y*dt;if(s.m.position.y<0.006){s.m.position.y=0.006;s.v.y*=-0.35;s.v.x*=0.6;s.v.z*=0.6;s.w.multiplyScalar(0.5);if(Math.abs(s.v.y)<0.3){s.rest=true;s.m.rotation.set(0,s.m.rotation.y,PI_2);}}}}
function exGunUpdate(dt){EX.adsK=lerp(EX.adsK,EX.ads&&SEAT.active?1:0,1-Math.exp(-dt*11));const fov=lerp(62,38,EX.adsK);if(Math.abs(EX.cam.fov-fov)>0.01){EX.cam.fov=fov;EX.cam.updateProjectionMatrix();}
  EX.recoil*=Math.exp(-dt*13);EX.kickP=(EX.kickP||0)*Math.exp(-dt*7);const br=Math.sin(now*1.3)*0.004*(1-EX.adsK*0.7);EX.cam.rotation.set(EX.aimPitch+EX.kickP+br*0.5,EX.aimYaw,0);
  const g=EX.gun,a=EX.adsK,r=EX.recoil;g.position.set(lerp(0.15,0,a),lerp(-0.16,-0.06,a)+br,lerp(-0.36,-0.46,a)+0.05*r);g.rotation.set(0.24*r,lerp(-0.04,0,a),0);
  if(EX.reloadT>0){const k=1-EX.reloadT/1.35;const s=Math.sin(Math.PI*k);g.position.y-=0.09*s;g.rotation.z=0.6*s;g.rotation.x+=-0.3*s;}else g.rotation.z=0;
  EX.slide.position.z=-0.012+0.034*Math.min(1,r*1.6);const fv=EX.flashT>0;EX.flashT-=dt;for(const m of EX.muzzle){m.visible=fv;m.rotation.z=Math.random()*6;}
  EX.mLight.intensity=fv?40:0;if(fv){EX.cam.updateMatrixWorld(true);EX.mLight.position.copy(EX.cam.localToWorld(V3(0.1,-0.05,-0.6)));}}

/* ---------- state machine */
function exStart(){EXA.init();EXT.init();exBuild();EX.running=true;exGo('boot');}
function exStop(){EX.running=false;EX.state='off';EXA.stopAll();VO.cancel();EXA.level(0);}
function exGo(st){EX.state=st;EX.st=0;EX.c2dirty=true;EX.hudDirty=true;EX.is3D=(st==='intro'||st==='play'||st==='endD');
  if(st==='boot'){EXA.stopAll();VO.cancel();for(let i=0;i<9;i++)EXA.noise({dur:0.03,gain:0.12,type:'bandpass',f:1200+Math.random()*900,q:2,delay:0.4+i*0.33+Math.random()*0.1});}
  if(st==='title'){EXA.stopAll();EXA.sting();}
  if(st==='intro'){EXA.stopAll();exReset();EXA.humStart();EX.blink=-1;}
  if(st==='endC'){EXA.stopAll();VO.cancel();EX.endLines=0;}
  if(st==='ad'){EXA.stopAll();VO.cancel();EX.adCap='';EX.adI=0;if(!EXT.play('ad_jingle'))EXA.jingle(30);}}
const AD_LINES=[[0.7,'At Happy Happy Play Place...','ad_1'],[3.8,'...retired racing greyhounds finally get to stop running.','ad_2'],[10.2,'A warm couch. A knitted jumper. All the naps they ever missed.','ad_3'],[17.2,'This is Biscuit. Biscuit likes toast, sunshine... and you.','ad_4'],[24.2,'Happy Happy Play Place. Sponsor a couch today.','ad_5']];
function updateExecutioner(dt){if(!EX.running)return;if(!PC.on||PC.state!=='desktop'||!crtAlive()){exStop();return;}
  const mp=PC.crt.mesh.getWorldPosition(V3());EXA.level(SEAT.active?1:0.9*S.dist(mp));EX.st+=dt;
  switch(EX.state){case 'boot':if(EX.st>3.9)exGo('title');break;
    case 'intro':case 'play':case 'endD':exUpdate3D(dt);if(EX.state==='intro'&&EX.st>1.3)EX.state='play';if(EX.state==='endD'&&EX.st>4.4)exGo('ad');break;
    case 'endC':{const n=EX.st>1.9?2:(EX.st>0.4?1:0);if(n!==EX.endLines){EX.endLines=n;EX.c2dirty=true;if(n===1&&!EXT.play('pa_complete'))VO.speak('Test complete.','pa');if(n===2&&!EXT.play('pa_thankyou'))VO.speak('Thank you for your compliance.','pa');}if(EX.st>5.6)exGo('ad');break;}
    case 'ad':{while(EX.adI<AD_LINES.length&&EX.st>=AD_LINES[EX.adI][0]){const L=AD_LINES[EX.adI++];EX.adCap=L[1];if(!EXT.play(L[2])&&!EXT.has('ad_jingle'))VO.speak(L[1],'ad');}if(EX.st>30.5)exGo('boot');break;}}}

/* ---------- input (while seated) */
EX.look=(dx,dy)=>{if(!EX.is3D)return;const s=0.0016*(1-EX.adsK*0.45);EX.aimYaw=clamp(EX.aimYaw-dx*s,-1.0,1.0);EX.aimPitch=clamp(EX.aimPitch-dy*s,-0.6,0.5);};
EX.trigger=()=>{if(!EX.running)return;if(EX.state==='boot'&&EX.st>0.8)exGo('title');else if(EX.state==='title'&&EX.st>0.6)exGo('intro');else if(EX.state==='play'||EX.state==='intro')exFire();};
EX.reload=()=>{if(EX.state==='play')exReload();};

/* ---------- HUD (inside the game) */
function wrapText(x,text,maxW){const words=text.split(' ');const lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(x.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;}if(cur)lines.push(cur);return lines;}
function exDrawHUD(){const x=EX.hud.getContext('2d');x.clearRect(0,0,EXW,EXH);const W=EXW,H=EXH;
  if(EX.state==='play'||EX.state==='intro'||EX.state==='endD'){
    if(EX.adsK<0.5&&EX.state!=='endD'){x.strokeStyle='rgba(0,0,0,0.6)';x.lineWidth=4;const c=W/2,m=H/2;const seg=(a,b,cc,d)=>{x.beginPath();x.moveTo(a,b);x.lineTo(cc,d);x.stroke();};for(const [st,lw] of[['rgba(0,0,0,0.6)',4],['rgba(240,240,230,0.9)',2]]){x.strokeStyle=st;x.lineWidth=lw;seg(c-13,m,c-5,m);seg(c+5,m,c+13,m);seg(c,m-13,c,m-5);seg(c,m+5,c,m+13);}}
    x.font='bold 30px "Courier New",monospace';x.textAlign='right';x.fillStyle='rgba(0,0,0,0.6)';x.fillText(String(EX.mag).padStart(2,'0'),W-62,H-30);x.fillStyle=EX.mag<=3?'#e05a3a':'#e8e2c8';x.fillText(String(EX.mag).padStart(2,'0'),W-64,H-32);
    x.font='bold 14px "Courier New",monospace';x.fillStyle='#b8b2a0';x.fillText('9MM · ∞',W-18,H-33);for(let i=0;i<12;i++){x.fillStyle=i<EX.mag?'#c9a227':'#3a3830';x.fillRect(W-24-i*9,H-24,6,10);}
    if(EX.reloadT>0){x.textAlign='center';x.font='bold 16px "Courier New",monospace';x.fillStyle='#e8e2c8';x.fillText('RELOADING',W/2,H/2+46);}
    x.textAlign='left';x.font='bold 13px "Courier New",monospace';x.fillStyle='#b8b2a0';x.fillText('SUBJECT 0417',18,H-30);x.fillStyle=EX.pris&&EX.pris.alive?'#e8e2c8':'#e05a3a';x.fillText(EX.pris&&EX.pris.alive?'STATUS: ALIVE':'STATUS: DECEASED',18,H-14);
    if(EX.blink===0){x.fillStyle='#e02020';x.beginPath();x.arc(W-60,24,6,0,7);x.fill();}x.fillStyle='#e8e2c8';x.font='bold 14px "Courier New",monospace';x.textAlign='left';x.fillText('REC',W-48,29);
    if(EX.objT>0){x.font='bold 15px "Courier New",monospace';x.fillStyle='rgba(0,0,0,0.55)';x.fillRect(14,14,330,26);x.fillStyle='#e8e2c8';x.fillText('OBJECTIVE: EXECUTE SUBJECT 0417',22,32);}
    if(EX.state==='endD'){const on=Math.floor(EX.st*3)%2===0;x.textAlign='center';x.fillStyle=on?'rgba(160,0,0,0.85)':'rgba(60,0,0,0.85)';x.fillRect(0,H/2-46,W,92);x.fillStyle='#fff';x.font='bold 40px Impact,"Arial Black",sans-serif';x.fillText('SUBJECT NON-COMPLIANT',W/2,H/2+4);x.font='bold 15px "Courier New",monospace';x.fillText('SESSION TERMINATED · OPERATOR FLAGGED',W/2,H/2+32);}}
  if(EX.cap.t>0&&EX.cap.text){x.font=EX.cap.who==='0417'?'italic 19px Georgia,serif':'bold 18px Arial,sans-serif';const lines=wrapText(x,EX.cap.text,W-200);const lh=22,bh=lines.length*lh+(EX.cap.who?20:8);const by=H-52-bh;x.fillStyle='rgba(0,0,0,0.66)';x.fillRect(90,by,W-180,bh);x.textAlign='center';
    if(EX.cap.who){x.font='bold 12px "Courier New",monospace';x.fillStyle=EX.cap.who==='PA'?'#9fd2ff':EX.cap.who==='0417'?'#ffb07a':'#d8d8d0';x.fillText(EX.cap.who==='PA'?'[LOUDSPEAKER]':EX.cap.who==='0417'?'[SUBJECT 0417]':'['+EX.cap.who+']',W/2,by+16);}
    x.font=EX.cap.who==='0417'?'italic 19px Georgia,serif':'bold 18px Arial,sans-serif';x.fillStyle=EX.cap.who==='0417'?'#f0d8c0':'#fff';lines.forEach((l,i)=>x.fillText(l,W/2,by+(EX.cap.who?36:22)+i*lh));}
  x.textAlign='left';EX.hudt.needsUpdate=true;EX.hudDirty=false;}

/* ---------- 2D screens */
const BOOT=[[0,'C:\\>'],[0.3,'C:\\>cd GAMES\\EXEC'],[0.65,'C:\\GAMES\\EXEC>exec.exe'],[1.05,''],[1.1,'DOS/32 Protected Mode Run-time   Version 1.4'],[1.2,'Copyright (c) 2001 Compliance Interactive'],[1.55,'SoundMaster 16 at A220 I5 D1 ............ OK'],[1.95,'Loading CELL04.BSP ...................... OK'],[2.35,'Loading SUBJECT.MDL ..................... OK'],[2.75,'Loading OBSERVER.MDL (x3) ............... OK'],[3.2,'Checking operator consent ............... ASSUMED']];
function exDrawBoot(x,t){x.fillStyle='#000';x.fillRect(0,0,EXW,EXH);x.font='bold 17px "Courier New",monospace';x.fillStyle='#bdbdbd';let y=34;let n=0;for(const [at,l] of BOOT){if(t<at)break;n++;x.fillStyle=/ASSUMED/.test(l)?'#e8e2c8':'#bdbdbd';x.fillText(l,16,y);y+=22;}if(Math.floor(t*3)%2===0){x.fillStyle='#bdbdbd';x.fillRect(16,y-15,10,3);}return n*10+(Math.floor(t*3)%2);}
function exDrawTitle(x,t){if(!EX.titleBG){const c=mkCanvas(EXW,EXH),y=c.getContext('2d');y.fillStyle='#050202';y.fillRect(0,0,EXW,EXH);_xs=77;for(let i=0;i<9000;i++){y.fillStyle=`rgba(${60+xr()*80|0},0,0,${xr()*0.25})`;y.fillRect(xr()*EXW,xr()*EXH,2,1);}
    const gw=y.createRadialGradient(320,300,10,320,300,260);gw.addColorStop(0,'rgba(120,20,10,0.35)');gw.addColorStop(1,'rgba(0,0,0,0)');y.fillStyle=gw;y.fillRect(0,0,EXW,EXH);
    y.fillStyle='#1e2a26';y.fillRect(200,190,240,70);y.fillStyle='#7fa79a';y.fillRect(206,196,228,58);y.fillStyle='#111';for(const hx of[250,320,390]){y.beginPath();y.arc(hx,222,11,0,7);y.fill();y.fillRect(hx-16,232,32,30);}
    const cone=y.createLinearGradient(320,260,320,430);cone.addColorStop(0,'rgba(255,240,220,0.18)');cone.addColorStop(1,'rgba(255,240,220,0)');y.fillStyle=cone;y.beginPath();y.moveTo(300,262);y.lineTo(340,262);y.lineTo(420,430);y.lineTo(220,430);y.fill();
    y.fillStyle='#000';y.beginPath();y.ellipse(320,372,30,44,0,0,7);y.fill();y.beginPath();y.arc(326,334,13,0,7);y.fill();y.fillRect(288,398,64,26);y.fillStyle='#3a0000';y.fillRect(150,428,340,6);EX.titleBG=c;}
  x.drawImage(EX.titleBG,0,0);x.textAlign='center';x.font='bold 82px Impact,Haettenschweiler,"Arial Black",sans-serif';const g=x.createLinearGradient(0,70,0,150);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#a8a8a8');x.lineWidth=6;x.strokeStyle='#7a0000';x.strokeText('EXECUTIONER',320,138);x.fillStyle=g;x.fillText('EXECUTIONER',320,138);
  x.fillStyle='#8a0000';for(let i=0;i<12;i++){const dx=100+i*40+Math.sin(i*7.3)*12,len=8+((i*37)%30);x.fillRect(dx,140,3,len);x.beginPath();x.arc(dx+1.5,140+len,3,0,7);x.fill();}
  x.font='bold 13px "Courier New",monospace';x.fillStyle='#b8b2a0';x.fillText('A  COMPLIANCE  INTERACTIVE  PRODUCTION',320,172);
  if(Math.floor(t*2)%2===0){x.font='bold 22px "Courier New",monospace';x.fillStyle='#e8e2c8';x.fillText('PRESS  FIRE',320,462-0);}
  x.font='10px "Courier New",monospace';x.fillStyle='#6a6458';x.fillText('© 2001 COMPLIANCE INTERACTIVE · ALL RIGHTS WAIVED',320,476);
  x.save();x.translate(540,62);x.rotate(-0.22);x.strokeStyle='rgba(200,30,20,0.9)';x.lineWidth=3;x.strokeRect(-78,-20,156,40);x.font='bold 13px "Courier New",monospace';x.fillStyle='rgba(220,40,30,0.95)';x.fillText('CLASSIFICATION',0,-3);x.fillText('REFUSED (AUS)',0,13);x.restore();x.textAlign='left';return Math.floor(t*2)%2;}
function exDrawEndC(x,t){x.fillStyle='#000';x.fillRect(0,0,EXW,EXH);x.textAlign='center';if(t>0.4){x.font='bold 40px "Courier New",monospace';x.fillStyle='#f2f2ee';x.fillText('TEST COMPLETE.',320,224);}if(t>1.9){x.font='18px "Courier New",monospace';x.fillStyle='#bdbdb5';x.fillText('THANK YOU FOR YOUR COMPLIANCE.',320,266);}if(t>3.4){x.font='11px "Courier New",monospace';x.fillStyle='#55534c';x.fillText('SESSION 0417 ARCHIVED · OPERATOR RESPONSE TIME LOGGED',320,450);}x.textAlign='left';return(t>0.4)+(t>1.9)+(t>3.4);}

/* --- HAPPY HAPPY PLAY PLACE */
function drawHound(x,X,Y,S,o){x.save();x.translate(X,Y);x.scale(S*(o.dir||1),S);if(o.rot)x.rotate(o.rot);if(o.pose==='roach')x.rotate(Math.PI+0.12);const coat=o.coat||'#c9a27a',dark=o.dark||'#7a5a3a',t=o.t||0,pose=o.pose||'stand';const J=o.jumper||['#d33b3b','#f4efe6'];
  const ph=t*15;let fa1=0.06,fa2=0,ba1=-0.05,ba2=0.05,bob=0;
  if(pose==='run'){fa1=0.95*Math.sin(ph);fa2=fa1-0.9*Math.max(0,-Math.cos(ph));ba1=-0.95*Math.sin(ph+0.6);ba2=ba1+0.8*Math.max(0,Math.cos(ph+0.6));bob=Math.sin(ph*2)*0.05;}
  if(pose==='lay'){fa1=1.45;fa2=1.45;ba1=1.4;ba2=-1.6;}
  if(pose==='roach'){fa1=0.25+Math.sin(t*2)*0.05;fa2=0.1;ba1=-0.2;ba2=0.2;}
  x.translate(0,bob);const leg=(hx,hy,a1,a2,col,w)=>{x.strokeStyle=col;x.lineCap='round';x.lineJoin='round';x.lineWidth=w;const l1=0.42,l2=0.44;const kx=hx+Math.sin(a1)*l1,ky=hy+Math.cos(a1)*l1;const fx=kx+Math.sin(a2)*l2,fy=ky+Math.cos(a2)*l2;x.beginPath();x.moveTo(hx,hy);x.lineTo(kx,ky);x.lineTo(fx,fy);x.stroke();x.fillStyle=dark;x.beginPath();x.ellipse(fx+0.05,fy,0.07,0.035,0,0,7);x.fill();};
  const far=o.far||'#a8835c';leg(0.42,0.12,fa1+(pose==='run'?0.35:0.05),fa2+(pose==='run'?0.35:0),far,0.085);leg(-0.72,0.0,ba1+(pose==='run'?-0.35:0.05),ba2+(pose==='run'?-0.3:0),far,0.1);
  x.strokeStyle=coat;x.lineWidth=0.055;x.lineCap='round';x.beginPath();x.moveTo(-0.95,-0.12);x.quadraticCurveTo(-1.38,0.22+Math.sin(t*9)*0.08,-1.22,0.58);x.stroke();
  const body=()=>{x.beginPath();x.moveTo(0.55,-0.35);x.quadraticCurveTo(0.0,-0.53,-0.75,-0.4);x.quadraticCurveTo(-1.06,-0.3,-0.98,0.02);x.quadraticCurveTo(-0.75,0.1,-0.45,0.02);x.quadraticCurveTo(-0.1,0.0,0.12,0.32);x.quadraticCurveTo(0.6,0.44,0.73,0.08);x.quadraticCurveTo(0.77,-0.2,0.55,-0.35);x.closePath();};
  x.fillStyle=coat;body();x.fill();x.save();body();x.clip();for(let i=0;i<14;i++){x.fillStyle=J[i%2];x.fillRect(-0.62+i*0.11,-0.7,0.11,1.4);}x.fillStyle='rgba(255,255,255,0.13)';for(let i=0;i<40;i++)x.fillRect(-0.6+(i%10)*0.14,-0.45+Math.floor(i/10)*0.18,0.05,0.03);x.fillStyle=coat;x.fillRect(-1.2,-0.7,0.56,1.4);x.restore();
  x.fillStyle=coat;x.beginPath();x.moveTo(0.48,-0.3);x.quadraticCurveTo(0.72,-0.78,0.95,-0.88);x.lineTo(1.06,-0.72);x.quadraticCurveTo(0.86,-0.46,0.72,0.02);x.fill();x.fillStyle=J[0];x.beginPath();x.moveTo(0.5,-0.32);x.lineTo(0.7,-0.5);x.lineTo(0.8,-0.24);x.lineTo(0.72,0.0);x.fill();
  x.fillStyle=coat;x.beginPath();x.ellipse(1.07,-0.84,0.17,0.12,0.2,0,7);x.fill();x.beginPath();x.moveTo(1.08,-0.93);x.quadraticCurveTo(1.44,-0.84,1.53,-0.76);x.quadraticCurveTo(1.36,-0.68,1.04,-0.72);x.fill();x.fillStyle='#1a1410';x.beginPath();x.arc(1.52,-0.765,0.03,0,7);x.fill();
  if(pose==='lay'||pose==='roach'){x.strokeStyle='#1a1410';x.lineWidth=0.02;x.beginPath();x.arc(1.12,-0.87,0.025,0,Math.PI);x.stroke();}else{x.fillStyle='#1a1410';x.beginPath();x.arc(1.12,-0.875,0.022,0,7);x.fill();}
  const ef=pose==='run'?Math.sin(t*20)*0.08:0;x.fillStyle=dark;x.beginPath();x.moveTo(0.99,-0.93);x.quadraticCurveTo(0.86,-1.03-ef,0.82,-0.9);x.quadraticCurveTo(0.9,-0.9,0.99,-0.86);x.fill();
  leg(0.47,0.14,fa1,fa2,coat,0.09);leg(-0.7,0.02,ba1,ba2,coat,0.11);x.restore();}
function drawLogo(x,cx,cy,s,t){x.save();x.translate(cx,cy);x.scale(s,s);x.textAlign='center';x.lineJoin='round';const f='bold 56px "Arial Rounded MT Bold","Comic Sans MS","Chalkboard SE",Arial,sans-serif';x.font=f;
  const draw=(str,y,col)=>{let w=x.measureText(str).width;let px=-w/2;for(let i=0;i<str.length;i++){const ch=str[i];const cw=x.measureText(ch).width;const by=Math.sin(t*6+i*0.6)*4;x.lineWidth=10;x.strokeStyle='#e8742c';x.strokeText(ch,px+cw/2,y+by);x.fillStyle=col;x.fillText(ch,px+cw/2,y+by);px+=cw;}};draw('Happy Happy',-10,'#fffbe8');draw('Play Place',52,'#ffe36a');x.restore();x.textAlign='left';}
function rrect(x,a,b,w,h,r){if(x.roundRect){x.roundRect(a,b,w,h,r);return;}x.rect(a,b,w,h);}
function drawCarer(x,X,Y,S,t){x.save();x.translate(X,Y);x.scale(S,S);x.fillStyle='#8a5a7a';x.beginPath();rrect(x,-0.9,-0.3,1.8,1.5,0.25);x.fill();x.fillStyle='#7a4a6a';x.beginPath();rrect(x,-1.05,0.1,0.35,1.1,0.15);x.fill();x.beginPath();rrect(x,0.7,0.1,0.35,1.1,0.15);x.fill();
  x.fillStyle='#b9a3d6';x.beginPath();rrect(x,-0.45,-0.1,0.9,1.0,0.3);x.fill();for(let i=0;i<4;i++){x.fillStyle='#f4efe6';x.beginPath();x.arc(0,0.05+i*0.2,0.025,0,7);x.fill();}
  x.fillStyle='#f0c8a8';x.beginPath();x.arc(0,-0.38,0.27,0,7);x.fill();x.fillStyle='#d9d9e0';x.beginPath();x.arc(0,-0.5,0.27,Math.PI,0);x.fill();x.beginPath();x.arc(0,-0.74,0.12,0,7);x.fill();
  x.strokeStyle='#5a4a40';x.lineWidth=0.02;for(const s of[-1,1]){x.beginPath();x.arc(s*0.1,-0.38,0.07,0,7);x.stroke();}x.beginPath();x.moveTo(-0.03,-0.38);x.lineTo(0.03,-0.38);x.stroke();x.beginPath();x.arc(0,-0.27,0.09,0.15,Math.PI-0.15);x.stroke();x.fillStyle='rgba(230,120,120,0.45)';x.beginPath();x.arc(-0.17,-0.28,0.05,0,7);x.arc(0.17,-0.28,0.05,0,7);x.fill();
  const pat=Math.sin(t*3.2)*0.08;x.strokeStyle='#b9a3d6';x.lineWidth=0.14;x.lineCap='round';x.beginPath();x.moveTo(0.35,0.05);x.quadraticCurveTo(0.7,0.35,0.95+pat,0.22-Math.abs(pat));x.stroke();x.fillStyle='#f0c8a8';x.beginPath();x.arc(0.98+pat,0.2-Math.abs(pat),0.07,0,7);x.fill();
  x.strokeStyle='#b9a3d6';x.beginPath();x.moveTo(-0.35,0.05);x.quadraticCurveTo(-0.6,0.3,-0.45,0.35);x.stroke();x.fillStyle='#fff';x.beginPath();x.ellipse(-0.45,0.38,0.14,0.04,0,0,7);x.fill();x.beginPath();rrect(x,-0.53,0.22,0.16,0.15,0.04);x.fill();
  x.strokeStyle='rgba(255,255,255,0.6)';x.lineWidth=0.02;for(let i=0;i<2;i++){x.beginPath();x.moveTo(-0.48+i*0.06,0.18);x.quadraticCurveTo(-0.52+i*0.06+Math.sin(t*2+i)*0.04,0.05,-0.47+i*0.06,-0.05);x.stroke();}x.restore();}
function drawCouch(x,X,Y,W,H,col){x.fillStyle='rgba(0,0,0,0.15)';x.fillRect(X+8,Y+H-6,W-16,10);x.fillStyle=col;x.beginPath();rrect(x,X,Y,W,H*0.7,18);x.fill();x.beginPath();rrect(x,X-14,Y+H*0.25,30,H*0.7,12);x.fill();x.beginPath();rrect(x,X+W-16,Y+H*0.25,30,H*0.7,12);x.fill();x.beginPath();rrect(x,X+10,Y+H*0.45,W-20,H*0.45,10);x.fill();
  for(let i=0;i<26;i++){const fx=X+10+((i*53)%(W-20)),fy=Y+8+((i*31)%(H*0.8));x.fillStyle=i%3?'rgba(255,240,230,0.55)':'rgba(190,60,80,0.55)';for(let k=0;k<5;k++){x.beginPath();x.arc(fx+Math.cos(k*1.26)*4,fy+Math.sin(k*1.26)*4,2.6,0,7);x.fill();}x.fillStyle='#f6d36a';x.beginPath();x.arc(fx,fy,1.8,0,7);x.fill();}x.fillStyle='#5a3a24';x.fillRect(X+6,Y+H*0.9,8,10);x.fillRect(X+W-14,Y+H*0.9,8,10);}
function exDrawAd(x,t){const W=EXW,H=EXH;x.save();
  if(t<3.3){x.fillStyle='#ffe9a8';x.fillRect(0,0,W,H);x.save();x.translate(W/2,H/2);x.rotate(t*0.25);for(let i=0;i<16;i++){x.fillStyle=i%2?'#ffe08a':'#ffd36e';x.beginPath();x.moveTo(0,0);x.arc(0,0,520,i/16*Math.PI*2,(i+1)/16*Math.PI*2);x.fill();}x.restore();drawLogo(x,W/2,H/2-20,1.0+Math.sin(t*3)*0.02,t);drawHound(x,W/2+150,H/2+150,60,{t,pose:'stand',jumper:['#3a6fd8','#ffd23a']});x.font='15px Arial,sans-serif';x.fillStyle='#8a5a2a';x.textAlign='center';x.fillText('est. 1998 · a retirement home for rescued greyhounds',W/2,H-30);}
  else if(t<10){const k=t-3.3;const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#86ccff');sky.addColorStop(1,'#e2f5ff');x.fillStyle=sky;x.fillRect(0,0,W,H);x.fillStyle='#fff3a0';x.beginPath();x.arc(540,80,42,0,7);x.fill();x.strokeStyle='rgba(255,240,150,0.7)';x.lineWidth=4;for(let i=0;i<12;i++){const a=i/12*Math.PI*2+k*0.4;x.beginPath();x.moveTo(540+Math.cos(a)*52,80+Math.sin(a)*52);x.lineTo(540+Math.cos(a)*70,80+Math.sin(a)*70);x.stroke();}
    x.fillStyle='#ffffff';for(const [cx,cy] of[[120+k*8,90],[330+k*5,60]]){x.beginPath();x.arc(cx,cy,24,0,7);x.arc(cx+26,cy+6,20,0,7);x.arc(cx-24,cy+8,18,0,7);x.fill();}
    x.fillStyle='#7cc95a';x.beginPath();x.moveTo(0,300);for(let i=0;i<=W;i+=20)x.lineTo(i,290-Math.sin(i/120)*30);x.lineTo(W,H);x.lineTo(0,H);x.fill();x.fillStyle='#5fb24a';x.beginPath();x.moveTo(0,360);for(let i=0;i<=W;i+=20)x.lineTo(i,350-Math.sin(i/90+1)*18);x.lineTo(W,H);x.lineTo(0,H);x.fill();
    x.fillStyle='#fff';for(let i=0;i<14;i++){x.fillRect(i*50,330,7,46);}x.fillRect(0,340,W,6);x.fillRect(0,360,W,6);for(let i=0;i<40;i++){x.fillStyle=i%2?'#ff7aa8':'#ffe36a';x.beginPath();x.arc((i*97)%W,390+((i*53)%80),4,0,7);x.fill();}
    drawHound(x,((k*190)%(W+300))-150,372,52,{t,pose:'run',jumper:['#d33b3b','#f4efe6']});drawHound(x,((k*150+260)%(W+300))-150,398,46,{t:t+0.3,pose:'run',coat:'#5a5a5e',far:'#3e3e42',dark:'#2a2a2a',jumper:['#3a6fd8','#ffd23a']});}
  else if(t<17){const k=t-10;const z=1+k*0.012;x.translate(W/2,H/2);x.scale(z,z);x.translate(-W/2,-H/2);x.fillStyle='#cfe3c6';x.fillRect(0,0,W,H);for(let i=0;i<120;i++){x.fillStyle=i%2?'rgba(255,255,255,0.5)':'rgba(220,150,160,0.5)';x.beginPath();x.arc((i*61)%W,(i*37)%300,3,0,7);x.fill();}
    x.fillStyle='#fff';x.fillRect(410,50,170,150);x.fillStyle='#bfe6ff';x.fillRect(420,60,150,130);x.fillStyle='#ffef9a';x.beginPath();x.arc(530,95,18,0,7);x.fill();x.fillStyle='#b98a5a';x.fillRect(0,330,W,H-330);
    drawCouch(x,40,230,250,130,'#d9a7a0');drawCouch(x,350,250,240,120,'#a9b7d9');drawHound(x,165,250,40,{t,pose:'roach',jumper:['#2f9a5a','#f4efe6']});drawHound(x,470,300,38,{t,pose:'lay',coat:'#e9e2d6',far:'#cfc6b8',dark:'#a99a88',jumper:['#d33b3b','#ffd23a']});
    x.fillStyle='#5a7a9a';x.font='bold 22px Arial,sans-serif';for(let i=0;i<3;i++){const zz=(k*0.7+i*0.33)%1;x.globalAlpha=1-zz;x.fillText('z',200+i*8+zz*20,220-zz*60);x.fillText('z',505+i*8+zz*20,265-zz*60);}x.globalAlpha=1;}
  else if(t<23.8){const k=t-17;x.fillStyle='#f6e6cf';x.fillRect(0,0,W,H);for(let i=0;i<10;i++){x.fillStyle='rgba(220,180,140,0.25)';x.fillRect(i*70,0,30,H);}x.fillStyle='#a87a50';x.fillRect(0,360,W,H-360);
    x.fillStyle='#7a5a3a';x.fillRect(520,300,90,10);x.fillRect(560,310,10,60);x.fillStyle='#fff';x.beginPath();x.ellipse(565,293,34,8,0,0,7);x.fill();x.fillStyle='#d9a050';x.fillRect(545,280,22,14);x.fillRect(568,282,20,12);
    drawCarer(x,250,250,120,t);drawHound(x,380,300,62,{t,pose:'stand',coat:'#d7a874',far:'#b98a5a',dark:'#8a6040',jumper:['#2f9a5a','#e9f4e9'],dir:-1});
    x.fillStyle='#e85a7a';x.beginPath();const hx=300,hy=150+Math.sin(k*3)*4;x.moveTo(hx,hy+10);x.bezierCurveTo(hx-26,hy-8,hx-12,hy-28,hx,hy-14);x.bezierCurveTo(hx+12,hy-28,hx+26,hy-8,hx,hy+10);x.fill();x.font='bold 16px "Arial Rounded MT Bold",Arial,sans-serif';x.fillStyle='#c03a5a';x.textAlign='center';x.fillText('BISCUIT',hx,hy+34);}
  else{const k=t-23.8;x.fillStyle='#bfe3ff';x.fillRect(0,0,W,H);for(let i=0;i<30;i++){const px=(i*83)%W,py=(i*47)%H;x.fillStyle='rgba(255,255,255,0.5)';x.beginPath();x.arc(px,py,8,0,7);for(let j=0;j<4;j++){x.arc(px-9+j*6,py-12-(j%3===0?0:4),3.5,0,7);}x.fill();}
    drawLogo(x,W/2,150,0.95,t);x.textAlign='center';x.font='bold 30px "Arial Rounded MT Bold",Arial,sans-serif';x.fillStyle='#e8742c';x.fillText('Sponsor a couch today.',W/2,270);x.font='18px Arial,sans-serif';x.fillStyle='#2a4a6a';x.fillText('Every dog deserves a soft landing.',W/2,302);
    drawHound(x,W/2-10,352,40,{t,pose:'stand',coat:'#d7a874',far:'#b98a5a',dark:'#8a6040',jumper:['#2f9a5a','#e9f4e9']});x.font='11px Arial,sans-serif';x.fillStyle='#5a7a9a';x.fillText('Happy Happy Play Place is a registered charity. Biscuit is not for sale. Biscuit is priceless.',W/2,H-16);}
  x.restore();if(EX.adCap&&t<29.5){x.font='bold 17px Arial,sans-serif';const lines=wrapText(x,EX.adCap,W-140);const bh=lines.length*22+12;x.fillStyle='rgba(0,0,0,0.78)';x.fillRect(60,H-40-bh,W-120,bh);x.fillStyle='#fff';x.textAlign='center';lines.forEach((l,i)=>x.fillText(l,W/2,H-40-bh+24+i*22));x.textAlign='left';}
  x.fillStyle='rgba(255,255,255,0.55)';x.font='bold 12px Arial,sans-serif';x.fillText('HHPP',W-52,24);}
function exDraw2D(){const x=EX.c2.getContext('2d');let key;const t=EX.st;if(EX.state==='boot')key='b'+exDrawBoot(x,t);else if(EX.state==='title')key='t'+exDrawTitle(x,t);else if(EX.state==='endC')key='c'+exDrawEndC(x,t);else if(EX.state==='ad'){exDrawAd(x,t);key='a'+Math.floor(t*30);}
  EX.c2t.needsUpdate=true;EX.c2key=key;}
function exNeed2D(){const t=EX.st;if(EX.state==='boot'){let n=0;for(const [at] of BOOT)if(t>=at)n++;return 'b'+(n*10+(Math.floor(t*3)%2));}if(EX.state==='title')return't'+(Math.floor(t*2)%2);if(EX.state==='endC')return'c'+((t>0.4)+(t>1.9)+(t>3.4));if(EX.state==='ad')return'a'+Math.floor(t*30);return null;}

/* ---------- render into the monitor */
const _ccol=new THREE.Color();
function renderExecutioner(){if(!EX.running||!EX.rt||!EX.built||typeof renderer.setRenderTarget!=='function')return;
  if(!SEAT.active){const p=PC.crt.mesh.localToWorld(V3(0,MON.sy,MON.fz));_pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_frus.setFromProjectionMatrix(_pv);if(!_frus.intersectsSphere(new THREE.Sphere(p,0.35)))return;if(now-EX.lastR<1/24)return;}
  EX.lastR=now;const is2D=!EX.is3D;if(is2D){const k=exNeed2D();if(k!==EX.c2key||EX.c2dirty){EX.c2dirty=false;exDraw2D();}}else if(EX.hudDirty)exDrawHUD();
  EX.q2.visible=is2D;EX.qh.visible=!is2D;EX.qr.visible=EX.state==='endD';EX.qr.material.opacity=EX.state==='endD'?0.18+0.14*Math.sin(EX.st*9):0;
  const fade=EX.state==='intro'?clamp(1-EX.st/1.2,0,1):(EX.ending==='C'?clamp(EX.endT/0.9,0,1):0);EX.qf.visible=fade>0;EX.qf.material.opacity=fade;
  const prev=renderer.getRenderTarget();renderer.getClearColor(_ccol);const pa=renderer.getClearAlpha();renderer.setRenderTarget(EX.rt);renderer.setClearColor(0x000000,1);renderer.clear(true,true,true);
  if(!is2D){renderer.render(EX.scene,EX.cam);renderer.clearDepth();}renderer.render(EX.ov,EX.ovCam);renderer.setRenderTarget(prev);renderer.setClearColor(_ccol,pa);}
