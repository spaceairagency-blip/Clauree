(()=>{
if(window.__clr){window.__clr.show();return}
const O='__ORIGIN__'.startsWith('__')?location.origin:'__ORIGIN__';
const C=Object.assign({composer:'div[contenteditable="true"]',send:'button[aria-label*="Send" i]',stop:'button[aria-label*="Stop" i]',user:'[data-testid="user-message"]',asst:'.font-claude-message,[data-testid="assistant-message"]',pop:'[role="dialog"],[aria-modal="true"],[role="menu"],[data-radix-popper-content-wrapper]',scope:'main'},JSON.parse(localStorage.getItem('clr.cfg')||'{}'));
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
const comp=()=>{const l=$$(C.composer).filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&!n.closest('[role="dialog"],[aria-modal="true"]')});return l.length?l.reduce((a,b)=>b.getBoundingClientRect().bottom>a.getBoundingClientRect().bottom?b:a):null};
const draft=()=>(comp()?comp().innerText:'').trim();
let lim=false;
const status=()=>lim?'Limit reached':!bud()?'Calibrating':pct()[1]>=80?'Danger':pct()[1]>=50?'Caution':'Safe';
function risk(){const t=draft();if(!t)return null;const ev=S.w.ev,ao=ev.length?ev.reduce((a,e)=>a+e.o,0)/ev.length:400;const cost=ctx()+est(t)+ao,b=bud();if(!b)return{cost,l:'~'+kf(cost)+' tok',c:'c'};const r=cost/Math.max(1,b.mid-use());return{cost,r,l:r>.25?'High risk':r>.1?'Medium risk':'Low risk',c:r>.25?'d':r>.1?'w':'s'}}

/* ---------- detection ---------- */
let lu=-1,pend=null,stab=0,ll=0,path=location.pathname;
const streaming=()=>!!$(C.stop);
function banner(){const root=$(C.scope)||document.body,ex=C.user+','+C.asst+',script,style,noscript,nav,aside,[role="navigation"]',w=document.createTreeWalker(root,5,{acceptNode:n=>n.nodeType===1?(n.matches(ex)?2:3):1});let t='',x;while(x=w.nextNode()){const p=x.parentElement;if(p&&p.getClientRects().length)t+=x.nodeValue+' '}t=t.slice(-3500);const m=/(limit|usage)[^.\n]{0,60}(reset|until|available again|try again)[^\n]{0,60}/i.exec(t);if(!m)return null;const cx=t.slice(Math.max(0,m.index-120),m.index+m[0].length);if(!/(reach|hit|exceed|out of|used up|run out|ran out|no more|too many)/i.test(cx)||(S.ign||[]).includes(m[0]))return null;return m[0]}
function parseReset(s){let m=/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(s);if(m){const d=new Date();d.setHours(+m[1]%12+(/pm/i.test(m[3])?12:0),+(m[2]||0),0,0);if(d<=Date.now())d.setDate(d.getDate()+1);return +d}m=/in\s+(?:(\d+)\s*h\w*)?\s*(?:and\s*)?(?:(\d+)\s*m\w*)?/i.exec(s);return m&&(m[1]||m[2])?Date.now()+((+m[1]||0)*60+(+m[2]||0))*6e4:null}
function tick(){
 if(location.pathname!==path){path=location.pathname;lu=-1;pend=null}
 const us=$$(C.user),as=$$(C.asst);
 if(lu<0||us.length<lu)lu=us.length;
 else if(us.length>lu){lu=us.length;pend={t:Date.now(),i:ctx(),p:est(us[us.length-1].innerText)};stab=0;ll=0}
 if(pend){const a=as[as.length-1],len=a?a.innerText.length:0;if(len>0&&len===ll&&!streaming())stab++;else stab=0;ll=len;if(stab>=3){S.w.ev.push({t:pend.t,i:pend.i,p:pend.p,o:est(a.innerText)});pend=null;stab=0;save()}}
 const b=banner();
 if(b&&!lim){const cut=!!pend;lim=true;pend=null;S.hits.push({u:use(),t:(S.lbT=Date.now())});S.hits=S.hits.slice(-10);S.lb=b;S.reset=parseReset(b);tagLast(cut);save();setTimeout(()=>{if(lim){sync();analyze(cut)}},20000)}
 else if(b&&lim&&!S.reset){S.reset=parseReset(b);save()}
 else if(!b&&lim){lim=false;S.reset=null;S.hist=(S.hist||[]).concat({s:S.w.s,e:Date.now(),n:S.w.ev.length,u:use()}).slice(-30);S.w={s:Date.now(),ev:[]};save();sync();S.qf=0;runQueue()}
 if(S.q&&!qb&&!lim&&!streaming()&&(!S.reset||Date.now()>=S.reset)&&(S.qf||0)<60&&Date.now()-(S.qt||0)>(S.qf?60000:15000)){S.qt=Date.now();runQueue()}
 resolveTags();render()}

