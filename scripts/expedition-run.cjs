'use strict';
// Reproducible fresh-character journey. No levels, health, inventory, positions,
// mob state, quest state, or resources are injected into the simulation.
const assert = require('node:assert/strict');
const { Game, SPELLS, ITEMS, WORLD } = require('../src/engine.js');
function runExpedition(seed = 42, companion = 'Earth', verifyRecovery = true, includeSave = false, classId = 'magician') {
  assert.ok((classId==='druid'?['Stag']:['Earth','Air']).includes(companion));
  const companionSpell = companion === 'Air' ? 5 : 0;
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  let game = new Game({random,save:{player:{classId,level:1,inventory:[]}}});
  const report = { fights: [], milestones: [], interruptions: 0, travelSeconds: 0, seed, companion, classId };
  const tick = seconds => { for (let t = 0; t < seconds - 1e-7; t += .05) { game.update(.05); assert.ok(!game.dead, 'Player died: '+game.logs.slice(-4).map(l=>l.text).join(' | ')); } };
  const travel = points => {
    for (const [x,y] of points) {
      assert.ok(game.moveTo(x,y).ok);
      for (let t=0;game.moveTarget && t<500;t++) { tick(.05); report.travelSeconds += .05; }
      assert.ok(!game.moveTarget, 'Waypoint unreachable'); tick(.05);
    }
  };
  const cast = index => { const result=game.castSpell(index); if(!result.ok) return false; tick(SPELLS[index].cast+.05); return true; };
  const restore = () => { assert.ok(game.restoreAtBindstone().ok); if(game.pet) game.commandPet('follow'); assert.ok(cast(companionSpell)); };
  const gear = () => {
    for (const slot of ['charm','focus','ring','garb']) {
      const available=game.player.inventory.filter(id=>ITEMS[id].slot===slot);
      const score = id => (ITEMS[id].stats.hp||0)+(ITEMS[id].stats.mp||0)+(ITEMS[id].stats.power||0)*5+(ITEMS[id].effect?20:0);
      available.sort((a,b)=>score(b)-score(a));
      if (slot === 'garb' && companion === 'Air' && available.includes('worn-linen-robe')) { available.splice(available.indexOf('worn-linen-robe'),1); available.unshift('worn-linen-robe'); } if(available[0]) assert.ok(game.equip(available[0]).ok);
    }
  };
  const fight = (mob, label) => {
    assert.ok(mob?.alive, 'Missing encounter '+label);
    const start=game.clock, startHp=game.player.hp, startMana=game.player.mp, startLevel=game.player.level;
    let lowestPet=game.pet.hp;
    game.setTarget(mob.id);
    if(classId==='druid'&&mob.campId==='crypt'){cast(2);game.commandPet('follow');game.moveTo(game.player.x,game.player.y+100);while(game.moveTarget)tick(.05);tick(1);}
    assert.ok(game.commandPet('attack').ok); tick(1.5);
    for (let attempts=0;mob.alive && attempts<80;attempts++) {
      if(!game.pet&&game.player.mp<game.spells[companionSpell].cost){if(mob.rootUntil<=game.clock&&game.player.mp>=game.spells[3].cost)cast(3);if(mob.rootUntil>game.clock){game.toggleMeditate();tick(3);game.toggleMeditate();}else tick(1);continue;}
      if (!game.pet) assert.ok(cast(companionSpell),'Cannot replace lost companion '+label+' '+game.player.mp+' '+game.logs.slice(-12).map(l=>l.text).join(' | '));
      if(!game.pet.targetId)game.commandPet('attack');
      lowestPet=Math.min(lowestPet,game.pet.hp);
      if(classId==='necromancer'&&game.player.mp<30&&game.player.hp>game.player.maxHp*.65&&game.spellCooldownRemaining(7)===0&&cast(7))continue;
      if(classId==='druid'&&game.player.hp<game.player.maxHp*.65&&!game.regeneration&&cast(7))continue;
      if (mob.intent && game.player.mp>=SPELLS[3].cost && cast(3)) { report.interruptions++; continue; }
      if(mob.intent){const intent=mob.intent,dx=game.player.x-intent.x,dy=game.player.y-intent.y,d=Math.hypot(dx,dy)||1;if(d<intent.radius+25){game.moveTo(intent.x,intent.y+intent.radius+50);while(game.moveTarget)tick(.05);continue;}}
      if (game.pet.hp < game.pet.maxHp*.55 && game.player.mp>=SPELLS[4].cost && cast(4)) continue;
      if (game.pet.tauntReadyAt<=game.clock) game.commandPet('taunt');
      if (game.player.hp<game.player.maxHp*.45) game.useSupply('health-tonic');
      if (game.player.mp<SPELLS[1].cost) game.useSupply('mana-tonic');
      if (mob.dotUntil <= game.clock && game.player.mp >= SPELLS[2].cost && mob.hp > game.spellProfile(1).damage * 2) { cast(2); continue; }
      if(game.player.mp<80&&game.pet&&mob.dotUntil>game.clock){tick(1);continue;}
      if (!cast(1)) tick(.5);
    }
    assert.ok(!mob.alive,'Encounter did not finish: '+label);
    report.fights.push({label, level:game.player.level, seconds:+(game.clock-start).toFixed(2), startingLevel:startLevel, startingHealth:Math.round(startHp), endingHealth:Math.round(game.player.hp), startingMana:Math.round(startMana), endingMana:Math.round(game.player.mp), lowestPetHp:Math.round(lowestPet)});
    game.commandPet('follow'); gear();
  };
  assert.ok(game.acceptQuest('scout-road').ok);
  const initial=game.mobs.filter(m=>m.campId==='briar');
  const routes=[[[480,350]],[[480,100],[710,100]],[[480,100],[850,100],[850,160]],[[480,650],[710,650]]];
  const returns=[[[260,250]],[[480,100],[260,250]],[[850,100],[480,100],[260,250]],[[480,650],[260,250]]];
  for(let i=0;i<4;i++) { restore(); travel(routes[i]); fight(initial[i],initial[i].name); travel(returns[i]); }
  assert.ok(game.turnInQuest('scout-road').ok);gear();
  assert.ok(game.acceptQuest('griks-talisman').ok);assert.ok(game.turnInQuest('griks-talisman').ok);gear();
  report.milestones.push({quest:'griks-talisman',level:game.player.level,kills:game.player.kills,copper:game.player.gold});
  // Study a companion rank at the village, then walk to Liora for the next task.
  assert.ok(game.buyUpgrade(companionSpell).ok); travel([[400,325]]); for(let i=0;i<2;i++) assert.ok(game.buySupply('mana-tonic').ok); travel([[180,320]]);assert.ok(game.acceptQuest('mossfang').ok);travel([[260,250]]);
  restore();travel([[480,650],[900,700],[1054,700]]);
  fight(game.mobs.find(m=>m.campId==='mossfang'&&m.named),'Bramblemaw');
  travel([[900,700],[480,650],[260,250],[180,320]]);assert.ok(game.turnInQuest('mossfang').ok);gear();
  report.milestones.push({quest:'mossfang',level:game.player.level,kills:game.player.kills,copper:game.player.gold});
  travel([[260,250]]);assert.ok(game.acceptQuest('crypt-proof').ok);restore();
  if (verifyRecovery) {
    const inventory = [...game.player.inventory], level = game.player.level;
    game.commandPet('follow'); travel([[480,350],[590,350]]);
    // Deliberately remain beside a live guard without fighting back. This is
    // a normal gameplay death, not an injected HP value or private damage call.
    for (let i=0;!game.dead && i<2400;i++)game.update(.05);
    assert.equal(game.dead,true,'The unprotected player must be vulnerable to a guard');
    const debt = game.player.debt;
    assert.ok(debt>0);assert.ok(game.revive().ok);
    assert.equal(game.player.level,level);assert.deepEqual(game.player.inventory,inventory);
    assert.equal(game.questState('crypt-proof').status,'active');
    report.recovery={validated:true,debtAdded:debt,levelRetained:level,itemsRetained:inventory.length};
    restore();
  }
  // Save/reload before leaving the village, then re-summon through normal casting.
  const saved=game.serialize();game=new Game({save:saved,random});assert.equal(game.questState('crypt-proof').status,'active');restore();
  travel([[480,650],[900,700],[1050,1120],[1294,1180]]);
  fight(game.mobs.find(m=>m.campId==='crypt'&&m.named),'The Bonewarden');
  travel([[1050,1120],[900,700],[480,650],[260,250]]);
  assert.ok(game.turnInQuest('crypt-proof').ok);gear();
  report.milestones.push({quest:'crypt-proof',level:game.player.level,kills:game.player.kills,copper:game.player.gold});
  report.completed=game.activeQuests.length===0 && game.questState('crypt-proof').status==='completed';
  report.final={level:game.player.level,kills:game.player.kills,gold:game.player.gold,equipment:game.player.equipment,inventory:game.player.inventory};
  if (includeSave) report.save = game.serialize();
  return report;
}
if(require.main===module) console.log(JSON.stringify(runExpedition(),null,2));
module.exports={runExpedition};
