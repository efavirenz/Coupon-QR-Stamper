'use strict';
const $=id=>document.getElementById(id);
const VERSION='1.3';
const MAX=20,MAXLEN=100,EC='M';
// Reference layout measured from Blank.png / Example.png (1029x1491)
const REF={W:1029,H:1491,x:279,y:963,w:473,h:495,qr:378,qTop:33,fs:45.6,tBottom:31};
if(qrcode.stringToBytesFuncs['UTF-8'])qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
let tpl=null,files=[],urls=[];
let isGenerating=false,runId=0;

const box=()=>({
  x:Math.max(0,parseInt($('bx').value,10)||0),
  y:Math.max(0,parseInt($('by').value,10)||0),
  w:Math.max(1,parseInt($('bw').value,10)||1),
  h:Math.max(1,parseInt($('bh').value,10)||1)
});
const setBox=b=>{$('bx').value=Math.round(b.x);$('by').value=Math.round(b.y);$('bw').value=Math.round(b.w);$('bh').value=Math.round(b.h)};

function resetResults(){
  if(urls.length||files.length||!$('results').hidden){
    urls.forEach(URL.revokeObjectURL);urls=[];files=[];
    $('out').innerHTML='';$('results').hidden=true;
  }
}

async function loadTpl(src){
  const blob=src instanceof Blob?src:await (await fetch(src)).blob();
  let img;
  try{img=await createImageBitmap(blob,{imageOrientation:'from-image'})}catch(e){img=await createImageBitmap(blob)}
  tpl=img;
  runDetect();
}
function runDetect(){
  if(!tpl)return;
  const W=tpl.width,H=tpl.height,s=Math.max(2,Math.ceil(Math.max(W,H)/1000)),w=W/s|0,h=H/s|0;
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d',{willReadFrequently:true});
  g.fillStyle='#fff';g.fillRect(0,0,W,H);g.drawImage(tpl,0,0);
  const d=g.getImageData(0,0,W,H).data,m=new Uint8Array(w*h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=((j*s)*W+i*s)*4;m[j*w+i]=Math.min(d[k],d[k+1],d[k+2])>=245?1:0}
  const seen=new Uint8Array(w*h),st=new Int32Array(w*h);let best=null;
  for(let p=0;p<w*h;p++){
    if(!m[p]||seen[p])continue;
    let sp=0,n=0,x0=w,y0=h,x1=0,y1=0;st[sp++]=p;seen[p]=1;
    while(sp){
      const q=st[--sp],qx=q%w,qy=(q/w)|0;n++;
      if(qx<x0)x0=qx;if(qx>x1)x1=qx;if(qy<y0)y0=qy;if(qy>y1)y1=qy;
      const nb=[qx>0?q-1:-1,qx<w-1?q+1:-1,qy>0?q-w:-1,qy<h-1?q+w:-1];
      for(const r of nb)if(r>=0&&m[r]&&!seen[r]){seen[r]=1;st[sp++]=r}
    }
    const bw=x1-x0+1,bh=y1-y0+1;
    if(n/(bw*bh)>.85&&bw<w*.9&&bh<h*.9&&n>w*h*.03&&(!best||n>best.n))best={n,x:Math.max(0,x0*s-1),y:Math.max(0,y0*s-1),w:bw*s+1,h:bh*s+1};
  }
  if(best){setBox(best);$('detmsg').textContent='White box detected. Check the preview and adjust if needed.'}
  else{const f=W/REF.W,fy=H/REF.H;setBox({x:REF.x*f,y:REF.y*fy,w:REF.w*f,h:REF.h*fy});
    $('detmsg').textContent='No white box found. Reference position scaled to this image; adjust it manually.'}
  preview();
}