/* ---------- composer + queue ---------- */
function setText(t){const c=comp();if(!c)return false;c.focus();document.execCommand('selectAll');document.execCommand('insertText',false,t);return true}
let qb=0;
function runQueue(force){const q=S.q;if(!q||qb)return;if(q.path!==location.pathname){if(force)toast('The queued prompt belongs to another chat');return}
 const d=draft();if(d&&d!==q.text){if(force)toast('Clear the chat box first');return}
 const n=$$(C.user).length;if(!setText(q.text)){if(force)toast('Chat box not found');return}
 qb=1;setTimeout(()=>{const b=$(C.send);if(b&&!b.disabled)b.click();else{const c=comp();c&&['keydown','keypress','keyup'].forEach(t=>c.dispatchEvent(new KeyboardEvent(t,{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true})))}
  setTimeout(()=>{qb=0;if($$(C.user).length>n){S.q=null;S.qf=0;save();toast('Queued prompt sent');render()}else{S.qf=(S.qf||0)+1;save();toast('Could not send ('+(b?(b.disabled?'send button is disabled':'no new message appeared'):'send button not found')+'). Retrying.')}},4000)},500)}
function queue(){const t=draft()||'Please continue from where you left off.';S.q={text:t,path:location.pathname};save();if(draft()){comp().focus();document.execCommand('selectAll');document.execCommand('delete')}toast('Queued. It sends when your limit resets and this tab is open.');render()}
function copyCtx(){const t=$$(C.user+','+C.asst).slice(-40).map(n=>(n.matches(C.user)?'User: ':'Assistant: ')+n.innerText.trim()).join('\n\n');
 const txt='Continue this conversation. Earlier messages are below.\n\n'+t;
 (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).catch(()=>{const a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}).then?0:0;toast('Context copied. Paste it into another AI.')}

/* ---------- AI (direct, popup-bridge fallback) ---------- */
let bw,ready=0,wait=[],br={};
addEventListener('message',e=>{if(e.origin!==O)return;const d=e.data||{};if(d.ready){ready=1;wait.splice(0).forEach(f=>f())}if(d.id&&br[d.id]){br[d.id](d.res);delete br[d.id]}if(d.hello&&e.source)e.source.postMessage({clrdata:{hits:S.hits,hist:S.hist||[],cuts:S.cuts||[],use:use(),msgs:S.w.ev.length,pct:pct()}},O)});
function bridge(body,p){return new Promise(res=>{if(matchMedia('(pointer:coarse)').matches&&!window.__clrExt)return res({error:'Your phone blocked the direct connection. Use the Clauree Firefox extension or the Clauree app.'});const id=Math.random();br[id]=res;const go=()=>bw.postMessage({id,body,path:p},O);
 if(!bw||bw.closed){ready=0;bw=open(O+'/bridge.html','clr','width=340,height=180')}
 if(!bw)return res({error:'Popup blocked. Allow popups for this site and try again.'});
 ready?go():wait.push(go);setTimeout(()=>{if(br[id]){delete br[id];res({error:'AI bridge timed out.'})}},p==='/api/chat'?70000:25000)})}
