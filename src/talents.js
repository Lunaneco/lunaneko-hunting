import {ENEMY_TYPES} from './enemies.js';
import {LEVEL_RULES} from './level-rules.js';
export const MATERIALS=Object.freeze({
  starBud:{rarity:1,name:'星の芽',icon:'spark',source:'敵撃破',note:'通常敵から1〜4個、ボスから6個。両段の強化に使用。'},
  moonDew:{rarity:1,name:'月のしずく',icon:'moon',source:'月の門を突破',note:'各幕の1・2・3つ目の月の門で、それぞれ1・2・3個。1段目の強化に使用。'},
  wardenCore:{rarity:1,name:'守護者の核',icon:'star',source:'ボス撃破',note:'各幕のボスを倒すと1個。1段目の最後の星に使用。'},
  moonPrism:{rarity:2,name:'月虹のしずく',icon:'moon',source:'第2章・チャレンジの門',note:'第2章、または全章のチャレンジモードで、1・2・3つ目の月の門から1・2・3個。毎回入手でき、第2章の突破ミッションでも獲得。2段目に使用。'},
  astralCore:{rarity:2,name:'深星の核',icon:'star',source:'第2章・高難度のボス',note:'第2章またはチャレンジモードのボス、全章の分岐の強ボスから毎回1個。第2章の最終エリア突破ミッションでも1個。2段目に使用。'},
});
export const TREE_RESOURCES=Object.freeze({...MATERIALS,limitStone:{name:'限界突破石',icon:'crystal',source:'章クリア・高難度試練',note:'各章の第4幕クリアで毎回1個。各章の時間制限・ノーダメージ試練でも各1個。レベルの道で上限を10ずつ解放。'}});
export const MATERIAL_DROPS=Object.freeze({...Object.fromEntries(Object.entries(ENEMY_TYPES).map(([id,s])=>[id,{starBud:s.buds}])),boss:{starBud:6,wardenCore:1}});
// Higher-rarity rewards supplement normal drops; replaying an eligible stage earns them again.
export function enemyMaterials(enemy,act,difficulty){return {...MATERIAL_DROPS[enemy.type],...(enemy.type==='boss'&&(act>=4||difficulty==='hard'||enemy.elite)?{astralCore:1}:{})};}
export function gateMaterials(area,act,difficulty){return {moonDew:area+1,...(act>=4||difficulty==='hard'?{moonPrism:area+1}:{})};}
export function resourceLabel(id){const m=TREE_RESOURCES[id];return `${m.rarity?`★${m.rarity} `:''}${m.name}`;}
export function tierMaterialCost(nodes){const total={};for(const node of nodes)for(const [id,n] of Object.entries(node.cost))total[id]=(total[id]??0)+n;return total;}
// Ordered by prerequisites; both the graph and saved-data validation use this order.
export const FIRST_TIER_NODES=Object.freeze([
  {id:'origin',name:'はじまりの光',branch:'原点',icon:'spark',level:1,parents:[],cost:{starBud:4},bonus:{hp:12},x:50,y:12},
  {id:'attack1',name:'攻撃の星 I',branch:'攻撃',icon:'sword',level:3,parents:['origin'],cost:{starBud:8},bonus:{attack:.06},x:18,y:37},
  {id:'guard1',name:'守護の星 I',branch:'守護',icon:'shield',level:3,parents:['origin'],cost:{starBud:8},bonus:{defense:4},x:50,y:37},
  {id:'life1',name:'生命の星 I',branch:'生命',icon:'heart',level:3,parents:['origin'],cost:{starBud:8},bonus:{hp:24},x:82,y:37},
  {id:'attack2',name:'攻撃の星 II',branch:'攻撃',icon:'sword',level:7,parents:['attack1'],cost:{starBud:16,moonDew:2},bonus:{attack:.09},x:18,y:62},
  {id:'guard2',name:'守護の星 II',branch:'守護',icon:'shield',level:7,parents:['guard1'],cost:{starBud:16,moonDew:2},bonus:{defense:7},x:50,y:62},
  {id:'life2',name:'生命の星 II',branch:'生命',icon:'heart',level:7,parents:['life1'],cost:{starBud:16,moonDew:2},bonus:{hp:40},x:82,y:62},
  {id:'awakening',name:'星の目覚め',branch:'奥義',icon:'moon',level:15,parents:['attack2','guard2','life2'],cost:{starBud:24,moonDew:4,wardenCore:1},bonus:{hp:28,attack:.10,defense:6},x:50,y:85},
]);
export const SECOND_TIER_NODES=Object.freeze([
  {id:'ascension',tier:2,name:'深星の扉',branch:'覚醒',icon:'star',level:30,parents:['awakening'],cost:{starBud:160,moonPrism:12,astralCore:4},bonus:{hp:40,attack:.10,defense:8},x:50,y:12},
  {id:'attack3',tier:2,name:'攻撃の星 III',branch:'攻撃',icon:'sword',level:35,parents:['ascension'],cost:{starBud:240,moonPrism:18,astralCore:6},bonus:{attack:.18},x:18,y:37},
  {id:'guard3',tier:2,name:'守護の星 III',branch:'守護',icon:'shield',level:35,parents:['ascension'],cost:{starBud:240,moonPrism:18,astralCore:6},bonus:{defense:18},x:50,y:37},
  {id:'life3',tier:2,name:'生命の星 III',branch:'生命',icon:'heart',level:35,parents:['ascension'],cost:{starBud:240,moonPrism:18,astralCore:6},bonus:{hp:90},x:82,y:37},
  {id:'ultimatePower',tier:2,name:'奥義の威光',branch:'必殺技',icon:'spark',level:40,parents:['attack3'],cost:{starBud:360,moonPrism:30,astralCore:8},bonus:{ultimateDamage:.35},x:18,y:62},
  {id:'ultimateCharge',tier:2,name:'奥義の共鳴',branch:'必殺技',icon:'moon',level:40,parents:['guard3'],cost:{starBud:360,moonPrism:30,astralCore:8},bonus:{ultimateCharge:.25},x:50,y:62},
  {id:'ultimateArt',tier:2,name:'奥義の真髄',branch:'固有必殺技',icon:'shield',level:40,parents:['life3'],cost:{starBud:360,moonPrism:30,astralCore:8},bonus:{},x:82,y:62},
  {id:'transcendence',tier:2,name:'星の超覚醒',branch:'最終奥義',icon:'star',level:50,parents:['ultimatePower','ultimateCharge','ultimateArt'],cost:{starBud:800,moonPrism:60,astralCore:20},bonus:{ultimateDamage:.25},x:50,y:85},
]);
export const TALENT_NODES=Object.freeze([...FIRST_TIER_NODES,...SECOND_TIER_NODES]);
export const LIMIT_BREAK_NODES=Object.freeze(Array.from({length:(LEVEL_RULES.maxLevel-LEVEL_RULES.initialCap)/LEVEL_RULES.capStep},(_,i)=>{
  const level=LEVEL_RULES.initialCap+i*LEVEL_RULES.capStep,cap=level+LEVEL_RULES.capStep;
  return {id:`limit${cap}`,kind:'limit',stage:i+1,name:`限界突破 ${['I','II','III'][i]??i+1}`,branch:'レベルの道',icon:'crystal',level,cap,parents:i?[`limit${level}`]:[],cost:{limitStone:LEVEL_RULES.stoneCost},bonus:{},x:18+i*32,y:40};
}));
export const GROWTH_NODES=Object.freeze([...TALENT_NODES,...LIMIT_BREAK_NODES]);
export function isTalentUnlocked(character,id){const limit=LIMIT_BREAK_NODES.find(node=>node.id===id);return limit?character.breaks>=limit.stage:(character.tree??[]).includes(id);}
export function growthCount(character){return (character.tree??[]).length+LIMIT_BREAK_NODES.filter(node=>isTalentUnlocked(character,node.id)).length;}
export function nextLimitNode(character){return LIMIT_BREAK_NODES.find(node=>!isTalentUnlocked(character,node.id))??LIMIT_BREAK_NODES.at(-1);}
export function nodeEffectText(node){return node.kind==='limit'?`レベル上限 Lv.${node.level} → Lv.${node.cap}`:bonusText(node.bonus);}
export function talentNode(id,heroId){
  const node=GROWTH_NODES.find(n=>n.id===id);if(!node)return null;
  if(id==='awakening'&&heroId==='nyanluna')return {...node,name:'月光の極意',bonus:{hp:20,attack:.12,defense:4}};
  if(id==='awakening'&&heroId==='tsukineko')return {...node,name:'星影の極意',bonus:{hp:36,attack:.08,defense:8}};
  if(id==='awakening'&&heroId==='omsolo')return {...node,name:'翠刃の極意',bonus:{hp:44,attack:.10,defense:10}};
  if(id==='ultimateArt'){
    const art={nyanluna:{name:'月華の慈雨',bonus:{ultimateHeal:16,ultimateRadius:1.5}},tsukineko:{name:'彗星の貫徹',bonus:{ultimatePierce:1,ultimateRange:4}},omsolo:{name:'翠光の加護',bonus:{ultimateHeal:12,ultimateImmunity:.6}}}[heroId];
    if(art)return {...node,...art};
  }
  if(id==='transcendence'){
    const art={nyanluna:{name:'月華・超覚醒',bonus:{ultimatePulses:1}},tsukineko:{name:'彗星・超覚醒',bonus:{ultimateShots:4}},omsolo:{name:'翠光・超覚醒',bonus:{ultimatePulses:2}}}[heroId];
    if(art)return {...node,name:art.name,bonus:{...node.bonus,...art.bonus}};
  }
  return node;
}
export function normalizeTalentTree(raw,level=50){
  const requested=new Set(Array.isArray(raw)?raw:[]),valid=[];
  for(const node of TALENT_NODES)if(requested.has(node.id)&&level>=node.level&&node.parents.every(id=>valid.includes(id)))valid.push(node.id);
  return valid;
}
export function talentBonuses(character,heroId){
  return sumBonuses(character,heroId,['hp','attack','defense']);
}
export function ultimateBonuses(character,heroId){
  return sumBonuses(character,heroId,['ultimateDamage','ultimateCharge','ultimateHeal','ultimateRadius','ultimatePierce','ultimateRange','ultimateImmunity','ultimatePulses','ultimateShots']);
}
function sumBonuses(character,heroId,keys){
  const bonus=Object.fromEntries(keys.map(key=>[key,0]));
  for(const id of normalizeTalentTree(character.tree,character.level)){const node=talentNode(id,heroId);for(const stat of Object.keys(bonus))bonus[stat]+=node.bonus[stat]??0;}
  return bonus;
}
export function bonusText(bonus){return [bonus.hp?`基礎HP +${bonus.hp}`:'',bonus.attack?`基礎攻撃力 +${Math.round(bonus.attack*100)}%`:'',bonus.defense?`基礎防御力 +${bonus.defense}`:'',
  bonus.ultimateDamage?`必殺技威力 +${Math.round(bonus.ultimateDamage*100)}%`:'',bonus.ultimateCharge?`必殺ゲージ獲得 +${Math.round(bonus.ultimateCharge*100)}%`:'',
  bonus.ultimateHeal?`必殺技の回復量 +${bonus.ultimateHeal}`:'',bonus.ultimateRadius?`必殺技の半径 +${bonus.ultimateRadius}`:'',bonus.ultimatePierce?`必殺弾の貫通 +${bonus.ultimatePierce}体`:'',bonus.ultimateRange?`必殺弾の射程 +${bonus.ultimateRange}`:'',bonus.ultimateImmunity?`必殺技の無敵時間 +${bonus.ultimateImmunity}秒`:'',bonus.ultimatePulses?`必殺技の攻撃回数 +${bonus.ultimatePulses}回`:'',bonus.ultimateShots?`必殺技の連射数 +${bonus.ultimateShots}発`:'',
].filter(Boolean).join(' ／ ');}
