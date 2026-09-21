import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.AUDIT_URL??'http://127.0.0.1:4175/';
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 await context.addInitScript(()=>{
  window.__cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__cspViolations.push(e.effectiveDirective));
  if(!sessionStorage.getItem('security-fixture')){
   const attack='<img src=x onerror="window.__storedXss=1">';
   localStorage.setItem('lunaria-progression-v1',JSON.stringify({characters:{nyanluna:{level:20,xp:111,breaks:0,tree:[attack]},tsukineko:{level:3,xp:9}},inventory:{starBud:12},story:{version:2,actClears:[true,true,true,true]},tutorial:{firstBattleCompleted:true}}));
   localStorage.setItem('lunaria-record-v1',JSON.stringify({best:attack,runs:attack}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:attack,sound:false,music:false}));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:[attack,'nyanluna','tsukineko'],lead:attack}));sessionStorage.setItem('security-fixture','1');
  }
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 const headers=response.headers();assert.match(headers['content-security-policy'],/frame-ancestors 'none'/);assert.equal(headers['x-content-type-options'],'nosniff');assert.equal(headers['x-frame-options'],'DENY');assert.equal(headers['referrer-policy'],'no-referrer');assert.match(headers['permissions-policy'],/camera=\(\)/);
 assert.match(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),/script-src 'self'/);assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');assert.equal(await page.evaluate(()=>window.__cspViolations.length),0);pass('Production loads all assets under CSP, security headers are present and the dev bridge is absent');
 await page.click('#chapter-menu-open');await page.click('[data-menu-tab="growth"]');assert.equal(await page.locator('#growth-nyanluna .growth-level b').innerText(),'20');assert.match(await page.locator('#growth-nyanluna .growth-exp').innerText(),/111/);assert.equal(await page.locator('img[onerror]').count(),0);assert.equal(await page.evaluate(()=>window.__storedXss),undefined);pass('Tampered local save strings do not become HTML; valid stored level and XP remain intact');
 await page.click('[data-menu-tab="adventure"]');await page.click('[data-chapter="0"]');await page.click('[data-act="0"]');await page.click('#chapter-start');await page.click('#story-skip');await page.waitForTimeout(1200);assert.ok(await page.locator('#timer').innerText()!=='00:00');await page.click('#pause');await page.click('#quit');assert.deepEqual(await page.evaluate(()=>window.__cspViolations),[]);pass('Story, 3D combat, HUD and pause work without a policy violation');
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForSelector('#loading',{state:'detached'});assert.ok(await page.evaluate(()=>navigator.serviceWorker.controller));await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#loading',{state:'detached'});assert.equal(await page.locator('#start').isVisible(),true);await context.setOffline(false);pass('The secured build also boots from its own offline cache');
 await page.evaluate(()=>{
  const inline=document.createElement('script');inline.textContent='window.__inlineXss=1';document.body.append(inline);
  const external=document.createElement('script');external.src='https://security-probe.invalid/probe.js';document.body.append(external);
  const base=document.createElement('base');base.href='https://security-probe.invalid/';document.head.append(base);
  fetch('https://security-probe.invalid/probe').catch(()=>{});
 });
 await page.waitForTimeout(100);const blocked=await page.evaluate(()=>({inline:window.__inlineXss,violations:window.__cspViolations,base:document.baseURI}));assert.equal(blocked.inline,undefined);assert.ok(blocked.violations.includes('script-src-elem'));assert.ok(blocked.violations.includes('connect-src'));assert.ok(blocked.violations.includes('base-uri'));assert.ok(blocked.base.startsWith(url));pass('CSP blocks injected inline/external scripts, third-party connections and base URL changes',{violations:blocked.violations});
 const dev='http://127.0.0.1:5174';const forbidden=['/.git/config','/audit/model-swap/nyanluna-export.json','/backups/security-base-20260921/README.md','/models/SOURCE_REFERENCE/nyanluna.blend','/docs/LOCAL-DEVELOPMENT-HISTORY.md'];
 const statuses=[];for(const path of forbidden){const r=await fetch(dev+path);statuses.push({path,status:r.status});assert.equal(r.status,403);await r.arrayBuffer();}
 const model=await fetch(dev+'/assets/models/nyanluna.glb');assert.equal(model.status,200);await model.arrayBuffer();pass('Dev server denies private files while allowing the public runtime model',{statuses});
 assert.deepEqual(errors,[]);await mkdir('audit/security',{recursive:true});await writeFile('audit/security/browser.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
