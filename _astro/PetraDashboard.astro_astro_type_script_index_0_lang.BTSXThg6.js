var e={YV:`ve`,YX:`ve`,YY:`ve`,AA:`us`,AB:`us`,AC:`us`,AD:`us`,AE:`us`,AF:`us`,AG:`us`,AH:`us`,AI:`us`,AJ:`us`,AK:`us`,AL:`us`,K:`us`,N:`us`,W:`us`,VA:`ca`,VB:`ca`,VC:`ca`,VD:`ca`,VE:`ca`,VF:`ca`,VG:`ca`,VY:`ca`,CF:`ca`,CG:`ca`,CH:`ca`,CI:`ca`,CJ:`ca`,CK:`ca`,VX:`ca`,XA:`mx`,XB:`mx`,XC:`mx`,XD:`mx`,XE:`mx`,XF:`mx`,PP:`br`,PQ:`br`,PR:`br`,PS:`br`,PT:`br`,PU:`br`,PV:`br`,PW:`br`,PX:`br`,PY:`br`,LO:`ar`,LP:`ar`,LQ:`ar`,LR:`ar`,LS:`ar`,LT:`ar`,LU:`ar`,LV:`ar`,LW:`ar`,HJ:`co`,HK:`co`,CA:`cl`,CB:`cl`,CC:`cl`,CD:`cl`,CE:`cl`,XQ:`cl`,XR:`cl`,OA:`pe`,OB:`pe`,OC:`pe`,CP:`bo`,HC:`ec`,HD:`ec`,ZP:`py`,CV:`uy`,CX:`uy`,CL:`cu`,CM:`cu`,CN:`cu`,CO:`cu`,T4:`cu`,HI:`do`,HP:`pa`,TE:`cr`,TI:`cr`,TG:`gt`,HR:`hn`,YS:`sv`,YN:`ni`,V3:`bz`,HH:`ht`,EA:`es`,EB:`es`,EC:`es`,ED:`es`,EE:`es`,EF:`es`,EG:`es`,EH:`es`,AM:`es`,AN:`es`,AO:`es`,CR:`pt`,CS:`pt`,CT:`pt`,CU:`pt`,F:`fr`,DA:`de`,DB:`de`,DC:`de`,DD:`de`,DE:`de`,DF:`de`,DG:`de`,DH:`de`,DI:`de`,DJ:`de`,DK:`de`,DL:`de`,DM:`de`,DN:`de`,DO:`de`,DP:`de`,DQ:`de`,DR:`de`,G:`gb`,M:`gb`,I:`it`,PA:`nl`,PB:`nl`,PC:`nl`,PD:`nl`,PE:`nl`,PF:`nl`,PG:`nl`,PH:`nl`,PI:`nl`,ON:`be`,OO:`be`,HB:`ch`,HE:`ch`,OE:`at`,SA:`se`,SB:`se`,SC:`se`,SD:`se`,SE:`se`,SF:`se`,SG:`se`,SH:`se`,SI:`se`,SJ:`se`,SK:`se`,SL:`se`,SM:`se`,LA:`no`,LB:`no`,LC:`no`,LD:`no`,LE:`no`,LF:`no`,LG:`no`,LH:`no`,LI:`no`,LJ:`no`,LK:`no`,LL:`no`,LM:`no`,LN:`no`,OZ:`dk`,OU:`dk`,OV:`dk`,OW:`dk`,OF:`fi`,OG:`fi`,OH:`fi`,OI:`fi`,OJ:`fi`,RA:`ru`,RB:`ru`,RC:`ru`,RD:`ru`,RE:`ru`,RF:`ru`,RG:`ru`,RH:`ru`,RI:`ru`,RJ:`ru`,RK:`ru`,RL:`ru`,RM:`ru`,RN:`ru`,RO:`ru`,RP:`ru`,RQ:`ru`,RR:`ru`,RS:`ru`,RT:`ru`,RU:`ru`,RV:`ru`,RW:`ru`,RX:`ru`,RY:`ru`,RZ:`ru`,UA:`ru`,UB:`ru`,UC:`ru`,UD:`ru`,UE:`ru`,UF:`ru`,UG:`ru`,UH:`ru`,UI:`ru`,JA:`jp`,JB:`jp`,JC:`jp`,JD:`jp`,JE:`jp`,JF:`jp`,JG:`jp`,JH:`jp`,JI:`jp`,JJ:`jp`,JK:`jp`,JL:`jp`,JM:`jp`,JN:`jp`,JO:`jp`,JP:`jp`,JQ:`jp`,JR:`jp`,JS:`jp`,BA:`cn`,BB:`cn`,BC:`cn`,BD:`cn`,BE:`cn`,BF:`cn`,BG:`cn`,BH:`cn`,BI:`cn`,BJ:`cn`,BK:`cn`,BL:`cn`,BM:`cn`,BN:`cn`,BO:`cn`,BP:`cn`,BQ:`cn`,BR:`cn`,BS:`cn`,BT:`cn`,BU:`cn`,BV:`tw`,DS:`kr`,DT:`kr`,HL:`kr`,VH:`au`,VI:`au`,VJ:`au`,VK:`au`,VL:`au`,VM:`au`,VN:`au`,AX:`au`,ZK:`nz`,ZL:`nz`,ZM:`nz`,ZR:`za`,ZS:`za`,ZT:`za`,ZU:`za`,AT:`in`,AU:`in`,AV:`in`,AW:`in`,VU:`in`,VV:`in`,VW:`in`};function t(t){if(!t)return null;let n=t.toUpperCase().trim();for(let t=4;t>=1;t--){let r=n.slice(0,t);if(e[r])return e[r]}return null}var n=[`live`,`summary`,`hourly`,`calendar`,`top`,`recent`,`heatmap`];[...n],[...n],[...n],[...n];function r(e,t){return`${e}${e.includes(`?`)?`&`:`?`}tg=${encodeURIComponent(t)}`}function i(e){let t=Math.round(e/1e3);if(t<60)return`${t} s`;let n=Math.floor(t/60);return n<60?`${n} min ${String(t%60).padStart(2,`0`)} s`:`${Math.floor(n/60)} h ${String(n%60).padStart(2,`0`)} min`}function a(e){let t=Math.round(e/6e4);return t<1?{value:String(Math.round(e/1e3)),unit:`s`}:t<60?{value:String(t),unit:`min`}:{value:`${Math.floor(t/60)}:${String(t%60).padStart(2,`0`)}`,unit:`h`}}function o(e){let t=new Date(e);return`${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}function s(e,t=Date.now()){let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return`hace ${n} s`;let r=Math.floor(n/60);if(r<60)return`hace ${r} min`;let i=Math.floor(r/60);return i<24?`hace ${i} h`:`hace ${Math.floor(i/24)} d`}function c(e){if(e.kind===`beacon`){let t=e.file.replace(`.wav`,``);return{title:t.length===4?`Baliza horaria · ${t.slice(0,2)}:${t.slice(2)}`:`Baliza horaria`,category:`baliza`}}let t=e.file.replace(/\.wav$/,``).toLowerCase();return t.startsWith(`sismo`)?{title:`Reporte sísmico`,category:`sismo`}:t.startsWith(`inameh`)||t.startsWith(`clima`)?{title:`Boletín meteorológico`,category:`meteo`}:{title:t.replace(/_\d+$/,``).replace(/[_-]+/g,` `)||`Aviso`,category:`aviso`}}function l(e,t){if(e<=0||t<=0)return 0;let n=e/t;return n<.25?1:n<.5?2:n<.8?3:4}var u={activity:`Había conversación`,busy:`TG ocupado toda la ventana`,missing:`Falta el audio de esa hora`},d=`/api/petra/`,f=`<p class="pt-error">No se pudo consultar la API</p>`,p=[`dom`,`lun`,`mar`,`mié`,`jue`,`vie`,`sáb`],m=[`ene`,`feb`,`mar`,`abr`,`may`,`jun`,`jul`,`ago`,`sep`,`oct`,`nov`,`dic`];function h(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function g(e){let t=Number(e);return Number.isFinite(t)?t:0}function _(e,n,r){let i=(e||``).trim(),a=i?t(i):null;return`<span class="pt-op">${a?`<span class="fi fi-${h(a)} pt-flag" role="img" aria-label="${h(a.toUpperCase())}"></span>`:``}${i?`<a class="pt-call" href="https://www.qrz.com/db/${encodeURIComponent(i)}" target="_blank" rel="noopener noreferrer" title="Ver ${h(i)} en QRZ.com">${h(i)}</a>`:`<span class="pt-call">${h(r)}</span>`}${n?`<span class="pt-name">${h(n)}</span>`:``}</span>`}function v(e){return`<span data-rel="${g(e)}">${h(s(g(e)))}</span>`}function y(e,t){return e.querySelector(`[data-petra-slot="${t}"]`)}function b(e,t,n,r){let i,a=!1,o=null,s=!0,c=async()=>{if(window.clearTimeout(i),s||document.visibilityState!==`hidden`){s=!1,o?.abort(),o=new AbortController;try{let t=await fetch(d+e(),{headers:{accept:`application/json`},cache:`no-cache`,signal:o.signal});if(!t.ok)throw Error(String(t.status));let r=await t.json();a=!0,n(r)}catch(e){if(e?.name===`AbortError`)return;r(a)}i=window.setTimeout(c,t)}},l=()=>{document.visibilityState===`visible`&&c()};return document.addEventListener(`visibilitychange`,l),c(),{refresh:()=>{a=!1,c()},stop:()=>{window.clearTimeout(i),o?.abort(),document.removeEventListener(`visibilitychange`,l)}}}function x(e,t){let n=y(e,`link`);if(!n)return;let r=t.link;if(!r){n.innerHTML=`<span class="pt-badge"><span class="pt-dot"></span>Enlace ?</span>`;return}let i=r.state===`up`,a=g(r.drops_24h);n.innerHTML=`
    <span class="pt-badge ${i?`pt-badge--ok`:`pt-badge--bad`}">
      <span class="pt-dot ${i?`pt-dot--ok pt-dot--pulse`:`pt-dot--bad`}"></span>${i?`Enlace activo`:`Enlace caído`}
    </span>
    <span class="pt-note">Uptime 24 h <strong>${h(g(r.uptime_24h))}%</strong> · ${a} ${a===1?`caída`:`caídas`}</span>
    ${r.host?`<span class="pt-note pt-host">${h(r.host)}</span>`:``}
  `}function S(e,t){let n=t.last_heard;if(!n){e.innerHTML=`<p class="pt-empty">Sin actividad registrada todavía</p>`;return}let r=n.open?`<span class="pt-onair"><span class="pt-dot pt-dot--bad pt-dot--pulse"></span>Al aire</span>`:`<span class="pt-lh__dur">${h(i(g(n.dur_ms)))}</span><span class="pt-note">${v(n.at)}</span>`;e.innerHTML=`
    <div class="pt-lh">
      <div class="pt-lh__who">
        ${_(n.callsign,``,n.src_id)}
        <div class="pt-lh__sub">
          ${n.name?`<span class="pt-name">${h(n.name)}</span><span aria-hidden="true">·</span>`:``}
          <span class="pt-id">ID ${h(n.src_id)}</span>
        </div>
      </div>
      <div class="pt-lh__meta">${r}</div>
    </div>
  `}function C(e,t){let n=t.today,r=t.yesterday,o=g(n.count)-g(r.count),s=a(g(n.air_ms)),c=(e,t,n,r=``,i=``)=>`
    <div class="pt-tile">
      <div class="pt-tile__label">${h(e)}</div>
      <div class="pt-tile__value">${h(t)}${r?`<span class="pt-tile__unit">${h(r)}</span>`:``}</div>
      <div class="pt-tile__foot ${i}">${h(n)}</div>
    </div>`;e.innerHTML=[c(`Transmisiones hoy`,g(n.count).toLocaleString(`es-VE`),o===0?`Igual que ayer`:`${o>0?`+`:``}${o} vs ayer a esta hora`,``,o>0?`is-up`:o<0?`is-down`:``),c(`Tiempo al aire`,s.value,g(n.count)>0?`Media ${i(g(n.avg_ms))}`:`Sin tráfico`,s.unit),c(`Operadores hoy`,String(g(n.uniq_ops)),`${g(t.ops_7d)} en 7 días`),c(`La más larga`,g(n.longest_s)>0?i(g(n.longest_s)*1e3):`—`,g(n.alerts)===1?`1 aviso al aire`:`${g(n.alerts)} avisos al aire`)].join(``)}function w(e,t,n=``){let r=Math.max(...e.map(e=>e.value),1);return`
    <div class="pt-bars ${n}" role="img" aria-label="${h(t)}">
      ${e.map(e=>{let t=e.value>0?Math.max(3,e.value/r*100):2;return`<div class="pt-bar pt-heat-${l(e.value,r)}" style="height:${t.toFixed(1)}%"><span class="pt-tip">${h(e.title)}</span></div>`}).join(``)}
    </div>`}function T(e,t,n){let r=Array.isArray(n)&&n.length?n.map(g):Array(24).fill(0),a=Math.max(...r,0),o=y(e,`hourly-note`);o&&(o.textContent=a>0?`Pico ${i(a)}`:`Sin tráfico hoy`),t.innerHTML=`
    ${w(r.map((e,t)=>({value:e,title:`${String(t).padStart(2,`0`)}:00 · ${e>0?i(e):`sin tráfico`}`})),`Tiempo al aire por hora del día de hoy`)}
    <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
  `}function E(e,t,n){if(e.length===0)return[];let r=Math.max(1,Math.round((e.length-1)/(t-1))),i=[];for(let t=0;t<e.length;t+=r)i.push(n(e[t],t));let a=n(e[e.length-1],e.length-1);return i[i.length-1]!==a&&i.push(a),i}function D(e,t){let n=m[Number(e.slice(5,7))-1]??e;return t&&t.slice(0,4)===e.slice(0,4)?n:`${n} ${e.slice(2,4)}`}function O(e,t,n){let r=Array.isArray(n.days)?n.days:[],a=Array.isArray(n.months)?n.months:[],o=r.reduce((e,t)=>e+g(t.air_s),0),s=y(e,`calendar-note`);s&&(s.textContent=`${i(o*1e3)} en 30 días`);let c=(e,t)=>`${t} · ${g(e.air_s)>0?`${i(g(e.air_s)*1e3)} en ${g(e.n)} transmisiones`:`sin tráfico`}`,l=e=>`${e.slice(8,10)}/${e.slice(5,7)}`;t.innerHTML=`
    <div class="pt-cal">
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 30 días</p>
        ${w(r.map(e=>({value:g(e.air_s),title:c(e,l(e.label))})),`Tiempo al aire por día en los últimos 30 días`)}
        <div class="pt-axis">${E(r,4,e=>l(e.label)).map(e=>`<span>${h(e)}</span>`).join(``)}</div>
      </div>
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 12 meses</p>
        ${w(a.map((e,t)=>({value:g(e.air_s),title:c(e,D(e.label,a[t-1]?.label))})),`Tiempo al aire por mes en los últimos 12 meses`,`pt-bars--wide`)}
        <div class="pt-axis">${E(a,4,(e,t)=>D(e.label,a[t-1]?.label)).map(e=>`<span>${h(e)}</span>`).join(``)}</div>
      </div>
    </div>
  `}function k(e,t){if(!Array.isArray(t)||t.length===0){e.innerHTML=`<p class="pt-empty">Sin actividad en el periodo</p>`;return}let n=g(t[0].air_ms)||1;e.innerHTML=`
    <ol class="pt-rank">
      ${t.map((e,t)=>{let r=Math.max(2,Math.min(100,g(e.air_ms)/n*100));return`
            <li class="pt-rank__row">
              <span class="pt-rank__pos ${t<3?`is-podium is-${t+1}`:``}">${t+1}</span>
              <div class="pt-rank__main">
                <div class="pt-row">
                  ${_(e.callsign,e.name,e.id)}
                  <span class="pt-row__val">${h(i(g(e.air_ms)))}</span>
                </div>
                <div class="pt-meter"><span style="width:${r.toFixed(1)}%"></span></div>
              </div>
            </li>`}).join(``)}
    </ol>
  `}function A(e,t){let n=Array.isArray(t.recent)?t.recent:[];if(n.length===0){e.innerHTML=`<p class="pt-empty">Sin registros</p>`;return}e.innerHTML=`
    <ul class="pt-list">
      ${n.map(e=>`
          <li class="pt-row">
            ${_(e.callsign,e.name,e.src_id)}
            <span class="pt-row__val">
              <span class="pt-clock">${h(o(g(e.at)))}</span>
              ${e.open?`<span class="pt-onair pt-onair--sm">Al aire</span>`:`<span>${h(i(g(e.dur_ms)))}</span>`}
            </span>
          </li>`).join(``)}
    </ul>
  `}function j(e,t){let n=Array.isArray(t)?t:[],r=n.reduce((e,t)=>Math.max(e,...(t.hours??[]).map(g)),0);e.innerHTML=`
    <div class="pt-heat" role="img" aria-label="Segundos al aire por hora en los últimos 7 días">
      ${n.map(e=>{let t=p[new Date(`${e.day}T12:00:00`).getDay()]??e.day,n=(e.hours??[]).map((n,a)=>{let o=`${t} ${e.day.slice(8,10)}/${e.day.slice(5,7)} · ${String(a).padStart(2,`0`)}:00 · ${g(n)>0?i(g(n)*1e3):`sin tráfico`}`;return`<span class="pt-heat__cell pt-heat-${l(g(n),r)}" title="${h(o)}"></span>`}).join(``);return`<div class="pt-heat__row"><span class="pt-heat__day">${h(t)}</span><div class="pt-heat__cells">${n}</div></div>`}).join(``)}
      <div class="pt-heat__row pt-heat__row--axis">
        <span class="pt-heat__day"></span>
        <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
      </div>
    </div>
  `}function M(e,t,n){return`<li class="pt-feed__item pt-feed__item--${e}"><div class="pt-feed__t">${h(t)}</div><div class="pt-feed__m">${n}</div></li>`}function N(e,t){let n=Object.entries(t.beacons_skipped??{}).map(([e,t])=>[e,g(t)]),r=n.reduce((e,[,t])=>e+t,0),i=g(t.beacons_sent),a=g(t.errors)>0||g(t.beacons_skipped?.missing)>0,o=g(t.alerts_sent)-g(t.alerts_seismic)-g(t.alerts_meteo),s=[];g(t.alerts_seismic)>0&&s.push(M(`alert`,`${g(t.alerts_seismic)} boletines sísmicos`,`FUNVISIS, llegados por la cola`)),g(t.alerts_meteo)>0&&s.push(M(`alert`,`${g(t.alerts_meteo)} boletines meteorológicos`,`INAMEH, llegados por la cola`)),o>0&&s.push(M(`alert`,`${o} otros avisos`,`Llegados por la cola, sin origen identificado`));for(let[e,t]of n)s.push(M(e===`missing`?`error`:`beacon`,`${t} ${t===1?`baliza omitida`:`balizas omitidas`}`,h(u[e]??e)));g(t.errors)>0&&s.push(M(`error`,`${g(t.errors)} errores de audio`,`Un WAV de la cola no se pudo transmitir`)),e.innerHTML=`
    <div class="pt-row pt-health__head">
      <span class="pt-badge ${a?`pt-badge--bad`:`pt-badge--ok`}">
        <span class="pt-dot ${a?`pt-dot--bad`:`pt-dot--ok`}"></span>${a?`Requiere atención`:`Operando`}
      </span>
      <span class="pt-row__val"><span><strong>${i}</strong>/${i+r||1} balizas</span></span>
    </div>
    ${s.length?`<ul class="pt-feed">${s.join(``)}</ul>`:``}
    <p class="pt-note pt-health__foot">
      ${g(t.last_beacon_at)>0?`Última baliza ${v(t.last_beacon_at)}`:`Ninguna baliza en la ventana`}
    </p>
  `}function P(e,t){if(!Array.isArray(t)||t.length===0){e.innerHTML=`<p class="pt-empty">Todavía no se ha transmitido nada</p>`;return}e.innerHTML=`
    <ul class="pt-feed pt-feed--compact">
      ${t.map(e=>{let{title:t}=c(e),n=e.error?`error`:e.kind===`beacon`?`beacon`:`alert`,r=e.error?` · falló: ${h(e.error)}`:g(e.dur_ms)>0?` · ${h(i(g(e.dur_ms)))} al aire`:``;return M(n,t,`${h(o(g(e.at)))}${r}`)}).join(``)}
    </ul>
  `}function F(e,t){if(!Array.isArray(t)||t.length===0){e.innerHTML=`<p class="pt-empty">Sin datos en el período</p>`;return}e.innerHTML=`
    <div class="pt-stats">
      ${t.map(e=>`<div class="pt-stat"><span class="pt-stat__label">${h(e.label)}</span><span class="pt-stat__value">${h(g(e.avg))}</span></div>`).join(``)}
    </div>
  `}function I(e,t,n){let r=y(e,`rne-day`);r&&(r.textContent=n.day||``,r.hidden=!n.day);let a=Array.isArray(n.stations)?n.stations:[];if(a.length===0){t.innerHTML=`<p class="pt-empty">Todavía no hay una emisión registrada</p>`;return}t.innerHTML=`
    <ul class="pt-list pt-list--columns">
      ${a.map(e=>`
          <li class="pt-row">
            ${_(e.callsign,e.name,e.id)}
            <span class="pt-row__val">
              <span class="pt-clock">${h(o(g(e.at)))}</span>
              <span>${h(i(g(e.air_ms)))}</span>
            </span>
          </li>`).join(``)}
    </ul>
  `}function L(){let e=document.getElementById(`petra-dashboard`);if(!e)return;let t=e.dataset.tg||`734`,n=t=>e.querySelector(`[data-petra-module="${t}"]`),i=e=>t=>{t||(e.innerHTML=f)},a=0,o=y(e,`updated`),c=()=>{o&&a&&(o.textContent=`Actualizado hace ${Math.round((Date.now()-a)/1e3)} s`)},l=n(`live`),u=n(`recent`);(l||u)&&b(()=>r(`live?limit=10`,t),15e3,t=>{a=Date.now(),c(),x(e,t),l&&S(l,t),u&&A(u,t)},e=>{e||(l&&(l.innerHTML=f),u&&(u.innerHTML=f))});let d=n(`summary`);d&&b(()=>r(`summary`,t),6e4,e=>C(d,e),()=>{});let p=n(`hourly`);p&&b(()=>r(`hourly`,t),6e4,t=>T(e,p,t),i(p));let m=n(`calendar`);m&&b(()=>r(`calendar?days=30&months=12`,t),3e5,t=>O(e,m,t),i(m));let h=n(`top`);if(h){let n=`7`,a=b(()=>r(`top?days=${n}&limit=8`,t),6e4,e=>k(h,e),i(h));e.querySelectorAll(`[data-top-days]`).forEach(t=>{t.addEventListener(`click`,()=>{let r=t.dataset.topDays||`7`;r!==n&&(n=r,e.querySelectorAll(`[data-top-days]`).forEach(e=>e.setAttribute(`aria-pressed`,String(e===t))),h.innerHTML=`<div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div>`,a.refresh())})})}let g=n(`heatmap`);g&&b(()=>r(`heatmap?days=7`,t),3e5,e=>j(g,e),i(g));let _=n(`health`);_&&b(()=>r(`health?hours=24`,t),6e4,e=>N(_,e),i(_));let v=n(`alerts`);v&&b(()=>r(`alerts?limit=12`,t),6e4,e=>P(v,e),i(v));let w=n(`rne-stats`);w&&b(()=>r(`rne-stats`,t),3e5,e=>F(w,e),i(w));let E=n(`rne-report`);E&&b(()=>r(`rne-last-report`,t),3e5,t=>I(e,E,t),i(E)),window.setInterval(()=>{document.visibilityState!==`hidden`&&(c(),e.querySelectorAll(`[data-rel]`).forEach(e=>{let t=Number(e.dataset.rel);t&&(e.textContent=s(t))}))},1e3)}L();try{let e=document.getElementById(`petra-dashboard`)?.getAttribute(`data-tg`)||`734`,t={734:`TG 734 Venezuela`,73452:`TG 73452 Emergencias y Eventos`,73473:`TG 73473 Radio Club Venezolano`,73411:`TG 73411 Red Venezolana de Radiodifusión`}[e]||`TG ${e}`;fetch(`/api/analytics.php?action=track`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({event_type:`page_view`,event_category:`petra_view`,entity_id:e,entity_title:t}),keepalive:!0}).catch(()=>{})}catch{}