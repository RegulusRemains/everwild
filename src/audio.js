/* Layered, bounded Web Audio instruments. Works with live and OfflineAudioContext. */
(function(root){
 'use strict';
 class Soundscape{
  constructor(context,volume=.65){
   this.context=context;this.voicesCreated=0;this.master=context.createGain();this.master.gain.value=volume*4;
   this.compressor=context.createDynamicsCompressor();Object.assign(this.compressor.threshold,{value:-15});this.compressor.knee.value=12;this.compressor.ratio.value=5;this.compressor.attack.value=.004;this.compressor.release.value=.2;
   this.master.connect(this.compressor);this.compressor.connect(context.destination);
   this.reverb=context.createConvolver();const impulse=context.createBuffer(2,Math.floor(context.sampleRate*.85),context.sampleRate);
   let seed=8149;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=(random()*2-1)*Math.pow(1-i/data.length,3)*.45;}
   this.reverb.buffer=impulse;const wet=context.createGain();wet.gain.value=.13;this.reverb.connect(wet);wet.connect(this.master);
   this.noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=random()*2-1;
  }
  setVolume(value){this.master.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*4,this.context.currentTime,.025);}
  envelope(source,duration,volume,delay=0,pan=0){
   const c=this.context,start=c.currentTime+delay,gain=c.createGain(),panner=c.createStereoPanner();panner.pan.value=Math.max(-.8,Math.min(.8,pan));gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
   source.connect(gain);gain.connect(panner);panner.connect(this.master);panner.connect(this.reverb);this.voicesCreated++;
   source.start(start);source.stop(start+duration+.025);source.onended=()=>{source.disconnect();gain.disconnect();panner.disconnect();};return start;
  }
  tone(frequency,delay,duration,volume,endFrequency=frequency,type='sine',pan=0){
   const osc=this.context.createOscillator();osc.type=type;const start=this.envelope(osc,duration,volume,delay,pan);osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+duration);
  }
  noise(duration,volume,from,to,delay=0,pan=0){
   const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter();source.buffer=this.noiseBuffer;filter.type='lowpass';filter.Q.value=.75;source.connect(filter);
   // Envelope owns the timed source; the filter sits before the stereo output.
   const start=c.currentTime+delay,gain=c.createGain(),panner=c.createStereoPanner();panner.pan.value=pan;filter.frequency.setValueAtTime(from,start);filter.frequency.exponentialRampToValueAtTime(to,start+duration);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);filter.connect(gain);gain.connect(panner);panner.connect(this.master);panner.connect(this.reverb);this.voicesCreated++;source.start(start);source.stop(start+duration+.02);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();};
  }
  play(event,pan=0){
   const tone=(f,d,v,to=f,delay=0,type='sine')=>this.tone(f,delay,d,v,to,type,pan),noise=(d,v,from,to,delay=0)=>this.noise(d,v,from,to,delay,pan);
   const dark=event.school==='necromancer',wild=event.school==='druid';
   if(event.kind==='cast'){tone(dark?80:wild?196:130,.55,.07,dark?155:wild?294:260);tone(dark?161:390,.4,.025,520,.13,'triangle');noise(.35,.035,300,1600);}
   else if(event.kind==='impact'){const enemy=event.source==='enemy';tone(enemy?100:165,enemy?.28:.19,enemy?.24:.12,enemy?36:60);noise(enemy?.22:.12,enemy?.24:.13,enemy?1500:2600,90);noise(.055,.065,6000,650,.02);}
   else if(event.kind==='bolt'){const frost=event.spellIndex===8;tone(dark?145:frost?640:230,.28,.11,dark?65:frost?220:72);noise(.34,.18,frost?7000:dark?1400:3800,180);tone(frost?1440:dark?320:820,.24,.04,frost?690:190,.1,'triangle');}
   else if(event.kind==='summon'){tone(55,.95,.18,130);tone(110,.7,.09,220,.12,'triangle');for(const [i,f]of [330,440,660].entries())tone(dark?f*.6:f,.65,.065,f*1.1,.16+i*.1);noise(.7,.12,900,2200);}
   else if(event.kind==='nova'){tone(75,.65,.25,28);noise(.65,.28,4800,100);tone(dark?150:310,.42,.09,90,.05,'triangle');}
   else if(event.kind==='root'){noise(.3,.17,1900,240);tone(wild?260:180,.35,.09,75);noise(.09,.10,4500,500,.14);}
   else if(event.kind==='heal'){for(const [i,f]of [392,587,784].entries())tone(dark?f*.65:f,.65,.065,f*1.02,i*.07);noise(.25,.035,3000,900);}
   else if(event.kind==='taunt'){tone(150,.38,.15,230,0,'triangle');noise(.18,.08,700,250);}
  }
 }
 root.Everwild.Soundscape=Soundscape;
})(typeof globalThis!=='undefined'?globalThis:this);
