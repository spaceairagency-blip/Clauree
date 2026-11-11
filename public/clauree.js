(()=>{
if(window.__clr){window.__clr.show();return}
const O='__ORIGIN__'.startsWith('__')?location.origin:'__ORIGIN__';
const C=Object.assign({composer:'div[contenteditable="true"]',send:'button[aria-label*="Send" i]',stop:'button[aria-label*="Stop" i]',user:'[data-testid="user-message"]',asst:'.font-claude-message,[data-testid="assistant-message"]'},JSON.parse(localStorage.getItem('clr.cfg')||'{}'));
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const est=t=>{const n=t.length;if(!n)return 0;const na=(t.match(/[^\x00-\x7f]/g)||[]).length;const code=(t.match(/[{}();=<>\/]/g)||[]).length/n>.06;return Math.ceil((n-na)/(code?3:3.8)+na/1.5)};
const fm=m=>m==null?'?':m>=60?Math.floor(m/60)+'h '+Math.round(m%60)+'m':Math.round(m)+'m';
const kf=n=>n>=1000?(n/1000).toFixed(1)+'k':''+Math.round(n);
let S={};try{S=JSON.parse(localStorage.getItem('clr.v1'))||{}}catch(e){}
S.w=S.w||{s:Date.now(),ev:[]};S.hits=S.hits||[];
const save=()=>{try{localStorage.setItem('clr.v1',JSON.stringify(S))}catch(e){}};

/* ---------- meter + prediction ---------- */
const use=()=>S.w.ev.reduce((a,e)=>a+e.i+e.o,0);
const bud=()=>{const h=S.hits.map(x=>x.u).filter(x=>x>0).sort((a,b)=>a-b);if(!h.length)return null;return{lo:h.length>1?h[0]:h[0]*.85,hi:h.length>1?h[h.length-1]:h[0]*1.15,mid:h[h.length>>1]}};
const pct=()=>{const b=bud(),u=use();return b?[Math.min(100,Math.round(u/b.hi*100)),Math.min(100,Math.round(u/b.lo*100))]:null};
const pace=()=>{const e=S.w.ev.slice(-5);if(e.length<2)return 0;const dt=(e[e.length-1].t-e[0].t)/6e4;return dt>.5?e.slice(1).reduce((a,x)=>a+x.i+x.o,0)/dt:0};
const fc=()=>{const b=bud(),p=pace(),u=use();return b&&p?[Math.max(0,(b.lo-u)/p),Math.max(0,(b.hi-u)/p)]:null};
const rm=()=>S.reset?Math.max(0,(S.reset-Date.now())/6e4):null;
const ctx=()=>$$(C.user+','+C.asst).reduce((a,n)=>a+est(n.innerText),0);
const comp=()=>$(C.composer);
const draft=()=>(comp()?comp().innerText:'').trim();
let lim=false;
const status=()=>lim?'Limit reached':!bud()?'Calibrating':pct()[1]>=80?'Danger':pct()[1]>=50?'Caution':'Safe';
function risk(){const t=draft();if(!t)return null;const ev=S.w.ev,ao=ev.length?ev.reduce((a,e)=>a+e.o,0)/ev.length:400;const cost=ctx()+est(t)+ao,b=bud();if(!b)return{cost,l:'~'+kf(cost)+' tok',c:'c'};const r=cost/Math.max(1,b.mid-use());return{cost,r,l:r>.25?'High risk':r>.1?'Medium risk':'Low risk',c:r>.25?'d':r>.1?'w':'s'}}

/* ---------- detection ---------- */
let lu=-1,pend=null,stab=0,ll=0,path=location.pathname;
const streaming=()=>!!$(C.stop);
function banner(){const t=(document.body.innerText||'').slice(-3500);const m=/(limit|usage)[^.\n]{0,60}(reset|until|available again|try again)[^\n]{0,60}/i.exec(t);return m?m[0]:null}
function parseReset(s){let m=/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(s);if(m){const d=new Date();d.setHours(+m[1]%12+(/pm/i.test(m[3])?12:0),+(m[2]||0),0,0);if(d<=Date.now())d.setDate(d.getDate()+1);return +d}m=/in\s+(?:(\d+)\s*h\w*)?\s*(?:and\s*)?(?:(\d+)\s*m\w*)?/i.exec(s);return m&&(m[1]||m[2])?Date.now()+((+m[1]||0)*60+(+m[2]||0))*6e4:null}
function tick(){
 if(location.pathname!==path){path=location.pathname;lu=-1;pend=null}
 const us=$$(C.user),as=$$(C.asst);
 if(lu<0||us.length<lu)lu=us.length;
 else if(us.length>lu){lu=us.length;pend={t:Date.now(),i:ctx(),p:est(us[us.length-1].innerText)};stab=0;ll=0}
 if(pend){const a=as[as.length-1],len=a?a.innerText.length:0;if(len>0&&len===ll&&!streaming())stab++;else stab=0;ll=len;if(stab>=3){S.w.ev.push({t:pend.t,i:pend.i,p:pend.p,o:est(a.innerText)});pend=null;stab=0;save()}}
 const b=banner();
 if(b&&!lim){lim=true;pend=null;S.hits.push({u:use(),t:Date.now()});S.hits=S.hits.slice(-10);S.reset=parseReset(b);save()}
 else if(b&&lim&&!S.reset){S.reset=parseReset(b);save()}
 else if(!b&&lim){lim=false;S.reset=null;S.w={s:Date.now(),ev:[]};save();runQueue()}
 render()}

/* ---------- composer + queue ---------- */
function setText(t){const c=comp();if(!c)return false;c.focus();document.execCommand('selectAll');document.execCommand('insertText',false,t);return true}
function runQueue(){const q=S.q;if(!q)return;if(q.path!==location.pathname){toast('Queued prompt belongs to another chat');return}
 const n=$$(C.user).length;if(!setText(q.text)){toast('Chat box not found');return}
 setTimeout(()=>{const b=$(C.send);if(b&&!b.disabled)b.click();setTimeout(()=>{if($$(C.user).length>n){S.q=null;save();toast('Queued prompt sent')}else toast('Could not send automatically. Press Send.')},4000)},400)}
function queue(){const t=draft()||'Please continue from where you left off.';S.q={text:t,path:location.pathname};save();if(draft()){comp().focus();document.execCommand('selectAll');document.execCommand('delete')}toast('Queued. It sends when your limit resets and this tab is open.');render()}
function copyCtx(){const t=$$(C.user+','+C.asst).slice(-40).map(n=>(n.matches(C.user)?'User: ':'Assistant: ')+n.innerText.trim()).join('\n\n');
 const txt='Continue this conversation. Earlier messages are below.\n\n'+t;
 (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).catch(()=>{const a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}).then?0:0;toast('Context copied. Paste it into another AI.')}

/* ---------- AI (direct, popup-bridge fallback) ---------- */
let bw,ready=0,wait=[],br={};
addEventListener('message',e=>{if(e.origin!==O)return;const d=e.data||{};if(d.ready){ready=1;wait.splice(0).forEach(f=>f())}if(d.id&&br[d.id]){br[d.id](d.res);delete br[d.id]}});
function bridge(body){return new Promise(res=>{const id=Math.random();br[id]=res;const go=()=>bw.postMessage({id,body},O);
 if(!bw||bw.closed){ready=0;bw=open(O+'/bridge.html','clr','width=340,height=180')}
 if(!bw)return res({error:'Popup blocked. Allow popups for this site and try again.'});
 ready?go():wait.push(go);setTimeout(()=>{if(br[id]){delete br[id];res({error:'AI bridge timed out.'})}},25000)})}
async function ai(mode,text){const b=bud();const body={mode,text,budget:b?Math.round(b.mid-use()):null};
 try{const r=await Promise.race([fetch(O+'/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),new Promise((_,j)=>setTimeout(j,20000))]);return await r.json()}catch(e){return bridge(body)}}

/* ---------- UI ---------- */
const H=document.createElement('div');H.id='clr-host';H.style.cssText='position:fixed;z-index:2147483000;display:flex;flex-direction:column;gap:8px';
const R=H.attachShadow({mode:'open'});
R.innerHTML=`<style>
*{box-sizing:border-box}[hidden]{display:none!important}
.w{--bg:#fff;--fg:#2d2b2a;--mu:#8c857b;--bd:#e5e2dc;--ac:#d95d39;--ok:#2f9e6b;--wa:#d9961a;--da:#d64545;font-size:13px;line-height:1.4;color:var(--fg)}
.w.d{--bg:#282524;--fg:#eae6df;--bd:#3d3937}
.s,.p{background:var(--bg);border:1px solid var(--bd);border-radius:var(--r,14px);box-shadow:0 4px 18px #0002}
.s{display:flex;align-items:center;gap:10px;padding:6px 10px;min-height:34px;flex-wrap:wrap}
.p{padding:14px 16px;display:grid;gap:12px;max-height:60vh;overflow:auto}
.dot{width:9px;height:9px;border-radius:50%;background:var(--mu)}.Safe .dot{background:var(--ok)}.Caution .dot{background:var(--wa)}.Danger .dot,.lim .dot{background:var(--da)}
.st{font-weight:600}.bar{flex:1;min-width:70px;max-width:160px;height:6px;border-radius:9px;background:var(--bd);overflow:hidden}.bar i{display:block;height:100%;background:var(--ac);transition:width .3s}
.tx{color:var(--mu)}.chip{padding:2px 8px;border-radius:99px;border:1px solid var(--bd);font-size:12px}.chip.s{border-color:var(--ok);box-shadow:none}.chip.w{border-color:var(--wa)}.chip.d{border-color:var(--da)}
button{font:inherit;color:inherit;background:transparent;border:1px solid var(--bd);border-radius:9px;padding:4px 10px;cursor:pointer}button:hover{border-color:var(--ac)}button:focus-visible{outline:2px solid var(--ac)}
button.pr{background:var(--ac);border-color:var(--ac);color:#fff}.s>button:last-child{margin-left:auto}
.seg{display:flex;height:10px;border-radius:9px;overflow:hidden;background:var(--bd)}.seg i:nth-child(1){background:#d95d39}.seg i:nth-child(2){background:#e9a58f}.seg i:nth-child(3){background:#8c857b}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.mu{color:var(--mu)}h4{margin:0;font-size:13px}
.dr{position:fixed;top:12px;right:12px;bottom:12px;width:min(380px,92vw);padding:14px;display:flex;flex-direction:column;gap:10px;overflow:auto}
textarea,select{font:inherit;color:inherit;background:transparent;border:1px solid var(--bd);border-radius:9px;padding:8px;width:100%}textarea{min-height:110px;resize:vertical}
.t{position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:#1c1a19;color:#fff;padding:8px 14px;border-radius:10px}
@media(prefers-reduced-motion:reduce){.bar i{transition:none}}
</style><div class="w" id="w"><div id="pn" class="p" hidden></div><div id="sp"></div>
<div class="s dr" id="dr" hidden><div class="row"><h4>Clauree</h4><button data-a="tab1">Planner</button><button data-a="tab2">History</button><button data-a="dx" style="margin-left:auto">Close</button></div>
<div id="t1" style="display:grid;gap:10px"><select id="md"><option value="compress">Compress (fewer tokens)</option><option value="structure">Turn notes into a structured prompt</option><option value="clarify">Remove ambiguity and repetition</option><option value="plan">Plan a series of prompts</option></select>
<textarea id="in" placeholder="Your prompt or goal"></textarea><button class="pr" data-a="run">Run</button><div id="ms" class="mu"></div><textarea id="out" placeholder="Result"></textarea><div class="row"><button class="pr" data-a="ap">Apply to chat box</button><button data-a="cp">Copy</button></div></div>
<div id="t2" hidden></div></div><div class="t" id="to" hidden></div></div>`;
document.body.appendChild(H);
const W=R.getElementById('w'),PN=R.getElementById('pn'),SP=R.getElementById('sp'),DR=R.getElementById('dr'),TO=R.getElementById('to');
let open1=false,tt;
function toast(m){TO.textContent=m;TO.hidden=false;clearTimeout(tt);tt=setTimeout(()=>TO.hidden=true,3500)}
function place(){const c=comp(),a=c&&(c.closest('fieldset,form,[data-composer]')||c.parentElement);
 if(a){const r=a.getBoundingClientRect(),cs=getComputedStyle(a);H.style.left=r.left+'px';H.style.width=r.width+'px';H.style.right='auto';H.style.bottom=(innerHeight-r.top+8)+'px';H.style.setProperty('--r',Math.min(parseFloat(cs.borderTopLeftRadius)||14,20)+'px');H.style.fontFamily=cs.fontFamily}
 else{H.style.left='auto';H.style.right='16px';H.style.width='360px';H.style.bottom='16px'}
 const m=(getComputedStyle(document.body).backgroundColor.match(/\d+/g)||[255,255,255]);W.className='w'+((m[0]*299+m[1]*587+m[2]*114)/1000<128?' d':'')}
function render(){place();const p=pct(),f=fc(),r=rm(),st=status(),rk=risk();
 if(lim)SP.innerHTML=`<div class="s lim"><b class="dot"></b><b>Limit reached</b><span class="tx">resets in ${fm(r)}</span>${S.q?'<span class="chip">1 queued <button data-a="cq">✕</button></span>':''}<button class="pr" data-a="q">Queue and auto-send</button><button data-a="cc">Copy context</button><button data-a="pl">Plan</button></div>`;
 else SP.innerHTML=`<div class="s ${st}"><b class="dot"></b><span class="st">${st}</span><div class="bar"><i style="width:${p?p[1]:0}%"></i></div><span class="tx">${p?`~${p[0]}–${p[1]}%`:'~'+kf(use())+' tok'}${f?` · limit in ~${fm(f[0])}–${fm(f[1])}`:''}${r!=null?` · reset ${fm(r)}`:''}</span>${rk?`<span class="chip ${rk.c}">Next: ${rk.l}</span>`:''}${S.q?'<span class="chip">1 queued <button data-a="cq">✕</button></span>':''}<button data-a="pl" title="Planner">✦</button><button data-a="ex" title="Details">${open1?'⌄':'⌃'}</button></div>`;
 PN.hidden=!open1;if(open1)PN.innerHTML=panel(p,f,r,rk)}
function panel(p,f,r,rk){const ev=S.w.ev,T=use()||1,sp=ev.reduce((a,e)=>a+(e.p||0),0),so=ev.reduce((a,e)=>a+e.o,0),sh=Math.max(0,T-sp-so);
 const conf=S.hits.length>=3?'High':S.hits.length?'Medium':'Low';
 const hist=ev.length>=3&&sh/T>.5?`<div>Re-reading old messages is about ${Math.round(sh/T*100)}% of your usage. A new chat with a short summary would save most of that.</div>`:'';
 const fcs=f?`At this pace you will likely hit the limit in ${fm(f[0])}–${fm(f[1])}${r!=null?(f[1]<r?`, about ${fm(r-f[1])}–${fm(r-f[0])} before the reset`:', before the reset'):''}.`:(bud()?'Send a few more messages to get a forecast.':'No limit hit recorded yet. Clauree learns your budget the first time you reach it.');
 return `<div class="row"><h4>Usage this window</h4><span class="mu" style="margin-left:auto">Confidence: ${conf}</span></div>
<div>${p?`<b>~${p[0]}–${p[1]}%</b> used`:'<b>Calibrating</b>'} · ${ev.length} messages · ~${kf(use())} tokens</div><div>${fcs}</div>
<div><div class="seg"><i style="width:${sp/T*100}%"></i><i style="width:${sh/T*100}%"></i><i style="width:${so/T*100}%"></i></div><div class="mu">Your prompts · Chat re-read · Replies</div></div>
${rk?`<div><h4>Next prompt</h4>${rk.r!=null?`~${kf(rk.cost)} tokens, about ${Math.round(rk.r*100)}% of what is left (${rk.l}).`:`~${kf(rk.cost)} tokens.`}</div><div class="row"><button data-a="pl">Optimize</button><button data-a="q">Queue</button></div>`:''}
${hist}<div class="row"><button data-a="hit">I hit the limit</button><button data-a="rw">Reset window</button><button data-a="cc">Copy context</button></div>`}
function hist2(){const h=S.hits.map(x=>`<li>${new Date(x.t).toLocaleString()} · hit at ~${kf(x.u)} tokens</li>`).join('')||'<li class="mu">No limit hits yet.</li>';
 R.getElementById('t2').innerHTML=`<div class="mu">Window started ${new Date(S.w.s).toLocaleTimeString()} · ${S.w.ev.length} messages</div><h4>Limit hits (${S.hits.length})</h4><ul>${h}</ul><button data-a="clr">Clear all Clauree data</button>`}
R.addEventListener('click',async e=>{const a=e.target.closest('[data-a]');if(!a)return;const k=a.dataset.a;
 if(k==='ex'){open1=!open1;render()}
 else if(k==='pl'){R.getElementById('in').value=draft()||R.getElementById('in').value;DR.hidden=false;R.getElementById('t1').hidden=false;R.getElementById('t2').hidden=true}
 else if(k==='dx')DR.hidden=true;
 else if(k==='tab1'){R.getElementById('t1').hidden=false;R.getElementById('t2').hidden=true}
 else if(k==='tab2'){hist2();R.getElementById('t1').hidden=true;R.getElementById('t2').hidden=false}
 else if(k==='run'){const t=R.getElementById('in').value.trim(),mo=R.getElementById('md').value,ms=R.getElementById('ms');if(!t){ms.textContent='Write a prompt first.';return}
  ms.textContent='Working…';a.disabled=true;const r=await ai(mo,t);a.disabled=false;
  if(r&&r.text){R.getElementById('out').value=r.text;const s=mo==='plan'?'':` · ${Math.round((1-est(r.text)/Math.max(1,est(t)))*100)}% fewer tokens (${est(t)} → ${est(r.text)})`;ms.textContent='Done with '+r.provider+s}
  else ms.textContent=(r&&r.error)||'Something went wrong. Try again.'}
 else if(k==='ap'){const o=R.getElementById('out').value;if(o&&setText(o))toast('Applied to the chat box');else toast('Nothing to apply, or chat box not found')}
 else if(k==='cp'){const o=R.getElementById('out');o.select();document.execCommand('copy');toast('Copied')}
 else if(k==='q')queue();else if(k==='cq'){S.q=null;save();render()}else if(k==='cc')copyCtx();
 else if(k==='hit'){S.hits.push({u:use(),t:Date.now()});save();toast('Recorded. Predictions updated.');render()}
 else if(k==='rw'){S.w={s:Date.now(),ev:[]};save();render()}
 else if(k==='clr'){localStorage.removeItem('clr.v1');S={w:{s:Date.now(),ev:[]},hits:[]};hist2();render()}});
setInterval(tick,600);window.addEventListener('resize',render);
window.__clr={show:()=>{H.style.display='flex'},hide:()=>{H.style.display='none'}};
render();
})();