function render(text,showText=$('showQrText').checked){
  const c=document.createElement('canvas');c.width=tpl.width;c.height=tpl.height;
  const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(tpl,0,0);
  const b=box(),qs=b.w*REF.qr/REF.w;
  g.fillStyle='#fff';g.fillRect(b.x,b.y,b.w,b.h);
  const q=qrcode(0,EC);q.addData(text,/^[0-9]+$/.test(text)?'Numeric':'Byte');q.make();
  const n=q.getModuleCount(),cell=Math.round(qs/n);
  if(cell<2)throw new Error('Entry is too long for the QR area; use fewer characters or a larger box.');
  const sz=cell*n,qx=Math.round(b.x+(b.w-sz)/2),qy=Math.round(b.y+b.h*REF.qTop/REF.h);
  g.fillStyle='#000';
  for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))g.fillRect(qx+k*cell,qy+r*cell,cell,cell);
  if(showText){
    let fs=Math.max(10,qs*REF.fs/REF.qr);
    g.textAlign='center';g.textBaseline='alphabetic';
    do{g.font=fs+'px Helvetica,Arial,sans-serif';fs--}while(g.measureText(text).width>b.w*.9&&fs>=10);
    g.fillText(text,b.x+b.w/2,b.y+b.h-b.h*REF.tBottom/REF.h,b.w*.9);
  }
  return c;
}
function preview(){
  if(!tpl)return;
  $('pverr').textContent='';
  const pv=$('pv'),first=check().L[0];
  try{const c=render(first?first.v:'0000000000000000');pv.width=c.width;pv.height=c.height;pv.getContext('2d').drawImage(c,0,0)}
  catch(e){$('pverr').textContent=e.message}
}

function check(){
  const L=$('list').value.split(/\r?\n/).map((v,i)=>({v:v.trim(),n:i+1})).filter(o=>o.v);
  const errs=[],seen=new Map(),dups=[];
  if(L.length>MAX)errs.push(`Too many entries: ${L.length}. The maximum is ${MAX}.`);
  L.forEach(o=>{
    if(o.v.length>MAXLEN)errs.push(`Line ${o.n}: longer than ${MAXLEN} characters.`);
    if(seen.has(o.v)){dups.push(o);errs.push(`Line ${o.n}: duplicate of line ${seen.get(o.v)}.`)}else seen.set(o.v,o.n);
  });
  const bad=$('numonly').checked?L.filter(o=>!/^\d+$/.test(o.v)):[];
  return{L,errs,dups,bad};
}
function update(){
  if(isGenerating)return;
  const r=check(),all=[...r.errs,...r.bad.map(o=>`Line ${o.n}: contains characters other than digits.`)];
  let boxErr=false;
  if(tpl){
    const b=box();
    if(b.x+b.w>tpl.width||b.y+b.h>tpl.height){
      all.push('White box extends outside the template image dimensions.');
      boxErr=true;
    }
  }
  $('count').textContent=`${r.L.length} of ${MAX} entries`;
  $('issues').innerHTML='';all.forEach(t=>{const li=document.createElement('li');li.textContent=t;$('issues').append(li)});
  $('dedupe').disabled=!r.dups.length;
  $('go').disabled=!r.L.length||r.errs.length>0||r.bad.length>0||boxErr;
  preview();
}

