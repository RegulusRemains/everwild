'use strict';const assert=require('node:assert/strict'),path=require('node:path');
async function runCharacterChecks(page,output){
 const context=await page.context().browser().newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(new URL('/',page.url()).href);await p.waitForFunction(()=>Boolean(window.everwild));
  await p.waitForSelector('#new-character-name');assert.equal(await p.locator('[data-action="choose-class"]').count(),3);
  await p.screenshot({path:path.join(output,'character-create-desktop.png')});
  await p.fill('#new-character-name','Aster');await p.click('[data-action="create-character"]');
  assert.equal(await p.evaluate(()=>window.everwild.game.player.classId),'magician');
  await p.evaluate(()=>{const g=window.everwild.game;g.player.gold=77;g._loot('worn-linen-robe');window.everwild.save();window.everwild.openMenu('characters');});
  await p.click('[data-action="new-character"]');await p.click('[data-class="necromancer"]');await p.fill('#new-character-name','Morrow');await p.click('[data-action="create-character"]');
  assert.deepEqual(await p.evaluate(()=>{const g=window.everwild.game;return[g.player.name,g.player.classId,g.player.gold,g.player.maxHp,g.spells[1].name];}),['Morrow','necromancer',0,92,'Siphon Life']);
  await p.click('#spell0');await p.waitForFunction(()=>window.everwild.game.pet?.name==='Boneguard');
  assert.equal(await p.evaluate(()=>window.everwild.audioState.enabled),true);assert.ok(await p.evaluate(()=>window.everwild.audioState.voices>=6));
  await p.screenshot({path:path.join(output,'necromancer-companion-desktop.png')});
  await p.evaluate(()=>window.everwild.openMenu('characters'));await p.click('[data-action="new-character"]');await p.click('[data-class="druid"]');await p.setViewportSize({width:390,height:844});
  await p.screenshot({path:path.join(output,'character-create-phone.png')});await p.fill('#new-character-name','Briar');await p.click('[data-action="create-character"]');await p.click('#spell0');await p.waitForFunction(()=>window.everwild.game.pet?.name==='Briar Stag');
  assert.equal(await p.evaluate(()=>window.everwild.game.spells[3].name),'Entangling Roots');await p.screenshot({path:path.join(output,'druid-companion-phone.png')});
  await p.reload();await p.waitForSelector('[data-action="enter-character"]');assert.equal(await p.locator('.roster-character').count(),3);
  await p.locator('.roster-character').filter({hasText:'Aster'}).click();await p.click('[data-action="enter-character"]');
  assert.deepEqual(await p.evaluate(()=>{const g=window.everwild.game;return[g.player.name,g.player.gold,g.player.inventory.includes('worn-linen-robe')];}),['Aster',77,true]);
  await p.evaluate(()=>window.everwild.openMenu('characters'));await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:path.join(output,'character-select-desktop.png')});
  await p.locator('.roster-character').filter({hasText:'Morrow'}).click();await p.click('[data-action="enter-character"]');assert.equal(await p.evaluate(()=>window.everwild.game.player.classId),'necromancer');
  await p.evaluate(()=>window.everwild.openMenu('spellbook'));assert.match(await p.locator('#dialog-content').textContent(),/Siphon Life/);assert.doesNotMatch(await p.locator('#dialog-content').textContent(),/Fire Bolt/);await p.click('#dialog-close');
  const sound=await p.evaluate(async()=>{
   const samples=[];for(const kind of ['bolt','summon','nova','impact','battle']){const c=new OfflineAudioContext(2,96000,48000),s=new window.Everwild.Soundscape(c,.65);for(const effect of (kind==='battle'?['bolt','summon','nova','impact','heal']:[kind]))s.play({kind:effect,school:'necromancer',spellIndex:1,source:'enemy'});const b=await c.startRendering(),d=b.getChannelData(0);let peak=0,power=0;for(const v of d){peak=Math.max(peak,Math.abs(v));power+=v*v;}samples.push({kind,peak,rms:Math.sqrt(power/d.length),voices:s.voicesCreated});}return samples;
  });
  for(const s of sound){assert.ok(s.voices>=3,'layered sound '+s.kind);assert.ok(s.rms>.005&&s.peak<1,'audible, unclipped output '+JSON.stringify(s));}
  const legacyContext=await page.context().browser().newContext();
  try{const legacy=await legacyContext.newPage();await legacy.addInitScript(()=>{localStorage.setItem('everwild_save',JSON.stringify({version:'0.8.0',player:{level:5,gold:123,inventory:['griks-lucky-charm'],equipment:{charm:'griks-lucky-charm'}}}));});await legacy.goto(new URL('/',page.url()).href);await legacy.waitForSelector('[data-action="enter-character"]');assert.equal(await legacy.locator('.roster-character').count(),1);await legacy.click('[data-action="enter-character"]');assert.deepEqual(await legacy.evaluate(()=>{const g=window.everwild.game;return[g.player.classId,g.player.level,g.player.gold,g.player.equipment.charm];}),['magician',5,123,'griks-lucky-charm']);}finally{await legacyContext.close();}
  assert.deepEqual(errors,[]);console.log('Character/audio review passed: create/select/reload three independent characters, class-specific spells and companions, desktop/phone screens, layered unclipped offline audio.');
 }finally{await context.close();}
}
module.exports={runCharacterChecks};
