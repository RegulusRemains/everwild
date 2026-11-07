'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {Game,WORLD,BIOMES,biomeAt,CAMPS,ITEMS,QUESTS,SPELLS}=require('../src/engine.js');
const camps=CAMPS.filter(c=>c.biome);
const tick=(g,s)=>{for(let t=0;t<s-1e-6;t+=.05)g.update(.05);};
function scenario(camp){return new Game({random:()=>.5,save:{player:{level:camp.level+1,x:camp.x-260,y:camp.y+235,hp:9999,mp:9999,spellRanks:Array(10).fill(2),supplies:{'health-tonic':4,'mana-tonic':4},inventory:['worn-linen-robe'],equipment:{garb:'worn-linen-robe'}}}});}
function cast(g,i){if(!g.castSpell(i).ok)return false;tick(g,SPELLS[i].cast+.05);return true;}
test('expanded world has reachable distinct habitats, valid loot, and four optional hunt chains',()=>{
 assert.ok(WORLD.w*WORLD.h>=4*1900*1350);assert.equal(BIOMES.length,5);assert.equal(camps.length,4);assert.equal(new Set(camps.map(c=>c.type)).size,4);
 for(const c of camps){assert.equal(biomeAt(c.x,c.y).id,c.biome);assert.ok(c.x>200&&c.x<WORLD.w-200&&c.y>200&&c.y<WORLD.h-200);assert.equal(ITEMS[c.rareItemId].rarity,'rare');assert.ok(c.loot.every(id=>ITEMS[id].campId===c.id));assert.ok(QUESTS.some(q=>q.campId===c.id&&q.targetName===c.namedName));}
});
for(const camp of camps)test(camp.name+': supported-level pet combat, unique rare, respawn and save retention',()=>{
 const g=scenario(camp);assert.ok(cast(g,0));const mob=g.mobs.find(m=>m.campId===camp.id&&m.named);
 g.setTarget(mob.id);assert.ok(g.commandPet('attack').ok);tick(g,2);
 for(let n=0;mob.alive&&n<150;n++){
  assert.equal(g.dead,false,camp.name+' player survival');
  if(!g.pet){assert.ok(cast(g,0));g.commandPet('attack');continue;}
  if(mob.intent&&g.player.mp>=24&&cast(g,3))continue;
  if(g.pet.hp<g.pet.maxHp*.6&&cast(g,4))continue;
  if(g.pet.tauntReadyAt<=g.clock)g.commandPet('taunt');
  if(g.player.hp<g.player.maxHp*.5)g.useSupply('health-tonic');
  if(g.player.mp<35)g.useSupply('mana-tonic');
  if(mob.dotUntil<=g.clock&&mob.hp>g.spellProfile(1).damage*2&&cast(g,2))continue;
  if(!cast(g,1))tick(g,.5);
 }
 assert.ok(!mob.alive,camp.name+' encounter completes');assert.ok(g.player.inventory.includes(camp.rareItemId));g.commandPet('follow');
 assert.ok(g.equip(camp.rareItemId).ok);const copy=new Game({save:g.serialize(),random:()=>.5});assert.ok(copy.player.inventory.includes(camp.rareItemId));assert.equal(copy.player.equipment[ITEMS[camp.rareItemId].slot],camp.rareItemId);
 // Respawn uses the same slot and family; it must not disappear outside the old map bounds.
 const slot=mob._slot;g.player.x=WORLD.spawn.x;g.player.y=WORLD.spawn.y;g.pet=null;tick(g,camp.delay+1);assert.ok(g.mobs.some(m=>m.alive&&m._slot===slot&&m.type===camp.type));
});
test('new families differ in pursuit speed, endurance, range, and marked attacks',()=>{
 const g=new Game(),wolf=g.mobs.find(m=>m.type==='wolf'&&!m.named),beetle=g.mobs.find(m=>m.type==='beetle'&&!m.named),wisp=g.mobs.find(m=>m.type==='wisp'&&!m.named);
 assert.ok(wolf.speed>beetle.speed);assert.ok(beetle.maxHp>wisp.maxHp);assert.ok(wisp.reach>150);
 for(const [type,name,radius]of [['wolf','Hunting Pounce',65],['beetle','Carapace Crush',85],['wisp','Shard Volley',50],['drake','Cinder Breath',95]]){const m=g.mobs.find(m=>m.type===type&&m.named);g.player.x=m.x+30;g.player.y=m.y;g._beginIntent(m,g.player);assert.equal(m.intent.name,name);assert.equal(m.intent.radius,radius);}
});
test('Packbond applies once to an existing pet and stops immediately on unequip',()=>{
 const g=scenario(camps[0]);cast(g,0);const m=g.mobs.find(m=>m.type==='wolf'&&!m.named);g.player.x=m.x-100;g.player.y=m.y;g.pet.x=m.x-29;g.pet.y=m.y;g.pet.targetId=m.id;
 const base=g.pet.damage;g._loot('crownfang-ring');g.equip('crownfang-ring');g.equip('crownfang-ring');let hp=m.hp;g._updatePet(.01);assert.equal(hp-m.hp,Math.round(base*1.12));
 g._loot('copperleaf-ring');g.equip('copperleaf-ring');g.pet.attackAt=0;hp=m.hp;g._updatePet(.01);assert.equal(hp-m.hp,base);
});
test('Lanternheart heals credited kills, Winter’s Edge matches actual frost, and Ashwake widens actual Nova',()=>{
 const g=scenario(camps[3]);for(const id of ['lanternheart','rimeglass-focus','ashwake-mantle']){g._loot(id);g.equip(id);}
 const frost=g.spellProfile(8).damage;g.player.equipment.focus=null;g._refreshStats();const noFocus=g.spellProfile(8).damage;g.equip('rimeglass-focus');assert.ok(frost>noFocus);
 const c=camps[3],m=g.mobs.find(m=>m.campId===c.id&&!m.named);g.player.x=m.x-200;g.player.y=m.y;g.player.hp-=30;const hp=g.player.hp;g._damageMob(m,99999,'player');assert.equal(g.player.hp,hp+8);
 const a=g.mobs.find(m=>m.campId===c.id&&m.alive&&!m.named),b=g.mobs.find(m=>m.campId===c.id&&m.alive&&m!==a);a.x=c.x;a.y=c.y;b.x=c.x+120;b.y=c.y;g.player.x=c.x-200;g.player.y=c.y;g.player.mp=g.player.maxMp;g.setTarget(a.id);
 a.rootUntil=g.clock+20;b.rootUntil=g.clock+20;const before=b.hp;assert.equal(g.spellProfile(9).radius,135);assert.ok(cast(g,9));assert.ok(b.hp<before,'enemy outside old 100 radius is hit by the wider nova');
});