$('go').onclick=async()=>{
  if(isGenerating)return;
  const r=check();
  if(r.bad.length||r.errs.length||!r.L.length)return;
  if(tpl){
    const b=box();
    if(b.x+b.w>tpl.width||b.y+b.h>tpl.height)return;
  }
  resetResults();
  const showText=$('showQrText').checked;
  isGenerating=true;
  $('go').disabled=true;
  $('showQrText').disabled=true;
  const thisRun=++runId;
  try{
    for(let i=0;i<r.L.length;i++){
      if(thisRun!==runId)return;
      $('status').textContent=`Creating image ${i+1} of ${r.L.length}…`;
      const blob=await new Promise(res=>render(r.L[i].v,showText).toBlob(res,'image/jpeg',.95));
      if(thisRun!==runId)return;
      const f=new File([blob],String(i+1).padStart(2,'0')+'.jpg',{type:'image/jpeg'});files.push(f);
      const u=URL.createObjectURL(blob);urls.push(u);
      const fig=document.createElement('figure'),im=new Image();im.src=u;im.alt=f.name;
      const cap=document.createElement('figcaption');cap.textContent=f.name;fig.append(im,cap);$('out').append(fig);
      await new Promise(x=>setTimeout(x));
    }
    if(thisRun===runId){
      $('status').textContent=`Done. ${files.length} image${files.length>1?'s':''} created.`;
      $('results').hidden=false;
    }
  }catch(e){
    if(thisRun===runId){$('status').textContent='';alert('Generation stopped: '+e.message)}
  }finally{
    isGenerating=false;
    $('showQrText').disabled=false;
    update();
  }
};
$('dedupe').onclick=()=>{const s=new Set();$('list').value=check().L.filter(o=>!s.has(o.v)&&s.add(o.v)).map(o=>o.v).join('\n');resetResults();update()};
$('save').onclick=async()=>{
  if(navigator.canShare&&navigator.canShare({files})){
    try{await navigator.share({files})}catch(e){if(e.name!=='AbortError')alert('Sharing failed: '+e.message)}
  }else alert('Sharing images is not supported here. Use Download .zip instead.');
};
$('zip').onclick=async()=>{
  const z=new JSZip();files.forEach(f=>z.file(f.name,f));
  const blob=await z.generateAsync({type:'blob'});
  const u=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=u;a.download='coupons.zip';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),1500);
};
$('file').onchange=async e=>{
  const f=e.target.files[0];
  if(!f)return;
  try{
    $('pverr').textContent='';
    await loadTpl(f);
    $('tplname').textContent='Template: '+f.name;
    resetResults();
    update();
  }catch(err){
    $('pverr').textContent='Failed to load template image: '+err.message;
  }finally{
    e.target.value='';
  }
};
$('detect').onclick=()=>{runDetect();resetResults()};
['bx','by','bw','bh'].forEach(id=>$(id).addEventListener('input',()=>{preview();resetResults();update()}));
$('list').addEventListener('input',()=>{resetResults();update()});
$('numonly').addEventListener('change',()=>{resetResults();update()});
$('showQrText').addEventListener('change',()=>{preview();resetResults()});

// Clear buttons
const clearEntries=()=>{runId++;$('list').value='';$('status').textContent='';resetResults();update()};
$('clrEntries').onclick=()=>{if(confirm('Clear all entries?'))clearEntries()};
$('clrAll').onclick=()=>{
  if(!confirm('Clear all entries and generated images?'))return;
  clearEntries();
};

// Toast
let tt;
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),4700)}

