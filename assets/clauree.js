(()=>{
if(window.__clauree)return window.__clauree.t();
const HOST='__HOST__',K='clauree.v1',H=18e6,$=s=>document.querySelector(s);
let S;try{S=JSON.parse(localStorage[K])}catch(e){}
S=Object.assign({m:[],budget:15e4,reset:0,q:[],open:1,hit:0,cool:0},S);
const save=()=>{try{localStorage[K]=JSON.stringify(S)}catch(e){}};
const inp=()=>$('div[contenteditable="true"].ProseMirror')||$('div[contenteditable="true"]');
const sbtn=()=>$('button[aria-label^="Send"]');
const gen=()=>!!$('button[aria-label^="Stop"]');
const tok=t=>Math.ceil((t||'').length/4);
let ct=0,cT=0,auto=0,was=0,pend={},dT=0;
const conv=()=>Date.now()-cT>4e3?(cT=Date.now(),ct=tok(($('main')||document.body).innerText)):ct;
const win=()=>(S.m=S.m.filter(x=>Date.now()-x.t<H));
const used=()=>win().reduce((a,x)=>a+x.c,0);
const rst=()=>S.reset>Date.now()?S.reset:win()[0]?win()[0].t+H:0;
const risk=()=>{const d=(inp()?.innerText||'').trim(),c=conv()+tok(d)+800,rem=S.budget-used();return{d,c,rem,hi:c>rem,pct:Math.round(100*c/S.budget)}};
const put=t=>{const i=inp();if(!i)return 0;i.focus();document.execCommand('selectAll');document.execCommand('insertText',false,t);return 1};
const fire=t=>{if(!put(t))return;const c=conv()+tok(t)+800;setTimeout(()=>{const b=sbtn();if(b&&!b.disabled){S.m.push({t:Date.now(),c});save();auto=1;b.click();auto=0}},250)};
const onSend=e=>{if(auto)return;const r=risk();if(!r.d)return;
 if(r.hi&&!confirm('Clauree: this send is about '+r.c.toLocaleString()+' tokens but only ~'+Math.max(0,r.rem).toLocaleString()+' remain in your window. It will likely hit your limit. Send anyway?')){e.preventDefault();e.stopPropagation();return}
 S.m.push({t:Date.now(),c:r.c});save()};
addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.target.closest?.('[contenteditable]'))onSend(e)},true);
addEventListener('click',e=>{if(e.target.closest?.('button[aria-label^="Send"]'))onSend(e)},true);
const detect=()=>{if(Date.now()<S.cool||S.hit)return;
 const m=document.body.innerText.match(/(?:limit|messages)[^.]{0,60}?(?:until|resets?(?: at)?)\s+(\d{1,2})(?::(\d\d))?\s*([ap])\.?m/i);if(!m)return;
 const d=new Date();d.setHours(+m[1]%12+(/p/i.test(m[3])?12:0),+m[2]||0,0,0);if(d<Date.now())d.setDate(d.getDate()+1);
 S.reset=+d;S.hit=1;S.budget=Math.max(2e4,used());save()};
