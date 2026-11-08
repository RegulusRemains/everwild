'use strict';const test=require('node:test'),assert=require('node:assert/strict');const{Game,CLASSES,SPELLS}=require('../src/engine.js');
const fresh=id=>new Game({save:{player:{classId:id,name:'Aster',level:4,inventory:[]}},random:()=>.5});
const tick=(g,s)=>{for(let t=0;t<s;t+=.05)g.update(.05);};
test('class identity, character name, stats, spells and persistence are independent',()=>{
 const games=Object.keys(CLASSES).map(fresh);assert.equal(new Set(games.map(g=>g.player.maxHp)).size,3);assert.equal(new Set(games.map(g=>g.spells[1].name)).size,3);
 for(const g of games){assert.equal(g.spells.length,SPELLS.length);g.player.gold=53;g._loot('worn-linen-robe');const copy=new Game({save:g.serialize()});assert.equal(copy.player.classId,g.player.classId);assert.equal(copy.player.name,'Aster');assert.equal(copy.player.gold,53);assert.ok(copy.player.inventory.includes('worn-linen-robe'));}
 assert.equal(new Game({save:{player:{level:5,inventory:[]}}}).player.classId,'magician');assert.equal(fresh('unknown').player.classId,'magician');
});
test('Necromancer drains actual dealt damage, caps overheal and strengthens rot at the cost of pet endurance',()=>{
 const g=fresh('necromancer'),mag=fresh('magician'),m=g.mobs[0];g.mobs.forEach(o=>{if(o!==m)o.alive=false;});g.player.x=m.x-200;g.player.y=m.y;g.player.hp=20;g._recentCombat=0;g.setTarget(m.id);const hp=g.player.hp,damage=g.spellProfile(1).damage;m.rootUntil=100;assert.ok(g.castSpell(1).ok);tick(g,1.75);assert.equal(g.player.hp,hp+Math.round(damage*.3));assert.ok(g.spellProfile(2).tickDamage>mag.spellProfile(2).tickDamage);assert.ok(g.spellProfile(0).petHp<mag.spellProfile(0).petHp);assert.ok(g.spellProfile(0).petDamage>mag.spellProfile(0).petDamage);
});
test('Druid roots and actual healing match class previews, and wild companions have distinct identities',()=>{
 const g=fresh('druid'),mag=fresh('magician');assert.equal(g.spellProfile(3).root,mag.spellProfile(3).root+4);assert.ok(g.spellProfile(7).healTick*5>mag.spellProfile(7).heal);g.player.hp=1;const heal=g.spellProfile(7).healTick*5;g._recentCombat=100;assert.ok(g.castSpell(7).ok);tick(g,12.55);assert.ok(g.player.hp>=Math.min(g.player.maxHp,1+heal));g.player.mp=g.player.maxMp;g.castSpell(0);tick(g,3.25);assert.equal(g.pet.name,'Briar Stag');assert.equal(g.pet.classId,'druid');
});

for(const classId of ['necromancer','druid'])test(classId+' completes the fresh first expedition with its supported companion styles across three seeds',()=>{for(const companion of (classId==='druid'?['Stag']:['Earth','Air']))for(const seed of [42,73,2026])assert.ok(require('../scripts/expedition-run.cjs').runExpedition(seed,companion,true,false,classId).completed);});
