
/* ============================================================ CH 2 · NIGHT DESK — the news, about the bonuses
   p8i — a late news bulletin, about two and a half minutes on loop: the open, the lead (record executive bonuses), a live
   cross outside Kestrel Tower, the CEO's interview, vox pops, the markets ("the Bonus Index") and the sign-off, with a
   ticker crawling along the bottom the whole time. People are the ad engine's cartoon toons (drawToon); everyone who
   talks moves their mouth while their line is up. Voices use the browser's speech voice on the couch, captions always. */

const NW_REEL=mkReel();CHANNELS[2]={name:'NIGHT DESK',reel:NW_REEL};
const NW_NAVY='#0c1d3e',NW_RED='#c4161c',NW_GOLD='#e8b830';
/* the cast */
const NW_GRAHAM={skin:'#ecc0a0',hair:'#a8a8a6',hairStyle:'slick',shirt:'#1d2a48',lapel:'#141f38',collar:'#f4f4f0',tie:'#8a1a22',pants:'#1d2a48'};
const NW_SANDRA={skin:'#f0c8aa',hair:'#c89a58',hairStyle:'bun',shirt:'#a82a32',lapel:'#86202a',collar:'#f6eee6',pants:'#2a2a34',blush:true};
const NW_OAKES={skin:'#e6a882',hair:'#2a2622',hairStyle:'slick',shirt:'#24242c',lapel:'#16161c',collar:'#ffffff',tie:'#e8b830',pants:'#24242c',wide:1.18,sheen:true};
/* lines: [t, who, text, voice, {pitch,rate}] → cues + a "who's talking" lookup for mouths */
function nwSpeech(lines){return lines.map(([t,who,text,v,o])=>({t,fn(){tvSay(who,text,Math.max(2,text.length*0.072),v,o);}}));}
function nwTalking(lines,who,t){for(const [lt,w,text,,o] of lines){if(w!==who)continue;const d=text.length*0.068/((o&&o.rate)||1);if(t>=lt&&t<lt+d)return true;}return false;}
function nwMouth(lines,who,t,rest){return nwTalking(lines,who,t)?(Math.sin(t*15+who.length)>-0.1?'open':'flat'):(rest||'smile');}
const NW_V={graham:['tvm',{pitch:0.85,rate:1.0}],sandra:['tv',{pitch:1.05,rate:1.02}],oakes:['tvm',{pitch:0.62,rate:0.9}]};
function nwL(t,who,text,v){return[t,who,text,v[0],v[1]];}

/* ---------- music: the Night Desk theme (urgent ticking, timpani, brass stabs) */
function nwTimp(d,o,f){TVA.tone({f:f||72,f1:(f||72)*0.82,dur:0.9,gain:0.32,delay:d},o);TVA.noise({dur:0.25,gain:0.12,type:'lowpass',f:500,delay:d},o);}
function nwStab(d,o,ns,dur,g){for(const n of ns){TVA.tone({f:NT(n),dur:dur||0.22,type:'sawtooth',gain:g||0.035,att:0.01,delay:d},o);TVA.tone({f:NT(n)*1.004,dur:dur||0.22,type:'sawtooth',gain:(g||0.035)*0.7,att:0.01,delay:d},o);}}
function nwTheme(from,to,big){const b=beatGrid(116,from,to);const prog=[[62,65,69],[58,62,65],[60,64,67],[57,61,64]];return songCues(b,(j,d,o)=>{const bar=Math.floor(j/4),bt=j%4;const ch=prog[bar%4];const sp=60/116/4;
  for(let s=0;s<4;s++)IN.tick(d+s*sp,o,s===0?0.09:0.05,3400);if(bt===0){nwTimp(d,o,bar%2?65:72);nwStab(d,o,ch,0.3,big?0.04:0.026);IN.bass(NT(ch[0]-24),d,o,0.5,0.16);}
  if(bt===2&&bar%2===1)nwStab(d+sp*2,o,ch,0.12,0.03);if(bt===3)for(let s=0;s<4;s++)TVA.tone({f:NT(ch[s%3]+12),dur:0.08,type:'square',gain:0.018,delay:d+s*sp},o);});}
function nwSting(d,o){nwTimp(d,o,72);nwTimp(d+0.18,o,72);nwStab(d+0.36,o,[62,65,69,74],1.2,0.045);nwTimp(d+0.36,o,55);TVA.noise({dur:1.4,gain:0.06,type:'highpass',f:5000,delay:d+0.36},o);}
function nwBed(from,to){/* a soft pad under graphics */const b=beatGrid(58,from,to);return songCues(b,(j,d,o)=>{const ch=[[50,57,62,65],[46,53,58,62]][Math.floor(j/4)%2];if(j%4===0)for(const n of ch)TVA.tone({f:NT(n),dur:4.0,type:'triangle',gain:0.018,att:0.6,delay:d},o);IN.tick(d,o,0.03,3000);},4);}
function nwRoom(ts,f,g){return ts.map(t=>({t,snd:true,fn(){const o=TVA.out();if(o)TVA.noise({dur:2.4,gain:g||0.03,type:'bandpass',f:f||600,q:0.5,att:0.8,delay:0},o);}}));}

