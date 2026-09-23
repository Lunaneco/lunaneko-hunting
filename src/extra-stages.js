import {FIELD_THEMES} from './field-themes.js';

const stage=(name,theme,note,index)=>({name,theme,image:FIELD_THEMES[theme].image,note,waves:`WAVE 0${index*2+1}–0${index*2+2}`});
// Separate from the eight story acts: both unlock together and have independent first clears.
export const EXTRA_ACTS=Object.freeze([
 {id:8,chapter:0,title:'月蝕の深淵',summary:'月の世界の奥に残った影へ。草原・上層回廊・深淵の祭壇を越える、Lv.50向けの最終試練。',counts:[30,34,38,42,46,1],boss:'月蝕の守護者',bossId:'eclipse',bossHp:11000,hpScale:6.5,damageScale:5,stages:[stage('深月の草原',0,'四方から迫る魔物の猛攻',0),stage('星影の上層回廊',1,'階段の先で続く連戦',1),stage('月蝕の深淵壇',2,'最初から深化した月蝕の守護者',2)]},
 {id:9,chapter:1,title:'穂守りの極陣',summary:'穂むすびの国に残る強敵を討つ。棚田・城下・砦の最奥で挑む、Lv.50向けの最終試練。',counts:[32,36,40,44,48,1],boss:'蹂躙の巨神・ヴォルガント',bossId:'colossus',bossHp:13000,hpScale:2.5,damageScale:3,stages:[stage('黄金の修羅道',3,'連射と時間差の雷を突破',0),stage('穂鐘の試練塔',5,'鎧蟹と突槌車が守る上層へ',1),stage('穂守りの極陣',6,'猛攻する巨神との最終決戦',2)]},
].map(a=>Object.freeze({...a,extra:true,number:null,recruit:null,recommendedLevel:50})));

export const EXTRA_COMBAT=Object.freeze({cooldownRate:1.65,telegraphScale:.7,moveScale:1.25,projectileScale:1.25,spawnScale:.75,rangedLimit:6});
export const EXTRA_FIRST_TICKETS=10;
export const EXTRA_REPEAT_TICKETS=2;
export const EXTRA_COMBAT_HINT='Lv.50向け・最高難度固定。敵の移動・弾速・攻撃頻度が上昇し、予告が短縮。ボスは最初から猛攻状態。';
