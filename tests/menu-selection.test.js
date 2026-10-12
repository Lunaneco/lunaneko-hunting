import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTS,CHAPTERS,EXTRA_ACTS} from '../src/acts.js';
import {restoreSelectedAct,selectionAfterClear} from '../src/menu-selection.js';

const profile=clears=>({story:{actClears:ACTS.map(a=>a.id<clears)}});

test('legacy saves stay on the last cleared act instead of automatically entering the next chapter',()=>{
  for(let clears=0;clears<=ACTS.length;clears++){
    assert.equal(restoreSelectedAct(undefined,profile(clears)),Math.max(0,clears-1));
  }
  assert.equal(restoreSelectedAct({},profile(16)),15);
});

test('explicitly selected unlocked acts, including chapter five and extras, survive restore',()=>{
  const p=profile(16);
  for(const act of [...ACTS.slice(0,17),...EXTRA_ACTS]){
    assert.equal(restoreSelectedAct({act:act.id},p),act.id);
  }
  assert.equal(restoreSelectedAct({act:17},profile(17)),17);
});

test('corrupt or locked selections fall back safely without changing progress',()=>{
  const p=profile(16),original=structuredClone(p);
  for(const act of [-1,17,19,999,NaN,Infinity,'16',null,{},[],1.5]){
    assert.equal(restoreSelectedAct({act},p),15);
  }
  assert.equal(restoreSelectedAct({act:16},profile(0)),0);
  assert.deepEqual(p,original);
});

test('clear results advance within a chapter but never select a different chapter',()=>{
  for(const c of CHAPTERS)for(let act=c.start;act<=c.end;act++){
    assert.equal(selectionAfterClear(act),Math.min(c.end,act+1));
  }
  for(const act of EXTRA_ACTS)assert.equal(selectionAfterClear(act.id),act.id);
});
