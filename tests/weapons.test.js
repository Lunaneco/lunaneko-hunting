import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES,seededRandom} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {equipUnique,normalizeEquipment} from '../src/equipment.js';
import {WEAPON_CATALOG,WEAPON_HERO_IDS,WEAPON_RARITIES,WEAPON_TICKET_DROP_RATE,normalizeWeapons,equippedWeapon,drawWeapon,bossWeaponTicket} from '../src/weapons.js';
import {weaponGachaView,weaponDrawResult} from '../src/weapons-ui.js';
const fresh=()=>normalizeProgression({},HEROES);
const roll=(profile,hero,rarity)=>{const values=[hero,rarity];return drawWeapon(profile,()=>values.shift());};
const quiet=(options={})=>{const g=new Adventure({seed:27,...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.drainEvents();return g;};

test('legacy saves retain all progress, relics and base stats with three starter weapons and zero tickets',()=>{
 const old={story:{version:2,actClears:[true,true]},characters:{nyanluna:{level:9,xp:17,tree:['origin']},future:{level:2}},inventory:{starBud:71,moonDew:5,limitStone:2},equipment:{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}}};
 const p=normalizeProgression(old,HEROES);assert.equal(p.inventory.weaponTicket,0);assert.equal(p.inventory.starBud,71);assert.deepEqual(p.equipment,old.equipment);assert.equal(p.characters.nyanluna.level,9);assert.equal(p.characters.nyanluna.xp,17);assert.equal(p.characters.future.level,2);assert.equal(p.weapons.owned.length,3);
 for(const hero of HEROES)assert.equal(equippedWeapon(p,hero.id).rarity.rank,1);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
});
test('weapon IDs, tickets and saved draw results are normalized without accepting invented rewards',()=>{
 for(const bad of [-2,NaN,Infinity,'4',null])assert.equal(normalizeProgression({inventory:{weaponTicket:bad}},HEROES).inventory.weaponTicket,0);
 const p=normalizeProgression({inventory:{weaponTicket:4.9},weapons:{owned:['nox-rifle-r4','nox-rifle-r4','luna-staff-r99','__proto__'],draws:-2,lastDraw:{weaponId:'<script>',duplicate:true}}},HEROES);
 assert.equal(p.inventory.weaponTicket,4);assert.equal(p.weapons.owned.length,4);assert.equal(p.weapons.draws,0);assert.equal(p.weapons.lastDraw,null);assert.deepEqual(normalizeWeapons(null),normalizeWeapons({}));
});
for(const [heroIndex,heroRoll] of [[0,0],[1,1/3],[2,2/3]])for(const [rank,rarityRoll] of [[2,0],[3,.75],[4,.95]])test(`gacha boundary selects hero ${heroIndex}, rarity ${rank}, independently of recruitment`,()=>{
 const p=fresh();p.inventory.weaponTicket=1;const before=structuredClone(p),r=roll(p,heroRoll,rarityRoll);assert.equal(r.item.heroId,WEAPON_HERO_IDS[heroIndex]);assert.equal(r.item.rarity.rank,rank);assert.equal(r.duplicate,false);assert.equal(r.upgraded,true);assert.equal(p.inventory.weaponTicket,0);assert.equal(p.weapons.draws,1);assert.equal(equippedWeapon(p,r.item.heroId).rarity.rank,rank);assert.deepEqual(p.characters,before.characters);assert.deepEqual(p.story,before.story);assert.deepEqual(p.equipment,before.equipment);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
});
test('the published 75/20/5 rates and equal character odds cover a uniform grid exactly',()=>{
 const p=fresh();p.inventory.weaponTicket=300;const totals={};
 for(let hero=0;hero<3;hero++)for(let rarity=0;rarity<100;rarity++){const result=roll(p,(hero+.5)/3,(rarity+.5)/100),id=`${result.item.heroId}-${result.item.rarity.rank}`;totals[id]=(totals[id]??0)+1;}
 for(const id of WEAPON_HERO_IDS){assert.equal(totals[`${id}-2`],75);assert.equal(totals[`${id}-3`],20);assert.equal(totals[`${id}-4`],5);}assert.equal(p.weapons.owned.length,12);assert.equal(p.inventory.weaponTicket,0);
});
test('a draw with no ticket, or an invalid RNG, changes nothing',()=>{
 const p=fresh(),before=structuredClone(p);assert.equal(drawWeapon(p,()=>{throw Error('must not roll');}),null);assert.deepEqual(p,before);
 p.inventory.weaponTicket=2;for(const value of [NaN,-.1,1,Infinity]){const snapshot=structuredClone(p);assert.equal(drawWeapon(p,()=>value),null);assert.deepEqual(p,snapshot);}
});
for(const [rarity,seed] of [[2,.1],[3,.8],[4,.99]])test(`rarity ${rarity} duplicate converts into the advertised buds and still consumes exactly one ticket`,()=>{
 const p=fresh();p.inventory.weaponTicket=3;roll(p,0,seed);const r=roll(p,0,seed);assert.equal(r.duplicate,true);assert.equal(r.duplicateBuds,WEAPON_RARITIES[rarity-1].duplicateBuds);assert.equal(p.inventory.starBud,r.duplicateBuds);assert.equal(p.inventory.weaponTicket,1);assert.equal(p.weapons.owned.length,4);assert.equal(p.weapons.draws,2);assert.deepEqual(p.weapons.lastDraw,{weaponId:r.item.id,duplicate:true});
 const restored=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(restored,p);assert.equal(restored.inventory.starBud,r.duplicateBuds);
});
test('only the owner receives the rarity bonus; highest rarity never downgrades, and relics remain a separate slot',()=>{
 const p=fresh();p.inventory.weaponTicket=3;p.equipment.owned=['ruins-lens'];equipUnique(p.equipment,'nyanluna','ruins-lens');const before=HEROES.map(h=>combatStats(p,h));
 roll(p,0,.99);assert.equal(combatStats(p,HEROES[0]).attack,before[0].attack*1.4);assert.deepEqual(combatStats(p,HEROES[1]),before[1]);assert.deepEqual(combatStats(p,HEROES[2]),before[2]);assert.equal(p.equipment.loadout.nyanluna,'ruins-lens');
 const lower=roll(p,0,.1);assert.equal(lower.upgraded,false);assert.equal(lower.duplicate,false);assert.equal(equippedWeapon(p,'nyanluna').rarity.rank,4);
 const g=new Adventure({progression:p});assert.equal(g.statsFor(0).attack,combatStats(p,HEROES[0]).attack);g.rng=()=>1;const e=g.spawnEnemy('boss',0,5);g.attackFrom(g.player,0);assert.equal(g.projectiles[0].damage,g.statsFor(0).attack);assert.equal(g.skillDamage('nyanluna',10),10*g.statsFor(0).attack/HEROES[0].damage*HEROES[0].skillPower);
});
test('all three characters can wear any relic, with one slot each and one wearer per physical item',()=>{
 const e=normalizeEquipment({owned:['meadow-charm','dawn-seal'],loadout:{}});
 for(const hero of HEROES){assert.equal(equipUnique(e,hero.id,'meadow-charm',{transfer:true}),true);assert.deepEqual(Object.entries(e.loadout),[[hero.id,'meadow-charm']]);assert.equal(equipUnique(e,hero.id,'dawn-seal'),true);assert.equal(e.loadout[hero.id],'dawn-seal');assert.equal(equipUnique(e,hero.id,''),true);}
 equipUnique(e,'nyanluna','meadow-charm');assert.equal(equipUnique(e,'tsukineko','meadow-charm'),false);equipUnique(e,'tsukineko','meadow-charm',{transfer:true});assert.equal(e.loadout.nyanluna,undefined);assert.equal(e.loadout.tsukineko,'meadow-charm');
});
test('every boss including elite has a 5% ticket drop, regular enemies, living bosses and training do not',()=>{
 assert.equal(WEAPON_TICKET_DROP_RATE,.05);
 for(const elite of [false,true])for(const [rng,expected] of [[0,1],[.049999,1],[.05,0],[.99,0]]){const p=fresh();assert.equal(bossWeaponTicket(p,{type:'boss',hp:0,elite},()=>rng),expected);assert.equal(p.inventory.weaponTicket,expected);}
 for(const e of [{type:'moss',hp:0},{type:'boss',hp:1},{type:'boss',hp:0,training:true}])assert.equal(bossWeaponTicket(fresh(),e,()=>{throw Error('ineligible enemy rolled');}),0);
});
test('actual boss kills award once, attribute to the run, persist through defeat and do not perturb combat RNG',()=>{
 const g=quiet(),random=seededRandom(27);g.lootRng=()=>0;const e=g.spawnEnemy('boss',8,8);random(); // spawn consumes one attack timer roll
 g.hit(e,99999,0,0);assert.equal(g.earnedWeaponTickets,1);assert.equal(g.progression.inventory.weaponTicket,1);assert.equal(g.rng(),random());g.hit(e,99999,0,0);assert.equal(g.earnedWeaponTickets,1);assert.equal(g.drainEvents().filter(e=>e.type==='weaponTicket').length,1);
 g.player.invincible=0;g.hurt(99999,0,0);assert.equal(g.phase,'defeat');const saved=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);assert.equal(saved.inventory.weaponTicket,1);const late=g.spawnEnemy('boss',8,8);g.hit(late,99999,0,0);assert.equal(g.progression.inventory.weaponTicket,1);
});
test('every chapter boss and strong-route boss can grant a ticket without needing the final gate',()=>{
 for(let act=0;act<8;act++)for(const elite of [false,true]){const g=quiet({act,progression:{story:{version:2,actClears:Array(8).fill(true)}}});g.lootRng=()=>0;const e=g.spawnEnemy('boss',10,10,{elite});g.hit(e,99999,0,0);assert.equal(g.progression.inventory.weaponTicket,1);assert.notEqual(g.phase,'victory');assert.equal(new Adventure({progression:g.progression}).progression.inventory.weaponTicket,1);}
});
test('gacha descriptions expose exact odds, locked-character storage and duplicate values using existing weapon art',()=>{
 const p=fresh(),html=weaponGachaView(p);assert.match(html,/5%で1枚/);assert.match(html,/75%/);assert.match(html,/20%/);assert.match(html,/約1.67%/);assert.match(html,/同じキャラ・同じレア度/);assert.match(html,/data-draw-weapon disabled/);for(const id of WEAPON_HERO_IDS)assert.ok(html.includes(`data-weapon-hero="${id}"`));
 p.inventory.weaponTicket=1;const r=roll(p,.8,.99),result=weaponDrawResult(r,p,true);assert.match(result,/加入後に使えるよう保管/);assert.match(result,/★4/);assert.match(result,/結果を保存/);assert.equal(WEAPON_CATALOG.length,12);
});
