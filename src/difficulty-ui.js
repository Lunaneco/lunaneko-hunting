import {icon} from './icons.js';

export const difficultyName=mode=>mode==='hard'?'チャレンジモード':'冒険モード';

export function difficultyCards(selected){
  return `<div class="mode-options" role="group" aria-label="出撃モード">${[
    {id:'normal',icon:'moon',label:'STANDARD',tag:'物語・育成に',stats:'敵の強さ：標準 ／ スコア ×1',reward:'討伐・回収ミッションで育成素材を集めよう。'},
    {id:'hard',icon:'sword',label:'CHALLENGE',tag:'高難度',stats:'敵のHP・攻撃力 +30% ／ スコア ×1.5',reward:'ユニーク装備などの高難度ミッションに挑もう。'},
  ].map(mode=>`<button type="button" data-difficulty="${mode.id}" class="mode-card ${selected===mode.id?'selected':''}" aria-pressed="${selected===mode.id}" aria-label="${difficultyName(mode.id)}">
    <span class="mode-card-top"><span>${mode.label}</span><span class="mode-selection">${icon('check')}<span data-mode-selection>${selected===mode.id?'選択中':'選ぶ'}</span></span></span>
    <span class="mode-card-title">${icon(mode.icon)}<strong>${difficultyName(mode.id)}</strong><small>${mode.tag}</small></span>
    <span class="mode-stats">${mode.stats}</span><span class="mode-reward">${mode.reward}</span>
  </button>`).join('')}</div>`;
}

export function stageDifficultyView(selected,missionId){
  return `<section id="stage-difficulty" class="stage-difficulty" aria-labelledby="stage-difficulty-title">
    <header><h3 id="stage-difficulty-title">出撃モードを選ぶ</h3><p>選んだ幕の全6WAVEに適用</p></header>
    ${difficultyCards(selected)}
    <div class="mode-mission-note"><p>高難度の報酬は、時間・被弾条件を満たして幕をクリアすると獲得。</p><button data-show-mission="${missionId}">この幕の試練・報酬を見る ${icon('arrow')}</button></div>
  </section>`;
}
