import {EXTRA_ACTS,isActUnlocked,isActCleared,clearTicketReward} from './acts.js';
import {EXTRA_COMBAT_HINT,EXTRA_FIRST_TICKETS,EXTRA_REPEAT_TICKETS} from './extra-stages.js';

export function extraStageSelector(chapter,selected,profile){
 const act=EXTRA_ACTS.find(a=>a.chapter===chapter);if(!act)return '';const unlocked=isActUnlocked(profile,act.id),cleared=isActCleared(profile,act.id);
 return `<section class="extra-stage-selector" aria-label="第${chapter+1}章のエクストラステージ"><button data-act="${act.id}" aria-pressed="${selected===act.id}" ${unlocked?'':'disabled'}><span><small>EXTRA · Lv.50 · ${cleared?'CLEAR':unlocked?'OPEN':'LOCKED'}</small><strong>エクストラ · ${act.title}</strong><span>${unlocked?`次のクリア報酬：武器ガチャ券 ${clearTicketReward(profile,act.id)}枚`:'第2章・第4幕クリアで解放'}</span></span><b>${unlocked?'→':'未解放'}</b></button></section>`;
}
export function extraDifficultyView(){
 return `<section id="stage-difficulty" class="stage-difficulty extra-difficulty" aria-labelledby="stage-difficulty-title"><header><h3 id="stage-difficulty-title">エクストラ · 最高難度固定</h3><p>全6WAVE · 適正 Lv.50</p></header><p>${EXTRA_COMBAT_HINT}</p><p>ミッションなし。最後の月の門を通ると、各ステージの初回クリアで武器ガチャ券${EXTRA_FIRST_TICKETS}枚、2回目以降は${EXTRA_REPEAT_TICKETS}枚を獲得。</p></section>`;
}
