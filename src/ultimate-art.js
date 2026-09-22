import {publicUrl} from './public-url.js';

export const ULTIMATE_ART=Object.freeze({
  nyanluna:Object.freeze({file:'assets/ultimates/nyanluna-sanctuary-v1.webp',accent:'#e0b5ff',label:'LUNAR SANCTUARY',alt:'にゃんるなが月の杖を突き出し、月華の結界と光の魔法陣を展開する'}),
  tsukineko:Object.freeze({file:'assets/ultimates/tsukineko-comet-v1.webp',accent:'#83eaff',label:'COMET BARRAGE',alt:'つきねこが星の銃を構え、銃口から青い彗星の連射を放つ'}),
  omsolo:Object.freeze({file:'assets/ultimates/omsolo-vow-v1.webp',accent:'#b1ffad',label:'EMERALD VOW',alt:'オムソロが緑の光剣を握り、円を描く翠光の斬撃を繰り出す'}),
});
export const ultimateArtUrl=heroId=>publicUrl(ULTIMATE_ART[heroId].file);
export function preloadUltimateArt(heroIds){
  for(const id of heroIds){if(!ULTIMATE_ART[id])continue;const image=new Image();image.src=ultimateArtUrl(id);image.decode().catch(()=>{});}
}