const h=document.createElement('div'),R=h.attachShadow({mode:'open'});
R.innerHTML=`<style>*{box-sizing:border-box;font:12px system-ui,sans-serif;color:#3D3929}
#w{background:#FAF9F5;border:1px solid #E8E2D6;border-radius:14px;box-shadow:0 4px 18px #0002;width:min(380px,92vw);overflow:hidden}
#h{display:flex;gap:8px;align-items:center;padding:8px 12px;cursor:pointer;background:#fff}
#h b{color:#D95D39;font-size:13px}#sm{margin-left:auto;color:#6b6555}
#b{padding:10px 12px;display:grid;gap:8px}
.bar{height:6px;background:#EDE8DC;border-radius:9px}.bar i{display:block;height:100%;background:#D95D39;border-radius:9px;width:0}
.g{display:grid;grid-template-columns:1fr 1fr;gap:4px}.g div{background:#fff;border:1px solid #E8E2D6;border-radius:8px;padding:5px 7px}.g b{display:block;font-size:14px}
#wn{padding:6px 8px;border-radius:8px;background:#fff;border:1px solid #E8E2D6}#wn.x{background:#FBE9E3;border-color:#D95D39}
textarea{width:100%;height:46px;border:1px solid #E8E2D6;border-radius:8px;padding:6px;background:#fff;resize:none}
.r{display:flex;gap:6px;flex-wrap:wrap}button{border:1px solid #D95D39;background:#fff;color:#D95D39;border-radius:8px;padding:5px 9px;cursor:pointer}button.p{background:#D95D39;color:#fff}
#lm{display:none;padding:10px 12px;background:#FBE9E3;border-bottom:1px solid #D95D39;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}#lm span{font-weight:600;color:#D95D39}#cw{font-size:13px;padding:8px 14px;box-shadow:0 2px 8px #d95d3966}#ql div{padding:2px 0;cursor:pointer}</style>
<div id=w><div id=lm><span id=lt></span><button class=p id=cw>Continue With Clauree</button></div><div id=h><b>Clauree</b><span id=sm></span></div><div id=b>
<div class=bar><i id=br></i></div>
<div class=g><div>Used (tokens)<b id=u></b></div><div>Messages left (est.)<b id=ml></b></div><div>Tokens left<b id=tl></b></div><div>Resets in<b id=rs></b></div></div>
<div id=wn></div>
<textarea id=qt placeholder="Queue a follow-up..."></textarea>
<div class=r><button class=p id=qa>Send after reply</button><button id=qr>Send at reset</button></div>
<div id=ql></div>
<div class=r><button id=pl>Plan with Grok</button><button id=fb>Continue With Clauree</button><button id=cf>Settings</button></div></div></div>`;
document.body.append(h);
const E=i=>R.getElementById(i);
const f=ms=>ms>0?[ms/36e5,ms/6e4%60,ms/1e3%60].map(x=>String(x|0).padStart(2,0)).join(':'):'--';
const render=()=>{const r=risk(),u=used(),n=win().length,avg=Math.max(n?u/n:r.c,500),left=Math.max(0,S.budget-u),a=rst(),ml=Math.floor(left/avg);
 const i=inp(),b=i&&i.getBoundingClientRect();
 h.style.cssText=b?'position:fixed;z-index:99999;left:'+Math.max(8,b.left)+'px;bottom:'+(innerHeight-b.top+70)+'px':'position:fixed;z-index:99999;right:12px;bottom:12px';
 E('sm').textContent=S.hit?'LIMIT HIT - resets in '+f(S.reset-Date.now()):'~'+ml+' msgs left';
 E('lm').style.display=S.hit?'flex':'none';E('lt').textContent='Limit reached. Resets in '+f(S.reset-Date.now());E('b').style.display=S.open?'grid':'none';
 E('u').textContent=u.toLocaleString();E('ml').textContent=ml;E('tl').textContent=left.toLocaleString();E('rs').textContent=a?f(a-Date.now()):'--';
 E('br').style.width=Math.min(100,100*u/S.budget)+'%';
 const w=E('wn');w.className=r.hi?'x':'';
 w.textContent=r.d?'Draft ~'+r.c.toLocaleString()+' tokens ('+r.pct+'% of your window)'+(r.hi?' \u26A0 likely to trigger your limit':''):'Type a prompt and I will estimate its cost.';
 const k=JSON.stringify(S.q),ql=E('ql');
 if(ql._k!==k){ql._k=k;ql.replaceChildren(...S.q.map((x,j)=>{const d=document.createElement('div');d.textContent=(x.mode=='reset'?'\u23F0 at reset: ':'\u21AA after reply: ')+x.text.slice(0,36)+' (click to remove)';d.onclick=()=>{S.q.splice(j,1);save()};return d}))}};
E('h').onclick=()=>{S.open=!S.open;save();render()};
const qadd=m=>{const t=E('qt').value.trim();if(!t)return;let at=0;
 if(m=='reset'){at=rst();if(!at)return alert('Clauree: no reset time known yet. Send a message first or set one in Settings.')}
 S.q.push({text:t,mode:m,at,now:m=='after'&&!gen()&&!S.hit});E('qt').value='';save()};
E('qa').onclick=()=>qadd('after');E('qr').onclick=()=>qadd('reset');
const ctx=()=>[...document.querySelectorAll('[data-testid="user-message"],.font-claude-response')].map(n=>n.innerText).join('\n\n').slice(-6000);
const pop=(s,m)=>{pend=s;open(HOST+'/#'+m,'clauree','width=480,height=760')};
E('pl').onclick=()=>pop({draft:risk().d},'planner');
const cont=()=>pop({ctx:ctx(),draft:S.q[0]?.text||risk().d},'continue');E('cw').onclick=cont;E('fb').onclick=cont;
E('cf').onclick=()=>{const b=prompt('Token budget per 5-hour window (auto-calibrates when a limit hits):',S.budget);if(+b>0)S.budget=+b;
 const t=prompt('Reset time as HH:MM (24h), blank to keep:','');
 if(/^\d{1,2}:\d\d$/.test(t||'')){const d=new Date(),p=t.split(':');d.setHours(+p[0],+p[1],0,0);if(d<Date.now())d.setDate(d.getDate()+1);S.reset=+d}save()};
addEventListener('message',e=>{if(e.origin!==new URL(HOST).origin)return;const d=e.data||{};
 if(d.clauree=='ready')e.source.postMessage({clauree:'seed',...pend},e.origin);
 if(d.clauree=='insert')put(d.text)});
const tick=()=>{const n=Date.now(),g=gen();
 if(n-dT>3e3){dT=n;detect()}
 if(S.hit&&n>=S.reset){S.hit=0;S.reset=0;S.cool=n+6e5;save()}
 const i=S.q.findIndex(x=>!g&&!S.hit&&(x.mode=='reset'?n>=x.at:x.now||was));
 if(i>=0){fire(S.q.splice(i,1)[0].text);save()}
 was=g;render()};
window.__clauree={t:()=>{S.open=!S.open;save();render()}};
setInterval(tick,1000);tick();
})();
