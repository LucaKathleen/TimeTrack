(()=>{
  const FRAMES={
    hungry:['./assets/cat-hungry-1.png','./assets/cat-hungry-2.png'],
    happy:['./assets/cat-happy-1.png','./assets/cat-happy-2.png']
  };
  let mood='hungry',frame=0,timer=null;
  function img(){return document.getElementById('catSprite')}
  function render(){const el=img();if(!el)return;const set=FRAMES[mood]||FRAMES.hungry;el.src=set[frame%set.length]}
  function start(){if(timer)clearInterval(timer);frame=0;render();timer=setInterval(()=>{frame=(frame+1)%2;render()},650)}
  window.setCatMood=(next)=>{next=next==='happy'?'happy':'hungry';if(next===mood&&timer){render();return}mood=next;start()};
  document.addEventListener('DOMContentLoaded',start);
})();