/* ---------- picture furniture: cached skyline, globe, desk, lower thirds, ticker, bug */
const NW_C={};
function nwSkyCanvas(){if(NW_C.sky)return NW_C.sky;const c=mkCanvas(900,300),x=c.getContext('2d');let px=0,i=0;while(px<900){const w=40+nbbH(i*3.3)*70,h=80+nbbH(i*7.1)*200;x.fillStyle=`rgb(${14+i%3*4},${22+i%4*3},${44+i%5*4})`;x.fillRect(px,300-h,w,h);
    for(let wy=300-h+8;wy<294;wy+=11)for(let wx=px+5;wx<px+w-6;wx+=9){if(nbbH(wx*1.7+wy*3.1+i)>0.62){x.fillStyle=nbbH(wx+wy)>0.5?'#f2d68a':'#c8d8f0';x.fillRect(wx,wy,4,5);}}
    if(nbbH(i*5.5)>0.7){x.fillStyle='#ff3030';x.fillRect(px+w/2-1,300-h-8,2,8);}px+=w+2;i++;}NW_C.sky=c;return c;}
function nwGlobe(x,cx,cy,r,t,col){/* one path: the rim, five parallels, six turning meridians */x.save();x.translate(cx,cy);x.strokeStyle=col||'rgba(120,180,255,0.55)';x.lineWidth=1.4;x.beginPath();x.arc(0,0,r,0,7);
  for(let i=-2;i<=2;i++){const yy=i*r*0.33,w=r*Math.sqrt(1-Math.pow(i*0.33,2));x.moveTo(-w,yy);x.lineTo(w,yy);}
  for(let i=0;i<6;i++){const a=((t*0.4+i/6)%1)*Math.PI;const w=Math.cos(a)*r;x.moveTo(0,-r);for(let k=1;k<=12;k++){const th=-Math.PI/2+k/12*Math.PI;x.lineTo(Math.cos(th)*w,Math.sin(th)*r);}}x.stroke();x.restore();}
