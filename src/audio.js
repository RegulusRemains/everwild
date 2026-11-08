/* Soft chimes and quiet sine pads. No noise sources or crackle layers. */
(function(root){
 'use strict';
 const TAU=Math.PI*2;
 const lengths={'step-grass':.18,'step-water':.24,'step-snow':.2,'step-stone':.2,fire:.72,'fire-hit':.85,frost:.85,'frost-hit':1.05,grave:.8,'grave-hit':.45,'nature-hit':.45,nature:.75,flesh:.28,stone:.4,wood:.34,melee:.3,nova:1.3,summon:1.8,root:.8,heal:.95,shield:.85,taunt:.45,'pet-strike':.22};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function soundFor(e){
  const dark=['necromancer','shadowknight'].includes(e.school),wild=['druid','ranger','shaman'].includes(e.school);
  if(e.kind==='step')return e.surface==='mire'?'step-water':e.surface==='rime'?'step-snow':e.surface==='cinder'?'step-stone':'step-grass';
  if(e.kind==='cast')return dark?'charge-grave':wild?'charge-nature':'charge-arcane';
  if(e.kind==='bolt'&&e.sourceId?.startsWith('pet-'))return 'pet-strike';
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
   // Three gently weighted partials: no formant stack, brass buzz, or pitch scoop.
   if(choir)weights.push(.94,.05,.01);
   for(let i=first;i<last;i++){
    const t=(i-first)/sampleRate,u=t/length;
    const attack=choir?Math.min(.2,length*.22):type==='bell'?.022:.012;
    const fadeIn=Math.sin(clamp(t/attack,0,1)*Math.PI/2)**2;
    const fadeOut=Math.sin(clamp((length-t)/(choir?Math.min(.7,length*.6):.12),0,1)*Math.PI/2)**2;
    const f=frequency*tuning;
    const phase=TAU*f*t;
    let voice;
    if(choir){
     const c=2*Math.cos(phase);let previous=0,current=Math.sin(phase),total=0;
     for(let h=0;h<weights.length;h++){total+=current*weights[h];const next=c*current-previous;previous=current;current=next;}
     voice=total*(.86+.14*Math.sin(Math.PI*u));
    }else if(type==='bell'){
     const fm=.08*Math.exp(-t*6)*Math.sin(phase*2.005);
     voice=(Math.sin(phase+fm)+.025*Math.sin(phase*2.01))*Math.exp(-t/(length*.42));
    }else{
     voice=(Math.sin(phase)+.22*Math.sin(phase*2)+.045*Math.sin(phase*3))*Math.exp(-t/(length*.22));
    }
    data[i]+=voice*amplitude*fadeIn*fadeOut;
   }
  }
  const ah=(notes,amp=.4,length=duration)=>notes.forEach((f,i)=>addVoice(f,i*.025,length-i*.025,amp/Math.sqrt(notes.length),'choir'));
  const bell=(f,at,amp=.07,length=.85)=>addVoice(f,at,Math.min(length,duration-at),amp,'bell');
  if(charging){
   // One nearly subliminal note, not a repeated chord or fanfare.
   addVoice(name==='charge-grave'?164.814:196,0,duration,.018,'choir');
  }else if(name.startsWith('step-')){
   addVoice(name==='step-water'?174.614:name==='step-snow'?196:name==='step-stone'?110:130.813,0,duration,.025,'pluck');
  }else if(name==='summon'||name==='nova'){
   ah(name==='summon'?[196,293.665]:[261.626,392],.03);
   bell(659.255,.08,.065,1);bell(783.991,.28,.035,1);
  }else if(name==='fire'){
   bell(523.251,0,.085,.65);bell(659.255,.11,.035,.55);
  }else if(name==='frost'){
   bell(783.991,0,.075,.75);bell(1046.502,.1,.03,.65);
  }else if(name==='grave'){
   bell(329.628,0,.08,.7);bell(493.883,.12,.03,.55);
  }else if(name==='nature'||name==='root'){
   bell(392,0,.08,.65);bell(587.33,.1,.035,.6);
  }else if(name==='heal'||name==='shield'){
   bell(name==='heal'?659.255:392,0,.075,.8);bell(783.991,.16,.03,.7);
  }else if(name.endsWith('-hit')){
   bell(name==='frost-hit'?783.991:name==='grave-hit'?329.628:523.251,0,.045,.4);
  }else if(name==='taunt'){
   addVoice(196,0,duration,.045,'pluck');
  }else if(name==='pet-strike'||name==='flesh'||name==='wood'||name==='stone'||name==='melee'){
   addVoice(name==='stone'?98:name==='wood'?164.814:name==='melee'?196:130.813,0,duration,name==='pet-strike'?.018:.055,'pluck');
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
