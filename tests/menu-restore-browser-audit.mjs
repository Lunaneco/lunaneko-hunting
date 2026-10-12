import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.LUNARIA_URL||'http://127.0.0.1:5199/';
const out='audit/menu-restore',errors=[],checks=[];
const preferred={members:['nyanluna','shizuku'],lead:'shizuku'};
const progression={story:{version:2,actClears:Array.from({length:20},(_,i)=>i<16)},tutorial:{firstBattleCompleted:true}};
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const ready=page=>page.waitForSelector('#loading',{state:'detached',timeout:90000});
const savedParty=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')));
const savedAct=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-menu-selection-v1'))?.act);
const selectedChapter=page=>page.locator('[data-chapter][aria-pressed="true"]').getAttribute('data-chapter');
const pass=name=>{checks.push(name);console.log('PASS',name);};
async function open(state,seed={progression,preferred}){
  const context=await browser.newContext({viewport:{width:1280,height:900},storageState:state,serviceWorkers:'block'});
  if(!state)await context.addInitScript(({progression,preferred})=>{
    if(sessionStorage.getItem('menu-restore-seeded'))return;
    localStorage.setItem('lunaria-progression-v1',JSON.stringify(progression));
    localStorage.setItem('lunaria-party-v1',JSON.stringify(preferred));
    localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));
    sessionStorage.setItem('menu-restore-seeded','1');
  },seed);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  return {context,page};
}
try{
  let {context,page}=await open();
  await page.click('#start');
  assert.equal(await selectedChapter(page),'3','A legacy chapter-four clear must not select chapter five');
  assert.deepEqual(await savedParty(page),preferred,'Opening the menu must not overwrite the saved party');
  await page.click('#menu-party-open');
  assert.equal(await page.locator('[data-party-lead="4"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.party-required-note').count(),0);
  await page.click('#modal [data-close].primary');
  pass('Legacy chapter-four clear opens chapter four with the original members and lead');

  await page.click('[data-act="14"]');await page.click('.brief-back');
  assert.equal(await savedAct(page),14);
  await page.reload();await ready(page);await page.click('#start');
  assert.equal(await selectedChapter(page),'3');assert.equal(await savedAct(page),14);
  assert.deepEqual(await savedParty(page),preferred);
  await page.click('[data-chapter="1"]');await page.click('[data-act="5"]');await page.click('.brief-back');
  const state=await context.storageState();await context.close();
  ({context,page}=await open(state));await page.click('#start');
  assert.equal(await selectedChapter(page),'1');assert.equal(await savedAct(page),5);
  assert.deepEqual(await savedParty(page),preferred);
  pass('Both reload and a fresh browser context restore the explicitly selected earlier chapter and act');

  await page.click('[data-chapter="4"]');await page.click('#menu-party-open');
  assert.equal(await page.locator('[data-party-toggle="tsukineko"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-party-lead="1"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await savedParty(page),preferred);
  // Disabled controls must also be harmless if invoked programmatically.
  await page.locator('[data-party-toggle="nyanluna"]').evaluate(el=>{el.disabled=false;el.click();});
  assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),true);
  await page.locator('[data-party-lead="1"]').evaluate(el=>{el.disabled=false;el.click();});
  assert.deepEqual(await savedParty(page),preferred);
  await page.click('#modal [data-close].primary');
  await page.reload();await ready(page);await page.click('#start');
  assert.equal(await selectedChapter(page),'4','An explicitly selected chapter five is retained');
  assert.deepEqual(await savedParty(page),preferred);
  await page.click('[data-act="16"]');await page.click('#chapter-start');await page.click('#story-skip');
  assert.equal(await page.locator('#hero-name').innerText(),'つきねこ');
  assert.equal(await page.locator('#switch-action').isVisible(),false);
  assert.deepEqual(await savedParty(page),preferred);
  await page.click('#pause');await page.click('#quit');
  await page.click('[data-chapter="3"]');await page.click('#menu-party-open');
  assert.equal(await page.locator('[data-party-toggle="nyanluna"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-party-toggle="shizuku"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-party-lead="4"]').getAttribute('aria-pressed'),'true');
  pass('Chapter-five preview, reload and actual solo battle never overwrite the regular party; returning restores the lead');

  await page.click('[data-party-toggle="nyanluna"]');await page.click('[data-party-toggle="mochinyafe"]');
  await page.click('[data-party-lead="3"]');
  const edited={members:['shizuku','mochinyafe'],lead:'mochinyafe'};
  assert.deepEqual(await savedParty(page),edited);await page.click('#modal [data-close].primary');
  await page.reload();await ready(page);await page.click('#start');
  assert.equal(await selectedChapter(page),'3');assert.deepEqual(await savedParty(page),edited);
  await page.click('[data-act="15"]');await page.click('#chapter-start');await page.click('#story-skip');
  assert.equal(await page.locator('#hero-name').innerText(),'もちにゃふぇ');
  assert.equal(await page.locator('#partner-name').innerText(),'雫');
  if(await page.evaluate(()=>!!window.__LUNARIA_TEST__)){
    await page.evaluate(()=>{
      const t=window.__LUNARIA_TEST__,g=t.game;
      g.enemies=[];g.projectiles=[];g.hazards=[];g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;
      Object.assign(g.player,g.exitPoint);g.crossExit();t.step(1/60);
    });
    await page.click('#story-skip');
    assert.equal(await selectedChapter(page),'3');assert.equal(await savedAct(page),15);
    assert.deepEqual(await savedParty(page),edited);
    await page.reload();await ready(page);await page.click('#start');
    assert.equal(await selectedChapter(page),'3');assert.deepEqual(await savedParty(page),edited);
    pass('Clearing chapter four keeps chapter four selected immediately and after reload');
  }else{await page.click('#pause');await page.click('#quit');}
  pass('Explicit party edits persist and deploy with the chosen lead and support');
  await page.screenshot({path:`${out}/restored-menu.png`});
  assert.deepEqual(errors,[]);await context.close();

  const beforeClear={members:['tsukineko','omsolo'],lead:'omsolo'};
  ({context,page}=await open(undefined,{preferred:beforeClear,progression:{...progression,story:{version:2,actClears:Array.from({length:20},(_,i)=>i<15)}}}));
  await page.click('#start');await page.click('[data-act="15"]');await page.click('.brief-back');
  await page.click('#menu-party-open');
  assert.equal(await page.locator('[data-party-toggle="nyanluna"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-party-lead="2"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await savedParty(page),beforeClear);
  await page.click('#modal [data-close].primary');
  await page.click('[data-act="15"]');await page.click('#chapter-start');await page.click('#story-skip');
  assert.equal(await page.locator('#hero-name').innerText(),'オムソロ');
  assert.equal(await page.locator('#partner-name').innerText(),'にゃんるな');
  if(await page.evaluate(()=>!!window.__LUNARIA_TEST__)){
    await page.evaluate(()=>{
      const t=window.__LUNARIA_TEST__,g=t.game;
      g.enemies=[];g.projectiles=[];g.hazards=[];g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;
      Object.assign(g.player,g.exitPoint);g.crossExit();t.step(1/60);
    });
    await page.click('#story-skip');
    assert.match(await page.locator('.recruitment-banner').innerText(),/雫が仲間/);
    assert.equal(await selectedChapter(page),'3');assert.equal(await savedAct(page),15);
    assert.deepEqual(await savedParty(page),beforeClear);
    await page.reload();await ready(page);await page.click('#start');await page.click('#menu-party-open');
    assert.equal(await selectedChapter(page),'3');
    assert.equal(await page.locator('.party-required-note').count(),0);
    assert.equal(await page.locator('[data-party-toggle="tsukineko"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[data-party-lead="2"]').getAttribute('aria-pressed'),'true');
    assert.deepEqual(await savedParty(page),beforeClear);
    pass('First chapter-four clear recruits Shizuku, releases its temporary party rule and stays in chapter four after reload');
  }else{await page.click('#pause');await page.click('#quit');}
  assert.deepEqual(errors,[]);await context.close();
}catch(e){errors.push(e.stack);throw e;}finally{
  await writeFile(`${out}/report.json`,JSON.stringify({base,checks,errors},null,2));await browser.close();
}
