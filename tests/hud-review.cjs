'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');
async function runHudChecks(page, output) {
  await fs.mkdir(output,{recursive:true});
  // World/HUD must use the viewport, not a page column or a capped content width.
  for(const [width,height] of [[1280,720],[1920,1080],[2560,1440],[3840,2160],[5120,1440],[390,844],[844,390],[320,568]]) {
    await page.setViewportSize({width,height});
    await page.waitForFunction(({width,height})=>{
      const c=document.getElementById('game'),r=c.getBoundingClientRect(),view=window.everwild.renderer;
      return Math.abs(r.width-width)<1 && Math.abs(r.height-height)<1 && Math.abs(view.width-width)<1 && Math.abs(view.height-height)<1;
    },{width,height});
    const data=await page.evaluate(()=>{
      const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
      const view=window.everwild.renderer;
      return{canvas:rect('game'),bar:rect('actionbar'),scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight,zoom:view.zoom,worldW:window.Everwild.WORLD.w,worldH:window.Everwild.WORLD.h,legacy:document.querySelectorAll('.masthead,.sidebar,.objective,.area-heading,#tactical-tip,#minimap,.page-footer').length,castVisible:!document.getElementById('cast-readout').hidden,casting:Boolean(window.everwild.game.cast||window.everwild.game.meditate)};
    });
    assert.ok(data.scrollW<=width+1 && data.scrollH<=height+1,`${width}×${height}: no page scrolling`);
    assert.ok(data.bar.x>=0 && data.bar.right<=width+1 && data.bar.bottom<=height+1,`${width}×${height}: action bar stays reachable`);
    assert.ok(data.zoom*data.worldW>=width-1 && data.zoom*data.worldH>=height-1,`${width}×${height}: no blank map border`);
    assert.equal(data.legacy,0,'Marketing/page panels and permanent instructions must be removed');
    assert.equal(data.castVisible,data.casting,'Idle cast readout must be hidden');
    // Selection is real game state; only the viewport/position of its HUD is tested here.
    await page.evaluate(()=>{const game=window.everwild.game;const mob=game.mobs.find(m=>m.alive&&!m.returning);if(mob)game.setTarget(mob.id);});
    await page.waitForFunction(()=>!document.getElementById('target-card').hidden);
    const target=await page.locator('#target-card').boundingBox();
    assert.ok(target.x>=0 && target.x+target.width<=width+1,'Target readout fits horizontally');
    assert.ok(target.y+target.height<=height*.22,`${width}×${height}: target stays out of central play area`);
    assert.ok(target.height<=Math.max(86,height*.08),'Target is compact, not a floating information panel');
    if([1920,3840,5120,390].includes(width))await page.screenshot({path:path.join(output,`hud-${width}x${height}.png`)});
  }
  await page.setViewportSize({width:1920,height:1080});
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.getElementById('menu-dialog').open);
  await page.locator('#hud-scale').selectOption('1.25');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim()),'1.25');
  await page.locator('#hud-scale').selectOption('auto');
  await page.locator('[data-action="menu"][data-menu="character"]').click();
  assert.equal(await page.locator('.character-stats>div').count(),6);
  await page.locator('#dialog-close').click();
  // Coordinate conversion must continue to match the full-resolution canvas.
  const error=await page.evaluate(()=>{
    const r=window.everwild.renderer,p=window.everwild.game.player,s=r.worldToScreen(p.x,p.y),w=r.screenToWorld(s.x,s.y);
    return Math.hypot(w.x-p.x,w.y-p.y);
  });
  assert.ok(error<1e-6);
  console.log('HUD checks passed: full viewport, 720p/1080p/1440p/4K/5120 ultrawide/phone/landscape, compact top-edge target, menu-only secondary data, HUD sizing.');
}
module.exports={runHudChecks};
