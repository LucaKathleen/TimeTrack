const $=s=>document.querySelector(s);
const KEY='russian-srs-progress-v1';
const META='russian-srs-meta-v1';
const LOCAL='russian-srs-local-cards-v1';
let cards=[];let remoteCards=[];let localCards=[];let queue=[];let current=null;let revealed=false;
const now=()=>Date.now();
const dayMs=86400000;
const loadJSON=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))||fallback}catch{return fallback}};
let progress=loadJSON(KEY,{});
let meta=loadJSON(META,{xp:0,lastStudy:null,totalReviews:0});
localCards=loadJSON(LOCAL,[]);
function save(){localStorage.setItem(KEY,JSON.stringify(progress));localStorage.setItem(META,JSON.stringify(meta));localStorage.setItem(LOCAL,JSON.stringify(localCards))}
function today(){return new Date().toISOString().slice(0,10)}
function touchStudy(){meta.lastStudy=today()}
function pFor(id){return progress[id]||{due:0,interval:0,ease:2.3,reps:0,lapses:0}}
function dueCards(){return cards.filter(c=>pFor(c.id).due<=now()).sort((a,b)=>pFor(a.id).due-pFor(b.id).due)}
function gardenState(){const n=meta.totalReviews||0;const stages=[
 {at:0,icon:'🌱',title:'Ein kleiner Anfang',text:'Jede Wiederholung gießt deinen Garten.'},
 {at:10,icon:'🌱🌿',title:'Die ersten Blätter',text:'Dein Garten wächst einfach durchs Dranbleiben.'},
 {at:30,icon:'🌿🌷',title:'Es wird grün',text:'Vergessen ist erlaubt. Wiederkommen zählt.'},
 {at:60,icon:'🌿🌷🌼',title:'Die ersten Blumen',text:'Viele kleine Wiederholungen werden sichtbar.'},
 {at:100,icon:'🌳🌷🌼',title:'Ein richtiger Garten',text:'Deine Chunks schlagen Wurzeln.'},
 {at:180,icon:'🌳🌸🌻🪴',title:'Dein Garten blüht',text:'Nicht Perfektion, sondern Wiederkehr lässt ihn wachsen.'},
 {at:300,icon:'🌲🌳🌸🌻🪴',title:'Sprachgarten',text:'Hier steckt richtig viel Wiederholung drin.'}
 ];
 let i=0;for(let x=0;x<stages.length;x++)if(n>=stages[x].at)i=x;const cur=stages[i],next=stages[i+1];const pct=next?Math.min(100,Math.max(0,(n-cur.at)/(next.at-cur.at)*100)):100;return{...cur,pct,nextAt:next?.at};}
