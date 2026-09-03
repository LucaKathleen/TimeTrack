(() => {
  const GOAL_KEY='habit_time_tracker_daily_goal_minutes';
  const todayEl=document.querySelector('#todayTime');
  const stats=document.querySelector('#tab-track .stats');
  if(!todayEl||!stats||document.querySelector('.today-hero'))return;

  const hero=document.createElement('section');
  hero.className='today-hero';
  hero.innerHTML=`
    <div class="today-head">
      <div>
        <div class="today-kicker">Heute</div>
        <div id="todayHeroTime" class="today-main">0 min</div>
        <div id="todayHeroCaption" class="today-caption">Jede Minute zählt.</div>
      </div>
      <div id="goalRing" class="goal-ring" aria-label="Fortschritt zum Tagesziel">
        <div class="goal-ring-inner"><strong id="goalPercent">0%</strong><span>Tagesziel</span></div>
      </div>
    </div>
    <div class="goal-bottom">
      <div class="goal-copy">
        <div class="small muted"><span id="goalProgressText">0 von 60 Minuten</span></div>
        <div class="goal-progress-track"><div id="goalProgressFill" class="goal-progress-fill"></div></div>
      </div>
      <div class="goal-edit">
        <input id="dailyGoalInput" type="number" min="5" max="1440" step="5" inputmode="numeric" aria-label="Tagesziel in Minuten">
        <button id="dailyGoalSave" class="btn" type="button">Ziel setzen</button>
      </div>
    </div>`;
  stats.parentNode.insertBefore(hero,stats);

  const $=s=>document.querySelector(s);
  const parseMinutes=text=>{
    const h=Number((text.match(/(\d+)\s*h/)||[])[1]||0);
    const m=Number((text.match(/(\d+)\s*min/)||[])[1]||0);
    return h*60+m;
  };
  const getGoal=()=>Math.max(5,Number(localStorage.getItem(GOAL_KEY))||60);
  const fmtGoal=min=>min>=60&&min%60===0?`${min/60} h`:`${min} min`;

  function update(){
    const text=todayEl.textContent.trim()||'0 min';
    const minutes=parseMinutes(text),goal=getGoal(),pct=Math.min(100,Math.round(minutes/goal*100));
    $('#todayHeroTime').textContent=text;
    $('#goalPercent').textContent=`${pct}%`;
    $('#goalRing').style.setProperty('--p',pct);
    $('#goalProgressFill').style.width=`${pct}%`;
    $('#goalProgressText').textContent=`${Math.min(minutes,goal)} von ${goal} Minuten`;
    $('#dailyGoalInput').value=goal;
    hero.classList.toggle('complete',minutes>=goal);
    $('#todayHeroCaption').textContent=minutes>=goal?`Tagesziel geschafft — stark. ✨`:minutes?`Noch ${fmtGoal(Math.max(0,goal-minutes))} bis zu deinem Ziel.`:'Starte deine erste Session für heute.';
  }

  $('#dailyGoalSave').addEventListener('click',()=>{
    const value=Math.max(5,Math.min(1440,Number($('#dailyGoalInput').value)||60));
    localStorage.setItem(GOAL_KEY,String(value));
    update();
  });
  $('#dailyGoalInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#dailyGoalSave').click()});
  new MutationObserver(update).observe(todayEl,{childList:true,characterData:true,subtree:true});
  update();
})();
