(() => {
  const GOAL_KEY='habit_time_tracker_daily_goal_minutes';
  const DB_NAME='habit_time_tracker_db';
  const todayEl=document.querySelector('#todayTime');
  const stats=document.querySelector('#tab-track .stats');
  if(!todayEl||!stats)return;
  const $=s=>document.querySelector(s);
  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const formatDuration=sec=>{sec=Math.max(0,Math.round(Number(sec)||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h?`${h} h ${String(m).padStart(2,'0')} min`:`${m} min`};

  // Daily goal hero
  if(!document.querySelector('.today-hero')){
    const hero=document.createElement('section');
    hero.className='today-hero';
    hero.innerHTML=`
      <div class="today-head"><div><div class="today-kicker">Heute</div><div id="todayHeroTime" class="today-main">0 min</div><div id="todayHeroCaption" class="today-caption">Jede Minute zählt.</div></div>
      <div id="goalRing" class="goal-ring" aria-label="Fortschritt zum Tagesziel"><div class="goal-ring-inner"><strong id="goalPercent">0%</strong><span>Tagesziel</span></div></div></div>
      <div class="goal-bottom"><div class="goal-copy"><div class="small muted"><span id="goalProgressText">0 von 60 Minuten</span></div><div class="goal-progress-track"><div id="goalProgressFill" class="goal-progress-fill"></div></div></div>
      <div class="goal-edit"><input id="dailyGoalInput" type="number" min="5" max="1440" step="5" inputmode="numeric" aria-label="Tagesziel in Minuten"><button id="dailyGoalSave" class="btn" type="button">Ziel setzen</button></div></div>`;
    stats.parentNode.insertBefore(hero,stats);
    const parseMinutes=text=>{const h=Number((text.match(/(\d+)\s*h/)||[])[1]||0),m=Number((text.match(/(\d+)\s*min/)||[])[1]||0);return h*60+m};
    const getGoal=()=>Math.max(5,Number(localStorage.getItem(GOAL_KEY))||60);
    const fmtGoal=min=>min>=60&&min%60===0?`${min/60} h`:`${min} min`;
    function updateGoal(){const text=todayEl.textContent.trim()||'0 min',minutes=parseMinutes(text),goal=getGoal(),pct=Math.min(100,Math.round(minutes/goal*100));$('#todayHeroTime').textContent=text;$('#goalPercent').textContent=`${pct}%`;$('#goalRing').style.setProperty('--p',pct);$('#goalProgressFill').style.width=`${pct}%`;$('#goalProgressText').textContent=`${Math.min(minutes,goal)} von ${goal} Minuten`;$('#dailyGoalInput').value=goal;hero.classList.toggle('complete',minutes>=goal);$('#todayHeroCaption').textContent=minutes>=goal?'Tagesziel geschafft — stark. ✨':minutes?`Noch ${fmtGoal(Math.max(0,goal-minutes))} bis zu deinem Ziel.`:'Starte deine erste Session für heute.'}
    $('#dailyGoalSave').addEventListener('click',()=>{const value=Math.max(5,Math.min(1440,Number($('#dailyGoalInput').value)||60));localStorage.setItem(GOAL_KEY,String(value));updateGoal()});
    $('#dailyGoalInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#dailyGoalSave').click()});
    new MutationObserver(updateGoal).observe(todayEl,{childList:true,characterData:true,subtree:true});updateGoal();
  }

  // Category layer. Categories are stored directly on habit records, so backups keep them.
  const openDB=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const all=(db,store)=>new Promise((resolve,reject)=>{const r=db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const put=(db,store,obj)=>new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(obj);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  let categoryRenderBusy=false;

  function categoryName(h){return (h.category||'').trim()||'Ohne Kategorie'}
  function categoriesFrom(habits){return [...new Set(habits.map(categoryName).filter(x=>x!=='Ohne Kategorie'))].sort((a,b)=>a.localeCompare(b,'de'))}

  function ensureCategoryInput(categories){
    const form=$('#habitForm');if(!form)return;
    let input=$('#habitCategory');
    if(!input){
      const colorLabel=$('#habitColor')?.closest('label');
      const label=document.createElement('label');label.style.marginTop='10px';label.innerHTML='Kategorie<input id="habitCategory" type="text" maxlength="40" list="categoryOptions" placeholder="z. B. Russisch oder Gitarre"><datalist id="categoryOptions"></datalist>';
      colorLabel?.before(label);input=$('#habitCategory');
      form.addEventListener('submit',()=>{sessionStorage.setItem('pendingHabitCategory',input.value.trim())},true);
    }
    const list=$('#categoryOptions');if(list)list.innerHTML=categories.map(c=>`<option value="${escapeHtml(c)}"></option>`).join('');
  }

  async function attachCategoryToNewestHabit(db,habits){
    const pending=sessionStorage.getItem('pendingHabitCategory');if(pending===null)return habits;
    sessionStorage.removeItem('pendingHabitCategory');if(!pending)return habits;
    const name=$('#habitName')?.value.trim();
    await new Promise(r=>setTimeout(r,120));
    const fresh=await all(db,'habits');
    const target=[...fresh].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
    if(target && !target.category){target.category=pending;await put(db,'habits',target)}
    return all(db,'habits');
  }

  function addCategoryStatsContainer(){
    if($('#categoryBars'))return;
    const habitBars=$('#habitBars');if(!habitBars)return;
    const existingCard=habitBars.closest('.card');
    const card=document.createElement('div');card.className='card';card.innerHTML='<h2 class="section-title">Zeit nach Kategorie</h2><div id="categoryBars" class="bar-list"></div><div class="small muted" style="margin-top:10px">Tippe eine Kategorie an, um die enthaltenen Habits zu sehen.</div>';
    existingCard.parentElement?.appendChild(card);
  }

  function renderCategoryBars(habits,entries){
    addCategoryStatsContainer();const root=$('#categoryBars');if(!root)return;
    const habitById=new Map(habits.map(h=>[h.id,h])),groups=new Map();
    for(const e of entries){const h=habitById.get(e.habitId);if(!h)continue;const cat=categoryName(h);if(!groups.has(cat))groups.set(cat,{sec:0,habits:new Map()});const g=groups.get(cat),sec=Number(e.seconds)||0;g.sec+=sec;g.habits.set(h.name,(g.habits.get(h.name)||0)+sec)}
    for(const h of habits){const cat=categoryName(h);if(!groups.has(cat))groups.set(cat,{sec:0,habits:new Map()});if(!groups.get(cat).habits.has(h.name))groups.get(cat).habits.set(h.name,0)}
    const rows=[...groups.entries()].sort((a,b)=>b[1].sec-a[1].sec),max=Math.max(1,...rows.map(x=>x[1].sec));
    root.innerHTML=rows.length?rows.map(([cat,g],idx)=>`<details class="category-stat" ${idx===0?'open':''}><summary style="cursor:pointer;list-style:none"><div class="bar-label"><span><strong>${escapeHtml(cat)}</strong> <span class="muted small">· ${g.habits.size} Habits</span></span><strong>${formatDuration(g.sec)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${g.sec/max*100}%;background:var(--accent)"></div></div></summary><div style="padding:9px 4px 2px 12px">${[...g.habits.entries()].sort((a,b)=>b[1]-a[1]).map(([name,sec])=>`<div class="bar-label"><span class="muted">↳ ${escapeHtml(name)}</span><span>${formatDuration(sec)}</span></div>`).join('')}</div></details>`).join(''):'<div class="muted">Noch keine Kategorien.</div>';
  }

  function renderHabitCategoryControls(db,habits,categories){
    const byName=new Map(habits.map(h=>[h.name,h]));
    document.querySelectorAll('.habit-card').forEach(card=>{
      const name=card.querySelector('h3')?.textContent?.trim(),h=byName.get(name);if(!h)return;
      let wrap=card.querySelector('.habit-category-control');
      if(!wrap){wrap=document.createElement('div');wrap.className='habit-category-control';wrap.style.marginTop='10px';card.appendChild(wrap)}
      const current=h.category||'';
      wrap.innerHTML=`<label>Kategorie<input class="habit-category-input" type="text" maxlength="40" list="categoryOptions" value="${escapeHtml(current)}" placeholder="Ohne Kategorie"></label>`;
      const input=wrap.querySelector('input');
      input.addEventListener('change',async()=>{h.category=input.value.trim();await put(db,'habits',h);await renderCategories()});
    });
  }

  async function renderCategories(){
    if(categoryRenderBusy)return;categoryRenderBusy=true;
    try{
      const db=await openDB();let habits=await all(db,'habits');habits=await attachCategoryToNewestHabit(db,habits);const entries=await all(db,'entries'),categories=categoriesFrom(habits);
      ensureCategoryInput(categories);renderHabitCategoryControls(db,habits,categories);renderCategoryBars(habits,entries);db.close();
    }catch(e){console.warn('Categories could not be rendered',e)}finally{categoryRenderBusy=false}
  }

  // Main app re-renders cards after every edit/session; refresh category UI afterwards.
  const cards=$('#habitCards');if(cards)new MutationObserver(()=>setTimeout(renderCategories,0)).observe(cards,{childList:true});
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.tab==='stats')setTimeout(renderCategories,30)}));
  $('#habitForm')?.addEventListener('submit',()=>setTimeout(renderCategories,220));
  setTimeout(renderCategories,80);
})();