async function api(p,body){try{const r=await Promise.race([fetch(O+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),new Promise((_,j)=>setTimeout(j,p==='/api/chat'?70000:20000))]);return await r.json()}catch(e){return bridge(body,p)}}
const ai=(mode,text)=>{const b=bud();return api('/api/ai',{mode,text,budget:b?Math.round(b.mid-use()):null})};
const mrg=(a,b,k,n)=>{const m=new Map();[...(a||[]),...(b||[])].forEach(x=>x&&m.set(x[k],x));return[...m.values()].sort((x,y)=>x[k]-y[k]).slice(-n)};
async function sync(){if(!S.key)return false;const r=await api('/api/sync',{key:S.key,action:'put',hits:S.hits,hist:S.hist||[]});if(r&&r.hits){S.hits=mrg(S.hits,r.hits,'t',10);S.hist=mrg(S.hist,r.hist,'s',30);save();render();return true}return false}

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
.away #sp,.away #pn,.away #pw{visibility:hidden;pointer-events:none}.lk{border:0;background:none;color:var(--ac);text-decoration:underline;padding:0;cursor:pointer}.tag{position:fixed;transform:translateX(-100%);background:var(--da);color:#fff;font-size:11px;padding:2px 9px;border-radius:99px;pointer-events:none}
.n .bar{display:none}.n .s{gap:8px}
@media(max-width:600px){.dr{top:auto;left:8px;right:8px;bottom:8px;width:auto;max-height:82vh}.p{max-height:50vh}}
@media(pointer:coarse){button{min-height:40px;padding:8px 12px}.lk{min-height:0;padding:0}.s{gap:8px;padding:8px 10px}}
@media(prefers-reduced-motion:reduce){.bar i{transition:none}}
</style><div class="w" id="w"><div id="pn" class="p" hidden></div><div id="pw"></div><div id="sp"></div><div id="tg"></div>
<div class="s dr" id="dr" hidden><div class="row"><h4>Clauree</h4><button data-a="tab1">Planner</button><button data-a="tab2">History</button><button data-a="db">Dashboard</button><button data-a="dx" style="margin-left:auto">Close</button></div>
<div id="t1" style="display:grid;gap:10px"><select id="md"><option value="polish">Optimize: fewer tokens + clean grammar</option><option value="compress">Compress (fewer tokens)</option><option value="structure">Turn notes into a structured prompt</option><option value="clarify">Remove ambiguity and repetition</option><option value="plan">Plan a series of prompts</option></select>
<textarea id="in" placeholder="Your prompt or goal"></textarea><button class="pr" data-a="run">Run</button><div id="ms" class="mu"></div><textarea id="out" placeholder="Result"></textarea><div class="row"><button class="pr" data-a="ap">Apply to chat box</button><button data-a="cp">Copy</button></div></div>
<div id="t2" hidden></div></div><div class="t" id="to" hidden></div></div>`;
document.body.appendChild(H);
const W=R.getElementById('w'),PN=R.getElementById('pn'),SP=R.getElementById('sp'),DR=R.getElementById('dr'),TO=R.getElementById('to'),PW=R.getElementById('pw'),TG=R.getElementById('tg');
[SP,PN,PW].forEach(el=>{const d=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(el,'innerHTML',{get(){return d.get.call(el)},set(h){if(el._h!==h){el._h=h;d.set.call(el,h)}}})});
let open1=false,tt;
function toast(m){TO.textContent=m;TO.hidden=false;clearTimeout(tt);tt=setTimeout(()=>TO.hidden=true,3500)}
function anchorOf(c){let a=c.closest('fieldset,form,[data-composer]');if(a)return a;a=c.parentElement;for(let i=0;i<6&&a.parentElement&&a.getBoundingClientRect().width<360;i++)a=a.parentElement;return a}
const popup=()=>$$(C.pop).some(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0});
function place(){const c=comp(),a=c&&anchorOf(c);
 if(a){const r=a.getBoundingClientRect(),cs=getComputedStyle(a),w=Math.max(280,r.width);H.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';H.style.width=w+'px';H.style.right='auto';H.style.bottom=(innerHeight-r.top+8)+'px';H.style.setProperty('--r',Math.min(parseFloat(cs.borderTopLeftRadius)||14,20)+'px');H.style.fontFamily=cs.fontFamily}
 else{H.style.left='auto';H.style.right='16px';H.style.width='360px';H.style.bottom='16px'}
 const m=(getComputedStyle(document.body).backgroundColor.match(/\d+/g)||[255,255,255]);
 W.className='w'+((m[0]*299+m[1]*587+m[2]*114)/1000<128?' d':'')+(H.offsetWidth<520?' n':'')+(popup()?' away':'');drawTags()}
function render(){place();pwarn();const p=pct(),f=fc(),r=rm(),st=status(),rk=risk();
 if(lim)SP.innerHTML=`<div class="s lim"><b class="dot"></b><b>Limit reached</b><span class="tx">${r!=null?'resets in '+fm(r):'reset time unknown'}</span>${S.q?'<span class="chip">1 queued <button data-a="qn">Send now</button><button data-a="cq">✕</button></span>':''}<button class="pr" data-a="${cm?'cx':'cw'}">${cm?'Exit Clauree mode':'Continue with Clauree'}</button><button data-a="q">Queue and auto-send</button><button data-a="cc">Copy context</button><button data-a="pl">Plan</button><button data-a="nl">Not a limit</button></div>`;
 else SP.innerHTML=`<div class="s ${st}"><b class="dot"></b><span class="st">${st}</span><div class="bar"><i style="width:${p?p[1]:0}%"></i></div><span class="tx">${p?`~${p[0]}–${p[1]}%`:'~'+kf(use())+' tok'}${f?` · limit in ~${fm(f[0])}–${fm(f[1])}`:''}${r!=null?` · reset ${fm(r)}`:''}</span>${rk?`<span class="chip ${rk.c}">Next: ${rk.l}</span>`:''}${S.q?'<span class="chip">1 queued <button data-a="qn">Send now</button><button data-a="cq">✕</button></span>':''}${cm?'<span class="chip">Clauree mode <button data-a="cx">Exit</button></span>':''}<button data-a="pl" title="Planner">✦</button><button data-a="ex" title="Details">${open1?'⌄':'⌃'}</button></div>`;
 PN.hidden=!open1;if(open1)PN.innerHTML=panel(p,f,r,rk)}
function panel(p,f,r,rk){const ev=S.w.ev,T=use()||1,sp=ev.reduce((a,e)=>a+(e.p||0),0),so=ev.reduce((a,e)=>a+e.o,0),sh=Math.max(0,T-sp-so);
 const conf=S.hits.length>=3?'High':S.hits.length?'Medium':'Low';
 const hist=ev.length>=3&&sh/T>.5?`<div>Re-reading old messages is about ${Math.round(sh/T*100)}% of your usage. A new chat with a short summary would save most of that.</div>`:'';
 const fcs=f?`At this pace you will likely hit the limit in ${fm(f[0])}–${fm(f[1])}${r!=null?(f[1]<r?`, about ${fm(r-f[1])}–${fm(r-f[0])} before the reset`:', before the reset'):''}.`:(bud()?'Send a few more messages to get a forecast.':'No limit hit recorded yet. Clauree learns your budget the first time you reach it.');
 return `<div class="row"><h4>Usage this window</h4><span class="mu" style="margin-left:auto">Confidence: ${conf}</span></div>
