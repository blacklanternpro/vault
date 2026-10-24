
/* ============================================================ v5 · 5 — MOBILE CONTROLS
   p9m — a touch layout in landscape: a floating move stick on the left, drag-to-look on the right, and a small cluster of
   buttons that change with what you're doing (on foot / at the desk / on the couch). ACTION = LMB, ALT = RMB; while
   either is held, dragging on the right half becomes the pull for prying and ripping (look freezes). USE only shows when
   there's something to use, with its label. The tool icon cycles on tap and opens a radial picker on hold. Top-right menu:
   work light, quality (phone → full → performance), pause (in EXECUTIONER), look sensitivity, exit. Phones start in a
   phone quality tier: 1024 shadow map, one shadow-casting light, minor lamps off, pixel ratio ≤ 1.5, big paint canvases
   capped, CH 7 at 640×360. iPhones can't lock orientation, so portrait shows a rotate card. */
const MOB={on:false,el:{},sens:1.6,stick:null,look:null,act:false,alt:false,ctx:'',toolHold:null};
const TOOL_ACT=[['SWING','PRY'],['WEDGE','LEVER'],['CUT',''],['GRAB','THROW'],['DRAW','']];
function qualityCycle(){const order=['phone','full','perf'];const i=order.indexOf(perfMode?'perf':QTIER);const nx=order[(i+1)%3];perfMode=nx==='perf';phoneTier(nx==='phone');applyQuality();HUD.msg(nx==='phone'?'[PHONE QUALITY: 1 shadow · lighter lamps]':nx==='full'?'[FULL QUALITY: every shadow, every lamp]':'[PERFORMANCE MODE: shadows off · 75% res]',1.6);}
function phoneTier(on){QTIER=on?'phone':'full';SHADOW.lights.forEach((l,i)=>{const sz=on?1024:2048;l.castShadow=on?i===0:true;if(l.shadow.mapSize.x!==sz){if(l.shadow.map){l.shadow.map.dispose();l.shadow.map=null;}l.shadow.mapSize.set(sz,sz);}});SHADOW.dirty=true;}
function mobileCSS(){const st=document.createElement('style');st.textContent=`
html,body{touch-action:none;overscroll-behavior:none;-webkit-user-select:none;-webkit-touch-callout:none}
body.touch #slots,body.touch #stats,body.touch #hint,body.touch #use{display:none!important}
body.touch #tool{top:calc(8px + env(safe-area-inset-top));left:calc(12px + env(safe-area-inset-left));font-size:12px;padding:4px 9px}
body.touch #pwr{top:calc(8px + env(safe-area-inset-top));right:calc(64px + env(safe-area-inset-right));font-size:9px}
body.touch #msg{font-size:16px;bottom:34%;white-space:normal;max-width:70%;text-align:center}
body.touch #cap{font-size:17px;bottom:24%;max-width:62%}
body.touch #overlay .box{max-height:calc(100vh - 24px);overflow:auto;padding:18px 22px;max-width:86vw}body.touch #overlay table{display:none}body.touch #overlay h1{font-size:22px}body.touch #overlay .go{padding:14px;font-size:15px}
#mob{position:fixed;inset:0;z-index:6;display:none;touch-action:none}
body.touch.playing #mob{display:block}
.mb{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(18,19,22,.55);border:2px solid rgba(232,224,200,.55);color:#e8e0c8;font:bold 11px "Lucida Console",monospace;letter-spacing:1px;text-align:center;touch-action:none;-webkit-tap-highlight-color:transparent}
.mb.on{background:rgba(201,162,39,.8);color:#111;border-color:#c9a227}
.mb.hide{display:none}
#mAct{width:92px;height:92px;right:calc(26px + env(safe-area-inset-right));bottom:calc(26px + env(safe-area-inset-bottom));font-size:13px}
#mAlt{width:64px;height:64px;right:calc(134px + env(safe-area-inset-right));bottom:calc(30px + env(safe-area-inset-bottom))}
#mUse{right:calc(26px + env(safe-area-inset-right));bottom:calc(132px + env(safe-area-inset-bottom));border-radius:8px;height:34px;width:auto;padding:0 12px;background:rgba(232,224,200,.9);color:#111;white-space:nowrap}
#mR{width:52px;height:52px;right:calc(150px + env(safe-area-inset-right));bottom:calc(108px + env(safe-area-inset-bottom))}
#mStand{width:52px;height:52px;right:calc(206px + env(safe-area-inset-right));bottom:calc(32px + env(safe-area-inset-bottom))}
#mKick,#mJump,#mCrouch{width:50px;height:50px;bottom:calc(178px + env(safe-area-inset-bottom))}
#mKick{left:calc(18px + env(safe-area-inset-left))}#mJump{left:calc(76px + env(safe-area-inset-left))}#mCrouch{left:calc(134px + env(safe-area-inset-left))}
#mTool{width:58px;height:58px;left:calc(18px + env(safe-area-inset-left));top:calc(48px + env(safe-area-inset-top));border-radius:10px;font-size:10px}
#mMenu{width:44px;height:44px;right:calc(12px + env(safe-area-inset-right));top:calc(8px + env(safe-area-inset-top));border-radius:10px;font-size:20px}
#mChDn{width:56px;height:56px;right:calc(134px + env(safe-area-inset-right));bottom:calc(108px + env(safe-area-inset-bottom))}
#mPwr{width:48px;height:48px;right:calc(200px + env(safe-area-inset-right));bottom:calc(112px + env(safe-area-inset-bottom))}
#mVol{width:48px;height:48px;right:calc(258px + env(safe-area-inset-right));bottom:calc(112px + env(safe-area-inset-bottom))}
#mBase{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid rgba(232,224,200,.35);background:rgba(18,19,22,.25);display:none;pointer-events:none}
#mKnob{position:absolute;left:50%;top:50%;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;background:rgba(232,224,200,.55)}
#mPanel{position:absolute;right:calc(12px + env(safe-area-inset-right));top:calc(58px + env(safe-area-inset-top));display:none;flex-direction:column;gap:6px;background:rgba(15,16,18,.92);border:1px solid #2a2c2f;border-top:4px solid #c9a227;padding:10px}
#mPanel button{font:bold 12px "Lucida Console",monospace;letter-spacing:1px;padding:10px 14px;background:#1c1d20;color:#e8e0c8;border:1px solid #3a3c40;text-align:left}
#mRadial{position:absolute;inset:0;display:none}
#mRadial .mb{width:66px;height:66px;font-size:10px}
#rotate{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;flex-direction:column;background:#07080b;color:#e8e0c8;font:bold 15px "Lucida Console",monospace;letter-spacing:3px;text-align:center}
#rotate b{font-size:46px;display:block;margin-bottom:14px;animation:rot 1.6s ease-in-out infinite}
@keyframes rot{50%{transform:rotate(90deg)}}
@media (orientation:portrait){body.touch #rotate{display:flex}}`;document.head.appendChild(st);}
function mobileInit(){MOB.on=false;document.body.classList.add('touch');phoneTier(true);mobileCSS();const vp=document.querySelector('meta[name=viewport]');if(vp)vp.setAttribute('content','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  const go=document.getElementById('go');if(go)go.textContent='TAP TO ENTER';const box=overlay.querySelector('.box');if(box){const p=document.createElement('div');p.style.cssText='margin-top:12px;font-size:11px;letter-spacing:1px;color:#c9a227';p.textContent='TOUCH: left thumb = move (push to the edge to sprint) · drag right half = look · ACTION / ALT are LMB / RMB · hold ACTION or ALT and drag down = pull · ≡ = light, quality, pause, sensitivity';box.insertBefore(p,go);}
  const rot=document.createElement('div');rot.id='rotate';rot.innerHTML='<b>⟳</b>TURN YOUR PHONE SIDEWAYS<br><br><span style="font-size:11px;color:#8d877a">BEDSIT IS A LANDSCAPE BEDSIT</span>';document.body.appendChild(rot);
  const mob=document.createElement('div');mob.id='mob';document.body.appendChild(mob);const B=(id,txt)=>{const b=document.createElement('div');b.id=id;b.className='mb';b.textContent=txt;mob.appendChild(b);MOB.el[id]=b;return b;};
  const base=document.createElement('div');base.id='mBase';base.innerHTML='<div id="mKnob"></div>';mob.appendChild(base);MOB.el.base=base;MOB.el.knob=base.firstChild;
  B('mAct','ACTION');B('mAlt','ALT');B('mUse','USE');B('mR','RELOAD');B('mStand','STAND');B('mKick','KICK');B('mJump','JUMP');B('mCrouch','DUCK');B('mTool','HAMMER');B('mMenu','≡');B('mChDn','CH ▼');B('mPwr','PWR');B('mVol','VOL');
  const pan=document.createElement('div');pan.id='mPanel';mob.appendChild(pan);MOB.el.panel=pan;const PB=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn(b);});pan.appendChild(b);return b;};
  PB('WORK LIGHT',()=>inKey('KeyL'));PB('QUALITY',()=>inKey('KeyP'));MOB.el.pause=PB('PAUSE GAME',()=>{inKey('Tab');pan.style.display='none';});MOB.el.mute=PB('MUTE TV',()=>remoteCmd('mute'));MOB.el.sens=PB('LOOK SPEED: 1.6',b=>{MOB.sens=MOB.sens>=2.6?0.8:+(MOB.sens+0.3).toFixed(1);b.textContent='LOOK SPEED: '+MOB.sens;});PB('EXIT TO TITLE',()=>mobileExit());
  const rad=document.createElement('div');rad.id='mRadial';mob.appendChild(rad);MOB.el.radial=rad;['HAMMER','BAR','SAWZALL','HANDS','TEXTA'].forEach((t,i)=>{const b=document.createElement('div');b.className='mb';b.textContent=t;b.dataset.tool=i;rad.appendChild(b);});
  /* button behaviour */const hold=(id,down,up)=>{const b=MOB.el[id];b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{b.setPointerCapture(e.pointerId);}catch(_){}b.classList.add('on');S.resume();down();});const end=e=>{if(!b.classList.contains('on'))return;b.classList.remove('on');up&&up();};b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);};
  const vk=(code)=>[()=>{keys[code]=true;inKey(code,false);},()=>{keys[code]=false;}];
  hold('mAct',()=>{MOB.act=true;inDown(0);},()=>{MOB.act=false;inUp(0);});hold('mAlt',()=>{MOB.alt=true;inDown(2);},()=>{MOB.alt=false;inUp(2);});
  hold('mUse',...(()=>{const [d,u]=vk('KeyE'),[fd,fu]=vk('KeyF');return[()=>{if(SEAT.at==='desk')fd();else d();},()=>{u();fu();}];})());
  hold('mR',...vk('KeyR'));hold('mStand',...vk('KeyE'));hold('mKick',...vk('KeyF'));hold('mJump',...vk('Space'));hold('mCrouch',...vk('ShiftLeft'));hold('mChDn',()=>inWheel(100));hold('mPwr',()=>remoteCmd('power'));hold('mVol',()=>remoteCmd('vol'));
  hold('mMenu',()=>{pan.style.display=pan.style.display==='flex'?'none':'flex';});
  const tb=MOB.el.mTool;tb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();MOB.toolHold=setTimeout(()=>{MOB.toolHold=null;rad.style.display='block';const r=tb.getBoundingClientRect();[...rad.children].forEach((b,i)=>{const a=-0.2+i*0.42;b.style.left=(r.left+r.width/2+Math.cos(a)*120-33)+'px';b.style.top=(r.top+r.height/2+Math.sin(a)*120-33)+'px';b.classList.toggle('on',i===tool);});},380);});
  tb.addEventListener('pointerup',e=>{if(MOB.toolHold){clearTimeout(MOB.toolHold);MOB.toolHold=null;setTool((tool+1)%5);}});
  rad.addEventListener('pointerup',e=>{const t=e.target.closest&&e.target.closest('[data-tool]');if(t)setTool(+t.dataset.tool);rad.style.display='none';});rad.addEventListener('pointerdown',e=>{e.preventDefault();const t=e.target.closest&&e.target.closest('[data-tool]');if(t){setTool(+t.dataset.tool);rad.style.display='none';}});
  /* stick + look: any touch that doesn't start on a button */
  mob.addEventListener('pointerdown',e=>{if(e.target!==mob)return;e.preventDefault();S.resume();pan.style.display='none';const left=e.clientX<innerWidth*0.42;if(left&&!MOB.stick&&MOB.ctx!=='couch'){MOB.stick={id:e.pointerId,x:e.clientX,y:e.clientY};base.style.display='block';base.style.left=e.clientX+'px';base.style.top=e.clientY+'px';MOB.el.knob.style.transform='';}else if(!MOB.look){MOB.look={id:e.pointerId,x:e.clientX,y:e.clientY};}try{mob.setPointerCapture(e.pointerId);}catch(_){}});
  mob.addEventListener('pointermove',e=>{if(MOB.stick&&e.pointerId===MOB.stick.id){let dx=e.clientX-MOB.stick.x,dy=e.clientY-MOB.stick.y;const l=Math.hypot(dx,dy),R=55;if(l>R){dx*=R/l;dy*=R/l;}MOB.el.knob.style.transform=`translate(${dx}px,${dy}px)`;const k=Math.min(1,l/R),nx=dx/R,ny=dy/R;keys.KeyW=ny<-0.35;keys.KeyS=ny>0.35;keys.KeyA=nx<-0.35;keys.KeyD=nx>0.35;keys.KeyQ=k>0.95&&ny<-0.5;}
    else if(MOB.look&&e.pointerId===MOB.look.id){const dx=(e.clientX-MOB.look.x)*MOB.sens,dy=(e.clientY-MOB.look.y)*MOB.sens;MOB.look.x=e.clientX;MOB.look.y=e.clientY;if((MOB.act||MOB.alt)&&!SEAT.active)inPull(dx,dy);else inLook(dx,dy);}});
  const up=e=>{if(MOB.stick&&e.pointerId===MOB.stick.id){MOB.stick=null;base.style.display='none';keys.KeyW=keys.KeyS=keys.KeyA=keys.KeyD=keys.KeyQ=false;}if(MOB.look&&e.pointerId===MOB.look.id)MOB.look=null;};mob.addEventListener('pointerup',up);mob.addEventListener('pointercancel',up);
  document.addEventListener('touchmove',e=>{if(MOB.on)e.preventDefault();},{passive:false});document.addEventListener('gesturestart',e=>e.preventDefault());
  setInterval(mobileRelabel,120);}
