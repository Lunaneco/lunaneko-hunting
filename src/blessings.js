import {SKILL_TALENT_NODES} from './skill-tree.js';
import {isHeroUnlocked} from './recruitment.js';
export const SKILL_SLOTS=3;
export const SKILLS = [
  { id:'power', requires:['nyanluna', 'tsukineko'], name:'月と銃の約束', icon:'spark', type:'攻撃', text:'ふたりの与えるダメージ +25%', max:4 },
  { id:'haste', requires:['tsukineko'], name:'星降るリズム', icon:'wind', type:'速度', text:'通常攻撃の間隔を 15% 短縮', max:3 },
  { id:'vitality', name:'生命の花冠', icon:'heart', type:'守護', text:'最大HP +40、HPを60回復', max:3 },
  { id:'nova', requires:['nyanluna'], name:'こぼれる星屑', icon:'star', type:'連鎖', text:'敵を倒すと周囲へ星屑攻撃。にゃんるなは威力1.5倍', max:3 },
  { id:'orbit', requires:['nyanluna'], name:'月衛の輪', icon:'moon', type:'魔法', text:'操作キャラを守る周回星を1つ追加。にゃんるなは威力1.5倍', max:3 },
  { id:'echo', requires:['nyanluna', 'tsukineko'], name:'双星の共鳴', icon:'link', type:'絆', text:'控えの仲間の援護攻撃を 35% 強化', max:3 },
  { id:'stride', name:'風の足音', icon:'wind', type:'回避', text:'移動速度 +12%、回避の再使用を短縮', max:3 },
  { id:'focus', requires:['tsukineko'], name:'星銃の闘志', icon:'moon', type:'必殺', text:'攻撃した本人の必殺ゲージ獲得量 +30%', max:3 },
  { id:'leech', name:'やさしい灯火', icon:'heart', type:'回復', text:'敵を6体倒すたびHPを8回復', max:3 },
  { id:'crit', requires:['tsukineko'], name:'一番星の閃き', icon:'gun', type:'会心', text:'会心率 +15%（基礎会心ダメージ2倍）', max:3 },
  { id:'reach', requires:['nyanluna'], name:'遠い星への手紙', icon:'spark', type:'射程', text:'攻撃範囲 +18%、クリスタルの回収範囲拡大', max:3 },
  { id:'ward', name:'夜明けのヴェール', icon:'shield', type:'守護', text:'受けるダメージを 15% 軽減', max:3 },
  {id:'saberPower',requires:['omsolo'],name:'翠刃の研鑽',icon:'sword',type:'剣術',text:'オムソロの通常斬撃ダメージ +22%',max:4},
  {id:'saberReach',requires:['omsolo'],name:'踏み込みの光',icon:'wind',type:'剣術',text:'オムソロの斬撃範囲 +0.35',max:3},
  {id:'saberGuard',requires:['omsolo'],name:'守り手の構え',icon:'shield',type:'守護',text:'編成全体の被ダメージをさらに15%軽減',max:2},
  {id:'moonGuard',requires:['nyanluna','omsolo'],name:'月と翠刃の誓い',icon:'link',type:'絆',text:'にゃんるなとオムソロの与えるダメージ +18%',max:3},
  {id:'starBlade',requires:['tsukineko','omsolo'],name:'銃剣の挟撃',icon:'link',type:'絆',text:'与えるダメージ +18%／援護攻撃 +20%',max:3},
  {id:'arcanePower',requires:['nyanluna'],unlockNode:'blessing1',name:'月詠みの魔力',icon:'spark',type:'魔法',text:'必殺技・星屑・周回星の威力 +18%。にゃんるなの威力1.5倍と重ねて有効',max:3},
  {id:'starlightHeal',requires:['nyanluna'],unlockNode:'blessing2',name:'星結びの祝福',icon:'heart',type:'回復',text:'祝福を選ぶたびHPを18回復。にゃんるな操作中は27回復。この祝福の取得時も有効',max:3},
  {id:'moonFrost',requires:['nyanluna'],unlockNode:'blessing3',name:'月影の結界',icon:'moon',type:'妨害',text:'にゃんるなの通常魔法が2秒間、敵の移動を35%／45%／55%減速。ボスには半分の効果',max:3},
  {id:'penetration',requires:['tsukineko'],unlockNode:'blessing1',name:'貫く星弾',icon:'gun',type:'射撃',text:'つきねこの通常弾が貫通する敵の数 +1体',max:2},
  {id:'preciseAim',requires:['tsukineko'],unlockNode:'blessing2',name:'狙い澄ます一瞬',icon:'spark',type:'会心',text:'通常攻撃の会心倍率を +0.25倍（基礎2倍）',max:3},
  {id:'rapidCharge',requires:['tsukineko'],unlockNode:'blessing3',name:'星銃の装填',icon:'gun',type:'必殺',text:'敵撃破時の必殺ゲージ基礎獲得量 +1。必殺技による撃破は対象外',max:3},
  {id:'bladeTempo',requires:['omsolo'],unlockNode:'blessing1',name:'翠刃の連舞',icon:'sword',type:'剣術',text:'オムソロの通常斬撃の間隔を10%短縮',max:3},
  {id:'counterGuard',requires:['omsolo'],unlockNode:'blessing2',name:'揺るがぬ守り',icon:'shield',type:'守護',text:'被弾後の無敵時間 +0.1秒',max:3},
  {id:'vowRecovery',requires:['omsolo'],unlockNode:'blessing3',name:'守り手の祈り',icon:'heart',type:'回復',text:'HP回復量 +15%。祝福・門の回復・必殺技に有効',max:3},
];
export const PERSONAL_SKILLS=Object.freeze(Object.fromEntries(['nyanluna','tsukineko','omsolo'].map(id=>[id,SKILLS.filter(s=>s.requires?.length===1&&s.requires[0]===id)])));
export function personalSkills(heroId){return Object.hasOwn(PERSONAL_SKILLS,heroId)?PERSONAL_SKILLS[heroId]:[];}
export function defaultSkills(heroId){return personalSkills(heroId).filter(s=>!s.unlockNode).map(s=>s.id);}
export function isSkillAvailable(profile,heroId,skillId){
  const skill=personalSkills(heroId).find(s=>s.id===skillId);if(!skill)return false;
  if(!skill.unlockNode)return true;
  const node=SKILL_TALENT_NODES.find(n=>n.id===skill.unlockNode),p=profile?.characters?.[heroId];
  return Array.isArray(p?.tree)&&p.level>=node.level&&p.tree.includes(node.id)&&node.parents.every(id=>p.tree.includes(id));
}
export function equippedSkills(profile,heroId){
  const raw=profile?.blessingLoadouts?.[heroId],valid=[];
  for(const id of [...(Array.isArray(raw)?raw:[]),...defaultSkills(heroId)]){
    if(valid.length===SKILL_SLOTS)break;
    if(!valid.includes(id)&&isSkillAvailable(profile,heroId,id))valid.push(id);
  }
  return valid;
}
export function normalizeSkillLoadouts(raw,profile){return Object.fromEntries(Object.keys(PERSONAL_SKILLS).map(id=>[id,equippedSkills({...profile,blessingLoadouts:raw},id)]));}
export function equipSkill(profile,heroId,slot,skillId){
  if(!isHeroUnlocked(profile,heroId)||!Number.isInteger(slot)||slot<0||slot>=SKILL_SLOTS||!isSkillAvailable(profile,heroId,skillId))return false;
  const next=equippedSkills(profile,heroId),old=next.indexOf(skillId);
  if(next[slot]===skillId)return false;
  if(old!==-1)next[old]=next[slot];
  next[slot]=skillId;profile.blessingLoadouts??={};profile.blessingLoadouts[heroId]=next;return true;
}
// Common and pair blessings are automatic. Personal candidates use a fixed loadout.
export function skillsForParty(party,profile){
  const ids=new Set(party),equipped=new Set(party.flatMap(id=>equippedSkills(profile,id)));
  return SKILLS.filter(skill=>(skill.requires??[]).every(id=>ids.has(id))&&(skill.requires?.length!==1||equipped.has(skill.id)));
}
export function blessingSource(skill,roster){
  if(!skill.requires?.length)return '共通';
  if(skill.requires.length>1)return 'ふたりの連携';
  return `${roster.find(hero=>hero.id===skill.requires[0])?.name??'仲間'}の祝福`;
}
export function partyTitle(party,roster){return party.map(id=>roster.find(hero=>hero.id===id)?.name??'仲間').join(' × ');}