<div>${p?`<b>~${p[0]}–${p[1]}%</b> used`:'<b>Calibrating</b>'} · ${ev.length} messages · ~${kf(use())} tokens</div><div>${fcs}</div>
<div><div class="seg"><i style="width:${sp/T*100}%"></i><i style="width:${sh/T*100}%"></i><i style="width:${so/T*100}%"></i></div><div class="mu">Your prompts · Chat re-read · Replies</div></div>
${rk?`<div><h4>Next prompt</h4>${rk.r!=null?`~${kf(rk.cost)} tokens, about ${Math.round(rk.r*100)}% of what is left (${rk.l}).`:`~${kf(rk.cost)} tokens.`}</div><div class="row"><button data-a="pl">Optimize</button><button data-a="q">Queue</button></div>`:''}
${hist}<div class="row"><button data-a="hit">I hit the limit</button><button data-a="rw">Reset window</button><button data-a="cc">Copy context</button><button data-a="${cm?'cx':'cw'}">${cm?'Exit Clauree mode':'Chat with Clauree'}</button></div>`}
function hist2(){const h=S.hits.map(x=>`<li>${new Date(x.t).toLocaleString()} · hit at ~${kf(x.u)} tokens</li>`).join('')||'<li class="mu">No limit hits yet.</li>';
 const cu=(S.cuts||[]).slice(-5).reverse().map(x=>`<li>${new Date(x.t).toLocaleString()} · ~${kf(x.stats.tokens)} tokens<br><span class="mu">${esc(x.note).replace(/\n/g,'<br>')}</span></li>`).join('')||'<li class="mu">No cutoffs logged yet.</li>';
 const w=(S.hist||[]).slice(-8).reverse().map(x=>`<li>${new Date(x.s).toLocaleDateString()} · ${x.n} messages · ~${kf(x.u)} tokens</li>`).join('')||'<li class="mu">No finished windows yet.</li>';
 const sy=S.key?`<div class="mu">Sync is on. Keep this key private: it opens your history on other browsers.</div><textarea readonly style="min-height:50px">${S.key}</textarea><div class="row"><button data-a="sk3">Sync now</button><button data-a="sk5">Copy key</button><button data-a="sk4">Stop syncing</button></div>`:`<div class="mu">Save your history online so it follows you between browsers. Only numbers and times are stored, never chat text.</div><div class="row"><button class="pr" data-a="sk1">Turn on sync</button><button data-a="sk2">I have a key</button></div>`;
 R.getElementById('t2').innerHTML=`<div class="mu">Window started ${new Date(S.w.s).toLocaleTimeString()} · ${S.w.ev.length} messages</div>${S.lb?`<div class="mu">Last limit text seen: “${S.lb.replace(/[&<>]/g,c=>'&#'+c.charCodeAt(0)+';')}”</div>`:''}<h4>Sync</h4>${sy}<h4>Limit hits (${S.hits.length})</h4><ul>${h}</ul><h4>Past windows</h4><ul>${w}</ul><h4>Cutoff log</h4><ul>${cu}</ul><button data-a="cons">${S.consent?'Stop sending chats to Grok':'Allow sending chats to Grok'}</button> <button data-a="clr">Clear data on this browser</button>`}
R.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;act(a,a.dataset.a).catch(x=>{console.error('Clauree',x);toast('Clauree error: '+((x&&x.message)||x))})});
async function act(a,k){
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
 else if(k==='hit'){S.hits.push({u:use(),t:Date.now()});S.hits=S.hits.slice(-10);save();toast('Recorded. Predictions updated.');render();sync()}
 else if(k==='rw'){S.w={s:Date.now(),ev:[]};save();render()}
 else if(k==='opt')optimize();else if(k==='undo'){if(OPT){setText(OPT.orig);OPT=null;render()}}else if(k==='db')open(O+'/dashboard.html','_blank');else if(k==='cons'){S.consent=!S.consent;save();hist2()}
 else if(k==='cw')center();else if(k==='cx')cexit();else if(k==='qn'){S.qf=0;runQueue(true)}
 else if(k==='nl'){S.ign=(S.ign||[]).concat(S.lb||[]).filter(Boolean).slice(-20);S.hits=S.hits.filter(h=>h.t!==S.lbT);if(S.tags&&S.tags[location.pathname])S.tags[location.pathname]=S.tags[location.pathname].filter(t=>t.t!==S.lbT);lim=false;S.reset=null;save();toast('Got it. That text will be ignored from now on.');render()}
 else if(k==='sk1'){const b=crypto.getRandomValues(new Uint8Array(32));S.key=btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');save();const ok=await sync();toast(ok?'Sync is on':'Key saved, but the server did not answer. Check the Supabase setup.');hist2()}
 else if(k==='sk2'){const v=(prompt('Paste your sync key')||'').trim();if(/^[A-Za-z0-9_-]{32,64}$/.test(v)){S.key=v;save();const ok=await sync();toast(ok?'Synced. History loaded.':'Could not reach the server.');hist2()}else if(v)toast('That does not look like a sync key')}
 else if(k==='sk3'){toast(await sync()?'Synced':'Sync failed');hist2()}
 else if(k==='sk4'){delete S.key;save();hist2();toast('Sync stopped. Online data stays until you delete it in Supabase.')}
 else if(k==='sk5'){navigator.clipboard&&navigator.clipboard.writeText(S.key).then(()=>toast('Key copied'),()=>toast('Copy failed'))}
 else if(k==='clr'){localStorage.removeItem('clr.v1');S={w:{s:Date.now(),ev:[]},hits:[],hist:[]};hist2();render()}}
/* ---------- Continue with Clauree ---------- */
var cm=0;let ov,OLD=[],seed=[],CH=[],cbusy=0;
const esc=s=>String(s).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
const sty=n=>{if(!n)return'';const s=getComputedStyle(n);return['background-color','color','font-family','font-size','line-height','border-radius','padding'].map(p=>p+':'+s.getPropertyValue(p)).join(';')};
const dlb=(name,blob)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)};
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=-1;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return(c^-1)>>>0};
function zip(files){const e=new TextEncoder(),P=[],Z=[];let off=0;const u16=n=>[n&255,n>>8&255],u32=n=>[n&255,n>>8&255,n>>16&255,n>>24&255];
 files.forEach(f=>{const nm=e.encode(f.fn.replace(/^\/+/,'')),d=e.encode(f.code),c=crc(d);
  const lh=[...u32(0x04034b50),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(nm.length),...u16(0)];
  P.push(new Uint8Array(lh),nm,d);
  Z.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm);
  off+=lh.length+nm.length+d.length});
 const cs=Z.reduce((a,b)=>a+b.length,0);
 return new Blob([...P,...Z,new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cs),...u32(off),...u16(0)])],{type:'application/zip'})}
function md(t,id){let h='',last=0,m;const re=/```([^\n`]*)\n([\s\S]*?)```/g,F=[];
 const inl=s=>esc(s).replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
 while(m=re.exec(t)){h+='<div>'+inl(t.slice(last,m.index))+'</div>';const info=m[1].trim(),lang=info.split(/[:\s]/)[0]||'',fn=(info.match(/[:\s]((?:[\w.-]+\/)*[\w.-]+\.\w+)$/)||[])[1]||'';
  const i=F.push({fn,code:m[2],lang})-1;
  h+=`<div class="cb"><div class="ch"><span>${esc(fn||lang||'code')}</span><span><button data-c="cp" data-m="${id}" data-i="${i}">Copy</button>${fn?`<button data-c="dl" data-m="${id}" data-i="${i}">Download</button>`:''}${/^(js|javascript|html)$/i.test(lang)?`<button data-c="run" data-m="${id}" data-i="${i}">Run</button>`:''}</span></div><pre>${esc(m[2])}</pre><div id="ro-${id}-${i}"></div></div>`;last=re.lastIndex}
 h+='<div>'+inl(t.slice(last))+'</div>';const n=F.filter(f=>f.fn).length;if(n>1)h+=`<button data-c="zip" data-m="${id}">Download all ${n} files (.zip)</button>`;return{h,F}}
function runCode(lang,code,box){const html=/html/i.test(lang),f=document.createElement('iframe'),id=Math.random();f.setAttribute('sandbox','allow-scripts');f.style.cssText='width:100%;border:0;height:'+(html?'260px':'0');
 f.srcdoc=html?code:`<script>const L=(...a)=>parent.postMessage({clr:${id},t:a.map(String).join(' ')},'*');console.log=L;console.error=L;onerror=e=>L('Error: '+e);try{${code}\n}catch(e){L('Error: '+e)}<\/script>`;
 box.innerHTML='<div style="font:12px monospace;white-space:pre-wrap;padding:8px"></div>';const o=box.firstChild;box.appendChild(f);
 if(!html){addEventListener('message',e=>{if(e.data&&e.data.clr===id)o.textContent+=e.data.t+'\n'});setTimeout(()=>{if(!o.textContent)o.textContent='(No output. If this stays empty, claude.ai may block running code here.)'},2500)}}
function mkov(){if(ov)return ov;ov=document.createElement('div');ov.id='clr-chat';ov.style.cssText='position:fixed;z-index:2147482000;overflow-y:auto;box-sizing:border-box;padding:16px';ov.addEventListener('click',oclick);document.body.appendChild(ov);return ov}
function plov(){if(!cm||!ov)return;const c=comp(),a=c&&anchorOf(c);if(!a){ov.style.display='none';return}
 const r=a.getBoundingClientRect(),top=Math.max(0,($(C.scope)||document.body).getBoundingClientRect().top),bg=getComputedStyle(document.body).backgroundColor;
 ov.style.display='block';ov.style.left=r.left+'px';ov.style.width=r.width+'px';ov.style.top=top+'px';ov.style.height=Math.max(80,r.top-56-top)+'px';ov.style.background=/, 0\)$/.test(bg)||bg==='transparent'?'#fff':bg}
