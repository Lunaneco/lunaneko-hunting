export class Soundscape {
  constructor(){this.ctx=null;this.enabled=true;this.music=true;this.next=0;this.beat=0;this.master=null;this.musicLevel=.17;}
  init(){
    if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.34:0;this.master.connect(this.ctx.destination);}catch{return;}}
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  }
  setEnabled(value){this.enabled=value;if(this.master)this.master.gain.setTargetAtTime(value?.34:0,this.ctx.currentTime,.05);}
  tone(freq,duration=.15,type='sine',volume=.3,delay=0,end=null){
    if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(30,end),t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  play(name){
    if(!this.enabled)return;
    if(name==='attack')this.tone(540,.12,'sine',.1,0,180);
    if(name==='shot'){this.tone(720,.055,'sawtooth',.075,0,95);this.tone(180,.11,'triangle',.11,0,55);}
    if(name==='hit')this.tone(180,.07,'triangle',.15,0,70);
    if(name==='collect')this.tone(1300,.09,'sine',.035);
    if(name==='dash')this.tone(300,.2,'sine',.16,0,950);
    if(name==='hurt'){this.tone(125,.2,'sawtooth',.14,0,48);}
    if(name==='switch'){[440,660,880].forEach((n,i)=>this.tone(n,.22,'sine',.13,i*.055));}
    if(name==='upgrade'||name==='wave'){[392,494,587,784].forEach((n,i)=>this.tone(n,.7,'sine',.2,i*.1));}
    if(name==='ultimateGun'){[220,330,660].forEach((n,i)=>this.tone(n,.25,'sawtooth',.06,i*.06));}
    if(name==='ultimate'){[130,196,261,392,523,784,1046].forEach((n,i)=>this.tone(n,1.6,'triangle',.14,i*.055));}
    if(name==='victory'){[392,494,587,784,740,784,988].forEach((n,i)=>this.tone(n,.9,'sine',.25,i*.17));}
    if(name==='defeat'){[330,294,247,196].forEach((n,i)=>this.tone(n,.8,'sine',.15,i*.2));}
    if(name==='click')this.tone(880,.1,'sine',.1);
  }
  tick(playing){
    if(!this.ctx||!this.music||!this.enabled||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime;if(now<this.next)return;this.next=now+.48;
    const melody=[392,0,587,659,784,0,659,587,494,0,587,0,440,0,392,0,330,0,494,587,659,0,587,494,440,0,392,0,294,0,330,0];
    const note=melody[this.beat%melody.length];if(note)this.tone(note,1.4,'sine',playing?.075:.095);
    if(this.beat%8===0){const root=[196,164.81,130.81,146.83][Math.floor(this.beat/8)%4];this.tone(root,3.5,'sine',.08);this.tone(root*1.5,3,'sine',.045);}
    this.beat++;
  }
}