test('optional hunts preserve prerequisites, require the correct named foe, and reward only once',()=>{
 for(const c of camps){
  const q=QUESTS.find(q=>q.campId===c.id),npc=require('../src/engine.js').NPCS.find(n=>n.id===q.npcId);
  const g=new Game({save:{player:{x:npc.x,y:npc.y,level:12,inventory:[],quests:Object.fromEntries(QUESTS.filter(q=>!q.id.endsWith('-hunt')).map(q=>[q.id,{status:'completed',progress:q.required}]))}},random:()=>.5});
  assert.ok(g.acceptQuest(q.id).ok);const wrong=g.mobs.find(m=>m.campId===c.id&&!m.named);g._damageMob(wrong,99999,'player');assert.equal(g.questState(q.id).status,'active');
  g._damageMob(g.mobs.find(m=>m.campId===c.id&&m.named),99999,'player');assert.equal(g.questState(q.id).status,'ready');assert.ok(g.turnInQuest(q.id).ok);const gold=g.player.gold;assert.equal(g.turnInQuest(q.id).ok,false);assert.equal(g.player.gold,gold);assert.equal(new Game({save:g.serialize()}).questState(q.id).status,'completed');
 }
});
test('Winter’s Edge preview equals damage resolved by an actual Frost Lance cast',()=>{
 const g=scenario(camps[2]);g._loot('rimeglass-focus');g.equip('rimeglass-focus');const m=g.mobs.find(m=>m.type==='wisp'&&!m.named);g.player.x=m.x-200;g.player.y=m.y;g.setTarget(m.id);const hp=m.hp,damage=g.spellProfile(8).damage;assert.ok(cast(g,8));assert.equal(hp-m.hp,damage);assert.ok(m.slowUntil>g.clock);
});
test('new camps actually roll both local common items rather than the old goblin table',()=>{
 for(const c of camps){let seed=73;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const g=new Game({random,save:{player:{level:12,inventory:['worn-linen-robe']}}});let m=g.mobs.find(m=>m.campId===c.id&&m.index===0);const slot=m._slot;for(let i=0;i<60;i++){g._damageMob(m,99999,'player');g._spawn(slot);m=g.mobs.find(m=>m.id===slot.mobId);}for(const id of c.loot)assert.ok(g.player.inventory.includes(id),c.name+' should drop '+id);}
});
