'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {Game}=require('../src/engine.js');
const equip=(game,id)=>{game._loot(id);assert.ok(game.equip(id).ok);};

test('the first ordinary victory awards useful cloth that equips without granting free mana',()=>{
 const g=new Game({random:()=>.9});g.player.mp=40;
 g._damageMob(g.mobs[0],100000,'pet');
 assert.ok(g.player.inventory.includes('worn-linen-robe'));
 const mana=g.player.mp;assert.ok(g.equip('worn-linen-robe').ok);
 assert.equal(g.player.equipment.garb,'worn-linen-robe');assert.equal(g.player.maxMp,176);
 assert.equal(g.player.mp,mana);assert.equal(g.player.power,2);
 g.equip('worn-linen-robe');assert.equal(g.player.maxMp,176);
});

test('clothing swaps are genuine health/mana tradeoffs and old saves leave the new slot empty',()=>{
 const g=new Game({save:{version:'0.4.0',player:{level:1,inventory:['griks-lucky-charm'],equipment:{charm:'griks-lucky-charm'}}}});
 assert.equal(g.player.equipment.charm,'griks-lucky-charm');assert.equal(g.player.equipment.garb,undefined);
 equip(g,'worn-linen-robe');const hp=g.player.maxHp,mp=g.player.maxMp;
 equip(g,'waxed-travel-cloak');assert.equal(g.player.maxHp,hp+18);assert.equal(g.player.maxMp,mp-20);
 const loaded=new Game({save:g.serialize()});assert.equal(loaded.player.equipment.garb,'waxed-travel-cloak');
 assert.equal(loaded.player.equipment.charm,'griks-lucky-charm');
});

test('Living Thread improves actual pet healing and does not amplify personal healing',()=>{
 const g=new Game({random:()=>.5});g.player.level=3;g._refreshStats();g._summon('Earth',1);
 const personal=g.spellProfile(7).heal, normal=g.spellProfile(4).heal;
 equip(g,'mosswoven-mantle');assert.ok(g.spellProfile(4).heal>normal);assert.equal(g.spellProfile(7).heal,personal);
 g.pet.hp=1;assert.ok(g.castSpell(4).ok);const expected=g.spellProfile(4).heal;
 g.clock=g.cast.done;g._finishCast();assert.equal(g.pet.hp,1+expected);
 equip(g,'worn-linen-robe');assert.ok(g.spellProfile(4).heal<expected);
});

test('Cinderweave amplifies resolved fire spells while reducing health and leaving frost unamplified',()=>{
 const g=new Game({random:()=>.5});g.player.level=5;g._refreshStats();
 equip(g,'emberwoven-robe');assert.equal(g.player.maxHp,152);
 const frost=g.spellProfile(8).damage, fire=g.spellProfile(1).damage;
 const mob=g.mobs.find(m=>m.campId==='mossfang'&&m.named);g.player.x=mob.x-200;g.player.y=mob.y;
 g.setTarget(mob.id);const hp=mob.hp;assert.ok(g.castSpell(1).ok);g.clock=g.cast.done;g._finishCast();
 assert.equal(hp-mob.hp,fire);
 // A neutral equipment state with identical spell power isolates the fire-only property.
 const neutral=new Game({random:()=>.5});neutral.player.level=5;neutral._refreshStats();neutral.player.power=g.player.power;
 assert.equal(neutral.spellProfile(8).damage,frost);assert.ok(fire>neutral.spellProfile(1).damage);
});

test('Othrek’s extra robe reward uses its stated drop chance, alongside his guaranteed focus',()=>{
 for(const [roll,expected] of [[.1,true],[.9,false]]) {
  const g=new Game({random:()=>roll});const boss=g.mobs.find(m=>m.campId==='vigil'&&m.named);
  g._damageMob(boss,100000,'player');
  assert.equal(g.player.inventory.includes('emberwoven-robe'),expected);
  assert.ok(g.player.inventory.includes('othreks-focus'));
 }
});

test('completed older Mossfang assignments receive the new garment once without replaying quest currency or experience',()=>{
 const quests={
  'scout-road':{status:'completed',progress:4},
  'griks-talisman':{status:'completed',progress:1},
  mossfang:{status:'completed',progress:1}
 };
 const g=new Game({save:{version:'0.4.0',player:{level:4,xp:40,gold:30,inventory:[],quests}}});
 assert.ok(g.player.inventory.includes('mosswoven-mantle'));
 assert.equal(g.player.gold,30);assert.equal(g.player.xp,40);assert.equal(g.player.equipment.garb,undefined);
 const loaded=new Game({save:g.serialize()});
 assert.equal(loaded.player.inventory.filter(id=>id==='mosswoven-mantle').length,1);
 assert.equal(loaded.player.gold,30);assert.equal(loaded.player.xp,40);
});

test('a named victory before the first ordinary guard does not consume the clothing guarantee',()=>{
 const g=new Game({random:()=>.9});
 g._damageMob(g.mobs.find(m=>m.campId==='briar'&&m.named),100000,'pet');
 assert.ok(!g.player.inventory.includes('worn-linen-robe'));
 g._damageMob(g.mobs.find(m=>m.campId==='briar'&&!m.named),100000,'pet');
 assert.ok(g.player.inventory.includes('worn-linen-robe'));
});
