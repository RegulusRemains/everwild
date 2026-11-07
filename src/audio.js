/* Designed one-shot instruments: sustained bodies, material transients and bounded mix. */
(function(root){
 'use strict';
 const TAU=Math.PI*2;
 const lengths={'step-grass':.2,'step-water':.25,'step-snow':.22,'step-stone':.2,fire: .58,'fire-hit':.48,frost:.62,'frost-hit':.58,grave:.75,nature:.64,flesh:.42,stone:.5,wood:.48,melee:.24,nova:1.15,summon:1.45,root:.64,heal:.95,shield:.72,taunt:.65};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function soundFor(e){
  const dark=e.school==='necromancer',wild=e.school==='druid';
  if(e.kind==='step')return e.surface==='mire'?'step-water':e.surface==='rime'?'step-snow':e.surface==='cinder'?'step-stone':'step-grass';
  if(e.kind==='cast')return dark?'charge-grave':wild?'charge-nature':'charge-arcane';
  if(e.kind==='bolt')return e.spellIndex===8?'frost':dark?'grave':wild?'nature':'fire';
  if(e.kind==='impact')return e.source==='enemy'?'flesh':e.source==='pet'?(dark?'stone':wild?'wood':'stone'):e.spellIndex===8?'frost-hit':e.spellIndex===1?(dark?'grave':wild?'nature':'fire-hit'):'flesh';
  if(e.kind==='melee')return 'melee';
  if(e.kind==='heal')return e.spellIndex===6?'shield':'heal';
  return Object.hasOwn(lengths,e.kind)?e.kind:null;
 }
 function renderSound(name,sampleRate=48000,variant=0,chargeDuration=1.7){
  const charging=name.startsWith('charge-'),duration=charging?clamp(chargeDuration,.4,4):lengths[name]||.5;
  const data=new Float32Array(Math.ceil(sampleRate*duration));
  let seed=(37129+variant*1499+Array.from(name).reduce((n,c)=>n+c.charCodeAt(0),0))>>>0,low=0,bodyNoise=0,previous=0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
  const pitch=1+(variant-1)*.018;
  const sine=(f,t)=>Math.sin(TAU*f*t*pitch);
  const fall=(f0,f1,t,length=duration)=>Math.sin(TAU*pitch*(f0*t+(f1-f0)*t*t/(2*length)));
  const envelope=(t,attack,hold,release)=>t<attack?t/attack:t<hold?1:Math.exp(-(t-hold)/release);
  const snap=(t,at,strength)=>{const x=t-at;return x<0?0:strength*Math.exp(-x*100);};
  for(let i=0;i<data.length;i++){
   const t=i/sampleRate,u=t/duration,n=random();low+=.22*(n-low);bodyNoise+=.026*(n-bodyNoise);const grit=low-bodyNoise,air=n-low;
   let value=0;
   if(charging){
    const dark=name==='charge-grave',wild=name==='charge-nature',rise=.18+.82*u;
    value=(grit*.65+air*.06+(sine(dark?110:wild?260:185,t)+sine(dark?114:wild?390:277,t))*.10)*rise*envelope(t,.035,duration-.08,.025);
   }else if(name.startsWith('step-')){
    const wet=name==='step-water',snow=name==='step-snow';value=(grit*(wet?.6:snow?.9:.55)+bodyNoise*.4+fall(wet?180:125,70,t)*.12)*envelope(t,.001,.02,.035);if(wet)value+=sine(420,t)*.08*Math.exp(-t*28);if(snow)value+=air*.12*Math.exp(-t*30);
   }else if(name==='fire'||name==='fire-hit'){
    const hit=name==='fire-hit';
    const flame=(grit*1.2+air*.12)*( .82+.18*sine(34,t));
    const thump=fall(hit?165:220,65,t)*.35+fall(330,130,t)*.16;
    const crack=(snap(t,0,.9)+snap(t,.046,.45)+snap(t,.11,.25))*n;
    value=(flame+thump)*envelope(t,.002,hit?.045:.12,.12)+crack;
   }else if(name==='frost'||name==='frost-hit'){
    const hit=name==='frost-hit';
    value=(sine(1450,t)*Math.exp(-t*12)+sine(2249,t)*Math.exp(-t*15)*.6+sine(3371,t)*Math.exp(-t*19)*.35)*.24;
    value+=(grit*.85+air*.12)*envelope(t,.002,hit?.03:.09,.11)+fall(290,125,t)*.24*Math.exp(-t*8);
    value+=n*(snap(t,0,.9)+snap(t,.037,.45)+snap(t,.083,.22));
   }else if(name==='grave'){
    const hollow=(sine(145,t)+sine(151,t))*.18+fall(360,115,t)*.16;
    value=(hollow+grit*.8+bodyNoise*.6)*envelope(t,.004,.15,.16)*( .85+.15*sine(23,t));value+=n*snap(t,.008,.45);
   }else if(name==='nature'||name==='wood'||name==='root'){
    const roots=name==='root',wood=name==='wood';
    value=(sine(190,t)*.34+sine(397,t)*.15+sine(613,t)*.07)*Math.exp(-t*(wood?13:8));
    value+=grit*(roots?.8:.48)*envelope(t,.003,.055,.12);
    value+=n*(snap(t,0,.85)+snap(t,roots?.10:.045,.5)+snap(t,roots?.23:.09,.25));
   }else if(name==='flesh'||name==='stone'){
    const stone=name==='stone';
    const fundamental=fall(stone?170:145,stone?85:72,t);
    value=(fundamental*.5+fall(300,145,t)*.24+bodyNoise*.8)*envelope(t,.001,.035,.065);
    value+=(grit*.9+air*.18)*Math.exp(-t*(stone?15:24))+n*snap(t,0,.8);
    if(stone)value+=(sine(710,t)*.13+sine(1091,t)*.08)*Math.exp(-t*12);
   }else if(name==='melee'){
    const swell=Math.sin(Math.PI*clamp(t/.17,0,1));value=(air*.18+grit*.75)*swell*swell*Math.exp(-t*8);
   }else if(name==='nova'){
    value=(fall(100,35,t)*.5+fall(225,90,t)*.28+bodyNoise*1.5)*envelope(t,.001,.07,.19);
    value+=(grit*1.3+air*.2)*envelope(t,.002,.08,.17)+n*(snap(t,0,.75)+snap(t,.035,.4)+snap(t,.085,.25));
   }else if(name==='summon'){
    const swell=Math.sin(Math.PI*clamp(t/.85,0,1));
    value=(sine(82,t)*.27+sine(164,t)*.16+bodyNoise*.9+grit*.45)*swell*envelope(t,.025,.6,.25);
    for(let j=0;j<3;j++){const dt=t-.35-j*.09;if(dt>0)value+=sine([330,495,660][j],dt)*.09*Math.exp(-dt*4);}
   }else if(name==='heal'||name==='shield'){
    for(let j=0;j<4;j++){const dt=t-j*.045;if(dt>0)value+=(sine([392,588,784,1176][j],dt)+sine([398,596,792,1191][j],dt)*.22)*.10*envelope(dt,.004,.05,.19);}
    value+=grit*.25*envelope(t,.01,.07,.12);if(name==='shield')value+=fall(240,120,t)*.18*envelope(t,.002,.035,.12);
   }else if(name==='taunt'){
    value=(sine(150,t)*.3+sine(300,t)*.15+sine(450,t)*.07+grit*.32)*envelope(t,.012,.18,.12)*( .9+.1*sine(19,t));
   }
   // A short fade prevents clicks; DC rejection keeps the body tight on small speakers.
   const fade=clamp((duration-t)/.025,0,1);value*=fade;const high=value-previous+.995*(i?data[i-1]:0);previous=value;data[i]=high;
  }
  let energy=0;const window=Math.min(data.length,Math.round(sampleRate*(name==='summon'?.8:charging?duration:.25)));
  for(let i=0;i<window;i++)energy+=data[i]*data[i];
  const target=name.startsWith('step-')?.085:charging?.12:['heal','shield','melee'].includes(name)?.17:.26;
  const gain=Math.min(8,target/Math.max(.001,Math.sqrt(energy/window)));
  // Calibrated body loudness, with smooth saturation instead of clipped peaks.
  for(let i=0;i<data.length;i++)data[i]=.92*Math.tanh(data[i]*gain/ .92);
  return data;
 }
 class Soundscape{
  constructor(context,volume=.8){
   this.context=context;this.voicesCreated=0;this.cache=new Map();this.serial=0;
   this.master=context.createGain();this.master.gain.value=clamp(volume,0,1);
   this.compressor=context.createDynamicsCompressor();this.compressor.threshold.value=-9;this.compressor.knee.value=8;this.compressor.ratio.value=4;this.compressor.attack.value=.006;this.compressor.release.value=.14;
   this.input=context.createGain();this.input.gain.value=1.7;
   const highpass=context.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=38;highpass.Q.value=.5;
   this.limiter=context.createWaveShaper();const curve=new Float32Array(8192);for(let i=0;i<curve.length;i++){const x=(i/(curve.length-1))*2-1;curve[i]=.94*Math.tanh(x/ .94);}this.limiter.curve=curve;this.limiter.oversample='2x';
   this.input.connect(highpass);highpass.connect(this.compressor);this.compressor.connect(this.master);this.master.connect(this.limiter);this.limiter.connect(context.destination);
   this.reverb=context.createConvolver();const impulse=context.createBuffer(2,Math.floor(context.sampleRate*.65),context.sampleRate);let seed=81;
   for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=(seed/4294967296*2-1)*Math.pow(1-i/d.length,4)*.12;}for(const[t,v]of [[.017,.7],[.031,.4],[.047,.25]])d[Math.floor((t+ch*.002)*context.sampleRate)]+=v;}
   this.reverb.buffer=impulse;const wet=context.createGain();wet.gain.value=.15;this.reverb.connect(wet);wet.connect(this.input);
  }
  setVolume(v){this.master.gain.setTargetAtTime(clamp(v,0,1),this.context.currentTime,.025);}
  buffer(name,variant,duration){
   const key=name+':'+variant+':'+(name.startsWith('charge-')?Math.round(duration*10):'');if(this.cache.has(key))return this.cache.get(key);
   const pcm=renderSound(name,this.context.sampleRate,variant,duration),b=this.context.createBuffer(1,pcm.length,this.context.sampleRate);b.copyToChannel(pcm,0);this.cache.set(key,b);return b;
  }
  sample(name,pan=0,delay=0,duration=1.7,strength=1){
   const c=this.context,source=c.createBufferSource(),gain=c.createGain(),panner=c.createStereoPanner();source.buffer=this.buffer(name,this.serial++%3,duration);panner.pan.value=clamp(pan,-.7,.7);gain.gain.value=strength;
   source.connect(gain);gain.connect(panner);panner.connect(this.input);panner.connect(this.reverb);this.voicesCreated++;source.start(c.currentTime+delay);
   const handle={stop:()=>{gain.gain.setTargetAtTime(.0001,c.currentTime,.025);try{source.stop(c.currentTime+.12);}catch(_){}}};
   source.onended=()=>{source.disconnect();gain.disconnect();panner.disconnect();if(this.charge===handle)this.charge=null;};return handle;
  }
  tone(frequency,delay,duration,volume,endFrequency=frequency,type='sine'){
   const c=this.context,o=c.createOscillator(),g=c.createGain(),start=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(frequency,start);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+duration);g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(volume,start+.003);g.gain.setValueAtTime(volume*.6,start+duration*.25);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(this.input);g.connect(this.reverb);o.start(start);o.stop(start+duration+.02);this.voicesCreated++;o.onended=()=>{o.disconnect();g.disconnect();};
  }
  stopCharge(){this.charge?.stop();this.charge=null;}
  play(event,pan=0,delay=0){const name=soundFor(event);if(!name)return;if(event.kind==='cast'){this.stopCharge();this.charge=this.sample(name,pan,delay,event.duration||1.7);}else this.sample(name,pan,delay,1.7,event.kind==='impact'?clamp(.8+(Number(event.amount)||15)/100,.8,1.4):event.kind==='melee'?.55:1);}
 }
 if(typeof module==='object'&&module.exports)module.exports={Soundscape,renderSound,soundFor};
 if(root.Everwild)root.Everwild.Soundscape=Soundscape;
})(typeof globalThis!=='undefined'?globalThis:this);
