import{t as e}from"./callsign-country.CaNU7VBD.js";var t=document.getElementById(`radioid-search-input`),n=document.getElementById(`search-clear-btn`),r=document.getElementById(`radioid-search-form`),i=document.getElementById(`radioid-skel`),a=document.getElementById(`radioid-results-container`),o=document.getElementById(`radioid-initial-state`),s=document.getElementById(`radioid-notfound-state`),c=document.getElementById(`notfound-message`),l=document.getElementById(`radioid-error-state`),u=document.getElementById(`error-message`),d=document.getElementById(`btn-retry-search`),f,p=null,m=``;function h(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function g(e){i&&(i.style.display=e===`loading`?`block`:`none`),o&&(o.style.display=e===`initial`?`block`:`none`),s&&(s.style.display=e===`notfound`?`block`:`none`),l&&(l.style.display=e===`error`?`block`:`none`),a&&(a.style.display=e===`results`?`block`:`none`)}function _(e){if(!e)return`Sin registro reciente`;let t=new Date(e).getTime();if(Number.isNaN(t))return e;let n=Math.floor((Date.now()-t)/1e3);if(n<60)return`Hace unos segundos`;let r=Math.floor(n/60);if(r<60)return`Hace ${r} min`;let i=Math.floor(r/60);if(i<24)return`Hace ${i} h`;let a=Math.floor(i/24);if(a===1)return`Ayer`;if(a<30)return`Hace ${a} días`;let o=Math.floor(a/30);return o<12?`Hace ${o} ${o===1?`mes`:`meses`}`:new Date(t).toLocaleDateString(`es-VE`,{day:`2-digit`,month:`short`,year:`numeric`})}function v(e,t){if(!navigator.clipboard){let n=document.createElement(`textarea`);n.value=e,document.body.appendChild(n),n.select(),document.execCommand(`copy`),document.body.removeChild(n),y(t);return}navigator.clipboard.writeText(e).then(()=>{y(t)}).catch(()=>{})}function y(e){let t=e.innerHTML;e.classList.add(`is-copied`),e.innerHTML=`
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>¡Copiado!</span>
    `,setTimeout(()=>{e.classList.remove(`is-copied`),e.innerHTML=t},1800)}function b(t){let n=(t.callsign||``).trim().toUpperCase(),r=t.id||t.radio_id||``,i=[t.fname,t.surname].filter(Boolean).join(` `)||t.name||`Operador DMR`,a=t.city||``,o=t.state||``,s=t.country||`Venezuela`,c=[a,o,s].filter(Boolean).join(`, `)||`Ubicación no especificada`,l=e(n)||(s.toLowerCase().includes(`venezuela`)?`ve`:null),u=l?`<span class="fi fi-${h(l)} result-flag-wrap" role="img" aria-label="${h(s)}"></span>`:`<span class="result-flag-wrap" style="background:#E2E8F0; display:flex; align-items:center; justify-content:center; font-weight:800; color:#64748B;">DMR</span>`,d=String(t.account_validation_status||``).toLowerCase()===`validated`?`<span class="badge-status-validated"><span class="badge-status-dot"></span>Cuenta Validada</span>`:`<span class="badge-status-pending"><span class="badge-status-dot"></span>Validación Pendiente</span>`,f=_(t.lastheard),p=t.lastheard?new Date(t.lastheard).toLocaleString(`es-VE`):``,m=t.lastmaster?`Master ${h(t.lastmaster)}`:`No disponible`,g=t.lasttg?`TG ${h(t.lasttg)}`:`Ninguno`,v=t.lastsource||(r?`${r}01`:`Directo`),y=[`734`,`73452`,`73473`,`73411`].includes(String(t.lasttg||``))?`<a href="/petra/${encodeURIComponent(t.lasttg)}" class="telemetry-val telemetry-val--highlight" title="Ver actividad en Petra">${g} ↗</a>`:`<span class="telemetry-val">${g}</span>`;return`
      <article class="radioid-result-card" data-callsign="${h(n)}" data-id="${h(r)}">
        <header class="result-card-header">
          <div class="result-operator-meta">
            ${u}
            <div>
              <div class="result-callsign-title">
                <a href="https://www.qrz.com/db/${encodeURIComponent(n)}" target="_blank" rel="noopener noreferrer" title="Ver en QRZ.com">
                  ${h(n)}
                </a>
              </div>
              <div class="result-name-text">${h(i)}</div>
            </div>
          </div>

          <div class="result-header-badges">
            ${d}
            <div class="result-dmrid-box">
              <span class="dmrid-label">DMR ID</span>
              <span class="dmrid-value">${h(r)}</span>
              <button type="button" class="btn-copy-id js-copy-id" data-copy="${h(r)}" title="Copiar ID al portapapeles">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </header>

        <div class="result-card-body">
          <div class="result-location-row">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${h(c)}</span>
          </div>

          <div class="result-telemetry-grid">
            <div class="telemetry-item">
              <div class="telemetry-label">Último Escuchado</div>
              <div class="telemetry-val">${h(f)}</div>
              ${p?`<div class="telemetry-sub" title="${h(p)}">${h(p)}</div>`:``}
            </div>

            <div class="telemetry-item">
              <div class="telemetry-label">Servidor Máster</div>
              <div class="telemetry-val">${m}</div>
              <div class="telemetry-sub">Red BrandMeister DMR</div>
            </div>

            <div class="telemetry-item">
              <div class="telemetry-label">Último Talkgroup</div>
              ${y}
              <div class="telemetry-sub">Canal de transmisión</div>
            </div>

            <div class="telemetry-item">
              <div class="telemetry-label">Fuente / ESSID</div>
              <div class="telemetry-val">${h(v)}</div>
              <div class="telemetry-sub">Dispositivo emisor</div>
            </div>
          </div>

          <div class="result-actions-bar">
            <a href="https://www.qrz.com/db/${encodeURIComponent(n)}" target="_blank" rel="noopener noreferrer" class="btn-ext">
              <span>QRZ.com ↗</span>
            </a>
            <a href="https://brandmeister.network/#/profile/${encodeURIComponent(n||r)}" target="_blank" rel="noopener noreferrer" class="btn-ext">
              <span>Perfil BrandMeister ↗</span>
            </a>
            <a href="https://radioid.net/database/view?callsign=${encodeURIComponent(n||r)}" target="_blank" rel="noopener noreferrer" class="btn-ext">
              <span>Ficha RadioID.net ↗</span>
            </a>
          </div>
        </div>
      </article>
    `}var x={734013:{tx:`146.7000`,rx:`146.1000`,offset:`-0.600 MHz`,color_code:1,callsign:`YV4EGG`,city:`Valencia`,state:`Carabobo`,trustee:[`YV4EGG`,`YV5VE`],coverage:`BrandMeister DMR (Master 7301)`,description:`Repetidor DMR, Red Brandmeister VHF 146.700 -600 cc1 (TS 1: TG 734, TS 2: TG 73452). Cerro El Café, Valencia, Edo. Carabobo.`},734014:{tx:`439.6000`,rx:`434.6000`,offset:`-5.000 MHz`,color_code:1,callsign:`YV5VE`,city:`Caracas`,state:`Distrito Capital`,trustee:[`YV5VE`,`YY5EHT`],coverage:`BrandMeister DMR (Master 7301)`,description:`Repetidor DMR BrandMeister UHF Caracas 439.600 -5000 CC1.`},734009:{tx:`147.3900`,rx:`147.9900`,offset:`+0.600 MHz`,color_code:1,callsign:`YV5VE`,city:`Altagracia de Orituco`,state:`Guárico`,trustee:[`YV5VE`],coverage:`BrandMeister DMR (Master 7301)`,description:`Altagracia de Orituco, Guárico frecuencia 147.390 +600 CC1.`},734016:{tx:`147.1500`,rx:`147.7500`,offset:`+0.600 MHz`,color_code:1,callsign:`YV5CBO`,city:`La Guaira`,state:`La Guaira`,trustee:[`YV5CBO`,`YV5VE`],coverage:`BrandMeister DMR (Master 7301)`,description:`Repetidor Ubicado en el Waraira Repano (El Ávila), La Guaira.`},734015:{tx:`439.6000`,rx:`434.6000`,offset:`-5.000 MHz`,color_code:1,callsign:`YV1GDQ`,city:`Ciudad Ojeda`,state:`Zulia`,trustee:[`YV1GDQ`],coverage:`BrandMeister DMR (Master 7301)`,description:`Frecuencia 439.600 -5000 CC1. Ciudad Ojeda, Edo. Zulia.`}};function S(e){let t=(e.callsign||``).trim().toUpperCase(),n=String(e.locator||e.id||e.radio_id||``),r=x[n]||(t?Object.values(x).find(e=>e.callsign===t):null);r&&(e.tx=e.tx||r.tx,e.rx=e.rx||r.rx,e.offset=r.offset,e.frequency=r.tx,r.color_code!==void 0&&e.color_code===void 0&&(e.color_code=r.color_code),r.trustee&&(!e.trustee||e.trustee===`No especificado`)&&(e.trustee=r.trustee),r.description&&!e.description&&(e.description=r.description),r.coverage&&(!e.coverage||e.coverage===`BrandMeister`||e.coverage===`Peer`)&&(e.coverage=r.coverage),r.city&&!e.city&&(e.city=r.city));let i=[e.city||``,e.state||``,e.country||`Venezuela`].filter(Boolean).join(`, `),a=e.tx||e.frequency,o=e.rx,s=a?parseFloat(a):null,c=o?parseFloat(o):null,l=`No indicada`,u=``,d=e.offset||``,f=!1;if(s!==null&&!isNaN(s)&&(l=`${s.toFixed(4)} MHz`),c!==null&&!isNaN(c)&&(u=`${c.toFixed(4)} MHz`),s!==null&&c!==null&&!isNaN(s)&&!isNaN(c)){let e=c-s;f=Math.abs(e)>1e-4,d=f?`${e>0?`+`:``}${e.toFixed(3)} MHz`:`Simplex`}else d||=`Simplex`;let p=u?`RX: ${h(u)} • Shift: ${h(d)}`:`Offset: ${h(d)}`,m=`CC${e.color_code===void 0?e.colorcode===void 0?1:e.colorcode:e.color_code}`,g=f?`Duplex (RPT)`:`Simplex`,_=e.status===`on-air`?`Activo en el aire`:e.status||`Activo en BrandMeister`,v=`No especificado`;Array.isArray(e.trustee)&&e.trustee.length?v=e.trustee.join(`, `):e.trustee?v=String(e.trustee):t&&(v=t);let y=e.coverage||(e.bm_device?.lastKnownMaster?`Master ${e.bm_device.lastKnownMaster}`:`BrandMeister DMR`),b=e.status||`Interconexión digital`,S=e.description||e.bm_device?.description||``,C=`https://brandmeister.network/#/device/${encodeURIComponent(n)}`;return`
      <article class="radioid-result-card" data-callsign="${h(t)}" data-id="${h(n)}">
        <header class="result-card-header">
          <div class="result-operator-meta">
            <div class="result-flag-wrap" style="background:#4338CA; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem;">RPT</div>
            <div>
              <div class="result-callsign-title">
                <span>${h(t)}</span>
                <span class="result-repeater-badge">Repetidor DMR</span>
              </div>
              <div class="result-name-text">Repetidor / Estación de Enlace Fija</div>
            </div>
          </div>

          <div class="result-header-badges">
            <span class="badge-status-validated"><span class="badge-status-dot"></span>${h(_)}</span>
            <div class="result-dmrid-box">
              <span class="dmrid-label">ID Repetidor</span>
              <span class="dmrid-value">${h(n)}</span>
              <button type="button" class="btn-copy-id js-copy-id" data-copy="${h(n)}" title="Copiar ID al portapapeles">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </header>

        <div class="result-card-body">
          <div class="result-location-row">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${h(i)}</span>
          </div>

          <div class="result-telemetry-grid">
            <div class="telemetry-item">
              <div class="telemetry-label">Frecuencia TX (Salida)</div>
              <div class="telemetry-val">${h(l)}</div>
              <div class="telemetry-sub">${p}</div>
            </div>

            <div class="telemetry-item">
              <div class="telemetry-label">Código de Color</div>
              <div class="telemetry-val">${h(m)}</div>
              <div class="telemetry-sub">Slot 1 y Slot 2 • ${h(g)}</div>
            </div>

            <div class="telemetry-item">
              <div class="telemetry-label">Administrador / Trustee</div>
              <div class="telemetry-val">${h(v)}</div>
              <div class="telemetry-sub">Responsable técnico</div>
            </div>

            <div class="telemetry-item">
              <div class="telemetry-label">Red y Cobertura</div>
              <div class="telemetry-val">${h(y)}</div>
              <div class="telemetry-sub">${h(b)}</div>
            </div>
          </div>

          ${S?`
            <div class="result-repeater-note">
              <div class="result-repeater-note-title">Información técnica en BrandMeister Network</div>
              <div class="result-repeater-note-body">${h(S)}</div>
            </div>
          `:``}

          <div class="result-actions-bar">
            <a href="/repetidores" class="btn-ext">
              <span>Directorio de Repetidores ↗</span>
            </a>
            <a href="${C}" target="_blank" rel="noopener noreferrer" class="btn-ext">
              <span>Ficha en BrandMeister ↗</span>
            </a>
          </div>
        </div>
      </article>
    `}var C=0,w=``;function T(e,t){window.clearTimeout(C),!(e.length<3)&&(C=window.setTimeout(()=>{e===m&&e!==w&&(w=e,fetch(`/api/analytics.php?action=track`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({event_type:`callsign_lookup`,event_category:t?`encontrado`:`no_encontrado`,entity_id:e}),keepalive:!0}).catch(()=>{}))},2e3))}async function E(e,t=!0){let n=e.trim().toUpperCase();if(!n){if(window.clearTimeout(C),g(`initial`),a&&(a.innerHTML=``),t){let e=new URL(window.location.href);e.searchParams.delete(`q`),window.history.replaceState({},``,e.toString())}return}if(n!==m){if(m=n,window.clearTimeout(C),t){let e=new URL(window.location.href);e.searchParams.set(`q`,n),window.history.replaceState({},``,e.toString())}p?.abort(),p=new AbortController,g(`loading`);try{let e=/^\d+$/.test(n),t=e?`id=${encodeURIComponent(n)}`:`callsign=${encodeURIComponent(n)}`,r=null;try{let e=await fetch(`/api/radioid.php?q=${encodeURIComponent(n)}&_t=${Date.now()}`,{headers:{accept:`application/json`,"cache-control":`no-cache, no-store, must-revalidate`,pragma:`no-cache`},signal:p.signal});e.ok&&(r=await e.json())}catch(e){if(e.name===`AbortError`)return}if(!r)try{let e=await fetch(`/api/radioid/user/?${t}`,{headers:{accept:`application/json`},signal:p.signal});if(e.ok&&(r=await e.json(),r&&(!r.results||!r.results.length))){let e=await fetch(`/api/radioid/repeater/?${t}`,{headers:{accept:`application/json`},signal:p.signal});if(e.ok){let t=await e.json();t&&t.results&&t.results.length&&(t.results.forEach(e=>{e._entity_type=`repeater`}),r=t)}}}catch(e){if(e.name===`AbortError`)return}if(!r)throw Error(`No se pudo obtener respuesta del servidor`);let i=Array.isArray(r.results)?r.results:[];if(!i.length&&e)try{let e=await fetch(`https://api.brandmeister.network/v2/device/${encodeURIComponent(n)}`,{signal:p.signal});if(e.ok){let t=await e.json();if(t&&t.id){let e=t.tx?parseFloat(t.tx):0,n=t.rx?parseFloat(t.rx):0,r=e>0&&n>0?n-e:0,a=Math.abs(r)<1e-4?`Simplex`:`${r>0?`+`:``}${r.toFixed(3)} MHz`,o=Array.isArray(t.permissions)&&t.permissions.length?[...new Set(t.permissions.map(e=>e.username).filter(Boolean))]:[t.callsign||``];i=[{id:String(t.id),locator:String(t.id),callsign:t.callsign||``,city:t.city||``,state:``,country:`Venezuela`,frequency:t.tx||``,tx:t.tx,rx:t.rx,offset:a,color_code:t.colorcode??1,status:t.statusText||`Both Slots Linked`,coverage:`BrandMeister DMR${t.lastKnownMaster?` (Master ${t.lastKnownMaster})`:``}`,trustee:o,hardware:t.hardware||t.linkname,linkname:t.linkname,description:t.description,_entity_type:`repeater`,bm_device:t}]}}}catch{}if(!i.length){c&&(c.innerHTML=`No se encontró ningún registro activo para <strong>${h(n)}</strong> en RadioID.net ni en BrandMeister Network.`),g(`notfound`),T(n,!1);return}for(let e of i)if(e._entity_type===`repeater`||e.locator){let t=e.locator||e.id||e.radio_id;if(t&&(!e.tx||!e.rx))try{let n=await fetch(`https://api.brandmeister.network/v2/device/${encodeURIComponent(t)}`,{signal:p.signal});if(n.ok){let t=await n.json();t&&t.id&&(e.tx=t.tx,e.rx=t.rx,e.frequency=t.tx||e.frequency,e.color_code=t.colorcode??e.color_code,e.status=t.statusText||e.status,t.lastKnownMaster&&(e.coverage=`BrandMeister DMR (Master ${t.lastKnownMaster})`),t.description&&(e.description=t.description),Array.isArray(t.permissions)&&t.permissions.length&&(e.trustee=[...new Set(t.permissions.map(e=>e.username).filter(Boolean))]),e.bm_device=t)}}catch{}}a&&(a.innerHTML=i.map(e=>e._entity_type===`repeater`||e.locator?S(e):b(e)).join(``),a.querySelectorAll(`.js-copy-id`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.dataset.copy||``;n&&v(n,e)})})),g(`results`),T(n,!0)}catch(e){if(e.name===`AbortError`)return;u&&(u.textContent=`No pudimos conectar con los servidores de RadioID.net. Intente nuevamente en unos instantes.`),g(`error`)}}}t&&(t.addEventListener(`input`,()=>{let e=t.value.trim();if(n&&n.classList.toggle(`is-visible`,!!e),window.clearTimeout(f),!e){E(``);return}f=window.setTimeout(()=>{E(e)},400)}),t.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),window.clearTimeout(f),E(t.value))})),n&&n.addEventListener(`click`,()=>{t&&(t.value=``,t.focus()),n.classList.remove(`is-visible`),E(``)}),r&&r.addEventListener(`submit`,e=>{e.preventDefault(),t&&(window.clearTimeout(f),E(t.value))}),document.querySelectorAll(`[data-query]`).forEach(e=>{e.addEventListener(`click`,()=>{let r=e.dataset.query||``;t&&(t.value=r,n&&n.classList.add(`is-visible`),t.focus()),E(r)})}),d&&d.addEventListener(`click`,()=>{t&&E(t.value)});var D=new URLSearchParams(window.location.search),O=D.get(`q`)||D.get(`callsign`)||D.get(`id`)||``;O&&t&&(t.value=O,n&&n.classList.add(`is-visible`),E(O,!1));