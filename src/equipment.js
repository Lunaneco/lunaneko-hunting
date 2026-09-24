import {publicUrl} from './public-url.js';
export const WEAPONS=Object.freeze({
  mochinyafe:{id:'mochi-voice',name:'もちもちの声',kind:'voice',icon:'heart',note:'もちにゃふぇの生まれ持った声。操作時は小さな体当たり、援護時は敵を止める「ふぇ〜」。固定装備。'},
  omsolo:{id:'light-saber',name:'ライトセーバー・翠守',kind:'saber',icon:'sword',note:'オムソロ専用。近距離の敵を扇状にまとめて斬り払う緑の光刃。'},
  nyanluna:{id:'luna-staff',name:'月詠の杖・ルナリア',kind:'staff',icon:'moon',note:'にゃんるな専用。敵を追いかける月光弾を放つ。'},
  tsukineko:{id:'nox-rifle',name:'星穿銃・ノクス',kind:'gun',icon:'gun',note:'つきねこ専用。直進する星弾が敵を2体まで貫通する。'},
});
export const UNIQUE_EQUIPMENT=Object.freeze([
  {id:'meadow-charm',name:'星露の花飾り',area:0,icon:'heart',color:'#b6e3c4',bonus:{hp:30},note:'草原の朝露を閉じ込めた花。最大HP +30。'},
  {id:'ruins-lens',name:'月影の照準石',area:1,icon:'spark',color:'#b7cbf6',bonus:{attack:.12},note:'遺跡に残された月のレンズ。攻撃力 +12%。'},
  {id:'dawn-seal',name:'暁守の紋章',area:2,icon:'shield',color:'#f3d097',bonus:{defense:12},note:'聖域の光を宿す紋章。防御力 +12。'},
  {id:'clock-pendant',name:'星時計のペンダント',act:1,area:2,icon:'spark',color:'#93d9ec',bonus:{attack:.08,defense:6},note:'再び動き出した星時計。攻撃力 +8%／防御力 +6。'},
  {id:'cloud-feather',name:'雲渡りの羽',act:2,area:2,icon:'heart',color:'#b5edec',bonus:{hp:24,defense:8},note:'雲海を越えた約束の羽。最大HP +24／防御力 +8。'},
  {id:'twin-star-knot',name:'ふたりの星結び',act:3,area:2,icon:'link',color:'#ceb7ff',bonus:{hp:20,attack:.08},note:'月と星が寄り添う親友の証。最大HP +20／攻撃力 +8%。'},
  {id:'woodland-token',name:'木漏れ日の護符',act:4,area:2,icon:'heart',color:'#b4dda2',bonus:{hp:35,defense:5},note:'森で拾った勇気の印。最大HP +35／防御力 +5。'},
  {id:'jade-guard',name:'翡翠の腕輪',act:5,area:2,icon:'shield',color:'#85e6c0',bonus:{attack:.10,defense:9},note:'緑の光を映す腕輪。攻撃力 +10%／防御力 +9。'},
  {id:'bell-fragment',name:'静かな星鐘',act:6,area:2,icon:'star',color:'#dcb8ff',bonus:{hp:30,attack:.12},note:'救うために鳴らした鐘。最大HP +30／攻撃力 +12%。'},
  {id:'guardian-knot',name:'守り手の結び',act:7,area:2,icon:'link',color:'#afffcc',bonus:{hp:35,attack:.10,defense:8},note:'小さな願いに応えた証。最大HP +35／攻撃力 +10%／防御力 +8。'},

]);
export const equipmentImage=id=>publicUrl(`assets/equipment/${id}.${['light-saber','woodland-token','jade-guard','bell-fragment','guardian-knot'].includes(id)?'png':'webp'}`);
export const uniqueEquipment=id=>UNIQUE_EQUIPMENT.find(item=>item.id===id);
const safeId=id=>typeof id==='string'&&/^[a-z0-9_-]{1,64}$/i.test(id)&&!['__proto__','constructor','prototype'].includes(id);
export function normalizeEquipment(raw){
  const owned=UNIQUE_EQUIPMENT.filter(item=>Array.isArray(raw?.owned)&&raw.owned.includes(item.id)).map(item=>item.id),loadout={},used=new Set();
  for(const [hero,id] of Object.entries(raw?.loadout&&typeof raw.loadout==='object'?raw.loadout:{}))if(safeId(hero)&&owned.includes(id)&&!used.has(id)){loadout[hero]=id;used.add(id);}
  return {owned,loadout};
}
export function equipmentBonuses(equipment,heroId){const id=equipment?.loadout?.[heroId];return equipment?.owned?.includes(id)?uniqueEquipment(id)?.bonus??{}:{};}
export function equipmentOwner(equipment,id){return Object.keys(equipment.loadout).find(hero=>equipment.loadout[hero]===id);}
export function equipUnique(equipment,heroId,id,{transfer=false}={}){
  if(!Object.hasOwn(WEAPONS,heroId))return false;
  if(id===''){delete equipment.loadout[heroId];return true;}
  if(!equipment.owned.includes(id)||!uniqueEquipment(id))return false;
  const owner=equipmentOwner(equipment,id);if(owner&&owner!==heroId){if(!transfer)return false;delete equipment.loadout[owner];}
  equipment.loadout[heroId]=id;return true;
}
export function equipmentBonusText(bonus){return [bonus.hp?`HP +${bonus.hp}`:'',bonus.attack?`攻撃力 +${Math.round(bonus.attack*100)}%`:'',bonus.defense?`防御力 +${bonus.defense}`:''].filter(Boolean).join(' ／ ')||'補正なし';}