function crender(){mkov();const us=sty($$(C.user).pop()),as=sty($$(C.asst).pop());
 ov.innerHTML='<style>#clr-chat pre{background:#0002;padding:10px;border-radius:8px;overflow:auto;font-size:12px;margin:0}#clr-chat code{background:#0002;padding:1px 4px;border-radius:4px}#clr-chat .cb{border:1px solid #8884;border-radius:8px;margin:8px 0;overflow:hidden}#clr-chat .ch{display:flex;justify-content:space-between;padding:4px 8px;font-size:12px;background:#0001}#clr-chat button{font:inherit;font-size:12px;margin-left:6px;cursor:pointer}</style><div></div>';
 const w=ov.lastElementChild;
 OLD.forEach(n=>{const d=document.createElement('div');if(n.parentElement)d.className=n.parentElement.className;d.appendChild(n.cloneNode(true));w.appendChild(d)});
 CH.forEach((m,i)=>{const d=document.createElement('div');
  if(m.role==='user'){d.style.cssText=us+';margin:12px 0 12px auto;width:fit-content;max-width:85%;white-space:pre-wrap';d.textContent=m.content}
  else{const r=md(m.content,i);m.F=r.F;d.style.cssText=as+';margin:12px 0;background:transparent;padding:0';d.innerHTML=r.h+(m.by?`<div style="font-size:11px;opacity:.6;margin-top:6px">Clauree · ${esc(m.by)}</div>`:'')}
  w.appendChild(d)});
 ov.scrollTop=ov.scrollHeight}
