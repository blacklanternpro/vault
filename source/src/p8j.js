
/* ============================================================ CH 5 · FAMILY CLASSICS — THE GOODHEARTS, "Pancake Sunday"
   p8j — a homely sitcom about a perfect family, about two minutes on loop: the theme song over the house and the cast
   freeze-frames, act one in the kitchen (Dad's birthday pancakes, the ceiling, Dad's head), act two in the living room
   (a broken vase, a lesson, a group hug), the credits and the station promo. A 4:3 rerun pillarboxed on the widescreen
   channel, warm and a bit soft, with a studio audience that laughs, awws, woos and claps on cue. Steady sitcom cameras
   cut between a wide, two-shots and close-ups of one set drawn in world space. */

const GH_REEL=mkReel();CHANNELS[5]={name:'FAMILY CLASSICS',reel:GH_REEL};
const GH_DOUG={skin:'#f0c8a8',hair:'#6a4a2a',hairStyle:'short',shirt:'#7a9ac8',pants:'#6a6a58',glasses:true,wide:1.1,belly:true};
const GH_LINDA={skin:'#f2cdb0',hair:'#b8642c',hairStyle:'perm',shirt:'#e88aa0',collar:'#fff0f4',pants:'#5a5a7a',blush:true};
const GH_KELLY={skin:'#eec6a6',hair:'#3a2414',hairStyle:'pony',shirt:'#8a5ac8',pants:'#4a6aa0'};
const GH_TIMMY={skin:'#f2ccae',hair:'#c8a060',hairStyle:'messy',shirt:'#e85a3a',jumper:['#e85a3a','#f4d040'],pants:'#3a5a8a',kid:true};
const GH_V={DOUG:['tvm',{pitch:1.0,rate:1.05}],LINDA:['tv',{pitch:1.0,rate:1.0}],KELLY:['tv',{pitch:1.25,rate:1.1}],TIMMY:['tv',{pitch:1.75,rate:1.1}],KIDS:['tv',{pitch:1.5,rate:1.05}]};
function ghL(t,who,text){const v=GH_V[who];return[t,who,text,v[0],v[1]];}

/* ---------- the studio audience */
function ghLaugh(d,o,n,dur){const c=TVA.c;for(let p=0;p<n;p++){const t0=TVA.t+d+Math.random()*0.25;const f0=110+Math.random()*190;const rate=4.6+Math.random()*1.8;const len=dur*(0.6+Math.random()*0.5);
    const os=c.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(f0*1.1,t0);os.frequency.linearRampToValueAtTime(f0*0.85,t0+len);const g=c.createGain();g.gain.setValueAtTime(0.0001,t0);const k=Math.max(1,Math.floor(len*rate));
    for(let i=0;i<k;i++){const tt=t0+i/rate;const a=(1-i/k*0.7)*0.11;g.gain.setValueAtTime(0.0001,tt);g.gain.linearRampToValueAtTime(a,tt+0.03);g.gain.exponentialRampToValueAtTime(0.0001,tt+0.62/rate);}
    const b1=c.createBiquadFilter();b1.type='bandpass';b1.frequency.value=700+Math.random()*220;b1.Q.value=3;const b2=c.createBiquadFilter();b2.type='bandpass';b2.frequency.value=1150+Math.random()*260;b2.Q.value=4;os.connect(b1);os.connect(b2);b1.connect(g);b2.connect(g);g.connect(o);os.start(t0);os.stop(t0+len+0.1);}
  TVA.noise({dur:dur*0.9,gain:0.025*Math.sqrt(n),type:'bandpass',f:1400,q:0.6,att:0.08,delay:d},o);}
function ghAww(d,o,n){const c=TVA.c;for(let p=0;p<(n||10);p++){const t0=TVA.t+d+Math.random()*0.2;const f0=190+Math.random()*150;const len=1.2+Math.random()*0.5;const os=c.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(f0*1.15,t0);os.frequency.linearRampToValueAtTime(f0*0.8,t0+len);
    const g=c.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.06,t0+0.3);g.gain.exponentialRampToValueAtTime(0.0001,t0+len);const b1=c.createBiquadFilter();b1.type='bandpass';b1.frequency.value=760;b1.Q.value=3;const b2=c.createBiquadFilter();b2.type='bandpass';b2.frequency.value=1100;b2.Q.value=4;os.connect(b1);os.connect(b2);b1.connect(g);b2.connect(g);g.connect(o);os.start(t0);os.stop(t0+len+0.1);}}
function ghWoo(d,o,n){const c=TVA.c;for(let p=0;p<(n||4);p++){const t0=TVA.t+d+Math.random()*0.3;const f0=280+Math.random()*120;const os=c.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(f0,t0);os.frequency.exponentialRampToValueAtTime(f0*1.9,t0+0.5);os.frequency.linearRampToValueAtTime(f0*1.7,t0+0.9);
    const g=c.createGain();TVA.env(g,0.05,0.08,0.85,t0);const b=c.createBiquadFilter();b.type='bandpass';b.frequency.value=420;b.Q.value=2;os.connect(b);b.connect(g);g.connect(o);os.start(t0);os.stop(t0+1.0);}}
