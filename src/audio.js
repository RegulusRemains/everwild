/* Tonal, choir-led fantasy instruments. No noise sources or crackle layers. */
(function(root){
 'use strict';
 const TAU=Math.PI*2;
 const lengths={'step-grass':.18,'step-water':.24,'step-snow':.2,'step-stone':.2,fire:1.6,'fire-hit':.85,frost:1.65,'frost-hit':1.05,grave:1.85,'grave-hit':.95,'nature-hit':.8,nature:1.6,flesh:.28,stone:.4,wood:.34,melee:.3,nova:2.2,summon:2.5,root:1.6,heal:2.1,shield:1.7,taunt:.9};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function soundFor(e){
  const dark=e.school==='necromancer',wild=e.school==='druid';
  if(e.kind==='step')return e.surface==='mire'?'step-water':e.surface==='rime'?'step-snow':e.surface==='cinder'?'step-stone':'step-grass';
  if(e.kind==='cast')return dark?'charge-grave':wild?'charge-nature':'charge-arcane';
  if(e.kind==='bolt')return e.spellIndex===8?'frost':dark?'grave':wild?'nature':'fire';
  if(e.kind==='impact')return e.source==='enemy'?'flesh':e.source==='pet'?(dark?'stone':wild?'wood':'stone'):e.spellIndex===8?'frost-hit':e.spellIndex===1?(dark?'grave-hit':wild?'nature-hit':'fire-hit'):'flesh';
  if(e.kind==='melee')return 'melee';
  if(e.kind==='heal')return e.spellIndex===6?'shield':'heal';
  return Object.hasOwn(lengths,e.kind)?e.kind:null;
 }
 function renderSound(name,sampleRate=48000,variant=0,chargeDuration=1.7){
  const charging=name.startsWith('charge-');
  const duration=charging?clamp(chargeDuration,.4,4):lengths[name]||.5;
  const data=new Float32Array(Math.ceil(sampleRate*duration));
  const tuning=1+(variant-1)*.0012;
  function addVoice(frequency,start,length,amplitude,type='choir'){
   const first=Math.max(0,Math.floor(start*sampleRate)),last=Math.min(data.length,Math.ceil((start+length)*sampleRate));
   const choir=type==='choir',weights=[];
   if(choir){
    let sum=0;
    // Harmonic vocal source shaped by broad /ah/ formants. Periodic energy,
    // unlike the broadband random signal that made the previous bank hiss.
    for(let h=1;h<=24;h++){
     const f=frequency*h;
     const formant=.12+1.5*Math.exp(-.5*((f-720)/180)**2)+1.05*Math.exp(-.5*((f-1120)/220)**2)+.23*Math.exp(-.5*((f-2450)/330)**2);
     const w=formant/Math.pow(h,.85)*Math.exp(-f/4800);weights.push(w);sum+=w;
    }
    for(let i=0;i<weights.length;i++)weights[i]/=sum;
   }
   for(let i=first;i<last;i++){
    const t=(i-first)/sampleRate,u=t/length;
    const attack=choir?Math.min(.2,length*.22):type==='bell'?.022:.012;
    const fadeIn=Math.sin(clamp(t/attack,0,1)*Math.PI/2)**2;
    const fadeOut=Math.sin(clamp((length-t)/(choir?Math.min(.7,length*.6):.12),0,1)*Math.PI/2)**2;
    const f=frequency*tuning;
    const phase=TAU*f*(t-.012*.16*(1-Math.exp(-t/.16)))+.0018*f/4.7*Math.sin(TAU*4.7*t);
    let voice;
    if(choir){
     const c=2*Math.cos(phase);let previous=0,current=Math.sin(phase),total=0;
     for(let h=0;h<weights.length;h++){total+=current*weights[h];const next=c*current-previous;previous=current;current=next;}
     voice=total*(.86+.14*Math.sin(Math.PI*u));
    }else if(type==='bell'){
     const fm=.42*Math.exp(-t*6)*Math.sin(phase*2.005);
     voice=(Math.sin(phase+fm)+.12*Math.sin(phase*2.01)+.025*Math.sin(phase*3.005))*Math.exp(-t/(length*.42));
    }else{
     voice=(Math.sin(phase)+.22*Math.sin(phase*2)+.045*Math.sin(phase*3))*Math.exp(-t/(length*.22));
    }
    data[i]+=voice*amplitude*fadeIn*fadeOut;
   }
  }
  const ah=(notes,amp=.4,length=duration)=>notes.forEach((f,i)=>addVoice(f,i*.025,length-i*.025,amp/Math.sqrt(notes.length),'choir'));
  const bell=(f,at,amp=.07,length=.85)=>addVoice(f,at,Math.min(length,duration-at),amp,'bell');
  if(charging){
   ah(name==='charge-grave'?[110,164.814]:name==='charge-nature'?[130.813,196]:[130.813,164.814,196],.34);
  }else if(name.startsWith('step-')){
   addVoice(name==='step-water'?174.614:name==='step-snow'?196:name==='step-stone'?110:130.813,0,duration,.055,'pluck');
  }else if(name==='fire'){
   ah([164.814,196],.43);bell(523.251,.12,.065);bell(659.255,.25,.045);
  }else if(name==='frost'){
   ah([196,261.626],.37);bell(783.991,.06,.07,1.1);bell(1046.502,.2,.045,1);
  }else if(name==='grave'){
   ah([110,130.813,164.814],.44);bell(329.628,.18,.05,1.1);
  }else if(name==='nature'||name==='root'){
   ah([130.813,196],.39);bell(392,.09,.065);bell(523.251,.23,.05);
  }else if(name==='summon'){
   ah([130.813,164.814,196],.46);[523.251,659.255,783.991].forEach((f,i)=>bell(f,.38+i*.15,.055,1.35));
  }else if(name==='nova'){
   ah([130.813,196,261.626],.46);bell(523.251,.12,.07,1.25);bell(783.991,.3,.045,1.25);
  }else if(name==='heal'){
   ah([164.814,196,261.626],.36);[523.251,659.255,783.991].forEach((f,i)=>bell(f,.08+i*.11,.065,1.2));
  }else if(name==='shield'){
   ah([130.813,196],.4);bell(392,.08,.07,1.05);bell(783.991,.18,.04,1.05);
  }else if(name==='fire-hit'||name==='frost-hit'){
   bell(name==='frost-hit'?783.991:392,0,.13,.7);bell(name==='frost-hit'?1046.502:523.251,.06,.055,.7);
  }else if(name==='grave-hit'||name==='nature-hit'){
   addVoice(name==='grave-hit'?130.813:196,0,duration,.14,'choir');bell(name==='grave-hit'?329.628:523.251,.04,.055,.65);
  }else if(name==='taunt'){
   addVoice(196,0,.55,.17,'pluck');addVoice(261.626,.11,.65,.12,'choir');
  }else if(name==='flesh'||name==='wood'||name==='stone'||name==='melee'){
   addVoice(name==='stone'?98:name==='wood'?164.814:name==='melee'?196:130.813,0,duration,.15,'pluck');
   if(name!=='melee')addVoice(261.626,.015,duration-.015,.035,'pluck');
  }
  // Gentle bandwidth and edges: no clipping/distortion is used to make sounds louder.
  const coefficient=1-Math.exp(-TAU*3800/sampleRate);let low=0,second=0,peak=0;
  for(let i=0;i<data.length;i++){low+=coefficient*(data[i]-low);second+=coefficient*(low-second);data[i]=second;peak=Math.max(peak,Math.abs(second));}
  if(peak>.62)for(let i=0;i<data.length;i++)data[i]*=.62/peak;
  return data;
 }
 class Soundscape{
  constructor(context,volume=.65){
   this.context=context;this.voicesCreated=0;this.cache=new Map();this.serial=0;
   this.master=context.createGain();this.master.gain.value=clamp(volume,0,1);
   this.compressor=context.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.knee.value=12;this.compressor.ratio.value=2.5;this.compressor.attack.value=.025;this.compressor.release.value=.3;
   this.input=context.createGain();this.input.gain.value=1;
   const highpass=context.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=38;highpass.Q.value=.5;
   this.limiter=context.createWaveShaper();const curve=new Float32Array(8192);for(let i=0;i<curve.length;i++){const x=(i/(curve.length-1))*2-1;curve[i]=.94*Math.tanh(x/ .94);}this.limiter.curve=curve;this.limiter.oversample='2x';
   this.input.connect(highpass);highpass.connect(this.compressor);this.compressor.connect(this.master);this.master.connect(this.limiter);this.limiter.connect(context.destination);
   // A warm stereo echo network; the reverb itself contains no noise impulse.
   this.reverb=context.createGain();
   for(const [i,time]of [.071,.089,.113,.127].entries()){
    const delay=context.createDelay(.5),damping=context.createBiquadFilter(),feedback=context.createGain(),wet=context.createGain(),pan=context.createStereoPanner();
    delay.delayTime.value=time;damping.type='lowpass';damping.frequency.value=2200;damping.Q.value=.35;feedback.gain.value=.39;wet.gain.value=.055;pan.pan.value=i%2?.55:-.55;
    this.reverb.connect(delay);delay.connect(damping);damping.connect(feedback);feedback.connect(delay);damping.connect(wet);wet.connect(pan);pan.connect(this.input);
   }
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
  play(event,pan=0,delay=0){const name=soundFor(event);if(!name)return;if(event.kind==='cast'){this.stopCharge();this.charge=this.sample(name,pan,delay,event.duration||1.7);}else this.sample(name,pan,delay,1.7,event.kind==='impact'?clamp(.75+(Number(event.amount)||15)/160,.75,1.2):event.kind==='melee'?.55:1);}
 }
 if(typeof module==='object'&&module.exports)module.exports={Soundscape,renderSound,soundFor};
 if(root.Everwild)root.Everwild.Soundscape=Soundscape;
})(typeof globalThis!=='undefined'?globalThis:this);
