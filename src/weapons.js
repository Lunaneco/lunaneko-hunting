import {WEAPONS} from './equipment.js';

export const WEAPON_TICKET_DROP_RATE=.05;
export const WEAPON_HERO_IDS=Object.freeze(['nyanluna','tsukineko','omsolo']);
export const WEAPON_RARITIES=Object.freeze([
  Object.freeze({rank:1,name:'通常',color:'#b7cbc7',attack:0,chance:0,duplicateBuds:0}),
  Object.freeze({rank:2,name:'希少',color:'#86d5ff',attack:.10,chance:.75,duplicateBuds:10}),
  Object.freeze({rank:3,name:'特級',color:'#d0a9ff',attack:.22,chance:.20,duplicateBuds:30}),
  Object.freeze({rank:4,name:'伝説',color:'#ffd580',attack:.40,chance:.05,duplicateBuds:100}),
]);
export const WEAPON_CATALOG=Object.freeze(WEAPON_HERO_IDS.flatMap(heroId=>WEAPON_RARITIES.map(rarity=>Object.freeze({id:`${WEAPONS[heroId].id}-r${rarity.rank}`,heroId,weapon:WEAPONS[heroId],rarity}))));
const MAX_COUNT=99999999;
const count=value=>Number.isFinite(value)&&value>=0?Math.min(MAX_COUNT,Math.floor(value)):0;
export const weaponVariant=id=>WEAPON_CATALOG.find(item=>item.id===id);
export const rarityLabel=rarity=>`★${rarity.rank} ${rarity.name}`;
export function normalizeWeapons(raw){
  const owned=WEAPON_CATALOG.filter(item=>item.rarity.rank===1||Array.isArray(raw?.owned)&&raw.owned.includes(item.id)).map(item=>item.id);
  const last=weaponVariant(raw?.lastDraw?.weaponId),validLast=last?.rarity.rank>1&&owned.includes(last.id);
  return {owned,draws:count(raw?.draws),lastDraw:validLast?{weaponId:last.id,duplicate:raw.lastDraw.duplicate===true}:null};
}
export function equippedWeapon(profile,heroId){
  return WEAPON_CATALOG.filter(item=>item.heroId===heroId&&(item.rarity.rank===1||profile?.weapons?.owned?.includes(item.id))).at(-1)??null;
}
export function weaponAttackBonus(profile,heroId){return equippedWeapon(profile,heroId)?.rarity.attack??0;}
export function grantWeaponTickets(profile,amount=1){
  const before=count(profile.inventory.weaponTicket);profile.inventory.weaponTicket=count(before+count(amount));return profile.inventory.weaponTicket-before;
}
// Separate loot RNG lets boss rewards stay deterministic without changing combat rolls.
export function bossWeaponTicket(profile,enemy,rng=Math.random){
  if(enemy.type!=='boss'||enemy.training||enemy.hp>0)return 0;
  const roll=rng();return Number.isFinite(roll)&&roll>=0&&roll<WEAPON_TICKET_DROP_RATE?grantWeaponTickets(profile):0;
}
export function drawWeapon(profile,rng=Math.random){
  const tickets=count(profile.inventory?.weaponTicket);if(tickets<1)return null;
  // Validate both rolls before consuming a ticket or altering the collection.
  const heroRoll=rng(),rarityRoll=rng();if(![heroRoll,rarityRoll].every(n=>Number.isFinite(n)&&n>=0&&n<1))return null;
  const heroId=WEAPON_HERO_IDS[Math.floor(heroRoll*WEAPON_HERO_IDS.length)];
  let cumulative=0;const rarity=WEAPON_RARITIES.filter(r=>r.chance).find(r=>(cumulative+=r.chance)>rarityRoll);
  const item=WEAPON_CATALOG.find(item=>item.heroId===heroId&&item.rarity===rarity);
  const collection=normalizeWeapons(profile.weapons),duplicate=collection.owned.includes(item.id),previousRank=equippedWeapon({weapons:collection},heroId).rarity.rank;
  if(!duplicate)collection.owned.push(item.id);
  let duplicateBuds=0;if(duplicate){const before=count(profile.inventory.starBud);profile.inventory.starBud=count(before+rarity.duplicateBuds);duplicateBuds=profile.inventory.starBud-before;}
  collection.draws=count(collection.draws+1);collection.lastDraw={weaponId:item.id,duplicate};profile.weapons=normalizeWeapons(collection);profile.inventory.weaponTicket=tickets-1;
  return {item,duplicate,duplicateBuds,upgraded:rarity.rank>previousRank};
}
