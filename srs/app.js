const $=s=>document.querySelector(s);
const KEY='russian-srs-progress-v1';
const META='russian-srs-meta-v1';
const LOCAL='russian-srs-local-cards-v1';
const now=()=>Date.now();
const dayMs=86400000;
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}};
let progress=load(KEY,{});
let meta=load(META,{xp:0,totalReviews:0});
let localCards=load(LOCAL,[]);
let cards=[],current=null,revealed=false;

const FALLBACK=[
{id:'vplom-gotovit',de:'Ich hab keinen Bock zu kochen.',ru:'Мне влом готовить.',note:'влом = salopp: zu lästig / kein Bock',tags:['slang','alltag']},
{id:'stremno-idti',de:'Mir ist etwas mulmig dabei, da allein hinzugehen.',ru:'Мне стрёмно туда идти одной.',note:'стрёмно = sketchy, unangenehm, mulmig',tags:['slang','alltag']},
{id:'nakosyachit-rabota',de:'Ich hab auf der Arbeit Mist gebaut.',ru:'Я накосячила на работе.',note:'накосячить = Mist bauen / verkacken',tags:['slang']},
{id:'dokopalsya',de:'Warum gehst du mir so auf den Sack?',ru:'Чё ты до меня докопался?',note:'докопаться до кого-то = sich an jemandem festbeißen / nerven',tags:['slang']},
{id:'zamorochitsya',de:'Ich hab beschlossen, mir die Mühe zu machen und alles selbst zu machen.',ru:'Я решила заморочиться и сама всё сделать.',note:'заморочиться = sich richtig Mühe machen',tags:['umgangssprache']},
{id:'ugorayu',de:'Ich kann darüber nicht mehr vor Lachen.',ru:'Я с этого угораю.',note:'угорать = sich kaputtlachen',tags:['slang']},
{id:'otmazyvatsya',de:'Hör auf, dich rauszureden.',ru:'Хватит отмазываться.',note:'отмазываться = sich rausreden',tags:['slang']},
{id:'spalitsya',de:'Er ist mit seiner Lüge aufgeflogen.',ru:'Он спалился на лжи.',note:'спалиться = auffliegen / sich verraten',tags:['slang']},
{id:'vtirat',de:'Was willst du mir da erzählen?',ru:'Что ты мне втираешь?',note:'втирать = jemandem Quatsch erzählen',tags:['slang']},
{id:'vyrubitsya',de:'Ich bin nach Hause gekommen und direkt weggepennt.',ru:'Я пришла домой и сразу вырубилась.',note:'вырубиться = wegpennen; je nach Kontext auch bewusstlos werden',tags:['slang','alltag']}
];
let remoteCards=FALLBACK;

