const k={YV:"ve",YX:"ve",YY:"ve",AA:"us",AB:"us",AC:"us",AD:"us",AE:"us",AF:"us",AG:"us",AH:"us",AI:"us",AJ:"us",AK:"us",AL:"us",K:"us",N:"us",W:"us",VA:"ca",VB:"ca",VC:"ca",VD:"ca",VE:"ca",VF:"ca",VG:"ca",VY:"ca",CF:"ca",CG:"ca",CH:"ca",CI:"ca",CJ:"ca",CK:"ca",VX:"ca",XA:"mx",XB:"mx",XC:"mx",XD:"mx",XE:"mx",XF:"mx",PP:"br",PQ:"br",PR:"br",PS:"br",PT:"br",PU:"br",PV:"br",PW:"br",PX:"br",PY:"br",LO:"ar",LP:"ar",LQ:"ar",LR:"ar",LS:"ar",LT:"ar",LU:"ar",LV:"ar",LW:"ar",HJ:"co",HK:"co",CA:"cl",CB:"cl",CC:"cl",CD:"cl",CE:"cl",XQ:"cl",XR:"cl",OA:"pe",OB:"pe",OC:"pe",CP:"bo",HC:"ec",HD:"ec",ZP:"py",CV:"uy",CX:"uy",CL:"cu",CM:"cu",CN:"cu",CO:"cu",T4:"cu",HI:"do",HP:"pa",TE:"cr",TI:"cr",TG:"gt",HR:"hn",YS:"sv",YN:"ni",V3:"bz",HH:"ht",EA:"es",EB:"es",EC:"es",ED:"es",EE:"es",EF:"es",EG:"es",EH:"es",AM:"es",AN:"es",AO:"es",CR:"pt",CS:"pt",CT:"pt",CU:"pt",F:"fr",DA:"de",DB:"de",DC:"de",DD:"de",DE:"de",DF:"de",DG:"de",DH:"de",DI:"de",DJ:"de",DK:"de",DL:"de",DM:"de",DN:"de",DO:"de",DP:"de",DQ:"de",DR:"de",G:"gb",M:"gb",I:"it",PA:"nl",PB:"nl",PC:"nl",PD:"nl",PE:"nl",PF:"nl",PG:"nl",PH:"nl",PI:"nl",ON:"be",OO:"be",HB:"ch",HE:"ch",OE:"at",SA:"se",SB:"se",SC:"se",SD:"se",SE:"se",SF:"se",SG:"se",SH:"se",SI:"se",SJ:"se",SK:"se",SL:"se",SM:"se",LA:"no",LB:"no",LC:"no",LD:"no",LE:"no",LF:"no",LG:"no",LH:"no",LI:"no",LJ:"no",LK:"no",LL:"no",LM:"no",LN:"no",OZ:"dk",OU:"dk",OV:"dk",OW:"dk",OF:"fi",OG:"fi",OH:"fi",OI:"fi",OJ:"fi",RA:"ru",RB:"ru",RC:"ru",RD:"ru",RE:"ru",RF:"ru",RG:"ru",RH:"ru",RI:"ru",RJ:"ru",RK:"ru",RL:"ru",RM:"ru",RN:"ru",RO:"ru",RP:"ru",RQ:"ru",RR:"ru",RS:"ru",RT:"ru",RU:"ru",RV:"ru",RW:"ru",RX:"ru",RY:"ru",RZ:"ru",UA:"ru",UB:"ru",UC:"ru",UD:"ru",UE:"ru",UF:"ru",UG:"ru",UH:"ru",UI:"ru",JA:"jp",JB:"jp",JC:"jp",JD:"jp",JE:"jp",JF:"jp",JG:"jp",JH:"jp",JI:"jp",JJ:"jp",JK:"jp",JL:"jp",JM:"jp",JN:"jp",JO:"jp",JP:"jp",JQ:"jp",JR:"jp",JS:"jp",BA:"cn",BB:"cn",BC:"cn",BD:"cn",BE:"cn",BF:"cn",BG:"cn",BH:"cn",BI:"cn",BJ:"cn",BK:"cn",BL:"cn",BM:"cn",BN:"cn",BO:"cn",BP:"cn",BQ:"cn",BR:"cn",BS:"cn",BT:"cn",BU:"cn",BV:"tw",DS:"kr",DT:"kr",HL:"kr",VH:"au",VI:"au",VJ:"au",VK:"au",VL:"au",VM:"au",VN:"au",AX:"au",ZK:"nz",ZL:"nz",ZM:"nz",ZR:"za",ZS:"za",ZT:"za",ZU:"za",AT:"in",AU:"in",AV:"in",AW:"in",VU:"in",VV:"in",VW:"in"};function O(e){if(!e)return null;const a=e.toUpperCase().trim();for(let t=4;t>=1;t--){const n=a.slice(0,t);if(k[n])return k[n]}return null}function $(e,a){return`${e}${e.includes("?")?"&":"?"}tg=${encodeURIComponent(a)}`}function f(e){const a=Math.round(e/1e3);if(a<60)return`${a} s`;const t=Math.floor(a/60);return t<60?`${t} min ${String(a%60).padStart(2,"0")} s`:`${Math.floor(t/60)} h ${String(t%60).padStart(2,"0")} min`}function x(e){const a=Math.round(e/6e4);return a<1?{value:String(Math.round(e/1e3)),unit:"s"}:a<60?{value:String(a),unit:"min"}:{value:`${Math.floor(a/60)}:${String(a%60).padStart(2,"0")}`,unit:"h"}}function D(e){const a=new Date(e);return`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}function V(e,a=Date.now()){const t=Math.max(0,Math.round((a-e)/1e3));if(t<60)return`hace ${t} s`;const n=Math.floor(t/60);if(n<60)return`hace ${n} min`;const s=Math.floor(n/60);return s<24?`hace ${s} h`:`hace ${Math.floor(s/24)} d`}function U(e){if(e.kind==="beacon"){const t=e.file.replace(".wav","");return{title:t.length===4?`Baliza horaria · ${t.slice(0,2)}:${t.slice(2)}`:"Baliza horaria",category:"baliza"}}const a=e.file.replace(/\.wav$/,"").toLowerCase();return a.startsWith("sismo")?{title:"Reporte sísmico",category:"sismo"}:a.startsWith("inameh")||a.startsWith("clima")?{title:"Boletín meteorológico",category:"meteo"}:{title:a.replace(/_\d+$/,"").replace(/[_-]+/g," ")||"Aviso",category:"aviso"}}function I(e,a){if(e<=0||a<=0)return 0;const t=e/a;return t<.25?1:t<.5?2:t<.8?3:4}const N={activity:"Había conversación",busy:"TG ocupado toda la ventana",missing:"Falta el audio de esa hora"},F="/api/petra/",R='<p class="pt-error">No se pudo consultar la API</p>',z=["dom","lun","mar","mié","jue","vie","sáb"],G=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function r(e){const a=Number(e);return Number.isFinite(a)?a:0}function L(e,a,t){const n=(e||"").trim(),s=n?O(n):null,i=s?`<span class="fi fi-${l(s)} pt-flag" role="img" aria-label="${l(s.toUpperCase())}"></span>`:"",p=n?`<a class="pt-call" href="https://www.qrz.com/db/${encodeURIComponent(n)}" target="_blank" rel="noopener noreferrer" title="Ver ${l(n)} en QRZ.com">${l(n)}</a>`:`<span class="pt-call">${l(t)}</span>`,d=a?`<span class="pt-name">${l(a)}</span>`:"";return`<span class="pt-op">${i}${p}${d}</span>`}function J(e){return`<span data-rel="${r(e)}">${l(V(r(e)))}</span>`}function b(e,a){return e.querySelector(`[data-petra-slot="${a}"]`)}function h(e,a,t,n){let s,i=!1,p=null,d=!0;const u=async()=>{if(window.clearTimeout(s),!(!d&&document.visibilityState==="hidden")){d=!1,p?.abort(),p=new AbortController;try{const m=await fetch(F+e(),{headers:{accept:"application/json"},cache:"no-cache",signal:p.signal});if(!m.ok)throw new Error(String(m.status));const v=await m.json();i=!0,t(v)}catch(m){if(m?.name==="AbortError")return;n(i)}s=window.setTimeout(u,a)}},o=()=>{document.visibilityState==="visible"&&u()};return document.addEventListener("visibilitychange",o),u(),{refresh:()=>{i=!1,u()},stop:()=>{window.clearTimeout(s),p?.abort(),document.removeEventListener("visibilitychange",o)}}}function X(e,a){const t=b(e,"link");if(!t)return;const n=a.link;if(!n){t.innerHTML='<span class="pt-badge"><span class="pt-dot"></span>Enlace ?</span>';return}const s=n.state==="up",i=r(n.drops_24h);t.innerHTML=`
    <span class="pt-badge ${s?"pt-badge--ok":"pt-badge--bad"}">
      <span class="pt-dot ${s?"pt-dot--ok pt-dot--pulse":"pt-dot--bad"}"></span>${s?"Enlace activo":"Enlace caído"}
    </span>
    <span class="pt-note">Uptime 24 h <strong>${l(r(n.uptime_24h))}%</strong> · ${i} ${i===1?"caída":"caídas"}</span>
    ${n.host?`<span class="pt-note pt-host">${l(n.host)}</span>`:""}
  `}function K(e,a){const t=a.last_heard;if(!t){e.innerHTML='<p class="pt-empty">Sin actividad registrada todavía</p>';return}const n=t.open?'<span class="pt-onair"><span class="pt-dot pt-dot--bad pt-dot--pulse"></span>Al aire</span>':`<span class="pt-lh__dur">${l(f(r(t.dur_ms)))}</span><span class="pt-note">${J(t.at)}</span>`;e.innerHTML=`
    <div class="pt-lh">
      <div class="pt-lh__who">
        ${L(t.callsign,"",t.src_id)}
        <div class="pt-lh__sub">
          ${t.name?`<span class="pt-name">${l(t.name)}</span><span aria-hidden="true">·</span>`:""}
          <span class="pt-id">ID ${l(t.src_id)}</span>
        </div>
      </div>
      <div class="pt-lh__meta">${n}</div>
    </div>
  `}function W(e,a){const t=a.today,n=a.yesterday,s=r(t.count)-r(n.count),i=x(r(t.air_ms)),p=(d,u,o,m="",v="")=>`
    <div class="pt-tile">
      <div class="pt-tile__label">${l(d)}</div>
      <div class="pt-tile__value">${l(u)}${m?`<span class="pt-tile__unit">${l(m)}</span>`:""}</div>
      <div class="pt-tile__foot ${v}">${l(o)}</div>
    </div>`;e.innerHTML=[p("Transmisiones hoy",r(t.count).toLocaleString("es-VE"),s===0?"Igual que ayer":`${s>0?"+":""}${s} vs ayer a esta hora`,"",s>0?"is-up":s<0?"is-down":""),p("Tiempo al aire",i.value,r(t.count)>0?`Media ${f(r(t.avg_ms))}`:"Sin tráfico",i.unit),p("Operadores hoy",String(r(t.uniq_ops)),`${r(a.ops_7d)} en 7 días`),p("La más larga",r(t.longest_s)>0?f(r(t.longest_s)*1e3):"—",r(t.alerts)===1?"1 aviso al aire":`${r(t.alerts)} avisos al aire`)].join("")}function C(e,a,t=""){const n=Math.max(...e.map(s=>s.value),1);return`
    <div class="pt-bars ${t}" role="img" aria-label="${l(a)}">
      ${e.map(s=>{const i=s.value>0?Math.max(3,s.value/n*100):2;return`<div class="pt-bar pt-heat-${I(s.value,n)}" style="height:${i.toFixed(1)}%"><span class="pt-tip">${l(s.title)}</span></div>`}).join("")}
    </div>`}function Z(e,a,t){const n=Array.isArray(t)&&t.length?t.map(r):new Array(24).fill(0),s=Math.max(...n,0),i=b(e,"hourly-note");i&&(i.textContent=s>0?`Pico ${f(s)}`:"Sin tráfico hoy"),a.innerHTML=`
    ${C(n.map((p,d)=>({value:p,title:`${String(d).padStart(2,"0")}:00 · ${p>0?f(p):"sin tráfico"}`})),"Tiempo al aire por hora del día de hoy")}
    <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
  `}function j(e,a,t){if(e.length===0)return[];const n=Math.max(1,Math.round((e.length-1)/(a-1))),s=[];for(let p=0;p<e.length;p+=n)s.push(t(e[p],p));const i=t(e[e.length-1],e.length-1);return s[s.length-1]!==i&&s.push(i),s}function P(e,a){const t=G[Number(e.slice(5,7))-1]??e;return a&&a.slice(0,4)===e.slice(0,4)?t:`${t} ${e.slice(2,4)}`}function q(e,a,t){const n=Array.isArray(t.days)?t.days:[],s=Array.isArray(t.months)?t.months:[],i=n.reduce((o,m)=>o+r(m.air_s),0),p=b(e,"calendar-note");p&&(p.textContent=`${f(i*1e3)} en 30 días`);const d=(o,m)=>`${m} · ${r(o.air_s)>0?`${f(r(o.air_s)*1e3)} en ${r(o.n)} transmisiones`:"sin tráfico"}`,u=o=>`${o.slice(8,10)}/${o.slice(5,7)}`;a.innerHTML=`
    <div class="pt-cal">
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 30 días</p>
        ${C(n.map(o=>({value:r(o.air_s),title:d(o,u(o.label))})),"Tiempo al aire por día en los últimos 30 días")}
        <div class="pt-axis">${j(n,4,o=>u(o.label)).map(o=>`<span>${l(o)}</span>`).join("")}</div>
      </div>
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 12 meses</p>
        ${C(s.map((o,m)=>({value:r(o.air_s),title:d(o,P(o.label,s[m-1]?.label))})),"Tiempo al aire por mes en los últimos 12 meses","pt-bars--wide")}
        <div class="pt-axis">${j(s,4,(o,m)=>P(o.label,s[m-1]?.label)).map(o=>`<span>${l(o)}</span>`).join("")}</div>
      </div>
    </div>
  `}function Y(e,a){if(!Array.isArray(a)||a.length===0){e.innerHTML='<p class="pt-empty">Sin actividad en el periodo</p>';return}const t=r(a[0].air_ms)||1;e.innerHTML=`
    <ol class="pt-rank">
      ${a.map((n,s)=>{const i=Math.max(2,Math.min(100,r(n.air_ms)/t*100));return`
            <li class="pt-rank__row">
              <span class="pt-rank__pos ${s<3?`is-podium is-${s+1}`:""}">${s+1}</span>
              <div class="pt-rank__main">
                <div class="pt-row">
                  ${L(n.callsign,n.name,n.id)}
                  <span class="pt-row__val">${l(f(r(n.air_ms)))}</span>
                </div>
                <div class="pt-meter"><span style="width:${i.toFixed(1)}%"></span></div>
              </div>
            </li>`}).join("")}
    </ol>
  `}function Q(e,a){const t=Array.isArray(a.recent)?a.recent:[];if(t.length===0){e.innerHTML='<p class="pt-empty">Sin registros</p>';return}e.innerHTML=`
    <ul class="pt-list">
      ${t.map(n=>`
          <li class="pt-row">
            ${L(n.callsign,n.name,n.src_id)}
            <span class="pt-row__val">
              <span class="pt-clock">${l(D(r(n.at)))}</span>
              ${n.open?'<span class="pt-onair pt-onair--sm">Al aire</span>':`<span>${l(f(r(n.dur_ms)))}</span>`}
            </span>
          </li>`).join("")}
    </ul>
  `}function tt(e,a){const t=Array.isArray(a)?a:[],n=t.reduce((s,i)=>Math.max(s,...(i.hours??[]).map(r)),0);e.innerHTML=`
    <div class="pt-heat" role="img" aria-label="Segundos al aire por hora en los últimos 7 días">
      ${t.map(s=>{const i=z[new Date(`${s.day}T12:00:00`).getDay()]??s.day,p=(s.hours??[]).map((d,u)=>{const o=`${i} ${s.day.slice(8,10)}/${s.day.slice(5,7)} · ${String(u).padStart(2,"0")}:00 · ${r(d)>0?f(r(d)*1e3):"sin tráfico"}`;return`<span class="pt-heat__cell pt-heat-${I(r(d),n)}" title="${l(o)}"></span>`}).join("");return`<div class="pt-heat__row"><span class="pt-heat__day">${l(i)}</span><div class="pt-heat__cells">${p}</div></div>`}).join("")}
      <div class="pt-heat__row pt-heat__row--axis">
        <span class="pt-heat__day"></span>
        <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
      </div>
    </div>
  `}function g(e,a,t){return`<li class="pt-feed__item pt-feed__item--${e}"><div class="pt-feed__t">${l(a)}</div><div class="pt-feed__m">${t}</div></li>`}function at(e,a){const t=Object.entries(a.beacons_skipped??{}).map(([u,o])=>[u,r(o)]),n=t.reduce((u,[,o])=>u+o,0),s=r(a.beacons_sent),i=r(a.errors)>0||r(a.beacons_skipped?.missing)>0,p=r(a.alerts_sent)-r(a.alerts_seismic)-r(a.alerts_meteo),d=[];r(a.alerts_seismic)>0&&d.push(g("alert",`${r(a.alerts_seismic)} boletines sísmicos`,"FUNVISIS, llegados por la cola")),r(a.alerts_meteo)>0&&d.push(g("alert",`${r(a.alerts_meteo)} boletines meteorológicos`,"INAMEH, llegados por la cola")),p>0&&d.push(g("alert",`${p} otros avisos`,"Llegados por la cola, sin origen identificado"));for(const[u,o]of t)d.push(g(u==="missing"?"error":"beacon",`${o} ${o===1?"baliza omitida":"balizas omitidas"}`,l(N[u]??u)));r(a.errors)>0&&d.push(g("error",`${r(a.errors)} errores de audio`,"Un WAV de la cola no se pudo transmitir")),e.innerHTML=`
    <div class="pt-row pt-health__head">
      <span class="pt-badge ${i?"pt-badge--bad":"pt-badge--ok"}">
        <span class="pt-dot ${i?"pt-dot--bad":"pt-dot--ok"}"></span>${i?"Requiere atención":"Operando"}
      </span>
      <span class="pt-row__val"><span><strong>${s}</strong>/${s+n||1} balizas</span></span>
    </div>
    ${d.length?`<ul class="pt-feed">${d.join("")}</ul>`:""}
    <p class="pt-note pt-health__foot">
      ${r(a.last_beacon_at)>0?`Última baliza ${J(a.last_beacon_at)}`:"Ninguna baliza en la ventana"}
    </p>
  `}function et(e,a){if(!Array.isArray(a)||a.length===0){e.innerHTML='<p class="pt-empty">Todavía no se ha transmitido nada</p>';return}e.innerHTML=`
    <ul class="pt-feed pt-feed--compact">
      ${a.map(t=>{const{title:n}=U(t),s=t.error?"error":t.kind==="beacon"?"beacon":"alert",i=t.error?` · falló: ${l(t.error)}`:r(t.dur_ms)>0?` · ${l(f(r(t.dur_ms)))} al aire`:"";return g(s,n,`${l(D(r(t.at)))}${i}`)}).join("")}
    </ul>
  `}function nt(e,a){if(!Array.isArray(a)||a.length===0){e.innerHTML='<p class="pt-empty">Sin datos en el período</p>';return}e.innerHTML=`
    <div class="pt-stats">
      ${a.map(t=>`<div class="pt-stat"><span class="pt-stat__label">${l(t.label)}</span><span class="pt-stat__value">${l(r(t.avg))}</span></div>`).join("")}
    </div>
  `}function st(e,a,t){const n=b(e,"rne-day");n&&(n.textContent=t.day||"",n.hidden=!t.day);const s=Array.isArray(t.stations)?t.stations:[];if(s.length===0){a.innerHTML='<p class="pt-empty">Todavía no hay una emisión registrada</p>';return}a.innerHTML=`
    <ul class="pt-list pt-list--columns">
      ${s.map(i=>`
          <li class="pt-row">
            ${L(i.callsign,i.name,i.id)}
            <span class="pt-row__val">
              <span class="pt-clock">${l(D(r(i.at)))}</span>
              <span>${l(f(r(i.air_ms)))}</span>
            </span>
          </li>`).join("")}
    </ul>
  `}function rt(){const e=document.getElementById("petra-dashboard");if(!e)return;const a=e.dataset.tg||"734",t=c=>e.querySelector(`[data-petra-module="${c}"]`),n=c=>_=>{_||(c.innerHTML=R)};let s=0;const i=b(e,"updated"),p=()=>{i&&s&&(i.textContent=`Actualizado hace ${Math.round((Date.now()-s)/1e3)} s`)},d=t("live"),u=t("recent");(d||u)&&h(()=>$("live?limit=10",a),15e3,c=>{s=Date.now(),p(),X(e,c),d&&K(d,c),u&&Q(u,c)},c=>{c||(d&&(d.innerHTML=R),u&&(u.innerHTML=R))});const o=t("summary");o&&h(()=>$("summary",a),6e4,c=>W(o,c),()=>{});const m=t("hourly");m&&h(()=>$("hourly",a),6e4,c=>Z(e,m,c),n(m));const v=t("calendar");v&&h(()=>$("calendar?days=30&months=12",a),3e5,c=>q(e,v,c),n(v));const A=t("top");if(A){let c="7";const _=h(()=>$(`top?days=${c}&limit=8`,a),6e4,y=>Y(A,y),n(A));e.querySelectorAll("[data-top-days]").forEach(y=>{y.addEventListener("click",()=>{const B=y.dataset.topDays||"7";B!==c&&(c=B,e.querySelectorAll("[data-top-days]").forEach(w=>w.setAttribute("aria-pressed",String(w===y))),A.innerHTML='<div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div>',_.refresh())})})}const S=t("heatmap");S&&h(()=>$("heatmap?days=7",a),3e5,c=>tt(S,c),n(S));const M=t("health");M&&h(()=>$("health?hours=24",a),6e4,c=>at(M,c),n(M));const H=t("alerts");H&&h(()=>$("alerts?limit=12",a),6e4,c=>et(H,c),n(H));const E=t("rne-stats");E&&h(()=>$("rne-stats",a),3e5,c=>nt(E,c),n(E));const T=t("rne-report");T&&h(()=>$("rne-last-report",a),3e5,c=>st(e,T,c),n(T)),window.setInterval(()=>{document.visibilityState!=="hidden"&&(p(),e.querySelectorAll("[data-rel]").forEach(c=>{const _=Number(c.dataset.rel);_&&(c.textContent=V(_))}))},1e3)}rt();
