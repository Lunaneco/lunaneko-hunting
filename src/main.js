import {publicUrl} from './public-url.js';
import {difficultyName,difficultyCards,stageDifficultyView} from './difficulty-ui.js';
import './difficulty.css';
import {fieldFor,heightAt} from './terrain.js';
import {fieldSummary,mapSvg,updateTerrainUi} from './terrain-ui.js';
import './terrain.css';
import {ENEMY_TYPES,BOSSES,enemyRosterForAct} from './enemies.js';
import {encounterPreparation} from './encounter-ui.js';
import {ACTS,CHAPTERS,chapterForAct,actLabel,isActUnlocked,nextAct} from './acts.js';
import {ultimateFor} from './abilities.js';
import './abilities.css';
import {needsFirstBattleTutorial} from './tutorial.js';
import {BattleTutorialView} from './tutorial-ui.js';
import './tutorial.css';
import {availableHeroes,isHeroUnlocked,recruitmentNote} from './recruitment.js';
import {missionsView,equipmentView,currentMissions,missionRewardText} from './rewards-ui.js';
import {STAGE_MISSIONS,missionsFor,trialStatus} from './missions.js';
import {equipUnique,uniqueEquipment} from './equipment.js';
import {PARTY_KEY,normalizeParty,changeParty} from './party.js';
import {partyView} from './party-ui.js';
import {blessingSource,partyTitle} from './blessings.js';
import './style.css';
import './chapter.css';
import './story-cast.css';
import './progression.css';
import './talents.css';
import './party.css';
import './rewards.css';
import {talentView,materialsText} from './talent-ui.js';
import {talentNode,nodeEffectText} from './talents.js';
import {PROGRESSION_KEY,normalizeProgression,characterProgress,xpRequired,levelCap,LEVEL_RULES,grantLimitStone,unlockTalent} from './progression.js';
import {growthCards} from './progression-ui.js';
import { Adventure,HEROES,SKILLS,AREAS,STAGE_EXIT } from './model.js';
import { World } from './world.js';
import { Soundscape } from './audio.js';
import { icon } from './icons.js';
import {ACT_SCENES,ChapterStory} from './chapter.js';
const story=new ChapterStory();
const tutorialView=new BattleTutorialView();
const $=s=>document.querySelector(s);
const read=(key,fallback)=>{try{const raw=JSON.parse(localStorage.getItem(key));return raw&&typeof raw==='object'?raw:fallback;}catch{return fallback;}};
let storageAvailable=true;
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{storageAvailable=false;return false;}};
const savedSettings=read('lunaria-settings-v1',{});
const settings={sound:savedSettings.sound!==false,music:savedSettings.music!==false,quality:savedSettings.quality==='low'?'low':'high',motion:savedSettings.motion!==false};
const rawRecord=read('lunaria-record-v1',{});
const num=(v)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?Math.floor(v):0;
let record={chapterOneCleared:rawRecord.chapterOneCleared===true,runs:num(rawRecord.runs),wins:num(rawRecord.wins),best:num(rawRecord.best),crystals:num(rawRecord.crystals),bestCombo:num(rawRecord.bestCombo)};
let progression=normalizeProgression(read(PROGRESSION_KEY,{}),HEROES,record);
const persistProgression=()=>save(PROGRESSION_KEY,progression);
record.chapterOneCleared=progression.story.chapterOneCleared;
const unlockedRoster=()=>availableHeroes(progression,HEROES);
const heroLevel=id=>characterProgress(progression,id).level;
let selectedAct=nextAct(progression);
let equipmentHero=HEROES[0].id;
let treeHero=HEROES[0].id,treeSelection='origin';
const savedParty=read(PARTY_KEY,{});let selectedParty=normalizeParty(savedParty.members,unlockedRoster());
let selectedHero=Math.max(0,HEROES.findIndex(h=>h.id===(selectedParty.includes(savedParty.lead)?savedParty.lead:selectedParty[0]))),difficulty='normal',game=null,world=null,last=performance.now(),accumulator=0,activeDialog=null,returnFocus=null,resultSaved=false,toastTimer=0,bannerTimer=0,ultimateBannerTimer=0,renderFrames=0,storyEnabled=true,pendingStory=null;
let lastSkills='',lastHero=-1;
const audio=new Soundscape();audio.enabled=settings.sound;audio.music=settings.music;
const keys=new Set();const stick={id:null,x:0,y:0,cx:0,cy:0};const previousPad={};
const portrait=(hero,cls='')=>`<span class="portrait ${HEROES[hero].id} ${cls}" role="img" aria-label="${HEROES[hero].name}"></span>`;
const minutes=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
$('#app').innerHTML=`
  <section id="home" class="home" aria-label="タイトル画面">
    <div class="key-art"></div><div class="home-shade"></div><div class="dust dust-one"></div><div class="dust dust-two"></div>
    <header class="home-header"><a class="brand" href="#" aria-label="ルナネコハンティング タイトル">${icon('moon')}<span>LUNANEKO<small>HUNTING</small></span></a>
      <nav aria-label="メニュー"><span class="currency" title="限界突破石" aria-label="限界突破石">${icon('crystal')}<b id="currency">${progression.inventory.limitStone.toLocaleString()}</b></span><button class="icon-button" data-open="guide" aria-label="遊び方">${icon('book')}</button><button class="icon-button" data-open="records" aria-label="冒険の記録">${icon('trophy')}</button><button class="icon-button" data-open="settings" aria-label="設定">${icon('settings')}</button></nav>
    </header>
    <div class="home-content"><div class="eyebrow"><span></span> DUO ACTION ROGUELITE</div><h1 class="game-title"><span>ルナネコ</span><span>ハンティング</span></h1><div class="title-sub"><i></i>LUNANEKO HUNTING<i></i></div>
      <p class="tagline">月明かりが、<br>ふたりを導く。</p><p class="home-description">月の魔法と、星の銃。<br>重なる力で、まだ見ぬ空の向こうへ。</p>
      <div class="party-label"><span>YOUR PARTY</span><span>先頭の仲間を選択</span></div>
      <div class="party-picker" role="group" aria-label="先頭の仲間">
        ${HEROES.map((h,i)=>`<button class="hero-card ${i===0?'selected':''}" data-hero="${i}" aria-pressed="${i===0}">${portrait(i)}<span><small>${h.title}</small><strong>${h.name}</strong><em data-hero-level="${h.id}">Lv.${heroLevel(h.id)} · ${h.role}</em></span><i class="selected-mark">${icon('check')}</i></button>`).join('')}
      </div>
      <div class="party-summary"><span data-party-summary></span><button data-open="party">編成・祝福 ${icon('chevron')}</button></div>
      <button id="start" class="start-button"><span class="start-icon">${icon('sword')}</span><span><strong>冒険へ出発</strong><small>BEGIN YOUR ADVENTURE</small></span>${icon('arrow')}</button>
      <div class="start-meta"><button id="difficulty" aria-label="難易度を変更">${icon('shield')} <span>冒険モード</span> ${icon('chevron')}</button><span>1人プレイ <i>·</i> オート攻撃 <i>·</i> 記録を保存</span></div>
    </div>
    <div class="chapter-card"><span class="chapter-index">01</span><div><small>CHAPTER ONE</small><h2>迷子の月と、ふたりの約束</h2><p>親友を探して月の世界を巡る、全4幕。</p></div>${icon('compass')}</div>
    <footer class="home-footer"><span>NYANLUNA <i>×</i> TSUKINEKO</span><button id="chapter-menu-open">メニュー・育成</button><button data-open="guide">操作ガイド ${icon('arrow')}</button><span class="version">LUNANEKO HUNTING / 1.20</span></footer>
  </section>
  <section id="chapter-menu" class="chapter-menu hidden" tabindex="-1" aria-label="章メニュー"></section>
  <section id="hud" class="hud hidden" aria-label="戦闘情報">
    <div class="party-hud"><button id="switch" data-action="switch" class="active-portrait" aria-label="仲間を交代（Q）">${portrait(0)}<span class="swap-badge">${icon('swap')}</span></button><div class="health-panel"><div class="hero-heading"><strong id="hero-name">にゃんるな</strong><small class="lead-status">操作中</small><span id="level">Lv. 1</span></div><div class="health-track" role="progressbar" aria-label="HP" aria-valuemin="0" aria-valuemax="180" aria-valuenow="180"><i id="health-fill"></i><span id="hp">180 / 180</span></div><div class="xp-track" role="progressbar" aria-label="キャラクター経験値" aria-valuemin="0" aria-valuemax="8" aria-valuenow="0"><i id="xp-fill"></i></div><small id="hero-exp" class="hero-exp">EXP 0 / 36</small><span class="partner-label"><b id="partner-name">つきねこ</b> が援護中 <kbd>Q</kbd></span></div></div>
    <div class="stage-hud"><span id="area-sub">THE STARLIT MEADOW</span><strong id="area-name">星詠みの草原</strong><div class="wave-row"><span id="wave">WAVE 01 / 06</span><div id="wave-dots">${Array.from({length:6},()=>'<i></i>').join('')}</div></div></div>
    <div class="top-actions"><span class="kills">${icon('sword')}<b id="kill-count">0</b></span><time id="timer">00:00</time><button id="pause" class="icon-button" aria-label="一時停止（Esc）">${icon('pause')}</button></div>
    <div id="boss-hud" class="boss-hud hidden"><div><span>月蝕の守護者</span><small>THE ECLIPSE WARDEN</small></div><div class="boss-track"><i id="boss-fill"></i></div></div>
    <div id="objective" class="objective">${icon('compass')}<span>現れた魔物をすべて倒す</span><b id="remaining">0 / 10</b><small id="mission-tracker"></small></div>
    <div id="stage-crystal-hud" class="stage-crystal-hud">${icon('crystal')}<div><span>クリスタル <small>この幕の間</small></span><strong id="crystal-count">0 / 8</strong><div class="crystal-track" role="progressbar" aria-label="次の祝福までのクリスタル" aria-valuemin="0" aria-valuemax="8" aria-valuenow="0"><i id="crystal-fill"></i></div><small id="blessing-count">次の祝福まで</small></div></div>
    <div id="combo" class="combo"><strong>0</strong><span>CHAIN</span></div>
    <div id="acquired" class="acquired" aria-label="獲得した冒険スキル"></div>
    <div class="controls"><button id="switch-action" data-action="switch" class="action-button switch-action" aria-label="つきねこに操作を切り替え（Q）">${portrait(1)}<span class="swap-badge">${icon('swap')}</span><span class="switch-label">交代</span><small id="switch-target" class="switch-target">つきねこへ</small><kbd>Q</kbd><i class="cooldown-mask"></i></button><button id="dash" data-action="dash" class="action-button dash-button" aria-label="回避（Space）">${icon('wind')}<span>回避</span><kbd>SPACE</kbd><i class="cooldown-mask"></i></button><button id="ultimate" data-action="ultimate" class="action-button ultimate-button" aria-label="月華の聖域（E）"><div class="charge-ring"></div>${icon('moon')}<span id="ult-label">0%</span><kbd>E</kbd></button></div>
    <div id="exit-guide" class="exit-guide hidden" aria-live="polite"><span>月の門が開いた</span><strong id="exit-instruction">光る輪へ進もう</strong><small>矢印の先へ移動すると、次のステージへ</small></div>
    <div id="field-map" class="field-map" aria-label="現在のフィールドの地図"></div><div id="passage-guide" class="passage-guide hidden" role="status"></div>
    <div id="control-hint" class="control-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移動</span><i></i><span>近くの敵を自動で攻撃</span><i></i><span>ドラッグでも移動</span></div>
    <div class="touch-hint">ドラッグで移動</div>
  </section>
  <div id="joystick" class="joystick hidden"><i></i></div>
  <canvas id="numbers" class="numbers"></canvas><div id="damage-flash"></div>
  <div id="wave-banner" class="wave-banner"><span></span><strong></strong><small></small></div>
  <div id="ultimate-banner" class="ultimate-banner"><span>CHARACTER ULTIMATE</span><strong>月華の聖域</strong></div>
  <div id="toast" class="toast" role="status"></div>
  <dialog id="modal" class="modal"><div id="modal-content"></div></dialog>
`;
const dialogs={
  party:()=>partyView(selectedParty,selectedHero,HEROES,heroLevel,progression),
  guide:()=>`<div class="modal-heading"><span class="eyebrow">ADVENTURE GUIDE</span><h2>ふたりなら、もっと遠くへ。</h2><p>移動に集中。攻撃は、仲間にまかせよう。</p></div><div class="guide-grid"><article>${icon('compass')}<h3>撃って、かわして</h3><p><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> または画面をドラッグして移動。近くの敵へ自動攻撃。<kbd>Space</kbd> で無敵時間のある回避。</p></article><article>${icon('swap')}<h3>ふたりの力を重ねる</h3><p>最初はにゃんるなだけで出発。第4幕の最後で親友のつきねこと再会・共闘し、クリアすると正式加入します。加入後はタイトルやメニューの「編成・祝福」で1〜2体を選択。2体編成なら右下の「交代」で、表示された仲間の操作に切り替え。移動しながらでも押せます。<kbd>Q</kbd> または左上の顔でも交代。にゃんるなは遠距離魔法、つきねこは貫通する銃撃。第2章の最後ではオムソロを救出し、クリア後に近接の光剣使いとして加入します。登場人物が増えても出撃は最大2人です。控えの仲間も援護します。HPは共有で、交代時は残りHPの割合を引き継ぎます。</p></article><article>${icon('spark')}<h3>経験値とクリスタル</h3><p>敵を倒したキャラに経験値が入り、レベルと基礎能力が成長。援護の撃破も、その仲間に加算。落ちたクリスタルを集めると、出撃メンバーに応じた候補から3つの祝福を提示。共通・キャラ由来・2体の連携があり、効果は編成内で共有します。祝福は同じ幕の全6WAVEで維持されます。にゃんるなはスキルダメージ+50%・ゲージ獲得+25%。つきねこは基礎HP・攻撃力・防御力と通常射撃に優れます。</p></article><article>${icon('moon')}<h3>キャラ固有の必殺技</h3><p>攻撃した本人のゲージが増加し、100%で <kbd>E</kbd> または右下の必殺ボタン。にゃんるな「月華の聖域」は範囲攻撃・減速・HP回復。つきねこ「星銃・彗星連射」は貫通弾の8連射。オムソロ「翠光・守り手の円舞」は周囲への連続斬撃と回復・短い無敵。ゲージはキャラ別に保持し、援護でも蓄積。必殺技自体では増えません。</p></article></div><div class="guide-note">全2章・各章4幕・各幕6WAVE。地形はステージごとに変化。2フロアでは下階を制圧して青い階段から上階へ。分岐では左の緑の門が通常、右の赤い門が強ボスと追加素材。地図を見て歩いて選ぼう。2WAVEごとに月の門が開きます。光る輪へ移動して次へ進もう。各幕の最後の門でクリア。ミッション報酬を受け取り、メニューから次の幕へ進みます。橙の照準線・突進の帯、紫や桃色の魔法陣から離れよう。<br>ゲームパッド：左スティック移動 / A回避 / B交代 / Y必殺 / Start一時停止。<br>祝福・クリスタルは新しい出撃でリセット。キャラ別のレベル・経験値・限界突破石はこのブラウザに自動保存されます。成長ツリーは素材を使ってキャラごとに解放。星の芽は敵、月のしずくは月の門、守護者の核はボスから入手。防御力はキャラ固有値＋レベル成長＋ツリー効果で被ダメージを軽減します。初期上限Lv.20。各章の第4幕クリアでもらえる石1個で上限を10ずつ、最大Lv.50まで解放できます。上限到達後の経験値も蓄積されます。<br>ステージミッションで育成素材を入手。ユニーク装備はチャレンジモードの時間・被弾条件を達成して入手し、メニューの装備画面で付け替えます。高難度の章ミッションでは追加の限界突破石も入手できます。</div><button id="tutorial-replay" class="secondary">にゃんるなと操作を練習する</button><p class="tutorial-replay-note">にゃんるな1体で最初の戦闘から開始。育成・所持品は引き継ぎます。</p><button class="primary" data-close>準備はできた ${icon('arrow')}</button>`,
  settings:()=>`<div class="modal-heading"><span class="eyebrow">SETTINGS</span><h2>あなたの冒険に合わせて。</h2></div><div class="settings-list"><label><span>${icon('volume')}効果音・サウンド</span><input id="setting-sound" type="checkbox" ${settings.sound?'checked':''}></label><label><span>${icon('moon')}BGM</span><input id="setting-music" type="checkbox" ${settings.music?'checked':''}></label><label><span>${icon('spark')}画質</span><select id="setting-quality"><option value="high" ${settings.quality==='high'?'selected':''}>高画質</option><option value="low" ${settings.quality==='low'?'selected':''}>軽量</option></select></label><label><span>${icon('wind')}画面の揺れ・演出</span><input id="setting-motion" type="checkbox" ${settings.motion?'checked':''}></label></div><p class="subtle">動きが重い場合は「軽量」を選択してください。設定は自動保存されます。</p><button class="primary" data-close>閉じる ${icon('check')}</button>`,
  records:()=>`<div class="modal-heading"><span class="eyebrow">YOUR ADVENTURE</span><h2>星が覚えている、ふたりの軌跡。</h2></div><div class="record-feature">${icon('trophy')}<small>BEST SCORE</small><strong>${record.best.toLocaleString()}</strong></div><div class="record-grid"><div><strong>${record.runs}</strong><span>冒険した回数</span></div><div><strong>${record.wins}</strong><span>守護者の討伐</span></div><div><strong>${record.bestCombo}</strong><span>最大チェイン</span></div><div><strong>${progression.inventory.limitStone}</strong><span>所持する限界突破石</span></div></div><p class="subtle">${record.runs?'次の冒険が、新しい記録になる。':'物語はこれから。最初の冒険へ出発しよう。'}</p><button class="primary" data-close>閉じる ${icon('arrow')}</button>`,
  difficulty:()=>`<div class="modal-heading"><span class="eyebrow">CHOOSE YOUR JOURNEY</span><h2>出撃モードを選ぶ</h2><p>ステージ選択画面でも、いつでも切り替えられます。</p></div>${difficultyCards(difficulty)}`,
};
function updateDifficultyLabels(){
  const label=difficultyName(difficulty);
  $('#difficulty span').textContent=label;
  $('#difficulty').dataset.mode=difficulty;
  $('#difficulty').setAttribute('aria-label',`難易度を変更：${label}`);
  document.querySelectorAll('[data-difficulty]').forEach(button=>{
    const selected=button.dataset.difficulty===difficulty;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
    button.querySelector('[data-mode-selection]').textContent=selected?'選択中':'選ぶ';
  });
  if($('#chapter-start')){
    $('#chapter-start').dataset.mode=difficulty;
    $('#chapter-start small').textContent=`${label}で出発`;
  }
}
function chooseDifficulty(mode){
  if(game||!['normal','hard'].includes(mode))return;
  difficulty=mode;updateDifficultyLabels();
  announce(`${difficultyName(mode)}を選択しました。選んだ幕の全6WAVEに適用されます。`);
}
function persistParty(){save(PARTY_KEY,{members:selectedParty,lead:HEROES[selectedHero].id});}
function updatePartyLabels(){
  const chapter=chapterForAct(nextAct(progression));$('.chapter-card .chapter-index').textContent=String(chapter.id+1).padStart(2,'0');$('.chapter-card small').textContent=`CHAPTER 0${chapter.id+1}`;$('.chapter-card h2').textContent=chapter.title;$('.chapter-card p').textContent=chapter.id===1?'こむすびの願いをつなぐ、全4幕の救出劇。':'親友を探して月の世界を巡る、全4幕。';
  document.querySelectorAll('.hero-card,.menu-hero').forEach(el=>{const index=Number(el.dataset.hero),included=selectedParty.includes(HEROES[index].id),selected=included&&index===selectedHero;el.disabled=!included;el.classList.toggle('hidden',!included&&!(index===1&&!isHeroUnlocked(progression,'tsukineko')));el.classList.toggle('selected',selected);el.classList.toggle('not-deployed',!included);el.setAttribute('aria-pressed',String(selected));el.setAttribute('aria-label',`${HEROES[index].name}：${!isHeroUnlocked(progression,HEROES[index].id)?recruitmentNote(HEROES[index].id):included?(selected?'先頭で出撃':'援護で出撃。先頭に切り替え'):'待機中。編成画面で追加'}`);});
  updateGrowthLabels();
  document.querySelectorAll('[data-party-summary]').forEach(el=>el.textContent=`出撃 ${selectedParty.length}/2体 · ${selectedParty.length===2?'ふたりの連携':'単独出撃'}`);
  document.querySelectorAll('[data-party-count]').forEach(el=>el.textContent=`${selectedParty.length}/2`);
}
function renderPartyDialog(){if(activeDialog!=='party')return;$('#modal-content').innerHTML=dialogs.party()+`<button class="dialog-close icon-button" data-close aria-label="閉じる">${icon('close')}</button>`;if(!storageAvailable)$('.party-save-note').textContent='この環境では編成を保存できません。この画面では編成を維持します。';}
function openDialog(type){
  if(activeDialog||(type==='party'&&game))return;audio.init();audio.play('click');returnFocus=document.activeElement;activeDialog=type;$('#modal-content').innerHTML=dialogs[type]()+`<button class="dialog-close icon-button" data-close aria-label="閉じる">${icon('close')}</button>`;$('#modal').showModal();bindSettings();
}
function closeDialog(){if(['upgrade','result','story'].includes(activeDialog))return;if(activeDialog==='pause')game?.resume();$('#modal').close();activeDialog=null;tutorialView.render(game);resetInput();returnFocus?.focus?.();}
function bindSettings(){
  ['sound','music','quality','motion'].forEach(key=>{const el=$(`#setting-${key}`);if(!el)return;el.addEventListener('change',()=>{settings[key]=key==='quality'?el.value:el.checked;audio.setEnabled(settings.sound);audio.music=settings.music;world.settings.motion=settings.motion;world.setQuality(settings.quality);document.body.classList.toggle('reduce-motion',!settings.motion);save('lunaria-settings-v1',settings);});});
}
function pause(){if(!game||!game.pause())return;resetInput();activeDialog='pause';tutorialView.render(game,true);audio.play('click');$('#modal-content').innerHTML=`<div class="pause-symbol">${icon('moon')}</div><div class="modal-heading"><span class="eyebrow">TAKE A BREATH</span><h2>月明かりの下で、ひと休み。</h2><p>WAVE ${game.wave} / 6 <i>·</i> ${minutes(game.time)}</p></div><div class="run-materials"><small>この冒険で獲得した成長素材</small><p>${materialsText(game.earnedMaterials)}</p></div><button id="resume" class="primary">冒険をつづける ${icon('play')}</button><button id="quit" class="secondary">冒険を終了してメニューへ</button><p class="subtle">キャラの成長・獲得素材は保存済み。クリスタルと祝福は終了時にリセットされます。</p><div class="enemy-guide"><h3>この幕のボス · ${game.actConfig.boss}</h3><p>${BOSSES[game.actConfig.bossId].hint}</p><h3>新しい敵の見分け方</h3>${(game.act>=4?enemyRosterForAct(game.act):['archer','mage','charger']).map(id=>`<p><b>${ENEMY_TYPES[id].name}</b> ${ENEMY_TYPES[id].hint}</p>`).join('')}</div>${currentMissions(progression,game)}`;$('#modal').showModal();}
function upgrade(){
  activeDialog='upgrade';resetInput();$('#modal-content').innerHTML=`<div class="modal-heading upgrade-heading"><span class="eyebrow">CRYSTAL BLESSING · STAGE 0${game.area+1}</span><h2>クリスタルの祝福を選ぶ</h2><p>この幕の最後まで、出撃メンバーを強くする力をひとつ。</p><div class="blessing-party">${icon(game.hasPartner?'link':'star')}<span>${partyTitle(game.party,HEROES)}</span><b>${game.party.length}体編成</b></div><div class="blessing-affinity">${game.party.includes('nyanluna')?'にゃんるなの必殺技・星屑・周回星は威力1.5倍':game.party.includes('omsolo')?'オムソロは扇状の近接斬撃と守りが得意':'つきねこは高い基礎能力と貫通射撃が得意'}</div></div><div class="skill-options">${game.offers.map(s=>`<button class="skill-card" data-skill="${s.id}"><span class="skill-type">${s.type}<span>${game.rank(s.id)?`Lv. ${game.rank(s.id)+1}`:'NEW'}</span></span><div class="skill-emblem">${icon(s.icon)}</div><h3>${s.name}</h3><small class="blessing-source" data-source="${s.requires?.length===2?'pair':s.requires?.[0]??'common'}">${blessingSource(s,HEROES)}</small><p>${s.text}</p><span class="skill-select">この力を選ぶ ${icon('arrow')}</span></button>`).join('')}</div><div class="upgrade-footer">${icon('link')} 祝福はこの幕の全6WAVEで継続。新しい出撃でリセット。</div>`;$('#modal').classList.add('wide');if(!$('#modal').open)$('#modal').showModal();
}
function showResult(victory){
  if(resultSaved)return;resultSaved=true;resetInput();
  const mult=difficulty==='hard'?1.5:1,score=Math.round((game.kills*100+game.maxCombo*25+game.blessingsTaken*50+(victory?5000:0))*mult),best=score>record.best;
  const recruited=game.recruitedHeroId,earnedXp={...game.earnedXp},earnedMaterials={...game.earnedMaterials},earnedMissions=[...game.earnedMissions];
  const act=game.act,stones=victory&&ACTS[act].number===4?1:0;record.runs++;if(victory){record.wins++;record.chapterOneCleared=progression.story.chapterOneCleared;if(stones)grantLimitStone(progression);}
  record.best=Math.max(record.best,score);record.bestCombo=Math.max(record.bestCombo,game.maxCombo);save('lunaria-record-v1',record);persistProgression();updateGrowthLabels();
  if(victory&&storyEnabled){playStory('ending',()=>goMenu({score,earnedXp,earnedMaterials,earnedMissions,best,stones,recruited,act}));return;}
  activeDialog='result';$('#modal').classList.remove('wide');$('#modal-content').innerHTML=`<div class="result ${victory?'victory':'defeat'}"><div class="result-symbol">${icon(victory?'trophy':'moon')}</div><span class="eyebrow">${victory?'THE MOON GATE IS OPEN':'EVERY JOURNEY MAKES US STRONGER'}</span><h2>${victory?'VICTORY':'JOURNEY ENDS'}</h2>${recruited?recruitmentBanner(recruited):''}<p class="result-copy">${victory?'月の門は、ふたりの未来へ。':game.rescue?.remaining===0?'結界が尽き、救出に間に合いませんでした。育成と装備を整えて、もう一度。':'この経験も、次の一歩になる。'}</p><div class="result-portraits">${game.partyHeroes.map(i=>portrait(i)).join(icon('link'))}</div><div class="result-score"><small>${best?'NEW BEST SCORE':'TOTAL SCORE'}</small><strong>${score.toLocaleString()}</strong></div><div class="result-stats"><div><b>${game.kills}</b><span>撃破数</span></div><div><b>${game.maxCombo}</b><span>最大CHAIN</span></div><div><b>${minutes(game.time)}</b><span>冒険時間</span></div></div><div class="reward">${stones?`${icon('crystal')} 限界突破石 <strong>+${stones}</strong>`:'キャラの成長は次の冒険へ'}<span>${earnedXpText(earnedXp)}</span><span class="result-materials">${materialsText(earnedMaterials)}</span><span>${storageAvailable?'レベル・経験値を保存しました':'この環境では記録を保存できません'}</span></div>${missionRunSummary(earnedMissions)}<button id="retry" class="primary">もう一度、冒険へ ${icon('reset')}</button><button id="home-button" class="secondary">メニューへ戻る</button></div>`;if(!$('#modal').open)$('#modal').showModal();announce(victory?`${actLabel(act)}をクリアしました。`:'冒険が終了しました。');
}
function start({withStory=true,withTutorial=withStory&&selectedAct===0&&needsFirstBattleTutorial(progression),skipOpening=false}={}){
  if(!world?.assetsReady)return;story.cancel();pendingStory=null;storyEnabled=withStory;$('#chapter-menu').classList.add('hidden');audio.init();audio.play('wave');$('#modal').close();$('#modal').classList.remove('wide');activeDialog=null;persistProgression();game=new Adventure({hero:selectedHero,difficulty,progression,party:selectedParty,tutorial:withTutorial,act:selectedAct});selectedAct=game.act;lastHero=-1;lastSkills='';progression=game.progression;resultSaved=false;world.reset();$('#home').classList.add('hidden');$('#hud').classList.remove('hidden');document.body.classList.add('playing');$('#control-hint').classList.remove('hidden');accumulator=0;resetInput();$('#start').blur();handleEvents(game.drainEvents());updateHud();if(withStory&&!skipOpening)playStory('opening');
}
function goHome(){persistProgression();updateGrowthLabels();story.cancel();pendingStory=null;$('#chapter-menu').classList.add('hidden');$('#exit-guide').classList.add('hidden');game=null;tutorialView.render(null);updatePartyLabels();numberContext.clearRect(0,0,numberCanvas.width,numberCanvas.height);$('#modal').close();$('#modal').classList.remove('wide');activeDialog=null;$('#hud').classList.add('hidden');$('#home').classList.remove('hidden');$('#boss-hud').classList.add('hidden');$('#wave-banner').classList.remove('visible');$('#ultimate-banner').classList.remove('visible');$('#toast').classList.remove('visible');document.body.classList.remove('playing');world.reset();resetInput();clearTimeout(bannerTimer);clearTimeout(ultimateBannerTimer);clearTimeout(toastTimer);$('#start').focus();}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2300);}
function announce(message){$('#announcer').textContent=message;}
function resetInput(){keys.clear();stick.id=null;stick.x=stick.y=0;$('#joystick').classList.add('hidden');}
function playStory(id,done){
  if(!storyEnabled&&id!=='replay'){done?.();return;}
  const run=game,wasPlaying=run?.phase==='playing';if(wasPlaying)run.pause();resetInput();activeDialog='story';tutorialView.render(game,true);
  clearTimeout(bannerTimer);$('#wave-banner').classList.remove('visible');$('#modal').close();
  const scenes=ACT_SCENES[run?.act??selectedAct];
  const scene=id==='replay'?{...scenes.opening,title:ACTS[selectedAct].title,next:'メニューへ',lines:Object.values(scenes).flatMap(s=>s.lines.map(line=>({...line,area:s.area,act:s.act})))}:scenes[id];
  story.show(scene,()=>{activeDialog=null;resetInput();if(run&&game!==run)return;if(wasPlaying)run.resume();done?.();updateHud();if(game?.phase==='playing')canvas.focus();});
}
function earnedXpText(earned){return HEROES.map(h=>`${h.name} EXP +${earned[h.id]??0}`).join(' ／ ');}
function updateGrowthLabels(){
  $('#currency').textContent=progression.inventory.limitStone.toLocaleString();
  document.querySelectorAll('[data-hero-level]').forEach(el=>{const id=el.dataset.heroLevel;el.textContent=!isHeroUnlocked(progression,id)?recruitmentNote(id):`Lv.${heroLevel(id)}${el.tagName==='EM'?` · ${HEROES.find(h=>h.id===id).role}`:''}`;});
  if($('#encounter-preparation'))$('#encounter-preparation').innerHTML=encounterPreparation(ACTS[selectedAct],selectedParty,progression,HEROES);
  if($('#limit-stones'))$('#limit-stones').textContent=progression.inventory.limitStone.toLocaleString();
}
function missionRunSummary(ids=[]){return ids.length?`<div class="mission-run-rewards">ミッション ${ids.length}件達成<br>${ids.map(id=>STAGE_MISSIONS.find(m=>m.id===id)).filter(Boolean).map(m=>`${m.name}：${missionRewardText(m)}`).join('<br>')}</div>`:'';}
function renderRewards(){if($('#missions-panel'))$('#missions-panel').innerHTML=missionsView(progression);if($('#equipment-content'))$('#equipment-content').innerHTML=equipmentView(progression,equipmentHero);}
function switchMenuTab(tab){
  if(!['adventure','growth','talent','missions','equipment'].includes(tab))return;if(tab==='talent')renderTalent();if(tab==='missions'||tab==='equipment')renderRewards();
  for(const key of ['adventure','growth','talent','missions','equipment']){const active=key===tab;$(`#${key}-panel`).classList.toggle('hidden',!active);$(`[data-menu-tab="${key}"]`).setAttribute('aria-pressed',String(active));}
}
function renderTalent(){if($('#tree-content'))$('#tree-content').innerHTML=talentView(progression,treeHero,treeSelection);}
function chooseTreeHero(id){if(!isHeroUnlocked(progression,id))return;treeHero=id;treeSelection='origin';renderTalent();$('#tree-feedback').textContent='';$(`[data-tree-hero="${id}"]`).focus({preventScroll:true});}
function chooseTreeNode(id){
  const node=talentNode(id,treeHero);if(!node)return;treeSelection=id;renderTalent();$(`[data-tree-node="${id}"]`).focus({preventScroll:true});announce(`${node.name}、${nodeEffectText(node)}。`);
  if(innerWidth<=760)$('#talent-detail').scrollIntoView({block:'nearest',behavior:settings.motion?'smooth':'instant'});
}
function applyTalent(heroId,nodeId){
  if(game||heroId!==treeHero||!isHeroUnlocked(progression,heroId)||!unlockTalent(progression,heroId,nodeId))return;
  persistProgression();updateGrowthLabels();renderTalent();$('#growth-cards').innerHTML=growthCards(progression);audio.play('upgrade');
  const node=talentNode(nodeId,heroId),hero=HEROES.find(h=>h.id===heroId);
  $('#tree-feedback').textContent=`${hero.name}の「${node.name}」を解放。${nodeEffectText(node)}。${storageAvailable?'保存しました。':'この環境では保存できません。'}`;
  $(`[data-tree-node="${nodeId}"]`).focus({preventScroll:true});announce(`${hero.name}の${node.name}を解放しました。`);
}
function recruitmentBanner(id){const hero=HEROES.find(h=>h.id===id);return `<section class="recruitment-banner" aria-label="仲間加入"><span class="portrait ${id}" role="img" aria-label="${hero.name}"></span><div><small>${id==='omsolo'?'RESCUE COMPLETE':'REUNITED'}</small><strong>${id==='omsolo'?'オムソロが仲間になった！':'つきねこと、また一緒に！'}</strong><p>${id==='omsolo'?'緑の光刃で戦う近接の剣士。編成・祝福から仲間を入れ替えて、最大2人で出撃できます。':'大の仲良しの二人が再会。編成・育成・装備が解放されました。'}</p></div></section>`;}
function goMenu(result){
  if(result)selectedAct=Math.min(ACTS.length-1,result.act+1);goHome();equipmentHero=HEROES[selectedHero].id;treeHero=HEROES[selectedHero].id;treeSelection='origin';$('#home').classList.add('hidden');const chapter=chapterForAct(selectedAct),cleared=progression.story.actClears.slice(chapter.start,chapter.end+1).every(Boolean),act=ACTS[selectedAct],actCleared=progression.story.actClears[selectedAct];
  $('#chapter-menu').innerHTML=`<div class="menu-backdrop"></div><div class="chapter-shell">
    <header class="chapter-header"><button id="menu-title" class="secondary">← タイトル</button><span>LUNANEKO HUNTING</span><button class="icon-button" data-open="settings" aria-label="設定">${icon('settings')}</button></header>
    <nav class="menu-tabs" aria-label="メニュー切り替え"><button data-menu-tab="adventure" aria-pressed="true">${icon('compass')} 冒険</button><button data-menu-tab="growth" aria-pressed="false">${icon('spark')} キャラ育成</button><button data-menu-tab="talent" aria-pressed="false">${icon('link')} 成長ツリー</button><button data-menu-tab="missions" aria-pressed="false">${icon('trophy')} ミッション</button><button data-menu-tab="equipment" aria-pressed="false">${icon('gun')} 装備</button></nav>
    <div id="adventure-panel"><nav class="chapter-selector" aria-label="章を選ぶ">${CHAPTERS.map(c=>`<button data-chapter="${c.id}" aria-pressed="${chapter.id===c.id}" ${isActUnlocked(progression,c.start)?'':'disabled'}><small>CHAPTER 0${c.id+1}</small><strong>第${c.id+1}章</strong><span>${isActUnlocked(progression,c.start)?c.title:'第1章クリアで解放'}</span></button>`).join('')}</nav><div class="chapter-intro"><span class="eyebrow">CHAPTER 0${chapter.id+1} ${cleared?'· COMPLETE':''}</span><h2>${chapter.title}</h2><p>${chapter.summary}</p>${cleared?`<span class="chapter-complete">✓ 第${chapter.id+1}章クリア</span>`:''}</div>
    ${result?.recruited?recruitmentBanner(result.recruited):''}${result?`<section class="chapter-reward" aria-label="クリア報酬"><strong>${actLabel(result.act)}「${ACTS[result.act].title}」クリア</strong><span>${result.best?'NEW BEST':'SCORE'} <b>${result.score.toLocaleString()}</b></span>${result.stones?`<span>限界突破石 <b>+${result.stones}</b></span>`:''}<small>${earnedXpText(result.earnedXp)}</small><small class="result-materials">${materialsText(result.earnedMaterials)}</small><small>${storageAvailable?'レベル・経験値・クリア報酬を保存しました':'この環境では記録を保存できません'}</small></section>${missionRunSummary(result.earnedMissions)}`:''}
    <div class="act-selector" role="group" aria-label="幕を選ぶ">${ACTS.filter(a=>a.chapter===chapter.id).map(a=>`<button data-act="${a.id}" aria-pressed="${selectedAct===a.id}" ${isActUnlocked(progression,a.id)?'':'disabled'}><small>ACT 0${a.number} · ${progression.story.actClears[a.id]?'CLEAR':isActUnlocked(progression,a.id)?'OPEN':'LOCKED'}</small><strong>第${a.number}幕</strong><span>${a.title}</span></button>`).join('')}</div><div class="act-intro"><h3>第${act.number}幕 · ${act.title}</h3><p>${act.summary}</p><small>全6WAVEクリア後、達成したミッション報酬をまとめて受け取れます。</small></div><div id="encounter-preparation"></div>${stageDifficultyView(difficulty,STAGE_MISSIONS.find(m=>m.act===selectedAct&&m.trial).id)}<div class="chapter-route">${act.stages.map((s,i)=>`<article class="chapter-stage" style="--stage-image:url('${s.image}')"><span class="stage-number">0${i+1}</span><div><small>${s.waves}${actCleared?' · CLEAR':''}</small><h3>${s.name}</h3><p>${s.note}</p><small class="terrain-badge">${fieldSummary(selectedAct,i)}</small></div><div class="terrain-preview">${mapSvg(fieldFor(selectedAct,i).rooms[0])}</div></article>`).join('')}</div><div class="chapter-bottom"><div class="menu-party"><span>操作する仲間</span><button class="party-edit" data-open="party">編成・祝福 <b data-party-count>${selectedParty.length}/2</b></button>${HEROES.map((h,i)=>`<button data-hero="${i}" aria-pressed="${selectedHero===i}" class="menu-hero ${selectedHero===i?'selected':''}">${portrait(i)}<strong>${h.name}<small data-hero-level="${h.id}">Lv.${heroLevel(h.id)}</small></strong></button>`).join('')}</div><div class="chapter-start-panel"><button id="chapter-start" class="primary" data-mode="${difficulty}"><span><strong>第${act.number}幕${actCleared?'をもう一度遊ぶ':'へ出発する'}</strong><small>${difficultyName(difficulty)}で出発</small></span>${icon('arrow')}</button><button id="chapter-story" class="secondary" ${actCleared?'':'disabled'}>この幕の物語を読み返す${actCleared?'':'（クリア後）'}</button></div></div><p class="chapter-menu-note">${chapter.id===1?'第4幕の巨神を倒してオムソロを救出。最後の月の門を通ると加入し、3人から最大2人を編成できます。':cleared?'第2章が解放されました。こむすびの願いを聞き、新しい救出の旅へ。':'最初はにゃんるな一人の旅。第4幕の最後のボス戦で親友のつきねこと再会し、クリア後に編成が解放。'}<br>全4幕・各幕6WAVE。敵を倒し、光る月の門へ進もう。</p></div>
    <section id="growth-panel" class="growth-panel hidden" aria-label="キャラ育成"><div class="growth-intro"><div><span class="eyebrow">CHARACTER GROWTH</span><h2>冒険は、仲間の力に。</h2><p>敵を倒したキャラに経験値。レベルと基礎能力は、次の冒険へ。</p></div><div class="stone-wallet">${icon('crystal')}<span>限界突破石<b id="limit-stones">${progression.inventory.limitStone}</b></span></div></div><p class="stone-source">各章の第4幕をクリアするたび、限界突破石を1個獲得。第1章の第2〜4幕と第2章の高難度ミッションでも入手。<br>上限Lv.20 → 30 → 40 → 50。限界突破は成長ツリーの「レベルの道」から行います。蓄積経験値も解放時に反映します。</p><p id="growth-feedback" class="growth-feedback" role="status"></p><div id="growth-cards" class="growth-cards">${growthCards(progression)}</div><div class="growth-note"><strong>クリスタルの祝福は、同じ幕の間ずっと有効。</strong><p>クリスタルを集めて選ぶ3択の祝福は、新しい出撃でリセット。キャラのレベル・経験値は残ります。${storageAvailable?'このブラウザに自動保存されます。':'この環境では記録を保存できません。'}</p></div></section>
    <section id="talent-panel" class="talent-panel hidden" aria-label="成長ツリー"><div class="talent-intro"><span class="eyebrow">CONSTELLATION GROWTH</span><h2>星をつなぎ、力を育てる。</h2><p>能力の星と、レベルの道。素材と限界突破石で、仲間の成長をつなごう。</p></div><p id="tree-feedback" class="growth-feedback" role="status"></p><div id="tree-content">${talentView(progression,treeHero,treeSelection)}</div></section>
    <section id="missions-panel" class="hidden" aria-label="ステージミッション">${missionsView(progression)}</section><section id="equipment-panel" class="hidden" aria-label="装備"><p id="equipment-feedback" class="equipment-feedback" role="status"></p><div id="equipment-content">${equipmentView(progression,equipmentHero)}</div></section>
    </div>`;
  updatePartyLabels();$('#chapter-menu').classList.remove('hidden');$('#chapter-menu').focus({preventScroll:true});$('#chapter-menu').scrollTop=0;announce(`第${chapter.id+1}章${cleared?'クリア':''}。章メニューです。`);
}
function axes(){
  let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
  let y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+stick.y;
  const pad=navigator.getGamepads?.()[0];if(pad){x+=Math.abs(pad.axes[0])>.17?pad.axes[0]:0;y+=Math.abs(pad.axes[1])>.17?pad.axes[1]:0;}
  const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}return {x:x*.789+y*.614,z:-x*.614+y*.789};
}
function action(kind){audio.init();if(!game||game.phase!=='playing')return;const a=axes();if(kind==='dash')game.dash(a.x,a.z);if(kind==='switch'&&game.switchHero())updateHud();if(kind==='ultimate'&&!game.ultimate())toast(game.ultimateActive(game.player.hero)?'この仲間の必殺技は発動中':`${HEROES[game.player.hero].name}の必殺ゲージをためよう · ${Math.floor(game.player.charge)}%`);}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.id==='tutorial-next'&&game?.advanceTutorial()){resetInput();handleEvents(game.drainEvents());updateHud();canvas.focus();}
  if(target.id==='tutorial-skip'&&game?.skipTutorial()){handleEvents(game.drainEvents());updateHud();canvas.focus();}
  if(target.id==='tutorial-replay'&&!game){closeDialog();start({withTutorial:true,skipOpening:true});}
  if(target.dataset.open)openDialog(target.dataset.open);
  if(target.hasAttribute('data-prepare-levels')&&!game){treeHero=HEROES[selectedHero].id;treeSelection='limit30';switchMenuTab('talent');$('#talent-panel').scrollIntoView({block:'start',behavior:'instant'});}
  if(target.hasAttribute('data-close'))closeDialog();
  if(target.matches('.hero-card,.menu-hero')&&!game){const index=Number(target.dataset.hero);if(selectedParty.includes(HEROES[index]?.id)){selectedHero=index;persistParty();updatePartyLabels();audio.init();audio.play('click');}}
  if(target.dataset.partyToggle&&!game){selectedParty=changeParty(selectedParty,target.dataset.partyToggle,unlockedRoster());if(!selectedParty.includes(HEROES[selectedHero].id))selectedHero=HEROES.findIndex(h=>h.id===selectedParty[0]);persistParty();updatePartyLabels();renderPartyDialog();$(`[data-party-toggle="${target.dataset.partyToggle}"]`)?.focus({preventScroll:true});}
  if(target.dataset.partyLead&&!game){const index=Number(target.dataset.partyLead);if(selectedParty.includes(HEROES[index]?.id)){selectedHero=index;persistParty();updatePartyLabels();renderPartyDialog();}}
  if(target.dataset.equipmentHero&&!game&&isHeroUnlocked(progression,target.dataset.equipmentHero)){equipmentHero=target.dataset.equipmentHero;renderRewards();}
  if(target.dataset.openEquipment&&!game&&isHeroUnlocked(progression,target.dataset.openEquipment)){equipmentHero=target.dataset.openEquipment;switchMenuTab('equipment');$('#equipment-panel').scrollIntoView({block:'start'});}
  if(target.dataset.equipItem&&!game){const heroId=target.dataset.equipHero,id=target.dataset.equipItem,remove=progression.equipment.loadout[heroId]===id;if(isHeroUnlocked(progression,heroId)&&equipUnique(progression.equipment,heroId,remove?'':id,{transfer:true})){persistProgression();renderRewards();$('#growth-cards').innerHTML=growthCards(progression);$('#equipment-feedback').textContent=`${uniqueEquipment(id).name}を${remove?'外しました':'装備しました'}。${storageAvailable?'保存しました。':'この環境では保存できません。'}`;audio.play('upgrade');$(`[data-equip-item="${id}"]`)?.focus({preventScroll:true});}}
  if(target.dataset.showMission&&!game){switchMenuTab('missions');$(`[data-mission="${target.dataset.showMission}"]`)?.scrollIntoView({block:'center',behavior:settings.motion?'smooth':'instant'});}
  if(target.hasAttribute('data-prepare-challenge')&&!game){chooseDifficulty('hard');switchMenuTab('adventure');$('#stage-difficulty').scrollIntoView({block:'start'});$('#stage-difficulty [data-difficulty=hard]').focus({preventScroll:true});}
  if(target.dataset.menuTab)switchMenuTab(target.dataset.menuTab);

  if(target.dataset.openTree&&!game&&isHeroUnlocked(progression,target.dataset.openTree)){chooseTreeHero(target.dataset.openTree);if(target.dataset.treeTarget)treeSelection=target.dataset.treeTarget;switchMenuTab('talent');if(target.dataset.treeTarget)chooseTreeNode(treeSelection);else $('#talent-panel').scrollIntoView({block:'start'});}
  if(target.dataset.treeHero)chooseTreeHero(target.dataset.treeHero);
  if(target.dataset.treeNode)chooseTreeNode(target.dataset.treeNode);
  if(target.dataset.unlockNode)applyTalent(target.dataset.unlockHero,target.dataset.unlockNode);
  if(target.dataset.difficulty&&!game){chooseDifficulty(target.dataset.difficulty);if(activeDialog==='difficulty')closeDialog();}
  if(target.dataset.skill){if(game?.chooseSkill(target.dataset.skill)){audio.play('upgrade');$('#modal').close();$('#modal').classList.remove('wide');activeDialog=null;handleEvents(game.drainEvents());updateHud();}}
  if(['start','retry','chapter-start'].includes(target.id))start();
  if(target.dataset.chapter!==undefined&&!game){const c=CHAPTERS[Number(target.dataset.chapter)];if(c&&isActUnlocked(progression,c.start)){selectedAct=ACTS.find(a=>a.chapter===c.id&&!progression.story.actClears[a.id])?.id??c.start;goMenu();}}
  if(target.dataset.act!==undefined&&!game&&isActUnlocked(progression,Number(target.dataset.act))){selectedAct=Number(target.dataset.act);goMenu();$(`[data-act="${selectedAct}"]`)?.focus({preventScroll:true});}
  if(target.id==='chapter-menu-open')goMenu();if(target.id==='menu-title')goHome();
  if(target.id==='chapter-story'){playStory('replay',()=>goMenu());}
  if(target.id==='pause')pause();if(target.id==='resume')closeDialog();
  if(target.id==='quit'||target.id==='home-button')goMenu();
  if(target.dataset.action&&event.detail===0)action(target.dataset.action);
  if(target.id==='difficulty')openDialog('difficulty');
});
document.addEventListener('pointerdown',event=>{const button=event.target.closest('button[data-action]');if(button&&event.button===0&&game?.phase==='playing'){event.preventDefault();action(button.dataset.action);}});
$('.brand').addEventListener('click',e=>e.preventDefault());
$('#modal').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'){e.preventDefault();if(activeDialog)closeDialog();else pause();return;}
  if(!game||game.phase!=='playing')return;
  if(e.code==='Enter'&&game.tutorial?.active&&game.tutorial.step.button&&document.activeElement?.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat&&game.advanceTutorial()){handleEvents(game.drainEvents());updateHud();}return;}
  if(['Space','Enter'].includes(e.code)&&document.activeElement?.tagName==='BUTTON')return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);
  if(!e.repeat){if(e.code==='Space')action('dash');if(e.code==='KeyQ')action('switch');if(e.code==='KeyE')action('ultimate');}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{resetInput();if(game?.phase==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){persistProgression();resetInput();if(game?.phase==='playing')pause();}});
