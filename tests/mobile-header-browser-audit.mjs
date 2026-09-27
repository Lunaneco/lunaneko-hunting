import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const engine=process.env.MOBILE_BROWSER||'chromium';
const base=process.env.LUNARIA_URL||'http://127.0.0.1:5185/';
const out=process.env.MOBILE_AUDIT_OUT||'audit/mobile-safe-area';
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const cases=[
  {name:'small-phone',width:320,height:568,top:0,bottom:0,left:0,right:0},
  {name:'android',width:360,height:640,top:24,bottom:0,left:0,right:0},
  {name:'iphone-notch',width:390,height:844,top:47,bottom:34,left:0,right:0},
  {name:'iphone15-standalone',width:393,height:852,top:59,bottom:34,left:0,right:0},
  {name:'iphone15-browser-bars',width:393,height:659,top:0,bottom:0,left:0,right:0},
  {name:'short-standalone',width:375,height:568,top:59,bottom:34,left:0,right:0},
  {name:'landscape-left',width:852,height:393,top:0,bottom:21,left:59,right:0},
  {name:'landscape-right',width:852,height:393,top:0,bottom:21,left:0,right:59},
  {name:'tall-centered-menu',width:600,height:1400,top:59,bottom:34,left:0,right:0},
];
const errors=[],report=[];
await mkdir(out,{recursive:true});
try{
  const context=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
    localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,voice:false,music:false,motion:false,quality:'low'}));
    localStorage.setItem('lunaria-progression-v1',JSON.stringify({tutorial:{firstBattleCompleted:true},story:{version:2,tsukinekoUnlocked:true}}));
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'),'default');
  await page.locator('#start').tap();
  for(const fixture of cases){
    await page.setViewportSize({width:fixture.width,height:fixture.height});
    // Desktop browser runners do not expose real hardware safe areas. Reserve
    // that screen space explicitly, then test actual touch input outside it.
    await page.evaluate(area=>{
      document.querySelector('#chapter-menu').scrollTop=0;
      for(const side of ['top','bottom','left','right'])document.documentElement.style.setProperty(`--viewport-safe-${side}`,`${area[side]}px`);
    },fixture);
    const buttons=['#menu-title','.journey-tools [data-open="settings"]'];
    const positions=[];
    for(const selector of buttons){
      const button=page.locator(selector),box=await button.boundingBox();
      assert.ok(box.y>=fixture.top+32,`${fixture.name}: ${selector} is too close to the status bar`);
      assert.ok(box.x>=fixture.left+16&&box.x+box.width<=fixture.width-fixture.right-16,`${fixture.name}: ${selector} overlaps a side cutout`);
      assert.ok(box.width>=48&&box.height>=48,`${fixture.name}: touch target is too small`);
      assert.ok(box.y+box.height<=fixture.height);
      assert.equal(await button.evaluate(el=>{
        const r=el.getBoundingClientRect();
        return [[.5,.5],[.15,.15],[.85,.85]].every(([x,y])=>el.contains(document.elementFromPoint(r.x+r.width*x,r.y+r.height*y)));
      }),true,`${fixture.name}: another element blocks the button`);
      positions.push({selector,...box});
    }
    assert.equal(await page.locator('#chapter-menu').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
    const menu=await page.locator('#chapter-menu').boundingBox(),shell=await page.locator('.chapter-shell').boundingBox();
    assert.equal(menu.height,fixture.height,'Menu fills the viewport without a bottom gap');
    const centeredTop=fixture.top+Math.max(0,(fixture.height-fixture.top-fixture.bottom-shell.height)/2);
    assert.ok(Math.abs(shell.y-centeredTop)<1,'Short menus are centered inside the safe area; long menus start below it');
    const canvas=await page.locator('#scene').boundingBox();assert.equal(canvas.height,menu.height,'Canvas and menu use the same viewport');
    await page.locator('.journey-footer').scrollIntoViewIfNeeded();
    const footer=await page.locator('.journey-footer').boundingBox();
    assert.ok(footer.y+footer.height<=fixture.height-fixture.bottom+1,'Footer can scroll clear of the home indicator');
    await page.locator('#chapter-menu').evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:`${out}/${engine}-${fixture.name}.png`});
    await page.locator(buttons[1]).tap({position:{x:8,y:8}});
    await page.waitForSelector('#setting-sound',{state:'visible'});
    const modal=await page.locator('#modal').boundingBox();
    assert.ok(modal.y>=fixture.top&&modal.y+modal.height<=fixture.height-fixture.bottom+1,'Settings stay inside the safe area');
    await page.locator('#modal .dialog-close').tap();
    await page.locator(buttons[0]).tap({position:{x:8,y:8}});
    assert.equal(await page.locator('#home').isVisible(),true);
    await page.locator('#start').tap();
    report.push({fixture,positions});
    console.log(`PASS ${engine} ${fixture.name}: safe-area clearance, viewport fill, centering, scrolling and touch navigation`);
  }
  await page.locator('[data-act="0"]').tap();
  await page.locator('#chapter-start').tap();await page.locator('#story-skip').tap();
  await page.waitForSelector('#hud:not(.hidden)');
  for(const fixture of cases.filter(f=>f.name.startsWith('iphone15')||f.name.startsWith('landscape'))){
    await page.setViewportSize({width:fixture.width,height:fixture.height});
    await page.evaluate(area=>{
      for(const side of ['top','bottom','left','right'])document.documentElement.style.setProperty(`--viewport-safe-${side}`,`${area[side]}px`);
    },fixture);
    const hud=await page.locator('#hud').boundingBox(),canvas=await page.locator('#scene').boundingBox();
    assert.deepEqual(hud,canvas,'Battle controls and rendering fill the same viewport');
    const pause=await page.locator('#pause').boundingBox();
    assert.ok(pause.y>=fixture.top+12&&pause.x+pause.width<=fixture.width-fixture.right-15);
    assert.ok(pause.width>=44&&pause.height>=44);
    for(const selector of ['#dash','#ultimate','#switch-action']){
      const box=await page.locator(selector).boundingBox();
      assert.ok(box.x>=fixture.left&&box.x+box.width<=fixture.width-fixture.right);
      assert.ok(box.y>=fixture.top&&box.y+box.height<=fixture.height-fixture.bottom);
    }
    await page.screenshot({path:`${out}/${engine}-battle-${fixture.name}.png`});
    await page.locator('#pause').tap({position:{x:8,y:8}});
    await page.waitForSelector('#resume');await page.locator('#resume').tap();
    console.log(`PASS ${engine} battle ${fixture.name}: viewport alignment, safe controls and pause/resume touch input`);
  }
  assert.deepEqual(errors,[]);await writeFile(`${out}/${engine}-report.json`,JSON.stringify({base,errors,cases:report},null,2));
  await context.close();
}finally{await browser.close();}