function mobileEnter(){MOB.on=true;locked=true;overlay.style.display='none';document.body.classList.add('playing');S.init();S.resume();if(!S.loops.buzz&&power&&LIGHT.tubesAlive>0)S.startBuzz();if(!S.loops.fridge&&power)S.startFridge();
  const el=document.documentElement;if(el.requestFullscreen&&!/iPhone|iPad|iPod/.test(navigator.userAgent)){el.requestFullscreen({navigationUI:'hide'}).then(()=>{try{screen.orientation.lock('landscape').catch(()=>{});}catch(_){}}).catch(()=>{});}}
function mobileExit(){MOB.on=false;locked=false;document.body.classList.remove('playing');overlay.style.display='flex';MOB.el.panel.style.display='none';for(const k in keys)keys[k]=false;if(MOB.act){MOB.act=false;inUp(0);}if(MOB.alt){MOB.alt=false;inUp(2);}resetTool();if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});}
function mobileRelabel(){if(!MOB.on)return;const E=MOB.el;const ctx=SEAT.at||'foot';const show=(id,on)=>E[id].classList.toggle('hide',!on);
  if(ctx!==MOB.ctx){MOB.ctx=ctx;if(MOB.stick&&ctx==='couch'){MOB.stick=null;E.base.style.display='none';keys.KeyW=keys.KeyS=keys.KeyA=keys.KeyD=false;}}
  const foot=ctx==='foot',desk=ctx==='desk',couch=ctx==='couch';show('mKick',foot);show('mJump',foot);show('mCrouch',foot);show('mTool',foot);show('mR',desk);show('mStand',desk||couch);show('mChDn',couch);show('mPwr',couch);show('mVol',couch);
  E.pause.style.display=desk?'block':'none';E.mute.style.display=couch?'block':'none';
  if(foot){const a=TOOL_ACT[tool]||['ACTION',''];E.mAct.textContent=a[0];E.mAlt.textContent=a[1]||'—';show('mAlt',!!a[1]);E.mTool.textContent=['HAMMER','BAR','SAWZALL','HANDS','TEXTA'][tool];const u=(HUD.el.use&&HUD.el.use.textContent||'').replace(/^\[E\]\s*/,'');const h=held?'DROP':u;E.mUse.textContent=h;show('mUse',!!h);}
  else if(desk){E.mAct.textContent=EX.menu?'SELECT':'FIRE';E.mAlt.textContent='SIGHTS';show('mAlt',!EX.menu);E.mUse.textContent=EX.prompt?'F · '+EX.prompt:'F · USE';show('mUse',!!EX.prompt||!!EX.menu);}
  else if(couch){E.mAct.textContent='CH ▲';E.mAlt.textContent='SQUINT';show('mAlt',true);show('mUse',false);}}
