export const LEVELS=['easy','medium','hard'];
export function poolFor(words,category,level){return words.filter(w=>(category==='All'||w.category===category)&&(level==='mixed'||w.level===level));}
export function shuffle(a,random=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export class Deck{constructor(pool,seen=[],random=Math.random){this.pool=pool;this.seen=new Set(seen);this.random=random;this.refills=0;this.queue=shuffle(pool.filter(w=>!this.seen.has(w.word)),random);}
 next(){if(!this.pool.length)return null;if(!this.queue.length){for(const w of this.pool)this.seen.delete(w.word);this.queue=shuffle(this.pool,this.random);this.refills++;}const w=this.queue.pop();this.seen.add(w.word);return w;}}
export function parseWords(text,existing,level){if(!LEVELS.includes(level))throw Error('Choose a difficulty.');const seen=new Set(existing.map(w=>w.word.toLocaleLowerCase())),words=[];let invalid=0,duplicates=0;const parts=text.replace(/^\uFEFF/,'').split(/[\r\n,;]+/);for(const part of parts){const word=part.trim().normalize('NFC').toLocaleLowerCase();if(!word)continue;if(!/^\p{L}[\p{L}\p{M}]{1,39}$/u.test(word)){invalid++;continue;}if(seen.has(word)){duplicates++;continue;}seen.add(word);words.push({word,category:'Custom',level});}return {words,invalid,duplicates};}
export function pitch(g){if(!g||![g.x,g.y,g.z].every(Number.isFinite))return null;const n=Math.hypot(g.x,g.y,g.z);if(n<6||n>14)return null;return Math.asin(Math.max(-1,Math.min(1,g.z/n)))*180/Math.PI;}
export const SENSITIVITY={gentle:{trigger:22,neutral:14,hold:90,cooldown:400},balanced:{trigger:28,neutral:16,hold:110,cooldown:500},deliberate:{trigger:38,neutral:18,hold:140,cooldown:650}};
export class TiltGate{
 constructor(sensitivity='balanced'){this.base=0;this.filtered=null;this.lastSample=null;this.last=-Infinity;this.setSensitivity(sensitivity);this.reset();}
 setSensitivity(name){this.config=SENSITIVITY[name]||SENSITIVITY.balanced;this.reset();}
 calibrate(samples){if(samples.length<6||samples.some(x=>!Number.isFinite(x)))throw Error('Waiting for steady motion data. Hold the phone upright.');const avg=samples.reduce((a,b)=>a+b,0)/samples.length;if(Math.max(...samples)-Math.min(...samples)>12||Math.abs(avg)>40)throw Error('Hold the screen upright and still, facing your friends.');this.base=avg;this.filtered=avg;this.lastSample=null;this.last=-Infinity;this.reset();}
 reset(){this.armed=false;this.neutralSince=null;this.holdSince=null;this.sign=0;}
 update(angle,now,allowTrigger=true){if(!Number.isFinite(angle)||!Number.isFinite(now))return null;
  const dt=this.lastSample===null?50:Math.max(0,now-this.lastSample);if(dt>500)this.reset();this.lastSample=now;
  const blend=1-Math.exp(-Math.min(dt,200)/50);this.filtered=this.filtered===null?angle:this.filtered+(angle-this.filtered)*blend;
  const delta=this.filtered-this.base,c=this.config;
  if(Math.abs(delta)<c.neutral){this.holdSince=null;this.sign=0;if(this.neutralSince===null)this.neutralSince=now;if(now-this.neutralSince>=140&&now-this.last>=c.cooldown)this.armed=true;return null;}
  this.neutralSince=null;
  // Continue observing neutral during feedback, but never queue an unseen-card tilt.
  if(!allowTrigger){this.reset();return null;}
  if(!this.armed||Math.abs(delta)<c.trigger){this.holdSince=null;return null;}
  const sign=Math.sign(delta);if(this.sign!==sign||this.holdSince===null){this.sign=sign;this.holdSince=now;return null;}if(now-this.holdSince<c.hold)return null;this.last=now;this.reset();return sign;
 }
}
export class Round{
 constructor(deck,duration,now){this.deck=deck;this.remaining=duration*1000;this.end=now+this.remaining;this.paused=false;this.done=false;this.records=[];this.card=deck.next();if(!this.card)this.done=true;}
 left(now){return Math.max(0,this.paused?this.remaining:this.end-now);}
 mark(status,now){if(this.done||this.paused||this.left(now)<=0||!['correct','skip'].includes(status))return false;this.records.push({...this.card,status});this.card=this.deck.next();return true;}
 pause(now){if(this.done||this.paused)return;this.remaining=this.left(now);this.paused=true;}
 resume(now){if(!this.paused||this.done)return;this.end=now+this.remaining;this.paused=false;}
 finish(){this.done=true;}
 get score(){return this.records.filter(w=>w.status==='correct').length;}
}