function ghReact(t,kind,size,cap){/* a cue: the audience reacts */return[{t,snd:true,fn(){const o=TVA.out();if(!o)return;if(kind==='laugh')ghLaugh(0,o,size||10,size>14?2.6:1.8);else if(kind==='aww')ghAww(0,o,size||12);else if(kind==='clap')IN.applause(0,o,size||3);else if(kind==='woo'){ghWoo(0,o,4);ghLaugh(0.2,o,10,2);}}},
  {t:t+0.01,fn(){tvSay('',cap||({laugh:size>14?'[THE AUDIENCE HOWLS]':'[AUDIENCE LAUGHS]',aww:'[AUDIENCE: AWWW]',clap:'[APPLAUSE]',woo:'[WHOOPS AND LAUGHTER]'})[kind],1.4);}}];}

/* ---------- music: the theme, and the slap-bass scene change */
const GH_MEL=[[67,67,71,74,72,71,69,0],[67,67,71,74,76,74,72,0],[72,72,76,76,74,72,71,69],[67,71,74,79,79,0,0,0]];
const GH_LYR=['Every morning, sunny side up','Love in the kitchen, love in a cup',"Nobody's perfect, except for us","We're the Goodhearts!"];
const GH_PROG=[[55,59,62],[48,52,55],[50,54,57],[55,59,62]];
function ghBand(from,to,sung){const b=beatGrid(128,from,to);return songCues(b,(j,d,o)=>{const bar=Math.floor(j/4),bt=j%4;const ch=GH_PROG[bar%4];const e=60/128/2;
  if(bt===0||bt===2){IN.bass(NT(ch[0]-12+(bt===2?7:0)),d,o,0.3,0.14);IN.kick(d,o,0.22);}if(bt===1||bt===3){IN.chord(ch.map(n=>NT(n+12)),d,o,0.3,'triangle',0.03);IN.clap(d,o,0.07);}
  IN.shaker(d,o,0.05);IN.shaker(d+e,o,0.035);TVA.tone({f:NT(ch[(j*2)%3]+24),dur:0.25,type:'sine',gain:0.03,delay:d},o);TVA.tone({f:NT(ch[(j*2+1)%3]+24),dur:0.2,type:'sine',gain:0.022,delay:d+e},o);
  if(sung&&bar>=2&&bar<10){const li=Math.floor((bar-2)/2),ni=((bar-2)%2)*4+bt;const n=GH_MEL[li][ni];if(n)sing(d,NT(n),li===3&&ni===3?1.6:0.42,0.17,o);if(n&&li===3)sing(d,NT(n-4),li===3&&ni===3?1.6:0.42,0.09,o);}});}
function ghSting(d,o){for(const [k,n] of[[0,43],[0.12,47],[0.24,50],[0.36,55],[0.6,55]])IN.bass(NT(n),d+k,o,0.14,0.18);for(const [k,n] of[[0.36,79],[0.48,83],[0.6,86]])TVA.tone({f:NT(n),dur:0.4,type:'sine',gain:0.04,delay:d+k},o);IN.clap(d+0.6,o,0.1);}

/* ---------- picture: 4:3, warm, steady cameras */
function ghShot(x,cam,fn){x.fillStyle='#000';x.fillRect(0,0,854,480);x.save();x.beginPath();x.rect(107,0,640,480);x.clip();const cx=clamp(cam.x,320/cam.z,640-320/cam.z),cy=clamp(cam.y,240/cam.z,480-240/cam.z);x.translate(427,240);x.scale(cam.z,cam.z);x.translate(-cx,-cy);fn();x.restore();
  x.drawImage(ghGrade(),107,0);}
