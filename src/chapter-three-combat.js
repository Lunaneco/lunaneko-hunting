// Chapter-three enemies commit to their warnings; follow-ups never retarget.
export const MOCHI_ARROW_ANGLES=Object.freeze([-.18,-.06,.06,.18]);
export const MOCHI_FIRE_ANGLES=Object.freeze([-.6,-.4,-.2,0,.2,.4,.6]);

export function mochiEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,charge,lockCast}){
 e.special-=dt;
 if(e.special<=0&&d<14){
  if(e.type==='mochiSlime'&&d>2.5&&d<10){
   charge(g,e,angle,1,9,.45,1.6,0x8bdcff);e.special=2.7;
  }else if(e.type==='mochiGoblin'&&d<4.8){
   for(const delay of [.9,1.4])line(g,e,angle,4.4,2.1,delay,31,0xffb477);
   lockCast(g,e,1.4,{kind:'chant',angle});e.special=1.3;e.recovery=.35;
  }else if(e.type==='mochiSkeleton'){
   for(const offset of MOCHI_ARROW_ANGLES)line(g,e,angle+offset,16,.5,.9,0,0xffb477,'aim');
   lockCast(g,e,.9,{kind:'mochiVolley',angle});e.special=1.6;
  }else if(e.type==='mochiDragon'){
   for(const offset of MOCHI_FIRE_ANGLES)line(g,e,angle+offset,14,.76,1.1,0,0xff896f,'aim');
   lockCast(g,e,1.1,{kind:'mochiFire',angle});e.special=2.2;
  }else if(e.type==='mochiWolf'&&d>3){
   charge(g,e,angle,.9,15,.65,2.1,0xff8b99);e.special=2.4;
  }else if(e.type==='mochiOrc'&&d<5){
   circle(g,e,e.x,e.z,3.4,1.1,44,0xffb589);circle(g,e,e.x,e.z,4.5,1.75,44,0xffb589);
   lockCast(g,e,1.75,{kind:'chant',angle});e.special=2;e.recovery=.55;
  }else if(e.type==='mochiGolem'&&d<10){
   for(let i=0;i<3;i++)circle(g,e,e.x+Math.sin(angle)*i*4,e.z+Math.cos(angle)*i*4,2.8,1.25+i*.4,44,0xffb589);
   lockCast(g,e,1.25,{kind:'chant',angle});e.special=2.5;e.recovery=.55;
  }
  if(e.cast){g.emit('enemyCast',{id:e.id,type:e.type});return;}
 }
 const ranged=e.type==='mochiSkeleton'||e.type==='mochiDragon';
 if(d>(ranged?7:e.radius+.6))move(e,route.x,route.z,e.speed*slow,dt);
}

export function mochiBossAttack(g,e,{angle,action,color,empowered,line,circle,charge,lockCast}){
 const p=g.player;
 if(e.bossId==='darkmochi'){
  if(action===0){
   for(const offset of [-.38,0,.38])line(g,e,angle+offset,12,1.4,1.05,25,color);
   for(const offset of [-.19,.19])line(g,e,angle+offset,12,1.4,1.7,25,color);
   lockCast(g,e,1.05,{kind:'chant',angle});
  }else if(action===1)lockCast(g,e,1.1,{kind:'stars',angle,count:empowered?22:18,speed:empowered?7.4:6.5,color});
  else charge(g,e,angle,1.05,empowered?17:15,.7,3.8,color);
 }else if(e.bossId==='dreammochi'){
  if(action===0){
   const count=empowered?8:6;
   for(let i=0;i<count;i++){const a=i/count*Math.PI*2;circle(g,e,p.x+Math.sin(a)*3.7,p.z+Math.cos(a)*3.7,1.9,1.2+i*.25,24,color);}
   lockCast(g,e,1.2,{kind:'chant',angle});
  }else if(action===1)lockCast(g,e,1.1,{kind:'stars',angle,count:empowered?24:20,speed:empowered?7:6,color});
  else{
   circle(g,e,p.x,p.z,3.5,1.5,31,color);circle(g,e,p.x,p.z,5,2.25,31,color);
   lockCast(g,e,1.5,{kind:'chant',angle});e.recovery=.7;
  }
 }else if(e.bossId==='bellmochi'){
  if(action===0){
   for(let step=0;step<(empowered?3:2);step++)for(let i=0;i<4;i++)line(g,e,angle+step*Math.PI/4+i*Math.PI/2,18,1.5,1.15+step*.7,25,color);
   lockCast(g,e,1.15,{kind:'chant',angle});
  }else if(action===1)lockCast(g,e,1.1,{kind:'stars',angle,count:empowered?28:24,speed:empowered?7.2:6.3,color});
  else{
   circle(g,e,e.x,e.z,4.5,1.45,30,color);circle(g,e,e.x,e.z,6,2.2,30,color);
   lockCast(g,e,1.45,{kind:'chant',angle});e.recovery=.65;
  }
 }else{
  if(action===0){
   const count=empowered?8:6;
   for(let i=0;i<count;i++){const a=i/count*Math.PI*2;circle(g,e,p.x+Math.sin(a)*4.3,p.z+Math.cos(a)*4.3,2.15,1.15+i*.2,28,color);}
   lockCast(g,e,1.15,{kind:'chant',angle});
  }else if(action===1)lockCast(g,e,1.1,{kind:'stars',angle,count:empowered?28:24,speed:empowered?7.6:6.8,color});
  else charge(g,e,angle,1.15,empowered?18:16,.75,4.2,color);
 }
}
