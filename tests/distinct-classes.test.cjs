'use strict';const test=require('node:test'),assert=require('node:assert/strict');const{Game}=require('../src/engine.js');
const advance=(g,s,input)=>{for(let t=0;t<s-1e-8;t+=.05)g.update(Math.min(.05,s-t),input);};
function game(classId){const g=new Game({save:{player:{classId,level:5,inventory:[],equipment:{}}},random:()=>.5});g.template={...g.mobs[0]};g.mobs.forEach(m=>m.alive=false);g._recentCombat=100;return g;}
function cast(g,i){g.cancelMovement();assert.ok(g.castSpell(i).ok,'cast '+g.spells[i].name);advance(g,g.spells[i].cast+.01);}
function foe(g,x=700,y=650){const m={...g.template,alive:true,aggro:false,returning:false,x,y,homeX:x,homeY:y,hp:3000,maxHp:3000,rootUntil:100,threatPlayer:0,threatPet:0,ability:null,intent:null};g.mobs=[m];g.player.x=x-200;g.player.y=y;g.selectedId=m.id;return m;}
test('Dark Pact trades real health for mana, cannot kill its caster, and retains cooldown through reload',()=>{
 const g=game('necromancer');g.player.mp=10;const hp=g.player.hp,p=g.spellProfile(7);cast(g,7);assert.equal(g.player.hp,hp-p.healthCost);assert.ok(g.player.mp>=10+p.mana);assert.ok(g.spellCooldownRemaining(7)>9);assert.equal(g.castSpell(7).ok,false);
 const copy=new Game({save:g.serialize()});assert.ok(copy.spellCooldownRemaining(7)>9);advance(g,10);g.player.hp=p.healthCost;g.player.mp=0;assert.equal(g.castSpell(7).ok,false);assert.equal(g.player.hp,p.healthCost);
 assert.equal(game('magician').spells[7].role,'heal');
});
test('Blight Bloom needs rot, consumes its remaining ticks, and does more than an unprepared burst',()=>{
 const g=game('necromancer'),m=foe(g);assert.equal(g.castSpell(9).ok,false);cast(g,2);g.player.mp=g.player.maxMp;const base=g.spellProfile(9).damage;cast(g,9);assert.equal(m.dotUntil,0);assert.equal(m.dotDamage,0);const damage=g.visuals.filter(v=>v.kind==='impact').at(-1).amount;assert.ok(damage>base);const hp=m.hp;advance(g,2);assert.equal(m.hp,hp,'consumed rot cannot keep ticking');
});
test('Shade attacks at range while Boneguard must approach; a Druid guardian expires',()=>{
 const g=game('necromancer');cast(g,5);const m=foe(g);g.pet.x=m.x-150;g.pet.y=m.y;g.pet.targetId=m.id;const hp=m.hp;advance(g,.1);assert.ok(m.hp<hp);assert.ok(Math.hypot(g.pet.x-m.x,g.pet.y-m.y)>100);assert.equal(g.pet.attackRange,180);
 const d=game('druid');cast(d,0);const expires=d.pet.expiresAt;advance(d,expires-d.clock+.1);assert.equal(d.pet,null);const mage=game('magician');cast(mage,0);advance(mage,40);assert.ok(mage.pet,'Magician companion is permanent');
});
test('Wild Stride is movement instead of a second summon, speeds travel and has a persistent cooldown',()=>{
 const d=game('druid');assert.equal(d.spells[5].role,'mobility');cast(d,5);assert.equal(d.pet,null);const start=d.player.x;advance(d,1,{dx:1});assert.ok(d.player.x-start>245);d.cancelMovement();assert.equal(d.castSpell(5).ok,false);assert.ok(new Game({save:d.serialize()}).spellCooldownRemaining(5)>18);
});
test('Rejuvenation heals over time without stacking, and Barkskin retaliates',()=>{
 const d=game('druid');d.player.hp=1;const p=d.spellProfile(7);cast(d,7);assert.equal(d.player.hp,1);advance(d,2);assert.equal(d.player.hp,1+p.healTick);d.player.mp=d.player.maxMp;cast(d,7);assert.equal(d.regeneration.heal,p.healTick);
 d.player.mp=d.player.maxMp;cast(d,6);const m=foe(d),before=m.hp;d._takePlayerDamage(10,m);assert.equal(before-m.hp,d.spellProfile(6).thorns);
});
test('Verdant Sanctuary is a self-targeted healing field, roots on creation, and only heals allies inside',()=>{
 const d=game('druid');d._loot('ashwake-mantle');d.equip('ashwake-mantle');cast(d,0);const m=foe(d);m.x=d.player.x+100;m.y=d.player.y;d.selectedId=null;d.player.hp=40;d.pet.hp=40;d.player.mp=d.player.maxMp;const before=m.hp,p=d.spellProfile(9);cast(d,9);assert.ok(d.sanctuary);assert.equal(d.sanctuary.radius,135);assert.equal(m.hp,before,'sanctuary is not a renamed damage nova');assert.ok(m.rootUntil>d.clock);advance(d,2);assert.equal(d.player.hp,40+p.healTick);assert.equal(d.pet.hp,40+p.petHealTick);
 d.player.x+=200;const hp=d.player.hp;advance(d,2);assert.equal(d.player.hp,hp,'leaving the field loses its healing');
});