function renderStats(){const due=dueCards().length;$('#due').textContent=due;$('#xp').textContent=meta.xp||0;$('#reviews').textContent=meta.totalReviews||0;$('#level').textContent=Math.floor((meta.xp||0)/100)+1;const doneToday=Math.min(20,meta.reviewsToday||0);$('#progressFill').style.width=(doneToday/20*100)+'%';const g=gardenState();$('#gardenScene').textContent=g.icon;$('#gardenTitle').textContent=g.title;$('#gardenText').textContent=g.nextAt?`${g.text} Noch ${g.nextAt-(meta.totalReviews||0)} Wiederholungen bis zur nächsten Stufe.`:g.text;$('#gardenFill').style.width=g.pct+'%'}
function pick(){queue=dueCards();current=queue[0]||null;revealed=false;renderCard()}
function renderCard(){renderStats();if(!current){$('#study').innerHTML='<div class="empty"><div style="font-size:2.5rem">🧠✨</div><h2>Für jetzt alles erledigt.</h2><p>Die nächsten Chunks kommen automatisch wieder, wenn sie fällig sind.</p><button class="btn primary" id="practiceAny">Trotzdem 1 zufälligen Chunk üben</button></div>';$('#practiceAny')?.addEventListener('click',()=>{if(!cards.length)return;current=cards[Math.floor(Math.random()*cards.length)];revealed=false;renderCard()});return}
$('#study').innerHTML=`<div class="card"><button class="tts" id="tts" title="Russisch vorlesen">🔊</button><div class="side">Deutsch → Russisch</div><div class="prompt">${esc(current.de)}</div><div class="answer ${revealed?'show':''}" id="answer"><div class="ru">${esc(current.ru)}</div>${current.note?`<div class="note">${esc(current.note)}</div>`:''}<div class="tags">${(current.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></div><div class="actions">${revealed?`<div class="ratings"><button class="btn again" data-r="again">Nochmal</button><button class="btn hard" data-r="hard">Schwer</button><button class="btn good" data-r="good">Gut</button><button class="btn easy" data-r="easy">Leicht</button></div>`:`<button class="btn primary" id="reveal">Antwort zeigen</button>`}</div>`;
$('#tts')?.addEventListener('click',speak);$('#reveal')?.addEventListener('click',()=>{revealed=true;renderCard()});document.querySelectorAll('[data-r]').forEach(b=>b.addEventListener('click',()=>rate(b.dataset.r))) }
function rate(r){touchStudy();const p=pFor(current.id);let days=0;if(r==='again'){days=0.01;p.interval=0.01;p.ease=Math.max(1.3,p.ease-.2);p.lapses++;gain(6)}else if(r==='hard'){days=Math.max(.25,(p.interval||.2)*1.3);p.interval=days;p.ease=Math.max(1.3,p.ease-.1);gain(8)}else if(r==='good'){days=p.reps===0?1:p.reps===1?3:Math.max(2,(p.interval||1)*p.ease);p.interval=days;gain(10)}else{days=p.reps===0?3:p.reps===1?7:Math.max(4,(p.interval||1)*p.ease*1.3);p.interval=days;p.ease+=.08;gain(12)}p.reps++;p.due=now()+days*dayMs;progress[current.id]=p;meta.totalReviews=(meta.totalReviews||0)+1;const t=today();if(meta.reviewsDay!==t){meta.reviewsDay=t;meta.reviewsToday=0}meta.reviewsToday=(meta.reviewsToday||0)+1;save();pick()}
function gain(xp){meta.xp=(meta.xp||0)+xp}
function speak(){if(!current||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(current.ru);u.lang='ru-RU';u.rate=.9;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang?.toLowerCase().startsWith('ru'))||null;speechSynthesis.speak(u)}
function esc(s=''){return String(s).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','\"':'&quot;'}[c]||c))}
function rebuildCards(){const seen=new Set();cards=[...remoteCards,...localCards].filter(c=>c&&c.id&&c.de&&c.ru&&!seen.has(c.id)&&seen.add(c.id));}
function makeId(){return 'local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function openAdd(){const m=$('#addModal');m.hidden=false;setTimeout(()=>$('#newDe')?.focus(),50)}
function closeAdd(){const m=$('#addModal');m.hidden=true;$('#formMsg').textContent=''}
function addCard(){const de=$('#newDe').value.trim(),ru=$('#newRu').value.trim(),note=$('#newNote').value.trim();if(!de||!ru){$('#formMsg').textContent='Deutsch und Russisch fehlen noch.';return}const c={id:makeId(),de,ru,note,tags:['eigene Karte']};localCards.push(c);save();rebuildCards();$('#newDe').value='';$('#newRu').value='';$('#newNote').value='';$('#formMsg').textContent='Gespeichert ✓';setTimeout(()=>{closeAdd();current=c;revealed=false;renderCard()},350)}
$('#openAdd')?.addEventListener('click',openAdd);$('#closeAdd')?.addEventListener('click',closeAdd);$('#saveCard')?.addEventListener('click',addCard);$('#addModal')?.addEventListener('click',e=>{if(e.target.id==='addModal')closeAdd()});
fetch('./chunks.json?ts='+Date.now()).then(r=>r.json()).then(data=>{remoteCards=Array.isArray(data)?data:[];rebuildCards();pick()}).catch(()=>{remoteCards=[];rebuildCards();if(cards.length)pick();else $('#study').innerHTML='<div class="empty">Chunks konnten nicht geladen werden.</div>'});
