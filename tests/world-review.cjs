'use strict';
// Staged visual and canopy-transition checks, separate from real progression tests.
const assert=require('node:assert/strict');
const path=require('node:path');
async function runWorldChecks(page,output){
 const stagingStyle=await page.addStyleTag({content:'#paused-overlay{display:none!important}'});
 await page.setViewportSize({width:1920,height:1080});
 await page.waitForFunction(()=>window.everwild.renderer.frontierLoaded&&window.everwild.renderer.frontierFloorLoaded);
 const canopy=await page.evaluate(()=>{
  const {game:g,renderer:r}=window.everwild;window.everwild.pause(true);document.getElementById('paused-overlay').hidden=true;g.pet=null;g.selectedId=null;
  const tree=r.trees.find(t=>t.x>500&&t.x<1500&&t.y>400);g.player.x=tree.x;g.player.y=tree.y-68*tree.scale;
  tree.alpha=1;r.lastFrameTime=performance.now()/1000-1/60;r.draw(g);const first=tree.alpha;
  for(let i=0;i<40;i++){r.lastFrameTime=performance.now()/1000-1/60;r.draw(g);}const faded=tree.alpha;
  g.player.x=tree.x+130*tree.scale;r.lastFrameTime=performance.now()/1000-1/60;r.draw(g);const returning=tree.alpha;
  for(let i=0;i<80;i++){r.lastFrameTime=performance.now()/1000-1/60;r.draw(g);}const opaque=tree.alpha;
  const m=g.mobs.find(m=>m.alive);m.x=tree.x;m.y=tree.y-68*tree.scale;r.lastFrameTime=performance.now()/1000-1/60;r.draw(g);
  return{first,faded,returning,opaque,monsterOnly:tree.alpha,counts:r.trees.reduce((a,t)=>(a[t.biome]=(a[t.biome]||0)+1,a),{})};
 });
 assert.ok(canopy.first>.85&&canopy.first<1,'first overlap frame must fade gradually');assert.ok(canopy.faded>=.25&&canopy.faded<.3,'tree remains readable behind the party');assert.ok(canopy.returning>canopy.faded&&canopy.returning<.5,'leaving the canopy must recover gradually');assert.ok(canopy.opaque>.98);assert.ok(canopy.monsterOnly>.98,'ordinary monsters must not fade trees');assert.equal(Object.keys(canopy.counts).length,5);
 for(const id of ['amber-den','lantern-shrine','rime-spire','cinder-forge']){
  for(const [width,height] of [[1440,1000],[390,844]]){
   await page.setViewportSize({width,height});
   await page.evaluate(id=>{const {game:g,renderer:r}=window.everwild,c=window.Everwild.CAMPS.find(c=>c.id===id);g.player.x=c.x-100;g.player.y=c.y+90;g.player.level=c.level+1;g._refreshStats();g.player.hp=g.player.maxHp;g.player.mp=g.player.maxMp;g.cancelMovement();g.selectedId=g.mobs.find(m=>m.campId===id&&m.named).id;r.draw(g);},id);
   await page.waitForTimeout(160);await page.screenshot({path:path.join(output,`frontier-${id}-${width}.png`)});
   const coords=await page.evaluate(()=>{const {game:g,renderer:r}=window.everwild,p=r.worldToScreen(g.player.x,g.player.y);return{x:p.x,y:p.y,w:r.width,h:r.height};});assert.ok(coords.x>0&&coords.x<coords.w&&coords.y>0&&coords.y<coords.h,'party stays visible in new regions');
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{const {game:g}=window.everwild;for(const c of window.Everwild.CAMPS)if(!g.discovered.includes(c.id))g.discovered.push(c.id);window.everwild.openMenu('map');});await page.screenshot({path:path.join(output,'frontier-map.png')});
 await page.click('#dialog-close');await page.evaluate(()=>{const {game:g}=window.everwild;for(const c of window.Everwild.CAMPS.filter(c=>c.biome))g._loot(c.rareItemId);window.everwild.openMenu('inventory');});
 assert.equal(await page.locator('.item-card .frontier-art').count(),4);await page.screenshot({path:path.join(output,'frontier-loot.png')});await page.click('#dialog-close');
 await stagingStyle.evaluate(el=>el.remove());
 console.log('World review passed: smooth canopy entry/recovery, no monster-induced tree fading, all five habitats, four camp desktop/mobile scenes, map and rare loot artwork.');
}
module.exports={runWorldChecks};
