'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{Game,CLASSES,CLASS_SPELLS}=require('../src/engine.js');
const tick=(g,s)=>{for(let t=0;t<s-1e-7;t+=.05)g.update(.05);};
function stage(id,level=5){const g=new Game({random:()=>.5,save:{player:{classId:id,level,inventory:[]}}});g.player.x=800;g.player.y=1600;const m=g.mobs[0];g.mobs.forEach(o=>o.alive=o===m);Object.assign(m,{x:850,y:1600,homeX:850,homeY:1600,hp:5000,maxHp:5000,ability:null,aggro:false,rootUntil:1000,damage:1});g.setTarget(m.id);return{g,m};}
function cast(g,index){const r=g.castSpell(index);assert.ok(r.ok,r.message);tick(g,g.spells[index].cast+.05);}
const find=(g,k)=>g.spells.findIndex(a=>a.kind===k);
test('fourteen complete class kits have ten abilities, finite previews, upgrade ranks and independent saved identities',()=>{
 assert.equal(Object.keys(CLASSES).length,14);
 for(const cls of Object.values(CLASSES)){const{g}=stage(cls.id);assert.equal(g.spells.length,10);assert.equal(new Set(g.spells.map(a=>a.id)).size,10);for(let i=0;i<10;i++){assert.ok(g.spellProfile(i).summary.length>8);assert.doesNotMatch(g.spellProfile(i).summary,/NaN|undefined/);assert.ok(g.spellProfile(i,2).summary);}const copy=new Game({save:g.serialize()});assert.equal(copy.player.classId,cls.id);assert.deepEqual(copy.player.hotbar,g.player.hotbar);}
});
test('melee attacks require actual range, F approaches with weapons, movement stops pursuit and G stops attacks',()=>{
 const{g,m}=stage('warrior');m.x=1000;assert.equal(g.castSpell(1).ok,false);assert.equal(g.pet,null);assert.ok(g.commandPet('attack').ok);tick(g,3);assert.ok(m.hp<5000);assert.ok(Math.hypot(m.x-g.player.x,m.y-g.player.y)<=60);assert.ok(g.combo>0);const p=g.spellProfile(7);assert.equal(g.castSpell(7).ok,g.combo>=3);g.cast=null;g.commandPet('follow');const hp=m.hp;tick(g,2);assert.equal(m.hp,hp);g.commandPet('attack');g.update(.05,{dx:-1});assert.equal(g.autoChase,false);assert.ok(p.damage>0);
});
test('combo finishers consume three stacks and cooldowns survive reload',()=>{
 const{g,m}=stage('rogue');assert.equal(g.castSpell(7).ok,false);g.combo=3;const hp=m.hp;cast(g,7);assert.equal(g.combo,0);assert.ok(m.hp<hp);assert.ok(g.spellCooldownRemaining(7)>0);assert.equal(g.castSpell(7).ok,false);const copy=new Game({save:g.serialize()});assert.ok(copy.spellCooldownRemaining(7)>0);assert.equal(copy.combo,0);
});
test('mez stops hostile action, damage and existing DoT ticks wake it; stun survives damage',()=>{
 const{g,m}=stage('enchanter');cast(g,2);assert.ok(m.mezUntil>g.clock);const hp=g.player.hp;tick(g,2);assert.equal(g.player.hp,hp);cast(g,1);assert.equal(m.mezUntil,0);g.player.mp=g.player.maxMp;m.dotUntil=g.clock+14;m.dotAt=g.clock+3;m.dotDamage=2;cast(g,2);assert.ok(m.mezUntil>g.clock);tick(g,2);assert.equal(m.mezUntil,0);
 const w=stage('warrior');cast(w.g,3);assert.ok(w.m.stunUntil>w.g.clock);w.g._damageMob(w.m,5,'player');assert.ok(w.m.stunUntil>w.g.clock);
});
test('Enchanter charm is health-gated, refuses named enemies, commands a real ally and returns hostile on expiration',()=>{
 const{g,m}=stage('enchanter');assert.equal(g.castSpell(5).ok,false);m.hp=2000;m.named=true;assert.equal(g.castSpell(5).ok,false);m.named=false;cast(g,5);assert.equal(g.pet.charmedMobId,m.id);assert.ok(m.charmedUntil>g.clock);assert.equal(m.aggro,false);const expiry=m.charmedUntil;tick(g,expiry-g.clock+.2);assert.equal(g.pet,null);assert.equal(m.charmedUntil,0);assert.ok(m.aggro);assert.ok(m.hp>0);
});
test('Shaman poison and disease tick independently, attack slow changes real attack cadence',()=>{
 const{g,m}=stage('shaman');cast(g,2);cast(g,5);assert.ok(m.dotUntil>g.clock&&m.diseaseUntil>g.clock);const hp=m.hp;tick(g,2.1);assert.ok(hp-m.hp>=g.spellProfile(2).tickDamage+g.spellProfile(5).tickDamage);cast(g,3);assert.ok(m.attackSlowUntil>g.clock);m.x=g.player.x+20;m.rootUntil=0;m.attackAt=0;g.update(.05);assert.ok(m.attackAt-g.clock>3.5);
});
test('barriers absorb a finite pool, life drain caps actual damage and regeneration is delayed',()=>{
 const{g}=stage('enchanter');cast(g,6);const barrier=g.barrier,hp=g.player.hp;g._takePlayerDamage(20);assert.equal(g.player.hp,hp);assert.equal(g.barrier,barrier-20);g._takePlayerDamage(barrier);assert.ok(g.player.hp<hp);
 const s=stage('shadowknight');s.m.hp=5;s.g.player.hp=30;cast(s.g,1);assert.equal(s.g.player.hp,33); // 65% of 5 actual damage, rounded.
 const c=stage('cleric');c.g.player.hp=30;cast(c.g,5);assert.ok(c.g.player.hp<35);tick(c.g,2);assert.ok(c.g.player.hp>35);
});
test('Bard songs replace one another and stop on death, Paladin combo healing and Monk feign are functional',()=>{
 const b=stage('bard');cast(b.g,0);assert.equal(b.g.song.kind,'song-damage');cast(b.g,2);assert.equal(b.g.song.kind,'song-heal');b.g._takePlayerDamage(99999);assert.equal(b.g.song,null);assert.equal(b.g.autoAttack,false);
 const p=stage('paladin');p.g.player.hp=20;assert.equal(p.g.castSpell(5).ok,false);p.g.combo=3;cast(p.g,5);assert.equal(p.g.combo,0);assert.ok(p.g.player.hp>20);
 const m=stage('monk');cast(m.g,8);m.m.rootUntil=0;m.m.x=m.g.player.x+20;m.m.aggro=true;const hp=m.g.player.hp;tick(m.g,2);assert.equal(m.g.player.hp,hp);m.g.update(.05,{dx:1});assert.equal(m.g.feignUntil,0);
});
test('Ranger bow attacks work beyond melee range, while temporary guardians expire and Wizard Blink creates distance',()=>{
 const r=stage('ranger');r.m.x=1000;r.g.commandPet('attack');tick(r.g,2);assert.ok(r.m.hp<5000);assert.equal(r.g.player.x,800);cast(r.g,0);assert.ok(r.g.pet.expiresAt>r.g.clock);r.g.commandPet('follow');tick(r.g,24.1);assert.equal(r.g.pet,null);
 const w=stage('wizard'),before=Math.hypot(w.g.player.x-w.m.x,w.g.player.y-w.m.y);cast(w.g,5);assert.ok(Math.hypot(w.g.player.x-w.m.x,w.g.player.y-w.m.y)>before+150);
});
for(const id of Object.keys(CLASSES).filter(id=>CLASSES[id].skills))test(id+' completes the fresh first expedition and reloads its own progression across three seeds',()=>{for(const seed of [42,73,2026])assert.ok(require('../scripts/class-expedition-run.cjs').runClassExpedition(id,seed).completed);});
test('an ordinary even-level target survives a full DoT, while repeated root buys a real damage-free casting window',()=>{
 const g=new Game({random:()=>.5}),m=g.mobs[0];g.player.x=480;g.player.y=350;g.setTarget(m.id);const hp=g.player.hp,initial=m.hp;cast(g,3);cast(g,2);tick(g,5);cast(g,3);tick(g,8.2);assert.ok(m.alive,'A full DoT must not erase an ordinary encounter');assert.ok(initial-m.hp>=g.spellProfile(2).tickDamage*7,'All seven ticks have time to matter');assert.equal(g.player.hp,hp,'Root keeps a melee enemy out of reach');assert.ok(g.spellProfile(2).tickDamage*7/g.spells[2].cost>g.spellProfile(1).damage/g.spells[1].cost,'DoT rewards sustained damage per resource');
});
test('Consecration pulses exactly five times and charm validation uses the original target when selection changes',()=>{
 const p=stage('paladin');p.g.player.mp=p.g.player.maxMp;const start=p.m.hp,tickDamage=p.g.spellProfile(9).tickDamage;cast(p.g,9);tick(p.g,10.1);assert.equal(start-p.m.hp,tickDamage*5);
 const e=stage('enchanter');e.m.hp=2000;assert.ok(e.g.castSpell(5).ok);e.m.hp=4000;e.g.selectedId=null;const mp=e.g.player.mp;tick(e.g,2.6);assert.equal(e.g.pet,null);assert.ok(e.g.player.mp>=mp,'An invalid original charm target must not spend mana');
});
test('a charmed creature shares damage with its real mob, obeys attack orders and cannot attack itself',()=>{
 const{g,m}=stage('enchanter');m.hp=2000;cast(g,5);assert.equal(g.commandPet('attack').ok,false);const enemy=new Game().mobs[1];g.mobs.push(enemy);Object.assign(enemy,{alive:true,x:900,y:1600,homeX:900,homeY:1600,hp:1000,maxHp:1000,ability:null,rootUntil:1000,aggro:false,returning:false,damage:1});g.setTarget(enemy.id);assert.ok(g.commandPet('attack').ok);tick(g,3);assert.ok(enemy.hp<1000);const hp=g.pet.hp;g._takePetDamage(20);g.update(.05);assert.equal(m.hp,hp-20);assert.equal(m.hp,g.pet.hp);
});
test('shared strike, affliction and burst equipment applies to the matching expanded class skills',()=>{
 for(const cls of Object.values(CLASSES).filter(c=>c.skills)){const{g}=stage(cls.id);const before=g.spells.map((a,i)=>({role:a.role,profile:g.spellProfile(i)}));g.player.equipment.garb='emberwoven-robe';for(let i=0;i<10;i++){if(['strike','affliction','burst'].includes(before[i].role)){assert.ok(Math.abs(g.spellProfile(i).damage-before[i].profile.damage*1.15)<=1);assert.ok(Math.abs(g.spellProfile(i).tickDamage-before[i].profile.tickDamage*1.15)<=1);}else assert.equal(g.spellProfile(i).heal,before[i].profile.heal);}}
});
