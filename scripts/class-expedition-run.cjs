'use strict';
// Fresh-character route using public travel, ability, equipment and quest actions.
const assert=require('node:assert/strict'),{Game,ITEMS}=require('../src/engine.js');
function runClassExpedition(classId,seed=42){
 let state=seed>>>0;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);let g=new Game({random,save:{player:{classId,level:1,inventory:[]}}});
 const report={classId,seed,fights:[],interruptions:0,roots:0,dotTicks:0};
 const tick=s=>{for(let t=0;t<s-1e-7;t+=.05){g.update(.05);assert.ok(!g.dead,classId+' died: '+g.logs.slice(-6).map(x=>x.text).join(' | '));}};
 const cast=i=>{if(i<0)return false;const r=g.castSpell(i);if(!r.ok)return false;tick(g.spells[i].cast+.05);return true;};
 const find=kind=>g.spells.findIndex(a=>(Array.isArray(kind)?kind:[kind]).includes(a.kind)&&g.isSpellUnlocked(g.spells.indexOf(a)));
 const travel=points=>{g.commandPet('follow');for(const[x,y]of points){assert.ok(g.moveTo(x,y).ok);for(let n=0;g.moveTarget&&n<600;n++)tick(.05);assert.ok(!g.moveTarget,'Unreachable waypoint');}};
 const gear=()=>{for(const slot of ['charm','focus','ring','garb']){const items=g.player.inventory.filter(id=>ITEMS[id].slot===slot);items.sort((a,b)=>score(b)-score(a));if(items[0])g.equip(items[0]);}function score(id){const i=ITEMS[id];return(i.stats.hp||0)+(i.stats.mp||0)+(i.stats.power||0)*5+(i.effect?20:0);}};
 const restore=()=>{assert.ok(g.restoreAtBindstone().ok);const summon=find('summon');if(summon>=0)cast(summon);};
 const fight=(mob,label)=>{
  assert.ok(mob?.alive,'Missing '+label);const start=g.clock,startHp=g.player.hp,startMana=g.player.mp;g.setTarget(mob.id);
  const summon=find('summon'),root=find(['root','pull']),interrupt=find(['stun-strike','root','pull','attack-slow']),dot=find(['affliction','bleed']),heal=find('heal'),regen=find('regeneration'),barrier=find('barrier'),ward=find(['ward','evasion']),clarity=find('clarity'),disease=find('disease'),slow=find('attack-slow'),pact=find('pact');
  if(g.characterClass.martial&&mob.named){g.commandPet('follow');g.moveTo(mob.x,mob.y+75);while(g.moveTarget)tick(.05);g.commandPet('taunt');g.moveTo(mob.x,mob.y+220);while(g.moveTarget)tick(.05);tick(1);}
  if(g.characterClass.martial)g.commandPet('attack');else if(g.pet)g.commandPet('attack');
  for(let n=0;mob.alive&&n<1800;n++){
   if(mob.intent&&interrupt>=0&&cast(interrupt)){report.interruptions++;continue;}
   if(mob.intent){const intent=mob.intent,dx=g.player.x-intent.x,dy=g.player.y-intent.y,d=Math.hypot(dx,dy)||1;if(d<intent.radius+25){g.commandPet('guard');g.autoChase=false;g.moveTo(intent.x,intent.y+intent.radius+50);while(g.moveTarget)tick(.05);while(mob.intent)tick(.05);if(g.characterClass.martial)g.commandPet('attack');continue;}}
   if(g.player.hp<g.player.maxHp*.4)g.useSupply('health-tonic');
   if(g.player.mp<30)g.useSupply('mana-tonic');
   if(g.player.hp<g.player.maxHp*.7&&regen>=0&&!g.regeneration&&cast(regen))continue;
   if(g.player.hp<g.player.maxHp*.55&&heal>=0&&cast(heal))continue;
   if(barrier>=0&&g.player.hp<g.player.maxHp*.85&&g.barrier<10&&cast(barrier))continue;
   if(ward>=0&&Math.hypot(mob.x-g.player.x,mob.y-g.player.y)<100&&g.shieldUntil<=g.clock&&g.evasionUntil<=g.clock&&cast(ward))continue;
   if(clarity>=0&&g.clarityUntil<=g.clock&&g.player.mp<g.player.maxMp*.65&&cast(clarity))continue;
   if(g.player.mp<g.player.maxMp*.5&&cast(find('mana-restore')))continue;
   if(pact>=0&&g.player.hp>g.player.maxHp*.7&&g.player.mp<g.player.maxMp*.5&&cast(pact))continue;
   if(summon>=0&&!g.pet&&g.player.mp>65&&cast(summon)){g.commandPet('attack');continue;}
   if(slow>=0&&!(mob.attackSlowUntil>g.clock)&&cast(slow))continue;
   if((!g.characterClass.martial||g.characterClass.attackRange)&&(!g.pet||mob.targetId==='player')&&root>=0&&mob.rootUntil<=g.clock+2&&cast(root)){report.roots++;continue;}
   // Root allows a real retreat; no injected positions or combat outcome.
   if((!g.characterClass.martial||g.characterClass.attackRange)&&Math.hypot(mob.x-g.player.x,mob.y-g.player.y)<130&&root>=0&&mob.rootUntil>g.clock){const dx=g.player.x-mob.x,dy=g.player.y-mob.y,d=Math.hypot(dx,dy)||1;g.commandPet('guard');g.moveTo(g.player.x-dy/d*170,g.player.y+dx/d*170);while(g.moveTarget)tick(.05);continue;}
   if(dot>=0&&mob.dotUntil<=g.clock&&cast(dot))continue;
   if(disease>=0&&!(mob.diseaseUntil>g.clock)&&cast(disease))continue;
   const finish=find('finisher');if(finish>=0&&g.combo>=3&&cast(finish))continue;
   if(g.characterClass.id==='paladin'&&g.combo>=3&&g.player.hp<g.player.maxHp*.7&&cast(find('combo-heal')))continue;
   if(g.characterClass.id==='bard'&&(!g.song||g.player.hp<g.player.maxHp*.65&&g.song.kind!=='song-heal')&&cast(find(g.player.hp<g.player.maxHp*.65?'song-heal':'song-damage')))continue;
   if(g.characterClass.martial){if(!g.autoAttack)g.commandPet('attack');if(g.player.mp>65&&cast(1))continue;}
   else if(g.player.mp>35&&cast(1))continue;
   if(g.pet&&!g.pet.targetId)g.commandPet('attack');
   // Meditate only while a root or companion provides a safe window.
   if(!g.characterClass.martial&&g.player.mp<65&&(g.pet||mob.rootUntil>g.clock+3)){g.toggleMeditate();tick(2);g.toggleMeditate();}else tick(.35);
  }
  assert.ok(!mob.alive,classId+' could not finish '+label+' '+JSON.stringify({hp:g.player.hp,mp:g.player.mp,mob:mob.hp}));report.fights.push({label,seconds:+(g.clock-start).toFixed(2),startingHealth:Math.round(startHp),endingHealth:Math.round(g.player.hp),startingMana:Math.round(startMana),endingMana:Math.round(g.player.mp)});g.commandPet('follow');gear();
 };
 assert.ok(g.acceptQuest('scout-road').ok);
 const mobs=g.mobs.filter(m=>m.campId==='briar');const routes=[[[480,350]],[[480,100],[710,100]],[[480,100],[850,100],[850,160]],[[480,650],[710,650]]],returns=[[[260,250]],[[480,100],[260,250]],[[850,100],[480,100],[260,250]],[[480,650],[260,250]]];
 for(let i=0;i<4;i++){restore();travel(routes[i]);fight(mobs[i],mobs[i].name);travel(returns[i]);}
 assert.ok(g.turnInQuest('scout-road').ok);gear();assert.ok(g.acceptQuest('griks-talisman').ok);assert.ok(g.turnInQuest('griks-talisman').ok);gear();travel([[180,320]]);assert.ok(g.acceptQuest('mossfang').ok);travel([[260,250]]);restore();travel([[480,650],[900,700],[1054,700]]);fight(g.mobs.find(m=>m.campId==='mossfang'&&m.named),'Bramblemaw');travel([[900,700],[480,650],[260,250],[180,320]]);assert.ok(g.turnInQuest('mossfang').ok);gear();travel([[260,250]]);assert.ok(g.acceptQuest('crypt-proof').ok);restore();
 const saved=g.serialize();g=new Game({random,save:saved});assert.equal(g.player.classId,classId);restore();travel([[480,650],[900,700],[1050,1120],[1294,1180]]);fight(g.mobs.find(m=>m.campId==='crypt'&&m.named),'The Bonewarden');travel([[1050,1120],[900,700],[480,650],[260,250]]);assert.ok(g.turnInQuest('crypt-proof').ok);report.completed=g.questState('crypt-proof').status==='completed';report.finalLevel=g.player.level;return report;
}
module.exports={runClassExpedition};if(require.main===module){const{CLASSES}=require('../src/engine.js');for(const c of Object.values(CLASSES).filter(c=>c.skills)){try{const r=runClassExpedition(c.id);console.log(c.id,JSON.stringify(r.fights.map(f=>[f.label,f.seconds])),r.completed);}catch(e){console.error(c.id,e.message);process.exitCode=1;}}}
