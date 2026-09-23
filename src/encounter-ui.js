import {ENEMY_TYPES,CHAPTER_TWO_ENEMIES} from './enemies.js';

export function encounterPreparation(act,party,profile,roster){
 if(!act.recommendedLevel)return '';
 const members=party.map(id=>({name:roster.find(h=>h.id===id).name,level:profile.characters[id]?.level??1}));
 const ready=members.every(h=>h.level>=act.recommendedLevel);
 return `<section class="encounter-brief" aria-label="第2章の戦闘と育成目安"><header><strong>適正 Lv.${act.recommendedLevel}</strong><span>穂むすびの国 · 連射と時間差攻撃</span></header><p class="encounter-levels ${ready?'ready':'preparing'}">${members.map(h=>`${h.name} Lv.${h.level}`).join(' ／ ')}<b>${ready?'育成の目安を達成':'Lv.30を目安に育成しよう'}</b></p><p>限界突破で上限をLv.30へ。覚醒の石は第1章・第4幕をクリアするたび1個。Lv.30への覚醒には石1個と★1素材（星の芽60・月のしずく12・守護者の核3）を使用。第1章の再挑戦ですべて集められます。現在のレベルでも出撃できます。</p><button class="secondary" data-prepare-levels>成長ツリーで準備する →</button><div class="encounter-roster">${CHAPTER_TWO_ENEMIES.map(id=>`<span><b>${ENEMY_TYPES[id].name}</b><small>${ENEMY_TYPES[id].role}</small></span>`).join('')}</div><small>通常戦から新しい敵が出現。チャレンジモードでは、ここからさらに敵のHP・攻撃力が30%上がります。</small></section>`;
}
