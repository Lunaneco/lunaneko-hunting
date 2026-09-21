import {heroAbilities} from './abilities-ui.js';
import {isHeroUnlocked,recruitmentNote} from './recruitment.js';
import {WEAPONS,uniqueEquipment,equipmentBonusText,equipmentBonuses} from './equipment.js';
import {HEROES} from './model.js';
import {talentBonuses,GROWTH_NODES,growthCount,nextLimitNode} from './talents.js';
import {characterProgress,characterStats,breakthroughStatus,levelCap,xpRequired,LEVEL_RULES} from './progression.js';

export function growthCards(profile){
  return HEROES.map(hero=>{
    if(!isHeroUnlocked(profile,hero.id))return `<article class="growth-card unrecruited"><header><span class="portrait ${hero.id}"></span><div><small>${hero.title}</small><h3>${hero.name}</h3></div></header><p class="recruitment-note">${recruitmentNote(hero.id)}。<br>加入すると育成・成長ツリー・装備を利用できます。</p></article>`;
    const p=characterProgress(profile,hero.id),stats=characterStats(hero,p),status=breakthroughStatus(profile,hero.id),atCap=p.level>=levelCap(p),max=p.level===LEVEL_RULES.maxLevel,tree=talentBonuses(p,hero.id);
    const description=max?'最大レベルです':atCap?`蓄積EXP ${p.xp.toLocaleString()} · 限界突破後に反映`:`EXP ${p.xp.toLocaleString()} / ${xpRequired(p.level).toLocaleString()}`;
    const limit=nextLimitNode(p);
    return `<article class="growth-card" id="growth-${hero.id}" tabindex="-1"><header><span class="portrait ${hero.id}" role="img" aria-label="${hero.name}"></span><div><small>${hero.title}</small><h3>${hero.name}</h3></div><span class="growth-level">Lv.<b>${p.level}</b><small>/ ${status.cap}</small></span></header><div class="growth-exp-track" role="progressbar" aria-label="${hero.name}の経験値" aria-valuemin="0" aria-valuemax="${xpRequired(p.level)}" aria-valuenow="${atCap?xpRequired(p.level):p.xp}" aria-valuetext="${description}"><i style="width:${atCap?100:p.xp/xpRequired(p.level)*100}%"></i></div><p class="growth-exp ${atCap?'at-cap':''}">${description}</p><dl class="growth-stats"><div><dt>基礎HP</dt><dd>${stats.maxHp}</dd></div><div><dt>基礎攻撃力</dt><dd>${Number(stats.attack.toFixed(1))}</dd></div><div><dt>基礎防御力</dt><dd>${stats.defense}</dd></div></dl><p class="defense-breakdown">防御内訳：固有 ${hero.baseDefense} ＋ レベル ${p.level-1} ＋ ツリー ${tree.defense}<br>防御による被ダメージ軽減 ${Number((stats.defense/(100+stats.defense)*100).toFixed(1))}%</p>${heroAbilities(hero,p)}<div class="growth-equipment-note">専用武器：${WEAPONS[hero.id].name}<br>ユニーク：${uniqueEquipment(profile.equipment?.loadout?.[hero.id])?.name??'未装備'} · ${equipmentBonusText(equipmentBonuses(profile.equipment,hero.id))}<button data-open-equipment="${hero.id}">装備と冒険時の能力を見る →</button></div><button class="growth-tree-link" data-open-tree="${hero.id}">成長ツリー ${growthCount(p)} / ${GROWTH_NODES.length} <span>→</span></button><footer><p>${status.maxed?`最大上限 Lv.${status.cap}`:`レベル上限 <b>${status.cap} → ${status.nextCap}</b> ／ 石${status.cost}個`}</p><button data-open-tree="${hero.id}" data-tree-target="${limit.id}" aria-label="${hero.name}の限界突破を成長ツリーで確認">${status.maxed?'限界突破済みの星を確認':'限界突破をツリーで見る'} →</button></footer></article>`;
  }).join('');
}
