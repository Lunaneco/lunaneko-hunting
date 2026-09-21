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
  { id:'crit', requires:['tsukineko'], name:'一番星の閃き', icon:'gun', type:'会心', text:'会心率 +15%（会心ダメージ2倍）', max:3 },
  { id:'reach', requires:['nyanluna'], name:'遠い星への手紙', icon:'spark', type:'射程', text:'攻撃範囲 +18%、クリスタルの回収範囲拡大', max:3 },
  { id:'ward', name:'夜明けのヴェール', icon:'shield', type:'守護', text:'受けるダメージを 15% 軽減', max:3 },
  {id:'saberPower',requires:['omsolo'],name:'翠刃の研鑽',icon:'sword',type:'剣術',text:'オムソロの通常斬撃ダメージ +22%',max:4},
  {id:'saberReach',requires:['omsolo'],name:'踏み込みの光',icon:'wind',type:'剣術',text:'オムソロの斬撃範囲 +0.35',max:3},
  {id:'saberGuard',requires:['omsolo'],name:'守り手の構え',icon:'shield',type:'守護',text:'編成全体の被ダメージをさらに15%軽減',max:2},
  {id:'moonGuard',requires:['nyanluna','omsolo'],name:'月と翠刃の誓い',icon:'link',type:'絆',text:'にゃんるなとオムソロの与えるダメージ +18%',max:3},
  {id:'starBlade',requires:['tsukineko','omsolo'],name:'銃剣の挟撃',icon:'link',type:'絆',text:'与えるダメージ +18%／援護攻撃 +20%',max:3},

];
// A blessing's requirements refer to the whole deployed party, independent of its lead.
export function skillsForParty(party){const ids=new Set(party);return SKILLS.filter(skill=>(skill.requires??[]).every(id=>ids.has(id)));}
export function blessingSource(skill,roster){
  if(!skill.requires?.length)return '共通';
  if(skill.requires.length>1)return 'ふたりの連携';
  return `${roster.find(hero=>hero.id===skill.requires[0])?.name??'仲間'}の祝福`;
}
export function partyTitle(party,roster){return party.map(id=>roster.find(hero=>hero.id===id)?.name??'仲間').join(' × ');}
