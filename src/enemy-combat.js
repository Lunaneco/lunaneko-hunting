import {BOSSES} from './enemies.js';
import {countryEnemyAttack} from './chapter-two-combat.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hard=g=>g.difficulty==='hard'?1.3:1;
const damageScale=(g,e)=>hard(g)*(e.type==='boss'&&g.act>=4?1.7*(e.elite?1.25:1):1);
function circle(g,e,x,z,radius,delay,damage,color){g.hazards.push({id:g.ids++,sourceId:e.id,kind:'sigil',x,z,radius,timer:delay,total:delay,damage:damage*damageScale(g,e),color});}
function line(g,e,angle,length,width,delay,damage,color,kind='beam'){
 g.hazards.push({id:g.ids++,sourceId:e.id,kind,shape:'line',angle,x:e.x+Math.sin(angle)*length/2,z:e.z+Math.cos(angle)*length/2,length,width,radius:width/2,timer:delay,total:delay,damage:damage*damageScale(g,e),color});
}
function shot(g,e,angle,{speed=7,damage=12,kind='enemyArrow',color=0xffb36d,radius=.25}={}){
 g.projectiles.push({id:g.ids++,owner:'enemy',sourceId:e.id,kind,color,x:e.x+Math.sin(angle)*(e.radius+.2),z:e.z+Math.cos(angle)*(e.radius+.2),vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,life:4,damage:damage*damageScale(g,e),radius});
 g.emit('enemyShot',{x:e.x,z:e.z,color});
}
function lockCast(e,duration,action){e.cast={remaining:duration,total:duration,...action};e.face=action.angle??e.face;}
function move(e,dx,dz,speed,dt){e.x+=dx*speed*dt;e.z+=dz*speed*dt;}
function charge(g,e,angle,delay,speed,duration,width,color){
 line(g,e,angle,speed*duration+e.radius*2,Math.max(width,e.radius*2),delay,0,color,'charge');lockCast(e,delay,{kind:'charge',angle,speed,duration});
}
function finishCast(g,e,c){
 if(c.kind==='charge'){e.rush={angle:c.angle,speed:c.speed,remaining:c.duration};return;}
 if(c.kind==='arrow')shot(g,e,c.angle);
 if(c.kind==='riceVolley'){
  shot(g,e,c.angle-.11,{kind:'enemyMusket',speed:10,damage:34,radius:.24,color:0xffb76c});
  e.salvo={timer:.18,remaining:2,index:1,angle:c.angle};
 }
 if(c.kind==='pollen')for(const offset of [-.5,-.25,0,.25,.5])shot(g,e,c.angle+offset,{kind:'enemyPollen',speed:7.2,damage:29,color:0xd6ed89,radius:.25});
 if(c.kind==='seed')for(const offset of [-.23,0,.23])shot(g,e,c.angle+offset,{kind:'enemySeed',speed:6,damage:15,color:0xffc56c,radius:.32});
 if(c.kind==='clockVolley')for(const offset of [-.3,-.15,0,.15,.3])shot(g,e,c.angle+offset,{kind:'enemyClock',speed:6.8,damage:16,color:0xffd079,radius:.27});
 if(c.kind==='stars'){
  const count=c.count,step=Math.PI*2/count;
  for(let i=0;i<count;i++){if(i===0||i===1)continue;shot(g,e,c.angle+i*step,{kind:e.bossId==='tempest'?'enemyFeather':'enemyMoon',speed:c.speed,damage:18,color:c.color,radius:.32});}
 }
}
function bossAttack(g,e){
 const spec=BOSSES[e.bossId],p=g.player,angle=Math.atan2(p.x-e.x,p.z-e.z),action=e.action++%3,color=spec.color;
 const empowered=(g.act>=4||e.bossId==='eclipse')&&e.hp<=e.maxHp*.5;
 e.special=g.act>=4?(empowered?3.1:4.2):(empowered?3.7:5.1);
 g.emit('bossAttack',{kind:e.bossId==='chronarch'?(action===0?'rune':'stars'):['rune','stars','charge'][action],label:spec.attacks[action],bossId:e.bossId});
 if(e.bossId==='treant'){
  if(action===0){for(let i=0;i<3;i++)circle(g,e,p.x+Math.sin(i*2.1)*i*2.4,p.z+Math.cos(i*2.1)*i*2.4,2.5,1.45+i*.2,22,color);lockCast(e,1.45,{kind:'chant'});}
  else if(action===1){line(g,e,angle,14,1,1,0,color,'aim');lockCast(e,1,{kind:'seed',angle});}
  else charge(g,e,angle,1.05,9,.6,3.2,color);
 }else if(e.bossId==='chronarch'){
  if(action===0){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;circle(g,e,p.x+Math.sin(a)*3,p.z+Math.cos(a)*3,1.6,1.5+i*.14,20,color);}lockCast(e,1.5,{kind:'chant'});}
  else if(action===1){for(let i=0;i<4;i++)line(g,e,angle+i*Math.PI/2,18,1.5,1.5,23,color);lockCast(e,1.5,{kind:'chant',angle});}
  else{line(g,e,angle,15,2.5,1.15,0,color,'aim');lockCast(e,1.15,{kind:'clockVolley',angle});}
 }else if(e.bossId==='tempest'){
  if(action===0){for(let i=0;i<3;i++)circle(g,e,p.x+(i-1)*4,p.z,2.1,1.55+i*.18,20,color);lockCast(e,1.55,{kind:'chant'});}
  else if(action===1)lockCast(e,1.1,{kind:'stars',angle,count:16,speed:5.3,color});
  else charge(g,e,angle,1.2,14,.85,3.5,color);
 }else if(e.bossId==='thornmaw'){
  if(action===0){for(let i=0;i<5;i++)circle(g,e,p.x+(i-2)*2.8,p.z,1.9,1.2+i*.22,23,color);lockCast(e,1.2,{kind:'chant'});}
  else if(action===1){circle(g,e,e.x,e.z,4.5,1.3,26,color);circle(g,e,e.x,e.z,6,2.05,26,color);lockCast(e,1.3,{kind:'chant'});e.recovery=.8;}
  else charge(g,e,angle,1.35,12,.85,4.2,color);
 }else if(e.bossId==='basalt'){
  if(action===0){for(const a of [-1,-.5,0,.5,1])line(g,e,angle+a,17,1.5,1.45,24,color);lockCast(e,1.45,{kind:'chant',angle});}
  else if(action===1)lockCast(e,1.2,{kind:'stars',angle,count:empowered?22:18,speed:6.3,color});
  else{line(g,e,angle,10,6,1.8,28,color);lockCast(e,1.8,{kind:'chant',angle});e.recovery=.65;}
 }else if(e.bossId==='ironbell'){
  if(action===0){for(let i=0;i<4;i++){line(g,e,angle+i*Math.PI/2,19,1.8,1.5,27,color);line(g,e,angle+Math.PI/4+i*Math.PI/2,19,1.8,2.25,27,color);}lockCast(e,1.5,{kind:'chant',angle});}
  else if(action===1){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;circle(g,e,p.x+Math.sin(a)*3.4,p.z+Math.cos(a)*3.4,1.8,1.4+i*.17,23,color);}lockCast(e,1.4,{kind:'chant'});}
  else{circle(g,e,p.x,p.z,4.3,2,32,color);lockCast(e,2,{kind:'chant',angle});e.recovery=.9;}
 }else if(e.bossId==='colossus'){
  if(action===0){circle(g,e,p.x,p.z,4.4,1.5,34,color);circle(g,e,e.x,e.z,4.1,1.95,28,color);circle(g,e,p.x+Math.sin(angle)*5,p.z+Math.cos(angle)*5,3.2,2.55,34,color);lockCast(e,1.5,{kind:'chant',angle});e.recovery=.9;}
  else if(action===1){for(let i=0;i<(empowered?6:4);i++){const a=i/6*Math.PI*2;circle(g,e,p.x+Math.sin(a)*4,p.z+Math.cos(a)*4,2.3,1.7+i*.16,27,color);}lockCast(e,1.7,{kind:'stars',angle,count:14,speed:5,color});}
  else{for(const offset of [-.48,.48])line(g,e,angle+offset,20,3.4,1.9,35,color);lockCast(e,1.9,{kind:'chant',angle});e.recovery=1.1;}
 }else{
  if(action===0){for(let i=0;i<(empowered?5:4);i++)circle(g,e,p.x+Math.sin(i*2.1)*i*1.8,p.z+Math.cos(i*2.1)*i*1.8,2.5,1.5+i*.17,24,color);lockCast(e,1.5,{kind:'chant'});}
  else if(action===1)lockCast(e,1.15,{kind:'stars',angle,count:empowered?18:14,speed:empowered?6:5,color});
  else charge(g,e,angle,1.05,empowered?15:12,.75,3.5,color);
 }
}
export function tickEnemyBehavior(g,e,dt,slow=1){
 const p=g.player,dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz)||.01,angle=Math.atan2(dx,dz),route=g.steerEnemy(e);
 if(e.type==='boss'&&(e.bossId==='eclipse'||g.act>=4)&&!e.enraged&&e.hp<=e.maxHp*.5){e.enraged=true;g.emit('bossPhase',{label:g.act>=4?'猛攻開始 — 攻撃の間隔が短くなる':'月蝕深化 — 予告を見て回避しよう'});}
 if(e.rush){const rush=e.rush;e.face=rush.angle;move(e,Math.sin(rush.angle),Math.cos(rush.angle),rush.speed*slow,Math.min(dt,rush.remaining));rush.remaining-=dt;if(rush.remaining<=0){e.rush=null;e.recovery=.8;}return;}
 if(e.cast){e.cast.remaining-=dt;if(e.cast.remaining<=0){const cast=e.cast;e.cast=null;finishCast(g,e,cast);}return;}
 if(e.salvo){const s=e.salvo;s.timer-=dt;if(s.timer<=0){shot(g,e,s.angle+(s.index-1)*.11,{kind:'enemyMusket',speed:10,damage:34,radius:.24,color:0xffb76c});s.index++;s.remaining--;s.timer+=.18;if(s.remaining<=0)e.salvo=null;}return;}
 if(e.recovery>0){e.recovery=Math.max(0,e.recovery-dt);return;}
 e.face=angle;
 if(e.type==='boss'){
  e.special-=dt;if(e.special<=0){bossAttack(g,e);return;}
  const preferred=e.bossId==='chronarch'?7:0;if(d>Math.max(preferred,e.radius+.6))move(e,route.x,route.z,e.speed*slow,dt);return;
 }
 if(['reaper','matchlock','stormlantern','pestmoth','ironcrab','ramcart'].includes(e.type)){countryEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,charge,lockCast});return;}
 if(e.type==='archer'||e.type==='mage'){
  e.special-=dt;
  if(e.special<=0&&d<=14){
   if(e.type==='archer'){line(g,e,angle,14,.45,.95,0,0xffb36d,'aim');lockCast(e,.95,{kind:'arrow',angle});e.special=2.9;}
   else{circle(g,e,p.x,p.z,2.1,1.65,15,0xd389ff);lockCast(e,1.65,{kind:'chant',angle});e.special=4.6;}
   g.emit('enemyCast',{id:e.id,type:e.type});return;
  }
  if(d>8.3)move(e,route.x,route.z,e.speed*slow,dt);
  else if(d<5.5){if(Math.hypot(e.x,e.z)<16.2)move(e,-dx/d,-dz/d,e.speed*.65*slow,dt);else move(e,-dz/d,dx/d,e.speed*.55*slow,dt);}
  return;
 }
 if(e.type==='charger'){e.special-=dt;if(e.special<=0&&d<12&&d>3){charge(g,e,angle,1,11,.55,1.8,0xff9b5f);e.special=4;g.emit('enemyCast',{id:e.id,type:e.type});return;}}
 if(d>e.radius+.6)move(e,route.x,route.z,e.speed*slow,dt);
}