function nwStudioBG(x,t){if(!NW_C.studio){const c=mkCanvas(854,480),y=c.getContext('2d');tvBG(y,854,480,'#0a1a3a','#04091a');y.globalAlpha=0.55;y.drawImage(nwSkyCanvas(),-20,120,900,300);y.globalAlpha=1;
    const g=y.createLinearGradient(0,0,854,0);g.addColorStop(0,'rgba(196,22,28,0.18)');g.addColorStop(0.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(40,110,220,0.22)');y.fillStyle=g;y.fillRect(0,0,854,480);
    y.strokeStyle='rgba(140,190,255,0.12)';y.lineWidth=1;for(let i=0;i<14;i++){y.beginPath();y.moveTo(0,40+i*28);y.lineTo(854,40+i*28+Math.sin(i)*6);y.stroke();}NW_C.studio=c;}
  x.drawImage(NW_C.studio,0,0);nwGlobe(x,680,170,120,t,'rgba(120,180,255,0.22)');}
function nwDesk(x,y){const g=x.createLinearGradient(0,y,0,480);g.addColorStop(0,'#2a4a8a');g.addColorStop(0.08,'#16305e');g.addColorStop(1,'#071330');x.fillStyle=g;x.beginPath();x.moveTo(-10,y+20);x.quadraticCurveTo(427,y-22,864,y+20);x.lineTo(864,490);x.lineTo(-10,490);x.closePath();x.fill();
  x.strokeStyle='rgba(180,210,255,0.55)';x.lineWidth=2;x.beginPath();x.moveTo(-10,y+20);x.quadraticCurveTo(427,y-22,864,y+20);x.stroke();x.fillStyle=NW_RED;x.fillRect(240,y+24,374,3);tvText(x,'NIGHT DESK',427,y+44,22,'rgba(230,236,255,0.8)',{ls:6});}
function nwBug(x,t){x.fillStyle=NW_RED;x.fillRect(28,22,40,34);tvText(x,'2',48,40,26,'#fff');x.fillStyle='rgba(12,29,62,0.85)';x.fillRect(68,22,74,34);tvText(x,'NEWS',105,34,13,'#fff',{ls:2});tvText(x,'NIGHT DESK',105,48,8,'#c8d4f0',{f:'Arial',ls:1});
  x.fillStyle='rgba(12,29,62,0.85)';x.fillRect(742,22,86,22);tvText(x,'LIVE 2:31',785,34,11,'#fff',{f:'Arial',ls:1});if(Math.floor(t*1.4)%2){x.fillStyle=NW_RED;x.beginPath();x.arc(734,33,4,0,7);x.fill();}}
const NW_TICK='MARKETS: BONUS INDEX ▲31.4%   ·   WAGES ▲0.4%   ·   KESTREL GROUP CEO "HUMBLED"   ·   LOCAL MAN STILL WAITING ON BOND   ·   RENTS HIT NEW RECORD; LANDLORDS "CAUTIOUSLY THRILLED"   ·   BANKS POST RECORD PROFIT, APOLOGISE FOR NOTHING   ·   GARY’S PROPERTY GROUP: INSPECTIONS EVERY THURSDAY   ·   BREAD RECLASSIFIED AS A LUXURY GOOD   ·   WEATHER: OVERCAST, CHANCE OF MORE BONUSES   ·   ';
function nwTicker(x){const y=446;x.fillStyle='rgba(8,18,44,0.94)';x.fillRect(0,y,854,34);x.save();x.beginPath();x.rect(118,y,736,34);x.clip();x.font='bold 15px Arial';x.textAlign='left';x.textBaseline='middle';x.fillStyle='#f0f2f8';const w=NW_C.tw||(NW_C.tw=x.measureText(NW_TICK).width);const off=(TVB.t*70)%w;x.fillText(NW_TICK,118-off,y+17);x.fillText(NW_TICK,118-off+w,y+17);x.restore();
  x.fillStyle=NW_RED;x.fillRect(0,y,118,34);tvText(x,'NIGHT DESK',59,y+17,13,'#fff',{ls:1});x.fillStyle=NW_GOLD;x.fillRect(0,y-2,854,2);}
function nwLower(x,a,name,role){if(a<=0)return;x.save();x.globalAlpha=clamp(a,0,1);const w=Math.max(330,name.length*15+60);const sl=(1-clamp(a,0,1))*-40;x.fillStyle='#f4f6fa';x.fillRect(40+sl,360,w,40);x.fillStyle=NW_RED;x.fillRect(40+sl,360,8,40);tvText(x,name,56+sl,381,21,NW_NAVY,{a:'left',ls:1});
  x.fillStyle=NW_NAVY;x.fillRect(40+sl,400,w*0.92,28);tvText(x,role,56+sl,414,12,'#e0e6f4',{a:'left',f:'Arial',w:'bold',ls:1});x.restore();}
function nwOTS(x,cx,cy,w,h,title,draw,t){x.fillStyle='rgba(0,0,0,0.35)';x.fillRect(cx+6,cy+6,w,h);x.fillStyle=NW_NAVY;x.fillRect(cx,cy,w,h);x.save();x.beginPath();x.rect(cx,cy,w,h);x.clip();draw(x,cx,cy,w,h,t);x.restore();
  x.fillStyle=NW_RED;x.fillRect(cx,cy+h-30,w,30);tvText(x,title,cx+w/2,cy+h-15,15,'#fff',{ls:2});x.strokeStyle='rgba(255,255,255,0.7)';x.lineWidth=2;x.strokeRect(cx,cy,w,h);}
function nwGold(x,cx,cy,s){/* a stack of gold bars */x.save();x.translate(cx,cy);x.scale(s,s);for(const [bx,by] of[[-40,10],[0,10],[40,10],[-20,-14],[20,-14],[0,-38]]){const g=x.createLinearGradient(bx-20,by-10,bx+20,by+10);g.addColorStop(0,'#fff0a0');g.addColorStop(0.5,NW_GOLD);g.addColorStop(1,'#8a6010');x.fillStyle=g;x.beginPath();x.moveTo(bx-20,by+10);x.lineTo(bx-14,by-10);x.lineTo(bx+14,by-10);x.lineTo(bx+20,by+10);x.closePath();x.fill();}x.restore();}
function nwHeadshot(x,cx,cy,r,who,t,mouth){/* static, so drawn once */const key='hs'+r;if(!NW_C[key]){const c=mkCanvas(2*r+8,2*r+8),y=c.getContext('2d');nwHeadshotDraw(y,r+4,r+4,r,who,0,mouth);NW_C[key]=c;}x.drawImage(NW_C[key],cx-r-4,cy-r-4);}
function nwHeadshotDraw(x,cx,cy,r,who,t,mouth){x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.clip();x.fillStyle='#3a5a9a';x.fillRect(cx-r,cy-r,2*r,2*r);drawToon(x,cx,cy+r*2.25,r*0.62,Object.assign({},who,{t,mouth:mouth||'grin'}));x.restore();x.strokeStyle='#fff';x.lineWidth=3;x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();}
function nwMic(x,hx,hy,s){x.strokeStyle='#1a1a1c';x.lineWidth=0.09*s;x.beginPath();x.moveTo(hx,hy);x.lineTo(hx-0.16*s,hy-0.42*s);x.stroke();x.fillStyle='#2a2a2e';x.beginPath();x.arc(hx-0.18*s,hy-0.48*s,0.11*s,0,7);x.fill();x.fillStyle=NW_RED;x.fillRect(hx-0.29*s,hy-0.4*s,0.22*s,0.13*s);x.fillStyle='#fff';x.font=`bold ${Math.round(0.1*s)}px Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText('2',hx-0.18*s,hy-0.33*s);}
function nwAnchor(x,t,lines,o){/* Graham at the desk, OTS box top left */o=o||{};nwStudioBG(x,t);if(o.ots)nwOTS(x,96,70,240,170,o.ots,o.otsDraw,t);
  const talk=nwTalking(lines,'GRAHAM PELL',t);drawToon(x,o.x||560,520,84,Object.assign({},NW_GRAHAM,{t,mouth:nwMouth(lines,'GRAHAM PELL',t,o.rest||'smile'),arms:[[0.32,0.95+(talk?Math.sin(t*3)*0.12:0)],[0.32,0.95-(talk?Math.sin(t*2.6)*0.1:0)]],tilt:Math.sin(t*0.7)*0.03+(talk?Math.sin(t*2.2)*0.03:0),browUp:o.brow||0,eyes:o.eyes,look:o.look||0}));
  nwDesk(x,384);x.fillStyle='#f4f2ea';x.save();x.translate((o.x||560)-40,390);x.rotate(-0.05);x.fillRect(-46,-6,92,10);x.restore();}

/* ---------- the open */
const NW_OPEN={id:'nw_open',dur:9,draw(x,W,H,t){tvBG(x,854,480,'#081638','#020612');const sw=sst(0,1.2,t);
    x.save();x.globalCompositeOperation='lighter';for(let i=0;i<7;i++){const yy=60+i*58,ph=(t*1.6+i*0.37)%1;const g=x.createLinearGradient(0,0,854,0);g.addColorStop(Math.max(0,ph-0.2),'rgba(0,0,0,0)');g.addColorStop(ph,i%2?'rgba(196,22,28,0.6)':'rgba(80,150,255,0.6)');g.addColorStop(Math.min(1,ph+0.02),'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,yy,854,3);}x.restore();
    nwGlobe(x,427,220,150*sw+10,t*1.6,'rgba(140,200,255,0.75)');x.globalAlpha=0.6;x.drawImage(nwSkyCanvas(),-20,300,900,190);x.globalAlpha=1;
    const sl=sst(2.2,2.7,t);if(sl>0){x.save();x.translate(427,224);x.scale(0.6+sl*0.4,0.6+sl*0.4);x.globalAlpha=sl;x.fillStyle=NW_RED;x.fillRect(-250,-46,70,92);tvText(x,'2',-215,2,76,'#fff');x.fillStyle='rgba(8,20,50,0.9)';x.fillRect(-180,-46,430,92);tvText(x,'NIGHT DESK',35,-6,58,'#f4f6fa',{ls:4});tvText(x,'WITH GRAHAM PELL',35,30,15,'#c8d4f0',{f:'Arial',w:'bold',ls:4});x.restore();}
    adFlash(x,t>2.2?Math.exp(-(t-2.2)*6)*0.6:0);if(t>5)tvText(x,'2:31 AM · THE NEWS, WHILE IT’S STILL NEWS',427,392,14,'#9fb0d8',{f:'Arial',w:'bold',ls:3});nwBug(x,t);},
  cues:[...nwTheme(0.1,8.4,true),{t:2.2,snd:true,fn(){const o=TVA.out();if(o)nwSting(0,o);}},{t:5.2,fn(){tvSay('ANNOUNCER','This is Night Desk, with Graham Pell.',3,'tvm',{pitch:0.7,rate:0.95});}}]};

/* ---------- the lead */
const NW_LEAD_L=[nwL(0.4,'GRAHAM PELL',"Good evening. The country's biggest companies have paid out record bonuses to their bosses this year.",NW_V.graham),
  nwL(8.4,'GRAHAM PELL','Topping the list: Kestrel Group chief executive Bradley Oakes, who took home forty-eight point six million dollars.',NW_V.graham),
  nwL(17.2,'GRAHAM PELL',"That's in a year the company cut six thousand two hundred jobs. Analysts say that's not a coincidence. It's the plan.",NW_V.graham),
  nwL(26.4,'GRAHAM PELL','Sandra Voight is outside Kestrel Tower tonight.',NW_V.graham)];
function nwBonusCard(x,t){/* full-screen graphic: the numbers */tvBG(x,854,480,'#0e2350','#050c22');nwGlobe(x,700,240,200,t,'rgba(120,180,255,0.12)');x.fillStyle=NW_RED;x.fillRect(0,40,854,6);
  tvText(x,'BONUS SEASON',427,84,34,'#fff',{ls:5});nwHeadshot(x,170,230,78,NW_OAKES,t,'grin');tvText(x,'BRADLEY OAKES',170,334,17,'#fff',{ls:1});tvText(x,'CEO · KESTREL GROUP',170,356,12,'#9fb0d8',{f:'Arial',w:'bold',ls:2});
  const rows=[['BONUS','$'+Math.round(48600000*sst(0.4,2.6,t)).toLocaleString('en-AU'),NW_GOLD,0.2],['JOBS CUT',Math.round(6200*sst(8.6,10.4,t)).toLocaleString('en-AU'),'#ff6a6a',8.4],['SHARE PRICE','▲ '+Math.round(14*sst(11,12,t))+'%','#7ae07a',10.8]];
  rows.forEach(([k,v,c,at],i)=>{const a=sst(at,at+0.4,t);if(a<=0)return;x.save();x.globalAlpha=a;const yy=170+i*80;x.fillStyle='rgba(255,255,255,0.08)';x.fillRect(310,yy-30,480,62);x.fillStyle=c;x.fillRect(310,yy-30,6,62);tvText(x,k,330,yy,15,'#c8d4f0',{a:'left',f:'Arial',w:'bold',ls:3});tvText(x,v,770,yy,30,c,{a:'right'});x.restore();});
  if(t>2.6&&t<8.4)nwGold(x,560,402,0.9);}
const NW_LEAD={id:'nw_lead',dur:31,draw(x,W,H,t){if(t>=8.9&&t<26){nwBonusCard(x,t-8.9);}else nwAnchor(x,t,NW_LEAD_L,{ots:t<8.9?'BONUS SEASON':'LIVE: KESTREL TOWER',otsDraw:(x,cx,cy,w,h)=>{if(t<8.9){x.fillStyle='#16305e';x.fillRect(cx,cy,w,h);nwGold(x,cx+w/2,cy+h/2-4,1.0);}else{x.drawImage(nwTowerCanvas(),cx-30,cy-40,w+60,h+60);}}});
    nwLower(x,sst(1,1.5,t)*(1-sst(6.5,7,t)),'GRAHAM PELL','NIGHT DESK');nwTicker(x);nwBug(x,t);},
  cues:[...nwSpeech(NW_LEAD_L),...nwBed(8.9,25.5),{t:0.1,snd:true,fn(){const o=TVA.out();if(o)nwTimp(0,o,60);}},{t:8.9,snd:true,fn(){const o=TVA.out();if(o)IN.kaching(0.4,o);}},{t:17.2,snd:true,fn(){const o=TVA.out();if(o){for(let i=0;i<6;i++)IN.tick(i*0.24,o,0.12,1800);}}}]};

/* ---------- the live cross: Kestrel Tower at night, in the rain */
function nwTowerCanvas(){if(NW_C.tower)return NW_C.tower;const W=940,H=560,k=W/420,c=mkCanvas(W,H),x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a1430');g.addColorStop(1,'#1a2440');x.fillStyle=g;x.fillRect(0,0,W,H);x.drawImage(nwSkyCanvas(),0,224,W,336);
  x.fillStyle='#16203a';x.fillRect(120*k,0,190*k,H);for(let wy=8;wy<290;wy+=12)for(let wx=128;wx<302;wx+=12){x.fillStyle=nbbH(wx*3.1+wy*1.7)>0.35?'rgba(220,235,255,0.75)':'rgba(40,60,100,0.8)';x.fillRect(wx*k,wy*H/300,8*k,8*H/300);}
  x.fillStyle='#e8e8ea';x.font='bold 49px Arial';x.textAlign='center';x.textBaseline='alphabetic';x.fillText('KESTREL',215*k,36*H/300);
  const lp=x.createRadialGradient(190,150,0,190,150,300);lp.addColorStop(0,'rgba(255,210,140,0.3)');lp.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=lp;x.fillRect(0,0,640,530);NW_C.tower=c;return c;}
function nwRain(x,t,a){x.strokeStyle=`rgba(190,210,240,${a||0.22})`;x.lineWidth=1;x.beginPath();for(let i=0;i<70;i++){const px=(nbbH(i)*900+t*120)%900-20,py=((nbbH(i*3)*520)+t*900)%520-30;x.moveTo(px,py);x.lineTo(px-7,py+22);}x.stroke();}
function nwLimo(x,cx,by,s){x.save();x.translate(cx,by);x.scale(s,s);x.fillStyle='#08080a';x.beginPath();x.moveTo(-260,0);x.lineTo(-260,-40);x.quadraticCurveTo(-240,-62,-180,-64);x.lineTo(150,-64);x.quadraticCurveTo(200,-62,230,-36);x.lineTo(262,-30);x.lineTo(262,0);x.closePath();x.fill();
  x.fillStyle='rgba(120,140,170,0.35)';for(let i=0;i<4;i++)x.fillRect(-170+i*90,-58,70,20);x.fillStyle='#202024';for(const wx of[-190,180]){x.beginPath();x.arc(wx,0,24,0,7);x.fill();}x.fillStyle='#fff6d0';x.fillRect(254,-28,8,8);x.fillStyle='#ff2a1a';x.fillRect(-262,-34,6,10);x.strokeStyle='rgba(255,255,255,0.4)';x.lineWidth=2;x.beginPath();x.moveTo(-250,-30);x.lineTo(250,-30);x.stroke();x.restore();}
function nwGolfBag(x,cx,by,s){x.save();x.translate(cx,by);x.scale(s,s);x.rotate(-0.35);x.fillStyle='#e8e4d8';x.fillRect(-0.22,-1.6,0.44,1.4);x.fillStyle=NW_GOLD;x.fillRect(-0.22,-1.2,0.44,0.12);x.strokeStyle='#c8c8c8';x.lineWidth=0.05;for(let i=0;i<4;i++){x.beginPath();x.moveTo(-0.12+i*0.08,-1.6);x.lineTo(-0.14+i*0.1,-2.1);x.stroke();}x.fillStyle='#202020';for(let i=0;i<4;i++){x.fillRect(-0.2+i*0.1,-2.18,0.1,0.08);}x.restore();}
const NW_FIELD_L=[nwL(0.5,'SANDRA VOIGHT','Graham, the lights are still on at Kestrel Tower, where six thousand staff were told this morning to reimagine their futures elsewhere.',NW_V.sandra),
  nwL(11.2,'SANDRA VOIGHT','Mr Oakes! Mr Oakes! A moment?',NW_V.sandra),nwL(13.7,'BRADLEY OAKES','No comment.',NW_V.oakes),nwL(15.4,'BRADLEY OAKES',"Well. One comment. I'm humbled.",NW_V.oakes),
  nwL(21.4,'SANDRA VOIGHT','The company says the bonus reflects exceptional leadership through a difficult period. A period, Graham, the company created. Back to you.',NW_V.sandra)];
const NW_FIELD={id:'nw_field',dur:33,draw(x,W,H,t){const sway=Math.sin(t*0.8)*6;x.save();x.translate(sway,Math.sin(t*1.1)*3);
    x.drawImage(nwTowerCanvas(),-40,-30);
    x.fillStyle='#1a1c24';x.fillRect(-60,400,980,120);x.fillStyle='rgba(255,220,160,0.12)';x.fillRect(-60,400,980,4);
    /* revolving door, bottom of the tower */x.fillStyle='#2a3450';x.fillRect(560,300,150,110);x.fillStyle='rgba(255,236,190,0.75)';x.fillRect(570,310,130,100);x.strokeStyle='#1a1e2a';x.lineWidth=4;const rv=t>10.6&&t<12?(t-10.6)*3:0;for(let k=0;k<3;k++){const a=rv+k*2.09;x.beginPath();x.moveTo(635,310);x.lineTo(635,410);x.moveTo(635-Math.cos(a)*60,320);x.lineTo(635-Math.cos(a)*60,410);x.stroke();}
    /* the limo pulls away after he gets in */const lx=t<18.4?430:430-Math.pow(t-18.4,2)*110;nwLimo(x,lx,446,0.9);
    /* Oakes: out of the door, across to the car, gone */if(t>10.8&&t<18.4){const k=sst(11.4,17.4,t);const ox=lerp(640,440,k),oy=420-(k>0&&k<1?Math.abs(Math.sin(t*8))*3:0);nwGolfBag(x,ox+24,oy-40,42);const thumb=t>15.4&&t<16.8;drawToon(x,ox,oy,38,Object.assign({},NW_OAKES,{t,mouth:nwMouth(NW_FIELD_L,'BRADLEY OAKES',t,'grin'),dir:t<13.4||t>16.8?-1:1,arms:[[0.25,0.15],[thumb?2.6:0.3,thumb?3.0:0.2]],handR:thumb?'thumb':null,look:-1}));}
    /* Sandra, front left */const turn=t>11.0&&t<21;drawToon(x,170,585,110,Object.assign({},NW_SANDRA,{t,mouth:nwMouth(NW_FIELD_L,'SANDRA VOIGHT',t,'flat'),dir:turn?-1:1,arms:[[0.15,0.08],[0.55,-2.4]],look:turn?1:0,browUp:turn?1:0}));
    {const d=turn?-1:1;nwMic(x,170+d*0.42*110,585-2.4*110,110);}
    nwRain(x,t,0.2);x.restore();nwLower(x,sst(1,1.5,t)*(1-sst(8,8.5,t))+sst(21.6,22.1,t),'SANDRA VOIGHT','FINANCE · KESTREL TOWER · LIVE');x.fillStyle=NW_RED;x.fillRect(742,50,86,18);tvText(x,'LIVE',785,59,11,'#fff',{ls:3});nwTicker(x);nwBug(x,t);},
  cues:[...nwSpeech(NW_FIELD_L),...nwRoom([0.1,2.3,4.5,6.7,8.9,11.1,13.3,15.5,17.7,19.9,22.1,24.3,26.5,28.7,30.9],380,0.04),
    {t:0.2,snd:true,fn(){const o=TVA.out();if(o)TVA.noise({dur:32,gain:0.012,type:'highpass',f:4000,att:1,delay:0},o);}},
    {t:18.0,snd:true,fn(){const o=TVA.out();if(o)IN.slam(0,o);}},{t:18.4,snd:true,fn(){const o=TVA.out();if(!o)return;TVA.tone({f:55,f1:95,dur:2.6,type:'sawtooth',gain:0.05,att:0.3,delay:0},o);TVA.noise({dur:2.4,gain:0.12,type:'lowpass',f:300,f1:1200,att:0.6,delay:0},o);}},
    {t:18.05,fn(){tvSay('','[A CAR DOOR. A VERY LONG CAR PULLS AWAY.]',2.2);}}]};

/* ---------- the interview: his office, earlier today */
const NW_INT_L=[nwL(0.8,'SANDRA VOIGHT','Mr Oakes, is forty-eight million dollars fair?',NW_V.sandra),
  nwL(4.8,'BRADLEY OAKES',"Look. It's been a difficult year. For a lot of people. Not me, specifically. But a lot of people.",NW_V.oakes),
  nwL(13.6,'SANDRA VOIGHT','What would you say to the staff who lost their jobs?',NW_V.sandra),
  nwL(17.8,'BRADLEY OAKES',"I'd say: I hear you. I see you. And I'll be saying it from the boat.",NW_V.oakes)];
function nwOffice(x,t,rev){tvBG(x,854,480,'#2a2018','#120c08');const wx=rev?60:420,ww=rev?380:420;x.fillStyle='#0a1430';x.fillRect(wx,40,ww,300);x.save();x.beginPath();x.rect(wx,40,ww,300);x.clip();x.drawImage(nwSkyCanvas(),rev?0:380,120,700,240);x.restore();
  x.strokeStyle='#3a2c20';x.lineWidth=6;x.strokeRect(wx,40,ww,300);x.fillStyle='rgba(255,220,160,0.08)';x.fillRect(0,0,854,480);}
const NW_INT={id:'nw_int',dur:25,draw(x,W,H,t){const onO=!(t<4.6||(t>13.4&&t<17.6));
    if(onO){nwOffice(x,t,false);/* the photo of himself, the putter */x.fillStyle='#c8a050';x.fillRect(120,120,90,110);x.fillStyle='#4a6a9a';x.fillRect(128,128,74,94);drawToon(x,165,262,20,Object.assign({},NW_OAKES,{t:0,mouth:'grin'}));x.strokeStyle='#888';x.lineWidth=3;x.beginPath();x.moveTo(300,330);x.lineTo(330,470);x.stroke();
      /* leather chair */x.fillStyle='#3a1a12';x.beginPath();rrect(x,330,150,240,330,40);x.fill();x.fillStyle='#4a2418';x.beginPath();rrect(x,350,170,200,300,30);x.fill();
      drawToon(x,450,560,86,Object.assign({},NW_OAKES,{t,mouth:nwMouth(NW_INT_L,'BRADLEY OAKES',t,'grin'),arms:[[0.6,1.6+Math.sin(t*2)*0.15],[0.6,1.6]],tilt:Math.sin(t*0.6)*0.05,eyes:nwTalking(NW_INT_L,'BRADLEY OAKES',t)&&Math.sin(t*1.3)>0.6?'half':'open'}));
      x.fillStyle='#2a1a10';x.fillRect(0,430,854,50);nwLower(x,sst(5,5.5,t)*(1-sst(11,11.5,t)),'BRADLEY OAKES','CEO · KESTREL GROUP · EARLIER TODAY');}
    else{nwOffice(x,t,true);x.fillStyle='#3a2c20';x.beginPath();rrect(x,430,190,220,300,30);x.fill();drawToon(x,560,580,80,Object.assign({},NW_SANDRA,{t,mouth:nwMouth(NW_INT_L,'SANDRA VOIGHT',t,'flat'),dir:-1,arms:[[0.6,1.5],[0.6,1.5]],look:-1,browUp:1}));
      x.fillStyle='#f4f2ea';x.fillRect(470,430,90,60);nwLower(x,sst(1,1.5,t)*(1-sst(3.8,4.2,t)),'SANDRA VOIGHT','FINANCE REPORTER');}
    tvText(x,'EARLIER TODAY',800,62,11,'#fff',{a:'right',f:'Arial',w:'bold',ls:2});nwTicker(x);nwBug(x,t);},
  cues:[...nwSpeech(NW_INT_L),...nwRoom([0.1,3,6,9,12,15,18,21],300,0.015)]};

/* ---------- vox pops */
const NW_VOX_L=[[0.5,'NURSE',"Forty-eight million? I'd settle for free parking at the hospital.",'tv',{pitch:1.2,rate:1.05}],
  [7.2,'TRADIE',"I get a bonus too. It's called Friday.",'tvm',{pitch:0.95,rate:1.1}],
  [13.8,'PENSIONER','In my day, a bonus was a biscuit. Now a biscuit is a bonus.','tv',{pitch:0.75,rate:0.85}]];
function nwMall(x,t,hue){const g=x.createLinearGradient(0,0,0,480);g.addColorStop(0,'#c8d4dc');g.addColorStop(1,'#8a949a');x.fillStyle=g;x.fillRect(0,0,854,480);
  const cols=['#d84a3a','#3a8ad8','#e8c040','#5aa060','#a05ab0'];for(let i=0;i<6;i++){const sx=((i*170-t*14)%1020+1020)%1020-90;x.fillStyle=cols[(i+hue)%5];x.globalAlpha=0.55;x.fillRect(sx,90,150,190);x.globalAlpha=0.8;x.fillStyle='#f4f4f4';x.fillRect(sx+10,100,130,24);x.globalAlpha=1;}
  x.fillStyle='rgba(255,255,255,0.25)';x.fillRect(0,0,854,480);for(let i=0;i<5;i++){const px=((i*230+t*(30+i*8))%1100)-120;x.globalAlpha=0.35;drawToon(x,px,420,40,{t,shirt:cols[(i+2)%5],pants:'#555',hair:'#333'});x.globalAlpha=1;}x.fillStyle='#7a7f86';x.fillRect(0,420,854,60);}
const NW_VOX={id:'nw_vox',dur:20.5,draw(x,W,H,t){const k=t<6.8?0:t<13.4?1:2;nwMall(x,t,k*2);const who=NW_VOX_L[k][1];const m=nwMouth(NW_VOX_L,who,t,'flat');
    if(k===0)drawToon(x,440,600,82,{t,skin:'#c89070',hair:'#4a2c1a',hairStyle:'bun',shirt:'#3a9a9a',pants:'#3a9a9a',collar:'#2a7a7a',mouth:m,arms:[[0.2,0.1],[0.6,2.4]],look:-0.5,tilt:-0.04});
    else if(k===1){drawToon(x,440,600,82,{t,skin:'#e0a888',hair:'#5a3a20',hairStyle:'short',shirt:'#e8f040',pants:'#3a4a6a',mouth:m,arms:[[0.3,0.2],[0.3,0.2]],look:-0.3});x.fillStyle='#c8d0d0';x.fillRect(440-0.6*82,600-2.3*82,1.2*82,8);x.fillRect(440-0.6*82,600-1.9*82,1.2*82,8);x.fillStyle='#5a3a20';x.beginPath();x.ellipse(440,600-3.05*82,0.3*82,0.16*82,0,0,Math.PI);x.fill();}
    else{drawToon(x,440,600,82,{t,skin:'#f0d0c0',hair:'#e8e8e8',hairStyle:'perm',shirt:'#8a6a9a',jumper:['#8a6a9a','#7a5a8a'],pants:'#555',glasses:true,mouth:m,arms:[[0.3,0.4],[0.5,1.4]],look:-0.4});x.fillStyle='#3a5a8a';x.fillRect(560,420,90,70);x.strokeStyle='#888';x.lineWidth=3;x.strokeRect(560,420,90,70);}
    /* the boom mic dipping in */x.fillStyle='#2a2a2e';x.beginPath();x.ellipse(250+Math.sin(t)*10,8,46,22,0.2,0,7);x.fill();
    const lt=t-[0,6.8,13.4][k];nwLower(x,sst(0.6,1.1,lt)*(1-sst(5.6,6,lt)),['NURSE','TRADIE','PENSIONER'][k],'VOX POP · CITY MALL');nwTicker(x);nwBug(x,t);},
  cues:[...NW_VOX_L.map(([t,who,text,v,o])=>({t,fn(){tvSay(who,text,Math.max(2,text.length*0.074),v,o);}})),...nwRoom([0.1,2.3,4.5,6.7,8.9,11.1,13.3,15.5,17.7],900,0.03),
    {t:6.75,snd:true,fn(){const o=TVA.out();if(o)TVA.noise({dur:0.08,gain:0.06,type:'highpass',f:3000,delay:0},o);}},{t:13.35,snd:true,fn(){const o=TVA.out();if(o)TVA.noise({dur:0.08,gain:0.06,type:'highpass',f:3000,delay:0},o);}}]};

/* ---------- the markets: the Bonus Index */
const NW_MKT_L=[nwL(0.5,'GRAHAM PELL','On the markets tonight, the Bonus Index closed up thirty-one per cent.',NW_V.graham),nwL(6.2,'GRAHAM PELL','Wages rose zero point four. Rents rose again.',NW_V.graham),
  nwL(10.0,'GRAHAM PELL','And bread is now classified as a luxury good.',NW_V.graham),nwL(14.0,'GRAHAM PELL','Your bond: still not coming back.',NW_V.graham)];
const NW_MKT={id:'nw_mkt',dur:18,draw(x,W,H,t){tvBG(x,854,480,'#06122c','#020812');x.fillStyle='#0c1d3e';x.fillRect(30,30,794,400);x.fillStyle=NW_RED;x.fillRect(30,30,794,40);tvText(x,'THE BONUS INDEX',427,51,22,'#fff',{ls:5});
    /* the chart: one line goes to the moon, one doesn't move */x.strokeStyle='rgba(255,255,255,0.1)';x.lineWidth=1;for(let i=0;i<6;i++){x.beginPath();x.moveTo(60,100+i*44);x.lineTo(470,100+i*44);x.stroke();}
    const n=Math.floor(60*sst(0.3,5,t));x.lineWidth=3;x.strokeStyle=NW_GOLD;x.beginPath();for(let i=0;i<=n;i++){const px=60+i*6.8,py=320-Math.pow(i/60,2.2)*210-Math.sin(i*1.3)*6;i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();
    x.strokeStyle='#ff6a6a';x.beginPath();for(let i=0;i<=n;i++){const px=60+i*6.8,py=318-i*0.06+Math.sin(i*0.9)*2;i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();
    if(n>8){tvText(x,'EXEC BONUSES',120,120,12,NW_GOLD,{a:'left',f:'Arial',w:'bold'});tvText(x,'WAGES',120,300,12,'#ff8a8a',{a:'left',f:'Arial',w:'bold'});}
    const rows=[['BONUS INDEX','▲ 31.4%',NW_GOLD,0.6],['WAGES','▲ 0.4%','#e0e0e0',6.2],['RENT','▲ 9.8%','#ff8a8a',8.0],['BREAD','LUXURY GOOD','#e0c080',10.0],['YOUR BOND','▼ 100%','#ff4a4a',14.0]];
    rows.forEach(([k,v,c,at],i)=>{const a=sst(at,at+0.3,t);if(a<=0)return;const yy=100+i*62;const flip=1-sst(at,at+0.25,t);x.save();x.translate(0,yy);x.scale(1,1-flip*0.9);x.fillStyle='rgba(255,255,255,0.07)';x.fillRect(500,-24,300,50);tvText(x,k,514,0,15,'#c8d4f0',{a:'left',f:'Arial',w:'bold',ls:2});tvText(x,v,786,0,22,c,{a:'right'});x.restore();});
    nwTicker(x);nwBug(x,t);},
  cues:[...nwSpeech(NW_MKT_L),...nwBed(0.2,17.5),{t:14.0,snd:true,fn(){const o=TVA.out();if(o)TVA.tone({f:220,f1:110,dur:0.9,type:'triangle',gain:0.06,delay:0},o);}}]};

/* ---------- the sign-off */
const NW_CLOSE_L=[nwL(0.4,'GRAHAM PELL','Tomorrow: overcast, with a chance of more bonuses.',NW_V.graham),nwL(4.6,'GRAHAM PELL',"I'm Graham Pell. Goodnight.",NW_V.graham)];
const NW_CLOSE={id:'nw_close',dur:12,draw(x,W,H,t){if(t<7.4){nwAnchor(x,t,NW_CLOSE_L,{rest:t>6.6?'smile':'flat',ots:'WEATHER',otsDraw:(x,cx,cy,w,h)=>{x.fillStyle='#5a6a80';x.fillRect(cx,cy,w,h);adCloud(x,cx+w/2-30,cy+50,0.9);adCloud(x,cx+w/2+40,cy+70,0.7);nwGold(x,cx+w/2,cy+h-56,0.55);x.fillStyle='rgba(200,220,255,0.5)';for(let i=0;i<10;i++)x.fillRect(cx+30+i*18,cy+92+((t*60+i*13)%30),2,8);}});nwTicker(x);nwBug(x,t);return;}
    const k=t-7.4;tvBG(x,854,480,'#081638','#020612');nwGlobe(x,427,200,130,t,'rgba(140,200,255,0.4)');x.fillStyle=NW_RED;x.fillRect(222,262,70,70);tvText(x,'2',257,298,56,'#fff');x.fillStyle='rgba(8,20,50,0.9)';x.fillRect(292,262,340,70);tvText(x,'NIGHT DESK',462,298,42,'#f4f6fa',{ls:3});
    x.save();x.beginPath();x.rect(0,350,854,90);x.clip();const cr=['NEWSREADER  GRAHAM PELL','FINANCE  SANDRA VOIGHT','BONUS  NOT YOURS','NIGHT DESK RETURNS IN A MOMENT'];cr.forEach((c,i)=>tvText(x,c,427,452+i*30-k*32,14,'#c8d4f0',{f:'Arial',w:'bold',ls:3}));x.restore();nwBug(x,t);},
  cues:[...nwSpeech(NW_CLOSE_L),{t:6.9,snd:true,fn(){const o=TVA.out();if(o)nwSting(0,o);}},...nwTheme(8.2,11.8,false)]};

for(const s of[NW_OPEN,NW_LEAD,NW_FIELD,NW_INT,NW_VOX,NW_MKT,NW_CLOSE])tvReelAdd(s,NW_REEL);
