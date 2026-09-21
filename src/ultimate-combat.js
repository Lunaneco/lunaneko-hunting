import {ultimateFor} from './abilities.js';
const EPSILON=1e-8;

function pulse(game,effect){
  if(effect.kind==='bladeDance'){const source=game.sourceFor(effect.heroId);effect.x=source.x;effect.z=source.z;}
  game.emit(effect.kind==='bladeDance'?'saberPulse':'ultimatePulse',{x:effect.x,z:effect.z,radius:effect.radius,heroId:effect.heroId});
  for(const enemy of [...game.enemies])if(enemy.hp>0&&Math.hypot(enemy.x-effect.x,enemy.z-effect.z)<=effect.radius+enemy.radius)game.hit(enemy,effect.damage,effect.x,effect.z,true,false,effect.heroId,false);
  effect.pulsesLeft--;
}
function shoot(game,effect){
  const spec=ultimateFor(effect.heroId),source=game.sourceFor(effect.heroId),target=game.nearest(source.x,source.z,spec.range);
  const angle=target?Math.atan2(target.x-source.x,target.z-source.z):source.face;source.face=angle;
  game.projectiles.push({id:game.ids++,owner:'player',kind:'gun',ultimate:true,heroId:effect.heroId,x:source.x,z:source.z,vx:Math.sin(angle)*spec.speed,vz:Math.cos(angle)*spec.speed,speed:spec.speed,life:(spec.range+2)/spec.speed,damage:effect.damage,crit:true,radius:.32,pierce:spec.pierce,hitIds:[]});
  game.emit('ultimateShot',{x:source.x,z:source.z,angle,heroId:effect.heroId});effect.shotsLeft--;
}
export function castUltimate(game){
  const p=game.player,heroId=game.heroId(p.hero),spec=ultimateFor(heroId);
  if(game.phase!=='playing'||game.exitOpen||game.travelOpen||game.tutorial?.active||p.charge<100||game.ultimateActive(p.hero))return false;
  p.charge=0;p.invincible=Math.max(p.invincible,spec.immunity);
  const effect={id:game.ids++,kind:spec.kind,heroId,x:p.x,z:p.z,damage:game.skillDamage(heroId,spec.baseDamage),due:spec.interval,remaining:spec.duration??spec.shots*spec.interval,interval:spec.interval};
  game.emit('ultimate',{x:p.x,z:p.z,hero:p.hero,heroId,abilityId:spec.id});
  if(['sanctuary','bladeDance'].includes(spec.kind)){Object.assign(effect,{radius:spec.radius,pulsesLeft:spec.pulses});game.ultimateEffects.push(effect);game.heal(spec.heal);pulse(game,effect);}
  else{effect.shotsLeft=spec.shots;game.ultimateEffects.push(effect);shoot(game,effect);}
  return true;
}
export function tickUltimates(game,dt){
  for(const effect of game.ultimateEffects){
    effect.remaining-=dt;effect.due-=dt;
    while(effect.due<=EPSILON&&(effect.pulsesLeft>0||effect.shotsLeft>0)){
      if(['sanctuary','bladeDance'].includes(effect.kind))pulse(game,effect);else shoot(game,effect);effect.due+=effect.interval;
    }
  }
  game.ultimateEffects=game.ultimateEffects.filter(effect=>effect.remaining>EPSILON&&(['sanctuary','bladeDance'].includes(effect.kind)||effect.shotsLeft>0));
}
export function enemySpeedScale(game,enemy){
  let scale=1;
  for(const effect of game.ultimateEffects)if(effect.kind==='sanctuary'&&Math.hypot(enemy.x-effect.x,enemy.z-effect.z)<=effect.radius+enemy.radius){const spec=ultimateFor(effect.heroId);scale=Math.min(scale,enemy.type==='boss'?spec.bossSlow:spec.slow);}
  return scale;
}