function ghGrade(){/* the rerun look, baked once: a warm wash, soft scanlines and a brown vignette */if(GH_C.grade)return GH_C.grade;const c=mkCanvas(640,480),y=c.getContext('2d');y.fillStyle='rgba(255,196,120,0.09)';y.fillRect(0,0,640,480);y.fillStyle='rgba(255,255,255,0.035)';for(let i=0;i<480;i+=4)y.fillRect(0,i,640,2);
  const v=y.createRadialGradient(320,240,180,320,240,420);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(40,20,0,0.35)');y.fillStyle=v;y.fillRect(0,0,640,480);GH_C.grade=c;return c;}
const GH_C={};
function ghBug(x){x.save();x.globalAlpha=0.75;x.fillStyle='#fff';x.beginPath();x.arc(712,40,17,0,7);x.fill();tvText(x,'5',712,41,22,'#d8402a');tvText(x,'FAMILY CLASSICS',712,68,8,'#fff',{f:'Arial',w:'bold',ls:1});x.restore();}
function ghScript(x,t,px,py,size,col,o={}){x.save();x.font=`italic bold ${Math.round(size)}px "Brush Script MT","Segoe Script","Comic Sans MS",cursive`;x.textAlign=o.a||'center';x.textBaseline='middle';if(o.out){x.lineWidth=size*0.12;x.strokeStyle=o.out;x.lineJoin='round';x.strokeText(t,px,py);}x.fillStyle=col;x.fillText(t,px,py);x.restore();}
function ghHeart(x,cx,cy,s,col){x.save();x.translate(cx,cy);x.scale(s,s);x.fillStyle=col||'#e8405a';x.beginPath();x.moveTo(0,6);x.bezierCurveTo(-12,-4,-6,-14,0,-7);x.bezierCurveTo(6,-14,12,-4,0,6);x.fill();x.restore();}
/* people helpers: walk in from a side, talk while their line is up, look at whoever is talking */
function ghWho(lines,t){for(const [lt,w,text,,o] of lines){const d=text.length*0.068/((o&&o.rate)||1);if(t>=lt&&t<lt+d)return w;}return null;}
function ghToon(x,X,Y,S,base,lines,name,t,o){const talk=nwTalking(lines,name,t)||(name!=='DOUG'&&name!=='LINDA'&&nwTalking(lines,'KIDS',t));const w=ghWho(lines,t);
  drawToon(x,X,Y,S,Object.assign({},base,{t,mouth:talk?(Math.sin(t*15+name.length)>-0.1?'open':'smile'):(o&&o.rest)||'smile',look:w&&w!==name?(o&&o.lookTo?o.lookTo(w):0):0,tilt:talk?Math.sin(t*2.4)*0.04:0},o||{}));}

/* ---------- the opening titles: the house on Maple Lane */
function ghHouse(x,t){adSky(x,'#7ac4f4','#e4f4ff');adCloud(x,120+(t*6)%700,80,1.1);adCloud(x,470+(t*4)%400,60,0.8);x.fillStyle='#86c86a';x.fillRect(0,330,640,150);
  x.fillStyle='#a8c8e0';x.fillRect(150,150,340,200);for(let i=0;i<10;i++){x.fillStyle='rgba(255,255,255,0.35)';x.fillRect(150,156+i*20,340,2);}x.fillStyle='#c84a3a';x.beginPath();x.moveTo(130,155);x.lineTo(320,60);x.lineTo(510,155);x.closePath();x.fill();x.fillStyle='#8a3a2a';x.fillRect(420,70,30,60);
  for(const [wx,wy] of[[180,180],[400,180],[180,265],[400,265]]){x.fillStyle='#fff';x.fillRect(wx-4,wy-4,68,58);x.fillStyle='#ffe8a8';x.fillRect(wx,wy,60,50);x.fillStyle='#fff';x.fillRect(wx+28,wy,4,50);x.fillStyle='#3a6a9a';x.fillRect(wx-14,wy-4,10,58);x.fillRect(wx+66,wy-4,10,58);}
  x.fillStyle='#fff';x.fillRect(278,240,84,110);x.fillStyle='#d8402a';x.fillRect(288,250,64,100);x.fillStyle='#f4d040';x.beginPath();x.arc(340,302,4,0,7);x.fill();ghHeart(x,320,268,1.4,'#fff');
  x.fillStyle='#f4f0e8';x.fillRect(140,340,360,10);for(let i=0;i<13;i++)x.fillRect(150+i*27,330,4,22);
  x.fillStyle='#fff';for(let i=0;i<24;i++){x.fillRect(i*28-4,372,10,40);x.beginPath();x.moveTo(i*28-4,372);x.lineTo(i*28+1,364);x.lineTo(i*28+6,372);x.fill();}x.fillRect(0,384,640,6);x.fillRect(0,400,640,6);adTree(x,560,240,2.0,'#4aa04a');adTree(x,70,260,1.6,'#5ab05a');
  x.fillStyle='#f4f0e8';x.fillRect(250,410,140,70);x.fillStyle='#e8405a';for(let i=0;i<8;i++){x.beginPath();x.arc(60+i*14,420+Math.sin(i)*4,5,0,7);x.arc(470+i*14,424+Math.cos(i)*4,5,0,7);x.fill();}}
const GH_CAST=[['GREG HOLLOWAY','as DOUG',GH_DOUG,0],['JUDITH MARSH','as LINDA',GH_LINDA,1],['TIFFANY COLE','as KELLY',GH_KELLY,2],['BRANDON PIKE','as TIMMY',GH_TIMMY,3],['and PICKLES','as HIMSELF',null,4]];
function ghFamilyOnPorch(x,t,wave){const k=Math.sin(t*9)*0.4;const P=[[GH_DOUG,240,0],[GH_LINDA,300,0],[GH_KELLY,360,0],[GH_TIMMY,410,0]];for(const [b,px] of P)drawToon(x,px,352,b.kid?22:24,Object.assign({},b,{t,mouth:'grin',arms:wave?[[0.3,0.2],[2.6+k,3.0+k]]:[[0.3,0.2],[0.3,0.2]]}));drawHound(x,460,352,14,{t,pose:'stand',coat:'#d8a860',dark:'#8a5a30',jumper:['#4a7ac8','#f4efe6']});}
const GH_THEME_B=1.875;
const GH_THEME={id:'gh_theme',dur:22.2,draw(x,W,H,t){const bar=(t-0.3)/GH_THEME_B;const cast=bar>=2&&bar<10.5?Math.floor((bar-2)/1.6):-1;
    if(cast>=0&&cast<5){const c=GH_CAST[cast];ghShot(x,{x:320,y:240,z:1},()=>{ghHouse(x,t);ghFamilyOnPorch(x,t,true);});
      x.save();x.beginPath();x.rect(107,0,640,480);x.clip();x.fillStyle='rgba(255,248,230,0.55)';x.fillRect(107,0,640,480);x.save();x.beginPath();x.arc(330,215,120,0,7);x.clip();x.fillStyle='#ffe0a8';x.fillRect(200,90,260,250);
        if(c[2])drawToon(x,330,378,c[2].kid?70:62,Object.assign({},c[2],{t:0,mouth:'grin',arms:[[0.3,0.2],[2.4,2.8]],blush:true}));else drawHound(x,330,300,70,{t:0,pose:'stand',coat:'#d8a860',dark:'#8a5a30',jumper:['#4a7ac8','#f4efe6']});x.restore();
        x.strokeStyle='#fff';x.lineWidth=6;x.beginPath();x.arc(330,215,120,0,7);x.stroke();ghScript(x,c[0],560,200,34,'#f4c020',{out:'#7a3a10'});ghScript(x,c[1],560,250,26,'#fff',{out:'#7a3a10'});x.restore();}
    else{const z=1+sst(10.5,12,bar)*0.25;ghShot(x,{x:320,y:240+(z-1)*80,z},()=>{ghHouse(x,t);ghFamilyOnPorch(x,t,bar>9);});
      const a=bar<2?sst(0.2,1,bar):sst(10.3,10.8,bar);if(a>0){x.save();x.globalAlpha=a;ghScript(x,'The Goodhearts',427,190,88,'#f4c020',{out:'#8a3a10'});ghHeart(x,620,150,2.2,'#e8405a');x.restore();}}
    ghBug(x);},
  cues:[...ghBand(0.3,0.3+GH_THEME_B*11,true),...GH_LYR.map((l,i)=>({t:0.3+GH_THEME_B*(2+i*2)+0.01,fn(){tvSay('THEME','♪ '+l+' ♪',GH_THEME_B*2);}})),{t:0.3+GH_THEME_B*10.2,fn(){tvSay('THEME','♪ (The Goodhearts!) ♪',1.6);}},
    {t:0.3+GH_THEME_B*11,snd:true,fn(){const o=TVA.out();if(!o)return;IN.chord([NT(67),NT(71),NT(74),NT(79)],0,o,1.4,'triangle',0.05);IN.applause(0.2,o,3);ghWoo(0.3,o,3);}}]};

/* ---------- act one: the kitchen */
function ghKitchen(x,t,o){x.fillStyle='#f3e4b0';x.fillRect(0,0,640,480);x.fillStyle='#ead8a0';for(let i=0;i<27;i++)x.fillRect(i*24,26,8,280);x.fillStyle='#fbf4e0';x.fillRect(0,0,640,26);
  x.fillStyle='#e8eef4';x.fillRect(250,70,140,120);const sg=x.createLinearGradient(0,74,0,186);sg.addColorStop(0,'#7ac4f4');sg.addColorStop(1,'#cfeefc');x.fillStyle=sg;x.fillRect(256,76,128,108);adTree(x,290,140,0.8,'#5ab05a');x.fillStyle='#fff';x.fillRect(318,76,4,108);
  for(const cx of[226,374]){x.fillStyle='#fff';x.fillRect(cx,62,40,140);x.fillStyle='rgba(216,64,42,0.75)';for(let i=0;i<7;i++)x.fillRect(cx+(i%2)*20,62+i*20,20,20);}x.fillStyle='#d8402a';x.fillRect(222,58,176,8);
  for(const [cx,w] of[[20,200],[410,96]]){x.fillStyle='#c8945a';x.fillRect(cx,52,w,92);x.fillStyle='#b8844a';for(let i=0;i<w/50;i++){x.fillRect(cx+6+i*50,58,42,80);x.fillStyle='#e8d0a0';x.fillRect(cx+40+i*50,92,3,14);x.fillStyle='#b8844a';}}
  x.fillStyle='#e8e4dc';x.fillRect(0,298,640,14);x.fillStyle='#b8844a';x.fillRect(0,312,640,110);x.fillStyle='#a87440';for(let i=0;i<12;i++)x.fillRect(8+i*54,320,46,94);x.fillStyle='#e8d0a0';for(let i=0;i<12;i++)x.fillRect(46+i*54,360,3,14);
  /* stove + pan */x.fillStyle='#e8e8e8';x.fillRect(60,296,120,18);x.fillStyle='#2a2a2a';x.beginPath();x.ellipse(115,296,34,8,0,0,7);x.fill();x.fillRect(146,292,40,5);if(o.panCake){x.fillStyle='#d8a050';x.beginPath();x.ellipse(115,294,24,5,0,0,7);x.fill();}
  for(let i=0;i<5;i++){const k=((t*0.6+i*0.2)%1);x.fillStyle=`rgba(120,120,120,${0.35*(1-k)*o.smoke})`;x.beginPath();x.arc(115+Math.sin(t*2+i)*14*k,290-k*200,10+k*30,0,7);x.fill();}
  /* fridge */x.fillStyle='#f4f4f0';x.fillRect(528,130,96,292);x.fillStyle='#e0e0da';x.fillRect(528,214,96,3);x.fillStyle='#c8c8c4';x.fillRect(612,150,4,50);x.fillRect(612,230,4,90);x.fillStyle='#fff8a0';x.fillRect(546,240,52,40);x.fillStyle='#d8402a';x.font='bold 9px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText("MUM'S",572,252);x.fillText('BIRTHDAY!!',572,264);ghHeart(x,572,274,0.6);
  x.fillStyle='#4a8ad8';x.fillRect(552,160,24,16);x.fillStyle='#e85a3a';x.fillRect(584,170,18,18);
  /* smoke alarm */x.fillStyle='#fff';x.beginPath();x.arc(330,30,12,0,Math.PI);x.fill();x.fillStyle=o.beep&&Math.floor(t*6)%2?'#ff2020':'#601010';x.beginPath();x.arc(330,36,2.5,0,7);x.fill();
  if(o.ceil){x.fillStyle='#d8a050';x.beginPath();x.ellipse(o.ceil[0],o.ceil[1],26,6,0,0,7);x.fill();}
  /* floor */for(let r=0;r<3;r++)for(let i=0;i<16;i++){x.fillStyle=(r+i)%2?'#f4f0e8':'#d8402a';x.fillRect(i*40,422+r*30,40,30);}}
function ghTable(x){x.fillStyle='rgba(0,0,0,0.12)';x.fillRect(388,440,180,10);x.fillStyle='#f4f0e8';x.fillRect(380,370,196,12);x.fillStyle='#d8402a';for(let i=0;i<7;i++)x.fillRect(380+i*28,370,14,12);x.fillStyle='#a87440';x.fillRect(392,382,10,64);x.fillRect(554,382,10,64);
  x.fillStyle='#fff';x.beginPath();x.ellipse(470,368,24,6,0,0,7);x.fill();x.fillStyle='#f4c020';x.fillRect(430,350,12,18);x.fillStyle='#fff';x.fillRect(520,346,14,22);}
const GH_A1_L=[ghL(0.6,'DOUG',"Who's ready for Doug's famous Sunday pancakes?"),ghL(4.0,'TIMMY','Are they famous because of the fire brigade?'),ghL(7.8,'DOUG','That was one time, sport. And it was a very small fire.'),
  ghL(11.8,'KELLY',"Dad, the smoke alarm's doing that thing again."),ghL(15.0,'DOUG',"That's not a smoke alarm. That's a pancake alarm. It means they're ready!"),ghL(24.6,'DOUG','Well, butter my biscuits!'),
  ghL(27.4,'LINDA','What on earth is going on in here?'),ghL(30.3,'KIDS','Surprise! Happy birthday, Mum!'),ghL(33.0,'LINDA',"Oh, you shouldn't have."),ghL(35.0,'TIMMY',"We really shouldn't have.")];
function ghCake(t){/* the pancake: pan → flip (20.4) → ceiling (20.8–23.4) → Doug's head (23.8) */if(t<20.4)return{pan:true};if(t<20.8){const k=(t-20.4)/0.4;return{fly:[lerp(115,150,k),lerp(290,30,k*(2-k))]};}if(t<23.4)return{ceil:[150,30]};if(t<23.8){const k=(t-23.4)/0.4;return{fly:[150,lerp(30,206,k*k)]};}return{head:true};}
const GH_ACT1={id:'gh_act1',dur:41,draw(x,W,H,t){const L=GH_A1_L,ck=ghCake(t);const shots=[[0,{x:320,y:240,z:1}],[3.7,{x:470,y:320,z:1.9}],[7.4,{x:160,y:300,z:1.8}],[11.4,{x:270,y:290,z:1.35}],[15,{x:320,y:240,z:1}],[24.2,{x:150,y:262,z:2.4}],[27,{x:320,y:240,z:1}],[34.4,{x:380,y:300,z:1.45}]];let cam=shots[0][1];for(const [a,c] of shots)if(t>=a)cam=c;
    ghShot(x,cam,()=>{ghKitchen(x,t,{panCake:ck.pan,smoke:t<27?1:0.4,beep:t>11.2&&t<15,ceil:ck.ceil});
      const kx=t<11?720:lerp(700,410,sst(11,12.6,t)),lx=t<26.6?760:lerp(760,300,sst(26.6,28.2,t));const hug=t>37.4;
      const lookTo=(me)=>(w)=>{const P={DOUG:150,KELLY:kx,LINDA:lx,TIMMY:470,KIDS:440};return clamp(((P[w]||320)-me)/80,-1,1);};
      const flip=t>20.1&&t<20.6;ghToon(x,150,452,62,Object.assign({},GH_DOUG,{apron:'#f4f4f0'}),L,'DOUG',t,{arms:flip?[[0.3,0.2],[2.4,2.9]]:[[0.3,0.2],[1.0,1.6]],lookTo:lookTo(150),eyes:ck.head&&t<25?'wide':'open',rest:ck.head&&t<24.6?'o':'smile'});
      if(!flip&&!ck.head){x.strokeStyle='#888';x.lineWidth=4;x.beginPath();x.moveTo(150+1.0*62,452-2.0*62);x.lineTo(150+1.4*62,452-2.1*62);x.stroke();}
      if(ck.head){x.fillStyle='#d8a050';x.beginPath();x.ellipse(150,452-3.86*62,30,8,0.06,0,7);x.fill();x.beginPath();x.ellipse(132,452-3.7*62,6,10,0.3,0,7);x.ellipse(170,452-3.68*62,5,12,-0.2,0,7);x.fill();}
      if(ck.fly){x.fillStyle='#d8a050';x.save();x.translate(ck.fly[0],ck.fly[1]);x.rotate(t*14);x.beginPath();x.ellipse(0,0,24,7,0,0,7);x.fill();x.restore();}
      ghToon(x,470,420,58,GH_TIMMY,L,'TIMMY',t,{seated:!hug,lookTo:lookTo(470),arms:hug?[[1.2,1.6],[1.2,1.6]]:[[0.4,1.2],[0.4,1.2]]});ghTable(x);
      if(t>=11)ghToon(x,kx,452,58,GH_KELLY,L,'KELLY',t,{lookTo:lookTo(kx),arms:t>30.2&&t<32?[[2.6,3],[2.6,3]]:hug?[[1.2,1.6],[1.2,1.6]]:[[0.2,0.1],[0.6,2.2]]});
      if(t>=26.6)ghToon(x,lx,452,60,GH_LINDA,L,'LINDA',t,{lookTo:lookTo(lx),arms:hug?[[1.3,1.7],[1.3,1.7]]:t>32.6?[[0.9,2.6],[0.9,2.6]]:[[0.2,0.1],[0.2,0.1]],eyes:t>32.6&&t<35?'closed':'open',blush:true});});
    ghBug(x);},
  cues:[...nwSpeech(GH_A1_L),...ghReact(3.5,'laugh',8),...ghReact(7.2,'laugh',14),...ghReact(11.4,'laugh',10),...ghReact(20.1,'laugh',14),...ghReact(23.85,'laugh',18,'[SPLAT. THE AUDIENCE LOSES IT]'),...ghReact(24.3,'clap',3),...ghReact(26.3,'woo'),...ghReact(37.0,'laugh',10),...ghReact(38.6,'aww',14),
    {t:0.05,snd:true,fn(){const o=TVA.out();if(o)IN.applause(0,o,2.4);}},...[1,4,7,10,13,16,19].map(tt=>({t:tt,snd:true,fn(){const o=TVA.out();if(o)TVA.noise({dur:3,gain:0.018,type:'highpass',f:3800,att:0.5,delay:0},o);}})),
    {t:11.2,snd:true,fn(){const o=TVA.out();if(!o)return;for(let i=0;i<10;i++)TVA.tone({f:3150,dur:0.08,type:'square',gain:0.03,delay:i*0.34},o);}},{t:11.21,fn(){tvSay('','[THE SMOKE ALARM BEEPS]',1.4);}},
    {t:20.4,snd:true,fn(){const o=TVA.out();if(!o)return;TVA.noise({dur:0.3,gain:0.1,type:'bandpass',f:900,f1:2400,delay:0},o);TVA.tone({f:400,f1:1200,dur:0.35,type:'sine',gain:0.05,delay:0},o);TVA.tone({f:180,f1:90,dur:0.12,gain:0.15,delay:0.38},o);}},
    {t:23.8,snd:true,fn(){const o=TVA.out();if(!o)return;TVA.noise({dur:0.18,gain:0.3,type:'lowpass',f:700,delay:0},o);TVA.tone({f:140,f1:70,dur:0.2,gain:0.2,delay:0},o);}},
    {t:39.6,snd:true,fn(){const o=TVA.out();if(o)ghSting(0,o);}}]};

/* ---------- act two: the living room */
function ghLounge(x,t,o){x.fillStyle='#d8e4c8';x.fillRect(0,0,640,480);x.fillStyle='#c4d4b0';x.fillRect(0,250,640,180);x.fillStyle='#fff';x.fillRect(0,248,640,6);x.fillStyle='#fbf8f0';x.fillRect(0,0,640,20);
  /* stairs, left */x.fillStyle='#b8844a';for(let i=0;i<9;i++){x.fillRect(10+i*20,420-i*34,170-i*20,10);x.fillStyle='#f4f0e8';x.fillRect(10+i*20,430-i*34,170-i*20,24);x.fillStyle='#b8844a';}x.strokeStyle='#8a5a30';x.lineWidth=6;x.beginPath();x.moveTo(190,330);x.lineTo(10,90);x.stroke();x.lineWidth=3;for(let i=0;i<8;i++){x.beginPath();x.moveTo(178-i*22,314-i*30);x.lineTo(178-i*22,346-i*30+20);x.stroke();}
  /* photos */for(const [px,py,c] of[[250,70,'#e8a0a0'],[310,64,'#a0c0e8'],[370,72,'#e8d090']]){x.fillStyle='#8a5a30';x.fillRect(px-4,py-4,48,58);x.fillStyle=c;x.fillRect(px,py,40,50);for(let k=0;k<3;k++){x.fillStyle='#f0c8a8';x.beginPath();x.arc(px+10+k*10,py+26,4.5,0,7);x.fill();}ghHeart(x,px+20,py+12,0.4);}
  /* window + door, right */x.fillStyle='#fff';x.fillRect(436,60,84,120);x.fillStyle='#bfe4fa';x.fillRect(442,66,72,108);adTree(x,470,120,0.6,'#5ab05a');x.fillStyle='#e8a0b0';x.fillRect(426,52,16,140);x.fillRect(514,52,16,140);
  const dop=o.door||0;x.fillStyle='#fff';x.fillRect(536,150,92,272);x.fillStyle='#ffe8a8';x.fillRect(544,158,76,264);x.save();x.translate(544,158);x.scale(1-dop*0.8,1);x.fillStyle='#8a4a2a';x.fillRect(0,0,76,264);x.fillStyle='#e8c060';x.beginPath();x.arc(64,140,4,0,7);x.fill();x.restore();
  /* the vase plinth: empty */x.fillStyle='#8a5a30';x.fillRect(470,250,40,170);x.fillStyle='#a87440';x.fillRect(464,244,52,10);if(!o.broken){x.fillStyle='#4a8ad8';x.beginPath();x.ellipse(490,220,14,24,0,0,7);x.fill();}
  /* lamp */x.fillStyle='#8a6a4a';x.fillRect(206,260,6,160);x.fillStyle='#f4e8c0';x.beginPath();x.moveTo(186,262);x.lineTo(232,262);x.lineTo(222,226);x.lineTo(196,226);x.closePath();x.fill();
  /* rug + floor */x.fillStyle='#b8844a';x.fillRect(0,420,640,60);x.fillStyle='#c86a5a';x.beginPath();x.ellipse(330,452,190,26,0,0,7);x.fill();x.strokeStyle='#f4d040';x.lineWidth=3;x.beginPath();x.ellipse(330,452,170,20,0,0,7);x.stroke();
  drawCouch(x,236,300,200,120,'#d9a7a0');}
const GH_A2_L=[ghL(0.8,'TIMMY','Mum? I have to tell you something.'),ghL(4.0,'LINDA','What is it, sweetheart?'),ghL(6.4,'TIMMY','I broke your favourite vase. With a football. Inside. Where you said not to.'),
  ghL(13.0,'LINDA',"Timmy, thank you for telling the truth. That's worth more than any vase."),ghL(19.6,'TIMMY',"So I'm not in trouble?"),ghL(21.6,'LINDA',"Oh, you're grounded. But I'm proud of you."),
  ghL(26.0,'DOUG','Did somebody say family meeting?'),ghL(33.4,'KELLY','Every single week.')];
const GH_ACT2={id:'gh_act2',dur:39,draw(x,W,H,t){const L=GH_A2_L;const shots=[[0,{x:320,y:240,z:1}],[3.8,{x:350,y:290,z:1.8}],[6.2,{x:300,y:330,z:2.0}],[12.6,{x:330,y:310,z:1.5}],[19.4,{x:300,y:330,z:2.0}],[21.4,{x:340,y:300,z:1.5}],[25.4,{x:470,y:280,z:1.3}],[28.6,{x:320,y:240,z:1}],[33.0,{x:262,y:262,z:2.4}],[35.2,{x:320,y:240,z:1}]];let cam=shots[0][1];for(const [a,c] of shots)if(t>=a)cam=c;
    const freeze=t>36;const tt=freeze?36:t;
    ghShot(x,cam,()=>{ghLounge(x,tt,{broken:true,door:tt>25.4&&tt<27.4?sst(25.4,25.8,tt)*(1-sst(26.8,27.4,tt)):0});const hug=tt>28.6;const cx=hug?320:0;
      drawHound(x,hug?150:130,446,30,{t:tt,pose:hug?'stand':'lay',coat:'#d8a860',dark:'#8a5a30',jumper:['#4a7ac8','#f4efe6'],dir:1});
      const P={TIMMY:hug?300:290,LINDA:hug?345:390,DOUG:hug?395:lerp(700,560,sst(25.6,26.6,tt)),KELLY:hug?255:540};const lookTo=(me)=>(w)=>clamp(((P[w]||320)-me)/80,-1,1);
      if(tt>=25.6)ghToon(x,P.DOUG,452,62,GH_DOUG,L,'DOUG',tt,{lookTo:lookTo(P.DOUG),arms:hug?[[1.4,1.7],[1.4,1.7]]:[[0.3,0.2],[2.4,2.9]],handR:hug?null:'thumb'});
      if(tt>=25.6){x.fillStyle='#d8a050';x.beginPath();x.ellipse(P.DOUG,452-3.86*62,30,8,0.06,0,7);x.fill();}
      ghToon(x,P.LINDA,452,60,GH_LINDA,L,'LINDA',tt,{lookTo:lookTo(P.LINDA),arms:hug?[[1.4,1.7],[1.4,1.7]]:tt>13?[[0.9,2.2],[0.9,2.2]]:[[0.2,0.1],[0.2,0.1]],eyes:tt>18.2&&tt<19.4?'closed':'open'});
      ghToon(x,P.TIMMY,452,58,GH_TIMMY,L,'TIMMY',tt,{lookTo:lookTo(P.TIMMY),arms:hug?[[1.3,1.6],[1.3,1.6]]:[[0.5,-0.6],[0.5,-0.6]],rest:tt<19?'wobble':'smile',eyes:tt>6.2&&tt<11?'half':'open'});
      if(!hug&&tt<19){x.fillStyle='#4a8ad8';for(const [vx,vy] of[[-12,0],[10,6],[0,-10]]){x.beginPath();x.moveTo(P.TIMMY+vx-8,452-1.3*58+vy);x.lineTo(P.TIMMY+vx+6,452-1.4*58+vy);x.lineTo(P.TIMMY+vx+2,452-1.2*58+vy);x.closePath();x.fill();}}
      ghToon(x,P.KELLY,452,58,GH_KELLY,L,'KELLY',tt,{lookTo:tt>33&&tt<35.2?()=>0:lookTo(P.KELLY),arms:hug?[[1.4,1.7],[1.4,1.7]]:[[0.2,0.1],[0.6,2.2]],eyes:tt>33&&tt<35.2?'half':'open',rest:'flat',look:tt>33&&tt<35.2?0:undefined});});
    if(freeze){x.save();x.beginPath();x.rect(107,0,640,480);x.clip();x.fillStyle='rgba(255,236,200,0.25)';x.fillRect(107,0,640,480);ghScript(x,'The Goodhearts',427,90,64,'#f4c020',{out:'#8a3a10'});x.restore();}ghBug(x);},
  cues:[...nwSpeech(GH_A2_L),{t:0.05,snd:true,fn(){const o=TVA.out();if(o)IN.applause(0,o,2);}},...ghReact(11.5,'laugh',12),...ghReact(18.4,'aww',14),...ghReact(24.4,'laugh',12),...ghReact(28.2,'laugh',18,'[THE PANCAKE GETS A ROUND OF APPLAUSE]'),...ghReact(28.8,'clap',3),
    ...ghReact(30.6,'aww',16),...ghReact(34.8,'laugh',14),{t:25.4,snd:true,fn(){const o=TVA.out();if(!o)return;TVA.noise({dur:0.5,gain:0.06,type:'bandpass',f:600,f1:900,q:6,delay:0},o);TVA.tone({f:90,f1:60,dur:0.15,gain:0.15,delay:0.5},o);}},
    {t:36.0,snd:true,fn(){const o=TVA.out();if(!o)return;ghSting(0,o);IN.applause(0.3,o,2.6);}}]};

/* ---------- the credits + next week, then the station promo */
const GH_TAG={id:'gh_tag',dur:14,draw(x,W,H,t){ghShot(x,{x:320,y:240,z:1},()=>{ghLounge(x,36,{broken:true});const P=[[GH_KELLY,255,58],[GH_TIMMY,300,58],[GH_LINDA,345,60],[GH_DOUG,395,62]];for(const [b,px,s] of P)drawToon(x,px,452,s,Object.assign({},b,{t:0,mouth:'grin',arms:[[1.4,1.7],[1.4,1.7]]}));x.fillStyle='#d8a050';x.beginPath();x.ellipse(395,452-3.86*62,30,8,0.06,0,7);x.fill();drawHound(x,150,446,30,{t:0,pose:'stand',coat:'#d8a860',dark:'#8a5a30',jumper:['#4a7ac8','#f4efe6']});});
    x.save();x.beginPath();x.rect(107,0,640,480);x.clip();x.fillStyle='rgba(30,16,4,0.55)';x.fillRect(107,0,640,480);
    const cr=t<9.4?['THE GOODHEARTS','','DOUG · GREG HOLLOWAY','LINDA · JUDITH MARSH','KELLY · TIFFANY COLE','TIMMY · BRANDON PIKE','PICKLES · HIMSELF','','RECORDED IN FRONT OF A LIVE STUDIO AUDIENCE','NO FAMILIES WERE HARMED IN THE MAKING','OF THIS PROGRAMME. ONE VASE WAS.']:[];
    cr.forEach((c,i)=>{const y=470+i*34-t*58;if(y>-20&&y<500)(i===0?ghScript(x,'The Goodhearts',427,y,40,'#f4c020',{out:'#8a3a10'}):tvText(x,c,427,y,14,'#fff4dc',{f:'Arial',w:'bold',ls:2}));});
    if(t>=9.4){x.fillStyle='rgba(0,0,0,0.5)';x.fillRect(107,0,640,480);ghScript(x,'Next week...',427,200,52,'#f4c020',{out:'#8a3a10'});tvText(x,'DOUG FIXES THE ROOF',427,268,26,'#fff',{ls:3});}x.restore();ghBug(x);},
  cues:[...ghBand(0.2,9.2,false),{t:9.5,fn(){tvSay('ANNOUNCER','Next week on The Goodhearts: Doug fixes the roof.',3,'tvm',{pitch:0.8,rate:1.0});}},
    {t:12.4,snd:true,fn(){const o=TVA.out();if(!o)return;TVA.noise({dur:0.9,gain:0.35,type:'lowpass',f:900,delay:0},o);for(let i=0;i<8;i++)TVA.noise({dur:0.08,gain:0.15,type:'bandpass',f:1500+i*300,q:2,delay:0.1+i*0.07},o);IN.slam(0,o);ghLaugh(0.5,o,14,2);}},{t:12.41,fn(){tvSay('','[AN ALMIGHTY CRASH. THE AUDIENCE ROARS.]',1.6);}}]};
const GH_PROMO={id:'gh_promo',dur:8,draw(x,W,H,t){tvBG(x,854,480,'#ffd890','#ff9a6a');adBurst(x,427,210,700,24,'rgba(255,255,255,0.18)','rgba(255,255,255,0)',t*0.15);
    const s=sst(0,0.6,t);x.save();x.translate(427,190);x.scale(s,s);x.fillStyle='#fff';x.beginPath();x.arc(0,0,86,0,7);x.fill();tvText(x,'5',0,4,110,'#d8402a');ghHeart(x,44,-46,2,'#e8405a');x.restore();
    ghScript(x,'Family Classics',427,322,58,'#fff',{out:'#a8401a'});if(t>2.4)tvText(x,'ALL NIGHT. FAMILIES LIKE YOURS. BUT NICER.',427,392,17,'#7a2a10',{f:'Arial',w:'bold',ls:3});},
  cues:[{t:0.1,snd:true,fn(){const o=TVA.out();if(!o)return;for(const [k,n] of[[0,67],[0.18,71],[0.36,74],[0.6,79]])TVA.tone({f:NT(n),dur:0.6,type:'triangle',gain:0.06,delay:k},o);IN.chord([NT(55),NT(59),NT(62)],0.6,o,1.6,'triangle',0.04);}},
    {t:2.4,fn(){tvSay('CH 5','Family Classics. Families like yours. But nicer.',3.2,'tv',{pitch:1.1,rate:0.98});}},{t:5.8,snd:true,fn(){const o=TVA.out();if(o)ghAww(0,o,8);}}]};

for(const s of[GH_THEME,GH_ACT1,GH_ACT2,GH_TAG,GH_PROMO])tvReelAdd(s,GH_REEL);
