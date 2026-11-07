'use strict';const test=require('node:test'),assert=require('node:assert/strict');const{Game}=require('../src/engine.js');
function party(type='Earth'){const g=new Game({save:{player:{level:1,x:1000,y:1600,inventory:[]}}});g.mobs.forEach(m=>m.alive=false);g._summon(type,1);g.commandPet('follow');return g;}
const tick=(g,s,input)=>{for(let t=0;t<s-1e-7;t+=.05)g.update(.05,input);};
for(const type of ['Earth','Air'])test(type+' reacts after the player moves off, trails movement direction, and settles without jitter',()=>{
 const g=party(type),start={x:g.pet.x,y:g.pet.y};tick(g,.25,{dx:1});assert.equal(g.pet.x,start.x);assert.equal(g.pet.y,start.y,'small movement should not drag the pet');
 tick(g,3,{dx:1});assert.ok(g.player.x-g.pet.x>55,'pet trails eastward movement');assert.ok(Math.hypot(g.pet.x-g.player.x,g.pet.y-g.player.y)<180,'pet keeps up over sustained travel');
 tick(g,2,{dy:-1});assert.ok(g.pet.y-g.player.y>50,'pet trails northward movement instead of staying at a fixed southwest offset');
 tick(g,3);const resting={x:g.pet.x,y:g.pet.y};const gap=Math.hypot(g.pet.x-g.player.x,g.pet.y-g.player.y);assert.ok(gap>=48&&gap<100,'companion rests nearby without standing on the player');tick(g,5);assert.ok(Math.hypot(g.pet.x-resting.x,g.pet.y-resting.y)<.01,'no idle chasing or circling');assert.ok(g.pet.followTrail.length<=128);
});
test('a distant pet catches up continuously rather than snapping to the player',()=>{const g=party();g.pet.x=g.player.x-600;g.pet.y=g.player.y;const start=g.pet.x;tick(g,.3);assert.ok(g.pet.x-start<30,'reaction delay and bounded speed');tick(g,4);assert.ok(Math.hypot(g.pet.x-g.player.x,g.pet.y-g.player.y)<100);assert.ok(Math.hypot(g.pet.x-g.player.x,g.pet.y-g.player.y)>45);});
