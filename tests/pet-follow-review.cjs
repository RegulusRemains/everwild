'use strict';const assert=require('node:assert/strict'),path=require('node:path');
async function runPetFollowChecks(page,output){
 await require('./browser-helpers.cjs').enterCharacter(page);await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{const g=window.everwild.game;g.player.x=800;g.player.y=1600;g.dead=false;g.cast=null;g.cancelMovement();g.mobs.forEach(m=>m.alive=false);g._summon('Earth',1);g.commandPet('follow');window.everwild.pause(false);});
 try{
  await page.keyboard.down('d');await page.waitForFunction(()=>window.everwild.game.player.x>1000);await page.keyboard.up('d');
  let position=await page.evaluate(()=>{const g=window.everwild.game;return{gap:g.player.x-g.pet.x,y:g.player.y};});assert.ok(position.gap>55,'pet trails the player during keyboard movement');
  await page.screenshot({path:path.join(output,'pet-trailing-desktop.png')});
  await page.keyboard.down('w');await page.waitForFunction(y=>window.everwild.game.player.y<y-110,position.y);await page.keyboard.up('w');
  assert.ok(await page.evaluate(()=>{const g=window.everwild.game;return g.pet.y-g.player.y>45;}),'turning changes the trailing direction');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'pet-trailing-phone.png')});
  await page.waitForFunction(()=>!window.everwild.game.pet.following);const rest=await page.evaluate(()=>{const p=window.everwild.game.pet;return{x:p.x,y:p.y};});await page.waitForTimeout(450);
  const drift=await page.evaluate(rest=>{const g=window.everwild.game;return{movement:Math.hypot(g.pet.x-rest.x,g.pet.y-rest.y),gap:Math.hypot(g.pet.x-g.player.x,g.pet.y-g.player.y)};},rest);assert.ok(drift.movement<1&&drift.gap>45&&drift.gap<100,'idle companion rests nearby without jitter or overlap');
  console.log('Pet follow review passed: real keyboard travel, directional trailing, natural stopping, desktop and phone.');
 }finally{await page.keyboard.up('d');await page.keyboard.up('w');}
}
module.exports={runPetFollowChecks};
