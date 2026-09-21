import {fieldFor,layoutFor,walkingLayout,heightAt,contains,projectInside,moveWithin,navigation,clearPath,spawnPoint,ROUTE_PORTALS,ROUTE_REWARD} from './terrain.js';
import {ENEMY_TYPES,BOSSES,ELITE_BOSS_MULTIPLIER,enemyForSpawn,distanceToHazard,isRangedEnemy} from './enemies.js';
import {tickEnemyBehavior} from './enemy-combat.js';
import {ACTS,isActUnlocked,completeAct} from './acts.js';
import {castUltimate,tickUltimates,enemySpeedScale} from './ultimate-combat.js';
import {ultimateFor} from './abilities.js';
import {bossWeaponTicket,weaponAttackProfile,equippedWeapon} from './weapons.js';
import {advanceMissions,claimActMissions,missionsFor,trialStatus} from './missions.js';
import {skillsForParty} from './blessings.js';
import {normalizeParty} from './party.js';
import {availableHeroes,isHeroUnlocked} from './recruitment.js';
import {FirstBattleTutorial} from './tutorial.js';
import {normalizeProgression,characterProgress,combatStats,awardCharacterXp,grantMaterials,grantLimitStone,ENEMY_REWARDS} from './progression.js';
import {MATERIALS,enemyMaterials,gateMaterials,ultimateBonuses} from './talents.js';
export const ARENA_RADIUS = 18.5;
export const ATTACK_DURATION = .35;
export const MELEE_MIN_DOT = -.15;
export const STAGE_EXIT = Object.freeze({x:0,z:-16.6,radius:1.7});
export const HEROES = [
  { id: 'nyanluna', name: 'にゃんるな', title: '月光の魔法使い', color: '#d9baff', range:12, damage:17, baseHp:180, baseDefense:8, interval:.58, skillPower:1.5, chargeRate:1.25, role:'スキル特化', trait:'月光共鳴', traitText:'スキルダメージ +50%／必殺ゲージ獲得 +25%'  },
  { id: 'tsukineko', name: 'つきねこ', title: '星影の銃使い', color: '#82e5ff', range:11, damage:26, baseHp:210, baseDefense:14, interval:.42, skillPower:1, chargeRate:1, role:'基礎能力特化', trait:'星影の鍛錬', traitText:'高いHP・攻撃力・防御力と、速い通常射撃'  },
  {id:'omsolo',name:'オムソロ',title:'翠光の剣士',color:'#aaffba',range:3.2,damage:37,baseHp:250,baseDefense:21,interval:.66,skillPower:1.1,chargeRate:1,role:'近接・守護',trait:'守り手の剣',traitText:'扇状の近接攻撃／高いHPと防御力。必殺技で周囲を斬り払い、自分を守る'},
];
export {SKILLS} from './blessings.js';
export const AREAS = [
  { name:'星詠みの草原', sub:'THE STARLIT MEADOW', color:0x5d9871 },
  { name:'月影の遺跡', sub:'RUINS OF THE CRESCENT', color:0x69899e },
  { name:'暁の聖域', sub:'SANCTUARY OF DAWN', color:0x98819d },
];
export function seededRandom(seed) { let a=seed>>>0; return () => { a+=0x6D2B79F5; let t=a; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; }; }
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Adventure {
  constructor({seed=Date.now(),hero=0,difficulty='normal',progression,party,tutorial=false,act=0}={}) {
    this.tutorial=tutorial?new FirstBattleTutorial():null;if(tutorial){hero=0;party=['nyanluna'];act=0;}
    this.progression=normalizeProgression(progression,HEROES);this.guestHeroId=null;this.recruitedHeroId=null;this.act=isActUnlocked(this.progression,act)?act:0;this.actConfig=ACTS[this.act];this.pendingTrials=new Set();this.rescue=null;
    this.party=Object.freeze(normalizeParty(party,availableHeroes(this.progression,HEROES)));this.partyHeroes=this.party.map(id=>HEROES.findIndex(h=>h.id===id));hero=this.partyHeroes.includes(hero)?hero:this.partyHeroes[0];this.skillPool=Object.freeze(skillsForParty(this.party));
    this.earnedWeaponTickets=0;this.earnedMissions=[];this.earnedXp=Object.fromEntries(HEROES.map(h=>[h.id,0]));this.earnedMaterials=Object.fromEntries(Object.keys(MATERIALS).map(id=>[id,0]));
    this.rng=seededRandom(seed);this.lootRng=seededRandom(seed^0x57EA90C1);this.seed=seed;this.difficulty=difficulty;this.phase='playing';this.events=[];this.ids=1;
    this.heroHealth=Object.fromEntries(HEROES.map(h=>{const maxHp=combatStats(this.progression,h).maxHp;return [h.id,{hp:maxHp,maxHp}];}));
    this.player={x:0,z:3,hero,face:Math.PI,invincible:1,dash:0,dashCooldown:0,dx:0,dz:-1,attack:0,charge:0,switchCooldown:0};
    // HP follows the controlled character; switching never copies another character's damage.
    Object.defineProperties(this.player,{
      hp:{enumerable:true,get:()=>this.healthFor(this.player.hero).hp,set:value=>{if(Number.isFinite(value))this.healthFor(this.player.hero).hp=clamp(value,0,this.player.maxHp);}},
      maxHp:{enumerable:true,get:()=>this.healthFor(this.player.hero).maxHp,set:value=>{if(Number.isFinite(value)&&value>0)this.healthFor(this.player.hero).maxHp=value;}},
    });
    this.ultimateCharges=Object.fromEntries(HEROES.map(h=>[h.id,0]));this.ultimateEffects=[];
    Object.defineProperty(this.player,'charge',{enumerable:true,get:()=>this.chargeFor(this.player.hero),set:value=>{this.ultimateCharges[this.heroId(this.player.hero)]=Number.isFinite(value)?clamp(value,0,100):0;}});
    this.partner={x:-1.7,z:4.5,attack:0,face:Math.PI};this.enemies=[];this.projectiles=[];this.orbs=[];this.hazards=[];
    this.skills={};this.offers=[];this.pendingBlessings=0;this.blessingTier=0;this.stageCrystals=0;this.crystalGoal=8;this.totalCrystals=0;this.blessingsTaken=0;this.time=0;this.kills=0;this.combo=0;this.comboTimer=0;this.maxCombo=0;this.damageDealt=0;
    this.stageTrial={startedAt:0,hits:0};this.runHits=0;this.seenEnemyTypes=new Set();
    this.travelOpen=null;this.travelDelay=0;this.route=null;this.routeRewards=[];this.wave=0;this.spawnTimer=0;this.waveSpawned=0;this.waveGoal=0;this.waveBreak=0;this.orbitTimer=0;this.exitOpen=false;this.exitDelay=0;this.stagesCleared=0;this.refreshStats();this.player.hp=this.player.maxHp;this.startWave();
    this.tutorialStart={player:{...this.player},partner:{...this.partner}};
  }
  get field(){return fieldFor(this.act,this.area);}
  get layout(){return layoutFor(this.act,this.area,this.wave,this.route);}
  get walkLayout(){return walkingLayout(this.layout,this.travelOpen==='stairs');}
  get exitPoint(){return this.layout.exit;}
  get travelTargets(){return this.travelOpen==='stairs'?[{id:'stairs',...this.layout.stairPoint,label:'上のフロアへ',color:0x9cdcff}]:this.travelOpen==='branch'?ROUTE_PORTALS:[];}
  canWalk(x,z){return contains(this.walkLayout,x,z,.85);}
  directionTo(target,source=this.player){const d=navigation(this.walkLayout,source,target),length=Math.hypot(d.x,d.z)||1;return {x:d.x/length,z:d.z/length};}
  steerEnemy(e){
    const layout=this.walkLayout,p=this.player;
    if(clearPath(layout,e,p,.55)){const d=Math.hypot(p.x-e.x,p.z-e.z)||1;return {x:(p.x-e.x)/d,z:(p.z-e.z)/d};}
    if(!e.navGoal||e.navTimer<=0){const d=navigation(layout,e,p);e.navGoal={x:e.x+d.x,z:e.z+d.z};e.navTimer=.35;}
    const d=Math.hypot(e.navGoal.x-e.x,e.navGoal.z-e.z)||1;return {x:(e.navGoal.x-e.x)/d,z:(e.navGoal.z-e.z)/d};
  }
  openPassage(){
    if(this.travelOpen||this.phase!=='playing')return false;
    this.travelOpen=this.field.kind==='floors'?'stairs':'branch';this.travelDelay=.65;this.travelOrigin={x:this.player.x,z:this.player.z};
    this.projectiles=[];this.hazards=[];this.ultimateEffects=[];this.collectAll();this.emit('passageOpen',{kind:this.travelOpen});return true;
  }
  enterPassage(id){
    const target=this.travelTargets.find(t=>t.id===id);
    if(!target||this.phase!=='playing'||this.travelDelay>0||this.pendingBlessings>0||Math.hypot(this.player.x-target.x,this.player.z-target.z)>target.radius)return false;
    const kind=this.travelOpen;if(kind==='branch')this.route=id;this.travelOpen=null;
    this.projectiles=[];this.hazards=[];this.ultimateEffects=[];this.enemies=[];this.startWave();
    Object.assign(this.player,projectInside(this.walkLayout,this.layout.entrance.x,this.layout.entrance.z),{dash:0,invincible:1.5,moving:false});
    Object.assign(this.partner,projectInside(this.walkLayout,this.player.x-1.7,this.player.z+1.5),{moving:false});
    this.emit('passageEntered',{kind,route:this.route,name:this.layout.name});this.emit('stageEntered',{area:this.area});return true;
  }
  advanceTutorial(){
    if(this.phase!=='playing'||!this.tutorial?.next())return false;
    if(!this.tutorial.active)this.finishTutorial();else this.emit('tutorialStep');return true;
  }
  observeTutorial(action,value){
    if(!this.tutorial?.observe(action,value))return;
    if(this.tutorial.step.id==='attack'){
      let x=this.player.x,z=this.player.z-6;const radius=Math.hypot(x,z);if(radius>16){x*=16/radius;z*=16/radius;}
      const target=this.spawnEnemy('moss',x,z);Object.assign(target,{training:true,speed:0,damage:0,hp:this.statsFor(0).attack*2,maxHp:this.statsFor(0).attack*2});
    }
    this.player.moving=false;this.emit('tutorialStep');
  }
  skipTutorial(){if(this.phase!=='playing'||!this.tutorial?.active)return false;this.finishTutorial();return true;}
  finishTutorial(){
    this.tutorial.active=false;this.progression.tutorial.firstBattleCompleted=true;
    this.enemies=[];this.projectiles=[];this.hazards=[];this.orbs=[];this.rng=seededRandom(this.seed);
    Object.assign(this.player,this.tutorialStart.player);Object.assign(this.partner,this.tutorialStart.partner);
    this.emit('tutorialComplete');this.wave=0;this.startWave();
  }
  heroId(hero){return HEROES[hero].id;}
  chargeFor(hero){return this.ultimateCharges[this.heroId(hero)]??0;}
  ultimateActive(hero){return this.ultimateEffects.some(effect=>effect.heroId===this.heroId(hero));}
  sourceFor(heroId){return this.heroId(this.player.hero)===heroId?this.player:this.partner;}
  skillDamage(heroId,base){const index=HEROES.findIndex(h=>h.id===heroId);if(index<0)return 0;const hero=HEROES[index];return base*(this.statsFor(index).attack/hero.damage)*(1+this.rank('power')*.25+this.rank('moonGuard')*.18+this.rank('starBlade')*.18)*hero.skillPower;}
  ultimateSpec(hero=this.player.hero){return ultimateFor(this.heroId(hero),this.progressFor(hero));}
  gainUltimateCharge(heroId,amount){if(!this.party.includes(heroId)||!Number.isFinite(amount)||amount<=0)return;const hero=HEROES.find(h=>h.id===heroId),bonus=ultimateBonuses(this.progression.characters[heroId],heroId);this.ultimateCharges[heroId]=clamp(this.ultimateCharges[heroId]+amount*hero.chargeRate*(1+this.rank('focus')*.3)*(1+bonus.ultimateCharge),0,100);}
  get hasPartner(){return this.party.length===2;}
  get partnerHero(){return this.partyHeroes.find(hero=>hero!==this.player.hero)??null;}
  isHeroAlive(hero){return this.partyHeroes.includes(hero)&&this.healthFor(hero).hp>0;}
  get hasLivingPartner(){return this.hasPartner&&this.isHeroAlive(this.partnerHero);}
  progressFor(hero){return characterProgress(this.progression,HEROES[hero].id);}
  statsFor(hero){return combatStats(this.progression,HEROES[hero]);}
  attackProfile(hero){return weaponAttackProfile(this.progression,HEROES[hero]);}
  healthFor(hero){return this.heroHealth[this.heroId(hero)];}
  refreshStats(){
    for(const hero of this.partyHeroes){const health=this.healthFor(hero),maxHp=this.statsFor(hero).maxHp+this.rank('vitality')*40;health.hp=health.hp>0?Math.min(maxHp,health.hp+Math.max(0,maxHp-health.maxHp)):0;health.maxHp=maxHp;}
  }
  rank(id){return this.skills[id]||0;}
  collectMaterials(rewards,source){const amounts=grantMaterials(this.progression,rewards);for(const [id,value] of Object.entries(amounts))this.earnedMaterials[id]+=value;if(Object.keys(amounts).length)this.emit('materials',{amounts,source});}
  trackMission(metric,amount=1){
    const result=advanceMissions(this.progression.missions,this.area,metric,amount,this.act);if(!result.changed)return;
    this.emit('missionProgress');
  }
  claimMissions(){
    for(const id of this.pendingTrials){const mission=missionsFor(0,this.act).concat(missionsFor(1,this.act),missionsFor(2,this.act)).find(m=>m.id===id);if(mission)advanceMissions(this.progression.missions,mission.area,mission.metric,1,this.act);}
    for(const mission of claimActMissions(this.progression.missions,this.act)){
      this.collectMaterials(mission.rewards,'mission');if(mission.rewards.limitStone)grantLimitStone(this.progression,mission.rewards.limitStone);
      if(mission.equipment&&!this.progression.equipment.owned.includes(mission.equipment))this.progression.equipment.owned.push(mission.equipment);
      this.earnedMissions.push(mission.id);this.emit('missionComplete',{id:mission.id,equipment:mission.equipment,rewards:mission.rewards});
    }
    this.pendingTrials.clear();this.emit('missionProgress');
  }
  emit(type,data={}){this.events.push({type,...data});}
  drainEvents(){return this.events.splice(0);}
  meetTsukineko(){
    if(this.act!==3||this.wave!==6||this.guestHeroId||isHeroUnlocked(this.progression,'tsukineko'))return false;
    this.guestHeroId='tsukineko';this.party=Object.freeze(['nyanluna','tsukineko']);this.partyHeroes=[0,1];this.skillPool=Object.freeze(skillsForParty(this.party));
    this.refreshStats();
    Object.assign(this.partner,{x:this.player.x-1.7,z:this.player.z+1.5,attack:0,face:Math.PI});
    this.emit('guestJoin',{heroId:'tsukineko'});return true;
  }
  startWave(){
    this.wave++;this.waveSpawned=0;this.waveGoal=this.actConfig.counts[this.wave-1];this.spawnTimer=.6;this.waveBreak=0;
    this.area=Math.min(2,Math.floor((this.wave-1)/2));
    if(this.wave%2===1)this.route=null;
    if(this.route==='elite'&&this.wave%2===0&&this.wave!==6)this.waveGoal++;
    if(this.meetTsukineko())this.spawn();
    if(this.act===7&&this.wave===6&&!isHeroUnlocked(this.progression,'omsolo')){this.rescue={active:true,remaining:180,total:180,saved:false,x:-6,z:-7};this.spawn();const boss=this.enemies.find(e=>e.type==='boss');if(boss)Object.assign(boss,{x:-6,z:-11,face:0});this.emit('rescueStart');}
    this.emit('wave',{wave:this.wave,area:this.area,theme:this.actConfig.stages[this.area].theme,act:this.act,boss:this.wave===6});
    if(this.wave>1){this.heal(22);this.collectAll();}
  }
  openExit(){
    if(this.exitOpen||this.phase!=='playing')return false;
    this.exitOpen=true;this.exitDelay=.65;this.ultimateEffects=[];this.projectiles=[];this.hazards=[];this.collectAll();
    this.emit('exitOpen',{area:this.area,final:this.wave===6});return true;
  }
  crossExit(){
    if(this.phase!=='playing'||!this.exitOpen||this.exitDelay>0||this.pendingBlessings>0||Math.hypot(this.player.x-this.exitPoint.x,this.player.z-this.exitPoint.z)>this.exitPoint.radius)return false;
    this.exitOpen=false;this.stagesCleared=this.area+1;this.trackMission('clears');
    for(const mission of missionsFor(this.area,this.act))if(mission.trial&&trialStatus(mission,this).eligible)this.pendingTrials.add(mission.id);
    this.collectMaterials(gateMaterials(this.area,this.act,this.difficulty),'gate');this.combo=0;this.comboTimer=0;this.player.dash=0;this.player.moving=false;this.partner.moving=false;
    if(this.wave===6){
      this.claimMissions();
      if(completeAct(this.progression,this.act)){this.recruitedHeroId=this.actConfig.recruit;this.emit('recruited',{heroId:this.recruitedHeroId});}
      this.guestHeroId=null;this.phase='victory';this.emit('victory');
    }
    else{this.phase='transition';this.emit('stageClear',{area:this.area,nextArea:this.area+1});}
    return true;
  }
  advanceStage(){
    if(this.phase!=='transition')return false;
    this.phase='playing';this.travelOpen=null;this.route=null;this.stageTrial={startedAt:this.time,hits:0};Object.assign(this.player,{x:0,z:8,face:Math.PI,dash:0,invincible:1.5,moving:false});
    Object.assign(this.partner,{x:-1.7,z:9.5,face:Math.PI,moving:false});
    this.projectiles=[];this.hazards=[];this.enemies=[];this.startWave();Object.assign(this.player,projectInside(this.walkLayout,this.layout.entrance.x,this.layout.entrance.z));Object.assign(this.partner,projectInside(this.walkLayout,this.player.x-1.7,this.player.z+1.5));this.emit('stageEntered',{area:this.area});return true;
  }
  spawnEnemy(type,x,z,{elite=false}={}){
    const boss=type==='boss';const hard=this.difficulty==='hard'?1.3:1,power=boss&&elite?ELITE_BOSS_MULTIPLIER:1;
    const spec=boss?BOSSES[this.actConfig.bossId]:ENEMY_TYPES[type];if(!spec)throw new Error(`Unknown enemy: ${type}`);
    const hp=(boss?this.actConfig.bossHp:spec.hp)*(boss?1:(1+(this.wave-1)*.14)*(1+this.act*.08))*hard*power;
    const e={id:this.ids++,type,bossId:boss?this.actConfig.bossId:null,name:spec.name+(elite?'・深淵':''),elite,x,z,hp,maxHp:hp,speed:spec.speed,damage:(boss?(this.act>=4?45:22):spec.damage)*hard*power,radius:spec.radius*(elite?1.12:1),hit:0,attack:1+this.rng(),age:0,knockX:0,knockZ:0,face:0,action:0,special:boss?3:1.4+this.rng(),cast:null,rush:null,recovery:0,enraged:false,navTimer:0};
    this.enemies.push(e);this.emit('spawn',{id:e.id,x,z,boss});return e;
  }
  spawn(){
    const angle=this.rng()*Math.PI*2;let {x,z}=spawnPoint(this.walkLayout,this.player,angle);
    let type=enemyForSpawn(this.act,this.wave,this.waveSpawned,this.rng());
    if(isRangedEnemy(type)&&this.enemies.filter(e=>e.hp>0&&isRangedEnemy(e.type)).length>=(this.act>=4?4:3))type=this.act>=4?'reaper':'bat';
    if(type!=='boss'&&!this.seenEnemyTypes.has(type)){this.seenEnemyTypes.add(type);if(ENEMY_TYPES[type]?.chapter===1||['archer','mage','charger'].includes(type))this.emit('enemyIntro',{enemyType:type});}
    const elite=this.route==='elite'&&this.wave%2===0&&(this.wave===6||this.waveSpawned===this.waveGoal-1);
    if(elite)type='boss';
    if(type==='boss')({x,z}=projectInside(this.walkLayout,0,-11,2.3));
    this.spawnEnemy(type,x,z,{elite});this.waveSpawned++;
  }
  nearest(x,z,range){let best=null,dist=range;for(const e of this.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-x,e.z-z);if(d-e.radius<dist){best=e;dist=d-e.radius;}}return best;}
  heal(amount){if(this.player.hp>0)this.player.hp=Math.min(this.player.maxHp,this.player.hp+amount);}
  dash(dx,dz){
    const p=this.player;if(this.phase!=='playing'||p.dashCooldown>0||this.tutorial?.active&&this.tutorial.step.id!=='dash')return false;
    const d=Math.hypot(dx,dz);p.dx=d>.01?dx/d:Math.sin(p.face);p.dz=d>.01?dz/d:Math.cos(p.face);
    p.dash=.22;p.dashCooldown=Math.max(.65,1.5-this.rank('stride')*.2);p.invincible=.5;this.emit('dash',{x:p.x,z:p.z,hero:p.hero});this.observeTutorial('dash');return true;
  }
  switchHero(){if(this.phase!=='playing'||!this.hasLivingPartner||this.player.switchCooldown>0)return false;this.activateHero(this.partnerHero);return true;}
  activateHero(hero,automatic=false){
    const p=this.player;p.hero=hero;this.refreshStats();p.switchCooldown=.65;p.attack=.05;p.invincible=Math.max(p.invincible,automatic?1.5:.32);
    if(automatic){p.dash=0;this.partner.moving=false;}
    this.emit('switch',{hero:p.hero,x:p.x,z:p.z,automatic});
  }
  ultimate(){return castUltimate(this);}
  attackFrom(source,hero,support=false){
    if(!this.isHeroAlive(hero)||(support&&!this.hasLivingPartner))return false;
    const stats=this.attackProfile(hero);const range=stats.range*(1+this.rank('reach')*.18)+(hero===2?this.rank('saberReach')*.35:0);const enemy=this.nearest(source.x,source.z,range);if(!enemy)return false;
    const angle=Math.atan2(enemy.x-source.x,enemy.z-source.z);source.face=angle;
    const heroId=HEROES[hero].id;let damage=this.statsFor(hero).attack*(1+this.rank('power')*.25+this.rank('moonGuard')*.18+this.rank('starBlade')*.18)*(support?.43*(1+this.rank('echo')*.35+this.rank('starBlade')*.2):1);
    const crit=this.rng()<.05+this.rank('crit')*.15;if(crit)damage*=2;
    this.emit('attack',{x:source.x,z:source.z,angle,hero,support,range,color:equippedWeapon(this.progression,heroId)?.weapon.effectColor});
    if(hero===0){
      const id=this.ids++;this.projectiles.push({id,owner:'player',heroId,x:source.x,z:source.z,vx:Math.sin(angle)*15,vz:Math.cos(angle)*15,kind:'magic',speed:15,life:Math.max(1.5,(range+2)/15),damage,crit,target:enemy.id,radius:.28});
    }else if(hero===1){
      const id=this.ids++;this.projectiles.push({id,owner:'player',kind:'gun',heroId,x:source.x,z:source.z,vx:Math.sin(angle)*28,vz:Math.cos(angle)*28,speed:28,life:(range+2)/28,damage,crit,radius:.23,pierce:stats.pierce,hitIds:[]});
    }else{
      const reach=range;
      for(const target of [...this.enemies]){const dx=target.x-source.x,dz=target.z-source.z,d=Math.hypot(dx,dz);if(target.hp>0&&d-target.radius<=reach&&(d<.01||(dx*Math.sin(angle)+dz*Math.cos(angle))/d>=MELEE_MIN_DOT))this.hit(target,damage*(1+this.rank('saberPower')*.22),source.x,source.z,crit,false,heroId);}
    }
    return true;
  }
  hit(e,damage,x,z,crit=false,chain=false,heroId=HEROES[this.player.hero].id,canCharge=true){
    if(e.hp<=0||this.phase==='defeat'||this.phase==='victory')return;e.hp-=damage;e.hit=.15;if(!e.training)this.damageDealt+=Math.min(damage,e.hp+damage);
    const dx=e.x-x,dz=e.z-z,d=Math.hypot(dx,dz)||1;const knock=e.type==='boss'?.5:3.5;e.knockX=dx/d*knock;e.knockZ=dz/d*knock;
    this.emit('hit',{id:e.id,x:e.x,z:e.z,damage:Math.round(damage),crit});
    if(e.training){if(e.hp<=0){this.emit('death',{id:e.id,x:e.x,z:e.z,enemyType:e.type,training:true});this.observeTutorial('defeat');}return;}
    if(canCharge)this.gainUltimateCharge(heroId,.65);
    if(e.hp<=0){
      if(e.type==='boss'&&this.act===7&&this.wave===6&&this.rescue?.active){this.rescue.active=false;this.rescue.saved=true;this.emit('rescueSaved');}
      this.kills++;this.trackMission('kills');this.combo++;this.comboTimer=4;this.maxCombo=Math.max(this.maxCombo,this.combo);
      if(canCharge)this.gainUltimateCharge(heroId,4);
      const earned=awardCharacterXp(this.progression,heroId,ENEMY_REWARDS[e.type]?.xp??0);
      if(earned){this.earnedXp[heroId]=(this.earnedXp[heroId]??0)+earned.amount;this.refreshStats();this.emit('characterXp',earned);}
      this.collectMaterials(enemyMaterials(e,this.act,this.difficulty),'enemy');
      const tickets=bossWeaponTicket(this.progression,e,this.lootRng);if(tickets){this.earnedWeaponTickets+=tickets;this.emit('weaponTicket',{count:tickets,total:this.progression.inventory.weaponTicket});}
      if(e.elite){this.collectMaterials(ROUTE_REWARD,'route');this.routeRewards.push(this.area);this.emit('routeReward',{rewards:ROUTE_REWARD});}
      this.emit('death',{id:e.id,x:e.x,z:e.z,enemyType:e.type,heroId});
      if(this.rank('leech')&&this.kills%6===0)this.heal(8*this.rank('leech'));
      const value=ENEMY_REWARDS[e.type]?.crystals??0;if(value)this.orbs.push({id:this.ids++,x:e.x,z:e.z,value,age:0});
      if(this.rank('nova')&&!chain){this.emit('nova',{x:e.x,z:e.z});for(const n of [...this.enemies])if(n!==e&&n.hp>0&&Math.hypot(n.x-e.x,n.z-e.z)<3.8)this.hit(n,this.skillDamage(heroId,14*this.rank('nova')),e.x,e.z,false,true,heroId,canCharge);}
      // Carry the recovered light to the open gate to complete the chapter.
    }
  }
  hurt(amount,x,z){
    const p=this.player;if(p.invincible>0||this.phase!=='playing'||this.exitOpen||this.travelOpen||this.tutorial?.active)return false;
    const damage=amount*Math.pow(.85,(this.rank('ward')+this.rank('saberGuard')))*100/(100+this.statsFor(p.hero).defense);p.hp=Math.max(0,p.hp-damage);p.invincible=.8;this.combo=0;if(damage>0){this.stageTrial.hits++;this.runHits++;}
    this.emit('hurt',{damage:Math.round(damage),hero:p.hero,x,z});
    if(p.hp<=0){
      const heroId=this.heroId(p.hero);this.emit('heroDown',{hero:p.hero,heroId});
      this.ultimateEffects=this.ultimateEffects.filter(effect=>effect.heroId!==heroId);
      // Mark in-flight shots too: a knockout can happen during the projectile loop.
      for(const bullet of this.projectiles)if(bullet.owner==='player'&&bullet.heroId===heroId)bullet.life=0;
      this.projectiles=this.projectiles.filter(bullet=>bullet.life>0);
      if(this.hasLivingPartner)this.activateHero(this.partnerHero,true);
      else{this.phase='defeat';this.ultimateEffects=[];this.projectiles=[];this.hazards=[];this.emit('defeat');}
    }
    return true;
  }
  addCrystals(value){if(this.phase==='victory'||this.phase==='defeat'||!Number.isFinite(value)||value<=0)return;value=Math.floor(value);this.trackMission('crystals',value);this.stageCrystals+=value;this.totalCrystals+=value;while(this.stageCrystals>=this.crystalGoal){this.stageCrystals-=this.crystalGoal;this.blessingTier++;this.crystalGoal=Math.round(this.crystalGoal*1.25+2);this.pendingBlessings++;}}
  collectAll(){for(const orb of this.orbs)this.addCrystals(orb.value);this.orbs=[];}
  offerSkills(){
    const available=this.skillPool.filter(s=>this.rank(s.id)<s.max);for(let i=available.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[available[i],available[j]]=[available[j],available[i]];}
    if(!available.length){this.pendingBlessings=0;this.heal(40);return;}
    this.offers=available.slice(0,3);
    // Keep the party's identity visible: a duo blessing, or a deployed hero's blessing.
    const signatures=available.filter(s=>s.requires?.length===(this.hasPartner&&available.some(s=>s.requires?.length===2)?2:1));
    if(signatures.length&&!this.offers.some(s=>signatures.includes(s)))this.offers[this.offers.length-1]=signatures[0];
    this.phase='upgrade';this.emit('upgrade',{offers:this.offers});
  }
  chooseSkill(id){
    const skill=this.skillPool.find(s=>s.id===id);
    if(this.phase!=='upgrade'||!skill||this.rank(id)>=skill.max||!this.offers.some(s=>s.id===id))return false;
    this.skills[id]=this.rank(id)+1;this.blessingsTaken++;if(id==='vitality'){const hp=this.player.hp;this.refreshStats();this.player.hp=hp;this.heal(60);}
    this.pendingBlessings=Math.max(0,this.pendingBlessings-1);this.offers=[];this.phase='playing';this.emit('skill',{id});
    if(this.pendingBlessings>0)this.offerSkills();return true;
  }
  pause(){if(this.phase==='playing'){this.phase='paused';return true;}return false;}
  resume(){if(this.phase==='paused')this.phase='playing';}
  tick(dt,input={x:0,z:0}){
    if(this.phase!=='playing')return;const training=this.tutorial?.active;
    if(training&&!this.tutorial.practicing)return;
    dt=clamp(dt,0,.05);if(!training)this.time+=dt;
    if(this.rescue?.active){this.rescue.remaining=Math.max(0,this.rescue.remaining-dt);if(this.rescue.remaining<=0){this.phase='defeat';this.ultimateEffects=[];this.projectiles=[];this.hazards=[];this.emit('defeat',{reason:'rescueTimeout'});return;}}
    const p=this.player,fromX=p.x,fromZ=p.z;
    for(const prop of ['attack','dashCooldown','invincible','switchCooldown'])p[prop]=Math.max(0,p[prop]-dt);
    let dx=input.x||0,dz=input.z||0;const speed=5.6*(1+this.rank('stride')*.12);const length=Math.hypot(dx,dz);if(length>1){dx/=length;dz/=length;}
    if(p.dash>0){p.dash=Math.max(0,p.dash-dt);dx=p.dx;dz=p.dz;p.x+=dx*24*dt;p.z+=dz*24*dt;}else{p.x+=dx*speed*dt;p.z+=dz*speed*dt;}
    if(Math.hypot(dx,dz)>.05)p.face=Math.atan2(dx,dz);p.moving=Math.hypot(dx,dz)>.05;
    Object.assign(p,moveWithin(this.walkLayout,{x:fromX,z:fromZ},p.x,p.z));
    const partner=this.partner;const targetX=p.x-Math.cos(p.face)*1.7-Math.sin(p.face),targetZ=p.z+Math.sin(p.face)*1.7-Math.cos(p.face);
    const partnerFrom={x:partner.x,z:partner.z};
    if(this.hasLivingPartner){if(!clearPath(this.walkLayout,partner,{x:targetX,z:targetZ},.55)){const d=navigation(this.walkLayout,partner,{x:targetX,z:targetZ}),length=Math.hypot(d.x,d.z)||1;partner.x+=d.x/length*6*dt;partner.z+=d.z/length*6*dt;}partner.moving=Math.hypot(partner.x-targetX,partner.z-targetZ)>.3;partner.x+=(targetX-partner.x)*Math.min(1,dt*5);partner.z+=(targetZ-partner.z)*Math.min(1,dt*5);partner.attack=Math.max(0,partner.attack-dt);}else partner.moving=false;
    Object.assign(partner,moveWithin(this.walkLayout,partnerFrom,partner.x,partner.z,.55));
    if(training){this.observeTutorial('move',Math.hypot(p.x-fromX,p.z-fromZ));if(this.tutorial.step.id!=='attack')return;}
    if(this.travelOpen){
      if(this.pendingBlessings>0){this.offerSkills();return;}
      this.travelDelay=Math.max(0,this.travelDelay-dt);for(const target of this.travelTargets)if(this.enterPassage(target.id))break;return;
    }
    if(this.exitOpen){
      if(this.pendingBlessings>0){this.offerSkills();return;}
      this.exitDelay=Math.max(0,this.exitDelay-dt);this.crossExit();return;
    }
    if(!training)tickUltimates(this,dt);
    if(p.attack<=0&&this.attackFrom(p,p.hero))p.attack=this.attackProfile(p.hero).interval*Math.pow(.85,this.rank('haste'));
    if(this.hasLivingPartner&&partner.attack<=0&&this.attackFrom(partner,this.partnerHero,true))partner.attack=this.attackProfile(this.partnerHero).interval*2.6*Math.pow(.85,this.rank('haste'));
    if(!training){this.spawnTimer-=dt;if(this.waveSpawned<this.waveGoal&&this.spawnTimer<=0){this.spawn();this.spawnTimer=this.wave===6?100:Math.max(.43,1.15-this.wave*.10);}}
    for(const e of this.enemies){
      if(e.hp<=0)continue;const enemyFrom={x:e.x,z:e.z};e.navTimer-=dt;e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.attack-=dt;
      if(!e.training)tickEnemyBehavior(this,e,dt,enemySpeedScale(this,e));
      e.x+=e.knockX*dt;e.z+=e.knockZ*dt;e.knockX*=Math.max(0,1-dt*7);e.knockZ*=Math.max(0,1-dt*7);
      Object.assign(e,moveWithin(this.walkLayout,enemyFrom,e.x,e.z,Math.min(.8,e.radius)));
      if(Math.hypot(p.x-e.x,p.z-e.z)<e.radius+.7&&e.attack<=0){this.hurt(e.damage,e.x,e.z);e.attack=1.2;if(this.phase==='defeat')return;}
    }
    for(let i=0;i<this.enemies.length;i++)for(let j=i+1;j<this.enemies.length;j++){
      const a=this.enemies[i],b=this.enemies[j];if(a.hp<=0||b.hp<=0)continue;const x=b.x-a.x,z=b.z-a.z,d=Math.hypot(x,z)||.01,min=(a.radius+b.radius)*.82;
      if(d<min){const k=(min-d)*dt*2.5;a.x-=x/d*k;a.z-=z/d*k;b.x+=x/d*k;b.z+=z/d*k;Object.assign(a,projectInside(this.walkLayout,a.x,a.z,.55));Object.assign(b,projectInside(this.walkLayout,b.x,b.z,.55));}
    }
    for(const bullet of this.projectiles){
      if(bullet.life<=0)continue;
      bullet.life-=dt;if(bullet.owner==='player'&&bullet.kind!=='gun'){
        const target=this.enemies.find(e=>e.id===bullet.target&&e.hp>0);if(target){const x=target.x-bullet.x,z=target.z-bullet.z,d=Math.hypot(x,z)||1;bullet.vx=x/d*15;bullet.vz=z/d*15;}
      }
      const fromX=bullet.x,fromZ=bullet.z;bullet.x+=bullet.vx*dt;bullet.z+=bullet.vz*dt;
      if(bullet.owner==='player'){
        // Swept collision prevents fast rounds crossing a small enemy between frames.
        const dx=bullet.x-fromX,dz=bullet.z-fromZ,lengthSq=dx*dx+dz*dz;
        const hits=this.enemies.filter(e=>e.hp>0&&!bullet.hitIds?.includes(e.id)).map(e=>{const t=clamp(((e.x-fromX)*dx+(e.z-fromZ)*dz)/(lengthSq||1),0,1);return {e,t,d:Math.hypot(e.x-fromX-dx*t,e.z-fromZ-dz*t)};}).filter(h=>h.d<h.e.radius+bullet.radius).sort((a,b)=>a.t-b.t);
        for(const {e} of hits){this.hit(e,bullet.damage,fromX,fromZ,bullet.crit,false,bullet.heroId,!bullet.ultimate);if(bullet.kind==='gun'){bullet.hitIds.push(e.id);bullet.pierce--;if(bullet.pierce>0)continue;}bullet.life=0;break;}
      }
      else{
        const dx=bullet.x-fromX,dz=bullet.z-fromZ,l=dx*dx+dz*dz,t=clamp(((p.x-fromX)*dx+(p.z-fromZ)*dz)/(l||1),0,1);
        if(Math.hypot(p.x-fromX-dx*t,p.z-fromZ-dz*t)<.6+bullet.radius){this.hurt(bullet.damage,bullet.x,bullet.z);bullet.life=0;if(this.phase==='defeat')return;}
      }
    }
    this.projectiles=this.projectiles.filter(b=>b.life>0);
    this.hazards=this.hazards.filter(h=>!h.sourceId||this.enemies.some(e=>e.id===h.sourceId&&e.hp>0));
    for(const h of this.hazards){h.timer-=dt;if(h.timer<=0){if(h.damage)this.emit('hazard',{x:h.x,z:h.z,radius:h.radius,color:h.color,shape:h.shape,length:h.length,width:h.width,angle:h.angle});if(distanceToHazard(p.x,p.z,h)<.45&&h.damage){this.hurt(h.damage,h.x,h.z);if(this.phase==='defeat')return;}}}
    this.hazards=this.hazards.filter(h=>h.timer>0);
    this.orbitTimer-=dt;if(this.rank('orbit')&&this.orbitTimer<=0){this.orbitTimer=.45;for(let i=0;i<this.rank('orbit');i++){const a=this.time*2.3+i/this.rank('orbit')*Math.PI*2,x=p.x+Math.cos(a)*2.5,z=p.z+Math.sin(a)*2.5;for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-x,e.z-z)<e.radius+1)this.hit(e,this.skillDamage(this.heroId(p.hero),12),p.x,p.z,false,false,HEROES[p.hero].id);}}
    for(const orb of this.orbs){orb.age+=dt;const x=p.x-orb.x,z=p.z-orb.z,d=Math.hypot(x,z)||.01;if(d<3.5+this.rank('reach')*1.5||orb.age>7){const k=Math.min(1,dt*(orb.age>7?5:9));orb.x+=x*k;orb.z+=z*k;}if(d<.8){this.addCrystals(orb.value);orb.value=0;this.emit('collect');}}
    this.orbs=this.orbs.filter(o=>o.value>0);this.enemies=this.enemies.filter(e=>e.hp>0);
    this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
    if(this.phase!=='playing'||training)return;
    if(this.waveSpawned>=this.waveGoal&&!this.enemies.length){
      if(this.wave%2===0)this.openExit();
      else{this.waveBreak+=dt;if(this.waveBreak>2.2){if(this.field.kind==='single')this.startWave();else this.openPassage();}}
    }
    if(this.pendingBlessings>0){this.offerSkills();return;}
  }
  snapshot(){return {earnedWeaponTickets:this.earnedWeaponTickets,heroHealth:Object.fromEntries(this.party.map(id=>[id,{...this.heroHealth[id]}])),rescue:this.rescue?{...this.rescue}:null,layout:this.layout.id,travelOpen:this.travelOpen,travelTargets:this.travelTargets,route:this.route,routeRewards:[...this.routeRewards],act:this.act,actTitle:this.actConfig.title,phase:this.phase,ultimateCharges:{...this.ultimateCharges},ultimateEffects:this.ultimateEffects.map(e=>({...e})),tutorial:this.tutorial?{active:this.tutorial.active,step:this.tutorial.step.id,distance:this.tutorial.distance}:null,guestHeroId:this.guestHeroId,recruitedHeroId:this.recruitedHeroId,party:[...this.party],partnerHero:this.partnerHero,skillPool:this.skillPool.map(s=>s.id),exitOpen:this.exitOpen,stagesCleared:this.stagesCleared,wave:this.wave,area:this.area,kills:this.kills,time:this.time,characterLevels:Object.fromEntries(HEROES.map((h,i)=>[h.id,{...this.progressFor(i)}])),earnedXp:{...this.earnedXp},stageCrystals:this.stageCrystals,crystalGoal:this.crystalGoal,blessingTier:this.blessingTier,blessingsTaken:this.blessingsTaken,player:{...this.player},enemyCount:this.enemies.length,projectiles:this.projectiles.length,earnedMissions:[...this.earnedMissions],skills:{...this.skills},offers:this.offers.map(s=>s.id),boss:this.enemies.find(e=>e.type==='boss')?.hp||0};}
}