function save(){localStorage.setItem(KEY,JSON.stringify(progress));localStorage.setItem(META,JSON.stringify(meta));localStorage.setItem(LOCAL,JSON.stringify(localCards))}
function pFor(id){return progress[id]||{due:0,interval:0,ease:2.3,reps:0,lapses:0}}
function rebuild(){const seen=new Set();cards=[...remoteCards,...localCards].filter(c=>c?.id&&c?.de&&c?.ru&&!seen.has(c.id)&&seen.add(c.id))}
function dueCards(){return cards.filter(c=>pFor(c.id).due<=now()).sort((a,b)=>pFor(a.id).due-pFor(b.id).due)}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function garden(){const n=meta.totalReviews||0;const stages=[
[0,'🌱','Ein kleiner Anfang'],[10,'🌱🌿','Die ersten Blätter'],[30,'🌿🌷','Es wird grün'],[60,'🌿🌷🌼','Die ersten Blumen'],[100,'🌳🌷🌼','Ein richtiger Garten'],[180,'🌳🌸🌻🪴','Dein Garten blüht'],[300,'🌲🌳🌸🌻🪴','Sprachgarten']];
let i=0;stages.forEach((s,x)=>{if(n>=s[0])i=x});const cur=stages[i],next=stages[i+1];return{icon:cur[1],title:cur[2],text:next?`Noch ${next[0]-n} Wiederholungen bis zur nächsten Stufe.`:'Dein Garten ist riesig geworden.',pct:next?((n-cur[0])/(next[0]-cur[0]))*100:100}}
function stats(){const g=garden();$('#due').textContent=dueCards().length;$('#xp').textContent=meta.xp||0;$('#reviews').textContent=meta.totalReviews||0;$('#level').textContent=Math.floor((meta.xp||0)/100)+1;$('#progressFill').style.width=Math.min(100,((meta.reviewsToday||0)/20)*100)+'%';$('#gardenScene').textContent=g.icon;$('#gardenTitle').textContent=g.title;$('#gardenText').textContent='Jede Wiederholung lässt ihn wachsen. '+g.text;$('#gardenFill').style.width=Math.max(0,Math.min(100,g.pct))+'%'}
function pick(){current=dueCards()[0]||null;revealed=false;render()}
function render(){stats();if(!current){$('#study').innerHTML='<div class="empty"><div style="font-size:2.5rem">🧠✨</div><h2>Für jetzt alles erledigt.</h2><p>Die nächsten Chunks kommen automatisch wieder, wenn sie fällig sind.</p><button class="btn primary" id="practiceAny">Trotzdem 1 zufälligen Chunk üben</button></div>';$('#practiceAny')?.addEventListener('click',()=>{if(cards.length){current=cards[Math.floor(Math.random()*cards.length)];render()}});return}
$('#study').innerHTML=`<div class="card"><button class="tts" id="tts">🔊</button><div class="side">Deutsch → Russisch</div><div class="prompt">${esc(current.de)}</div><div class="answer ${revealed?'show':''}"><div class="ru">${esc(current.ru)}</div>${current.note?`<div class="note">${esc(current.note)}</div>`:''}<div class="tags">${(current.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></div><div class="actions">${revealed?'<div class="ratings"><button class="btn again" data-r="again">Nochmal</button><button class="btn hard" data-r="hard">Schwer</button><button class="btn good" data-r="good">Gut</button><button class="btn easy" data-r="easy">Leicht</button></div>':'<button class="btn primary" id="reveal">Antwort zeigen</button>'}</div>`;
$('#tts')?.addEventListener('click',speak);$('#reveal')?.addEventListener('click',()=>{revealed=true;render()});document.querySelectorAll('[data-r]').forEach(b=>b.addEventListener('click',()=>rate(b.dataset.r)))}
function rate(r){const p=pFor(current.id);let days;if(r==='again'){days=.01;p.ease=Math.max(1.3,p.ease-.2);p.lapses++;meta.xp=(meta.xp||0)+6}else if(r==='hard'){days=Math.max(.25,(p.interval||.2)*1.3);p.ease=Math.max(1.3,p.ease-.1);meta.xp=(meta.xp||0)+8}else if(r==='good'){days=p.reps===0?1:p.reps===1?3:Math.max(2,(p.interval||1)*p.ease);meta.xp=(meta.xp||0)+10}else{days=p.reps===0?3:p.reps===1?7:Math.max(4,(p.interval||1)*p.ease*1.3);p.ease+=.08;meta.xp=(meta.xp||0)+12}p.interval=days;p.reps++;p.due=now()+days*dayMs;progress[current.id]=p;meta.totalReviews=(meta.totalReviews||0)+1;const d=new Date().toISOString().slice(0,10);if(meta.reviewsDay!==d){meta.reviewsDay=d;meta.reviewsToday=0}meta.reviewsToday=(meta.reviewsToday||0)+1;save();pick()}
function speak(){if(!current||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(current.ru);u.lang='ru-RU';u.rate=.9;const v=speechSynthesis.getVoices();u.voice=v.find(x=>x.lang?.toLowerCase().startsWith('ru'))||null;speechSynthesis.speak(u)}
function openAdd(){$('#addModal').hidden=false;setTimeout(()=>$('#newDe')?.focus(),50)}
function closeAdd(){$('#addModal').hidden=true;$('#formMsg').textContent=''}
function addCard(){const de=$('#newDe').value.trim(),ru=$('#newRu').value.trim(),note=$('#newNote').value.trim();if(!de||!ru){$('#formMsg').textContent='Deutsch und Russisch fehlen noch.';return}const c={id:'local-'+Date.now().toString(36),de,ru,note,tags:['eigene Karte']};localCards.push(c);save();rebuild();$('#newDe').value='';$('#newRu').value='';$('#newNote').value='';closeAdd();current=c;revealed=false;render()}
$('#openAdd')?.addEventListener('click',openAdd);$('#closeAdd')?.addEventListener('click',closeAdd);$('#saveCard')?.addEventListener('click',addCard);$('#addModal')?.addEventListener('click',e=>{if(e.target.id==='addModal')closeAdd()});

rebuild();pick();
fetch('./chunks.json?v=4').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(data=>{if(Array.isArray(data)&&data.length){remoteCards=data;rebuild();pick()}}).catch(err=>console.warn('Nutze eingebaute Karten, weil chunks.json nicht erreichbar ist.',err));