async function csend(){const t=draft();if(!t||cbusy)return;cbusy=1;comp().focus();document.execCommand('selectAll');document.execCommand('delete');
 CH.push({role:'user',content:t},{role:'assistant',content:'Clauree is thinking…',tmp:1});crender();
 const r=await api('/api/chat',{messages:[...seed,...CH.filter(m=>!m.tmp).map(m=>({role:m.role,content:m.content}))].slice(-40)});
 CH.pop();CH.push(r&&r.text?{role:'assistant',content:r.text,by:r.provider}:{role:'assistant',content:'Clauree error: '+((r&&r.error)||'no answer')});cbusy=0;crender()}
function center(){cm=1;OLD=$$(C.user+','+C.asst).slice(-30);seed=OLD.slice(-20).map(n=>({role:n.matches(C.user)?'user':'assistant',content:n.innerText.trim().slice(0,4000)})).filter(m=>m.content);CH=[];crender();render();toast('Clauree mode: what you type in the chat box now goes to Clauree, not Claude.')}
function cexit(){cm=0;if(ov){ov.remove();ov=null}render();toast('Back to Claude.')}
function oclick(e){const b=e.target.closest('[data-c]');if(!b)return;const m=CH[+b.dataset.m],f=m&&m.F&&m.F[+b.dataset.i],k=b.dataset.c;
 if(k==='cp'&&f)navigator.clipboard.writeText(f.code).then(()=>toast('Copied'));
 else if(k==='dl'&&f)dlb(f.fn.split('/').pop(),new Blob([f.code]));
 else if(k==='zip'&&m)dlb('clauree-files.zip',zip(m.F.filter(x=>x.fn)));
 else if(k==='run'&&f)runCode(f.lang,f.code,$('#ro-'+b.dataset.m+'-'+b.dataset.i,ov))}
