import {icon} from './icons.js';
import {isHeroUnlocked,recruitmentNote} from './recruitment.js';
import {STILL_CAST,isStillUnlocked,stillHeroLevel,stillsForHero} from './stills.js';

function statusText(profile,hero,stills){
  const opened=stills.filter(still=>isStillUnlocked(profile,still)).length;
  const count=`${opened} / ${stills.length}`;
  const level=stillHeroLevel(profile,hero.id);
  if(hero.playable&&!isHeroUnlocked(profile,hero.id))return `${recruitmentNote(hero.id)} · Lv.${Math.max(level,1)} · ${count}`;
  if(!hero.playable&&level<1)return `まだ仲間ではありません · ${count}`;
  return `Lv.${level} · ${count}`;
}

function stillCard(still,unlocked){
  const label=unlocked?`${still.name}のスチル${still.mark}を見る`:`${still.name}のスチル${still.mark}。Lv.${still.level}で解放`;
  if(!unlocked)return `<button class="still-card locked" type="button" data-still="${still.id}" aria-label="${label}"><span>${icon('lock')}<b>Lv.${still.level}</b><small>${still.mark}</small></span></button>`;
  return `<button class="still-card" type="button" data-still="${still.id}" aria-label="${label}"><img src="${still.image}" alt="" width="480" height="640" loading="lazy" decoding="async"><span><small>${still.mark}</small><b>見る</b></span></button>`;
}

export function stillsView(profile){
  const cast=STILL_CAST.map(hero=>{
    const stills=stillsForHero(hero.id);
    const mark=hero.playable?`<span class="portrait ${hero.id}" role="img" aria-label="${hero.name}"></span>`:`<span class="still-mark" aria-hidden="true">${hero.name.slice(0,1)}</span>`;
    return `<section class="still-cast" data-still-hero="${hero.id}"><header>${mark}<div><h3>${hero.name}</h3><small>${statusText(profile,hero,stills)}</small></div></header><div class="still-grid">${stills.map(still=>stillCard(still,isStillUnlocked(profile,still))).join('')}</div></section>`;
  }).join('');
  return `<div class="stills-intro"><span class="eyebrow">CHARACTER STILLS</span><h2>レベルで、スチルがひらく。</h2><p>①はLv.30、②はLv.50、③と④はLv.70。そのキャラのレベルで解放されます。</p></div>${cast}`;
}

export function stillViewer(still){
  return `<div class="still-viewer"><span class="eyebrow">${still.name} · ${still.mark}</span><h2>${still.name}のスチル</h2><img src="${still.image}" alt="${still.name}のスチル${still.mark}"><p>Lv.${still.level}で解放済み</p><button class="primary" data-close>閉じる ${icon('check')}</button></div>`;
}
