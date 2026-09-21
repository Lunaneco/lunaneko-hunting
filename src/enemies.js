// Combat data is shared by the simulation, readable HUD hints and the renderer.
export const ENEMY_TYPES=Object.freeze({
  moss:{name:'草の魔物',hp:29,speed:1.4,damage:9,radius:.64,role:'近接',hint:'近づいて体当たりする。距離を取ろう。',xp:3,crystals:1,buds:1},
  bat:{name:'月影コウモリ',hp:23,speed:2.35,damage:7,radius:.52,role:'飛行',hint:'素早く接近する。囲まれる前に倒そう。',xp:4,crystals:1,buds:1},
  golem:{name:'遺跡ゴーレム',hp:85,speed:.88,damage:17,radius:.95,role:'重装',hint:'頑丈だが足が遅い。周り込みながら攻撃しよう。',xp:9,crystals:3,buds:2},
  archer:{name:'影森の弓兵',hp:32,speed:1.55,damage:7,radius:.58,role:'遠距離',hint:'橙の照準線のあとに矢を放つ。横へ動いてかわそう。',xp:5,crystals:2,buds:1},
  mage:{name:'月蝕の魔導士',hp:38,speed:1.15,damage:6,radius:.62,role:'魔法',hint:'紫の魔法陣から離れよう。詠唱中に倒すと魔法を止められる。',xp:6,crystals:2,buds:2},
  charger:{name:'棘甲の突撃獣',hp:56,speed:1.55,damage:11,radius:.78,role:'突進',hint:'橙の帯が突進の予告。横へ回避すると隙ができる。',xp:7,crystals:2,buds:2},
  reaper:{name:'刈影の案山子',hp:110,speed:1.9,damage:28,radius:.78,role:'鎌の近接',chapter:1,barHeight:2.8,hint:'赤い短い帯へ鎌を振る。振りかぶったら横か背後へ回り込もう。',xp:12,crystals:2,buds:3},
  matchlock:{name:'煤火の火縄兵',hp:100,speed:1.45,damage:24,radius:.7,role:'三連射',chapter:1,ranged:true,barHeight:2.5,hint:'橙の照準を固定して三連射。最初の一発を避けた後も横へ動き続けよう。',xp:14,crystals:2,buds:3},
  stormlantern:{name:'雷綴りの灯籠',hp:120,speed:1.25,damage:22,radius:.65,role:'時間差の雷',chapter:1,ranged:true,flying:true,barHeight:2.8,hint:'三つの雷印が時間差で落ちる。消えた印へ戻ると、次の雷を避けやすい。',xp:16,crystals:2,buds:3},
  pestmoth:{name:'翡翠の毒蛾',hp:86,speed:2.4,damage:23,radius:.66,role:'鱗粉の扇弾',chapter:1,ranged:true,flying:true,barHeight:2.2,hint:'緑の扇形に鱗粉弾を放つ。弾の隙間を抜けるか、背後へ回り込もう。',xp:13,crystals:2,buds:3},
  ironcrab:{name:'米蔵の鎧蟹',hp:225,speed:1.05,damage:39,radius:1.1,role:'鋏の挟撃',chapter:1,barHeight:2.3,hint:'二本の青い帯で挟み撃ち。帯の間が安全地帯。頑丈なので必殺技も使おう。',xp:22,crystals:3,buds:4},
  ramcart:{name:'破門の突槌車',hp:158,speed:1.55,damage:36,radius:1.05,role:'高速突進',chapter:1,barHeight:2.5,hint:'赤い長い帯の後に高速突進。帯を横切って避け、止まった後に反撃しよう。',xp:18,crystals:3,buds:4},
});
export const CHAPTER_ONE_ENEMIES=Object.freeze(['moss','bat','golem','archer','mage','charger']);
export const CHAPTER_TWO_ENEMIES=Object.freeze(['reaper','matchlock','stormlantern','pestmoth','ironcrab','ramcart']);
export const enemyRosterForAct=act=>act>=4?CHAPTER_TWO_ENEMIES:CHAPTER_ONE_ENEMIES;
export const isRangedEnemy=type=>ENEMY_TYPES[type]?.ranged===true||['archer','mage'].includes(type);
export const BOSSES=Object.freeze({
  thornmaw:{name:'茨牙の獣王',subtitle:'THE THORNMAW KING',role:'茨をまとう巨獣',color:0xffac69,speed:1.35,radius:2.1,attacks:['狩場の棘','獣王の咆哮','茨牙の突進'],hint:'棘は5か所へ時間差で出現。二段階に広がる咆哮から離れ、突進の後に反撃しよう。HP半分で猛攻。'},
  basalt:{name:'岩鎧の大蛇',subtitle:'THE JADE COIL',role:'翡翠の岩蛇',color:0x9ff4b6,speed:1.1,radius:2.1,attacks:['蛇骨の地割れ','翡翠の散弾','蛇尾のなぎ払い'],hint:'5方向の地割れの間へ移動。高速の散弾には隙間がある。広い尾の予告帯を離れよう。HP半分で猛攻。'},
  ironbell:{name:'鉄鐘の門衛',subtitle:'THE IRON BELL KEEPER',role:'鐘楼の鉄騎士',color:0xd7acff,speed:.8,radius:2,attacks:['封鎖の十字','鐘楼の落雷','鉄槌の一撃'],hint:'十字の衝撃に続き、斜めの衝撃が来る。先に消えた帯へ移動して連続攻撃を避けよう。HP半分で猛攻。'},
  colossus:{name:'蹂躙の巨神・ヴォルガント',subtitle:'VOLGANT · THE STARBREAKER',role:'砦を砕く巨神',color:0xff876e,speed:.95,radius:2.65,attacks:['巨腕の崩落','落星の包囲','星砦砕き'],hint:'Lv.30を目安に準備し、180秒以内にオムソロを救出。巨腕の三連撃は時間差。HP半分から猛攻が速まる。'},
  treant:{name:'封印の番人',subtitle:'THE ROOTBOUND SENTINEL',role:'古樹の巨人',color:0xf4b56e,speed:1,radius:1.9,attacks:['根縛り','種子の三連弾','根の突進'],hint:'根の魔法陣を避け、種子の三連弾の横へ。突進の後が好機。'},
  chronarch:{name:'時守の残響',subtitle:'THE ASTRAL CHRONARCH',role:'浮遊する星時計',color:0xffd079,speed:.9,radius:1.7,attacks:['五刻の魔法陣','時針の十字砲','時計仕掛けの連射'],hint:'五つの刻印と十字の予告線に注意。線の間へ動こう。'},
  tempest:{name:'雲海の番人',subtitle:'THE CLOUDSEA WYVERN',role:'雲海の翼竜',color:0xff9c7e,speed:1.3,radius:1.85,attacks:['風の三重奏','星羽の円環','翼竜の急降下'],hint:'星羽には隙間がある。急降下は長い予告帯の横へ回避。'},
  eclipse:{name:'月蝕の守護者',subtitle:'THE ECLIPSE WARDEN',role:'月を抱く石の守り手',color:0xff749d,speed:1.1,radius:1.9,attacks:['月蝕の刻印','欠け月の星弾','月蝕の突進'],hint:'刻印・星弾・突進を使う。HP半分で月蝕が深まり、攻撃が速くなる。'},
});
export const BOSS_IDS=Object.freeze(['treant','chronarch','tempest','eclipse','thornmaw','basalt','ironbell','colossus']);
export function enemyForSpawn(act,wave,index,roll){
  if(wave===6)return 'boss';
  if(act>=4){
    // Every second-chapter wave uses only the new roster, including the opening.
    const introductions=['reaper','matchlock','stormlantern','ironcrab','ramcart'];
    if(index===0)return introductions[Math.min(4,wave-1)];
    if(index===1)return wave===1?'matchlock':'pestmoth';
    const weights=[.27,.19,.16,.18,wave>=3?.13:.07,wave>=2?.13:0];
    let value=roll*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<weights.length;i++){value-=weights[i];if(value<0)return CHAPTER_TWO_ENEMIES[i];}
    return 'reaper';
  }
  if(act===0&&wave===1)return 'moss';
  // Guarantee the introduction before adding each type to the mixed encounters.
  if(index===0){if(wave===2)return 'archer';if(wave===3)return 'mage';if(wave===4)return 'charger';}
  const available=[['moss',.3],['bat',.23],...(wave>=3?[['golem',.17]]:[]),['archer',.13],...(wave>=3||act>0?[['mage',.1]]:[]),...(wave>=4||act>1?[['charger',.1]]:[])];
  let value=roll*available.reduce((sum,[,weight])=>sum+weight,0);
  for(const [id,weight] of available){value-=weight;if(value<0)return id;}return 'moss';
}
export function distanceToHazard(x,z,h){
  if(h.shape!=='line')return Math.hypot(x-h.x,z-h.z)-h.radius;
  const dx=x-h.x,dz=z-h.z,along=dx*Math.sin(h.angle)+dz*Math.cos(h.angle),across=dx*Math.cos(h.angle)-dz*Math.sin(h.angle);
  const a=Math.abs(along)-h.length/2,b=Math.abs(across)-h.width/2;
  return Math.hypot(Math.max(0,a),Math.max(0,b))+Math.min(0,Math.max(a,b));
}
