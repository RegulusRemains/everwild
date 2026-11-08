'use strict';const test=require('node:test'),assert=require('node:assert/strict');const{Game,ITEMS}=require('../src/engine.js');
const itemIds=Object.keys(ITEMS),advance=(g,s)=>{for(let t=0;t<s-1e-8;t+=.05)g.update(Math.min(.05,s-t));};
function setup(classId){const g=new Game({save:{player:{classId,level:5,inventory:itemIds,equipment:{}}},random:()=>.5});g.template={...g.mobs[0]};g.mobs.forEach(m=>m.alive=false);g._recentCombat=100;return g;}
function cast(g,i){g.player.mp=g.player.maxMp;assert.ok(g.castSpell(i).ok);advance(g,g.spells[i].cast+.05);}
test('equipment effect language describes ability roles and companions rather than one class kit',()=>{for(const item of Object.values(ITEMS))if(item.effect)assert.doesNotMatch(item.effect,/elemental|Fire Bolt|Frost Lance|Arcane Root|Pet Mend|Magic Shield|Ember Nova/i,item.name);});
for(const id of ['magician','necromancer','druid'])test(id+': role-based damage, companion recovery and protection, control and area relics actually apply',()=>{
 const g=setup(id);g.equip('emberwoven-robe');assert.equal(g.spellDamageMultiplier(1),1.15);assert.equal(g.spellDamageMultiplier(2),1.15);assert.equal(g.spellDamageMultiplier(8),1);assert.equal(g.spellDamageMultiplier(9),id==='druid'?1:1.15);
 const m={...g.template,alive:true,x:700,y:650,homeX:700,homeY:650,hp:3000,maxHp:3000,rootUntil:100,ability:null};g.mobs=[m];g.player.x=500;g.player.y=650;g.setTarget(m.id);const hp=m.hp,damage=g.spellProfile(1).damage;cast(g,1);assert.equal(hp-m.hp,damage,'actual strike uses the preview and shared item bonus');
 const r=g.spellProfile(3).root,s=g.spellProfile(8).slow;g.equip('othreks-focus');assert.equal(g.spellProfile(3).root,r+3);assert.equal(g.spellProfile(8).slow,s+3);
 g.equip('rimeglass-focus');assert.equal(g.spellDamageMultiplier(8),1.25);g.equip('ashwake-mantle');assert.equal(g.spellProfile(9).radius,135);
 g.player.x=260;g.player.y=250;g.mobs=[];g._summon('Earth',1);const mend=g.spellProfile(4).heal;g.equip('mosswoven-mantle');assert.ok(Math.abs(g.spellProfile(4).heal-mend*1.25)<=1);g.pet.hp=1;cast(g,4);assert.equal(g.pet.hp,Math.min(g.pet.maxHp,1+g.spellProfile(4).heal));
 g.equip('ring-of-bound-earth');const petHp=g.pet.hp;g._takePetDamage(10);assert.equal(petHp-g.pet.hp,8,'protects any companion species');
 g.equip('warden-boneguard');cast(g,6);const ownHp=g.player.hp;g._takePlayerDamage(20);assert.equal(ownHp-g.player.hp,9,'same ward property works for every class');
});
