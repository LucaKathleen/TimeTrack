const CACHE='habit-time-tracker-v3';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./enhance.css','./enhance.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  const isPage=e.request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/TimeTrack/');
  if(isPage){
    e.respondWith(fetch(e.request).then(async resp=>{
      let html=await resp.clone().text();
      if(!html.includes('enhance.css')) html=html.replace('</head>','  <link rel="stylesheet" href="./enhance.css">\n</head>');
      if(!html.includes('enhance.js')) html=html.replace('</body>','  <script src="./enhance.js"></script>\n</body>');
      const out=new Response(html,{status:resp.status,statusText:resp.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
      caches.open(CACHE).then(c=>c.put(e.request,out.clone()));
      return out;
    }).catch(()=>caches.match(e.request).then(cached=>cached||caches.match('./index.html'))));
    return;
  }
  e.respondWith(fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp}).catch(()=>caches.match(e.request)));
});
