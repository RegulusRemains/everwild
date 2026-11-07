'use strict';const test=require('node:test'),assert=require('node:assert/strict');const{Game}=require('../src/engine.js');
const tick=(g,s)=>{for(let t=0;t<s;t+=.05)g.update(.05);};
test('pursuit follows a moving kite far beyond camp without restoring enemy health',()=>{
 const g=new Game({random:()=>.5}),m=g.mobs.find(m=>m.campId==='briar'&&m.index===0);g.mobs.forEach(o=>{if(o!==m)o.alive=false;});g.player.x=m.x+200;g.player.y=m.y;g._damageMob(m,10,'player');const hp=m.hp;
 for(let i=0;i<180;i++){g.player.x=m.x+200;g.player.y=m.y;tick(g,.1);assert.equal(m.returning,false);assert.equal(m.hp,hp);}
 assert.ok(m.x-m.homeX>1500,'enemy pursues across the region');
});
test('a distant rooted foe with an active damage-over-time effect stays engaged',()=>{const g=new Game(),m=g.mobs[0];g.player.x=m.x+1600;g.player.y=m.y;g._damageMob(m,1,'player');m.rootUntil=100;m.dotUntil=50;m.dotAt=100;tick(g,15);assert.equal(m.aggro,true);assert.equal(m.returning,false);});
test('losing both party members for ten seconds ends pursuit, but reapproaching cancels the timeout',()=>{const g=new Game(),m=g.mobs[0];g.player.x=4000;g.player.y=2400;g._damageMob(m,1,'player');m.rootUntil=100;tick(g,8);assert.equal(m.aggro,true);g.player.x=m.x+200;g.player.y=m.y;tick(g,1);g.player.x=4000;g.player.y=2400;tick(g,8);assert.equal(m.aggro,true);tick(g,3);assert.equal(m.aggro,false);assert.equal(m.hp,m.maxHp);});
