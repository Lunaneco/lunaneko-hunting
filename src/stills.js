import {publicUrl} from './public-url.js';

// ① Lv.30, ② Lv.50, ③ Lv.70. ④ uses the same Lv.70 threshold as ③.
export const STILL_UNLOCK_LEVELS=Object.freeze([30,50,70,70]);
const MARKS=Object.freeze(['①','②','③','④']);

const STILL_FILES=Object.freeze({
  nyanluna:Object.freeze(['nyanluna-1.jpg','nyanluna-2.png','nyanluna-3.jpg']),
  tsukineko:Object.freeze(['tsukineko-1.jpg','tsukineko-2.png','tsukineko-3.jpg']),
  omsolo:Object.freeze(['omsolo-1.png','omsolo-2.png','omsolo-3.png']),
  mochinyafe:Object.freeze(['mochinyafe-1.png','mochinyafe-2.png','mochinyafe-3.png']),
  shizuku:Object.freeze(['shizuku-1.jpg','shizuku-2.jpg','shizuku-3.jpg','shizuku-4.jpg']),
  prim:Object.freeze(['prim-1.jpg','prim-2.jpg','prim-3.jpg']),
  heherial:Object.freeze(['heherial-1.jpg','heherial-2.jpg','heherial-3.jpg']),
  rumi:Object.freeze(['rumi-1.jpg']),
});

export const STILL_CAST=Object.freeze([
  Object.freeze({id:'nyanluna',name:'にゃんるな',playable:true}),
  Object.freeze({id:'tsukineko',name:'つきねこ',playable:true}),
  Object.freeze({id:'omsolo',name:'オムソロ',playable:true}),
  Object.freeze({id:'mochinyafe',name:'もちにゃふぇ',playable:true}),
  Object.freeze({id:'shizuku',name:'雫',playable:true}),
  Object.freeze({id:'prim',name:'プリム',playable:true}),
  Object.freeze({id:'heherial',name:'へへりある',playable:false}),
  Object.freeze({id:'rumi',name:'るみ',playable:false}),
]);

export function stillHeroLevel(profile,heroId){
  const level=profile?.characters?.[heroId]?.level;
  return Number.isFinite(level)?level:0;
}

export function stillsForHero(heroId){
  const hero=STILL_CAST.find(item=>item.id===heroId);
  const files=STILL_FILES[heroId]??[];
  return files.map((file,index)=>({
    id:`${heroId}-${index+1}`,
    heroId,
    name:hero?.name??heroId,
    playable:hero?.playable===true,
    index:index+1,
    mark:MARKS[index],
    level:STILL_UNLOCK_LEVELS[index],
    file:`assets/stills/${file}`,
    image:publicUrl(`assets/stills/${file}`),
  }));
}

export function allStills(){return STILL_CAST.flatMap(hero=>stillsForHero(hero.id));}

export function stillById(id){return allStills().find(still=>still.id===id)??null;}

export function isStillUnlocked(profile,still){
  return !!still&&Number.isFinite(still.level)&&stillHeroLevel(profile,still.heroId)>=still.level;
}