document.addEventListener('keydown',e=>{if(!cm||qb||e.key!=='Enter'||e.shiftKey||e.isComposing)return;const c=comp();if(c&&c.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();csend()}},true);
document.addEventListener('click',e=>{if(!cm||qb)return;const b=e.target.closest&&e.target.closest(C.send);if(b){e.preventDefault();e.stopImmediatePropagation();csend()}},true);
/* ---------- cutoff tags, Grok log, pre-send optimizer ---------- */
var tgn=[],OPT=null,ob=0;const sg=new WeakMap(),nz=s=>s.replace(/\s+/g,' ').trim();
const sig=n=>{let s=sg.get(n);if(s)return s;s=(n.textContent||'').trim().slice(0,80);if(s.length>=80||!streaming())sg.set(n,s);return s};
function tagLast(cut){const as=$$(C.asst),n=as[as.length-1];if(!n)return;const p=location.pathname;S.tags=S.tags||{};(S.tags[p]=S.tags[p]||[]).push({sig:sig(n),kind:cut?'cut':'after',t:S.lbT});S.tags[p]=S.tags[p].slice(-30)}
function resolveTags(){const L=(S.tags&&S.tags[location.pathname])||[];if(!L.length){tgn=[];return}const as=$$(C.asst);tgn=L.map(t=>({n:as.find(x=>sig(x)===t.sig),k:t.kind})).filter(x=>x.n)}
function drawTags(){let h='';if(tgn.length&&!popup()&&!cm)tgn.forEach(t=>{if(!t.n.isConnected)return;const r=t.n.getBoundingClientRect();if(r.bottom<70||r.top>innerHeight-70)return;h+=`<div class="tag" style="top:${Math.max(r.top,70)+6}px;left:${Math.min(r.right,innerWidth)-8}px">Limit reached${t.k==='cut'?' here':' after this reply'}</div>`});TG.innerHTML=h}
async function analyze(cut){if(S.consent===undefined){S.consent=confirm('Clauree can send this chat to Grok (through your own Clauree server) to log why your limit hit and learn your pattern. The chat text is not stored, only a short note and numbers. Allow?');save()}
 if(!S.consent)return;const text=$$(C.user+','+C.asst).map(n=>(n.matches(C.user)?'User: ':'Assistant: ')+n.innerText.trim()).join('\n\n').slice(-30000);if(!text)return;
 const stats={tokens:use(),msgs:S.w.ev.length,chat:ctx(),cut,hour:new Date().getHours(),mins:Math.round((Date.now()-S.w.s)/6e4)};
 const r=await api('/api/analyze',{key:S.key||null,text,stats});if(r&&r.note){S.cuts=(S.cuts||[]).concat({t:Date.now(),path:location.pathname,stats,note:r.note}).slice(-30);save();toast('Limit logged: '+r.note.split('\n')[0].slice(0,90))}}
