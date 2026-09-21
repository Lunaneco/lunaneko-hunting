import {publicUrl} from './public-url.js';
// The narrator is represented by the lost moonlight already present in the story.
export const STORY_CAST=Object.freeze({
  komusubi:Object.freeze({name:'こむすび',role:'お父さんを探す小さな子',image:publicUrl('assets/story/komusubi.png'),alt:'こむすび — 黒い帽子と青いリュックの小さな猫。涙を流して助けを求めている',color:'#ffe3a5'}),
  omsolo:Object.freeze({name:'オムソロ',role:'翠光の剣士',image:publicUrl('assets/story/omsolo.png'),alt:'オムソロ — 黒い帽子とサングラス、砂色のローブを着て緑のライトセーバーを持つ猫の剣士',color:'#adffc6'}),
  omsolo_hurt:Object.freeze({name:'オムソロ',role:'消えかけた命の灯り',image:publicUrl('assets/story/omsolo-hurt.png'),alt:'傷ついたオムソロ — 汚れたローブで膝をつき、消えた光剣の柄を握っている',color:'#bfe3cf'}),
  nyanluna:Object.freeze({name:'にゃんるな',role:'月光の魔法使い',image:publicUrl('assets/story/nyanluna.webp'),alt:'にゃんるな — 月の杖を持つ、薄紫の髪の猫耳の魔法使い',color:'#dac5ff'}),
  tsukineko:Object.freeze({name:'つきねこ',role:'星影の銃使い',image:publicUrl('assets/story/tsukineko.webp'),alt:'つきねこ — 星穿銃を持つ、白と紺の髪の猫耳の銃使い',color:'#a2eaff'}),
  guardian:Object.freeze({name:'月の守護者',role:'古い約束の声',image:publicUrl('assets/story/guardian.webp'),alt:'月の守護者 — 金色の角と青い月の結晶を持つ石の守り手',color:'#f1d8a2'}),
  narrator:Object.freeze({name:'ものがたり',role:'LUNANEKO ADVENTURE',image:publicUrl('assets/story/moonlight.webp'),alt:'迷子の月灯り — 旅を導く、小さな月の光',color:'#f5dfb5'}),
});

export function storySpeaker(id){return STORY_CAST[id]??STORY_CAST.narrator;}

export function preloadStoryCast(){
  for(const speaker of Object.values(STORY_CAST)){const image=new Image();image.src=speaker.image;image.decode().catch(()=>{});}
}
