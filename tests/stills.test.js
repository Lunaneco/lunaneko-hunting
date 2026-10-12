import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {STILL_CAST,STILL_UNLOCK_LEVELS,allStills,isStillUnlocked,stillById,stillsForHero} from '../src/stills.js';
import {stillsView} from '../src/stills-ui.js';

const profile=levels=>({characters:Object.fromEntries(Object.entries(levels).map(([id,level])=>[id,{level}]))});

test('stills unlock in order at Lv.30, Lv.50 and Lv.70, and the fourth shares Lv.70',()=>{
  assert.deepEqual(STILL_UNLOCK_LEVELS,[30,50,70,70]);
  const shizuku=stillsForHero('shizuku');
  assert.deepEqual(shizuku.map(still=>still.level),[30,50,70,70]);
  assert.deepEqual(shizuku.map(still=>still.mark),['①','②','③','④']);
  const save=profile({shizuku:29});
  assert.equal(isStillUnlocked(save,shizuku[0]),false);
  save.characters.shizuku.level=30;
  assert.equal(isStillUnlocked(save,shizuku[0]),true);
  assert.equal(isStillUnlocked(save,shizuku[1]),false);
  save.characters.shizuku.level=50;
  assert.equal(isStillUnlocked(save,shizuku[1]),true);
  assert.equal(isStillUnlocked(save,shizuku[2]),false);
  assert.equal(isStillUnlocked(save,shizuku[3]),false);
  save.characters.shizuku.level=69;
  assert.equal(isStillUnlocked(save,shizuku[2]),false);
  save.characters.shizuku.level=70;
  assert.equal(isStillUnlocked(save,shizuku[2]),true);
  assert.equal(isStillUnlocked(save,shizuku[3]),true);
});

test('each character owns the stills in the folder, and missing levels stay locked without changing the save',()=>{
  assert.deepEqual(STILL_CAST.map(hero=>[hero.id,stillsForHero(hero.id).length]),[
    ['nyanluna',3],['tsukineko',3],['omsolo',3],['mochinyafe',3],['shizuku',4],['prim',3],['heherial',3],['rumi',1],
  ]);
  const save=profile({nyanluna:1});
  const before=structuredClone(save);
  assert.equal(isStillUnlocked(save,stillById('rumi-1')),false);
  assert.equal(isStillUnlocked(save,stillById('heherial-2')),false);
  assert.equal(isStillUnlocked({characters:{rumi:{level:30}}},stillById('rumi-1')),true);
  assert.equal(isStillUnlocked({characters:{heherial:{level:70}}},stillById('heherial-3')),true);
  assert.equal(stillById('missing'),null);
  assert.deepEqual(save,before);
  for(const still of allStills())assert.equal(existsSync(new URL(`../public/${still.file}`,import.meta.url)),true,still.file);
});

test('the gallery shows an unlocked image and hides a locked file',()=>{
  const html=stillsView(profile({nyanluna:50,shizuku:70,rumi:29}));
  assert.match(html,/nyanluna-1\.jpg/);
  assert.match(html,/nyanluna-2\.png/);
  assert.doesNotMatch(html,/nyanluna-3\.jpg/);
  assert.match(html,/shizuku-4\.jpg/);
  assert.match(html,/まだ仲間ではありません/);
  assert.doesNotMatch(html,/rumi-1\.jpg/);
  assert.match(html,/data-still="rumi-1"/);
  assert.match(html,/Lv\.30/);
});
