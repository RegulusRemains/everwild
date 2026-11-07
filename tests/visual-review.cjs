'use strict';
// Explicitly staged art-review scenes, separate from the no-injection journey test.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs/promises');
const { runExpedition } = require('../scripts/expedition-run.cjs');
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '../node_modules','playwright'));
(async()=>{
  let browser, server;
  try {
    const probe=net.createServer(); probe.listen(0,'127.0.0.1');await once(probe,'listening'); const port=probe.address().port; await new Promise(r=>probe.close(r));
    server=spawn(process.execPath,['scripts/serve.mjs','--port',String(port)],{stdio:['ignore','pipe','pipe']});
    await new Promise((resolve,reject)=>{server.stdout.on('data',v=>{if(String(v).includes('Everwild is ready'))resolve();});server.once('error',reject);});
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addStyleTag({content:'#paused-overlay{display:none!important}'});
    const output=path.resolve('test-results/visual-review');await fs.mkdir(output,{recursive:true});
    await page.goto('http://127.0.0.1:'+port);await page.waitForFunction(()=>Boolean(window.everwild));
    assert.equal(await page.evaluate(()=>window.everwild.renderer.artReady),true);
    await page.screenshot({path:path.join(output,'01-willowmere-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(100);
    await page.screenshot({path:path.join(output,'02-willowmere-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    for (const campId of ['briar','mossfang','crypt','vigil']) {
      await page.evaluate(campId=>{
        const {game,renderer}=window.everwild, camp=window.Everwild.CAMPS.find(c=>c.id===campId);
        game.player.level=5; game._refreshStats(); game.player.hp=game.player.maxHp; game.player.mp=game.player.maxMp;
        Object.assign(game.player,{x:camp.x-50,y:camp.y+140});game.cancelMovement();game.cast=null;game.pet=null;
        for(const mob of game.mobs) {mob.aggro=false;mob.returning=false;mob.x=mob.homeX;mob.y=mob.homeY;mob.threatPet=mob.threatPlayer=0;mob.intent=null;}
        game.selectedId=game.mobs.find(m=>m.campId===campId&&m.named).id;
        if(!game.discovered.includes(campId))game.discovered.push(campId);
        renderer.draw(game);
      },campId);
      await page.waitForTimeout(120);
      await page.screenshot({path:path.join(output,'camp-'+campId+'-desktop.png'),fullPage:true});
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
      await page.screenshot({path:path.join(output,'camp-'+campId+'-mobile.png'),fullPage:true});
      await page.setViewportSize({width:1440,height:1000});
    }
    // Staged encounter: attacks, shield, active cast and a telegraph must coexist.
    await page.evaluate(()=>{
      const game=window.everwild.game;
      Object.assign(game.player,{x:710,y:620,level:5});game._refreshStats();game.player.hp=game.player.maxHp;game.player.mp=game.player.maxMp;
      for(const mob of game.mobs){mob.aggro=false;mob.returning=false;mob.x=mob.homeX;mob.y=mob.homeY;mob.intent=null;}
      game._summon('Earth',1);const target=game.mobs.find(m=>m.campId==='briar'&&m.named);
      game.setTarget(target.id);game.commandPet('attack');
      for(let i=0;i<80;i++)game.update(.05);
      game.castSpell(6); for(let i=0;i<25;i++)game.update(.05);
      game.castSpell(1);for(let i=0;i<12;i++)game.update(.05);
      window.everwild.renderer.draw(game);
    });
    // Freeze via the actual pause control, then hide only its visual veil for scene review.
    await page.evaluate(()=>window.everwild.pause(true));await page.locator('#paused-overlay').evaluate(el=>el.style.visibility='hidden');
    await page.screenshot({path:path.join(output,'combat-casting-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
    await page.screenshot({path:path.join(output,'combat-casting-mobile.png'),fullPage:true});
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.everwild.renderer.reducedMotion),true);
    assert.equal(await page.evaluate(()=>window.everwild.renderer._pose('player',window.everwild.game.player,window.everwild.game,window.everwild.game.clock)),null);
    await page.screenshot({path:path.join(output,'reduced-motion-mobile.png'),fullPage:true});
    // Staged clothing inspection checks actual tradeoff copy and four-slot layout.
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>{
      const game=window.everwild.game;
      for(const id of ['worn-linen-robe','waxed-travel-cloak','mosswoven-mantle','emberwoven-robe'])game._loot(id);
      game.equip('worn-linen-robe');window.everwild.openMenu('inventory');
    });
    await page.locator('[data-filter="garb"]').click();
    assert.equal(await page.locator('.item-card').count(),4);
    assert.ok((await page.locator('.comparison .loss').count())>0);
    assert.ok((await page.locator('.comparison .gain').count())>0);
    assert.equal((await page.locator('.item-stats').allTextContents()).some(text=>text.includes('+-')),false);
    await page.screenshot({path:path.join(output,'clothing-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
    assert.ok(await page.locator('#dialog-content').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    await page.screenshot({path:path.join(output,'clothing-mobile.png'),fullPage:true});
    // Load the save produced by the no-injection journey, rather than inventing
    // completed quest flags for the closing journal and villager reaction.
    const journey=runExpedition(42,'Earth',true,true);
    // A separate context imports the completed save before app initialization;
    // pagehide autosave on the staged scene must not overwrite that fixture.
    const completion=await browser.newPage({viewport:{width:390,height:844}});
    completion.on('pageerror',e=>errors.push(e.message));
    await completion.addInitScript(save=>localStorage.setItem('everwild_save',JSON.stringify(save)),journey.save);
    await completion.goto('http://127.0.0.1:'+port);await completion.waitForFunction(()=>Boolean(window.everwild));
    assert.equal(await completion.evaluate(()=>window.everwild.renderer.artReady),true);
    await completion.waitForFunction(()=>window.everwild.game.questState('crypt-proof').status==='completed');
    await completion.evaluate(()=>window.everwild.openMenu('journal'));
    assert.equal(await completion.locator('.completion-card').count(),1);
    await completion.screenshot({path:path.join(output,'completed-journal-mobile.png'),fullPage:true});
    await completion.setViewportSize({width:1440,height:1000});await completion.waitForTimeout(100);
    await completion.screenshot({path:path.join(output,'completed-journal-desktop.png'),fullPage:true});
    await completion.locator('#dialog-close').click();
    await completion.evaluate(()=>window.everwild.openMenu('npc:rowan'));
    assert.match(await completion.locator('.npc-dialogue').textContent(),/lanterns/);
    assert.equal(await completion.locator('.completion-card').count(),1);
    assert.deepEqual(errors,[]);
    console.log('Visual review passed: fresh village, four camps, combat, reduced motion, clothing tradeoffs, and completed-journey journal/NPC reaction at desktop/mobile sizes. Screenshots: '+output);
  } finally {if(browser)await browser.close();if(server)server.kill('SIGTERM');}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
