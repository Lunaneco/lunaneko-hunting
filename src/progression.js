import {ENEMY_TYPES} from './enemies.js';
import {MATERIALS,talentNode,isTalentUnlocked,normalizeTalentTree,talentBonuses} from './talents.js';
import {LEVEL_RULES,LEVEL_AWAKENING_COSTS} from './level-rules.js';
import {normalizeEquipment,equipmentBonuses} from './equipment.js';
import {normalizeWeapons,weaponAttackBonus,weaponDefenseBonus} from './weapons.js';
import {normalizeMissions} from './missions.js';
import {normalizeStory} from './acts.js';
export {LEVEL_RULES} from './level-rules.js';
export const PROGRESSION_KEY='lunaria-progression-v1';
export const ENEMY_REWARDS=Object.freeze({...Object.fromEntries(Object.entries(ENEMY_TYPES).map(([id,s])=>[id,{xp:s.xp,crystals:s.crystals}])),boss:{xp:60,crystals:0}});
const integer=(n,fallback=0,max=99999999)=>Number.isFinite(n)&&n>=0?Math.min(max,Math.floor(n)):fallback;
const safeId=id=>typeof id==='string'&&/^[a-z0-9_-]{1,64}$/i.test(id)&&!['__proto__','constructor','prototype'].includes(id);
export function levelCap(character){return Math.min(LEVEL_RULES.maxLevel,LEVEL_RULES.initialCap+character.breaks*LEVEL_RULES.capStep);}
export function xpRequired(level){return 48+level*24+Math.max(0,level-20)**2;}
export function normalizeProgression(raw,roster=[],legacyRecord={}){
  const result={version:1,story:normalizeStory(raw?.story,legacyRecord),characters:{},inventory:{limitStone:integer(raw?.inventory?.limitStone),weaponTicket:integer(raw?.inventory?.weaponTicket),...Object.fromEntries(Object.keys(MATERIALS).map(id=>[id,integer(raw?.inventory?.[id])]))},equipment:normalizeEquipment(raw?.equipment),weapons:normalizeWeapons(raw?.weapons),missions:normalizeMissions(raw?.missions)};
  const source=raw?.characters&&typeof raw.characters==='object'&&!Array.isArray(raw.characters)?raw.characters:{};
  result.tutorial={firstBattleCompleted:raw?.tutorial?.firstBattleCompleted===true};
  for(const id of new Set([...Object.keys(source),...roster.map(h=>h.id)])){
    if(!safeId(id))continue;const item=source[id],breaks=integer(item?.breaks,0,(LEVEL_RULES.maxLevel-LEVEL_RULES.initialCap)/LEVEL_RULES.capStep);
    const character={level:Math.max(1,integer(item?.level,1)),xp:integer(item?.xp),breaks};character.level=Math.min(character.level,levelCap(character));
    applyBankedXp(character);character.tree=normalizeTalentTree(item?.tree,character.level);result.characters[id]=character;
  }
  return result;
}
export function characterProgress(profile,id){
  if(!safeId(id))return null;
  return profile.characters[id]??(profile.characters[id]={level:1,xp:0,breaks:0,tree:[]});
}
function applyBankedXp(character){
  while(character.level<levelCap(character)&&character.xp>=xpRequired(character.level)){character.xp-=xpRequired(character.level);character.level++;}
  if(character.level===LEVEL_RULES.maxLevel)character.xp=0;
}
export function awardCharacterXp(profile,id,amount){
  const character=characterProgress(profile,id);if(!character)return null;
  const before=character.level,value=integer(amount);
  if(character.level>=LEVEL_RULES.maxLevel)return {heroId:id,amount:0,before,level:before};
  character.xp=integer(character.xp+value);applyBankedXp(character);
  return {heroId:id,amount:value,before,level:character.level};
}
export function characterStats(hero,character){
  const growth=Math.max(0,character.level-1),tree=talentBonuses(character,hero.id);
  return {maxHp:(hero.baseHp??180)+growth*LEVEL_RULES.hpPerLevel+tree.hp,attack:hero.damage*(1+growth*LEVEL_RULES.attackPerLevel)*(1+tree.attack),defense:(hero.baseDefense??8)+growth*LEVEL_RULES.defensePerLevel+tree.defense};
}
export function combatStats(profile,hero){
  const base=characterStats(hero,characterProgress(profile,hero.id)),bonus=equipmentBonuses(profile.equipment,hero.id);
  return {maxHp:base.maxHp+(bonus.hp??0),attack:base.attack*(1+(bonus.attack??0))*(1+weaponAttackBonus(profile,hero.id)),defense:base.defense+(bonus.defense??0)+weaponDefenseBonus(profile,hero.id)};
}
export function breakthroughStatus(profile,id){
  const character=characterProgress(profile,id);if(!character)return {canBreak:false};
  const cap=levelCap(character),maxed=cap>=LEVEL_RULES.maxLevel,costs=LEVEL_AWAKENING_COSTS[character.breaks]??{};
  const missing=Object.entries(costs).filter(([id,cost])=>integer(profile.inventory[id])<cost).map(([id,needed])=>({id,needed,owned:integer(profile.inventory[id])}));
  return {cap,nextCap:Math.min(LEVEL_RULES.maxLevel,cap+LEVEL_RULES.capStep),cost:costs.limitStone??0,costs,missing,maxed,canBreak:!maxed&&character.level>=cap&&!missing.length};
}
export function breakthrough(profile,id){
  const status=breakthroughStatus(profile,id);if(!status.canBreak)return false;
  for(const [resource,cost] of Object.entries(status.costs))profile.inventory[resource]-=cost;
  const character=characterProgress(profile,id);character.breaks++;applyBankedXp(character);return true;
}
export function grantLimitStone(profile,count=1){profile.inventory.limitStone=integer(profile.inventory.limitStone+integer(count));}
export function grantMaterials(profile,rewards={}){
  const granted={};for(const id of Object.keys(MATERIALS)){const count=integer(rewards[id]);if(!count)continue;const before=integer(profile.inventory[id]);profile.inventory[id]=integer(before+count);granted[id]=profile.inventory[id]-before;}
  return granted;
}
export function talentStatus(profile,heroId,nodeId){
  const node=talentNode(nodeId,heroId),character=characterProgress(profile,heroId);if(!node||!character)return {canUnlock:false};
  const owned=isTalentUnlocked(character,nodeId),parents=node.parents.filter(id=>!isTalentUnlocked(character,id));
  const missing=Object.entries(node.cost).filter(([id,cost])=>integer(profile.inventory[id])<cost).map(([id,cost])=>({id,needed:cost,owned:integer(profile.inventory[id])}));
  return {node,owned,parents,missing,levelMet:character.level>=node.level,canUnlock:!owned&&character.level>=node.level&&!parents.length&&!missing.length&&(node.kind!=='limit'||character.breaks+1===node.stage)};
}
export function unlockTalent(profile,heroId,nodeId){
  const status=talentStatus(profile,heroId,nodeId);if(!status.canUnlock)return false;
  if(status.node.kind==='limit')return breakthrough(profile,heroId);
  for(const [id,cost] of Object.entries(status.node.cost))profile.inventory[id]-=cost;
  const character=characterProgress(profile,heroId);character.tree=normalizeTalentTree([...(character.tree??[]),nodeId],character.level);return true;
}
export function previewLimitBreak(profile,heroId,nodeId){
  if(talentNode(nodeId,heroId)?.kind!=='limit'||!talentStatus(profile,heroId,nodeId).canUnlock)return null;
  const character=characterProgress(profile,heroId),copy={inventory:{...profile.inventory},characters:{[heroId]:{...character,tree:[...(character.tree??[])]}}};
  unlockTalent(copy,heroId,nodeId);return copy.characters[heroId];
}
