'use strict';const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
async function runAnimationChecks(page,output){
 await require('./browser-helpers.cjs').enterCharacter(page);await page.waitForFunction(()=>window.everwild.renderer.classMotionLoaded);
 const result=await page.evaluate(()=>{
  const{game:g,renderer:r}=window.everwild;window.everwild.pause(true);g.mobs.forEach(m=>m.alive=false);const out=[];
  for(const classId of ['magician','necromancer','druid']){
   g.player.classId=classId;g.player.x=1000;g.player.y=1600;g.player.level=5;g._refreshStats();g.player.mp=g.player.maxMp;g.dead=false;g.cast=null;g.pet=null;g.cancelMovement();g.player.walkDistance=0;
   const walking=new Set();for(let i=0;i<32;i++){g.update(.05,{dx:1});const p=r._pose('player',g.player,g,g.clock);walking.add(p?.index);}
   g.update(.05,{dx:-1});const facesLeft=g.player.facing===-1;g.update(.2);const idle=r._pose('player',g.player,g,g.clock);
   const casting=new Set();const started=g.castSpell(0).ok;while(g.cast){g.update(.05);const p=r._pose('player',g.player,g,g.clock);casting.add(p?.index);}
   const release=r._pose('player',g.player,g,g.clock);g.update(.3);const after=r._pose('player',g.player,g,g.clock);
   g.player.mp=g.player.maxMp;g.castSpell(0);g.update(.05);g.update(.05,{dx:1});const cancelled=!g.cast&&r._pose('player',g.player,g,g.clock)?.index<12;
   out.push({cancelled,classId,walking:[...walking],casting:[...casting],idle,release,after,started,facesLeft});
  }
  const sheet=document.createElement('canvas');sheet.width=960;sheet.height=1440;const c=sheet.getContext('2d');c.fillStyle='#192325';c.fillRect(0,0,sheet.width,sheet.height);
  for(let row=0;row<6;row++)for(let col=0;col<4;col++){r._sheet(c,'classMotion',row*4+col,col*240+120,row*240+220,140);c.fillStyle='#b8c3ac';c.font='12px sans-serif';c.fillText(['Magician walk','Necromancer walk','Druid walk','Magician cast','Necromancer cast','Druid cast'][row]+' · '+(col+1),col*240+12,row*240+235);}
  return{out,png:sheet.toDataURL('image/png')};
 });
 for(const [i,row]of result.out.entries()){
  assert.equal(row.walking.length,4,row.classId+' uses every walking frame');assert.ok(row.walking.every(n=>n>=i*4&&n<i*4+4));assert.equal(row.casting.length,4,row.classId+' uses gather/channel/release frames');assert.equal(row.idle,null);assert.equal(row.after,null);assert.equal(row.release.index,(3+i)*4+3);assert.ok(row.started&&row.facesLeft&&row.cancelled);
 }
 await fs.writeFile(path.join(output,'class-animation-frames.png'),Buffer.from(result.png.split(',')[1],'base64'));
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.everwild.renderer.reducedMotion);assert.equal(await page.evaluate(()=>{const{game:g,renderer:r}=window.everwild;g.update(.05,{dx:1});return r._pose('player',g.player,g,g.clock);}),null);await page.emulateMedia({reducedMotion:'no-preference'});
 console.log('Animation review passed: four real walk/cast frames per class, distance-driven gait, release hold, left facing, stable idle, reduced motion.');
}
module.exports={runAnimationChecks};