function pwarn(){const t=draft();if(OPT&&nz(t)!==OPT.txt)OPT=null;
 if(lim||cm||(!t&&!OPT)){PW.innerHTML='';return}
 if(ob){PW.innerHTML='<div class="s"><span>Optimizing your message…</span></div>';return}
 if(OPT){PW.innerHTML=`<div class="s"><span>✓ Optimized: ~${OPT.a} → ~${OPT.b} tokens (${Math.round((1-OPT.b/Math.max(1,OPT.a))*100)}% fewer). <button class="lk" data-a="undo">Undo</button></span></div>`;return}
 const x=est(t);if(x<60){PW.innerHTML='';return}
 PW.innerHTML=`<div class="s"><span>⚠ You are about to send this message and use ~${kf(x)} tokens (~${kf(x+ctx())} with this chat's history). <button class="lk" data-a="opt">Click here to let Clauree optimize it.</button></span></div>`}
async function optimize(){const t=draft();if(!t||ob)return;ob=1;pwarn();const r=await ai('polish',t);ob=0;
 if(r&&r.text&&setText(r.text))OPT={orig:t,txt:nz(r.text),a:est(t),b:est(r.text)};else toast((r&&r.error)||'Could not optimize. Try again.');render()}
setInterval(tick,600);setInterval(plov,150);setInterval(place,150);window.addEventListener('resize',render);if(window.visualViewport){visualViewport.addEventListener('resize',place);visualViewport.addEventListener('scroll',place)}sync();
if(!document.currentScript&&!window.__clrExt&&!S.seen){S.seen=1;save();open(O+'/dashboard.html?welcome=1','_blank')}
window.__clr={show:()=>{H.style.display='flex'},hide:()=>{H.style.display='none'}};
render();
})();
