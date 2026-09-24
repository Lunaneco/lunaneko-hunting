// Silhouettes and colours adapted from the supplied Mochinyafe Dungeon cast.
import * as THREE from 'three';
export const MOCHI_ENEMIES=Object.freeze({
 mochiSlime:{name:'スライム',hp:130,speed:1.4,damage:28,radius:.7,role:'もちの里の侵入者',chapter:2,hint:'青いしずくの魔物。近づく前に撃退しよう。',xp:20,crystals:2,buds:3},
 mochiGoblin:{name:'ゴブリン',hp:170,speed:1.9,damage:34,radius:.7,role:'棍棒の近接',chapter:2,hint:'緑の体と木の棍棒。振りかぶりの予告帯から横へ逃げよう。',xp:22,crystals:2,buds:3},
 mochiSkeleton:{name:'スケルトン',hp:145,speed:1.4,damage:30,radius:.65,role:'骨の弓兵',chapter:2,ranged:true,hint:'白い骨の弓兵。橙の照準線を見たら横へ動こう。',xp:23,crystals:2,buds:3},
 mochiOrc:{name:'オーク',hp:320,speed:1.05,damage:48,radius:1,role:'重い一撃',chapter:2,hint:'大きな緑の体と斧。丸い予告から離れ、空振りの後に反撃。',xp:30,crystals:3,buds:4},
 mochiWolf:{name:'ワーウルフ',hp:210,speed:2.55,damage:37,radius:.8,role:'狼の突進',chapter:2,hint:'灰色の狼。赤い帯の先へ飛びかかるので横へ回避しよう。',xp:26,crystals:2,buds:4},
 mochiGolem:{name:'ゴーレム',hp:410,speed:.8,damage:52,radius:1.12,role:'岩の重装',chapter:2,hint:'岩を積み重ねた巨体。足は遅いが近距離の踏みつけは強烈。',xp:34,crystals:3,buds:4},
 mochiDragon:{name:'ドラゴン',hp:270,speed:1.2,damage:38,radius:.95,role:'扇状の炎',chapter:2,ranged:true,hint:'赤い翼と角を持つ竜。三方向の火球の隙間を抜けよう。',xp:32,crystals:3,buds:4},
});
export const MOCHI_BOSSES=Object.freeze({
 darkmochi:{name:'ダークもちにゃふぇ・影爪',subtitle:'THE SHADOW PAW',role:'里を襲う黒い影',color:0xff81b2,speed:1.7,radius:1.9,attacks:['影爪の三連撃','闇のふぇ〜','もちもち突進'],hint:'三本の爪痕を横へ回避。闇の声の弾には隙間がある。突進が止まった後に反撃。'},
 dreammochi:{name:'ダークもちにゃふぇ・夢喰',subtitle:'THE DREAM EATER',role:'眠りを奪う影',color:0xc99aff,speed:1.1,radius:2,attacks:['夢喰のまくら','まどろみの輪','ねむねむ落下'],hint:'紫の丸印が順に破裂する。足元に出る大きな丸から早めに離れよう。'},
 bellmochi:{name:'ダークもちにゃふぇ・黒鈴',subtitle:'THE HOLLOW BELL',role:'声を閉じる影',color:0xffc17b,speed:1.25,radius:2,attacks:['黒鈴の十字','こだまの散弾','沈黙の鐘'],hint:'十字の予告の後に斜めの帯が来る。消えた帯へ動くと連撃を避けられる。'},
 kingmochi:{name:'ダークもちにゃふぇ・闇の王',subtitle:'THE LAST ECLIPSE',role:'最後の声を奪う王',color:0xff719a,speed:1.35,radius:2.3,attacks:['最後の夜','王のふぇ〜','孤独の大突進'],hint:'円形の封印と散弾をかわそう。HP半分で攻撃が速まる。大突進の後が救出への好機。'},
});
export function buildMochiEnemy(type,bossId,root,body,{part,ball,tube}){
 const boss=type==='boss',wings=[],rotors=[];let focus=null;
 const rod=(c,x,y,z,r,h)=>part(body,new THREE.CylinderGeometry(r,r,h,8),c,x,y,z);
 const eyes=(y,z,x=.22,c=0x311d30)=>{for(const s of [-1,1]){ball(body,c,s*x,y,z,[.10,.14,.045]);ball(body,0xffe9df,s*x-.025,y+.04,z+.036,[.025,.03,.014]);}};
 const feet=(c,x=.34,z=.26)=>{for(const s of [-1,1])ball(body,c,s*x,.17,z,[.27,.19,.33]);};
 if(boss){
  const fur=bossId==='dreammochi'?0x38304e:bossId==='bellmochi'?0x302a40:0x242339,accent=MOCHI_BOSSES[bossId].color;
  ball(body,fur,0,1.45,0,[1.55,1.32,1.18]);
  for(const s of [-1,1]){
   const ear=part(body,new THREE.ConeGeometry(.48,1.15,5),fur,s*.98,2.75,0);ear.rotation.z=-s*.2;
   const inner=part(body,new THREE.ConeGeometry(.28,.7,5),0xc174a9,s*1.0,2.82,.21);inner.rotation.z=-s*.2;
   ball(body,accent,s*.53,1.6,1.105,[.23,.29,.085]);ball(body,0xffe7ef,s*.57,1.69,1.18,[.055,.07,.018]);
   ball(body,0xc3669c,s*.98,1.23,.94,[.24,.14,.06]);
   for(const z of [-.55,.65])ball(body,fur,s*.91,.24,z,[.4,.27,.39]);
  }
  ball(body,0xd68eb4,0,1.28,1.205,[.1,.075,.07]);
  for(const s of [-1,1])tube(body,[[0,1.26,1.22],[s*.14,1.13,1.23],[s*.32,1.23,1.2]],.043,0xd68eb4);
  if(bossId==='kingmochi'){part(body,new THREE.CylinderGeometry(.56,.48,.24,8),0xd3b875,0,2.8,0);for(let i=0;i<5;i++)part(body,new THREE.ConeGeometry(.12,.55,5),0xe2bd70,Math.sin(i*1.26)*.48,3.1,Math.cos(i*1.26)*.48);focus=part(body,new THREE.OctahedronGeometry(.2),accent,0,2.94,.55,null,.8);}
  else if(bossId==='bellmochi'){part(body,new THREE.TorusGeometry(1.12,.09,6,28),0x85705e,0,.88,.05).rotation.x=Math.PI/2;focus=part(body,new THREE.SphereGeometry(.28,10,8),0xe8ba7b,0,.84,1.12,null,.5);}
  else if(bossId==='dreammochi'){part(body,new THREE.ConeGeometry(.48,1,8),0x866ca3,0,2.95,-.1).rotation.z=-.3;focus=part(body,new THREE.OctahedronGeometry(.13),accent,-.33,3.46,-.1,null,.5);}
  else for(const s of [-1,1])for(let i=0;i<3;i++)part(body,new THREE.ConeGeometry(.085,.42,5),0xf4b5d8,s*.91+(i-1)*.15,.22,1.02).rotation.x=Math.PI/2;
 }else if(type==='mochiSlime'){
  ball(body,0x68c8ed,0,.58,0,[.75,.62,.68]);part(body,new THREE.ConeGeometry(.32,.42,12),0x68c8ed,0,1.08,0);eyes(.66,.58);ball(body,0xbbf2ff,-.26,.94,.34,[.12,.07,.04]);
 }else if(type==='mochiGolem'){
  for(const [x,y,z,s] of [[0,1.05,0,.86],[-.93,.9,0,.44],[.93,.9,0,.44],[0,1.95,0,.55]])part(body,new THREE.DodecahedronGeometry(s),0x898994,x,y,z);
  feet(0x5e616f,.45);eyes(1.99,.46,.22,0xffbe6d);focus=part(body,new THREE.OctahedronGeometry(.18),0xffbe6d,0,1.05,.74,null,.6);
 }else if(type==='mochiDragon'){
  ball(body,0xaa3848,0,.95,0,[.75,.86,.62]);ball(body,0xd86262,0,.87,.47,[.45,.58,.18]);ball(body,0xba454f,0,1.9,.17,[.71,.62,.6]);eyes(2.04,.67,.29);feet(0xa73349,.5);
  for(const s of [-1,1]){part(body,new THREE.ConeGeometry(.16,.63,6),0xf4dca4,s*.45,2.51,0).rotation.z=-s*.28;
   const wing=new THREE.Group();wing.position.set(s*.53,1.4,-.18);root.add(wing);wings.push(wing);const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(s*.9,.65);shape.lineTo(s*1.3,-.3);shape.lineTo(s*.65,-.05);shape.lineTo(s*.38,-.5);shape.closePath();part(wing,new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false}),0x842b43);}
  tube(body,[[0,.6,-.4],[.5,.36,-1],[1,.3,-1.35]],.15,0xae3b48);
 }else if(type==='mochiSkeleton'){
  const bone=0xe8dfc5;ball(body,bone,0,1.82,0,[.44,.48,.37]);eyes(1.87,.34,.16,0x30263f);
  rod(bone,0,1.05,0,.085,1);for(const s of [-1,1]){for(let i=0;i<3;i++)tube(body,[[0,1.42-i*.17,0],[s*.3,1.32-i*.17,.03],[s*.18,1.17-i*.17,.22]],.045,bone);rod(bone,s*.2,.46,0,.07,.78);rod(bone,s*.48,1.12,0,.07,.68);}feet(bone,.2);tube(body,[[.62,.6,.1],[.94,1.2,.2],[.65,1.9,.1]],.05,0x896b4d);tube(body,[[.62,.6,.1],[.65,1.9,.1]],.012,bone);
 }else{
  const wolf=type==='mochiWolf',orc=type==='mochiOrc',skin=wolf?0x747788:orc?0x6d944d:0x97b553;
  ball(body,skin,0,.92,0,[orc?.79:.51,.7,.45]);ball(body,skin,0,1.77,.03,[orc?.66:.56,.53,.45]);feet(skin,orc?.5:.32);eyes(1.86,.44,.23);
  for(const s of [-1,1]){const ear=part(body,new THREE.ConeGeometry(.25,.6,4),skin,s*.51,2.0,0);ear.rotation.z=-s*(wolf?.3:1.1);ball(body,skin,s*(orc?.8:.57),.92,.09,[.23,.47,.25]);part(body,new THREE.ConeGeometry(.07,.2,5),0xffe8bc,s*.19,1.43,.46);}
  if(wolf){ball(body,0xa4a4b2,0,1.58,.43,[.3,.23,.29]);ball(body,0x342735,0,1.65,.68,[.13,.1,.07]);tube(body,[[0,.63,-.4],[.4,.9,-.8],[.5,1.08,-1]],.15,skin);}
  else{part(body,new THREE.CylinderGeometry(orc?.73:.48,orc?.83:.56,.43,9),0x806049,0,.45,0);const club=rod(0x8b5a3c,-(orc?.98:.78),1.15,.25,.11,1.6);club.rotation.z=.25;if(orc){const blade=part(body,new THREE.BoxGeometry(.64,.6,.12),0x989cab,-.94,1.84,.25);blade.rotation.z=.2;}else ball(body,0x9e7246,-.97,1.84,.25,[.24,.44,.25]);}
 }
 if(focus)focus.userData.dynamic=true;
 return {focus,wings,rotors};
}