window.addEventListener('pagehide',persistProgression);
const canvas=$('#scene');
canvas.addEventListener('pointerdown',e=>{
  if(!game||game.phase!=='playing'||game.tutorial?.active&&!game.tutorial.practicing||stick.id!==null||e.button!==0)return;e.preventDefault();audio.init();stick.id=e.pointerId;stick.cx=e.clientX;stick.cy=e.clientY;stick.x=stick.y=0;canvas.setPointerCapture(e.pointerId);$('#joystick').classList.remove('hidden');$('#joystick').style.left=`${e.clientX}px`;$('#joystick').style.top=`${e.clientY}px`;$('#joystick i').style.transform='translate(-50%, -50%)';
});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==stick.id)return;const dx=e.clientX-stick.cx,dy=e.clientY-stick.cy,d=Math.hypot(dx,dy),m=Math.min(1,52/(d||1));stick.x=dx*m/52;stick.y=dy*m/52;$('#joystick i').style.transform=`translate(calc(-50% + ${dx*m}px),calc(-50% + ${dy*m}px))`;});
const endPointer=e=>{if(e.pointerId===stick.id){stick.id=null;stick.x=stick.y=0;$('#joystick').classList.add('hidden');}};
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);canvas.addEventListener('contextmenu',e=>e.preventDefault());
function handleEvents(events){
  world.handle(events,game);
  let growthChanged=false;
  for(const e of events){
    if(e.type==='tutorialStep'){resetInput();canvas.focus();announce(`にゃんるな：${game.tutorial.step.text}`);}
    if(e.type==='tutorialComplete'){growthChanged=true;resetInput();world.reset();canvas.focus();announce('練習終了。星詠みの草原で冒険をはじめよう。');}
    if(e.type==='guestJoin'){lastHero=-1;toast('つきねこと共闘！ 交代と連携の祝福が解放');announce('つきねこがボス戦に助っ人参戦。操作を交代できます。正式加入は第1章クリア後です。');}
    if(e.type==='recruited'){growthChanged=true;selectedParty=normalizeParty([...selectedParty,e.heroId],unlockedRoster());persistParty();}
    if(e.type==='missionProgress')growthChanged=true;
    if(e.type==='missionComplete'){growthChanged=true;const mission=STAGE_MISSIONS.find(m=>m.id===e.id);toast(`ミッション達成：${mission.name} · ${missionRewardText(mission)}`);announce(`${mission.name}を達成。${missionRewardText(mission)}を獲得。`);}
    if(e.type==='materials'){growthChanged=true;if(e.amounts.wardenCore)toast(`守護者の核 +${e.amounts.wardenCore} · 成長ツリーの素材`);}
    if(e.type==='characterXp'){growthChanged=true;if(e.level>e.before){const name=HEROES.find(h=>h.id===e.heroId)?.name??'仲間';toast(`${name} Lv.${e.level} · 基礎能力アップ`);announce(`${name}がレベル${e.level}になりました。`);}}
    if(e.type==='attack'&&!e.support)audio.play(e.hero===1?'shot':'attack');
    if(e.type==='switch')announce(`${HEROES[e.hero].name}を操作中。${HEROES[game.partnerHero].name}が援護します。`);
    if(['collect','dash','switch','hurt','upgrade','victory','defeat'].includes(e.type))audio.play(e.type);
    if(e.type==='hit'&&renderFrames%3===0)audio.play('hit');
    if(e.type==='upgrade')upgrade();
    if(e.type==='stageClear'){
      clearTimeout(toastTimer);$('#toast').classList.remove('visible');
      const run=game;playStory(e.nextArea===1?'ruins':'sanctuary',()=>{if(game!==run)return;run.advanceStage();handleEvents(run.drainEvents());updateHud();});
    }
    if(e.type==='passageOpen'){clearTimeout(bannerTimer);$('#wave-banner').classList.remove('visible');announce(e.kind==='stairs'?'下階を制圧。青い階段を上って上のフロアへ進もう。':'道が分かれています。左の緑の門は通常ルート。右の赤い門は強ボスと追加素材。歩いて選んでください。');}
    if(e.type==='passageEntered'){toast(e.name);announce(e.kind==='stairs'?'上のフロアに到着しました。祝福とクリスタルを引き継いでいます。':e.route==='elite'?'強ボスルートへ進みました。':'通常ルートへ進みました。');}
    if(e.type==='routeReward')toast('強ボス撃破！ 星の芽20・月のしずく4・守護者の核1');
    if(e.type==='exitOpen'){clearTimeout(bannerTimer);clearTimeout(ultimateBannerTimer);clearTimeout(toastTimer);$('#wave-banner').classList.remove('visible');$('#ultimate-banner').classList.remove('visible');$('#toast').classList.remove('visible');audio.play('upgrade');announce(e.final?'最後の光を、月の門へ届けよう。':'月の門が開きました。光る輪へ進もう。');}
    if(e.type==='wave'){
      const area=game.actConfig.stages[e.area];$('#area-name').textContent=game.layout.name;$('#area-sub').textContent=`CHAPTER 0${game.actConfig.chapter+1} · ACT 0${game.actConfig.number}`;$('#boss-hud span').textContent=game.actConfig.boss;$('#boss-hud small').textContent=BOSSES[game.actConfig.bossId].subtitle;
      clearTimeout(ultimateBannerTimer);$('#ultimate-banner').classList.remove('visible');$('#wave-banner span').textContent=e.boss?'FINAL ENCOUNTER':`WAVE ${String(e.wave).padStart(2,'0')}`;$('#wave-banner strong').textContent=e.boss?game.actConfig.boss:game.layout.name;$('#wave-banner small').textContent=e.boss?BOSSES[game.actConfig.bossId].hint:fieldSummary(game.act,game.area);$('#wave-banner').classList.add('visible');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>$('#wave-banner').classList.remove('visible'),2800);audio.play('wave');announce(e.boss?`最終戦、${game.actConfig.boss}が現れました。`:`ウェーブ${e.wave}、${area.name}`);if(e.boss&&storyEnabled&&ACT_SCENES[game.act].guardian)pendingStory='guardian';
    }
    if(e.type==='rescueSaved'){toast('救出成功！ 月の門へ進んで手当てをしよう');announce('オムソロを救出。最後の月の門を通ると仲間になります。');}
    if(e.type==='ultimateShot')audio.play('shot');
    if(e.type==='ultimate'){clearTimeout(bannerTimer);clearTimeout(ultimateBannerTimer);$('#wave-banner').classList.remove('visible');audio.play(e.hero===1?'ultimateGun':'ultimate');$('#ultimate-banner span').textContent=HEROES[e.hero].name+' · 固有必殺技';$('#ultimate-banner strong').textContent=ultimateFor(e.heroId).name;$('#ultimate-banner').classList.add('visible');ultimateBannerTimer=setTimeout(()=>$('#ultimate-banner').classList.remove('visible'),1600);}
    if(e.type==='hurt'){$('#damage-flash').classList.remove('flash');void $('#damage-flash').offsetWidth;$('#damage-flash').classList.add('flash');}
    if(e.type==='skill'){const skill=SKILLS.find(s=>s.id===e.id);toast(`${skill.name} を獲得`);}
    if(e.type==='victory'||e.type==='defeat')showResult(e.type==='victory');
    if(e.type==='bossAttack'&&!game.exitOpen&&game.phase==='playing')toast(`${e.label} — 予告の外へ`);
    if(e.type==='bossPhase'){toast(e.label);announce(e.label);}
    if(e.type==='enemyIntro'){const enemy=ENEMY_TYPES[e.enemyType];toast(`${enemy.name}：${enemy.hint}`);announce(`${enemy.name}が出現。${enemy.hint}`);}
  }
  if(growthChanged)persistProgression();
  if(pendingStory&&!activeDialog&&game?.phase==='playing'){const id=pendingStory;pendingStory=null;playStory(id);}
}
updatePartyLabels();
function updateHud(){
  tutorialView.render(game,!!activeDialog);if(!game)return;const p=game.player;
  if(lastHero!==p.hero){lastHero=p.hero;$('#switch .portrait').className=`portrait ${HEROES[p.hero].id}`;$('#switch .portrait').setAttribute('aria-label',HEROES[p.hero].name);$('#hero-name').textContent=HEROES[p.hero].name;$('#ultimate').dataset.hero=p.hero;const signature=ultimateFor(HEROES[p.hero].id);$('#ultimate > .icon').outerHTML=icon(signature.icon);$('#ultimate').title=`${signature.name}：${signature.note}`;
    const partner=game.partnerHero,name=partner===null?'':HEROES[partner].name;
    $('.partner-label').innerHTML=game.hasPartner?`<b id="partner-name">${name}</b> ${game.guestHeroId?'と共闘中':'が援護中'} <kbd>Q</kbd>`:'<b id="partner-name">単独出撃</b> · この仲間で挑戦中';
    $('#switch-action').classList.toggle('hidden',!game.hasPartner);$('#switch .swap-badge').classList.toggle('hidden',!game.hasPartner);$('#switch').disabled=!game.hasPartner;
    if(game.hasPartner){$('#switch-action .portrait').className=`portrait ${HEROES[partner].id}`;$('#switch-action .portrait').setAttribute('aria-label',name);$('#switch-target').textContent=`${name}へ`;}
    for(const button of document.querySelectorAll('[data-action="switch"]')){button.setAttribute('aria-label',game.hasPartner?`${name}に操作を切り替え（Q）`:`${HEROES[p.hero].name}・単独出撃`);button.title=game.hasPartner?`${name}に交代 / Q`:'単独出撃';}
  }
  $('#health-fill').style.width=`${p.hp/p.maxHp*100}%`;$('#hp').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('.health-track').setAttribute('aria-valuenow',Math.ceil(p.hp));$('.health-track').setAttribute('aria-valuemax',p.maxHp);$('.health-track').classList.toggle('low',p.hp<p.maxHp*.3);
  const progress=game.progressFor(p.hero),cap=levelCap(progress),required=xpRequired(progress.level),atCap=progress.level>=cap;
  $('#xp-fill').style.width=`${atCap?100:progress.xp/required*100}%`;$('.xp-track').setAttribute('aria-valuenow',atCap?required:progress.xp);$('.xp-track').setAttribute('aria-valuemax',required);$('.xp-track').setAttribute('aria-valuetext',atCap?`レベル上限 ${cap}、蓄積経験値 ${progress.xp}`:`経験値 ${progress.xp} / ${required}`);$('#level').textContent=`Lv. ${progress.level}`;
  $('#hero-exp').textContent=progress.level===LEVEL_RULES.maxLevel?'MAX LEVEL':atCap?`上限Lv.${cap} · EXP ${progress.xp} 蓄積`:`EXP ${progress.xp} / ${required}`;
  $('#crystal-count').textContent=`${game.stageCrystals} / ${game.crystalGoal}`;$('#crystal-fill').style.width=`${game.stageCrystals/game.crystalGoal*100}%`;$('.crystal-track').setAttribute('aria-valuenow',game.stageCrystals);$('.crystal-track').setAttribute('aria-valuemax',game.crystalGoal);$('#blessing-count').textContent=`次の祝福まで · 獲得 ${game.blessingTier}回`;
  const stageMissions=missionsFor(game.area,game.act),done=stageMissions.filter(m=>progression.missions.claimed.includes(m.id)).length,trialMission=stageMissions.find(m=>m.equipment&&!progression.missions.claimed.includes(m.id)),trial=trialMission?trialStatus(trialMission,game):null;
  $('#mission-tracker').textContent=game.difficulty==='hard'&&trial?`試練 ${Math.floor(trial.seconds)}/${trialMission.trial.seconds}秒 · 被弾${trial.hits}/${trialMission.trial.hits} ${trial.eligible?'○':'×'} · 詳細は一時停止`:`ミッション ${done}/${stageMissions.length} · 詳細は一時停止`;
  $('#kill-count').textContent=game.kills;$('#timer').textContent=minutes(game.time);
  $('#wave').textContent=`WAVE ${String(game.wave).padStart(2,'0')} / 06`;$('#wave-dots').querySelectorAll('i').forEach((el,i)=>{el.classList.toggle('done',i<game.wave-1);el.classList.toggle('current',i===game.wave-1);});
  $('#objective').classList.toggle('rescue-active',!!game.rescue?.active);$('#objective').classList.toggle('rescue-urgent',!!game.rescue?.active&&game.rescue.remaining<=30);
  $('#remaining').textContent=`${game.waveSpawned-game.enemies.length} / ${game.waveGoal}`;
  $('#objective span').textContent=game.rescue?.active?`オムソロを救出 · 残り ${Math.ceil(game.rescue.remaining)}秒`:game.rescue?.saved?'救出成功！ 最後の月の門へ':game.travelOpen==='stairs'?'青い階段から上のフロアへ':game.travelOpen==='branch'?'緑の通常ルート ／ 赤の強ボスルート':game.exitOpen?'光る月の門へ向かう':game.wave===6?'守護者を包む影をはらう':game.waveBreak>0?'次のWAVEへ · HP回復':'現れた魔物をすべて倒す';
  $('#exit-guide').classList.toggle('hidden',!game.exitOpen);$('#exit-instruction').textContent=game.wave===6?'最後の光を届けよう':'光る輪へ進もう';$('#exit-guide small').textContent=game.wave===6?`月の門へ移動すると、${actLabel(game.act)}クリア・報酬獲得`:'矢印の先へ移動すると、次のステージへ';
  const boss=game.enemies.find(e=>e.type==='boss');$('#boss-hud').classList.toggle('hidden',!boss);if(boss){$('#boss-fill').style.width=`${boss.hp/boss.maxHp*100}%`;$('#boss-hud span').textContent=boss.name;$('#boss-hud small').textContent=boss.elite?'DANGER · EXTRA REWARDS':BOSSES[boss.bossId].subtitle;}
  $('#combo').classList.toggle('visible',game.combo>=3);$('#combo strong').textContent=game.combo;
  const signature=ultimateFor(HEROES[p.hero].id),casting=game.ultimateActive(p.hero),ready=p.charge>=100&&!casting;
  $('#ultimate').style.setProperty('--charge',`${p.charge*3.6}deg`);$('#ultimate').classList.toggle('ready',ready);$('#ultimate').classList.toggle('casting',casting);$('#ult-label').textContent=casting?'発動中':ready?'必殺技':`${Math.floor(p.charge)}%`;$('#ultimate').setAttribute('aria-label',`${signature.name}（E）${casting?'発動中':`ゲージ${Math.floor(p.charge)}%`}`);$('#ultimate').setAttribute('aria-disabled',String(!ready||game.phase!=='playing'));
  if(game.hasPartner)$('#switch-target').textContent=`${HEROES[game.partnerHero].name}へ · ${Math.floor(game.chargeFor(game.partnerHero))}%`;
  $('#dash .cooldown-mask').style.transform=`scaleY(${Math.min(1,p.dashCooldown/Math.max(.65,1.5-game.rank('stride')*.2))})`;$('#dash').classList.toggle('cooling',p.dashCooldown>0);for(const button of document.querySelectorAll('[data-action="switch"]')){button.classList.toggle('cooling',p.switchCooldown>0);button.setAttribute('aria-disabled',String(!game.hasPartner||p.switchCooldown>0||game.phase!=='playing'));}
  $('#switch-action .cooldown-mask').style.transform=`scaleY(${Math.min(1,p.switchCooldown/.65)})`;
  const skillString=JSON.stringify(game.skills);if(skillString!==lastSkills){lastSkills=skillString;$('#acquired').innerHTML=Object.entries(game.skills).map(([id,rank])=>{const skill=SKILLS.find(s=>s.id===id);return `<span title="${skill.name} Lv.${rank}：${skill.text}">${icon(skill.icon)}<b>${rank}</b></span>`;}).join('');}
  if(game.time>10)$('#control-hint').classList.add('hidden');updateTerrainUi(game);
}
const numberCanvas=$('#numbers'),numberContext=numberCanvas.getContext('2d');
function drawNumbers(){const ctx=numberContext;ctx.clearRect(0,0,numberCanvas.width,numberCanvas.height);if(!game)return;
  if(game.exitOpen){
    const pos=world.project(game.exitPoint.x,game.layout.height+.15,game.exitPoint.z),x=Math.max(40,Math.min(innerWidth-40,pos.x)),y=Math.max(215,Math.min(innerHeight-230,pos.y));
    ctx.save();ctx.translate(x,y-20);ctx.fillStyle='#ffecae';ctx.strokeStyle='#153747';ctx.lineWidth=4;ctx.save();ctx.rotate(Math.atan2(pos.y-(y-20),pos.x-x)-Math.PI/2);ctx.beginPath();ctx.moveTo(-12,-12);ctx.lineTo(12,-12);ctx.lineTo(0,4);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.strokeText('月の門',0,-23);ctx.fillText('月の門',0,-23);ctx.restore();
  }
  for(const target of game.travelTargets){
    const pos=world.project(target.x,heightAt(game.layout,target.x,target.z)+2.7,target.z),x=Math.max(72,Math.min(innerWidth-72,pos.x)),y=Math.max(235,Math.min(innerHeight-180,pos.y));
    ctx.save();ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.strokeStyle='#102936';ctx.lineWidth=4;ctx.fillStyle=target.id==='elite'?'#ffacbd':target.id==='stairs'?'#bde6ff':'#a4edcf';ctx.strokeText(target.label,x,y);ctx.fillText(target.label,x,y);ctx.beginPath();ctx.moveTo(x-6,y+8);ctx.lineTo(x+6,y+8);ctx.lineTo(x,y+15);ctx.closePath();ctx.fill();ctx.restore();
  }
  let indicators=0;
  for(const enemy of game.enemies){
    const pos=world.project(enemy.x,game.layout.height+(enemy.type==='boss'?4.7:ENEMY_TYPES[enemy.type]?.barHeight??(enemy.type==='mage'?2.75:['archer','golem'].includes(enemy.type)?2.1:1.7)),enemy.z);
    if(pos.x>15&&pos.x<innerWidth-15&&pos.y>90&&pos.y<innerHeight-40){
      if(enemy.training){ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#efffd6';ctx.strokeStyle='#183f46';ctx.lineWidth=3;ctx.strokeText('練習用の的',pos.x,pos.y-12);ctx.fillText('練習用の的',pos.x,pos.y-12);}
      if(enemy.hp<enemy.maxHp&&enemy.type!=='boss'){ctx.fillStyle='rgba(13,38,46,.65)';ctx.fillRect(pos.x-17,pos.y-2,34,4);ctx.fillStyle='#f4c19f';ctx.fillRect(pos.x-16,pos.y-1,32*Math.max(0,enemy.hp/enemy.maxHp),2);}
    }else if(indicators<5){
      const dx=pos.x-innerWidth/2,dy=pos.y-innerHeight/2,sx=(innerWidth/2-19)/Math.max(.01,Math.abs(dx)),sy=(innerHeight/2-105)/Math.max(.01,Math.abs(dy)),scale=Math.min(sx,sy,1);
      const x=innerWidth/2+dx*scale,y=innerHeight/2+dy*scale;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=enemy.type==='boss'?'#ffd6a0':'#f5ddab';ctx.shadowColor='#153b3a';ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-4,-4);ctx.lineTo(-2,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();indicators++;
    }
  }
  for(const n of world.numbers){const p=world.project(n.x,n.y,n.z);ctx.globalAlpha=Math.min(1,n.life*3);ctx.font=`${n.crit?'800 25':'700 18'}px system-ui`;ctx.textAlign='center';ctx.strokeStyle='rgba(29,47,52,.65)';ctx.lineWidth=3;ctx.strokeText(n.text,p.x,p.y);ctx.fillStyle=n.crit?'#ffe2a5':'#fffbe8';ctx.fillText(n.text,p.x,p.y);}ctx.globalAlpha=1;}
function resize(){world?.resize();numberCanvas.width=innerWidth;numberCanvas.height=innerHeight;}
window.addEventListener('resize',resize);
function gamepad(){const pad=navigator.getGamepads?.()[0];if(!pad)return;for(const [i,kind] of [[0,'dash'],[1,'switch'],[3,'ultimate'],[9,'pause']]){const pressed=!!pad.buttons[i]?.pressed;if(pressed&&!previousPad[i]){if(kind==='pause'){if(game?.phase==='paused')closeDialog();else pause();}else if(kind==='dash'&&game?.tutorial?.active&&game.tutorial.step.button){if(game.advanceTutorial()){handleEvents(game.drainEvents());updateHud();}}else action(kind);}previousPad[i]=pressed;}}
function frame(now){
  const dt=Math.min((now-last)/1000,.1);last=now;renderFrames++;gamepad();
  if(game?.phase==='playing'){accumulator+=dt;let ticks=0;while(accumulator>=1/60&&ticks<6){game.tick(1/60,axes());accumulator-=1/60;ticks++;if(game.phase!=='playing'){accumulator=0;break;}}handleEvents(game.drainEvents());}else accumulator=0;
  if(world&&game){world.render(game,Math.min(dt,.05));drawNumbers();}if(game&&renderFrames%3===0)updateHud();audio.tick(!!game);requestAnimationFrame(frame);
}
async function boot(){
  try{world=new World(canvas,settings);document.body.classList.toggle('reduce-motion',!settings.motion);resize();requestAnimationFrame(frame);await Promise.all([world.ready,...[publicUrl('assets/key-art-nox.png'),publicUrl('assets/nyanluna-reference.png'),publicUrl('assets/tsukineko-reference.png'),publicUrl('assets/meadow.png')].map(src=>new Promise(resolve=>{const img=new Image();img.onload=resolve;img.onerror=resolve;img.src=src;}))]);$('#loading').classList.add('finished');setTimeout(()=>$('#loading').remove(),650);}
  catch(error){console.error(error);$('#loading').innerHTML=`<div class="loading-moon">☾</div><span>ルナネコハンティング</span><p>3D画面を起動できませんでした。<br>WebGL対応のブラウザで、ページを再読み込みしてください。</p><button class="primary" id="reload">再読み込み</button>`;$('#reload').onclick=()=>location.reload();}
}
// The audit bridge is excluded from production builds. It exercises the real simulation.
if(import.meta.env.DEV){window.__LUNARIA_TEST__={get state(){return game?.snapshot()??{phase:'home'};},get stats(){return world?.stats();},get game(){return game;},get world(){return world;},start(){start({withStory:false});},step(seconds,input={x:0,z:0}){if(!game)return;for(let i=0;i<seconds*60;i++){game.tick(1/60,input);if(game.phase!=='playing')break;}handleEvents(game.drainEvents());updateHud();},skill(id){if(game?.chooseSkill(id)){if($('#modal').open)$('#modal').close();activeDialog=null;$('#modal').classList.remove('wide');handleEvents(game.drainEvents());}},home:goHome};}
if(import.meta.env.PROD&&'serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(publicUrl('sw.js'),{scope:import.meta.env.BASE_URL}).catch(()=>{}));}
boot();
