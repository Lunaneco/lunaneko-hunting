import {ENEMY_TYPES} from './enemies.js';
import {LEVEL_RULES} from './level-rules.js';
export const MATERIALS=Object.freeze({
  starBud:{name:'星の芽',icon:'spark',source:'敵撃破',note:'草の魔物・コウモリ・弓兵から1個、ゴーレム・魔導士・突撃獣から2個。第2章の通常敵から3〜4個。ボスから6個。'},
  moonDew:{name:'月のしずく',icon:'moon',source:'ステージ突破',note:'月の門を通ると入手。草原1個、遺跡2個、聖域3個。'},
  wardenCore:{name:'守護者の核',icon:'star',source:'守護者撃破',note:'各幕のボスを倒すと1個。各キャラの奥義の解放に使用。'},
});
export const TREE_RESOURCES=Object.freeze({...MATERIALS,limitStone:{name:'限界突破石',icon:'crystal',source:'章クリア・高難度ミッション',note:'各章の第4幕クリアで毎回1個。各章の時間制限・ノーダメージ試練でも各1個。レベルの道で上限を10ずつ解放。'}});
export const MATERIAL_DROPS=Object.freeze({...Object.fromEntries(Object.entries(ENEMY_TYPES).map(([id,s])=>[id,{starBud:s.buds}])),boss:{starBud:6,wardenCore:1}});
// Ordered by prerequisites; both the graph and saved-data validation use this order.
export const TALENT_NODES=Object.freeze([
  {id:'origin',name:'はじまりの光',branch:'原点',icon:'spark',level:1,parents:[],cost:{starBud:4},bonus:{hp:12},x:50,y:12},
  {id:'attack1',name:'攻撃の星 I',branch:'攻撃',icon:'sword',level:3,parents:['origin'],cost:{starBud:8},bonus:{attack:.06},x:18,y:37},
  {id:'guard1',name:'守護の星 I',branch:'守護',icon:'shield',level:3,parents:['origin'],cost:{starBud:8},bonus:{defense:4},x:50,y:37},
  {id:'life1',name:'生命の星 I',branch:'生命',icon:'heart',level:3,parents:['origin'],cost:{starBud:8},bonus:{hp:24},x:82,y:37},
  {id:'attack2',name:'攻撃の星 II',branch:'攻撃',icon:'sword',level:7,parents:['attack1'],cost:{starBud:16,moonDew:2},bonus:{attack:.09},x:18,y:62},
  {id:'guard2',name:'守護の星 II',branch:'守護',icon:'shield',level:7,parents:['guard1'],cost:{starBud:16,moonDew:2},bonus:{defense:7},x:50,y:62},
  {id:'life2',name:'生命の星 II',branch:'生命',icon:'heart',level:7,parents:['life1'],cost:{starBud:16,moonDew:2},bonus:{hp:40},x:82,y:62},
  {id:'awakening',name:'星の目覚め',branch:'奥義',icon:'moon',level:15,parents:['attack2','guard2','life2'],cost:{starBud:24,moonDew:4,wardenCore:1},bonus:{hp:28,attack:.10,defense:6},x:50,y:85},
]);
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
  return node;
}
export function normalizeTalentTree(raw,level=50){
  const requested=new Set(Array.isArray(raw)?raw:[]),valid=[];
  for(const node of TALENT_NODES)if(requested.has(node.id)&&level>=node.level&&node.parents.every(id=>valid.includes(id)))valid.push(node.id);
  return valid;
}
export function talentBonuses(character,heroId){
  const bonus={hp:0,attack:0,defense:0};
  for(const id of normalizeTalentTree(character.tree,character.level)){const node=talentNode(id,heroId);for(const stat of Object.keys(bonus))bonus[stat]+=node.bonus[stat]??0;}
  return bonus;
}
export function bonusText(bonus){return [bonus.hp?`基礎HP +${bonus.hp}`:'',bonus.attack?`基礎攻撃力 +${Math.round(bonus.attack*100)}%`:'',bonus.defense?`基礎防御力 +${bonus.defense}`:''].filter(Boolean).join(' ／ ');}
