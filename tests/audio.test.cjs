'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const{renderSound,soundFor}=require('../src/audio.js');
function rms(d,start=0,end=d.length/48000){let sum=0,n=0;for(let i=Math.floor(start*48000);i<Math.min(d.length,end*48000);i++){sum+=d[i]*d[i];n++;}return Math.sqrt(sum/Math.max(1,n));}
function spectrum(data){
 const n=8192,re=new Float64Array(n),im=new Float64Array(n),start=7200;
 for(let i=0;i<n;i++)re[i]=(data[start+i]||0)*(.5-.5*Math.cos(2*Math.PI*i/(n-1)));
 for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[re[i],re[j]]=[re[j],re[i]];}
 for(let len=2;len<=n;len<<=1){const angle=-2*Math.PI/len;for(let i=0;i<n;i+=len)for(let j=0;j<len/2;j++){const c=Math.cos(angle*j),s=Math.sin(angle*j),a=i+j,b=a+len/2,tr=re[b]*c-im[b]*s,ti=re[b]*s+im[b]*c;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;}}
 const power=Array.from({length:n/2},(_,i)=>re[i]*re[i]+im[i]*im[i]);
 const band=(lo,hi)=>power.slice(Math.ceil(lo*n/48000),Math.floor(hi*n/48000)).reduce((a,b)=>a+b,0);
 const bins=power.slice(Math.ceil(150*n/48000),Math.floor(7000*n/48000)),mean=bins.reduce((a,b)=>a+b,0)/bins.length;
 const flatness=Math.exp(bins.reduce((a,b)=>a+Math.log(b+mean*1e-14),0)/bins.length)/mean;
 return{flatness,high:band(4200,22000)/band(50,22000),vowel:band(500,1500)/band(50,22000)};
}
test('spell sounds are sustained tonal ah-choirs, without a broadband hiss bed',()=>{
 for(const key of ['fire','frost','grave','nature','summon','nova','root','heal','shield']){
  const d=renderSound(key),s=spectrum(d);assert.ok(d.length>=48000,key+' has a lingering phrase');assert.ok(rms(d)>.025&&rms(d)<.15,key+' has a calm audible body');assert.ok(rms(d,.5,.9)>.02,key+' sustains its vowel');
  assert.ok(s.flatness<.025,key+' must be pitched, not static: '+s.flatness);assert.ok(s.high<.012,key+' must avoid abrasive high-frequency energy');assert.ok(s.vowel>.3,key+' must retain vocal formants');
  let peak=0;for(const v of d){assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));}assert.ok(peak<=.621);
 }
});
test('class phrases remain distinct, gently detuned, and reproducible',()=>{
 const a=renderSound('fire'),b=renderSound('grave'),c=renderSound('nature');assert.notDeepEqual(a,b);assert.notDeepEqual(a,c);assert.notDeepEqual(a,renderSound('fire',48000,1));assert.deepEqual(a,renderSound('fire'));
});
test('round footsteps and combat cues remain quieter than the spell choir',()=>{
 const choir=rms(renderSound('fire'));for(const key of ['flesh','stone','wood','melee','step-grass','step-water','step-snow','step-stone'])assert.ok(rms(renderSound(key))<choir*.65,key+' stays understated');
});
test('events retain distinct class, companion, cold and ward identities',()=>{
 assert.equal(soundFor({kind:'impact',source:'enemy'}),'flesh');assert.equal(soundFor({kind:'impact',source:'pet'}),'stone');assert.equal(soundFor({kind:'bolt',school:'magician',spellIndex:8}),'frost');assert.equal(soundFor({kind:'bolt',school:'necromancer'}),'grave');assert.equal(soundFor({kind:'bolt',school:'druid'}),'nature');assert.equal(soundFor({kind:'cast',school:'necromancer'}),'charge-grave');assert.equal(soundFor({kind:'heal',spellIndex:6}),'shield');
});
