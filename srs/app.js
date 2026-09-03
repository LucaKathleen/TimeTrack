const $=s=>document.querySelector(s);
const KEY='russian-srs-progress-v1';
const META='russian-srs-meta-v1';
let cards=[];let queue=[];let current=null;let revealed=false;
const now=()=>Date.now();
const dayMs=86400000;
const loadJSON=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))||fallback}catch{return fallback}};
let progress=loadJSON(KEY,{});
let meta=loadJSON(META,{xp:0,streak:0,lastStudy:null,totalReviews:0,bossHp:100});
function save(){localStorage.setItem(KEY,JSON.stringify(progress));localStorage.setItem(META,JSON.stringify(meta))}
function today(){return new Date().toISOString().slice(0,10)}
function touchStreak(){const t=today();if(meta.lastStudy===t)return;const y=new Date();y.setDate(y.getDate()-1);const yd=y.toISOString().slice(0,10);meta.streak=meta.lastStudy===yd?(meta.streak||0)+1:1;meta.lastStudy=t}
function pFor(id){return progress[id]||{due:0,interval:0,ease:2.3,reps:0,lapses:0}}
function dueCards(){return cards.filter(c=>pFor(c.id).due<=now()).sort((a,b)=>pFor(a.id).due-pFor(b.id).due)}
function renderStats(){const due=dueCards().length;$('#due').textContent=due;$('#xp').textContent=meta.xp||0;$('#streak').textContent=(meta.streak||0)+'🔥';$('#level').textContent=Math.floor((meta.xp||0)/100)+1;const doneToday=Math.min(20,meta.reviewsToday||0);$('#progressFill').style.width=(doneToday/20*100)+'%';$('#bossHp').style.width=Math.max(0,meta.bossHp||0)+'%';$('#bossText').textContent=(meta.bossHp||0)<=0?'Boss besiegt 👑':'Grammatik-Goblin '+Math.max(0,meta.bossHp||0)+' HP'}
function pick(){queue=dueCards();current=queue[0]||null;revealed=false;renderCard()}
function renderCard(){renderStats();if(!current){$('#study').innerHTML='<div class="empty"><div style="font-size:2.5rem">🧠✨</div><h2>Für jetzt alles erledigt.</h2><p>Die nächsten Chunks kommen automatisch wieder, wenn sie fällig sind.</p><button class="btn primary" id="practiceAny">Trotzdem 1 zufälligen Chunk üben</button></div>';$('#practiceAny')?.addEventListener('click',()=>{current=cards[Math.floor(Math.random()*cards.length)];revealed=false;renderCard()});return}
$('#study').innerHTML=`<div class="card"><button class="tts" id="tts" title="Russisch vorlesen">🔊</button><div class="side">Deutsch → Russisch</div><div class="prompt">${esc(current.de)}</div><div class="answer ${revealed?'show':''}" id="answer"><div class="ru">${esc(current.ru)}</div>${current.note?`<div class="note">${esc(current.note)}</div>`:''}<div class="tags">${(current.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></div><div class="actions">${revealed?`<div class="ratings"><button class="btn again" data-r="again">Nochmal</button><button class="btn hard" data-r="hard">Schwer</button><button class="btn good" data-r="good">Gut</button><button class="btn easy" data-r="easy">Leicht</button></div>`:`<button class="btn primary" id="reveal">Antwort zeigen</button>`}</div>`;
$('#tts')?.addEventListener('click',speak);$('#reveal')?.addEventListener('click',()=>{revealed=true;renderCard()});document.querySelectorAll('[data-r]').forEach(b=>b.addEventListener('click',()=>rate(b.dataset.r))) }
function rate(r){touchStreak();const p=pFor(current.id);let days=0;if(r==='again'){days=0.01;p.interval=0.01;p.ease=Math.max(1.3,p.ease-.2);p.lapses++;gain(4,12)}else if(r==='hard'){days=Math.max(.25,(p.interval||.2)*1.3);p.interval=days;p.ease=Math.max(1.3,p.ease-.1);gain(7,9)}else if(r==='good'){days=p.reps===0?1:p.reps===1?3:Math.max(2,(p.interval||1)*p.ease);p.interval=days;gain(10,7)}else{days=p.reps===0?3:p.reps===1?7:Math.max(4,(p.interval||1)*p.ease*1.3);p.interval=days;p.ease+=.08;gain(14,10)}p.reps++;p.due=now()+days*dayMs;progress[current.id]=p;meta.totalReviews=(meta.totalReviews||0)+1;const t=today();if(meta.reviewsDay!==t){meta.reviewsDay=t;meta.reviewsToday=0}meta.reviewsToday=(meta.reviewsToday||0)+1;save();pick()}
function gain(xp,damage){meta.xp=(meta.xp||0)+xp;meta.bossHp=Math.max(0,(meta.bossHp??100)-damage);if(meta.bossHp===0){setTimeout(()=>{meta.bossHp=100;save();renderStats()},900)}}
function speak(){if(!current||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(current.ru);u.lang='ru-RU';u.rate=.9;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang?.toLowerCase().startsWith('ru'))||null;speechSynthesis.speak(u)}
function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
fetch('./chunks.json?ts='+Date.now()).then(r=>r.json()).then(data=>{cards=data;pick()}).catch(()=>{$('#study').innerHTML='<div class="empty">Chunks konnten nicht geladen werden.</div>'});
