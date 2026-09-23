import {WEAPONS,equipmentImage} from './equipment.js';
import {publicUrl} from './public-url.js';
import {isHeroUnlocked} from './recruitment.js';

export const WEAPON_TICKET_DROP_RATE=.05;
export const WEAPON_HERO_IDS=Object.freeze(['nyanluna','tsukineko','omsolo']);
export const WEAPON_RARITIES=Object.freeze([
  Object.freeze({rank:1,name:'通常',color:'#b7cbc7',attack:0,chance:0,duplicateBuds:0}),
  Object.freeze({rank:2,name:'希少',color:'#86d5ff',attack:.10,chance:.75,duplicateBuds:5}),
  Object.freeze({rank:3,name:'特級',color:'#d0a9ff',attack:.22,chance:.20,duplicateBuds:15}),
  Object.freeze({rank:4,name:'伝説',color:'#ffd580',attack:.40,chance:.05,duplicateBuds:50}),
]);
const base=(heroId)=>({...WEAPONS[heroId],heroId,style:'均衡型',attackOffset:0,interval:1,range:1,pierce:heroId==='tsukineko'?2:0});
export const WEAPON_FAMILIES=Object.freeze([
  base('nyanluna'),
  {id:'lilica-staff',heroId:'nyanluna',name:'星鈴の杖・リリカ',kind:'staff',style:'速詠型',attackOffset:-.10,interval:.75,range:.80,note:'軽い星鈴で素早く詠唱。攻撃間隔が短くなる代わりに、一撃の威力と射程は控えめ。'},
  {id:'selene-staff',heroId:'nyanluna',name:'宵星の杖・セレーネ',kind:'staff',style:'遠撃型',attackOffset:.14,interval:1.30,range:1.30,note:'遠い敵へ強い月光弾を放つ天球の杖。威力と射程に優れるが、詠唱に時間がかかる。'},
  base('tsukineko'),
  {id:'gemini-gun',heroId:'tsukineko',name:'双連銃・ジェミニ',kind:'gun',style:'連射型',attackOffset:-.10,interval:.70,range:.80,pierce:1,note:'二連銃身からすばやく星弾を発射。短い射程での連射が得意。通常弾は敵1体で止まる。'},
  {id:'artemis-rifle',heroId:'tsukineko',name:'月穿銃・アルテミス',kind:'gun',style:'狙撃型',attackOffset:.28,interval:1.55,range:1.40,pierce:3,note:'遠くから重い一撃を届ける長銃。通常弾は3体を貫通。連射は遅いが、直線上の敵に強い。'},
  base('omsolo'),
  {id:'hayate-saber',heroId:'omsolo',name:'流星剣・ハヤテ',kind:'saber',style:'速斬型',attackOffset:-.08,interval:.72,range:.85,effectColor:0x85eeff,note:'短く軽い蒼い光刃で連続斬撃。接近が必要だが、攻撃間隔に優れる。'},
  {id:'aegis-saber',heroId:'omsolo',name:'護光剣・イージス',kind:'saber',style:'守護型',attackOffset:-.05,interval:1.18,range:1.10,defense:[0,0,8,12,18],effectColor:0xaaff9a,note:'盾形の鍔で身を守る光剣。攻撃は少し遅いが、広めの斬撃と防御力を備える。'},
].map(weapon=>Object.freeze(weapon)));
export const WEAPON_CATALOG=Object.freeze(WEAPON_FAMILIES.flatMap(weapon=>WEAPON_RARITIES.filter(r=>weapon.style==='均衡型'||r.rank>1).map(rarity=>Object.freeze({id:`${weapon.id}-r${rarity.rank}`,heroId:weapon.heroId,weapon,rarity,bonus:Object.freeze({attack:Number((rarity.attack+weapon.attackOffset).toFixed(2)),defense:weapon.defense?.[rarity.rank]??0})}))));
const MAX_COUNT=99999999;
const count=value=>Number.isFinite(value)&&value>=0?Math.min(MAX_COUNT,Math.floor(value)):0;
export const weaponVariant=id=>WEAPON_CATALOG.find(item=>item.id===id);
export const rarityLabel=rarity=>`★${rarity.rank} ${rarity.name}`;
export const weaponImage=item=>item.weapon.style==='均衡型'?equipmentImage(item.weapon.id):publicUrl(`assets/equipment/weapons/${item.weapon.id}-v1.png`);
export function normalizeWeapons(raw){
  const owned=WEAPON_CATALOG.filter(item=>item.rarity.rank===1||Array.isArray(raw?.owned)&&raw.owned.includes(item.id)).map(item=>item.id);
  const loadout={};
  for(const heroId of WEAPON_HERO_IDS){
    const requested=weaponVariant(raw?.loadout?.[heroId]);
    if(requested?.heroId===heroId&&owned.includes(requested.id))loadout[heroId]=requested.id;
    else if(raw?.version!==2){
      // v1 equipped the highest rarity automatically. Preserve that exact legacy choice once.
      loadout[heroId]=WEAPON_CATALOG.filter(item=>item.heroId===heroId&&owned.includes(item.id)).sort((a,b)=>b.rarity.rank-a.rarity.rank)[0].id;
    }else loadout[heroId]=`${WEAPONS[heroId].id}-r1`;
  }
  const last=weaponVariant(raw?.lastDraw?.weaponId),validLast=last?.rarity.rank>1&&owned.includes(last.id);
  // Older draws did not store their paid amount. Keep their pre-v1.41 history;
  // new draws record the actual grant so later reward changes cannot rewrite it.
  const duplicate=raw?.lastDraw?.duplicate===true;
  const duplicateBuds=duplicate&&validLast?count(raw.lastDraw.duplicateBuds??({2:10,3:30,4:100}[last.rarity.rank])):0;
  return {version:2,owned,loadout,draws:count(raw?.draws),lastDraw:validLast?{weaponId:last.id,duplicate,...(duplicate?{duplicateBuds}:{})}:null};
}
export function equippedWeapon(profile,heroId){
  if(!WEAPON_HERO_IDS.includes(heroId))return null;
  const raw=profile?.weapons;
  const collection=raw?.version===2?raw:normalizeWeapons(raw),item=weaponVariant(collection.loadout?.[heroId]);
  return item?.heroId===heroId&&collection.owned?.includes(item.id)?item:weaponVariant(`${WEAPONS[heroId].id}-r1`);
}
export function equipWeapon(profile,heroId,id){
  const item=weaponVariant(id);if(!item||item.heroId!==heroId||!isHeroUnlocked(profile,heroId)||!profile.weapons?.owned?.includes(id))return false;
  profile.weapons=normalizeWeapons(profile.weapons);profile.weapons.loadout[heroId]=id;return true;
}
export function weaponAttackBonus(profile,heroId){return equippedWeapon(profile,heroId)?.bonus.attack??0;}
export function weaponDefenseBonus(profile,heroId){return equippedWeapon(profile,heroId)?.bonus.defense??0;}
export function weaponAttackProfile(profile,hero){
  const weapon=equippedWeapon(profile,hero.id)?.weapon;
  return {range:hero.range*(weapon?.range??1),interval:hero.interval*(weapon?.interval??1),pierce:weapon?.pierce??0};
}
export function grantWeaponTickets(profile,amount=1){
  const before=count(profile.inventory.weaponTicket);profile.inventory.weaponTicket=count(before+count(amount));return profile.inventory.weaponTicket-before;
}
export function bossWeaponTicket(profile,enemy,rng=Math.random){
  if(enemy.type!=='boss'||enemy.training||enemy.hp>0)return 0;
  const roll=rng();return Number.isFinite(roll)&&roll>=0&&roll<WEAPON_TICKET_DROP_RATE?grantWeaponTickets(profile):0;
}
export function drawWeapon(profile,rng=Math.random){
  const tickets=count(profile.inventory?.weaponTicket);if(tickets<1)return null;
  const heroRoll=rng(),rarityRoll=rng(),typeRoll=rng();if(![heroRoll,rarityRoll,typeRoll].every(n=>Number.isFinite(n)&&n>=0&&n<1))return null;
  const heroId=WEAPON_HERO_IDS[Math.floor(heroRoll*WEAPON_HERO_IDS.length)];
  let cumulative=0;const rarity=WEAPON_RARITIES.filter(r=>r.chance).find(r=>(cumulative+=r.chance)>rarityRoll);
  const candidates=WEAPON_CATALOG.filter(item=>item.heroId===heroId&&item.rarity===rarity),item=candidates[Math.floor(typeRoll*candidates.length)];
  const collection=normalizeWeapons(profile.weapons),duplicate=collection.owned.includes(item.id);
  if(!duplicate)collection.owned.push(item.id);
  let duplicateBuds=0;if(duplicate){const before=count(profile.inventory.starBud);profile.inventory.starBud=count(before+rarity.duplicateBuds);duplicateBuds=profile.inventory.starBud-before;}
  collection.draws=count(collection.draws+1);collection.lastDraw={weaponId:item.id,duplicate,...(duplicate?{duplicateBuds}:{})};profile.weapons=normalizeWeapons(collection);profile.inventory.weaponTicket=tickets-1;
  return {item,duplicate,duplicateBuds};
}
