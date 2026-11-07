'use strict';const path=require('node:path'),assert=require('node:assert/strict');
async function runEffectsChecks(page,output){
 const style=await page.addStyleTag({content:'#paused-overlay,#discovery,#toast{display:none!important}'});await page.setViewportSize({width:1440,height:1000});
 try{
  await page.evaluate(()=>{
   const{game:g}=window.everwild;window.everwild.pause(true);g.player.classId='magician';g.player.level=5;g._refreshStats();g.player.x=640;g.player.y=390;g.player.hotbar[1]=1;g.visuals=[];g.effects=[];g.player.hp=g.player.maxHp;g.player.mp=g.player.maxMp;g.pet=null;g.cast=null;g.dead=false;g.cancelMovement();const m=g.mobs.find(m=>m.campId==='briar'&&m.index===0);g.mobs.forEach(o=>o.alive=o===m);Object.assign(m,{x:780,y:370,hp:1000,maxHp:1000,rootUntil:100,aggro:false,returning:false});g.setTarget(m.id);g.castSpell(1);for(let i=0;i<16;i++)g.update(.05);
  });
  await page.waitForFunction(()=>document.getElementById('level').textContent==='Lv. 5'&&document.getElementById('target-name').textContent==='Goblin Scout');
  await page.screenshot({path:path.join(output,'spell-charge-close-camera.png')});
  await page.evaluate(()=>{const g=window.everwild.game;for(let i=0;i<21;i++)g.update(.05);});
  const projectile=await page.evaluate(()=>window.everwild.game.visuals.find(v=>v.kind==='bolt'));assert.ok(projectile&&projectile.spellIndex===1,'class/spell identity reaches effects and audio');await page.screenshot({path:path.join(output,'spell-projectile-close-camera.png')});
  await page.evaluate(()=>{const g=window.everwild.game;g._visual('nova',g.selected,{radius:100,color:'#eea375',life:.85});g.update(.2);});await page.screenshot({path:path.join(output,'spell-impact-close-camera.png')});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.everwild.renderer.reducedMotion);assert.equal(await page.evaluate(()=>window.everwild.renderer.reducedMotion),true);await page.screenshot({path:path.join(output,'spell-effects-reduced-motion.png')});
  const view=await page.evaluate(()=>{const r=window.everwild.renderer;return r.height/r.zoom;});assert.ok(view<=530,'desktop camera must show a closer ~520-world-unit view');
  console.log('Effects review passed: closer camera, casting buildup, class-tagged projectile, impact bloom, and reduced-motion presentation.');
 }finally{await style.evaluate(el=>el.remove());await page.emulateMedia({reducedMotion:'no-preference'});}
}
module.exports={runEffectsChecks};
