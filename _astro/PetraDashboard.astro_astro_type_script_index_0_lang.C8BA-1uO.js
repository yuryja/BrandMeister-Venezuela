import{t as e}from"./callsign-country.CaNU7VBD.js";var t=[`live`,`summary`,`hourly`,`calendar`,`top`,`recent`,`heatmap`];[...t],[...t],[...t],[...t];function n(e,t){return`${e}${e.includes(`?`)?`&`:`?`}tg=${encodeURIComponent(t)}`}function r(e){let t=Math.round(e/1e3);if(t<60)return`${t} s`;let n=Math.floor(t/60);return n<60?`${n} min ${String(t%60).padStart(2,`0`)} s`:`${Math.floor(n/60)} h ${String(n%60).padStart(2,`0`)} min`}function i(e){let t=Math.round(e/6e4);return t<1?{value:String(Math.round(e/1e3)),unit:`s`}:t<60?{value:String(t),unit:`min`}:{value:`${Math.floor(t/60)}:${String(t%60).padStart(2,`0`)}`,unit:`h`}}function a(e){let t=new Date(e);return`${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}function o(e,t=Date.now()){let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return`hace ${n} s`;let r=Math.floor(n/60);if(r<60)return`hace ${r} min`;let i=Math.floor(r/60);return i<24?`hace ${i} h`:`hace ${Math.floor(i/24)} d`}function s(e){if(e.kind===`beacon`){let t=e.file.replace(`.wav`,``);return{title:t.length===4?`Baliza horaria · ${t.slice(0,2)}:${t.slice(2)}`:`Baliza horaria`,category:`baliza`}}let t=e.file.replace(/\.wav$/,``).toLowerCase();return t.startsWith(`sismo`)?{title:`Reporte sísmico`,category:`sismo`}:t.startsWith(`inameh`)||t.startsWith(`clima`)?{title:`Boletín meteorológico`,category:`meteo`}:{title:t.replace(/_\d+$/,``).replace(/[_-]+/g,` `)||`Aviso`,category:`aviso`}}function c(e,t){if(e<=0||t<=0)return 0;let n=e/t;return n<.25?1:n<.5?2:n<.8?3:4}var l={activity:`Había conversación`,busy:`TG ocupado toda la ventana`,missing:`Falta el audio de esa hora`},u=`/api/petra/`,d=`<p class="pt-error">No se pudo consultar la API</p>`,f=[`dom`,`lun`,`mar`,`mié`,`jue`,`vie`,`sáb`],p=[`ene`,`feb`,`mar`,`abr`,`may`,`jun`,`jul`,`ago`,`sep`,`oct`,`nov`,`dic`];function m(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function h(e){let t=Number(e);return Number.isFinite(t)?t:0}function g(t,n,r){let i=(t||``).trim(),a=i?e(i):null;return`<span class="pt-op">${a?`<span class="fi fi-${m(a)} pt-flag" role="img" aria-label="${m(a.toUpperCase())}"></span>`:``}${i?`<a class="pt-call" href="https://www.qrz.com/db/${encodeURIComponent(i)}" target="_blank" rel="noopener noreferrer" title="Ver ${m(i)} en QRZ.com">${m(i)}</a>`:`<span class="pt-call">${m(r)}</span>`}${n?`<span class="pt-name">${m(n)}</span>`:``}</span>`}function _(e){return`<span data-rel="${h(e)}">${m(o(h(e)))}</span>`}function v(e,t){return e.querySelector(`[data-petra-slot="${t}"]`)}function y(e,t,n,r){let i,a=!1,o=null,s=!0,c=async()=>{if(window.clearTimeout(i),s||document.visibilityState!==`hidden`){s=!1,o?.abort(),o=new AbortController;try{let t=await fetch(u+e(),{headers:{accept:`application/json`},cache:`no-cache`,signal:o.signal});if(!t.ok)throw Error(String(t.status));let r=await t.json();a=!0,n(r)}catch(e){if(e?.name===`AbortError`)return;r(a)}i=window.setTimeout(c,t)}},l=()=>{document.visibilityState===`visible`&&c()};return document.addEventListener(`visibilitychange`,l),c(),{refresh:()=>{a=!1,c()},stop:()=>{window.clearTimeout(i),o?.abort(),document.removeEventListener(`visibilitychange`,l)}}}function b(e,t){let n=v(e,`link`);if(!n)return;let r=t.link;if(!r){n.innerHTML=`<span class="pt-badge"><span class="pt-dot"></span>Enlace ?</span>`;return}let i=r.state===`up`,a=h(r.drops_24h);n.innerHTML=`
    <span class="pt-badge ${i?`pt-badge--ok`:`pt-badge--bad`}">
      <span class="pt-dot ${i?`pt-dot--ok pt-dot--pulse`:`pt-dot--bad`}"></span>${i?`Enlace activo`:`Enlace caído`}
    </span>
    <span class="pt-note">Uptime 24 h <strong>${m(h(r.uptime_24h))}%</strong> · ${a} ${a===1?`caída`:`caídas`}</span>
    ${r.host?`<span class="pt-note pt-host">${m(r.host)}</span>`:``}
  `}function x(e,t){let n=t.last_heard;if(!n){e.innerHTML=`<p class="pt-empty">Sin actividad registrada todavía</p>`;return}let i=n.open?`<span class="pt-onair"><span class="pt-dot pt-dot--bad pt-dot--pulse"></span>Al aire</span>`:`<span class="pt-lh__dur">${m(r(h(n.dur_ms)))}</span><span class="pt-note">${_(n.at)}</span>`;e.innerHTML=`
    <div class="pt-lh">
      <div class="pt-lh__who">
        ${g(n.callsign,``,n.src_id)}
        <div class="pt-lh__sub">
          ${n.name?`<span class="pt-name">${m(n.name)}</span><span aria-hidden="true">·</span>`:``}
          <span class="pt-id">ID ${m(n.src_id)}</span>
        </div>
      </div>
      <div class="pt-lh__meta">${i}</div>
    </div>
  `}function S(e,t){let n=t.today,a=t.yesterday,o=h(n.count)-h(a.count),s=i(h(n.air_ms)),c=(e,t,n,r=``,i=``)=>`
    <div class="pt-tile">
      <div class="pt-tile__label">${m(e)}</div>
      <div class="pt-tile__value">${m(t)}${r?`<span class="pt-tile__unit">${m(r)}</span>`:``}</div>
      <div class="pt-tile__foot ${i}">${m(n)}</div>
    </div>`;e.innerHTML=[c(`Transmisiones hoy`,h(n.count).toLocaleString(`es-VE`),o===0?`Igual que ayer`:`${o>0?`+`:``}${o} vs ayer a esta hora`,``,o>0?`is-up`:o<0?`is-down`:``),c(`Tiempo al aire`,s.value,h(n.count)>0?`Media ${r(h(n.avg_ms))}`:`Sin tráfico`,s.unit),c(`Operadores hoy`,String(h(n.uniq_ops)),`${h(t.ops_7d)} en 7 días`),c(`La más larga`,h(n.longest_s)>0?r(h(n.longest_s)*1e3):`—`,h(n.alerts)===1?`1 aviso al aire`:`${h(n.alerts)} avisos al aire`)].join(``)}function C(e,t,n=``){let r=Math.max(...e.map(e=>e.value),1);return`
    <div class="pt-bars ${n}" role="img" aria-label="${m(t)}">
      ${e.map(e=>{let t=e.value>0?Math.max(3,e.value/r*100):2;return`<div class="pt-bar pt-heat-${c(e.value,r)}" style="height:${t.toFixed(1)}%"><span class="pt-tip">${m(e.title)}</span></div>`}).join(``)}
    </div>`}function w(e,t,n){let i=Array.isArray(n)&&n.length?n.map(h):Array(24).fill(0),a=Math.max(...i,0),o=v(e,`hourly-note`);o&&(o.textContent=a>0?`Pico ${r(a)}`:`Sin tráfico hoy`),t.innerHTML=`
    ${C(i.map((e,t)=>({value:e,title:`${String(t).padStart(2,`0`)}:00 · ${e>0?r(e):`sin tráfico`}`})),`Tiempo al aire por hora del día de hoy`)}
    <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
  `}function T(e,t,n){if(e.length===0)return[];let r=Math.max(1,Math.round((e.length-1)/(t-1))),i=[];for(let t=0;t<e.length;t+=r)i.push(n(e[t],t));let a=n(e[e.length-1],e.length-1);return i[i.length-1]!==a&&i.push(a),i}function E(e,t){let n=p[Number(e.slice(5,7))-1]??e;return t&&t.slice(0,4)===e.slice(0,4)?n:`${n} ${e.slice(2,4)}`}function D(e,t,n){let i=Array.isArray(n.days)?n.days:[],a=Array.isArray(n.months)?n.months:[],o=i.reduce((e,t)=>e+h(t.air_s),0),s=v(e,`calendar-note`);s&&(s.textContent=`${r(o*1e3)} en 30 días`);let c=(e,t)=>`${t} · ${h(e.air_s)>0?`${r(h(e.air_s)*1e3)} en ${h(e.n)} transmisiones`:`sin tráfico`}`,l=e=>`${e.slice(8,10)}/${e.slice(5,7)}`;t.innerHTML=`
    <div class="pt-cal">
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 30 días</p>
        ${C(i.map(e=>({value:h(e.air_s),title:c(e,l(e.label))})),`Tiempo al aire por día en los últimos 30 días`)}
        <div class="pt-axis">${T(i,4,e=>l(e.label)).map(e=>`<span>${m(e)}</span>`).join(``)}</div>
      </div>
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 12 meses</p>
        ${C(a.map((e,t)=>({value:h(e.air_s),title:c(e,E(e.label,a[t-1]?.label))})),`Tiempo al aire por mes en los últimos 12 meses`,`pt-bars--wide`)}
        <div class="pt-axis">${T(a,4,(e,t)=>E(e.label,a[t-1]?.label)).map(e=>`<span>${m(e)}</span>`).join(``)}</div>
      </div>
    </div>
  `}function O(e,t){if(!Array.isArray(t)||t.length===0){e.innerHTML=`<p class="pt-empty">Sin actividad en el periodo</p>`;return}let n=h(t[0].air_ms)||1;e.innerHTML=`
    <ol class="pt-rank">
      ${t.map((e,t)=>{let i=Math.max(2,Math.min(100,h(e.air_ms)/n*100));return`
            <li class="pt-rank__row">
              <span class="pt-rank__pos ${t<3?`is-podium is-${t+1}`:``}">${t+1}</span>
              <div class="pt-rank__main">
                <div class="pt-row">
                  ${g(e.callsign,e.name,e.id)}
                  <span class="pt-row__val">${m(r(h(e.air_ms)))}</span>
                </div>
                <div class="pt-meter"><span style="width:${i.toFixed(1)}%"></span></div>
              </div>
            </li>`}).join(``)}
    </ol>
  `}function k(e,t){let n=Array.isArray(t.recent)?t.recent:[];if(n.length===0){e.innerHTML=`<p class="pt-empty">Sin registros</p>`;return}e.innerHTML=`
    <ul class="pt-list">
      ${n.map(e=>`
          <li class="pt-row">
            ${g(e.callsign,e.name,e.src_id)}
            <span class="pt-row__val">
              <span class="pt-clock">${m(a(h(e.at)))}</span>
              ${e.open?`<span class="pt-onair pt-onair--sm">Al aire</span>`:`<span>${m(r(h(e.dur_ms)))}</span>`}
            </span>
          </li>`).join(``)}
    </ul>
  `}function A(e,t){let n=Array.isArray(t)?t:[],i=n.reduce((e,t)=>Math.max(e,...(t.hours??[]).map(h)),0);e.innerHTML=`
    <div class="pt-heat" role="img" aria-label="Segundos al aire por hora en los últimos 7 días">
      ${n.map(e=>{let t=f[new Date(`${e.day}T12:00:00`).getDay()]??e.day,n=(e.hours??[]).map((n,a)=>{let o=`${t} ${e.day.slice(8,10)}/${e.day.slice(5,7)} · ${String(a).padStart(2,`0`)}:00 · ${h(n)>0?r(h(n)*1e3):`sin tráfico`}`;return`<span class="pt-heat__cell pt-heat-${c(h(n),i)}" title="${m(o)}"></span>`}).join(``);return`<div class="pt-heat__row"><span class="pt-heat__day">${m(t)}</span><div class="pt-heat__cells">${n}</div></div>`}).join(``)}
      <div class="pt-heat__row pt-heat__row--axis">
        <span class="pt-heat__day"></span>
        <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
      </div>
    </div>
  `}function j(e,t,n){return`<li class="pt-feed__item pt-feed__item--${e}"><div class="pt-feed__t">${m(t)}</div><div class="pt-feed__m">${n}</div></li>`}function M(e,t){let n=Object.entries(t.beacons_skipped??{}).map(([e,t])=>[e,h(t)]),r=n.reduce((e,[,t])=>e+t,0),i=h(t.beacons_sent),a=h(t.errors)>0||h(t.beacons_skipped?.missing)>0,o=h(t.alerts_sent)-h(t.alerts_seismic)-h(t.alerts_meteo),s=[];h(t.alerts_seismic)>0&&s.push(j(`alert`,`${h(t.alerts_seismic)} boletines sísmicos`,`FUNVISIS, llegados por la cola`)),h(t.alerts_meteo)>0&&s.push(j(`alert`,`${h(t.alerts_meteo)} boletines meteorológicos`,`INAMEH, llegados por la cola`)),o>0&&s.push(j(`alert`,`${o} otros avisos`,`Llegados por la cola, sin origen identificado`));for(let[e,t]of n)s.push(j(e===`missing`?`error`:`beacon`,`${t} ${t===1?`baliza omitida`:`balizas omitidas`}`,m(l[e]??e)));h(t.errors)>0&&s.push(j(`error`,`${h(t.errors)} errores de audio`,`Un WAV de la cola no se pudo transmitir`)),e.innerHTML=`
    <div class="pt-row pt-health__head">
      <span class="pt-badge ${a?`pt-badge--bad`:`pt-badge--ok`}">
        <span class="pt-dot ${a?`pt-dot--bad`:`pt-dot--ok`}"></span>${a?`Requiere atención`:`Operando`}
      </span>
      <span class="pt-row__val"><span><strong>${i}</strong>/${i+r||1} balizas</span></span>
    </div>
    ${s.length?`<ul class="pt-feed">${s.join(``)}</ul>`:``}
    <p class="pt-note pt-health__foot">
      ${h(t.last_beacon_at)>0?`Última baliza ${_(t.last_beacon_at)}`:`Ninguna baliza en la ventana`}
    </p>
  `}function N(e,t){if(!Array.isArray(t)||t.length===0){e.innerHTML=`<p class="pt-empty">Todavía no se ha transmitido nada</p>`;return}e.innerHTML=`
    <ul class="pt-feed pt-feed--compact">
      ${t.map(e=>{let{title:t}=s(e),n=e.error?`error`:e.kind===`beacon`?`beacon`:`alert`,i=e.error?` · falló: ${m(e.error)}`:h(e.dur_ms)>0?` · ${m(r(h(e.dur_ms)))} al aire`:``;return j(n,t,`${m(a(h(e.at)))}${i}`)}).join(``)}
    </ul>
  `}function P(e,t){if(!Array.isArray(t)||t.length===0){e.innerHTML=`<p class="pt-empty">Sin datos en el período</p>`;return}e.innerHTML=`
    <div class="pt-stats">
      ${t.map(e=>`<div class="pt-stat"><span class="pt-stat__label">${m(e.label)}</span><span class="pt-stat__value">${m(h(e.avg))}</span></div>`).join(``)}
    </div>
  `}function F(e,t,n){let i=v(e,`rne-day`);i&&(i.textContent=n.day||``,i.hidden=!n.day);let o=Array.isArray(n.stations)?n.stations:[];if(o.length===0){t.innerHTML=`<p class="pt-empty">Todavía no hay una emisión registrada</p>`;return}t.innerHTML=`
    <ul class="pt-list pt-list--columns">
      ${o.map(e=>`
          <li class="pt-row">
            ${g(e.callsign,e.name,e.id)}
            <span class="pt-row__val">
              <span class="pt-clock">${m(a(h(e.at)))}</span>
              <span>${m(r(h(e.air_ms)))}</span>
            </span>
          </li>`).join(``)}
    </ul>
  `}function I(){let e=document.getElementById(`petra-dashboard`);if(!e)return;let t=e.dataset.tg||`734`,r=t=>e.querySelector(`[data-petra-module="${t}"]`),i=e=>t=>{t||(e.innerHTML=d)},a=0,s=v(e,`updated`),c=()=>{s&&a&&(s.textContent=`Actualizado hace ${Math.round((Date.now()-a)/1e3)} s`)},l=r(`live`),u=r(`recent`);(l||u)&&y(()=>n(`live?limit=10`,t),15e3,t=>{a=Date.now(),c(),b(e,t),l&&x(l,t),u&&k(u,t)},e=>{e||(l&&(l.innerHTML=d),u&&(u.innerHTML=d))});let f=r(`summary`);f&&y(()=>n(`summary`,t),6e4,e=>S(f,e),()=>{});let p=r(`hourly`);p&&y(()=>n(`hourly`,t),6e4,t=>w(e,p,t),i(p));let m=r(`calendar`);m&&y(()=>n(`calendar?days=30&months=12`,t),3e5,t=>D(e,m,t),i(m));let h=r(`top`);if(h){let r=`7`,a=y(()=>n(`top?days=${r}&limit=8`,t),6e4,e=>O(h,e),i(h));e.querySelectorAll(`[data-top-days]`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.topDays||`7`;n!==r&&(r=n,e.querySelectorAll(`[data-top-days]`).forEach(e=>e.setAttribute(`aria-pressed`,String(e===t))),h.innerHTML=`<div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div>`,a.refresh())})})}let g=r(`heatmap`);g&&y(()=>n(`heatmap?days=7`,t),3e5,e=>A(g,e),i(g));let _=r(`health`);_&&y(()=>n(`health?hours=24`,t),6e4,e=>M(_,e),i(_));let C=r(`alerts`);C&&y(()=>n(`alerts?limit=12`,t),6e4,e=>N(C,e),i(C));let T=r(`rne-stats`);T&&y(()=>n(`rne-stats`,t),3e5,e=>P(T,e),i(T));let E=r(`rne-report`);E&&y(()=>n(`rne-last-report`,t),3e5,t=>F(e,E,t),i(E)),window.setInterval(()=>{document.visibilityState!==`hidden`&&(c(),e.querySelectorAll(`[data-rel]`).forEach(e=>{let t=Number(e.dataset.rel);t&&(e.textContent=o(t))}))},1e3)}I();try{let e=document.getElementById(`petra-dashboard`)?.getAttribute(`data-tg`)||`734`,t={734:`TG 734 Venezuela`,73452:`TG 73452 Emergencias y Eventos`,73473:`TG 73473 Radio Club Venezolano`,73411:`TG 73411 Red Venezolana de Radioaficionados`}[e]||`TG ${e}`;fetch(`/api/analytics.php?action=track`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({event_type:`page_view`,event_category:`petra_view`,entity_id:e,entity_title:t}),keepalive:!0}).catch(()=>{})}catch{}