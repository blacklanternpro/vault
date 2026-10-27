/* ============================================================ v9.5 — hardening
   p9h — debris that only twitches in place goes to sleep.
   cannon-es only sleeps a body whose speed stays under its limit for sleepTimeLimit. A pile of 10 mm sheet, splinters and
   gypsum crumbs never gets there: each piece rocks a few millimetres back and forth at speed, and the rocking keeps waking its
   neighbours. So the pile twitches forever, every piece in it costs solver time, and the shadow maps re-render every frame.
   This pass looks at where each awake body has got to over 0.4 s windows instead of how fast it's going: two windows in a row
   with under 12 mm and 3 degrees of net movement and it's put to sleep. Anything that's really moving (falling, sliding,
   swinging, being carried) moves further than that and is left alone. A kick, a hit or the player walking into it wakes it. */
const SETTLE={t:0,slept:0};
function settleSleep(b){b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);b.sleep();SETTLE.slept++;}
function updateSettle(dt){SETTLE.t+=dt;if(SETTLE.t<0.2)return;const win=SETTLE.t;SETTLE.t=0;const hb=held&&held.ent,gb=grab&&grab.ent;
  for(const e of dynamics){const b=e.body;if(!e.alive||!b||b.type!==1||b===player.body)continue;
    if(b.sleepState===2||e===hb||e===gb||e.kin||e.cord||e.noSettle||e.hingeJoint&&e.hingeJoint.intact&&e.door){if(e._st)e._st=null;continue;}
    let s=e._st;if(!s){const P_={x:b.position.x,y:b.position.y,z:b.position.z,q:b.quaternion.clone()};e._st={...P_,q:P_.q,w:0,n:0,L:{x:P_.x,y:P_.y,z:P_.z,q:P_.q.clone(),w:0}};continue;}
    s.w+=win;s.L.w+=win;const q=b.quaternion;
    const moved=(r,lin,rot)=>{const d=Math.hypot(b.position.x-r.x,b.position.y-r.y,b.position.z-r.z);const dq=Math.min(1,Math.abs(r.q.x*q.x+r.q.y*q.y+r.q.z*q.z+r.q.w*q.w));return d>lin||2*Math.acos(dq)>rot;};
    const sleepIt=()=>{settleSleep(b);e._st=null;/* the pieces it's touching that are only rocking go down with it, or they take turns waking each other */for(const c of world.contacts){const o=c.bi===b?c.bj:c.bj===b?c.bi:null;if(!o||o.type!==1||o.sleepState===2||o===player.body)continue;const oe=o.ent;if(!oe||oe===hb||oe===gb||oe.kin||oe.cord||oe.noSettle||oe.door)continue;if(o.velocity.lengthSquared()<0.0225&&o.angularVelocity.lengthSquared()<1.44){settleSleep(o);oe._st=null;}}};
    /* rocking in place (a splinter across a step, a sheet on a crumb) gets a longer look: 1.6 s and under 4 cm / 14 degrees of net travel */
    if(s.L.w>=1.6){if(!moved(s.L,0.04,0.25)&&now-(e.wokeAt||0)>2){sleepIt();continue;}s.L.x=b.position.x;s.L.y=b.position.y;s.L.z=b.position.z;s.L.q.copy(q);s.L.w=0;}
    if(s.w<0.4)continue;
    if(!moved(s,e.frag?0.025:0.012,e.frag?99:0.05)&&now-(e.wokeAt||0)>1.2){/* a crumb spinning on the spot is still a crumb on the spot */if(++s.n>=2){sleepIt();continue;}}else s.n=0;
    s.x=b.position.x;s.y=b.position.y;s.z=b.position.z;s.q.copy(q);s.w=0;}}