// Themes: name, mode, bg, card, ink, muted, line, accent
const THEMES={
ocean:['Blue Ocean','l','#e8f2fb','#ffffff','#10263b','#4f6a82','#c5d8ea','#0a66b2'],
mint:['Mint Garden','l','#e9f5ef','#ffffff','#12261c','#4d6b5b','#c4dfd0','#0b6b47'],
coral:['Sunset Coral','l','#fdeee9','#ffffff','#2e1713','#7a5249','#f1cdc3','#b3392a'],
lav:['Lavender','l','#f0ecfa','#ffffff','#1f1836','#5f5782','#d6cdee','#5b3fb5'],
sand:['Sand Gold','l','#f8f1e0','#fffdf7','#2b2412','#766a4a','#e6d9b8','#8a5a00'],
night:['Midnight Blue','d','#0d1621','#15212f','#e5eef8','#93a8bd','#26384a','#5fb0f5'],
forest:['Forest Night','d','#0f1a14','#16251c','#e3f1e8','#8fae9c','#26392d','#4cc38a'],
ember:['Ember','d','#1c1210','#271915','#f6e7e2','#b99a91','#3d2a24','#ff8a6b'],
violet:['Violet Night','d','#15111f','#1f1930','#ebe5fa','#a99fc8','#33294d','#a78bfa'],
graph:['Graphite','d','#121314','#1b1d1f','#ececec','#a0a4a8','#2e3134','#e2b34a']};
function applyTheme(id){
  const t=THEMES[id]||THEMES.ocean,r=document.documentElement.style,dark=t[1]==='d';
  ['bg','card','ink','mut','line','acc'].forEach((k,i)=>r.setProperty('--'+k,t[i+2]));
  r.setProperty('--accink',dark?t[2]:'#fff');r.setProperty('--err',dark?'#ff8f7a':'#a3321f');r.colorScheme=dark?'dark':'light';
  document.querySelector('meta[name=theme-color]').content=t[2];
  document.querySelectorAll('#themes button').forEach(b=>b.setAttribute('aria-checked',b.dataset.id===(THEMES[id]?id:'ocean')));
  try{localStorage.setItem('theme',id)}catch(e){}
}
['l','d'].forEach(m=>{
  const h=document.createElement('h3');h.textContent=m==='l'?'Bright themes':'Dark themes';$('themes').append(h);
  Object.keys(THEMES).filter(k=>THEMES[k][1]===m).forEach(k=>{
    const b=document.createElement('button'),t=THEMES[k];b.type='button';b.dataset.id=k;b.setAttribute('role','menuitemradio');
    b.innerHTML='<span class="sw" style="background:linear-gradient(135deg,'+t[2]+' 50%,'+t[7]+' 50%)"></span>';b.append(t[0]);
    b.onclick=()=>{applyTheme(k);setMenu(false)};$('themes').append(b);
  });
});
const setMenu=o=>{
  $('menu').hidden=!o;
  $('menuBtn').setAttribute('aria-expanded',o);
  if(o){
    const first=$('themes').querySelector('button[role=menuitemradio]');
    if(first)first.focus();
  }
};
$('menuBtn').onclick=()=>setMenu($('menu').hidden);
// Prevent pinch-to-zoom gestures on iOS Safari.
const preventGestureZoom=e=>e.preventDefault();
document.addEventListener('gesturestart',preventGestureZoom,{passive:false});
document.addEventListener('gesturechange',preventGestureZoom,{passive:false});
document.addEventListener('pointerdown',e=>{if(!$('menu').hidden&&!$('menu').contains(e.target)&&!$('menuBtn').contains(e.target))setMenu(false)});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('menu').hidden){
    setMenu(false);
    $('menuBtn').focus();
  }
});
$('themes').addEventListener('keydown',e=>{
  const btns=Array.from($('themes').querySelectorAll('button[role=menuitemradio]'));
  const idx=btns.indexOf(document.activeElement);
  if(idx===-1)return;
  if(e.key==='ArrowDown'||e.key==='ArrowRight'){
    e.preventDefault();
    btns[(idx+1)%btns.length].focus();
  }else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){
    e.preventDefault();
    btns[(idx-1+btns.length)%btns.length].focus();
  }
});
let saved=null;try{saved=localStorage.getItem('theme')}catch(e){}
applyTheme(saved&&THEMES[saved]?saved:'ocean');

// Version badge and update check
$('ver').textContent='v'+VERSION;
const cmp=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0};
$('ver').onclick=async()=>{
  const b=$('ver');b.disabled=true;
  try{
    const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('status '+r.status);
    const v=await r.json();
    if(cmp(v.version,VERSION)<=0){toast('You are on the latest version (v'+VERSION+').');b.disabled=false;return}
    toast('Update found: v'+v.version+'. Updating…');
    await Promise.all((v.files||[]).map(async f=>{
      const res=await fetch(f,{cache:'reload'});
      if(!res.ok)throw new Error('Failed to fetch '+f);
    }));
    if('serviceWorker'in navigator){
      const reg=await navigator.serviceWorker.getRegistration();
      if(reg)await reg.update();
    }
    setTimeout(()=>location.reload(),1500);
  }catch(e){toast('Could not check for updates. Check your connection and try again.');b.disabled=false}
};

// Template is always default-template.png when the app opens
function showDefault(){$('file').value='';$('tplname').textContent='Template: default-template.png';return loadTpl('default-template.png').then(update)}
addEventListener('pageshow',e=>{if(e.persisted)showDefault()});
showDefault();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
