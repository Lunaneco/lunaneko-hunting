export const ULTIMATES=Object.freeze({
  omsolo:Object.freeze({id:'emerald-vow',name:'翠光・守り手の円舞',icon:'sword',color:0xaaffba,kind:'bladeDance',radius:6.5,pulses:5,interval:.22,duration:1.1,baseDamage:47,heal:18,immunity:1.6,note:'周囲を5回斬り払い、HPを18回復。発動中は無敵。移動・交代しても剣舞を続ける。'}),
  nyanluna:Object.freeze({id:'moon-sanctuary',name:'月華の聖域',icon:'moon',color:0xdfbaff,kind:'sanctuary',radius:8.5,pulses:4,interval:.65,duration:2.6,baseDamage:60,heal:24,slow:.55,bossSlow:.8,immunity:1.5,note:'月の魔法陣で4回の範囲攻撃。敵を減速し、発動時にHPを24回復。'}),
  tsukineko:Object.freeze({id:'comet-barrage',name:'星銃・彗星連射',icon:'gun',color:0x89edff,kind:'barrage',shots:8,interval:.11,range:20,speed:38,pierce:3,baseDamage:38,immunity:.9,note:'敵を自動で狙う8連射。各弾は3体まで貫通。移動や交代をしても撃ち切る。'}),
});
export const ultimateFor=heroId=>ULTIMATES[heroId];
