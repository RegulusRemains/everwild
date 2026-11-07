'use strict';const test=require('node:test'),assert=require('node:assert/strict');const{renderSound,soundFor}=require('../src/audio.js');
function rms(d,start=0,end=.25){let s=0,n=0;for(let i=Math.floor(start*48000);i<Math.min(d.length,end*48000);i++){s+=d[i]*d[i];n++;}return Math.sqrt(s/Math.max(1,n));}
test('attack instruments retain audible bodies instead of only a short chirp',()=>{
 for(const name of ['fire','fire-hit','frost','frost-hit','grave','nature','flesh','stone','wood','nova']){const d=renderSound(name);assert.ok(rms(d)>.18,name+' attack body');assert.ok(rms(d,.04,.14)>.12,name+' sustained weight');assert.ok(d.every(Number.isFinite));assert.ok(Math.max(...d.map(Math.abs))<.94,'bounded '+name);}
});
test('fire, frost, grave and nature have distinct spectra and small repeat variations',()=>{
 const sounds=['fire','frost','grave','nature'].map(n=>renderSound(n));const roughness=d=>{let x=0,y=0;for(let i=1;i<12000;i++){x+=(d[i]-d[i-1])**2;y+=d[i]**2;}return x/y;};const values=sounds.map(roughness);assert.ok(Math.max(...values)-Math.min(...values)>.1,'different sonic textures');
 const a=renderSound('fire',48000,0),b=renderSound('fire',48000,1);assert.notDeepEqual(a,b);assert.deepEqual(a,renderSound('fire',48000,0),'reproducible instruments');
});
test('event mapping distinguishes hostile hits, pet strikes, frost, fire, and class casting',()=>{
 assert.equal(soundFor({kind:'impact',source:'enemy'}),'flesh');assert.equal(soundFor({kind:'impact',source:'pet'}),'stone');assert.equal(soundFor({kind:'bolt',school:'magician',spellIndex:8}),'frost');assert.equal(soundFor({kind:'bolt',school:'magician',spellIndex:1}),'fire');assert.equal(soundFor({kind:'bolt',school:'necromancer'}),'grave');assert.equal(soundFor({kind:'bolt',school:'druid'}),'nature');assert.equal(soundFor({kind:'cast',school:'necromancer'}),'charge-grave');
});
